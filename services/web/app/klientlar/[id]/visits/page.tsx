"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Camera, Clock, Eye, EyeOff, CheckCircle2, AlertCircle, Calendar, Download } from "lucide-react"
import Link from "next/link"

type Visit = {
  id: number; date: string; time: string; agent: string; duration: number;
  status: "completed" | "missed" | "rejected"; gpsAccuracy: number;
  photoCount: number; orderId: number | null; orderSum: number;
  facingPct: number; skuPct: number; notes: string;
}

const VISITS: Visit[] = [
  { id: 1, date: "2026-05-02", time: "10:25", agent: "Babadjanova N.", duration: 18, status: "completed", gpsAccuracy: 12, photoCount: 6, orderId: 9024, orderSum: 1_840_000, facingPct: 88, skuPct: 92, notes: "Yangi promo qo'shildi" },
  { id: 2, date: "2026-04-30", time: "11:30", agent: "Babadjanova N.", duration: 14, status: "completed", gpsAccuracy: 8, photoCount: 4, orderId: 9018, orderSum: 1_240_000, facingPct: 76, skuPct: 84, notes: "Standart vizit" },
  { id: 3, date: "2026-04-28", time: "14:12", agent: "Babadjanova N.", duration: 22, status: "completed", gpsAccuracy: 15, photoCount: 8, orderId: 9012, orderSum: 2_840_000, facingPct: 92, skuPct: 96, notes: "Katta zakaz - bayram aktsiyasi" },
  { id: 4, date: "2026-04-26", time: "10:15", agent: "Babadjanova N.", duration: 0, status: "missed", gpsAccuracy: 0, photoCount: 0, orderId: null, orderSum: 0, facingPct: 0, skuPct: 0, notes: "Magazin yopiq edi" },
  { id: 5, date: "2026-04-25", time: "16:20", agent: "Babadjanova N.", duration: 12, status: "rejected", gpsAccuracy: 18, photoCount: 2, orderId: null, orderSum: 0, facingPct: 64, skuPct: 72, notes: "Klient nima sababdandir rad etdi" },
  { id: 6, date: "2026-04-22", time: "09:45", agent: "Babadjanova N.", duration: 16, status: "completed", gpsAccuracy: 10, photoCount: 5, orderId: 9000, orderSum: 1_640_000, facingPct: 84, skuPct: 88, notes: "Standart vizit" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ClientVisitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [filter, setFilter] = useState<"all" | "completed" | "missed" | "rejected">("all")

  const filtered = VISITS.filter(v => filter === "all" || v.status === filter)

  const completedCount = VISITS.filter(v => v.status === "completed").length
  const missedCount = VISITS.filter(v => v.status === "missed").length
  const rejectedCount = VISITS.filter(v => v.status === "rejected").length
  const totalRevenue = VISITS.reduce((s, v) => s + v.orderSum, 0)
  const conversionRate = Math.round((completedCount / VISITS.length) * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Vizit tarixi · #{id}</h1>
            <p className="text-sm text-slate-500">Salom Magazin №1 · {VISITS.length} ta vizit · konversiya {conversionRate}%</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Bajarilgan</div>
            <div className="text-2xl font-bold mt-1">{completedCount}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <EyeOff className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Tashrif buyurilmagan</div>
            <div className="text-2xl font-bold mt-1">{missedCount}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Rad etilgan</div>
            <div className="text-2xl font-bold mt-1">{rejectedCount}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Eye className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Vizitdan tushum</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalRevenue / 1_000_000)} M</div>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "completed", "missed", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${filter === s ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 hover:bg-slate-50"}`}>
              {s === "all" ? "Hammasi" : s === "completed" ? "Bajarilgan" : s === "missed" ? "Tashrif yo'q" : "Rad etilgan"}
            </button>
          ))}
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Vizitlar timeline</h2>
          <div className="space-y-3">
            {filtered.map(v => (
              <div key={v.id} className={`p-4 rounded-lg border-2 ${v.status === "completed" ? "bg-emerald-50 border-emerald-200" : v.status === "missed" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${v.status === "completed" ? "bg-emerald-600" : v.status === "missed" ? "bg-rose-600" : "bg-amber-600"}`}>
                    {v.status === "completed" ? <CheckCircle2 className="w-6 h-6 text-white" /> : v.status === "missed" ? <EyeOff className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-bold">{v.date} · {v.time}</div>
                        <div className="text-xs text-slate-600">{v.agent}</div>
                      </div>
                      <div className="text-right">
                        {v.status === "completed" && <div className="text-xs font-bold text-emerald-700">✓ Bajarildi</div>}
                        {v.status === "missed" && <div className="text-xs font-bold text-rose-700">✕ Tashrif yo'q</div>}
                        {v.status === "rejected" && <div className="text-xs font-bold text-amber-700">⚠ Rad etilgan</div>}
                        {v.duration > 0 && <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-1"><Clock className="w-3 h-3" /> {v.duration} daq</div>}
                      </div>
                    </div>

                    {v.status !== "missed" && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                        <div className="bg-white p-2 rounded">
                          <div className="text-slate-500 text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</div>
                          <div className="font-mono font-bold">±{v.gpsAccuracy} m</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-slate-500 text-[10px] flex items-center gap-1"><Camera className="w-3 h-3" /> Foto</div>
                          <div className="font-mono font-bold">{v.photoCount}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-slate-500 text-[10px]">Facing</div>
                          <div className={`font-mono font-bold ${v.facingPct >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{v.facingPct}%</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-slate-500 text-[10px]">SKU</div>
                          <div className={`font-mono font-bold ${v.skuPct >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{v.skuPct}%</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="text-slate-500 text-[10px]">Zakaz</div>
                          {v.orderId ? (
                            <div className="font-mono font-bold text-emerald-700">+{fmt(v.orderSum / 1000)}k</div>
                          ) : (
                            <div className="text-slate-300">—</div>
                          )}
                        </div>
                      </div>
                    )}

                    {v.notes && (
                      <div className="mt-2 text-xs text-slate-600 italic">💬 {v.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
