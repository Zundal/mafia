"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [showShareLink, setShowShareLink] = useState(false);

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const handleStart = async () => {
    const validNames = playerNames.filter((name) => name.trim() !== "");
    if (validNames.length !== 6) {
      alert("정확히 6명의 플레이어 이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const gameId = `game-${Date.now()}`;
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          gameId,
          playerNames: validNames,
        }),
      });

      const data = await response.json();

      if (response.ok && data.gameId) {
        setCreatedGameId(gameId);
        setShowShareLink(true);
        setIsLoading(false);
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
                🎮 게임 시작
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-light rounded-xl p-4 mb-6 border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-cyan-400 font-semibold text-sm mb-2 text-center">
              📱 게임 참여 방법
            </p>
            <ol className="text-slate-300 text-xs space-y-1.5 list-decimal list-inside">
              <li>6명의 플레이어 이름을 입력하세요</li>
              <li>"게임 시작" 버튼을 누르세요</li>
              <li>생성된 링크를 다른 플레이어들에게 공유하세요</li>
              <li>각 플레이어는 자신의 이름을 선택하세요</li>
              <li>모든 플레이어가 준비되면 게임이 시작됩니다</li>
            </ol>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {playerNames.map((name, index) => (
            <input
              key={index}
              type="text"
              placeholder={`플레이어 ${index + 1} 이름`}
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl glass-light text-slate-100 placeholder-slate-400 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-lg transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={isLoading}
          className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg active:scale-95 ${
            isLoading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30"
          }`}
        >
          {isLoading ? "게임 생성 중..." : "게임 시작"}
        </button>

        <div className="flex gap-3 mt-3">
          <button
            onClick={() => router.push("/join")}
            className="flex-1 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
          >
            🎮 게임 참여
          </button>
          <button
            onClick={() => router.push("/story")}
            className="flex-1 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
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
    </main>
  );
}
