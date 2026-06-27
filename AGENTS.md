# AGENTS.md

이 파일은 모든 AI 코딩 에이전트(범용 [agents.md](https://agents.md) 표준)를 위한 진입점입니다.

이 저장소의 상세 가이드는 **[CLAUDE.md](./CLAUDE.md)** 한 곳에서 관리합니다. 중복을 피하기 위해 핵심 요약만 아래에 두고, 전체 내용은 CLAUDE.md를 참고하세요. (Cursor 사용자는 `.cursor/rules/`의 규칙도 자동 적용됩니다.)

## 빠른 요약

- **프로젝트**: 6인용 마피아 게임 웹앱 "집들이 미스터리: 깨진 와인병의 비밀". Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui, Three.js 게임 월드(`app/game/GameCanvas.tsx`), Vercel 배포, PWA.
- **패키지 매니저**: **Bun** 선호 (`bun install`, `bun run dev`, `bun run build`, `bun run lint`). `vercel.json`도 Bun 사용.
- **상태**: 모든 접근은 `lib/game-store.ts` 영속 계층 경유(`getGame`/`setGame`/`clearGame`, `getPositions`/`setPosition`). 환경변수(Vercel KV/Upstash REST)가 있으면 Redis, 없으면 인메모리 폴백(동시 게임 1개, 재배포 시 초기화). 백엔드 교체는 이 한 파일만.
- **페이즈 타이머**: `phaseEndTime` + `advancePhase` 액션으로 자동 전환. ⚠️ `advancePhase`의 투표 만료 로직은 `processVote`를 복제하므로 투표 규칙 변경 시 두 곳을 함께 수정.
- **로직 분리**: 순수 게임 규칙은 `lib/game-logic.ts`, HTTP 디스패치·검증은 `app/api/game/route.ts`의 `switch (action)`.
- **타입**: 상태 형태는 `lib/types.ts`의 `GameState`/`Player`가 기준.
- **규칙 정본**: 게임 도메인 규칙은 `.cursor/rules/basic.mdc`.
- **언어**: 사용자 노출 문자열·로그는 모두 한국어.
- **경로 별칭**: `@/*` → 저장소 루트.

## 작업 전 체크리스트

1. 변경 후 `bun run build`와 `bun run lint`로 검증 (자동 테스트 스위트 없음).
2. 게임 규칙을 바꾸면 `lib/game-logic.ts`(순수 함수)에 추가하고, 필요 시 `lib/types.ts`·`route.ts`·`app/game/page.tsx`를 함께 갱신.
3. 자세한 아키텍처·액션 디스패치 표·승리 조건은 **[CLAUDE.md](./CLAUDE.md)** 참고.
