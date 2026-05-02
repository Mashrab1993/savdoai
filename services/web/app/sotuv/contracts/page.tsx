"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, FileText, Calendar, Download, Search, Eye, AlertCircle } from "lucide-react"
import Link from "next/link"

type Contract = {
  id: number; number: string; client: string; type: "supply" | "wholesale" | "exclusive" | "consignment";
  startDate: string; endDate: string;
  totalValue: number; revenueGenerated: number;
  paymentTerms: string;
  status: "active" | "expiring" | "expired" | "draft";
  signedDate: string | null;
}

const CONTRACTS: Contract[] = [
  { id: 1, number: "C-2024-0124", client: "Salom Magazin №1", type: "exclusive", startDate: "2024-08-12", endDate: "2026-08-12", totalValue: 0, revenueGenerated: 28_400_000, paymentTerms: "Zakaz + 7 kun", status: "active", signedDate: "2024-08-10" },
  { id: 2, number: "C-2024-0156", client: "Дастархон Сервис", type: "supply", startDate: "2024-09-10", endDate: "2025-09-10", totalValue: 60_000_000, revenueGenerated: 24_800_000, paymentTerms: "Zakaz + 14 kun", status: "expiring", signedDate: "2024-09-08" },
  { id: 3, number: "C-2025-0042", client: "Bona Магазин", type: "wholesale", startDate: "2024-12-05", endDate: "2026-12-05", totalValue: 36_000_000, revenueGenerated: 18_200_000, paymentTerms: "Naqd / Zakaz uchun", status: "active", signedDate: "2024-12-01" },
  { id: 4, number: "C-2025-0089", client: "Гулямов Маркет", type: "supply", startDate: "2025-02-01", endDate: "2026-02-01", totalValue: 24_000_000, revenueGenerated: 12_800_000, paymentTerms: "Zakaz + 14 kun", status: "expired", signedDate: "2025-01-28" },
  { id: 5, number: "C-2026-0012", client: "Family Маркет", type: "consignment", startDate: "2026-04-22", endDate: "2027-04-22", totalValue: 0, revenueGenerated: 6_800_000, paymentTerms: "Sotuv asosida 30 kun", status: "active", signedDate: "2026-04-20" },
  { id: 6, number: "C-2026-0024", client: "FRESH Маркет (yangi)", type: "supply", startDate: "2026-05-01", endDate: "2027-05-01", totalValue: 12_000_000, revenueGenerated: 720_000, paymentTerms: "Zakaz + 14 kun", status: "draft", signedDate: null },
]

const TYPE_LABEL: Record<string, string> = {
  supply: "📦 Yetkazib berish",
  wholesale: "🏢 Ulgurji",
  exclusive: "👑 Ekskluziv",
  consignment: "🤝 Konsignatsiya",
}
const TYPE_COLOR: Record<string, string> = {
  supply: "bg-blue-100 text-blue-700",
  wholesale: "bg-emerald-100 text-emerald-700",
  exclusive: "bg-amber-100 text-amber-700",
  consignment: "bg-violet-100 text-violet-700",
}
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expiring: "bg-amber-100 text-amber-700",
  expired: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-700",
}
const STATUS_LABEL: Record<string, string> = {
  active: "✓ Faol",
  expiring: "⚠️ Tugayapti",
  expired: "✕ Tugagan",
  draft: "📝 Qoralama",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function daysUntil(dateStr: string) {
  const target = new Date(dateStr).getTime()
  const today = new Date("2026-05-02").getTime()
  return Math.round((target - today) / 86400000)
}

export default function ContractsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = CONTRACTS
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => !search || c.client.toLowerCase().includes(search.toLowerCase()) || c.number.toLowerCase().includes(search.toLowerCase()))

  const expiringCount = CONTRACTS.filter(c => c.status === "expiring").length
  const totalRevenue = CONTRACTS.reduce((s, c) => s + c.revenueGenerated, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Shartnomalar</h1>
            <p className="text-sm text-slate-500">{CONTRACTS.length} ta shartnoma · jami {fmt(totalRevenue / 1_000_000)} M tushum keltirilgan</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi shartnoma</Button>
        </div>

        {expiringCount > 0 && (
          <Card className="p-5 bg-amber-50 border-amber-300 border-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-800">⏰ {expiringCount} ta shartnoma 90 kunda tugaydi</h3>
                <p className="text-sm text-slate-700 mt-1">
                  Yangilash bo'yicha klient bilan bog'lanish kerak: {CONTRACTS.filter(c => c.status === "expiring").map(c => c.client).join(", ")}.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <FileText className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol</div>
            <div className="text-2xl font-bold mt-1">{CONTRACTS.filter(c => c.status === "active").length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <FileText className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Tugayapti</div>
            <div className="text-2xl font-bold mt-1">{expiringCount}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <FileText className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Tugagan</div>
            <div className="text-2xl font-bold mt-1">{CONTRACTS.filter(c => c.status === "expired").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <FileText className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Tushum</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalRevenue / 1_000_000)} M</div>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "active", "expiring", "expired", "draft"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-md text-xs font-semibold ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
              {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="№ yoki klient..." className="pl-9 w-64" />
          </div>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-2">Klient</th>
                  <th className="py-3 px-2 text-center">Tip</th>
                  <th className="py-3 px-2">Davr</th>
                  <th className="py-3 px-2">To'lov shartlari</th>
                  <th className="py-3 px-2 text-right">Limit</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center w-24">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const daysLeft = daysUntil(c.endDate)
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-mono text-blue-700">{c.number}</td>
                      <td className="py-3 px-2 font-semibold">{c.client}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[c.type]}`}>{TYPE_LABEL[c.type]}</span>
                      </td>
                      <td className="py-3 px-2 text-xs">
                        <div className="font-mono">{c.startDate}</div>
                        <div className="font-mono text-slate-500">→ {c.endDate}</div>
                        {c.status === "active" && daysLeft > 0 && <div className={`text-[10px] mt-0.5 ${daysLeft < 90 ? "text-amber-700" : "text-slate-500"}`}>{daysLeft} kun qoldi</div>}
                        {c.status === "expired" && <div className="text-[10px] mt-0.5 text-rose-700">tugagan</div>}
                      </td>
                      <td className="py-3 px-2 text-xs">{c.paymentTerms}</td>
                      <td className="py-3 px-2 text-right font-mono text-xs">{c.totalValue > 0 ? fmt(c.totalValue / 1_000_000) + " M" : "—"}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(c.revenueGenerated / 1_000_000)} M</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                          <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="PDF"><FileText className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
