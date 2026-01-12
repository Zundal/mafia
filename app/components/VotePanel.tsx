"use client";

import { useState } from "react";
import { Player, GameState } from "@/lib/types";

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
      <div className="glass border-red-500/30 text-slate-100 p-5 rounded-2xl">
        <p className="font-medium">당신은 이미 탈락했습니다.</p>
      </div>
    );
  }

  if (currentPlayer.votedFor) {
    const votedPlayer = gameState.players.find((p) => p.id === currentPlayer.votedFor);
    return (
      <div className="glass border-green-500/30 text-slate-100 p-5 rounded-2xl">
        <p className="font-medium">이미 {votedPlayer?.name}님에게 투표하셨습니다.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-slate-100 font-bold text-lg mb-5">투표할 사람을 선택하세요</h3>
      <div className="space-y-2.5 mb-5">
        {alivePlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelectedTarget(player.id)}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              selectedTarget === player.id
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25"
                : "glass-light text-slate-100 hover:bg-slate-800/50 border border-slate-700/50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{player.name}</span>
              {gameState.voteResults && gameState.voteResults[player.id] && (
                <span className="text-sm font-medium opacity-80">
                  ({gameState.voteResults[player.id]}표)
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleVote}
        disabled={!selectedTarget}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:shadow-none"
      >
        투표하기
      </button>
    </div>
  );
}
