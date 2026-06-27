import { NextRequest, NextResponse } from "next/server";
import { GameState } from "@/lib/types";
import { createGame, joinGame, startGame, assignMissions, processNightAction, processNightResults, processVote, resolveVotes, PHASE_DURATIONS } from "@/lib/game-logic";
import { missions } from "@/lib/missions";
import { getGame, setGame, clearGame } from "@/lib/game-store";

export const dynamic = "force-dynamic";

// 변경된 상태를 영속 계층에 저장한 뒤 응답한다.
async function saveAndRespond(state: GameState, extra?: Record<string, unknown>) {
  await setGame(state);
  return NextResponse.json(extra ? { ...state, ...extra } : state);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const list = searchParams.get("list");
  const gameState = await getGame();

  // 방 목록 요청
  if (list === "true") {
    if (!gameState) {
      return NextResponse.json({ games: [] });
    }

    const joinedPlayers = gameState.players.filter((p) => p.name !== "");
    const allJoined = joinedPlayers.length === 6;
    const gameStarted = gameState.status === "playing" && gameState.players[0]?.role !== null;

    return NextResponse.json({
      games: [{
        gameId: gameState.gameId,
        status: gameState.status,
        phase: gameState.phase,
        joinedCount: joinedPlayers.length,
        maxPlayers: 6,
        isFull: allJoined,
        isStarted: gameStarted,
        players: joinedPlayers.map(p => p.name),
      }]
    });
  }

  // 단일 게임 상태 요청
  if (!gameState) {
    return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 200 });
  }
  return NextResponse.json(gameState);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    let gameState = await getGame();

    switch (action) {
      case "create": {
        try {
          const { gameId } = params;

          if (!gameId) {
            return NextResponse.json({ error: "게임 ID가 필요합니다." }, { status: 400 });
          }

          gameState = createGame(gameId);
          return saveAndRespond(gameState);
        } catch (error: any) {
          return NextResponse.json({ error: error.message || "게임 생성 중 오류가 발생했습니다." }, { status: 500 });
        }
      }

      case "join": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        try {
          const { playerName } = params;
          const result = joinGame(gameState, playerName);

          if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
          }

          return saveAndRespond(gameState, { joinedPlayerId: result.playerId });
        } catch (error: any) {
          return NextResponse.json({ error: error.message || "게임 참여 중 오류가 발생했습니다." }, { status: 500 });
        }
      }

      case "startGame": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        try {
          gameState = startGame(gameState);
          // 미션 할당
          gameState.players = assignMissions(gameState.players, missions);
          return saveAndRespond(gameState);
        } catch (error: any) {
          return NextResponse.json({ error: error.message || "게임 시작 중 오류가 발생했습니다." }, { status: 400 });
        }
      }

      case "startNight": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState.phase = "night";
        gameState.nightActions = undefined;
        gameState.lastAction = undefined;
        gameState.phaseEndTime = Date.now() + PHASE_DURATIONS.night;
        // 모든 플레이어의 준비 상태 초기화
        gameState.players.forEach((p) => {
          if (p.isAlive) {
            p.ready = false;
          }
        });
        return saveAndRespond(gameState);
      }

      case "nightAction": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState = processNightAction(gameState, params);
        return saveAndRespond(gameState);
      }

      case "endNight": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        // 이미 낮 페이즈로 전환된 경우 무시 (중복 요청 방지)
        if (gameState.phase !== "night") {
          return NextResponse.json(gameState);
        }
        // 모든 플레이어가 준비했는지 확인 (타이머 만료 시 강제 종료 허용)
        const alivePlayers = gameState.players.filter((p) => p.isAlive);
        const needsActionPlayers = alivePlayers.filter((p) =>
          p.role === "mafia" || p.role === "police" || p.role === "doctor"
        );
        const allReady = needsActionPlayers.every((p) => p.ready);
        const timerExpired = gameState.phaseEndTime ? Date.now() >= gameState.phaseEndTime : false;

        if (!allReady && !timerExpired) {
          return NextResponse.json({
            error: `모든 플레이어가 준비할 때까지 기다려주세요. (${needsActionPlayers.filter(p => p.ready).length}/${needsActionPlayers.length})`
          }, { status: 400 });
        }

        if (timerExpired) {
          gameState.history.push("⏰ 밤 시간이 종료되었습니다. 행동하지 않은 플레이어의 액션은 건너뜁니다.");
        }

        gameState = processNightResults(gameState);
        gameState.phase = "day";
        gameState.phaseEndTime = Date.now() + PHASE_DURATIONS.day;
        // 모든 플레이어의 준비 상태 초기화
        gameState.players.forEach((p) => {
          p.ready = false;
        });
        return saveAndRespond(gameState);
      }

      case "startVoting": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        if (gameState.phase === "voting") {
          return NextResponse.json(gameState);
        }
        gameState.phase = "voting";
        gameState.phaseEndTime = Date.now() + PHASE_DURATIONS.voting;
        return saveAndRespond(gameState);
      }

      case "vote": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        const { voterId, targetId } = params;
        gameState = processVote(gameState, voterId, targetId);
        return saveAndRespond(gameState);
      }

      case "ready": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        const { playerId } = params;
        const player = gameState.players.find((p) => p.id === playerId);
        if (player) {
          player.ready = true;
        }
        return saveAndRespond(gameState);
      }

      // 타이머 만료 시 자동으로 다음 페이즈로 전환
      case "advancePhase": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        const now = Date.now();
        const timerExpired = gameState.phaseEndTime ? now >= gameState.phaseEndTime : false;

        if (!timerExpired) {
          // 타이머가 아직 안 끝났으면 현재 상태 반환
          return NextResponse.json(gameState);
        }

        if (gameState.phase === "night") {
          // 밤 → 낮: 미행동 플레이어 건너뛰고 결과 처리
          gameState.history.push("⏰ 밤 시간이 종료되었습니다. 행동하지 않은 플레이어의 액션은 건너뜁니다.");
          gameState = processNightResults(gameState);
          gameState.phase = "day";
          gameState.phaseEndTime = Date.now() + PHASE_DURATIONS.day;
          gameState.players.forEach((p) => { p.ready = false; });

        } else if (gameState.phase === "day") {
          // 낮 → 투표: 자동으로 투표 시작
          gameState.history.push("⏰ 낮 토론 시간이 종료되었습니다. 투표를 시작합니다.");
          gameState.phase = "voting";
          gameState.phaseEndTime = Date.now() + PHASE_DURATIONS.voting;

        } else if (gameState.phase === "voting") {
          // 투표 시간 초과: 현재까지 투표된 결과로 확정 (processVote와 동일 로직 공유)
          gameState.history.push("⏰ 투표 시간이 종료되었습니다.");
          gameState = resolveVotes(gameState);
        }

        return saveAndRespond(gameState);
      }

      case "reset": {
        await clearGame();
        return NextResponse.json({ message: "게임이 리셋되었습니다." });
      }

      default:
        return NextResponse.json({ error: "알 수 없는 액션입니다." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
