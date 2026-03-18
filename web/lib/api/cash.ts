/**
 * Cash/Kassa API — aligned with FastAPI GET /api/v1/kassa/stats and /api/v1/kassa/tarix.
 */

import { apiRequest } from "./client"

export type CashTransactionDto = {
  id: string
  type: "income" | "outcome"
  amount: number
  description: string
  category: string
  date: string
  time: string
  performedBy: string
}

type BackendRow = {
  id: number
  tur: string
  summa: number | string
  usul?: string
  tavsif?: string | null
  kategoriya?: string | null
  sana: string
  vaqt: string
}

function mapRow(r: BackendRow): CashTransactionDto {
  const amount = typeof r.summa === "string" ? parseFloat(r.summa) : Number(r.summa)
  return {
    id: String(r.id),
    type: r.tur === "kirim" ? "income" : "outcome",
    amount,
    description: r.tavsif ?? "",
    category: r.kategoriya ?? "",
    date: r.sana,
    time: r.vaqt,
    performedBy: "",
  }
}

export type CashStatsDto = {
  bugun_kirim: number
  bugun_chiqim: number
  bugun_balans: number
  jami_kirim: number
  jami_chiqim: number
  jami_balans: number
}

export async function getCashStats() {
  return apiRequest<CashStatsDto>("/api/v1/kassa/stats")
}

export async function getCashTransactions(params?: { limit?: number; offset?: number }) {
  const sp = new URLSearchParams()
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  const qs = sp.toString()
  const path = `/api/v1/kassa/tarix${qs ? `?${qs}` : ""}`
  const out = await apiRequest<BackendRow[]>(path)
  if ("error" in out) return out
  return { data: out.data.map(mapRow) }
}
