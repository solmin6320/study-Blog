---
name: fixture
description: 글이 0편인 저장소에서 화면·로직을 검증하려고 임시 글을 넣었다가 흔적 없이 지우는 표준 절차. 에이전트(frontend-dev, web-designer)가 검증할 때 따른다. "픽스처", "임시 글로 확인", "테스트 데이터" 요청에서 사용한다.
---

# /fixture — 임시 글로 검증하고 흔적 없이 지우기

이 저장소는 글이 0편이고, 글과 분류는 사용자가 직접 만든다. **검증용 글을 실수로 남기면 사용자가 만든 것처럼 배포된다.** 그래서 절차를 고정한다.

## 1. 백업

```bash
cp posts/index.json posts/index.json.bak && cp posts/categories.json posts/categories.json.bak
```
`*.bak`은 `.gitignore`에 있어서 커밋되지 않는다.

## 2. 픽스처 작성 — `posts/_tmp/` 아래에만

- 3~5편. `id`는 `YYYY-MM-DD-tmp-<a|b|c>` 꼴, `category: _tmp`.
- 주제는 **평범한 학습 메모**(CSS Grid, flexbox, 배열 메서드, fetch, git 명령 등). 특이한 내용을 넣지 않는다 — 내용은 검증과 무관하다.
- 검증 목적에 맞게 변화를 준다: 연도가 갈리게(연도 그룹), 태그·분류가 겹치게(연관 글), h2가 2개인 글과 4개 이상인 글(목차), `created ≠ updated`인 글(수정 표기).
- `posts/index.json`의 `posts`에 메타 8개(id·title·summary·created·updated·tags·category·pinned), `posts/categories.json`에 `{ "slug": "_tmp", "name": "확인용", "description": "", "order": 0 }`.

## 3. 검증

`start.ps1 -Port <내 포트> -NoBrowser`. 포트는 에이전트 정의의 배정을 따른다(오케스트레이터 5500 / frontend-dev 5501 / frontend-dev-2 5502 / web-designer 5503).

## 4. 복원 — 이 세 줄이 전부 통과해야 끝난 것이다

```bash
rm -rf posts/_tmp && mv posts/index.json.bak posts/index.json && mv posts/categories.json.bak posts/categories.json
git status --short posts/        # 아무것도 안 나와야 한다
netstat -ano | grep :<내 포트>   # 아무것도 안 나와야 한다
```

보고에 `git status --short posts/`가 비어 있음을 적는다. 이 한 줄이 없으면 오케스트레이터가 다시 확인한다.
