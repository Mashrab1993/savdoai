"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi, useAuth } from "@/hooks/use-api"
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/shared/states"
import { Search, Plus, Download, Filter, Package, AlertTriangle, MoreVertical, Upload, ChevronDown } from "lucide-react"
import Link from "next/link"

interface Tovar {
  id: number
  nomi: string
  kod?: string
  artikul?: string
  brend?: string
  kategoriya?: string
  birlik?: string
  qoldiq: number
  sotish_narxi: number
  olish_narxi?: number
  faol?: boolean
}

const HIERARCHY_TABS = [
  { key: "category", label: "Kategoriya" },
  { key: "subcategory", label: "Podkategoriya" },
  { key: "group", label: "Guruh" },
  { key: "brand", label: "Brend" },
  { key: "manufacturer", label: "Ishlab chiqaruvchi" },
  { key: "segment", label: "Segment" },
  { key: "grouping", label: "Guruhlash" },
]

const MOCK_FALLBACK: Tovar[] = [
  { id: 64, kod: "1001", artikul: "AR-001", nomi: "GANJAVALI-Krem", brend: "GANJAVALI", kategoriya: "Kosmetika", birlik: "Шtuk", qoldiq: 1250, sotish_narxi: 35000, olish_narxi: 28000, faol: true },
  { id: 65, kod: "1002", artikul: "AR-002", nomi: "Муроджон ёнги шоколад", brend: "Муроджон", kategoriya: "Shirinlik", birlik: "Шtuk", qoldiq: 850, sotish_narxi: 12000, olish_narxi: 9500, faol: true },
  { id: 66, kod: "1003", artikul: "AR-003", nomi: "SLADUS", brend: "SLADUS", kategoriya: "Shirinlik", birlik: "Блок", qoldiq: 320, sotish_narxi: 24000, olish_narxi: 19000, faol: true },
  { id: 67, kod: "1004", artikul: "AR-004", nomi: "ERFIBLESS", brend: "ERFIBLESS", kategoriya: "Shirinlik", birlik: "Шtuk", qoldiq: 12, sotish_narxi: 18000, olish_narxi: 14000, faol: true },
  { id: 68, kod: "1005", artikul: "AR-005", nomi: "ЁШ ФУТБОЛЧИ", brend: "ЁШ ФУТБОЛЧИ", kategoriya: "Shirinlik", birlik: "Шtuk", qoldiq: 980, sotish_narxi: 8500, olish_narxi: 6500, faol: true },
  { id: 69, kod: "1006", artikul: "AR-006", nomi: "PRIMA GREEN", brend: "PRIMA", kategoriya: "Maishiy kimyo", birlik: "Кг", qoldiq: 450, sotish_narxi: 45000, olish_narxi: 35000, faol: true },
  { id: 70, kod: "1007", artikul: "AR-007", nomi: "ARIEL", brend: "ARIEL", kategoriya: "Maishiy kimyo", birlik: "Кг", qoldiq: 0, sotish_narxi: 78000, olish_narxi: 62000, faol: true },
  { id: 71, kod: "1008", artikul: "AR-008", nomi: "PERSIL", brend: "PERSIL", kategoriya: "Maishiy kimyo", birlik: "Кг", qoldiq: 320, sotish_narxi: 82000, olish_narxi: 65000, faol: true },
]

export default function SkladPage() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("category")
  const [search, setSearch] = useState("")

  const { data, loading, error } = useApi<Tovar[]>(isAuthenticated ? "/api/v1/tovarlar" : null)
  const tovarlar = data ?? MOCK_FALLBACK

  const filtered = tovarlar.filter(p =>
    p.nomi.toLowerCase().includes(search.toLowerCase()) ||
    (p.kod || "").includes(search) ||
    (p.artikul || "").toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = filtered.filter(p => p.qoldiq > 0 && p.qoldiq < 50).length
  const outOfStock = filtered.filter(p => p.qoldiq === 0).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sklad</h1>
            <p className="text-base text-slate-500 mt-1">
              {filtered.length} tovar · Qoldiq: {filtered.reduce((s, p) => s + p.qoldiq, 0).toLocaleString()} dona
              {!isAuthenticated && <span className="ml-2 text-xs text-amber-600">⚠ Demo data — login kerak</span>}
            </p>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Faol tovar" value={filtered.filter(p => p.faol !== false).length} color="emerald" icon={Package} />
          <StatCard label="Kam qoldiq" value={lowStock} color="amber" icon={AlertTriangle} alert={lowStock > 0} />
          <StatCard label="Tugagan" value={outOfStock} color="rose" icon={AlertTriangle} alert={outOfStock > 0} />
          <StatCard label="Jami SKU" value={filtered.length} color="blue" icon={Package} />
        </div>

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
            <Button variant="outline">Brend <ChevronDown className="w-4 h-4" /></Button>
            <Button variant="outline">Kategoriya <ChevronDown className="w-4 h-4" /></Button>
            <Button variant="outline"><Filter className="w-4 h-4" /> Qo'shimcha</Button>
            <Button variant="outline"><Download className="w-4 h-4" /> Excel</Button>
          </div>
        </Card>

        <Card>
          {loading && <div className="p-6"><LoadingSkeleton rows={6} /></div>}
          {error && <ErrorState message={error} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="Tovar topilmadi" desc="Qidiruvni o'zgartiring" icon={<Package className="w-8 h-8 text-slate-400" />} />
          )}
          {!loading && !error && filtered.length > 0 && (
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
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Olish</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Sotish</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => {
                    const isOut = p.qoldiq === 0
                    const isLow = p.qoldiq > 0 && p.qoldiq < 50
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.kod}</td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-500">{p.artikul}</td>
                        <td className="px-4 py-3 text-base font-medium text-slate-900">
                          <Link href={`/sklad/${p.id}`} className="hover:text-emerald-600">{p.nomi}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{p.brend}</td>
                        <td className="px-4 py-3">
                          {p.kategoriya && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                              {p.kategoriya}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.birlik}</td>
                        <td className={`px-4 py-3 text-base text-right tabular-nums font-semibold ${
                          isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"
                        }`}>
                          {p.qoldiq.toLocaleString()}
                          {isLow && <span className="ml-1 text-xs">⚠</span>}
                          {isOut && <span className="ml-1 text-xs">❌</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-500">
                          {(p.olish_narxi ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-base text-right tabular-nums font-semibold text-slate-900">
                          {p.sotish_narxi.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-slate-200 rounded">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
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
        <Icon className={`w-8 h-8 ${alert ? 'animate-pulse' : ''}`} />
      </div>
    </Card>
  )
}
