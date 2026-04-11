// ── Adapters: backend DTOs → UI view models ────────────────────────────────────
// UI ViewModel types are defined here. Pages use these instead of raw DTOs.

import type {
  ClientDto, ProductDto, DebtDto, ExpenseDto,
  ApprenticeDto, CashTransactionDto, CashStatsDto,
  DashboardResponse,
} from "./types"

// ── Client ────────────────────────────────────────────────────────────────────
export interface ClientVM {
  id: string
  name: string
  phone: string
  address: string
  creditLimit: number
  status: "active" | "inactive"
  totalPurchases: number
  totalDebt: number
  joinedAt: string
}

export function normalizeClient(d: ClientDto): ClientVM {
  return {
    id: String(d.id),
    name: d.ism ?? "",
    phone: d.telefon ?? "",
    address: d.manzil ?? "",
    creditLimit: d.kredit_limit ?? 0,
    status: "active",
    totalPurchases: d.jami_sotib ?? 0,
    totalDebt: d.aktiv_qarz ?? 0,
    joinedAt: d.qoshilgan_sana ?? d.yaratilgan ?? "",
  }
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface ProductVM {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  lowStockThreshold: number
  unit: string
  description: string
  status: "in-stock" | "low-stock" | "out-of-stock"
}

export function normalizeProduct(d: ProductDto): ProductVM {
  // Backend uses qoldiq/min_qoldiq/sotish_narxi; frontend had ombor/min_ombor/narx
  const stock = d.qoldiq ?? d.ombor ?? 0
  const threshold = d.min_qoldiq ?? d.min_ombor ?? 5
  const status: ProductVM["status"] =
    stock === 0 ? "out-of-stock" : stock <= threshold ? "low-stock" : "in-stock"
  // SKU: prefer shtrix_kod (EAN), then artikul, then sap_kod, then internal kod
  const sku = d.shtrix_kod || d.artikul || d.sap_kod || d.kod || d.sku || ""
  // Description prefers real tavsif; falls back to "brend · ishlab_chiqaruvchi"
  const desc = d.tavsif ||
    [d.brend, d.ishlab_chiqaruvchi].filter(Boolean).join(" · ") ||
    d.birlik || ""
  return {
    id: String(d.id),
    name: d.nomi ?? "",
    sku,
    category: d.kategoriya ?? "",
    price: d.sotish_narxi ?? d.narx ?? 0,
    stock,
    lowStockThreshold: threshold,
    unit: d.birlik ?? "",
    description: desc,
    status,
  }
}

// ── Debt ──────────────────────────────────────────────────────────────────────
// Backend /api/v1/qarzlar returns GROUPED debts:
//   [{klient_ismi, qolgan, soni, muddat}, ...]
// NOT individual debt rows with id/invoice_id/paid/status.
export interface DebtVM {
  id: string
  clientName: string
  invoiceId: string
  amount: number
  paid: number
  dueDate: string
  status: "pending" | "overdue" | "partial" | "paid"
  count: number // number of underlying debts for this client
}

export function normalizeDebt(d: DebtDto, index: number = 0): DebtVM {
  // Map grouped backend fields
  const clientName = d.klient_ismi ?? d.client_name ?? ""
  const amount = d.qolgan ?? d.amount ?? 0
  const dueDate = d.muddat ?? d.due_date ?? ""
  const count = d.soni ?? 1

  // Derive status: if muddat is in the past → overdue, else pending
  let status: DebtVM["status"] = d.status ?? "pending"
  if (!d.status && dueDate) {
    try {
      const due = new Date(dueDate)
      if (due < new Date()) status = "overdue"
    } catch {
      // leave as pending
    }
  }
  if (amount === 0) status = "paid"

  return {
    id: d.id != null ? String(d.id) : `debt-${index}`,
    clientName,
    invoiceId: d.invoice_id ?? "",
    amount,
    paid: d.paid ?? 0,
    dueDate,
    status,
    count,
  }
}

// ── Expense ───────────────────────────────────────────────────────────────────
export interface ExpenseVM {
  id: string
  category: string
  amount: number
  description: string
  date: string
  status: "pending" | "approved" | "rejected"
  author: string
}

export function normalizeExpense(d: ExpenseDto): ExpenseVM {
  // Backend may return tasdiqlangan/bekor_qilingan booleans instead of holat string
  let status: ExpenseVM["status"] = d.holat ?? "pending"
  if (d.tasdiqlangan) status = "approved"
  if (d.bekor_qilingan) status = "rejected"
  return {
    id: String(d.id),
    category: d.kategoriya ?? d.kategoriya_nomi ?? "",
    amount: d.summa ?? 0,
    description: d.tavsif ?? d.izoh ?? "",
    date: d.sana ?? "",
    status,
    author: d.muallif ?? "",
  }
}

// ── Apprentice ────────────────────────────────────────────────────────────────
export interface ApprenticeVM {
  id: string
  name: string
  phone: string
  specialty: string
  level: string
  salary: number
  joinedAt: string
  active: boolean
  todaySales: number
  monthlySales: number
}

export function normalizeApprentice(d: ApprenticeDto): ApprenticeVM {
  return {
    id: String(d.id),
    name: d.ism ?? "",
    phone: d.telefon ?? "",
    specialty: d.mutaxassislik ?? d.lavozim ?? "",
    level: d.daraja ?? "",
    salary: d.oylik ?? 0,
    joinedAt: d.qoshilgan_sana ?? d.yaratilgan ?? "",
    active: d.faol !== false,
    todaySales: d.bugungi_savdo ?? 0,
    monthlySales: d.oylik_savdo ?? 0,
  }
}

// ── Cash Transaction ──────────────────────────────────────────────────────────
export interface CashTransactionVM {
  id: string
  type: "income" | "outcome"
  amount: number
  description: string
  date: string
  category: string
  method: string
}

export function normalizeCashTransaction(d: CashTransactionDto): CashTransactionVM {
  // Backend uses "kirim"/"chiqim"; frontend uses "income"/"outcome"
  let type: CashTransactionVM["type"] = "income"
  if (d.tur === "chiqim" || d.tur === "outcome") type = "outcome"

  return {
    id: String(d.id),
    type,
    amount: d.summa ?? 0,
    description: d.tavsif ?? "",
    date: d.sana ?? (d.yaratilgan ? d.yaratilgan.slice(0, 10) : ""),
    category: d.kategoriya ?? "",
    method: d.usul ?? "naqd",
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardVM {
  totalClients: number
  activeClients: number
  totalRevenue: number
  todayCashIncome: number
  totalDebt: number
  overdueCount: number
  overdueAmount: number
  pendingExpenses: number
  activeApprentices: number
  totalInvoices: number
}

export function normalizeDashboard(d: DashboardResponse): DashboardVM {
  return {
    // Map Uzbek → English, fall back to English keys if present
    totalClients: d.klient_soni ?? d.total_clients ?? 0,
    activeClients: d.active_clients ?? d.klient_soni ?? 0,
    totalRevenue: d.total_revenue ?? d.bugun_sotuv_jami ?? 0,
    todayCashIncome: d.bugun_sotuv_jami ?? d.today_income ?? 0,
    totalDebt: d.jami_qarz ?? d.total_debt ?? 0,
    overdueCount: d.overdue_count ?? 0,
    overdueAmount: d.overdue_amount ?? 0,
    pendingExpenses: d.pending_expenses ?? 0,
    activeApprentices: d.active_apprentices ?? 0,
    totalInvoices: d.bugun_sotuv_soni ?? d.total_invoices ?? 0,
  }
}

// ── Price Group ───────────────────────────────────────────────────────────────
export interface PriceGroupVM {
  id: string
  name: string
  discount: number
  description: string
  clientIds: string[]
}

export function normalizePriceGroup(d: import("./types").PriceGroupDto): PriceGroupVM {
  return {
    id: String(d.id),
    name: d.nomi ?? "",
    discount: d.chegirma ?? 0,
    description: d.tavsif ?? d.izoh ?? "",
    clientIds: [],
  }
}

// ── Cash Stats ────────────────────────────────────────────────────────────────
export interface CashStatsVM {
  balance: number
  todayIncome: number
  todayOutcome: number
  monthlyIncome: number
  monthlyOutcome: number
}

export function normalizeCashStats(d: CashStatsDto): CashStatsVM {
  return {
    // Map Uzbek kassa/stats fields → English UI fields
    balance: d.jami_balans ?? d.balance ?? 0,
    todayIncome: d.bugun_kirim ?? d.today_income ?? 0,
    todayOutcome: d.bugun_chiqim ?? d.today_outcome ?? 0,
    monthlyIncome: d.jami_kirim ?? d.monthly_income ?? 0,
    monthlyOutcome: d.jami_chiqim ?? d.monthly_outcome ?? 0,
  }
}
