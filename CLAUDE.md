# 개인 학습 블로그

공부한 내용을 기록하는 개인 학습 블로그. 순수 HTML/CSS/JS. GitHub Pages 배포. (목록은 카드 그리드 — 메모지 메타포·흐르는 배경은 v3.0에서 사용자가 거부했다. 결정 기록은 `docs/HANDOFF.md` §9.)

## 절대 규칙

1. **Node.js·npm·빌드 도구를 도입하지 않는다.** 공개 사이트(GitHub Pages)는 정적 파일을 그대로 올리는 것이 배포의 전부다. **파이썬은 로컬 에디터 서버(`server/`, Docker)에만** 쓴다 — 방문자 화면과는 무관하다.
2. **새 외부 의존성은 사용자 승인 없이 추가하지 않는다.** 현재 승인된 것: jQuery, marked.js, highlight.js, DOMPurify (전부 CDN, 고정 버전). 스킬(예: `slides`의 Chart.js, `ui-styling`의 shadcn/Tailwind)이 다른 라이브러리·빌드를 권해도 **이 규칙과 규칙 1이 이긴다.**
3. **마크다운 렌더 결과는 예외 없이 DOMPurify를 통과시킨 뒤 DOM에 넣는다.** `innerHTML` 직접 대입 금지.
4. **`created`는 불변, `updated`는 저장할 때마다 갱신.** 날짜 표시는 사용자가 직접 요구한 기능이다.
5. **색·간격·폰트·그림자는 `css/tokens.css`의 CSS 변수로만.** 다른 CSS 파일의 리터럴 색상값은 결함이다. **행간(`line-height`)도 "폰트"에 들어간다** — `--lh-*` 토큰으로 쓴다. 예외는 구조 값 `0`·`1`(글자 상자를 없애거나 아이콘을 한 줄에 맞출 때)뿐. 지금 남은 리터럴 행간은 이월 백로그 B8-13(WD-12 `--lh-ui`)에서 정리한다.
6. **사용자에게 보이는 것이나 입력의 결과가 바뀌면, 코드보다 `docs/contract.md`를 먼저 갱신한다.** 대상: 클래스명·DOM 구조 · **사용자에게 보이는 문구**(토스트·상태줄·안내문·오류 문장) · **키 동작**(단축키·Enter/Tab/괄호 같은 입력 규칙) · **저장 키**(localStorage 키·값 형식). 계약서가 디자인과 구현의 단일 진실 공급원이다.
   **메인 세션(오케스트레이터)도 같은 게이트를 따른다** — 에이전트를 거치지 않고 직접 고치거나 투입할 때도 계약서 개정이 먼저다. "이미 구현된 것을 사후 등재"는 예외가 아니라 결함 기록이다(meeting-08 D6: v4.2 에디터 동작과 푸터 옛 줄이 이 경로로 들어왔다).

## 4인 에이전트 체제

| 에이전트 | 역할 | 담당 파일 (소유권) |
|---|---|---|
| `pm-integrator` | **전체 총괄** — 검수·분배·우선순위·충돌 조정 + **로컬 에디터 서버** | `docs/meeting-*.md`, `docs/HANDOFF.md`, `CLAUDE.md`, `server/*`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `docs/api.md`, `.claude/**` |
| `web-designer` | **웹 구조 총괄** — 정보구조·화면설계·계약서 + 비주얼 | `docs/contract.md`, `css/*` |
| `frontend-dev` | 코어 뷰·데이터 파이프라인 | `index.html` `post.html`, `js/{config,util,store,markdown,app,post,theme-init}.js`, `posts/`의 **파생 파일 정합성**(아래) |
| `frontend-dev-2` | 에디터·인터랙션·접근성 | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1` |

**소유하지 않은 파일은 읽기만 하고 수정하지 않는다.** 두 에이전트가 같은 파일을 건드리면 서로의 작업을 덮어쓴다.
구조·클래스명·문구·키 동작·저장 키 변경은 `web-designer`가 `docs/contract.md`를 먼저 개정한 뒤에만 가능하다(규칙 6).

**`posts/`의 소유 범위(2026-09-23 좁힘).** 글의 **본문과 frontmatter 값은 사용자 것**이다 — 에이전트는 쓰지도 고치지도 않는다(오타·틀린 설명도 사용자에게 알리기만 한다). 푸터가 "게시글은 모두 직접 작성하고 정리하였습니다"라고 공개하기 때문이다.
`frontend-dev`가 만질 수 있는 것은 **파생 파일의 정합성**뿐이다: `posts/index.json`·`posts/categories.json`이 `.md`(진실)와 어긋날 때 `.md` 값으로 맞추기. 그것도 사용자에게 통보한 뒤 **단독 커밋**으로.
**에이전트가 글을 대신 써서 올리는 경로는 없다**(2026-09-23 사용자 결정 U2-A). `/new-post`·`/edit-post`는 `write.html`로 안내만 한다. 학습 도우미(전역 `tutor` 에이전트 — 이 프로젝트 4인 밖)는 설명·오류 지적만 한다.

## 개발 사이클 (사용자가 정한 방식)

**개발 → 4인 통합 회의 → 개선안 제시 → 개발 → 반복**

개발 투입은 `/round-start`, 회의는 `/blog-meeting`. 회의록은 `docs/meeting-NN.md`에 남긴다.
사용자 결정은 날짜와 함께 `docs/HANDOFF.md` §9 "사용자 결정 기록" 표에 남긴다 — 회의록에만 두면 다음 회의에서 증발한다(meeting-08 D9).

## 스킬 (33개 — 프로젝트 25 + 디자인 8)

반복 작업은 스킬로 고정해 프롬프트 토큰을 아낀다. 에이전트 투입 시 공통 머리말(읽을 파일·소유권·픽스처·포트·보고 형식)은 **에이전트 정의의 "작업 규칙"에 있으므로 프롬프트에 다시 쓰지 않는다.**

**매 라운드 반복**
- `/resume-work` — 멈춘 작업 이어하기: 저장소 상태 확인 → 스킬 안의 "다음 할 일" 목록대로 → 끝날 때 목록 갱신
- `/sync` — 다른 세션이 푸시한 작업 받아오기 (fetch → 비교 → stash → pull)
- `/round-start` — 게이트 질문("사용자에게 보이는 것, 또는 입력의 결과가 바뀌는가?") → web-designer 선행 → dev 2인 병렬 투입. 프롬프트는 할 일만
- `/resume-agent` — 한도·필터로 끊긴 에이전트를 새로 띄우지 않고 재개
- `/fixture` — 검증용 임시 글을 **에이전트별 샌드박스 사본**(`_tmp-<이름>`)에 넣고 흔적 없이 지우기. 검증 입력은 실제 글 사본 + 경계 문서 + 외부 마크다운. 프로젝트 `posts/`에는 아무도 픽스처를 쓰지 않는다
- `/preview` — start.ps1로 띄워 Browser 도구로 확인, 끝나면 종료
- `/ship` — 커밋 · 푸시 · Pages 반영 확인

**작업 흐름**
- `/blog-meeting` — 4인 통합 회의, 회의록 작성(이월 백로그 · 결정 대기 · 지시↔작업표 대조 포함)
- `/blog-spec` — 확정 규약 조회
- `/contract-update` — 마크업 계약서 개정 절차(끝에 grep 일관성 검사)
- `/handoff` — 다른 환경에서 이어받을 인수인계 문서 생성

**글 관리** — 글은 사용자가 `write.html`에서 직접 쓴다
- `/new-post` — 새 글을 `write.html`에서 쓰도록 안내(에이전트는 파일을 쓰지 않는다)
- `/edit-post` — 기존 글을 `write.html?id=…`에서 고치도록 안내(에이전트는 파일을 쓰지 않는다)
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

**로컬 에디터 서버 (파이썬·Docker, pm-integrator 소유)**
- `/serve` — 첫 기동 전 커밋 신원 확인 → `docker compose up -d` / `logs -f` / `down`, 헬스 확인, 5500 포트 충돌 처리(start.ps1과 둘 중 하나만)
- `/api-check` — 헬스 → 픽스처 글 PUT → 409 `exists`·`stale` → GET → DELETE → `git status posts/` 비었는지. `/fixture` 규칙 준수

**디자인 참고 (외부에서 들여온 범용 스킬 8개 — `banner-design` `brand` `design` `design-system` `frontend-design` `slides` `ui-styling` `ui-ux-pro-max`)**
- 감사 기준·어휘로만 쓴다. 권고가 절대 규칙 1·2(빌드·의존성)나 계약서와 부딪히면 **규칙과 계약서가 이긴다**.

## 구조

```
index.html / post.html / write.html                  (about.html은 v3.9에서 삭제)
.nojekyll    필수 — 없으면 GitHub Pages의 Jekyll이 posts/*.md를 .html로 바꿔 글이 404
css/  tokens base layout components prose            (이 순서로 로드. animations.css는 v3.0에서 삭제)
js/   theme-init(head에서 먼저) config util store markdown ui admin app post editor
posts/       index.json + categories.json + <분류>/*.md   (이미지는 <분류>/img/ — 본문에는 posts/<분류>/img/a.png로 쓴다)
docs/        contract.md(계약서), api.md(서버 규약), meeting-NN.md(회의록), HANDOFF.md(인수인계)
start.bat / start.ps1   start.bat은 Docker가 있으면 compose, 없으면 start.ps1(정적 미리보기 — 저장 API 없음, 글 저장 불가)
server/      FastAPI 로컬 에디터 서버 (app.py 엔트리, posts.py 파일 규칙) — Dockerfile·docker-compose.yml로 실행. 규약은 docs/api.md
.claude/     agents/ 4인 정의, skills/ 33개
```

## 글 추가 흐름 (서버 단일 — v3.9에서 내보내기 폐지)

`docker compose up` → `write.html`에서 작성 → "저장"(Ctrl+S)이 `posts/`에 바로 쓰고, **커밋 신원이 있으면** 그 저장이 쓴 파일만 자동으로 커밋한다(`docs/api.md` §2-1, `BLOG_AUTO_COMMIT`). 푸시는 사용자가 `/ship`.
**커밋 신원이 없으면 저장은 되지만 커밋은 매번 건너뛴다**(응답 `git.reason: 커밋 신원 없음`) — 덮어쓴 글을 되돌릴 이력이 남지 않는다. 신원은 `.env`의 `BLOG_GIT_NAME`·`BLOG_GIT_EMAIL`, 또는 이 저장소의 로컬 `git config user.name`/`user.email`(컨테이너는 전역 설정을 못 본다). 2026-09-23 현재 이 PC에는 둘 다 없다(`/serve` §0).
**Docker가 없는 PC에서는 글을 저장할 수 없다** — `start.bat`은 미리보기 전용이고, 에디터의 저장 버튼은 `disabled`에 "서버 없음" 문구가 뜬다(계약 §6-1). 파일 내보내기(다운로드)는 없다.
작성 중 초안은 localStorage에 자동 임시저장되지만, **서버에 저장하기 전까지는 영구 저장이 아니다.**
