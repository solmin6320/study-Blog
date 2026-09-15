---
name: deploy-pages
description: 학습 블로그를 GitHub Pages에 배포하거나 업데이트한다. 저장소 초기화, 커밋, 푸시, Pages 설정, 경로 문제를 처리한다. "배포해줘", "깃허브에 올려", "Pages 설정", "공개하자" 같은 요청에서 사용한다.
---

# GitHub Pages 배포

## 배포 전 필수 점검

**되돌리기 어려운 작업이다. 푸시 전에 반드시 확인한다.**

1. `/security-check` — 공개되면 안 되는 것이 커밋에 섞이지 않았는가
2. 커밋될 파일에 개인정보·비공개 URL·이메일이 없는가
3. `posts/` 안의 글 중 공개하기 곤란한 초안이 있는가
4. **경로가 전부 상대경로인가** — 절대경로(`/assets/...`)는 프로젝트 페이지(`user.github.io/repo/`)에서 전부 깨진다
```bash
grep -nE '(href|src)="/[^/]' *.html
```
결과가 있으면 배포 전에 고쳐야 한다.

## 첫 배포

```bash
cd "C:/기술 블로그"
git init
git add -A
git status          # 커밋될 목록을 사용자에게 보여주고 확인받는다
git commit -m "개인 학습 블로그 초기 구축"
git branch -M main
git remote add origin <저장소 URL>
git push -u origin main
```

저장소 URL은 **사용자에게 묻는다.** 임의로 만들거나 추측하지 않는다.
저장소가 아직 없으면 `gh repo create`를 제안하되, **공개/비공개 여부는 반드시 사용자에게 확인**한다.

## Pages 켜기

GitHub 저장소 → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save.
`gh` CLI가 있으면:
```bash
gh api -X POST repos/:owner/:repo/pages -f source[branch]=main -f source[path]=/
```
반영까지 1~2분. 주소는 `https://<사용자명>.github.io/<저장소명>/`.

## 배포 후 확인

1. 목록이 뜨는가 (안 뜨면 대개 **대소문자** 문제 — Windows는 구분 안 하지만 GitHub Pages 서버는 구분한다)
```bash
ls posts/    # 파일명과 index.json의 id 대소문자가 정확히 일치하는지 대조
```
2. **관리자 버튼이 방문자에게 안 보이는가** — 시크릿 창으로 확인. 보이면 `admin.js` 판정 로직 결함
3. CSS·JS 404가 없는가 (개발자도구 Network 탭)

## 이후 글 추가 배포

```bash
git add posts/ && git commit -m "새 글: <제목>" && git push
```
푸시 후 1분 내 반영된다.

## 주의

- `.nojekyll` 파일을 루트에 두면 Jekyll 처리를 건너뛴다. `_`로 시작하는 폴더를 쓸 계획이면 필요하다
- 커밋 메시지는 한국어로 간결하게
- **푸시는 사용자 승인 없이 하지 않는다.** 공개 인터넷에 내보내는 행위다
