---
name: serve
description: 로컬 에디터 서버(FastAPI, Docker)를 켜고 끄고 상태를 본다. "서버 켜줘", "docker compose up", "저장 서버", "에디터 서버 상태" 요청에서 사용한다. start.ps1 미리보기(/preview)와 같은 5500 포트를 쓰므로 둘 중 하나만 켠다.
---

# /serve — 로컬 에디터 서버

규약은 `docs/api.md`. 코드는 `server/`(pm-integrator 소유). Docker Desktop이 켜져 있어야 한다.

## 켜기

```bash
docker info >/dev/null 2>&1 || echo "Docker Desktop이 꺼져 있음 — 켜고 다시"
netstat -ano | grep :5500          # 비어 있어야 한다. start.ps1이 떠 있으면 먼저 끈다(/preview 끝내기)
docker compose up -d --build       # 첫 실행은 이미지 빌드(1~2분). 이후는 수 초
curl -s http://localhost:5500/api/health
```
기대: `{"ok":true,"version":"1.1.0"}` — 수 ms. `git` 상태를 보려면 `curl -s 'http://localhost:5500/api/health?git=1'`(느릴 수 있음).

- **자동 커밋**(api.md §2-1)이 기본으로 켜져 있다. 커밋 신원은 `.env`(프로젝트 루트, `.gitignore`됨)에 한 번 적는다:
  ```
  BLOG_GIT_NAME=김솔민
  BLOG_GIT_EMAIL=<커밋에 쓰는 이메일>
  ```
  없으면 저장은 되지만 응답 `git.committed:false`(reason: 신원 없음). 끄려면 `.env`에 `BLOG_AUTO_COMMIT=0`. 바꾼 뒤 `docker compose up -d`로 재기동.

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
