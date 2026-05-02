"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, Bell, HelpCircle, User, Wallet, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopNavItem {
  href?: string
  label: string
  dropdown?: { href: string; label: string; section?: string }[]
}

const NAV: TopNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sotuv", label: "Sotuv" },
  { href: "/moliya", label: "Moliya" },
  {
    label: "Hisobotlar",
    dropdown: [
      { section: "Sotuv", href: "/hisobot/agent", label: "Zakazlar agentlar bo'yicha" },
      { section: "Sotuv", href: "/hisobot/klient", label: "Sotuvlar klientlar bo'yicha" },
      { section: "Sotuv", href: "/hisobot/tovar", label: "Sotuvlar tovarlar bo'yicha" },
      { section: "Sotuv", href: "/hisobot/sku", label: "SKU bo'yicha" },
      { section: "Klient", href: "/hisobot/klassifikatsiya", label: "Klient klassifikatsiyasi" },
      { section: "Klient", href: "/hisobot/rfm", label: "RFM segmentatsiya" },
      { section: "Visit", href: "/hisobot/visit-calendar", label: "Visit kalendari" },
      { section: "Bonus", href: "/hisobot/rlp", label: "RLP retro-bonus" },
      { section: "Bonus", href: "/hisobot/nakopit", label: "Накопительный bonus" },
      { section: "Konstruktor", href: "/hisobot/konstruktor", label: "Konstruktor (drag-drop)" },
    ],
  },
  {
    label: "Kassa",
    dropdown: [
      { section: "Klient", href: "/kassa/oplata-klient", label: "Klient to'lovlari" },
      { section: "Klient", href: "/kassa/akt-sverki-klient", label: "Akt sverki (klient)" },
      { section: "Klient", href: "/kassa/qarz-shartnoma", label: "Qarz (shartnomaga)" },
      { section: "Klient", href: "/kassa/aging", label: "Aging (6 oraliq)" },
      { section: "Postavshik", href: "/kassa/oplata-postavshik", label: "Postavshik to'lovlari" },
      { section: "Postavshik", href: "/kassa/akt-sverki-postavshik", label: "Akt sverki (postavshik)" },
      { section: "Boshqa", href: "/kassa/xarajat", label: "Xarajatlar" },
      { section: "Boshqa", href: "/kassa/cashflow", label: "Pul oqimi" },
      { section: "Boshqa", href: "/kassa/kassalar", label: "Kassalar" },
      { section: "Boshqa", href: "/kassa/stati-fondy", label: "Maqola va Fondlar" },
    ],
  },
  {
    label: "GPS",
    dropdown: [
      { href: "/gps/realtime", label: "Real-time tracking" },
      { href: "/gps/marshrut", label: "Marshrut tarixi" },
      { href: "/gps/zakaz-on-map", label: "Zakazlar xaritada" },
    ],
  },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 mr-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div>
            <div className="text-base font-bold leading-tight">SavdoAI</div>
            <div className="text-xs text-slate-500 leading-tight">v26 Premium</div>
          </div>
        </Link>
      </div>

      {/* Center: Top tabs */}
      <nav className="flex flex-1 items-center gap-1">
        {NAV.map((item) => {
          if (item.dropdown) {
            const grouped = item.dropdown.reduce((acc, d) => {
              const sec = d.section || "Asosiy"
              ;(acc[sec] ||= []).push(d)
              return acc
            }, {} as Record<string, typeof item.dropdown>)
            return (
              <DropdownMenu.Root key={item.label}>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    {item.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[700px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl grid grid-cols-3 gap-2"
                    sideOffset={8}
                  >
                    {Object.entries(grouped).map(([section, items]) => (
                      <div key={section} className="space-y-1">
                        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {section}
                        </div>
                        {items.map((d) => (
                          <DropdownMenu.Item key={d.href} asChild>
                            <Link
                              href={d.href}
                              className="block px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-md outline-none cursor-pointer"
                            >
                              {d.label}
                            </Link>
                          </DropdownMenu.Item>
                        ))}
                      </div>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )
          }

          const isActive = item.href === pathname || (item.href && pathname?.startsWith(item.href + "/"))
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "px-4 py-2 text-base font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Right: Voice + Balance + Bell + Help + Avatar */}
      <div className="flex items-center gap-2">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          title="Ovozli komanda"
        >
          <Mic className="w-5 h-5" />
        </button>

        <Link
          href="/billing"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <Wallet className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-700">Balans: 0</span>
        </Link>

        <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
          <HelpCircle className="w-5 h-5" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold">
                M
              </div>
              <span className="text-sm font-medium text-slate-700">Mashrab</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-xl" sideOffset={8} align="end">
              <DropdownMenu.Item asChild>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md outline-none cursor-pointer">
                  <User className="w-4 h-4" /> Profil
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-200 my-1" />
              <DropdownMenu.Item asChild>
                <button onClick={() => { localStorage.removeItem('auth_token'); location.href = '/login' }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md outline-none cursor-pointer">
                  Chiqish
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
