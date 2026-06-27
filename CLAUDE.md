# CLAUDE.md

이 파일은 [Claude Code](https://claude.com/claude-code)를 비롯한 AI 코딩 에이전트가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**🍷 집들이 미스터리: 깨진 와인병의 비밀** — 6인용 마피아 게임 웹앱입니다.
오프라인 모임(집들이)에서 한 대의 폰을 돌려가며 진행하는 것을 전제로 한 PWA로, **시민 팀 vs 마피아 팀 vs 만취객(개인전)**의 3파전 구조가 핵심 차별점입니다.

- **유형**: Next.js 14 (App Router) 기반 PWA
- **언어**: TypeScript (strict)
- **스타일**: Tailwind CSS
- **배포**: Vercel
- **UI 언어**: 모든 사용자 노출 문자열은 한국어

## 명령어

> ⚠️ `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`에 따라 이 저장소는 **Bun** 사용을 선호합니다. `bun.lock`이 lockfile입니다. (npm 명령도 동작하지만 Bun을 우선하세요.)

```bash
bun install          # 의존성 설치
bun run dev          # 개발 서버 (http://localhost:3000)
bun run build        # 프로덕션 빌드
bun start            # 프로덕션 서버
bun run lint         # ESLint (next lint)
bun run generate-icons   # scripts/generate-icons.js — PWA 아이콘 생성
```

자동화된 테스트 스위트는 아직 없습니다. 변경 후에는 최소한 `bun run build`와 `bun run lint`로 검증하세요.

## 아키텍처

### 디렉터리 구조

```
app/
├── api/
│   ├── game/route.ts      # 게임 상태 단일 진실 공급원 (모든 액션의 진입점)
│   └── missions/route.ts  # 미션 목록 반환
├── components/            # 클라이언트 React 컴포넌트
│   ├── MusicPlayer.tsx
│   ├── ServiceWorkerRegistration.tsx
│   ├── VotePanel.tsx / MissionCard.tsx / PhaseIndicator.tsx / RoleCard.tsx
├── page.tsx               # 메인(로비/방 생성·참여)
├── join/page.tsx          # 참여
├── game/page.tsx          # 게임 진행 화면 (가장 큰 클라이언트 로직, ~850줄)
├── story/page.tsx         # 스토리/규칙 소개
└── layout.tsx             # 루트 레이아웃 + PWA 메타데이터
lib/
├── types.ts               # 핵심 타입 (Role, Phase, GameState, Player 등)
├── roles.ts               # 역할 정의 + roleDistribution(6인 역할 배분)
├── missions.ts            # 히든 미션 문자열 배열
└── game-logic.ts          # 순수 게임 규칙 함수 (상태 머신의 핵심)
public/
├── data/                  # roles.json / missions.json / game-state.json (정적 데이터)
├── icons/, music/         # PWA 아이콘, 배경음악
├── manifest.json, sw.js   # PWA 매니페스트 & 서비스 워커
```

### 상태 관리 — 가장 중요한 점

- **게임 상태는 `app/api/game/route.ts`의 모듈 스코프 변수 `gameState` 하나에만 존재합니다** (`let gameState: GameState | null`). 데이터베이스가 없는 **인메모리 단일 게임** 구조입니다.
- 따라서 **동시에 진행 가능한 게임은 하나뿐**이며, 서버리스 함수 콜드 스타트/재배포 시 상태가 초기화됩니다. 이는 "한 폰을 돌려가며 하는 오프라인 게임"이라는 의도에 부합하는 설계입니다.
- 영속성·멀티룸·동시성이 필요해지면 `route.ts`의 모듈 변수를 외부 스토어(예: Vercel Marketplace의 Redis/Postgres)로 교체해야 합니다. 이 한 곳이 교체 지점입니다.
- 클라이언트(`app/game/page.tsx` 등)는 폴링으로 `GET /api/game`을 호출해 상태를 동기화합니다.

### 핵심 흐름: 액션 디스패치

모든 상태 변경은 `POST /api/game`의 `{ action, ...params }` 패턴으로 이뤄집니다. `route.ts`의 `switch (action)`이 디스패처이고, 실제 규칙은 `lib/game-logic.ts`의 순수 함수가 담당합니다.

| action | 핸들러(lib/game-logic.ts) | 설명 |
|---|---|---|
| `create` | `createGame` | 빈 슬롯 6개로 새 게임 생성 |
| `join` | `joinGame` | 빈 슬롯에 이름 배정, 중복/만석 검증 |
| `startGame` | `startGame` + `assignMissions` | 역할 셔플·배정 + 미션 배정 |
| `startNight` | (route 내부) | night 페이즈 진입, ready 초기화 |
| `nightAction` | `processNightAction` | kill/investigate/protect 등록 |
| `endNight` | `processNightResults` | 능력자 전원 ready 확인 후 밤 결과 정산 → day |
| `startVoting` | (route 내부) | voting 페이즈 진입 |
| `vote` | `processVote` | 투표 집계, 전원 투표 시 추방·승패 판정 |
| `ready` | (route 내부) | 플레이어 준비 표시 |
| `reset` | (route 내부) | `gameState = null` |

### 게임 규칙(도메인 로직)

상세 규칙은 `.cursor/rules/basic.mdc`(`alwaysApply: true`)에 한국어로 정의돼 있으며, 코드 변경 시 이 규칙이 정본입니다. 요지:

- **6인 고정 배분** (`lib/roles.ts`의 `roleDistribution`): 범인(mafia) 1, 목격자(police) 1, 수습반장(doctor) 1, 만취객(drunkard) 1, 하객(citizen) 2.
- **팀**: `citizens`(police/doctor/citizen), `mafia`, `solo`(drunkard).
- **밤 능력**: 범인=제거(kill), 목격자=조사(investigate, 마피아 여부 O/X), 수습반장=보호(protect, 본인 가능).
- **승리 조건**:
  - 마피아: 생존 마피아 수 ≥ 생존 시민 수.
  - 시민: 생존 마피아 0.
  - **만취객(특수)**: 낮 투표로 지목·추방되면 **즉시 단독 승리**(시민·마피아 모두 패배). `processVote` 안에서 추방 대상이 `drunkard`인지 먼저 검사하므로 일반 승리 판정보다 우선합니다.
- **보호 판정**: `processNightResults`에서 `killTarget === protectTarget`이면 사망 무효("아무 일도 없었습니다").

## 컨벤션

- **경로 별칭**: `@/*` → 저장소 루트 (예: `@/lib/types`, `tsconfig.json` 참조).
- **순수성 유지**: 게임 규칙은 `lib/game-logic.ts`의 순수 함수로 두고, `route.ts`는 디스패치·검증·인메모리 상태 보관만 담당합니다. 새 규칙은 가능한 한 순수 함수로 추가하세요.
- **에러**: API는 한국어 메시지와 함께 `NextResponse.json({ error }, { status })`로 반환합니다. 기존 상태 코드 관례(검증 실패 400, 서버 오류 500)를 따르세요.
- **사용자 문자열**: 전부 한국어. 히스토리 로그(`gameState.history`)도 한국어 서술형으로 누적됩니다.
- **타입 우선**: 상태 형태를 바꿀 때는 먼저 `lib/types.ts`의 `GameState`/`Player`를 수정한 뒤 로직을 맞추세요.
- **PWA**: 서비스 워커는 `public/sw.js`, 등록은 `app/components/ServiceWorkerRegistration.tsx`. 캐시 관련 헤더는 `next.config.js`에 정의돼 있습니다.

## 변경 시 주의점

- `lib/`의 정적 데이터(`roles`, `missions`)와 `public/data/`의 JSON이 일부 중복됩니다. 데이터를 바꿀 때 어느 쪽이 실제로 import되는지 확인하세요 — 런타임 로직은 `lib/`를 사용합니다.
- 새 페이즈/액션을 추가하면 `Phase`/`action switch`/관련 클라이언트 페이지(특히 `app/game/page.tsx`)를 함께 갱신해야 합니다.
- 인메모리 상태 특성상 로컬에서 새로고침·재시작으로 상태가 날아갈 수 있습니다. 디버깅 시 이를 버그로 오해하지 마세요.
