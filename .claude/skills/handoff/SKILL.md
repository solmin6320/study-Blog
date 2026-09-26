---
name: handoff
description: 다른 로컬 환경(다른 PC·다른 Claude Code 세션·다른 도구)에서 지금 하던 일을 그대로 이어받게 한다. 가벼운 상태 문서 docs/STATE.md를 매번 갱신하고, 무거운 배경 문서 docs/HANDOFF.md는 구조가 바뀐 라운드에만 손본다. "인수인계", "핸드오프", "다른 PC에서 이어서", "토큰 떨어질 것 같아", "상태 정리해줘", "다른 데서도 추가하게" 요청과 한도 임박 시 사용한다.
---

# /handoff — 두 층 인수인계

인수인계 문서가 무거우면 갱신을 미루고, 미루면 오래돼서 못 믿는다. 그래서 둘로 나눈다.

| 문서 | 무엇 | 언제 갱신 | 비용 |
|---|---|---|---|
| `docs/STATE.md` | **지금 상태** — HEAD, 진행 중 라운드, 누가 어디까지, 다음 한 걸음, 로컬 전용 파일 | **매번** (`/ship` 직전, 한도 임박, 세션 종료) | 30줄, 1~2분 |
| `docs/HANDOFF.md` | **배경** — 프로젝트가 무엇인지, 절대 규칙과 이유, 구조, 데이터 모델, 아키텍처 판단, 다른 도구에서 재현하는 법 | 구조·규칙·소유권이 바뀐 라운드 끝에만 | 길다, 드물게 |

받는 쪽의 시작 순서는 항상 같다: **`/sync` → `docs/STATE.md` → (처음이면) `docs/HANDOFF.md` → `docs/meeting-NN.md` 최신 지시.**

원칙은 그대로다 — **추측 금지, 미완성 숨기지 않기, 수치는 실측, 한국어.**

---

## A. `docs/STATE.md` — 매번 (기본 동작)

인자 없이 `/handoff`를 부르면 이것만 한다.

### A-1. 실측 (이 다섯 줄이면 된다)

```bash
git log --oneline -3 && git status --short && git stash list
ls docs/meeting-*.md | tail -1
find posts -path "*_tmp*" -o -name "*.bak*" | head        # 픽스처 흔적 — 있으면 STATE에 적고 /fixture 복원
git ls-files --others --exclude-standard --ignored -i --exclude-from=.git/info/exclude 2>/dev/null   # 로컬 전용 파일
netstat -ano | grep -E ":(5500|5501|5502|5503|5610)\s.*LISTENING"
```

백그라운드 에이전트가 있으면 **완료 알림·보고서에서** 파일별 완료/미완을 뽑는다. 알림이 없는 에이전트는 `진행 중(보고 없음)`으로 적는다 — 끝났다고 추측하지 않는다.

### A-2. 형식 (그대로 복사해 채운다)

```markdown
# STATE — 지금 상태 (YYYY-MM-DD HH:MM KST)

> 받는 쪽: `/sync` → 이 문서 → `docs/meeting-NN.md` "다음 라운드 작업 지시". 배경은 `docs/HANDOFF.md`.

## 1. 위치
- HEAD: `abc1234 커밋 제목` / origin/main과 동일 여부 / stash: 없음 또는 `stash@{0} 설명 — 버려도 됨/살려야 함`
- 진행 중 라운드: 라운드 N (`docs/meeting-NN.md`), 계약서 vX.Y

## 2. 누가 어디까지 (미커밋 포함)
| 담당 | 끝난 것(파일) | 남은 것(회의록 항목 번호) | 상태 |
|---|---|---|---|
| web-designer | … | … | 완료 / 진행 중 / 보고 없음 / 미투입 |
| frontend-dev | … | … | |
| frontend-dev-2 | … | … | |
| pm-integrator | … | … | |

## 3. 다음 한 걸음 (이것부터)
1. 정확한 명령 또는 스킬. 예: `/resume-agent frontend-dev-2 — meeting-05 #1~#4, #9` / `/round-start …`
2. …

## 4. 사용자 결정 대기
- 없음 / 항목 (meeting-NN "사용자 결정 필요" 번호)

## 5. 이 PC에만 있는 것 (git으로 안 옮겨진다)
| 경로 | 무엇 | 다른 PC에서 |
|---|---|---|
| `.claude/agents/tutor.md`, `.claude/skills/learn/` | 학습 튜터(공개 저장소에 안 올림, `.git/info/exclude`) | 복사해 오고 exclude에 두 줄 다시 추가 |
| `.git/info/exclude` | 위 두 경로 | `printf '.claude/agents/tutor.md\n.claude/skills/learn/\n' >> .git/info/exclude` |
| `posts/*.bak.*`, `posts/_tmp-*` | 픽스처 잔해 | 있으면 `/fixture` 4단계로 지운다 |
| 로컬 서버 | 5610(오케스트레이터) 등 떠 있던 포트 | 새 PC에선 무관 |

## 6. 주의
- 이번 세션에서 알게 된, 다음 사람이 밟을 함정 1~3개 (예: "`animationend`는 버블링하고 `::before`의 것도 호스트 요소에서 온다 — `e.animationName`으로 거른다(v4.4 제목 타자 `title-caret-blink`)")
```

### A-3. 검증 두 가지

1. §3의 첫 줄만 보고 낯선 세션이 **명령 하나로** 착수할 수 있는가. 못 하면 다시 쓴다.
2. §2 표의 "끝난 것"이 `git status`·보고서와 일치하는가. 추측이면 "보고 없음"으로 바꾼다.

STATE.md는 git에 올린다(`/ship`이 함께 커밋). 다른 PC는 `/sync`로 받는다.

---

## B. `docs/HANDOFF.md` — 구조가 바뀐 라운드에만

`/handoff full` 또는 아래 중 하나가 이번 라운드에 있었을 때만:
소유권 표 변경 · 페이지/폴더 추가·삭제(예: `server/` 신설, `about.html` 삭제) · 저장 흐름 변경(예: v3.9 내보내기 폐지) · 데이터 모델 필드 변경 · 절대 규칙 변경 · 새 스킬 묶음.

기존 9절 구조를 유지하되 **바뀐 절만** 고친다. 전체 재작성은 하지 않는다(387줄을 매번 다시 쓰면 아무도 안 고친다). 각 절 머리에 `(실측 YYYY-MM-DD)`를 남겨 어느 절이 오래됐는지 보이게 한다.

§ 8 "다른 환경에서 이어받는 방법"에는 아래 **새 PC 최초 설정** 절이 있어야 한다. 없으면 추가한다.

```markdown
### 새 PC 최초 설정 (10분)

1. `git clone https://github.com/solmin6320/study-Blog.git` → 폴더를 Claude Code로 연다.
2. `.claude/`는 저장소에 있으므로 에이전트 4개·스킬 전부 그대로 동작한다.
3. **로컬 전용 파일**(공개 저장소에 없음)을 이전 PC에서 복사: `.claude/agents/tutor.md`, `.claude/skills/learn/SKILL.md`.
   그리고 `printf '.claude/agents/tutor.md\n.claude/skills/learn/\n' >> .git/info/exclude`
4. 미리보기: `start.bat`(Docker 있으면 저장 서버, 없으면 PowerShell 정적 서버 — **글 저장 불가**, 내보내기는 v3.9에서 폐지). 5500이 막혀 있으면 `.claude/launch.json`의 포트를 바꾼다.
5. 푸시하려면 `gh auth login` 먼저. 루트 `.nojekyll`이 있는지 확인(없으면 Pages에서 `posts/*.md`가 404).
6. Claude Code에서 첫 메시지: `/sync 하고 docs/STATE.md 읽고 이어서 해`
```

---

## C. 한도 임박·세션 종료 때

1. `/handoff`(STATE.md만) → 2. `/ship`(STATE.md 포함 커밋·푸시). 에이전트가 파일을 고치는 중이면 **그 파일은 STATE §2에 "진행 중(미커밋)"으로 적고 커밋에서 뺀다** — 반쯤 고친 파일을 올리면 다음 세션이 그걸 완성본으로 믿는다. 픽스처는 절대 커밋하지 않는다.

## D. 보고

세 줄: `docs/STATE.md` 갱신됨(HEAD·라운드) / HANDOFF.md 손댔는지(어느 절) / 다른 PC 시작 프롬프트 한 줄 —
`/sync 하고 docs/STATE.md 읽고 이어서 해`
