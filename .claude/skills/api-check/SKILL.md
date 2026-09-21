---
name: api-check
description: 로컬 에디터 서버의 저장 API를 픽스처 글로 왕복 검증한다(헬스 → PUT → GET → DELETE → 자동 커밋 확인 → 흔적 0). "API 확인", "저장 서버 테스트", "서버 검증" 요청과 server/ 를 고친 뒤에 사용한다. /fixture v2 규칙(샌드박스 클론)을 따른다.
---

# /api-check — 저장 API 왕복 검증 (v2, 2026-09-21)

전제: Docker Desktop이 떠 있다(`docker info`). pm-integrator/오케스트레이터만 돌린다(Docker 서버는 한 대, 5500).
규약은 `docs/api.md` v1.1. 스크립트는 세션 스크래치패드에 두고 프로젝트에 남기지 않는다.

## 0. 샌드박스 클론 — 프로젝트 이력에 커밋을 남기지 않기 위해

자동 커밋(B-1)이 켜져 있어 PUT·DELETE마다 커밋이 생긴다. 프로젝트를 마운트하면 검증 커밋이 사용자 이력에 섞이므로 **클론을 마운트**한다.
(`/fixture` §5의 "프로젝트 `posts/`에 `_tmp-pm`" 예외는 이 방식으로 대체됐다 — 클론도 호스트 파일이라 bind mount 반영은 똑같이 검증된다.)

```bash
P="C:/Users/user/Downloads/기술 블로그/기술 블로그"
S="<내 스크래치패드>/sandbox-api"
rm -rf "$S" && git clone --quiet "$P" "$S"
( cd "$P" && tar --exclude=.git --exclude='posts/_tmp*' --exclude='*.bak*' -cf - . ) | ( cd "$S" && tar -xf - )   # 미커밋 server/* 포함
( cd "$S" && git add -A . )          # 클론의 index를 작업 트리와 맞춘다(autocrlf 스탯 착시 제거)
netstat -ano | grep :5500            # 비어 있어야 한다(start.ps1·프로젝트 compose 모두 꺼짐)
cd "$S" && BLOG_GIT_NAME=pm-check BLOG_GIT_EMAIL=pm@check.local docker compose --project-directory "$S" -p blog-editor-test up -d
```
`-p blog-editor-test`로 프로젝트 compose(`blog-editor`)와 이름을 가른다. `container_name: blog-editor`가 같으므로 프로젝트 쪽이 떠 있으면 먼저 내린다.

## 1. 헬스 (api.md §2)

```bash
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:5500/api/health   # 200, 0.1s 미만
curl -s http://localhost:5500/api/health              # {"ok":true,"version":"1.1.0"} — git 필드 없음
curl -s 'http://localhost:5500/api/health?git=1'      # git.branch·dirty 추가
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example:5500' http://localhost:5500/api/health   # 400 bad_host
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5500/server/app.py    # 404 (감춘 경로)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5500/docs/api.md      # 404
```

## 2. 분류 → 글 PUT (분류가 먼저) — 자동 커밋 확인

```bash
D=$(date +%F); ID="$D-tmp-pm-a"
curl -s -X PUT http://localhost:5500/api/categories -H 'Content-Type: application/json' \
  -d '{"categories":[{"slug":"_tmp-pm","name":"확인용(pm)","description":"","order":0}]}'
curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\",\"title\":\"CSS Grid 메모\",\"summary\":\"확인용\",\"created\":\"2000-01-01T00:00:00+09:00\",\"updated\":\"\",\"tags\":[\"css\",\"layout\"],\"category\":\"_tmp-pm\",\"pinned\":false,\"body\":\"## 시작\n\ngrid-template-columns 정리.\"}"
```
확인:
- 응답 `isNew:true`, `path:"posts/_tmp-pm/<id>.md"`, `meta.created`가 **오늘**(2000-01-01 무시), **`git.committed:true`·`hash` 7자**.
- `cat "$S/posts/_tmp-pm/$ID.md"` — frontmatter 8줄 순서 `id, title, summary, created, updated, tags, category, pinned`, `tags: [css, layout]`, 끝 개행 1개.
- `cd "$S" && git log --oneline -1` → `글: CSS Grid 메모 (<id>)`. `git show --stat HEAD` → **`posts/` 파일만**(categories.json·index.json·.md). 다른 스테이징 변경(§0의 `git add -A`)이 커밋에 섞이지 않았는지.
- **CRLF**: `git status --short posts/` 빈 출력, `git show HEAD -- posts/index.json | grep -c $'\r'` → 0.

## 3. 두 번째 PUT — created 불변

같은 id로 `title`만 바꿔 다시 PUT. `meta.created`가 1차와 같고 `meta.updated`만 바뀌어야 한다. 다르면 **절대 규칙 4 위반, 치명**. 커밋이 하나 더 생긴다.
`title`도 그대로 다시 PUT하면 파일은 바뀌므로(updated) 또 커밋된다 — "변경 없음"(`git.committed:false, reason: 커밋할 변경이 없습니다`)은 나오지 않는 것이 정상.

## 4. 오류 — 규칙 일치·안전장치

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X PUT http://localhost:5500/api/posts/../x -H 'Content-Type: application/json' -d '{}'   # 400 또는 404
curl -s -X PUT "http://localhost:5500/api/posts/$D-tmp-pm-b" -H 'Content-Type: application/json' -d '{"title":"","body":"x"}'        # 400 bad_request
curl -s -X PUT "http://localhost:5500/api/posts/$D-tmp-pm-b" -H 'Content-Type: application/json' -d '{"title":"t","body":"b","category":"index"}'  # 400 bad_category
curl -s -X DELETE http://localhost:5500/api/posts/no-such-post                                                                        # 404
# 폴더 어긋남(M4-2 ②): index는 _tmp-pm인데 파일을 _uncategorized로 옮긴 뒤 PUT → 409 "index.json은 … 실제 파일은 …"
mkdir -p "$S/posts/_uncategorized" && mv "$S/posts/_tmp-pm/$ID.md" "$S/posts/_uncategorized/" && curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' -d "{\"title\":\"t\",\"body\":\"b\",\"category\":\"_tmp-pm\"}"; mv "$S/posts/_uncategorized/$ID.md" "$S/posts/_tmp-pm/"
# 대소문자(§6-1): 같은 폴더에 대문자 사본을 두고 PUT → 409 "대소문자만 다른 파일"
cp "$S/posts/_tmp-pm/$ID.md" "$S/posts/_tmp-pm/${ID^^}.md" && curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' -d "{\"title\":\"t\",\"body\":\"b\",\"category\":\"_tmp-pm\"}"; rm "$S/posts/_tmp-pm/${ID^^}.md"
```

## 5. DELETE → 정리 — 세 줄이 전부 통과해야 끝

```bash
curl -s -X DELETE "http://localhost:5500/api/posts/$ID"     # ok:true, removed:[…], git.committed:true ("글 삭제: …")
cd "$S" && docker compose -p blog-editor-test down
netstat -ano | grep :5500                                   # 비어 있어야 한다
rm -rf "$S"                                                 # 클론 삭제 = 검증 커밋도 함께 사라진다
cd "$P" && git status --short posts/ && ls posts/           # 빈 출력, _tmp* 없음 — 프로젝트는 처음부터 손대지 않았다
```

보고에 `git status --short posts/`가 비어 있음과 `posts/`에 `_tmp*`가 없음을 적는다. 결과는 `docs/api.md` §5 표에 날짜·기준·결과 한 줄로 남긴다.
