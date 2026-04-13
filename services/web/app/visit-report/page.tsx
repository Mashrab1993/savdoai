"use client"

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { PageHeader } from "@/components/ui/page-header"
import { MapPin, Users, ShoppingCart, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { useApi } from "@/hooks/use-api"
import { PageLoading, PageError } from "@/components/shared/page-states"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const api = {
  get: async <T,>(url: string): Promise<T> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    const r = await fetch(`${base}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  },
}

interface VizitItem {
  sana: string
  agent_ismi: string
  jami_vizit: number
  sotuv_qilgan: number
  bosh_vizit: number
  birinchi_vizit: string | null
  oxirgi_vizit: string | null
  ish_vaqti_soat: number
}

interface VizitResponse {
  sana_dan: string
  sana_gacha: string
  items: VizitItem[]
  jami: { vizitlar: number; sotuv_qilgan: number }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function VisitReportPage() {
  const { locale } = useLocale()
  const [sanaDan, setSanaDan] = useState(daysAgo(30))
  const [sanaGacha, setSanaGacha] = useState(todayStr())

  const fetcher = useCallback(
    () => api.get<VizitResponse>(`/api/v1/hisobot/vizitlar?sana_dan=${sanaDan}&sana_gacha=${sanaGacha}`),
    [sanaDan, sanaGacha],
  )
  const { data, loading, error, refetch } = useApi(fetcher)

  const items = data?.items ?? []
  const jami = data?.jami ?? { vizitlar: 0, sotuv_qilgan: 0 }

  const jamiIshVaqti = items.length > 0
    ? (items.reduce((s, i) => s + i.ish_vaqti_soat, 0) / items.length).toFixed(1)
    : "0"

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={MapPin}
          gradient="emerald"
          title={locale === "uz" ? "Vizit hisoboti" : "Отчёт по визитам"}
          subtitle={locale === "uz"
            ? "Agentlar tashriflari va sotuv samaradorligi"
            : "Визиты агентов и эффективность продаж"}
          action={
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="date"
                value={sanaDan}
                onChange={e => setSanaDan(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <input
                type="date"
                value={sanaGacha}
                onChange={e => setSanaGacha(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
              />
              <Button size="sm" variant="outline" onClick={refetch}>
                {locale === "uz" ? "Yangilash" : "Обновить"}
              </Button>
            </div>
          }
        />

        {loading && <PageLoading />}
        {error && <PageError message="Vizit hisobotini yuklashda xato" onRetry={refetch} />}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: locale === "uz" ? "Jami vizitlar" : "Всего визитов",
                  value: String(jami.vizitlar),
                  icon: MapPin,
                  tone: "emerald" as const,
                },
                {
                  label: locale === "uz" ? "Sotuv qilgan" : "С продажей",
                  value: String(jami.sotuv_qilgan),
                  icon: ShoppingCart,
                  tone: "blue" as const,
                },
                {
                  label: locale === "uz" ? "Bo'sh vizit" : "Пустые визиты",
                  value: String(jami.vizitlar - jami.sotuv_qilgan),
                  icon: Users,
                  tone: "rose" as const,
                },
                {
                  label: locale === "uz" ? "O'rtacha ish vaqti" : "Ср. рабочее время",
                  value: `${jamiIshVaqti} ${locale === "uz" ? "soat" : "ч"}`,
                  icon: Clock,
                  tone: "amber" as const,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className={cn(
                    "p-2 rounded-xl ring-1 shrink-0",
                    s.tone === "emerald" ? "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30" :
                    s.tone === "blue"    ? "bg-blue-500/15 text-blue-500 ring-blue-500/30" :
                    s.tone === "amber"   ? "bg-amber-500/15 text-amber-500 ring-amber-500/30" :
                                           "bg-rose-500/15 text-rose-500 ring-rose-500/30",
                  )}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-base font-bold text-foreground mt-0.5 tabular-nums">{s.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Data table */}
            {items.length > 0 ? (
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60">
                  <p className="text-sm font-semibold text-foreground">
                    {locale === "uz"
                      ? `Vizitlar ro'yxati (${items.length})`
                      : `Список визитов (${items.length})`}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Sana" : "Дата"}
                        </th>
                        <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Agent" : "Агент"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Jami vizit" : "Всего"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Sotuv" : "Продажа"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Bo'sh" : "Пустые"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Birinchi" : "Первый"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Oxirgi" : "Последний"}
                        </th>
                        <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          {locale === "uz" ? "Ish vaqti" : "Раб. время"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {items.map((item, i) => (
                        <motion.tr
                          key={`${item.sana}-${item.agent_ismi}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02, duration: 0.2 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground">{item.sana}</td>
                          <td className="px-4 py-2.5 text-foreground">{item.agent_ismi}</td>
                          <td className="px-4 py-2.5 text-center font-bold tabular-nums">{item.jami_vizit}</td>
                          <td className="px-4 py-2.5 text-center tabular-nums">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.sotuv_qilgan}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center tabular-nums">
                            <span className={cn(
                              "font-semibold",
                              item.bosh_vizit > 0 ? "text-rose-500" : "text-muted-foreground"
                            )}>
                              {item.bosh_vizit}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-muted-foreground tabular-nums">
                            {item.birinchi_vizit ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-center text-muted-foreground tabular-nums">
                            {item.oxirgi_vizit ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-center tabular-nums">
                            <span className={cn(
                              "font-semibold",
                              item.ish_vaqti_soat >= 8 ? "text-emerald-600 dark:text-emerald-400" :
                              item.ish_vaqti_soat >= 5 ? "text-amber-600 dark:text-amber-400" :
                                                          "text-rose-500"
                            )}>
                              {item.ish_vaqti_soat} {locale === "uz" ? "s" : "ч"}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-foreground">
                  {locale === "uz" ? "Vizit ma'lumotlari topilmadi" : "Данные о визитах не найдены"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "uz"
                    ? "Tanlangan davr uchun vizitlar mavjud emas"
                    : "Нет визитов за выбранный период"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
