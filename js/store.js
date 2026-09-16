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
  var catError = null;      // categories.json이 깨졌을 때의 마지막 오류(화면단이 읽어 간다)

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

  function fetchTextStrict(url, opts) {
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

  /* 공개용 래퍼. "파일이 없다"는 정상적인 탐색 결과이지 오류가 아니다 —
     후보 경로를 직접 두드리는 쪽(에디터의 폴백)이 404마다 try/catch를 쓰지 않도록 null을 준다.
     file:// 차단·네트워크 실패는 계속 던진다. 그 둘은 다음 후보를 시도해도 결과가 같아서
     "없음"으로 삼켜 버리면 원인을 알려 줄 수 없기 때문이다. */
  function fetchText(path) {
    return Promise.resolve()
      .then(function () { return fetchTextStrict(path); })
      .catch(function (err) {
        if (err && err.code === 'notfound') return null;
        throw err;
      });
  }

  /* ---------- frontmatter 파서 ----------
     YAML 라이브러리를 쓰지 않는다. 이 블로그가 실제로 쓰는 만큼만 지원한다:
     문자열 / 숫자 / boolean / [a, b] 인라인 배열 / "-" 블록 배열 / 따옴표 값.
     값에 콜론이 들어가도(created: 2026-09-13T14:20:00+09:00) 첫 콜론만 구분자로 본다. */

  /* 겹따옴표 문자열의 이스케이프를 되돌린다.
     쓰는 쪽(yamlValue)이 \ → \\ , " → \" 로 내보내므로 읽는 쪽도 정확히 그 둘만 되돌린다.
     이 되돌리기가 없으면 "불러오기 → 저장"을 한 번 돌 때마다 백슬래시가 한 겹씩 늘어나
     제목이 say "hi" → say \"hi\" → say \\"hi\\" 로 되돌릴 수 없게 망가진다(라운드 3 T3-2).
     한 번의 좌→우 훑기로 치환해야 \\" 를 \" + " 가 아니라 \ + " 로 옳게 읽는다.
     \n·\t 같은 다른 YAML 이스케이프는 손대지 않는다 — 우리 쓰기 경로가 만들지 않는 형태라,
     되돌리면 사용자가 본문에 직접 적은 백슬래시를 우리가 마음대로 지우는 꼴이 된다. */
  function unescapeDoubleQuoted(text) {
    return String(text).replace(/\\(["\\])/g, '$1');
  }

  /* 홑따옴표 문자열의 이스케이프는 YAML 규칙대로 '' → ' 하나뿐이다(백슬래시는 글자 그대로). */
  function unescapeSingleQuoted(text) {
    return String(text).replace(/''/g, "'");
  }

  function stripQuotes(raw) {
    var s = raw.trim();
    if (s.length >= 2) {
      var head = s.charAt(0), tail = s.charAt(s.length - 1);
      if (head === '"' && tail === '"') {
        return { text: unescapeDoubleQuoted(s.slice(1, -1)), quoted: true };
      }
      if (head === "'" && tail === "'") {
        return { text: unescapeSingleQuoted(s.slice(1, -1)), quoted: true };
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
        /* 겹따옴표 안의 \" 는 항목의 끝이 아니라 글자 " 다. yamlValue가 그렇게 쓴다. */
        if (quote === '"' && ch === '\\' && i + 1 < inner.length) {
          buf += unescapeDoubleQuoted(ch + inner.charAt(i + 1));
          i += 1;
          continue;
        }
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

  /* "[" 로 시작하고 "]" 로 끝난다는 것만으로는 배열이 아니다.
     summary: [초안] 이건 [임시] 처럼 대괄호를 문장부호로 쓴 값이 통째로 배열로 오인돼
     요약이 "초안"으로 바뀌는 사고가 실제로 났다.
     여는 괄호의 짝이 문자열의 맨 끝일 때만 배열로 본다(중첩·따옴표 안의 괄호는 세지 않는다). */
  function looksLikeInlineArray(raw) {
    if (raw.charAt(0) !== '[' || raw.charAt(raw.length - 1) !== ']') return false;
    var depth = 0;
    var quote = null;
    for (var i = 0; i < raw.length; i += 1) {
      var ch = raw.charAt(i);
      if (quote) {
        if (quote === '"' && ch === '\\') { i += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '[') { depth += 1; continue; }
      if (ch !== ']') continue;
      depth -= 1;
      if (depth <= 0) return i === raw.length - 1;
    }
    return false;
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

      if (looksLikeInlineArray(raw)) {
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

  /* 계약서 §9-2에서 color 필드는 폐기됐다. 기존 .md·index.json에 color 키가 남아 있어도
     META_KEYS에 없으므로 파서가 읽지 않고 그냥 지나간다(마이그레이션 불필요). */
  var META_KEYS = ['id', 'title', 'summary', 'created', 'updated', 'tags', 'category', 'pinned'];

  /* 게시일은 목록의 날짜 열·연도 그룹·정렬이 전부 기대는 값이다(계약서 §9-1).
     비면 그 글은 목록에서 자리를 못 잡으므로 updated → id 앞머리(YYYY-MM-DD) 순으로 되살린다.
     id에서 뽑는 것은 "우리가 지어낸 날짜"가 아니라 사용자가 파일명에 직접 적은 날짜다 —
     오늘 날짜를 찍는 것과는 다르다(그건 created 불변 규칙을 깨뜨린다). */
  var ID_DATE_RE = /^(\d{4}-\d{2}-\d{2})/;

  function fallbackCreated(created, updated, id) {
    if (created) return created;
    if (updated) return updated;
    var m = ID_DATE_RE.exec(String(id || ''));
    return m ? m[1] : '';
  }

  /* 정규화는 빠진 필드를 기본값으로 채운다. 그래서 결과만 보면 "원본에 있던 값"과
     "여기서 채워 넣은 기본값"을 구분할 수 없다 — 병합(mergeMeta)이 바로 그 구분을 필요로 하므로
     원본에 실제로 있던 키 목록을 열거 불가 속성으로 함께 남긴다.
     열거 불가라 JSON.stringify·Object.assign·Object.keys에는 절대 새어 나가지 않는다. */
  function markPresentKeys(target, raw) {
    var present = Object.create(null);
    if (raw) {
      META_KEYS.forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(raw, key) && raw[key] !== undefined) present[key] = true;
      });
    }
    Object.defineProperty(target, '$present', { value: present, enumerable: false, writable: false });
    return target;
  }

  function hasSourceKey(meta, key) {
    if (!meta) return false;
    if (meta.$present) return meta.$present[key] === true;
    return Object.prototype.hasOwnProperty.call(meta, key) && meta[key] !== undefined;
  }

  function normalizeMeta(raw, fallbackId) {
    var meta = raw || {};
    var id = String(meta.id || fallbackId || '').trim();
    var created = fallbackCreated(
      meta.created ? String(meta.created) : '',
      meta.updated ? String(meta.updated) : '',
      id
    );
    var updated = meta.updated ? String(meta.updated) : created;
    return markPresentKeys({
      id: id,
      title: String(meta.title || '(제목 없음)'),
      summary: String(meta.summary || ''),
      created: created,
      updated: updated || created,
      tags: toTagArray(meta.tags),
      category: String(meta.category || ''),
      pinned: toBool(meta.pinned)
    }, raw);
  }

  /* .md의 frontmatter가 index.json과 다르면 .md를 진실로 삼는다.
     사용자가 파일을 직접 고칠 수 있고, 그 편집이 화면에 보이지 않으면 혼란스럽기 때문.

     판정 기준은 "값이 있는가"가 아니라 "frontmatter에 그 키가 있는가"다.
     값으로 판정하면 사용자가 .md에서 summary를 비우거나 tags를 []로 지워도
     "파일에 값이 없다"로 읽혀 index.json의 옛 값이 되살아난다 — 파일을 고쳐도 화면이 안 바뀐다.
     키를 통째로 지웠을 때만 index.json이 대신 답한다. */
  function mergeMeta(indexMeta, fileMeta) {
    var merged = {};
    META_KEYS.forEach(function (key) {
      merged[key] = hasSourceKey(fileMeta, key) ? fileMeta[key] : (indexMeta ? indexMeta[key] : undefined);
    });
    /* normalizeMeta가 merged를 원본으로 삼아 $present를 다시 계산한다(양쪽 중 답한 쪽의 키만 남는다). */
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
      description: String(src.description || ''),
      order: isNaN(order) ? Number(fallbackOrder) || 0 : order
    };
  }

  function byOrder(a, b) {
    if (a.order !== b.order) return a.order - b.order;
    return String(a.name).localeCompare(String(b.name), 'ko');
  }

  /* categories.json이 없거나 깨졌을 때의 폴백: 글들이 실제로 쓰고 있는 category 값으로 목록을 만든다.
     이 목록이 없으면 글은 있는데 그 글로 가는 분류 항목이 사라진다. */
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
    /* fetchTextStrict는 file:// 에서 동기적으로 throw한다. 호출부가 항상 Promise를 받도록 감싼다. */
    catError = null;
    catPromise = Promise.resolve()
      .then(function () { return fetchTextStrict(CFG.paths.categories); })
      .then(function (text) {
        var json;
        try {
          json = JSON.parse(text.replace(/^﻿/, ''));
        } catch (err) {
          throw fail('parse', 'posts/categories.json 형식이 올바르지 않습니다(쉼표나 따옴표를 확인하세요).', err);
        }
        /* 빈 배열은 "깨진 파일"이 아니라 정상 상태다 — 이 블로그는 분류 0개에서 시작하고,
           분류는 사용자가 에디터에서 직접 추가한다. 예전에는 여기서 예외를 던져
           글에서 분류를 유추하는 폴백으로 넘어갔고, 관리자에게는 "파일을 읽지 못했다"는
           경고까지 떴다 — 고장나지 않은 것을 고장났다고 말하는 상태였다.
           배열이 아닌 경우(키 누락·타입 오류)만 진짜 오류로 본다. */
        if (!json || !Array.isArray(json.categories)) {
          throw fail('parse', 'posts/categories.json에 categories 배열이 없습니다.');
        }
        return setCategories(json.categories.map(normalizeCategory), false);
      })
      .catch(function (err) {
        /* 폴백은 유지하되(블로그는 계속 돌아야 한다) 무슨 일이 있었는지는 남긴다.
           store는 화면을 모르므로 토스트를 직접 띄우지 않는다 — 알릴지 말지는 화면단의 판단이다.
           404는 기록하지 않는다: categories.json은 선택 파일이고, 없으면 글에서 목록을 되살리는 것이
           설계된 정상 경로다. 파싱 실패·네트워크 실패만 "사용자가 고쳐야 할 일"이다. */
        catError = (err && err.code === 'notfound') ? null : (err || null);
        return loadIndex()
          .catch(function () { return null; })
          .then(function (data) {
            return setCategories(deriveCategories(data ? data.posts : []), true);
          });
      });
    return catPromise;
  }

  /* 화면단이 "카테고리 파일이 깨졌다"를 안내할 수 있게 마지막 실패를 돌려준다. 없으면 null. */
  function getCategoryError() { return catError; }

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

  /* slug → 글 수. 인덱스의 .index-count와 .is-empty 판정에 쓴다. */
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
        slug: c.slug, name: c.name,
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
        description: '',
        order: 9999,
        count: counts[slug],
        registered: false
      });
    });

    return out.sort(byOrder);
  }

  /* ---------- index.json ---------- */

  /* id는 글의 주소이자 파일명이다. index.json에 같은 id가 두 번 있으면 (손으로 고치다 복사한 경우)
     목록에 같은 행이 두 줄 뜨고, id로 글을 찾는 필터·이웃 글 계산이 둘 중 무엇을 가리키는지
     알 수 없게 된다. 먼저 나온 것만 남긴다 — index.json은 고정 글·최신순으로 정렬돼 있어
     앞쪽이 사용자가 의도한 최신 기록일 가능성이 높다. 버린 개수는 화면단이 알려 줄 수 있게 남긴다. */
  var indexDuplicates = [];

  function dedupeById(posts) {
    var seen = Object.create(null);
    var out = [];
    indexDuplicates = [];
    posts.forEach(function (post) {
      if (seen[post.id]) { indexDuplicates.push(post.id); return; }
      seen[post.id] = true;
      out.push(post);
    });
    return out;
  }

  function getIndexDuplicates() { return indexDuplicates.slice(); }

  function loadIndex(force) {
    if (indexPromise && !force) return indexPromise;
    /* fetchTextStrict는 file:// 에서 동기적으로 throw한다. 그대로 두면 호출부의 .catch가 아니라
       스크립트 자체가 멈춰서 "로컬 서버로 열어 주세요" 안내가 뜨지 않는다. */
    indexPromise = Promise.resolve()
      .then(function () { return fetchTextStrict(CFG.paths.index); })
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
          posts: dedupeById(list.map(function (item) { return normalizeMeta(item, item && item.id); })
                                .filter(function (item) { return item.id; }))
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
     나머지는 index.json이 없거나 폴더가 어긋났을 때만 쓰이는 구조선.

     순서: 힌트 카테고리 → 등록된 카테고리 전부 → 평면 경로 → _uncategorized.
     _uncategorized가 맨 뒤인 이유 — 그 폴더는 "어디에도 속하지 않는다"는 마지막 착지점이라
     제대로 된 폴더와 v1 평면 경로를 전부 두드린 뒤에 확인해야 원래 자리를 먼저 찾는다.
     categoryHint는 slug여도 되고 .md에 적힌 표시 이름('프론트엔드')이어도 된다 —
     postPath()가 categorySlug()로 폴더명을 되돌린다.

     trusted=true면 등록 카테고리 전수 탐색을 건너뛴다. index.json이 그 글의 카테고리를 적어 두었다면
     "선언된 폴더에 없다"는 것 자체가 답이고, 나머지 폴더를 전부 두드려도 나오지 않는다.
     카테고리 7개 기준으로 없는 id 하나에 404가 9번 나가던 것이 3번으로 줄어든다.
     공개 API의 기본값은 그대로 전수 탐색이다 — editor.js의 구조선이 이 목록에 기대고 있다. */
  function postCandidates(id, categoryHint, trusted) {
    var urls = [];
    function push(url) { if (url && urls.indexOf(url) === -1) urls.push(url); }
    if (!id) return urls;

    if (categoryHint) push(postPath(id, categoryHint));
    if (!trusted) {
      (catData ? catData.list : []).forEach(function (c) { push(CFG.paths.post(id, c.slug)); });
    }
    push(CFG.paths.postFlat(id));                            // v1 평면 구조 호환
    push(CFG.paths.post(id, CFG.category.fallbackSlug));
    return urls;
  }

  /* 404면 다음 후보로, 그 밖의 오류(네트워크·file://)면 즉시 중단한다.
     후자는 후보를 더 시도해도 같은 결과라 요청만 늘어난다.
     전부 404면 null — "없는 글"은 오류가 아니라 탐색 결과다. */
  function fetchFirst(urls) {
    function attempt(i) {
      if (i >= urls.length) return Promise.resolve(null);
      return fetchText(urls[i]).then(function (text) {
        return text === null ? attempt(i + 1) : { text: text, url: urls[i] };
      });
    }
    return attempt(0);
  }

  /* id로 글 하나를 읽어 { meta, body, ... } 로 돌려준다. 후보 경로를 모두 두드려도
     없으면 null(reject 아님). file://·네트워크 실패만 reject한다 — 그건 "없다"가 아니라
     "읽을 수 없다"라서 화면이 다른 안내를 해야 하기 때문이다. */
  function loadPost(id, categoryHint) {
    if (!id) return Promise.resolve(null);
    if (postCache[id]) return Promise.resolve(postCache[id]);

    /* index.json은 글이 든 폴더를 알려 주고, categories.json은 표시 이름을 알려 준다.
       둘 다 실패해도 본문은 폴백 경로로 찾아 보여 준다. */
    return Promise.all([
      loadIndex().catch(function () { return null; }),
      loadCategories()
    ])
      .then(function () {
        var indexMeta = findMeta(id);
        var declared = String((indexMeta && indexMeta.category) || '').trim();
        var hint = String(categoryHint || declared).trim();
        /* index.json이 카테고리를 적어 둔 글은 어디에 있어야 하는지가 확정이다.
           그 경우에만 전수 탐색을 접는다(자세한 근거는 postCandidates 주석). */
        var trusted = Boolean(declared) && (!categoryHint || categorySlug(categoryHint) === categorySlug(declared));
        return fetchFirst(postCandidates(id, hint, trusted));
      })
      .then(function (res) {
        if (!res) return null;
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

  /* 목록의 기본 정렬(고정 글 먼저 · 그다음 최신 게시순)에서의 앞뒤 글.
     created만 보고 정렬하면 목록 맨 위에 있던 고정 글이 "이전/다음"에서는 중간에 끼어 있어,
     목록 → 상세 → 다음 글로 이어 읽을 때 순서가 어긋난다.
     비교 함수는 app.js sortPosts()·buildIndexJson과 같은 규칙을 쓴다. */
  function neighbors(id) {
    if (!indexData) return { prev: null, next: null };
    var sorted = indexData.posts.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
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
    /* 백슬래시를 먼저 escape해야 한다. 순서를 바꾸면 " → \" 로 만든 백슬래시까지 한 번 더 escape돼
       읽는 쪽이 \\" 를 "백슬래시 + 따옴표"로 읽는다. 이 두 줄은 stripQuotes의 되돌리기와 한 쌍이다. */
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function toFrontmatter(meta) {
    /* 키 목록은 META_KEYS 하나로 유지한다. 두 벌이면 필드를 늘릴 때 한쪽만 고쳐져 조용히 어긋난다. */
    var lines = ['---'];
    META_KEYS.forEach(function (key) {
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
          tags: p.tags, category: p.category, pinned: Boolean(p.pinned)
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
          description: c.description || '',
          order: i
        };
      })
    };
    return JSON.stringify(payload, null, 2) + '\n';
  }

  Blog.store = {
    /* fetchText / postCandidates 는 에디터(js/editor.js)의 수정 모드 폴백이 쓴다.
       글을 찾는 규칙이 store와 에디터에서 갈라지면 "보드에는 보이는데 수정은 안 되는 글"이 생긴다. */
    fetchText: fetchText,
    postCandidates: postCandidates,
    loadIndex: loadIndex,
    getIndexSync: getIndexSync,
    getIndexDuplicates: getIndexDuplicates,
    getCategoryError: getCategoryError,
    findMeta: findMeta,
    loadPost: loadPost,
    peekPost: peekPost,
    neighbors: neighbors,
    loadCategories: loadCategories,
    getCategoriesSync: getCategoriesSync,
    findCategory: findCategory,
    categorySlug: categorySlug,
    categoryName: categoryName,
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
