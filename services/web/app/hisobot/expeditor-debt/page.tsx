"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, AlertCircle, TrendingUp, Phone, Download } from "lucide-react"
import Link from "next/link"

const EXPEDITORS = [
  { id: 1, name: "Toxirov M.", phone: "+998935678902", region: "Toshkent · Sergeli", deliveries: 124, collected: 86_400_000, owed: 12_400_000, last: "2026-05-01" },
  { id: 2, name: "Aminov R.", phone: "+998935678903", region: "Samarqand · yetkazish", deliveries: 96, collected: 72_800_000, owed: 8_200_000, last: "2026-04-30" },
  { id: 3, name: "Karimov F.", phone: "+998935678906", region: "Buxoro · yetkazish", deliveries: 64, collected: 48_400_000, owed: 6_800_000, last: "2026-04-29" },
  { id: 4, name: "Sobirov G.", phone: "+998935678907", region: "Andijon · yetkazish", deliveries: 48, collected: 36_200_000, owed: 4_200_000, last: "2026-04-28" },
  { id: 5, name: "Yuldoshev H.", phone: "+998935678908", region: "Toshkent · Yashnobod", deliveries: 84, collected: 62_400_000, owed: 0, last: "2026-04-27" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ExpeditorDebtPage() {
  const [search, setSearch] = useState("")
  const filtered = EXPEDITORS.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))
  const totalCollected = EXPEDITORS.reduce((s, e) => s + e.collected, 0)
  const totalOwed = EXPEDITORS.reduce((s, e) => s + e.owed, 0)
  const totalDeliveries = EXPEDITORS.reduce((s, e) => s + e.deliveries, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Ekspeditor <span className="italic text-[#C75D3C]">qarzlari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Yetkazish vakili qo'lidagi naqd pul · {EXPEDITORS.length} ta ekspeditor</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiCard icon={TrendingUp} accent="#10B981" label="Yig'ilgan" value={`${fmt(totalCollected / 1_000_000)} M`} sub="so'm · oy davomida" />
            <KpiCard icon={AlertCircle} accent="#C75D3C" label="Ekspeditor qo'lida" value={`${fmt(totalOwed / 1_000_000)} M`} sub={`${(totalOwed / totalCollected * 100).toFixed(1)}% topshirilmagan`} />
            <KpiCard icon={TrendingUp} accent="#3B82F6" label="Yetkazish" value={totalDeliveries.toString()} sub="ta dostavka" />
            <KpiCard icon={TrendingUp} accent="#7C3AED" label="O'rtacha" value={`${fmt(Math.round(totalCollected / totalDeliveries / 1000))}K`} sub="so'm/dostavka" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ekspeditor..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ekspeditor</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Region</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Dostavka</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yig'ilgan</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qo'lida (qarz)</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">So'nggi</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Aloqa</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{e.name}</div>
                        <div className="text-xs text-[#9C8A6E]">{e.phone}</div>
                      </td>
                      <td className="py-3 px-2 text-[#6B5B4D] text-xs">{e.region}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{e.deliveries}</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(e.collected)}</td>
                      <td className={`py-3 px-2 text-right font-mono font-medium ${e.owed > 0 ? "text-[#C75D3C]" : "text-[#9C8A6E]"}`} style={e.owed > 0 ? { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } : {}}>
                        {e.owed > 0 ? fmt(e.owed) : "—"}
                      </td>
                      <td className="py-3 px-2 text-[#9C8A6E] font-mono text-xs">{e.last}</td>
                      <td className="py-3 px-2 text-center">
                        <button className="p-1.5 hover:bg-emerald-50 rounded-lg"><Phone className="w-4 h-4 text-emerald-600" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                    <td colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami:</td>
                    <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{totalDeliveries}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalCollected)}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalOwed)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-7 h-7 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
