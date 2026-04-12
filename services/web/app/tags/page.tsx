"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const COLORS = ["red", "blue", "emerald", "yellow", "purple", "pink", "indigo", "orange"]
const DEFAULT_TAGS = [
  { id: 1, nomi: "VIP", color: "yellow", count: 0 },
  { id: 2, nomi: "Yangi", color: "blue", count: 0 },
  { id: 3, nomi: "Qaytmas", color: "red", count: 0 },
  { id: 4, nomi: "Sodiq mijoz", color: "emerald", count: 0 },
  { id: 5, nomi: "Katta", color: "purple", count: 0 },
  { id: 6, nomi: "Kichik", color: "pink", count: 0 },
]

export default function TagsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nomi: "", color: "blue" })
  const [tags] = useState(DEFAULT_TAGS)

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Tag}
          gradient="amber"
          title="Teglar"
          subtitle="Mijoz va tovarlarni belgilash uchun teglar"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi teg
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tags.map(t => (
            <div key={t.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <Badge className={`bg-${t.color}-100 text-${t.color}-800 text-base px-3 py-1`}>{t.nomi}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{t.count} ta foydalanilgan</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
