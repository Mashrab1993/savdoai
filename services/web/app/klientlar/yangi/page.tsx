"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Building2, Phone, MapPin, Tag, Loader2, Save } from "lucide-react"
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/klientlar" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENTLAR</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Yangi <span className="italic text-[#C75D3C]">klient</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Yangi mijoz qo'shing — to'liq ma'lumotlar bilan</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Asosiy ma'lumotlar */}
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Building2 className="w-5 h-5 text-[#C75D3C]" /> Asosiy ma'lumotlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Klient nomi *" required>
                  <Input value={form.nomi} onChange={e => setForm({ ...form, nomi: e.target.value })} placeholder="Аббос Ака Мирбозор №55" required autoFocus className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
                <Field label="Kontakt shaxs">
                  <Input value={form.kontakt_shaxs} onChange={e => setForm({ ...form, kontakt_shaxs: e.target.value })} placeholder="Аббос Каримов" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
                <Field label="Telefon" icon={Phone}>
                  <Input type="tel" value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} placeholder="+998 90 123 45 67" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
                <Field label="INN">
                  <Input value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} placeholder="123456789" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
              </div>
            </Card>

            {/* Kategoriya */}
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Tag className="w-5 h-5 text-[#C75D3C]" /> Klassifikatsiya
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Kategoriya">
                  <select
                    className="flex h-11 w-full rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 text-base focus:border-[#C75D3C] focus:outline-none focus:ring-2 focus:ring-[#C75D3C]/20"
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
                    className="flex h-11 w-full rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] px-4 text-base focus:border-[#C75D3C] focus:outline-none focus:ring-2 focus:ring-[#C75D3C]/20"
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
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <MapPin className="w-5 h-5 text-[#C75D3C]" /> Lokatsiya
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Hudud">
                  <Input value={form.hudud} onChange={e => setForm({ ...form, hudud: e.target.value })} placeholder="Sayfullin / Mirbozor" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
                <Field label="Manzil">
                  <Input value={form.manzil} onChange={e => setForm({ ...form, manzil: e.target.value })} placeholder="ул. Sayfullin Гадой Дамаз, 12" className="border-[#E8E0D3] bg-[#FAF7F2]" />
                </Field>
              </div>
            </Card>

            {/* Izoh */}
            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
              <h3 className="text-lg font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Izoh</h3>
              <textarea
                className="w-full rounded-lg border border-[#E8E0D3] bg-[#FAF7F2] p-4 text-base focus:border-[#C75D3C] focus:outline-none focus:ring-2 focus:ring-[#C75D3C]/20 min-h-[100px]"
                value={form.izoh}
                onChange={e => setForm({ ...form, izoh: e.target.value })}
                placeholder="Qo'shimcha ma'lumotlar..."
              />
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
              <Link href="/klientlar">
                <Button type="button" variant="outline" size="lg" className="border-[#E8E0D3] text-[#6B5B4D]">
                  Bekor qilish
                </Button>
              </Link>
              <Button type="submit" size="lg" disabled={loading} style={{ background: "#C75D3C" }}>
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                <Save className="w-5 h-5 mr-1" />
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}

function Field({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#6B5B4D] flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4 text-[#9C8A6E]" />}
        {label}
        {required && <span className="text-[#C75D3C]">*</span>}
      </label>
      {children}
    </div>
  )
}
