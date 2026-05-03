"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Camera, Clock, Eye, EyeOff, CheckCircle2, AlertCircle, Calendar, Download } from "lucide-react"
import Link from "next/link"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

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

const STATUS_STYLE: Record<string, { iconBg: string; iconColor: string; label: string; chip: string; accent: string }> = {
  completed: { iconBg: "#ECFDF5", iconColor: "#047857", label: "Bajarildi", chip: "bg-emerald-50 text-emerald-700", accent: "#10B981" },
  missed:    { iconBg: "#F5E5D6", iconColor: "#C75D3C", label: "Tashrif yo'q", chip: "bg-[#F5E5D6] text-[#C75D3C]", accent: "#C75D3C" },
  rejected:  { iconBg: "#FCE9DD", iconColor: "#D97706", label: "Rad etilgan", chip: "bg-[#FCE9DD] text-[#D97706]", accent: "#D97706" },
}

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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Vizit <span className="italic text-[#C75D3C]">tarixi</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · {VISITS.length} ta vizit · konversiya {conversionRate}%</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: "#047857" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#047857" }}>Bajarilgan</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{completedCount}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">jami vizit</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#10B981" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <EyeOff className="w-5 h-5 mb-2" style={{ color: "#C75D3C" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#C75D3C" }}>Tashrif buyurilmagan</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{missedCount}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">o'tkazib yuborilgan</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <AlertCircle className="w-5 h-5 mb-2" style={{ color: "#D97706" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#D97706" }}>Rad etilgan</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{rejectedCount}</div>
              <div className="text-xs text-[#9C8A6E] mt-1">klient rad etdi</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#D97706" }} />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Eye className="w-5 h-5 mb-2" style={{ color: "#7C3AED" }} />
              <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: "#7C3AED" }}>Vizitdan tushum</div>
              <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={SERIF}>{fmt(totalRevenue / 1_000_000)} M</div>
              <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#8B5CF6" }} />
            </Card>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "completed", "missed", "rejected"] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${filter === s ? "text-white" : "bg-white border border-[#E8E0D3] text-[#6B5B4D] hover:bg-[#FAF7F2]"}`} style={filter === s ? { background: "#C75D3C" } : undefined}>
                {s === "all" ? "Hammasi" : s === "completed" ? "Bajarilgan" : s === "missed" ? "Tashrif yo'q" : "Rad etilgan"}
              </button>
            ))}
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light text-[#1A1A1A] mb-4" style={SERIF}>Vizitlar <span className="italic text-[#C75D3C]">timeline</span></h2>
            <div className="space-y-3">
              {filtered.map(v => {
                const style = STATUS_STYLE[v.status]
                const Icon = v.status === "completed" ? CheckCircle2 : v.status === "missed" ? EyeOff : AlertCircle
                return (
                  <div key={v.id} className="p-4 rounded-2xl border border-[#E8E0D3] bg-[#FAF7F2] relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: style.iconBg }}>
                        <Icon className="w-6 h-6" style={{ color: style.iconColor }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-[#1A1A1A]">{v.date} · {v.time}</div>
                            <div className="text-xs text-[#6B5B4D]">{v.agent}</div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${style.chip}`}>{style.label}</span>
                            {v.duration > 0 && <div className="text-xs text-[#9C8A6E] flex items-center justify-end gap-1 mt-1"><Clock className="w-3 h-3" /> {v.duration} daq</div>}
                          </div>
                        </div>

                        {v.status !== "missed" && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-[#F0EAE0]">
                              <div className="text-[#9C8A6E] text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</div>
                              <div className="font-mono tabular-nums font-medium text-[#1A1A1A]">±{v.gpsAccuracy} m</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#F0EAE0]">
                              <div className="text-[#9C8A6E] text-[10px] flex items-center gap-1"><Camera className="w-3 h-3" /> Foto</div>
                              <div className="font-mono tabular-nums font-medium text-[#1A1A1A]">{v.photoCount}</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#F0EAE0]">
                              <div className="text-[#9C8A6E] text-[10px]">Facing</div>
                              <div className={`font-mono tabular-nums font-medium ${v.facingPct >= 80 ? "text-emerald-700" : "text-[#D97706]"}`}>{v.facingPct}%</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#F0EAE0]">
                              <div className="text-[#9C8A6E] text-[10px]">SKU</div>
                              <div className={`font-mono tabular-nums font-medium ${v.skuPct >= 80 ? "text-emerald-700" : "text-[#D97706]"}`}>{v.skuPct}%</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-[#F0EAE0]">
                              <div className="text-[#9C8A6E] text-[10px]">Zakaz</div>
                              {v.orderId ? (
                                <div className="font-mono tabular-nums font-medium text-emerald-700">+{fmt(v.orderSum / 1000)}k</div>
                              ) : (
                                <div className="text-[#E8E0D3]">—</div>
                              )}
                            </div>
                          </div>
                        )}

                        {v.notes && (
                          <div className="mt-2 text-xs text-[#6B5B4D] italic">{v.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: style.accent }} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
