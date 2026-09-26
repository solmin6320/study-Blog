---
name: preview
description: 학습 블로그를 로컬에서 띄워 브라우저로 확인한다. start.ps1(PowerShell 서버)을 실행하고, Browser 도구로 화면·콘솔을 보고, 끝나면 종료한다. "실행해줘", "띄워줘", "확인해보자", "화면 보여줘" 요청에서 사용한다.
---

# /preview — 로컬 확인

이 PC에는 Python·Node가 없다. 서버는 **`start.ps1`**(Windows PowerShell의 `HttpListener`) 하나다.

## 띄우기

```powershell
$p = Start-Process -WindowStyle Hidden -FilePath powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','start.ps1','-NoBrowser' -WorkingDirectory "C:\Users\user\Downloads\기술 블로그\기술 블로그" -PassThru; Start-Sleep 2; "PID: $($p.Id)"; (Invoke-WebRequest http://localhost:5500/index.html -UseBasicParsing).StatusCode
```
- 오케스트레이터는 **5500**. 에이전트 포트는 5501~5503(에이전트 정의 참조).
- 5500이 이미 쓰이면 `netstat -ano | grep :5500`으로 PID를 찾고 `tasklist //FI "PID eq <PID>"`로 주인을 본다. `powershell`이면 이전 세션 잔재 → 종료. **그 밖의 프로그램이면 끄지 않는다** — 이 PC(2026-09-26 확인)는 Oracle XE EM Express의 `tnslsnr.exe`(서비스 `OracleOraDB21Home1TNSListener`, 자동 시작)가 `127.0.0.1:5500`을 늘 잡고 있다. 그때는 `start.ps1 -Port <빈 포트>`로 띄우고 아래 URL의 5500도 그 포트로 바꾼다(에이전트 포트 5501~5503과 겹치지 않게). 저장 API까지 보려면 `/serve` — 호스트 포트를 `BLOG_HOST_PORT`로 바꾼다.
- `localhost`로만 응답한다(`127.0.0.1`은 400). 관리자 UI는 hostname이 `localhost`면 자동으로 켜진다 — `?admin=` 쿼리는 v3.0에서 폐기됐다.

## 보기

`mcp__Claude_Browser__preview_start`(url: `http://localhost:5500/index.html`) → 스크린샷 → `read_console_messages`. 확인 순서:
1. 목록 `index.html` — 콘솔 에러 0, CSP 위반 0
2. 상세 `post.html?id=<글 id>` — 글이 없으면 `/fixture`
3. 에디터 `write.html` — 분류 0개여도 `미분류`로 뜬다
4. 테마 토글 한 번, 360px(`resize_window` preset mobile)

좌표 클릭 전엔 반드시 그 화면의 스크린샷을 먼저 찍는다. 화면이 바뀌면 다시 찍는다.

## 안 될 때

| 증상 | 원인 |
|---|---|
| 목록이 "불러오는 중"에서 멈춤 | `posts/index.json` 문법 오류. `git diff posts/` |
| 스타일 없음 | CSS 5개 중 하나 404. `css/animations.css`는 삭제된 파일 — HTML에 링크가 남았는지 |
| 콘솔에 CSP 위반 | 인라인 `<script>`/`<style>`/`style=`/`on*=`가 HTML에 들어감 |
| `Blog.ui.reveal is not a function` 류 | 폐기된 함수 호출이 남음. 계약서 §12 삭제 목록 대조 |
| `write.html`이 "로컬에서만 동작" 문구만 | hostname이 `localhost`가 아님 |

## 끝내기 — 반드시

```powershell
Stop-Process -Id <PID> -Force
```
서버를 켜 둔 채 세션을 끝내면 다음 세션이 "포트 사용 중"으로 시작한다.
