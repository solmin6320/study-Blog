# 개인 학습 블로그

공부한 내용을 메모지 형태로 기록하는 개인 학습 블로그. 순수 HTML/CSS/JS. GitHub Pages 배포.

## 절대 규칙

1. **Node.js·npm·빌드 도구를 도입하지 않는다.** 공개 사이트(GitHub Pages)는 정적 파일을 그대로 올리는 것이 배포의 전부다. **파이썬은 로컬 에디터 서버(`server/`, Docker)에만** 쓴다 — 방문자 화면과는 무관하다.
2. **새 외부 의존성은 사용자 승인 없이 추가하지 않는다.** 현재 승인된 것: jQuery, marked.js, highlight.js, DOMPurify (전부 CDN, 고정 버전).
3. **마크다운 렌더 결과는 예외 없이 DOMPurify를 통과시킨 뒤 DOM에 넣는다.** `innerHTML` 직접 대입 금지.
4. **`created`는 불변, `updated`는 저장할 때마다 갱신.** 날짜 표시는 사용자가 직접 요구한 기능이다.
5. **색·간격·폰트·그림자는 `css/tokens.css`의 CSS 변수로만.** 다른 CSS 파일의 리터럴 색상값은 결함이다.
6. **클래스명·구조 변경 전에 `docs/contract.md`를 먼저 갱신한다.** 계약서가 디자인과 구현의 단일 진실 공급원이다.

## 4인 에이전트 체제

| 에이전트 | 역할 | 담당 파일 (소유권) |
|---|---|---|
| `pm-integrator` | **전체 총괄** — 검수·분배·우선순위·충돌 조정 + **로컬 에디터 서버** | `docs/meeting-*.md`, `CLAUDE.md`, `server/*`, `Dockerfile`, `docker-compose.yml`, `docs/api.md` |
| `web-designer` | **웹 구조 총괄** — 정보구조·화면설계·계약서 + 비주얼 | `docs/contract.md`, `css/*` |
| `frontend-dev` | 코어 뷰·데이터 파이프라인 | `index.html` `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*` |
| `frontend-dev-2` | 에디터·인터랙션·접근성 | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1` |

**소유하지 않은 파일은 읽기만 하고 수정하지 않는다.** 두 에이전트가 같은 파일을 건드리면 서로의 작업을 덮어쓴다.
구조·클래스명 변경은 `web-designer`가 `docs/contract.md`를 먼저 개정한 뒤에만 가능하다.

## 개발 사이클 (사용자가 정한 방식)

**개발 → 4인 통합 회의 → 개선안 제시 → 개발 → 반복**

개발 투입은 `/round-start`, 회의는 `/blog-meeting`. 회의록은 `docs/meeting-NN.md`에 남긴다.

## 스킬 (22개)

반복 작업은 스킬로 고정해 프롬프트 토큰을 아낀다. 에이전트 투입 시 공통 머리말(읽을 파일·소유권·픽스처·포트·보고 형식)은 **에이전트 정의의 "작업 규칙"에 있으므로 프롬프트에 다시 쓰지 않는다.**

**매 라운드 반복**
- `/sync` — 다른 세션이 푸시한 작업 받아오기 (fetch → 비교 → stash → pull)
- `/round-start` — web-designer 선행 → dev 2인 병렬 투입. 프롬프트는 할 일만
- `/resume-agent` — 한도·필터로 끊긴 에이전트를 새로 띄우지 않고 재개
- `/fixture` — 글 0편 상태에서 검증용 임시 글 넣고 흔적 없이 지우기 (에이전트가 따름)
- `/preview` — start.ps1로 띄워 Browser 도구로 확인, 끝나면 종료
- `/ship` — 커밋 · 푸시 · Pages 반영 확인

**작업 흐름**
- `/blog-meeting` — 4인 통합 회의, 회의록 작성
- `/blog-spec` — 확정 규약 조회
- `/contract-update` — 마크업 계약서 개정 절차
- `/handoff` — 다른 환경에서 이어받을 인수인계 문서 생성

**글 관리**
- `/new-post` — 새 글 추가
- `/edit-post` — 기존 글 수정 (created 보존·updated 갱신)
- `/backup-posts` — 글 백업 및 무결성 검증

**품질 감사**
- `/design-review` — 가독성·시선흐름·토큰 일관성·다크모드
- `/code-audit` — CSS↔HTML 정합성·함수 연결·예외 4종
- `/a11y-check` — 키보드·포커스·aria·대비
- `/responsive-check` — 360/768/1024/1440 붕괴 지점
- `/perf-check` — 로드 전략·리플로우·스크롤 핸들러
- `/security-check` — XSS 살균 경로·innerHTML·CDN

**운영**
- `/deploy-pages` — Pages 설정 점검, 새 저장소·새 PC 최초 연결 (일상 푸시는 `/ship`)
- `/theme-tune` — 색·테마 조정 (토큰만)
- `/dep-request` — 새 의존성 승인 절차

## 구조

```
index.html / post.html / write.html
css/  tokens base layout components prose animations   (이 순서로 로드)
js/   config util store markdown ui admin app post editor
posts/       index.json + *.md
docs/        contract.md(계약서), meeting-NN.md(회의록)
start.bat    로컬 미리보기
```

## 글 추가 흐름 (하이브리드)

`write.html`에서 작성 → "파일로 내보내기" → `.md`와 `index.json` 다운로드 → `posts/`에 넣고 커밋.
작성 중 초안은 localStorage에 자동 임시저장되지만, **내보내기 전까지는 영구 저장이 아니다.**
