"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Package, CreditCard, FileText, BarChart3,
  Settings, ChevronLeft, ChevronRight, GraduationCap, Receipt, Tag,
  Landmark, ShoppingCart, Brain, Star, Target, Gift, RefreshCw,
  MapPin, Shield, Activity, Wallet, Camera, Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { translations } from "@/lib/i18n"

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { locale } = useLocale()
  const nav = translations.nav

  const handleNavClick = () => { onNavigate?.() }

  // ═══════════════════════════════════════════════════════
  //  ASOSIY NAVIGATSIYA
  // ═══════════════════════════════════════════════════════

  const navItems = [
    { href: "/live",         label: locale === "uz" ? "Live kuzatuv" : "Live", icon: Activity, badge: "LIVE" },
    { href: "/dashboard",    label: nav.dashboard[locale], icon: LayoutDashboard },
    { href: "/order-create", label: locale === "uz" ? "Yangi sotuv (POS)" : "Новая продажа", icon: ShoppingCart },
    { href: "/sales",        label: locale === "uz" ? "Sotuvlar" : "Продажи", icon: ShoppingCart },
    { href: "/clients",      label: nav.clients[locale], icon: Users },
    { href: "/products",     label: nav.products[locale], icon: Package },
    { href: "/debts",        label: nav.debts[locale], icon: CreditCard },
    { href: "/invoices",     label: nav.invoices[locale], icon: FileText },
    { href: "/reports",      label: nav.reports[locale], icon: BarChart3 },
    { href: "/orders",       label: locale === "uz" ? "Buyurtmalar" : "Заказы", icon: ShoppingCart },
    { href: "/ombor",        label: locale === "uz" ? "Ombor" : "Склад", icon: Package },
    { href: "/material-report", label: locale === "uz" ? "Material hisobot" : "Материальный", icon: BarChart3 },
    { href: "/gps",          label: "GPS", icon: MapPin },
  ]

  // ═══════════════════════════════════════════════════════
  //  YANGI v25.4.0 MODULLAR
  // ═══════════════════════════════════════════════════════

  const navItemsNew = [
    { href: "/moliya",          label: locale === "uz" ? "Moliya" : "Финансы", icon: CreditCard },
    { href: "/aksiya",          label: locale === "uz" ? "Aksiyalar" : "Акции", icon: Gift },
    { href: "/staff",           label: locale === "uz" ? "Xodimlar" : "Сотрудники", icon: Users },
    { href: "/planning",        label: locale === "uz" ? "Rejalashtirish" : "Планирование", icon: Target },
    { href: "/returns",         label: locale === "uz" ? "Qaytarishlar" : "Возвраты", icon: RefreshCw },
    { href: "/write-off",       label: locale === "uz" ? "Spisanie" : "Списание", icon: Target },
    { href: "/transfers",       label: locale === "uz" ? "Ko'chirish" : "Переводы", icon: RefreshCw },
    { href: "/pro-analitika",   label: locale === "uz" ? "Pro Analitika" : "Pro Аналитика", icon: BarChart3 },
    { href: "/klient360",       label: locale === "uz" ? "Klient 360°" : "Клиент 360°", icon: Users },
    { href: "/tasks",           label: locale === "uz" ? "Topshiriqlar" : "Задачи", icon: Target },
    { href: "/kalendar",        label: locale === "uz" ? "Kalendar" : "Календарь", icon: Star },
    { href: "/leaderboard",     label: "Leaderboard", icon: Star },
    { href: "/van-selling",     label: "Van Selling", icon: Target },
    { href: "/route",           label: locale === "uz" ? "Marshrut" : "Маршрут", icon: MapPin },
    { href: "/filial",          label: locale === "uz" ? "Filiallar" : "Филиалы", icon: Shield },
    { href: "/agent-monitor",   label: "Agent Monitor", icon: Activity },
    { href: "/sverka",          label: locale === "uz" ? "Akt Sverki" : "Акт сверки", icon: Shield },
    { href: "/tashrif",         label: locale === "uz" ? "Tashriflar" : "Визиты", icon: MapPin },
    { href: "/visit-report",    label: locale === "uz" ? "Vizit hisoboti" : "Отчёт визитов", icon: MapPin },
    { href: "/photo-reports",   label: locale === "uz" ? "Foto hisobotlar" : "Фото-отчёты", icon: Camera },
    { href: "/webhook",         label: "Webhook", icon: RefreshCw },
    { href: "/sync-log",        label: locale === "uz" ? "Sync log" : "Лог синхронизации", icon: RefreshCw },
    { href: "/suppliers",       label: locale === "uz" ? "Postavshiklar" : "Поставщики", icon: Shield },
    { href: "/purchase",        label: locale === "uz" ? "Xarid buyurtma" : "Заказ закупки", icon: Package },
    { href: "/kirim",           label: locale === "uz" ? "Kirimlar" : "Поступления", icon: Package },
    { href: "/sklad-qogozi",    label: locale === "uz" ? "Sklad qog'ozi" : "Складская бумага", icon: FileText },
    { href: "/warehouses",      label: locale === "uz" ? "Skladlar" : "Склады", icon: Package },
    { href: "/price-types",     label: locale === "uz" ? "Narx turlari" : "Типы цен", icon: Tag },
    { href: "/price-list",      label: locale === "uz" ? "Prays-list" : "Прайс-лист", icon: FileText },
    { href: "/price-history",   label: locale === "uz" ? "Narx tarixi" : "История цен", icon: BarChart3 },
    { href: "/audit-dashboard", label: "Audit", icon: Shield },
    { href: "/categories",      label: locale === "uz" ? "Kategoriyalar" : "Категории", icon: Package },
    { href: "/bonuses",         label: locale === "uz" ? "Bonuslar" : "Бонусы", icon: Gift },
    { href: "/inventory",       label: locale === "uz" ? "Inventarizatsiya" : "Инвентаризация", icon: Package },
    { href: "/territories",     label: locale === "uz" ? "Territoriyalar" : "Территории", icon: MapPin },
    { href: "/payment-methods", label: locale === "uz" ? "To'lov usullari" : "Способы оплаты", icon: CreditCard },
    { href: "/reports-hub",     label: locale === "uz" ? "Hisobotlar markazi" : "Центр отчётов", icon: BarChart3 },
    { href: "/reports/agent",   label: locale === "uz" ? "Agent hisoboti" : "Отчёт агентов", icon: Users },
    { href: "/rfm",             label: locale === "uz" ? "RFM segmentatsiya" : "RFM сегментация", icon: Target },
    { href: "/pnl",             label: locale === "uz" ? "Foyda/Zarar" : "Прибыль/Убыток", icon: BarChart3 },
    { href: "/ekspeditorlar",   label: locale === "uz" ? "Ekspeditorlar" : "Экспедиторы", icon: Package },
    { href: "/skladlar",        label: locale === "uz" ? "Skladlar (v2)" : "Склады (v2)", icon: Package },
    { href: "/voice-help",      label: locale === "uz" ? "Ovozli buyruqlar" : "Голосовые команды", icon: Activity, badge: "AI" },
    { href: "/copilot",         label: locale === "uz" ? "AI Copilot" : "AI Copilot", icon: Brain, badge: "AI" },
    { href: "/anomaliya",       label: locale === "uz" ? "Anomaliya detektori" : "Детектор аномалий", icon: Shield, badge: "AI" },
    { href: "/biznes-salomatlik", label: locale === "uz" ? "Biznes salomatligi" : "Здоровье бизнеса", icon: Heart, badge: "AI" },
  ]

  // ═══════════════════════════════════════════════════════
  //  QOLDIQ NAVIGATSIYA
  // ═══════════════════════════════════════════════════════

  const navItemsSecondary = [
    { href: "/kpi",            label: "KPI", icon: Target },
    { href: "/abc-xyz",        label: locale === "uz" ? "ABC-XYZ Matritsa" : "ABC-XYZ Матрица", icon: BarChart3 },
    { href: "/stock-forecast", label: locale === "uz" ? "Tavsiya qoldiq" : "Прогноз остатков", icon: Package },
    { href: "/analytics",      label: locale === "uz" ? "AI Tahlil" : "AI Аналитика", icon: Brain, badge: "AI" },
    { href: "/loyalty",        label: "Loyalty", icon: Star },
    { href: "/apprentices",    label: nav.apprentices[locale], icon: GraduationCap },
    { href: "/expenses",       label: nav.expenses[locale], icon: Receipt },
    { href: "/prices",         label: nav.prices[locale], icon: Tag },
    { href: "/cash",           label: nav.cash[locale], icon: Landmark },
  ]

  // ═══════════════════════════════════════════════════════
  //  SOZLAMALAR
  // ═══════════════════════════════════════════════════════

  const navItemsSettings = [
    { href: "/business-settings", label: locale === "uz" ? "Biznes sozlamalar" : "Настройки бизнеса", icon: Settings },
    { href: "/config",            label: locale === "uz" ? "Sozlamalar" : "Настройки", icon: Settings },
    { href: "/settings",          label: locale === "uz" ? "Hisobim" : "Мой аккаунт", icon: Shield },
  ]

  type NavItem = { href: string; label: string; icon: React.ElementType; badge?: string }

  const renderSection = (items: NavItem[], title?: string) => (
    <>
      {title && !collapsed && (
        <div className="px-3 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? item.label : undefined}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary"
              />
            )}
            <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "")} />
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase",
                      item.badge === "LIVE"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        )
      })}
    </>
  )

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-border/70 transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border/70 h-14">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: "linear-gradient(135deg, oklch(0.64 0.17 237), oklch(0.72 0.17 156))",
              }}
            >
              <span className="text-white text-sm font-bold tracking-tight">S</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-foreground tracking-tight">SavdoAI</div>
              <div className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                v25.7 AI
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md mx-auto"
            style={{
              background: "linear-gradient(135deg, oklch(0.64 0.17 237), oklch(0.72 0.17 156))",
            }}
          >
            <span className="text-white text-sm font-bold tracking-tight">S</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors",
            collapsed && "hidden",
          )}
          aria-label="toggle sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto my-1.5 p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          aria-label="expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {renderSection(navItems)}

        {!collapsed && <div className="my-2 mx-3 border-t border-border/70" />}
        {renderSection(navItemsNew, locale === "uz" ? "Kengaytirilgan" : "Расширенные")}

        {!collapsed && <div className="my-2 mx-3 border-t border-border/70" />}
        {renderSection(navItemsSecondary, locale === "uz" ? "Qo'shimcha" : "Дополнительно")}
      </nav>

      {/* Bottom settings */}
      <div className="border-t border-border/60 py-2 px-2 space-y-0.5">
        {renderSection(navItemsSettings)}
      </div>
    </aside>
  )
}
