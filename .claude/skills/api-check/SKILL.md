---
name: api-check
description: 로컬 에디터 서버의 저장 API를 픽스처 글로 왕복 검증한다(헬스 → PUT → GET → DELETE → posts/ 흔적 0). "API 확인", "저장 서버 테스트", "서버 검증" 요청과 server/ 를 고친 뒤에 사용한다. /fixture 규칙을 따른다.
---

# /api-check — 저장 API 왕복 검증

전제: `/serve`로 서버가 떠 있다(`docker compose ps`). 검증 글은 `/fixture` 규칙대로 **`_tmp` 분류·`YYYY-MM-DD-tmp-*` id**만 쓴다. 스크립트는 세션 스크래치패드에 두고 프로젝트에 남기지 않는다.

## 0. 백업 (/fixture §1)

```bash
cp posts/index.json posts/index.json.bak && cp posts/categories.json posts/categories.json.bak
```

## 1. 헬스

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5500/api/health      # 200
curl -s http://localhost:5500/api/health                                        # ok:true, git.branch
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5500/server/app.py    # 404 (감춘 경로)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5500/docs/api.md      # 404
```

## 2. 분류 → 글 PUT (분류가 먼저)

```bash
D=$(date +%F)
curl -s -X PUT http://localhost:5500/api/categories -H 'Content-Type: application/json' \
  -d '{"categories":[{"slug":"_tmp","name":"확인용","description":"","order":0}]}'
curl -s -X PUT "http://localhost:5500/api/posts/$D-tmp-a" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$D-tmp-a\",\"title\":\"CSS Grid 메모\",\"summary\":\"확인용\",\"created\":\"2000-01-01T00:00:00+09:00\",\"updated\":\"\",\"tags\":[\"css\",\"layout\"],\"category\":\"_tmp\",\"pinned\":false,\"body\":\"## 시작\n\ngrid-template-columns 정리.\"}"
```
확인:
- 응답 `isNew:true`, `path:"posts/_tmp/<id>.md"`, `meta.created`가 **오늘**(요청의 2000-01-01은 무시됐어야 한다).
- `cat posts/_tmp/$D-tmp-a.md` — frontmatter 8줄이 `id, title, summary, created, updated, tags, category, pinned` 순서, `tags: [css, layout]`, 파일 끝 개행 1개.
- `curl -s http://localhost:5500/api/posts` — 그 id가 들어 있고 `pinned:false`.

## 3. 두 번째 PUT — created 불변

같은 id로 `title`만 바꿔 다시 PUT. `meta.created`가 1차와 같고 `meta.updated`만 바뀌어야 한다. 다르면 **절대 규칙 4 위반, 치명**.

## 4. 오류 4종

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X PUT http://localhost:5500/api/posts/../x -H 'Content-Type: application/json' -d '{}'   # 400 또는 404
curl -s -X PUT "http://localhost:5500/api/posts/$D-tmp-b" -H 'Content-Type: application/json' -d '{"title":"","body":"x"}'          # 400 bad_request
curl -s -X PUT "http://localhost:5500/api/posts/$D-tmp-b" -H 'Content-Type: application/json' -d '{"title":"t","body":"b","category":"index"}'  # 400 bad_category
curl -s -X DELETE http://localhost:5500/api/posts/no-such-post                                                                         # 404
```

## 5. DELETE → 복원 — 세 줄이 전부 통과해야 끝

```bash
curl -s -X DELETE "http://localhost:5500/api/posts/$D-tmp-a"     # ok:true, removed:[…]
rm -rf posts/_tmp && mv posts/index.json.bak posts/index.json && mv posts/categories.json.bak posts/categories.json
git status --short posts/        # 아무것도 안 나와야 한다
```
서버를 이 검증을 위해 켰다면 `/serve` 끄기까지 하고 `netstat -ano | grep :5500`이 비었는지 본다.

보고에 `git status --short posts/`가 비어 있음을 적는다.
