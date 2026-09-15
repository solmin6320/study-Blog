/* markdown.js — marked + DOMPurify + highlight.js 설정과 안전 렌더.
   이 파일 밖에서는 절대 마크다운을 HTML로 바꾸지 않는다. 살균 경로를 하나로 묶어 두기 위함. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var U = Blog.util;

  var configured = false;

  function libsReady() {
    return Boolean(window.marked && window.DOMPurify);
  }

  function configure() {
    if (configured || !libsReady()) return configured;

    window.marked.setOptions({
      gfm: true,
      breaks: false,     // 줄바꿈 한 번은 문단 안 줄바꿈으로 치지 않는다(표준 마크다운)
      pedantic: false
    });

    /* 새 탭으로 열리는 링크에는 예외 없이 rel을 붙인다.
       noopener 없이 target=_blank를 두면 열린 문서가 window.opener로 이 창을 조작할 수 있다. */
    window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });

    configured = true;
    return true;
  }

  /* 마크다운 → 살균된 DocumentFragment.
     문자열 HTML을 돌려주지 않는 이유: 호출부가 innerHTML에 넣을 여지를 아예 없애기 위해. */
  function renderFragment(markdown) {
    if (!configure()) {
      throw new Error('marked / DOMPurify 로드 실패 — CDN 스크립트를 확인하세요.');
    }
    var rawHtml = window.marked.parse(String(markdown || ''));
    return window.DOMPurify.sanitize(rawHtml, {
      RETURN_DOM_FRAGMENT: true,
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
      /* input은 GFM 체크리스트(- [ ] 항목)가 만들므로 살려 둔다. style/form은 글에 필요 없다. */
      FORBID_TAGS: ['style', 'form'],
      FORBID_ATTR: ['style']
    });
  }

  /* ---------- 후처리 ---------- */

  var LANG_LABEL = {
    js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
    html: 'HTML', xml: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON', md: 'Markdown',
    markdown: 'Markdown', bash: 'Bash', sh: 'Shell', shell: 'Shell', sql: 'SQL',
    python: 'Python', py: 'Python', java: 'Java', yaml: 'YAML', yml: 'YAML',
    diff: 'Diff', plaintext: 'TEXT', text: 'TEXT'
  };

  function langOf(codeEl) {
    var found = '';
    String(codeEl.className || '').split(/\s+/).forEach(function (cls) {
      if (cls.indexOf('language-') === 0) found = cls.slice('language-'.length);
    });
    return found.toLowerCase();
  }

  /* <pre><code>를 .code-wrap으로 감싸고 언어 라벨과 복사 버튼을 넣는다. */
  function enhanceCodeBlocks(root) {
    U.qsa('pre > code', root).forEach(function (codeEl) {
      var pre = codeEl.parentNode;
      if (!pre || !pre.parentNode || pre.parentNode.classList.contains('code-wrap')) return;

      var lang = langOf(codeEl);

      if (window.hljs) {
        try {
          /* 언어 클래스가 없으면 hljs가 자동 감지한다. 감지 실패해도 렌더는 계속돼야 한다. */
          window.hljs.highlightElement(codeEl);
        } catch (err) {
          codeEl.classList.add('hljs');
        }
      } else {
        codeEl.classList.add('hljs');
      }

      var wrap = U.el('div', { class: 'code-wrap' });
      pre.parentNode.insertBefore(wrap, pre);

      var label = lang ? (LANG_LABEL[lang] || lang.toUpperCase()) : 'TEXT';
      wrap.appendChild(U.el('span', { class: 'code-lang', 'aria-hidden': 'true', text: label }));

      var button = U.el('button', {
        class: 'code-copy',
        type: 'button',
        'aria-label': label + ' 코드 복사',
        text: '복사'
      });
      button.addEventListener('click', function () {
        U.copyText(codeEl.textContent).then(function () {
          U.toast('코드를 복사했습니다', 'ok');
        }).catch(function () {
          U.toast('복사에 실패했습니다. 직접 선택해 복사해 주세요.', 'err');
        });
      });
      wrap.appendChild(button);
      wrap.appendChild(pre);
    });
  }

  /* 표는 모바일에서 가로로 넘친다. 스크롤 컨테이너로 감싸고 키보드로도 스크롤되게 한다. */
  function enhanceTables(root) {
    U.qsa('table', root).forEach(function (table) {
      if (!table.parentNode || table.parentNode.classList.contains('table-wrap')) return;
      var wrap = U.el('div', {
        class: 'table-wrap',
        role: 'region',
        'aria-label': '표',
        tabindex: '0'
      });
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function enhanceLinks(root) {
    U.qsa('a[href]', root).forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href) && a.hostname !== window.location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function enhanceImages(root) {
    U.qsa('img', root).forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (!img.getAttribute('alt')) img.setAttribute('alt', '');
    });
  }

  /* h2/h3에 안전한 id를 부여하고 목차용 목록을 만든다. 중복 제목이면 -2, -3을 붙인다. */
  function collectHeadings(root) {
    var used = Object.create(null);
    var list = [];
    U.qsa('h2, h3', root).forEach(function (h, index) {
      var text = h.textContent.trim();
      var base = U.slugHeading(text) || ('section-' + (index + 1));
      var id = base;
      var n = 2;
      while (used[id]) { id = base + '-' + n; n += 1; }
      used[id] = true;
      h.id = id;
      list.push({ id: id, text: text, level: h.tagName === 'H2' ? 2 : 3, el: h });
    });
    return list;
  }

  /* 렌더 + 후처리를 한 번에. 반환값의 headings로 TOC를 만든다. */
  function renderInto(container, markdown, options) {
    var opts = options || {};
    U.clear(container);
    container.appendChild(renderFragment(markdown));

    enhanceTables(container);
    enhanceCodeBlocks(container);
    enhanceLinks(container);
    enhanceImages(container);

    return { headings: opts.headings === false ? [] : collectHeadings(container) };
  }

  /* 목차 렌더. 계약서 5절: <a class="toc-item is-h2 is-active" href="#..."> */
  function buildToc(headings, navEl) {
    U.clear(navEl);
    headings.forEach(function (h) {
      navEl.appendChild(U.el('a', {
        class: 'toc-item is-h' + h.level,
        href: '#' + encodeURIComponent(h.id),
        'data-target': h.id,
        text: h.text
      }));
    });
    return U.qsa('.toc-item', navEl);
  }

  Blog.markdown = {
    configure: configure,
    libsReady: libsReady,
    renderFragment: renderFragment,
    renderInto: renderInto,
    collectHeadings: collectHeadings,
    buildToc: buildToc
  };
})(window, document);
