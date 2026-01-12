"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", "", "", ""]);

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

      if (response.ok) {
        const data = await response.json();
        // 게임이 성공적으로 생성되었는지 확인
        if (data.gameId) {
          // 약간의 딜레이 후 이동 (서버 상태 동기화를 위해)
          setTimeout(() => {
            router.push(`/game?gameId=${gameId}`);
          }, 300);
        } else {
          alert("게임 생성에 실패했습니다.");
        }
      } else {
        const error = await response.json();
        alert(error.error || "게임 생성에 실패했습니다.");
      }
    } catch (error) {
      alert("게임 생성 중 오류가 발생했습니다.");
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

        <div className="glass-light rounded-xl p-4 mb-6 border border-cyan-500/30 bg-cyan-500/10">
          <p className="text-cyan-400 font-semibold text-sm mb-2 text-center">
            📱 게임 참여 방법
          </p>
          <ol className="text-slate-300 text-xs space-y-1.5 list-decimal list-inside">
            <li>6명의 플레이어 이름을 입력하세요</li>
            <li>"게임 시작" 버튼을 누르세요</li>
            <li>각 플레이어는 자신의 이름을 선택하세요</li>
            <li>모든 플레이어가 준비되면 게임이 시작됩니다</li>
          </ol>
        </div>

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
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/25 active:scale-95 hover:shadow-xl hover:shadow-cyan-500/30"
        >
          게임 시작
        </button>

        <div className="flex gap-3 mt-3">
          <button
            onClick={() => router.push("/story")}
            className="flex-1 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
          >
            📖 스토리 보기
          </button>
          <button
            onClick={handleReset}
            className="flex-1 glass-light hover:bg-slate-800/50 text-slate-100 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700/50"
          >
            🔄 게임 초기화
          </button>
        </div>

        <p className="text-slate-400 text-xs text-center mt-6">
          정확히 6명의 플레이어가 필요합니다
        </p>
      </div>
    </main>
  );
}
