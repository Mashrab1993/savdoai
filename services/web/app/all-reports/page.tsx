"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { BarChart3, FileText, TrendingUp, Users, Package, DollarSign, ShoppingCart, MapPin, Award, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

const REPORT_CATEGORIES = [
  {
    label: "Sotuv hisobotlari",
    items: [
      { href: "/reports", label: "Kunlik/Haftalik/Oylik", icon: BarChart3 },
      { href: "/reports/sales-detail", label: "Sotuv detallari", icon: FileText },
      { href: "/reports/sales-detail", label: "Tovar bo'yicha", icon: Package },
      { href: "/orders", label: "Buyurtmalar reestri", icon: ShoppingCart },
    ],
  },
  {
    label: "Mijoz hisobotlari",
    items: [
      { href: "/reports/rfm", label: "RFM tahlil", icon: TrendingUp },
      { href: "/klient360", label: "Klient 360°", icon: Users },
      { href: "/sverka", label: "Akt sverka", icon: FileText },
      { href: "/clients", label: "Klient ro'yxati", icon: Users },
    ],
  },
  {
    label: "Moliyaviy hisobotlar",
    items: [
      { href: "/moliya", label: "P&L (Foyda/Zarar)", icon: DollarSign },
      { href: "/moliya", label: "Cash Flow", icon: TrendingUp },
      { href: "/moliya", label: "Balans", icon: BarChart3 },
      { href: "/debts", label: "Qarzlar", icon: DollarSign },
    ],
  },
  {
    label: "Agent hisobotlari",
    items: [
      { href: "/reports", label: "Agent bo'yicha sotuv", icon: Users },
      { href: "/reports", label: "Vizit hisoboti", icon: MapPin },
      { href: "/reports", label: "Ish vaqti", icon: Clock },
      { href: "/leaderboard", label: "Leaderboard", icon: Award },
    ],
  },
  {
    label: "Ombor hisobotlari",
    items: [
      { href: "/material-report", label: "Material hisoboti", icon: Package },
      { href: "/ombor", label: "Zaxira prognozi", icon: TrendingUp },
      { href: "/inventory", label: "Inventarizatsiya", icon: Package },
      { href: "/reports", label: "Foyda hisoboti", icon: DollarSign },
    ],
  },
  {
    label: "Bonus va aksiya",
    items: [
      { href: "/bonuses", label: "Bonus tahlili", icon: Award },
      { href: "/aksiya", label: "Aksiya samarasi", icon: TrendingUp },
      { href: "/reports", label: "Chegirma tafsilot", icon: BarChart3 },
    ],
  },
]

export default function AllReportsPage() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Barcha hisobotlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">25+ turdagi hisobot va tahlil</p>
        </div>

        {REPORT_CATEGORIES.map((cat, ci) => (
          <div key={ci}>
            <h2 className="text-lg font-bold mb-3">{cat.label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cat.items.map((item, i) => (
                <Link key={i} href={item.href} className="bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-md hover:border-emerald-300 transition group">
                  <div className="flex items-center justify-between mb-2">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition" />
                  </div>
                  <div className="text-sm font-medium">{item.label}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
