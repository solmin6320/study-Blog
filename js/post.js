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

  /* 글 파일은 카테고리 폴더 안에 있다. 어디를 봐야 하는지 경로로 알려 준다. */
  function showNotFound(id) {
    var meta = store.findMeta(id);
    var where = meta ? store.postPath(id, meta.category) : 'posts/<카테고리>/' + id + '.md';
    showError('그런 메모는 없어요',
      '"' + id + '" 에 해당하는 글을 찾지 못했습니다.',
      where + ' 파일이 있는지 확인해 주세요. 주소가 바뀌었거나 아직 올리지 않았을 수 있어요.');
  }

  /* 사이트명의 진실은 index.json이다. 이 로직이 없으면 이름을 바꿨을 때 상세 페이지만 옛 이름으로 남는다.
     document.title은 건드리지 않는다 — 이 페이지의 제목은 사이트명이 아니라 글 제목이다. */
  function fillSite(site) {
    if (!site) return;
    U.qsa('[data-site-title]').forEach(function (node) { node.textContent = site.title; });
    U.qsa('[data-site-sub]').forEach(function (node) { node.textContent = site.subtitle; });
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

  /* 날짜 줄.

     created가 비어 있을 수 있다 — .md에 `created:` 만 값 없이 남기면 병합 규칙($present)이
     "파일이 그 키에 답했다"로 보고 index.json의 날짜를 덮는다. 그 규칙 자체는 옳다(.md가 진실).
     그래서 막는 자리는 파서가 아니라 여기, 표시단이다. 그대로 그리면 두 가지가 동시에 깨진다.
       ① <time datetime="">  — 무효 마크업이고 스크린리더가 빈 시각을 읽는다
       ② "게시 " 만 남은 꼬리표 — 값 없는 라벨은 정보가 아니라 잡음이다
     기준이 되는 게시일이 없으면 "최종 수정"도 무엇 대비 수정인지 말해 주지 못하므로
     날짜 줄을 통째로 감춘다(읽기 시간은 날짜와 무관하므로 그대로 둔다). */
  function fillDates(meta) {
    if (!meta.created) {
      U.setHidden(dom.date, true);
      U.setHidden(dom.updated, true);
      return;
    }

    var createdRel = U.fmtRelative(meta.created);
    U.setHidden(dom.date, false);
    dom.date.setAttribute('datetime', meta.created);
    dom.date.textContent = '게시 ' + U.fmtKo(meta.created) + (createdRel ? ' (' + createdRel + ')' : '');

    /* created와 같으면 "최종 수정"은 새 정보가 아니다. 숨긴다. */
    if (!meta.updated || U.sameMoment(meta.created, meta.updated)) {
      U.setHidden(dom.updated, true);
      return;
    }
    var updatedRel = U.fmtRelative(meta.updated);
    U.setHidden(dom.updated, false);
    dom.updated.setAttribute('datetime', meta.updated);
    dom.updated.textContent = '최종 수정 ' + U.fmtKo(meta.updated) + (updatedRel ? ' (' + updatedRel + ')' : '');
  }

  function fillHead(meta, minutes) {
    document.title = meta.title;

    fillCategory(meta.category);

    dom.title.textContent = meta.title;

    if (meta.summary) dom.summary.textContent = meta.summary;
    else U.setHidden(dom.summary, true);

    fillDates(meta);

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

    /* 기준은 보드의 기본 정렬(고정 글 먼저 · 그다음 최신순)이다. store.neighbors()가 그 순서를 쓴다.
       "이전"은 그 줄에서 뒤쪽(대체로 더 오래된 글), "다음"은 앞쪽. 방향이 뒤집히지 않게 주의. */
    item(around.prev, 'prev', '이전');
    item(around.next, 'next', '다음');

    U.setHidden(dom.nav, !dom.nav.children.length);
  }

  /* ---------- index.json 어긋남 안내 ---------- */

  /* 이 화면의 값은 .md가 만든다(파일이 진실). 목록 화면은 index.json만 읽는다.
     둘이 어긋나면 보드에는 옛 제목이, 상세에는 새 제목이 보이는데 원인이 화면에 드러나지 않는다.
     방문자는 고칠 수 없는 일이므로 관리자에게만 "index.json을 다시 내보내라"고 알린다.

     indexData를 .md 값으로 덮지는 않는다 — 이 블로그는 페이지 이동이 전부 전체 새로고침이라
     되먹여 봐야 같은 세션에서 이득을 보는 화면이 없고(목록은 다음 로드에서 index.json을 새로 읽는다),
     그 상태를 에디터가 내보내기 원본으로 쓰면 사용자가 손대지 않은 값까지 파일에 섞여 나간다. */
  var DRIFT_FIELDS = ['title', 'summary', 'color'];

  function sameDate(a, b) {
    if (!a || !b) return !a && !b;      // 한쪽만 비어 있으면 다른 값이다(빈 created도 알릴 가치가 있다)
    return U.sameMoment(a, b);
  }

  function driftKeys(indexMeta, meta) {
    var keys = DRIFT_FIELDS.filter(function (key) {
      return String(indexMeta[key]) !== String(meta[key]);
    });
    /* 카테고리는 폴더명(css)과 표시 이름(CSS)이 같은 값을 가리킨다. slug로 맞춰 본다. */
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
    U.toast('이 글의 ' + keys.join(', ') + ' 값이 index.json과 달라요 — 목록에는 옛 값이 보입니다', 'warn');
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
    noticeIndexDrift(meta);

    dom.post.classList.remove('is-loading');
    Blog.admin.apply(dom.post);

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

    /* 사이트명은 본문보다 먼저 자리를 잡아야 한다. loadPost도 같은 약속을 쓰므로 요청은 늘지 않는다. */
    store.loadIndex()
      .then(function (data) { fillSite(data.site); })
      .catch(function () { /* 사이트명을 못 채워도 본문 표시는 계속한다 */ });

    /* loadPost는 "없는 글"을 null로 돌려주고, 읽을 수 없는 상황(file://·네트워크)만 reject한다. */
    store.loadPost(id).then(function (post) {
      if (!post) { showNotFound(id); return; }
      render(post);
    }).catch(function (err) {
      if (err && err.code === 'file') {
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
