---
name: new-post
description: 학습 블로그에 새 글을 추가하거나 기존 글을 수정한다. posts/ 폴더에 frontmatter가 붙은 .md 파일을 만들고 posts/index.json을 갱신하며, created/updated 날짜 규칙을 지킨다. "새 글 써줘", "오늘 공부한 거 정리해서 올려줘", "○○ 글 수정해줘" 같은 요청에서 사용한다.
---

# 새 글 추가 / 기존 글 수정

## 1. 새 글인지 수정인지 먼저 판정

`posts/index.json`을 읽어 같은 주제의 글이 이미 있는지 확인한다. 애매하면 사용자에게 묻는다.

## 2. 파일 규칙

- 경로: `posts/<category-slug>/<id>.md` — 분류 폴더 안에 둔다. `id`는 `YYYY-MM-DD-slug`(slug는 영문 소문자·숫자·하이픈만).
- `id`는 확장자를 뺀 파일명과 **정확히 일치**해야 한다.
- `category`는 `posts/categories.json`에 있는 slug만. **없는 분류는 만들지 말고 사용자에게 묻는다** — 새 분류는 사용자가 에디터에서 직접 만든다.

```
---
id: 2026-09-13-css-grid
title: CSS Grid 레이아웃 정리
summary: 한 줄 요약 (상세 화면과 검색에 쓰인다. 목록에는 안 나온다)
created: 2026-09-13T14:20:00+09:00
updated: 2026-09-13T14:20:00+09:00
tags: [css, layout]
category: css
pinned: false
---

본문 마크다운
```

- frontmatter 키는 위 8개뿐이다. `color`는 v3.0에서 폐기됐다 — 넣어도 무시된다.
- `category`: 하나만. `tags`: 여러 개 가능.

## 3. 날짜 규칙 (절대 어기지 말 것)

- **새 글**: `created`와 `updated` 둘 다 현재 시각.
- **수정**: `created`는 기존 파일의 값을 **그대로 복사**하고, `updated`만 현재 시각으로 바꾼다.
- 시각은 항상 KST(`+09:00`) 오프셋을 붙인 ISO 8601로 쓴다.
- 현재 시각은 추측하지 말고 `date -Iseconds` 로 확인한다.

## 4. index.json 갱신

`posts/index.json`의 `posts` 배열에 본문을 뺀 메타데이터를 넣는다(새 글은 추가, 수정은 해당 항목 교체). **본문은 절대 넣지 않는다** — 목록 화면 성능 때문이다.

작업 후 `id` 중복이 없는지, `.md` 파일 수와 배열 길이가 같은지 확인한다.

## 5. 마무리

변경한 파일 목록과 글 제목·날짜를 한국어로 보고한다. 로컬 서버가 떠 있으면 새로고침해서 확인하라고 안내한다.
