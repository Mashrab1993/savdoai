"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import {
  User, Building, Bell, Shield, CreditCard, Palette, FileText,
  Tag, Box, Truck, Database, Zap, Globe
} from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Me = { id: number; ism?: string; to_liq_ism?: string; dokon_nomi?: string; faol?: boolean }

const SECTIONS = [
  {
    title: "Profil va kompaniya",
    items: [
      { slug: "diler", icon: Building, title: "Kompaniya profili", desc: "Logo, nom, INN" },
      { slug: "users", icon: User, title: "Foydalanuvchilar", desc: "Admin/Agent ro'yxati" },
      { slug: "security", icon: Shield, title: "Xavfsizlik", desc: "Parol, 2FA" },
      { slug: "billing", icon: CreditCard, title: "Billing", desc: "Tarif, to'lovlar" },
    ],
  },
  {
    title: "Tovar va narx",
    items: [
      { slug: "subkategoriya", icon: Tag, title: "Subkategoriya", desc: "Tovar kategoriya" },
      { slug: "unit-conversion", icon: Box, title: "Birlik konvertatsiya", desc: "kg ↔ dona" },
      { slug: "tara", icon: Box, title: "Tara", desc: "Qutilar" },
      { slug: "season", icon: FileText, title: "Mavsumlar", desc: "Sezonlik" },
    ],
  },
  {
    title: "Sotuv va kanal",
    items: [
      { slug: "salesChannel", icon: Tag, title: "Savdo kanali", desc: "Optom/Chakana" },
      { slug: "tradeDirection", icon: Globe, title: "Savdo yo'nalishi", desc: "B2B/B2C" },
      { slug: "tag", icon: Tag, title: "Teglar", desc: "Klient teglar" },
      { slug: "territory", icon: Globe, title: "Hududlar", desc: "Region" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { slug: "notifications", icon: Bell, title: "Bildirishnomalar", desc: "Telegram, SMS" },
      { slug: "integrations", icon: Zap, title: "Integratsiyalar", desc: "Click, Payme" },
      { slug: "backup", icon: Database, title: "Backup", desc: "Ma'lumotlar zaxiralash" },
      { slug: "themes", icon: Palette, title: "Tema", desc: "Yorug'/Qorong'i" },
    ],
  },
]

export default function SozlamalarPage() {
  const { isAuthenticated } = useAuth()
  const { data: me } = useApi<Me>(isAuthenticated ? "/api/v1/me" : null)

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
          <p className="text-base text-slate-500 mt-1">
            Kompaniya, tovar, sotuv va tizim sozlamalari
            {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
          </p>
        </div>

        {me && (
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                {(me.dokon_nomi || me.ism || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold">{me.dokon_nomi || me.to_liq_ism || me.ism || "Kompaniya"}</div>
                <div className="text-sm text-slate-600">ID: {me.id} · {me.faol !== false ? "✓ Faol" : "Pas"}</div>
              </div>
              <Link href="/profile" className="px-4 py-2 bg-white border border-emerald-200 rounded text-sm hover:bg-emerald-100">
                Profil
              </Link>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold mb-3">{s.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {s.items.map(item => {
                  const Icon = item.icon
                  return (
                    <Link key={item.slug} href={`/sozlamalar/${item.slug}`}>
                      <Card className="p-4 hover:shadow-md transition-all cursor-pointer h-full">
                        <Icon className="w-7 h-7 mb-2 text-slate-600" />
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
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
