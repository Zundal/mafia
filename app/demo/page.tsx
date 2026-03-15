"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlayerData } from "@/app/game/GameCanvas";

const GameCanvas = dynamic(() => import("@/app/game/GameCanvas"), { ssr: false });

// 데모용 플레이어 데이터
const DEMO_ME: PlayerData = { id: "demo-me", name: "나", colorIndex: 0, isAlive: true };
const DEMO_NPCS: PlayerData[] = [
  { id: "demo-npc-1", name: "민준", colorIndex: 1, isAlive: true },
  { id: "demo-npc-2", name: "서연", colorIndex: 2, isAlive: true },
  { id: "demo-npc-3", name: "지호", colorIndex: 3, isAlive: true },
  { id: "demo-npc-4", name: "하은", colorIndex: 4, isAlive: true },
  { id: "demo-npc-5", name: "도윤", colorIndex: 5, isAlive: true },
];
const DEMO_PLAYERS = [DEMO_ME, ...DEMO_NPCS];

export default function DemoPage() {
  const router = useRouter();
  const [nightMode, setNightMode] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950">
      {/* Three.js 캔버스 */}
      <GameCanvas
        currentPlayerId="demo-me"
        players={DEMO_PLAYERS}
        nightMode={nightMode}
        demoMode
      />

      {/* 상단 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
        {/* 왼쪽: 뒤로가기 */}
        <Button
          variant="glass"
          size="sm"
          className="pointer-events-auto"
          onClick={() => router.push("/")}
        >
          ← 돌아가기
        </Button>

        {/* 가운데: 데모 배지 */}
        <div className="flex items-center gap-2">
          <Badge
            variant="warning"
            className="text-xs font-semibold px-3 py-1 animate-pulse"
          >
            🎮 혼자 해보기 모드
          </Badge>
        </div>

        {/* 오른쪽: 낮/밤 토글 */}
        <Button
          variant="glass"
          size="sm"
          className="pointer-events-auto"
          onClick={() => setNightMode((v) => !v)}
        >
          {nightMode ? "🌙 밤" : "☀️ 낮"}
        </Button>
      </div>

      {/* 하단 안내 패널 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="glass border border-amber-700/30 rounded-2xl px-5 py-3 text-center max-w-xs">
          <p className="text-amber-300 font-semibold text-sm mb-1">🏠 집들이 미스터리 맵 탐험</p>
          <p className="text-stone-400 text-xs leading-relaxed">
            WASD / 화살표 키로 이동하세요
            <br />
            다른 손님들이 방을 돌아다닙니다
          </p>
        </div>
      </div>
    </main>
  );
}
