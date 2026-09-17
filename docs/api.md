# 로컬 에디터 서버 API v1.0

> **Docker가 있으면 `docker compose up`, 없으면 `start.bat`(저장 API 없음, 내보내기만).**
> 둘 다 5500 포트를 쓴다 — **한 번에 하나만 켠다.**

이 문서는 `frontend-dev-2`가 `write.html`·`js/editor.js`를 서버에 연동할 때의 **단일 진실 공급원**이다.
서버 코드(`server/`)는 이 문서에 맞춘다. 어긋나면 문서가 아니라 코드가 결함이다.

## 0. 원칙

- 서버는 **"에디터가 내보내던 파일을 대신 디스크에 쓴다"** 까지만 한다. 인증·DB·세션·외부 배포 없음.
- 파일 규칙(`id`=파일명, `posts/<slug>/<id>.md`, frontmatter 형식, `index.json` 정렬)은
  `js/store.js`의 `toFrontmatter`·`toMarkdownFile`·`buildIndexJson`·`buildCategoriesJson`·`isSafeId`·`categorySlug`와
  **글자 단위로 같다.** 파이썬 이식은 `server/posts.py`에 있고, 각 함수 주석에 원본 함수명을 적었다.
- **`created`는 불변**(CLAUDE.md 절대 규칙 4). 디스크에 있는 글이면 요청의 `created`를 무시하고 디스크 값을 쓴다.
- **git push는 서버가 하지 않는다.** 서버는 호스트 파일을 쓸 뿐이고, 무엇을 언제 공개할지는 사용자가 호스트에서 `/ship`으로 정한다 — 컨테이너에 자격 증명을 넣지 않기 위해서이기도 하다.
- 바인딩: 호스트에서 `127.0.0.1:5500`만 열린다(`docker-compose.yml`의 `ports`). 컨테이너 안에서는 `0.0.0.0`으로 듣지만 컨테이너 밖으로는 그 포트 매핑 하나뿐이다. 인증 없음, CORS 없음(같은 origin).
- 요청 본문 상한 **2 MB**(`Content-Length` 기준, 초과 시 `413`).
- API 응답은 전부 JSON(UTF-8). 정적 파일은 `Cache-Control: no-store`(start.ps1과 동일).

## 1. 정적 서빙

`GET /` → `index.html`. `GET /<path>` → 프로젝트 루트의 파일(MIME 표는 `start.ps1`과 같음).
다음은 **404**로 감춘다: `server/`, `.git/`, `.claude/`, `docs/`, `Dockerfile*`, `docker-compose*.yml`, `.dockerignore`, `.gitignore`.
`..`로 루트 밖을 가리키면 404. 디렉터리 요청은 `/`(→ `index.html`)만 허용.

## 2. 엔드포인트

### `GET /api/health`
```json
{ "ok": true, "version": "1.0.0", "git": { "branch": "main", "dirty": false } }
```
- `version`: 서버 버전(`server/app.py`의 `SERVER_VERSION`).
- `git.branch`: 현재 브랜치. `git.dirty`: 커밋되지 않은 변경이 있으면 `true`. git을 실행할 수 없으면 `branch`는 `.git/HEAD`에서 읽고 `dirty`는 `null`(확인 불가).
- 에디터의 **서버 감지**는 이 엔드포인트 하나로 한다(§4).

### `GET /api/posts`
`posts/index.json`의 내용 **그대로**(가공 없음). 파일이 없으면 `404`, JSON이 깨졌으면 `409`.

### `GET /api/categories`
`posts/categories.json`의 내용 **그대로**. 없으면 `404`, 깨졌으면 `409`.

### `PUT /api/posts/{id}`
글 하나를 저장한다. `.md`를 쓰고 `index.json`을 갱신한다.

요청 본문 — 에디터가 `.md`로 내보내는 것과 같은 메타 8개 + `body`(+ 선택 1개):
```json
{
  "id": "2026-09-18-css-grid",
  "title": "CSS Grid 정리",
  "summary": "",
  "created": "2026-09-18T10:00:00+09:00",
  "updated": "2026-09-18T10:00:00+09:00",
  "tags": ["css", "layout"],
  "category": "css",
  "pinned": false,
  "body": "## 시작\n\n본문…",
  "previousId": "2026-09-17-css-grid"
}
```
| 필드 | 타입 | 규칙 |
|---|---|---|
| `id` | string | 생략 가능. 있으면 URL의 `{id}`와 같아야 한다(다르면 `400`). `isSafeId` 위반 시 `400`. |
| `title` | string | 필수, 공백만이면 `400`. |
| `summary` | string | 기본 `""`. |
| `created` | string | **기존 글이면 무시하고 디스크 값을 유지.** 새 글이면 무시하고 `now(KST)`. 유일한 예외: 디스크의 글에 `created`가 전혀 없을 때(깨진 frontmatter·index 모두 없음) 요청값을 쓰고, 그것도 비면 `now`. 이 예외는 에디터의 "게시일이 없습니다" 모달(`ensureCreated`)이 사용자에게 확인받은 값을 넘기는 통로다. |
| `updated` | string | 항상 무시. 서버가 `now(KST)`로 찍는다(절대 규칙 4). |
| `tags` | string[] | 각 항목 `String → trim`, 빈 항목 제거(`store.toTagArray`). 배열이 아니면 `400`. |
| `category` | string | **slug**(에디터가 내보내는 값과 동일). frontmatter에는 이 값이 그대로 들어가고, 폴더명은 `categorySlug(category)`로 계산한다. 폴더명이 `index`/`categories`/`posts`이면 `400`. |
| `pinned` | boolean | 기본 `false`. |
| `body` | string | 필수, 공백만이면 `400`. 서버가 끝 공백을 지우고 `\n` 하나로 끝낸다(`toMarkdownFile`). |
| `previousId` | string | 선택. 수정 중 id를 바꿨을 때 옛 id. 옛 `.md`를 지우고 index 항목을 뺀다. `isSafeId` 위반 시 `400`. |

서버 동작(순서대로, 전체가 하나의 락 안에서):
1. `id`·`previousId`·`category` 검증.
2. 기존 글 탐색 — `store.postCandidates`와 같은 순서(index가 적은 분류 → 등록된 분류 전부 → `posts/<id>.md` → `_uncategorized`). 같은 id가 두 폴더 이상에 있으면 `409`.
3. `created` 결정(위 표). `updated = now`.
4. `posts/<slug>/<id>.md`를 **원자적으로** 쓴다(임시 파일 → `os.replace`). 내용 = `toMarkdownFile(meta, body)`.
5. 옛 파일이 다른 경로에 있었으면(분류 변경·id 변경) 지운다. 빈 폴더는 지우지 않는다.
6. `index.json` 재생성 = `buildIndexJson(meta, currentIndex)` (기존 항목은 `normalizeMeta`로 정규화·중복 id 제거·같은 id 교체·`pinned` 우선 → `created` 내림차순). `index.json`이 없으면 `site`는 기본값(`메모 블로그`/`공부한 것을 기록하는 곳`)으로 새로 만든다. JSON이 깨졌으면 **쓰지 않고** `409`.

응답 `200`:
```json
{
  "ok": true,
  "isNew": true,
  "path": "posts/css/2026-09-18-css-grid.md",
  "removed": [],
  "meta": { "id": "…", "title": "…", "summary": "", "created": "…", "updated": "…", "tags": [], "category": "css", "pinned": false }
}
```
`meta`는 실제로 디스크에 쓴 값이다 — 에디터는 응답의 `created`·`updated`로 화면 상태를 덮어쓴다.
`removed`는 지운 옛 파일 경로 목록(분류·id 변경 시).

### `PUT /api/categories`
분류를 **추가·갱신**한다(삭제는 하지 않는다 — 지우려면 `categories.json`을 직접 고친다).
```json
{ "categories": [ { "slug": "css", "name": "CSS", "description": "", "order": 0 } ] }
```
- 에디터가 내보내던 `categories.json` 전체를 그대로 보내면 된다. 서버는 slug 기준으로 **병합**(같은 slug는 요청값으로 교체, 없던 slug는 추가, 요청에 없는 기존 항목은 유지)한 뒤 `buildCategoriesJson` 규칙으로 정렬·`order`를 0부터 다시 매겨 쓴다.
- 각 항목은 `normalizeCategory`를 거친다(`slug = slugifyCategory(slug || name)`). 결과 slug가 비거나 `^[a-z0-9_][a-z0-9_-]*$`에 어긋나거나 `index`/`categories`/`posts`이면 `400`.
- `categories.json`이 없으면 새로 만든다. 깨졌으면 `409`.

응답 `200`: `{ "ok": true, "categories": [ …쓴 목록… ] }`

### `DELETE /api/posts/{id}`
`.md`를 지우고 `index.json`에서 항목을 뺀다.
- 파일도 index 항목도 없으면 `404`. 파일만 없고 index 항목만 있으면 항목만 빼고 `200`(`"fileMissing": true`).
- 같은 id가 두 폴더 이상에 있으면 `409`(손으로 정리한 뒤 재시도).

응답 `200`: `{ "ok": true, "removed": ["posts/css/2026-09-18-css-grid.md"], "fileMissing": false }`

## 3. 오류

본문은 항상 `{ "error": { "code": "…", "message": "한국어 설명" } }`.

| HTTP | `code` | 언제 |
|---|---|---|
| 400 | `bad_id` | `id`·`previousId`가 `isSafeId` 위반, URL과 본문 `id` 불일치 |
| 400 | `bad_category` | 폴더명이 규칙 위반·예약어 |
| 400 | `bad_request` | JSON 파싱 실패, 필수 필드 누락, 타입 오류, 제목·본문 공백 |
| 404 | `not_found` | 글·파일 없음, 감춘 경로, 없는 API |
| 405 | `method_not_allowed` | 잘못된 메서드 |
| 409 | `conflict` | `index.json`/`categories.json`이 JSON으로 읽히지 않음, 같은 id의 `.md`가 여러 폴더에 있음 |
| 413 | `too_large` | 본문 2 MB 초과 |
| 500 | `internal` | 디스크 쓰기 실패 등. `message`에 원인 요약 |

## 4. `frontend-dev-2`가 `js/editor.js`에서 할 일

1. **서버 감지** — 페이지 로드 시 `fetch('/api/health', {cache:'no-store'})`. `res.ok && json.ok === true`이면 "서버 모드". 실패(네트워크 오류·404·`start.ps1`이 준 텍스트 404)는 **조용히** 내보내기 모드로 남는다. 타임아웃 2초 권장(`AbortController`).
2. **저장 버튼** — 서버 모드에서만 보인다/활성화된다. 마크업(클래스명·위치)은 계약서 §6에 `web-designer`가 추가한 것을 따른다. 내보내기 버튼은 그대로 둔다(서버 모드에서도 폴백으로 유효).
3. **PUT 호출** — `doExport`가 만드는 `meta` 객체(8개)에 `body: form.body`를 더하고, 수정 모드에서 `state.originalId !== meta.id`이면 `previousId: state.originalId`를 붙여 `fetch('/api/posts/' + encodeURIComponent(meta.id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })`. `validate`·`ensureUsableCategory`·`ensureCreated`는 내보내기와 똑같이 먼저 거친다. 새 분류(`cats.added.length > 0`)가 있으면 **글보다 먼저** `PUT /api/categories`에 `buildCategoriesJson()` 결과를 보낸다(순서가 바뀌면 글이 미등록 분류로 저장된다).
4. **응답 처리** — `200`이면 `state.created = json.meta.created`, `state.originalId = json.meta.id`, `state.originalCategory = json.meta.category`, `state.originalPath = json.path`, `dirty=false`, `store.draft.clear(state.slot)`(내보내기와 달리 디스크 저장이 확인된 것이므로 초안을 지워도 된다), 상태줄 "저장됨 · `json.path`". 4xx/5xx면 `json.error.message`를 토스트로 그대로 보여 주고 초안은 남긴다. `409`는 "파일을 손으로 정리한 뒤 다시 시도" 안내를 덧붙인다. 네트워크 실패면 "서버가 꺼졌습니다 — 내보내기로 저장하세요"로 폴백을 안내한다.
5. **하지 말 것** — `created`를 클라이언트에서 계산해 덮어쓰지 않는다(서버 응답이 진실). `innerHTML` 직접 대입 금지는 그대로.

## 5. 사용자 검증 체크리스트 (Docker Desktop을 켠 뒤)

- [ ] `docker compose up` → 로그에 `Uvicorn running on http://0.0.0.0:5500` → 브라우저 `http://localhost:5500/`에 목록 화면
- [ ] `http://localhost:5500/api/health` → `{"ok":true,…,"git":{"branch":"main","dirty":…}}`
- [ ] `http://localhost:5500/server/app.py`, `/docs/api.md`, `/.git/HEAD` → 전부 404
- [ ] `/api-check` 스킬 실행 → 픽스처 PUT → GET → DELETE 통과, `git status --short posts/` 비어 있음
- [ ] 컨테이너가 쓴 `posts/_tmp/*.md`가 탐색기에서 사용자 소유로 열리고 지워지는지(Windows Docker Desktop은 문제없음)
- [ ] `Ctrl+C` → 컨테이너 종료, `netstat -ano | findstr :5500` 비어 있음
