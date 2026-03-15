"use client";

interface MissionCardProps {
  mission: string;
}

export default function MissionCard({ mission }: MissionCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-orange-950/20 to-stone-900/30" />
      <div className="absolute inset-0 border border-amber-600/20 rounded-2xl" />
      {/* 상단 점선 느낌 */}
      <div className="absolute top-0 left-6 right-6 h-px border-t border-dashed border-amber-600/20" />

      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-lg">🎭</span>
          <span className="text-amber-400 font-bold text-xs tracking-wider uppercase">히든 미션</span>
          <span className="ml-auto text-[10px] text-amber-600/60 font-medium">나만 보세요 👀</span>
        </div>
        <p className="text-stone-200 text-sm leading-relaxed pl-1 border-l-2 border-amber-600/30">
          {mission}
        </p>
      </div>
    </div>
  );
}
