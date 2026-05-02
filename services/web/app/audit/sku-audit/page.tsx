"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Filter, Calendar, Download, Package2 } from "lucide-react"
import Link from "next/link"

type Row = {
  id: number; sku: string; brand: string; product: string; agent: string; city: string;
  totalQty: number; clients: number; visits: number; presence: number;
}

const ROWS: Row[] = [
  { id: 1, sku: "CB-075-CHO", brand: "Choco-Boom", product: "Choco-Boom 75g shokoladka", agent: "Babadjanova N.", city: "Toshkent", totalQty: 1240, clients: 48, visits: 124, presence: 89 },
  { id: 2, sku: "CC-1500-CL", brand: "Coca-Cola", product: "Coca-Cola 1.5L PET", agent: "Berdiyev R.", city: "Sergeli", totalQty: 980, clients: 42, visits: 118, presence: 76 },
  { id: 3, sku: "BJ-050-MOL", brand: "Bonjur", product: "Bonjur Молочный 50g", agent: "Sayitqulov M.", city: "Yashnobod", totalQty: 720, clients: 31, visits: 92, presence: 64 },
  { id: 4, sku: "SK-1000-OR", brand: "Sok", product: "Sok Apelsin 1L Tetra", agent: "ДАВЛАТ", city: "Bektemir", totalQty: 540, clients: 28, visits: 84, presence: 58 },
  { id: 5, sku: "PEC-300-YU", brand: "Pechenye", product: "Pechenye Yubileynoye 300g", agent: "BORIEV M.", city: "Mirzo Ulug'bek", totalQty: 420, clients: 22, visits: 68, presence: 45 },
  { id: 6, sku: "BIS-150-TR", brand: "Biskvit", product: "Biskvit Triton 150g", agent: "Турсунов Ж.", city: "Yunusobod", totalQty: 380, clients: 19, visits: 56, presence: 42 },
  { id: 7, sku: "CHA-008-DI", brand: "Chay", product: "Chay Dilmah 8 paket", agent: "Babadjanova N.", city: "Toshkent", totalQty: 340, clients: 18, visits: 52, presence: 38 },
  { id: 8, sku: "VOD-1L-PR", brand: "Voda", product: "Voda Premium 1L", agent: "Berdiyev R.", city: "Yangiyo'l", totalQty: 280, clients: 16, visits: 48, presence: 32 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function SkuAuditPage() {
  const [search, setSearch] = useState("")
  const filtered = ROWS.filter(r => !search || r.product.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase()))

  const totalQty = ROWS.reduce((s, r) => s + r.totalQty, 0)
  const totalVisits = ROWS.reduce((s, r) => s + r.visits, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">SKU audit</h1>
            <p className="text-sm text-slate-500">Mavjudlik, ko'rinish va vizit asosida SKU tahlili</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-3">
            {["Категории клиентов", "Категории продуктов", "Торговая марка", "Продукт", "Агент", "Город", "Мин. к-во"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 3 — май 2 ▾
            </button>
            <Button size="sm" className="gap-1 ml-auto"><Filter className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Package2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami SKU</div>
            <div className="text-2xl font-bold mt-1">{ROWS.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Package2 className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Sotilgan miqdor</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalQty)}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Package2 className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Vizitlar</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalVisits)}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="SKU yoki tovar nomi..." className="max-w-md" />
            <span className="text-sm text-slate-500 ml-auto">{filtered.length} ta SKU</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">SKU</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Бренд</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Продукт</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Город</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Клиенты</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Визиты</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Наличие %</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono">{r.sku}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{r.brand}</td>
                    <td className="border border-slate-300 py-1.5 px-2 font-semibold">{r.product}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{r.agent}</td>
                    <td className="border border-slate-300 py-1.5 px-2">{r.city}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{fmt(r.totalQty)}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{r.clients}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{r.visits}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${r.presence >= 70 ? "bg-emerald-100 text-emerald-700" : r.presence >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {r.presence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
