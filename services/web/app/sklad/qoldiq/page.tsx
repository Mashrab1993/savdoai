"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Package, Search, Download, AlertCircle, Building2 } from "lucide-react"
import Link from "next/link"

const SKLADS = ["Markaziy ombor", "Sergeli filial", "Yangiyul filial"]

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", brand: "Bonjur", stocks: [64, 36, 24], price: 5500 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", brand: "Bonjur", stocks: [12, 4, 2], price: 11200 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", brand: "Choco-Boom", stocks: [128, 84, 36], price: 8400 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", brand: "Eco-Drink", stocks: [4, 2, 0], price: 12500 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", brand: "Aqua-Plus", stocks: [48, 32, 16], price: 6400 },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500", brand: "Yubileynoye", stocks: [180, 120, 20], price: 10400 },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", brand: "Coca-Cola", stocks: [96, 64, 24], price: 14800 },
  { id: 8, name: "Fanta 1.5L", code: "FT-15-PET", brand: "Coca-Cola", stocks: [72, 36, 16], price: 14500 },
  { id: 9, name: "Bonjur Sub 200g", code: "BONJ-SUB-200", brand: "Bonjur", stocks: [24, 12, 8], price: 18400 },
  { id: 10, name: "Hilol pechenye 200g", code: "HIL-200", brand: "Hilol", stocks: [54, 18, 12], price: 7820 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function QoldiqPage() {
  const [search, setSearch] = useState("")
  const [activeBrand, setActiveBrand] = useState<string | null>(null)

  const brands = Array.from(new Set(ITEMS.map(i => i.brand)))
  const filtered = ITEMS.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
    const matchBrand = !activeBrand || i.brand === activeBrand
    return matchSearch && matchBrand
  })

  const totalValue = ITEMS.reduce((s, i) => s + i.stocks.reduce((a, b) => a + b, 0) * i.price, 0)
  const totalQty = ITEMS.reduce((s, i) => s + i.stocks.reduce((a, b) => a + b, 0), 0)
  const skladTotals = SKLADS.map((_, si) => ITEMS.reduce((s, i) => s + i.stocks[si] * i.price, 0))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Qoldiq (Real-time stock)</h1>
            <p className="text-base text-slate-500 mt-1">{ITEMS.length} SKU × {SKLADS.length} sklad · Jami: {fmt(totalQty)} dona, {fmt(totalValue / 1_000_000)} M so'm</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SKLADS.map((s, si) => {
            const colors = ["emerald", "blue", "violet"][si]
            return (
              <Card key={s} className={`p-5 bg-gradient-to-br from-${colors}-50 to-${colors}-100/50 border-${colors}-300 border-2`}>
                <Building2 className={`w-7 h-7 text-${colors}-600 bg-white p-1.5 rounded-xl shadow-sm mb-2`} />
                <div className={`text-xs font-bold text-${colors}-700`}>{s}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(skladTotals[si] / 1_000_000)} M so'm</div>
                <div className="text-xs text-slate-600 mt-1">{ITEMS.reduce((s, i) => s + i.stocks[si], 0)} dona</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar yoki kod..." className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setActiveBrand(null)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${!activeBrand ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Hammasi
              </button>
              {brands.map(b => (
                <button key={b} onClick={() => setActiveBrand(b)} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeBrand === b ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {b}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filtered.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600 sticky left-0 bg-white">Tovar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Brand</th>
                  {SKLADS.map((s, si) => (
                    <th key={s} className={`py-3 px-2 font-semibold text-${["emerald", "blue", "violet"][si]}-700 text-right`}>{s}</th>
                  ))}
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right bg-slate-50">Jami dona</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right bg-slate-100">Jami summa</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const total = it.stocks.reduce((a, b) => a + b, 0)
                  const totalSum = total * it.price
                  return (
                    <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 sticky left-0 bg-white">
                        <Link href={`/sklad/tovar/${it.id}`} className="font-semibold text-emerald-700 hover:underline">{it.name}</Link>
                        <div className="text-xs text-slate-400 font-mono">{it.code}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">{it.brand}</td>
                      {it.stocks.map((q, si) => {
                        const colors = ["emerald", "blue", "violet"][si]
                        return (
                          <td key={si} className={`py-3 px-2 text-right font-mono font-bold ${q === 0 ? "text-rose-700" : q < 10 ? "text-amber-700" : `text-${colors}-700`}`}>
                            {q || "—"}
                          </td>
                        )
                      })}
                      <td className="py-3 px-2 text-right font-mono font-bold bg-slate-50">{total}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-800 bg-slate-100">{fmt(totalSum)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td colSpan={2} className="py-3 px-2 sticky left-0 bg-slate-50">Jami:</td>
                  {SKLADS.map((_, si) => (
                    <td key={si} className="py-3 px-2 text-right font-mono">
                      {ITEMS.reduce((s, i) => s + i.stocks[si], 0)}
                    </td>
                  ))}
                  <td className="py-3 px-2 text-right font-mono">{fmt(totalQty)}</td>
                  <td className="py-3 px-2 text-right font-mono text-emerald-800">{fmt(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
