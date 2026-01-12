import { GameState, Player, Role, Phase } from "./types";
import { roleDistribution } from "./roles";

export function createGame(gameId: string, playerNames: string[]): GameState {
  if (playerNames.length !== 6) {
    throw new Error("플레이어는 정확히 6명이어야 합니다.");
  }

  // 역할 섞기
  const shuffledRoles = [...roleDistribution].sort(() => Math.random() - 0.5);
  
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    role: shuffledRoles[index] as Role,
    isAlive: true,
    mission: null,
    ready: false,
  }));

  return {
    gameId,
    status: "playing",
    phase: "setup",
    players,
    currentNight: 0,
    history: ["게임이 시작되었습니다."],
  };
}

export function assignMissions(players: Player[], missions: string[]): Player[] {
  const shuffledMissions = [...missions].sort(() => Math.random() - 0.5);
  return players.map((player, index) => ({
    ...player,
    mission: shuffledMissions[index] || null,
  }));
}

export function checkWinCondition(gameState: GameState): "citizens" | "mafia" | "drunkard" | null {
  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
  const aliveCitizens = alivePlayers.filter(
    (p) => p.role === "police" || p.role === "doctor" || p.role === "citizen"
  );

  // 만취객 승리 조건 (투표로 제거된 경우는 별도 처리)
  // 마피아 승리 조건
  if (aliveMafia.length >= aliveCitizens.length) {
    return "mafia";
  }

  // 시민 승리 조건
  if (aliveMafia.length === 0) {
    return "citizens";
  }

  return null;
}

export function processNightAction(
  gameState: GameState,
  action: {
    type: "kill" | "investigate" | "protect";
    target: string;
    playerId: string;
  }
): GameState {
  const newState = { ...gameState };
  if (!newState.nightActions) {
    newState.nightActions = {};
  }
  
  const player = newState.players.find((p) => p.id === action.playerId);
  
  if (!player || !player.isAlive) {
    throw new Error("플레이어를 찾을 수 없거나 이미 사망했습니다.");
  }

  switch (action.type) {
    case "kill":
      if (player.role !== "mafia") {
        throw new Error("범인만 제거할 수 있습니다.");
      }
      newState.nightActions.kill = {
        target: action.target,
        playerId: action.playerId,
      };
      newState.lastAction = {
        type: "kill",
        target: action.target,
      };
      break;

    case "investigate":
      if (player.role !== "police") {
        throw new Error("목격자만 조사할 수 있습니다.");
      }
      const target = newState.players.find((p) => p.id === action.target);
      newState.nightActions.investigate = {
        target: action.target,
        playerId: action.playerId,
        result: target?.role === "mafia",
      };
      newState.lastAction = {
        type: "investigate",
        target: action.target,
        result: target?.role === "mafia",
      };
      break;

    case "protect":
      if (player.role !== "doctor") {
        throw new Error("수습반장만 보호할 수 있습니다.");
      }
      newState.nightActions.protect = {
        target: action.target,
        playerId: action.playerId,
      };
      newState.lastAction = {
        type: "protect",
        target: action.target,
      };
      break;
  }

  return newState;
}

export function processNightResults(gameState: GameState): GameState {
  const newState = { ...gameState };
  
  if (newState.nightActions?.kill) {
    const killTarget = newState.nightActions.kill.target;
    const protectTarget = newState.nightActions.protect?.target;

    if (killTarget && killTarget !== protectTarget) {
      const target = newState.players.find((p) => p.id === killTarget);
      if (target) {
        target.isAlive = false;
        newState.history.push(`${target.name}님이 입막음을 당해 탈락했습니다.`);
      }
    } else if (killTarget === protectTarget) {
      newState.history.push("아무 일도 없었습니다. (보호됨)");
    }
  } else {
    newState.history.push("아무 일도 없었습니다.");
  }

  // 밤 액션 초기화
  newState.nightActions = undefined;
  newState.lastAction = undefined;
  newState.phase = "day";
  newState.currentNight += 1;
  return newState;
}

export function processVote(
  gameState: GameState,
  voterId: string,
  targetId: string
): GameState {
  const newState = { ...gameState };
  const voter = newState.players.find((p) => p.id === voterId);
  const target = newState.players.find((p) => p.id === targetId);

  if (!voter || !voter.isAlive) {
    throw new Error("투표할 수 없습니다.");
  }

  if (!target || !target.isAlive) {
    throw new Error("대상이 유효하지 않습니다.");
  }

  voter.votedFor = targetId;

  // 투표 결과 집계
  const voteCounts: Record<string, number> = {};
  newState.players.forEach((p) => {
    if (p.votedFor) {
      voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
    }
  });

  newState.voteResults = voteCounts;

  // 모든 생존자가 투표했는지 확인
  const alivePlayers = newState.players.filter((p) => p.isAlive);
  const votedPlayers = newState.players.filter((p) => p.isAlive && p.votedFor);

  if (votedPlayers.length === alivePlayers.length) {
    // 투표 완료 - 가장 많이 받은 사람 제거
    let maxVotes = 0;
    let eliminatedId: string | null = null;

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = id;
      }
    });

    if (eliminatedId) {
      const eliminated = newState.players.find((p) => p.id === eliminatedId);
      if (eliminated) {
        // 만취객 체크
        if (eliminated.role === "drunkard") {
          newState.winner = "drunkard";
          newState.status = "finished";
          newState.phase = "ended";
          newState.history.push(`${eliminated.name}님은 만취객이었습니다! 만취객 승리!`);
        } else {
          eliminated.isAlive = false;
          newState.history.push(`${eliminated.name}님이 투표로 추방되었습니다.`);
          
          // 승리 조건 체크
          const winner = checkWinCondition(newState);
          if (winner) {
            newState.winner = winner;
            newState.status = "finished";
            newState.phase = "ended";
            if (winner === "citizens") {
              newState.history.push("시민 팀 승리!");
            } else if (winner === "mafia") {
              newState.history.push("마피아 팀 승리!");
            }
          } else {
            // 다음 밤으로
            newState.phase = "night";
            newState.nightActions = undefined;
            newState.lastAction = undefined;
            newState.voteResults = undefined;
            newState.players.forEach((p) => {
              p.votedFor = undefined;
            });
          }
        }
      }
    }
  }

  return newState;
}
