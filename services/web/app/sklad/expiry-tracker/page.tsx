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
  if (days <= 3) return { label: "🔴 Kritik", color: "bg-[#F5E5D6] text-[#C75D3C] border-[#C75D3C]/30", action: "Aktsiya" }
  if (days <= 7) return { label: "🟠 Tezkor", color: "bg-[#FCE9DD] text-[#D97706] border-[#D97706]/30", action: "Promo" }
  if (days <= 30) return { label: "🟡 1-oy", color: "bg-yellow-50 text-yellow-700 border-yellow-300", action: "Kuzatish" }
  return { label: "🟢 Xavfsiz", color: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "OK" }
}

export default function ExpiryTrackerPage() {
  const sorted = [...ITEMS].sort((a, b) => a.daysLeft - b.daysLeft)
  const totalValue = ITEMS.reduce((s, i) => s + i.qty * i.unitCost, 0)
  const criticalItems = ITEMS.filter(i => i.daysLeft <= 7)
  const criticalValue = criticalItems.reduce((s, i) => s + i.qty * i.unitCost, 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/sklad" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · SKLAD</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Muddat <span className="italic text-[#C75D3C]">trackeri</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{ITEMS.length} ta partiya · jami qiymat <span className="font-medium text-[#1A1A1A]">{fmt(totalValue / 1_000_000)} M</span> so'm · 02.05.2026</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> Bugun</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={AlertTriangle} accent="#C75D3C" label="Kritik (≤3 kun)" value={ITEMS.filter(i => i.daysLeft <= 3).length.toString()} />
            <KpiCard icon={AlertTriangle} accent="#D97706" label="Tezkor (≤7 kun)" value={ITEMS.filter(i => i.daysLeft <= 7).length.toString()} />
            <KpiCard icon={Calendar} accent="#EAB308" label="1-oy ichida" value={ITEMS.filter(i => i.daysLeft <= 30).length.toString()} />
            <KpiCard icon={Tag} accent="#10B981" label="Riskdagi summa" value={`${fmt(criticalValue / 1000)}k`} />
          </div>

          {criticalItems.length > 0 && (
            <Card className="p-6 bg-white border-2 border-[#C75D3C]/40 shadow-sm rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#C75D3C]" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">DIQQAT</div>
                  <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{criticalItems.length} ta partiya 1-haftada tugaydi</h3>
                  <p className="text-sm text-[#6B5B4D] mt-2">
                    Riskdagi summa: <span className="font-medium text-[#C75D3C] tabular-nums">{fmt(criticalValue)} so'm</span>.
                    Tavsiya: tezkor promo aktsiya yoki chegirma orqali yo'qotishni minimal qilish.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button className="gap-1" style={{ background: "#C75D3C" }}><Sparkles className="w-4 h-4" /> Tezkor aktsiya</Button>
                    <Button variant="outline" className="gap-1 border-[#E8E0D3] text-[#6B5B4D]">Auto-promo: −30%</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Partiyalar (FEFO — First Expiry First Out)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU / Tovar</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Partiya</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Miqdor</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Birlik</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tugash sanasi</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kun qoldi</th>
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ombor</th>
                    <th className="py-3 px-2 text-center w-24 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(item => {
                    const cat = categorize(item.daysLeft)
                    const value = item.qty * item.unitCost
                    return (
                      <tr key={item.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2">
                          <div className="font-medium text-[#1A1A1A]">{item.product}</div>
                          <div className="text-xs text-[#9C8A6E] font-mono">{item.sku}</div>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs text-[#6B5B4D]">{item.batch}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{item.qty}</td>
                        <td className="py-3 px-2 text-right font-mono text-xs text-[#6B5B4D]">{fmt(item.unitCost)}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(value)}</td>
                        <td className="py-3 px-2 text-center font-mono text-xs text-[#6B5B4D]">{item.expiryDate}</td>
                        <td className={`py-3 px-2 text-center font-mono font-medium ${item.daysLeft <= 3 ? "text-[#C75D3C]" : item.daysLeft <= 7 ? "text-[#D97706]" : item.daysLeft <= 30 ? "text-yellow-700" : "text-emerald-700"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {item.daysLeft}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${cat.color}`}>{cat.label}</span>
                        </td>
                        <td className="py-3 px-2 text-xs text-[#6B5B4D]">{item.warehouse}</td>
                        <td className="py-3 px-2 text-center">
                          {item.daysLeft <= 7 ? (
                            <Button size="sm" className="h-7 text-xs" style={{ background: "#C75D3C" }}>Promo</Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-[#E8E0D3] text-[#6B5B4D]">Kuzat</Button>
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
      <div className="text-2xl font-medium font-mono tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
