"use client"

/**
 * Cmd+K Global Command Palette — keyboard-first navigation.
 *
 * Triggers: Cmd/Ctrl+K anywhere, or clicking the search bar in the header.
 * Provides instant fuzzy search across 100+ pages, recent actions, and AI shortcuts.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command"
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  BarChart3, CreditCard, Target, Gift, MapPin, Shield, Brain,
  Star, Receipt, Settings, Heart, Activity, Camera, RefreshCw,
  Mic, Landmark, TrendingUp, Calendar, UserCircle, Archive,
  GraduationCap, Tag, ClipboardList, Building2, PlusCircle,
  Truck, Zap,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"

type Item = {
  id: string
  label: string
  labelRu?: string
  href: string
  icon: React.ElementType
  group: "navigation" | "action" | "ai" | "settings"
  keywords?: string
}

const ITEMS: Item[] = [
  // ── Core navigation ──
  { id: "dashboard", label: "Bosh sahifa", labelRu: "Главная", href: "/dashboard", icon: LayoutDashboard, group: "navigation", keywords: "home dashboard bosh" },
  { id: "clients", label: "Mijozlar", labelRu: "Клиенты", href: "/clients", icon: Users, group: "navigation", keywords: "clients klientlar customers" },
  { id: "products", label: "Mahsulotlar", labelRu: "Товары", href: "/products", icon: Package, group: "navigation", keywords: "products tovarlar goods" },
  { id: "orders", label: "Buyurtmalar", labelRu: "Заказы", href: "/orders", icon: ShoppingCart, group: "navigation", keywords: "orders buyurtma sales" },
  { id: "sales", label: "Sotuvlar", labelRu: "Продажи", href: "/sales", icon: ShoppingCart, group: "navigation", keywords: "sales sotuv" },
  { id: "invoices", label: "Schet-fakturalar", labelRu: "Счета", href: "/invoices", icon: FileText, group: "navigation", keywords: "invoice schet faktura" },
  { id: "debts", label: "Qarzlar", labelRu: "Долги", href: "/debts", icon: CreditCard, group: "navigation", keywords: "debts qarz debt credit" },
  { id: "warehouse", label: "Ombor", labelRu: "Склад", href: "/ombor", icon: Archive, group: "navigation", keywords: "warehouse ombor sklad stock" },
  { id: "inventory", label: "Inventarizatsiya", labelRu: "Инвентаризация", href: "/inventory", icon: ClipboardList, group: "navigation", keywords: "inventory" },
  { id: "categories", label: "Kategoriyalar", labelRu: "Категории", href: "/categories", icon: Package, group: "navigation", keywords: "categories kategoriya" },
  { id: "suppliers", label: "Postavshiklar", labelRu: "Поставщики", href: "/suppliers", icon: Building2, group: "navigation", keywords: "suppliers postavshik" },
  { id: "kirim", label: "Kirimlar", labelRu: "Поступления", href: "/kirim", icon: Package, group: "navigation", keywords: "kirim postuplenie" },
  { id: "purchase", label: "Xarid", labelRu: "Закупки", href: "/purchase", icon: ShoppingCart, group: "navigation", keywords: "purchase xarid" },

  // ── Staff & operations ──
  { id: "staff", label: "Xodimlar", labelRu: "Сотрудники", href: "/staff", icon: Users, group: "navigation", keywords: "staff xodim employee" },
  { id: "apprentices", label: "Shogirdlar", labelRu: "Ученики", href: "/apprentices", icon: GraduationCap, group: "navigation", keywords: "apprentice shogird" },
  { id: "expeditors", label: "Ekspeditorlar", labelRu: "Экспедиторы", href: "/ekspeditorlar", icon: Truck, group: "navigation", keywords: "expeditor yetkazuvchi" },
  { id: "route", label: "Marshrut", labelRu: "Маршрут", href: "/route", icon: MapPin, group: "navigation", keywords: "route marshrut" },
  { id: "van-selling", label: "Van Selling", labelRu: "Van Selling", href: "/van-selling", icon: Truck, group: "navigation", keywords: "van selling" },
  { id: "visits", label: "Tashriflar", labelRu: "Визиты", href: "/tashrif", icon: MapPin, group: "navigation", keywords: "visit tashrif" },
  { id: "gps", label: "GPS kuzatuv", labelRu: "GPS-трекинг", href: "/gps", icon: MapPin, group: "navigation", keywords: "gps tracking" },
  { id: "tasks", label: "Topshiriqlar", labelRu: "Задачи", href: "/tasks", icon: Target, group: "navigation", keywords: "tasks topshiriq task" },

  // ── Reports & analytics ──
  { id: "reports-hub", label: "Hisobotlar markazi", labelRu: "Центр отчётов", href: "/reports-hub", icon: BarChart3, group: "navigation", keywords: "reports hisobot report hub" },
  { id: "reports-agent", label: "Agent hisoboti", labelRu: "Отчёт агентов", href: "/reports/agent", icon: Users, group: "navigation", keywords: "agent report" },
  { id: "pnl", label: "Foyda/Zarar (P&L)", labelRu: "Прибыль/Убыток", href: "/pnl", icon: TrendingUp, group: "navigation", keywords: "pnl profit loss foyda zarar" },
  { id: "rfm", label: "RFM segmentatsiya", labelRu: "RFM-сегментация", href: "/rfm", icon: Target, group: "navigation", keywords: "rfm segmentation" },
  { id: "abc-xyz", label: "ABC-XYZ matritsa", labelRu: "ABC-XYZ матрица", href: "/abc-xyz", icon: BarChart3, group: "navigation", keywords: "abc xyz matrix" },
  { id: "kpi", label: "KPI", labelRu: "KPI", href: "/kpi", icon: Target, group: "navigation", keywords: "kpi metrics" },
  { id: "pro-analytics", label: "Pro Analitika", labelRu: "Pro Аналитика", href: "/pro-analitika", icon: BarChart3, group: "navigation", keywords: "analytics pro" },
  { id: "leaderboard", label: "Leaderboard", labelRu: "Лидерборд", href: "/leaderboard", icon: Star, group: "navigation", keywords: "leaderboard rating" },

  // ── Finance ──
  { id: "moliya", label: "Moliya", labelRu: "Финансы", href: "/moliya", icon: Landmark, group: "navigation", keywords: "finance moliya" },
  { id: "cash", label: "Kassa", labelRu: "Касса", href: "/cash", icon: Landmark, group: "navigation", keywords: "cash kassa" },
  { id: "cashboxes", label: "Kassalar", labelRu: "Кассы", href: "/cashboxes", icon: Landmark, group: "navigation", keywords: "cashbox" },
  { id: "expenses", label: "Xarajatlar", labelRu: "Расходы", href: "/expenses", icon: Receipt, group: "navigation", keywords: "expenses xarajat" },
  { id: "bonuses", label: "Bonuslar", labelRu: "Бонусы", href: "/bonuses", icon: Gift, group: "navigation", keywords: "bonuses bonus" },
  { id: "aksiya", label: "Aksiyalar", labelRu: "Акции", href: "/aksiya", icon: Gift, group: "navigation", keywords: "aksiya promotion" },
  { id: "prices", label: "Narxlar", labelRu: "Цены", href: "/prices", icon: Tag, group: "navigation", keywords: "prices narx" },
  { id: "price-list", label: "Prays-list", labelRu: "Прайс-лист", href: "/price-list", icon: FileText, group: "navigation", keywords: "price list" },

  // ── AI features ──
  { id: "copilot", label: "AI Copilot", labelRu: "AI Copilot", href: "/copilot", icon: Brain, group: "ai", keywords: "copilot ai opus claude" },
  { id: "anomaly", label: "Anomaliya detektori", labelRu: "Детектор аномалий", href: "/anomaliya", icon: Shield, group: "ai", keywords: "anomaly detector" },
  { id: "health", label: "Biznes salomatligi", labelRu: "Здоровье бизнеса", href: "/biznes-salomatlik", icon: Heart, group: "ai", keywords: "health biznes" },
  { id: "voice", label: "Ovozli buyruqlar", labelRu: "Голосовые команды", href: "/voice-help", icon: Mic, group: "ai", keywords: "voice ovoz mic" },
  { id: "stock-forecast", label: "Tovar tavsiyasi", labelRu: "Прогноз остатков", href: "/stock-forecast", icon: Brain, group: "ai", keywords: "forecast stock prediction" },
  { id: "ai-dashboard", label: "AI Dashboard", labelRu: "AI-панель", href: "/ai-dashboard", icon: Brain, group: "ai", keywords: "ai dashboard" },
  { id: "klient360", label: "Klient 360°", labelRu: "Клиент 360°", href: "/klient360", icon: UserCircle, group: "ai", keywords: "klient client 360" },

  // ── Quick actions ──
  { id: "new-sale", label: "Yangi sotuv (POS)", labelRu: "Новая продажа", href: "/order-create", icon: PlusCircle, group: "action", keywords: "new sale pos sotuv" },
  { id: "new-client", label: "Yangi mijoz qo'shish", labelRu: "Новый клиент", href: "/client-create", icon: Users, group: "action", keywords: "new client qo'shish" },
  { id: "new-product", label: "Yangi mahsulot", labelRu: "Новый товар", href: "/product-create", icon: Package, group: "action", keywords: "new product tovar" },
  { id: "new-expense", label: "Yangi xarajat", labelRu: "Новый расход", href: "/expense-create", icon: Receipt, group: "action", keywords: "new expense" },
  { id: "live", label: "🔴 Live monitoring", labelRu: "🔴 Live", href: "/live", icon: Activity, group: "action", keywords: "live real-time monitoring" },
  { id: "photo-reports", label: "Foto hisobotlar", labelRu: "Фото-отчёты", href: "/photo-reports", icon: Camera, group: "action", keywords: "photo reports foto" },
  { id: "calendar", label: "Kalendar", labelRu: "Календарь", href: "/kalendar", icon: Calendar, group: "action", keywords: "calendar kalendar" },
  { id: "quick-actions", label: "Tezkor buyruqlar", labelRu: "Быстрые команды", href: "/quick-actions", icon: Zap, group: "action", keywords: "quick actions" },

  // ── Settings ──
  { id: "business-settings", label: "Biznes sozlamalar", labelRu: "Настройки бизнеса", href: "/business-settings", icon: Settings, group: "settings", keywords: "business settings sozlama" },
  { id: "settings", label: "Hisob sozlamalari", labelRu: "Настройки аккаунта", href: "/settings", icon: UserCircle, group: "settings", keywords: "account settings hisob" },
  { id: "config", label: "Tizim sozlamalari", labelRu: "Системные настройки", href: "/config", icon: Settings, group: "settings", keywords: "config system" },
  { id: "integrations", label: "Integratsiyalar", labelRu: "Интеграции", href: "/integrations", icon: RefreshCw, group: "settings", keywords: "integrations" },
  { id: "api-keys", label: "API kalitlari", labelRu: "API-ключи", href: "/api-keys", icon: Shield, group: "settings", keywords: "api keys" },
  { id: "webhook", label: "Webhooks", labelRu: "Webhooks", href: "/webhook", icon: RefreshCw, group: "settings", keywords: "webhook" },
]

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return { open, setOpen }
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { locale } = useLocale()

  const groups = useMemo(() => {
    const byGroup: Record<string, Item[]> = { action: [], navigation: [], ai: [], settings: [] }
    for (const item of ITEMS) byGroup[item.group].push(item)
    return byGroup
  }, [])

  const go = useCallback((href: string) => {
    onOpenChange(false)
    setTimeout(() => router.push(href), 50)
  }, [router, onOpenChange])

  const groupLabels = {
    action: locale === "uz" ? "Tezkor amallar" : "Быстрые действия",
    navigation: locale === "uz" ? "Sahifalar" : "Страницы",
    ai: locale === "uz" ? "AI imkoniyatlari" : "AI-возможности",
    settings: locale === "uz" ? "Sozlamalar" : "Настройки",
  }

  const getLabel = (item: Item) => (locale === "ru" && item.labelRu) ? item.labelRu : item.label

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={locale === "uz" ? "Global qidiruv" : "Глобальный поиск"}
      description={locale === "uz" ? "Sahifa, amal yoki komanda qidiring" : "Найти страницу, команду или действие"}
    >
      <Command shouldFilter={true}>
        <CommandInput
          placeholder={
            locale === "uz"
              ? "Nima qilmoqchisiz? (masalan: yangi sotuv, klient, hisobot)"
              : "Что вы хотите? (напр.: новая продажа, клиент, отчёт)"
          }
        />
        <CommandList>
          <CommandEmpty>
            {locale === "uz" ? "Hech narsa topilmadi" : "Ничего не найдено"}
          </CommandEmpty>

          {(["action", "navigation", "ai", "settings"] as const).map((groupKey, idx) => {
            const items = groups[groupKey]
            if (items.length === 0) return null
            return (
              <div key={groupKey}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={groupLabels[groupKey]}>
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${getLabel(item)} ${item.keywords || ""}`}
                        onSelect={() => go(item.href)}
                        className="gap-2.5 py-2"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{getLabel(item)}</span>
                        {item.group === "ai" && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">AI</span>
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </div>
            )
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
