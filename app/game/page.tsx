"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameState, Player } from "@/lib/types";
import PhaseIndicator from "@/app/components/PhaseIndicator";
import RoleCard from "@/app/components/RoleCard";
import VotePanel from "@/app/components/VotePanel";
import MissionCard from "@/app/components/MissionCard";
import MusicPlayer from "@/app/components/MusicPlayer";
import { ToastContainer, toast } from "@/app/components/Toast";

function LoadingScreen() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl animate-float-delayed" />
      </div>
      <div className="relative text-center animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-cyan-500/20 scale-150" />
            <div className="relative spinner" />
          </div>
        </div>
        <div className="text-slate-200 text-lg font-medium mb-2">게임을 불러오는 중...</div>
        <div className="text-slate-500 text-sm">잠시만 기다려주세요</div>
      </div>
    </div>
  );
}

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("gameId");
  const isHost = searchParams.get("host") === "true";
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    if (!gameId) {
      router.push("/");
      return;
    }

    const savedPlayerId = localStorage.getItem(`player-${gameId}`);
    if (savedPlayerId) setCurrentPlayerId(savedPlayerId);

    fetchGameState();
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId, router]);

  const fetchGameState = async () => {
    try {
      const response = await fetch("/api/game");
      const data = await response.json();
      if (data.error) {
        setLoading(false);
        if (data.error === "게임이 시작되지 않았습니다.") {
          setTimeout(() => router.push("/"), 2000);
        }
        return;
      }
      setGameState(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (playerId: string) => setSelectedPlayerId(playerId);

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
    } catch {
      toast("액션 실행 중 오류가 발생했습니다.", "error");
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
    } catch {
      toast("밤 페이즈 종료 중 오류가 발생했습니다.", "error");
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
    } catch {
      toast("투표 시작 중 오류가 발생했습니다.", "error");
    }
  };

  const handleVote = async (voterId: string, targetId: string) => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", voterId, targetId }),
      });
      if (response.ok) {
        const data = await response.json();
        setGameState(data);
        toast("투표가 완료되었습니다.", "success");
      }
    } catch {
      toast("투표 중 오류가 발생했습니다.", "error");
    }
  };

  const handleStartGame = async () => {
    try {
      const startResponse = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startGame" }),
      });
      if (startResponse.ok) {
        const startData = await startResponse.json();
        setGameState(startData);
        toast("역할이 배정되었습니다!", "success");
      } else {
        const error = await startResponse.json();
        toast(error.error || "게임 시작에 실패했습니다.", "error");
      }
    } catch {
      toast("게임 시작 중 오류가 발생했습니다.", "error");
    }
  };

  const handleReady = async () => {
    if (!currentPlayerId) return;
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ready", playerId: currentPlayerId }),
      });
      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      } else {
        const error = await response.json();
        toast(error.error || "준비 상태 변경에 실패했습니다.", "error");
      }
    } catch {
      toast("준비 상태 변경 중 오류가 발생했습니다.", "error");
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
    } catch {
      toast("밤 페이즈 시작 중 오류가 발생했습니다.", "error");
    }
  };

  const copyLink = async () => {
    const link = typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${gameId}` : "";
    try {
      await navigator.clipboard.writeText(link);
      toast("링크가 복사되었습니다!", "success");
    } catch {
      toast("링크 복사에 실패했습니다.", "error");
    }
  };

  if (loading) return <LoadingScreen />;

  if (!gameState) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-56 h-56 bg-red-500/6 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-slate-500/6 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <div className="relative text-center max-w-md animate-fade-in-up glass-card rounded-3xl p-8 border border-slate-700/40">
          <div className="text-5xl mb-5">🔍</div>
          <div className="text-red-400 text-xl font-bold mb-3">게임을 찾을 수 없습니다</div>
          <div className="text-slate-400 text-sm mb-6 leading-relaxed">게임이 생성되지 않았거나 초기화되었습니다.</div>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25 glow-cyan active:scale-95"
          >
            홈으로 돌아가기
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  const currentPlayer = currentPlayerId
    ? gameState.players.find((p) => p.id === currentPlayerId)
    : null;

  const handleJoin = async () => {
    if (!playerName.trim()) {
      toast("이름을 입력해주세요.", "warning");
      return;
    }
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", playerName: playerName.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.joinedPlayerId) {
        setCurrentPlayerId(data.joinedPlayerId);
        if (gameId) localStorage.setItem(`player-${gameId}`, data.joinedPlayerId);
        setPlayerName("");
        fetchGameState();
      } else {
        toast(data.error || "게임 참여에 실패했습니다.", "error");
      }
    } catch {
      toast("게임 참여 중 오류가 발생했습니다.", "error");
    }
  };

  // 플레이어 참여 화면
  if (!currentPlayerId) {
    const joinedPlayers = gameState.players.filter((p) => p.name !== "");
    const allJoined = joinedPlayers.length === 6;

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-cyan-500/6 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-56 h-56 bg-blue-500/6 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 hover:border-slate-600 text-sm flex items-center gap-2 active:scale-95"
          >
            ← 홈으로
          </button>
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              🍷 집들이 미스터리
            </h1>
            <div className="divider-glow mt-3" />
          </div>
          <div className="glass-card rounded-2xl p-5 mb-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 to-blue-500/5 animate-fade-in-up">
            <p className="text-cyan-400 font-bold text-center mb-2">👤 플레이어 참여</p>
            {isHost && (
              <p className="text-amber-400 text-center mb-2 text-sm font-semibold">
                🎮 호스트: 먼저 당신의 이름을 입력하세요
              </p>
            )}
            <p className="text-slate-300 text-center text-sm">
              <span className="text-cyan-400 font-semibold">당신의 이름</span>을 입력하세요
            </p>
          </div>

          <div className="text-center mb-5">
            <p className="text-slate-400 text-sm">
              참여 완료: <span className="text-cyan-400 font-bold">{joinedPlayers.length}</span> / 6
            </p>
            {allJoined && (
              <p className="text-green-400 text-sm font-semibold mt-2 animate-pulse">
                ✨ 모든 플레이어가 참여했습니다!
              </p>
            )}
          </div>

          <div className="mb-5">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              placeholder="당신의 이름을 입력하세요"
              className="w-full px-4 py-3.5 rounded-xl glass-light text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-lg transition-all"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || allJoined}
            className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg active:scale-95 ${
              !playerName.trim() || allJoined
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/25"
            }`}
          >
            {allJoined ? "게임이 가득 찼습니다" : "참여하기"}
          </button>

          {/* 참여자 목록 */}
          <div className="mt-6 space-y-2">
            <p className="text-slate-400 text-sm text-center mb-3">참여한 플레이어 ({joinedPlayers.length}/6):</p>
            {joinedPlayers.length > 0 ? (
              joinedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="glass border-green-500/20 bg-green-500/8 rounded-xl p-3 text-slate-100 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 text-xs font-semibold">#{index + 1}</span>
                      <span className="font-medium">{player.name}</span>
                      {index === 0 && (
                        <span className="text-amber-400 text-xs font-semibold bg-amber-500/20 px-2 py-0.5 rounded-full">
                          호스트
                        </span>
                      )}
                    </div>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center">아직 참여한 플레이어가 없습니다</p>
            )}
          </div>

          {/* 호스트 링크 공유 */}
          {isHost && joinedPlayers.length > 0 && (
            <div className="mt-4 glass rounded-xl p-4 border border-cyan-500/30 bg-cyan-500/10">
              <p className="text-cyan-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
              <div className="bg-slate-900/50 rounded-lg p-2 mb-2 border border-slate-700/50">
                <p className="text-slate-300 text-xs font-mono break-all text-center">
                  {typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${gameId}` : ""}
                </p>
              </div>
              <button
                onClick={copyLink}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all active:scale-95"
              >
                📋 링크 복사
              </button>
            </div>
          )}
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 게임 종료 화면
  if (gameState.phase === "ended") {
    const winnerGlow = gameState.winner === "citizens" ? "bg-green-500/8" : gameState.winner === "mafia" ? "bg-red-500/8" : "bg-amber-500/8";
    const winnerOrb1 = gameState.winner === "citizens" ? "bg-green-500/10" : gameState.winner === "mafia" ? "bg-red-500/10" : "bg-amber-500/10";
    const winnerOrb2 = gameState.winner === "citizens" ? "bg-emerald-500/8" : gameState.winner === "mafia" ? "bg-rose-500/8" : "bg-orange-500/8";
    return (
      <div className={`relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-3 sm:p-4 overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-0 right-0 h-64 ${winnerGlow} blur-3xl`} />
          <div className={`absolute top-1/4 right-[-5%] w-64 h-64 ${winnerOrb1} rounded-full blur-3xl animate-float`} />
          <div className={`absolute bottom-1/4 left-[-5%] w-48 h-48 ${winnerOrb2} rounded-full blur-3xl animate-float-delayed`} />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 text-sm flex items-center gap-2 active:scale-95"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 border border-slate-700/40 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2">
              {gameState.winner === "citizens" && <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-glow-cyan">🎉 시민 팀 승리!</span>}
              {gameState.winner === "mafia" && <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent text-glow-red">🍷 마피아 팀 승리!</span>}
              {gameState.winner === "drunkard" && <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent text-glow-amber">🥴 만취객 승리!</span>}
            </h2>
            <div className="divider-glow my-4" />
            <div className="space-y-2 mb-4">
              {gameState.history.map((event, index) => (
                <p key={index} className="text-slate-300 text-sm leading-relaxed border-l-2 border-slate-700/50 pl-3">{event}</p>
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
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            새 게임 시작
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 밤 페이즈
  if (gameState.phase === "night") {
    const canAct = currentPlayer?.role === "mafia" ||
                   currentPlayer?.role === "police" ||
                   currentPlayer?.role === "doctor";
    const alivePlayers = gameState.players.filter((p) => p.isAlive);
    const needsActionPlayers = alivePlayers.filter((p) =>
      p.role === "mafia" || p.role === "police" || p.role === "doctor"
    );
    const readyCount = needsActionPlayers.filter((p) => p.ready).length;
    const allReady = needsActionPlayers.length > 0 && needsActionPlayers.every((p) => p.ready);
    const hasCompletedAction = currentPlayer && canAct && currentPlayer.ready;

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-3 sm:p-4 overflow-hidden">
        {/* 밤 앰비언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-5%] right-[10%] w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] left-[-5%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-[40%] right-[-10%] w-48 h-48 bg-violet-500/8 rounded-full blur-3xl animate-float-slow" />
          {/* 별빛 효과 */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/40 star"
              style={{
                top: `${10 + i * 11}%`,
                left: `${5 + i * 12}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.4}s`,
              }}
            />
          ))}
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 text-sm flex items-center gap-2 active:scale-95"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

          {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

          {canAct ? (
            <div className="glass-card rounded-2xl p-5 sm:p-6 mb-4 border border-purple-500/20 animate-fade-in-up">
              {hasCompletedAction ? (
                <div className="text-center">
                  <div className="mb-4 p-4 glass border-green-500/30 bg-green-500/10 rounded-xl">
                    <p className="text-green-400 font-bold text-lg mb-2">✓ 액션 완료</p>
                    <p className="text-slate-300 text-sm">다른 플레이어들이 준비할 때까지 기다려주세요</p>
                  </div>
                  {currentPlayer.role === "police" &&
                   gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                    <div className="mt-4 p-4 glass border-cyan-500/30 rounded-xl">
                      <p className="font-bold text-slate-100">
                        {gameState.nightActions.investigate.result ? "범인입니다! 🍷" : "범인이 아닙니다."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                          className={`w-full p-4 rounded-xl text-left transition-all active:scale-95 ${
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
                        if (currentPlayer.role === "mafia") handleNightAction("kill");
                        else if (currentPlayer.role === "police") handleNightAction("investigate");
                        else if (currentPlayer.role === "doctor") handleNightAction("protect");
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25 active:scale-95"
                    >
                      확인
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 mb-4 border border-indigo-500/20 text-center animate-fade-in-up">
              <div className="text-4xl mb-3">
                {currentPlayer?.role === "drunkard" || currentPlayer?.role === "citizen" ? "😴" : "⏳"}
              </div>
              <p className="text-slate-200 font-medium">
                {currentPlayer?.role === "drunkard" || currentPlayer?.role === "citizen"
                  ? "🌙 밤입니다. 푹 주무세요..."
                  : "다른 플레이어의 차례를 기다리는 중..."}
              </p>
              {(currentPlayer?.role === "drunkard" || currentPlayer?.role === "citizen") && (
                <p className="text-slate-500 text-xs mt-2">다른 플레이어들이 행동을 완료할 때까지 화면을 보지 마세요</p>
              )}
            </div>
          )}

          {/* 준비 상태 */}
          {needsActionPlayers.length > 0 && (
            <div className="glass rounded-xl p-4 mb-4 border border-slate-700/50">
              <p className="text-slate-300 text-center text-sm mb-2">
                준비 완료: <span className="text-cyan-400 font-bold">{readyCount}</span> / {needsActionPlayers.length}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {needsActionPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      player.ready
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/50"
                    }`}
                  >
                    {player.name} {player.ready ? "✓" : "⏳"}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleEndNight}
            disabled={!allReady}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 ${
              allReady
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {allReady ? "밤 페이즈 종료" : `모든 플레이어 준비 대기 중... (${readyCount}/${needsActionPlayers.length})`}
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 낮 페이즈
  if (gameState.phase === "day") {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 p-3 sm:p-4 overflow-hidden">
        {/* 낮 앰비언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-96 h-48 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute top-[5%] right-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[15%] left-[5%] w-48 h-48 bg-amber-600/8 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 text-sm flex items-center gap-2 active:scale-95"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

          <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6 border border-amber-500/20 animate-fade-in-up">
            <h3 className="text-amber-300 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-base">📰</span>
              아침 뉴스
            </h3>
            <div className="space-y-2.5">
              {gameState.history.slice(-3).map((event, index) => (
                <p key={index} className="text-slate-300 text-sm leading-relaxed border-l-2 border-amber-500/30 pl-3">{event}</p>
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
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-amber-500/30 glow-amber active:scale-95"
          >
            🗳️ 투표 시작
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 투표 페이즈
  if (gameState.phase === "voting") {
    const aliveCount = gameState.players.filter((p) => p.isAlive).length;
    const votedCount = gameState.players.filter((p) => p.isAlive && p.votedFor).length;
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 p-3 sm:p-4 overflow-hidden">
        {/* 투표 앰비언트 - 긴장감 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[5%] left-[-5%] w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/6 rounded-full blur-3xl animate-urgent" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <button
            onClick={() => router.push("/")}
            className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 text-sm flex items-center gap-2 active:scale-95"
          >
            ← 홈으로
          </button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

          {/* 투표 진행률 */}
          <div className="glass-card rounded-2xl p-4 mb-4 border border-pink-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium">투표 현황</span>
              <span className="text-pink-400 text-sm font-bold">{votedCount} / {aliveCount}명</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <VotePanel
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onVote={handleVote}
          />

          <div className="mt-4 space-y-2">
            <p className="text-slate-500 text-xs text-center mb-2">생존자 투표 현황</p>
            {gameState.players
              .filter((p) => p.isAlive)
              .map((player) => (
                <div
                  key={player.id}
                  className={`glass rounded-xl p-3.5 text-slate-100 border transition-all ${
                    player.votedFor ? "border-green-500/20 bg-green-500/5" : "border-slate-700/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{player.name}</span>
                    <span className="text-sm flex items-center gap-2">
                      {player.votedFor ? (
                        <span className="text-green-400 text-xs font-semibold bg-green-500/15 px-2 py-0.5 rounded-full">✓ 투표 완료</span>
                      ) : (
                        <span className="text-slate-500 text-xs">⏳ 대기 중</span>
                      )}
                      {gameState.voteResults?.[player.id] && (
                        <span className="text-pink-400 font-bold text-xs bg-pink-500/15 px-2 py-0.5 rounded-full">
                          {gameState.voteResults[player.id]}표
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 설정 페이즈
  const joinedPlayers = gameState.players.filter((p) => p.name !== "");
  const allJoined = joinedPlayers.length === 6;
  const readyCount = gameState.players.filter((p) => p.ready).length;
  const allReady = readyCount === gameState.players.length;
  const gameStarted = gameState.status === "playing" && gameState.players[0]?.role !== null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-3 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[10%] w-64 h-64 bg-cyan-500/6 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[10%] left-[5%] w-56 h-56 bg-blue-500/6 rounded-full blur-3xl animate-float-delayed" />
      </div>
      <ToastContainer />
      <div className="relative max-w-2xl mx-auto pb-28">
        <button
          onClick={() => router.push("/")}
          className="mb-4 glass-light hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-slate-700/50 text-sm flex items-center gap-2 active:scale-95"
        >
          ← 홈으로
        </button>
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

        {!allJoined && (
          <div className="glass rounded-2xl p-5 mb-4 border border-amber-500/30 bg-amber-500/10 animate-fade-in-up">
            <p className="text-amber-400 text-center font-medium mb-1.5">
              ⏳ 모든 플레이어가 참여할 때까지 기다리는 중...
            </p>
            <p className="text-slate-300 text-sm text-center">
              참여 완료: <span className="text-cyan-400 font-bold">{joinedPlayers.length}</span> / 6
            </p>
          </div>
        )}

        {allJoined && !gameStarted && (
          <div className="glass rounded-2xl p-5 mb-4 border border-green-500/30 bg-green-500/10 animate-fade-in-up">
            <p className="text-green-400 text-center font-medium mb-1">✨ 모든 플레이어가 참여했습니다!</p>
            <p className="text-slate-300 text-sm text-center">"게임 시작" 버튼을 눌러 역할을 배정하세요</p>
          </div>
        )}

        {gameStarted && !allReady && (
          <div className="glass rounded-2xl p-5 mb-4 border border-amber-500/30 bg-amber-500/10">
            <p className="text-amber-400 text-center font-medium mb-1">
              ⏳ 모든 플레이어가 준비할 때까지 기다리는 중...
            </p>
            <p className="text-slate-300 text-sm text-center">
              준비 완료: <span className="text-cyan-400 font-bold">{readyCount}</span> / {gameState.players.length}
            </p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6 border border-slate-700/40">
          <h3 className="text-slate-100 font-bold text-lg mb-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-sm">
              {gameStarted ? "🎭" : "👥"}
            </span>
            {gameStarted ? "역할 배정" : "플레이어 목록"}
          </h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            {gameStarted
              ? "각 플레이어는 자신의 역할을 확인한 후, 폰을 다음 사람에게 넘겨주세요."
              : "모든 플레이어가 참여하면 게임을 시작할 수 있습니다."}
          </p>
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <div key={player.id} className="relative">
                <RoleCard
                  player={player}
                  showRole={gameStarted && player.id === currentPlayerId}
                  isCurrentPlayer={player.id === currentPlayerId}
                />
                {player.name === "" && (
                  <span className="absolute top-2 right-2 text-slate-500 text-xs font-semibold">대기 중...</span>
                )}
                {player.ready && gameStarted && (
                  <span className="absolute top-2 right-2 text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">
                    ✓ 준비
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        {/* 호스트 링크 공유 */}
        {isHost && !gameStarted && joinedPlayers.length > 0 && (
          <div className="mb-4 glass rounded-xl p-4 border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-cyan-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
            <button
              onClick={copyLink}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all active:scale-95"
            >
              📋 링크 복사
            </button>
          </div>
        )}

        {!gameStarted ? (
          <button
            onClick={handleStartGame}
            disabled={!allJoined}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 ${
              allJoined
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {allJoined ? "게임 시작 (역할 배정)" : `플레이어 참여 대기 중... (${joinedPlayers.length}/6)`}
          </button>
        ) : (
          <>
            {currentPlayer && !currentPlayer.ready && (
              <button
                onClick={handleReady}
                className="w-full mb-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/25 active:scale-95"
              >
                ✓ 준비 완료
              </button>
            )}
            {currentPlayer?.ready && (
              <div className="w-full mb-3 glass border-green-500/30 bg-green-500/10 rounded-xl p-4 text-center">
                <p className="text-green-400 font-semibold">✓ 준비 완료했습니다</p>
                <p className="text-slate-300 text-sm mt-1">다른 플레이어들이 준비할 때까지 기다려주세요</p>
              </div>
            )}
            <button
              onClick={handleStartNight}
              disabled={!allReady}
              className={`w-full font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 ${
                allReady
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              {allReady ? "첫 밤 시작" : `모든 플레이어 준비 대기 중... (${readyCount}/${gameState.players.length})`}
            </button>
          </>
        )}
        </div>
      </div>
      <MusicPlayer />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GamePageContent />
    </Suspense>
  );
}
