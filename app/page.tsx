"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MusicPlayer from "./components/MusicPlayer";
import { ToastContainer, toast } from "./components/Toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
        setIsLoading(false);
        router.push(`/game?gameId=${gameId}&host=true`);
      } else {
        setIsLoading(false);
        toast(data.error || "게임 생성에 실패했습니다.", "error");
      }
    } catch (error) {
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
    <main className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/60 to-stone-950 p-3 sm:p-4 flex flex-col items-center justify-center pb-28 overflow-hidden">
      {/* 배경 앰비언트 오브 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-red-900/15 rounded-full blur-3xl animate-float" />
        <div className="absolute top-[30%] right-[-10%] w-64 h-64 bg-amber-900/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-[10%] left-[10%] w-48 h-48 bg-rose-950/15 rounded-full blur-3xl animate-float-slow" />
      </div>

      <ToastContainer />

      <Card className="relative w-full max-w-md rounded-3xl animate-fade-in-up">
        {/* 카드 상단 골드 글로우 라인 */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full" />

        <CardHeader className="text-center pb-4">
          <div className="inline-block relative mb-1">
            <div className="absolute inset-0 blur-2xl bg-red-800/25 rounded-full scale-150" />
            <h1 className="relative text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent leading-tight text-glow-gold">
              🍷 집들이 미스터리
            </h1>
          </div>
          <CardDescription className="text-stone-400 text-sm font-medium tracking-wider uppercase mt-2">
            깨진 와인병의 비밀
          </CardDescription>
          <Separator glow className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 게임 안내 */}
          <div className="rounded-2xl p-4 border border-amber-600/20 bg-gradient-to-br from-amber-900/10 to-red-900/8">
            <p className="text-amber-400 font-semibold text-sm mb-3 text-center flex items-center justify-center gap-1.5">
              <span>📱</span> 게임 방법
            </p>
            <ol className="text-stone-300 text-xs space-y-2">
              {[
                '"게임 생성" 버튼을 누르세요',
                '생성된 링크를 다른 플레이어들에게 공유하세요',
                '각 플레이어는 자신의 이름을 입력하세요',
                '6명이 모두 참여하면 게임이 시작됩니다',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 게임 생성 버튼 */}
          <Button
            variant="gradient"
            size="xl"
            className="w-full glow-gold"
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                게임 생성 중...
              </>
            ) : (
              "🎮 게임 생성"
            )}
          </Button>

          <Button
            variant="glass"
            size="default"
            className="w-full h-11"
            onClick={() => router.push("/story")}
          >
            📖 스토리 보기
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-stone-500 hover:text-red-400 hover:bg-red-900/10"
            onClick={handleReset}
          >
            🔄 게임 초기화
          </Button>

          <p className="text-stone-600 text-xs text-center">
            정확히 6명의 플레이어가 필요합니다
          </p>
        </CardContent>
      </Card>

      {/* 활성 게임 목록 */}
      {activeRooms.length > 0 && (
        <Card className="relative w-full max-w-md mt-5 rounded-3xl animate-fade-in-up">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-full" />
          <CardHeader className="pb-3">
            <CardTitle className="text-center flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              활성 게임
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {activeRooms.map((room) => (
              <div
                key={room.gameId}
                className="glass rounded-2xl p-4 border border-stone-700/40 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-stone-200 font-semibold text-sm mb-0.5">
                      방{" "}
                      <span className="text-amber-400 font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {room.gameId.split("-")[1]}
                      </span>
                    </p>
                    <p className="text-stone-400 text-xs">{room.joinedCount}/{room.maxPlayers}명 참여</p>
                  </div>
                  <div>
                    {room.isStarted ? (
                      <Badge variant="success">● 진행 중</Badge>
                    ) : room.isFull ? (
                      <Badge variant="warning">⏳ 대기 중</Badge>
                    ) : (
                      <Badge variant="info">✦ 참여 가능</Badge>
                    )}
                  </div>
                </div>

                {room.players.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {room.players.map((name, idx) => (
                      <Badge key={idx} variant="secondary" className="text-stone-300 bg-stone-800/60">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}

                {joiningRoomId === room.gameId ? (
                  <div className="space-y-2">
                    <Input
                      value={joinPlayerName}
                      onChange={(e) => setJoinPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && joinPlayerName.trim()) {
                          handleJoinRoom(room.gameId, joinPlayerName.trim());
                        }
                      }}
                      placeholder="당신의 이름을 입력하세요"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="gradient"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleJoinRoom(room.gameId, joinPlayerName.trim())}
                        disabled={!joinPlayerName.trim()}
                      >
                        참여하기
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => { setJoiningRoomId(null); setJoinPlayerName(""); }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={room.isFull && !room.isStarted ? "secondary" : "gradient"}
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (room.isStarted) {
                        router.push(`/game?gameId=${room.gameId}`);
                      } else {
                        setJoiningRoomId(room.gameId);
                      }
                    }}
                    disabled={room.isFull && !room.isStarted}
                  >
                    {room.isStarted ? "게임 참여" : room.isFull ? "대기 중..." : "참여하기"}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!loadingRooms && activeRooms.length === 0 && (
        <Card variant="glass" className="w-full max-w-md mt-5 rounded-2xl">
          <CardContent className="py-4 text-center">
            <p className="text-stone-500 text-sm">현재 활성 게임이 없습니다. 새 게임을 생성해주세요.</p>
          </CardContent>
        </Card>
      )}

      <MusicPlayer />
    </main>
  );
}
