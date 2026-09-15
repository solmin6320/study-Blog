---
name: security-check
description: 학습 블로그의 보안을 점검한다. 마크다운 XSS 방어(DOMPurify 경로), innerHTML 사용, 외부 링크 rel, CDN 무결성, 관리자 모드 오해 소지를 검사한다. "보안 점검", "XSS 괜찮아?", "공개해도 되나" 같은 요청에서 사용한다.
---

# 보안 점검

**공개 배포(GitHub Pages) 전제.** 이 블로그의 유일한 실질적 공격면은 **마크다운 → HTML 렌더 경로**다. 거기에 집중한다.

## 1. 마크다운 살균 경로 추적 (최우선)

```bash
grep -n 'marked\.\(parse\|Parser\)\|DOMPurify\.sanitize' js/*.js
```
`marked.parse()` 호출 지점을 **전부** 찾아, 각각의 결과가 DOM에 닿기 전에 `DOMPurify.sanitize()`를 통과하는지 **한 줄씩 따라간다.** 한 곳이라도 빠지면 **치명적 결함**이다.

특히 놓치기 쉬운 곳:
- 에디터 **실시간 미리보기** (본문과 다른 경로를 타기 쉽다)
- TOC 생성 시 제목 텍스트 추출
- 검색 결과 하이라이팅
- 요약(`summary`) 필드를 목록 카드에 넣는 경로

## 2. innerHTML 감사

```bash
grep -n 'innerHTML\|outerHTML\|insertAdjacentHTML\|document.write\|\$(.*)\.html(' js/*.js *.html
```
- jQuery `.html()`도 `innerHTML`과 같다. 살균 안 된 값이 들어가면 동일한 결함
- 살균 헬퍼를 거치지 않고 직접 대입하는 곳이 있는가
- 텍스트만 넣으면 되는 곳에 `innerHTML`을 쓰고 있는가 → `textContent`로

## 3. DOMPurify 설정

- 훅으로 `target="_blank"`에 `rel="noopener noreferrer"`를 붙이는가
- `ALLOWED_TAGS`/`ALLOWED_ATTR`를 임의로 넓혀 `on*` 이벤트 속성이나 `javascript:` URL을 허용하고 있지 않은가
- `iframe`·`script`·`style` 허용 여부를 명시적으로 통제하는가

## 4. CDN

```bash
grep -n 'cdn\|unpkg\|jsdelivr\|cdnjs' *.html
```
- **버전이 고정**되어 있는가 (`@latest`는 공급망 위험 + 예고 없는 파괴적 변경)
- SRI 해시를 넣었다면 **정확한 값인지** 확인한다. 틀린 해시는 로딩을 통째로 막는다 — 확신 없으면 넣지 않는 것이 낫다

## 5. 관리자 모드 오해 방지

`js/admin.js`를 읽고 확인:
- 코드 주석에 **"보안 장치가 아니라 UI 노출 스위치"**라고 명시되어 있는가
- 비밀번호·토큰처럼 보이는 것을 클라이언트에 두고 "보호된다"고 표현하고 있지 않은가 (정적 사이트에서 클라이언트 비밀은 전부 공개다)
- 관리자가 아닐 때 `[data-admin-only]`가 **DOM에서 제거**되는가, CSS로만 숨기는가 (CSS만이면 개발자도구로 바로 보인다 — 기능상 문제는 없지만 오해 소지)

## 6. 개인정보

```bash
grep -rniE '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|localStorage\.setItem' js/ posts/
```
- 커밋될 파일에 이메일·실명·비공개 URL이 들어 있지 않은가 (공개 저장소가 된다)
- localStorage에 민감 정보를 저장하고 있지 않은가

## 보고

치명/중대/경미 순. `파일:줄` + **공격 시나리오**(어떤 입력이 어디로 들어가 무엇이 실행되는가) + 수정안.
"위험할 수도 있다"는 표현 대신, 재현 가능한 경로가 있으면 치명, 없으면 그렇게 적는다.
