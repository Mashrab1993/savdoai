"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  Building2, CreditCard, Ruler, MapPin, Tag, User, Layers, Package,
  DollarSign, Banknote, XCircle, RotateCcw, Camera, Box, Gift,
  Sparkles, Users, Briefcase, FileText, Lock, ListTodo, ArrowLeftRight,
  Boxes, Square, BookOpen, Cable, Printer, Container, Boxes as BoxesIcon,
  Tags, Smartphone, Database
} from "lucide-react"

const SETTINGS = [
  { id: 1, slug: "diler", icon: Building2, title: "Profil kompaniyasi", desc: "MCH/Sam/Ulug'bek/Sale (4 region)" },
  { id: 2, slug: "paymentType", icon: CreditCard, title: "To'lov usullari", desc: "Naqd/Безнал/Доллар/Перечисление" },
  { id: 3, slug: "measureUnit", icon: Ruler, title: "O'lchov birliklari", desc: "Dona/Kg/Litr/Blok/Korobka" },
  { id: 4, slug: "territory", icon: MapPin, title: "Territoriya", desc: "Geografik hududlar (20+)" },
  { id: 5, slug: "clientCategory", icon: Tag, title: "Klient kategoriya", desc: "Tier kategoriyalar" },
  { id: 6, slug: "clientType", icon: User, title: "Klient tipi", desc: "Магазин/Хорека/Опт" },
  { id: 7, slug: "grouping", icon: Layers, title: "Mahsulot ierarxiyasi", desc: "7 daraja: Kategoriya→Brend→Segment" },
  { id: 8, slug: "product", icon: Package, title: "Tovarlar", desc: "Master katalog (1000+ SKU)" },
  { id: 9, slug: "priceType", icon: Tag, title: "Narx turlari", desc: "ОПТ/Розница/Маршрут/VIP" },
  { id: 10, slug: "price", icon: DollarSign, title: "Narxlar", desc: "Sotish/Olish/Прайс — 3 tab" },
  { id: 11, slug: "reject", icon: XCircle, title: "Otkaz sabablari", desc: "Standart 5 sabab" },
  { id: 12, slug: "rejectDefect", icon: RotateCcw, title: "Qaytarish sabablari", desc: "Возврат/Обмен" },
  { id: 13, slug: "photoReportCategory", icon: Camera, title: "Foto report kategoriya", desc: "Storecheck turlari" },
  { id: 14, slug: "inventoryType", icon: Box, title: "Inventar turlari", desc: "Холодильник/Стенд" },
  { id: 15, slug: "bonus", icon: Gift, title: "Bonuslar va chegirmalar", desc: "5 tip: Avto/Manual/Накопит." },
  { id: 16, slug: "RLP", icon: Sparkles, title: "RLP Bonuslar", desc: "Brand-specific retro-bonus" },
  { id: 17, slug: "users", icon: Users, title: "Foydalanuvchilar", desc: "User management" },
  { id: 18, slug: "partner", icon: Briefcase, title: "Partnyorlar", desc: "Wholesale tier" },
  { id: 19, slug: "orderNote", icon: FileText, title: "Zakaz izohlari", desc: "Pre-defined notes" },
  { id: 20, slug: "closed", icon: Lock, title: "Davr yopilishi", desc: "8 selective lock toggle" },
  { id: 21, slug: "taskType", icon: ListTodo, title: "Vazifa turlari", desc: "Task type definitions" },
  { id: 22, slug: "tradeDirection", icon: ArrowLeftRight, title: "Savdo yo'nalishi", desc: "Trade direction" },
  { id: 23, slug: "salesChannel", icon: Boxes, title: "Sotuv kanali", desc: "B2B/B2C/Wholesale" },
  { id: 24, slug: "boxType", icon: Square, title: "Quti turlari", desc: "Блок/Коробка/Пачка/Мешок" },
  { id: 25, slug: "knowledgeBase", icon: BookOpen, title: "Bilim bazasi", desc: "Built-in dokumentlar" },
  { id: 26, slug: "integration", icon: Cable, title: "Integratsiya", desc: "6 platform marketplace" },
  { id: 27, slug: "printer", icon: Printer, title: "Printerlar", desc: "Network printer config" },
  { id: 28, slug: "tara", icon: Container, title: "Tara", desc: "Bottle/container deposit" },
  { id: 29, slug: "inventoryGroup", icon: BoxesIcon, title: "Inventar guruhi", desc: "Inventory grouping" },
  { id: 30, slug: "tag", icon: Tags, title: "Teglar", desc: "Free-form tags" },
  { id: 31, slug: "applications", icon: Smartphone, title: "Mobil ilovalar", desc: "App config" },
  { id: 32, slug: "backup", icon: Database, title: "Backup", desc: "Manual backup UI" },
]

export default function SozlamalarPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
          <p className="text-base text-slate-500 mt-1">{SETTINGS.length} ta sozlash bo'limi · Tizim konfiguratsiyasi</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {SETTINGS.map(s => {
            const Icon = s.icon
            return (
              <Link key={s.slug} href={`/sozlamalar/${s.slug}`}>
                <Card className="p-4 hover:shadow-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer h-full group">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-slate-600 group-hover:text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-mono text-slate-400">{s.id}.</span>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 line-clamp-1">{s.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{s.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
