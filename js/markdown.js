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

    /* 이 문서 말고 다른 곳으로 여는 링크에는 예외 없이 rel을 붙인다.
       noopener 없이 target=_blank를 두면 열린 문서가 window.opener로 이 창을 조작할 수 있고,
       _top/_parent는 창을 넘겨주지는 않지만 referrer로 어떤 글에서 왔는지가 그대로 새어 나간다.
       그래서 _blank만 보지 않고 "_self가 아닌 모든 target"을 대상으로 한다. */
    var SAME_DOC_TARGETS = ['', '_self'];

    function hardenLink(node) {
      if (!node.hasAttribute('target')) return;
      var target = String(node.getAttribute('target')).trim().toLowerCase();
      if (SAME_DOC_TARGETS.indexOf(target) !== -1) return;
      node.setAttribute('rel', 'noopener noreferrer');
    }

    /* 본문에서 살아남는 <input>은 GFM 체크리스트(- [ ] 항목)가 만드는 "비활성 체크박스" 하나뿐이다.
       html 프로파일이 input을 통째로 허용하므로, 그대로 두면 글 안에 텍스트 입력칸을 그릴 수 있다 —
       스크립트는 못 돌아도 "비밀번호를 입력하세요" 같은 가짜 폼이 된다(form은 막았지만 입력칸만으로도 속인다).
       체크박스가 아니면 노드째 버리고, 체크박스면 disabled를 강제한다(marked도 disabled로 내지만 원문 HTML은 아닐 수 있다). */
    function restrictInput(node) {
      var type = String(node.getAttribute('type') || '').trim().toLowerCase();
      if (type !== 'checkbox') {
        if (node.parentNode) node.parentNode.removeChild(node);
        return;
      }
      node.setAttribute('disabled', '');
    }

    window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A') { hardenLink(node); return; }
      if (node.tagName === 'INPUT') { restrictInput(node); }
    });

    configured = true;
    return true;
  }

  /* html 프로파일에서 추가로 막는 태그.
     iframe·object·embed·script는 프로파일 밖이라 원래 안 들어오지만, 누군가 ADD_TAGS로 넓혀도
     FORBID가 이기도록 명시한다 — 살균 설정은 "무엇을 여는가"보다 "무엇을 절대 안 여는가"가 읽혀야 한다.
     button·select·textarea·dialog는 본문에 상태 있는 컨트롤을 두지 않는다는 규칙(계약서 §7-1과 같은 취지).
     template은 렌더되지 않는 하위 트리라 살균 우회(mXSS)의 단골이다. input은 훅(restrictInput)이 다룬다. */
  var FORBIDDEN_TAGS = [
    'style', 'form', 'iframe', 'object', 'embed', 'script',
    'button', 'select', 'textarea', 'dialog', 'template'
  ];

  /* 마크다운 → 살균된 DocumentFragment.
     문자열 HTML을 돌려주지 않는 이유: 호출부가 innerHTML에 넣을 여지를 아예 없애기 위해.
     USE_PROFILES html + 기본 ALLOWED_URI_REGEXP 를 유지한다 — href/src의 javascript: 는 여기서 떨어지고,
     그래도 남는 것은 CSP(script-src)가 한 번 더 막는다. style 속성은 CSP(style-src 'self')에도 걸리므로 살균에서 미리 뗀다. */
  function renderFragment(markdown) {
    if (!configure()) {
      throw new Error('marked / DOMPurify 로드 실패. CDN 스크립트를 확인하세요.');
    }
    var rawHtml = window.marked.parse(String(markdown || ''));
    return window.DOMPurify.sanitize(rawHtml, {
      RETURN_DOM_FRAGMENT: true,
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
      FORBID_TAGS: FORBIDDEN_TAGS,
      FORBID_ATTR: ['style']
    });
  }

  /* ---------- 후처리 ---------- */

  /* 프로토타입 없는 맵으로 만든다. 객체 리터럴이면 ```constructor 로 시작하는 코드블록에서
     LANG_LABEL[lang]이 Object.prototype.constructor 함수를 집어, 라벨과 복사 버튼의 aria-label에
     함수 소스 전체가 박힌다. 본문은 사용자가 쓰는 값이라 이런 키가 들어올 수 있다고 보고 막는다. */
  var LANG_LABEL = Object.assign(Object.create(null), {
    js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
    html: 'HTML', xml: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON', md: 'Markdown',
    markdown: 'Markdown', bash: 'Bash', sh: 'Shell', shell: 'Shell', sql: 'SQL',
    python: 'Python', py: 'Python', java: 'Java', yaml: 'YAML', yml: 'YAML',
    diff: 'Diff', plaintext: 'text', text: 'text'
  });

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

      /* v4.0(M3, 계약서 §5-7): 강제 대문자 금지. 이름표에 있는 언어는 고유 표기(Java · SQL — 고유명사의 대소문자는 장식이 아니다),
         없는 언어는 적힌 그대로(kotlin), 언어가 없으면 text. KOTLIN·TEXT 같은 ALL-CAPS 데이터 라벨은 FD 클리셰⑤다. */
      var label = lang ? (LANG_LABEL[lang] || lang) : 'text';
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

  /* ---------- 표 ----------
     요구사항 5의 "표"는 이 블로그의 일급 기능이다(그래프는 정식 제외). 표에 필요한 것은 세 가지 —
     ① GFM 정렬이 화면에 살아 있을 것 ② 넘칠 때 스크롤되고 키보드로도 스크롤될 것
     ③ 표가 여러 개여도 스크린리더가 서로 구분해 부를 수 있을 것. */

  /* GFM 정렬(:--- / :---: / ---:) 복원.

     marked 12.0.2는 정렬을 <td align="right">로 내보내고, DOMPurify 3.1.6의 html 프로파일도
     align을 허용 목록에 갖고 있어 살균 후에도 속성은 남는다(둘 다 실물로 확인).
     그런데도 화면에서는 정렬이 죽는다 — prose.css의 `.prose th,.prose td{text-align:start}`가
     작성자 규칙이고, align 속성이 만드는 presentational hint는 작성자 규칙에 언제나 밀리기 때문이다.
     CSS는 web-designer 소유라 여기서 고칠 수 없고, 살균 프로파일을 넓히는 것은 금지다.
     그래서 살균이 끝난 DOM에서 인라인 스타일로 되살린다.
     값은 아래 세 개의 허용 목록에서만 나온다 — 사용자 문자열이 CSS로 들어갈 통로가 없어야 하므로
     ALLOWED_ATTR을 넓히는 방식(문자열을 그대로 신뢰)과는 다르다.
     align 속성 자체는 남겨 둔다. 나중에 prose.css가 td[align] 규칙을 가지면 이 함수는 지워도 된다. */
  var ALIGN_VALUES = Object.assign(Object.create(null), {
    left: 'left', center: 'center', right: 'right'
  });

  function restoreTableAlign(root) {
    U.qsa('th[align], td[align]', root).forEach(function (cell) {
      var value = ALIGN_VALUES[String(cell.getAttribute('align')).trim().toLowerCase()];
      if (!value) { cell.removeAttribute('align'); return; }   // 목록 밖 값은 남겨 두지 않는다
      cell.style.textAlign = value;
    });
  }

  /* 표의 접근 가능한 이름. 전부 "표"로 들리면 스크린리더의 지역 목록에서 고를 수가 없다.
     순번은 항상 붙이고(유일성), 맥락이 있으면 덧붙인다: caption > 직전 제목 순. */
  var TABLE_LABEL_MAX = 34;

  function contextTextFor(wrap) {
    var caption = U.qs('caption', wrap);
    if (caption && caption.textContent.trim()) return caption.textContent.trim();
    /* 표 바로 앞의 문단·목록은 건너뛰고 가장 가까운 제목까지 거슬러 올라간다. */
    var node = wrap.previousElementSibling;
    while (node) {
      if (/^H[1-6]$/.test(node.tagName)) return node.textContent.trim();
      node = node.previousElementSibling;
    }
    return '';
  }

  function tableLabel(wrap, ordinal) {
    var context = contextTextFor(wrap);
    if (context.length > TABLE_LABEL_MAX) context = context.slice(0, TABLE_LABEL_MAX - 1).trim() + '…';
    /* v4.0: 가운뎃점 대신 쉼표 — 스크린리더가 "·"를 "가운뎃점"으로 읽거나 건너뛰어 두 말이 붙는다. 쉼표는 숨을 한 번 쉰다. */
    return '표 ' + ordinal + (context ? ', ' + context : '');
  }

  /* 넘치는 표에만 스크롤 지역 표식(role·tabindex·이름)을 준다.

     래퍼 자체는 넘치든 말든 항상 만든다 —
     ① 넘침 여부는 뷰포트에 따라 달라진다. 1440px에서 안 넘치던 표도 360px에서는 반드시 넘친다.
        렌더 시점의 한 번뿐인 판정으로 래퍼를 만들지 않으면, 창을 줄였을 때 페이지 전체가 가로로 찢어진다.
     ② prose.css가 .table-wrap에 테두리·배경·스크롤 신호를 건다. 래퍼 유무로 표의 생김새가
        화면 크기마다 달라지면 같은 글이 다른 물건으로 보인다.
     반대로 role/tabindex는 조건부여야 한다. 스크롤되지 않는 표까지 탭 스톱으로 만들면
     키보드 사용자는 아무 일도 일어나지 않는 정거장을 표 개수만큼 지나야 한다(WCAG 2.4.3).
     스크롤되는 표는 반드시 포커스를 받아야 한다 — 키보드로 가로 스크롤할 유일한 수단이다(2.1.1). */
  function syncTableRegions() {
    var wraps = U.qsa('.table-wrap');
    /* 측정(읽기)을 먼저 모아서 끝낸다. 읽기·쓰기를 번갈아 하면 표 개수만큼 강제 리플로우가 난다. */
    var fits = wraps.map(function (wrap) {
      /* clientWidth가 0이면 아직 레이아웃되지 않은 것(숨겨진 미리보기 등)이라 "모름"이다. */
      if (!wrap.clientWidth) return false;
      return wrap.scrollWidth <= wrap.clientWidth + 1;
    });
    wraps.forEach(function (wrap, i) {
      /* 확실히 안 넘칠 때만 표식을 뗀다. 모를 때 떼면 스크롤되는 표에서 키보드를 잃는다.
         단, 지금 그 표에 포커스가 들어와 있으면 건드리지 않는다 —
         창 크기를 바꾸는 순간 포커스가 <body>로 튕겨 나가면 키보드 사용자는 위치를 잃는다. */
      if (fits[i] && !wrap.contains(document.activeElement)) {
        wrap.removeAttribute('role');
        wrap.removeAttribute('tabindex');
        wrap.removeAttribute('aria-label');
        return;
      }
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', tableLabel(wrap, i + 1));
    });
  }

  /* 창 크기가 바뀌면 안 넘치던 표가 넘치기 시작한다. 표를 그린 페이지에서만, 한 번만 붙인다.
     DOM 참조를 들고 있지 않고 그때그때 훑으므로 미리보기를 수백 번 다시 그려도 새지 않는다. */
  var resizeBound = false;

  function bindTableResize() {
    if (resizeBound) return;
    resizeBound = true;
    U.on(window, 'resize', U.rafThrottle(syncTableRegions));
  }

  function enhanceTables(root) {
    U.qsa('table', root).forEach(function (table) {
      if (!table.parentNode || table.parentNode.classList.contains('table-wrap')) return;
      var wrap = U.el('div', { class: 'table-wrap' });
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
    restoreTableAlign(root);
    bindTableResize();
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

  /* 본문 이미지(m3, meeting-07).
     lazy·async — 긴 글의 아래쪽 그림이 첫 화면의 글자보다 먼저 대역폭을 먹지 않게 한다.
     width/height는 주지 않는다. 마크다운(![alt](src))에는 크기가 없고, 알아내려면 그림을 미리 받아야 해서
     lazy가 아낀 것을 도로 쓴다. 자리 이동(CLS)은 lazy 덕에 대부분 화면 밖에서 일어난다 —
     크기를 꼭 고정해야 하는 그림은 작성자가 <img width height>로 직접 쓰면 살균을 통과해 그대로 남는다.
     alt가 없으면 alt=""(장식)로 둔다. 속성이 아예 없으면 스크린리더가 파일 이름을 대신 읽는다.
     관리자에게 경고하지 않는 이유 — 이 블로그의 그림은 대개 본문이 이미 말한 것을 보여 주는 보조라 장식 판정이
     맞는 경우가 많고, 글을 열 때마다 토스트·콘솔이 울리면 진짜 경고(index.json 어긋남)가 묻힌다. */
  function enhanceImages(root) {
    U.qsa('img', root).forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (!img.getAttribute('alt')) img.setAttribute('alt', '');
    });
  }

  /* h2/h3에 안전한 id를 부여하고 목차용 목록을 만든다. 중복 제목이면 -2, -3을 붙인다.
     id에는 h- 접두사를 붙인다(M4-6) — 본문 제목이 "toc"·"main"·"side"·"post"이면 페이지 요소의 id와 부딪혀
     목차 클릭이 엉뚱한 곳으로 뛴다. used는 root 안만 세므로 접두사로 이름 공간을 아예 가른다. */
  var HEADING_ID_PREFIX = 'h-';

  function collectHeadings(root) {
    var used = Object.create(null);
    var list = [];
    U.qsa('h2, h3', root).forEach(function (h, index) {
      var text = h.textContent.trim();
      var base = HEADING_ID_PREFIX + (U.slugHeading(text) || ('section-' + (index + 1)));
      var id = base;
      var n = 2;
      while (used[id]) { id = base + '-' + n; n += 1; }
      used[id] = true;
      h.id = id;
      list.push({ id: id, text: text, level: h.tagName === 'H2' ? 2 : 3, el: h });
    });
    return list;
  }

  /* 본문의 `# 제목`(h1)은 h2로 내린다(M8, meeting-07).
     페이지의 h1은 글 제목(#postTitle) 하나다 — 본문 h1이 남으면 제목 계층이 둘로 갈라지고,
     목차(collectHeadings)는 h2·h3만 모으므로 그 절이 목차에서 통째로 빠진다.
     글 파일은 고치지 않는다(.md가 진실). 화면에서만 내린다. 에디터 미리보기도 같은 경로라 "보이는 대로"가 유지된다.
     옮기는 속성은 이미 살균을 통과한 값뿐이라 새로 열리는 통로가 없다. */
  function demoteH1(root) {
    U.qsa('h1', root).forEach(function (h1) {
      var h2 = document.createElement('h2');
      Array.prototype.forEach.call(h1.attributes, function (attr) { h2.setAttribute(attr.name, attr.value); });
      while (h1.firstChild) h2.appendChild(h1.firstChild);
      h1.parentNode.replaceChild(h2, h1);
    });
  }

  /* 렌더 + 후처리를 한 번에. 반환값의 headings로 TOC를 만든다. */
  function renderInto(container, markdown, options) {
    var opts = options || {};
    U.clear(container);
    /* 문서에 붙이기 전 조각에서 내린다 — 붙인 뒤 바꾸면 제목 수만큼 레이아웃을 다시 한다. */
    var frag = renderFragment(markdown);
    demoteH1(frag);
    container.appendChild(frag);

    enhanceTables(container);
    enhanceCodeBlocks(container);
    enhanceLinks(container);
    enhanceImages(container);

    /* 넘침 측정은 모든 후처리가 끝난 뒤 한 번만 한다 —
       코드블록 하이라이팅이 폭을 바꾸므로 그 전에 재면 틀린 값을 잰다. */
    syncTableRegions();

    return { headings: opts.headings === false ? [] : collectHeadings(container) };
  }

  /* 목차 렌더. 계약서 §5-4: <a class="toc-item is-h2" href="#...">
     등급 클래스(is-h2 / is-h3)는 생성 시점에 정해져 바뀌지 않는다(계약서 §8).
     .is-active와 data-target은 폐기했다 — 스크롤 스파이가 사라져 "지금 여기"를 쓸 사람이 없다.
     조각에 모아 한 번에 붙인다(항목마다 리플로우를 만들지 않는다). */
  function buildToc(headings, navEl) {
    var frag = document.createDocumentFragment();
    headings.forEach(function (h) {
      frag.appendChild(U.el('a', {
        class: 'toc-item is-h' + h.level,
        href: '#' + encodeURIComponent(h.id),
        text: h.text
      }));
    });
    U.clear(navEl);
    navEl.appendChild(frag);
    return U.qsa('.toc-item', navEl);
  }

  Blog.markdown = {
    configure: configure,
    libsReady: libsReady,
    renderFragment: renderFragment,
    renderInto: renderInto,
    /* 미리보기 패널처럼 "숨겨져 있다가 보이게 되는" 컨테이너는 보이는 순간 표 폭이 처음 정해진다.
       그때 다시 재 달라고 부를 수 있게 열어 둔다(리사이즈 이벤트만으로는 그 순간을 못 잡는다). */
    syncTableRegions: syncTableRegions,
    collectHeadings: collectHeadings,
    buildToc: buildToc
  };
})(window, document);
