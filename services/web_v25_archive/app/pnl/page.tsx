"use client"

/**
 * P&L — Foyda-Zarar hisoboti (SalesDoc /finans/pnl analog, chiroyliroq).
 *
 * 3 blok:
 * 1. Yagona PnL card — tushum, tannarx, yalpi foyda, xarajat, sof foyda
 * 2. PnL kategoriyalar bo'yicha — har kategoriya alohida qator
 * 3. PnL status bo'yicha — sotish/qaytarish/spisanie
 *
 * SalesDocdan farqi: bitta sahifada hammasi, gradient ranglar, trend arrow.
 */

import { useState, useMemo, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { useApi } from "@/hooks/use-api"
import { pnlService } from "@/lib/api/services"
import { formatCurrency } from "@/lib/format"
import {
  TrendingUp, TrendingDown, DollarSign, Package, Minus,
  Receipt, PieChart, Sparkles, ArrowUpRight, ArrowDownRight,
} from "lucide-react"

const PERIODS = [
  { kunlar: 7,  label: "7 kun" },
  { kunlar: 30, label: "30 kun" },
  { kunlar: 90, label: "90 kun" },
  { kunlar: 365, label: "1 yil" },
]

interface PnLData {
  davr_nomi?: string
  tushum: number
  tannarx: number
  yalpi_foyda: number
  operatsion_xarajatlar: number
  sof_foyda: number
  qaytarishlar?: number
  xarajat_kategoriyalar?: Array<{ nomi: string; summa: number }>
  prev?: { tushum?: number; sof_foyda?: number }
}


function PnLRow({ label, value, highlight, isNegative, subtle, bold }: {
  label: string
  value: number
  highlight?: boolean
  isNegative?: boolean
  subtle?: boolean
  bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? "border-t border-b my-1 bg-muted/30 px-3 rounded" : "px-3"} ${bold ? "font-bold" : ""}`}>
      <span className={`${subtle ? "text-muted-foreground text-sm" : ""}`}>{label}</span>
      <span className={`font-mono ${bold ? "text-lg" : ""} ${isNegative ? "text-red-600" : highlight ? "text-emerald-600" : ""}`}>
        {isNegative ? "−" : ""}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  )
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (!prev || prev === 0) return null
  const delta = ((current - prev) / Math.abs(prev)) * 100
  const up = delta >= 0
  return (
    <Badge className={up ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-red-500/15 text-red-700 dark:text-red-300"}>
      {up ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
      {" "}
      {up ? "+" : ""}{delta.toFixed(1)}%
    </Badge>
  )
}


export default function PnLPage() {
  const [kunlar, setKunlar] = useState(30)
  const fetcher = useCallback(() => pnlService.get(kunlar), [kunlar])
  const { data, loading, error, refetch } = useApi(fetcher, [kunlar])

  const d = data as PnLData | null
  const totalXarajat = useMemo(
    () => (d?.xarajat_kategoriyalar || []).reduce((s, c) => s + c.summa, 0),
    [d],
  )

  return (
    <AdminLayout title="P&L — Foyda/Zarar">
      <div className="space-y-6">
        {/* TOP */}
        <Card className="p-6 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <DollarSign className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Foyda va Zarar (PnL)</h2>
            <p className="text-sm opacity-80 mb-4">
              SalesDoc /finans/pnl analog — tushum, tannarx, xarajat va sof foyda.
              Oldingi davr bilan taqqoslash.
            </p>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <Button
                  key={p.kunlar}
                  size="sm"
                  onClick={() => setKunlar(p.kunlar)}
                  className={`${kunlar === p.kunlar ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"} text-xs`}
                >
                  {p.label}
                </Button>
              ))}
              {d?.davr_nomi && (
                <Badge className="bg-white/20 ml-2 text-xs">
                  {d.davr_nomi}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {loading && <PageLoading />}
        {error && !loading && <PageError message={String(error)} onRetry={refetch} />}

        {!loading && !error && d && (
          <>
            {/* 4 ASOSIY KPI KARTA */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 relative overflow-hidden">
                <TrendingUp className="absolute -bottom-4 -right-4 w-20 h-20 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Tushum (Vyruchka)</div>
                  <div className="text-2xl font-bold">{formatCurrency(d.tushum)}</div>
                  {d.prev?.tushum ? <div className="mt-2"><DeltaBadge current={d.tushum} prev={d.prev.tushum} /></div> : null}
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 relative overflow-hidden">
                <Package className="absolute -bottom-4 -right-4 w-20 h-20 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Tannarx (Sebestoimost)</div>
                  <div className="text-2xl font-bold">{formatCurrency(d.tannarx)}</div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 relative overflow-hidden">
                <Sparkles className="absolute -bottom-4 -right-4 w-20 h-20 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Yalpi foyda (Valovaya)</div>
                  <div className="text-2xl font-bold">{formatCurrency(d.yalpi_foyda)}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {d.tushum > 0 ? ((d.yalpi_foyda / d.tushum) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 relative overflow-hidden">
                <DollarSign className="absolute -bottom-4 -right-4 w-20 h-20 opacity-20" />
                <div className="relative">
                  <div className="text-xs opacity-80 mb-1">Sof foyda (Chistaya)</div>
                  <div className="text-2xl font-bold">{formatCurrency(d.sof_foyda)}</div>
                  {d.prev?.sof_foyda ? <div className="mt-2"><DeltaBadge current={d.sof_foyda} prev={d.prev.sof_foyda} /></div> : null}
                </div>
              </Card>
            </div>

            {/* PnL JADVAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  PnL tarkibi
                </h3>
                <div className="space-y-0 divide-y">
                  <PnLRow label="Tushum" value={d.tushum} highlight />
                  <PnLRow label="Tannarx (COGS)" value={d.tannarx} isNegative subtle />
                  <PnLRow label="Yalpi foyda" value={d.yalpi_foyda} highlight bold />
                  <PnLRow label="Operatsion xarajatlar" value={d.operatsion_xarajatlar} isNegative subtle />
                  {d.qaytarishlar ? (
                    <PnLRow label="Qaytarishlar" value={d.qaytarishlar} isNegative subtle />
                  ) : null}
                  <PnLRow label="Sof foyda" value={d.sof_foyda} highlight bold />
                </div>

                {/* Margin box */}
                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Yalpi marja</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {d.tushum > 0 ? ((d.yalpi_foyda / d.tushum) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Sof marja</div>
                      <div className="text-xl font-bold text-violet-600">
                        {d.tushum > 0 ? ((d.sof_foyda / d.tushum) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* XARAJAT KATEGORIYA */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-500" />
                  Xarajat kategoriyalari
                </h3>
                {(d.xarajat_kategoriyalar || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Minus className="w-12 h-12 mx-auto opacity-30 mb-2" />
                    Bu davrda xarajat yo&apos;q
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(d.xarajat_kategoriyalar || []).map((c, i) => {
                      const foiz = totalXarajat > 0 ? (c.summa / totalXarajat) * 100 : 0
                      const gradient = [
                        "from-rose-500 to-red-600",
                        "from-orange-500 to-amber-600",
                        "from-yellow-500 to-orange-500",
                        "from-indigo-500 to-violet-600",
                        "from-cyan-500 to-blue-600",
                        "from-pink-500 to-rose-500",
                      ][i % 6]
                      return (
                        <div key={i} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{c.nomi}</span>
                            <span className="text-sm font-mono font-bold">
                              {formatCurrency(c.summa)}
                              <span className="text-xs text-muted-foreground ml-2">{foiz.toFixed(0)}%</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                              style={{ width: `${foiz}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="pt-3 mt-3 border-t flex items-center justify-between font-bold">
                      <span>Jami xarajat</span>
                      <span className="font-mono text-orange-600">{formatCurrency(totalXarajat)}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* STATUS BO'YICHA jadval */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                PnL bo&apos;limlar bo&apos;yicha
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ko&apos;rsatkich</TableHead>
                    <TableHead className="text-right">Joriy davr</TableHead>
                    <TableHead className="text-right">Oldingi davr</TableHead>
                    <TableHead className="text-right">Farq</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Tushum</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(d.tushum)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(d.prev?.tushum || 0)}</TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge current={d.tushum} prev={d.prev?.tushum || 0} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Yalpi foyda</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(d.yalpi_foyda)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency((d.prev?.tushum || 0) - ((d.prev?.tushum || 0) - (d.prev?.sof_foyda || 0)))}
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Sof foyda</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">{formatCurrency(d.sof_foyda)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(d.prev?.sof_foyda || 0)}</TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge current={d.sof_foyda} prev={d.prev?.sof_foyda || 0} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
