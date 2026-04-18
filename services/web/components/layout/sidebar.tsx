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
    { href: "/live",        label: "🔴 LIVE",              icon: Activity },
    { href: "/dashboard",   label: nav.dashboard[locale],   icon: LayoutDashboard },
    { href: "/order-create", label: locale === "uz" ? "💰 Yangi sotuv (POS)" : "💰 Новая продажа", icon: ShoppingCart },
    { href: "/sales",       label: locale === "uz" ? "Sotuv" : "Продажа", icon: ShoppingCart },
    { href: "/clients",     label: nav.clients[locale],     icon: Users },
    { href: "/products",    label: nav.products[locale],    icon: Package },
    { href: "/debts",       label: nav.debts[locale],       icon: CreditCard },
    { href: "/invoices",    label: nav.invoices[locale],    icon: FileText },
    { href: "/reports",     label: nav.reports[locale],     icon: BarChart3 },
    { href: "/orders",      label: locale === "uz" ? "Buyurtmalar" : "Заказы", icon: ShoppingCart },
    { href: "/ombor",       label: locale === "uz" ? "Ombor" : "Склад", icon: Package },
    { href: "/material-report", label: locale === "uz" ? "Material hisobot" : "Материальный", icon: BarChart3 },
    { href: "/gps",        label: "GPS", icon: MapPin },
  ]

  // ═══════════════════════════════════════════════════════
  //  YANGI v25.4.0 MODULLAR
  // ═══════════════════════════════════════════════════════

  const navItemsNew = [
    { href: "/moliya",          label: "💼 Moliya",          icon: CreditCard },
    { href: "/aksiya",          label: "🎁 Aksiyalar",       icon: Gift },
    { href: "/staff",           label: "👥 Xodimlar",        icon: Users },
    { href: "/planning",        label: "🎯 Rejalashtirish",  icon: Target },
    { href: "/returns",         label: "↩️ Qaytarishlar",    icon: RefreshCw },
    { href: "/write-off",       label: "🗑️ Spisanie",       icon: Target },
    { href: "/transfers",       label: "🔄 Ko'chirish",      icon: RefreshCw },
    { href: "/pro-analitika",   label: "📊 Pro Analitika",   icon: BarChart3 },
    { href: "/klient360",       label: "👤 Klient 360°",     icon: Users },
    { href: "/tasks",           label: "📋 Topshiriqlar",    icon: Target },
    { href: "/kalendar",        label: "📅 Kalendar",        icon: Star },
    { href: "/leaderboard",     label: "🏆 Leaderboard",     icon: Star },
    { href: "/van-selling",     label: "🚛 Van Selling",     icon: Target },
    { href: "/route",           label: "🗺️ Marshrut",       icon: MapPin },
    { href: "/filial",          label: "🏢 Filiallar",       icon: Shield },
    { href: "/agent-monitor",   label: "📡 Agent Monitor",   icon: Activity },
    { href: "/sverka",          label: "📋 Akt Sverki",      icon: Shield },
    { href: "/tashrif",         label: "📍 Tashriflar",      icon: MapPin },
    { href: "/visit-report",    label: "📊 Vizit hisoboti",  icon: MapPin },
    { href: "/photo-reports",   label: "📸 Foto hisobotlar", icon: Camera },
    { href: "/webhook",         label: "🔗 Webhook",         icon: RefreshCw },
    { href: "/sync-log",        label: "🔄 Sync log",        icon: RefreshCw },
    { href: "/suppliers",       label: "🏭 Postavshiklar",   icon: Shield },
    { href: "/purchase",        label: "🛒 Xarid buyurtma",  icon: Package },
    { href: "/kirim",           label: "📥 Kirimlar (Postuplenie)", icon: Package },
    { href: "/sklad-qogozi",    label: "📄 Sklad qog'ozi",   icon: FileText },
    { href: "/warehouses",      label: "🏢 Skladlar",         icon: Package },
    { href: "/price-types",     label: "💰 Narx turlari",    icon: Tag },
    { href: "/price-list",      label: "📋 Prays-list",      icon: FileText },
    { href: "/price-history",   label: "📈 Narx tarixi",     icon: BarChart3 },
    { href: "/audit-dashboard", label: "✅ Audit",            icon: Shield },
    { href: "/categories",      label: "📁 Kategoriyalar",   icon: Package },
    { href: "/bonuses",         label: "🎁 Bonuslar",        icon: Gift },
    { href: "/inventory",       label: "📋 Inventarizatsiya", icon: Package },
    { href: "/territories",     label: "🗺️ Territoriyalar",  icon: MapPin },
    { href: "/payment-methods", label: "💳 To'lov usullari", icon: CreditCard },
    // ── YANGI (2026-04-17) ─────────────────────────────────
    { href: "/reports-hub",     label: "📊 Hisobotlar markazi", icon: BarChart3 },
    { href: "/reports/agent",   label: "👥 Agent hisoboti",    icon: Users },
    { href: "/rfm",             label: "🎯 RFM segmentatsiya",  icon: Target },
    { href: "/pnl",             label: "💹 Foyda/Zarar",         icon: BarChart3 },
    { href: "/ekspeditorlar",   label: "🚚 Ekspeditorlar",       icon: Package },
    { href: "/skladlar",        label: "🏭 Skladlar (yangi)",    icon: Package },
    { href: "/voice-help",      label: "🎤 Ovozli buyruqlar",    icon: Activity },
    { href: "/copilot",         label: "🧠 AI Copilot (Opus)",   icon: Brain },
    { href: "/anomaliya",       label: "🛡️ Anomaliya detektori", icon: Shield },
    { href: "/biznes-salomatlik", label: "❤️ Biznes salomatligi", icon: Heart },
  ]

  // ═══════════════════════════════════════════════════════
  //  QOLDIQ NAVIGATSIYA
  // ═══════════════════════════════════════════════════════

  const navItemsSecondary = [
    { href: "/kpi",          label: "📊 KPI",              icon: Target },
    { href: "/abc-xyz",      label: "📦 ABC-XYZ Matritsa", icon: BarChart3 },
    { href: "/stock-forecast", label: "📦 Tavsiya qoldiq", icon: Package },
    { href: "/analytics",    label: "🧠 AI Tahlil",        icon: Brain },
    { href: "/loyalty",      label: "⭐ Loyalty",           icon: Star },
    { href: "/apprentices", label: nav.apprentices[locale], icon: GraduationCap },
    { href: "/expenses",    label: nav.expenses[locale],    icon: Receipt },
    { href: "/prices",      label: nav.prices[locale],      icon: Tag },
    { href: "/cash",        label: nav.cash[locale],        icon: Landmark },
  ]

  // ═══════════════════════════════════════════════════════
  //  SOZLAMALAR
  // ═══════════════════════════════════════════════════════

  const navItemsSettings = [
    { href: "/business-settings", label: "🏢 Biznes sozlamalar", icon: Settings },
    { href: "/config",      label: "⚙️ Sozlamalar",    icon: Settings },
    { href: "/settings",    label: "🔒 Hisobim",       icon: Shield },
  ]

  const renderSection = (items: typeof navItems, title?: string) => (
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
            {!collapsed && <span className="truncate">{item.label}</span>}
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

        {/* Yangi modullar — ajratilgan */}
        {!collapsed && <div className="my-2 mx-3 border-t border-border/60" />}
        {renderSection(navItemsNew, "Yangi")}

        {!collapsed && <div className="my-2 mx-3 border-t border-border/60" />}
        {renderSection(navItemsSecondary, "Boshqa")}
      </nav>

      {/* Bottom settings */}
      <div className="border-t border-border/60 py-2 px-2 space-y-0.5">
        {renderSection(navItemsSettings)}
      </div>
    </aside>
  )
}
