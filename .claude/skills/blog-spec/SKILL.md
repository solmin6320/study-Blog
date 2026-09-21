---
name: blog-spec
description: 학습 블로그의 확정 규약(폴더 구조, 데이터 모델, 네임스페이스, CSS 토큰, 허용 의존성)을 조회한다. 이 프로젝트 코드를 새로 작성하거나 수정하기 전에 컨벤션을 맞출 때 사용한다.
---

# 블로그 확정 규약

## 폴더 구조

```
index.html          글 목록 (리스트/카드 그리드 — 메모지는 v3.0에서 폐기)
post.html           글 상세
write.html          에디터 (관리자 전용 UI)
.nojekyll           필수 — 없으면 Pages의 Jekyll이 posts/*.md를 .html로 바꿔 글이 404
css/         tokens / base / layout / components / prose   (animations.css는 v3.0에서 삭제)
js/          theme-init / config / util / store / markdown / ui / admin / app / post / editor
posts/index.json    글 메타 목록 (본문 없음)
posts/categories.json  분류
posts/<slug>/*.md   글 본문 (frontmatter 포함)
docs/               contract.md(계약서) / api.md(서버 규약) / meeting-NN.md / HANDOFF.md
server/ + Dockerfile / docker-compose.yml   로컬 에디터 서버(파이썬, 로컬 전용)
start.bat / start.ps1   Docker 있으면 compose, 없으면 정적 미리보기(저장 불가)
```

## 확정 사항

| 항목 | 값 |
|---|---|
| 빌드 도구 | 없음 (Node.js 미사용). 파이썬은 로컬 서버(`server/`)에만 |
| 허용 CDN | jQuery, marked.js, highlight.js, DOMPurify — 고정 버전 |
| 배포 | GitHub Pages (공개). 푸시는 `gh auth login` 후 `/ship` |
| 글 저장 | **서버 단일 모드**(v3.9): `docker compose up` → write.html 저장(Ctrl+S) → 서버가 posts/에 쓰고 자동 커밋. 내보내기(다운로드) 폐지 |
| 임시저장 | localStorage (서버에 저장하기 전까지의 초안만) |
| 소개 페이지 | 없음 — `about.html`은 v3.9에서 삭제. 내비는 글·태그·쓰기 3항목 |
| 관리자 모드 | UI 노출 스위치일 뿐, 보안 장치가 아님 |
| JS 네임스페이스 | `window.Blog.*` 하나만 |
| 색상·간격 | 전부 `css/tokens.css`의 CSS 변수 |

## 날짜 규칙

`created`는 불변, `updated`는 저장 시마다 갱신. 둘 다 KST 오프셋 ISO 8601.

## 보안 규칙

마크다운 렌더 결과는 예외 없이 DOMPurify를 통과시킨 뒤 DOM에 넣는다. `innerHTML` 직접 대입 금지.

## 새 의존성이 필요할 때

임의로 추가하지 않는다. 사용자에게 "무엇을 / 왜 / 없으면 어떤 문제가 생기는지"를 묻고 승인받는다.
