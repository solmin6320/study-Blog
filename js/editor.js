/* editor.js — write.html 전용. 마크다운 작성, 실시간 미리보기, 자동 임시저장,
   .md + index.json (+ categories.json) 내보내기, ?id= 수정 모드.
   이 화면이 "공부한 걸 블로그에 넣는" 유일한 통로다. 실수로 글을 잃는 경로가 없어야 한다.

   v2: 글은 posts/<카테고리slug>/<id>.md 에 들어간다(계약서 10-1).
   카테고리 목록은 posts/categories.json 이 진실이지만, 그 파일이 없어도 에디터는
   끝까지 동작해야 한다 — 없으면 빈 목록 + "새 카테고리"로 진행한다. */
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
  var CAT_PATH_FALLBACK = 'posts/categories.json';
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
    originalPath: '',     // 실제로 읽어 온 경로. 카테고리를 바꾸면 "이 파일을 지우라"고 알려 줘야 한다.
    idTouched: false,     // 사용자가 id를 직접 건드렸으면 자동 생성을 멈춘다
    modeTouched: false,   // 보기 모드를 손수 바꿨으면 화면 폭 변화가 덮어쓰지 않는다
    dirty: false,         // 내보내지 않은 변경
    indexData: null,
    indexError: null      // index.json을 왜 못 읽었는지. 내보내기 안전장치의 판단 근거가 된다.
  };

  /* 카테고리 상태. added는 "이번에 새로 만들어서 categories.json에 아직 없는" 슬러그들. */
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

  /* 실제로 읽어 온 경로에서 폴더명을 되짚는다. 폴더가 곧 그 글의 진짜 카테고리다. */
  function catFromPath(url) {
    var m = /(?:^|\/)posts\/([^/]+)\/[^/]+\.md$/.exec(String(url || ''));
    return m ? m[1] : '';
  }

  /* ---------- 카테고리 ---------- */

  var COLOR_VALUES = CFG.colors.map(function (c) { return c.value; });

  function isColor(value) {
    return COLOR_VALUES.indexOf(String(value || '').trim().toLowerCase()) !== -1;
  }

  /* 색이 비어 있으면 slug 해시로 하나 고정한다. 같은 카테고리는 언제나 같은 색이 나온다. */
  function colorFor(slug, raw) {
    if (isColor(raw)) return String(raw).trim().toLowerCase();
    return COLOR_VALUES[Math.floor(U.hashUnit(slug || 'x') * COLOR_VALUES.length) % COLOR_VALUES.length];
  }

  function normalizeCat(item, index) {
    var c = (typeof item === 'string') ? { slug: item, name: item } : (item || {});
    var slug = String(c.slug || c.id || c.value || '').trim().toLowerCase();
    if (!slug) return null;
    var order = Number(c.order);
    return {
      slug: slug,
      name: String(c.name || c.label || c.title || slug).trim() || slug,
      color: colorFor(slug, c.color),
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

  /* 카테고리 목록은 store.loadCategories() 하나로 받는다.
     그쪽은 절대 reject하지 않고, 파일을 못 읽으면 index.json의 category 값에서
     목록을 되살려 { list, derived:true } 로 돌려준다. */

  /* 이 함수도 절대 reject하지 않는다. 카테고리를 못 읽는다고 글쓰기가 막히면 안 된다.

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
        cats.error = err || mkErr('unknown', '카테고리 목록을 불러오지 못했습니다.');
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
    /* 목록이 비어도 고를 값 하나는 있어야 한다. 계약서 10-1의 폴백 폴더. */
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

  function fillNewCatColors() {
    if (!dom.newCatColor) return;
    U.clear(dom.newCatColor);
    CFG.colors.forEach(function (color) {
      dom.newCatColor.appendChild(U.el('option', { value: color.value, text: color.label }));
    });
    dom.newCatColor.value = CFG.editor.defaultColor;
  }

  /* ---------- 새 카테고리 만들기 ---------- */

  var newCatSlugTouched = false;

  function openNewCat() {
    if (!dom.catNew) return;
    U.setHidden(dom.catNew, false);
    if (dom.btnNewCat) dom.btnNewCat.setAttribute('aria-expanded', 'true');
    dom.newCatName.value = '';
    dom.newCatSlug.value = '';
    if (dom.newCatColor) dom.newCatColor.value = CFG.editor.defaultColor;
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

    if (!name) return rejectNewCat(dom.newCatName, '카테고리 표시 이름을 입력해 주세요');
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
      return rejectNewCat(dom.newCatName, '같은 이름의 카테고리가 이미 있어요: ' + name);
    }

    var maxOrder = -1;
    cats.list.forEach(function (c) { if (c.order > maxOrder) maxOrder = c.order; });
    var cat = normalizeCat({
      slug: slug,
      name: name,
      color: dom.newCatColor ? dom.newCatColor.value : '',
      description: '',
      order: maxOrder + 1
    }, cats.list.length);

    cats.list.push(cat);
    sortCats(cats.list);
    if (cats.added.indexOf(cat.slug) === -1) cats.added.push(cat.slug);

    fillCategoryOptions(cat.slug);
    closeNewCat(true);
    onEdit();
    U.toast('카테고리를 만들었어요 · 내보낼 때 categories.json도 함께 내려받습니다', 'ok');
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
      color: dom.color.value,
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
    dom.color.value = meta.color || CFG.editor.defaultColor;
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

  function setStatus(text, dirty) {
    if (!dom.status) return;
    dom.status.textContent = text;
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

  /* 새로 만든 카테고리도 초안에 같이 담는다. 새로고침 한 번에 사라지면
     사용자는 폴더명을 다시 지어야 하고, 그 사이 글의 분류가 어긋난다. */
  function addedCatObjects() {
    return cats.added.map(function (slug) { return findCat(slug); }).filter(Boolean);
  }

  var autosave = U.debounce(function () {
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
  }, CFG.debounce.draft);

  function onEdit() {
    markDirty();
    setStatus('저장 중…');
    autosave();
  }

  /* ---------- 마크다운 툴바 ----------
     선택 영역을 감싸고, 끝나면 커서를 쓸 만한 자리에 되돌려 놓는다.
     (선택이 사라지면 연속 서식이 불가능해서 쓰기 흐름이 끊긴다.) */

  function setSelection(start, end) {
    dom.body.focus();
    dom.body.setSelectionRange(start, end);
  }

  function replaceRange(start, end, text, selStart, selEnd) {
    var value = dom.body.value;
    dom.body.value = value.slice(0, start) + text + value.slice(end);
    setSelection(
      selStart === undefined ? start + text.length : selStart,
      selEnd === undefined ? start + text.length : selEnd
    );
    onEdit();
    renderPreview();
  }

  function surround(before, after, placeholder) {
    var start = dom.body.selectionStart;
    var end = dom.body.selectionEnd;
    var selected = dom.body.value.slice(start, end);
    var value = dom.body.value;

    /* 이미 감싸져 있으면 벗긴다(토글). */
    var outerStart = start - before.length;
    var outerEnd = end + after.length;
    if (outerStart >= 0 && value.slice(outerStart, start) === before && value.slice(end, outerEnd) === after) {
      replaceRange(outerStart, outerEnd, selected, outerStart, outerStart + selected.length);
      return;
    }

    var text = selected || placeholder || '';
    replaceRange(start, end, before + text + after,
      start + before.length, start + before.length + text.length);
  }

  /* 선택된 모든 줄의 앞에 접두사를 붙이거나(이미 있으면) 뗀다. */
  function linePrefix(prefix) {
    var value = dom.body.value;
    var start = value.lastIndexOf('\n', dom.body.selectionStart - 1) + 1;
    var end = dom.body.selectionEnd;
    var lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    var block = value.slice(start, lineEnd);
    var lines = block.split('\n');
    var allHave = lines.every(function (line) { return line.indexOf(prefix) === 0; });
    var next = lines.map(function (line) {
      if (allHave) return line.slice(prefix.length);
      return prefix + line;
    }).join('\n');

    replaceRange(start, lineEnd, next, start, start + next.length);
  }

  function insertBlock(text) {
    var start = dom.body.selectionStart;
    var value = dom.body.value;
    var needsLeadingBreak = start > 0 && value.charAt(start - 1) !== '\n';
    var payload = (needsLeadingBreak ? '\n' : '') + text;
    replaceRange(start, dom.body.selectionEnd, payload, start + payload.length, start + payload.length);
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

  var TABLE_TEMPLATE = [
    '| 항목 | 설명 |',
    '| --- | --- |',
    '| 첫 줄 | 내용 |',
    '| 둘째 줄 | 내용 |',
    ''
  ].join('\n');

  var TOOLBAR = {
    bold: function () { surround('**', '**', '굵게'); },
    italic: function () { surround('*', '*', '기울임'); },
    heading: function () { linePrefix('## '); },
    link: insertLink,
    code: function () { surround('`', '`', '코드'); },
    codeblock: insertCodeBlock,
    list: function () { linePrefix('- '); },
    quote: function () { linePrefix('> '); },
    table: function () { insertBlock(TABLE_TEMPLATE); },
    hr: function () { insertBlock('\n---\n\n'); }
  };

  /* ---------- 키보드 ---------- */

  function onBodyKeydown(e) {
    /* Tab이 포커스를 옮겨 버리면 코드 들여쓰기를 쓸 수 없다. textarea 안에서만 가로챈다. */
    if (e.key === 'Tab') {
      e.preventDefault();
      var start = dom.body.selectionStart;
      var end = dom.body.selectionEnd;
      var value = dom.body.value;
      var multiline = value.slice(start, end).indexOf('\n') !== -1;

      if (!multiline && !e.shiftKey) {
        replaceRange(start, end, '  ');
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
      return;
    }

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
      dom.previewToggle.textContent = MODE_LABEL[next] + ' 보기';
      dom.previewToggle.setAttribute('aria-label', MODE_LABEL[next] + ' 로 전환');
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
       막으면 사용자가 직접 손으로 넣은 카테고리를 에디터가 거부하게 된다. */
    if (cat === UNCATEGORIZED || findCat(cat) || PATH_SAFE_RE.test(cat)) { onOk(); return; }

    Blog.ui.modal({
      title: '이 분류는 폴더명으로 쓸 수 없어요',
      text: '"' + cat + '" 은(는) 폴더명 규칙(영문 소문자·숫자·하이픈)에 맞지 않습니다.\n'
        + '글은 posts/<폴더명>/ 안에 들어가야 해서 이대로는 경로를 만들 수 없어요.\n'
        + '카테고리를 고르거나 "+ 새 카테고리"로 만들어 주세요.',
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
          label: '카테고리 고르기', variant: 'primary', onClick: function () {
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
          color: colorFor(c.slug, c.color),
          description: c.description || '',
          order: (typeof c.order === 'number' && isFinite(c.order)) ? c.order : i
        };
      })
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  /* 여러 파일을 한꺼번에 내려받으면 일부 브라우저가 두 번째부터 차단한다. 살짝 띄운다. */
  function downloadAll(files) {
    files.forEach(function (file, i) {
      if (i === 0) { U.download(file.name, file.text, file.mime); return; }
      window.setTimeout(function () { U.download(file.name, file.text, file.mime); }, 450 * i);
    });
  }

  function exportFiles() {
    if (!validate(readForm())) return;
    ensureUsableCategory(doExport);
  }

  function doExport() {
    var form = readForm();
    var now = U.nowIsoKst();
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
      /* frontmatter의 category는 표시 이름이 아니라 slug(= 폴더명)다. 계약서 10-1. */
      category: form.category,
      color: form.color,
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

    downloadAll(files);

    if (opts.index) {
      store.draft.clear(state.slot);
      setStatus('내보냈습니다 · posts/' + meta.category + '/ 에 넣고 커밋하세요', false);
    } else {
      /* 목록 파일이 빠졌으니 작업이 끝난 게 아니다. 초안도 지우지 않고 경고도 유지한다. */
      setStatus('본문 .md만 내보냈습니다 · index.json은 직접 고쳐야 해요', true);
    }
    showExportGuide(meta, opts);
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
         finishExport가 이미 안내 모달을 새로 띄웠고(그 과정에서 이 모달은 닫힌다),
         여기서 또 닫으면 방금 연 안내 모달이 같이 닫혀 버린다. */
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
      lines.push('내려받은 categories.json 으로 posts/categories.json 을 덮어씁니다(새 카테고리가 들어 있습니다).');
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
        text: '카테고리 또는 id가 바뀌어 파일이 다른 폴더로 갑니다: ' + oldPath + ' -> ' + newPath
      }));
    }

    Blog.ui.modal({
      title: '내보내기 완료',
      bodyNodes: nodes,
      actions: [
        {
          label: '경로 복사', variant: 'ghost', onClick: function () {
            U.copyText(newPath).then(function () {
              U.toast('경로를 복사했습니다: ' + newPath, 'ok');
            }).catch(function () {
              U.toast('복사에 실패했어요. 경로: ' + newPath, 'warn');
            });
            return false;   // 경로를 확인하는 중이니 모달은 열어 둔다
          }
        },
        { label: '메모 보드로', variant: 'ghost', onClick: function () { window.location.href = 'index.html'; } },
        { label: '계속 쓰기', variant: 'primary' }
      ]
    });
  }

  /* ---------- 불러오기 ---------- */

  function fillColorOptions() {
    U.clear(dom.color);
    CFG.colors.forEach(function (color) {
      dom.color.appendChild(U.el('option', { value: color.value, text: color.label }));
    });
    dom.color.value = CFG.editor.defaultColor;
  }

  function showEditBadge(meta, path) {
    if (!dom.modeBadge) return;
    U.setHidden(dom.modeBadge, false);
    dom.modeBadge.textContent = '수정 모드 · 게시일 ' + U.fmtKo(meta.created) + ' 유지 · 원본 ' + path;
    document.title = '수정: ' + meta.title;
  }

  /* 초안에 실려 온 "아직 파일에 없는 카테고리"를 목록에 되살린다. */
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

  function applyDraftIfNewer(loadedForm) {
    var draft = store.draft.load(state.slot);
    if (!draft || !draft.data || !draft.data.form) return false;

    var sameAsLoaded = loadedForm
      && draft.data.form.title === loadedForm.title
      && draft.data.form.body === loadedForm.body;
    if (sameAsLoaded) return false;

    var savedAt = draft.savedAt ? U.fmtKo(draft.savedAt) + ' ' + String(draft.savedAt).slice(11, 16) : '';
    Blog.ui.modal({
      title: '임시저장본이 있어요',
      text: (savedAt ? savedAt + ' 에 ' : '') + '자동 저장된 내용이 남아 있습니다.\n불러올까요, 버릴까요?',
      actions: [
        {
          label: '버리기', variant: 'ghost', onClick: function () {
            store.draft.clear(state.slot);
            U.toast('임시저장본을 버렸습니다', 'ok');
          }
        },
        {
          label: '불러오기', variant: 'primary', onClick: function () {
            /* 카테고리를 먼저 되살려야 select 안에 그 값이 존재한다. */
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

  /* 보드의 카테고리 네비는 "전체"를 ?cat=* 로 쓴다. 그건 폴더 이름이 아니다. */
  function queryCategory() {
    var raw = String(U.getQuery().cat || '').trim();
    return (!raw || raw === '*') ? '' : raw;
  }

  /* index.json이 알려 주는 카테고리 또는 ?cat= 으로 넘어온 힌트. 없으면 빈 문자열. */
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

  /* 후보 경로를 차례로 두드린다. store가 카테고리 경로를 아직 모를 수 있어서 필요한 폴백이다. */
  function fetchPostFallback(id, hint, firstErr) {
    var urls = candidatePaths(id, hint);
    var i = 0;
    function next() {
      if (i >= urls.length) {
        throw firstErr || mkErr('notfound',
          'posts/ 안에서 ' + id + '.md 를 찾지 못했습니다. 카테고리 폴더로 옮겨졌는지 확인해 주세요.');
      }
      var url = urls[i];
      i += 1;
      return fetchText(url).then(function (text) {
        return buildPostFromText(id, text, url);
      }, function (err) {
        if (err && err.code === 'file') throw err;   // file://은 어느 경로든 똑같이 막힌다
        return next();
      });
    }
    return promised(next);
  }

  function loadPostAny(id, hint) {
    return promised(function () { return store.loadPost(id, hint); })
      .then(function (post) {
        if (post && !post.path) post.path = postPathOf(id, (post.meta && post.meta.category) || hint);
        return post;
      })
      .catch(function (err) {
        if (err && err.code === 'file') throw err;
        return fetchPostFallback(id, hint, err);
      });
  }

  /* 글이 어느 카테고리 값으로 열려야 하는지 고른다.
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
        U.toast('이 글의 분류 "' + catValue + '" 는 폴더명 규칙에 맞지 않아요. 카테고리를 골라 주세요.', 'warn');
      }
      applyDraftIfNewer(Object.assign({}, post.meta, { body: post.body }));
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
    /* 보드에서 카테고리를 고른 채 "새 메모"로 왔으면 그 카테고리로 시작한다. */
    selectCategory(queryCategory() || defaultCategorySlug());
    refreshAutoId();
    setStatus('새 메모', false);
    applyDraftIfNewer(null);
    renderPreview();
  }

  /* ---------- 부트스트랩 ---------- */

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

    /* 새 카테고리 폼 안에서는 Enter로 추가, ESC로 취소. */
    U.on(dom.catNew, 'keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCategory(); return; }
      if (e.key === 'Escape') { e.preventDefault(); closeNewCat(true); }
    });
  }

  function bind() {
    U.on(dom.body, 'input', function () { onEdit(); renderPreview(); });
    U.on(dom.body, 'keydown', onBodyKeydown);

    [dom.title, dom.summary, dom.tags].forEach(function (field) {
      U.on(field, 'input', onEdit);
    });
    U.on(dom.color, 'change', onEdit);
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

    /* Ctrl+S는 브라우저 "페이지 저장"을 가로채 내보내기로 쓴다. */
    U.on(document, 'keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      exportFiles();
    });

    /* 내보내지 않은 변경이 있으면 떠나기 전에 물어본다. */
    U.on(window, 'beforeunload', function (e) {
      if (!state.dirty) return undefined;
      e.preventDefault();
      e.returnValue = '';
      return '';
    });
  }

  /* 카테고리를 못 읽었을 때 한 번만 알린다. 글쓰기를 막지는 않는다. */
  function noticeCategoryState() {
    if (cats.list.length) return;
    if (cats.error && cats.error.code && cats.error.code !== 'notfound') {
      U.toast('카테고리 목록을 불러오지 못했어요(' + cats.error.code + '). "+ 새 카테고리"로 만들 수 있습니다.', 'warn');
      return;
    }
    U.toast('카테고리가 아직 없어요. "+ 새 카테고리"로 만들면 내보낼 때 categories.json도 함께 생깁니다.', 'warn');
  }

  function start() {
    dom.split = document.getElementById('editorSplit');
    dom.title = document.getElementById('fTitle');
    dom.summary = document.getElementById('fSummary');
    dom.tags = document.getElementById('fTags');
    dom.category = document.getElementById('fCategory');
    dom.color = document.getElementById('fColor');
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
    dom.newCatColor = document.getElementById('fNewCatColor');

    Blog.ui.initShell();
    var admin = Blog.admin.init();

    fillColorOptions();
    fillNewCatColors();
    bind();
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
