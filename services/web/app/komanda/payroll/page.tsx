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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Ish haqi <span className="italic text-[#C75D3C]">Aprel 2026</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{PAYROLLS.length} ta xodim · jami {fmt(totalPayroll / 1_000_000)} M so'm · {paidCount} to'langan</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Aprel 2026</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Send className="w-4 h-4" /> Hammasini to'lash</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <DollarSign className="w-5 h-5 text-emerald-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami ish haqi</div>
              <div className="text-3xl font-light mt-1 font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalPayroll / 1_000_000)} M</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <TrendingUp className="w-5 h-5 text-blue-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Komissiya jami</div>
              <div className="text-3xl font-light mt-1 font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalCommission / 1_000_000)} M</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <FileText className="w-5 h-5 text-purple-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">To'langan</div>
              <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{paidCount} / {PAYROLLS.length}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <FileText className="w-5 h-5 text-[#D97706] mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">To'lanmagan</div>
              <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{pendingCount}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706]" />
            </Card>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Xodimlar bo'yicha</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Xodim</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Asos</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Komissiya</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bonus</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ushlab qolish</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Soat / Vizit</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-center w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {PAYROLLS.map(p => (
                    <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#1A1A1A]">{p.agent}</div>
                        <div className="text-xs text-[#9C8A6E]">{p.role}</div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#1A1A1A]">{fmt(p.basePay / 1000)}k</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-xs text-[#9C8A6E]">{p.revenue > 0 ? fmt(p.revenue / 1_000_000) + "M" : "—"}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700">+{fmt(p.commission / 1000)}k <span className="text-xs text-[#9C8A6E]">({p.commissionPct}%)</span></td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-blue-700">{p.bonuses > 0 ? "+" + fmt(p.bonuses / 1000) + "k" : "—"}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-[#C75D3C]">{p.deductions > 0 ? "−" + fmt(p.deductions / 1000) + "k" : "—"}</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-xs text-[#6B5B4D]">{p.hoursWorked}h / {p.visitsCompleted}v</td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums font-medium text-emerald-700 text-base" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(p.netPay)}</td>
                      <td className="py-3 px-2 text-center">
                        {p.status === "paid"
                          ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{p.paidDate}</span>
                          : <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#D97706]">Hisoblandi</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {p.status === "calculated" && <Button size="sm" className="h-7 text-xs text-white" style={{ background: "#C75D3C" }}>To'lash</Button>}
                        {p.status === "paid" && <Button size="sm" variant="outline" className="h-7 text-xs border-[#E8E0D3] text-[#6B5B4D]">Slip</Button>}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t border-[#E8E0D3]">
                    <td colSpan={7} className="py-3 px-2 text-right text-[#1A1A1A] uppercase tracking-wider text-xs">Jami:</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-emerald-700 text-lg" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalPayroll)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
