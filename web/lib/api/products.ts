/**
 * Products API — aligned with FastAPI GET /api/v1/tovarlar.
 * Backend returns { total, items } with nomi, kategoriya, qoldiq, sotish_narxi, min_qoldiq.
 */

import { apiRequest } from "./client"

export type ProductDto = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  description: string
  status: "in-stock" | "low-stock" | "out-of-stock"
}

type BackendItem = {
  id: number
  nomi?: string
  kategoriya?: string
  qoldiq?: number
  sotish_narxi?: number
  min_qoldiq?: number
  birlik?: string
}

type BackendResponse = { total: number; items: BackendItem[] }

function mapItem(r: BackendItem): ProductDto {
  const stock = Number(r.qoldiq ?? 0)
  const minQ = Number(r.min_qoldiq ?? 0)
  let status: ProductDto["status"] = "in-stock"
  if (stock <= 0) status = "out-of-stock"
  else if (minQ > 0 && stock <= minQ) status = "low-stock"
  return {
    id: String(r.id),
    name: r.nomi ?? "",
    sku: "",
    category: r.kategoriya ?? "Boshqa",
    price: Number(r.sotish_narxi ?? 0),
    stock,
    lowStockThreshold: minQ,
    description: "",
    status,
  }
}

export async function getProducts(params?: { limit?: number; offset?: number; category?: string }) {
  const sp = new URLSearchParams()
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  if (params?.category) sp.set("kategoriya", params.category)
  const qs = sp.toString()
  const path = `/api/v1/tovarlar${qs ? `?${qs}` : ""}`
  const out = await apiRequest<BackendResponse>(path)
  if ("error" in out) return out
  return {
    data: out.data.items.map(mapItem),
    total: out.data.total,
  } as { data: ProductDto[]; total: number }
}
