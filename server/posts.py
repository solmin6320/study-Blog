"""posts.py — posts/ 파일 규칙. js/store.js의 파이썬 이식.

각 함수의 docstring 첫 줄에 원본 JS 함수명을 적었다. 규칙을 바꿀 때는 store.js를 먼저 바꾸고
여기를 따라 고친다 — 두 곳이 갈라지면 "에디터로 저장한 글이 화면에 안 보이는" 사고가 난다.
화면·HTTP는 전혀 모른다. 파일시스템만 만진다.
"""
from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# ---------- 상수 (config.js) ----------

SITE_TITLE = "메모 블로그"
SITE_SUBTITLE = "공부한 것을 기록하는 곳"
FALLBACK_SLUG = "_uncategorized"
META_KEYS = ["id", "title", "summary", "created", "updated", "tags", "category", "pinned"]
# editor.js RESERVED_SLUGS — posts/ 안에서 이미 뜻이 정해진 이름
RESERVED_SLUGS = {"index", "categories", "posts"}
# editor.js PATH_SAFE_RE — 폴더로 쓸 수 있는 slug
PATH_SAFE_RE = re.compile(r"^[a-z0-9_][a-z0-9_-]*\Z")

# JS의 \s 는 유니코드 공백 + \ufeff. 파이썬 \s 는 \ufeff를 포함하지 않으므로 명시한다.
_JS_WS = r"\s\ufeff"


class PostsError(Exception):
    """HTTP 계층이 상태 코드로 옮기는 오류. code는 docs/api.md §3의 값."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


# ---------- 시각 (util.js nowIsoKst) ----------

_KST = timezone(timedelta(hours=9))


def now_iso_kst() -> str:
    """util.nowIsoKst — KST 고정 오프셋 ISO 8601. 초 단위, 밀리초 없음."""
    return datetime.now(_KST).strftime("%Y-%m-%dT%H:%M:%S+09:00")


# ---------- id / slug ----------

_SAFE_ID_RE = re.compile(r"^[0-9A-Za-z][0-9A-Za-z._-]{0,199}\Z")


def is_safe_id(value: Any) -> bool:
    """store.isSafeId — 영문·숫자로 시작, [0-9A-Za-z._-] 최대 200자, '..' 금지."""
    s = "" if value is None else str(value)
    return bool(_SAFE_ID_RE.match(s)) and ".." not in s


def _js_trim(s: str) -> str:
    return re.sub(rf"^[{_JS_WS}]+|[{_JS_WS}]+$", "", s)


def slugify_category(value: Any) -> str:
    """store.slugifyCategory — 폴더명으로 쓸 수 있는 문자만 남긴다. 밑줄은 살린다."""
    s = "" if value is None else str(value)
    s = _js_trim(s).lower()
    s = re.sub(rf"[{_JS_WS}.]+", "-", s)
    s = re.sub(r"[^0-9a-z_\-]", "", s)
    s = re.sub(r"-{2,}", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    return s


# ---------- 메타 정규화 (store.normalizeMeta) ----------

_ID_DATE_RE = re.compile(r"^([0-9]{4}-[0-9]{2}-[0-9]{2})")


def _js_string(value: Any) -> str:
    """JS String(v) — true/false/null 표기가 파이썬과 다르다."""
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def _truthy(value: Any) -> bool:
    """JS 진리값: '', 0, null, false 만 거짓."""
    return not (value is None or value is False or value == "" or value == 0)


def to_tag_array(value: Any) -> list[str]:
    """store.toTagArray"""
    if isinstance(value, list):
        out = [_js_trim(_js_string(t)) for t in value]
        return [t for t in out if t]
    if isinstance(value, str) and _js_trim(value):
        return [t for t in (_js_trim(x) for x in value.split(",")) if t]
    return []


def to_bool(value: Any) -> bool:
    """store.toBool"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return _js_trim(value).lower() == "true"
    return bool(value)


def fallback_created(created: str, updated: str, post_id: str) -> str:
    """store.fallbackCreated — created → updated → id 앞머리(YYYY-MM-DD)."""
    if created:
        return created
    if updated:
        return updated
    m = _ID_DATE_RE.match(post_id or "")
    return m.group(1) if m else ""


def normalize_meta(raw: Any, fallback_id: str = "") -> dict:
    """store.normalizeMeta — 빠진 필드를 기본값으로 채운 메타 8개."""
    meta = raw if isinstance(raw, dict) else {}
    post_id = _js_trim(_js_string(meta.get("id")) if _truthy(meta.get("id")) else (fallback_id or ""))
    created = fallback_created(
        _js_string(meta["created"]) if _truthy(meta.get("created")) else "",
        _js_string(meta["updated"]) if _truthy(meta.get("updated")) else "",
        post_id,
    )
    updated = _js_string(meta["updated"]) if _truthy(meta.get("updated")) else created
    return {
        "id": post_id,
        "title": _js_string(meta["title"]) if _truthy(meta.get("title")) else "(제목 없음)",
        "summary": _js_string(meta["summary"]) if _truthy(meta.get("summary")) else "",
        "created": created,
        "updated": updated or created,
        "tags": to_tag_array(meta.get("tags")),
        "category": _js_string(meta["category"]) if _truthy(meta.get("category")) else "",
        "pinned": to_bool(meta.get("pinned")),
    }


# ---------- frontmatter 파서 (store.parseFrontmatter) ----------
# 서버가 실제로 쓰는 것은 data.created 하나지만, 값 해석이 갈라지면 created가 달라지므로
# 스칼라·인라인 배열·블록 배열 규칙을 그대로 옮긴다.

def _unescape_double(text: str) -> str:
    return re.sub(r'\\(["\\])', r"\1", text)


def _unescape_single(text: str) -> str:
    return text.replace("''", "'")


def _strip_quotes(raw: str) -> tuple[str, bool]:
    s = _js_trim(raw)
    if len(s) >= 2:
        if s[0] == '"' and s[-1] == '"':
            return _unescape_double(s[1:-1]), True
        if s[0] == "'" and s[-1] == "'":
            return _unescape_single(s[1:-1]), True
    return s, False


def _coerce_scalar(raw: str) -> Any:
    """store.coerceScalar"""
    text, quoted = _strip_quotes(raw)
    if quoted:
        return text
    s = text
    if s == "":
        return ""
    if s in ("true", "True"):
        return True
    if s in ("false", "False"):
        return False
    if s in ("null", "~"):
        return None
    if re.match(r"^-?[0-9]+(\.[0-9]+)?\Z", s):
        return float(s) if "." in s else int(s)
    return s


def _parse_inline_array(raw: str) -> list:
    """store.parseInlineArray"""
    inner = _js_trim(raw)[1:-1]
    out: list[str] = []
    buf = ""
    quote = None
    i = 0
    while i < len(inner):
        ch = inner[i]
        if quote:
            if quote == '"' and ch == "\\" and i + 1 < len(inner):
                buf += _unescape_double(ch + inner[i + 1])
                i += 2
                continue
            if ch == quote:
                quote = None
            else:
                buf += ch
            i += 1
            continue
        if ch in ('"', "'"):
            quote = ch
            i += 1
            continue
        if ch == ",":
            out.append(buf)
            buf = ""
            i += 1
            continue
        buf += ch
        i += 1
    out.append(buf)
    items = [_js_trim(x) for x in out]
    return [_coerce_scalar(x) for x in items if x != ""]


def _looks_like_inline_array(raw: str) -> bool:
    """store.looksLikeInlineArray"""
    if not raw or raw[0] != "[" or raw[-1] != "]":
        return False
    depth = 0
    quote = None
    i = 0
    while i < len(raw):
        ch = raw[i]
        if quote:
            if quote == '"' and ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in ('"', "'"):
            quote = ch
            i += 1
            continue
        if ch == "[":
            depth += 1
            i += 1
            continue
        if ch != "]":
            i += 1
            continue
        depth -= 1
        if depth <= 0:
            return i == len(raw) - 1
        i += 1
    return False


_FM_RE = re.compile(r"^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|\Z)")


def parse_frontmatter(text: str) -> dict:
    """store.parseFrontmatter — {ok, data, body}."""
    src = (text or "").lstrip("\ufeff")
    m = _FM_RE.match(src)
    if not m:
        return {"ok": False, "data": {}, "body": src}
    data: dict[str, Any] = {}
    lines = re.split(r"\r?\n", m.group(1))
    i = 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not _js_trim(line) or re.match(r"^\s*#", line):
            continue
        colon = line.find(":")
        if colon == -1:
            continue
        key = _js_trim(line[:colon])
        raw = _js_trim(line[colon + 1:])
        if not key:
            continue
        if raw == "":
            block = []
            while i < len(lines) and re.match(r"^\s*-\s+", lines[i]):
                block.append(_coerce_scalar(re.sub(r"^\s*-\s+", "", lines[i])))
                i += 1
            data[key] = block if block else ""
            continue
        if _looks_like_inline_array(raw):
            data[key] = _parse_inline_array(raw)
            continue
        data[key] = _coerce_scalar(raw)
    body = re.sub(r"^\s*\n", "", src[m.end():], count=1)
    return {"ok": True, "data": data, "body": body}


# ---------- 직렬화 (store.yamlValue / toFrontmatter / toMarkdownFile) ----------
# JS 원본: /^[\w가-힣][\w가-힣 .\-+/]*$/  — JS의 \w 는 ASCII만이므로 [A-Za-z0-9_]로 푼다.
_BARE_RE = re.compile(r"^[A-Za-z0-9_\uac00-\ud7a3][A-Za-z0-9_\uac00-\ud7a3 .\-+/]*\Z")
_ISO_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T")
_KEYWORD_RE = re.compile(r"^(true|false|null)\Z", re.IGNORECASE)
_BS = chr(92)   # 백슬래시
_DQ = chr(34)   # 큰따옴표


def yaml_value(value: Any) -> str:
    """store.yamlValue — 파서가 다시 읽을 수 있는 형태로만 쓴다."""
    if isinstance(value, list):
        return "[" + ", ".join(yaml_value(v) for v in value) + "]"
    if isinstance(value, bool) or isinstance(value, (int, float)):
        return _js_string(value)
    s = "" if value is None else str(value)
    if s == "":
        return _DQ + _DQ
    if _BARE_RE.match(s) and not _KEYWORD_RE.match(s):
        return s
    if _ISO_RE.match(s):
        return s
    # 백슬래시를 먼저 escape해야 한다(store.js 주석 참고). 순서를 바꾸면 한 겹 더 escape된다.
    escaped = s.replace(_BS, _BS + _BS).replace(_DQ, _BS + _DQ)
    return _DQ + escaped + _DQ


def to_frontmatter(meta: dict) -> str:
    """store.toFrontmatter — META_KEYS 순서, LF 구분."""
    lines = ["---"]
    for key in META_KEYS:
        lines.append(key + ": " + yaml_value(meta.get(key)))
    lines.append("---")
    return "\n".join(lines)


def to_markdown_file(meta: dict, body: str) -> str:
    """store.toMarkdownFile — frontmatter + 빈 줄 + 본문(끝 공백 제거) + LF 하나."""
    trimmed = re.sub(rf"[{_JS_WS}]+$", "", body or "")
    return to_frontmatter(meta) + "\n\n" + trimmed + "\n"


def _json_stringify(payload: Any) -> str:
    """JSON.stringify(payload, null, 2) + LF — 들여쓰기 2, 비ASCII 그대로, 끝 개행."""
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


class _Desc(str):
    """문자열 내림차순 정렬 키. ISO 날짜끼리는 코드포인트 순 = localeCompare 순."""

    def __lt__(self, other):  # type: ignore[override]
        return str.__gt__(self, other)


def _sort_posts(posts: list[dict]) -> list[dict]:
    """buildIndexJson·neighbors·app.sortPosts 공통 규칙: 고정 글 먼저 → created 내림차순. 안정 정렬."""
    return sorted(posts, key=lambda p: (0 if p.get("pinned") else 1, _Desc(str(p.get("created", "")))))


def _index_payload(site: dict, posts: list[dict]) -> dict:
    return {
        "site": {"title": site.get("title"), "subtitle": site.get("subtitle")},
        "posts": [
            {
                "id": p.get("id"), "title": p.get("title"), "summary": p.get("summary"),
                "created": p.get("created"), "updated": p.get("updated"),
                "tags": p.get("tags"), "category": p.get("category"), "pinned": bool(p.get("pinned")),
            }
            for p in posts
        ],
    }


def build_index_json(meta: dict, current: dict | None) -> str:
    """store.buildIndexJson — 같은 id는 교체, 없으면 추가, pinned 우선 → 최신순."""
    site = (current or {}).get("site") or {"title": SITE_TITLE, "subtitle": SITE_SUBTITLE}
    posts = [p for p in ((current or {}).get("posts") or []) if p.get("id") != meta["id"]]
    posts.append(meta)
    return _json_stringify(_index_payload(site, _sort_posts(posts)))


def build_index_json_without(post_id: str, current: dict) -> str:
    """삭제용. buildIndexJson과 같은 형식으로 해당 id만 뺀다."""
    site = current.get("site") or {"title": SITE_TITLE, "subtitle": SITE_SUBTITLE}
    posts = [p for p in (current.get("posts") or []) if p.get("id") != post_id]
    return _json_stringify(_index_payload(site, _sort_posts(posts)))


# ---------- 카테고리 (store.normalizeCategory / byOrder / buildCategoriesJson) ----------

def normalize_category(raw: Any, fallback_order: int) -> dict:
    """store.normalizeCategory"""
    src = raw if isinstance(raw, dict) else {}
    slug_src = src.get("slug") if _truthy(src.get("slug")) else src.get("name")
    slug = slugify_category(slug_src)
    name_src = src.get("name") if _truthy(src.get("name")) else src.get("slug")
    name = _js_trim(_js_string(name_src)) if _truthy(name_src) else ""
    raw_order = src.get("order")
    if raw_order is None and "order" in src or (isinstance(raw_order, str) and not _js_trim(raw_order)):
        order = 0.0                                   # JS Number(null) · Number("") = 0
    else:
        try:
            order = float(raw_order)
            if order != order:  # NaN
                raise ValueError
        except (TypeError, ValueError):
            order = float(fallback_order or 0)        # JS Number(undefined) = NaN → fallback
    if order.is_integer():
        order = int(order)
    return {
        "slug": slug,
        "name": name or slug,
        "description": _js_string(src["description"]) if _truthy(src.get("description")) else "",
        "order": order,
    }


def _collate_ko(name: str) -> tuple:
    """String.prototype.localeCompare(b, 'ko')의 명시 규칙(ICU 근사). 컨테이너에 ko 로케일이 없어 strxfrm을 쓸 수 없다.
    1차: 대소문자를 접은(casefold) 코드포인트 순 — 공백·구두점 < 숫자 < 라틴 < 한글(음절 코드포인트 = 자모 순).
    2차: 1차가 같으면 소문자가 대문자보다 먼저(ICU 3차 가중치). 완전히 같으면 안정 정렬.
    ICU와 갈리는 곳(악센트 무시 등)은 분류 이름에서 사실상 안 나온다. 라운드 7 골든 벡터(M4-13)가 합의 구간을 고정한다."""
    return (name.casefold(), tuple(0 if ch.islower() else 1 for ch in name))


def _by_order_key(c: dict):
    """store.byOrder — order 오름차순, 같으면 이름을 localeCompare(…, 'ko') 규칙(_collate_ko)으로."""
    return (c.get("order", 0), _collate_ko(str(c.get("name", ""))))


def build_categories_json(items: list[dict]) -> str:
    """store.buildCategoriesJson — 정렬 후 order를 0,1,2…로 다시 매긴다."""
    ordered = sorted(items, key=_by_order_key)
    payload = {
        "categories": [
            {"slug": c["slug"], "name": c["name"], "description": c.get("description") or "", "order": i}
            for i, c in enumerate(ordered)
        ]
    }
    return _json_stringify(payload)


# ---------- 저장소 ----------

class Repo:
    """posts/ 폴더 하나를 다루는 파일 규칙 모음. 락은 HTTP 계층(app.py)이 건다."""

    def __init__(self, root: Path):
        self.root = root.resolve()
        self.posts_dir = self.root / "posts"
        self.index_path = self.posts_dir / "index.json"
        self.categories_path = self.posts_dir / "categories.json"

    # ----- 읽기 -----

    @staticmethod
    def read_text(path: Path) -> str | None:
        try:
            return path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return None

    def load_index(self) -> dict | None:
        """store.loadIndex — 정규화·중복 id 제거까지. 파일 없음 → None, 깨짐 → 409."""
        text = self.read_text(self.index_path)
        if text is None:
            return None
        try:
            data = json.loads(text.lstrip("\ufeff"))
        except ValueError as err:
            raise PostsError(409, "conflict",
                             "posts/index.json 형식이 올바르지 않습니다(쉼표나 따옴표를 확인하세요). "
                             "손으로 고친 뒤 다시 시도하세요.") from err
        site = data.get("site") if isinstance(data, dict) and isinstance(data.get("site"), dict) else {}
        raw_posts = data.get("posts") if isinstance(data, dict) and isinstance(data.get("posts"), list) else []
        seen: set[str] = set()
        posts: list[dict] = []
        for item in raw_posts:
            fallback = _js_string(item.get("id")) if isinstance(item, dict) and _truthy(item.get("id")) else ""
            meta = normalize_meta(item, fallback)
            if not meta["id"] or meta["id"] in seen:
                continue
            seen.add(meta["id"])
            posts.append(meta)
        return {
            "site": {
                "title": _js_string(site["title"]) if _truthy(site.get("title")) else SITE_TITLE,
                "subtitle": _js_string(site["subtitle"]) if _truthy(site.get("subtitle")) else SITE_SUBTITLE,
            },
            "posts": posts,
        }

    def load_categories(self) -> list[dict] | None:
        """store.loadCategories의 파일 읽기 부분. 없음 → None, 깨짐 → 409. 정렬된 목록."""
        text = self.read_text(self.categories_path)
        if text is None:
            return None
        try:
            data = json.loads(text.lstrip("\ufeff"))
        except ValueError as err:
            raise PostsError(409, "conflict",
                             "posts/categories.json 형식이 올바르지 않습니다(쉼표나 따옴표를 확인하세요). "
                             "손으로 고친 뒤 다시 시도하세요.") from err
        if not isinstance(data, dict) or not isinstance(data.get("categories"), list):
            raise PostsError(409, "conflict", "posts/categories.json에 categories 배열이 없습니다.")
        items = [normalize_category(c, i) for i, c in enumerate(data["categories"])]
        return sorted([c for c in items if c["slug"]], key=_by_order_key)

    # ----- 분류 (store.findCategory / categorySlug) -----

    @staticmethod
    def find_category(value: Any, cats: list[dict] | None) -> dict | None:
        raw = _js_trim("" if value is None else str(value))
        if not raw or cats is None:
            return None
        lower = raw.lower()
        slug = slugify_category(raw)
        by_slug = None
        by_name = None
        for c in cats:
            if by_slug is None and (c["slug"] == lower or (slug and c["slug"] == slug)):
                by_slug = c
            if by_name is None and str(c["name"]).lower() == lower:
                by_name = c
        return by_slug or by_name

    def category_slug(self, value: Any, cats: list[dict] | None) -> str:
        """store.categorySlug — 등록된 분류면 그 slug, 아니면 slug화, 그것도 비면 _uncategorized."""
        found = self.find_category(value, cats)
        if found:
            return found["slug"]
        return slugify_category(value) or FALLBACK_SLUG

    # ----- 경로 -----

    def post_path(self, post_id: str, slug: str) -> Path:
        return self.posts_dir / slug / f"{post_id}.md"

    def rel(self, path: Path) -> str:
        return path.relative_to(self.root).as_posix()

    @staticmethod
    def exists_exact(path: Path) -> bool:
        """대소문자까지 같은 파일이 있는가. NTFS는 `foo.md`를 물어도 `Foo.md`를 찾아 주지만 GitHub Pages는 구분한다 —
        is_file()만 믿으면 `Foo.md`를 `foo`로 덮어쓰고 index에는 `foo`가 남아 공개 사이트에서 404가 난다."""
        if not path.is_file():
            return False
        try:
            return path.name in os.listdir(path.parent)
        except OSError:
            return False

    def case_variants(self, post_id: str, folder: Path) -> list[Path]:
        """그 폴더에서 이름의 대소문자만 다른 `.md` 목록(정확히 같은 이름은 제외)."""
        want = f"{post_id}.md"
        try:
            names = os.listdir(folder)
        except OSError:
            return []
        return [folder / n for n in names if n != want and n.lower() == want.lower() and (folder / n).is_file()]

    def candidates(self, post_id: str, hint: str, cats: list[dict] | None, trusted: bool = False) -> list[Path]:
        """store.postCandidates(id, categoryHint, trusted) — 후보 경로 순서 그대로.
        trusted=True면 등록 분류 전수 탐색을 건너뛴다(index.json이 그 글의 분류를 적어 두었을 때)."""
        out: list[Path] = []

        def push(p: Path) -> None:
            if p not in out:
                out.append(p)

        if hint:
            push(self.post_path(post_id, self.category_slug(hint, cats)))
        if not trusted:
            for c in cats or []:
                push(self.post_path(post_id, c["slug"]))
        push(self.posts_dir / f"{post_id}.md")
        push(self.post_path(post_id, FALLBACK_SLUG))
        return out

    def find_existing(self, post_id: str, hint: str, cats: list[dict] | None, trusted: bool = False) -> list[Path]:
        """store.loadPost가 두드리는 순서로 실제 존재하는 파일을 전부 모은다(둘 이상이면 호출부가 409).
        대소문자까지 정확히 같은 파일만 '있다'로 친다(exists_exact)."""
        return [p for p in self.candidates(post_id, hint, cats, trusted) if self.exists_exact(p)]

    def trusted_lookup(self, declared: str, hint: str, cats: list[dict] | None) -> bool:
        """store.loadPost — `declared`(index.json의 category)가 있고, 힌트가 없거나
        `categorySlug(hint) === categorySlug(declared)`이면 전수 탐색을 접는다."""
        return bool(declared) and (not hint or self.category_slug(hint, cats) == self.category_slug(declared, cats))

    # ----- 쓰기 -----

    @staticmethod
    def write_atomic(path: Path, text: str) -> None:
        """임시 파일에 쓴 뒤 os.replace. UTF-8, BOM 없음, LF 유지."""
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, path)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise


# ---------- 요청 검증 ----------

def validate_folder_slug(slug: str) -> None:
    if not slug or not PATH_SAFE_RE.match(slug) or ".." in slug:
        raise PostsError(400, "bad_category",
                         f'"{slug}" 은(는) 폴더명 규칙(영문 소문자·숫자·하이픈)에 맞지 않습니다.')
    if slug in RESERVED_SLUGS:
        raise PostsError(400, "bad_category",
                         f'"{slug}" 은(는) posts/ 안에서 예약된 이름이라 분류 폴더로 쓸 수 없습니다.')


def _string_field(payload: dict, key: str, default: str = "") -> str:
    value = payload.get(key, default)
    if value is None:
        return default
    if not isinstance(value, str):
        raise PostsError(400, "bad_request", f"{key}는 문자열이어야 합니다.")
    return value


def validate_post_payload(post_id: str, payload: Any) -> dict:
    """PUT /api/posts/{id} 본문 검증. 통과하면 {title, summary, created, tags, category, pinned, body, previous_id}."""
    if not isinstance(payload, dict):
        raise PostsError(400, "bad_request", "요청 본문은 JSON 객체여야 합니다.")
    body_id = payload.get("id")
    if body_id not in (None, "") and str(body_id) != post_id:
        raise PostsError(400, "bad_id", f"URL의 id({post_id})와 본문의 id({body_id})가 다릅니다.")
    title = _string_field(payload, "title")
    if not _js_trim(title):
        raise PostsError(400, "bad_request", "제목이 비어 있습니다.")
    body = _string_field(payload, "body")
    if not _js_trim(body):
        raise PostsError(400, "bad_request", "본문이 비어 있습니다.")
    tags = payload.get("tags", [])
    if tags is None:
        tags = []
    if not isinstance(tags, list):
        raise PostsError(400, "bad_request", "tags는 배열이어야 합니다.")
    pinned = payload.get("pinned", False)
    if pinned is None:
        pinned = False
    if not isinstance(pinned, bool):
        raise PostsError(400, "bad_request", "pinned는 true/false여야 합니다.")
    previous_id = _string_field(payload, "previousId")
    if previous_id and not is_safe_id(previous_id):
        raise PostsError(400, "bad_id", "previousId가 파일명 규칙에 맞지 않습니다.")
    return {
        "title": title,
        "summary": _string_field(payload, "summary"),
        "created": _string_field(payload, "created"),
        "tags": to_tag_array(tags),
        "category": _string_field(payload, "category"),
        "pinned": pinned,
        "body": body,
        "previous_id": previous_id,
    }
