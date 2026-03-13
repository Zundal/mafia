"use client";

import { Player } from "@/lib/types";
import { roles } from "@/lib/roles";

interface RoleCardProps {
  player: Player;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
}

const teamColors: Record<string, string> = {
  mafia: "border-red-500/40 bg-red-500/5",
  citizens: "border-cyan-500/30 bg-cyan-500/5",
  solo: "border-amber-500/40 bg-amber-500/5",
};

const teamBadge: Record<string, string> = {
  mafia: "bg-red-500/20 text-red-400 border-red-500/30",
  citizens: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  solo: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function RoleCard({ player, showRole = false, isCurrentPlayer = false }: RoleCardProps) {
  const roleInfo = player.role ? roles[player.role] : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isCurrentPlayer
          ? "glass-card border-cyan-500/50 shadow-lg glow-cyan ring-1 ring-cyan-500/20"
          : player.isAlive
          ? "glass border-slate-700/40 hover:border-slate-600/60"
          : "glass border-red-900/40 opacity-50 bg-red-950/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCurrentPlayer && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          )}
          <h3 className={`font-bold ${isCurrentPlayer ? "text-white text-base" : "text-slate-200 text-sm sm:text-base"}`}>
            {player.name || <span className="text-slate-600 italic text-sm">대기 중...</span>}
          </h3>
          {isCurrentPlayer && (
            <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded-full font-medium">나</span>
          )}
        </div>
        {!player.isAlive && (
          <span className="text-red-400/80 text-xs font-medium bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">💀 탈락</span>
        )}
      </div>

      {showRole && roleInfo && (
        <div className={`mt-4 pt-3 border-t border-slate-700/40`}>
          <div className={`rounded-xl p-3 border ${teamColors[roleInfo.team]}`}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">{roleInfo.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-100 font-bold text-sm">{roleInfo.name}</span>
                  <span className={`text-[10px] border px-1.5 py-0.5 rounded-full font-medium ${teamBadge[roleInfo.team]}`}>
                    {roleInfo.team === "citizens" ? "시민 팀" : roleInfo.team === "mafia" ? "마피아 팀" : "개인전"}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{roleInfo.winCondition}</p>
              </div>
            </div>
            <div className="divider-glow mb-2" />
            <p className="text-slate-300 text-xs leading-relaxed">{roleInfo.action}</p>
          </div>
        </div>
      )}

      {player.mission && (
        <div className="mt-3 pt-3 border-t border-slate-700/40">
          <p className="text-cyan-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <span>🎭</span> 히든 미션
          </p>
          <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">{player.mission}</p>
        </div>
      )}
    </div>
  );
}
