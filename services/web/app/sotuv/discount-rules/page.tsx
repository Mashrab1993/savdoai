"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Tag, ToggleLeft, Edit, Trash2, Sparkles } from "lucide-react"
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Tag className="w-7 h-7 text-rose-600" />
              Chegirma qoidalari (Engine)
            </h1>
            <p className="text-sm text-slate-500">{activeRules} faol qoida · {totalApplications} marta qo'llandi · jami {fmt(totalDiscount / 1_000_000)} M chegirma</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi qoida</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Tag className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Faol qoidalar</div>
            <div className="text-2xl font-bold mt-1">{activeRules}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Tag className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Qo'llanish soni</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalApplications)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Tag className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Jami chegirma</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalDiscount / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Tag className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">O'rtacha bir zakazga</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(Math.round(totalDiscount / Math.max(1, totalApplications) / 1000))}k</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Qoidalar (prioritet bo'yicha)</h2>
          <div className="space-y-2">
            {rules.sort((a, b) => a.priority - b.priority).map(r => (
              <div key={r.id} className={`p-4 rounded-lg border-l-4 ${r.active ? "border-emerald-500 bg-white" : "border-slate-300 bg-slate-50 opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 ${r.active ? "bg-emerald-500" : "bg-slate-400"}`}>
                    {r.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-base">{r.name}</h3>
                      {r.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                 : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">○ Off</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <div className="font-bold text-blue-700 mb-1">⚡ Trigger (bo'lganda)</div>
                        <ul className="space-y-0.5">
                          {r.triggers.map((t, i) => <li key={i}>• {t}</li>)}
                        </ul>
                      </div>
                      {r.conditions.length > 0 && (
                        <div className="bg-amber-50 p-2 rounded border border-amber-200">
                          <div className="font-bold text-amber-700 mb-1">📋 Shart (qachon)</div>
                          <ul className="space-y-0.5">
                            {r.conditions.map((c, i) => <li key={i}>• {c}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                        <div className="font-bold text-emerald-700 mb-1">🎯 Amal (chegirma)</div>
                        <div className="font-bold text-base">{r.action}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>Qo'llanish: <span className="font-bold">{r.applicationsCount}</span></span>
                      <span>Jami chegirma: <span className="font-bold font-mono text-rose-700">{fmt(r.totalDiscount / 1000)}k so'm</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggle(r.id)} className={`w-12 h-6 rounded-full relative transition-colors ${r.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${r.active ? "translate-x-6" : ""}`} />
                    </button>
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-violet-50 border-violet-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-violet-800">Qoida engine qanday ishlaydi?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Tizim har zakaz uchun qoidalarni prioritet bo'yicha tekshiradi. Birinchi mos tushgan qoida qo'llanadi.
                Bir nechta qoida bo'lsa — ularning yig'indisi (max 25%) hisoblanadi. Qoidalar bekor qilinishi yoki o'zgartirilishi mumkin.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
