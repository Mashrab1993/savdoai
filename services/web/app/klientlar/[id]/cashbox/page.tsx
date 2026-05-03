"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, TrendingUp, AlertCircle, Wallet, Download } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

const TRANSACTIONS = [
  { id: 1, date: "2026-05-02", type: "in", desc: "To'lov #5012 (Click)", sum: 2_400_000 },
  { id: 2, date: "2026-04-30", type: "out", desc: "Zakaz #1024 (yetkazib berildi)", sum: 1_240_000 },
  { id: 3, date: "2026-04-28", type: "in", desc: "To'lov #5008 (Naqd)", sum: 1_240_000 },
  { id: 4, date: "2026-04-28", type: "out", desc: "Zakaz #1018", sum: 2_840_000 },
  { id: 5, date: "2026-04-25", type: "in", desc: "To'lov #5004 (Payme)", sum: 3_840_000 },
  { id: 6, date: "2026-04-25", type: "out", desc: "Zakaz #1012", sum: 1_580_000 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientCashboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const totalIn = TRANSACTIONS.filter(t => t.type === "in").reduce((s, t) => s + t.sum, 0)
  const totalOut = TRANSACTIONS.filter(t => t.type === "out").reduce((s, t) => s + t.sum, 0)
  const balance = totalIn - totalOut
  let runningBalance = 0
  const transactionsWithBalance = TRANSACTIONS.slice().reverse().map(t => {
    runningBalance += t.type === "in" ? t.sum : -t.sum
    return { ...t, balance: runningBalance }
  }).reverse()

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient kassa <span className="italic text-[#C75D3C]">va saldosi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · To'lov va zakaz tarixi</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ArrowDownLeft className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Kirim (To'lovlar)</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>+{fmt(totalIn)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{TRANSACTIONS.filter(t => t.type === "in").length} ta to'lov</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <ArrowUpRight className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Chiqim (Zakazlar)</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>−{fmt(totalOut)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{TRANSACTIONS.filter(t => t.type === "out").length} ta zakaz</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              {balance >= 0
                ? <Wallet className="w-5 h-5 mb-2" style={{ color: "#1D4ED8" }} />
                : <AlertCircle className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />}
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: balance >= 0 ? "#1D4ED8" : "#C75D3C" }}>Saldo</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{balance >= 0 ? "+" : ""}{fmt(balance)}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">{balance >= 0 ? "Avans" : "Qarz"}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: balance >= 0 ? "#3B82F6" : "#C75D3C" }} />
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: "#047857" }} />
              <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>Tranzaksiyalar <span className="italic text-[#C75D3C]">running balance</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tip</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tavsif</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kirim</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Chiqim</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsWithBalance.map(t => (
                    <tr key={t.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{t.date}</td>
                      <td className="py-3 px-2">
                        {t.type === "in" ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Kirim</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C]">Chiqim</span>
                        )}
                      </td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{t.desc}</td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${t.type === "in" ? "text-emerald-700" : "text-[#E8E0D3]"}`}>
                        {t.type === "in" ? "+" + fmt(t.sum) : "—"}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${t.type === "out" ? "text-[#C75D3C]" : "text-[#E8E0D3]"}`}>
                        {t.type === "out" ? "−" + fmt(t.sum) : "—"}
                      </td>
                      <td className={`py-3 px-2 text-right font-mono tabular-nums font-medium ${t.balance >= 0 ? "text-[#1D4ED8]" : "text-[#C75D3C]"}`} style={SERIF}>
                        {t.balance >= 0 ? "+" : ""}{fmt(t.balance)}
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
