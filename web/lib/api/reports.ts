/**
 * Reports API — aligned with FastAPI GET /api/v1/hisobot/kunlik, haftalik, oylik.
 * No single "summary" endpoint; use these for real data.
 */

import { apiRequest } from "./client"

export type ReportSummaryDto = {
  monthlyRevenue?: { month: string; revenue: number; expenses: number }[]
  revenueByCategory?: { name: string; value: number }[]
  salesByClient?: { client: string; sales: number }[]
}

export type ReportDailyDto = {
  kirim: { soni: number; jami: number }
  sotuv: { soni: number; jami: number; qarz: number }
  jami_qarz: number
}

export type ReportWeeklyDto = {
  davr: string
  sotuv: { soni: number; jami: number; qarz: number }
  kirim: { soni: number; jami: number }
  top_klientlar: { klient_ismi: string; jami: number; soni: number }[]
}

export type ReportMonthlyDto = {
  davr: string
  sotuv: { soni: number; jami: number }
  sof_foyda: number
  top_tovarlar: { tovar_nomi: string; miqdor: number; jami: number }[]
}

export async function getReportDaily() {
  return apiRequest<ReportDailyDto>("/api/v1/hisobot/kunlik")
}

export async function getReportWeekly() {
  return apiRequest<ReportWeeklyDto>("/api/v1/hisobot/haftalik")
}

export async function getReportMonthly() {
  return apiRequest<ReportMonthlyDto>("/api/v1/hisobot/oylik")
}

/** Maps backend haftalik to summary shape (salesByClient). Charts can use getReportDaily/Weekly/Monthly. */
export async function getReportSummary() {
  const out = await apiRequest<ReportWeeklyDto>("/api/v1/hisobot/haftalik")
  if ("error" in out) return out
  const summary: ReportSummaryDto = {
    salesByClient: (out.data.top_klientlar ?? []).map((k) => ({ client: k.klient_ismi ?? "", sales: Number(k.jami ?? 0) })),
  }
  return { data: summary }
}
