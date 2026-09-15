/* admin.js — 관리자 모드 판정과 [data-admin-only] 처리.

   ⚠ 이건 보안이 아니라 UI 노출 스위치다.
   정적 사이트라 모든 파일은 누구나 받을 수 있고, localStorage 값은 누구나 바꿀 수 있다.
   여기서 하는 일은 "내 브라우저에서 편집 버튼을 보여 줄지" 뿐이고,
   비밀번호를 걸어 무언가를 지키는 척하지 않는다. 진짜 권한은 git push 권한뿐이다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;
  var U = Blog.util;

  var KEY = CFG.storageKeys.admin;
  var QUERY_KEY = CFG.admin.queryKey;

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (err) { return null; }
  }

  function write(value) {
    try {
      if (value === null) window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, value);
    } catch (err) { /* 저장이 막혀도 이번 세션 판정에는 영향이 없다 */ }
  }

  function isLocalHost() {
    return CFG.admin.localHosts.indexOf(window.location.hostname) !== -1;
  }

  /* ?admin=1 → 켜고 저장, ?admin=0 → 끄고 저장.
     주소창에 남기면 공유 링크에 딸려 가므로 처리 후 쿼리에서 지운다.

     알아볼 수 없는 값(?admin= / ?admin=yes 등)은 "끄기"로 해석하지 않는다.
     예전에는 전부 '0'으로 저장돼서, 주소를 한 번 잘못 치면 localhost에서도
     수정 버튼이 영구히 사라지고 되돌리려면 ?admin=1을 알아야 했다. */
  var ON = ['1', 'true', 'on', 'yes'];
  var OFF = ['0', 'false', 'off', 'no'];

  function consumeQuery() {
    var q = U.getQuery();
    var flag = q[QUERY_KEY];
    if (flag === undefined) return;

    var value = String(flag).trim().toLowerCase();
    if (ON.indexOf(value) !== -1) write('1');
    else if (OFF.indexOf(value) !== -1) write('0');
    /* 그 밖의 값은 저장하지 않는다 — 판정은 기존 설정 그대로 간다. */

    var patch = {};
    patch[QUERY_KEY] = null;
    U.setQuery(patch, false);
  }

  /* localStorage에 '0'을 명시적으로 넣었으면 localhost에서도 방문자 화면으로 본다.
     (로컬에서 실제 방문자에게 어떻게 보이는지 확인할 수 있어야 한다.) */
  function isAdmin() {
    var stored = read();
    if (stored === '0') return false;
    if (stored === '1') return true;
    return isLocalHost();
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
    consumeQuery();
    return apply(document);
  }

  Blog.admin = {
    init: init,
    apply: apply,
    isAdmin: isAdmin,
    enable: function () { write('1'); return apply(document); },
    disable: function () { write('0'); return apply(document); }
  };
})(window, document);
