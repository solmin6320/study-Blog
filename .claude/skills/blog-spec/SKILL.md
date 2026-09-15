---
name: blog-spec
description: 학습 블로그의 확정 규약(폴더 구조, 데이터 모델, 네임스페이스, CSS 토큰, 허용 의존성)을 조회한다. 이 프로젝트 코드를 새로 작성하거나 수정하기 전에 컨벤션을 맞출 때 사용한다.
---

# 블로그 확정 규약

## 폴더 구조

```
index.html          글 목록 (메모지 보드)
post.html           글 상세
write.html          에디터 (관리자 전용 UI)
css/         tokens / base / layout / components / prose / animations
js/          config / store / markdown / ui / app / post / editor / admin
posts/index.json    글 메타 목록 (본문 없음)
posts/*.md          글 본문 (frontmatter 포함)
docs/               회의록
start.bat           로컬 미리보기 서버
```

## 확정 사항

| 항목 | 값 |
|---|---|
| 빌드 도구 | 없음 (Node.js 미사용) |
| 허용 CDN | jQuery, marked.js, highlight.js, DOMPurify — 고정 버전 |
| 배포 | GitHub Pages (공개) |
| 글 저장 | 하이브리드: 에디터 작성 → .md 내보내기 → posts/ 커밋 |
| 임시저장 | localStorage (내보내기 전까지의 초안만) |
| 관리자 모드 | UI 노출 스위치일 뿐, 보안 장치가 아님 |
| JS 네임스페이스 | `window.Blog.*` 하나만 |
| 색상·간격 | 전부 `css/tokens.css`의 CSS 변수 |

## 날짜 규칙

`created`는 불변, `updated`는 저장 시마다 갱신. 둘 다 KST 오프셋 ISO 8601.

## 보안 규칙

마크다운 렌더 결과는 예외 없이 DOMPurify를 통과시킨 뒤 DOM에 넣는다. `innerHTML` 직접 대입 금지.

## 새 의존성이 필요할 때

임의로 추가하지 않는다. 사용자에게 "무엇을 / 왜 / 없으면 어떤 문제가 생기는지"를 묻고 승인받는다.
