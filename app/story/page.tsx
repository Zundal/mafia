"use client";

import { useRouter } from "next/navigation";
import { roles } from "@/lib/roles";

export default function StoryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
            🍷 집들이 미스터리
          </h1>
          <p className="text-slate-300 text-lg font-medium">
            깨진 와인병의 비밀
          </p>
        </div>

        {/* 스토리 개요 */}
        <section className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-3xl">📖</span>
            스토리 개요
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p className="text-lg">
              즐거운 집들이 파티 도중, 부엌에서 <span className="text-red-400 font-bold">"쨍그랑!"</span> 하는 소리가 들렸습니다.
            </p>
            <p>
              가보니 집주인이 아끼던 <span className="text-amber-400 font-semibold">빈티지 와인(혹은 30년산 인삼주)</span>이 박살 나 있습니다.
            </p>
            <p className="text-cyan-400 font-medium">
              범인은 이 자리에 있는 6명 중 한 명.
            </p>
            <p>
              하지만 알코올 냄새가 진동하는 현장에서, 술에 취해 횡설수설하는 사람까지 섞여 있어 범인 찾기가 쉽지 않습니다.
            </p>
          </div>
        </section>

        {/* 역할 소개 */}
        <section className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-3xl">🎭</span>
            역할 소개 (총 6인)
          </h2>
          <p className="text-slate-300 mb-6 text-center">
            이 게임은 <span className="text-cyan-400 font-bold">시민 팀</span> vs <span className="text-red-400 font-bold">마피아 팀</span> vs <span className="text-amber-400 font-bold">만취객(개인전)</span>의 3파전입니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(roles).map((role) => {
              const teamColors = {
                citizens: "from-green-500/20 to-emerald-500/20 border-green-500/30",
                mafia: "from-red-500/20 to-rose-500/20 border-red-500/30",
                solo: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
              };
              
              return (
                <div
                  key={role.id}
                  className={`glass rounded-xl p-5 border bg-gradient-to-br ${teamColors[role.team]}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{role.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{role.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        role.team === "citizens" ? "bg-green-500/30 text-green-300" :
                        role.team === "mafia" ? "bg-red-500/30 text-red-300" :
                        "bg-amber-500/30 text-amber-300"
                      }`}>
                        {role.team === "citizens" ? "시민 팀" : role.team === "mafia" ? "마피아 팀" : "개인전"}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">
                    <span className="font-semibold text-cyan-400">승리 조건:</span> {role.winCondition}
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {role.action}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 핵심 재미 요소 */}
        <section className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-3xl">✨</span>
            게임의 핵심 재미 요소
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-xl p-5 border border-red-500/20">
              <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                🔥 만취객(Drunkard)의 존재
              </h3>
              <p className="text-slate-300 leading-relaxed mb-2">
                보통 마피아 게임은 "나 시민이야!"라고 주장하지만, 이 게임에는 <span className="text-amber-400 font-bold">"나 범인이야(제발 죽여줘)"</span>라고 은근히 어필하는 만취객이 있습니다.
              </p>
              <p className="text-slate-300 leading-relaxed mb-2">
                <span className="text-cyan-400 font-semibold">시민들의 딜레마:</span> 저 사람이 진짜 범인일까? 아니면 그냥 집에 가고 싶은 만취객일까?
              </p>
              <p className="text-red-400 font-bold">
                ⚠️ 만취객을 투표로 죽이면: 만취객이 즉시 승리하고 시민/마피아 모두 패배합니다.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                🎭 히든 미션 (혼란 유발)
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                게임 시작 시, 각 플레이어는 역할과 함께 <span className="text-amber-400 font-bold">'쓸데없는 딴짓 미션'</span>을 하나씩 받습니다.
              </p>
              <p className="text-slate-300 leading-relaxed mb-3">
                이 미션을 수행하려다 보면 행동이 부자연스러워져서 의심을 사게 됩니다.
              </p>
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <p className="text-slate-400 text-sm font-semibold mb-2">미션 예시:</p>
                <ul className="space-y-1.5 text-slate-300 text-sm">
                  <li>• 갑자기 물티슈 뽑아서 옆 사람 주기</li>
                  <li>• 대화 도중 혼자 박수 치며 웃기</li>
                  <li>• 심각한 표정으로 허공 3초간 응시하기</li>
                  <li>• "근데 여기 냄새나지 않아?" 라고 말하기</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 게임 진행 순서 */}
        <section className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-3xl">🌙</span>
            게임 진행 순서
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-indigo-500/20">
              <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
                🌙 밤 (Night Phase)
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                사회자(앱)의 안내에 따라 폰을 돌려가며 진행
              </p>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">🍷</span>
                  <span><span className="font-semibold">범인(마피아) 턴:</span> 제거할 대상을 선택합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">🕵️</span>
                  <span><span className="font-semibold">목격자(경찰) 턴:</span> 의심 가는 사람 1명을 조사합니다. (결과를 혼자만 확인)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">🧹</span>
                  <span><span className="font-semibold">수습반장(의사) 턴:</span> 보호할 사람 1명을 선택합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">😴</span>
                  <span><span className="font-semibold">만취객 & 시민:</span> 푹 잡니다. (아무 행동 안 함)</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-5 border border-amber-500/20">
              <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                ☀️ 낮 (Day Phase)
              </h3>
              <div className="space-y-3 text-slate-300 text-sm">
                <div>
                  <p className="font-semibold text-cyan-400 mb-1">📰 아침 뉴스:</p>
                  <p className="mb-2">밤사이 누군가 당했는지 결과를 발표합니다.</p>
                  <ul className="ml-4 space-y-1 text-slate-400">
                    <li>• 의사가 성공적으로 막았으면 "아무 일도 없었습니다."</li>
                    <li>• 막지 못했으면 "OOO님이 입막음을 당해 탈락했습니다."</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-purple-400 mb-1">💬 토론 시간:</p>
                  <p>누가 범인인지 추리합니다. 히든 미션을 수행하는 사람을 잘 관찰하세요.</p>
                </div>
                <div>
                  <p className="font-semibold text-pink-400 mb-1">🗳️ 투표:</p>
                  <ul className="ml-4 space-y-1 text-slate-400">
                    <li>• 다수결로 한 명을 지목합니다.</li>
                    <li className="text-amber-400">⚠️ 주의: 만취객을 지목하면 그 즉시 게임이 터집니다(만취객 승).</li>
                    <li>• 범인을 지목하면 시민 승리.</li>
                    <li>• 엄한 시민을 지목하면 게임 계속 진행 (밤으로 돌아감).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 집들이 꿀팁 */}
        <section className="glass rounded-2xl p-8 mb-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-3xl">💡</span>
            집들이 꿀팁 (Host Guide)
          </h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎵</span>
              <div>
                <p className="font-semibold text-cyan-400 mb-1">BGM 활용</p>
                <p className="text-sm">유튜브에서 '마피아 게임 브금'이나 'The Genius BGM'을 틀어두면 긴장감이 배가됩니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="font-semibold text-amber-400 mb-1">벌칙</p>
                <p className="text-sm">패배한 팀이 '집들이 뒷정리' 또는 '설거지'를 하기로 내기를 거세요. 눈에 불을 켜고 합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍷</span>
              <div>
                <p className="font-semibold text-red-400 mb-1">음주 권장</p>
                <p className="text-sm">약간의 알코올이 들어가면 만취객 연기가 더 자연스러워져서 난이도가 올라갑니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            게임 시작하기
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-4 glass-light hover:bg-slate-800/50 text-slate-100 font-medium rounded-xl transition-all border border-slate-700/50"
          >
            뒤로가기
          </button>
        </div>
      </div>
    </main>
  );
}
