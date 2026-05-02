"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DollarSign, Calendar, Download, TrendingUp, FileText, Send } from "lucide-react"
import Link from "next/link"

type Payroll = {
  id: number; agent: string; role: string;
  basePay: number;
  commission: number; commissionPct: number; revenue: number;
  bonuses: number; deductions: number;
  hoursWorked: number; visitsCompleted: number;
  netPay: number;
  status: "calculated" | "paid";
  paidDate?: string;
}

const PAYROLLS: Payroll[] = [
  { id: 1, agent: "Babadjanova Nargiza", role: "Senior Agent", basePay: 4_000_000, commission: 2_840_000, commissionPct: 10, revenue: 28_400_000, bonuses: 800_000, deductions: 200_000, hoursWorked: 168, visitsCompleted: 218, netPay: 7_440_000, status: "paid", paidDate: "2026-05-01" },
  { id: 2, agent: "BORIEV MIRJALOL", role: "Senior Agent", basePay: 4_000_000, commission: 3_640_000, commissionPct: 10, revenue: 36_400_000, bonuses: 1_000_000, deductions: 0, hoursWorked: 184, visitsCompleted: 248, netPay: 8_640_000, status: "paid", paidDate: "2026-05-01" },
  { id: 3, agent: "Berdiyev Rahmatillo", role: "Agent", basePay: 3_500_000, commission: 1_984_000, commissionPct: 8, revenue: 24_800_000, bonuses: 400_000, deductions: 100_000, hoursWorked: 168, visitsCompleted: 192, netPay: 5_784_000, status: "paid", paidDate: "2026-05-01" },
  { id: 4, agent: "ДАВЛАТ", role: "Agent", basePay: 3_500_000, commission: 2_496_000, commissionPct: 8, revenue: 31_200_000, bonuses: 600_000, deductions: 0, hoursWorked: 176, visitsCompleted: 248, netPay: 6_596_000, status: "paid", paidDate: "2026-05-01" },
  { id: 5, agent: "Sayitqulov Mashrab", role: "Agent", basePay: 3_500_000, commission: 896_000, commissionPct: 8, revenue: 11_200_000, bonuses: 200_000, deductions: 0, hoursWorked: 88, visitsCompleted: 84, netPay: 4_596_000, status: "calculated" },
  { id: 6, agent: "Турсунов Жамшед", role: "Agent (yangi)", basePay: 3_000_000, commission: 1_184_000, commissionPct: 8, revenue: 14_800_000, bonuses: 0, deductions: 300_000, hoursWorked: 112, visitsCompleted: 96, netPay: 3_884_000, status: "calculated" },
  { id: 7, agent: "Aminov R.", role: "Ekspeditor", basePay: 2_500_000, commission: 280_000, commissionPct: 0, revenue: 0, bonuses: 200_000, deductions: 0, hoursWorked: 168, visitsCompleted: 0, netPay: 2_980_000, status: "calculated" },
  { id: 8, agent: "Karimov F.", role: "Ekspeditor", basePay: 2_500_000, commission: 240_000, commissionPct: 0, revenue: 0, bonuses: 100_000, deductions: 0, hoursWorked: 168, visitsCompleted: 0, netPay: 2_840_000, status: "calculated" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function PayrollPage() {
  const totalPayroll = PAYROLLS.reduce((s, p) => s + p.netPay, 0)
  const paidCount = PAYROLLS.filter(p => p.status === "paid").length
  const pendingCount = PAYROLLS.filter(p => p.status === "calculated").length
  const totalCommission = PAYROLLS.reduce((s, p) => s + p.commission, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Ish haqi (Aprel 2026)</h1>
            <p className="text-sm text-slate-500">{PAYROLLS.length} ta xodim · jami {fmt(totalPayroll / 1_000_000)} M so'm · {paidCount} to'langan</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Aprel 2026</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-1"><Send className="w-4 h-4" /> Hammasini to'lash</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami ish haqi</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalPayroll / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Komissiya jami</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalCommission / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <FileText className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">To'langan</div>
            <div className="text-2xl font-bold mt-1">{paidCount} / {PAYROLLS.length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <FileText className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">To'lanmagan</div>
            <div className="text-2xl font-bold mt-1">{pendingCount}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Xodimlar bo'yicha</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Xodim</th>
                  <th className="py-3 px-2 text-right">Asos</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2 text-right">Komissiya</th>
                  <th className="py-3 px-2 text-right">Bonus</th>
                  <th className="py-3 px-2 text-right">Ushlab qolish</th>
                  <th className="py-3 px-2 text-right">Soat / Vizit</th>
                  <th className="py-3 px-2 text-right">JAMI</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {PAYROLLS.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-semibold">{p.agent}</div>
                      <div className="text-xs text-slate-500">{p.role}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(p.basePay / 1000)}k</td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-slate-500">{p.revenue > 0 ? fmt(p.revenue / 1_000_000) + "M" : "—"}</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700">+{fmt(p.commission / 1000)}k <span className="text-xs text-slate-400">({p.commissionPct}%)</span></td>
                    <td className="py-3 px-2 text-right font-mono text-blue-700">{p.bonuses > 0 ? "+" + fmt(p.bonuses / 1000) + "k" : "—"}</td>
                    <td className="py-3 px-2 text-right font-mono text-rose-700">{p.deductions > 0 ? "−" + fmt(p.deductions / 1000) + "k" : "—"}</td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{p.hoursWorked}h / {p.visitsCompleted}v</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700 text-base">{fmt(p.netPay)}</td>
                    <td className="py-3 px-2 text-center">
                      {p.status === "paid"
                        ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ {p.paidDate}</span>
                        : <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⏳ Hisoblandi</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {p.status === "calculated" && <Button size="sm" className="h-7 text-xs">To'lash</Button>}
                      {p.status === "paid" && <Button size="sm" variant="outline" className="h-7 text-xs">Slip</Button>}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={7} className="py-3 px-2 text-right">JAMI:</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-700 text-base">{fmt(totalPayroll)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
