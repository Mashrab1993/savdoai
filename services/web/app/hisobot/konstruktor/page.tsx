"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, Eye, Calendar, GripVertical, Plus } from "lucide-react"
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
      <div className="max-w-[1700px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/hisobot" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Hisobotlar
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Eye className="w-4 h-4" /> Oldindan ko'rish
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button>
              <Save className="w-4 h-4" /> Saqlash
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">🏗️ Konstruktor отчётов</h1>
          <p className="text-base text-slate-500 mt-1">Drag-drop pivot table builder · 24 maydon</p>
        </div>

        {/* Settings */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Sozlamalar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Davr
              </label>
              <div className="flex items-center gap-2">
                <Input type="date" defaultValue="2026-04-01" />
                <span className="text-slate-400">—</span>
                <Input type="date" defaultValue="2026-05-02" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <select className="w-full h-11 rounded-lg border-2 border-slate-300 px-4">
                <option>Yetkazildi, Otgruzka</option>
                <option>Faqat Yetkazildi</option>
                <option>Hammasi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Tip</label>
              <select className="w-full h-11 rounded-lg border-2 border-slate-300 px-4">
                <option>Zakaz</option>
                <option>Otkaz</option>
                <option>Qaytarish</option>
              </select>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Ko'rsatkichlar (qiymat ustun)</label>
            <div className="flex flex-wrap gap-3">
              {metrics.map((m, i) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer px-3 py-2 border-2 border-slate-200 rounded-lg hover:border-emerald-300">
                  <input
                    type="checkbox"
                    checked={m.checked}
                    onChange={() => {
                      const updated = [...metrics]
                      updated[i].checked = !updated[i].checked
                      setMetrics(updated)
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>

        {/* Available Fields */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Mavjud maydonlar (24)</h3>
          <div className="flex flex-wrap gap-2">
            {availableFields.map(f => (
              <button
                key={f.id}
                draggable
                onDragStart={() => setDraggedField(f.id)}
                onClick={() => handleDrop('rows', f.id)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-grab active:cursor-grabbing text-sm font-medium transition-colors"
              >
                <GripVertical className="w-3 h-3 opacity-50" />
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
            {availableFields.length === 0 && (
              <p className="text-sm text-slate-500">Hammasi ishlatilgan!</p>
            )}
          </div>
        </Card>

        {/* Drop zones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DropZone
            title="Ustun"
            description="Bu yerga maydonlarni torting (Pivot column)"
            fields={columns}
            onDrop={(id: string) => handleDrop('columns', id)}
            onRemove={(id: string) => removeField('columns', id)}
            color="blue"
            draggedField={draggedField}
            getField={(id: string) => FIELDS.find(f => f.id === id)}
          />
          <DropZone
            title="Satr"
            description="Bu yerga maydonlarni torting (Pivot row)"
            fields={rows}
            onDrop={(id: string) => handleDrop('rows', id)}
            onRemove={(id: string) => removeField('rows', id)}
            color="purple"
            draggedField={draggedField}
            getField={(id: string) => FIELDS.find(f => f.id === id)}
          />
        </div>

        {/* Preview */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">📊 Pivot oldindan ko'rish</h3>
            <span className="text-sm text-slate-500">
              {columns.length} ustun · {rows.length} satr · {metrics.filter(m => m.checked).length} ko'rsatkich
            </span>
          </div>

          {columns.length === 0 && rows.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-base">Maydonlarni "Ustun" yoki "Satr" zonasiga torting</p>
              <p className="text-sm mt-1">Yoki maydon ustiga bosing — avtomatik "Satr"ga qo'shiladi</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 overflow-x-auto">
              <p className="text-sm text-slate-600">
                Pivot konfiguratsiya tayyor: <strong>{rows.map(r => FIELDS.find(f => f.id === r)?.label).join(' × ')}</strong>
                {columns.length > 0 && <> × <strong>{columns.map(c => FIELDS.find(f => f.id === c)?.label).join(', ')}</strong></>}
              </p>
              <p className="text-xs text-slate-500 mt-1">"Oldindan ko'rish" tugmasini bosing — real ma'lumot bilan jadval chiqadi.</p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}

function DropZone({ title, description, fields, onDrop, onRemove, color, draggedField, getField }: any) {
  const colors = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', tag: 'bg-blue-100 text-blue-800' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', tag: 'bg-purple-100 text-purple-800' },
  }[color as 'blue' | 'purple'] || { bg: 'bg-slate-50', border: 'border-slate-300', tag: 'bg-slate-100' }

  return (
    <Card
      className={`${colors.bg} border-2 border-dashed ${colors.border} p-5 min-h-[160px]`}
      onDragOver={e => e.preventDefault()}
      onDrop={() => { if (draggedField) onDrop(draggedField) }}
    >
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2">
        {fields.length === 0 && (
          <p className="text-sm text-slate-400 italic">Bo'sh — maydonlar shu yerga keladi</p>
        )}
        {fields.map((id: string) => {
          const f = getField(id)
          if (!f) return null
          return (
            <span key={id} className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.tag} rounded-lg text-sm font-medium`}>
              <span>{f.icon}</span>
              {f.label}
              <button onClick={() => onRemove(id)} className="ml-1 hover:bg-white/30 rounded">
                ×
              </button>
            </span>
          )
        })}
      </div>
    </Card>
  )
}
