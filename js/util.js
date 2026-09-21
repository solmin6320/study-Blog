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

  /* URL을 받는 속성. 이 속성에 스크립트 스킴이 들어가면 클릭 한 번이 곧 코드 실행이다.
     호출부는 전부 'post.html?id=' 같은 고정 접두사 뒤에 encodeURIComponent로 값을 붙이므로
     정상 경로에서는 걸릴 일이 없다 — 이 검사는 그 약속이 깨졌을 때를 위한 마지막 그물이다.
     blob:은 다운로드(download)가 쓰므로 막지 않는다. */
  var URL_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href'];
  var BAD_SCHEME_RE = /^(?:javascript|vbscript|data):/i;

  function isSafeUrlAttr(value) {
    /* 브라우저는 스킴 앞뒤의 제어문자·공백을 무시하고 해석하므로("java\nscript:") 검사 전에 같은 방식으로 지운다. */
    var normalized = String(value).replace(/[\x00-\x20\x7f-\x9f]/g, "");
    return !BAD_SCHEME_RE.test(normalized);
  }

  /* el('div', {class:'x', text:'안녕'}, [child]) — text는 항상 textContent로 들어간다.
     html 키는 의도적으로 막아 둔다. 살균되지 않은 문자열이 DOM에 들어갈 통로를 없애기 위함.
     on* 키는 함수만 받는다(문자열이면 인라인 핸들러 속성이 되고, CSP에도 걸린다).
     style 키는 객체(CSSOM)만 받는다 — 문자열 style 속성은 CSP(style-src 'self')가 막는다. */
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
        if (key === 'style') {
          if (typeof value !== 'object') throw new Error('el(): style은 객체로만 받는다(문자열 style 속성은 CSP가 막는다).');
          Object.keys(value).forEach(function (s) { node.style[s] = value[s]; });
          return;
        }
        if (key.slice(0, 2) === 'on') {
          if (typeof value !== 'function') throw new Error('el(): ' + key + ' 은(는) 함수만 받는다(인라인 핸들러 문자열 금지).');
          node.addEventListener(key.slice(2).toLowerCase(), value);
          return;
        }
        if (value === true) { node.setAttribute(key, ''); return; }
        if (URL_ATTRS.indexOf(key.toLowerCase()) !== -1 && !isSafeUrlAttr(value)) return;   // 위험 스킴은 속성 자체를 버린다
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

  /* 문자열 → 32bit 정수. "같은 입력이면 언제나 같은 결과"가 필요할 때 쓴다(난수 대용). */
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

  /* 태그 비교 키. 화면에는 사용자가 적은 그대로(CSS) 보여 주되 필터·개수·연관 글은 이 키로 맞춘다 —
     "CSS"와 "css"가 다른 태그로 갈라지면 인덱스에 같은 태그가 두 줄 서고 한쪽 글이 필터에서 빠진다.
     app.js·post.js가 같은 함수를 써야 ?tags= 링크와 인덱스 판정이 어긋나지 않는다(meeting-05 dev 7). */
  function normTag(tag) {
    return String(tag === null || tag === undefined ? '' : tag).trim().toLowerCase();
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

  /* ---------- 분류 정렬 ----------
     store.categoryList() 결과를 화면에 그리는 순서: categories.json의 order 오름차순 →
     같으면 글 수 내림차순 → 이름(ko). order를 먼저 보는 이유 — 분류의 순서는 사용자의 편집 대상이다.
     목록 인덱스(app.js)·사이드바(app.js / post.js / editor.js)가 전부 같은 순서여야 하므로 여기 한 곳에 둔다.
     store.categoryList 자체의 정렬(order → 이름)과는 다르다 — 글 수를 끼워 넣는 것은 화면의 규칙이다. */
  function byCatOrder(a, b) {
    if (a.order !== b.order) return a.order - b.order;
    if (a.count !== b.count) return b.count - a.count;
    return String(a.name).localeCompare(String(b.name), 'ko');
  }

  function sortCats(list) {
    return (list || []).slice().sort(byCatOrder);
  }

  /* ---------- 글 카드 (계약서 §4-4) ----------
     목록(app.js)과 연관 글(post.js)이 같은 카드를 그린다. 마크업 출처가 둘이면 다음 개정에서 한쪽만 고쳐진다 —
     그래서 여기 한 곳에 둔다(계약서 §12-9 #50). 순서 고정: .entry-cat → .entry-title → .entry-meta(날짜 · 태그).
     요약·수정일·아이콘은 없다 — 카드는 "무슨 글인지"까지만 말하고 나머지는 상세가 한다.
     태그는 링크가 아니다(카드 전체가 .entry-title::after로 링크 면적이라 안에 링크가 겹치면 안 된다).
       opts.tags       태그 줄에 넣을 태그. 기본은 post.tags 전부. 연관 글은 "겹치는 태그만" 넘긴다(§5-8).
       opts.tagsLabel  .entry-tags의 aria-label. 기본 '태그'.
       opts.pinned     .is-pinned 여부. 기본 post.pinned. 연관 글은 false — 고정은 목록의 정렬 정보라 거기선 뜻이 없다.
     store는 호출 시점에 찾는다(util.js가 store.js보다 먼저 로드된다). */
  function entryCard(post, opts) {
    var o = opts || {};
    var store = Blog.store;
    var pinned = o.pinned === undefined ? Boolean(post.pinned) : Boolean(o.pinned);
    var tags = Array.isArray(o.tags) ? o.tags : (post.tags || []);

    var li = el('li', { class: 'entry' + (pinned ? ' is-pinned' : '') });

    /* 미분류는 라벨을 생략한다. "미분류"는 정보가 아니라 "분류를 안 했다"는 고백이라
       카드마다 찍히면 목록이 미완성으로 보인다. */
    if (store.categorySlug(post.category) !== CFG.category.fallbackSlug) {
      li.appendChild(el('span', { class: 'entry-cat', text: store.categoryName(post.category) }));
    }

    li.appendChild(el('a', {
      class: 'entry-title',
      href: 'post.html?id=' + encodeURIComponent(post.id),
      text: post.title
    }));

    /* created가 비면 <time datetime=""> 라는 무효 마크업이 된다.
       store가 updated → id 앞머리 순으로 되살리므로 여기까지 빈 값이 오는 경우는
       "날짜를 어디서도 알 수 없는 글" 하나뿐이다. 그때는 날짜를 그리지 않는다 —
       카드는 그리드 셀이라 자리 지킴(빈 span)이 필요 없다. 날짜·태그 둘 다 없으면 메타 줄째 뺀다. */
    var meta = [];
    if (post.created) {
      meta.push(el('time', {
        class: 'entry-date',
        datetime: post.created,
        text: fmtDot(post.created)
      }));
    }
    if (tags.length) {
      meta.push(el('ul', { class: 'entry-tags', 'aria-label': o.tagsLabel || '태그' },
        tags.map(function (tag) { return el('li', { class: 'entry-tag', text: tag }); })));
    }
    if (meta.length) li.appendChild(el('div', { class: 'entry-meta' }, meta));

    return li;
  }

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

  /* 2026.09.13 — 목록의 날짜 열과 상세의 날짜 줄이 쓴다.
     두 화면이 같은 형식을 쓰는 것은 의도다(같은 글의 같은 날짜가 다르게 보이면 안 된다). */
  function fmtDot(iso) {
    var p = parts(iso);
    return p ? p.y + '.' + p.m + '.' + p.d : '';
  }

  /* 2026년 9월 13일 — 에디터 안내문처럼 문장 속에 들어가는 자리 */
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
    normTag: normTag, slugHeading: slugHeading, slugAscii: slugAscii, clamp: clamp, pad2: pad2,
    sortCats: sortCats, entryCard: entryCard,
    toDate: toDate, fmtDot: fmtDot, fmtKo: fmtKo, yearOf: yearOf,
    fmtRelative: fmtRelative, sameMoment: sameMoment,
    nowIsoKst: nowIsoKst, todayStampKst: todayStampKst,
    debounce: debounce, rafThrottle: rafThrottle,
    getQuery: getQuery, setQuery: setQuery,
    copyText: copyText, download: download, toast: toast
  };
})(window, document);
