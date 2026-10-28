---
name: serve
description: 로컬 에디터 서버(FastAPI, Docker)를 켜고 끄고 상태를 본다. 저장이 커밋·푸시까지 하므로 켤 때 커밋 신원과 푸시 자격(gh auth token)을 함께 확인한다. "서버 켜줘", "docker compose up", "저장 서버", "에디터 서버 상태" 요청에서 사용한다. start.ps1 미리보기(/preview)와 같은 기본 5500 포트를 쓰므로 둘 중 하나만 켠다. 5500이 다른 프로그램에 막힌 PC에서는 호스트 포트만 BLOG_HOST_PORT로 바꾼다.
---

# /serve — 로컬 에디터 서버

규약은 `docs/api.md`. 코드는 `server/`(pm-integrator 소유). Docker Desktop이 켜져 있어야 한다.

## 0. 첫 기동 전 — 커밋 신원 + 푸시 자격 (건너뛰지 않는다)

자동 커밋(api.md §2-1)이 기본으로 켜져 있지만, **신원이 없으면 저장할 때마다 커밋이 건너뛰어진다** — 저장은 되고 응답은 `git.committed:false, reason:"커밋 신원 없음"`. 그러면 덮어쓴 글을 되돌릴 이력이 없다(meeting-08 D2). 컨테이너는 호스트의 **전역** git 설정을 못 본다.

```bash
P="C:/study-Blog"
( cd "$P" && git config --local --get user.name; git config --local --get user.email )   # 저장소 로컬 설정
( cd "$P" && grep -E '^BLOG_GIT_(NAME|EMAIL)=' .env 2>/dev/null )                         # 또는 .env
```
둘 다 비어 있으면 **사용자에게 묻고**(에이전트가 이메일을 지어내지 않는다) 둘 중 하나로 한 번 적는다:
```bash
# (가) 저장소 로컬 설정 — 호스트의 git과 컨테이너가 함께 본다
cd "$P" && git config user.name "<이름>" && git config user.email "<커밋에 쓰는 이메일>"
# (나) .env (프로젝트 루트, .gitignore됨 · 정적 서빙 허용 목록 밖이라 /.env는 404 — api.md §1)
BLOG_GIT_NAME=<이름>
BLOG_GIT_EMAIL=<커밋에 쓰는 이메일>
```
- 2026-10-28 현재 이 저장소 로컬 설정에 신원이 있다(`solmin6320` / `solmin6320@gmail.com`). `.env`는 없다.

### 0-1. 푸시 자격 (v1.3 — 저장이 푸시까지 한다)

저장이 성공하면 서버가 `origin <현재 브랜치>`로 푸시한다(`docs/api.md` §2-1-1). 자격은 `BLOG_GIT_TOKEN` env 하나뿐이고 **파일에 적지 않는다.**

```bash
gh auth status                      # "Logged in to github.com account …" + scope 에 repo
gh auth token >/dev/null && echo "토큰 있음(값은 찍지 않는다)" || echo "없음 — gh auth login"
```
- `start.bat`으로 켜면 토큰을 자동으로 넘긴다. **직접 `docker compose`로 켤 때는 직접 넘겨야 한다**(아래 2) — 안 넘기면 저장은 되고 응답에 `pushed:false, pushReason:"푸시 자격 없음"`이 붙는다.
- 토큰을 콘솔·로그·보고서에 찍지 않는다. `.env`에 적는 길은 열려 있지만 **비권장**(평문으로 디스크에 남는다).
- 끄려면 `.env`에 `BLOG_AUTO_COMMIT=0`. `.env`를 바꾼 뒤에는 `docker compose up -d`로 재기동(환경 변수는 기동 때 읽힌다).

## 켜기

### 1) 포트 판정 — 켜기 전에

호스트 포트는 `BLOG_HOST_PORT`(기본 5500, `.env` 또는 환경 변수 — `docs/api.md` §0 "바인딩"). 컨테이너 안은 늘 5500이다.

```bash
docker info >/dev/null 2>&1 || echo "Docker Desktop이 꺼져 있음 — 켜고 다시"
docker compose port editor 5500    # 이미 떠 있으면 127.0.0.1:<호스트 포트>가 나온다 → 켜지 말고 그 주소를 쓴다
netstat -ano | grep ':5500 .*LISTENING'   # 비어 있으면 5500을 쓴다
```
5500에 누가 있으면 PID로 주인을 본다: `tasklist //FI "PID eq <PID>"`.
- `powershell` → start.ps1 잔재. 끄고(`Stop-Process -Id <PID> -Force`) 5500으로.
- `com.docker.backend` → 이 프로젝트의 이전 컨테이너. 위 `docker compose port`로 확인하거나 `docker compose down`.
- 그 밖의 프로그램(예: **Oracle XE의 `tnslsnr.exe`** — EM Express가 `127.0.0.1:5500`을 자동 시작으로 잡는다) → **끄지 않는다.** 호스트 포트만 바꾼다:
  `netstat -ano | grep ':550[1-9] .*LISTENING'`로 빈 포트를 골라 `BLOG_HOST_PORT=5501 docker compose up -d`(한 번만), 또는 `.env`에 `BLOG_HOST_PORT=5501`(계속).
  `start.bat`은 이 판정을 스스로 한다 — 5500이 막혀 있으면 5501~5509 중 빈 포트를 골라 넘기고 콘솔에 주소를 찍는다.

### 2) 기동

```bash
BLOG_GIT_TOKEN=$(gh auth token 2>/dev/null) docker compose up -d --build   # 토큰을 환경 변수로만 넘긴다(에코 금지)
# 첫 실행은 이미지 빌드(1~2분). 이후는 수 초. 포트를 바꿨으면 앞에 BLOG_HOST_PORT=<포트>
PORT=$(docker compose port editor 5500 | sed 's/.*://')   # 실제 호스트 포트
curl -s http://localhost:$PORT/api/health
```
기대: `{"ok":true,"version":"1.2.0"}` — 수 ms. `git` 상태를 보려면 `curl -s "http://localhost:$PORT/api/health?git=1"`(느릴 수 있음).
사용자에게 알리는 주소도 `http://localhost:$PORT/`다(5500이라고 가정하지 않는다).
첫 저장 뒤 응답(또는 에디터 상태줄)에 `커밋 abc1234`와 **푸시 결과**가 붙는지 본다.
- `커밋 실패: 커밋 신원 없음` → §0. `푸시 자격 없음` → §0-1(토큰을 넘기지 않고 켰다). `원격이 앞서 있음` → `/sync` 뒤 다시 저장.
- 확인은 `git -C "$P" log --oneline -1`과 `git -C "$P" status -sb`(`ahead` 0이면 올라간 것).

- 사용자가 직접 글을 쓸 때는 `-d` 없이 `docker compose up`(포그라운드) → `Ctrl+C`로 끝.
- `server/*.py`를 고쳤으면 `docker compose restart`(코드는 볼륨 마운트라 재빌드 불필요). `requirements.txt`를 바꿨을 때만 `--build`.

## 상태·로그

```bash
docker compose ps
docker compose logs -f --tail 50   # 요청 로그. Ctrl+C로 로그만 끊긴다(서버는 계속)
```

## 끄기 — 반드시

```bash
docker compose down
netstat -ano | grep ":$PORT .*LISTENING"   # 비어 있어야 끝난 것($PORT = 기동 때 확인한 호스트 포트. 5500이 Oracle 같은 남의 것이면 5500은 계속 차 있는 게 정상)
```

## 포트 충돌

| 증상 | 처리 |
|---|---|
| `port is already allocated` / `bind: address already in use` | `netstat -ano \| grep :5500` → PID가 `powershell`이면 start.ps1 잔재 → `Stop-Process -Id <PID> -Force`. `com.docker.backend`면 이전 컨테이너 → `docker compose down` |
| `/api/health`가 텍스트 404 | 5500에 뜬 것이 start.ps1이다(저장 API 없음). 끄고 다시 |
| 5500 PID가 `tnslsnr`(Oracle XE EM Express) · 브라우저 `localhost:5500`이 Oracle 로그인/오류 화면 · compose가 5500을 못 잡음 | Oracle 리스너(서비스 `OracleOraDB21Home1TNSListener`, 자동 시작)가 `127.0.0.1:5500`을 점유. **Oracle은 건드리지 않는다** — `BLOG_HOST_PORT=5501 docker compose up -d`(또는 `.env`), 주소는 `http://localhost:5501/`. `start.bat`은 자동으로 5501~5509를 고른다 |
| `docker: error during connect` | Docker Desktop이 안 켜짐. 켜고 `docker info`가 되면 재시도 |
| Docker Desktop 오류창 "sailor-ingest.sock … cannot be accessed" | Docker Desktop 자체의 stale 소켓(2026-09-21 발생). `%LOCALAPPDATA%Docker
un`의 `sailor-ingest.sock*`이 안 지워지면 **재부팅**. 프로젝트와 무관 — 사용자에게 알린다 |

## 하지 않는 것

- 서버는 **글 저장이 만든 커밋만** 푸시한다(v1.3). 코드·문서처럼 에디터 밖에서 바꾼 것은 사람이 `/ship`으로 올린다 — 서버가 `git add`로 쓸어 담는 일은 없다.
- 토큰을 `.env`·`docker-compose.yml`·로그·보고서에 적지 않는다. `docker inspect`로 보이는 것(컨테이너 env)까지가 경계다.
- 포트를 바꿀 때는 **호스트 포트만** 바꾼다(`BLOG_HOST_PORT`). 컨테이너 안 5500(`BLOG_PORT`, 매핑 오른쪽)은 불변 — 에디터는 같은 origin(상대 경로 `/api/...`)으로 부르고 Host 검사는 포트를 안 보므로 호스트 포트가 달라도 동작은 같다.
