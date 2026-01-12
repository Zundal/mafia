"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);
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
        body: JSON.stringify({
          action: "create",
          gameId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.gameId) {
        setIsLoading(false);
        // 호스트도 바로 게임 참여 화면으로 이동
        router.push(`/game?gameId=${gameId}&host=true`);
      } else {
        setIsLoading(false);
        alert(data.error || "게임 생성에 실패했습니다.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("게임 생성 에러:", error);
      alert("게임 생성 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000); // 3초마다 방 목록 갱신
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/game?list=true");
      const data = await response.json();
      if (data.games) {
        setActiveRooms(data.games);
      }
      setLoadingRooms(false);
    } catch (error) {
      console.error("방 목록 가져오기 실패:", error);
      setLoadingRooms(false);
    }
  };

  const handleJoinRoom = async (gameId: string, playerName: string) => {
    if (!playerName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.joinedPlayerId) {
        // 로컬 스토리지에 플레이어 ID 저장
        localStorage.setItem(`player-${gameId}`, data.joinedPlayerId);
        setJoiningRoomId(null);
        setJoinPlayerName("");
        router.push(`/game?gameId=${gameId}`);
      } else {
        alert(data.error || "게임 참여에 실패했습니다.");
      }
    } catch (error) {
      console.error("게임 참여 에러:", error);
      alert("게임 참여 중 오류가 발생했습니다.");
    }
  };

  const handleReset = async () => {
    if (!confirm("진행 중인 게임을 초기화하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (response.ok) {
        alert("게임이 초기화되었습니다.");
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.error || "게임 초기화에 실패했습니다.");
      }
    } catch (error) {
      alert("게임 초기화 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl border border-slate-700/50">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-center mb-3">
          🍷 집들이 미스터리
        </h1>
        <p className="text-slate-300 text-center mb-8 text-sm font-medium">
          깨진 와인병의 비밀
        </p>

        {showShareLink && createdGameId ? (
          <div className="glass rounded-xl p-6 mb-6 border border-green-500/30 bg-green-500/10">
            <p className="text-green-400 font-bold text-center mb-4 text-lg">
              ✨ 게임이 생성되었습니다!
            </p>
            <p className="text-slate-300 text-sm mb-3 text-center">
              아래 링크를 다른 플레이어들에게 공유하세요
            </p>
            <div className="bg-slate-900/50 rounded-lg p-3 mb-3 border border-slate-700/50">
              <p className="text-cyan-400 text-xs font-semibold mb-1">게임 ID:</p>
              <p className="text-slate-100 text-sm font-mono break-all">{createdGameId}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700/50">
              <p className="text-cyan-400 text-xs font-semibold mb-1">게임 링크:</p>
              <p className="text-slate-100 text-xs font-mono break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${createdGameId}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const link = typeof window !== "undefined" ? `${window.location.origin}/game?gameId=${createdGameId}` : "";
                  try {
                    await navigator.clipboard.writeText(link);
                    alert("링크가 복사되었습니다!");
                  } catch (error) {
                    alert("링크 복사에 실패했습니다. 링크를 직접 복사해주세요.");
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
              >
                📋 링크 복사
              </button>
              <button
                onClick={() => {
                  setShowShareLink(false);
                  router.push(`/game?gameId=${createdGameId}`);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
              >
                🎮 게임 참여
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-light rounded-xl p-4 mb-6 border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-cyan-400 font-semibold text-sm mb-2 text-center">
              📱 게임 생성 방법
            </p>
            <ol className="text-slate-300 text-xs space-y-1.5 list-decimal list-inside">
              <li>"게임 생성" 버튼을 누르세요</li>
              <li>생성된 링크를 다른 5명의 플레이어에게 공유하세요</li>
              <li>각 플레이어는 링크로 접속하여 자신의 이름을 입력하세요</li>
              <li>6명이 모두 참여하면 게임이 시작됩니다</li>
            </ol>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={isLoading}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg active:scale-95 ${
            isLoading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
          }`}
        >
          {isLoading ? "게임 생성 중..." : "게임 생성"}
        </button>

        <div className="flex gap-3 mt-3">
          <button
            onClick={() => router.push("/story")}
            className="w-full glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
          >
            📖 스토리 보기
          </button>
        </div>
        
        <button
          onClick={handleReset}
          className="w-full mt-3 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
        >
          🔄 게임 초기화
        </button>

        <p className="text-slate-400 text-xs text-center mt-6">
          정확히 6명의 플레이어가 필요합니다
        </p>
      </div>

      {/* 활성 방 목록 */}
      {activeRooms.length > 0 && (
        <div className="w-full max-w-md mt-6 glass rounded-3xl p-6 shadow-2xl border border-slate-700/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center mb-4">
            🎮 활성 게임
          </h2>
          <div className="space-y-3">
            {activeRooms.map((room) => (
              <div
                key={room.gameId}
                className="glass rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-slate-200 font-semibold mb-1">방 ID: {room.gameId}</p>
                    <p className="text-slate-400 text-xs">
                      참여: {room.joinedCount}/{room.maxPlayers}명
                    </p>
                  </div>
                  <div className="text-right">
                    {room.isStarted ? (
                      <span className="text-green-400 text-xs font-semibold bg-green-500/20 px-2 py-1 rounded-full">
                        진행 중
                      </span>
                    ) : room.isFull ? (
                      <span className="text-amber-400 text-xs font-semibold bg-amber-500/20 px-2 py-1 rounded-full">
                        대기 중
                      </span>
                    ) : (
                      <span className="text-cyan-400 text-xs font-semibold bg-cyan-500/20 px-2 py-1 rounded-full">
                        참여 가능
                      </span>
                    )}
                  </div>
                </div>
                {room.players.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-400 text-xs mb-1">참여자:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.players.map((name, idx) => (
                        <span
                          key={idx}
                          className="text-slate-300 text-xs bg-slate-800/50 px-2 py-1 rounded"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {joiningRoomId === room.gameId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={joinPlayerName}
                      onChange={(e) => setJoinPlayerName(e.target.value)}
                      onKeyPress={async (e) => {
                        if (e.key === "Enter" && joinPlayerName.trim()) {
                          await handleJoinRoom(room.gameId, joinPlayerName.trim());
                        }
                      }}
                      placeholder="당신의 이름을 입력하세요"
                      className="w-full px-3 py-2 rounded-lg glass-light text-slate-100 placeholder-slate-400 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-sm transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRoom(room.gameId, joinPlayerName.trim())}
                        disabled={!joinPlayerName.trim()}
                        className={`flex-1 font-bold py-2 px-4 rounded-lg text-sm transition-all ${
                          !joinPlayerName.trim()
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                        }`}
                      >
                        참여하기
                      </button>
                      <button
                        onClick={() => {
                          setJoiningRoomId(null);
                          setJoinPlayerName("");
                        }}
                        className="px-4 py-2 glass-light hover:bg-slate-800/50 text-slate-100 font-medium rounded-lg text-sm transition-all border border-slate-700/50"
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
                    className={`w-full font-bold py-2 px-4 rounded-lg text-sm transition-all ${
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
        <div className="w-full max-w-md mt-6 glass rounded-3xl p-6 border border-slate-700/50">
          <p className="text-slate-400 text-sm text-center">
            현재 활성 게임이 없습니다. 새 게임을 생성해주세요.
          </p>
        </div>
      )}
    </main>
  );
}
