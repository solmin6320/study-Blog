---
name: backup-posts
description: 학습 블로그의 글 데이터를 백업하고 무결성을 검증한다. .md 파일과 index.json의 정합성, 날짜 규칙, 중복 id, 유실된 초안을 점검한다. "백업해줘", "글 확인", "데이터 이상 없나", "초안 남아있어?" 같은 요청에서 사용한다.
---

# 글 데이터 백업 및 무결성 검증

글은 이 프로젝트에서 **유일하게 대체 불가능한 자산**이다. 코드는 다시 만들 수 있지만 사용자가 쓴 글은 아니다.

## 1. 무결성 검증 (백업보다 먼저)

### 개수 일치
```bash
ls posts/*.md | wc -l
grep -o '"id"' posts/index.json | wc -l
```
다르면 **둘 중 하나가 유실**된 것이다. 어느 쪽이 빠졌는지 찾는다:
```bash
for f in posts/*.md; do
  id=$(basename "$f" .md)
  grep -q "\"$id\"" posts/index.json || echo "index.json에 없음: $id"
done
```

### id ↔ 파일명 일치
```bash
for f in posts/*.md; do
  fname=$(basename "$f" .md)
  fid=$(grep -m1 '^id:' "$f" | sed 's/^id:[[:space:]]*//' | tr -d '\r')
  [ "$fname" = "$fid" ] || echo "불일치: 파일=$fname / frontmatter=$fid"
done
```
불일치하면 **그 글은 링크를 눌러도 404가 난다.**

### 날짜 규칙
```bash
grep -H '^created:\|^updated:' posts/*.md
```
- `updated`가 `created`보다 이른 글이 있는가 (논리적 오류)
- 미래 날짜가 있는가
- 형식이 전부 ISO 8601 + `+09:00`인가

### 중복·필수 필드
```bash
grep -h '^id:' posts/*.md | sort | uniq -d          # 중복 id
grep -L '^title:' posts/*.md                         # 제목 없는 글
grep -L '^summary:' posts/*.md                       # 요약 없는 글(목록 카드가 빈다)
```

### JSON 문법
```bash
python -c "import json;json.load(open('posts/index.json',encoding='utf-8'));print('JSON OK')"
```
깨져 있으면 **목록 화면이 통째로 안 뜬다.** 최우선으로 고친다.

## 2. 저장하지 않은 초안 확인

에디터의 임시저장은 localStorage에 있어 **서버(Docker)에 저장하기 전까지는 브라우저 안에만 존재한다.** 파일 내보내기는 v3.9에서 폐지됐다 — 저장 경로는 서버 하나다.
사용자에게 안내할 것: `write.html`을 열어 `.editor-status`가 `.is-dirty`(저장하지 않은 변경)인지 확인하고, 그렇다면 `docker compose up` 뒤 먼저 저장하라고. 브라우저 데이터를 지우면 그 초안은 복구 불가다.

## 3. 백업

```bash
ts=$(date +%Y%m%d-%H%M)
mkdir -p ../blog-backup
cp -r posts "../blog-backup/posts-$ts"
```
**백업은 프로젝트 폴더 밖에 만든다.** 안에 두면 git에 딸려 올라가거나 같이 지워진다.

git을 쓰고 있다면 그 자체가 최고의 백업이다:
```bash
git log --oneline -- posts/ | head
```
커밋이 최신인지 확인하고, 안 되어 있으면 커밋을 권한다.

## 4. 보고

검증 결과를 표로: 글 개수, 발견된 문제, 백업 위치.
**문제가 없으면 "문제 없음"이라고 명확히 적는다.** 검증하지 않은 항목은 "미확인"으로 구분한다.
