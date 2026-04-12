"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Sparkles, Zap, BarChart3, Users, Package, MessageSquare, ArrowRight, Crown } from "lucide-react"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-10 h-10" />
            <div>
              <div className="text-3xl font-bold">SavdoAI ga xush kelibsiz!</div>
              <div className="text-emerald-100 mt-1">SalesDoc'dan ham zo'r — barcha funksiyalar bir joyda</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Sahifalar", value: "97+", icon: Package },
            { label: "API endpoints", value: "100+", icon: Zap },
            { label: "Modullar", value: "23", icon: BarChart3 },
            { label: "Xodimlar", value: "9 rol", icon: Users },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <s.icon className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xl font-bold mb-4">Tezkor boshlash</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: "/dashboard", label: "Bosh dashboard", desc: "Asosiy ko'rsatkichlar", icon: BarChart3 },
              { href: "/products", label: "Tovarlar", desc: "Tovar bazasi va narxlar", icon: Package },
              { href: "/clients", label: "Mijozlar", desc: "Mijozlar bazasi", icon: Users },
              { href: "/sales", label: "Sotuv", desc: "Yangi sotuv qilish", icon: Zap },
              { href: "/orders", label: "Buyurtmalar", desc: "Mijoz buyurtmalari", icon: Package },
              { href: "/reports", label: "Hisobotlar", desc: "Sotuv va moliya hisobotlari", icon: BarChart3 },
              { href: "/ombor", label: "Ombor", desc: "Sklad nazorati", icon: Package },
              { href: "/staff", label: "Xodimlar", desc: "Agent va expeditorlar", icon: Users },
              { href: "/help", label: "Yordam", desc: "Qo'llanma va FAQ", icon: MessageSquare },
            ].map(l => (
              <Link key={l.href} href={l.href} className="bg-card rounded-xl border p-4 hover:shadow-md hover:border-emerald-300 transition group">
                <div className="flex items-center justify-between mb-2">
                  <l.icon className="w-6 h-6 text-emerald-600" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-emerald-600" />
                </div>
                <div className="font-bold">{l.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{l.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pro features */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 p-6">
          <div className="flex items-start gap-3">
            <Crown className="w-8 h-8 text-yellow-600 shrink-0" />
            <div>
              <div className="font-bold text-lg text-yellow-700">Pro funksiyalar</div>
              <div className="text-sm text-yellow-600 mt-1">SalesDoc darajasida AI tahlil, ovoz boshqaruvi, GPS monitoring, multi-filial</div>
              <Link href="/billing" className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700">
                Tariflarni ko'rish
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
