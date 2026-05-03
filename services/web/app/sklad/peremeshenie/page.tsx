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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Peremesheniya <span className="italic text-[#C75D3C]">(transfers)</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Sklad orasidagi tovar harakati</p>
            </div>
            <Button size="lg" style={{ background: "#C75D3C" }}>
              <Plus className="w-5 h-5" /> Yangi peremeshanie
            </Button>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ID</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]" colSpan={3}>Yo'nalish</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK.map(m => (
                  <tr key={m.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-[#C75D3C]">{m.id}</td>
                    <td className="px-4 py-3 text-sm text-[#1A1A1A]">{m.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{m.from}</td>
                    <td className="px-2 py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-[#C75D3C] inline" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{m.to}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{m.items}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{m.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-[#FCE9DD] text-[#D97706]"
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
      </div>
    </AdminLayout>
  )
}
