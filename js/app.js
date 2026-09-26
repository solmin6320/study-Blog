/* app.js — index.html 전용.
   카드 그리드(분류 → 제목 → 날짜·태그, 계약서 §4-4) 렌더 + 검색 + 결과 줄 + 사이드바 데이터 공급 + URL 상태 동기화.
   분류 필터(?cat=)는 유지하되 거는 쪽은 사이드바(ui.js .side-cat-name)다 — 분류 인덱스 행 #catRow는 v3.9에서 폐기됐다(§4-3).
   태그 필터(?tags=)도 유지하되 거는 쪽은 상세의 태그 링크(post.js)다 — 태그 인덱스 #tags는 v4.0에서 폐기됐다(사용자 판정, §4-3).
   걸린 필터를 보여 주고 푸는 일은 결과 줄 .list-bar(§4-5)가 한다.
   정렬 컨트롤은 없다. 학습 기록의 순서는 시간순 하나다(계약서 §0-2).
   v4.4: 세션의 첫 로드에 h1.page-title을 한 글자씩 쓰는 일(제목 타자, §3-5 ②)도 여기다 — 그 h1이 이 페이지에만 있다. */
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
  /* 비교 키 → 화면 표기. 결과 줄(§4-5)이 "css 태그 3편"을 쓸 때 주소의 키(소문자)가 아니라 글에 적힌 표기를 보여 준다.
     같은 키의 표기가 여럿이면 index.json 순서에서 먼저 나온 것 — v3.9 태그 인덱스와 같은 규칙이다. */
  var tagNameByKey = Object.create(null);

  function setPosts(list) {
    state.posts = list;
    postById = Object.create(null);
    slugById = Object.create(null);
    searchById = Object.create(null);
    tagKeysById = Object.create(null);
    tagNameByKey = Object.create(null);
    list.forEach(function (post) {
      var slug = store.categorySlug(post.category);
      postById[post.id] = post;
      slugById[post.id] = slug;
      tagKeysById[post.id] = post.tags.map(U.normTag);
      post.tags.forEach(function (tag) {
        var key = U.normTag(tag);
        if (key && !tagNameByKey[key]) tagNameByKey[key] = String(tag).trim();
      });
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

    /* v4.0(C1): #postList는 더 이상 live 영역이 아니다 — 필터마다 카드 전량이 낭독됐다. 무엇이 바뀌었는지는
       결과 줄(.list-status, role="status") 한 문장이 말한다(계약서 §4-5). 그래서 aria-busy 묶음도 필요 없다. */
    U.clear(dom.list);
    dom.list.appendChild(frag);

    U.setHidden(dom.empty, posts.length !== 0);
    if (!posts.length) renderEmpty();
    renderStatus(posts.length);

    markReady();
  }

  /* ---------- 결과 줄 (계약서 §4-5) ---------- */

  function hasFilter() {
    return state.cat !== '*' || state.tags.length > 0 || Boolean(state.query.trim());
  }

  /* "전체 3편" / "Java 분류 3편" / "css, js 태그 2편" / "Java 분류, ‘그리드’ 검색 1편".
     가운뎃점으로 잇지 않는다(원칙 7). "분류"·"태그"·"검색"을 붙이는 이유 — 분류명 = 태그명(Java)인 블로그라
     이름만 쓰면 무엇으로 걸렀는지 알 수 없다. */
  function statusText(count) {
    var parts = [];
    if (state.cat !== '*') parts.push(store.categoryName(state.cat) + ' 분류');
    if (state.tags.length) {
      parts.push(state.tags.map(function (key) { return tagNameByKey[key] || key; }).join(', ') + ' 태그');
    }
    var q = state.query.trim();
    if (q) parts.push('‘' + q + '’ 검색');
    return (parts.length ? parts.join(', ') : '전체') + ' ' + count + '편';
  }

  /* 0편·로드 전·오류에는 줄째 감춘다 — 그 상황의 설명과 "전체 글 보기"는 .list-empty가 한다(같은 버튼이 둘이 되지 않게).
     같은 문장이면 대입하지 않는다 — role="status"가 같은 말을 다시 읽지 않게. */
  function renderStatus(count) {
    if (!dom.bar) return;
    var text = count ? statusText(count) : '';
    if (dom.status.textContent !== text) dom.status.textContent = text;
    U.setHidden(dom.bar, !count);
    U.setHidden(dom.reset, !count || !hasFilter());
  }

  /* 글이 있는 분류의 수 → #postList[data-cats]. "1"이면 CSS가 카드의 분류 라벨을 감춘다(§4-4 — 라벨이 늘 같은 글자라 정보가 0).
     필터 결과가 아니라 블로그 전체 기준이다 — ?cat= 필터 중에는 감추지 않는다. v3.9는 이 판정을 CSS가 사이드바 DOM에서 읽었다. */
  function markCatCount() {
    var n = store.categoryList(state.posts).filter(function (cat) { return cat.count > 0; }).length;
    dom.list.setAttribute('data-cats', String(n));
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
        '주소의 ?cat= 값이 분류 목록에 없습니다. 왼쪽 분류 메뉴에서 다시 골라 주세요.', 'reset');
      return;
    }

    if (state.cat !== '*' && !postsInCat().length) {
      var name = store.categoryName(state.cat);
      setEmptyMessage('‘' + name + '’ 에 아직 글이 없습니다.',
        admin
          ? 'posts/' + state.cat + '/ 폴더에 .md 파일을 넣으면 여기에 나타납니다.'
          : '다른 분류를 골라 보세요.',
        'reset');
      return;
    }

    setEmptyMessage('조건에 맞는 글이 없습니다.',
      state.query ? '검색어를 바꾸거나 전체 글에서 찾아 보세요.' : '전체 글에서 찾아 보세요.',
      'reset');
  }

  /* action: 'reset'(필터가 걸린 채 비었다 → 전체 글 보기) | 'retry'(불러오기 실패 → 다시 시도) | false(누를 것 없음).
     버튼은 많아야 하나다 — 실패에는 "전체 글 보기"가 뜻이 없고(목록 자체가 없다), 빈 결과에는 다시 불러와도 같다(§4). */
  function setEmptyMessage(title, desc, action) {
    if (!dom.empty) return;
    /* 계약서 §4-4: 첫 줄은 <strong>(무슨 상태인지), 둘째 줄은 다음 행동. 클래스를 새로 만들지 않는다.
       v4.0: 버튼 문구 "조건 초기화" → "전체 글 보기". 결과 줄의 .list-reset과 같은 동작이라 같은 이름이다(§4-5). */
    U.clear(dom.empty);
    dom.empty.appendChild(U.el('p', null, [U.el('strong', { text: title })]));
    dom.empty.appendChild(U.el('p', { text: desc }));
    var button = emptyAction(action);
    if (button) dom.empty.appendChild(button);
  }

  function emptyAction(action) {
    if (action === 'reset') {
      return U.el('button', {
        class: 'btn',
        type: 'button',
        text: '전체 글 보기',
        onclick: function () { resetFilters(); }
      });
    }
    if (action === 'retry') {
      /* 다시 불러오는 가장 확실한 길은 페이지째 다시 여는 것이다 — 반쯤 채운 상태(사이드바·결과 줄)를 되감을 필요가 없다.
         index.json은 no-cache 재검증이라 새로고침이 옛 실패를 캐시에서 되살리지 않는다(store.js REVALIDATE). */
      return U.el('button', {
        class: 'btn btn-primary',
        type: 'button',
        text: '다시 시도',
        onclick: function () { window.location.reload(); }
      });
    }
    return null;
  }

  /* (v4.0 폐기) 태그 인덱스 — indexItem() · tagCounts() · renderTagIndex() · openTagsFromHash().
     사용자 판정 "홈 화면에 게시글 바로 위에 존재하는 태그 카테고리 지워"(계약서 §4-3). ?tags= 필터는 살아 있고
     (상세의 태그 링크가 건다), 걸린 필터를 보여 주고 푸는 일은 결과 줄(renderStatus · resetFilters)이 한다. */

  /* 정렬은 U.sortCats(order → 글 수 → 이름, 계약서 §3-2). 사이드바가 이 순서로 그린다. */
  function sortedCats() {
    return U.sortCats(store.categoryList(state.posts));
  }

  /* ---------- 사이드바 (사양 B) ----------
     트리를 그리는 것은 ui.js의 몫이다. 여기서는 데이터(글 전체 + 정렬된 분류)와
     "지금 어느 분류가 켜져 있는가"만 넘긴다. 마지막으로 넘긴 activeCat을 기억해 두는 이유 —
     renderSide()는 뒤로가기·필터 해제마다 돌지만 사이드바는 태그·검색어를 모르므로 분류가 같으면 다시 그릴 필요가 없다. */
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
    /* 태그도 비교 키로 읽는다 — 상세 페이지의 ?tags=CSS 링크와 글의 태그가 같은 키로 맞아야 한다(U.normTag). */
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
    saveListState(currentScroll());
  }

  /* ---------- 목록 상태 보존 (계약서 §4-6) ----------
     상세의 "목록"이 필터 풀린 전체 목록 맨 위로 떨어지고(①②), 뒤로가기도 맨 위에 남던(④) 두 결함의 몫.
     목록은 index.json을 받은 "뒤에" 그려지므로 브라우저의 자동 복원은 아직 짧은 페이지에서 먼저 일어나 맨 위에 멈춘다 —
     그래서 자리를 직접 적어 두고 첫 렌더 뒤에 직접 돌려놓는다. 저장소가 막혀 있으면(사생활 모드 등) 전부 조용히 v4.0 동작으로 돌아간다. */

  function sessionGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (err) { return null; }
  }

  function sessionSet(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (err) { /* 저장 실패 = 복원하지 않을 뿐 */ }
  }

  function sessionRemove(key) {
    try { window.sessionStorage.removeItem(key); } catch (err) { /* 위와 같다 */ }
  }

  /* 형식이 어긋난 값(다른 버전이 남긴 것·손으로 고친 것)은 없는 것으로 본다 — 엉뚱한 자리로 튀는 것보다 맨 위가 낫다. */
  function readListState() {
    var raw = sessionGet(CFG.storageKeys.list);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data.search !== 'string') return null;
      var y = Number(data.y);
      return { search: data.search, y: isFinite(y) && y > 0 ? y : 0 };
    } catch (err) {
      return null;
    }
  }

  function currentScroll() {
    return window.scrollY || window.pageYOffset || 0;
  }

  /* search와 y는 늘 같은 순간에 함께 적는다 — 다른 조건의 목록에서 잰 스크롤 값이 이 조건에 붙어 있으면 엉뚱한 자리로 간다.
     start()는 이 값을 맨 먼저 읽어 두므로(savedList) 로드 중에 덮어써도 복원할 자리는 잃지 않는다. */
  function saveListState(y) {
    var value = { search: window.location.search, y: Math.max(0, Math.round(Number(y) || 0)) };
    sessionSet(CFG.storageKeys.list, JSON.stringify(value));
  }

  /* "목록" 링크로 돌아왔다는 표식은 한 번 쓰고 버린다(§4-6 ④). 남겨 두면 다음에 헤더 "글"로 들어와도 옛 자리로 튄다. */
  function takeReturnMark() {
    var id = sessionGet(CFG.storageKeys.listReturn);
    if (id !== null) sessionRemove(CFG.storageKeys.listReturn);
    return id;
  }

  function navigationType() {
    try {
      var entry = window.performance.getEntriesByType('navigation')[0];
      return (entry && entry.type) || '';
    } catch (err) {
      return '';
    }
  }

  /* 복원은 "같은 목록으로 돌아왔을 때"만. 헤더 "글"·사이드바 분류·"전체 글 보기"는 새로 시작하는 길이라 맨 위가 맞다(§4-6 ⑥).
     reload도 넣는다 — scrollRestoration을 manual로 돌린 대가로 새로고침이 맨 위로 떨어지면 브라우저가 원래 하던 일을 빼앗는 셈이다. */
  function shouldRestore(saved, returnId) {
    if (!saved || saved.search !== window.location.search) return false;
    var type = navigationType();
    return returnId !== null || type === 'back_forward' || type === 'reload';
  }

  /* 방금 읽은 글의 카드 제목. 선택자에 주소 값을 끼워 넣지 않고 href를 직접 비교한다 — id에 어떤 글자가 와도 선택자가 깨지지 않는다. */
  function cardTitleFor(id) {
    var href = 'post.html?id=' + encodeURIComponent(id);
    return U.qsa('.entry-title', dom.list).filter(function (a) {
      return a.getAttribute('href') === href;
    })[0] || null;
  }

  /* 되돌아온 자리는 "원래 거기 있었다"여야 한다 — base.css의 html{scroll-behavior:smooth}가 걸리면 맨 위에서 y까지 목록이 흘러내려
     새로 연 페이지처럼 보인다. 'instant'를 모르는 브라우저는 옵션 객체에서 던지므로 좌표 호출로 물러난다. */
  function jumpTo(y) {
    try {
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    } catch (err) {
      window.scrollTo(0, y);
    }
  }

  /* 첫 renderList() 뒤 한 번. 카드가 놓인 다음 프레임이라야 페이지 높이가 y를 받아 준다.
     포커스는 "목록"으로 돌아온 경우만 — 키보드로 읽던 사람이 방금 읽은 글 다음에서 Tab을 이어 간다(§4-6 ⑤).
     preventScroll: 방금 맞춘 자리를 포커스가 다시 끌어당기지 않게. 필터가 바뀌어 카드가 없으면 아무것도 하지 않는다.
     돌려놓을 자리를 돌려준다(복원하지 않으면 null) — 첫 렌더 뒤의 기록이 아직 맨 위인 지금 스크롤로 그 자리를 덮지 않게. */
  function restoreListPlace(saved, returnId) {
    if (!shouldRestore(saved, returnId)) return null;
    window.requestAnimationFrame(function () {
      jumpTo(saved.y);
      if (!returnId) return;
      var title = cardTitleFor(returnId);
      if (title) title.focus({ preventScroll: true });
    });
    return saved.y;
  }

  /* 떠나는 순간의 자리를 적는다. pagehide만으로는 모바일에서 탭째 버려질 때를 놓쳐 visibilitychange(hidden)도 듣는다.
     bfcache로 되살아날 때(pageshow.persisted)는 할 일이 없다 — 브라우저가 스크롤까지 그대로 돌려주고 start()도 다시 돌지 않는다(§4-6 ⑦).
     그래서 pageshow 핸들러를 두지 않는다. */
  function bindListState() {
    U.on(window, 'pagehide', function () { saveListState(currentScroll()); });
    U.on(document, 'visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveListState(currentScroll());
    });
  }

  function syncControls() {
    if (dom.search) dom.search.value = state.query;
    if (dom.searchClear) U.setHidden(dom.searchClear, !state.query);
  }

  /* "전체 글 보기"(결과 줄 .list-reset · 빈 상태의 버튼 — 같은 동작, 같은 이름, 계약서 §4-5).
     누른 버튼이 스스로 사라지므로 포커스를 옮긴다 — 안 옮기면 <body>로 떨어져 다음 Tab이 페이지 맨 앞으로 돌아간다.
     첫 카드 제목 = "전체 목록이 여기서 시작한다". 카드가 없으면(글 0편) 스킵 링크의 착지점과 같은 #main. */
  function resetFilters() {
    state.query = '';
    state.cat = '*';
    state.tags = [];
    writeUrl(true);
    syncControls();
    renderSide();
    renderList();
    var first = U.qs('.entry-title', dom.list);
    var target = first || document.getElementById('main');
    if (target) target.focus();
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

    /* 분류 클릭 핸들러는 없다 — 사이드바의 분류 링크(index.html?cat=…)가 페이지를 새로 열고 readUrl()이 받는다(계약서 §3-2·§4-3).
       태그도 같다 — 상세의 태그 링크(index.html?tags=…)가 건다. v4.0에 태그 인덱스와 그 클릭·hashchange 핸들러가 사라졌다. */

    /* 걸린 필터 전부를 푼다(계약서 §4-5). */
    U.on(dom.reset, 'click', function () {
      onSearch.cancel();            // 대기 중이던 입력이 뒤늦게 검색어를 되살리지 않게
      resetFilters();
    });

    /* 뒤로가기로 이전 검색·분류·태그 상태가 살아나야 한다. */
    U.on(window, 'popstate', function () {
      readUrl();
      syncControls();
      renderSide();
      renderList();
    });

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

  /* ---------- 제목 타자 (계약서 §3-5 ②, v4.4 · 박자 v4.5) ----------
     세션의 첫 index.html 로드에서 h1.page-title이 한 글자씩 쓰이고, 끝 글자 뒤 커서가 세 번 깜빡인 뒤 평문으로 돌아온다.
     나눠 맡는다 — 대기(layout.css §10 title-wait)·커서·깜빡임(components.css §16)은 CSS, 글자를 옮기는 것만 여기.
     첫 글자의 시각은 숫자로 세지 않는다. CSS 대기가 끝났다는 사건(Animation.finished)이 곧 첫 글자다 —
     600을 여기 복사하면 tokens.css의 --dur-intro를 고칠 때 둘이 어긋난다. 여기 있는 시각은 CSS가 모르는 셋뿐이다(§8-1).
     5초 예산(§3-5)은 첫 글자부터 잰다 — 상한 1600 + 깜빡임 3 × 1100(--dur-caret-blink) = 4900 < 안전망 5000.
     간격·상한을 늘리려면 이 식이 5000 미만인지 먼저 본다 — 넘으면 안전망이 깜빡임 도중에 제목을 끊는다. */

  var TYPE_STEP_MS = 160;    // 글자 간격(v4.5 — 120은 "쏟아지는" 속도였다) — 사람 흉내의 불규칙한 간격은 넣지 않는다
  var TYPE_SPAN_MS = 1600;   // 첫 글자 ~ 끝 글자 상한(간격과 같은 4/3 비율 — 11글자까지는 간격이 줄지 않는다). 넘는 긴 제목은 간격을 줄인다 — 어떤 제목이든 5초 안에 끝나게(WCAG 2.2.2)
  var TYPE_NET_MS = 5000;    // 안전망: 첫 글자 뒤 이만큼 지나면 깜빡임의 끝(animationend)을 못 받았어도 평문으로

  /* 지금 타자 중인 h1과 그 제목. fillSite()가 이것을 보고 대입을 비킨다. 타자 DOM이 없으면 null. */
  var typing = null;

  /* 사용자가 보는 한 글자(grapheme) 단위로 자른다 — 코드 단위로 자르면 이모지는 반쪽 서로게이트가, NFD 한글은 자모가
     한 박자씩 드러난다. Intl.Segmenter가 정답이고, 없는 브라우저에서는 graphemeFallback()이 흔한 경우를 맞춘다. */
  function splitGraphemes(text) {
    if (window.Intl && typeof window.Intl.Segmenter === 'function') {
      var segments = new window.Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text);
      return Array.from(segments, function (s) { return s.segment; });
    }
    return graphemeFallback(text);
  }

  /* 한글 자모 갈래 — 초성 L · 중성 V · 종성 T · 완성형 LV(받침 없음) · LVT(받침 있음). 한글이 아니면 ''. */
  function hangulType(cp) {
    if ((cp >= 0x1100 && cp <= 0x115F) || (cp >= 0xA960 && cp <= 0xA97C)) return 'L';
    if ((cp >= 0x1160 && cp <= 0x11A7) || (cp >= 0xD7B0 && cp <= 0xD7C6)) return 'V';
    if ((cp >= 0x11A8 && cp <= 0x11FF) || (cp >= 0xD7CB && cp <= 0xD7FB)) return 'T';
    if (cp >= 0xAC00 && cp <= 0xD7A3) return (cp - 0xAC00) % 28 === 0 ? 'LV' : 'LVT';
    return '';
  }

  /* 앞 갈래 뒤에 붙어 한 음절을 이루는 갈래(유니코드 음절 경계 규칙 GB6~GB8). */
  var HANGUL_NEXT = { L: ['L', 'V', 'LV', 'LVT'], V: ['V', 'T'], LV: ['V', 'T'], T: ['T'], LVT: ['T'] };

  /* 혼자서는 글자가 아니고 앞 글자에 얹히는 코드 포인트 — 결합 부호 · 변형 선택자 · 피부색 · 태그 문자 · ZWJ 자신. */
  function isExtender(cp) {
    return (cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x1AB0 && cp <= 0x1AFF) || (cp >= 0x1DC0 && cp <= 0x1DFF) ||
      (cp >= 0x20D0 && cp <= 0x20FF) || (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xFE20 && cp <= 0xFE2F) ||
      (cp >= 0x302E && cp <= 0x302F) || (cp >= 0x1F3FB && cp <= 0x1F3FF) || (cp >= 0xE0020 && cp <= 0xE007F) ||
      (cp >= 0xE0100 && cp <= 0xE01EF) || cp === 0x200D;
  }

  /* Intl.Segmenter가 없는 브라우저용 근사. 코드 포인트(Array.from — 서로게이트 쌍은 이미 한 덩이)를 차례로 보며
     앞 글자에 이어 붙일 것만 붙인다: 얹히는 코드 포인트 · ZWJ 뒤 글자(합성 이모지) · 국기 문자 둘째 · NFD 한글의 다음 자모.
     완전한 규칙표가 아니다 — 제목에 드물게 올 모양(인도계 문자의 결합 등)은 코드 포인트 단위로 갈릴 수 있다. */
  function graphemeFallback(text) {
    var out = [];
    var prev = -1;          // 바로 앞 코드 포인트
    var flags = 0;          // 지금 글자 안의 국기 문자 수 — 둘이 한 국기다
    Array.from(text).forEach(function (ch) {
      var cp = ch.codePointAt(0);
      var isFlag = cp >= 0x1F1E6 && cp <= 0x1F1FF;
      var prevHangul = hangulType(prev);
      var join = out.length > 0 && (
        prev === 0x200D || isExtender(cp) || (isFlag && flags === 1) ||
        (prevHangul !== '' && HANGUL_NEXT[prevHangul].indexOf(hangulType(cp)) !== -1)
      );
      if (join) {
        out[out.length - 1] += ch;
      } else {
        out.push(ch);
        flags = 0;
      }
      if (isFlag) flags += 1;
      prev = cp;
    });
    return out;
  }

  /* 조건 1(§3-5) — 제목에 CSS 대기 title-wait가 걸려 있고 아직 끝나지 않았다. 이 한 조건이 index.html · 첫 방문(data-intro 없음) ·
     reduced-motion 아님 · :has() 동작을 전부 담는다(CSS가 그때만 대기를 건다). 같은 판정을 여기 따로 두면 언젠가 어긋난다.
     fill이 없는 CSS 애니메이션은 끝나면 getAnimations()에서 빠지므로 목록에 있으면 아직 기다리는 중이다.
     끝났다면 완성된 제목이 이미 보였다 — 그 뒤에 비우고 다시 쓰면 "완성 → 빈칸 → 타자"로 깜빡인다(스크립트가 늦게 온 로드).
     getAnimations가 없는 브라우저는 끝났는지 물을 길이 없다 — 타자하지 않는다(정적 제목 그대로가 안전한 쪽). */
  function pendingTitleWait(h1) {
    if (typeof h1.getAnimations !== 'function') return null;
    return h1.getAnimations().filter(function (anim) {
      return anim.animationName === 'title-wait' && anim.playState !== 'finished' && Boolean(anim.finished);
    })[0] || null;
  }

  /* §3-5 ②의 DOM — 처음엔 제목 자리에 커서만(.title-typed 빈칸, .title-rest = 제목 전체, 투명). textContent만 쓴다.
     스팬 사이에 공백 텍스트 노드를 두지 않는다 — 공백 하나가 제목 폭을 바꾼다.
     .sr-only가 제목 전체를 한 번 들고 있고 글자가 옮겨 다니는 쪽은 aria-hidden이라, h1의 접근성 이름은 타자 전·중·후 같다. */
  function buildTypingDom(h1, title) {
    var typed = U.el('span', { class: 'title-typed' });
    var rest = U.el('span', { class: 'title-rest', text: title });
    var frag = document.createDocumentFragment();
    frag.appendChild(U.el('span', { class: 'sr-only', text: title }));
    frag.appendChild(U.el('span', { class: 'title-type', 'aria-hidden': 'true' }, [typed, rest]));
    U.clear(h1);
    h1.appendChild(frag);
    return { typed: typed, rest: rest };
  }

  /* 평문으로 되돌린다 — 정적 마크업·재방문과 같은 DOM(자식 요소 0, textContent = 제목). text를 주면 그 제목으로(fillSite).
     깜빡임 끝에서 오면 커서는 이미 꺼져 있고 폭도 같아 되돌리는 순간 보이는 변화가 없다. 타이머는 여기서 전부 거둔다. */
  function endTyping(run, text) {
    if (typing !== run) return;
    typing = null;
    window.clearTimeout(run.timer);
    window.clearTimeout(run.net);
    run.h1.textContent = text === undefined ? run.title : text;
  }

  /* 글자 시각은 첫 글자 기준 절대 시각이다(i번째 = t0 + i × step). setTimeout을 이어 붙이면 늦음이 쌓여 긴 제목이 상한을 넘는다
     (web-designer 실측: 23글자 1379ms). 타이머가 늦게 와도(숨은 탭 등) 그 시각까지 나왔어야 할 글자를 한 번에 채운다.
     글자는 즉시 나타난다 — 페이드·이동 없음(타자는 "쓰인다"이지 "들어온다"가 아니다). */
  function typeChars(run, parts, chars) {
    if (typing !== run) return;
    var n = chars.length;
    var step = n > 1 ? Math.min(TYPE_STEP_MS, TYPE_SPAN_MS / (n - 1)) : 0;
    var t0 = window.performance.now();
    var shown = 0;
    run.net = window.setTimeout(function () { endTyping(run); }, TYPE_NET_MS);

    function tick() {
      if (typing !== run) return;
      var due = step ? Math.min(n, Math.floor((window.performance.now() - t0) / step) + 1) : n;
      if (due > shown) {
        shown = due;
        parts.typed.textContent = chars.slice(0, shown).join('');
        /* 끝 글자에서 ''가 되면 자식 노드가 하나도 없다(:empty) — CSS가 그것을 "다 썼다"로 읽고 깜빡임을 건다(상태 클래스 없음, §8). */
        parts.rest.textContent = chars.slice(shown).join('');
      }
      /* ceil — 타이머는 정수 ms라 내림하면 목표보다 먼저 와서 한 번 헛돈다. */
      if (shown < n) run.timer = window.setTimeout(tick, Math.max(0, Math.ceil(t0 + shown * step - window.performance.now())));
    }
    tick();
  }

  /* 조건 셋(§3-5)이 모두 참일 때만 타자 DOM을 만든다. 하나라도 거짓이면 아무것도 하지 않는다 — 정적 제목 그대로, 커서 없음.
     글자 단위는 DOM을 건드리기 전에 자른다 — 여기서 실패하면 제목이 커서만 남은 채로 멈추지 않고 정적 제목 그대로다. */
  function startTitleTyping() {
    var h1 = U.qs('.page-title[data-site-title]');
    if (!h1) return;
    var title = h1.textContent.trim();
    /* 조건 3(빈 제목) · 조건 2(숨은 탭 — 뒤에서 연 탭·프리렌더는 타이머가 늘어져 반쯤 쓰인 제목으로 기다린다.
       보러 왔을 때 완성돼 있는 편이 낫다) · 조건 1. */
    if (!title || document.visibilityState !== 'visible') return;
    var wait = pendingTitleWait(h1);
    if (!wait) return;
    var chars = splitGraphemes(title);

    var run = { h1: h1, title: title, timer: 0, net: 0 };
    var parts = buildTypingDom(h1, title);
    typing = run;

    /* 깜빡임이 끝나면 평문(§3-5 "끝 상태"). ::before의 animationend가 .title-rest로 온다 — 이름으로 가린다. */
    parts.rest.addEventListener('animationend', function (e) {
      if (e.animationName === 'title-caret-blink') endTyping(run);
    });
    /* 대기가 끝난 순간 = 첫 글자. 대기가 취소되면(로드 중에 모션 설정이 바뀌어 CSS 조건이 빠졌다) 타자 없이 평문. */
    wait.finished.then(function () {
      typeChars(run, parts, chars);
    }, function () {
      endTyping(run);
    });
  }

  /* ---------- 부트스트랩 ---------- */

  /* index.json의 제목은 타자가 시작된 뒤에 올 수 있다(§3-5). 타자 중인 h1에 대입하면 타자 DOM이 통째로 지워진다 —
     같은 제목이면 비킨다(끝나면 같은 평문이 된다). 다르면 타자를 그 자리에서 끝내고(커서 없이) 받은 제목을 평문으로 넣는다.
     헤더 .brand의 [data-site-title]과 document.title은 늘 대입한다. */
  function fillSite(site) {
    U.qsa('[data-site-title]').forEach(function (n) {
      if (typing && n === typing.h1) {
        if (site.title !== typing.title) endTyping(typing, site.title);
        return;
      }
      n.textContent = site.title;
    });
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
      U.toast('posts/categories.json을 읽지 못해 분류를 글에서 유추했습니다: ' + (catErr.message || ''), 'warn');
    }

    var dups = store.getIndexDuplicates();
    if (dups.length) {
      U.toast('index.json에 중복된 id가 있습니다: ' + dups.join(', ') + ' (뒤의 것은 무시)', 'warn');
    }
  }

  /* 연결 자체가 안 된 실패(fetch가 응답 없이 거절 — store가 원인을 cause로 달아 둔다). HTTP 상태로 실패한 것은
     응답이 왔다는 뜻이라 "인터넷 연결을 확인"이 거짓말이 된다 — 그때는 store의 문장(상태 코드 포함)을 그대로 보인다. */
  function isOffline(err) {
    return Boolean(err && err.code === 'network' && err.cause);
  }

  /* 둘째 줄은 원인 + 할 일(계약서 §4). file://은 다시 시도해도 같으므로 버튼 없이 안내만(v4.0 그대로). */
  function showLoadError(err) {
    var isFile = Boolean(err && err.code === 'file');
    var desc = isOffline(err)
      ? '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
      : (err && err.message) || '알 수 없는 오류가 발생했습니다.';
    U.setHidden(dom.loading, true);
    renderStatus(0);                // 결과 줄째 감춘다 — 설명은 .list-empty가 한다
    U.clear(dom.list);
    U.setHidden(dom.empty, false);
    setEmptyMessage(
      isFile ? '로컬 서버로 열어 주세요' : '글 목록을 불러오지 못했습니다',
      desc,
      isFile ? false : 'retry'
    );
    /* 사이드바가 영영 빈 채로 남지 않게 빈 데이터를 넘긴다 — ui.js가 .side-empty 한 줄을 그린다. */
    if (typeof Blog.ui.renderSide === 'function') {
      Blog.ui.renderSide({ posts: [], cats: [], activeId: null, activeCat: null });
    }
  }

  function start() {
    /* 제목 타자는 무엇보다 먼저 — CSS 대기(title-wait) 안에 타자 DOM이 서야 조건 1이 참이고, 일찍 설수록 커서가 빨리 보인다.
       initShell()과의 순서는 상관없다(누구도 data-intro를 바꾸지 않는다, §3-5). 타자는 장식이다 — 여기서 무엇이 던져져도
       목록은 그려야 하므로 삼킨다. 삼키면 정적 제목이 그대로 남는다(DOM을 바꾸기 전에 던질 일은 끝나 있다). */
    try { startTitleTyping(); } catch (err) { /* 정적 제목 그대로 */ }

    dom.list = document.getElementById('postList');
    dom.empty = document.getElementById('listEmpty');
    dom.loading = document.getElementById('listLoading');
    dom.search = document.getElementById('searchInput');
    dom.searchClear = U.qs('.search-clear');
    /* 결과 줄(v4.0, 계약서 §4-5). 셋 다 index.html 정적 마크업에 있다 — 없으면 renderStatus()가 아무것도 하지 않는다. */
    dom.bar = document.getElementById('listBar');
    dom.status = document.getElementById('listStatus');
    dom.reset = document.getElementById('listReset');
    if (!dom.status || !dom.reset) dom.bar = null;

    /* 목록 상태(§4-6)는 무엇보다 먼저 읽는다 — 아래 writeUrl()(?sort= 정리)과 로드 중의 pagehide가 같은 칸을 덮어쓴다.
       스크롤 복원은 직접 한다(restoreListPlace). 브라우저에 맡기면 목록이 그려지기 전의 짧은 페이지에서 복원을 시도하고 맨 위에 멈춘다. */
    var savedList = readListState();
    var returnId = takeReturnMark();
    if ('scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch (err) { /* 못 바꾸면 v4.0 동작 */ }
    }
    bindListState();

    Blog.ui.initShell();
    Blog.admin.init();

    /* 첫 로드에서만 주소를 정리한다(뒤로가기로 돌아온 항목까지 고쳐 쓰면 히스토리가 흔들린다). */
    if (readUrl()) writeUrl(false);
    syncControls();
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
      markCatCount();               // renderList 전에 — 첫 카드가 놓일 때 라벨 표시 여부가 이미 정해져 있게
      renderSide();
      renderList();
      /* 첫 렌더 뒤: 돌아온 목록이면 자리를 돌려놓고, 지금 목록 주소를 적는다(§4-6 ①④⑤).
         돌려놓을 y를 그대로 적는 이유 — 복원은 다음 프레임이라 지금 scrollY는 아직 0이다. */
      var restoredY = restoreListPlace(savedList, returnId);
      saveListState(restoredY === null ? currentScroll() : restoredY);
      noticeDrafts();
      noticeDataProblems();
    }).catch(function (err) {
      showLoadError(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
