"use client";

import { Phase } from "@/lib/types";

interface PhaseIndicatorProps {
  phase: Phase;
  currentNight?: number;
}

export default function PhaseIndicator({ phase, currentNight = 0 }: PhaseIndicatorProps) {
  const phaseInfo = {
    setup: { label: "게임 설정", icon: "🎮", gradient: "from-blue-500 to-cyan-500" },
    night: { label: "밤", icon: "🌙", gradient: "from-indigo-600 to-purple-600" },
    day: { label: "낮", icon: "☀️", gradient: "from-amber-500 to-orange-500" },
    voting: { label: "투표", icon: "🗳️", gradient: "from-purple-600 to-pink-600" },
    ended: { label: "게임 종료", icon: "🏁", gradient: "from-slate-600 to-slate-700" },
  };

  const info = phaseInfo[phase];

  return (
    <div className={`bg-gradient-to-r ${info.gradient} text-white px-6 py-4 rounded-2xl shadow-lg shadow-${info.gradient.split(' ')[1]}/20 mb-4 border border-white/10`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{info.icon}</span>
        <span className="text-lg font-bold">{info.label}</span>
        {currentNight > 0 && phase !== "setup" && phase !== "ended" && (
          <span className="text-sm opacity-90 font-medium">(밤 {currentNight})</span>
        )}
      </div>
    </div>
  );
}
