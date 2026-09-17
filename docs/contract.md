# 마크업 계약서 v3.4

디자이너(CSS)와 개발자(HTML/JS)가 동시에 작업하기 위한 **단일 진실 공급원**.
여기 없는 클래스를 임의로 만들지 않는다. 필요하면 이 문서를 먼저 갱신한다.

> **v3.4 (2026-09-18) — 사용자 요청 7건: 햄버거 왼쪽 끝 · 제목·검색 가운데 · 부제 삭제 · 내비 2항목 ·
> 테마 전환 1.2초 · 은은한 모션.**
> 바뀐 절만 읽으려면: §1-1(`about.html`) · §1-2(원칙 4) · §2(`--dur-theme` 1200ms · `--ease-fade` ·
> `@property` · `--col-w`) · **§3(헤더 전폭 + 햄버거 absolute, 내비 4항목, `aria-current="page"`)** ·
> **§3-3(내비 — 태그·소개 근거, 440px 소거 표)** · **§3-4(신설 — about.html)** ·
> **§4(머리말 = 제목 + 검색 가운데, `.page-sub` `.list-tools` 폐기)** · §4-1 §4-2 §4-3 · §7 §8 ·
> **§11(테마 크로스페이드 = 토큰 보간 · §11-4 콘텐츠 도착)** · §11-1 §11-3 · **§12-10(개발자 작업 #54-64)** · §13.
> CSS는 web-designer가 이미 v3.4로 교체했다 — 계약서의 마크업대로 그리면 바로 맞는다.
> **HTML이 v3.3 그대로인 동안** 보이는 것: 검색창이 인덱스 옆 20rem 자리 대신 제 폭으로 놓이고,
> 부제가 그대로 보이며, 내비 활성 표시가 사라진다(`.is-active` → `aria-current`). 개발 라운드 안에서만 허용.
>
> **v3.3 (2026-09-17) — 사용자 요청 3건: 연관 글 자동 추천 · 목차 스크롤 스파이 · 읽기 편의.**
> 바뀐 절만 읽으려면: §3-2(트리 안 `.side-toc`) · §5(마크업에 `.post-related`) ·
> **§5-4(목차 — 사이드바에 현재 글의 목차 + 스크롤 스파이, `aria-current="location"`)** ·
> **§5-8(신설 — 연관 글: 구조·점수 규칙·JS)** · §6(`.field-group` `.field-label`) · §7 §8 ·
> §11(transition 1행, 11-1 분담, 11-2 높이, 11-3 440px 분기) · **§12-9(개발자 작업 #48-53)** · §13.
> CSS는 web-designer가 이미 v3.3으로 교체했다 — 계약서의 마크업대로 그리면 바로 맞는다.
>
> 스크롤 스파이는 v3.0이 폐기한 "사이드바형 목차(2열 그리드·sticky·rAF)"의 부활이 **아니다.**
> v3.2에 이미 있는 사이드바(§3-2)에 현재 글의 절 목록을 끼우고 IntersectionObserver 하나로 현재 절을
> 옮긴다. 본문 위 인라인 목차는 그대로다(거기엔 스파이가 없다 — 근거는 §5-4).
>
> **v3.2 (2026-09-16) — 배포 화면을 본 사용자 요청 6건(사이드바·카드 그리드·컨트롤 축소).**
> 바뀐 절만 읽으려면: §2(`--w-page` 부활, `--w-side` `--z-side` `--z-scrim` 신설, `--h-control-xs` 값) ·
> §3(헤더 첫 자식 햄버거) · **§3-2 사이드바(신설 — 마크업·상태 클래스·저장 규칙)** ·
> §4(`.list-page` · `.list-tools` · 카드 그리드 · **`.entry-cat`으로 카드 내용물이 넷**) ·
> §7 §8(부품·상태 목록) · §11(사이드바 transition 3행, 11-1 분담, 11-2 높이, 11-3 분기) · §12-8 · §13.
>
> **v3.0의 두 문장이 뒤집혔다.** "칸 자체를 없앤다"(폭 기준선 하나)와 "사이드바 없음"은
> 사용자 판정 *"전체적으로 구조가 비어보여"* 와 *"왼쪽 위 햄버거 → 분류로 정리된 목록, 고정 가능"* 으로
> 폐기됐다. 근거는 §2와 §3-2에 각각 적었다. **글 상세(post.html)의 720px 읽기 칼럼은 그대로다.**
>
> v3.1 요약: 역할색 셋(§1-2) · 목록 박스(§4-4) · `#` 삭제(§4-3, §5-3) · 테마 크로스페이드(§11).

---

## 0. v3.0이 무엇을 되돌렸는가 (읽고 시작할 것)

> **사용자 판정: "지금 디자인이 너무 AI티 나잖아", "쓸데없는 건 만들지 마",
> "실제 개발자들의 학습 블로그를 보고 다시 개발해".**
> v2.x의 **메모지 카드 보드**는 전면 폐기한다. 이 문서는 그 자리에 들어설
> **텍스트 목록 블로그**의 새 계약이다. v2.3 계약서의 §4(보드)·§8-2(진입 모션)·
> §10-3(카테고리 탭)은 존재하지 않는 화면을 설명하고 있으므로 통째로 대체됐다.

### 0-1. 무엇을 보고 정했나 — 실측 7곳 (2026-09-15)

| # | 사이트 | 성격 | 우리가 가져온 것 |
|---|---|---|---|
| 1 | til.simonwillison.net | TIL 582편, 정적 | **인라인 텍스트 인덱스 + 개수**(§4-3), 상세 하단 created/updated 관행 |
| 2 | jvns.ca | 학습 기록, 전체 아카이브가 홈 | **날짜열 + 제목열 2단 리스트**, 페이지네이션 없음 |
| 3 | danluu.com | 극단적 미니멀 | 헤더·장식 없이 목록이 곧 페이지. 그림자·카드 0 |
| 4 | wayhome25.github.io | 한국 TIL | 카테고리를 화면 위쪽 한 줄로 |
| 5 | overreacted.io | 개인 블로그 | **개성은 색 하나 + 타이포 위계**로만 |
| 6 | velog(@choco_sister) | 한국 최대 플랫폼 | 태그에 **개수 병기**, 구분선 리스트 |
| 7 | **ansohxxn.github.io** | TIL 871편, 정적, 카테고리 수십 개 — **우리와 조건이 가장 가깝다** | **상세 상단 `게시 … · 수정 …` 한 줄 병기**(§5-2), **본문 상단 인라인 목차**(§5-4), 카테고리 개수 병기, 요약문 없는 목록 |

**베끼지 않고 고른 것들** — 갈래가 여럿인 항목은 "우리 조건"으로 갈랐다.
우리 조건은 셋이다. ① 글이 **0편에서 시작해 수백 편**까지 는다.
② **카테고리를 사용자가 계속 추가**한다. ③ 빌드 도구가 없어 **페이지를 늘릴 수 없다**(HTML 3개 고정).

| 갈래가 있던 항목 | 고른 것 | 왜 (우리 조건 기준) |
|---|---|---|
| 사이드바 (없음 4곳 / 좌측 트리 1곳) | ~~**없음**~~ → **v3.2: 있음, 접이식·고정 가능**(§3-2) | v3.0 근거는 "평면 분류엔 트리가 필요 없고 720px 칼럼을 깎는다"였다. 사용자가 뒤집었다 — *"햄버거 누르면 대분류로 정리한 것을 볼 수 있게, 챗 앱처럼 고정 가능"*. 분류 → 글 2단계면 트리가 값을 하고, 기본이 "닫힘"이라 읽기 칼럼은 깎이지 않는다 |
| 요약문 (없음 3곳 / 발췌 2곳 / 손으로 쓴 1줄 1곳) | **목록엔 없음, 상세엔 있음** | 사용자가 고른 행 형태가 `날짜 + 제목`이다. 요약은 `summary` 필드로 살아서 **검색 대상**과 상세 머리말이 된다 |
| 분류 UI (인라인 인덱스 / 알약 / 좌측 트리 / 섹션 나열) | **인라인 인덱스 + 개수, 줄바꿈 허용** | 알약·탭은 10개를 넘으면 가로로 넘쳐 스크롤 뒤로 숨는다(v2.x가 실제로 그랬다). 인라인 텍스트는 **100개여도 6줄**이면 끝난다(사례 1 실측) |
| 상세 메타 (하단 병기 / 상단 한 줄 병기) | **상단 한 줄 병기** | 요구사항 #3은 사용자가 직접 요구한 기능이다. 하단으로 내리면 "표시했지만 안 보이는" 상태가 된다 |
| 목차 (없음 6곳 / 본문 상단 인라인 1곳) | **본문 상단 인라인, h2 3개 이상일 때만** | 사이드바 목차는 2열 그리드·sticky·스크롤 스파이라는 기계를 통째로 끌고 온다. 인라인 박스는 `<nav>` 하나면 끝이고, 짧은 메모에서는 아예 안 나온다 |
| 기본 테마 (라이트 6곳 / 다크 1곳) | **OS 설정 추종 + 사용자 선택 기억** | 어느 한쪽을 고정하는 것보다 낫다. 다크는 유지한다(읽는 데 실제로 도움이 된다) |

### 0-2. 폐기 목록 (코드에서 지워야 하는 것)

개발자 작업 지시는 §12에 파일·줄 단위로 정리돼 있다. 여기서는 "왜"만 적는다.

| 폐기 | 왜 |
|---|---|
| `.hero` 일체 + `.hero-stats`/`.stat*` (통계 3종) | 글 4편 위에 60px 제목과 숫자 대시보드가 얹혀 **글 4개가 두 화면을 먹었다**. 실측 7곳 중 통계 대시보드 0곳. 필요한 숫자 하나(전체 글 수)는 §4-3의 `전체 N`이 이미 들고 있다 |
| `.memo` 일체 (종이 질감·회전·압정·광택·쐐기·6색) | 카드가 사라지면 딸린 부품 전부가 갈 곳이 없다. 실측 7곳 중 카드 목록 **0곳** |
| `.bg-layer` / `.bg-mesh` / `.bg-grain` | 실측 7곳 중 배경 그라디언트/노이즈 **0곳**. 디자인 원칙 "단색 배경 금지"는 이 프로젝트에서 **사용자 판정으로 폐기**됐다(§1-2에 명시) |
| 진입 애니메이션 전부 (`animations.css`) | 위 두 항목이 사라지면 움직일 대상이 없다. 파일 자체를 삭제한다(§11). (v3.4: 사용자 요청으로 **"콘텐츠 도착" 한 종류**만 되살아났다 — 카드 페이드 + 3px, 본문 페이드. §11-4. 파일은 되살리지 않는다) |
| `.board-skeleton` / `.skeleton` / shimmer | 로컬 `index.json` 한 개를 읽는 데 광택이 흐르는 자리표시자 6장은 연출이다. 정직한 한 줄(`.list-loading`)로 대체 |
| 읽기 진행바 `.progress` / `.progress-bar` | 실측 7곳 중 0곳. rAF 스크롤 핸들러 하나를 통째로 없앤다 |
| 읽는 시간 `.post-read` | 실측 7곳 중 0곳. "메모"에 붙는 "5분"은 정보가 아니다 |
| 정렬 셀렉트 `#sortSelect` | 실측 7곳 중 0곳. 학습 기록의 순서는 **시간순 하나**다. 3가지 정렬은 4편짜리 블로그에서 고를 이유가 없고, "수정순"은 목록에 수정일이 없는 새 구조와도 어긋난다 |
| **글·카테고리의 `color` 필드 + 메모지 6색 토큰** | §9-2에 근거 전문 |
| 사이드바형 목차(2열 그리드·sticky·스크롤 스파이) | §5-4에 근거 전문. **목차 자체는 인라인 박스로 남는다.** (v3.3: "현재 절 표시"만 사용자 요청으로 되살아났다 — 2열 그리드·sticky 트랙·rAF 없이 §3-2 사이드바 안의 `.side-toc` + IntersectionObserver 하나로. 이 폐기 행의 "기계"는 여전히 폐기다) |
| 헤더 sticky (`.is-stuck`) + 헤더 밑선 + `.brand-mark` | 실측 7곳 중 sticky 헤더 0곳. 밑선이 그어지는 연출과 회전하는 로고 마크는 "메모지" 어휘의 잔재다 |
| 헤더의 "새 메모" 버튼 | `.site-nav`의 "쓰기"와 **같은 목적지**다. 같은 곳으로 가는 문이 헤더에 둘 있을 이유가 없다 |
| `.site-nav`의 440px 소거 규칙 | 헤더가 3덩이(브랜드·내비·테마)로 줄어 좁은 화면에서도 경쟁하지 않는다. 링크를 숨기는 규칙 자체가 사라지는 편이 낫다. (v3.4: 내비가 4항목이 되어 **"태그" 하나만** 440px 이하에서 뺀다 — §3-3 소거 표. 지름길이라 갈 수 없는 곳이 생기지 않는다) |

---

## 1. 원칙과 소유권

### 1-1. 파일 담당 (소유권)

| 담당 | 소유 파일 |
|---|---|
| web-designer | `docs/contract.md`(이 문서), `css/*` |
| frontend-dev | `index.html` `post.html` **`about.html`(v3.4 신설, §3-4)**, `js/{config,util,store,markdown,app,post,about}.js`, `posts/*` |
| frontend-dev-2 | `write.html`, `js/{editor,ui,admin,theme-init}.js`, `start.bat` `start.ps1` |
| pm-integrator | `docs/meeting-*.md`, `CLAUDE.md` |

소유하지 않은 파일은 **읽기만** 하고 수정하지 않는다.
**이 계약서는 web-designer만 개정할 수 있다.** 개발자는 개정을 요청한다.

### 1-2. 이 블로그의 디자인 원칙 (v3.0에서 재정의)

1. **읽는 데 필요 없는 요소는 화면에 두지 않는다.** 판단이 애매하면
   *"이게 없으면 글을 못 읽거나 못 찾는가?"* 를 묻는다. 아니면 뺀다.
2. **개성은 역할이 정해진 색 셋 + 타이포그래피 위계로 낸다.** (v3.1 — 사용자 판정
   *"전체적으로 색깔이 너무 단색이야"* 로 v3.0의 "색 하나"를 개정.)

   | 토큰 | 역할 | 쓰는 곳 |
   |---|---|---|
   | `--c-accent` (청록) | **누를 수 있는 것 · 선택된 것** | 링크 hover, 활성 내비/인덱스, 포커스, 버튼, 분류 링크 |
   | `--c-meta` (황토) | **시간과 수량** | 목록 날짜, 연도 라벨, 인덱스 개수, 상세의 게시·수정일, 코드 언어 라벨 |
   | `--c-tag` (자주) | **주제(태그)** | 태그 인덱스 항목, 목록 박스의 태그, 상세의 태그 |

   색은 **역할**에 붙지 **글**에 붙지 않는다(§9-2 유지). 같은 역할은 어디서나 같은 색이라
   300행에서도 눈이 좌우로 튀지 않는다 — v2.x의 "글마다 6색"과 다른 점이 그것이다.
   v2.x의 `--c-accent-2`(테라코타)는 되살리지 않는다. 그 이름은 "두 번째 액센트"라는
   뜻뿐이라 어디에 써야 하는지 말해 주지 않았다. 새 토큰은 이름이 곧 사용처다.
3. **그림자를 쓰지 않는다.** 구분이 필요하면 1px 경계선이나 여백으로 해결한다.
   예외는 **화면 위에 떠 있는 것**(모달 패널·토스트·**오버레이 상태의 사이드바**)뿐이고
   토큰도 `--sh-pop` 하나다. 사이드바가 **도킹되면 그림자를 뗀다** — 페이지의 일부이지 떠 있는 것이 아니다(§3-2).
   목록 카드(§4-4)는 **그림자 없이** 1px 경계선 + 한 단계 밝은 면으로만 선다.
4. **모션은 상태 변화에만.** stagger·무한 루프는 없다.
   남은 것은 hover/focus 색 전환, 모달·토스트의 등퇴장, 사이드바 슬라이드, 그리고 v3.4의 둘 —
   **테마 크로스페이드 1.2초**(사용자 요청 "약간의 텀을 둬서 자연스럽게")와 **콘텐츠 도착**
   (카드·본문이 놓일 때 260ms 페이드 + 3px, 사용자 요청 "눈에 안 띄게 부드러운 애니메이션")이다.
   "도착"은 진입 장식이 아니라 "결과가 바뀌었다 / 내용이 왔다"는 상태 변화의 신호로 정의한다(§11-4).
5. **~~단색 배경 금지~~ (폐기)** — 사용자 판정으로 배경은 `--c-bg` 단색이다.
   질감은 배경 레이어가 아니라 **따뜻한 종이색 자체**가 낸다.
6. 본문 타이포는 양보하지 않는다: **17px 이상 / 행간 1.75 / 줄길이 `--w-prose`.**

---

## 2. CSS 토큰 (tokens.css에서 정의)

```
색  : --c-bg --c-bg-2 --c-surface --c-surface-2 --c-border --c-border-soft
      --c-text --c-text-dim --c-text-mute
      --c-accent --c-accent-soft --c-meta --c-tag          (역할색 셋 — §1-2 원칙 2)
      --c-danger --c-warn --c-ok
보조색: --c-on-accent --c-focus --c-scrim --c-shadow-rgb --c-selection
코드: --code-bg --code-border --code-text --hl-*(하이라이팅 17종)
타이포: --ff-sans --ff-mono
      --fs-xs --fs-sm --fs-md --fs-lg --fs-xl --fs-2xl --fs-3xl --fs-prose
      --lh-tight --lh-head --lh-body --ls-tight --ls-wide
간격: --sp-1 ~ --sp-12  (4px 배수)
반경: --r-sm --r-md --r-lg --r-full
그림자: --sh-pop (떠 있는 것 전용 — 모달 패널·토스트)
       --ring-w (3px, 포커스 글로우 두께) --sh-focus (인풋 :focus 글로우)
모션: --ease(cubic-bezier(.16,1,.3,1))  --dur-fast(160ms) --dur(260ms) --dur-slow(420ms)
      --ease-fade(cubic-bezier(.65,0,.35,1)) --dur-theme(1200ms)   ← 테마 크로스페이드 전용(§11, v3.4 값)
치수: --h-control --h-control-sm --h-control-xs --h-nav --w-modal --w-toast
레이아웃: --w-prose(45rem) --w-page(72rem, v3.2 부활) --w-side(260px, v3.2) --gutter
z-index: --z-scrim(40) --z-side(50) --z-modal(60) --z-toast(80)
```

**v3.4 — 색 토큰은 `@property`로 등록된다.** `tokens.css` 끝에서 `--c-*`(20) · `--code-*`(3) · `--hl-*`(17)을
`syntax: "<color>"`로 등록한다. 목적은 하나 — 테마 토글 때 **토큰 값 자체가 보간**되게 하는 것(§11).
새 색 토큰을 만들면 그 블록에도 한 줄 추가한다(빠지면 그 색만 즉시 튄다). `--c-shadow-rgb`(숫자 셋)와
`--sh-*`(합성값)는 `<color>`가 아니라 등록하지 않는다.

**v3.4 — `--col-w` (layout.css가 `body`에 두는 파생 변수, 토큰 아님).** 페이지의 칼럼 폭 —
기본 `--w-prose`, `body:has(> .list-page)`면 `--w-page`, `body:has(> .editor-page)`면 76rem.
`.site-main` `.site-footer`의 `max-inline-size`와 `.site-header`의 좌우 패딩이 이 값을 읽는다.
값의 출처는 여전히 `tokens.css`의 폭 토큰이다 — 이 변수는 "이 페이지에서는 어느 토큰인가"를 고르는 자리다.

**삭제된 토큰** — 다른 CSS에 남아 있으면 결함이다.
`--c-accent-2` / `--memo-*`(12) / `--memo-*-ink`(12) / `--memo-grain` / `--memo-min` /
`--mesh-*` / `--grain-alpha` / `--sh-sm` `--sh-md` `--sh-lg` `--sh-memo` `--sh-memo-hover` `--sh-ring` /
`--ease-in` `--ease-out` `--ease-ambient` / `--dur-ambient` `--dur-loop` /
`--fs-4xl` / `--w-content` `--w-toc` `--h-header` / `--r-xl` /
`--z-bg` `--z-base` `--z-sticky` `--z-progress` /
**`--w-date`(v3.1 폐기 — 목록이 2열 그리드에서 박스로 바뀌어 날짜 열이 없다, §4-4)**
(`--w-page`는 v3.0에서 삭제됐다가 **v3.2에서 부활** — 아래)

**v3.2 신설·변경**

| 토큰 | 값 | 왜 필요한가 |
|---|---|---|
| `--w-page` | `72rem`(1152px) | **목록 페이지(`.list-page`)만** 쓴다. 1152 = 카드 최소폭 17rem × 3 + 간격 2 + 거터. 글 상세는 여전히 `--w-prose` |
| `--w-side` | `260px` | 사이드바 폭. 한글 제목 14px 기준 14~15자 + 들여쓰기 + 접기 버튼. 1024 − 260 = 764 → 카드 2열이 선다. 300이면 1024px에서 2열이 깨진다 |
| `--z-side` | `50` | 스크림 위·모달 아래. 에디터의 확인 모달 위를 사이드바가 덮으면 "확인"을 못 누른다 |
| `--z-scrim` | `40` | 사이드바 스크림. 본문 위·사이드바 아래 |
| `--h-control-xs` | 30/40 → **24/36** | `.search-clear` 하나가 쓴다. 인풋이 40 → 32px(`--h-control-sm`)로 줄어 안에 앉는 원판도 따라 내린다. 24 = WCAG 2.2 최소 타깃(2.5.8) 하한 |
| (신설 안 함) `--h-input` | — | 사양서가 열어 둔 선택지. **`--h-control-sm` 재사용**으로 결정 — 검색 인풋의 역할은 "본문 흐름에 끼는 작은 컨트롤"이고 그 역할의 토큰이 이미 있다. 이름이 둘이면 다음 사람이 어느 걸 쓸지 고민한다 |

**v3.0 신설**

| 토큰 | 값 | 왜 필요한가 |
|---|---|---|
| `--sh-pop` | 1단 소프트 섀도 | 원칙 3의 유일한 예외. "떠 있는 것"만 쓴다 |

**v3.1 신설 4개**

| 토큰 | 라이트 / 다크 | 왜 필요한가 |
|---|---|---|
| `--c-meta` | `#8f5a0d` / `#e0ad4f` | 시간·수량(날짜·연도·개수·코드 언어). 라이트는 `--c-bg` 5.3:1, 박스 면 `--c-surface` 5.7:1, 코드 머리띠 4.8:1 — 전부 AA. 다크 8.9:1 |
| `--c-tag` | `#7f3f8f` / `#cfa0e0` | 태그(주제). 라이트 6.4:1, 다크 8.4:1. 청록(액센트)·황토와 색상환에서 서로 떨어져 있어 셋이 한 줄에 놓여도 구분된다 |
| `--dur-theme` | ~~`240ms`~~ → **`1200ms`(v3.4)** | 테마 전환 크로스페이드. v3.1의 240ms는 사용자 판정 *"전등 깜빡임"*. 요청 범위 1~2초의 아래쪽인 이유 — 두 테마는 글자·바탕이 서로 뒤집히므로 진행 50%에서 글자색과 바탕색이 둘 다 중간 회색이 되어 **대비가 1:1 근처까지 떨어지는 구간**이 반드시 생긴다. 크로스페이드의 본성이라 없앨 수 없고 짧게만 할 수 있다. 2초면 그 구간이 ≈300ms로 눈에 띄고, 1.2초면 ≈150ms로 "잠깐 흐려짐"에 그친다. 그러면서도 "깜빡"이 아니라 "서서히"로 읽히는 최소 길이 |
| `--ease-fade` | ~~`(.4,0,.2,1)`~~ → **`cubic-bezier(.65,0,.35,1)`(v3.4)** | 대칭 곡선이되 가운데가 더 가파르다. 시작·끝은 느려 "텀"이 느껴지고, 대비가 낮은 한가운데는 빨리 지나간다. `--ease`(expo-out)를 쓰지 않는 이유는 그대로 — 변화의 절반이 첫 8%에 끝나 사실상 즉시 전환이다. 스크림의 opacity도 이 커브를 쓴다(대칭이면 된다) |

**폭 기준선 — v3.0의 "칸 자체를 없앤다"는 v3.2에서 절반 철회됐다.**
v3.0은 "1200px 상자 안의 720px 본문은 채워야 할 빈칸으로 보인다"며 `--w-page`를 지우고
`--w-prose` 하나로 통일했다. 사용자가 배포 화면(1440px)을 보고 *"전체적으로 구조가 비어보여"* 라고
판정했다 — 720px 한 줄만 쓰면 좌우 360px씩이 빈다. 그 판정이 맞다.
단, 되살리는 곳은 **목록 페이지뿐**이다. `<main class="site-main list-page">`가 `--w-page`를
쓰고, **같은 페이지의 헤더·푸터도 `:has(> .list-page)`로 따라간다**(왼쪽 선이 둘이 되면 안 된다).
글 상세는 읽기 줄길이가 곧 기능이라 720px 그대로다. `.editor-page`(76rem)도 같은 방식으로
헤더·푸터를 맞춘다(v3.1까지 write.html은 헤더만 720px이었다 — 결함이었다).

다크모드는 `:root[data-theme="dark"]`에서 토큰 값만 재정의한다.
초기 테마는 `<html data-theme="light|dark">`로 JS가 세팅한다(FOUC 방지 인라인 스크립트).

---

## 3. 공통 셸 (네 페이지 모두 동일 — v3.4부터 about.html 포함)

```html
<a class="sr-only" href="#main">본문 바로가기</a>

<header class="site-header">
  <!-- 첫 자식 햄버거(v3.2). v3.4: CSS가 흐름에서 빼 화면 왼쪽 끝에 앉힌다 — 마크업은 그대로 첫 자식 -->
  <button class="icon-btn side-toggle" id="sideToggle" type="button"
          aria-label="분류 메뉴 열기" aria-expanded="false" aria-controls="side"></button>
  <a class="brand" href="index.html"><span data-site-title>메모 블로그</span></a>
  <!-- v3.4: 4항목. 현재 페이지에만 aria-current="page"(정적으로 적는다 — 아래 예는 index.html) -->
  <nav class="site-nav" aria-label="주요 메뉴">
    <a class="nav-link" href="index.html" aria-current="page">글</a>
    <a class="nav-link" href="index.html#tags">태그</a>
    <a class="nav-link" href="about.html">소개</a>
    <a class="nav-link" href="write.html" data-admin-only>쓰기</a>
  </nav>
  <button class="icon-btn" id="themeToggle" type="button"
          aria-label="테마 전환" aria-pressed="false"></button>
</header>

<!-- v3.2: 사이드바 + 스크림. <header> 뒤·<main> 앞. 네 페이지 동일(§3-2) -->
<aside class="side" id="side" aria-label="분류별 글 목록">…</aside>
<div class="side-scrim" id="sideScrim" hidden></div>

<main class="site-main" id="main" tabindex="-1">…</main>

<footer class="site-footer">
  <p class="footer-note">&copy; 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다</p>
  <p class="footer-meta"><span data-site-title>메모 블로그</span> · <span data-year>2026</span></p>
</footer>

<div class="toast-area" id="toastArea" aria-live="polite"></div>
```

**v2.3에서 바뀐 것**

| 항목 | v2.3 | v3.0 |
|---|---|---|
| `<div class="bg-layer">` 3층 | 있음 | **삭제** |
| `id="siteHeader"` | 있음(JS가 `.is-stuck` 토글) | **삭제.** 헤더는 static이다 |
| `.brand-mark` | CSS로 그린 접힌 메모지 | **삭제.** `.brand`는 텍스트만 |
| `.header-actions` + "새 메모" `.btn-primary` | 있음 | **삭제.** 테마 버튼만 `.site-header`의 직계 자식으로 남는다 |
| 내비 라벨 | "메모" | **"글"** — 메모지 메타포가 사라졌다 |
| `<div class="progress">` (post.html) | 있음 | **삭제** |
| `<link href="css/animations.css">` | 있음 | **삭제** (§11) |

- `data-admin-only` : 관리자 모드가 꺼져 있으면 JS가 DOM에서 제거한다.
  CSS의 `.admin-off [data-admin-only]{display:none}` 안전장치는 유지한다.
- **`.site-header`는 static이다.** sticky·backdrop-filter·`.is-stuck`·밑선 전부 없다.
  헤더가 따라다녀야 할 만큼 이 사이트의 내비게이션은 크지 않고,
  실측 7곳 중 sticky 헤더는 0곳이다. 스크롤 핸들러 하나가 함께 사라진다.
- 헤더·본문·푸터는 **같은 칼럼**에 정렬된다 — post.html·about.html은 `--w-prose`, index.html은 `--w-page`(§2),
  write.html은 76rem. 브랜드의 왼쪽 선 = 제목의 왼쪽 선 = 카드의 왼쪽 선.
  **v3.4: 헤더 상자는 화면 폭 전체다.** `.site-main` `.site-footer`처럼 `max-inline-size`로 칼럼에 갇히지
  않고, 좌우 패딩 `(100% − --col-w) / 2 + --gutter`로 브랜드·내비·테마 버튼을 칼럼 자리에 앉힌다.
  기하는 v3.3과 같다 — 다른 점은 햄버거가 그 패딩 바깥에 놓일 수 있다는 것뿐. (`100%`는 body 내용폭이라
  사이드바 도킹·스크롤바에 영향받지 않는다. 마크업 변화 없음.)
- **햄버거(`.side-toggle`)와 테마 버튼은 둘 다 `.icon-btn`이다.** 오른쪽 끝으로 미는 auto 마진은
  `.site-header > .icon-btn:last-child`(테마)에만 걸린다. 햄버거 아이콘(세 줄)은 CSS `::before`가
  그린다 — 테마 버튼과 같은 방식이라 HTML에 SVG를 복사하지 않는다.
  `aria-expanded="true"`이면 액센트색("켜져 있는 것"의 색).
- **햄버거의 자리(v3.4) — 사용자 요청 *"햄버거 메뉴를 상단 맨 끝 왼쪽에 옮기고 크기 3~5px만 더 키워"*.**
  v3.2의 햄버거는 첫 자식이었지만 칼럼 안에 있어 1440px에서 왼쪽 끝에서 144(목록)~380px(상세) 들어온
  자리였다. v3.4는 `position: absolute`로 헤더 상자의 **왼쪽 끝**(`--gutter − 8px`, 위는 헤더 위 패딩)에
  둔다. DOM은 그대로 첫 자식이라 Tab 순서(햄버거 → 브랜드 → 내비 → 테마 → 사이드바)는 변하지 않는다.
  칼럼이 화면을 다 채우는 폭(폰·태블릿·도킹된 1024px)에서는 헤더 왼쪽 패딩이 `--gutter + --h-control + 4px`
  까지만 늘어나 햄버거가 브랜드에 겹치지 않는다 — 그 상태가 곧 v3.3의 배치다. 페이지별 미디어쿼리 없음.
  도킹되면 body가 `--w-side`만큼 밀리고 헤더도 따라가므로 햄버거는 사이드바 오른쪽 옆에 붙는다(숨지 않는다).
  아이콘은 줄 폭 16 → **20px**, 줄 간격 5 → **6px**(세로 12 → 14px). 버튼(`--h-control` 40/44)은 그대로 —
  터치 타깃은 변하지 않는다.

### 3-1. 스킵 링크

| 규칙 | 이유 |
|---|---|
| **`body`의 첫 자식** | 첫 Tab에서 나와야 "건너뛰기"다 |
| **대상은 세 페이지 모두 `#main`** | 렌더 전 빈 컨테이너로 뛰어내리지 않게 |
| **`<main>`에 `tabindex="-1"` 필수** | 없으면 스크롤만 되고 포커스는 헤더에 남는다 |
| 전용 클래스 없이 `.sr-only` | `:focus`와 `:focus-visible` **둘 다**에서 드러나도록 CSS가 잡혀 있다 |

착지점의 포커스 링은 `base.css`가 끈다(`main[tabindex="-1"]`).

### 3-2. 사이드바 `.side` (v3.2 신설)

> **사용자 요청(원문): "왼쪽 사이드 위에 햄버거 메뉴 넣고 누르면 대분류(카테고리)로 정리한것을
> 볼 수 있게 표시 (클로드 챗이나 지피티 챗처럼 고정 가능, 카테고리 분류 가능)".**
> v3.0 §0-1의 "사이드바 없음"은 이 요청으로 폐기됐다. 기본은 **닫힘**이라 읽기 칼럼은 깎이지 않고,
> 사용자가 고정하면 그때만 본문이 밀린다.

**마크업 — 세 페이지 동일, `<header>` 바로 뒤·`<main>` 앞.** Tab 순서가 햄버거 → 사이드바 → 본문이
되어 열자마자 다음 Tab이 사이드바 안으로 들어간다.

```html
<aside class="side" id="side" aria-label="분류별 글 목록">
  <div class="side-head">
    <span class="side-title">분류</span>
    <button class="icon-btn side-pin" id="sidePin" type="button"
            aria-label="사이드바 고정" aria-pressed="false"></button>
    <button class="icon-btn side-close" id="sideClose" type="button" aria-label="닫기"></button>
  </div>
  <nav class="side-tree" id="sideTree"></nav>   <!-- ui.js renderSide()가 채운다 -->
</aside>
<div class="side-scrim" id="sideScrim" hidden></div>
```

`#sideTree` 안에 JS가 그리는 구조:

```html
<ul class="side-cats">
  <li class="side-cat is-open">                          <!-- 접히면 is-open 제거 / 글 0편이면 is-empty -->
    <div class="side-cat-row">
      <a class="side-cat-name" href="index.html?cat=javascript">JavaScript</a>
      <span class="side-cat-count">2</span>
      <button class="side-cat-toggle" type="button" aria-expanded="true"
              aria-label="JavaScript 접기" aria-controls="sideCat-javascript"></button>
    </div>
    <ul class="side-posts" id="sideCat-javascript">
      <li>
        <a class="side-post is-pinned" href="post.html?id=…" aria-current="page">클로저와 렉시컬 스코프</a>
        <!-- v3.3: post.html에서만, 현재 글 바로 아래. ui.js가 아니라 post.js가 끼운다(§5-4) -->
        <ol class="side-toc" id="sideToc" aria-label="이 글의 목차">
          <li><a class="side-toc-item is-h2" href="#lexical-scope" aria-current="location">렉시컬 스코프란</a></li>
          <li><a class="side-toc-item is-h3" href="#execution-context">실행 컨텍스트와 환경 레코드</a></li>
        </ol>
      </li>
    </ul>
  </li>
</ul>
```

| 규칙 | 내용 |
|---|---|
| 분류 순서 | `store.categoryList(posts)` — `categories.json` `order` → 글 수 내림차순 → 이름(app.js `byIndexOrder`와 같은 규칙). **글 0편인 분류도 그린다**(`.side-cat.is-empty`, `.side-posts` 없음 — CSS가 접기 버튼도 숨긴다) |
| 글 순서 | 고정 글 먼저(`.side-post.is-pinned`), 그 다음 `created` 내림차순 |
| `aria-current` | post.html: 현재 글의 `.side-post`에 `"page"`. index.html: `?cat=`이 걸린 `.side-cat-name`에 `"true"` |
| 미분류 | `_uncategorized`는 글이 있을 때만 맨 아래 |
| 아이콘 | 핀·닫기·쉐브론 전부 CSS가 그린다. 핀은 **기울어짐 = 고정 안 됨 / 바로 섬 = 고정됨**(`aria-pressed`) — 색만으로 상태를 말하지 않는다 |
| 색 어휘 | 인덱스와 같다 — 이름 본문색, 개수 `--c-meta`, 선택·현재 `--c-accent`. 사이드바에서만 다른 색을 쓰면 같은 분류가 두 화면에서 다른 것으로 보인다 |
| 글 제목 | 두 줄까지 허용 후 말줄임. 한 줄 말줄임은 "…스코프"만 남겨 어떤 글인지 못 알아본다 |
| **현재 글의 목차** (v3.3) | post.html에서 `.side-post[aria-current="page"]`의 **형제**로 `ol.side-toc`. `renderSide()`는 모른다 — `post.js`가 트리가 그려진 뒤 끼운다(§5-4). `renderSide()`를 다시 부르면 사라지므로 **한 페이지에서 두 번 부르지 않는다** |
| 빈 상태 | 데이터 실패·글 0편이면 `#sideTree`에 `<p class="side-empty">글이 없습니다</p>` 한 줄 |

**상태 — 전부 `<body>` 클래스, `ui.js`가 붙인다.**

| 상태 | 화면 |
|---|---|
| (없음) | 닫힘. 왼쪽 밖 + `visibility: hidden` — Tab 순서·스크린리더에서도 빠진다 |
| `body.side-open` | **오버레이.** 본문 위로 슬라이드, `--sh-pop` 그림자, 스크림(`--c-scrim` 45%), 뒤 페이지 스크롤 잠금. Esc·스크림 클릭·링크 클릭·바깥 포커스 이동 시 닫힘 |
| `body.side-open.side-pinned` | **≥1024px에서 도킹.** 페이지(헤더·메인·푸터)가 `padding-inline-start: var(--w-side)`로 밀리고, 그림자·스크림·스크롤 잠금이 풀린다. 경계선 하나로 본문과 나뉜다. 페이지를 옮겨도 열린 채 유지. **<1024px에서는 pinned여도 오버레이**(값은 보존만) |
| `html[data-side="pinned"]` | 첫 페인트용 힌트. `theme-init.js`가 `blogSide`를 읽어 `pinned && ≥1024`이면 붙인다. CSS는 이것을 `body.side-open.side-pinned`와 **동일하게** 취급한다. **`ui.js` `initSide()`가 body 클래스를 붙인 직후 이 속성을 제거한다** — 남겨 두면 핀을 풀어도 CSS가 계속 도킹한다 |

- 저장: localStorage `blogSide`(config.js `storageKeys.side`), 값은 `{"pinned":true,"closed":["css"]}`.
  `closed`는 접어 둔 분류 slug. 파싱 실패 시 기본값(`pinned:false, closed:[]`).
- 햄버거 = 열기/닫기 토글(`aria-expanded` 동기화). 핀 = `aria-pressed` 토글 + 저장;
  **고정 해제해도 닫히지 않는다**(오버레이로 남는다). 접기 버튼 = `.side-cat.is-open` 토글 + `aria-expanded` + 저장.
- 포커스: 열릴 때 `.side-head`의 첫 버튼(또는 `#sideTree` 첫 링크)로, 닫힐 때 `#sideToggle`로 복귀.
- **스크림의 `hidden`은 JS 실행 전 안전장치다.** `initSide()`가 한 번 떼어 내면 그 뒤 표시 여부는
  CSS가 body 클래스와 뷰포트 폭으로 정한다(1100px 도킹 상태에서 900px로 줄이면 JS 없이 스크림이 켜진다).
  JS가 계속 토글해도 조건이 같아 어긋나지 않지만, 리사이즈 대응은 CSS가 더 정확하다.
- 슬라이드 `--dur`(260ms) + `--ease`. `prefers-reduced-motion`이면 즉시(base.css의 `*` 블록이 자른다 — 별도 규칙 없음).
- API: `Blog.ui.renderSide({ posts, cats, activeId, activeCat })` / `Blog.ui.initSide()` — frontend-dev-2 구현,
  호출은 app.js(index) · post.js(글 로드 후) · editor.js(index 로드 후, try/catch).

### 3-3. `.site-nav` (v3.4 — 4항목)

> **사용자 요청(원문): "메뉴 2개 더 추가 (메모 블로그, 글 옆에) — 실제 학습 블로그 구조 참고".**

**실측 7곳의 상단 메뉴** — jvns.ca `FAVORITES · TIL · ZINES · ABOUT · TALKS · PROJECTS` /
ansohxxn `Home · Category` / velog 개인 `글 · 시리즈 · 소개` / wayhome25 검색·메뉴 아이콘만 /
til.simonwillison `My blog` 하나 / overreacted `by [아바타]` / danluu 없음.
"글" 옆에 오는 것은 **분류(Category) · 태그 · 소개(About)** 셋 중 둘이다. 판단 기준은 두 가지 —
원칙 1(*"이게 없으면 글을 못 찾는가?"*)과 "빌드 도구가 없어 새 HTML은 비용이다".

| 후보 | 목적지 | 결정 | 왜 |
|---|---|---|---|
| 분류 | `index.html#cat`(인덱스 앵커) | **안 넣는다** | 바로 왼쪽의 **햄버거가 이미 분류다** — 사이드바(§3-2)의 정체가 "분류별 글 목록"이고 네 페이지 어디서나 열린다. 헤더에 같은 곳으로 가는 문이 둘 있는 것은 v3.0이 "새 메모" 버튼을 지운 이유 그대로다(§0-2). 실측에서 가장 흔한 항목이지만 그 사이트들엔 사이드바가 없다 |
| **태그** | `index.html#tags` | **넣는다** | 태그로 가는 길이 지금은 index.html의 접힌 손잡이(§4-3)와 post.html의 태그 링크뿐이다. 접힌 손잡이는 "있는 줄 알아야" 여는 것이라, 상세를 읽던 사람이 "이 주제 다른 글"을 찾는 경로가 헤더에 없었다. 새 HTML 없이 앵커 + JS 한 줄(`open`)로 끝난다 |
| **소개** | `about.html` | **넣는다** | 실측 7곳 중 "누가 왜 쓰는가"를 말하는 자리가 없는 곳은 danluu 하나뿐이다. v3.4가 부제 *"공부한 것을 기록하는 곳"* 을 지웠으므로(§4-2) 사이트가 자기를 설명하는 문장이 어디에도 없어졌다 — 그 문장이 살 곳이 소개 페이지다. HTML 하나가 늘지만 **빈 골격**이고 내용은 사용자가 쓴다(§3-4) |

- 항목은 네 페이지가 동일하다: **`글` `태그` `소개` `쓰기`**(`쓰기`는 `data-admin-only`).
- **현재 페이지 표시는 `aria-current="page"`다.** `.nav-link.is-active`는 폐기 — 사이드바와 같은 규칙
  "ARIA 속성이 곧 상태"(§8). 정적 HTML에 적는다: index.html → `글`, about.html → `소개`, write.html → `쓰기`,
  **post.html → 없음**(글 한 편은 목록이 아니다 — 돌아가는 길은 `← 목록`이 맡는다). `태그`는 `index.html`을
  가리키지만 문서가 아니라 문서 안의 위치라 어느 페이지에서도 `page`를 받지 않는다.
  `ui.js` `initShell()`은 정적 값과 같은 판정을 하므로 유지되, `is-active` 클래스 토글 줄은 지운다(§12-10).
- **`태그`의 동작** — `href="index.html#tags"`. 앵커 대상은 태그 인덱스의 `<details id="tags">`(§4, v3.4에
  `#tagFold`에서 개명). `app.js`가 로드 시와 `hashchange`에서 `location.hash === '#tags'`이면 `<details>`에
  `open`을 붙인다(`?tags=` 필터가 있을 때 여는 규칙과 같은 자리). 스크롤은 브라우저 앵커 이동에 맡긴다 —
  대상이 첫 화면 안(제목·검색·인덱스 아래)이라 JS가 `hidden`을 떼기 전에 앵커 이동이 일어나도
  잃는 것이 없다. 태그가 0개면(`hidden`) 열 것이 없다 — 그대로 둔다.
- `.nav-link`는 알약 배경 없이 **글자만**이다(hover·활성에서 색과 굵기로만 구분).
  알약 = 누를 수 있는 덩어리는 §4-3의 인덱스와 어휘가 겹친다. 헤더에는 링크만 둔다.

**440px 소거 표 (v3.4 — v3.0의 "소거 규칙 없음"을 한 항목만 되돌린다)**

360px 검산 — 햄버거 자리 68 + 브랜드 82 + 간격 12 + 링크 4개(26×4 + 간격 16×3 = 152) + 12 + 테마 44 + 거터 20
= **390 > 360.** 내비 간격을 `--sp-4` → `--sp-2`로 줄여도 366이다.

| 440px 이하 | 처리 | 대체 경로 |
|---|---|---|
| `.nav-link[href$="#tags"]` (태그) | `display: none` | index.html의 태그 손잡이(`#tags`) · post.html의 태그 링크 · `index.html?tags=` |
| `.site-nav` 간격 | `--sp-4` → `--sp-2` | — |

검산: 방문자 68 + 82 + 12 + (26×2 + 8) + 12 + 44 + 20 = 298 / 관리자(쓰기 포함) 340 ≤ 360.
"태그"를 고른 이유 — 넷 중 유일한 **지름길**이다(같은 정보로 가는 다른 길이 둘 있다). `글`은 홈, `소개`는
그 페이지로 가는 유일한 링크, `쓰기`는 관리자 도구다. 숨겨도 갈 수 없는 곳이 생기지 않는 항목만 숨긴다.

### 3-4. about.html — 소개 (v3.4 신설, frontend-dev)

**빈 골격이다. 내용은 사용자가 직접 쓴다.** 셸(§3)은 다른 페이지와 바이트 단위로 같고, `<main>`은
post.html의 부품을 그대로 쓴다 — 새 클래스 0개.

```html
<main class="site-main" id="main" tabindex="-1">
  <article class="post">                       <!-- .is-loading 없음 — 정적 내용이라 로딩 상태가 없다 -->
    <header class="post-head">
      <h1 class="post-title">소개</h1>
    </header>
    <div class="prose">
      <p>여기에 소개를 씁니다.</p>             <!-- 사용자가 채운다. 마크다운이 아니라 HTML 그대로 -->
    </div>
  </article>
</main>
```

| 규칙 | 내용 |
|---|---|
| 폭 | `--w-prose`(720px) — 읽는 화면이다. `<main>`에 `.list-page`/`.editor-page`를 붙이지 않는다 |
| 내용 형식 | **정적 HTML**(`.prose` 안 태그 셀렉터로 스타일링, §5-7). 마크다운 로더를 두지 않는 이유 — marked·DOMPurify·`markdown.js`를 한 페이지 더 싣고 JS 실패 시 빈 화면이 된다(§8-2). 소개는 한 번 쓰고 가끔 고치는 글이라 HTML로 충분하다 |
| `.post-summary` `.post-dates` `.post-meta` | 넣지 않는다 — 소개에는 게시일·분류·태그가 없다 |
| `.back-link` `.post-foot` `.post-related` `.post-nav` | 넣지 않는다 — 글이 아니다 |
| 스크립트 | `theme-init.js`(head, 동기) + `config` `util` `store` `ui` `admin` + **`js/about.js`**(frontend-dev 신설, 아래). CDN 셋·`markdown.js`는 싣지 않는다 |
| `<title>` / `description` | `소개 · 메모 블로그` / 사용자가 쓴다 |
| CSP | index.html과 같은 문자열 |

**`js/about.js`가 할 일(한 함수)** — `Blog.ui.initShell()` → `Blog.admin.init()` →
`store.loadIndex()`·`store.loadCategories()`를 받아 `Blog.ui.renderSide({ posts, cats, activeId: null, activeCat: null })`
(사이드바가 빈 채로 남지 않게 — 실패하면 빈 데이터로 부른다, `app.js` `showLoadError()`와 같다) →
`[data-site-title]`에 `site.title`. 그 밖의 일은 없다(`post.js`의 `renderSide()` 래퍼와 같은 방어 — `Blog.ui.renderSide`가 없으면 건너뛴다).

---

## 4. index.html — 글 목록

```html
<!-- v3.2: .list-page — 이 <main>만 --w-page(72rem)로 넓어진다. 헤더·푸터는 CSS :has()가 따라간다(§2) -->
<main class="site-main list-page" id="main" tabindex="-1">

  <!-- v3.4 머리말: 제목 + 검색, 가운데 정렬. .page-sub는 폐기, .list-tools는 폐기(§4-2) -->
  <div class="page-head">
    <h1 class="page-title" data-site-title>메모 블로그</h1>
    <!-- 검색: 제목 아래 --sp-5, 폭 min(40rem, 100%), 가운데. sticky 아님. 높이 --h-control-sm(32px) -->
    <div class="search">
      <label class="sr-only" for="searchInput">글 검색</label>
      <input class="search-input" id="searchInput" type="search"
             placeholder="제목 · 요약 · 태그 검색  ( / )"
             autocomplete="off" enterkeyhint="search">
      <button class="search-clear" type="button" aria-label="검색어 지우기" hidden></button>
    </div>
  </div>

  <!-- 분류 인덱스 — <main> 직계. 항상 펼쳐져 있다. 분류가 하나도 없으면 hidden(§4-3) -->
  <div class="index-row" id="catRow" hidden>
    <span class="index-label" id="catIndexLabel">분류</span>
    <nav class="index-list" id="catIndex" aria-labelledby="catIndexLabel">
      <button class="index-item is-active" type="button" data-cat="*" aria-current="true">
        <span class="index-name">전체</span><span class="index-count">4</span>
      </button>
      <button class="index-item" type="button" data-cat="css">
        <span class="index-name">CSS</span><span class="index-count">1</span>
      </button>
      <button class="index-item is-empty" type="button" data-cat="db">
        <span class="index-name">DB</span><span class="index-count">0</span>
      </button>
    </nav>
  </div>

  <!-- 태그 인덱스 — 접혀 있다(§4-3). v3.4: id는 "tags" — 헤더의 "태그" 링크(index.html#tags)가 여기로 온다(§3-3) -->
  <details class="index-fold" id="tags" hidden>
    <summary class="index-fold-summary">태그 <span class="index-count">12</span></summary>
    <div class="index-row">
      <nav class="index-list" id="tagIndex" aria-label="태그 필터">
        <button class="index-item is-active" type="button" data-tag="*" aria-pressed="true">
          <span class="index-name">전체</span><span class="index-count">4</span>
        </button>
        <button class="index-item" type="button" data-tag="css" aria-pressed="false">
          <span class="index-name">css</span><span class="index-count">1</span>
        </button>
      </nav>
    </div>
  </details>

  <!-- 목록 — v3.2: 카드 그리드(2~3열). 카드 = 분류 라벨 → 제목 → 날짜·태그(§4-4) -->
  <div class="post-list" id="postList" aria-live="polite">
    <section class="entry-group">
      <h2 class="entry-group-label">2026</h2>   <!-- 그리드 위 full-width. 한 해뿐이면 없음 -->
      <ul class="entry-list">
        <li class="entry is-pinned">
          <span class="entry-cat">CSS</span>
          <a class="entry-title" href="post.html?id=2026-09-13-css-grid">CSS Grid 정리</a>
          <div class="entry-meta">
            <time class="entry-date" datetime="2026-09-13">2026.09.13</time>
            <ul class="entry-tags" aria-label="태그">
              <li class="entry-tag">css</li>
              <li class="entry-tag">layout</li>
            </ul>
          </div>
        </li>
      </ul>
    </section>
  </div>

  <p class="list-loading" id="listLoading">불러오는 중…</p>
  <div class="list-empty" id="listEmpty" hidden>
    <p><strong>아직 글이 없습니다.</strong></p>
    <p>…</p>
  </div>

</main>
```

**DOM 순서 = 시선 순서 = Tab 순서.** 어긋나면 결함이다.
v3.4: `정체(제목) → 찾기(검색) → 축으로 좁히기(분류) → 태그 → 목록`.
(v3.2의 "분류 → 검색"은 툴 행의 좌우 배치를 따른 것이었다. 검색이 제목 바로 아래 가운데로 올라가면서
화면 순서가 바뀌었고, DOM도 그대로 따라간다 — 위에서 아래로 한 줄씩이라 어느 폭에서도 같은 순서다.)
`order`나 `flex-direction: row-reverse`로 시각 순서만 바꾸는 것은 금지다. 768px 분기는 사라졌다(§11-3).

### 4-1. 이름 대응표 (v2.3 → v3.0)

찾아 바꾸기용이다. **왼쪽 이름이 코드에 남아 있으면 결함이다.**

| v2.3 | v3.0 | 비고 |
|---|---|---|
| `.hero` / `.hero-title` / `.hero-sub` | `.page-head` / `.page-title` / ~~`.page-sub`~~ | 크기가 `--fs-4xl` → `--fs-2xl`로 내려간다. **`.page-sub`와 `data-site-sub`는 v3.4에서 폐기**(§4-2) |
| `.list-tools` (v3.2) | — | **v3.4 폐기.** 검색이 `.page-head`로 올라가 툴 행에 남는 것이 인덱스 하나라 래퍼가 필요 없다 |
| `.hero-stats` `.stat` `.stat-num` `.stat-label` | — | 폐기 |
| `.toolbar` | — | 폐기. `.search`가 직접 `<main>`의 자식이 된다 |
| `.select` / `#sortSelect` | — | 폐기(§0-2). `select.field`(에디터)는 남는다 |
| `.cat-nav` / `#catNav` | `.index-list` / `#catIndex` | 그릇이 `.index-row`로 한 겹 생긴다 |
| `.cat-item` `.cat-name` `.cat-count` | `.index-item` / (래퍼 없음) / `.index-count` | `.cat-name`은 **없앤다** — 버튼의 텍스트 노드가 곧 이름이다 |
| `.cat-dot` | — | 폐기(§9-2) |
| `.chips` / `#tagFilters` | `.index-list` / `#tagIndex` | 카테고리와 **같은 부품**을 쓴다 |
| `.chip` | `.index-item` | 동일 |
| `.board` / `#board` | `.post-list` / `#postList` | |
| `.board-empty` / `#boardEmpty` | `.list-empty` / `#listEmpty` | |
| `.board-skeleton` / `#boardSkeleton` / `.skeleton` | `.list-loading` / `#listLoading` | 자리표시자 6장 → 텍스트 한 줄 |
| `.memo*` 전부 | `.entry` 계열 | §4-4 |
| — | `.entry-meta` `.entry-tags` `.entry-tag` | **v3.1 신설.** 박스 안의 둘째 줄(§4-4) |

### 4-2. 페이지 머리말 `.page-head`

- `<h1>`은 **사이트 이름**이다(`data-site-title`). `index.html`의 유일한 h1이므로
  없애면 문서 개요가 깨진다 — 히어로를 지우되 h1은 남긴다.
- 크기는 **`--fs-xl`(19→23px, v3.2)**. v3.0의 `--fs-2xl`(30px)은 세로 1열 목록 위에서는 맞았지만,
  3열 카드가 되면 화면에 제목(`--fs-lg`)이 수십 개 동시에 놓인다. 그 위의 30px 사이트명은
  "페이지 제목 아래 목록"이 아니라 "간판 아래 목록"이다. 23px이면 h1이 카드 제목보다
  한 단계 크되 주인공을 뺏지 않는다. `--fs-4xl`(60px)이 폐기된 이유는 그대로다.
- `.page-head` 아래 여백은 `--sp-5`(v3.1 `--sp-7`) — 머리말이 작아진 만큼 숨도 줄인다.
- 액센트 바(`.hero::before`)·통계·진입 애니메이션 없음. 두 줄이 전부다.
- `.page-sub`는 한 줄(`--fs-sm`, `--c-text-dim`). 두 줄이 되면 `index.json`의
  `site.subtitle`을 줄이라는 뜻이다.

### 4-3. 인덱스 — 분류·태그 (`.index-*`)

**한 부품으로 두 축을 그린다.** 모양으로 구분하지 않고 **라벨과 색으로** 구분한다.
(v3.0의 `#` 접두사는 **v3.1에서 삭제** — 사용자 판정 *"#은 지우고"*.)

| 축 | 라벨 | 항목 색 | 선택 | ARIA | 기본 상태 |
|---|---|---|---|---|---|
| 분류 | `분류` | `--c-text-dim` | **단일** | `aria-current="true"` (비선택은 **속성 제거**, `false` 아님) | 펼침 |
| 태그 | `태그` (접기 손잡이) | **`--c-tag`** | **다중** | `aria-pressed="true|false"` | **접힘** |

- v2.x는 카테고리(탭+레일+점+밑줄)와 태그(알약+테두리)를 **다섯 가지 시각 신호로** 갈랐다.
  그 다섯 가지가 화면 높이의 4분의 1을 먹었다. 두 축을 구분하는 가장 싼 방법은
  **그냥 이름을 적는 것**이다.
- **두 축이 구분되는 근거 셋(v3.1)** — `#`이 빠져도 부족하지 않다.
  ① 라벨 `분류`/`태그`. ② 태그 인덱스는 `<details>` **안**에 있어 손잡이를 연 뒤에야
  그 아래 들여쓰인 줄로 나타난다 — 위치 자체가 "다른 축"이다.
  ③ 태그 항목은 `--c-tag`(자주)이고 분류 항목은 본문색이다. 이 색은 목록 박스의 태그·상세의
  태그와 같은 색이라, 화면 어디서든 **자주색 = 태그**로 학습된다.
- **`flex-wrap: wrap`이다. 가로 스크롤을 쓰지 않는다.**
  v2.x의 `nowrap` + 가로 스크롤은 카테고리가 10개만 넘어도 **뒤쪽 항목이 화면 밖으로
  숨었고**, 스크롤 가능하다는 사실을 덮개·그림자로 따로 알려야 했다.
  인라인 텍스트는 줄바꿈으로 전부 보인다 — 100개여도 6줄이면 끝난다(실측 사례 1).
- **항목 이름은 `<span class="index-name">`에 담는다.** 버튼의 텍스트 노드로 두면
  긴 분류명을 말줄임할 수 없고, **활성 밑줄을 이름에만 걸 수도 없다**(아래).
- 항목 사이 구분자 `·`는 **CSS `::before`가 그린다**(`.index-item + .index-item::before`).
  마크업에 문자를 넣지 않는다 — 문자로 넣으면 줄바꿈 위치에서 구분자가 줄 머리에 혼자 떨어진다.
- **활성 밑줄은 `.index-name`에만 건다** (`.index-item.is-active .index-name`).
  v3.0은 `.index-item`(inline-flex 컨테이너)에 `text-decoration`을 걸었는데, 밑줄이 두 flex
  아이템(`.index-name`·`.index-count`)에 **따로** 전파되고 개수 칸은 글자가 작아(`--fs-xs`)
  밑줄 높이가 달라져 **숫자 아래에 짧은 `_`가 떨어져 보였다** — 사용자가 본 그 밑줄이다.
  개수는 밑줄을 갖지 않는다. 선택된 것은 "이름"이지 "개수"가 아니다.
- `.index-count`는 **실제 정보**다(그 분류에 글이 몇 편). 장식이 아니므로
  `aria-hidden`을 붙이지 않는다. 스크린리더가 "CSS 1"로 읽는 것은 실측 사례 1·6·7이
  공통으로 감수하는 형태다. 색은 `--c-meta`(수량) — 활성이어도 바뀌지 않는다.
- `.index-item.is-empty` : 글이 0편인 분류. **opacity가 아니라 한 단계 낮은 색 토큰**으로
  내린다(opacity는 대비를 4.5:1 아래로 떨어뜨린다).
- **정렬 순서: `categories.json`의 `order`** 오름차순, 같으면 글 수 내림차순.
  자동 정렬(글 수 순)을 기본으로 삼지 않는 이유 — `order`는 사용자가 직접 적는 값이고,
  분류의 순서는 이 블로그에서 **사용자의 편집 대상**이다(요구사항: 카테고리 직접 추가).

**컨트롤 축소 (v3.2)** — 사용자 판정 *"검색창이라던지 카테고리라던지 너무 커"*.

| 부품 | v3.1 | v3.2 | 왜 |
|---|---|---|---|
| `.search-input` | 높이 `--h-control`(40), 반경 `--r-md`, 폭 720 전체 | 높이 **`--h-control-sm`**(32, coarse 44), 반경 `--r-sm`, **`max-inline-size: 20rem`** | 검색어는 한두 단어다. 720px 인풋의 600px은 빈 칸이었다. 인덱스 항목과 같은 높이 토큰이라 툴 행에서 첫 줄이 같은 선에 앉는다 |
| 돋보기 | 11px / 2px 선 | 9px / 1.5px 선 | 32px 안에서 11px 렌즈는 글자보다 크다 |
| `.search-clear` | `--h-control-xs` 30 | `--h-control-xs` **24**(coarse 36) | 인풋을 따라 내린다(§2) |
| `.index-item` | `--fs-sm`, 좌우 패딩 `--sp-2`, 구분자 간격 `--sp-2` | **`--fs-xs`**, 패딩·간격 **`--sp-1`** | 높이(`--h-control-sm`)는 그대로 — 손가락이 누른다. 글자가 작아져 32px 안에서 위아래 숨이 늘어나 "덩어리"가 아니라 "글자"로 보인다 |
| `.index-fold-summary` | `--fs-xs`, 패딩 `--sp-2` | `--fs-xs`, 패딩 `--sp-1` | 손잡이도 인덱스 항목과 같은 간격 |
| `.list-tools` | (없음) | 분류 왼쪽 `flex: 1`, 검색 오른쪽 `flex: 0 1 20rem`, `align-items: flex-start` | 인덱스가 두 줄로 감겨도 검색이 밀리지 않는다 |

**태그를 접어 두는 이유와 그 규칙**

- 글 300편이면 태그는 쉽게 50개가 된다. 분류 인덱스와 태그 인덱스가 **둘 다 펼쳐진 채로**
  목록 위에 쌓이면 화면 절반이 색인이 된다. 분류가 1차 축이므로 분류만 펼친다.
- `<details>`는 JS 0줄이다. 요약 줄(`.index-fold-summary`)이 닫힌 상태의 **한 줄**이다.
- **태그가 하나도 없으면 `<details>` 자체를 렌더하지 않는다**(빈 손잡이를 두지 않는다).
- **URL에 `?tags=`가 있으면 JS가 `<details>`에 `open`을 붙인다.**
  필터가 걸려 있는데 그 필터가 접혀 있으면 사용자는 **왜 글이 3편뿐인지 알 수 없다.**
  이건 선택이 아니라 필수다.

**행 자체를 지워야 하는 경우** — 분류가 하나도 없으면(`categories.json`이 비었고
글에도 분류가 없으면) `#catRow` 전체에 `hidden`을 붙인다. `분류  전체 0` 한 줄은
정보가 아니라 **"여기 뭔가 고장났나?"** 로 읽힌다. 글이 0편인 첫 화면에서 특히 그렇다.

**이 구조의 한계와 다음 단계(지금은 만들지 않는다)** — 분류가 대략 40개를 넘어
인덱스가 세 줄 이상을 차지하면, 그때 `categories.html` 전용 페이지(개수 내림차순
다열 그리드, 실측 사례 7의 방식)를 만들고 인덱스 행은 상위 N개 + "전체 분류 보기"로 줄인다.
**지금 만들지 않는 이유: 분류가 0개인 상태에서 시작한다.** 필요해지기 전에 만든 화면이
곧 "AI티"다.

### 4-4. 목록 `.post-list` — 카드 그리드, 글 하나 = 카드 하나 (v3.2)

> **사용자 판정(v3.1): "리스트 나열 보다는 박스 형태로 게시글 [표시]해줘"**, 그리고
> **v3.2: "전체적으로 구조가 비어보여".** v3.1은 박스를 세로 1열로 쌓았다 — 720px 안에서
> 박스 하나가 한 줄을 다 쓰니 "리스트에 테두리를 두른 것"이었다. v3.2는 **자동 채움 그리드**다
> (데스크톱 3열 / 태블릿 2열 / 폰 1열). 박스 자체는 v3.1과 같다 —
> **1px 경계선 + 한 단계 밝은 면 + 작은 반경**, 그림자·기울기·색 종이 없음.

```html
<section class="entry-group">
  <h2 class="entry-group-label">2026</h2>          <!-- <ul> 밖 → 그리드 위 full-width -->
  <ul class="entry-list">                          <!-- grid: repeat(auto-fill, minmax(17rem, 1fr)) -->
    <li class="entry is-pinned">
      <span class="entry-cat">CSS</span>           <!-- v3.2 신설. 분류명. 미분류면 생략 -->
      <a class="entry-title" href="post.html?id=…">CSS Grid 정리</a>
      <div class="entry-meta">                     <!-- 날짜·태그 둘 다 없으면 생략 -->
        <time class="entry-date" datetime="2026-09-13">2026.09.13</time>
        <ul class="entry-tags" aria-label="태그">
          <li class="entry-tag">css</li>
        </ul>
      </div>
    </li>
  </ul>
</section>
```

**DOM 순서 고정: `.entry-cat` → `.entry-title` → `.entry-meta`.** Tab 정지점은 여전히 제목 하나다.
(v3.0 `날짜 → 제목`, v3.1 `제목 → 메타`, **v3.2 `분류 → 제목 → 메타`. `app.js` `entryRow()` — §12-8.**)

**카드 안의 내용물은 `분류` / `제목` / `날짜` / `태그` 넷이다.** (v3.1 "셋"에서 개정.)
요약·수정일·아이콘은 여전히 금지. 분류를 넣은 이유 — v3.1은 "분류는 인덱스가 이미 보여 준다"며
뺐지만, 그리드에서 카드는 인덱스에서 멀어지고(3열 × 5행이면 인덱스는 화면 밖) 한 행에 다른 분류의
글이 섞인다. 카드가 스스로 "무슨 분류의 글인지"를 말해야 한다. 그리고 이 한 줄이 카드 안에
**청록(분류)·황토(날짜)·자주(태그)** 셋을 다 놓아 사용자 판정 *"너무 단색"* 이 실제로 해소된다.

| 요소 | 규칙 | 근거 |
|---|---|---|
| `.entry-list` | `display: grid; grid-template-columns: repeat(auto-fill, minmax(min(17rem, 100%), 1fr)); gap: --sp-4` | **미디어쿼리 없이** auto-fill이 열 수를 정한다. 17rem(272px): 1440 도킹(본문 1088) **3열** / 1024 도킹(700) **2열** / 768(704) **2열** / 616 아래 **1열**. 15rem이면 1440에서 4열 — 제목이 두 줄씩 꺾이고 한 줄에 훑을 카드가 너무 많다 |
| `.entry` | `position: relative` · 세로 flex · 1px `--c-border` · `--r-md` · 면 `--c-surface` · 패딩 `--sp-4 --sp-5`(440px 이하 `--sp-4`) · **그림자 없음** | 면이 바탕보다 한 단계 밝아 "종이가 얹혀 있다"가 경계선만으로 읽힌다. 원칙 3 유지 |
| **`.entry-cat`** | `--fs-xs` / 700 / `--ls-wide` / **`--c-accent`** / 한 줄 말줄임 / **링크 아님** / `display: block` | 카드의 첫 줄, 작은 소문 라벨. 액센트색인 이유: 분류는 상세의 `.post-cat`과 같은 개념이고 그 색이 청록이다. 링크가 아닌 이유는 태그와 같다(카드 전체가 이미 링크) |
| `.entry-title` | `--fs-lg` / 600 / `--c-text` / `display: block` / `flex: none` | 화면에서 **가장 눈에 띄는 글자**. 두 줄이 되어도 자르지 않는다(그리드 행 높이가 따라간다) |
| `.entry-title::after` | `position: absolute; inset: 0` — **카드 전체를 링크 면적으로 늘린다** | `<li>`를 통째로 `<a>`로 감싸면 스크린리더가 카드 내용 전부를 링크 이름으로 읽는다. `::after` 방식은 Tab 정지점이 제목 하나이고 태그·분류는 링크가 아니다(300편 × 4 = Tab 1200번을 만들지 않는다) |
| `.entry-meta` | `flex-wrap`, `--fs-sm`, `align-items: baseline`, **`margin-block-start: auto`**, 위 패딩 `--sp-2` | 마지막 줄. **카드 바닥에 붙는다** — 한 줄 제목 카드와 두 줄 제목 카드가 한 행에 있어도 날짜 줄이 같은 높이에 선다(그리드가 행 높이를 맞추고 auto 마진이 밀어 내린다) |
| `.entry-date` | **`--c-meta`** / `tabular-nums` | 시간 = 황토(§1-2). 300개가 같은 색이라 리듬이 된다 |
| `.entry-tags` `.entry-tag` | `<ul>`/`<li>`, **링크 아님**, **`--c-tag`** | 태그는 "무엇에 관한 메모인지"라 목록에서 정보다. 누르고 싶으면 상세로 가서 누른다 — 여기서 링크로 두면 카드 전체 링크(`::after`)와 충돌한다 |
| hover / focus-visible | 제목 = 밑줄 + `--c-accent`. 카드 = **경계선만** 액센트 쪽으로 살짝(`color-mix` 45%). **이동·그림자·배경 변화 없음** | 그리드에서 카드가 움직이면 옆·아래 카드가 흔들려 보인다. `:has()`가 없는 브라우저는 제목만 반응한다 — 퇴행 없음 |
| 카드 사이 | `gap: --sp-4` | 16px. 한 행의 카드가 "한 줄"로 읽히면서도 경계선이 붙어 표로 보이지 않는 최소값(v3.1 1열의 12px보다 4px 넓다 — 가로로도 떨어져야 하기 때문) |
| 터치 타깃 | **카드 전체**가 링크 면적이다(`::after`). 카드 최소 높이 = 패딩 32 + 라벨 + 제목 + 메타 ≈ 110px > 44px | `.entry-title` 자체의 `--h-control` 규칙은 없다(§11-2) |
| `created` 내림차순 고정 | 정렬 컨트롤이 없다(§0-2). 학습 기록의 순서는 시간순 하나다 | |

**360px 검산** — 거터 20×2 + 카드 패딩 16×2 + 경계선 2 = 74px. 제목에 **286px**이 남는다(1열).
`minmax(min(17rem, 100%), 1fr)`의 `min()`이 320px 화면에서도 카드가 거터를 넘지 않게 한다.

**연도 그룹 `.entry-group`**

- `created`의 연도가 바뀌는 지점마다 `<section class="entry-group">`으로 끊고
  `<h2 class="entry-group-label">2026</h2>`를 붙인다.
- **목록 전체가 한 해에 들어가면 `<h2>`를 넣지 않는다**(`<section>`은 그대로 둔다).
  글 4편 위에 "2026" 한 줄이 떠 있는 것은 정보가 아니라 장식이다.
- 이 규칙 하나로 **1편일 때와 300편일 때가 둘 다 말이 된다.**
  4편이면 아무것도 없고, 300편이면 연도 5개가 스크롤의 이정표가 된다.
  실측 7곳 중 페이지네이션을 쓰는 곳은 0곳이었다 — 긴 목록은 자르는 게 아니라 **끊어 읽힌다.**
- 필터(분류·태그·검색)가 걸린 결과에도 같은 규칙을 적용한다.
- 라벨은 `--c-meta`(연도 = 시간), `--fs-sm`, 700. **v3.0의 밑선은 뺀다** — 박스 경계선 위에
  선이 하나 더 있으면 줄이 셋이 된다. 라벨과 첫 박스 사이는 `--sp-3`.
- v3.2: 라벨은 `<ul class="entry-list">`(그리드) **밖**, `<section>`의 첫 자식이다. 그래서 규칙 없이
  그리드 위에 full-width로 선다. 그리드 안에 넣고 `grid-column: 1 / -1`을 거는 방식은 쓰지 않는다 —
  `<ul>` 안에 `<h2>`가 들어가면 유효하지 않은 마크업이다.

**행의 상태 클래스 2종**

| 클래스 | 누가 | 무엇 |
|---|---|---|
| `.entry.is-pinned` | `app.js` | 고정 글. **연도 그룹보다 위**에 별도 `<section class="entry-group">`(라벨 없음)으로 먼저 온다. 표시는 압정 그림이 아니라 제목 앞의 작은 `고정` 글자 — CSS가 `::before`로 그리므로 **마크업에 문자를 넣지 않는다** |
| `.entry.is-hidden` | `app.js` | 검색·필터로 걸러진 행. `display: none`이라야 목록에서 실제로 빠진다. 다시 드러낼 때 추가로 불러야 하는 함수는 없다(v2.x의 `reveal()`은 폐기됐다 — §12) |

**이행 중 상태** — `app.js`가 `.entry-cat` 없이 v3.1 순서로 그려도 CSS는 깨지지 않는다
(카드 첫 줄이 제목이 될 뿐). 다만 그 상태는 계약 위반이므로 §12-8을 마친 뒤에만 라운드를 닫는다.

**빈 상태 / 로딩**

- `.list-loading` : 텍스트 한 줄, `--c-text-mute`. 애니메이션 없음. 로드가 끝나면 `hidden`.
- `.list-empty` : **가운데 정렬한 파선 상자를 쓰지 않는다.** 목록이 있을 자리에
  같은 왼쪽 선으로 시작하는 두 문단을 둔다. 첫 줄은 `<strong>`(무슨 상태인지),
  둘째 줄은 다음 행동. 이 화면은 글이 0편인 지금 **사용자가 가장 먼저 보는 화면**이다.
  "비어 있음"이 고장으로 보이면 안 된다.
- 문구는 상황별로 JS가 갈아 끼운다(글 0편 / 검색 결과 없음 / 없는 분류).

---

## 5. post.html — 글 상세

```html
<main class="site-main" id="main" tabindex="-1">

  <a class="back-link" href="index.html">← 목록</a>

  <article class="post is-loading" id="post">
    <header class="post-head">
      <h1 class="post-title" id="postTitle">…</h1>
      <p class="post-summary" id="postSummary"></p>

      <!-- 순서 고정: 날짜 줄 → 분류·태그 줄 -->
      <p class="post-dates">
        <time class="post-date" id="postDate" datetime="…">게시 2026.09.13</time>
        <time class="post-updated" id="postUpdated" datetime="…">수정 2026.09.15</time>
      </p>
      <div class="post-meta">
        <a class="post-cat" id="postCat" href="index.html?cat=css"
           aria-label="CSS 분류의 글 모두 보기">CSS</a>
        <ul class="post-tags" id="postTags">
          <li class="tag"><a href="index.html?tags=css">css</a></li>
        </ul>
      </div>
    </header>

    <!-- h2가 3개 이상일 때만. 본문 "위"의 인라인 박스다(§5-4) -->
    <aside class="toc" id="toc" hidden>
      <p class="toc-title">목차</p>
      <nav class="toc-list" aria-label="본문 목차">
        <a class="toc-item is-h2" href="#…">…</a>
      </nav>
    </aside>

    <div class="prose" id="postBody"><!-- 마크다운 렌더 결과 --></div>

    <footer class="post-foot">
      <a class="btn" id="postEdit" href="write.html?id=…" data-admin-only>수정</a>
    </footer>

    <!-- v3.3: 연관 글(§5-8). 점수 > 0인 글이 하나도 없으면 hidden 그대로 — 빈 문구를 두지 않는다 -->
    <section class="post-related" id="postRelated" aria-labelledby="postRelatedTitle" hidden>
      <h2 class="post-related-title" id="postRelatedTitle">연관 글</h2>
      <ul class="entry-list" id="postRelatedList">
        <li class="entry">                                    <!-- 목록 카드(§4-4)와 같은 부품. is-pinned는 붙이지 않는다 -->
          <span class="entry-cat">CSS</span>
          <a class="entry-title" href="post.html?id=…">CSS Grid 정리</a>
          <div class="entry-meta">
            <time class="entry-date" datetime="2026-09-13">2026.09.13</time>
            <ul class="entry-tags" aria-label="겹치는 태그"><li class="entry-tag">css</li></ul>
          </div>
        </li>
      </ul>
    </section>

    <nav class="post-nav" id="postNav" aria-label="이전 글 · 다음 글" hidden>
      <a class="post-nav-item is-prev" href="…">
        <span class="post-nav-label">이전</span><span class="post-nav-title">…</span>
      </a>
      <a class="post-nav-item is-next" href="…">…</a>
    </nav>
  </article>

  <div class="post-error" id="postError" hidden>…</div>
</main>
```

### 5-1. v2.3에서 바뀐 것

| 항목 | v2.3 | v3.0 |
|---|---|---|
| `.post-head` | 그리드(1행: 목록으로 \| 수정 버튼) | **일반 블록.** `.back-link`는 `<main>` 직계로 올라가고 수정 버튼은 `.post-foot`으로 내려간다 |
| `.post-cat` 위치 | 제목 **위** | 제목 **아래**, 태그와 같은 줄(`.post-meta`) |
| `.post-meta` | 날짜 2개 + 읽는 시간 | **분류 + 태그.** 날짜는 `.post-dates`로 분리 |
| `.post-read` | 있음 | **삭제** |
| `.post-body` (2열 래퍼) | 있음 | **삭제.** `.prose`가 `.post`의 직계 자식이다 |
| `.toc` | `.post-body`의 2열 칸, 1024px sticky | **본문 위 인라인 박스**(§5-4) |
| `.toc-item.is-active` | 스크롤 스파이가 갱신 | **삭제** (§5-4) |
| `.post-nav-item` | 테두리·배경 있는 카드 | **평범한 텍스트 링크 2개** |
| `.post-foot` | 없음 | **신설.** 수정 버튼의 새 집 |
| `.post-dates` | 없음 | **신설**(§5-2) |

### 5-2. 날짜 — 요구사항 #3

```html
<p class="post-dates">
  <time class="post-date" id="postDate" datetime="2026-09-13T14:20:00+09:00">게시 2026.09.13</time>
  <time class="post-updated" id="postUpdated" datetime="2026-09-15T09:10:00+09:00">수정 2026.09.15</time>
</p>
```

- **제목 바로 아래 한 줄에 병기한다.** 실측 사례 7이 871편에서 검증한 형태다
  (`Date: 2020.05.26  Updated: 2020.05.30`).
  사례 1은 같은 정보를 글 맨 아래 두는데, 우리는 **사용자가 직접 요구한 기능**이라
  "표시했지만 안 보이는" 위치로 내리지 않는다.
- **구분자 `·`는 CSS가 그린다**(`.post-dates > * + *::before`). 마크업에 문자를 넣지 않는다.
- **`updated`가 `created`와 같은 날이면 `#postUpdated`에 `hidden`을 붙인다.**
  같은 날짜가 두 번 찍히면 "수정 이력이 있다"는 정보가 아니라 중복이다.
  → `created`는 불변, `updated`는 저장할 때마다 갱신(CLAUDE.md 절대 규칙 4)은 그대로다.
- **목록(§4-4)에는 게시일만 둔다.** 한 행에 날짜 두 개를 넣으면 제목을 훑는 속도가 떨어지고,
  실측 7곳 중 목록에 수정일을 둔 곳은 0곳이다. 두 날짜는 상세에서 전부 보인다.
- 색은 `--c-meta`(v3.1) — 목록의 날짜와 같은 색이라 "이 황토색 숫자 = 날짜"가 두 화면에서 같다.

### 5-3. 분류·태그 `.post-meta`

- `.post-cat`은 **`<a>`** 다. 같은 분류의 목록(`index.html?cat=slug`)으로 가는 유일한 경로이며
  검색·직접 링크로 들어온 사람이 가장 자주 쓰는 길이다.
  링크 텍스트는 분류 **이름**, `href`는 **slug**, `aria-label="OO 분류의 글 모두 보기"`.
  분류가 없는 글이면 `post.js`가 요소를 감춘다(빈 링크를 남기지 않는다).
- `.post-tags`의 항목은 `<li class="tag"><a href="index.html?tags=…">` 다.
  높이는 `<li>`가 갖고 `<a>`가 `block-size:100%`로 채운다(= 눌리는 면적 = `<li>` 높이).
  태그 문자열은 `encodeURIComponent`로 감싼다. 쉼표가 든 태그는 왕복이 깨지므로 넣지 않는다.
- **`#` 접두사 없음(v3.1).** v3.0은 `.tag > a::before`로 `#`을 그렸다. 인덱스에서 `#`을 지웠으니
  상세에서만 남기면 같은 태그가 두 화면에서 다르게 보인다. 태그의 정체는 `#`이 아니라
  **색(`--c-tag`)** 이 말한다 — 목록 박스·태그 인덱스와 같은 색.
- v2.x는 분류 라벨에 앞머리 막대·알약 틴트·확대까지 **호버 신호 3종**을 걸었다.
  v3.0에서는 `.post-cat`도 `.tag`도 **밑줄 + 색**으로만 반응한다 — 본문 링크와 같은 어휘다.
  한 화면에 링크 어휘가 세 가지면 그것 자체가 소음이다. hover 색은 `--c-accent`(누를 수 있는 것)다.

### 5-4. 목차 — 인라인 박스 유지 + 사이드바에 현재 절 표시 (v3.3)

> **사용자 요청(원문): "목차 진행바 — 긴 글 읽을 때 현재 절을 목차에 표시(스크롤 스파이)".**
> v3.0은 스파이를 폐기했다(아래 표). 사용자가 되돌렸다. 단, 되살리는 것은 "현재 절 표시"이지
> v2.3의 2열 그리드·sticky 트랙·rAF 핸들러가 아니다.

**결정: 인라인 목차(`.toc`)는 그대로. 현재 절 표시는 사이드바(§3-2) 안의 `.side-toc`가 맡는다.**

세 후보를 놓고 골랐다.

| 후보 | 무엇 | 왜 안 골랐나 / 골랐나 |
|---|---|---|
| A. 1024px+ 오른쪽 sticky 목차 | v2 방식 복귀 | 2열 그리드를 다시 만든다. 그리고 **도킹된 1024px에서는 자리가 없다** — 1024 − 260(사이드바) = 764px에 720px 칼럼이 들어가면 오른쪽에 44px이 남는다. 1280px 이상에서만 켜는 규칙이 하나 더 필요해진다 |
| B. 화면 상단 얇은 "현재 절: ○○" 띠 | 새 sticky 요소 | "어디 있는지"는 말하지만 "어디로 갈 수 있는지"는 못 말한다 — 목차가 아니다. 사용자는 **목차에** 표시하라고 했다. 헤더가 static인 사이트(§3)에 sticky 띠 하나가 새로 생기는 것도 어휘를 하나 늘린다 |
| **C. 사이드바에 현재 글의 목차** | 있는 것에 끼운다 | 사이드바는 이미 fixed이고, 고정하면 1024px 이상에서 화면에 붙어 있다. 트리는 이미 "분류 → 글"이라 그 아래 "→ 절"이 자연스럽게 한 단계 더 들어간다. 새 패널·새 분기·새 그리드가 **없다** |

C의 한계를 숨기지 않는다. 사이드바 기본은 닫힘이라 **고정해 두지 않은 사용자는 현재 절 표시를
스크롤 중에 보지 못한다.** 그 대신 햄버거를 여는 순간 "지금 어느 절인지"가 이미 표시된 채로 열린다
(스파이는 사이드바가 닫혀 있어도 돈다 — 옵저버 하나에 대상 ≤ 50개라 비용이 없다).
이 블로그의 사이드바 고정은 사용자 본인이 요구한 기능이고(§3-2), 긴 글을 자주 읽는 사람이
그것을 켜 두는 것이 이 설계의 전제다.

**마크업** — `post.js`가 `renderSide()` 뒤에 끼운다(§3-2 트리 예시 참조).

```html
<a class="side-post" href="post.html?id=…" aria-current="page">클로저와 렉시컬 스코프</a>
<ol class="side-toc" id="sideToc" aria-label="이 글의 목차">
  <li><a class="side-toc-item is-h2" href="#lexical-scope" aria-current="location">렉시컬 스코프란</a></li>
  <li><a class="side-toc-item is-h3" href="#execution-context">실행 컨텍스트와 환경 레코드</a></li>
</ol>
```

| 규칙 | 내용 |
|---|---|
| 표시 조건 | **인라인 목차와 같다 — h2 3개 이상.** 조건이 둘이면 "왜 여기엔 있고 저기엔 없지"가 된다. 조건 미달이면 `.side-toc`를 만들지 않는다 |
| 항목 | `markdown.js` `collectHeadings()`가 준 h2·h3 전부, 문서 순서. `href`는 인라인 목차와 같은 `#id`(`encodeURIComponent`) |
| 등급 클래스 | `is-h2` / `is-h3` — 인라인 목차와 같은 생성 시 고정 클래스(§8). h3만 한 단계 들여쓴다 |
| **현재 절 상태** | **`aria-current="location"`** 하나. 클래스(`is-active`)를 따로 붙이지 않는다 — 사이드바의 다른 상태와 같은 규칙("ARIA 속성이 곧 상태", §8). CSS는 `.side-toc-item[aria-current="location"]`으로 그린다: 액센트색 + 굵기 + 안내선 위에 2px 액센트 선(색만으로 말하지 않는다) |
| 위치 | 현재 글 `.side-post[aria-current="page"]`의 **다음 형제**(같은 `<li>` 안). 그 요소가 없으면(글이 index.json에 없다) 끼우지 않는다 |
| 인라인 `.toc` | **바뀌지 않는다. `.toc-item`에는 `aria-current`도 `is-active`도 붙이지 않는다** — 스크롤과 함께 화면 밖으로 나가는 박스에 "지금 여기"를 표시할 이유가 없다는 v3.0 근거는 그대로 맞다 |
| 360px | 사이드바가 오버레이라 닫혀 있는 동안은 보이지 않는다. 스파이를 끄지는 않는다 — 열면 현재 절이 표시된 채 열린다. 별도 분기 없음 |
| 사이드바 안 스크롤 | 현재 절 항목이 `.side-tree`의 보이는 영역 밖이면 **`scrollTop`을 직접 조정**해 안으로 들인다. `scrollIntoView()`는 쓰지 않는다 — 조상 스크롤 컨테이너를 전부 건드려 본문 스크롤까지 움직일 수 있다 |

**JS가 할 일(`post.js`, 한 문단)** — `render()`가 `result.headings`를 얻고 `renderSide()`의 Promise가
끝난 뒤(둘 다 비동기라 둘 중 나중 것이 `mountSideToc()`를 부른다) h2가 3개 이상이면 위 마크업을 만들어
현재 글 아래 끼운다. 그다음 `IntersectionObserver`를 하나 만들어 모든 제목 요소(`heading.el`)를
`rootMargin: '0px 0px -60% 0px'`(화면 위쪽 40% 띠) · `threshold: 0`으로 관찰한다. 콜백은 "어느 제목이
띠를 건넜다"는 신호로만 쓰고, 실제 판정은 매번 다시 계산한다 — **`top ≤ innerHeight × 0.4`인 마지막
제목**이 현재 절이다(제목 수 ≤ 50이라 `getBoundingClientRect()` 전수 조회가 싸다). 아무 제목도 그 선을
넘지 않았으면(글 머리) 현재 절이 없다 — 어느 항목에도 붙이지 않는다. 판정이 바뀌면 이전 항목의
`aria-current`를 떼고 새 항목에 `"location"`을 붙이고, 그 항목이 `.side-tree` 밖이면 `scrollTop`을 맞춘다.
`hashchange`(목차 클릭·직접 링크)에서는 해시의 id로 즉시 같은 갱신을 한다. `IntersectionObserver`가
없는 브라우저면 스파이만 건너뛴다(목차는 링크로서 그대로 동작). 스크롤 핸들러·rAF는 쓰지 않는다.

---

**v3.0의 결정(기록용): 사이드바형 목차는 폐기, 본문 위 인라인 목차는 유지. 조건은 h2 3개 이상.**
아래 표와 항목은 인라인 목차의 근거로 여전히 유효하다. `.toc-item.is-active`는 v3.3에서도 없다.

| | 사이드바형(v2.3) | 인라인형(v3.0) |
|---|---|---|
| 끌고 오는 것 | `.post-body` 2열 그리드 · `--w-toc` · 1024px sticky · `:has(> .toc[hidden])` 트랙 접기 · 스크롤 스파이(rAF) · `.toc-item.is-active` | `<aside>` 하나 |
| 짧은 글에서 | 빈 2열 트랙을 접는 `:has()` 규칙이 필요 | `hidden` 하나면 끝 |
| 실측 | 7곳 중 0곳 | 7곳 중 1곳(사례 7 — 871편, 우리와 조건이 가장 가까움) |

- **표시 조건: `h2`가 3개 이상**(v2.3은 "제목 2개 이상"이었다).
  이 블로그의 글은 대부분 "메모"라 h2가 0~2개다. 그 글들에는 목차가 나오지 않는다.
  진짜 긴 정리글에서만 나타나야 목차가 **기능**이지 장식이 아니다.
- `.toc-item.is-h2` / `.is-h3` 는 유지한다(h3만 들여쓴다. **v3.3: 크기는 h2 항목과 같은 `--fs-sm`** —
  12px로 내려 두었더니 목차에서 가장 읽기 힘든 글자가 됐다. 등급은 들여쓰기와 색(mute)이 말한다).
  **인라인 박스의 `.is-active`는 없다** — 화면에서 스크롤과 함께 사라지는 박스에
  "지금 여기"를 표시할 이유가 없다. 현재 절 표시는 v3.3부터 사이드바 `.side-toc`가 맡는다(위).
- 제목의 `id` 생성은 **유지한다**(`markdown.js`). 목차가 없는 글에서도
  특정 절로 직접 링크를 걸 수 있는 것은 그 자체로 쓸모가 있다.

### 5-5. 이전 / 다음

- **유지한다.** 학습 기록은 시간순으로 이어 읽는 경우가 실제로 있고,
  마크업은 이미 있으며(post.js), 비용은 텍스트 두 줄이다.
- **카드가 아니다.** 테두리·배경·그림자·hover 이동 전부 없앤다.
  `← 이전` / `다음 →` 라벨은 `--fs-xs`·mute, 제목은 `--fs-sm`·본문색. 두 줄이 전부다.
- 768px 이상에서 2열(이전 왼쪽 / 다음 오른쪽), 미만에서는 1열로 쌓인다.
  이전 글이 없으면 다음 글이 오른쪽 칸을 지킨다(`.is-next:only-child { grid-column: 2 }`).

### 5-6. `.post.is-loading`

`post.js`가 렌더를 마칠 때 뗀다. **v3.0에서는 진입 애니메이션의 트리거가 아니다**
(진입 애니메이션이 없다). 하는 일은 하나 — 렌더 전 빈 머리말을 눌러 두는 것.
`pointer-events: none`을 걸되 **`.back-link`는 예외**다. CDN이 막혀 `post.js`가
클래스를 떼지 못하면 사용자가 페이지에 갇힌다. 탈출구는 항상 살아 있어야 한다.

### 5-7. `.prose` 안

- 태그 셀렉터로만 스타일링한다(마크다운 결과라 클래스를 붙일 수 없다).
- 코드블록은 `markdown.js`가 아래 구조로 감싼다. **DOM 순서는 고정**이다
  (`prose.css`가 "머리띠 1행 + 코드 1행" 그리드로 그린다).

  ```html
  <div class="code-wrap">
    <span class="code-lang" aria-hidden="true">JS</span>
    <button class="code-copy" type="button" aria-label="JS 코드 복사">복사</button>
    <pre><code class="hljs language-js">…</code></pre>
  </div>
  ```
  - `.code-lang`은 장식 라벨이라 `aria-hidden="true"`다(같은 정보가 `.code-copy`의
    `aria-label`에 있다 — 빼지 않으면 언어명을 두 번 읽는다).
  - 언어가 없으면 `TEXT`로 채운다. 라벨 칸을 비우면 머리띠 높이가 블록마다 달라진다.
- 표는 `.table-wrap` 안의 `.prose table` — 규칙 전체는 §7-1.
- **코드블록 안 `pre`의 여백(v3.3 수정)**: `.prose pre`(JS 실패 시 폴백)의 `margin-block: --sp-7`이
  `.code-wrap > pre`에도 먹어 머리띠와 첫 줄 사이에 52px 빈 띠가 있었다(특이도가 같아 뒤 규칙이 이겼다).
  `prose.css`가 `.prose .code-wrap > pre { margin: 0 }`로 고쳤다. 마크업은 그대로다.

### 5-8. 연관 글 `.post-related` (v3.3 신설)

> **사용자 요청(원문): "연관 글 자동 추천 — 같은 태그·같은 분류 글을 상세 하단에 3개 표시".**

**위치: `.post-foot` 다음, `.post-nav` 앞.** 글을 다 읽은 자리에서 먼저 보여야 하는 것은
"같은 주제의 다른 글"(연관)이고, 시간순 이웃(이전/다음)은 그다음이다. 이전/다음은 두 줄짜리라
맨 아래에 있어도 잃을 것이 없다.

**카드는 목록의 `.entry`(§4-4)를 그대로 쓴다.** 같은 물건(글 한 편)은 두 화면에서 같은 모양이어야
같은 것으로 읽힌다. 시각적으로 구분할 필요는 소제목 "연관 글"과 자리(글 아래)가 이미 채운다.
목록 카드와 다른 점은 **둘뿐**이고 전부 CSS가 처리한다 — 720px 칼럼(내용폭 656px)에 세 장이 들어가도록
카드 최소폭 17rem → 13rem, 제목 `--fs-lg` → `--fs-md`(208px 카드에 19px은 한 줄 10자).

```html
<section class="post-related" id="postRelated" aria-labelledby="postRelatedTitle" hidden>
  <h2 class="post-related-title" id="postRelatedTitle">연관 글</h2>
  <ul class="entry-list" id="postRelatedList">
    <li class="entry">
      <span class="entry-cat">CSS</span>                        <!-- 그 글의 분류명. 미분류면 생략(§4-4와 같음) -->
      <a class="entry-title" href="post.html?id=…">CSS Grid 정리</a>
      <div class="entry-meta">
        <time class="entry-date" datetime="2026-09-13">2026.09.13</time>   <!-- created -->
        <ul class="entry-tags" aria-label="겹치는 태그">           <!-- 현재 글과 겹치는 태그만. 0개면 <ul> 생략 -->
          <li class="entry-tag">css</li>
        </ul>
      </div>
    </li>
  </ul>
</section>
```

| 규칙 | 내용 |
|---|---|
| 카드 내용물 | 분류(`.entry-cat`) / 제목 / 게시일 / **겹치는 태그만**. 전체 태그를 다 적으면 "왜 이 글이 연관인지"가 안 보인다. 분류만 같아서 뽑힌 글은 태그 줄이 없고 `.entry-cat`이 그 이유를 말한다 |
| 태그 순서 | 그 글의 `tags` 순서 그대로(현재 글 순서가 아니다 — 카드는 그 글의 것) |
| `.is-pinned` | **붙이지 않는다.** 고정은 목록의 정렬 정보라 여기서는 뜻이 없다 |
| 빈 상태 | 점수 > 0인 글이 없으면 `#postRelated`는 `hidden` 그대로. **"연관 글이 없습니다" 같은 문구를 두지 않는다** |
| 개수 | 최대 3. 3개 미만이면 있는 만큼(1개여도 그린다) |
| 링크 면적 | 카드 전체(`.entry-title::after`, §4-4). Tab 정지점은 제목 하나 |
| 로딩 실패 | `index.json`이 없으면 그리지 않는다(본문은 그대로) |

**점수 규칙 — `post.js`가 그대로 구현한다.** 후보 = `index.json`의 글 전부에서 **자기 자신 제외**.

| 항목 | 점수 | 왜 이 값인가 |
|---|---|---|
| 겹치는 태그 1개당 | **+2** | 태그는 분류보다 잘다. 분류 "JavaScript"에 100편이 있어도 태그 `closure`는 서너 편이다. 태그 하나가 분류 하나보다 많은 것을 말하므로 두 배다 |
| 같은 분류 | **+1** | 태그가 하나도 안 겹쳐도 같은 분류면 후보다(사용자 원문 "같은 태그·같은 분류"). 그리고 태그 1개 + 같은 분류(3)가 태그 1개 + 다른 분류(2)를 이겨 **분류가 동점 처리기**로 작동한다 |
| 동점 | `created` 내림차순 | 학습 기록의 기본 순서(§4-4). 같은 값이면 최신 글이 더 이어 읽을 만하다 |
| 점수 0 | 제외 | 태그도 분류도 안 겹치면 연관이 아니다. 채우려고 아무 글이나 넣지 않는다 |

- 태그 비교는 **`trim()` + 소문자**로 한다(`CSS`와 `css`는 같은 태그). 분류 비교는 `store.categorySlug()`
  결과로 한다(`.md`에 한글 이름이 적혀 있어도 slug로 맞춘다 — `driftKeys()`와 같은 방법).
- `pinned`·`updated`·`summary`는 점수에 들어가지 않는다.
- 상위 3개를 **점수 내림차순 → created 내림차순** 순서로 그린다. 순서가 곧 "가장 가까운 글부터"다.

**JS가 할 일(`post.js`)** — `render()` 안에서 `renderNav(meta.id)` 옆에 `renderRelated(meta)`.
후보는 `store.getIndexSync().posts`(loadPost가 loadIndex를 먼저 기다리므로 그 시점엔 있다).
카드 빌더는 `app.js`의 `entryRow()`와 **같은 마크업**이어야 한다 — `util.js`로 옮겨 `U.entryCard(post, { tags })`
하나를 두 파일이 쓰는 것을 권한다(둘 다 frontend-dev 소유). `is-hidden`/`is-pinned`는 붙이지 않는다.

---

## 6. write.html — 에디터

**`<main>`에 `.editor-page`를 함께 붙인다** — `<main class="site-main editor-page" id="main">`.
읽는 화면의 칼럼은 `--w-prose`(720px) 하나지만(§2), 에디터는 **좌우 분할이 목적**이라
720px 안에서는 두 칸이 각각 340px가 되어 쓸 수 없다. `.editor-page`가 그 한 화면에서만
기준선을 76rem으로 푼다. **이 클래스는 write.html의 `<main>` 외에 어디에도 쓰지 않는다.**

```html
<div class="editor-visitor" id="editorVisitor" hidden>…</div>

<div class="editor">
  <div class="editor-head">
    <input class="editor-title" id="fTitle" placeholder="제목">
    <p class="editor-mode" id="editorMode" hidden>수정 중 · 게시일은 보존됩니다</p>

    <div class="cat-picker">
      <label class="sr-only" for="fCategory">분류</label>
      <select class="field" id="fCategory"></select>
      <button class="btn btn-ghost" type="button" id="btnNewCat">+ 새 분류</button>
    </div>
    <div class="cat-new" id="catNew" hidden>
      <p class="cat-new-hint">폴더명은 <strong>한 번 정하면 바꾸지 않는다.</strong> 영문 소문자·숫자·하이픈만.</p>
      <label class="sr-only" for="fNewCatName">표시 이름</label>
      <input class="field" id="fNewCatName" placeholder="표시 이름">
      <label class="sr-only" for="fNewCatSlug">폴더명 (영문)</label>
      <input class="field" id="fNewCatSlug" placeholder="폴더명 (영문)">
      <button class="btn" type="button" id="btnAddCat">추가</button>
      <button class="btn btn-ghost" type="button" id="btnCancelCat">취소</button>
    </div>

    <!-- v3.3: 라벨이 보인다. 셋 다 .field-group으로 묶는다(고정 스위치는 그대로) -->
    <div class="editor-fields">
      <div class="field-group">
        <label class="field-label" for="fSummary">한 줄 요약</label>
        <input class="field" id="fSummary" placeholder="예: auto-fill과 minmax로 반응형 그리드 만들기">
      </div>
      <div class="field-group">
        <label class="field-label" for="fTags">태그 (쉼표로 구분)</label>
        <input class="field" id="fTags" placeholder="css, layout">
      </div>
      <div class="field-group">
        <label class="field-label" for="fId">파일 id</label>
        <input class="field" id="fId" placeholder="제목에서 자동 생성">
      </div>
      <label class="switch"><input type="checkbox" id="fPinned"><span class="switch-ui"></span>고정</label>
    </div>

    <div class="editor-actions">
      <button class="btn" id="btnPreviewToggle">미리보기</button>
      <button class="btn btn-primary" id="btnExport">파일로 내보내기</button>
    </div>
    <p class="editor-status" id="editorStatus">저장됨</p>
  </div>

  <div class="editor-split" id="editorSplit" data-mode="split">
    <div class="editor-pane">
      <div class="md-toolbar" id="mdToolbar"><button class="md-btn" data-md="bold">…</button></div>
      <textarea class="editor-area" id="fBody"></textarea>
    </div>
    <div class="preview-pane"><div class="prose" id="preview"></div></div>
  </div>
</div>
```

**v3.0에서 바뀐 것**

| 항목 | 변경 |
|---|---|
| `<select class="field" id="fColor">` | **삭제**(§9-2) |
| `<select class="field" id="fNewCatColor">` + 그 `<label>` | **삭제**(§9-2) |
| 에디터 패널의 `box-shadow` | **삭제** — 1px 테두리만 남는다(원칙 3) |
| "+ 새 카테고리" 라벨 | "+ 새 분류" — 화면 어휘를 §4-3의 `분류`와 통일 |

- `.editor-head`의 직계 자식 순서는 **고정**이다:
  `.editor-title` → `.editor-mode` → `.cat-picker` → `.cat-new` → `.editor-fields`
  → `.editor-actions` → `.editor-status`.
  분류는 **글이 저장될 폴더(`posts/<slug>/`)를 정하는 유일한 필드**라 요약·태그보다 앞이다.
  읽는 화면(§4의 분류 → 검색)과 쓰는 화면에서 축의 순서가 뒤집히면 안 된다.
- **`.editor-fields`의 요약·태그·id는 `.field-group`(라벨 + 입력칸) 셋이다(v3.3).** v3.2까지 라벨이
  `.sr-only`라 기존 글을 열면 값이 찬 상자 셋이 이름 없이 놓였다 — "함수가 선언된 위치의 스코프를…" /
  "js, scope, closure" / "2026-09-15-closure" 중 어느 칸이 무엇인지는 값을 읽고 추측해야 했다.
  placeholder는 입력을 시작하면 사라지는 라벨이라 라벨이 아니다. `title` 속성은 뗀다(툴팁은 터치·키보드에서
  안 보인다 — §9-3과 같은 근거). 라벨 문구: `한 줄 요약` / `태그 (쉼표로 구분)` / `파일 id`.
  placeholder는 **예시 값**으로 바꾼다(라벨이 이름을 맡았으니 placeholder는 형식을 보여 준다).
- `.cat-new-hint`는 **입력칸보다 먼저** 온다. slug를 되돌릴 수 없다는 사실은 타이핑 전에 읽혀야 한다.
- `.cat-new`는 `hidden` 속성으로만 토글한다.
- `.editor-split[data-mode]` : `split` / `write` / `preview`. 1024px 미만에서는 세로로 쌓인다.
- **미리보기 `.prose`는 본문과 같은 규칙에 "여백만 압축"한 것이다**(`prose.css`).
  `h1/h2`의 위 여백 `--sp-10` → `--sp-7`, `h3` `--sp-6`,
  `.code-wrap`/`.table-wrap`/`img`의 위아래 `--sp-5`.
  **글자 크기·행간·색은 절대 다르게 두지 않는다** — 미리보기는 "결과와 같은 것"이어야 한다.

---

## 7. 공용 컴포넌트

```
.btn .btn-primary .btn-ghost .btn-danger .icon-btn
.side-toggle                          (헤더의 햄버거 — v3.2, §3)
.side .side-head .side-title .side-pin .side-close .side-tree .side-scrim         (v3.2 — §3-2)
.side-cats .side-cat .side-cat-row .side-cat-name .side-cat-count .side-cat-toggle
.side-posts .side-post .side-empty                                               (ui.js가 그린다)
.side-toc .side-toc-item                                (v3.3 — post.js가 현재 글 아래 끼운다, §5-4)
.post-related .post-related-title                       (v3.3 — §5-8. 안의 카드는 .entry 계열 재사용)
.field-group .field-label                               (v3.3 — 에디터 입력칸 라벨, §6)
.tag
.toast .toast.is-ok .toast.is-warn .toast.is-err
.modal .modal-panel .modal-head .modal-body .modal-foot  (열림: body.modal-open + .modal.is-open)
.sr-only
.search .search-input .search-clear
.index-row .index-label .index-list .index-item .index-name .index-count
.index-fold .index-fold-summary
.list-tools                                             (v3.2 — 툴 행, §4)
.entry-group .entry-group-label .entry-list .entry .entry-cat .entry-title
.entry-meta .entry-date .entry-tags .entry-tag          (.entry-cat은 v3.2 — §4-4)
.list-loading .list-empty
.list-page     (index.html의 <main>에만 붙는다 — §2, §4)
.editor-page   (write.html의 <main>에만 붙는다 — §6)
.back-link .post-nav-item .post-nav-label .post-nav-title
.toc .toc-title .toc-list .toc-item
.cat-picker .cat-new .cat-new-hint
.field .switch .switch-ui .md-toolbar .md-btn .editor-status .editor-mode .editor-visitor
.footer-note .footer-meta
.code-wrap .code-lang .code-copy    (markdown.js가 주입)
.table-wrap                          (markdown.js가 주입)
```

**폐기된 부품** — 코드에 남아 있으면 결함이다.
`.memo*` 전부 / `.chip` `.chips` / `.cat-nav` `.cat-item` `.cat-dot` `.cat-name` `.cat-count` /
`.hero*` `.stat*` / `.toolbar` `.select` / `.board*` `.skeleton` / `.progress` `.progress-bar` /
`.post-body` `.post-read` / `.bg-layer` `.bg-mesh` `.bg-grain` / `.brand-mark` / `.header-actions`

`.sr-only`는 `:focus`와 `:focus-visible` **둘 다**에서 드러난다(스킵 링크는 한 경우라도
새면 실패다). 보이지 않는 `<label>`로도 쓴다 — 입력칸의 이름은 `placeholder`가 아니라
`<label>`이 갖는다(placeholder는 입력을 시작하면 사라진다).

### 7-1. 표

> 요구사항 #5의 "그래프"는 정식 제외됐고 그 자리를 **표**가 대신한다.
> **인라인 SVG는 허용하지 않는다** — 살균 표면을 넓히지 않는다.
> `markdown.js`의 `USE_PROFILES: { html: true }`는 유지한다. 도표는 이미지로 넣는다.

```html
<div class="table-wrap" role="region" aria-label="표" tabindex="0">
  <table>
    <thead><tr><th>이름</th><th align="center">상태</th><th align="right">횟수</th></tr></thead>
    <tbody><tr><td>…</td><td align="center">…</td><td align="right">12</td></tr></tbody>
  </table>
</div>
```

| 속성 | 없으면 |
|---|---|
| `class="table-wrap"` | 표가 페이지를 넘쳐 360px에서 가로 스크롤이 생긴다 |
| `tabindex="0"` | 마우스가 없는 사용자는 넘친 표의 오른쪽 절반을 영영 못 본다 |
| `role="region"` + `aria-label` | 포커스 가능한 익명 div가 되어 "무엇에 들어왔는지" 알리지 못한다 |
| `align` | GFM 정렬 문법이 통째로 무시된다 (아래) |

- `marked@12`는 정렬을 **`align` 속성**으로 낸다. `align`은 표현 힌트라 작성자 CSS의
  `text-align: start` 한 줄에 무조건 진다 → `prose.css`가 `.prose td[align="right"]` 같은
  **속성 선택자로 다시 켠다.** **살균 설정에서 `align`이 제거되면 이 기능이 조용히 죽는다.**
- 숫자 열은 `---:`(끝 정렬) 권장. `.prose table`이 `tabular-nums`를 이미 건다.
- 표가 글줄보다 좁으면 내용만큼만(`fit-content`), 넓으면 **표만** 가로 스크롤.
  스크롤 가능하면 양 끝 덮개가 밀려나며 알린다(JS 0줄).
- **하지 않는 것**: 첫 열 고정(GFM 표에 "행 이름" 개념이 없다), 클릭 정렬
  (상태를 가진 컨트롤이 본문에 섞이면 인쇄·복사·스크린리더가 어긋난다).
- v2.3의 `--h-table-max`(72dvh 세로 스크롤 + thead sticky)는 **폐기했다.**
  긴 표 안에서 세로 스크롤이 생기면 페이지 스크롤과 손가락이 싸운다. 긴 표는 그냥 길게 둔다.

---

## 8. JS가 건드리는 상태 클래스 (CSS는 이것만 받아쓴다)

**토글되는 상태**

`is-active` `is-open` `is-hidden` `is-dirty` `is-loading` `is-pinned` `is-empty`

(`is-open`은 v3.2부터 `.side-cat`에도 쓴다 — 펼쳐진 분류. `is-pinned`는 `.side-post`에도,
`is-empty`는 `.side-cat`에도. 같은 뜻이면 같은 이름이다.)

**생성 시점에 정해져 바뀌지 않는 분류 클래스**

`is-h2` `is-h3` — 목차 항목의 등급(`markdown.js`의 `.toc-item`, **v3.3: `post.js`의 `.side-toc-item`도 같은 클래스**)
`is-prev` `is-next` — 이전/다음 링크(`post.js`)
`is-ok` `is-warn` `is-err` — 토스트 종류(`ui.js`)

**폐기**: `is-stuck`(헤더 static) · `is-visible`(진입 모션 없음 — 토스트/모달은 각자 `is-open`을 쓴다)

> 토스트의 등퇴장은 v3.0에서도 `is-visible`을 쓴다. 위 "폐기"는 **`.memo` 진입용**
> `is-visible`을 말한다. 혼동을 없애기 위해 `.toast`의 표시 상태는 그대로 두되
> `ui.js`의 `reveal()`/IntersectionObserver는 통째로 삭제한다(§12).

`body.modal-open` `body.admin-off` **`body.side-open` `body.side-pinned`**(v3.2, §3-2) 는 body에만 붙는 예외다.
`html[data-side="pinned"]`는 `theme-init.js`가 첫 페인트 전에 붙이는 힌트로, `ui.js` `initSide()`가 body를
동기화한 직후 제거한다. 그 외 상태 클래스가 필요하면 계약서를 먼저 갱신한다.

사이드바 버튼의 상태는 클래스가 아니라 **ARIA 속성**이 곧 상태다 — `.side-toggle[aria-expanded]`,
`.side-pin[aria-pressed]`, `.side-cat-toggle[aria-expanded]`, `.side-post[aria-current="page"]`,
`.side-cat-name[aria-current="true"]`, **`.side-toc-item[aria-current="location"]`(v3.3 — 현재 절, 스크롤
스파이가 옮긴다)**. CSS는 이 속성 선택자로 그린다. 클래스를 따로 붙이지 않는다.
`aria-current`의 값 셋은 뜻이 다르다: `page` = 지금 열린 문서, `true` = 걸린 필터, `location` = 문서 안의 현재 위치.
한 `<nav>` 안에 `page`와 `location`이 동시에 있는 것은 정상이다(글과 그 글 안의 절).

### 8-1. 모션이 JS 타이밍에 거는 제약

| 동작 | JS 타이밍 | CSS가 맞춰 둔 시간 |
|---|---|---|
| 토스트 퇴장 | `is-visible` 제거 후 **400ms** 뒤 DOM 제거 | 260ms (`--dur`) |
| 모달 닫힘 | `is-open` 제거 후 **220ms** 뒤 DOM 제거 | 160ms (`--dur-fast`) |
| 모달 열림 | append → **다음 rAF**에 `is-open` | 420ms (`--dur-slow`) |

이 숫자를 JS에서 줄이면 요소가 사라지는 중간에 잘린다. 늘릴 때는 상관없다.

**`.modal`은 `.is-open`이 없는 동안 `pointer-events: none`이다.** 닫히는 220ms 동안
딤이 화면을 덮은 채 첫 클릭을 삼키기 때문이다("버튼이 한 번 안 먹는 사이트"로 보인다).

### 8-2. `opacity: 0`으로 시작하는 요소 (규칙 유지)

**`opacity: 0`으로 시작하는 요소는 JS가 만든 요소여야 한다.**
정적 마크업에 붙이면 **"JS가 성공했을 때만 보이는 정적 콘텐츠"** 가 되어
로드 실패 화면에서 영구 불가시가 된다.
v3.0에는 해당 요소가 `.toast`와 `.modal` 둘뿐이고 **둘 다 JS가 만든다.**
(v2.2가 `[data-reveal]`을, v3.0이 `.memo` 진입 모션을 같은 이유로 걷어냈다.)

---

## 9. 데이터 계약

### 9-1. `posts/index.json`

```json
{
  "site": { "title": "…", "subtitle": "…" },
  "posts": [
    { "id":"2026-09-13-css-grid", "title":"…", "summary":"…",
      "created":"2026-09-13T14:20:00+09:00", "updated":"2026-09-13T14:20:00+09:00",
      "tags":["css"], "category":"css", "pinned":false }
  ]
}
```
`posts/<category>/<id>.md` 최상단에 동일한 필드의 YAML frontmatter.

- **`created`는 필수다.** §4-4의 날짜 열과 연도 그룹이 이 값에 의존한다.
  없으면 그 글은 목록에 자리를 못 잡는다 → `store.js`가 비면 `updated`로, 그것도 없으면
  `id` 앞머리(`YYYY-MM-DD`)로 폴백한다.
- `summary`는 **목록에 나오지 않지만** 상세 머리말과 **검색 대상**으로 살아 있다.
- `pinned`는 유지한다. 고정 글은 연도 그룹보다 **위**에 온다(별도 그룹 없이 목록 맨 앞).

### 9-2. `color` 필드 — **폐기**

**결정: 글의 `color`, 카테고리의 `color`, 메모지 6색 토큰 24개를 전부 없앤다.**

- 6색은 **보드 위의 종이를 구분하려고** 존재했다. 카드가 사라지면 색이 놓일 면이 없다.
- 남은 자리는 텍스트 행뿐인데, 여기에 색을 넣으면 **목록이 6가지 색의 글자 줄**이 된다.
  이 목록의 스캔은 제목 열을 따라 아래로 내려가는 동작인데, 색이 다르면 눈이 좌우로 튄다.
  **읽기를 돕지 않고 방해하는 색**이다.
- 원칙 1-2("개성은 색 하나")와 정면으로 충돌한다. 실측 7곳 중 글마다 색을 주는 곳은 0곳이다.
- 대안으로 검토했던 "분류 옆 작은 색 점"(v2.x의 `.cat-dot`)도 **함께 폐기**한다.
  인덱스가 인라인 텍스트가 되면서 점 하나가 글자 사이에 끼는 꼴이 되고,
  색 6개가 분류 40개를 구분하지도 못한다(같은 색이 7번씩 돈다).
- **마이그레이션 불필요.** 기존 `.md` frontmatter와 `index.json`에 `color` 키가 남아 있어도
  파서가 읽지 않으면 그만이다. 지울 필요 없다.

지워야 하는 것은 §12 표에 파일·줄로 정리돼 있다.

### 9-3. `posts/categories.json`

```json
{
  "categories": [
    { "slug": "css", "name": "CSS", "description": "스타일과 레이아웃", "order": 0 }
  ]
}
```
- `slug`: 폴더명. 영문 소문자·숫자·하이픈만. **한 번 정하면 바꾸지 않는다.**
- `color`: **폐기**(§9-2).
- `order`: 인덱스 정렬 순서(§4-3).
- `description`: **더 이상 `title` 속성으로 붙이지 않는다.** v2.x는 `.cat-item[title]`로
  툴팁을 띄웠는데, 인라인 텍스트 인덱스에서 글자 하나하나가 툴팁을 갖는 것은 소음이고
  터치·키보드에서는 어차피 보이지 않았다. `description`은 데이터로만 남는다
  (훗날 `categories.html`을 만들면 거기서 화면에 내놓는다).
- 글 파일 경로는 항상 `posts/<category>/<id>.md`. 슬러그가 없으면 `_uncategorized` 폴백.

---

## 10. 푸터

```html
<footer class="site-footer">
  <p class="footer-note">&copy; 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다</p>
  <p class="footer-meta"><span data-site-title>메모 블로그</span> · <span data-year>2026</span></p>
</footer>
```
문구는 **요구사항 #16 그대로 유지**한다. 세 페이지 동일.
v2.x의 `.footer-note::before`(액센트 그라디언트 바)는 **삭제**한다 — 히어로의 바와
짝을 이루던 장식인데 짝이 사라졌다. 푸터는 본문과 1px 실선으로만 나뉜다.
**가운데 정렬이 아니라 왼쪽 정렬**이다 — 이 페이지의 모든 왼쪽 선이 한 줄이어야 한다.

---

## 11. CSS 파일 지도 (v3.0)

**`css/animations.css`는 삭제됐다.** 로드 순서는 **5개**다.

```
tokens → base → layout → components → prose
```

> **개발자가 반드시 할 일**: `index.html` `post.html` `write.html` 세 파일에서
> `<link rel="stylesheet" href="css/animations.css">` 줄을 **삭제**한다.
> 지우지 않으면 404가 난다. (§12 표 참조)

| 파일 | 책임 | 여기에 쓰면 안 되는 것 |
|---|---|---|
| `tokens.css` | 값의 단일 출처 | 선택자 규칙 |
| `base.css` | 리셋, 루트 타이포, 폼 기본, 포커스 링, **`prefers-reduced-motion` 전역 블록** | 컴포넌트 이름 |
| `layout.css` | 화면 골격(헤더/**사이드바·스크림**/메인/푸터/목록 그리드/글/에디터) | 재사용 부품의 생김새 |
| `components.css` | 재사용 부품의 생김새 **+ 그 부품의 transition** | 골격 배치 |
| `prose.css` | 마크다운 결과물(`.prose` 안) | 클래스 기반 규칙 |

**v2.x의 "정지/모션 분업" 규칙은 폐기됐다.** `animations.css`가 없어졌으므로
`transform` / `translate` / `rotate` / `scale`을 나눠 쓸 이유도 없다.
**transition은 그 부품을 정의한 파일에 함께 둔다.**
남아 있는 transition은 다음이 전부다 — 이 목록 밖의 모션을 추가하려면 계약서를 먼저 고친다.

| 대상 | 무엇이 | 시간 |
|---|---|---|
| **모든 요소 (`*`, `::before`, `::after`) — 테마 크로스페이드 (v3.1)** | `background-color` / `border-color` / `color` | `--dur-theme` + `--ease-fade` |
| 링크·버튼·인덱스 항목 | `color` / `background-color` / `border-color` / `text-decoration-color` | `--dur-fast` |
| 목록 박스 `.entry` | `border-color`(hover) + `background-color`(테마) | hover `--dur-fast` / 테마 `--dur-theme` |
| 인풋 포커스 | `border-color` / `box-shadow` (+ `background-color` / `color`는 테마 시간) | `--dur-fast` |
| 토스트 | `opacity` / `transform` | `--dur` |
| 모달 | `opacity` / `transform` | 열림 `--dur-slow` / 닫힘 `--dur-fast` |
| 목차 접기 화살표(`summary::before`) | `rotate` | `--dur` |
| **사이드바 `.side` (v3.2)** | `translate`(슬라이드) + `visibility`(닫힐 때만 `--dur` 지연) + `box-shadow`(도킹 전환) | 슬라이드 `--dur` + `--ease` |
| **스크림 `.side-scrim` (v3.2)** | `opacity` + `visibility` | 등장 `--dur-fast`, 퇴장 `--dur`(패널과 함께 사라진다) |
| **도킹 시 본문 밀기 `body` (v3.2)** | `padding-inline-start` | `--dur` + `--ease`. 첫 페인트(`html[data-side]`)에는 이전 값이 없어 걸리지 않는다 |
| 사이드바 안의 핀·쉐브론 | `rotate` / `translate` | `--dur-fast` |
| **`.side-toc-item` (v3.3)** | `color` / `background-color` — `.side-post`와 같다. 현재 절이 옮겨 갈 때 색이 건너간다(위치·크기 모션 없음) | `--dur-fast` |

**테마 크로스페이드의 작동 방식 (v3.1, JS 0줄)** — 사용자 요청 *"다크·라이트 바꾸는 속도
살짝만 줄여서 자연스럽게"*.

- `base.css`의 `*` 규칙이 세 색 속성에 `--dur-theme`(240ms) 전환을 건다. 테마 토글은
  `:root[data-theme]`의 **토큰 값**만 바꾸므로, 토큰을 참조하는 모든 요소가 같은 시간에 건너간다.
- **첫 페인트에는 걸리지 않는다.** `theme-init.js`가 `<link>`보다 앞에서 동기로 `data-theme`을
  정하므로 첫 계산 스타일이 이미 최종 테마다 — transition은 "이전 값"이 있어야 시작되는데
  그 값이 없다. `ui.js`의 `initTheme()`은 같은 값을 다시 쓸 뿐이라 변화가 아니다.
  그래서 `ui.js`에 클래스를 붙였다 떼는 협조가 **필요 없다.**
- 부품별 `transition` 선언은 `*` 규칙을 **통째로 덮는다**(shorthand). 그래서 hover 전환을 가진
  부품이 면·경계선 색을 함께 전환하지 않으면 테마 토글 때 **그 부품만 즉시 튄다.**
  면을 가진 부품(`.search-input` `.field` `.entry`)은 자기 선언에 `background-color`를
  `--dur-theme`로 넣어 두었다. **면·경계선을 가진 부품에 hover transition을 새로 달 때는
  이 두 속성을 반드시 같이 적는다.** 색만 바뀌는 부품(`.nav-link` 등)은 `--dur-fast`로
  80ms 먼저 끝나도 눈에 띄지 않아 그대로 둔다.
- `transition: all`은 금지다. 세 속성만 명시한다 — `all`이면 `display`·`opacity`를 쓰는
  상태 토글(`[hidden]`, `.post.is-loading`)까지 240ms를 끌고 간다.
- `prefers-reduced-motion: reduce`에서는 아래 블록이 1ms로 자른다. 즉시 전환이다.

`base.css` 끝의 `@media (prefers-reduced-motion: reduce)` 블록이 `*` 선택자 + `!important`로
전부를 1ms로 자르고 `scroll-behavior`를 끈다. **새 transition을 추가하면 그 블록도 함께 점검한다.**

> **함정 (v3.0에서 실제로 밟았다)**: 그 블록에 `.toast { opacity: 1 }` 같은
> **컴포넌트별 보정을 쓰면 죽은 규칙이 된다.** v2.x에서는 이 블록이 마지막 파일
> (`animations.css`)에 있어 먹혔지만, `base.css`는 `components.css`보다 **먼저** 로드된다
> — 같은 특이도면 뒤에 오는 `components.css`의 `.toast { opacity: 0 }`가 이긴다.
> 컴포넌트별 모션 보정이 필요하면 **그 컴포넌트를 정의한 파일 안에** 블록을 따로 연다.

### 11-1. 같은 부품을 두 파일에 나눠 쓰지 않는다

`layout.css`와 `components.css`의 경계는 "골격 vs 부품"이다.
한 부품의 규칙이 두 파일에 흩어지면 로드 순서에 따라 뒤 파일이 앞의 값을 조용히 이긴다.

| 선택자 | 사는 곳 |
|---|---|
| `.site-header` `.site-main` `.site-footer` `.page-head` | `layout.css` |
| `.post-list` `.entry-group` `.entry-list` `.entry`(박스·hover 경계선) `.entry-meta` `.entry-tags`의 **배치** | `layout.css` |
| `.entry-title`(+ `::after` 늘린 링크) `.entry-date` `.entry-tag`의 **생김새** | `components.css` |
| `.post-nav`의 **그리드와 768px 열 전환** | `layout.css` |
| `.post-nav-item` `.post-nav-label` `.post-nav-title` `.back-link` | `components.css` |
| `.index-row`의 **줄 배치** | `layout.css` |
| `.index-label` `.index-item` `.index-count` `.index-fold*` | `components.css` |
| `.toc` 계열 전부 | `components.css` (2열 트랙이 사라져 골격과 무관해졌다) |
| **`.side`의 위치·슬라이드·도킹·`.side-scrim`·`body` 밀기·`.side-head`/`.side-tree`의 flex 골격** (v3.2) | `layout.css` §0 |
| **`.side-title` `.side-pin` `.side-close` `.side-cat*` `.side-posts` `.side-post` `.side-empty`의 생김새 + `.side-toggle` 아이콘** | `components.css` §15 (햄버거는 §5 테마 아이콘 옆) |
| **`.list-page` `.list-tools`의 배치, `.entry-list` 그리드, `.entry-meta`의 바닥 정렬** | `layout.css` |
| **`.entry-cat`의 생김새** | `components.css` §4 |
| **`.post-related`의 여백·경계선·그리드 열(13rem)** (v3.3) | `layout.css` §7 |
| **`.post-related-title` + `.post-related .entry-title` 크기 보정** (v3.3) | `components.css` §7 |
| **`.side-toc` `.side-toc-item`** (v3.3) | `components.css` §15 (사이드바 부품 옆) |
| **`.field-group` `.field-label`** (v3.3) | `components.css` §11 (`.editor-fields`의 `align-items`만 `layout.css`) |

### 11-2. 리터럴 금지의 범위

| 값 | 리터럴 허용? | 이유 |
|---|---|---|
| 색·그림자·간격·폰트·반경·이징·지속시간 | **금지** | 전부 `tokens.css`에 있다 |
| **누를 수 있는 것의 최소 크기** | **금지** | `--h-control`(40/44) `--h-control-sm`(32/44) `--h-nav`(36/44) `--h-control-xs`(30/40). **이 넷만 `pointer:coarse`에서 자동 상승한다** — 리터럴로 쓰면 그 상승을 놓친다 |
| 포커스·상태 글로우의 링 두께 | **금지** | `--ring-w` |
| 누를 수 없는 라벨의 치수(`.tag` 24px 등) | 허용 | 터치 타깃 판정 대상이 아니다 |
| 한 부품 안에서만 의미를 갖는 도형 치수(돋보기 11px, 표 가장자리 그림자 22px 등) | 허용 | 토큰화해도 재사용처가 없다 |

판별법: **"이 숫자가 다른 곳에서도 같아야 하는가?"** 그렇다면 토큰이다.
그리고 **"손가락이 이걸 누르는가?"** 그렇다면 높이 토큰이다.

**높이 토큰 사용처 (이 표가 곧 검증 목록이다)**

| 토큰 | coarse | 사용처 |
|---|---|---|
| `--h-control` | 40 → 44 | `.btn` `.icon-btn` `.search-input` `.field` `.switch` `.sr-only:focus` — **`.entry-title`은 v3.1에서 빠졌다.** 목록의 터치 타깃은 박스 전체(`.entry-title::after`, §4-4)이고 박스 높이는 패딩만으로 44px을 넘는다 |
| `--h-control-sm` | 32 → 44 | `.index-item` `.index-fold-summary` `a.post-cat` `.post-tags .tag` `.md-btn` `.code-copy` `.prose summary` `.toc-item` **+ v3.2: `.search-input` `.side-cat-name` `.side-cat-toggle` `.side-post`** **+ v3.3: `.side-toc-item`** |
| `--h-nav` | 36 → 44 | `.nav-link` `.brand` `.back-link` |
| `--h-control-xs` | **24 → 36**(v3.2) | `.search-clear` (하나뿐 — 인풋 안에 들어앉는 원판은 인풋보다 한 단계 작아야 "입력칸"으로 보인다) |

`.search-input`이 `--h-control`에서 빠져 `--h-control-sm`으로 내려갔다(v3.2, §4-3). `.icon-btn`(햄버거·핀·닫기·테마)은 `--h-control` 그대로.

**높이 상승은 `tokens.css`의 `@media (pointer: coarse)` 한 곳에서만 한다.**
다른 파일에서 다시 올리지 않는다(같은 규칙이 두 곳에 있으면 한쪽만 고쳐진다).

### 11-3. 반응형 분기점

미디어쿼리는 **아래 넷만** 쓴다. 크기 변화는 `clamp()`가, 배치 전환만 미디어쿼리가 맡는다.

| 분기 | 방향 | 무엇이 바뀌는가 |
|---|---|---|
| 360px | (기준선) | 여기서 가로 스크롤이 생기면 실패다. 분기 자체는 없다 |
| 440px | `max-width` | 본문 코드·인용·표·목록의 좌우 패딩 압축 / `.entry` 카드 패딩 `--sp-5` → `--sp-4` / **v3.3: `.prose` `.post-summary`의 `word-break: keep-all` → `normal`**(360px에서 한 줄 17자인데 어절 보존이 줄마다 3~6자를 비웠다 — 본문·요약만, 제목·카드·사이드바는 그대로 keep-all) |
| 768px | `max-width` | **`.list-tools` 세로 스택**(DOM 순서: 분류 → 검색, v3.2) |
| 768px | `min-width` | `.post-nav` 1열 → 2열, 토스트가 오른쪽 아래로 |
| 1024px | `min-width` | 에디터 split 2열, **사이드바 도킹**(`body.side-open.side-pinned` / `html[data-side="pinned"]` → 본문 `padding-inline-start: --w-side`, 그림자·스크림·스크롤 잠금 해제) |

**카드 그리드의 열 수에는 분기가 없다** — `repeat(auto-fill, minmax(17rem, 1fr))`이 폭에 따라 3/2/1열을
정한다(§4-4). 1440px 분기는 여전히 없다. 목록 페이지가 `--w-page`(1152px)에서 멈추므로 1440에서
바뀔 것이 없고, 도킹되면 1440 − 260 = 1180 안에 1152가 그대로 들어간다.

---

## 12. 개발자 작업 지시 (v2.3 → v3.0 이행)

CSS는 **web-designer가 이미 v3.0으로 교체했다.** 아래는 HTML/JS 쪽 할 일이다.
줄번호는 v3.0 개정 시점 기준이므로, **줄번호보다 선택자·함수 이름을 기준으로** 찾을 것.

### 12-1. 세 HTML 공통 (frontend-dev / frontend-dev-2)

| # | 할 일 | 위치 |
|---|---|---|
| 1 | **`<link rel="stylesheet" href="css/animations.css">` 삭제** — 안 지우면 404 | `index.html:36` `post.html:37` `write.html`의 같은 줄 |
| 2 | `<div class="bg-layer">` … `</div>` 3줄 삭제 | `index.html:56-59` `post.html:67-70` `write.html`의 같은 블록 |
| 3 | 헤더에서 `id="siteHeader"` 제거, `.brand-mark` `<span>` 삭제, `.header-actions` `<div>` 통째 삭제하고 `#themeToggle` 버튼만 `.site-header` 직계로 남김 | `index.html:61-75` `post.html:77-91` `write.html` 동일 |
| 4 | `.nav-link` 텍스트 "메모" → **"글"** | 세 파일 |

### 12-2. index.html (frontend-dev)

| # | 할 일 | 위치 |
|---|---|---|
| 5 | `<section class="hero">` 통째 삭제 → §4의 `.page-head` 2줄로 교체 | `index.html:80-97` |
| 6 | `<nav class="cat-nav" id="catNav">` → §4의 `.index-row` + `#catIndex` 구조 | `index.html:102-106` |
| 7 | `<section class="toolbar">` 삭제 → `.search` div만 `<main>` 직계로, `#sortSelect` **삭제**, `.chips` → `<details class="index-fold">` + `#tagIndex` | `index.html:110-126` |
| 8 | `<section class="board" id="board">` → `<div class="post-list" id="postList">` | `index.html:137` |
| 9 | `#boardEmpty` → `#listEmpty`(+`.list-empty`), `#boardSkeleton` 6장 → `<p class="list-loading" id="listLoading">` 한 줄 | `index.html:139-151` |
| 10 | `<noscript>`의 `#boardSkeleton` 숨김 스타일을 `#listLoading`으로 | `index.html:130` |

### 12-3. post.html (frontend-dev)

| # | 할 일 | 위치 |
|---|---|---|
| 11 | `<div class="progress">` 통째 삭제 | `post.html:72-75` |
| 12 | `.back-link`를 `.post-head` 밖 → `<main>` 직계 첫 자식으로 이동 | `post.html:99` |
| 13 | `#postEdit` 버튼을 `.post-head` → 새 `<footer class="post-foot">`로 이동 | `post.html:100` |
| 14 | `#postCat`을 제목 **위** → `.post-meta` 안(태그와 같은 줄)으로 이동 | `post.html:104` |
| 15 | `.post-meta`를 `.post-dates`(날짜 2개)와 `.post-meta`(분류+태그)로 **분리**. `#postRead` **삭제** | `post.html:108-114` |
| 16 | `<div class="post-body">` 래퍼 삭제 — `#toc`와 `.prose`가 `.post`의 직계 자식이 된다 | `post.html:117-125` |

### 12-4. JS (frontend-dev)

| # | 파일 | 할 일 |
|---|---|---|
| 17 | `app.js` | `rotationOf()`(87-92) · `memoCard()`(123-178) 삭제 → §4-4의 `.entry` 렌더러로 교체(연도 그룹 포함) |
| 18 | `app.js` | `revealVisible()`(222-224)와 그 호출(193·213) 삭제. `Blog.ui.reveal` 의존 제거 |
| 19 | `app.js` | `Blog.ui.countUp(dom.stats)`(510)와 `dom.stat*`(560-563) 삭제 |
| 20 | `app.js` | `dom.skeleton`(554) · `U.setHidden(dom.skeleton…)`(541·579) → `#listLoading`으로 교체 |
| 21 | `app.js` | `catButton()`(277-296)에서 `data-color`(282)·`.cat-dot`·`.cat-name` 제거 → `.index-item` + `.index-count` |
| 21-1 | `app.js` | 분류가 하나도 없으면 `#catRow`에 `hidden` 부착(§4-3). 태그가 하나도 없으면 `#tagFold` 자체를 렌더하지 않는다 |
| 22 | `app.js` | 태그 칩 렌더러(327-365) → `.index-item` + `.index-count`. **`?tags=`가 있으면 `<details>`에 `open` 부착**(§4-3) |
| 22-1 | `app.js` | 인덱스 항목의 이름은 **`<span class="index-name">`** 안에 넣는다. 태그의 `#` 접두사와 `·` 구분자는 **CSS가 그리므로 텍스트로 넣지 않는다**(§4-3) |
| 23 | `app.js` | `SORTS` / `#sortSelect` 관련 전부 삭제(180·373-394·456-460). 정렬은 `created` 내림차순 고정 |
| 24 | `post.js` | `syncProgress()`(161-168) · `dom.progress`(280) · rAF 스크롤 등록(264) 삭제 |
| 25 | `post.js` | `syncToc()`(149-159) · `tocItems`(12) · `.toc-item.is-active` 부착 삭제. `buildToc()`는 남기되 **조건을 "h2 3개 이상"으로** |
| 26 | `post.js` | `dom.read`(286) · 읽는 시간 계산 삭제. `DRIFT_FIELDS`(207)에서 `'color'` 제거 |
| 27 | `post.js` | 날짜 렌더를 `.post-dates`로. **`updated`가 `created`와 같은 날이면 `#postUpdated`에 `hidden`**(§5-2) |
| 28 | `store.js` | `normalizeColor()`(242-246) · `COLOR_VALUES`(225) · `META_KEYS`의 `'color'`(248) · `color:` 필드(284·328·353·772·795) · `categoryColor()`(437-439·822) 삭제 |
| 29 | `config.js` | `colors[]`(36-43) · `memoRotation`(52) · `category.fallbackColor`(32) · `editor.defaultColor`(81) · `read`(46) 삭제 |
| 30 | `markdown.js` | `buildToc()`(281-291)에서 `is-active` 부착만 제거(등급 `is-h2`/`is-h3`는 유지). 제목 `id` 생성은 **유지** |

### 12-5. JS (frontend-dev-2)

| # | 파일 | 할 일 |
|---|---|---|
| 31 | `ui.js` | `initHeader()`(68-76) 통째 삭제 — 헤더가 static이라 `.is-stuck`이 없다 |
| 32 | `ui.js` | `observer` / `ensureObserver()` / `reveal()`(87-110) 삭제 + export(317) 삭제 |
| 33 | `ui.js` | `countUp()`(114-130) 삭제 + export(318) 삭제 |
| 34 | `editor.js` | `#fColor` 관련 전부 삭제: `COLOR_VALUES`(86) `isColor()`(88-91) `colorFor()`(93-96) `fillColorOptions()`(1335-1341) `fillNewCatColors()`(246-253) `dom.color`(1771) `dom.newCatColor`(1789) 및 호출(1794-1795·1701), `FORM_TEXT_KEYS`의 `'color'`(1375), 내보내기 메타의 `color`(337·1126·312·1013·106·349) |
| 35 | `write.html` | `<select id="fColor">`와 `<select id="fNewCatColor">`+`<label>` 삭제, 에디터 패널 그림자 제거는 CSS가 처리(마크업 변경 없음) |
| 36 | `write.html` | "+ 새 카테고리" → "+ 새 분류" |
| 36-1 | `write.html` | `<main>`에 **`.editor-page` 클래스 추가** → `<main class="site-main editor-page" id="main" tabindex="-1">`. 안 붙이면 분할 편집기가 720px 안에 갇힌다(§6) |

### 12-6. posts/ (frontend-dev)

| # | 할 일 |
|---|---|
| 37 | 샘플 글·카테고리 비우기 — `posts/index.json`의 `posts: []`, `posts/categories.json`의 `categories: []`, 샘플 `.md` 삭제 |
| 38 | `index.json`의 `site.subtitle`을 한 줄로(§4-2). 기존 "메모지처럼 붙여두는 곳"은 폐기된 메타포다 |

### 12-7. v3.1 이행 — 목록 박스 (frontend-dev, `app.js` 한 함수)

CSS는 web-designer가 이미 v3.1로 교체했다. **JS에서 바뀌는 것은 `app.js`의 `entryRow()` 하나**다.
`ui.js`(frontend-dev-2)는 할 일이 **없다** — 테마 크로스페이드는 CSS만으로 동작한다(§11).

| # | 파일 | 할 일 |
|---|---|---|
| 39 | `app.js` `entryRow()` (현재 85-110줄) | 자식 순서를 **`.entry-title` → `.entry-meta`** 로 바꾼다. 날짜가 비었을 때 넣던 빈 `<span class="entry-date">`는 **삭제**(열이 없으니 자리를 지킬 이유가 없다). `.entry-meta` 안에 `<time class="entry-date">`(있을 때만)와 `<ul class="entry-tags" aria-label="태그">`(태그가 1개 이상일 때만) — `<li class="entry-tag">`는 **텍스트만, 링크 아님**. 날짜도 태그도 없으면 `.entry-meta` 자체를 넣지 않는다 |
| 40 | `app.js` 주석 84줄 | "한 행의 내용물은 날짜와 제목 둘뿐" → 박스 규칙(§4-4)으로 문구 갱신 |

참고 구현(계약 그대로 옮긴 것이다 — `U.el`의 시그니처는 기존과 같다):

```js
function entryRow(post) {
  var li = U.el('li', { class: 'entry' + (post.pinned ? ' is-pinned' : '') });
  li.appendChild(U.el('a', {
    class: 'entry-title',
    href: 'post.html?id=' + encodeURIComponent(post.id),
    text: post.title
  }));
  var meta = U.el('div', { class: 'entry-meta' });
  if (post.created) {
    meta.appendChild(U.el('time', { class: 'entry-date', datetime: post.created, text: U.fmtDot(post.created) }));
  }
  if (post.tags && post.tags.length) {
    var ul = U.el('ul', { class: 'entry-tags', 'aria-label': '태그' });
    post.tags.forEach(function (tag) { ul.appendChild(U.el('li', { class: 'entry-tag', text: tag })); });
    meta.appendChild(ul);
  }
  if (meta.childNodes.length) li.appendChild(meta);
  return li;
}
```

**바꾸지 않는 것**: `entryGroup()` · `groupByYear()` · `renderList()` · `.is-pinned`/`.is-hidden` 부착 ·
`indexItem()`(§4-3의 `#`은 원래 CSS가 그렸으므로 JS는 그대로) · `post.js`의 `.tag` 렌더
(`#`도 원래 CSS `::before`였다).

### 12-8. v3.2 이행 — 사이드바·카드 그리드 (세 사람)

CSS는 web-designer가 v3.2로 교체했다. 사양서(PM 배포)와 이 계약서가 다르면 **계약서가 이긴다** —
다른 점은 딱 하나, 768px 이하 툴 행의 스택 순서(§4: DOM 순서 그대로, "검색 위" 아님).

| # | 파일 | 할 일 |
|---|---|---|
| 41 | 세 HTML | 헤더 첫 자식 `.icon-btn.side-toggle#sideToggle`, `<header>` 뒤에 `.side` + `.side-scrim` (§3, §3-2 마크업 그대로) |
| 42 | `index.html` | `<main class="site-main list-page">`, `.list-tools`로 `#catRow`와 `.search`를 감싼다(순서: 분류 → 검색). `#tagFold`는 툴 행 **밖** |
| 43 | `app.js` `entryRow()` | `.entry-cat` → `.entry-title` → `.entry-meta`. 분류명은 `categories.json`의 `name`(없으면 slug), `_uncategorized`면 요소 생략 |
| 44 | `app.js` / `post.js` / `editor.js` | 로드 후 `Blog.ui.renderSide({posts, cats, activeId, activeCat})` (§3-2 API) |
| 45 | `ui.js` | `initSide()` `renderSide()` — 상태 클래스·ARIA·저장(`blogSide`)·포커스·Esc. **body 동기화 직후 `html[data-side]` 제거.** 스크림 `hidden`은 `initSide()`에서 한 번 떼고 그 뒤는 CSS에 맡기는 쪽을 권장 |
| 46 | `theme-init.js` (frontend-dev-2, PM 판정) | `blogSide` 읽어 `pinned && innerWidth ≥ 1024`면 `document.documentElement.dataset.side = 'pinned'` |
| 47 | `config.js` | `storageKeys.side = 'blogSide'` |

### 12-9. v3.3 이행 — 연관 글 · 스크롤 스파이 · 에디터 라벨

CSS는 web-designer가 v3.3으로 교체했다. **`ui.js`는 손대지 않는다** — `renderSide()` API 그대로.

| # | 파일 | 담당 | 할 일 |
|---|---|---|---|
| 48 | `post.html` | frontend-dev | `.post-foot` 뒤·`.post-nav` 앞에 §5의 `<section class="post-related" id="postRelated" … hidden>` 골격(소제목 + 빈 `<ul class="entry-list" id="postRelatedList">`). 그 밖의 마크업 변경 없음 |
| 49 | `post.js` `renderRelated(meta)` | frontend-dev | §5-8 점수 규칙 그대로. `render()`에서 `renderNav()` 옆에서 호출. 카드는 `.entry-cat → .entry-title → .entry-meta(.entry-date + 겹치는 태그만 .entry-tags)`. 0개면 `hidden` 유지, 있으면 `hidden` 제거 |
| 50 | `util.js` (권장) | frontend-dev | `entryRow()`의 카드 빌더를 `U.entryCard(post, { tags })`로 옮겨 `app.js`·`post.js`가 공유. 마크업 출처가 둘이면 한쪽만 고쳐진다 |
| 51 | `post.js` `mountSideToc(headings)` | frontend-dev | §5-4 마크업. `render()`의 `result.headings`와 `renderSide()` Promise가 **둘 다** 끝난 뒤 한 번. h2 < 3이면 아무것도 안 한다. `.side-post[aria-current="page"]` 다음 형제로 `ol.side-toc#sideToc` |
| 52 | `post.js` `initSpy(headings, items)` | frontend-dev | §5-4의 "JS가 할 일" 문단 그대로 — IO(`rootMargin '0px 0px -60% 0px'`, threshold 0) + `hashchange`. 판정: `top ≤ innerHeight × 0.4`인 마지막 제목. `aria-current="location"` 이동, `.side-tree.scrollTop` 보정. **스크롤 핸들러·rAF 금지.** 파일 머리 주석 "이 파일에 스크롤 핸들러는 없다"는 그대로 참이어야 한다 |
| 53 | `write.html` | frontend-dev-2 | `.editor-fields`의 요약·태그·id 셋을 `.field-group > label.field-label + input.field`로. `label`의 `sr-only` 제거, `title` 속성 제거, placeholder를 예시 값으로(§6). `editor.js` 변경 없음(id 그대로) |

참고 구현(계약 그대로 옮긴 것이다 — 점수·정렬·3개 자르기):

```js
function relatedTo(meta, posts) {
  var mySlug = store.categorySlug(meta.category);
  var myTags = meta.tags.map(function (t) { return t.trim().toLowerCase(); });
  return posts
    .filter(function (p) { return p.id !== meta.id; })
    .map(function (p) {
      var shared = p.tags.filter(function (t) { return myTags.indexOf(t.trim().toLowerCase()) !== -1; });
      var score = shared.length * 2 + (store.categorySlug(p.category) === mySlug ? 1 : 0);
      return { post: p, shared: shared, score: score };
    })
    .filter(function (r) { return r.score > 0; })
    .sort(function (a, b) {
      return b.score - a.score || String(b.post.created).localeCompare(String(a.post.created));
    })
    .slice(0, 3);
}
```

---

## 13. 변경 이력

### v3.3 (라운드 8) — 연관 글, 사이드바 목차 스크롤 스파이, 읽기 편의

사용자 요청 원문: *"연관 글 자동 추천 — 같은 태그·같은 분류 글을 상세 하단에 3개 표시"* /
*"목차 진행바 — 긴 글 읽을 때 현재 절을 목차에 표시(스크롤 스파이)"* /
*"전체적으로 읽기 편하도록 편의성과 가독성 측면의 개선할 부분 개선해"*.

| 절 | v3.2 | v3.3 |
|---|---|---|
| §3-2 | 트리 = 분류 → 글 | 트리 = 분류 → 글 → **절**(`ol.side-toc`, 현재 글 아래만, post.js가 끼움) |
| §5 | `.post-foot` → `.post-nav` | `.post-foot` → **`.post-related`** → `.post-nav` |
| §5-4 | 인라인 목차만, 스파이 폐기 | 인라인 목차 유지 + **사이드바 목차에 현재 절**(`aria-current="location"`, IO 하나). 후보 A/B/C 비교와 C의 한계 명시. `.toc-item.is-h3` 크기 `--fs-xs` → `--fs-sm` |
| §5-7 | — | `.code-wrap > pre` 32px 마진 결함 기록(CSS 수정) |
| §5-8 | 없음 | **신설** — 연관 글 구조·카드 재사용 근거·점수 규칙(태그 +2 / 분류 +1 / 동점 최신순 / 0점 제외 / 최대 3 / 0개면 hidden) |
| §6 | 요약·태그·id 라벨 `sr-only` | **`.field-group` + `.field-label` 보이는 라벨**, placeholder는 예시 값 |
| §7 §8 | — | `.side-toc*` `.post-related*` `.field-*` 등록. `is-h2/is-h3`가 `.side-toc-item`에도. `aria-current="location"` |
| §11 | — | `.side-toc-item` 색 전환 1행. 11-1 분담 4행. 11-2 `.side-toc-item`. 11-3 440px에 `word-break` |
| §12 | §12-8까지 | **§12-9 신설** — #48-53 + 점수 참고 구현 |

**같은 라운드에 web-designer가 수행한 CSS 변경 — 읽기 편의 항목은 "무엇이 불편했고 → 어떻게 고쳤나"**

- `prose.css`
  - 코드블록: 머리띠와 첫 줄 사이 52px 빈 띠(`.prose pre`의 `margin-block` 32px이 `.code-wrap > pre`에 새어 들어옴 — 같은 특이도, 뒤 규칙 승) → `.prose .code-wrap > pre { margin: 0 }`로 순서·특이도 정리. 세로 패딩 `--sp-5` → `--sp-4`
  - 인라인 코드가 줄 끝에서 `coun / t`, `ReferenceEr / ror`로 잘림(`word-break: break-all`) → `normal` + `overflow-wrap: anywhere`. 들어가는 토큰은 통째로 다음 줄, 못 들어가는 긴 토큰만 잘린다
  - 440px 이하 `.prose` `word-break: normal` — 360px에서 어절 보존이 줄마다 3~6자를 비워 첫 문단 7줄 중 4줄이 60% 아래로 찼다 → 음절 단위 줄바꿈으로 줄이 찬다
  - 440px 분기의 코드 패딩 선택자를 새 특이도에 맞춤(`.prose .code-wrap > pre`)
- `components.css`
  - 인덱스 항목 사이 `·`와 날짜 줄 `·`가 다크에서 안 보임(`--c-border` #3d392d ↔ 바탕 1.4:1) → `--c-text-mute`. 구분자는 "여기서 끊긴다"는 정보다
  - 인라인 목차 h3 항목 12px(`--fs-xs`)이 목차에서 가장 읽기 힘든 글자 → h2와 같은 `--fs-sm`, 등급은 들여쓰기 + mute 색
  - 사이드바 두 줄 말줄임 제목 아래로 세 번째 줄 머리 4px이 새어 나옴(`overflow: hidden`이 패딩 상자에서 자름) → `.side-post` 아래 패딩 0 + 아래 마진 4
  - 신설: `.side-toc` `.side-toc-item`(현재 절 = 액센트 + 굵기 + 2px 선, border라 overflow에 안 잘림) / `.post-related-title` + 카드 제목 `--fs-md` / `.field-group` `.field-label`
- `layout.css`
  - 신설 `.post-related`(위 경계선·`--sp-9` 여백·13rem 열) / 440px에 `.post-summary word-break: normal` / `.editor-fields align-items: end`(라벨이 생겨 셀이 높아진 뒤 스위치가 반 칸 떠 보이지 않게)
- `tokens.css` `base.css` — 변경 없음

**점검했지만 바꾸지 않은 것(근거)** — 본문 줄길이 656px(칼럼 720 − 거터 64)·18.5px·행간 1.75 = 라틴 71자·한글 35자로 65~75자 안. h1 38 / h2 30 + 액센트 선 / h3 23 / h4 19 굵게 — 네 단계가 크기·여백으로 갈린다. 본문 링크 = 액센트색 + 밑줄(색만이 아니다). 표는 `.table-wrap` 가로 스크롤 + 헤더 행 면·굵기·실선. 상단 메타(날짜·분류·태그)는 제목 아래 두 줄, 제목보다 작고 낮은 색. 카드 제목은 자르지 않는다(그리드 행 높이가 따라간다), 터치 타깃 = 카드 전체. 사이드바 도킹 1024px에서 본문 720px 그대로(764 남음). 포커스 링은 `base.css :focus-visible` 전역 + 사이드바 안쪽 링. 다크 대비: 본문 15:1 / dim 8.3:1 / mute 6:1 / 액센트 7:1+ / 황토 8.9:1 / 자주 8.4:1.

### v3.2 (라운드 7) — 사이드바 신설, 카드 그리드, 컨트롤 축소, 목록 페이지 폭 확장

사용자 판정 원문: *"전체적으로 구조가 비어보여"* / *"검색창이라던지 카테고리라던지 너무 커"* /
*"왼쪽 사이드 위에 햄버거 메뉴 넣고 누르면 대분류로 정리한 것을 볼 수 있게, 챗 앱처럼 고정 가능"*.

| 절 | v3.1 | v3.2 |
|---|---|---|
| §0-1 | 사이드바 "없음" | **뒤집힘** — 접이식·고정 가능 사이드바. 근거를 표 안에 병기 |
| §1-2 원칙 3 | 그림자 예외 = 모달·토스트 | + **오버레이 상태의 사이드바**. 도킹되면 그림자 없음 |
| §2 | 폭 기준선 `--w-prose` 하나 ("칸 자체를 없앤다") | **`--w-page`(72rem) 부활 — 목록 페이지만.** `--w-side`(260) `--z-side`(50) `--z-scrim`(40) 신설. `--h-control-xs` 30/40 → 24/36. `--h-input`은 만들지 않음(`--h-control-sm` 재사용) |
| §3 | 헤더 3덩이 | **첫 자식 햄버거**(`.side-toggle`, CSS `::before` 아이콘). auto 마진은 `:last-child`(테마)에만 |
| §3-2 | (`.site-nav`) | **신설: 사이드바** — 마크업·트리 구조·상태 3종(`side-open` / `side-pinned` / `html[data-side]`)·저장·포커스·스크림 규칙. 기존 `.site-nav`는 §3-3으로 |
| §4 | 검색 → 분류 순서, 720px | **`.list-page` + `.list-tools`(분류 → 검색)**. 768 이하 스택도 DOM 순서(사양서와 다름 — 근거 명시) |
| §4-2 | `.page-title` `--fs-2xl`, 아래 여백 `--sp-7` | **`--fs-xl`**, `--sp-5`, `.page-sub` `--fs-sm` |
| §4-3 | — | **컨트롤 축소 표** — 검색 32px·20rem, 인덱스 `--fs-xs`·간격 절반 |
| §4-4 | 박스 세로 1열, 내용물 **셋** | **카드 그리드**(`auto-fill, minmax(17rem, 1fr)`, gap 16), 내용물 **넷**(`.entry-cat` 신설, 액센트색), 메타 바닥 정렬, 연도 라벨은 `<ul>` 밖 |
| §7 §8 | — | `.side*` 12종·`.list-tools`·`.list-page`·`.entry-cat` 등록. body 클래스 2종 추가. 사이드바 상태는 ARIA 속성이 곧 상태 |
| §11 | transition 7종 | + 사이드바 슬라이드·스크림·본문 밀기·핀/쉐브론 4행 |
| §11-1 | — | 사이드바·툴 행·그리드·`.entry-cat`의 파일 분담 |
| §11-2 | `.search-input`이 `--h-control` | `--h-control-sm`. 사이드바 항목 셋 추가. `--h-control-xs` 값 갱신 |
| §11-3 | 768 min / 1024 min | + 768 max(툴 행 스택) / 1024 min에 도킹. 그리드는 분기 없음 |
| §12 | §12-7까지 | **§12-8 신설** — #41-47 |

**같은 라운드에 web-designer가 수행한 CSS 변경**

- `tokens.css` — `--w-page` `--w-side` `--z-side` `--z-scrim` 신설, `--h-control-xs` 24/36, 레이아웃·z-index 주석 갱신
- `base.css` — reduced-motion 블록 주석에 사이드바 전환 포함 명시(규칙 추가 없음 — `*` 블록이 자른다)
- `layout.css` — §0 사이드바(fixed·슬라이드·스크림·스크롤 잠금·도킹 시 `body` 밀기) 신설, 넓은 페이지 둘의 헤더·푸터 `:has()` 정렬, 햄버거 auto 마진 결함 수정, `.page-head` 축소, `.list-tools` 신설, `.entry-list` 그리드, `.entry-meta` 바닥 정렬, 768px max 분기·1024px 도킹 분기
- `components.css` — 인덱스 항목·손잡이 축소, 검색 인풋·돋보기·지우기 축소, `.entry-cat` 신설, `.side-toggle` 햄버거 아이콘, §15 사이드바 부품 전부(핀·닫기·쉐브론 아이콘, 트리, 현재 글 강조, 빈 상태, 트리 안 포커스 링 안쪽)
- `prose.css` — 변경 없음

### v3.1 (라운드 6) — 배포 화면을 본 사용자 요청 4건

| 절 | v3.0 | v3.1 |
|---|---|---|
| §1-2 원칙 2 | "색 하나" | **역할색 셋** — `--c-accent`(누름·선택) / `--c-meta`(시간·수량) / `--c-tag`(주제) |
| §2 | `--w-date` 신설 | **`--w-date` 폐기**, `--c-meta` `--c-tag` `--dur-theme` `--ease-fade` **신설** |
| §4-3 | 태그에 `#` 접두사(CSS `::before`), 활성 밑줄을 `.index-item`에 | **`#` 삭제.** 두 축은 라벨 + `<details>` 위치 + 태그 색으로 구분. **활성 밑줄은 `.index-name`에만** — 개수 아래 떨어져 그려지던 `_`의 원인 제거. `.index-count`는 `--c-meta` |
| §4-4 | `날짜 \| 제목` 2열 행, 구분선 없음 | **박스.** `.entry-title` → `.entry-meta`(날짜 + 태그) 순서. 1px 경계선 + `--c-surface` 면 + `--r-md`, 그림자 없음. `::after`로 박스 전체가 링크 면적. `.entry-meta` `.entry-tags` `.entry-tag` 신설 |
| §5-2 | 날짜 `--c-text-mute` | `--c-meta` |
| §5-3 | `.tag`에 `#` `::before` | **삭제.** 색 `--c-tag`, hover `--c-accent` |
| §11 | transition 5종 | **테마 크로스페이드** 행 추가 + 작동 방식·첫 페인트 예외·`transition: all` 금지 명문화 |
| §11-2 | `.entry-title`이 `--h-control` | 박스 전체가 타깃. `.entry-title` 제외 |
| §12 | 38건 | **§12-7 신설** — `app.js` `entryRow()` 1건(#39-40) |

**같은 라운드에 web-designer가 수행한 CSS 변경** — 파일별 상세는 라운드 보고서에.

- `tokens.css` — `--c-meta` `--c-tag`(라이트·다크) `--dur-theme` `--ease-fade` 신설, `--w-date` 삭제
- `base.css` — 테마 크로스페이드 `*` 규칙(링크 규칙 앞)
- `layout.css` — `.entry` 2열 그리드 → 박스(세로 flex), `.entry-meta` `.entry-tags` 배치, 연도 라벨 밑선 제거, 440px 분기 갱신
- `components.css` — `#tagIndex .index-name::before`(`#`) 삭제, 활성 밑줄을 `.index-name`으로 이동, `.index-count`·`.entry-date` → `--c-meta`, 태그 인덱스 항목·`.tag`·`.entry-tag` → `--c-tag`, `.tag > a::before`(`#`) 삭제, `.entry-title::after` 늘린 링크, `.search-input`·`.field`에 테마 시간 `background-color`
- `prose.css` — `.code-lang` → `--c-meta`

### v3.0 (라운드 5) — 메모지 보드 폐기, 텍스트 목록으로 전면 재설계

| 절 | v2.3 | v3.0 |
|---|---|---|
| §0 | 없음 | **신설.** 실측 7곳 비교표 + 갈래별 선택 근거 + 폐기 목록 |
| §1-2 | "단색 배경 금지" 등 5원칙 | **재정의.** 배경 원칙 폐기, "그림자 금지", "액센트 하나" |
| §2 | 토큰 약 90종 | **약 50종.** 메모 6색·메시·그림자 6단·이징 4종·폭 4종 삭제, `--w-date` `--sh-pop` 신설. **폭 기준선을 `--w-prose` 하나로 통일** |
| §3 | 배경 3층 + sticky 헤더 + 4덩이 | **static 헤더 3덩이.** `.bg-layer` `.brand-mark` `.header-actions` `.is-stuck` 삭제, 440px 소거 규칙 폐기 |
| §4 | 히어로 + 통계 + 카테고리 탭 + 툴바 + 메모지 보드 | **`.page-head` + 검색 + 인라인 인덱스 + `날짜/제목` 2단 리스트.** 연도 그룹·태그 접기 신설 |
| §5 | 진행바 + 2열 본문 + 사이드바 목차 + 카드형 이전/다음 | **단일 칼럼.** 날짜 상단 한 줄 병기(`.post-dates`), 목차는 인라인 박스(h2 3개 이상), 이전/다음은 텍스트 |
| §6 | 색 셀렉트 2개 포함 | `#fColor` `#fNewCatColor` 삭제 |
| §7-1 | `--h-table-max` 세로 스크롤 + thead sticky | 폐기 — 긴 표는 그냥 길게 둔다 |
| §8 | 상태 16종 | `is-stuck` 폐기, `.memo`용 `is-visible` 폐기 |
| §9-2 | `color` 6색이 데이터 모델의 일부 | **폐기.** 근거 전문 + "마이그레이션 불필요" |
| §11 | CSS 6파일, 정지/모션 분업 | **5파일.** `animations.css` 삭제, transition은 부품 파일에 동거 |
| §11-3 | 분기 5개(360/440/768/1024/1440) | **4개** — 1440px 폐기 |
| §12 | 없음 | **신설.** HTML/JS 이행 지시 38건을 파일·줄 단위로 |

**같은 라운드에 web-designer가 수행한 CSS 변경**

- `css/animations.css` — **파일 삭제**(전량 폐기). reduced-motion 블록은 `base.css`로,
  토스트·모달 transition은 `components.css`로 이관
- `css/tokens.css` — 토큰 약 40종 삭제, `--w-date` `--sh-pop` 신설,
  `--c-bg` `#f4f1ea` → `#f7f5ef`(카드가 사라져 페이지 전체가 읽기 면이 되었으므로 한 단계 밝힘.
  본문 15.3:1 / dim 7.3:1 / mute 5.4:1 / 액센트 5.8:1 — 전부 AA 이상)
- `css/base.css` — `.bg-layer` `.bg-mesh` `.bg-grain` 전량 삭제, reduced-motion 블록 편입
- `css/layout.css` — 히어로·통계·툴바·보드·2열 본문·진행바 삭제,
  `--w-prose` 단일 칼럼으로 재작성
- `css/components.css` — `.memo*` `.chip*` `.cat-*` `.skeleton` `.progress-bar` 삭제,
  `.index-*` `.entry-*` `.post-dates` `.post-foot` `.list-*` 신설, 그림자 전면 제거
- `css/prose.css` — `.prose h2` 그라디언트 밑줄 → 단색, `.prose h4::before` 막대 삭제,
  `.prose em`의 `--c-accent-2` 제거, `.prose img`/`.code-wrap`/`kbd` 그림자 삭제,
  표의 `--h-table-max` 세로 스크롤 삭제. **코드 하이라이팅은 그대로**

### v2.3 이전

v2.0~v2.3의 이력은 메모지 카드 보드 시절의 것이라 v3.0에서 대부분 무효가 됐다.
필요하면 `git log -- docs/contract.md`로 확인한다.
