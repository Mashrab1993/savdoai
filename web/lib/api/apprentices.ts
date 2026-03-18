/**
 * Apprentices (Shogirdlar) API — aligned with FastAPI GET /api/v1/shogirdlar.
 */

import { apiRequest } from "./client"

export type ApprenticeDto = {
  id: string
  name: string
  role: string
  phone: string
  status: string
  dailyLimit: number
  monthlyLimit: number
  spentToday: number
  spentThisMonth: number
  joinedAt: string
}

type BackendRow = {
  id: number
  ism?: string
  telefon?: string | null
  lavozim?: string | null
  kunlik_limit?: number | string
  oylik_limit?: number | string
  bugungi_xarajat?: number | string
  oylik_xarajat?: number | string
  kutilmoqda?: number
  faol?: boolean
}

function mapRow(r: BackendRow): ApprenticeDto {
  return {
    id: String(r.id),
    name: r.ism ?? "",
    role: r.lavozim ?? "",
    phone: r.telefon ?? "",
    status: r.faol !== false ? "active" : "inactive",
    dailyLimit: Number(r.kunlik_limit ?? 0),
    monthlyLimit: Number(r.oylik_limit ?? 0),
    spentToday: Number(r.bugungi_xarajat ?? 0),
    spentThisMonth: Number(r.oylik_xarajat ?? 0),
    joinedAt: "",
  }
}

export async function getApprentices() {
  const out = await apiRequest<BackendRow[]>("/api/v1/shogirdlar")
  if ("error" in out) return out
  return { data: out.data.map(mapRow) }
}
