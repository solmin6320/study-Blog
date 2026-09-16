# 마크업 계약서 v3.0

디자이너(CSS)와 개발자(HTML/JS)가 동시에 작업하기 위한 **단일 진실 공급원**.
여기 없는 클래스를 임의로 만들지 않는다. 필요하면 이 문서를 먼저 갱신한다.

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
| 사이드바 (없음 4곳 / 좌측 트리 1곳) | **없음** | 트리는 2단계 분류가 있어야 값을 한다. 우리 `categories.json`은 평면이고, 720px 읽기 칼럼에서 사이드바는 본문 폭을 깎는다 |
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
| 진입 애니메이션 전부 (`animations.css`) | 위 두 항목이 사라지면 움직일 대상이 없다. 파일 자체를 삭제한다(§11) |
| `.board-skeleton` / `.skeleton` / shimmer | 로컬 `index.json` 한 개를 읽는 데 광택이 흐르는 자리표시자 6장은 연출이다. 정직한 한 줄(`.list-loading`)로 대체 |
| 읽기 진행바 `.progress` / `.progress-bar` | 실측 7곳 중 0곳. rAF 스크롤 핸들러 하나를 통째로 없앤다 |
| 읽는 시간 `.post-read` | 실측 7곳 중 0곳. "메모"에 붙는 "5분"은 정보가 아니다 |
| 정렬 셀렉트 `#sortSelect` | 실측 7곳 중 0곳. 학습 기록의 순서는 **시간순 하나**다. 3가지 정렬은 4편짜리 블로그에서 고를 이유가 없고, "수정순"은 목록에 수정일이 없는 새 구조와도 어긋난다 |
| **글·카테고리의 `color` 필드 + 메모지 6색 토큰** | §9-2에 근거 전문 |
| 사이드바형 목차(2열 그리드·sticky·스크롤 스파이) | §5-4에 근거 전문. **목차 자체는 인라인 박스로 남는다** |
| 헤더 sticky (`.is-stuck`) + 헤더 밑선 + `.brand-mark` | 실측 7곳 중 sticky 헤더 0곳. 밑선이 그어지는 연출과 회전하는 로고 마크는 "메모지" 어휘의 잔재다 |
| 헤더의 "새 메모" 버튼 | `.site-nav`의 "쓰기"와 **같은 목적지**다. 같은 곳으로 가는 문이 헤더에 둘 있을 이유가 없다 |
| `.site-nav`의 440px 소거 규칙 | 헤더가 3덩이(브랜드·내비·테마)로 줄어 좁은 화면에서도 경쟁하지 않는다. 링크를 숨기는 규칙 자체가 사라지는 편이 낫다 |

---

## 1. 원칙과 소유권

### 1-1. 파일 담당 (소유권)

| 담당 | 소유 파일 |
|---|---|
| web-designer | `docs/contract.md`(이 문서), `css/*` |
| frontend-dev | `index.html` `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*` |
| frontend-dev-2 | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` |
| pm-integrator | `docs/meeting-*.md`, `CLAUDE.md` |

소유하지 않은 파일은 **읽기만** 하고 수정하지 않는다.
**이 계약서는 web-designer만 개정할 수 있다.** 개발자는 개정을 요청한다.

### 1-2. 이 블로그의 디자인 원칙 (v3.0에서 재정의)

1. **읽는 데 필요 없는 요소는 화면에 두지 않는다.** 판단이 애매하면
   *"이게 없으면 글을 못 읽거나 못 찾는가?"* 를 묻는다. 아니면 뺀다.
2. **개성은 색 하나 + 타이포그래피 위계로만 낸다.** 액센트는 `--c-accent`
   **한 가지**다(v2.x의 `--c-accent-2` 테라코타는 폐기 — 그라디언트를 만들 자리가 없다).
3. **그림자를 쓰지 않는다.** 구분이 필요하면 1px 경계선이나 여백으로 해결한다.
   예외는 **화면 위에 떠 있는 두 가지**(모달 패널·토스트)뿐이고 토큰도 `--sh-pop` 하나다.
4. **모션은 상태 변화에만.** 진입 애니메이션·stagger·무한 루프는 없다.
   남은 것은 hover/focus 색 전환과 모달·토스트의 등퇴장뿐이다.
5. **~~단색 배경 금지~~ (폐기)** — 사용자 판정으로 배경은 `--c-bg` 단색이다.
   질감은 배경 레이어가 아니라 **따뜻한 종이색 자체**가 낸다.
6. 본문 타이포는 양보하지 않는다: **17px 이상 / 행간 1.75 / 줄길이 `--w-prose`.**

---

## 2. CSS 토큰 (tokens.css에서 정의)

```
색  : --c-bg --c-bg-2 --c-surface --c-surface-2 --c-border --c-border-soft
      --c-text --c-text-dim --c-text-mute --c-accent --c-accent-soft
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
치수: --h-control --h-control-sm --h-control-xs --h-nav --w-modal --w-toast --w-date
레이아웃: --w-prose(45rem) --gutter
z-index: --z-modal --z-toast
```

**v2.3에서 삭제된 토큰** — 다른 CSS에 남아 있으면 결함이다.
`--c-accent-2` / `--memo-*`(12) / `--memo-*-ink`(12) / `--memo-grain` / `--memo-min` /
`--mesh-*` / `--grain-alpha` / `--sh-sm` `--sh-md` `--sh-lg` `--sh-memo` `--sh-memo-hover` `--sh-ring` /
`--ease-in` `--ease-out` `--ease-ambient` / `--dur-ambient` `--dur-loop` /
`--fs-4xl` / `--w-content` `--w-page` `--w-toc` `--h-header` / `--r-xl` /
`--z-bg` `--z-base` `--z-sticky` `--z-progress`

**신설 2개**

| 토큰 | 값 | 왜 필요한가 |
|---|---|---|
| `--w-date` | `5.5rem` | §4-4 목록의 날짜 열 **고정 폭**. `auto`로 두면 날짜가 빠진 행에서 열이 접혀 그 행의 제목만 왼쪽으로 튄다. 고정하면 **모든 행의 제목 왼쪽 선이 한 줄로 맞는다** — 이 목록의 스캔은 그 선을 따라 내려가는 동작이다 |
| `--sh-pop` | 1단 소프트 섀도 | 원칙 3의 유일한 예외. "떠 있는 것"만 쓴다 |

**폭 토큰이 하나로 합쳐졌다.** v2.x는 `--w-page`(1200px)와 `--w-prose`(45rem) 두 기준선을
갖고 있었다. v3.0은 **`--w-prose` 하나**다 — 헤더·본문·목록·푸터가 같은 세로 축에 선다.
1200px 상자 안에 720px 본문이 들어 있으면 그 480px 차이가 "여백"이 아니라
**채워야 할 빈칸**으로 보이고, 카드·통계·사이드바가 거기로 들어오려 한다. 칸을 없앤다.

다크모드는 `:root[data-theme="dark"]`에서 토큰 값만 재정의한다.
초기 테마는 `<html data-theme="light|dark">`로 JS가 세팅한다(FOUC 방지 인라인 스크립트).

---

## 3. 공통 셸 (세 페이지 모두 동일)

```html
<a class="sr-only" href="#main">본문 바로가기</a>

<header class="site-header">
  <a class="brand" href="index.html"><span data-site-title>메모 블로그</span></a>
  <nav class="site-nav" aria-label="주요 메뉴">
    <a class="nav-link is-active" href="index.html">글</a>
    <a class="nav-link" href="write.html" data-admin-only>쓰기</a>
  </nav>
  <button class="icon-btn" id="themeToggle" type="button"
          aria-label="테마 전환" aria-pressed="false"></button>
</header>

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
- 헤더·본문·푸터는 **같은 칼럼**(`--w-prose` + `--gutter`)에 정렬된다.
  브랜드의 왼쪽 선 = 제목의 왼쪽 선 = 날짜의 왼쪽 선.

### 3-1. 스킵 링크

| 규칙 | 이유 |
|---|---|
| **`body`의 첫 자식** | 첫 Tab에서 나와야 "건너뛰기"다 |
| **대상은 세 페이지 모두 `#main`** | 렌더 전 빈 컨테이너로 뛰어내리지 않게 |
| **`<main>`에 `tabindex="-1"` 필수** | 없으면 스크롤만 되고 포커스는 헤더에 남는다 |
| 전용 클래스 없이 `.sr-only` | `:focus`와 `:focus-visible` **둘 다**에서 드러나도록 CSS가 잡혀 있다 |

착지점의 포커스 링은 `base.css`가 끈다(`main[tabindex="-1"]`).

### 3-2. `.site-nav`

- 항목은 세 페이지가 동일하다. 현재 페이지 링크에만 `.nav-link.is-active`.
- "쓰기"는 `data-admin-only`.
- **v2.3의 "440px 이하 소거" 규칙은 폐기됐다.** 헤더가 3덩이로 줄어 좁은 화면에서도
  경쟁하지 않는다. 내비는 모든 폭에서 보인다 — 링크를 숨기는 규칙이 없는 편이 항상 낫다.
- `.nav-link`는 알약 배경 없이 **글자만**이다(hover·활성에서 색과 굵기로만 구분).
  알약 = 누를 수 있는 덩어리는 §4-3의 인덱스와 어휘가 겹친다. 헤더에는 링크만 둔다.

---

## 4. index.html — 글 목록

```html
<main class="site-main" id="main" tabindex="-1">

  <div class="page-head">
    <h1 class="page-title" data-site-title>메모 블로그</h1>
    <p class="page-sub" data-site-sub>공부한 것을 기록하는 곳</p>
  </div>

  <!-- 검색: 컨트롤 한 줄. sticky 아님 -->
  <div class="search">
    <label class="sr-only" for="searchInput">글 검색</label>
    <input class="search-input" id="searchInput" type="search"
           placeholder="제목 · 요약 · 태그 검색  ( / )"
           autocomplete="off" enterkeyhint="search">
    <button class="search-clear" type="button" aria-label="검색어 지우기" hidden></button>
  </div>

  <!-- 분류 인덱스 — 항상 펼쳐져 있다 -->
  <div class="index-row" id="catRow">
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

  <!-- 태그 인덱스 — 접혀 있다(§4-3) -->
  <details class="index-fold" id="tagFold">
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

  <!-- 목록 -->
  <div class="post-list" id="postList" aria-live="polite">
    <section class="entry-group">
      <h2 class="entry-group-label">2026</h2>
      <ul class="entry-list">
        <li class="entry">
          <time class="entry-date" datetime="2026-09-13">2026.09.13</time>
          <a class="entry-title" href="post.html?id=2026-09-13-css-grid">CSS Grid 정리</a>
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
`정체(제목) → 찾기(검색) → 축으로 좁히기(분류·태그) → 목록`.
`order`나 `flex-direction: row-reverse`로 시각 순서만 바꾸는 것은 금지다.

### 4-1. 이름 대응표 (v2.3 → v3.0)

찾아 바꾸기용이다. **왼쪽 이름이 코드에 남아 있으면 결함이다.**

| v2.3 | v3.0 | 비고 |
|---|---|---|
| `.hero` / `.hero-title` / `.hero-sub` | `.page-head` / `.page-title` / `.page-sub` | 크기가 `--fs-4xl` → `--fs-2xl`로 내려간다 |
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

### 4-2. 페이지 머리말 `.page-head`

- `<h1>`은 **사이트 이름**이다(`data-site-title`). `index.html`의 유일한 h1이므로
  없애면 문서 개요가 깨진다 — 히어로를 지우되 h1은 남긴다.
- 크기는 `--fs-2xl`(22→30px). `--fs-4xl`(34→60px)은 **콘텐츠가 아닌 것이 화면에서
  가장 큰 글자가 되는 배치**였다. 이 화면의 주인공은 목록의 제목들이다.
- 액센트 바(`.hero::before`)·통계·진입 애니메이션 없음. 두 줄이 전부다.
- `.page-sub`는 한 줄(`--fs-md`, `--c-text-dim`). 두 줄이 되면 `index.json`의
  `site.subtitle`을 줄이라는 뜻이다.

### 4-3. 인덱스 — 분류·태그 (`.index-*`)

**한 부품으로 두 축을 그린다.** 모양으로 구분하지 않고 **라벨과 `#` 접두사로** 구분한다.

| 축 | 라벨 | 접두사 | 선택 | ARIA | 기본 상태 |
|---|---|---|---|---|---|
| 분류 | `분류` | 없음 | **단일** | `aria-current="true"` (비선택은 **속성 제거**, `false` 아님) | 펼침 |
| 태그 | `태그` | `#`(CSS `::before`) | **다중** | `aria-pressed="true|false"` | **접힘** |

- v2.x는 카테고리(탭+레일+점+밑줄)와 태그(알약+테두리)를 **다섯 가지 시각 신호로** 갈랐다.
  그 다섯 가지가 화면 높이의 4분의 1을 먹었다. 두 축을 구분하는 가장 싼 방법은
  **그냥 이름을 적는 것**이다.
- **`flex-wrap: wrap`이다. 가로 스크롤을 쓰지 않는다.**
  v2.x의 `nowrap` + 가로 스크롤은 카테고리가 10개만 넘어도 **뒤쪽 항목이 화면 밖으로
  숨었고**, 스크롤 가능하다는 사실을 덮개·그림자로 따로 알려야 했다.
  인라인 텍스트는 줄바꿈으로 전부 보인다 — 100개여도 6줄이면 끝난다(실측 사례 1).
- **항목 이름은 `<span class="index-name">`에 담는다.** 버튼의 텍스트 노드로 두면
  긴 분류명을 말줄임할 수 없고, 아래 `#` 접두사를 붙일 자리도 없다.
- 항목 사이 구분자 `·`는 **CSS `::before`가 그린다**(`.index-item + .index-item::before`).
  마크업에 문자를 넣지 않는다 — 문자로 넣으면 줄바꿈 위치에서 구분자가 줄 머리에 혼자 떨어진다.
- **태그의 `#` 접두사도 CSS가 그린다**(`#tagIndex .index-name::before`).
  `"#css"`를 텍스트로 넣으면 **화면 문자열과 `data-tag` 필터 값이 어긋난다.**
  `data-tag="*"`(전체)에는 붙지 않는다 — 그건 태그 이름이 아니라 필터 해제 버튼이다.
- `.index-count`는 **실제 정보**다(그 분류에 글이 몇 편). 장식이 아니므로
  `aria-hidden`을 붙이지 않는다. 스크린리더가 "CSS 1"로 읽는 것은 실측 사례 1·6·7이
  공통으로 감수하는 형태다.
- `.index-item.is-empty` : 글이 0편인 분류. **opacity가 아니라 한 단계 낮은 색 토큰**으로
  내린다(opacity는 대비를 4.5:1 아래로 떨어뜨린다).
- **정렬 순서: `categories.json`의 `order`** 오름차순, 같으면 글 수 내림차순.
  자동 정렬(글 수 순)을 기본으로 삼지 않는 이유 — `order`는 사용자가 직접 적는 값이고,
  분류의 순서는 이 블로그에서 **사용자의 편집 대상**이다(요구사항: 카테고리 직접 추가).

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

### 4-4. 목록 `.post-list` — 날짜 + 제목 2단 리스트

```html
<section class="entry-group">
  <h2 class="entry-group-label">2026</h2>
  <ul class="entry-list">
    <li class="entry">
      <time class="entry-date" datetime="2026-09-13">2026.09.13</time>
      <a class="entry-title" href="post.html?id=…">CSS Grid 정리</a>
    </li>
  </ul>
</section>
```

**한 행의 내용물은 `날짜`와 `제목` 둘뿐이다.** 요약·태그·분류·수정일·색·아이콘 금지.
사용자가 직접 고른 형태다.

| 규칙 | 근거 |
|---|---|
| `.entry`는 `grid-template-columns: var(--w-date) minmax(0, 1fr)` | 날짜 열이 고정이라 **모든 제목의 왼쪽 선이 한 줄로 맞는다.** 이 목록을 훑는 동작은 그 선을 따라 내려가는 것이다 |
| `.entry-date`는 `--fs-sm` / `--c-text-mute` / `tabular-nums` | 날짜는 부속이고 제목이 주인공이다. 자릿수가 세로로 맞아야 열로 읽힌다 |
| `.entry-title`은 `--fs-lg` / 굵기 600 / `--c-text` | 화면에서 **가장 눈에 띄는 글자**여야 한다(h1보다도) |
| 행 사이에 **구분선을 긋지 않는다** | 300행짜리 줄무늬는 표로 보인다. 분리는 행 높이와 날짜 열의 리듬이 이미 하고 있다 |
| `.entry-title`이 터치 타깃 높이를 갖는다(`--h-control`) | 눌리는 것은 제목 링크다. `<li>`에 패딩을 주면 링크 밖을 눌러도 아무 일이 안 일어난다 |
| hover/focus = 밑줄 + 액센트 색. **이동·배경·그림자 없음** | 리스트에서 행이 움직이면 그 아래 행 전부가 흔들려 보인다 |
| `created` 내림차순 고정 | 정렬 컨트롤이 없다(§0-2). 학습 기록의 순서는 시간순 하나다 |

**연도 그룹 `.entry-group`**

- `created`의 연도가 바뀌는 지점마다 `<section class="entry-group">`으로 끊고
  `<h2 class="entry-group-label">2026</h2>`를 붙인다.
- **목록 전체가 한 해에 들어가면 `<h2>`를 넣지 않는다**(`<section>`은 그대로 둔다).
  글 4편 위에 "2026" 한 줄이 떠 있는 것은 정보가 아니라 장식이다.
- 이 규칙 하나로 **1편일 때와 300편일 때가 둘 다 말이 된다.**
  4편이면 아무것도 없고, 300편이면 연도 5개가 스크롤의 이정표가 된다.
  실측 7곳 중 페이지네이션을 쓰는 곳은 0곳이었다 — 긴 목록은 자르는 게 아니라 **끊어 읽힌다.**
- 필터(분류·태그·검색)가 걸린 결과에도 같은 규칙을 적용한다.

**행의 상태 클래스 2종**

| 클래스 | 누가 | 무엇 |
|---|---|---|
| `.entry.is-pinned` | `app.js` | 고정 글. **연도 그룹보다 위**에 별도 `<section class="entry-group">`(라벨 없음)으로 먼저 온다. 표시는 압정 그림이 아니라 제목 앞의 작은 `고정` 글자 — CSS가 `::before`로 그리므로 **마크업에 문자를 넣지 않는다** |
| `.entry.is-hidden` | `app.js` | 검색·필터로 걸러진 행. `display: none`이라야 목록에서 실제로 빠진다. 다시 드러낼 때 추가로 불러야 하는 함수는 없다(v2.x의 `reveal()`은 폐기됐다 — §12) |

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

### 5-3. 분류·태그 `.post-meta`

- `.post-cat`은 **`<a>`** 다. 같은 분류의 목록(`index.html?cat=slug`)으로 가는 유일한 경로이며
  검색·직접 링크로 들어온 사람이 가장 자주 쓰는 길이다.
  링크 텍스트는 분류 **이름**, `href`는 **slug**, `aria-label="OO 분류의 글 모두 보기"`.
  분류가 없는 글이면 `post.js`가 요소를 감춘다(빈 링크를 남기지 않는다).
- `.post-tags`의 항목은 `<li class="tag"><a href="index.html?tags=…">` 다.
  높이는 `<li>`가 갖고 `<a>`가 `block-size:100%`로 채운다(= 눌리는 면적 = `<li>` 높이).
  태그 문자열은 `encodeURIComponent`로 감싼다. 쉼표가 든 태그는 왕복이 깨지므로 넣지 않는다.
- v2.x는 분류 라벨에 앞머리 막대·알약 틴트·확대까지 **호버 신호 3종**을 걸었다.
  v3.0에서는 `.post-cat`도 `.tag`도 **밑줄 + 색**으로만 반응한다 — 본문 링크와 같은 어휘다.
  한 화면에 링크 어휘가 세 가지면 그것 자체가 소음이다.

### 5-4. 목차 — 인라인 박스로 남긴다

**결정: 사이드바형 목차는 폐기, 본문 위 인라인 목차는 유지. 조건은 h2 3개 이상.**

| | 사이드바형(v2.3) | 인라인형(v3.0) |
|---|---|---|
| 끌고 오는 것 | `.post-body` 2열 그리드 · `--w-toc` · 1024px sticky · `:has(> .toc[hidden])` 트랙 접기 · 스크롤 스파이(rAF) · `.toc-item.is-active` | `<aside>` 하나 |
| 짧은 글에서 | 빈 2열 트랙을 접는 `:has()` 규칙이 필요 | `hidden` 하나면 끝 |
| 실측 | 7곳 중 0곳 | 7곳 중 1곳(사례 7 — 871편, 우리와 조건이 가장 가까움) |

- **표시 조건: `h2`가 3개 이상**(v2.3은 "제목 2개 이상"이었다).
  이 블로그의 글은 대부분 "메모"라 h2가 0~2개다. 그 글들에는 목차가 나오지 않는다.
  진짜 긴 정리글에서만 나타나야 목차가 **기능**이지 장식이 아니다.
- `.toc-item.is-h2` / `.is-h3` 는 유지한다(h3만 들여쓴다).
  **`.is-active`와 스크롤 스파이는 폐기한다** — 화면에서 스크롤과 함께 사라지는 박스에
  "지금 여기"를 표시할 이유가 없다. 이 결정으로 `post.js`의 rAF 스크롤 핸들러가 사라진다.
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

    <div class="editor-fields">
      <input class="field" id="fSummary"> <input class="field" id="fTags">
      <input class="field" id="fId">
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
.tag
.toast .toast.is-ok .toast.is-warn .toast.is-err
.modal .modal-panel .modal-head .modal-body .modal-foot  (열림: body.modal-open + .modal.is-open)
.sr-only
.search .search-input .search-clear
.index-row .index-label .index-list .index-item .index-name .index-count
.index-fold .index-fold-summary
.entry-group .entry-group-label .entry-list .entry .entry-date .entry-title
.list-loading .list-empty
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

**생성 시점에 정해져 바뀌지 않는 분류 클래스**

`is-h2` `is-h3` — 목차 항목의 등급(`markdown.js`)
`is-prev` `is-next` — 이전/다음 링크(`post.js`)
`is-ok` `is-warn` `is-err` — 토스트 종류(`ui.js`)

**폐기**: `is-stuck`(헤더 static) · `is-visible`(진입 모션 없음 — 토스트/모달은 각자 `is-open`을 쓴다)

> 토스트의 등퇴장은 v3.0에서도 `is-visible`을 쓴다. 위 "폐기"는 **`.memo` 진입용**
> `is-visible`을 말한다. 혼동을 없애기 위해 `.toast`의 표시 상태는 그대로 두되
> `ui.js`의 `reveal()`/IntersectionObserver는 통째로 삭제한다(§12).

`body.modal-open` `body.admin-off` 는 body에만 붙는 예외다.
그 외 상태 클래스가 필요하면 계약서를 먼저 갱신한다.

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
| `layout.css` | 화면 골격(헤더/메인/푸터/목록/글/에디터) | 재사용 부품의 생김새 |
| `components.css` | 재사용 부품의 생김새 **+ 그 부품의 transition** | 골격 배치 |
| `prose.css` | 마크다운 결과물(`.prose` 안) | 클래스 기반 규칙 |

**v2.x의 "정지/모션 분업" 규칙은 폐기됐다.** `animations.css`가 없어졌으므로
`transform` / `translate` / `rotate` / `scale`을 나눠 쓸 이유도 없다.
**transition은 그 부품을 정의한 파일에 함께 둔다.**
남아 있는 transition은 다음이 전부다 — 이 목록 밖의 모션을 추가하려면 계약서를 먼저 고친다.

| 대상 | 무엇이 | 시간 |
|---|---|---|
| 링크·버튼·인덱스 항목 | `color` / `background-color` / `border-color` / `text-decoration-color` | `--dur-fast` |
| 인풋 포커스 | `border-color` / `box-shadow` | `--dur-fast` |
| 토스트 | `opacity` / `transform` | `--dur` |
| 모달 | `opacity` / `transform` | 열림 `--dur-slow` / 닫힘 `--dur-fast` |
| 목차 접기 화살표(`summary::before`) | `rotate` | `--dur` |

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
| `.post-list` `.entry-group` `.entry-list` `.entry`의 **그리드** | `layout.css` |
| `.entry-date` `.entry-title`의 **생김새** | `components.css` |
| `.post-nav`의 **그리드와 768px 열 전환** | `layout.css` |
| `.post-nav-item` `.post-nav-label` `.post-nav-title` `.back-link` | `components.css` |
| `.index-row`의 **줄 배치** | `layout.css` |
| `.index-label` `.index-item` `.index-count` `.index-fold*` | `components.css` |
| `.toc` 계열 전부 | `components.css` (2열 트랙이 사라져 골격과 무관해졌다) |

### 11-2. 리터럴 금지의 범위

| 값 | 리터럴 허용? | 이유 |
|---|---|---|
| 색·그림자·간격·폰트·반경·이징·지속시간 | **금지** | 전부 `tokens.css`에 있다 |
| **누를 수 있는 것의 최소 크기** | **금지** | `--h-control`(40/44) `--h-control-sm`(32/44) `--h-nav`(36/44) `--h-control-xs`(30/40). **이 넷만 `pointer:coarse`에서 자동 상승한다** — 리터럴로 쓰면 그 상승을 놓친다 |
| 포커스·상태 글로우의 링 두께 | **금지** | `--ring-w` |
| 목록 날짜 열 폭 | **금지** | `--w-date` |
| 누를 수 없는 라벨의 치수(`.tag` 24px 등) | 허용 | 터치 타깃 판정 대상이 아니다 |
| 한 부품 안에서만 의미를 갖는 도형 치수(돋보기 11px, 표 가장자리 그림자 22px 등) | 허용 | 토큰화해도 재사용처가 없다 |

판별법: **"이 숫자가 다른 곳에서도 같아야 하는가?"** 그렇다면 토큰이다.
그리고 **"손가락이 이걸 누르는가?"** 그렇다면 높이 토큰이다.

**높이 토큰 사용처 (이 표가 곧 검증 목록이다)**

| 토큰 | coarse | 사용처 |
|---|---|---|
| `--h-control` | 40 → 44 | `.btn` `.icon-btn` `.search-input` `.field` `.switch` `.entry-title` `.sr-only:focus` |
| `--h-control-sm` | 32 → 44 | `.index-item` `.index-fold-summary` `a.post-cat` `.post-tags .tag` `.md-btn` `.code-copy` `.prose summary` `.toc-item` |
| `--h-nav` | 36 → 44 | `.nav-link` `.brand` `.back-link` |
| `--h-control-xs` | 30 → 40 | `.search-clear` (하나뿐 — 44px 인풋 안의 44px 원판은 입력칸으로 안 보인다) |

**높이 상승은 `tokens.css`의 `@media (pointer: coarse)` 한 곳에서만 한다.**
다른 파일에서 다시 올리지 않는다(같은 규칙이 두 곳에 있으면 한쪽만 고쳐진다).

### 11-3. 반응형 분기점

미디어쿼리는 **아래 넷만** 쓴다. 크기 변화는 `clamp()`가, 배치 전환만 미디어쿼리가 맡는다.

| 분기 | 방향 | 무엇이 바뀌는가 |
|---|---|---|
| 360px | (기준선) | 여기서 가로 스크롤이 생기면 실패다. 분기 자체는 없다 |
| 440px | `max-width` | 본문 코드·인용·표·목록의 좌우 패딩 압축 / `.entry`의 날짜 열 축소 |
| 768px | `min-width` | `.post-nav` 1열 → 2열, 토스트가 오른쪽 아래로 |
| 1024px | `min-width` | 에디터 split 2열 |

**v2.3의 1440px 분기는 폐기됐다**(보드 카드 최소 폭을 키우던 규칙 — 보드가 없다).
콘텐츠 폭이 `--w-prose` 하나로 고정돼 1440px에서 바뀔 것이 없다.

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

---

## 13. 변경 이력

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
