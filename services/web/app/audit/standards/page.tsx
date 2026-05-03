"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ClipboardCheck, AlertCircle } from "lucide-react"
import Link from "next/link"

const STANDARDS = [
  { name: "Photo report", desc: "Har klientga borishda majburiy", impl: true },
  { name: "SKU coverage", desc: "Mahsulot bor/yo'q tekshiruvi", impl: true },
  { name: "Price audit", desc: "Narx to'g'ri ekanligini tekshirish", impl: true },
  { name: "Facing check", desc: "Mahsulot soni javonda", impl: true },
  { name: "Promo materials", desc: "POSM materiallar", impl: false },
  { name: "Competitor audit", desc: "Raqobatchi mahsulotlari", impl: false },
  { name: "Storecheck (full)", desc: "To'liq audit hisoboti", impl: true },
]

export default function StandardsPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit standartlari</h1>
            <p className="text-base text-slate-500 mt-1">Har vizit uchun majburiy yoki ixtiyoriy auditlar</p>
          </div>
        </div>

        <Card>
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Standart auditlar ({STANDARDS.filter(s => s.impl).length}/{STANDARDS.length})</h3>
            <span className="text-xs text-slate-500">{STANDARDS.filter(s => !s.impl).length} ta hali rivojlantirilmoqda</span>
          </div>
          <div className="divide-y">
            {STANDARDS.map(s => (
              <div key={s.name} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                {s.impl ? <ClipboardCheck className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-amber-500" />}
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.desc}</div>
                </div>
                <span className={`text-xs px-3 py-1 rounded ${s.impl ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {s.impl ? "Tayyor" : "Rivojlanmoqda"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
