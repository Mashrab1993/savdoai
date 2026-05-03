"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Calendar, Download, Building2, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { id: 1, name: "Asia Optom Market", inn: "302134987", agent: "Nurmatov A.", region: "Sergeli", visits: 28, orders: 84, revenue: 142_800_000, avgOrder: 1_700_000, lastOrder: "2026-04-30", debt: 18_500_000 },
  { id: 2, name: "Globus Plus", inn: "302456789", agent: "Rasulov B.", region: "Markaz", visits: 22, orders: 62, revenue: 98_600_000, avgOrder: 1_590_000, lastOrder: "2026-04-28", debt: 12_300_000 },
  { id: 3, name: "Mega Skidka Bozor", inn: "302789012", agent: "Yusupov D.", region: "Buxoro", visits: 18, orders: 56, revenue: 84_200_000, avgOrder: 1_503_000, lastOrder: "2026-04-25", debt: 6_400_000 },
  { id: 4, name: "Optom Tovar Service", inn: "302890123", agent: "Karimov S.", region: "Yashnobod", visits: 14, orders: 48, revenue: 72_400_000, avgOrder: 1_508_000, lastOrder: "2026-04-22", debt: 8_900_000 },
  { id: 5, name: "Lider Optom", inn: "302345678", agent: "Nurmatov A.", region: "Sergeli", visits: 12, orders: 42, revenue: 58_600_000, avgOrder: 1_395_000, lastOrder: "2026-04-20", debt: 2_800_000 },
  { id: 6, name: "Sharq Magazin", inn: "302901234", agent: "Karimov S.", region: "Yashnobod", visits: 8, orders: 36, revenue: 42_400_000, avgOrder: 1_177_000, lastOrder: "2026-04-15", debt: 4_200_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function CustomerCardPage() {
  const [search, setSearch] = useState("")
  const filtered = ROWS.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))

  const totalRevenue = ROWS.reduce((s, r) => s + r.revenue, 0)
  const totalDebt = ROWS.reduce((s, r) => s + r.debt, 0)
  const totalVisits = ROWS.reduce((s, r) => s + r.visits, 0)
  const totalOrders = ROWS.reduce((s, r) => s + r.orders, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Карточка клиента <span className="italic text-[#C75D3C]">детальный отчёт</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{ROWS.length} klient · har biri uchun vizit, zakaz, tushum va qarz</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient..." className="pl-9 border-[#E8E0D3]" />
              </div>
              {["Агент", "Территория", "Категория клиента"].map(f => (
                <button key={f} className="px-3 py-2 border border-[#E8E0D3] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center gap-1 text-[#6B5B4D] bg-white">
                  <span>{f}</span><span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
              <button className="px-3 py-2 border border-[#C75D3C] bg-[#F5E5D6] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> май 2 ▾
              </button>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#10B981" }}>Общая выручка</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{fmt(totalRevenue / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami tushum</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Building2 className="w-5 h-5 mb-2" style={{ color: "#3B82F6" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#3B82F6" }}>Заказы</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{totalOrders}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami zakazlar</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#3B82F6" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Building2 className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Visit'ы</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{totalVisits}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">tashriflar</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#7C3AED" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <AlertCircle className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Долги</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{fmt(totalDebt / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">qarz qoldig'i</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[200px]">Клиент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ИНН</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Регион</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Visit</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Заказы</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Выручка</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Средний</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Последний</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Долг</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-3 px-2">
                        <Link href={`/klientlar/${r.id}`} className="font-medium text-[#C75D3C] hover:underline">{r.name}</Link>
                      </td>
                      <td className="py-3 px-2 font-mono tabular-nums text-[#6B5B4D]">{r.inn}</td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{r.agent}</td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{r.region}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{r.visits}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{r.orders}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(r.revenue)}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(r.avgOrder)}</td>
                      <td className="py-3 px-2 font-mono tabular-nums text-xs text-[#6B5B4D]">{r.lastOrder}</td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${r.debt > 0 ? "text-[#C75D3C]" : "text-[#9C8A6E]"}`}>
                        {r.debt > 0 ? fmt(r.debt) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t border-[#E8E0D3]">
                    <td colSpan={5} className="py-3 px-2 text-[#1A1A1A]" style={SERIF}>Итого: {filtered.length} клиентов</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{totalVisits}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{totalOrders}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700" style={SERIF}>{fmt(totalRevenue)}</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]" style={SERIF}>{fmt(Math.round(totalRevenue / totalOrders))}</td>
                    <td></td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]" style={SERIF}>{fmt(totalDebt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
