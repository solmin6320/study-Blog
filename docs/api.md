# 로컬 에디터 서버 API v1.2

> **글 저장은 이 서버(Docker, `docker compose up`) 하나로만 한다 — 저장 단일 모드(계약 v3.9 §6-1, 내보내기 폐지).**
> Docker가 없는 PC의 `start.bat`은 `start.ps1`(정적 미리보기, 저장 API 없음)로 떨어진다 — 글을 쓸 수는 있지만 **저장할 수 없다.**
> 둘 다 5500 포트를 쓴다 — **한 번에 하나만 켠다.**

이 문서는 `frontend-dev-2`가 `write.html`·`js/editor.js`를 서버에 연동할 때의 **단일 진실 공급원**이다.
서버 코드(`server/`)는 이 문서에 맞춘다. 어긋나면 문서가 아니라 코드가 결함이다.

> **v1.2 (2026-09-23, 라운드 9 — meeting-08 D1·D11·D25·충돌 9·10)** — **덮어쓰기 차단**: PUT 선택 필드 `ifNew`·`expectedUpdated` 신설,
> `previousId`로 기존 id를 덮는 길 차단 → 새 오류 코드 `409 exists`·`409 stale`(오류 객체에 추가 필드, §3-1) · **정적 서빙 허용 목록**(차단 목록 폐기, 대소문자까지 정확히) ·
> **자동 커밋 범위 = 이번 요청이 쓴 파일만**, 분류 저장도 커밋 · `git.reason` 60자 상한 + `detail` · CORS 금지 규칙 명문화 · 골든 벡터는 **미구현**으로 정정.
> 바뀐 절: §0 · §1 · §2-1 · §2 PUT 표·동작 · `PUT /api/categories` 응답 · §3·§3-1(신설) · §4-3·§4-4 · §5 · §6-2.
> 하위 호환: v1.2 필드를 보내지 않는 요청은 v1.1과 같이 동작한다(upsert). **그래서 에디터가 필드를 보내야 보호가 켜진다**(§4).
> **실측: 미실시**(Docker·커밋 신원 없음, meeting-08 U1 건너뜀). git 명령 순서만 스크래치 저장소에서 확인했다(§5).
> **v1.1 (2026-09-21, 라운드 6)** — 헬스 축소(`{ok, version}`, `?git=1`) · 자동 커밋(B-1, 응답 `git`) · Host 검사 · 글 찾기·created·정렬 규칙을 `store.js`와 일치 · 대소문자 규칙.
> **2026-09-22 (라운드 8, 문서만)** — 내보내기 폐지(계약 v3.9 §6-1)에 맞춰 머리말·§4 문장 정리.

## 0. 원칙

- 서버는 **"에디터가 내보내던 파일을 대신 디스크에 쓴다"** 까지만 한다. 인증·DB·세션·외부 배포 없음.
- **규칙의 진실은 `js/store.js`다.** 파일 규칙(`id`=파일명, `posts/<slug>/<id>.md`, frontmatter 형식, `index.json` 정렬, 글 찾기 순서, `created` 병합)은
  `store.js`의 `toFrontmatter`·`toMarkdownFile`·`buildIndexJson`·`buildCategoriesJson`·`isSafeId`·`categorySlug`·`postCandidates`·`mergeMeta`·`byOrder`와
  **글자 단위로 같아야 한다.** 파이썬 이식은 `server/posts.py`에 있고, 각 함수 주석에 원본 함수명을 적었다.
  둘이 갈리면 **서버가 결함**이다 — `store.js`를 서버에 맞추지 않는다.
  **골든 벡터(두 구현의 동일성을 기계로 재는 입력·기대값 표, M4-13)는 미구현이다.** 지금 동일성은 사람의 코드 대조로만 확인돼 있다.
  사용자가 재개를 결정했다(2026-09-23, HANDOFF §9 U4) — 이월 백로그 B8-11.
- **서버 전용 규칙**은 "화면이 못 보는 상태·남의 글을 덮는 상태를 조용히 만들지 않는다" 하나뿐이다: §2 PUT 동작 2의 `409 conflict` 두 종류와 동작 3의 `409 exists`·`409 stale`. 전부 **저장하지 않고** 거절한다.
- **`created`는 불변**(CLAUDE.md 절대 규칙 4). 디스크에 있는 글이면 요청의 `created`를 무시하고 디스크 값을 쓴다.
- **커밋은 하고, push는 하지 않는다**(B-1, 사용자 결정 1 권장안 A). `BLOG_AUTO_COMMIT=1`(compose 기본)이면 저장·삭제·분류 저장 성공 뒤 **그 요청이 쓰거나 지운 파일만** 커밋한다(§2-1). 무엇을 언제 공개할지는 사용자가 호스트에서 `/ship`으로 정한다 — 컨테이너에 자격 증명을 넣지 않기 위해서다.
- 바인딩: 호스트에서 `127.0.0.1:5500`만 열린다(`docker-compose.yml`의 `ports`). 컨테이너 안에서는 `0.0.0.0`으로 듣지만 컨테이너 밖으로는 그 포트 매핑 하나뿐이다. 인증 없음.
- **CORS를 열지 않는다(금지 규칙).** 에디터는 같은 origin에서 부르므로 CORS가 필요 없다. `PUT`·`DELETE`는 preflight 대상이라, CORS 응답 헤더가 없으면 다른 origin의 악성 페이지가 저장·삭제 API를 부를 수 없다 — **인증이 없는 이 서버의 유일한 CSRF 방어다.** "편의로" `CORSMiddleware`를 붙이거나 `Access-Control-Allow-*`를 내보내면 그 방어가 사라진다. POST·GET으로 쓰기를 하는 엔드포인트도 만들지 않는다(단순 요청은 preflight 없이 날아온다).
- **Host 검사**: `Host`가 `localhost`·`127.0.0.1`·`[::1]`(포트 유무 무관)이 아니면 정적·API 모두 `400 bad_host`. DNS 리바인딩(악성 페이지의 도메인을 127.0.0.1로 풀어 이 서버에 닿는 것)을 막는다.
- 요청 본문 상한 **2 MB**(`Content-Length` 기준, 초과 시 `413`).
- API 응답은 전부 JSON(UTF-8). 정적 파일은 `Cache-Control: no-store`(start.ps1과 동일).

## 1. 정적 서빙 — 허용 목록 (v1.2)

`GET /` → `index.html`. **다음만 서빙하고 나머지는 전부 404**(`server/app.py` `STATIC_ROOT_FILES`·`STATIC_DIRS`):

| 종류 | 허용 |
|---|---|
| 루트 파일 | `index.html` `post.html` `write.html` `.nojekyll` `favicon.ico` |
| 폴더(그 아래 파일) | `css/` `js/` `posts/` |

- 첫 경로 조각은 **소문자로 접어** 목록과 비교한다 — `/Server/app.py`·`/.ENV`·`/DOCS/x` 같은 대소문자 변형도 목록 밖이라 404.
- 그리고 실제 파일은 **모든 경로 조각이 대소문자까지 정확히** 같아야 서빙한다(`/CSS/tokens.css`는 NTFS에서는 열리지만 GitHub Pages에서는 404이므로 로컬도 404 — §6-1과 같은 이유).
- 허용 폴더 안이라도 **`.`으로 시작하는 조각**이 있으면 404(원자적 쓰기의 임시 파일 `posts/<slug>/.<id>.md.xxxx.tmp`, 숨김 파일). 루트 `.nojekyll`만 예외.
- v1.1은 차단 목록(`server/` `.git/` `.claude/` `docs/` `Dockerfile*` …)이었다. 차단 목록은 **새 파일이 기본 노출**이라, 커밋 신원을 적으려고 `.env`를 만드는 순간 `/.env`가 서빙됐다(meeting-08 D25). 사이트에 새 최상위 파일·폴더가 생기면(예: 이미지 폴더를 루트에 둔다면) **이 표를 먼저 고친다.** 글의 이미지는 `posts/<분류>/img/` 아래에 두므로(2026-09-23 U4 "규칙만") 표를 바꿀 일이 없다.
- `..`·빈 조각은 404. 디렉터리 요청은 `/`(→ `index.html`)만 허용.

## 2. 엔드포인트

### `GET /api/health`
```json
{ "ok": true, "version": "1.2.0" }
```
- **이것뿐이다.** 프로세스를 띄우지 않으므로 항상 수 ms 안에 답한다(M4-1).
- `version`: 서버 버전(`server/app.py`의 `SERVER_VERSION`). 에디터는 v1.2 필드를 쓰기 전에 이 값을 볼 필요가 없다 — v1.1 서버는 모르는 필드를 무시한다(보호만 꺼진다).
- **`?git=1`**일 때만 `"git": { "branch": "main", "dirty": false }`가 더해진다(느릴 수 있음, 최대 30초). `dirty`는 커밋되지 않은 변경이 있으면 `true`, git을 실행할 수 없으면 `null`. 에디터는 이 필드를 쓰지 않는다 — 사람이 `/serve`에서 확인할 때만.
- 에디터의 **서버 감지**는 이 엔드포인트 하나로 한다(§4).

### 2-1. 자동 커밋 (B-1 · v1.2 범위 축소)

`BLOG_AUTO_COMMIT=1`(`docker-compose.yml` 기본값. `.env`에 `BLOG_AUTO_COMMIT=0`이면 끔)이면 아래 세 요청이 **파일을 다 쓴 뒤** 같은 락 안에서 커밋한다.

| 요청 | 커밋에 넣는 경로(이것만) | 메시지 |
|---|---|---|
| `PUT /api/posts/{id}` | 쓴 `.md` + `posts/index.json` + 응답 `removed`의 옛 파일(분류·id 변경) | `글: <title> (<id>)` |
| `DELETE /api/posts/{id}` | 응답 `removed`의 파일 + `posts/index.json` | `글 삭제: <title> (<id>)` |
| `PUT /api/categories` | `posts/categories.json` | `분류 추가: <새 slug, …>` 또는(새 slug가 없으면) `분류 갱신` |

```
git add -A -- <위 경로>
git commit --only -m "<메시지>" -- <위 경로>
```

- **그 요청이 쓰거나 지운 파일만** 스테이징·커밋한다. v1.1은 `posts/` 전체를 쓸어 담아 **사용자가 손으로 고치던 다른 글까지** `글: 제목` 커밋에 섞였고, 분류 저장은 커밋하지 않아 다음 글 커밋에 `categories.json`이 섞였다(meeting-08 D25). 다른 경로에 사용자가 스테이징해 둔 것도 건드리지 않는다(`--only` + pathspec).
- 추적된 적 없는 파일을 지운 경로, 스테이징만 됐다가 지워진 경로는 git이 모르는 경로라 pathspec에서 뺀다(넣으면 add·commit이 통째로 실패한다 — 2026-09-23 스크래치 저장소에서 확인).
- **커밋 신원**: `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL` env(`.env`, `.gitignore`됨) → 없으면 마운트된 저장소의 로컬 설정(`git config user.name`/`user.email` — 전역 설정은 컨테이너가 못 본다) → 그것도 없으면 **커밋을 건너뛰고** `reason`에 적는다. 첫 기동 전 확인 절차는 `/serve` §0.
- **커밋 실패는 저장 실패가 아니다.** 응답은 여전히 `200`이고 `git.committed:false`다. 파일은 이미 디스크에 있다.
- 줄끝: 서버는 LF로 쓰고 `-c core.autocrlf=true`로 add하므로 인덱스는 LF다. 호스트(`autocrlf=true`)에서 커밋 직후 `git status --short posts/`가 비어야 한다 — **실측 대기**(§5).
- **push는 하지 않는다.** 공개는 `/ship`.

응답의 `git` 필드(세 요청 공통, `BLOG_AUTO_COMMIT`이 꺼져 있으면 **필드 자체가 없다**):
```json
"git": { "committed": true,  "hash": "abc1234" }
"git": { "committed": false, "reason": "커밋 신원 없음", "detail": ".env에 BLOG_GIT_NAME·BLOG_GIT_EMAIL을 적거나 … 재기동하세요." }
```
- **`reason`은 60자 이하의 짧은 명사구**다(v1.2, meeting-08 D11 — 에디터 상태줄에 그대로 붙어 줄 높이가 폭주했다). 지금 나오는 값은 다섯 개뿐이다: `커밋 신원 없음` · `커밋할 변경 없음` · `git add 실패` · `git commit 실패` · `git 실행 실패`.
- **`detail`**(선택, 최대 300자)은 원인·해결 방법·git의 원문 오류다. 상태줄에 붙이지 않는다 — 보여 준다면 토스트·툴팁 같은 보조 자리에(계약 §6-1이 정한다).
- 에디터(frontend-dev-2)는 `json.git`이 있으면 상태줄에 "· 커밋 abc1234" 또는 "· 커밋 실패: `reason`"을 덧붙인다.

### `GET /api/posts`
`posts/index.json`의 내용 **그대로**(가공 없음). 파일이 없으면 `404`, JSON이 깨졌으면 `409`.

### `GET /api/categories`
`posts/categories.json`의 내용 **그대로**. 없으면 `404`, 깨졌으면 `409`.

### `PUT /api/posts/{id}`
글 하나를 저장한다. `.md`를 쓰고 `index.json`을 갱신한다.

요청 본문 — 에디터가 만드는 메타 8개 + `body`(+ 선택 필드):
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

  "ifNew": true
}
```
수정 모드 예(id를 바꾸지 않음): `…, "expectedUpdated": "2026-09-18T10:00:00+09:00"` · id를 바꿈: `…, "previousId": "2026-09-17-css-grid", "expectedUpdated": "…"`.

| 필드 | 타입 | 규칙 |
|---|---|---|
| `id` | string | 생략 가능. 있으면 URL의 `{id}`와 같아야 한다(다르면 `400`). `isSafeId` 위반 시 `400`. |
| `title` | string | 필수, 공백만이면 `400`. |
| `summary` | string | 기본 `""`. |
| `created` | string | **기존 글이면 무시하고 디스크 값을 유지.** 새 글이면 무시하고 `now(KST)`. 디스크 값은 `store.mergeMeta`와 같은 순서로 정한다: `.md`에 `created` **키가 있으면** 그 값(비어 있으면 `.md`의 `updated` → id 앞머리 `YYYY-MM-DD`), 키가 없으면 `index.json`의 `created`(→ `updated` → id 날짜). id를 바꾼 저장(`previousId`)이면 **옛 id의 글**에서 이 순서로 찾는다. 이 순서로도 비는 경우(깨진 frontmatter + index에도 없음 + id에 날짜 없음)에만 요청값을 쓰고, 그것도 비면 `now`. 이 마지막 예외는 에디터의 "게시일이 없습니다" 모달(`ensureCreated`)이 사용자에게 확인받은 값을 넘기는 통로다. |
| `updated` | string | 항상 무시. 서버가 `now(KST)`로 찍는다(절대 규칙 4). 기준 버전 비교는 이 필드가 아니라 `expectedUpdated`로 한다. |
| `tags` | string[] | 각 항목 `String → trim`, 빈 항목 제거(`store.toTagArray`). 배열이 아니면 `400`. |
| `category` | string | **slug**(에디터가 보내는 값). frontmatter에는 이 값이 그대로 들어가고, 폴더명은 `categorySlug(category)`로 계산한다. 폴더명이 `index`/`categories`/`posts`이면 `400`. |
| `pinned` | boolean | 기본 `false`. |
| `body` | string | 필수, 공백만이면 `400`. 서버가 끝 공백을 지우고 `\n` 하나로 끝낸다(`toMarkdownFile`). |
| `previousId` | string | 선택. 수정 중 id를 바꿨을 때 옛 id. 옛 `.md`를 지우고 index 항목을 뺀다. `isSafeId` 위반 시 `400`. **새 id에 이미 글이 있으면 언제나 `409 exists`**(v1.2 — v1.1은 그 글을 덮어쓰고 그 글의 `created`를 물려받았다). |
| **`ifNew`** | boolean | **v1.2 선택.** `true` = "새 글이다". 대상 id가 `index.json`에 있거나 `posts/` 어디에든(바로 아래 + **모든** 하위 폴더 한 단계, 등록 안 된 폴더 포함, **대소문자 무시**) `<id>.md`가 있으면 **`409 exists`**, 저장하지 않는다. `true`/`false`/`null`(=false)만 허용, 그 밖의 타입은 `400`. |
| **`expectedUpdated`** | string | **v1.2 선택.** 에디터가 글을 불러왔을 때(또는 마지막으로 저장했을 때) 본 `updated`. **편집하던 글**(`previousId`가 있으면 옛 id, 없으면 이 id)의 지금 디스크 `updated`(`created`와 같은 병합 규칙 — `store.loadPost`가 보여 주는 값)와 다르면 **`409 stale`**, 저장하지 않는다. 그 글이 파일·index 어디에도 없어도 `409 stale`(`currentUpdated:null`). 비교는 글자 같음, 다르면 둘 다 시간대 있는 ISO 8601일 때 같은 순간인지(`+09:00`↔`Z` 표기 차이 허용). 빈 문자열·생략이면 비교하지 않는다. |

`ifNew:true`와 `previousId`·`expectedUpdated`를 함께 보내면 `400 bad_request`(새 글에는 옛 id도 기준 버전도 없다).

서버 동작(순서대로, 전체가 하나의 락 안에서):
1. `id`·`previousId`·`category`·`ifNew`·`expectedUpdated` 검증.
2. **덮어쓰기 차단(v1.2)** — 파일을 찾거나 정리하기 **전에** 본다. `ifNew:true`면, 또는 `previousId`가 있으면(그 옛 파일 자신은 빼고) 대상 id가 index나 `posts/` 어디에든 있을 때 `409 exists`. 409면 디스크는 한 바이트도 바뀌지 않는다.
3. 기존 글 탐색 — `store.loadPost`와 같다. `index.json`이 그 글의 분류를 적어 뒀으면 **그 폴더 → `posts/<id>.md` → `_uncategorized`만** 본다(신뢰 탐색, `postCandidates(id, hint, trusted=true)`). index에 없으면 요청의 분류 폴더 → 등록된 분류 전부 → 평면 → `_uncategorized`(전수 탐색). 같은 id가 두 곳 이상에 있으면 `409 conflict`. **안전장치 둘**(둘 다 `409 conflict`): ① 신뢰 탐색으로는 없는데 다른 폴더에 같은 id가 있으면 — 화면은 "없습니다"인데 서버만 저장에 성공하는 상태를 만들지 않는다. ② 같은 폴더에 **대소문자만 다른** 파일이 있으면 — NTFS는 같은 파일로, GitHub Pages는 다른 파일로 보기 때문(§6-1).
4. **기준 버전 확인(v1.2)** — `expectedUpdated`가 있으면 편집하던 글의 디스크 `updated`와 비교, 다르거나 글이 없으면 `409 stale`.
5. `created` 결정(위 표). `updated = now`.
6. `posts/<slug>/<id>.md`를 **원자적으로** 쓴다(임시 파일 → `os.replace`). 내용 = `toMarkdownFile(meta, body)`.
7. 옛 파일이 다른 경로에 있었으면(분류 변경·id 변경) 지운다. 빈 폴더는 지우지 않는다.
8. `index.json` 재생성 = `buildIndexJson(meta, currentIndex)` (기존 항목은 `normalizeMeta`로 정규화·중복 id 제거·같은 id 교체·`pinned` 우선 → `created` 내림차순). `index.json`이 없으면 `site`는 기본값(`메모 블로그`/`공부한 것을 기록하는 곳`)으로 새로 만든다. JSON이 깨졌으면 **쓰지 않고** `409 conflict`.
9. 자동 커밋(§2-1).

> **v1.2 필드를 보내지 않으면 2·4단계는 건너뛴다(v1.1 upsert).** 서버는 요청만 보고 "새 글"인지 "같은 id를 다시 저장"인지 구별할 수 없다 — 의도를 말하는 것은 에디터의 몫이다(§4-3).

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
`meta`는 실제로 디스크에 쓴 값이다 — 에디터는 응답의 `created`·`updated`로 화면 상태를 덮어쓴다(**다음 저장의 `expectedUpdated`는 이 `meta.updated`다**).
`isNew`는 "저장 전 디스크·index 어디에도 이 글(과 옛 id의 글)이 없었다". `ifNew`를 보냈다면 200인 한 항상 `true`다.
`removed`는 지운 옛 파일 경로 목록(분류·id 변경 시). `git`은 §2-1(자동 커밋이 꺼져 있으면 없음).

### `PUT /api/categories`
분류를 **추가·갱신**한다(삭제는 하지 않는다 — 지우려면 `categories.json`을 직접 고친다).
```json
{ "categories": [ { "slug": "css", "name": "CSS", "description": "", "order": 0 } ] }
```
- 에디터가 만든 `categories.json` 전체를 그대로 보내면 된다. 서버는 slug 기준으로 **병합**(같은 slug는 요청값으로 교체, 없던 slug는 추가, 요청에 없는 기존 항목은 유지)한 뒤 `buildCategoriesJson` 규칙으로 정렬·`order`를 0부터 다시 매겨 쓴다. 정렬은 `order` 오름차순, 같으면 이름을 `localeCompare(…, 'ko')` 규칙으로 — 서버는 ko 로케일 없이 명시 규칙(`posts.py _collate_ko`: casefold 코드포인트 → 소문자 먼저)으로 근사한다.
- 각 항목은 `normalizeCategory`를 거친다(`slug = slugifyCategory(slug || name)`). 결과 slug가 비거나 `^[a-z0-9_][a-z0-9_-]*$`에 어긋나거나 `index`/`categories`/`posts`이면 `400`.
- `categories.json`이 없으면 새로 만든다. 깨졌으면 `409 conflict`.
- **순서 주의(에디터)**: 새 분류와 새 글을 함께 저장할 때 이 요청은 글 PUT보다 먼저 간다. 글 PUT이 `409 exists`로 거절되면 분류만 남는다 — 그래서 에디터는 **분류 PUT 전에** id 충돌을 먼저 확인한다(§4-3, meeting-08 충돌 2).

응답 `200`: `{ "ok": true, "categories": [ …쓴 목록… ], "git": { … } }` — `git`은 §2-1(v1.2부터 분류 저장도 커밋).

### `DELETE /api/posts/{id}`
`.md`를 지우고 `index.json`에서 항목을 뺀다.
- 파일도 index 항목도 없으면 `404`. 파일만 없고 index 항목만 있으면 항목만 빼고 `200`(`"fileMissing": true`).
- 같은 id가 두 폴더 이상에 있으면 `409 conflict`(손으로 정리한 뒤 재시도).

응답 `200`: `{ "ok": true, "removed": ["posts/css/2026-09-18-css-grid.md"], "fileMissing": false, "git": { … } }` — `git`은 §2-1.

## 3. 오류

본문은 항상 `{ "error": { "code": "…", "message": "한국어 설명", …추가 필드 } }`. **분기는 `code`로 한다** — `message`는 사람에게 보여 줄 문장이고 바뀔 수 있다. HTTP 상태만으로 분기하지 않는다(409가 세 종류다).

| HTTP | `code` | 언제 | 사람이 할 일 |
|---|---|---|---|
| 400 | `bad_id` | `id`·`previousId`가 `isSafeId` 위반, URL과 본문 `id` 불일치 | id 고치기 |
| 400 | `bad_category` | 폴더명이 규칙 위반·예약어 | 분류 고치기 |
| 400 | `bad_request` | JSON 파싱 실패, 필수 필드 누락, 타입 오류, 제목·본문 공백, `ifNew`와 `previousId`/`expectedUpdated` 동시 | 입력 고치기 |
| 400 | `bad_host` | `Host` 헤더가 `localhost`·`127.0.0.1`·`[::1]`이 아님(§0) | 주소를 localhost로 |
| 404 | `not_found` | 글·파일 없음, 허용 목록 밖 경로, 없는 API | — |
| 405 | `method_not_allowed` | 잘못된 메서드 | — |
| 409 | **`exists`** | (v1.2) `ifNew:true`인데 그 id의 글이 있음 · `previousId`로 바꾸려는 새 id에 글이 있음 | **다른 id로 저장**(에디터가 처리 — 파일을 손댈 필요 없음) |
| 409 | **`stale`** | (v1.2) `expectedUpdated`가 디스크의 지금 `updated`와 다름 · 편집하던 글이 사라짐 | 다시 불러와 비교 후 저장(에디터가 처리) |
| 409 | `conflict` | `index.json`/`categories.json`이 JSON으로 읽히지 않음, 같은 id의 `.md`가 여러 폴더에 있음, index가 가리키는 폴더 밖에 같은 id가 있음, 대소문자만 다른 파일이 있음(§2 동작 3) | **파일을 손으로 정리한 뒤 다시 시도** — 이 안내는 `conflict`에만 붙인다 |
| 413 | `too_large` | 본문 2 MB 초과 | — |
| 500 | `internal` | 디스크 쓰기 실패 등. `message`에 원인 요약 | 서버 로그 확인 |

### 3-1. 409 `exists`·`stale`의 추가 필드 (v1.2)

`409 exists`:
```json
{ "error": {
  "code": "exists",
  "message": "id \"2026-09-23-java\"인 글이 이미 있습니다(posts/java/2026-09-23-java.md). 다른 id로 저장하세요.",
  "id": "2026-09-23-java",
  "path": "posts/java/2026-09-23-java.md",
  "title": "Java 정리",
  "via": "new"
} }
```
| 필드 | 타입 | 뜻 |
|---|---|---|
| `id` | string | 겹친 id(= 요청 URL의 id) |
| `path` | string \| null | 찾은 파일의 저장소 기준 경로(여러 개면 첫 번째). index에만 있고 파일이 없으면 `null` |
| `title` | string \| null | 이미 있는 글의 제목 — index 값, 없으면 그 파일의 frontmatter `title`, 둘 다 없으면 `null` |
| `via` | `"new"` \| `"rename"` | `ifNew`로 걸렸나, `previousId`(id 바꾸기)로 걸렸나 |

`409 stale`:
```json
{ "error": {
  "code": "stale",
  "message": "\"2026-09-21-note-125149\"이(가) 불러온 뒤에 다른 곳에서 저장됐습니다(지금 2026-09-23T15:02:11+09:00). 덮어쓰지 않았습니다.",
  "id": "2026-09-21-note-125149",
  "path": "posts/java/2026-09-21-note-125149.md",
  "currentUpdated": "2026-09-23T15:02:11+09:00",
  "expectedUpdated": "2026-09-21T13:34:03+09:00"
} }
```
| 필드 | 타입 | 뜻 |
|---|---|---|
| `id` | string | 편집하던 글의 id(`previousId`가 있었으면 **옛 id**) |
| `path` | string \| null | 그 글의 파일 경로. 파일이 없으면 `null` |
| `currentUpdated` | string \| null | 지금 디스크의 `updated`. 글이 파일·index 어디에도 없으면 `null`(= 다른 곳에서 지워짐·옮겨짐) |
| `expectedUpdated` | string | 요청이 보낸 값(trim 뒤) 그대로 |

그 밖의 오류 코드는 `code`·`message` 두 필드뿐이다. 추가 필드는 **늘 수는 있어도 뜻이 바뀌지 않는다** — 모르는 필드는 무시한다.

## 4. `frontend-dev-2`가 `js/editor.js`에서 할 일

1. **서버 감지** — 페이지 로드 시 `fetch('/api/health', {cache:'no-store'})`. `res.ok && json.ok === true`이면 **연결됨**. 실패(네트워크 오류·404·`start.ps1`이 준 텍스트 404·타임아웃)는 **서버 없음** 상태 — `#btnSave`는 `disabled`로 남고 `#editorServer`가 `서버 없음 · start.bat(Docker) 실행 후 저장`을 말하며 `#btnRetry`(다시 연결)가 보인다. 세 상태(확인 중·연결됨·서버 없음)의 마크업·클래스·문구는 계약서 §6-1 표가 진실이다. 타임아웃 2초 권장(`AbortController`). 자동 재시도(폴링)는 하지 않는다 — `다시 연결` 버튼이 `detectServer()`를 다시 부른다.
2. **저장 버튼** — **항상 보인다**. 연결됨에서만 `disabled`가 풀린다. 서버 없음·확인 중의 Ctrl+S는 `preventDefault` + 안내 토스트. 내보내기 버튼·다운로드 경로는 **없다**(v3.9 폐지).
3. **PUT 호출** — `buildMeta`가 만드는 `meta` 객체(8개)에 `body: form.body`를 더하고, 아래 **의도 필드**를 붙여 `fetch('/api/posts/' + encodeURIComponent(meta.id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })`. `validate`·`ensureUsableCategory`·`ensureCreated`를 먼저 거친다.
   - **새 글**(아직 디스크에 없는 글 — `state.mode !== 'edit'`): `ifNew: true`.
   - **수정**(불러온 글 · 한 번 저장한 뒤의 같은 화면): `expectedUpdated: <마지막으로 본 updated>` — 불러올 때 `post.meta.updated`, 저장 200 뒤에는 `json.meta.updated`로 갱신한다. 불러오기에 실패해 값을 모르면 **보내지 않는다**(빈 값은 비교 생략).
   - **수정 중 id를 바꿈**(`state.originalId !== meta.id`): 위에 더해 `previousId: state.originalId`. `expectedUpdated`는 옛 글의 값 그대로.
   - **분류 PUT보다 먼저 충돌 확인**(meeting-08 충돌 2): 새 글이거나 id를 바꿨으면 `store.findMeta(meta.id)`(index 기준)로 겹치는지 먼저 본다. 서버 409가 최종 판정이고 사전 확인은 보조다 — 사전 확인을 통과해도 409 `exists`는 올 수 있다(index에 없는 파일, 다른 탭).
   - 새 분류(`cats.added.length > 0`)가 있으면 **글보다 먼저** `PUT /api/categories`에 `buildCategoriesJson()` 결과를 보낸다(순서가 바뀌면 글이 미등록 분류로 저장된다).
4. **응답 처리** — `200`이면 `state.created = json.meta.created`, `state.originalId = json.meta.id`, `state.originalCategory = json.meta.category`, `state.originalPath = json.path`, **기준 `updated` = `json.meta.updated`**, `dirty=false`, `store.draft.clear(state.slot)`, 상태줄 "저장됨 · `json.path`", 그리고 `store.loadIndex(true)`·`store.loadCategories(true)` 뒤 사이드바를 다시 그린다(계약 §6-1 "저장 피드백"). `json.git`이 있으면 "· 커밋 `hash`" 또는 "· 커밋 실패: `reason`"을 덧붙인다(`reason`은 60자 이하, `detail`은 상태줄에 붙이지 않는다 — §2-1). 새 글 모드로 보냈는데 `isNew:false`가 오면(v1.1 서버·`ifNew` 누락) 계약 §6-1의 경고를 띄운다.
   - **4xx/5xx는 `json.error.code`로 분기한다**(§3). 문구·자리는 계약 §6-1이 정한다:
     - `exists` — 자동 id(`idTouched` false)면 `-2`…`-9` 접미사를 붙여 다시 `ifNew:true`로 저장하고 결과에 한 줄로 알린다. 손으로 친 id면 `#fIdError`에 알리고 저장하지 않는다. `error.title`·`error.path`를 문구에 쓸 수 있다.
     - `stale` — 덮어쓰지 않았다는 것을 알리고 초안은 남긴다. `currentUpdated:null`이면 "다른 곳에서 지워짐".
     - `conflict` — `message` + "파일을 손으로 정리한 뒤 다시 시도" 안내. **이 안내는 `conflict`에만.**
     - 그 밖 — `message`를 토스트로 그대로. 초안은 남긴다.
   - 네트워크 실패면 토스트 `서버가 꺼졌습니다 — start.bat(Docker)를 실행한 뒤 다시 연결` + **서버 없음 상태로 전환**(1번). 초안은 localStorage에 남고 `beforeunload`가 창 닫기를 경고한다.
5. **하지 말 것** — `created`를 클라이언트에서 계산해 덮어쓰지 않는다(서버 응답이 진실). `innerHTML` 직접 대입 금지는 그대로.

## 5. 검증 기록 (Docker Desktop을 켠 뒤 `/api-check`)

| 날짜 | 기준 | 결과 |
|---|---|---|
| 2026-09-18 | v1.0, HEAD `e9a2843` | **통과** — 첫 기동(이미지 빌드), 헬스 200, 감춘 경로 404, 픽스처 PUT(새 글 `created`=now, 요청의 2000-01-01 무시) → 2차 PUT(`created` 불변·`updated`만 갱신) → 오류 4종 → DELETE → `git status --short posts/` 빈 출력 |
| 2026-09-21 | v1.1, 라운드 6 | **미실측** — Docker Desktop이 stale 소켓 오류로 기동 실패(§5-1). 코드 리뷰만 |
| 2026-09-23 | v1.2, 라운드 9 | **미실측** — Docker·커밋 신원 없음(meeting-08 U1, 사용자 답 "아직 없음"). 이 PC에 Python도 없어 **문법 검사·단위 호출도 못 했다.** 확인한 것: 코드 대조(파일:줄은 라운드 9 pm 보고) · `auto_commit`의 git 명령 순서를 스크래치 저장소(호스트 git)에서 재현 — 경로 한정 커밋이 손편집 파일·다른 스테이징을 섞지 않음, 추적 안 된 삭제 경로·스테이징 후 삭제 경로를 pathspec에 넣으면 add/commit이 실패함(= 필터가 필요함) |

- [x] `docker compose up` → 로그에 `Uvicorn running on http://0.0.0.0:5500` → 브라우저 `http://localhost:5500/`에 목록 화면 (9/18)
- [ ] `http://localhost:5500/api/health` → `{"ok":true,"version":"1.2.0"}` 수 ms · `?git=1` → `git.branch`·`dirty`
- [ ] 허용 목록: `/server/app.py`, `/docs/api.md`, `/.git/HEAD`, `/.env`, `/Dockerfile`, `/CSS/tokens.css`, `/posts/java/.x.tmp` → 전부 404 · `/`, `/css/tokens.css`, `/posts/index.json`, `/.nojekyll` → 200 (v1.2)
- [ ] `/api-check` 전체(v1.2): 한글 제목 새 글 · 같은 날 `Java 정리`→`Java 복습`(`ifNew` → 409 `exists`) · 수정 모드에서 기존 id로 바꾸기(409 `exists`, `via:"rename"`) · 다른 곳에서 저장 뒤 옛 `expectedUpdated`로 저장(409 `stale`) · created 불변 · 자동 커밋 파일 목록 = 이번 요청 파일만 · 손편집 파일이 커밋에 섞이지 않음 · 분류 저장 커밋 · `git.reason` ≤ 60자 · Host 400
- [x] 컨테이너가 쓴 `posts/_tmp/*.md`가 호스트에서 사용자 소유로 열리고 지워짐 (9/18)
- [x] `docker compose down` → `netstat -ano | findstr :5500` 비어 있음 (9/18)

### 5-1. 2026-09-21 라운드 6 — v1.1 실측 못 함

`/api-check` v2는 **샌드박스 클론**(`git clone` + 작업 트리 덮어쓰기)을 `docker compose --project-directory <클론>`으로 마운트해 돌린다 — 자동 커밋이 프로젝트 이력에 남지 않는다. 클론까지 만들었으나 Docker Desktop 4.89가 `sailor-ingest.sock` stale 소켓 오류로 엔진을 못 띄웠다(이 PC 환경 문제, 재부팅 필요 — `/serve` 포트 충돌 표). **v1.1·v1.2는 둘 다 한 번도 실행되지 않았다.** 사용자가 Docker·커밋 신원을 준비하면(U1) 첫 일: `/api-check` 전체 → 이 표 갱신.

## 6. 규칙 메모 (결정 근거)

### 6-1. id 대소문자 — 소문자를 강제하지 않는다

`isSafeId`(`store.js`)는 대문자를 허용하고, 그 규칙의 진실은 `store.js`다(§0). 서버가 소문자를 강제하면 브라우저는 `Foo`를 유효한 id로 보는데 서버만 거절하는 불일치가 생긴다.
대신 **파일 존재 판정을 대소문자까지 정확히**(`Repo.exists_exact` — `os.listdir` 이름 대조) 한다. NTFS는 `foo.md`를 물어도 `Foo.md`를 찾아 주지만 GitHub Pages(Linux)는 구분하므로, `is_file()`만 믿으면 `Foo.md`를 `foo`로 덮어쓰고 index에는 `foo`가 남아 공개 사이트에서 404가 난다.
같은 폴더에 대소문자만 다른 파일이 있으면 `409 conflict`(§2 동작 3 ②). 에디터가 자동으로 짓는 id(`util.slugAscii`)는 소문자라 일상 흐름에서는 걸리지 않는다.
예외 방향 하나: **`409 exists` 판정(§2 동작 2)은 대소문자를 무시**한다 — 새 글이 NTFS에서 같은 파일인 `Foo.md`를 덮지 않게, 더 넓게 본다. 정적 서빙(§1)도 같은 이유로 대소문자까지 정확한 파일만 준다.

### 6-2. 낙관적 잠금(`expectedUpdated` → 409 `stale`) — v1.2에서 넣었다

v1.1은 넣지 않았다. 근거는 (1) 한 사용자·같은 PC, (2) **자동 커밋이 저장마다 커밋을 남겨 덮어써도 되돌릴 수 있다**, (3) 에디터 상태가 하나 는다 — 였다.
meeting-08이 (2)를 무너뜨렸다: 자동 커밋은 한 번도 실측되지 않았고, 이 PC에는 커밋 신원이 없어 **매 저장 커밋이 건너뛰어진다**(D2). 검증되지 않은 기능을 다른 결정의 안전 근거로 썼다(근본 원인 R-A). 그리고 같은 PUT을 `ifNew`로 고치는 김에 선택 필드 하나를 더하는 비용은 작다(충돌 10).
그래서 v1.2는 **요청이 기준 버전을 말하면** 서버가 비교한다. 말하지 않으면(v1.1 에디터) 비교하지 않는다 — 보호를 켜는 것은 에디터다(§4-3).
다른 탭의 초안 감지(`storage` 이벤트, meeting-04 약속)는 여전히 미구현이다 — 이월 백로그 B8-5(frontend-dev-2). 서버 잠금은 **저장된 파일**끼리의 충돌만 막고, 저장 전 초안끼리의 충돌(D22)은 막지 못한다.
