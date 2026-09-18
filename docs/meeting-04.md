# 라운드 4 통합 회의 (2026-09-18)

> 4인 병렬 감사(pm-integrator, web-designer, frontend-dev, frontend-dev-2) 결과를 통합했다.
> 사용자 지시: **"디자인·기능·가독성·구조·관심사·편의성 등 다양한 측면을 검증하고 개선할 점을 리스트로."**
> 기준: HEAD `a297376`, 계약서 v3.5, `docs/api.md` v1.0, 글 0편. 이번 회의는 **감사만** 했고 코드는 고치지 않았다.

## 합의된 현황

- v3.0 재설계 → v3.5까지 사용자 요청(리스트형 목록, 카드 그리드, 사이드바, 연관 글, 목차 스파이, 헤더 재배치, 테마 크로스페이드, 로컬 FastAPI 서버 + Docker)이 전부 코드에 반영됐고 Docker 첫 기동·저장 API 왕복(`created` 위조 시도 차단 포함)이 실측으로 통과했다.
- **기계적 지표는 건강하다**: `tokens.css` 밖 리터럴 0, CSP 4페이지 동일, `innerHTML` 0, 예외 4종 문구 전부 표시, 360~1440 가로 넘침 0, 최저 대비 5.30:1, 카드 제목 절단 없음.
- 그러나 **로컬 서버 도입으로 새 결함층이 열렸다**: 내보내기 모드 전제로 짜인 자동저장·초안 슬롯·모달 흐름이 저장 모드에서 **데이터 유실·덮어쓰기 경로**를 만든다(치명 3건, 2인 독립 확인). 서버(`posts.py`)와 브라우저(`store.js`)의 규칙 이식이 세 곳에서 어긋난다.
- 관심사 분리가 무너지는 중이다: `editor.js` 2,084줄에 책임 14개, 분류 정렬 규칙 **4벌**, created 비교자 **5벌**, `posts.py`↔`store.js` 동일성 검증 수단 0.
- 문서가 코드를 못 따라온다: `HANDOFF.md`는 9월 15일 v2.2 상태 그대로, `CLAUDE.md` 소유표·구조도에 `about.*`·`theme-init.js`·`start.ps1` 누락, `animations.css`(삭제됨) 잔존.
- 감사 자체의 결함: 병렬 에이전트 둘이 같은 `posts/_tmp`·`.bak`을 써 서로 덮었다(`/fixture` 격리 규정 부재).

## 요구사항 대조표 (16개)

기준: `docs/HANDOFF.md` §1. **#2·#10은 사용자가 v3.0에서 직접 폐기한 기준이라 "미충족"이 아니라 "기준선 개정 필요"로 적는다.**

| # | 요구사항 | 상태 | 근거 |
|---|---|---|---|
| 1 | Node.js 지양 | 충족 | `Dockerfile:2` python만. 파이썬은 로컬 서버 한정(규칙 1 개정) |
| 2 | 메모지 형태 | **기준선 폐기** | 사용자가 "AI티"로 거부 → 리스트/카드 그리드(`contract.md:79-85`). HANDOFF §1 개정 필요 |
| 3 | 게시일+수정일 | 충족 | `post.js:84-89`, 서버 `created` 불변 실측 |
| 4 | 제목 | 충족 | `editor.js:950` |
| 5 | 표·그래프·코드 | 부분 | SVG 그래프 불가(`markdown.js:80`). **5라운드째 미결** |
| 6 | 반응형 | 부분 | 4단 실측 통과. 실기기 미확인(2라운드 연속) |
| 7 | 애니메이션 | 충족 | `arrive`·크로스페이드. 단 M4-10 |
| 8 | 직접 글 추가 | 충족 | 내보내기 + 서버 저장. 단 T4-1~3 |
| 9 | 가독성·구조·고퀄 | 부분 | 가독성 실측 양호, 구조(관심사)는 M4-12 |
| 10 | 흐르는 배경 | **기준선 폐기** | 사용자 선택으로 제거(`base.css:5`) |
| 11 | 의존성 승인 | 충족 | CDN 3종. fastapi·uvicorn은 로컬 서버 한정 |
| 12 | Pages 읽기전용 | 충족 | hostname 잠금 실측. 단 JS-off 경로(M4-8) |
| 13 | 개발 사이클 | 충족 | meeting-03 지시 이행(pm ①② 제외) |
| 14 | 분류 직접 추가 | 충족 | 에디터·서버 양쪽. 단 M4-4 |
| 15 | 폴더·파일 가독성 | 부분 | 소유표·구조도 누락 5건 |
| 16 | 푸터 | 충족 | 4개 HTML 동일 |

**집계: 충족 10 / 부분 4 / 기준선 폐기 2 / 미충족 0**

## 확정된 결함

### 치명 (3건 — 저장 모드에서 데이터 유실·덮어쓰기)

| # | 결함 | 위치 | 확인 |
|---|---|---|---|
| **T4-1** | **서버 저장 직후 자동저장 debounce가 뒤늦게 발화** → 방금 지운 초안을 되살리고 `dirty=true`, 상태줄 "아직 내보내지 않았어요". 타이핑 후 800ms 안에 Ctrl+S면 재현. `doSave`/`onSaved`에 `autosave.cancel()` 없음(`:427` 내보내기 경로에만 있음) | `editor.js:405-416, 1431, 1486-1506` | pm · dev-2 **2인 독립** |
| **T4-2** | **새 글 서버 저장 후 `slot='new'` 잔존 + URL 미갱신.** 이어 타이핑하면 A글 초안이 `new` 슬롯에 남고, 다음 새 글에서 "임시저장본" 모달로 튀어나옴. 불러오면 `mode`/`originalId` 미복원 → id는 A인데 B 내용 → **A 덮어쓰기**, 내보내기 모드면 `created=now`(규칙 4 위반) | `editor.js:1486-1500, 1570-1608, 1761, 1100-1106` | pm · dev-2 **2인 독립** |
| **T4-3** | `previousId` rename 뒤 `state.slot`이 옛 id → 이후 초안이 `blogDraft:<옛id>`에 고아로. 새 id로 열면 안 보이고 옛 id는 404 모달. 목록의 "초안 N개" 경고만 영구 잔류 | `editor.js:1489-1504, 1726`, `app.js:457` | dev-2 |

### 중대 (13건)

| # | 결함 | 위치 | 확인 |
|---|---|---|---|
| M4-1 | `/api/health`가 매 호출 `git status`(bind mount에서 수 초~30초) — 에디터 타임아웃 2초. 서버가 떠 있어도 **조용히 내보내기 모드**로 빠질 수 있음 | `app.py:118-127`, `editor.js:1340` | pm (실측 미확인) |
| M4-2 | **서버↔브라우저 규칙 불일치 3건**: ① `created` 폴백 순서(브라우저 정규화→병합, 서버 병합→정규화 — 같은 입력에 다른 값) ② 글 찾기(서버 전 폴더 탐색, 브라우저는 index 카테고리 폴더만 — 폴더 어긋난 글을 서버는 저장 성공, 상세는 "없습니다") ③ 분류 정렬 동점(`localeCompare('ko')` vs 코드포인트) | `store.js:648,597-606,342` vs `app.py:169-175`, `posts.py:544-550,420` | dev · pm |
| M4-3 | `ensureCreated` "지금 시각을 게시일로"가 `return false`로 모달을 열어 둠 → 서버 저장 경로엔 다음 모달이 없어 **모달 영구 잔류**(배경 inert) | `editor.js:1085-1086`, `ui.js:167-171` | dev-2 |
| M4-4 | 분류 미선택 시 `cats.list[0]`으로 **조용히** 첫 분류 폴더에 저장 | `editor.js:192, 1765` | dev-2 |
| M4-5 | 저장 성공 후 글/목록으로 가는 링크 없음, URL `?id=` 미갱신 → 새로고침 시 빈 화면(초안은 이미 삭제됨) | `editor.js:1504-1507` | dev-2 |
| M4-6 | 본문 제목 id가 페이지 id(`#toc` `#main` `#post` `#side`)와 충돌 — `## toc` 목차 클릭 시 `<aside id=toc>`로 점프(헤드리스 재현) | `markdown.js:275-289` `used`가 root 안만 검사 | dev |
| M4-7 | 스파이: 목차 클릭 후 대상 절이 짧으면 *다음* 절이 활성, 마지막 절은 아래 콘텐츠가 60% 미만이면 영원히 활성 불가 | `post.js:263-270, 301-304` | dev (라운드 3 알려진 한계의 확장) |
| M4-8 | JS 꺼짐: `.editor` 폼 전체와 모든 페이지 "쓰기" 링크 노출. `body.admin-off`는 JS만 붙여 `base.css:209` 안전장치 무효 | `write.html:64,129`, `admin.js:38` | dev-2 (라운드 3 보류 항목) |
| M4-9 | `post.html`에 `?id` 없을 때 사이드바 빈 채(`.side-empty`도 없음), 사이트명 미채움 — `showError` 뒤 `return`으로 `renderSide()` 미호출 | `post.js:436-441` | designer (실측) |
| M4-10 | 크로스페이드 저점(t≈600ms, 대비 1.0:1)에 필터 클릭 시 `arrive`가 전 카드 opacity 0 → **이중 공백**. 같은 결과여도(검색 키 입력마다, "전체" 재클릭) 전 카드 재애니메이션 | `components.css:407`, `app.js:114-140` | designer (실측 cardOpacity 0) |
| M4-11 | `HANDOFF.md` 전면 부패 — 2026-09-15·v2.2·메모지·글 3편·스킬 18개·"Python 없어 start.bat 불가". 새 담당자가 읽으면 4라운드 전 상태로 오해 | `HANDOFF.md:4,58,83,122,286,329` | pm |
| M4-12 | **관심사 분리**: `editor.js` 2,084줄·책임 14개(분류 정규화·후보경로·사이드바·방문자 잠금이 store/ui/admin 중복), `typeof store.x==='function'` 방어 4곳, 죽은 폴백 `:1637-1720, 998-1012, 121-133`. 분류 정렬 규칙 4벌(`util.js:144, editor.js:110,1951, store.js:342`), created 비교자 5벌(`app.js:61 store.js:675,786 ui.js:414 post.js:197`), `renderSide` 래퍼 4파일. `ui.js` 4책임(테마·모달·사이드바 ~300줄·셸). `util.js:148`에 카드 마크업(뷰)이 삶 | 위 줄 | pm · dev-2 |
| M4-13 | **`posts.py`↔`store.js` 동일성 검증 수단 0** — 15함수 수동 이식, 골든 벡터 없음. `store.js` 한 줄 수정이 조용히 갈라진다(M4-2가 이미 그 증거) | `server/posts.py` 전체 | pm · dev |

### 경미 (22건 — 요약)

**계약서 ↔ 코드**: §3-2 "Tab 순서 햄버거→사이드바→본문"이 DOM(햄버거→브랜드→내비→테마→사이드바)과 다름, JS `focusIntoSide()`로 겉만 맞음 · `.entry.is-hidden`(§4-4·§8) 죽은 항목 — `renderList`가 전량 재렌더 · `.list-empty` 안 `button 조건 초기화`가 계약 밖(기능은 옳음) · §11 "같은 프레임 같은 중간색" 실측 거짓(`--dur-fast` 부품이 100~160ms 뒤쫓음, 체감 작음) · §9-3 "slug 소문자·숫자·하이픈"인데 코드는 밑줄 허용(`store.js:318`, `posts.py:26`)

**에디터·문구**: `write.html:256,260` "Ctrl+S 파일로 내보내기" 서버 모드에서 틀림 · `title=` 툴팁 잔존(`write.html:132,145,162,171`) · 서버 감지 완료 시 저장 버튼 무통보 출현 · 오류 토스트가 `role=status`(polite) · 저장 중 내보내기 클릭 가능 · 두 탭 동시 편집 시 `storage` 이벤트 미청취·낙관적 잠금 없음 · 제목→본문 Tab 11회 · `editor.js normalizeCat`이 `store.normalizeCategory`와 규칙 다름(`:96` vs `store.js:329`)

**렌더·데이터**: 태그 대소문자 — 연관 글은 `CSS`=`css`인데 목록 필터·인덱스는 별개(`app.js:72,338` vs `post.js:182`) · `?cat=_TMP` "분류 없음" · `post.html` index 파손 시 무안내(사이드바 "글이 없습니다"로 오도) · 깨진 frontmatter 원문이 본문에 그려지고 토스트가 방문자에게도 · index↔md 불일치 시 h1과 사이드바 제목이 다름 · 헤더 "태그" 재클릭 무반응(해시 유지+details 닫힘) · 연관 카드 208px에 44자 제목 5줄

**정리**: 미사용 export 13개(util 7: `escapeHtml hashCode hashUnit clamp pad2 toDate todayStampKst` / store 6: `peekPost getCategoriesSync findCategory categoryCounts slugifyCategory toFrontmatter`) · 죽은 토큰 `--c-bg-2`(`tokens.css:25,236,323` + `base.css:118` 전환 목록) · `ui.js prefersReducedMotion` export 사용처 0 · `config.js:45,62` 죽은 admin 설정 · `about.html:17` description 빈 값 · `api.md:66` "디스크에 created 없으면 요청값" ↔ 서버는 updated→id 폴백 먼저 · Host 헤더 미검사(DNS 리바인딩) · id 대소문자(NTFS 무구분 / Pages 구분) · `start.ps1:66-80` 충돌 문구가 Docker 서버 미언급, "저장 API 없음" 배너 부재

**문서**: `CLAUDE.md` 구조도 `animations` 잔존·`about.*`·`theme-init.js` 누락, 소유표에 `start.ps1`·`theme-init.js`·`about.*`·`HANDOFF.md` 없음 · `contract.md:110` pm 소유 ↔ `CLAUDE.md` 불일치 · `pm-integrator.md:81` 포트 "없음(코드를 띄우지 않는다)" 깨진 템플릿 · `/fixture` 대상 에이전트·포트 불일치 · `api.md §5` 체크리스트 미체크(Docker 검증 통과 기록 없음)

## 판정이 필요했던 충돌과 결론

| 항목 | 주장 | 판정 |
|---|---|---|
| T4-1·T4-2 | pm과 dev-2가 **독립적으로 같은 줄**(`editor.js:1486-1506`)을 지목 | 최고 신뢰. 실행 재현은 미실시(코드 확정) — 라운드 5 수정 후 스텁 6종에 "타이핑 직후 Ctrl+S"·"저장 후 새 글" 시나리오 추가 |
| M4-2 ① | dev "created 폴백 순서 다름" / pm "api.md ↔ 서버 폴백 순서" | **같은 결함의 두 면.** 서버가 규칙의 진실이 되면 안 된다 — `store.js`가 진실이고 서버가 따른다(`api.md` §0 "글자 단위로 같다"가 약속). M4-13 골든 벡터로 고정 |
| §11 크로스페이드 문장 | designer가 **자기 v3.4 주장을 실측으로 정정** | 채택. "체감 작음"도 실측이므로 CSS 변경 없이 문장만 정정 |
| `/fixture` 충돌 | dev: "다른 에이전트 픽스처를 덮었다" | **프로세스 결함 확정.** 병렬 감사에서 `posts/_tmp`·`.bak`이 공유됨. 회의 후 `posts/` 깨끗함은 확인(마지막 에이전트가 정리). 라운드 5 전에 `/fixture` 개정 필수 |
| M4-8 JS-off | dev-2: "정적 `hidden` 필요" ↔ 계약서 §8-2 "JS 성공 시에만 보이는 정적 콘텐츠 금지" | 라운드 3부터 보류. **사용자 결정 4**로 올린다 |
| 요구사항 #2·#10 | pm: "미충족" | **"기준선 폐기"로 정정.** 사용자가 직접 고른 결과를 미충족으로 세면 대조표가 거짓이 된다. HANDOFF §1 개정 |

## 다음 라운드(라운드 5) 작업 지시

**순서**: ① `/fixture` 개정(pm) → ② web-designer 계약 v3.6 → ③ dev 2인 병렬 → ④ pm 서버·문서. ①이 먼저다 — 안 그러면 ③에서 또 덮는다.

### pm-integrator (`server/*`, `docs/api.md`, `CLAUDE.md`, `HANDOFF.md`, `docs/meeting-*.md`, `.claude/skills/{fixture,serve,api-check}`)

1. **선행** `/fixture` 개정: 에이전트별 격리 — `posts/_tmp-<에이전트명>/`과 `.bak.<에이전트명>`, 또는 `git archive` 사본에서 검증. 병렬 감사 중 프로젝트 `posts/`를 공유하지 않는다.
2. M4-1 `/api/health`: `git status`를 캐시(예: 5초)하거나 `dirty`를 선택 필드로 분리(`?git=1`). 헬스는 100ms 안에 답해야 한다.
3. M4-2 서버 일치: ① `app.py:169-175` 정규화→병합 순서를 `store.js:648`과 같게 ② `posts.py:544-550` 글 찾기를 `store.js:597-606`과 같게(index 카테고리 신뢰) ③ `posts.py:420` 동점 정렬을 `localeCompare('ko')` 상당(`locale.strxfrm` 또는 명시 규칙)으로. **어느 쪽이 진실인지 `api.md` §0에 한 문장**: `store.js`.
4. M4-13 골든 벡터: `store.js`의 `isSafeId`·`slugifyCategory`·`normalizeMeta`·`toFrontmatter`·정렬에 입력 20개·기대 출력을 `server/tests/golden.json`으로 두고, `/api-check`가 서버 응답과 대조. JS 쪽은 브라우저 콘솔에서 같은 파일로 검증하는 한 줄 스크립트.
5. M4-11 `HANDOFF.md` 전면 갱신(v3.5·서버·Docker·스킬 24·글 0편·기준선 폐기 #2·#10) + `CLAUDE.md` 소유표에 `about.html` `about.js` `theme-init.js`(frontend-dev), `start.ps1`(frontend-dev-2), `HANDOFF.md`(pm); 구조도에서 `animations` 삭제·`about.*` `theme-init.js` `server/` 추가.
6. `api.md:66` 폴백 서술 정정, §5 체크리스트에 9/18 Docker 검증 통과 기록, `pm-integrator.md:81` 포트 문구 수리, `api.md`에 낙관적 잠금(`updated` 비교 → 409) 검토 결과 한 문단.
7. Host 헤더 `localhost`/`127.0.0.1` 검사, id 대소문자 규칙 명시(소문자 강제 여부 결정).

### web-designer (`docs/contract.md`, `css/*`) — 계약서 v3.6

1. §3-2 Tab 순서 문구를 DOM 순서로 정정(또는 DOM을 바꾸라는 지시 — 판단).
2. `.entry.is-hidden` 폐기(§4-4·§8), `.list-empty` 안 `button.btn` 등재, §11 크로스페이드 문장 실측대로 정정, `--c-bg-2` 삭제(`base.css:118` 전환 목록에서도).
3. M4-10: `arrive`를 **첫 렌더에만** — 필터 재렌더 시 재발동 금지 방법 결정(예: `.entry-list[data-ready]` 뒤엔 animation none, JS가 첫 렌더 후 속성 부여 — frontend-dev 지시 포함) + 테마 전환 중 필터 클릭 시 `arrive` 억제 여부.
4. 연관 글·목록 카드 제목 3줄 `-webkit-line-clamp` 또는 길이 가이드(§4-3·§5-8).
5. M4-8 결정(사용자 결정 4)을 받으면 §8-2 예외 조항 + `write.html`/`.site-nav` 정적 처리 계약.
6. M4-12 파일 분리를 승인받으면(사용자 결정 5) §1-1에 `editor-md.js`·`editor-io.js`·`side.js` 등재.
7. `title=` 툴팁 폐기 문장(§6·§9-3 근거 재확인), slug 밑줄 허용 여부 §9-3 정정.

### frontend-dev (`index.html` `post.html` `about.html`, `js/{config,util,store,markdown,app,post,about,theme-init}.js`, `posts/*`)

1. M4-9 `post.js:436-441` — `showError` 뒤에도 `renderSide()`·`fillSite()` 호출.
2. M4-6 `markdown.js:275-289` — 제목 id에 접두사(`h-`) 또는 `document`의 기존 id까지 `used`에 포함.
3. M4-7 `post.js` — 목차 클릭 직후는 클릭한 절을 고정(해시 = 활성), 마지막 절은 "스크롤 끝이면 마지막"으로.
4. M4-10 JS 몫 — web-designer 계약대로 첫 렌더 뒤 `data-ready` 부여, 필터 재렌더는 `arrive` 없음.
5. 태그·분류 비교를 trim+소문자로 통일(`app.js:72,338`, 연관 글과 동일), `?cat=` 대소문자 무시.
6. `post.html`에서 index 파손·중복 id 시 관리자 토스트(`app.js:465-477`과 동일), 깨진 frontmatter는 본문 대신 오류 문구 + `parsed.warnings` 관리자에게만.
7. 헤더 "태그" 재클릭: `href`가 이미 `#tags`면 `click`에서 `details.open=true` + 스크롤.
8. 고아 초안(T4-3 결과)을 목록의 "초안 N개" 경고에서 열기/버리기 할 수 있게(`app.js:457`) — dev-2와 슬롯 키 규칙 합의.
9. 미사용 export 13개 삭제, `config.js:45,62` 죽은 admin 설정 삭제, `about.html:17` description 채움.

### frontend-dev-2 (`write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1`)

1. **최우선 T4-1** — `doSave` 시작과 `onSaved`에서 `autosave.cancel()`(`:427`과 동일). 저장 중 입력은 저장 완료 후 dirty로만.
2. **T4-2** — 새 글 저장 성공 시 `state.slot = meta.id`, `history.replaceState`로 `?id=`, `blogDraft:new` 삭제. 초안 복구 시 `mode`·`originalId`·`created`를 슬롯 메타에서 복원(규칙 4).
3. **T4-3** — rename 성공 시 `blogDraft:<옛id>` → `<새id>`로 이전 후 옛 키 삭제.
4. M4-3 `ensureCreated` 서버 경로: 확인 모달의 "지금 시각" 선택이 `resolve(now)`로 이어지게(모달 닫힘 보장).
5. M4-4 분류 미선택은 **저장 거부 + 셀렉트 포커스**(조용히 첫 분류 금지). 분류 0개면 `_uncategorized` 명시 선택만 허용.
6. M4-5 저장 성공 상태줄에 "글 보기 →"(`post.html?id=`)·"목록" 링크, URL 갱신.
7. M4-8 사용자 결정 후 구현. 경미: `write.html:256,260` Ctrl+S 문구를 모드별로, `title=` 4곳 삭제, 서버 감지 완료 토스트 1회("로컬 서버 연결됨 — 저장은 Ctrl+S"), 오류 토스트 `role=alert`, 저장 중 내보내기 비활성, `storage` 이벤트로 다른 탭 갱신 감지 시 경고, `normalizeCat`을 `store.normalizeCategory`로 교체.
8. `start.ps1:66-80` — 충돌 문구에 "Docker 서버(`docker compose up`)가 켜져 있으면 그쪽을 쓰세요", 기동 배너에 "저장 API 없음 — 내보내기만".
9. M4-12 승인 시 `editor.js` 분리(`editor-md.js` 텍스트 조작·표 대화상자 / `editor-io.js` 내보내기·서버), 죽은 폴백 `:1637-1720, 998-1012, 121-133` 삭제, `typeof store.x` 방어 4곳 제거(store를 신뢰), `ui.js` 사이드바 → `side.js`.

## 사용자 결정 필요 사항

1. **요구사항 #2(메모지)·#10(흐르는 배경) 기준선 공식 폐기** — v3.0에서 직접 고른 결과다. HANDOFF §1을 개정해 대조표에서 "기준선 폐기"로 둘지 확인.
2. **`server/posts.py` ↔ `store.js` 이중화** — (A) 유지 + 골든 벡터로 고정(라운드 5 pm 4번, 권장) / (B) 서버가 클라이언트 직렬화 결과(frontmatter 문자열)를 그대로 받아 쓰도록 축소(규칙 코드가 한 곳이 되지만 서버가 `created` 불변을 강제하려면 결국 파싱 필요).
3. **요구사항 #5 그래프(SVG)** — 5라운드째. (A) 현행(이미지만) / (B) DOMPurify SVG 프로파일 허용(살균 표면 확대).
4. **JS 꺼진 방문자에게 에디터 폼이 보이는 것(M4-8)** — (A) 그대로(동작 안 하고 서버 영향 없음) / (B) 정적 `hidden` + JS가 해제(계약 §8-2 예외 조항 필요). 앞서 "절대 안 보이게"를 원했으니 (B) 검토 권장.
5. **`editor.js` 파일 분리(M4-12)** — 2,084줄을 3파일로. 구조 변경이라 승인 필요. 분리하지 않으면 라운드마다 결함 밀도가 오른다.
6. **실기기·스크린리더 검증** — 2라운드 연속 미실시. 사용자 휴대폰에서 한 번 확인해 주면 #6을 "충족"으로 올릴 수 있다.
