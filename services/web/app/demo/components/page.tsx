"use client"

/**
 * /demo/components — live showcase of every premium dashboard component
 * with synthetic data.  Mount this page to verify theme/locale/animations
 * without needing the backend to populate real numbers first.
 */

import { AdminLayout } from "@/components/layout/admin-layout"
import KpiGridPremium from "@/components/dashboard/kpi-grid-premium"
import OrderStatusBoard from "@/components/dashboard/order-status-board"
import AgentKpiBoard from "@/components/dashboard/agent-kpi-board"
import ClientDirectoryTable from "@/components/dashboard/client-directory-table"
import ProductStockGrid from "@/components/dashboard/product-stock-grid"
import PnLReport from "@/components/dashboard/pnl-report"
import Client360View from "@/components/dashboard/client-360-view"
import WarehouseTransferBoard from "@/components/dashboard/warehouse-transfer-board"
import CashboxBalance from "@/components/dashboard/cashbox-balance"
import DebtorsList from "@/components/dashboard/debtors-list"
import AgentRouteCard from "@/components/dashboard/agent-route-card"
import SupplierBalance from "@/components/dashboard/supplier-balance"
import PhotoReportGrid from "@/components/dashboard/photo-report-grid"
import SalesPivotTable from "@/components/dashboard/sales-pivot-table"
import NotificationStream from "@/components/dashboard/notification-stream"
import { useLocale } from "@/lib/locale-context"

// ─── Synthetic data ─────────────────────────────────────────

const KPI_STATS = {
  bugungiSotuv:    28_261_100,
  haftalikDaromad: 175_420_000,
  oylikFoyda:      72_550_000,
  faolMijozlar:    184,
  qarzlar:         14_850_000,
  otgruzka:        27,
  yetkazildi:      145,
  kamQoldiq:       12,
}

const KPI_DELTAS = {
  bugungiSotuv:    12.4,
  haftalikDaromad: 8.7,
  oylikFoyda:      15.2,
  faolMijozlar:    3,
  qarzlar:         -5.1,
  otgruzka:        20,
  yetkazildi:      9.8,
  kamQoldiq:       -2,
}

const ORDERS = [
  { id: 4821, klient_ismi: "Do'kon Buyuk Ipak Yo'li", jami: 2_480_000, tolangan: 2_480_000, qarz: 0,         holat: "yangi"        as const, sana: new Date().toISOString() },
  { id: 4820, klient_ismi: "Mini Market Samarqand",   jami: 1_250_000, tolangan: 500_000,   qarz: 750_000,   holat: "yangi"        as const, sana: new Date(Date.now() - 3600e3).toISOString() },
  { id: 4819, klient_ismi: "Supermarket Registon",    jami: 5_480_000, tolangan: 5_480_000, qarz: 0,         holat: "tasdiqlangan" as const, sana: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: 4818, klient_ismi: "Oziq-ovqat Urgut",        jami: 3_100_000, tolangan: 2_000_000, qarz: 1_100_000, holat: "otgruzka"     as const, sana: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { id: 4817, klient_ismi: "Universal Jomboy",        jami: 1_850_000, tolangan: 1_850_000, qarz: 0,         holat: "otgruzka"     as const, sana: new Date(Date.now() - 6 * 3600e3).toISOString() },
  { id: 4816, klient_ismi: "Dahmazor Do'koni",        jami: 980_000,   tolangan: 980_000,   qarz: 0,         holat: "yetkazildi"   as const, sana: new Date(Date.now() - 24 * 3600e3).toISOString() },
  { id: 4815, klient_ismi: "Taloni Market",           jami: 4_220_000, tolangan: 4_220_000, qarz: 0,         holat: "yetkazildi"   as const, sana: new Date(Date.now() - 27 * 3600e3).toISOString() },
  { id: 4814, klient_ismi: "Klub Toy Xizmat",         jami: 650_000,   tolangan: 0,         qarz: 650_000,   holat: "bekor"        as const, sana: new Date(Date.now() - 48 * 3600e3).toISOString(), bekor_sabab: "Mijoz qaytarib oldi" },
]

const AGENTS = [
  { id: 1, ism: "Sayitqulov Mashrab",  reja: 127, tashrif_soni: 6,  rejali_summa: 14_270_800, rejali_soni: 6,  ofplan_summa: 13_990_300, ofplan_soni: 19, qaytarish: 0 },
  { id: 2, ism: "Davlat Rahimov",      reja: 185, tashrif_soni: 21, rejali_summa: 8_684_375,  rejali_soni: 11, ofplan_summa: 0,          ofplan_soni: 0,  qaytarish: 0 },
  { id: 3, ism: "Berdiyev Rahmatillo", reja: 172, tashrif_soni: 20, rejali_summa: 7_645_000,  rejali_soni: 7,  ofplan_summa: 0,          ofplan_soni: 0,  qaytarish: 0 },
  { id: 4, ism: "Boriev Mirjalol",     reja: 283, tashrif_soni: 4,  rejali_summa: 1_227_650,  rejali_soni: 4,  ofplan_summa: 5_940_600,  ofplan_soni: 11, qaytarish: 2 },
  { id: 5, ism: "Babadjanova Nargiza", reja: 260, tashrif_soni: 27, rejali_summa: 6_091_880,  rejali_soni: 9,  ofplan_summa: 610_000,    ofplan_soni: 1,  qaytarish: 0 },
  { id: 6, ism: "Tursunov Jamshed",    reja: 14,  tashrif_soni: 3,  rejali_summa: 950_000,    rejali_soni: 3,  ofplan_summa: 580_000,    ofplan_soni: 1,  qaytarish: 0 },
]

const CLIENTS = [
  { id: 1, ism: "Do'kon Buyuk Ipak Yo'li",  telefon: "+998 90 123 45 67", manzil: "Samarqand sh., Registon", kategoriya: "Supermarket", kredit_limit: 50_000_000, joriy_qarz: 12_500_000, oxirgi_sotuv: new Date().toISOString(),                     jami_xaridlar: 285_000_000, xarid_soni: 142, faol: true  },
  { id: 2, ism: "Mini Market Samarqand",    telefon: "+998 91 234 56 78", manzil: "Samarqand, Siyob",         kategoriya: "Rozn",        kredit_limit: 10_000_000, joriy_qarz: 3_200_000,  oxirgi_sotuv: new Date(Date.now() - 2 * 86400e3).toISOString(), jami_xaridlar: 62_800_000,  xarid_soni: 58,  faol: true  },
  { id: 3, ism: "Supermarket Registon",     telefon: "+998 97 345 67 89", manzil: "Samarqand, Universitet",   kategoriya: "Super",       kredit_limit: 80_000_000, joriy_qarz: 0,          oxirgi_sotuv: new Date().toISOString(),                     jami_xaridlar: 412_000_000, xarid_soni: 211, faol: true  },
  { id: 4, ism: "Oziq-ovqat Urgut",         telefon: "+998 93 456 78 90", manzil: "Urgut sh.",               kategoriya: "HoReCa",      kredit_limit: 15_000_000, joriy_qarz: 14_200_000, oxirgi_sotuv: new Date(Date.now() - 45 * 86400e3).toISOString(), jami_xaridlar: 38_400_000, xarid_soni: 22,  faol: false },
  { id: 5, ism: "Universal Jomboy",         telefon: "+998 98 567 89 01", manzil: "Jomboy tumani",           kategoriya: "Rozn",        kredit_limit: 20_000_000, joriy_qarz: 1_500_000,  oxirgi_sotuv: new Date(Date.now() - 7 * 86400e3).toISOString(),  jami_xaridlar: 89_600_000, xarid_soni: 67,  faol: true  },
]

const PRODUCTS = [
  { id: 1, nomi: "Ariel Automat 6kg",   brend: "Procter & Gamble", kategoriya: "Kimyo",    birlik: "dona", sotish_narxi: 165_000, olish_narxi: 120_000, qoldiq: 184, min_qoldiq: 30, faol: true, shtrix_kod: "4015600123456" },
  { id: 2, nomi: "Coca-Cola 1.5L",      brend: "Coca-Cola",        kategoriya: "Ichimlik", birlik: "dona", sotish_narxi: 14_000,  olish_narxi: 11_000,  qoldiq: 412, min_qoldiq: 60, faol: true, shtrix_kod: "5449000000996" },
  { id: 3, nomi: "Milk Gold 3.2% 1L",   brend: "Milk Gold",        kategoriya: "Sut",       birlik: "dona", sotish_narxi: 12_500,  olish_narxi: 9_500,   qoldiq: 8,   min_qoldiq: 20, faol: true, shtrix_kod: "4780001234567" },
  { id: 4, nomi: "Snickers 50g",         brend: "Mars",             kategoriya: "Shirinlik", birlik: "dona", sotish_narxi: 7_500,   olish_narxi: 5_200,   qoldiq: 0,   min_qoldiq: 48, faol: true, shtrix_kod: "5000159461122" },
  { id: 5, nomi: "Lays Classic 150g",    brend: "PepsiCo",          kategoriya: "Chipsi",    birlik: "dona", sotish_narxi: 18_000,  olish_narxi: 13_500,  qoldiq: 62,  min_qoldiq: 24, faol: true, shtrix_kod: "4060800109187" },
  { id: 6, nomi: "Non Uy 0.5kg",         brend: "Non Uy",           kategoriya: "Non",       birlik: "dona", sotish_narxi: 4_000,   olish_narxi: 2_800,   qoldiq: 25,  min_qoldiq: 30, faol: true, shtrix_kod: "4780009876543" },
  { id: 7, nomi: "Head&Shoulders 400ml", brend: "Procter & Gamble", kategoriya: "Kimyo",     birlik: "dona", sotish_narxi: 52_000,  olish_narxi: 38_000,  qoldiq: 96,  min_qoldiq: 15, faol: true, shtrix_kod: "8001090789012" },
  { id: 8, nomi: "Nescafe Gold 100g",    brend: "Nestle",           kategoriya: "Ichimlik",  birlik: "dona", sotish_narxi: 45_000,  olish_narxi: 32_000,  qoldiq: 34,  min_qoldiq: 20, faol: true, shtrix_kod: "7613034567894" },
]

const PNL = {
  davr_nomi:           "Oxirgi 30 kun",
  tushum:              528_640_000,
  tannarx:             356_400_000,
  yalpi_foyda:         172_240_000,
  operatsion_xarajatlar: 62_180_000,
  sof_foyda:           110_060_000,
  qaytarishlar:        2_150_000,
  chegirmalar:         4_320_000,
  xarajat_kategoriyalar: [
    { nomi: "Ish haqi",        summa: 28_500_000 },
    { nomi: "Transport",        summa: 12_400_000 },
    { nomi: "Ijara",            summa: 8_200_000 },
    { nomi: "Reklama",          summa: 5_800_000 },
    { nomi: "Kommunal",         summa: 4_280_000 },
    { nomi: "Boshqa",           summa: 3_000_000 },
  ],
  prev: { tushum: 472_000_000, sof_foyda: 95_500_000 },
}

const CLIENT_360 = {
  id:             1,
  ism:            "Do'kon Buyuk Ipak Yo'li",
  telefon:        "+998 90 123 45 67",
  manzil:         "Samarqand sh., Registon ko'chasi 42",
  kategoriya:     "Supermarket",
  jami_xaridlar:  285_000_000,
  xarid_soni:     142,
  ortacha_chek:   2_007_042,
  joriy_qarz:     12_500_000,
  kredit_limit:   50_000_000,
  birinchi_sotuv: new Date(Date.now() - 540 * 86400e3).toISOString(),
  oxirgi_sotuv:   new Date().toISOString(),
  tashrif_soni:   143,
  rfm_segment:    "champions" as const,
  rfm_score:      { R: 5, F: 5, M: 5 },
  oxirgi_sotuvlar: [
    { id: 4821, sana: new Date().toISOString(),                         jami: 2_480_000, tovar_soni: 18 },
    { id: 4805, sana: new Date(Date.now() - 86400e3).toISOString(),       jami: 3_150_000, tovar_soni: 24 },
    { id: 4782, sana: new Date(Date.now() - 2 * 86400e3).toISOString(),   jami: 1_800_000, tovar_soni: 12 },
    { id: 4759, sana: new Date(Date.now() - 3 * 86400e3).toISOString(),   jami: 4_650_000, tovar_soni: 31 },
    { id: 4734, sana: new Date(Date.now() - 5 * 86400e3).toISOString(),   jami: 2_100_000, tovar_soni: 16 },
  ],
  top_tovarlar: [
    { nomi: "Coca-Cola 1.5L",       jami: 18_200_000, miqdor: 1300 },
    { nomi: "Ariel Automat 6kg",    jami: 14_850_000, miqdor: 90 },
    { nomi: "Nescafe Gold 100g",    jami: 9_450_000,  miqdor: 210 },
    { nomi: "Lays Classic 150g",    jami: 7_200_000,  miqdor: 400 },
    { nomi: "Head&Shoulders 400ml", jami: 6_760_000,  miqdor: 130 },
  ],
  oylik_trend: [
    { oy: "May",  jami: 18_200_000 },
    { oy: "Iyn",  jami: 22_400_000 },
    { oy: "Iyl",  jami: 19_800_000 },
    { oy: "Avg",  jami: 24_600_000 },
    { oy: "Sen",  jami: 28_100_000 },
    { oy: "Okt",  jami: 25_500_000 },
    { oy: "Noy",  jami: 31_800_000 },
    { oy: "Dek",  jami: 35_200_000 },
    { oy: "Yan",  jami: 27_900_000 },
    { oy: "Fev",  jami: 33_400_000 },
    { oy: "Mar",  jami: 38_700_000 },
    { oy: "Apr",  jami: 42_150_000 },
  ],
}

const TRANSFERS = [
  { id: 101, dan_filial_id: 1, dan_filial_nomi: "Markaz ombor",   ga_filial_id: 2, ga_filial_nomi: "Siyob filiali",     tovar_nomi: "Coca-Cola 1.5L",         miqdor: 240,  birlik: "dona", holat: "kutilmoqda"   as const, yaratilgan: new Date(Date.now() - 2 * 3600e3).toISOString(),  izoh: "Haftalik yetkazib berish" },
  { id: 100, dan_filial_id: 1, dan_filial_nomi: "Markaz ombor",   ga_filial_id: 3, ga_filial_nomi: "Urgut filiali",     tovar_nomi: "Ariel Automat 6kg",      miqdor: 60,   birlik: "dona", holat: "kutilmoqda"   as const, yaratilgan: new Date(Date.now() - 4 * 3600e3).toISOString() },
  { id: 99,  dan_filial_id: 2, dan_filial_nomi: "Siyob filiali",   ga_filial_id: 1, ga_filial_nomi: "Markaz ombor",     tovar_nomi: "Nescafe Gold 100g",      miqdor: 24,   birlik: "dona", holat: "tasdiqlangan" as const, yaratilgan: new Date(Date.now() - 24 * 3600e3).toISOString(), izoh: "Mijoz qaytarishi" },
  { id: 98,  dan_filial_id: 1, dan_filial_nomi: "Markaz ombor",   ga_filial_id: 4, ga_filial_nomi: "Jomboy filiali",    tovar_nomi: "Lays Classic 150g",       miqdor: 120,  birlik: "dona", holat: "tasdiqlangan" as const, yaratilgan: new Date(Date.now() - 30 * 3600e3).toISOString() },
  { id: 97,  dan_filial_id: 3, dan_filial_nomi: "Urgut filiali",   ga_filial_id: 1, ga_filial_nomi: "Markaz ombor",     tovar_nomi: "Snickers 50g",           miqdor: 96,   birlik: "dona", holat: "bekor"        as const, yaratilgan: new Date(Date.now() - 2 * 86400e3).toISOString(), izoh: "Buyurtma bekor qilindi" },
]

const CASHBOX = {
  naqd:         42_580_000,
  karta:        18_920_000,
  hisob:        125_400_000,
  jami:         186_900_000,
  bugun_kirim:  28_450_000,
  bugun_chiqim: 12_180_000,
  sof_oqim_prev: 14_200_000,
  ops: [
    { id: 1, turi: "kirim"    as const, usul: "karta" as const, summa: 5_480_000, izoh: "Supermarket Registon zakazi #4819", sana: new Date(Date.now() - 15 * 60e3).toISOString() },
    { id: 2, turi: "kirim"    as const, usul: "naqd"  as const, summa: 2_480_000, izoh: "Do'kon Buyuk Ipak Yo'li",            sana: new Date(Date.now() - 45 * 60e3).toISOString() },
    { id: 3, turi: "chiqim"   as const, usul: "naqd"  as const, summa: 1_800_000, izoh: "Yetkazib beruvchi - Sut Mahsulot",   sana: new Date(Date.now() - 2 * 3600e3).toISOString() },
    { id: 4, turi: "kirim"    as const, usul: "hisob" as const, summa: 12_000_000, izoh: "Oylik to'lov - optom",             sana: new Date(Date.now() - 3 * 3600e3).toISOString() },
    { id: 5, turi: "chiqim"   as const, usul: "naqd"  as const, summa: 4_200_000, izoh: "Benzin + logistika",                sana: new Date(Date.now() - 5 * 3600e3).toISOString() },
    { id: 6, turi: "tuzatish" as const, usul: "naqd"  as const, summa: 180_000,   izoh: "Kassa inventarizatsiyasi",           sana: new Date(Date.now() - 22 * 3600e3).toISOString() },
  ],
}

const DEBTORS = [
  { klient_id: 4, klient_ismi: "Oziq-ovqat Urgut",         telefon: "+998 93 456 78 90", joriy_qarz: 14_200_000, kredit_limit: 15_000_000, qarz_soni: 3, eng_eski_muddat: new Date(Date.now() - 120 * 86400e3).toISOString(), oxirgi_tolov: new Date(Date.now() - 45 * 86400e3).toISOString() },
  { klient_id: 7, klient_ismi: "Old-market Pastarg'om",    telefon: "+998 97 111 22 33", joriy_qarz: 8_500_000,  kredit_limit: 10_000_000, qarz_soni: 2, eng_eski_muddat: new Date(Date.now() - 75 * 86400e3).toISOString(),  oxirgi_tolov: new Date(Date.now() - 30 * 86400e3).toISOString() },
  { klient_id: 8, klient_ismi: "Karvon Retail",             telefon: "+998 90 555 44 33", joriy_qarz: 5_200_000,  kredit_limit: 8_000_000,  qarz_soni: 1, eng_eski_muddat: new Date(Date.now() - 42 * 86400e3).toISOString(),  oxirgi_tolov: new Date(Date.now() - 14 * 86400e3).toISOString() },
  { klient_id: 2, klient_ismi: "Mini Market Samarqand",    telefon: "+998 91 234 56 78", joriy_qarz: 3_200_000,  kredit_limit: 10_000_000, qarz_soni: 2, eng_eski_muddat: new Date(Date.now() - 18 * 86400e3).toISOString(),  oxirgi_tolov: new Date(Date.now() - 5 * 86400e3).toISOString() },
  { klient_id: 9, klient_ismi: "Do'kon Juma Charxin",      telefon: "+998 94 333 22 11", joriy_qarz: 1_850_000,  kredit_limit: 5_000_000,  qarz_soni: 1, eng_eski_muddat: new Date(Date.now() - 5 * 86400e3).toISOString(),   oxirgi_tolov: new Date(Date.now() - 2 * 86400e3).toISOString() },
  { klient_id: 1, klient_ismi: "Do'kon Buyuk Ipak Yo'li",  telefon: "+998 90 123 45 67", joriy_qarz: 12_500_000, kredit_limit: 50_000_000, qarz_soni: 4, eng_eski_muddat: new Date(Date.now() - 3 * 86400e3).toISOString(),   oxirgi_tolov: new Date(Date.now() - 1 * 86400e3).toISOString() },
]

const ROUTE_STOPS = [
  { id: 1, klient_ismi: "Do'kon Buyuk Ipak Yo'li",  manzil: "Registon 42",              planned_order: 2_500_000, actual_order: 2_480_000, holat: "tashrif_qilingan" as const, vaqt: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { id: 2, klient_ismi: "Supermarket Registon",     manzil: "Universitet ko'chasi 12", planned_order: 5_000_000, actual_order: 5_480_000, holat: "tashrif_qilingan" as const, vaqt: new Date(Date.now() - 4 * 3600e3).toISOString() },
  { id: 3, klient_ismi: "Mini Market Samarqand",     manzil: "Siyob bozori",             planned_order: 1_500_000, actual_order: 1_250_000, holat: "tashrif_qilingan" as const, vaqt: new Date(Date.now() - 3 * 3600e3).toISOString() },
  { id: 4, klient_ismi: "Karvon Retail",              manzil: "Dahmazor",                 planned_order: 3_000_000, actual_order: 0,         holat: "no_show"          as const, vaqt: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: 5, klient_ismi: "Oziq-ovqat Urgut",          manzil: "Urgut markaz",             planned_order: 2_000_000,                            holat: "kutilmoqda"       as const },
  { id: 6, klient_ismi: "Do'kon Juma Charxin",      manzil: "Juma Charxin",              planned_order: 1_200_000,                            holat: "kutilmoqda"       as const },
  { id: 7, klient_ismi: "Universal Jomboy",          manzil: "Jomboy tumani",            planned_order: 2_500_000,                            holat: "kutilmoqda"       as const },
]

const SUPPLIERS = [
  { id: 1, nomi: "Procter & Gamble UZ",    telefon: "+998 71 200 10 01", kategoriya: "Kimyo",    balans: 85_400_000, jami_xarid: 1_240_000_000, aktiv_buyurtma: 3, oxirgi_kirim: new Date(Date.now() - 45 * 86400e3).toISOString(), kredit_muddat_kun: 30 },
  { id: 2, nomi: "Coca-Cola Uzbekistan",   telefon: "+998 71 200 10 02", kategoriya: "Ichimlik", balans: 42_800_000, jami_xarid: 680_000_000,  aktiv_buyurtma: 2, oxirgi_kirim: new Date(Date.now() - 12 * 86400e3).toISOString(), kredit_muddat_kun: 14 },
  { id: 3, nomi: "Nestle Uzbekistan",      telefon: "+998 71 200 10 03", kategoriya: "Ichimlik", balans: 18_200_000, jami_xarid: 320_000_000,  aktiv_buyurtma: 1, oxirgi_kirim: new Date(Date.now() - 7 * 86400e3).toISOString(),  kredit_muddat_kun: 14 },
  { id: 4, nomi: "Mars UZ",                telefon: "+998 71 200 10 04", kategoriya: "Shirinlik", balans: 0,          jami_xarid: 145_000_000,  aktiv_buyurtma: 0, oxirgi_kirim: new Date(Date.now() - 20 * 86400e3).toISOString() },
  { id: 5, nomi: "Non Uy",                  telefon: "+998 90 111 22 33", kategoriya: "Non",       balans: -1_200_000, jami_xarid: 48_000_000,   aktiv_buyurtma: 1, oxirgi_kirim: new Date(Date.now() - 1 * 86400e3).toISOString(),  kredit_muddat_kun: 7 },
  { id: 6, nomi: "Milk Gold",               telefon: "+998 90 444 55 66", kategoriya: "Sut",       balans: 5_800_000,  jami_xarid: 92_000_000,   aktiv_buyurtma: 2, oxirgi_kirim: new Date(Date.now() - 3 * 86400e3).toISOString(),  kredit_muddat_kun: 14 },
]

// Placeholder photos from picsum (stable per seed)
const PHOTOS = [
  { id: 1, url: "https://picsum.photos/seed/savdoai1/800/800", thumb_url: "https://picsum.photos/seed/savdoai1/400/400", agent_ismi: "Sayitqulov Mashrab",  klient_ismi: "Do'kon Buyuk Ipak Yo'li", manzil: "Registon 42", turi: "tashrif" as const, vaqt: new Date(Date.now() - 2 * 3600e3).toISOString(),  izoh: "Mijoz hududida tashrif" },
  { id: 2, url: "https://picsum.photos/seed/savdoai2/800/800", thumb_url: "https://picsum.photos/seed/savdoai2/400/400", agent_ismi: "Boriev Mirjalol",     klient_ismi: "Supermarket Registon",    manzil: "Universitet", turi: "qoldiq"  as const, vaqt: new Date(Date.now() - 3 * 3600e3).toISOString(),  izoh: "Tokchada qoldiq tekshiruvi" },
  { id: 3, url: "https://picsum.photos/seed/savdoai3/800/800", thumb_url: "https://picsum.photos/seed/savdoai3/400/400", agent_ismi: "Babadjanova Nargiza", klient_ismi: "Mini Market Samarqand",   manzil: "Siyob bozori", turi: "aksiya" as const, vaqt: new Date(Date.now() - 5 * 3600e3).toISOString(),  izoh: "Yangi aksiya plakat joylashtirildi" },
  { id: 4, url: "https://picsum.photos/seed/savdoai4/800/800", thumb_url: "https://picsum.photos/seed/savdoai4/400/400", agent_ismi: "Berdiyev Rahmatillo", klient_ismi: "Oziq-ovqat Urgut",       manzil: "Urgut markaz", turi: "defekt" as const, vaqt: new Date(Date.now() - 26 * 3600e3).toISOString(), izoh: "Nosoz qadoqlash — 3 dona" },
  { id: 5, url: "https://picsum.photos/seed/savdoai5/800/800", thumb_url: "https://picsum.photos/seed/savdoai5/400/400", agent_ismi: "Sayitqulov Mashrab",  klient_ismi: "Do'kon Juma Charxin",    manzil: "Juma Charxin", turi: "tashrif" as const, vaqt: new Date(Date.now() - 28 * 3600e3).toISOString() },
  { id: 6, url: "https://picsum.photos/seed/savdoai6/800/800", thumb_url: "https://picsum.photos/seed/savdoai6/400/400", agent_ismi: "Babadjanova Nargiza", klient_ismi: "Karvon Retail",          manzil: "Dahmazor",     turi: "qoldiq"  as const, vaqt: new Date(Date.now() - 30 * 3600e3).toISOString() },
  { id: 7, url: "https://picsum.photos/seed/savdoai7/800/800", thumb_url: "https://picsum.photos/seed/savdoai7/400/400", agent_ismi: "Tursunov Jamshed",    klient_ismi: "Universal Jomboy",        manzil: "Jomboy",       turi: "aksiya" as const, vaqt: new Date(Date.now() - 48 * 3600e3).toISOString(), izoh: "Yangi brend displey" },
  { id: 8, url: "https://picsum.photos/seed/savdoai8/800/800", thumb_url: "https://picsum.photos/seed/savdoai8/400/400", agent_ismi: "Boriev Mirjalol",     klient_ismi: "Klub Toy Xizmat",        manzil: "Siyob",        turi: "defekt" as const, vaqt: new Date(Date.now() - 72 * 3600e3).toISOString(), izoh: "Muddati o'tgan tovar" },
]

const PIVOT_BY_CATEGORY = [
  { key: "Kimyo",    jami: 125_400_000, soni: 342, miqdor: 1840, prev_jami: 108_000_000 },
  { key: "Ichimlik", jami:  98_600_000, soni: 520, miqdor: 4120, prev_jami:  87_500_000 },
  { key: "Sut",      jami:  72_800_000, soni: 285, miqdor: 3200, prev_jami:  69_000_000 },
  { key: "Shirinlik",jami:  58_400_000, soni: 412, miqdor: 2180, prev_jami:  62_000_000 },
  { key: "Chipsi",   jami:  42_100_000, soni: 168, miqdor: 1530, prev_jami:  38_500_000 },
  { key: "Non",      jami:  28_900_000, soni: 195, miqdor: 2850, prev_jami:  31_000_000 },
  { key: "Gozok",    jami:  15_200_000, soni:  88, miqdor:  420, prev_jami:  12_800_000 },
  { key: "Konservalar", jami: 8_600_000, soni: 42, miqdor:  180, prev_jami:   9_500_000 },
]

const STREAM = [
  { id: 1,  type: "sotuv"       as const, title: "Yangi zakaz #4821",              summa: 2_480_000, agent: "Sayitqulov Mashrab",  klient: "Do'kon Buyuk Ipak Yo'li",   vaqt: new Date(Date.now() - 1 * 60e3).toISOString() },
  { id: 2,  type: "tolov"       as const, title: "To'lov qabul qilindi",           summa: 5_480_000, agent: "Boriev Mirjalol",     klient: "Supermarket Registon",     vaqt: new Date(Date.now() - 5 * 60e3).toISOString(),   body: "Plastik karta orqali" },
  { id: 3,  type: "tashrif"     as const, title: "Tashrif ro'yxatga olindi",                          agent: "Babadjanova Nargiza", klient: "Mini Market Samarqand",    vaqt: new Date(Date.now() - 12 * 60e3).toISOString() },
  { id: 4,  type: "kpi_success" as const, title: "Kunlik reja bajarildi 🏆",       summa: 28_261_100, agent: "Sayitqulov Mashrab",                                        vaqt: new Date(Date.now() - 18 * 60e3).toISOString(),  body: "6 mijozdan 28.3 mln so'm" },
  { id: 5,  type: "kam_qoldiq"  as const, title: "Kam qoldiq ogohlantirishi",                                                       klient: "Ariel Automat 6kg",         vaqt: new Date(Date.now() - 25 * 60e3).toISOString(),  body: "Ombordagi qoldiq: 8 ta (min: 30)" },
  { id: 6,  type: "sotuv"       as const, title: "Yangi zakaz #4820",              summa: 1_250_000, agent: "Berdiyev Rahmatillo", klient: "Oziq-ovqat Urgut",          vaqt: new Date(Date.now() - 32 * 60e3).toISOString() },
  { id: 7,  type: "photo"       as const, title: "Tashrif fotosi yuklandi",                           agent: "Sayitqulov Mashrab",  klient: "Do'kon Buyuk Ipak Yo'li",   vaqt: new Date(Date.now() - 45 * 60e3).toISOString() },
  { id: 8,  type: "qaytarish"   as const, title: "Qaytarish yaratildi",            summa: 180_000,    agent: "Boriev Mirjalol",     klient: "Klub Toy Xizmat",           vaqt: new Date(Date.now() - 58 * 60e3).toISOString(),  body: "Muddati o'tgan tovar" },
  { id: 9,  type: "yangi_mijoz" as const, title: "Yangi mijoz qo'shildi",                                                             klient: "Do'kon Yangi Bozor",       vaqt: new Date(Date.now() - 72 * 60e3).toISOString() },
  { id: 10, type: "yetkazildi"  as const, title: "Zakaz yetkazildi #4815",         summa: 4_220_000,  agent: "Davlat Rahimov",      klient: "Taloni Market",             vaqt: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: 11, type: "xarajat"     as const, title: "Xarajat ro'yxatga olindi",       summa: 1_800_000,  agent: "Admin",                                                   vaqt: new Date(Date.now() - 3 * 3600e3).toISOString(),  body: "Benzin + logistika" },
]

// ─── Page ───────────────────────────────────────────────────

export default function DemoComponentsPage() {
  const { locale } = useLocale()

  return (
    <AdminLayout title="Demo — Premium Components">
      <div className="space-y-8">
        {/* Intro */}
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5">
          <h1 className="text-xl font-bold text-foreground">
            {locale === "uz" ? "Premium komponentlar ko'rgazmasi" : "Демо премиум компонентов"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "uz"
              ? "Har bir komponent shu yerda jonli — synthetic data bilan. Real ma'lumot sahifalarda avtomatik ishlaydi."
              : "Каждый компонент здесь живой — с синтетическими данными. Реальные данные работают автоматически на страницах."}
          </p>
        </div>

        {/* 1. KPI Grid */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            1. KpiGridPremium
          </p>
          <KpiGridPremium stats={KPI_STATS} deltas={KPI_DELTAS} />
        </section>

        {/* 2. Agent leaderboard */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            2. AgentKpiBoard
          </p>
          <AgentKpiBoard agents={AGENTS} />
        </section>

        {/* 3. Order status */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            3. OrderStatusBoard
          </p>
          <OrderStatusBoard orders={ORDERS} />
        </section>

        {/* 4. Client directory */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            4. ClientDirectoryTable
          </p>
          <ClientDirectoryTable clients={CLIENTS} />
        </section>

        {/* 5. Product grid */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            5. ProductStockGrid
          </p>
          <ProductStockGrid products={PRODUCTS} />
        </section>

        {/* 6. P&L report */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            6. PnLReport
          </p>
          <PnLReport data={PNL} />
        </section>

        {/* 7. Client 360 */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            7. Client360View
          </p>
          <Client360View client={CLIENT_360} />
        </section>

        {/* 8. Warehouse transfers */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            8. WarehouseTransferBoard
          </p>
          <WarehouseTransferBoard
            transfers={TRANSFERS}
            onApprove={(id) => alert(`Tasdiqlandi: #${id}`)}
            onCancel={(id) => alert(`Bekor qilindi: #${id}`)}
          />
        </section>

        {/* 9. Cashbox balance */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            9. CashboxBalance
          </p>
          <CashboxBalance data={CASHBOX} />
        </section>

        {/* 10. Debtors list */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            10. DebtorsList
          </p>
          <DebtorsList debtors={DEBTORS} />
        </section>

        {/* 11. Agent route timeline */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            11. AgentRouteCard
          </p>
          <AgentRouteCard
            agent={{ id: 1, ism: "Sayitqulov Mashrab" }}
            stops={ROUTE_STOPS}
          />
        </section>

        {/* 12. Supplier balance */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            12. SupplierBalance
          </p>
          <SupplierBalance suppliers={SUPPLIERS} />
        </section>

        {/* 13. Photo reports */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            13. PhotoReportGrid
          </p>
          <PhotoReportGrid photos={PHOTOS} />
        </section>

        {/* 14. Sales pivot table */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            14. SalesPivotTable
          </p>
          <SalesPivotTable
            dimension="kategoriya"
            rows={PIVOT_BY_CATEGORY}
            subtitle="Oxirgi 30 kun, kategoriya kesimida"
          />
        </section>

        {/* 15. Notification stream */}
        <section>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            15. NotificationStream
          </p>
          <NotificationStream events={STREAM} live />
        </section>
      </div>
    </AdminLayout>
  )
}
