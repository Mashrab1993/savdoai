/**
 * Price groups (Narx guruhlari) API — aligned with FastAPI GET /api/v1/narx/guruhlar.
 * Backend returns id, nomi, izoh, tovar_soni, klient_soni.
 */

import { apiRequest } from "./client"

export type PriceGroupDto = {
  id: string
  name: string
  discount: number
  description: string
  clientIds: string[]
}

type BackendRow = {
  id: number
  nomi?: string
  izoh?: string | null
  tovar_soni?: number
  klient_soni?: number
}

function mapRow(r: BackendRow): PriceGroupDto {
  return {
    id: String(r.id),
    name: r.nomi ?? "",
    discount: 0,
    description: r.izoh ?? "",
    clientIds: [],
  }
}

export async function getPriceGroups() {
  const out = await apiRequest<BackendRow[]>("/api/v1/narx/guruhlar")
  if ("error" in out) return out
  return { data: out.data.map(mapRow) }
}
