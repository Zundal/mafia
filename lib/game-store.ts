import { GameState } from "./types";

/**
 * 게임 상태 영속 계층.
 *
 * 환경변수가 설정돼 있으면 Vercel KV / Upstash Redis(REST API)를 사용하고,
 * 없으면 인메모리로 폴백한다. 인메모리 폴백은 기존과 동일한 동작
 * (단일 인스턴스·재배포 시 소실)이므로, 로컬 개발과 미프로비저닝 환경에서도
 * 추가 설정 없이 그대로 작동한다.
 *
 * 영속화를 활성화하려면 Vercel Marketplace에서 KV(또는 Upstash Redis)를 연결하고
 * 아래 환경변수가 주입되도록 두면 된다 (별도 코드 변경 불필요):
 *   - KV_REST_API_URL / KV_REST_API_TOKEN            (Vercel KV)
 *   - 또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash)
 */

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REST_URL && REST_TOKEN);

const GAME_KEY = "mafia:game";
const POSITIONS_KEY = "mafia:positions";

export type Position = { x: number; y: number };

// ─── 인메모리 폴백 ──────────────────────────────────────────────────────────
let memGame: GameState | null = null;
const memPositions = new Map<string, Position>();

// ─── Redis(REST) 백엔드 ─────────────────────────────────────────────────────
async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV 요청 실패: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { result?: unknown };
  return data.result ?? null;
}

// ─── 게임 상태 ──────────────────────────────────────────────────────────────
export async function getGame(): Promise<GameState | null> {
  if (!useRedis) return memGame;
  const raw = (await redis(["GET", GAME_KEY])) as string | null;
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function setGame(state: GameState): Promise<void> {
  if (!useRedis) {
    memGame = state;
    return;
  }
  await redis(["SET", GAME_KEY, JSON.stringify(state)]);
}

export async function clearGame(): Promise<void> {
  if (!useRedis) {
    memGame = null;
    return;
  }
  await redis(["DEL", GAME_KEY]);
}

// ─── 게임 월드 좌표 ─────────────────────────────────────────────────────────
export async function getPositions(): Promise<Record<string, Position>> {
  if (!useRedis) {
    const out: Record<string, Position> = {};
    memPositions.forEach((pos, id) => {
      out[id] = pos;
    });
    return out;
  }
  const raw = (await redis(["GET", POSITIONS_KEY])) as string | null;
  return raw ? (JSON.parse(raw) as Record<string, Position>) : {};
}

export async function setPosition(id: string, x: number, y: number): Promise<void> {
  if (!useRedis) {
    memPositions.set(id, { x, y });
    return;
  }
  const all = await getPositions();
  all[id] = { x, y };
  await redis(["SET", POSITIONS_KEY, JSON.stringify(all)]);
}
