"use client";

import { useState } from "react";
import { GameState } from "@/lib/types";

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

  // 탈락 또는 이미 투표함
  if (!currentPlayer || !currentPlayer.isAlive) {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'rgba(30,10,10,0.6)', border: '1px solid rgba(180,50,50,0.2)' }}
      >
        <div className="text-3xl mb-2 opacity-40">💀</div>
        <p className="text-sm font-medium" style={{ color: 'rgba(200,120,100,0.8)' }}>당신은 이미 탈락했습니다.</p>
      </div>
    );
  }

  if (currentPlayer.votedFor) {
    const votedPlayer = gameState.players.find((p) => p.id === currentPlayer.votedFor);
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'rgba(10,35,10,0.6)', border: '1px solid rgba(50,160,60,0.2)' }}
      >
        <div className="text-3xl mb-2">🗳️</div>
        <p className="text-sm font-bold mb-1" style={{ color: '#80e880' }}>투표 완료</p>
        <p className="text-sm" style={{ color: 'rgba(160,210,160,0.7)' }}>
          <span style={{ color: '#c0f0c0', fontWeight: 700 }}>{votedPlayer?.name}</span>님에게 투표했습니다
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(12,6,18,0.85)', border: '1px solid rgba(120,60,160,0.2)' }}
    >
      {/* 헤더 */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid rgba(100,50,140,0.15)' }}
      >
        <h3 className="font-bold text-base mb-0.5" style={{ color: '#e0d0f0' }}>
          범인으로 지목할 사람을 선택하세요
        </h3>
        <p className="text-xs" style={{ color: 'rgba(160,120,200,0.55)' }}>
          신중하게 — 만취객이 쫓겨나면 만취객이 승리합니다
        </p>
      </div>

      {/* 용의자 목록 */}
      <div className="p-4 space-y-2">
        {alivePlayers.map((player) => {
          const voteCount = gameState.voteResults?.[player.id] ?? 0;
          const isSelected = selectedTarget === player.id;
          return (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={`suspect-card w-full rounded-xl px-4 py-3.5 text-left transition-all active:scale-[0.98] ${isSelected ? 'selected' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 선택 인디케이터 */}
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: isSelected ? 'rgba(220,70,60,0.9)' : 'rgba(120,75,40,0.35)',
                      background: isSelected ? 'rgba(200,50,40,0.8)' : 'transparent',
                    }}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span
                    className="font-semibold text-sm transition-colors"
                    style={{ color: isSelected ? '#fce8d8' : 'rgba(220,190,150,0.8)' }}
                  >
                    {player.name}
                  </span>
                </div>
                {voteCount > 0 && (
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(140,60,180,0.2)', color: '#c890f0', border: '1px solid rgba(140,60,180,0.25)' }}
                  >
                    {voteCount}표
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 투표 버튼 */}
      <div className="px-4 pb-4">
        <button
          onClick={handleVote}
          disabled={!selectedTarget}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: selectedTarget
              ? 'linear-gradient(to right, #6a1060, #a02080)'
              : 'rgba(20,12,28,0.6)',
            color: selectedTarget ? '#fce0f0' : 'rgba(160,120,200,0.4)',
            boxShadow: selectedTarget ? '0 4px 24px rgba(120,20,100,0.4)' : 'none',
          }}
        >
          {selectedTarget ? '이 사람이 범인입니다' : '용의자를 선택하세요'}
        </button>
      </div>
    </div>
  );
}
