# 마크업 계약서 v2.3

디자이너(CSS)와 개발자(HTML/JS)가 동시에 작업하기 위한 **단일 진실 공급원**.
여기 없는 클래스를 임의로 만들지 않는다. 필요하면 이 문서를 먼저 갱신한다.

> **v2.3 개정 요약 (라운드 4, web-designer)** — `docs/meeting-03.md`의 확정 결함(M3-2·4·5·6·8·9·10)과
> **사용자 결정 2건**을 반영했다. 이번 개정도 대부분 "코드가 옳다"는 판정에 계약서를 맞춘 것이라
> 개발자가 고칠 것은 적다. `할 일`이 "없음"이면 이미 맞는 코드이니 손대지 말 것.
>
> | # | 변경 | 개발자가 할 일 |
> |---|---|---|
> | 1 | **§7-1 표 계약 신설** — 요구사항 #5의 "그래프"가 정식 제외되고 그 자리를 **표**가 대신한다. 마크업·정렬·스크롤·헤더 고정 규칙을 전부 등재 | `markdown.js`: 살균 시 `th/td`의 **`align` 속성이 살아 있어야 한다**(§7-1 "정렬" 항목). 그 밖에는 없음 |
> | 2 | **인라인 SVG는 허용하지 않는다**(살균 표면 확대 금지). `USE_PROFILES:{html:true}` 유지 | 없음 — `markdown.js:50`이 이미 맞다 |
> | 3 | §8 상태 클래스에 누락 7개 등재: `is-h2 is-h3 is-prev is-next is-ok is-warn is-err` | 없음 — 코드가 이미 맞다(M3-8-①) |
> | 4 | §5 `.post-tags` 마크업을 `<li class="tag"><a>`로 확정 | 없음 — `post.js:86-90`이 이미 맞다(M3-8-③) |
> | 5 | §11-1 파일 분업 표에 `.toc` 계열 행 추가 | 없음 (M3-8-④) |
> | 6 | §11-2 `--h-control-sm` 사용처를 실측으로 교체 + `--h-control-xs` 신설 등재 | 없음 — CSS만 변경(M3-8-②, M3-9) |
> | 7 | §11-3 **반응형 분기점 5개 확정**(360/440/768/1024/1440) — `prose.css`의 480px을 440px로 통합 | 새 미디어쿼리는 이 5개 밖의 값을 쓰지 않는다 |
> | 8 | §2 토큰 6종 추가: `--w-prose` `--h-control-xs` `--h-table-max` `--ring-w` `--sh-focus` `--dur-loop` | 없음 |
> | 9 | §3-2 인용 줄번호 정정(`layout.css:569-572` → **553-556**), §6에 미리보기 전용 여백 등재 | 없음 |
> | 10 | §5 본문 폭 기준을 `--w-content`(72ch) → **`--w-prose`(45rem)** 로 교체 — 머리말/본문/목차 트랙이 한 값을 쓴다 | 없음 — CSS만 변경(M3-4·5·6) |
>
> **v2.2 개정 요약 (라운드 3, web-designer)** — `docs/meeting-02.md`의 판정을 반영했다.
> 이번 개정은 **대부분 "코드가 옳다"는 판정에 계약서를 맞춘 것**이라 개발자가 고칠 것이 적다.
> `할 일` 칸이 "없음"이면 이미 맞는 코드이니 손대지 말 것.
>
> | # | 변경 | 개발자가 할 일 |
> |---|---|---|
> | 1 | §5 `.post-cat`을 `<span>` → **`<a>`** 로 확정 (+호버 신호 3종 명문화) | 없음 — `post.html:93`이 이미 맞다 |
> | 2 | §4 툴바 DOM 순서를 **`.search` → `.select` → `.chips`** 로 확정 | 없음 — `index.html:105-121`이 이미 맞다 |
> | 3 | §6/§10-4 `.cat-picker`/`.cat-new` 위치를 **`.editor-mode` 다음 / `.editor-fields` 앞**으로 확정 | 없음 — `write.html:118-142`가 이미 맞다 |
> | 4 | §3 `.site-nav`에 **"쓰기" 링크**(`data-admin-only`) 등재 | 없음 — 3개 HTML 모두 이미 맞다 |
> | 5 | §10-3 `.cat-item[title]`(카테고리 설명) 등재 + **"title로 접근성을 대체하지 않는다"** 제약 동봉 | `title`은 유지. 필수 정보를 title에만 넣지 말 것 |
> | 6 | §3 `.site-nav`의 **440px 이하 소거** 규칙과 "대체 경로" 조건 등재 | 없음 (새 nav 항목 추가 시 이 조건을 지킬 것) |
> | 7 | §5 `.code-lang` 등재 (`.code-wrap`의 DOM 순서 고정) | 없음 — `markdown.js:94`가 이미 맞다 |
> | 8 | §8-2 **`[data-reveal]` 훅 폐기(B안)** — 계약서에서 삭제, CSS도 제거함 | **삭제**: `app.js:519`, `post.js:185`, `ui.js:97`의 기본 선택자 |
> | 9 | §3 **스킵 링크 마크업 등재** — 세 페이지 모두 `#main`, `<main tabindex="-1">` | `post.html`의 스킵 대상을 `#postBody`→`#main`으로, 3개 HTML의 `<main>`에 `tabindex="-1"` 추가 |
> | 10 | §11 파일 분업 위반·리터럴 수정(`.post-nav-item` 이관, `.memo::after` 다크 반전, `32px` 리터럴) | 없음 — CSS만 변경 |

---

## 1. 파일 담당 (소유권)

| 담당 | 소유 파일 |
|---|---|
| web-designer | `docs/contract.md`(이 문서), `css/*` |
| frontend-dev | `index.html` `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*` |
| frontend-dev-2 | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` |
| pm-integrator | `docs/meeting-*.md`, `CLAUDE.md` |

소유하지 않은 파일은 **읽기만** 하고 수정하지 않는다.
**이 계약서는 web-designer만 개정할 수 있다.** 개발자는 개정을 요청한다.

---

## 2. CSS 토큰 이름 (tokens.css에서 정의, JS/HTML에서 참조)

```
색  : --c-bg --c-bg-2 --c-surface --c-surface-2 --c-border --c-border-soft
      --c-text --c-text-dim --c-text-mute --c-accent --c-accent-2 --c-accent-soft
      --c-danger --c-warn --c-ok
보조색: --c-on-accent --c-focus --c-scrim --c-shadow-rgb --c-selection
메모: --memo-amber --memo-mint --memo-sky --memo-rose --memo-lilac --memo-lime
      (각각 -ink 접미사로 글자색도 함께 정의: --memo-amber-ink)
배경: --mesh-1 --mesh-2 --mesh-3 --mesh-alpha --mesh-blur --grain-alpha --memo-grain
코드: --code-bg --code-border --code-text --hl-*(하이라이팅 토큰 17종)
타이포: --ff-sans --ff-mono --ff-display
      --fs-xs --fs-sm --fs-md --fs-lg --fs-xl --fs-2xl --fs-3xl --fs-4xl --fs-prose
      --lh-tight --lh-head --lh-body --ls-tight --ls-wide
간격: --sp-1 ~ --sp-12  (4px 배수 스케일)
반경: --r-sm --r-md --r-lg --r-xl --r-full
그림자: --sh-sm --sh-md --sh-lg --sh-memo --sh-memo-hover --sh-ring
      --ring-w(3px — 포커스/상태 글로우 링 두께) --sh-focus(인풋 :focus 글로우)   ← v2.3
모션: --ease(cubic-bezier(.16,1,.3,1)) --ease-out --ease-in
      --ease-ambient(linear — 무한 루프 전용)
      --dur-fast(160ms) --dur(260ms) --dur-slow(420ms) --dur-ambient(52s)
      --dur-loop(1.9s — 스켈레톤 광택·상태 점 맥동의 1주기)                        ← v2.3
치수: --h-control --h-control-sm --h-control-xs --h-nav --w-modal --w-toast
      (앞의 네 높이 토큰이 @media (pointer:coarse)에서 자동 상승 = 터치 타깃 기준.
       --h-control(40→44) --h-control-sm(32→44) --h-nav(36→44) --h-control-xs(30→40)
       --h-control-sm : 본문·카드 흐름 안에 끼어드는 작은 링크·칩용(v2.2 신설)
       --h-control-xs : **컨트롤 안에 들어앉는 컨트롤** 전용. 지금은 .search-clear 하나뿐이고
                        44px 인풋 안에서 44px 원판이 되면 입력칸으로 안 보이므로 40px에서 멈춘다.
                        대신 주변 24px 이상을 비워 WCAG 2.2 간격 예외를 만족시킨다 — v2.3 신설)
레이아웃: --w-content(72ch) --w-prose(45rem) --w-page(1200px) --h-header(64px)
      --w-toc(15rem) --h-table-max(72dvh) --gutter --memo-min
      (--w-content : 히어로처럼 "그 요소의 폰트 기준 72자" 상자용
       --w-prose   : **본문 글줄 폭. .post-head / .prose / .post-body 1열 트랙이 함께 쓴다.**
                     ch가 아니라 rem인 이유 — 같은 72ch가 16px 머리말에서 641px,
                     19px 본문에서 718px로 풀려 파선이 본문보다 78px 짧게 끝났다(M3-5) — v2.3 신설
       --h-table-max: 이 높이를 넘는 표만 .table-wrap 안에서 세로 스크롤되고 thead가 sticky로 붙는다)
z-index: --z-bg --z-base --z-sticky --z-header --z-progress --z-modal --z-toast
```

다크모드는 `:root[data-theme="dark"]`에서 토큰 값만 재정의한다.
초기 테마는 `<html data-theme="light|dark">`로 JS가 세팅한다(FOUC 방지용 인라인 스크립트).

---

## 3. 공통 셸 (세 페이지 모두 동일)

```html
<!-- 스킵 링크. body의 첫 자식이어야 한다(§3-1). -->
<a class="sr-only" href="#main">본문 바로가기</a>

<div class="bg-layer" aria-hidden="true">
  <div class="bg-mesh"></div>
  <div class="bg-grain"></div>
</div>

<header class="site-header" id="siteHeader">
  <a class="brand" href="index.html">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-text" data-site-title>…</span>
  </a>
  <!-- 항목은 세 페이지가 동일하다. 페이지마다 메뉴가 달라 보이면 안 된다(§3-2). -->
  <nav class="site-nav" aria-label="주요 메뉴">
    <a class="nav-link is-active" href="index.html">메모</a>
    <a class="nav-link" href="write.html" data-admin-only>쓰기</a>
  </nav>
  <div class="header-actions">
    <button class="icon-btn" id="themeToggle" type="button" aria-label="테마 전환" aria-pressed="false"></button>
    <a class="btn btn-primary" href="write.html" data-admin-only>새 메모</a>
  </div>
</header>

<main class="site-main" id="main" tabindex="-1">…</main>

<footer class="site-footer">…</footer>
<div class="toast-area" id="toastArea" aria-live="polite"></div>
```

- `data-admin-only` : 관리자 모드가 꺼져 있으면 JS가 DOM에서 제거한다. CSS는 기본적으로 보이게 두면 된다(단, `.admin-off [data-admin-only]{display:none}` 안전장치는 둔다).
- `.site-header.is-stuck` : 스크롤 시 JS가 붙인다.

### 3-1. 스킵 링크 (v2.2 등재)

```html
<a class="sr-only" href="#main">본문 바로가기</a>
…
<main class="site-main" id="main" tabindex="-1">…</main>
```

| 규칙 | 이유 |
|---|---|
| **`body`의 첫 자식**. 배경 레이어·헤더보다 앞 | 첫 Tab에서 나와야 "건너뛰기"다. 헤더 뒤에 있으면 이미 건너뛸 게 없다 |
| **대상은 세 페이지 모두 `#main`** | `post.html`이 `#postBody`를 가리키면 렌더 전에는 빈 컨테이너로 뛰어내린다. 목록으로 돌아가는 `.back-link`·제목까지 한 번에 건너뛰는 것도 과하다 |
| **`<main>`에 `tabindex="-1"` 필수** | 이게 없으면 브라우저에 따라 스크롤만 되고 **포커스는 헤더에 남는다**. 다음 Tab이 다시 로고로 돌아가 스킵 링크가 사실상 무동작이 된다 |
| 전용 클래스를 두지 않고 `.sr-only`를 쓴다 | `.sr-only`는 `:focus`와 `:focus-visible` **둘 다**에서 드러나도록 CSS가 잡혀 있다(`components.css` §15). 스킵 링크는 한 경우라도 새면 실패라 판정이 보수적인 브라우저까지 덮어야 한다 |

착지점의 포커스 링은 `base.css`가 끈다 — `tabindex="-1"`은 프로그램적 착지 전용이라
화면 전체가 테두리에 갇힌 것처럼 보이는 편이 오히려 위치 파악을 방해한다.

### 3-2. `.site-nav` 항목 규칙 (v2.2 등재)

- 항목은 **세 페이지가 동일**하다. 현재 페이지에 해당하는 링크에만 `.nav-link.is-active`.
- "쓰기"는 `data-admin-only` — 방문자에게는 `admin.js`가 DOM에서 지운다.
- **440px 이하에서 `.site-nav`는 통째로 사라진다**(`layout.css:553-556`의 `@media (max-width: 440px)`.
  v2.2가 적어 둔 `569-572`는 어느 시점에도 맞은 적이 없는 오기였다 — 줄번호보다 **선택자·미디어쿼리 문구**를 기준으로 찾을 것).
  좁은 헤더에서 브랜드·내비·테마·새 메모 4덩이가 경쟁하면 전부 잘리기 때문이다.
  → **`.site-nav`에는 다른 경로가 없는 링크를 넣지 않는다.** 현재 항목의 대체 경로:

  | 항목 | 440px 이하 대체 경로 |
  |---|---|
  | 메모 (`index.html`) | `.brand`가 같은 곳을 가리킨다 |
  | 쓰기 (`write.html`) | `.header-actions`의 "새 메모" 버튼 |

  새 항목을 추가하려면 대체 경로를 함께 설계하고 이 표에 한 줄을 더한다.
- **`.brand`는 440px 이하에서 "메모" 링크의 유일한 대체 경로**이므로 터치 타깃 높이를 갖는다
  (`--h-nav`, coarse에서 44px). 내용물(26px 마크) 높이에 맡기지 않는다 — v2.3.

---

## 4. index.html — 메모지 보드

```html
<section class="hero">
  <h1 class="hero-title">…</h1>
  <p class="hero-sub">…</p>
  <div class="hero-stats">
    <div class="stat"><b class="stat-num" data-count="12">12</b><span class="stat-label">메모</span></div>
  </div>
</section>

<!-- 1차 축(카테고리)이 2차 축(검색·태그)보다 먼저 온다. §10-3 참조 -->
<nav class="cat-nav" id="catNav" aria-label="카테고리">…</nav>

<!-- DOM 순서 고정: .search → .select → .chips  (v2.2, 아래 표 참조) -->
<section class="toolbar" aria-label="검색과 필터">
  <div class="search">
    <label class="sr-only" for="searchInput">메모 검색</label>
    <input class="search-input" id="searchInput" type="search" placeholder="검색">
    <button class="search-clear" type="button" aria-label="검색어 지우기" hidden></button>
  </div>
  <select class="select" id="sortSelect" aria-label="정렬 기준">…</select>
  <div class="chips" id="tagFilters" role="group" aria-label="태그 필터">
    <button class="chip is-active" type="button" data-tag="*" aria-pressed="true">전체</button>
  </div>
</section>

<section class="board" id="board" aria-live="polite">
  <article class="memo" data-color="amber" data-id="…" style="--i:0; --rot:-.35deg">
    <span class="memo-pin" aria-hidden="true"></span>
    <span class="memo-cat">프론트엔드</span>
    <h2 class="memo-title"><a class="memo-link" href="post.html?id=…">제목</a></h2>
    <p class="memo-summary">요약</p>
    <ul class="memo-tags"><li class="tag">css</li></ul>
    <div class="memo-meta">
      <time class="memo-date" datetime="2026-09-13T14:20:00+09:00">2026.09.13</time>
      <time class="memo-updated" datetime="…">수정 09.14</time>
    </div>
    <div class="memo-actions" data-admin-only>
      <button class="memo-act" data-act="edit">수정</button>
    </div>
  </article>
</section>

<div class="board-empty" id="boardEmpty" hidden>…</div>
<div class="board-skeleton" id="boardSkeleton">…</div>
```

**툴바 DOM 순서 = `.search` → `.select` → `.chips` (v2.2 확정)**

`layout.css`의 `.toolbar`는 `.search`가 1열, `.select`가 2열, `.chips`가 전폭 다음 줄이다.
즉 화면 1행은 **`검색 | 정렬`**, 2행은 태그 칩 줄이다.
`.chips`를 `.select`보다 먼저 두면 **화면 순서와 Tab 순서가 어긋난다** — 눈은 정렬 셀렉트로
가는데 Tab은 칩 20개를 먼저 훑는다. 그리드 `order`로 시각 배치를 바꿔 맞추는 것은 금지다
(그 방법은 시각 순서만 고치고 탭 순서는 그대로 두므로 문제를 키운다).
축의 위계도 같은 순서다: **무엇을 찾을지(검색) → 어떻게 늘어놓을지(정렬) → 어떻게 좁힐지(태그)**.

- `.memo[data-color]` 6종: amber / mint / sky / rose / lilac / lime
- `.memo.is-pinned` : 고정 글
- `.memo.is-hidden` : 검색/필터로 걸러진 카드 (JS가 토글, CSS가 숨김+퇴장 페이드)
- `.memo-cat`은 보드에서 **`<span>`이다**(링크 아님). 카드 전체가 이미 글로 가는 링크라
  그 안에 두 번째 목적지를 넣으면 "어디를 눌러야 글이 열리는지"가 흐려진다.
  분류로 가는 링크는 상세 화면의 `.post-cat`이 맡는다(§5).

**JS가 `.memo`에 넣어야 하는 인라인 커스텀 프로퍼티 2개** — 없으면 모션이 죽거나 카드가 안 보인다.

| 변수 | 값 | 용도 |
|---|---|---|
| `--i` | 화면에 보이는 순번 0,1,2,… (필터 후 다시 매긴다) | 진입 stagger 지연. CSS가 `min(--i, 8)`로 상한을 건다 |
| `--rot` | `±0.6deg` 범위, **글 id 해시로 결정** | 메모지 기울기. 난수면 새로고침마다 보드가 흔들린다 |

- `.memo`는 `.is-visible`이 붙기 전까지 `opacity:0`이다(`prefers-reduced-motion: no-preference`일 때만).
  `.is-visible`은 `ui.js`의 IntersectionObserver가 붙인다. **이 호출을 빠뜨리면 카드가 영영 안 보인다.**
- **`.is-hidden`을 떼는 모든 경로에서 `reveal()`을 다시 불러야 한다** (v2.2 명문화 — 라운드 2 치명 T1).
  필터가 걸린 시점에 `.is-hidden`이던 카드는 관찰 대상에서 빠져 있으므로,
  필터를 풀어 다시 드러난 카드는 **`.is-visible`을 받을 기회가 영영 없다** → 빈 칸으로 남는다.
  `prefers-reduced-motion: reduce`에서는 즉시 클래스가 붙어 재현되지 않는다는 점이 이 결함을 숨긴다.
  대상은 `.memo:not(.is-hidden):not(.is-visible)` — 이미 보인 카드를 다시 관찰하면 진입 모션이 재생된다.

---

## 5. post.html — 글 상세

```html
<div class="progress"><div class="progress-bar" id="progressBar"></div></div>

<article class="post" id="post">
  <header class="post-head">
    <a class="back-link" href="index.html">← 목록</a>
    <a class="btn btn-ghost" id="postEdit" href="write.html?id=…" data-admin-only>수정</a>
    <!-- v2.2: span이 아니라 a. 같은 분류의 목록으로 가는 유일한 경로다. -->
    <a class="post-cat" id="postCat" href="index.html?cat=…">프론트엔드</a>
    <h1 class="post-title">…</h1>
    <p class="post-summary">…</p>
    <div class="post-meta">
      <time class="post-date" datetime="…">게시 2026.09.13</time>
      <time class="post-updated" datetime="…">최종 수정 2026.09.14</time>
      <span class="post-read">5분</span>
    </div>
    <!-- v2.3 확정: 상세의 태그는 링크다. <li class="tag">가 그릇, <a>가 눌리는 면. -->
    <ul class="post-tags">
      <li class="tag"><a href="index.html?tags=css">css</a></li>
    </ul>
  </header>

  <div class="post-body">
    <aside class="toc" id="toc">
      <p class="toc-title">목차</p>
      <nav class="toc-list"><a class="toc-item is-h2 is-active" href="#…">…</a></nav>
    </aside>
    <div class="prose" id="postBody"><!-- 마크다운 렌더 결과 --></div>
  </div>

  <nav class="post-nav">
    <a class="post-nav-item is-prev" href="…"><span class="post-nav-label">이전</span><span class="post-nav-title">…</span></a>
    <a class="post-nav-item is-next" href="…">…</a>
  </nav>
</article>

<div class="post-error" id="postError" hidden>…</div>
```

- `.post-head`는 **그리드**다. 1행 = `.back-link`(왼쪽) | `.btn`(오른쪽), 나머지는 전폭 1열.
  → **`.post-head`의 직계 자식 중 `.btn`은 수정 버튼 하나뿐이어야 한다.** 두 번째 `.btn`을 넣으면 겹친다.
  버튼을 더 넣어야 하면 계약서를 먼저 고친다.
- **`.post-cat`은 `<a>`다 (v2.2 확정).** 상세 화면에서 같은 분류의 글 목록(`index.html?cat=slug`)으로
  가는 **유일한 경로**다. 여기서 span으로 되돌리면 방문자는 "목록으로" → 카테고리 탭 재선택의
  2단계를 거쳐야 한다. 분류를 모르는 채 상세로 들어온 사람(검색 유입·직접 링크)이 가장 자주 쓰는 길이다.
  - 링크임을 알리는 **호버/포커스 신호 3종은 세트로 유지한다**(`components.css`의 `a.post-cat` 블록).
    하나만으로는 약하다 — 평상시 색이 이미 `--c-accent`라 `base.css`의 `a:hover`로는 픽셀 하나 안 바뀐다.

    | # | 신호 | 같은 어휘를 쓰는 곳 |
    |---|---|---|
    | 1 | 색이 깊어진다(액센트를 본문색 쪽으로 당김) | `.prose a:hover` |
    | 2 | 앞머리 막대가 자란다(`scale`, 레이아웃 재계산 0회) | `.memo-cat` / `.hero::before` |
    | 3 | 알약 틴트가 깔린다 | `.nav-link:hover` |
  - 글자 높이(≈14px)만으로는 터치 타깃을 못 채운다 → 세로 패딩으로 높이를 만들고 음수 마진으로
    제목과의 간격을 되돌린다. 높이는 `--h-control-sm`(32px, 터치 기기에서 44px로 자동 상승).
  - `id="postCat"`. 분류가 없는 글이면 `post.js`가 요소를 감춘다(빈 링크를 남기지 않는다).
  - 링크 텍스트는 분류 **이름**("CSS"), `href`는 **slug**(`?cat=css`).
    텍스트만으로는 목적지를 알 수 없으므로 `aria-label="OO 분류의 메모 모두 보기"`를 함께 넣는다.
- **`.post-tags`의 태그는 `<li class="tag"> > <a>` 다 (v2.3 확정).** 보드(`.memo-tags`)의 태그는
  글 카드 안의 **라벨**(`<li class="tag">`, 링크 아님)이고, 상세의 태그는 같은 태그를 가진 글 목록
  (`index.html?tags=…`)으로 가는 **링크**다. `.memo-cat`(span) ↔ `.post-cat`(a)와 정확히 같은 규칙이다 —
  카드 안에서는 카드 전체가 이미 링크라 두 번째 목적지를 넣지 않고, 상세에서는 넣는다.
  - 높이는 `<li>`가 갖고(`--h-control-sm`), `<a>`가 `block-size:100%`로 그 높이를 전부 채운다.
    **눌리는 면적 = `<li>`의 높이**이므로 터치 타깃 토큰은 `<li>` 쪽에 붙는다(`components.css`).
  - 태그 문자열은 `encodeURIComponent`로 감싼다. 쉼표가 든 태그는 왕복이 깨지므로 넣지 않는다.
- **본문 글줄 폭은 `--w-prose`(45rem)** 한 값으로 통일한다 (v2.3 — M3-4·5·6).
  `.post-head`(머리말 상자) · `.prose`(본문) · `.post-body`의 1열 트랙 · `.post-nav`(이전/다음)가
  **전부 같은 토큰**을 쓴다. **이 화면의 가로 기준선은 하나뿐이다.**
  `.post-head`와 `.post-nav`의 파선은 글의 위아래를 닫는 짝이라 길이가 같아야 한다.
  - 머리말 아래 파선의 오른쪽 끝 = 본문 글줄의 오른쪽 끝. 어긋나면 그 자체가 결함이다.
  - `.post-body`의 1열은 `minmax(0, var(--w-prose))`다. `1fr`로 되돌리면 1440px에서 트랙이
    816px까지 자라 본문(720px)과 목차 사이에 162px짜리 죽은 띠가 다시 생긴다.
  - **`.toc`에 `hidden`이 붙으면 2열 트랙 자체가 접힌다**(`layout.css`의 `:has(> .toc[hidden])`).
    `hidden`은 요소를 뺄 뿐 선언된 트랙을 지우지 않아, 예전에는 304px 유령 칸이 남았다.
    → `.toc`는 반드시 `.post-body`의 **직계 자식**이어야 한다. 래퍼를 끼우면 이 규칙이 죽는다.
- `.post.is-loading`은 `post.js`가 렌더를 마칠 때 뗀다. **CSS의 본문 진입 애니메이션이 이 시점을 트리거로 쓴다.**
  이 클래스를 안 떼면 본문이 반투명(0.38)인 채로 남고 진입 모션도 돌지 않는다.
- `.prose` 안의 요소는 태그 셀렉터로 스타일링한다(`.prose h2`, `.prose table`, `.prose pre` …). 마크다운이 만드는 결과라 클래스를 붙일 수 없다.
- 코드블록은 `<pre><code class="hljs language-js">`. `markdown.js`가 아래 구조로 감싸서 주입한다.
  **DOM 순서는 고정이다** — `prose.css`가 `.code-wrap`을 "머리띠 1행 + 코드 1행" 그리드로 그리는데
  라벨과 버튼이 같은 행(`grid-row:1`)의 1열/2열을 각각 잡기 때문이다.

  ```html
  <div class="code-wrap">
    <span class="code-lang" aria-hidden="true">JS</span>   <!-- v2.2 등재. 1열 -->
    <button class="code-copy" type="button" aria-label="JS 코드 복사">복사</button>  <!-- 2열 -->
    <pre><code class="hljs language-js">…</code></pre>      <!-- 2행 전폭 -->
  </div>
  ```
  - `.code-lang`은 **장식 라벨**이라 `aria-hidden="true"`다. 같은 정보가 `.code-copy`의
    `aria-label`("JS 코드 복사")에 이미 들어 있어, 빼지 않으면 스크린리더가 언어명을 두 번 읽는다.
  - 언어가 없는 코드블록은 `TEXT`로 채운다. 라벨 칸을 비우면 머리띠 높이가 코드블록마다 달라진다.
- 이미지는 `.prose img`, **표는 `.table-wrap` 안의 `.prose table` — 규칙 전체는 §7-1에 있다**(v2.3).

---

## 6. write.html — 에디터

```html
<!-- 관리자 스위치가 꺼져 있을 때만 보인다. .editor 앞에 둔다. -->
<div class="editor-visitor" id="editorVisitor" hidden>
  <p><strong>…</strong></p><p>…</p>
</div>

<div class="editor">
  <div class="editor-head">
    <input class="editor-title" id="fTitle" placeholder="제목">
    <p class="editor-mode" id="editorMode" hidden>수정 중 · 게시일은 보존됩니다</p>

    <!-- §10-4. .editor-fields 안이 아니라 .editor-head의 직계 자식이고,
         v2.2에서 순서를 .editor-mode 다음 / .editor-fields 앞으로 확정했다.
         (분류는 글이 저장될 폴더를 정하는 1차 축이라 요약·태그보다 먼저 결정돼야 한다) -->
    <div class="cat-picker">…</div>
    <div class="cat-new" id="catNew" hidden>…</div>

    <div class="editor-fields">
      <input class="field" id="fSummary"> <input class="field" id="fTags">
      <input class="field" id="fId">      <select class="field" id="fColor">
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

- `.editor-split[data-mode]` : `split` / `write` / `preview` 3상태. 모바일에선 자동으로 `write`.
- `.editor-status.is-dirty` : 내보내지 않은 변경이 있음 (경고색 + 점 맥동)
- `.editor-mode` : 수정 모드 배지. `hidden` 토글로만 켜고 끈다.
- `.editor-visitor` : 방문자 안내 박스. `hidden` 토글로만 켜고 끈다.
- `#fCategory`는 **`<input>`이 아니라 `.cat-picker` 안의 `<select>`** 다(§10-4).
- `.editor-head`의 직계 자식 순서는 **고정**이다(v2.2):
  `.editor-title` → `.editor-mode` → `.cat-picker` → `.cat-new` → `.editor-fields` → `.editor-actions` → `.editor-status`.
  근거는 §10-4.
- **미리보기 패널의 `.prose`는 본문과 같은 규칙에 "여백만 압축"한 것이다** (v2.3 등재, `prose.css` §10).
  `.preview-pane .prose`에서만 `h1/h2`의 위 여백이 `--sp-10` → `--sp-7`, `h3`은 `--sp-6`,
  `.code-wrap`/`.table-wrap`/`img`의 위아래 여백이 `--sp-5`로 줄어든다.
  좁은 칸에서 본문과 같은 여백을 쓰면 **같은 글을 두 배로 스크롤**하게 되기 때문이다.
  → 미리보기 전용 규칙은 이 네 줄이 전부다. **글자 크기·행간·색은 절대 다르게 두지 않는다**
  (미리보기는 "결과와 같은 것"이어야 한다. 다르면 글쓴이가 화면을 보고 잘못 판단한다).

---

## 7. 공용 컴포넌트

```
.btn .btn-primary .btn-ghost .btn-danger .icon-btn
.chip .chip.is-active
.tag
.toast .toast.is-ok .toast.is-warn .toast.is-err
.modal .modal-panel .modal-head .modal-body .modal-foot  (열림: body.modal-open + .modal.is-open)
.skeleton
.sr-only
.cat-nav .cat-item .cat-dot .cat-name .cat-count          (§10-3)
.cat-picker .cat-new .cat-new-hint                        (§10-4)
.footer-note .footer-meta                                 (§10-5)
.editor-visitor .editor-mode
.code-wrap .code-lang .code-copy                          (§5 — markdown.js가 주입)
.table-wrap                                               (§7-1 — markdown.js가 주입)
```

`.sr-only`는 `:focus`와 `:focus-visible` **둘 다**에서 화면에 드러난다.
스킵 링크는 키보드 사용자의 유일한 탈출구라 한 경우라도 새면 실패다(마크업은 §3-1).
`.sr-only`는 스킵 링크 외에 **보이지 않는 `<label>`** 로도 쓴다 — 입력칸의 이름은
`placeholder`가 아니라 `<label>`이 갖는다(placeholder는 입력을 시작하면 사라진다).

### 7-1. 표 (v2.3 신설 — 이 블로그의 일급 기능)

> **사용자 결정(라운드 3 종결).** 요구사항 #5의 "그래프"는 **정식으로 제외**한다.
> 그 자리를 **표**가 대신하며, 표는 부록이 아니라 본문과 같은 급으로 다룬다.
> **인라인 SVG는 허용하지 않는다** — 살균 표면을 넓히지 않는다는 결정이 그래프 제외보다 우선한다.
> `markdown.js`의 `USE_PROFILES: { html: true }`(= SVG/MathML 프로파일 미사용)는 **유지**한다.
> 도표가 꼭 필요하면 이미지(`.prose img`)로 삽입한다.

**마크업 — `markdown.js`가 모든 `<table>`을 아래 구조로 감싼다. 클래스·속성 4개는 필수다.**

```html
<div class="table-wrap" role="region" aria-label="표" tabindex="0">
  <table>
    <thead><tr><th>이름</th><th align="center">상태</th><th align="right">횟수</th></tr></thead>
    <tbody><tr><td>…</td><td align="center">…</td><td align="right">12</td></tr></tbody>
  </table>
</div>
```

| 속성 | 없으면 생기는 일 |
|---|---|
| `class="table-wrap"` | 표가 페이지를 통째로 넘쳐 360px에서 가로 스크롤이 생긴다(요구사항 #6 위반) |
| `tabindex="0"` | 마우스가 없는 사용자는 넘친 표의 오른쪽 절반을 **영영 볼 수 없다** |
| `role="region"` + `aria-label` | 포커스 가능한 익명 `div`가 되어 스크린리더가 "무엇에 들어왔는지" 알리지 못한다 |
| `align`(정렬) | 아래 "정렬" 항목 참조 — 글쓴이가 지정한 정렬이 통째로 무시된다 |

**정렬 — GFM `|:---|:---:|---:|`**

- `marked@12`는 정렬을 **`align` 속성**(`left` / `center` / `right`)으로 낸다. 인라인 `style`이 아니다.
- `align`은 "표현 힌트"라 작성자 CSS의 `text-align: start` 한 줄에 **무조건 진다.**
  그래서 `prose.css`가 `.prose td[align="right"]` 같은 **속성 선택자로 다시 켠다**(v2.3).
  이 규칙이 없으면 정렬 문법이 화면에 아무 영향도 주지 못한다(v2.2까지 실제로 그랬다).
- **`markdown.js`의 살균 설정은 `align` 속성을 유지해야 한다.** DOMPurify의 html 프로파일은
  기본으로 허용하지만, `FORBID_ATTR`에 넣거나 `ALLOWED_ATTR`를 직접 지정하게 되면
  정렬 기능이 조용히 죽는다. → **표 정렬을 바꾸는 작업을 할 때는 `---:` 열이 실제로
  오른쪽으로 붙는지 눈으로 확인한다.**
- 권장: **숫자 열은 `---:`(끝 정렬)**. 자릿수가 세로로 맞아야 비교가 된다
  (`.prose table`이 `font-variant-numeric: tabular-nums`를 이미 걸어 둔다).

**넘치는 표 / 긴 표**

| 상황 | 규칙 | 근거 |
|---|---|---|
| 표가 글줄 폭보다 좁다 | `.table-wrap`이 내용만큼만 차지한다(`inline-size: fit-content`) | 2열 표를 720px로 늘리면 값과 값 사이를 눈으로 건널 수 없다 |
| 표가 글줄 폭보다 넓다 | 페이지가 아니라 **표만** 가로로 스크롤된다 | 페이지 가로 스크롤은 그 자체로 결함이다 |
| 가로로 스크롤할 수 있다 | 양 끝의 **덮개 + 그림자**가 밀려나며 알리고, 얇은 스크롤바가 함께 보인다 | "옆에 더 있다"를 모르면 없는 열이다. JS 0줄 |
| 표가 `--h-table-max`(72dvh)보다 길다 | `.table-wrap` 안에서 세로로 스크롤되고 **`thead`가 sticky로 붙는다** | 헤더를 잃은 채 20행을 읽는 것보다 낫다. 짧은 표에는 아무 영향이 없다 |
| 세로 스크롤 체인 | 가로만 `contain`, **세로는 끊지 않는다** | 표 끝에서 페이지 스크롤로 이어지지 않으면 손가락이 갇힌다 |

**하지 않기로 한 것 (묻기 전에 답한다)**

- **첫 열 고정(sticky column)을 하지 않는다.** GFM 표에는 "행 이름" 개념이 없어
  `td:first-child`를 임의로 머리 열로 승격하는 셈이 된다. 게다가 고정하려면 셀마다 불투명
  배경이 필요해 얼룩말 줄무늬가 깨진다. 표가 그만큼 넓으면 열을 줄이는 것이 맞다.
- **정렬 가능한 표(클릭 정렬)를 넣지 않는다.** 정적 사이트의 `.prose`는 클래스를 붙일 수 없는
  영역이고(§5), 상태를 가진 컨트롤이 본문에 섞이는 순간 인쇄·복사·스크린리더가 전부 어긋난다.

---

## 8. JS가 건드리는 상태 클래스 (CSS는 이것만 받아쓴다)

**토글되는 상태 (JS가 붙였다 뗀다)**

`is-active` `is-open` `is-stuck` `is-hidden` `is-dirty` `is-loading` `is-pinned` `is-visible` `is-empty`

**생성 시점에 정해져 바뀌지 않는 분류 클래스 (v2.3 등재 — M3-8-①)**

`is-h2` `is-h3` — 목차 항목의 제목 등급(`.toc-item`). `markdown.js`가 만든다.
`is-prev` `is-next` — 이전/다음 글 카드(`.post-nav-item`). `post.js`가 만든다.
`is-ok` `is-warn` `is-err` — 토스트 종류(`.toast`). `ui.js`가 만든다.

> 이 7개는 v2.2까지 목록에 없었지만 **계약서 자신의 §5·§7 마크업 예시가 이미 쓰고 있었다.**
> 코드가 옳고 목록이 빠져 있었던 것이므로 **코드는 그대로 두고 여기에 등재한다.**
> `is-` 접두사는 "상태"만이 아니라 "이 요소가 지금 어느 갈래인가" 전부를 뜻한다.
> `.toc-item.is-h2`처럼 **CSS 규칙이 없는 것도 정상**이다 — 기본 상태가 곧 h2이고,
> `is-h3`만 들여쓰기를 더한다. 규칙이 없다고 지우지 말 것(라운드 3 판정).

그 외 상태 클래스가 필요하면 계약서를 먼저 갱신한다.

`body.modal-open` `body.admin-off` 는 body에만 붙는 예외다.

### 8-1. 모션이 JS 타이밍에 거는 제약 (깨면 화면에 잔상이 남는다)

| 동작 | JS 쪽 타이밍 | CSS가 맞춰 둔 시간 |
|---|---|---|
| 토스트 퇴장 | `is-visible` 제거 후 **400ms** 뒤 DOM 제거 | 260ms (`--dur`) |
| 모달 닫힘 | `is-open` 제거 후 **220ms** 뒤 DOM 제거 | 160ms (`--dur-fast`) |
| 모달 열림 | append → **다음 rAF**에 `is-open` | 420ms (`--dur-slow`) |

이 숫자를 JS에서 줄이면 요소가 사라지는 중간에 잘린다. 늘릴 때는 상관없다.

**`.modal`은 `.is-open`이 없는 동안 `pointer-events: none`이다 (v2.3 — M3-10).**
닫히는 220ms 동안 딤이 화면 전체를 덮은 채 남아 직후의 첫 클릭을 삼켰다(사용자에게는
"버튼이 한 번 안 먹는 사이트"로 보인다). → **JS는 모달을 닫자마자 다른 UI를 띄워도 된다.**
반대로, 모달을 열어 두고 `.is-open`을 늦게 붙이면 그 사이에는 클릭이 통과한다는 뜻이기도 하다 —
`append → 다음 rAF에 .is-open`이라는 순서를 바꾸지 말 것.

### 8-2. 진입 모션의 두 갈래 — `[data-reveal]` 폐기 (v2.2)

**결정: `[data-reveal]` 훅을 걷어낸다(B안).** 계약서에 정식 등재하지 않는다.

라운드 2 감사에서 "세 HTML 어디에도 `[data-reveal]`이 없어 JS(`app.js:519`, `post.js:185`)와
CSS(`animations.css:210,227,462`)가 통째로 사문화"라는 지적이 나왔다.
검토 결과 **이 훅은 되살릴 자리가 없다.** 이 사이트의 진입 모션은 이미 두 갈래로 완결돼 있다.

| 갈래 | 대상 | 방식 | 실패 시 |
|---|---|---|---|
| A. 정적 마크업 | 히어로·`.cat-nav`·`.toolbar`·`.post-head`·`.post-nav` | CSS 단독 `animation … backwards` (`animations.css` 3~6절) | JS가 죽어도 **끝나면 보인다** |
| B. JS 생성 콘텐츠 | `.memo` | `opacity:0` → IO가 `.is-visible` 부착 | JS가 죽으면 요소 자체가 없다 → 손해 없음 |

`[data-reveal]`은 **정적 마크업(A)에 B의 방식을 덧씌우는 제3의 경로**였다.
그런데 B의 "보일 때까지 `opacity:0`"은 *JS가 만든 요소에만* 안전하다. 정적 마크업에 붙이면
**"JS가 성공했을 때만 보이는 정적 콘텐츠"** 가 되어 실패 모드가 새로 생긴다. 실제로

- `app.js:519`의 호출은 `Promise.all(...).then()` **성공 분기 안에만** 있다 → `index.json` 로드
  실패 화면에서는 `[data-reveal]` 요소가 영구 불가시.
- `post.js:185`도 렌더 성공 경로에만 있다 → 본문 렌더 실패 시 오류 화면의 요소가 영구 불가시.

이건 라운드 2의 치명 결함 T1(필터 해제 후 카드가 영영 안 보임)과 **정확히 같은 유형의 사고**다.
장식 하나를 얻자고 "안 보임" 리스크를 정적 콘텐츠로 확산시킬 이유가 없다.

**그래서 규칙으로 승격한다 — `opacity:0`으로 시작하는 요소는 JS가 만든 요소여야 한다.**
정적 마크업의 진입 모션은 CSS 단독 애니메이션(갈래 A)으로만 만든다.
훗날 스크롤 트리거가 다시 필요해지면 이 규칙을 만족하는 형태로 계약서에 새로 등재한다.

**개발자가 할 일(삭제):** `js/app.js:519`, `js/post.js:185`의 `Blog.ui.reveal('[data-reveal]')` 호출 줄,
그리고 `js/ui.js:97`의 기본 선택자 `'.memo, [data-reveal]'` → `'.memo'`.
`Blog.ui.reveal()` 함수 자체는 `.memo`용으로 계속 쓴다(T1 수정에도 필요하다).
CSS 쪽 `[data-reveal]` 규칙 3곳은 **web-designer가 이미 제거했다.**

---

## 9. 데이터 계약

`posts/index.json`
```json
{
  "site": { "title": "…", "subtitle": "…" },
  "posts": [
    { "id":"2026-09-13-css-grid", "title":"…", "summary":"…",
      "created":"2026-09-13T14:20:00+09:00", "updated":"2026-09-13T14:20:00+09:00",
      "tags":["css"], "category":"프론트엔드", "color":"amber", "pinned":false }
  ]
}
```
`posts/<id>.md` 최상단에 동일한 필드의 YAML frontmatter.

---

## 10. 카테고리 (v2 신규)

사용자 요구: **카테고리별로 나눠서 따로 메모하고, 카테고리를 직접 추가할 수 있어야 한다.**

### 10-1. 폴더 구조

```
posts/
  categories.json          카테고리 정의 (사용자가 직접 편집 가능)
  index.json               전체 글 메타 목록
  <카테고리slug>/           카테고리별 폴더 — 파일 가독성의 핵심
    YYYY-MM-DD-slug.md
```

글 파일 경로는 항상 `posts/<category>/<id>.md`. `category`는 categories.json의 `slug`와 일치해야 한다.
슬러그가 없는 카테고리를 가리키면 `_uncategorized` 폴더로 폴백한다.

### 10-2. categories.json

```json
{
  "categories": [
    { "slug": "guide", "name": "안내", "color": "amber", "description": "블로그 사용법", "order": 0 }
  ]
}
```
- `slug`: 폴더명. 영문 소문자·숫자·하이픈만. **한 번 정하면 바꾸지 않는다**(바꾸면 글 경로가 전부 깨진다)
- `color`: 메모지 6색 중 하나 — 카테고리 기본색. 글에서 `color`로 개별 덮어쓰기 가능
- `order`: 네비게이션 정렬 순서

### 10-3. 카테고리 네비게이션 (index.html)

**위치: `index.html`의 `.hero` 바로 뒤, `.toolbar` 바로 앞.**
"분류를 고른 뒤 그 안에서 검색·태그"라는 순서가 DOM 순서·시선 순서 양쪽에서 같아야 한다.
`.toolbar`는 sticky지만 `.cat-nav`는 아니다 — 분류는 한 번 고르는 선택이고, 검색은 계속 만지는 손잡이다.

```html
<nav class="cat-nav" id="catNav" aria-label="카테고리">
  <button class="cat-item is-active" type="button" data-cat="*" aria-current="true">
    <span class="cat-name">전체</span><span class="cat-count">3</span>
  </button>
  <!-- title은 categories.json의 description. 있을 때만 붙인다(v2.2 등재) -->
  <button class="cat-item" type="button" data-cat="css" data-color="sky" title="스타일과 레이아웃">
    <span class="cat-dot" aria-hidden="true"></span>
    <span class="cat-name">CSS</span><span class="cat-count">1</span>
  </button>
  <button class="cat-item is-empty" type="button" data-cat="db" data-color="lilac">
    <span class="cat-dot" aria-hidden="true"></span>
    <span class="cat-name">DB</span><span class="cat-count">0</span>
  </button>
</nav>
```

- 카테고리는 **단일 선택**(태그 칩 `.chip`은 다중 선택 — 둘은 다른 축이다)
- **`aria-pressed`가 아니라 `aria-current="true"`를 쓴다. (v2.1 변경)**
  칩과 카테고리가 둘 다 `aria-pressed`면 스크린리더에는 양쪽 다 "눌림"으로만 들려서
  화면에서 애써 구분해 놓은 두 축이 음성에서 도로 뭉개진다.
  선택된 항목에만 `aria-current="true"`를 넣고, 나머지에서는 **속성을 지운다**(`false` 아님).
- **`title` 속성 (v2.2 등재)** — `categories.json`의 `description`을 그대로 넣는다.
  값이 없으면 속성 자체를 붙이지 않는다(빈 `title=""`은 툴팁만 죽이고 마크업만 늘린다).
  - **제약: `title`로 접근성을 대체하지 않는다.**
    `title`은 마우스 호버에서만 뜬다 — 터치 사용자는 볼 수 없고, 키보드 포커스로는 대부분의
    브라우저가 띄워 주지 않으며, 스크린리더는 설정에 따라 읽거나 읽지 않는다.
    즉 **"있으면 좋은 덤"까지만 담는다.**
  - 다음은 `title`에만 두면 안 된다 → 화면 텍스트나 `aria-label`로 옮긴다.

    | 성격 | 예 | 둘 곳 |
    |---|---|---|
    | 버튼의 이름 | "CSS 분류" | `.cat-name`의 텍스트 |
    | 되돌릴 수 없는 결정의 경고 | slug 불변 경고 | 화면 문구(`.cat-new-hint`, §10-4) |
    | 상태·개수 | 글 3편 | `.cat-count`의 텍스트 |
    | 단축키 안내 | Ctrl+S | `aria-keyshortcuts` + 화면 문구 |
  - 카테고리 설명은 위 어디에도 해당하지 않는 보조 정보라 `title`만으로 충분하다.
    설명이 **선택에 필요한 정보**가 되는 날이 오면 그때는 `title`이 아니라 화면에 내놓는다.
- `data-color`는 `.cat-item`에 붙인다. `.cat-dot`이 그 값을 상속해 색을 받는다. 메모지 6색만 유효.
- 선택 상태는 URL 쿼리 `?cat=slug`에 반영
- 빈 카테고리는 네비에 표시하되 `.is-empty`를 붙인다
  (CSS는 `opacity`가 아니라 한 단계 낮은 **색 토큰**으로 내린다 — 대비 4.5:1을 지키기 위함)
- `.cat-nav`는 모바일에서 **가로 스크롤 + 스크롤 스냅**이다. 줄바꿈하지 않는다.
  카테고리가 10개여도 높이가 변하지 않아야 아래 보드가 위아래로 밀리지 않는다.

**칩과 시각적으로 겹치면 안 되는 이유와 그 구현** — 개발자는 이 표를 깨는 마크업을 쓰지 않는다.

| 축 | `.cat-item` (카테고리) | `.chip` (태그) |
|---|---|---|
| 그릇 | 음각 레일 위의 탭 | 그릇 없음, 낱개로 떠 있음 |
| 윤곽 | 사각 라운드(`--r-md`), 테두리 없음 | 완전 알약(`--r-full`), 1px 실선 |
| 글자 | `--fs-md` / 700 | `--fs-sm` / 600 |
| 색 신호 | 카테고리 색 점 + 색 밑줄 | 없음 |
| 선택 | 종이가 떠오름(흰 면 + 그림자) | 액센트 틴트가 채워짐 |
| 선택 개수 | 1개 | 여러 개 |
| ARIA | `aria-current="true"` | `aria-pressed` |

### 10-4. 에디터의 카테고리 추가 (write.html)

**위치: 둘 다 `.editor-head`의 직계 자식. `.editor-mode` 다음, `.editor-fields` 앞. (v2.2 변경)**

두 가지를 동시에 만족시키는 자리다.

1. **`.editor-fields` 안이 아니다.** 그 auto-fit 그리드의 180px 칸에 셀렉트와 "+ 새 카테고리"
   버튼이 함께 끼면 둘 다 못 읽는다. 게다가 `.cat-new`는 펼쳐지면 입력칸 3개 + 버튼 2개라
   한 줄을 통째로 가져야 한다.
2. **`.editor-fields`보다 앞이다.** 분류는 **글이 실제로 저장될 폴더(`posts/<slug>/`)를 정하는
   유일한 필드**이고, 새 데이터(카테고리)를 만들 수 있는 유일한 필드이기도 하다.
   요약·태그·색은 나중에 `.md`에서 고쳐도 그만이지만 분류는 파일 경로를 바꾼다.
   §10-3에서 "1차 축(카테고리)이 2차 축(검색·태그)보다 먼저 온다"고 못 박은 것과 같은 규칙을
   에디터에도 적용한다 — **읽는 화면과 쓰는 화면에서 축의 순서가 뒤집히면 안 된다.**

즉 제목 → (수정 중 배지) → **분류** → 나머지 메타 → 동작 버튼 순으로 내려간다.

```html
<div class="cat-picker">
  <label class="sr-only" for="fCategory">분류</label>
  <select class="field" id="fCategory"></select>
  <button class="btn btn-ghost" type="button" id="btnNewCat">+ 새 카테고리</button>
</div>

<div class="cat-new" id="catNew" hidden>
  <p class="cat-new-hint">
    폴더명은 <strong>한 번 정하면 바꾸지 않는다.</strong> 영문 소문자·숫자·하이픈만.
  </p>
  <label class="sr-only" for="fNewCatName">표시 이름</label>
  <input class="field" id="fNewCatName" placeholder="표시 이름">
  <label class="sr-only" for="fNewCatSlug">폴더명 (영문)</label>
  <input class="field" id="fNewCatSlug" placeholder="폴더명 (영문)">
  <label class="sr-only" for="fNewCatColor">카테고리 색</label>
  <select class="field" id="fNewCatColor"></select>
  <button class="btn" type="button" id="btnAddCat">추가</button>
  <button class="btn btn-ghost" type="button" id="btnCancelCat">취소</button>
</div>
```
- `.cat-new-hint`는 **입력칸보다 먼저** 온다. slug를 되돌릴 수 없다는 사실은 타이핑 전에 읽혀야 한다.
- `.cat-new`는 `hidden` 속성으로만 토글한다. `display` 변화에 CSS가 펼침 애니메이션을 건다.
- 새 카테고리를 만들면 **내보내기 시 `categories.json`도 함께 다운로드**된다
- 내보내기 안내에 **`posts/<slug>/` 폴더를 만들어 .md를 넣으라**고 명시해야 한다

### 10-5. 푸터 (v2 변경)

```html
<footer class="site-footer">
  <p class="footer-note">&copy; 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다</p>
  <p class="footer-meta"><span data-site-title>메모 블로그</span> · <span data-year>2026</span></p>
</footer>
```
`.footer-note`가 주 문구, `.footer-meta`가 보조. 세 페이지 모두 동일.

### 10-6. 폴더 구조 변경 (v2)

`assets/css/` → **`css/`**, `assets/js/` → **`js/`**. HTML 3개는 GitHub Pages 요구상 루트 유지.

---

## 11. CSS 파일 지도 (v2.1 신설)

로드 순서는 고정이다. 순서가 곧 특이도 조정 수단이라 바꾸면 덮어쓰기 관계가 뒤집힌다.

| 파일 | 책임 | 여기에 쓰면 안 되는 것 |
|---|---|---|
| `tokens.css` | 값의 단일 출처(색·타이포·간격·반경·그림자·모션·치수) | 선택자 규칙 |
| `base.css` | 리셋, 루트 타이포, 폼 기본, 포커스 링, 배경 레이어 | 컴포넌트 이름 |
| `layout.css` | 화면 골격(헤더/메인/푸터/히어로/툴바/보드/글/에디터) | 재사용 부품의 생김새 |
| `components.css` | 재사용 부품의 **정지 상태** 생김새 | 등장·퇴장 모션 |
| `prose.css` | 마크다운 결과물(`.prose` 안) | 클래스 기반 규칙 |
| `animations.css` | `@keyframes` + **상태 사이의 시간** 전부 | 색·크기 같은 정지 값 |

**정지/모션 분업의 실제 규칙 두 가지** — 이걸 어기면 hover와 진입 애니메이션이 서로를 지운다.

1. `transform`은 **진입·퇴장 애니메이션 전용**(`animations.css`),
   `translate` / `rotate` / `scale` 개별 속성은 **hover·active 전용**(`components.css`).
2. "접힘/펼침" 같은 **상태 표시**는 `components.css`에 둔다.
   `animations.css`가 로드되지 않아도 화면이 틀린 상태로 보이면 안 되기 때문이다.
   `animations.css`는 두 상태를 잇는 `transition`/`animation`만 맡는다.

`animations.css` 끝에는 `@media (prefers-reduced-motion: reduce)` 블록이 있고,
**새 애니메이션을 추가하면 그 블록도 함께 점검한다.** 무한 루프는 `animation: none`으로 끈다.

### 11-1. 같은 부품을 두 파일에 나눠 쓰지 않는다 (v2.2)

`layout.css`와 `components.css`의 경계는 "골격 vs 부품"이지 "먼저 쓴 곳 vs 나중에 쓴 곳"이 아니다.
한 부품의 규칙이 두 파일에 흩어지면 로드 순서에 따라 **뒤에 오는 파일이 앞의 값을 조용히 이긴다.**
고치러 온 사람은 한쪽만 보고 "값을 고쳤는데 화면이 안 바뀐다"를 겪는다.

| 선택자 | 사는 곳 | 판별 기준 |
|---|---|---|
| `.post-nav` | `layout.css` | 그리드 골격(1열↔2열, 위 여백, 점선 구분) |
| `.post-nav-item` `.post-nav-label` `.post-nav-title` | `components.css` | 카드 부품의 생김새(테두리·배경·hover) |
| `.back-link` | `components.css` | 부품(터치 타깃·패딩) |
| `.toc` `.toc-title` `.toc-list` `.toc-item` | `components.css` | 부품 전부 — 상자·레일·`is-h3` 들여쓰기·`is-active`·**1024px sticky 고정까지** (v2.3 등재) |
| `.post-body`의 **트랙**과 `.toc`의 **자리** | `layout.css` | `grid-template-columns`, `> .toc { grid-column: 2 }`, `:has(> .toc[hidden])` 접기 |
| `.site-header::after`(헤더 밑선) | `layout.css` = 존재·색 / `animations.css` = 시간 | v2.3 이관. 선 자체는 골격이라 모션 파일이 없어도 남아야 한다 |
| `.skeleton`의 `--sheen-hi` | `components.css` | v2.3 이관. **색은 정지 값**이라 모션 파일에 두지 않는다(움직임만 `animations.css`) |

v2.2에서 `.post-nav-item` / `.post-nav-label` / `.post-nav-title` / `.back-link`의 정지 스타일을
`layout.css` → `components.css`로 이관했다.
`layout.css`에는 **자리 배정만** 남는다 — `.post-nav`의 그리드와 768px 열 전환,
`.post-head > .back-link { grid-column:1; grid-row:1 }` 같은 배치 규칙.

**목차가 두 파일에 걸치는 이유**(v2.3): `.toc`는 "부품"이면서 동시에 "2열 그리드의 한 칸"이다.
경계는 **"목차 혼자 있어도 성립하는가"**로 가른다 — 상자·레일·sticky는 목차만 보면 정해지므로
`components.css`, 트랙 폭과 접힘은 `.post-body`를 봐야 정해지므로 `layout.css`다.

### 11-2. 리터럴 금지의 범위 (v2.2 명확화)

| 값 | 리터럴 허용? | 이유 |
|---|---|---|
| 색·그림자·간격·폰트·반경·이징·지속시간 | **금지** | 전부 `tokens.css`에 있다 |
| **누를 수 있는 것의 최소 크기**(`min-block-size` 등) | **금지** | 터치 타깃 기준과 직결. `--h-control`(40/44) `--h-control-sm`(32/44) `--h-nav`(36/44) `--h-control-xs`(30/40)를 쓴다. **이 네 토큰만 `pointer:coarse`에서 자동 상승한다** — 리터럴로 쓰면 그 상승을 통째로 놓친다 |
| 포커스·상태 글로우의 링 두께 | **금지** | `--ring-w`(3px). 같은 3px이 7곳에 복사돼 있었다(v2.3에서 통일) |
| 무한 루프 1주기 | **금지** | `--dur-loop`. 스켈레톤 광택과 상태 점 맥동이 같은 맥박을 쓴다 |
| 한 애니메이션 안에서만 의미를 갖는 stagger 지연 (`46ms`, `130ms`, `90ms` 배수) | 허용 | 그 keyframes와 함께만 의미가 있다. 토큰화하면 "무엇의 46ms인지"가 사라진다 |
| 누를 수 없는 라벨의 치수 (`.tag` 24px 같은 알약 높이) | 허용 | 터치 타깃 판정 대상이 아니다 |
| 한 부품 안에서만 의미를 갖는 도형 치수 (압정 16px, 쐐기 56px, 노이즈 타일 180px, 표 가장자리 그림자 22px) | 허용 | 토큰화해도 재사용처가 없고, 이름이 오히려 의미를 흐린다 |

판별법: **"이 숫자가 다른 곳에서도 같아야 하는가?"** 그렇다면 토큰이다.
그리고 **"손가락이 이걸 누르는가?"** 그렇다면 높이 토큰이다.

**높이 토큰 사용처 (v2.3 — 실측으로 교체. 이 표가 곧 검증 목록이다)**

| 토큰 | coarse | 사용처 |
|---|---|---|
| `--h-control` | 40 → 44 | `.btn` `.icon-btn` `.chip` `.cat-item` `.search-input` `.select`/`select.field` `.field` `.switch` `.sr-only:focus` |
| `--h-control-sm` | 32 → 44 | `a.post-cat` · `.memo-act` · **`.post-tags .tag`** · **`.md-btn`** · `.code-copy` · `.prose summary` |
| `--h-nav` | 36 → 44 | `.nav-link` · **`.brand`** · `.back-link` |
| `--h-control-xs` | 30 → 40 | `.search-clear` (하나뿐 — §2의 신설 근거 참조) |

> v2.2의 목록은 양방향으로 틀려 있었다(M3-8-②): `.post-tags .tag > a`는 이 토큰을 쓴 적이 없고
> (높이는 `<li class="tag">`가 갖는다 — §5), `.md-btn`은 쓰고 있는데 목록에 없었다.
> **굵은 글씨 3개가 v2.3에서 정정·추가된 항목이다.**

**높이 상승은 `tokens.css`의 `@media (pointer: coarse)` 한 곳에서만 한다 (v2.3 규칙 승격).**
다른 파일에서 `@media (pointer: coarse) { … min-block-size: var(--h-control) }`로 다시 올리지 않는다.
v2.2까지 `components.css`에 4건, `prose.css`에 1건이 있었고 **지금은 값이 같아 티가 나지 않았을 뿐**,
토큰을 고치는 순간 한쪽만 따라오는 코드였다. coarse 블록에는 **토큰으로 표현되지 않는 것**
(가로 패딩 `.memo-act`, 세로 패딩 `.toc-item`)만 남긴다.

### 11-3. 반응형 분기점 (v2.3 신설)

미디어쿼리는 **아래 다섯 값만** 쓴다. 크기 변화는 `clamp()`가, 배치 전환만 미디어쿼리가 맡는다.

| 분기 | 방향 | 무엇이 바뀌는가 |
|---|---|---|
| 360px | (기준선) | 여기서 가로 스크롤이 생기면 실패다. 분기 자체는 없다 |
| 440px | `max-width` | `.site-nav` 소거(§3-2) / 본문 코드·인용·표·목록의 좌우 패딩 압축 |
| 768px | `min-width` | `.post-nav` 1열 → 2열, 토스트가 오른쪽 아래로 |
| 1024px | `min-width` | `.post-body` 2열(본문 + 목차), `.toc` sticky, 에디터 split |
| 1440px | `min-width` | 보드 카드 최소 폭 280 → 300px |

`prose.css`가 혼자 쓰던 `480px`은 **440px로 통합했다**(v2.3). 같은 "좁은 폰" 경계가 두 값이면
440~480px 구간에서 내비는 사라졌는데 본문 패딩은 그대로인 어중간한 화면이 생긴다.
440px는 현행 대형 폰(430px)까지 덮는 최소값이다.

---

## 12. 변경 이력

### v2.3 (라운드 4) — 확정 결함 반영 + 표의 일급 승격

| 절 | 변경 전 | 변경 후 |
|---|---|---|
| §7-1 | 표 규칙이 §5의 한 줄("JS가 감싼다")뿐 | **신설.** 마크업 4속성·GFM 정렬·넘침/길이 규칙·"하지 않기로 한 것"까지 등재. **요구사항 #5의 그래프 제외 + 인라인 SVG 불허**를 명문화 |
| §5 | `<ul class="post-tags"><li class="tag">css</li>` | **`<li class="tag"><a href="index.html?tags=…">`** + 높이를 `<li>`가 갖는 이유 |
| §5 | 본문 폭 기준 `--w-content`(72ch) | **`--w-prose`(45rem)** — 머리말·본문·1열 트랙이 한 값. `.toc[hidden]`이면 2열 트랙이 접힌다(`.toc`는 `.post-body` 직계 자식 필수) |
| §6 | 미리보기 전용 여백 미등재 | `.preview-pane .prose` 4줄 등재 + "글자 크기·행간·색은 다르게 두지 않는다" |
| §8 | 상태 클래스 9개 | **+7개**(`is-h2 is-h3 is-prev is-next is-ok is-warn is-err`). "CSS 규칙이 없는 것도 정상"을 명문화 |
| §8-1 | 모달 닫힘은 시간만 규정 | `.modal:not(.is-open){pointer-events:none}` 등재 — 닫히는 220ms 동안 클릭을 삼키지 않는다 |
| §11-1 | `.toc` 행 없음 | `.toc` 계열 + `.site-header::after` + `.skeleton --sheen-hi` 행 추가, "목차가 두 파일에 걸치는 이유" |
| §11-2 | `--h-control-sm` 사용처 목록이 양방향 오류 | **실측 표로 교체**(4토큰 × 사용처) + `--h-control-xs` `--ring-w` `--dur-loop` 등재 + "높이 상승은 tokens.css 한 곳에서만" 규칙 승격 |
| §11-3 | 분기점 규정 없음 | **신설.** 360/440/768/1024/1440 다섯 개로 확정, `prose.css`의 480px을 440px로 통합 |
| §3-2 | `layout.css:569-572` | `layout.css:553-556` (줄번호 오기 정정) + `.brand` 터치 타깃 규칙 |
| §2 | 토큰 목록 | `--w-prose` `--h-control-xs` `--h-table-max` `--ring-w` `--sh-focus` `--dur-loop` 추가 |

**같은 라운드에 web-designer가 수행한 CSS 변경**(계약서와 짝을 이룬다)

- `components.css` — `.modal-body`의 `ul/ol/li/::marker/code` 규칙 신설(M3-2. 내보내기 절차가
  번호 없는 평문으로 나오던 것), 블록 리듬을 `> p + p` → `> * + *`로 확대
- `animations.css` — `.modal:not(.is-open){pointer-events:none}` 추가(M3-10)
- `tokens.css` — `--w-prose` `--h-control-xs` `--h-table-max` `--ring-w` `--sh-focus` `--dur-loop` 신설
- `layout.css` — `.post-head`/`.post-body`/`.post-nav` 폭을 `--w-prose`로 통일(M3-5·M3-6),
  `:has(> .toc[hidden])` 트랙 접기(M3-4), `.brand` 터치 타깃, `.site-header::after`의 정지 값 이관
- `components.css`/`prose.css` — 터치 타깃 리터럴 3건 토큰화(M3-9) +
  값이 같은 coarse 높이 재선언 **5건** 제거(`.md-btn` `.memo-act` `.post-tags .tag` `.back-link` `.code-copy`.
  회의록이 지적한 3건보다 많다 — 같은 유형을 전부 찾아 걷었다) +
  `.search-clear`의 coarse 블록은 `--h-control-xs` 토큰으로 대체,
  포커스 글로우 `0 0 0 3px` 7곳 토큰화
- `prose.css` — 표 전면 개정(§7-1의 구현), 좁은 화면 분기 480 → 440px
- `components.css` — `.skeleton`의 `--sheen-hi`를 `animations.css`에서 이관

### v2.2 (라운드 3) — 판정 반영 + 훅 정리

| 절 | 변경 전 | 변경 후 |
|---|---|---|
| §3 | 스킵 링크 미등재 | §3-1 신설 — `body` 첫 자식, `#main`, `<main tabindex="-1">` 필수 |
| §3 | `.site-nav` 항목이 "메모" 하나 | "쓰기"(`data-admin-only`) 등재 + §3-2 440px 소거·대체 경로 규칙 |
| §4 | 툴바 순서 `search → chips → select` | **`search → select → chips`** (DOM=시선=Tab 순서) |
| §4 | `.memo-cat` 성격 미기재 | 보드에서는 `<span>`임을 명시(링크는 `.post-cat`이 맡음) |
| §5 | `<span class="post-cat">` | **`<a class="post-cat" id="postCat" href="index.html?cat=…">`** + 호버 신호 3종·터치 타깃·`aria-label` 명문화 |
| §5 | 코드블록 = `.code-wrap` + `.code-copy` | `.code-lang` 등재, `.code-wrap` 내부 DOM 순서 고정, `aria-hidden` 근거 |
| §6 | `.cat-picker`가 `.editor-fields` **다음** | `.editor-mode` 다음 / `.editor-fields` **앞** + `.editor-head` 직계 순서 고정 |
| §7 | 목록에 마크다운 후처리 부품 없음 | `.code-wrap .code-lang .code-copy .table-wrap` 추가 |
| §8 | `[data-reveal]` 언급 없음(코드에만 존재) | §8-2 신설 — **폐기 결정(B안)** + "`opacity:0` 시작은 JS 생성 요소만" 규칙 |
| §10-3 | `.cat-item[title]` 미등재 | 등재 + "title로 접근성을 대체하지 않는다" 제약표 |
| §10-4 | 위치 근거가 "그리드 칸이 좁다" 하나 | 근거 2개(그리드 + 1차 축 우선)로 확장, 순서 확정 |
| §11 | 파일 지도만 | §11-1 부품 분산 금지(`.post-nav-item` 이관), §11-2 리터럴 금지 범위 |

**같은 라운드에 web-designer가 수행한 CSS 변경**(계약서와 짝을 이룬다)

- `components.css` `.memo::after` — 다크에서 "그림자 쐐기"가 "빛 쐐기"로 반전되던 것을
  `--c-scrim` 기반 지역 변수 `--wedge`로 교체(M11)
- `.post-nav-item` 3종 + `.back-link`를 `layout.css` → `components.css`로 이관,
  hover의 `transform` 축약형을 `translate` 개별 속성으로 교체(M12)
- 컨트롤 높이 리터럴(`32px` `36px` `34px` `30px`)을 신설 토큰 `--h-control-sm`으로 통일 —
  덤으로 터치 기기에서 `a.post-cat` `.memo-act` `.post-tags .tag > a` `.code-copy`
  `.prose summary`의 타깃이 44px로 올라간다
- `animations.css`의 `[data-reveal]` 규칙 3곳 제거, `base.css`에 스킵 링크 착지점 규칙 추가

### v2.1 (라운드 2)

| # | 변경 | 개발자가 할 일 |
|---|---|---|
| 1 | §4 `.cat-nav` 위치를 **`.hero` 뒤 / `.toolbar` 앞**으로 확정 | `index.html`에 그 자리에 넣는다 |
| 2 | §10-3 `.cat-item`의 ARIA를 `aria-pressed` → **`aria-current="true"`** 로 변경 | 활성 항목에만 속성을 넣고 나머지는 **제거**한다 (라운드 3 미이행분 — M2) |
| 3 | §4 `.memo`에 `--i`와 함께 **`--rot`(id 해시 기반)** 필수임을 명시 | 이행됨 |
| 4 | §5 `.post-head`는 그리드. **직계 `.btn`은 수정 버튼 하나뿐** | 이행됨 |
| 5 | §6 `.cat-picker` / `.cat-new`는 **`.editor-head`의 직계 자식** | 이행됨(순서는 v2.2에서 코드 기준으로 재확정) |
| 6 | §6 `#fCategory`를 `<input>` → **`<select>`** 로 확정 | 이행됨 |
| 7 | §10-4 `.cat-new-hint` **신설**(입력칸보다 먼저) | **미이행 — M3.** `write.html`에 문구를 넣는다 |
| 8 | §7 `.editor-visitor` `.editor-mode` 계약서 편입 | 변경 없음 |
| 9 | §8-1 모션 타이밍 제약 표 신설 (토스트 400ms / 모달 220ms) | 이 숫자를 줄이지 않는다 |
| 10 | §2 토큰 목록을 실제 `tokens.css`와 동기화 + `--ease-ambient` 추가 | 변경 없음 |
| 11 | §11 CSS 파일 지도 신설 | 변경 없음 |
