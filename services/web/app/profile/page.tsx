"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { useApi, useAuth } from "@/hooks/use-api"
import { User, Phone, Building, Mail, Hash } from "lucide-react"
import Link from "next/link"

type Me = {
  id: number
  ism?: string
  to_liq_ism?: string
  username?: string
  telefon?: string
  dokon_nomi?: string
  segment?: string
  faol?: boolean
  login?: string
  email?: string
}

export default function ProfilePage() {
  const { isAuthenticated } = useAuth()
  const { data: me, loading, error } = useApi<Me>(isAuthenticated ? "/api/v1/me" : null)

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl border border-[#E8E0D3] text-center">
          <h2 className="text-xl font-medium mb-2">Tizimga kirmagansiz</h2>
          <Link href="/login" className="inline-block px-5 py-2 bg-[#C75D3C] text-white rounded-md">Login</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="border-b border-[#E8E0D3] pb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
            <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              Mening <span className="italic text-[#C75D3C]">profilim</span>
            </h1>
          </div>

          {loading && <p className="text-[#6B5B4D]">Yuklanmoqda...</p>}
          {error && <p className="text-rose-600">Xato: {error}</p>}

          {me && (
            <Card className="p-6 bg-white border border-[#E8E0D3] rounded-2xl">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#F0EAE0]">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-medium" style={{ background: "linear-gradient(135deg, #C75D3C, #E27B5C)" }}>
                  {(me.ism || me.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-2xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    {me.to_liq_ism || me.ism || me.username || "—"}
                  </div>
                  <div className="text-sm text-[#9C8A6E]">@{me.username || "—"}</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <Field icon={Hash} label="ID" value={String(me.id)} />
                <Field icon={Building} label="Do'kon nomi" value={me.dokon_nomi || "—"} />
                <Field icon={Phone} label="Telefon" value={me.telefon || "—"} />
                <Field icon={User} label="Login" value={me.login || "—"} />
                <Field icon={Mail} label="Email" value={me.email || "—"} />
                <Field icon={User} label="Segment" value={me.segment || "—"} />
                <div className="flex items-center gap-3 pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${me.faol ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {me.faol ? "✓ Faol" : "Faol emas"}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token')
                  localStorage.removeItem('auth_user_id')
                  window.location.href = '/login'
                }
              }}
              className="px-5 py-2 rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-sm font-medium"
            >
              Chiqish
            </button>
            <Link href="/sozlamalar" className="px-5 py-2 rounded-md border border-[#E8E0D3] bg-white text-[#1A1A1A] hover:bg-[#FAF7F2] text-sm font-medium">
              Sozlamalar
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#F0EAE0] last:border-0">
      <Icon className="w-4 h-4 text-[#9C8A6E]" />
      <span className="text-[#9C8A6E] w-32">{label}:</span>
      <span className="font-medium text-[#1A1A1A] flex-1">{value}</span>
    </div>
  )
}
