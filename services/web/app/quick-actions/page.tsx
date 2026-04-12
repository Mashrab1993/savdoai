"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Plus, ShoppingCart, Users, Package, FileText, CreditCard, Truck, Camera, Receipt, BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"

const ACTIONS = [
  { href: "/order-create",    label: "Yangi sotuv (POS)",   desc: "Web POS orqali sotuv",       icon: ShoppingCart, color: "emerald" },
  { href: "/product-create",  label: "Tovar qo'shish",      desc: "27 maydonli forma",           icon: Package,      color: "blue"    },
  { href: "/client-create",   label: "Mijoz qo'shish",      desc: "Yangi klient",                icon: Users,        color: "purple"  },
  { href: "/kirim",           label: "Tovar kirim",         desc: "Ombor qoldig'ini oshirish",   icon: Truck,        color: "indigo"  },
  { href: "/invoices",        label: "Faktura yaratish",    desc: "Schyot-faktura",              icon: FileText,     color: "orange"  },
  { href: "/cash",            label: "Kassa operatsiya",    desc: "Kirim / chiqim",              icon: CreditCard,   color: "yellow"  },
  { href: "/expense-create",  label: "Xarajat qo'shish",    desc: "Kassa chiqim",                icon: Receipt,      color: "red"     },
  { href: "/photo-reports",   label: "Foto hisobot",        desc: "Agent rasmlari",              icon: Camera,       color: "pink"    },
  { href: "/reports/rfm",     label: "RFM Tahlil",          desc: "Klientlar segmentatsiya",     icon: BarChart3,    color: "teal"    },
  { href: "/reports/sales-detail", label: "Sotuv detail",   desc: "Har qator foyda bilan",       icon: FileText,     color: "cyan"    },
  { href: "/sklad-qogozi",    label: "Sklad qog'ozi",       desc: "Ombor hujjati",                icon: FileText,     color: "emerald" },
  { href: "/klient360",       label: "Klient 360°",         desc: "To'liq profil",                icon: Users,        color: "blue"    },
]

export default function QuickActionsPage() {
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-7 h-7 text-emerald-600" />
            Tezkor amallar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Eng ko'p ishlatiladigan amallar — bir bosishda</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIONS.map(a => (
            <Link key={a.href} href={a.href} className="bg-card rounded-xl border p-6 hover:shadow-lg hover:border-emerald-300 transition group">
              <div className={`inline-flex p-4 bg-${a.color}-50 rounded-2xl mb-4`}>
                <a.icon className={`w-8 h-8 text-${a.color}-600`} />
              </div>
              <div className="font-bold text-lg group-hover:text-emerald-700">{a.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
