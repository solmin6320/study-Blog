---
name: perf-check
description: 학습 블로그의 로딩·렌더 성능을 점검한다. CDN 로드 전략, 렌더 블로킹, 리플로우 유발 코드, 스크롤 핸들러, 애니메이션 속성, 캐시 전략을 검사한다. "느려", "성능 점검", "최적화", "로딩 개선" 같은 요청에서 사용한다.
---

# 성능 점검

빌드 도구가 없으므로 **번들 최적화 대신 로드 전략과 렌더 비용**이 전부다.

## 1. 스크립트 로드 전략

```bash
grep -n '<script' *.html
```
- 모든 외부 스크립트에 `defer`가 붙었는가 (테마 초기화 인라인 스크립트만 예외)
- highlight.js common 번들은 무겁다. **목록 화면(index.html)에서는 아예 로드하지 않는 것**이 맞다 — 코드블록이 없기 때문이다. 불필요한 로드가 있으면 지적
- 에디터 전용 스크립트가 목록/상세에 로드되고 있는가
- CDN에 `preconnect` 힌트가 있는가

## 2. 렌더 블로킹

- CSS 6개 파일을 순차 로드하면 요청이 6번이다. HTTP/2라 치명적이진 않지만, **critical CSS(tokens+base)를 인라인**하는 선택지를 검토한다
- 폰트: 외부 웹폰트를 쓰지 않는 것이 현재 정책이다. `@import`가 새로 생겼으면 승인 위반이자 성능 결함

## 3. 렌더 비용

```bash
grep -n 'innerHTML\s*+=\|appendChild' js/*.js
grep -n 'offsetTop\|offsetHeight\|getBoundingClientRect\|scrollTop' js/*.js
```
- 루프 안에서 `appendChild`를 반복하는가 → DocumentFragment로 모아 한 번에
- `innerHTML +=` 누적은 매번 전체 재파싱이다. 결함
- 루프 안에서 `getBoundingClientRect`/`offsetTop`을 읽으면 **강제 동기 레이아웃**이 발생한다. 읽기와 쓰기를 분리했는가

## 4. 스크롤·리사이즈 핸들러

```bash
grep -n "addEventListener('scroll'\|addEventListener('resize'" js/*.js
```
- `requestAnimationFrame` 스로틀 또는 `passive:true`가 걸렸는가
- IntersectionObserver로 대체 가능한 것을 스크롤 핸들러로 하고 있는가 (진입 애니메이션, TOC 활성화)

## 5. 애니메이션

```bash
grep -nE 'transition\s*:\s*(all|width|height|top|left|margin|padding)' css/*.css
```
- `transition: all`은 예측 불가능한 비용이다
- 레이아웃 속성(width/height/top/left/margin) 애니메이션은 매 프레임 리플로우. `transform`으로 대체 가능한가
- 상시 실행되는 배경 애니메이션이 GPU를 계속 태우는가 → `will-change`를 남발하지 않되, 큰 blur 레이어의 크기가 과한지 확인

## 6. 데이터 로딩

- 목록 화면이 `index.json`만 읽는가, `.md`를 전부 읽는가 (후자면 치명적)
- 한 번 읽은 글을 메모리 캐시하는가
- 글이 100개가 됐을 때 목록 렌더가 버티는가 — 카드 수가 많아질 때의 대책(점진 렌더 등)이 있는지 검토

## 보고

측정값이 없으므로 **비용이 발생하는 코드 위치**를 `파일:줄`로 지목하고, 예상 영향과 수정안을 적는다. 체감 불가능한 미세 최적화는 제안하지 않는다.
