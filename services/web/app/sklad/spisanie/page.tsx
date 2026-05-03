"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

const MOCK = [
  { id: "s_001", date: "2026-05-02", reason: "Brak", warehouse: "Asosiy", items: 5, total: 125_000, status: "approved" },
  { id: "s_002", date: "2026-05-01", reason: "Yaroqlilik tugagan", warehouse: "Химия", items: 12, total: 540_000, status: "approved" },
  { id: "s_003", date: "2026-04-30", reason: "O'g'irlik", warehouse: "Asosiy", items: 3, total: 88_000, status: "pending" },
  { id: "s_004", date: "2026-04-28", reason: "Inventarizatsiya farqi", warehouse: "VS", items: 8, total: 312_000, status: "approved" },
]

export default function SpisaniePage() {
  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Spisanie
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Hisobdan chiqarish · {MOCK.length} hujjat · <span className="text-[#C75D3C] font-medium tabular-nums">{MOCK.reduce((s, x) => s + x.total, 0).toLocaleString()} so'm</span> zarar</p>
            </div>
            <Button size="lg" style={{ background: "#C75D3C" }}>
              <Plus className="w-5 h-5" /> Yangi spisanie
            </Button>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ID</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sabab</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sklad</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Zarar</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK.map(s => (
                  <tr key={s.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-[#C75D3C]">{s.id}</td>
                    <td className="px-4 py-3 text-sm text-[#1A1A1A]">{s.date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.reason === "Brak" ? "bg-[#F5E5D6] text-[#C75D3C]" :
                        s.reason === "O'g'irlik" ? "bg-purple-50 text-purple-700" :
                        "bg-[#FCE9DD] text-[#D97706]"
                      }`}>{s.reason}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B5B4D]">{s.warehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{s.items}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{s.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-[#FCE9DD] text-[#D97706]"
                      }`}>{s.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[#E8E0D3] bg-[#FCE9DD]/40">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami zarar:</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xl font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {MOCK.reduce((s, x) => s + x.total, 0).toLocaleString()} so'm
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
