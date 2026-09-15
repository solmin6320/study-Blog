# 인수인계 문서 — 개인 학습 블로그

> 이 문서 하나만 읽으면 프로젝트 맥락이 복원되도록 작성했다.
> **최종 갱신: 2026-09-14 (라운드 2 종료 시점, 실측 기준)**
> 갱신 방법: Claude Code에서 `/handoff` 실행. 오래된 인수인계 문서는 없는 것보다 나쁘다.

---

## § 1. 이 프로젝트가 무엇인가

공부한 내용을 **메모지(sticky note) 형태**로 기록하는 개인 학습 블로그.
순수 HTML/CSS/JS로만 만들고, **빌드 도구 없이** GitHub Pages에 정적 파일을 그대로 올린다.

### 사용자가 직접 말한 요구사항 (검수 기준선)

| # | 요구사항 |
|---|---|
| 1 | 개인 학습 블로그 / HTML·CSS·JS만 / Node.js 지양 |
| 2 | 게시글이 **메모지 형태**로 보일 것 |
| 3 | 각 글마다 **게시 날짜**와 **최종 수정 날짜**가 표시될 것 |
| 4 | **제목** 작성 가능 |
| 5 | 본문에 **어떤 내용이든**(표·그래프·텍스트·코드) 작성 가능 |
| 6 | 최신 **반응형** 웹 |
| 7 | 애니메이션·슬라이드·타임셋 등 고급 기법 사용 가능 (jQuery 허용) |
| 8 | **사용자가 직접 그때그때 공부한 것을 추가**할 수 있을 것 |
| 9 | 기준: **가독성, 전체 구조, 세부 구조, 고퀄리티** |
| 10 | 배경은 단색보다 자연스럽게 흐르는 느낌 + 학습 블로그에 어울리는 애니메이션 |
| 11 | 외부 의존성 추가는 **사용자 사전 승인 필요** |
| 12 | 배포: GitHub Pages, **공개 예정** (방문자는 읽기 전용) |
| 13 | 개발 사이클: 개발 → 통합 회의 → 개선안 → 개발 → 반복 |
| 14 | **카테고리별로 나눠서** 메모하고, **카테고리를 직접 추가**할 수 있을 것 |
| 15 | 폴더·파일 가독성을 높일 것 |
| 16 | 푸터에 `© 이 사이트는 학습 블로그를 목적으로 바이브 코딩 제작하였습니다` |

### 왜 이런 제약을 택했는가 (이유를 모르면 다음 사람이 규칙을 깬다)

- **Node.js 미사용**: 사용자가 명시적으로 요청. 빌드 단계가 없어야 `git push` 하나로 배포가 끝난다.
- **하이브리드 저장**: 정적 사이트에는 DB가 없다. 에디터에서 쓰고 → `.md` 파일로 내보내고 → 폴더에 넣어 커밋한다. 작성은 편하고 데이터는 파일로 영구 보관된다.
- **카테고리를 폴더로**: 글이 쌓여도 한 폴더에 뒤섞이지 않고, 파일 탐색기에서 바로 구분된다.

---

## § 2. 절대 규칙 (깨면 안 되는 것)

1. **Node.js·npm·빌드 도구 도입 금지.**
   → 정적 파일 그대로 올리는 것이 배포의 전부다. 빌드가 끼면 이 구조가 무너진다.
2. **새 외부 의존성은 사용자 승인 없이 추가 금지.**
   → 현재 승인: jQuery, marked.js, highlight.js, DOMPurify (전부 CDN 고정 버전).
   → 명시적 제외: Chart.js, KaTeX (사용자가 "표·그래프는 쓸 가능성이 작다"고 판단).
3. **마크다운 렌더 결과는 예외 없이 DOMPurify를 통과시킨 뒤 DOM에 삽입.**
   → **공개 배포**라서 XSS가 실재하는 위험이다. `innerHTML` 직접 대입 금지.
4. **`created`는 불변, `updated`는 저장 시마다 갱신.**
   → 사용자가 직접 요구한 기능(요구사항 #3). 수정 시 `created`를 새로 만들면 게시일이 오늘로 바뀌어버린다.
5. **색·간격·폰트·그림자는 `css/tokens.css`의 CSS 변수로만.**
   → 다른 CSS 파일의 리터럴 색상값(#hex, rgb)은 결함이다. 테마 전환이 깨진다.
6. **클래스명·구조 변경 전에 `docs/contract.md`를 먼저 갱신.**
   → 계약서가 디자인과 구현의 단일 진실 공급원이다.

---

## § 3. 현재 완성도 (2026-09-14 실측)

| 영역 | 파일 | 줄 수 | 상태 |
|---|---|---|---|
| 디자인 토큰 | `css/tokens.css` | 295 | 완성 |
| 기본 스타일 | `css/base.css` | 276 | 완성 |
| 레이아웃 | `css/layout.css` | 577 | 완성 |
| 컴포넌트 | `css/components.css` | 1,493 | 완성 |
| 본문 타이포 | `css/prose.css` | 634 | 완성 |
| 애니메이션 | `css/animations.css` | 481 | 완성 |
| 설정 | `js/config.js` | 85 | 완성 |
| 유틸 | `js/util.js` | 350 | 완성 |
| 데이터 계층 | `js/store.js` | 688 | 완성 |
| 마크다운 | `js/markdown.js` | 200 | 완성 |
| UI 공통 | `js/ui.js` | 263 | 완성 |
| 관리자 모드 | `js/admin.js` | 82 | 완성 |
| 목록 화면 | `js/app.js` | 527 | 완성 |
| 상세 화면 | `js/post.js` | 248 | 완성 |
| 에디터 | `js/editor.js` | 1,204 | 완성 |
| HTML | `index.html` `post.html` `write.html` | — | 완성 |
| 글 | `posts/` 3편 + 카테고리 7개 | — | 완성 |

**총 CSS 3,756줄 / JS 3,647줄.**

### 실측 검증 결과 (헤드리스 Edge, 2026-09-14)

- JS가 찾는 DOM id vs HTML의 id 대조 → **누락 0건**
- 목록 화면: 메모 카드 3개 렌더, 카테고리 네비 8개(전체 + 7), 빈 카테고리 `.is-empty` 처리
- **게시일·수정일 양쪽 표시 확인** (`2026.09.13 · 1일 전` / `수정 09.13 · 1일 전`)
- 에디터: 카테고리 셀렉트 8개, 새 카테고리 UI 5요소 전부, 마크다운 툴바 10개
- 전 경로 HTTP 200

### 미검증 (다음 담당자가 확인할 것)

- 브라우저에서 **버튼을 실제로 클릭**했을 때의 동작(내보내기, 새 카테고리 추가, 테마 토글) — 헤드리스 DOM 덤프로는 확인 불가
- 실제 모바일 기기에서의 반응형
- 다크모드 색 대비 실측

---

## § 4. 폴더·파일 구조

```
index.html              글 목록 (메모지 보드)
post.html               글 상세
write.html              에디터 (관리자 전용 UI)
start.bat               로컬 미리보기 서버 (더블클릭)

css/
  tokens.css            모든 색·간격·폰트·그림자·이징 변수. 여기만 고치면 테마가 바뀐다
  base.css              리셋, 루트 타이포, 배경 레이어(.bg-mesh 그라디언트 + .bg-grain 노이즈)
  layout.css            헤더/메인/푸터/히어로/툴바/보드/상세/에디터 레이아웃
  components.css        메모지 카드, 버튼, 칩, 태그, 토스트, 모달, TOC, 카테고리 네비
  prose.css             본문(마크다운 렌더 결과) + highlight.js 테마 직접 오버라이드
  animations.css        keyframes, 진입 stagger, reduced-motion 무력화

js/
  config.js             사이트 설정, CDN 버전, 경로 규칙(posts/<cat>/<id>.md)
  util.js               날짜 포맷, debounce, DOM 헬퍼, 토스트
  store.js              데이터 계층: index.json/categories.json/.md fetch, frontmatter 파서, 캐시
  markdown.js           marked + highlight + DOMPurify 설정, 안전 렌더, TOC 추출
  ui.js                 테마 토글, 헤더 stuck, 진입 애니메이션, 모달, 포커스 트랩
  admin.js              관리자 모드 판정 + [data-admin-only] 처리
  app.js                목록 화면: 렌더, 검색, 카테고리/태그 필터, 정렬
  post.js               상세 화면: 본문 렌더, TOC, 진행바, 이전/다음, 코드 복사
  editor.js             에디터: 입력, 미리보기, 툴바, 자동저장, 내보내기, 카테고리 추가

posts/
  index.json            전체 글 메타 목록 (본문 없음 — 목록 화면 성능)
  categories.json       카테고리 정의 (사용자가 직접 편집 가능)
  guide/ html/ css/ javascript/ algorithm/ cs/ note/    카테고리별 폴더

docs/
  contract.md           마크업 계약서 v2 — 클래스명·구조의 단일 진실 공급원
  HANDOFF.md            이 문서

.claude/
  agents/               4인 에이전트 정의 (Claude Code 전용)
  skills/               18개 스킬 (Claude Code 전용)
CLAUDE.md               프로젝트 규약 (Claude Code가 자동으로 읽음)
```

---

## § 5. 데이터 모델

### 글 파일 — `posts/<category-slug>/<id>.md`

```markdown
---
id: 2026-09-10-css-grid
title: CSS Grid 레이아웃 정리
created: 2026-09-10T21:05:00+09:00
updated: 2026-09-12T09:30:00+09:00
tags: [css, layout]
category: css
summary: 목록 카드에 그대로 노출되는 한 줄 요약
color: sky
pinned: false
---

본문 마크다운
```

| 필드 | 규칙 |
|---|---|
| `id` | 확장자를 뺀 파일명과 **반드시 일치**. 바꾸면 링크가 전부 깨진다 |
| `created` | **불변.** 수정할 때도 원본 값을 그대로 복사한다 |
| `updated` | 저장할 때마다 현재 시각으로 갱신 |
| `tags` | 다중. 목록에서 칩으로 필터 |
| `category` | 단일. `categories.json`의 slug와 일치. 이 값이 곧 폴더명 |
| `color` | 메모지 색 6종: amber / mint / sky / rose / lilac / lime |
| `pinned` | true면 목록 최상단 고정 |

시각은 항상 KST(`+09:00`) 오프셋을 붙인 ISO 8601.

### `posts/categories.json`

```json
{
  "categories": [
    { "slug": "css", "name": "CSS", "color": "sky", "description": "...", "order": 2 }
  ]
}
```
- `slug` = 폴더명. 영문 소문자·숫자·하이픈만. **한 번 정하면 바꾸지 않는다**(글 경로가 전부 깨진다)
- 현재 7개: `guide html css javascript algorithm cs note`

### `posts/index.json`

```json
{ "site": {...}, "posts": [ { 본문을 뺀 메타데이터 } ] }
```
목록 화면은 **이 파일만** 읽는다. `.md`는 상세 화면에서만 읽는다.
`.md`와 값이 다르면 **`.md`가 진실**이다(사용자가 파일을 직접 고칠 수 있으므로).

### 글 추가 흐름 (하이브리드 — 이 프로젝트의 핵심)

1. `write.html`에서 작성 (입력 중 localStorage 자동 임시저장)
2. **"파일로 내보내기"** → `.md` + 갱신된 `index.json` (+ 새 카테고리를 만들었으면 `categories.json`) 다운로드
3. 받은 파일을 `posts/<category>/`에 넣는다
4. `git push` → 1분 내 반영

**내보내기 전까지는 영구 저장이 아니다.** 브라우저 데이터를 지우면 초안이 날아간다.

---

## § 6. 아키텍처 핵심 판단과 그 이유

다음 사람이 "왜 이렇게 했지?" 하고 갈아엎지 않도록 남긴다.

| 판단 | 이유 |
|---|---|
| 목록은 `index.json`만 읽고 `.md`는 안 읽는다 | 글이 100개가 되면 100번 fetch하게 된다 |
| 목록 화면에 marked/highlight.js/DOMPurify를 안 싣는다 | 목록은 요약을 `textContent`로만 넣는다. 약 280KB 절약 |
| jQuery를 안 싣는다 | 승인은 받았으나 실제 사용처가 0건. 필요해지면 그때 추가 |
| `categories.json`이 깨져도 동작하는 3단 폴백 | 사용자가 직접 편집하는 파일이다. 오타 하나로 블로그가 죽으면 안 된다 |
| 카테고리는 단일 선택, 태그는 다중 선택 | 다른 축이다. "CSS 카테고리에서 layout 태그" 조합 검색이 가능해야 한다 |
| 관리자 모드는 보안이 아니라 UI 노출 스위치 | 정적 사이트에서 클라이언트 비밀은 전부 공개다. 지키는 척하면 안 된다 |
| HTML 3개를 루트에 둔다 | GitHub Pages가 루트 `index.html`을 진입점으로 요구한다 |
| 웹폰트를 외부에서 안 불러온다 | 승인받지 않은 의존성이다. 시스템 폰트 스택으로 한글 폴백 구성 |
| `file://`에서 안내 문구를 띄운다 | 더블클릭으로 열면 fetch가 막힌다. 그냥 빈 화면이면 원인을 알 수 없다 |

---

## § 7. 지금 해야 할 일 (우선순위 순)

| # | 할 일 | 건드릴 파일 | 완료 판정 기준 |
|---|---|---|---|
| 1 | **브라우저에서 실제 클릭 검증** — 내보내기, 새 카테고리 추가, 테마 토글, 검색/필터 | (검증만) | 내보내기 시 `.md`+`index.json`이 실제로 다운로드되고, 그 파일을 폴더에 넣으면 목록에 나타난다 |
| 2 | **GitHub Pages 배포** | (git) | `https://<사용자>.github.io/<저장소>/`에서 목록이 뜬다. 시크릿 창에서 관리자 버튼이 안 보인다 |
| 3 | **통합 회의** (라운드 2 검수) | `docs/meeting-02.md` | 요구사항 16개 대조표 + 결함 목록 |
| 4 | 계약서 개정 대기 항목 반영 | `docs/contract.md` | § 9 참조 |
| 5 | 접근성·반응형 실기기 점검 | `css/*` | 360px 가로 스크롤 0, 키보드만으로 전 기능 도달 |

### 배포 절차 (#2 상세)

```bash
cd "C:/기술 블로그"
git init && git add -A
git status
git commit -m "개인 학습 블로그 초기 구축"
git branch -M main
git remote add origin <저장소 URL>
git push -u origin main
```
그다음 GitHub → Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`.

**배포 후 반드시 확인**: 시크릿 창으로 열어 **관리자 버튼이 방문자에게 안 보이는지**. 보이면 `js/admin.js` 판정 결함.
또한 GitHub Pages는 **대소문자를 구분**한다. Windows에서 동작하던 경로가 깨질 수 있으니 파일명과 `id`를 대조할 것.

---

## § 8. 다른 환경에서 이어받는 방법

### A. Claude Code (다른 세션·다른 PC)

`.claude/` 폴더가 그대로 있으면 장치가 전부 살아 있다.

**4인 에이전트**

| 에이전트 | 역할 | 소유 파일 |
|---|---|---|
| `pm-integrator` | 총괄 — 검수·분배·우선순위 | `docs/meeting-*.md`, `CLAUDE.md` |
| `web-designer` | 구조 총괄 + 비주얼 | `docs/contract.md`, `css/*` |
| `frontend-dev` | 목록·상세·데이터 | `index.html` `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*` |
| `frontend-dev-2` | 에디터·인터랙션 | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` |

**주요 스킬**: `/round-start`(개발 투입) `/blog-meeting`(회의) `/new-post` `/edit-post` `/preview` `/deploy-pages` `/handoff` `/code-audit` `/design-review` `/a11y-check` `/responsive-check` `/perf-check` `/security-check` `/theme-tune` `/backup-posts` `/contract-update` `/dep-request` `/blog-spec`

**파일 소유권을 반드시 지킬 것.** 두 에이전트가 같은 파일을 건드리면 서로의 작업을 덮어쓴다(이 프로젝트에서 이미 한 번 발생했다).

### B. Claude Code가 아닌 환경 (ChatGPT, Cursor, Copilot 등)

에이전트도 스킬도 **없다.** 대신 이렇게 한다:

1. **시작 프롬프트에 이 세 파일을 붙여넣어라**: `docs/HANDOFF.md`(이 문서), `docs/contract.md`, `CLAUDE.md`
2. **`docs/contract.md`가 클래스명의 진실이다.** 새 클래스를 지어내지 말고 여기서 가져다 쓴다.
3. **§2 절대 규칙 6개를 프롬프트 앞에 명시하라.** 특히 DOMPurify와 `created` 불변.
4. 4인 역할을 재현하고 싶으면 `.claude/agents/*.md` 4개를 읽어라. 그대로 시스템 프롬프트로 쓸 수 있게 작성돼 있다.
5. **한 번에 한 영역만 고쳐라.** 위 소유권 표는 "동시에 건드리지 말라"는 뜻이다.

**시작 프롬프트 예시**

> 개인 학습 블로그 프로젝트를 이어받는다. 첨부한 HANDOFF.md, contract.md, CLAUDE.md를 먼저 읽어라.
> 순수 HTML/CSS/JS이고 Node.js·빌드 도구를 쓰지 않는다. 새 라이브러리는 나에게 먼저 물어라.
> 클래스명은 contract.md에서 가져다 쓰고, 마크다운 렌더 결과는 반드시 DOMPurify를 거쳐라.
> 글을 수정할 때 `created`는 절대 바꾸지 말고 `updated`만 갱신해라.
> HANDOFF.md의 §7 우선순위 1번부터 시작하되, 파일을 고치기 전에 실제 내용을 읽고 확인해라.

### C. 파일을 옮길 때 주의

- **UTF-8 인코딩 유지. BOM 없이.** 한글이 깨지면 전부 실패한다.
- `.claude/` 폴더를 빠뜨리면 에이전트·스킬이 사라진다.
- `start.bat`은 인코딩 이슈가 있으니 변환 도구를 통과시키지 마라.

### D. 로컬에서 확인하는 법

```
start.bat 더블클릭  →  http://localhost:5500/index.html
```
또는 `python -m http.server 5500`.

**반드시 HTTP로 열어야 한다.** `file://`로 열면 브라우저가 fetch를 막아 글이 하나도 안 보인다.
관리자 UI는 `?admin=1`, 해제는 `?admin=0`. localhost는 자동으로 관리자로 인식된다.

**안 될 때 진단**

| 증상 | 원인 |
|---|---|
| 목록이 빈 채로 멈춤 | `posts/index.json` JSON 문법 오류 또는 404 |
| 글 클릭 시 에러 화면 | `id`와 실제 파일 경로 불일치 |
| 스타일이 전혀 없음 | CSS 경로 오타 또는 로드 순서 문제 |
| 한글 깨짐 | 파일이 UTF-8이 아님 |
| 콘솔에 `Blog is not defined` | `<script>` 로드 순서가 의존성과 어긋남 |

---

## § 9. 알려진 이슈 / 미해결 사항

### 계약서 개정 대기 (web-designer 판단 필요)

1. `post.html`의 `.post-cat`을 `<span>` → `<a>`로 바꿨다(카테고리 목록 링크). 계약서 §5는 아직 span이다.
   → **`.post-cat`과 `a:hover`가 같은 색이라 호버 피드백이 전혀 없다.** 링크라는 어포던스를 줄 디자인 판단이 필요하다.
2. 툴바 DOM 순서를 `search → select → chips`로 변경(CSS 그리드 배치 때문). 계약서 §4 예시와 다르다.
3. `#postEdit`, `.site-nav`의 "쓰기" 링크, `.cat-item`의 `title` 속성이 계약서에 미등재.

### 확인이 필요한 사항

- `updated == created`인 글이 현재 없어서, "같으면 수정 표기를 숨긴다"는 분기를 화면으로 검증할 샘플이 없다.
- `git` 저장소가 아직 초기화되지 않았다. **백업이 없는 상태다.**

### 사용자 결정 사항 (확정됨)

| 항목 | 결정 |
|---|---|
| 저장 방식 | 하이브리드 (에디터 작성 → .md 내보내기 → 폴더에 넣기) |
| 의존성 | jQuery·marked·highlight.js·DOMPurify (Chart.js·KaTeX 제외) |
| 배포 | GitHub Pages, **공개 저장소** |
| 배포 시점 | 에디터 완성 후 |
| 방문자 | 읽기 전용 (관리자 UI 숨김) |
