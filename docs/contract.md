# 마크업 계약서 v2.1

디자이너(CSS)와 개발자(HTML/JS)가 동시에 작업하기 위한 **단일 진실 공급원**.
여기 없는 클래스를 임의로 만들지 않는다. 필요하면 이 문서를 먼저 갱신한다.

> **v2.1 개정 요약 (라운드 2, web-designer)** — 개발자가 코드를 맞춰야 하는 항목
>
> | # | 변경 | 개발자가 할 일 |
> |---|---|---|
> | 1 | §4 `.cat-nav` 위치를 **`.hero` 뒤 / `.toolbar` 앞**으로 확정 | `index.html`에 그 자리에 넣는다 |
> | 2 | §10-3 `.cat-item`의 ARIA를 `aria-pressed` → **`aria-current="true"`** 로 변경 | 활성 항목에만 속성을 넣고 나머지는 **제거**한다 |
> | 3 | §4 `.memo`에 `--i`와 함께 **`--rot`(id 해시 기반)** 필수임을 명시 | 이미 구현돼 있다면 그대로 |
> | 4 | §5 `.post-head`는 그리드. **직계 `.btn`은 수정 버튼 하나뿐** | `.post-head`에 두 번째 `.btn`을 넣지 않는다 |
> | 5 | §6 `.cat-picker` / `.cat-new`는 **`.editor-head`의 직계 자식** (`.editor-fields` 안 아님) | `write.html` 배치를 그렇게 잡는다 |
> | 6 | §6 `#fCategory`를 `<input>` → **`<select>`** 로 확정 | `editor.js`가 option을 채운다 |
> | 7 | §10-4 `.cat-new-hint` **신설**(입력칸보다 먼저) | slug 불변 경고 문구를 넣는다 |
> | 8 | §7 `.editor-visitor` `.editor-mode` **계약서에 편입**(이미 마크업엔 있었으나 미등재) | 변경 없음 |
> | 9 | §8-1 **모션 타이밍 제약 표 신설** (토스트 400ms / 모달 220ms) | 이 숫자를 줄이지 않는다 |
> | 10 | §2 토큰 목록을 실제 `tokens.css`와 동기화 + `--ease-ambient` 추가 | 변경 없음 |
> | 11 | §11 **CSS 파일 지도** 신설 | 변경 없음 |

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
모션: --ease(cubic-bezier(.16,1,.3,1)) --ease-out --ease-in
      --ease-ambient(linear — 무한 루프 전용)
      --dur-fast(160ms) --dur(260ms) --dur-slow(420ms) --dur-ambient(52s)
치수: --h-control --h-nav --w-modal --w-toast   (--h-control/--h-nav는
      @media (pointer:coarse)에서 44px로 자동 상승 = 터치 타깃 기준)
레이아웃: --w-content(72ch) --w-page(1200px) --h-header(64px) --w-toc --gutter --memo-min
z-index: --z-bg --z-base --z-sticky --z-header --z-progress --z-modal --z-toast
```

다크모드는 `:root[data-theme="dark"]`에서 토큰 값만 재정의한다.
초기 테마는 `<html data-theme="light|dark">`로 JS가 세팅한다(FOUC 방지용 인라인 스크립트).

---

## 3. 공통 셸 (세 페이지 모두 동일)

```html
<div class="bg-layer" aria-hidden="true">
  <div class="bg-mesh"></div>
  <div class="bg-grain"></div>
</div>

<header class="site-header" id="siteHeader">
  <a class="brand" href="index.html">
    <span class="brand-mark"></span><span class="brand-text">…</span>
  </a>
  <nav class="site-nav">
    <a class="nav-link is-active" href="index.html">메모</a>
  </nav>
  <div class="header-actions">
    <button class="icon-btn" id="themeToggle" aria-label="테마 전환"></button>
    <a class="btn btn-primary" href="write.html" data-admin-only>새 메모</a>
  </div>
</header>

<main class="site-main">…</main>

<footer class="site-footer">…</footer>
<div class="toast-area" id="toastArea"></div>
```

- `data-admin-only` : 관리자 모드가 꺼져 있으면 JS가 DOM에서 제거한다. CSS는 기본적으로 보이게 두면 된다(단, `.admin-off [data-admin-only]{display:none}` 안전장치는 둔다).
- `.site-header.is-stuck` : 스크롤 시 JS가 붙인다.

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

<section class="toolbar">
  <div class="search">
    <input class="search-input" id="searchInput" type="search" placeholder="검색">
    <button class="search-clear" hidden></button>
  </div>
  <div class="chips" id="tagFilters">
    <button class="chip is-active" data-tag="*">전체</button>
  </div>
  <select class="select" id="sortSelect">…</select>
</section>

<section class="board" id="board" aria-live="polite">
  <article class="memo" data-color="amber" data-id="…" style="--i:0">
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

- `.memo[data-color]` 6종: amber / mint / sky / rose / lilac / lime
- `.memo.is-pinned` : 고정 글
- `.memo.is-hidden` : 검색/필터로 걸러진 카드 (JS가 토글, CSS가 숨김+퇴장 페이드)

**JS가 `.memo`에 넣어야 하는 인라인 커스텀 프로퍼티 2개** — 없으면 모션이 죽거나 카드가 안 보인다.

| 변수 | 값 | 용도 |
|---|---|---|
| `--i` | 화면에 보이는 순번 0,1,2,… (필터 후 다시 매긴다) | 진입 stagger 지연. CSS가 `min(--i, 8)`로 상한을 건다 |
| `--rot` | `±0.6deg` 범위, **글 id 해시로 결정** | 메모지 기울기. 난수면 새로고침마다 보드가 흔들린다 |

- `.memo`는 `.is-visible`이 붙기 전까지 `opacity:0`이다(`prefers-reduced-motion: no-preference`일 때만).
  `.is-visible`은 `ui.js`의 IntersectionObserver가 붙인다. **이 호출을 빠뜨리면 카드가 영영 안 보인다.**

---

## 5. post.html — 글 상세

```html
<div class="progress"><div class="progress-bar" id="progressBar"></div></div>

<article class="post" id="post">
  <header class="post-head">
    <a class="back-link" href="index.html">← 목록</a>
    <a class="btn btn-ghost" id="postEdit" href="write.html?id=…" data-admin-only>수정</a>
    <span class="post-cat">프론트엔드</span>
    <h1 class="post-title">…</h1>
    <p class="post-summary">…</p>
    <div class="post-meta">
      <time class="post-date" datetime="…">게시 2026.09.13</time>
      <time class="post-updated" datetime="…">최종 수정 2026.09.14</time>
      <span class="post-read">5분</span>
    </div>
    <ul class="post-tags"><li class="tag">css</li></ul>
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
- `.post.is-loading`은 `post.js`가 렌더를 마칠 때 뗀다. **CSS의 본문 진입 애니메이션이 이 시점을 트리거로 쓴다.**
  이 클래스를 안 떼면 본문이 반투명(0.38)인 채로 남고 진입 모션도 돌지 않는다.
- `.prose` 안의 요소는 태그 셀렉터로 스타일링한다(`.prose h2`, `.prose table`, `.prose pre` …). 마크다운이 만드는 결과라 클래스를 붙일 수 없다.
- 코드블록은 `<pre><code class="hljs language-js">`. 복사 버튼은 JS가 `<div class="code-wrap"><button class="code-copy">` 로 감싸서 주입한다.
- 이미지는 `.prose img`, 표는 `.prose table`이 가로 스크롤 컨테이너 `.table-wrap` 안에 들어간다(JS가 감쌈).

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

    <div class="editor-fields">
      <input class="field" id="fSummary"> <input class="field" id="fTags">
      <input class="field" id="fId">      <select class="field" id="fColor">
      <label class="switch"><input type="checkbox" id="fPinned"><span class="switch-ui"></span>고정</label>
    </div>

    <!-- §10-4. .editor-fields 안이 아니라 .editor-head의 직계 자식으로 둔다.
         (분류는 "새 데이터를 만들 수 있는" 유일한 필드라 한 줄을 통째로 가진다) -->
    <div class="cat-picker">…</div>
    <div class="cat-new" id="catNew" hidden>…</div>

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
```

`.sr-only`는 `:focus`와 `:focus-visible` **둘 다**에서 화면에 드러난다.
스킵 링크는 키보드 사용자의 유일한 탈출구라 한 경우라도 새면 실패다.

---

## 8. JS가 건드리는 상태 클래스 (CSS는 이것만 받아쓴다)

`is-active` `is-open` `is-stuck` `is-hidden` `is-dirty` `is-loading` `is-pinned` `is-visible` `is-empty`
그 외 상태 클래스가 필요하면 계약서를 먼저 갱신한다.

`body.modal-open` `body.admin-off` 는 body에만 붙는 예외다.

### 8-1. 모션이 JS 타이밍에 거는 제약 (깨면 화면에 잔상이 남는다)

| 동작 | JS 쪽 타이밍 | CSS가 맞춰 둔 시간 |
|---|---|---|
| 토스트 퇴장 | `is-visible` 제거 후 **400ms** 뒤 DOM 제거 | 260ms (`--dur`) |
| 모달 닫힘 | `is-open` 제거 후 **220ms** 뒤 DOM 제거 | 160ms (`--dur-fast`) |
| 모달 열림 | append → **다음 rAF**에 `is-open` | 420ms (`--dur-slow`) |

이 숫자를 JS에서 줄이면 요소가 사라지는 중간에 잘린다. 늘릴 때는 상관없다.

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
  <button class="cat-item" type="button" data-cat="css" data-color="sky">
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

**위치: 둘 다 `.editor-head`의 직계 자식. `.editor-fields` 다음, `.editor-actions` 앞.**
`.editor-fields`(auto-fit 그리드) 안에 넣으면 180px짜리 칸에 셀렉트와 버튼이 함께 끼어 둘 다 못 읽는다.

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
