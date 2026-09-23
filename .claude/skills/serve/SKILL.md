---
name: serve
description: 로컬 에디터 서버(FastAPI, Docker)를 켜고 끄고 상태를 본다. "서버 켜줘", "docker compose up", "저장 서버", "에디터 서버 상태" 요청에서 사용한다. start.ps1 미리보기(/preview)와 같은 5500 포트를 쓰므로 둘 중 하나만 켠다.
---

# /serve — 로컬 에디터 서버

규약은 `docs/api.md`. 코드는 `server/`(pm-integrator 소유). Docker Desktop이 켜져 있어야 한다.

## 0. 첫 기동 전 — 커밋 신원 확인 (건너뛰지 않는다)

자동 커밋(api.md §2-1)이 기본으로 켜져 있지만, **신원이 없으면 저장할 때마다 커밋이 건너뛰어진다** — 저장은 되고 응답은 `git.committed:false, reason:"커밋 신원 없음"`. 그러면 덮어쓴 글을 되돌릴 이력이 없다(meeting-08 D2). 컨테이너는 호스트의 **전역** git 설정을 못 본다.

```bash
P="C:/Users/user/Downloads/기술 블로그/기술 블로그"
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
- 2026-09-23 현재 이 PC는 둘 다 없다(`git config --local` 빈 출력, `.env` 없음).
- 끄려면 `.env`에 `BLOG_AUTO_COMMIT=0`. `.env`를 바꾼 뒤에는 `docker compose up -d`로 재기동(환경 변수는 기동 때 읽힌다).

## 켜기

```bash
docker info >/dev/null 2>&1 || echo "Docker Desktop이 꺼져 있음 — 켜고 다시"
netstat -ano | grep :5500          # 비어 있어야 한다. start.ps1이 떠 있으면 먼저 끈다(/preview 끝내기)
docker compose up -d --build       # 첫 실행은 이미지 빌드(1~2분). 이후는 수 초
curl -s http://localhost:5500/api/health
```
기대: `{"ok":true,"version":"1.2.0"}` — 수 ms. `git` 상태를 보려면 `curl -s 'http://localhost:5500/api/health?git=1'`(느릴 수 있음).
첫 저장 뒤 응답(또는 에디터 상태줄)에 `커밋 abc1234`가 붙는지 본다. `커밋 실패: 커밋 신원 없음`이면 §0으로 돌아간다.

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
netstat -ano | grep :5500          # 비어 있어야 끝난 것
```

## 포트 충돌

| 증상 | 처리 |
|---|---|
| `port is already allocated` / `bind: address already in use` | `netstat -ano \| grep :5500` → PID가 `powershell`이면 start.ps1 잔재 → `Stop-Process -Id <PID> -Force`. `com.docker.backend`면 이전 컨테이너 → `docker compose down` |
| `/api/health`가 텍스트 404 | 5500에 뜬 것이 start.ps1이다(저장 API 없음). 끄고 다시 |
| `docker: error during connect` | Docker Desktop이 안 켜짐. 켜고 `docker info`가 되면 재시도 |
| Docker Desktop 오류창 "sailor-ingest.sock … cannot be accessed" | Docker Desktop 자체의 stale 소켓(2026-09-21 발생). `%LOCALAPPDATA%Dockerun`의 `sailor-ingest.sock*`이 안 지워지면 **재부팅**. 프로젝트와 무관 — 사용자에게 알린다 |

## 하지 않는 것

- 서버는 `git push`를 하지 않는다. 저장까지만. 공개는 사용자가 호스트에서 `/ship`.
- 5500 외 포트로 띄우지 않는다(에디터는 같은 origin만 본다).
