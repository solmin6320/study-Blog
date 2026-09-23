---
name: round-start
description: 개발 라운드를 시작한다. 회의록이나 사용자 지시를 web-designer → frontend-dev·frontend-dev-2 순으로 파일 충돌 없이 배분하고 병렬 투입한다. "라운드 시작", "개선안대로 개발해", "이거 고쳐줘"(여러 파일에 걸칠 때) 요청에서 사용한다.
---

# /round-start — 개발 라운드

## 원칙

- **프롬프트는 짧게.** 읽을 파일·소유권·픽스처·서버·보고 형식은 에이전트 정의(`.claude/agents/*.md`)의 "작업 규칙"에 있다. 프롬프트에 다시 쓰지 않는다.
- 프롬프트에 넣는 것은 **이 라운드에서 할 일**뿐: 사용자 원문 인용(왜 하는지) + 항목 목록 + 계약서 절 번호 + 다른 에이전트와의 접점(함수 이름·시그니처를 내가 정해서 양쪽에 똑같이).
- **메인 세션도 이 절차를 따른다.** 에이전트를 거치지 않고 직접 고치거나 한 에이전트만 투입할 때도 0단계 게이트는 같다(CLAUDE.md 규칙 6). v4.2 에디터 동작과 푸터 옛 줄이 이 우회로 계약 없이 들어왔다(meeting-08 D6).

## 순서

0. **게이트 질문 — "사용자에게 보이는 것, 또는 입력의 결과가 바뀌는가?"**
   클래스·DOM 구조만이 아니다: 화면 문구(토스트·상태줄·안내문·오류 문장) · 키 동작(단축키·Enter/Tab/괄호) · 저장 키(localStorage) · 입력 → 결과(렌더·저장 결과)가 하나라도 바뀌면 **예**.
   **예** → 1단계(web-designer 선행). **아니오**(순수 리팩터링·성능·서버 내부)일 때만 1단계를 건너뛴다 — 그 판단을 프롬프트 첫 줄에 적는다.
1. **계약서 개정** → `web-designer` 먼저(계약서 + CSS). `run_in_background: true`로 띄우고 완료 알림을 기다린다. 개발자는 계약서 없이는 시작 못 한다.
   - **계약서는 끝까지 읽힌다.** 3,000줄이 넘어 Read 기본 2,000줄로는 §6-2 금지 문장·§12 작업표·§13 이력이 잘린다. 에이전트 정의의 작업 규칙 1(offset 분할)을 믿되, 결과 보고에 "읽은 절"이 없으면 되묻는다.
2. **회의 지시 ↔ 작업표 대조.** web-designer가 옮긴 §12 작업표를 회의록 "다음 라운드 작업 지시"와 **항목 단위로 대조**한다. 작업표에 없는 지시는 이행자가 ✔로 볼 수 없어 "완료"와 구별되지 않는다(meeting-08 R-G: meeting-07:122 → #124에서 한 줄이 빠졌다). 빠진 게 있으면 designer에게 되돌린다.
3. web-designer 보고에서 **"개발자가 할 일"** 부분을 그대로 개발자 프롬프트에 붙인다. 요약하지 말 것 — 클래스명·줄 번호가 정확해야 한다.
4. `frontend-dev`와 `frontend-dev-2`를 **한 메시지에 두 Agent 호출**로 병렬 투입. 둘 사이에 함수 의존이 있으면(예: store export ↔ editor 소비) 시그니처를 내가 정해 양쪽에 똑같이 적는다. 서버 규약이 바뀌었으면 `docs/api.md` 절 번호를 frontend-dev-2 프롬프트에 넣는다.
5. 둘 다 끝나면 `/preview`로 직접 확인 → `/ship`.
6. 끊긴 에이전트는 `/resume-agent`.

## 소유권 (이걸 어기면 서로 덮어쓴다 — 진실은 CLAUDE.md 4인 표)

| 에이전트 | 수정 가능 | 포트 |
|---|---|---|
| `web-designer` | `docs/contract.md`, `css/*` | 5503 |
| `frontend-dev` | `index.html` `post.html`, `js/{config,util,store,markdown,app,post,theme-init}.js`, `posts/`의 파생 파일 정합성(`index.json`·`categories.json`)만 — **글 본문·frontmatter 값은 사용자 것** | 5501 |
| `frontend-dev-2` | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1` | 5502 |
| `pm-integrator` | `docs/meeting-*.md`, `docs/HANDOFF.md`, `CLAUDE.md`, `server/*`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `docs/api.md`, `.claude/**` | 5500 |

## 프롬프트 뼈대

```
사용자 원문: "…"
게이트: 예(문구 2곳·키 동작 1개 바뀜) → 계약서 v4.x §N 기준.

1. (항목) — 파일:위치, 무엇을 어떻게
2. …

다른 에이전트 접점: Blog.store.foo(id, hint) → Promise<post|null>  (양쪽 동일)
```
이 정도면 된다. 200단어를 넘기면 에이전트 정의에 있어야 할 내용이 섞인 것이다.
