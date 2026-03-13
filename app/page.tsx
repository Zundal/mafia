"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MusicPlayer from "./components/MusicPlayer";
import { ToastContainer, toast } from "./components/Toast";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4 flex flex-col items-center justify-center">
      <ToastContainer />

      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl border border-slate-700/50 animate-fade-in-up">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
            🍷 집들이 미스터리
          </h1>
          <p className="text-slate-300 text-sm font-medium">
            깨진 와인병의 비밀
          </p>
        </div>

        {/* 게임 안내 */}
        <div className="glass-light rounded-xl p-4 mb-6 border border-cyan-500/30 bg-cyan-500/10">
          <p className="text-cyan-400 font-semibold text-sm mb-2 text-center">
            📱 게임 방법
          </p>
          <ol className="text-slate-300 text-xs space-y-1.5 list-decimal list-inside">
            <li>"게임 생성" 버튼을 누르세요</li>
            <li>생성된 링크를 다른 플레이어들에게 공유하세요</li>
            <li>각 플레이어는 자신의 이름을 입력하세요</li>
            <li>6명이 모두 참여하면 게임이 시작됩니다</li>
          </ol>
        </div>

        {/* 게임 생성 버튼 */}
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
            isLoading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
          }`}
        >
          {isLoading ? (
            <>
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              게임 생성 중...
            </>
          ) : (
            "🎮 게임 생성"
          )}
        </button>

        <div className="flex gap-3 mt-3">
          <button
            onClick={() => router.push("/story")}
            className="w-full glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50 active:scale-95"
          >
            📖 스토리 보기
          </button>
        </div>

        <button
          onClick={handleReset}
          className="w-full mt-3 glass-light hover:bg-red-900/20 text-slate-400 hover:text-red-400 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50 hover:border-red-500/30 active:scale-95 text-sm"
        >
          🔄 게임 초기화
        </button>

        <p className="text-slate-500 text-xs text-center mt-5">
          정확히 6명의 플레이어가 필요합니다
        </p>
      </div>

      {/* 활성 게임 목록 */}
      {activeRooms.length > 0 && (
        <div className="w-full max-w-md mt-6 glass rounded-3xl p-6 shadow-2xl border border-slate-700/50 animate-fade-in-up">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center mb-4">
            🎮 활성 게임
          </h2>
          <div className="space-y-3">
            {activeRooms.map((room) => (
              <div
                key={room.gameId}
                className="glass rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-200 font-semibold text-sm mb-0.5">
                      방 ID: <span className="text-cyan-400 font-mono text-xs">{room.gameId.split("-")[1]}</span>
                    </p>
                    <p className="text-slate-400 text-xs">
                      참여: {room.joinedCount}/{room.maxPlayers}명
                    </p>
                  </div>
                  <div>
                    {room.isStarted ? (
                      <span className="text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">진행 중</span>
                    ) : room.isFull ? (
                      <span className="text-amber-400 text-xs font-semibold bg-amber-500/20 px-2 py-1 rounded-full">대기 중</span>
                    ) : (
                      <span className="text-cyan-400 text-xs font-semibold bg-cyan-500/20 px-2 py-1 rounded-full">참여 가능</span>
                    )}
                  </div>
                </div>

                {room.players.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {room.players.map((name, idx) => (
                      <span key={idx} className="text-slate-300 text-xs bg-slate-800/50 px-2 py-0.5 rounded">
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {joiningRoomId === room.gameId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={joinPlayerName}
                      onChange={(e) => setJoinPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && joinPlayerName.trim()) {
                          handleJoinRoom(room.gameId, joinPlayerName.trim());
                        }
                      }}
                      placeholder="당신의 이름을 입력하세요"
                      className="w-full px-3 py-2 rounded-lg glass-light text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-sm transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRoom(room.gameId, joinPlayerName.trim())}
                        disabled={!joinPlayerName.trim()}
                        className={`flex-1 font-bold py-2 px-4 rounded-lg text-sm transition-all active:scale-95 ${
                          !joinPlayerName.trim()
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                        }`}
                      >
                        참여하기
                      </button>
                      <button
                        onClick={() => { setJoiningRoomId(null); setJoinPlayerName(""); }}
                        className="px-4 py-2 glass-light hover:bg-slate-800/50 text-slate-300 font-medium rounded-lg text-sm transition-all border border-slate-700/50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (room.isStarted) {
                        router.push(`/game?gameId=${room.gameId}`);
                      } else {
                        setJoiningRoomId(room.gameId);
                      }
                    }}
                    disabled={room.isFull && !room.isStarted}
                    className={`w-full font-bold py-2 px-4 rounded-lg text-sm transition-all active:scale-95 ${
                      room.isFull && !room.isStarted
                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    }`}
                  >
                    {room.isStarted ? "게임 참여" : room.isFull ? "대기 중..." : "참여하기"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRooms && activeRooms.length === 0 && (
        <div className="w-full max-w-md mt-6 glass rounded-2xl p-5 border border-slate-700/50 text-center">
          <p className="text-slate-400 text-sm">현재 활성 게임이 없습니다. 새 게임을 생성해주세요.</p>
        </div>
      )}

      <MusicPlayer />
    </main>
  );
}
