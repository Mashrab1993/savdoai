"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail, Plus, Pencil, Trash2, X, Send, Eye } from "lucide-react"
import Link from "next/link"

type EmailTemplate = {
  id: number; name: string; subject: string; trigger: string;
  body: string; variables: string[];
  active: boolean; sentCount: number;
}

const INITIAL: EmailTemplate[] = [
  { id: 1, name: "Yangi klient salomi", subject: "Xush kelibsiz, {{client_name}}!",
    trigger: "Klient ro'yxatga olish",
    body: "Hurmatli {{client_name}},\n\nSiz bilan ishlashga tayyor turamiz. Bizning agentimiz {{agent_name}} sizga 24 soat ichida bog'lanadi.\n\nHurmat bilan,\nMashrab Distribution",
    variables: ["{{client_name}}", "{{agent_name}}"], active: true, sentCount: 124 },
  { id: 2, name: "Hisob-faktura yuborish", subject: "Hisob-faktura #{{invoice_number}} — {{client_name}}",
    trigger: "Yangi zakaz",
    body: "Hurmatli {{client_name}},\n\nSizning zakazingiz #{{order_id}} qabul qilindi.\nJami summa: {{total}} so'm.\nYetkazib berish sanasi: {{delivery_date}}.\n\nIlova: hisob-faktura PDF",
    variables: ["{{client_name}}", "{{invoice_number}}", "{{order_id}}", "{{total}}", "{{delivery_date}}"], active: true, sentCount: 840 },
  { id: 3, name: "Qarz eslatma", subject: "Qarz haqida eslatma — {{client_name}}",
    trigger: "Qarz 30 kundan o'tdi",
    body: "Hurmatli {{client_name}},\n\nSizning qarzingiz {{debt_amount}} so'm. Tugash sanasi {{due_date}} edi.\nIltimos, to'lov haqida bizning agentimiz bilan bog'laning.",
    variables: ["{{client_name}}", "{{debt_amount}}", "{{due_date}}"], active: true, sentCount: 36 },
  { id: 4, name: "Promo aktsiya", subject: "🎁 Yangi promo: {{promo_name}}",
    trigger: "Promo boshlash",
    body: "Hurmatli {{client_name}},\n\nBugun yangi aktsiya: {{promo_name}}.\n{{promo_details}}\nDavomiyligi: {{start_date}} — {{end_date}}",
    variables: ["{{client_name}}", "{{promo_name}}", "{{promo_details}}", "{{start_date}}", "{{end_date}}"], active: true, sentCount: 248 },
  { id: 5, name: "Oylik hisobot", subject: "Sizning oylik hisobotingiz — {{month}}",
    trigger: "Har oyning 1-kuni",
    body: "Hurmatli {{client_name}},\n\nO'tgan oyda siz bilan ishladik:\n• Zakazlar: {{orders_count}}\n• Jami summa: {{total_revenue}}\n• Yetkazma: {{shipments_count}}",
    variables: ["{{client_name}}", "{{month}}", "{{orders_count}}", "{{total_revenue}}", "{{shipments_count}}"], active: true, sentCount: 124 },
  { id: 6, name: "Tug'ilgan kun tabrigi", subject: "Tug'ilgan kuningiz bilan, {{client_name}}!",
    trigger: "Klient tug'ilgan kuni",
    body: "Hurmatli {{client_name}},\n\nTug'ilgan kuningiz bilan! Siz uchun maxsus 15% chegirma promokod: {{promo_code}}.\nKodning amal qilish muddati: 1 hafta.",
    variables: ["{{client_name}}", "{{promo_code}}"], active: false, sentCount: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function EmailTemplatesPage() {
  const [tpls, setTpls] = useState(INITIAL)
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null)
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null)

  const totalSent = tpls.reduce((s, t) => s + t.sentCount, 0)

  const openAdd = () => setEditing({ id: 0, name: "", subject: "", trigger: "", body: "", variables: [], active: true, sentCount: 0 })
  const openEdit = (t: EmailTemplate) => setEditing({ ...t })

  const save = () => {
    if (!editing) return
    if (!editing.id) setTpls([...tpls, { ...editing as EmailTemplate, id: Math.max(0, ...tpls.map(t => t.id)) + 1 }])
    else setTpls(tpls.map(t => t.id === editing.id ? editing as EmailTemplate : t))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="w-7 h-7 text-violet-600" />
              Email shablonlari
            </h1>
            <p className="text-sm text-slate-500">{tpls.filter(t => t.active).length} ta faol shablon · jami {fmt(totalSent)} email yuborilgan</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi shablon</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tpls.map(t => (
            <Card key={t.id} className={`p-5 hover:shadow-md transition-shadow ${!t.active ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{t.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">⚡ Trigger: {t.trigger}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded mb-2">
                <div className="text-xs text-slate-500 font-bold mb-0.5">Subject:</div>
                <div className="text-xs font-mono">{t.subject}</div>
              </div>

              <div className="text-xs text-slate-700 mb-3 line-clamp-3 italic bg-slate-50 p-2 rounded">
                {t.body.substring(0, 140)}...
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {t.variables.slice(0, 4).map(v => (
                  <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono">{v}</span>
                ))}
                {t.variables.length > 4 && <span className="text-[10px] text-slate-500">+{t.variables.length - 4}</span>}
              </div>

              <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <Send className="w-3 h-3" />
                {fmt(t.sentCount)} marta yuborilgan
                {t.active && <span className="ml-auto text-emerald-700 font-bold">✓ Faol</span>}
              </div>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setPreviewing(t)} className="gap-1 flex-1"><Eye className="w-3 h-3" /> Ko'rish</Button>
                <button onClick={() => openEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                <button className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>

        {previewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewing(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-violet-600" /> Email preview
                </h2>
                <button onClick={() => setPreviewing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <div className="text-xs text-slate-500 mb-1">Mavzu:</div>
                  <div className="font-bold">{previewing.subject}</div>
                </div>
                <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
                  <div className="text-sm whitespace-pre-line">{previewing.body}</div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  💡 Yuborishda {`{{values}}`} avtomatik almashtiriladi
                </div>
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-violet-600" />
                  {editing.id ? `Email shablon #${editing.id}` : "Yangi email shablon"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Shablon nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Trigger (qachon yuboriladi)</label>
                  <Input value={editing.trigger} onChange={e => setEditing({ ...editing, trigger: e.target.value })} placeholder="Yangi zakaz" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Subject *</label>
                  <Input value={editing.subject} onChange={e => setEditing({ ...editing, subject: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Body</label>
                  <textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} rows={8} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">O'zgaruvchilar (vergul bilan)</label>
                  <Input
                    value={editing.variables?.join(", ") ?? ""}
                    onChange={e => setEditing({ ...editing, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                    className="font-mono"
                    placeholder="{{client_name}}, {{order_id}}"
                  />
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
