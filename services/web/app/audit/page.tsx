"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Camera, ClipboardCheck, BarChart3, DollarSign, Layers, MapPin } from "lucide-react"
import Link from "next/link"

const AUDIT_MODULES = [
  { href: "/audit/dashboard", icon: BarChart3, title: "Kunlik dashboard", desc: "Mercendaiizer holati real-time", accent: "#10B981", primary: "1042 reja", secondary: "0 bajarildi" },
  { href: "/audit/audits", icon: ClipboardCheck, title: "Tekshirishlar", desc: "Audit yozuvlari (14 ta)", accent: "#3B82F6", primary: "14 audit", secondary: "Bugun" },
  { href: "/audit/facing", icon: Layers, title: "Polki ulushi", desc: "Shelf share % vs raqobatchilar", accent: "#D97706", primary: "—", secondary: "Filter kerak" },
  { href: "/audit/sku", icon: Eye, title: "SKU mavjudligi", desc: "Out-of-stock detection", accent: "#8B5CF6", primary: "—", secondary: "Foto kutilmoqda" },
  { href: "/audit/price", icon: DollarSign, title: "Narx tahlili", desc: "Raqobatchilar narxi", accent: "#C75D3C", primary: "—", secondary: "Foto kerak" },
  { href: "/audit/merchandising", icon: ClipboardCheck, title: "Merchandising", desc: "Display compliance opros", accent: "#06B6D4", primary: "—", secondary: "Bugun" },
  { href: "/audit/storecheck", icon: MapPin, title: "Storecheck", desc: "Magazinni to'liq tekshirish", accent: "#7C3AED", primary: "—", secondary: "Bugun" },
  { href: "/audit/photo", icon: Camera, title: "Foto reyting", desc: "Foto reportlar baholash", accent: "#EC4899", primary: "0%", secondary: "Bugun" },
]

const AGENT_KPIS = [
  { name: "Babadjanova Nargiza", visits: 261, done: 0, refusal: 18, no_show: 243, sku: 0, facing: 0, photo: 0 },
  { name: "Berdiyev Rahmatillo", visits: 172, done: 0, refusal: 12, no_show: 160, sku: 0, facing: 0, photo: 0 },
  { name: "BORIEV MIRJALOL", visits: 282, done: 0, refusal: 0, no_show: 282, sku: 0, facing: 0, photo: 0 },
  { name: "Sayitqulov Mashrab", visits: 127, done: 0, refusal: 0, no_show: 127, sku: 0, facing: 0, photo: 0 },
  { name: "ДАВЛАТ", visits: 186, done: 0, refusal: 8, no_show: 178, sku: 0, facing: 0, photo: 0 },
  { name: "Турсунов Жамшид", visits: 14, done: 0, refusal: 0, no_show: 14, sku: 0, facing: 0, photo: 0 },
]

export default function AuditPage() {
  const totalVisits = AGENT_KPIS.reduce((s, a) => s + a.visits, 0)
  const totalDone = AGENT_KPIS.reduce((s, a) => s + a.done, 0)
  const totalRefusal = AGENT_KPIS.reduce((s, a) => s + a.refusal, 0)
  const totalNoShow = AGENT_KPIS.reduce((s, a) => s + a.no_show, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="border-b border-[#E8E0D3] pb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
            <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              Audit & <span className="italic text-[#C75D3C]">merchandising</span>
            </h1>
            <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
              Magazin va polka tekshiruvi · Field marketing analytics
            </p>
          </div>

          {/* 6 KPI summary */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <KpiSquare label="Visit" value="0%" subtext={`0/${totalVisits}`} accent="#10B981" />
            <KpiSquare label="Не посещ." value="96%" subtext={`${totalNoShow}/${totalVisits}`} accent="#C75D3C" />
            <KpiSquare label="SKU" value="0%" accent="#D97706" />
            <KpiSquare label="Facing" value="0%" accent="#3B82F6" />
            <KpiSquare label="Mercend." value="0%" accent="#8B5CF6" />
            <KpiSquare label="Foto" value="0%" accent="#EC4899" />
          </div>

          {/* 8 module cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIT_MODULES.map(m => {
              const Icon = m.icon
              return (
                <Link key={m.href} href={m.href}>
                  <Card className="relative overflow-hidden bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer h-full group">
                    <Icon className="w-9 h-9 mb-3 group-hover:scale-110 transition-transform" style={{ color: m.accent }} />
                    <h3 className="text-lg font-medium mb-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{m.title}</h3>
                    <p className="text-xs text-[#6B5B4D] mb-3 line-clamp-2">{m.desc}</p>
                    <div className="border-t border-[#F0EAE0] pt-2 mt-auto">
                      <div className="text-xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{m.primary}</div>
                      <div className="text-xs text-[#9C8A6E]">{m.secondary}</div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: m.accent }} />
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Merchandiser KPI table */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E8E0D3] bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-[#C75D3C]" />
                <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  Merchandaiizerlar — bugungi holat
                </h3>
              </div>
              <p className="text-sm text-[#6B5B4D] mt-1">Plan vs Fact — har agent kunlik visit</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Reja</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bajardi</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Otkaz</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Bormagan</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENT_KPIS.map(a => (
                    <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{a.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#6B5B4D]">{a.visits}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#C75D3C] font-medium">{a.done}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#D97706]">{a.refusal}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#9C8A6E]">{a.no_show}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{a.sku}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{a.facing}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{a.photo}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium">
                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E]">Jami</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{totalVisits}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#C75D3C]">{totalDone}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#D97706]">{totalRefusal}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{totalNoShow}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">0</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">0</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiSquare({ label, value, subtext, accent }: { label: string; value: string; subtext?: string; accent: string }) {
  return (
    <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-4 text-center relative overflow-hidden">
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      {subtext && <div className="text-xs text-[#9C8A6E] mt-1">{subtext}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
