"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Calendar, Pencil, Trash2, X, Star } from "lucide-react"
import Link from "next/link"

type Holiday = {
  id: number; date: string; name: string; type: "national" | "religious" | "company" | "international";
  isWorkDay: boolean; description: string; active: boolean;
}

const INITIAL: Holiday[] = [
  { id: 1, date: "2026-01-01", name: "Yangi yil", type: "international", isWorkDay: false, description: "Bayram, dam olish kuni", active: true },
  { id: 2, date: "2026-03-08", name: "Xalqaro xotin-qizlar kuni", type: "international", isWorkDay: false, description: "Xotin-qizlar uchun aktsiya tavsiya etiladi", active: true },
  { id: 3, date: "2026-03-21", name: "Navro'z bayrami", type: "national", isWorkDay: false, description: "Milliy bayram", active: true },
  { id: 4, date: "2026-05-09", name: "Xotira va qadrlash kuni", type: "national", isWorkDay: false, description: "Bayram, dam olish kuni", active: true },
  { id: 5, date: "2026-05-20", name: "Hayit (Ramazon)", type: "religious", isWorkDay: false, description: "Ramazon bayrami (3 kun)", active: true },
  { id: 6, date: "2026-07-25", name: "Hayit (Qurbon)", type: "religious", isWorkDay: false, description: "Qurbon bayrami (3 kun)", active: true },
  { id: 7, date: "2026-09-01", name: "Mustaqillik kuni", type: "national", isWorkDay: false, description: "Eng katta milliy bayram", active: true },
  { id: 8, date: "2026-10-01", name: "O'qituvchilar va murabbiylar kuni", type: "national", isWorkDay: true, description: "Ish kuni, lekin tabriklash", active: true },
  { id: 9, date: "2026-12-08", name: "Konstitutsiya kuni", type: "national", isWorkDay: false, description: "Bayram, dam olish kuni", active: true },
  { id: 10, date: "2026-08-15", name: "Kompaniya yubileyi", type: "company", isWorkDay: true, description: "2 yillik yubiley — barcha xodimlarga bonus", active: true },
]

const TYPE_LABEL: Record<string, string> = {
  national: "🇺🇿 Milliy", religious: "☪️ Diniy", international: "🌍 Xalqaro", company: "🏢 Korporativ",
}
const TYPE_COLOR: Record<string, string> = {
  national: "bg-emerald-100 text-emerald-700",
  religious: "bg-violet-100 text-violet-700",
  international: "bg-blue-100 text-blue-700",
  company: "bg-amber-100 text-amber-700",
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Holiday> | null>(null)

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))
  const upcomingCount = holidays.filter(h => h.date >= "2026-05-02").length
  const dayOffCount = holidays.filter(h => !h.isWorkDay).length

  const openAdd = () => setEditing({ id: 0, date: "2026-12-31", name: "", type: "national", isWorkDay: false, description: "", active: true })
  const openEdit = (h: Holiday) => setEditing({ ...h })

  const save = () => {
    if (!editing) return
    if (!editing.id) setHolidays([...holidays, { ...editing as Holiday, id: Math.max(0, ...holidays.map(h => h.id)) + 1 }])
    else setHolidays(holidays.map(h => h.id === editing.id ? editing as Holiday : h))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-7 h-7 text-rose-600" />
              Bayram va dam olish kunlari (2026)
            </h1>
            <p className="text-sm text-slate-500">{holidays.length} ta bayram · {dayOffCount} dam olish · {upcomingCount} kelajakda</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi bayram</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">🇺🇿 Milliy</div>
            <div className="text-2xl font-bold mt-1">{holidays.filter(h => h.type === "national").length}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <div className="text-xs font-bold text-violet-700">☪️ Diniy</div>
            <div className="text-2xl font-bold mt-1">{holidays.filter(h => h.type === "religious").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">🌍 Xalqaro</div>
            <div className="text-2xl font-bold mt-1">{holidays.filter(h => h.type === "international").length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs font-bold text-amber-700">🏢 Korporativ</div>
            <div className="text-2xl font-bold mt-1">{holidays.filter(h => h.type === "company").length}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="space-y-2">
            {sorted.map(h => {
              const isPast = h.date < "2026-05-02"
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isPast ? "bg-slate-50 border-slate-200 opacity-60" :
                  h.isWorkDay ? "bg-amber-50/30 border-amber-200" :
                  "bg-rose-50/30 border-rose-200"
                }`}>
                  <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white font-bold ${
                    h.type === "national" ? "bg-emerald-500" :
                    h.type === "religious" ? "bg-violet-500" :
                    h.type === "international" ? "bg-blue-500" : "bg-amber-500"
                  }`}>
                    <span className="text-xs">{h.date.slice(5, 7)}.{h.date.slice(2, 4)}</span>
                    <span className="text-2xl leading-none">{h.date.slice(8, 10)}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold">{h.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[h.type]}`}>{TYPE_LABEL[h.type]}</span>
                      {h.isWorkDay
                        ? <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⚙️ Ish kuni</span>
                        : <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">😴 Dam olish</span>}
                      {!isPast && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">⏳ Kelajak</span>}
                    </div>
                    <p className="text-sm text-slate-600">{h.description}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Star className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-800">Bayramlar marketingda qanday ishlatiladi?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Tizim avtomatik bayramdan 7-14 kun oldin promo aktsiya tavsiyalari yaratadi.
                Hayit, Yangi yil va 8-mart oldidan zaxira tayyorlash kerak. Ish kunlari bo'lmagan kunlarda yetkazma rejalashtirilmaydi.
              </p>
            </div>
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" />
                  {editing.id ? `Bayram #${editing.id}` : "Yangi bayram"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Sana *</label>
                  <Input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Bayram nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Turi</label>
                  <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Tavsif</label>
                  <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="workday" checked={editing.isWorkDay} onChange={e => setEditing({ ...editing, isWorkDay: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="workday" className="text-sm cursor-pointer">Ish kuni (dam olish emas)</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Bekor</Button>
                <Button onClick={save}>{editing.id ? "Saqlash" : "Yaratish"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
