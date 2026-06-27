"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Compass, Mask, Moon, Sun, Users, ArrowLeft, ArrowRight } from "@/app/components/icons";
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

// 포커스 가시성 (촛불 링)
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[color:var(--candle)]";

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
      <main
        className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        {/* 따뜻한 앰비언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 90% 50% at 50% 28%, rgba(140,28,36,0.15) 0%, transparent 68%)" }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(201,154,82,0.3), transparent)" }}
          />
        </div>

        <div className="relative w-full max-w-sm animate-fade-in-up">
          <div className="glass-card rounded-3xl p-7">
            {/* 헤더 */}
            <div className="text-center mb-6">
              <span
                className="inline-flex items-center justify-center rounded-2xl mb-4"
                style={{ width: 56, height: 56, background: "rgba(232,184,100,0.1)", border: "1px solid var(--line-strong)" }}
              >
                <Compass size={26} style={{ color: "var(--candle)" }} />
              </span>
              <p className="eyebrow">탐험 모드 · 맵 둘러보기</p>
              <h1 className="font-display mt-2 text-2xl" style={{ color: "var(--ink)" }}>
                혼자 해보기
              </h1>
              <p className="text-sm mt-2" style={{ color: "var(--ink-muted)" }}>
                아파트를 탐험하고 사건의 흔적을 찾아보세요
              </p>
            </div>

            {/* 이름 입력 */}
            <div className="space-y-3 mb-5">
              <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                <p className="eyebrow flex items-center gap-1.5 mb-2.5" style={{ color: "var(--ink-muted)" }}>
                  <Mask size={14} style={{ color: "var(--candle-soft)" }} /> 당신의 이름
                </p>
                <Input
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
                  placeholder="이름 입력 (비워두면 &quot;나&quot;)"
                  className="h-10 text-sm"
                  maxLength={8}
                  autoFocus
                />
              </div>

              {/* 조작 방법 */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(232,184,100,0.06)", border: "1px solid var(--line-strong)" }}>
                <p className="eyebrow mb-2.5" style={{ color: "var(--candle)" }}>조작 방법</p>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {["W", "A", "S", "D"].map((k) => (
                    <span
                      key={k}
                      className="num text-xs px-2 py-1 rounded-md leading-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--ink)" }}
                    >
                      {k}
                    </span>
                  ))}
                  <span className="text-xs self-center" style={{ color: "var(--ink-faint)" }}>또는</span>
                  {["↑", "↓", "←", "→"].map((k) => (
                    <span
                      key={k}
                      className="num text-xs px-2 py-1 rounded-md leading-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--ink)" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  모바일은 화면 좌하단 조이스틱을 사용하세요
                </p>
              </div>
            </div>

            <button
              onClick={enter}
              className={`btn-wine w-full rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 mb-2.5 ${FOCUS_RING}`}
              style={{ color: "#F4E4D0" }}
            >
              입장하기 <ArrowRight size={18} style={{ color: "rgba(244,228,208,0.7)" }} />
            </button>
            <button
              onClick={() => router.push("/")}
              className={`btn-ghost w-full rounded-2xl py-2.5 text-sm flex items-center justify-center gap-1.5 ${FOCUS_RING}`}
            >
              <ArrowLeft size={16} /> 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── 탐험 화면 ─────────────────────────────────────────────────────────────
  const demoMe: PlayerData = { id: "demo-me", name: playerName, colorIndex: 0, isAlive: true };
  const demoPlayers = [demoMe, ...DEMO_NPCS];

  return (
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <GameCanvas
        currentPlayerId="demo-me"
        players={demoPlayers}
        nightMode={nightMode}
        demoMode
        onRoomChange={setCurrentRoom}
      />

      {/* 상단 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-3 pointer-events-none">
        <button
          onClick={() => setStage("entry")}
          className={`btn-ghost pointer-events-auto rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 ${FOCUS_RING}`}
        >
          <ArrowLeft size={14} /> 나가기
        </button>

        {/* 현재 위치 */}
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-1.5">
          <Compass size={14} style={{ color: "var(--candle)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{currentRoom}</span>
        </div>

        <button
          onClick={() => setNightMode((v) => !v)}
          className={`btn-ghost pointer-events-auto rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 ${FOCUS_RING}`}
        >
          {nightMode
            ? <><Moon size={14} style={{ color: "var(--candle)" }} /> 밤</>
            : <><Sun size={14} style={{ color: "var(--candle)" }} /> 낮</>}
        </button>
      </div>

      {/* 데스크탑: 우측 손님 동향 패널 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:block pointer-events-none w-56">
        <div className="glass rounded-2xl p-3.5">
          <p className="eyebrow flex items-center gap-1.5 mb-2.5" style={{ color: "var(--ink-muted)" }}>
            <Users size={13} style={{ color: "var(--candle-soft)" }} /> 손님 동향
          </p>
          {activities.length === 0 ? (
            <p className="text-xs italic" style={{ color: "var(--ink-faint)" }}>조용히 기다리는 중…</p>
          ) : (
            <div className="space-y-2">
              {activities.map((msg, i) => (
                <div
                  key={`${i}-${msg.slice(0, 8)}`}
                  className="text-xs leading-relaxed pl-2.5 transition-opacity"
                  style={{
                    borderLeft: `2px solid ${i === 0 ? "var(--candle)" : "var(--line-strong)"}`,
                    color: i === 0 ? "var(--ink)" : i === 1 ? "var(--ink-muted)" : "var(--ink-faint)",
                    opacity: i === 0 ? 1 : i === 1 ? 0.85 : 0.6,
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단: 방 설명 + 모바일 동향 */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-3 pointer-events-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* 모바일 손님 동향 (최신 1개) */}
        {activities.length > 0 && (
          <div className="sm:hidden mb-2 flex justify-center">
            <div className="glass rounded-xl px-3 py-2 max-w-xs">
              <p className="text-xs text-center leading-snug" style={{ color: "var(--ink-muted)" }}>
                {activities[0]}
              </p>
            </div>
          </div>
        )}

        {/* 현재 방 설명 */}
        <div className="flex justify-center">
          <div className="glass rounded-xl px-4 py-2.5 max-w-sm text-center">
            <p className="text-xs leading-relaxed italic" style={{ color: "var(--ink-muted)" }}>
              {ROOM_DESCRIPTIONS[currentRoom] ?? "특별한 것은 없어 보인다."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
