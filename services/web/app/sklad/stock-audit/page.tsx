"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ScanLine, AlertTriangle, CheckCircle2, XCircle, Plus, Calendar, Download, Save } from "lucide-react"
import Link from "next/link"

type AuditRow = {
  id: number; sku: string; product: string; system: number; counted: number | null;
}

const INITIAL: AuditRow[] = [
  { id: 1, sku: "CB-075-CHO", product: "Choco-Boom 75g shokoladka", system: 184, counted: 184 },
  { id: 2, sku: "CC-1500-CL", product: "Coca-Cola 1.5L PET", system: 96, counted: 92 },
  { id: 3, sku: "BJ-050-MOL", product: "Bonjur Молочный 50g", system: 240, counted: 248 },
  { id: 4, sku: "SK-1000-OR", product: "Sok Apelsin 1L Tetra", system: 72, counted: 68 },
  { id: 5, sku: "PEC-300-YU", product: "Pechenye Yubileynoye 300g", system: 48, counted: null },
  { id: 6, sku: "BIS-150-TR", product: "Biskvit Triton 150g", system: 36, counted: 36 },
  { id: 7, sku: "CHA-008-DI", product: "Chay Dilmah 8 paket", system: 124, counted: 120 },
  { id: 8, sku: "VOD-1L-PR", product: "Voda Premium 1L", system: 208, counted: null },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function StockAuditPage() {
  const [rows, setRows] = useState(INITIAL)
  const [scanCode, setScanCode] = useState("")

  const updateCount = (id: number, val: string) => {
    const num = val === "" ? null : Number(val)
    setRows(rows.map(r => r.id === id ? { ...r, counted: num } : r))
  }

  const matches = rows.filter(r => r.counted !== null && r.counted === r.system).length
  const mismatches = rows.filter(r => r.counted !== null && r.counted !== r.system).length
  const pending = rows.filter(r => r.counted === null).length
  const totalSystemValue = rows.reduce((s, r) => s + r.system, 0)
  const totalCounted = rows.reduce((s, r) => s + (r.counted ?? 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Inventarizatsiya (stock audit)</h1>
            <p className="text-sm text-slate-500">Ombor inventarizatsiyasi · {rows.length} ta SKU · 02.05.2026</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash va yopish</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Mos keldi</div>
            <div className="text-2xl font-bold mt-1">{matches}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Farq aniqlandi</div>
            <div className="text-2xl font-bold mt-1">{mismatches}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <XCircle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Sanab bo'lmagan</div>
            <div className="text-2xl font-bold mt-1">{pending}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <ScanLine className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Sistemada / Sanaldi</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalSystemValue)}<span className="text-sm text-slate-500"> / {fmt(totalCounted)}</span></div>
          </Card>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-emerald-600" /> Tez sanash (skaner)
          </h2>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ScanLine className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={scanCode}
                onChange={e => setScanCode(e.target.value)}
                placeholder="SKU kod skanlang..."
                className="pl-12 h-11 text-base font-mono"
              />
            </div>
            <Button className="h-11 px-6 gap-1"><Plus className="w-4 h-4" /> +1 qo'shish</Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">💡 USB-skaner orqali kod skanlanganda mos SKU avtomatik +1 ga oshadi</p>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Inventarizatsiya jadvali</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">SKU</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-right w-32">Sistemada</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-40">Sanaldi</th>
                  <th className="border border-slate-300 py-2 px-2 text-right w-24">Farq</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-32">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const diff = r.counted === null ? null : r.counted - r.system
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 text-center text-slate-400">{i + 1}</td>
                      <td className="border border-slate-300 py-2 px-2 font-mono">{r.sku}</td>
                      <td className="border border-slate-300 py-2 px-2 font-semibold">{r.product}</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(r.system)}</td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <Input
                          type="number"
                          value={r.counted ?? ""}
                          onChange={e => updateCount(r.id, e.target.value)}
                          placeholder="—"
                          className="h-8 text-center font-mono w-32 mx-auto"
                        />
                      </td>
                      <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${
                        diff === null ? "text-slate-300" : diff === 0 ? "text-emerald-700" : diff > 0 ? "text-blue-700" : "text-rose-700"
                      }`}>
                        {diff === null ? "—" : (diff > 0 ? "+" : "") + fmt(diff)}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        {diff === null ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">⏳ Kutilmoqda</span>
                        ) : diff === 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Mos</span>
                        ) : diff > 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">↑ Ortiqcha</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">↓ Yetishmaydi</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
