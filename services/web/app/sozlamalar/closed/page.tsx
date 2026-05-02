"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Lock, Save, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SECTIONS = [
  { key: 'all', label: 'Hammasi (jurnal qilinmagan)', desc: 'Barcha tasdiqlanmagan operatsiyalarni qulflash' },
  { key: 'sales_orders', label: 'Sotuv — zakaz/exchange/return', desc: 'Yangi zakaz, обмен, qaytarish bloklanadi' },
  { key: 'cash_payments', label: 'Касса — to\'lov/xarajat', desc: 'Klient to\'lovi va xarajat kiritish bloklanadi' },
  { key: 'cash_income', label: 'Касса — postuplenie', desc: 'Postavshikdan yuk kelishi bloklanadi' },
  { key: 'warehouse_moves', label: 'Sklad — peremesheniya', desc: 'Sklad orasidagi tovar harakati bloklanadi' },
  { key: 'warehouse_adj', label: 'Sklad — korrektirovka', desc: 'Qoldiq tahrirlash bloklanadi' },
  { key: 'warehouse_writeoff', label: 'Sklad — spisanie', desc: 'Hisobdan chiqarish bloklanadi' },
  { key: 'supplier_returns', label: 'Sklad — postavshikga qaytarish', desc: 'Brak bilan postavshikga qaytarish bloklanadi' },
]

export default function PeriodClosingPage() {
  const [closeMode, setCloseMode] = useState<'date' | 'day'>('date')
  const [closeDate, setCloseDate] = useState('2026-04-30')
  const [locks, setLocks] = useState<Record<string, boolean>>({})

  const toggleLock = (key: string) => setLocks({ ...locks, [key]: !locks[key] })

  const handleSave = () => {
    const lockedCount = Object.values(locks).filter(Boolean).length
    if (lockedCount === 0) { toast.error("Hech qaysi blokirovka tanlanmadi"); return }
    toast.success(`${lockedCount} ta blokirovka saqlandi · Sana: ${closeDate}`)
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/sozlamalar" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Sozlamalar
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="w-7 h-7 text-rose-600" /> Davr yopilishi (Закрытия)
          </h1>
          <p className="text-base text-slate-500 mt-1">Buxgalteriya audit uchun davr qulflash · Selective lock tizimi</p>
        </div>

        {/* Warning */}
        <Card className="bg-rose-50 border-2 border-rose-300 p-5 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-rose-900">Diqqat: bu xavfli amaliyot</h3>
            <p className="text-sm text-rose-700 mt-0.5">
              Davr yopilgandan keyin tanlangan operatsiyalarni o'zgartirib bo'lmaydi. Faqat administrator bekor qila oladi.
            </p>
          </div>
        </Card>

        {/* Mode + date */}
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-4">Yopish parametri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Rejim</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCloseMode('date')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium ${closeMode === 'date' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  Sanagacha (jami)
                </button>
                <button
                  onClick={() => setCloseMode('day')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium ${closeMode === 'day' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  1 kun (faqat)
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                {closeMode === 'date' ? 'Yopish sanagacha (kiritilgan kun ham yopiladi)' : 'Faqat shu kun'}
              </label>
              <Input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Lock toggles */}
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-4">Operatsiyalarni tanlang (8 kategoriya)</h3>
          <div className="space-y-2">
            {SECTIONS.map(s => (
              <label key={s.key} className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!locks[s.key]}
                  onChange={() => toggleLock(s.key)}
                  className="w-5 h-5 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{s.label}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.desc}</div>
                </div>
                {locks[s.key] && (
                  <span className="text-rose-600 flex items-center gap-1 text-sm font-medium">
                    <Lock className="w-4 h-4" /> Qulflanadi
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end mt-5 pt-5 border-t">
            <Button size="lg" onClick={handleSave}>
              <Save className="w-5 h-5" /> Saqlash va yopish
            </Button>
          </div>
        </Card>

        {/* History */}
        <Card className="p-5">
          <h3 className="text-base font-semibold mb-3">Yopish tarixi</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">2026-03-31 — Mart oyi yopilgan</span>
              </div>
              <span className="text-xs text-slate-500">samsladus · 2026-04-05</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">2026-02-28 — Fevral oyi yopilgan</span>
              </div>
              <span className="text-xs text-slate-500">samsladus · 2026-03-03</span>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
