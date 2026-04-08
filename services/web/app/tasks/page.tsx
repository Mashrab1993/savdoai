"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertCircle, Plus, X } from "lucide-react"

const HOLAT_RANG: Record<string, string> = {
  yangi: "border-blue-300 bg-blue-50",
  jarayonda: "border-amber-300 bg-amber-50",
  bajarildi: "border-emerald-300 bg-emerald-50",
  bekor: "border-gray-300 bg-gray-50 opacity-50",
}
const MUHIMLIK_EMOJI: Record<string, string> = { kritik: "🔴", yuqori: "🟠", oddiy: "🟡", past: "⚪" }
const TURI_EMOJI: Record<string, string> = { umumiy: "📋", sotuv: "💰", qarz_yigish: "💳", foto: "📸", tashrif: "📍", ombor: "📦" }

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState("all")
  const [form, setForm] = useState({ sarlavha: "", tavsif: "", turi: "umumiy", muhimlik: "oddiy", muddat: "", klient_id: "" })

  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  useEffect(() => {
    const url = filter === "all" ? `${API}/api/topshiriq` : `${API}/api/topshiriq?holat=${filter}`
    fetch(url, { headers: h }).then(r => r.ok ? r.json() : []).then(setTasks).finally(() => setLoading(false))
  }, [filter])

  const create = async () => {
    const res = await fetch(`${API}/api/topshiriq`, { method: "POST", headers: h, body: JSON.stringify(form) })
    if (res.ok) {
      const d = await res.json()
      setTasks(p => [{ id: d.id, ...form, holat: "yangi", yaratilgan: new Date().toISOString() }, ...p])
      setShowCreate(false)
      setForm({ sarlavha: "", tavsif: "", turi: "umumiy", muhimlik: "oddiy", muddat: "", klient_id: "" })
    }
  }

  const updateHolat = async (id: number, holat: string) => {
    await fetch(`${API}/api/topshiriq/${id}`, { method: "PUT", headers: h, body: JSON.stringify({ holat }) })
    setTasks(p => p.map(t => t.id === id ? { ...t, holat } : t))
  }

  const counts = {
    yangi: tasks.filter((t: any) => t.holat === "yangi").length,
    jarayonda: tasks.filter((t: any) => t.holat === "jarayonda").length,
    bajarildi: tasks.filter((t: any) => t.holat === "bajarildi").length,
  }

  return (
    <AdminLayout title="📋 Topshiriqlar">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { val: "all", label: `Barchasi (${tasks.length})` },
              { val: "yangi", label: `🔵 Yangi (${counts.yangi})` },
              { val: "jarayonda", label: `🟡 Jarayonda (${counts.jarayonda})` },
              { val: "bajarildi", label: `🟢 Bajarildi (${counts.bajarildi})` },
            ].map(f => (
              <button key={f.val} onClick={() => setFilter(f.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === f.val ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"
                }`}>{f.label}</button>
            ))}
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi topshiriq
          </Button>
        </div>

        {/* Task cards */}
        <div className="space-y-2">
          {tasks.map((t: any) => (
            <div key={t.id} className={`p-4 rounded-xl border-l-4 bg-white dark:bg-gray-900 border ${HOLAT_RANG[t.holat] || ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{MUHIMLIK_EMOJI[t.muhimlik] || "📋"}</span>
                    <span>{TURI_EMOJI[t.turi] || "📋"}</span>
                    <span className="text-sm font-semibold">{t.sarlavha}</span>
                  </div>
                  {t.tavsif && <p className="text-xs text-gray-500 mb-1">{t.tavsif}</p>}
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    {t.klient_nomi && <span>👤 {t.klient_nomi}</span>}
                    {t.muddat && <span>📅 {t.muddat}</span>}
                    <span>🕐 {t.yaratilgan ? new Date(t.yaratilgan).toLocaleDateString("uz") : ""}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {t.holat === "yangi" && (
                    <button onClick={() => updateHolat(t.id, "jarayonda")}
                      className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">▶ Boshlash</button>
                  )}
                  {t.holat === "jarayonda" && (
                    <button onClick={() => updateHolat(t.id, "bajarildi")}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">✅ Bajarildi</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400 text-sm">Topshiriqlar yo&apos;q</div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi topshiriq</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Sarlavha" value={form.sarlavha} onChange={e => setForm(p => ({ ...p, sarlavha: e.target.value }))} />
            <Input placeholder="Tavsif (ixtiyoriy)" value={form.tavsif} onChange={e => setForm(p => ({ ...p, tavsif: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.turi} onValueChange={v => setForm(p => ({ ...p, turi: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TURI_EMOJI).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.muhimlik} onValueChange={v => setForm(p => ({ ...p, muhimlik: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MUHIMLIK_EMOJI).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={form.muddat} onChange={e => setForm(p => ({ ...p, muddat: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!form.sarlavha} className="bg-emerald-600">Yaratish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
