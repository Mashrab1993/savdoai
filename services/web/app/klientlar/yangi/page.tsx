"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Building2, Phone, MapPin, User, Tag, Loader2, Save } from "lucide-react"
import Link from "next/link"

export default function YangiKlientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nomi: "",
    telefon: "",
    manzil: "",
    kategoriya: "Розница",
    tip_klient: "Магазин",
    hudud: "",
    inn: "",
    kontakt_shaxs: "",
    izoh: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nomi.trim()) {
      toast.error("Klient nomini kiriting")
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ id: number }>("/api/v1/klient", form)
      toast.success(`Klient yaratildi: ${form.nomi}`)
      router.push(`/klientlar/${res.id}`)
    } catch (err: any) {
      toast.error(err?.detail || "Xato yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yangi klient</h1>
          <p className="text-base text-slate-500 mt-1">Yangi mijoz qo'shing — to'liq ma'lumotlar bilan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Asosiy ma'lumotlar */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" /> Asosiy ma'lumotlar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Klient nomi *" required>
                <Input
                  value={form.nomi}
                  onChange={e => setForm({ ...form, nomi: e.target.value })}
                  placeholder="Аббос Ака Мирбозор №55"
                  required
                  autoFocus
                />
              </Field>
              <Field label="Kontakt shaxs">
                <Input
                  value={form.kontakt_shaxs}
                  onChange={e => setForm({ ...form, kontakt_shaxs: e.target.value })}
                  placeholder="Аббос Каримов"
                />
              </Field>
              <Field label="Telefon" icon={Phone}>
                <Input
                  type="tel"
                  value={form.telefon}
                  onChange={e => setForm({ ...form, telefon: e.target.value })}
                  placeholder="+998 90 123 45 67"
                />
              </Field>
              <Field label="INN">
                <Input
                  value={form.inn}
                  onChange={e => setForm({ ...form, inn: e.target.value })}
                  placeholder="123456789"
                />
              </Field>
            </div>
          </Card>

          {/* Kategoriya */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" /> Klassifikatsiya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Kategoriya">
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={form.kategoriya}
                  onChange={e => setForm({ ...form, kategoriya: e.target.value })}
                >
                  <option value="Розница">Розница</option>
                  <option value="Опт">Опт</option>
                  <option value="Хорека">Хорека</option>
                  <option value="Супермаркет">Супермаркет</option>
                  <option value="Аптека">Аптека</option>
                  <option value="Магазин">Магазин</option>
                </select>
              </Field>

              <Field label="Tip">
                <select
                  className="flex h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={form.tip_klient}
                  onChange={e => setForm({ ...form, tip_klient: e.target.value })}
                >
                  <option value="Магазин">Магазин</option>
                  <option value="Юридическое лицо">Юридическое лицо</option>
                  <option value="Физическое лицо">Физическое лицо</option>
                  <option value="Сетевой">Сетевой</option>
                </select>
              </Field>
            </div>
          </Card>

          {/* Lokatsiya */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Lokatsiya
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Hudud">
                <Input
                  value={form.hudud}
                  onChange={e => setForm({ ...form, hudud: e.target.value })}
                  placeholder="Sayfullin / Mirbozor"
                />
              </Field>
              <Field label="Manzil">
                <Input
                  value={form.manzil}
                  onChange={e => setForm({ ...form, manzil: e.target.value })}
                  placeholder="ул. Sayfullin Гадой Дамаз, 12"
                />
              </Field>
            </div>
          </Card>

          {/* Izoh */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Izoh</h3>
            <textarea
              className="w-full rounded-lg border-2 border-slate-300 p-4 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
              value={form.izoh}
              onChange={e => setForm({ ...form, izoh: e.target.value })}
              placeholder="Qo'shimcha ma'lumotlar..."
            />
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/klientlar">
              <Button type="button" variant="outline" size="lg">
                Bekor qilish
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              <Save className="w-5 h-5" />
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

function Field({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
    </div>
  )
}
