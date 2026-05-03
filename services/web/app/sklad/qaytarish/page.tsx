"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Plus, Search, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const RETURNS = [
  { id: 2024, date: "2026-05-01", direction: "from_client", from: "Asia Optom", reason: "Brak (ekspiratsiya)", items: 4, sum: 248_000, agent: "Nurmatov A.", status: "approved" },
  { id: 2018, date: "2026-04-28", direction: "from_client", from: "Lider Chakana", reason: "Klient rad etdi", items: 6, sum: 384_000, agent: "Karimov S.", status: "approved" },
  { id: 2012, date: "2026-04-25", direction: "to_supplier", from: "→ Sladkiy Mir LLC", reason: "Brak (qadoq buzuq)", items: 24, sum: 1_840_000, agent: "Mashrab S.", status: "pending" },
  { id: 2008, date: "2026-04-22", direction: "from_client", from: "Globus Plus", reason: "Notog'ri tovar", items: 3, sum: 184_000, agent: "Nurmatov A.", status: "approved" },
  { id: 2002, date: "2026-04-18", direction: "to_supplier", from: "→ Bonjur Distribution", reason: "Brak", items: 18, sum: 1_204_000, agent: "Mashrab S.", status: "approved" },
  { id: 1996, date: "2026-04-15", direction: "from_client", from: "Mega Market", reason: "Klient kerak emas", items: 8, sum: 624_000, agent: "Yusupov D.", status: "rejected" },
]

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  pending: { bg: "bg-[#FCE9DD]", text: "text-[#D97706]", label: "Kutilmoqda", icon: AlertCircle },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Tasdiqlandi", icon: CheckCircle2 },
  rejected: { bg: "bg-[#F5E5D6]", text: "text-[#C75D3C]", label: "Rad etildi", icon: AlertCircle },
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function QaytarishPage() {
  const [search, setSearch] = useState("")
  const [direction, setDirection] = useState<"all" | "from_client" | "to_supplier">("all")

  const filtered = RETURNS.filter(r => {
    const matchSearch = !search || String(r.id).includes(search) || r.from.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase())
    const matchDir = direction === "all" || r.direction === direction
    return matchSearch && matchDir
  })

  const fromClient = RETURNS.filter(r => r.direction === "from_client")
  const toSupplier = RETURNS.filter(r => r.direction === "to_supplier")
  const fromClientSum = fromClient.reduce((s, r) => s + r.sum, 0)
  const toSupplierSum = toSupplier.reduce((s, r) => s + r.sum, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Qaytarishlar
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Klientdan + Postavshikga · {RETURNS.length} ta operatsiya · Aprel-May 2026</p>
            </div>
            <Button className="gap-2" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi qaytarish</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiBig icon={ArrowDownLeft} accent="#3B82F6" label="Klientdan" value={fromClient.length.toString()} sub={`${fmt(fromClientSum)} so'm`} />
            <KpiBig icon={ArrowUpRight} accent="#7C3AED" label="Postavshikga" value={toSupplier.length.toString()} sub={`${fmt(toSupplierSum)} so'm`} />
            <KpiBig icon={CheckCircle2} accent="#10B981" label="Tasdiqlangan" value={RETURNS.filter(r => r.status === "approved").length.toString()} sub="status: approved" />
            <KpiBig icon={AlertCircle} accent="#D97706" label="Kutilmoqda" value={RETURNS.filter(r => r.status === "pending").length.toString()} sub="ko'rib chiqish" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qaytarish # yoki klient..." className="pl-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <div className="flex gap-1 border border-[#E8E0D3] rounded-lg p-1 bg-[#FAF7F2]">
                {([
                  { k: "all", l: "Hammasi" },
                  { k: "from_client", l: "↓ Klientdan" },
                  { k: "to_supplier", l: "↑ Postavshikga" },
                ] as const).map(t => (
                  <button key={t.k} onClick={() => setDirection(t.k)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${direction === t.k ? "bg-[#C75D3C] text-white" : "text-[#6B5B4D] hover:bg-white"}`}>
                    {t.l}
                  </button>
                ))}
              </div>
              <span className="text-sm text-[#9C8A6E]">{filtered.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">№</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Yo'nalish</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Manba</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sabab</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const cfg = STATUS_CFG[r.status]
                    const Icon = cfg.icon
                    const isFromClient = r.direction === "from_client"
                    return (
                      <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 text-[#9C8A6E] font-mono">#{r.id}</td>
                        <td className="py-3 px-2 text-[#6B5B4D] font-mono text-xs">{r.date}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isFromClient ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                            {isFromClient ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isFromClient ? "Klientdan" : "Postavshikga"}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.from}</td>
                        <td className="py-3 px-2 text-[#6B5B4D] text-xs">{r.reason}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{r.items} pos.</td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${isFromClient ? "text-blue-700" : "text-purple-700"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {fmt(r.sum)}
                        </td>
                        <td className="py-3 px-2 text-[#6B5B4D] text-xs">{r.agent}</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
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

function KpiBig({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-7 h-7 mb-3" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
