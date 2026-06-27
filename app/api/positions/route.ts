import { NextRequest, NextResponse } from "next/server";
import { getPositions, setPosition } from "@/lib/game-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const positions = await getPositions();
  return NextResponse.json(positions);
}

export async function POST(req: NextRequest) {
  const { playerId, x, y } = await req.json();
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });
  await setPosition(String(playerId), Number(x), Number(y));
  return NextResponse.json({ ok: true });
}
