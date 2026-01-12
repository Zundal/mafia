import { NextRequest, NextResponse } from "next/server";
import { GameState } from "@/lib/types";
import { createGame, assignMissions, processNightAction, processNightResults, processVote } from "@/lib/game-logic";
import { missions } from "@/lib/missions";

// 메모리 기반 게임 상태 저장 (실제 프로덕션에서는 데이터베이스 사용 권장)
let gameState: GameState | null = null;

export async function GET() {
  if (!gameState) {
    return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 200 });
  }
  return NextResponse.json(gameState);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "create": {
        const { gameId, playerNames } = params;
        gameState = createGame(gameId, playerNames);
        
        // 미션 할당
        gameState.players = assignMissions(gameState.players, missions);
        
        return NextResponse.json(gameState);
      }

      case "startNight": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState.phase = "night";
        gameState.nightActions = undefined;
        gameState.lastAction = undefined;
        return NextResponse.json(gameState);
      }

      case "nightAction": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState = processNightAction(gameState, params);
        return NextResponse.json(gameState);
      }

      case "endNight": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState = processNightResults(gameState);
        gameState.phase = "day";
        return NextResponse.json(gameState);
      }

      case "startVoting": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        gameState.phase = "voting";
        return NextResponse.json(gameState);
      }

      case "vote": {
        if (!gameState) {
          return NextResponse.json({ error: "게임이 시작되지 않았습니다." }, { status: 400 });
        }
        const { voterId, targetId } = params;
        gameState = processVote(gameState, voterId, targetId);
        return NextResponse.json(gameState);
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
        return NextResponse.json(gameState);
      }

      case "reset": {
        gameState = null;
        return NextResponse.json({ message: "게임이 리셋되었습니다." });
      }

      default:
        return NextResponse.json({ error: "알 수 없는 액션입니다." }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
