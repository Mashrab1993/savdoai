"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Database, Save, RefreshCw, CheckCircle2, AlertCircle, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

const SYNC_LOG = [
  { id: 1, timestamp: "2026-05-02 16:00", direction: "1C → SavdoAI", entity: "Tovarlar", count: 178, status: "success", duration: 12 },
  { id: 2, timestamp: "2026-05-02 14:00", direction: "SavdoAI → 1C", entity: "Zakazlar", count: 38, status: "success", duration: 4 },
  { id: 3, timestamp: "2026-05-02 12:00", direction: "1C → SavdoAI", entity: "Klientlar", count: 624, status: "success", duration: 18 },
  { id: 4, timestamp: "2026-05-02 10:00", direction: "SavdoAI → 1C", entity: "Postupleniya", count: 12, status: "success", duration: 3 },
  { id: 5, timestamp: "2026-05-02 08:00", direction: "1C → SavdoAI", entity: "Narxlar", count: 178, status: "partial", duration: 8 },
  { id: 6, timestamp: "2026-05-01 16:00", direction: "1C → SavdoAI", entity: "Tovarlar", count: 178, status: "success", duration: 11 },
  { id: 7, timestamp: "2026-04-30 22:00", direction: "1C → SavdoAI", entity: "Sklad qoldiq", count: 178, status: "failed", duration: 0 },
]

const ENTITY_CONFIG = [
  { entity: "Tovarlar", direction: "bidirectional", schedule: "Har 2 soatda", lastSync: "16:00", enabled: true },
  { entity: "Klientlar", direction: "bidirectional", schedule: "Har 4 soatda", lastSync: "12:00", enabled: true },
  { entity: "Zakazlar", direction: "out_only", schedule: "Real-time", lastSync: "Live", enabled: true },
  { entity: "Postupleniya", direction: "out_only", schedule: "Real-time", lastSync: "Live", enabled: true },
  { entity: "Narxlar", direction: "in_only", schedule: "Har kuni 08:00", lastSync: "08:00", enabled: true },
  { entity: "Sklad qoldiq", direction: "in_only", schedule: "Har 6 soatda", lastSync: "—", enabled: false },
  { entity: "Foydalanuvchilar", direction: "manual", schedule: "Manual", lastSync: "2026-04-15", enabled: false },
]

const DIRECTION_LABEL: Record<string, string> = {
  bidirectional: "↔ Ikki tomonlama",
  in_only: "→ Faqat 1Cdan",
  out_only: "→ Faqat 1Cga",
  manual: "✋ Manual",
}

export default function Integration1CPage() {
  const [config] = useState({
    serverUrl: "https://1c.mashrab.uz/svodno",
    database: "MashrabDB",
    username: "savdoai_user",
    password: "••••••••••••",
    apiVersion: "v8.3.20",
    timezone: "Asia/Tashkent",
  })

  const successCount = SYNC_LOG.filter(s => s.status === "success").length
  const totalSynced = SYNC_LOG.reduce((s, l) => s + l.count, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Database className="w-7 h-7 text-amber-600" />
              1C Integratsiya
            </h1>
            <p className="text-sm text-slate-500">1C:Savdo bilan ikki tomonlama sinxronizatsiya · {ENTITY_CONFIG.filter(e => e.enabled).length} ta entity</p>
          </div>
          <Button variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Hozir sinx</Button>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <div className="flex-1">
              <div className="text-xs font-bold text-emerald-700">SINX HOLATI</div>
              <h2 className="text-2xl font-bold">✓ Bog'langan va ishlamoqda</h2>
              <p className="text-sm text-slate-600 mt-1">Oxirgi sinx: 16:00 · {totalSynced} ta yozuv · {Math.round((successCount / SYNC_LOG.length) * 100)}% success rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">1C ulanish parametrlari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">Server URL *</label>
              <Input value={config.serverUrl} className="font-mono" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Database</label>
              <Input value={config.database} className="font-mono" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">API versiya</label>
              <Input value={config.apiVersion} className="font-mono" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Username</label>
              <Input value={config.username} className="font-mono" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Password</label>
              <Input value={config.password} type="password" readOnly />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-blue-600" /> Entity sinx sozlamalari</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left">Entity</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Yo'nalish</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Davriylik</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Oxirgi sinx</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {ENTITY_CONFIG.map(e => (
                  <tr key={e.entity} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 font-bold">{e.entity}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{DIRECTION_LABEL[e.direction]}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center text-xs">{e.schedule}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono text-xs">{e.lastSync}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button className={`w-12 h-6 rounded-full relative transition-colors ${e.enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${e.enabled ? "translate-x-6" : ""}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Sinx jurnali (oxirgi 24 soat)</h2>
          <div className="space-y-2">
            {SYNC_LOG.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                s.status === "success" ? "bg-emerald-50/50" :
                s.status === "partial" ? "bg-amber-50/50" :
                "bg-rose-50/50"
              }`}>
                {s.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                {s.status === "partial" && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                {s.status === "failed" && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}

                <div className="flex-1">
                  <div className="font-bold text-sm">{s.entity}</div>
                  <div className="text-xs text-slate-500">{s.direction} · {s.count} ta yozuv · {s.duration}s</div>
                </div>
                <div className="text-xs font-mono text-slate-500">{s.timestamp}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
