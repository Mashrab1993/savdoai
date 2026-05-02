"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Key, Plus, Copy, Eye, EyeOff, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"

type ApiKey = {
  id: number; name: string; key: string; createdAt: string; lastUsed: string;
  scope: "read" | "write" | "admin"; active: boolean; usage30d: number;
}

const KEYS_INIT: ApiKey[] = [
  { id: 1, name: "Production API (web)", key: "sk_live_a8f9e2b3c4d5...", createdAt: "2025-09-12", lastUsed: "2026-05-02 10:25", scope: "admin", active: true, usage30d: 18420 },
  { id: 2, name: "Telegram bot", key: "sk_live_z2x4y5b6c7d8...", createdAt: "2025-10-08", lastUsed: "2026-05-02 11:30", scope: "write", active: true, usage30d: 84200 },
  { id: 3, name: "1C integratsiya", key: "sk_live_p3q4r5s6t7u8...", createdAt: "2026-01-22", lastUsed: "2026-05-01 18:00", scope: "read", active: true, usage30d: 1240 },
  { id: 4, name: "Mobile app (iOS)", key: "sk_live_m1n2o3p4q5r6...", createdAt: "2026-03-05", lastUsed: "2026-04-22 16:15", scope: "write", active: false, usage30d: 0 },
  { id: 5, name: "Webhook endpoint", key: "sk_live_w7x8y9z0a1b2...", createdAt: "2026-04-10", lastUsed: "2026-04-30 09:45", scope: "read", active: true, usage30d: 24 },
]

const SCOPE_COLOR: Record<string, string> = {
  read: "bg-blue-100 text-blue-700",
  write: "bg-amber-100 text-amber-700",
  admin: "bg-rose-100 text-rose-700",
}
const SCOPE_LABEL: Record<string, string> = {
  read: "🔍 Read", write: "✏️ Write", admin: "👑 Admin",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(KEYS_INIT)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const toggleReveal = (id: number) => {
    const next = new Set(revealed)
    if (next.has(id)) next.delete(id); else next.add(id)
    setRevealed(next)
  }

  const toggleActive = (id: number) => {
    setKeys(keys.map(k => k.id === id ? { ...k, active: !k.active } : k))
  }

  const totalUsage = keys.reduce((s, k) => s + k.usage30d, 0)
  const activeCount = keys.filter(k => k.active).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Key className="w-7 h-7 text-amber-600" />
              API Kalitlari
            </h1>
            <p className="text-sm text-slate-500">{activeCount} faol kalit · 30 kunda {fmt(totalUsage)} ta API qo'ng'iroq</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi kalit</Button>
        </div>

        <Card className="p-5 bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-rose-800">Xavfsizlik ogohlantirishi</h3>
              <p className="text-sm text-slate-700 mt-1">
                API kalitlarni hech kim bilan baham ko'rmang! Ularni .env yoki secret manager'da saqlang.
                Agar kalit chiqib ketgan bo'lsa — darhol "Bekor qilish" bosing va yangi kalit yarating.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Mavjud kalitlar</h2>
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className={`p-4 rounded-lg border ${k.active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-300 opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${k.active ? "bg-emerald-100" : "bg-slate-200"}`}>
                    <Key className={`w-5 h-5 ${k.active ? "text-emerald-600" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-base">{k.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLOR[k.scope]}`}>{SCOPE_LABEL[k.scope]}</span>
                      {k.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                 : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">○ Off</span>}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        readOnly
                        value={revealed.has(k.id) ? k.key + "_full_revealed_secret_value" : k.key}
                        className="font-mono text-xs flex-1"
                      />
                      <button onClick={() => toggleReveal(k.id)} className="p-2 text-slate-600 hover:bg-slate-100 rounded">
                        {revealed.has(k.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Yaratildi: <span className="font-mono">{k.createdAt}</span></span>
                      <span>Oxirgi ishlatish: <span className="font-mono">{k.lastUsed}</span></span>
                      <span>30-kun: <span className="font-bold font-mono">{fmt(k.usage30d)}</span> qo'ng'iroq</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(k.id)} className={`w-12 h-6 rounded-full relative transition-colors ${k.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${k.active ? "translate-x-6" : ""}`} />
                    </button>
                    <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
