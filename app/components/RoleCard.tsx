"use client";

import { Player } from "@/lib/types";
import { roles } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { roleGlyph, Mask } from "./icons";

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

// 팀별 강조색
const teamAccent: Record<string, string> = {
  mafia: "#C2495A",
  citizens: "#86B07C",
  solo: "#E8B864",
};

export default function RoleCard({ player, showRole = false, isCurrentPlayer = false }: RoleCardProps) {
  const roleInfo = player.role ? roles[player.role] : null;
  const Glyph = player.role ? roleGlyph[player.role] : null;
  const accent = roleInfo ? teamAccent[roleInfo.team] : "#A89478";

  return (
    <Card
      className={cn(
        "p-4 sm:p-5 transition-all",
        isCurrentPlayer
          ? "ring-1"
          : player.isAlive
          ? "hover:border-[var(--line-strong)]"
          : "opacity-50"
      )}
      style={
        isCurrentPlayer
          ? { borderColor: "rgba(232,184,100,0.45)", boxShadow: "0 0 22px rgba(232,184,100,0.12)", ["--tw-ring-color" as string]: "rgba(232,184,100,0.2)" }
          : !player.isAlive
          ? { borderColor: "rgba(194,73,90,0.3)", background: "rgba(76,18,22,0.08)" }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCurrentPlayer && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: "var(--candle)" }} />
          )}
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: isCurrentPlayer ? "var(--ink)" : "var(--ink-muted)" }}>
            {player.name || <span className="italic text-sm" style={{ color: "var(--ink-faint)" }}>대기 중…</span>}
          </h3>
          {isCurrentPlayer && (
            <Badge variant="info" className="text-[10px] px-1.5 py-0.5">나</Badge>
          )}
        </div>
        {!player.isAlive && <Badge variant="destructive">탈락</Badge>}
      </div>

      {showRole && roleInfo && (
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="rounded-xl p-3" style={{ border: `1px solid ${accent}40`, background: `${accent}0d` }}>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${accent}40`, color: accent }}
              >
                {Glyph ? <Glyph size={18} /> : null}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: "var(--ink)" }}>{roleInfo.name}</span>
                  <Badge variant={teamBadgeVariant[roleInfo.team]}>{teamLabel[roleInfo.team]}</Badge>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{roleInfo.winCondition}</p>
              </div>
            </div>
            <Separator glow className="mb-2" />
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>{roleInfo.action}</p>
          </div>
        </div>
      )}

      {player.mission && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "var(--candle)" }}>
            <Mask size={13} /> 히든 미션
          </p>
          <p className="text-xs leading-relaxed rounded-xl p-3" style={{ color: "var(--ink-muted)", background: "rgba(233,222,201,0.04)", border: "1px solid var(--line)" }}>
            {player.mission}
          </p>
        </div>
      )}
    </Card>
  );
}
