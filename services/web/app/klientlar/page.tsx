"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Filter, MoreVertical, Phone, MapPin } from "lucide-react"

const MOCK_CLIENTS = [
  { id: "a0_36", name: "Аббос Ака Мирбозор №55", phone: "+998 90 123 45 67", category: "Розница", territory: "Mirbozor", balance: -1683800, agent: "BORIEV MIRJALOL", visit_day: "Vt, Ср, Пт" },
  { id: "a0_5301", name: "Булунгур Астановка №3", phone: "+998 90 234 56 78", category: "Розница", territory: "Bulungʻur", balance: 0, agent: "Babadjanova", visit_day: "Ср" },
  { id: "a0_5776", name: "Диайди №99", phone: "+998 90 345 67 89", category: "Опт", territory: "Busygina", balance: -100000, agent: "BORIEV", visit_day: "Vt, Ср" },
  { id: "a1_1558", name: "Салим Гараж (Вокзал) №6", phone: "+998 90 456 78 90", category: "Опт", territory: "Vokzal", balance: 0, agent: "ДАВЛАТ", visit_day: "Pt" },
  { id: "k2_4797", name: "Akmal Aka Narimon №88-Машраб", phone: "+998 90 567 89 01", category: "Розница", territory: "Narimon", balance: -4824300, agent: "BORIEV", visit_day: "Ср, Pt" },
  { id: "l2_4206", name: "Бегзод Маркет № 0 (Бигзод Маркет)", phone: "+998 91 316-16-66", category: "Розница", territory: "Sayfullin", balance: 1500000, agent: "ДАВЛАТ", visit_day: "Vt" },
]

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "debt">("all")

  const filtered = MOCK_CLIENTS.filter(c => {
    if (filter === "debt" && c.balance >= 0) return false
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  })

  const totalBalance = filtered.reduce((s, c) => s + c.balance, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klientlar</h1>
            <p className="text-base text-slate-500 mt-1">Jami {filtered.length} klient · Balans: <span className={totalBalance < 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>{totalBalance.toLocaleString('uz-UZ')} so'm</span></p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi klient
          </Button>
        </div>

        {/* Filters */}
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
                Barchasi
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

        {/* Clients table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nom</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Telefon</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategoriya</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Territoriya</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Agent</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Vizit kunlari</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Balans</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.id}</td>
                    <td className="px-4 py-3 text-base font-medium text-slate-900">
                      <a href={`/klientlar/${c.id}`} className="hover:text-emerald-600">
                        {c.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.category === "Опт" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {c.territory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{c.agent}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{c.visit_day}</td>
                    <td className={`px-4 py-3 text-base text-right tabular-nums font-semibold ${
                      c.balance < 0 ? "text-rose-600" : c.balance > 0 ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {c.balance.toLocaleString('uz-UZ')}
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
                  <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-right">Jami:</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-bold text-lg ${
                    totalBalance < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}>
                    {totalBalance.toLocaleString('uz-UZ')} so'm
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
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
