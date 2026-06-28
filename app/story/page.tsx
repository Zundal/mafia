"use client";

import type { SVGProps } from "react";
import { useRouter } from "next/navigation";
import { roles } from "@/lib/roles";
import {
  WineGlass,
  Moon,
  Sun,
  Gavel,
  Search,
  Shield,
  Users,
  Mask,
  Sparkle,
  Scroll,
  Note,
  Book,
  Bottle,
  Compass,
  Check,
  Play,
  ArrowLeft,
  roleGlyph,
} from "@/app/components/icons";

type IconType = (p: SVGProps<SVGSVGElement> & { size?: number }) => JSX.Element;

/* ── 토큰 단축 ──────────────────────────────────────────────────── */
const C = {
  ink: "var(--ink)",
  inkMuted: "var(--ink-muted)",
  inkFaint: "var(--ink-faint)",
  candle: "var(--candle)",
  candleSoft: "var(--candle-soft)",
  wine: "var(--wine)",
  line: "var(--line)",
  citizen: "#86B07C",
  mafia: "#C2495A",
  drunkard: "#E8B864",
} as const;

const teamColor: Record<string, string> = {
  citizens: C.citizen,
  mafia: C.mafia,
  solo: C.drunkard,
};
const teamLabel: Record<string, string> = {
  citizens: "시민 팀",
  mafia: "마피아 팀",
  solo: "개인전",
};

/* ── 섹션 머리글 ────────────────────────────────────────────────── */
function Heading({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: IconType;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 className="font-display flex items-center gap-2.5 text-lg" style={{ color: C.ink }}>
        <Icon size={19} style={{ color: C.candle }} />
        {title}
      </h2>
    </div>
  );
}

export default function StoryPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen px-4 pb-16" style={{ background: "var(--bg)" }}>
      {/* 앰비언트 글로우 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 50% at 50% 12%, rgba(140,28,36,0.15) 0%, transparent 66%)" }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,154,82,0.3), transparent)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* ── 헤더 ─────────────────────────────────────────────── */}
        <header className="text-center pt-12 mb-10 animate-fade-in-up">
          <span
            className="inline-flex items-center justify-center rounded-2xl mb-5"
            style={{
              width: 64,
              height: 64,
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(232,184,100,0.22)",
              boxShadow: "0 0 26px rgba(232,184,100,0.18)",
            }}
          >
            <WineGlass size={30} style={{ color: C.candle }} />
          </span>
          <p className="eyebrow mb-3">집들이 미스터리 · 6인 추리극</p>
          <h1
            className="font-display leading-tight text-glow-candle"
            style={{ fontSize: "clamp(1.7rem, 7vw, 2.3rem)", color: C.ink }}
          >
            깨진 와인병의 비밀
          </h1>
          <div className="divider-ornament mt-5 mx-auto max-w-[180px]">
            <span className="w-1 h-1 rounded-full" style={{ background: C.candleSoft }} />
          </div>
        </header>

        {/* ── 스토리 개요 ───────────────────────────────────────── */}
        <section className="paper-card rounded-2xl p-6 mb-5">
          <Heading icon={Book} eyebrow="Prologue" title="스토리 개요" />
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: C.inkMuted }}>
            <p>
              즐거운 집들이 파티 도중, 부엌에서{" "}
              <span style={{ color: C.wine, fontWeight: 700 }}>&ldquo;쨍그랑!&rdquo;</span>
              {" "}하는 소리가 들렸습니다.
            </p>
            <p>
              가보니 집주인이 아끼던{" "}
              <span style={{ color: C.candle, fontWeight: 600 }}>빈티지 와인 (혹은 30년산 인삼주)</span>
              이 박살 나 있습니다.
            </p>
            <p style={{ color: C.ink, fontWeight: 600 }}>범인은 이 자리에 있는 6명 중 한 명.</p>
            <p>
              하지만 알코올 냄새가 진동하는 현장에서, 술에 취해 횡설수설하는 사람까지 섞여 있어 범인 찾기가 쉽지 않습니다.
            </p>
          </div>
        </section>

        {/* ── 역할 소개 (강조) ──────────────────────────────────── */}
        <section
          className="rounded-2xl p-6 mb-5"
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(232,184,100,0.3)",
            boxShadow: "0 0 30px rgba(232,184,100,0.07), 0 12px 48px rgba(0,0,0,0.6)",
          }}
        >
          <Heading icon={Mask} eyebrow="The Cast · 총 6인" title="역할 소개" />
          <p className="text-sm mb-5" style={{ color: C.inkMuted }}>
            <span style={{ color: C.citizen, fontWeight: 600 }}>시민 팀</span> vs{" "}
            <span style={{ color: C.mafia, fontWeight: 600 }}>마피아 팀</span> vs{" "}
            <span style={{ color: C.drunkard, fontWeight: 600 }}>만취객(개인전)</span>의 3파전
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(roles).map((role) => {
              const tc = teamColor[role.team];
              const Glyph = (roleGlyph[role.id] ?? Users) as IconType;
              return (
                <div
                  key={role.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg-deep)",
                    border: "1px solid var(--line)",
                    borderLeft: `3px solid ${tc}`,
                  }}
                >
                  <div className="flex items-start gap-3 mb-2.5">
                    <span
                      className="inline-flex items-center justify-center rounded-lg shrink-0"
                      style={{ width: 36, height: 36, background: "rgba(0,0,0,0.3)", border: "1px solid var(--line)" }}
                    >
                      <Glyph size={19} style={{ color: tc }} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm" style={{ color: C.ink }}>{role.name}</span>
                        <span
                          className="eyebrow px-2 py-0.5 rounded-full"
                          style={{ fontSize: "0.5625rem", color: tc, border: `1px solid ${tc}40` }}
                        >
                          {teamLabel[role.team]}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: C.inkFaint }}>{role.winCondition}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed pl-3" style={{ color: C.inkMuted, borderLeft: `1px solid ${tc}33` }}>
                    {role.action}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 핵심 재미 요소 ───────────────────────────────────── */}
        <section className="paper-card rounded-2xl p-6 mb-5">
          <Heading icon={Sparkle} eyebrow="Why It's Fun" title="핵심 재미 요소" />
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderLeft: `3px solid ${C.drunkard}` }}
            >
              <h3 className="font-display text-sm mb-2.5 flex items-center gap-2" style={{ color: C.drunkard }}>
                <Bottle size={17} style={{ color: C.drunkard }} /> 만취객(Drunkard)의 존재
              </h3>
              <p className="text-xs leading-relaxed mb-2" style={{ color: C.inkMuted }}>
                보통 마피아 게임은 &ldquo;나 시민이야!&rdquo;라고 주장하지만, 이 게임엔{" "}
                <span style={{ color: C.candle, fontWeight: 700 }}>&ldquo;나 범인이야(제발 죽여줘)&rdquo;</span>라고
                은근히 어필하는 만취객이 있습니다.
              </p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: C.inkMuted }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>시민들의 딜레마:</span>{" "}
                저 사람이 진짜 범인일까? 아니면 그냥 집에 가고 싶은 만취객일까?
              </p>
              <p className="text-xs font-semibold" style={{ color: C.candle }}>
                만취객을 투표로 죽이면: 만취객이 즉시 승리하고 모두 패배합니다.
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderLeft: `3px solid ${C.candleSoft}` }}
            >
              <h3 className="font-display text-sm mb-2.5 flex items-center gap-2" style={{ color: C.candleSoft }}>
                <Mask size={17} style={{ color: C.candleSoft }} /> 히든 미션 (혼란 유발)
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: C.inkMuted }}>
                게임 시작 시, 각 플레이어는{" "}
                <span style={{ color: C.candle, fontWeight: 700 }}>&lsquo;쓸데없는 딴짓 미션&rsquo;</span>을 받습니다.
                이를 수행하다 보면 자연스럽게 의심을 사게 됩니다.
              </p>
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--line)" }}>
                {[
                  "갑자기 물티슈 뽑아서 옆 사람 주기",
                  "대화 도중 혼자 박수 치며 웃기",
                  "심각한 표정으로 허공 3초간 응시하기",
                  "\"근데 여기 냄새나지 않아?\" 라고 말하기",
                ].map((m) => (
                  <p key={m} className="text-xs flex items-start gap-2" style={{ color: C.inkMuted }}>
                    <span style={{ color: C.candleSoft }} className="mt-px">·</span>
                    {m}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 게임 진행 순서 ───────────────────────────────────── */}
        <section className="paper-card rounded-2xl p-6 mb-5">
          <Heading icon={Moon} eyebrow="How To Play" title="게임 진행 순서" />
          <div className="space-y-4">
            {/* 밤 */}
            <div className="rounded-xl p-4" style={{ background: "var(--bg-deep)", border: "1px solid var(--line-strong)" }}>
              <h3 className="font-display text-sm mb-1 flex items-center gap-2" style={{ color: C.candle }}>
                <Moon size={17} style={{ color: C.candle }} /> 밤 (Night Phase)
              </h3>
              <p className="text-xs mb-3" style={{ color: C.inkFaint }}>사회자(앱)의 안내에 따라 폰을 돌려가며 진행</p>
              <div className="space-y-2.5">
                {[
                  { Icon: WineGlass, c: C.mafia, label: "범인(마피아) 턴", desc: "제거할 대상을 선택합니다." },
                  { Icon: Search, c: C.citizen, label: "목격자(경찰) 턴", desc: "의심 가는 사람 1명을 조사합니다." },
                  { Icon: Shield, c: C.citizen, label: "수습반장(의사) 턴", desc: "보호할 사람 1명을 선택합니다." },
                  { Icon: Moon, c: C.inkFaint, label: "만취객 & 시민", desc: "푹 잡니다. (아무 행동 안 함)" },
                ].map(({ Icon, c, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <Icon size={15} style={{ color: c }} className="mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>
                      <span style={{ color: c, fontWeight: 600 }}>{label}:</span> {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 낮 */}
            <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)" }}>
              <h3 className="font-display text-sm mb-3 flex items-center gap-2" style={{ color: C.candle }}>
                <Sun size={17} style={{ color: C.candle }} /> 낮 (Day Phase)
              </h3>
              <div className="space-y-3 text-xs" style={{ color: C.inkMuted }}>
                <div>
                  <p className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.ink }}>
                    <Scroll size={14} style={{ color: C.candleSoft }} /> 아침 뉴스
                  </p>
                  <p className="mb-1">밤사이 누군가 당했는지 결과 발표</p>
                  <div className="pl-3 space-y-1" style={{ color: C.inkFaint }}>
                    <p>· 의사가 막았으면 &ldquo;아무 일도 없었습니다.&rdquo;</p>
                    <p>· 못 막았으면 &ldquo;OOO님이 탈락했습니다.&rdquo;</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: C.ink }}>
                    <Gavel size={14} style={{ color: C.candleSoft }} /> 토론 + 투표
                  </p>
                  <div className="pl-3 space-y-1" style={{ color: C.inkFaint }}>
                    <p>· 다수결로 한 명을 지목</p>
                    <p style={{ color: C.drunkard }}>· 만취객 지목 → 만취객 즉시 승리</p>
                    <p>· 범인 지목 → 시민 승리</p>
                    <p>· 시민 지목 → 밤으로 돌아감</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 전술 가이드 ───────────────────────────────────────── */}
        <section className="paper-card rounded-2xl p-6 mb-5">
          <Heading icon={Compass} eyebrow="Strategy" title="역할별 전술 가이드" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { Icon: WineGlass, title: "범인(마피아)", c: C.mafia, tips: ["히든 미션으로 눈에 띄지 않도록 하기", "경찰을 먼저 찾아서 제거 우선순위에 올리기", "만취객처럼 행동해서 의심 분산시키기", "\"나도 저 사람 이상한 것 같아요\" 동조 전술"] },
              { Icon: Search, title: "목격자(경찰)", c: C.citizen, tips: ["조사 결과 즉시 공개하면 표적이 됨", "범인을 넌지시 언급하는 방식 활용", "의사와 비밀 신호 맞추기", "만취객과 진짜 범인 구분이 핵심"] },
              { Icon: Shield, title: "수습반장(의사)", c: C.citizen, tips: ["경찰 역할자를 보호하는 것이 최우선", "연속으로 같은 사람 보호 시 패턴 노출", "자기 보호도 전략 — 생존이 팀에 도움", "낮에 너무 조용하면 의심받으니 참여 필수"] },
              { Icon: Bottle, title: "만취객", c: C.drunkard, tips: ["노골적으로 의심받으려 하면 오히려 무시당함", "히든 미션을 과하게 수행해 자연스럽게 노출", "\"나 좀 이상하지 않아요?\" 은근 어필", "범인인 척 흘리다가 부인하는 심리전"] },
            ].map(({ Icon, title, c, tips }) => (
              <div
                key={title}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderLeft: `3px solid ${c}` }}
              >
                <h3 className="font-display text-sm mb-3 flex items-center gap-2" style={{ color: c }}>
                  <Icon size={17} style={{ color: c }} /> {title}
                </h3>
                <ul className="space-y-1.5">
                  {tips.map((tip) => (
                    <li key={tip} className="text-xs leading-relaxed flex items-start gap-1.5" style={{ color: C.inkMuted }}>
                      <span style={{ color: `${c}99` }} className="mt-px">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 승리 조건 ─────────────────────────────────────────── */}
        <section className="paper-card rounded-2xl p-6 mb-5">
          <Heading icon={Check} eyebrow="Win Conditions" title="승리 조건 한눈에 보기" />
          <div className="space-y-2.5">
            {[
              { Icon: Users, label: "시민 팀 승리", c: C.citizen, desc: "낮 투표에서 범인(마피아)을 쫓아내면 즉시 승리" },
              { Icon: WineGlass, label: "마피아 팀 승리", c: C.mafia, desc: "살아있는 시민 수 ≤ 마피아 수가 되는 순간 승리" },
              { Icon: Bottle, label: "만취객 단독 승리", c: C.drunkard, desc: "낮 투표에서 만취객이 지목되어 쫓겨나면 즉시 승리", warn: "이 경우 시민/마피아팀 모두 패배!" },
            ].map(({ Icon, label, c, desc, warn }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderLeft: `3px solid ${c}` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={16} style={{ color: c }} />
                  <span className="font-display text-sm" style={{ color: c }}>{label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>{desc}</p>
                {warn && <p className="text-xs font-semibold mt-1.5" style={{ color: C.drunkard }}>{warn}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ── 꿀팁 (조용한 보조 카드) ──────────────────────────── */}
        <section
          className="rounded-2xl p-6 mb-8"
          style={{ background: "rgba(27,21,16,0.45)", border: "1px solid var(--line)" }}
        >
          <Heading icon={Sparkle} eyebrow="Host Tips" title="집들이 꿀팁" />
          <div className="space-y-4">
            {[
              { Icon: Note, c: C.candle, label: "BGM 활용", tip: "유튜브에서 '마피아 게임 브금'이나 'The Genius BGM'을 틀어두면 긴장감이 배가됩니다." },
              { Icon: Gavel, c: C.candle, label: "벌칙 내기", tip: "패배한 팀이 '집들이 뒷정리' 또는 '설거지'를 하기로 내기를 거세요. 눈에 불을 켜고 합니다." },
              { Icon: WineGlass, c: C.candle, label: "음주 권장", tip: "약간의 알코올이 들어가면 만취객 연기가 더 자연스러워져서 난이도가 올라갑니다." },
            ].map(({ Icon, c, label, tip }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={18} style={{ color: c }} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: C.ink }}>{label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 버튼 ─────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="btn-wine flex-1 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
            style={{ color: "#F4E4D0" }}
          >
            <Play size={18} style={{ color: "#F4E4D0" }} /> 게임 시작하기
          </button>
          <button
            onClick={() => router.back()}
            className="btn-ghost px-5 py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> 뒤로
          </button>
        </div>
      </div>
    </main>
  );
}
