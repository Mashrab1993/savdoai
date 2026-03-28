// ── API service functions ──────────────────────────────────────────────────────
// One function per backend endpoint. Returns typed DTOs.
// Pages should call normalizers on top of these.

import { api } from "./client"
import { getPublicApiBaseUrl } from "./base-url"
import type {
  LoginResponse, LoginRequest, MeResponse, DashboardResponse,
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

  // Login+parol yoki telefon+parol bilan kirish
  loginWithCredentials: (data: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", data),

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
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ id: number; status: string }>(`/api/v1/klient/${id}`, data),
  remove: (id: number) =>
    api.delete<{ id: number; status: string }>(`/api/v1/klient/${id}`),
}

// ── Products ──────────────────────────────────────────────────────────────────
// Backend returns {total, items: [...]} — extract items safely
export const productService = {
  list: async (): Promise<ProductDto[]> => {
    const raw = await api.get<PaginatedResponse<ProductDto> | ProductDto[]>("/api/v1/tovarlar")
    return extractItems(raw)
  },
  get: (id: number) => api.get<ProductDto>(`/api/v1/tovar/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post<{ id: number; nomi: string; status: string }>("/api/v1/tovar", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ id: number; status: string }>(`/api/v1/tovar/${id}`, data),
  remove: (id: number) =>
    api.delete<{ id: number; status: string }>(`/api/v1/tovar/${id}`),
  updateStock: (id: number, qoldiq: number) =>
    api.post<{ id: number; nomi: string; eski_qoldiq: number; yangi_qoldiq: number }>(
      `/api/v1/tovar/${id}/qoldiq`, { qoldiq }
    ),
  exportExcel: () =>
    api.get<{ filename: string; content_base64: string; tovar_soni: number }>(
      "/api/v1/tovar/export/excel"
    ),
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
  create: (data: { kategoriya_nomi: string; summa: number; izoh?: string; shogird_id?: number }) =>
    api.post<{ status: string; id?: number }>("/api/v1/xarajat", data),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface NotificationItem {
  tur: "qarz_muddati" | "kam_qoldiq" | "xarajat_tasdiq"
  darajasi: "xavfli" | "ogohlantirish" | "info"
  matn: string
  klient?: string
  tovar?: string
  summa?: number
  qoldiq?: number
  soni?: number
}

export const notificationService = {
  list: () => api.get<{ items: NotificationItem[]; jami: number }>("/api/v1/bildirishnomalar"),
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

// ── Savdolar (sotuv sessiyalari) ──────────────────────────────────────────────
export interface SavdoDto {
  id: number
  klient_ismi?: string
  jami?: number
  tolangan?: number
  qarz?: number
  izoh?: string
  sana?: string
  tovar_soni?: number
}

export interface SavdolarResponse {
  total: number
  items: SavdoDto[]
  stats: {
    bugun_tushum: number
    bugun_tolangan: number
    bugun_qarz: number
    bugun_soni: number
  }
}

export const savdoService = {
  list: (params?: { limit?: number; offset?: number; klient?: string; sana_dan?: string; sana_gacha?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    if (params?.klient) q.set("klient", params.klient)
    if (params?.sana_dan) q.set("sana_dan", params.sana_dan)
    if (params?.sana_gacha) q.set("sana_gacha", params.sana_gacha)
    const qs = q.toString()
    return api.get<SavdolarResponse>(`/api/v1/savdolar${qs ? `?${qs}` : ""}`)
  },
  detail: (id: number) => api.get<SavdoDto & { tovarlar: Array<Record<string, unknown>> }>(`/api/v1/savdo/${id}`),
  create: (data: {
    klient?: string
    tovarlar: Array<{ nomi: string; miqdor: number; birlik: string; narx: number; kategoriya?: string }>
    jami_summa: number
    tolangan: number
    qarz: number
    izoh?: string
  }) => api.post<{ sessiya_id: number; status: string }>("/api/v1/sotuv", data),
}

// ── Dashboard Top (charts) ────────────────────────────────────────────────────
export interface DashboardTopResponse {
  top_tovar: Array<{ nomi: string; jami: number; miqdor: number; foyda: number }>
  top_klient: Array<{ ism: string; jami: number; soni: number; qarz: number }>
  kunlik_trend: Array<{ kun: string; sotuv: number; qarz: number }>
}

export const dashboardTopService = {
  get: (kunlar?: number) =>
    api.get<DashboardTopResponse>(`/api/v1/dashboard/top${kunlar ? `?kunlar=${kunlar}` : ""}`),
}

// ── Tovar Import ──────────────────────────────────────────────────────────────
export const tovarImportService = {
  importBatch: (tovarlar: Array<{
    nomi: string; kategoriya?: string; birlik?: string;
    olish_narxi?: number; sotish_narxi?: number; qoldiq?: number
  }>) => api.post<{ yaratildi: number; yangilandi: number; xatolar: string[]; jami: number }>(
    "/api/v1/tovar/import", { tovarlar }
  ),
}

// ── Admin Statistika ──────────────────────────────────────────────────────────
export interface StatistikaResponse {
  tovar_soni: number
  klient_soni: number
  faol_qarz: number
  kam_qoldiq_soni: number
  muddat_otgan_qarz: number
  bugun: { soni: number; jami: number }
  hafta: { soni: number; jami: number }
  oy: { soni: number; jami: number }
}

export const statistikaService = {
  get: () => api.get<StatistikaResponse>("/api/v1/statistika"),
}

// ── Foyda Tahlili ─────────────────────────────────────────────────────────────
export interface FoydaResponse {
  kunlar: number
  brutto_sotuv: number
  tannarx: number
  sof_foyda: number
  xarajatlar: number
  toza_foyda: number
  margin_foiz: number
  top_foyda: Array<{ nomi: string; foyda: number; miqdor: number }>
  top_zarar: Array<{ nomi: string; zarar: number; miqdor: number }>
}

export const foydaService = {
  get: (kunlar?: number) =>
    api.get<FoydaResponse>(`/api/v1/hisobot/foyda${kunlar ? `?kunlar=${kunlar}` : ""}`),
}

// ── Profil ─────────────────────────────────────────────────────────────
export const profilService = {
  update: (data: { ism?: string; dokon_nomi?: string; telefon?: string; manzil?: string; inn?: string; til?: string }) =>
    api.put<{ status: string }>("/api/v1/me", data),
  changePassword: (eski_parol: string, yangi_parol: string) =>
    api.put<{ status: string }>("/api/v1/me/parol", { eski_parol, yangi_parol }),
}

// ── Klient Tarix ──────────────────────────────────────────────────────
export const klientTarixService = {
  get: (klientId: number, limit?: number) =>
    api.get<{
      klient: Record<string, unknown>
      sotuvlar: Array<Record<string, unknown>>
      qarzlar: Array<Record<string, unknown>>
    }>(`/api/v1/klient/${klientId}/tarix${limit ? `?limit=${limit}` : ""}`),
}

// ── Global Search ─────────────────────────────────────────────────────────────
export const searchService = {
  search: (q: string, tur?: "tovar" | "klient" | "barchasi") =>
    api.get<{
      tovarlar: Array<{ id: number; nomi: string; kategoriya: string; qoldiq: number; sotish_narxi: number }>
      klientlar: Array<{ id: number; ism: string; telefon: string; jami_sotib: number }>
      jami: number
    }>(`/api/v1/search?q=${encodeURIComponent(q)}${tur ? `&tur=${tur}` : ""}`),
}

// ── Tovar Tarix ───────────────────────────────────────────────────────────────
export const tovarTarixService = {
  get: (tovarId: number, limit?: number) =>
    api.get<{
      tovar: Record<string, unknown>
      sotuvlar: Array<Record<string, unknown>>
      kirimlar: Array<Record<string, unknown>>
      statistika: { sotuv_soni: number; jami_sotilgan: number; jami_tushum: number }
    }>(`/api/v1/tovar/${tovarId}/tarix${limit ? `?limit=${limit}` : ""}`),
}
