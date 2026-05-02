"use client"

/**
 * Sozlamalar Markazi — SalesDoc'ning 22-sectionli settings menyusiga analog,
 * lekin chiroyliroq: grid cards + icon + colored gradient + hover effects.
 *
 * 22 ta bo'lim: kompaniya, to'lov, birlik, hudud, klient kat/tur, tovar,
 * narx turi/qiymati, rad/qaytarish sabablari, foto kategoriya, inventar,
 * bonus/RLP, foydalanuvchilar, partnyorlar, zakaz izoh, yopilish, vazifa
 * turlari, savdo yunalishi.
 */

import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Building2, CreditCard, Ruler, Map, Users, Star, FolderTree,
  Package, Tag, DollarSign, XCircle, RotateCcw, Camera,
  Box, Gift, Award, UserCog, Handshake, MessageSquare,
  Calendar, ClipboardList, Compass, ArrowRight,
  Truck, Warehouse, Target, BarChart3, Mic,
} from "lucide-react"

type Status = "ready" | "partial" | "todo"

interface Section {
  n: number
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  color: string   // tailwind gradient classes
  href: string
  status: Status  // ready | partial | todo
}

const SECTIONS: Section[] = [
  { n: 1,  title: "Kompaniya profili",       desc: "Nomi, region, rahbar, bank", icon: Building2,  color: "from-blue-500 to-indigo-600",   href: "/profile",            status: "partial" },
  { n: 2,  title: "To'lov usullari",         desc: "Naqd, karta, o'tkazma",      icon: CreditCard, color: "from-emerald-500 to-teal-600",  href: "/cashboxes",          status: "ready" },
  { n: 3,  title: "O'lchov birliklari",      desc: "dona, kg, karobka, litr",    icon: Ruler,      color: "from-amber-500 to-orange-600",  href: "/units",              status: "ready" },
  { n: 4,  title: "Hududlar",                desc: "Viloyat, shahar, tuman",     icon: Map,        color: "from-cyan-500 to-blue-600",     href: "/territories",        status: "partial" },
  { n: 5,  title: "Klient kategoriya",       desc: "A/B/C klassifikatsiya",      icon: Star,       color: "from-yellow-500 to-amber-600",  href: "/client-categories",  status: "partial" },
  { n: 6,  title: "Klient turi",             desc: "Chakana, optom, VIP, diler", icon: Users,      color: "from-violet-500 to-purple-600", href: "/client-types",       status: "ready" },
  { n: 7,  title: "Tovar kategoriya",        desc: "Kategoriya + guruhlash",     icon: FolderTree, color: "from-rose-500 to-pink-600",     href: "/categories",         status: "ready" },
  { n: 8,  title: "Tovarlar",                desc: "Kiyim, tovar, SKU",          icon: Package,    color: "from-sky-500 to-blue-600",      href: "/products",           status: "ready" },
  { n: 9,  title: "Narx turlari",            desc: "Chakana/Optom/VIP/Diler",    icon: Tag,        color: "from-fuchsia-500 to-pink-600",  href: "/price-types",        status: "ready" },
  { n: 10, title: "Narxlar",                 desc: "Tovar × narx turi matritsa", icon: DollarSign, color: "from-green-500 to-emerald-600", href: "/prices",             status: "ready" },
  { n: 11, title: "Rad etish sabablari",     desc: "Nega zakaz qabul emas",      icon: XCircle,    color: "from-red-500 to-rose-600",      href: "/rejection-reasons",  status: "ready" },
  { n: 12, title: "Qaytarish sabablari",     desc: "Brak, muddati, sifat...",    icon: RotateCcw,  color: "from-orange-500 to-red-600",    href: "/return-reasons",     status: "ready" },
  { n: 13, title: "Foto hisobot kategoriya", desc: "Facing, raqobat, brak",      icon: Camera,     color: "from-indigo-500 to-violet-600", href: "/photo-categories",   status: "todo" },
  { n: 14, title: "Inventar turi",           desc: "Uskuna, jihoz, stend",       icon: Box,        color: "from-teal-500 to-cyan-600",     href: "/equipment-types",    status: "todo" },
  { n: 15, title: "Bonus va chegirma",       desc: "Aksiyalar, promo",           icon: Gift,       color: "from-pink-500 to-rose-600",     href: "/bonuses",            status: "partial" },
  { n: 16, title: "RLP Bonus",               desc: "Retail Loss Prevention",     icon: Award,      color: "from-purple-500 to-fuchsia-600",href: "/rlp-bonuses",        status: "todo" },
  { n: 17, title: "Foydalanuvchilar",        desc: "Admin, shogird, auditor",    icon: UserCog,    color: "from-blue-600 to-indigo-700",   href: "/team",               status: "ready" },
  { n: 18, title: "Partnyorlar",             desc: "Yetkazuvchi distribyutorlar",icon: Handshake,  color: "from-emerald-600 to-green-700", href: "/partners",           status: "todo" },
  { n: 19, title: "Zakazga izoh",            desc: "Standart shablon matnlar",   icon: MessageSquare, color: "from-slate-500 to-gray-600",  href: "/order-notes",        status: "todo" },
  { n: 20, title: "Oy yopish",               desc: "Muflov, oxirgi balans",      icon: Calendar,   color: "from-stone-500 to-neutral-600", href: "/month-closures",     status: "todo" },
  { n: 21, title: "Vazifa turlari",          desc: "Tashrif, yetkazish, audit",  icon: ClipboardList, color: "from-orange-600 to-red-700",  href: "/task-types",         status: "todo" },
  { n: 22, title: "Savdo yunalishi",         desc: "FMCG, HoReCa, farma",        icon: Compass,    color: "from-yellow-600 to-orange-700", href: "/trade-directions",   status: "ready" },
  // ── YANGI (2026-04-17) ────────────────────────────────────────────────────
  { n: 23, title: "Ekspeditorlar",           desc: "Yetkazib beruvchilar, mashina", icon: Truck,    color: "from-amber-500 to-orange-600",  href: "/ekspeditorlar",      status: "ready" },
  { n: 24, title: "Skladlar (yangi)",        desc: "Asosiy, brak, aksiya",       icon: Warehouse,  color: "from-cyan-500 to-blue-600",     href: "/skladlar",           status: "ready" },
  { n: 25, title: "RFM segmentatsiya",       desc: "Champion/Loyal/At Risk",     icon: Target,     color: "from-violet-500 to-purple-600", href: "/rfm",                status: "ready" },
  { n: 26, title: "PnL (Foyda/Zarar)",       desc: "Tushum, tannarx, sof foyda", icon: BarChart3,  color: "from-emerald-600 to-green-700", href: "/pnl",                status: "ready" },
  { n: 27, title: "Hisobotlar markazi",      desc: "32 ta hisobot bir joyda",    icon: BarChart3,  color: "from-blue-500 to-indigo-600",   href: "/reports-hub",        status: "ready" },
  { n: 28, title: "Agent hisoboti",          desc: "Shogirdlar KPI",             icon: Users,      color: "from-cyan-500 to-teal-600",     href: "/reports/agent",      status: "ready" },
  { n: 29, title: "🎤 Ovozli buyruqlar",     desc: "40+ voice intent vizual",    icon: Mic,        color: "from-emerald-500 to-teal-600",  href: "/voice-help",         status: "ready" },
]

function statusBadge(s: Status) {
  if (s === "ready") return <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-300 border-0">Tayyor</Badge>
  if (s === "partial") return <Badge variant="default" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-0">Qisman</Badge>
  return <Badge variant="default" className="bg-red-500/20 text-red-700 dark:text-red-300 border-0">Rejada</Badge>
}

export default function SozlamalarPage() {
  const tayyor = SECTIONS.filter(s => s.status === "ready").length
  const qisman = SECTIONS.filter(s => s.status === "partial").length
  const rejada = SECTIONS.filter(s => s.status === "todo").length

  return (
    <AdminLayout title="Sozlamalar">
      <div className="space-y-6">
        {/* TOP STATS */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Sozlamalar Markazi</h2>
              <p className="text-sm opacity-80">
                SalesDoc'ning 22-sectionli sozlamalariga mos, lekin chiroyliroq va tez.
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-300">{tayyor}</div>
                <div className="text-xs opacity-80">Tayyor</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-300">{qisman}</div>
                <div className="text-xs opacity-80">Qisman</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-300">{rejada}</div>
                <div className="text-xs opacity-80">Rejada</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{SECTIONS.length}</div>
                <div className="text-xs opacity-80">Jami</div>
              </div>
            </div>
          </div>
        </Card>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.n} href={s.href}>
                <Card className="group relative overflow-hidden border-0 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl h-full">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-90`} />
                  {/* Icon watermark */}
                  <div className="absolute -bottom-4 -right-4 opacity-20 transition-all group-hover:opacity-30">
                    <Icon className="w-24 h-24 text-white" />
                  </div>
                  {/* Content */}
                  <div className="relative p-5 text-white h-full min-h-[150px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-semibold opacity-80">#{s.n}</span>
                        </div>
                        {statusBadge(s.status)}
                      </div>
                      <h3 className="text-base font-bold mb-1">{s.title}</h3>
                      <p className="text-xs opacity-90 leading-snug">{s.desc}</p>
                    </div>
                    <div className="flex items-center justify-end mt-4 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                      <span>Ochish</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          Keyingi bosqich: "Rejada" bo'limlarni birma-bir qurish va barchasiga AI tavsiyalari qo'shish.
        </p>
      </div>
    </AdminLayout>
  )
}
