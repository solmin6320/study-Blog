---
name: fixture
description: 글이 0편인 저장소에서 화면·로직을 검증하려고 임시 글을 넣었다가 흔적 없이 지우는 표준 절차. 모든 에이전트(web-designer, frontend-dev, frontend-dev-2, pm-integrator)가 검증할 때 따른다. 병렬 작업 중 프로젝트 posts/를 공유하지 않도록 에이전트별 샌드박스 사본에서 검증한다. "픽스처", "임시 글로 확인", "테스트 데이터" 요청에서 사용한다.
---

# /fixture — 임시 글로 검증하고 흔적 없이 지우기 (v2, 2026-09-18 격리판)

이 저장소는 글이 0편이고, 글과 분류는 사용자가 직접 만든다. **검증용 글을 실수로 남기면 사용자가 만든 것처럼 배포된다.**
그리고 에이전트는 **병렬로 뛴다** — 라운드 4에서 두 에이전트가 같은 `posts/_tmp`·`index.json.bak`을 써 서로 덮었다.
그래서 v2부터 **프로젝트 `posts/`에는 손대지 않는다.** 검증은 내 스크래치패드의 **샌드박스 사본**에서 한다.

## 0. 내 이름·포트 (에이전트 정의와 같다)

| 에이전트 | 이름 `<me>` | 포트 |
|---|---|---|
| pm-integrator / 오케스트레이터 | `pm` | 5500 |
| frontend-dev | `dev` | 5501 |
| frontend-dev-2 | `dev2` | 5502 |
| web-designer | `wd` | 5503 |

픽스처 **id는 `YYYY-MM-DD-tmp-<me>-<a|b|c…>`**, **분류 slug는 `_tmp-<me>`**. 이름이 박혀 있어야 남은 흔적이 누구 것인지 바로 안다.
`_tmp`(이름 없음)는 v1 흔적이다 — 보이면 지우고 보고에 적는다.

## 1. 샌드박스 사본 만들기 — 프로젝트 `posts/`를 건드리지 않는 이유

`start.ps1`은 `-Root <폴더>`로 어느 폴더든 서빙한다. 작업 트리(내가 방금 고친 미커밋 파일 포함)를 스크래치패드에 복사하고 **그 사본에** 픽스처를 넣는다.

```bash
P="C:/Users/user/Downloads/기술 블로그/기술 블로그"          # 프로젝트
S="<내 스크래치패드 절대경로>/sandbox"                         # 시스템 프롬프트의 Scratchpad directory. 세션마다 다르다
rm -rf "$S" && mkdir -p "$S"
( cd "$P" && tar --exclude=.git --exclude='posts/_tmp*' --exclude='*.bak*' -cf - . ) | ( cd "$S" && tar -xf - )
ls "$S/index.html" "$S/start.ps1" "$S/posts/index.json"       # 세 개가 있어야 복사가 된 것
```
- `git archive`가 아니라 **작업 트리**를 복사한다: 검증 대상은 내가 방금 고친 미커밋 코드다.
- `posts/_tmp*`·`*.bak*`은 제외한다(다른 에이전트가 같은 시각에 남긴 흔적일 수 있다). 사본 `index.json`에 `_tmp`로 시작하는 분류의 항목이 남아 있으면 지운다.
- 코드를 더 고친 뒤 다시 확인하려면 **같은 명령을 다시** 돌린다(사본은 스냅샷이다). 픽스처는 §2를 다시 넣는다 — 스크립트로 만들어 두면 반복이 싸다.
- PowerShell에서 하면: `robocopy "$P" "$S" /MIR /XD .git /XF *.bak* /NFL /NDL /NJH /NJS` (종료 코드 0~7이 성공) 뒤에 `Remove-Item "$S/posts/_tmp*" -Recurse -Force`.

## 2. 픽스처 작성 — 사본의 `posts/_tmp-<me>/` 아래에만

- 3~5편. id·분류는 §0 규칙. 파일은 `<S>/posts/_tmp-<me>/<id>.md`.
- 주제는 **평범한 학습 메모**(CSS Grid, flexbox, 배열 메서드, fetch, git 명령 등). 특이한 내용을 넣지 않는다 — 내용은 검증과 무관하다.
- 검증 목적에 맞게 변화를 준다: 연도가 갈리게(연도 그룹), 태그·분류가 겹치게(연관 글), h2가 2개인 글과 4개 이상인 글(목차), `created ≠ updated`인 글(수정 표기).
- 사본 `posts/index.json`의 `posts`에 메타 8개(id·title·summary·created·updated·tags·category·pinned), 사본 `posts/categories.json`에 `{ "slug": "_tmp-<me>", "name": "확인용(<me>)", "description": "", "order": 0 }`.
- frontmatter 형식은 `docs/api.md` §3 / `js/store.js toFrontmatter`와 같게(키 8개, 그 순서).

## 3. 검증 — 사본을 내 포트로 서빙

```powershell
$p = Start-Process -WindowStyle Hidden -FilePath powershell.exe -PassThru -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"$S\start.ps1",'-Root',"$S",'-Port','<내 포트>','-NoBrowser'
"PID: $($p.Id)"
```
`http://localhost:<내 포트>/index.html`로 본다. **프로젝트 폴더를 서빙하지 않는다** — 프로젝트에는 픽스처가 없으니 빈 목록만 나온다.
헤드리스 확인도 같은 URL이다. 검증 스크립트는 스크래치패드에 둔다(프로젝트에 남기지 않는다).

## 4. 정리 — 이 세 줄이 전부 통과해야 끝난 것이다

```bash
# 1) 서버 종료: Stop-Process -Id <PID> -Force  (PowerShell)
netstat -ano | grep :<내 포트>                   # 아무것도 안 나와야 한다
# 2) 사본 삭제
rm -rf "$S"
# 3) 프로젝트가 깨끗한지 — 사본에서만 작업했으면 당연히 비어 있다. 그래도 확인한다
( cd "$P" && git status --short posts/ && ls posts/ )   # status는 빈 출력, ls에 _tmp* 가 없어야 한다
```

보고에 **`git status --short posts/`가 비어 있음**과 **`posts/`에 `_tmp*` 폴더가 없음**을 적는다. 이 한 줄이 없으면 오케스트레이터가 다시 확인한다.

## 5. `/api-check`(Docker 저장 서버)도 사본에서 — 단 **클론**

Docker 서버는 저장마다 **자동 커밋**(api.md §2-1)을 하므로 프로젝트를 마운트하면 검증 커밋이 사용자 이력에 섞인다.
그래서 `/api-check`는 `git clone`한 사본(`sandbox-api`, `.git` 포함)에 작업 트리를 덮어쓰고 `docker compose --project-directory <클론>`으로 그 클론을 마운트한다. 절차는 `/api-check` §0. 끝나면 클론째 지운다.
- **pm-integrator/오케스트레이터만** 돌린다(Docker 서버는 한 대, 5500).
- 프로젝트 `posts/`는 처음부터 손대지 않는다. `_tmp-pm`·`.bak.pm`을 프로젝트에 만들던 v2 초안 규칙은 폐기.

## 6. 하지 않는 것

- 프로젝트 `posts/`에 픽스처를 쓰지 않는다 — 예외 없음. `posts/_tmp/`(이름 없음)는 폐기됐다.
- 다른 에이전트의 `_tmp-<남>`·`.bak.<남>`을 지우거나 옮기지 않는다 — 보고에만 적는다. 정리는 오케스트레이터가 한다.
- 픽스처를 커밋하지 않는다. `git add posts/` 전에 `ls posts/`를 본다.
