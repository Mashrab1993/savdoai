"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Tag, Edit, Trash2, Sparkles } from "lucide-react"
import Link from "next/link"

type Rule = {
  id: number; name: string; priority: number;
  triggers: string[]; conditions: string[]; action: string;
  active: boolean;
  applicationsCount: number; totalDiscount: number;
}

const RULES: Rule[] = [
  { id: 1, name: "Champions klient — −10%", priority: 1, triggers: ["Klient segment = Champions"], conditions: ["Min. zakaz 500k"], action: "10% chegirma", active: true, applicationsCount: 184, totalDiscount: 28_400_000 },
  { id: 2, name: "Yangi klient (1-zakaz)", priority: 2, triggers: ["Birinchi zakaz"], conditions: [], action: "15% chegirma", active: true, applicationsCount: 24, totalDiscount: 1_240_000 },
  { id: 3, name: "Katta zakaz (5M+)", priority: 3, triggers: ["Zakaz summasi >= 5M"], conditions: [], action: "8% chegirma", active: true, applicationsCount: 42, totalDiscount: 18_400_000 },
  { id: 4, name: "Bonjur (muddat tugashi yaqin)", priority: 4, triggers: ["SKU = BJ-050-MOL", "Muddat <= 7 kun"], conditions: [], action: "40% chegirma", active: true, applicationsCount: 8, totalDiscount: 480_000 },
  { id: 5, name: "Choco-Boom may aktsiyasi", priority: 5, triggers: ["SKU = CB-075-CHO", "01.05 - 20.05"], conditions: ["Min. miqdor 50 dona"], action: "20% chegirma", active: true, applicationsCount: 124, totalDiscount: 8_400_000 },
  { id: 6, name: "Voda Premium yoz aktsiyasi", priority: 6, triggers: ["SKU = VOD-1L-PR", "May-Avgust"], conditions: [], action: "12% chegirma", active: false, applicationsCount: 0, totalDiscount: 0 },
  { id: 7, name: "Loyalty programma", priority: 7, triggers: ["Klient registr"], conditions: ["LTV >= 10M"], action: "5% har zakazda", active: true, applicationsCount: 96, totalDiscount: 6_800_000 },
  { id: 8, name: "Cash sotuv (naqd)", priority: 8, triggers: ["To'lov turi = Naqd"], conditions: [], action: "3% chegirma", active: true, applicationsCount: 248, totalDiscount: 4_240_000 },
]

const SERIF: React.CSSProperties = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DiscountRulesPage() {
  const [rules, setRules] = useState(RULES)

  const toggle = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  const activeRules = rules.filter(r => r.active).length
  const totalDiscount = rules.reduce((s, r) => s + r.totalDiscount, 0)
  const totalApplications = rules.reduce((s, r) => s + r.applicationsCount, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={SERIF}>
                <Tag className="w-8 h-8 text-[#C75D3C]" />
                Chegirma <span className="italic text-[#C75D3C]">qoidalari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{activeRules} faol qoida · {totalApplications} marta qo'llandi · jami {fmt(totalDiscount / 1_000_000)} M chegirma</p>
            </div>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi qoida</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "FAOL QOIDALAR", value: activeRules, color: "#059669" },
              { label: "QO'LLANISH SONI", value: fmt(totalApplications), color: "#1D4ED8" },
              { label: "JAMI CHEGIRMA, M", value: fmt(totalDiscount / 1_000_000), color: "#6D28D9" },
              { label: "O'RTACHA, K", value: fmt(Math.round(totalDiscount / Math.max(1, totalApplications) / 1000)), color: "#C75D3C" },
            ].map((kpi, i) => (
              <Card key={i} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
                <Tag className="w-5 h-5 mb-3" style={{ color: kpi.color }} />
                <div className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: kpi.color }}>{kpi.label}</div>
                <div className="text-3xl font-light mt-2 tabular-nums text-[#1A1A1A]" style={SERIF}>{kpi.value}</div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: kpi.color, opacity: 0.4 }} />
              </Card>
            ))}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={SERIF}>Qoidalar (prioritet bo'yicha)</h2>
            <div className="space-y-2">
              {rules.sort((a, b) => a.priority - b.priority).map(r => (
                <div key={r.id} className={`p-4 rounded-2xl border ${r.active ? "bg-white border-[#E8E0D3]" : "bg-[#FAF7F2] border-[#F0EAE0] opacity-70"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-light text-white text-lg flex-shrink-0`} style={{ background: r.active ? "#C75D3C" : "#9C8A6E", fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {r.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-medium text-base text-[#1A1A1A]" style={SERIF}>{r.name}</h3>
                        {r.active
                          ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Faol</span>
                          : <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D]">Off</span>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-blue-50 p-2 rounded border border-blue-100">
                          <div className="font-medium text-blue-700 mb-1 uppercase tracking-wider text-[10px]">Trigger (bo'lganda)</div>
                          <ul className="space-y-0.5 text-[#1A1A1A]">
                            {r.triggers.map((t, i) => <li key={i}>· {t}</li>)}
                          </ul>
                        </div>
                        {r.conditions.length > 0 && (
                          <div className="bg-[#FCE9DD] p-2 rounded border border-[#E8C9A8]">
                            <div className="font-medium text-[#D97706] mb-1 uppercase tracking-wider text-[10px]">Shart (qachon)</div>
                            <ul className="space-y-0.5 text-[#1A1A1A]">
                              {r.conditions.map((c, i) => <li key={i}>· {c}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                          <div className="font-medium text-emerald-700 mb-1 uppercase tracking-wider text-[10px]">Amal (chegirma)</div>
                          <div className="font-medium text-base text-[#1A1A1A]">{r.action}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-[#9C8A6E]">
                        <span>Qo'llanish: <span className="font-medium text-[#1A1A1A]">{r.applicationsCount}</span></span>
                        <span>Jami chegirma: <span className="font-medium font-mono tabular-nums text-[#C75D3C]">{fmt(r.totalDiscount / 1000)}k so'm</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggle(r.id)} className={`w-12 h-6 rounded-full relative transition-colors`} style={{ background: r.active ? "#C75D3C" : "#E8E0D3" }}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${r.active ? "translate-x-6" : ""}`} />
                      </button>
                      <button className="p-1.5 text-[#6B5B4D] hover:bg-[#F0EAE0] rounded"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 text-[#C75D3C] hover:bg-[#F5E5D6] rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#FAF7F2] border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-[#C75D3C] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-[#1A1A1A]" style={SERIF}>Qoida engine qanday ishlaydi?</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Tizim har zakaz uchun qoidalarni prioritet bo'yicha tekshiradi. Birinchi mos tushgan qoida qo'llanadi.
                  Bir nechta qoida bo'lsa — ularning yig'indisi (max 25%) hisoblanadi. Qoidalar bekor qilinishi yoki o'zgartirilishi mumkin.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
