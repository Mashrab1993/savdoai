"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  ShoppingBag, Users, BarChart3, Truck, Camera, ListTodo, Sparkles, Award,
  TrendingUp, Calendar, Filter as FilterIcon, MapPin, DollarSign, RotateCcw, Box, FileText, Eye, Loader2
} from "lucide-react"
import { useApi, useAuth } from "@/hooks/use-api"
import { formatCurrency } from "@/lib/utils"

type FoydaResp = {
  kunlar: number
  tushum: number
  tannarx: number
  yalpi_foyda: number
  xarajatlar: number
  sof_foyda: number
  margin_foiz: number
  sotuv_soni?: number
}

const SECTIONS = [
  {
    title: "Sotuv hisobotlari",
    accent: "#10B981",
    items: [
      { slug: "agent", icon: Users, title: "Zakazlar agentlar bo'yicha", desc: "Agent × KPI cross-tab" },
      { slug: "klient", icon: ShoppingBag, title: "Sotuvlar klientlar bo'yicha", desc: "Klient × Brand cross-tab" },
      { slug: "tovar", icon: Box, title: "Sotuvlar tovarlar bo'yicha", desc: "Brand-level analytics" },
      { slug: "sku-pivot", icon: Box, title: "SKU bo'yicha 2.0", desc: "Pivot table per SKU" },
      { slug: "expeditor-debt", icon: Truck, title: "Otgruzka ekspeditorlar bo'yicha", desc: "Cross-tab pivot" },
      { slug: "universal-defect", icon: RotateCcw, title: "Otkaz hisobotlari", desc: "Returns analysis" },
    ],
  },
  {
    title: "Klient analitika",
    accent: "#3B82F6",
    items: [
      { slug: "klassifikatsiya", icon: TrendingUp, title: "Klient klassifikatsiyasi", desc: "Monetary tier ABC (7 daraja)" },
      { slug: "rfm", icon: Sparkles, title: "RFM segmentatsiya", desc: "Recency-Frequency-Monetary" },
      { slug: "visit-calendar", icon: Calendar, title: "Vizit kalendari", desc: "Agent × Day pivot" },
      { slug: "kunlik", icon: Eye, title: "Kunlik vizit hisoboti", desc: "Daily visit calendar" },
      { slug: "vansel-control", icon: Truck, title: "Vansel kontroli", desc: "Van selling daily" },
      { slug: "clv", icon: TrendingUp, title: "CLV (Lifetime Value)", desc: "Customer Lifetime Value" },
    ],
  },
  {
    title: "Bonus va chegirma",
    accent: "#D97706",
    items: [
      { slug: "universal-bonus", icon: Award, title: "Universal bonus", desc: "Configurable bonus" },
      { slug: "price-history", icon: DollarSign, title: "Narx hisoboti", desc: "Price tracking" },
      { slug: "promo-effectiveness", icon: Award, title: "Promo samaradorligi", desc: "Promo ROI" },
      { slug: "abc-analysis", icon: TrendingUp, title: "ABC tahlil", desc: "Pareto" },
    ],
  },
  {
    title: "Foto/Vazifa/Marshrut",
    accent: "#C75D3C",
    items: [
      { slug: "marshrut", icon: MapPin, title: "Marshrut hisobotlar", desc: "Per-route analytics" },
      { slug: "agent-performance", icon: Award, title: "Agent KPI", desc: "Performance" },
      { slug: "expeditor-debt", icon: DollarSign, title: "Ekspeditor qarz", desc: "Debt by expeditor" },
      { slug: "universal-visit", icon: MapPin, title: "Universal vizit", desc: "Configurable visits" },
      { slug: "universal-sales", icon: ShoppingBag, title: "Universal sotuv", desc: "Universal sales" },
      { slug: "storecheck-trend", icon: BarChart3, title: "Storecheck trend", desc: "Trend analysis" },
    ],
  },
  {
    title: "Konstruktor (Drag-drop)",
    accent: "#8B5CF6",
    items: [
      { slug: "konstruktor", icon: FilterIcon, title: "Konstruktor отчётов", desc: "🏆 Drag-drop pivot builder (24 maydon)", featured: true },
      { slug: "cohort", icon: BarChart3, title: "Cohort retention", desc: "Cohort analysis" },
      { slug: "heatmap", icon: BarChart3, title: "Heatmap", desc: "Heatmap visualization" },
      { slug: "ombor", icon: Box, title: "Ombor hisobotlari", desc: "Inventory pivot" },
    ],
  },
]

export default function HisobotlarPage() {
  const { isAuthenticated } = useAuth()
  const { data: foyda, loading } = useApi<FoydaResp>(isAuthenticated ? "/api/v1/hisobot/foyda?kunlar=30" : null)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-8">
          {/* Hero */}
          <div className="border-b border-[#E8E0D3] pb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
            <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              Hisobotlar <span className="italic text-[#C75D3C]">markazi</span>
            </h1>
            <p className="text-base text-[#6B5B4D] mt-3 max-w-2xl">
              31+ ta hisobot turi · 5 ta universal · 1 ta drag-drop konstruktor
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>

          {/* Real foyda summary (oxirgi 30 kun) */}
          {isAuthenticated && (
            <Card className="p-6 bg-white border border-[#E8E0D3] rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  Oxirgi 30 kun (real-time)
                </h3>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-[#9C8A6E]" />}
              </div>
              {foyda && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                  <div>
                    <div className="text-xs uppercase text-[#9C8A6E] font-semibold">Sotuvlar</div>
                    <div className="text-2xl font-bold tabular-nums text-[#1A1A1A]">{foyda.sotuv_soni || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[#9C8A6E] font-semibold">Tushum</div>
                    <div className="text-2xl font-bold tabular-nums text-emerald-700">{formatCurrency(foyda.tushum)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[#9C8A6E] font-semibold">Tannarx</div>
                    <div className="text-2xl font-bold tabular-nums text-amber-700">{formatCurrency(foyda.tannarx)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[#9C8A6E] font-semibold">Yalpi foyda</div>
                    <div className="text-2xl font-bold tabular-nums text-blue-700">{formatCurrency(foyda.yalpi_foyda)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[#9C8A6E] font-semibold">Sof foyda</div>
                    <div className={`text-2xl font-bold tabular-nums ${foyda.sof_foyda >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatCurrency(foyda.sof_foyda)}
                    </div>
                  </div>
                </div>
              )}
              {foyda && (
                <div className="mt-3 pt-3 border-t border-[#F0EAE0] text-xs text-[#6B5B4D]">
                  Marja: <span className="font-semibold">{foyda.margin_foiz}%</span> · Xarajatlar: {formatCurrency(foyda.xarajatlar)}
                </div>
              )}
            </Card>
          )}

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 rounded-full" style={{ background: section.accent }} />
                <h2 className="text-2xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  {section.title}
                </h2>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">{section.items.length} ta</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {section.items.map((item: any) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.slug} href={`/hisobot/${item.slug}`}>
                      <Card className={`p-5 bg-white border shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer h-full group ${item.featured ? 'border-2 ring-2 ring-[#C75D3C]/20' : 'border-[#E8E0D3]'}`} style={item.featured ? { borderColor: section.accent } : {}}>
                        <Icon className="w-7 h-7 mb-3 group-hover:scale-110 transition-transform" style={{ color: section.accent }} />
                        <h3 className="text-base font-medium text-[#1A1A1A] mb-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{item.title}</h3>
                        <p className="text-xs text-[#6B5B4D] line-clamp-2">{item.desc}</p>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
