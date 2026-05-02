"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Package, Tag, DollarSign, Layers, Loader2, Save, ScanLine } from "lucide-react"
import Link from "next/link"

export default function YangiTovarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nomi: "",
    kod: "",
    artikul: "",
    sap_kod: "",
    shtrix_kod: "",
    brend: "",
    kategoriya: "Shirinlik",
    podkategoriya: "",
    guruh: "",
    ishlab_chiqaruvchi: "",
    segment: "",
    birlik: "Дона",
    blokda_soni: "",
    korobkada_soni: "",
    olish_narxi: "",
    sotish_narxi: "",
    min_sotish_narxi: "",
    qoldiq: "",
    min_qoldiq: "",
    yaroqlilik_muddati: "",
    tavsif: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nomi.trim()) { toast.error("Nom kiriting"); return }
    if (!form.sotish_narxi) { toast.error("Sotish narxi kiriting"); return }
    setLoading(true)
    try {
      const res = await api.post<{ id: number }>("/api/v1/tovar", {
        ...form,
        olish_narxi: form.olish_narxi ? Number(form.olish_narxi) : 0,
        sotish_narxi: Number(form.sotish_narxi),
        min_sotish_narxi: form.min_sotish_narxi ? Number(form.min_sotish_narxi) : 0,
        qoldiq: form.qoldiq ? Number(form.qoldiq) : 0,
        min_qoldiq: form.min_qoldiq ? Number(form.min_qoldiq) : 0,
        blokda_soni: form.blokda_soni ? Number(form.blokda_soni) : 1,
        korobkada_soni: form.korobkada_soni ? Number(form.korobkada_soni) : 1,
      })
      toast.success(`Tovar yaratildi: ${form.nomi}`)
      router.push(`/sklad/${res.id}`)
    } catch (err: any) {
      toast.error(err?.detail || "Xato yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <Link href="/sklad" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Sklad ro'yxatiga
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yangi tovar</h1>
          <p className="text-base text-slate-500 mt-1">Mahsulot kartochkasi — to'liq parametrlar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" /> Asosiy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tovar nomi *" required>
                <Input value={form.nomi} onChange={e => setForm({ ...form, nomi: e.target.value })} placeholder="GANJAVALI-Krem" required autoFocus />
              </Field>
              <Field label="Birlik">
                <select className="flex h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-base focus:border-emerald-500" value={form.birlik} onChange={e => setForm({ ...form, birlik: e.target.value })}>
                  <option value="Дона">Дона</option>
                  <option value="Кг">Кг</option>
                  <option value="Литр">Литр</option>
                  <option value="Блок">Блок</option>
                  <option value="Коробка">Коробка</option>
                  <option value="Мешок">Мешок</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-600" /> Identifikatsiya
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Kod"><Input value={form.kod} onChange={e => setForm({ ...form, kod: e.target.value })} placeholder="1001" /></Field>
              <Field label="Artikul"><Input value={form.artikul} onChange={e => setForm({ ...form, artikul: e.target.value })} placeholder="AR-001" /></Field>
              <Field label="SAP kod"><Input value={form.sap_kod} onChange={e => setForm({ ...form, sap_kod: e.target.value })} placeholder="SAP-001" /></Field>
              <Field label="Shtrix kod"><Input value={form.shtrix_kod} onChange={e => setForm({ ...form, shtrix_kod: e.target.value })} placeholder="4607123456789" /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" /> Klassifikatsiya (7 daraja)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Kategoriya">
                <select className="flex h-11 w-full rounded-lg border-2 border-slate-300 px-4 text-base focus:border-emerald-500" value={form.kategoriya} onChange={e => setForm({ ...form, kategoriya: e.target.value })}>
                  <option value="Shirinlik">Shirinlik</option>
                  <option value="Kosmetika">Kosmetika</option>
                  <option value="Maishiy kimyo">Maishiy kimyo</option>
                  <option value="Gigiyena">Gigiyena</option>
                  <option value="Oziq-ovqat">Oziq-ovqat</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </Field>
              <Field label="Podkategoriya"><Input value={form.podkategoriya} onChange={e => setForm({ ...form, podkategoriya: e.target.value })} /></Field>
              <Field label="Guruh"><Input value={form.guruh} onChange={e => setForm({ ...form, guruh: e.target.value })} /></Field>
              <Field label="Brend"><Input value={form.brend} onChange={e => setForm({ ...form, brend: e.target.value })} placeholder="GANJAVALI" /></Field>
              <Field label="Ishlab chiqaruvchi"><Input value={form.ishlab_chiqaruvchi} onChange={e => setForm({ ...form, ishlab_chiqaruvchi: e.target.value })} /></Field>
              <Field label="Segment"><Input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Narxlar va qoldiq
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Olish narxi"><Input type="number" value={form.olish_narxi} onChange={e => setForm({ ...form, olish_narxi: e.target.value })} placeholder="9500" /></Field>
              <Field label="Sotish narxi *" required><Input type="number" value={form.sotish_narxi} onChange={e => setForm({ ...form, sotish_narxi: e.target.value })} placeholder="12000" required /></Field>
              <Field label="Min sotish narxi"><Input type="number" value={form.min_sotish_narxi} onChange={e => setForm({ ...form, min_sotish_narxi: e.target.value })} placeholder="11000" /></Field>
              <Field label="Joriy qoldiq"><Input type="number" value={form.qoldiq} onChange={e => setForm({ ...form, qoldiq: e.target.value })} placeholder="100" /></Field>
              <Field label="Min qoldiq (ogohlantirish)"><Input type="number" value={form.min_qoldiq} onChange={e => setForm({ ...form, min_qoldiq: e.target.value })} placeholder="20" /></Field>
              <Field label="Blokda soni"><Input type="number" value={form.blokda_soni} onChange={e => setForm({ ...form, blokda_soni: e.target.value })} placeholder="6" /></Field>
              <Field label="Korobkada soni"><Input type="number" value={form.korobkada_soni} onChange={e => setForm({ ...form, korobkada_soni: e.target.value })} placeholder="48" /></Field>
              <Field label="Yaroqlilik muddati"><Input value={form.yaroqlilik_muddati} onChange={e => setForm({ ...form, yaroqlilik_muddati: e.target.value })} placeholder="12 oy" /></Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tavsif</h3>
            <textarea
              className="w-full rounded-lg border-2 border-slate-300 p-4 text-base focus:border-emerald-500 min-h-[100px]"
              value={form.tavsif}
              onChange={e => setForm({ ...form, tavsif: e.target.value })}
              placeholder="Tovar haqida qo'shimcha ma'lumot..."
            />
          </Card>

          <div className="flex items-center justify-end gap-3 pb-6">
            <Link href="/sklad"><Button type="button" variant="outline" size="lg">Bekor qilish</Button></Link>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-600 ml-1">*</span>}</label>
      {children}
    </div>
  )
}
