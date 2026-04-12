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
    // /hisobot/oylik-trend returns proper time-series;
    // fall back to /hisobot/oylik flatten if trend is empty.
    try {
      type TrendRow = { oy: string; oy_nomi: string; soni: number; sotuv: number; foyda: number }
      const rows = await api.get<TrendRow[]>("/api/v1/hisobot/oylik-trend?oylar=6")
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(r => ({
          month:    r.oy,
          label:    r.oy_nomi,
          revenue:  Number(r.sotuv || 0),
          income:   Number(r.sotuv || 0),
          expenses: Number((r.sotuv || 0) - (r.foyda || 0)),
          outcome:  Number((r.sotuv || 0) - (r.foyda || 0)),
        }))
      }
    } catch { /* fall through */ }
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
  shablonExcel: () =>
    api.get<{ filename: string; content_base64: string }>(
      "/api/v1/tovar/shablon/excel"
    ),
}

// ── Kirimlar (stock-in) ───────────────────────────────────────────────────────
export const kirimService = {
  list: (params?: {
    sana_dan?: string; sana_gacha?: string;
    qidiruv?: string; kategoriya?: string;
    limit?: number; offset?: number;
  }) => {
    const q = new URLSearchParams()
    if (params?.sana_dan)   q.set("sana_dan",   params.sana_dan)
    if (params?.sana_gacha) q.set("sana_gacha", params.sana_gacha)
    if (params?.qidiruv)    q.set("qidiruv",    params.qidiruv)
    if (params?.kategoriya) q.set("kategoriya", params.kategoriya)
    if (params?.limit)      q.set("limit",      String(params.limit))
    if (params?.offset)     q.set("offset",     String(params.offset))
    const qs = q.toString()
    return api.get<{
      items: Array<Record<string, unknown>>;
      stats: { soni?: number; jami_summa?: number; jami_miqdor?: number; turli_tovar?: number };
    }>(`/api/v1/kirimlar${qs ? `?${qs}` : ""}`)
  },
  create: (data: {
    tovar_id?: number;
    tovar_nomi: string;
    kategoriya?: string;
    birlik?: string;
    miqdor: number;
    narx: number;
    jami?: number;
    manba?: string;
    izoh?: string;
  }) => api.post<{ kirim_id: number; status: string }>("/api/v1/kirim", data),
  remove: (id: number) =>
    api.delete<{ id: number; status: string }>(`/api/v1/kirim/${id}`),
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
    // /hisobot/kunlik-trend returns proper per-day buckets (30 days)
    try {
      type Row = { sana: string; kun: string; soni: number; sotuv: number; tolangan: number; qarz: number }
      const rows = await api.get<Row[]>("/api/v1/hisobot/kunlik-trend?kunlar=30")
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(r => ({
          date:     r.sana,
          label:    r.kun,
          revenue:  Number(r.sotuv || 0),
          income:   Number(r.sotuv || 0),
          expenses: Number(r.qarz || 0),
          outcome:  Number(r.qarz || 0),
        }))
      }
    } catch { /* fall through */ }
    const raw = await api.get<DailyReportResponse>("/api/v1/hisobot/kunlik")
    return flattenDailyReport(raw)
  },
  weekly: async (): Promise<ReportEntry[]> => {
    const raw = await api.get<WeeklyReportResponse>("/api/v1/hisobot/haftalik")
    return flattenWeeklyReport(raw)
  },
  monthly: async (): Promise<ReportEntry[]> => {
    try {
      type Row = { oy: string; oy_nomi: string; soni: number; sotuv: number; foyda: number }
      const rows = await api.get<Row[]>("/api/v1/hisobot/oylik-trend?oylar=6")
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(r => ({
          month:    r.oy,
          label:    r.oy_nomi,
          revenue:  Number(r.sotuv || 0),
          income:   Number(r.sotuv || 0),
          expenses: Number((r.sotuv || 0) - (r.foyda || 0)),
          outcome:  Number((r.sotuv || 0) - (r.foyda || 0)),
        }))
      }
    } catch { /* fall through */ }
    const raw = await api.get<MonthlyReportResponse>("/api/v1/hisobot/oylik")
    return flattenMonthlyReport(raw)
  },
  requestExport: (params: Record<string, string>) =>
    api.post<ExportTaskDto>("/api/v1/export", params),
  exportStatus: (taskId: string) =>
    api.get<ExportTaskDto>(`/api/v1/export/${taskId}`),
  exportFile: (taskId: string) => {
    const base = getPublicApiBaseUrl()
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const url = `${base}/api/v1/export/file/${taskId}`
    return token ? `${url}?token=${encodeURIComponent(token)}` : url
  },
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

// Aggregate notifications endpoint in main.py (/api/v1/bildirishnomalar)
// Returns {items: [...], jami: n} — data-driven (qarz/kam_qoldiq/pending_xarajat)
// Different from /bildirishnoma router which is real notification table
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

// ── Faktura (Hisob-faktura) ──────────────────────────────────────────────────
export interface FakturaDto {
  id: number
  raqam: string
  klient_ismi: string
  jami_summa: number
  tovarlar?: Array<Record<string, unknown>>
  bank_rekvizit?: Record<string, unknown>
  holat: string
  yaratilgan: string
}

export const fakturaService = {
  list: (params?: { limit?: number; offset?: number; holat?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    if (params?.holat) q.set("holat", params.holat)
    const qs = q.toString()
    return api.get<{ total: number; items: FakturaDto[] }>(`/api/v1/fakturalar${qs ? `?${qs}` : ""}`)
  },
  detail: (id: number) => api.get<FakturaDto>(`/api/v1/faktura/${id}`),
  create: (data: {
    klient_ismi: string
    tovarlar: Array<Record<string, unknown>>
    jami_summa: number
    bank_rekvizit?: Record<string, unknown>
  }) => api.post<FakturaDto>("/api/v1/faktura", data),
  updateHolat: (id: number, holat: string) =>
    api.put<{ id: number; holat: string }>(`/api/v1/faktura/${id}/holat`, { holat }),
  remove: (id: number) =>
    api.delete<{ id: number; status: string }>(`/api/v1/faktura/${id}`),
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

// ── Agentlar Bugungi KPI ──────────────────────────────────────────────────────
export interface AgentKpiRow {
  id:           number
  ism:          string
  reja:         number
  tashrif_soni: number
  rejali_summa: number
  rejali_soni:  number
  ofplan_summa: number
  ofplan_soni:  number
  qaytarish:    number
}

export const agentlarKpiService = {
  bugungi: () => api.get<AgentKpiRow[]>("/api/v1/agentlar/bugungi-kpi"),
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
export interface HeatmapResponse {
  matrix: number[][]
  metric: "soni" | "summa"
  jami: number
  kunlar: number
}

export const heatmapService = {
  get: (kunlar = 30) => api.get<HeatmapResponse>(`/api/v1/hisobot/heatmap?kunlar=${kunlar}`),
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

// ── Ombor Prognoz ─────────────────────────────────────────────────────────────
export interface OmborPrognozItem {
  id: number
  nomi: string
  birlik: string
  qoldiq: number
  min_qoldiq: number
  kunlik_sotuv: number
  jami_sotilgan_30kun: number
  qolgan_kun: number | null
  holat: "tugagan" | "kam" | "xavfli" | "ogohlantirish" | "diqqat" | "yaxshi"
  buyurtma_kerak: boolean
  buyurtma_miqdor: number
  buyurtma_narx: number
}

export interface OmborPrognozResponse {
  tovarlar: OmborPrognozItem[]
  xulosa: {
    jami_tovar: number
    kam_qoldiq: number
    tugagan: number
    ombor_qiymati: number
  }
  kunlar: number
}

export const omborService = {
  prognoz: (kunlar?: number) =>
    api.get<OmborPrognozResponse>(`/api/v1/ombor/prognoz${kunlar ? `?kunlar=${kunlar}` : ""}`),
}

// ── KPI ───────────────────────────────────────────────────────────────────────
export interface KpiResponse {
  davr_kun: number
  sotuv_soni: number
  sotuv_jami: number
  ortacha_chek: number
  klient_soni: number
  yangi_klientlar: number
  qarz_berildi: number
  qarz_yigildi: number
  foyda: number
  margin_foiz: number
  kunlik_ortacha: number
  reyting: "A" | "B" | "C" | "D"
  trend: "o'sish" | "tushish" | "barqaror"
  trend_foiz: number
  badges: Array<{ emoji: string; nomi: string }>
}

export interface KpiTrendItem {
  kun: string
  soni: number
  jami: number
  qarz: number
  tolangan: number
}

export const kpiService = {
  get: (kunlar?: number) =>
    api.get<KpiResponse>(`/api/v1/kpi${kunlar ? `?kunlar=${kunlar}` : ""}`),
  trend: (kunlar?: number) =>
    api.get<KpiTrendItem[]>(`/api/v1/kpi/trend${kunlar ? `?kunlar=${kunlar}` : ""}`),
  leaderboard: (kunlar?: number) =>
    api.get<Array<{
      oring: number; uid: number; ism: string; dokon_nomi: string;
      sotuv_soni: number; sotuv_jami: number; klient_soni: number; reyting: string;
    }>>(`/api/v1/kpi/leaderboard${kunlar ? `?kunlar=${kunlar}` : ""}`),
}

// ── Qarz Eslatma ──────────────────────────────────────────────────────────────
export interface QarzEslatmaItem {
  klient_ismi: string
  klient_id: number | null
  telefon: string | null
  jami_qarz: number
  qarz_soni: number
  muddat: string | null
  muddati_otgan: boolean
  kun_otgan: number
  holat: "urgent" | "oddiy" | "yumshoq"
}

export const qarzEslatmaService = {
  list: () => api.get<QarzEslatmaItem[]>("/api/v1/qarz/eslatma"),
  xulosa: () => api.get<{
    klient_soni: number; jami_qarz: number;
    muddati_otgan_soni: number; muddati_otgan_summa: number;
  }>("/api/v1/qarz/xulosa"),
}

// ── Loyalty ───────────────────────────────────────────────────────────────────
export interface LoyaltyProfil {
  mavjud_ball: number
  jami_yigilgan: number
  jami_sarflangan: number
  daraja: { key: string; min_ball: number; chegirma_foiz: number; emoji: string; nomi: string }
  keyingi_daraja: { nomi: string; kerak_ball: number; chegirma_foiz: number } | null
  ball_qiymati: string
}

export const loyaltyService = {
  profil: (klientId: number) => api.get<LoyaltyProfil>(`/api/v1/loyalty/${klientId}`),
  sarflash: (klientId: number, ball: number, izoh?: string) =>
    api.post(`/api/v1/loyalty/${klientId}/sarflash`, { ball, izoh: izoh || "Chegirma" }),
}

// ── Dashboard V2 ──────────────────────────────────────────────────────────────
export const dashboardV2Service = {
  get: () => api.get<{
    bugun: { soni: number; jami: number; qarz: number }
    oy: { soni: number; jami: number }
    qarz: { klient_soni: number; jami: number; muddati_otgan: number }
    ombor: { jami: number; kam: number; tugagan: number; qiymat: number }
    reyting: "A" | "B" | "C" | "D"
    trend: Array<{ kun: string; soni: number; jami: number }>
  }>("/api/v1/dashboard/v2"),
}

// ── Multi-filial ──────────────────────────────────────────────────────────────
export const filialService = {
  list: () => api.get<{ items: Array<{
    id: number; nomi: string; manzil: string; turi: string; faol: boolean;
    asosiy: boolean; tovar_soni: number; ombor_qiymat: number
  }> }>("/api/v1/filial"),
  yaratish: (data: { nomi: string; manzil?: string; turi?: string }) =>
    api.post("/api/v1/filial", data),
  tovarlar: (filialId: number) =>
    api.get(`/api/v1/filial/${filialId}/tovarlar`),
  transfer: (data: { dan_filial_id: number; ga_filial_id: number; tovar_id: number; miqdor: number }) =>
    api.post("/api/v1/filial/transfer", data),
}

// ── AI Business Advisor ───────────────────────────────────────────────────────
export interface InsightItem {
  turi: "critical" | "warning" | "opportunity" | "info"
  emoji: string
  sarlavha: string
  tavsif: string
  tavsiya: string
}

export const advisorService = {
  get: () => api.get<{
    sana: string
    insightlar: InsightItem[]
    jami_topildi: number
  }>("/api/v1/advisor"),
}

// ── Subscription ──────────────────────────────────────────────────────────────
export const subscriptionService = {
  info: () => api.get<{
    tarif: string; nomi: string; emoji: string; narx: number;
    sinov: boolean; sinov_qolgan_kun: number;
    limitlar: { tovar: number; klient: number; sotuv_oylik: number; filial: number };
    funksiyalar: { kpi: boolean; loyalty: boolean; gps: boolean; export: boolean };
    ishlatilgan: { tovar: number; klient: number; sotuv_bu_oy: number };
    ogohlar: string[];
  }>("/api/v1/tarif"),
}

// ── Aksiya (SalesDoc: Bonus va chegirmalar) ──────────────────────────────────
// Backend router prefix is /aksiya (NO /api/v1 prefix)
export const aksiyaService = {
  list: () => api.get<unknown[]>("/aksiya"),
  create: (data: unknown) => api.post<unknown>("/aksiya", data),
  setHolat: (id: number, faol: boolean) =>
    api.put<unknown>(`/aksiya/${id}/holat?faol=${faol}`, {}),
  calculate: (data: unknown) => api.post<unknown>("/aksiya/hisoblash", data),
}

// ── Analitika ───────────────────────────────
// Backend uses /analitika/... (no /api/v1 prefix)
export const analitikaService = {
  abcXyz: () => api.get<unknown>("/analitika/abc-xyz"),
  churn:  () => api.get<unknown>("/analitika/churn"),
  cohort: () => api.get<unknown>("/analitika/cohort"),
}

// ── Moliya (P&L / Balance / Cash Flow / KPI) ─────────────────────────────────
// Backend: /moliya/... (no /api/v1 prefix, Uzbek endpoint names)
export const moliyaService = {
  foydaZarar:    () => api.get<unknown>("/moliya/foyda-zarar"),
  balans:        () => api.get<unknown>("/moliya/balans"),
  pulOqimi:      () => api.get<unknown>("/moliya/pul-oqimi"),
  koeffitsientlar: () => api.get<unknown>("/moliya/koeffitsientlar"),
}

// ── Tashrif (SalesDoc: Check-in/out, vizitlar) ───────────────────────────────
// Backend router prefix is /tashrif (no /api/v1)
export const tashrifService = {
  checkIn: (data: { lat: number; lng: number; klient_id?: number }) =>
    api.post<unknown>("/tashrif/checkin", data),
  checkOut: (id: number) => api.post<unknown>(`/tashrif/checkout/${id}`, {}),
  history: (limit = 100) => api.get<unknown[]>(`/tashrif/tarix?limit=${limit}`),
}

// ── Tovarlar V2 (SalesDoc: Kengaytirilgan tovar boshqaruvi) ──────────────────
export const tovarV2Service = {
  filter: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return api.get<unknown>(`/api/v1/tovarlar/v2?${qs}`)
  },
  categories: () => api.get<unknown[]>("/api/v1/tovarlar/v2/kategoriyalar"),
  brands: () => api.get<unknown[]>("/api/v1/tovarlar/v2/brendlar"),
}

// ── Export (SalesDoc: Excel/PDF export) ───────────────────────────────────────
// Backend routers mounted at root: /export, /kalendar
export const exportService = {
  tovarlarExcel: () => api.get<Blob>(`/export/tovarlar?fmt=excel`),
  klientlarExcel: () => api.get<Blob>(`/export/klientlar?fmt=excel`),
  sotuvlarExcel: (dan: string, gacha: string) =>
    api.get<Blob>(`/export/sotuvlar?sana_dan=${dan}&sana_gacha=${gacha}&fmt=excel`),
  bugun: () => api.get<unknown>("/kalendar/bugun"),
  hafta: () => api.get<unknown>("/kalendar/hafta"),
}

// ── GPS (SalesDoc: GPS monitoring) ───────────────────────────────────────────
// Backend: /gps/... (no /api/v1 prefix). Endpoints: POST /gps/tracks, GET /gps/tracks, GET /gps/oxirgi
export const gpsService = {
  track: (data: { lat: number; lng: number }) =>
    api.post<unknown>("/gps/tracks", data),
  history: (agentId?: number, sana?: string) =>
    api.get<unknown[]>(`/gps/tracks${sana ? `?sana=${sana}` : ""}`),
}

// ── Enterprise (topshiriq/foto/uskuna/filial/kassa) ──────────────────────────
// Backend: /topshiriq, /foto, /uskuna (no /api/v1 prefix)
export const enterpriseService = {
  tasks:       () => api.get<unknown[]>("/topshiriq"),
  createTask:  (data: unknown) => api.post<unknown>("/topshiriq", data),
  equipment:   () => api.get<unknown[]>("/uskuna"),
  foto:        () => api.get<unknown[]>("/foto"),
}

// ── Van Selling ───────────────────────────────────────────────────────────────
// Backend: /van/... (no /api/v1)
export const vanService = {
  routes:  () => api.get<unknown[]>("/van/marshrutlar"),
  sverka:  (marshrutId: number) => api.get<unknown>(`/sverka/${marshrutId}`),
  deliver: (data: unknown) => api.post<unknown>("/van/yetkazish", data),
}

// ── Pro Features (Klient 360, Leaderboard, Marshrut) ─────────────────────────
// Backend routers: /klient360, /marshrut, /gamification
export const proService = {
  client360:     (klientId: number) => api.get<unknown>(`/klient360/${klientId}`),
  leaderboard:   () => api.get<unknown[]>("/gamification/leaderboard"),
  routeOptimize: (data: unknown) => api.post<unknown>("/marshrut/optimallashtir", data),
}

// ── Config (Sozlamalar) ──────────────────────────────────────────────────────
// Backend: /config/... (no /api/v1)
export const configService = {
  get:     () => api.get<unknown>("/config"),
  update:  (data: unknown) => api.post<unknown>("/config", data),
  modules: () => api.get<unknown>("/config/modullar"),
}
