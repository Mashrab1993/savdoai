// ── API service functions ──────────────────────────────────────────────────────
// One function per backend endpoint. Returns typed DTOs.
// Pages should call normalizers on top of these.

import { api } from "./client"
import { getPublicApiBaseUrl } from "./base-url"
import type {
  LoginResponse, MeResponse, DashboardResponse,
  DailyReportResponse, WeeklyReportResponse, MonthlyReportResponse,
  ReportEntry,
  ClientDto, ProductDto, DebtDto, ExpenseDto, ApprenticeDto,
  ApprenticeDashboard, CashStatsDto, CashTransactionDto,
  CashOperationRequest,
  PriceGroupDto, ExportTaskDto, PaginatedResponse,
} from "./types"

// ── Helpers ───────────────────────────────────────────────────────────────────
// Safely extract items from paginated or flat responses
function extractItems<T>(data: PaginatedResponse<T> | T[] | unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && "items" in data) {
    const paginated = data as PaginatedResponse<T>
    return Array.isArray(paginated.items) ? paginated.items : []
  }
  return []
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  // Token-based login — user provides a JWT obtained from Telegram bot /token command
  // Token is stored by auth-context, then verified by calling /api/v1/me
  tokenLogin: (token: string) => {
    return Promise.resolve({ access_token: token } as LoginResponse)
  },

  me: () => api.get<MeResponse>("/api/v1/me"),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  get: () => api.get<DashboardResponse>("/api/v1/dashboard"),
  daily: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<DailyReportResponse>("/api/v1/hisobot/kunlik")
    return flattenDailyReport(raw)
  },
  weekly: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<WeeklyReportResponse>("/api/v1/hisobot/haftalik")
    return flattenWeeklyReport(raw)
  },
  monthly: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<MonthlyReportResponse>("/api/v1/hisobot/oylik")
    return flattenMonthlyReport(raw)
  },
}

// ── Clients ───────────────────────────────────────────────────────────────────
// Backend returns {total, items: [...]} — extract items safely
export const clientService = {
  list: async (): Promise<ClientDto[]> => {
    const raw = await api.get<PaginatedResponse<ClientDto> | ClientDto[]>("/api/v1/klientlar")
    return extractItems(raw)
  },
  create: (data: Partial<ClientDto>) => api.post<ClientDto>("/api/v1/klient", data),
}

// ── Products ──────────────────────────────────────────────────────────────────
// Backend returns {total, items: [...]} — extract items safely
export const productService = {
  list: async (): Promise<ProductDto[]> => {
    const raw = await api.get<PaginatedResponse<ProductDto> | ProductDto[]>("/api/v1/tovarlar")
    return extractItems(raw)
  },
  get: (id: number) => api.get<ProductDto>(`/api/v1/tovar/${id}`),
}

// ── Debts ─────────────────────────────────────────────────────────────────────
// Backend returns grouped debts: [{klient_ismi, qolgan, soni, muddat}, ...]
export const debtService = {
  list: () => api.get<DebtDto[]>("/api/v1/qarzlar"),
  // Backend expects {klient_ismi, summa} — NOT {debt_id, amount}
  pay: (clientName: string, amount: number) =>
    api.post("/api/v1/qarz/tolash", { klient_ismi: clientName, summa: amount }),
}

// ── Reports / Export ──────────────────────────────────────────────────────────
// Backend returns nested objects; pages expect ReportEntry[] arrays for charts.
// These adapters flatten the nested responses into chart-friendly format.

function flattenDailyReport(raw: DailyReportResponse): ReportEntry[] {
  if (!raw) return []
  return [{
    date: new Date().toISOString().slice(0, 10),
    label: "Bugun",
    income: raw.kirim?.jami ?? 0,
    revenue: raw.sotuv?.jami ?? 0,
    outcome: raw.sotuv?.qarz ?? 0,
    expenses: 0,
  }]
}

function flattenWeeklyReport(raw: WeeklyReportResponse): ReportEntry[] {
  if (!raw) return []
  // Build chart entries from top_klientlar if available
  const entries: ReportEntry[] = []
  if (raw.top_klientlar && raw.top_klientlar.length > 0) {
    for (const k of raw.top_klientlar) {
      entries.push({ label: k.klient_ismi, revenue: k.jami, income: k.jami, value: k.soni })
    }
  }
  // Always include summary
  if (entries.length === 0) {
    entries.push({
      label: raw.davr ?? "7 kun",
      revenue: raw.sotuv?.jami ?? 0,
      income: raw.kirim?.jami ?? 0,
      outcome: raw.sotuv?.qarz ?? 0,
    })
  }
  return entries
}

function flattenMonthlyReport(raw: MonthlyReportResponse): ReportEntry[] {
  if (!raw) return []
  const entries: ReportEntry[] = []
  if (raw.top_tovarlar && raw.top_tovarlar.length > 0) {
    for (const t of raw.top_tovarlar) {
      entries.push({ label: t.tovar_nomi, revenue: t.jami, value: t.miqdor })
    }
  }
  if (entries.length === 0) {
    entries.push({
      label: raw.davr ?? "30 kun",
      revenue: raw.sotuv?.jami ?? 0,
      expenses: 0,
    })
  }
  return entries
}

export const reportService = {
  daily: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<DailyReportResponse>("/api/v1/hisobot/kunlik")
    return flattenDailyReport(raw)
  },
  weekly: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<WeeklyReportResponse>("/api/v1/hisobot/haftalik")
    return flattenWeeklyReport(raw)
  },
  monthly: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<MonthlyReportResponse>("/api/v1/hisobot/oylik")
    return flattenMonthlyReport(raw)
  },
  requestExport: (params: Record<string, string>) =>
    api.post<ExportTaskDto>("/api/v1/export", params),
  exportStatus: (taskId: string) =>
    api.get<ExportTaskDto>(`/api/v1/export/${taskId}`),
  exportFile: (taskId: string) =>
    `${getPublicApiBaseUrl()}/api/v1/export/file/${taskId}`,
}

// ── Apprentices ───────────────────────────────────────────────────────────────
export const apprenticeService = {
  list: () => api.get<ApprenticeDto[]>("/api/v1/shogirdlar"),
  dashboard: () => api.get<ApprenticeDashboard>("/api/v1/shogird/dashboard"),
  report: (id: number) => api.get("/api/v1/shogird/" + id + "/hisobot"),
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenseService = {
  today: () => api.get<ExpenseDto[]>("/api/v1/xarajatlar/bugungi"),
  monthly: () => api.get<ExpenseDto[]>("/api/v1/xarajatlar/oylik"),
  pending: () => api.get<ExpenseDto[]>("/api/v1/xarajatlar/kutilmoqda"),
  approve: (id: number) => api.post(`/api/v1/xarajat/${id}/tasdiqlash`),
  reject: (id: number) => api.post(`/api/v1/xarajat/${id}/bekor`),
}

// ── Prices ────────────────────────────────────────────────────────────────────
export const priceService = {
  groups: () => api.get<PriceGroupDto[]>("/api/v1/narx/guruhlar"),
  createGroup: (data: Partial<PriceGroupDto>) =>
    api.post<PriceGroupDto>("/api/v1/narx/guruh", data),
  setPrice: (data: Record<string, unknown>) =>
    api.post("/api/v1/narx/qoyish", data),
  assignClientGroup: (data: Record<string, unknown>) =>
    api.post("/api/v1/narx/klient_guruh", data),
}

// ── Cash ──────────────────────────────────────────────────────────────────────
export const cashService = {
  stats: () => api.get<CashStatsDto>("/api/v1/kassa/stats"),
  history: () => api.get<CashTransactionDto[]>("/api/v1/kassa/tarix"),
  // Backend expects KassaOperatsiya: {tur: "kirim"|"chiqim", summa, usul, tavsif, kategoriya}
  addTransaction: (data: CashOperationRequest) =>
    api.post<CashTransactionDto>("/api/v1/kassa/operatsiya", data),
  deleteTransaction: (id: number) =>
    api.delete(`/api/v1/kassa/operatsiya/${id}`),
}
