import { NextResponse } from "next/server";
import { missions } from "@/lib/missions";

export async function GET() {
  return NextResponse.json(missions);
}
