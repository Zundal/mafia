"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameState, Player } from "@/lib/types";
import PhaseIndicator from "@/app/components/PhaseIndicator";
import RoleCard from "@/app/components/RoleCard";
import VotePanel from "@/app/components/VotePanel";
import MissionCard from "@/app/components/MissionCard";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("gameId");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      router.push("/");
      return;
    }

    // 로컬 스토리지에서 현재 플레이어 ID 가져오기
    const savedPlayerId = localStorage.getItem(`player-${gameId}`);
    if (savedPlayerId) {
      setCurrentPlayerId(savedPlayerId);
    }

    fetchGameState();
    const interval = setInterval(fetchGameState, 2000); // 2초마다 상태 업데이트

    return () => clearInterval(interval);
  }, [gameId, router]);

  const fetchGameState = async () => {
    try {
      const response = await fetch("/api/game");
      const data = await response.json();
      if (data.error) {
        // 게임이 시작되지 않았을 때
        setLoading(false);
        // 게임이 없으면 홈으로 리다이렉트
        if (data.error === "게임이 시작되지 않았습니다.") {
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
        return;
      }
      setGameState(data);
      setLoading(false);
    } catch (error) {
      console.error("게임 상태를 가져오는데 실패했습니다:", error);
      setLoading(false);
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  const handleNightAction = async (actionType: "kill" | "investigate" | "protect") => {
    if (!gameState || !currentPlayerId || !selectedPlayerId) return;

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nightAction",
          type: actionType,
          playerId: currentPlayerId,
          target: selectedPlayerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
        setSelectedPlayerId(null);
      }
    } catch (error) {
      alert("액션 실행 중 오류가 발생했습니다.");
    }
  };

  const handleEndNight = async () => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "endNight" }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      alert("밤 페이즈 종료 중 오류가 발생했습니다.");
    }
  };

  const handleStartVoting = async () => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startVoting" }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      alert("투표 시작 중 오류가 발생했습니다.");
    }
  };

  const handleVote = async (voterId: string, targetId: string) => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote",
          voterId,
          targetId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      alert("투표 중 오류가 발생했습니다.");
    }
  };

  const handleStartNight = async () => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startNight" }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (error) {
      alert("밤 페이즈 시작 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-200 text-xl font-medium mb-4">게임을 불러오는 중...</div>
          <div className="text-slate-400 text-sm">잠시만 기다려주세요</div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-xl font-medium mb-4">게임을 찾을 수 없습니다</div>
          <div className="text-slate-300 text-sm mb-6">게임이 생성되지 않았거나 초기화되었습니다.</div>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = currentPlayerId
    ? gameState.players.find((p) => p.id === currentPlayerId)
    : null;

  const handlePlayerSelect = async (playerId: string) => {
    setCurrentPlayerId(playerId);
    if (gameId) {
      localStorage.setItem(`player-${gameId}`, playerId);
    }
    
    // 준비 상태로 변경
    try {
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ready",
          playerId,
        }),
      });
    } catch (error) {
      console.error("준비 상태 업데이트 실패:", error);
    }
  };

  // 플레이어 선택 화면
  if (!currentPlayerId) {
    const readyCount = gameState.players.filter((p) => p.ready).length;
    const allReady = readyCount === gameState.players.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
          >
            ← 홈으로
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center mb-6">
            🍷 집들이 미스터리
          </h1>
          <div className="glass rounded-2xl p-5 mb-6 border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-cyan-400 font-bold text-center mb-2 text-lg">
              👤 플레이어 선택
            </p>
            <p className="text-slate-300 text-center mb-2 text-sm">
              아래 목록에서 <span className="text-cyan-400 font-semibold">당신의 이름</span>을 선택하세요
            </p>
            <p className="text-slate-400 text-xs text-center">
              각 플레이어는 자신의 이름을 선택해야 합니다
            </p>
          </div>
          <div className="text-center mb-6">
            <p className="text-slate-400 text-sm">
              준비 완료: <span className="text-cyan-400 font-bold">{readyCount}</span> / {gameState.players.length}
            </p>
            {allReady && (
              <p className="text-green-400 text-sm font-semibold mt-2 animate-pulse">
                ✨ 모든 플레이어가 준비되었습니다!
              </p>
            )}
          </div>
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                disabled={player.ready}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  player.ready
                    ? "glass border-green-500/50 bg-green-500/10 cursor-not-allowed"
                    : "glass-light hover:bg-slate-800/50 text-slate-100 border-slate-700/50 hover:border-slate-600/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{player.name}</span>
                  {player.ready && (
                    <span className="text-green-400 text-sm font-semibold">✓ 준비 완료</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 게임 종료 화면
  if (gameState.phase === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <div className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
            <h2 className="text-4xl font-bold text-center mb-6">
              {gameState.winner === "citizens" && <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">🎉 시민 팀 승리!</span>}
              {gameState.winner === "mafia" && <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">🍷 마피아 팀 승리!</span>}
              {gameState.winner === "drunkard" && <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">🥴 만취객 승리!</span>}
            </h2>
            <div className="space-y-2 mb-4">
              {gameState.history.map((event, index) => (
                <p key={index} className="text-slate-300 text-sm leading-relaxed">
                  {event}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <RoleCard
                key={player.id}
                player={player}
                showRole={true}
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            새 게임 시작
          </button>
        </div>
      </div>
    );
  }

  // 밤 페이즈
  if (gameState.phase === "night") {
    const canAct = currentPlayer?.role === "mafia" || 
                   currentPlayer?.role === "police" || 
                   currentPlayer?.role === "doctor";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          
          {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

          {canAct ? (
            <div className="glass rounded-2xl p-6 mb-4 border border-slate-700/50">
              <h3 className="text-slate-100 font-bold text-lg mb-5">
                {currentPlayer.role === "mafia" && "🍷 제거할 대상을 선택하세요"}
                {currentPlayer.role === "police" && "🕵️ 조사할 대상을 선택하세요"}
                {currentPlayer.role === "doctor" && "🧹 보호할 대상을 선택하세요"}
              </h3>
              <div className="space-y-2.5 mb-5">
                {gameState.players
                  .filter((p) => p.isAlive && p.id !== currentPlayerId)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedPlayerId === player.id
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25"
                          : "glass-light text-slate-100 hover:bg-slate-800/50 border border-slate-700/50"
                      }`}
                    >
                      {player.name}
                    </button>
                  ))}
              </div>
              {selectedPlayerId && (
                <button
                  onClick={() => {
                    if (currentPlayer.role === "mafia") {
                      handleNightAction("kill");
                    } else if (currentPlayer.role === "police") {
                      handleNightAction("investigate");
                    } else if (currentPlayer.role === "doctor") {
                      handleNightAction("protect");
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25"
                >
                  확인
                </button>
              )}
              {currentPlayer.role === "police" && 
               gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                <div className="mt-5 p-4 glass border-cyan-500/30 rounded-xl">
                  <p className="font-bold text-slate-100">
                    {gameState.nightActions.investigate.result ? "범인입니다! 🍷" : "범인이 아닙니다."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 mb-4 border border-slate-700/50">
              <p className="text-slate-200 text-center font-medium">
                {currentPlayer?.role === "drunkard" || currentPlayer?.role === "citizen"
                  ? "🌙 밤입니다. 푹 주무세요..."
                  : "다른 플레이어의 차례를 기다리는 중..."}
              </p>
            </div>
          )}

          {/* 사회자용 버튼 (모든 액션이 완료되면) */}
          <button
            onClick={handleEndNight}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
          >
            밤 페이즈 종료
          </button>
        </div>
      </div>
    );
  }

  // 낮 페이즈
  if (gameState.phase === "day") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          
          <div className="glass rounded-2xl p-6 mb-6 border border-slate-700/50">
            <h3 className="text-slate-100 font-bold text-lg mb-4">📰 아침 뉴스</h3>
            <div className="space-y-2">
              {gameState.history.slice(-3).map((event, index) => (
                <p key={index} className="text-slate-300 text-sm leading-relaxed">
                  {event}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {gameState.players.map((player) => (
              <RoleCard
                key={player.id}
                player={player}
                showRole={false}
                isCurrentPlayer={player.id === currentPlayerId}
              />
            ))}
          </div>

          <button
            onClick={handleStartVoting}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/25"
          >
            투표 시작
          </button>
        </div>
      </div>
    );
  }

  // 투표 페이즈
  if (gameState.phase === "voting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          
          <VotePanel
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onVote={handleVote}
          />

          <div className="mt-6 space-y-2.5">
            {gameState.players
              .filter((p) => p.isAlive)
              .map((player) => (
                <div
                  key={player.id}
                  className="glass rounded-xl p-4 text-slate-100 border border-slate-700/50"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm">
                      {player.votedFor ? (
                        <span className="text-green-400 font-medium">✓ 투표 완료</span>
                      ) : (
                        <span className="text-slate-400">⏳ 대기 중</span>
                      )}
                      {gameState.voteResults?.[player.id] && (
                        <span className="ml-2 text-cyan-400 font-medium">
                          ({gameState.voteResults[player.id]}표)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // 설정 페이즈
  const readyCount = gameState.players.filter((p) => p.ready).length;
  const allReady = readyCount === gameState.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-2 px-4 rounded-lg transition-all border border-slate-700/50 text-sm flex items-center gap-2"
        >
          ← 홈으로
        </button>
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
        
        {!allReady && (
          <div className="glass rounded-2xl p-5 mb-4 border border-amber-500/30 bg-amber-500/10">
            <p className="text-amber-400 text-center font-medium mb-2">
              ⏳ 모든 플레이어가 준비할 때까지 기다리는 중...
            </p>
            <p className="text-slate-300 text-sm text-center">
              준비 완료: <span className="text-cyan-400 font-bold">{readyCount}</span> / {gameState.players.length}
            </p>
          </div>
        )}

        <div className="glass rounded-2xl p-6 mb-6 border border-slate-700/50">
          <h3 className="text-slate-100 font-bold text-lg mb-4">역할 배정</h3>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            각 플레이어는 자신의 역할을 확인한 후, 폰을 다음 사람에게 넘겨주세요.
          </p>
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <div key={player.id} className="relative">
                <RoleCard
                  player={player}
                  showRole={player.id === currentPlayerId}
                  isCurrentPlayer={player.id === currentPlayerId}
                />
                {player.ready && (
                  <span className="absolute top-2 right-2 text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">
                    ✓ 준비
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        <button
          onClick={handleStartNight}
          disabled={!allReady}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg ${
            allReady
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          {allReady ? "첫 밤 시작" : `모든 플레이어 준비 대기 중... (${readyCount}/${gameState.players.length})`}
        </button>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-200 text-xl font-medium mb-4">게임을 불러오는 중...</div>
          <div className="text-slate-400 text-sm">잠시만 기다려주세요</div>
        </div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}
