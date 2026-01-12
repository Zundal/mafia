"use client";

interface MissionCardProps {
  mission: string;
}

export default function MissionCard({ mission }: MissionCardProps) {
  return (
    <div className="glass border-amber-500/30 rounded-2xl p-5 mb-4 bg-gradient-to-br from-amber-950/20 to-orange-950/20">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🎭</span>
        <div>
          <h4 className="text-amber-400 font-bold text-sm mb-2">히든 미션</h4>
          <p className="text-slate-200 text-sm leading-relaxed">{mission}</p>
        </div>
      </div>
    </div>
  );
}
