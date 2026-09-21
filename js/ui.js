/* ui.js — 세 페이지가 공유하는 화면 동작: 테마 토글, 토스트(util 재노출),
   모달(포커스 트랩 + ESC), 사이드바(v3.2 — 분류별 글 목록, 열기/고정/접기), 공통 셸 부트스트랩.

   계약서 v3.0(§12 #31~#33)에서 아래 셋이 폐기됐다. 되살리지 않는다.
     initHeader()  — 헤더가 static이 되어 sticky 상태 클래스가 없다(§3). 스크롤 핸들러 하나가 함께 사라졌다.
     reveal()      — 진입 애니메이션 폐기(§0-2·§8-2). 움직일 대상(메모지 카드)이 아예 없어졌다.
     countUp()     — 히어로 통계 폐기(§0-2). 셀 숫자가 없다.
   이 셋을 부르던 곳은 app.js(Blog.ui.reveal / Blog.ui.countUp)이며 frontend-dev가 자기 파일에서 지운다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;
  var U = Blog.util;

  var THEME_KEY = CFG.storageKeys.theme;

  /* CSS 쪽은 base.css 끝의 @media (prefers-reduced-motion: reduce) 블록이 전부 처리한다.
     이건 그 판정을 JS에서도 물어볼 수 있게 남겨 둔 창구다(타이머·스크롤 같은 CSS 밖의 동작용). */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- 테마 ----------
     첫 적용은 <head> 인라인 스크립트가 한다(FOUC 방지). 여기서는 토글과 동기화만 담당. */

  function storedTheme() {
    try { return window.localStorage.getItem(THEME_KEY); } catch (err) { return null; }
  }

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || storedTheme() || systemTheme();
  }

  function applyTheme(theme, persist) {
    var value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', value);
    if (persist) {
      try { window.localStorage.setItem(THEME_KEY, value); } catch (err) { /* 저장 실패는 무시 */ }
    }
    syncThemeButton(value);
    return value;
  }

  function syncThemeButton(theme) {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    /* 버튼 내용은 비워 둔다 — 아이콘은 CSS가 :root[data-theme]를 보고 그린다. */
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
    /* title은 두지 않는다 — aria-label과 같은 문구의 title은 일부 스크린리더가 이름을 두 번 읽는다(계약서 §6 title 규칙, v3.8). */
  }

  function initTheme() {
    applyTheme(currentTheme(), false);

    U.on(document.getElementById('themeToggle'), 'click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });

    /* 사용자가 직접 고른 적이 없을 때만 시스템 설정 변화를 따라간다. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) { if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light', false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------- 인트로 전등 (v3.6, 계약서 §3-5) ----------
     시간표는 전부 CSS animation-delay다(layout.css §10). JS는 시간을 세지 않는다 —
     .intro 자신의 animationend(v3.9: 2250ms — --hold-intro 500)를 받아 hidden을 붙이고 sessionStorage에 "봤다"고 적는다.
     다음 로드에서는 theme-init.js가 첫 페인트 전에 html[data-intro="done"]을 붙여 막을 없앤다.

     여기서 data-intro를 붙이지 않는다 — 첫 방문에서 붙이면 본문 진입 애니메이션(intro-arrive)이
     선택자 html:not([data-intro="done"])에서 빠져 그 프레임에 끊긴다.
     테마 토글(applyTheme)과 접점 0 — 테마에는 전등도 애니메이션도 없다(사용자 요청). */

  var INTRO_KEY = (CFG.storageKeys && CFG.storageKeys.intro) || 'blogIntro';
  var INTRO_FALLBACK_MS = 4000;

  /* "2s" / "2000ms" / "2s, 400ms"(여러 애니메이션이면 첫 값) → ms 숫자. 못 읽으면 NaN. */
  function parseCssTime(value) {
    var first = String(value || '').split(',')[0].trim();
    var m = /^(-?[\d.]+)(ms|s)$/.exec(first);
    if (!m) return NaN;
    var n = parseFloat(m[1]);
    return m[2] === 's' ? n * 1000 : n;
  }

  function initIntro() {
    var intro = document.getElementById('intro');
    if (!intro) return; /* index.html이 아니다 */

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      intro.hidden = true;
      try { window.sessionStorage.setItem(INTRO_KEY, '1'); } catch (err) { /* 저장 실패는 무시 — 다음 방문에 한 번 더 볼 뿐 */ }
    }

    /* 같은 세션에서 이미 봤거나(theme-init이 data-intro="done"), reduced-motion으로 CSS가 막을
       display:none으로 두었으면 animationend가 나지 않는다 — 즉시 마감. */
    var style = window.getComputedStyle(intro);
    if (document.documentElement.getAttribute('data-intro') === 'done' || style.display === 'none') {
      finish();
      return;
    }

    /* animationend는 버블링한다 — .intro-bulb::after의 intro-bulb-on이 2.4초에 먼저 올라온다.
       그걸 받아 hidden을 붙이면 전구가 켜지는 순간 막이 사라져 화면이 튄다. 막 자신의 것만 받는다. */
    intro.addEventListener('animationend', function (e) {
      if (e.target !== intro) return;
      finish();
    });

    /* 안전망: 백그라운드 탭 등에서 이벤트가 새도 막이 남지 않게. CSS보다 500ms 길게.
       --intro-out-at + --dur-intro-out = computed animationDelay + animationDuration. */
    var delay = parseCssTime(style.animationDelay);
    var duration = parseCssTime(style.animationDuration);
    var total = (isNaN(delay) || isNaN(duration)) ? INTRO_FALLBACK_MS : delay + duration + 500;
    window.setTimeout(finish, total);
  }

  /* ---------- 모달 ----------
     계약서 7절: .modal > .modal-panel > (.modal-head / .modal-body / .modal-foot)
     열림 상태: body.modal-open + .modal.is-open */

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var openModalState = null;

  /* 모달이 열려 있는 동안 배경을 통째로 비활성화한다.
     Tab 트랩만으로는 스크린리더의 가상 커서·터치 탐색이 뒤쪽 내용을 계속 읽는다.
     inert는 포커스와 클릭까지 막고, aria-hidden은 inert를 모르는 브라우저를 덮는다.
     토스트 영역은 제외한다 — 모달 안에서 낸 알림("복사했습니다")이 읽혀야 하기 때문.
     되돌리는 함수를 돌려주고, 원래 붙어 있던 속성은 건드리지 않는다. */
  function makeBackgroundInert(modalRoot) {
    var changed = [];
    Array.prototype.slice.call(document.body.children).forEach(function (node) {
      if (node === modalRoot || node.id === 'toastArea' || node.tagName === 'SCRIPT') return;
      var hadInert = node.hasAttribute('inert');
      var hadHidden = node.hasAttribute('aria-hidden');
      if (!hadInert) node.setAttribute('inert', '');
      if (!hadHidden) node.setAttribute('aria-hidden', 'true');
      changed.push({ node: node, inert: hadInert, hidden: hadHidden });
    });
    return function restore() {
      changed.forEach(function (item) {
        if (!item.inert) item.node.removeAttribute('inert');
        if (!item.hidden) item.node.removeAttribute('aria-hidden');
      });
      changed = [];
    };
  }

  function closeModal() {
    if (!openModalState) return;
    var state = openModalState;
    openModalState = null;
    state.off.forEach(function (off) { off(); });
    /* 포커스를 되돌리기 전에 푼다. inert 안의 요소는 focus()를 받지 못한다. */
    if (state.restoreInert) state.restoreInert();
    state.root.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    window.setTimeout(function () {
      if (state.root.parentNode) state.root.parentNode.removeChild(state.root);
    }, 220);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
    if (typeof state.onClose === 'function') state.onClose();
  }

  /* actions: [{ label, variant:'primary'|'ghost'|'danger', onClick, close:true }]
     opts: { title, text | bodyNodes, actions, onClose, initialFocus } */
  function modal(options) {
    var opts = options || {};
    closeModal();

    var uid = String(Date.now()) + String(Math.floor(Math.random() * 1000));
    var titleId = 'modalTitle_' + uid;
    var bodyId = 'modalBody_' + uid;
    var head = U.el('div', { class: 'modal-head' }, [
      U.el('h2', { id: titleId, text: opts.title || '알림' }),
      U.el('button', { class: 'icon-btn', type: 'button', 'aria-label': '닫기', 'data-close': '', text: '✕' })
    ]);

    var body = U.el('div', { class: 'modal-body', id: bodyId });
    if (opts.bodyNodes) U.append(body, opts.bodyNodes);
    else if (opts.text) {
      String(opts.text).split('\n').forEach(function (line) {
        body.appendChild(U.el('p', { text: line }));
      });
    }

    /* 초기 포커스 규칙 — 파괴적 버튼은 기본 포커스를 갖지 않는다.
       모달이 뜬 순간 Enter/Space 한 번에 되돌릴 수 없는 일이 벌어지면 안 된다.
       (실제로 초안 복구 모달이 뜨자마자 '버리기'에 포커스가 가 있었다 — M3-1.)
       우선순위: primary 액션 → 파괴적이지 않은 첫 액션 → 닫기(✕) → 패널 안 아무 것.
       danger 변형은 포커스 후보에서 아예 뺀다. 파괴적 동작은 반드시 눈으로 겨냥해서 눌러야 한다. */
    var foot = U.el('div', { class: 'modal-foot' });
    var primaryBtn = null;
    var safeBtn = null;
    (opts.actions || [{ label: '확인', variant: 'primary', close: true }]).forEach(function (action) {
      var btn = U.el('button', {
        class: 'btn' + (action.variant ? ' btn-' + action.variant : ''),
        type: 'button',
        text: action.label
      });
      btn.addEventListener('click', function () {
        var keepOpen = false;
        if (typeof action.onClick === 'function') keepOpen = action.onClick() === false;
        if (action.close !== false && !keepOpen) closeModal();
      });
      if (action.variant === 'primary' && !primaryBtn) primaryBtn = btn;
      if (action.variant !== 'danger' && !safeBtn) safeBtn = btn;
      foot.appendChild(btn);
    });

    var panel = U.el('div', { class: 'modal-panel', role: 'document' }, [head, body, foot]);
    var root = U.el('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      /* 제목만 이름으로 주면 본문이 낭독되지 않는다. 표 대화상자·게시일 확인·임시저장본 모달의 본문은
         "무엇을 결정하는가"가 적힌 유일한 곳이라, 안 읽히면 질문이 통째로 사라진다.
         내용이 있을 때만 연결한다(빈 영역을 가리키면 오히려 침묵한다). */
      'aria-describedby': body.firstChild ? bodyId : null
    }, [panel]);

    document.body.appendChild(root);
    document.body.classList.add('modal-open');
    window.requestAnimationFrame(function () { root.classList.add('is-open'); });

    var off = [];

    /* 배경(패널 바깥) 클릭으로 닫기 */
    off.push(U.on(root, 'mousedown', function (e) {
      if (e.target === root) closeModal();
    }));

    off.push(U.on(root, 'click', function (e) {
      if (e.target.closest && e.target.closest('[data-close]')) closeModal();
    }));

    /* ESC 닫기 + Tab 포커스 트랩 */
    off.push(U.on(document, 'keydown', function (e) {
      if (!openModalState) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      var items = U.qsa(FOCUSABLE, panel).filter(function (n) { return n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }));

    openModalState = {
      root: root, panel: panel, off: off,
      lastFocus: document.activeElement,
      /* inert를 먼저 걸고 나서 모달 안으로 포커스를 옮긴다.
         순서가 반대면 배경에 있던 포커스가 inert에 걸려 body로 튕긴 뒤 그대로 남는다. */
      restoreInert: makeBackgroundInert(root),
      onClose: opts.onClose
    };

    /* 입력 폼 성격의 모달은 첫 입력칸에서 시작하는 편이 빠르다(opts.initialFocus).
       그 밖에는 위 규칙대로 primary → 안전한 액션 → 닫기 순으로 고른다. */
    var initial = (opts.initialFocus && panel.contains(opts.initialFocus) ? opts.initialFocus : null)
      || primaryBtn
      || safeBtn
      || U.qsa('[data-close]', head)[0]
      || U.qsa(FOCUSABLE, panel)[0];
    if (initial) initial.focus();

    return { root: root, body: body, close: closeModal };
  }

  /* ---------- 사이드바 ----------
     사양 B(v3.2): 햄버거(#sideToggle)로 여닫는 분류별 글 목록.
     마크업은 세 HTML이 공유하고(.side > .side-head + #sideTree, 뒤에 .side-scrim), 트리는 renderSide()가 그린다.

     상태는 전부 <body> 클래스로 표현한다 — CSS가 그걸 보고 그린다.
       side-open    보인다
       side-pinned  고정. 데스크톱(≥1024px)에서만 "도킹"(본문이 밀리고 스크림 없음).
     열려 있는데 도킹이 아니면 "오버레이"다: 스크림이 깔리고 Esc·스크림 클릭·링크 클릭·바깥 포커스 이동에 닫힌다.
     1024px 미만에서는 pinned여도 오버레이다(좁은 화면에서 본문을 밀 자리가 없다). pinned 값은 보존만 한다.

     저장은 localStorage 한 키(blogSide)에 JSON {pinned, closed:[slug…]}.
     테마와 달리 첫 페인트 전 처리는 theme-init.js가 <html data-side="pinned">로 먼저 해 두고,
     여기서는 body 클래스와 버튼 상태를 그 위에 동기화한다. */

  var SIDE_KEY = (CFG.storageKeys && CFG.storageKeys.side) || 'blogSide';
  /* theme-init.js·layout.css의 도킹 브레이크포인트와 같은 값이어야 한다. */
  var DOCK_MQ = '(min-width: 1024px)';
  var FALLBACK_SLUG = (CFG.category && CFG.category.fallbackSlug) || '_uncategorized';
  var FALLBACK_NAME = (CFG.category && CFG.category.fallbackName) || '미분류';

  var side = {
    loaded: false,     // 저장값을 읽었는가. renderSide()가 initSide()보다 먼저 불려도 접힘 상태는 복원돼야 한다.
    pinned: false,
    closed: [],        // 접어 둔 분류 slug
    open: false,
    mq: null,
    dom: {}
  };

  function loadSideState() {
    if (side.loaded) return;
    side.loaded = true;
    try {
      var parsed = JSON.parse(window.localStorage.getItem(SIDE_KEY) || 'null');
      if (parsed && typeof parsed === 'object') {
        side.pinned = parsed.pinned === true;
        side.closed = Array.isArray(parsed.closed)
          ? parsed.closed.filter(function (v) { return typeof v === 'string'; })
          : [];
      }
    } catch (err) {
      /* 저장소가 막혔거나 JSON이 깨졌으면 기본값(고정 아님·전부 펼침)으로 간다. */
      side.pinned = false;
      side.closed = [];
    }
  }

  function saveSideState() {
    try {
      window.localStorage.setItem(SIDE_KEY, JSON.stringify({ pinned: side.pinned, closed: side.closed }));
    } catch (err) { /* 저장 실패는 무시 — 이번 세션 안에서는 메모리 상태로 계속 동작한다. */ }
  }

  function isWide() { return Boolean(side.mq && side.mq.matches); }
  function isDocked() { return side.open && side.pinned && isWide(); }
  function isOverlay() { return side.open && !isDocked(); }

  /* 상태 → DOM. 상태를 바꾸는 모든 경로가 마지막에 이걸 한 번 부른다.
     한 곳에서만 DOM을 만지면 클래스·aria·스크림이 서로 어긋날 일이 없다. */
  function syncSide() {
    var d = side.dom;
    document.body.classList.toggle('side-open', side.open);
    document.body.classList.toggle('side-pinned', side.pinned);
    /* theme-init.js가 첫 페인트용으로 붙인 속성. 이후로는 여기서 도킹 여부와 같이 움직인다 —
       고정을 풀었는데 이 속성이 남아 있으면 CSS가 계속 본문을 밀어 둔다. */
    if (isDocked()) document.documentElement.setAttribute('data-side', 'pinned');
    else document.documentElement.removeAttribute('data-side');

    if (d.toggle) {
      d.toggle.setAttribute('aria-expanded', side.open ? 'true' : 'false');
      d.toggle.setAttribute('aria-label', side.open ? '분류 메뉴 닫기' : '분류 메뉴 열기');
    }
    if (d.pin) {
      d.pin.setAttribute('aria-pressed', side.pinned ? 'true' : 'false');
      d.pin.setAttribute('aria-label', side.pinned ? '사이드바 고정 해제' : '사이드바 고정');
    }
    /* 스크림은 오버레이일 때만. 도킹이면 본문을 가릴 이유가 없다(클릭도 막으면 안 된다). */
    U.setHidden(d.scrim, !isOverlay());
  }

  /* 열릴 때 포커스는 사이드바 안으로 — 첫 버튼(핀), 없으면 트리의 첫 링크.
     CSS 슬라이드가 걸려 있어도 visibility는 전환 시작 시점에 이미 visible이라 바로 focus()가 먹지만,
     스타일 재계산 전에 부르는 경우를 피해 한 프레임 뒤로 미룬다. */
  function focusIntoSide() {
    var d = side.dom;
    var target = d.pin || d.close || (d.tree && U.qsa('a[href]', d.tree)[0]) || d.aside;
    if (!target) return;
    window.requestAnimationFrame(function () {
      if (side.open) target.focus();
    });
  }

  function openSide(moveFocus) {
    if (side.open) return;
    side.open = true;
    syncSide();
    if (moveFocus) focusIntoSide();
  }

  /* restoreFocus: 닫은 뒤 포커스를 햄버거로 돌린다. Esc·닫기 버튼·스크림 클릭처럼 "사용자가 닫은" 경우.
     링크를 눌러 페이지가 넘어가거나 포커스가 스스로 밖으로 나간 경우엔 false — 되돌리면 오히려 방해다. */
  function closeSide(restoreFocus) {
    if (!side.open) return;
    side.open = false;
    syncSide();
    if (restoreFocus && side.dom.toggle) side.dom.toggle.focus();
  }

  function initSide() {
    var d = side.dom;
    d.aside = document.getElementById('side');
    d.toggle = document.getElementById('sideToggle');
    d.pin = document.getElementById('sidePin');
    d.close = document.getElementById('sideClose');
    d.scrim = document.getElementById('sideScrim');
    d.tree = document.getElementById('sideTree');
    if (!d.aside || !d.toggle) return;   // 이 페이지에 사이드바 마크업이 없다

    loadSideState();
    side.mq = window.matchMedia ? window.matchMedia(DOCK_MQ) : null;
    /* 초기 열림: 고정 + 데스크톱이면 처음부터 도킹된 채 시작한다(theme-init.js가 미리 그려 둔 상태와 일치). */
    side.open = side.pinned && isWide();
    syncSide();

    U.on(d.toggle, 'click', function () {
      if (side.open) closeSide(false);   // 포커스는 이미 햄버거에 있다
      else openSide(true);
    });

    U.on(d.close, 'click', function () { closeSide(true); });

    U.on(d.scrim, 'click', function () { closeSide(true); });

    /* 핀: 고정 토글 + 저장. 고정을 풀어도 닫지 않는다 — 사용자는 "고정만" 풀고 싶었을 뿐이다.
       도킹 ↔ 오버레이 전환(스크림 유무)은 syncSide가 처리한다. */
    U.on(d.pin, 'click', function () {
      side.pinned = !side.pinned;
      saveSideState();
      syncSide();
    });

    /* 트리 안 링크 클릭 → 오버레이면 닫는다. 도킹이면 그대로(페이지가 넘어가도 열린 채 유지되는 것이 도킹의 뜻).
       분류 접기 버튼은 renderSide()가 항목마다 직접 묶는다. */
    U.on(d.tree, 'click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href]') : null;
      if (link && isOverlay()) closeSide(false);
    });

    /* 오버레이에서 포커스가 사이드바 밖으로 나가면 닫는다(포커스 트랩 대신 — 트랩은 모달의 것이고,
       사이드바는 Tab으로 지나칠 수 있는 내비게이션이다).
       relatedTarget이 없는 경우(창 전환·비포커스 영역 클릭)는 무시한다 — Alt+Tab 한 번에 닫히면 안 된다.
       햄버거로 돌아가는 Shift+Tab은 "밖"으로 치지 않는다(토글 위에서 다시 열고 닫을 수 있어야 한다). */
    U.on(d.aside, 'focusout', function (e) {
      var next = e.relatedTarget;
      if (!next || !isOverlay()) return;
      if (d.aside.contains(next) || next === d.toggle) return;
      closeSide(false);
    });

    /* Esc: 오버레이에서만. 모달이 위에 떠 있으면 모달의 Esc가 우선이다. */
    U.on(document, 'keydown', function (e) {
      if (e.key !== 'Escape' || openModalState || !isOverlay()) return;
      e.preventDefault();
      closeSide(true);
    });

    /* 도킹 ↔ 오버레이 경계(1024px)를 넘을 때.
       넓어짐 + 고정: 페이지를 새로 열었을 때와 같은 상태(도킹된 채 열림)로 맞춘다.
       좁아짐 + 고정 + 열림: 도킹이 통째로 스크림 오버레이로 바뀌어 본문을 덮어 버리므로 닫는다.
       고정이 아닌 오버레이는 폭과 무관하니 손대지 않는다. */
    if (side.mq) {
      var onDockChange = function (e) {
        if (side.pinned) {
          if (e.matches) openSide(false);
          else closeSide(false);
        }
        syncSide();
      };
      if (side.mq.addEventListener) side.mq.addEventListener('change', onDockChange);
      else if (side.mq.addListener) side.mq.addListener(onDockChange);
    }
  }

  /* 분류 안 글 순서: 고정 먼저, 그 다음 created 내림차순(app.js sortPosts와 같은 규칙). */
  function bySidePostOrder(a, b) {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return String(b.created).localeCompare(String(a.created));
  }

  function setCatOpen(li, toggle, name, open) {
    li.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', name + (open ? ' 접기' : ' 펼치기'));
  }

  /* 트리 한 그루를 #sideTree에 그린다. innerHTML 없이 U.el만 쓴다(제목·분류명은 사용자 입력).
     { posts, cats, activeId, activeCat }
       posts     index.json의 글 목록(store.loadIndex().posts 그대로)
       cats      store.categoryList(posts)를 호출자가 order → 글 수 내림차순 → 이름 순으로 정렬한 것. 각 {slug, name, count}
       activeId  post.html의 현재 글 id → 그 글에 aria-current="page"
       activeCat index.html의 ?cat= slug → 그 분류 이름에 aria-current="true"
     여러 번 불려도 된다(필터가 바뀔 때마다 통째로 다시 그린다). 접힘 상태는 저장값에서 복원한다. */
  function renderSide(options) {
    var o = options || {};
    var tree = side.dom.tree || document.getElementById('sideTree');
    if (!tree) return;
    loadSideState();

    var posts = Array.isArray(o.posts) ? o.posts : [];
    var cats = Array.isArray(o.cats) ? o.cats : [];
    var store = Blog.store;

    U.clear(tree);
    if (!posts.length) {
      tree.appendChild(U.el('p', { class: 'side-empty', text: '글이 없습니다' }));
      return;
    }

    /* slug별로 글을 모은다. 분류 판정은 store.categorySlug 하나만 쓴다 — app.js·post.js와 같은 함수라
       카드 목록에서 A 분류였던 글이 사이드바에서 B에 가 있는 일이 없다. */
    var groups = Object.create(null);
    posts.forEach(function (post) {
      var slug = store && store.categorySlug ? store.categorySlug(post.category) : FALLBACK_SLUG;
      (groups[slug] || (groups[slug] = [])).push(post);
    });

    /* 순서는 호출자가 준 cats 그대로. 미분류는 어디에 있든 빼서 맨 아래로, 글이 있을 때만 붙인다.
       cats에 없는데 글이 있는 slug(호출자가 다른 목록을 줬을 때)도 잃지 않도록 뒤에 덧붙인다. */
    var seen = Object.create(null);
    var ordered = [];
    cats.forEach(function (cat) {
      if (!cat || !cat.slug || cat.slug === FALLBACK_SLUG || seen[cat.slug]) return;
      seen[cat.slug] = true;
      ordered.push({ slug: cat.slug, name: String(cat.name || cat.slug) });
    });
    Object.keys(groups).forEach(function (slug) {
      if (seen[slug] || slug === FALLBACK_SLUG) return;
      seen[slug] = true;
      var raw = String(groups[slug][0].category || '').trim();
      ordered.push({ slug: slug, name: (store && store.categoryName ? store.categoryName(raw) : raw) || slug });
    });
    if (groups[FALLBACK_SLUG]) ordered.push({ slug: FALLBACK_SLUG, name: FALLBACK_NAME });

    var list = U.el('ul', { class: 'side-cats' });
    ordered.forEach(function (cat) {
      var items = (groups[cat.slug] || []).slice().sort(bySidePostOrder);
      var isEmpty = items.length === 0;
      var listId = 'sideCat-' + cat.slug;

      var row = U.el('div', { class: 'side-cat-row' }, [
        U.el('a', {
          class: 'side-cat-name',
          href: 'index.html?cat=' + encodeURIComponent(cat.slug),
          'aria-current': o.activeCat && o.activeCat === cat.slug ? 'true' : null,
          text: cat.name
        }),
        U.el('span', { class: 'side-cat-count', text: String(items.length) })
      ]);

      var li = U.el('li', { class: 'side-cat' + (isEmpty ? ' is-empty' : '') }, [row]);

      /* 글 0편이면 접을 목록이 없다 — 토글 버튼도, 빈 <ul>도 만들지 않는다.
         있는데 아무 일도 안 하는 버튼은 키보드 사용자에게 고장으로 읽힌다. */
      if (isEmpty) { list.appendChild(li); return; }

      var toggle = U.el('button', { class: 'side-cat-toggle', type: 'button', 'aria-controls': listId });
      row.appendChild(toggle);

      var ul = U.el('ul', { class: 'side-posts', id: listId }, items.map(function (post) {
        return U.el('li', null, [
          U.el('a', {
            class: 'side-post' + (post.pinned ? ' is-pinned' : ''),
            href: 'post.html?id=' + encodeURIComponent(post.id),
            'aria-current': o.activeId && o.activeId === post.id ? 'page' : null,
            text: post.title
          })
        ]);
      }));
      li.appendChild(ul);

      setCatOpen(li, toggle, cat.name, side.closed.indexOf(cat.slug) === -1);
      toggle.addEventListener('click', function () {
        var nowOpen = !li.classList.contains('is-open');
        setCatOpen(li, toggle, cat.name, nowOpen);
        side.closed = side.closed.filter(function (s) { return s !== cat.slug; });
        if (!nowOpen) side.closed.push(cat.slug);
        saveSideState();
      });

      list.appendChild(li);
    });

    tree.appendChild(list);
  }

  /* ---------- 공통 셸 부트스트랩 ---------- */

  function initShell() {
    initTheme();
    initIntro();
    initSide();

    /* 푸터 연도 자동 갱신 */
    U.qsa('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    /* 현재 페이지 내비게이션 표시 — v3.4(계약서 §3-3): 상태는 aria-current="page" 하나다.
       .is-active 클래스 토글은 폐기됐다(CSS가 더 이상 읽지 않는다 — 붙여 두면 계약서에 없는 클래스가 된다).
       "태그"(index.html#tags)는 split('?')[0]가 'index.html#tags'로 남아 here와 달라 저절로 빠지고,
       post.html에서 "글"이 page를 받지 않는 것도 here === 'post.html' 판정이 보장한다. */
    var here = window.location.pathname.split('/').pop() || 'index.html';
    U.qsa('.site-nav .nav-link').forEach(function (link) {
      var target = (link.getAttribute('href') || '').split('?')[0];
      var isHere = target === here;
      /* 붙이기만 하고 지우지 않으면, 정적 마크업에 aria-current가 적혀 있는 페이지에서
         "현재 페이지"가 둘이 된다. 상태는 언제나 양방향으로 쓴다. */
      if (isHere) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /* v3.0에서 사라진 공개 함수: initHeader / reveal / countUp.
     다른 파일에서 이 이름을 부르면 TypeError가 난다 — 부르는 쪽에서 지운다(§12 #18·#19). */
  Blog.ui = {
    initShell: initShell,
    initTheme: initTheme,
    /* v3.6 인트로 전등(§3-5). initShell이 부르지만 셸을 따로 초기화하는 페이지를 위해 함께 내놓는다(initSide와 같은 이유). */
    initIntro: initIntro,
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    prefersReducedMotion: prefersReducedMotion,
    modal: modal,
    closeModal: closeModal,
    toast: U.toast,
    /* v3.2 사이드바. initSide는 initShell이 부르지만, 셸을 따로 초기화하는 페이지를 위해 함께 내놓는다. */
    initSide: initSide,
    renderSide: renderSide
  };
})(window, document);
