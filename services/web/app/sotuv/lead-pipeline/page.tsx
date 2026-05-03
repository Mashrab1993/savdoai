"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Phone, Calendar, DollarSign, User } from "lucide-react"
import Link from "next/link"

type Lead = {
  id: number; name: string; phone: string; potentialValue: number;
  source: string; agent: string; lastContact: string; daysInStage: number;
  notes: string;
}

type Stage = {
  id: string; name: string; tone: string; bg: string; text: string;
}

const STAGES: Stage[] = [
  { id: "new", name: "Yangi (lead)", tone: "neutral", bg: "#F0EAE0", text: "#6B5B4D" },
  { id: "contacted", name: "Bog'landi", tone: "blue", bg: "#DBEAFE", text: "#1D4ED8" },
  { id: "interested", name: "Qiziqyapti", tone: "purple", bg: "#EDE9FE", text: "#6D28D9" },
  { id: "negotiating", name: "Muzokara", tone: "warn", bg: "#FCE9DD", text: "#D97706" },
  { id: "won", name: "Yutdik", tone: "good", bg: "#D1FAE5", text: "#047857" },
  { id: "lost", name: "Yutqazdik", tone: "bad", bg: "#F5E5D6", text: "#C75D3C" },
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

const SERIF: React.CSSProperties = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function LeadPipelinePage() {
  const [view] = useState<"kanban">("kanban")

  const totalValue = Object.values(LEADS).flat().reduce((s, l) => s + l.potentialValue, 0)
  const wonValue = LEADS.won.reduce((s, l) => s + l.potentialValue, 0)
  const conversionRate = Math.round((LEADS.won.length / Object.values(LEADS).flat().length) * 100)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sotuv" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SOTUV</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Lead pipeline <span className="italic text-[#C75D3C]">savdo voronkasi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{Object.values(LEADS).flat().length} ta lead · {fmt(totalValue / 1_000_000)} M potentsial · konversiya {conversionRate}%</p>
            </div>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi lead</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {STAGES.map(s => {
              const count = LEADS[s.id]?.length ?? 0
              const value = (LEADS[s.id] ?? []).reduce((sum, l) => sum + l.potentialValue, 0)
              return (
                <Card key={s.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-4 relative overflow-hidden">
                  <div className="text-[10px] uppercase tracking-[0.18em] font-medium truncate" style={{ color: s.text }}>{s.name}</div>
                  <div className="text-2xl font-light mt-2 tabular-nums text-[#1A1A1A]" style={SERIF}>{count}</div>
                  <div className="text-xs text-[#9C8A6E] font-mono tabular-nums">{fmt(value / 1_000_000)} M</div>
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: s.text, opacity: 0.4 }} />
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
                  <div className="p-3 rounded-2xl border" style={{ background: stage.bg, borderColor: stage.text + "33" }}>
                    <div className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: stage.text }}>{stage.name}</div>
                    <div className="text-xs mt-1 text-[#6B5B4D] font-mono tabular-nums">{stageLeads.length} ta · {fmt(stageValue / 1_000_000)} M</div>
                  </div>

                  <div className="space-y-2">
                    {stageLeads.map(lead => (
                      <Card key={lead.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="font-medium text-sm mb-1 text-[#1A1A1A]">{lead.name}</div>
                        <div className="text-lg font-light text-[#C75D3C] font-mono tabular-nums" style={SERIF}>
                          {fmt(lead.potentialValue / 1_000_000)} M
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-[#6B5B4D]">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#9C8A6E]" />
                            <span className="font-mono tabular-nums">{lead.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#9C8A6E]" />
                            <span>{lead.agent}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#9C8A6E]" />
                            <span className="text-xs font-mono tabular-nums">{lead.daysInStage} kun · {lead.lastContact}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#F0EAE0]">
                          <div className="text-xs text-[#9C8A6E] italic line-clamp-2">{lead.notes}</div>
                        </div>

                        <div className="mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            lead.source === "Cold call" ? "bg-blue-50 text-blue-700" :
                            lead.source === "Referral" ? "bg-emerald-50 text-emerald-700" :
                            lead.source === "Internet" ? "bg-purple-50 text-purple-700" :
                            "bg-[#FCE9DD] text-[#D97706]"
                          }`}>
                            {lead.source}
                          </span>
                        </div>
                      </Card>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="text-center text-[#9C8A6E] text-xs py-4 border border-dashed border-[#E8E0D3] rounded-2xl">
                        Bo'sh
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-emerald-700" />
              <div className="flex-1">
                <h3 className="font-medium text-[#1A1A1A]" style={SERIF}>Bu oy yutilgan summa</h3>
                <p className="text-sm text-[#6B5B4D] mt-0.5">{LEADS.won.length} ta yangi klient · konversiya {conversionRate}%</p>
              </div>
              <div className="text-3xl font-light font-mono tabular-nums text-emerald-700" style={SERIF}>+{fmt(wonValue / 1_000_000)} M</div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
