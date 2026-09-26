/* theme-init.js — 첫 페인트 전에 테마를 확정한다(FOUC 방지).

   세 HTML(index / post / write)이 <head>에서 defer 없이 동기로 싣는다(about.html은 v3.9에서 삭제).
   CSP(script-src 'self')가 인라인 <script>를 차단하기 때문에 파일로 뺐다 — 내용은
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
    /* 시크릿 모드 등에서 localStorage를 쓸 수 없어도 기본 테마로 계속 그린다. */
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
    /* 저장소를 쓸 수 없거나 JSON이 깨졌으면 고정 아님(기본값)으로 그린다. */
  }
})();

/* 첫 방문 연출(계약서 §3-5 — index.html의 페이지 올라오기 + 제목 타자)을 이 세션에서 이미 봤으면
   첫 페인트 전에 data-intro="done"을 붙인다. CSS는 이 속성이 없을 때만 연출을 건다(layout.css §10).

   이 속성이 두 개발자 사이의 유일한 접점이다(§3-5 "조건"). 붙이는 곳은 여기 하나이고,
   첫 페인트 뒤에는 누구도 붙이거나 떼지 않는다 — 페이지가 사는 동안 값이 하나라 CSS 선택자와 JS 판정이 어긋나지 않는다.
   로드 중에 붙이면 이미 시작한 올라오기가 그 프레임에 끊긴다(선택자가 빠진다). 그래서 DOMContentLoaded 뒤로 미루지 않는다.
   "봤다"를 sessionStorage에 쓰는 곳은 ui.js initIntro()다 — 첫 방문 연출의 페이지(index.html)에서, 이 속성이 없는 로드에만.
   그 로드는 속성 없이 연출을 하고, 다음 로드부터 여기가 붙인다. post.html · write.html에서도 붙지만 거기엔 연출이 없어 아무 일도 없다.

   'blogIntro' 문자열은 config.js의 storageKeys.intro와 반드시 같아야 한다(위 두 키와 같은 이유). */
(function () {
  try {
    if (sessionStorage.getItem('blogIntro')) document.documentElement.setAttribute('data-intro', 'done');
  } catch (err) {
    /* 저장소를 쓸 수 없으면 첫 방문으로 본다 — 매 로드에 연출이 나오지만 깨지지는 않는다. */
  }
})();
