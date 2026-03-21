// ─── Clients ──────────────────────────────────────────────────────────────────
export type Client = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: "active" | "inactive" | "prospect"
  totalPurchases: number
  totalDebt: number
  joinedAt: string
  priceGroupId?: string
}

export const clients: Client[] = [
  { id: "c1",  name: "Jasur Toshmatov",    email: "jasur@techtrans.uz",   phone: "+998 90 123-4567", company: "TechTrans MChJ",   status: "active",   totalPurchases: 48200000, totalDebt: 0,         joinedAt: "2022-03-14", priceGroupId: "pg1" },
  { id: "c2",  name: "Malika Yusupova",    email: "malika@builduz.uz",    phone: "+998 91 234-5678", company: "BuildUZ",          status: "active",   totalPurchases: 91500000, totalDebt: 3400000,   joinedAt: "2021-07-22", priceGroupId: "pg1" },
  { id: "c3",  name: "Sherzod Raimov",     email: "sherzod@design.uz",    phone: "+998 93 345-6789", company: "DesignHub UZ",     status: "prospect", totalPurchases: 0,        totalDebt: 0,         joinedAt: "2024-01-05" },
  { id: "c4",  name: "Gulnora Karimova",   email: "gulnora@clouduz.uz",   phone: "+998 94 456-7890", company: "Cloud Nine UZ",    status: "active",   totalPurchases: 23700000, totalDebt: 1200000,   joinedAt: "2022-11-30", priceGroupId: "pg2" },
  { id: "c5",  name: "Bobur Abdullayev",   email: "bobur@pixel.uz",       phone: "+998 97 567-8901", company: "Pixel Works",      status: "inactive", totalPurchases: 15800000, totalDebt: 0,         joinedAt: "2020-05-18" },
  { id: "c6",  name: "Zulfiya Ergasheva",  email: "zulfiya@stream.uz",    phone: "+998 90 678-9012", company: "StreamLabs UZ",    status: "active",   totalPurchases: 67300000, totalDebt: 5900000,   joinedAt: "2023-02-09", priceGroupId: "pg1" },
  { id: "c7",  name: "Dilshod Nazarov",    email: "dilshod@automate.uz",  phone: "+998 91 789-0123", company: "Automate Pro UZ",  status: "active",   totalPurchases: 38900000, totalDebt: 0,         joinedAt: "2023-08-17", priceGroupId: "pg2" },
  { id: "c8",  name: "Nargiza Xasanova",   email: "nargiza@datapulse.uz", phone: "+998 93 890-1234", company: "DataPulse AI",     status: "prospect", totalPurchases: 0,        totalDebt: 0,         joinedAt: "2025-01-12" },
  { id: "c9",  name: "Otabek Mirzayev",    email: "otabek@greenleaf.uz",  phone: "+998 94 901-2345", company: "GreenLeaf UZ",     status: "inactive", totalPurchases: 9200000,  totalDebt: 800000,    joinedAt: "2021-03-27" },
  { id: "c10", name: "Sarvinoz Holiqova",  email: "sarvinoz@nexora.uz",   phone: "+998 97 012-3456", company: "Nexora UZ",        status: "active",   totalPurchases: 104000000, totalDebt: 2300000,  joinedAt: "2020-12-01", priceGroupId: "pg1" },
]

// ─── Products ─────────────────────────────────────────────────────────────────
export type Product = {
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

export const products: Product[] = [
  { id: "p1",  name: "Kiyim to'plami A",       sku: "KTA-001", category: "Kiyim",       price: 299000,  stock: 120, lowStockThreshold: 20,  description: "Yozgi kiyim to'plami",           status: "in-stock" },
  { id: "p2",  name: "Ayollar sumkasi",          sku: "AS-001",  category: "Aksessuarlar", price: 450000,  stock: 35,  lowStockThreshold: 10,  description: "Charm ayollar sumkasi",          status: "in-stock" },
  { id: "p3",  name: "Erkaklar ko'ylagi",        sku: "EK-002",  category: "Kiyim",       price: 185000,  stock: 8,   lowStockThreshold: 15,  description: "Ofis uchun klassik ko'ylak",     status: "low-stock" },
  { id: "p4",  name: "Sport poyabzal",           sku: "SP-003",  category: "Poyabzal",    price: 620000,  stock: 0,   lowStockThreshold: 5,   description: "Yugurish uchun sport poyabzal",  status: "out-of-stock" },
  { id: "p5",  name: "Qish kurtkasi",            sku: "QK-004",  category: "Kiyim",       price: 890000,  stock: 45,  lowStockThreshold: 10,  description: "Issiq qish kurtkasi",            status: "in-stock" },
  { id: "p6",  name: "Charm kamar",              sku: "CK-005",  category: "Aksessuarlar", price: 95000,   stock: 60,  lowStockThreshold: 15,  description: "Haqiqiy charm kamar",            status: "in-stock" },
  { id: "p7",  name: "Bolalar kiyim to'plami",   sku: "BK-006",  category: "Bolalar",     price: 220000,  stock: 6,   lowStockThreshold: 10,  description: "Bolalar uchun kiyim to'plami",   status: "low-stock" },
  { id: "p8",  name: "Klassik ko'nli tufli",     sku: "KT-007",  category: "Poyabzal",    price: 540000,  stock: 25,  lowStockThreshold: 5,   description: "Erkaklar uchun klassik tufli",   status: "in-stock" },
  { id: "p9",  name: "Ko'zoynak",                sku: "KO-008",  category: "Aksessuarlar", price: 320000,  stock: 0,   lowStockThreshold: 8,   description: "Quyoshdan himoya ko'zoynak",     status: "out-of-stock" },
  { id: "p10", name: "Sport kostyum",            sku: "SK-009",  category: "Kiyim",       price: 750000,  stock: 18,  lowStockThreshold: 10,  description: "Erkaklar uchun sport kostyum",   status: "in-stock" },
]

// ─── Debts ────────────────────────────────────────────────────────────────────
export type Debt = {
  id: string
  clientId: string
  clientName: string
  amount: number
  paid: number
  dueDate: string
  status: "pending" | "overdue" | "paid" | "partial"
  invoiceRef: string
  notes?: string
}

export const debts: Debt[] = [
  { id: "d1", clientId: "c2",  clientName: "Malika Yusupova",   amount: 3400000, paid: 0,       dueDate: "2025-03-01", status: "overdue",  invoiceRef: "INV-1024", notes: "Ikkinchi eslatma yuborildi" },
  { id: "d2", clientId: "c4",  clientName: "Gulnora Karimova",  amount: 1200000, paid: 600000,  dueDate: "2025-04-15", status: "partial",  invoiceRef: "INV-1031" },
  { id: "d3", clientId: "c6",  clientName: "Zulfiya Ergasheva", amount: 5900000, paid: 0,       dueDate: "2025-02-10", status: "overdue",  invoiceRef: "INV-1018", notes: "Yuridik ko'rib chiqish kutilmoqda" },
  { id: "d4", clientId: "c9",  clientName: "Otabek Mirzayev",   amount: 800000,  paid: 0,       dueDate: "2025-05-20", status: "pending",  invoiceRef: "INV-1045" },
  { id: "d5", clientId: "c10", clientName: "Sarvinoz Holiqova", amount: 2300000, paid: 2300000, dueDate: "2025-01-28", status: "paid",     invoiceRef: "INV-1012" },
  { id: "d6", clientId: "c1",  clientName: "Jasur Toshmatov",   amount: 1500000, paid: 1500000, dueDate: "2025-02-28", status: "paid",     invoiceRef: "INV-1020" },
  { id: "d7", clientId: "c7",  clientName: "Dilshod Nazarov",   amount: 4200000, paid: 0,       dueDate: "2025-05-01", status: "pending",  invoiceRef: "INV-1038" },
]

// ─── Invoices / Sales ─────────────────────────────────────────────────────────
export type InvoiceItem = {
  description: string
  qty: number
  unitPrice: number
}

export type Invoice = {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue"
  issueDate: string
  dueDate: string
}

export const invoices: Invoice[] = [
  {
    id: "i1", invoiceNumber: "INV-1050", clientId: "c1", clientName: "Jasur Toshmatov",
    items: [{ description: "Kiyim to'plami A", qty: 5, unitPrice: 299000 }, { description: "Charm kamar", qty: 3, unitPrice: 95000 }],
    subtotal: 1780000, tax: 178000, total: 1958000, status: "paid", issueDate: "2025-03-01", dueDate: "2025-03-31"
  },
  {
    id: "i2", invoiceNumber: "INV-1051", clientId: "c2", clientName: "Malika Yusupova",
    items: [{ description: "Ayollar sumkasi", qty: 4, unitPrice: 450000 }, { description: "Ko'zoynak", qty: 2, unitPrice: 320000 }],
    subtotal: 2440000, tax: 244000, total: 2684000, status: "overdue", issueDate: "2025-02-15", dueDate: "2025-03-15"
  },
  {
    id: "i3", invoiceNumber: "INV-1052", clientId: "c10", clientName: "Sarvinoz Holiqova",
    items: [{ description: "Qish kurtkasi", qty: 3, unitPrice: 890000 }],
    subtotal: 2670000, tax: 267000, total: 2937000, status: "paid", issueDate: "2025-03-10", dueDate: "2025-04-10"
  },
  {
    id: "i4", invoiceNumber: "INV-1053", clientId: "c6", clientName: "Zulfiya Ergasheva",
    items: [{ description: "Erkaklar ko'ylagi", qty: 10, unitPrice: 185000 }, { description: "Sport poyabzal", qty: 2, unitPrice: 620000 }],
    subtotal: 3090000, tax: 309000, total: 3399000, status: "sent", issueDate: "2025-03-20", dueDate: "2025-04-20"
  },
  {
    id: "i5", invoiceNumber: "INV-1054", clientId: "c4", clientName: "Gulnora Karimova",
    items: [{ description: "Bolalar kiyim to'plami", qty: 5, unitPrice: 220000 }],
    subtotal: 1100000, tax: 110000, total: 1210000, status: "paid", issueDate: "2025-03-05", dueDate: "2025-04-05"
  },
  {
    id: "i6", invoiceNumber: "INV-1055", clientId: "c7", clientName: "Dilshod Nazarov",
    items: [{ description: "Sport kostyum", qty: 2, unitPrice: 750000 }, { description: "Klassik ko'nli tufli", qty: 2, unitPrice: 540000 }],
    subtotal: 2580000, tax: 258000, total: 2838000, status: "draft", issueDate: "2025-03-25", dueDate: "2025-04-25"
  },
]

// ─── Activity Feed ─────────────────────────────────────────────────────────────
export type Activity = {
  id: string
  type: "invoice" | "payment" | "client" | "product" | "alert"
  messageUz: string
  messageRu: string
  timeKeyUz: string
  timeKeyRu: string
  meta?: string
}

export const recentActivity: Activity[] = [
  { id: "a1", type: "payment",  messageUz: "Sarvinoz Holiqovadan",              messageRu: "От Сарвиноз Холиқова",        timeKeyUz: "2 daqiqa oldin",   timeKeyRu: "2 минуты назад",   meta: "2 937 000 so'm" },
  { id: "a2", type: "invoice",  messageUz: "INV-1055 Dilshod Nazarov uchun",    messageRu: "INV-1055 для Дилшода Назарова", timeKeyUz: "1 soat oldin",     timeKeyRu: "1 час назад",     meta: "2 838 000 so'm" },
  { id: "a3", type: "client",   messageUz: "Yangi mijoz Nargiza Xasanova",     messageRu: "Новый клиент Наргиза Хасанова", timeKeyUz: "3 soat oldin",     timeKeyRu: "3 часа назад" },
  { id: "a4", type: "alert",    messageUz: "Erkaklar ko'ylagi (8 dona)",        messageRu: "Мужская рубашка (8 шт)",       timeKeyUz: "5 soat oldin",     timeKeyRu: "5 часов назад" },
  { id: "a5", type: "payment",  messageUz: "Gulnora Karimovadan (qisman)",     messageRu: "От Гульноры Каримовой (частично)", timeKeyUz: "Kecha",            timeKeyRu: "Вчера",            meta: "600 000 so'm" },
  { id: "a6", type: "invoice",  messageUz: "INV-1053 Zulfiya Ergashevaga",     messageRu: "INV-1053 Зульфие Эргашевой",   timeKeyUz: "Kecha",            timeKeyRu: "Вчера",            meta: "3 399 000 so'm" },
  { id: "a7", type: "alert",    messageUz: "INV-1051 muddati o'tdi",           messageRu: "INV-1051 просрочен",           timeKeyUz: "2 kun oldin",      timeKeyRu: "2 дня назад" },
]

// ─── Chart Data ────────────────────────────────────────────────────────────────
export const monthlyRevenue = [
  { month: "Avg",  revenue: 32400000, expenses: 18200000 },
  { month: "Sen",  revenue: 41200000, expenses: 22100000 },
  { month: "Okt",  revenue: 38900000, expenses: 20800000 },
  { month: "Noy",  revenue: 52300000, expenses: 27400000 },
  { month: "Dek",  revenue: 61800000, expenses: 31200000 },
  { month: "Yan",  revenue: 48700000, expenses: 24600000 },
  { month: "Fev",  revenue: 55100000, expenses: 28900000 },
  { month: "Mar",  revenue: 69200000, expenses: 34100000 },
]

export const revenueByCategory = [
  { name: "Kiyim",        value: 42 },
  { name: "Poyabzal",     value: 28 },
  { name: "Aksessuarlar", value: 19 },
  { name: "Bolalar",      value: 11 },
]

export const salesByClient = [
  { client: "Nexora UZ",      sales: 104000000 },
  { client: "StreamLabs UZ",  sales: 67300000 },
  { client: "TechTrans MChJ", sales: 48200000 },
  { client: "Automate Pro",   sales: 38900000 },
  { client: "GreenLeaf UZ",   sales: 9200000 },
]

// ─── Apprentices / Staff ──────────────────────────────────────────────────────
export type Apprentice = {
  id: string
  name: string
  role: string
  phone: string
  status: "active" | "inactive"
  dailyLimit: number
  monthlyLimit: number
  spentToday: number
  spentThisMonth: number
  joinedAt: string
}

export const apprentices: Apprentice[] = [
  { id: "ap1", name: "Akbar Raximov",     role: "Savdo bo'yicha yordamchi", phone: "+998 90 111-2233", status: "active",   dailyLimit: 200000,  monthlyLimit: 4000000,  spentToday: 85000,  spentThisMonth: 1250000, joinedAt: "2024-01-10" },
  { id: "ap2", name: "Feruza Saidova",    role: "Ombor xodimi",             phone: "+998 91 222-3344", status: "active",   dailyLimit: 150000,  monthlyLimit: 3000000,  spentToday: 0,      spentThisMonth: 980000,  joinedAt: "2024-03-22" },
  { id: "ap3", name: "Sanjar Tursunov",   role: "Yetkazib berish",          phone: "+998 93 333-4455", status: "active",   dailyLimit: 300000,  monthlyLimit: 5000000,  spentToday: 145000, spentThisMonth: 2100000, joinedAt: "2023-11-05" },
  { id: "ap4", name: "Mohira Usmonova",   role: "Kassir",                   phone: "+998 94 444-5566", status: "inactive", dailyLimit: 100000,  monthlyLimit: 2000000,  spentToday: 0,      spentThisMonth: 0,       joinedAt: "2024-06-14" },
  { id: "ap5", name: "Jahongir Qodirov",  role: "Savdo bo'yicha yordamchi", phone: "+998 97 555-6677", status: "active",   dailyLimit: 250000,  monthlyLimit: 4500000,  spentToday: 210000, spentThisMonth: 3200000, joinedAt: "2023-09-30" },
]

export type ApprenticeExpense = {
  id: string
  apprenticeId: string
  amount: number
  description: string
  date: string
}

export const apprenticeExpenses: ApprenticeExpense[] = [
  { id: "ae1", apprenticeId: "ap1", amount: 45000,  description: "Transport xarajati",     date: "2025-03-19" },
  { id: "ae2", apprenticeId: "ap1", amount: 40000,  description: "Tushlik",                date: "2025-03-19" },
  { id: "ae3", apprenticeId: "ap3", amount: 145000, description: "Yetkazib berish yoqilg'i", date: "2025-03-19" },
  { id: "ae4", apprenticeId: "ap5", amount: 120000, description: "Mijoz uchrashuvi",       date: "2025-03-19" },
  { id: "ae5", apprenticeId: "ap5", amount: 90000,  description: "Transport",              date: "2025-03-19" },
]

// ─── Expenses / Xarajatlar ────────────────────────────────────────────────────
export type Expense = {
  id: string
  title: string
  category: string
  amount: number
  requestedBy: string
  approvedBy?: string
  status: "pending" | "approved" | "rejected"
  date: string
  notes?: string
}

export const expenses: Expense[] = [
  { id: "e1",  title: "Ofis ijarasi",          category: "Ijara",      amount: 5000000, requestedBy: "Alisher Ergashev", approvedBy: "Alisher Ergashev", status: "approved", date: "2025-03-01" },
  { id: "e2",  title: "Yetkazib berish yoqilg'isi", category: "Transport", amount: 850000,  requestedBy: "Sanjar Tursunov",  status: "pending",  date: "2025-03-19" },
  { id: "e3",  title: "Xodimlar uchun tushlik", category: "Oziq-ovqat", amount: 320000,  requestedBy: "Feruza Saidova",   status: "pending",  date: "2025-03-19" },
  { id: "e4",  title: "Internet to'lovi",       category: "Kommunal",   amount: 280000,  requestedBy: "Alisher Ergashev", approvedBy: "Alisher Ergashev", status: "approved", date: "2025-03-05" },
  { id: "e5",  title: "Reklama",                category: "Marketing",  amount: 1500000, requestedBy: "Jahongir Qodirov", approvedBy: "Alisher Ergashev", status: "approved", date: "2025-03-10" },
  { id: "e6",  title: "Ofis jihozlari",         category: "Jihozlar",   amount: 2200000, requestedBy: "Alisher Ergashev", status: "pending",  date: "2025-03-18" },
  { id: "e7",  title: "Elektr energiyasi",      category: "Kommunal",   amount: 195000,  requestedBy: "Alisher Ergashev", approvedBy: "Alisher Ergashev", status: "approved", date: "2025-03-01" },
  { id: "e8",  title: "Mijoz sovg'asi",         category: "Marketing",  amount: 420000,  requestedBy: "Akbar Raximov",    status: "rejected", date: "2025-03-17", notes: "Byudjetdan tashqari" },
]

// ─── Price Groups ─────────────────────────────────────────────────────────────
export type PriceGroup = {
  id: string
  name: string
  discount: number
  description: string
  clientIds: string[]
}

export const priceGroups: PriceGroup[] = [
  { id: "pg1", name: "VIP",       discount: 15, description: "Eng yaxshi mijozlar uchun maxsus narxlar", clientIds: ["c1", "c2", "c6", "c10"] },
  { id: "pg2", name: "Doimiy",    discount: 8,  description: "Doimiy xaridorlar uchun chegirma",         clientIds: ["c4", "c7"] },
  { id: "pg3", name: "Standart",  discount: 0,  description: "Asosiy narx guruhiga kiruvchi mijozlar",   clientIds: ["c5", "c9"] },
]

// ─── Cash / Kassa ─────────────────────────────────────────────────────────────
export type CashTransaction = {
  id: string
  type: "income" | "outcome"
  amount: number
  description: string
  category: string
  date: string
  time: string
  performedBy: string
}

export const cashTransactions: CashTransaction[] = [
  { id: "ct1",  type: "income",  amount: 1958000, description: "Jasur Toshmatov — INV-1050",        category: "Savdo",      date: "2025-03-19", time: "09:14", performedBy: "Mohira Usmonova" },
  { id: "ct2",  type: "outcome", amount: 145000,  description: "Yetkazib berish yoqilg'isi",        category: "Transport",  date: "2025-03-19", time: "10:30", performedBy: "Sanjar Tursunov" },
  { id: "ct3",  type: "income",  amount: 2937000, description: "Sarvinoz Holiqova — INV-1052",      category: "Savdo",      date: "2025-03-19", time: "11:05", performedBy: "Mohira Usmonova" },
  { id: "ct4",  type: "outcome", amount: 320000,  description: "Xodimlar uchun tushlik",            category: "Oziq-ovqat", date: "2025-03-19", time: "13:00", performedBy: "Feruza Saidova" },
  { id: "ct5",  type: "income",  amount: 1210000, description: "Gulnora Karimova — INV-1054",       category: "Savdo",      date: "2025-03-18", time: "15:22", performedBy: "Mohira Usmonova" },
  { id: "ct6",  type: "outcome", amount: 280000,  description: "Internet to'lovi",                  category: "Kommunal",   date: "2025-03-18", time: "16:00", performedBy: "Alisher Ergashev" },
  { id: "ct7",  type: "outcome", amount: 5000000, description: "Ofis ijarasi — Mart",               category: "Ijara",      date: "2025-03-01", time: "09:00", performedBy: "Alisher Ergashev" },
  { id: "ct8",  type: "income",  amount: 600000,  description: "Gulnora Karimova — qisman to'lov",  category: "Savdo",      date: "2025-03-17", time: "14:40", performedBy: "Mohira Usmonova" },
  { id: "ct9",  type: "outcome", amount: 195000,  description: "Elektr energiyasi",                 category: "Kommunal",   date: "2025-03-01", time: "09:15", performedBy: "Alisher Ergashev" },
  { id: "ct10", type: "income",  amount: 2684000, description: "Xuddi shunday qo'shimcha kirim",    category: "Savdo",      date: "2025-03-16", time: "11:30", performedBy: "Mohira Usmonova" },
]

// ─── Payment history (for debts) ──────────────────────────────────────────────
export const mockPaymentHistory: Record<string, { date: string; amount: number; method: string }[]> = {
  d2: [{ date: "2025-03-10", amount: 600000, method: "Naqd" }],
  d5: [{ date: "2025-01-28", amount: 2300000, method: "Bank o'tkazmasi" }],
  d6: [{ date: "2025-02-28", amount: 1500000, method: "Naqd" }],
}
