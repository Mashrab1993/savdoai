"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, MapPin, Users, Truck, Star } from "lucide-react"
import Link from "next/link"

type Event = {
  id: number; date: number; type: "visit" | "meeting" | "delivery" | "training" | "holiday";
  title: string; agent: string; client: string;
}

const DAY_NAMES = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]

const EVENTS: Event[] = [
  { id: 1, date: 1, type: "visit", title: "Salom Magazin №1", agent: "Babadjanova N.", client: "" },
  { id: 2, date: 1, type: "delivery", title: "Yetkazib berish #7024", agent: "Toxirov M.", client: "" },
  { id: 3, date: 2, type: "meeting", title: "Komanda yig'ilish", agent: "Hammasi", client: "" },
  { id: 4, date: 2, type: "visit", title: "Bona Магазин", agent: "Berdiyev R.", client: "" },
  { id: 5, date: 5, type: "training", title: "Yangi promo o'rgatish", agent: "Hammasi", client: "" },
  { id: 6, date: 8, type: "visit", title: "Дастархон Сервис", agent: "Sayitqulov M.", client: "" },
  { id: 7, date: 9, type: "holiday", title: "Bayram (Hayit)", agent: "—", client: "" },
  { id: 8, date: 12, type: "visit", title: "Гулямов Маркет", agent: "ДАВЛАТ", client: "" },
  { id: 9, date: 12, type: "delivery", title: "Yetkazma #7025", agent: "Aminov R.", client: "" },
  { id: 10, date: 15, type: "meeting", title: "Oylik hisobot yig'ilish", agent: "Hammasi", client: "" },
  { id: 11, date: 18, type: "visit", title: "Ali Ake Магазин", agent: "BORIEV M.", client: "" },
  { id: 12, date: 22, type: "training", title: "AI sotish texnikasi", agent: "Hammasi", client: "" },
  { id: 13, date: 25, type: "visit", title: "Билтек Маркет", agent: "Турсунов Ж.", client: "" },
]

const TYPE_BG: Record<string, string> = {
  visit: "#10B981",
  meeting: "#3B82F6",
  delivery: "#C75D3C",
  training: "#D97706",
  holiday: "#7C3AED",
}
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  visit: MapPin, meeting: Users, delivery: Truck, training: Star, holiday: Star,
}
const TYPE_LABEL: Record<string, string> = {
  visit: "Vizit", meeting: "Yig'ilish", delivery: "Yetkazma", training: "Trening", holiday: "Bayram",
}

export default function CalendarPage() {
  const [_month] = useState({ year: 2026, monthIdx: 4 })
  const monthName = "May 2026"

  const firstDayOffset = 4
  const totalDays = 31
  const totalCells = Math.ceil((firstDayOffset + totalDays) / 7) * 7

  const today = 2

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Komanda <span className="italic text-[#C75D3C]">taqvimi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{monthName} · {EVENTS.length} ta hodisa</p>
            </div>
            <Button className="gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi hodisa</Button>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 mb-5">
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]"><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="text-2xl font-light flex-1 text-center text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{monthName}</h2>
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]"><ChevronRight className="w-4 h-4" /></Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - firstDayOffset + 1
                const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays
                const dayEvents = EVENTS.filter(e => e.date === dayNum)
                const isToday = dayNum === today

                return (
                  <div key={i} className={`aspect-square min-h-[100px] p-1.5 rounded-xl border ${
                    !isCurrentMonth ? "bg-[#FAF7F2] border-[#E8E0D3] opacity-30" :
                    isToday ? "bg-[#FCE9DD]/40 border-[#C75D3C] border-2" :
                    "bg-white border-[#E8E0D3]"
                  }`}>
                    {isCurrentMonth && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? "text-[#C75D3C]" : "text-[#1A1A1A]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {dayNum} {isToday && "← Bugun"}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(e => {
                            const Icon = TYPE_ICON[e.type]
                            return (
                              <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 text-white" style={{ background: TYPE_BG[e.type] }} title={`${e.title} — ${e.agent}`}>
                                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{e.title}</span>
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-[#9C8A6E] font-medium">+{dayEvents.length - 3} ta</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-[#E8E0D3] flex items-center gap-4 flex-wrap text-xs">
              <span className="text-[#9C8A6E] uppercase tracking-wider font-medium">Hodisa turlari:</span>
              {Object.entries(TYPE_BG).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  <span className="text-[#1A1A1A]">{TYPE_LABEL[key]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Bugungi hodisalar (02.05)</h2>
            <div className="space-y-2">
              {EVENTS.filter(e => e.date === today).map(e => {
                const Icon = TYPE_ICON[e.type]
                return (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E0D3] bg-[#FAF7F2] hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: TYPE_BG[e.type] }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{e.title}</div>
                      <div className="text-xs text-[#9C8A6E]">{e.agent}</div>
                    </div>
                  </div>
                )
              })}
              {EVENTS.filter(e => e.date === today).length === 0 && (
                <div className="text-center text-[#9C8A6E] py-4">Bugun hodisa yo'q</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
