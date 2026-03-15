"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlayerData } from "@/app/game/GameCanvas";

const GameCanvas = dynamic(() => import("@/app/game/GameCanvas"), { ssr: false });

// ─── 방 설명 ──────────────────────────────────────────────────────────────────
const ROOM_DESCRIPTIONS: Record<string, string> = {
  "침실 1": "침구 위에 와인 자국이 선명하다. 누군가 이 방에 있었다.",
  "욕실": "세면대 물기가 아직 마르지 않았다. 최근에 다녀간 흔적.",
  "침실 2": "창문이 살짝 열려있다. 차가운 밤 공기가 스며든다.",
  "주방": "깨진 와인병 파편들. 바로 이곳이 사건 현장이다.",
  "거실": "하객들이 모여 웃음꽃을 피우던 자리. 지금은 정적만이 흐른다.",
  "서재": "서류들이 어지럽게 뒤엉켜있다. 누군가 서둘러 뒤진 것 같다.",
  "복도": "좁고 긴 복도. 양쪽 방문 너머로 낮은 소음이 새어나온다.",
  "발코니": "밤공기가 차갑다. 저 아래로 도시의 불빛이 아스라이 흐른다.",
};

// ─── NPC 활동 메시지 풀 ──────────────────────────────────────────────────────
const NPC_NAMES = ["민준", "서연", "지호", "하은", "도윤"];
const NPC_ACTIONS = [
  (n: string) => `${n}이(가) 주방 쪽에서 조용히 뭔가를 살피고 있다`,
  (n: string) => `${n}이(가) 발코니에 홀로 나와 하늘을 바라보고 있다`,
  (n: string) => `${n}이(가) 서재 책장 앞에서 오래 서 있다`,
  (n: string) => `${n}이(가) 침실 문 앞을 두 번 왔다 갔다 했다`,
  (n: string) => `${n}이(가) 거실 소파에 털썩 앉더니 한숨을 쉬었다`,
  (n: string) => `${n}이(가) 복도에서 누군가를 기다리는 것 같다`,
  (n: string) => `${n}이(가) 욕실 문 앞에서 잠깐 멈췄다 발걸음을 돌렸다`,
  (n: string) => `${n}이(가) 주방 서랍을 열어보는 것 같았다`,
  (n: string) => `${n}이(가) 깨진 와인병 파편 근처를 유심히 들여다봤다`,
  (n: string) => `${n}이(가) 아무 말 없이 침실 2 쪽으로 걸어갔다`,
  (n: string) => `${n}이(가) 서성이다 멈추더니 주위를 살폈다`,
  (n: string) => `${n}이(가) 핸드폰을 꺼내 뭔가를 확인했다`,
];

function makeActivityPool(): string[] {
  const pool: string[] = [];
  NPC_NAMES.forEach((name) => {
    NPC_ACTIONS.forEach((fn) => pool.push(fn(name)));
  });
  return pool.sort(() => Math.random() - 0.5);
}

// ─── 데모용 플레이어 데이터 ───────────────────────────────────────────────────
const DEMO_NPCS: PlayerData[] = [
  { id: "demo-npc-1", name: "민준", colorIndex: 1, isAlive: true },
  { id: "demo-npc-2", name: "서연", colorIndex: 2, isAlive: true },
  { id: "demo-npc-3", name: "지호", colorIndex: 3, isAlive: true },
  { id: "demo-npc-4", name: "하은", colorIndex: 4, isAlive: true },
  { id: "demo-npc-5", name: "도윤", colorIndex: 5, isAlive: true },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"entry" | "playing">("entry");
  const [inputName, setInputName] = useState("");
  const [playerName, setPlayerName] = useState("나");
  const [nightMode, setNightMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("거실");
  const [activities, setActivities] = useState<string[]>([]);
  const poolRef = useRef<string[]>(makeActivityPool());

  // NPC 활동 로그 (입장 후에만)
  useEffect(() => {
    if (stage !== "playing") return;
    const push = () => {
      if (poolRef.current.length === 0) poolRef.current = makeActivityPool();
      const msg = poolRef.current.shift()!;
      setActivities((prev) => [msg, ...prev.slice(0, 2)]);
    };
    // 첫 메시지는 2초 후
    const first = setTimeout(push, 2000);
    // 이후 4~8초 랜덤 간격
    let iv: ReturnType<typeof setInterval>;
    const schedule = () => {
      iv = setInterval(() => {
        push();
        clearInterval(iv);
        schedule();
      }, 4000 + Math.random() * 4000);
    };
    schedule();
    return () => { clearTimeout(first); clearInterval(iv); };
  }, [stage]);

  const enter = useCallback(() => {
    if (inputName.trim()) setPlayerName(inputName.trim());
    setStage("playing");
  }, [inputName]);

  // ─── 입장 화면 ─────────────────────────────────────────────────────────────
  if (stage === "entry") {
    return (
      <main className="relative min-h-screen bg-gradient-to-br from-stone-950 via-red-950/50 to-stone-950 flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[8%] left-[3%] w-72 h-72 bg-red-900/15 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-[12%] right-[4%] w-64 h-64 bg-amber-900/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-950/8 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative w-full max-w-sm animate-fade-in-up">
          {/* 상단 골드 라인 */}
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          <div className="glass-card rounded-3xl border border-stone-700/40 p-7">
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 blur-2xl bg-red-800/20 rounded-full scale-150" />
                <span className="relative text-5xl">🍷</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent mb-1">
                혼자 해보기
              </h1>
              <p className="text-stone-500 text-sm">
                아파트를 탐험하고 사건의 흔적을 찾아보세요
              </p>
            </div>

            {/* 이름 입력 */}
            <div className="space-y-3 mb-5">
              <div className="rounded-2xl p-4 bg-stone-800/30 border border-stone-700/30">
                <p className="text-stone-400 text-xs font-medium mb-2.5 flex items-center gap-1.5">
                  <span>👤</span> 당신의 이름
                </p>
                <Input
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
                  placeholder="이름 입력 (비워두면 &quot;나&quot;)"
                  className="h-10 text-sm bg-stone-900/50"
                  maxLength={8}
                  autoFocus
                />
              </div>

              <div className="rounded-2xl p-3.5 bg-amber-900/10 border border-amber-700/20">
                <p className="text-amber-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <span>🎮</span> 조작 방법
                </p>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {["W", "A", "S", "D"].map((k) => (
                    <span key={k} className="bg-stone-800/70 border border-stone-600/50 text-stone-300 text-[11px] font-mono px-2 py-0.5 rounded-md leading-5">
                      {k}
                    </span>
                  ))}
                  <span className="text-stone-500 text-xs self-center">또는</span>
                  {["↑", "↓", "←", "→"].map((k) => (
                    <span key={k} className="bg-stone-800/70 border border-stone-600/50 text-stone-300 text-[11px] font-mono px-2 py-0.5 rounded-md leading-5">
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-stone-600 text-[11px]">모바일은 화면 좌하단 조이스틱 사용</p>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full glow-gold mb-2.5"
              onClick={enter}
            >
              🚪 입장하기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-stone-600 hover:text-stone-400"
              onClick={() => router.push("/")}
            >
              ← 돌아가기
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ─── 탐험 화면 ─────────────────────────────────────────────────────────────
  const demoMe: PlayerData = { id: "demo-me", name: playerName, colorIndex: 0, isAlive: true };
  const demoPlayers = [demoMe, ...DEMO_NPCS];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950">
      <GameCanvas
        currentPlayerId="demo-me"
        players={demoPlayers}
        nightMode={nightMode}
        demoMode
        onRoomChange={setCurrentRoom}
      />

      {/* 상단 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-3 pointer-events-none">
        <Button
          variant="glass"
          size="sm"
          className="pointer-events-auto text-xs"
          onClick={() => setStage("entry")}
        >
          ← 나가기
        </Button>

        {/* 현재 위치 */}
        <div className="glass border border-amber-700/25 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-amber-500 text-xs">📍</span>
          <span className="text-stone-200 text-xs font-semibold">{currentRoom}</span>
        </div>

        <Button
          variant="glass"
          size="sm"
          className="pointer-events-auto text-xs"
          onClick={() => setNightMode((v) => !v)}
        >
          {nightMode ? "🌙 밤" : "☀️ 낮"}
        </Button>
      </div>

      {/* 데스크탑: 우측 손님 동향 패널 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:block pointer-events-none w-56">
        <div className="glass border border-stone-700/25 rounded-2xl p-3.5">
          <p className="text-stone-600 text-[10px] font-semibold uppercase tracking-widest mb-2.5">
            손님 동향
          </p>
          {activities.length === 0 ? (
            <p className="text-stone-700 text-xs italic">조용히 기다리는 중...</p>
          ) : (
            <div className="space-y-2">
              {activities.map((msg, i) => (
                <div
                  key={`${i}-${msg.slice(0, 8)}`}
                  className={cn(
                    "text-xs leading-relaxed border-l-2 pl-2.5 transition-opacity",
                    i === 0
                      ? "text-stone-300 border-amber-500/60"
                      : i === 1
                      ? "text-stone-500 border-stone-600/40 opacity-70"
                      : "text-stone-600 border-stone-700/30 opacity-40"
                  )}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단: 방 설명 + 모바일 동향 */}
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-3 pointer-events-none">
        {/* 모바일 손님 동향 (최신 1개) */}
        {activities.length > 0 && (
          <div className="sm:hidden mb-2 flex justify-center">
            <div className="glass border border-stone-700/25 rounded-xl px-3 py-1.5 max-w-xs">
              <p className="text-stone-400 text-[11px] text-center leading-snug">
                {activities[0]}
              </p>
            </div>
          </div>
        )}

        {/* 현재 방 설명 */}
        <div className="flex justify-center">
          <div className="glass border border-stone-700/20 rounded-xl px-4 py-2 max-w-sm text-center">
            <p className="text-stone-500 text-[11px] leading-relaxed italic">
              {ROOM_DESCRIPTIONS[currentRoom] ?? "특별한 것은 없어 보인다."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
