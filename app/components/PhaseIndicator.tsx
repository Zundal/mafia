"use client";

import { Phase } from "@/lib/types";

interface PhaseIndicatorProps {
  phase: Phase;
  currentNight?: number;
}

export default function PhaseIndicator({ phase, currentNight = 0 }: PhaseIndicatorProps) {
  const phaseInfo: Record<Phase, {
    label: string;
    subLabel: string;
    icon: string;
    gradient: string;
    glowColor: string;
    bgPattern: string;
  }> = {
    setup: {
      label: "게임 준비",
      subLabel: "플레이어들이 모이고 있습니다",
      icon: "🎮",
      gradient: "from-blue-600 via-cyan-600 to-teal-600",
      glowColor: "rgba(6, 182, 212, 0.4)",
      bgPattern: "from-blue-500/10 to-cyan-500/10",
    },
    night: {
      label: `밤${currentNight > 0 ? ` ${currentNight}` : ""}`,
      subLabel: "모두가 잠든 사이, 누군가 움직인다...",
      icon: "🌙",
      gradient: "from-indigo-700 via-purple-700 to-violet-700",
      glowColor: "rgba(139, 92, 246, 0.5)",
      bgPattern: "from-indigo-500/10 to-purple-500/10",
    },
    day: {
      label: `낮${currentNight > 0 ? ` ${currentNight}` : ""}`,
      subLabel: "밤사이 무슨 일이 일어났을까?",
      icon: "☀️",
      gradient: "from-amber-600 via-orange-600 to-red-600",
      glowColor: "rgba(245, 158, 11, 0.4)",
      bgPattern: "from-amber-500/10 to-orange-500/10",
    },
    voting: {
      label: "투표 시간",
      subLabel: "범인은 누구? 신중하게 선택하세요",
      icon: "🗳️",
      gradient: "from-purple-700 via-pink-700 to-rose-700",
      glowColor: "rgba(236, 72, 153, 0.4)",
      bgPattern: "from-purple-500/10 to-pink-500/10",
    },
    ended: {
      label: "게임 종료",
      subLabel: "진실이 밝혀졌습니다",
      icon: "🏁",
      gradient: "from-slate-700 via-zinc-700 to-gray-700",
      glowColor: "rgba(148, 163, 184, 0.3)",
      bgPattern: "from-slate-500/10 to-zinc-500/10",
    },
  };

  const info = phaseInfo[phase];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r ${info.gradient} text-white px-5 py-4 rounded-2xl mb-5 border border-white/10 phase-banner`}
      style={{ "--phase-color": info.glowColor } as React.CSSProperties}
    >
      {/* 배경 패턴 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${info.bgPattern} opacity-50`} />
      {/* 상단 하이라이트 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20 flex-shrink-0">
            {info.icon}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{info.label}</p>
            <p className="text-white/70 text-xs">{info.subLabel}</p>
          </div>
        </div>
        {phase === "night" && (
          <div className="flex gap-1 items-end opacity-60">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-white star"
                style={{ height: `${6 + i * 4}px`, animationDelay: `${i * 0.4}s`, animationDuration: `${1.5 + i * 0.5}s` }}
              />
            ))}
          </div>
        )}
        {phase === "voting" && (
          <div className="text-white/60 text-xs font-medium animate-urgent">
            ⚠️ 신중히!
          </div>
        )}
      </div>
    </div>
  );
}
