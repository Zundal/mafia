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
import CollapsiblePanel from "@/app/components/CollapsiblePanel";
import { ToastContainer, toast } from "@/app/components/Toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Clock, Gavel, Scroll, Copy, Check, Users, Mask,
  ArrowLeft, Search, WineGlass, Bottle, roleGlyph,
} from "@/app/components/icons";
import type { PlayerData } from "@/app/game/GameCanvas";

const GameCanvas = dynamic(() => import("@/app/game/GameCanvas"), { ssr: false });

// ── 로딩 화면 ──────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-deep)' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(140,28,36,0.16) 0%, transparent 70%)' }}
      />
      <div className="relative text-center animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <div className="spinner" />
        </div>
        <p style={{ color: 'var(--ink-muted)' }} className="text-base font-medium mb-1">게임을 불러오는 중...</p>
        <p style={{ color: 'var(--ink-faint)' }} className="text-sm">잠시만 기다려주세요</p>
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
        background: isUrgent ? 'rgba(140,28,36,0.14)' : isWarn ? 'rgba(232,184,100,0.08)' : 'rgba(13,10,6,0.6)',
        border: `1px solid ${isUrgent ? 'rgba(179,51,64,0.4)' : isWarn ? 'rgba(232,184,100,0.28)' : 'var(--line-strong)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="eyebrow inline-flex items-center gap-1.5" style={{ color: 'var(--ink-faint)' }}>
          <Clock size={13} /> 제한 시간
        </span>
        <span
          className="num font-bold text-sm"
          style={{ color: isUrgent ? 'var(--wine-bright)' : isWarn ? 'var(--candle)' : 'var(--candle-soft)' }}
        >
          {timeLeft === 0 ? '시간 초과!' : mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}초`}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(233,222,201,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isUrgent
              ? 'linear-gradient(to right, var(--wine), var(--wine-bright))'
              : isWarn
              ? 'linear-gradient(to right, var(--candle-soft), var(--candle))'
              : 'linear-gradient(to right, var(--candle-soft), var(--candle))',
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
      style={{ color: 'var(--ink-faint)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
    >
      <ArrowLeft size={16} /> 홈으로
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
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
        <div className="relative text-center animate-fade-in-up max-w-sm">
          <Search size={44} className="mx-auto mb-5" style={{ color: 'var(--ink-faint)' }} />
          <p className="font-display text-xl mb-3" style={{ color: 'var(--ink)' }}>게임을 찾을 수 없습니다</p>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>게임이 생성되지 않았거나 초기화되었습니다.</p>
          <button
            onClick={() => router.push("/")}
            className="btn-wine px-8 py-3 rounded-2xl font-semibold"
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
      <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(140,28,36,0.16) 0%, transparent 70%)' }}
        />
        <ToastContainer />
        <div className="relative max-w-md mx-auto pb-28">
          <BackButton onClick={() => router.push("/")} />

          {/* 타이틀 */}
          <div className="text-center mb-8">
            <p className="eyebrow mb-2">집들이 미스터리</p>
            <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>파티에 합류하기</h1>
          </div>

          {/* 참여 상태 */}
          <div
            className="rounded-2xl p-4 mb-5 text-center"
            style={{ background: 'rgba(27,21,16,0.85)', border: '1px solid var(--line-strong)' }}
          >
            <p className="num text-3xl font-bold mb-1" style={{ color: 'var(--ink)' }}>
              {joinedPlayers.length}<span className="text-base font-normal" style={{ color: 'var(--ink-faint)' }}> / 6</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>명 참여 완료</p>
            {allJoined && (
              <p className="text-sm font-semibold mt-2 animate-pulse inline-flex items-center justify-center gap-1.5" style={{ color: 'var(--team-citizen)' }}>
                <Check size={15} /> 모든 플레이어가 모였습니다!
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
              className="btn-wine px-5 h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{ minWidth: 72 }}
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
                  background: 'rgba(27,21,16,0.85)',
                  border: '1px solid var(--line)',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="num w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(232,184,100,0.12)', color: 'var(--candle)' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{player.name}</span>
                  {idx === 0 && (
                    <span
                      className="eyebrow px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(232,184,100,0.12)', color: 'var(--candle)', border: '1px solid rgba(232,184,100,0.2)', fontSize: '0.625rem' }}
                    >
                      호스트
                    </span>
                  )}
                </div>
                <Check size={16} style={{ color: 'var(--team-citizen)' }} />
              </div>
            ))}
            {joinedPlayers.length === 0 && (
              <p className="text-center text-sm py-6" style={{ color: 'var(--ink-faint)' }}>
                아직 아무도 오지 않았네요...
              </p>
            )}
          </div>

          {isHost && joinedPlayers.length > 0 && (
            <div
              className="mt-5 p-4 rounded-2xl"
              style={{ background: 'rgba(27,21,16,0.85)', border: '1px solid var(--line-strong)' }}
            >
              <p className="eyebrow mb-3 text-center" style={{ color: 'var(--ink-muted)' }}>
                친구들에게 링크를 공유하세요
              </p>
              <button
                onClick={copyLink}
                className="btn-ghost w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Copy size={16} /> 링크 복사
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
      citizens: { color: 'var(--team-citizen)', glow: 'rgba(134,176,124,0.14)', Icon: Users,     label: '시민 팀 승리', sub: '범인의 정체가 드러났습니다' },
      mafia:    { color: 'var(--team-mafia)',   glow: 'rgba(194,73,90,0.16)',  Icon: WineGlass,  label: '마피아 팀 승리', sub: '범인이 끝까지 살아남았습니다' },
      drunkard: { color: 'var(--team-drunkard)',glow: 'rgba(232,184,100,0.14)',Icon: Bottle,     label: '만취객 승리', sub: '만취객이 결국 쫓겨났습니다' },
    };
    const wc = winColors[gameState.winner as keyof typeof winColors] ?? winColors.citizens;
    const WinIcon = wc.Icon;

    return (
      <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
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
            className="relative overflow-hidden rounded-2xl p-6 mb-6 text-center animate-fade-in-up"
            style={{
              background: `linear-gradient(180deg, ${wc.glow}, rgba(13,10,6,0.6))`,
              border: '1px solid var(--line-strong)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${wc.color}55, transparent)` }}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${wc.color}40`, color: wc.color }}
            >
              <WinIcon size={28} />
            </div>
            <h2 className="font-display text-3xl mb-1" style={{ color: wc.color }}>{wc.label}</h2>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{wc.sub}</p>
            <div className="h-px mt-5 mb-4" style={{ background: 'var(--line)' }} />
            <p className="eyebrow mb-3">게임 기록</p>
            <div className="space-y-1.5 text-left">
              {gameState.history.map((event, i) => (
                <p key={i} className="text-xs leading-relaxed pl-2.5 border-l" style={{ color: 'var(--ink-muted)', borderColor: 'var(--line-strong)' }}>
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
            className="btn-wine w-full mt-6 py-4 rounded-2xl font-bold text-base"
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
      mafia:  { color: 'var(--team-mafia)',   borderColor: 'rgba(194,73,90,0.3)',  bg: 'rgba(140,28,36,0.16)'  },
      police: { color: 'var(--candle)',       borderColor: 'rgba(232,184,100,0.3)', bg: 'rgba(232,184,100,0.10)' },
      doctor: { color: 'var(--team-citizen)', borderColor: 'rgba(134,176,124,0.3)', bg: 'rgba(134,176,124,0.10)' },
    };
    const rs = currentPlayer?.role ? (roleStyle[currentPlayer.role] ?? roleStyle.doctor) : roleStyle.doctor;
    const RoleGlyph = currentPlayer?.role ? (roleGlyph[currentPlayer.role] ?? roleGlyph.doctor) : roleGlyph.doctor;

    const investigation =
      currentPlayer?.role === "police" && gameState.nightActions?.investigate?.playerId === currentPlayerId
        ? gameState.nightActions.investigate
        : null;
    const nightPeek = !canAct ? (
      <span>잠든 척 · 지도를 자유롭게 이동하세요</span>
    ) : done ? (
      investigation ? (
        <span style={{ color: investigation.result ? 'var(--wine-bright)' : 'var(--team-citizen)' }}>
          {investigation.result ? '조사 결과: 범인입니다!' : '조사 결과: 범인이 아닙니다'}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5"><Check size={14} /> 완료 · 다른 사람 대기 중 ({readyCount}/{needsAction.length})</span>
      )
    ) : (
      <span>
        {currentPlayer?.role === "mafia" && "제거할 대상을 선택하세요"}
        {currentPlayer?.role === "police" && "조사할 사람을 선택하세요"}
        {currentPlayer?.role === "doctor" && "보호할 사람을 선택하세요"}
      </span>
    );

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
        <CollapsiblePanel peek={nightPeek} maxHeightClass="max-h-[54vh]">
            {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

            {canAct ? (
              done ? (
                <div
                  className="text-center p-4 rounded-2xl"
                  style={{ background: 'rgba(134,176,124,0.10)', border: '1px solid rgba(134,176,124,0.25)' }}
                >
                  <div className="flex justify-center mb-2" style={{ color: rs.color }}>
                    <RoleGlyph size={26} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: 'var(--team-citizen)' }}>완료했습니다</p>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>다른 사람들을 기다리는 중...</p>
                  {currentPlayer?.role === "police" && gameState.nightActions?.investigate?.playerId === currentPlayerId && (
                    <div
                      className="mt-3 p-3 rounded-xl"
                      style={{
                        background: gameState.nightActions.investigate.result ? 'rgba(140,28,36,0.16)' : 'rgba(134,176,124,0.10)',
                        border: `1px solid ${gameState.nightActions.investigate.result ? 'rgba(194,73,90,0.3)' : 'rgba(134,176,124,0.25)'}`,
                      }}
                    >
                      <p className="font-bold text-base" style={{ color: gameState.nightActions.investigate.result ? 'var(--wine-bright)' : 'var(--team-citizen)' }}>
                        {gameState.nightActions.investigate.result ? '범인입니다!' : '범인이 아닙니다.'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>이 정보를 잘 활용하세요</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: rs.bg, border: `1px solid ${rs.borderColor}` }}
                  >
                    <p className="font-semibold text-sm mb-0.5 inline-flex items-center gap-2" style={{ color: rs.color }}>
                      <RoleGlyph size={16} />
                      {currentPlayer?.role === "mafia" && "오늘 밤 누구를 제거하시겠습니까?"}
                      {currentPlayer?.role === "police" && "오늘 밤 누구를 조사하시겠습니까?"}
                      {currentPlayer?.role === "doctor" && "오늘 밤 누구를 보호하시겠습니까?"}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
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
                        className={cn("min-h-[52px] px-3 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-95")}
                        style={{
                          background: selectedPlayerId === player.id
                            ? 'linear-gradient(145deg, #6E141B, var(--wine))'
                            : 'rgba(27,21,16,0.7)',
                          color: selectedPlayerId === player.id ? '#F4E4D0' : 'var(--ink-muted)',
                          border: `1px solid ${selectedPlayerId === player.id ? 'rgba(179,51,64,0.4)' : 'var(--line)'}`,
                          boxShadow: selectedPlayerId === player.id ? '0 4px 16px rgba(140,28,36,0.3)' : 'none',
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
                      className="btn-wine w-full py-3.5 rounded-xl font-bold text-sm"
                    >
                      {currentPlayer?.role === "mafia" ? "제거하기" : currentPlayer?.role === "police" ? "조사하기" : "보호하기"}
                    </button>
                  )}
                </>
              )
            ) : (
              <div className="text-center py-4">
                <p className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>잠든 척하며 기다리세요</p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>지도에서 자유롭게 이동할 수 있어요</p>
              </div>
            )}

            {needsAction.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(13,10,6,0.6)', border: '1px solid var(--line)' }}>
                <p className="text-xs text-center mb-2" style={{ color: 'var(--ink-muted)' }}>
                  준비 완료 <span style={{ color: 'var(--candle)' }} className="num font-bold">{readyCount}</span>/{needsAction.length}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {needsAction.map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{
                        background: p.ready ? 'rgba(134,176,124,0.14)' : 'rgba(233,222,201,0.05)',
                        color: p.ready ? 'var(--team-citizen)' : 'var(--ink-faint)',
                        border: `1px solid ${p.ready ? 'rgba(134,176,124,0.25)' : 'var(--line)'}`,
                      }}
                    >
                      {p.name} {p.ready ? <Check size={12} /> : <Clock size={12} />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => apiPost({ action: "endNight" })}
              disabled={!allReady}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: allReady ? 'linear-gradient(145deg, var(--candle-soft), var(--candle))' : 'rgba(27,21,16,0.6)',
                color: allReady ? 'var(--bg-deep)' : 'var(--ink-faint)',
                border: `1px solid ${allReady ? 'rgba(232,184,100,0.4)' : 'var(--line)'}`,
              }}
            >
              {allReady ? '밤 페이즈 종료' : `대기 중... (${readyCount}/${needsAction.length})`}
            </button>
        </CollapsiblePanel>
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
        <CollapsiblePanel
          peek={<span>토론 시간 · 준비되면 투표 시작</span>}
          maxHeightClass="max-h-[52vh]"
        >
            {/* 토론 안내 */}
            <div
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(232,184,100,0.08)', border: '1px solid rgba(232,184,100,0.22)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--candle)' }}>토론 시간</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                자유롭게 이야기하며 범인을 추리하세요
              </p>
            </div>

            {/* 아침 뉴스 */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(27,21,16,0.6)', border: '1px solid var(--line-strong)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--line)' }}
              >
                <Scroll size={15} style={{ color: 'var(--candle)' }} />
                <span className="eyebrow" style={{ color: 'var(--candle-soft)' }}>아침 뉴스</span>
                <span className="ml-auto text-[10px]" style={{ color: 'var(--ink-faint)' }}>방금 들어온 소식</span>
              </div>
              <div className="p-3 space-y-2">
                {gameState.history.slice(-3).map((event, i) => (
                  <p
                    key={i}
                    className="text-xs leading-relaxed pl-2.5 border-l"
                    style={{
                      color: i === 0 ? 'var(--ink)' : 'var(--ink-muted)',
                      borderColor: i === 0 ? 'rgba(232,184,100,0.45)' : 'var(--line)',
                    }}
                  >
                    {event}
                  </p>
                ))}
              </div>
            </div>

            {/* 생존자 */}
            <div>
              <p className="eyebrow mb-1.5" style={{ color: 'var(--ink-faint)' }}>
                생존자 ({gameState.players.filter(p => p.isAlive).length}명)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players.filter((p) => p.isAlive).map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{
                      background: p.id === currentPlayerId ? 'rgba(232,184,100,0.12)' : 'rgba(233,222,201,0.05)',
                      color: p.id === currentPlayerId ? 'var(--candle)' : 'var(--ink-muted)',
                      border: `1px solid ${p.id === currentPlayerId ? 'rgba(232,184,100,0.25)' : 'var(--line)'}`,
                    }}
                  >
                    {p.name}{p.id === currentPlayerId ? ' (나)' : ''}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => apiPost({ action: "startVoting" })}
              className="btn-wine w-full py-3.5 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2"
            >
              <Gavel size={16} /> 투표 시작
            </button>
        </CollapsiblePanel>
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
        style={{ background: 'var(--bg-deep)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(140,28,36,0.16) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-72 h-72 rounded-full blur-[80px] animate-float" style={{ background: 'rgba(140,28,36,0.12)' }} />
          <div className="absolute bottom-[15%] right-[5%] w-60 h-60 rounded-full blur-[70px] animate-float-delayed" style={{ background: 'rgba(232,184,100,0.08)' }} />
        </div>

        <ToastContainer />
        <div className="relative max-w-md mx-auto pb-28">
          <BackButton onClick={() => router.push("/")} />
          <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />
          <PhaseTimer phaseEndTime={gameState.phaseEndTime} phase={gameState.phase} />

          {/* 투표 진행 바 */}
          <div
            className="rounded-xl p-3.5 mb-4 mt-3"
            style={{ background: 'rgba(27,21,16,0.7)', border: '1px solid var(--line-strong)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow" style={{ color: 'var(--ink-muted)' }}>투표 현황</span>
              <span className="num text-xs font-bold" style={{ color: 'var(--wine-bright)' }}>
                {votedCount}<span style={{ color: 'var(--ink-faint)' }}>/{aliveCount}명</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(233,222,201,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${aliveCount > 0 ? (votedCount / aliveCount) * 100 : 0}%`,
                  background: 'linear-gradient(to right, var(--wine), var(--wine-bright))',
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
                  background: player.votedFor ? 'rgba(134,176,124,0.10)' : 'rgba(27,21,16,0.6)',
                  border: `1px solid ${player.votedFor ? 'rgba(134,176,124,0.25)' : 'var(--line)'}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{player.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{
                      background: player.votedFor ? 'rgba(134,176,124,0.14)' : 'rgba(233,222,201,0.05)',
                      color: player.votedFor ? 'var(--team-citizen)' : 'var(--ink-faint)',
                    }}
                  >
                    {player.votedFor ? <><Check size={12} /> 완료</> : <><Clock size={12} /> 대기</>}
                  </span>
                  {gameState.voteResults?.[player.id] && (
                    <span
                      className="num text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(194,73,90,0.18)', color: '#e08a96', border: '1px solid rgba(194,73,90,0.25)' }}
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
    <div className="relative min-h-screen p-4 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 25%, rgba(140,28,36,0.16) 0%, transparent 70%)' }}
      />
      <ToastContainer />
      <div className="relative max-w-md mx-auto pb-28">
        <BackButton onClick={() => router.push("/")} />
        <PhaseIndicator phase={gameState.phase} currentNight={gameState.currentNight} />

        {/* 상태 배너 */}
        {!allJoined && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center"
            style={{ background: 'rgba(27,21,16,0.7)', border: '1px solid var(--line-strong)' }}
          >
            <p className="text-sm font-medium mb-1 inline-flex items-center justify-center gap-1.5" style={{ color: 'var(--candle)' }}>
              <Clock size={14} /> 플레이어를 기다리는 중...
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              참여 <span className="num font-bold" style={{ color: 'var(--candle)' }}>{joinedPlayers.length}</span>/6
            </p>
          </div>
        )}
        {allJoined && !gameStarted && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center animate-fade-in"
            style={{ background: 'rgba(134,176,124,0.10)', border: '1px solid rgba(134,176,124,0.25)' }}
          >
            <p className="text-sm font-medium inline-flex items-center justify-center gap-1.5" style={{ color: 'var(--team-citizen)' }}>
              <Check size={15} /> 모두 모였습니다!
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>&quot;게임 시작&quot;으로 역할을 배정하세요</p>
          </div>
        )}
        {gameStarted && !allReady && (
          <div
            className="rounded-xl p-3.5 mb-4 text-center"
            style={{ background: 'rgba(27,21,16,0.7)', border: '1px solid var(--line-strong)' }}
          >
            <p className="text-sm font-medium mb-1 inline-flex items-center justify-center gap-1.5" style={{ color: 'var(--candle)' }}>
              <Clock size={14} /> 모두 준비할 때까지 기다리는 중...
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              준비 <span className="num font-bold" style={{ color: 'var(--candle)' }}>{readyCount}</span>/{gameState.players.length}
            </p>
          </div>
        )}

        {/* 플레이어 목록 */}
        <div
          className="paper-card rounded-2xl mb-5 overflow-hidden"
        >
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--candle)' }}>
              {gameStarted ? <Mask size={20} /> : <Users size={20} />}
            </span>
            <div>
              <h2 className="font-display text-base" style={{ color: 'var(--ink)' }}>
                {gameStarted ? '역할 배정' : '파티 초대장'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                {gameStarted ? '역할을 확인한 후 폰을 다음 사람에게 넘겨주세요.' : '모든 플레이어가 참여하면 게임을 시작할 수 있습니다.'}
              </p>
            </div>
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
                  <span className="absolute top-3 right-3 text-xs" style={{ color: 'var(--ink-faint)' }}>
                    대기 중...
                  </span>
                )}
                {player.ready && gameStarted && (
                  <span
                    className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{ background: 'rgba(134,176,124,0.14)', color: 'var(--team-citizen)', border: '1px solid rgba(134,176,124,0.25)' }}
                  >
                    <Check size={12} /> 준비
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {currentPlayer?.mission && <MissionCard mission={currentPlayer.mission} />}

        {isHost && !gameStarted && joinedPlayers.length > 0 && (
          <div
            className="paper-card mb-4 p-4 rounded-2xl"
          >
            <p className="eyebrow mb-3 text-center" style={{ color: 'var(--ink-muted)' }}>
              친구들에게 링크를 공유하세요
            </p>
            <button
              onClick={copyLink}
              className="btn-ghost w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Copy size={16} /> 링크 복사
            </button>
          </div>
        )}

        {!gameStarted ? (
          <button
            onClick={() => apiPost({ action: "startGame" })}
            disabled={!allJoined}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40",
              allJoined ? "btn-wine" : ""
            )}
            style={allJoined ? undefined : {
              background: 'rgba(27,21,16,0.6)',
              color: 'var(--ink-faint)',
              border: '1px solid var(--line)',
            }}
          >
            {allJoined ? '게임 시작 (역할 배정)' : `플레이어 대기 중... (${joinedPlayers.length}/6)`}
          </button>
        ) : (
          <>
            {currentPlayer && !currentPlayer.ready && (
              <button
                onClick={() => apiPost({ action: "ready", playerId: currentPlayerId })}
                className="w-full py-4 rounded-2xl font-bold text-base mb-3 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(145deg, #5E7A55, var(--team-citizen))',
                  color: 'var(--bg-deep)',
                  border: '1px solid rgba(134,176,124,0.4)',
                }}
              >
                <Check size={18} /> 준비 완료
              </button>
            )}
            {currentPlayer?.ready && (
              <div
                className="w-full mb-3 py-4 rounded-2xl text-center"
                style={{ background: 'rgba(134,176,124,0.10)', border: '1px solid rgba(134,176,124,0.25)' }}
              >
                <p className="font-semibold text-sm inline-flex items-center justify-center gap-1.5" style={{ color: 'var(--team-citizen)' }}>
                  <Check size={15} /> 준비 완료
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>다른 플레이어들을 기다리는 중...</p>
              </div>
            )}
            <button
              onClick={() => apiPost({ action: "startNight" })}
              disabled={!allReady}
              className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: allReady ? 'linear-gradient(145deg, var(--candle-soft), var(--candle))' : 'rgba(27,21,16,0.6)',
                color: allReady ? 'var(--bg-deep)' : 'var(--ink-faint)',
                border: `1px solid ${allReady ? 'rgba(232,184,100,0.4)' : 'var(--line)'}`,
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
