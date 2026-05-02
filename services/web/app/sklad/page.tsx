"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Filter, Package, AlertTriangle, MoreVertical, Upload, ChevronDown } from "lucide-react"

const HIERARCHY_TABS = [
  { key: "category", label: "Kategoriya" },
  { key: "subcategory", label: "Podkategoriya" },
  { key: "group", label: "Guruh" },
  { key: "brand", label: "Brend" },
  { key: "manufacturer", label: "Ishlab chiqaruvchi" },
  { key: "segment", label: "Segment" },
  { key: "grouping", label: "Guruhlash" },
]

const MOCK_PRODUCTS = [
  { id: "0_64", code: "1001", artikul: "AR-001", name: "GANJAVALI-Krem", brand: "GANJAVALI", category: "Kosmetika", unit: "Шtuk", stock: 1250, price_sale: 35000, price_purchase: 28000, status: "active" },
  { id: "0_65", code: "1002", artikul: "AR-002", name: "Муроджон ёнги шоколад", brand: "Муроджон", category: "Shirinlik", unit: "Шtuk", stock: 850, price_sale: 12000, price_purchase: 9500, status: "active" },
  { id: "0_66", code: "1003", artikul: "AR-003", name: "SLADUS", brand: "SLADUS", category: "Shirinlik", unit: "Блок", stock: 320, price_sale: 24000, price_purchase: 19000, status: "active" },
  { id: "0_67", code: "1004", artikul: "AR-004", name: "ERFIBLESS", brand: "ERFIBLESS", category: "Shirinlik", unit: "Шtuk", stock: 12, price_sale: 18000, price_purchase: 14000, status: "low" },
  { id: "0_68", code: "1005", artikul: "AR-005", name: "ЁШ ФУТБОЛЧИ", brand: "ЁШ ФУТБОЛЧИ", category: "Shirinlik", unit: "Шtuk", stock: 980, price_sale: 8500, price_purchase: 6500, status: "active" },
  { id: "0_69", code: "1006", artikul: "AR-006", name: "PRIMA GREEN", brand: "PRIMA", category: "Maishiy kimyo", unit: "Кг", stock: 450, price_sale: 45000, price_purchase: 35000, status: "active" },
  { id: "0_70", code: "1007", artikul: "AR-007", name: "ARIEL", brand: "ARIEL", category: "Maishiy kimyo", unit: "Кг", stock: 0, price_sale: 78000, price_purchase: 62000, status: "out" },
  { id: "0_71", code: "1008", artikul: "AR-008", name: "PERSIL", brand: "PERSIL", category: "Maishiy kimyo", unit: "Кг", stock: 320, price_sale: 82000, price_purchase: 65000, status: "active" },
  { id: "0_72", code: "1009", artikul: "AR-009", name: "COLGATE", brand: "COLGATE", category: "Gigiyena", unit: "Шtuk", stock: 1240, price_sale: 12000, price_purchase: 9000, status: "active" },
  { id: "0_73", code: "1010", artikul: "AR-010", name: "HEAD & SHOULDERS", brand: "HEAD & SHOULDERS", category: "Gigiyena", unit: "Шtuk", stock: 540, price_sale: 56000, price_purchase: 45000, status: "active" },
]

export default function SkladPage() {
  const [activeTab, setActiveTab] = useState("category")
  const [search, setSearch] = useState("")

  const filtered = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.includes(search) ||
    p.artikul.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sklad</h1>
            <p className="text-base text-slate-500 mt-1">{filtered.length} tovar · 5 sklad · Jami qoldiq: {filtered.reduce((s, p) => s + p.stock, 0).toLocaleString()} dona</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="w-4 h-4" /> Excel import
            </Button>
            <Button size="lg">
              <Plus className="w-5 h-5" /> Yangi tovar
            </Button>
          </div>
        </div>

        {/* Hierarchy tabs */}
        <Card className="overflow-x-auto">
          <div className="flex border-b border-slate-200">
            {HIERARCHY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Faol tovar" value={filtered.filter(p => p.status === "active").length} color="emerald" icon={Package} />
          <StatCard label="Kam qoldiq" value={filtered.filter(p => p.status === "low").length} color="amber" icon={AlertTriangle} alert />
          <StatCard label="Tugagan" value={filtered.filter(p => p.status === "out").length} color="rose" icon={AlertTriangle} alert />
          <StatCard label="Jami SKU" value={filtered.length} color="blue" icon={Package} />
        </div>

        {/* Filter bar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Nom, kod, artikul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button variant="outline">
              Brend <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline">
              Kategoriya <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4" /> Qo'shimcha
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4" /> Excel
            </Button>
          </div>
        </Card>

        {/* Products table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kod</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Artikul</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nom</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Brend</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategoriya</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">O'lchov</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Qoldiq</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Olish narxi</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Sotish narxi</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.code}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.artikul}</td>
                    <td className="px-4 py-3 text-base font-medium text-slate-900">
                      <a href={`/sklad/${p.id}`} className="hover:text-emerald-600">{p.name}</a>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{p.brand}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.unit}</td>
                    <td className={`px-4 py-3 text-base text-right tabular-nums font-semibold ${
                      p.status === "out" ? "text-rose-600" : p.status === "low" ? "text-amber-600" : "text-slate-900"
                    }`}>
                      {p.stock.toLocaleString()}
                      {p.status === "low" && <span className="ml-1 text-xs">⚠</span>}
                      {p.status === "out" && <span className="ml-1 text-xs">❌</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-500">
                      {p.price_purchase.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-base text-right tabular-nums font-semibold text-slate-900">
                      {p.price_sale.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-slate-200 rounded">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
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

function StatCard({ label, value, color, icon: Icon, alert }: { label: string; value: number; color: 'emerald'|'amber'|'rose'|'blue'; icon: React.ElementType; alert?: boolean }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }
  return (
    <Card className={`border-2 ${colors[color]} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-75">{label}</div>
          <div className="text-3xl font-bold mt-1 tabular-nums">{value}</div>
        </div>
        <Icon className={`w-8 h-8 ${alert && value > 0 ? 'animate-pulse' : ''}`} />
      </div>
    </Card>
  )
}
