"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Truck, ArrowRight, Download, Search, Eye, Pencil } from "lucide-react"
import Link from "next/link"

type Transfer = {
  id: number; date: string; fromWh: string; toWh: string;
  itemsCount: number; totalQty: number; totalValue: number;
  status: "draft" | "in_transit" | "delivered" | "cancelled";
  driver: string; vehicle: string;
}

const TRANSFERS: Transfer[] = [
  { id: 5024, date: "2026-05-02 09:30", fromWh: "Yashnobod (markaziy)", toWh: "Sergeli (filial)", itemsCount: 12, totalQty: 184, totalValue: 2_240_000, status: "in_transit", driver: "Toxirov M.", vehicle: "01 A 234 BB" },
  { id: 5018, date: "2026-04-30 14:20", fromWh: "Yashnobod (markaziy)", toWh: "Bektemir (filial)", itemsCount: 8, totalQty: 96, totalValue: 1_240_000, status: "delivered", driver: "Aminov R.", vehicle: "01 B 567 CC" },
  { id: 5012, date: "2026-04-28 11:45", fromWh: "Sergeli (filial)", toWh: "Yashnobod (markaziy)", itemsCount: 4, totalQty: 24, totalValue: 380_000, status: "delivered", driver: "Karimov F.", vehicle: "01 C 890 DD" },
  { id: 5006, date: "2026-04-25 16:10", fromWh: "Bektemir (filial)", toWh: "Yashnobod (markaziy)", itemsCount: 14, totalQty: 248, totalValue: 3_120_000, status: "delivered", driver: "Sobirov G.", vehicle: "01 A 234 BB" },
  { id: 5000, date: "2026-04-22 10:00", fromWh: "Yashnobod (markaziy)", toWh: "Sergeli (filial)", itemsCount: 6, totalQty: 48, totalValue: 720_000, status: "cancelled", driver: "—", vehicle: "—" },
  { id: 4994, date: "2026-04-20 13:25", fromWh: "Yashnobod (markaziy)", toWh: "Yangi filial (test)", itemsCount: 18, totalQty: 320, totalValue: 4_840_000, status: "delivered", driver: "Toxirov M.", vehicle: "01 A 234 BB" },
]

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-[#F0EAE0] text-[#6B5B4D]",
  in_transit: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-[#F5E5D6] text-[#C75D3C]",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "📝 Qoralama",
  in_transit: "🚛 Yo'lda",
  delivered: "✓ Yetkazildi",
  cancelled: "✕ Bekor",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TransfersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = TRANSFERS
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => !search || String(t.id).includes(search) || t.fromWh.toLowerCase().includes(search.toLowerCase()) || t.toWh.toLowerCase().includes(search.toLowerCase()))

  const totalValue = TRANSFERS.filter(t => t.status === "delivered").reduce((s, t) => s + t.totalValue, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Ombor <span className="italic text-[#C75D3C]">ko'chirish</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{TRANSFERS.length} ta ko'chirish · jami yetkazilgan <span className="text-emerald-700 font-medium">{fmt(totalValue / 1_000_000)} M</span> so'm</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button className="gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi ko'chirish</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard accent="#9C8A6E" label="📝 Qoralama" value={TRANSFERS.filter(t => t.status === "draft").length.toString()} />
            <KpiCard icon={Truck} accent="#3B82F6" label="Yo'lda" value={TRANSFERS.filter(t => t.status === "in_transit").length.toString()} />
            <KpiCard accent="#10B981" label="✓ Yetkazildi" value={TRANSFERS.filter(t => t.status === "delivered").length.toString()} />
            <KpiCard accent="#C75D3C" label="Jami summa" value={`${fmt(totalValue / 1_000_000)} M`} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "draft", "in_transit", "delivered", "cancelled"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? "bg-[#C75D3C] text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}>
                {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
              </button>
            ))}
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID yoki ombor..." className="pl-9 w-64 border-[#E8E0D3] bg-[#FAF7F2]" />
            </div>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yo'nalish</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Driver / Avto</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Status</th>
                    <th className="py-3 px-2 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-mono text-[#C75D3C] font-medium">#{t.id}</td>
                      <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{t.date}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#6B5B4D]">📦 {t.fromWh}</span>
                          <ArrowRight className="w-4 h-4 text-[#C75D3C]" />
                          <span className="text-sm font-medium text-[#1A1A1A]">📦 {t.toWh}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{t.itemsCount}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(t.totalQty)}</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(t.totalValue)}</td>
                      <td className="py-3 px-2 text-xs">
                        <div className="text-[#1A1A1A]">{t.driver}</div>
                        <div className="text-[#9C8A6E] font-mono">{t.vehicle}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                          <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Pencil className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon?: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      {Icon && <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />}
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
