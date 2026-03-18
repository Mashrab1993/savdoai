/**
 * Expenses (Xarajatlar) API — aligned with FastAPI GET /api/v1/xarajatlar/kutilmoqda.
 * Backend returns pending expenses: id, summa, kategoriya_nomi, izoh, sana, shogird_ismi.
 */

import { apiRequest } from "./client"

export type ExpenseDto = {
  id: string
  title: string
  category: string
  amount: number
  requestedBy: string
  approvedBy?: string
  status: string
  date: string
  notes?: string
}

type BackendRow = {
  id: number
  summa?: number | string
  kategoriya_nomi?: string | null
  izoh?: string | null
  sana?: string
  shogird_ismi?: string | null
}

function mapRow(r: BackendRow): ExpenseDto {
  return {
    id: String(r.id),
    title: r.izoh ?? r.kategoriya_nomi ?? "",
    category: r.kategoriya_nomi ?? "",
    amount: Number(r.summa ?? 0),
    requestedBy: r.shogird_ismi ?? "",
    status: "pending",
    date: r.sana ?? "",
    notes: r.izoh ?? undefined,
  }
}

export async function getExpensesPending() {
  const out = await apiRequest<BackendRow[]>("/api/v1/xarajatlar/kutilmoqda")
  if ("error" in out) return out
  return { data: out.data.map(mapRow) }
}

/** Alias for UI that expects getExpenses; returns pending list from backend. */
export async function getExpenses() {
  return getExpensesPending()
}
