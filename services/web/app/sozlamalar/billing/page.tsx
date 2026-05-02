"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, Check, Crown, Calendar, Download, AlertCircle } from "lucide-react"
import Link from "next/link"

const PLANS = [
  { name: "Boshlang'ich (Starter)", priceMonthly: 0, priceYearly: 0,
    features: ["1 agent", "100 klientgacha", "Asosiy hisobotlar", "Telegram bot"],
    color: "slate", current: false },
  { name: "Biznes (Business)", priceMonthly: 990_000, priceYearly: 9_900_000,
    features: ["10 agentgacha", "1 000 klientgacha", "Barcha hisobotlar", "AI Copilot", "Anomaliya detektor", "Email/SMS"],
    color: "emerald", current: true },
  { name: "Pro (Enterprise)", priceMonthly: 2_490_000, priceYearly: 24_900_000,
    features: ["Cheksiz agent", "Cheksiz klient", "4 ta dunyoda yagona AI", "Custom integratsiya", "Priority support", "SLA 99.9%"],
    color: "amber", current: false },
]

const INVOICES = [
  { id: 1, date: "2026-04-01", description: "Biznes plan — Aprel 2026", amount: 990_000, status: "paid" as const },
  { id: 2, date: "2026-03-01", description: "Biznes plan — Mart 2026", amount: 990_000, status: "paid" as const },
  { id: 3, date: "2026-02-01", description: "Biznes plan — Fevral 2026", amount: 990_000, status: "paid" as const },
  { id: 4, date: "2026-01-01", description: "Biznes plan — Yanvar 2026", amount: 990_000, status: "paid" as const },
  { id: 5, date: "2025-12-01", description: "Boshlang'ich → Biznes plan", amount: 990_000, status: "paid" as const },
]

const USAGE = [
  { metric: "Agentlar", used: 6, limit: 10, unit: "ta" },
  { metric: "Klientlar", used: 624, limit: 1000, unit: "ta" },
  { metric: "Storage", used: 2.4, limit: 10, unit: "GB" },
  { metric: "API qo'ng'iroqlari", used: 24800, limit: 100000, unit: "/oy" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function BillingPage() {
  const totalSpent = INVOICES.reduce((s, i) => s + i.amount, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-emerald-600" />
              Billing va obuna
            </h1>
            <p className="text-sm text-slate-500">Joriy plan: Biznes · keyingi to'lov 01.06.2026 · jami sarflangan {fmt(totalSpent / 1_000_000)} M</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Hisob-faktura</Button>
        </div>

        <Card className="p-5 bg-emerald-50 border-emerald-300 border-2">
          <div className="flex items-center gap-4">
            <Crown className="w-12 h-12 text-emerald-600" />
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-700 mb-1">JORIY PLAN</div>
              <h2 className="text-2xl font-bold">Biznes (Business)</h2>
              <p className="text-sm text-slate-600 mt-1">990 000 so'm/oy · keyingi to'lov 01.06.2026</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Plan o'zgartirish</Button>
              <Button>Yillik to'lov (-15%)</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {USAGE.map(u => {
            const pct = Math.round((u.used / u.limit) * 100)
            return (
              <Card key={u.metric} className="p-4">
                <div className="text-xs font-bold text-slate-600">{u.metric}</div>
                <div className="text-2xl font-bold mt-1 font-mono">{u.used} <span className="text-sm text-slate-500">/ {u.limit}</span></div>
                <div className="text-xs text-slate-500">{u.unit}</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs mt-1 text-slate-500">{pct}% ishlatildi</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Mavjud planlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map(p => (
              <Card key={p.name} className={`p-5 border-2 ${
                p.current ? "border-emerald-500 bg-emerald-50" :
                p.color === "amber" ? "border-amber-300" :
                "border-slate-200"
              }`}>
                {p.current && (
                  <div className="text-xs font-bold text-emerald-700 mb-2">⭐ JORIY PLAN</div>
                )}
                {p.color === "amber" && !p.current && (
                  <div className="text-xs font-bold text-amber-700 mb-2">🔥 RECOMMENDED</div>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="my-3">
                  {p.priceMonthly === 0 ? (
                    <div className="text-3xl font-bold">Bepul</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold font-mono">{fmt(p.priceMonthly / 1000)}k <span className="text-sm text-slate-500 font-normal">so'm/oy</span></div>
                      <div className="text-xs text-slate-500 mt-1">yoki {fmt(p.priceYearly / 1_000_000)}M/yil (-15%)</div>
                    </>
                  )}
                </div>
                <ul className="space-y-1.5 mt-4 mb-4">
                  {p.features.map(f => (
                    <li key={f} className="text-sm flex items-start gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={p.current ? "outline" : "default"} disabled={p.current}>
                  {p.current ? "Joriy plan" : "Tanlash"}
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> To'lov tarixi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2">Tavsif</th>
                  <th className="py-3 px-2 text-right">Summa</th>
                  <th className="py-3 px-2 text-center">Holat</th>
                  <th className="py-3 px-2 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono text-xs">{inv.date}</td>
                    <td className="py-3 px-2 font-semibold">{inv.description}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold">{fmt(inv.amount)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ To'langan</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <Download className="w-3 h-3" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-800">Yillik to'lov bilan tejang!</h3>
              <p className="text-sm text-slate-700 mt-1">
                Joriy oylik to'lov: 990k × 12 = 11.88M so'm/yil.
                Yillik to'lov bilan: 9.9M so'm/yil. Tejov: <span className="font-bold text-emerald-700">1.98M so'm</span> (15% chegirma).
              </p>
              <Button className="mt-3">Yillik to'lovga o'tish</Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
