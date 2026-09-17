---
name: sync
description: 다른 세션·다른 PC에서 푸시한 작업을 받아온다. 원격과 로컬을 비교하고, 미커밋 변경은 stash로 보관한 뒤 pull한다. "pull 해줘", "최신 상태 받아와", "다른 데서 작업했어", "동기화" 요청에서 사용한다.
---

# /sync — 원격 작업 받아오기

사용자가 여러 세션을 번갈아 쓰므로 원격에 모르는 커밋이 있을 수 있다. **pull 전에 반드시 비교한다.**

## 절차

1. 비교
   ```bash
   git fetch origin && git log --oneline main..origin/main && git log --oneline origin/main..main && git status --short
   ```
   - 첫 목록 = 원격에만 있는 커밋, 둘째 = 로컬에만 있는 커밋.
2. 원격에만 커밋이 있으면 그 커밋의 `git show --stat --format=%B`를 읽고 **무엇이 바뀌었는지 한 줄로 파악**한다. 지금 로컬에서 진행 중인 작업과 겹치는지 본다.
3. 작업 트리가 더러우면 `git stash push -u -m "<무슨 작업인지>"`로 보관. 지우지 않는다.
4. `git pull --ff-only origin main`. ff가 안 되면(양쪽 다 커밋) 멈추고 사용자에게 알린다 — rebase/merge는 사용자가 정한다.
5. stash가 있으면: 원격 커밋이 같은 파일을 건드렸는지 확인. 겹치면 "원격이 이미 처리한 작업이라 stash는 버려도 된다"고 알리고, 안 겹치면 `git stash pop`.
6. **진행 중이던 에이전트가 있으면** 그 에이전트가 원격 커밋 이후 상태를 다시 읽어야 한다. `SendMessage`로 "HEAD가 바뀌었다, `docs/contract.md`와 소유 파일을 다시 읽어라"를 보낸다.

## 보고

원격에서 받은 커밋 한 줄 요약, stash 처리, 에이전트에 통보했는지. 세 줄이면 충분하다.
