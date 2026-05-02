"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Truck, ArrowLeft, Package, Calendar, Building2, MoreVertical } from "lucide-react"
import Link from "next/link"

const MOCK_RECEIPTS = [
  { id: "d0_3288", date: "2026-05-02 10:52", date_create: "2026-05-02 10:50", supplier: "SLADUS", warehouse: "Asosiy sklad", blocks: 5, items: 50, total: 1_200_000 },
  { id: "d0_3287", date: "2026-05-02 10:26", date_create: "2026-05-02 10:33", supplier: "Вафли", warehouse: "Asosiy sklad", blocks: 1, items: 800, total: 9_600_000 },
  { id: "d0_3286", date: "2026-05-01 18:30", date_create: "2026-05-01 18:25", supplier: "PRIMA", warehouse: "Asosiy sklad", blocks: 12, items: 144, total: 6_480_000 },
  { id: "d0_3285", date: "2026-05-01 14:15", date_create: "2026-05-01 14:10", supplier: "EMERALD CANDY", warehouse: "Asosiy sklad", blocks: 8, items: 96, total: 1_152_000 },
  { id: "d0_3284", date: "2026-05-01 11:00", date_create: "2026-05-01 10:55", supplier: "ARIEL", warehouse: "Химия sklad", blocks: 4, items: 96, total: 7_488_000 },
]

export default function KirimPage() {
  const [search, setSearch] = useState("")
  const filtered = MOCK_RECEIPTS.filter(r =>
    r.id.includes(search) || r.supplier.toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.reduce((s, r) => s + r.total, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/sklad" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Sklad
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📥 Kirimlar (Поступления)</h1>
            <p className="text-base text-slate-500 mt-1">Yuk qabul qilish · {filtered.length} ta hujjat · {total.toLocaleString()} so'm</p>
          </div>
          <Link href="/sklad/kirim/yangi">
            <Button size="lg">
              <Plus className="w-5 h-5" /> Yangi kirim
            </Button>
          </Link>
        </div>

        {/* Filter */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input placeholder="ID yoki postavshik..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11" />
            </div>
            <select className="h-11 rounded-lg border-2 border-slate-300 px-4">
              <option>Barcha sklad</option>
              <option>Asosiy sklad</option>
              <option>Химия sklad</option>
              <option>VS sklad</option>
            </select>
            <Input type="date" defaultValue="2026-05-01" className="max-w-[180px]" />
            <Input type="date" defaultValue="2026-05-02" className="max-w-[180px]" />
            <Button variant="outline"><Download className="w-4 h-4" /> Excel</Button>
          </div>
        </Card>

        {/* Receipts table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Kirim sanasi</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Yaratilgan</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Postavshik</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Sklad</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Bloklarda</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Donalarda</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Jami</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm">
                      <Link href={`/sklad/kirim/${r.id}`} className="text-emerald-700 hover:underline font-semibold">{r.id}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{r.date}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-slate-500">{r.date_create}</td>
                    <td className="px-4 py-3 text-base font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {r.supplier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.warehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.blocks}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.items.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-base font-bold">{r.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-slate-200 rounded">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-emerald-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold">Jami:</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{filtered.reduce((s, r) => s + r.blocks, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{filtered.reduce((s, r) => s + r.items, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xl font-bold text-emerald-700">{total.toLocaleString()}</td>
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
