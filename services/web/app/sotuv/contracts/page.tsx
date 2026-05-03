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
  supply: "Yetkazib berish",
  wholesale: "Ulgurji",
  exclusive: "Ekskluziv",
  consignment: "Konsignatsiya",
}
const TYPE_COLOR: Record<string, string> = {
  supply: "bg-blue-50 text-blue-700",
  wholesale: "bg-emerald-50 text-emerald-700",
  exclusive: "bg-[#FCE9DD] text-[#D97706]",
  consignment: "bg-purple-50 text-purple-700",
}
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-[#FCE9DD] text-[#D97706]",
  expired: "bg-[#F5E5D6] text-[#C75D3C]",
  draft: "bg-[#F0EAE0] text-[#6B5B4D]",
}
const STATUS_LABEL: Record<string, string> = {
  active: "Faol",
  expiring: "Tugayapti",
  expired: "Tugagan",
  draft: "Qoralama",
}

const SERIF: React.CSSProperties = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

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
  const activeCount = CONTRACTS.filter(c => c.status === "active").length
  const expiredCount = CONTRACTS.filter(c => c.status === "expired").length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Shartnomalar <span className="italic text-[#C75D3C]">arxivi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{CONTRACTS.length} ta shartnoma · jami {fmt(totalRevenue / 1_000_000)} M tushum keltirilgan</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi shartnoma</Button>
          </div>

          {expiringCount > 0 && (
            <Card className="p-5 bg-[#FCE9DD] border border-[#E8C9A8] rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-7 h-7 text-[#D97706] flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-[#1A1A1A]" style={SERIF}>{expiringCount} ta shartnoma 90 kunda tugaydi</h3>
                  <p className="text-sm text-[#6B5B4D] mt-1">
                    Yangilash bo'yicha klient bilan bog'lanish kerak: {CONTRACTS.filter(c => c.status === "expiring").map(c => c.client).join(", ")}.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "FAOL", value: activeCount, color: "#059669" },
              { label: "TUGAYAPTI", value: expiringCount, color: "#D97706" },
              { label: "TUGAGAN", value: expiredCount, color: "#C75D3C" },
              { label: "TUSHUM, M", value: fmt(totalRevenue / 1_000_000), color: "#C75D3C" },
            ].map((kpi, i) => (
              <Card key={i} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
                <FileText className="w-5 h-5 mb-3" style={{ color: kpi.color }} />
                <div className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: kpi.color }}>{kpi.label}</div>
                <div className="text-3xl font-light mt-2 tabular-nums text-[#1A1A1A]" style={SERIF}>{kpi.value}</div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: kpi.color, opacity: 0.4 }} />
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "active", "expiring", "expired", "draft"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-md text-xs font-medium ${statusFilter === s ? "text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D]"}`}
                style={statusFilter === s ? { background: "#C75D3C" } : undefined}
              >
                {s === "all" ? "Hammasi" : STATUS_LABEL[s]}
              </button>
            ))}
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="№ yoki klient..." className="pl-9 w-64 border-[#E8E0D3]" />
            </div>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tip</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Davr</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">To'lov shartlari</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Limit</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Status</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-24">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const daysLeft = daysUntil(c.endDate)
                    return (
                      <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-mono tabular-nums text-[#C75D3C]">{c.number}</td>
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{c.client}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[c.type]}`}>{TYPE_LABEL[c.type]}</span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <div className="font-mono tabular-nums text-[#1A1A1A]">{c.startDate}</div>
                          <div className="font-mono tabular-nums text-[#9C8A6E]">→ {c.endDate}</div>
                          {c.status === "active" && daysLeft > 0 && <div className={`text-[10px] mt-0.5 ${daysLeft < 90 ? "text-[#D97706]" : "text-[#9C8A6E]"}`}>{daysLeft} kun qoldi</div>}
                          {c.status === "expired" && <div className="text-[10px] mt-0.5 text-[#C75D3C]">tugagan</div>}
                        </td>
                        <td className="py-3 px-2 text-xs text-[#6B5B4D]">{c.paymentTerms}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums text-xs text-[#1A1A1A]">{c.totalValue > 0 ? fmt(c.totalValue / 1_000_000) + " M" : "—"}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700">{fmt(c.revenueGenerated / 1_000_000)} M</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1 text-[#6B5B4D] hover:bg-[#F0EAE0] rounded"><Eye className="w-4 h-4" /></button>
                            <button className="p-1 text-[#C75D3C] hover:bg-[#F5E5D6] rounded" title="PDF"><FileText className="w-4 h-4" /></button>
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
      </div>
    </AdminLayout>
  )
}
