"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

const MOCK = [
  { id: "p_001", date: "2026-05-02 09:30", from: "Asosiy", to: "Химия sklad", items: 12, total: 480_000, status: "completed" },
  { id: "p_002", date: "2026-05-01 16:00", from: "Asosiy", to: "VS sklad", items: 8, total: 320_000, status: "completed" },
  { id: "p_003", date: "2026-05-01 14:00", from: "Возврат", to: "Asosiy", items: 3, total: 96_000, status: "in_transit" },
]

export default function PeremesheniePage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/sklad" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Sklad
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🔄 Peremesheniya (Inter-warehouse transfers)</h1>
            <p className="text-base text-slate-500 mt-1">Sklad orasidagi tovar harakati</p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi peremeshanie
          </Button>
        </div>

        <Card>
          <table className="w-full">
            <thead className="border-b-2 border-slate-200 bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Sana</th>
                <th className="text-left px-4 py-3 text-sm font-semibold" colSpan={3}>Yo'nalish</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Tovar</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Summa</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-emerald-700">{m.id}</td>
                  <td className="px-4 py-3 text-sm">{m.date}</td>
                  <td className="px-4 py-3 text-sm font-medium">{m.from}</td>
                  <td className="px-2 py-3 text-center">
                    <ArrowRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{m.to}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.items}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{m.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      m.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {m.status === "completed" ? "Bajarildi" : "Yo'lda"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  )
}
