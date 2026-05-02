"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi, useAuth } from "@/hooks/use-api"
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/shared/states"
import { Search, Plus, Download, Filter, MoreVertical, Phone, MapPin, Users } from "lucide-react"
import Link from "next/link"

interface Klient {
  id: number
  nomi: string
  telefon?: string
  manzil?: string
  kategoriya?: string
  hudud?: string
  agent_id?: number
  qarz?: number
}

const MOCK_FALLBACK: Klient[] = [
  { id: 36, nomi: "Аббос Ака Мирбозор №55", telefon: "+998 90 123 45 67", kategoriya: "Розница", hudud: "Mirbozor", qarz: -1683800 },
  { id: 5301, nomi: "Булунгур Астановка №3", telefon: "+998 90 234 56 78", kategoriya: "Розница", hudud: "Bulungʻur", qarz: 0 },
  { id: 5776, nomi: "Диайди №99", telefon: "+998 90 345 67 89", kategoriya: "Опт", hudud: "Busygina", qarz: -100000 },
  { id: 1558, nomi: "Салим Гараж (Вокзал) №6", telefon: "+998 90 456 78 90", kategoriya: "Опт", hudud: "Vokzal", qarz: 0 },
  { id: 4797, nomi: "Akmal Aka Narimon №88-Машраб", telefon: "+998 90 567 89 01", kategoriya: "Розница", hudud: "Narimon", qarz: -4824300 },
  { id: 4206, nomi: "Бегзод Маркет № 0 (Бигзод Маркет)", telefon: "+998 91 316-16-66", kategoriya: "Розница", hudud: "Sayfullin", qarz: 1500000 },
]

export default function ClientsPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "debt">("all")

  // Fetch real klientlar from API if logged in, else use mock
  const { data, loading, error } = useApi<Klient[]>(isAuthenticated ? "/api/v1/klientlar" : null)
  const klientlar: Klient[] = data ?? MOCK_FALLBACK

  const filtered = klientlar.filter(c => {
    if (filter === "debt" && (c.qarz ?? 0) >= 0) return false
    return c.nomi.toLowerCase().includes(search.toLowerCase()) ||
      String(c.id).includes(search)
  })

  const totalDebt = filtered.reduce((s, c) => s + (c.qarz ?? 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klientlar</h1>
            <p className="text-base text-slate-500 mt-1">
              Jami {filtered.length} klient · Balans: <span className={totalDebt < 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>{totalDebt.toLocaleString('uz-UZ')} so'm</span>
              {!isAuthenticated && <span className="ml-2 text-xs text-amber-600">⚠ Demo data — login kerak</span>}
            </p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi klient
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Nom yoki ID bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>

            <div className="flex gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                Barchasi ({klientlar.length})
              </FilterButton>
              <FilterButton active={filter === "active"} onClick={() => setFilter("active")}>
                Faol
              </FilterButton>
              <FilterButton active={filter === "debt"} onClick={() => setFilter("debt")}>
                Qarzdor
              </FilterButton>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline">
                <Filter className="w-4 h-4" /> Qo'shimcha filter
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          {loading && <div className="p-6"><LoadingSkeleton rows={6} /></div>}
          {error && <ErrorState message={error} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="Klient topilmadi" desc="Filter yoki qidiruvni o'zgartiring" icon={<Users className="w-8 h-8 text-slate-400" />} />
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nom</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Telefon</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategoriya</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Hudud</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Qarz</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.id}</td>
                      <td className="px-4 py-3 text-base font-medium text-slate-900">
                        <Link href={`/klientlar/${c.id}`} className="hover:text-emerald-600">
                          {c.nomi}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {c.telefon && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {c.telefon}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.kategoriya && (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.kategoriya === "Опт" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {c.kategoriya}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {c.hudud && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {c.hudud}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-base text-right tabular-nums font-semibold ${
                        (c.qarz ?? 0) < 0 ? "text-rose-600" : (c.qarz ?? 0) > 0 ? "text-emerald-600" : "text-slate-400"
                      }`}>
                        {(c.qarz ?? 0).toLocaleString('uz-UZ')}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-slate-200 rounded">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-right">Jami:</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold text-lg ${
                      totalDebt < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}>
                      {totalDebt.toLocaleString('uz-UZ')} so'm
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
