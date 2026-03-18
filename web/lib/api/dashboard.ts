/**
 * Dashboard API — aligned with FastAPI GET /api/v1/dashboard.
 */

import { apiRequest } from "./client"

export type DashboardStats = {
  totalRevenue?: number
  activeClients?: number
  totalDebt?: number
  overdueCount?: number
  todaySales?: number
  todaySalesCount?: number
  productCount?: number
  lowStockCount?: number
}

type BackendDashboard = {
  bugun_sotuv_soni?: number
  bugun_sotuv_jami?: number
  bugun_yangi_qarz?: number
  jami_qarz?: number
  klient_soni?: number
  tovar_soni?: number
  kam_qoldiq_soni?: number
}

function mapDashboard(r: BackendDashboard): DashboardStats {
  return {
    totalRevenue: r.bugun_sotuv_jami ?? 0,
    activeClients: r.klient_soni ?? 0,
    totalDebt: r.jami_qarz ?? 0,
    overdueCount: 0,
    todaySales: r.bugun_sotuv_jami ?? 0,
    todaySalesCount: r.bugun_sotuv_soni ?? 0,
    productCount: r.tovar_soni ?? 0,
    lowStockCount: r.kam_qoldiq_soni ?? 0,
  }
}

export async function getDashboardStats() {
  const out = await apiRequest<BackendDashboard>("/api/v1/dashboard")
  if ("error" in out) return out
  return { data: mapDashboard(out.data) }
}
