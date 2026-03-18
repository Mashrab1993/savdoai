/**
 * Clients API — aligned with FastAPI GET /api/v1/klientlar.
 * Backend returns { total, items } with ism, telefon, jami_sotib, aktiv_qarz, etc.
 */

import { apiRequest } from "./client"

export type ClientDto = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: "active" | "inactive" | "prospect"
  totalPurchases: number
  totalDebt: number
  joinedAt: string
}

type BackendItem = {
  id: number
  ism?: string
  telefon?: string | null
  manzil?: string | null
  jami_sotib?: number
  aktiv_qarz?: number
  yaratilgan?: string
}

type BackendResponse = { total: number; items: BackendItem[] }

function mapItem(r: BackendItem): ClientDto {
  const totalDebt = Number(r.aktiv_qarz ?? 0)
  return {
    id: String(r.id),
    name: r.ism ?? "",
    email: "",
    phone: r.telefon ?? "",
    company: r.manzil ?? "",
    status: totalDebt > 0 ? "active" : "active",
    totalPurchases: Number(r.jami_sotib ?? 0),
    totalDebt,
    joinedAt: r.yaratilgan ? new Date(r.yaratilgan).toISOString().slice(0, 10) : "",
  }
}

export async function getClients(params?: { limit?: number; offset?: number; search?: string }) {
  const sp = new URLSearchParams()
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  if (params?.search) sp.set("qidiruv", params.search)
  const qs = sp.toString()
  const path = `/api/v1/klientlar${qs ? `?${qs}` : ""}`
  const out = await apiRequest<BackendResponse>(path)
  if ("error" in out) return out
  return {
    data: out.data.items.map(mapItem),
    total: out.data.total,
  } as { data: ClientDto[]; total: number }
}

export async function createClient(payload: { ism: string; telefon?: string; manzil?: string }) {
  return apiRequest<BackendItem>("/api/v1/klient", {
    method: "POST",
    body: JSON.stringify({
      ism: payload.ism.trim(),
      telefon: payload.telefon || undefined,
      manzil: payload.manzil || undefined,
    }),
  })
}
