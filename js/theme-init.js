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

/* 사이드바 고정 상태도 첫 페인트 전에 확정한다(레이아웃 점프 방지).
   고정(pinned) + 데스크톱(≥1024px)이면 본문이 사이드바 폭만큼 오른쪽으로 밀린 채 그려져야 한다.
   이걸 DOMContentLoaded 뒤 ui.js에 맡기면 본문이 한 번 왼쪽에 그려졌다가 튄다.
   그래서 <html>에 data-side="pinned"만 먼저 붙이고(CSS가 도킹 상태로 취급),
   <body> 클래스(side-open / side-pinned)와 버튼 상태 동기화는 ui.js initSide()가 이어받는다.

   'blogSide' 문자열은 config.js의 storageKeys.side와 반드시 같아야 한다
   (테마 키와 같은 이유 — 이 파일은 config.js보다 먼저 실행된다).
   값은 JSON {"pinned":true,"closed":[...]} 이며, 깨져 있으면 고정 아님으로 본다.
   1024px 기준은 ui.js의 DOCK_MQ, layout.css의 도킹 브레이크포인트와 같은 값이어야 한다. */
(function () {
  try {
    var raw = localStorage.getItem('blogSide');
    if (!raw) return;
    var state = JSON.parse(raw);
    var pinned = Boolean(state && state.pinned === true);
    var wide = Boolean(window.matchMedia && window.matchMedia('(min-width: 1024px)').matches);
    if (pinned && wide) document.documentElement.setAttribute('data-side', 'pinned');
  } catch (err) {
    /* 저장소가 막혀 있거나 JSON이 깨졌으면 고정 아님(기본값)으로 그린다. */
  }
})();
