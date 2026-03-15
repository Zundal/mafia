import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const positions = new Map<string, { x: number; y: number }>();

export async function GET() {
  const result: Record<string, { x: number; y: number }> = {};
  positions.forEach((pos, id) => { result[id] = pos; });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { playerId, x, y } = await req.json();
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });
  positions.set(String(playerId), { x: Number(x), y: Number(y) });
  return NextResponse.json({ ok: true });
}
