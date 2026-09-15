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
     CSS가 .memo / [data-reveal]을 처음에 숨겨 놓고 .is-visible에서 드러낸다.
     IO가 없거나 모션을 줄이는 설정이면 즉시 보이게 해서 "영영 안 보이는" 사고를 막는다. */

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
    var list = Array.isArray(nodes) ? nodes : U.qsa(nodes || '.memo, [data-reveal]');
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

  function closeModal() {
    if (!openModalState) return;
    var state = openModalState;
    openModalState = null;
    state.off.forEach(function (off) { off(); });
    state.root.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    window.setTimeout(function () {
      if (state.root.parentNode) state.root.parentNode.removeChild(state.root);
    }, 220);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
    if (typeof state.onClose === 'function') state.onClose();
  }

  /* actions: [{ label, variant:'primary'|'ghost'|'danger', onClick, close:true }] */
  function modal(options) {
    var opts = options || {};
    closeModal();

    var titleId = 'modalTitle_' + Date.now();
    var head = U.el('div', { class: 'modal-head' }, [
      U.el('h2', { id: titleId, text: opts.title || '알림' }),
      U.el('button', { class: 'icon-btn', type: 'button', 'aria-label': '닫기', 'data-close': '', text: '✕' })
    ]);

    var body = U.el('div', { class: 'modal-body' });
    if (opts.bodyNodes) U.append(body, opts.bodyNodes);
    else if (opts.text) {
      String(opts.text).split('\n').forEach(function (line) {
        body.appendChild(U.el('p', { text: line }));
      });
    }

    var foot = U.el('div', { class: 'modal-foot' });
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
      foot.appendChild(btn);
    });

    var panel = U.el('div', { class: 'modal-panel', role: 'document' }, [head, body, foot]);
    var root = U.el('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId
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
      onClose: opts.onClose
    };

    var initial = U.qsa(FOCUSABLE, foot)[0] || U.qsa(FOCUSABLE, panel)[0];
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
      link.classList.toggle('is-active', target === here);
      if (target === here) link.setAttribute('aria-current', 'page');
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
