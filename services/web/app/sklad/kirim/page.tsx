"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, ArrowLeft, Building2, MoreVertical, Calendar } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

type Kirim = {
  id: string;
  date: string;
  date_create: string;
  supplier: string;
  warehouse: string;
  blocks: number;
  items: number;
  total: number;
}

const MOCK_RECEIPTS: Kirim[] = [
  { id: "d0_3289", date: "2026-05-02 20:31", date_create: "2026-05-02 20:31", supplier: "ERFIBLESS", warehouse: "Asosiy sklad", blocks: 1, items: 100, total: 5_355_000 },
  { id: "d0_3288", date: "2026-05-02 10:52", date_create: "2026-05-02 10:50", supplier: "SLADUS", warehouse: "Asosiy sklad", blocks: 5, items: 50, total: 1_200_000 },
  { id: "d0_3287", date: "2026-05-02 10:26", date_create: "2026-05-02 10:33", supplier: "Вафли", warehouse: "Asosiy sklad", blocks: 1, items: 800, total: 9_600_000 },
  { id: "d0_3286", date: "2026-05-01 18:30", date_create: "2026-05-01 18:25", supplier: "PRIMA", warehouse: "Asosiy sklad", blocks: 12, items: 144, total: 6_480_000 },
  { id: "d0_3285", date: "2026-05-01 14:15", date_create: "2026-05-01 14:10", supplier: "EMERALD CANDY", warehouse: "Asosiy sklad", blocks: 8, items: 96, total: 1_152_000 },
  { id: "d0_3284", date: "2026-05-01 11:00", date_create: "2026-05-01 10:55", supplier: "ARIEL", warehouse: "Химия sklad", blocks: 4, items: 96, total: 7_488_000 },
]

export default function KirimPage() {
  const { isAuthenticated } = useAuth()
  const { data: apiData, loading } = useApi<{ items: Kirim[] } | Kirim[]>(
    isAuthenticated ? "/api/v1/kirimlar" : null
  )

  const [search, setSearch] = useState("")
  const apiList = Array.isArray(apiData) ? apiData : (apiData as any)?.items
  const list: Kirim[] = (apiList && apiList.length > 0) ? apiList : MOCK_RECEIPTS
  const filtered = list.filter(r =>
    !search || String(r.id).includes(search) || (r.supplier ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.reduce((s, r) => s + (r.total || 0), 0)
  const usingMock = !apiList || apiList.length === 0

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/sklad" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> SKLAD
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Kirimlar <span className="italic text-[#C75D3C]">(Поступления)</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Yuk qabul qilish · {filtered.length} ta hujjat · {total.toLocaleString("ru-RU")} so'm
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {loading && (
                <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#6B5B4D] text-sm font-medium">Yuklanmoqda...</div>
              )}
              {!loading && !usingMock && (
                <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> Real-time API
                </div>
              )}
              {!loading && usingMock && (
                <div className="px-3 py-1.5 rounded-full bg-[#F5E5D6] text-[#C75D3C] text-sm font-medium">Demo data</div>
              )}
              <Link href="/sklad/kirim/yangi">
                <Button size="lg" style={{ background: "#C75D3C" }}>
                  <Plus className="w-5 h-5" /> Yangi kirim
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8A6E]" />
                <Input placeholder="ID yoki postavshik..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 border-[#E8E0D3] bg-[#FAF7F2]" />
              </div>
              <select className="h-10 rounded-md border border-[#E8E0D3] bg-[#FAF7F2] px-3 text-sm">
                <option>Barcha sklad</option>
                <option>Asosiy sklad</option>
                <option>Химия sklad</option>
                <option>VS sklad</option>
              </select>
              <Input type="date" defaultValue="2026-05-01" className="max-w-[180px] border-[#E8E0D3] bg-[#FAF7F2]" />
              <Input type="date" defaultValue="2026-05-02" className="max-w-[180px] border-[#E8E0D3] bg-[#FAF7F2]" />
              <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
            </div>
          </Card>

          {/* Table */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">ID</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Kirim sanasi</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Yaratildi</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Postavshik</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Sklad</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Blok</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Dona</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Jami</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="px-4 py-3 font-mono text-sm">
                        <Link href={`/sklad/kirim/${r.id}`} className="text-[#C75D3C] hover:underline font-semibold">{r.id}</Link>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-[#1A1A1A]">
                        <Calendar className="w-3 h-3 inline mr-1 text-[#9C8A6E]" />{r.date}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-[#9C8A6E]">{r.date_create}</td>
                      <td className="px-4 py-3 text-base font-medium text-[#1A1A1A]">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#9C8A6E]" />
                          {r.supplier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B5B4D]">{r.warehouse}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#1A1A1A]">{r.blocks}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#1A1A1A]">{(r.items || 0).toLocaleString("ru-RU")}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-base font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        {(r.total || 0).toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1 hover:bg-[#E8E0D3] rounded">
                          <MoreVertical className="w-4 h-4 text-[#9C8A6E]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#FAF7F2] border-t border-[#E8E0D3]">
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-right text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Jami:</td>
                    <td className="px-4 py-4 text-right tabular-nums font-medium text-[#1A1A1A]">{filtered.reduce((s, r) => s + (r.blocks || 0), 0)}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-medium text-[#1A1A1A]">{filtered.reduce((s, r) => s + (r.items || 0), 0).toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-2xl font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {total.toLocaleString("ru-RU")}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
