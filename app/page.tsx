"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MusicPlayer from "./components/MusicPlayer";
import { ToastContainer, toast } from "./components/Toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GameRoom {
  gameId: string;
  status: string;
  phase: string;
  joinedCount: number;
  maxPlayers: number;
  isFull: boolean;
  isStarted: boolean;
  players: string[];
}

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [joinPlayerName, setJoinPlayerName] = useState("");

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const gameId = `game-${Date.now()}`;
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", gameId }),
      });
      const data = await response.json();
      if (response.ok && data.gameId) {
        router.push(`/game?gameId=${gameId}&host=true`);
      } else {
        setIsLoading(false);
        toast(data.error || "게임 생성에 실패했습니다.", "error");
      }
    } catch {
      setIsLoading(false);
      toast("게임 생성 중 오류가 발생했습니다.", "error");
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/game?list=true");
      const data = await response.json();
      if (data.games) setActiveRooms(data.games);
      setLoadingRooms(false);
    } catch {
      setLoadingRooms(false);
    }
  };

  const handleJoinRoom = async (gameId: string, playerName: string) => {
    if (!playerName.trim()) { toast("이름을 입력해주세요.", "warning"); return; }
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", playerName: playerName.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.joinedPlayerId) {
        localStorage.setItem(`player-${gameId}`, data.joinedPlayerId);
        setJoiningRoomId(null);
        setJoinPlayerName("");
        router.push(`/game?gameId=${gameId}`);
      } else {
        toast(data.error || "게임 참여에 실패했습니다.", "error");
      }
    } catch {
      toast("게임 참여 중 오류가 발생했습니다.", "error");
    }
  };

  const handleReset = async () => {
    if (!confirm("진행 중인 게임을 초기화하시겠습니까?")) return;
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (response.ok) {
        toast("게임이 초기화되었습니다.", "success");
        fetchRooms();
      } else {
        const error = await response.json();
        toast(error.error || "게임 초기화에 실패했습니다.", "error");
      }
    } catch {
      toast("게임 초기화 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center p-4 pb-32 overflow-hidden"
      style={{ background: '#0c0704' }}
    >
      {/* 따뜻한 중심 글로우 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 55% at 50% 38%, rgba(110,35,15,0.22) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(160,90,40,0.35), transparent)' }}
        />
        <div className="absolute top-[15%] left-[20%] w-80 h-80 bg-red-950/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[10%] right-[15%] w-64 h-64 bg-amber-950/15 rounded-full blur-[80px] animate-float-delayed" />
      </div>

      <ToastContainer />

      {/* ── 타이틀 ────────────────────────────────────────────────── */}
      <div className="relative text-center mb-10 animate-fade-in-up">
        <div
          className="mb-4 select-none"
          style={{ fontSize: 64, filter: 'drop-shadow(0 0 28px rgba(180,50,20,0.5))' }}
        >
          🍷
        </div>
        <h1
          className="font-bold tracking-tight mb-2 leading-none"
          style={{
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            color: '#e4ccaa',
            textShadow: '0 2px 24px rgba(180,110,40,0.35), 0 0 80px rgba(140,70,20,0.15)',
          }}
        >
          집들이 미스터리
        </h1>
        <p
          className="text-xs font-medium tracking-[0.35em] uppercase"
          style={{ color: 'rgba(160,110,60,0.7)' }}
        >
          깨진 와인병의 비밀
        </p>
        {/* 장식 구분선 */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, rgba(140,90,45,0.45))' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(160,100,50,0.5)' }} />
          <div className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, rgba(140,90,45,0.45))' }} />
        </div>
      </div>

      {/* ── 메인 액션 ─────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-xs space-y-3 animate-fade-in-up"
        style={{ animationDelay: '0.08s' }}
      >
        {/* 게임 생성 — 주 CTA */}
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full relative overflow-hidden rounded-2xl text-left group active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{
            background: 'linear-gradient(150deg, #5c1212 0%, #8c1c1c 45%, #621010 100%)',
            border: '1px solid rgba(200,70,50,0.22)',
            boxShadow: '0 4px 28px rgba(90,15,10,0.65), inset 0 1px 0 rgba(255,180,120,0.07)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(255,160,100,0.2), transparent)' }}
          />
          <div className="relative px-5 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                {isLoading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <span className="text-xl">🎮</span>
                }
                <span className="font-bold text-base" style={{ color: '#f0d8b8' }}>
                  {isLoading ? '생성 중...' : '새 게임 시작'}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(190,130,80,0.65)' }}>
                6명 · 방 생성 후 링크를 공유하세요
              </p>
            </div>
            <span
              className="text-lg transition-transform group-hover:translate-x-0.5"
              style={{ color: 'rgba(190,120,70,0.55)' }}
            >→</span>
          </div>
        </button>

        {/* 보조 액션 2열 */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: '🚶', label: '혼자 해보기', sub: '맵 탐험', path: '/demo' },
            { icon: '📖', label: '스토리', sub: '규칙 & 배경', path: '/story' },
          ].map(({ icon, label, sub, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="relative rounded-2xl p-4 text-left group active:scale-[0.97] transition-all"
              style={{
                background: 'rgba(18,10,6,0.85)',
                border: '1px solid rgba(120,75,40,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,210,140,0.03)',
              }}
            >
              <div className="text-2xl mb-2 transition-transform group-hover:-translate-y-0.5">{icon}</div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#d0b590' }}>{label}</p>
              <p className="text-xs" style={{ color: 'rgba(140,95,55,0.65)' }}>{sub}</p>
            </button>
          ))}
        </div>

        {/* 하단 유틸 */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: 'rgba(90,60,35,0.7)' }}>정확히 6명이 필요합니다</p>
          <button
            onClick={handleReset}
            className="text-xs transition-colors"
            style={{ color: 'rgba(90,60,35,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(160,100,55,0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(90,60,35,0.6)')}
          >
            초기화
          </button>
        </div>
      </div>

      {/* ── 활성 게임 목록 ─────────────────────────────────────────── */}
      {activeRooms.length > 0 && (
        <div
          className="relative w-full max-w-xs mt-8 animate-fade-in-up"
          style={{ animationDelay: '0.15s' }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(150,100,55,0.8)' }}>
              진행 중인 게임
            </span>
          </div>

          <div className="space-y-2.5">
            {activeRooms.map((room) => (
              <div
                key={room.gameId}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(16,8,5,0.88)',
                  border: '1px solid rgba(120,75,40,0.2)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#d8c0a0' }}>
                        방{' '}
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(160,100,50,0.12)', color: '#c8a070' }}
                        >
                          {room.gameId.split('-')[1]}
                        </span>
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(130,90,50,0.7)' }}>
                        {room.joinedCount}/{room.maxPlayers}명 참여
                      </p>
                    </div>
                    <Badge
                      variant={room.isStarted ? 'success' : room.isFull ? 'warning' : 'info'}
                    >
                      {room.isStarted ? '● 진행 중' : room.isFull ? '⏳ 대기' : '✦ 참여 가능'}
                    </Badge>
                  </div>

                  {room.players.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {room.players.map((name, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(120,75,40,0.15)', color: 'rgba(180,130,80,0.8)', border: '1px solid rgba(120,75,40,0.15)' }}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {joiningRoomId === room.gameId ? (
                    <div className="space-y-2">
                      <Input
                        value={joinPlayerName}
                        onChange={(e) => setJoinPlayerName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && joinPlayerName.trim()) handleJoinRoom(room.gameId, joinPlayerName.trim()); }}
                        placeholder="이름을 입력하세요"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRoom(room.gameId, joinPlayerName.trim())}
                          disabled={!joinPlayerName.trim()}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                          style={{
                            background: 'linear-gradient(to right, #5c1212, #8c1c1c)',
                            color: '#f0d8b8',
                          }}
                        >
                          참여하기
                        </button>
                        <button
                          onClick={() => { setJoiningRoomId(null); setJoinPlayerName(''); }}
                          className="px-4 py-2 rounded-xl text-sm transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(180,140,100,0.7)', border: '1px solid rgba(120,80,45,0.2)' }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (room.isStarted) router.push(`/game?gameId=${room.gameId}`);
                        else setJoiningRoomId(room.gameId);
                      }}
                      disabled={room.isFull && !room.isStarted}
                      className={cn(
                        'w-full py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40',
                      )}
                      style={{
                        background: room.isFull && !room.isStarted ? 'rgba(255,255,255,0.04)' : 'linear-gradient(to right, #4a1010, #7a1818)',
                        color: room.isFull && !room.isStarted ? 'rgba(150,110,70,0.6)' : '#f0d8b8',
                        border: '1px solid rgba(160,80,50,0.2)',
                      }}
                    >
                      {room.isStarted ? '게임 참여' : room.isFull ? '대기 중...' : '참여하기'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRooms && activeRooms.length === 0 && (
        <p
          className="mt-8 text-xs text-center animate-fade-in"
          style={{ color: 'rgba(90,60,35,0.55)' }}
        >
          진행 중인 게임이 없습니다
        </p>
      )}

      <MusicPlayer />
    </main>
  );
}
