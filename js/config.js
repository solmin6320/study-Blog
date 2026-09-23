/* config.js — 사이트 설정, CDN 버전 상수, 저장소 키, 관리자 판정 규칙.
   모든 JS 파일은 IIFE로 감싸고 window.Blog 하나만 오염시킨다. */
(function (window) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});

  Blog.config = {
    /* index.json의 site 값이 있으면 로드 시 이 값을 덮어쓴다(파일이 진실).
       subtitle은 화면에 그리지 않는다(v3.4, 계약서 §4-2 — .page-sub 폐기). 데이터로만 남는다. */
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

    debounce: { search: 180, preview: 120, draft: 800 },

    /* 계약서 §3-2 "저장 키 표"가 이 객체 전체의 목록이다 — 표에 없는 키를 여기 만들지 않는다.
       admin 키는 v4.3에서 지웠다. 관리자 판정은 hostname 하나라(admin.js) 읽는 곳이 없었고,
       남겨 두면 "localStorage로 켜는 스위치가 있다"로 읽힌다. */
    storageKeys: {
      /* theme 키는 FOUC 방지용으로 js/theme-init.js에도 문자열이 박혀 있다
         (그 파일은 config.js보다 먼저 실행되므로 여기를 참조할 수 없다).
         여기를 바꾸면 theme-init.js도 같이 바꿔야 한다. */
      theme: 'blogTheme',
      /* 접두다. 실제 키는 Blog.store.draft.key(id) = 'blogDraft:' + (id || 'new') — 조립은 store.js 한 곳에서. */
      draft: 'blogDraft',
      /* 사이드바 상태 {"pinned":bool,"closed":[slug…]}. theme처럼 theme-init.js에도 문자열이 박혀 있다 —
         고정 도킹은 첫 페인트 전에 알아야 레이아웃이 튀지 않기 때문이다. 바꾸면 그 파일도 같이 바꾼다. */
      side: 'blogSide',
      /* 인트로 전등을 이 세션에서 이미 봤다는 표시(sessionStorage, 계약서 §3-5).
         theme-init.js에도 같은 문자열이 박혀 있다 — 첫 페인트 전에 막을 아예 안 그리려면 거기서 알아야 한다. */
      intro: 'blogIntro',
      /* 마지막으로 본 목록 {"search":"?cat=java&q=…","y":1234} (sessionStorage, 계약서 §4-6 ①).
         app.js가 쓰고 post.js가 읽는다 — 상세의 "목록"이 필터 풀린 전체 목록 맨 위로 떨어지지 않게. */
      list: 'blogList',
      /* "목록" 링크로 돌아간다는 한 번짜리 표식(값 = 방금 읽은 글 id, §4-6 ③). post.js가 쓰고 app.js가 읽자마자 지운다.
         계약서는 키 이름만 정했다 — 두 파일이 문자열을 따로 박지 않도록 여기 둔다. */
      listReturn: 'blogListReturn',
      /* 코드 블록 언어 기억(§3-2 저장 키 표 · §6-2 "코드 블록 언어 기억"). editor.js가 읽고 쓴다.
         값은 v4.2의 editor.js 상수와 같다 — 이미 기억된 언어가 그대로 읽힌다. */
      codeLang: 'blogCodeLang'
    },

    /* CDN 고정 버전. HTML의 <script src>와 반드시 일치시킨다(표시·점검용).
       jQuery는 승인 목록에는 있지만 어느 페이지도 싣지 않는다 — 버전을 적어 두면 쓰는 것처럼 읽혀 빠졌다(m2). */
    cdn: {
      marked: '12.0.2',
      highlight: '11.9.0',
      dompurify: '3.1.6'
    },

    /* 관리자 판정 규칙 — 보안이 아니라 UI 노출 스위치다(admin.js 주석 참고). */
    admin: {
      localHosts: ['localhost', '127.0.0.1', '[::1]', '']
    },

    /* 기본 분류는 비워 둔다. 분류는 사용자가 직접 만드는 것이라
       우리가 고른 slug를 기본값으로 박아 두면 그 분류가 "원래부터 있던 것"처럼 보인다.
       비어 있으면 editor.js가 categories.json의 첫 항목 → _uncategorized 순으로 내려간다.
       값을 채울 때는 반드시 categories.json에 실재하는 slug(= 폴더명)여야 한다. */
    editor: {
      defaultCategory: ''
    },

    /* 요약 카드(계약서 §5-7-2, meeting-05 A-1·A-11 접점). 약속은 h2 제목 문자열 하나다 —
       post.js는 heading과 같은 절을 카드로 옮기고, editor.js는 template을 "템플릿" 버튼으로 넣는다.
       두 파일이 같은 문자열을 여기서 읽어야 제목이 어긋나 카드가 안 뜨는 일이 없다.
       aliases는 heading 말고도 카드로 받아 주는 제목이다(M10, meeting-07). 실제 글은 "핵심 정리"로 요약 절을 쓴다 —
       템플릿 문구 하나만 받으면 기능이 한 번도 켜지지 않는다. 비교 때 끝의 콜론(: ：)은 떼고 본다(post.js recapTitles).
       template은 heading만 쓴다 — 새 글의 약속은 하나로 유지하고, 별칭은 이미 쓴 글을 받아 주는 쪽이다. */
    recap: {
      heading: '다시 볼 때 이것만',
      aliases: ['핵심 정리'],
      template: '## 핵심\n\n\n## 다시 볼 때 이것만\n- \n\n## 헷갈린 것\n- \n'
    }
  };
})(window);
