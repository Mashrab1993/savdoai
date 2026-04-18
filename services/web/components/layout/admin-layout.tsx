"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "./sidebar"
import { TopHeader } from "./top-header"
import { Menu, X, LayoutDashboard, ShoppingCart, Users, Package, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuroraBg } from "@/components/ui/aurora-bg"
import { cn } from "@/lib/utils"

function MobileBottomNav() {
  const pathname = usePathname()
  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Bosh" },
    { href: "/sales",     icon: ShoppingCart,     label: "Sotuv" },
    { href: "/products",  icon: Package,          label: "Tovar" },
    { href: "/clients",   icon: Users,            label: "Klient" },
    { href: "/debts",     icon: CreditCard,       label: "Qarz" },
  ]
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-md border-t border-border/70"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium transition-colors min-h-[44px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary"
                />
              )}
              <item.icon className={cn("w-5 h-5", active && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children, title = "SavdoAI" }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative flex h-screen bg-background overflow-hidden">
      <AuroraBg />
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:border-r md:border-border/70 md:bg-sidebar">
        <Sidebar />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-border transform transition-transform duration-300 z-50 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopHeader title={title} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
