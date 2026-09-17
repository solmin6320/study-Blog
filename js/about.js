/* about.js — about.html 전용(계약서 §3-4). 본문은 정적 HTML이라 여기서 그리지 않는다.
   할 일은 셸 초기화 + 사이드바 데이터 공급 + 사이트명 채우기뿐이다. 마크다운·CDN은 이 페이지에 없다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
  var U = Blog.util;
  var store = Blog.store;

  /* 사이트명의 진실은 index.json이다(post.js fillSite와 같다).
     document.title은 건드리지 않는다 — 이 페이지의 제목은 "소개"다. */
  function fillSite(site) {
    if (!site) return;
    U.qsa('[data-site-title]').forEach(function (node) { node.textContent = site.title; });
  }

  /* 트리는 ui.js가 그린다. 정렬은 U.sortCats — 목록 인덱스·상세와 같은 순서여야 같은 분류가 같은 자리에 보인다.
     이 화면은 글도 분류 필터도 아니므로 activeId·activeCat 둘 다 null이다. */
  function renderSide(posts) {
    /* ui.js가 아직 renderSide를 내놓지 않은 빌드(또는 구버전 캐시)에서도 페이지는 살아 있어야 한다. */
    if (typeof Blog.ui.renderSide !== 'function') return;
    Blog.ui.renderSide({
      posts: posts,
      cats: U.sortCats(store.categoryList(posts)),
      activeId: null,
      activeCat: null
    });
  }

  function start() {
    Blog.ui.initShell();
    Blog.admin.init();

    /* 분류(categories.json)를 같이 기다리는 이유 — 없으면 categoryList()가 글에서 유추한 이름·순서로 트리를 그린다.
       loadCategories()는 실패해도 reject하지 않으므로 index.json 오류만 catch에 온다.
       실패해도 빈 데이터로 renderSide()를 불러 사이드바가 영영 빈 채로 남지 않게 한다(app.js showLoadError와 같다). */
    Promise.all([store.loadIndex(), store.loadCategories()])
      .then(function (results) {
        var data = results[0];
        fillSite(data.site);
        renderSide(data.posts);
      })
      .catch(function () {
        renderSide([]);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
