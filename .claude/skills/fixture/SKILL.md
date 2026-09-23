---
name: fixture
description: 화면·로직을 검증하려고 임시 글을 넣었다가 흔적 없이 지우는 표준 절차. 모든 에이전트(web-designer, frontend-dev, frontend-dev-2, pm-integrator)가 검증할 때 따른다. 병렬 작업 중 프로젝트 posts/를 공유하지 않도록 에이전트별 샌드박스 사본(<scratchpad>/sandbox-<에이전트 이름>, 자기 경로만 지움)에서 검증하고, 검증 입력은 실제 글 사본 + 경계 문서 + 외부 마크다운으로 고른다. "픽스처", "임시 글로 확인", "테스트 데이터" 요청에서 사용한다.
---

# /fixture — 임시 글로 검증하고 흔적 없이 지우기 (v4, 2026-09-23 — 사본 경로를 에이전트별 고정 이름으로)

글과 분류는 사용자가 직접 만든다(2026-09-23 기준 사용자 글 1편 — `posts/java/`). **검증용 글을 실수로 남기면 사용자가 만든 것처럼 배포된다.**
그리고 에이전트는 **병렬로 뛴다** — 라운드 4에서 두 에이전트가 같은 `posts/_tmp`·`index.json.bak`을 써 서로 덮었다.
그래서 v2부터 **프로젝트 `posts/`에는 손대지 않는다.** 검증은 내 스크래치패드의 **샌드박스 사본**에서 한다.

## 0. 내 이름·포트·사본 경로 (에이전트 정의와 같다)

| 에이전트 | 이름 `<me>` | 포트 | 사본 경로 `$S` (고정 — 즉석 이름 금지) |
|---|---|---|---|
| pm-integrator | `pm` | 5500 | `<scratchpad>/sandbox-pm-integrator` |
| 오케스트레이터(메인 세션) | `pm` | 5500 | `<scratchpad>/sandbox-orchestrator` |
| frontend-dev | `dev` | 5501 | `<scratchpad>/sandbox-frontend-dev` |
| frontend-dev-2 | `dev2` | 5502 | `<scratchpad>/sandbox-frontend-dev-2` |
| web-designer | `wd` | 5503 | `<scratchpad>/sandbox-web-designer` |

픽스처 **id는 `YYYY-MM-DD-tmp-<me>-<a|b|c…>`**, **분류 slug는 `_tmp-<me>`**. 이름이 박혀 있어야 남은 흔적이 누구 것인지 바로 안다.
`_tmp`(이름 없음)는 v1 흔적이다 — 보이면 지우고 보고에 적는다.

**사본 경로가 에이전트 이름으로 고정된 이유**(v4, 라운드 9): 같은 세션의 서브에이전트는 **스크래치패드를 공유한다.** v3의 `<scratchpad>/sandbox` 한 이름을 모두가 쓰자
한 에이전트가 사본을 새로 만들며 돌린 `rm -rf "$S"`가 **검증 중이던 다른 에이전트의 사본을 지웠다**(frontend-dev-2 보고). 그 뒤 각자 `sandbox-dev2` 같은 이름을 즉석으로 지어 썼다 — 이름이 즉석이면 또 겹친다.
- `<scratchpad>`는 시스템 프롬프트의 Scratchpad directory 절대경로다. 사본 이름은 위 표의 **전체 에이전트 이름**만 쓴다(`dev2` 같은 약칭·`sandbox`·`sandbox2` 금지).
- **만들 때도 지울 때도 내 이름의 경로 하나만 지운다.** `rm -rf "<scratchpad>/sandbox"*`·`rm -rf "<scratchpad>"/*`처럼 와일드카드나 상위 폴더를 지우지 않는다.
- 스크래치패드에서 남의 이름(`sandbox-<남>`)이나 이름 없는 `sandbox`·즉석 이름 폴더를 봐도 **지우지 않는다** — 누군가 지금 쓰는 중일 수 있다. 보고에만 적고, 정리는 라운드가 끝난 뒤 오케스트레이터가 한다.
- `/api-check`의 클론 `sandbox-api`는 예외로 이름이 하나뿐이다 — pm-integrator/오케스트레이터 중 **한 명만**(Docker 서버는 한 대) 돌리기 때문이다(§5).

## 1. 샌드박스 사본 만들기 — 프로젝트 `posts/`를 건드리지 않는 이유

`start.ps1`은 `-Root <폴더>`로 어느 폴더든 서빙한다. 작업 트리(내가 방금 고친 미커밋 파일 포함)를 스크래치패드에 복사하고 **그 사본에** 픽스처를 넣는다.

```bash
P="C:/Users/user/Downloads/기술 블로그/기술 블로그"          # 프로젝트
ME="<내 에이전트 이름>"                                        # §0 표: pm-integrator | orchestrator | frontend-dev | frontend-dev-2 | web-designer
S="<내 스크래치패드 절대경로>/sandbox-$ME"                      # 시스템 프롬프트의 Scratchpad directory. 세션마다 다르다
case "$S" in */sandbox-"$ME") ;; *) echo "사본 경로가 sandbox-<내 이름>이 아니다: $S"; exit 1;; esac   # 빈 ME·오타로 남의 사본·스크래치패드를 지우지 않게
rm -rf "$S" && mkdir -p "$S"                                   # 지우는 것은 내 이름의 경로 하나뿐
( cd "$P" && tar --exclude=.git --exclude='posts/_tmp*' --exclude='*.bak*' -cf - . ) | ( cd "$S" && tar -xf - )
ls "$S/index.html" "$S/start.ps1" "$S/posts/index.json"       # 세 개가 있어야 복사가 된 것
```
- Bash 도구는 호출마다 셸 상태(변수)가 사라진다 — `ME`·`S`는 **명령마다 다시 적는다.** 변수가 비면 `$S`가 `.../sandbox-`가 되어 위 `case`가 막는다(막지 않으면 엉뚱한 경로를 지운다).
- `git archive`가 아니라 **작업 트리**를 복사한다: 검증 대상은 내가 방금 고친 미커밋 코드다.
- `posts/_tmp*`·`*.bak*`은 제외한다(다른 에이전트가 같은 시각에 남긴 흔적일 수 있다). 사본 `index.json`에 `_tmp`로 시작하는 분류의 항목이 남아 있으면 지운다.
- 코드를 더 고친 뒤 다시 확인하려면 **같은 명령을 다시** 돌린다(사본은 스냅샷이다). 픽스처는 §2를 다시 넣는다 — 스크립트로 만들어 두면 반복이 싸다.
- PowerShell에서 하면: `$S = "<내 스크래치패드>\sandbox-<내 에이전트 이름>"` → `robocopy "$P" "$S" /MIR /XD .git /XF *.bak* /NFL /NDL /NJH /NJS` (종료 코드 0~7이 성공) 뒤에 `Remove-Item "$S/posts/_tmp*" -Recurse -Force`. `/MIR`은 대상 폴더를 원본과 똑같이 지우고 맞추므로 `$S`가 **내 이름의 경로인지** 먼저 본다.

## 2. 검증 입력 규칙 — 계약서를 읽고 만든 픽스처만으로는 합격시키지 않는다 (v3)

meeting-08 근본 원인 R-C: 픽스처를 **계약서를 읽고** 만들었더니 계약의 가정(요약 = h2, 언어 = 소문자, 펜스 = 툴바가 만드는 모양)이 늘 통과했고,
첫 실제 글에서 요약 카드가 한 번도 안 뜨고(D14) `라벨:` 목록이 떨어지고(D16) ```` ```Java ````를 못 알아보는(D18) 것이 드러났다.
그래서 검증 입력은 **세 묶음을 모두** 쓴다. 보고에 어느 묶음의 무엇을 넣었는지 적는다.

| 묶음 | 무엇 | 어디서 |
|---|---|---|
| ① **실제 글 사본** | 사용자가 쓴 글 전부(지금은 `posts/java/2026-09-21-note-125149.md` 1편) — **사본을 그대로**, 고치지 않는다(오타·틀린 설명도 사용자 데이터) | §1이 복사한 사본의 `posts/`에 이미 있다 |
| ② **경계 문서** | 빈 본문 · 첫 줄이 빈 줄(`"\n…"`) · 끝 줄에 개행 없음 · 닫히지 않은 펜스 · 한 줄짜리 · 아주 긴 한 줄 | `_tmp-<me>/`에 만든다 |
| ③ **붙여 넣은 외부 마크다운** | `~~~` 펜스 · 목록 안 펜스 · 들여쓴 펜스 · 백틱 4개 펜스 안의 ```` ``` ```` · 원시 HTML(`<details>`, `class=`·`id=` 속성) · 표 | `_tmp-<me>/`에 만든다 |

- 글쓴이의 습관 목록은 계약 §0-4(H1~)가 진실이다 — ① 사본이 그 습관을 담고 있지만, 습관 행마다 ② ③에서도 한 번씩 건드린다(예: 코드 블록 안 한글 + 대문자 언어 + 느슨한 목록).
- **계약서 문장을 보고 기대값을 만들지 말고, 렌더러(marked)·실제 화면의 결과를 기대값으로 삼는다**(계약은 합격 기준을 말하고, 기대값은 실행이 말한다).
- ①은 픽스처가 아니라 **사용자 데이터**다 — 사본 안에서만 읽고, 프로젝트 원본을 열어 고치거나 옮기지 않는다.

## 2-1. 임시 글 작성 — 사본의 `posts/_tmp-<me>/` 아래에만

- 목록·상세 화면 검증용 임시 글 3~5편(위 ② ③ 문서와 별개로 필요할 때). id·분류는 §0 규칙. 파일은 `<S>/posts/_tmp-<me>/<id>.md`.
- 주제는 **평범한 학습 메모**(CSS Grid, flexbox, 배열 메서드, fetch, git 명령 등). 내용은 검증과 무관하다.
- 검증 목적에 맞게 변화를 준다: 연도가 갈리게(연도 그룹), 태그·분류가 겹치게(연관 글), h2가 2개인 글과 4개 이상인 글(목차), `created ≠ updated`인 글(수정 표기), **같은 날 `Java …` 제목 두 편**(자동 id 충돌).
- 사본 `posts/index.json`의 `posts`에 메타 8개(id·title·summary·created·updated·tags·category·pinned), 사본 `posts/categories.json`에 `{ "slug": "_tmp-<me>", "name": "확인용(<me>)", "description": "", "order": 0 }`.
- frontmatter 형식은 `js/store.js toFrontmatter`와 같게(키 8개 `id, title, summary, created, updated, tags, category, pinned`, 그 순서 — `docs/api.md` §2 PUT).

## 3. 검증 — 사본을 내 포트로 서빙

```powershell
$p = Start-Process -WindowStyle Hidden -FilePath powershell.exe -PassThru -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"$S\start.ps1",'-Root',"$S",'-Port','<내 포트>','-NoBrowser'
"PID: $($p.Id)"
```
`http://localhost:<내 포트>/index.html`로 본다. **프로젝트 폴더를 서빙하지 않는다** — 프로젝트에는 픽스처가 없다.
헤드리스 확인도 같은 URL이다. 검증 스크립트는 스크래치패드에 둔다(프로젝트에 남기지 않는다).
- **헤드리스 주의**: Chrome `--virtual-time-budget`에서는 `requestAnimationFrame` 콜백이 돌지 않는다(라운드 9 frontend-dev-2 실측). rAF에 기대는 화면(모션·인트로·스크롤 후 배치·포커스 이동 등)은 이 옵션 없이 확인하거나(실시간 대기) 대체 수단(rAF를 거치지 않는 상태·클래스·DOM 값 읽기)을 쓴다. 이 옵션으로 "안 바뀜"이 나오면 결함 판정 전에 rAF 경로인지 먼저 본다.

## 4. 정리 — 이 세 줄이 전부 통과해야 끝난 것이다

```bash
# 1) 서버 종료: Stop-Process -Id <PID> -Force  (PowerShell)
netstat -ano | grep :<내 포트>                   # 아무것도 안 나와야 한다
# 2) 사본 삭제 — 내 이름의 경로 하나만(§0). 와일드카드·스크래치패드 루트 금지, 남의 sandbox-* 는 건드리지 않는다
case "$S" in */sandbox-"$ME") rm -rf "$S" ;; *) echo "지우지 않음: $S" ;; esac
# 3) 프로젝트가 깨끗한지 — 사본에서만 작업했으면 당연히 비어 있다. 그래도 확인한다
( cd "$P" && git status --short posts/ && ls posts/ )   # status는 빈 출력, ls에 _tmp* 가 없어야 한다
```

보고에 **`git status --short posts/`가 비어 있음**과 **`posts/`에 `_tmp*` 폴더가 없음**을 적는다. 이 한 줄이 없으면 오케스트레이터가 다시 확인한다.

## 5. `/api-check`(Docker 저장 서버)도 사본에서 — 단 **클론**

Docker 서버는 저장마다 **자동 커밋**(api.md §2-1)을 하므로 프로젝트를 마운트하면 검증 커밋이 사용자 이력에 섞인다.
그래서 `/api-check`는 `git clone`한 사본(`sandbox-api`, `.git` 포함)에 작업 트리를 덮어쓰고 `docker compose --project-directory <클론>`으로 그 클론을 마운트한다. 절차는 `/api-check` §0. 끝나면 클론째 지운다.
- **pm-integrator/오케스트레이터 중 한 명만** 돌린다(Docker 서버는 한 대, 5500). 그래서 클론 이름은 `sandbox-api` 하나다 — §0의 `sandbox-<에이전트 이름>` 사본과 겹치지 않는다.
- 프로젝트 `posts/`는 처음부터 손대지 않는다. `_tmp-pm`·`.bak.pm`을 프로젝트에 만들던 v2 초안 규칙은 폐기.

## 6. 하지 않는 것

- 프로젝트 `posts/`에 픽스처를 쓰지 않는다 — 예외 없음. `posts/_tmp/`(이름 없음)는 폐기됐다.
- 사본 안의 실제 글(①)도 고치지 않는다 — 고친 사본으로 통과시키면 사용자의 실제 글에서는 확인되지 않은 것이다.
- 다른 에이전트의 `_tmp-<남>`·`.bak.<남>`을 지우거나 옮기지 않는다 — 보고에만 적는다. 정리는 오케스트레이터가 한다.
- 스크래치패드의 `sandbox-<남>`·이름 없는 `sandbox`·즉석 이름 사본을 지우지 않는다(§0) — 같은 세션의 다른 에이전트가 검증 중일 수 있다.
- 픽스처를 커밋하지 않는다. `git add posts/` 전에 `ls posts/`를 본다.
