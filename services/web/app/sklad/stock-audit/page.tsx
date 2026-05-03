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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Stock <span className="italic text-[#C75D3C]">audit</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Ombor inventarizatsiyasi · {rows.length} ta SKU · 02.05.2026</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Bugun</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
            <Button className="gap-2" style={{ background: "#C75D3C" }}><Save className="w-4 h-4" /> Saqlash</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle2} accent="#10B981" label="Mos keldi" value={matches.toString()} />
            <KpiCard icon={AlertTriangle} accent="#C75D3C" label="Farq aniqlandi" value={mismatches.toString()} />
            <KpiCard icon={XCircle} accent="#D97706" label="Sanab bo'lmagan" value={pending.toString()} />
            <KpiCard icon={ScanLine} accent="#3B82F6" label="Sistema / Sanaldi" value={`${fmt(totalSystemValue)} / ${fmt(totalCounted)}`} />
          </div>

          <Card className="p-6 bg-white border-2 border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <ScanLine className="w-5 h-5 text-[#C75D3C]" /> Tez sanash (skaner)
            </h2>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <ScanLine className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input
                  value={scanCode}
                  onChange={e => setScanCode(e.target.value)}
                  placeholder="SKU kod skanlang..."
                  className="pl-12 h-11 text-base font-mono border-[#E8E0D3] bg-[#FAF7F2]"
                />
              </div>
              <Button className="h-11 px-6 gap-1" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> +1 qo'shish</Button>
            </div>
            <p className="text-xs text-[#9C8A6E] mt-2">💡 USB-skaner orqali kod skanlanganda mos SKU avtomatik +1 ga oshadi</p>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Inventarizatsiya jadvali</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                    <th className="py-3 px-2 text-right w-32 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sistema</th>
                    <th className="py-3 px-2 text-center w-40 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sanaldi</th>
                    <th className="py-3 px-2 text-right w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Farq</th>
                    <th className="py-3 px-2 text-center w-32 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const diff = r.counted === null ? null : r.counted - r.system
                    return (
                      <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 text-center text-[#9C8A6E]">{i + 1}</td>
                        <td className="py-3 px-2 font-mono text-xs text-[#1A1A1A]">{r.sku}</td>
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.product}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(r.system)}</td>
                        <td className="py-3 px-2 text-center">
                          <Input
                            type="number"
                            value={r.counted ?? ""}
                            onChange={e => updateCount(r.id, e.target.value)}
                            placeholder="—"
                            className="h-8 text-center font-mono w-32 mx-auto border-[#E8E0D3] bg-[#FAF7F2]"
                          />
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-medium ${
                          diff === null ? "text-[#9C8A6E]" : diff === 0 ? "text-emerald-700" : diff > 0 ? "text-blue-700" : "text-[#C75D3C]"
                        }`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {diff === null ? "—" : (diff > 0 ? "+" : "") + fmt(diff)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {diff === null ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D] font-medium">⏳ Kutilmoqda</span>
                          ) : diff === 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">✓ Mos</span>
                          ) : diff > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">↑ Ortiqcha</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C] font-medium">↓ Yetishmaydi</span>
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
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
