"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, Calendar, Download, Tag, Sparkles } from "lucide-react"
import Link from "next/link"

type ExpiryItem = {
  id: number; sku: string; product: string; batch: string;
  qty: number; unitCost: number; expiryDate: string; daysLeft: number;
  warehouse: string;
}

const ITEMS: ExpiryItem[] = [
  { id: 1, sku: "BJ-050-MOL", product: "Bonjur Молочный 50g", batch: "B-2026-04-A", qty: 48, unitCost: 4_500, expiryDate: "2026-05-04", daysLeft: 2, warehouse: "Yashnobod" },
  { id: 2, sku: "PEC-300-YU", product: "Pechenye Yubileynoye", batch: "B-2026-03-C", qty: 24, unitCost: 6_500, expiryDate: "2026-05-08", daysLeft: 6, warehouse: "Sergeli" },
  { id: 3, sku: "SK-1000-OR", product: "Sok Apelsin 1L", batch: "B-2026-02-B", qty: 36, unitCost: 11_000, expiryDate: "2026-05-12", daysLeft: 10, warehouse: "Yashnobod" },
  { id: 4, sku: "VOD-1L-PR", product: "Voda Premium 1L", batch: "B-2026-04-D", qty: 72, unitCost: 3_500, expiryDate: "2026-05-15", daysLeft: 13, warehouse: "Bektemir" },
  { id: 5, sku: "BIS-150-TR", product: "Biskvit Triton 150g", batch: "B-2026-03-A", qty: 18, unitCost: 5_500, expiryDate: "2026-05-22", daysLeft: 20, warehouse: "Yashnobod" },
  { id: 6, sku: "CHA-008-DI", product: "Chay Dilmah", batch: "B-2025-12-F", qty: 12, unitCost: 12_000, expiryDate: "2026-06-15", daysLeft: 44, warehouse: "Sergeli" },
  { id: 7, sku: "CC-1500-CL", product: "Coca-Cola 1.5L", batch: "B-2026-04-E", qty: 60, unitCost: 14_000, expiryDate: "2026-08-20", daysLeft: 110, warehouse: "Bektemir" },
  { id: 8, sku: "CB-075-CHO", product: "Choco-Boom 75g", batch: "B-2026-04-G", qty: 96, unitCost: 9_000, expiryDate: "2026-09-05", daysLeft: 126, warehouse: "Yashnobod" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const categorize = (days: number) => {
  if (days <= 3) return { label: "🔴 Kritik (3 kun)", color: "bg-rose-100 text-rose-700 border-rose-300", action: "Aktsiya" }
  if (days <= 7) return { label: "🟠 Tezkor (1 hafta)", color: "bg-orange-100 text-orange-700 border-orange-300", action: "Promo" }
  if (days <= 30) return { label: "🟡 1-oy ichida", color: "bg-amber-100 text-amber-700 border-amber-300", action: "Kuzatish" }
  return { label: "🟢 Xavfsiz", color: "bg-emerald-100 text-emerald-700 border-emerald-300", action: "OK" }
}

export default function ExpiryTrackerPage() {
  const sorted = [...ITEMS].sort((a, b) => a.daysLeft - b.daysLeft)
  const totalValue = ITEMS.reduce((s, i) => s + i.qty * i.unitCost, 0)
  const criticalItems = ITEMS.filter(i => i.daysLeft <= 7)
  const criticalValue = criticalItems.reduce((s, i) => s + i.qty * i.unitCost, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Muddat trackeri</h1>
            <p className="text-sm text-slate-500">{ITEMS.length} ta partiya · jami qiymat {fmt(totalValue / 1_000_000)} M so'm · 02.05.2026</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Bugun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Kritik (≤3 kun)</div>
            <div className="text-2xl font-bold mt-1">{ITEMS.filter(i => i.daysLeft <= 3).length}</div>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
            <div className="text-xs font-bold text-orange-700">Tezkor (≤7 kun)</div>
            <div className="text-2xl font-bold mt-1">{ITEMS.filter(i => i.daysLeft <= 7).length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Calendar className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">1-oy ichida</div>
            <div className="text-2xl font-bold mt-1">{ITEMS.filter(i => i.daysLeft <= 30).length}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Tag className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Riskdagi summa</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(criticalValue / 1000)}k</div>
          </Card>
        </div>

        {criticalItems.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-rose-800 text-lg">Diqqat: {criticalItems.length} ta partiya 1-haftada tugaydi!</h3>
                <p className="text-sm text-slate-700 mt-1">
                  Riskdagi summa: <span className="font-bold text-rose-700">{fmt(criticalValue)} so'm</span>.
                  Tavsiya: tezkor promo aktsiya yoki chegirma orqali yo'qotishni minimal qilish.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button className="gap-1 bg-rose-600 hover:bg-rose-700"><Sparkles className="w-4 h-4" /> Tezkor aktsiya yaratish</Button>
                  <Button variant="outline" className="gap-1">Auto-promo: −30%</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Partiyalar (FEFO — First Expiry First Out)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">SKU / Tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Partiya</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Miqdor</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Birlik</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Jami</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Tugash sanasi</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Kun qoldi</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Holat</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Ombor</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Amal</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(item => {
                  const cat = categorize(item.daysLeft)
                  const value = item.qty * item.unitCost
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2">
                        <div className="font-semibold">{item.product}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.sku}</div>
                      </td>
                      <td className="border border-slate-300 py-2 px-2 font-mono text-xs">{item.batch}</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono">{item.qty}</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono text-xs">{fmt(item.unitCost)}</td>
                      <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold">{fmt(value)}</td>
                      <td className="border border-slate-300 py-2 px-2 text-center font-mono text-xs">{item.expiryDate}</td>
                      <td className={`border border-slate-300 py-2 px-2 text-center font-mono font-bold ${item.daysLeft <= 3 ? "text-rose-700" : item.daysLeft <= 7 ? "text-orange-700" : item.daysLeft <= 30 ? "text-amber-700" : "text-emerald-700"}`}>
                        {item.daysLeft}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border ${cat.color}`}>{cat.label}</span>
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-xs">{item.warehouse}</td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        {item.daysLeft <= 7 ? (
                          <Button size="sm" className="h-7 text-xs">Promo</Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs">Kuzat</Button>
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
