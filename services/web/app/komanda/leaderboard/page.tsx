"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trophy, Zap, Award } from "lucide-react"
import Link from "next/link"

type Player = {
  id: number; name: string; level: number; xp: number; xpToNext: number;
  badges: string[]; streak: number;
  revenue: number; orders: number; rating: number;
  badgesUnlocked: number; totalBadges: number;
}

const PLAYERS: Player[] = [
  { id: 1, name: "BORIEV MIRJALOL", level: 12, xp: 8400, xpToNext: 10000, badges: ["🏆", "⭐", "🔥", "💎", "🎯"], streak: 28, revenue: 36_400_000, orders: 196, rating: 4.7, badgesUnlocked: 18, totalBadges: 24 },
  { id: 2, name: "Babadjanova Nargiza", level: 11, xp: 7200, xpToNext: 9000, badges: ["🏆", "⭐", "🔥", "💎"], streak: 21, revenue: 28_400_000, orders: 184, rating: 4.8, badgesUnlocked: 16, totalBadges: 24 },
  { id: 3, name: "ДАВЛАТ", level: 10, xp: 6800, xpToNext: 8000, badges: ["🏆", "⭐", "🔥"], streak: 18, revenue: 31_200_000, orders: 198, rating: 4.5, badgesUnlocked: 14, totalBadges: 24 },
  { id: 4, name: "Berdiyev Rahmatillo", level: 9, xp: 5600, xpToNext: 7000, badges: ["⭐", "🔥", "🎯"], streak: 14, revenue: 24_800_000, orders: 162, rating: 4.6, badgesUnlocked: 12, totalBadges: 24 },
  { id: 5, name: "Sayitqulov Mashrab", level: 7, xp: 3800, xpToNext: 5000, badges: ["⭐", "🎯"], streak: 7, revenue: 11_200_000, orders: 68, rating: 4.4, badgesUnlocked: 8, totalBadges: 24 },
  { id: 6, name: "Турсунов Жамшед", level: 5, xp: 2200, xpToNext: 3000, badges: ["🎯"], streak: 3, revenue: 14_800_000, orders: 64, rating: 3.9, badgesUnlocked: 5, totalBadges: 24 },
]

type BadgeDef = { emoji: string; name: string; description: string; condition: string }

const BADGES_LIST: BadgeDef[] = [
  { emoji: "🏆", name: "Champion", description: "Oyning eng yaxshisi", condition: "Top-1 oy davomida" },
  { emoji: "⭐", name: "Yulduz", description: "Doimiy yaxshi natija", condition: "5 hafta ketma-ket TOP-3" },
  { emoji: "🔥", name: "On Fire", description: "Ketma-ket sotuvlar", condition: "20+ kun streak" },
  { emoji: "💎", name: "Diamond", description: "Premium klientlar bilan ishlash", condition: "5+ Champions klient" },
  { emoji: "🎯", name: "Sniper", description: "Aniq prognoz", condition: "Plan 95-105% bajarish" },
  { emoji: "🚀", name: "Tezda", description: "Bir kunda ko'p sotuv", condition: "1 kun ichida 20 zakaz" },
  { emoji: "📈", name: "Grower", description: "O'sish dinamikasi", condition: "3 oy ketma-ket o'sish" },
  { emoji: "🎁", name: "Promo Master", description: "Promo aktsiya samaradorligi", condition: "ROI 100%+ promo" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function LeaderboardPage() {
  const sorted = [...PLAYERS].sort((a, b) => b.xp - a.xp)
  const top3 = sorted.slice(0, 3)
  const RANK_ACCENT = ["#D97706", "#9C8A6E", "#C75D3C"]

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Trophy className="w-8 h-8 text-[#D97706]" />
                Liderlik <span className="italic text-[#C75D3C]">dashboardi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{PLAYERS.length} ishtirokchi · gamification rejimi · oy yopilishigacha 28 kun</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((p, i) => {
              const xpPct = Math.round((p.xp / p.xpToNext) * 100)
              const accent = RANK_ACCENT[i]
              return (
                <Card key={p.id} className="p-6 bg-white border-2 shadow-sm rounded-2xl relative overflow-hidden" style={{ borderColor: `${accent}55` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-5xl">{["🥇", "🥈", "🥉"][i]}</div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: accent }}>RANK {i + 1}</div>
                      <div className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{p.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-2.5 py-1 rounded text-xs font-medium text-white" style={{ background: accent }}>LVL {p.level}</div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" style={{ color: accent }} />
                      <span className="text-sm font-mono font-medium text-[#1A1A1A]">{fmt(p.xp)} XP</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1 text-[#6B5B4D]">
                      <span>Keyingi level</span>
                      <span className="font-mono">{p.xp} / {p.xpToNext}</span>
                    </div>
                    <div className="h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: accent }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {p.badges.map((b, j) => (
                      <span key={j} className="text-2xl" title={`Badge`}>{b}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F0EAE0] text-xs">
                    <div>
                      <div className="text-[#9C8A6E]">Tushum</div>
                      <div className="font-medium font-mono text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(p.revenue / 1_000_000)} M</div>
                    </div>
                    <div>
                      <div className="text-[#9C8A6E]">Streak</div>
                      <div className="font-medium font-mono text-[#1A1A1A] flex items-center gap-1">🔥 {p.streak} k</div>
                    </div>
                    <div>
                      <div className="text-[#9C8A6E]">Reyting</div>
                      <div className="font-medium font-mono text-[#1A1A1A] flex items-center gap-1">⭐ {p.rating}</div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <Trophy className="w-5 h-5 text-[#D97706]" /> To'liq jadval
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'yinchi</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Level</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">XP</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Streak</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Badge</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">⭐</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => (
                    <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        {i < 3 ? <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span> : <span className="text-[#9C8A6E] text-lg">{i + 1}</span>}
                      </td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{p.name}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ background: i < 3 ? RANK_ACCENT[i] : "#9C8A6E" }}>{p.level}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#D97706] flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3" /> {fmt(p.xp)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-[#1A1A1A]">{p.streak}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5 text-base">
                          {p.badges.slice(0, 5).map((b, j) => <span key={j}>{b}</span>)}
                          <span className="text-xs text-[#9C8A6E] ml-1">{p.badgesUnlocked}/{p.totalBadges}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(p.revenue)}</td>
                      <td className="py-3 px-2 text-center font-mono text-[#1A1A1A]">{p.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <Award className="w-5 h-5 text-[#C75D3C]" /> Mavjud nishonlar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BADGES_LIST.map(b => (
                <Card key={b.name} className="p-4 bg-[#FAF7F2] border border-[#E8E0D3] rounded-2xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{b.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{b.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#6B5B4D]">{b.description}</div>
                  <div className="text-xs text-[#C75D3C] font-mono mt-2">📌 {b.condition}</div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
