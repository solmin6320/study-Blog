/* ui.js — 세 페이지가 공유하는 화면 동작: 테마 토글, 헤더 stuck, 진입 애니메이션,
   토스트(util 재노출), 모달(포커스 트랩 + ESC), 숫자 카운트업. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;
  var U = Blog.util;

  var THEME_KEY = CFG.storageKeys.theme;

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
    btn.setAttribute('title', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
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

  /* ---------- 헤더 ---------- */

  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var update = U.rafThrottle(function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    });
    update();
    U.on(window, 'scroll', update, { passive: true });
  }

  /* ---------- 진입 애니메이션 ----------
     CSS가 .memo를 처음에 숨겨 놓고 .is-visible에서 드러낸다.
     IO가 없거나 모션을 줄이는 설정이면 즉시 보이게 해서 "영영 안 보이는" 사고를 막는다.

     계약서 v2.2 §8-2: [data-reveal] 훅은 폐기됐다(정적 마크업에 "JS가 성공해야 보임"을
     덧씌우는 경로라 실패 모드만 늘렸다). 기본 선택자는 .memo 하나뿐이고,
     정적 마크업의 진입 모션은 animations.css의 CSS 단독 애니메이션이 맡는다.
     .is-hidden을 떼는 모든 경로에서 이 함수를 다시 불러야 한다(§4 — 라운드 2 치명 T1). */

  var observer = null;

  function ensureObserver() {
    if (observer || !window.IntersectionObserver) return observer;
    observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    return observer;
  }

  function reveal(nodes) {
    var list = Array.isArray(nodes) ? nodes : U.qsa(nodes || '.memo');
    if (!list.length) return;
    if (prefersReducedMotion() || !window.IntersectionObserver) {
      list.forEach(function (node) { node.classList.add('is-visible'); });
      return;
    }
    var io = ensureObserver();
    list.forEach(function (node) { io.observe(node); });
  }

  /* ---------- 숫자 카운트업 ---------- */

  function countUp(root) {
    U.qsa('[data-count]', root || document).forEach(function (node) {
      var target = Number(node.getAttribute('data-count')) || 0;
      if (prefersReducedMotion()) { node.textContent = String(target); return; }
      var duration = 700;
      var start = 0;
      var t0 = null;
      function step(now) {
        if (t0 === null) t0 = now;
        var p = U.clamp((now - t0) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(start + (target - start) * eased));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    });
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
      /* 제목만 이름으로 주면 본문이 낭독되지 않는다. 내보내기 안내 모달의 본문은
         "파일을 어디에 넣어야 하는가"가 적힌 유일한 곳이라, 안 읽히면 절차가 통째로 사라진다.
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

  /* ---------- 공통 셸 부트스트랩 ---------- */

  function initShell() {
    initTheme();
    initHeader();

    /* 푸터 연도 자동 갱신 */
    U.qsa('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    /* 현재 페이지 내비게이션 표시 */
    var here = window.location.pathname.split('/').pop() || 'index.html';
    U.qsa('.site-nav .nav-link').forEach(function (link) {
      var target = (link.getAttribute('href') || '').split('?')[0];
      var isHere = target === here;
      link.classList.toggle('is-active', isHere);
      /* 붙이기만 하고 지우지 않으면, 정적 마크업에 aria-current가 적혀 있는 페이지에서
         "현재 페이지"가 둘이 된다. 상태는 언제나 양방향으로 쓴다. */
      if (isHere) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  Blog.ui = {
    initShell: initShell,
    initTheme: initTheme,
    initHeader: initHeader,
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    prefersReducedMotion: prefersReducedMotion,
    reveal: reveal,
    countUp: countUp,
    modal: modal,
    closeModal: closeModal,
    toast: U.toast
  };
})(window, document);
