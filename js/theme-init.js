/* theme-init.js — 첫 페인트 전에 테마를 확정한다(FOUC 방지).

   세 HTML(index / post / write)이 <head>에서 defer 없이 동기로 싣는다.
   CSP(script-src 'self')가 인라인 <script>를 막기 때문에 파일로 뺐다 — 내용은
   예전 인라인 스크립트와 같다. defer를 붙이면 첫 페인트 뒤에 돌아 목적을 잃는다.

   'blogTheme' 문자열은 config.js의 storageKeys.theme과 반드시 같아야 한다
   (config.js보다 먼저 실행되므로 Blog.config를 참조할 수 없다). */
(function () {
  try {
    var saved = localStorage.getItem('blogTheme');
    var dark = saved
      ? saved === 'dark'
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (err) {
    /* 시크릿 모드 등에서 localStorage가 막혀도 기본 테마로 계속 그린다. */
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
