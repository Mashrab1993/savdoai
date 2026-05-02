"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RotateCcw, ArrowDownLeft, ArrowUpRight, Plus, Search, AlertCircle, CheckCircle2 } from "lucide-react"
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
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Kutilmoqda", icon: AlertCircle },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Tasdiqlandi", icon: CheckCircle2 },
  rejected: { bg: "bg-rose-100", text: "text-rose-700", label: "Rad etildi", icon: AlertCircle },
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
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Qaytarishlar</h1>
            <p className="text-base text-slate-500 mt-1">Klientdan + Postavshikga · {RETURNS.length} ta operatsiya · Aprel-May 2026</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi qaytarish</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <ArrowDownLeft className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Klientdan</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{fromClient.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{fmt(fromClientSum)} so'm</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <ArrowUpRight className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Postavshikga</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{toSupplier.length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{fmt(toSupplierSum)} so'm</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Tasdiqlangan</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{RETURNS.filter(r => r.status === "approved").length}</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <AlertCircle className="w-7 h-7 text-amber-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-amber-700">Kutilmoqda</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{RETURNS.filter(r => r.status === "pending").length}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qaytarish # yoki klient..." className="pl-9" />
            </div>
            <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
              {([
                { k: "all", l: "Hammasi" },
                { k: "from_client", l: "↓ Klientdan" },
                { k: "to_supplier", l: "↑ Postavshikga" },
              ] as const).map(t => (
                <button key={t.k} onClick={() => setDirection(t.k)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${direction === t.k ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {t.l}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Yo'nalish</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Manba</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sabab</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Summa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Agent</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const cfg = STATUS_CFG[r.status]
                  const Icon = cfg.icon
                  const isFromClient = r.direction === "from_client"
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-400 font-mono">#{r.id}</td>
                      <td className="py-3 px-2 text-slate-700 font-mono text-xs">{r.date}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${isFromClient ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                          {isFromClient ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isFromClient ? "Klientdan" : "Postavshikga"}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-900">{r.from}</td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{r.reason}</td>
                      <td className="py-3 px-2 text-right font-mono">{r.items} pos.</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold ${isFromClient ? "text-blue-700" : "text-violet-700"}`}>
                        {fmt(r.sum)}
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{r.agent}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
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
    </AdminLayout>
  )
}
