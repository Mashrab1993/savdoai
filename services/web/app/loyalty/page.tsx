"use client"

import { AdminLayout } from "@/components/layout/admin-layout"
import { KpiCard } from "@/components/ui/kpi-card"
import { Star, Gift, Crown, Users } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"
import { useApi } from "@/hooks/use-api"
import { useState } from "react"

const DARAJALAR = [
  { key: "bronze", nomi: "Bronze", emoji: "🥉", min: 0, chegirma: 0, rang: "#cd7f32" },
  { key: "silver", nomi: "Silver", emoji: "🥈", min: 100, chegirma: 2, rang: "#c0c0c0" },
  { key: "gold", nomi: "Gold", emoji: "🥇", min: 500, chegirma: 5, rang: "#ffd700" },
  { key: "platinum", nomi: "Platinum", emoji: "💎", min: 2000, chegirma: 10, rang: "#e5e4e2" },
]

export default function LoyaltyPage() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" /> Loyalty Tizimi
          </h1>
          <p className="text-muted-foreground">
            Bonus ball va VIP darajalar boshqaruvi
          </p>
        </div>

        {/* Qoidalar */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" /> Qoidalar
          </h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>• Har 1,000 so&apos;m sotuv = 1 bonus ball</p>
            <p>• Ball avtomatik har sotuvda qo&apos;shiladi</p>
            <p>• Ballni chegirmaga almashtirish mumkin</p>
          </div>
        </div>

        {/* Darajalar */}
        <div className="grid grid-cols-2 gap-3">
          {DARAJALAR.map((d) => (
            <div
              key={d.key}
              className="rounded-xl border p-4 text-center transition-all hover:shadow-md"
              style={{ borderColor: d.rang + "44" }}
            >
              <div className="text-3xl mb-1">{d.emoji}</div>
              <div className="font-bold" style={{ color: d.rang }}>{d.nomi}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {d.min}+ ball
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: d.rang }}>
                {d.chegirma > 0 ? `${d.chegirma}% chegirma` : "Boshlang'ich"}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="rounded-xl border bg-primary/5 p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Crown className="h-4 w-4" /> Qanday ishlaydi?
          </h3>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>1. Klient sotib oladi → avtomatik ball yig&apos;iladi</p>
            <p>2. Ball ko&apos;paygan sari daraja oshadi</p>
            <p>3. Yuqori daraja = ko&apos;proq chegirma</p>
            <p>4. Bot da: <code className="bg-muted px-1 rounded">/loyalty Salimov</code></p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
