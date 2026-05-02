"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  ShoppingBag, Users, BarChart3, Truck, Camera, ListTodo, Sparkles, Award,
  TrendingUp, Calendar, Filter as FilterIcon, MapPin, DollarSign, RotateCcw, Box, FileText
} from "lucide-react"

const SECTIONS = [
  {
    title: "Sotuv hisobotlari",
    color: "emerald",
    items: [
      { slug: "agent", icon: Users, title: "Zakazlar agentlar bo'yicha", desc: "Agent × KPI cross-tab" },
      { slug: "klient", icon: ShoppingBag, title: "Sotuvlar klientlar bo'yicha", desc: "Klient × Brand cross-tab" },
      { slug: "tovar", icon: Box, title: "Sotuvlar tovarlar bo'yicha", desc: "Brand-level analytics" },
      { slug: "sku", icon: Box, title: "SKU bo'yicha 2.0", desc: "Pivot table per SKU" },
      { slug: "order-count", icon: BarChart3, title: "Zakaz soni", desc: "Order count report" },
      { slug: "expeditor", icon: Truck, title: "Otgruzka ekspeditorlar bo'yicha", desc: "Cross-tab pivot" },
      { slug: "defect", icon: RotateCcw, title: "Otkaz hisobotlari (return from shelf)", desc: "Returns analysis" },
      { slug: "expeditor-return", icon: RotateCcw, title: "Ekspeditor qaytarishi", desc: "Per expeditor returns" },
    ],
  },
  {
    title: "Klient analitika",
    color: "blue",
    items: [
      { slug: "klassifikatsiya", icon: TrendingUp, title: "Klient klassifikatsiyasi", desc: "Monetary tier ABC (7 daraja)" },
      { slug: "rfm", icon: Sparkles, title: "RFM segmentatsiya", desc: "Recency-Frequency-Monetary" },
      { slug: "visit-calendar", icon: Calendar, title: "Vizit kalendari", desc: "Agent × Day pivot" },
      { slug: "visit-daily", icon: Eye, title: "Kunlik vizit hisoboti", desc: "Daily visit calendar" },
      { slug: "visit-totals", icon: BarChart3, title: "Vizit yakuni", desc: "Working time totals" },
      { slug: "vansel", icon: Truck, title: "Vansel kontroli", desc: "Van selling daily" },
    ],
  },
  {
    title: "Bonus va chegirma",
    color: "amber",
    items: [
      { slug: "rlp", icon: Award, title: "RLP retro-bonus", desc: "Brand × Klient cross-tab" },
      { slug: "bonus", icon: Award, title: "Bonuslar", desc: "By bonuses" },
      { slug: "nakopit", icon: Award, title: "Nakopит. bonus", desc: "Lifetime accumulation" },
      { slug: "discount-detail", icon: DollarSign, title: "Chegirma detali", desc: "Pivot table builder" },
      { slug: "univ-discount", icon: DollarSign, title: "Universal chegirma", desc: "Customizable filters" },
      { slug: "univ-bonus", icon: Award, title: "Universal bonus", desc: "Configurable" },
      { slug: "price", icon: DollarSign, title: "Narx hisoboti", desc: "Price tracking" },
    ],
  },
  {
    title: "Foto/Vazifa/Marshrut",
    color: "rose",
    items: [
      { slug: "photo", icon: Camera, title: "Foto hisobotlar", desc: "Storecheck photos" },
      { slug: "tasks", icon: ListTodo, title: "Vazifa hisobotlari", desc: "Excel-grid editable" },
      { slug: "feedback", icon: ListTodo, title: "Bot acta-sverka feedback", desc: "Reconciliation feedback" },
      { slug: "expeditor-debt", icon: DollarSign, title: "Ekspeditor qarz (Yangi)", desc: "Debt by expeditor" },
      { slug: "univ-visit", icon: MapPin, title: "Universal vizit", desc: "Configurable visits" },
      { slug: "univ-sales", icon: ShoppingBag, title: "Universal sotuv", desc: "Universal sales" },
      { slug: "univ-return", icon: RotateCcw, title: "Universal qaytarish", desc: "Universal returns" },
    ],
  },
  {
    title: "Konstruktor (Drag-drop)",
    color: "purple",
    items: [
      { slug: "konstruktor", icon: FilterIcon, title: "Konstruktor отчётов", desc: "🏆 Drag-drop pivot builder (24 maydon)", featured: true },
      { slug: "excel-export", icon: FileText, title: "Excel eksport", desc: "5 versiya, JSON, Detail" },
      { slug: "inventory", icon: Box, title: "Inventar bo'yicha", desc: "Inventory pivot" },
      { slug: "tara", icon: Box, title: "Tara bo'yicha", desc: "Container deposit" },
    ],
  },
]

function Eye({ className }: { className?: string }) {
  return <BarChart3 className={className} />
}

export default function HisobotlarPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hisobotlar markazi</h1>
          <p className="text-base text-slate-500 mt-1">31+ ta hisobot turi · 5 ta universal · 1 ta drag-drop konstruktor</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((s, idx) => {
            const colors = {
              emerald: "border-emerald-300 bg-emerald-50/40",
              blue: "border-blue-300 bg-blue-50/40",
              amber: "border-amber-300 bg-amber-50/40",
              rose: "border-rose-300 bg-rose-50/40",
              purple: "border-purple-300 bg-purple-50/40",
            }[s.color] as string
            return (
              <div key={s.title}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-slate-700">{s.title}</h2>
                  <span className="text-sm text-slate-400">({s.items.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {s.items.map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.slug} href={`/hisobot/${item.slug}`}>
                        <Card className={`p-4 hover:shadow-md transition-all cursor-pointer h-full group ${(item as any).featured ? 'ring-2 ring-purple-400 bg-gradient-to-br from-purple-50 to-pink-50' : `border-2 ${colors}`}`}>
                          <Icon className={`w-7 h-7 mb-2 ${(item as any).featured ? 'text-purple-600' : 'text-slate-600'} group-hover:scale-110 transition-transform`} />
                          <h3 className="text-sm font-semibold text-slate-900 mb-0.5 line-clamp-1">{item.title}</h3>
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
