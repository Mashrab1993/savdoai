"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, Save, RefreshCw, Navigation, Crosshair } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function KoordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lat, setLat] = useState("41.272348")
  const [lng, setLng] = useState("69.213521")
  const [address, setAddress] = useState("Toshkent, Sergeli MFY 12-uy")
  const [autoSync, setAutoSync] = useState(true)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/klientlar/${id}`} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Klient koordinatalari · #{id}</h1>
            <p className="text-base text-slate-500 mt-1">Salom Magazin №1 · GPS pozitsiya boshqaruvi</p>
          </div>
          <Button onClick={() => toast.success("Koordinata saqlandi")} className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /> Xarita</h2>
            <div className="relative aspect-video bg-gradient-to-br from-emerald-50 via-blue-50 to-slate-50 rounded-xl overflow-hidden border-2 border-slate-200">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
                backgroundSize: "8% 8%",
                opacity: 0.4,
              }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500 ring-4 ring-emerald-300 ring-offset-2 ring-offset-white shadow-lg animate-pulse" />
                <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs">
                  <div className="font-bold">Salom Magazin №1</div>
                  <div className="font-mono text-slate-500">{lat}, {lng}</div>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="bg-white rounded-lg shadow p-2 hover:bg-slate-50"><Navigation className="w-4 h-4" /></button>
                <button className="bg-white rounded-lg shadow p-2 hover:bg-slate-50"><Crosshair className="w-4 h-4" /></button>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-xs">
                <div className="text-slate-500">Yaqinlik:</div>
                <div className="font-mono">±5m (high accuracy GPS)</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4">GPS Ma'lumot</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Latitude (Kenglik)</label>
                <Input value={lat} onChange={e => setLat(e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Longitude (Uzunlik)</label>
                <Input value={lng} onChange={e => setLng(e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Manzil</label>
                <Input value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} className="rounded" />
                  Auto-sync (har visit'da)
                </label>
                <p className="text-xs text-slate-500 mt-1">Agent har visit'da koordinatani avtomatik yangilaydi</p>
              </div>

              <Button onClick={() => toast.info("GPS olinmoqda...")} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" /> Joriy GPS olish
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Visit tarixi (so'nggi 5)</h2>
          <div className="space-y-2">
            {[
              { date: "2026-05-02 10:25", agent: "Nurmatov A.", lat: "41.272348", lng: "69.213521", accuracy: 5 },
              { date: "2026-04-28 14:12", agent: "Nurmatov A.", lat: "41.272341", lng: "69.213518", accuracy: 8 },
              { date: "2026-04-25 11:30", agent: "Karimov S.", lat: "41.272362", lng: "69.213509", accuracy: 12 },
              { date: "2026-04-22 09:45", agent: "Nurmatov A.", lat: "41.272355", lng: "69.213524", accuracy: 6 },
              { date: "2026-04-18 16:20", agent: "Rasulov B.", lat: "41.272340", lng: "69.213532", accuracy: 14 },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{v.agent}</div>
                  <div className="text-xs text-slate-500 font-mono">{v.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-slate-700">{v.lat}, {v.lng}</div>
                  <div className={`text-xs ${v.accuracy <= 8 ? "text-emerald-700" : v.accuracy <= 12 ? "text-amber-700" : "text-rose-700"}`}>±{v.accuracy}m</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
