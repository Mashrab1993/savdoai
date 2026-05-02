"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Webhook, Pencil, Trash2, X, Send, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"

type Hook = {
  id: number; name: string; url: string; events: string[];
  active: boolean; lastTriggered: string | null;
  successRate: number; sent24h: number;
}

const EVENTS = [
  "order.created", "order.updated", "order.cancelled", "order.delivered",
  "client.created", "client.updated",
  "stock.low", "stock.out",
  "payment.received", "payment.overdue",
  "anomaly.detected",
]

const INITIAL: Hook[] = [
  { id: 1, name: "1C ga zakaz yuborish", url: "https://1c.mashrab.uz/api/webhook/order", events: ["order.created", "order.updated"], active: true, lastTriggered: "2026-05-02 16:25", successRate: 98, sent24h: 38 },
  { id: 2, name: "Telegram bildirishnoma", url: "https://api.telegram.org/bot.../sendMessage", events: ["anomaly.detected", "stock.low"], active: true, lastTriggered: "2026-05-02 14:00", successRate: 100, sent24h: 12 },
  { id: 3, name: "Slack alert (Champions klient)", url: "https://hooks.slack.com/services/T0...", events: ["client.created"], active: true, lastTriggered: "2026-05-01 11:30", successRate: 95, sent24h: 4 },
  { id: 4, name: "Power BI sync", url: "https://eastus.api.powerbi.com/...", events: ["order.created", "payment.received"], active: false, lastTriggered: "2026-04-15", successRate: 88, sent24h: 0 },
  { id: 5, name: "Custom CRM webhook", url: "https://crm.example.com/webhook", events: ["client.updated"], active: true, lastTriggered: "2026-05-02 12:00", successRate: 92, sent24h: 8 },
]

export default function WebhookPage() {
  const [hooks, setHooks] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<Hook> | null>(null)

  const totalSent = hooks.reduce((s, h) => s + h.sent24h, 0)
  const avgSuccess = Math.round(hooks.reduce((s, h) => s + h.successRate, 0) / hooks.length)

  const openAdd = () => setEditing({ id: 0, name: "", url: "", events: [], active: true, lastTriggered: null, successRate: 100, sent24h: 0 })
  const openEdit = (h: Hook) => setEditing({ ...h })

  const save = () => {
    if (!editing) return
    if (!editing.id) setHooks([...hooks, { ...editing as Hook, id: Math.max(0, ...hooks.map(h => h.id)) + 1 }])
    else setHooks(hooks.map(h => h.id === editing.id ? editing as Hook : h))
    setEditing(null)
  }

  const toggleEvent = (event: string) => {
    if (!editing) return
    const events = editing.events ?? []
    setEditing({
      ...editing,
      events: events.includes(event) ? events.filter(e => e !== event) : [...events, event],
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Webhook className="w-7 h-7 text-violet-600" />
              Webhook URLlar
            </h1>
            <p className="text-sm text-slate-500">{hooks.filter(h => h.active).length} faol webhook · 24 soatda {totalSent} ta event · {avgSuccess}% success</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi webhook</Button>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Webhook nima?</h3>
          <p className="text-sm text-slate-700">
            Tizimda voqea sodir bo'lganda (yangi zakaz, klient qo'shildi, qarz muddati o'tdi va h.k.)
            tashqi servisga avtomatik POST so'rov yuborilsin. Bu orqali 1C, Slack, CRM, Power BI bilan integratsiya quriladi.
          </p>
        </Card>

        <div className="space-y-3">
          {hooks.map(h => (
            <Card key={h.id} className={`p-5 ${!h.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${h.successRate >= 95 ? "bg-emerald-100" : "bg-amber-100"}`}>
                  <Webhook className={`w-6 h-6 ${h.successRate >= 95 ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base">{h.name}</h3>
                    {h.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                              : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                  </div>
                  <div className="text-xs font-mono text-blue-700 mb-2 break-all">{h.url}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {h.events.map(e => (
                      <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono">{e}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Oxirgi: {h.lastTriggered ?? "—"}</span>
                    <span>Success: <span className={`font-bold ${h.successRate >= 95 ? "text-emerald-700" : "text-amber-700"}`}>{h.successRate}%</span></span>
                    <span>24h: <span className="font-bold">{h.sent24h}</span> ta event</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="gap-1"><Send className="w-3 h-3" /> Test</Button>
                  <button onClick={() => openEdit(h)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                  <button className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-violet-600" />
                  {editing.id ? `Webhook #${editing.id}` : "Yangi webhook"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Nom *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">URL *</label>
                  <Input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} className="font-mono" placeholder="https://example.com/webhook" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Eventlar (qaysi voqealar yuboriladi)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {EVENTS.map(e => (
                      <label key={e} className="flex items-center gap-2 p-2 bg-slate-50 rounded cursor-pointer hover:bg-slate-100">
                        <input type="checkbox" checked={editing.events?.includes(e) ?? false} onChange={() => toggleEvent(e)} className="w-4 h-4" />
                        <span className="text-xs font-mono">{e}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv</label>
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
