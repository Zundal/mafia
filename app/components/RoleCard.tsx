"use client";

import { Player } from "@/lib/types";
import { roles } from "@/lib/roles";

interface RoleCardProps {
  player: Player;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
}

export default function RoleCard({ player, showRole = false, isCurrentPlayer = false }: RoleCardProps) {
  const roleInfo = player.role ? roles[player.role] : null;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isCurrentPlayer
          ? "glass border-cyan-500/50 shadow-lg shadow-cyan-500/20 scale-105 ring-2 ring-cyan-500/30"
          : player.isAlive
          ? "glass border-slate-700/50 hover:border-slate-600/50"
          : "glass border-red-500/30 opacity-60 bg-red-950/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-100">{player.name}</h3>
        {!player.isAlive && (
          <span className="text-red-400 text-sm font-medium">💀 탈락</span>
        )}
      </div>

      {showRole && roleInfo && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{roleInfo.icon}</span>
            <span className="text-slate-100 font-semibold">{roleInfo.name}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{roleInfo.action}</p>
        </div>
      )}

      {player.mission && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-cyan-400 text-xs font-semibold mb-1.5">🎭 히든 미션</p>
          <p className="text-slate-300 text-sm leading-relaxed">{player.mission}</p>
        </div>
      )}
    </div>
  );
}
