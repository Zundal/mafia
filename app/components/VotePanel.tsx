"use client";

import { useState } from "react";
import { GameState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VotePanelProps {
  gameState: GameState;
  currentPlayerId: string;
  onVote: (voterId: string, targetId: string) => void;
}

export default function VotePanel({ gameState, currentPlayerId, onVote }: VotePanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
  const alivePlayers = gameState.players.filter((p) => p.isAlive && p.id !== currentPlayerId);

  const handleVote = () => {
    if (selectedTarget && currentPlayer) {
      onVote(currentPlayer.id, selectedTarget);
    }
  };

  if (!currentPlayer || !currentPlayer.isAlive) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-5">
          <p className="text-slate-100 font-medium">당신은 이미 탈락했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (currentPlayer.votedFor) {
    const votedPlayer = gameState.players.find((p) => p.id === currentPlayer.votedFor);
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-5">
          <p className="text-slate-100 font-medium flex items-center gap-2">
            <Badge variant="success">✓ 투표 완료</Badge>
            <span className="text-slate-300">{votedPlayer?.name}님에게 투표했습니다.</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700/50">
      <CardHeader>
        <CardTitle>투표할 사람을 선택하세요</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5 mb-5">
          {alivePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all active:scale-[0.97]",
                selectedTarget === player.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25"
                  : "glass-light text-slate-100 hover:bg-slate-800/50 border border-slate-700/50"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{player.name}</span>
                {gameState.voteResults && gameState.voteResults[player.id] && (
                  <Badge variant="purple">
                    {gameState.voteResults[player.id]}표
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
        <Button
          variant="gradient-vote"
          size="xl"
          className="w-full"
          onClick={handleVote}
          disabled={!selectedTarget}
        >
          투표하기
        </Button>
      </CardContent>
    </Card>
  );
}
