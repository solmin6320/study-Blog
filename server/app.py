"""app.py — 로컬 에디터 서버 엔트리. 규약은 docs/api.md, 파일 규칙은 server/posts.py.

역할은 둘뿐이다: (1) 프로젝트 루트를 정적으로 서빙(start.ps1과 같은 동작), (2) 에디터가
내보내던 .md / index.json / categories.json 을 대신 디스크에 쓴다. 인증·DB·세션·git push 없음.

실행: python -m server.app  (Docker 밖: 127.0.0.1:5500 / Docker 안: BLOG_BIND=0.0.0.0)
"""
from __future__ import annotations

import json
import os
import subprocess
import threading
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

SERVER_VERSION = "1.1.0"
ROOT = Path(__file__).resolve().parent.parent
MAX_BODY = 2 * 1024 * 1024
# 정적 서빙에서 감추는 첫 경로 조각(폴더)과 루트 파일. docs/api.md §1
HIDDEN_DIRS = {"server", ".git", ".claude", "docs"}
HIDDEN_FILES = {".dockerignore", ".gitignore"}
HIDDEN_PREFIXES = ("Dockerfile", "docker-compose")

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

def error_response(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status)


@app.exception_handler(PostsError)
async def on_posts_error(_: Request, exc: PostsError) -> JSONResponse:
    return error_response(exc.status, exc.code, exc.message)


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


def auto_commit(message: str) -> dict:
    """posts/ 아래 변경만 스테이징해 커밋한다. 푸시는 하지 않는다(사용자 결정 1 — 권장안 A).
    반환은 api.md §2의 `git` 필드 그대로: {committed: true, hash} 또는 {committed: false, reason}.
    어떤 실패도 예외로 새지 않는다 — 커밋 실패가 저장 실패가 되어서는 안 된다."""
    try:
        ident = git_identity()
        if ident is None:
            return {"committed": False,
                    "reason": "커밋 신원이 없습니다 — .env에 BLOG_GIT_NAME·BLOG_GIT_EMAIL을 적거나 저장소에서 git config user.name/user.email을 설정하세요."}
        r = run_git(["add", "-A", "--", "posts/"])
        if r.returncode != 0:
            return {"committed": False, "reason": f"git add 실패: {(r.stderr or r.stdout).strip()[:200]}"}
        r = run_git(["diff", "--cached", "--quiet", "--", "posts/"], timeout=10)
        if r.returncode == 0:
            return {"committed": False, "reason": "posts/에 커밋할 변경이 없습니다."}
        env_args = ["-c", f"user.name={ident[0]}", "-c", f"user.email={ident[1]}"]
        r = subprocess.run(GIT_BASE + env_args + ["commit", "--quiet", "--no-verify", "--only", "-m", message, "--", "posts/"],
                           cwd=str(ROOT), capture_output=True, text=True, timeout=60)
        if r.returncode != 0:
            return {"committed": False, "reason": f"git commit 실패: {(r.stderr or r.stdout).strip()[:200]}"}
        r = run_git(["rev-parse", "--short", "HEAD"], timeout=10)
        return {"committed": True, "hash": r.stdout.strip() if r.returncode == 0 else ""}
    except (OSError, subprocess.TimeoutExpired) as err:
        return {"committed": False, "reason": f"git 실행 실패: {type(err).__name__}"}


def with_git(result: dict, message: str) -> dict:
    """저장·삭제 응답에 자동 커밋 결과를 붙인다. BLOG_AUTO_COMMIT이 꺼져 있으면 필드 자체가 없다."""
    if AUTO_COMMIT:
        result["git"] = auto_commit(message)
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


def _disk_created(files: list[Path], index_meta: dict | None, post_id: str) -> str:
    """store.loadPost와 같은 순서: fileMeta = normalizeMeta(parsed.data, id) → mergeMeta(indexMeta, fileMeta).
    mergeMeta는 .md에 **키가 있는** 필드는 (정규화된) 파일 값을, 없는 필드는 index 값을 고른 뒤 다시 normalizeMeta한다.
    파일을 먼저 정규화하는 순서가 중요하다 — `created: ""`처럼 키는 있고 값이 빈 경우 파일 안의 updated·id 날짜가
    index의 값보다 먼저 답한다(store.js:648). 순서를 바꾸면 같은 입력에 다른 created가 나온다(M4-2 ①)."""
    if not files:
        return index_meta["created"] if index_meta else ""
    parsed = parse_frontmatter(Repo.read_text(files[0]) or "")
    file_meta = normalize_meta(parsed["data"], post_id) if parsed["ok"] else None
    merged: dict = {}
    for key in META_KEYS:
        if file_meta is not None and key in parsed["data"]:
            merged[key] = file_meta[key]
        elif index_meta:
            merged[key] = index_meta.get(key)
    return normalize_meta(merged, "")["created"]


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


def save_post(post_id: str, form: dict) -> dict:
    with LOCK:
        cats = repo.load_categories()
        index = repo.load_index()
        slug = repo.category_slug(form["category"], cats)
        validate_folder_slug(slug)
        target = repo.post_path(post_id, slug)

        index_meta = _find_index_meta(index, post_id)
        existing = _locate(post_id, index_meta, form["category"], cats)
        _no_case_variants(post_id, target.parent)      # 새 분류 폴더(아직 등록 전)도 검사
        if repo.exists_exact(target) and target not in existing:
            existing.insert(0, target)
        _only_one(existing, post_id)

        # 수정 중 id를 바꾼 경우: 옛 글의 created를 물려받고 옛 파일·index 항목을 지운다.
        prev_id = form["previous_id"] if form["previous_id"] and form["previous_id"] != post_id else ""
        prev_files: list[Path] = []
        prev_meta = None
        if prev_id:
            prev_meta = _find_index_meta(index, prev_id)
            prev_files = _locate(prev_id, prev_meta, form["category"], cats)

        now = now_iso_kst()
        is_new = not existing and index_meta is None and not prev_files and prev_meta is None
        if is_new:
            created = now                       # 새 글: 요청의 created는 무시
        else:
            created = _disk_created(existing, index_meta, post_id)
            if not created and prev_id:
                created = _disk_created(prev_files, prev_meta, prev_id)
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
        return with_git(result, f"글: {meta['title']} ({post_id})")


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
        return with_git(result, f"글 삭제: {title} ({post_id})")


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
        return {"ok": True, "categories": json.loads(text)["categories"]}


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


# ---------- 정적 서빙 (start.ps1과 같은 규칙) ----------

def resolve_static(path: str) -> Path:
    if path == "" or path.endswith("/"):
        path += "index.html"
    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    if parts[0] in HIDDEN_DIRS:
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    if len(parts) == 1 and (parts[0] in HIDDEN_FILES or parts[0].startswith(HIDDEN_PREFIXES)):
        raise PostsError(404, "not_found", "찾을 수 없습니다.")
    full = (ROOT / path).resolve()
    if ROOT not in full.parents or not full.is_file():
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
