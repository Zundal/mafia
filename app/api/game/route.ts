import { NextRequest, NextResponse } from "next/server";
import { GameState } from "@/lib/types";
import { createGame, joinGame, startGame, assignMissions, processNightAction, processNightResults, processVote } from "@/lib/game-logic";
import { missions } from "@/lib/missions";

// 메모리 기반 게임 상태 저장 (실제 프로덕션에서는 데이터베이스 사용 권장)
let gameState: GameState | null = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const list = searchParams.get("list");
  
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

    switch (action) {
      case "create": {
        try {
          const { gameId } = params;
          
          if (!gameId) {
            return NextResponse.json({ error: "게임 ID가 필요합니다." }, { status: 400 });
          }
          
          gameState = createGame(gameId);
          
          return NextResponse.json(gameState);
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
          
          return NextResponse.json({ ...gameState, joinedPlayerId: result.playerId });
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
          return NextResponse.json(gameState);
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
        // 모든 플레이어의 준비 상태 초기화
        gameState.players.forEach((p) => {
          if (p.isAlive) {
            p.ready = false;
          }
        });
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
        // 모든 플레이어가 준비했는지 확인
        const alivePlayers = gameState.players.filter((p) => p.isAlive);
        const needsActionPlayers = alivePlayers.filter((p) => 
          p.role === "mafia" || p.role === "police" || p.role === "doctor"
        );
        const allReady = needsActionPlayers.every((p) => p.ready);
        
        if (!allReady) {
          return NextResponse.json({ 
            error: `모든 플레이어가 준비할 때까지 기다려주세요. (${needsActionPlayers.filter(p => p.ready).length}/${needsActionPlayers.length})` 
          }, { status: 400 });
        }
        
        gameState = processNightResults(gameState);
        gameState.phase = "day";
        // 모든 플레이어의 준비 상태 초기화
        gameState.players.forEach((p) => {
          p.ready = false;
        });
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
