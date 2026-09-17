---
name: round-start
description: 개발 라운드를 시작한다. 회의록이나 사용자 지시를 web-designer → frontend-dev·frontend-dev-2 순으로 파일 충돌 없이 배분하고 병렬 투입한다. "라운드 시작", "개선안대로 개발해", "이거 고쳐줘"(여러 파일에 걸칠 때) 요청에서 사용한다.
---

# /round-start — 개발 라운드

## 원칙

- **프롬프트는 짧게.** 읽을 파일·소유권·픽스처·서버·보고 형식은 에이전트 정의(`.claude/agents/*.md`)의 "작업 규칙"에 있다. 프롬프트에 다시 쓰지 않는다.
- 프롬프트에 넣는 것은 **이 라운드에서 할 일**뿐: 사용자 원문 인용(왜 하는지) + 항목 목록 + 계약서 절 번호 + 다른 에이전트와의 접점(함수 이름·시그니처를 내가 정해서 양쪽에 똑같이).

## 순서

1. **구조·클래스가 바뀌는가?** → `web-designer` 먼저(계약서 개정 + CSS). `run_in_background: true`로 띄우고 완료 알림을 기다린다. 개발자는 계약서 없이는 시작 못 한다.
2. web-designer 보고에서 **"개발자가 할 일"** 부분을 그대로 개발자 프롬프트에 붙인다. 요약하지 말 것 — 클래스명·줄 번호가 정확해야 한다.
3. `frontend-dev`와 `frontend-dev-2`를 **한 메시지에 두 Agent 호출**로 병렬 투입. 둘 사이에 함수 의존이 있으면(예: store export ↔ editor 소비) 시그니처를 내가 정해 양쪽에 똑같이 적는다.
4. 둘 다 끝나면 `/preview`로 직접 확인 → `/ship`.
5. 끊긴 에이전트는 `/resume-agent`.

## 소유권 (이걸 어기면 서로 덮어쓴다)

| 에이전트 | 수정 가능 | 포트 |
|---|---|---|
| `web-designer` | `docs/contract.md`, `css/*` | 5503 |
| `frontend-dev` | `index.html` `post.html`, `js/{config,util,store,markdown,app,post}.js`, `posts/*` | 5501 |
| `frontend-dev-2` | `write.html`, `js/{editor,ui,admin}.js`, `start.bat` `start.ps1` | 5502 |
| `pm-integrator` | `docs/meeting-*.md`, `CLAUDE.md`, `docs/HANDOFF.md` | — |

`js/theme-init.js`는 `frontend-dev` 소유로 본다(HTML `<head>`가 부른다).

## 프롬프트 뼈대

```
사용자 원문: "…"
계약서 v3.x §N 기준.

1. (항목) — 파일:위치, 무엇을 어떻게
2. …

다른 에이전트 접점: Blog.store.foo(id, hint) → Promise<post|null>  (양쪽 동일)
```
이 정도면 된다. 200단어를 넘기면 에이전트 정의에 있어야 할 내용이 섞인 것이다.
