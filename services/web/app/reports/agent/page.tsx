"use client"

/**
 * Agent hisoboti — SalesDoc /report/agent analog.
 *
 * 5 KPI kartasi (Obshie zakazy, Otgruzka, Dostavka, Oplaty, Qarz)
 * + shogirdlar jadvali.
 */

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  Users, Truck, CheckCircle, DollarSign, AlertTriangle,
  Calendar, TrendingUp, Search,
} from "lucide-react"

interface AgentRow {
  id: number
  ism: string
  obshchie: number
  otgruzka: number
  dostavka: number
  oplaty: number
  qarz: number
  akb: number
}

interface AgentReportResponse {
  davr: { sana_dan: string; sana_gacha: string }
  jami: {
    obshchie_zakazy: number
    otgruzka: number
    dostavka: number
    oplaty: number
    qarz: number
    akb: number
  }
  agentlar: AgentRow[]
}

const today = () => new Date().toISOString().split("T")[0]
const monthAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function AgentReportPage() {
  const [sanaDan, setSanaDan] = useState(monthAgo())
  const [sanaGacha, setSanaGacha] = useState(today())
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"obshchie" | "akb">("obshchie")

  const fetcher = useCallback(
    () => api.get<AgentReportResponse>(`/api/v1/hisobot/agent?sana_dan=${sanaDan}&sana_gacha=${sanaGacha}`),
    [sanaDan, sanaGacha],
  )
  const { data, loading, error, refetch } = useApi(fetcher, [sanaDan, sanaGacha])

  const sortedFiltered = (data?.agentlar || [])
    .filter(a => !search || a.ism.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "obshchie" ? b.obshchie - a.obshchie : b.akb - a.akb)

  return (
    <AdminLayout title="Agent hisoboti">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-800 via-teal-700 to-emerald-800 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Users className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Agent hisoboti</h2>
            <p className="text-sm opacity-80 mb-4">
              SalesDoc /report/agent analog — har shogird bo&apos;yicha sotuv va qarz ko&apos;rsatkichlari
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 opacity-70" />
              <Input type="date" value={sanaDan} onChange={e => setSanaDan(e.target.value)}
                className="w-40 bg-white/10 border-white/20 text-white" />
              <span className="opacity-70">—</span>
              <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)}
                className="w-40 bg-white/10 border-white/20 text-white" />
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={String(error)} onRetry={refetch} />}

        {!loading && !error && data && (
          <>
            {/* 5 KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="p-5 bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 relative overflow-hidden">
                <TrendingUp className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Umumiy buyurtmalar</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.jami.obshchie_zakazy)}</div>
                  <div className="text-xs opacity-90 mt-1">AKB: {data.jami.akb}</div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 relative overflow-hidden">
                <Truck className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Yuborilganlar</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.jami.otgruzka)}</div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 relative overflow-hidden">
                <CheckCircle className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Yetkazilganlar</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.jami.dostavka)}</div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 relative overflow-hidden">
                <DollarSign className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">To&apos;lovlar</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.jami.oplaty)}</div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 relative overflow-hidden">
                <AlertTriangle className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Qarz</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.jami.qarz)}</div>
                </div>
              </Card>
            </div>

            {/* Agentlar jadval */}
            <Card>
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
                  Savdo agentlari
                  {data.agentlar.length > 0 && (
                    <Badge variant="outline">{data.agentlar.length} ta</Badge>
                  )}
                </h3>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Agent qidirish..." value={search}
                      onChange={e => setSearch(e.target.value)} className="pl-10 w-48" />
                  </div>
                  <Button size="sm" variant={sortBy === "obshchie" ? "default" : "outline"}
                    onClick={() => setSortBy("obshchie")}>Summa bo&apos;yicha</Button>
                  <Button size="sm" variant={sortBy === "akb" ? "default" : "outline"}
                    onClick={() => setSortBy("akb")}>AKB bo&apos;yicha</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Umumiy</TableHead>
                    <TableHead className="text-right">Yuborilgan</TableHead>
                    <TableHead className="text-right">Yetkazilgan</TableHead>
                    <TableHead className="text-right">To&apos;lovlar</TableHead>
                    <TableHead className="text-right">Qarz</TableHead>
                    <TableHead className="text-center">AKB</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto opacity-30 mb-2" />
                        {search ? "Qidiruvga mos agent yo'q" : "Agent yo'q yoki bu davrda sotuv yo'q"}
                      </TableCell>
                    </TableRow>
                  ) : sortedFiltered.map((a, i) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{a.ism}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-blue-600">
                        {formatCurrency(a.obshchie)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600">
                        {formatCurrency(a.otgruzka)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {formatCurrency(a.dostavka)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-violet-600">
                        {formatCurrency(a.oplaty)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {a.qarz > 0 ? (
                          <span className="text-red-600 font-semibold">{formatCurrency(a.qarz)}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">{a.akb}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              💡 Agentni Hozir sotuv_sessiyalar.shogird_id orqali bog&apos;laymiz.
              Eski yozuvlar hali agentsiz — ular umumiy summaga kiradi.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
