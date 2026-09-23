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

  /* 코드 언어의 화면 표기(§5-7 · §6-2). 머리띠와 에디터가 같은 규칙을 쓰도록 한 곳에 둔다.
     v4.0(M3): 강제 대문자 금지. 이름표에 있는 언어는 고유 표기(Java · SQL — 고유명사의 대소문자는 장식이 아니다),
     없는 언어는 받은 그대로, 언어가 없으면 text. KOTLIN·TEXT 같은 ALL-CAPS 데이터 라벨은 FD 클리셰⑤다.
     이름표 조회만 소문자로 한다 — 글쓴이는 ```Java처럼 대문자로 친다(§0-4 H1). */
  function langLabel(lang) {
    var raw = String(lang === null || lang === undefined ? '' : lang);
    var key = raw.trim().toLowerCase();
    if (!key) return 'text';
    return LANG_LABEL[key] || raw;
  }

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

      /* 표기 규칙은 langLabel 하나다. langOf가 소문자로 넘기므로 이름표 밖 언어는 v4.2와 같게 소문자로 보인다. */
      var label = langLabel(lang);
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

  /* ---------- 펜스 코드 블록의 범위 (계약서 §6-2 "코드 블록 안 = codeRanges") ----------
     에디터의 입력 규칙(짝 · Enter · Ctrl+/ · // · 툴바 코드 블록 · 언어 기억)이 "여기가 코드 안인가"를 묻는 단 하나의 답이다.
     기준은 렌더러다 — 글쓴이가 미리보기와 상세 화면에서 코드로 보는 줄에서만 코드 규칙이 켜져야 한다.
     그런데 marked를 부르지 않는다: CDN이 막혀도 에디터 입력은 살아야 하고, 키 하나마다 lexer 전체를 돌릴 수는 없다.
     그래서 CommonMark 블록 구조 가운데 펜스 판정에 영향을 주는 것만 따라간다 —
       컨테이너(인용 · 목록 항목): 끝나면 그 안의 펜스도 닫힌다
       문단: 게으른 이어짐(컨테이너 표시 없는 줄이 문단을 잇는다)과 "목록이 문단을 끊을 수 있나"를 가르는 데만 쓴다
       HTML 블록: 그 안의 ``` 줄은 펜스가 아니다
       4칸 들여쓰기: 들여쓴 코드든 문단 이어짐이든 그 줄의 ```는 펜스가 아니다(들여쓴 코드 자체는 범위에 넣지 않는다 — §6-2)
     제목·표·강조는 "문단을 끝내는가"만 본다. 결과는 marked 12.0.2 lexer의 펜스 code 토큰과 대조해 합격시켰다(계약 합격 표). */

  /* marked 12의 lexer는 줄 머리 탭을 공백 4칸으로 펴고 나서 판정한다. 기준이 marked라 같은 폭을 쓴다(CommonMark의 탭 정지와 조금 다르다). */
  var TAB_COLS = 4;

  var FENCE_OPEN_RE = /^(`{3,}|~{3,})([\s\S]*)$/;
  var FENCE_CLOSE_RE = /^(`{3,}|~{3,})[ \t]*$/;
  var BLANK_RE = /^[ \t]*$/;
  var THEMATIC_RE = /^(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
  var LIST_MARKER_RE = /^(?:[-+*]|(\d{1,9})[.)])(?=[ \t]|$)/;
  var ATX_RE = /^#{1,6}(?:[ \t]|$)/;
  var SETEXT_RE = /^(?:=+|-+)[ \t]*$/;

  /* HTML 블록의 시작 조건(CommonMark 종류 1 · 2 · 6 · 7). 끝 조건이 종류마다 달라 end로 돌려준다.
     3~5(<? · <!X · <![CDATA[)는 학습 메모에 나오지 않아 따라가지 않는다 — 그 안의 ```는 펜스로 잡힌다(받아들인다). */
  var HTML_RAW_RE = /^<(?:pre|script|style|textarea)(?:[ \t>]|$)/i;
  var HTML_RAW_END_RE = /<\/(?:pre|script|style|textarea)>/i;
  var HTML_BLOCK_TAGS = 'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|' +
    'fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|' +
    'nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';
  var HTML_BLOCK_RE = new RegExp('^</?(?:' + HTML_BLOCK_TAGS + ')(?:[ \\t>]|/>|$)', 'i');
  var HTML_TAG_LINE_RE = /^(?:<[A-Za-z][A-Za-z0-9-]*(?:[ \t]+[A-Za-z_:][\w.:-]*(?:[ \t]*=[ \t]*(?:[^ \t"'=<>`]+|'[^']*'|"[^"]*"))?)*[ \t]*\/?>|<\/[A-Za-z][A-Za-z0-9-]*[ \t]*>)[ \t]*$/;

  /* i부터 공백·탭이 몇 칸인가. pad는 앞 컨테이너가 탭을 반만 먹고 남긴 가상 칸이다. */
  function indentAt(text, i, end, pad) {
    var cols = pad;
    while (i < end) {
      var ch = text.charCodeAt(i);
      if (ch === 32) cols += 1;
      else if (ch === 9) cols += TAB_COLS;
      else break;
      i += 1;
    }
    return { cols: cols, next: i };
  }

  /* 커서(cur = {i, pad})를 want칸 앞으로. 탭이 넘치면 남는 칸을 pad로 들고 간다. */
  function skipCols(text, cur, end, want) {
    var have = cur.pad;
    var i = cur.i;
    while (have < want && i < end) {
      var ch = text.charCodeAt(i);
      if (ch === 32) have += 1;
      else if (ch === 9) have += TAB_COLS;
      else break;
      i += 1;
    }
    cur.i = i;
    cur.pad = Math.max(0, have - want);
  }

  /* 인용 표시 '>'와 그 뒤 공백 하나(marked처럼 탭 하나도)를 먹는다. */
  function skipQuoteMarker(text, cur, markerAt, end) {
    cur.i = markerAt + 1;
    cur.pad = 0;
    if (cur.i < end) {
      var ch = text.charCodeAt(cur.i);
      if (ch === 32 || ch === 9) cur.i += 1;
    }
  }

  /* 펜스를 여는 줄이면 {ch, len, lang}. 백틱 펜스의 정보 문자열에 백틱이 있으면 펜스가 아니라 인라인 코드다(합격 표 6행). */
  function fenceOpenOf(content) {
    var m = FENCE_OPEN_RE.exec(content);
    if (!m) return null;
    var info = m[2];
    if (m[1].charAt(0) === '`' && info.indexOf('`') !== -1) return null;
    var trimmed = info.trim();
    return { ch: m[1].charAt(0), len: m[1].length, lang: trimmed ? trimmed.split(/\s+/)[0] : '' };
  }

  /* HTML 블록을 여는 줄이면 끝 조건('raw' | 'comment' | 'blank'). 종류 7(태그 하나뿐인 줄)은 문단을 끊지 못한다. */
  function htmlStartOf(content, paraOpen) {
    if (HTML_RAW_RE.test(content)) return 'raw';
    if (content.indexOf('<!--') === 0) return 'comment';
    if (HTML_BLOCK_RE.test(content)) return 'blank';
    if (!paraOpen && HTML_TAG_LINE_RE.test(content)) return 'blank';
    return null;
  }

  function htmlEndsOn(end, content) {
    if (end === 'raw') return HTML_RAW_END_RE.test(content);
    if (end === 'comment') return content.indexOf('-->') !== -1;
    return BLANK_RE.test(content);
  }

  /* 문단이 열려 있을 때 목록 표시가 새 목록을 시작할 수 있나 — 빈 항목과 1이 아닌 번호는 문단을 끊지 못한다. */
  function listCanInterrupt(m, emptyItem) {
    return !emptyItem && (m[1] === undefined || m[1] === '1');
  }

  /* 게으른 이어짐이 아닌 줄(= 새 블록을 여는 줄)인가. 컨테이너 표시가 빠진 줄에서만 묻는다. */
  function opensBlock(content) {
    if (BLANK_RE.test(content) || content.charAt(0) === '>') return true;
    if (fenceOpenOf(content) || ATX_RE.test(content) || THEMATIC_RE.test(content)) return true;
    if (htmlStartOf(content, true)) return true;
    var m = LIST_MARKER_RE.exec(content);
    return Boolean(m) && listCanInterrupt(m, BLANK_RE.test(content.slice(m[0].length)));
  }

  /* 열린 컨테이너를 바깥부터 몇 개 이어 가는지 센다. cur는 이어진 컨테이너의 표시 뒤로 옮겨진다. */
  function matchContainers(text, cur, end, stack) {
    var n = 0;
    for (; n < stack.length; n += 1) {
      var sp = indentAt(text, cur.i, end, cur.pad);
      if (stack[n].quote) {
        if (sp.cols > 3 || sp.next >= end || text.charAt(sp.next) !== '>') break;
        skipQuoteMarker(text, cur, sp.next, end);
      } else if (sp.next >= end) {
        /* 빈 줄은 목록 항목을 끝내지 않는다 — 느슨한 목록(§0-4 H3)과 항목 안 펜스 위의 빈 줄(합격 표 7행) */
        cur.i = end;
        cur.pad = 0;
      } else if (sp.cols >= stack[n].item) {
        skipCols(text, cur, end, stack[n].item);
      } else {
        break;
      }
    }
    return n;
  }

  /* 이 줄에서 새로 열리는 컨테이너를 stack에 쌓는다. 무엇이든 열었으면 true. */
  function openContainers(text, cur, end, stack, paraOpen) {
    var opened = false;
    for (;;) {
      var sp = indentAt(text, cur.i, end, cur.pad);
      if (sp.cols >= 4) break;
      var content = text.slice(sp.next, end);
      if (content.charAt(0) === '>') {
        skipQuoteMarker(text, cur, sp.next, end);
        stack.push({ quote: true });
        opened = true;
        continue;
      }
      if (THEMATIC_RE.test(content)) break;      // "- - -"는 목록이 아니라 구분선
      var m = LIST_MARKER_RE.exec(content);
      if (!m) break;
      var markEnd = sp.next + m[0].length;
      var after = indentAt(text, markEnd, end, 0);
      var emptyItem = after.next >= end;
      if (paraOpen && !opened && !listCanInterrupt(m, emptyItem)) break;
      /* 항목 내용의 들여쓰기 = 표시 앞 칸 + 표시 + 뒤 공백(1~4). 비었거나 5칸 이상이면 공백 하나로 친다(그 뒤는 들여쓴 코드). */
      var gap = (emptyItem || after.cols >= 5) ? 1 : after.cols;
      stack.push({ item: sp.cols + m[0].length + gap });
      if (emptyItem) {
        cur.i = end;
        cur.pad = 0;
      } else if (after.cols >= 5) {
        cur.i = markEnd;
        cur.pad = 0;
        skipCols(text, cur, end, 1);
      } else {
        cur.i = after.next;
        cur.pad = 0;
      }
      opened = true;
    }
    return opened;
  }

  function freezeRange(open, bodyStart, bodyEnd, close, lang) {
    return Object.freeze({ open: open, bodyStart: bodyStart, bodyEnd: bodyEnd, close: close, lang: lang });
  }

  /* 컨테이너가 끝나 닫는 펜스 없이 끝난 블록의 끝 = 마지막으로 블록에 속한 줄의 끝(\r\n이면 \r 앞).
     그 줄의 시작이 아니라 끝인 이유: close === bodyEnd(닫히지 않은 블록)에서 codeAt은 pos === bodyEnd를 안으로 치는데,
     다음 줄의 시작을 bodyEnd로 두면 컨테이너 밖 줄의 첫 자리가 코드가 된다. */
  function lineEndBefore(text, ls) {
    var e = ls - 1;
    return (e > 0 && text.charCodeAt(e - 1) === 13) ? e - 1 : e;
  }

  function scanCodeRanges(text) {
    var ranges = [];
    var stack = [];          // 열린 컨테이너: { quote: true } | { item: 내용 들여쓰기 칸 수 }
    var fence = null;        // 열린 펜스: { open, bodyStart, ch, len, lang, depth }
    var html = null;         // 열린 HTML 블록: { end, depth }
    var paraOpen = false;
    var len = text.length;
    var ls = 0;

    for (;;) {
      var nl = text.indexOf('\n', ls);
      var le = nl === -1 ? len : nl;
      var ce = (le > ls && text.charCodeAt(le - 1) === 13) ? le - 1 : le;   // 줄 내용의 끝(\r 앞)
      var cur = { i: ls, pad: 0 };
      var matched = matchContainers(text, cur, ce, stack);

      if (fence && matched < fence.depth) {
        var end = lineEndBefore(text, ls);
        /* 빈 블록이면 bodyStart(다음 줄 시작)가 end보다 뒤에 남는다 — 코드 자리가 하나도 없다는 뜻이다(codeAt은 늘 null). */
        ranges.push(freezeRange(fence.open, fence.bodyStart, end, end, fence.lang));
        fence = null;
      }
      if (html && matched < html.depth) html = null;

      if (fence) {
        var fsp = indentAt(text, cur.i, ce, cur.pad);
        var fm = fsp.cols <= 3 ? FENCE_CLOSE_RE.exec(text.slice(fsp.next, ce)) : null;
        if (fm && fm[1].charAt(0) === fence.ch && fm[1].length >= fence.len) {
          ranges.push(freezeRange(fence.open, fence.bodyStart, ls, ce, fence.lang));
          fence = null;
        }
      } else if (html) {
        if (htmlEndsOn(html.end, text.slice(cur.i, ce))) {
          html = null;
          paraOpen = false;
        }
      } else {
        scanBlockLine();
      }

      if (nl === -1) break;
      ls = nl + 1;
    }

    if (fence) ranges.push(freezeRange(fence.open, fence.bodyStart, len, len, fence.lang));
    return ranges;

    /* 펜스·HTML 블록 밖의 한 줄. 위 루프의 지역 변수(ls · le · ce · cur · matched)를 그대로 쓴다. */
    function scanBlockLine() {
      if (matched < stack.length) {
        var probe = indentAt(text, cur.i, ce, cur.pad);
        if (paraOpen && (probe.cols >= 4 || !opensBlock(text.slice(probe.next, ce)))) return;   // 게으른 이어짐
        stack.length = matched;
        paraOpen = false;
      }
      if (openContainers(text, cur, ce, stack, paraOpen)) paraOpen = false;

      var sp = indentAt(text, cur.i, ce, cur.pad);
      var content = text.slice(sp.next, ce);
      if (BLANK_RE.test(content)) { paraOpen = false; return; }
      if (sp.cols >= 4) return;                  // 들여쓴 코드이거나 문단 이어짐 — 어느 쪽이든 펜스가 아니다

      var f = fenceOpenOf(content);
      if (f) {
        fence = { open: ls, bodyStart: le < len ? le + 1 : len, ch: f.ch, len: f.len, lang: f.lang, depth: stack.length };
        paraOpen = false;
        return;
      }
      var h = htmlStartOf(content, paraOpen);
      if (h) {
        /* 종류 1·2는 시작 줄에서 바로 끝날 수 있다(<!-- 한 줄 -->). 종류 6·7의 끝은 빈 줄이라 시작 줄에서는 안 끝난다. */
        html = (h !== 'blank' && htmlEndsOn(h, content)) ? null : { end: h, depth: stack.length };
        paraOpen = false;
        return;
      }
      if (ATX_RE.test(content) || THEMATIC_RE.test(content) || (paraOpen && SETEXT_RE.test(content))) {
        paraOpen = false;
        return;
      }
      paraOpen = true;
    }
  }

  /* 같은 글이면 직전 결과를 그대로 준다(메모 1칸). 에디터는 키 하나에 여러 규칙이 같은 글을 묻는다.
     돌려주는 배열과 원소는 얼려 둔다 — 여러 호출부가 같은 객체를 나눠 가지므로 한 곳이 고치면 다른 곳의 답이 바뀐다. */
  var memoText = null;
  var memoRanges = Object.freeze([]);

  function codeRanges(text) {
    var s = String(text === null || text === undefined ? '' : text);
    if (s !== memoText) {
      memoRanges = Object.freeze(scanCodeRanges(s));
      memoText = s;
    }
    return memoRanges;
  }

  /* pos가 코드 줄 위면 그 블록, 아니면 null. 여는·닫는 펜스 줄은 코드가 아니다.
     닫히지 않은 블록은 끝 자리(bodyEnd)도 안이다 — 문서 끝에서 이어 치는 글자가 코드이기 때문이다. */
  function codeAt(text, pos) {
    var ranges = codeRanges(text);
    for (var k = 0; k < ranges.length; k += 1) {
      var r = ranges[k];
      if (r.bodyStart > pos) break;
      if (pos < r.bodyEnd || (r.close === r.bodyEnd && pos === r.bodyEnd)) return r;
    }
    return null;
  }

  Blog.markdown = {
    codeRanges: codeRanges,
    codeAt: codeAt,
    langLabel: langLabel,
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
