# 라운드 7 통합 회의 (2026-09-21)

> 4인 병렬 감사(pm-integrator, web-designer, frontend-dev, frontend-dev-2). 기준 HEAD `8fddaac`(v3.8 이행 완료), 사용자 첫 글 `posts/java/2026-09-21-note-125149.md` 1편.
> 사용자 원문 6건을 안건으로 삼았다. 감사만 했고 코드는 고치지 않았다.

## 사용자 원문과 판정

| # | 원문 | 판정 | 근거 |
|---|---|---|---|
| 1 | "전등 너무 빨라 살짝만 줄여(0.2초)" | **`--hold-intro` 300→500ms 한 곳**(`tokens.css:223`). 결과 2.05s → 2.25s | "빨라"의 실체는 켜진 뒤 사라지는 속도. on(150)은 v3.7에서 사용자가 "느리다"로 내린 값, 상승·퇴장은 "울렁" 지시로 확정된 이동 구간. 비례 배분(+40씩)은 어느 단계도 체감 안 됨 |
| 2 | "Ctrl+S 했을 때 파일 자동 저장(다운로드 방식 없애)" | **내보내기(다운로드) 완전 삭제.** 서버 저장 단일 모드. 서버 없으면 `#btnSave` **disabled** + `#editorServer` 문구 "서버 없음 · start.bat(Docker) 실행 후 저장", Ctrl+S는 disabled여도 잡아서 같은 안내 토스트 | pm·dev-2 일치. `editor.js` 순감 약 300줄(`:1167-1220, 1284-1491` 통삭제 + 분기 15곳). 위험: `start.ps1`만 있는 PC는 글을 못 쓴다 — 사용자 원문 "없애"에 따르되 §6에 명시 |
| 3 | "태그 리스트 불필요하게 2개(하나 삭제)" | **분류 인덱스 행 `#catRow` 삭제.** `#tags` 접힘 목록·내비 "태그"는 유지 | 실측(1280): `분류 전체 1 · Java 1` 바로 아래 `▾ 태그 1 / 전체 1 · Java 1` — 분류명=태그명이라 같은 알약 줄 둘(designer·dev 동일 관찰). 분류는 사이드바(§3-2)·카드 `.entry-cat`이 이미 담당 → §3-3 "같은 곳 가는 문 둘" 논리를 `#catRow` 자신에 적용. `#tags`를 지우면 `?tags=` 해제 UI가 사라져 상세 태그 링크 정책까지 흔들림(dev 파급 분석) → 기각. pm의 "내비 태그 삭제"는 코드 기준 추정 → 기각 |
| 4 | "코드 블록 IDE 편의성 대폭 증가(엔터 시 IDE처럼 여백·계층)" | **펜스 안 Enter 3규칙** — ① 현재 줄 앞 공백을 새 줄에 복사 ② 커서 앞이 `{` `(` `[`면 +2칸 ③ 커서 뒤가 짝 닫힘이면 닫힘을 원래 들여쓰기의 한 줄 아래로(커서는 가운데 줄) + `}` `)` `]` 단독 입력 시 공백뿐인 줄이면 2칸 내어쓰기. **`:` 뒤 +1은 제외**(Python 전용 언어 규칙, VS Code 범용 아님 — dev-2 확정 지식). **자동 닫기 괄호 제외**(마크다운 `[텍스트](url)`과 충돌, type-over 상태 추적 불가). `replaceRange`(execCommand) 경로 — `setRangeText`는 라운드 6 실측에서 undo 스택을 비움 | dev-2·designer 규칙 일치, `:`와 undo 수단만 dev-2 근거 채택. `onBodyKeydown(1007)` Tab 처리 뒤·Ctrl 검사 앞, 펜스 판정은 `insideFence(907)` 재사용(`maybeFence`와 실행 조건 배타) |
| 5 | "코드 작성 부분과 실제 IDE 부분을 참고해서 더 나은 점 개선" | 4번 + **펜스 밖 목록 이어쓰기**(meeting-03 X1: `- ` `1. ` `> ` 뒤 Enter → 접두사 자동, 빈 항목 Enter → 종료) + **한 줄 선택 Tab이 선택을 2칸으로 치환하는 소결함**(`editor.js:1023`) → 줄 들여쓰기로 + **textarea↔미리보기 코드 크기·행간 일치**(`--lh-code` 토큰, `.editor-area` font-size = `calc(var(--fs-prose)*.92)`) + **미리보기 코드 탭 4칸**(자바·C 계열 관행, `prose.css:540`) | 렌더 쪽 줄번호는 이번엔 안 함(부품 신설·계약 개정 필요, 사용자 요청 없음) |
| 6 | "소개 부분 카테고리 지워" | **`about.html`·`js/about.js` 삭제**, 내비 3항목(글·태그·쓰기). 440px 소거 표 폐기(360 검산 264px ≤ 360) | 전원 일치. `ui.js` 판정은 href==pathname 일반식이라 코드 변경 불요 |

## 그 밖에 확인된 것

- **저장 후 사이드바가 새로고침 전까지 갱신 안 됨** — `onSaved(1711)`이 `store.loadIndex(true)`만 하고 `drawSide` 재호출 없음, `loadCategories(true)`도 없음. 사용자의 "카테고리 **등**"의 실체(dev-2 ④). 채택.
- **사용자 글의 `created` 드리프트** — `.md` 13:34:03 vs `index.json` 13:34:51. 내보내기를 두 번 눌러 `created=now`가 두 번 찍힌 것(`editor.js:1260` new 모드). 화면은 `.md`가 진실이라 13:34:03으로 표시(정상). **내보내기 폐지로 근본 원인 소멸.** 사용자 글은 손대지 않는다.
- 라운드 6 잔여: `util.toast()`에 `kind==='err'`→`role=alert`를 넣으면 `editor.js:419` 사후 패치 제거 가능 / `RECAP_TEMPLATE_FALLBACK`(`editor.js:47`) 중복 삭제 / 접두 없는 id 수정 시 자동 개명(`editor.js:1091`) 규칙을 계약 §9-1에 명기 / `ui.js:76` 주석 "3160ms" 낡음.
- 푸시 자격 증명이 이 PC에서 사라짐 — `gh auth login` 필요. `HANDOFF.md` `/ship` 항목 아래 한 줄.

## 라운드 8 작업 지시

**순서**: ① web-designer 계약 **v3.9** → ② frontend-dev · frontend-dev-2 · pm 3인 병렬.

### web-designer (`docs/contract.md` v3.9, `css/*`)
1. §3-5 인트로 `--hold-intro` 500, 시간표(850→1000 켜짐 / ~1350 정지 / 1350~1950 퇴장 / 1650~2250 막) — `tokens.css:209-225` 주석, `layout.css:729-734`.
2. §3·§3-3 내비 3항목(글·태그·쓰기), `소개`·`about.html` 전부 삭제(§1-1·§3-4·§12 #54·#63·#77·#82), 440px 소거 표·`layout.css:666-672` 삭제.
3. §4·§4-3 `#catRow` 폐기 — DOM 순서 "찾기→태그→목록", `components.css:325-326` `.entry-cat` 감춤 근거를 `#sideTree [aria-current="true"]`로 재작성. `.index-row`는 `#tags` 안에서 계속 쓰이므로 유지.
4. §6·§6-1 **저장 단일 모드** — `#btnExport` 폐기, `#btnSave` 항상 표시(비서버 `disabled`), `#editorServer` 비서버 문구·경고 색(새 상태 클래스 1개, 토큰 `--c-warn` 있는지 확인), `components.css:1298-1306` 격하 셀렉터 삭제, `.modal-body ol/ul`(`:1030-1040`) 내보내기 안내 전용이면 정리.
5. §6-2 **Enter 규칙 표** — 펜스 안 3규칙 + 닫는 괄호 내어쓰기 + 펜스 밖 목록 이어쓰기 + Shift+Enter 기본, 한 줄 선택 Tab = 줄 들여쓰기. `setRangeText` 문장 → "`replaceRange`(execCommand), 다음 태스크".
6. `--lh-code` 토큰 신설, `.editor-area`(`layout.css:622-635`) 크기 `calc(var(--fs-prose)*.92)`·행간 `--lh-code`, `prose.css:527-541` 코드도 `--lh-code`, `tab-size` 4(둘 다). "textarea는 줄바꿈·미리보기는 가로 스크롤"을 알려진 차이로 §6에.
7. §3 `#themeToggle`에 `title` 없음 명기, §9-1에 "접두 없는 id는 수정 저장 시 접두를 붙여 개명(previousId)".

### frontend-dev (`index.html` `post.html`, `js/{config,util,store,markdown,app,post,theme-init}.js`, `posts/*`)
1. `about.html`·`js/about.js` 삭제, 내비에서 `소개` 제거(`index.html:60` `post.html:71`), 주석 정리(`index.html:88` `theme-init.js:3,49`).
2. `#catRow` 삭제(`index.html:105`), `app.js` `renderCatIndex(255-274)`·클릭(`432`)·dom(`535-536`) 제거. `?cat=` URL 필터 자체는 유지(사이드바가 건다).
3. `util.js:371-374 download`·`:425` 삭제(내보내기 폐지로 호출처 소멸). `store.toMarkdownFile`·`buildIndexJson`은 **frontend-dev-2 확인 후**(서버 저장이 브라우저 조립을 쓰는지) — 쓰면 유지.
4. `util.toast()` `kind==='err'` → `role='alert'`, `RECAP_TEMPLATE_FALLBACK` 제거 요청은 dev-2에게.
5. `prose.css` 변경은 designer — 너는 `markdown.js` 후처리 무변경 확인만.
6. **`posts/java/`는 절대 손대지 않는다.**

### frontend-dev-2 (`write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1`)
1. **내보내기 삭제** — `editor.js:1167-1220, 1284-1491` 통삭제, 분기 15곳(`:65-70, 453, 1503-1529, 1578, 1586, 1636, 1647-1650, 1710-1714, 1814, 2109-2122, 2153, 2197, 2233, 2262-2274`), `write.html:16, 125, 216-227, 231, 263-267`, `start.ps1:22-23, 76-77, 88-89`. 유지: `validate` `ensureUsableCategory` `ensureCreated` `buildMeta` `buildCategoriesJson` `state.indexData`.
2. **비서버 상태** — 계약 §6-1대로 `#btnSave disabled` + `#editorServer` 문구, Ctrl+S 가로채 토스트, `beforeunload` 유지, `detectServer`를 "다시 연결" 버튼으로 재시도 가능하게.
3. **저장 후 갱신** — `onSaved`에서 `store.loadCategories(true)` + `drawSide` 재호출(사이드바에 새 글·새 분류 즉시).
4. **Enter 규칙** — 계약 §6-2 표 그대로. `onBodyKeydown` Tab 뒤·Ctrl 앞, `insideFence` 재사용, `replaceRange` 경로. 목록 이어쓰기 포함. 한 줄 선택 Tab 소결함 수정.
5. `write.html` `소개` 제거(`:82`), `#bodyHint`에 Enter 규칙 한 줄, `RECAP_TEMPLATE_FALLBACK`(`editor.js:47`) 삭제(`CFG.recap.template` 있음), `ui.js:76` 주석, `editor.js:419` alert 패치 제거(util 통합 후).
6. 검증(`/fixture` v2, `_tmp-dev2`, 5502 + fetch 스텁): 서버 없음 → 버튼 disabled·Ctrl+S 안내·초안 유지 / 서버 있음 → 저장 후 사이드바 즉시 갱신 / Enter 3규칙 + `}` 내어쓰기 + 목록 이어쓰기 + 펜스 밖 미발동 + Ctrl+Z 한 번에 복원 / 한 줄 선택 Tab.

### pm-integrator (`docs/api.md`, `CLAUDE.md`, `HANDOFF.md`, `.claude/**`)
1. `api.md:3, 161-164` 내보내기 문장 삭제, `CLAUDE.md:86-91` 글 추가 흐름을 서버 단일로(Docker 없는 PC는 글 작성 불가 명시), `frontend-dev-2.md:16,29,39-40`, 스킬 `backup-posts:58` `blog-spec:29-30` `handoff:83`.
2. `HANDOFF.md` `/ship` 아래 "푸시는 `gh auth login` 후에만" 한 줄, `CLAUDE.md:20,75,77` about 제거.
3. 회의 뒤 `/ship`(자격 증명 복구 후).

## 사용자 결정 필요 사항

1. **Docker 없는 PC에서는 글을 못 쓰게 된다** — 내보내기를 완전히 없애면 `start.bat`은 미리보기 전용이 된다. 원문 "없애"대로 진행한다. 되돌리려면 지금 말해달라.
2. 렌더된 코드 블록에 **줄번호**를 넣을지 — IDE 느낌은 나지만 부품·계약 개정이 필요해 이번 라운드엔 안 넣었다.
3. 사용자 글의 `created` 드리프트(위 "그 밖에") — `.md`(13:34:03)가 진실이라 화면은 정상. `index.json`을 `.md`에 맞출지는 사용자 글이라 손대지 않았다.
