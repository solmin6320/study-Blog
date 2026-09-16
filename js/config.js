/* config.js — 사이트 설정, CDN 버전 상수, 저장소 키, 관리자 판정 규칙.
   모든 JS 파일은 IIFE로 감싸고 window.Blog 하나만 오염시킨다. */
(function (window) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});

  Blog.config = {
    /* index.json의 site 값이 있으면 로드 시 이 값을 덮어쓴다(파일이 진실).
       subtitle은 .page-sub 한 줄이다(계약서 §4-2). 두 줄이 되면 문장을 줄인다. */
    site: {
      title: '메모 블로그',
      subtitle: '공부한 것을 기록하는 곳'
    },

    paths: {
      index: 'posts/index.json',
      categories: 'posts/categories.json',
      /* 글 파일은 카테고리 폴더 안에 있다: posts/<slug>/<id>.md
         폴더를 나눠 두면 파일이 늘어나도 사람이 직접 찾아 고칠 수 있다(요구사항 3). */
      post: function (id, slug) {
        return 'posts/' + (slug || Blog.config.category.fallbackSlug) + '/' + id + '.md';
      },
      /* v1의 평면 구조(posts/<id>.md). 사용자가 폴더를 만들지 않고 파일만 떨군 경우의 마지막 폴백. */
      postFlat: function (id) { return 'posts/' + id + '.md'; }
    },

    /* 분류가 categories.json에 없을 때의 착지점.
       밑줄로 시작해 정상 분류 폴더와 눈으로 구분된다. */
    category: {
      fallbackSlug: '_uncategorized',
      fallbackName: '미분류'
    },

    /* 이 일수 이내면 "3일 전" 같은 상대 시간을 만들 수 있다(util.fmtRelative). */
    recentDays: 7,

    debounce: { search: 180, preview: 120, draft: 800 },

    storageKeys: {
      /* theme 키는 FOUC 방지용으로 각 HTML <head> 인라인 스크립트에도 문자열이 박혀 있다.
         여기를 바꾸면 세 HTML의 인라인 스크립트도 같이 바꿔야 한다. */
      theme: 'blogTheme',
      admin: 'blogAdmin',
      draft: 'blogDraft'
    },

    /* CDN 고정 버전. HTML의 <script src>와 반드시 일치시킨다(표시·점검용). */
    cdn: {
      jquery: '3.7.1',
      marked: '12.0.2',
      highlight: '11.9.0',
      dompurify: '3.1.6'
    },

    /* 관리자 판정 규칙 — 보안이 아니라 UI 노출 스위치다(admin.js 주석 참고). */
    admin: {
      queryKey: 'admin',
      localHosts: ['localhost', '127.0.0.1', '[::1]', '']
    },

    /* 기본 분류는 비워 둔다. 분류는 사용자가 직접 만드는 것이라
       우리가 고른 slug를 기본값으로 박아 두면 그 분류가 "원래부터 있던 것"처럼 보인다.
       비어 있으면 editor.js가 categories.json의 첫 항목 → _uncategorized 순으로 내려간다.
       값을 채울 때는 반드시 categories.json에 실재하는 slug(= 폴더명)여야 한다. */
    editor: {
      defaultCategory: ''
    }
  };
})(window);
