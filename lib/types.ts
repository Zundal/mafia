export type Role = "mafia" | "police" | "doctor" | "drunkard" | "citizen";

export type Phase = "setup" | "night" | "day" | "voting" | "ended";

export type GameStatus = "waiting" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  role: Role | null;
  isAlive: boolean;
  mission: string | null;
  votedFor?: string;
  ready?: boolean;
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  phase: Phase;
  players: Player[];
  currentNight: number;
  nightActions?: {
    kill?: { target: string; playerId: string };
    investigate?: { target: string; playerId: string; result?: boolean };
    protect?: { target: string; playerId: string };
  };
  lastAction?: {
    type: "kill" | "investigate" | "protect";
    target?: string;
    result?: boolean;
  };
  voteResults?: Record<string, number>;
  winner?: "citizens" | "mafia" | "drunkard";
  history: string[];
}

export interface RoleInfo {
  id: Role;
  name: string;
  icon: string;
  team: "citizens" | "mafia" | "solo";
  description: string;
  winCondition: string;
  action: string;
}
