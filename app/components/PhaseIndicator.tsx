"use client";

import { Phase } from "@/lib/types";
import { Play, Moon, Sun, Gavel, Mask } from "./icons";

interface PhaseIndicatorProps {
  phase: Phase;
  currentNight?: number;
}

type PhaseMeta = {
  label: string;
  subLabel: string;
  Icon: typeof Moon;
  accent: string;   // 강조색 (아이콘/하이라이트)
  tint: string;     // 배너 배경 틴트
};

export default function PhaseIndicator({ phase, currentNight = 0 }: PhaseIndicatorProps) {
  const meta: Record<Phase, PhaseMeta> = {
    setup: {
      label: "게임 준비",
      subLabel: "손님들이 모이고 있습니다",
      Icon: Play,
      accent: "#E8B864",
      tint: "rgba(232,184,100,0.10)",
    },
    night: {
      label: `밤${currentNight > 0 ? ` ${currentNight}` : ""}`,
      subLabel: "모두가 잠든 사이, 누군가 움직인다",
      Icon: Moon,
      accent: "#9DB1D6",
      tint: "rgba(120,140,190,0.12)",
    },
    day: {
      label: `낮${currentNight > 0 ? ` ${currentNight}` : ""}`,
      subLabel: "밤사이 무슨 일이 있었을까",
      Icon: Sun,
      accent: "#E8A24C",
      tint: "rgba(232,162,76,0.10)",
    },
    voting: {
      label: "투표 시간",
      subLabel: "범인은 누구일까, 신중하게",
      Icon: Gavel,
      accent: "#C2495A",
      tint: "rgba(194,73,90,0.12)",
    },
    ended: {
      label: "게임 종료",
      subLabel: "진실이 밝혀졌습니다",
      Icon: Mask,
      accent: "#A89478",
      tint: "rgba(168,148,120,0.10)",
    },
  };

  const info = meta[phase];
  const { Icon } = info;

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-5 px-4 py-3.5"
      style={{
        background: `linear-gradient(180deg, ${info.tint}, rgba(13,10,6,0.6))`,
        border: "1px solid var(--line-strong)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
      }}
    >
      {/* 상단 강조 하이라이트 */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${info.accent}55, transparent)` }}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${info.accent}40`, color: info.accent }}
          >
            <Icon size={20} />
          </div>
          <div>
            <p className="font-display text-lg leading-tight" style={{ color: "var(--ink)" }}>{info.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{info.subLabel}</p>
          </div>
        </div>

        {phase === "night" && (
          <div className="flex gap-1 items-end opacity-70">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full star"
                style={{ height: `${6 + i * 4}px`, background: info.accent, animationDelay: `${i * 0.4}s`, animationDuration: `${1.5 + i * 0.5}s` }}
              />
            ))}
          </div>
        )}
        {phase === "voting" && (
          <span className="eyebrow animate-urgent" style={{ color: info.accent }}>신중히</span>
        )}
      </div>
    </div>
  );
}
