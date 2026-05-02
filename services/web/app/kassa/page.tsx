"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  Wallet, FileText, ArrowRightLeft, Users, Building2, Banknote,
  TrendingUp, AlertCircle, RotateCcw, Receipt, CreditCard, Layers
} from "lucide-react"

const SECTIONS = [
  {
    title: "Klientlar bilan hisob-kitoblar",
    color: "emerald",
    items: [
      { slug: "akt-sverki", icon: FileText, title: "Akt sverki", desc: "Klient bilan akt-sverki" },
      { slug: "oplata", icon: Wallet, title: "Klient to'lovlari", desc: "102+ to'lov" },
      { slug: "akt-territory", icon: FileText, title: "Akt sverki (territory)", desc: "Hududlar bo'yicha" },
      { slug: "obroty", icon: TrendingUp, title: "Umumiy aylanma", desc: "12 oycha" },
      { slug: "init-balans-klient", icon: Wallet, title: "Boshlang'ich balans (klient)", desc: "Initial balance" },
      { slug: "saldo-klient", icon: Banknote, title: "Klient saldoси", desc: "Real-time balance" },
      { slug: "qarz-zakaz", icon: AlertCircle, title: "Zakaz bo'yicha qarz", desc: "Per-order debt" },
      { slug: "aging", icon: AlertCircle, title: "Aging analysis", desc: "0-7/8-15/16-30/31-50/51-90/90+" },
      { slug: "kassa-pivot", icon: Layers, title: "Kassa pivot hisoboti", desc: "Pivot table" },
    ],
  },
  {
    title: "Postavshiklar bilan hisob-kitoblar",
    color: "blue",
    items: [
      { slug: "postavshiklar", icon: Building2, title: "Postavshiklar", desc: "78 postavshik" },
      { slug: "oplata-postavshik", icon: Wallet, title: "Postavshik to'lovlari", desc: "Payments to suppliers" },
      { slug: "obroty-postavshik", icon: TrendingUp, title: "Postavshik aylanmasi", desc: "Total turnover" },
      { slug: "akt-postavshik", icon: FileText, title: "Akt sverki postavshik", desc: "Reconciliation" },
      { slug: "init-balans-postavshik", icon: Wallet, title: "Postavshik boshlang'ich balans", desc: "Initial balance" },
    ],
  },
  {
    title: "Boshqa moliyaviy operatsiyalar",
    color: "amber",
    items: [
      { slug: "xarajat", icon: Receipt, title: "Xarajatlar", desc: "Multi-currency, PNL flag" },
      { slug: "cashflow", icon: ArrowRightLeft, title: "Pul oqimi", desc: "Cash flow report" },
      { slug: "kassalar", icon: Wallet, title: "Kassalar", desc: "Cash registers" },
      { slug: "stati-fondy", icon: FileText, title: "Maqola va Fondlar", desc: "Articles & Funds (hierarchy)" },
      { slug: "subkategoriya", icon: CreditCard, title: "Subkategoriya to'lov", desc: "Payment subcategory" },
    ],
  },
]

export default function KassaPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kassa</h1>
          <p className="text-base text-slate-500 mt-1">19 ta moliyaviy hisobot · 3 oqim: Klient/Postavshik/Boshqa</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(s => {
            const colors = {
              emerald: "border-emerald-300 bg-emerald-50/30",
              blue: "border-blue-300 bg-blue-50/30",
              amber: "border-amber-300 bg-amber-50/30",
            }[s.color]
            return (
              <div key={s.title}>
                <h2 className="text-lg font-semibold mb-3">{s.title} <span className="text-sm font-normal text-slate-400">({s.items.length})</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {s.items.map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.slug} href={`/kassa/${item.slug}`}>
                        <Card className={`p-4 hover:shadow-md transition-all cursor-pointer h-full group border-2 ${colors}`}>
                          <Icon className="w-7 h-7 mb-2 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                          <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{item.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
