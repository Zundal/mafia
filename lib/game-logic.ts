import { GameState, Player, Role, Phase } from "./types";
import { roleDistribution } from "./roles";

// 페이즈별 제한 시간 (밀리초). route.ts와 game-logic.ts가 공유하는 단일 출처.
export const PHASE_DURATIONS = {
  night: 60 * 1000, // 60초
  day: 120 * 1000, // 120초
  voting: 90 * 1000, // 90초
} as const;

export function createGame(gameId: string): GameState {
  // 빈 플레이어 슬롯 6개 생성
  const players: Player[] = Array.from({ length: 6 }, (_, index) => ({
    id: `player-${index}`,
    name: "",
    role: null,
    isAlive: true,
    mission: null,
    ready: false,
  }));

  return {
    gameId,
    status: "waiting",
    phase: "setup",
    players,
    currentNight: 0,
    history: ["게임이 생성되었습니다. 플레이어들을 기다리는 중..."],
  };
}

export function joinGame(gameState: GameState, playerName: string): { success: boolean; playerId?: string; error?: string } {
  if (!playerName || playerName.trim() === "") {
    return { success: false, error: "이름을 입력해주세요." };
  }

  const trimmedName = playerName.trim();
  
  // 이미 같은 이름이 있는지 확인
  if (gameState.players.some(p => p.name === trimmedName && p.name !== "")) {
    return { success: false, error: "이미 사용 중인 이름입니다." };
  }

  // 빈 슬롯 찾기
  const emptySlot = gameState.players.find(p => p.name === "");
  if (!emptySlot) {
    return { success: false, error: "게임이 가득 찼습니다. (최대 6명)" };
  }

  emptySlot.name = trimmedName;
  return { success: true, playerId: emptySlot.id };
}

export function startGame(gameState: GameState): GameState {
  const filledPlayers = gameState.players.filter(p => p.name !== "");
  if (filledPlayers.length !== 6) {
    throw new Error("6명의 플레이어가 모두 참여해야 게임을 시작할 수 있습니다.");
  }

  // 역할 섞기
  const shuffledRoles = [...roleDistribution].sort(() => Math.random() - 0.5);
  
  gameState.players.forEach((player, index) => {
    player.role = shuffledRoles[index] as Role;
  });

  gameState.status = "playing";
  gameState.history = ["게임이 시작되었습니다."];
  
  return gameState;
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
      // 액션 완료 시 준비 상태로 변경
      player.ready = true;
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
      // 액션 완료 시 준비 상태로 변경
      player.ready = true;
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
      // 액션 완료 시 준비 상태로 변경
      player.ready = true;
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

// 생존자의 투표를 집계한다. (사망자는 votedFor가 없으므로 제외)
export function tallyVotes(players: Player[]): Record<string, number> {
  const counts: Record<string, number> = {};
  players.forEach((p) => {
    if (p.isAlive && p.votedFor) {
      counts[p.votedFor] = (counts[p.votedFor] || 0) + 1;
    }
  });
  return counts;
}

// 투표 종료 후 다음 밤으로 전환한다. (타이머·준비·투표 상태 초기화)
function startNextNight(state: GameState): void {
  state.phase = "night";
  state.phaseEndTime = Date.now() + PHASE_DURATIONS.night;
  state.nightActions = undefined;
  state.lastAction = undefined;
  state.voteResults = undefined;
  state.players.forEach((p) => {
    p.votedFor = undefined;
    if (p.isAlive) p.ready = false;
  });
}

// 투표 결과를 확정해 추방·승패·다음 페이즈를 결정하는 단일 진실 공급원.
// processVote(전원 투표 완료)와 advancePhase(투표 시간 만료) 양쪽에서 호출한다.
export function resolveVotes(gameState: GameState): GameState {
  const newState = { ...gameState };
  const voteCounts = tallyVotes(newState.players);
  newState.voteResults = voteCounts;

  // 최다 득표자 (동점이면 먼저 집계된 사람)
  let maxVotes = 0;
  let eliminatedId: string | null = null;
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = id;
    }
  });

  // 표가 없으면 아무도 추방하지 않고 다음 밤으로
  if (!eliminatedId || maxVotes === 0) {
    newState.history.push("아무도 추방되지 않았습니다.");
    startNextNight(newState);
    return newState;
  }

  const eliminated = newState.players.find((p) => p.id === eliminatedId);
  if (!eliminated) return newState;

  // 만취객을 투표로 지목하면 즉시 단독 승리 (일반 승패 판정보다 우선)
  if (eliminated.role === "drunkard") {
    newState.winner = "drunkard";
    newState.status = "finished";
    newState.phase = "ended";
    newState.history.push(`${eliminated.name}님은 만취객이었습니다! 만취객 승리!`);
    return newState;
  }

  eliminated.isAlive = false;
  newState.history.push(`${eliminated.name}님이 투표로 추방되었습니다.`);

  const winner = checkWinCondition(newState);
  if (winner) {
    newState.winner = winner;
    newState.status = "finished";
    newState.phase = "ended";
    newState.history.push(winner === "citizens" ? "시민 팀 승리!" : "마피아 팀 승리!");
  } else {
    startNextNight(newState);
  }
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
  newState.voteResults = tallyVotes(newState.players);

  // 모든 생존자가 투표하면 즉시 결과 확정
  const alivePlayers = newState.players.filter((p) => p.isAlive);
  const votedCount = alivePlayers.filter((p) => p.votedFor).length;
  if (votedCount === alivePlayers.length) {
    return resolveVotes(newState);
  }

  return newState;
}
