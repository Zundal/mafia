"use client";

import { Player } from "@/lib/types";
import { roles } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  player: Player;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
}

const teamBadgeVariant: Record<string, "mafia" | "citizen" | "solo"> = {
  mafia: "mafia",
  citizens: "citizen",
  solo: "solo",
};

const teamLabel: Record<string, string> = {
  mafia: "마피아 팀",
  citizens: "시민 팀",
  solo: "개인전",
};

export default function RoleCard({ player, showRole = false, isCurrentPlayer = false }: RoleCardProps) {
  const roleInfo = player.role ? roles[player.role] : null;

  return (
    <Card
      className={cn(
        "p-4 sm:p-5 transition-all",
        isCurrentPlayer
          ? "border-cyan-500/50 shadow-lg glow-cyan ring-1 ring-cyan-500/20"
          : player.isAlive
          ? "border-slate-700/40 hover:border-slate-600/60"
          : "border-red-900/40 opacity-50 bg-red-950/10"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCurrentPlayer && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          )}
          <h3 className={cn("font-bold", isCurrentPlayer ? "text-white text-base" : "text-slate-200 text-sm sm:text-base")}>
            {player.name || <span className="text-slate-600 italic text-sm">대기 중...</span>}
          </h3>
          {isCurrentPlayer && (
            <Badge variant="info" className="text-[10px] px-1.5 py-0.5">나</Badge>
          )}
        </div>
        {!player.isAlive && (
          <Badge variant="destructive">💀 탈락</Badge>
        )}
      </div>

      {showRole && roleInfo && (
        <div className="mt-4 pt-3 border-t border-slate-700/40">
          <div className={cn(
            "rounded-xl p-3 border",
            roleInfo.team === "mafia" ? "border-red-500/40 bg-red-500/5" :
            roleInfo.team === "citizens" ? "border-cyan-500/30 bg-cyan-500/5" :
            "border-amber-500/40 bg-amber-500/5"
          )}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">{roleInfo.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-100 font-bold text-sm">{roleInfo.name}</span>
                  <Badge variant={teamBadgeVariant[roleInfo.team]}>
                    {teamLabel[roleInfo.team]}
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{roleInfo.winCondition}</p>
              </div>
            </div>
            <Separator glow className="mb-2" />
            <p className="text-slate-300 text-xs leading-relaxed">{roleInfo.action}</p>
          </div>
        </div>
      )}

      {player.mission && (
        <div className="mt-3 pt-3 border-t border-slate-700/40">
          <p className="text-cyan-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
            <span>🎭</span> 히든 미션
          </p>
          <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/50 rounded-xl p-3 border border-slate-700/30">
            {player.mission}
          </p>
        </div>
      )}
    </Card>
  );
}
