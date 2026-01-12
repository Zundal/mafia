import { RoleInfo } from "./types";

export const roles: Record<string, RoleInfo> = {
  mafia: {
    id: "mafia",
    name: "범인",
    icon: "🍷",
    team: "mafia",
    description: "시민과 수가 같아지거나 시민을 전멸시키면 승리",
    winCondition: "시민과 수가 같아지거나 시민을 전멸시키면 승리",
    action: "밤마다 한 명을 '입막음(제거)' 합니다. 낮에는 시민인 척 연기하세요.",
  },
  police: {
    id: "police",
    name: "목격자",
    icon: "🕵️",
    team: "citizens",
    description: "범인을 찾아내 투표로 추방하면 승리",
    winCondition: "범인을 찾아내 투표로 추방하면 승리",
    action: "밤마다 한 명의 신분을 조회(범인 O/X)할 수 있습니다.",
  },
  doctor: {
    id: "doctor",
    name: "수습반장",
    icon: "🧹",
    team: "citizens",
    description: "범인을 찾아내 투표로 추방하면 승리",
    winCondition: "범인을 찾아내 투표로 추방하면 승리",
    action: "밤마다 한 명을 지정해 범인의 공격으로부터 보호합니다. (본인 보호 가능)",
  },
  drunkard: {
    id: "drunkard",
    name: "만취객",
    icon: "🥴",
    team: "solo",
    description: "낮 투표에서 지목당해 쫓겨나면 단독 승리",
    winCondition: "낮 투표에서 지목당해 쫓겨나면 단독 승리",
    action: "범인처럼 수상하게 행동해서 사람들의 표를 받으세요. (단, 너무 티 나면 무시당함)",
  },
  citizen: {
    id: "citizen",
    name: "하객",
    icon: "👥",
    team: "citizens",
    description: "범인을 찾아내 투표로 추방하면 승리",
    winCondition: "범인을 찾아내 투표로 추방하면 승리",
    action: "특수 능력은 없지만, 날카로운 추리로 투표권을 행사하세요.",
  },
};

export const roleDistribution = [
  "mafia",
  "police",
  "doctor",
  "drunkard",
  "citizen",
  "citizen",
] as const;
