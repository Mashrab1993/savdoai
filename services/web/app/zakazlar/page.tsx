"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Filter, FileText, Truck, CheckCircle, Clock, X, MoreVertical, Map } from "lucide-react"
import Link from "next/link"

const STATUSES = {
  new: { label: "Yangi", color: "bg-blue-100 text-blue-700 border-blue-300", icon: Clock },
  shipped: { label: "Otgruzka", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Truck },
  delivered: { label: "Yetkazildi", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CheckCircle },
  rejected: { label: "Otkaz", color: "bg-rose-100 text-rose-700 border-rose-300", icon: X },
}

const MOCK_ORDERS = [
  { id: "d0_103876", date: "2026-05-02 09:30", agent: "Babadjanova Nargiza", client: "Менче (Тастогл)", sum: 1233500, items: 8, status: "new" as const, balance: 0 },
  { id: "d0_103884", date: "2026-05-02 10:15", agent: "BORIEV MIRJALOL", client: "Гульча Ака Самал", sum: 856000, items: 5, status: "new" as const, balance: 0 },
  { id: "d0_103840", date: "2026-05-02 08:45", agent: "ДАВЛАТ", client: "Диёрбек Ака Челак", sum: 13_644_400, items: 7, status: "delivered" as const, balance: -1306300 },
  { id: "d0_103839", date: "2026-05-02 08:30", agent: "Sayitqulov Mashrab", client: "Akmal Aka Narimon", sum: 22_459_500, items: 352, status: "delivered" as const, balance: -4824300 },
  { id: "d0_103835", date: "2026-05-02 08:00", agent: "Berdiyev Rahmatillo", client: "Бегзод Маркет №0", sum: 286570, items: 3, status: "shipped" as const, balance: 1500000 },
  { id: "d0_103820", date: "2026-05-01 17:30", agent: "Турсунов Жамшид", client: "Аббос Ака Мирбозор", sum: 5_438_200, items: 12, status: "rejected" as const, balance: -1683800 },
]

export default function ZakazlarPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<keyof typeof STATUSES | "all">("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = MOCK_ORDERS.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false
    return o.client.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  })

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelected(newSet)
  }

  const totalSum = filtered.reduce((s, o) => s + o.sum, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zakazlar</h1>
            <p className="text-base text-slate-500 mt-1">{filtered.length} ta zakaz · Jami summa: <span className="font-semibold text-slate-900 tabular-nums">{totalSum.toLocaleString()} so'm</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Map className="w-4 h-4" /> Xaritada
            </Button>
            <Link href="/zakazlar/yangi">
              <Button size="lg">
                <Plus className="w-5 h-5" /> Yangi zakaz
              </Button>
            </Link>
          </div>
        </div>

        {/* Status tabs */}
        <Card className="p-3 flex flex-wrap gap-2">
          <StatusTab active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Barchasi ({MOCK_ORDERS.length})
          </StatusTab>
          {(Object.keys(STATUSES) as Array<keyof typeof STATUSES>).map(key => {
            const count = MOCK_ORDERS.filter(o => o.status === key).length
            return (
              <StatusTab key={key} active={statusFilter === key} onClick={() => setStatusFilter(key)}>
                {STATUSES[key].label} ({count})
              </StatusTab>
            )
          })}
        </Card>

        {/* Bulk actions when selected */}
        {selected.size > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 flex items-center gap-3">
            <span className="text-sm font-semibold text-emerald-800">{selected.size} ta tanlangan</span>
            <Button size="sm" variant="default">
              <FileText className="w-4 h-4" /> Накладные yaratish
            </Button>
            <Button size="sm" variant="outline">
              <Truck className="w-4 h-4" /> Status: Otgruzka
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4" /> Excel
            </Button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-emerald-700 hover:text-emerald-900">
              Tozalash
            </button>
          </div>
        )}

        {/* Filter bar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Klient nomi yoki ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button variant="outline">Agent</Button>
            <Button variant="outline">Sklad</Button>
            <Button variant="outline">Tип цены</Button>
            <Button variant="outline">
              <Filter className="w-4 h-4" /> Qo'shimcha
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4" /> Excel
            </Button>
          </div>
        </Card>

        {/* Orders table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-3 w-12">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id)))}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Sana</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Agent</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Klient</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Tovar</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Summa</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Balans</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => {
                  const status = STATUSES[o.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected.has(o.id)}
                          onChange={() => toggleSelect(o.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">
                        <a href={`/zakazlar/${o.id}`} className="hover:text-emerald-600">{o.id}</a>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 tabular-nums">{o.date}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{o.agent}</td>
                      <td className="px-4 py-3 text-base font-medium text-slate-900">{o.client}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-600">{o.items}</td>
                      <td className="px-4 py-3 text-base text-right tabular-nums font-semibold text-slate-900">
                        {o.sum.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-semibold text-sm ${
                        o.balance < 0 ? "text-rose-600" : o.balance > 0 ? "text-emerald-600" : "text-slate-400"
                      }`}>
                        {o.balance.toLocaleString()}
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
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-right">Jami:</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-lg">{totalSum.toLocaleString()}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function StatusTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
