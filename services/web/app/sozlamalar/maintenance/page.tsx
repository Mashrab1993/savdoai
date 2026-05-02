"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, AlertTriangle, Clock, Save, Calendar, Wrench } from "lucide-react"
import Link from "next/link"

const SCHEDULED = [
  { id: 1, date: "2026-05-15 02:00", duration: 60, type: "DB upgrade", description: "PostgreSQL 16 → 17 update", status: "planned" as const },
  { id: 2, date: "2026-05-22 03:00", duration: 30, type: "Deploy", description: "v26.5 release deployment", status: "planned" as const },
  { id: 3, date: "2026-04-15 02:00", duration: 45, type: "Backup", description: "Yarim yillik full backup", status: "completed" as const },
  { id: 4, date: "2026-04-01 02:30", duration: 20, type: "Security patch", description: "CVE-2026-0042 patch", status: "completed" as const },
]

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [config, setConfig] = useState({
    title: "Tizim texnik xizmatda",
    message: "Iltimos, 30 daqiqa kuting. Texnik xizmat soat 03:30 da tugaydi.",
    expectedEnd: "2026-05-15 03:30",
    allowAdmins: true,
    allowApi: false,
  })

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="w-7 h-7 text-amber-600" />
              Maintenance mode
            </h1>
            <p className="text-sm text-slate-500">Texnik xizmat rejimi · barcha userga "tizim xizmatda" sahifa</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className={`p-5 border-2 ${maintenanceMode ? "bg-rose-50 border-rose-300" : "bg-emerald-50 border-emerald-300"}`}>
          <div className="flex items-center gap-4">
            {maintenanceMode ? <Wrench className="w-12 h-12 text-rose-600 animate-pulse" /> : <Clock className="w-12 h-12 text-emerald-600" />}
            <div className="flex-1">
              <div className={`text-xs font-bold ${maintenanceMode ? "text-rose-700" : "text-emerald-700"}`}>HOZIRGI HOLAT</div>
              <h2 className="text-3xl font-bold">{maintenanceMode ? "🔴 MAINTENANCE MODE" : "🟢 NORMAL"}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {maintenanceMode ? "Tizim hozir foydalanuvchilarga yopiq. Faqat adminlar kira oladi." : "Tizim normal ishlamoqda. Hamma foydalana oladi."}
              </p>
            </div>
            <button onClick={() => setMaintenanceMode(!maintenanceMode)} className={`w-20 h-10 rounded-full relative transition-colors ${maintenanceMode ? "bg-rose-500" : "bg-emerald-500"}`}>
              <span className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-white shadow transition-transform ${maintenanceMode ? "translate-x-10" : ""}`} />
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Xabar sozlash</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Sarlavha</label>
              <Input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Xabar matni</label>
              <textarea value={config.message} onChange={e => setConfig({ ...config, message: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Tugashi kutilgan vaqt</label>
              <Input type="datetime-local" value={config.expectedEnd} onChange={e => setConfig({ ...config, expectedEnd: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="admins" checked={config.allowAdmins} onChange={e => setConfig({ ...config, allowAdmins: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="admins" className="text-sm cursor-pointer">Adminlar tizimga kira oladi</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="api" checked={config.allowApi} onChange={e => setConfig({ ...config, allowApi: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="api" className="text-sm cursor-pointer">API ishlash davom etadi (write+read)</label>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Preview</h2>
          <div className="bg-gradient-to-br from-slate-100 to-amber-50 p-12 rounded-lg text-center">
            <Wrench className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold mb-2">{config.title}</h2>
            <p className="text-base text-slate-600 mb-4">{config.message}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Kutilayotgan tugash: <span className="font-bold font-mono">{config.expectedEnd}</span></span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600" /> Rejalashtirilgan maintenance</h2>
          <div className="space-y-2">
            {SCHEDULED.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg ${s.status === "planned" ? "bg-amber-50/50 border border-amber-200" : "bg-slate-50"}`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.status === "planned" ? "bg-amber-100" : "bg-emerald-100"}`}>
                  {s.status === "planned" ? <Clock className="w-6 h-6 text-amber-600" /> : <Wrench className="w-6 h-6 text-emerald-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{s.type}</div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.date} · davom etadi {s.duration} daq.</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${s.status === "planned" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {s.status === "planned" ? "📅 Rejalashtirilgan" : "✓ Tugadi"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-rose-800">Diqqat!</h3>
              <p className="text-sm text-slate-700 mt-1">
                Maintenance mode yoqilganda barcha agentlar va klientlar tizimga kira olmaydi. Faqat adminlar (agar yoqilgan bo'lsa) ish qila oladi.
                Foydalanuvchilarga 24 soat oldin Telegram orqali xabar berish tavsiya etiladi.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
