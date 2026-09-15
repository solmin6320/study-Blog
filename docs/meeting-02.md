# 라운드 2 통합 회의 (2026-09-15)

> 4인 병렬 감사(pm-integrator, web-designer, frontend-dev, frontend-dev-2) 결과를 통합했다.
> 이번 라운드는 **감사만** 진행했고 코드는 고치지 않았다. 회의 결과에 따라 라운드 3에서 고친다.

## 합의된 현황

- 라운드 2 개발은 끝났으나, 통합 회의 기록은 이번이 최초다(`docs/`에 `meeting-*.md`가 지금까지 없었음).
- 정량 근거는 준수 수준이 높다: `tokens.css` 외 CSS 리터럴 색상값 0건, `innerHTML`류 직접 대입 0건, DOMPurify 살균 경로 단일(marked → DOMPurify → highlight.js — 순서가 문서 설명과 다르지만 이 순서가 더 안전하므로 유지 권고), CDN 버전 3파일 전부 일치, `.md`↔`index.json` 3편 전수 대조 불일치 0건.
- 그럼에도 **치명 결함 1건**이 주 탐색 경로(상세→카테고리→전체)를 깨고 있어 이 상태로는 배포 불가 판정.
- git 저장소가 여전히 초기화되지 않아 7,500줄 이상이 백업 없이 폴더 하나에만 존재한다.
- 계약서 v2.1이 개발자에게 지시한 7개 항목 중 4.5/7만 이행됨.

## 요구사항 대조표 (16개 전부)

기준: `docs/HANDOFF.md` §1

| # | 요구사항 | 상태 | 근거 |
|---|---|---|---|
| 1 | Node.js 지양 | 충족 | 빌드 설정·`node_modules` 없음, `start.bat`은 단순 서빙 |
| 2 | 메모지 형태 | 충족 | `css/components.css:25-110` 종이 레이어·회전·6색 |
| 3 | 게시일+수정일 표시 | 충족 | `js/app.js:82-105`, `js/post.js:52-63`, `created≠updated` 데이터 3편 확인 |
| 4 | 제목 작성 | 충족 | `write.html:108`, 빈 제목 내보내기 차단 |
| 5 | 표·그래프·텍스트·코드 | 부분 | 표/코드/텍스트 충족, 그래프는 `USE_PROFILES:{html:true}`가 인라인 SVG를 제거해 이미지로만 가능 |
| 6 | 반응형 | 부분 | 브레이크포인트 4단 존재, 실기기 360px 검증 미실시 |
| 7 | 고급 애니메이션(jQuery 허용) | 충족 | `animations.css` 14종 keyframe, reduced-motion 대응, jQuery 미로드(허용이지 필수 아님) |
| 8 | 직접 글 추가 | 부분 | 파이프라인 전부 구현, 실제 클릭(내보내기 다운로드) 미검증 |
| 9 | 가독성·구조·고퀄리티 | 부분 | 정량 지표는 양호하나 치명 1 + 계약서 위반 다수로 기준 미달 |
| 10 | 흐르는 배경+애니메이션 | 충족 | `css/base.css` `.bg-mesh`/`.bg-grain`, reduced-motion 대응 |
| 11 | 의존성 사전 승인 | 충족 | CDN 3종만, 전부 승인 목록 내, 버전 일치 |
| 12 | GitHub Pages 공개/방문자 읽기전용 | 부분 | 관리자/방문자 DOM 분기 실제 동작 확인(헤드리스), 배포 자체 미완료 |
| 13 | 개발→회의→개선 반복 | 부분 | 개발은 진행, 회의 기록은 이번이 최초 |
| 14 | 카테고리 분리+직접 추가 | 충족 | 폴더·정의·네비·추가UI·내보내기 동반 전부 확인. 단 slug 경고문구(`.cat-new-hint`) 누락 |
| 15 | 폴더·파일 가독성 | 충족 | 구조 분리 양호. `HANDOFF.md`의 카테고리 폴더 수 기재(7)가 실제(3)와 다름 |
| 16 | 푸터 문구 | 충족 | 3개 HTML 전부 정확히 일치 |

**집계: 충족 10 / 부분 6 / 미충족 0**

## 확정된 결함

### 치명 (1건 — 2개 에이전트가 독립적으로 동일 결함을 다른 경로로 확인, 최고 신뢰도)

**T1. 필터 해제 후 메모 카드가 영구히 안 보인다**
- `js/app.js:171-172` — `applyFilter()`로 `is-hidden`을 붙인 뒤, `Blog.ui.reveal(qsa('.memo:not(.is-hidden)'))`가 **그 시점에 숨겨진 카드는 관찰 대상에서 아예 제외**한다. 이후 필터를 풀어도 `.is-visible`이 붙을 기회가 없어 `css/animations.css:209-210`의 `opacity:0`이 영구히 유지된다(`.memo.is-visible:not(.is-hidden)`에서만 `opacity:1`, `animations.css:215`).
- `applyFilter()` 호출부 5곳(`app.js:359,369,379,392,407`) 전부 동일하게 취약.
- 재현: 글 상세에서 카테고리 라벨 클릭(`index.html?cat=css`) → "전체" 클릭 → 나머지 카드가 빈 칸으로 남음. 검색/태그 필터도 동일. 정렬 변경이나 뒤로가기만 `renderBoard()`를 다시 돌려 우연히 복구됨.
- `prefers-reduced-motion: reduce`에서는 즉시 클래스가 붙어 재현되지 않음 — 헤드리스 검증에서 놓쳤던 이유.
- 영향: 기본 설정 방문자 전원, 이 사이트의 주 탐색 경로(상세→분류→전체) 전부.
- 수정 방향(1줄 수준): `applyFilter()` 말미에 `Blog.ui.reveal(qsa('.memo:not(.is-hidden):not(.is-visible)', dom.board))` 재호출.

### 중대

| # | 결함 | 위치 | 확인 에이전트 |
|---|---|---|---|
| M1 | `js/editor.js:962,971`의 `candidatePaths`/`fetchText`가 정의되지 않은 식별자 — 수정 모드 로드 실패 시 폴백 경로 전체가 죽고 영문 `ReferenceError`가 그대로 노출됨 | `js/editor.js:962,971` | pm-integrator, frontend-dev-2 |
| M2 | `.cat-item` ARIA가 계약서 v2.1 개정 #2 미반영 — 여전히 `aria-pressed`(카테고리·태그 칩 둘 다 "눌림"으로 들림). `aria-current="true"` + 비활성 시 속성 제거로 변경 필요 | `js/app.js:243,268`, `index.html:98` | pm-integrator(D-5), web-designer(C-1), frontend-dev(D2) — **3개 에이전트 일치** |
| M3 | `.cat-new-hint`(slug 불변 경고) 누락 — CSS(`components.css:1417-1424`)는 있는데 `write.html`엔 없음. 되돌릴 수 없는 결정 전에 경고가 마우스 호버(`title=`)에만 존재 | `write.html:127-142` | pm-integrator(D-4), web-designer(C-2) |
| M4 | CDN 3종(marked/highlight/DOMPurify)에 SRI(`integrity`)가 없음 — 공개 배포에서 CDN 오염 시 살균기 자체가 무력화됨. 새 의존성 추가가 아니므로 승인 불필요, 유지보수 부담만 소폭 증가 | `post.html:41-43`, `write.html:47-49` | pm-integrator |
| M5 | `js/editor.js`의 `replaceRange()`가 `textarea.value` 직접 대입 → **네이티브 undo 스택 파괴**. Tab/툴바 한 번이면 Ctrl+Z 불가, 800ms 뒤 자동저장이 초안까지 덮어써 되돌릴 수단 전무 | `js/editor.js:436-445` (호출 482,490,551,562) | frontend-dev-2 |
| M6 | 자동저장에 `beforeunload`/`pagehide` flush 없음 — 탭 강제종료 시 마지막 800ms 입력 유실 | `js/editor.js:407,1121-1126` | frontend-dev-2 |
| M7 | 내보내기 성공 여부 확인 없이 `draft.clear()` 실행 — 다운로드가 브라우저에 차단돼도 초안은 이미 지워짐 | `js/editor.js:761-765` | frontend-dev-2 |
| M8 | `created`가 비어있는 글을 수정 저장하면 경고 없이 오늘 날짜로 새로 찍힘(규약 4번 위반 경로) | `js/editor.js:692` + `js/store.js:188` | frontend-dev-2 |
| M9 | `store.js`의 `.md` 빈 값(`''`/`[]`) 병합 로직이 "파일에 값 없음"으로 오판 — 사용자가 `.md`에서 summary/tags를 지워도 `index.json`의 옛 값이 되살아남("`.md`가 진실" 원칙 위반). `pinned`만 예외 처리돼 있음 | `js/store.js:210-212` | frontend-dev(D3) |
| M10 | `surround()` 토글 감지가 `*`/`**`를 구분 못해 `**굵게**` 선택 후 Ctrl+I 하면 이탤릭으로 조용히 변질 | `js/editor.js:453-459` | frontend-dev-2 |
| M11 | 다크모드에서 `.memo::after` "그림자 쐐기"가 값 오류로 "빛 쐐기"로 반전 — hover 시 카드 우하단이 13% 밝아짐(위쪽 sheen과 겹쳐 층위 역전) | `css/components.css:86-95` | web-designer |
| M12 | `.post-nav-item` 스타일이 계약서 §11(파일 분업) 위반으로 `layout.css`/`components.css` 양쪽에 분산 + hover에 `transform` 개별 속성 대신 축약형 사용 | `css/layout.css:413-431` | web-designer |

### 경미

- aria-live 상태줄이 키 입력마다 갱신되어 스크린리더가 폭주(`js/editor.js:374-381,421-425`, `write.html:174`)
- 모달 배경에 `inert`/`aria-hidden` 없음(`js/ui.js:190`), 닫힘 220ms 동안 오버레이가 클릭을 삼킴(`css/components.css:754`)
- IME 조합 중 Tab/Ctrl+B 가드 없음(`js/editor.js:541-570`)
- `?admin=` 빈 값·임의 값이 전부 영구 off로 저장됨(`js/admin.js:38`)
- `[data-reveal]` 훅이 세 HTML 어디에도 없어 관련 JS(`app.js:519`, `post.js:185`)·CSS(`animations.css:210,227,462`) 전부 사문화 — 등록할지 걷어낼지 web-designer 결정 필요
- `post.html`이 `[data-site-title]`/`[data-site-sub]`를 채우지 않아 `index.json`의 사이트명을 바꾸면 상세 페이지만 옛 이름으로 남음(`js/post.js` 부재)
- 없는 id 접근 시 카테고리 7개+`_uncategorized`+평면 경로까지 최대 9회 순차 404 후 오류 표시(`js/store.js:440-470`)
- 깨진 frontmatter일 때 원문 전체가 본문에 그대로 렌더됨(`js/store.js:110`)
- `?cat=없는slug` 미검증 — 보드는 비는데 네비 활성 항목이 없어 원인 파악 불가(`js/app.js:328`)
- `rel="noopener noreferrer"` 자동부여가 `target="_blank"`에만 반응, `_top`/`_parent`는 누락(`js/markdown.js:27`)
- `css/components.css:988` `min-block-size: 32px` 리터럴 — 바로 아래 줄은 같은 속성에 토큰 사용 중이라 불일치
- `HANDOFF.md`의 CSS 줄 수 표(§3)가 실측과 다름(components 1493→1553, layout 577→599, prose 634→653, tokens 295→302), 카테고리 폴더 수(7→실제 3)도 부정확 — 문서 갱신 필요
- `HANDOFF.md` §9의 "`#postEdit`이 계약서에 미등재"는 **오보** — `contract.md:171`에 이미 v2.1에서 등재됨. pm/web-designer 교차 확인.

## 판정이 필요했던 충돌과 결론

실제 에이전트 간 정면 충돌은 없었다(같은 결함을 여러 경로로 확인하며 서로 보강하는 패턴이 대부분). PM/web-designer 판단이 필요했던 "계약서 vs 코드" 항목은 아래와 같이 정리한다.

| 항목 | 코드가 옳은가, 계약서가 옳은가 | 결론 |
|---|---|---|
| `.post-cat` span↔a | **코드가 옳다** | 상세→분류 목록으로 가는 유일한 경로. 계약서 §5를 `<a>`로 개정. CSS 호버 신호(색 심화+막대 확장+알약 틴트) 3종 모두 유지 |
| 툴바 DOM 순서(search→select→chips) | **코드가 옳다** | 1행 배치가 `검색\|정렬`이라 DOM=탭 순서를 맞춰야 함. 계약서 §4 개정 |
| `.cat-picker`/`.cat-new` 위치(`.editor-fields` 앞/뒤) | **코드가 옳다** | 분류는 저장 폴더를 정하는 유일한 필드라 요약·태그보다 먼저 결정돼야 함(계약서 자신의 "1차 축이 먼저" 원칙과 일치). 계약서 §10-4 개정 |
| `.cat-item` aria-pressed↔aria-current | **계약서가 옳다** | v2.1에서 이미 지시했으나 코드가 안 따라옴(M2). 코드를 고친다 |
| `.cat-new-hint` 유무 | **계약서가 옳다** | v2.1에서 신설을 지시했고 CSS도 있으나 마크업 누락(M3). 코드를 고친다 |
| `#postEdit` 계약서 미등재 여부 | **HANDOFF 오보로 결론** | 이미 v2.1에 등재됨. 실제 결함 아님. HANDOFF.md 수정 대상 |
| 마크다운 렌더 순서(marked→DOMPurify→hljs vs 문서상 marked→hljs→DOMPurify) | **코드(현재 순서)가 더 안전** | 살균 후 DOM에 하이라이트를 적용하는 지금 순서를 유지. 문서 설명만 현재 순서로 정정 |

## 다음 라운드 작업 지시

파일 소유권이 겹치지 않게 배분한다. **web-designer의 계약서 v2.2 개정이 먼저 끝나야** frontend-dev/frontend-dev-2가 그 위에서 작업할 수 있다.

### web-designer (`docs/contract.md`, `css/*`) — 선행 작업

1. 계약서 v2.2 개정 10건: `.post-cat`→`<a>`, 툴바 순서, `.site-nav` "쓰기" 링크 등재, `.cat-item[title]` 등재(단 "필수 정보는 name에" 제약 동봉), `.site-nav` 440px 소거 반응형 주석, `.cat-picker` 위치(`.editor-mode` 다음/`.editor-fields` 앞), `.code-lang` 등재, `[data-reveal]` 예약 훅 또는 제거 결정, 스킵 링크 마크업 등재(§3)
2. M11 다크모드 `.memo::after` 반전 수정(`css/components.css:86-95`) — `--c-scrim` 기반으로 교체하거나 다크 오버라이드 3~5%로 축소
3. M12 `.post-nav-item` 스타일을 `layout.css`→`components.css`로 이관 + hover `transform` 축약형을 개별 속성(`translate`)으로 교체
4. `css/components.css:988`의 `32px` 리터럴을 토큰으로 교체

### frontend-dev (`index.html`, `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*`)

1. **최우선** T1 수정 — `applyFilter()` 5개 호출부 이후 새로 드러난 카드에 reveal 재적용
2. M2 `aria-pressed`→`aria-current` 전환(`js/app.js:243,268`, `index.html:98`) — web-designer 계약서 v2.2 반영 후 진행
3. M9 `store.js:210-212` 병합 로직 수정 — 키 존재 여부로 판정(값이 아니라)
4. M4 `post.html`의 CDN 3종에 SRI 추가
5. frontend-dev-2의 요청(M1 관련): `Blog.store`에 `fetchText`/`postCandidates` export, `loadPost(id, categoryHint)` 시그니처 추가
6. 여유가 되면: `post.html`에 사이트명 채우기 로직 추가, `?cat=` 유효성 검사, 정렬 변경 시 `aria-live` 과다 발화 완화

### frontend-dev-2 (`write.html`, `js/{editor,ui,admin}.js`, `start.bat`)

1. M1 `candidatePaths`/`fetchText` 수정 — frontend-dev가 export하는 `store.*` 함수로 교체
2. M5 `replaceRange()` undo 파괴 수정 — `document.execCommand('insertText')` 우선 사용 + 실패 시 현재 방식 폴백
3. M3 `.cat-new-hint` 마크업 추가(`.cat-new`의 입력칸보다 먼저, 계약서 §10-4 문구 그대로)
4. M6 자동저장에 `beforeunload`/`pagehide` flush 추가
5. M7 내보내기 성공 확인 전 `draft.clear()` 호출 금지
6. M8 `created` 빈 값 감지 시 사용자 확인 절차 추가
7. M10 `**`/`*` 토글 구분 수정
8. `write.html`의 CDN 2종(marked, dompurify — highlight도 쓰면 포함)에 SRI 추가
9. 여유가 되면: aria-live 상태줄 과다 발화 완화, 모달 `inert` 처리, IME 조합 가드

### pm-integrator (`docs/meeting-*.md`, `CLAUDE.md`)

1. `docs/HANDOFF.md` 갱신 — CSS 줄 수 표, 카테고리 폴더 수, `#postEdit` 오보 정정
2. 라운드 3 종료 후 재소집

## 사용자 결정 필요 사항

1. **git 저장소 초기화 + GitHub Pages 배포 승인** — 에이전트가 대신 만들 수 없다. 저장소 이름, `git init`/원격 추가/최초 push 실행 여부를 결정해 달라. (7,500줄 이상이 백업 없이 라운드 3째 유지 중)
2. **CDN 3종에 SRI(`integrity`) 도입 여부** — 권장: 도입. 새 의존성 추가가 아니라 기존 의존성 고정 강화라 규약 2번 승인 대상은 아니지만, 버전 올릴 때 해시도 같이 갱신해야 하는 유지보수 부담이 생긴다.
3. **요구사항 #5 "그래프" 처리 방식** — 현재 DOMPurify가 인라인 SVG를 제거해 이미지 캡처만 가능. 권장: (A) 현행 유지(사용자가 이미 그래프 사용 가능성을 낮게 봤음). 대안: (B) SVG 프로파일 허용(살균 표면 확대), (C) 차트 라이브러리(이미 제외 결정, 비권장).
4. **로컬에서 실제 클릭 검증** — `http://localhost:5500`에서 내보내기 다운로드, 새 카테고리 추가, 테마 토글 지속성을 직접 확인해 달라(자동화 시도는 안전상 중단함). T1 수정 후 재확인 시 상세→카테고리→전체 클릭도 함께 봐 달라.
