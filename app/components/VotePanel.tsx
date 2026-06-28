"use client";

import { useState } from "react";
import { GameState } from "@/lib/types";
import { Gavel, Check } from "./icons";

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
        style={{ background: 'rgba(76,18,22,0.18)', border: '1px solid rgba(194,73,90,0.25)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'rgba(224,138,150,0.85)' }}>당신은 이미 탈락했습니다</p>
      </div>
    );
  }

  if (currentPlayer.votedFor) {
    const votedPlayer = gameState.players.find((p) => p.id === currentPlayer.votedFor);
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'rgba(134,176,124,0.10)', border: '1px solid rgba(134,176,124,0.25)' }}
      >
        <Check size={26} className="mx-auto mb-2" style={{ color: 'var(--team-citizen)' }} />
        <p className="text-sm font-bold mb-1" style={{ color: '#a0c596' }}>투표 완료</p>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{votedPlayer?.name}</span>님에게 투표했습니다
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(27,21,16,0.8)', border: '1px solid var(--line-strong)' }}
    >
      {/* 헤더 */}
      <div className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <Gavel size={20} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--wine-bright)' }} />
        <div>
          <h3 className="font-display text-base" style={{ color: 'var(--ink)' }}>
            범인으로 지목할 사람
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            신중하게 — 만취객이 쫓겨나면 만취객이 단독 승리합니다
          </p>
        </div>
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
                      borderColor: isSelected ? 'rgba(179,51,64,0.9)' : 'var(--line-strong)',
                      background: isSelected ? 'var(--wine)' : 'transparent',
                    }}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F4E4D0' }} />}
                  </div>
                  <span
                    className="font-semibold text-sm transition-colors"
                    style={{ color: isSelected ? '#F4E4D0' : 'var(--ink-muted)' }}
                  >
                    {player.name}
                  </span>
                </div>
                {voteCount > 0 && (
                  <span
                    className="num text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(194,73,90,0.18)', color: '#e08a96', border: '1px solid rgba(194,73,90,0.25)' }}
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
              ? 'linear-gradient(145deg, #6E141B, var(--wine))'
              : 'rgba(27,21,16,0.6)',
            color: selectedTarget ? '#F4E4D0' : 'var(--ink-faint)',
            boxShadow: selectedTarget ? '0 4px 24px rgba(140,28,36,0.4)' : 'none',
          }}
        >
          {selectedTarget ? '이 사람이 범인입니다' : '용의자를 선택하세요'}
        </button>
      </div>
    </div>
  );
}
