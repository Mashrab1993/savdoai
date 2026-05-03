"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, Save, RefreshCw, Navigation, Crosshair } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' } as const

export default function KoordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lat, setLat] = useState("41.272348")
  const [lng, setLng] = useState("69.213521")
  const [address, setAddress] = useState("Toshkent, Sergeli MFY 12-uy")
  const [autoSync, setAutoSync] = useState(true)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href={`/klientlar/${id}`} className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT #{id}</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Klient <span className="italic text-[#C75D3C]">koordinatalari</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Salom Magazin №1 · GPS pozitsiya boshqaruvi</p>
            </div>
            <Button onClick={() => toast.success("Koordinata saqlandi")} className="gap-2 text-white" style={{ background: "#C75D3C" }}><Save className="w-4 h-4" /> Saqlash</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" style={{ color: "#C75D3C" }} />
                <h2 className="text-xl font-light text-[#1A1A1A]" style={SERIF}>Xarita</h2>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E8E0D3]" style={{ background: "linear-gradient(135deg, #FAF7F2 0%, #F5F1EB 100%)" }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(to right, #E8E0D3 1px, transparent 1px), linear-gradient(to bottom, #E8E0D3 1px, transparent 1px)`,
                  backgroundSize: "8% 8%",
                  opacity: 0.6,
                }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
                  <div className="w-8 h-8 rounded-full ring-4 ring-offset-2 ring-offset-white shadow-lg animate-pulse" style={{ background: "#C75D3C", boxShadow: "0 0 0 4px rgba(199, 93, 60, 0.3)" }} />
                  <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs border border-[#E8E0D3]">
                    <div className="font-medium text-[#1A1A1A]">Salom Magazin №1</div>
                    <div className="font-mono text-[#9C8A6E]">{lat}, {lng}</div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button className="bg-white rounded-lg shadow p-2 hover:bg-[#FAF7F2] border border-[#E8E0D3]"><Navigation className="w-4 h-4 text-[#6B5B4D]" /></button>
                  <button className="bg-white rounded-lg shadow p-2 hover:bg-[#FAF7F2] border border-[#E8E0D3]"><Crosshair className="w-4 h-4 text-[#6B5B4D]" /></button>
                </div>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-xs border border-[#E8E0D3]">
                  <div className="text-[#9C8A6E]">Yaqinlik:</div>
                  <div className="font-mono text-[#1A1A1A]">±5m (high accuracy GPS)</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h2 className="text-xl font-light text-[#1A1A1A] mb-4" style={SERIF}>GPS <span className="italic text-[#C75D3C]">ma'lumot</span></h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Latitude (Kenglik)</label>
                  <Input value={lat} onChange={e => setLat(e.target.value)} className="font-mono border-[#E8E0D3]" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Longitude (Uzunlik)</label>
                  <Input value={lng} onChange={e => setLng(e.target.value)} className="font-mono border-[#E8E0D3]" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1 block">Manzil</label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="border-[#E8E0D3]" />
                </div>

                <div className="border-t border-[#F0EAE0] pt-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-[#1A1A1A]">
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} className="rounded" />
                    Auto-sync (har visit'da)
                  </label>
                  <p className="text-xs text-[#9C8A6E] mt-1">Agent har visit'da koordinatani avtomatik yangilaydi</p>
                </div>

                <Button onClick={() => toast.info("GPS olinmoqda...")} variant="outline" className="w-full gap-2 border-[#E8E0D3] text-[#6B5B4D]">
                  <RefreshCw className="w-4 h-4" /> Joriy GPS olish
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light text-[#1A1A1A] mb-4" style={SERIF}>Visit <span className="italic text-[#C75D3C]">tarixi</span> <span className="text-sm text-[#9C8A6E]">(so'nggi 5)</span></h2>
            <div className="space-y-2">
              {[
                { date: "2026-05-02 10:25", agent: "Nurmatov A.", lat: "41.272348", lng: "69.213521", accuracy: 5 },
                { date: "2026-04-28 14:12", agent: "Nurmatov A.", lat: "41.272341", lng: "69.213518", accuracy: 8 },
                { date: "2026-04-25 11:30", agent: "Karimov S.", lat: "41.272362", lng: "69.213509", accuracy: 12 },
                { date: "2026-04-22 09:45", agent: "Nurmatov A.", lat: "41.272355", lng: "69.213524", accuracy: 6 },
                { date: "2026-04-18 16:20", agent: "Rasulov B.", lat: "41.272340", lng: "69.213532", accuracy: 14 },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#F0EAE0]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "#F5E5D6", color: "#C75D3C" }}>{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-[#1A1A1A]">{v.agent}</div>
                    <div className="text-xs text-[#9C8A6E] font-mono">{v.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-[#6B5B4D]">{v.lat}, {v.lng}</div>
                    <div className={`text-xs ${v.accuracy <= 8 ? "text-emerald-700" : v.accuracy <= 12 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>±{v.accuracy}m</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
