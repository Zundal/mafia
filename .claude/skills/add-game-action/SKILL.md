---
name: add-game-action
description: 마피아 게임에 새로운 액션(예: 새 밤 능력, 새 페이즈 전이, 새 투표 규칙)을 추가할 때 사용. 타입 → 순수 로직 → API 디스패처 → 클라이언트 UI의 4계층을 빠짐없이 갱신하도록 안내한다. lib/game-logic.ts·route.ts·types.ts를 건드리는 기능 추가 작업의 체크리스트.
---

# 새 게임 액션 추가

이 프로젝트의 모든 상태 변경은 `POST /api/game`의 `{ action, ...params }` 패턴을 따릅니다. 새 액션을 추가할 때는 **4개 계층을 순서대로** 갱신해야 하며, 하나라도 빠지면 런타임 버그가 됩니다.

## 아키텍처 상기

- **상태 접근은 영속 계층 경유**: `lib/game-store.ts`의 `getGame()/setGame()/clearGame()`. 환경변수가 있으면 Redis, 없으면 인메모리 폴백. 라우트에서 모듈 변수를 직접 들지 말 것 — 변경 후 반드시 `setGame()`(헬퍼 `saveAndRespond`)으로 저장.
- **규칙은 순수 함수로**: 실제 로직은 `lib/game-logic.ts`에, `route.ts`는 디스패치·검증만.
- **타입이 기준**: 상태 형태는 `lib/types.ts`가 정본.
- 사용자 문자열·히스토리 로그는 **한국어**.

## 체크리스트 (순서대로)

### 1. 타입 — `lib/types.ts`
- [ ] 새 페이즈가 필요하면 `Phase` 유니온에 추가.
- [ ] 새 역할이면 `Role` 유니온 + 팀 분류 고려.
- [ ] 액션이 상태에 새 필드를 남기면 `GameState`/`Player`에 필드 추가 (옵셔널로 시작 권장).

### 2. 순수 로직 — `lib/game-logic.ts`
- [ ] 새 규칙을 **순수 함수**로 작성 (입력 `GameState` → 출력 새 `GameState`, 부수효과 없이).
- [ ] 기존 패턴을 따라 `const newState = { ...gameState }` 후 변경.
- [ ] 권한/유효성 가드를 함수 안에서 `throw new Error("한국어 메시지")`로 처리.
- [ ] 상태 변화는 `newState.history.push("...")`로 한국어 서술 로그 남기기.
- [ ] 승패에 영향을 주면 `checkWinCondition`과의 상호작용 확인 (특히 만취객 즉시 승리 우선순위).
- [ ] **투표/추방 로직을 바꾸면** `processVote`(game-logic.ts)와 `advancePhase`(route.ts)의 voting 만료 분기 **두 곳**을 함께 수정 — 현재 추방·승패 판정이 중복돼 있음.
- [ ] **페이즈 타이머**가 필요하면 새 페이즈 진입 시 `phaseEndTime = Date.now() + 지속시간`을 설정하고 `route.ts`의 `PHASE_DURATIONS`에 항목 추가.

### 3. API 디스패처 — `app/api/game/route.ts`
- [ ] `POST`의 `switch (action)`에 새 `case "액션명"` 추가.
- [ ] `if (!gameState)` 가드로 시작 (기존 case들과 동일).
- [ ] POST 진입부에서 `let gameState = await getGame()`로 로드(이미 패턴화돼 있음).
- [ ] params 구조분해 후 로직 함수 호출, `gameState`에 재할당.
- [ ] `try/catch`로 감싸 한국어 에러 메시지 + 적절한 status(검증 400 / 서버 500) 반환.
- [ ] 상태를 변경했으면 `return saveAndRespond(gameState)`로 **저장 후 응답**(읽기 전용/에러 분기는 `NextResponse.json` 그대로).

### 4. 클라이언트 UI — `app/game/page.tsx` (필요 시 다른 페이지)
- [ ] 새 액션을 호출하는 `fetch("/api/game", { method: "POST", body: ... })` 추가.
- [ ] 새 페이즈/상태에 대응하는 렌더 분기 추가.
- [ ] 폴링으로 갱신되는 상태를 UI가 올바르게 반영하는지 확인.
- [ ] 관련 컴포넌트(`VotePanel`, `PhaseIndicator`, `RoleCard`, `MissionCard` 등) 갱신.

## 검증

- [ ] `bunx tsc --noEmit` — 타입 정합성.
- [ ] `bun run lint` — 린트.
- [ ] `bun run build` — 빌드 통과.
- [ ] 가능하면 `game-rules-auditor` 서브에이전트로 규칙 불변식 검수.
- [ ] 인메모리 상태 특성상 dev 서버 재시작/새로고침 시 상태 초기화는 정상 동작임을 기억(버그 아님).

## 흔한 실수

- 타입만 바꾸고 로직/route/UI 전파를 누락 → 런타임에 `undefined`.
- `route.ts`에 인라인으로 규칙을 작성 → 순수 함수로 빼서 `game-logic.ts`에 둘 것.
- 영어 에러 메시지 → 모든 사용자 문자열은 한국어.
- 만취객 승리 조건을 일반 승패 판정 뒤에 두는 실수 → 반드시 먼저 평가.
