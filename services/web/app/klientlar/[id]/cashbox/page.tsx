"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, TrendingUp, AlertCircle, Wallet, Download } from "lucide-react"
import Link from "next/link"

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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Klient kassa · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · To'lov va zakaz tarixi</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-5 bg-emerald-50 border-emerald-200">
            <ArrowDownLeft className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Kirim (To'lovlar)</div>
            <div className="text-2xl font-bold mt-1 font-mono">+{fmt(totalIn)}</div>
            <div className="text-xs text-slate-600 mt-1">{TRANSACTIONS.filter(t => t.type === "in").length} ta to'lov</div>
          </Card>
          <Card className="p-5 bg-rose-50 border-rose-200">
            <ArrowUpRight className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-rose-700">Chiqim (Zakazlar)</div>
            <div className="text-2xl font-bold mt-1 font-mono">−{fmt(totalOut)}</div>
            <div className="text-xs text-slate-600 mt-1">{TRANSACTIONS.filter(t => t.type === "out").length} ta zakaz</div>
          </Card>
          <Card className={`p-5 border-2 ${balance >= 0 ? "bg-blue-50 border-blue-300" : "bg-rose-50 border-rose-300"}`}>
            {balance >= 0 ? <Wallet className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" /> : <AlertCircle className="w-7 h-7 text-rose-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />}
            <div className={`text-xs font-bold ${balance >= 0 ? "text-blue-700" : "text-rose-700"}`}>Sальдо</div>
            <div className="text-2xl font-bold mt-1 font-mono">{balance >= 0 ? "+" : ""}{fmt(balance)}</div>
            <div className="text-xs text-slate-600 mt-1">{balance >= 0 ? "Avans" : "Qarz"}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Tranzaksiyalar (running balance)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Tip</th>
                  <th className="py-3 px-2">Tavsif</th>
                  <th className="py-3 px-2 text-right">Kirim</th>
                  <th className="py-3 px-2 text-right">Chiqim</th>
                  <th className="py-3 px-2 text-right">Sальдо</th>
                </tr>
              </thead>
              <tbody>
                {transactionsWithBalance.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono text-xs">{t.date}</td>
                    <td className="py-3 px-2">
                      {t.type === "in" ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">↓ Kirim</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">↑ Chiqim</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-semibold">{t.desc}</td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${t.type === "in" ? "text-emerald-700" : "text-slate-300"}`}>
                      {t.type === "in" ? "+" + fmt(t.sum) : "—"}
                    </td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${t.type === "out" ? "text-rose-700" : "text-slate-300"}`}>
                      {t.type === "out" ? "−" + fmt(t.sum) : "—"}
                    </td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${t.balance >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                      {t.balance >= 0 ? "+" : ""}{fmt(t.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
