"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, Eye, Calendar, GripVertical } from "lucide-react"
import Link from "next/link"

const FIELDS = [
  { id: 'klient', label: 'Klient', icon: '👤' },
  { id: 'klient_id', label: 'Klient ID', icon: '#' },
  { id: 'kategoriya_klient', label: 'Klient kategoriya', icon: '🏷️' },
  { id: 'tip_klient', label: 'Klient tipi', icon: '🎯' },
  { id: 'agent', label: 'Agent', icon: '👨‍💼' },
  { id: 'tovar', label: 'Tovar', icon: '📦' },
  { id: 'tovar_id', label: 'Tovar ID', icon: '#' },
  { id: 'tovar_kod', label: 'Tovar kod', icon: '🔢' },
  { id: 'shtrix_kod', label: 'Shtrix kod', icon: '🔢' },
  { id: 'kategoriya_tovar', label: 'Tovar kategoriya', icon: '📂' },
  { id: 'podkategoriya', label: 'Podkategoriya', icon: '📂' },
  { id: 'brend', label: 'Brend', icon: '🏪' },
  { id: 'territoriya', label: 'Territoriya', icon: '🗺️' },
  { id: 'ekspeditor', label: 'Ekspeditor', icon: '🚚' },
  { id: 'tip_narx', label: 'Narx turi', icon: '💰' },
  { id: 'sposob_oplaty', label: 'To\'lov usuli', icon: '💳' },
  { id: 'data_zayavki', label: 'Zayavka sanasi', icon: '📅' },
  { id: 'data_otgruzki', label: 'Otgruzka sanasi', icon: '📅' },
  { id: 'inn', label: 'INN', icon: '🆔' },
  { id: 'manzil', label: 'Manzil', icon: '📍' },
  { id: 'tip_oplaty', label: 'To\'lov tipi', icon: '💰' },
  { id: 'oy_otgruzki', label: 'Oy (otgruzka)', icon: '📅' },
  { id: 'status', label: 'Status', icon: '🚦' },
  { id: 'sklad', label: 'Sklad', icon: '🏠' },
]

const METRICS = [
  { id: 'summa', label: 'Summa', checked: false },
  { id: 'kolichestvo', label: 'Количество', checked: true },
  { id: 'obyom', label: 'Объём', checked: false },
  { id: 'akb', label: 'АКВ', checked: false },
  { id: 'qarz', label: 'Qarz', checked: false },
  { id: 'oplata', label: 'Oplata', checked: false },
]

export default function KonstruktorPage() {
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<string[]>([])
  const [metrics, setMetrics] = useState(METRICS)
  const [draggedField, setDraggedField] = useState<string | null>(null)

  const handleDrop = (target: 'columns' | 'rows', fieldId: string) => {
    if (target === 'columns' && !columns.includes(fieldId)) {
      setColumns([...columns, fieldId])
    } else if (target === 'rows' && !rows.includes(fieldId)) {
      setRows([...rows, fieldId])
    }
  }

  const removeField = (target: 'columns' | 'rows', fieldId: string) => {
    if (target === 'columns') setColumns(columns.filter(c => c !== fieldId))
    else setRows(rows.filter(r => r !== fieldId))
  }

  const usedFields = new Set([...columns, ...rows])
  const availableFields = FIELDS.filter(f => !usedFields.has(f.id))

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/hisobot" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> HISOBOTLAR
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Konstruktor <span className="italic text-[#C75D3C]">отчётов</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Drag-drop pivot table builder · 24 maydon · 6 ko'rsatkich
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Eye className="w-4 h-4" /> Oldindan</Button>
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
              <Button style={{ background: "#C75D3C" }}><Save className="w-4 h-4" /> Saqlash</Button>
            </div>
          </div>

          {/* Settings */}
          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-4">SOZLAMALAR</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-[#6B5B4D] mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[#9C8A6E]" /> Davr
                </label>
                <div className="flex items-center gap-2">
                  <Input type="date" defaultValue="2026-04-01" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                  <span className="text-[#9C8A6E]">—</span>
                  <Input type="date" defaultValue="2026-05-02" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B5B4D] mb-1 block">Status</label>
                <select className="w-full h-11 rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 focus:border-[#C75D3C] focus:outline-none">
                  <option>Yetkazildi, Otgruzka</option>
                  <option>Faqat Yetkazildi</option>
                  <option>Hammasi</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#6B5B4D] mb-1 block">Tip</label>
                <select className="w-full h-11 rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 focus:border-[#C75D3C] focus:outline-none">
                  <option>Zakaz</option>
                  <option>Otkaz</option>
                  <option>Qaytarish</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-[#6B5B4D] mb-2 block">Ko'rsatkichlar (qiymat ustun)</label>
              <div className="flex flex-wrap gap-2">
                {metrics.map((m, i) => (
                  <label key={m.id} className={`flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-lg transition-colors ${m.checked ? "border-[#C75D3C] bg-[#FCE9DD]/40" : "border-[#E8E0D3] bg-white hover:border-[#C75D3C]/50"}`}>
                    <input
                      type="checkbox"
                      checked={m.checked}
                      onChange={() => {
                        const updated = [...metrics]
                        updated[i].checked = !updated[i].checked
                        setMetrics(updated)
                      }}
                      className="w-4 h-4 accent-[#C75D3C]"
                    />
                    <span className="text-sm font-medium text-[#1A1A1A]">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {/* Available Fields */}
          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-3">MAVJUD MAYDONLAR ({availableFields.length})</h3>
            <div className="flex flex-wrap gap-2">
              {availableFields.map(f => (
                <button
                  key={f.id}
                  draggable
                  onDragStart={() => setDraggedField(f.id)}
                  onClick={() => handleDrop('rows', f.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#FCE9DD] hover:bg-[#F5C9B0] text-[#C75D3C] rounded-lg cursor-grab active:cursor-grabbing text-sm font-medium transition-colors border border-[#C75D3C]/20"
                >
                  <GripVertical className="w-3 h-3 opacity-50" />
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              ))}
              {availableFields.length === 0 && (
                <p className="text-sm text-[#9C8A6E]">Hammasi ishlatilgan!</p>
              )}
            </div>
          </Card>

          {/* Drop zones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DropZone
              title="Ustun"
              description="Bu yerga maydonlarni torting (Pivot column)"
              fields={columns}
              onDrop={(id: string) => handleDrop('columns', id)}
              onRemove={(id: string) => removeField('columns', id)}
              accent="#3B82F6"
              draggedField={draggedField}
              getField={(id: string) => FIELDS.find(f => f.id === id)}
            />
            <DropZone
              title="Satr"
              description="Bu yerga maydonlarni torting (Pivot row)"
              fields={rows}
              onDrop={(id: string) => handleDrop('rows', id)}
              onRemove={(id: string) => removeField('rows', id)}
              accent="#C75D3C"
              draggedField={draggedField}
              getField={(id: string) => FIELDS.find(f => f.id === id)}
            />
          </div>

          {/* Preview */}
          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium">PIVOT</div>
                <h3 className="text-2xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Oldindan ko'rish</h3>
              </div>
              <span className="text-sm text-[#9C8A6E]">
                {columns.length} ustun · {rows.length} satr · {metrics.filter(m => m.checked).length} ko'rsatkich
              </span>
            </div>

            {columns.length === 0 && rows.length === 0 ? (
              <div className="text-center py-14 text-[#9C8A6E] bg-[#FAF7F2] rounded-2xl border-2 border-dashed border-[#E8E0D3]">
                <p className="text-base">Maydonlarni "Ustun" yoki "Satr" zonasiga torting</p>
                <p className="text-sm mt-1">Yoki maydon ustiga bosing — avtomatik "Satr"ga qo'shiladi</p>
              </div>
            ) : (
              <div className="bg-[#FAF7F2] rounded-2xl p-5 overflow-x-auto border border-[#E8E0D3]">
                <p className="text-sm text-[#1A1A1A]">
                  Pivot konfiguratsiya tayyor: <strong className="text-[#C75D3C]">{rows.map(r => FIELDS.find(f => f.id === r)?.label).join(' × ')}</strong>
                  {columns.length > 0 && <> × <strong className="text-blue-700">{columns.map(c => FIELDS.find(f => f.id === c)?.label).join(', ')}</strong></>}
                </p>
                <p className="text-xs text-[#9C8A6E] mt-2">"Oldindan" tugmasini bosing — real ma'lumot bilan jadval chiqadi.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function DropZone({ title, description, fields, onDrop, onRemove, accent, draggedField, getField }: any) {
  return (
    <Card
      className="border-2 border-dashed p-6 min-h-[180px] rounded-2xl transition-colors"
      style={{ borderColor: `${accent}55`, background: `${accent}08` }}
      onDragOver={e => e.preventDefault()}
      onDrop={() => { if (draggedField) onDrop(draggedField) }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-6 rounded-full" style={{ background: accent }} />
        <h3 className="text-lg font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{title}</h3>
      </div>
      <p className="text-xs text-[#6B5B4D] mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {fields.length === 0 && (
          <p className="text-sm italic" style={{ color: `${accent}99` }}>Bo'sh — maydonlar shu yerga keladi</p>
        )}
        {fields.map((id: string) => {
          const f = getField(id)
          if (!f) return null
          return (
            <span key={id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: accent }}>
              <span>{f.icon}</span>
              {f.label}
              <button onClick={() => onRemove(id)} className="ml-1 hover:bg-white/20 rounded px-1">×</button>
            </span>
          )
        })}
      </div>
    </Card>
  )
}
