# 라운드 5 선정 회의 (2026-09-20)

> 사용자 지시: **"너네가 알아서 회의 한 다음 골라서 개편해. 그리고 언제나 사용자(나, 그리고 보는 사람들)을 기준으로 만들어."**
> 이번 회의는 결함 감사가 아니라 **선정 회의**다. 후보 A(기능 16) · B(자동화 12)를 사용자 기준으로 판정하고, 한 라운드 분량만 채택했다.
> 기준: HEAD `82f1e91`, `docs/api.md` v1.0, 글 0편. `css/*`·`docs/contract.md`는 web-designer가 v3.7로 고치는 중이라 **판정 근거에서 제외**했다(계약서 최신판은 라운드 시작 시 다시 읽는다). 코드는 고치지 않았다.

## 합의된 현황

- **meeting-04 라운드 5 지시는 전부 미이행이다.** HEAD 이후 커밋은 `82f1e91`(전구 인트로) 하나. 치명 3건이 코드에 그대로 있다 — `js/editor.js:1431-1483 doSave`·`:1486-1509 onSaved`에 `autosave.cancel()`이 없고(`cancel`은 `:427` 내보내기 경로뿐), `state.slot`은 `:1726`(수정)·`:1763`(새 글)에서만 바뀌어 새 글 저장 뒤에도 `'new'`로 남는다. `/fixture`도 여전히 `posts/_tmp` 공유(`.claude/skills/fixture/SKILL.md` §2). **데이터 유실 수정은 어떤 후보보다 앞선다.**
- 서버(`server/app.py`)는 저장·삭제·분류 병합·원자적 쓰기·폴더 자동 생성(`posts.py:557 mkdir(parents=True)`)까지 돼 있다. 후보 B-2(새 분류 → 폴더+categories.json)는 **서버 모드에서 이미 구현**돼 있다(`editor.js:1450-1457`이 글보다 먼저 `PUT /api/categories`).
- `/api/health`가 매 호출 `git status`를 돈다(`app.py:98-116`, 타임아웃 30초). 에디터는 응답의 `git` 필드를 **쓰지 않는다**(`editor.js`에 `json.git` 참조 0) — 떼어내도 안전하다.
- 원격은 HTTPS(`github.com/solmin6320/study-Blog.git`), 컨테이너에는 자격 증명이 없다(`Dockerfile:4` git만 설치, `docker-compose.yml` 마운트는 프로젝트 루트 하나). **커밋은 컨테이너 안에서 가능, 푸시는 토큰 없이는 불가.**
- 마크다운 살균은 DOMPurify html 프로파일 + FORBID 11태그(`markdown.js:64-67`). `details`/`summary`는 프로파일 안에 있어 **새 문법 없이** 접기 블록을 쓸 수 있다.
- 사이드바·카드·상세는 index.json 메타 8개만 안다(본문 없음). 목록 단계에서 본문에 의존하는 기능(읽는 시간 등)은 스키마 변경이 따른다.

## 선정 기준

| 관점 | 묻는 것 |
|---|---|
| 작성자(사용자) | "쓰고 나면 끝"에 가까워지는가 · 데이터를 잃을 위험이 줄어드는가 · **복습에 실제로 쓰이는가** |
| 독자(방문자) | 읽는 데 방해가 없는가 · 빨리 뜨는가 · 폰에서 되는가 · 키보드·스크린리더로 되는가 |
| 비용 | 새 의존성 0 · 정적 배포 유지 · 한 라운드(3인 병렬, 각 200단어 프롬프트) 안에 들어가는가 · 두 소유자에 걸치면 접점 시그니처를 정할 수 있는가 |
| 순서 | meeting-04 치명 3건 → 중대 중 저장 흐름(M4-1~5) → 채택 후보 → 나머지 중대·경미 |

**글이 0편인 상태에서 "글이 많아야 의미 있는" 기능은 보류한다.** 지금 만들면 빈 화면을 장식하는 코드가 된다.

## 후보 판정표

### A — 기능

| # | 후보 | 판정 | 근거 |
|---|---|---|---|
| A-1 | "다시 볼 때 이것만" 절 자동 추출 요약 카드 | **채택** | 새 문법 없음(h2 제목 하나로 약속). 작성자는 복습 때 카드만 보고, 독자는 TL;DR을 얻는다. 절이 없으면 카드도 없어 무해. post.js 한 함수 + 계약 한 절 |
| A-2 | 복습 시기 배지(updated+7/30/90, "오늘 복습 N") | **보류** | 방문자 전원에게 "복습" 배지가 보인다(Pages에서 작성자와 독자를 구분할 수 없음). 복습 완료 상태(A-3) 없이는 배지가 영원히 남는다. 글이 쌓이고 사용자가 복습 방식을 말해 준 뒤 |
| A-3 | 읽음·복습 완료 체크(localStorage) | **보류** | 기기마다 따로 저장돼 폰·PC가 어긋난다. 독자에겐 쓸 일 없는 컨트롤. A-2와 함께 재검토 |
| A-4 | 셀프 퀴즈 블록 | **채택(문법 변경)** | `???` 새 문법 대신 **`<details><summary>`**(이미 살균 통과, 네이티브 키보드·스크린리더 지원). 툴바 버튼 하나 + prose 스타일 한 절. 복습에 직접 쓰인다 |
| A-5 | 연관 글 추천 | 제외 | v3.3에 있음 |
| A-6 | 학습 히트맵 | **기각** | 글 0편. 독자에게 의미 없는 장식. 사이드바 공간만 먹는다 |
| A-7 | 분류별 진행 현황 | **기각** | 사이드바가 이미 분류별 글 수를 보여 준다(`ui.js:486 renderSide` cats.count) |
| A-8 | 글 안 검색 하이라이트 | **기각** | 브라우저 찾기(Ctrl+F·폰 "페이지에서 찾기")가 이미 한다. 재구현은 접근성만 나빠진다 |
| A-9 | 목차 스크롤 스파이 | 제외 | v3.3에 있음 |
| A-10 | 단축키 j/k/t/[ | **기각** | 한 글자 단축키는 한글 IME·스크린리더 키와 충돌(WCAG 2.1.4 — 끄기 수단 필요). 독자 이득 대비 위험이 크다 |
| A-11 | 글 템플릿 | **채택(B-7과 합침)** | 툴바 "템플릿" 버튼 — 자동 삽입이 아니라 **한 번 클릭**. 자동 삽입은 빈 템플릿 저장·초안 비교(`sameForm`) 오판을 만든다. 템플릿에 A-1의 제목이 들어가 두 기능이 맞물린다 |
| A-12 | 이미지 붙여넣기 내보내기 | **보류 → B-4** | 내보내기 모드에서는 파일을 zip/dataURL로 내려야 해 비현실적. 서버 모드(B-4)로만 |
| A-13 | 읽는 시간 | **보류** | 상세 페이지만이면 반쪽, 목록까지 하려면 index.json 스키마(메타 8개)를 바꿔야 함 — store.js·posts.py·api.md 세 곳 |
| A-14 | 분류별 색 점 | **기각** | 분류 0개. 해시 색은 임의라 정보가 아니다(`color` 필드는 계약 §9-2에서 폐기) |
| A-15 | 종이 질감 | **보류** | 비주얼은 web-designer가 v3.7을 만드는 중. 그 결과를 보고 판단 |
| A-16 | 오늘의 한 글 | **기각** | 글 0편. 20편 넘으면 재검토 |

### B — 자동화

| # | 후보 | 판정 | 근거 |
|---|---|---|---|
| B-1 | 저장=커밋·푸시 | **채택(커밋까지, 푸시는 사용자 결정 1)** | "쓰고 나면 끝"의 핵심. 커밋은 컨테이너 안에서 자격 증명 없이 가능하고, 저장 직후 커밋되면 reflog로 복구 가능 = 유실 위험 감소. 푸시는 토큰이 필요하다(원격 HTTPS) — 비밀을 디스크에 두는 결정이라 사용자에게 올린다. env 스위치, 실패해도 저장은 성공 |
| B-2 | 새 분류 → 폴더+categories.json | **제외(이미 구현)** | `editor.js:1450-1457` + `posts.py:557`. 내보내기 모드는 원래 손으로 |
| B-3 | index.json을 .md frontmatter에서 재생성 | **보류(라운드 7 첫 순위)** | 손으로 고친 .md·깨진 index 복구에 필요하고 ".md가 진실" 규칙(meeting-04 M4-2 판정)과 일치. 그러나 `posts.py`↔`store.js` 골든 벡터(M4-13)가 먼저다 — 없이 만들면 두 규칙이 또 갈라진다 |
| B-4 | 이미지 붙여넣기 → `POST /api/assets` | **보류(라운드 7)** | 요구사항 #5(그래프)를 실질적으로 푸는 길이고 가치가 크다. 서버 엔드포인트 + 에디터 paste + 경로 규칙 + 계약이 두 소유자에 걸쳐 이번 라운드(치명 수정)에 겹치면 위험 |
| B-5 | `/learn --post`도 1번 경로 | **기각** | 저장소 밖 로컬 도구. 결과 .md는 B-3(재생성)로 흡수하면 되고 별도 경로가 필요 없다 |
| B-6 | `start.bat` 하나로 Docker↔ps1 자동 선택 | **채택** | "무엇을 켜야 하지"를 없앤다. 독립 파일, ASCII 30줄. Docker 데몬이 안 떠 있으면 ps1로 폴백 |
| B-7 | 새 글 = 복습 템플릿 자동 삽입 | **A-11로 합침** | 위 |
| B-8 | 태그 자동완성 | **보류** | 쉼표 구분 입력에 `<datalist>`는 전체 값만 완성해 쓸모없고, 칩 UI는 계약+40줄. 이번 라운드 frontend-dev가 태그 대소문자를 통일하면 드리프트의 절반은 사라진다 |
| B-9 | pre-commit 훅(Node 없이) | **기각** | 훅은 저장소에 실리지 않아 PC마다 설치 절차가 생긴다. 서버 검증 + B-3이 같은 일을 한다 |
| B-10 | 복습 배지 | A-2 보류 | 위 |
| B-11 | SessionStart 훅 git fetch | **기각** | `/sync`가 있다. 세션마다 네트워크 대기가 붙는다 |
| B-12 | `/round-start`가 회의록 지시 자동 파싱 | **보류** | 회의록의 `### 담당자` 절을 그대로 붙이면 되므로 이미 거의 그렇다. 스킬 개정은 pm 여유가 생기면 |

**채택 합계: T4-1~3(필수) + A-1 · A-4 · A-11 · B-1(커밋) · B-6 — 5개.** 그 외 meeting-04 중대 중 저장 흐름과 직결된 것(M4-1~5)과 pm 문서 부채를 같이 처리한다.

## meeting-04 미결 결정 — pm이 대신 정한 것 (사용자가 뒤집으면 따른다)

| 결정 | 선택 | 이유 |
|---|---|---|
| 1. 요구사항 #2 메모지·#10 흐르는 배경 | **기준선 폐기 확정** | 사용자가 v3.0에서 직접 고른 결과 |
| 2. `posts.py`↔`store.js` 이중화 | **(A) 유지 + 골든 벡터** | 서버가 `created` 불변을 강제하려면 어차피 파싱한다. 라운드 7 |
| 3. 요구사항 #5 SVG 그래프 | **현행(살균 표면 안 넓힘)** | 라운드 7 B-4 이미지 업로드가 같은 문제를 살균 확대 없이 푼다 |
| 4. JS 꺼진 방문자에게 에디터 폼 노출(M4-8) | **(B) 정적 `hidden` + JS 해제** | 사용자가 앞서 "절대 안 보이게"를 원했다. 계약 §8-2 예외 조항 |
| 5. `editor.js` 3파일 분리(M4-12) | **승인, 라운드 7** | 이번 라운드 치명 수정과 같은 파일이라 동시에 하면 충돌 |

## 다음 라운드(라운드 6) 작업 지시

**순서**: ① pm `/fixture` 격리(선행, 10분) → ② web-designer 계약 **v3.8**(v3.7 위에) → ③ frontend-dev · frontend-dev-2 · pm(서버) **3인 병렬**. pm 파일(`server/*`, `docs/*.md`, `CLAUDE.md`, `.claude/skills/*`)은 개발자 파일과 겹치지 않는다.

### 접점 (양쪽에 똑같이 적는다)

| 접점 | 정의 | 제공 | 소비 |
|---|---|---|---|
| `CFG.recap` | `js/config.js`에 `recap: { heading: '다시 볼 때 이것만', template: '## 핵심\n\n\n## 다시 볼 때 이것만\n- \n\n## 헷갈린 것\n- \n' }` | frontend-dev | post.js(`heading`), editor.js(`template`) |
| 요약 카드 마크업 | `.post-recap` (계약 §5-7 신설 — 위치·제목·aria) | web-designer | frontend-dev |
| 퀴즈 블록 | `.prose details` / `.prose details > summary` 스타일(§5-7) + 삽입 스니펫 `<details>\n<summary>Q. </summary>\n\n답\n\n</details>\n` | web-designer(스타일) | frontend-dev-2(툴바) |
| 툴바 버튼 2개 | `.md-btn[data-md="template"]` "템플릿", `.md-btn[data-md="quiz"]` "퀴즈" (§6 목록에 등재) | web-designer | frontend-dev-2 |
| JS-off 정적 숨김 | `write.html` `.editor`에 정적 `hidden`, `.site-nav`의 "쓰기" `li`에 정적 `hidden`; `admin.js`가 관리자일 때만 해제(§8-2 예외) | web-designer(계약) | frontend-dev-2(`write.html` `admin.js`), frontend-dev(`index/post/about.html`의 내비 `li`) |
| 저장 응답 `git` | `PUT /api/posts/{id}` 200 본문에 `"git": { "committed": true, "hash": "abc1234" }` 또는 `{ "committed": false, "reason": "…" }` (`docs/api.md` §2). `BLOG_AUTO_COMMIT` 꺼짐이면 필드 없음 | pm | frontend-dev-2(상태줄 "저장됨 · 커밋 abc1234") |
| 헬스 | `GET /api/health` → `{ok, version}`만. `git`은 `?git=1`일 때만(§2) | pm | (editor.js는 `git` 미사용 — 변경 없음) |

### web-designer (`docs/contract.md` v3.8, `css/*`)

1. §5-7 **`.post-recap`** 신설 — `.post-head` 아래·`.prose` 위, `<aside class="post-recap" aria-labelledby="recapTitle">` + `h2#recapTitle`(원문 h2를 그대로 옮김) + 본문 블록. 폰 360에서 한 줄 넘침 없이. 절이 없으면 요소 자체가 없다.
2. §5-7 **`.prose details`** — 퀴즈 카드(summary가 질문, 열면 답). 포커스 링·`prefers-reduced-motion` 준수. §7-1 "본문에 상태 있는 컨트롤 금지"에 **details 예외**를 한 문장으로.
3. §6 툴바에 `data-md="template"`·`data-md="quiz"` 등재. 기존 `.md-btn` 스타일 재사용, 새 클래스 없음.
4. §8-2 **JS-off 예외 조항**: `write.html .editor`·내비 "쓰기" `li`는 정적 `hidden`, `admin.js`만 해제. `body.admin-off` 안전장치(`base.css:209`)와의 관계 정리.
5. meeting-04 designer 1·2·4·7 묶음 — §3-2 Tab 순서 문구를 DOM 순서로, `.entry.is-hidden` 폐기, `.list-empty` 안 `button.btn` 등재, `--c-bg-2` 삭제, 카드·연관 제목 3줄 `line-clamp`, `title=` 툴팁 폐기 문장, §9-3 slug 밑줄 허용 여부. M4-10(`arrive` 첫 렌더만)은 v3.7에서 다뤘으면 확인만, 아니면 §11-4에 `data-ready` 규칙.

### frontend-dev (`index.html` `post.html` `about.html`, `js/{config,util,store,markdown,app,post,about,theme-init}.js`, `posts/*`)

1. `config.js`에 `CFG.recap` (접점 표 그대로).
2. **A-1** `post.js` — 렌더 뒤 `.prose`에서 `h2` 텍스트(`trim`)가 `CFG.recap.heading`과 같은 절(다음 `h2` 전까지)을 **옮겨서**(복제 아님 — 스크린리더 이중 낭독 방지) `.post-recap`에 넣는다. `h2`의 `id`는 유지(목차 링크가 그대로 닿는다).
3. **M4-9** `post.js:436-441` — `showError` 뒤에도 `renderSide()`·`fillSite()`.
4. **M4-6** `markdown.js:275-289` — 제목 id에 `h-` 접두사(또는 `document` 전체 id를 `used`에 포함).
5. **M4-7** `post.js:263-304` — 목차 클릭 직후는 클릭한 절 고정, 마지막 절은 "스크롤 끝이면 마지막".
6. **M4-10 JS 몫** — 계약서 최신판 §11-4대로 첫 렌더 뒤 `data-ready`, 필터 재렌더는 `arrive` 없음.
7. 태그·분류 비교를 trim+소문자로 통일(`app.js:72,338`, `post.js:182`와 동일), `?cat=` 대소문자 무시.
8. **M4-8** — `index/post/about.html` 내비 "쓰기" `li`에 정적 `hidden`(계약 §8-2). 해제는 `admin.js`가 한다(dev-2).

### frontend-dev-2 (`write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1`)

1. **T4-1** `doSave` 시작·`onSaved`에 `autosave.cancel()`(`:427`과 동일). 저장 중 입력은 저장 완료 후에만 dirty.
2. **T4-2** 새 글 저장 성공 시 `state.slot = saved.id`, `history.replaceState`로 `?id=`, `store.draft.clear('new')`. 초안 복구(`applyDraftIfNewer`)는 `mode`·`originalId`·`created`를 슬롯 메타에서 복원.
3. **T4-3** rename 성공 시 `blogDraft:<옛id>` → `<새id>` 이전 후 옛 키 삭제, `state.slot` 갱신.
4. **M4-3** `ensureCreated` "지금 시각" 선택이 서버 경로에서도 `resolve(now)`로 이어져 모달이 닫힌다. **M4-4** 분류 미선택은 저장 거부 + 셀렉트 포커스(`:192` 첫 분류 폴백 삭제). **M4-5** 저장 성공 상태줄에 "글 보기 →"(`post.html?id=`)·"목록" 링크, 응답 `json.git`이 있으면 "· 커밋 abc1234" 또는 "· 커밋 실패: reason".
5. **A-11·A-4** 툴바 `data-md="template"`(본문이 비었으면 `CFG.recap.template` 전체, 아니면 커서 위치에 삽입)·`data-md="quiz"`(접점 표 스니펫). `TOOLBAR` 맵에 두 항목.
6. **M4-8** `write.html .editor` 정적 `hidden`, `admin.js`가 관리자일 때 해제(계약 §8-2).
7. **B-6** `start.bat` — `docker info` 성공(타임아웃 5초)이면 `docker compose up -d` 후 브라우저 열기, 아니면 지금처럼 `start.ps1`. 메시지 ASCII. `start.ps1:66-80` 충돌 문구에 "Docker 서버가 켜져 있으면 그쪽을 쓰세요", 기동 배너에 "저장 API 없음 — 내보내기만".
8. 경미: `write.html:256,260` Ctrl+S 문구 모드별, 오류 토스트 `role=alert`, 저장 중 내보내기 비활성.
9. **U-1 코드 블록 단축 입력** (사용자 원문 2026-09-20: "메모 쓸 때 // 2개 치면 코드를 쓸 수 있는 블록으로 만들어(단축키)"). 본문 입력칸에서 **줄 첫머리에 `//`** 를 치면 그 줄이 ```` ``` ```` 펜스 블록으로 바뀌고 커서가 블록 안 빈 줄에 놓인다. `//java` 처럼 뒤에 언어를 붙이고 Enter/Space면 ```` ```java ````. **이미 펜스 블록 안이면 발동하지 않는다**(코드 안의 `//` 주석을 지켜야 한다 — 커서 위쪽 펜스 개수가 홀수면 블록 안). `input` 이벤트에서 판정, `execCommand` 대신 `setRangeText`로 되돌리기(Ctrl+Z) 보존. 툴바 "코드" 버튼 툴팁과 placeholder에 `// 로 코드 블록` 한 줄 안내. 계약 §6 에디터 단축 입력 표에 등재(web-designer §6 갱신).
   코드 블록의 "블록색을 따로"는 v3.7의 IntelliJ 배경(라이트 흰색·다크 `#2B2B2B`)이 미리보기·상세에 적용되는 것으로 충족한다 — 입력칸(textarea)은 색을 못 입히므로 미리보기가 그 역할이다.

### pm-integrator (`server/*`, `docs/api.md`, `docs/HANDOFF.md`, `CLAUDE.md`, `.claude/skills/{fixture,serve,api-check}`)

1. **선행** `/fixture` 격리 — `posts/_tmp-<에이전트명>/`·`.bak.<에이전트명>`. 병렬 감사가 `posts/`를 공유하지 않는다.
2. **M4-1** `/api/health`를 `{ok, version}`만으로(100ms 안), `git`은 `?git=1`일 때만. api.md §2 갱신.
3. **B-1** `BLOG_AUTO_COMMIT=1`(compose 기본 켬)이면 `save_post`·`delete_post` 성공 뒤 `git add -A posts/ && git commit -m "글: <title> (<id>)"`. 커밋 신원은 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL` env → 없으면 저장소 config → 없으면 커밋 생략(`reason`). **커밋 실패가 저장 실패가 되지 않는다.** 줄끝(CRLF/LF)이 통째 diff를 만들지 않는지 실측. 푸시는 사용자 결정 1까지 안 한다. api.md §0 문장·§2 응답 갱신.
4. **M4-2** 서버 일치 3건 — `app.py:169-175` 정규화→병합 순서, `posts.py:544-550` 글 찾기(index 분류 신뢰), `posts.py:420` 동점 정렬. api.md §0에 "진실은 `store.js`" 한 문장.
5. **M4-11** `HANDOFF.md` 전면 갱신 + `CLAUDE.md` 소유표(`about.*` `theme-init.js` `start.ps1` `HANDOFF.md`)·구조도(`animations` 삭제, `about.*` `theme-init.js` `server/` 추가). `api.md:66` 폴백 서술 정정, §5 체크리스트에 9/18 Docker 통과 기록.

라운드 7 예약(이번에 안 함): M4-13 골든 벡터 → B-3 reindex → B-4 이미지 업로드 → M4-12 `editor.js` 분리.

## 사용자 결정 필요 사항

1. **B-1 푸시까지 자동으로 할 것인가**
   - (A) **커밋만 자동, 푸시는 `/ship`** — 비밀 없음. 저장 직후 로컬 이력이 남아 복구 가능. 공개 시점은 사용자가 정한다. *(권장 · 답이 없으면 이걸로 진행)*
   - (B) 푸시까지 — GitHub PAT를 `.env`(`.gitignore`)에 두고 컨테이너가 `git push`. 저장 즉시 공개. 토큰이 디스크에 평문으로 남고, 실수 저장도 즉시 공개된다.
   - (C) 자동 커밋도 안 함 — 현행 유지.
2. **실기기·스크린리더 확인** — 3라운드째 미실시. 휴대폰에서 목록·글·에디터를 한 번 열어 보고 이상한 점을 말해 주면 요구사항 #6을 "충족"으로 올린다.
3. 위 "pm이 대신 정한 것" 5건 — 뒤집을 것이 있으면 라운드 6 시작 전에.
