"use client";

import { useRouter } from "next/navigation";
import { roles } from "@/lib/roles";

export default function StoryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-4 pb-16" style={{ background: '#0c0704' }}>
      {/* 배경 글로우 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 15%, rgba(100,30,10,0.18) 0%, transparent 65%)' }}
      />

      <div className="relative max-w-2xl mx-auto">

        {/* ── 헤더 ─────────────────────────────────────────────── */}
        <div className="text-center pt-8 mb-10">
          <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 24px rgba(180,50,20,0.45))' }}>🍷</div>
          <h1
            className="font-bold mb-2 leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: '#e4ccaa', textShadow: '0 2px 20px rgba(180,110,40,0.3)' }}
          >
            집들이 미스터리
          </h1>
          <p className="text-xs font-medium tracking-[0.3em] uppercase mb-5" style={{ color: 'rgba(160,100,50,0.65)' }}>
            깨진 와인병의 비밀
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, rgba(140,90,45,0.45))' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(160,100,50,0.5)' }} />
            <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, rgba(140,90,45,0.45))' }} />
          </div>
        </div>

        {/* ── 스토리 개요 ───────────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>📖</span> 스토리 개요
          </h2>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(200,170,130,0.8)' }}>
            <p>
              즐거운 집들이 파티 도중, 부엌에서{' '}
              <span style={{ color: '#f08060', fontWeight: 700 }}>"쨍그랑!"</span>
              {' '}하는 소리가 들렸습니다.
            </p>
            <p>
              가보니 집주인이 아끼던{' '}
              <span style={{ color: '#d4a040', fontWeight: 600 }}>빈티지 와인 (혹은 30년산 인삼주)</span>
              이 박살 나 있습니다.
            </p>
            <p style={{ color: '#c8a060', fontWeight: 600 }}>
              범인은 이 자리에 있는 6명 중 한 명.
            </p>
            <p>
              하지만 알코올 냄새가 진동하는 현장에서, 술에 취해 횡설수설하는 사람까지 섞여 있어 범인 찾기가 쉽지 않습니다.
            </p>
          </div>
        </section>

        {/* ── 역할 소개 ─────────────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>🎭</span> 역할 소개 (총 6인)
          </h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(160,110,60,0.65)' }}>
            <span style={{ color: '#80d890' }}>시민 팀</span>{' '}vs{' '}
            <span style={{ color: '#f08080' }}>마피아 팀</span>{' '}vs{' '}
            <span style={{ color: '#d4a040' }}>만취객(개인전)</span>의 3파전
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(roles).map((role) => {
              const s = {
                citizens: { bg: 'rgba(20,50,20,0.5)',   border: 'rgba(50,160,60,0.2)',   tc: '#80d890', badge: 'rgba(40,130,50,0.2)', bc: '#80d890' },
                mafia:    { bg: 'rgba(50,15,10,0.5)',   border: 'rgba(200,50,50,0.2)',   tc: '#f08080', badge: 'rgba(160,30,30,0.2)', bc: '#f08080' },
                solo:     { bg: 'rgba(45,30,8,0.5)',    border: 'rgba(200,140,40,0.2)',  tc: '#d4a040', badge: 'rgba(160,110,20,0.2)', bc: '#d4a040' },
              }[role.team];
              return (
                <div
                  key={role.id}
                  className="rounded-xl p-4"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: '#e4d0b0' }}>{role.name}</span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: s.badge, color: s.bc, border: `1px solid ${s.border}` }}
                        >
                          {role.team === 'citizens' ? '시민 팀' : role.team === 'mafia' ? '마피아 팀' : '개인전'}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: `${s.tc}80` }}>{role.winCondition}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed pl-1 border-l" style={{ color: 'rgba(200,170,130,0.7)', borderColor: s.border }}>
                    {role.action}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 핵심 재미 요소 ───────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>✨</span> 핵심 재미 요소
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(50,20,8,0.5)', border: '1px solid rgba(200,80,50,0.18)' }}>
              <h3 className="font-bold text-sm mb-2.5 flex items-center gap-2" style={{ color: '#f08060' }}>
                🔥 만취객(Drunkard)의 존재
              </h3>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(200,165,125,0.8)' }}>
                보통 마피아 게임은 "나 시민이야!"라고 주장하지만, 이 게임엔{' '}
                <span style={{ color: '#d4a040', fontWeight: 700 }}>"나 범인이야(제발 죽여줘)"</span>라고
                은근히 어필하는 만취객이 있습니다.
              </p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(200,165,125,0.8)' }}>
                <span style={{ color: '#80c8f0', fontWeight: 600 }}>시민들의 딜레마:</span>{' '}
                저 사람이 진짜 범인일까? 아니면 그냥 집에 가고 싶은 만취객일까?
              </p>
              <p className="text-xs font-semibold" style={{ color: '#f08060' }}>
                ⚠️ 만취객을 투표로 죽이면: 만취객이 즉시 승리하고 모두 패배합니다.
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(40,15,50,0.5)', border: '1px solid rgba(160,80,200,0.18)' }}>
              <h3 className="font-bold text-sm mb-2.5 flex items-center gap-2" style={{ color: '#c090f0' }}>
                🎭 히든 미션 (혼란 유발)
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(200,165,125,0.8)' }}>
                게임 시작 시, 각 플레이어는{' '}
                <span style={{ color: '#d4a040', fontWeight: 700 }}>'쓸데없는 딴짓 미션'</span>을 받습니다.
                이를 수행하다 보면 자연스럽게 의심을 사게 됩니다.
              </p>
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['갑자기 물티슈 뽑아서 옆 사람 주기', '대화 도중 혼자 박수 치며 웃기', '심각한 표정으로 허공 3초간 응시하기', '"근데 여기 냄새나지 않아?" 라고 말하기'].map((m) => (
                  <p key={m} className="text-xs" style={{ color: 'rgba(180,145,100,0.7)' }}>• {m}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 게임 진행 순서 ───────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>🌙</span> 게임 진행 순서
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(100,70,180,0.18)' }}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#a080f0' }}>
                🌙 밤 (Night Phase)
              </h3>
              <p className="text-xs mb-3" style={{ color: 'rgba(180,145,100,0.7)' }}>사회자(앱)의 안내에 따라 폰을 돌려가며 진행</p>
              <div className="space-y-2">
                {[
                  { icon: '🍷', c: '#f08080', label: '범인(마피아) 턴', desc: '제거할 대상을 선택합니다.' },
                  { icon: '🕵️', c: '#80b8f0', label: '목격자(경찰) 턴', desc: '의심 가는 사람 1명을 조사합니다.' },
                  { icon: '🧹', c: '#80e890', label: '수습반장(의사) 턴', desc: '보호할 사람 1명을 선택합니다.' },
                  { icon: '😴', c: 'rgba(180,145,100,0.5)', label: '만취객 & 시민', desc: '푹 잡니다. (아무 행동 안 함)' },
                ].map(({ icon, c, label, desc }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">{icon}</span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(200,165,125,0.8)' }}>
                      <span style={{ color: c, fontWeight: 600 }}>{label}:</span> {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(30,18,5,0.6)', border: '1px solid rgba(180,120,40,0.18)' }}>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#d4a040' }}>
                ☀️ 낮 (Day Phase)
              </h3>
              <div className="space-y-3 text-xs" style={{ color: 'rgba(200,165,125,0.8)' }}>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#d4a060' }}>📰 아침 뉴스</p>
                  <p className="mb-1">밤사이 누군가 당했는지 결과 발표</p>
                  <div className="pl-3 space-y-0.5" style={{ color: 'rgba(160,125,80,0.7)' }}>
                    <p>• 의사가 막았으면 "아무 일도 없었습니다."</p>
                    <p>• 못 막았으면 "OOO님이 탈락했습니다."</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#c090f0' }}>💬 토론 + 🗳️ 투표</p>
                  <div className="pl-3 space-y-0.5" style={{ color: 'rgba(160,125,80,0.7)' }}>
                    <p>• 다수결로 한 명을 지목</p>
                    <p style={{ color: '#d4a040' }}>⚠️ 만취객 지목 → 만취객 즉시 승리</p>
                    <p>• 범인 지목 → 시민 승리</p>
                    <p>• 시민 지목 → 밤으로 돌아감</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 전술 가이드 ───────────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>🧠</span> 역할별 전술 가이드
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🍷', title: '범인(마피아)', bg: 'rgba(50,15,10,0.5)', border: 'rgba(200,50,50,0.18)', tc: '#f08080', tips: ['히든 미션으로 눈에 띄지 않도록 하기', '경찰을 먼저 찾아서 제거 우선순위에 올리기', '만취객처럼 행동해서 의심 분산시키기', '"나도 저 사람 이상한 것 같아요" 동조 전술'] },
              { icon: '🕵️', title: '목격자(경찰)', bg: 'rgba(10,25,50,0.5)',  border: 'rgba(60,120,220,0.18)', tc: '#80b8f0', tips: ['조사 결과 즉시 공개하면 표적이 됨', '범인을 넌지시 언급하는 방식 활용', '의사와 비밀 신호 맞추기', '만취객과 진짜 범인 구분이 핵심'] },
              { icon: '🧹', title: '수습반장(의사)', bg: 'rgba(10,35,15,0.5)',  border: 'rgba(50,160,70,0.18)',  tc: '#80d890', tips: ['경찰 역할자를 보호하는 것이 최우선', '연속으로 같은 사람 보호 시 패턴 노출', '자기 보호도 전략 — 생존이 팀에 도움', '낮에 너무 조용하면 의심받으니 참여 필수'] },
              { icon: '🥴', title: '만취객', bg: 'rgba(45,28,5,0.5)',          border: 'rgba(200,140,40,0.18)',  tc: '#d4a040', tips: ['노골적으로 의심받으려 하면 오히려 무시당함', '히든 미션을 과하게 수행해 자연스럽게 노출', '"나 좀 이상하지 않아요?" 은근 어필', '범인인 척 흘리다가 부인하는 심리전'] },
            ].map(({ icon, title, bg, border, tc, tips }) => (
              <div key={title} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: tc }}>
                  <span>{icon}</span> {title}
                </h3>
                <ul className="space-y-1.5">
                  {tips.map((tip) => (
                    <li key={tip} className="text-xs leading-relaxed flex items-start gap-1.5" style={{ color: 'rgba(190,155,105,0.75)' }}>
                      <span style={{ color: 'rgba(160,110,60,0.5)' }} className="mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 승리 조건 ─────────────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>🏆</span> 승리 조건 한눈에 보기
          </h2>
          <div className="space-y-2.5">
            {[
              { emoji: '🎉', label: '시민 팀 승리', bg: 'rgba(20,50,20,0.4)', border: 'rgba(50,160,60,0.2)', tc: '#80d890', desc: '낮 투표에서 범인(마피아)을 쫓아내면 즉시 승리' },
              { emoji: '🍷', label: '마피아 팀 승리', bg: 'rgba(50,15,10,0.4)', border: 'rgba(200,50,50,0.2)', tc: '#f08080', desc: '살아있는 시민 수 ≤ 마피아 수가 되는 순간 승리' },
              { emoji: '🥴', label: '만취객 단독 승리', bg: 'rgba(45,28,5,0.4)', border: 'rgba(200,140,40,0.2)', tc: '#d4a040', desc: '낮 투표에서 만취객이 지목되어 쫓겨나면 즉시 승리', warn: '⚠️ 이 경우 시민/마피아팀 모두 패배!' },
            ].map(({ emoji, label, bg, border, tc, desc, warn }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span>{emoji}</span>
                  <span className="text-sm font-bold" style={{ color: tc }}>{label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(200,165,125,0.75)' }}>{desc}</p>
                {warn && <p className="text-xs font-semibold mt-1.5" style={{ color: '#d4a040' }}>{warn}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ── 꿀팁 ─────────────────────────────────────────────── */}
        <section className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(14,7,4,0.9)', border: '1px solid rgba(130,80,45,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2.5" style={{ color: '#e4ccaa' }}>
            <span>💡</span> 집들이 꿀팁
          </h2>
          <div className="space-y-3.5">
            {[
              { icon: '🎵', tc: '#80c8f0', label: 'BGM 활용', tip: '유튜브에서 \'마피아 게임 브금\'이나 \'The Genius BGM\'을 틀어두면 긴장감이 배가됩니다.' },
              { icon: '🍽️', tc: '#d4a040', label: '벌칙 내기', tip: '패배한 팀이 \'집들이 뒷정리\' 또는 \'설거지\'를 하기로 내기를 거세요. 눈에 불을 켜고 합니다.' },
              { icon: '🍷', tc: '#f08080', label: '음주 권장', tip: '약간의 알코올이 들어가면 만취객 연기가 더 자연스러워져서 난이도가 올라갑니다.' },
            ].map(({ icon, tc, label, tip }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: tc }}>{label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(180,145,100,0.75)' }}>{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 버튼 ─────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(to right, #5c1212, #8c1c1c)',
              color: '#f0d8b8',
              boxShadow: '0 4px 24px rgba(80,15,10,0.45)',
            }}
          >
            🎮 게임 시작하기
          </button>
          <button
            onClick={() => router.back()}
            className="px-5 py-4 rounded-2xl font-medium text-base transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(20,10,6,0.7)',
              color: 'rgba(180,140,90,0.8)',
              border: '1px solid rgba(130,80,45,0.2)',
            }}
          >
            ← 뒤로
          </button>
        </div>
      </div>
    </main>
  );
}
