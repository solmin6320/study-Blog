# 인수인계 문서 — 개인 학습 블로그

> 이 문서 하나만 읽으면 프로젝트 맥락이 복원되도록 작성했다.
> **최종 갱신: 2026-09-22 (라운드 8 개발 중 · HEAD `13936b9` 계약서 v3.9 이행 진행 · 사용자 글 1편)** — 이번 갱신은 부분: §1·§4·§6·§7·§9·§10(저장 단일 모드·about 삭제·`.nojekyll`·`gh auth login`). 나머지 절은 2026-09-21 실측 그대로.
> 갱신 방법: Claude Code에서 `/handoff` 실행. 오래된 인수인계 문서는 없는 것보다 나쁘다(이 문서는 9/15 v2.2 상태로 6일간 방치돼 meeting-04 M4-11 결함이 됐다).

---

## § 1. 이 프로젝트가 무엇인가

공부한 내용을 기록하는 **개인 학습 블로그**. 순수 HTML/CSS/JS로 만들고, **빌드 도구 없이** GitHub Pages(`https://github.com/solmin6320/study-Blog`, 공개)에 정적 파일을 그대로 올린다.
글은 **로컬 에디터 서버**(FastAPI, Docker — 파이썬은 여기에만)로만 저장한다(라운드 8, 계약 v3.9 §6-1 — `.md` 내보내기는 폐지). Docker가 없는 PC는 미리보기 전용이다. 방문자는 읽기 전용이다.

### 사용자가 직접 말한 요구사항 (검수 기준선)

| # | 요구사항 | 상태 (meeting-04 기준) |
|---|---|---|
| 1 | 개인 학습 블로그 / HTML·CSS·JS만 / Node.js 지양 | 충족. 파이썬은 로컬 서버(`server/`) 한정 |
| 2 | 게시글이 메모지 형태로 보일 것 | **기준선 폐기** — 사용자가 v3.0에서 "AI티"라며 직접 거부, 리스트/카드 그리드로 교체 |
| 3 | 각 글마다 게시 날짜와 최종 수정 날짜 | 충족 (`post.js`, 서버 `created` 불변 실측) |
| 4 | 제목 작성 | 충족 |
| 5 | 본문에 어떤 내용이든(표·그래프·텍스트·코드) | 부분 — 인라인 SVG 그래프 불가(살균 표면을 넓히지 않기로 결정 3). 이미지로 넣는다. 라운드 7 이미지 업로드(B-4)가 실질 해법 |
| 6 | 최신 반응형 웹 | 부분 — 360/768/1024/1440 헤드리스 통과, **실기기 미확인**(3라운드째) |
| 7 | 애니메이션·슬라이드 등 (jQuery 허용) | 충족 — 콘텐츠 도착·테마 크로스페이드·전구 인트로(v3.6~3.7) |
| 8 | 사용자가 직접 그때그때 추가 | 충족 — 서버 저장 단일(라운드 8에서 내보내기 폐지, 사용자 판정). 저장 흐름 치명 3건(T4-1~3)은 라운드 6에서 수정. 사용자 첫 글 `posts/java/` 1편 실재 |
| 9 | 가독성·전체 구조·세부 구조·고퀄리티 | 부분 — 가독성 실측 양호, 관심사 분리(M4-12) 라운드 7 |
| 10 | 배경은 단색보다 흐르는 느낌 + 어울리는 애니메이션 | **기준선 폐기** — 사용자 선택으로 흐르는 배경 제거(`base.css`), 모션은 "은은하게" |
| 11 | 외부 의존성은 사용자 사전 승인 | 충족 — CDN 3종(marked·DOMPurify·highlight.js, SRI). jQuery 승인만 받고 미사용. fastapi·uvicorn은 로컬 서버 한정 |
| 12 | GitHub Pages 공개, 방문자 읽기 전용 | 충족 — hostname 잠금. JS 꺼진 방문자 폼 노출(M4-8)은 라운드 6 정적 `hidden`으로 |
| 13 | 개발 → 통합 회의 → 개선안 → 개발 반복 | 충족 — 회의록 `docs/meeting-02~05.md` |
| 14 | 카테고리별로 나누고 직접 추가 | 충족 — 분류 = 폴더, 에디터·서버 양쪽에서 추가 |
| 15 | 폴더·파일 가독성 | 부분 → 라운드 6에서 `CLAUDE.md` 소유표·구조도 정정 |
| 16 | 푸터 `© 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다` | 충족 — 4개 HTML 동일 |

### 왜 이런 제약을 택했는가

- **Node.js 미사용**: 사용자 명시. 빌드가 없어야 `git push` 하나로 배포가 끝난다.
- **파이썬은 로컬 서버에만**(2026-09-18 사용자 결정): "쓰고 나면 끝"을 위해 저장 API가 필요했고, 공개 사이트는 여전히 정적 파일뿐이다. Docker는 `docker compose up` 한 줄로 켜기 위한 포장이다.
- **저장 단일 모드**(라운드 8, meeting-06 #2 사용자 판정 "다운로드 방식 없애"): 서버가 `posts/`에 직접 쓰고 자동 커밋(라운드 6). 라운드 7까지의 `.md` 내보내기 폴백은 폐지 — 다운로드한 `index.json`을 사람이 옮기는 흐름이 `created` 드리프트의 원인이었다. Docker 없는 PC는 미리보기 전용.
- **분류를 폴더로**: 글이 쌓여도 탐색기에서 바로 구분된다.

---

## § 2. 절대 규칙 (`CLAUDE.md`와 동일 — 깨면 그 작업은 실패)

1. **Node.js·npm·빌드 도구 금지.** 파이썬은 `server/`에만.
2. **새 외부 의존성은 사용자 승인 없이 추가 금지.** 승인: jQuery, marked.js, highlight.js, DOMPurify(CDN 고정 버전 + SRI). 제외: Chart.js, KaTeX.
3. **마크다운 렌더 결과는 예외 없이 DOMPurify를 거친 뒤 DOM에.** `innerHTML` 직접 대입 금지. 순서는 marked → DOMPurify → highlight.
4. **`created` 불변, `updated`는 저장마다 갱신.** 서버도 요청의 `created`를 무시하고 디스크 값을 쓴다(`docs/api.md` §2).
5. **색·간격·폰트·그림자는 `css/tokens.css` 변수로만.** 다른 CSS의 리터럴 색은 결함(실측 0건 유지 중).
6. **클래스명·구조 변경 전에 `docs/contract.md` 먼저.** 계약서가 단일 진실 공급원. 현재 **v3.8**.

---

## § 3. 현재 상태 (2026-09-21 실측)

| 영역 | 파일 | 줄 수 | 비고 |
|---|---|---|---|
| 토큰 | `css/tokens.css` | 395 | |
| 기본 | `css/base.css` | 253 | 흐르는 배경 제거됨 |
| 레이아웃 | `css/layout.css` | 800 | |
| 컴포넌트 | `css/components.css` | 1,822 | 카드 그리드·사이드바·인트로 |
| 본문 | `css/prose.css` | 743 | IntelliJ 코드색(v3.7) |
| 테마 초기화 | `js/theme-init.js` | 58 | `<head>`에서 첫 페인트 전 테마 적용 |
| 설정·유틸 | `js/config.js` `js/util.js` | 77 · 420 | |
| 데이터 | `js/store.js` | 857 | **파일 규칙의 진실**(서버 `posts.py`가 이식) |
| 마크다운 | `js/markdown.js` | 338 | |
| UI 공통 | `js/ui.js` | 623 | 테마·모달·사이드바 |
| 관리자 | `js/admin.js` | 53 | hostname `localhost`면 관리자 |
| 목록·상세 | `js/app.js` `js/post.js` | 540 · 479 | `js/about.js`는 라운드 8(v3.9)에서 삭제 |
| 에디터 | `js/editor.js` | 2,084 | 라운드 7에 3파일 분리 예정(결정 5). 라운드 8에 내보내기 경로 삭제 |
| HTML | `index.html` `post.html` `write.html` | 145 · 168 · 279 | `about.html`은 라운드 8(v3.9)에서 삭제 |
| 서버 | `server/app.py` `server/posts.py` | ~450 · ~670 | FastAPI. `Dockerfile`·`docker-compose.yml` |
| 문서 | `docs/contract.md` v3.8(2,600+) · `docs/api.md` v1.1 · `docs/meeting-02~05.md` | | |
| 글 | `posts/index.json`·`categories.json` — **글 0편, 분류 0개** | | 픽스처는 `/fixture` v2 규칙(샌드박스) |
| 스킬 | `.claude/skills/` **24개** | | |

**커밋 19개, HEAD `02a4a47`(v3.7). 라운드 6 작업분은 커밋 전.**

### 실측으로 확인된 것 (meeting-04, 2026-09-18)

- `tokens.css` 밖 리터럴 색 0 · CSP 4페이지 동일 · `innerHTML` 0 · 예외 4종 문구 전부 표시 · 360~1440 가로 넘침 0 · 최저 대비 5.30:1
- 로컬 서버: Docker 첫 기동, 저장 API 왕복(`created` 위조 차단) 통과
- 라운드 6 서버 v1.1(헬스 축소·자동 커밋·Host 검사·규칙 일치)은 **미실측** — 9/21 Docker Desktop 기동 실패(`docs/api.md` §5-1). 다음 세션 첫 일

### 미검증 (다음 담당자가 확인할 것)

- **실기기(휴대폰)** 목록·글·에디터 — 3라운드째 미실시. 사용자 결정 2
- 스크린리더(NVDA) 실사용
- 네이티브 Ctrl+Z(툴바 삽입 후) — 사람이 직접

---

## § 4. 폴더·파일 구조

```
index.html / post.html / write.html     (인라인 스크립트·스타일 0 — CSP. about.html은 v3.9에서 삭제)
.nojekyll                **필수** — 없으면 GitHub Pages의 Jekyll이 posts/*.md를 .html로 바꿔 글이 404 (2026-09-22 실제 발생, `13936b9`)
start.bat / start.ps1    start.bat: Docker 데몬이 있으면 compose, 없으면 start.ps1(PowerShell HttpListener, 5500 — 정적 미리보기 전용, 저장 API 없음 → 글 저장 불가)
Dockerfile / docker-compose.yml / .dockerignore      로컬 에디터 서버. `docker compose up` → http://localhost:5500

css/   tokens → base → layout → components → prose   (이 순서로 로드. animations.css는 v3.0에서 삭제)
js/    theme-init(head) · config · util · store · markdown · ui · admin · app(index) · post · editor(write)   (about.js는 v3.9에서 삭제)
posts/ index.json(메타 목록) · categories.json(분류) · <slug>/<id>.md
server/ app.py(HTTP·저장 흐름·자동 커밋) · posts.py(store.js 이식) · requirements.txt
docs/  contract.md(계약서 v3.9) · api.md(서버 규약 v1.1) · meeting-NN.md(회의록) · HANDOFF.md(이 문서)
.claude/ agents/ 4인 정의 · skills/ 24개
```

### 소유권 (두 에이전트가 같은 파일을 만지면 서로 덮어쓴다 — 실제로 두 번 일어났다)

| 에이전트 | 역할 | 소유 |
|---|---|---|
| `pm-integrator` | 총괄·검수·분배 + 로컬 서버 | `docs/meeting-*.md` `docs/HANDOFF.md` `CLAUDE.md` `server/*` `Dockerfile` `docker-compose.yml` `.dockerignore` `docs/api.md` `.claude/**` |
| `web-designer` | 구조·계약서·비주얼 | `docs/contract.md` `css/*` |
| `frontend-dev` | 목록·상세·데이터 | `index.html` `post.html` `js/{config,util,store,markdown,app,post,theme-init}.js` `posts/*` |
| `frontend-dev-2` | 에디터·인터랙션·접근성 | `write.html` `js/{editor,ui,admin}.js` `start.bat` `start.ps1` |

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
| `id` | = 파일명. `isSafeId`: 영문·숫자로 시작, `[0-9A-Za-z._-]` 최대 200자, `..` 금지. **대소문자까지 정확히**(Pages는 구분, NTFS는 무구분 — `api.md` §6-1) |
| `created` | **불변.** 빈 값이면 `updated` → id 앞머리 `YYYY-MM-DD` 순으로 되살린다(`store.fallbackCreated`) |
| `updated` | 저장마다 현재 시각(KST `+09:00` ISO 8601) |
| `tags` | 배열. 비교는 trim+소문자(라운드 6 통일) |
| `category` | 단일 slug = 폴더명. `categories.json`에 없으면 `_uncategorized` |
| `pinned` | true면 목록 최상단 |
| ~~`color`~~ | v3.0에서 폐기(계약 §9-2). 남아 있어도 무시 |

`.md`와 `index.json`이 다르면 **`.md`가 진실**. "값이 비어 있음"과 "키가 없음"을 구분해 병합한다(`store.mergeMeta`, `$present`). 서버(`app.py _disk_created`)도 같은 순서다.

### `posts/categories.json`

```json
{ "categories": [ { "slug": "css", "name": "CSS", "description": "", "order": 0 } ] }
```
`slug`는 `^[a-z0-9_][a-z0-9_-]*$`, `index`/`categories`/`posts` 예약. 정렬은 `order` → 이름 `localeCompare('ko')`. 깨져도 목록은 index의 category 값으로 되살린다(3단 폴백).

### `posts/index.json`

`{ "site": {title, subtitle}, "posts": [메타 8개…] }` — 목록은 이 파일만 읽는다. 정렬은 `pinned` 우선 → `created` 내림차순. 재생성은 `store.buildIndexJson` = `posts.py build_index_json`.

---

## § 6. 글 추가 흐름 (서버 단일 — 라운드 8, 계약 v3.9 §6-1)

**저장 경로는 하나다: 로컬 에디터 서버(Docker).**
```
docker compose up            # 첫 실행은 이미지 빌드 1~2분. http://localhost:5500  (start.bat도 Docker가 있으면 이걸 띄운다)
write.html → 저장(Ctrl+S)    # PUT /api/posts/{id} → posts/<slug>/<id>.md + index.json 갱신 → posts/만 자동 커밋
/ship                        # 사용자가 푸시(공개 시점은 사용자가 정한다)
                             # 푸시는 `gh auth login` 후에만 된다(2026-09-22) — 로그인 전 push는 인증 오류로 거절된다
```
- 자동 커밋(`BLOG_AUTO_COMMIT=1` 기본)의 신원은 `.env`의 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL`(없으면 저장소 로컬 `git config`, 그것도 없으면 커밋 생략 + 응답 `git.reason`). **push는 하지 않는다** — 토큰을 디스크에 두지 않는다(사용자 결정 1 권장안 A).
- 서버가 `created`를 강제한다: 기존 글이면 디스크 값, 새 글이면 `now`. 규약은 `docs/api.md`.
- 배포에는 루트의 **`.nojekyll`이 필수** — 없으면 Pages의 Jekyll이 `posts/*.md`를 `.html`로 바꿔 글이 404다(2026-09-22 실제 발생, `13936b9`에서 추가). 지우지 않는다.

**Docker가 없는 PC** — `start.bat`이 `start.ps1`(정적 서버)로 떨어진다. 미리보기는 되지만 **글을 저장할 수 없다**: 에디터의 저장 버튼은 `disabled`, `#editorServer`가 `서버 없음 · start.bat(Docker) 실행 후 저장`을 보이고 `다시 연결` 버튼이 뜬다. 쓰던 초안은 localStorage에 남는다(영구 저장 아님). 라운드 7까지의 "파일로 내보내기"(`.md`·`index.json` 다운로드)는 **폐지**됐다 — 사용자 판정(meeting-06 #2·결정 사항 1).

---

## § 7. 아키텍처 판단과 이유

| 판단 | 이유 |
|---|---|
| 규칙의 진실은 `store.js`, 서버는 이식 | 화면이 읽는 규칙과 서버가 쓰는 규칙이 갈리면 "저장은 됐는데 안 보이는" 글이 생긴다. 라운드 7 골든 벡터로 기계 고정(결정 2-A) |
| 서버는 `127.0.0.1` + Host 검사, 인증·DB 없음 | 로컬 한 사용자용. 인증을 만들면 지켜야 할 표면만 는다 |
| 자동 커밋은 하고 push는 안 한다 | 저장 직후 로컬 이력이 남아 덮어써도 복구 가능. 공개는 사람이 정한다 |
| 목록은 `index.json`만, `.md`는 상세에서만 | 글 100개면 fetch 100번 |
| 살균은 marked → DOMPurify → highlight | 살균 끝난 DOM에만 하이라이트. 반대면 하이라이터 마크업이 살균을 안 거친다 |
| CDN SRI | 공개 배포에서 CDN 오염 = 살균기 무력화 |
| 관리자 모드는 보안이 아니라 UI 스위치 | 정적 사이트의 클라이언트 비밀은 전부 공개. hostname `localhost`로만 판정 |
| JS-off 방문자에게 에디터 폼 정적 `hidden`(라운드 6) | 사용자 "절대 안 보이게". 계약 §8-2의 유일한 예외 |
| 픽스처는 프로젝트 `posts/`가 아니라 샌드박스 사본 | 병렬 에이전트가 같은 `_tmp`를 덮었다(라운드 4). `/fixture` v2 |
| `editor.js` 분리는 치명 수정 뒤(라운드 7) | 같은 파일을 두 목적으로 동시에 고치면 충돌 |

---

## § 8. 지금 해야 할 일

**진행 중 — 라운드 6** (`docs/meeting-05.md` "라운드 6 작업 지시"가 기준):

| 담당 | 핵심 |
|---|---|
| web-designer | 계약 v3.8 — `.post-recap`(요약 카드), `.prose details`(퀴즈), 툴바 2버튼, JS-off 예외, 단축 입력 표 |
| frontend-dev | `CFG.recap`, 요약 카드 이동, M4-6/7/9/10, 태그 대소문자 통일, 내비 "쓰기" 정적 `hidden` |
| frontend-dev-2 | **T4-1~3(저장 모드 데이터 유실)**, M4-3/4/5, 템플릿·퀴즈 버튼, `.editor` 정적 `hidden`, `start.bat` 자동 선택, `//` 코드 블록 단축 |
| pm | `/fixture` 격리(완료) · 헬스 축소 · 자동 커밋 · 서버 일치 3건 · 문서(이 문서·`CLAUDE.md`·`api.md`) |

**라운드 7 예약**: M4-13 골든 벡터 → B-3 index 재생성 → B-4 이미지 업로드(`POST /api/assets`) → M4-12 `editor.js` 분리.

**사용자 결정 대기**(meeting-05): ① push 자동화 여부(권장 A: 커밋만) ② 실기기·스크린리더 확인 ③ pm이 대신 정한 5건(아래 §9) 뒤집을 것 있는지.

---

## § 9. 결정 기록

### 확정된 사용자 결정

| 항목 | 결정 | 시점 |
|---|---|---|
| 저장 방식 | ~~하이브리드(서버 저장 + 내보내기 폴백)~~ → **서버 저장 단일**(내보내기 폐지). Docker는 유지 | 9/18 파이썬·Docker 허용, 로컬 한정 → 9/21 meeting-06 #2 "다운로드 방식 없애" · 결정 사항 1 확정 |
| 소개 페이지 | `about.html`·내비 `소개` 삭제 | 9/21 meeting-06 #6 |
| 의존성 | jQuery·marked·highlight.js·DOMPurify. Chart.js·KaTeX 제외 | 초기 |
| 배포 | GitHub Pages 공개 저장소, 방문자 읽기 전용 | 초기 |
| 화면 | 메모지·흐르는 배경 폐기 → 리스트/카드 그리드, 사이드바, 은은한 모션 | v3.0~3.4 |
| 인트로 | 전구 인트로(첫 접속) | v3.6~3.7 |
| 라운드 5 선정 | "너네가 알아서 회의 한 다음 골라서 개편해. 사용자 기준으로" → meeting-05 채택 5개 | 9/20 |
| 코드 블록 단축 | 본문에서 `//` 두 개로 코드 블록(U-1) | 9/20 |

### 사용자가 위임해 pm이 정한 것 (meeting-04 미결 → meeting-05, 뒤집으면 따른다)

| # | 결정 | 선택 | 근거 |
|---|---|---|---|
| 1 | 요구사항 #2 메모지·#10 흐르는 배경 | **기준선 폐기 확정** | 사용자가 v3.0에서 직접 고른 결과. 대조표에서 "미충족"으로 세면 거짓 |
| 2 | `posts.py`↔`store.js` 이중화 | **(A) 유지 + 골든 벡터**(라운드 7) | 서버가 `created` 불변을 강제하려면 어차피 파싱. 진실은 `store.js`(`api.md` §0) |
| 3 | 요구사항 #5 SVG 그래프 | **현행 유지**(살균 표면 안 넓힘) | 라운드 7 이미지 업로드가 같은 문제를 푼다 |
| 4 | JS 꺼진 방문자에게 에디터 폼 노출 | **(B) 정적 `hidden` + JS 해제** | 사용자 "절대 안 보이게". 계약 §8-2 예외(web-designer·dev-2) |
| 5 | `editor.js` 3파일 분리 | **승인, 라운드 7** | 이번 라운드 치명 수정과 같은 파일 |
| B-1 | 저장 → 커밋·푸시 | **커밋만 자동(권장안 A), 푸시는 `/ship`** — 사용자 답 없으면 이대로 | 토큰을 디스크에 안 둔다 |

---

## § 10. 다른 환경에서 이어받는 방법

### A. Claude Code
`.claude/` 폴더가 있으면 에이전트 4개·스킬 24개가 살아 있다. 시작은 `/sync` → `CLAUDE.md` → `docs/contract.md` 최신판 → 최신 `docs/meeting-NN.md`. 개발 투입 `/round-start`, 회의 `/blog-meeting`, 서버 `/serve`·`/api-check`, 픽스처 `/fixture`(v2 — 샌드박스).

### B. Claude Code가 아닌 환경
1. 시작 프롬프트에 `docs/HANDOFF.md`(이 문서), `docs/contract.md`, `CLAUDE.md`, 최신 `docs/meeting-NN.md`를 붙인다.
2. §2 절대 규칙 6개를 프롬프트 앞에 명시한다. 특히 DOMPurify와 `created` 불변.
3. 4인 역할이 필요하면 `.claude/agents/*.md`를 시스템 프롬프트로 쓴다. 소유권 표(§4)를 지킨다.
4. 서버를 고치면 `docs/api.md`를 먼저 고친다. 파일 규칙은 `store.js`에 맞춘다.

### C. 로컬에서 확인하는 법
- **Docker Desktop이 있으면** `docker compose up` → `http://localhost:5500` (저장 API 포함). 끝은 `Ctrl+C` / `docker compose down`.
- **없으면** `start.bat` 더블클릭(PowerShell 5.1 내장, Python·Node 불필요) → 같은 주소, 저장 API 없음 — **미리보기 전용, 글 저장 불가**(내보내기 폐지).
- 둘 다 5500 — **하나만** 켠다. `file://`로 열면 fetch가 막혀 빈 화면이다.
- 관리자 UI는 hostname이 `localhost`일 때 자동(`?admin=`은 폐기). `127.0.0.1`은 start.ps1이 400을 준다.

| 증상 | 원인 |
|---|---|
| 목록이 "불러오는 중"에서 멈춤 | `posts/index.json` JSON 오류 |
| 글 클릭 시 "없습니다" | `id`·폴더 불일치(index의 category 폴더에 파일이 없음). 서버는 이 상태를 409로 막는다 |
| 에디터의 "저장" 버튼이 `disabled`, "서버 없음" 문구 | `/api/health`가 안 닿음 — start.ps1(저장 API 없음)이거나 Docker가 꺼짐. Docker를 켠 뒤 `다시 연결` 클릭(새로고침 불필요) |
| 배포 사이트에서 글 클릭 시 404(로컬은 정상) | 루트 `.nojekyll` 없음 — Jekyll이 `posts/*.md`를 `.html`로 바꾼다. 파일을 되살리고 푸시 |
| `git push`가 인증 오류 | `gh auth login` 먼저(2026-09-22부터) |
| 저장은 됐는데 "커밋 실패: 신원" | `.env`에 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL` 추가 후 `docker compose up -d` 재기동 |
| `docker compose up`이 "port is already allocated" | start.ps1이 5500을 잡고 있다. `netstat -ano \| findstr :5500` → 종료 |
| Docker Desktop이 "unexpected error … sailor-ingest.sock" | Docker Desktop 자체 문제(2026-09-21 발생). 종료 → `%LOCALAPPDATA%\Docker\run\` 정리 → 재시작. 프로젝트와 무관 |
| 스타일 없음 | CSS 5개 중 하나 404. `animations.css` 링크가 남았는지 |
| 콘솔 CSP 위반 | 인라인 `<script>`/`style=`/`on*=`가 HTML에 들어감 |

### D. 파일을 옮길 때
UTF-8, BOM 없이. `.claude/`를 빠뜨리면 에이전트·스킬이 사라진다. `start.ps1`은 ASCII 전용(한글을 넣으면 PowerShell 5.1이 깨뜨린다). `.env`는 커밋하지 않는다(`.gitignore`).

---

## § 11. 알려진 이슈

> 결함 전체 목록·담당은 `docs/meeting-04.md`(감사)와 `docs/meeting-05.md`(선정·라운드 6 지시)에 있다. 아래는 요약.

- **치명 3건(저장 모드 데이터 유실·덮어쓰기, T4-1~3)** — `editor.js` 자동저장 debounce가 서버 저장 뒤 발화, 새 글 저장 후 `slot='new'` 잔존, rename 후 초안 고아. **라운드 6 frontend-dev-2 최우선.** 수정 전까지 서버 모드에서 "타이핑 직후 Ctrl+S"와 "저장 후 바로 새 글"을 피한다.
- 중대 13건 중 라운드 6에서 다루는 것: M4-1(헬스, pm 완료) · M4-2(서버 일치, pm 완료) · M4-3/4/5(에디터 모달·분류·링크) · M4-6/7/9/10(상세·목록) · M4-8(JS-off) · M4-11(이 문서). 라운드 7: M4-12(분리) · M4-13(골든 벡터).
- 경미 22건은 meeting-04 "경미" 절. 태그 대소문자·`title=` 툴팁·`?cat=` 대소문자·죽은 export 13개 등.
- 서버: 낙관적 잠금 없음(검토 결과 `api.md` §6-2 — 두 기기 동시 편집이 실제로 생기면 `expectedUpdated` 선택 필드로).
