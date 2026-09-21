/* app.js — index.html 전용.
   카드 그리드(분류 → 제목 → 날짜·태그, 계약서 §4-4) 렌더 + 검색 + 태그 인덱스 + 사이드바 데이터 공급 + URL 상태 동기화.
   분류 필터(?cat=)는 유지하되 거는 쪽은 사이드바(ui.js .side-cat-name)다 — 분류 인덱스 행 #catRow는 v3.9에서 폐기됐다(§4-3).
   정렬 컨트롤은 없다. 학습 기록의 순서는 시간순 하나다(계약서 §0-2). */
(function (window, document) {
  'use strict';

  var Blog = window.Blog;
  var CFG = Blog.config;
  var U = Blog.util;
  var store = Blog.store;

  var dom = {};
  var state = {
    posts: [],        // index.json의 전체 목록
    query: '',
    cat: '*',         // 단일 선택. '*'는 전체
    tags: []          // 다중 선택. 하나라도 일치하면 통과(OR)
  };

  /* id → 글, id → 분류 slug, id → 검색용 문자열.
     필터는 타이핑마다 돌아간다. 매번 배열을 훑거나 slug를 다시 계산하지 않도록 한 번만 만든다.
     프로토타입 없는 객체로 만든다 — 'constructor' 같은 id가 들어와도 없는 글이 "있다"로 통과하지 않게. */
  var postById = Object.create(null);
  var slugById = Object.create(null);
  var searchById = Object.create(null);
  /* id → 비교 키로 정규화한 태그 배열. 필터·개수는 이 키로 맞추고 화면 글자는 post.tags(원문)를 쓴다 —
     "CSS"와 "css"를 같은 태그로 세되 사용자가 적은 표기는 바꾸지 않는다(연관 글 post.js와 같은 규칙). */
  var tagKeysById = Object.create(null);

  function setPosts(list) {
    state.posts = list;
    postById = Object.create(null);
    slugById = Object.create(null);
    searchById = Object.create(null);
    tagKeysById = Object.create(null);
    list.forEach(function (post) {
      var slug = store.categorySlug(post.category);
      postById[post.id] = post;
      slugById[post.id] = slug;
      tagKeysById[post.id] = post.tags.map(U.normTag);
      /* 검색 대상은 화면에 없는 요약까지 포함한다(계약서 §0-1: summary는 검색 대상으로 살아 있다).
         분류는 폴더명(css)과 표시 이름(CSS) 둘 다 걸리게 한다. */
      searchById[post.id] = [
        post.title, post.summary, slug, store.categoryName(post.category), post.tags.join(' ')
      ].join(' ').toLowerCase();
    });
  }

  function postsInCat() {
    if (state.cat === '*') return state.posts;
    return state.posts.filter(function (post) { return slugById[post.id] === state.cat; });
  }

  /* 사이드바에 실제로 그려지는 분류인지. 등록된 분류 + 글만 있는 미등록 분류가 대상이다. */
  function catExists(slug) {
    if (slug === '*') return true;
    return store.categoryList(state.posts).some(function (cat) { return cat.slug === slug; });
  }

  /* ---------- 정렬 / 필터 ---------- */

  /* 고정 글은 어떤 경우에도 맨 위. 그 아래는 created 내림차순 하나뿐이다. */
  function sortPosts(list) {
    return list.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.created).localeCompare(String(a.created));
    });
  }

  /* 분류(단일) · 태그(다중) · 검색어는 서로 다른 축이다. 셋을 AND로 묶는다. */
  function matches(post) {
    if (state.cat !== '*' && slugById[post.id] !== state.cat) return false;

    var q = state.query.trim().toLowerCase();
    if (q && (searchById[post.id] || '').indexOf(q) === -1) return false;
    if (state.tags.length) {
      var keys = tagKeysById[post.id] || [];
      var hit = keys.some(function (key) { return state.tags.indexOf(key) !== -1; });
      if (!hit) return false;
    }
    return true;
  }

  function visiblePosts() {
    return sortPosts(state.posts.filter(matches));
  }

  /* ---------- 목록 (계약서 §4-4) ---------- */

  /* 카드 한 장. 마크업은 U.entryCard 한 곳에 있다 — 상세의 연관 글(post.js)과 같은 부품이라
     여기서 따로 그리면 다음 개정에서 두 화면이 어긋난다(계약서 §5-8, §12-9 #50).
     목록은 전체 태그·고정 표시 그대로(기본값)다. */
  function entryRow(post) {
    return U.entryCard(post);
  }

  function entryGroup(label, posts) {
    var section = U.el('section', { class: 'entry-group' });
    if (label) section.appendChild(U.el('h2', { class: 'entry-group-label', text: label }));
    var ul = U.el('ul', { class: 'entry-list' });
    posts.forEach(function (post) { ul.appendChild(entryRow(post)); });
    section.appendChild(ul);
    return section;
  }

  /* created의 연도가 바뀌는 지점마다 끊는다. 순서는 이미 정렬돼 있으므로 한 번 훑으면 된다. */
  function groupByYear(posts) {
    var groups = [];
    var last = null;
    posts.forEach(function (post) {
      var year = U.yearOf(post.created);
      if (!last || last.year !== year) {
        last = { year: year, posts: [] };
        groups.push(last);
      }
      last.posts.push(post);
    });
    return groups;
  }

  /* 필터가 걸릴 때마다 목록을 다시 그린다. 행을 숨기는 방식으로는
     "한 해에 다 들어가면 연도 라벨을 넣지 않는다"는 규칙을 지킬 수 없다 —
     걸러낸 결과가 한 해에 모이면 라벨 자체가 사라져야 하고, 그 판단은 그려 봐야 안다. */
  function renderList() {
    var posts = visiblePosts();
    var pinned = posts.filter(function (p) { return p.pinned; });
    var rest = posts.filter(function (p) { return !p.pinned; });
    var groups = groupByYear(rest);

    /* 연도가 하나뿐이면 라벨을 넣지 않는다. 글 4편 위의 "2026" 한 줄은 정보가 아니라 장식이다.
       300편이 되어 연도가 둘 이상이 되는 순간 스크롤의 이정표로 자동 등장한다(계약서 §4-4). */
    var showYear = groups.length > 1;

    var frag = document.createDocumentFragment();
    /* 고정 글은 연도 그룹보다 위에, 라벨 없는 한 덩어리로 온다. */
    if (pinned.length) frag.appendChild(entryGroup(null, pinned));
    groups.forEach(function (group) {
      frag.appendChild(entryGroup(showYear ? group.year : null, group.posts));
    });

    /* aria-live 영역이라 지우고 채우는 중간 상태까지 읽히면 행 수만큼 발화가 쏟아진다.
       다 채운 뒤 한 번만 알리도록 묶는다. */
    dom.list.setAttribute('aria-busy', 'true');
    U.clear(dom.list);
    dom.list.appendChild(frag);
    dom.list.removeAttribute('aria-busy');

    U.setHidden(dom.empty, posts.length !== 0);
    if (!posts.length) renderEmpty();

    markReady();
  }

  /* 카드의 arrive 모션은 첫 렌더에만(계약서 §4-4·§11-4, M4-10). 필터 재렌더까지 매번 떠오르면 테마 전환
     저점과 겹쳐 이중 공백이 되고 같은 결과에도 다시 움직인다. 첫 renderList() 뒤 300ms(--dur 260 + 여유,
     §8-1)에 #postList에 data-ready를 한 번 붙이고 떼지 않는다 — CSS가 그 아래 .entry의 animation을 끈다.
     0장(빈 목록)이어도 붙인다. 그래야 검색으로 첫 카드가 나타날 때도 "필터 결과"로 취급된다. */
  var readyMarked = false;

  function markReady() {
    if (readyMarked) return;
    readyMarked = true;
    window.setTimeout(function () { dom.list.setAttribute('data-ready', ''); }, 300);
  }

  /* ---------- 빈 상태 ---------- */

  /* 왜 비었는지에 따라 사용자가 할 일이 다르다.
     글이 아예 없는 것 / 이 분류가 빈 것 / 조건이 안 맞는 것 / 주소가 틀린 것. */
  function renderEmpty() {
    var admin = Blog.admin.isAdmin();

    if (!state.posts.length) {
      /* 글 0편이 이 블로그의 기본 화면이다. 방문자에게는 담백하게 비어 있다고만 알린다 —
         "파일을 넣으세요"는 방문자가 할 수 없는 일이고, 비어 있음이 고장으로 보여도 안 된다. */
      setEmptyMessage('아직 글이 없습니다.',
        admin
          ? '위 “쓰기”에서 첫 글을 쓰고 저장하면 여기에 나타납니다.'
          : '첫 글이 올라오면 여기에 표시됩니다.',
        false);
      return;
    }

    /* ?cat= 값이 목록에 없는 slug면 사이드바에 켜진 항목이 하나도 없어 "왜 비었는지"를 알 수 없다.
       주소를 잘못 받은 것과 글이 아직 없는 것은 사용자가 할 일이 다르므로 문구를 나눈다. */
    if (state.cat !== '*' && !catExists(state.cat)) {
      setEmptyMessage('‘' + state.cat + '’ 라는 분류는 없습니다.',
        '주소의 ?cat= 값이 분류 목록에 없습니다. 왼쪽 분류 메뉴에서 다시 골라 주세요.', true);
      return;
    }

    if (state.cat !== '*' && !postsInCat().length) {
      var name = store.categoryName(state.cat);
      setEmptyMessage('‘' + name + '’ 에 아직 글이 없습니다.',
        admin
          ? 'posts/' + state.cat + '/ 폴더에 .md 파일을 넣으면 여기에 나타납니다.'
          : '다른 분류를 골라 보세요.',
        true);
      return;
    }

    setEmptyMessage('조건에 맞는 글이 없습니다.',
      (state.query || state.tags.length) ? '검색어나 태그를 바꿔 보세요.' : '다른 분류를 골라 보세요.',
      true);
  }

  function setEmptyMessage(title, desc, showReset) {
    if (!dom.empty) return;
    /* 계약서 §4-4: 첫 줄은 <strong>(무슨 상태인지), 둘째 줄은 다음 행동. 클래스를 새로 만들지 않는다. */
    U.clear(dom.empty);
    dom.empty.appendChild(U.el('p', null, [U.el('strong', { text: title })]));
    dom.empty.appendChild(U.el('p', { text: desc }));
    if (showReset) {
      dom.empty.appendChild(U.el('button', {
        class: 'btn',
        type: 'button',
        text: '조건 초기화',
        onclick: function () { resetFilters(); }
      }));
    }
  }

  /* ---------- 인덱스 — 태그 (계약서 §4-3) ----------
     v3.9부터 한 축이다. 분류 인덱스 행(#catRow)은 분류명 = 태그명인 블로그에서 같은 알약 줄이 둘로 보여 폐기됐고,
     분류 선택은 사이드바(.side-cat-name[aria-current])가 맡는다. 이름은 .index-name 안에 넣고,
     구분자(·)와 태그의 # 접두사는 CSS가 그린다 — 텍스트로 넣으면 필터 값과 화면 문자열이 어긋난다.
     .is-empty는 붙이지 않는다 — 태그는 글에서 모으므로 0편 항목이 없고, CSS 규칙도 v3.9에서 지워졌다. */

  function indexItem(opts) {
    var btn = U.el('button', {
      class: 'index-item' + (opts.active ? ' is-active' : ''),
      type: 'button'
    });
    btn.setAttribute('data-tag', opts.tag);
    /* 태그는 다중 선택이라 aria-pressed. false도 의미가 있다(누를 수 있고 지금은 꺼짐). */
    btn.setAttribute('aria-pressed', opts.active ? 'true' : 'false');
    btn.appendChild(U.el('span', { class: 'index-name', text: opts.name }));
    btn.appendChild(U.el('span', { class: 'index-count', text: String(opts.count) }));
    return btn;
  }

  /* 정렬은 U.sortCats(order → 글 수 → 이름, 계약서 §3-2). 사이드바가 이 순서로 그린다. */
  function sortedCats() {
    return U.sortCats(store.categoryList(state.posts));
  }

  /* 태그는 지금 보고 있는 분류 안의 것만 센다. 분류를 고른 뒤에도 전체 태그가 남아 있으면
     "눌러도 아무것도 안 나오는 태그"가 생긴다. */
  /* 반환: key(비교용 소문자) → { name, count }. name은 그 태그가 처음 보인 글의 표기 그대로다 —
     목록은 최신 글부터 정렬돼 있지 않으므로(state.posts는 index.json 순) 어느 표기가 남을지는 파일 순서를 따른다.
     한 글 안에서 "CSS, css"처럼 같은 키가 겹치면 한 번만 센다. */
  function tagCounts() {
    var counts = Object.create(null);
    postsInCat().forEach(function (post) {
      var seen = Object.create(null);
      post.tags.forEach(function (tag) {
        var key = U.normTag(tag);
        if (!key || seen[key]) return;
        seen[key] = true;
        if (!counts[key]) counts[key] = { name: String(tag).trim(), count: 0 };
        counts[key].count += 1;
      });
    });
    /* 선택된 태그는 이 분류에 없더라도 0으로 남긴다. 보이지 않는 필터가 걸려 있으면 안 된다. */
    state.tags.forEach(function (key) { if (!counts[key]) counts[key] = { name: key, count: 0 }; });
    return counts;
  }

  function renderTagIndex() {
    if (!dom.tagIndex || !dom.tagFold) return;
    var counts = tagCounts();
    var tags = Object.keys(counts).sort(function (a, b) {
      if (counts[b].count !== counts[a].count) return counts[b].count - counts[a].count;
      return a.localeCompare(b, 'ko');
    });

    /* 태그가 하나도 없으면 손잡이째 감춘다 — 열어도 아무것도 없는 <details>는 남기지 않는다. */
    U.setHidden(dom.tagFold, !tags.length);
    if (!tags.length) { U.clear(dom.tagIndex); return; }

    if (dom.tagTotal) dom.tagTotal.textContent = String(tags.length);

    var frag = document.createDocumentFragment();
    frag.appendChild(indexItem({
      tag: '*', name: '전체', count: postsInCat().length, active: state.tags.length === 0
    }));
    tags.forEach(function (key) {
      /* data-tag(필터 값·주소)는 키, 화면 글자는 원문 표기. */
      frag.appendChild(indexItem({
        tag: key, name: counts[key].name, count: counts[key].count,
        active: state.tags.indexOf(key) !== -1
      }));
    });
    U.clear(dom.tagIndex);
    dom.tagIndex.appendChild(frag);

    /* 주소에 태그 필터가 걸려 있는데 그 필터가 접혀 있으면 사용자는 왜 글이 3편뿐인지 알 수 없다.
       그래서 열기만 하고 닫지는 않는다 — 닫는 것은 사용자의 몫이다(계약서 §4-3). */
    if (state.tags.length) dom.tagFold.setAttribute('open', '');
    openTagsFromHash();
  }

  /* 헤더의 "태그"(index.html#tags)로 왔으면 접힌 손잡이를 열어 준다(계약서 §3-3).
     스크롤은 브라우저 앵커 이동에 맡긴다. 태그가 0개라 hidden이면 열어도 보이지 않으니 그대로 둔다.
     여기도 열기만 한다 — 해시가 사라졌다고 닫으면 사용자가 손으로 연 상태까지 같이 닫힌다. */
  function openTagsFromHash() {
    if (!dom.tagFold) return;
    if (window.location.hash === '#tags') dom.tagFold.open = true;
  }

  /* ---------- 사이드바 (사양 B) ----------
     트리를 그리는 것은 ui.js의 몫이다. 여기서는 데이터(글 전체 + 정렬된 분류)와
     "지금 어느 분류가 켜져 있는가"만 넘긴다. 마지막으로 넘긴 activeCat을 기억해 두는 이유 —
     renderIndexes()는 태그 클릭에도 돌지만 사이드바는 태그를 모르므로 그때는 다시 그릴 필요가 없다. */
  var sideActiveCat;     // undefined = 아직 한 번도 안 그림

  function renderSide() {
    /* ui.js가 아직 renderSide를 내놓지 않은 빌드(또는 구버전 캐시)에서도 목록은 살아 있어야 한다. */
    if (typeof Blog.ui.renderSide !== 'function') return;
    var active = state.cat === '*' ? null : state.cat;
    if (active === sideActiveCat) return;
    sideActiveCat = active;
    Blog.ui.renderSide({
      posts: state.posts,
      cats: sortedCats(),
      activeId: null,
      activeCat: active
    });
  }

  /* ---------- URL 상태 ---------- */

  /* 주소를 상태로 읽는다. v2.x의 ?sort= 는 폐기됐다 — 남아 있으면 정리해야 하므로 알려 준다.
     보이지도 않는 정렬을 주소가 약속하고 있으면 그 링크를 받은 사람이 헷갈린다. */
  function readUrl() {
    var q = U.getQuery();
    state.query = q.q || '';
    /* 분류 slug는 소문자다(계약서 §9-3). 손으로 친 ?cat=CSS 가 "그런 분류는 없습니다"로 떨어지지 않게 낮춘다. */
    state.cat = q.cat ? String(q.cat).trim().toLowerCase() : '*';
    /* 태그도 비교 키로 읽는다 — 상세 페이지의 ?tags=CSS 링크와 인덱스의 data-tag가 같은 키여야 한다. */
    state.tags = q.tags ? q.tags.split(',').map(U.normTag).filter(Boolean) : [];
    return q.sort !== undefined;
  }

  /* 검색어는 replace(타이핑마다 히스토리가 쌓이면 뒤로가기가 못 쓰게 된다),
     분류·태그처럼 한 번에 끝나는 조작은 push. */
  function writeUrl(push) {
    U.setQuery({
      q: state.query || null,
      cat: state.cat === '*' ? null : state.cat,
      tags: state.tags.length ? state.tags.join(',') : null,
      sort: null       // 폐기된 파라미터는 주소에서 지운다
    }, push);
  }

  function syncControls() {
    if (dom.search) dom.search.value = state.query;
    if (dom.searchClear) U.setHidden(dom.searchClear, !state.query);
  }

  function resetFilters() {
    state.query = '';
    state.cat = '*';
    state.tags = [];
    writeUrl(true);
    syncControls();
    renderIndexes();
    renderList();
  }

  /* 분류가 바뀌면 태그 개수가 바뀐다(태그는 보고 있는 분류 안에서만 센다). 분류가 바뀌는 경로(사이드바 링크 = 새 주소 로드·
     뒤로가기·초기화)는 전부 여기를 지나므로 태그 인덱스와 사이드바의 activeCat을 항상 같이 맞춘다. */
  function renderIndexes() {
    renderTagIndex();
    renderSide();
  }

  /* ---------- 이벤트 ---------- */

  function bind() {
    var onSearch = U.debounce(function () {
      state.query = dom.search.value;
      writeUrl(false);
      U.setHidden(dom.searchClear, !state.query);
      renderList();
    }, CFG.debounce.search);

    U.on(dom.search, 'input', onSearch);

    U.on(dom.searchClear, 'click', function () {
      onSearch.cancel();            // 대기 중이던 입력이 뒤늦게 덮어쓰지 않게
      state.query = '';
      dom.search.value = '';
      U.setHidden(dom.searchClear, true);
      writeUrl(true);
      renderList();
      dom.search.focus();
    });

    /* 분류 클릭 핸들러는 없다 — 사이드바의 분류 링크(index.html?cat=…)가 페이지를 새로 열고 readUrl()이 받는다(계약서 §3-2·§4-3). */

    /* 태그는 다중 선택. '*'는 필터 해제다. */
    U.on(dom.tagIndex, 'click', function (e) {
      var btn = e.target.closest('.index-item');
      if (!btn) return;
      var tag = btn.getAttribute('data-tag');
      if (tag === '*') state.tags = [];
      else {
        var at = state.tags.indexOf(tag);
        if (at === -1) state.tags.push(tag);
        else state.tags.splice(at, 1);
      }
      writeUrl(true);
      renderIndexes();
      renderList();
    });

    /* 뒤로가기로 이전 검색·분류·태그 상태가 살아나야 한다. */
    U.on(window, 'popstate', function () {
      readUrl();
      syncControls();
      renderIndexes();
      renderList();
    });

    /* 이미 index.html에 있는 채로 헤더의 "태그"를 누르면 페이지가 다시 열리지 않고 해시만 바뀐다. */
    U.on(window, 'hashchange', openTagsFromHash);

    /* "/" 로 검색창 포커스 */
    U.on(document, 'keydown', function (e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      dom.search.focus();
      dom.search.select();
    });
  }

  /* ---------- 부트스트랩 ---------- */

  function fillSite(site) {
    U.qsa('[data-site-title]').forEach(function (n) { n.textContent = site.title; });
    document.title = site.title;
  }

  /* 저장하지 않은 초안이 남아 있으면 알려 준다(데이터 유실 방지). */
  function noticeDrafts() {
    if (!Blog.admin.isAdmin()) return;
    var drafts = store.draft.list();
    if (!drafts.length) return;
    U.toast('저장하지 않은 초안 ' + drafts.length + '개가 남아 있습니다', 'warn');
  }

  /* posts/ 안의 파일이 잘못돼 있다는 경고들. 관리자(= 파일을 고칠 수 있는 사람)에게만 띄운다.
     방문자에게는 고칠 방법이 없는 경고일 뿐이고, 화면은 폴백으로 이미 정상 동작하고 있다.
     ※ categories.json의 빈 배열은 경고 대상이 아니다 — 분류 0개는 정상 상태다(store.loadCategories). */
  function noticeDataProblems() {
    if (!Blog.admin.isAdmin()) return;

    var catErr = store.getCategoryError();
    if (catErr) {
      U.toast('posts/categories.json을 읽지 못해 분류를 글에서 유추했습니다 — ' + (catErr.message || ''), 'warn');
    }

    var dups = store.getIndexDuplicates();
    if (dups.length) {
      U.toast('index.json에 중복된 id가 있습니다: ' + dups.join(', ') + ' (뒤의 것은 무시)', 'warn');
    }
  }

  function showLoadError(err) {
    U.setHidden(dom.loading, true);
    U.setHidden(dom.tagFold, true);
    U.clear(dom.list);
    U.setHidden(dom.empty, false);
    setEmptyMessage(
      err && err.code === 'file' ? '로컬 서버로 열어 주세요' : '글 목록을 불러오지 못했습니다',
      (err && err.message) || '알 수 없는 오류가 발생했습니다.',
      false
    );
    /* 사이드바가 영영 빈 채로 남지 않게 빈 데이터를 넘긴다 — ui.js가 .side-empty 한 줄을 그린다. */
    if (typeof Blog.ui.renderSide === 'function') {
      Blog.ui.renderSide({ posts: [], cats: [], activeId: null, activeCat: null });
    }
  }

  function start() {
    dom.list = document.getElementById('postList');
    dom.empty = document.getElementById('listEmpty');
    dom.loading = document.getElementById('listLoading');
    dom.search = document.getElementById('searchInput');
    dom.searchClear = U.qs('.search-clear');
    dom.tagFold = document.getElementById('tags');
    dom.tagIndex = document.getElementById('tagIndex');
    /* 손잡이의 개수 칸. #tagIndex 안에도 .index-count가 생기므로 summary로 범위를 좁힌다. */
    dom.tagTotal = U.qs('.index-fold-summary .index-count', dom.tagFold);

    Blog.ui.initShell();
    Blog.admin.init();

    /* 첫 로드에서만 주소를 정리한다(뒤로가기로 돌아온 항목까지 고쳐 쓰면 히스토리가 흔들린다). */
    if (readUrl()) writeUrl(false);
    syncControls();
    openTagsFromHash();
    bind();

    /* "불러오는 중"은 마크업에서 hidden으로 시작한다. CSP가 <noscript> 안의 인라인 <style>을 막아
       JS가 꺼진 화면에서 이 줄을 CSS로 감출 수 없기 때문이다 — 켜는 쪽을 JS로 돌리면 같은 효과다. */
    U.setHidden(dom.loading, false);

    /* 분류는 목록과 동시에 받는다. 순서대로 기다리면 첫 화면이 한 번 더 늦어진다.
       loadCategories()는 실패해도 reject하지 않으므로 index.json 오류만 catch에 온다. */
    Promise.all([store.loadIndex(), store.loadCategories()]).then(function (results) {
      var data = results[0];
      setPosts(data.posts);
      fillSite(data.site);
      U.setHidden(dom.loading, true);
      renderIndexes();
      renderList();
      noticeDrafts();
      noticeDataProblems();
    }).catch(function (err) {
      showLoadError(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
