"use client";

import { Mask } from "./icons";

interface MissionCardProps {
  mission: string;
}

export default function MissionCard({ mission }: MissionCardProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-4 p-4"
      style={{
        background: "linear-gradient(145deg, rgba(232,184,100,0.08), rgba(13,10,6,0.5))",
        border: "1px solid rgba(232,184,100,0.2)",
      }}
    >
      <div
        className="absolute top-0 left-6 right-6 h-px border-t border-dashed"
        style={{ borderColor: "rgba(232,184,100,0.25)" }}
      />
      <div className="flex items-center gap-2 mb-2.5">
        <Mask size={16} style={{ color: "var(--candle)" }} />
        <span className="eyebrow" style={{ color: "var(--candle)" }}>히든 미션</span>
        <span className="ml-auto text-[10px]" style={{ color: "rgba(201,154,82,0.6)" }}>나만 보세요</span>
      </div>
      <p className="text-sm leading-relaxed pl-2.5 border-l-2" style={{ color: "var(--ink)", borderColor: "rgba(232,184,100,0.35)" }}>
        {mission}
      </p>
    </div>
  );
}
