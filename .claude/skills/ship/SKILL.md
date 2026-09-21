---
name: ship
description: 작업을 커밋하고 GitHub에 푸시한 뒤 Pages 반영을 확인한다. "커밋 푸시해줘", "올려줘", "배포해줘"(이미 Pages가 켜진 뒤) 요청에서 사용한다. 최초 저장소 설정은 /deploy-pages.
---

# /ship — 커밋 · 푸시 · 반영 확인

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

## 반영 확인 (Pages는 1~2분 걸린다)

```bash
for i in 1 2 3 4 5 6 7 8 9; do curl -sf https://solmin6320.github.io/study-Blog/posts/index.json | diff -q - posts/index.json >/dev/null && echo "반영됨 (${i}0초)" && break; sleep 10; done
```
`posts/`를 안 건드린 커밋이면 `index.html`의 변경된 문자열로 대신 확인한다.

CSS·JS를 바꿨으면 Browser 도구로 `https://solmin6320.github.io/study-Blog/`를 열어 콘솔 에러 0건, 헤더에 "쓰기" 없음(배포 도메인 잠금)을 본다.

## 보고

커밋 해시 한 줄, 반영 확인 결과 한 줄. 끝.
