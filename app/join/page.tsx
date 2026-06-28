"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Users, Mask } from "@/app/components/icons";

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

  const steps = [
    "게임 호스트에게 게임 ID를 받으세요",
    "아래에 게임 ID를 입력하세요",
    "\"게임 참여\" 버튼을 누르세요",
    "자신의 이름을 선택하세요",
  ];

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* 따뜻한 앰비언트 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 50% at 50% 28%, rgba(140,28,36,0.14) 0%, transparent 66%)" }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,154,82,0.3), transparent)" }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* ── 헤더 ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <span
            className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{ width: 52, height: 52, background: "rgba(232,184,100,0.08)", border: "1px solid var(--line-strong)" }}
          >
            <Mask size={26} style={{ color: "var(--candle)" }} />
          </span>
          <p className="eyebrow">집들이 미스터리 · 입장</p>
          <h1
            className="font-display mt-3 leading-[1.1] text-glow-candle"
            style={{ fontSize: "clamp(1.9rem, 8vw, 2.4rem)", color: "var(--ink)" }}
          >
            게임 참여
          </h1>
          <div className="divider-ornament mt-5 mb-1 mx-auto max-w-[160px]">
            <span className="w-1 h-1 rounded-full" style={{ background: "var(--candle-soft)" }} />
          </div>
          <p className="text-sm mt-3" style={{ color: "var(--ink-muted)" }}>
            게임 ID를 입력하여 참여하세요
          </p>
        </div>

        {/* ── 참여 방법 ────────────────────────────────────────────── */}
        <div className="paper-card rounded-2xl mt-7 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} style={{ color: "var(--candle)" }} />
            <span className="eyebrow" style={{ color: "var(--ink-muted)" }}>게임 참여 방법</span>
          </div>
          <ol className="space-y-2.5">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span
                  className="num flex items-center justify-center rounded-md shrink-0 text-xs"
                  style={{ width: 22, height: 22, background: "rgba(232,184,100,0.1)", color: "var(--candle)" }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm leading-snug pt-0.5" style={{ color: "var(--ink-muted)" }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── 입력 ─────────────────────────────────────────────────── */}
        <div className="mt-6">
          <label htmlFor="game-id" className="eyebrow block mb-2.5">
            게임 ID
          </label>
          <Input
            id="game-id"
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            placeholder="예: game-1234567890"
            className="num h-12 text-base"
            autoFocus
          />
        </div>

        {/* ── 액션 ─────────────────────────────────────────────────── */}
        <button
          onClick={handleJoin}
          className="btn-wine w-full rounded-2xl mt-5 group"
        >
          <span className="px-5 py-4 flex items-center justify-center gap-2.5">
            <span className="font-semibold text-base" style={{ color: "#F4E4D0" }}>
              게임 참여
            </span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" style={{ color: "rgba(244,228,208,0.7)" }} />
          </span>
        </button>

        <button
          onClick={() => router.push("/")}
          className="btn-ghost w-full rounded-2xl mt-2.5 group"
        >
          <span className="px-5 py-3.5 flex items-center justify-center gap-2 text-sm font-medium">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            홈으로
          </span>
        </button>
      </div>
    </main>
  );
}
