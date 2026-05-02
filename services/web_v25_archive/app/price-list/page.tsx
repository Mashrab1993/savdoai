"use client"
import { useState, useMemo } from "react"
import { PageLoading } from "@/components/shared/page-states"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Download, Printer, Package, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

const PRICE_TYPES = [
  { key: "opt", label: "Opt narx", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  { key: "roznitsa", label: "Roznitsa narx", color: "bg-blue-500/15 text-blue-800 dark:text-blue-300" },
  { key: "skidka", label: "Skidka narx", color: "bg-orange-500/15 text-orange-800 dark:text-orange-300" },
  { key: "vip", label: "VIP narx", color: "bg-violet-500/15 text-purple-800" },
]

export default function PriceListPage() {
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState("opt")

  const { data, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/tovarlar?limit=200`, { headers: { Authorization: `Bearer ${token}` } })
      return res.ok ? res.json() : { items: [] }
    } catch { return { items: [] } }
  })

  const items = useMemo(() => {
    let list = (data as any)?.items || []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t: any) => (t.nomi || "").toLowerCase().includes(q))
    }
    return list
  }, [data, search])

  // Calculate prices based on type
  const getPrice = (item: any) => {
    const base = item.olish_narxi || 0
    switch (selectedType) {
      case "opt": return base * 1.15  // +15%
      case "roznitsa": return base * 1.30  // +30%
      case "skidka": return base * 1.20  // +20%
      case "vip": return base * 1.10  // +10%
      default: return item.sotish_narxi || 0
    }
  }

  const totalSum = items.reduce((s: number, t: any) => s + getPrice(t), 0)

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={FileText}
          gradient="blue"
          title="Prays-list"
          subtitle="Tovarlar va narxlar — narx turi bo'yicha"
        />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" /> Chop etish</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> PDF</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Excel</Button>
          </div>
        </div>

        {/* Price Type Selector */}
        <div className="flex gap-2 flex-wrap">
          {PRICE_TYPES.map(p => (
            <button
              key={p.key}
              onClick={() => setSelectedType(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedType === p.key ? p.color : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground">Tovarlar soni</div>
            <div className="text-2xl font-bold mt-1">{items.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600">Jami summa</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(totalSum)}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600">Tanlangan narx turi</div>
            <div className="text-lg font-bold mt-1 text-blue-700">
              {PRICE_TYPES.find(p => p.key === selectedType)?.label}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tovar qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Table */}
        {loading ? (
          <PageLoading />
        ) : (
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Tovar nomi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead className="text-center">Birlik</TableHead>
                  <TableHead className="text-center">Olish narx</TableHead>
                  <TableHead className="text-center">{PRICE_TYPES.find(p => p.key === selectedType)?.label}</TableHead>
                  <TableHead className="text-center">Foyda %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : items.map((t: any, i: number) => {
                  const newPrice = getPrice(t)
                  const profit = t.olish_narxi > 0 ? ((newPrice - t.olish_narxi) / t.olish_narxi * 100) : 0
                  return (
                    <TableRow key={t.id || i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{t.kod || `#${t.id}`}</TableCell>
                      <TableCell className="font-medium">{t.nomi}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{t.kategoriya || "-"}</Badge></TableCell>
                      <TableCell className="text-center text-sm">{t.birlik || "dona"}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{formatCurrency(t.olish_narxi || 0)}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-emerald-700">{formatCurrency(newPrice)}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-bold text-emerald-600">+{profit.toFixed(0)}%</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
