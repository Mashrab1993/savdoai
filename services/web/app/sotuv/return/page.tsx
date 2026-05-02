"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Calendar, Download, RotateCcw, AlertTriangle } from "lucide-react"
import Link from "next/link"

type ReturnRow = {
  id: number; date: string; client: string; agent: string; orderRef: number;
  product: string; qty: number; sum: number;
  reason: "broken" | "expired" | "wrong" | "client_refused" | "other";
  status: "draft" | "approved" | "rejected" | "refunded";
}

const REASONS: Record<string, string> = {
  broken: "🔨 Buzuq",
  expired: "⏰ Muddati o'tgan",
  wrong: "⚠️ Noto'g'ri yetkazma",
  client_refused: "🙅 Klient rad etdi",
  other: "📝 Boshqa",
}
const REASON_COLOR: Record<string, string> = {
  broken: "bg-rose-100 text-rose-700",
  expired: "bg-amber-100 text-amber-700",
  wrong: "bg-orange-100 text-orange-700",
  client_refused: "bg-blue-100 text-blue-700",
  other: "bg-slate-100 text-slate-700",
}

const RETURNS: ReturnRow[] = [
  { id: 4001, date: "2026-05-02", client: "Salom Magazin №1", agent: "Babadjanova N.", orderRef: 9024, product: "Choco-Boom 75g (12 dona)", qty: 12, sum: 144_000, reason: "broken", status: "approved" },
  { id: 4002, date: "2026-04-30", client: "Bona Магазин", agent: "Berdiyev R.", orderRef: 9018, product: "Sok Apelsin 1L (6 dona)", qty: 6, sum: 84_000, reason: "expired", status: "refunded" },
  { id: 4003, date: "2026-04-28", client: "Дастархон Сервис", agent: "Sayitqulov M.", orderRef: 9012, product: "Coca-Cola 1.5L (4 dona)", qty: 4, sum: 64_000, reason: "wrong", status: "approved" },
  { id: 4004, date: "2026-04-26", client: "Гулямов Маркет", agent: "ДАВЛАТ", orderRef: 9006, product: "Bonjur 50g (24 dona)", qty: 24, sum: 96_000, reason: "client_refused", status: "draft" },
  { id: 4005, date: "2026-04-25", client: "Турсун Ake Магазин", agent: "BORIEV M.", orderRef: 9000, product: "Pechenye Yubileynoye (6 dona)", qty: 6, sum: 72_000, reason: "broken", status: "rejected" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ReturnPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = RETURNS
    .filter(r => statusFilter === "all" || r.status === statusFilter)
    .filter(r => !search || r.client.toLowerCase().includes(search.toLowerCase()) || String(r.id).includes(search))

  const totalSum = filtered.reduce((s, r) => s + r.sum, 0)
  const totalQty = filtered.reduce((s, r) => s + r.qty, 0)

  const byReason = Object.entries(REASONS).map(([key, label]) => ({
    key, label,
    count: RETURNS.filter(r => r.reason === key).length,
    sum: RETURNS.filter(r => r.reason === key).reduce((s, r) => s + r.sum, 0)
  }))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Возвраты (qaytarishlar)</h1>
            <p className="text-sm text-slate-500">{RETURNS.length} ta qaytarish · {fmt(totalSum)} so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi qaytarish</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {byReason.map(r => (
            <Card key={r.key} className="p-4">
              <div className="text-xs font-bold text-slate-600 mb-1">{r.label}</div>
              <div className="text-2xl font-bold font-mono">{r.count}</div>
              <div className="text-xs text-slate-500 mt-1">{fmt(r.sum / 1000)}k so'm</div>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["all", "draft", "approved", "rejected", "refunded"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 hover:bg-slate-50"}`}>
              {s === "all" ? "Hammasi" :
               s === "draft" ? "📝 Qoralama" :
               s === "approved" ? "✓ Tasdiqlangan" :
               s === "rejected" ? "✕ Rad etilgan" :
               "💰 To'langan"}
            </button>
          ))}
          <div className="ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient yoki #..." className="pl-9 w-64" />
          </div>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Klient / Agent</th>
                  <th className="py-3 px-2">Zakaz</th>
                  <th className="py-3 px-2">Tovar</th>
                  <th className="py-3 px-2 text-right">Miqdor</th>
                  <th className="py-3 px-2 text-right">Summa</th>
                  <th className="py-3 px-2 text-center">Sabab</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono text-blue-700">#{r.id}</td>
                    <td className="py-3 px-2 font-mono text-xs">{r.date}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold">{r.client}</div>
                      <div className="text-xs text-slate-500">{r.agent}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-slate-500">#{r.orderRef}</td>
                    <td className="py-3 px-2">{r.product}</td>
                    <td className="py-3 px-2 text-right font-mono">{r.qty}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">−{fmt(r.sum)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${REASON_COLOR[r.reason]}`}>{REASONS[r.reason]}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {r.status === "draft" && <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">📝 Qoralama</span>}
                      {r.status === "approved" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Tasdiq</span>}
                      {r.status === "rejected" && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">✕ Rad</span>}
                      {r.status === "refunded" && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">💰 To'langan</span>}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="py-3 px-2 text-right">Итого:</td>
                  <td className="py-3 px-2 text-right font-mono">{totalQty}</td>
                  <td className="py-3 px-2 text-right font-mono text-rose-700">−{fmt(totalSum)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-800">Qaytarish darajasi</h3>
              <p className="text-sm text-slate-700 mt-1">
                Hozirgi kunda <span className="font-mono font-bold">{RETURNS.length}</span> ta qaytarish ro'yxatga olindi.
                Eng ko'p sabab: <span className="font-bold">{byReason.sort((a, b) => b.count - a.count)[0].label}</span>.
                Tavsiya: yetkazib berishda sifat nazoratini kuchaytirish.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
