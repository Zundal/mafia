# CLAUDE.md

이 파일은 [Claude Code](https://claude.com/claude-code)를 비롯한 AI 코딩 에이전트가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**🍷 집들이 미스터리: 깨진 와인병의 비밀** — 6인용 마피아 게임 웹앱입니다.
오프라인 모임(집들이)에서 한 대의 폰을 돌려가며 진행하는 것을 전제로 한 PWA로, **시민 팀 vs 마피아 팀 vs 만취객(개인전)**의 3파전 구조가 핵심 차별점입니다.

- **유형**: Next.js 14 (App Router) 기반 PWA
- **언어**: TypeScript (strict)
- **스타일**: Tailwind CSS + shadcn/ui (`components/ui/`, Radix + CVA + `lib/utils.ts`의 `cn`)
- **3D**: Three.js — `app/game/GameCanvas.tsx`의 Among Us 스타일 아파트 게임 월드
- **배포**: Vercel (`vercel.json`: 빌드/설치 모두 Bun, region `icn1`)
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
│   ├── missions/route.ts  # 미션 목록 반환
│   └── positions/route.ts # 게임 월드 내 플레이어 좌표 동기화 (별도 인메모리 Map)
├── components/            # 클라이언트 React 컴포넌트
│   ├── MusicPlayer.tsx
│   ├── ServiceWorkerRegistration.tsx
│   ├── Toast.tsx
│   ├── VotePanel.tsx / MissionCard.tsx / PhaseIndicator.tsx / RoleCard.tsx
├── page.tsx               # 메인(로비/방 생성·참여)
├── join/page.tsx          # 참여
├── game/page.tsx          # 게임 진행 화면 (가장 큰 클라이언트 로직)
├── game/GameCanvas.tsx    # Three.js 게임 월드 (아파트 맵 이동)
├── demo/page.tsx          # 혼자 해보기(데모 탐험) 모드
├── story/page.tsx         # 스토리/규칙 소개
└── layout.tsx             # 루트 레이아웃 + PWA 메타데이터
components/ui/             # shadcn/ui 프리미티브 (button, card, input, badge, separator)
lib/
├── types.ts               # 핵심 타입 (Role, Phase, GameState, Player 등)
├── roles.ts               # 역할 정의 + roleDistribution(6인 역할 배분)
├── missions.ts            # 히든 미션 문자열 배열
├── utils.ts               # cn() — clsx + tailwind-merge
└── game-logic.ts          # 순수 게임 규칙 함수 (상태 머신의 핵심)
public/
├── data/                  # roles.json / missions.json / game-state.json (정적 데이터)
├── icons/, music/         # PWA 아이콘, 배경음악
├── manifest.json, sw.js   # PWA 매니페스트 & 서비스 워커
```

> shadcn/ui는 관례상 `app/`이 아닌 **루트 `components/ui/`**에 위치합니다(`components.json` 설정). 게임 전용 컴포넌트는 `app/components/`에 있습니다 — 두 위치를 혼동하지 마세요.

### 상태 관리 — 가장 중요한 점

- **모든 상태는 `lib/game-store.ts`의 영속 계층을 통해서만 접근합니다.** 라우트는 더 이상 모듈 변수를 직접 들지 않고 `getGame()`/`setGame()`/`clearGame()`, `getPositions()`/`setPosition()`을 호출합니다. 이 한 파일이 **유일한 교체 지점**입니다.
- **백엔드는 환경변수로 자동 선택**됩니다:
  - `KV_REST_API_URL`+`KV_REST_API_TOKEN`(Vercel KV) 또는 `UPSTASH_REDIS_REST_URL`+`_TOKEN`(Upstash)이 있으면 → **Redis(REST)** 로 영속화.
  - 없으면 → **인메모리 폴백**(모듈 스코프 변수/Map). 단일 인스턴스·재배포 시 소실되는, 기존과 동일한 동작.
- 영속화를 켜려면 코드 변경 없이 Vercel Marketplace에서 KV/Upstash를 연결해 위 환경변수가 주입되게만 하면 됩니다.
- ⚠️ 인메모리 폴백은 여전히 **동시 게임 1개**이고 서버리스에서 인스턴스마다 상태가 갈릴 수 있습니다. 실멀티플레이가 필요하면 KV를 연결하세요.
- 클라이언트(`app/game/page.tsx` 등)는 폴링으로 `GET /api/game`을 호출해 상태를 동기화합니다.
- 게임 월드 좌표(`positions`)도 같은 `game-store`를 통해 저장됩니다(게임 로직 상태와는 별개 키).
- **페이즈 타이머**: `GameState.phaseEndTime`(Unix ms)이 현재 페이즈의 자동 전환 시각입니다. 서버는 `PHASE_DURATIONS`(night 60s / day 120s / voting 90s)로 설정하고, 클라이언트가 만료 시 `advancePhase` 액션으로 전환을 트리거합니다. ⚠️ `Date.now()` 기반이라 서버리스에서 시계가 인스턴스마다 다를 수 있음에 유의.

### 핵심 흐름: 액션 디스패치

모든 상태 변경은 `POST /api/game`의 `{ action, ...params }` 패턴으로 이뤄집니다. `route.ts`의 `switch (action)`이 디스패처이고, 실제 규칙은 `lib/game-logic.ts`의 순수 함수가 담당합니다.

| action | 핸들러(lib/game-logic.ts) | 설명 |
|---|---|---|
| `create` | `createGame` | 빈 슬롯 6개로 새 게임 생성 |
| `join` | `joinGame` | 빈 슬롯에 이름 배정, 중복/만석 검증 |
| `startGame` | `startGame` + `assignMissions` | 역할 셔플·배정 + 미션 배정 |
| `startNight` | (route 내부) | night 페이즈 진입, ready·타이머 초기화 |
| `nightAction` | `processNightAction` | kill/investigate/protect 등록 |
| `endNight` | `processNightResults` | 능력자 전원 ready **또는 타이머 만료** 시 밤 결과 정산 → day |
| `startVoting` | (route 내부) | voting 페이즈 진입 |
| `vote` | `processVote` | 투표 집계, 전원 투표 시 추방·승패 판정 |
| `ready` | (route 내부) | 플레이어 준비 표시 |
| `advancePhase` | (route 내부) | 타이머 만료 시 다음 페이즈로 강제 전환(night→day→voting→…). 미행동/미투표는 건너뜀 |
| `reset` | (route 내부) | `gameState = null` |

> ⚠️ **로직 중복 주의**: `advancePhase`의 투표 만료 처리는 `processVote`의 추방·승패 판정 로직을 route 안에 **복제**하고 있습니다(만취객 우선 승리, `checkWinCondition` 등). 투표 규칙을 바꾸면 `lib/game-logic.ts`의 `processVote`와 `route.ts`의 `advancePhase` **두 곳**을 함께 고쳐야 합니다. 향후 이 로직을 순수 함수(`resolveVotes`)로 추출하면 중복이 사라집니다.

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
