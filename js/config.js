/* config.js — 사이트 설정, CDN 버전 상수, 저장소 키, 관리자 판정 규칙.
   모든 JS 파일은 IIFE로 감싸고 window.Blog 하나만 오염시킨다. */
(function (window) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});

  Blog.config = {
    /* index.json의 site 값이 있으면 로드 시 이 값을 덮어쓴다(파일이 진실). */
    site: {
      title: '메모 블로그',
      subtitle: '공부한 것을 메모지처럼 붙여두는 곳'
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

    /* 카테고리가 categories.json에 없을 때의 착지점.
       밑줄로 시작해 정상 카테고리 폴더와 눈으로 구분된다. */
    category: {
      fallbackSlug: '_uncategorized',
      fallbackName: '미분류',
      fallbackColor: 'lilac'
    },

    /* 계약서 4절의 메모 색상 6종. 에디터 select도 이 배열로 만든다. */
    colors: [
      { value: 'amber', label: '앰버' },
      { value: 'mint', label: '민트' },
      { value: 'sky', label: '스카이' },
      { value: 'rose', label: '로즈' },
      { value: 'lilac', label: '라일락' },
      { value: 'lime', label: '라임' }
    ],

    /* 한글은 분당 500자 기준으로 읽기 시간을 계산한다(영문 단어 기준과 다름). */
    read: { charsPerMinute: 500, minMinutes: 1 },

    /* 이 일수 이내면 "3일 전" 같은 상대 시간을 보조로 붙인다. */
    recentDays: 7,

    /* 메모지 기울기 범위(deg). id 해시로 결정하므로 새로고침해도 그대로다. */
    memoRotation: 0.6,

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

    /* 기본 카테고리는 반드시 categories.json에 존재하는 slug여야 한다.
       표시 이름('기록')이 아니라 폴더명을 쓴다 — 이 값이 곧 저장 경로가 되기 때문. */
    editor: {
      defaultColor: 'amber',
      defaultCategory: 'note'
    }
  };
})(window);
