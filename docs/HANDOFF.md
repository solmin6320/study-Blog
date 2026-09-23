# 인수인계 문서 — 개인 학습 블로그

> 이 문서 하나만 읽으면 프로젝트 맥락이 복원되도록 작성했다.
> **최종 갱신: 2026-09-23 (라운드 9 진행 중 · HEAD `5fdb595` · 계약서 v4.2 커밋 / v4.3 작업 트리 개정 중 · 서버 규약 `api.md` v1.2 미커밋 · 사용자 글 1편)**
> 기준 회의록은 `docs/meeting-08.md`. 이번 갱신은 전면: 수치(§3) · 흐름(§6, 커밋 신원 전제 · 덮어쓰기 차단) · **§9 "사용자 결정 기록" 표 신설**(meeting-08 D9).
> 갱신 방법: Claude Code에서 `/handoff` 실행. 오래된 인수인계 문서는 없는 것보다 나쁘다(9/15 v2.2 상태로 6일 방치 → meeting-04 M4-11, 9/22 기준으로 낡음 → meeting-08 PM-8).

---

## § 1. 이 프로젝트가 무엇인가

공부한 내용을 기록하는 **개인 학습 블로그**. 순수 HTML/CSS/JS로 만들고, **빌드 도구 없이** GitHub Pages(`https://github.com/solmin6320/study-Blog`, 공개)에 정적 파일을 그대로 올린다.
글은 **로컬 에디터 서버**(FastAPI, Docker — 파이썬은 여기에만)로만 저장한다(계약 v3.9 §6-1 — `.md` 내보내기는 폐지). Docker가 없는 PC는 미리보기 전용이다. 방문자는 읽기 전용이다.
**글은 사용자가 직접 쓴다** — 에이전트가 대신 써서 올리는 경로는 없다(2026-09-23 U2-A, 푸터 둘째 줄과 일치).

### 사용자가 직접 말한 요구사항 (검수 기준선 — 16개)

| # | 요구사항 | 상태 (meeting-08 기준, 2026-09-23) |
|---|---|---|
| 1 | 개인 학습 블로그 / HTML·CSS·JS만 / Node.js 지양 | 충족. 파이썬은 로컬 서버(`server/`) 한정 |
| 2 | 게시글이 메모지 형태로 보일 것 | **기준선 폐기** — 사용자가 v3.0에서 "AI티"라며 직접 거부, 카드 그리드로 교체 |
| 3 | 각 글마다 게시 날짜와 최종 수정 날짜 | 부분 — 표시 로직 정상(`post.js`). 같은 날 수정이면 수정일을 숨긴다(U8-A 확정). 덮어쓰기로 새 글이 옛 글의 게시일을 물려받던 경로(D1)는 서버 v1.2가 막음(에디터 연동 전·실측 전) |
| 4 | 제목 작성 | 충족 |
| 5 | 본문에 어떤 내용이든(표·그래프·텍스트·코드) | 부분 — 그래프는 이미지로: `posts/<분류>/img/`에 넣고 `posts/java/img/a.png`처럼 쓴다(U4 "규칙만" — 업로드 기능 없음). 상대 경로 함정(D27)은 이월 B8-8 |
| 6 | 최신 반응형 웹 | 미확인 — 360/768/1024/1440 헤드리스만. 실기기 5라운드째 미실시(U7) |
| 7 | 애니메이션·슬라이드 등 (jQuery 허용) | 충족 — 콘텐츠 도착·테마 크로스페이드·전구 인트로 |
| 8 | 사용자가 직접 그때그때 추가 | **부분** — 저장 경로 v1.1·v1.2 실측 0회, 이 PC는 커밋 신원이 없어 자동 커밋이 매번 건너뛰어진다(D2, U1). 덮어쓰기(D1)는 서버만 막혔고 에디터 몫 남음 |
| 9 | 가독성·전체 구조·세부 구조·고퀄리티 | 부분 — 본문 `라벨:`+목록 간격(D16)은 라운드 9 designer. 계약서 3,900줄·`editor.js` 3,116줄 |
| 10 | 배경은 단색보다 흐르는 느낌 + 어울리는 애니메이션 | **미결** — 구현(메시)은 사용자가 폐기했지만 요구 철회 여부는 답이 없다. U9 답: "현행 유지, #10 미결"로 기록 |
| 11 | 외부 의존성은 사용자 사전 승인 | 충족(코드) — CDN 3종(marked·DOMPurify·highlight.js, SRI). jQuery 승인만 받고 미사용. fastapi·uvicorn은 로컬 서버 한정. 디자인 스킬의 Chart.js·shadcn 권고는 규칙이 이긴다(CLAUDE.md 규칙 2) |
| 12 | GitHub Pages 공개, 방문자 읽기 전용 | 충족 — hostname 판정. 방문자에게 frontmatter 경고·오류 원문이 보이는 것(D5·D23)은 라운드 9·이월 |
| 13 | 개발 → 통합 회의 → 개선안 → 개발 반복 | 부분 — 회의록 `meeting-02~08`. 회의 사이 항목 증발(D9) → `/blog-meeting` 0단계·이 문서 §9 표로 막음 |
| 14 | 카테고리별로 나누고 직접 추가 | 충족 — 분류 = 폴더, 에디터·서버 양쪽에서 추가 |
| 15 | 폴더·파일 가독성 | 부분 — CLAUDE.md·에이전트 정의·스킬·이 문서를 2026-09-23 동기화. 계약서 슬림화는 이월 B8-6 |
| 16 | 푸터 문구 | 충족 — 첫 줄 `© 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다` · 둘째 줄 `게시글은 모두 직접 작성하고 정리하였습니다`(2026-09-23 확정, 세 페이지, `d93c424`) |

### 왜 이런 제약을 택했는가

- **Node.js 미사용**: 사용자 명시. 빌드가 없어야 `git push` 하나로 배포가 끝난다.
- **파이썬은 로컬 서버에만**(2026-09-18 사용자 결정): "쓰고 나면 끝"을 위해 저장 API가 필요했고, 공개 사이트는 여전히 정적 파일뿐이다. Docker는 `docker compose up` 한 줄로 켜기 위한 포장이다.
- **저장 단일 모드**(2026-09-21 사용자 판정 "다운로드 방식 없애"): 서버가 `posts/`에 직접 쓴다. 다운로드한 `index.json`을 사람이 옮기는 흐름이 `created` 드리프트의 원인이었다.
- **분류를 폴더로**: 글이 쌓여도 탐색기에서 바로 구분된다.

---

## § 2. 절대 규칙 (`CLAUDE.md`와 동일 — 깨면 그 작업은 실패)

1. **Node.js·npm·빌드 도구 금지.** 파이썬은 `server/`에만.
2. **새 외부 의존성은 사용자 승인 없이 추가 금지.** 승인: jQuery, marked.js, highlight.js, DOMPurify(CDN 고정 버전 + SRI). 제외: Chart.js, KaTeX.
3. **마크다운 렌더 결과는 예외 없이 DOMPurify를 거친 뒤 DOM에.** `innerHTML` 직접 대입 금지. 순서는 marked → DOMPurify → highlight.
4. **`created` 불변, `updated`는 저장마다 갱신.** 서버도 요청의 `created`를 무시하고 디스크 값을 쓴다(`docs/api.md` §2).
5. **색·간격·폰트·그림자는 `css/tokens.css` 변수로만.** 행간(`line-height`)도 "폰트"다(2026-09-23 명시, 예외 `0`·`1`). 리터럴 색 0건 유지 중, 리터럴 행간은 이월 B8-13.
6. **사용자에게 보이는 것·입력의 결과가 바뀌면 `docs/contract.md` 먼저** — 클래스·구조 · 문구 · 키 동작 · 저장 키(2026-09-23 확대). **메인 세션도 같은 게이트.** 계약서 현재 **v4.2(커밋) / v4.3(개정 중)**.

---

## § 3. 현재 상태 (2026-09-23 실측 — 작업 트리 기준)

| 영역 | 파일 | 줄 수 | 비고 |
|---|---|---|---|
| 토큰 | `css/tokens.css` | 437 | |
| 기본 | `css/base.css` | 256 | 흐르는 배경 제거됨 |
| 레이아웃 | `css/layout.css` | 944 | |
| 컴포넌트 | `css/components.css` | 2,135 | 카드 그리드·사이드바·인트로·에디터 |
| 본문 | `css/prose.css` | 795 | IntelliJ 코드색. 라운드 9 designer가 목록 간격(D16) 개정 중 |
| 테마 초기화 | `js/theme-init.js` | 58 | `<head>`에서 첫 페인트 전 테마·사이드바 고정 적용 |
| 설정·유틸 | `js/config.js` `js/util.js` | 91 · 428 | |
| 데이터 | `js/store.js` | 864 | **파일 규칙의 진실**(서버 `posts.py`가 이식) |
| 마크다운 | `js/markdown.js` | 370 | 라운드 9에 `codeRanges`·`codeAt` 신설 예정(frontend-dev) |
| UI 공통 | `js/ui.js` | 661 | 테마·모달·사이드바 |
| 관리자 | `js/admin.js` | 56 | hostname(`localhost`·`127.0.0.1`·`[::1]`)이면 관리자. `?admin=`·localStorage 스위치 없음 |
| 목록·상세 | `js/app.js` `js/post.js` | 639 · 659 | |
| 에디터 | `js/editor.js` | 3,116 | v4.2 코드 블록 편의 포함. 3파일 분리는 이월 B8-11(U4 재개) |
| HTML | `index.html` `post.html` `write.html` | 148 · 173 · 306 | |
| 서버 | `server/app.py` `server/posts.py` | 601 · 707 | v1.2(미커밋) — 덮어쓰기 차단·허용 목록·경로 한정 커밋 |
| 문서 | `docs/contract.md` 3,920(개정 중) · `docs/api.md` v1.2 295 · `docs/meeting-02~08.md` | | |
| 글 | `posts/java/2026-09-21-note-125149.md` **1편** · 분류 **1개**(`java`) | | index 시각을 `.md` 값으로 정정(`5fdb595`, U5) |
| 스킬 | `.claude/skills/` **32개**(프로젝트 24 + 디자인 8) | | |

**커밋 34개, HEAD `5fdb595`.** 직전: `d93c424` v4.2 이행(코드 블록 편의 입력 · 푸터 둘째 줄 · 회의록 08).
**미커밋(라운드 9 진행 중)**: 계약 v4.3·`prose.css`(web-designer) · `server/*`·`api.md` v1.2·`CLAUDE.md`·`.claude/**`·이 문서(pm).

### 실측으로 확인된 것

- (meeting-04, 9/18) `tokens.css` 밖 리터럴 색 0 · CSP 3페이지 동일 · `innerHTML` 0 · 360~1440 가로 넘침 0 · 최저 대비 5.30:1 · Docker 첫 기동, 저장 API v1.0 왕복(`created` 위조 차단) 통과
- (meeting-08, 9/23) `innerHTML` 직접 대입 0 · CSS 리터럴 색 0 재확인 · v4.2 에디터 헤드리스 합성 입력 32항목 통과 · 푸터 세 페이지 문장 일치
- (9/23, pm) 서버 v1.2 `auto_commit`의 git 명령 순서를 스크래치 저장소에서 재현 — 경로 한정 커밋이 손편집 파일·다른 스테이징을 섞지 않음

### 미검증 (다음 담당자가 확인할 것)

- **저장 경로 v1.1·v1.2 전체**(`/api-check`) — 한 번도 실행되지 않았다. 이 PC에는 Python도 없어 v1.2는 문법 검사조차 못 했다. U1(Docker·커밋 신원) 뒤 첫 일
- **실기기(휴대폰)** 목록·글·에디터 — 5라운드째 미실시(U7)
- **실키보드·한글 IME**: 코드 블록 안 `("안녕")` 입력 시 닫는 짝 중복(D4) · Alt+Shift+↑ 입력 언어 전환 · 한글 모드 Ctrl+S(U7)
- 스크린리더(NVDA) 실사용

---

## § 4. 폴더·파일 구조

```
index.html / post.html / write.html     (인라인 스크립트·스타일 0 — CSP. about.html은 v3.9에서 삭제)
.nojekyll                **필수** — 없으면 GitHub Pages의 Jekyll이 posts/*.md를 .html로 바꿔 글이 404 (2026-09-22 실제 발생, `13936b9`)
start.bat / start.ps1    start.bat: Docker 데몬이 있으면 compose, 없으면 start.ps1(PowerShell HttpListener, 5500 — 정적 미리보기 전용, 저장 API 없음 → 글 저장 불가)
Dockerfile / docker-compose.yml / .dockerignore      로컬 에디터 서버. `docker compose up` → http://localhost:5500

css/   tokens → base → layout → components → prose   (이 순서로 로드. animations.css는 v3.0에서 삭제)
js/    theme-init(head) · config · util · store · markdown · ui · admin · app(index) · post · editor(write)   (about.js는 v3.9에서 삭제)
posts/ index.json(메타 목록) · categories.json(분류) · <slug>/<id>.md · <slug>/img/(글의 이미지, U4)
server/ app.py(HTTP·저장 흐름·자동 커밋·정적 허용 목록) · posts.py(store.js 이식) · requirements.txt
docs/  contract.md(계약서) · api.md(서버 규약 v1.2) · meeting-NN.md(회의록 02~08) · HANDOFF.md(이 문서)
.claude/ agents/ 4인 정의 · skills/ 32개
```

### 소유권 (두 에이전트가 같은 파일을 만지면 서로 덮어쓴다 — 실제로 두 번 일어났다. 진실은 `CLAUDE.md`)

| 에이전트 | 역할 | 소유 |
|---|---|---|
| `pm-integrator` | 총괄·검수·분배 + 로컬 서버 | `docs/meeting-*.md` `docs/HANDOFF.md` `CLAUDE.md` `server/*` `Dockerfile` `docker-compose.yml` `.dockerignore` `docs/api.md` `.claude/**` |
| `web-designer` | 구조·계약서·비주얼 | `docs/contract.md` `css/*` |
| `frontend-dev` | 목록·상세·데이터 | `index.html` `post.html` `js/{config,util,store,markdown,app,post,theme-init}.js` · `posts/`의 **파생 파일 정합성**(`index.json`·`categories.json`, 사용자 통보 + 단독 커밋) |
| `frontend-dev-2` | 에디터·인터랙션·접근성 | `write.html` `js/{editor,ui,admin}.js` `start.bat` `start.ps1` |

**글 본문·frontmatter 값은 사용자 것**이다(2026-09-23). 에이전트는 오타·틀린 설명도 고치지 않고 알리기만 한다. 전역 `tutor`(학습 도우미)는 이 4인 밖이며 설명·오류 지적만 한다.

---

## § 5. 데이터 모델

### 글 — `posts/<category-slug>/<id>.md` (frontmatter 키 8개, 이 순서)

```markdown
---
id: 2026-09-18-css-grid
title: CSS Grid 정리
summary: ""
created: 2026-09-18T10:00:00+09:00
updated: 2026-09-18T10:00:00+09:00
tags: [css, layout]
category: css
pinned: false
---

본문 마크다운
```

| 필드 | 규칙 |
|---|---|
| `id` | = 파일명. `isSafeId`: 영문·숫자로 시작, `[0-9A-Za-z._-]` 최대 200자, `..` 금지. **대소문자까지 정확히**(Pages는 구분, NTFS는 무구분 — `api.md` §6-1). 에디터 자동 id는 `YYYY-MM-DD-<영문 slug>`, 한글만인 제목은 `note-HHMMSS` 폴백(write.html을 연 시각) |
| `created` | **불변.** 빈 값이면 `updated` → id 앞머리 `YYYY-MM-DD` 순으로 되살린다(`store.fallbackCreated`) |
| `updated` | 저장마다 현재 시각(KST `+09:00` ISO 8601) |
| `tags` | 배열. 비교는 trim+소문자 |
| `category` | 단일 slug = 폴더명. `categories.json`에 없으면 `_uncategorized` |
| `pinned` | true면 목록 최상단 |
| ~~`color`~~ | v3.0에서 폐기(계약 §9-2). 남아 있어도 무시 |

**이미지**(2026-09-23 U4): `posts/<분류>/img/`에 직접 넣고 본문에는 `![설명](posts/java/img/a.png)` — 사이트 루트 기준 상대 경로. `img/a.png`(글 기준)·`/posts/…`(루트 절대)는 Pages 프로젝트 사이트에서 404(D27).

`.md`와 `index.json`이 다르면 **`.md`가 진실**. "값이 비어 있음"과 "키가 없음"을 구분해 병합한다(`store.mergeMeta`, `$present`). 서버(`app.py _disk_meta`)도 같은 순서다.

### `posts/categories.json`

```json
{ "categories": [ { "slug": "css", "name": "CSS", "description": "", "order": 0 } ] }
```
`slug`는 `^[a-z0-9_][a-z0-9_-]*$`, `index`/`categories`/`posts` 예약. 정렬은 `order` → 이름 `localeCompare('ko')`. 깨져도 목록은 index의 category 값으로 되살린다(3단 폴백).

### `posts/index.json`

`{ "site": {title, subtitle}, "posts": [메타 8개…] }` — 목록은 이 파일만 읽는다. 정렬은 `pinned` 우선 → `created` 내림차순. 재생성은 `store.buildIndexJson` = `posts.py build_index_json`.

---

## § 6. 글 추가 흐름 (서버 단일)

**저장 경로는 하나다: 로컬 에디터 서버(Docker).**
```
(처음 한 번) 커밋 신원 확인      # /serve §0 — 저장소 로컬 git config 또는 .env. 2026-09-23 현재 이 PC는 없음
docker compose up               # 첫 실행은 이미지 빌드 1~2분. http://localhost:5500  (start.bat도 Docker가 있으면 이걸 띄운다)
write.html → 저장(Ctrl+S)       # PUT /api/posts/{id} → posts/<slug>/<id>.md + index.json → 그 두 파일(+지운 옛 파일)만 자동 커밋
/ship                           # 사용자가 푸시(공개 시점은 사용자가 정한다). `gh auth login` 후에만 된다
```
- **커밋 신원이 없으면** 저장은 되지만 커밋은 매번 건너뛴다(응답 `git.reason: "커밋 신원 없음"`, 해결 방법은 `git.detail`) — 덮어쓴 글을 되돌릴 이력이 남지 않는다. 신원: `.env`의 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL`, 또는 저장소 로컬 `git config user.name`/`user.email`(컨테이너는 전역 설정을 못 본다). **push는 하지 않는다**(토큰을 디스크에 두지 않는다).
- **덮어쓰기 차단(api.md v1.2)**: 에디터가 새 글에 `ifNew:true`, 수정에 `expectedUpdated`를 실으면 서버가 남의 글을 덮는 저장을 `409 exists`/`409 stale`로 거절한다. **에디터 연동은 라운드 9 frontend-dev-2 몫**(그 전까지 서버는 v1.1처럼 upsert한다).
- 서버가 `created`를 강제한다: 기존 글이면 디스크 값, 새 글이면 `now`. 규약은 `docs/api.md`.
- 배포에는 루트의 **`.nojekyll`이 필수**. 지우지 않는다.

**Docker가 없는 PC** — `start.bat`이 `start.ps1`(정적 서버)로 떨어진다. 미리보기는 되지만 **글을 저장할 수 없다**: 저장 버튼 `disabled`, `#editorServer`가 `서버 없음 · start.bat(Docker) 실행 후 저장`, `다시 연결` 버튼. 쓰던 초안은 localStorage에 남는다(영구 저장 아님).

---

## § 7. 아키텍처 판단과 이유

| 판단 | 이유 |
|---|---|
| 규칙의 진실은 `store.js`, 서버는 이식 | 화면이 읽는 규칙과 서버가 쓰는 규칙이 갈리면 "저장은 됐는데 안 보이는" 글이 생긴다. **골든 벡터(기계 대조)는 미구현** — 재개 결정(U4), 이월 B8-11 |
| 서버는 `127.0.0.1` + Host 검사 + **CORS 없음**, 인증·DB 없음 | 로컬 한 사용자용. PUT·DELETE는 preflight 대상이라 CORS를 열지 않는 것이 유일한 CSRF 방어(`api.md` §0) |
| 정적 서빙은 **허용 목록**(v1.2) | 차단 목록은 새 파일이 기본 노출 — `.env`를 만드는 순간 `/.env`가 서빙됐다(D25) |
| 자동 커밋은 **그 요청이 쓴 파일만**, push는 안 한다 | `posts/` 전체를 담으면 손편집 중인 다른 글이 "글: 제목" 커밋에 섞인다(D25). 공개는 사람이 정한다 |
| 쓰기 API는 **의도(`ifNew`)와 기준 버전(`expectedUpdated`)을 받는다**(v1.2) | v1.1 upsert는 한글 제목 같은 날 두 편이면 앞 글을 소리 없이 덮었다(D1). 보호를 "자동 커밋으로 되돌린다"에 미뤘는데 그 복구 수단이 실측 0회·이 PC에서 성립하지 않았다(R-A) |
| 목록은 `index.json`만, `.md`는 상세에서만 | 글 100개면 fetch 100번 |
| 살균은 marked → DOMPurify → highlight | 살균 끝난 DOM에만 하이라이트 |
| CDN SRI | 공개 배포에서 CDN 오염 = 살균기 무력화 |
| 관리자 모드는 보안이 아니라 UI 스위치 | 정적 사이트의 클라이언트 비밀은 전부 공개. hostname으로만 판정 |
| 픽스처는 샌드박스 사본 + **실제 글 사본을 검증 입력으로** | 병렬 에이전트가 같은 `_tmp`를 덮었다(라운드 4). 계약서를 읽고 만든 픽스처만 쓰면 계약의 가정이 늘 통과한다(R-C, `/fixture` v3) |
| 글은 사용자가 직접 쓴다 | 푸터 "게시글은 모두 직접 작성하고 정리하였습니다"(U2-A) |

---

## § 8. 지금 해야 할 일

**진행 중 — 라운드 9** (`docs/meeting-08.md` "다음 라운드 작업 지시 (라운드 9)"가 기준. 순서: designer 계약 → pm 서버·문서 → frontend-dev → frontend-dev-2):

| 담당 | 핵심 | 상태(2026-09-23) |
|---|---|---|
| web-designer | 계약 v4.3 — §6-0·§6-1 `#fIdError`·409 문구(D1) · §6-2 동작 정정(D3·D4·D17~21) · §5-6 방문자 경고 금지(D5) · §5-7 + `prose.css` 목록 간격(D16) · §3-2 저장 키 · §0-4 사용자 습관 목록 | 진행 중(작업 트리) |
| pm-integrator | `server/` v1.2(D1·D25·D11) · `api.md` v1.2 · `CLAUDE.md` · 에이전트 정의(D8) · 스킬(D6·D7·D9·R-C) · 이 문서 | 완료(미커밋). **`/api-check` 실측(P3)은 U1 뒤로 미룸** |
| frontend-dev | `Blog.markdown.codeRanges`·`codeAt`·`langLabel` · frontmatter 경고 관리자 전용(D5) · `storageKeys.codeLang`/`admin` 삭제 · `store.draft.key` · index 시각 정정(U5) | U5 완료(`5fdb595`). 나머지 대기 |
| frontend-dev-2 | fetch 스텁 기준선 · `ifNew`/`expectedUpdated`/`error.code` 분기(D1, api.md v1.2 §4) · `lineStartAt`(D17) · `codeAt` 교체(D3) · D18~21 · `write.html` 낡은 주석 | 대기(계약 v4.3·frontend-dev 뒤) |

**이월 백로그** B8-1~B8-13은 `docs/meeting-08.md` "이월 백로그" 표가 정본이다(ID로 추적, 다음 회의가 반드시 받는다). U4 결정으로 **B8-11 중 골든 벡터·editor.js 분리·index 재생성은 재개, 이미지 업로드는 취소("규칙만")**.

---

## § 9. 결정 기록

### 사용자 결정 기록 (정본 — 2026-09-23 신설, meeting-08 D9)

> 사용자가 답한 결정은 **날짜와 함께 여기에** 적는다. 회의록에만 두면 다음 회의에서 증발한다(라운드 7 예약 4건이 취소 기록 없이 사라졌다).
> `/blog-meeting` 0단계가 이 표와 직전 회의록의 "사용자 결정 필요 사항"을 대조한다. 뒤집힌 결정은 지우지 말고 취소선 + 새 행.

| 날짜 | 출처 | 질문 | 결정 | 영향·후속 |
|---|---|---|---|---|
| 초기 | — | 외부 의존성 | jQuery·marked·highlight.js·DOMPurify만. Chart.js·KaTeX 제외 | CLAUDE.md 규칙 2 |
| 초기 | — | 배포 | GitHub Pages 공개 저장소, 방문자 읽기 전용 | 요구 #12 |
| v3.0~3.4 | 사용자 판정 | 화면 방향 | 메모지·흐르는 배경 **거부** → 카드 그리드·사이드바·은은한 모션 | 요구 #2 기준선 폐기, #10은 아래 U9 |
| v3.6~3.7 | 사용자 요청 | 인트로 | 전구 인트로(첫 접속) | 계약 §3-5 |
| 2026-09-18 | 사용자 | 파이썬 허용 범위 | 파이썬(프레임워크까지) 허용, **로컬에서 글을 추가할 때만**. Docker로 감쌈 | `server/`, CLAUDE.md 규칙 1 |
| 2026-09-20 | meeting-05 | 라운드 5 선정 | "너네가 알아서 회의 한 다음 골라서 개편해. 사용자 기준으로" → 채택 5개 | meeting-05 |
| 2026-09-20 | 사용자 | 코드 블록 단축 | 본문에서 `//` 두 개로 코드 블록(U-1) | 계약 §6-2 |
| 2026-09-21 | meeting-06 #2 | 저장 방식 | ~~하이브리드(서버 + 내보내기)~~ → **서버 저장 단일**(내보내기 폐지). Docker 유지 | 계약 v3.9 §6-1 |
| 2026-09-21 | meeting-06 #6 | 소개 페이지 | `about.html`·내비 `소개` 삭제 | 계약 v3.9 |
| 2026-09-23 | 사용자 | 괄호 자동 닫기 범위 | "코드 블록 부분 괄호 쓰면 IDE처럼 … 닫히는 거까지 같이" → 코드 블록 안 자동 닫기 | 계약 v4.2 §6-2. 해석(자동 닫기)은 meeting-08이 문법으로 확정, 사용자에게 다시 묻지 않음 |
| 2026-09-23 | 사용자 선택지 | 푸터 둘째 줄 | **`게시글은 모두 직접 작성하고 정리하였습니다`**, 세 페이지 모두 | 계약 §10, `d93c424` |
| 2026-09-23 | meeting-08 **U1** | Docker·커밋 신원 준비 | **아직 없음** — 건너뜀 | P3(`/api-check` v1.2 실측) 미실시. 저장은 되지만 커밋은 건너뛰어진다 |
| 2026-09-23 | meeting-08 **U2** | 푸터 "모두 직접" vs 에이전트 대필 경로 | **(A) 대필 경로 폐기.** 글은 사용자가 `write.html`에서. tutor는 설명·오류 지적만 | 프로젝트 `/new-post`·`/edit-post`를 안내 스킬로 교체(2026-09-23). CLAUDE.md `posts/` 소유 좁힘. **전역 `~/.claude/skills/learn/SKILL.md`·`~/.claude/agents/tutor.md`는 프로젝트 밖 — 사용자가 직접 고친다**(pm 라운드 9 보고에 줄 번호) |
| 2026-09-23 | meeting-08 **U3** | 글 끝 `핵심 정리:` 요약 카드 | **(c) 현행** — 템플릿의 `## 다시 볼 때 이것만`일 때만 카드 | 이월 B8-10(문단 라벨형 카드)은 **실행하지 않음**(U3=a일 때만이던 항목) |
| 2026-09-23 | meeting-08 **U4** | 라운드 7 예약 4건 | 이미지 업로드는 **"규칙만"**(`posts/<분류>/img/` + `posts/java/img/a.png` 표기, 업로드 API 없음). **골든 벡터 · `editor.js` 분리 · index 재생성은 재개** | 이월 B8-11(재개 3건), B8-8(상대 경로 `assetBase`)은 유지 |
| 2026-09-23 | meeting-08 **U5** | index 시각을 `.md` 값으로(통보) | **시행** — frontend-dev, 단독 커밋 | `5fdb595`(`index.json` created·updated = `13:34:03`) |
| 2026-09-23 | meeting-08 U6 | 공개 글 setter·getter 뒤바뀜·`settter` 오타 | 답 없음 — **사용자 조치 대기**. 에이전트는 고치지 않는다 | 에디터로 고치면 수정일이 그날로 바뀐다 |
| 2026-09-23 | meeting-08 U7 | 실기 확인 4건(IME 짝 중복 · Alt+Shift+↑ · 한글 Ctrl+S · 폰) | 답 없음 — **미확인 유지** | D4 IME 보정은 U7 뒤 |
| 2026-09-23 | meeting-08 **U8** | 같은 날 수정한 글의 수정일 | **(A) 지금처럼 숨김** | 요구 #3 "부분"의 한 원인이지만 사용자 선택 |
| 2026-09-23 | meeting-08 **U9** | 요구 #10 흐르는 배경 철회 여부 | **"현행 유지, #10 미결"** — 종이색 단색 그대로, 요구 철회는 답하지 않음 | 대조표에 "미결"로 적는다(충족·폐기 어느 쪽으로도 세지 않음) |
| 2026-09-23 | meeting-08 **U10** | 목록 검색이 본문까지? 태그에 분야/개념? | **현행** — 검색은 index.json(제목·요약·태그)만 | — |
| 2026-09-23 | meeting-08 **U11** | 본문 칸 맞춤법 검사 | **현행** — 본문 꺼짐 유지(제목 칸은 켜는 방향, 이월 B8-7) | — |

### 사용자가 위임해 pm이 정한 것 (meeting-04 미결 → meeting-05, 뒤집으면 따른다)

| # | 결정 | 선택 | 근거 |
|---|---|---|---|
| 1 | 요구사항 #2 메모지 | **기준선 폐기 확정** | 사용자가 v3.0에서 직접 고른 결과. (#10은 2026-09-23 U9로 "미결"로 정정 — 폐기를 pm이 대신 확정할 수 없었다, meeting-08 PM-11) |
| 2 | `posts.py`↔`store.js` 이중화 | **(A) 유지 + 골든 벡터** | 서버가 `created` 불변을 강제하려면 어차피 파싱. 진실은 `store.js`. 골든 벡터는 미구현 — U4로 재개 |
| 3 | 요구사항 #5 SVG 그래프 | **현행 유지**(살균 표면 안 넓힘) | 그래프는 이미지(U4 "규칙만") |
| 4 | JS 꺼진 방문자에게 에디터 폼 노출 | **(B) 정적 `hidden` + JS 해제** | 사용자 "절대 안 보이게". 계약 §8-2 예외 |
| 5 | `editor.js` 3파일 분리 | **승인** — 라운드 7 예약이 증발했다가 U4로 재개 | 이월 B8-11 |
| B-1 | 저장 → 커밋·푸시 | **커밋만 자동(권장안 A), 푸시는 `/ship`** | 토큰을 디스크에 안 둔다 |

---

## § 10. 다른 환경에서 이어받는 방법

### A. Claude Code
`.claude/` 폴더가 있으면 에이전트 4개·스킬 32개가 살아 있다. 시작은 `/sync` → `CLAUDE.md` → `docs/contract.md` 최신판(**3,900줄 — offset으로 끝까지**) → 최신 `docs/meeting-NN.md` → 이 문서 §9. 개발 투입 `/round-start`, 회의 `/blog-meeting`, 서버 `/serve`·`/api-check`, 픽스처 `/fixture`(v3).

### B. Claude Code가 아닌 환경
1. 시작 프롬프트에 `docs/HANDOFF.md`(이 문서), `docs/contract.md`, `CLAUDE.md`, 최신 `docs/meeting-NN.md`를 붙인다.
2. §2 절대 규칙 6개를 프롬프트 앞에 명시한다. 특히 DOMPurify와 `created` 불변.
3. 4인 역할이 필요하면 `.claude/agents/*.md`를 시스템 프롬프트로 쓴다. 소유권 표(§4)를 지킨다.
4. 서버를 고치면 `docs/api.md`를 먼저 고친다. 파일 규칙은 `store.js`에 맞춘다.

### C. 로컬에서 확인하는 법
- **Docker Desktop이 있으면** `docker compose up` → `http://localhost:5500` (저장 API 포함). 끝은 `Ctrl+C` / `docker compose down`. 처음이면 `/serve` §0(커밋 신원)부터.
- **없으면** `start.bat` 더블클릭(PowerShell 5.1 내장, Python·Node 불필요) → 같은 주소, 저장 API 없음 — **미리보기 전용, 글 저장 불가**.
- 둘 다 5500 — **하나만** 켠다. `file://`로 열면 fetch가 막혀 빈 화면이다.
- 관리자 UI는 hostname이 `localhost`·`127.0.0.1`·`[::1]`일 때 자동(`?admin=`은 폐기).

| 증상 | 원인 |
|---|---|
| 목록이 "불러오는 중"에서 멈춤 | `posts/index.json` JSON 오류 |
| 글 클릭 시 "없습니다" | `id`·폴더 불일치(index의 category 폴더에 파일이 없음). 서버는 이 상태를 `409 conflict`로 막는다 |
| 에디터의 "저장" 버튼이 `disabled`, "서버 없음" 문구 | `/api/health`가 안 닿음 — start.ps1(저장 API 없음)이거나 Docker가 꺼짐. Docker를 켠 뒤 `다시 연결` 클릭(새로고침 불필요) |
| 저장했는데 "id가 이미 있습니다"(409 `exists`) | 같은 id의 글이 이미 있다(같은 날 비슷한 제목). 에디터가 다른 id를 제안한다 — 파일을 손댈 필요 없음(api.md §3) |
| "다른 곳에서 저장됐습니다"(409 `stale`) | 다른 탭·손편집이 먼저 저장했다. 덮어쓰지 않았다 — 다시 불러와 비교 |
| 배포 사이트에서 글 클릭 시 404(로컬은 정상) | 루트 `.nojekyll` 없음. 파일을 되살리고 푸시 |
| 로컬 서버에서 `/.env`·`/docs/…`·`/CSS/…`가 404 | 정상 — 정적 서빙은 허용 목록·대소문자 정확(api.md §1) |
| `git push`가 인증 오류 | `gh auth login` 먼저(2026-09-22부터) |
| 저장은 됐는데 "커밋 실패(커밋 신원 없음)" | `/serve` §0 — 저장소 로컬 `git config user.name/email` 또는 `.env`에 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL` 후 `docker compose up -d` 재기동 |
| `docker compose up`이 "port is already allocated" | start.ps1이 5500을 잡고 있다. `netstat -ano \| findstr :5500` → 종료 |
| Docker Desktop이 "unexpected error … sailor-ingest.sock" | Docker Desktop 자체 문제(2026-09-21 발생). 종료 → `%LOCALAPPDATA%\Docker\run\` 정리 → 재시작. 프로젝트와 무관 |
| 스타일 없음 | CSS 5개 중 하나 404 |
| 콘솔 CSP 위반 | 인라인 `<script>`/`style=`/`on*=`가 HTML에 들어감 |

### D. 파일을 옮길 때
UTF-8, BOM 없이. `.claude/`를 빠뜨리면 에이전트·스킬이 사라진다. `start.ps1`은 ASCII 전용(한글을 넣으면 PowerShell 5.1이 깨뜨린다). `.env`는 커밋하지 않는다(`.gitignore`).

---

## § 11. 알려진 이슈

> 결함 전체 목록·담당은 `docs/meeting-08.md`(확정 결함 D1~D28 · 근본 원인 R-A~R-H · 이월 백로그 B8-1~13)에 있다. 아래는 요약.

- **치명 D1 — 새 글 id가 겹치면 기존 글을 덮어씀.** 서버 v1.2가 `ifNew`·`previousId`·`expectedUpdated`로 막는다(미커밋·미실측). **에디터가 필드를 보내기 전까지는 여전히 덮어쓴다** — 라운드 9 frontend-dev-2. 그때까지 같은 날 `Java …`로 시작하는 제목 두 편을 새로 쓰지 않는다(자동 id가 같아진다).
- **중대**: D2 저장 경로 실측 0회·자동 커밋이 이 PC에서 꺼짐(U1) · D3 에디터 "코드 블록 안" 판정 ≠ marked · D4 한글 조합 직후 닫는 짝 중복(IME 미확인) · D5 깨진 frontmatter가 방문자에게 보임 · D6 계약 게이트 구멍(2026-09-23 CLAUDE.md·`/round-start`로 문구·위치 보강) · D7 대필 경로(U2-A로 프로젝트 쪽 해소, 전역 파일은 사용자 몫) · D8 에이전트 정의가 확정 결정과 반대(2026-09-23 교체) · D9 결정 증발(§9 표·`/blog-meeting` 0단계) · D10 계약서 비대 · D11 상태줄 길이 폭주(서버 `reason` 60자 상한 완료, 문구 표는 B8-2) · D12 사이드바 고정 시 split 335px · D13 v4.2 단축키 발견 불가.
- 경미 D14~D28은 meeting-08 "경미" 표. `start.ps1`은 정적 서빙에 허용 목록이 없다(프로젝트 루트 전체를 준다 — 로컬 미리보기 전용이라 경미, frontend-dev-2 파일).
- 서버 낙관적 잠금은 v1.2에서 선택 필드로 들어갔다(`api.md` §6-2). 다른 탭의 **초안**끼리 충돌(D22)은 여전히 이월 B8-5.
