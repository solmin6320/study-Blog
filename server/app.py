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

SERVER_VERSION = "1.0.0"
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


# ---------- /api/health ----------

def git_info() -> dict:
    """{branch, dirty}. git이 없거나 실패하면 .git/HEAD를 읽고 dirty는 null."""
    branch: str | None = None
    dirty: bool | None = None
    base = ["git", "-c", "safe.directory=*", "-c", "core.fileMode=false", "-c", "core.autocrlf=true",
            "--no-optional-locks"]
    try:
        r = subprocess.run(base + ["rev-parse", "--abbrev-ref", "HEAD"], cwd=str(ROOT),
                           capture_output=True, text=True, timeout=10)
        if r.returncode == 0 and r.stdout.strip():
            branch = r.stdout.strip()
        r = subprocess.run(base + ["status", "--porcelain"], cwd=str(ROOT),
                           capture_output=True, text=True, timeout=30)
        if r.returncode == 0:
            dirty = bool(r.stdout.strip())
    except (OSError, subprocess.TimeoutExpired):
        pass
    if branch is None:
        head = Repo.read_text(ROOT / ".git" / "HEAD") or ""
        head = head.strip()
        branch = head[len("ref: refs/heads/"):] if head.startswith("ref: refs/heads/") else (head[:12] or None)
    return {"branch": branch, "dirty": dirty}


@app.get("/api/health")
async def health() -> JSONResponse:
    info = await run_in_threadpool(git_info)
    return JSONResponse({"ok": True, "version": SERVER_VERSION, "git": info})


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
    """store.mergeMeta(indexMeta, fileMeta).created — .md의 키가 있으면 파일이, 없으면 index가 답한다."""
    if not files:
        return index_meta["created"] if index_meta else ""
    parsed = parse_frontmatter(Repo.read_text(files[0]) or "")
    fm = parsed["data"] if parsed["ok"] else {}
    merged = {}
    for key in META_KEYS:
        if parsed["ok"] and key in fm:
            merged[key] = fm[key]
        elif index_meta:
            merged[key] = index_meta.get(key)
    return normalize_meta(merged, post_id)["created"]


def _only_one(files: list[Path], post_id: str) -> None:
    if len(files) > 1:
        where = ", ".join(repo.rel(p) for p in files)
        raise PostsError(409, "conflict", f'같은 id "{post_id}"의 글이 여러 폴더에 있습니다: {where}. 하나만 남기고 다시 시도하세요.')


def save_post(post_id: str, form: dict) -> dict:
    with LOCK:
        cats = repo.load_categories()
        index = repo.load_index()
        slug = repo.category_slug(form["category"], cats)
        validate_folder_slug(slug)
        target = repo.post_path(post_id, slug)

        index_meta = _find_index_meta(index, post_id)
        hint = index_meta["category"] if index_meta and index_meta["category"] else form["category"]
        existing = repo.find_existing(post_id, hint, cats)
        if target.is_file() and target not in existing:
            existing.insert(0, target)
        _only_one(existing, post_id)

        # 수정 중 id를 바꾼 경우: 옛 글의 created를 물려받고 옛 파일·index 항목을 지운다.
        prev_id = form["previous_id"] if form["previous_id"] and form["previous_id"] != post_id else ""
        prev_files: list[Path] = []
        prev_meta = None
        if prev_id:
            prev_meta = _find_index_meta(index, prev_id)
            prev_hint = prev_meta["category"] if prev_meta and prev_meta["category"] else form["category"]
            prev_files = repo.find_existing(prev_id, prev_hint, cats)
            _only_one(prev_files, prev_id)

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

        return {"ok": True, "isNew": is_new, "path": repo.rel(target), "removed": removed, "meta": meta}


def delete_post(post_id: str) -> dict:
    with LOCK:
        cats = repo.load_categories()
        index = repo.load_index()
        index_meta = _find_index_meta(index, post_id)
        files = repo.find_existing(post_id, index_meta["category"] if index_meta else "", cats)
        _only_one(files, post_id)
        if not files and index_meta is None:
            raise PostsError(404, "not_found", f'"{post_id}" 글이 없습니다.')
        removed = []
        for p in files:
            p.unlink()
            removed.append(repo.rel(p))
        if index is not None and index_meta is not None:
            repo.write_atomic(repo.index_path, build_index_json_without(post_id, index))
        return {"ok": True, "removed": removed, "fileMissing": not files}


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
