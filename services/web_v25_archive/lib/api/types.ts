// ── Backend DTO types ──────────────────────────────────────────────────────────
// These match the EXACT shapes returned by the SavdoAI backend API.
// Do NOT use these directly in UI — use the normalizers instead.

export interface ApiError {
  detail?: string
  message?: string
  status?: number
}

// ── Paginated wrapper (used by /klientlar, /tovarlar) ────────────────────────
export interface PaginatedResponse<T> {
  total: number
  items: T[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// POST /auth/telegram → {token, user_id}
export interface LoginResponse {
  token?: string
  access_token?: string
  user_id?: number
  token_type?: string
}

// POST /auth/login → {token, user_id}
export interface LoginRequest {
  login?: string
  telefon?: string
  parol: string
}

// GET /api/v1/me → users table row
export interface MeResponse {
  id: number
  ism?: string
  username?: string
  telefon?: string
  dokon_nomi?: string
  segment?: string
  faol?: boolean
  til?: string
  plan?: string
  // Compat aliases the frontend may reference
  email?: string
  full_name?: string
  role?: string
  avatar?: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// GET /api/v1/dashboard → Uzbek-keyed stats
export interface DashboardResponse {
  // Real backend keys (Uzbek)
  bugun_sotuv_soni?: number
  bugun_sotuv_jami?: number
  bugun_yangi_qarz?: number
  jami_qarz?: number
  klient_soni?: number
  tovar_soni?: number
  kam_qoldiq_soni?: number
  // Allow English fallbacks if backend evolves
  total_clients?: number
  active_clients?: number
  total_revenue?: number
  today_income?: number
  total_debt?: number
  overdue_count?: number
  overdue_amount?: number
  pending_expenses?: number
  active_apprentices?: number
  total_invoices?: number
}

// ── Reports ───────────────────────────────────────────────────────────────────
// GET /api/v1/hisobot/kunlik → nested object, NOT array
export interface DailyReportResponse {
  kirim?: { soni: number; jami: number }
  sotuv?: { soni: number; jami: number; qarz?: number }
  jami_qarz?: number
}

// GET /api/v1/hisobot/haftalik → nested object
export interface WeeklyReportResponse {
  davr?: string
  sotuv?: { soni: number; jami: number; qarz?: number }
  kirim?: { soni: number; jami: number }
  top_klientlar?: Array<{ klient_ismi: string; jami: number; soni: number }>
}

// GET /api/v1/hisobot/oylik → nested object
export interface MonthlyReportResponse {
  davr?: string
  sotuv?: { soni: number; jami: number }
  sof_foyda?: number
  top_tovarlar?: Array<{ tovar_nomi: string; miqdor: number; jami: number }>
}

// Chart-compatible flattened entry (produced by normalizers, NOT raw backend)
export interface ReportEntry {
  date?: string
  month?: string
  week?: string
  income?: number
  outcome?: number
  revenue?: number
  expenses?: number
  label?: string
  value?: number
}

// ── Clients ───────────────────────────────────────────────────────────────────
// GET /api/v1/klientlar → {total, items: [klientlar rows]}
export interface ClientDto {
  id: number
  user_id?: number
  ism?: string
  telefon?: string
  manzil?: string
  inn?: string
  eslatma?: string
  kredit_limit?: number
  jami_sotib?: number
  aktiv_qarz?: number
  yaratilgan?: string
  // Allow optional English-fallback fields
  email?: string
  kompaniya?: string
  aktiv?: boolean
  qoshilgan_sana?: string
  status?: string
}

// ── Products ──────────────────────────────────────────────────────────────────
// GET /api/v1/tovarlar → {total, items: [tovarlar rows]}
export interface ProductDto {
  id: number
  user_id?: number
  nomi?: string
  kategoriya?: string
  birlik?: string
  olish_narxi?: number
  sotish_narxi?: number
  min_sotish_narxi?: number
  qoldiq?: number
  min_qoldiq?: number
  yaratilgan?: string
  // SalesDoc-compatible extended fields
  brend?: string
  podkategoriya?: string
  guruh?: string
  ishlab_chiqaruvchi?: string
  segment?: string
  savdo_yonalishi?: string
  shtrix_kod?: string
  artikul?: string
  sap_kod?: string
  kod?: string
  ikpu_kod?: string
  gtin?: string
  hajm?: number
  ogirlik?: number
  blokda_soni?: number
  korobkada_soni?: number
  saralash?: number
  yaroqlilik_muddati?: number
  tavsif?: string
  rasm_url?: string
  faol?: boolean
  yangilangan?: string
  // Allow optional frontend-expected aliases
  sku?: string
  narx?: number
  ombor?: number
  min_ombor?: number
  holat?: string
}

// ── Debts ─────────────────────────────────────────────────────────────────────
// GET /api/v1/qarzlar → grouped by klient_ismi
export interface DebtDto {
  // Real backend fields (grouped)
  klient_ismi?: string
  qolgan?: number
  soni?: number
  muddat?: string
  // Allow individual debt fields if backend evolves
  id?: number
  client_id?: number
  client_name?: string
  invoice_id?: string
  amount?: number
  paid?: number
  due_date?: string
  status?: "pending" | "overdue" | "partial" | "paid"
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseDto {
  id: number
  kategoriya?: string
  kategoriya_nomi?: string
  summa?: number
  tavsif?: string
  izoh?: string
  sana?: string
  holat?: "pending" | "approved" | "rejected"
  tasdiqlangan?: boolean
  bekor_qilingan?: boolean
  muallif?: string
  shogird_id?: number
}

// ── Apprentices ───────────────────────────────────────────────────────────────
export interface ApprenticeDto {
  id: number
  ism?: string
  telefon?: string
  lavozim?: string
  mutaxassislik?: string
  daraja?: string
  oylik?: number
  kunlik_limit?: number
  oylik_limit?: number
  qoshilgan_sana?: string
  yaratilgan?: string
  faol?: boolean
  bugungi_savdo?: number
  oylik_savdo?: number
}

export interface ApprenticeDashboard {
  total?: number
  active?: number
  total_sales?: number
  top_performers?: ApprenticeDto[]
}

// ── Cash ──────────────────────────────────────────────────────────────────────
// GET /api/v1/kassa/stats → KassaStats from backend
export interface CashStatsDto {
  bugun_kirim?: number
  bugun_chiqim?: number
  bugun_balans?: number
  jami_kirim?: number
  jami_chiqim?: number
  jami_balans?: number
  naqd_balans?: number
  karta_balans?: number
  otkazma_balans?: number
  // Allow English fallbacks
  balance?: number
  today_income?: number
  today_outcome?: number
  monthly_income?: number
  monthly_outcome?: number
}

// GET /api/v1/kassa/tarix → KassaQator[]
export interface CashTransactionDto {
  id: number
  tur?: "kirim" | "chiqim" | "income" | "outcome"
  summa?: number
  usul?: "naqd" | "karta" | "otkazma"
  tavsif?: string
  kategoriya?: string
  sana?: string
  vaqt?: string
  yaratilgan?: string
}

// POST /api/v1/kassa/operatsiya — request body
export interface CashOperationRequest {
  tur: "kirim" | "chiqim"
  summa: number
  usul?: "naqd" | "karta" | "otkazma"
  tavsif?: string
  kategoriya?: string
}

// ── Prices ────────────────────────────────────────────────────────────────────
export interface PriceGroupDto {
  id: number
  nomi?: string
  izoh?: string
  chegirma?: number
  tavsif?: string
}

// ── Export ─────────────────────────────────────────────────────────────────────
export interface ExportTaskDto {
  task_id: string
  status?: "pending" | "processing" | "done" | "failed"
  holat?: string
  file_url?: string
  download?: string
  format?: string
}
