"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Sun, Snowflake, Pencil, Trash2, X, TrendingUp } from "lucide-react"
import Link from "next/link"

type Season = {
  id: number; name: string; emoji: string;
  startMonth: number; endMonth: number;
  productsBoost: string[]; productsDrop: string[];
  expectedUplift: number;
  active: boolean;
}

const INITIAL: Season[] = [
  { id: 1, name: "Yoz peak", emoji: "☀️", startMonth: 6, endMonth: 8, productsBoost: ["Voda Premium", "Sok Apelsin", "Sok Premium", "Coca-Cola", "Pepsi"], productsDrop: ["Chay", "Issiq shokolad"], expectedUplift: 35, active: true },
  { id: 2, name: "Qish peak", emoji: "❄️", startMonth: 12, endMonth: 2, productsBoost: ["Chay", "Pechenye", "Issiq shokolad", "Konfet"], productsDrop: ["Voda", "Sok salqin"], expectedUplift: 22, active: true },
  { id: 3, name: "Bahor (Navro'z)", emoji: "🌸", startMonth: 3, endMonth: 4, productsBoost: ["Konfet", "Pechenye Yubileynoye", "Choco-Boom paket"], productsDrop: [], expectedUplift: 28, active: true },
  { id: 4, name: "Kuz (Maktab)", emoji: "🍂", startMonth: 9, endMonth: 10, productsBoost: ["Choco-Boom (small)", "Bonjur", "Pechenye"], productsDrop: ["Premium katta paket"], expectedUplift: 18, active: true },
  { id: 5, name: "Hayit Ramazon", emoji: "🌙", startMonth: 5, endMonth: 5, productsBoost: ["Premium konfet", "Shokolad assorti", "Premium pechenye"], productsDrop: [], expectedUplift: 42, active: true },
  { id: 6, name: "Hayit Qurbon", emoji: "🐑", startMonth: 7, endMonth: 7, productsBoost: ["Konfet", "Shokolad assorti"], productsDrop: [], expectedUplift: 38, active: true },
  { id: 7, name: "Yangi yil", emoji: "🎄", startMonth: 12, endMonth: 1, productsBoost: ["Premium tovarlar", "Konfet", "Pechenye katta"], productsDrop: [], expectedUplift: 48, active: true },
  { id: 8, name: "8-mart", emoji: "🌷", startMonth: 3, endMonth: 3, productsBoost: ["Shokolad", "Konfet asor"], productsDrop: [], expectedUplift: 32, active: true },
]

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyu", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]

export default function SeasonPage() {
  const [seasons, setSeasons] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Season> | null>(null)

  const today = 5 // May
  const activeNow = seasons.filter(s => {
    if (s.startMonth <= s.endMonth) return today >= s.startMonth && today <= s.endMonth
    return today >= s.startMonth || today <= s.endMonth
  })

  const openAdd = () => setEditing({ id: 0, name: "", emoji: "🌟", startMonth: 1, endMonth: 12, productsBoost: [], productsDrop: [], expectedUplift: 0, active: true })
  const openEdit = (s: Season) => setEditing({ ...s })

  const save = () => {
    if (!editing) return
    if (!editing.id) setSeasons([...seasons, { ...editing as Season, id: Math.max(0, ...seasons.map(s => s.id)) + 1 }])
    else setSeasons(seasons.map(s => s.id === editing.id ? editing as Season : s))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sun className="w-7 h-7 text-amber-500" />
              Mavsumlar va talablar
            </h1>
            <p className="text-sm text-slate-500">{seasons.length} ta mavsum · hozir faol: {activeNow.length} ta · Mavsumiy boost prognoz</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi mavsum</Button>
        </div>

        {activeNow.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-300">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Hozir faol mavsumlar (May)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeNow.map(s => (
                <div key={s.id} className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{s.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-slate-500">{MONTHS[s.startMonth - 1]} - {MONTHS[s.endMonth - 1]}</div>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">+{s.expectedUplift}%</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-700">📈 Boost:</span> {s.productsBoost.slice(0, 3).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Yillik kalendar</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left">Mavsum</th>
                  {MONTHS.map((m, i) => (
                    <th key={m} className={`border border-slate-300 py-2 px-1 text-center w-10 text-xs ${i + 1 === today ? "bg-amber-200" : ""}`}>{m}</th>
                  ))}
                  <th className="border border-slate-300 py-2 px-3 text-right">Uplift</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.emoji}</span>
                        <div>
                          <div className="font-bold text-sm">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.productsBoost.length} tovar boost</div>
                        </div>
                      </div>
                    </td>
                    {MONTHS.map((_, i) => {
                      const m = i + 1
                      const isActive = s.startMonth <= s.endMonth ? m >= s.startMonth && m <= s.endMonth : m >= s.startMonth || m <= s.endMonth
                      const isToday = m === today
                      return (
                        <td key={m} className={`border border-slate-300 py-2 px-1 text-center ${isToday ? "bg-amber-100" : ""}`}>
                          {isActive && (
                            <div className={`w-6 h-6 mx-auto rounded ${
                              s.expectedUplift >= 40 ? "bg-rose-500" :
                              s.expectedUplift >= 25 ? "bg-amber-500" :
                              "bg-emerald-500"
                            } flex items-center justify-center text-white text-xs font-bold`}>
                              ✓
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="border border-slate-300 py-2 px-3 text-right">
                      <span className={`font-mono font-bold ${s.expectedUplift >= 40 ? "text-rose-700" : s.expectedUplift >= 25 ? "text-amber-700" : "text-emerald-700"}`}>
                        +{s.expectedUplift}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="text-slate-500">Intensivlik:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded"></span> 0-25% boost</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded"></span> 25-40%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded"></span> 40%+</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Tafsilotlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {seasons.map(s => (
              <div key={s.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <h3 className="font-bold flex-1">{s.name}</h3>
                  <span className="text-xs text-slate-500">{MONTHS[s.startMonth - 1]} - {MONTHS[s.endMonth - 1]}</span>
                  <span className="text-emerald-700 font-bold">+{s.expectedUplift}%</span>
                  <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-100 rounded ml-2"><Pencil className="w-3.5 h-3.5" /></button>
                  <button className="p-1 text-rose-600 hover:bg-rose-100 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="text-xs space-y-1">
                  <div><span className="font-bold text-emerald-700">📈 Boost ({s.productsBoost.length}):</span> {s.productsBoost.join(", ")}</div>
                  {s.productsDrop.length > 0 && <div><span className="font-bold text-rose-700">📉 Drop ({s.productsDrop.length}):</span> {s.productsDrop.join(", ")}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  {editing.id ? `Mavsum #${editing.id}` : "Yangi mavsum"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nom *</label>
                    <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Emoji</label>
                    <Input value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Start oy</label>
                    <select value={editing.startMonth} onChange={e => setEditing({ ...editing, startMonth: Number(e.target.value) })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{i + 1} - {m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">End oy</label>
                    <select value={editing.endMonth} onChange={e => setEditing({ ...editing, endMonth: Number(e.target.value) })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{i + 1} - {m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Kutilgan uplift %</label>
                  <Input type="number" value={editing.expectedUplift} onChange={e => setEditing({ ...editing, expectedUplift: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Boost tovarlar (vergul bilan)</label>
                  <Input value={editing.productsBoost?.join(", ") ?? ""} onChange={e => setEditing({ ...editing, productsBoost: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Drop tovarlar (vergul bilan)</label>
                  <Input value={editing.productsDrop?.join(", ") ?? ""} onChange={e => setEditing({ ...editing, productsDrop: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} />
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
