/* editor.js — write.html 전용. 마크다운 작성, 실시간 미리보기, 자동 임시저장, ?id= 수정 모드,
   로컬 에디터 서버(docs/api.md)에 PUT /api/posts/{id}로 저장.
   v3.9(meeting-06 #2): 저장은 서버 하나뿐이다 — 다운로드로 파일을 내려받던 길은 완전히 없어졌다.
   서버가 없으면 쓸 수는 있지만 저장할 수 없고, 화면이 그 사실을 말한다(계약서 §6-1).
   이 화면이 "공부한 걸 블로그에 넣는" 유일한 통로다. 실수로 글을 잃는 경로가 없어야 한다.

   글은 posts/<분류slug>/<id>.md 에 들어간다(계약서 §9-3).
   분류 목록은 posts/categories.json 이 진실이지만, 그 파일이 없거나 비어 있어도 에디터는
   끝까지 동작해야 한다 — 이 블로그의 분류는 사용자가 직접 만드는 것이고 시작은 0개다.
   목록이 비면 "미분류 한 줄 + 새 분류 버튼"만으로 글을 끝까지 쓸 수 있어야 한다.

   v3.0: 글·분류의 color 필드는 폐기됐다(계약서 §9-2). 메모지 카드가 사라져 색이
   놓일 면이 없다. 여기에 색 선택 UI를 되살리지 않는다.

   배포 도메인 잠금: Blog.admin.isAdmin()(= hostname이 localhost 계열)이 false면
   start()가 lockForVisitor()만 부르고 끝난다. 에디터는 초기화되지 않는다(.editor 노드 제거는
   admin.init()이 한다 — 계약서 §3·§8-2 예외, v3.8).

   v3.8(meeting-05 라운드 6): 저장 흐름의 유실 경로 셋을 막는다 —
     T4-1 저장 직전·직후 autosave debounce 취소(뒤늦게 발화해 방금 지운 초안을 되살리던 것),
     T4-2 새 글 저장 뒤 state.slot = 저장된 id + URL ?id= 갱신(초안이 'new' 슬롯에 고아로 남던 것),
     T4-3 id 변경(rename) 저장 뒤 슬롯도 새 id로(옛 id 슬롯에 고아 초안).
   그리고 툴바 템플릿·퀴즈(A-11·A-4), 줄 첫머리 `//` 코드 블록 단축 입력(U-1, 계약서 §6-2).
   v3.9(meeting-06 #4·#5): 본문 Enter 규칙 ①~⑤(펜스 안 들여쓰기·괄호, 펜스 밖 목록 이어쓰기 — 계약서 §6-2 Enter 규칙 표),
   한 줄 선택 Tab = 줄 들여쓰기, 저장 뒤 사이드바 즉시 갱신.
   v4.0(meeting-07): C2 로드 완료 전 폼 잠금(setFormLock) · C3 초안 슬롯은 로드 완료 뒤 확정(state.slot '' → markReady) ·
   m8 사이드바 오버레이가 떠 있으면 본문 Esc는 비켜선다 · m9 수정 모드 삭제(#btnDelete → 확인 모달 → DELETE /api/posts/{id}).
   v4.1(계약서 §6-0·§6-1 — 에디터 재설계): 보기 방식 세 칸 스위치(setViewMode · aria-pressed) · 칸 아래 오류(showFieldError ·
   clearFieldError — 검증 오류를 토스트로 말하지 않는다) · 계기판(updateMeter · updateCaret) · 나란히 보기의 미리보기 따라가기
   (syncPreviewScroll) · 연결됨 표시 숨김 · 세부 설정 요약 문구 · 복구 모달을 고르지 않고 닫으면 "결정 보류"(holdDraft — 옛 초안을
   보류 슬롯으로 옮기고 상태줄에 복구/버리기를 남긴다).
   v4.2(계약서 §6-2 — 사용자 원문 "코드 블록 부분 괄호 쓰면 IDE 처럼 괄호 닫히는거 까지 같이 보여줘" / "게시글 작성 부분을 좀 더
   고도화(코드 블록을 특히나)"): 펜스 안 자동 닫기·건너뛰기·쌍 지우기(onPairKey · onPairBackspace) · 펜스 안 Ctrl/Cmd+/ 주석 토글
   (toggleComment — 접두는 펜스 언어) · 줄 복제 Ctrl/Cmd+D(duplicateLines) · 줄 이동 Alt+Shift+↑/↓(moveLines) · 선택 없는 Shift+Tab이
   줄을 통째로 선택하던 덫 제거 · 코드 블록 언어 기억(blogCodeLang — insertCodeBlock · `//언어` · 펜스 여는 줄).
   v4.3(계약서 §6-0·§6-1·§6-2, docs/api.md v1.2 — meeting-08 D1·D17~D21): 덮어쓰기 차단 — id 사전 확인(분류 PUT보다 먼저) ·
   자동 id 접미사 -2~-9 · 손 id는 #fIdError(접힌 세부 설정을 연다) · PUT 의도 필드(새 글 ifNew / 디스크 글 expectedUpdated) ·
   409를 error.code로 가름(exists · stale 모달 · conflict만 "손으로 정리") · 200 + isNew:false 경고 모달 /
   줄 시작 = lineStartAt() 하나 · 언어 글자 대소문자(친 그대로) · 선택 있는 Tab은 선택을 옮기기만 · 주석 표 확장 + 모르는 언어는
   무동작·토스트 · 툴바 코드 블록은 코드 안에서 넣지 않음 · Ctrl+S 글자 판정 = keyIs · "코드 블록 안" = Blog.markdown.codeRanges/codeAt
   (에디터 안 판정 사본 삭제) · 언어 기억 키 = CFG.storageKeys.codeLang. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
  var CFG = Blog.config;
  var U = Blog.util;
  var store = Blog.store;
  var md = Blog.markdown;

  /* 계약서 10-1: 슬러그가 없는 글은 이 폴더로 폴백한다.
     config.js가 같은 값을 들고 있으면 그쪽을 따른다 — 폴백 폴더명은 한 곳에서만 정해야 한다. */
  var UNCATEGORIZED = (CFG.category && CFG.category.fallbackSlug) || '_uncategorized';
  /* (CAT_PATH_FALLBACK 제거 — 경로 규칙은 store만 가진다. 선언만 남아 있으면
     "여기도 경로를 안다"는 착각을 만들고, 두 곳이 갈라지면 저장·조회가 어긋난다.) */
  /* 새로 만들 때의 폴더명 규칙(계약서 10-2): 영문 소문자·숫자·하이픈. */
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  /* 이미 categories.json에 들어 있는 값까지 막지는 않는다. 경로로 쓸 수 있으면 통과. */
  var PATH_SAFE_RE = /^[a-z0-9_][a-z0-9_-]*$/;
  /* posts/ 안에서 이미 뜻이 정해진 이름. 폴더로 쓰면 파일과 헷갈린다. */
  var RESERVED_SLUGS = ['index', 'categories', 'posts'];

  /* 복습 템플릿의 진실은 config.js의 CFG.recap.template(frontend-dev 소유) 하나다(계약서 §6-2·§5-7-3) —
     여기 사본을 두지 않는다. 두 값이 갈리면 post.js의 요약 카드가 템플릿의 h2를 못 알아본다(v3.9 #106).
     퀴즈 스니펫은 §5-7-3의 것. */
  var QUIZ_SNIPPET = '<details>\n<summary>Q. </summary>\n\n답\n\n</details>\n';

  /* 줄 첫머리 `//`(+언어) — 계약서 §6-2. 언어는 [A-Za-z0-9+#-]{1,20}(v4.3 D18 — 대소문자를 가리지 않고 받고 친 그대로 쓴다.
     글쓴이는 ```Java 로 친다 — §0-4 H1). 대소문자를 접는 것은 비교(주석 표)뿐이다. */
  var FENCE_TRIGGER_RE = /^\/\/([A-Za-z0-9+#-]{1,20})?$/;
  /* (FENCE_LINE_RE 삭제 — v4.3 #169. "코드 블록 안"의 판정은 Blog.markdown.codeRanges/codeAt 하나다. 에디터에 사본을 두지 않는다.) */

  /* v4.2(계약서 §6-2): 코드 블록 언어 기억 — 툴바 "코드 블록"이 이 언어로 펜스를 열고 언어 글자를 선택해 둔다.
     갱신하는 곳은 셋: `//언어` 단축(maybeFence) · 펜스 여는 줄에 친 언어(learnFenceLang) · (읽기만) insertCodeBlock.
     localStorage가 막혀도(시크릿 모드 등) 기본값으로 계속 간다.
     v4.3(#175): 키의 자리는 config.js storageKeys.codeLang(계약서 §3-2 저장 키 표 — 키 목록을 한 곳에 모은다). 값은 'blogCodeLang' 그대로라
     옛 기억이 그대로 읽힌다. config.js에 값이 없을 때만 문자열로 폴백한다. */
  var CODE_LANG_KEY = (CFG.storageKeys && CFG.storageKeys.codeLang) || 'blogCodeLang';
  var CODE_LANG_DEFAULT = 'java';
  /* v4.3(D18): 친 그대로 저장한다(Java는 Java로). "같은 값"도 글자 그대로 — 대소문자가 다르면 사용자가 표기를 바꾼 것이다. */
  var CODE_LANG_RE = /^[A-Za-z0-9+#-]{1,20}$/;
  /* 펜스 여는 줄 전체가 "```언어"(뒤 공백만 허용)일 때만 배운다. 정보 문자열이 더 붙은 줄은 사용자가 손수 쓴 것이라 건드리지 않는다.
     v4.3: 대문자(```Java)도 배운다. */
  var FENCE_OPEN_LANG_RE = /^```([A-Za-z0-9+#-]{1,20})[ \t]*$/;

  var dom = {};
  var state = {
    mode: 'new',          // 'new' | 'edit'
    slot: '',             // 초안 저장 키. 'new' 또는 글 id. 디스크에 글이 생기거나 id가 바뀌면(onSaved) 따라 바뀐다 —
                          // 슬롯이 실제 id와 어긋나면 초안이 고아가 된다(T4-2·T4-3).
                          // v4.0(C3): ''(미정)로 시작한다. startNew()·loadForEdit()의 로드 완료 뒤에만 정해진다 —
                          // 예전에는 'new'로 시작하고 수정 모드는 fetch 전에 id로 정해져, 로드 중에 친 글자가 복구 모달보다 먼저
                          // 옛 초안을 덮었다. (store.draft는 빈 키를 'new'로 바꾸므로 saveDraftNow가 ''을 직접 막는다.)
    ready: false,         // v4.0(C2·C3): 로드가 끝나 슬롯이 확정됐는가. false면 초안을 쓰지 않는다(saveDraftNow·flushDraft)
    locked: true,         // v4.0(C2): 폼 잠금(setFormLock). 로드 전·삭제 중. 잠긴 동안 입력칸은 readOnly, 버튼은 disabled
    onDisk: false,        // 디스크에 있는 글을 열었거나 방금 저장했는가 — 삭제 버튼(#btnDelete)을 보일지(m9)
    serverChecked: false, // /api/health 판정이 한 번이라도 끝났는가 — 끝나기 전엔 삭제 버튼을 숨긴다(#editorServer가 아직 hidden)
    deleting: false,      // DELETE 진행 중
    created: '',          // 수정 모드에서 보존해야 하는 원본 게시 시각
    originalId: '',
    originalCategory: '',
    originalPath: '',     // 실제로 읽어 온 경로. 분류를 바꾸면 "이 파일을 지우라"고 알려 줘야 한다.
    originalUpdated: '',  // v4.3(api.md v1.2): 이 화면이 아는 디스크의 updated — 불러올 때 읽은 값, 저장 200 뒤에는 응답 meta.updated.
                          // 디스크 글을 저장할 때 expectedUpdated로 보낸다(다른 곳에서 먼저 저장됐으면 서버가 409 stale). 모르면 ''(보내지 않는다)
    idTouched: false,     // 사용자가 id를 직접 건드렸으면 자동 생성을 멈춘다
    modeTouched: false,   // 보기 모드를 손수 바꿨으면 화면 폭 변화가 덮어쓰지 않는다
    viewChoice: '',       // v4.1: 손수 고른 보기(write/split/preview). 좁아져 split이 write로 내려갔다가 넓어지면 이 값으로 돌아온다
    held: null,           // v4.1(§6-1 끝, #147): "결정 보류" 중인 옛 초안들 — { slot, list:[{savedAt, data}], frozen } 또는 null
    dirty: false,         // 저장하지 않은 변경
    server: false,        // 로컬 에디터 서버(docs/api.md)가 응답했는가. false면 저장 버튼이 disabled, Ctrl+S는 안내 토스트
    saving: false,        // PUT 진행 중. 같은 글을 두 번 보내지 못하게 막는다
    indexData: null       // index.json 사본 — 사이트명(fillSite)·사이드바(drawSide)가 읽는다. 저장 뒤 force로 다시 받는다
  };

  /* 분류 상태. added는 "이번에 새로 만들어서 categories.json에 아직 없는" 슬러그들. */
  var cats = {
    list: [],
    added: [],       // 이번 세션에서 새로 만든 slug
    loaded: false,   // categories.json을 실제로 읽었는가
    derived: false,  // index.json에서 되살린 목록인가(= 파일을 못 읽었다)
    error: null
  };

  /* store.*는 file:// 로 열었을 때 Promise를 만들기도 전에 동기적으로 throw한다.
     그대로 호출하면 start()가 중간에서 끊겨 에디터가 반쯤 죽은 채로 남는다.
     실패를 항상 "거부된 약속"으로 바꿔 받아, 사용자에게 이유를 보여줄 수 있게 한다. */
  function promised(fn) {
    try { return Promise.resolve(fn()); } catch (err) { return Promise.reject(err); }
  }

  /* 한글 제목이라 ASCII slug가 비었을 때 쓸 대체값. 타이핑할 때마다 바뀌면 안 되므로 한 번만 만든다. */
  var fallbackSlug = null;

  /* ---------- 경로 ----------
     경로 규칙은 store가 가진다(store.postPath / CFG.paths.post). 에디터가 따로 조립하면
     한쪽만 바뀌었을 때 "저장했는데 안 보이는" 사고가 난다. 여기서는 부르기만 한다. */

  function mkErr(code, message) {
    var err = new Error(message);
    err.code = code;
    return err;
  }

  function postPathOf(id, category) {
    return store.postPath(id, category);
  }

  /* 실제로 읽어 온 경로에서 폴더명을 되짚는다. 폴더가 곧 그 글의 진짜 분류다. */
  function catFromPath(url) {
    var m = /(?:^|\/)posts\/([^/]+)\/[^/]+\.md$/.exec(String(url || ''));
    return m ? m[1] : '';
  }

  /* ---------- 분류 ---------- */

  function normalizeCat(item, index) {
    var c = (typeof item === 'string') ? { slug: item, name: item } : (item || {});
    var slug = String(c.slug || c.id || c.value || '').trim().toLowerCase();
    if (!slug) return null;
    var order = Number(c.order);
    return {
      slug: slug,
      name: String(c.name || c.label || c.title || slug).trim() || slug,
      /* color는 폐기됐다(§9-2). 기존 categories.json에 키가 남아 있어도 읽지 않는다. */
      description: String(c.description || ''),
      order: isFinite(order) ? order : index
    };
  }

  function sortCats(list) {
    return list.sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.name).localeCompare(String(b.name), 'ko');
    });
  }

  /* store가 무엇을 돌려주든(배열 / {categories:[]} / slug 키 객체) 같은 모양으로 편다. */
  function normalizeCatList(raw) {
    var source = [];
    if (Array.isArray(raw)) source = raw;
    else if (raw && Array.isArray(raw.categories)) source = raw.categories;
    /* store.loadCategories()는 { list: [...], derived: boolean } 을 돌려준다. */
    else if (raw && Array.isArray(raw.list)) source = raw.list;
    else if (raw && typeof raw === 'object') {
      source = Object.keys(raw).map(function (key) {
        var value = raw[key];
        if (value && typeof value === 'object') {
          var copy = Object.assign({}, value);
          if (!copy.slug) copy.slug = key;
          return copy;
        }
        return { slug: key, name: String(value) };
      });
    }
    var seen = Object.create(null);
    var out = [];
    source.forEach(function (item, i) {
      var cat = normalizeCat(item, i);
      if (!cat || seen[cat.slug]) return;
      seen[cat.slug] = true;
      out.push(cat);
    });
    return sortCats(out);
  }

  /* 분류 목록은 store.loadCategories() 하나로 받는다.
     그쪽은 절대 reject하지 않고, 파일을 못 읽으면 index.json의 category 값에서
     목록을 되살려 { list, derived:true } 로 돌려준다. */

  /* 이 함수도 절대 reject하지 않는다. 분류를 못 읽는다고 글쓰기가 막히면 안 된다.

     derived:true는 "categories.json을 못 읽어 index.json에서 되살린 목록"이라는 뜻이다.
     고르는 데는 그대로 쓰되, 파일을 읽은 것으로 치지는 않는다 — 그 상태에서
     categories.json을 새로 만들면 원본의 설명·순서가 통째로 날아갈 수 있기 때문이다. */
  function loadCategories() {
    return promised(function () { return store.loadCategories(); })
      .then(function (res) {
        cats.list = normalizeCatList(res);
        cats.derived = Boolean(res && res.derived);
        cats.loaded = !cats.derived;
        cats.error = null;
      })
      .catch(function (err) {
        cats.list = [];
        cats.derived = true;
        cats.loaded = false;
        cats.error = err || mkErr('unknown', '분류 목록을 불러오지 못했습니다.');
      });
  }

  function findCat(slug) {
    var want = String(slug || '').trim().toLowerCase();
    if (!want) return null;
    var found = null;
    cats.list.forEach(function (c) { if (c.slug === want) found = c; });
    return found;
  }

  function findCatByName(name) {
    var want = String(name || '').trim().toLowerCase();
    if (!want) return null;
    var found = null;
    cats.list.forEach(function (c) { if (c.name.toLowerCase() === want) found = c; });
    return found;
  }

  /* config의 기본 분류가 slug일 수도, v1의 한글 표시 이름일 수도 있다. 둘 다 받아 준다.
     M4-4(meeting-04): 기본값이 없으면 "미선택"('')이다. 예전에는 첫 분류 → 미분류로 조용히 내려가서,
     분류를 고르지 않은 글이 첫 분류 폴더에 저장됐다. 분류는 글이 들어갈 폴더라 사용자가 고른 값만 쓴다.
     분류가 0개여도 '미분류'는 셀렉트에서 직접 고른 것만 인정한다(validate가 막는다). */
  function defaultCategorySlug() {
    var want = String((CFG.editor && CFG.editor.defaultCategory) || '').trim();
    var hit = findCat(want) || findCatByName(want);
    return hit ? hit.slug : '';
  }

  function hasOption(select, value) {
    var found = false;
    U.qsa('option', select).forEach(function (opt) { if (opt.value === value) found = true; });
    return found;
  }

  function optionLabel(cat) {
    return cat.name === cat.slug ? cat.name : cat.name + ' (' + cat.slug + ')';
  }

  function fillCategoryOptions(keep) {
    if (!dom.category) return;
    var want = (keep === undefined || keep === null) ? dom.category.value : keep;
    U.clear(dom.category);
    /* 첫 항목은 "아직 고르지 않음"(value ''). 저장은 validate()가 여기서 막고 셀렉트에 포커스를 준다(M4-4).
       placeholder 문구는 라벨이 아니라 다음 행동 안내다 — 이름은 <label for="fCategory">가 맡는다. */
    dom.category.appendChild(U.el('option', { value: '', text: '분류를 고르세요' }));
    cats.list.forEach(function (c) {
      dom.category.appendChild(U.el('option', { value: c.slug, text: optionLabel(c) }));
    });
    /* 분류가 0개여도 셀렉트가 빈 채로 남지 않는다. 빈 <select>는 화면에서 "고장"으로 읽히고,
       값이 없으면 chosenCategory()가 무엇을 돌려줘야 하는지도 애매해진다.
       계약서 §9-3의 폴백 폴더를 항상 마지막 항목으로 둔다. */
    dom.category.appendChild(U.el('option', { value: UNCATEGORIZED, text: '미분류 (' + UNCATEGORIZED + ')' }));
    selectCategory(want);
  }

  /* categories.json에 없는 값(예: v1의 한글 분류)이라도 조용히 날리지 않는다.
     보이게 남겨 두고, 저장할 때 폴더로 쓸 수 없다는 사실을 알려 준다. */
  function selectCategory(value) {
    if (!dom.category) return;
    var v = String(value || '').trim();
    if (!v) v = defaultCategorySlug();       // 기본 분류가 없으면 ''(미선택)로 남는다
    if (!hasOption(dom.category, v)) {
      dom.category.appendChild(U.el('option', {
        value: v, text: v + ' (categories.json에 없음)'
      }));
    }
    dom.category.value = v;
    /* 프로그램이 값을 채운 경우(새 분류 추가 · 초안 복원 · "미분류로 저장")에는 change 이벤트가 나지 않는다.
       "분류를 골라 주세요" 오류가 떠 있는데 값이 이미 들어갔으면 여기서 지운다(§6-0 오류 규칙의 "고치면 사라진다"). */
    if (v) clearFieldError(dom.category, dom.categoryErr);
  }

  /* ''는 "아직 고르지 않음"이다. 여기서 미분류로 바꿔치기하지 않는다 — validate()가 거부한다(M4-4).
     (셀렉트의 title 툴팁은 계약서 §6 title 규칙(v3.8)으로 없앴다 — 이름은 라벨, 경로는 저장 결과 상태줄이 말한다.) */
  function chosenCategory() {
    return dom.category ? String(dom.category.value || '').trim() : '';
  }

  /* ---------- 새 분류 만들기 ----------
     이 블로그의 분류는 전부 여기서 태어난다. categories.json은 빈 배열에서 시작하고,
     사용자가 이 폼으로 만든 것만 들어간다. 그래서 0개 상태에서도 막힘없이 돌아야 한다. */

  var newCatSlugTouched = false;

  function openNewCat() {
    if (!dom.catNew) return;
    clearNewCatError();                      // 지난번에 닫힌 폼의 오류가 새 폼에 남지 않게
    U.setHidden(dom.catNew, false);
    if (dom.btnNewCat) dom.btnNewCat.setAttribute('aria-expanded', 'true');
    dom.newCatName.value = '';
    dom.newCatSlug.value = '';
    newCatSlugTouched = false;
    dom.newCatName.focus();
  }

  /* v4.1(§6-0 오류 규칙): `취소`(와 Esc·추가 성공)로 닫을 때 오류 줄도 지운다. */
  function closeNewCat(returnFocus) {
    if (!dom.catNew) return;
    clearNewCatError();
    U.setHidden(dom.catNew, true);
    if (dom.btnNewCat) dom.btnNewCat.setAttribute('aria-expanded', 'false');
    if (returnFocus && dom.btnNewCat) dom.btnNewCat.focus();
  }

  /* 새 분류의 두 칸은 오류 줄 하나(#fNewCatError)를 나눠 쓴다 — 어느 칸을 고쳐도 둘 다에서 지운다. */
  function clearNewCatError() {
    clearFieldError(dom.newCatName, dom.newCatErr);
    clearFieldError(dom.newCatSlug, dom.newCatErr);
  }

  /* 왜 막혔는지 말해 주지 않으면 사용자는 같은 값을 계속 다시 넣는다.
     v4.1(§6-0 오류 규칙): 토스트가 아니라 칸 아래 한 줄(#fNewCatError). 문구는 v4.0 토스트 그대로(문장 안의 `·`만 쉼표로).
     다른 칸에 붙어 있던 오류 표시를 먼저 걷어야 aria-invalid가 두 칸에 동시에 남지 않는다. */
  function rejectNewCat(node, message) {
    clearNewCatError();
    showFieldError(node, dom.newCatErr, message);
    if (node && node.select) node.select();
    return false;
  }

  function addCategory() {
    var name = dom.newCatName.value.trim();
    var slug = dom.newCatSlug.value.trim().toLowerCase();

    if (!name) return rejectNewCat(dom.newCatName, '분류 표시 이름을 입력해 주세요');
    if (!slug) {
      return rejectNewCat(dom.newCatSlug,
        '폴더명을 입력해 주세요. 한글은 폴더명으로 쓸 수 없어서 영문으로 직접 지어야 합니다 (예: algorithm)');
    }
    if (!SLUG_RE.test(slug)) {
      return rejectNewCat(dom.newCatSlug,
        '폴더명은 영문 소문자, 숫자, 하이픈만 쓸 수 있어요. 하이픈으로 시작하거나 끝날 수 없습니다.');
    }
    if (RESERVED_SLUGS.indexOf(slug) !== -1) {
      return rejectNewCat(dom.newCatSlug, '"' + slug + '" 은(는) posts/ 안에서 이미 쓰는 이름이라 폴더명으로 쓸 수 없어요');
    }
    if (findCat(slug)) {
      return rejectNewCat(dom.newCatSlug, '이미 있는 폴더명이에요: ' + slug);
    }
    if (findCatByName(name)) {
      return rejectNewCat(dom.newCatName, '같은 이름의 분류가 이미 있어요: ' + name);
    }

    /* 목록이 비어 있으면 maxOrder는 -1로 남고 첫 분류가 order 0을 받는다.
       index.html의 인덱스 정렬(§4-3)이 이 order를 그대로 읽는다. */
    var maxOrder = -1;
    cats.list.forEach(function (c) { if (c.order > maxOrder) maxOrder = c.order; });
    var cat = normalizeCat({
      slug: slug,
      name: name,
      description: '',
      order: maxOrder + 1
    }, cats.list.length);

    cats.list.push(cat);
    sortCats(cats.list);
    if (cats.added.indexOf(cat.slug) === -1) cats.added.push(cat.slug);

    fillCategoryOptions(cat.slug);
    closeNewCat(true);
    onEdit();
    U.toast('분류를 만들었어요. 저장할 때 서버에 함께 등록합니다', 'ok');
    return true;
  }

  /* ---------- 필드 읽기/쓰기 ---------- */

  function readForm() {
    return {
      id: dom.id.value.trim(),
      title: dom.title.value.trim(),
      summary: dom.summary.value.trim(),
      tags: dom.tags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      category: chosenCategory(),
      pinned: dom.pinned.checked,
      body: dom.body.value
    };
  }

  /* v4.1: 화면을 통째로 갈아 끼우면(불러오기 · 초안 복원) 지난 값에 대한 오류 줄은 뜻을 잃는다 — 걷어 내고,
     계기판(글자 수·분량)을 새 본문으로 맞춘다. 커서 위치는 한 번이라도 보였으면 다시 잰다. */
  function writeForm(meta, body) {
    dom.id.value = meta.id || '';
    dom.title.value = meta.title || '';
    dom.summary.value = meta.summary || '';
    dom.tags.value = (meta.tags || []).join(', ');
    selectCategory(meta.category || '');
    dom.pinned.checked = Boolean(meta.pinned);
    dom.body.value = body || '';
    clearAllFieldErrors();
    updateMeter();
    if (caretShown) scheduleCaret();
  }

  /* ---------- 칸 아래 오류 (v4.1 — 계약서 §6-0 "오류 규칙") ----------
     제목·분류·새 분류·본문 넷(v4.3: + 파일 id #fIdError — 다섯)의 검증 오류는 토스트가 아니라 그 칸 바로 아래 한 줄(.field-error)이다. 토스트는 문제의 칸에서 멀고
     몇 초 뒤 사라지며 칸에는 아무 표시도 남기지 않았다. 토스트는 칸과 무관한 결과(저장 성공·서버 오류·분류를 만들었다)만 말한다.
       보이기: 문구 → hidden 해제 → 칸에 aria-invalid="true" → 칸의 aria-describedby에 오류 id 추가(기존 catNewHint·bodyHint는 둔다)
               → 포커스를 그 칸으로. 이미 포커스가 있으면 blur 뒤 focus — 포커스가 "새로" 들어와야 스크린리더가 설명(오류)을 읽는다.
       지우기: 그 칸의 input(셀렉트는 change) 때 — aria-invalid 제거, hidden, aria-describedby에서 오류 id만 뺀다.
     오류 줄에는 role="alert"·aria-live를 주지 않는다(포커스 이동과 겹치면 두 번 읽힌다). */

  function tokenList(node, attr) {
    var raw = node.getAttribute(attr);
    return raw ? raw.split(/\s+/).filter(Boolean) : [];
  }

  function setTokens(node, attr, list) {
    if (list.length) node.setAttribute(attr, list.join(' '));
    else node.removeAttribute(attr);
  }

  function showFieldError(field, errEl, text) {
    if (!field || !errEl) return;
    errEl.textContent = text;
    U.setHidden(errEl, false);
    field.setAttribute('aria-invalid', 'true');
    var ids = tokenList(field, 'aria-describedby');
    if (ids.indexOf(errEl.id) === -1) { ids.push(errEl.id); setTokens(field, 'aria-describedby', ids); }
    /* v4.3(§6-0 예외): 파일 id 칸은 접힌 세부 설정(.editor-more) 안이다 — 닫힌 details 안의 칸은 포커스를 받지 못하고(body로 샌다)
       오류 줄도 보이지 않는다. 포커스 "전에" 연다. 여는 것만 한다 — 오류가 지워져도 다시 접지 않는다(방금 그 칸을 고치는 중이다). */
    if (field === dom.id && dom.more && !dom.more.open) dom.more.open = true;
    if (document.activeElement === field) field.blur();
    field.focus();
    /* focus()는 칸만 화면에 들인다. 본문 오류 줄은 창의 바닥(키 큰 textarea 아래)이라 칸이 보여도 줄은 화면 밖일 수 있다 —
       줄까지 보이게 최소한만 굴린다(nearest). 창이 화면 − 작업 줄 높이라, 줄이 보이면 창 전체가 작업 줄 아래에 딱 선다. */
    if (errEl.scrollIntoView) errEl.scrollIntoView({ block: 'nearest' });
  }

  function clearFieldError(field, errEl) {
    if (!errEl) return;
    if (field && field.getAttribute('aria-invalid') === 'true') field.removeAttribute('aria-invalid');
    if (field) {
      var ids = tokenList(field, 'aria-describedby');
      var at = ids.indexOf(errEl.id);
      if (at !== -1) { ids.splice(at, 1); setTokens(field, 'aria-describedby', ids); }
    }
    if (!errEl.hasAttribute('hidden')) {
      U.setHidden(errEl, true);
      errEl.textContent = '';
    }
  }

  function clearAllFieldErrors() {
    clearFieldError(dom.title, dom.titleErr);
    clearFieldError(dom.category, dom.categoryErr);
    clearFieldError(dom.body, dom.bodyErr);
    clearFieldError(dom.id, dom.idErr);
    clearNewCatError();
  }

  /* ---------- 줄 시작 (v4.3 — 계약서 §6-2 "줄 시작", meeting-08 D17) ----------
     위치 p의 줄 시작 = p보다 앞(0 ~ p−1)에 있는 마지막 줄바꿈 바로 다음 자리. 그런 줄바꿈이 없으면 0.
     그래서 p = 0이면 언제나 0이고, 줄 시작은 절대 p보다 뒤가 아니다.
     예전 관용구 lastIndexOf('\n', p − 1) + 1은 p = 0에서 틀렸다 — JS가 음수 시작 위치를 0으로 잘라 0번 글자를 검사하므로,
     문서가 줄바꿈으로 시작하면 줄 시작이 1(커서보다 뒤)이 됐다(Shift+Tab이 다른 줄을 고침 · H2 IndexSizeError · 줄 이동이 빈 줄을 만듦 ·
     계기판 1행 0열). 줄 시작이 필요한 곳은 전부 이 함수를 부른다 — 같은 식을 새로 복사하지 않는다. */
  function lineStartAt(value, p) {
    if (!(p > 0)) return 0;
    return value.lastIndexOf('\n', p - 1) + 1;
  }

  /* ---------- 계기판 (v4.1 — 계약서 §6-0 "작업 줄의 JS") ----------
     "얼마나 썼나 · 어디에 있나". 줄 번호·현재 줄 강조는 두지 않는다(§6-0 "하지 않는 것" — 접힌 줄 높이를 타자마다 재야 한다).
     글자 수는 공백을 뺀 수, 분량은 500자/분. 커서는 "N행 M열"(+ 선택 길이). 셋 다 live 영역이 아니다 — 타자마다 낭독되면 쓸 수 없다.
     글자가 실제로 달라질 때만 DOM을 건드린다(같은 값을 다시 쓰지 않는다). */

  var READ_CHARS_PER_MIN = 500;
  var caretShown = false;      // 본문에 첫 focus가 들어오기 전에는 커서 위치를 보이지 않는다
  var caretFrame = 0;

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function updateMeter() {
    if (!dom.body) return;
    var n = dom.body.value.replace(/\s+/g, '').length;
    setText(dom.chars, n.toLocaleString('ko-KR') + '자');
    if (!dom.read) return;
    if (!n) { U.setHidden(dom.read, true); return; }
    setText(dom.read, '읽는 데 약 ' + Math.max(1, Math.round(n / READ_CHARS_PER_MIN)) + '분');
    U.setHidden(dom.read, false);
  }

  /* 줄 = 커서 앞의 줄바꿈 수 + 1, 칸 = 커서 − 그 줄의 시작 + 1. 커서는 선택의 "움직이는 끝"(뒤로 고른 선택이면 앞쪽 끝)이다. */
  function updateCaret() {
    caretFrame = 0;
    if (!dom.caret || !dom.body) return;
    var value = dom.body.value;
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var pos = dom.body.selectionDirection === 'backward' ? start : end;
    var line = 1;
    var at = value.indexOf('\n');
    while (at !== -1 && at < pos) { line += 1; at = value.indexOf('\n', at + 1); }
    var col = pos - lineStartAt(value, pos) + 1;
    var text = line + '행 ' + col + '열';
    if (end > start) text += ', ' + (end - start).toLocaleString('ko-KR') + '자 선택';
    setText(dom.caret, text);
    if (!caretShown) { caretShown = true; U.setHidden(dom.caret, false); }
  }

  /* 키·마우스·선택 이벤트가 한 프레임에 여럿 와도 한 번만 잰다(rAF 하나로 묶는다). */
  function scheduleCaret() {
    if (caretFrame) return;
    caretFrame = window.requestAnimationFrame(updateCaret);
  }

  /* ---------- id 자동 생성 ---------- */

  function makeFallbackSlug() {
    if (fallbackSlug) return fallbackSlug;
    var iso = U.nowIsoKst();
    fallbackSlug = 'note-' + iso.slice(11, 13) + iso.slice(14, 16) + iso.slice(17, 19);
    return fallbackSlug;
  }

  function buildId(title, dateIso) {
    var stamp = String(dateIso || U.nowIsoKst()).slice(0, 10);
    var slug = U.slugAscii(title);
    return stamp + '-' + (slug || makeFallbackSlug());
  }

  function refreshAutoId() {
    if (state.idTouched || state.mode === 'edit') return;
    var next = buildId(dom.title.value, null);
    if (dom.id.value === next) return;
    dom.id.value = next;
    /* v4.3: 자동 id의 접미사가 소진돼 #fIdError가 떠 있었다면 제목을 고쳐 id가 바뀐 지금은 뜻을 잃었다. */
    clearFieldError(dom.id, dom.idErr);
  }

  /* ---------- 상태 표시 ---------- */

  /* #editorStatus는 role="status"(= polite live 영역)다. 같은 문장을 다시 써 넣으면 스크린리더가 또 읽는다.
     타이핑 한 글자마다 "저장 중…"/"임시저장됨"이 번갈아 낭독되면 글을 쓸 수가 없으므로,
     문구가 실제로 달라질 때만 DOM을 건드린다(= 상태가 바뀔 때만 발화한다).
     v4.1(#147): "결정 보류" 중이면 어떤 문장 뒤에도 `이전 임시저장본이 남아 있어요: 복구 버리기`가 붙는다(heldNotice) —
     타자 한 번에 사라지면 "나중에 정한다"가 성립하지 않는다. 그래서 비교 기준은 textContent가 아니라 본문 문장(statusText) +
     보류 표시 여부이고, 탭 안내(hintStatus)가 되돌릴 문장도 statusText다. */
  var statusText = '';
  var statusParts = [];      // 본문 문장의 조각(글자·링크 노드) — 보류 안내만 다시 그릴 때(repaintStatus) 링크까지 그대로 되살린다
  var paintedKey = null;

  function heldVisible() {
    return Boolean(state.held && state.held.list.length && !state.locked);
  }

  function paintStatus(parts, text, isNodes) {
    if (!dom.status) return;
    var key = (isNodes ? 'n:' : 't:') + text + (heldVisible() ? '\u0000held' + state.held.list.length : '');
    statusText = text;
    statusParts = parts;
    if (!isNodes && key === paintedKey) return;
    paintedKey = key;
    U.clear(dom.status);
    U.append(dom.status, parts);
    if (heldVisible()) U.append(dom.status, heldNotice(text));
  }

  /* dirty를 넘기면 "저장 상태가 정해졌다"는 뜻이라 .is-new(아직 한 번도 저장한 적 없는 새 글)를 뗀다 — startNew()만 다시 붙인다. */
  function applyDirty(dirty) {
    if (typeof dirty !== 'boolean' || !dom.status) return;
    state.dirty = dirty;
    dom.status.classList.toggle('is-dirty', dirty);
    dom.status.classList.remove('is-new');
  }

  function setStatus(text, dirty) {
    paintStatus([text], text, false);
    applyDirty(dirty);
  }

  /* 상태줄에 링크가 섞인 문장을 쓴다(M4-5 — 저장 뒤 "글 보기"·"목록으로").
     parts는 문자열 또는 노드. 다음 setStatus(text)가 내용을 갈아 끼우면 링크는 자연히 사라진다.
     새 부품 없음 — .editor-status 안의 <a>는 base.css의 본문 링크 규칙을 그대로 받는다. */
  function setStatusNodes(parts, dirty) {
    var text = parts.map(function (p) { return typeof p === 'string' ? p : (p && p.textContent) || ''; }).join('');
    paintStatus(parts, text, true);
    applyDirty(dirty);
  }

  /* 보류 안내만 붙이거나 떼고 본문 문장은 그대로 다시 그린다(보류가 시작·끝났을 때, 잠금이 풀렸을 때).
     본문 조각은 같은 노드를 다시 붙인다 — "저장됨: … 글 보기 또는 목록으로"의 링크가 글자로 무너지지 않는다. */
  function repaintStatus() {
    paintedKey = null;
    paintStatus(statusParts.length ? statusParts : [statusText], statusText, true);
  }

  function markDirty() {
    state.dirty = true;
    if (dom.status) dom.status.classList.add('is-dirty');
  }

  /* ---------- 미리보기 ---------- */

  var renderPreview = U.debounce(function () {
    try {
      md.renderInto(dom.preview, dom.body.value, { headings: false });
    } catch (err) {
      U.clear(dom.preview);
      dom.preview.appendChild(U.el('p', { text: '미리보기를 그릴 수 없습니다: ' + err.message }));
    }
    /* v4.1(#144): 다시 그리면 미리보기 높이가 바뀐다 — 본문 스크롤 비율에 한 번 다시 맞춘다. */
    syncPreviewScroll();
  }, CFG.debounce.preview);

  /* ---------- 미리보기 따라가기 (v4.1 #144 — 계약서 §6-0 "작업 줄의 JS") ----------
     나란히 보기에서 본문 창을 굴리면 미리보기 창(#previewPane)이 같은 비율로 따라간다. 한 방향(본문 → 미리보기)만 —
     양방향이면 서로를 되밀어 떤다. 스크롤 핸들러는 rAF 하나로 묶고, 그 안에서 읽는 레이아웃 값은 두 요소의 치수뿐이다.
     마크다운 줄과 렌더 블록의 1:1 대응(커서 위치로 맞추기)은 파서 수준 작업이라 하지 않는다(§6-0 "하지 않는 것"). */
  var scrollFrame = 0;

  function syncPreviewScroll() {
    if (!dom.previewPane || !dom.body || !dom.split) return;
    if (dom.split.getAttribute('data-mode') !== 'split') return;
    var body = dom.body;
    var pane = dom.previewPane;
    var ratio = body.scrollTop / Math.max(1, body.scrollHeight - body.clientHeight);
    pane.scrollTop = ratio * (pane.scrollHeight - pane.clientHeight);
  }

  function onBodyScroll() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(function () {
      scrollFrame = 0;
      syncPreviewScroll();
    });
  }

  /* ---------- 자동 임시저장 ---------- */

  /* 새로 만든 분류도 초안에 같이 담는다. 새로고침 한 번에 사라지면
     사용자는 폴더명을 다시 지어야 하고, 그 사이 글의 분류가 어긋난다. */
  function addedCatObjects() {
    return cats.added.map(function (slug) { return findCat(slug); }).filter(Boolean);
  }

  /* 지금 화면을 이 슬롯에 쓴다(상태줄은 건드리지 않는다). 못 쓰면 false.
     C3: 슬롯이 정해지기 전(로드 완료 전)에는 어느 슬롯에도 쓰지 않는다 — 그 슬롯에 있던 옛 초안은
     복구 모달(applyDraftIfNewer)이 먼저 보여 줘야 한다.
     v4.1(#147): 옛 초안을 보류 슬롯으로 옮기지 못했으면(저장소가 가득 참, frozen) 그 초안은 아직 이 슬롯에 있다 — 덮지 않는다.
     결정(복구·버리기)이 나면 frozen이 풀리고 그때부터 다시 쓴다. */
  function writeDraft() {
    if (!state.ready || !state.slot) return false;
    if (state.held && state.held.frozen && state.held.slot === state.slot) return false;
    return store.draft.save(state.slot, {
      mode: state.mode,
      created: state.created,
      originalId: state.originalId,
      originalCategory: state.originalCategory,
      originalPath: state.originalPath,
      newCats: addedCatObjects(),
      form: readForm()
    });
  }

  function saveDraftNow() {
    if (!state.ready || !state.slot) return false;
    var ok = writeDraft();
    setStatus(ok ? '임시저장됨. 아직 서버에 저장하지 않았어요' : '임시저장 실패(브라우저 저장소 차단)', true);
    return ok;
  }

  var autosave = U.debounce(saveDraftNow, CFG.debounce.draft);

  /* 대기 중인 자동저장을 지금 당장 실행한다.
     debounce가 800ms를 기다리는 동안 탭이 닫히면 그 사이의 입력은 어디에도 남지 않는다.
     떠나는 순간(beforeunload / pagehide / 탭 숨김)에 반드시 한 번 흘려보낸다. */
  function flushDraft() {
    if (!state.dirty) return;            // 바꾼 게 없으면 빈 초안을 만들지 않는다
    if (!state.ready) return;            // 슬롯 미정(C3)
    if (autosave.cancel) autosave.cancel();
    saveDraftNow();
  }

  function onEdit() {
    /* C2: 잠긴 폼(로드 전·삭제 중)에서 오는 편집은 없어야 한다 — readOnly/disabled가 막지만, 막힌 길로 새어 든 이벤트가
       dirty를 켜고 autosave를 걸면 슬롯이 정해지기 전의 값이 초안이 된다. */
    if (state.locked || !state.ready) return;
    updateMeter();                           // v4.1(#143): 글자 수·분량은 편집마다(값이 같으면 DOM을 건드리지 않는다)
    /* 이미 dirty면 다시 쓰지 않는다 — 키 입력마다 낭독되는 걸 막는다.
       v4.0(M11): "저장 중…" → "임시저장 중…". 같은 "저장 중…"을 서버 저장(save())도 쓰고 있어 둘이 구별되지 않았다 —
       여기는 브라우저(localStorage)에 쓰는 것이지 파일에 쓰는 것이 아니다. */
    if (!state.dirty) setStatus('임시저장 중…');
    markDirty();
    autosave();
  }

  /* ---------- 마크다운 툴바 ----------
     선택 영역을 감싸고, 끝나면 커서를 쓸 만한 자리에 되돌려 놓는다.
     (선택이 사라지면 연속 서식이 불가능해서 쓰기 흐름이 끊긴다.) */

  function setSelection(start, end) {
    dom.body.focus();
    dom.body.setSelectionRange(start, end);
  }

  /* textarea.value에 직접 대입하면 브라우저의 되돌리기(Ctrl+Z) 스택이 통째로 사라진다.
     툴바나 Tab을 한 번만 눌러도 그 앞의 타이핑을 되돌릴 수 없게 되고,
     800ms 뒤 자동저장이 그 상태를 덮어써 되살릴 방법이 아예 없어진다(라운드 2 M5).

     execCommand('insertText')는 표준에서 폐기됐지만, textarea의 undo 스택을 보존하는
     대체 API가 아직 없다. 사용자의 타이핑과 똑같이 취급되므로 Ctrl+Z가 계속 동작한다.
     지원하지 않거나 false를 돌려주는 환경에서는 예전 방식(직접 대입)으로 물러선다 —
     되돌리기를 잃을지언정 글자가 안 들어가는 일은 없어야 한다. */
  function replaceRange(start, end, text, selStart, selEnd) {
    var target = dom.body;
    /* C2: readOnly textarea에서는 execCommand가 실패하고 폴백(setRangeText)이 값을 바꿔 버린다 — 잠금을 뚫는 유일한 길이라 여기서 막는다. */
    if (state.locked || target.readOnly) return;
    var applied = false;
    var value0 = target.value.length;

    /* execCommand는 "현재 선택 영역"에 끼워 넣는다. 먼저 바꿀 범위를 선택해 둬야 한다. */
    target.focus();
    target.setSelectionRange(start, end);

    if (typeof document.execCommand === 'function') {
      try {
        /* 빈 문자열은 insertText가 아니라 delete다 — 'insertText'에 ''를 주면 브라우저에 따라 false를 돌려주고
           폴백(setRangeText)으로 떨어져 되돌리기 스택이 빈다. Enter 규칙 ④의 "목록 끝내기"(접두사만 지운다)가 이 길을 쓴다. */
        applied = document.execCommand(text === '' ? 'delete' : 'insertText', false, text) === true;
      } catch (err) {
        applied = false;
      }
      /* true를 돌려주고도 실제로는 안 넣는 브라우저가 있다. 결과를 확인하고 아니면 폴백. */
      if (applied && target.value.slice(start, start + text.length) !== text) applied = false;
      if (applied && text === '' && target.value.length !== value0 - (end - start)) applied = false;
    }

    if (!applied) {
      /* 폴백. setRangeText도 value 대입도 Chromium에서는 되돌리기 스택을 비운다(2026-09-21 헤드리스 실측) —
         차이는 스크롤 위치·선택 보존뿐이라 있으면 setRangeText를 쓴다. */
      if (typeof target.setRangeText === 'function') target.setRangeText(text, start, end, 'end');
      else {
        var value = target.value;
        target.value = value.slice(0, start) + text + value.slice(end);
      }
    }

    setSelection(
      selStart === undefined ? start + text.length : selStart,
      selEnd === undefined ? start + text.length : selEnd
    );
    /* v4.1: 폴백 경로(setRangeText)는 input 이벤트를 내지 않는다 — 본문 오류 지우기·커서 위치를 여기서도 챙긴다. */
    clearFieldError(dom.body, dom.bodyErr);
    scheduleCaret();
    onEdit();
    renderPreview();
  }

  /* ---------- 마커 판별 (M10) ----------
     `*`와 `**`는 앞뒤 글자만 봐서는 구분되지 않는다. **굵게** 를 선택한 채 Ctrl+I를 누르면
     바깥 별이 하나씩 벗겨져 *기울임* 으로 조용히 변질됐다.
     그래서 "마커 문자가 연속으로 정확히 몇 개 붙어 있는지"를 세서 길이가 딱 맞을 때만 토글한다. */

  function isUniformMarker(marker) {
    if (!marker) return false;
    for (var i = 1; i < marker.length; i += 1) {
      if (marker.charAt(i) !== marker.charAt(0)) return false;
    }
    return true;
  }

  /* pos 바로 왼쪽에서 ch가 몇 개 이어지는가 */
  function runBefore(value, pos, ch) {
    var n = 0;
    while (pos - n - 1 >= 0 && value.charAt(pos - n - 1) === ch) n += 1;
    return n;
  }

  /* pos에서 오른쪽으로 ch가 몇 개 이어지는가 */
  function runAfter(value, pos, ch) {
    var n = 0;
    while (pos + n < value.length && value.charAt(pos + n) === ch) n += 1;
    return n;
  }

  /* 별 n개가 붙어 있을 때 길이 len짜리 마커를 떼어내도 되는가.
       1개 = 기울임, 2개 = 굵게, 3개 = 굵게+기울임.
     3개일 때만 예외로 섞여 있다고 보고 한쪽만 떼어낸다(***x*** 에서 Ctrl+B → *x*).
     그 밖에는 개수가 정확히 같을 때만 떼어낸다 — 2개를 1개로 깎으면
     굵게가 조용히 기울임으로 바뀐다(M10). */
  function markerRunOk(run, len) {
    return run === len || (run === 3 && len < 3);
  }

  /* 선택 영역 "바깥"이 정확히 이 마커로만 감싸져 있는가 */
  function wrappedOutside(value, start, end, before, after) {
    var outerStart = start - before.length;
    var outerEnd = end + after.length;
    if (outerStart < 0 || outerEnd > value.length) return false;
    if (value.slice(outerStart, start) !== before) return false;
    if (value.slice(end, outerEnd) !== after) return false;
    if (isUniformMarker(before) && !markerRunOk(runBefore(value, start, before.charAt(0)), before.length)) return false;
    if (isUniformMarker(after) && !markerRunOk(runAfter(value, end, after.charAt(0)), after.length)) return false;
    return true;
  }

  /* 마커까지 통째로 드래그해 선택한 경우(`**굵게**` 전체 선택 후 Ctrl+B) */
  function wrappedInside(selected, before, after) {
    if (selected.length < before.length + after.length) return false;
    if (selected.slice(0, before.length) !== before) return false;
    if (selected.slice(selected.length - after.length) !== after) return false;
    if (isUniformMarker(before) && !markerRunOk(runAfter(selected, 0, before.charAt(0)), before.length)) return false;
    if (isUniformMarker(after) && !markerRunOk(runBefore(selected, selected.length, after.charAt(0)), after.length)) return false;
    return true;
  }

  function surround(before, after, placeholder) {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var value = dom.body.value;
    var selected = value.slice(start, end);

    /* 이미 감싸져 있으면 벗긴다(토글). */
    if (wrappedOutside(value, start, end, before, after)) {
      var outerStart = start - before.length;
      replaceRange(outerStart, end + after.length, selected, outerStart, outerStart + selected.length);
      return;
    }

    if (wrappedInside(selected, before, after)) {
      var inner = selected.slice(before.length, selected.length - after.length);
      replaceRange(start, end, inner, start, start + inner.length);
      return;
    }

    var text = selected || placeholder || '';
    replaceRange(start, end, before + text + after,
      start + before.length, start + before.length + text.length);
  }

  /* 선택된 모든 줄의 앞에 접두사를 붙이거나(이미 있으면) 뗀다.

     family = "같은 뜻의 다른 표기"를 잡는 정규식(선택).
     예전에는 `line.indexOf(prefix) === 0` 하나로만 판정해서 `### 제목`에 H2를 누르면
     접두사가 겹쳐 붙어 `## ### 제목`이 됐다. 마커 길이를 정확히 비교하는
     M10(굵게/기울임)과 같은 방식으로 맞춘다: 정확히 같은 접두사면 떼고,
     같은 가족의 다른 표기면 겹쳐 붙이지 않고 갈아끼운다. */
  function linePrefix(prefix, family) {
    var value = dom.body.value;
    var start = lineStartAt(value, dom.body.selectionStart);
    var end = dom.body.selectionEnd;
    var lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    var block = value.slice(start, lineEnd);
    var lines = block.split('\n');
    /* "정확히 이 접두사"일 때만 토글 해제 대상이다(### 는 ## 가 아니다). */
    var allHave = lines.every(function (line) { return line.slice(0, prefix.length) === prefix; });
    var next = lines.map(function (line) {
      if (allHave) return line.slice(prefix.length);
      var hit = family ? family.exec(line) : null;
      if (hit) return prefix + line.slice(hit[0].length);
      return prefix + line;
    }).join('\n');

    replaceRange(start, lineEnd, next, start, start + next.length);
  }

  /* 표·구분선 같은 블록은 앞 줄에 글이 붙어 있으면 마크다운이 그 문단의 일부로 읽는다
     (`글\n---` 는 구분선이 아니라 제목이 된다). 필요한 만큼 빈 줄을 앞에 만든다. */
  function leadBreaks(value, pos) {
    if (pos <= 0) return '';
    if (value.charAt(pos - 1) !== '\n') return '\n\n';
    if (pos >= 2 && value.charAt(pos - 2) !== '\n') return '\n';
    return '';
  }

  /* selFrom·selTo는 "삽입한 text 안에서의" 위치다. 주지 않으면 블록 끝에 커서를 둔다. */
  function insertBlock(text, selFrom, selTo) {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var lead = leadBreaks(dom.body.value, start);
    var payload = lead + text;
    var base = start + lead.length;
    var a = (selFrom === undefined) ? start + payload.length : base + selFrom;
    var b = (selTo === undefined) ? a : base + selTo;
    replaceRange(start, end, payload, a, b);
  }

  function insertLink() {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var selected = dom.body.value.slice(start, end);
    if (/^https?:\/\//i.test(selected)) {
      var label = '링크 텍스트';
      replaceRange(start, end, '[' + label + '](' + selected + ')', start + 1, start + 1 + label.length);
      return;
    }
    var text = selected || '링크 텍스트';
    var url = 'https://';
    var built = '[' + text + '](' + url + ')';
    var urlAt = start + text.length + 3;
    replaceRange(start, end, built, urlAt, urlAt + url.length);
  }

  /* v4.2(계약서 §6-2): 마지막으로 쓴 언어로 펜스를 열고(기본 java) 언어 글자를 선택해 둔다 — 그대로 두면 그 언어, 치면 덮어쓴다.
     선택이 없으면 가운데는 빈 줄이다(v4.1까지의 `// 코드` 자리표시는 언어를 바꾸면 틀린 주석이 되고, 쓰기 전에 지워야 했다).
     펜스는 줄 첫머리여야 펜스다 — 줄 중간에서 누르면 앞에 줄바꿈 하나를 둔다(펜스는 문단을 끊을 수 있어 빈 줄까지는 필요 없다).
     v4.3(D3 · FD2-5 · FD2-13):
       ① 선택의 시작이나 끝이 코드 블록 안이거나 선택이 펜스 줄을 걸치면 넣지 않는다 — 토스트만, 글·선택은 그대로.
          v4.2는 넣어서 바깥 블록을 닫았고, 원래 닫는 펜스가 고아가 되어 그 아래 문서 전체가 코드가 됐다.
       ② 선택이 다음 줄 0열에서 끝나면(줄 단위 선택 — lineSpan과 같은 모양) 끝의 줄바꿈 하나는 코드에 넣지 않고 닫는 펜스 뒤로 보낸다
          — 코드 끝에 빈 줄이 생기지 않는다(펜스 뒤의 줄바꿈이 그 자리를 대신한다). */
  var CODE_BLOCK_INSIDE_TEXT = '이미 코드 블록 안이에요. 블록 밖에서 눌러 주세요';

  function insertCodeBlock() {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var value = dom.body.value;
    if (codeRangeAt(value, start) || codeRangeAt(value, end) || fenceLineIn(value, start, end)) {
      U.toast(CODE_BLOCK_INSIDE_TEXT);
      return;
    }
    var selected = value.slice(start, end);
    if (end > start && selected.charAt(selected.length - 1) === '\n') selected = selected.slice(0, -1);
    var lang = codeLang();
    var lead = (start > 0 && value.charAt(start - 1) !== '\n') ? '\n' : '';
    var fence = lead + '```' + lang + '\n' + selected + '\n```\n';
    var langAt = start + lead.length + 3;
    replaceRange(start, end, fence, langAt, langAt + lang.length);
  }

  /* 기억한 언어. 값이 규칙([A-Za-z0-9+#-]{1,20})에 안 맞으면(손으로 고친 저장소 등) 기본값. 친 그대로 돌려준다(v4.3). */
  function codeLang() {
    var saved = null;
    try { saved = window.localStorage.getItem(CODE_LANG_KEY); } catch (err) { saved = null; }
    return (saved && CODE_LANG_RE.test(saved)) ? saved : CODE_LANG_DEFAULT;
  }

  var codeLangMemo = null;   // 방금 쓴 값 — 펜스 줄에서 타자마다 같은 값을 다시 쓰지 않게

  function rememberCodeLang(lang) {
    var v = String(lang || '');
    if (!CODE_LANG_RE.test(v) || v === codeLangMemo) return;
    codeLangMemo = v;
    try { window.localStorage.setItem(CODE_LANG_KEY, v); } catch (err) { /* 기억 못 해도 기본값으로 계속 간다 */ }
  }

  /* 커서가 펜스 "여는" 줄에 있고 그 줄이 ```언어 꼴이면 그 언어를 기억한다(툴바가 선택해 둔 언어를 덮어쓴 경우 등).
     싼 검사(줄 첫 세 글자)를 먼저 한다 — 거의 모든 입력은 거기서 끝나고, 펜스 줄에서만 codeRanges(문서 훑기, 메모 1칸)를 부른다.
     v4.3: "여는 줄"은 codeRanges가 블록을 연 줄(range.open)이다 — 닫는 줄·코드 안의 ```java 글자(백틱 4개 펜스 안)는 배우지 않는다.
     ~~~로 연 줄은 모양이 ```가 아니라 배우지 않는다(툴바는 ```로 연다). ```Java 처럼 대문자도 친 그대로 배운다. */
  function learnFenceLang() {
    var pos = dom.body.selectionStart;
    if (pos !== dom.body.selectionEnd) return;
    var value = dom.body.value;
    var ls = lineStartAt(value, pos);
    if (value.slice(ls, ls + 3) !== '```') return;
    var le = value.indexOf('\n', pos);
    if (le === -1) le = value.length;
    var m = FENCE_OPEN_LANG_RE.exec(value.slice(ls, le));
    if (!m || !opensCodeAt(value, ls)) return;
    rememberCodeLang(m[1]);
  }

  /* ---------- 표 ----------
     요구사항 #5에서 "그래프"가 빠지고 표가 그 자리를 받았다. 표는 이 블로그의 일급 기능이다.
     그래서 고정 스켈레톤을 붙여 넣고 끝내지 않는다:
       ① 열·행 수를 고른다  ② 열마다 GFM 정렬을 고른다  ③ 넣은 직후 첫 칸이 선택돼 바로 덮어쓸 수 있다.

     정렬 표기(GFM 구분선): --- 기본 / :--- 왼쪽 / :---: 가운데 / ---: 오른쪽.
     이 구분선을 읽어 실제로 정렬해 그리는 것은 markdown.js·prose.css 쪽 일이다(다른 담당자). */

  var ALIGNS = [
    { value: 'default', label: '기본', mark: '---' },
    { value: 'left', label: '왼쪽', mark: ':---' },
    { value: 'center', label: '가운데', mark: ':---:' },
    { value: 'right', label: '오른쪽', mark: '---:' }
  ];

  function alignMark(value) {
    var hit = null;
    ALIGNS.forEach(function (a) { if (a.value === value) hit = a; });
    return (hit || ALIGNS[0]).mark;
  }

  /* 마지막에 고른 값을 세션 동안 기억한다. 표를 여러 개 넣는 글에서 매번 같은 값을
     다시 고르게 하면 대화상자가 도움이 아니라 방해물이 된다. */
  var tableCfg = { cols: 3, rows: 2, aligns: [] };

  /* 한 줄을 만들면서 각 칸의 글자가 줄 안 어디서 시작하는지도 같이 돌려준다.
     "넣은 뒤 첫 칸을 선택" 하려면 글자 수를 세는 곳이 한 군데여야 어긋나지 않는다. */
  function tableRow(cells) {
    var text = '|';
    var marks = [];
    cells.forEach(function (cell) {
      marks.push({ at: text.length + 1, len: String(cell).length });
      text += ' ' + cell + ' |';
    });
    return { text: text, marks: marks };
  }

  function buildTable(cfg, firstCell) {
    var cols = Math.max(1, cfg.cols);
    var headCells = [];
    var blank = [];
    var delimCells = [];
    var i;
    for (i = 0; i < cols; i += 1) {
      headCells.push(i === 0 && firstCell ? firstCell : '항목 ' + (i + 1));
      delimCells.push(alignMark(cfg.aligns[i]));
      blank.push('');
    }

    var head = tableRow(headCells);
    var lines = [head.text, tableRow(delimCells).text];
    for (i = 0; i < Math.max(1, cfg.rows); i += 1) lines.push(tableRow(blank).text);

    /* 첫 칸을 선택 영역으로 이미 채웠으면 커서는 다음 칸으로 간다. */
    var caret = head.marks[(firstCell && cols > 1) ? 1 : 0];
    return {
      text: lines.join('\n') + '\n',
      selFrom: caret.at,
      selTo: caret.at + caret.len
    };
  }

  function insertTable(cfg, sel) {
    var built = buildTable(cfg, sel.text);
    /* 대화상자가 포커스를 가져갔다 돌려준 뒤다. 열기 전에 적어 둔 위치를 되돌려 놓고 넣는다 —
       그래야 replaceRange의 execCommand 경로(= 되돌리기 보존)가 올바른 자리에 들어간다. */
    dom.body.focus();
    dom.body.setSelectionRange(sel.start, sel.end);
    insertBlock(built.text, built.selFrom, built.selTo);
  }

  function openTableDialog() {
    var a = dom.body.selectionStart;
    var b = dom.body.selectionEnd;
    var raw = dom.body.value.slice(a, b);
    /* 한 줄짜리 선택만 첫 칸으로 옮긴다. 여러 줄·파이프가 섞인 선택을 삼키면
       표 한 개를 얻는 대신 쓴 글을 잃는다. 그럴 땐 건드리지 않고 선택 뒤에 넣는다. */
    var usable = raw.trim() !== '' && raw.indexOf('\n') === -1 && raw.indexOf('|') === -1;
    var sel = usable ? { start: a, end: b, text: raw.trim() } : { start: b, end: b, text: '' };

    var colSel = U.el('select', { class: 'field' });
    var rowSel = U.el('select', { class: 'field' });
    var n;
    for (n = 2; n <= 6; n += 1) colSel.appendChild(U.el('option', { value: String(n), text: n + '열' }));
    for (n = 1; n <= 10; n += 1) rowSel.appendChild(U.el('option', { value: String(n), text: n + '행' }));
    colSel.value = String(Math.min(6, Math.max(2, tableCfg.cols)));
    rowSel.value = String(Math.min(10, Math.max(1, tableCfg.rows)));

    /* 새 클래스를 만들지 않으려고 <p>로 감싼다 — .modal-body > p + p 가 이미 줄 간격을 준다. */
    var alignRow = U.el('p');

    function rebuildAligns() {
      var cols = Number(colSel.value) || 2;
      U.clear(alignRow);
      alignRow.appendChild(document.createTextNode('열 정렬 '));
      for (var i = 0; i < cols; i += 1) {
        var pick = U.el('select', { class: 'field', dataset: { col: String(i) } });
        ALIGNS.forEach(function (al) { pick.appendChild(U.el('option', { value: al.value, text: al.label })); });
        pick.value = tableCfg.aligns[i] || 'default';
        alignRow.appendChild(U.el('label', {}, [(i + 1) + '열 ', pick, ' ']));
      }
    }
    rebuildAligns();
    U.on(colSel, 'change', function () {
      /* 열을 줄였다 늘려도 앞서 고른 정렬이 남아 있어야 한다. */
      U.qsa('select[data-col]', alignRow).forEach(function (s) {
        tableCfg.aligns[Number(s.getAttribute('data-col'))] = s.value;
      });
      rebuildAligns();
    });

    function readDialog() {
      var picked = U.qsa('select[data-col]', alignRow).map(function (s) { return s.value; });
      tableCfg = { cols: Number(colSel.value) || 2, rows: Number(rowSel.value) || 1, aligns: picked };
      return tableCfg;
    }

    var confirmed = null;
    var m = Blog.ui.modal({
      title: '표 넣기',
      bodyNodes: [
        U.el('p', {
          text: sel.text
            ? '선택한 글 “' + sel.text + '” 은(는) 첫 칸 제목으로 들어갑니다.'
            : '머리글 행은 자동으로 만들어집니다. 넣고 나면 첫 칸이 선택돼 바로 덮어쓸 수 있어요.'
        }),
        U.el('p', {}, [U.el('label', {}, ['열 수 ', colSel]), ' ', U.el('label', {}, ['본문 행 수 ', rowSel])]),
        alignRow
      ],
      /* 이 모달은 확인창이 아니라 입력 폼이다. 첫 입력칸에서 시작하는 편이 빠르다. */
      initialFocus: colSel,
      actions: [
        { label: '취소', variant: 'ghost' },
        { label: '표 넣기', variant: 'primary', onClick: function () { confirmed = readDialog(); } }
      ],
      /* 표를 넣는 일은 모달이 완전히 닫힌 뒤에 한다. 열려 있는 동안 배경은 inert라
         textarea가 포커스를 받지 못하고, 그러면 되돌리기를 보존하는 경로가 깨진다. */
      onClose: function () { if (confirmed) insertTable(confirmed, sel); }
    });

    /* 셀렉트 위에서 Enter = 바로 넣기. 버튼 위의 Enter는 그 버튼의 클릭이므로 건드리지 않는다.
       한글 조합 확정용 Enter까지 가로채지 않도록 IME 가드를 둔다(M3-11과 같은 이유). */
    U.on(m.body, 'keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key !== 'Enter') return;
      if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A')) return;
      e.preventDefault();
      confirmed = readDialog();
      Blog.ui.closeModal();
    });
  }

  /* ---------- 템플릿·퀴즈 (v3.8, 계약서 §6-2·§5-7-3) ---------- */

  function recapTemplate() {
    return (CFG.recap && typeof CFG.recap.template === 'string') ? CFG.recap.template : '';
  }

  /* 본문이 비었으면(공백만) 템플릿 전체로 갈고 커서를 첫 절 아래 빈 줄에, 아니면 커서 위치에 블록으로 끼운다.
     자동 삽입은 하지 않는다 — 빈 템플릿이 그대로 저장되고 초안 비교(sameForm)가 "바뀌었다"고 오판한다(meeting-05 A-11). */
  function insertTemplate() {
    var tpl = recapTemplate();
    if (!tpl) { U.toast('템플릿이 설정에 없어요(config.js recap.template)', 'warn'); return; }
    var firstBlank = tpl.indexOf('\n') + 1;      // "## 핵심\n" 바로 다음 = 첫 절 아래 빈 줄
    if (dom.body.value.trim() === '') {
      replaceRange(0, dom.body.value.length, tpl, firstBlank, firstBlank);
      return;
    }
    insertBlock(tpl, firstBlank, firstBlank);
  }

  /* 뒤에 글이 바로 이어지면 빈 줄 하나를 더 둔다 — </details> 다음 줄에 글이 붙으면 marked가 HTML 블록에 삼킨다(§5-7-3). */
  function trailBreak(value, pos) {
    var rest = value.slice(pos);
    if (!rest || rest.charAt(0) === '\n') return '';
    return '\n';
  }

  function insertQuiz() {
    var caret = QUIZ_SNIPPET.indexOf('Q. ') + 3;
    var text = QUIZ_SNIPPET + trailBreak(dom.body.value, dom.body.selectionEnd);
    insertBlock(text, caret, caret);
  }

  var TOOLBAR = {
    bold: function () { surround('**', '**', '굵게'); },
    italic: function () { surround('*', '*', '기울임'); },
    /* family 정규식: 이미 다른 단계의 제목/목록/인용이면 겹쳐 붙이지 않고 갈아끼운다. */
    heading: function () { linePrefix('## ', /^#{1,6}[ \t]+/); },
    link: insertLink,
    code: function () { surround('`', '`', '코드'); },
    codeblock: insertCodeBlock,
    list: function () { linePrefix('- ', /^[-*+][ \t]+/); },
    quote: function () { linePrefix('> ', /^>[ \t]*/); },
    quiz: insertQuiz,
    table: openTableDialog,
    hr: function () { insertBlock('---\n\n'); },
    template: insertTemplate
  };

  /* ---------- `//` 코드 블록 단축 입력 (U-1, 계약서 §6-2) ----------
     사용자 원문(2026-09-20): "메모 쓸 때 // 2개 치면 코드를 쓸 수 있는 블록으로 만들어(단축키)".
     줄 첫머리(공백 0개)에 `//` 또는 `//java`를 치고 Enter/Space를 누르면 그 줄이 ```lang 펜스 3줄이 되고
     커서는 가운데 빈 줄에 놓인다. 판정은 input 이벤트에서 한다 — keydown은 IME·붙여넣기·모바일 키보드에서
     `/`가 안 오는 경우가 있다. 그 줄이 이미 코드 블록 안의 코드 줄이면(v4.3: Blog.markdown.codeAt — ~~~ · 목록 안 펜스 · 백틱 4개
     펜스도 코드다) 코드 안의 주석이므로 건드리지 않는다.

     바꾸는 방법: replaceRange(execCommand insertText). 계약서는 setRangeText를 적었지만 Chromium은 setRangeText가
     되돌리기 스택을 통째로 비운다(2026-09-21 헤드리스 Chrome·Edge 실측: 직후 execCommand('undo')가 false).
     execCommand 경로는 Ctrl+Z 한 번에 `//java` 상태로 돌아온다(같은 실측) — 계약이 요구한 결과는 이쪽이 낸다.
     execCommand는 input 이벤트를 다시 일으키므로 재진입 가드를 둔다. */

  var fencing = false;

  /* 이번 입력이 "확정 신호"(Enter 또는 Space 한 글자)였는가. inputType이 없는 옛 브라우저는 마지막 글자로 판단한다. */
  function isFenceTrigger(e, value, pos) {
    var last = value.charAt(pos - 1);
    if (last !== '\n' && last !== ' ') return false;
    var type = e && e.inputType;
    if (!type) return true;
    if (type === 'insertLineBreak' || type === 'insertParagraph') return last === '\n';
    if (type === 'insertText') return e.data === ' ' || e.data === '\n' || e.data === null;
    return false;
  }

  /* ---------- 코드 블록 안 = Blog.markdown.codeRanges (v4.3 #169 — 계약서 §6-2, meeting-08 D3) ----------
     "펜스 안"은 이 에디터 전체에서 렌더러와 같은 답 하나다 — `//` · 짝 · Ctrl+/ · Enter ①②③⑤ · 툴바 코드 블록 · 언어 기억이 이것을 쓴다.
     v4.2까지는 "커서 위쪽의 줄 첫머리 ``` 줄 수가 홀수"(insideFence)였고, 붙여 넣은 ~~~ · 목록 안 펜스 · 백틱 4개 펜스 · 줄 첫머리 인라인
     ```x``` 에서 marked와 갈렸다. 판정은 markdown.js(frontend-dev)의 스캐너가 가진다 — 여기는 부르기만 한다(사본 금지, R-D).
     돌려받는 range는 얼려진 공유 객체다 — 읽기만 한다. markdown.js가 옛 버전이라 함수가 없으면 "밖"으로 친다(규칙이 꺼질 뿐 글은 안전하다). */
  function codeRangeAt(value, p) {
    return (md && typeof md.codeAt === 'function') ? md.codeAt(value, p) : null;
  }

  function allCodeRanges(value) {
    return (md && typeof md.codeRanges === 'function') ? md.codeRanges(value) : [];
  }

  /* 에디터의 "펜스 안"(§6-2 — 한 문장): 걸친 줄 [ls, le)에 대해 r = codeAt(value, ls)가 있고 (le < r.bodyEnd 또는 닫히지 않은 블록)이면 안.
     곧 걸친 줄 전부가 "한" 블록의 코드 줄이다. 여는·닫는 펜스 줄 자체는 codeAt이 null이라 밖이다.
     닫히지 않은 블록(close === bodyEnd)은 목록·인용이 끝나 닫힌 블록도 같은 모양이라 le ≤ bodyEnd까지만 안으로 친다 —
     진짜로 닫히지 않은 블록은 bodyEnd가 문서 끝이라 결과가 같고, 컨테이너가 닫은 블록은 그 뒤 줄까지 코드로 번지지 않는다. 돌려주는 값은 range 또는 null. */
  function codeLinesRange(value, ls, le) {
    var r = codeRangeAt(value, ls);
    if (!r) return null;
    if (le < r.bodyEnd || (r.close === r.bodyEnd && le <= r.bodyEnd)) return r;
    return null;
  }

  /* 선택(a, b — 없으면 커서 줄)이 걸친 줄이 전부 한 블록의 코드 줄이면 그 range. 짝·쌍 지우기·툴바 코드 블록이 쓴다.
     (v4.2의 지역 codeAt(a, b)는 Blog.markdown.codeAt과 이름이 겹쳐 inCode로 바꿨다 — 계약 §12-19 #169.) */
  function inCode(a, b) {
    var value = dom.body.value;
    var span = lineSpan(value, a, b);
    return codeLinesRange(value, span.start, span.end);
  }

  /* ls가 codeRanges의 어느 블록을 "여는" 줄의 시작인가(언어 기억 ②의 "여는 줄"). */
  function opensCodeAt(value, ls) {
    var ranges = allCodeRanges(value);
    for (var k = 0; k < ranges.length; k += 1) {
      if (ranges[k].open === ls) return true;
      if (ranges[k].open > ls) break;
    }
    return false;
  }

  /* 선택(없으면 커서 줄)이 걸친 줄 가운데 펜스 줄(여는 줄 · 닫는 줄)이 있는가 — 툴바 코드 블록의 가드(§6-2 툴바 코드 블록 행 ①).
     span은 줄 단위라, 펜스 줄의 시작이 [span.start, span.end] 안에 있으면 그 줄을 걸친 것이다. 닫는 줄은 닫힌 블록(close > bodyEnd)에만 있다. */
  function fenceLineIn(value, a, b) {
    var span = lineSpan(value, a, b);
    var ranges = allCodeRanges(value);
    for (var k = 0; k < ranges.length; k += 1) {
      var r = ranges[k];
      if (r.open > span.end) break;
      if (r.open >= span.start) return true;
      if (r.close > r.bodyEnd && r.bodyEnd >= span.start && r.bodyEnd <= span.end) return true;
    }
    return false;
  }

  function maybeFence(e) {
    if (fencing) return false;
    if (e && e.isComposing) return false;
    var pos = dom.body.selectionStart;
    if (pos !== dom.body.selectionEnd || pos < 3) return false;
    var value = dom.body.value;
    if (!isFenceTrigger(e, value, pos)) return false;

    var lineEnd = pos - 1;                                   // 확정 글자(Enter/Space)의 위치
    var lineStart = lineStartAt(value, lineEnd);
    var m = FENCE_TRIGGER_RE.exec(value.slice(lineStart, lineEnd));
    if (!m) return false;
    if (codeRangeAt(value, lineStart)) return false;         // v4.3: 그 줄이 코드 줄이면 코드 안의 주석이다

    var lang = m[1] || '';
    var open = '```' + lang + '\n';
    var text = open + '\n```\n';                             // 세 줄 + 다음 줄 내용과 떨어뜨리는 개행
    var caret = lineStart + open.length;
    var typed = value.slice(lineStart, pos);

    /* 바꾸는 일은 이 input 이벤트가 끝난 "다음 태스크"에서 한다. 편집 명령이 진행 중인 동안(예: 브라우저가
       Enter를 넣는 중, 붙여넣기·execCommand가 일으킨 input) 중첩 execCommand는 거부되고 폴백(setRangeText)으로
       떨어져 되돌리기 스택이 비는 것을 2026-09-21 헤드리스에서 실측했다. 한 태스크 뒤에는 방금 친 Enter와 펜스 치환이
       각각 한 단계라 Ctrl+Z 한 번에 `//java` 줄로 돌아온다. 그 사이 값이 바뀌었으면(빠른 연타·IME) 손대지 않는다. */
    window.setTimeout(function () {
      if (fencing) return;
      if (dom.body.value.slice(lineStart, pos) !== typed) return;
      if (dom.body.selectionStart !== pos || dom.body.selectionEnd !== pos) return;
      fencing = true;
      try {
        replaceRange(lineStart, pos, text, caret, caret);
      } finally {
        fencing = false;
      }
      /* v4.2: `//언어`는 "이 언어를 쓰겠다"는 가장 분명한 신호다 — 툴바 "코드 블록"이 다음부터 이 언어로 연다. 언어 없는 `//`는 기억을 바꾸지 않는다. */
      if (lang) rememberCodeLang(lang);
    }, 0);
    return true;
  }

  function onBodyInput(e) {
    if (fencing) return;                                     // execCommand가 일으킨 중첩 input
    clearFieldError(dom.body, dom.bodyErr);                  // v4.1: 한 글자 치면 "본문이 비어 있어요"가 사라진다
    maybeFence(e);                                           // 판정만 — 치환은 다음 태스크(위 주석)
    learnFenceLang();                                        // v4.2: 펜스 여는 줄에 친 언어를 기억(툴바 "코드 블록"의 다음 기본값)
    onEdit();
    renderPreview();
  }

  /* ---------- 키보드 ----------

     Tab을 조건 없이 가로채면 본문이 키보드 덫이 된다(WCAG 2.1.2 Level A · T3-1).
     실제로 본문에 들어온 키보드 사용자는 저장 버튼조차 누를 수 없었고,
     DOM상 본문 뒤에 있는 미리보기 안의 복사 버튼·표 스크롤 영역에도 닿을 수 없었다.
     그렇다고 Tab을 포기하면 코드·목록 들여쓰기를 쓸 수 없다.

     그래서 CodeMirror·Monaco가 쓰는 관행을 따른다.
       Tab            → 들여쓰기(기본)
       Esc 다음 Tab   → 포커스 이동(한 번만. 쓰고 나면 곧바로 들여쓰기로 돌아온다)
     탈출 방법을 모르면 없는 기능이므로 placeholder·숨은 설명·상태줄 세 곳에서 알린다. */

  var tabEscape = false;     // 다음 Tab을 포커스 이동으로 흘려보낼지
  var tabTaught = false;     // "Tab은 들여쓰기" 안내를 이미 한 번 띄웠는지
  var hintText = null;       // 지금 상태줄에 띄워 둔 안내 문구
  var statusBefore = null;   // 그 안내를 띄우기 전의 문구

  /* #editorStatus는 눈에 보이는 유일한 상태줄이자 live 영역(role="status")이다 — v4.1부터 작업 줄에 있어 쓰는 자리에서 보인다.
     여기에 잠깐 안내를 띄우고, 그 사이 자동저장이 더 새로운 소식을 써넣었으면 되돌리지 않는다.
     비교는 본문 문장(statusText)으로 한다 — 보류 안내(#147)가 붙어 있어도 textContent와 달라지지 않게. */
  function hintStatus(text) {
    if (!dom.status) return;
    if (hintText === null) statusBefore = statusText;
    hintText = text;
    setStatus(text);
  }

  function restoreStatus() {
    if (hintText === null) return;
    var shown = hintText;
    var was = statusBefore;
    hintText = null;
    statusBefore = null;
    if (was && dom.status && statusText === shown) setStatus(was);
  }

  function setTabEscape(on) {
    if (on === tabEscape) return;
    tabEscape = on;
    if (on) hintStatus('탈출 대기: 다음 Tab은 들여쓰기 대신 다음 항목으로 이동합니다');
    else restoreStatus();
  }

  /* 덫에 걸린 사람은 "Esc를 누르라"는 말을 어디선가 한 번은 봐야 한다.
     placeholder는 글을 쓰기 시작하면 사라지므로, 첫 Tab 때 상태줄로도 알린다. */
  function teachTab() {
    if (tabTaught) return;
    tabTaught = true;
    hintStatus('Tab은 들여쓰기입니다. 포커스를 옮기려면 Esc를 누른 뒤 Tab');
  }

  /* ---------- Enter · 닫는 괄호 (v3.9, 계약서 §6-2 "Enter 규칙 표" ①~⑤) ----------
     기준은 VS Code의 언어 무관 기본 동작(autoIndent: full). 언어별 규칙(`:` 뒤 +1단 등)은 넣지 않는다.
     자동 닫기 괄호는 v4.2부터 **펜스 안에서만** 한다(아래 "코드 블록 안의 짝") — 펜스 밖은 마크다운의 [텍스트](url)과 충돌해 그대로 안 한다.
     실행 경로는 replaceRange(execCommand) — Enter 한 번 = undo 한 단계(setRangeText는 undo 스택을 비운다, 라운드 6 실측).
     keydown 안에서 preventDefault 뒤 곧바로 실행한다(진행 중인 편집 명령이 없으므로 `//` 규칙처럼 미룰 필요가 없다).

     `//` 규칙과의 배타 — `//java` 줄은 목록 줄이 아니고 펜스 밖이라 여기서 손대지 않는다 → 기본 Enter → input → maybeFence().
     반대로 ④가 넣은 '\n- '는 input의 inputType이 insertText이고 e.data가 공백·개행 하나가 아니라 isFenceTrigger가 거짓이다. */

  var OPEN_PAIRS = { '{': '}', '(': ')', '[': ']' };
  var CLOSE_KEYS = ['}', ')', ']'];
  /* ④ — 접두사 = 표시자 + 공백 한 칸. `- [ ] ` 체크박스·`1)` 변형은 이번엔 다루지 않는다. */
  var LIST_LINE_RE = /^([ \t]*)([-*+] |\d+\. |> )(.*)$/;

  /* 현재 줄의 before(줄 시작~커서)·after(커서~줄 끝)와 펜스 안 여부. 규칙 표의 정의 그대로.
     v4.3: "펜스 안" = 커서 줄이 codeRanges의 코드 줄(§6-2 Enter 공통 전제). ④(목록 이어쓰기)는 펜스 밖이 조건이라
     코드 안의 `- `·`> `로 시작하는 줄에 더는 붙지 않는다(v4.2 결함). */
  function lineAtCaret(pos) {
    var value = dom.body.value;
    var lineStart = lineStartAt(value, pos);
    var lineEnd = value.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = value.length;
    return {
      start: lineStart,
      before: value.slice(lineStart, pos),
      after: value.slice(pos, lineEnd),
      fenced: Boolean(codeLinesRange(value, lineStart, lineEnd))
    };
  }

  /* Enter — 보조키 없음·선택 없음·조합 아님은 호출부(onBodyKeydown)가 이미 걸렀다. 처리했으면 true. */
  function onBodyEnter(e) {
    var pos = dom.body.selectionStart;
    var line = lineAtCaret(pos);
    var text, caret;

    if (line.fenced) {
      /* ③ → ② → ①의 순서로 검사 — 세 규칙은 하나의 분기 트리다(③은 ②를, ②는 ①을 포함한다). */
      var indent = /^[ \t]*/.exec(line.before)[0];
      var trimmed = line.before.replace(/[ \t]+$/, '');
      var close = OPEN_PAIRS[trimmed.charAt(trimmed.length - 1)];
      if (close && line.after.charAt(0) === close) {
        /* ③ 괄호 사이 — 닫는 괄호는 after에 그대로 남아 셋째 줄의 indent 뒤에 온다. 커서는 가운데 줄 끝. */
        text = '\n' + indent + '  ' + '\n' + indent;
        caret = pos + 1 + indent.length + 2;
      } else if (close) {
        /* ② 여는 괄호 뒤 +2 — 언제나 공백 2칸(Tab 키와 같은 값). */
        text = '\n' + indent + '  ';
        caret = pos + text.length;
      } else {
        /* ① 들여쓰기 유지 — 공백·탭을 그대로 복사한다(붙여 넣은 탭 코드도 줄이 맞는다). */
        text = '\n' + indent;
        caret = pos + text.length;
      }
      e.preventDefault();
      replaceRange(pos, pos, text, caret, caret);
      return true;
    }

    /* ④ 목록·인용 이어쓰기 — 펜스 밖. */
    var m = LIST_LINE_RE.exec(line.before);
    if (!m) return false;
    e.preventDefault();
    if (m[3] === '') {
      /* 항목이 비어 있으면(접두사뿐인 줄) 접두사를 지우고 그 줄을 빈 줄로 만든다 — 줄바꿈은 넣지 않는다(목록 끝내기). */
      caret = line.start + m[1].length;
      replaceRange(line.start, pos, m[1], caret, caret);
      return true;
    }
    var prefix = m[2];
    var num = /^(\d+)\. $/.exec(prefix);
    if (num) prefix = (parseInt(num[1], 10) + 1) + '. ';      // 순서 목록은 숫자 +1
    text = '\n' + m[1] + prefix;
    caret = pos + text.length;
    replaceRange(pos, pos, text, caret, caret);
    return true;
  }

  /* ⑤ 닫는 괄호 내어쓰기 — 펜스 안, before가 공백뿐이고 길이 ≥ 2면 끝 2글자를 떼고 괄호를 넣는다.
     탭 하나도 "2칸"으로 세지 않는다 — 탭+공백 혼용은 다루지 않는다. 처리했으면 true. */
  function onBodyCloseBracket(e) {
    var pos = dom.body.selectionStart;
    var line = lineAtCaret(pos);
    if (!line.fenced) return false;
    if (!/^[ \t]*$/.test(line.before) || line.before.length < 2) return false;
    e.preventDefault();
    var next = line.before.slice(0, -2) + e.key;
    var caret = line.start + next.length;
    replaceRange(line.start, pos, next, caret, caret);
    return true;
  }

  /* ---------- 줄 범위 (v4.2 — 주석 토글 · 줄 복제 · 줄 이동 · Tab 줄 들여쓰기가 함께 쓴다) ----------
     선택이 걸친 줄들의 [첫 줄 시작, 끝 줄 끝) — 끝 줄의 줄바꿈은 빼고. 선택이 다음 줄 0열에서 끝나면(Shift+↓로 줄을 고른 흔한 모양)
     그 줄은 "걸친" 줄이 아니다 — IDE 관행 그대로 뺀다. 선택이 없으면 커서가 있는 줄 하나. */
  function lineSpan(value, a, b) {
    var start = lineStartAt(value, a);
    var last = (b > a && value.charAt(b - 1) === '\n') ? b - 1 : b;
    var end = value.indexOf('\n', last);
    if (end === -1) end = value.length;
    return { start: start, end: end };
  }

  /* (v4.2의 codeLines · 지역 codeAt(a, b) — "위쪽 펜스 줄 수가 홀수"의 사본 — 은 v4.3 #169에서 삭제. 위 "코드 블록 안" 절의
     codeLinesRange · inCode · fenceLineIn이 Blog.markdown.codeRanges로 같은 질문에 답한다.) */

  /* ---------- 코드 블록 안의 짝 (v4.2, 계약서 §6-2 — 사용자 원문 "코드 블록 부분 괄호 쓰면 IDE 처럼 괄호 닫히는거 까지 같이 보여줘") ----------
     펜스 안에서만. 펜스 밖은 v3.9 그대로 아무것도 하지 않는다 — 마크다운의 [텍스트](url)·(괄호 속 문장)과 충돌한다.
       자동 닫기  ( [ { " ' `  → 짝을 함께 넣고 커서는 사이. 선택이 있으면 감싸고 선택은 안쪽 그대로.
                  선택이 없을 때는 다음 글자가 끝·공백·) ] } ; , . 일 때만(글자 앞에서 여는 괄호를 치면 대개 그 글자를 감쌀 생각이다).
                  따옴표는 앞 글자가 단어 글자(문자·숫자·_)이거나 같은 따옴표면 짝을 넣지 않는다(don't · 이미 연 따옴표 뒤).
       건너뛰기   ) ] } " ' `  → 커서 바로 뒤가 같은 글자면 넣지 않고 커서만 한 칸.
                  textarea는 "내가 넣은 짝"을 추적할 수 없어 IDE처럼 자동 삽입분만 가리지 않는다 — 바로 뒤가 같은 글자면 언제나 건너뛴다.
       쌍 지우기  (|) [|] {|} "|" '|' `|` 에서 Backspace → 둘 다.
     전부 replaceRange(execCommand) 한 번 — Ctrl+Z 한 번에 한 동작이 돌아간다. 건너뛰기는 글을 바꾸지 않으므로 되돌릴 것도 없다.
     백틱 셋으로 펜스를 닫을 때: ` → `|` → (건너뛰기) ``| → (앞 글자가 백틱이라 짝 없음) ```| — 그대로 닫힌다. */

  var AUTO_PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
  var PAIR_OPEN_KEYS = '([{"\'`';
  var OVERTYPE_KEYS = ')]}"\'`';
  var QUOTE_KEYS = '"\'`';
  var PAIR_NEXT_OK = ')]};,.';
  /* 단어 글자 = 유니코드 문자·숫자·밑줄. \p{…}를 모르는 옛 엔진에서는 정규식 리터럴이 파일째 문법 오류가 되므로 생성자로 만들고 실패하면 근사치. */
  var WORD_CHAR_RE = (function () {
    try { return new RegExp('[\\p{L}\\p{N}_]', 'u'); } catch (err) {
      return /[A-Za-z0-9_À-ɏͰ-ϿЀ-ӿ぀-ヿ㄰-㆏一-鿿가-힣]/;
    }
  })();

  /* 여는 글자·닫는 글자 키. 처리했으면 true(preventDefault 포함). 아니면 false — 호출부가 다음 규칙(⑤)이나 기본 동작으로 흘려보낸다. */
  function onPairKey(e) {
    var key = e.key;
    var a = dom.body.selectionStart;
    var b = dom.body.selectionEnd;
    var value = dom.body.value;
    if (!inCode(a, b)) return false;

    if (a !== b) {
      /* 선택 감싸기 — 여는 글자만. 닫는 글자(`)` 등)는 기본 동작(선택을 그 글자로 바꾼다)이다. */
      if (PAIR_OPEN_KEYS.indexOf(key) === -1) return false;
      e.preventDefault();
      replaceRange(a, b, key + value.slice(a, b) + AUTO_PAIRS[key], a + 1, b + 1);
      return true;
    }

    /* 건너뛰기가 먼저다 — 따옴표는 여는 글자이자 닫는 글자라, "|" 에서 " 는 짝을 더 넣지 않고 넘어가야 한다. */
    if (OVERTYPE_KEYS.indexOf(key) !== -1 && value.charAt(a) === key) {
      e.preventDefault();
      setSelection(a + 1, a + 1);
      return true;
    }

    if (PAIR_OPEN_KEYS.indexOf(key) === -1) return false;
    var next = value.charAt(a);
    if (next !== '' && !/\s/.test(next) && PAIR_NEXT_OK.indexOf(next) === -1) return false;
    if (QUOTE_KEYS.indexOf(key) !== -1) {
      var prev = value.charAt(a - 1);
      if (prev === key || (prev !== '' && WORD_CHAR_RE.test(prev))) return false;
    }
    e.preventDefault();
    replaceRange(a, a, key + AUTO_PAIRS[key], a + 1, a + 1);
    return true;
  }

  /* 빈 쌍 사이의 Backspace → 둘 다 지운다. 선택 없음·보조키 없음은 호출부가 걸렀다. */
  function onPairBackspace(e) {
    var pos = dom.body.selectionStart;
    if (pos < 1) return false;
    var value = dom.body.value;
    var open = value.charAt(pos - 1);
    if (PAIR_OPEN_KEYS.indexOf(open) === -1 || value.charAt(pos) !== AUTO_PAIRS[open]) return false;
    if (!inCode(pos, pos)) return false;
    e.preventDefault();
    replaceRange(pos - 1, pos + 1, '', pos - 1, pos - 1);
    return true;
  }

  /* ---------- 줄 편집 도구 (v4.2 — 주석 토글이 쓴다 · v4.3: 선택 있는 Tab/Shift+Tab도) ----------
     선택은 §6-2 "편집 뒤 선택" 규칙으로 옮긴다: p < at 그대로 · p ≥ at + del이면 ins − del만큼(삽입 자리와 같은 p는 삽입 글자 뒤로) ·
     지워진 글자 안이면 그 편집 바로 뒤. 한 줄의 편집이 여럿이면 앞의 것부터 누적(mapCol).
     edits[i] = i번째 줄에 할 편집 목록 [{ at: 열, del: 지울 글자 수, ins: 넣을 글 }] (열 오름차순, 겹치지 않음).
     새 텍스트를 만들고, 옛 커서·선택 위치를 새 위치로 옮겨 replaceRange 한 번으로 바꾼다(= undo 한 단계). */
  function mapCol(col, list) {
    var shift = 0;
    for (var i = 0; i < list.length; i += 1) {
      var ed = list[i];
      if (col < ed.at) break;
      if (col >= ed.at + ed.del) { shift += ed.ins.length - ed.del; continue; }
      return ed.at + shift + ed.ins.length;            // 지워진 글자 안에 있던 위치 → 그 편집 바로 뒤
    }
    return col + shift;
  }

  function applyLineEdits(span, lines, edits, a, b) {
    var oldStarts = [];
    var newStarts = [];
    var at = span.start;
    var nat = span.start;
    var out = lines.map(function (line, i) {
      var res = '';
      var last = 0;
      (edits[i] || []).forEach(function (ed) {
        res += line.slice(last, ed.at) + ed.ins;
        last = ed.at + ed.del;
      });
      res += line.slice(last);
      oldStarts.push(at);
      newStarts.push(nat);
      at += line.length + 1;
      nat += res.length + 1;
      return res;
    });
    var text = out.join('\n');
    if (text === lines.join('\n')) return;             // 바뀐 게 없으면 되돌리기 단계·dirty를 만들지 않는다
    var grow = text.length - (span.end - span.start);
    function map(p) {
      if (p < span.start) return p;
      if (p > span.end) return p + grow;
      for (var i = lines.length - 1; i >= 0; i -= 1) {
        if (p >= oldStarts[i]) return newStarts[i] + mapCol(p - oldStarts[i], edits[i] || []);
      }
      return p;
    }
    replaceRange(span.start, span.end, text, map(a), map(b));
  }

  /* ---------- 주석 토글 Ctrl/Cmd+/ (v4.2, 펜스 안 · v4.3 표 확장) ----------
     접두는 그 코드 블록을 연 펜스 줄의 언어를 소문자로 바꿔 아래 표에서 찾는다(```Java도 java로 — D18). 표는 계약서 §6-2 "주석 토글".
       //         java js javascript ts typescript c cpp cs csharp kotlin kt go rust swift scss dart php jsx tsx groovy gradle scala less
       #          python py bash sh shell yaml yml ruby rb r toml dockerfile powershell ps1 ps perl pl makefile make properties conf nginx gitignore zsh
       --         sql lua haskell hs
       ;          ini
       REM        bat cmd batch dos (:: 가 아닌 이유 — 괄호 블록 안의 :: 는 cmd가 잘못 읽는다)
       %          tex latex matlab
       <!-- -->   html xml md markdown svg vue (감싸기)
       슬래시별   css (감싸기 — 슬래시별로 열고 별슬래시로 닫는다. 이 주석 안에는 그 닫는 표시를 쓸 수 없어 말로 적는다)
     v4.3(D20): 표에 없는 언어 · 언어 없는 블록 · 주석 문법이 없는 언어(json text …)는 글을 바꾸지 않고 키만 먹고 토스트로 이유를 말한다.
     v4.2의 "모르면 //"는 PowerShell 블록에 `// Get-Item`을 조용히 썼다 — 틀린 주석은 코드를 깨고 눈에 잘 띄지 않는다.
     줄 접두: 비지 않은 줄들의 최소 들여쓰기 뒤에 "표시 "를 넣는다. 비지 않은 줄이 전부 이미 주석이면 푼다(접두 + 뒤 공백 하나). 빈 줄은 건드리지 않는다.
     감싸기: 첫 비지 않은 줄의 들여쓰기 뒤에 "<!-- ", 마지막 비지 않은 줄 끝에 " -->". 이미 그렇게 감싸여 있으면 푼다.
     빈 줄 하나에서 누르면 주석 표시만 넣고 커서를 그 안에 둔다. */
  var COMMENT_STYLES = (function () {
    var table = Object.create(null);
    function lines(mark, langs) { langs.forEach(function (l) { table[l] = { line: mark }; }); }
    function wraps(open, close, langs) { langs.forEach(function (l) { table[l] = { open: open, close: close }; }); }
    lines('//', ['java', 'js', 'javascript', 'ts', 'typescript', 'c', 'cpp', 'cs', 'csharp', 'kotlin', 'kt', 'go', 'rust',
      'swift', 'scss', 'dart', 'php', 'jsx', 'tsx', 'groovy', 'gradle', 'scala', 'less']);
    lines('#', ['python', 'py', 'bash', 'sh', 'shell', 'yaml', 'yml', 'ruby', 'rb', 'r', 'toml', 'dockerfile',
      'powershell', 'ps1', 'ps', 'perl', 'pl', 'makefile', 'make', 'properties', 'conf', 'nginx', 'gitignore', 'zsh']);
    lines('--', ['sql', 'lua', 'haskell', 'hs']);
    lines(';', ['ini']);
    lines('REM', ['bat', 'cmd', 'batch', 'dos']);
    lines('%', ['tex', 'latex', 'matlab']);
    wraps('<!--', '-->', ['html', 'xml', 'md', 'markdown', 'svg', 'vue']);
    wraps('/*', '*/', ['css']);
    return table;
  })();

  /* 표에 없으면 null(= 무동작). 표는 프로토타입 없는 객체지만 hasOwnProperty로 한 번 더 막는다 — 언어가 "constructor" 같은
     이름이면 기본 객체의 것을 집는다(markdown.js LANG_LABEL에서 실제로 났던 결함). */
  function commentStyle(lang) {
    var key = String(lang || '').toLowerCase();
    return (key && Object.prototype.hasOwnProperty.call(COMMENT_STYLES, key)) ? COMMENT_STYLES[key] : null;
  }

  /* (v4.2 fenceLangAbove — 위쪽 펜스 줄을 다시 훑던 사본 — 는 v4.3 #169에서 삭제. 언어는 그 블록의 range.lang이다:
     정보 문자열의 첫 낱말, 친 그대로(`Java`). 토스트는 이 표기를 그대로 말하고, 비교는 commentStyle이 소문자로 한다.) */

  /* 무동작 토스트(기본 종류). `<lang>은`의 조사는 받침과 무관하게 `은`으로 고정한다(계약 — 영문 표기라 받침 판정이 흔들린다). */
  function commentUnknownText(lang) {
    return lang ? lang + '은 주석 표시를 몰라 넣지 않았어요' : '언어가 없는 코드 블록이라 주석 표시를 정할 수 없어요';
  }

  /* 줄이 들여쓰기 뒤에 이 표시로 "시작"하는가. 글자로 끝나는 표시(REM)는 낱말 경계까지 본다 — `REMOTE=1`은 주석이 아니다. */
  function startsWithMark(line, at, mark) {
    if (line.slice(at, at + mark.length) !== mark) return false;
    if (!/[A-Za-z]$/.test(mark)) return true;
    var after = line.charAt(at + mark.length);
    return after === '' || after === ' ' || after === '\t';
  }

  function indentLen(line) { return /^[ \t]*/.exec(line)[0].length; }
  function isBlankLine(line) { return !/\S/.test(line); }

  function lineCommentEdits(lines, mark) {
    var filled = lines.filter(function (l) { return !isBlankLine(l); });
    var min = Math.min.apply(null, filled.map(indentLen));
    var undo = filled.every(function (l) { return startsWithMark(l, indentLen(l), mark); });
    return lines.map(function (l) {
      if (isBlankLine(l)) return [];
      if (!undo) return [{ at: min, del: 0, ins: mark + ' ' }];
      var i = indentLen(l);
      return [{ at: i, del: mark.length + (l.charAt(i + mark.length) === ' ' ? 1 : 0), ins: '' }];
    });
  }

  function wrapCommentEdits(lines, open, close) {
    var first = -1;
    var last = -1;
    lines.forEach(function (l, i) {
      if (isBlankLine(l)) return;
      if (first === -1) first = i;
      last = i;
    });
    var edits = lines.map(function () { return []; });
    var fl = lines[first];
    var ll = lines[last];
    var fi = indentLen(fl);
    var lr = ll.replace(/[ \t]+$/, '').length;          // 마지막 줄의 끝 공백을 뺀 길이
    var wrapped = fl.slice(fi, fi + open.length) === open &&
      lr >= close.length && ll.slice(lr - close.length, lr) === close &&
      (first !== last || lr - close.length >= fi + open.length);
    if (!wrapped) {
      edits[first].push({ at: fi, del: 0, ins: open + ' ' });
      edits[last].push({ at: lr, del: 0, ins: ' ' + close });
      return edits;
    }
    var openDel = open.length + (fl.charAt(fi + open.length) === ' ' ? 1 : 0);
    var closeAt = lr - close.length;
    var floor = first === last ? fi + openDel : 0;       // 한 줄이면 여는 표시를 지운 자리 앞으로 넘어가지 않는다
    if (closeAt - 1 >= floor && ll.charAt(closeAt - 1) === ' ') closeAt -= 1;
    edits[first].push({ at: fi, del: openDel, ins: '' });
    edits[last].push({ at: closeAt, del: lr - closeAt, ins: '' });
    return edits;
  }

  /* 처리했으면 true(= 호출부가 preventDefault). 펜스 밖이면 false — 브라우저 기본으로 흘려보낸다.
     표에 없는 언어·언어 없는 블록도 true다(키는 먹는다 — 브라우저 기본 Ctrl+/로 새지 않게). 글은 그대로, 토스트가 이유를 말한다. */
  function toggleComment() {
    var value = dom.body.value;
    var a = dom.body.selectionStart;
    var b = dom.body.selectionEnd;
    var span = lineSpan(value, a, b);
    var range = codeLinesRange(value, span.start, span.end);
    if (!range) return false;
    var lang = range.lang || '';
    var style = commentStyle(lang);
    if (!style) { U.toast(commentUnknownText(lang)); return true; }
    var lines = value.slice(span.start, span.end).split('\n');

    if (lines.every(isBlankLine)) {
      if (lines.length !== 1) return true;               // 빈 줄 여럿 — 할 일이 없다(키는 먹는다)
      var at = span.end;
      var ins = style.line ? style.line + ' ' : style.open + '  ' + style.close;
      var caret = at + (style.line ? ins.length : style.open.length + 1);
      replaceRange(at, at, ins, caret, caret);
      return true;
    }
    var edits = style.line ? lineCommentEdits(lines, style.line) : wrapCommentEdits(lines, style.open, style.close);
    applyLineEdits(span, lines, edits, a, b);
    return true;
  }

  /* ---------- 줄 복제 Ctrl/Cmd+D · 줄 이동 Alt+Shift+↑/↓ (v4.2, 본문 어디서나) ---------- */

  /* 걸친 줄들을 바로 아래에 복제하고 커서·선택도 복제본으로 옮긴다. */
  function duplicateLines() {
    var value = dom.body.value;
    var a = dom.body.selectionStart;
    var b = dom.body.selectionEnd;
    var span = lineSpan(value, a, b);
    var block = value.slice(span.start, span.end);
    var shift = block.length + 1;
    replaceRange(span.end, span.end, '\n' + block, a + shift, b + shift);
  }

  /* 걸친 줄들을 위(-1)·아래(+1) 줄과 맞바꾼다. 선택은 줄과 함께 움직인다. 문서 끝에 닿았으면 아무것도 하지 않는다. */
  function moveLines(dir) {
    var value = dom.body.value;
    var a = dom.body.selectionStart;
    var b = dom.body.selectionEnd;
    var span = lineSpan(value, a, b);
    var block = value.slice(span.start, span.end);
    if (dir < 0) {
      if (span.start === 0) return;
      var ps = lineStartAt(value, span.start - 1);        // 위 줄의 시작(span.start − 1은 위 줄 끝의 줄바꿈)
      var prev = value.slice(ps, span.start - 1);
      var up = prev.length + 1;
      replaceRange(ps, span.end, block + '\n' + prev, a - up, b - up);
      return;
    }
    if (span.end >= value.length) return;
    var ne = value.indexOf('\n', span.end + 1);
    if (ne === -1) ne = value.length;
    var next = value.slice(span.end + 1, ne);
    var down = next.length + 1;
    replaceRange(span.start, ne, next + '\n' + block, Math.min(a + down, value.length), Math.min(b + down, value.length));
  }

  /* Ctrl/Cmd 조합의 글자 판정. 한글 자판이 켜져 있으면 브라우저에 따라 e.key가 'ㅇ'처럼 올 수 있어 물리 키(e.code)로 한 번 더 본다.
     e.key가 라틴 글자 하나면 그것만 믿는다 — 드보락 같은 배열에서 e.code는 다른 글자다.
     v4.3(D21): 라틴 글자가 아닌 값 전부(한글 낱자 · IME가 준 'Process' · 'Unidentified')가 물리 키 판정으로 간다 — v4.2는 한 글자만
     봐서 'Process'로 온 Ctrl+S가 브라우저 "페이지 저장"으로 샜다. 문서 Ctrl+S도 이 함수를 쓴다(§6-2 Ctrl+S 행). */
  function keyIs(e, ch) {
    var k = String(e.key || '');
    if (/^[A-Za-z]$/.test(k)) return k.toLowerCase() === ch;
    return e.code === 'Key' + ch.toUpperCase();
  }

  function onBodyKeydown(e) {
    /* 한글 조합 중에는 키를 가로채지 않는다.
       조합이 끝나기 전의 Tab/Ctrl+B는 IME가 "조합 확정"으로 쓰는 키일 수 있어서,
       여기서 preventDefault하면 조합 중이던 글자가 통째로 깨지거나 중복 입력된다. */
    if (e.isComposing || e.keyCode === 229) return;

    /* C2: 잠긴 동안에는 아무 키도 가로채지 않는다 — Tab은 브라우저 기본(포커스 이동)으로 흘러간다. */
    if (state.locked || dom.body.readOnly) return;

    /* Esc = "다음 Tab은 나가겠다". 기본 동작은 막지 않는다(IME 조합 취소 등을 빼앗지 않기 위해).
       v4.0(meeting-07 m8): 이 리스너는 textarea(#fBody)에만 붙어 있어 본문에 포커스가 있을 때만 돈다. 그래도 사이드바가
       오버레이로 떠 있으면 Esc는 그쪽 몫이다(ui.js가 닫는다) — 같은 키 한 번에 "사이드바 닫힘"과 "탈출 대기"가 함께 일어나지 않게 비켜선다. */
    if (e.key === 'Escape') {
      if (Blog.ui && typeof Blog.ui.isSideOverlay === 'function' && Blog.ui.isSideOverlay()) return;
      setTabEscape(true);
      return;
    }

    /* Tab이 포커스를 옮겨 버리면 코드 들여쓰기를 쓸 수 없다. textarea 안에서만 가로챈다.
       단, 탈출 대기 상태라면 가로채지 않고 그대로 흘려보낸다(= 브라우저가 포커스를 옮긴다). */
    if (e.key === 'Tab') {
      /* v4.2: Ctrl·Alt·Cmd가 붙은 Tab은 브라우저·OS 몫이다(탭 전환 등) — 보조키가 맞지 않으면 건드리지 않는다. */
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (tabEscape) { setTabEscape(false); return; }
      e.preventDefault();
      var start = dom.body.selectionStart;
      var end = dom.body.selectionEnd;
      var value = dom.body.value;

      /* v3.9 #108: "선택이 있는가"로 가른다. v3.8까지는 "선택에 줄바꿈이 없으면" 선택을 통째로 공백 2칸으로 치환해서
         한 줄 안에서 단어를 고른 뒤 Tab을 치면 단어가 사라졌다. 선택이 있으면 길이와 무관하게 줄 들여쓰기다. */
      if (start === end && !e.shiftKey) {
        replaceRange(start, end, '  ');
        /* 안내는 들여쓰기를 넣은 "뒤"에 띄운다. 먼저 띄우면 replaceRange가 부르는
           onEdit()의 "저장 중…"이 곧바로 덮어써서 아무도 보지 못한다. */
        teachTab();
        return;
      }
      /* v4.2: 선택 없는 Shift+Tab — 현재 줄 첫머리의 공백(최대 2칸)만 지우고 커서는 같은 글자 앞에 남긴다.
         v4.1까지는 아래 여러 줄 갈래를 타서 줄 전체가 선택된 채 끝났다 — 이어서 글자를 치면 그 줄이 통째로 사라졌다. */
      if (start === end) {
        var ls0 = lineStartAt(value, start);
        var lead = /^ {1,2}/.exec(value.slice(ls0, ls0 + 2));
        if (lead) {
          var col = start - ls0;
          var caretAt = ls0 + Math.max(0, col - lead[0].length);
          replaceRange(ls0, ls0 + lead[0].length, '', caretAt, caretAt);
        }
        teachTab();
        return;
      }
      /* 선택이 걸친 줄마다(lineSpan — 다음 줄 0열에서 끝난 선택은 그 줄을 빼는 IDE 관행) 첫머리에 2칸 넣기 / 최대 2칸 빼기.
         v4.3(D19, §6-2 "편집 뒤 선택"): 선택은 원래 선택의 두 끝을 편집에 따라 옮긴 것이다 — 넓히지도 줄 전체로 바꾸지도 않는다
         (applyLineEdits의 map. `bar`만 골라 Tab이면 `bar`가 선택된 채 남는다). v4.2까지는 줄 전체가 선택돼, 이어서 한 글자를 치면
         줄이 통째로 사라졌다. 바뀌는 글자가 없으면 applyLineEdits가 글도 선택도 건드리지 않는다. */
      var span = lineSpan(value, start, end);
      var lines = value.slice(span.start, span.end).split('\n');
      var edits = lines.map(function (line) {
        if (!e.shiftKey) return [{ at: 0, del: 0, ins: '  ' }];
        var cut = /^ {1,2}/.exec(line);
        return cut ? [{ at: 0, del: cut[0].length, ins: '' }] : [];
      });
      applyLineEdits(span, lines, edits, start, end);
      teachTab();
      return;
    }

    /* 탈출 대기 중에 글자를 치면 "계속 쓰겠다"는 뜻이다. 대기를 풀어 Tab을 들여쓰기로 되돌린다.
       (보조키 자체를 누른 것만으로는 풀지 않는다 — Shift+Tab으로 앞으로 나가는 길을 막게 된다.) */
    if (tabEscape && ['Shift', 'Control', 'Alt', 'Meta'].indexOf(e.key) === -1) setTabEscape(false);

    /* v3.9 Enter 규칙(§6-2) — Tab 처리 뒤·탈출 해제 뒤·Ctrl 검사 앞. 발동 조건: 보조키 전부 없음·선택 없음.
       Shift+Enter는 언제나 브라우저 기본(줄바꿈 하나) — 자동 들여쓰기·접두사를 원하지 않을 때의 탈출구.
       여러 줄 선택 상태의 Enter도 기본 동작(선택을 지우고 줄바꿈). */
    var plain = !(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey);
    var collapsed = dom.body.selectionStart === dom.body.selectionEnd;
    if (e.key === 'Enter' && plain && collapsed) { onBodyEnter(e); return; }

    /* v4.2 줄 이동 — Alt+Shift+↑/↓(Ctrl·Cmd 없이). 본문 어디서나. 문서 끝에 닿아도 키는 먹는다(선택 확장으로 새지 않게). */
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      moveLines(e.key === 'ArrowUp' ? -1 : 1);
      return;
    }

    /* 글자 키 — Ctrl·Alt·Meta 없음. `( { "` 같은 글자는 US 자판에서 Shift로 나오므로 Shift는 보지 않는다(e.key가 이미 그 글자다). */
    if (!(e.ctrlKey || e.altKey || e.metaKey)) {
      /* v4.2 쌍 지우기 — 보조키 없는 Backspace, 선택 없음. */
      if (e.key === 'Backspace') {
        if (!e.shiftKey && collapsed) onPairBackspace(e);
        return;
      }
      /* v4.2 짝 넣기·건너뛰기(펜스 안). 처리하지 않았으면 ⑤로 넘어간다 — 닫는 괄호는 건너뛰기가 ⑤보다 먼저다. */
      if (e.key.length === 1 && (PAIR_OPEN_KEYS + OVERTYPE_KEYS).indexOf(e.key) !== -1 && onPairKey(e)) return;
      /* ⑤ 닫는 괄호 내어쓰기 */
      if (CLOSE_KEYS.indexOf(e.key) !== -1 && collapsed) onBodyCloseBracket(e);
      return;
    }

    /* Ctrl/Cmd 조합 — v4.2부터 Ctrl(또는 Cmd) "하나만"이다(Alt·Shift가 붙으면 브라우저 몫: Ctrl+Shift+B 북마크 바 등). */
    if (e.ctrlKey === e.metaKey || e.altKey || e.shiftKey) return;
    if (keyIs(e, 'b')) { e.preventDefault(); TOOLBAR.bold(); }
    else if (keyIs(e, 'i')) { e.preventDefault(); TOOLBAR.italic(); }
    /* v4.2 줄 복제 — 본문 어디서나. 브라우저의 "북마크 추가"를 막는다. */
    else if (keyIs(e, 'd')) { e.preventDefault(); duplicateLines(); }
    /* v4.2 주석 토글 — 펜스 안에서만. 펜스 밖이면 기본 동작 그대로(아무것도 막지 않는다). */
    else if (e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide') { if (toggleComment()) e.preventDefault(); }
  }

  /* ---------- 보기 방식 (v4.1 #141 — 계약서 §6-0 "작업 줄의 JS") ----------
     세 칸 스위치(.view-switch): 작성 / 나란히 / 미리보기. 지금 것이 aria-pressed="true" — v4.0의 순환 버튼은 "다음 상태"를
     이름으로 달아 지금이 무엇인지 말하지 않았고, 원하는 보기까지 한두 번을 더 눌러야 했다.
     360px에서 좌우 분할을 강제하면 둘 다 못 읽는다. 1024px 미만에서 "나란히" 버튼은 CSS가 감추므로, 그 폭에서 split은
     언제나 write로 내린다(시작 때·폭 변화 때, modeTouched와 무관) — 눌린 버튼이 눌린 채 사라지면 안 된다.
     넓어질 때는 손수 고른 보기(viewChoice)가 있으면 그것으로, 없으면 폭에 맞는 기본값(split)으로 돌아온다. */

  var VIEW_MODES = ['write', 'split', 'preview'];
  var viewFocus = '';        // 마지막으로 포커스를 가진 보기 버튼의 data-view. 포커스가 다른 요소로 가면 ''(bind()의 focusin)
  /* CSS가 나란히 보기로 바뀌는 지점이 1024px이다(layout.css §9 · components.css .view-btn). */
  var wideMq = window.matchMedia('(min-width: 1024px)');

  function setViewMode(mode) {
    if (!dom.split) return;
    var want = VIEW_MODES.indexOf(mode) === -1 ? 'write' : mode;
    if (want === 'split' && !wideMq.matches) want = 'write';
    var prev = dom.split.getAttribute('data-mode');
    /* 폭이 좁아져 "나란히" 버튼이 감춰지면 그 버튼에 있던 포커스는 body로 튕긴다 — 새로 눌린 버튼으로 옮긴다.
       브라우저가 감춘 요소의 포커스를 미디어 쿼리 알림보다 먼저 거둘 수 있어(헤드리스 Chrome 실측) "지금 포커스"만 보지 않고
       마지막으로 포커스를 가졌던 보기 버튼(viewFocus — 그 뒤 다른 곳으로 간 적 없음)도 본다. */
    var active = document.activeElement;
    var onSplit = active && dom.viewBtns.indexOf(active) !== -1 && active.getAttribute('data-view') === 'split';
    var bounced = (!active || active === document.body) && viewFocus === 'split';
    var orphan = !wideMq.matches && (onSplit || bounced);
    dom.split.setAttribute('data-mode', want);
    dom.viewBtns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-view') === want ? 'true' : 'false');
      if (orphan && btn.getAttribute('data-view') === want) btn.focus();
    });
    if (prev === want) return;
    /* 미리보기로 넘어가면 debounce를 기다리지 않고 지금 그린다 — 보이는 창이 한 박자 늦게 채워지지 않게. */
    if (want === 'preview' && renderPreview.flush) renderPreview.flush();
    /* 나란히로 돌아오면 미리보기를 본문 스크롤 위치에 맞춘다(창이 display:none에서 막 돌아왔다). */
    if (want === 'split') syncPreviewScroll();
  }

  function autoViewMode() { return wideMq.matches ? 'split' : 'write'; }

  function watchWidth() {
    var onChange = function () {
      /* 좁아졌으면 split → write(무조건). 넓어졌으면 손수 고른 보기로, 고른 적 없으면 기본(split)으로. */
      if (!wideMq.matches) {
        if (dom.split.getAttribute('data-mode') === 'split') setViewMode('write');
        return;
      }
      setViewMode(state.modeTouched && state.viewChoice ? state.viewChoice : autoViewMode());
    };
    if (wideMq.addEventListener) wideMq.addEventListener('change', onChange);
    else if (wideMq.addListener) wideMq.addListener(onChange);
  }

  function onViewClick(e) {
    var btn = e.target.closest ? e.target.closest('.view-btn') : null;
    if (!btn) return;
    var mode = btn.getAttribute('data-view');
    state.modeTouched = true;
    state.viewChoice = mode;
    setViewMode(mode);
  }

  /* ---------- 저장 전 검증 (id 정리 · 제목·분류·본문 · 폴더명 · 게시일) ---------- */

  function normalizeId(raw, title, createdIso) {
    var id = U.slugAscii(raw);
    if (!id) id = buildId(title, createdIso);
    /* 날짜 접두사가 없으면 붙여 준다. 파일 목록이 날짜순으로 정렬돼야 관리가 쉽다. */
    if (!/^\d{4}-\d{2}-\d{2}-/.test(id)) {
      id = String(createdIso || U.nowIsoKst()).slice(0, 10) + '-' + id;
    }
    return id;
  }

  /* v4.1(#142, §6-0 오류 규칙): 오류는 칸 아래 한 줄 + aria-invalid + 포커스. 토스트로 말하지 않는다.
     한 번에 하나 — 첫 실패에서 멈춘다(제목 → 분류 → 본문). 필수 칸이 셋뿐이라 오류 요약(error summary)은 두지 않는다. */
  function validate(form) {
    if (!form.title) {
      showFieldError(dom.title, dom.titleErr, '제목을 입력해 주세요.');
      return false;
    }
    /* M4-4: 분류는 글이 저장될 폴더다. 고르지 않았으면 조용히 첫 분류로 보내지 않고 여기서 멈춘다. */
    if (!form.category) {
      showFieldError(dom.category, dom.categoryErr,
        '분류를 골라 주세요. 글이 저장될 폴더입니다. 없으면 “+ 새 분류”로 만들거나 미분류를 고르세요.');
      return false;
    }
    if (!form.body.trim()) {
      /* 본문 창이 감춰진 보기(미리보기만)에서는 포커스도 오류 줄도 닿지 않는다 — 본문이 보이는 보기로 먼저 연다.
         넓으면 나란히(보던 미리보기를 잃지 않는다), 좁으면 작성. 손수 고른 보기(viewChoice)는 바꾸지 않는다. */
      if (dom.split && dom.split.getAttribute('data-mode') === 'preview') setViewMode(autoViewMode());
      showFieldError(dom.body, dom.bodyErr, '본문이 비어 있어요. 한 줄 이상 써야 저장할 수 있습니다.');
      return false;
    }
    return true;
  }

  /* 폴더명이 될 수 없는 분류로는 저장하지 않는다.
     posts/블로그/ 같은 경로는 만들 수는 있어도 주소가 깨져 읽히고 되돌리기 어렵다. */
  function ensureUsableCategory(onOk) {
    var cat = chosenCategory();
    /* 새로 만들 때보다는 느슨하게 본다. 이미 categories.json에 있는 값(밑줄 포함)까지
       막으면 사용자가 직접 손으로 넣은 분류를 에디터가 거부하게 된다. */
    if (cat === UNCATEGORIZED || findCat(cat) || PATH_SAFE_RE.test(cat)) { onOk(); return; }

    Blog.ui.modal({
      title: '이 분류는 폴더명으로 쓸 수 없어요',
      text: '"' + cat + '" 은(는) 폴더명 규칙(영문 소문자, 숫자, 하이픈)에 맞지 않습니다.\n'
        + '글은 posts/<폴더명>/ 안에 들어가야 해서 이대로는 경로를 만들 수 없어요.\n'
        + '분류를 고르거나 "+ 새 분류"로 만들어 주세요.',
      actions: [
        {
          label: '미분류로 저장', variant: 'ghost', onClick: function () {
            selectCategory(UNCATEGORIZED);
            onEdit();
            onOk();
            return false;
          }
        },
        {
          label: '분류 고르기', variant: 'primary', onClick: function () {
            window.setTimeout(function () { if (dom.category) dom.category.focus(); }, 0);
          }
        }
      ]
    });
  }

  function buildCategoriesJson() {
    var list = sortCats(cats.list.slice());
    /* 파일을 읽는 쪽과 쓰는 쪽의 형식이 어긋나면 안 된다. store가 규격을 가지고 있으면 그걸 쓴다. */
    if (typeof store.buildCategoriesJson === 'function') {
      return store.buildCategoriesJson(null, list);
    }
    var payload = {
      categories: list.map(function (c, i) {
        return {
          slug: c.slug,
          name: c.name,
          description: c.description || '',
          order: (typeof c.order === 'number' && isFinite(c.order)) ? c.order : i
        };
      })
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  /* CLAUDE.md 규약 4: created는 불변이다.
     수정 모드인데 원본 게시일이 비어 있다는 건 "정보가 없다"는 뜻이지 "오늘 쓴 글"이 아니다.
     조용히 오늘 날짜를 찍으면 목록 정렬과 게시일 표시가 통째로 어긋나고,
     .md를 덮어쓴 뒤에는 원래 날짜를 되찾을 방법이 없다. 그래서 반드시 물어본다(M8). */
  function ensureCreated(onOk) {
    if (state.mode !== 'edit' || state.created) { onOk(); return; }

    var now = U.nowIsoKst();
    var confirmed = false;
    /* M4-3: 예전에는 "지금 시각" 버튼이 onOk()를 부르고 return false로 모달을 열어 둔 채
       다음 모달이 대신 닫아 주길 기대했다. 저장 경로에는 다음 모달이 없어
       확인창이 영구히 남고 배경이 inert로 잠겼다. 이제는 모달이 닫힌 뒤(onClose) 이어 간다 —
       표 대화상자와 같은 방식이다.
       onClose는 같은 클릭 흐름 안에서 동기로 불린다. */
    Blog.ui.modal({
      title: '이 글의 원래 게시일 정보가 없습니다',
      bodyNodes: [
        U.el('p', { text: '불러온 글에 created(게시일)가 없습니다. 원본 .md의 frontmatter가 깨졌거나 게시일 없이 만들어진 글입니다.' }),
        U.el('p', { text: '지금 시각(' + U.fmtKo(now) + ')을 게시일로 사용할까요? 한 번 정하면 그 값이 이 글의 게시일이 됩니다.' }),
        U.el('p', { text: '원래 날짜를 알고 있다면, 취소한 뒤 원본 파일의 created 값을 먼저 확인하는 편이 안전합니다.' })
      ],
      actions: [
        { label: '취소', variant: 'ghost' },
        { label: '지금 시각을 게시일로', variant: 'primary', onClick: function () { confirmed = true; } }
      ],
      onClose: function () { if (confirmed) onOk(now); }
    });
  }

  /* PUT에 실을 메타(8개)는 여기 한 곳에서만 만든다 — 조립하는 곳이 둘이면 한쪽만 고쳤을 때
     "화면의 글"과 "저장된 글"이 달라진다. created 규칙(불변)도 여기서 지킨다. */
  function buildMeta(createdOverride) {
    var form = readForm();
    var now = U.nowIsoKst();
    /* 수정 모드에서는 원본 created만 쓴다. 비어 있을 때 쓸 값은
       ensureCreated()가 사용자에게 확인받아 넘겨준 것뿐이다. */
    if (state.mode === 'edit' && !state.created && createdOverride) {
      state.created = createdOverride;    // 같은 세션에서 두 번 묻지 않는다
    }
    var created = state.mode === 'edit' && state.created ? state.created : now;
    var id = normalizeId(form.id, form.title, created);
    if (id !== form.id) {
      dom.id.value = id;
      U.toast('id를 파일명으로 쓸 수 있게 정리했습니다: ' + id, 'warn');
    }

    var meta = {
      id: id,
      title: form.title,
      summary: form.summary,
      created: created,
      /* created는 절대 바뀌지 않고 updated만 갱신된다. 이 규칙이 깨지면 결함이다. */
      updated: now,
      tags: form.tags,
      /* frontmatter의 category는 표시 이름이 아니라 slug(= 폴더명)다. 계약서 §9-3. */
      category: form.category,
      /* color는 보내지 않는다(§9-2 폐기). 기존 파일에 남아 있는 키는 그대로 둬도 무해하다. */
      pinned: form.pinned
    };
    return { form: form, meta: meta };
  }

  /* ---------- 로컬 에디터 서버 (docs/api.md §4, 계약서 §6-1 — v3.9 저장 단일 모드) ----------
     저장은 PM이 만든 서버(Docker, 5500)의 PUT /api/posts/{id} 하나뿐이다. 다운로드로 파일을 내려받는 길은 v3.9에서
     완전히 없어졌다(사용자 판정: "Ctrl+S 했을 때 파일 자동 저장(다운로드 방식 없애)").
     서버가 없으면 글을 쓸 수는 있지만 저장할 수 없고, 화면이 그 사실을 말한다 — 상태는 셋(확인 중 / 연결됨 / 서버 없음),
     손잡이는 #btnSave의 disabled · #editorServer의 hidden과 .is-off · #btnRetry의 hidden이 전부다(body 클래스·data- 없음).
     초안은 localStorage 임시저장이 붙들고 있고 beforeunload가 경고하므로, 서버가 없어도 글을 잃는 길은 없다. */

  var HEALTH_TIMEOUT_MS = 2000;
  /* §6-1 표의 문구 — #editorServer와 Ctrl+S 토스트가 같은 문자열을 쓴다(두 자리가 다른 말을 하면 안 된다).
     (v4.1: 연결됨 문구 '로컬 서버 연결됨'은 폐기 — 눌리는 저장 버튼이 이미 그 사실을 말한다. 초록 점 둘이 한 줄에 서던 중복.) */
  var SERVER_OFF_TEXT = '서버 없음: start.bat(Docker)를 실행한 뒤 저장하세요';

  /* 연결됨 ↔ 서버 없음. 켜고 끄는 곳이 여기 하나라 되돌릴 때 빠뜨리는 속성이 없다.
     "확인 중"은 마크업 초기값(#btnSave disabled · #editorServer hidden · #btnRetry hidden)이라 JS가 만들지 않는다 —
     판정(≤2초) 전에는 아무 말도 하지 않는다.
     v4.1(#145): 연결됨이면 #editorServer는 hidden 그대로, 글자도 비운다. 보이는 것은 서버 없음(.is-off)뿐이다. */
  function setServerMode(on) {
    state.server = Boolean(on);
    syncActionButtons();
    if (dom.server) {
      U.setHidden(dom.server, state.server);
      dom.server.classList.toggle('is-off', !state.server);
      setText(dom.server, state.server ? '' : SERVER_OFF_TEXT);
    }
    if (dom.retry) U.setHidden(dom.retry, state.server);
  }

  /* 실패는 전부 "서버 없음"이다(api.md §4-1). start.ps1은 /api/health에 텍스트 404를 주고,
     file://은 fetch 자체가 던진다 — 어느 쪽이든 콘솔에 남길 오류가 아니라 평소 상태다.
     자동 재시도(폴링)는 없다 — 사용자가 원할 때 #btnRetry를 누른다(§6-1 "하지 않는 것"). */
  function detectServer() {
    if (typeof window.fetch !== 'function') { setServerMode(false); return Promise.resolve(false); }
    var ctrl = (typeof window.AbortController === 'function') ? new window.AbortController() : null;
    var timer = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, HEALTH_TIMEOUT_MS);
    var opts = { cache: 'no-store' };
    if (ctrl) opts.signal = ctrl.signal;

    return promised(function () { return window.fetch('/api/health', opts); })
      .then(function (res) {
        if (!res || !res.ok) return false;
        return res.json().then(function (json) { return Boolean(json && json.ok === true); }, function () { return false; });
      })
      .catch(function () { return false; })
      .then(function (ok) {
        window.clearTimeout(timer);
        state.serverChecked = true;
        setServerMode(ok);
        return ok;
      });
  }

  /* 저장·삭제 버튼의 disabled/hidden을 정하는 곳은 여기 하나다(setServerMode·setSaving·setFormLock·삭제가 부른다).
     #btnSave  — 연결됨이고, 저장·삭제 중이 아니고, 폼이 잠기지 않았을 때만 눌린다. v4.0(C2): "불러오는 중"에 눌리면
                 아직 비어 있는 폼이 PUT으로 나가 디스크의 글을 덮을 수 있었다(validate가 빈 제목은 막지만 그것에 기대지 않는다).
     #btnDelete — (m9) 디스크에 있는 글을 열었고 서버 판정이 끝났을 때만 보인다. 서버 없음·저장 중·삭제 중·잠김이면 disabled.
                 v4.1: 자리는 세부 설정(.editor-more)의 마지막 — 저장(작업 줄 오른쪽 끝)과 다른 덩어리다(§6-1).
     #editorMoreSummary — v4.1(#145): 접힌 세부 설정이 안에 무엇이 있는지 말한다. 삭제가 보이면 "파일 id와 글 삭제", 아니면 "파일 id".
                 details의 open은 건드리지 않는다(사용자가 연 것은 사용자가 닫는다). 유일한 예외(v4.3)는 #fIdError를 보일 때
                 여는 것 — showFieldError가 한다. */
  function syncActionButtons() {
    var busy = state.saving || state.deleting || state.locked;
    if (dom.saveBtn) dom.saveBtn.disabled = !state.server || busy;
    if (dom.deleteBtn) {
      var showDelete = state.onDisk && state.serverChecked;
      U.setHidden(dom.deleteBtn, !showDelete);
      dom.deleteBtn.disabled = !state.server || busy;
      setText(dom.moreSummary, showDelete ? '파일 id와 글 삭제' : '파일 id');
    }
  }

  /* ---------- 폼 잠금 (v4.0 meeting-07 C2) ----------
     수정 모드의 글 fetch가 끝나기 전에 친 글자는 writeForm()이 확인 없이 덮었다. 이제 로드(새 글은 index·분류 로드,
     수정 모드는 .md fetch)가 끝날 때까지, 그리고 삭제 요청이 도는 동안 폼을 잠근다.
       · 글자 칸(제목·요약·태그·id·본문·새 분류 두 칸)은 readOnly — disabled와 달리 포커스·선택·스크린리더 낭독은 그대로다.
       · readOnly가 없는 컨트롤(분류 셀렉트·고정 스위치·분류 버튼 셋·툴바 12개)은 disabled.
       · .editor에 aria-busy — "아직 채우는 중"을 보조기기에 말한다. 상태줄 문구는 호출부가 정한다("불러오는 중…" 등).
         v4.1: CSS가 aria-busy 안의 readOnly 칸을 흐리고 커서를 progress로 바꾼다(disabled의 흐림과 다른 "곧 풀림").
     보기 방식(.view-btn)·다시 연결은 잠그지 않는다(글을 바꾸지 않는다). 보류 안내(#147)의 복구/버리기는 잠긴 동안 상태줄에서 빠진다. */
  var LOCK_READONLY = ['title', 'summary', 'tags', 'id', 'body', 'newCatName', 'newCatSlug'];
  var LOCK_DISABLED = ['category', 'pinned', 'btnNewCat', 'btnAddCat', 'btnCancelCat'];

  function setFormLock(locked) {
    state.locked = Boolean(locked);
    LOCK_READONLY.forEach(function (key) { if (dom[key]) dom[key].readOnly = state.locked; });
    LOCK_DISABLED.forEach(function (key) { if (dom[key]) dom[key].disabled = state.locked; });
    toolbarButtons().forEach(function (btn) { btn.disabled = state.locked; });
    if (dom.editorRoot) {
      if (state.locked) dom.editorRoot.setAttribute('aria-busy', 'true');
      else dom.editorRoot.removeAttribute('aria-busy');
    }
    syncActionButtons();
  }

  /* 로드가 끝났다 — 슬롯이 정해졌으니 초안을 쓰기 시작해도 되고, 폼을 연다. 호출 순서: 슬롯 확정 → 이것 → applyDraftIfNewer(). */
  function markReady() {
    state.ready = true;
    setFormLock(false);
  }

  /* "다시 연결" — Docker를 뒤늦게 켠 사용자가 새로고침으로 초안을 흔들지 않고 서버를 다시 찾는 길.
     실행 중에는 disabled. 결과에 따라 버튼이 숨거나(연결됨) 남는다(서버 없음). disabled·hidden이 되는 순간
     포커스는 body로 튕기므로, 튕겼을 때만 저장 버튼(연결됨) 또는 이 버튼(서버 없음)으로 돌려준다. */
  function retryServer() {
    if (!dom.retry || dom.retry.disabled) return;
    dom.retry.disabled = true;
    detectServer().then(function (ok) {
      dom.retry.disabled = false;
      if (document.activeElement !== document.body) return;
      if (ok && dom.saveBtn) dom.saveBtn.focus();
      else dom.retry.focus();
    });
  }

  /* 응답 본문을 JSON으로 읽는다. 서버가 아닌 것(프록시·다른 정적 서버)이 HTML을 돌려줘도
     여기서 던지지 않고 null을 준다 — 호출부가 "서버 응답이 아니다"로 처리한다. */
  function readJson(res) {
    return res.json().then(function (json) { return json; }, function () { return null; });
  }

  function apiPut(path, payload) {
    return window.fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /* 오류 본문은 항상 { error: { code, message, …추가 필드 } } 다(api.md §3). 분기는 code로 한다 — 409가 세 종류다. */
  function apiErrorCode(json) {
    return json && json.error && json.error.code ? String(json.error.code) : '';
  }

  /* 형식이 어긋난 응답도 사람이 읽을 문장으로.
     v4.3(§6-1 · api.md v1.2 §3): "파일을 손으로 정리" 꼬리는 409 conflict(와 code 없는 409 — v1.1 서버)에만 붙인다.
     exists·stale은 사람이 파일을 만질 일이 아니다 — 저장 경로에서는 이 함수까지 오지 않고 doSave의 갈래가 먼저 받는다. */
  function apiErrorMessage(res, json, what) {
    var msg = json && json.error && json.error.message ? String(json.error.message) : '';
    if (!msg) msg = what + ' 실패 (HTTP ' + res.status + ')';
    var code = apiErrorCode(json);
    if (res.status === 409 && (code === 'conflict' || !code)) msg += '. 파일을 손으로 정리한 뒤 다시 시도해 주세요';
    return msg;
  }

  /* 저장 중에는 저장 버튼을 실제로 잠근다(보이기만 하는 시늉이 아니라 disabled) — 같은 글을 두 번 보내지 않는다.
     끝나면 연결됨일 때만 푼다(서버 없음이면 disabled가 그 상태의 손잡이다).
     disabled가 되는 순간 포커스는 body로 튕기므로, 끝나고 풀릴 때 튕겨 있었으면 버튼으로 돌려준다. */
  function setSaving(on) {
    state.saving = on;
    syncActionButtons();
    if (!dom.saveBtn) return;
    if (!on && !dom.saveBtn.disabled && document.activeElement === document.body) dom.saveBtn.focus();
  }

  /* ---------- 덮어쓰기 차단 (v4.3 — 계약서 §6-1 "저장 순서와 409", docs/api.md v1.2 §4-3, meeting-08 D1) ----------
     자동 id는 한글을 지운다(util.slugAscii) — 같은 날 `Java 정리`·`Java 복습`이 모두 YYYY-MM-DD-java다(§0-4 H6). v4.2까지는 저장 전
     존재 확인도, 서버의 의도 확인도 없어 새 글이 옛 글을 소리 없이 덮고 옛 글의 created를 물려받았다(절대 규칙 4 위반 경로).
     서버 409가 필수 방어선이고 이 사전 확인은 보조다 — 단 분류 PUT보다 먼저 한다(409가 분류 PUT 뒤에 나면 빈 분류가 남는다).
     사용자가 짓지 않은 이름(자동 id)은 에디터가 비키되(-2~-9 접미사) 알리고, 사용자가 친 이름(손 id)은 바꾸지 않고 칸(#fIdError)에서 묻는다.
       새 글   = 디스크에 한 번도 저장되지 않은 글(!state.onDisk). 첫 200 뒤에는 onDisk가 켜져 다시는 새 글이 아니다
                 — 같은 화면의 재저장이 ifNew를 또 보내면 서버가 방금 제가 쓴 파일을 "이미 있는 글"로 본다(409 exists).
       자동 id = 새 글이고, id 칸을 건드리지 않았거나 비워 두었다(비우면 저장할 때 새로 만든다 — #fIdError 문구 그대로).
       손 id   = 그 밖(사용자가 친 id, 또는 수정 중에 바꾼 id). */
  var ID_SUFFIX_MAX = 9;

  /* 저장될 id를 미리 계산한다 — buildMeta와 같은 규칙(normalizeId). 게시일 확인 모달(ensureCreated)이 넘길 값도 "지금 시각"이라 날짜가 같다. */
  function prospectiveId(form) {
    var created = (state.mode === 'edit' && state.created) ? state.created : U.nowIsoKst();
    return normalizeId(form.id, form.title, created);
  }

  function isRenaming(id) {
    return Boolean(state.onDisk && state.originalId && id !== state.originalId);
  }

  /* 자동 접미사 — 원래 id 뒤에 -2 … -9를 붙여 index에 없는 첫 값. 서버가 409 exists로 거절한 값 다음부터 이어 센다(ctx.n).
     다 찼으면 ''. 접미사는 영문 소문자·숫자·하이픈 안이라 isSafeId를 통과한다. */
  function nextSuffixId(ctx) {
    for (var n = ctx.n + 1; n <= ID_SUFFIX_MAX; n += 1) {
      var cand = ctx.base + '-' + n;
      if (!store.findMeta(cand)) {
        ctx.n = n;
        ctx.suffixed = true;
        return cand;
      }
    }
    ctx.n = ID_SUFFIX_MAX;
    return '';
  }

  /* #fIdError 문구 셋(§6-0 오류 규칙 — 글자 그대로). path가 비면(index에만 있고 파일이 없다 — api.md v1.2 §3-1) `index.json에만 있음`. */
  function showIdTaken(path, renaming) {
    var where = path ? String(path) : 'index.json에만 있음';
    var text = renaming
      ? '이 id의 글이 이미 있습니다(' + where + '). 다른 id를 적거나 원래 id(' + state.originalId + ')로 되돌려 주세요.'
      : '이 id의 글이 이미 있습니다(' + where + '). 다른 id를 적거나 칸을 비워 두세요. 비우면 저장할 때 새로 만듭니다.';
    showFieldError(dom.id, dom.idErr, text);
  }

  function showIdExhausted() {
    showFieldError(dom.id, dom.idErr, '같은 날 같은 제목의 글이 많아 id를 정하지 못했어요. 파일 id를 직접 적어 주세요.');
  }

  /* 저장 순서 ② — 새 글이거나 수정 중 id를 바꿨을 때만. index는 캐시가 아니라 새로 받는다(다른 탭이 방금 저장했을 수 있다).
     index를 못 읽으면 건너뛴다(서버 409가 막는다). 결과: 저장을 이어 갈 ctx 또는 null(= 멈춤, 칸에 오류를 이미 보였다). */
  function precheckId(form) {
    var id = prospectiveId(form);
    var renaming = isRenaming(id);
    var ctx = { base: id, n: 1, suffixed: false, auto: !state.onDisk && (!state.idTouched || !form.id), renaming: renaming };
    if (state.onDisk && !renaming) return Promise.resolve(ctx);
    return promised(function () { return store.loadIndex(true); }).then(function (data) {
      state.indexData = data;
      var hit = store.findMeta(id);
      if (!hit) return ctx;
      if (!ctx.auto) {
        showIdTaken(postPathOf(hit.id, hit.category), renaming);
        return null;
      }
      var next = nextSuffixId(ctx);
      if (!next) { showIdExhausted(); return null; }
      dom.id.value = next;                   // 세부 설정을 열면 실제 파일 이름이 보인다
      return ctx;
    }, function () { return ctx; });
  }

  function saveToServer() {
    /* C2: 로드 전·삭제 중에는 저장하지 않는다. Ctrl+S 경로는 bind()의 keydown이 먼저 안내한다. */
    if (state.locked || state.deleting) return;
    /* disabled 버튼은 클릭이 나지 않지만, 키(Ctrl+S)와 프로그램 호출은 여기까지 온다. 같은 안내를 한다(§6-1). */
    if (!state.server) { U.toast(SERVER_OFF_TEXT, 'warn'); return; }
    if (state.saving) return;
    /* 순서(§6-1 "저장 순서"): ① 폼 검증 → ② id 존재 사전 확인 → ③ 분류·게시일 확인 → ④ 새 분류 PUT → ⑤ 글 PUT.
       ②는 index를 새로 받는 동안 저장 버튼을 잠근다(두 번 눌러 두 벌 보내지 않게). 확인 모달(③) 동안에는 푼다 — 취소하면 그대로 끝난다. */
    var form = readForm();
    if (!validate(form)) return;
    setSaving(true);
    precheckId(form).then(function (ctx) {
      setSaving(false);
      if (!ctx) return;
      ensureUsableCategory(function () {
        ensureCreated(function (createdOverride) { doSave(createdOverride, ctx); });
      });
    });
  }

  function doSave(createdOverride, ctx) {
    var built = buildMeta(createdOverride);
    var form = built.form;
    var meta = built.meta;
    /* buildMeta가 id 칸을 정리한 "뒤"의 화면 스냅샷. onSaved가 저장 중 입력 여부를 이것과 비교한다. */
    var sent = readForm();
    if (!ctx) ctx = { base: meta.id, n: 1, suffixed: false, auto: false, renaming: isRenaming(meta.id) };
    ctx.renaming = isRenaming(meta.id);

    /* PUT 본문 = 메타 8개 + body + 의도 필드(api.md v1.2 §4-3 — 보내지 않으면 서버는 v1.1처럼 소리 없이 덮어쓴다).
       created는 서버가 디스크 값으로 판정한다 — 새 글이면 무시하고 now, 기존 글이면 디스크 값 유지. 클라이언트가 보낸 created가
       진실이 되는 유일한 경우는 디스크의 글에 created가 전혀 없을 때뿐이고, 그 값은 ensureCreated()가 사용자에게 확인받은 것이다.
         새 글(디스크에 한 번도 없었다) → ifNew: true. previousId·expectedUpdated와 함께 보내면 400이라 셋은 배타다.
         디스크의 글 → expectedUpdated: 이 화면이 아는 디스크 updated(모르면 보내지 않는다). 수정 중 id를 바꿨으면 previousId도. */
    var payload = Object.assign({}, meta, { body: form.body });
    if (!state.onDisk) {
      payload.ifNew = true;
    } else {
      if (state.originalUpdated) payload.expectedUpdated = state.originalUpdated;
      if (ctx.renaming) payload.previousId = state.originalId;
    }

    /* 새 분류가 있으면 글보다 먼저 등록한다. 순서가 바뀌면 글이 미등록 분류로 저장된다(api.md §4-3). */
    var needCats = cats.added.length > 0;

    /* T4-1: 타이핑 뒤 800ms 안에 Ctrl+S를 누르면 debounce가 아직 대기 중이다. 그대로 두면 PUT이
       끝나 초안을 지운 "뒤에" 발화해 방금 지운 초안을 되살리고 dirty를 다시 켠다.
       대기 중인 것을 취소하고, 지금 상태를 초안에 확정해 둔다.
       확정해 두는 이유: 저장이 거절되거나 서버가 죽으면 "임시저장본은 그대로"라는 상태줄이 참이어야 한다. */
    flushDraft();

    setSaving(true);
    setStatus('서버에 저장하는 중…');

    var job = Promise.resolve();
    if (needCats) {
      job = job.then(function () {
        return apiPut('/api/categories', JSON.parse(buildCategoriesJson()));
      }).then(function (res) {
        return readJson(res).then(function (json) {
          if (!res.ok) throw mkErr('api', apiErrorMessage(res, json, '분류 저장'));
        });
      });
    }

    function onDone(json, sentPayload) {
      onSaved(json, needCats, sent, { ifNew: sentPayload.ifNew === true, suffixed: ctx.suffixed });
    }

    /* 글 PUT 한 번 + 응답 갈래(§6-1 "응답별 화면"). 200은 onDone, 나머지는 failSave가 받는다. */
    function attempt(p) {
      putPost(p, ctx).then(function (json) { onDone(json, p); }, failSave);
    }

    function failSave(err) {
      var code = err && err.code;
      if (code === 'id-taken' || code === 'id-exhausted') {
        /* 409 exists — 손 id(또는 접미사 소진). 칸에서 묻는다: 세부 설정을 열고 #fIdError + 포커스. 토스트 없음. */
        setSaving(false);
        if (code === 'id-taken') showIdTaken(err.path, ctx.renaming);
        else showIdExhausted();
        setStatus('저장하지 못했어요. 임시저장본은 그대로 있습니다', true);
        return;
      }
      if (code === 'stale') {
        setSaving(false);
        confirmStale(err.info || {}, err.payload);
        return;
      }
      if (code === 'api') {
        /* 서버가 거절했다(4xx/5xx — conflict는 "손으로 정리" 꼬리가 붙어 있다). 초안·dirty는 그대로 — 사용자가 고쳐서 다시 누른다. */
        setSaving(false);
        U.toast(err.message, 'err');
        setStatus('저장하지 못했어요. 임시저장본은 그대로 있습니다', true);
        return;
      }
      /* 네트워크 실패 = 서버가 사라졌다. 서버 없음 상태로 전환한다(§6-1) — 저장 버튼이 잠기고 #btnRetry가 나타난다.
         setServerMode를 setSaving보다 먼저 — 순서가 반대면 setSaving이 버튼에 포커스를 줬다가 곧바로 disabled로 튕긴다. */
      setServerMode(false);
      setSaving(false);
      U.toast('서버가 꺼졌습니다. start.bat(Docker)를 실행한 뒤 다시 연결하세요', 'err');
      setStatus('서버 연결이 끊겼어요. 임시저장본은 그대로 있습니다', true);
    }

    /* 409 stale — 이 화면에서 연 뒤 다른 탭·편집기·손이 그 글을 저장했다(또는 지웠다). 덮어쓸지 사용자가 겨냥해서 고른다.
       `덮어쓰기`(= 다시 만들기) → 같은 글 PUT을 expectedUpdated "없이" 한 번 더(previousId는 그대로). 에디터가 스스로 빼고 보내는 일은 없다.
       `취소`·Esc·✕ → 아무것도 보내지 않는다. 포커스: 덮어쓰기(danger)는 ui.modal의 초기 포커스 후보가 아니라 `취소`가 받는다. */
    function confirmStale(info, sentPayload) {
      var gone = info.currentUpdated === null;
      var go = false;
      Blog.ui.modal({
        title: gone ? '다른 곳에서 지워진 글이에요' : '다른 곳에서 먼저 저장된 글이에요',
        text: gone
          ? '이 화면에서 연 뒤에 이 글이 다른 곳에서 지워지거나 옮겨졌습니다. 지금 화면의 내용으로 다시 만들 수 있습니다.'
          : '이 화면에서 연 뒤에 다른 탭이나 편집기에서 이 글이 저장됐습니다. 지금 화면의 내용으로 덮어쓰면 그쪽에서 고친 내용은 사라집니다.',
        actions: gone
          ? [{ label: '다시 만들기', variant: 'primary', onClick: function () { go = true; } }, { label: '취소', variant: 'ghost' }]
          : [{ label: '덮어쓰기', variant: 'danger', onClick: function () { go = true; } }, { label: '취소', variant: 'ghost' }],
        onClose: function () {
          if (!go) {
            setStatus('저장하지 않았어요. 임시저장본은 그대로 있습니다', true);
            return;
          }
          if (!state.server) { U.toast(SERVER_OFF_TEXT, 'warn'); return; }
          var again = Object.assign({}, sentPayload || payload);
          delete again.expectedUpdated;
          setSaving(true);
          setStatus('서버에 저장하는 중…');
          attempt(again);
        }
      });
    }

    job.then(function () { attempt(payload); }, failSave);
  }

  /* 글 PUT 하나와 그 응답의 갈래. 200이면 json으로 풀리고, 아니면 코드가 붙은 오류로 거부된다(네트워크 실패는 fetch의 거부 그대로).
     409 exists + 자동 id → 다음 접미사로 id를 바꿔 "글 PUT만" 다시(분류는 이미 저장됐다). -9까지 차면 id-exhausted.
     409 exists + 손 id → id-taken(path = error.path — null이면 index에만 있다). 409 stale → stale(추가 필드와 보낸 본문을 싣는다).
     그 밖 → api(apiErrorMessage — conflict·code 없는 409에만 "손으로 정리" 꼬리). */
  function putPost(payload, ctx) {
    return apiPut('/api/posts/' + encodeURIComponent(payload.id), payload).then(function (res) {
      return readJson(res).then(function (json) {
        if (res.ok) {
          if (!json || !json.ok || !json.meta) throw mkErr('api', '서버 응답을 읽을 수 없습니다. 서버 로그를 확인해 주세요');
          return json;
        }
        var code = apiErrorCode(json);
        var err;
        if (res.status === 409 && code === 'exists') {
          if (ctx.auto) {
            var next = nextSuffixId(ctx);
            if (!next) throw mkErr('id-exhausted', '');
            dom.id.value = next;
            return putPost(Object.assign({}, payload, { id: next }), ctx);
          }
          err = mkErr('id-taken', '');
          err.path = json.error.path || '';
          throw err;
        }
        if (res.status === 409 && code === 'stale') {
          err = mkErr('stale', '');
          err.info = json.error;
          err.payload = payload;
          throw err;
        }
        throw mkErr('api', apiErrorMessage(res, json, '저장'));
      });
    });
  }

  /* 응답의 git(docs/api.md §2-1, BLOG_AUTO_COMMIT). 없으면 빈 문자열 — 필드가 없는 서버도 정상이다. */
  function gitNote(json) {
    var git = json && json.git;
    if (!git || typeof git !== 'object') return '';
    if (git.committed === true) return ', 커밋 ' + String(git.hash || '').slice(0, 7);
    if (git.committed === false) return ', 커밋 실패(' + String(git.reason || '이유 없음') + ')';
    return '';
  }

  /* 200 — 디스크 저장이 확인됐다. 초안을 지워도 된다.
     응답의 meta가 실제로 쓴 값이므로 화면 상태는 응답으로 덮는다(created를 클라이언트가 계산하지 않는다).
     sentForm은 PUT에 실은 폼 스냅샷 — 저장 중에 더 친 글자가 있는지 이것과 비교한다.
     info(v4.3) = { ifNew: 이번 PUT에 ifNew를 실었나, suffixed: 자동 접미사를 썼나 } — 결과 알림을 고른다(§6-1 "응답별 화면"). */
  function onSaved(json, savedCats, sentForm, info) {
    var saved = json.meta;
    var oldSlot = state.slot;
    state.created = saved.created || state.created;
    state.originalId = saved.id;
    state.originalCategory = saved.category || '';
    state.originalPath = json.path || postPathOf(saved.id, saved.category);
    /* v4.3(api.md v1.2): 다음 저장의 expectedUpdated는 이 응답의 meta.updated다 — 방금 이 화면이 쓴 디스크 버전. */
    state.originalUpdated = saved.updated ? String(saved.updated) : '';
    clearFieldError(dom.id, dom.idErr);

    /* 이제 이 글은 디스크에 있다. 새 글이었어도 "수정 모드"가 맞다 — 제목을 고쳐도 id가
       따라 바뀌지 않고(refreshAutoId), 다시 저장하면 같은 파일을 덮어쓴다. id 칸에 서버가 확정한 값을 되비친다. */
    state.mode = 'edit';
    state.onDisk = true;                    // m9: 이제 지울 수 있는 글이다 — setSaving(false)의 syncActionButtons가 #btnDelete를 보인다
    state.idTouched = true;
    if (dom.id.value !== saved.id) dom.id.value = saved.id;
    showEditBadge(saved, state.originalPath);

    if (savedCats) cats.added = [];
    cats.loaded = true;

    /* T4-1: 저장 중에 친 글자가 걸어 둔 debounce는 여기서 끊는다. 그 글자는 아래에서 sentForm과 비교해
       "저장 완료 뒤의 dirty"로만 남긴다 — 저장이 끝난 뒤에 발화해 방금 지운 초안을 되살리는 일이 없어야 한다. */
    if (autosave.cancel) autosave.cancel();

    /* T4-2·T4-3: 초안 슬롯은 "디스크의 id"를 따라간다. 새 글이면 'new' → id, id를 바꿔 저장했으면(previousId) 옛 id → 새 id.
       옛 슬롯의 초안은 방금 저장된 내용(또는 그보다 옛것)이라 지우고, 저장 중 입력분만 새 슬롯에 다시 쓴다.
       URL도 ?id=<id>로 바꿔 둔다 — 새로고침·뒤로가기가 이 글을 다시 열고, 그때 새 슬롯의 초안을 찾는다.
       예전에는 슬롯이 'new'/옛 id에 남아 이어 쓴 초안이 고아가 됐고, 다음 새 글에서 그 초안을 불러오면
       id는 A인데 내용은 B라 A를 덮어썼다(meeting-04 T4-2). */
    /* v4.1(#147): 보류 중인 옛 초안이 아직 옛 슬롯에 그대로 있으면(frozen — 보류 슬롯으로 옮기지 못했다) 그 슬롯을 지우지 않는다.
       보류는 "그 슬롯의" 옛 초안에 대한 것이라 슬롯이 바뀌면(새 글 → id, id 변경) 이 화면에서는 보류 안내를 거둔다 —
       옛 초안은 저장소(보류 슬롯)에 남아 같은 슬롯을 다시 열 때(새 글 쓰기 · 옛 id) 다시 제안된다. 방금 저장한 글에 다른 글의
       초안을 "복구"해 덮는 길을 막는다. */
    var heldHere = state.held && state.held.slot === oldSlot;
    if (!(heldHere && state.held.frozen)) store.draft.clear(oldSlot);
    state.slot = saved.id;
    if (heldHere && oldSlot !== state.slot) state.held = null;
    if (U.getQuery().id !== saved.id) U.setQuery({ id: saved.id, cat: '' });

    setSaving(false);
    /* v4.0(M2): 가운뎃점 나열과 "→"를 뺐다 — "저장됨: posts/java/x.md, 커밋 abc1234. 글 보기 또는 목록으로".
       링크 둘은 밑줄이 경계를 말하고, 문장은 문장으로 읽힌다. */
    var status = ['저장됨: ' + state.originalPath + gitNote(json) + '. ',
      U.el('a', { href: 'post.html?id=' + encodeURIComponent(saved.id), text: '글 보기' }), ' 또는 ',
      U.el('a', { href: 'index.html', text: '목록으로' })];
    setStatusNodes(status, false);
    /* v4.3 결과 알림은 하나만:
       ifNew를 보냈는데 isNew:false — 서버가 ifNew를 모르는 옛 버전(v1.1)이라 기존 파일을 고쳤다. 확인 모달이 결과를 말한다(토스트 없음).
       자동 접미사를 썼다 — 조용히 비키지 않고 새 id를 알린다(`새 글을 저장했습니다`를 대신한다).
       그 밖 — v4.1 그대로. */
    if (info && info.ifNew && json.isNew === false) warnOverwrote(json);
    else if (info && info.suffixed) U.toast('같은 id의 글이 있어 새 id로 저장했습니다: ' + saved.id, 'ok');
    else U.toast(json.isNew ? '새 글을 저장했습니다' : '저장했습니다', 'ok');

    /* 저장 중에 더 친 글자는 아직 디스크에 없다. 저장이 끝난 지금 dirty로 올리고 새 슬롯에 초안을 확정한다. */
    if (sentForm && !sameForm(Object.assign({}, sentForm, { id: saved.id }), readForm())) {
      markDirty();
      saveDraftNow();
    }

    refreshSideAfterSave();
  }

  /* v4.3(§6-1 "200 + isNew:false" — 이중 안전장치): 새 글로 보냈는데 서버가 기존 파일을 고쳤다고 답했다. 파일은 실제로 써졌으니
     상태줄은 `저장됨: …` 그대로이고, 무엇이 사라졌는지와 되찾을 길을 모달(확인 하나)로 말한다. 2행은 자동 커밋 여부로 갈린다. */
  function warnOverwrote(json) {
    var git = json && json.git;
    var path = (json && json.path) || state.originalPath;
    Blog.ui.modal({
      title: '같은 id의 글을 덮어썼어요',
      text: path + '에 있던 글이 지금 쓴 글로 바뀌었습니다. 저장 서버가 새 글 확인을 모르는 옛 버전입니다.\n'
        + ((git && git.committed === true)
          ? '옛 글이 커밋돼 있었다면 커밋 ' + String(git.hash || '').slice(0, 7) + ' 이전 이력에서 되찾을 수 있습니다.'
          : '자동 커밋이 없어 이 화면에서는 되돌릴 수 없습니다. 백업이나 git 이력을 확인해 주세요.'),
      actions: [{ label: '확인', variant: 'primary' }]
    });
  }

  /* v3.9(§6-1 저장 피드백, meeting-06 "그 밖에"): 서버가 쓴 최신 index.json·categories.json을 다시 받아 사이드바를 다시 그린다 —
     새 글·새 분류가 새로고침 없이 사이드바에 나타난다. 둘 다 force로 받는다(store가 캐시한 약속은 저장 전 것이다).
     어느 쪽이 실패해도 저장 결과는 그대로다 — 실패는 삼키고 남은 것으로 그린다. */
  function refreshSideAfterSave() {
    var indexJob = promised(function () { return store.loadIndex(true); })
      .then(function (data) { state.indexData = data; })
      .catch(function () { /* 기존 사본으로 그린다 */ });
    var catJob = promised(function () { return store.loadCategories(true); })
      .catch(function () { /* 분류 목록은 store가 되살린다 */ });
    Promise.all([indexJob, catJob]).then(function () {
      drawSide(state.indexData);
    });
  }

  /* ---------- 삭제 (v4.0 meeting-07 m9 — docs/api.md DELETE /api/posts/{id}) ----------
     수정 모드에서만. 지우는 대상은 폼의 id 칸이 아니라 디스크에서 읽어 온 id(state.originalId)다 — id 칸을 고친 채 누르면
     아직 없는 파일을 지우려 들거나 다른 글을 지울 수 있다.
     확인 모달은 필수다. 파괴적 버튼(danger)은 ui.modal이 초기 포커스에서 빼므로 포커스는 '취소'가 받는다 —
     모달이 뜬 순간 Enter 한 번에 글이 사라지지 않는다. 버튼 순서는 초안 모달과 같다(파괴적 동작 왼쪽).
     성공하면 이 글의 초안까지 지우고 목록으로 간다(location.replace — 뒤로 가기가 지워진 글의 편집 화면으로 돌아와
     "불러오지 못했어요"를 띄우지 않게). 실패하면 아무것도 잃지 않는다(폼·초안·dirty 그대로). */
  function confirmDelete() {
    if (!state.onDisk || state.locked || state.saving || state.deleting) return;
    if (!state.server) { U.toast(SERVER_OFF_TEXT, 'warn'); return; }
    var id = state.originalId;
    if (!id) return;
    var title = (dom.title.value || '').trim() || id;
    var lines = [
      '"' + title + '" 글을 삭제합니다.',
      '서버가 ' + (state.originalPath || postPathOf(id, state.originalCategory)) + ' 파일과 목록 항목을 지웁니다. 이 화면에서는 되돌릴 수 없습니다.'
    ];
    /* v4.1(#147): 보류 중인 옛 초안도 이 글의 임시저장본이다 — 삭제가 함께 지운다(onDeleted). 그 사실도 여기서 말한다. */
    if (state.dirty || (state.held && state.held.list.length)) lines.push('저장하지 않은 변경과 임시저장본도 함께 사라집니다.');
    var confirmed = false;
    Blog.ui.modal({
      title: '이 글을 삭제할까요?',
      text: lines.join('\n'),
      actions: [
        { label: '삭제', variant: 'danger', onClick: function () { confirmed = true; } },
        { label: '취소', variant: 'ghost' }
      ],
      /* 모달이 닫혀 포커스가 #btnDelete로 돌아온 "뒤에" 시작한다 — 먼저 잠그면 되돌아올 포커스가 disabled에 튕긴다. */
      onClose: function () { if (confirmed) doDelete(id); }
    });
  }

  function doDelete(id) {
    if (state.deleting || !state.server) return;
    /* 지우는 동안 debounce가 발화해 초안을 새로 쓰면, 삭제 뒤 같은 id로 새 글을 열 때 유령 초안이 뜬다. */
    if (autosave.cancel) autosave.cancel();
    var wasDirty = state.dirty;
    state.deleting = true;
    setFormLock(true);
    setStatus('서버에서 삭제하는 중…');

    promised(function () {
      return window.fetch('/api/posts/' + encodeURIComponent(id), { method: 'DELETE' });
    }).then(function (res) {
      return readJson(res).then(function (json) {
        if (!res.ok) throw mkErr('api', apiErrorMessage(res, json, '삭제'));
        if (!json || !json.ok) throw mkErr('api', '서버 응답을 읽을 수 없습니다. 서버 로그를 확인해 주세요');
        onDeleted(id);
      });
    }).catch(function (err) {
      state.deleting = false;
      /* 네트워크 실패 = 서버가 사라졌다 — 저장 실패와 같은 전환(§6-1). 폼을 풀기 전에 바꿔야 삭제 버튼이 한 번 켜졌다 꺼지지 않는다. */
      if (!(err && err.code === 'api')) setServerMode(false);
      setFormLock(false);
      if (err && err.code === 'api') U.toast(err.message, 'err');
      else U.toast('서버가 꺼졌습니다. start.bat(Docker)를 실행한 뒤 다시 연결하세요', 'err');
      setStatus('삭제하지 못했어요. 글과 임시저장본은 그대로 있습니다', wasDirty);
      if (document.activeElement === document.body) {
        if (dom.deleteBtn && !dom.deleteBtn.disabled) dom.deleteBtn.focus();
        else if (dom.retry && !dom.retry.hasAttribute('hidden')) dom.retry.focus();
      }
    });
  }

  function onDeleted(id) {
    /* 떠나기 전에 경고·초안 쓰기를 끈다 — dirty가 남아 있으면 beforeunload가 "저장하지 않은 변경"을 묻고,
       pagehide의 flushDraft가 지운 글의 초안을 되살린다. */
    state.dirty = false;
    state.ready = false;
    state.onDisk = false;
    if (autosave.cancel) autosave.cancel();
    store.draft.clear(state.slot);
    if (id !== state.slot) store.draft.clear(id);
    store.draft.clear(heldSlot(state.slot));
    if (id !== state.slot) store.draft.clear(heldSlot(id));
    state.held = null;
    setStatus('삭제했습니다. 목록으로 이동합니다', false);
    window.location.replace('index.html');
  }

  /* ---------- 불러오기 ---------- */

  function showEditBadge(meta, path) {
    if (!dom.modeBadge) return;
    U.setHidden(dom.modeBadge, false);
    /* 게시일이 없는 글은 "오늘로 찍겠다"고 조용히 정하지 않는다(규약 4).
       저장할 때 ensureCreated()가 물어본다는 사실을 미리 알려 둔다. */
    dom.modeBadge.textContent = meta.created
      ? '수정 모드: 게시일 ' + U.fmtKo(meta.created) + ' 유지, 원본 ' + path
      : '수정 모드: 이 글에는 게시일 정보가 없어요(저장할 때 확인합니다), 원본 ' + path;
    document.title = '수정: ' + meta.title;
  }

  /* 초안에 실려 온 "아직 파일에 없는 분류"를 목록에 되살린다. */
  function restoreDraftCats(draftCats) {
    var changed = false;
    (draftCats || []).forEach(function (item) {
      var cat = normalizeCat(item, cats.list.length);
      if (!cat || findCat(cat.slug)) return;
      cats.list.push(cat);
      if (cats.added.indexOf(cat.slug) === -1) cats.added.push(cat.slug);
      changed = true;
    });
    if (changed) {
      sortCats(cats.list);
      fillCategoryOptions();
    }
  }

  /* 초안이 "지금 화면에 있는 것과 완전히 같은가"를 본다(M3-7).
     예전에는 title·body 둘만 비교해서, 요약·태그·id·고정·분류만 바꾸고 떠나면
     다음에 열 때 모달조차 뜨지 않고 그 변경이 조용히 사라졌다.
     특히 분류는 글이 저장될 폴더를 정하는 값이라 잃었을 때 비용이 가장 크다.
     비교 대상은 readForm()이 만드는 필드 전부이며, 여기 필드가 늘면 이 목록도 함께 늘려야 한다.
     (v3.0에서 'color'가 빠졌다 — readForm()이 더 이상 그 값을 만들지 않는다.) */
  var FORM_TEXT_KEYS = ['id', 'title', 'summary', 'category', 'body'];

  function sameForm(a, b) {
    if (!a || !b) return false;
    var same = FORM_TEXT_KEYS.every(function (key) {
      return String(a[key] === undefined || a[key] === null ? '' : a[key])
        === String(b[key] === undefined || b[key] === null ? '' : b[key]);
    });
    if (!same) return false;
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return false;
    /* 태그는 배열이다. 순서까지 같아야 "같다"로 본다(순서도 사용자가 정한 정보다). */
    var at = a.tags || [];
    var bt = b.tags || [];
    if (at.length !== bt.length) return false;
    return at.every(function (tag, i) { return String(tag) === String(bt[i]); });
  }

  /* 초안 하나({savedAt, data})를 화면에 되살린다 — 복구 모달의 '불러오기'와 보류 안내의 '복구'가 같은 길을 쓴다. */
  function restoreDraft(draft) {
    /* 분류를 먼저 되살려야 select 안에 그 값이 존재한다. */
    restoreDraftCats(draft.data.newCats);
    var form = draft.data.form;
    writeForm(form, form.body);
    /* T4-2: 슬롯 메타(mode·originalId·created·원본 경로)도 되살린다. 디스크에 있는 글의 초안을
       "새 글"로 불러오면 저장이 created=now를 찍고(규약 4 위반) 다른 id로 한 벌 더 만든다.
       created는 디스크 값이 있으면 그것이 진실이다 — 초안의 값은 비어 있을 때만 채운다. */
    if (draft.data.mode === 'edit' && state.mode !== 'edit') {
      state.mode = 'edit';
      if (draft.data.originalId) state.originalId = draft.data.originalId;
    }
    if (!state.created && draft.data.created) state.created = draft.data.created;
    if (!state.originalCategory && draft.data.originalCategory) state.originalCategory = draft.data.originalCategory;
    if (!state.originalPath && draft.data.originalPath) state.originalPath = draft.data.originalPath;
    if (state.mode === 'edit' && dom.modeBadge && dom.modeBadge.hasAttribute('hidden')) {
      showEditBadge({ created: state.created, title: form.title },
        state.originalPath || postPathOf(state.originalId || form.id, state.originalCategory || form.category));
    }
    state.idTouched = true;
    renderPreview();
    markDirty();
    setStatus('임시저장본을 불러왔습니다. 아직 저장하지 않았어요', true);
  }

  /* ---------- 결정 보류 (v4.1 #147 — 계약서 §6-1 끝) ----------
     복구 모달을 Esc·✕·바깥 클릭으로 닫으면(아무것도 고르지 않으면) 예전에는 다음 입력의 자동 임시저장이 옛 초안을 조용히 덮었다 —
     사용자는 아무것도 고르지 않았는데 한쪽 글이 사라졌다. 이제 선택 없이 닫기 = "결정 보류":
       ① 화면의 글은 그대로 ② 옛 초안은 지우지도 덮지도 않는다 — 곧바로 보류 슬롯(heldSlot)으로 옮기고 원래 슬롯은 비워,
          자동 임시저장은 평소처럼 원래 슬롯에 쓴다(지금 쓰는 글도 계속 보호된다)
       ③ 상태줄 끝에 `이전 임시저장본이 남아 있어요: 복구 버리기`가 결정할 때까지 붙어 있다(setStatusNodes 어휘 — 새 부품 없음)
       ④ 둘 중 하나를 고르면 그 초안의 보류가 끝난다.
     저장소 형식은 그대로다 — store.draft.save(id, payload)의 id 자리에 'held:<슬롯>'을 쓰고 payload는 { held: [초안, …] }.
     (store.draft는 payload를 해석하지 않는다. app.js의 "저장하지 않은 초안 N개" 알림은 이 키도 한 개로 센다 — 실제로 남은 초안이다.)
     보류는 쌓일 수 있다(보류 중에 새로고침 → 그사이 쓴 초안의 복구 모달도 닫으면 둘). 안내의 복구·버리기는 가장 최근 것부터.
     옮기기에 실패하면(저장소 가득 참) 옛 초안은 원래 슬롯에 남기고 frozen — 결정 전까지 그 슬롯에 쓰지 않는다(saveDraftNow). */

  function heldSlot(slot) { return 'held:' + (slot || 'new'); }

  function loadHeldList(slot) {
    var wrap = store.draft.load(heldSlot(slot));
    var list = wrap && wrap.data && Array.isArray(wrap.data.held) ? wrap.data.held : [];
    return list.filter(function (d) { return d && d.data && d.data.form; });
  }

  function writeHeldList(slot, list) {
    if (!list.length) { store.draft.clear(heldSlot(slot)); return true; }
    return store.draft.save(heldSlot(slot), { held: list });
  }

  /* 로드가 끝난 뒤(applyDraftIfNewer 첫머리) 이 슬롯에 보류된 초안이 있으면 안내를 다시 건다 — "나중에도" 결정할 수 있게. */
  function resumeHeld() {
    var list = loadHeldList(state.slot);
    state.held = list.length ? { slot: state.slot, list: list, frozen: false } : null;
    repaintStatus();
  }

  function holdDraft(draft) {
    var slot = state.slot;
    var list = loadHeldList(slot);
    var dup = list.some(function (d) { return sameForm(d.data.form, draft.data.form); });
    if (!dup) list.push(draft);
    if (writeHeldList(slot, list)) {
      store.draft.clear(slot);               // 원래 슬롯을 비운다 — 이제 자동 임시저장이 여기 써도 옛 초안은 안전하다
      state.held = { slot: slot, list: list, frozen: false };
    } else {
      /* 옮기지 못했다 — 옛 초안은 원래 슬롯에 그대로 두고, 결정할 때까지 그 슬롯에 쓰지 않는다. */
      state.held = { slot: slot, list: [draft], frozen: true };
    }
    repaintStatus();
  }

  /* 보류 하나(가장 최근)의 결정이 끝났다 — 목록에서 빼고 저장소를 맞춘다.
     frozen(옛 초안이 아직 원래 슬롯에 있다)이면: 복구(kept)는 그 초안이 곧 지금 화면이라 그대로 두고, 버리기는 원래 슬롯을 비운 뒤
     그동안 쓰지 못했던 지금 화면을 그 슬롯에 쓴다(보류 중에 친 글자를 잃지 않는다). */
  function settleHeld(draft, kept) {
    var held = state.held;
    if (!held) return;
    if (held.frozen) {
      state.held = null;
      if (!kept) {
        store.draft.clear(held.slot);
        if (state.dirty) writeDraft();
      }
      return;
    }
    var list = held.list.filter(function (d) { return d !== draft; });
    writeHeldList(held.slot, list);
    state.held = list.length ? { slot: held.slot, list: list, frozen: false } : null;
  }

  function currentHeld() {
    return state.held && state.held.list.length ? state.held.list[state.held.list.length - 1] : null;
  }

  function onHeldRestore(e) {
    if (e) e.preventDefault();
    if (state.locked || state.saving) return;
    var draft = currentHeld();
    if (!draft) return;
    var go = function () {
      var frozen = state.held && state.held.frozen;
      restoreDraft(draft);
      /* 되살린 글을 원래 슬롯에 먼저 쓰고 나서 보류에서 뺀다 — 그 사이에 옛 초안이 어디에도 없는 순간이 없게.
         (frozen이면 옛 초안이 이미 원래 슬롯에 있다.) 쓰지 못했으면 보류에 남긴다 — 잃는 것보다 한 번 더 묻는 편이 낫다. */
      if (frozen || writeDraft()) settleHeld(draft, true);
      repaintStatus();
      /* 링크가 사라지며 body로 튕긴 포커스를 쓰는 자리로 돌려준다(본문이 감춰진 보기면 그대로 둔다). */
      if (document.activeElement === document.body && dom.body && dom.body.offsetParent !== null) dom.body.focus();
    };
    /* 화면에 저장하지 않은 변경이 있으면 갈아 끼우기 전에 묻는다 — 보류는 "아무것도 잃지 않는다"는 약속이다.
       파괴적 확인이라 포커스는 '취소'가 받는다(danger는 ui.modal의 초기 포커스 후보가 아니다). */
    if (!state.dirty) { go(); return; }
    var confirmed = false;
    Blog.ui.modal({
      title: '이전 임시저장본으로 바꿀까요?',
      text: '지금 화면에서 고친 내용은 이전 임시저장본으로 바뀌고 되돌릴 수 없습니다.',
      actions: [
        { label: '바꾸기', variant: 'danger', onClick: function () { confirmed = true; } },
        { label: '취소', variant: 'ghost' }
      ],
      onClose: function () { if (confirmed) go(); }
    });
  }

  function onHeldDiscard(e) {
    if (e) e.preventDefault();
    if (state.locked) return;
    var draft = currentHeld();
    if (!draft) return;
    settleHeld(draft, false);
    repaintStatus();
    U.toast('임시저장본을 버렸습니다', 'ok');
    if (document.activeElement === document.body && dom.body && dom.body.offsetParent !== null) dom.body.focus();
  }

  /* 상태줄 문장 뒤에 붙는 보류 안내. 앞 문장이 마침표·말줄임표로 끝나지 않으면 마침표로 끊는다. */
  function heldNotice(text) {
    var sep = /[.…?!]$/.test(String(text || '').trim()) ? ' ' : '. ';
    if (!String(text || '').trim()) sep = '';
    var restore = U.el('a', { href: '#', text: '복구' });
    var discard = U.el('a', { href: '#', text: '버리기' });
    restore.addEventListener('click', onHeldRestore);
    discard.addEventListener('click', onHeldDiscard);
    return [sep + '이전 임시저장본이 남아 있어요: ', restore, ' ', discard];
  }

  /* 호출 시점 규칙: 폼에 값이 다 채워진 뒤에 부른다(수정 모드는 writeForm 다음, 새 글은 기본값 세팅 다음).
     그래야 readForm()이 곧 "지금 화면"이 되어 정규화 차이 없이 초안과 맞댈 수 있다. */
  function applyDraftIfNewer() {
    resumeHeld();
    var draft = store.draft.load(state.slot);
    if (!draft || !draft.data || !draft.data.form) return false;
    if (sameForm(draft.data.form, readForm())) return false;

    var savedAt = draft.savedAt ? U.fmtKo(draft.savedAt) + ' ' + String(draft.savedAt).slice(11, 16) : '';
    var decided = false;
    Blog.ui.modal({
      title: '임시저장본이 있어요',
      text: (savedAt ? savedAt + ' 에 ' : '') + '자동 저장된 내용이 남아 있습니다.\n불러올까요, 버릴까요?',
      /* 규칙: 파괴적 버튼은 기본 포커스를 갖지 않는다(M3-1).
         '버리기'는 store.draft.clear() — 되돌릴 방법이 없다. 그래서 danger로 표시해
         ui.modal의 초기 포커스 대상에서 빠지게 하고, 포커스는 primary('불러오기')가 받는다.
         버튼 순서는 그대로 둔다(파괴적 동작은 왼쪽, 긍정 동작은 오른쪽). */
      actions: [
        {
          label: '버리기', variant: 'danger', onClick: function () {
            decided = true;
            store.draft.clear(state.slot);
            U.toast('임시저장본을 버렸습니다', 'ok');
          }
        },
        {
          label: '불러오기', variant: 'primary', onClick: function () {
            decided = true;
            restoreDraft(draft);
          }
        }
      ],
      /* v4.1(#147): 고르지 않고 닫았다(Esc·✕·바깥 클릭) = 결정 보류. ✕·Esc는 없애지 않는다(탈출구). */
      onClose: function () { if (!decided) holdDraft(draft); }
    });
    return true;
  }

  /* 목록의 분류 인덱스는 "전체"를 ?cat=* 로 쓴다(계약서 §4-3). 그건 폴더 이름이 아니다. */
  function queryCategory() {
    var raw = String(U.getQuery().cat || '').trim();
    return (!raw || raw === '*') ? '' : raw;
  }

  /* index.json이 알려 주는 분류 또는 ?cat= 으로 넘어온 힌트. 없으면 빈 문자열. */
  function categoryHintFor(id) {
    var q = queryCategory();
    if (q) return q;
    var meta = (typeof store.findMeta === 'function') ? store.findMeta(id) : null;
    return meta && meta.category ? String(meta.category).trim() : '';
  }

  function buildPostFromText(id, text, url) {
    var parsed = store.parseFrontmatter(text);
    var indexMeta = (typeof store.findMeta === 'function') ? store.findMeta(id) : null;
    var fileMeta = parsed.ok ? store.normalizeMeta(parsed.data, id) : null;
    var meta = store.mergeMeta(indexMeta, fileMeta);
    if (!meta.id) meta.id = id;
    return { id: id, meta: meta, body: parsed.body, path: url, frontmatterOk: parsed.ok };
  }

  /* 후보 경로 목록. 규칙은 store가 가진다(Blog.store.postCandidates) — 여기서 새로 조립하면
     저장하는 쪽과 찾는 쪽의 경로 규칙이 갈라져 "내보냈는데 못 찾는" 사고가 난다.
     에디터가 아는 분류 힌트는 맨 앞에 둔다. 맞으면 요청이 한 번에 끝나고,
     틀려도 나머지 후보가 그대로 남아 손해가 없다. */
  function candidatePaths(id, hint) {
    var urls = [];
    function push(url) { if (url && urls.indexOf(url) === -1) urls.push(url); }

    if (hint) push(postPathOf(id, hint));
    if (typeof store.postCandidates === 'function') {
      var listed = store.postCandidates(id, hint || '');
      if (Array.isArray(listed)) listed.forEach(push);
    }
    push(postPathOf(id, UNCATEGORIZED));   // 목록이 비어도 마지막으로 한 번은 두드린다
    return urls;
  }

  /* store.fetchText(path)는 원문 문자열을 주고, 404면 null을 준다.
     구현에 따라 거부(reject)로 오는 경우까지 같은 자리에서 "다음 후보로"로 받아 낸다. */
  function readPostText(url) {
    return promised(function () { return store.fetchText(url); });
  }

  /* 후보 경로를 차례로 두드린다. store가 분류 경로를 아직 모를 수 있어서 필요한 폴백이다. */
  function fetchPostFallback(id, hint, firstErr) {
    var urls = candidatePaths(id, hint);
    var i = 0;
    function next() {
      if (i >= urls.length) {
        throw firstErr || mkErr('notfound',
          'posts/ 안에서 ' + id + '.md 를 찾지 못했습니다. 분류 폴더로 옮겨졌는지 확인해 주세요.');
      }
      var url = urls[i];
      i += 1;
      return readPostText(url).then(function (text) {
        if (text === null || text === undefined) return next();   // 404 → 다음 후보
        return buildPostFromText(id, text, url);
      }, function (err) {
        if (err && err.code === 'file') throw err;   // file://은 어느 경로든 똑같이 막힌다
        return next();
      });
    }
    return promised(next);
  }

  /* store가 후보 경로 탐색을 스스로 끝냈는지. 둘 다 있으면 loadPost의 null은
     "후보를 전부 두드려 봤고 없더라"는 확정 답이라, 같은 404를 한 번 더 낼 이유가 없다. */
  function storeScansCandidates() {
    return typeof store.fetchText === 'function' && typeof store.postCandidates === 'function';
  }

  /* store.loadPost(id, categoryHint)를 먼저 쓴다. 분류 힌트를 함께 넘겨 불필요한 404를 줄인다.
     폴백(직접 후보 훑기)은 store가 거부했거나(= 파이프라인이 깨졌거나)
     후보 탐색 API가 없을 때만 돈다. */
  function loadPostAny(id, hint) {
    return promised(function () { return store.loadPost(id, hint || ''); })
      .then(function (post) {
        return { post: post || null, err: null };
      }, function (err) {
        if (err && err.code === 'file') throw err;   // file://은 폴백해도 결과가 같다
        return { post: null, err: err };
      })
      .then(function (res) {
        if (!res.post) {
          if (!res.err && storeScansCandidates()) {
            throw mkErr('notfound',
              'posts/ 안에서 ' + id + '.md 를 찾지 못했습니다. 분류 폴더로 옮겨졌는지 확인해 주세요.');
          }
          return fetchPostFallback(id, hint, res.err);
        }
        if (!res.post.path) res.post.path = postPathOf(id, (res.post.meta && res.post.meta.category) || hint);
        return res.post;
      });
  }

  /* 글이 어느 분류 값으로 열려야 하는지 고른다.
     폴더가 곧 진실이지만, v1에서 넘어온 한글 표시 이름도 버리지 않고 slug로 옮겨 준다. */
  function pickCategoryValue(meta, path) {
    var fromPath = catFromPath(path);
    if (fromPath && findCat(fromPath)) return fromPath;

    var raw = String((meta && meta.category) || '').trim();
    if (!raw) return fromPath || defaultCategorySlug();
    if (findCat(raw)) return raw;

    var byName = findCatByName(raw);
    if (byName) return byName.slug;

    return fromPath || raw;
  }

  /* v4.0(meeting-07 C2·C3) — 폼은 start()에서부터 잠겨 있고(setFormLock) 슬롯은 ''(미정)이다.
     .md fetch가 끝나 writeForm()으로 화면을 채운 "뒤에" 슬롯을 id로 정하고(C3) 폼을 연다(C2) → 그다음 복구 모달.
     그래서 (1) 먼저 친 글자가 writeForm에 덮이는 길이 없고 (2) 복구 모달이 뜨기 전에 그 슬롯의 옛 초안이 덮이는 길도 없다.
     실패해도 폼은 연다. 이때도 슬롯은 id다 — 그 id의 초안이 남아 있으면 실패 모달을 닫은 뒤 복구 모달로 먼저 보여 준다
     (파일을 옮겼거나 서버 경로가 어긋나 못 읽은 경우, 사용자의 마지막 원고는 그 초안뿐일 수 있다). */
  function loadForEdit(id) {
    state.mode = 'edit';
    state.originalId = id;
    setStatus('불러오는 중…');

    loadPostAny(id, categoryHintFor(id)).then(function (post) {
      /* created는 원본 그대로 보존한다. 갱신되는 값은 updated뿐이다. */
      state.created = post.meta.created;
      /* v4.3(api.md v1.2 §4-3): 이 화면이 본 디스크 버전. 저장할 때 expectedUpdated로 보낸다 — 그사이 다른 곳에서 저장됐으면 409 stale.
         값은 store.loadPost의 병합 결과(서버가 비교하는 값과 같은 규칙). 비어 있으면 보내지 않는다(비교 생략). */
      state.originalUpdated = post.meta.updated ? String(post.meta.updated) : '';
      state.originalPath = post.path || postPathOf(id, post.meta.category);
      state.originalCategory = catFromPath(state.originalPath) || post.meta.category || '';

      var catValue = pickCategoryValue(post.meta, state.originalPath);
      writeForm(Object.assign({}, post.meta, { category: catValue }), post.body);

      state.idTouched = true;                 // 기존 글의 id는 함부로 바꾸지 않는다
      state.onDisk = true;                    // m9: 삭제 버튼 대상
      showEditBadge(post.meta, state.originalPath);
      renderPreview();
      setStatus('불러왔습니다', false);

      state.slot = id;                        // C3: 슬롯 확정은 화면이 채워진 뒤
      markReady();                            // C2: 이제 연다

      if (catValue !== UNCATEGORIZED && !findCat(catValue) && !PATH_SAFE_RE.test(catValue)) {
        U.toast('이 글의 분류 "' + catValue + '" 는 폴더명 규칙에 맞지 않아요. 분류를 골라 주세요.', 'warn');
      }
      /* writeForm()으로 화면이 채워진 뒤에 부른다 — 비교 기준이 "지금 화면"이어야 하기 때문. */
      applyDraftIfNewer();
    }).catch(function (err) {
      state.onDisk = false;
      state.originalUpdated = '';             // 값을 모른다 — 디스크에 없는 글로 다룬다(저장은 ifNew, 있으면 409 exists가 막는다)
      state.slot = id;
      markReady();
      setStatus('불러오지 못했습니다', false);
      /* 불러오지 못한 글은 "저장됨"(초록 점)이 아니다 — 새 글과 같은 중립 점으로 둔다(v4.0 C6, 계약서 §8). */
      if (dom.status) dom.status.classList.add('is-new');
      var leaving = false;
      Blog.ui.modal({
        title: '글을 불러오지 못했어요',
        text: (err && err.message) || '알 수 없는 오류입니다.',
        actions: [{ label: '새 글로 시작', variant: 'primary', onClick: function () {
          leaving = true;
          window.location.href = 'write.html';
        } }],
        /* 이 화면에 남기로 했으면(Esc·닫기) 이 id의 초안이 있는지 본다 — 폼이 비어 있으니 초안이 있으면 반드시 묻는다. */
        onClose: function () { if (!leaving) applyDraftIfNewer(); }
      });
    });
  }

  function startNew() {
    state.mode = 'new';
    state.slot = 'new';                       // C3: 새 글의 슬롯은 index·분류 로드가 끝난 여기서 정해진다
    /* 목록에서 분류를 고른 채(?cat=) 쓰기로 왔으면 그 분류로 시작한다. */
    selectCategory(queryCategory() || defaultCategorySlug());
    refreshAutoId();
    /* 수정 모드는 loadForEdit가 글 제목으로 바꾼다. 새 글일 때만 사이트명을 반영한다. */
    document.title = '새 글 쓰기 · ' + siteInfo().title;
    /* v4.0(meeting-07 C6): 저장된 적 없는 새 글은 초록 점("저장됨"의 색)이 아니라 중립 점이다 — .is-new(계약서 §8).
       초안을 불러오거나(applyDraftIfNewer) 타이핑·저장하면 setStatus가 뗀다. */
    setStatus('새 글. 아직 저장하지 않았어요', false);
    if (dom.status) dom.status.classList.add('is-new');
    markReady();                              // C2: 폼을 연다 — 복구 모달보다 먼저(모달이 배경을 inert로 덮으니 그 사이 입력은 없다)
    applyDraftIfNewer();
    renderPreview();
  }

  /* ---------- 부트스트랩 ---------- */

  /* 사이트명의 진실은 index.json이다(store가 읽으면서 CFG.site도 함께 갱신한다).
     app.js·post.js는 이미 같은 일을 한다. 에디터만 빠져 있어서, 사이트 이름을 바꾸면
     이 화면의 로고와 푸터만 옛 이름으로 남아 있었다. */
  function siteInfo() {
    return (state.indexData && state.indexData.site) || CFG.site;
  }

  function fillSite() {
    var site = siteInfo();
    U.qsa('[data-site-title]').forEach(function (node) { node.textContent = site.title; });
  }

  /* ---------- 툴바 키보드 (roving tabindex) ----------
     버튼 12개(v3.8)가 전부 탭 스톱이면 제목칸에서 본문까지 Tab을 13번 눌러야 한다.
     WAI-ARIA toolbar 패턴: 탭 스톱은 언제나 하나이고, 안에서는 좌우 화살표로 옮겨 다닌다.
     (write.html의 role="toolbar"와 짝이다. 한쪽만 바꾸면 안내와 동작이 어긋난다.) */

  function toolbarButtons() {
    return dom.toolbar ? U.qsa('.md-btn', dom.toolbar) : [];
  }

  function setToolbarStop(btn) {
    toolbarButtons().forEach(function (b) { b.setAttribute('tabindex', b === btn ? '0' : '-1'); });
  }

  function focusToolbarAt(index) {
    var items = toolbarButtons();
    if (!items.length) return;
    var i = (index + items.length) % items.length;
    setToolbarStop(items[i]);
    items[i].focus();
  }

  function initToolbarRoving() {
    var items = toolbarButtons();
    if (!items.length) return;
    setToolbarStop(items[0]);

    U.on(dom.toolbar, 'keydown', function (e) {
      var list = toolbarButtons();
      var at = list.indexOf(document.activeElement);
      if (at === -1) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusToolbarAt(at + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); focusToolbarAt(at - 1); }
      else if (e.key === 'Home') { e.preventDefault(); focusToolbarAt(0); }
      else if (e.key === 'End') { e.preventDefault(); focusToolbarAt(list.length - 1); }
    });

    /* 마지막으로 쓴 버튼이 다음번 탭 스톱이 된다(패턴 그대로). */
    U.on(dom.toolbar, 'click', function (e) {
      var btn = e.target.closest ? e.target.closest('.md-btn') : null;
      if (btn) setToolbarStop(btn);
    });
  }

  function bindCategory() {
    U.on(dom.category, 'change', function () {
      clearFieldError(dom.category, dom.categoryErr);      // v4.1: 셀렉트는 change에서 오류를 지운다
      onEdit();
    });

    U.on(dom.btnNewCat, 'click', function () {
      if (dom.catNew && dom.catNew.hasAttribute('hidden')) openNewCat();
      else closeNewCat(true);
    });

    U.on(dom.btnAddCat, 'click', addCategory);
    U.on(dom.btnCancelCat, 'click', function () { closeNewCat(true); });

    /* 표시 이름에서 폴더명을 제안한다. 한글이면 결과가 비므로 사용자가 직접 지어야 한다. */
    U.on(dom.newCatName, 'input', function () {
      clearNewCatError();                                  // v4.1: 두 칸 중 어느 것을 고쳐도 #fNewCatError를 지운다
      if (newCatSlugTouched) return;
      dom.newCatSlug.value = U.slugAscii(dom.newCatName.value);
    });
    U.on(dom.newCatSlug, 'input', function () { clearNewCatError(); newCatSlugTouched = true; });

    /* 새 분류 폼 안에서는 Enter로 추가, ESC로 취소.

       ① IME 가드 — 한글 이름을 치고 조합을 확정하려고 누른 Enter를 여기서 가로채면
          조합이 깨진 채로 addCategory()가 돌아 "알고리즘"이 "알고리즤" 같은 이름으로 만들어진다.
          본문 쪽(onBodyKeydown)과 같은 가드를 둔다(M3-11).
       ② 버튼 위의 Enter는 그 버튼의 클릭이다. 여기서 먼저 가로채면
          '취소'에 포커스를 두고 Enter를 눌렀는데 '추가'가 실행된다(M3-11). */
    U.on(dom.catNew, 'keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Escape') { e.preventDefault(); closeNewCat(true); return; }
      if (e.key !== 'Enter') return;
      var tag = e.target && e.target.tagName;
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      addCategory();
    });
  }

  function bind() {
    U.on(dom.body, 'input', onBodyInput);
    U.on(dom.body, 'keydown', onBodyKeydown);
    /* 본문을 떠나면 Tab 탈출 대기도 함께 푼다. 돌아왔을 때 첫 Tab이
       예고 없이 포커스를 옮기면 "Tab은 들여쓰기"라는 약속이 깨진다. */
    U.on(dom.body, 'blur', function () { setTabEscape(false); });

    /* v4.1(#143): 커서 위치 "N행 M열". 한 프레임에 여러 이벤트가 와도 rAF 하나로 묶는다(scheduleCaret).
       keydown도 듣는다 — 화살표를 누르고 있는 동안에는 keyup이 오지 않는다(rAF 콜백은 키의 기본 동작 뒤에 돈다). */
    ['keydown', 'keyup', 'mouseup', 'select', 'input', 'focus'].forEach(function (type) {
      U.on(dom.body, type, scheduleCaret);
    });
    /* v4.1(#144): 나란히 보기에서 미리보기가 본문 스크롤을 따라간다(한 방향). passive — 스크롤을 막지 않는다. */
    U.on(dom.body, 'scroll', onBodyScroll, { passive: true });

    [dom.title, dom.summary, dom.tags].forEach(function (field) {
      U.on(field, 'input', onEdit);
    });
    U.on(dom.title, 'input', function () { clearFieldError(dom.title, dom.titleErr); });
    U.on(dom.pinned, 'change', onEdit);

    U.on(dom.title, 'input', refreshAutoId);
    U.on(dom.id, 'input', function () {
      state.idTouched = true;
      clearFieldError(dom.id, dom.idErr);                  // v4.3: 다른 칸과 같다 — 고치면 사라진다(세부 설정은 다시 접지 않는다)
      onEdit();
    });

    bindCategory();

    U.on(dom.toolbar, 'click', function (e) {
      var btn = e.target.closest('.md-btn');
      if (!btn) return;
      var action = TOOLBAR[btn.getAttribute('data-md')];
      if (action) action();
    });

    /* v4.1(#141): 보기 방식 세 칸. 포커스는 누른 버튼에 머문다(버튼 클릭의 기본). */
    U.on(dom.viewSwitch, 'click', onViewClick);
    U.on(document, 'focusin', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.view-btn') : null;
      viewFocus = btn ? btn.getAttribute('data-view') : '';
    });

    /* 저장 버튼은 항상 보이고 "눌릴 수 있는지"(disabled)만 서버 상태가 정한다(계약서 §6-1). disabled면 클릭 이벤트가 나지 않는다. */
    U.on(dom.saveBtn, 'click', saveToServer);
    U.on(dom.retry, 'click', retryServer);
    U.on(dom.deleteBtn, 'click', confirmDelete);

    /* Ctrl+S는 브라우저 "페이지 저장"을 가로챈다 — 막지 않으면 사용자는 .html을 내려받고 글은 저장되지 않는다.
       연결됨 → 저장. 서버 없음·확인 중 → preventDefault + 토스트(#editorServer와 같은 문자열, §6-1).
       disabled 버튼은 클릭 이벤트가 나지 않지만 키는 여기 keydown에서 잡는다.
       모달이 떠 있는 동안에는 아무것도 하지 않는다 — 확인창의 질문(게시일 확인 등)을 건너뛴 셈이 되기 때문.
       브라우저의 "페이지 저장"만은 그대로 막는다(눌린 사실을 없던 일로 만드는 편이 헷갈리지 않는다).
       v4.3(D21): 글자 판정은 keyIs — 한글 자판에서 e.key가 'ㄴ'·'Process'로 와도 물리 키 KeyS로 잡는다(가장 위험한 키가 가장 먼저 새던 자리).
       보조키 조건(Ctrl 또는 Cmd)은 v3.9 그대로 — Alt·Shift 조건을 더하지 않는다. */
    U.on(document, 'keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || !keyIs(e, 's')) return;
      e.preventDefault();
      if (document.body.classList.contains('modal-open')) return;
      /* C2: 불러오는 중·삭제 중에는 저장하지 않는다(폼이 잠겨 있다). 눌린 사실은 말해 준다 — 조용히 무시하면 저장된 줄 안다. */
      if (state.deleting) { U.toast('삭제하는 중이라 저장할 수 없어요', 'warn'); return; }
      if (state.locked) { U.toast('글을 불러오는 중이에요. 끝나면 저장할 수 있어요', 'warn'); return; }
      if (!state.server) { U.toast(SERVER_OFF_TEXT, 'warn'); return; }
      saveToServer();
    });

    /* 저장하지 않은 변경이 있으면 떠나기 전에 물어본다.
       묻기 전에 먼저 초안을 확정해 둔다 — 여기서 저장하지 않으면 debounce(800ms)가
       기다리던 마지막 입력이 그대로 사라진다(M6). */
    U.on(window, 'beforeunload', function (e) {
      flushDraft();
      if (!state.dirty) return undefined;
      e.preventDefault();
      e.returnValue = '';
      return '';
    });

    /* beforeunload는 모바일 사파리·안드로이드에서 아예 불리지 않는 경우가 많다.
       탭이 백그라운드로 밀리거나(pagehide) 화면에서 사라질 때(visibilitychange)도 흘려보낸다.
       flushDraft()는 dirty가 아닐 때 아무 일도 하지 않으므로 중복 호출은 안전하다. */
    U.on(window, 'pagehide', flushDraft);
    U.on(document, 'visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushDraft();
    });
  }

  /* 분류가 0개일 때 "고장난 건가?"로 읽히지 않게 한 번만 알린다. 글쓰기를 막지는 않는다.
     이 블로그는 분류 0개에서 시작하는 게 정상이므로 이건 오류 안내가 아니라 다음 행동 안내다. */
  function noticeCategoryState() {
    if (cats.list.length) return;
    if (cats.error && cats.error.code && cats.error.code !== 'notfound') {
      U.toast('분류 목록을 불러오지 못했어요(' + cats.error.code + '). "+ 새 분류"로 만들 수 있습니다.', 'warn');
      return;
    }
    U.toast('분류가 아직 없어요. "+ 새 분류"로 만들면 저장할 때 categories.json에도 함께 등록됩니다.', 'warn');
  }

  /* ---------- 사이드바(v3.2) ----------
     세 페이지가 같은 분류 트리를 보여 준다. 여기서는 index.json을 받은 뒤 한 번 그리면 된다
     (쓰기 화면이라 현재 글·현재 분류가 없다 → activeId/activeCat 모두 null).
     분류 순서는 app.js byIndexOrder와 같은 규칙(order → 글 수 내림차순 → 이름). 규칙이 갈리면
     같은 사이드바가 페이지마다 다른 순서로 보인다.
     에디터의 본업(작성·저장)과 무관하므로 무엇이 실패하든 여기서 삼킨다 —
     ui.js가 옛 버전이라 renderSide가 없어도, 트리 그리기가 던져도 에디터는 그대로 돌아야 한다. */
  function bySideOrder(a, b) {
    if (a.order !== b.order) return a.order - b.order;
    if (a.count !== b.count) return b.count - a.count;
    return String(a.name).localeCompare(String(b.name), 'ko');
  }

  function drawSide(data) {
    try {
      var ui = Blog.ui;
      if (!ui || typeof ui.renderSide !== 'function') return;
      var posts = (data && Array.isArray(data.posts)) ? data.posts : [];
      var cats = posts.length && typeof store.categoryList === 'function'
        ? store.categoryList(posts).slice().sort(bySideOrder)
        : [];
      ui.renderSide({ posts: posts, cats: cats, activeId: null, activeCat: null });
    } catch (err) {
      /* 사이드바는 부가 기능이다. 실패를 콘솔에만 남기고 에디터는 계속 간다. */
      if (window.console && console.warn) console.warn('[editor] 사이드바 그리기 실패:', err);
    }
  }

  /* ---------- 배포 도메인 잠금 ----------
     관리자 판정이 false(= localhost가 아님)면 안내 문단(#editorVisitor, 계약서 §6의 .editor-visitor)만 남긴다.
     폼·툴바·미리보기(.editor)는 마크업에서 data-admin-only + hidden으로 시작하고, admin.init()이 판정 결과에 따라
     노드째 지우거나(방문자) hidden을 뗀다(관리자) — 계약서 §3·§8-2 예외(v3.8). 같은 일을 두 곳에서 하지 않으므로
     여기서는 .editor를 건드리지 않는다. 에디터 리스너는 하나도 붙이지 않는다.

     안내 블록이 마크업에 없으면(다른 사람이 지웠을 때) 같은 문장을 만들어 넣는다.
     빈 <main>은 "고장"으로 읽힌다. 문구는 write.html의 것과 같아야 한다. */
  function lockForVisitor() {
    var note = dom.visitorNote;
    if (!note) {
      note = U.el('div', { class: 'editor-visitor', id: 'editorVisitor' }, [
        U.el('p', null, [
          '이 페이지는 로컬에서만 동작합니다. 글은 posts/ 폴더에 넣어 배포합니다. ',
          U.el('a', { href: 'index.html', text: '글 목록으로' })
        ])
      ]);
      var main = document.getElementById('main');
      if (main) main.appendChild(note);
    }
    U.setHidden(note, false);

    /* 헤더·푸터의 사이트명은 다른 페이지와 같은 진실(index.json)을 따른다.
       에디터 기능과 무관한 셸 표시일 뿐이고, 실패해도 config 기본값이 그대로 남는다. */
    promised(function () { return store.loadIndex(); }).then(function (data) {
      state.indexData = data;
      fillSite();
    }).catch(function () { /* 기본 사이트명 유지 */ }).then(function () {
      /* 사이드바는 분류 목록까지 받은 뒤 그린다(글 0편 분류도 보여야 세 페이지가 같아 보인다).
         store.loadCategories()는 reject하지 않지만, 혹시 던져도 사이드바만 비고 안내문은 남는다. */
      return promised(function () { return store.loadCategories(); }).catch(function () { return null; });
    }).then(function () {
      drawSide(state.indexData);
    });
  }

  function start() {
    dom.split = document.getElementById('editorSplit');
    dom.title = document.getElementById('fTitle');
    dom.summary = document.getElementById('fSummary');
    dom.tags = document.getElementById('fTags');
    dom.category = document.getElementById('fCategory');
    dom.pinned = document.getElementById('fPinned');
    dom.id = document.getElementById('fId');
    dom.body = document.getElementById('fBody');
    dom.preview = document.getElementById('preview');
    dom.toolbar = document.getElementById('mdToolbar');
    dom.status = document.getElementById('editorStatus');
    /* v4.1(계약서 §6-0): 작업 줄 — 보기 방식 세 칸 · 계기판. 미리보기 창(#previewPane)은 스크롤 따라가기의 대상. */
    dom.viewSwitch = U.qs('.view-switch');
    dom.viewBtns = dom.viewSwitch ? U.qsa('.view-btn', dom.viewSwitch) : [];
    dom.chars = document.getElementById('editorChars');
    dom.read = document.getElementById('editorRead');
    dom.caret = document.getElementById('editorCaret');
    dom.previewPane = document.getElementById('previewPane');
    /* v4.1: 칸 아래 오류 줄 넷(§6-0 오류 규칙) */
    dom.titleErr = document.getElementById('fTitleError');
    dom.categoryErr = document.getElementById('fCategoryError');
    dom.newCatErr = document.getElementById('fNewCatError');
    dom.bodyErr = document.getElementById('fBodyError');
    /* v4.3(D1): 다섯째 오류 줄 — 같은 id의 글이 이미 있을 때. 칸이 접힌 세부 설정 안이라 보일 때 details를 연다(showFieldError). */
    dom.idErr = document.getElementById('fIdError');
    dom.more = document.getElementById('editorMore');
    /* v3.9(계약서 §6-1): 저장 버튼은 항상 보이고 disabled로 시작, 서버 표시·다시 연결은 hidden으로 시작 — 판정 전 "확인 중". */
    dom.saveBtn = document.getElementById('btnSave');
    dom.server = document.getElementById('editorServer');
    dom.retry = document.getElementById('btnRetry');
    /* v4.0(m9) → v4.1: 삭제는 세부 설정(.editor-more) 안. hidden으로 시작 — syncActionButtons가 디스크의 글 + 서버 판정 뒤에만 보이고,
       그때 세부 설정의 요약 문구(#editorMoreSummary)도 "파일 id와 글 삭제"로 바꾼다. 조회는 id 그대로(자리만 바뀌었다). */
    dom.deleteBtn = document.getElementById('btnDelete');
    dom.moreSummary = document.getElementById('editorMoreSummary');
    dom.editorRoot = U.qs('.editor');
    dom.bodyHint = document.getElementById('bodyHint');
    dom.modeBadge = document.getElementById('editorMode');
    dom.visitorNote = document.getElementById('editorVisitor');
    /* 상태줄의 본문 문장은 마크업 초기값("준비 중…")에서 시작한다 — 보류 안내(#147)가 붙을 때 앞 문장이 비지 않게. */
    if (dom.status) statusText = dom.status.textContent;

    dom.catNew = document.getElementById('catNew');
    dom.btnNewCat = document.getElementById('btnNewCat');
    dom.btnAddCat = document.getElementById('btnAddCat');
    dom.btnCancelCat = document.getElementById('btnCancelCat');
    dom.newCatName = document.getElementById('fNewCatName');
    dom.newCatSlug = document.getElementById('fNewCatSlug');

    Blog.ui.initShell();
    var admin = Blog.admin.init();

    /* 배포 도메인 잠금 — 사용자 요구: 배포 버전은 보기만 가능해야 한다.
       관리자 판정(= 로컬 호스트)이 아니면 에디터를 초기화하지 않는다.
       리스너(자동저장·단축키·beforeunload)를 하나도 붙이기 전에 여기서 끝낸다. */
    if (!admin) { lockForVisitor(); return; }

    /* C2: 리스너보다 먼저 잠근다. index·분류 로드(새 글) 또는 .md fetch(수정 모드)가 끝나면 startNew()/loadForEdit()가 연다. */
    setFormLock(true);
    bind();
    initToolbarRoving();
    setViewMode(autoViewMode());
    watchWidth();

    /* 로컬 에디터 서버 감지(docs/api.md §4-1). 글 로드와 독립이라 기다리지 않는다 —
       2초 안에 답이 없으면 "서버 없음"(저장 버튼 disabled + 안내 + 다시 연결), 답이 오면 "연결됨"(disabled 해제). */
    detectServer();

    /* index.json은 사이트명·사이드바가 읽으므로 미리 받아 둔다. 실패해도 작성은 가능해야 한다.
       loadCategories()는 절대 reject하지 않으므로 Promise.all이 중간에 끊기지 않는다. */
    var indexJob = promised(function () { return store.loadIndex(); }).then(function (data) {
      state.indexData = data;
    }).catch(function () {
      state.indexData = null;
    });

    Promise.all([indexJob, loadCategories()]).then(function () {
      /* C2: 폼은 잠겨 있고 아래 startNew()/loadForEdit()만 연다. 그 앞의 부가 작업이 던져도 거기까지는 반드시 가야 한다 —
         아니면 에디터가 영영 "준비 중…"에 잠긴다. */
      try {
        fillSite();
        fillCategoryOptions();
        noticeCategoryState();
        /* 분류 목록까지 받은 뒤에 그린다 — store.categoryList가 등록된 분류(글 0편 포함)를 알려면
           loadCategories()가 먼저 끝나 있어야 한다. indexJob은 실패를 이미 삼켰으니 결과만 본다. */
        drawSide(state.indexData);
      } catch (err) {
        if (window.console && console.warn) console.warn('[editor] 초기화 일부 실패:', err);
      }

      var id = U.getQuery().id;
      if (id) loadForEdit(id);
      else startNew();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
