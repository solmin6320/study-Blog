---
name: deploy-pages
description: GitHub Pages 배포 상태를 점검하거나, 새 저장소·새 PC에서 처음 연결할 때 쓴다. 일상적인 커밋·푸시는 /ship. "배포 설정 확인", "Pages 안 떠", "새 저장소로 옮겨" 요청에서 사용한다.
---

# /deploy-pages — 배포 설정

## 현재 상태 (2026-09-17)

- 원격: `https://github.com/solmin6320/study-Blog.git`, 브랜치 `main`
- Pages: Settings → Pages → Deploy from a branch → `main` / `/(root)` — **켜져 있음**
- 주소: `https://solmin6320.github.io/study-Blog/`
- 인증: Git Credential Manager에 저장돼 있어 `git push`가 바로 된다. `gh`는 로그인 안 돼 있음(필요 없다).

일상 작업은 `/ship`. 이 스킬은 아래 두 경우만.

## A. 배포가 안 뜰 때

1. `git log origin/main -1`과 GitHub의 main 최신 커밋이 같은지.
2. 저장소 → Actions 탭 → "pages build and deployment"가 실패했는지. 실패 로그의 첫 줄이 원인이다.
3. 하위 경로 배포(`/study-Blog/`)라 **절대 경로(`/css/…`)는 깨진다.** 전부 상대 경로여야 한다:
   ```bash
   grep -nE '(href|src|action)="/[^/]' index.html post.html write.html
   ```
   결과가 있으면 그게 원인.
4. GitHub Pages는 **대소문자를 구분**한다. Windows에서 되던 `posts/CSS/…`가 배포에선 404. `id`와 파일명·폴더명 대조.
5. 배포 도메인에서 `write.html`은 "로컬에서만 동작" 문구만 보여야 정상이다. 에디터가 보이면 `js/admin.js` 결함.

## B. 새 저장소·새 PC에서 처음 연결

```bash
git remote -v                                   # 없으면 ↓
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```
그다음 GitHub → Settings → Pages → Source `Deploy from a branch` → `main` / `/(root)` → Save. 1~2분 뒤 `https://<user>.github.io/<repo>/`.

`.git/info/exclude`에 학습 에이전트 제외 목록이 있어야 한다(새 clone에는 없다):
```
.claude/agents/tutor.md
.claude/skills/learn/
```
