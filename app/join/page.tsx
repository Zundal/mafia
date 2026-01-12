"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [gameId, setGameId] = useState("");

  const handleJoin = () => {
    if (!gameId.trim()) {
      alert("게임 ID를 입력해주세요.");
      return;
    }
    router.push(`/game?gameId=${gameId.trim()}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl border border-slate-700/50">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center mb-3">
          🎮 게임 참여
        </h1>
        <p className="text-slate-300 text-center mb-8 text-sm font-medium">
          게임 ID를 입력하여 참여하세요
        </p>

        <div className="glass-light rounded-xl p-4 mb-6 border border-cyan-500/30 bg-cyan-500/10">
          <p className="text-cyan-400 font-semibold text-sm mb-2 text-center">
            📋 게임 참여 방법
          </p>
          <ol className="text-slate-300 text-xs space-y-1.5 list-decimal list-inside">
            <li>게임 호스트에게 게임 ID를 받으세요</li>
            <li>아래에 게임 ID를 입력하세요</li>
            <li>"게임 참여" 버튼을 누르세요</li>
            <li>자신의 이름을 선택하세요</li>
          </ol>
        </div>

        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            게임 ID
          </label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleJoin();
              }
            }}
            placeholder="예: game-1234567890"
            className="w-full px-4 py-3.5 rounded-xl glass-light text-slate-100 placeholder-slate-400 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-lg transition-all"
          />
        </div>

        <button
          onClick={handleJoin}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/25 active:scale-95 hover:shadow-xl hover:shadow-cyan-500/30"
        >
          게임 참여
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full mt-3 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
        >
          ← 홈으로
        </button>
      </div>
    </main>
  );
}
