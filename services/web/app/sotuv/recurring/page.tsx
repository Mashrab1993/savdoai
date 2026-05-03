"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Repeat, Calendar, Pause, Play, Edit, Trash2, Sparkles } from "lucide-react"
import Link from "next/link"

type Subscription = {
  id: number; client: string; agent: string;
  cadence: "weekly" | "biweekly" | "monthly";
  nextDate: string; lastOrder: string;
  itemsCount: number; avgSum: number; totalGenerated: number;
  active: boolean; autoConfirm: boolean;
}

const SUBS: Subscription[] = [
  { id: 1, client: "Salom Magazin №1", agent: "Babadjanova N.", cadence: "weekly", nextDate: "2026-05-09", lastOrder: "2026-05-02", itemsCount: 12, avgSum: 1_840_000, totalGenerated: 22_080_000, active: true, autoConfirm: true },
  { id: 2, client: "Bona Магазин", agent: "Berdiyev R.", cadence: "biweekly", nextDate: "2026-05-14", lastOrder: "2026-04-30", itemsCount: 8, avgSum: 1_240_000, totalGenerated: 14_880_000, active: true, autoConfirm: false },
  { id: 3, client: "Дастархон Сервис", agent: "Sayitqulov M.", cadence: "weekly", nextDate: "2026-05-08", lastOrder: "2026-05-01", itemsCount: 18, avgSum: 2_840_000, totalGenerated: 51_120_000, active: true, autoConfirm: true },
  { id: 4, client: "Гулямов Маркет", agent: "ДАВЛАТ", cadence: "monthly", nextDate: "2026-05-26", lastOrder: "2026-04-26", itemsCount: 24, avgSum: 4_200_000, totalGenerated: 16_800_000, active: true, autoConfirm: false },
  { id: 5, client: "Турсун Ake Магазин", agent: "BORIEV M.", cadence: "weekly", nextDate: "2026-05-12", lastOrder: "2026-04-29", itemsCount: 6, avgSum: 920_000, totalGenerated: 7_360_000, active: false, autoConfirm: true },
  { id: 6, client: "Family Маркет", agent: "ДАВЛАТ", cadence: "biweekly", nextDate: "2026-05-15", lastOrder: "2026-05-01", itemsCount: 14, avgSum: 1_640_000, totalGenerated: 11_480_000, active: true, autoConfirm: true },
]

const SERIF: React.CSSProperties = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const CADENCE_LABEL: Record<string, string> = {
  weekly: "Haftalik",
  biweekly: "2-haftalik",
  monthly: "Oylik",
}
const CADENCE_DAYS: Record<string, number> = {
  weekly: 7, biweekly: 14, monthly: 30,
}

export default function RecurringOrdersPage() {
  const [subs, setSubs] = useState(SUBS)

  const toggleActive = (id: number) => {
    setSubs(subs.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const activeCount = subs.filter(s => s.active).length
  const totalMonthlyValue = subs.filter(s => s.active).reduce((sum, s) => sum + (s.avgSum * 30) / CADENCE_DAYS[s.cadence], 0)
  const totalLifetime = subs.reduce((s, x) => s + x.totalGenerated, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={SERIF}>
                <Repeat className="w-8 h-8 text-[#C75D3C]" />
                Avtomatik <span className="italic text-[#C75D3C]">takroriy zakazlar</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{activeCount} faol obuna · ~{fmt(totalMonthlyValue / 1_000_000)} M oylik · {fmt(totalLifetime / 1_000_000)} M lifetime</p>
            </div>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi obuna</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { Icon: Repeat, label: "FAOL OBUNA", value: activeCount, color: "#059669" },
              { Icon: Calendar, label: "BU OY ETA, M", value: fmt(totalMonthlyValue / 1_000_000), color: "#1D4ED8" },
              { Icon: Sparkles, label: "AUTO-CONFIRM", value: subs.filter(s => s.autoConfirm).length, color: "#6D28D9" },
              { Icon: Repeat, label: "LIFETIME, M", value: fmt(totalLifetime / 1_000_000), color: "#C75D3C" },
            ].map((kpi, i) => (
              <Card key={i} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
                <kpi.Icon className="w-5 h-5 mb-3" style={{ color: kpi.color }} />
                <div className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: kpi.color }}>{kpi.label}</div>
                <div className="text-3xl font-light mt-2 tabular-nums text-[#1A1A1A]" style={SERIF}>{kpi.value}</div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: kpi.color, opacity: 0.4 }} />
              </Card>
            ))}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={SERIF}>Obunalar ro'yxati</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Davriylik</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Keyingi</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'rta zakaz</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Lifetime</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Auto</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-32">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id} className={`border-b border-[#F0EAE0] hover:bg-[#FAF7F2] ${!s.active ? "opacity-50" : ""}`}>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{s.client}</td>
                      <td className="py-3 px-2 text-xs text-[#6B5B4D]">{s.agent}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{CADENCE_LABEL[s.cadence]}</span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-xs text-[#1A1A1A]">{s.nextDate}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{s.itemsCount}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(s.avgSum)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(s.totalGenerated / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-center">
                        {s.autoConfirm
                          ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Auto</span>
                          : <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#D97706]">Manual</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {s.active
                          ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Faol</span>
                          : <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D]">Pauza</span>}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toggleActive(s.id)} className={`p-1.5 rounded ${s.active ? "text-[#D97706] hover:bg-[#FCE9DD]" : "text-emerald-700 hover:bg-emerald-50"}`} title={s.active ? "Pauza" : "Davom"}>
                            {s.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button className="p-1.5 text-[#6B5B4D] hover:bg-[#F0EAE0] rounded"><Edit className="w-4 h-4" /></button>
                          <button className="p-1.5 text-[#C75D3C] hover:bg-[#F5E5D6] rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-[#FAF7F2] border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-[#C75D3C] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-[#1A1A1A]" style={SERIF}>Avtomatik takroriy zakaz nima?</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Klient haftalik/oylik bir xil tovar to'plamini sotib oladigan bo'lsa — uni avtomatlashtirish mumkin.
                  Belgilangan kunda tizim avtomatik zakaz yaratadi va (auto-confirm bo'lsa) yetkazib berishga yuboradi.
                  Champions klientlar bilan ishlash uchun ideal vosita.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
