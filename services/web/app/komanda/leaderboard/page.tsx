"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Star, Zap, Target, Award, Medal, TrendingUp } from "lucide-react"
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
  const rest = sorted.slice(3)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-500" />
              Liderlik dashboardi
            </h1>
            <p className="text-sm text-slate-500">{PLAYERS.length} ishtirokchi · gamification rejimi · oy yopilishigacha 28 kun</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3.map((p, i) => {
            const xpPct = Math.round((p.xp / p.xpToNext) * 100)
            return (
              <Card key={p.id} className={`p-5 border-2 ${
                i === 0 ? "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-400" :
                i === 1 ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-400" :
                "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-5xl">{["🥇", "🥈", "🥉"][i]}</div>
                  <div className="flex-1">
                    <div className="text-xs font-bold opacity-70">RANK {i + 1}</div>
                    <div className="text-base font-bold">{p.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-1 bg-violet-500 text-white rounded text-xs font-bold">LVL {p.level}</div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-mono font-bold">{fmt(p.xp)} XP</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Keyingi level</span>
                    <span className="font-mono">{p.xp} / {p.xpToNext}</span>
                  </div>
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-500" : "bg-orange-500"}`} style={{ width: `${xpPct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {p.badges.map((b, j) => (
                    <span key={j} className="text-xl" title={`Badge`}>{b}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <div className="opacity-60">Tushum</div>
                    <div className="font-bold font-mono">{fmt(p.revenue / 1_000_000)} M</div>
                  </div>
                  <div>
                    <div className="opacity-60">Streak</div>
                    <div className="font-bold font-mono flex items-center gap-1">🔥 {p.streak} kun</div>
                  </div>
                  <div>
                    <div className="opacity-60">Reyting</div>
                    <div className="font-bold font-mono flex items-center gap-1">⭐ {p.rating}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> To'liq jadval</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">O'yinchi</th>
                  <th className="py-3 px-2 text-center">Level</th>
                  <th className="py-3 px-2 text-right">XP</th>
                  <th className="py-3 px-2 text-center">Streak 🔥</th>
                  <th className="py-3 px-2 text-center">Badge</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2 text-center">⭐</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold">
                      {i < 3 ? <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span> : <span className="text-slate-400 text-lg">{i + 1}</span>}
                    </td>
                    <td className="py-3 px-2 font-semibold">{p.name}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-1 bg-violet-500 text-white rounded text-xs font-bold">{p.level}</span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-amber-700 flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" /> {fmt(p.xp)}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{p.streak}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-base">
                        {p.badges.slice(0, 5).map((b, j) => <span key={j}>{b}</span>)}
                        <span className="text-xs text-slate-500 ml-1">{p.badgesUnlocked}/{p.totalBadges}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(p.revenue)}</td>
                    <td className="py-3 px-2 text-center font-mono">{p.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-violet-600" /> Mavjud nishonlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BADGES_LIST.map(b => (
              <Card key={b.name} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{b.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{b.name}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600">{b.description}</div>
                <div className="text-xs text-emerald-700 font-mono mt-1">📌 {b.condition}</div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
