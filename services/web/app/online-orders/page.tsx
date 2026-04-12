"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Globe, Search, Phone, MapPin, Eye, Check, X, Clock } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  10: { label: "Yangi",        color: "bg-blue-500/15 text-blue-800 dark:text-blue-300" },
  20: { label: "Tasdiqlandi",  color: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  30: { label: "Yetkazildi",   color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  40: { label: "Bekor",        color: "bg-rose-500/15 text-rose-800 dark:text-rose-300" },
}

export default function OnlineOrdersPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState(0)
  const [orders] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Globe}
          gradient="blue"
          title="Onlayn buyurtmalar"
          subtitle="Telegram bot va web orqali kelgan buyurtmalar"
        />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_MAP).map(([k, s]) => (
            <button key={k} onClick={() => setFilter(Number(k))} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 hover:shadow-md transition">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold mt-1">0</div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => setFilter(0)} variant={filter === 0 ? "default" : "outline"}>Barchasi</Button>
        </div>

        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Mijoz</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Manzil</TableHead>
                <TableHead className="text-center">Summa</TableHead>
                <TableHead>To'lov</TableHead>
                <TableHead className="text-center">Holat</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead className="w-32">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Onlayn buyurtmalar yo'q
                    <div className="text-xs mt-1">@savdo_avtomatlashtirish_bot orqali buyurtmalar bu yerda ko'rinadi</div>
                  </TableCell>
                </TableRow>
              ) : orders.map((o: any, i: number) => (
                <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono">#{o.id}</TableCell>
                  <TableCell className="font-medium">{o.mijoz}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Phone className="w-3 h-3" />{o.telefon}</div></TableCell>
                  <TableCell><div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.manzil}</div></TableCell>
                  <TableCell className="text-center font-mono font-bold">{formatCurrency(o.summa)}</TableCell>
                  <TableCell><Badge variant="secondary">{o.tolov}</Badge></TableCell>
                  <TableCell className="text-center">
                    <Badge className={STATUS_MAP[o.holat]?.color || "bg-muted"}>{STATUS_MAP[o.holat]?.label || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.sana}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-emerald-600"><Check className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><X className="w-3 h-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
