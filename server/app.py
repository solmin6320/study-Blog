"""app.py — 로컬 에디터 서버 엔트리. 규약은 docs/api.md, 파일 규칙은 server/posts.py.

역할은 둘뿐이다: (1) 사이트 파일을 정적으로 서빙(허용 목록), (2) 에디터가
내보내던 .md / index.json / categories.json 을 대신 디스크에 쓴다. 인증·DB·세션·git push 없음.

CORS 미들웨어를 붙이지 않는다(api.md §0). PUT·DELETE는 preflight 대상이라 CORS가 없으면 다른 origin의 페이지가
저장 API를 부를 수 없다 — 인증이 없는 이 서버의 유일한 CSRF 방어다. "편의로" 열면 방어가 사라진다.

실행: python -m server.app  (Docker 밖: 127.0.0.1:5500 / Docker 안: BLOG_BIND=0.0.0.0)
"""
from __future__ import annotations

import json
import os
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException as StarletteHTTPException

from server.posts import (
    META_KEYS, PostsError, Repo, build_categories_json, build_index_json,
    build_index_json_without, is_safe_id, normalize_category, normalize_meta, now_iso_kst, parse_frontmatter,
    to_markdown_file, validate_folder_slug, validate_post_payload,
)

SERVER_VERSION = "1.2.0"
ROOT = Path(__file__).resolve().parent.parent
MAX_BODY = 2 * 1024 * 1024
# 정적 서빙 **허용 목록**(v1.2, meeting-08 D25·충돌 9). docs/api.md §1
# 차단 목록이던 v1.1은 새 파일이 기본 노출이라 `.env`를 만드는 순간 `/.env`가 서빙됐다. 이제 목록 밖은 전부 404.
# 첫 경로 조각을 소문자로 접어 비교한다 — `/Server/`·`/.ENV` 같은 대소문자 변형도 목록 밖이면 404.
STATIC_ROOT_FILES = {"index.html", "post.html", "write.html", ".nojekyll", "favicon.ico"}
STATIC_DIRS = {"css", "js", "posts"}

# start.ps1의 MIME 표와 동일. 표에 없으면 application/octet-stream.
MIME = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
    ".woff2": "font/woff2", ".map": "application/json; charset=utf-8",
}

# FastAPI 기본 /docs·/redoc·/openapi.json 은 끈다 — /docs 는 감춰야 하는 폴더 경로와 겹친다.
app = FastAPI(title="blog-editor-server", version=SERVER_VERSION,
              docs_url=None, redoc_url=None, openapi_url=None)
repo = Repo(ROOT)
LOCK = threading.Lock()   # 쓰기 요청 직렬화(단일 프로세스)


# ---------- Host 검사 (DNS 리바인딩 방지) ----------
# 서버는 127.0.0.1에만 묶이지만, 악성 페이지가 자기 도메인을 127.0.0.1로 풀리게 해 두면 브라우저가
# Host: evil.example 로 이 서버에 닿을 수 있다. Host가 로컬 이름이 아니면 무조건 400 — 정적·API 모두.
ALLOWED_HOSTS = {"localhost", "127.0.0.1", "[::1]"}


def host_allowed(host: str | None) -> bool:
    h = (host or "").strip().lower()
    if h.startswith("["):                       # IPv6 리터럴 [::1]:5500
        h = h.split("]")[0] + "]"
    else:
        h = h.rsplit(":", 1)[0] if ":" in h else h
    return h in ALLOWED_HOSTS


@app.middleware("http")
async def check_host(request: Request, call_next):
    if not host_allowed(request.headers.get("host")):
        return error_response(400, "bad_host", "이 서버는 localhost / 127.0.0.1 로만 접근할 수 있습니다.")
    return await call_next(request)


# ---------- 오류 형식 ----------

def error_response(status: int, code: str, message: str, extra: dict | None = None) -> JSONResponse:
    """본문은 항상 {error: {code, message, …extra}}(api.md §3). extra는 code·message를 덮어쓰지 못한다."""
    body: dict = {"code": code, "message": message}
    for key, value in (extra or {}).items():
        body.setdefault(key, value)
    return JSONResponse({"error": body}, status_code=status)


@app.exception_handler(PostsError)
async def on_posts_error(_: Request, exc: PostsError) -> JSONResponse:
    return error_response(exc.status, exc.code, exc.message, exc.extra)


@app.exception_handler(StarletteHTTPException)
async def on_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    if exc.status_code == 404:
        return error_response(404, "not_found", "찾을 수 없습니다.")
    if exc.status_code == 405:
        return error_response(405, "method_not_allowed", "허용되지 않는 메서드입니다.")
    return error_response(exc.status_code, "error", str(exc.detail))


@app.exception_handler(RequestValidationError)
async def on_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    return error_response(400, "bad_request", "요청 형식이 올바르지 않습니다.")


@app.exception_handler(Exception)
async def on_unexpected(_: Request, exc: Exception) -> JSONResponse:
    return error_response(500, "internal", f"서버 내부 오류: {type(exc).__name__}: {exc}")


async def read_json_body(request: Request) -> Any:
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY:
        raise PostsError(413, "too_large", "요청 본문이 2MB를 넘습니다.")
    raw = await request.body()
    if len(raw) > MAX_BODY:
        raise PostsError(413, "too_large", "요청 본문이 2MB를 넘습니다.")
    try:
        return json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as err:
        raise PostsError(400, "bad_request", "요청 본문이 올바른 JSON이 아닙니다.") from err


# ---------- git (헬스 ?git=1 · 자동 커밋 B-1) ----------

GIT_BASE = ["git", "-c", "safe.directory=*", "-c", "core.fileMode=false", "-c", "core.autocrlf=true",
            "--no-optional-locks"]
AUTO_COMMIT = os.environ.get("BLOG_AUTO_COMMIT", "0").strip() == "1"


def run_git(args: list[str], timeout: float = 30) -> subprocess.CompletedProcess:
    return subprocess.run(GIT_BASE + args, cwd=str(ROOT), capture_output=True, text=True, timeout=timeout)


def git_info() -> dict:
    """{branch, dirty}. git이 없거나 실패하면 branch는 .git/HEAD에서 읽고 dirty는 null.
    `git status`는 bind mount에서 수 초가 걸릴 수 있어(M4-1) 헬스 기본 응답에서 뺐다 — `?git=1`일 때만 부른다."""
    branch: str | None = None
    dirty: bool | None = None
    try:
        r = run_git(["rev-parse", "--abbrev-ref", "HEAD"], timeout=10)
        if r.returncode == 0 and r.stdout.strip():
            branch = r.stdout.strip()
        r = run_git(["status", "--porcelain"])
        if r.returncode == 0:
            dirty = bool(r.stdout.strip())
    except (OSError, subprocess.TimeoutExpired):
        pass
    if branch is None:
        head = (Repo.read_text(ROOT / ".git" / "HEAD") or "").strip()
        branch = head[len("ref: refs/heads/"):] if head.startswith("ref: refs/heads/") else (head[:12] or None)
    return {"branch": branch, "dirty": dirty}


def git_identity() -> tuple[str, str] | None:
    """커밋 신원: BLOG_GIT_NAME·BLOG_GIT_EMAIL env → 저장소 config(user.name/user.email) → 없으면 None.
    컨테이너는 호스트의 전역 git config를 보지 못한다. 마운트된 .git/config(저장소 로컬 설정)는 본다."""
    name = os.environ.get("BLOG_GIT_NAME", "").strip()
    email = os.environ.get("BLOG_GIT_EMAIL", "").strip()
    if name and email:
        return name, email
    try:
        if not name:
            r = run_git(["config", "--get", "user.name"], timeout=10)
            name = r.stdout.strip() if r.returncode == 0 else ""
        if not email:
            r = run_git(["config", "--get", "user.email"], timeout=10)
            email = r.stdout.strip() if r.returncode == 0 else ""
    except (OSError, subprocess.TimeoutExpired):
        return None
    return (name, email) if name and email else None


REASON_MAX = 60      # git.reason 상한(meeting-08 D11) — 에디터 상태줄에 그대로 붙는다. 긴 설명은 detail
DETAIL_MAX = 300


def _git_fail(reason: str, detail: str = "") -> dict:
    """{committed: false, reason(≤60자), detail?}. reason은 짧은 명사구, 원인·해결은 detail(api.md §2-1)."""
    out: dict = {"committed": False, "reason": reason[:REASON_MAX]}
    detail = (detail or "").strip()
    if detail:
        out["detail"] = detail[:DETAIL_MAX]
    return out


def _commit_paths(paths: list[str]) -> list[str]:
    """커밋 대상 경로(저장소 기준 posix) 중 git이 알아볼 수 있는 것만 — 디스크에 있거나, 지워졌지만 추적 중인 것.
    추적된 적 없는 파일을 지운 경로를 pathspec에 넣으면 add·commit이 'did not match' 오류로 통째로 실패한다."""
    uniq = list(dict.fromkeys(p for p in paths if p))
    gone = [p for p in uniq if not (ROOT / p).exists()]
    tracked: set[str] = set()
    if gone:
        r = run_git(["ls-files", "-z", "--"] + gone, timeout=10)
        if r.returncode == 0:
            tracked = {x for x in r.stdout.split("\0") if x}
    return [p for p in uniq if (ROOT / p).exists() or p in tracked]


def _known_to_git(spec: list[str]) -> list[str]:
    """add 뒤, index나 HEAD 중 한 곳에라도 있는 경로만 남긴다. 스테이징만 됐다가(이전 커밋 실패) 지워진 파일은
    어디에도 없어서 `commit --only`가 'pathspec did not match'로 통째로 실패한다."""
    known: set[str] = set()
    for args in (["ls-files", "-z", "--"], ["ls-tree", "-r", "-z", "--name-only", "HEAD", "--"]):
        r = run_git(args + spec, timeout=10)
        if r.returncode == 0:
            known |= {x for x in r.stdout.split("\0") if x}
    return [p for p in spec if p in known]


def auto_commit(message: str, paths: list[str]) -> dict:
    """**이번 요청이 쓰거나 지운 파일만** 스테이징해 커밋한다(v1.2, meeting-08 D25). 푸시는 하지 않는다(사용자 결정 1 — 권장안 A).
    v1.1은 `posts/` 전체를 쓸어 담아, 사용자가 손으로 고치던 다른 글까지 "글: 제목" 커밋에 섞였다.
    반환은 api.md §2-1의 `git` 필드 그대로: {committed: true, hash} 또는 {committed: false, reason, detail?}.
    어떤 실패도 예외로 새지 않는다 — 커밋 실패가 저장 실패가 되어서는 안 된다."""
    try:
        ident = git_identity()
        if ident is None:
            return _git_fail("커밋 신원 없음",
                             ".env에 BLOG_GIT_NAME·BLOG_GIT_EMAIL을 적거나 저장소에서 git config user.name/user.email을 "
                             "설정한 뒤 docker compose up -d로 재기동하세요.")
        spec = _commit_paths(paths)
        if not spec:
            return _git_fail("커밋할 변경 없음")
        r = run_git(["add", "-A", "--"] + spec)
        if r.returncode != 0:
            return _git_fail("git add 실패", (r.stderr or r.stdout))
        spec = _known_to_git(spec)
        if not spec:
            return _git_fail("커밋할 변경 없음")
        r = run_git(["diff", "--cached", "--quiet", "--"] + spec, timeout=10)
        if r.returncode == 0:
            return _git_fail("커밋할 변경 없음")
        env_args = ["-c", f"user.name={ident[0]}", "-c", f"user.email={ident[1]}"]
        r = subprocess.run(GIT_BASE + env_args + ["commit", "--quiet", "--no-verify", "--only", "-m", message, "--"] + spec,
                           cwd=str(ROOT), capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            return _git_fail("git commit 실패", (r.stderr or r.stdout))
        r = run_git(["rev-parse", "--short", "HEAD"], timeout=10)
        return {"committed": True, "hash": r.stdout.strip() if r.returncode == 0 else ""}
    except (OSError, subprocess.TimeoutExpired) as err:
        return _git_fail("git 실행 실패", type(err).__name__)


def with_git(result: dict, message: str, paths: list[str]) -> dict:
    """저장·삭제·분류 저장 응답에 자동 커밋 결과를 붙인다. BLOG_AUTO_COMMIT이 꺼져 있으면 필드 자체가 없다."""
    if AUTO_COMMIT:
        result["git"] = auto_commit(message, paths)
    return result


# ---------- /api/health ----------

@app.get("/api/health")
async def health(request: Request) -> JSONResponse:
    """기본은 {ok, version}뿐 — 프로세스를 띄우지 않아 항상 빠르다. `?git=1`이면 {branch, dirty}를 더한다(느릴 수 있음)."""
    payload: dict = {"ok": True, "version": SERVER_VERSION}
    if request.query_params.get("git") == "1":
        payload["git"] = await run_in_threadpool(git_info)
    return JSONResponse(payload, headers={"Cache-Control": "no-store"})


# ---------- /api/posts, /api/categories (읽기: 파일 그대로) ----------

def raw_json_file(path: Path, label: str) -> Response:
    text = Repo.read_text(path)
    if text is None:
        raise PostsError(404, "not_found", f"{label} 파일이 없습니다.")
    try:
        json.loads(text.lstrip("\ufeff"))
    except ValueError as err:
        raise PostsError(409, "conflict", f"{label} 형식이 올바르지 않습니다(쉼표나 따옴표를 확인하세요).") from err
    return Response(text, media_type="application/json; charset=utf-8", headers={"Cache-Control": "no-store"})


@app.get("/api/posts")
async def get_posts() -> Response:
    return raw_json_file(repo.index_path, "posts/index.json")


@app.get("/api/categories")
async def get_categories() -> Response:
    return raw_json_file(repo.categories_path, "posts/categories.json")


# ---------- 저장 ----------

def _find_index_meta(index: dict | None, post_id: str) -> dict | None:
    if not index:
        return None
    for p in index["posts"]:
        if p["id"] == post_id:
            return p
    return None


def _disk_meta(files: list[Path], index_meta: dict | None, post_id: str) -> dict | None:
    """화면(store.loadPost)이 그 글에 대해 보는 메타 8개. 파일도 index 항목도 없으면 None.
    store.loadPost와 같은 순서: fileMeta = normalizeMeta(parsed.data, id) → mergeMeta(indexMeta, fileMeta).
    mergeMeta는 .md에 **키가 있는** 필드는 (정규화된) 파일 값을, 없는 필드는 index 값을 고른 뒤 다시 normalizeMeta한다.
    파일을 먼저 정규화하는 순서가 중요하다 — `created: ""`처럼 키는 있고 값이 빈 경우 파일 안의 updated·id 날짜가
    index의 값보다 먼저 답한다(store.js:648). 순서를 바꾸면 같은 입력에 다른 created가 나온다(M4-2 ①).
    created(불변 판정)와 updated(v1.2 expectedUpdated 비교)가 둘 다 이 값을 쓴다 — 에디터가 들고 있는 값과 같은 출처다."""
    if not files:
        return dict(index_meta) if index_meta else None
    parsed = parse_frontmatter(Repo.read_text(files[0]) or "")
    file_meta = normalize_meta(parsed["data"], post_id) if parsed["ok"] else None
    merged: dict = {}
    for key in META_KEYS:
        if file_meta is not None and key in parsed["data"]:
            merged[key] = file_meta[key]
        elif index_meta:
            merged[key] = index_meta.get(key)
    return normalize_meta(merged, "")


def _disk_created(files: list[Path], index_meta: dict | None, post_id: str) -> str:
    meta = _disk_meta(files, index_meta, post_id)
    return meta["created"] if meta else ""


def _same_instant(a: str, b: str) -> bool:
    """`expectedUpdated` 비교. 글자가 같으면 같다. 다르면 둘 다 시간대가 있는 ISO 8601일 때만 같은 순간인지 본다
    (`+09:00`과 `Z` 표기 차이로 거짓 stale을 내지 않는다). 날짜만 있거나 읽을 수 없으면 글자 비교 결과 그대로."""
    a, b = (a or "").strip(), (b or "").strip()
    if a == b:
        return True
    try:
        da, db = datetime.fromisoformat(a), datetime.fromisoformat(b)
    except ValueError:
        return False
    if da.tzinfo is None or db.tzinfo is None:
        return False
    return da == db


def _only_one(files: list[Path], post_id: str) -> None:
    if len(files) > 1:
        where = ", ".join(repo.rel(p) for p in files)
        raise PostsError(409, "conflict", f'같은 id "{post_id}"의 글이 여러 폴더에 있습니다: {where}. 하나만 남기고 다시 시도하세요.')


def _no_case_variants(post_id: str, folder: Path) -> None:
    variants = repo.case_variants(post_id, folder)
    if variants:
        where = ", ".join(repo.rel(v) for v in variants)
        raise PostsError(409, "conflict",
                         f'"{post_id}"와 대소문자만 다른 파일이 있습니다: {where}. GitHub Pages는 대소문자를 구분하므로 '
                         f"하나로 정리한 뒤 다시 시도하세요.")


def _locate(post_id: str, index_meta: dict | None, form_category: str, cats: list | None) -> list[Path]:
    """store.loadPost(id)가 찾는 방식 그대로: index.json이 분류를 적어 뒀으면 그 폴더(+평면·_uncategorized)만 본다.
    화면이 못 찾는 글을 서버만 찾아 '저장 성공'하면 상세 화면은 '없습니다'가 된다(M4-2 ②) — 그래서 규칙을 store.js에 맞춘다.
    대신 화면 밖 폴더에 같은 id가 있으면(이동·수동 편집 잔재) 조용히 두 벌을 만들지 않고 409로 정리를 요구한다.
    파일 이름의 대소문자만 다른 것도 같은 이유로 409(NTFS는 같은 파일, GitHub Pages는 다른 파일)."""
    declared = index_meta["category"] if index_meta and index_meta["category"] else ""
    hint = declared or form_category
    trusted = repo.trusted_lookup(declared, "", cats)
    found = repo.find_existing(post_id, hint, cats, trusted)
    _only_one(found, post_id)
    if trusted:
        stray = [p for p in repo.find_existing(post_id, hint, cats, False) if p not in found]
        if stray:
            where = ", ".join(repo.rel(p) for p in stray)
            expected = repo.rel(repo.post_path(post_id, repo.category_slug(declared, cats)))
            raise PostsError(409, "conflict",
                             f'index.json은 "{post_id}"가 {expected}에 있다고 하는데 실제 파일은 {where}에 있습니다. '
                             f"파일을 옮기거나 index.json의 category를 고친 뒤 다시 시도하세요.")
    for p in repo.candidates(post_id, hint, cats, False):
        _no_case_variants(post_id, p.parent)
    return found


def _guard_exists(post_id: str, index_meta: dict | None, prev_id: str, why: str) -> None:
    """409 exists(v1.2, meeting-08 D1). 대상 id가 index에 있거나 posts/ 어디에든(대소문자 무시) 파일이 있으면 저장하지 않는다.
    why: "new"(ifNew) | "rename"(previousId). 오류 객체에 id·path·title·via를 싣는다(api.md §3-1)."""
    found = repo.find_anywhere(post_id, exclude_stem=prev_id)
    if index_meta is None and not found:
        return
    path = repo.rel(found[0]) if found else None
    title = index_meta["title"] if index_meta else None
    if title is None and found:
        parsed = parse_frontmatter(Repo.read_text(found[0]) or "")
        if parsed["ok"] and parsed["data"].get("title"):
            title = str(parsed["data"]["title"])
    where = path or "posts/index.json(파일 없음)"
    raise PostsError(409, "exists", f'id "{post_id}"인 글이 이미 있습니다({where}). 다른 id로 저장하세요.',
                     id=post_id, path=path, title=title, via=why)


def _guard_stale(base_id: str, files: list[Path], index_meta: dict | None, expected: str) -> None:
    """409 stale(v1.2, meeting-08 충돌 10). 에디터가 불러왔을 때의 updated(expected)와 지금 디스크의 updated가 다르면
    — 다른 탭·손편집이 그 사이 저장했다 — 덮어쓰지 않는다. 글이 사라졌으면 currentUpdated=null."""
    current = _disk_meta(files, index_meta, base_id)
    if current is None:
        raise PostsError(409, "stale", f'편집하던 글 "{base_id}"이(가) 디스크에 없습니다. 다른 곳에서 지웠거나 옮겼습니다.',
                         id=base_id, path=None, currentUpdated=None, expectedUpdated=expected)
    if not _same_instant(current["updated"], expected):
        raise PostsError(409, "stale",
                         f'"{base_id}"이(가) 불러온 뒤에 다른 곳에서 저장됐습니다(지금 {current["updated"]}). '
                         f"덮어쓰지 않았습니다.",
                         id=base_id, path=repo.rel(files[0]) if files else None,
                         currentUpdated=current["updated"], expectedUpdated=expected)


def save_post(post_id: str, form: dict) -> dict:
    with LOCK:
        cats = repo.load_categories()
        index = repo.load_index()
        slug = repo.category_slug(form["category"], cats)
        validate_folder_slug(slug)
        target = repo.post_path(post_id, slug)

        index_meta = _find_index_meta(index, post_id)
        prev_id = form["previous_id"] if form["previous_id"] and form["previous_id"] != post_id else ""

        # v1.2 덮어쓰기 차단(D1) — 파일을 찾거나 정리하기 전에 먼저 본다. 409면 디스크는 한 바이트도 바뀌지 않는다.
        if form["if_new"]:
            _guard_exists(post_id, index_meta, "", "new")
        elif prev_id:
            _guard_exists(post_id, index_meta, prev_id, "rename")   # id 바꾸기로 남의 글을 덮는 길(절대 규칙 4 위반 경로)

        existing = _locate(post_id, index_meta, form["category"], cats)
        _no_case_variants(post_id, target.parent)      # 새 분류 폴더(아직 등록 전)도 검사
        if repo.exists_exact(target) and target not in existing:
            existing.insert(0, target)
        _only_one(existing, post_id)

        # 수정 중 id를 바꾼 경우: 옛 글의 created를 물려받고 옛 파일·index 항목을 지운다.
        # (새 id에 이미 글이 있으면 위 _guard_exists가 409로 막았으므로, 여기서 existing은 비어 있거나 같은 id의 잔재뿐이다.)
        prev_files: list[Path] = []
        prev_meta = None
        if prev_id:
            prev_meta = _find_index_meta(index, prev_id)
            prev_files = _locate(prev_id, prev_meta, form["category"], cats)

        # v1.2 기준 버전 확인 — 비교 대상은 "편집하던 글": id를 바꿨으면 옛 id, 아니면 이 id.
        if form["expected_updated"]:
            if prev_id:
                _guard_stale(prev_id, prev_files, prev_meta, form["expected_updated"])
            else:
                _guard_stale(post_id, existing, index_meta, form["expected_updated"])

        now = now_iso_kst()
        is_new = not existing and index_meta is None and not prev_files and prev_meta is None
        if is_new:
            created = now                       # 새 글: 요청의 created는 무시
        else:
            # id 바꾸기는 "같은 글의 새 이름"이라 옛 id의 created가 먼저다. 새 id에 남의 글이 있는 경우는
            # _guard_exists가 이미 막았다 — v1.1은 그 글의 created를 물려받았다(D1 ③, 절대 규칙 4 위반 경로).
            created = _disk_created(prev_files, prev_meta, prev_id) if prev_id else ""
            created = created or _disk_created(existing, index_meta, post_id)
            # 디스크 어디에도 created가 없을 때만 요청값(ensureCreated 모달이 확인받은 값)을 쓴다.
            created = created or form["created"] or now

        meta = {
            "id": post_id, "title": form["title"], "summary": form["summary"],
            "created": created, "updated": now,
            "tags": form["tags"], "category": form["category"], "pinned": form["pinned"],
        }
        repo.write_atomic(target, to_markdown_file(meta, form["body"]))

        removed: list[str] = []
        for p in existing + prev_files:
            if p != target and p.is_file():
                p.unlink()
                removed.append(repo.rel(p))

        current = index
        if prev_id and index:
            current = {"site": index["site"], "posts": [p for p in index["posts"] if p["id"] != prev_id]}
        repo.write_atomic(repo.index_path, build_index_json(meta, current))

        result = {"ok": True, "isNew": is_new, "path": repo.rel(target), "removed": removed, "meta": meta}
        paths = [repo.rel(target), repo.rel(repo.index_path)] + removed
        return with_git(result, f"글: {meta['title']} ({post_id})", paths)


def delete_post(post_id: str) -> dict:
    with LOCK:
        cats = repo.load_categories()
        index = repo.load_index()
        index_meta = _find_index_meta(index, post_id)
        files = _locate(post_id, index_meta, "", cats)
        if not files and index_meta is None:
            raise PostsError(404, "not_found", f'"{post_id}" 글이 없습니다.')
        removed = []
        for p in files:
            p.unlink()
            removed.append(repo.rel(p))
        if index is not None and index_meta is not None:
            repo.write_atomic(repo.index_path, build_index_json_without(post_id, index))
        title = index_meta["title"] if index_meta else post_id
        result = {"ok": True, "removed": removed, "fileMissing": not files}
        return with_git(result, f"글 삭제: {title} ({post_id})", removed + [repo.rel(repo.index_path)])


def save_categories(payload: Any) -> dict:
    if not isinstance(payload, dict) or not isinstance(payload.get("categories"), list):
        raise PostsError(400, "bad_request", "요청 본문에 categories 배열이 없습니다.")
    with LOCK:
        current = repo.load_categories() or []
        incoming = []
        for i, item in enumerate(payload["categories"]):
            c = normalize_category(item, len(current) + i)
            validate_folder_slug(c["slug"])
            incoming.append(c)
        merged = list(current)
        for c in incoming:
            merged = [x for x in merged if x["slug"] != c["slug"]]
            merged.append(c)
        text = build_categories_json(merged)
        repo.write_atomic(repo.categories_path, text)
        # v1.2: 분류 저장도 커밋한다(D25) — v1.1은 커밋하지 않아 다음 글 커밋에 categories.json이 섞여 들어갔다.
        known = {x["slug"] for x in current}
        added = [c["slug"] for c in incoming if c["slug"] not in known]
        message = ("분류 추가: " + ", ".join(added)) if added else "분류 갱신"
        result = {"ok": True, "categories": json.loads(text)["categories"]}
        return with_git(result, message, [repo.rel(repo.categories_path)])


def _check_id(post_id: str) -> None:
    if not is_safe_id(post_id):
        raise PostsError(400, "bad_id", "id는 영문·숫자로 시작하고 영문·숫자·점·밑줄·하이픈만 쓸 수 있습니다(최대 200자, '..' 금지).")


@app.put("/api/posts/{post_id}")
async def put_post(post_id: str, request: Request) -> JSONResponse:
    _check_id(post_id)
    payload = await read_json_body(request)
    form = validate_post_payload(post_id, payload)
    return JSONResponse(await run_in_threadpool(save_post, post_id, form))


@app.delete("/api/posts/{post_id}")
async def delete_post_route(post_id: str) -> JSONResponse:
    _check_id(post_id)
    return JSONResponse(await run_in_threadpool(delete_post, post_id))


@app.put("/api/categories")
async def put_categories(request: Request) -> JSONResponse:
    payload = await read_json_body(request)
    return JSONResponse(await run_in_threadpool(save_categories, payload))


# ---------- 정적 서빙 (허용 목록 — MIME 표는 start.ps1과 같지만 서빙 범위는 start.ps1보다 좁다) ----------

def _exact_case(parts: list[str]) -> bool:
    """요청 경로의 **모든 조각**이 디스크 이름과 대소문자까지 같은가. NTFS(와 그 bind mount)는 `/CSS/x`도 찾아 주지만
    GitHub Pages는 404다 — 로컬에서만 되는 링크를 만들지 않도록 Pages와 같이 거절한다(api.md §1·§6-1).
    resolve() 결과가 아니라 요청 조각을 본다 — Windows의 resolve()는 실제 대소문자로 고쳐 돌려준다."""
    cur = ROOT
    for part in parts:
        try:
            if part not in os.listdir(cur):
                return False
        except OSError:
            return False
        cur = cur / part
    return True


def resolve_static(path: str) -> Path:
    """허용 목록(v1.2): 루트 파일 STATIC_ROOT_FILES, 또는 STATIC_DIRS 아래 파일. 그 밖은 전부 404.
    어느 조각이든 `.`으로 시작하면 404(`posts/.x.md.tmp` 같은 원자적 쓰기 임시 파일·숨김 파일) — 루트 `.nojekyll`만 예외."""
    if path == "" or path.endswith("/"):
        path += "index.html"
    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    head = parts[0].lower()
    if len(parts) == 1:
        if head not in STATIC_ROOT_FILES:
            raise PostsError(404, "not_found", "찾을 수 없습니다.")
    elif head not in STATIC_DIRS or any(part.startswith(".") for part in parts):
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    full = (ROOT / path).resolve()
    if ROOT not in full.parents or not full.is_file() or not _exact_case(parts):
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    return full


@app.get("/{path:path}")
@app.head("/{path:path}")
async def static_file(path: str) -> FileResponse:
    full = resolve_static(path)
    media = MIME.get(full.suffix.lower(), "application/octet-stream")
    return FileResponse(str(full), media_type=media, headers={"Cache-Control": "no-store"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("BLOG_BIND", "127.0.0.1"),
                port=int(os.environ.get("BLOG_PORT", "5500")), log_level="info")
