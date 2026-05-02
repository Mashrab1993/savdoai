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

const TYPE_COLOR: Record<string, string> = {
  visit: "bg-emerald-500 text-white",
  meeting: "bg-blue-500 text-white",
  delivery: "bg-violet-500 text-white",
  training: "bg-amber-500 text-white",
  holiday: "bg-rose-500 text-white",
}
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  visit: MapPin, meeting: Users, delivery: Truck, training: Star, holiday: Star,
}

export default function CalendarPage() {
  const [month] = useState({ year: 2026, monthIdx: 4 })
  const monthName = "May 2026"

  // Calculate first day of month and total days (May 2026 starts on Friday, 31 days)
  const firstDayOffset = 4 // Friday = 4 (Du=0)
  const totalDays = 31
  const totalCells = Math.ceil((firstDayOffset + totalDays) / 7) * 7

  const today = 2

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Komanda taqvimi</h1>
            <p className="text-sm text-slate-500">{monthName} · {EVENTS.length} ta hodisa</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi hodisa</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" size="sm"><ChevronLeft className="w-4 h-4" /></Button>
            <h2 className="text-xl font-bold flex-1 text-center">{monthName}</h2>
            <Button variant="outline" size="sm"><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDayOffset + 1
              const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays
              const dayEvents = EVENTS.filter(e => e.date === dayNum)
              const isToday = dayNum === today

              return (
                <div key={i} className={`aspect-square min-h-[100px] p-1.5 rounded-lg border ${
                  !isCurrentMonth ? "bg-slate-50 border-slate-200 opacity-30" :
                  isToday ? "bg-emerald-50 border-emerald-400 border-2" :
                  "bg-white border-slate-200"
                }`}>
                  {isCurrentMonth && (
                    <>
                      <div className={`text-xs font-bold mb-1 ${isToday ? "text-emerald-700" : "text-slate-700"}`}>
                        {dayNum} {isToday && "← Bugun"}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(e => {
                          const Icon = TYPE_ICON[e.type]
                          return (
                            <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${TYPE_COLOR[e.type]}`} title={`${e.title} — ${e.agent}`}>
                              <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{e.title}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-slate-500 font-semibold">+{dayEvents.length - 3} ta</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4 flex-wrap text-xs">
            <span className="text-slate-500 font-semibold">Hodisa turlari:</span>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm" /><span>Vizit</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm" /><span>Yig'ilish</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-violet-500 rounded-sm" /><span>Yetkazma</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm" /><span>Trening</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded-sm" /><span>Bayram</span></div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bugungi hodisalar (02.05)</h2>
          <div className="space-y-2">
            {EVENTS.filter(e => e.date === today).map(e => {
              const Icon = TYPE_ICON[e.type]
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TYPE_COLOR[e.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-xs text-slate-500">{e.agent}</div>
                  </div>
                </div>
              )
            })}
            {EVENTS.filter(e => e.date === today).length === 0 && (
              <div className="text-center text-slate-500 py-4">Bugun hodisa yo'q</div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
