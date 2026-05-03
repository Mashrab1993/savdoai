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
  ism?: string
  telefon?: string
  manzil?: string
  kategoriya?: string
  hudud?: string
  agent_id?: number
  qarz?: number
}

interface KlientResp { total: number; items: Klient[] }

export default function ClientsPage() {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "debt">("all")

  const { data, loading, error } = useApi<KlientResp>(isAuthenticated ? "/api/v1/klientlar?limit=200" : null)
  const klientlar: Klient[] = (data?.items ?? []).map(k => ({ ...k, nomi: k.nomi || k.ism || "—" }))

  const filtered = klientlar.filter(c => {
    if (filter === "debt" && (c.qarz ?? 0) >= 0) return false
    const name = (c.nomi || c.ism || "").toLowerCase()
    return name.includes(search.toLowerCase()) ||
      String(c.id).includes(search)
  })

  const totalDebt = filtered.reduce((s, c) => s + (c.qarz ?? 0), 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI</div>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Klientlar <span className="italic text-[#C75D3C]">jurnali</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Jami {filtered.length} klient · Balans:{" "}
                <span className={totalDebt < 0 ? "text-[#C75D3C] font-medium" : "text-emerald-700 font-medium"}>
                  {totalDebt.toLocaleString('uz-UZ')} so'm
                </span>
                {!isAuthenticated && <span className="ml-2 text-xs text-[#D97706]">⚠ Login kerak</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/klientlar/segments">
                <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                  RFM Segmentlar
                </button>
              </Link>
              <Link href="/klientlar/yangi">
                <Button size="lg" style={{ background: "#C75D3C" }}>
                  <Plus className="w-5 h-5" /> Yangi klient
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C8A6E]" />
                <Input
                  placeholder="Nom yoki ID bo'yicha qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-[#E8E0D3] bg-[#FAF7F2]"
                />
              </div>

              <div className="flex gap-1">
                {(["all", "active", "debt"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs font-medium rounded-md ${filter === f ? "bg-[#C75D3C] text-white" : "bg-[#FAF7F2] border border-[#E8E0D3] text-[#6B5B4D] hover:border-[#C75D3C]"}`}
                  >
                    {f === "all" ? `Hammasi (${klientlar.length})` : f === "active" ? "Faol" : "Qarzdor"}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 ml-auto">
                <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
                <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5 hover:border-[#C75D3C]">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            {loading && <div className="p-6"><LoadingSkeleton rows={6} /></div>}
            {error && <ErrorState message={error} />}
            {!loading && !error && filtered.length === 0 && (
              <EmptyState title="Klient topilmadi" desc="Filter yoki qidiruvni o'zgartiring" icon={<Users className="w-8 h-8 text-[#9C8A6E]" />} />
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ID</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Nom</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Telefon</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Kategoriya</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Hudud</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qarz</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="px-4 py-3 text-sm font-mono text-[#9C8A6E]">{c.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/klientlar/${c.id}`} className="font-medium text-[#1A1A1A] hover:text-[#C75D3C]">
                            {c.nomi}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B5B4D]">
                          {c.telefon && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#9C8A6E]" />
                              {c.telefon}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {c.kategoriya && (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${
                              c.kategoriya === "Опт" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {c.kategoriya}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B5B4D]">
                          {c.hudud && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9C8A6E]" />
                              {c.hudud}
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-base text-right tabular-nums font-medium ${
                          (c.qarz ?? 0) < 0 ? "text-[#C75D3C]" : (c.qarz ?? 0) > 0 ? "text-emerald-700" : "text-[#9C8A6E]"
                        }`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {(c.qarz ?? 0).toLocaleString('uz-UZ')}
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-[#E8E0D3] rounded">
                            <MoreVertical className="w-4 h-4 text-[#9C8A6E]" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
