"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Receipt,
  Tag,
  Landmark,
  ShoppingCart,
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

  const handleNavClick = () => {
    onNavigate?.()
  }

  const navItems = [
    { href: "/dashboard",   label: nav.dashboard[locale],   icon: LayoutDashboard },
    { href: "/sales",       label: locale === "uz" ? "Sotuv" : "Продажа", icon: ShoppingCart },
    { href: "/clients",     label: nav.clients[locale],     icon: Users },
    { href: "/products",    label: nav.products[locale],    icon: Package },
    { href: "/debts",       label: nav.debts[locale],       icon: CreditCard },
    { href: "/invoices",    label: nav.invoices[locale],    icon: FileText },
    { href: "/reports",     label: nav.reports[locale],     icon: BarChart3 },
  ]

  const navItemsSecondary = [
    { href: "/apprentices", label: nav.apprentices[locale], icon: GraduationCap },
    { href: "/expenses",    label: nav.expenses[locale],    icon: Receipt },
    { href: "/prices",      label: nav.prices[locale],      icon: Tag },
    { href: "/cash",        label: nav.cash[locale],        icon: Landmark },
  ]

  // Mark future routes as "next phase" with a subtle pill
  const roadmapHrefs = new Set<string>([])

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon
    const isRoadmap = roadmapHrefs.has(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-0"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            {isRoadmap && !active && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/40 shrink-0">
                {locale === "uz" ? "Beta" : "Beta"}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-62"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 h-16 px-4 border-b border-sidebar-border shrink-0",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-sidebar-foreground leading-none truncate">
              SavdoAI
            </span>
            <span className="text-[10px] text-sidebar-foreground/40 mt-0.5 truncate">v25</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(renderNavItem)}

        {/* Divider */}
        <div className={cn(
          "my-3 border-t border-sidebar-border",
          collapsed ? "mx-2" : "mx-1"
        )} />

        {navItemsSecondary.map(renderNavItem)}
      </nav>

      {/* Settings + Collapse */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-3">
        {renderNavItem({ href: "/settings", label: nav.settings[locale], icon: Settings })}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">{nav.collapse[locale]}</span>}
        </button>
      </div>
    </aside>
  )
}
