"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Pencil, Trash2, Send, Copy } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const TEMPLATES = [
  { id: 1, nomi: "Yangi buyurtma", matn: "Hurmatli {ism}, sizning {raqam}-buyurtmangiz qabul qilindi. Summa: {summa} so'm.", kategoriya: "buyurtma" },
  { id: 2, nomi: "Qarz eslatmasi", matn: "Hurmatli {ism}, sizning qarzingiz {summa} so'm. Iltimos, to'lov qiling.", kategoriya: "qarz" },
  { id: 3, nomi: "Yetkazildi", matn: "Hurmatli {ism}, sizning buyurtmangiz yetkazildi. Rahmat!", kategoriya: "buyurtma" },
  { id: 4, nomi: "To'lov qabul qilindi", matn: "Hurmatli {ism}, {summa} so'm to'lovingiz qabul qilindi. Rahmat!", kategoriya: "tolov" },
  { id: 5, nomi: "Aksiya", matn: "Hurmatli mijoz! {sana}gacha barcha tovarlarga {chegirma}% chegirma!", kategoriya: "aksiya" },
]

export default function SmsTemplatesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [templates] = useState(TEMPLATES)

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={MessageSquare}
          gradient="cyan"
          title="SMS shablonlar"
          subtitle="Avtomatik xabarlar uchun matn shablonlari"
        />
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi shablon
          </Button>
        </div>

        {/* Variables Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
          <div className="font-bold text-blue-700 mb-2">Mavjud o'zgaruvchilar:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {["{ism}", "{telefon}", "{summa}", "{raqam}", "{sana}", "{chegirma}", "{kompaniya}", "{manzil}"].map(v => (
              <Badge key={v} variant="secondary" className="font-mono">{v}</Badge>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-card rounded-xl border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold">{t.nomi}</div>
                  <Badge variant="secondary" className="text-xs mt-1">{t.kategoriya}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm"><Copy className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm"><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="text-sm bg-muted/50 dark:bg-muted rounded p-3 mb-3 leading-relaxed">
                {t.matn}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Send className="w-3 h-3 mr-1" /> Test yuborish
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
