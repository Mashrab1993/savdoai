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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                SKU <span className="italic text-[#C75D3C]">audit</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Mavjudlik, ko'rinish va vizit asosida SKU tahlili</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-3">
              {["Категории клиентов", "Категории продуктов", "Торговая марка", "Продукт", "Агент", "Город", "Мин. к-во"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-[#C75D3C]/40 bg-[#FCE9DD] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> апр 3 — май 2 ▾
              </button>
              <Button size="sm" className="gap-1 ml-auto" style={{ background: "#C75D3C" }}><Filter className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package2 className="w-6 h-6 text-emerald-600 mb-2" />
              <div className="text-xs uppercase tracking-[0.15em] font-medium text-emerald-700">Jami SKU</div>
              <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{ROWS.length}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package2 className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-xs uppercase tracking-[0.15em] font-medium text-blue-700">Sotilgan miqdor</div>
              <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalQty)}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </Card>
            <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
              <Package2 className="w-6 h-6 text-[#C75D3C] mb-2" />
              <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">Vizitlar</div>
              <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(totalVisits)}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
            </Card>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="SKU yoki tovar nomi..." className="max-w-md border-[#E8E0D3] bg-[#FAF7F2]" />
              <span className="text-sm text-[#9C8A6E] ml-auto">{filtered.length} ta SKU</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-2.5 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">SKU</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Бренд</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Продукт</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                    <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Город</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Кол-во</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Клиенты</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Визиты</th>
                    <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Наличие %</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-2 px-2 text-center text-[#9C8A6E]">{i + 1}</td>
                      <td className="py-2 px-2 font-mono text-[#1A1A1A]">{r.sku}</td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{r.brand}</td>
                      <td className="py-2 px-2 font-medium text-[#1A1A1A]">{r.product}</td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{r.agent}</td>
                      <td className="py-2 px-2 text-[#6B5B4D]">{r.city}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#1A1A1A]">{fmt(r.totalQty)}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#6B5B4D]">{r.clients}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#6B5B4D]">{r.visits}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-medium text-xs ${r.presence >= 70 ? "bg-emerald-50 text-emerald-700" : r.presence >= 50 ? "bg-[#FCE9DD] text-[#D97706]" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
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
      </div>
    </AdminLayout>
  )
}
