---
name: resume-work
description: 멈춰 둔 작업을 이어서 한다. 저장소 상태를 확인하고, 이 파일 §2~§3의 "멈춘 지점"과 "다음 할 일"을 순서대로 진행하며, 세션을 끝낼 때 목록을 새 상태로 갱신한다. "이어서 해", "이어하기", "다음에 뭐 해야 돼", "어디까지 했지", "하던 거 계속" 요청에서 사용한다. 끊긴 에이전트 하나를 재개하는 것은 /resume-agent, 다른 PC로 옮길 문서는 /handoff.
---

# /resume-work — 멈춘 곳에서 이어하기

이 프로젝트는 여러 채팅·여러 PC가 같은 폴더를 번갈아 만진다. **기억이 아니라 저장소를 먼저 읽는다.**

## 1. 상태 확인 (매번, 이 순서)

```bash
git status --short          # 미커밋 변경 — 다른 채팅이 남긴 것일 수 있다. 지우지 말고 누구 것인지 본다
git log --oneline -10
git fetch && git log --oneline HEAD..origin/main   # 다른 PC가 푸시한 것 → 있으면 /sync
git stash list
ls docs/meeting-*.md | sort | tail -2              # 가장 최근 회의록의 "다음 라운드 작업 지시"·"이월 백로그"
```
- 아래 §2의 기준 커밋보다 새 커밋이 있으면 다른 채팅이 이어서 한 것이다. `git log`와 최신 회의록으로 §3에서 끝난 항목을 지우고 시작한다.
- 계약서는 `docs/contract.md` 1행의 버전을 본다.

## 2. 멈춘 지점 (2026-09-23 기준 · 기준 커밋: 이 스킬을 추가한 커밋)

**라운드 9 개발(`docs/meeting-08.md` 지시) 거의 완료, 사용자 요청으로 중단.** 계약서 v4.3.

| 커밋 | 내용 |
|---|---|
| `d93c424` | v4.2 — 에디터 코드 블록 편의 입력, 푸터 둘째 줄, meeting-08 회의록 |
| `5fdb595` | `index.json` created 드리프트 정정(U5, 단독) |
| `5f9d949` | 계약서 v4.3 + `prose.css` 라벨→목록 간격 20→12px |
| `24f4aa8` | 서버 v1.2(409 `exists`·`stale`, 정적 서빙 허용 목록), `api.md` v1.2, CLAUDE.md·에이전트 정의·스킬 동기화, new-post·edit-post → write.html 안내(U2-A), HANDOFF 결정 기록 표 |
| `2410a12` | frontend-dev #162-166 — `Blog.markdown.codeRanges/codeAt/langLabel`(합격 표 11행 marked와 일치), 파싱 경고 관리자 전용 |
| `c6c404e` | frontend-dev-2 #167-178 — 덮어쓰기 차단 저장 흐름, 코드 블록 판정 통일, `lineStartAt`(fetch 스텁 114항목 통과) |
| (이 스킬 커밋) | `/fixture` v4 — 샌드박스 사본 경로를 `sandbox-<에이전트 이름>`으로 고정, 헤드리스 rAF 주의 · `/api-check` 경로 가드 |

메인 세션 미리보기 확인(start.ps1): 목록·상세·에디터 콘솔 오류 0(에디터의 `/api/health` 404는 정적 미리보기의 정상 동작), 상세의 라벨→목록 간격 12px 실측, 코드 라벨 `Java` 원문 표기, 가로 넘침 없음.

## 3. 다음 할 일 (위에서부터)

### A. 라운드 9 마무리 — 중단된 에이전트 두 몫 (파일 겹침 없음 → 병렬)

1. **web-designer** — `docs/contract.md`만, CSS·HTML·JS 변경 없음이 정상.
   - §12-19 작업표: #162~#178 ✔(`2410a12`·`c6c404e`), #179는 "U7 실기 확인 대기" ☐. 머리말 "이행 상태" 갱신.
   - 개발자가 계약에 없어 스스로 정한 판단을 **등재하거나 기각**(기각하면 새 작업 번호):
     - frontend-dev(`js/markdown.js`) ① 목록·인용이 끝나 닫힌 블록은 `bodyEnd = close =` 마지막 줄 끝, 빈 블록이면 `bodyStart > bodyEnd` 가능 ② 여는 줄이 문서 끝이면 `bodyStart = bodyEnd = len`(marked는 블록을 안 만듦) ③ `- a⏎  ```js⏎  x⏎next`에서 marked는 `next`까지 코드, 구현은 CommonMark대로 밖 — **어느 쪽을 따를지 결정** ④ 머리띠 라벨은 `langOf()` 소문자 유지.
     - frontend-dev-2(`js/editor.js`) ① `keyIs`: `e.key`가 라틴 한 자가 아니면 `e.code`(B/I/D 포함) ② `previousId` 조건 = `state.onDisk` ③ 자동 id = `!onDisk && (!idTouched || id 칸 빈 값)` ④ `REM` 풀기는 낱말 경계 ⑤ 컨테이너가 닫은 블록은 `le <= bodyEnd`까지만 "안" ⑥ 커서가 펜스 줄 위면 툴바 코드 블록 거절 ⑦ 사전 확인 중 저장 버튼 잠금(새 문구 없음).
   - §1-1 소유 표를 `CLAUDE.md`에 맞춤(pm 칸 `.claude/**`, frontend-dev 칸 `posts/*`는 파생 파일만).
   - `/contract-update` §7 grep 일관성 검사 결과 첨부.
2. **pm-integrator**
   - `.claude/agents/*.md` 4개의 작업 규칙 4(픽스처 사본 경로)를 `/fixture` v4 §0 표(`sandbox-<에이전트 이름>`)와 일치시킨다. `/fixture`·`/api-check`는 이미 끝남.
   - `docs/HANDOFF.md` "알려진 문제"에 미확인 항목을 한곳에 모음: 서버 v1.2 실행·문법 검사 미실시(Python·Docker 없음) · 실키보드·한글 IME 미확인(#179 대기) · 전역 파일은 사용자 몫(아래 B-4) · 골든 벡터 등 B8-11 이월.
3. 둘 다 끝나면 로컬 커밋(에이전트는 커밋하지 않는다 — 메인 세션이 파일을 골라 커밋).

### B. 사용자 손이 필요한 것 — 에이전트는 못 한다. 시작할 때 사용자에게 먼저 묻는다

1. **U1 (가장 위험)** — 서버 v1.2는 **한 번도 실행된 적이 없다**(이 PC에 Python·Docker가 없어 문법 검사도 못 함). Docker Desktop 켜기 + 커밋 신원(프로젝트 폴더 `git config user.name`/`user.email` 또는 `.env`의 `BLOG_GIT_NAME`/`BLOG_GIT_EMAIL`) → `/serve` → `/api-check`(한글 제목 새 글 · 같은 날 `Java 정리`→`Java 복습`이 409 · 수정 중 기존 id로 바꾸기 409 · created 불변 · 자동 커밋 파일 목록). 실패하면 pm이 고친다.
2. **U7 실기 확인(10분)** — ① 코드 블록 안에서 `("안녕")` 입력 시 닫는 짝이 두 번 생기는지 ② Alt+Shift+↑가 입력 언어를 바꾸는지 ③ 한글 모드 Ctrl+S가 브라우저 저장 창을 여는지 ④ 폰으로 목록·글. ①이 재현되면 frontend-dev-2 #179 착수.
3. **U6** — 공개 글 `posts/java/2026-09-21-note-125149.md`의 setter·getter 정의가 서로 뒤바뀜(63-64행), `settter`(43행)·`읽거`(51행) 오타. 푸터 문장 때문에 에이전트는 고치지 않는다 — `write.html?id=2026-09-21-note-125149`에서 직접.
4. **U2-A 전역 파일(프로젝트 밖)** — `~/.claude/skills/learn/SKILL.md`(3·13·18·23·28행, 30~41행 `--post` 규칙, **44~49행 posts/·index.json 직접 쓰기**)와 `~/.claude/agents/tutor.md`(87~89행 블로그 글 본문 반환)가 대필 폐기 결정과 충돌. 사용자가 직접 고치거나 허락해야 한다.

### C. 다음 회의 — `/blog-meeting` (라운드 9 회의 → `docs/meeting-09.md`)
- 받을 것: `meeting-08.md` 이월 백로그 **B8-1~B8-13**(단축키 표·상태줄 길이 예산·도킹×split 폭·살균 훅·초안 두 탭·계약 슬림화·제목 맞춤법·상대 이미지 경로·id 칸 잠금·요약 카드·예약 4건·관용 파싱·경미 잔여), A의 기각 작업, B의 실측 결과.
- 사용자 결정 기록은 `docs/HANDOFF.md` §9 표(U1~U11, 2026-09-23).

### D. `/ship` — 푸시와 Pages 반영 확인.

## 4. 끝낼 때 — 이 파일을 갱신한다

세션을 멈추기 전에 §2(멈춘 지점·기준 커밋)와 §3(다음 할 일)을 **새 상태로 덮어쓴다.** 끝난 항목은 지운다(이력은 `git log`와 회의록에 있다). 날짜를 적고, 이 파일도 커밋한다.
