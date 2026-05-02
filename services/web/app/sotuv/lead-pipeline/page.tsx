"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Phone, Mail, MapPin, Calendar, DollarSign, User } from "lucide-react"
import Link from "next/link"

type Lead = {
  id: number; name: string; phone: string; potentialValue: number;
  source: string; agent: string; lastContact: string; daysInStage: number;
  notes: string;
}

type Stage = {
  id: string; name: string; color: string; icon: string;
}

const STAGES: Stage[] = [
  { id: "new", name: "Yangi (lead)", color: "bg-slate-500", icon: "🆕" },
  { id: "contacted", name: "Bog'landi", color: "bg-blue-500", icon: "📞" },
  { id: "interested", name: "Qiziqyapti", color: "bg-violet-500", icon: "👀" },
  { id: "negotiating", name: "Muzokara", color: "bg-amber-500", icon: "💬" },
  { id: "won", name: "Yutdik 🎉", color: "bg-emerald-500", icon: "✅" },
  { id: "lost", name: "Yutqazdik", color: "bg-rose-500", icon: "❌" },
]

const LEADS: Record<string, Lead[]> = {
  new: [
    { id: 1, name: "Yangi Магазин Чорсу", phone: "+998 90 111 22 33", potentialValue: 4_800_000, source: "Cold call", agent: "Babadjanova N.", lastContact: "2026-05-02", daysInStage: 0, notes: "Bozorda bilingan" },
    { id: 2, name: "FRESH Maркет Сергели", phone: "+998 90 222 33 44", potentialValue: 6_400_000, source: "Referral", agent: "Berdiyev R.", lastContact: "2026-05-01", daysInStage: 1, notes: "Anvar referral" },
  ],
  contacted: [
    { id: 3, name: "Эконом Маркет", phone: "+998 90 333 44 55", potentialValue: 3_600_000, source: "Internet", agent: "Sayitqulov M.", lastContact: "2026-04-30", daysInStage: 2, notes: "Birinchi qo'ng'iroq" },
    { id: 4, name: "Domashniy Магазин", phone: "+998 90 444 55 66", potentialValue: 5_200_000, source: "Cold call", agent: "ДАВЛАТ", lastContact: "2026-04-29", daysInStage: 3, notes: "Katalog yubordim" },
  ],
  interested: [
    { id: 5, name: "Magnit Plus", phone: "+998 90 555 66 77", potentialValue: 8_400_000, source: "Internet", agent: "BORIEV M.", lastContact: "2026-04-28", daysInStage: 4, notes: "Choco-Boom narxiga qiziqyapti" },
    { id: 6, name: "Сайёх MARKET", phone: "+998 90 666 77 88", potentialValue: 7_200_000, source: "Referral", agent: "Babadjanova N.", lastContact: "2026-04-27", daysInStage: 5, notes: "1-haftada javob beradi" },
  ],
  negotiating: [
    { id: 7, name: "СУПЕР PLUS", phone: "+998 90 777 88 99", potentialValue: 12_400_000, source: "Trade show", agent: "BORIEV M.", lastContact: "2026-04-25", daysInStage: 7, notes: "Chegirma so'ramoqda" },
  ],
  won: [
    { id: 8, name: "Family Маркет", phone: "+998 90 888 99 00", potentialValue: 6_800_000, source: "Referral", agent: "ДАВЛАТ", lastContact: "2026-04-22", daysInStage: 10, notes: "1-zakaz mart oyida" },
    { id: 9, name: "ЭКО Магазин", phone: "+998 90 999 00 11", potentialValue: 4_400_000, source: "Internet", agent: "Berdiyev R.", lastContact: "2026-04-20", daysInStage: 12, notes: "Premium tovar bilan boshladik" },
  ],
  lost: [
    { id: 10, name: "АРЗОН маркет", phone: "+998 90 000 11 22", potentialValue: 2_800_000, source: "Cold call", agent: "Турсунов Ж.", lastContact: "2026-04-18", daysInStage: 14, notes: "Boshqa kompaniya bilan ishlaydi" },
  ],
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function LeadPipelinePage() {
  const [view] = useState<"kanban">("kanban")

  const totalValue = Object.values(LEADS).flat().reduce((s, l) => s + l.potentialValue, 0)
  const wonValue = LEADS.won.reduce((s, l) => s + l.potentialValue, 0)
  const conversionRate = Math.round((LEADS.won.length / Object.values(LEADS).flat().length) * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sotuv" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Lead pipeline (savdo voronkasi)</h1>
            <p className="text-sm text-slate-500">{Object.values(LEADS).flat().length} ta lead · {fmt(totalValue / 1_000_000)} M potentsial · konversiya {conversionRate}%</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi lead</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {STAGES.map(s => {
            const count = LEADS[s.id]?.length ?? 0
            const value = (LEADS[s.id] ?? []).reduce((sum, l) => sum + l.potentialValue, 0)
            return (
              <Card key={s.id} className="p-3 bg-white border">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-semibold truncate">{s.name}</span>
                </div>
                <div className="text-xl font-bold font-mono">{count}</div>
                <div className="text-xs text-slate-500">{fmt(value / 1_000_000)} M</div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const stageLeads = LEADS[stage.id] ?? []
            const stageValue = stageLeads.reduce((s, l) => s + l.potentialValue, 0)
            return (
              <div key={stage.id} className="space-y-2">
                <div className={`p-3 rounded-lg ${stage.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{stage.name}</div>
                      <div className="text-xs opacity-90">{stageLeads.length} ta · {fmt(stageValue / 1_000_000)} M</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {stageLeads.map(lead => (
                    <Card key={lead.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="font-semibold text-sm mb-1">{lead.name}</div>
                      <div className="text-lg font-bold text-emerald-700 font-mono">
                        {fmt(lead.potentialValue / 1_000_000)} M
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{lead.agent}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-xs">{lead.daysInStage} kun · {lead.lastContact}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-500 italic line-clamp-2">{lead.notes}</div>
                      </div>

                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          lead.source === "Cold call" ? "bg-blue-100 text-blue-700" :
                          lead.source === "Referral" ? "bg-emerald-100 text-emerald-700" :
                          lead.source === "Internet" ? "bg-violet-100 text-violet-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {lead.source}
                        </span>
                      </div>
                    </Card>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="text-center text-slate-400 text-xs py-4 border-2 border-dashed border-slate-200 rounded-lg">
                      Bo'sh
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <div className="flex-1">
              <h3 className="font-bold">Bu oy yutilgan summa</h3>
              <p className="text-sm text-slate-600 mt-0.5">{LEADS.won.length} ta yangi klient · konversiya {conversionRate}%</p>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">+{fmt(wonValue / 1_000_000)} M</div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
