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
  const tovarlar: Tovar[] = data ?? MOCK_FALLBACK

  const filtered = tovarlar.filter(p =>
    p.nomi.toLowerCase().includes(search.toLowerCase()) ||
    (p.kod ?? "").includes(search) ||
    (p.artikul ?? "").includes(search)
  )

  const lowStock = filtered.filter(p => p.qoldiq > 0 && p.qoldiq < 50).length
  const outOfStock = filtered.filter(p => p.qoldiq === 0).length

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Sklad <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                {filtered.length} tovar · Qoldiq: {filtered.reduce((s, p) => s + p.qoldiq, 0).toLocaleString()} dona
                {!isAuthenticated && <span className="ml-2 text-xs text-[#D97706]">⚠ Demo data — login kerak</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                <Upload className="w-3.5 h-3.5" /> Excel import
              </button>
              <Button size="lg" style={{ background: "#C75D3C" }}>
                <Plus className="w-5 h-5" /> Yangi tovar
              </Button>
            </div>
          </div>

          {/* Hierarchy tabs */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-x-auto">
            <div className="flex border-b border-[#E8E0D3]">
              {HIERARCHY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-[#C75D3C] text-[#C75D3C] bg-[#FCE9DD]/30"
                      : "border-transparent text-[#6B5B4D] hover:bg-[#FAF7F2]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PremStatCard label="Faol tovar" value={filtered.filter(p => p.faol !== false).length} accent="#10B981" icon={Package} />
            <PremStatCard label="Kam qoldiq" value={lowStock} accent="#D97706" icon={AlertTriangle} alert={lowStock > 0} />
            <PremStatCard label="Tugagan" value={outOfStock} accent="#C75D3C" icon={AlertTriangle} alert={outOfStock > 0} />
            <PremStatCard label="Jami SKU" value={filtered.length} accent="#3B82F6" icon={Package} />
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8A6E]" />
                <Input
                  placeholder="Nom, kod, artikul..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-[#E8E0D3] bg-[#FAF7F2]"
                />
              </div>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">Brend <ChevronDown className="w-4 h-4" /></button>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">Kategoriya <ChevronDown className="w-4 h-4" /></button>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]"><Filter className="w-3.5 h-3.5" /> Qo'shimcha</button>
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]"><Download className="w-3.5 h-3.5" /> Excel</button>
            </div>
          </Card>

          {/* Table */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            {loading && <div className="p-6"><LoadingSkeleton rows={6} /></div>}
            {error && <ErrorState message={error} />}
            {!loading && !error && filtered.length === 0 && (
              <EmptyState title="Tovar topilmadi" desc="Qidiruvni o'zgartiring" icon={<Package className="w-8 h-8 text-[#9C8A6E]" />} />
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kod</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Artikul</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Nom</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brend</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kategoriya</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">O'lchov</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qoldiq</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Olish</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sotish</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const isOut = p.qoldiq === 0
                      const isLow = p.qoldiq > 0 && p.qoldiq < 50
                      return (
                        <tr key={p.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                          <td className="px-4 py-3 text-sm font-mono text-[#9C8A6E]">{p.kod}</td>
                          <td className="px-4 py-3 text-sm font-mono text-[#9C8A6E]">{p.artikul}</td>
                          <td className="px-4 py-3">
                            <Link href={`/sklad/${p.id}`} className="font-medium text-[#1A1A1A] hover:text-[#C75D3C]">{p.nomi}</Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6B5B4D]">{p.brend}</td>
                          <td className="px-4 py-3">
                            {p.kategoriya && (
                              <span className="inline-block px-2.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E0D3] text-xs font-medium text-[#6B5B4D]">
                                {p.kategoriya}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6B5B4D]">{p.birlik}</td>
                          <td className={`px-4 py-3 text-base text-right tabular-nums font-medium ${
                            isOut ? "text-[#C75D3C]" : isLow ? "text-[#D97706]" : "text-[#1A1A1A]"
                          }`}>
                            {p.qoldiq.toLocaleString()}
                            {isLow && <span className="ml-1 text-xs">⚠</span>}
                            {isOut && <span className="ml-1 text-xs">❌</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums text-[#9C8A6E]">
                            {(p.olish_narxi ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-base text-right tabular-nums font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                            {p.sotish_narxi.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <button className="p-1 hover:bg-[#E8E0D3] rounded">
                              <MoreVertical className="w-4 h-4 text-[#9C8A6E]" />
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
      </div>
    </AdminLayout>
  )
}

function PremStatCard({ label, value, accent, icon: Icon, alert }: { label: string; value: number; accent: string; icon: React.ElementType; alert?: boolean }) {
  return (
    <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
        <Icon className={`w-7 h-7 ${alert ? 'animate-pulse' : ''}`} style={{ color: accent }} />
      </div>
      <div className="text-3xl font-medium tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
