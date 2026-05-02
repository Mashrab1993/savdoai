"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Rocket, ShoppingCart, Warehouse, Tags, Store, Users, ClipboardCheck, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: string
}

const ITEMS: SidebarItem[] = [
  { href: "/plans", icon: Rocket, label: "Rejalar" },
  { href: "/zakazlar", icon: ShoppingCart, label: "Zakazlar" },
  { href: "/sklad", icon: Warehouse, label: "Sklad" },
  { href: "/markirovka", icon: Tags, label: "Markirovka" },
  { href: "/klientlar", icon: Store, label: "Klientlar" },
  { href: "/komanda", icon: Users, label: "Komanda" },
  { href: "/audit", icon: ClipboardCheck, label: "Audit" },
  { href: "/sozlamalar", icon: Settings, label: "Sozlamalar" },
]

export function LeftSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-20 flex-col items-center gap-2 border-r border-slate-200 bg-slate-900 py-4">
      {ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex w-16 flex-col items-center gap-1 rounded-xl px-2 py-3 transition-all",
              isActive
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-tight text-center">
              {item.label}
            </span>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
            )}
          </Link>
        )
      })}
    </aside>
  )
}
