"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Calendar, AlertCircle, Plus, Check, Crown, Star, Zap } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

const PLANS = [
  { id: "free",      name: "Bepul",       price: 0,         icon: Star,  color: "gray",     features: ["100 ta tovar", "10 ta mijoz", "1 ta agent"] },
  { id: "starter",   name: "Boshlang'ich", price: 200000,   icon: Zap,   color: "blue",     features: ["1000 ta tovar", "100 mijoz", "5 ta agent", "GPS monitoring"] },
  { id: "business",  name: "Biznes",      price: 500000,   icon: Crown, color: "emerald",  features: ["Cheksiz tovar", "Cheksiz mijoz", "20 ta agent", "Pro tahlil", "Bonuslar"] },
  { id: "enterprise", name: "Korporativ", price: 1500000,  icon: Crown, color: "purple",   features: ["Hammasi cheksiz", "API access", "1C integratsiya", "24/7 support", "Maxsus dizayn"] },
]

const PAYMENT_HISTORY = [
  { id: 1, sana: "2026-04-01", summa: 500000, status: "to'langan", tarif: "Biznes" },
  { id: 2, sana: "2026-03-01", summa: 500000, status: "to'langan", tarif: "Biznes" },
  { id: 3, sana: "2026-02-01", summa: 500000, status: "to'langan", tarif: "Biznes" },
]

export default function BillingPage() {
  const [currentPlan] = useState("business")

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={CreditCard}
          gradient="amber"
          title="Billing"
          subtitle="Joriy tarif, balans va to'lov tarixi"
        />
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 p-4">
            <div className="text-sm text-emerald-600">Joriy tarif</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">Biznes</div>
            <div className="text-xs text-emerald-600 mt-1">Faol — 2026-05-01 gacha</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-600">Balans</div>
            <div className="text-2xl font-bold mt-1 text-blue-700">{formatCurrency(0)}</div>
            <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-3 h-3 mr-1" /> To'ldirish
            </Button>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 p-4">
            <div className="text-sm text-yellow-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Keyingi to'lov
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-700">{formatCurrency(500000)}</div>
            <div className="text-xs text-yellow-600 mt-1">2026-05-01 (21 kun qoldi)</div>
          </div>
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-lg font-bold mb-3">Tariflar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(p => (
              <div key={p.id} className={`bg-card rounded-xl border-2 p-4 ${currentPlan === p.id ? "border-emerald-500" : ""}`}>
                {currentPlan === p.id && <Badge className="bg-emerald-600 mb-2">Joriy</Badge>}
                <p.icon className={`w-8 h-8 text-${p.color}-600 mb-2`} />
                <div className="font-bold text-lg">{p.name}</div>
                <div className="text-2xl font-bold my-2">{formatCurrency(p.price)}<span className="text-sm font-normal text-muted-foreground">/oy</span></div>
                <ul className="space-y-1 text-sm mb-4">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <Check className="w-3 h-3 text-emerald-500 mt-1 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${currentPlan === p.id ? "bg-muted text-muted-foreground" : "bg-emerald-600 hover:bg-emerald-700"}`} disabled={currentPlan === p.id}>
                  {currentPlan === p.id ? "Joriy" : "Tanlash"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-lg font-bold mb-3">To'lov tarixi</h2>
          <div className="bg-card rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead className="text-center">Summa</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAYMENT_HISTORY.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.sana}</TableCell>
                    <TableCell><Badge variant="secondary">{p.tarif}</Badge></TableCell>
                    <TableCell className="text-center font-mono font-bold">{formatCurrency(p.summa)}</TableCell>
                    <TableCell className="text-center"><Badge className="bg-emerald-100 text-emerald-800">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
