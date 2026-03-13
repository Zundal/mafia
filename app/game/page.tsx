"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameState, Player } from "@/lib/types";
import PhaseIndicator from "@/app/components/PhaseIndicator";
import RoleCard from "@/app/components/RoleCard";
import VotePanel from "@/app/components/VotePanel";
import MissionCard from "@/app/components/MissionCard";
import MusicPlayer from "@/app/components/MusicPlayer";
import { ToastContainer, toast } from "@/app/components/Toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

// 페이즈별 제한 시간 (초) - 서버와 동일하게 맞춤
const PHASE_DURATIONS_SEC = {
  night: 60,
  day: 120,
  voting: 90,
} as const;

function PhaseTimer({ phaseEndTime, phase }: { phaseEndTime?: number; phase: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!phaseEndTime || !["night", "day", "voting"].includes(phase)) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [phaseEndTime, phase]);

  if (!phaseEndTime || !["night", "day", "voting"].includes(phase)) return null;

  const totalSec = PHASE_DURATIONS_SEC[phase as keyof typeof PHASE_DURATIONS_SEC] ?? 60;
  const pct = Math.max(0, Math.min(100, (timeLeft / totalSec) * 100));
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 30;

  const barColor = isUrgent
    ? "bg-gradient-to-r from-red-500 to-rose-500"
    : isWarning
    ? "bg-gradient-to-r from-amber-500 to-orange-500"
    : "bg-gradient-to-r from-cyan-500 to-blue-500";

  const textColor = isUrgent ? "text-red-400" : isWarning ? "text-amber-400" : "text-cyan-400";

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}초`;

  return (
    <div className={`mb-4 p-3 rounded-xl glass border ${isUrgent ? "border-red-500/40 bg-red-500/10" : isWarning ? "border-amber-500/40 bg-amber-500/10" : "border-slate-700/50"} ${isUrgent ? "animate-pulse" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium">⏱ 제한 시간</span>
        <span className={`font-bold text-base tabular-nums ${textColor}`}>
          {timeLeft === 0 ? "시간 초과!" : timeStr}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
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
  const advancingRef = useRef(false);

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

  // 타이머 만료 시 자동으로 다음 페이즈로 전환
  useEffect(() => {
    if (!gameState?.phaseEndTime) return;
    if (!["night", "day", "voting"].includes(gameState.phase)) return;

    const delay = Math.max(0, gameState.phaseEndTime - Date.now());
    const timeout = setTimeout(async () => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      try {
        const response = await fetch("/api/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "advancePhase" }),
        });
        if (response.ok) {
          const data = await response.json();
          setGameState(data);
        }
      } finally {
        advancingRef.current = false;
      }
    }, delay + 200); // 200ms 여유

    return () => clearTimeout(timeout);
  }, [gameState?.phaseEndTime, gameState?.phase]);

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
        <Card className="relative text-center max-w-md animate-fade-in-up rounded-3xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-5xl mb-5">🔍</div>
            <div className="text-red-400 text-xl font-bold mb-3">게임을 찾을 수 없습니다</div>
            <div className="text-slate-400 text-sm mb-6 leading-relaxed">게임이 생성되지 않았거나 초기화되었습니다.</div>
            <Button variant="gradient" size="lg" className="glow-cyan" onClick={() => router.push("/")}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
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
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
            ← 홈으로
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              🍷 집들이 미스터리
            </h1>
            <Separator glow className="mt-3" />
          </div>

          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 to-blue-500/5 mb-5 animate-fade-in-up">
            <CardContent className="pt-5 text-center">
              <p className="text-cyan-400 font-bold mb-2">👤 플레이어 참여</p>
              {isHost && (
                <p className="text-amber-400 mb-2 text-sm font-semibold">
                  🎮 호스트: 먼저 당신의 이름을 입력하세요
                </p>
              )}
              <p className="text-slate-300 text-sm">
                <span className="text-cyan-400 font-semibold">당신의 이름</span>을 입력하세요
              </p>
            </CardContent>
          </Card>

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

          <div className="mb-5 flex gap-2">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              placeholder="당신의 이름을 입력하세요"
              className="h-12 text-lg"
            />
            <Button
              variant="gradient"
              size="lg"
              onClick={handleJoin}
              disabled={!playerName.trim() || allJoined}
            >
              {allJoined ? "가득 참" : "참여"}
            </Button>
          </div>

          {/* 참여자 목록 */}
          <div className="space-y-2">
            <p className="text-slate-400 text-sm text-center mb-3">
              참여한 플레이어 ({joinedPlayers.length}/6):
            </p>
            {joinedPlayers.length > 0 ? (
              joinedPlayers.map((player, index) => (
                <Card
                  key={player.id}
                  variant="glass"
                  className="border-green-500/20 bg-green-500/8 p-3 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-[10px]">#{index + 1}</Badge>
                      <span className="text-slate-100 font-medium">{player.name}</span>
                      {index === 0 && (
                        <Badge variant="warning">호스트</Badge>
                      )}
                    </div>
                    <span className="text-green-400 font-bold">✓</span>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center">아직 참여한 플레이어가 없습니다</p>
            )}
          </div>

          {/* 호스트 링크 공유 */}
          {isHost && joinedPlayers.length > 0 && (
            <Card variant="glass" className="mt-4 border-cyan-500/30 bg-cyan-500/10">
              <CardContent className="pt-4">
                <p className="text-cyan-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
                <div className="bg-slate-900/50 rounded-lg p-2 mb-2 border border-slate-700/50">
                  <p className="text-slate-300 text-xs font-mono break-all text-center">
                    {typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${gameId}` : ""}
                  </p>
                </div>
                <Button variant="gradient-green" size="sm" className="w-full" onClick={copyLink}>
                  📋 링크 복사
                </Button>
              </CardContent>
            </Card>
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
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-0 right-0 h-64 ${winnerGlow} blur-3xl`} />
          <div className={`absolute top-1/4 right-[-5%] w-64 h-64 ${winnerOrb1} rounded-full blur-3xl animate-float`} />
          <div className={`absolute bottom-1/4 left-[-5%] w-48 h-48 ${winnerOrb2} rounded-full blur-3xl animate-float-delayed`} />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
            ← 홈으로
          </Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <Card className="mb-6 animate-fade-in-up">
            <CardContent className="pt-6 pb-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2">
                {gameState.winner === "citizens" && (
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-glow-cyan">
                    🎉 시민 팀 승리!
                  </span>
                )}
                {gameState.winner === "mafia" && (
                  <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent text-glow-red">
                    🍷 마피아 팀 승리!
                  </span>
                )}
                {gameState.winner === "drunkard" && (
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent text-glow-amber">
                    🥴 만취객 승리!
                  </span>
                )}
              </h2>
              <Separator glow className="my-4" />
              <div className="space-y-2">
                {gameState.history.map((event, index) => (
                  <p key={index} className="text-slate-300 text-sm leading-relaxed border-l-2 border-slate-700/50 pl-3">
                    {event}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
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
          <Button variant="gradient" size="xl" className="w-full mt-6 glow-cyan" onClick={() => router.push("/")}>
            새 게임 시작
          </Button>
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-5%] right-[10%] w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] left-[-5%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-[40%] right-[-10%] w-48 h-48 bg-violet-500/8 rounded-full blur-3xl animate-float-slow" />
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
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
            ← 홈으로
          </Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />

          {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

          {canAct ? (
            <Card className="border-purple-500/20 mb-4 animate-fade-in-up">
              <CardContent className="pt-6">
                {hasCompletedAction ? (
                  <div className="text-center">
                    <div className="mb-4 p-4 glass border-green-500/30 bg-green-500/10 rounded-xl">
                      <p className="text-green-400 font-bold text-lg mb-2">✓ 액션 완료</p>
                      <p className="text-slate-300 text-sm">다른 플레이어들이 준비할 때까지 기다려주세요</p>
                    </div>
                    {currentPlayer.role === "police" &&
                     gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                      <Card variant="glass" className="mt-4 border-cyan-500/30">
                        <CardContent className="pt-4">
                          <p className="font-bold text-slate-100">
                            {gameState.nightActions.investigate.result ? "범인입니다! 🍷" : "범인이 아닙니다."}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <>
                    <CardTitle className="mb-5">
                      {currentPlayer.role === "mafia" && "🍷 제거할 대상을 선택하세요"}
                      {currentPlayer.role === "police" && "🕵️ 조사할 대상을 선택하세요"}
                      {currentPlayer.role === "doctor" && "🧹 보호할 대상을 선택하세요"}
                    </CardTitle>
                    <div className="space-y-2.5 mb-5">
                      {gameState.players
                        .filter((p) => p.isAlive && p.id !== currentPlayerId)
                        .map((player) => (
                          <button
                            key={player.id}
                            onClick={() => handleSelectPlayer(player.id)}
                            className={cn(
                              "w-full p-4 rounded-xl text-left transition-all active:scale-[0.97]",
                              selectedPlayerId === player.id
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/25"
                                : "glass-light text-slate-100 hover:bg-slate-800/50 border border-slate-700/50"
                            )}
                          >
                            {player.name}
                          </button>
                        ))}
                    </div>
                    {selectedPlayerId && (
                      <Button
                        variant="gradient-vote"
                        size="xl"
                        className="w-full"
                        onClick={() => {
                          if (currentPlayer.role === "mafia") handleNightAction("kill");
                          else if (currentPlayer.role === "police") handleNightAction("investigate");
                          else if (currentPlayer.role === "doctor") handleNightAction("protect");
                        }}
                      >
                        확인
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-indigo-500/20 mb-4 animate-fade-in-up text-center">
              <CardContent className="pt-8 pb-8">
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
              </CardContent>
            </Card>
          )}

          {/* 준비 상태 */}
          {needsActionPlayers.length > 0 && (
            <Card variant="glass" className="border-slate-700/50 mb-4">
              <CardContent className="pt-4">
                <p className="text-slate-300 text-center text-sm mb-3">
                  준비 완료:{" "}
                  <span className="text-cyan-400 font-bold">{readyCount}</span>{" "}
                  / {needsActionPlayers.length}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {needsActionPlayers.map((player) => (
                    <Badge
                      key={player.id}
                      variant={player.ready ? "success" : "secondary"}
                    >
                      {player.name} {player.ready ? "✓" : "⏳"}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            variant={allReady ? "gradient-purple" : "secondary"}
            size="xl"
            className="w-full"
            onClick={handleEndNight}
            disabled={!allReady}
          >
            {allReady ? "밤 페이즈 종료" : `모든 플레이어 준비 대기 중... (${readyCount}/${needsActionPlayers.length})`}
          </Button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // 낮 페이즈
  if (gameState.phase === "day") {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-orange-950 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-96 h-48 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute top-[5%] right-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[15%] left-[5%] w-48 h-48 bg-amber-600/8 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
            ← 홈으로
          </Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />

          <Card className="border-amber-500/20 mb-6 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-amber-300 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-base">📰</span>
                아침 뉴스
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {gameState.history.slice(-3).map((event, index) => (
                <p key={index} className="text-slate-300 text-sm leading-relaxed border-l-2 border-amber-500/30 pl-3">
                  {event}
                </p>
              ))}
            </CardContent>
          </Card>

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

          <Button
            variant="default"
            size="xl"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/30 glow-amber"
            onClick={handleStartVoting}
          >
            🗳️ 투표 시작
          </Button>
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
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[5%] left-[-5%] w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/6 rounded-full blur-3xl animate-urgent" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
            ← 홈으로
          </Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />

          {/* 투표 진행률 */}
          <Card className="border-pink-500/20 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">투표 현황</span>
                <Badge variant="purple">{votedCount} / {aliveCount}명</Badge>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

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
                <Card
                  key={player.id}
                  variant="glass"
                  className={cn(
                    "transition-all",
                    player.votedFor ? "border-green-500/20 bg-green-500/5" : "border-slate-700/40"
                  )}
                >
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-slate-200 font-medium text-sm">{player.name}</span>
                    <div className="flex items-center gap-2">
                      {player.votedFor ? (
                        <Badge variant="success">✓ 투표 완료</Badge>
                      ) : (
                        <Badge variant="secondary">⏳ 대기 중</Badge>
                      )}
                      {gameState.voteResults?.[player.id] && (
                        <Badge variant="purple">
                          {gameState.voteResults[player.id]}표
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
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
        <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>
          ← 홈으로
        </Button>
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

        {!allJoined && (
          <Card variant="glass" className="border-amber-500/30 bg-amber-500/10 mb-4 animate-fade-in-up">
            <CardContent className="pt-5 text-center">
              <p className="text-amber-400 font-medium mb-1.5">
                ⏳ 모든 플레이어가 참여할 때까지 기다리는 중...
              </p>
              <p className="text-slate-300 text-sm">
                참여 완료:{" "}
                <span className="text-cyan-400 font-bold">{joinedPlayers.length}</span> / 6
              </p>
            </CardContent>
          </Card>
        )}

        {allJoined && !gameStarted && (
          <Card variant="glass" className="border-green-500/30 bg-green-500/10 mb-4 animate-fade-in-up">
            <CardContent className="pt-5 text-center">
              <p className="text-green-400 font-medium mb-1">✨ 모든 플레이어가 참여했습니다!</p>
              <p className="text-slate-300 text-sm">"게임 시작" 버튼을 눌러 역할을 배정하세요</p>
            </CardContent>
          </Card>
        )}

        {gameStarted && !allReady && (
          <Card variant="glass" className="border-amber-500/30 bg-amber-500/10 mb-4">
            <CardContent className="pt-5 text-center">
              <p className="text-amber-400 font-medium mb-1">
                ⏳ 모든 플레이어가 준비할 때까지 기다리는 중...
              </p>
              <p className="text-slate-300 text-sm">
                준비 완료:{" "}
                <span className="text-cyan-400 font-bold">{readyCount}</span>{" "}
                / {gameState.players.length}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-slate-700/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-sm">
                {gameStarted ? "🎭" : "👥"}
              </span>
              {gameStarted ? "역할 배정" : "플레이어 목록"}
            </CardTitle>
            <p className="text-slate-400 text-sm leading-relaxed">
              {gameStarted
                ? "각 플레이어는 자신의 역할을 확인한 후, 폰을 다음 사람에게 넘겨주세요."
                : "모든 플레이어가 참여하면 게임을 시작할 수 있습니다."}
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
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
                  <Badge variant="success" className="absolute top-3 right-3">
                    ✓ 준비
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        {/* 호스트 링크 공유 */}
        {isHost && !gameStarted && joinedPlayers.length > 0 && (
          <Card variant="glass" className="mb-4 border-cyan-500/30 bg-cyan-500/10">
            <CardContent className="pt-4">
              <p className="text-cyan-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
              <Button variant="gradient-green" size="sm" className="w-full" onClick={copyLink}>
                📋 링크 복사
              </Button>
            </CardContent>
          </Card>
        )}

        {!gameStarted ? (
          <Button
            variant={allJoined ? "gradient-purple" : "secondary"}
            size="xl"
            className="w-full"
            onClick={handleStartGame}
            disabled={!allJoined}
          >
            {allJoined ? "게임 시작 (역할 배정)" : `플레이어 참여 대기 중... (${joinedPlayers.length}/6)`}
          </Button>
        ) : (
          <>
            {currentPlayer && !currentPlayer.ready && (
              <Button variant="gradient-green" size="xl" className="w-full mb-3" onClick={handleReady}>
                ✓ 준비 완료
              </Button>
            )}
            {currentPlayer?.ready && (
              <Card variant="glass" className="w-full mb-3 border-green-500/30 bg-green-500/10">
                <CardContent className="py-4 text-center">
                  <p className="text-green-400 font-semibold">✓ 준비 완료했습니다</p>
                  <p className="text-slate-300 text-sm mt-1">다른 플레이어들이 준비할 때까지 기다려주세요</p>
                </CardContent>
              </Card>
            )}
            <Button
              variant={allReady ? "gradient-purple" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleStartNight}
              disabled={!allReady}
            >
              {allReady ? "첫 밤 시작" : `모든 플레이어 준비 대기 중... (${readyCount}/${gameState.players.length})`}
            </Button>
          </>
        )}
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
