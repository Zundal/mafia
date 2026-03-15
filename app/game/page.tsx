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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlayerData } from "@/app/game/GameCanvas";

const GameCanvas = dynamic(() => import("@/app/game/GameCanvas"), { ssr: false });

// ── 로딩 화면 ──────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0c0704' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(100,30,10,0.2) 0%, transparent 70%)' }}
      />
      <div className="relative text-center animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <div className="spinner" />
        </div>
        <p style={{ color: '#c8a878' }} className="text-base font-medium mb-1">게임을 불러오는 중...</p>
        <p style={{ color: 'rgba(140,95,55,0.6)' }} className="text-sm">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}

// ── 페이즈 타이머 ─────────────────────────────────────────────────────────
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
  const isUrgent = timeLeft <= 10;
  const isWarn = timeLeft <= 30;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div
      className={cn(
        "p-2.5 rounded-xl border transition-all",
        isUrgent ? "animate-pulse" : ""
      )}
      style={{
        background: isUrgent ? 'rgba(180,30,20,0.12)' : isWarn ? 'rgba(160,80,20,0.10)' : 'rgba(20,10,6,0.6)',
        border: `1px solid ${isUrgent ? 'rgba(220,60,40,0.35)' : isWarn ? 'rgba(200,110,40,0.3)' : 'rgba(120,75,40,0.2)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: 'rgba(160,110,60,0.8)' }}>⏱ 제한 시간</span>
        <span
          className="font-bold text-sm tabular-nums"
          style={{ color: isUrgent ? '#f87060' : isWarn ? '#e89040' : '#c8a060' }}
        >
          {timeLeft === 0 ? '시간 초과!' : mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}초`}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isUrgent
              ? 'linear-gradient(to right, #e03020, #f05040)'
              : isWarn
              ? 'linear-gradient(to right, #d07020, #e09030)'
              : 'linear-gradient(to right, #b08030, #d0a040)',
          }}
        />
      </div>
    </div>
  );
}

function toCanvasPlayers(players: Player[]): PlayerData[] {
  return players.map((p, i) => ({ id: p.id, name: p.name, colorIndex: i % 6, isAlive: p.isAlive }));
}

// ── 뒤로가기 버튼 ─────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-5 text-sm transition-colors flex items-center gap-1.5"
      style={{ color: 'rgba(160,110,60,0.6)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(200,150,80,0.9)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(160,110,60,0.6)')}
    >
      ← 홈으로
    </button>
  );
}

// ── 메인 게임 컨텐츠 ──────────────────────────────────────────────────────
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
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: '#0c0704' }}>
        <div className="relative text-center animate-fade-in-up max-w-sm">
          <div className="text-5xl mb-5 opacity-40">🔍</div>
          <p className="text-xl font-bold mb-3" style={{ color: '#d4a070' }}>게임을 찾을 수 없습니다</p>
          <p className="text-sm mb-6" style={{ color: 'rgba(140,100,55,0.7)' }}>게임이 생성되지 않았거나 초기화되었습니다.</p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-2xl font-semibold"
            style={{ background: 'linear-gradient(to right, #5c1212, #8c1c1c)', color: '#f0d8b8' }}
          >
            홈으로 돌아가기
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  const currentPlayer = currentPlayerId ? gameState.players.find((p) => p.id === currentPlayerId) : null;

  // ── 참여 화면 ────────────────────────────────────────────────────────────
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
      <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: '#0c0704' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(100,30,10,0.2) 0%, transparent 70%)' }}
        />
        <ToastContainer />
        <div className="relative max-w-md mx-auto pb-28">
          <BackButton onClick={() => router.push("/")} />

          {/* 타이틀 */}
          <div className="text-center mb-8">
            <p className="text-xs font-medium tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(160,100,50,0.6)' }}>
              집들이 미스터리
            </p>
            <h1 className="text-2xl font-bold" style={{ color: '#e4ccaa' }}>파티에 합류하기</h1>
          </div>

          {/* 참여 상태 */}
          <div
            className="rounded-2xl p-4 mb-5 text-center"
            style={{ background: 'rgba(16,8,5,0.85)', border: '1px solid rgba(120,75,40,0.2)' }}
          >
            <p className="text-3xl font-bold mb-1" style={{ color: '#e4ccaa' }}>
              {joinedPlayers.length}<span className="text-base font-normal" style={{ color: 'rgba(160,110,60,0.6)' }}> / 6</span>
            </p>
            <p className="text-xs" style={{ color: 'rgba(140,95,55,0.7)' }}>명 참여 완료</p>
            {allJoined && (
              <p className="text-sm font-semibold mt-2 animate-pulse" style={{ color: '#68d391' }}>
                ✨ 모든 플레이어가 모였습니다!
              </p>
            )}
          </div>

          {/* 이름 입력 */}
          <div className="flex gap-2 mb-5">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
              placeholder="당신의 이름을 입력하세요"
              className="h-12 text-base"
              disabled={allJoined}
            />
            <button
              onClick={handleJoin}
              disabled={!playerName.trim() || allJoined}
              className="px-5 h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(to right, #5c1212, #8c1c1c)', color: '#f0d8b8', minWidth: 72 }}
            >
              참여
            </button>
          </div>

          {/* 참여자 목록 */}
          <div className="space-y-2">
            {joinedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between animate-slide-in-left"
                style={{
                  background: 'rgba(16,8,5,0.85)',
                  border: '1px solid rgba(120,75,40,0.18)',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(140,80,40,0.2)', color: '#c8a070' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm" style={{ color: '#ddc8a8' }}>{player.name}</span>
                  {idx === 0 && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(160,110,40,0.15)', color: '#c8a050', border: '1px solid rgba(160,110,40,0.2)' }}
                    >
                      호스트
                    </span>
                  )}
                </div>
                <span style={{ color: '#68d391' }} className="text-sm">✓</span>
              </div>
            ))}
            {joinedPlayers.length === 0 && (
              <p className="text-center text-sm py-6" style={{ color: 'rgba(120,80,45,0.5)' }}>
                아직 아무도 오지 않았네요...
              </p>
            )}
          </div>

          {isHost && joinedPlayers.length > 0 && (
            <div
              className="mt-5 p-4 rounded-2xl"
              style={{ background: 'rgba(16,8,5,0.85)', border: '1px solid rgba(120,75,40,0.2)' }}
            >
              <p className="text-xs font-medium mb-3 text-center" style={{ color: 'rgba(160,110,60,0.8)' }}>
                📋 친구들에게 링크를 공유하세요
              </p>
              <button
                onClick={copyLink}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(to right, #1a4a1a, #1c6c1c)',
                  color: '#a0e8a0',
                  border: '1px solid rgba(40,160,60,0.2)',
                }}
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

  // ── 게임 종료 화면 ────────────────────────────────────────────────────────
  if (gameState.phase === "ended") {
    const winColors = {
      citizens: { from: '#1a4a1a', to: '#2a6a2a', text: '#90e890', glow: 'rgba(40,180,60,0.15)', label: '시민 팀 승리', emoji: '🎉', sub: '범인의 정체가 드러났습니다' },
      mafia:    { from: '#4a1010', to: '#7a1818', text: '#f08888', glow: 'rgba(200,40,40,0.15)', label: '마피아 팀 승리', emoji: '🍷', sub: '범인이 끝까지 살아남았습니다' },
      drunkard: { from: '#4a3000', to: '#6a4800', text: '#e8c060', glow: 'rgba(200,160,40,0.15)', label: '만취객 승리', emoji: '🥴', sub: '만취객이 결국 쫓겨났습니다' },
    };
    const wc = winColors[gameState.winner as keyof typeof winColors] ?? winColors.citizens;

    return (
      <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: '#0c0704' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 50% at 50% 20%, ${wc.glow} 0%, transparent 70%)` }}
        />
        <ToastContainer />
        <div className="relative max-w-md mx-auto pb-28">
          <BackButton onClick={() => router.push("/")} />
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

          {/* 결과 카드 */}
          <div
            className="rounded-2xl p-6 mb-6 text-center animate-fade-in-up"
            style={{
              background: `linear-gradient(145deg, ${wc.from}, ${wc.to})`,
              border: `1px solid rgba(255,255,255,0.08)`,
              boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="text-5xl mb-3">{wc.emoji}</div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: wc.text }}>{wc.label}!</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{wc.sub}</p>
            <div className="h-px mt-5 mb-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>게임 기록</p>
            <div className="space-y-1.5 text-left">
              {gameState.history.map((event, i) => (
                <p key={i} className="text-xs leading-relaxed pl-2.5 border-l" style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}>
                  {event}
                </p>
              ))}
            </div>
          </div>

          {/* 역할 공개 */}
          <div className="space-y-3">
            {gameState.players.map((player) => (
              <RoleCard key={player.id} player={player} showRole isCurrentPlayer={player.id === currentPlayerId} />
            ))}
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-6 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(to right, #5c1212, #8c1c1c)',
              color: '#f0d8b8',
              boxShadow: '0 4px 24px rgba(80,15,10,0.5)',
            }}
          >
            새 게임 시작
          </button>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ── 밤 페이즈 ─────────────────────────────────────────────────────────────
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

    const roleStyle: Record<string, { color: string; borderColor: string; bg: string }> = {
      mafia:  { color: '#f08080', borderColor: 'rgba(220,60,60,0.3)',  bg: 'rgba(80,10,10,0.3)'  },
      police: { color: '#80c8f0', borderColor: 'rgba(60,140,220,0.3)', bg: 'rgba(10,40,80,0.3)'  },
      doctor: { color: '#80f0b0', borderColor: 'rgba(60,200,120,0.3)', bg: 'rgba(10,60,30,0.3)'  },
    };
    const rs = currentPlayer?.role ? (roleStyle[currentPlayer.role] ?? roleStyle.doctor) : roleStyle.doctor;

    return (
      <div className="fixed inset-0 overflow-hidden" style={{ background: '#040204' }}>
        <ToastContainer />
        <GameCanvas currentPlayerId={currentPlayerId} players={toCanvasPlayers(gameState.players)} nightMode />

        {/* 상단 */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-1 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          </div>
          <div className="pointer-events-auto">
            <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />
          </div>
        </div>

        {/* 하단 액션 패널 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 panel-dark rounded-t-3xl max-h-[54vh] overflow-y-auto pb-safe">
          <div className="p-4 space-y-3">
            <div className="w-8 h-0.5 rounded-full mx-auto mb-2" style={{ background: 'rgba(160,100,60,0.3)' }} />

            {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

            {canAct ? (
              done ? (
                <div
                  className="text-center p-4 rounded-2xl"
                  style={{ background: 'rgba(30,80,30,0.15)', border: '1px solid rgba(60,160,80,0.2)' }}
                >
                  <div className="text-2xl mb-2">
                    {currentPlayer?.role === 'mafia' ? '🍷' : currentPlayer?.role === 'police' ? '🕵️' : '🧹'}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#80e890' }}>완료했습니다</p>
                  <p className="text-xs" style={{ color: 'rgba(120,180,120,0.6)' }}>다른 사람들을 기다리는 중...</p>
                  {currentPlayer?.role === "police" && gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                    <div
                      className="mt-3 p-3 rounded-xl"
                      style={{
                        background: gameState.nightActions.investigate.result ? 'rgba(180,30,20,0.15)' : 'rgba(30,140,60,0.12)',
                        border: `1px solid ${gameState.nightActions.investigate.result ? 'rgba(220,60,50,0.3)' : 'rgba(60,180,80,0.25)'}`,
                      }}
                    >
                      <p className="font-bold text-base" style={{ color: gameState.nightActions.investigate.result ? '#f08878' : '#80e8a8' }}>
                        {gameState.nightActions.investigate.result ? '🚨 범인입니다!' : '✅ 범인이 아닙니다.'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(180,180,180,0.5)' }}>이 정보를 잘 활용하세요</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: rs.bg, border: `1px solid ${rs.borderColor}` }}
                  >
                    <p className="font-semibold text-sm mb-0.5" style={{ color: rs.color }}>
                      {currentPlayer?.role === "mafia" && "🍷 오늘 밤 누구를 제거하시겠습니까?"}
                      {currentPlayer?.role === "police" && "🕵️ 오늘 밤 누구를 조사하시겠습니까?"}
                      {currentPlayer?.role === "doctor" && "🧹 오늘 밤 누구를 보호하시겠습니까?"}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(180,180,180,0.4)' }}>
                      {currentPlayer?.role === "mafia" && "선택한 사람은 내일 아침 사라집니다"}
                      {currentPlayer?.role === "police" && "그 사람이 범인인지 아닌지 알 수 있습니다"}
                      {currentPlayer?.role === "doctor" && "오늘 밤 공격을 막아드립니다 (본인 포함 가능)"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.players.filter((p) => p.isAlive && p.id !== currentPlayerId).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={cn("p-3 rounded-xl text-sm font-medium transition-all active:scale-95")}
                        style={{
                          background: selectedPlayerId === player.id
                            ? 'linear-gradient(to right, #8a2020, #b02828)'
                            : 'rgba(20,10,6,0.7)',
                          color: selectedPlayerId === player.id ? '#fce8d0' : 'rgba(200,160,100,0.8)',
                          border: `1px solid ${selectedPlayerId === player.id ? 'rgba(200,80,60,0.4)' : 'rgba(120,75,40,0.2)'}`,
                          boxShadow: selectedPlayerId === player.id ? '0 4px 16px rgba(150,30,20,0.3)' : 'none',
                        }}
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                  {selectedPlayerId && (
                    <button
                      onClick={() => {
                        if (currentPlayer?.role === "mafia") doNightAction("kill");
                        else if (currentPlayer?.role === "police") doNightAction("investigate");
                        else doNightAction("protect");
                      }}
                      className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(to right, #6a1515, #9a2020)',
                        color: '#fce8d0',
                        boxShadow: '0 4px 20px rgba(120,20,15,0.4)',
                      }}
                    >
                      {currentPlayer?.role === "mafia" ? "제거하기" : currentPlayer?.role === "police" ? "조사하기" : "보호하기"}
                    </button>
                  )}
                </>
              )
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-2 opacity-40">😴</div>
                <p className="text-sm font-medium" style={{ color: 'rgba(160,120,80,0.7)' }}>잠든 척하며 기다리세요</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(120,85,50,0.5)' }}>지도에서 자유롭게 이동할 수 있어요</p>
              </div>
            )}

            {needsAction.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(15,8,5,0.6)', border: '1px solid rgba(100,65,35,0.2)' }}>
                <p className="text-xs text-center mb-2" style={{ color: 'rgba(140,95,55,0.7)' }}>
                  준비 완료 <span style={{ color: '#d4a060' }} className="font-bold">{readyCount}</span>/{needsAction.length}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {needsAction.map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: p.ready ? 'rgba(40,120,50,0.2)' : 'rgba(120,75,40,0.12)',
                        color: p.ready ? '#80d890' : 'rgba(160,110,60,0.6)',
                        border: `1px solid ${p.ready ? 'rgba(60,160,70,0.25)' : 'rgba(120,75,40,0.15)'}`,
                      }}
                    >
                      {p.name} {p.ready ? '✓' : '⏳'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => apiPost({ action: "endNight" })}
              disabled={!allReady}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: allReady ? 'linear-gradient(to right, #3a1a6a, #5a2a9a)' : 'rgba(25,15,8,0.6)',
                color: allReady ? '#d8c0f8' : 'rgba(140,100,60,0.5)',
                border: `1px solid ${allReady ? 'rgba(120,70,200,0.3)' : 'rgba(100,65,35,0.15)'}`,
              }}
            >
              {allReady ? '밤 페이즈 종료' : `대기 중... (${readyCount}/${needsAction.length})`}
            </button>
          </div>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ── 낮 페이즈 ─────────────────────────────────────────────────────────────
  if (gameState.phase === "day") {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <ToastContainer />
        <GameCanvas currentPlayerId={currentPlayerId} players={toCanvasPlayers(gameState.players)} nightMode={false} />

        {/* 상단 */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pb-1 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          </div>
          <div className="pointer-events-auto">
            <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />
          </div>
        </div>

        {/* 하단 패널 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 panel-dark rounded-t-3xl max-h-[48vh] overflow-y-auto pb-safe">
          <div className="p-4 space-y-3">
            <div className="w-8 h-0.5 rounded-full mx-auto mb-2" style={{ background: 'rgba(160,110,60,0.3)' }} />

            {/* 아침 뉴스 */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(30,18,8,0.6)', border: '1px solid rgba(160,110,50,0.18)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid rgba(160,110,50,0.12)' }}
              >
                <span className="text-sm">📰</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#c8a060' }}>아침 뉴스</span>
                <span className="ml-auto text-[10px]" style={{ color: 'rgba(140,95,50,0.5)' }}>방금 들어온 소식</span>
              </div>
              <div className="p-3 space-y-2">
                {gameState.history.slice(-3).map((event, i) => (
                  <p
                    key={i}
                    className="text-xs leading-relaxed pl-2.5 border-l"
                    style={{
                      color: i === 0 ? '#e0c8a0' : 'rgba(160,120,70,0.6)',
                      borderColor: i === 0 ? 'rgba(180,120,50,0.45)' : 'rgba(120,80,40,0.2)',
                    }}
                  >
                    {event}
                  </p>
                ))}
              </div>
            </div>

            {/* 생존자 */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'rgba(130,90,50,0.6)' }}>
                생존자 ({gameState.players.filter(p => p.isAlive).length}명)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players.filter((p) => p.isAlive).map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: p.id === currentPlayerId ? 'rgba(60,130,200,0.15)' : 'rgba(120,75,40,0.12)',
                      color: p.id === currentPlayerId ? '#80c0f0' : 'rgba(180,130,80,0.8)',
                      border: `1px solid ${p.id === currentPlayerId ? 'rgba(60,140,210,0.25)' : 'rgba(120,75,40,0.15)'}`,
                    }}
                  >
                    {p.name}{p.id === currentPlayerId ? ' (나)' : ''}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'rgba(120,85,50,0.5)' }}>
              지도를 돌아다니며 수상한 사람을 찾아보세요
            </p>

            <button
              onClick={() => apiPost({ action: "startVoting" })}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(to right, #5a1010, #9a2020)',
                color: '#fce8d0',
                boxShadow: '0 4px 20px rgba(100,20,15,0.4)',
              }}
            >
              🗳️ 투표 시작
            </button>
          </div>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ── 투표 페이즈 ────────────────────────────────────────────────────────────
  if (gameState.phase === "voting") {
    const aliveCount = gameState.players.filter((p) => p.isAlive).length;
    const votedCount = gameState.players.filter((p) => p.isAlive && p.votedFor).length;

    return (
      <div
        className="relative min-h-screen p-4 overflow-hidden"
        style={{ background: '#080410' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(80,20,120,0.25) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-purple-950/20 rounded-full blur-[80px] animate-float" />
          <div className="absolute bottom-[15%] right-[5%] w-60 h-60 bg-rose-950/15 rounded-full blur-[70px] animate-float-delayed" />
        </div>

        <ToastContainer />
        <div className="relative max-w-md mx-auto pb-28">
          <BackButton onClick={() => router.push("/")} />
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />

          {/* 투표 진행 바 */}
          <div
            className="rounded-xl p-3.5 mb-4 mt-3"
            style={{ background: 'rgba(20,10,30,0.7)', border: '1px solid rgba(140,60,180,0.2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'rgba(180,130,220,0.7)' }}>투표 현황</span>
              <span className="text-xs font-bold" style={{ color: '#c890f0' }}>
                {votedCount}<span style={{ color: 'rgba(180,130,220,0.5)' }}>/{aliveCount}명</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0}%`,
                  background: 'linear-gradient(to right, #7030c0, #c040a0)',
                }}
              />
            </div>
          </div>

          <VotePanel
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onVote={async (voterId, targetId) => {
              await apiPost({ action: "vote", voterId, targetId });
              toast("투표가 완료되었습니다.", "success");
            }}
          />

          {/* 투표 상태 목록 */}
          <div className="mt-4 space-y-1.5">
            {gameState.players.filter((p) => p.isAlive).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center px-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: player.votedFor ? 'rgba(30,80,20,0.15)' : 'rgba(15,8,20,0.6)',
                  border: `1px solid ${player.votedFor ? 'rgba(50,150,40,0.2)' : 'rgba(100,60,140,0.15)'}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: '#d8c8e8' }}>{player.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: player.votedFor ? 'rgba(40,140,40,0.2)' : 'rgba(100,60,140,0.15)',
                      color: player.votedFor ? '#80e880' : 'rgba(160,120,200,0.6)',
                    }}
                  >
                    {player.votedFor ? '✓ 완료' : '⏳ 대기'}
                  </span>
                  {gameState.voteResults?.[player.id] && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(140,60,180,0.2)', color: '#c890f0' }}
                    >
                      {gameState.voteResults[player.id]}표
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <MusicPlayer />
      </div>
    );
  }

  // ── 설정 페이즈 ────────────────────────────────────────────────────────────
  const joinedPlayers = gameState.players.filter((p) => p.name !== "");
  const allJoined = joinedPlayers.length === 6;
  const readyCount = gameState.players.filter((p) => p.ready).length;
  const allReady = readyCount === gameState.players.length;
  const gameStarted = gameState.status === "playing" && gameState.players[0]?.role !== null;

  return (
    <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: '#0c0704' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 25%, rgba(100,30,10,0.18) 0%, transparent 70%)' }}
      />
      <ToastContainer />
      <div className="relative max-w-md mx-auto pb-28">
        <BackButton onClick={() => router.push("/")} />
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

        {/* 상태 배너 */}
        {!allJoined && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center"
            style={{ background: 'rgba(30,18,8,0.7)', border: '1px solid rgba(160,110,50,0.2)' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: '#c8a060' }}>⏳ 플레이어를 기다리는 중...</p>
            <p className="text-xs" style={{ color: 'rgba(140,95,50,0.7)' }}>
              참여 <span className="font-bold" style={{ color: '#d4a060' }}>{joinedPlayers.length}</span>/6
            </p>
          </div>
        )}
        {allJoined && !gameStarted && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center animate-fade-in"
            style={{ background: 'rgba(12,35,12,0.7)', border: '1px solid rgba(60,160,60,0.2)' }}
          >
            <p className="text-sm font-medium" style={{ color: '#80e880' }}>✨ 모두 모였습니다!</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(100,180,100,0.6)' }}>"게임 시작"으로 역할을 배정하세요</p>
          </div>
        )}
        {gameStarted && !allReady && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center"
            style={{ background: 'rgba(30,18,8,0.7)', border: '1px solid rgba(160,110,50,0.2)' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: '#c8a060' }}>⏳ 모두 준비할 때까지 기다리는 중...</p>
            <p className="text-xs" style={{ color: 'rgba(140,95,50,0.7)' }}>
              준비 <span className="font-bold" style={{ color: '#d4a060' }}>{readyCount}</span>/{gameState.players.length}
            </p>
          </div>
        )}

        {/* 플레이어 목록 */}
        <div
          className="rounded-2xl mb-5 overflow-hidden"
          style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(120,75,40,0.15)' }}>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#e4ccaa' }}>
              <span>{gameStarted ? '🎭' : '👥'}</span>
              {gameStarted ? '역할 배정' : '파티 초대장'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(140,95,50,0.65)' }}>
              {gameStarted ? '역할을 확인한 후 폰을 다음 사람에게 넘겨주세요.' : '모든 플레이어가 참여하면 게임을 시작할 수 있습니다.'}
            </p>
          </div>
          <div className="p-4 space-y-2.5">
            {gameState.players.map((player, idx) => (
              <div key={player.id} className="relative">
                <RoleCard
                  player={player}
                  showRole={gameStarted && player.id === currentPlayerId}
                  isCurrentPlayer={player.id === currentPlayerId}
                />
                {player.name === "" && (
                  <span className="absolute top-3 right-3 text-xs" style={{ color: 'rgba(120,80,45,0.5)' }}>
                    대기 중...
                  </span>
                )}
                {player.ready && gameStarted && (
                  <span
                    className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(40,140,40,0.2)', color: '#80e880', border: '1px solid rgba(60,160,60,0.2)' }}
                  >
                    ✓ 준비
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        {isHost && !gameStarted && joinedPlayers.length > 0 && (
          <div
            className="mb-4 p-4 rounded-2xl"
            style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)' }}
          >
            <p className="text-xs font-medium mb-3 text-center" style={{ color: 'rgba(160,110,60,0.8)' }}>
              📋 친구들에게 링크를 공유하세요
            </p>
            <button
              onClick={copyLink}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(to right, #1a4a1a, #1c6c1c)', color: '#a0e8a0', border: '1px solid rgba(40,160,60,0.2)' }}
            >
              📋 링크 복사
            </button>
          </div>
        )}

        {!gameStarted ? (
          <button
            onClick={() => apiPost({ action: "startGame" })}
            disabled={!allJoined}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: allJoined ? 'linear-gradient(to right, #3a1a6a, #5a2a9a)' : 'rgba(20,12,8,0.6)',
              color: allJoined ? '#d8c0f8' : 'rgba(140,100,60,0.5)',
              boxShadow: allJoined ? '0 4px 24px rgba(80,30,150,0.3)' : 'none',
            }}
          >
            {allJoined ? '게임 시작 (역할 배정)' : `플레이어 대기 중... (${joinedPlayers.length}/6)`}
          </button>
        ) : (
          <>
            {currentPlayer && !currentPlayer.ready && (
              <button
                onClick={() => apiPost({ action: "ready", playerId: currentPlayerId })}
                className="w-full py-4 rounded-2xl font-bold text-base mb-3 transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to right, #1a4a1a, #2a6a2a)',
                  color: '#a0e8a0',
                  boxShadow: '0 4px 24px rgba(30,120,40,0.3)',
                }}
              >
                ✓ 준비 완료
              </button>
            )}
            {currentPlayer?.ready && (
              <div
                className="w-full mb-3 py-4 rounded-2xl text-center"
                style={{ background: 'rgba(12,35,12,0.6)', border: '1px solid rgba(60,160,60,0.2)' }}
              >
                <p className="font-semibold text-sm" style={{ color: '#80e880' }}>✓ 준비 완료</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(100,180,100,0.6)' }}>다른 플레이어들을 기다리는 중...</p>
              </div>
            )}
            <button
              onClick={() => apiPost({ action: "startNight" })}
              disabled={!allReady}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: allReady ? 'linear-gradient(to right, #1a0a40, #2a1060)' : 'rgba(20,12,8,0.6)',
                color: allReady ? '#c0a8f0' : 'rgba(140,100,60,0.5)',
                boxShadow: allReady ? '0 4px 24px rgba(50,20,120,0.35)' : 'none',
              }}
            >
              {allReady ? '첫 밤 시작' : `준비 대기 중... (${readyCount}/${gameState.players.length})`}
            </button>
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
