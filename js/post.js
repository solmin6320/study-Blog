/* post.js — post.html 전용. ?id= 로 글을 찾아 렌더하고 목차·연관 글·이전/다음을 붙이고,
   사이드바의 현재 글 아래에 절 목록을 끼워 현재 절을 표시한다(v3.3).
   v3.0: 읽기 진행바·읽는 시간은 폐기됐다. 현재 절 표시는 IntersectionObserver 하나로 한다 —
   이 파일에 스크롤 핸들러는 없다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
  var CFG = Blog.config;
  var U = Blog.util;
  var store = Blog.store;
  var md = Blog.markdown;

  var dom = {};

  /* ---------- 오류 화면 ---------- */

  function showError(title, desc, hint) {
    if (dom.post) U.setHidden(dom.post, true);
    if (!dom.error) return;
    U.setHidden(dom.error, false);
    U.clear(dom.error);
    dom.error.appendChild(U.el('p', null, [U.el('strong', { text: title })]));
    dom.error.appendChild(U.el('p', { text: desc }));
    if (hint) dom.error.appendChild(U.el('p', { text: hint }));
    dom.error.appendChild(U.el('a', { class: 'btn', href: 'index.html', text: '목록으로 돌아가기' }));
    document.title = title;
  }

  /* 글 파일은 분류 폴더 안에 있다. 어디를 봐야 하는지 경로로 알려 준다.
     id는 주소에서 온 값 그대로다 — 문구에는 textContent로만 들어간다(U.el의 text). */
  function showNotFound(id) {
    /* store가 경로 조립을 거부한 id. "없는 글"과 섞어 안내하면 파일을 찾아 헤매게 된다. */
    if (!store.isSafeId(id)) {
      showError('쓸 수 없는 글 주소입니다',
        '주소의 글 id에 쓸 수 없는 문자가 있습니다.',
        '글 id는 영문·숫자·하이픈(-)·밑줄(_)·점(.)만 쓸 수 있습니다. 예: post.html?id=2026-09-13-css-grid');
      return;
    }
    var meta = store.findMeta(id);
    var where = meta ? store.postPath(id, meta.category) : 'posts/<분류>/' + id + '.md';
    showError('그런 글은 없습니다',
      '"' + id + '" 에 해당하는 글을 찾지 못했습니다.',
      where + ' 파일이 있는지 확인해 주세요. 주소가 바뀌었거나 아직 올리지 않았을 수 있습니다.');
  }

  /* 사이트명의 진실은 index.json이다. 이 로직이 없으면 이름을 바꿨을 때 상세 페이지만 옛 이름으로 남는다.
     document.title은 건드리지 않는다 — 이 페이지의 제목은 사이트명이 아니라 글 제목이다. */
  function fillSite(site) {
    if (!site) return;
    U.qsa('[data-site-title]').forEach(function (node) { node.textContent = site.title; });
  }

  /* ---------- 머리말 ---------- */

  /* 분류 라벨은 같은 분류의 목록으로 가는 문이다. 표시는 이름(CSS), 링크는 폴더명(css).
     .md에 한글 분류가 적혀 있어도 store가 등록된 slug로 되돌려 준다. */
  function fillCategory(value) {
    if (!dom.cat) return;
    if (!value) { U.setHidden(dom.cat, true); return; }
    var name = store.categoryName(value);
    U.setHidden(dom.cat, false);
    dom.cat.textContent = name;
    dom.cat.setAttribute('href', 'index.html?cat=' + encodeURIComponent(store.categorySlug(value)));
    dom.cat.setAttribute('aria-label', name + ' 분류의 글 모두 보기');
  }

  /* 날짜 줄 — 제목 바로 아래 한 줄에 병기한다(계약서 §5-2, 요구사항 #3).
     "게시 2026.09.13 · 수정 2026.09.15". 구분자 ·는 CSS가 그린다.

     created가 비어 있을 수 있다 — .md에 `created:` 만 값 없이 남기면 병합 규칙($present)이
     "파일이 그 키에 답했다"로 보고 index.json의 날짜를 덮는다. 그 규칙 자체는 옳다(.md가 진실).
     store가 updated → id 앞머리 순으로 되살리므로 여기까지 빈 값이 오는 경우는 드물지만,
     그때 그대로 그리면 두 가지가 동시에 깨진다.
       ① <time datetime="">  — 무효 마크업이고 스크린리더가 빈 시각을 읽는다
       ② "게시 " 만 남은 꼬리표 — 값 없는 라벨은 정보가 아니라 잡음이다
     기준이 되는 게시일이 없으면 "수정"도 무엇 대비 수정인지 말해 주지 못하므로 줄을 통째로 감춘다. */
  function fillDates(meta) {
    if (!meta.created) {
      U.setHidden(dom.dates, true);
      return;
    }

    U.setHidden(dom.dates, false);
    dom.date.setAttribute('datetime', meta.created);
    dom.date.textContent = '게시 ' + U.fmtDot(meta.created);

    /* 화면에 찍히는 것은 "날짜"까지다. 같은 날 안에서 시각만 다른 수정은
       "2026.09.13 · 수정 2026.09.13"이라는 같은 값 두 번이 되므로 숨긴다(계약서 §5-2). */
    var sameDay = !meta.updated || U.fmtDot(meta.created) === U.fmtDot(meta.updated);
    if (sameDay) {
      U.setHidden(dom.updated, true);
      return;
    }
    U.setHidden(dom.updated, false);
    dom.updated.setAttribute('datetime', meta.updated);
    dom.updated.textContent = '수정 ' + U.fmtDot(meta.updated);
  }

  function fillTags(tags) {
    if (!dom.tags) return;
    if (!tags.length) { U.setHidden(dom.tags, true); return; }
    U.setHidden(dom.tags, false);
    var frag = document.createDocumentFragment();
    tags.forEach(function (tag) {
      frag.appendChild(U.el('li', { class: 'tag' }, [
        /* 쉼표가 든 태그는 ?tags=a,b 왕복이 깨진다. 인코딩으로 막을 수 있는 범위까지만 감싼다.
           주소에는 비교 키(소문자)를 싣는다 — 목록의 인덱스가 같은 키로 판정한다(app.js readUrl). 화면 글자는 원문. */
        U.el('a', { href: 'index.html?tags=' + encodeURIComponent(U.normTag(tag)), text: tag })
      ]));
    });
    U.clear(dom.tags);
    dom.tags.appendChild(frag);
  }

  function fillHead(meta) {
    document.title = meta.title;
    dom.title.textContent = meta.title;

    if (meta.summary) dom.summary.textContent = meta.summary;
    else U.setHidden(dom.summary, true);

    fillDates(meta);
    fillCategory(meta.category);
    fillTags(meta.tags);

    if (dom.editLink) {
      dom.editLink.setAttribute('href', 'write.html?id=' + encodeURIComponent(meta.id));
    }
  }

  /* ---------- 목차 (계약서 §5-4) ----------
     본문 위 인라인 박스다. 여기에는 "지금 여기" 표시가 없다 — 스크롤과 함께 화면 밖으로 나가는 박스에
     현재 절을 표시할 이유가 없다. 현재 절 표시는 사이드바의 .side-toc가 맡는다(아래 mountSideToc).
     표시 조건은 h2 3개 이상 — 이 블로그의 글은 대부분 "메모"라 h2가 0~2개다.
     그 글들에 목차가 뜨면 목차는 기능이 아니라 장식이 된다.
     조건을 못 넘겨도 제목의 id는 남는다(markdown.js) — 특정 절 직접 링크는 그 자체로 쓸모가 있다. */
  var TOC_MIN_H2 = 3;

  function buildToc(headings) {
    if (!dom.toc || !dom.tocList) return;
    var h2Count = headings.filter(function (h) { return h.level === 2; }).length;
    if (h2Count < TOC_MIN_H2) { U.setHidden(dom.toc, true); return; }
    md.buildToc(headings, dom.tocList);
    /* #76: 목차는 <details>다. 폰(768 미만)은 첫 화면의 1/3을 먹지 않게 접힌 한 줄로, 넓은 화면은 펼친 채 시작한다.
       리사이즈에는 반응하지 않는다 — 사용자가 여닫은 상태를 뒤집지 않는다. */
    if ('open' in dom.toc) dom.toc.open = window.matchMedia('(min-width: 768px)').matches;
    U.setHidden(dom.toc, false);
  }

  /* ---------- 요약 카드 (계약서 §5-7-2, meeting-05 A-1) ----------
     본문에서 제목이 CFG.recap.heading인 절(h2 + 다음 h2 전까지의 형제 블록)을 .prose 바로 앞의 카드로 "옮긴다".
     복제가 아니라 이동인 이유 — 복제하면 스크린리더가 같은 내용을 두 번 읽고 Ctrl+F가 두 번 찾는다.
     h2 노드를 그대로 옮기므로 markdown.js가 준 id가 남아 목차·사이드바 목차·직접 링크가 그대로 닿는다.
     노드 이동이라 살균과 무관하고 innerHTML을 쓰지 않는다. 미리보기(editor.js)는 옮기지 않는다. */
  function recapBlocks(h2) {
    var blocks = [];
    var node = h2.nextSibling;
    while (node && !(node.nodeType === 1 && node.tagName === 'H2')) {
      blocks.push(node);
      node = node.nextSibling;
    }
    /* 공백 텍스트 노드만 있는 절은 빈 절이다 — 빈 카드는 "고장"으로 읽히므로 만들지 않는다. */
    var hasBlock = blocks.some(function (n) { return n.nodeType === 1; });
    return hasBlock ? blocks : [];
  }

  function findRecapHeading() {
    var want = CFG.recap.heading;
    var h2s = U.qsa('h2', dom.body).filter(function (h) { return h.parentNode === dom.body; });
    for (var i = 0; i < h2s.length; i += 1) {
      if (h2s[i].textContent.trim() === want) return h2s[i];
    }
    return null;
  }

  function mountRecap() {
    if (!dom.body || !CFG.recap || !CFG.recap.heading) return;
    var h2 = findRecapHeading();
    if (!h2) return;
    var blocks = recapBlocks(h2);
    if (!blocks.length) return;

    var aside = U.el('aside', { class: 'post-recap', id: 'postRecap' });
    var body = U.el('div', { class: 'prose' });
    aside.appendChild(h2);
    blocks.forEach(function (n) { body.appendChild(n); });
    aside.appendChild(body);
    /* 살균이 id를 지웠을 때만 폴백 — 보통은 markdown.js의 h-… id가 그대로라 목차 링크가 카드로 온다. */
    if (!h2.id) h2.id = 'recapTitle';
    aside.setAttribute('aria-labelledby', h2.id);
    dom.body.parentNode.insertBefore(aside, dom.body);
  }

  /* ---------- 이전 / 다음 ---------- */

  function renderNav(id) {
    if (!dom.nav) return;
    var around = store.neighbors(id);
    var frag = document.createDocumentFragment();

    function item(meta, kind, label) {
      if (!meta) return;
      frag.appendChild(U.el('a', {
        class: 'post-nav-item is-' + kind,
        href: 'post.html?id=' + encodeURIComponent(meta.id),
        'aria-label': label + ' 글: ' + meta.title
      }, [
        U.el('span', { class: 'post-nav-label', text: label }),
        U.el('span', { class: 'post-nav-title', text: meta.title })
      ]));
    }

    /* 기준은 목록의 기본 정렬(고정 글 먼저 · 그다음 최신순)이다. store.neighbors()가 그 순서를 쓴다.
       "이전"은 그 줄에서 뒤쪽(대체로 더 오래된 글), "다음"은 앞쪽. 방향이 뒤집히지 않게 주의. */
    item(around.prev, 'prev', '이전');
    item(around.next, 'next', '다음');

    U.clear(dom.nav);
    dom.nav.appendChild(frag);
    U.setHidden(dom.nav, !dom.nav.children.length);
  }

  /* ---------- 연관 글 (계약서 §5-8) ----------
     점수: 겹치는 태그 1개당 +2, 같은 분류 +1. 태그가 분류보다 잘아서 두 배다 — 분류 "JavaScript"에
     100편이 있어도 태그 closure는 서너 편이다. 그리고 태그 1개 + 같은 분류(3)가 태그 1개 + 다른 분류(2)를
     이겨 분류가 동점 처리기로 작동한다. 동점은 created 내림차순(목록의 기본 순서). 0점은 제외 —
     채우려고 아무 글이나 넣지 않는다. pinned·updated·summary는 점수에 들어가지 않는다. */
  var RELATED_MAX = 3;

  function normTag(tag) { return String(tag).trim().toLowerCase(); }

  /* 반환 순서가 곧 "가장 가까운 글부터". shared는 그 글의 tags 순서 그대로다(카드는 그 글의 것). */
  function relatedTo(meta, posts) {
    var mySlug = store.categorySlug(meta.category);
    var myTags = meta.tags.map(normTag);
    return posts
      .filter(function (p) { return p.id !== meta.id; })
      .map(function (p) {
        var shared = p.tags.filter(function (t) { return myTags.indexOf(normTag(t)) !== -1; });
        var score = shared.length * 2 + (store.categorySlug(p.category) === mySlug ? 1 : 0);
        return { post: p, shared: shared, score: score };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) {
        return b.score - a.score || String(b.post.created).localeCompare(String(a.post.created));
      })
      .slice(0, RELATED_MAX);
  }

  /* 후보는 index.json 전부. loadPost가 loadIndex를 먼저 기다리므로 이 시점엔 동기로 읽힌다 —
     index.json이 실패했으면 null이고, 그때는 그리지 않는다(본문은 그대로).
     카드의 태그 줄에는 겹치는 태그만 넣는다 — 전체 태그를 다 적으면 "왜 이 글이 연관인지"가 안 보인다.
     분류만 같아서 뽑힌 글은 태그 줄이 없고 .entry-cat이 그 이유를 말한다. */
  function renderRelated(meta) {
    if (!dom.related || !dom.relatedList) return;
    var data = store.getIndexSync();
    var picks = data ? relatedTo(meta, data.posts) : [];
    if (!picks.length) { U.setHidden(dom.related, true); return; }

    var frag = document.createDocumentFragment();
    picks.forEach(function (r) {
      frag.appendChild(U.entryCard(r.post, { tags: r.shared, tagsLabel: '겹치는 태그', pinned: false }));
    });
    U.clear(dom.relatedList);
    dom.relatedList.appendChild(frag);
    U.setHidden(dom.related, false);
  }

  /* ---------- 사이드바 목차 + 현재 절 (계약서 §5-4, v3.3) ----------
     인라인 목차(.toc)는 스크롤과 함께 화면 밖으로 나가므로 "지금 여기"를 거기 표시해도 아무도 못 본다.
     화면에 붙어 있는 것은 사이드바뿐이다 — 현재 글(.side-post[aria-current="page"]) 바로 아래에
     절 목록(ol.side-toc)을 끼우고, 현재 절 항목에 aria-current="location"을 옮긴다.
     표시 조건은 인라인 목차와 같다(h2 3개 이상) — 조건이 둘이면 "왜 여기엔 있고 저기엔 없지"가 된다.
     ui.js renderSide()는 이 목록을 모른다. 다시 부르면 사라지므로 이 페이지에서는 한 번만 부른다. */

  /* 트리는 index.json을 기다려 그려지고 본문은 .md를 기다려 그려진다. 둘 중 나중 것이 끼워야 하므로
     트리 쪽 약속을 들고 있다가 본문 렌더 끝에 이어 붙인다(start()가 채운다. 실패해도 resolve한다). */
  var sideReady = Promise.resolve();

  function mountSideToc(headings) {
    var h2Count = headings.filter(function (h) { return h.level === 2; }).length;
    if (h2Count < TOC_MIN_H2) return;

    /* 현재 글 항목이 없다 = 이 글이 index.json에 없다. 끼울 자리가 없으니 아무것도 안 한다. */
    var current = U.qs('.side-tree .side-post[aria-current="page"]');
    if (!current || !current.parentNode) return;

    var items = [];
    var ol = U.el('ol', { class: 'side-toc', id: 'sideToc', 'aria-label': '이 글의 목차' });
    headings.forEach(function (h) {
      /* 등급 클래스(is-h2/is-h3)와 href는 인라인 목차(markdown.buildToc)와 같은 규칙이다. */
      var a = U.el('a', {
        class: 'side-toc-item is-h' + h.level,
        href: '#' + encodeURIComponent(h.id),
        text: h.text
      });
      items.push(a);
      ol.appendChild(U.el('li', null, [a]));
    });
    current.parentNode.insertBefore(ol, current.nextSibling);

    initSpy(headings, items);
  }

  /* 현재 절 = 화면 위쪽 40% 선을 넘은 마지막 제목. 아무 제목도 안 넘었으면(글 머리) 없음(-1).
     IntersectionObserver는 "어느 제목이 그 띠를 건넜다"는 트리거로만 쓰고 판정은 매번 다시 계산한다 —
     IO의 entry만 보면 위로 스크롤해 되돌아올 때 어느 것이 현재인지 알 수 없다.
     제목 수 ≤ 50이라 getBoundingClientRect() 전수 조회가 싸다. */
  var SPY_LINE = 0.4;

  /* 문서가 스크롤 끝에 닿았는가. 마지막 절이 화면 60%보다 짧으면 그 제목은 영영 40% 선을 못 넘는다(M4-7) —
     끝까지 내려왔으면 읽고 있는 것은 마지막 절이다. 스크롤이 아예 안 생기는 짧은 글은 제외한다(항상 끝이므로). */
  function atScrollEnd() {
    var doc = document.documentElement;
    if (doc.scrollHeight <= window.innerHeight) return false;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
  }

  function pickCurrent(headings) {
    if (atScrollEnd()) return headings.length - 1;
    var limit = window.innerHeight * SPY_LINE;
    var found = -1;
    for (var i = 0; i < headings.length; i += 1) {
      if (headings[i].el.getBoundingClientRect().top <= limit) found = i;
    }
    return found;
  }

  /* 활성 항목이 .side-tree의 보이는 영역 밖이면 scrollTop을 직접 맞춘다.
     scrollIntoView()는 쓰지 않는다 — 조상 스크롤 컨테이너를 전부 건드려 본문까지 튄다.
     사이드바가 닫혀 있어도(visibility hidden) 레이아웃은 있으므로 rect 차이는 그대로 맞다. */
  function keepInTree(tree, item) {
    if (!tree) return;
    var box = tree.getBoundingClientRect();
    var rect = item.getBoundingClientRect();
    var pad = 16;
    if (rect.top < box.top + pad) tree.scrollTop += rect.top - box.top - pad;
    else if (rect.bottom > box.bottom - pad) tree.scrollTop += rect.bottom - box.bottom + pad;
  }

  function initSpy(headings, items) {
    /* 없는 브라우저면 스파이만 건너뛴다 — 목차는 링크로서 그대로 동작한다. */
    if (!('IntersectionObserver' in window)) return;

    var tree = U.qs('.side-tree');
    var active = -1;

    /* 상태는 aria-current 하나다. 클래스를 따로 붙이지 않는다(계약서 §8 "ARIA 속성이 곧 상태"). */
    function setActive(index) {
      if (index === active) return;
      if (active !== -1) items[active].removeAttribute('aria-current');
      active = index;
      if (index === -1) return;
      items[index].setAttribute('aria-current', 'location');
      keepInTree(tree, items[index]);
    }

    /* 목차 클릭 직후는 클릭한 절을 고정한다(M4-7). 대상 절이 짧으면 앵커 스크롤이 멈춘 자리에서 40% 선을
       *다음* 제목이 넘어 있어 IO 판정이 클릭한 항목을 바로 빼앗는다 — 사용자는 "내가 누른 게 왜 꺼지지"를 본다.
       고정은 사용자가 직접 움직일 때(휠·터치·키보드·포인터) 풀린다. 스크롤 이벤트는 듣지 않는다 —
       smooth 앵커 이동 자체가 스크롤이라 그걸로 풀면 고정이 되지 않고, 이 파일에 스크롤 핸들러를 두지 않는다는
       규칙(계약서 §5-4)도 지킨다. */
    var pinned = false;
    var unpinOffs = [];
    var NAV_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];

    function unpin() {
      pinned = false;
      unpinOffs.forEach(function (off) { off(); });
      unpinOffs = [];
      setActive(pickCurrent(headings));
    }

    /* 사이드바 안에서의 휠·터치·클릭은 본문을 움직이지 않는다 — 목차를 더 보려고 트리를 굴리는 동안 고정이 풀리면 안 된다. */
    function onUserMove(e) {
      if (e.target && e.target.closest && e.target.closest('.side')) return;
      if (e.type === 'keydown' && NAV_KEYS.indexOf(e.key) === -1) return;
      unpin();
    }

    function pin(index) {
      setActive(index);
      if (pinned) return;
      pinned = true;
      var opts = { passive: true };
      unpinOffs = ['wheel', 'touchmove', 'pointerdown', 'keydown'].map(function (type) {
        return U.on(window, type, onUserMove, opts);
      });
    }

    var io = new IntersectionObserver(function () {
      if (!pinned) setActive(pickCurrent(headings));
    }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });
    headings.forEach(function (h) { io.observe(h.el); });

    /* 목차 클릭·직접 링크는 해시의 id로 즉시 옮기고 고정한다. 깨진 퍼센트 인코딩은 jumpToHash와 같은 이유로 포기한다. */
    function applyHash() {
      var id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (err) { return; }
      for (var i = 0; i < headings.length; i += 1) {
        if (headings[i].id === id) { pin(i); return; }
      }
    }
    U.on(window, 'hashchange', applyHash);
    /* 직접 링크(post.html?id=…#h-…)로 들어오면 hashchange가 없다 — 로드 시 한 번 같은 판정을 한다. */
    applyHash();
  }

  /* ---------- index.json 어긋남 안내 ---------- */

  /* 이 화면의 값은 .md가 만든다(파일이 진실). 목록 화면은 index.json만 읽는다.
     둘이 어긋나면 목록에는 옛 제목이, 상세에는 새 제목이 보이는데 원인이 화면에 드러나지 않는다.
     방문자는 고칠 수 없는 일이므로 관리자에게만 "index.json이 어긋났다"고 알린다(에디터에서 다시 저장하면 서버가 맞춘다).

     indexData를 .md 값으로 덮지는 않는다 — 이 블로그는 페이지 이동이 전부 전체 새로고침이라
     되먹여 봐야 같은 세션에서 이득을 보는 화면이 없고(목록은 다음 로드에서 index.json을 새로 읽는다),
     그 상태를 에디터가 저장 원본으로 쓰면 사용자가 손대지 않은 값까지 파일에 섞여 나간다.
     color는 계약서 §9-2에서 폐기돼 비교 대상이 아니다. */
  var DRIFT_FIELDS = ['title', 'summary'];

  function sameDate(a, b) {
    if (!a || !b) return !a && !b;      // 한쪽만 비어 있으면 다른 값이다(빈 created도 알릴 가치가 있다)
    return U.sameMoment(a, b);
  }

  function driftKeys(indexMeta, meta) {
    var keys = DRIFT_FIELDS.filter(function (key) {
      return String(indexMeta[key]) !== String(meta[key]);
    });
    /* 분류는 폴더명(css)과 표시 이름(CSS)이 같은 값을 가리킨다. slug로 맞춰 본다. */
    if (store.categorySlug(indexMeta.category) !== store.categorySlug(meta.category)) keys.push('category');
    if (indexMeta.tags.join(',') !== meta.tags.join(',')) keys.push('tags');
    if (Boolean(indexMeta.pinned) !== Boolean(meta.pinned)) keys.push('pinned');
    if (!sameDate(indexMeta.created, meta.created)) keys.push('created');
    if (!sameDate(indexMeta.updated, meta.updated)) keys.push('updated');
    return keys;
  }

  function noticeIndexDrift(meta) {
    if (!Blog.admin.isAdmin()) return;
    var indexMeta = store.findMeta(meta.id);
    if (!indexMeta) return;
    var keys = driftKeys(indexMeta, meta);
    if (!keys.length) return;
    U.toast('이 글의 ' + keys.join(', ') + ' 값이 index.json과 다릅니다 — 목록에는 옛 값이 보입니다', 'warn');
  }

  /* ---------- 사이드바 (사양 B) ----------
     트리는 ui.js가 그린다. 여기서는 글 전체·정렬된 분류(U.sortCats — 목록 인덱스와 같은 순서)·현재 글 id를 넘긴다.
     activeCat은 없다 — 상세 화면은 어느 분류의 "필터"가 걸린 상태가 아니다. 현재 글에만 aria-current가 붙는다. */
  function renderSide(posts, activeId) {
    /* ui.js가 아직 renderSide를 내놓지 않은 빌드(또는 구버전 캐시)에서도 본문은 살아 있어야 한다. */
    if (typeof Blog.ui.renderSide !== 'function') return;
    Blog.ui.renderSide({
      posts: posts,
      cats: U.sortCats(store.categoryList(posts)),
      activeId: activeId || null,
      activeCat: null
    });
  }

  /* ---------- 부트스트랩 ---------- */

  /* 비동기 렌더라 로드 시점의 #해시가 이미 지나가 있다. 직접 한 번 이동시켜 준다.
     해시는 주소에서 온 값이지만 getElementById의 인자로만 쓰인다(DOM에 넣지 않는다).
     "#%E0%A4"처럼 깨진 퍼센트 인코딩은 decodeURIComponent가 던진다 — 렌더 마지막 단계라
     본문은 이미 그려져 있지만, 던지게 두면 콘솔에 오류가 남으니 그냥 이동을 포기한다. */
  function jumpToHash() {
    if (window.location.hash.length <= 1) return;
    var id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (err) { return; }
    var target = document.getElementById(id);
    if (target) window.setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 60);
  }

  function render(post) {
    var meta = post.meta;

    if (!post.frontmatterOk) {
      U.toast('frontmatter를 읽지 못해 목록 정보로 표시합니다', 'warn');
    }

    fillHead(meta);

    var result;
    try {
      result = md.renderInto(dom.body, post.body);
    } catch (err) {
      showError('본문을 그리지 못했습니다', err.message, '새로고침하거나 인터넷 연결을 확인해 주세요.');
      return;
    }

    buildToc(result.headings);
    mountRecap();
    renderRelated(meta);
    renderNav(meta.id);
    noticeIndexDrift(meta);

    dom.post.classList.remove('is-loading');
    Blog.admin.apply(dom.post);

    jumpToHash();

    /* 사이드바 트리가 먼저 그려졌으면 즉시, 아니면 트리가 끝난 뒤에 끼운다(둘 중 나중 것). */
    sideReady.then(function () { mountSideToc(result.headings); });
  }

  function start() {
    dom.post = document.getElementById('post');
    dom.error = document.getElementById('postError');
    dom.cat = document.getElementById('postCat');
    dom.title = document.getElementById('postTitle');
    dom.summary = document.getElementById('postSummary');
    dom.dates = U.qs('.post-dates');
    dom.date = document.getElementById('postDate');
    dom.updated = document.getElementById('postUpdated');
    dom.tags = document.getElementById('postTags');
    dom.toc = document.getElementById('toc');
    dom.tocList = U.qs('.toc-list', dom.toc);
    dom.body = document.getElementById('postBody');
    dom.nav = document.getElementById('postNav');
    dom.related = document.getElementById('postRelated');
    dom.relatedList = document.getElementById('postRelatedList');
    dom.editLink = document.getElementById('postEdit');

    Blog.ui.initShell();
    Blog.admin.init();

    var id = U.getQuery().id;

    /* 사이트명은 본문보다 먼저 자리를 잡아야 한다. 사이드바도 같은 데이터로 그린다 —
       본문(loadPost)과 별개로 굴려서 글이 없거나 본문이 실패해도 분류 트리는 살아 있게 한다
       (그래야 "그런 글은 없습니다" 화면에서 다른 글로 갈 길이 남는다). ?id가 없는 오류 화면도 같다(M4-9) —
       그래서 id 검사보다 먼저 시작한다. id가 없으면 activeId가 null이라 현재 글 표시 없이 트리만 그려진다.
       분류(categories.json)를 같이 기다리는 이유 — 없으면 categoryList()가 글에서 유추한 이름·순서로 트리를 그린다.
       loadPost도 같은 두 약속을 쓰므로 요청은 늘지 않고, loadCategories()는 실패해도 reject하지 않는다.
       이 약속을 sideReady로 들고 있는 이유 — 사이드바 목차(mountSideToc)는 트리 안의 현재 글 항목 아래에
       끼우므로 트리가 그려진 뒤여야 한다. 실패 경로도 resolve라 본문 렌더가 이걸 기다리다 막히지 않는다. */
    sideReady = Promise.all([store.loadIndex(), store.loadCategories()])
      .then(function (results) {
        var data = results[0];
        fillSite(data.site);
        renderSide(data.posts, id);
      })
      .catch(function () {
        /* 사이트명을 못 채워도 본문 표시는 계속한다. 사이드바에는 빈 데이터를 넘겨 .side-empty 한 줄이 뜨게 한다. */
        renderSide([], id);
      });

    if (!id) {
      showError('어떤 글을 열까요?',
        '주소에 글 id가 없습니다.',
        '예: post.html?id=2026-09-13-css-grid');
      return;
    }

    /* loadPost는 "없는 글"을 null로 돌려주고, 읽을 수 없는 상황(file://·네트워크)만 reject한다. */
    store.loadPost(id).then(function (post) {
      if (!post) { showNotFound(id); return; }
      render(post);
    }).catch(function (err) {
      if (err && err.code === 'file') {
        showError('로컬 서버로 열어 주세요', err.message, 'start.bat 을 실행하면 됩니다.');
      } else {
        showError('글을 불러오지 못했습니다',
          (err && err.message) || '알 수 없는 오류가 발생했습니다.',
          '잠시 후 다시 시도해 주세요.');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
