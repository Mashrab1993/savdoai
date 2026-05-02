"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, FileText, Pencil, Trash2, X, Eye, Download } from "lucide-react"
import Link from "next/link"

type Template = {
  id: number; name: string; type: "invoice" | "consignment" | "receipt" | "contract" | "report";
  format: "pdf" | "excel" | "word";
  variables: string[];
  isDefault: boolean;
  active: boolean;
  usageCount: number;
}

const TYPE_LABEL: Record<string, string> = {
  invoice: "🧾 Hisob-faktura",
  consignment: "📦 Konsignatsiya",
  receipt: "✅ Kvitansiya",
  contract: "📝 Shartnoma",
  report: "📊 Hisobot",
}
const TYPE_COLOR: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-700",
  consignment: "bg-emerald-100 text-emerald-700",
  receipt: "bg-amber-100 text-amber-700",
  contract: "bg-violet-100 text-violet-700",
  report: "bg-rose-100 text-rose-700",
}

const INITIAL: Template[] = [
  { id: 1, name: "Standart hisob-faktura", type: "invoice", format: "pdf", variables: ["{{client}}", "{{products}}", "{{total}}", "{{date}}", "{{inn}}"], isDefault: true, active: true, usageCount: 1240 },
  { id: 2, name: "Tovar konsignatsiyasi (TT-2)", type: "consignment", format: "pdf", variables: ["{{driver}}", "{{vehicle}}", "{{products}}", "{{from_address}}", "{{to_address}}"], isDefault: true, active: true, usageCount: 840 },
  { id: 3, name: "Kassa kvitansiyasi", type: "receipt", format: "pdf", variables: ["{{order_id}}", "{{amount}}", "{{cashier}}", "{{date}}"], isDefault: true, active: true, usageCount: 2480 },
  { id: 4, name: "Distribyutorlik shartnoma", type: "contract", format: "word", variables: ["{{client}}", "{{terms}}", "{{products}}", "{{discount}}", "{{validity}}"], isDefault: true, active: true, usageCount: 18 },
  { id: 5, name: "Oylik P&L hisobot", type: "report", format: "excel", variables: ["{{month}}", "{{revenue}}", "{{expense}}", "{{profit}}", "{{breakdown}}"], isDefault: false, active: true, usageCount: 12 },
  { id: 6, name: "VIP klient maxsus shartnoma", type: "contract", format: "pdf", variables: ["{{client}}", "{{exclusivity}}", "{{vip_terms}}"], isDefault: false, active: true, usageCount: 4 },
  { id: 7, name: "Eski shablon (snyat)", type: "invoice", format: "pdf", variables: [], isDefault: false, active: false, usageCount: 480 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DocumentTemplatePage() {
  const [tpls, setTpls] = useState(INITIAL)
  const [filter, setFilter] = useState<string>("all")
  const [editing, setEditing] = useState<Partial<Template> | null>(null)

  const filtered = tpls.filter(t => filter === "all" || t.type === filter)

  const counts = Object.keys(TYPE_LABEL).reduce((acc, k) => ({ ...acc, [k]: tpls.filter(t => t.type === k).length }), {} as Record<string, number>)

  const openAdd = () => setEditing({ id: 0, name: "", type: "invoice", format: "pdf", variables: [], isDefault: false, active: true, usageCount: 0 })
  const openEdit = (t: Template) => setEditing({ ...t })

  const save = () => {
    if (!editing) return
    if (!editing.id) setTpls([...tpls, { ...editing as Template, id: Math.max(0, ...tpls.map(t => t.id)) + 1 }])
    else setTpls(tpls.map(t => t.id === editing.id ? editing as Template : t))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-violet-600" />
              Hujjat shablonlari
            </h1>
            <p className="text-sm text-slate-500">{tpls.filter(t => t.active).length} ta faol shablon · jami {fmt(tpls.reduce((s, t) => s + t.usageCount, 0))} marta ishlatilgan</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi shablon</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <button onClick={() => setFilter("all")} className={`p-3 rounded-lg border-2 ${filter === "all" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="text-xs font-bold">Hammasi</div>
            <div className="text-2xl font-bold mt-1">{tpls.length}</div>
          </button>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={`p-3 rounded-lg border-2 ${filter === k ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <div className="text-xs font-bold">{v}</div>
              <div className="text-2xl font-bold mt-1">{counts[k]}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => (
            <Card key={t.id} className={`p-5 hover:shadow-md transition-shadow ${!t.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[t.type]}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">{t.name}</h3>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLOR[t.type]}`}>{TYPE_LABEL[t.type]}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono uppercase">{t.format}</span>
                    {t.isDefault && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⭐ Default</span>}
                  </div>
                </div>
              </div>

              {t.variables.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-slate-500 mb-1">O'zgaruvchilar:</div>
                  <div className="flex flex-wrap gap-1">
                    {t.variables.slice(0, 5).map(v => (
                      <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono">{v}</span>
                    ))}
                    {t.variables.length > 5 && <span className="text-[10px] text-slate-500">+{t.variables.length - 5}</span>}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 mb-3">
                {fmt(t.usageCount)} marta ishlatilgan · {t.active ? "✓ faol" : "○ off"}
              </div>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="gap-1 flex-1"><Eye className="w-3 h-3" /> Ko'rish</Button>
                <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"><Download className="w-4 h-4" /></button>
                <button className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-600" />
                  {editing.id ? `Shablon #${editing.id}` : "Yangi shablon"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Shablon nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Turi</label>
                    <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as any })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Format</label>
                    <select value={editing.format} onChange={e => setEditing({ ...editing, format: e.target.value as any })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="word">Word</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">O'zgaruvchilar (vergul bilan ajrating)</label>
                  <Input
                    value={editing.variables?.join(", ") ?? ""}
                    onChange={e => setEditing({ ...editing, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                    placeholder="{{client}}, {{products}}, {{total}}"
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="default" checked={editing.isDefault} onChange={e => setEditing({ ...editing, isDefault: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="default" className="text-sm cursor-pointer">Default shablon (bu turdagi)</label>
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
