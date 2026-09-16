/* admin.js — 관리자 모드 판정과 [data-admin-only] 처리.

   ⚠ 이건 보안이 아니라 UI 노출 스위치다.
   정적 사이트라 모든 파일은 누구나 받을 수 있다. 여기서 하는 일은
   "이 브라우저에서 편집 UI를 보여 줄지"뿐이고, 비밀번호를 걸어 무언가를 지키는 척하지 않는다.
   진짜 권한은 git push 권한뿐이다.

   판정 근거는 hostname 하나다(config.js의 admin.localHosts).
   배포 도메인(GitHub Pages 등)에서는 판정이 항상 false다 —
   ?admin=1 쿼리나 localStorage 스위치처럼 밖에서 켤 수 있는 길은 두지 않는다.
   (사용자 요구: 배포 버전은 보기만 가능해야 한다.) */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;
  var U = Blog.util;

  var LOCAL_HOSTS = (CFG.admin && CFG.admin.localHosts) || [];

  /* localhost / 127.0.0.1 등 로컬 미리보기에서만 true. 그 밖의 어떤 호스트에서도 false. */
  function isAdmin() {
    return LOCAL_HOSTS.indexOf(window.location.hostname) !== -1;
  }

  /* 관리자가 아니면 요소를 감추는 게 아니라 DOM에서 제거한다.
     CSS만으로 숨기면 개발자도구 없이도 보이게 되돌릴 수 있고, 무엇보다
     "숨겼으니 안전하다"는 착각을 만든다. */
  function apply(root) {
    var scope = root || document;
    var admin = isAdmin();
    if (!admin) {
      U.qsa('[data-admin-only]', scope).forEach(function (node) {
        if (node.parentNode) node.parentNode.removeChild(node);
      });
    }
    if (scope === document) {
      document.body.classList.toggle('admin-off', !admin);
    }
    return admin;
  }

  function init() {
    return apply(document);
  }

  /* enable() / disable()은 없앴다 — 호스트 밖에서 판정을 뒤집는 API 자체가 없어야 한다. */
  Blog.admin = {
    init: init,
    apply: apply,
    isAdmin: isAdmin
  };
})(window, document);
