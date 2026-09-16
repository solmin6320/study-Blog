/* post.js — post.html 전용. ?id= 로 글을 찾아 렌더하고 목차·이전/다음을 붙인다.
   v3.0: 읽기 진행바·읽는 시간·스크롤 스파이는 폐기됐다. 이 파일에 스크롤 핸들러는 없다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
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
    U.qsa('[data-site-sub]').forEach(function (node) { node.textContent = site.subtitle; });
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
        /* 쉼표가 든 태그는 ?tags=a,b 왕복이 깨진다. 인코딩으로 막을 수 있는 범위까지만 감싼다. */
        U.el('a', { href: 'index.html?tags=' + encodeURIComponent(tag), text: tag })
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
     본문 위 인라인 박스다. 사이드바·sticky·스크롤 스파이는 폐기됐다.
     표시 조건은 h2 3개 이상 — 이 블로그의 글은 대부분 "메모"라 h2가 0~2개다.
     그 글들에 목차가 뜨면 목차는 기능이 아니라 장식이 된다.
     조건을 못 넘겨도 제목의 id는 남는다(markdown.js) — 특정 절 직접 링크는 그 자체로 쓸모가 있다. */
  var TOC_MIN_H2 = 3;

  function buildToc(headings) {
    if (!dom.toc || !dom.tocList) return;
    var h2Count = headings.filter(function (h) { return h.level === 2; }).length;
    if (h2Count < TOC_MIN_H2) { U.setHidden(dom.toc, true); return; }
    md.buildToc(headings, dom.tocList);
    U.setHidden(dom.toc, false);
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

  /* ---------- index.json 어긋남 안내 ---------- */

  /* 이 화면의 값은 .md가 만든다(파일이 진실). 목록 화면은 index.json만 읽는다.
     둘이 어긋나면 목록에는 옛 제목이, 상세에는 새 제목이 보이는데 원인이 화면에 드러나지 않는다.
     방문자는 고칠 수 없는 일이므로 관리자에게만 "index.json을 다시 내보내라"고 알린다.

     indexData를 .md 값으로 덮지는 않는다 — 이 블로그는 페이지 이동이 전부 전체 새로고침이라
     되먹여 봐야 같은 세션에서 이득을 보는 화면이 없고(목록은 다음 로드에서 index.json을 새로 읽는다),
     그 상태를 에디터가 내보내기 원본으로 쓰면 사용자가 손대지 않은 값까지 파일에 섞여 나간다.
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
    renderNav(meta.id);
    noticeIndexDrift(meta);

    dom.post.classList.remove('is-loading');
    Blog.admin.apply(dom.post);

    jumpToHash();
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
    dom.editLink = document.getElementById('postEdit');

    Blog.ui.initShell();
    Blog.admin.init();

    var id = U.getQuery().id;
    if (!id) {
      showError('어떤 글을 열까요?',
        '주소에 글 id가 없습니다.',
        '예: post.html?id=2026-09-13-css-grid');
      return;
    }

    /* 사이트명은 본문보다 먼저 자리를 잡아야 한다. 사이드바도 같은 데이터로 그린다 —
       본문(loadPost)과 별개로 굴려서 글이 없거나 본문이 실패해도 분류 트리는 살아 있게 한다
       (그래야 "그런 글은 없습니다" 화면에서 다른 글로 갈 길이 남는다).
       분류(categories.json)를 같이 기다리는 이유 — 없으면 categoryList()가 글에서 유추한 이름·순서로 트리를 그린다.
       loadPost도 같은 두 약속을 쓰므로 요청은 늘지 않고, loadCategories()는 실패해도 reject하지 않는다. */
    Promise.all([store.loadIndex(), store.loadCategories()])
      .then(function (results) {
        var data = results[0];
        fillSite(data.site);
        renderSide(data.posts, id);
      })
      .catch(function () {
        /* 사이트명을 못 채워도 본문 표시는 계속한다. 사이드바에는 빈 데이터를 넘겨 .side-empty 한 줄이 뜨게 한다. */
        renderSide([], id);
      });

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
