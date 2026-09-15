/* store.js — posts/index.json · posts/categories.json · posts/<카테고리>/*.md 를 읽고,
   frontmatter를 파싱하고, 캐시하고,
   에디터 초안(localStorage)을 관리한다. 화면 로직은 전혀 모른다. */
(function (window, document) {
  'use strict';

  var Blog = window.Blog || (window.Blog = {});
  var CFG = Blog.config;
  var U = Blog.util;

  /* 한 번 읽은 글은 메모리에 둔다. 목록 → 상세 → 뒤로가기 → 상세를 반복해도 재요청하지 않는다. */
  var postCache = Object.create(null);
  var indexPromise = null;
  var indexData = null;
  var catPromise = null;
  var catData = null;       // { list: [...], derived: boolean }

  /* ---------- 오류 ---------- */

  /* 화면단이 분기할 수 있도록 code를 붙인다: file / network / notfound / parse */
  function fail(code, message, cause) {
    var err = new Error(message);
    err.code = code;
    if (cause) err.cause = cause;
    return err;
  }

  function guardProtocol() {
    if (window.location.protocol === 'file:') {
      throw fail('file',
        'file:// 로 열면 브라우저가 posts/ 파일 읽기를 막습니다. start.bat 으로 로컬 서버를 켜고 http://localhost:5500 으로 접속하세요.');
    }
  }

  function fetchText(url, opts) {
    guardProtocol();
    return window.fetch(url, opts || { cache: 'no-cache' })
      .then(function (res) {
        if (res.status === 404) throw fail('notfound', url + ' 파일을 찾을 수 없습니다.');
        if (!res.ok) throw fail('network', url + ' 요청 실패 (HTTP ' + res.status + ')');
        return res.text();
      })
      .catch(function (err) {
        if (err && err.code) throw err;
        throw fail('network', url + ' 을(를) 불러오지 못했습니다. 네트워크 또는 경로를 확인하세요.', err);
      });
  }

  /* ---------- frontmatter 파서 ----------
     YAML 라이브러리를 쓰지 않는다. 이 블로그가 실제로 쓰는 만큼만 지원한다:
     문자열 / 숫자 / boolean / [a, b] 인라인 배열 / "-" 블록 배열 / 따옴표 값.
     값에 콜론이 들어가도(created: 2026-09-13T14:20:00+09:00) 첫 콜론만 구분자로 본다. */

  function stripQuotes(raw) {
    var s = raw.trim();
    if (s.length >= 2) {
      var head = s.charAt(0), tail = s.charAt(s.length - 1);
      if ((head === '"' && tail === '"') || (head === "'" && tail === "'")) {
        return { text: s.slice(1, -1), quoted: true };
      }
    }
    return { text: s, quoted: false };
  }

  /* 따옴표가 붙어 있으면 무조건 문자열로 둔다(예: id: "2026" 이 숫자가 되면 안 된다). */
  function coerceScalar(raw) {
    var v = stripQuotes(raw);
    if (v.quoted) return v.text;
    var s = v.text;
    if (s === '') return '';
    if (s === 'true' || s === 'True') return true;
    if (s === 'false' || s === 'False') return false;
    if (s === 'null' || s === '~') return null;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    return s;
  }

  /* [a, "b, c", 3] — 따옴표 안의 쉼표는 구분자가 아니다. */
  function parseInlineArray(raw) {
    var inner = raw.trim().slice(1, -1);
    var out = [];
    var buf = '';
    var quote = null;
    for (var i = 0; i < inner.length; i += 1) {
      var ch = inner.charAt(i);
      if (quote) {
        if (ch === quote) quote = null;
        else buf += ch;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === ',') { out.push(buf); buf = ''; continue; }
      buf += ch;
    }
    out.push(buf);
    return out
      .map(function (item) { return String(item).trim(); })
      .filter(function (item) { return item !== ''; })
      .map(function (item) { return coerceScalar(item); });
  }

  function parseFrontmatter(text) {
    var src = String(text || '').replace(/^﻿/, '');
    var match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
    if (!match) {
      return {
        ok: false,
        reason: '파일 맨 위에 --- 로 감싼 frontmatter 블록이 없습니다.',
        data: {},
        body: src
      };
    }

    var lines = match[1].split(/\r?\n/);
    var data = {};
    var warnings = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];
      i += 1;
      if (!line.trim() || /^\s*#/.test(line)) continue;

      var colon = line.indexOf(':');
      if (colon === -1) { warnings.push('해석할 수 없는 줄: ' + line.trim()); continue; }

      var key = line.slice(0, colon).trim();
      var raw = line.slice(colon + 1).trim();
      if (!key) { warnings.push('키가 비어 있는 줄: ' + line.trim()); continue; }

      if (raw === '') {
        /* 블록 배열:
           tags:
             - css */
        var block = [];
        while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
          block.push(coerceScalar(lines[i].replace(/^\s*-\s+/, '')));
          i += 1;
        }
        data[key] = block.length ? block : '';
        continue;
      }

      if (raw.charAt(0) === '[' && raw.charAt(raw.length - 1) === ']') {
        data[key] = parseInlineArray(raw);
        continue;
      }

      data[key] = coerceScalar(raw);
    }

    return {
      ok: true,
      data: data,
      warnings: warnings,
      body: src.slice(match[0].length).replace(/^\s*\n/, '')
    };
  }

  /* ---------- 메타 정규화 ---------- */

  var COLOR_VALUES = CFG.colors.map(function (c) { return c.value; });

  function toTagArray(value) {
    if (Array.isArray(value)) return value.map(function (t) { return String(t).trim(); }).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    }
    return [];
  }

  function toBool(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return Boolean(value);
  }

  /* 색상이 팔레트 밖이면 id 해시로 하나 고른다. 빈 카드보다 낫고 매번 같은 색이 나온다. */
  function normalizeColor(value, id) {
    var color = String(value || '').trim().toLowerCase();
    if (COLOR_VALUES.indexOf(color) !== -1) return color;
    return COLOR_VALUES[Math.floor(U.hashUnit(id || 'x') * COLOR_VALUES.length) % COLOR_VALUES.length];
  }

  function normalizeMeta(raw, fallbackId) {
    var meta = raw || {};
    var id = String(meta.id || fallbackId || '').trim();
    var created = meta.created ? String(meta.created) : '';
    var updated = meta.updated ? String(meta.updated) : created;
    return {
      id: id,
      title: String(meta.title || '(제목 없음)'),
      summary: String(meta.summary || ''),
      created: created,
      updated: updated || created,
      tags: toTagArray(meta.tags),
      category: String(meta.category || ''),
      color: normalizeColor(meta.color, id),
      pinned: toBool(meta.pinned)
    };
  }

  /* .md의 frontmatter가 index.json과 다르면 .md를 진실로 삼는다.
     사용자가 파일을 직접 고칠 수 있고, 그 편집이 화면에 보이지 않으면 혼란스럽기 때문. */
  function mergeMeta(indexMeta, fileMeta) {
    var merged = {};
    var keys = ['id', 'title', 'summary', 'created', 'updated', 'tags', 'category', 'color', 'pinned'];
    keys.forEach(function (key) {
      var fromFile = fileMeta ? fileMeta[key] : undefined;
      var hasFile = fromFile !== undefined && fromFile !== null && fromFile !== ''
        && !(Array.isArray(fromFile) && fromFile.length === 0);
      merged[key] = hasFile ? fromFile : (indexMeta ? indexMeta[key] : undefined);
    });
    /* pinned는 false도 유효한 값이라 위 조건에서 걸러진다. 파일 값이 있으면 그대로 쓴다. */
    if (fileMeta && typeof fileMeta.pinned === 'boolean') merged.pinned = fileMeta.pinned;
    return normalizeMeta(merged, merged.id);
  }

  /* ---------- 카테고리 ----------
     categories.json은 사용자가 직접 열어 고치는 파일이다. 지워지거나 쉼표 하나가 빠져도
     블로그가 멈추면 안 된다. 그래서 loadCategories()는 절대 reject하지 않고,
     실패하면 index.json의 category 값에서 목록을 되살린다. */

  /* 폴더명으로 쓸 수 있는 문자만 남긴다. 밑줄은 살린다(_uncategorized 폴백 폴더 때문).
     한글 이름은 여기서 빈 문자열이 되고, 호출부가 표시 이름 매칭으로 넘어간다. */
  function slugifyCategory(value) {
    return String(value === null || value === undefined ? '' : value).trim().toLowerCase()
      .replace(/[\s.]+/g, '-')
      .replace(/[^0-9a-z_\-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeCategory(raw, fallbackOrder) {
    var src = raw || {};
    var slug = slugifyCategory(src.slug || src.name);
    var name = String(src.name || src.slug || '').trim();
    var order = Number(src.order);
    return {
      slug: slug,
      name: name || slug,
      color: normalizeColor(src.color, slug),
      description: String(src.description || ''),
      order: isNaN(order) ? Number(fallbackOrder) || 0 : order
    };
  }

  function byOrder(a, b) {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), 'ko');
  }

  /* categories.json이 없을 때의 폴백: 글들이 실제로 쓰고 있는 category 값으로 목록을 만든다.
     색은 그 카테고리의 첫 글 색을 빌린다(네비 점 색이 비는 것보다 낫다). */
  function deriveCategories(posts) {
    var seen = Object.create(null);
    var list = [];
    (posts || []).forEach(function (post) {
      var label = String(post.category || '').trim();
      if (!label) return;
      var slug = slugifyCategory(label) || CFG.category.fallbackSlug;
      if (seen[slug]) return;
      seen[slug] = true;
      list.push({
        slug: slug,
        name: label,
        color: normalizeColor(post.color, slug),
        description: '',
        order: list.length
      });
    });
    return list;
  }

  function setCategories(list, derived) {
    catData = {
      list: list.filter(function (c) { return c.slug; }).sort(byOrder),
      derived: Boolean(derived)
    };
    return catData;
  }

  function loadCategories(force) {
    if (catPromise && !force) return catPromise;
    /* fetchText는 file:// 에서 동기적으로 throw한다. 호출부가 항상 Promise를 받도록 감싼다. */
    catPromise = Promise.resolve()
      .then(function () { return fetchText(CFG.paths.categories); })
      .then(function (text) {
        var json = JSON.parse(text.replace(/^﻿/, ''));
        var list = json && Array.isArray(json.categories) ? json.categories : [];
        if (!list.length) throw fail('parse', 'categories.json의 categories 배열이 비어 있습니다.');
        return setCategories(list.map(normalizeCategory), false);
      })
      .catch(function () {
        return loadIndex()
          .catch(function () { return null; })
          .then(function (data) {
            return setCategories(deriveCategories(data ? data.posts : []), true);
          });
      });
    return catPromise;
  }

  function getCategoriesSync() { return catData ? catData.list.slice() : []; }

  /* slug → 표시 이름 → slug화한 값 순으로 찾는다.
     사용자가 .md에 한글 카테고리를 직접 적어도 등록된 카테고리에 연결되도록. */
  function findCategory(value) {
    var raw = String(value === null || value === undefined ? '' : value).trim();
    if (!raw || !catData) return null;
    var lower = raw.toLowerCase();
    var slug = slugifyCategory(raw);
    var bySlug = null;
    var byName = null;
    catData.list.forEach(function (c) {
      if (!bySlug && (c.slug === lower || (slug && c.slug === slug))) bySlug = c;
      if (!byName && String(c.name).toLowerCase() === lower) byName = c;
    });
    return bySlug || byName || null;
  }

  /* 글 파일이 놓일 폴더명. 미등록 카테고리는 slug화해서 그대로 쓰고,
     그것마저 비면(한글만 적힌 경우) _uncategorized로 떨어뜨린다. */
  function categorySlug(value) {
    var found = findCategory(value);
    if (found) return found.slug;
    return slugifyCategory(value) || CFG.category.fallbackSlug;
  }

  function categoryName(value) {
    var found = findCategory(value);
    if (found) return found.name;
    var raw = String(value === null || value === undefined ? '' : value).trim();
    return raw || CFG.category.fallbackName;
  }

  function categoryColor(value) {
    var found = findCategory(value);
    return found ? found.color : CFG.category.fallbackColor;
  }

  /* slug → 글 수. 네비의 .cat-count와 .is-empty 판정에 쓴다. */
  function categoryCounts(posts) {
    var counts = Object.create(null);
    (posts || []).forEach(function (post) {
      var slug = categorySlug(post.category);
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }

  /* 등록된 카테고리 전체(글 0개 포함) + 글만 있고 등록되지 않은 카테고리.
     후자를 빼면 사용자가 categories.json 갱신을 잊었을 때 그 글에 도달할 길이 사라진다. */
  function categoryList(posts) {
    var counts = categoryCounts(posts);
    var known = Object.create(null);
    var out = (catData ? catData.list : []).map(function (c) {
      known[c.slug] = true;
      return {
        slug: c.slug, name: c.name, color: c.color,
        description: c.description, order: c.order,
        count: counts[c.slug] || 0, registered: true
      };
    });

    Object.keys(counts).forEach(function (slug) {
      if (known[slug]) return;
      var label = '';
      (posts || []).forEach(function (post) {
        if (!label && categorySlug(post.category) === slug) label = String(post.category || '').trim();
      });
      out.push({
        slug: slug,
        name: label || (slug === CFG.category.fallbackSlug ? CFG.category.fallbackName : slug),
        color: CFG.category.fallbackColor,
        description: '',
        order: 9999,
        count: counts[slug],
        registered: false
      });
    });

    return out.sort(byOrder);
  }

  /* ---------- index.json ---------- */

  function loadIndex(force) {
    if (indexPromise && !force) return indexPromise;
    /* fetchText는 file:// 에서 동기적으로 throw한다. 그대로 두면 호출부의 .catch가 아니라
       스크립트 자체가 멈춰서 "로컬 서버로 열어 주세요" 안내가 뜨지 않는다. */
    indexPromise = Promise.resolve()
      .then(function () { return fetchText(CFG.paths.index); })
      .then(function (text) {
        var json;
        try {
          json = JSON.parse(text.replace(/^﻿/, ''));
        } catch (err) {
          throw fail('parse', 'posts/index.json 형식이 올바르지 않습니다(쉼표나 따옴표를 확인하세요).', err);
        }
        var site = json && json.site ? json.site : {};
        var list = json && Array.isArray(json.posts) ? json.posts : [];
        indexData = {
          site: {
            title: String(site.title || CFG.site.title),
            subtitle: String(site.subtitle || CFG.site.subtitle)
          },
          posts: list.map(function (item) { return normalizeMeta(item, item && item.id); })
                     .filter(function (item) { return item.id; })
        };
        /* index.json의 site가 설정 기본값을 이긴다(파일이 진실). */
        CFG.site.title = indexData.site.title;
        CFG.site.subtitle = indexData.site.subtitle;
        return indexData;
      })
      .catch(function (err) {
        indexPromise = null;   // 재시도할 수 있게 실패한 약속은 버린다
        throw err;
      });
    return indexPromise;
  }

  function getIndexSync() { return indexData; }

  function findMeta(id) {
    if (!indexData) return null;
    var found = null;
    indexData.posts.forEach(function (p) { if (p.id === id) found = p; });
    return found;
  }

  /* ---------- posts/<category>/<id>.md ---------- */

  function postPath(id, category) {
    return CFG.paths.post(id, categorySlug(category));
  }

  /* 후보 경로 목록. 정상 상태라면 첫 번째에서 끝나므로 요청은 1번이다.
     나머지는 index.json이 없거나 폴더가 어긋났을 때만 쓰이는 구조선. */
  function postCandidates(id, indexMeta) {
    var urls = [];
    function push(url) { if (url && urls.indexOf(url) === -1) urls.push(url); }

    if (indexMeta && indexMeta.category) push(postPath(id, indexMeta.category));
    /* index.json을 못 읽었으면 폴더를 알 길이 없다. 등록된 카테고리를 훑어서라도 찾아 준다. */
    if (!indexMeta) {
      (catData ? catData.list : []).forEach(function (c) { push(CFG.paths.post(id, c.slug)); });
    }
    push(CFG.paths.post(id, CFG.category.fallbackSlug));
    push(CFG.paths.postFlat(id));                 // v1 평면 구조 호환
    return urls;
  }

  /* 404면 다음 후보로, 그 밖의 오류(네트워크·file://)면 즉시 중단한다.
     후자는 후보를 더 시도해도 같은 결과라 요청만 늘어난다. */
  function fetchFirst(urls) {
    function attempt(i) {
      if (i >= urls.length) {
        return Promise.reject(fail('notfound', urls[0] + ' 파일을 찾을 수 없습니다.'));
      }
      return Promise.resolve()
        .then(function () { return fetchText(urls[i]); })
        .then(function (text) { return { text: text, url: urls[i] }; })
        .catch(function (err) {
          if (err && err.code === 'notfound') return attempt(i + 1);
          throw err;
        });
    }
    return attempt(0);
  }

  function loadPost(id) {
    if (!id) return Promise.reject(fail('notfound', '글 id가 없습니다.'));
    if (postCache[id]) return Promise.resolve(postCache[id]);

    /* index.json은 글이 든 폴더를 알려 주고, categories.json은 표시 이름을 알려 준다.
       둘 다 실패해도 본문은 폴백 경로로 찾아 보여 준다. */
    return Promise.all([
      loadIndex().catch(function () { return null; }),
      loadCategories()
    ])
      .then(function () {
        return fetchFirst(postCandidates(id, findMeta(id)));
      })
      .then(function (res) {
        var text = res.text;
        var parsed = parseFrontmatter(text);
        var indexMeta = findMeta(id);
        var meta = mergeMeta(indexMeta, parsed.ok ? normalizeMeta(parsed.data, id) : null);
        if (!meta.id) meta.id = id;

        var post = {
          id: id,
          meta: meta,
          body: parsed.body,
          raw: text,
          path: res.url,
          frontmatterOk: parsed.ok,
          frontmatterReason: parsed.reason || '',
          warnings: parsed.warnings || []
        };
        postCache[id] = post;
        return post;
      });
  }

  function peekPost(id) { return postCache[id] || null; }

  /* 목록 정렬 기준(최신 게시순)에서의 앞뒤 글. 이전 = 더 오래된 글. */
  function neighbors(id) {
    if (!indexData) return { prev: null, next: null };
    var sorted = indexData.posts.slice().sort(function (a, b) {
      return String(b.created).localeCompare(String(a.created));
    });
    var at = -1;
    sorted.forEach(function (p, i) { if (p.id === id) at = i; });
    if (at === -1) return { prev: null, next: null };
    return {
      prev: sorted[at + 1] || null,   // 더 오래된 글
      next: sorted[at - 1] || null    // 더 최신 글
    };
  }

  /* ---------- 에디터 초안 (localStorage) ----------
     내보내기 전까지의 임시본만 담는다. 글의 영구 저장소는 posts/*.md 파일이다. */

  var DRAFT_PREFIX = CFG.storageKeys.draft + ':';

  function safeLocal() {
    try {
      var probe = '__blog_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (err) {
      return null;   // 시크릿 모드 등에서 접근이 막히면 초안 기능만 조용히 꺼진다
    }
  }

  function draftKey(id) { return DRAFT_PREFIX + (id || 'new'); }

  var draft = {
    save: function (id, payload) {
      var ls = safeLocal();
      if (!ls) return false;
      try {
        ls.setItem(draftKey(id), JSON.stringify({ savedAt: U.nowIsoKst(), data: payload }));
        return true;
      } catch (err) {
        return false;
      }
    },
    load: function (id) {
      var ls = safeLocal();
      if (!ls) return null;
      try {
        var text = ls.getItem(draftKey(id));
        if (!text) return null;
        var parsed = JSON.parse(text);
        return parsed && parsed.data ? parsed : null;
      } catch (err) {
        return null;
      }
    },
    clear: function (id) {
      var ls = safeLocal();
      if (!ls) return;
      try { ls.removeItem(draftKey(id)); } catch (err) { /* 무시 */ }
    },
    /* 내보내지 않은 초안이 남아 있으면 목록 화면에서 알려 주기 위한 목록 */
    list: function () {
      var ls = safeLocal();
      if (!ls) return [];
      var out = [];
      for (var i = 0; i < ls.length; i += 1) {
        var key = ls.key(i);
        if (key && key.indexOf(DRAFT_PREFIX) === 0) {
          out.push({ id: key.slice(DRAFT_PREFIX.length), key: key });
        }
      }
      return out;
    }
  };

  /* ---------- 내보내기용 직렬화 ---------- */

  /* 값에 콜론·쉼표·따옴표가 섞이면 큰따옴표로 감싼다. 파서가 다시 읽을 수 있는 형태로만 쓴다. */
  function yamlValue(value) {
    if (Array.isArray(value)) {
      return '[' + value.map(function (v) { return yamlValue(v); }).join(', ') + ']';
    }
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    var s = String(value === null || value === undefined ? '' : value);
    if (s === '') return '""';
    if (/^[\w가-힣][\w가-힣 .\-+/]*$/.test(s) && !/^(true|false|null)$/i.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;    // ISO 날짜는 그대로 둬도 파서가 문자열로 읽는다
    return '"' + s.replace(/"/g, '\\"') + '"';
  }

  function toFrontmatter(meta) {
    var order = ['id', 'title', 'summary', 'created', 'updated', 'tags', 'category', 'color', 'pinned'];
    var lines = ['---'];
    order.forEach(function (key) {
      lines.push(key + ': ' + yamlValue(meta[key]));
    });
    lines.push('---');
    return lines.join('\n');
  }

  function toMarkdownFile(meta, body) {
    return toFrontmatter(meta) + '\n\n' + String(body || '').replace(/\s*$/, '') + '\n';
  }

  /* index.json 재생성: 같은 id가 있으면 교체, 없으면 추가. 항상 최신 게시순으로 정렬해 둔다. */
  function buildIndexJson(meta, currentIndex) {
    var site = (currentIndex && currentIndex.site) || CFG.site;
    var posts = ((currentIndex && currentIndex.posts) || []).slice()
      .filter(function (p) { return p.id !== meta.id; });
    posts.push(meta);
    posts.sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.created).localeCompare(String(a.created));
    });
    var payload = {
      site: { title: site.title, subtitle: site.subtitle },
      posts: posts.map(function (p) {
        return {
          id: p.id, title: p.title, summary: p.summary,
          created: p.created, updated: p.updated,
          tags: p.tags, category: p.category, color: p.color, pinned: Boolean(p.pinned)
        };
      })
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  /* categories.json 재생성. 에디터에서 새 카테고리를 만들면 이 결과를 함께 내려받는다.
     order는 정렬 후 다시 0,1,2…로 매긴다 — 사용자가 파일을 직접 열었을 때 읽기 쉽도록. */
  function buildCategoriesJson(category, currentList) {
    var list = (currentList || (catData ? catData.list : []) || []).slice();
    if (category && (category.slug || category.name)) {
      var next = normalizeCategory(category, list.length);
      if (next.slug) {
        list = list.filter(function (c) { return c.slug !== next.slug; });
        list.push(next);
      }
    }
    var payload = {
      categories: list.sort(byOrder).map(function (c, i) {
        return {
          slug: c.slug,
          name: c.name,
          color: c.color,
          description: c.description || '',
          order: i
        };
      })
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  Blog.store = {
    loadIndex: loadIndex,
    getIndexSync: getIndexSync,
    findMeta: findMeta,
    loadPost: loadPost,
    peekPost: peekPost,
    neighbors: neighbors,
    loadCategories: loadCategories,
    getCategoriesSync: getCategoriesSync,
    findCategory: findCategory,
    categorySlug: categorySlug,
    categoryName: categoryName,
    categoryColor: categoryColor,
    categoryCounts: categoryCounts,
    categoryList: categoryList,
    slugifyCategory: slugifyCategory,
    postPath: postPath,
    buildCategoriesJson: buildCategoriesJson,
    parseFrontmatter: parseFrontmatter,
    normalizeMeta: normalizeMeta,
    mergeMeta: mergeMeta,
    toFrontmatter: toFrontmatter,
    toMarkdownFile: toMarkdownFile,
    buildIndexJson: buildIndexJson,
    draft: draft
  };
})(window, document);
