/**
 * Debts API — aligned with FastAPI GET /api/v1/qarzlar.
 * Backend returns [{ klient_ismi, qolgan, soni, muddat }].
 */

import { apiRequest } from "./client"

export type DebtDto = {
  id: string
  clientId: string
  clientName: string
  amount: number
  paid: number
  dueDate: string
  status: "pending" | "overdue" | "paid" | "partial"
  invoiceRef: string
  notes?: string
}

type BackendItem = {
  klient_ismi?: string
  qolgan?: number
  soni?: number
  muddat?: string | null
}

function mapItem(r: BackendItem, index: number): DebtDto {
  const qolgan = Number(r.qolgan ?? 0)
  const muddat = r.muddat ?? ""
  const now = new Date().toISOString().slice(0, 10)
  let status: DebtDto["status"] = "pending"
  if (qolgan <= 0) status = "paid"
  else if (muddat && muddat < now) status = "overdue"
  return {
    id: `d${index}`,
    clientId: "",
    clientName: r.klient_ismi ?? "",
    amount: qolgan,
    paid: 0,
    dueDate: muddat,
    status,
    invoiceRef: "",
  }
}

export async function getDebts() {
  const out = await apiRequest<BackendItem[]>("/api/v1/qarzlar")
  if ("error" in out) return out
  return { data: out.data.map((r, i) => mapItem(r, i)) }
}
