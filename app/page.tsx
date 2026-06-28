"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MusicPlayer from "./components/MusicPlayer";
import { ToastContainer, toast } from "./components/Toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Compass, Book, Users, ArrowRight } from "./components/icons";

const HeroScene = dynamic(() => import("./components/HeroScene"), { ssr: false });

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
        toast(data.error || "게임을 만들지 못했습니다.", "error");
      }
    } catch {
      setIsLoading(false);
      toast("게임을 만드는 중 문제가 생겼습니다.", "error");
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
        toast(data.error || "참여하지 못했습니다.", "error");
      }
    } catch {
      toast("참여하는 중 문제가 생겼습니다.", "error");
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
        toast("게임을 초기화했습니다.", "success");
        fetchRooms();
      } else {
        const error = await response.json();
        toast(error.error || "초기화하지 못했습니다.", "error");
      }
    } catch {
      toast("초기화하는 중 문제가 생겼습니다.", "error");
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-4 pb-32 overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* 따뜻한 앰비언트 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 50% at 50% 30%, rgba(140,28,36,0.16) 0%, transparent 68%)" }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,154,82,0.3), transparent)" }}
        />
      </div>

      <ToastContainer />

      {/* ── 히어로: 촛불 와인잔 ─────────────────────────────────────── */}
      <section className="relative w-full max-w-sm">
        <div className="relative h-[40vh] min-h-[260px] max-h-[360px]">
          <HeroScene />
          {/* 하단 페이드 — 잔이 콘텐츠로 자연스럽게 녹아들도록 */}
          <div
            className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--bg) 8%, transparent)" }}
          />
        </div>

        <div className="relative z-10 -mt-4 text-center animate-fade-in-up">
          <p className="eyebrow">집들이 미스터리 · 6인 추리극</p>
          <h1
            className="font-display mt-3 leading-[1.08] text-glow-candle"
            style={{ fontSize: "clamp(2.1rem, 9vw, 2.9rem)", color: "var(--ink)" }}
          >
            깨진 와인병의<br />비밀
          </h1>
          <div className="divider-ornament mt-5 mb-1 mx-auto max-w-[180px]">
            <span className="w-1 h-1 rounded-full" style={{ background: "var(--candle-soft)" }} />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--ink-muted)" }}>
            한 대의 폰을 돌리며 범인을 찾는 밤
          </p>
        </div>
      </section>

      {/* ── 메인 액션 ─────────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm mt-8 space-y-3 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        {/* 주 CTA */}
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="btn-wine w-full rounded-2xl text-left group disabled:opacity-60"
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className="flex items-center justify-center rounded-xl"
                style={{ width: 42, height: 42, background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,220,200,0.12)" }}
              >
                {isLoading
                  ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <Play size={18} style={{ color: "#F4E4D0" }} />}
              </span>
              <div>
                <span className="block font-semibold text-base" style={{ color: "#F4E4D0" }}>
                  {isLoading ? "방을 여는 중…" : "새 게임 만들기"}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: "rgba(244,228,208,0.6)" }}>
                  방을 열고 친구들에게 링크를 보내세요
                </span>
              </div>
            </div>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" style={{ color: "rgba(244,228,208,0.5)" }} />
          </div>
        </button>

        {/* 보조 액션 */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { Icon: Compass, label: "혼자 해보기", sub: "맵 둘러보기", path: "/demo" },
            { Icon: Book, label: "이야기", sub: "규칙과 배경", path: "/story" },
          ].map(({ Icon, label, sub, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="btn-ghost rounded-2xl p-4 text-left group"
            >
              <Icon size={22} className="mb-2.5 transition-transform group-hover:-translate-y-0.5" style={{ color: "var(--candle)" }} />
              <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{sub}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-0.5 px-1">
          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>정확히 6명이 필요합니다</p>
          <button
            onClick={handleReset}
            className="text-xs transition-colors hover:opacity-100"
            style={{ color: "var(--ink-faint)" }}
          >
            초기화
          </button>
        </div>
      </div>

      {/* ── 진행 중인 게임 ─────────────────────────────────────────── */}
      {activeRooms.length > 0 && (
        <div className="relative w-full max-w-sm mt-9 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--team-citizen)" }} />
            <span className="eyebrow" style={{ color: "var(--ink-muted)" }}>진행 중인 게임</span>
          </div>

          <div className="space-y-2.5">
            {activeRooms.map((room) => (
              <div key={room.gameId} className="paper-card rounded-2xl overflow-hidden">
                <div className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="num text-xs px-2 py-1 rounded-md" style={{ background: "rgba(232,184,100,0.1)", color: "var(--candle)" }}>
                        #{room.gameId.split("-")[1]?.slice(-4)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-muted)" }}>
                        <Users size={14} style={{ color: "var(--ink-faint)" }} />
                        <span className="num">{room.joinedCount}/{room.maxPlayers}</span>
                      </span>
                    </div>
                    <Badge variant={room.isStarted ? "success" : room.isFull ? "warning" : "info"}>
                      {room.isStarted ? "진행 중" : room.isFull ? "대기" : "참여 가능"}
                    </Badge>
                  </div>

                  {room.players.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.players.map((name, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(233,222,201,0.05)", color: "var(--ink-muted)", border: "1px solid var(--line)" }}
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
                        onKeyDown={(e) => { if (e.key === "Enter" && joinPlayerName.trim()) handleJoinRoom(room.gameId, joinPlayerName.trim()); }}
                        placeholder="이름을 입력하세요"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRoom(room.gameId, joinPlayerName.trim())}
                          disabled={!joinPlayerName.trim()}
                          className="btn-wine flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                        >
                          참여하기
                        </button>
                        <button
                          onClick={() => { setJoiningRoomId(null); setJoinPlayerName(""); }}
                          className="btn-ghost px-4 py-2.5 rounded-xl text-sm"
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
                      className={room.isFull && !room.isStarted ? "btn-ghost w-full py-2.5 rounded-xl text-sm font-semibold opacity-50" : "btn-wine w-full py-2.5 rounded-xl text-sm font-semibold"}
                    >
                      {room.isStarted ? "게임 참여" : room.isFull ? "대기 중…" : "참여하기"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRooms && activeRooms.length === 0 && (
        <p className="mt-9 text-xs text-center animate-fade-in" style={{ color: "var(--ink-faint)" }}>
          아직 진행 중인 게임이 없어요
        </p>
      )}

      <MusicPlayer />
    </main>
  );
}
