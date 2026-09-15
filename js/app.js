/* app.js — index.html 전용. 메모지 보드 렌더 + 검색 + 태그 필터 + 정렬 + URL 상태 동기화. */
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
    tags: [],         // 다중 선택. 하나라도 일치하면 통과(OR)
    sort: 'latest'
  };

  /* 값 조회용 맵은 반드시 프로토타입 없는 객체로 만든다.
     객체 리터럴이면 ?sort=constructor 같은 주소에서 SORTS[q.sort]가 Object.prototype의 멤버를 집어
     "있는 정렬"로 통과시킨다. 그러면 <select>에 없는 값이 state에 들어가 정렬 셀렉트가 빈 값이 되고
     오염된 값이 URL에 그대로 남아 공유된다(라운드 3 M3-12 실측).
     이 코드베이스의 다른 맵(postCache·counts·used…)은 이미 전부 Object.create(null)이다. */
  var SORTS = Object.assign(Object.create(null), { latest: 1, updated: 1, title: 1 });

  /* id → 글, id → 카테고리 slug.
     필터는 타이핑마다 돌아간다. 매번 배열을 훑거나 slug를 다시 계산하지 않도록 한 번만 만든다. */
  var postById = Object.create(null);
  var slugById = Object.create(null);
  var searchById = Object.create(null);

  function setPosts(list) {
    state.posts = list;
    postById = Object.create(null);
    slugById = Object.create(null);
    searchById = Object.create(null);
    list.forEach(function (post) {
      var slug = store.categorySlug(post.category);
      postById[post.id] = post;
      slugById[post.id] = slug;
      /* 검색 대상 문자열은 한 번만 만든다. 카테고리는 폴더명(css)과 표시 이름(CSS) 둘 다 걸리게. */
      searchById[post.id] = [
        post.title, post.summary, slug, store.categoryName(post.category), post.tags.join(' ')
      ].join(' ').toLowerCase();
    });
  }

  function postsInCat() {
    if (state.cat === '*') return state.posts;
    return state.posts.filter(function (post) { return slugById[post.id] === state.cat; });
  }

  /* 네비에 실제로 그려지는 분류인지. 등록된 카테고리 + 글만 있는 미등록 카테고리가 대상이다. */
  function catExists(slug) {
    if (slug === '*') return true;
    return store.categoryList(state.posts).some(function (cat) { return cat.slug === slug; });
  }

  /* ---------- 정렬 / 필터 ---------- */

  /* pinned는 어떤 정렬에서도 항상 위. 고정 글은 "지금 가장 중요한 메모"라는 뜻이기 때문. */
  function sortPosts(list, mode) {
    return list.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (mode === 'title') return a.title.localeCompare(b.title, 'ko');
      if (mode === 'updated') return String(b.updated || b.created).localeCompare(String(a.updated || a.created));
      return String(b.created).localeCompare(String(a.created));
    });
  }

  /* 카테고리(단일) · 태그(다중) · 검색어는 서로 다른 축이다. 셋을 AND로 묶는다. */
  function matches(post) {
    if (state.cat !== '*' && slugById[post.id] !== state.cat) return false;

    var q = state.query.trim().toLowerCase();
    if (q && (searchById[post.id] || '').indexOf(q) === -1) return false;
    if (state.tags.length) {
      var hit = post.tags.some(function (tag) { return state.tags.indexOf(tag) !== -1; });
      if (!hit) return false;
    }
    return true;
  }

  /* ---------- 카드 ---------- */

  /* 기울기는 id 해시로 정한다. Math.random을 쓰면 새로고침마다 각도가 바뀌어 어지럽다. */
  function rotationOf(id) {
    var range = CFG.memoRotation;
    var deg = (U.hashUnit(id) * 2 - 1) * range;
    return deg.toFixed(2) + 'deg';
  }

  /* created가 비면(.md에 `created:` 만 남긴 경우) 날짜 칸을 아예 만들지 않는다.
     <time datetime=""> 는 무효 마크업이고, 값 없는 "게시" 라벨은 카드에서 잡음일 뿐이다.
     자세한 배경은 post.js fillDates() 주석 — 두 화면이 같은 규칙을 쓴다. */
  function dateNodes(post) {
    if (!post.created) return [];

    var nodes = [];
    var createdRel = U.fmtRelative(post.created);
    nodes.push(U.el('time', {
      class: 'memo-date',
      datetime: post.created,
      title: '게시 ' + U.fmtKo(post.created),
      text: U.fmtDot(post.created) + (createdRel ? ' · ' + createdRel : '')
    }));

    /* created와 updated가 같으면 같은 날짜를 두 번 보여 주는 셈이라 숨긴다. */
    if (!U.sameMoment(post.created, post.updated)) {
      var sameYear = U.yearOf(post.created) === U.yearOf(post.updated);
      var label = sameYear ? U.fmtDotShort(post.updated) : U.fmtDot(post.updated);
      var updatedRel = U.fmtRelative(post.updated);
      nodes.push(U.el('time', {
        class: 'memo-updated',
        datetime: post.updated,
        title: '최종 수정 ' + U.fmtKo(post.updated),
        text: '수정 ' + label + (updatedRel ? ' · ' + updatedRel : '')
      }));
    }
    return nodes;
  }

  function memoCard(post, index) {
    var article = U.el('article', {
      class: 'memo' + (post.pinned ? ' is-pinned' : ''),
      'data-color': post.color,
      'data-id': post.id,
      style: '--i:' + index + '; --rot:' + rotationOf(post.id)
    });

    article.appendChild(U.el('span', { class: 'memo-pin', 'aria-hidden': 'true' }));

    /* 카드에는 폴더명(css)이 아니라 표시 이름(CSS)을 보여 준다. 폴더명은 파일 정리용 이름이다. */
    if (post.category) {
      article.appendChild(U.el('span', { class: 'memo-cat', text: store.categoryName(post.category) }));
    }

    article.appendChild(U.el('h2', { class: 'memo-title' }, [
      U.el('a', {
        class: 'memo-link',
        href: 'post.html?id=' + encodeURIComponent(post.id),
        text: post.title
      })
    ]));

    if (post.summary) {
      article.appendChild(U.el('p', { class: 'memo-summary', text: post.summary }));
    }

    if (post.tags.length) {
      var ul = U.el('ul', { class: 'memo-tags' });
      post.tags.forEach(function (tag) {
        ul.appendChild(U.el('li', { class: 'tag', text: tag }));
      });
      article.appendChild(ul);
    }

    /* 날짜가 하나도 없으면 .memo-meta 자체를 만들지 않는다.
       빈 div도 margin-block-start를 그대로 먹어서 카드 아래에 이유 없는 공백이 남는다. */
    var dates = dateNodes(post);
    if (dates.length) article.appendChild(U.el('div', { class: 'memo-meta' }, dates));

    var actions = U.el('div', { class: 'memo-actions', 'data-admin-only': '' }, [
      U.el('button', {
        class: 'memo-act',
        type: 'button',
        'data-act': 'edit',
        'aria-label': post.title + ' 수정',
        text: '수정'
      })
    ]);
    article.appendChild(actions);

    return article;
  }

  /* ---------- 렌더 ---------- */

  function renderBoard() {
    var sorted = sortPosts(state.posts, state.sort);
    /* 카드를 하나씩 board에 붙이면 붙일 때마다 레이아웃이 다시 계산된다. 조각에 모아 한 번에 넣는다. */
    var frag = document.createDocumentFragment();
    sorted.forEach(function (post, i) {
      frag.appendChild(memoCard(post, i));
    });
    /* 보드는 aria-live 영역이다. 지우고 다시 채우는 동안의 중간 상태까지 읽히면
       정렬 한 번에 카드 수만큼 발화가 쏟아진다. 다 채운 뒤 한 번만 알리게 묶는다. */
    dom.board.setAttribute('aria-busy', 'true');
    U.clear(dom.board);
    dom.board.appendChild(frag);
    /* 동적으로 만든 .memo-actions에도 관리자 규칙을 적용해야 한다. */
    Blog.admin.apply(dom.board);
    applyFilter();   // reveal()은 applyFilter()가 책임진다(아래 주석)
    dom.board.removeAttribute('aria-busy');
  }

  function applyFilter() {
    var visible = 0;
    U.qsa('.memo', dom.board).forEach(function (node) {
      var post = postById[node.getAttribute('data-id')];
      var ok = post ? matches(post) : false;
      node.classList.toggle('is-hidden', !ok);
      if (ok) {
        /* 걸러진 카드를 건너뛰고 스태거 순번을 다시 매긴다. */
        node.style.setProperty('--i', String(visible));
        visible += 1;
      }
    });

    U.setHidden(dom.empty, visible !== 0);
    if (visible === 0) renderEmpty();
    updateCount(visible);
    revealVisible();
  }

  /* 계약서 §4 — .is-hidden을 떼는 모든 경로에서 reveal()을 다시 부른다.
     필터가 걸린 동안 숨어 있던 카드는 IntersectionObserver의 관찰 대상에서 빠져 있어,
     필터를 풀어도 .is-visible을 받을 기회가 없다 → opacity:0인 빈 칸으로 영영 남는다(라운드 2 T1).
     호출부 5곳이 각자 기억해야 하는 규칙으로 두면 여섯 번째 호출부에서 다시 깨지므로
     applyFilter() 안에서 한 번에 처리한다.
     이미 드러난 카드(.is-visible)를 다시 관찰하면 진입 모션이 재생되므로 제외한다. */
  function revealVisible() {
    Blog.ui.reveal(U.qsa('.memo:not(.is-hidden):not(.is-visible)', dom.board));
  }

  /* 비었을 때의 문구는 "왜 비었는지"에 따라 달라야 한다.
     글이 아예 없는 것 / 이 카테고리가 빈 것 / 조건이 안 맞는 것은 사용자가 할 일이 서로 다르다. */
  function renderEmpty() {
    if (!state.posts.length) {
      setEmptyMessage('아직 메모가 없어요',
        'write.html 에디터로 첫 메모를 쓰고 posts/<카테고리>/ 폴더에 넣어 보세요.', false);
      return;
    }
    var filtered = state.query || state.tags.length;
    /* ?cat= 값이 목록에 없는 slug면 네비에 활성 탭이 하나도 없어 "왜 비었는지"를 알 수 없다.
       주소를 잘못 받은 것과 글이 아직 없는 것은 사용자가 할 일이 다르므로 문구를 나눈다. */
    if (state.cat !== '*' && !catExists(state.cat)) {
      setEmptyMessage('‘' + state.cat + '’ 라는 분류는 없어요',
        '주소의 ?cat= 값이 분류 목록에 없습니다. 위 분류 탭에서 다시 골라 주세요.', true);
      return;
    }
    if (state.cat !== '*' && !postsInCat().length) {
      var name = store.categoryName(state.cat);
      setEmptyMessage('‘' + name + '’ 에 아직 메모가 없어요',
        'posts/' + state.cat + '/ 폴더에 .md 파일을 넣으면 여기에 붙습니다.', true);
      return;
    }
    setEmptyMessage('조건에 맞는 메모가 없어요',
      filtered ? '검색어나 태그를 바꿔 보세요.' : '다른 카테고리를 골라 보세요.', true);
  }

  function updateCount(visible) {
    if (!dom.statPosts) return;
    dom.statPosts.setAttribute('data-count', String(visible));
    dom.statPosts.textContent = String(visible);
  }

  function setEmptyMessage(title, desc, showReset) {
    if (!dom.empty) return;
    /* 계약서에 없는 클래스를 만들지 않으려고 태그 구조만 쓴다(디자이너가 .board-empty 하위로 스타일링). */
    U.clear(dom.empty);
    dom.empty.appendChild(U.el('p', null, [U.el('strong', { text: title })]));
    dom.empty.appendChild(U.el('p', { text: desc }));
    if (showReset) {
      dom.empty.appendChild(U.el('button', {
        class: 'btn btn-ghost',
        type: 'button',
        text: '조건 초기화',
        onclick: function () { resetFilters(); }
      }));
    }
  }

  /* ---------- 카테고리 네비 (계약서 10-3) ---------- */

  function catButton(cat, isReal) {
    var active = state.cat === cat.slug;
    var btn = U.el('button', {
      class: 'cat-item' + (active ? ' is-active' : '') + (isReal && !cat.count ? ' is-empty' : ''),
      type: 'button',
      'data-cat': cat.slug,
      'data-color': isReal ? cat.color : null,
      /* 계약서 §10-3: 카테고리는 단일 선택이라 aria-current, 태그 칩은 다중 선택이라 aria-pressed.
         비활성 항목에는 aria-current="false"가 아니라 속성 자체를 두지 않는다. */
      'aria-current': active ? 'true' : null,
      title: cat.description || null
    });
    if (isReal) btn.appendChild(U.el('span', { class: 'cat-dot', 'aria-hidden': 'true' }));
    btn.appendChild(U.el('span', { class: 'cat-name', text: cat.name }));
    btn.appendChild(U.el('span', { class: 'cat-count', text: String(cat.count) }));
    return btn;
  }

  /* 글이 없는 카테고리도 그린다(.is-empty). 빈 칸이 보여야 "여기에 쓰면 되는구나"를 안다. */
  function renderCatNav() {
    if (!dom.catNav) return;
    var frag = document.createDocumentFragment();
    frag.appendChild(catButton({ slug: '*', name: '전체', count: state.posts.length }, false));
    store.categoryList(state.posts).forEach(function (cat) {
      frag.appendChild(catButton(cat, true));
    });
    U.clear(dom.catNav);
    dom.catNav.appendChild(frag);
  }

  function syncCatState() {
    U.qsa('.cat-item', dom.catNav).forEach(function (btn) {
      var active = btn.getAttribute('data-cat') === state.cat;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
  }

  /* ---------- 태그 칩 ---------- */

  /* 칩은 지금 보고 있는 카테고리 안의 태그만 센다. 카테고리를 고른 뒤에도
     전체 태그가 그대로 남아 있으면 "눌러도 아무것도 안 나오는 칩"이 생긴다. */
  function renderChips() {
    if (!dom.chips) return;
    var scope = postsInCat();
    var counts = Object.create(null);
    scope.forEach(function (post) {
      post.tags.forEach(function (tag) { counts[tag] = (counts[tag] || 0) + 1; });
    });
    /* 선택된 태그는 이 카테고리에 없더라도 0으로 남긴다. 보이지 않는 필터가 걸려 있으면 안 된다. */
    state.tags.forEach(function (tag) { if (!counts[tag]) counts[tag] = 0; });

    var tags = Object.keys(counts).sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b, 'ko');
    });

    var frag = document.createDocumentFragment();
    frag.appendChild(U.el('button', {
      class: 'chip' + (state.tags.length === 0 ? ' is-active' : ''),
      type: 'button',
      'data-tag': '*',
      'aria-pressed': state.tags.length === 0 ? 'true' : 'false',
      text: '전체'
    }));
    tags.forEach(function (tag) {
      var active = state.tags.indexOf(tag) !== -1;
      frag.appendChild(U.el('button', {
        class: 'chip' + (active ? ' is-active' : ''),
        type: 'button',
        'data-tag': tag,
        'aria-pressed': active ? 'true' : 'false',
        text: tag + ' ' + counts[tag]
      }));
    });

    U.clear(dom.chips);
    dom.chips.appendChild(frag);
  }

  function syncChipState() {
    U.qsa('.chip', dom.chips).forEach(function (chip) {
      var tag = chip.getAttribute('data-tag');
      var active = tag === '*' ? state.tags.length === 0 : state.tags.indexOf(tag) !== -1;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ---------- URL 상태 ---------- */

  /* 주소를 상태로 읽는다. 모르는 정렬값이 들어와 있었으면 true를 돌려준다 —
     화면은 최신순으로 도는데 주소만 ?sort=constructor 라고 말하고 있으면,
     그 주소를 공유받은 사람은 보이지도 않는 정렬을 기대하게 된다. 호출부가 주소를 정리한다. */
  function readUrl() {
    var q = U.getQuery();
    state.query = q.q || '';
    state.cat = q.cat ? String(q.cat).trim() : '*';
    state.tags = q.tags ? q.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];
    state.sort = SORTS[q.sort] ? q.sort : 'latest';
    return Boolean(q.sort) && !SORTS[q.sort];
  }

  /* 검색어는 replace(타이핑마다 히스토리가 쌓이면 뒤로가기가 못 쓰게 된다),
     카테고리·칩·정렬처럼 한 번에 끝나는 조작은 push. */
  function writeUrl(push) {
    U.setQuery({
      q: state.query || null,
      cat: state.cat === '*' ? null : state.cat,
      tags: state.tags.length ? state.tags.join(',') : null,
      sort: state.sort === 'latest' ? null : state.sort
    }, push);
  }

  function syncControls() {
    if (dom.search) dom.search.value = state.query;
    if (dom.sort) dom.sort.value = state.sort;
    if (dom.searchClear) U.setHidden(dom.searchClear, !state.query);
    syncCatState();
    syncChipState();
  }

  function resetFilters() {
    state.query = '';
    state.cat = '*';
    state.tags = [];
    writeUrl(true);
    renderChips();
    syncControls();
    applyFilter();
  }

  /* ---------- 이벤트 ---------- */

  function bind() {
    var onSearch = U.debounce(function () {
      state.query = dom.search.value;
      writeUrl(false);
      U.setHidden(dom.searchClear, !state.query);
      applyFilter();
    }, CFG.debounce.search);

    U.on(dom.search, 'input', onSearch);

    U.on(dom.searchClear, 'click', function () {
      state.query = '';
      dom.search.value = '';
      U.setHidden(dom.searchClear, true);
      writeUrl(true);
      applyFilter();
      dom.search.focus();
    });

    /* 카테고리는 단일 선택. 켜진 것을 다시 누르면 전체로 돌아온다. */
    U.on(dom.catNav, 'click', function (e) {
      var btn = e.target.closest('.cat-item');
      if (!btn) return;
      var slug = btn.getAttribute('data-cat');
      state.cat = (slug === state.cat && slug !== '*') ? '*' : slug;
      writeUrl(true);
      syncCatState();
      renderChips();
      applyFilter();
    });

    U.on(dom.chips, 'click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var tag = chip.getAttribute('data-tag');
      if (tag === '*') state.tags = [];
      else {
        var at = state.tags.indexOf(tag);
        if (at === -1) state.tags.push(tag);
        else state.tags.splice(at, 1);
      }
      writeUrl(true);
      syncChipState();
      applyFilter();
    });

    U.on(dom.sort, 'change', function () {
      state.sort = SORTS[dom.sort.value] ? dom.sort.value : 'latest';
      writeUrl(true);
      renderBoard();
    });

    /* 카드의 "수정" 버튼 → 에디터 수정 모드 */
    U.on(dom.board, 'click', function (e) {
      var btn = e.target.closest('.memo-act');
      if (!btn) return;
      var card = btn.closest('.memo');
      if (!card) return;
      window.location.href = 'write.html?id=' + encodeURIComponent(card.getAttribute('data-id'));
    });

    /* 뒤로가기로 이전 검색/카테고리/태그 상태가 살아나야 한다. */
    U.on(window, 'popstate', function () {
      readUrl();
      renderChips();
      syncControls();
      renderBoard();
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

  /* ---------- 부트스트랩 ---------- */

  function fillSite(site) {
    U.qsa('[data-site-title]').forEach(function (n) { n.textContent = site.title; });
    U.qsa('[data-site-sub]').forEach(function (n) { n.textContent = site.subtitle; });
    document.title = site.title;
  }

  /* 분류 수는 "글이 들어 있는 카테고리" 기준이다. 등록만 해 둔 빈 카테고리까지 세면
     숫자가 실제 내용보다 부풀어 보인다(빈 칸은 네비에 .is-empty로 이미 드러난다). */
  function fillStats() {
    var tags = Object.create(null);
    var cats = Object.create(null);
    state.posts.forEach(function (p) {
      p.tags.forEach(function (t) { tags[t] = 1; });
      if (p.category) cats[slugById[p.id]] = 1;
    });
    if (dom.statTags) dom.statTags.setAttribute('data-count', String(Object.keys(tags).length));
    if (dom.statCats) dom.statCats.setAttribute('data-count', String(Object.keys(cats).length));
    Blog.ui.countUp(dom.stats);
  }

  /* 내보내지 않은 초안이 남아 있으면 알려 준다(데이터 유실 방지). */
  function noticeDrafts() {
    if (!Blog.admin.isAdmin()) return;
    var drafts = store.draft.list();
    if (!drafts.length) return;
    U.toast('내보내지 않은 초안 ' + drafts.length + '개가 남아 있어요', 'warn');
  }

  /* posts/ 안의 파일이 잘못돼 있다는 경고들. 관리자(= 파일을 고칠 수 있는 사람)에게만 띄운다.
     방문자에게는 고칠 방법이 없는 경고일 뿐이고, 화면은 폴백으로 이미 정상 동작하고 있다.
     - categories.json이 깨지면 카테고리가 글에서 유추한 목록으로 바뀐다.
       색·설명·순서·빈 카테고리가 조용히 사라지므로 알려 주지 않으면 원인을 찾을 수 없다.
     - index.json에 같은 id가 두 번 있으면 뒤의 것이 버려진다(store가 먼저 것만 남긴다). */
  function noticeDataProblems() {
    if (!Blog.admin.isAdmin()) return;

    var catErr = store.getCategoryError();
    if (catErr) {
      U.toast('posts/categories.json을 읽지 못해 분류를 글에서 유추했어요 — ' + (catErr.message || ''), 'warn');
    }

    var dups = store.getIndexDuplicates();
    if (dups.length) {
      U.toast('index.json에 중복된 id가 있어요: ' + dups.join(', ') + ' (뒤의 것은 무시)', 'warn');
    }
  }

  function showLoadError(err) {
    U.setHidden(dom.skeleton, true);
    U.clear(dom.board);
    U.setHidden(dom.empty, false);
    setEmptyMessage(
      err && err.code === 'file' ? '로컬 서버로 열어 주세요' : '메모를 불러오지 못했어요',
      (err && err.message) || '알 수 없는 오류가 발생했습니다.',
      false
    );
  }

  function start() {
    dom.board = document.getElementById('board');
    dom.empty = document.getElementById('boardEmpty');
    dom.skeleton = document.getElementById('boardSkeleton');
    dom.search = document.getElementById('searchInput');
    dom.searchClear = U.qs('.search-clear');
    dom.chips = document.getElementById('tagFilters');
    dom.catNav = document.getElementById('catNav');
    dom.sort = document.getElementById('sortSelect');
    dom.stats = U.qs('.hero-stats');
    dom.statPosts = U.qs('[data-stat="posts"]');
    dom.statTags = U.qs('[data-stat="tags"]');
    dom.statCats = U.qs('[data-stat="cats"]');

    Blog.ui.initShell();
    Blog.admin.init();

    /* 첫 로드에서만 주소를 정리한다(뒤로가기로 돌아온 항목까지 고쳐 쓰면 히스토리가 흔들린다). */
    if (readUrl()) writeUrl(false);
    syncControls();
    bind();

    /* 카테고리는 목록과 동시에 받는다. 순서대로 기다리면 첫 화면이 한 번 더 늦어진다.
       loadCategories()는 실패해도 reject하지 않으므로 index.json 오류만 catch에 온다. */
    Promise.all([store.loadIndex(), store.loadCategories()]).then(function (results) {
      var data = results[0];
      setPosts(data.posts);
      fillSite(data.site);
      U.setHidden(dom.skeleton, true);
      renderCatNav();
      renderChips();
      syncControls();
      renderBoard();
      fillStats();
      noticeDrafts();
      noticeDataProblems();
    }).catch(function (err) {
      showLoadError(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
