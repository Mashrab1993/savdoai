"use client"

/**
 * Reports Hub — SalesDoc /settings/priceType "Отчёты" dropdown analog.
 *
 * Barcha hisobotlar bir joyda grid sifatida — foydalanuvchi topsa oson.
 */

import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import {
  BarChart3, TrendingUp, TrendingDown, Users, Package, ShoppingCart,
  Truck, Warehouse, DollarSign, AlertTriangle, FileText, Camera,
  Award, Target, Map, Calendar, ClipboardList, PieChart,
  Activity, Search, ArrowRight, Zap, Crown, Tag,
} from "lucide-react"

type Report = {
  title: string
  subtitle: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  category: "sotuv" | "agent" | "klient" | "tovar" | "moliya" | "sklad" | "tashrif" | "drugoy"
  hot?: boolean
}

const REPORTS: Report[] = [
  // SOTUV
  { title: "Sotuvlar ro'yxati",   subtitle: "Barcha zayavkalar, filter + qidiruv",       href: "/orders",           icon: ShoppingCart, gradient: "from-blue-500 to-indigo-600",    category: "sotuv", hot: true },
  { title: "Sotuv hisoboti",      subtitle: "Kunlik/haftalik/oylik dinamika",            href: "/reports",          icon: BarChart3,    gradient: "from-emerald-500 to-teal-600",   category: "sotuv" },
  { title: "Kunlik trend",        subtitle: "So'nggi 30 kun sotuv grafigi",              href: "/analytics",        icon: TrendingUp,   gradient: "from-violet-500 to-purple-600",  category: "sotuv" },
  { title: "Supervayzer dashboard", subtitle: "KPI, pie chart, alertlar",               href: "/supervayzer",      icon: Activity,     gradient: "from-indigo-500 to-blue-600",    category: "sotuv", hot: true },

  // AGENT
  { title: "Agent hisoboti",      subtitle: "Shogirdlar bo'yicha KPI",                   href: "/reports/agent",    icon: Users,        gradient: "from-cyan-500 to-teal-600",      category: "agent", hot: true },
  { title: "KPI reyting",         subtitle: "Agentlar ball reytingi",                    href: "/kpi",              icon: Crown,        gradient: "from-amber-500 to-orange-600",   category: "agent" },
  { title: "Leaderboard",         subtitle: "Gamification — XP va daraja",              href: "/leaderboard",      icon: Award,        gradient: "from-yellow-500 to-amber-600",   category: "agent" },
  { title: "Agent GPS",           subtitle: "Harakat, vaqt o'tkazish",                   href: "/gps",              icon: Map,          gradient: "from-green-500 to-emerald-600",  category: "agent" },

  // KLIENT
  { title: "RFM segmentatsiya",   subtitle: "Champion, Loyal, At Risk, Lost",           href: "/rfm",              icon: Users,        gradient: "from-blue-500 to-indigo-600",    category: "klient", hot: true },
  { title: "Klient AI profil",    subtitle: "Har klient uchun shaxsiy strategiya",       href: "/klient360",        icon: Target,       gradient: "from-fuchsia-500 to-pink-600",   category: "klient" },
  { title: "Klient ro'yxati",     subtitle: "Barcha klientlar",                          href: "/clients",          icon: Users,        gradient: "from-slate-500 to-gray-600",     category: "klient" },
  { title: "Qarzdorlar",          subtitle: "Qarz bor klientlar",                        href: "/debts",            icon: AlertTriangle, gradient: "from-red-500 to-rose-600",      category: "klient" },

  // TOVAR
  { title: "Tovar kategoriyalari", subtitle: "7 tab: kat/subkat/gruppa/brend/...",       href: "/categories",       icon: Tag,          gradient: "from-indigo-500 to-purple-600",  category: "tovar" },
  { title: "Narx turlari",        subtitle: "Prodaja/Zakup/Prayslist + naenka",          href: "/price-types",      icon: DollarSign,   gradient: "from-emerald-500 to-teal-600",   category: "tovar" },
  { title: "Narxlar tarixi",      subtitle: "Narx qanday o'zgargan",                     href: "/price-history",    icon: TrendingDown, gradient: "from-amber-500 to-orange-600",   category: "tovar" },
  { title: "Tovar ro'yxati",      subtitle: "Barcha tovarlar, qoldiqlar",                href: "/products",         icon: Package,      gradient: "from-sky-500 to-blue-600",       category: "tovar" },
  { title: "ABC-XYZ tahlil",      subtitle: "Tovarlar ABC kategoriyalar bo'yicha",       href: "/abc-xyz",          icon: PieChart,     gradient: "from-violet-500 to-purple-600",  category: "tovar" },

  // MOLIYA
  { title: "PnL (Foyda/Zarar)",   subtitle: "Tushum, tannarx, yalpi, sof foyda",         href: "/pnl",              icon: DollarSign,   gradient: "from-emerald-600 to-green-700",  category: "moliya", hot: true },
  { title: "Moliya live",         subtitle: "Kassa qoldig'i, tranzaksiyalar",            href: "/moliya",           icon: Activity,     gradient: "from-blue-500 to-cyan-600",      category: "moliya" },
  { title: "Kassa",               subtitle: "Naqd pul harakatlari",                      href: "/cash",             icon: DollarSign,   gradient: "from-green-500 to-emerald-600",  category: "moliya" },
  { title: "Xarajatlar",          subtitle: "Biznes xarajatlari",                        href: "/expenses",         icon: TrendingDown, gradient: "from-red-500 to-rose-600",       category: "moliya" },

  // SKLAD
  { title: "Ombor holati",        subtitle: "Qoldiqlar, minimum, kritik",                href: "/ombor",            icon: Warehouse,    gradient: "from-cyan-500 to-blue-600",      category: "sklad" },
  { title: "Skladlar",            subtitle: "Omborlar CRUD",                             href: "/skladlar",         icon: Warehouse,    gradient: "from-blue-500 to-indigo-600",    category: "sklad" },
  { title: "Ekspeditorlar",       subtitle: "Yetkazib beruvchilar",                      href: "/ekspeditorlar",    icon: Truck,        gradient: "from-amber-500 to-orange-600",   category: "sklad" },
  { title: "Sklad qog'ozi",       subtitle: "Inventarizatsiya hujjati",                  href: "/sklad-qogozi",     icon: ClipboardList, gradient: "from-slate-500 to-gray-600",    category: "sklad" },
  { title: "Kirimlar",            subtitle: "Tovar kirimi",                              href: "/kirim",            icon: Package,      gradient: "from-teal-500 to-cyan-600",      category: "sklad" },

  // TASHRIF
  { title: "Tashriflar",          subtitle: "Agent visitlari ro'yxati",                  href: "/tashrif",          icon: Map,          gradient: "from-green-500 to-emerald-600",  category: "tashrif" },
  { title: "Photo hisobot",       subtitle: "Facing, raqobat, brak fotolar",             href: "/photo-reports",    icon: Camera,       gradient: "from-pink-500 to-rose-600",      category: "tashrif" },
  { title: "Vazifalar",           subtitle: "Shogirdlarga berilgan vazifalar",           href: "/tasks",            icon: ClipboardList, gradient: "from-violet-500 to-purple-600", category: "tashrif" },

  // DRUGOY
  { title: "Ertalabki brifing",   subtitle: "AI Opus 4.7 — kunlik strategiya",           href: "/ai-dashboard",     icon: Zap,          gradient: "from-yellow-500 to-orange-600",  category: "drugoy", hot: true },
  { title: "Pro analitika",       subtitle: "Kuchli biznes insightlari",                 href: "/pro-analitika",    icon: Crown,        gradient: "from-purple-500 to-pink-600",    category: "drugoy" },
  { title: "Fikr/Shikoyat",       subtitle: "Klient feedbaclari",                        href: "/feedback",         icon: FileText,     gradient: "from-blue-500 to-cyan-600",      category: "drugoy" },
  { title: "Audit log",           subtitle: "Tizim xatolari, eventlar",                  href: "/audit-log",        icon: Activity,     gradient: "from-slate-500 to-gray-700",     category: "drugoy" },
]

const CATEGORY_META = {
  sotuv:   { label: "Sotuv",       icon: ShoppingCart, color: "text-blue-600" },
  agent:   { label: "Agentlar",    icon: Users,        color: "text-cyan-600" },
  klient:  { label: "Klientlar",   icon: Target,       color: "text-fuchsia-600" },
  tovar:   { label: "Tovarlar",    icon: Package,      color: "text-sky-600" },
  moliya:  { label: "Moliya",      icon: DollarSign,   color: "text-emerald-600" },
  sklad:   { label: "Sklad",       icon: Warehouse,    color: "text-amber-600" },
  tashrif: { label: "Tashrif",     icon: Map,          color: "text-green-600" },
  drugoy:  { label: "Boshqa",      icon: BarChart3,    color: "text-violet-600" },
} as const


export default function ReportsHubPage() {
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState<string>("all")

  const filtered = REPORTS.filter(r => {
    if (filterCat !== "all" && r.category !== filterCat) return false
    if (search && !(
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(search.toLowerCase())
    )) return false
    return true
  })

  const hot = REPORTS.filter(r => r.hot)

  return (
    <AdminLayout title="Hisobotlar markazi">
      <div className="space-y-6">
        {/* TOP */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <BarChart3 className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Hisobotlar markazi</h2>
            <p className="text-sm opacity-80 mb-4">
              {REPORTS.length} ta hisobot bir joyda — SalesDoc &quot;Отчёты&quot; dropdown'dan kuchliroq
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCat("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filterCat === "all" ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Hammasi ({REPORTS.length})
              </button>
              {Object.entries(CATEGORY_META).map(([key, m]) => {
                const count = REPORTS.filter(r => r.category === key).length
                return (
                  <button
                    key={key}
                    onClick={() => setFilterCat(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                      filterCat === key ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        {/* SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Hisobot qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* HOT (faqat agar all bo'lsa) */}
        {filterCat === "all" && !search && (
          <div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Eng muhim hisobotlar (HOT)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {hot.map(r => (
                <Link key={r.href} href={r.href}>
                  <Card className="group relative overflow-hidden cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl border-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${r.gradient} opacity-90`} />
                    <div className="absolute -bottom-4 -right-4 opacity-20">
                      <r.icon className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative p-5 text-white min-h-[140px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                            <r.icon className="w-5 h-5" />
                          </div>
                          <Badge className="bg-white/20 text-white border-0 text-xs">HOT</Badge>
                        </div>
                        <h3 className="text-base font-bold mb-1">{r.title}</h3>
                        <p className="text-xs opacity-90 leading-snug">{r.subtitle}</p>
                      </div>
                      <div className="flex items-center justify-end mt-3 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                        <span>Ochish</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* GRID (filtered yoki barcha) */}
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            {filterCat === "all" ? "Barcha hisobotlar" : CATEGORY_META[filterCat as keyof typeof CATEGORY_META]?.label}
            <Badge variant="outline">{filtered.length}</Badge>
          </h3>
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Search className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <h4 className="font-semibold">Hisobot topilmadi</h4>
              <p className="text-sm text-muted-foreground">Boshqa kalit so&apos;z kiriting yoki kategoriya tanlang</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(r => (
                <Link key={r.href} href={r.href}>
                  <Card className="group relative overflow-hidden cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl border-0 h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${r.gradient} opacity-90`} />
                    <div className="absolute -bottom-4 -right-4 opacity-20">
                      <r.icon className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative p-4 text-white min-h-[130px] flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                          <r.icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold mb-1">{r.title}</h3>
                        <p className="text-xs opacity-90 leading-snug">{r.subtitle}</p>
                      </div>
                      <div className="flex items-center justify-end text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
