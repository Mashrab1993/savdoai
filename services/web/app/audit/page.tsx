"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Camera, ClipboardCheck, Eye, FileText, Sparkles, Truck, AlertTriangle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Klient = { id: number; ism: string }
type KlientResp = { total: number; items: Klient[] }
type Tovar = { id: number; nomi: string; qoldiq: number }
type TovarResp = { total: number; items: Tovar[] }

const SECTIONS = [
  { slug: "storecheck", icon: ClipboardCheck, title: "Storecheck", desc: "SKU + narx audit" },
  { slug: "facing", icon: Eye, title: "Facing", desc: "Javondagi joylashuv" },
  { slug: "photo-reports", icon: Camera, title: "Foto hisobotlar", desc: "Klient fotolari" },
  { slug: "photo-ai-review", icon: Sparkles, title: "Foto AI review", desc: "Avtomatik tahlil" },
  { slug: "sku-audit", icon: ClipboardCheck, title: "SKU audit", desc: "Mahsulot ro'yxati" },
  { slug: "competitor", icon: BarChart3, title: "Raqobatchi audit", desc: "Boshqa brendlar" },
  { slug: "quality-control", icon: AlertTriangle, title: "Sifat nazorati", desc: "Defect detect" },
  { slug: "standards", icon: ClipboardCheck, title: "Standartlar", desc: "Audit qoidalari" },
  { slug: "audit-log", icon: FileText, title: "Audit jurnali", desc: "Tarix" },
  { slug: "postavshik", icon: Truck, title: "Postavshik audit", desc: "Yetkazib beruvchi" },
  { slug: "daily-dashboard", icon: BarChart3, title: "Kunlik dashboard", desc: "Bugungi audit" },
]

export default function AuditPage() {
  const { isAuthenticated } = useAuth()
  const { data: klientResp } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=1" : null)
  const { data: tovarResp } = useApi<TovarResp>(isAuthenticated ? "/api/v1/tovarlar?limit=1" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit</h1>
          <p className="text-base text-slate-500 mt-1">
            Do'kon auditi, foto hisobot, SKU coverage, merchandising
            {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
          </p>
        </div>

        {isAuthenticated && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 border-blue-200 bg-blue-50/40">
              <div className="text-xs uppercase font-semibold text-blue-700">Audit qiluvchi klientlar</div>
              <div className="text-3xl font-bold text-blue-800 tabular-nums">{klientResp?.total ?? "..."}</div>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50/40">
              <div className="text-xs uppercase font-semibold text-emerald-700">Audit tovarlari</div>
              <div className="text-3xl font-bold text-emerald-800 tabular-nums">{tovarResp?.total ?? "..."}</div>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50/40">
              <div className="text-xs uppercase font-semibold text-amber-700">Audit standartlari</div>
              <div className="text-3xl font-bold text-amber-800 tabular-nums">7</div>
              <div className="text-xs text-slate-500 mt-1">5 tayyor, 2 rivojlanmoqda</div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <Link key={s.slug} href={`/audit/${s.slug}`}>
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer h-full group">
                  <Icon className="w-7 h-7 mb-2 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
