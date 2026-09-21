# 로컬 에디터 서버 API v1.1

> **Docker가 있으면 `docker compose up`, 없으면 `start.bat`(저장 API 없음, 내보내기만).**
> 둘 다 5500 포트를 쓴다 — **한 번에 하나만 켠다.**

이 문서는 `frontend-dev-2`가 `write.html`·`js/editor.js`를 서버에 연동할 때의 **단일 진실 공급원**이다.
서버 코드(`server/`)는 이 문서에 맞춘다. 어긋나면 문서가 아니라 코드가 결함이다.

> **v1.1 (2026-09-21, 라운드 6)** — 헬스 축소(`{ok, version}`, `?git=1`) · 자동 커밋(B-1, 응답 `git`) · Host 검사 · 글 찾기·created·정렬 규칙을 `store.js`와 일치 · 대소문자 규칙. 바뀐 절: §0 · §2 health · §2-1(신설) · §2 PUT 표·동작 · §3 · §5 · §6(신설).

## 0. 원칙

- 서버는 **"에디터가 내보내던 파일을 대신 디스크에 쓴다"** 까지만 한다. 인증·DB·세션·외부 배포 없음.
- **규칙의 진실은 `js/store.js`다.** 파일 규칙(`id`=파일명, `posts/<slug>/<id>.md`, frontmatter 형식, `index.json` 정렬, 글 찾기 순서, `created` 병합)은
  `store.js`의 `toFrontmatter`·`toMarkdownFile`·`buildIndexJson`·`buildCategoriesJson`·`isSafeId`·`categorySlug`·`postCandidates`·`mergeMeta`·`byOrder`와
  **글자 단위로 같다.** 파이썬 이식은 `server/posts.py`에 있고, 각 함수 주석에 원본 함수명을 적었다.
  둘이 갈리면 **서버가 결함**이다 — `store.js`를 서버에 맞추지 않는다. 라운드 7 골든 벡터(M4-13)가 이를 기계로 고정한다.
  유일한 서버 전용 규칙은 "화면이 못 보는 상태를 조용히 만들지 않는다"(§2 PUT 동작 2의 409 두 종류)뿐이다.
- **`created`는 불변**(CLAUDE.md 절대 규칙 4). 디스크에 있는 글이면 요청의 `created`를 무시하고 디스크 값을 쓴다.
- **커밋은 하고, push는 하지 않는다**(B-1, 사용자 결정 1 권장안 A). `BLOG_AUTO_COMMIT=1`(compose 기본)이면 저장·삭제 성공 뒤 `posts/`만 커밋한다(§2-1). 무엇을 언제 공개할지는 사용자가 호스트에서 `/ship`으로 정한다 — 컨테이너에 자격 증명을 넣지 않기 위해서다.
- 바인딩: 호스트에서 `127.0.0.1:5500`만 열린다(`docker-compose.yml`의 `ports`). 컨테이너 안에서는 `0.0.0.0`으로 듣지만 컨테이너 밖으로는 그 포트 매핑 하나뿐이다. 인증 없음, CORS 없음(같은 origin).
- **Host 검사**: `Host`가 `localhost`·`127.0.0.1`·`[::1]`(포트 유무 무관)이 아니면 정적·API 모두 `400 bad_host`. DNS 리바인딩(악성 페이지의 도메인을 127.0.0.1로 풀어 이 서버에 닿는 것)을 막는다.
- 요청 본문 상한 **2 MB**(`Content-Length` 기준, 초과 시 `413`).
- API 응답은 전부 JSON(UTF-8). 정적 파일은 `Cache-Control: no-store`(start.ps1과 동일).

## 1. 정적 서빙

`GET /` → `index.html`. `GET /<path>` → 프로젝트 루트의 파일(MIME 표는 `start.ps1`과 같음).
다음은 **404**로 감춘다: `server/`, `.git/`, `.claude/`, `docs/`, `Dockerfile*`, `docker-compose*.yml`, `.dockerignore`, `.gitignore`.
`..`로 루트 밖을 가리키면 404. 디렉터리 요청은 `/`(→ `index.html`)만 허용.

## 2. 엔드포인트

### `GET /api/health`
```json
{ "ok": true, "version": "1.1.0" }
```
- **이것뿐이다.** 프로세스를 띄우지 않으므로 항상 수 ms 안에 답한다(M4-1 — 이전엔 매 호출 `git status`라 bind mount에서 수 초가 걸려 에디터의 2초 타임아웃에 걸릴 수 있었다).
- `version`: 서버 버전(`server/app.py`의 `SERVER_VERSION`).
- **`?git=1`**일 때만 `"git": { "branch": "main", "dirty": false }`가 더해진다(느릴 수 있음, 최대 30초). `dirty`는 커밋되지 않은 변경이 있으면 `true`, git을 실행할 수 없으면 `null`. 에디터는 이 필드를 쓰지 않는다 — 사람이 `/serve`에서 확인할 때만.
- 에디터의 **서버 감지**는 이 엔드포인트 하나로 한다(§4).

### 2-1. 자동 커밋 (B-1, meeting-05)

`BLOG_AUTO_COMMIT=1`(`docker-compose.yml` 기본값. `.env`에 `BLOG_AUTO_COMMIT=0`이면 끔)이면
`PUT /api/posts/{id}`·`DELETE /api/posts/{id}`가 **파일을 다 쓴 뒤** 같은 락 안에서:

```
git add -A -- posts/
git commit --only -m "글: <title> (<id>)" -- posts/        # 삭제는 "글 삭제: <title> (<id>)"
```

- **`posts/`만** 스테이징·커밋한다. 다른 경로에 사용자가 스테이징해 둔 것은 건드리지 않는다(`--only` + pathspec).
- **커밋 신원**: `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL` env(`.env`, `.gitignore`됨) → 없으면 마운트된 저장소의 로컬 설정(`git config user.name`/`user.email` — 전역 설정은 컨테이너가 못 본다) → 그것도 없으면 **커밋을 건너뛰고** `reason`에 적는다.
- **커밋 실패는 저장 실패가 아니다.** 응답은 여전히 `200`이고 `git.committed:false`다. 파일은 이미 디스크에 있다.
- 줄끝: 서버는 LF로 쓰고 `-c core.autocrlf=true`로 add하므로 인덱스는 LF다. 호스트(`autocrlf=true`)에서 커밋 직후 `git status --short posts/`가 비어야 한다 — **실측 대기**(§5-1: 2026-09-21 Docker Desktop 기동 실패).
- **push는 하지 않는다.** 공개는 `/ship`. (사용자 결정 1에서 (B)를 고르면 이 절이 바뀐다.)

응답의 `git` 필드(저장·삭제 공통, `BLOG_AUTO_COMMIT`이 꺼져 있으면 **필드 자체가 없다**):
```json
"git": { "committed": true,  "hash": "abc1234" }
"git": { "committed": false, "reason": "커밋 신원이 없습니다 — …" }
```
에디터(frontend-dev-2)는 `json.git`이 있으면 상태줄에 "· 커밋 abc1234" 또는 "· 커밋 실패: reason"을 덧붙인다.

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
| `created` | string | **기존 글이면 무시하고 디스크 값을 유지.** 새 글이면 무시하고 `now(KST)`. 디스크 값은 `store.mergeMeta`와 같은 순서로 정한다: `.md`에 `created` **키가 있으면** 그 값(비어 있으면 `.md`의 `updated` → id 앞머리 `YYYY-MM-DD`), 키가 없으면 `index.json`의 `created`(→ `updated` → id 날짜). 이 순서로도 비는 경우(깨진 frontmatter + index에도 없음 + id에 날짜 없음)에만 요청값을 쓰고, 그것도 비면 `now`. 이 마지막 예외는 에디터의 "게시일이 없습니다" 모달(`ensureCreated`)이 사용자에게 확인받은 값을 넘기는 통로다. |
| `updated` | string | 항상 무시. 서버가 `now(KST)`로 찍는다(절대 규칙 4). |
| `tags` | string[] | 각 항목 `String → trim`, 빈 항목 제거(`store.toTagArray`). 배열이 아니면 `400`. |
| `category` | string | **slug**(에디터가 내보내는 값과 동일). frontmatter에는 이 값이 그대로 들어가고, 폴더명은 `categorySlug(category)`로 계산한다. 폴더명이 `index`/`categories`/`posts`이면 `400`. |
| `pinned` | boolean | 기본 `false`. |
| `body` | string | 필수, 공백만이면 `400`. 서버가 끝 공백을 지우고 `\n` 하나로 끝낸다(`toMarkdownFile`). |
| `previousId` | string | 선택. 수정 중 id를 바꿨을 때 옛 id. 옛 `.md`를 지우고 index 항목을 뺀다. `isSafeId` 위반 시 `400`. |

서버 동작(순서대로, 전체가 하나의 락 안에서):
1. `id`·`previousId`·`category` 검증.
2. 기존 글 탐색 — `store.loadPost`와 같다. `index.json`이 그 글의 분류를 적어 뒀으면 **그 폴더 → `posts/<id>.md` → `_uncategorized`만** 본다(신뢰 탐색, `postCandidates(id, hint, trusted=true)`). index에 없으면 요청의 분류 폴더 → 등록된 분류 전부 → 평면 → `_uncategorized`(전수 탐색). 같은 id가 두 곳 이상에 있으면 `409`. **서버 전용 안전장치 둘**(둘 다 `409 conflict`, 저장하지 않음): ① 신뢰 탐색으로는 없는데 다른 폴더에 같은 id가 있으면 — 화면은 "없습니다"인데 서버만 저장에 성공하는 상태를 만들지 않는다. ② 같은 폴더에 **대소문자만 다른** 파일이 있으면 — NTFS는 같은 파일로, GitHub Pages는 다른 파일로 보기 때문(§6-1).
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
  "meta": { "id": "…", "title": "…", "summary": "", "created": "…", "updated": "…", "tags": [], "category": "css", "pinned": false },
  "git": { "committed": true, "hash": "abc1234" }
}
```
`meta`는 실제로 디스크에 쓴 값이다 — 에디터는 응답의 `created`·`updated`로 화면 상태를 덮어쓴다.
`removed`는 지운 옛 파일 경로 목록(분류·id 변경 시). `git`은 §2-1(자동 커밋이 꺼져 있으면 없음).

### `PUT /api/categories`
분류를 **추가·갱신**한다(삭제는 하지 않는다 — 지우려면 `categories.json`을 직접 고친다).
```json
{ "categories": [ { "slug": "css", "name": "CSS", "description": "", "order": 0 } ] }
```
- 에디터가 내보내던 `categories.json` 전체를 그대로 보내면 된다. 서버는 slug 기준으로 **병합**(같은 slug는 요청값으로 교체, 없던 slug는 추가, 요청에 없는 기존 항목은 유지)한 뒤 `buildCategoriesJson` 규칙으로 정렬·`order`를 0부터 다시 매겨 쓴다. 정렬은 `order` 오름차순, 같으면 이름을 `localeCompare(…, 'ko')` 규칙으로 — 서버는 ko 로케일 없이 명시 규칙(`posts.py _collate_ko`: casefold 코드포인트 → 소문자 먼저)으로 근사한다.
- 각 항목은 `normalizeCategory`를 거친다(`slug = slugifyCategory(slug || name)`). 결과 slug가 비거나 `^[a-z0-9_][a-z0-9_-]*$`에 어긋나거나 `index`/`categories`/`posts`이면 `400`.
- `categories.json`이 없으면 새로 만든다. 깨졌으면 `409`.

응답 `200`: `{ "ok": true, "categories": [ …쓴 목록… ] }`

### `DELETE /api/posts/{id}`
`.md`를 지우고 `index.json`에서 항목을 뺀다.
- 파일도 index 항목도 없으면 `404`. 파일만 없고 index 항목만 있으면 항목만 빼고 `200`(`"fileMissing": true`).
- 같은 id가 두 폴더 이상에 있으면 `409`(손으로 정리한 뒤 재시도).

응답 `200`: `{ "ok": true, "removed": ["posts/css/2026-09-18-css-grid.md"], "fileMissing": false, "git": { … } }` — `git`은 §2-1.

## 3. 오류

본문은 항상 `{ "error": { "code": "…", "message": "한국어 설명" } }`.

| HTTP | `code` | 언제 |
|---|---|---|
| 400 | `bad_id` | `id`·`previousId`가 `isSafeId` 위반, URL과 본문 `id` 불일치 |
| 400 | `bad_category` | 폴더명이 규칙 위반·예약어 |
| 400 | `bad_request` | JSON 파싱 실패, 필수 필드 누락, 타입 오류, 제목·본문 공백 |
| 400 | `bad_host` | `Host` 헤더가 `localhost`·`127.0.0.1`·`[::1]`이 아님(§0) |
| 404 | `not_found` | 글·파일 없음, 감춘 경로, 없는 API |
| 405 | `method_not_allowed` | 잘못된 메서드 |
| 409 | `conflict` | `index.json`/`categories.json`이 JSON으로 읽히지 않음, 같은 id의 `.md`가 여러 폴더에 있음, index가 가리키는 폴더 밖에 같은 id가 있음, 대소문자만 다른 파일이 있음(§2 동작 2) |
| 413 | `too_large` | 본문 2 MB 초과 |
| 500 | `internal` | 디스크 쓰기 실패 등. `message`에 원인 요약 |

## 4. `frontend-dev-2`가 `js/editor.js`에서 할 일

1. **서버 감지** — 페이지 로드 시 `fetch('/api/health', {cache:'no-store'})`. `res.ok && json.ok === true`이면 "서버 모드". 실패(네트워크 오류·404·`start.ps1`이 준 텍스트 404)는 **조용히** 내보내기 모드로 남는다. 타임아웃 2초 권장(`AbortController`).
2. **저장 버튼** — 서버 모드에서만 보인다/활성화된다. 마크업(클래스명·위치)은 계약서 §6에 `web-designer`가 추가한 것을 따른다. 내보내기 버튼은 그대로 둔다(서버 모드에서도 폴백으로 유효).
3. **PUT 호출** — `doExport`가 만드는 `meta` 객체(8개)에 `body: form.body`를 더하고, 수정 모드에서 `state.originalId !== meta.id`이면 `previousId: state.originalId`를 붙여 `fetch('/api/posts/' + encodeURIComponent(meta.id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })`. `validate`·`ensureUsableCategory`·`ensureCreated`는 내보내기와 똑같이 먼저 거친다. 새 분류(`cats.added.length > 0`)가 있으면 **글보다 먼저** `PUT /api/categories`에 `buildCategoriesJson()` 결과를 보낸다(순서가 바뀌면 글이 미등록 분류로 저장된다).
4. **응답 처리** — `200`이면 `state.created = json.meta.created`, `state.originalId = json.meta.id`, `state.originalCategory = json.meta.category`, `state.originalPath = json.path`, `dirty=false`, `store.draft.clear(state.slot)`(내보내기와 달리 디스크 저장이 확인된 것이므로 초안을 지워도 된다), 상태줄 "저장됨 · `json.path`". `json.git`이 있으면 "· 커밋 `hash`" 또는 "· 커밋 실패: `reason`"을 덧붙인다(§2-1). 4xx/5xx면 `json.error.message`를 토스트로 그대로 보여 주고 초안은 남긴다. `409`는 "파일을 손으로 정리한 뒤 다시 시도" 안내를 덧붙인다. 네트워크 실패면 "서버가 꺼졌습니다 — 내보내기로 저장하세요"로 폴백을 안내한다.
5. **하지 말 것** — `created`를 클라이언트에서 계산해 덮어쓰지 않는다(서버 응답이 진실). `innerHTML` 직접 대입 금지는 그대로.

## 5. 검증 기록 (Docker Desktop을 켠 뒤 `/api-check`)

| 날짜 | 기준 | 결과 |
|---|---|---|
| 2026-09-18 | v1.0, HEAD `e9a2843` | **통과** — 첫 기동(이미지 빌드), 헬스 200, 감춘 경로 404, 픽스처 PUT(새 글 `created`=now, 요청의 2000-01-01 무시) → 2차 PUT(`created` 불변·`updated`만 갱신) → 오류 4종 → DELETE → `git status --short posts/` 빈 출력 |
| 2026-09-21 | v1.1, 라운드 6 | **미실측** — Docker Desktop이 stale 소켓 오류로 기동 실패(§5-1). 코드 리뷰만 |

- [x] `docker compose up` → 로그에 `Uvicorn running on http://0.0.0.0:5500` → 브라우저 `http://localhost:5500/`에 목록 화면 (9/18)
- [ ] `http://localhost:5500/api/health` → `{"ok":true,"version":"1.1.0"}` 수 ms · `?git=1` → `git.branch`·`dirty` (v1.1 미실측)
- [x] `http://localhost:5500/server/app.py`, `/docs/api.md`, `/.git/HEAD` → 전부 404 (9/18)
- [x] `/api-check` → 픽스처 PUT → GET → DELETE 통과, `git status --short posts/` 비어 있음 (9/18 v1.0) · [ ] v1.1 자동 커밋·409 두 종류·Host 400 (미실측)
- [x] 컨테이너가 쓴 `posts/_tmp/*.md`가 호스트에서 사용자 소유로 열리고 지워짐 (9/18)
- [x] `docker compose down` → `netstat -ano | findstr :5500` 비어 있음 (9/18)

### 5-1. 2026-09-21 라운드 6 — v1.1 실측 못 함

`/api-check` v2는 **샌드박스 클론**(`git clone` + 작업 트리 덮어쓰기)을 `docker compose --project-directory <클론>`으로 마운트해 돌린다 — 자동 커밋이 프로젝트 이력에 남지 않는다. 클론(`sandbox-api`)까지 만들었으나 Docker Desktop 4.89가 `sailor-ingest.sock` stale 소켓 오류로 엔진을 못 띄웠다(이 PC 환경 문제, 재부팅 필요 — `/serve` 포트 충돌 표). 이 PC에는 Python이 없어 v1.1 코드는 **문법 검사도 못 했다**. 다음 세션 첫 일: Docker 기동 → `/api-check` 전체(§2 자동 커밋·CRLF, §4 409 두 종류·Host 400) → 이 표 갱신.

## 6. 규칙 메모 (결정 근거)

### 6-1. id 대소문자 — 소문자를 강제하지 않는다

`isSafeId`(`store.js:566`)는 대문자를 허용하고, 그 규칙의 진실은 `store.js`다(§0). 서버가 소문자를 강제하면 브라우저는 `Foo`를 유효한 id로 보는데 서버만 거절하는 불일치가 생긴다.
대신 **파일 존재 판정을 대소문자까지 정확히**(`Repo.exists_exact` — `os.listdir` 이름 대조) 한다. NTFS는 `foo.md`를 물어도 `Foo.md`를 찾아 주지만 GitHub Pages(Linux)는 구분하므로, `is_file()`만 믿으면 `Foo.md`를 `foo`로 덮어쓰고 index에는 `foo`가 남아 공개 사이트에서 404가 난다.
같은 폴더에 대소문자만 다른 파일이 있으면 `409 conflict`(§2 동작 2 ②). 에디터가 자동으로 짓는 id(`util.slugAscii`)는 소문자라 일상 흐름에서는 걸리지 않는다.

### 6-2. 낙관적 잠금(`updated` 비교 → 409) — 검토 결과: 이번엔 넣지 않는다

두 탭·두 기기에서 같은 글을 고치다 나중 저장이 먼저 저장을 덮는 문제는 실재한다. 그러나 (1) 이 서버는 `127.0.0.1` 한 사용자용이고 동시 편집자는 "나 자신의 다른 탭"뿐이며, (2) 자동 커밋(§2-1)이 저장마다 커밋을 남겨 덮어써도 `git log -- posts/<slug>/<id>.md`로 되돌릴 수 있고, (3) 요청에 `updated`를 실어 비교하려면 에디터가 "마지막으로 본 `updated`"를 들고 있어야 해서 `editor.js` 상태가 하나 더 는다(라운드 7 분리 뒤가 맞다).
대신 meeting-04 경미 항목대로 에디터가 `storage` 이벤트로 다른 탭의 초안 변경을 감지해 경고한다(frontend-dev-2). 서버 측 잠금은 **두 기기 동시 편집이 실제로 생기면** `If-Unmodified-Since` 유사(`expectedUpdated` 필드 → 디스크 `updated`와 다르면 `409 stale`)로 넣는다 — 스키마 변경 없이 선택 필드 하나로 가능하다.
