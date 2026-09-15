/* post.js — post.html 전용. ?id= 로 글을 찾아 렌더하고 TOC·진행바·이전/다음을 붙인다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
  var U = Blog.util;
  var store = Blog.store;
  var md = Blog.markdown;

  var dom = {};
  var headings = [];
  var tocItems = [];
  var activeId = '';

  /* ---------- 오류 화면 ---------- */

  function showError(title, desc, hint) {
    if (dom.post) U.setHidden(dom.post, true);
    if (!dom.error) return;
    U.setHidden(dom.error, false);
    U.clear(dom.error);
    dom.error.appendChild(U.el('p', null, [U.el('strong', { text: title })]));
    dom.error.appendChild(U.el('p', { text: desc }));
    if (hint) dom.error.appendChild(U.el('p', { text: hint }));
    dom.error.appendChild(U.el('a', { class: 'btn btn-primary', href: 'index.html', text: '메모 보드로 돌아가기' }));
    document.title = title;
  }

  /* ---------- 머리말 ---------- */

  /* 카테고리 라벨은 같은 분류의 목록으로 가는 문이다. 표시는 이름(CSS), 링크는 폴더명(css).
     .md에 한글 카테고리가 적혀 있어도 store가 등록된 slug로 되돌려 준다. */
  function fillCategory(value) {
    if (!dom.cat) return;
    if (!value) { U.setHidden(dom.cat, true); return; }
    var slug = store.categorySlug(value);
    dom.cat.textContent = store.categoryName(value);
    dom.cat.setAttribute('href', 'index.html?cat=' + encodeURIComponent(slug));
    dom.cat.setAttribute('aria-label', store.categoryName(value) + ' 분류의 메모 모두 보기');
  }

  function fillHead(meta, minutes) {
    document.title = meta.title;

    fillCategory(meta.category);

    dom.title.textContent = meta.title;

    if (meta.summary) dom.summary.textContent = meta.summary;
    else U.setHidden(dom.summary, true);

    var createdRel = U.fmtRelative(meta.created);
    dom.date.setAttribute('datetime', meta.created);
    dom.date.textContent = '게시 ' + U.fmtKo(meta.created) + (createdRel ? ' (' + createdRel + ')' : '');

    /* created와 같으면 "최종 수정"은 새 정보가 아니다. 숨긴다. */
    if (U.sameMoment(meta.created, meta.updated)) {
      U.setHidden(dom.updated, true);
    } else {
      var updatedRel = U.fmtRelative(meta.updated);
      dom.updated.setAttribute('datetime', meta.updated);
      dom.updated.textContent = '최종 수정 ' + U.fmtKo(meta.updated) + (updatedRel ? ' (' + updatedRel + ')' : '');
    }

    dom.read.textContent = '약 ' + minutes + '분';

    if (meta.tags.length) {
      U.clear(dom.tags);
      meta.tags.forEach(function (tag) {
        dom.tags.appendChild(U.el('li', { class: 'tag' }, [
          U.el('a', { href: 'index.html?tags=' + encodeURIComponent(tag), text: tag })
        ]));
      });
    } else {
      U.setHidden(dom.tags, true);
    }

    if (dom.editLink) {
      dom.editLink.setAttribute('href', 'write.html?id=' + encodeURIComponent(meta.id));
    }
  }

  /* ---------- TOC ---------- */

  function buildToc() {
    if (!dom.toc || !dom.tocList) return;
    if (headings.length < 2) {
      /* 제목이 하나뿐이면 목차가 오히려 방해가 된다. */
      U.setHidden(dom.toc, true);
      return;
    }
    tocItems = md.buildToc(headings, dom.tocList);
    U.setHidden(dom.toc, false);

    U.on(dom.tocList, 'click', function (e) {
      var item = e.target.closest('.toc-item');
      if (!item) return;
      setActive(item.getAttribute('data-target'));
    });
  }

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    tocItems.forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-target') === id);
    });
  }

  /* 화면 상단 기준선(헤더 높이 + 여유)을 넘어간 마지막 제목을 현재 위치로 본다. */
  function syncToc() {
    if (!headings.length) return;
    var line = (dom.header ? dom.header.offsetHeight : 64) + 28;
    var current = headings[0].id;
    headings.forEach(function (h) {
      if (h.el.getBoundingClientRect().top <= line) current = h.id;
    });
    setActive(current);
  }

  /* ---------- 진행바 ---------- */

  function syncProgress() {
    if (!dom.progress || !dom.body) return;
    var rect = dom.body.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var passed = -rect.top;
    var ratio = total > 0 ? U.clamp(passed / total, 0, 1) : (rect.top <= 0 ? 1 : 0);
    dom.progress.style.width = (ratio * 100).toFixed(2) + '%';
    dom.progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  /* ---------- 이전 / 다음 ---------- */

  function renderNav(id) {
    if (!dom.nav) return;
    var around = store.neighbors(id);
    U.clear(dom.nav);

    function item(meta, kind, label) {
      if (!meta) return;
      dom.nav.appendChild(U.el('a', {
        class: 'post-nav-item is-' + kind,
        href: 'post.html?id=' + encodeURIComponent(meta.id),
        'aria-label': label + ' 글: ' + meta.title
      }, [
        U.el('span', { class: 'post-nav-label', text: label }),
        U.el('span', { class: 'post-nav-title', text: meta.title })
      ]));
    }

    /* "이전"은 더 오래된 글, "다음"은 더 최신 글. 목록이 최신순이므로 방향이 뒤집히지 않게 주의. */
    item(around.prev, 'prev', '이전');
    item(around.next, 'next', '다음');

    U.setHidden(dom.nav, !dom.nav.children.length);
  }

  /* ---------- 부트스트랩 ---------- */

  function render(post) {
    var meta = post.meta;

    if (!post.frontmatterOk) {
      U.toast('frontmatter를 읽지 못해 목록 정보로 표시합니다', 'warn');
    }

    var minutes = U.readingMinutes(post.body);
    fillHead(meta, minutes);

    var result;
    try {
      result = md.renderInto(dom.body, post.body);
    } catch (err) {
      showError('본문을 그리지 못했어요', err.message, '새로고침하거나 인터넷 연결을 확인해 주세요.');
      return;
    }

    headings = result.headings;
    buildToc();
    renderNav(meta.id);

    dom.post.classList.remove('is-loading');
    Blog.admin.apply(dom.post);
    Blog.ui.reveal('[data-reveal]');

    var sync = U.rafThrottle(function () { syncProgress(); syncToc(); });
    U.on(window, 'scroll', sync, { passive: true });
    U.on(window, 'resize', sync);
    sync();

    /* 비동기 렌더라 로드 시점의 #해시가 이미 지나가 있다. 직접 한 번 이동시켜 준다. */
    if (window.location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) window.setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 60);
    }
  }

  function start() {
    dom.header = document.getElementById('siteHeader');
    dom.post = document.getElementById('post');
    dom.error = document.getElementById('postError');
    dom.progress = document.getElementById('progressBar');
    dom.cat = document.getElementById('postCat');
    dom.title = document.getElementById('postTitle');
    dom.summary = document.getElementById('postSummary');
    dom.date = document.getElementById('postDate');
    dom.updated = document.getElementById('postUpdated');
    dom.read = document.getElementById('postRead');
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
      showError('어떤 메모를 열까요?',
        '주소에 글 id가 없습니다.',
        '예: post.html?id=2026-09-13-welcome');
      return;
    }

    store.loadPost(id).then(render).catch(function (err) {
      if (err && err.code === 'notfound') {
        /* 글 파일은 카테고리 폴더 안에 있다. 어디를 봐야 하는지 경로로 알려 준다. */
        var meta = store.findMeta(id);
        var where = meta ? store.postPath(id, meta.category) : 'posts/<카테고리>/' + id + '.md';
        showError('그런 메모는 없어요',
          '"' + id + '" 에 해당하는 글을 찾지 못했습니다.',
          where + ' 파일이 있는지 확인해 주세요. 주소가 바뀌었거나 아직 올리지 않았을 수 있어요.');
      } else if (err && err.code === 'file') {
        showError('로컬 서버로 열어 주세요', err.message, 'start.bat 을 실행하면 됩니다.');
      } else {
        showError('메모를 불러오지 못했어요',
          (err && err.message) || '알 수 없는 오류가 발생했습니다.',
          '잠시 후 다시 시도해 주세요.');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
