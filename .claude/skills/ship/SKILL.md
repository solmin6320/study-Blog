---
name: ship
description: 에디터 밖에서 바꾼 것(코드·CSS·문서)을 커밋하고 GitHub에 푸시한 뒤 Pages 반영을 확인한다. "커밋 푸시해줘", "올려줘", "배포해줘"(이미 Pages가 켜진 뒤) 요청에서 사용한다. 글 저장은 서버가 스스로 커밋·푸시하므로 글만 썼다면 이 스킬이 필요 없다. 최초 저장소 설정은 /deploy-pages.
---

# /ship — 커밋 · 푸시 · 반영 확인

## 무엇을 올리는 스킬인가 (v1.3부터 역할이 좁아졌다)

**글은 저장할 때 서버가 이미 커밋·푸시했다**(`docs/api.md` §2-1-1, 2026-10-28). 이 스킬은 **에디터 밖에서 바꾼 것** — 코드·CSS·HTML·문서·회의록·스킬 — 을 올린다.

```bash
git status -sb | head -1     # "## main...origin/main" 뒤에 ahead/behind 가 없으면 올릴 것이 없다
git log --oneline @{u}.. 2>/dev/null   # 아직 안 올라간 커밋. "글: …" 만 남아 있다면 서버 푸시가 실패한 것이다
```
- `글: <제목>` 커밋이 안 올라간 채 남아 있으면 **저장 때 푸시가 실패한 것**이다(토큰 없음·원격이 앞섬·오프라인). 그 커밋은 이 스킬의 `git push`로 함께 올라간다. 원인은 `/serve` §0-1(푸시 자격)에서 확인한다.
- `posts/` 아래 파일을 에이전트가 직접 커밋하지 않는다 — 글은 사용자 것이다(CLAUDE.md "posts/의 소유 범위"). 서버 저장이 남긴 커밋을 **올리는 것**은 괜찮다.

## 전제 확인 (하나라도 걸리면 멈춘다)

```bash
git status --short && find posts -path "*_tmp*" && netstat -ano | grep -E ":(5500|5501|5502|5503)\s.*LISTENING"
```
- `posts/_tmp`가 있으면 픽스처가 안 지워진 것 → `/fixture` 마무리 절차 먼저.
- 로컬 서버가 떠 있으면 종료.
- `.claude/agents/tutor.md`, `.claude/skills/learn/`이 status에 보이면 **절대 올리지 않는다**(`.git/info/exclude`에 있어야 한다 — 없으면 추가).
- 백그라운드 에이전트가 아직 파일을 고치고 있으면 끝날 때까지 기다린다.

## 커밋

```bash
git add -A && git status --short
```
목록을 눈으로 훑는다. 의도하지 않은 파일(로그, `.bak`, 스크래치)이 있으면 뺀다.

메시지는 **한 줄 제목 + 빈 줄 + 왜(2~4줄)**. 무엇을 바꿨는지는 diff가 말하니 **왜 바꿨는지**를 쓴다. 사용자가 메시지를 지정했으면 그대로. 끝에 attribution 트레일러.

## 푸시

```bash
git push
```
거절되면 `/sync` 먼저. 인증 오류(403·credential)면 `gh auth login` 후 다시(2026-09-22부터 푸시는 gh 로그인 후에만).
`gh auth login`을 새로 했으면, 띄워 둔 에디터 서버는 **다시 켜야** 새 토큰으로 자동 푸시한다(토큰은 기동 때 한 번 읽는다 — `/serve` §0-1).

## 반영 확인 (Pages는 1~2분 걸린다)

```bash
for i in 1 2 3 4 5 6 7 8 9; do curl -sf https://solmin6320.github.io/study-Blog/posts/index.json | diff -q - posts/index.json >/dev/null && echo "반영됨 (${i}0초)" && break; sleep 10; done
```
`posts/`를 안 건드린 커밋이면 `index.html`의 변경된 문자열로 대신 확인한다.

CSS·JS를 바꿨으면 Browser 도구로 `https://solmin6320.github.io/study-Blog/`를 열어 콘솔 에러 0건, 헤더에 "쓰기" 없음(배포 도메인 잠금)을 본다.

## 보고

커밋 해시 한 줄, 반영 확인 결과 한 줄. 끝.
