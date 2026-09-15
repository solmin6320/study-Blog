/* util.js — DOM 헬퍼, 날짜 포맷, debounce, escape, 클립보드, 다운로드, 토스트.
   여기 있는 함수는 페이지 종속성이 없어야 한다(어느 페이지에서든 동작). */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;

  /* ---------- DOM ---------- */

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function on(target, type, handler, opts) {
    if (!target) return function () {};
    target.addEventListener(type, handler, opts);
    return function off() { target.removeEventListener(type, handler, opts); };
  }

  /* el('div', {class:'x', text:'안녕'}, [child]) — text는 항상 textContent로 들어간다.
     html 키는 의도적으로 막아 둔다. 살균되지 않은 문자열이 DOM에 들어갈 통로를 없애기 위함. */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'html') throw new Error('el(): html 속성은 금지. textContent 또는 살균된 노드를 쓸 것.');
        if (key === 'class') { node.className = value; return; }
        if (key === 'text') { node.textContent = value; return; }
        if (key === 'dataset') { Object.keys(value).forEach(function (d) { node.dataset[d] = value[d]; }); return; }
        if (key === 'style' && typeof value === 'object') { Object.keys(value).forEach(function (s) { node.style[s] = value[s]; }); return; }
        if (key.slice(0, 2) === 'on' && typeof value === 'function') { node.addEventListener(key.slice(2).toLowerCase(), value); return; }
        if (value === true) { node.setAttribute(key, ''); return; }
        node.setAttribute(key, value);
      });
    }
    append(node, children);
    return node;
  }

  function append(parent, children) {
    if (children === null || children === undefined) return parent;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      parent.appendChild(typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child);
    });
    return parent;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function setHidden(node, hidden) {
    if (!node) return;
    if (hidden) node.setAttribute('hidden', '');
    else node.removeAttribute('hidden');
  }

  /* ---------- 문자열 ---------- */

  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 문자열 → 32bit 정수. 메모지 기울기를 id로부터 결정적으로 만들 때 쓴다. */
  function hashCode(str) {
    var text = String(str);
    var h = 5381;
    for (var i = 0; i < text.length; i += 1) {
      h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    }
    return h;
  }

  /* 0 이상 1 미만의 결정적 난수. 같은 입력이면 언제나 같은 값. */
  function hashUnit(str) {
    return (Math.abs(hashCode(str)) % 10007) / 10007;
  }

  /* 제목 anchor용 slug. 한글은 그대로 남긴다(브라우저가 알아서 인코딩하고, 주소가 읽힌다). */
  function slugHeading(text) {
    return String(text || '').trim().toLowerCase()
      .replace(/[\s ]+/g, '-')
      .replace(/[^0-9a-z가-힣ㄱ-ㆎ\-_]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* 글 id(=파일명)용 slug. 파일명·URL 파라미터로 쓰이므로 ASCII만 남긴다.
     한글 제목이면 결과가 비므로 호출부에서 타임스탬프로 대체한다. */
  function slugAscii(text) {
    return String(text || '').trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^0-9a-z\-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* ---------- 날짜 ----------
     표시용 값은 ISO 문자열에서 직접 뽑는다. Date로 바꿔 로컬 시간대로 찍으면
     +09:00으로 쓴 글이 해외 방문자에게 하루 밀려 보인다. 상대 시간 계산에만 Date를 쓴다. */

  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

  function pad2(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function toDate(iso) {
    if (!iso) return null;
    var date = new Date(iso);
    return isNaN(date.getTime()) ? null : date;
  }

  function parts(iso) {
    var m = ISO_RE.exec(String(iso || '').trim());
    if (m) {
      return { y: m[1], m: m[2], d: m[3], hh: m[4] || '00', mm: m[5] || '00' };
    }
    var date = toDate(iso);
    if (!date) return null;
    return {
      y: String(date.getFullYear()),
      m: pad2(date.getMonth() + 1),
      d: pad2(date.getDate()),
      hh: pad2(date.getHours()),
      mm: pad2(date.getMinutes())
    };
  }

  /* 2026.09.13 — 목록 카드용 */
  function fmtDot(iso) {
    var p = parts(iso);
    return p ? p.y + '.' + p.m + '.' + p.d : '';
  }

  /* 09.13 — 같은 해의 수정 날짜를 짧게 붙일 때 */
  function fmtDotShort(iso) {
    var p = parts(iso);
    return p ? p.m + '.' + p.d : '';
  }

  /* 2026년 9월 13일 — 상세 페이지용 */
  function fmtKo(iso) {
    var p = parts(iso);
    return p ? p.y + '년 ' + Number(p.m) + '월 ' + Number(p.d) + '일' : '';
  }

  function yearOf(iso) {
    var p = parts(iso);
    return p ? p.y : '';
  }

  /* recentDays 이내일 때만 "3일 전" 문자열을 돌려준다. 그 밖이면 빈 문자열. */
  function fmtRelative(iso, nowDate) {
    var date = toDate(iso);
    if (!date) return '';
    var now = nowDate || new Date();
    var diff = now.getTime() - date.getTime();
    var minute = 60000, hour = 3600000, day = 86400000;
    if (diff < 0) return '';                       // 미래 날짜는 상대 표기를 생략한다
    if (diff >= CFG.recentDays * day) return '';
    if (diff < minute) return '방금 전';
    if (diff < hour) return Math.floor(diff / minute) + '분 전';
    if (diff < day) return Math.floor(diff / hour) + '시간 전';
    return Math.floor(diff / day) + '일 전';
  }

  /* created와 updated가 같은 순간인지. 같으면 "수정" 표기를 숨긴다(같은 날짜 두 번은 노이즈). */
  function sameMoment(a, b) {
    if (!a || !b) return true;
    if (String(a) === String(b)) return true;
    var da = toDate(a), db = toDate(b);
    if (!da || !db) return String(a) === String(b);
    return da.getTime() === db.getTime();
  }

  /* KST 고정 오프셋 ISO 8601. 에디터가 내보내는 created/updated는 항상 이 형식이다. */
  function nowIsoKst() {
    var now = new Date();
    var kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    return kst.getFullYear() + '-' + pad2(kst.getMonth() + 1) + '-' + pad2(kst.getDate())
      + 'T' + pad2(kst.getHours()) + ':' + pad2(kst.getMinutes()) + ':' + pad2(kst.getSeconds())
      + '+09:00';
  }

  function todayStampKst() { return nowIsoKst().slice(0, 10); }

  /* ---------- 읽기 시간 ---------- */

  /* 코드블록·이미지·링크 문법을 걷어낸 뒤 공백 제외 글자 수로 계산한다(한글 분당 500자). */
  function readingMinutes(markdown) {
    var text = String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~|\-]/g, ' ')
      .replace(/\s+/g, '');
    var minutes = Math.ceil(text.length / CFG.read.charsPerMinute);
    return Math.max(CFG.read.minMinutes, minutes || 0);
  }

  /* ---------- 타이밍 ---------- */

  function debounce(fn, wait) {
    var timer = null;
    var lastArgs = null;
    var lastCtx = null;
    function debounced() {
      lastArgs = arguments;
      lastCtx = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(lastCtx, lastArgs);
      }, wait);
    }
    debounced.cancel = function () { if (timer) { clearTimeout(timer); timer = null; } };
    debounced.flush = function () {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
      fn.apply(lastCtx, lastArgs);
    };
    return debounced;
  }

  function rafThrottle(fn) {
    var queued = false;
    return function () {
      var args = arguments, ctx = this;
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; fn.apply(ctx, args); });
    };
  }

  /* ---------- URL 쿼리 ---------- */

  function getQuery() {
    var out = {};
    new URLSearchParams(window.location.search).forEach(function (v, k) { out[k] = v; });
    return out;
  }

  /* 값이 비면 키를 지운다. push=true면 히스토리에 쌓여 뒤로가기로 되돌릴 수 있다. */
  function setQuery(patch, push) {
    var params = new URLSearchParams(window.location.search);
    Object.keys(patch).forEach(function (key) {
      var value = patch[key];
      if (value === null || value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    var search = params.toString();
    var url = window.location.pathname + (search ? '?' + search : '') + window.location.hash;
    if (push) window.history.pushState({ q: search }, '', url);
    else window.history.replaceState({ q: search }, '', url);
  }

  /* ---------- 클립보드 / 다운로드 ---------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    /* http://localhost 밖이나 구형 환경을 위한 폴백 */
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) resolve(); else reject(new Error('copy command rejected'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    /* 즉시 revoke하면 일부 브라우저에서 저장이 취소된다. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- 토스트 ----------
     #toastArea는 세 페이지 공통 셸에 있다. 없으면 만들어 쓴다(스크립트가 죽지 않게). */

  var TOAST_MS = 2600;

  function toastArea() {
    var area = document.getElementById('toastArea');
    if (!area) {
      area = el('div', { class: 'toast-area', id: 'toastArea' });
      document.body.appendChild(area);
    }
    return area;
  }

  function toast(message, kind) {
    var area = toastArea();
    var node = el('div', {
      class: 'toast' + (kind ? ' is-' + kind : ''),
      role: 'status',
      text: String(message)
    });
    area.appendChild(node);
    /* 다음 프레임에 is-visible을 붙여야 CSS transition이 걸린다. */
    window.requestAnimationFrame(function () { node.classList.add('is-visible'); });
    window.setTimeout(function () {
      node.classList.remove('is-visible');
      window.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 400);
    }, TOAST_MS);
    return node;
  }

  Blog.util = {
    qs: qs, qsa: qsa, el: el, on: on, append: append, clear: clear, setHidden: setHidden,
    escapeHtml: escapeHtml, hashCode: hashCode, hashUnit: hashUnit,
    slugHeading: slugHeading, slugAscii: slugAscii, clamp: clamp, pad2: pad2,
    toDate: toDate, fmtDot: fmtDot, fmtDotShort: fmtDotShort, fmtKo: fmtKo, yearOf: yearOf,
    fmtRelative: fmtRelative, sameMoment: sameMoment,
    nowIsoKst: nowIsoKst, todayStampKst: todayStampKst,
    readingMinutes: readingMinutes, debounce: debounce, rafThrottle: rafThrottle,
    getQuery: getQuery, setQuery: setQuery,
    copyText: copyText, download: download, toast: toast
  };
})(window, document);
