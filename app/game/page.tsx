"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import type { PlayerData } from "@/app/game/GameCanvas";

// Three.js GameCanvas는 SSR 비활성화 (브라우저 전용 API)
const GameCanvas = dynamic(() => import("@/app/game/GameCanvas"), { ssr: false });

function LoadingScreen() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/60 to-stone-950 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-900/12 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-900/10 rounded-full blur-3xl animate-float-delayed" />
      </div>
      <div className="relative text-center animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-amber-600/20 scale-150" />
            <div className="relative spinner" />
          </div>
        </div>
        <div className="text-stone-200 text-lg font-medium mb-2">게임을 불러오는 중...</div>
        <div className="text-stone-500 text-sm">잠시만 기다려주세요</div>
      </div>
    </div>
  );
}

const PHASE_DURATIONS_SEC = { night: 60, day: 120, voting: 90 } as const;

function PhaseTimer({ phaseEndTime, phase }: { phaseEndTime?: number; phase: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  useEffect(() => {
    if (!phaseEndTime || !["night", "day", "voting"].includes(phase)) return;
    const update = () => setTimeLeft(Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000)));
    update();
    const iv = setInterval(update, 500);
    return () => clearInterval(iv);
  }, [phaseEndTime, phase]);
  if (!phaseEndTime || !["night", "day", "voting"].includes(phase)) return null;
  const totalSec = PHASE_DURATIONS_SEC[phase as keyof typeof PHASE_DURATIONS_SEC] ?? 60;
  const pct = Math.max(0, Math.min(100, (timeLeft / totalSec) * 100));
  const isUrgent = timeLeft <= 10, isWarn = timeLeft <= 30;
  const bar = isUrgent ? "bg-gradient-to-r from-red-500 to-rose-500" : isWarn ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-amber-500 to-yellow-500";
  const txt = isUrgent ? "text-red-400" : isWarn ? "text-orange-400" : "text-amber-400";
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
  return (
    <div className={`p-2.5 rounded-xl glass border ${isUrgent ? "border-red-500/40 bg-red-500/10 animate-pulse" : isWarn ? "border-orange-500/40 bg-orange-500/10" : "border-amber-700/40"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-stone-400 text-xs font-medium">⏱ 제한 시간</span>
        <span className={`font-bold text-sm tabular-nums ${txt}`}>
          {timeLeft === 0 ? "시간 초과!" : mins > 0 ? `${mins}:${String(secs).padStart(2,"0")}` : `${secs}초`}
        </span>
      </div>
      <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// 캔버스용 PlayerData 변환 헬퍼
function toCanvasPlayers(players: Player[]): PlayerData[] {
  return players.map((p, i) => ({ id: p.id, name: p.name, colorIndex: i % 6, isAlive: p.isAlive }));
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
    if (!gameId) { router.push("/"); return; }
    const saved = localStorage.getItem(`player-${gameId}`);
    if (saved) setCurrentPlayerId(saved);
    fetchGameState();
    const iv = setInterval(fetchGameState, 2000);
    return () => clearInterval(iv);
  }, [gameId, router]);

  useEffect(() => {
    if (!gameState?.phaseEndTime) return;
    if (!["night", "day", "voting"].includes(gameState.phase)) return;
    const delay = Math.max(0, gameState.phaseEndTime - Date.now());
    const t = setTimeout(async () => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      try {
        const r = await fetch("/api/game", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "advancePhase" }),
        });
        if (r.ok) setGameState(await r.json());
      } finally { advancingRef.current = false; }
    }, delay + 200);
    return () => clearTimeout(t);
  }, [gameState?.phaseEndTime, gameState?.phase]);

  const fetchGameState = async () => {
    try {
      const r = await fetch("/api/game");
      const data = await r.json();
      if (data.error) { setLoading(false); return; }
      setGameState(data);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const apiPost = async (body: object) => {
    const r = await fetch("/api/game", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (r.ok) setGameState(data);
    else toast(data.error || "오류가 발생했습니다.", "error");
    return { ok: r.ok, data };
  };

  const copyLink = async () => {
    const link = typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${gameId}` : "";
    try { await navigator.clipboard.writeText(link); toast("링크가 복사되었습니다!", "success"); }
    catch { toast("링크 복사에 실패했습니다.", "error"); }
  };

  if (loading) return <LoadingScreen />;

  if (!gameState) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/60 to-stone-950 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <Card className="relative text-center max-w-md animate-fade-in-up rounded-3xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-5xl mb-5">🔍</div>
            <div className="text-red-400 text-xl font-bold mb-3">게임을 찾을 수 없습니다</div>
            <div className="text-stone-400 text-sm mb-6">게임이 생성되지 않았거나 초기화되었습니다.</div>
            <Button variant="gradient" size="lg" className="glow-gold" onClick={() => router.push("/")}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
        <MusicPlayer />
      </div>
    );
  }

  const currentPlayer = currentPlayerId ? gameState.players.find((p) => p.id === currentPlayerId) : null;

  // ─── 참여 화면 ────────────────────────────────────────────────────────────
  if (!currentPlayerId) {
    const joinedPlayers = gameState.players.filter((p) => p.name !== "");
    const allJoined = joinedPlayers.length === 6;
    const handleJoin = async () => {
      if (!playerName.trim()) { toast("이름을 입력해주세요.", "warning"); return; }
      try {
        const r = await fetch("/api/game", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", playerName: playerName.trim() }),
        });
        const data = await r.json();
        if (r.ok && data.joinedPlayerId) {
          setCurrentPlayerId(data.joinedPlayerId);
          if (gameId) localStorage.setItem(`player-${gameId}`, data.joinedPlayerId);
          setPlayerName("");
          fetchGameState();
        } else toast(data.error || "게임 참여에 실패했습니다.", "error");
      } catch { toast("게임 참여 중 오류가 발생했습니다.", "error"); }
    };
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/60 to-stone-950 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-red-900/12 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-56 h-56 bg-amber-900/8 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>← 홈으로</Button>
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">🍷 집들이 미스터리</h1>
            <Separator glow className="mt-3" />
          </div>
          <Card className="border-amber-600/20 bg-gradient-to-br from-amber-900/10 to-red-900/8 mb-5 animate-fade-in-up">
            <CardContent className="pt-5 text-center">
              <p className="text-amber-400 font-bold mb-2">👤 플레이어 참여</p>
              <p className="text-stone-300 text-sm">참여 완료: <span className="text-amber-400 font-bold">{joinedPlayers.length}</span> / 6</p>
              {allJoined && <p className="text-green-400 text-sm font-semibold mt-2 animate-pulse">✨ 모든 플레이어가 참여했습니다!</p>}
            </CardContent>
          </Card>
          <div className="mb-5 flex gap-2">
            <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }} placeholder="당신의 이름을 입력하세요" className="h-12 text-lg" />
            <Button variant="gradient" size="lg" onClick={handleJoin} disabled={!playerName.trim() || allJoined}>{allJoined ? "가득 참" : "참여"}</Button>
          </div>
          <div className="space-y-2">
            {joinedPlayers.map((player, index) => (
              <Card key={player.id} variant="glass" className="border-green-500/20 bg-green-500/8 p-3 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="text-[10px]">#{index + 1}</Badge>
                    <span className="text-stone-100 font-medium">{player.name}</span>
                    {index === 0 && <Badge variant="warning">호스트</Badge>}
                  </div>
                  <span className="text-green-400 font-bold">✓</span>
                </div>
              </Card>
            ))}
            {joinedPlayers.length === 0 && <p className="text-stone-500 text-sm text-center">아직 참여한 플레이어가 없습니다</p>}
          </div>
          {isHost && joinedPlayers.length > 0 && (
            <Card variant="glass" className="mt-4 border-amber-500/30 bg-amber-500/10">
              <CardContent className="pt-4">
                <p className="text-amber-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
                <Button variant="gradient-green" size="sm" className="w-full" onClick={copyLink}>📋 링크 복사</Button>
              </CardContent>
            </Card>
          )}
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ─── 게임 종료 화면 ───────────────────────────────────────────────────────
  if (gameState.phase === "ended") {
    const winnerGlow = gameState.winner === "citizens" ? "bg-green-500/8" : gameState.winner === "mafia" ? "bg-red-500/8" : "bg-amber-500/8";
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/50 to-stone-950 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 left-0 right-0 h-64 ${winnerGlow} blur-3xl`} />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>← 홈으로</Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <Card className="mb-6 animate-fade-in-up">
            <CardContent className="pt-6 pb-6">
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">
                  {gameState.winner === "citizens" && "🎉"}
                  {gameState.winner === "mafia" && "🍷"}
                  {gameState.winner === "drunkard" && "🥴"}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-1">
                  {gameState.winner === "citizens" && <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-glow-cyan">시민 팀 승리!</span>}
                  {gameState.winner === "mafia" && <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent text-glow-red">마피아 팀 승리!</span>}
                  {gameState.winner === "drunkard" && <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent text-glow-amber">만취객 승리!</span>}
                </h2>
                <p className="text-stone-500 text-sm">
                  {gameState.winner === "citizens" && "범인의 정체가 밝혀졌습니다"}
                  {gameState.winner === "mafia" && "범인이 끝까지 정체를 숨기는 데 성공했습니다"}
                  {gameState.winner === "drunkard" && "만취객이 결국 쫓겨났습니다"}
                </p>
              </div>
              <Separator glow className="my-4" />
              <p className="text-stone-600 text-[10px] uppercase tracking-widest font-medium mb-2">게임 기록</p>
              <div className="space-y-1.5">
                {gameState.history.map((event, i) => (
                  <p key={i} className="text-stone-400 text-xs leading-relaxed border-l-2 border-stone-700/50 pl-3">{event}</p>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <RoleCard key={player.id} player={player} showRole={true} isCurrentPlayer={player.id === currentPlayerId} />
            ))}
          </div>
          <Button variant="gradient" size="xl" className="w-full mt-6 glow-gold" onClick={() => router.push("/")}>새 게임 시작</Button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ─── 밤 페이즈 (Three.js 캔버스 + 하단 오버레이) ─────────────────────────
  if (gameState.phase === "night") {
    const canAct = currentPlayer?.role === "mafia" || currentPlayer?.role === "police" || currentPlayer?.role === "doctor";
    const alivePlayers = gameState.players.filter((p) => p.isAlive);
    const needsAction = alivePlayers.filter((p) => p.role === "mafia" || p.role === "police" || p.role === "doctor");
    const readyCount = needsAction.filter((p) => p.ready).length;
    const allReady = needsAction.length > 0 && needsAction.every((p) => p.ready);
    const done = currentPlayer && canAct && currentPlayer.ready;

    const doNightAction = async (type: "kill" | "investigate" | "protect") => {
      if (!currentPlayerId || !selectedPlayerId) return;
      await apiPost({ action: "nightAction", type, playerId: currentPlayerId, target: selectedPlayerId });
      setSelectedPlayerId(null);
    };

    return (
      <div className="fixed inset-0 overflow-hidden">
        <ToastContainer />

        {/* Three.js 캔버스 전체 화면 */}
        <GameCanvas currentPlayerId={currentPlayerId} players={toCanvasPlayers(gameState.players)} nightMode={true} />

        {/* 상단 페이즈 정보 */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-1 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          </div>
          <div className="pointer-events-auto">
            <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />
          </div>
        </div>

        {/* 하단 액션 패널 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 glass-card rounded-t-3xl border-t border-stone-700/50 max-h-[52vh] overflow-y-auto pb-safe">
          <div className="p-4 space-y-3">
            {/* 드래그 핸들 */}
            <div className="w-10 h-1 bg-stone-600 rounded-full mx-auto mb-2" />

            {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

            {canAct ? (
              done ? (
                <div className="text-center p-4 glass border-green-500/30 bg-green-500/10 rounded-xl">
                  <div className="text-2xl mb-1.5">
                    {currentPlayer?.role === "mafia" ? "🍷" : currentPlayer?.role === "police" ? "🕵️" : "🧹"}
                  </div>
                  <p className="text-green-400 font-bold mb-1">완료했습니다</p>
                  <p className="text-stone-500 text-xs">다른 사람들을 기다리는 중...</p>
                  {currentPlayer?.role === "police" && gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                    <div className={cn(
                      "mt-3 p-3 rounded-xl border text-center",
                      gameState.nightActions.investigate.result
                        ? "glass border-red-500/40 bg-red-500/10"
                        : "glass border-green-500/30 bg-green-500/8"
                    )}>
                      <p className="font-bold text-base">
                        {gameState.nightActions.investigate.result ? "🚨 범인입니다!" : "✅ 범인이 아닙니다."}
                      </p>
                      <p className="text-stone-500 text-xs mt-1">이 정보를 잘 활용하세요</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-xl p-3 bg-stone-800/40 border border-stone-700/30 mb-1">
                    <p className="text-stone-300 font-semibold text-sm">
                      {currentPlayer.role === "mafia" && "🍷 오늘 밤 누구를 제거하시겠습니까?"}
                      {currentPlayer.role === "police" && "🕵️ 오늘 밤 누구를 조사하시겠습니까?"}
                      {currentPlayer.role === "doctor" && "🧹 오늘 밤 누구를 보호하시겠습니까?"}
                    </p>
                    <p className="text-stone-600 text-xs mt-0.5">
                      {currentPlayer.role === "mafia" && "선택한 사람은 내일 아침 사라집니다"}
                      {currentPlayer.role === "police" && "그 사람이 범인인지 아닌지 알 수 있습니다"}
                      {currentPlayer.role === "doctor" && "오늘 밤 공격을 막아드립니다 (본인 포함 가능)"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.players.filter((p) => p.isAlive && p.id !== currentPlayerId).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={cn(
                          "p-3 rounded-xl text-sm font-medium transition-all active:scale-95",
                          selectedPlayerId === player.id
                            ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-900 font-bold shadow-lg shadow-amber-700/30"
                            : "glass-light text-stone-100 border border-stone-700/50 hover:border-stone-600/60"
                        )}
                      >{player.name}</button>
                    ))}
                  </div>
                  {selectedPlayerId && (
                    <Button variant="gradient-vote" size="lg" className="w-full" onClick={() => {
                      if (currentPlayer.role === "mafia") doNightAction("kill");
                      else if (currentPlayer.role === "police") doNightAction("investigate");
                      else doNightAction("protect");
                    }}>
                      {currentPlayer.role === "mafia" ? "제거하기" : currentPlayer.role === "police" ? "조사하기" : "보호하기"}
                    </Button>
                  )}
                </>
              )
            ) : (
              <div className="text-center py-3">
                <div className="text-3xl mb-2 opacity-60">😴</div>
                <p className="text-stone-400 text-sm font-medium">잠든 척하며 기다리세요</p>
                <p className="text-stone-600 text-xs mt-1">지도에서 자유롭게 이동할 수 있어요</p>
              </div>
            )}

            {/* 준비 상태 */}
            {needsAction.length > 0 && (
              <div className="glass rounded-xl p-3 border border-stone-700/40">
                <p className="text-stone-400 text-xs text-center mb-2">준비: <span className="text-amber-400 font-bold">{readyCount}</span>/{needsAction.length}</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {needsAction.map((p) => (
                    <Badge key={p.id} variant={p.ready ? "success" : "secondary"}>
                      {p.name} {p.ready ? "✓" : "⏳"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant={allReady ? "gradient-purple" : "secondary"}
              size="lg" className="w-full"
              onClick={() => apiPost({ action: "endNight" })}
              disabled={!allReady}
            >
              {allReady ? "밤 페이즈 종료" : `대기 중... (${readyCount}/${needsAction.length})`}
            </Button>
          </div>
        </div>

        <MusicPlayer />
      </div>
    );
  }

  // ─── 낮 페이즈 (Three.js 캔버스 + 하단 오버레이) ─────────────────────────
  if (gameState.phase === "day") {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <ToastContainer />

        {/* Three.js 캔버스 전체 화면 */}
        <GameCanvas currentPlayerId={currentPlayerId} players={toCanvasPlayers(gameState.players)} nightMode={false} />

        {/* 상단 페이즈 정보 */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-1 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          </div>
          <div className="pointer-events-auto">
            <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />
          </div>
        </div>

        {/* 하단 정보 패널 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 glass-card rounded-t-3xl border-t border-stone-700/50 max-h-[48vh] overflow-y-auto pb-safe">
          <div className="p-4 space-y-3">
            <div className="w-10 h-1 bg-stone-600 rounded-full mx-auto mb-2" />

            {/* 아침 뉴스 */}
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-stone-900/20 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-600/15">
                <span className="text-sm">📰</span>
                <span className="text-amber-400 font-bold text-xs tracking-wide uppercase">아침 뉴스</span>
                <span className="ml-auto text-stone-700 text-[10px]">방금 들어온 소식</span>
              </div>
              <div className="p-3 space-y-2">
                {gameState.history.slice(-3).map((event, i) => (
                  <p key={i} className={cn(
                    "text-xs leading-relaxed border-l-2 pl-2.5",
                    i === 0 ? "text-stone-200 border-amber-500/50" : "text-stone-500 border-stone-700/40"
                  )}>{event}</p>
                ))}
              </div>
            </div>

            {/* 생존자 목록 */}
            <div>
              <p className="text-stone-600 text-[10px] font-medium uppercase tracking-wider mb-1.5">생존자 ({gameState.players.filter(p => p.isAlive).length}명)</p>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players.filter((p) => p.isAlive).map((p) => (
                  <Badge key={p.id} variant={p.id === currentPlayerId ? "info" : "secondary"} className="text-xs">
                    {p.name}{p.id === currentPlayerId ? " (나)" : ""}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-stone-600 text-xs text-center">지도를 돌아다니며 수상한 사람을 찾아보세요</p>

            <Button
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/30"
              onClick={() => apiPost({ action: "startVoting" })}
            >🗳️ 투표 시작</Button>
          </div>
        </div>

        <MusicPlayer />
      </div>
    );
  }

  // ─── 투표 페이즈 ──────────────────────────────────────────────────────────
  if (gameState.phase === "voting") {
    const aliveCount = gameState.players.filter((p) => p.isAlive).length;
    const votedCount = gameState.players.filter((p) => p.isAlive && p.votedFor).length;
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-950 p-3 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[5%] left-[-5%] w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[10%] right-[-5%] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <ToastContainer />
        <div className="relative max-w-2xl mx-auto pb-28">
          <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>← 홈으로</Button>
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />
          <Card className="border-pink-500/20 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-300 text-sm font-medium">투표 현황</span>
                <Badge variant="purple">{votedCount} / {aliveCount}명</Badge>
              </div>
              <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <VotePanel gameState={gameState} currentPlayerId={currentPlayerId} onVote={async (voterId, targetId) => {
            await apiPost({ action: "vote", voterId, targetId });
            toast("투표가 완료되었습니다.", "success");
          }} />
          <div className="mt-4 space-y-2">
            {gameState.players.filter((p) => p.isAlive).map((player) => (
              <Card key={player.id} variant="glass" className={cn("transition-all", player.votedFor ? "border-green-500/20 bg-green-500/5" : "border-stone-700/40")}>
                <div className="flex justify-between items-center p-3.5">
                  <span className="text-stone-200 font-medium text-sm">{player.name}</span>
                  <div className="flex items-center gap-2">
                    {player.votedFor ? <Badge variant="success">✓ 완료</Badge> : <Badge variant="secondary">⏳ 대기</Badge>}
                    {gameState.voteResults?.[player.id] && <Badge variant="purple">{gameState.voteResults[player.id]}표</Badge>}
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

  // ─── 설정 페이즈 ──────────────────────────────────────────────────────────
  const joinedPlayers = gameState.players.filter((p) => p.name !== "");
  const allJoined = joinedPlayers.length === 6;
  const readyCount = gameState.players.filter((p) => p.ready).length;
  const allReady = readyCount === gameState.players.length;
  const gameStarted = gameState.status === "playing" && gameState.players[0]?.role !== null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/60 to-stone-950 p-3 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[10%] w-64 h-64 bg-red-900/12 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[10%] left-[5%] w-56 h-56 bg-amber-900/8 rounded-full blur-3xl animate-float-delayed" />
      </div>
      <ToastContainer />
      <div className="relative max-w-2xl mx-auto pb-28">
        <Button variant="glass" size="sm" className="mb-4" onClick={() => router.push("/")}>← 홈으로</Button>
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

        {!allJoined && (
          <Card variant="glass" className="border-amber-500/30 bg-amber-500/10 mb-4">
            <CardContent className="pt-5 text-center">
              <p className="text-amber-400 font-medium mb-1">⏳ 모든 플레이어가 참여할 때까지 기다리는 중...</p>
              <p className="text-stone-300 text-sm">참여: <span className="text-amber-400 font-bold">{joinedPlayers.length}</span> / 6</p>
            </CardContent>
          </Card>
        )}
        {allJoined && !gameStarted && (
          <Card variant="glass" className="border-green-500/30 bg-green-500/10 mb-4">
            <CardContent className="pt-5 text-center">
              <p className="text-green-400 font-medium mb-1">✨ 모든 플레이어 참여 완료!</p>
              <p className="text-stone-300 text-sm">"게임 시작" 버튼으로 역할을 배정하세요</p>
            </CardContent>
          </Card>
        )}
        {gameStarted && !allReady && (
          <Card variant="glass" className="border-amber-500/30 bg-amber-500/10 mb-4">
            <CardContent className="pt-5 text-center">
              <p className="text-amber-400 font-medium mb-1">⏳ 모든 플레이어 준비 대기 중...</p>
              <p className="text-stone-300 text-sm">준비: <span className="text-amber-400 font-bold">{readyCount}</span> / {gameState.players.length}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-stone-700/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">{gameStarted ? "🎭" : "👥"}</span>
              {gameStarted ? "역할 배정" : "플레이어 목록"}
            </CardTitle>
            <p className="text-stone-400 text-sm">{gameStarted ? "역할을 확인한 후 폰을 다음 사람에게 넘겨주세요." : "모든 플레이어가 참여하면 게임을 시작할 수 있습니다."}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {gameState.players.map((player) => (
              <div key={player.id} className="relative">
                <RoleCard player={player} showRole={gameStarted && player.id === currentPlayerId} isCurrentPlayer={player.id === currentPlayerId} />
                {player.name === "" && <span className="absolute top-2 right-2 text-stone-500 text-xs">대기 중...</span>}
                {player.ready && gameStarted && <Badge variant="success" className="absolute top-3 right-3">✓ 준비</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        {isHost && !gameStarted && joinedPlayers.length > 0 && (
          <Card variant="glass" className="mb-4 border-amber-500/30 bg-amber-500/10">
            <CardContent className="pt-4">
              <p className="text-amber-400 text-sm text-center mb-2 font-semibold">📋 게임 링크 공유</p>
              <Button variant="gradient-green" size="sm" className="w-full" onClick={copyLink}>📋 링크 복사</Button>
            </CardContent>
          </Card>
        )}

        {!gameStarted ? (
          <Button variant={allJoined ? "gradient-purple" : "secondary"} size="xl" className="w-full" onClick={() => apiPost({ action: "startGame" })} disabled={!allJoined}>
            {allJoined ? "게임 시작 (역할 배정)" : `플레이어 대기 중... (${joinedPlayers.length}/6)`}
          </Button>
        ) : (
          <>
            {currentPlayer && !currentPlayer.ready && (
              <Button variant="gradient-green" size="xl" className="w-full mb-3" onClick={() => apiPost({ action: "ready", playerId: currentPlayerId })}>✓ 준비 완료</Button>
            )}
            {currentPlayer?.ready && (
              <Card variant="glass" className="w-full mb-3 border-green-500/30 bg-green-500/10">
                <CardContent className="py-4 text-center">
                  <p className="text-green-400 font-semibold">✓ 준비 완료</p>
                  <p className="text-stone-300 text-sm mt-1">다른 플레이어들을 기다리는 중...</p>
                </CardContent>
              </Card>
            )}
            <Button variant={allReady ? "gradient-purple" : "secondary"} size="xl" className="w-full" onClick={() => apiPost({ action: "startNight" })} disabled={!allReady}>
              {allReady ? "첫 밤 시작" : `준비 대기 중... (${readyCount}/${gameState.players.length})`}
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
