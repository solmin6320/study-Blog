---
name: code-audit
description: 학습 블로그의 HTML/JS 코드를 감사한다. CSS-HTML 클래스 정합성, 파일 간 함수명 불일치, 예외 처리 누락, 죽은 코드, 전역 오염을 기계적으로 검사한다. "코드 점검", "버그 있나 봐줘", "클래스 안 맞는 것 같아", "통합 확인" 같은 요청에서 사용한다.
---

# 코드 감사

## 1. CSS ↔ HTML/JS 클래스 정합성 (통합의 핵심)

디자이너와 개발자가 따로 작업하므로 **여기가 가장 자주 깨진다.**

```bash
# CSS가 정의한 클래스
grep -ohE '\.[a-z][a-z0-9-]+' css/*.css | sort -u > /tmp/css.txt
# HTML/JS가 실제로 쓰는 클래스
grep -ohE 'class="[^"]*"' *.html | grep -ohE '[a-z][a-z0-9-]+' | sort -u > /tmp/html.txt
```
- **CSS에는 있는데 아무도 안 쓰는 클래스** → 죽은 스타일 (또는 개발자가 빠뜨림)
- **HTML/JS는 쓰는데 CSS에 없는 클래스** → 스타일 없는 요소 (치명적일 수 있음)
- 두 목록의 차집합을 직접 확인하고, `docs/contract.md`와 대조해 **누가 계약을 어겼는지** 판정한다

## 2. JS 파일 간 연결

```bash
grep -n 'Blog\.[A-Za-z]*' js/*.html js/*.js | sort
```
- `window.Blog.X`를 **호출하는 쪽**과 **정의하는 쪽**이 짝이 맞는가
- 각 HTML의 `<script>` 로드 순서가 의존성 순서와 맞는가 (config → util → store → markdown → ui → admin → 페이지별)
- 전역 오염: IIFE·module 밖에 선언된 `var`/`function`이 있는가

## 3. 예외 처리 4종 (이 프로젝트 필수)

각각이 코드에 실제로 있는지 확인:
| 상황 | 확인 |
|---|---|
| fetch 실패 | `.catch` 또는 `res.ok` 검사 후 화면에 안내가 뜨는가 |
| 빈 목록 | `.board-empty` 노출 로직이 있는가 |
| 없는 글 id | `.post-error` 노출 + 목록으로 돌아가는 링크 |
| 깨진 frontmatter | 파서가 던지지 않고 방어하는가 |

## 4. 보안 (공개 배포 전제)

```bash
grep -n 'innerHTML\|outerHTML\|insertAdjacentHTML\|document.write' js/*.js *.html
grep -n 'DOMPurify' js/*.js
```
- `marked.parse()` 호출 지점마다 **그 결과가 DOMPurify를 거치는지** 한 줄씩 따라가서 확인한다. 한 군데라도 빠지면 치명적 결함이다
- 살균 헬퍼를 우회해 직접 `innerHTML`에 넣는 곳이 있는가

## 5. 날짜 규칙 (사용자 명시 요구사항)

```bash
grep -n 'created\|updated' js/*.js
```
- 수정 모드에서 `created`를 **원본에서 복사**하는가, 아니면 새로 만드는가 (후자면 결함)
- `updated`가 저장 시 실제로 갱신되는가
- 목록·상세 **양쪽 모두** 두 날짜를 표시하는가

## 6. 문법 점검 (Node 없으므로 육안 + 기계 보조)

```bash
grep -c '{' js/app.js; grep -c '}' js/app.js   # 괄호 짝 근사 검사
```
따옴표 짝, 괄호 짝, `const` 재할당, 오타난 함수명을 직접 읽어 확인한다.

## 보고 형식

심각도(치명/중대/경미)순. `파일:줄` + 재현 조건 + 수정 방향. 추측한 것은 "미확인"이라고 명시한다.
