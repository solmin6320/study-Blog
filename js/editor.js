/* editor.js — write.html 전용. 마크다운 작성, 실시간 미리보기, 자동 임시저장,
   .md + index.json (+ categories.json) 내보내기, ?id= 수정 모드.
   이 화면이 "공부한 걸 블로그에 넣는" 유일한 통로다. 실수로 글을 잃는 경로가 없어야 한다.

   글은 posts/<분류slug>/<id>.md 에 들어간다(계약서 §9-3).
   분류 목록은 posts/categories.json 이 진실이지만, 그 파일이 없거나 비어 있어도 에디터는
   끝까지 동작해야 한다 — 이 블로그의 분류는 사용자가 직접 만드는 것이고 시작은 0개다.
   목록이 비면 "미분류 한 줄 + 새 분류 버튼"만으로 글을 끝까지 쓸 수 있어야 한다.

   v3.0: 글·분류의 color 필드는 폐기됐다(계약서 §9-2). 메모지 카드가 사라져 색이
   놓일 면이 없다. 여기에 색 선택 UI를 되살리지 않는다. */
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

  var dom = {};
  var state = {
    mode: 'new',          // 'new' | 'edit'
    slot: 'new',          // 초안 저장 키. 세션 내내 바뀌지 않아야 초안이 흩어지지 않는다.
    created: '',          // 수정 모드에서 보존해야 하는 원본 게시 시각
    originalId: '',
    originalCategory: '',
    originalPath: '',     // 실제로 읽어 온 경로. 분류를 바꾸면 "이 파일을 지우라"고 알려 줘야 한다.
    idTouched: false,     // 사용자가 id를 직접 건드렸으면 자동 생성을 멈춘다
    modeTouched: false,   // 보기 모드를 손수 바꿨으면 화면 폭 변화가 덮어쓰지 않는다
    dirty: false,         // 내보내지 않은 변경
    exporting: false,     // 내려받기 진행 중. 같은 파일을 두 번 내보내지 못하게 막는다
    indexData: null,
    indexError: null      // index.json을 왜 못 읽었는지. 내보내기 안전장치의 판단 근거가 된다.
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

  /* config의 기본 분류가 slug일 수도, v1의 한글 표시 이름일 수도 있다. 둘 다 받아 준다. */
  function defaultCategorySlug() {
    var want = String((CFG.editor && CFG.editor.defaultCategory) || '').trim();
    var hit = findCat(want) || findCatByName(want);
    if (hit) return hit.slug;
    if (cats.list.length) return cats.list[0].slug;
    return UNCATEGORIZED;
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
     보이게 남겨 두고, 내보낼 때 폴더로 쓸 수 없다는 사실을 알려 준다. */
  function selectCategory(value) {
    if (!dom.category) return;
    var v = String(value || '').trim();
    if (!v) v = defaultCategorySlug();
    if (!hasOption(dom.category, v)) {
      dom.category.appendChild(U.el('option', {
        value: v, text: v + ' (categories.json에 없음)'
      }));
    }
    dom.category.value = v;
    syncCategoryHint();
  }

  function chosenCategory() {
    var v = dom.category ? String(dom.category.value || '').trim() : '';
    return v || UNCATEGORIZED;
  }

  function syncCategoryHint() {
    if (!dom.category) return;
    dom.category.setAttribute('title',
      '이 글은 posts/' + chosenCategory() + '/ 폴더에 저장됩니다');
  }

  /* ---------- 새 분류 만들기 ----------
     이 블로그의 분류는 전부 여기서 태어난다. categories.json은 빈 배열에서 시작하고,
     사용자가 이 폼으로 만든 것만 들어간다. 그래서 0개 상태에서도 막힘없이 돌아야 한다. */

  var newCatSlugTouched = false;

  function openNewCat() {
    if (!dom.catNew) return;
    U.setHidden(dom.catNew, false);
    if (dom.btnNewCat) dom.btnNewCat.setAttribute('aria-expanded', 'true');
    dom.newCatName.value = '';
    dom.newCatSlug.value = '';
    newCatSlugTouched = false;
    dom.newCatName.focus();
  }

  function closeNewCat(returnFocus) {
    if (!dom.catNew) return;
    U.setHidden(dom.catNew, true);
    if (dom.btnNewCat) dom.btnNewCat.setAttribute('aria-expanded', 'false');
    if (returnFocus && dom.btnNewCat) dom.btnNewCat.focus();
  }

  /* 왜 막혔는지 말해 주지 않으면 사용자는 같은 값을 계속 다시 넣는다. */
  function rejectNewCat(node, message) {
    U.toast(message, 'warn');
    if (node) { node.focus(); if (node.select) node.select(); }
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
        '폴더명은 영문 소문자·숫자·하이픈만 쓸 수 있어요. 하이픈으로 시작하거나 끝날 수 없습니다.');
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
    U.toast('분류를 만들었어요 · 내보낼 때 categories.json도 함께 내려받습니다', 'ok');
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

  function writeForm(meta, body) {
    dom.id.value = meta.id || '';
    dom.title.value = meta.title || '';
    dom.summary.value = meta.summary || '';
    dom.tags.value = (meta.tags || []).join(', ');
    selectCategory(meta.category || '');
    dom.pinned.checked = Boolean(meta.pinned);
    dom.body.value = body || '';
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
    dom.id.value = buildId(dom.title.value, null);
  }

  /* ---------- 상태 표시 ---------- */

  /* #editorStatus는 aria-live 영역이다. 같은 문장을 다시 써 넣으면 스크린리더가 또 읽는다.
     타이핑 한 글자마다 "저장 중…"/"임시저장됨"이 번갈아 낭독되면 글을 쓸 수가 없으므로,
     문구가 실제로 달라질 때만 DOM을 건드린다(= 상태가 바뀔 때만 발화한다). */
  function setStatus(text, dirty) {
    if (!dom.status) return;
    if (dom.status.textContent !== text) dom.status.textContent = text;
    if (typeof dirty === 'boolean') {
      state.dirty = dirty;
      dom.status.classList.toggle('is-dirty', dirty);
    }
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
  }, CFG.debounce.preview);

  /* ---------- 자동 임시저장 ---------- */

  /* 새로 만든 분류도 초안에 같이 담는다. 새로고침 한 번에 사라지면
     사용자는 폴더명을 다시 지어야 하고, 그 사이 글의 분류가 어긋난다. */
  function addedCatObjects() {
    return cats.added.map(function (slug) { return findCat(slug); }).filter(Boolean);
  }

  function saveDraftNow() {
    var form = readForm();
    var ok = store.draft.save(state.slot, {
      mode: state.mode,
      created: state.created,
      originalId: state.originalId,
      originalCategory: state.originalCategory,
      originalPath: state.originalPath,
      newCats: addedCatObjects(),
      form: form
    });
    setStatus(ok ? '임시저장됨 · 아직 파일로 내보내지 않았어요' : '임시저장 실패(브라우저 저장소 차단)', true);
    return ok;
  }

  var autosave = U.debounce(saveDraftNow, CFG.debounce.draft);

  /* 대기 중인 자동저장을 지금 당장 실행한다.
     debounce가 800ms를 기다리는 동안 탭이 닫히면 그 사이의 입력은 어디에도 남지 않는다.
     떠나는 순간(beforeunload / pagehide / 탭 숨김)에 반드시 한 번 흘려보낸다. */
  function flushDraft() {
    if (!state.dirty) return;            // 바꾼 게 없으면 빈 초안을 만들지 않는다
    if (autosave.cancel) autosave.cancel();
    saveDraftNow();
  }

  function onEdit() {
    /* 이미 dirty면 "저장 중…"을 다시 쓰지 않는다 — 키 입력마다 낭독되는 걸 막는다. */
    if (!state.dirty) setStatus('저장 중…');
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
    var applied = false;

    /* execCommand는 "현재 선택 영역"에 끼워 넣는다. 먼저 바꿀 범위를 선택해 둬야 한다. */
    target.focus();
    target.setSelectionRange(start, end);

    if (typeof document.execCommand === 'function') {
      try {
        applied = document.execCommand('insertText', false, text) === true;
      } catch (err) {
        applied = false;
      }
      /* true를 돌려주고도 실제로는 안 넣는 브라우저가 있다. 결과를 확인하고 아니면 폴백. */
      if (applied && target.value.slice(start, start + text.length) !== text) applied = false;
    }

    if (!applied) {
      var value = target.value;
      target.value = value.slice(0, start) + text + value.slice(end);
    }

    setSelection(
      selStart === undefined ? start + text.length : selStart,
      selEnd === undefined ? start + text.length : selEnd
    );
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
    var start = value.lastIndexOf('\n', dom.body.selectionStart - 1) + 1;
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

  function insertCodeBlock() {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var selected = dom.body.value.slice(start, end) || '// 코드';
    var fence = '```js\n' + selected + '\n```\n';
    var langAt = start + 3;
    replaceRange(start, end, fence, langAt, langAt + 2);
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

    var colSel = U.el('select', { class: 'field', title: '열 수' });
    var rowSel = U.el('select', { class: 'field', title: '머리글을 뺀 본문 행 수' });
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
    table: openTableDialog,
    hr: function () { insertBlock('---\n\n'); }
  };

  /* ---------- 키보드 ----------

     Tab을 조건 없이 가로채면 본문이 키보드 덫이 된다(WCAG 2.1.2 Level A · T3-1).
     실제로 본문에 들어온 키보드 사용자는 내보내기 버튼조차 누를 수 없었고,
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

  /* #editorStatus는 눈에 보이는 유일한 상태줄이자 aria-live 영역이다.
     여기에 잠깐 안내를 띄우고, 그 사이 자동저장이 더 새로운 소식을 써넣었으면 되돌리지 않는다. */
  function hintStatus(text) {
    if (!dom.status) return;
    if (hintText === null) statusBefore = dom.status.textContent;
    hintText = text;
    setStatus(text);
  }

  function restoreStatus() {
    if (hintText === null) return;
    var shown = hintText;
    var was = statusBefore;
    hintText = null;
    statusBefore = null;
    if (was && dom.status && dom.status.textContent === shown) setStatus(was);
  }

  function setTabEscape(on) {
    if (on === tabEscape) return;
    tabEscape = on;
    if (on) hintStatus('탈출 대기 · 다음 Tab은 들여쓰기 대신 다음 항목으로 이동합니다');
    else restoreStatus();
  }

  /* 덫에 걸린 사람은 "Esc를 누르라"는 말을 어디선가 한 번은 봐야 한다.
     placeholder는 글을 쓰기 시작하면 사라지므로, 첫 Tab 때 상태줄로도 알린다. */
  function teachTab() {
    if (tabTaught) return;
    tabTaught = true;
    hintStatus('Tab은 들여쓰기입니다 · 포커스를 옮기려면 Esc를 누른 뒤 Tab');
  }

  function onBodyKeydown(e) {
    /* 한글 조합 중에는 키를 가로채지 않는다.
       조합이 끝나기 전의 Tab/Ctrl+B는 IME가 "조합 확정"으로 쓰는 키일 수 있어서,
       여기서 preventDefault하면 조합 중이던 글자가 통째로 깨지거나 중복 입력된다. */
    if (e.isComposing || e.keyCode === 229) return;

    /* Esc = "다음 Tab은 나가겠다". 기본 동작은 막지 않는다(IME 조합 취소 등을 빼앗지 않기 위해). */
    if (e.key === 'Escape') { setTabEscape(true); return; }

    /* Tab이 포커스를 옮겨 버리면 코드 들여쓰기를 쓸 수 없다. textarea 안에서만 가로챈다.
       단, 탈출 대기 상태라면 가로채지 않고 그대로 흘려보낸다(= 브라우저가 포커스를 옮긴다). */
    if (e.key === 'Tab') {
      if (tabEscape) { setTabEscape(false); return; }
      e.preventDefault();
      var start = dom.body.selectionStart;
      var end = dom.body.selectionEnd;
      var value = dom.body.value;
      var multiline = value.slice(start, end).indexOf('\n') !== -1;

      if (!multiline && !e.shiftKey) {
        replaceRange(start, end, '  ');
        /* 안내는 들여쓰기를 넣은 "뒤"에 띄운다. 먼저 띄우면 replaceRange가 부르는
           onEdit()의 "저장 중…"이 곧바로 덮어써서 아무도 보지 못한다. */
        teachTab();
        return;
      }
      var lineStart = value.lastIndexOf('\n', start - 1) + 1;
      var lineEnd = value.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = value.length;
      var block = value.slice(lineStart, lineEnd);
      var next = block.split('\n').map(function (line) {
        if (e.shiftKey) return line.replace(/^ {1,2}/, '');
        return '  ' + line;
      }).join('\n');
      replaceRange(lineStart, lineEnd, next, lineStart, lineStart + next.length);
      teachTab();
      return;
    }

    /* 탈출 대기 중에 글자를 치면 "계속 쓰겠다"는 뜻이다. 대기를 풀어 Tab을 들여쓰기로 되돌린다.
       (보조키 자체를 누른 것만으로는 풀지 않는다 — Shift+Tab으로 앞으로 나가는 길을 막게 된다.) */
    if (tabEscape && ['Shift', 'Control', 'Alt', 'Meta'].indexOf(e.key) === -1) setTabEscape(false);

    if (!(e.ctrlKey || e.metaKey)) return;
    var key = e.key.toLowerCase();
    if (key === 'b') { e.preventDefault(); TOOLBAR.bold(); }
    else if (key === 'i') { e.preventDefault(); TOOLBAR.italic(); }
  }

  /* ---------- 보기 모드 ----------
     360px에서 좌우 분할을 강제하면 둘 다 못 읽는다. 좁으면 '작성만'으로 시작하고,
     화면 폭이 바뀌면 따라간다 — 단, 사용자가 손수 고른 뒤에는 건드리지 않는다. */

  var MODES = ['split', 'write', 'preview'];
  var MODE_LABEL = { split: '나란히', write: '작성만', preview: '미리보기만' };
  /* CSS가 나란히 보기로 바뀌는 지점이 1024px이다(layout.css). 그보다 좁으면 작성만 띄운다. */
  var wideMq = window.matchMedia('(min-width: 1024px)');

  function setViewMode(mode) {
    dom.split.setAttribute('data-mode', mode);
    if (dom.previewToggle) {
      var next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      var label = MODE_LABEL[next] + ' 보기';
      dom.previewToggle.textContent = label;
      /* WCAG 2.5.3(Label in Name): 접근명은 화면에 보이는 글자를 그대로 품어야 한다.
         음성 명령 사용자가 "나란히 보기"라고 말했을 때 이 버튼이 눌려야 하기 때문이다.
         예전 값("나란히 로 전환")은 화면 글자를 포함하지 않아 이름과 명령이 어긋났다. */
      dom.previewToggle.setAttribute('aria-label', label + '로 전환 (지금: ' + MODE_LABEL[mode] + ')');
      dom.previewToggle.setAttribute('title', '지금: ' + MODE_LABEL[mode] + ' · 누르면 ' + MODE_LABEL[next]);
    }
  }

  function autoViewMode() { return wideMq.matches ? 'split' : 'write'; }

  function watchWidth() {
    var onChange = function () { if (!state.modeTouched) setViewMode(autoViewMode()); };
    if (wideMq.addEventListener) wideMq.addEventListener('change', onChange);
    else if (wideMq.addListener) wideMq.addListener(onChange);
  }

  /* ---------- 내보내기 ---------- */

  function normalizeId(raw, title, createdIso) {
    var id = U.slugAscii(raw);
    if (!id) id = buildId(title, createdIso);
    /* 날짜 접두사가 없으면 붙여 준다. 파일 목록이 날짜순으로 정렬돼야 관리가 쉽다. */
    if (!/^\d{4}-\d{2}-\d{2}-/.test(id)) {
      id = String(createdIso || U.nowIsoKst()).slice(0, 10) + '-' + id;
    }
    return id;
  }

  function validate(form) {
    if (!form.title) {
      U.toast('제목을 입력해 주세요', 'warn');
      dom.title.focus();
      return false;
    }
    if (!form.body.trim()) {
      U.toast('본문이 비어 있어요', 'warn');
      dom.body.focus();
      return false;
    }
    return true;
  }

  /* 폴더명이 될 수 없는 분류로는 내보내지 않는다.
     posts/블로그/ 같은 경로는 만들 수는 있어도 주소가 깨져 읽히고 되돌리기 어렵다. */
  function ensureUsableCategory(onOk) {
    var cat = chosenCategory();
    /* 새로 만들 때보다는 느슨하게 본다. 이미 categories.json에 있는 값(밑줄 포함)까지
       막으면 사용자가 직접 손으로 넣은 분류를 에디터가 거부하게 된다. */
    if (cat === UNCATEGORIZED || findCat(cat) || PATH_SAFE_RE.test(cat)) { onOk(); return; }

    Blog.ui.modal({
      title: '이 분류는 폴더명으로 쓸 수 없어요',
      text: '"' + cat + '" 은(는) 폴더명 규칙(영문 소문자·숫자·하이픈)에 맞지 않습니다.\n'
        + '글은 posts/<폴더명>/ 안에 들어가야 해서 이대로는 경로를 만들 수 없어요.\n'
        + '분류를 고르거나 "+ 새 분류"로 만들어 주세요.',
      actions: [
        {
          label: '미분류로 내보내기', variant: 'ghost', onClick: function () {
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

  /* 다운로드 트리거가 예외 없이 끝났는지만 알 수 있다.
     브라우저가 실제로 파일을 저장했는지는 어떤 API로도 확인할 수 없다 —
     그래서 여기서 true를 돌려받아도 "초안을 지워도 된다"는 뜻은 아니다(M7).
     최종 확인은 사용자가 내보내기 안내 모달에서 직접 눌러 준다. */
  function triggerDownload(file) {
    try {
      U.download(file.name, file.text, file.mime);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* 여러 파일을 한꺼번에 내려받으면 일부 브라우저가 두 번째부터 차단한다. 살짝 띄운다.
     첫 파일은 사용자 클릭과 같은 흐름에서 즉시 내보낸다(제스처 밖으로 나가면 차단될 수 있다).
     결과: { ok, failed:[파일명] } — 하나라도 예외가 났으면 ok:false. */
  function downloadAll(files) {
    var failed = [];
    if (!files.length) return Promise.resolve({ ok: false, failed: [] });

    if (!triggerDownload(files[0])) failed.push(files[0].name);
    var rest = files.slice(1);
    if (!rest.length) return Promise.resolve({ ok: failed.length === 0, failed: failed });

    return new Promise(function (resolve) {
      rest.forEach(function (file, i) {
        window.setTimeout(function () {
          if (!triggerDownload(file)) failed.push(file.name);
          if (i === rest.length - 1) resolve({ ok: failed.length === 0, failed: failed });
        }, 450 * (i + 1));
      });
    });
  }

  /* 내려받는 동안 버튼을 실제로 잠근다(보이기만 하는 시늉이 아니라 disabled).
     여러 파일을 450ms 간격으로 내보내는 중에 한 번 더 누르면 같은 파일이 두 벌 내려가고,
     사용자는 어느 쪽을 posts/에 넣어야 하는지 알 수 없게 된다.
     끝나면 포커스를 버튼에 돌려준다 — disabled가 되는 순간 포커스는 body로 튕기고,
     그대로 두면 키보드 사용자는 안내 모달이 닫힌 뒤 문서 맨 앞으로 되돌아간다. */
  function setExporting(on) {
    state.exporting = on;
    if (!dom.exportBtn) return;
    dom.exportBtn.disabled = on;
    if (!on && document.activeElement === document.body) dom.exportBtn.focus();
  }

  function exportFiles() {
    if (state.exporting) return;
    if (!validate(readForm())) return;
    ensureUsableCategory(function () { ensureCreated(doExport); });
  }

  /* CLAUDE.md 규약 4: created는 불변이다.
     수정 모드인데 원본 게시일이 비어 있다는 건 "정보가 없다"는 뜻이지 "오늘 쓴 글"이 아니다.
     조용히 오늘 날짜를 찍으면 목록 정렬과 게시일 표시가 통째로 어긋나고,
     .md를 덮어쓴 뒤에는 원래 날짜를 되찾을 방법이 없다. 그래서 반드시 물어본다(M8). */
  function ensureCreated(onOk) {
    if (state.mode !== 'edit' || state.created) { onOk(); return; }

    var now = U.nowIsoKst();
    Blog.ui.modal({
      title: '이 글의 원래 게시일 정보가 없습니다',
      bodyNodes: [
        U.el('p', { text: '불러온 글에 created(게시일)가 없습니다. 원본 .md의 frontmatter가 깨졌거나 게시일 없이 만들어진 글입니다.' }),
        U.el('p', { text: '지금 시각(' + U.fmtKo(now) + ')을 게시일로 사용할까요? 한 번 정하면 그 값이 이 글의 게시일이 됩니다.' }),
        U.el('p', { text: '원래 날짜를 알고 있다면, 취소한 뒤 원본 파일의 created 값을 먼저 확인하는 편이 안전합니다.' })
      ],
      actions: [
        { label: '취소', variant: 'ghost' },
        {
          label: '지금 시각을 게시일로', variant: 'primary', onClick: function () {
            onOk(now);
            return false;   // doExport가 다음 모달을 띄운다. 여기서 또 닫으면 그게 같이 닫힌다.
          }
        }
      ]
    });
  }

  function doExport(createdOverride) {
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
      /* color는 내보내지 않는다(§9-2 폐기). 기존 파일에 남아 있는 키는 그대로 둬도 무해하다. */
      pinned: form.pinned
    };

    var mdText = store.toMarkdownFile(meta, form.body);
    var needCats = cats.added.length > 0;

    /* 목록 파일을 "못 읽은" 채로 새로 만들면 기존 내용이 이 글 하나로 덮어써진다.
       파일이 아직 없는 경우(notfound)는 처음 만드는 게 맞지만,
       읽기 실패(file/network/parse)는 "내용이 있는데 못 읽은" 상태다. 그때는 먼저 물어본다. */
    var risky = [];
    if (!state.indexData && state.indexError && state.indexError.code !== 'notfound') {
      risky.push({ file: 'posts/index.json', why: state.indexError.message || '' });
    }
    if (needCats && !cats.loaded && cats.error && cats.error.code !== 'notfound') {
      risky.push({ file: 'posts/categories.json', why: cats.error.message || '' });
    }

    if (risky.length) {
      confirmOverwriteRisk(meta, mdText, needCats, risky);
      return;
    }
    finishExport(meta, mdText, { index: true, cats: needCats });
  }

  /* 수정하면서 id를 바꿨으면 예전 id의 목록 항목을 빼고 다시 만든다.
     그대로 두면 index.json에 지워질 파일을 가리키는 항목이 남는다.
     store가 캐시한 객체를 건드리지 않도록 새 객체를 만들어 넘긴다. */
  function indexSourceFor(meta) {
    var source = state.indexData;
    if (!source) return null;
    if (state.mode !== 'edit' || !state.originalId || state.originalId === meta.id) return source;
    return {
      site: source.site,
      posts: source.posts.filter(function (p) { return p.id !== state.originalId; })
    };
  }

  function finishExport(meta, mdText, opts) {
    var files = [{ name: meta.id + '.md', text: mdText, mime: 'text/markdown' }];

    if (opts.index) {
      files.push({
        name: 'index.json',
        text: store.buildIndexJson(meta, indexSourceFor(meta)),
        mime: 'application/json'
      });
    }
    if (opts.cats) {
      files.push({ name: 'categories.json', text: buildCategoriesJson(), mime: 'application/json' });
    }

    setStatus('내려받는 중…');
    setExporting(true);

    /* 초안은 여기서 지우지 않는다(M7).
       다운로드는 팝업 차단·저장 위치 취소·확장 프로그램으로 조용히 막힐 수 있는데,
       브라우저는 그 사실을 알려 주지 않는다. "트리거가 예외 없이 끝났다"까지만 확인하고,
       임시저장본을 실제로 비우는 건 사용자가 파일을 확인한 뒤 직접 누른다. */
    downloadAll(files).then(function (res) {
      setExporting(false);
      if (!res.ok) {
        setStatus('내보내기에 실패했어요 · 임시저장본은 그대로 있습니다', true);
        showDownloadFailed(meta, mdText, opts, res.failed);
        return;
      }
      setStatus(opts.index
        ? '내려받았습니다 · 파일을 확인한 뒤 임시저장본을 비울 수 있어요'
        : '본문 .md만 내보냈습니다 · index.json은 직접 고쳐야 해요', true);
      showExportGuide(meta, opts);
    });
  }

  /* 다운로드 트리거 자체가 실패한 경우. 초안은 절대 건드리지 않는다. */
  function showDownloadFailed(meta, mdText, opts, failed) {
    Blog.ui.modal({
      title: '파일을 내려받지 못했어요',
      bodyNodes: [
        U.el('p', { text: '내려받지 못한 파일: ' + (failed.length ? failed.join(', ') : '알 수 없음') }),
        U.el('p', { text: '브라우저의 다운로드 차단(여러 파일 자동 다운로드 허용 안 함)이 가장 흔한 원인입니다. 주소창의 차단 아이콘에서 허용한 뒤 다시 시도해 주세요.' }),
        U.el('p', { text: '작성한 내용은 그대로 남아 있고 임시저장본도 지우지 않았습니다.' })
      ],
      actions: [
        { label: '닫기', variant: 'ghost' },
        {
          label: '다시 시도', variant: 'primary', onClick: function () {
            finishExport(meta, mdText, opts);
            return false;
          }
        }
      ]
    });
  }

  function confirmOverwriteRisk(meta, mdText, needCats, risky) {
    var nodes = [U.el('p', { text: '아래 파일을 불러오지 못한 상태입니다. 지금 새로 만들면 기존 내용이 덮어써집니다.' })];
    var list = U.el('ul');
    risky.forEach(function (item) {
      list.appendChild(U.el('li', { text: item.file + (item.why ? ' — ' + item.why : '') }));
    });
    nodes.push(list);

    Blog.ui.modal({
      title: '기존 목록 파일을 읽지 못했어요',
      bodyNodes: nodes,
      /* onClick이 false를 돌려주면 ui.modal은 닫기를 건너뛴다.
         finishExport는 내려받기가 끝난 뒤 안내 모달을 띄우고, 그 모달이 열릴 때
         이 모달은 자동으로 닫힌다(ui.modal이 먼저 closeModal을 부른다).
         여기서 또 닫으면 그때 열려 있을 안내 모달이 같이 닫혀 버린다. */
      actions: [
        {
          label: '.md만 내려받기', variant: 'primary', onClick: function () {
            finishExport(meta, mdText, { index: false, cats: false });
            return false;
          }
        },
        {
          label: '그래도 전부 내려받기', variant: 'danger', onClick: function () {
            finishExport(meta, mdText, { index: true, cats: needCats });
            return false;
          }
        }
      ]
    });
  }

  /* 사용자가 폴더를 못 찾으면 글은 영영 안 보인다. 경로를 글자 그대로 보여 주고 복사까지 시켜 준다. */
  function showExportGuide(meta, opts) {
    var newPath = postPathOf(meta.id, meta.category);
    var oldPath = state.mode === 'edit'
      ? (state.originalPath || (state.originalId ? postPathOf(state.originalId, state.originalCategory) : ''))
      : '';
    var moved = Boolean(oldPath) && oldPath !== newPath;

    var steps = U.el('ol');
    var lines = [
      'posts/' + meta.category + '/ 폴더가 없으면 먼저 만듭니다.',
      '내려받은 ' + meta.id + '.md 를 ' + newPath + ' 로 옮깁니다.',
      opts.index
        ? '내려받은 index.json 으로 posts/index.json 을 덮어씁니다.'
        : 'posts/index.json 의 posts 배열에 이 글 항목을 직접 추가합니다(목록을 못 읽어 만들지 못했습니다).'
    ];
    if (opts.cats) {
      lines.push('내려받은 categories.json 으로 posts/categories.json 을 덮어씁니다(새 분류가 들어 있습니다).');
    }
    if (moved) {
      lines.push('예전 파일 ' + oldPath + ' 은(는) 직접 지웁니다 — 지우지 않으면 같은 글이 두 곳에 남습니다.');
    }
    lines.push('git add posts && git commit -m "' + meta.title + '" 후 push 하면 공개됩니다.');
    lines.forEach(function (text) { steps.appendChild(U.el('li', { text: text })); });

    var nodes = [
      U.el('p', {
        text: opts.index
          ? '저장 위치는 ' + newPath + ' 입니다. 아래 순서대로 넣어 주세요.'
          : '본문 파일만 내려받았어요. 저장 위치는 ' + newPath + ' 입니다.'
      }),
      steps
    ];

    if (moved) {
      nodes.push(U.el('p', {
        text: '분류 또는 id가 바뀌어 파일이 다른 폴더로 갑니다: ' + oldPath + ' -> ' + newPath
      }));
    }

    /* 초안을 비우는 건 되돌릴 수 없다. 그래서 "다운로드 폴더에서 실제로 봤다"를 사람이 확인해 준다.
       확인 전까지는 임시저장본과 .is-dirty 경고가 그대로 남는다(M7). */
    nodes.push(U.el('p', {
      text: opts.index
        ? '다운로드 폴더에서 파일 ' + (opts.cats ? 3 : 2) + '개를 확인하셨으면 "내려받기 확인"을 눌러 주세요. 그때 임시저장본을 비웁니다.'
        : '목록 파일을 만들지 못했으니 아직 끝난 게 아닙니다. 임시저장본은 그대로 둡니다.'
    }));

    var actions = [
      {
        label: '경로 복사', variant: 'ghost', onClick: function () {
          U.copyText(newPath).then(function () {
            U.toast('경로를 복사했습니다: ' + newPath, 'ok');
          }).catch(function () {
            U.toast('복사에 실패했어요. 경로: ' + newPath, 'warn');
          });
          return false;   // 경로를 확인하는 중이니 모달은 열어 둔다
        }
      }
    ];

    if (opts.index) {
      actions.push({ label: '아직 확인 못 했어요', variant: 'ghost' });
      actions.push({
        label: '내려받기 확인 · 초안 비우기', variant: 'primary', onClick: function () {
          store.draft.clear(state.slot);
          setStatus('내보냈습니다 · posts/' + meta.category + '/ 에 넣고 커밋하세요', false);
          U.toast('임시저장본을 비웠습니다', 'ok');
        }
      });
    } else {
      actions.push({ label: '계속 쓰기', variant: 'primary' });
    }

    Blog.ui.modal({
      title: '내보내기 완료',
      bodyNodes: nodes,
      actions: actions
    });
  }

  /* ---------- 불러오기 ---------- */

  function showEditBadge(meta, path) {
    if (!dom.modeBadge) return;
    U.setHidden(dom.modeBadge, false);
    /* 게시일이 없는 글은 "오늘로 찍겠다"고 조용히 정하지 않는다(규약 4).
       내보낼 때 ensureCreated()가 물어본다는 사실을 미리 알려 둔다. */
    dom.modeBadge.textContent = meta.created
      ? '수정 모드 · 게시일 ' + U.fmtKo(meta.created) + ' 유지 · 원본 ' + path
      : '수정 모드 · 이 글에는 게시일 정보가 없어요(내보낼 때 확인합니다) · 원본 ' + path;
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

  /* 호출 시점 규칙: 폼에 값이 다 채워진 뒤에 부른다(수정 모드는 writeForm 다음, 새 글은 기본값 세팅 다음).
     그래야 readForm()이 곧 "지금 화면"이 되어 정규화 차이 없이 초안과 맞댈 수 있다. */
  function applyDraftIfNewer() {
    var draft = store.draft.load(state.slot);
    if (!draft || !draft.data || !draft.data.form) return false;
    if (sameForm(draft.data.form, readForm())) return false;

    var savedAt = draft.savedAt ? U.fmtKo(draft.savedAt) + ' ' + String(draft.savedAt).slice(11, 16) : '';
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
            store.draft.clear(state.slot);
            U.toast('임시저장본을 버렸습니다', 'ok');
          }
        },
        {
          label: '불러오기', variant: 'primary', onClick: function () {
            /* 분류를 먼저 되살려야 select 안에 그 값이 존재한다. */
            restoreDraftCats(draft.data.newCats);
            var form = draft.data.form;
            writeForm(form, form.body);
            if (draft.data.created) state.created = draft.data.created;
            if (!state.originalCategory && draft.data.originalCategory) state.originalCategory = draft.data.originalCategory;
            if (!state.originalPath && draft.data.originalPath) state.originalPath = draft.data.originalPath;
            state.idTouched = true;
            renderPreview();
            markDirty();
            setStatus('임시저장본을 불러왔습니다 · 아직 내보내지 않았어요', true);
          }
        }
      ]
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

  function loadForEdit(id) {
    state.mode = 'edit';
    state.slot = id;
    state.originalId = id;
    setStatus('불러오는 중…');

    loadPostAny(id, categoryHintFor(id)).then(function (post) {
      /* created는 원본 그대로 보존한다. 갱신되는 값은 updated뿐이다. */
      state.created = post.meta.created;
      state.originalPath = post.path || postPathOf(id, post.meta.category);
      state.originalCategory = catFromPath(state.originalPath) || post.meta.category || '';

      var catValue = pickCategoryValue(post.meta, state.originalPath);
      writeForm(Object.assign({}, post.meta, { category: catValue }), post.body);

      state.idTouched = true;                 // 기존 글의 id는 함부로 바꾸지 않는다
      showEditBadge(post.meta, state.originalPath);
      renderPreview();
      setStatus('불러왔습니다', false);

      if (catValue !== UNCATEGORIZED && !findCat(catValue) && !PATH_SAFE_RE.test(catValue)) {
        U.toast('이 글의 분류 "' + catValue + '" 는 폴더명 규칙에 맞지 않아요. 분류를 골라 주세요.', 'warn');
      }
      /* writeForm()으로 화면이 채워진 뒤에 부른다 — 비교 기준이 "지금 화면"이어야 하기 때문. */
      applyDraftIfNewer();
    }).catch(function (err) {
      setStatus('불러오지 못했습니다', false);
      Blog.ui.modal({
        title: '글을 불러오지 못했어요',
        text: (err && err.message) || '알 수 없는 오류입니다.',
        actions: [{ label: '새 글로 시작', variant: 'primary', onClick: function () {
          window.location.href = 'write.html';
        } }]
      });
    });
  }

  function startNew() {
    state.mode = 'new';
    state.slot = 'new';
    /* 목록에서 분류를 고른 채(?cat=) 쓰기로 왔으면 그 분류로 시작한다. */
    selectCategory(queryCategory() || defaultCategorySlug());
    refreshAutoId();
    /* 수정 모드는 loadForEdit가 글 제목으로 바꾼다. 새 글일 때만 사이트명을 반영한다. */
    document.title = '새 글 쓰기 · ' + siteInfo().title;
    setStatus('새 글', false);
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
     버튼 10개가 전부 탭 스톱이면 제목칸에서 본문까지 Tab을 11번 눌러야 한다.
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
    U.on(dom.category, 'change', function () { syncCategoryHint(); onEdit(); });

    U.on(dom.btnNewCat, 'click', function () {
      if (dom.catNew && dom.catNew.hasAttribute('hidden')) openNewCat();
      else closeNewCat(true);
    });

    U.on(dom.btnAddCat, 'click', addCategory);
    U.on(dom.btnCancelCat, 'click', function () { closeNewCat(true); });

    /* 표시 이름에서 폴더명을 제안한다. 한글이면 결과가 비므로 사용자가 직접 지어야 한다. */
    U.on(dom.newCatName, 'input', function () {
      if (newCatSlugTouched) return;
      dom.newCatSlug.value = U.slugAscii(dom.newCatName.value);
    });
    U.on(dom.newCatSlug, 'input', function () { newCatSlugTouched = true; });

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
    U.on(dom.body, 'input', function () { onEdit(); renderPreview(); });
    U.on(dom.body, 'keydown', onBodyKeydown);
    /* 본문을 떠나면 Tab 탈출 대기도 함께 푼다. 돌아왔을 때 첫 Tab이
       예고 없이 포커스를 옮기면 "Tab은 들여쓰기"라는 약속이 깨진다. */
    U.on(dom.body, 'blur', function () { setTabEscape(false); });

    [dom.title, dom.summary, dom.tags].forEach(function (field) {
      U.on(field, 'input', onEdit);
    });
    U.on(dom.pinned, 'change', onEdit);

    U.on(dom.title, 'input', refreshAutoId);
    U.on(dom.id, 'input', function () { state.idTouched = true; onEdit(); });

    bindCategory();

    U.on(dom.toolbar, 'click', function (e) {
      var btn = e.target.closest('.md-btn');
      if (!btn) return;
      var action = TOOLBAR[btn.getAttribute('data-md')];
      if (action) action();
    });

    U.on(dom.previewToggle, 'click', function () {
      var current = dom.split.getAttribute('data-mode') || 'split';
      state.modeTouched = true;
      setViewMode(MODES[(MODES.indexOf(current) + 1) % MODES.length]);
    });

    U.on(dom.exportBtn, 'click', exportFiles);

    /* Ctrl+S는 브라우저 "페이지 저장"을 가로채 내보내기로 쓴다.
       단, 모달이 떠 있는 동안에는 내보내지 않는다 — 내보내기 안내 모달 위에서 또 누르면
       같은 파일이 두 벌 내려가고, 확인창의 질문(덮어쓸까요?)을 건너뛴 셈이 된다.
       브라우저의 "페이지 저장"만은 그대로 막는다(눌린 사실을 없던 일로 만드는 편이 헷갈리지 않는다). */
    U.on(document, 'keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      if (document.body.classList.contains('modal-open')) return;
      exportFiles();
    });

    /* 내보내지 않은 변경이 있으면 떠나기 전에 물어본다.
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
    U.toast('분류가 아직 없어요. "+ 새 분류"로 만들면 내보낼 때 categories.json도 함께 내려받습니다.', 'warn');
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
    dom.previewToggle = document.getElementById('btnPreviewToggle');
    dom.exportBtn = document.getElementById('btnExport');
    dom.modeBadge = document.getElementById('editorMode');
    dom.visitorNote = document.getElementById('editorVisitor');

    dom.catNew = document.getElementById('catNew');
    dom.btnNewCat = document.getElementById('btnNewCat');
    dom.btnAddCat = document.getElementById('btnAddCat');
    dom.btnCancelCat = document.getElementById('btnCancelCat');
    dom.newCatName = document.getElementById('fNewCatName');
    dom.newCatSlug = document.getElementById('fNewCatSlug');

    Blog.ui.initShell();
    var admin = Blog.admin.init();

    bind();
    initToolbarRoving();
    setViewMode(autoViewMode());
    watchWidth();

    if (!admin) {
      /* 관리자 스위치가 꺼져 있어도 파일은 누구나 열 수 있다. 막는 게 아니라 알려 주는 것.
         write.html에 안내 블록이 있으면 그걸 띄우고, 없으면 토스트로라도 알린다. */
      if (dom.visitorNote) U.setHidden(dom.visitorNote, false);
      else U.toast('관리자 모드가 꺼져 있어요. 작성은 되지만 목록의 수정 버튼은 보이지 않습니다.', 'warn');
    }

    /* index.json은 내보내기에서 다시 쓰므로 미리 받아 둔다. 실패해도 작성은 가능해야 한다.
       다만 "왜 실패했는지"는 기억해 둔다 — 내보낼 때 목록을 덮어쓸지 판단해야 하기 때문.
       loadCategories()는 절대 reject하지 않으므로 Promise.all이 중간에 끊기지 않는다. */
    var indexJob = promised(function () { return store.loadIndex(); }).then(function (data) {
      state.indexData = data;
      state.indexError = null;
    }).catch(function (err) {
      state.indexData = null;
      state.indexError = err || mkErr('network', 'posts/index.json 을 불러오지 못했습니다.');
    });

    Promise.all([indexJob, loadCategories()]).then(function () {
      fillSite();
      fillCategoryOptions();
      noticeCategoryState();

      var id = U.getQuery().id;
      if (id) loadForEdit(id);
      else startNew();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
