---
name: api-check
description: 로컬 에디터 서버의 저장 API를 픽스처 글로 왕복 검증한다(헬스 → PUT → GET → DELETE → 자동 커밋 확인 → 흔적 0). "API 확인", "저장 서버 테스트", "서버 검증" 요청과 server/ 를 고친 뒤에 사용한다. /fixture v2 규칙(샌드박스 클론)을 따른다.
---

# /api-check — 저장 API 왕복 검증 (v3, 2026-09-23 — api.md v1.2)

전제: Docker Desktop이 떠 있다(`docker info`). pm-integrator/오케스트레이터만 돌린다(Docker 서버는 한 대, 5500).
규약은 `docs/api.md` v1.2. 스크립트는 세션 스크래치패드에 두고 프로젝트에 남기지 않는다.
**v1.2는 아직 한 번도 실행되지 않았다**(2026-09-23 — Docker·커밋 신원 없음). 첫 실행에서 실패가 나오면 코드 결함일 가능성이 높다 — 결과를 `docs/api.md` §5에 그대로 적는다.

## 0. 샌드박스 클론 — 프로젝트 이력에 커밋을 남기지 않기 위해

자동 커밋(B-1)이 켜져 있어 PUT·DELETE마다 커밋이 생긴다. 프로젝트를 마운트하면 검증 커밋이 사용자 이력에 섞이므로 **클론을 마운트**한다.
(`/fixture` §5의 "프로젝트 `posts/`에 `_tmp-pm`" 예외는 이 방식으로 대체됐다 — 클론도 호스트 파일이라 bind mount 반영은 똑같이 검증된다.)

```bash
P="C:/Users/user/Downloads/기술 블로그/기술 블로그"
S="<내 스크래치패드>/sandbox-api"     # 이 이름 하나 — pm/오케스트레이터 중 한 명만 돌린다. /fixture §0의 sandbox-<에이전트 이름>은 건드리지 않는다
case "$S" in */sandbox-api) ;; *) echo "경로 확인: $S"; exit 1;; esac
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
curl -s http://localhost:5500/api/health              # {"ok":true,"version":"1.2.0"} — git 필드 없음
curl -s 'http://localhost:5500/api/health?git=1'      # git.branch·dirty 추가
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example:5500' http://localhost:5500/api/health   # 400 bad_host
# 정적 허용 목록(api.md §1) — 전부 404
touch "$S/.env"; mkdir -p "$S/posts/_tmp-pm" && touch "$S/posts/_tmp-pm/.x.tmp"
for u in /server/app.py /docs/api.md /.git/HEAD /.env /.ENV /Dockerfile /docker-compose.yml /Server/app.py /CSS/tokens.css /posts/_tmp-pm/.x.tmp /css/; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:5500$u")" "$u"; done
rm -f "$S/.env" "$S/posts/_tmp-pm/.x.tmp"
# 허용 — 전부 200
for u in / /index.html /write.html /css/tokens.css /js/store.js /posts/index.json /.nojekyll; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:5500$u")" "$u"; done
```

## 2. 분류 → 글 PUT (분류가 먼저) — 자동 커밋 확인

```bash
D=$(date +%F); ID="$D-tmp-pm-a"
( cd "$S" && git commit -qm "check base" )   # §0의 git add -A를 먼저 굳힌다 — 이후 커밋 파일 목록을 깨끗하게 보려고
echo "손편집" >> "$S/posts/java/2026-09-21-note-125149.md"   # 사본의 실제 글을 "손으로 고치는 중" 상태로 — 커밋에 섞이면 안 된다
curl -s -X PUT http://localhost:5500/api/categories -H 'Content-Type: application/json' \
  -d '{"categories":[{"slug":"_tmp-pm","name":"확인용(pm)","description":"","order":0}]}'
( cd "$S" && git log --oneline -1 && git show --stat --format= HEAD )   # "분류 추가: _tmp-pm", posts/categories.json 하나만
curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\",\"title\":\"CSS Grid 메모\",\"summary\":\"확인용\",\"created\":\"2000-01-01T00:00:00+09:00\",\"updated\":\"\",\"tags\":[\"css\",\"layout\"],\"category\":\"_tmp-pm\",\"pinned\":false,\"ifNew\":true,\"body\":\"## 시작\n\ngrid-template-columns 정리.\"}"
```
확인:
- 응답 `isNew:true`, `path:"posts/_tmp-pm/<id>.md"`, `meta.created`가 **오늘**(2000-01-01 무시), **`git.committed:true`·`hash` 7자**.
- `cat "$S/posts/_tmp-pm/$ID.md"` — frontmatter 8줄 순서 `id, title, summary, created, updated, tags, category, pinned`, `tags: [css, layout]`, 끝 개행 1개.
- `cd "$S" && git log --oneline -1` → `글: CSS Grid 메모 (<id>)`. `git show --stat --format= HEAD` → **정확히 두 파일**(`posts/_tmp-pm/<id>.md`·`posts/index.json`). `categories.json`은 앞의 분류 커밋에 이미 들어갔고, **손편집한 `posts/java/…md`는 없어야 한다**(v1.2 D25). `git status --short` → ` M posts/java/2026-09-21-note-125149.md`만 남는다.
- **CRLF**: 커밋된 파일에 대해 `git status --short -- posts/_tmp-pm posts/index.json` 빈 출력, `git show HEAD -- posts/index.json | grep -c $'\r'` → 0.
- 신원 없는 경우도 한 번: `BLOG_GIT_NAME`·`EMAIL` 없이 재기동해 PUT → `git.committed:false`, `reason:"커밋 신원 없음"`(**60자 이하**), `detail`에 해결 방법.

## 3. 두 번째 PUT — created 불변

같은 id로 `title`만 바꿔 다시 PUT — 이번엔 수정 모드처럼 `"expectedUpdated":"<1차 응답 meta.updated>"`를 싣는다. `meta.created`가 1차와 같고 `meta.updated`만 바뀌어야 한다. 다르면 **절대 규칙 4 위반, 치명**. 커밋이 하나 더 생긴다.
`title`도 그대로 다시 PUT하면 파일은 바뀌므로(updated) 또 커밋된다 — "변경 없음"(`reason:"커밋할 변경 없음"`)은 나오지 않는 것이 정상.

## 3-1. 덮어쓰기 차단 (v1.2 — meeting-08 D1 재현)

```bash
# ① 같은 날 "Java 정리" → "Java 복습": 에디터 자동 id가 둘 다 "$D-java"가 되는 경우
curl -s -X PUT "http://localhost:5500/api/posts/$D-java" -H 'Content-Type: application/json' -d '{"title":"Java 정리","body":"a","category":"_tmp-pm","ifNew":true}'   # 200 isNew:true
curl -s -X PUT "http://localhost:5500/api/posts/$D-java" -H 'Content-Type: application/json' -d '{"title":"Java 복습","body":"b","category":"_tmp-pm","ifNew":true}'   # 409 code:"exists", via:"new", title:"Java 정리", path:"posts/_tmp-pm/<D>-java.md"
grep -c 'Java 정리' "$S/posts/_tmp-pm/$D-java.md"     # 1 — 첫 글이 그대로
# ② 다른 폴더·대소문자만 다른 파일도 exists: 등록 안 된 폴더에 사본을 두고 ifNew
mkdir -p "$S/posts/zz-unreg" && cp "$S/posts/_tmp-pm/$ID.md" "$S/posts/zz-unreg/$D-tmp-pm-c.md"
curl -s -X PUT "http://localhost:5500/api/posts/$D-TMP-PM-C" -H 'Content-Type: application/json' -d '{"title":"t","body":"b","category":"_tmp-pm","ifNew":true}'   # 409 exists (대소문자 무시, 미등록 폴더까지)
rm -rf "$S/posts/zz-unreg"
# ③ 수정 중 id를 기존 글 id로 바꾸기 → 409 exists, via:"rename". 두 글 모두 그대로, created 섞이지 않음
curl -s -X PUT "http://localhost:5500/api/posts/$D-java" -H 'Content-Type: application/json' -d "{\"title\":\"t\",\"body\":\"b\",\"category\":\"_tmp-pm\",\"previousId\":\"$ID\"}"
# ④ stale: 다른 곳에서 먼저 저장한 뒤 옛 expectedUpdated로 저장 → 409 stale, currentUpdated = 지금 값
OLD=$(grep '^updated:' "$S/posts/_tmp-pm/$ID.md" | awk '{print $2}'); sleep 1
curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' -d "{\"title\":\"다른 탭\",\"body\":\"x\",\"category\":\"_tmp-pm\",\"expectedUpdated\":\"$OLD\"}"   # 200
curl -s -X PUT "http://localhost:5500/api/posts/$ID" -H 'Content-Type: application/json' -d "{\"title\":\"이 탭\",\"body\":\"y\",\"category\":\"_tmp-pm\",\"expectedUpdated\":\"$OLD\"}"    # 409 stale
# ⑤ 형식 오류: ifNew + previousId → 400 bad_request · ifNew:"yes" → 400
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "http://localhost:5500/api/posts/$D-tmp-pm-d" -H 'Content-Type: application/json' -d "{\"title\":\"t\",\"body\":\"b\",\"ifNew\":true,\"previousId\":\"$ID\"}"
```
각 409 뒤에 `git -C "$S" log --oneline -1`이 바뀌지 않았는지(거절은 커밋도 없다), 대상 파일이 그대로인지 본다. `$D-java`는 §5에서 함께 지운다.

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
curl -s -X DELETE "http://localhost:5500/api/posts/$ID"     # ok:true, removed:[…], git.committed:true ("글 삭제: …"), show --stat = 그 .md + index.json
curl -s -X DELETE "http://localhost:5500/api/posts/$D-java"
cd "$S" && docker compose -p blog-editor-test down
netstat -ano | grep :5500                                   # 비어 있어야 한다
rm -rf "$S"                                                 # 클론 삭제 = 검증 커밋도 함께 사라진다
cd "$P" && git status --short posts/ && ls posts/           # 빈 출력, _tmp* 없음 — 프로젝트는 처음부터 손대지 않았다
```

보고에 `git status --short posts/`가 비어 있음과 `posts/`에 `_tmp*`가 없음을 적는다. 결과는 `docs/api.md` §5 표에 날짜·기준·결과 한 줄로 남긴다.
