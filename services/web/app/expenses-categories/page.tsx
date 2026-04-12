"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Receipt, Plus, Pencil, Trash2, Folder } from "lucide-react"
import { Tag } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const FUNDS = [
  { id: 1, nomi: "Operatsion xarajatlar", icon: "💼", count: 8 },
  { id: 2, nomi: "Marketing", icon: "📢", count: 4 },
  { id: 3, nomi: "Logistika", icon: "🚚", count: 5 },
  { id: 4, nomi: "Boshqaruv", icon: "👔", count: 3 },
  { id: 5, nomi: "Soliq va to'lovlar", icon: "💰", count: 6 },
  { id: 6, nomi: "Texnik xarajatlar", icon: "🔧", count: 4 },
]

const CATEGORIES = [
  { fund: 1, items: ["Ijara", "Kommunal xizmatlar", "Internet va aloqa", "Ofis materiallari", "Bank xizmati", "Hujjatlar"] },
  { fund: 2, items: ["Reklama", "SMS xizmat", "Telegram bot", "Web sayt"] },
  { fund: 3, items: ["Yoqilg'i", "Yetkazib berish", "Mashina ta'mir", "Sug'urta", "Anbar"] },
]

export default function ExpensesCategoriesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedFund, setSelectedFund] = useState(1)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Tag}
          gradient="amber"
          title="Xarajat kategoriyalari"
          subtitle="Fondlar va xarajat moddalarini boshqarish"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Funds */}
          <div className="md:col-span-1">
            <h2 className="font-bold mb-3">Fondlar</h2>
            <div className="space-y-2">
              {FUNDS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFund(f.id)}
                  className={`w-full bg-card rounded-lg border p-3 text-left hover:shadow-md transition ${selectedFund === f.id ? "border-emerald-500" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{f.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{f.nomi}</div>
                      <div className="text-xs text-muted-foreground">{f.count} ta modda</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="md:col-span-2">
            <h2 className="font-bold mb-3">Xarajat moddalari</h2>
            <div className="bg-card rounded-xl border p-4">
              <div className="space-y-2">
                {(CATEGORIES.find(c => c.fund === selectedFund)?.items || []).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-sm">{cat}</span>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">0 ta operatsiya</Badge>
                      <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 dark:text-rose-400"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {(CATEGORIES.find(c => c.fund === selectedFund)?.items || []).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Moddalar topilmadi</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
