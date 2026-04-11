"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { User, Save, X, MapPin, AlertCircle, Check } from "lucide-react"
import { clientService } from "@/lib/api/services"

export default function ClientCreatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nomi: "", firm: "", inn: "",
    telefon: "", email: "",
    manzil: "", territoriya: "",
    kategoriya: "doimiy", tur: "yuridik",
    kontaktPerson: "", kreditLimit: 0,
    izoh: "",
  })

  async function handleSave() {
    if (!form.nomi.trim()) { setError("Ism majburiy"); return }
    setError(""); setSaving(true)
    try {
      await clientService.create({
        ism:          form.nomi.trim(),
        telefon:      form.telefon.trim() || undefined,
        manzil:       form.manzil.trim() || undefined,
        inn:          form.inn.trim() || undefined,
        kredit_limit: Number(form.kreditLimit) || 0,
        eslatma:      form.izoh.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => router.push("/clients"), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-7 h-7 text-emerald-600" />
            Yangi mijoz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Mijoz ma'lumotlarini kiritish</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mijoz nomi *</label>
              <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Akbar Aliyev / Do'kon nomi" />
            </div>
            <div>
              <label className="text-sm font-medium">Yuridik nom</label>
              <Input value={form.firm} onChange={e => setForm({...form, firm: e.target.value})} placeholder="MChJ / YaTT" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">INN/STIR</label>
              <Input value={form.inn} onChange={e => setForm({...form, inn: e.target.value})} placeholder="123456789" />
            </div>
            <div>
              <label className="text-sm font-medium">Mijoz turi</label>
              <select value={form.tur} onChange={e => setForm({...form, tur: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="yuridik">Yuridik shaxs</option>
                <option value="jismoniy">Jismoniy shaxs</option>
                <option value="yatt">YaTT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Telefon *</label>
              <Input value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} placeholder="+998 90 123 45 67" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Manzil
            </label>
            <Input value={form.manzil} onChange={e => setForm({...form, manzil: e.target.value})} placeholder="Manzil" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Territoriya</label>
              <select value={form.territoriya} onChange={e => setForm({...form, territoriya: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Tanlang</option>
                <option value="samarqand">Samarqand sh.</option>
                <option value="urgut">Urgut</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Kategoriya</label>
              <select value={form.kategoriya} onChange={e => setForm({...form, kategoriya: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="vip">VIP</option>
                <option value="doimiy">Doimiy</option>
                <option value="optom">Optom</option>
                <option value="supermarket">Supermarket</option>
                <option value="roznitsa">Roznitsa</option>
                <option value="horeca">HoReCa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Kredit limiti (so'm)</label>
            <Input type="number" value={form.kreditLimit} onChange={e => setForm({...form, kreditLimit: Number(e.target.value)})} />
          </div>

          <div>
            <label className="text-sm font-medium">Izoh</label>
            <Textarea value={form.izoh} onChange={e => setForm({...form, izoh: e.target.value})} rows={2} placeholder="Qo'shimcha ma'lumot..." />
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 flex items-center gap-2 text-sm">
              <Check className="w-4 h-4" /> Muvaffaqiyatli saqlandi!
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/clients")}>
              <X className="w-4 h-4 mr-1" /> Bekor
            </Button>
            <Button className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !form.nomi.trim()}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
