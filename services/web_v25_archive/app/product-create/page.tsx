"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Save, X, Image as ImageIcon, Upload, AlertCircle, Check } from "lucide-react"
import { PackagePlus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { productService } from "@/lib/api/services"

export default function ProductCreatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nomi: "", kategoriya: "kosmetika", podkategoriya: "",
    brend: "", segment: "", ishlab_chiqaruvchi: "",
    birlik: "dona", hajm: 1, ogirlik: 1,
    blokda_soni: 1, korobkada_soni: 1,
    olish_narxi: 0, sotish_narxi: 0,
    qoldiq: 0, min_qoldiq: 5,
    shtrix_kod: "", artikul: "", sap_kod: "",
    ikpu_kod: "", gtin: "",
    saralash: 500, yaroqlilik_muddati: 0,
    tavsif: "", faol: true,
  })

  async function handleSave() {
    if (!form.nomi.trim()) { setError("Tovar nomi majburiy"); return }
    setError(""); setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        nomi:               form.nomi.trim(),
        kategoriya:         form.kategoriya || "Boshqa",
        birlik:             form.birlik    || "dona",
        olish_narxi:        Number(form.olish_narxi) || 0,
        sotish_narxi:       Number(form.sotish_narxi) || 0,
        qoldiq:             Number(form.qoldiq) || 0,
        min_qoldiq:         Number(form.min_qoldiq) || 0,
        brend:              form.brend || undefined,
        podkategoriya:      form.podkategoriya || undefined,
        ishlab_chiqaruvchi: form.ishlab_chiqaruvchi || undefined,
        segment:            form.segment || undefined,
        shtrix_kod:         form.shtrix_kod || undefined,
        artikul:            form.artikul || undefined,
        sap_kod:            form.sap_kod || undefined,
        ikpu_kod:           form.ikpu_kod || undefined,
        gtin:               form.gtin || undefined,
        hajm:               Number(form.hajm) || undefined,
        ogirlik:            Number(form.ogirlik) || undefined,
        blokda_soni:        Number(form.blokda_soni) || undefined,
        korobkada_soni:     Number(form.korobkada_soni) || undefined,
        saralash:           Number(form.saralash) || undefined,
        yaroqlilik_muddati: Number(form.yaroqlilik_muddati) || undefined,
        tavsif:             form.tavsif || undefined,
      }
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])
      await productService.create(payload as Parameters<typeof productService.create>[0])
      setSuccess(true)
      setTimeout(() => router.push("/products"), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={PackagePlus}
          gradient="emerald"
          title="Yangi tovar"
          subtitle="SalesDoc darajasida — barcha maydonlar bilan"
        />
        </div>

        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Asosiy</TabsTrigger>
            <TabsTrigger value="extra">Qo'shimcha</TabsTrigger>
            <TabsTrigger value="ikpu">IKPU</TabsTrigger>
            <TabsTrigger value="photo">Foto</TabsTrigger>
            <TabsTrigger value="package">Quti</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Tovar nomi *</label>
                <Input value={form.nomi} onChange={e => setForm({...form, nomi: e.target.value})} placeholder="Tovar nomi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kategoriya *</label>
                  <select value={form.kategoriya} onChange={e => setForm({...form, kategoriya: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="kosmetika">Kosmetika</option>
                    <option value="parfyumeriya">Parfyumeriya</option>
                    <option value="maishiy_kimyo">Maishiy kimyo</option>
                    <option value="oziq_ovqat">Oziq-ovqat</option>
                    <option value="gigiyena">Gigiyena</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Podkategoriya</label>
                  <Input value={form.podkategoriya} onChange={e => setForm({...form, podkategoriya: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Brend</label>
                  <Input value={form.brend} onChange={e => setForm({...form, brend: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Segment</label>
                  <Input value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Ishlab chiqaruvchi</label>
                  <Input value={form.ishlab_chiqaruvchi} onChange={e => setForm({...form, ishlab_chiqaruvchi: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Birlik</label>
                  <select value={form.birlik} onChange={e => setForm({...form, birlik: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="dona">Dona</option>
                    <option value="kg">Kg</option>
                    <option value="l">Litr</option>
                    <option value="m">Metr</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Hajm</label>
                  <Input type="number" value={form.hajm} onChange={e => setForm({...form, hajm: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Og'irlik (kg)</label>
                  <Input type="number" value={form.ogirlik} onChange={e => setForm({...form, ogirlik: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Olish narxi *</label>
                  <Input type="number" value={form.olish_narxi} onChange={e => setForm({...form, olish_narxi: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Sotish narxi *</label>
                  <Input type="number" value={form.sotish_narxi} onChange={e => setForm({...form, sotish_narxi: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Qoldiq</label>
                  <Input type="number" value={form.qoldiq} onChange={e => setForm({...form, qoldiq: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Min qoldiq</label>
                  <Input type="number" value={form.min_qoldiq} onChange={e => setForm({...form, min_qoldiq: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="extra" className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Shtrix kod</label>
                  <Input value={form.shtrix_kod} onChange={e => setForm({...form, shtrix_kod: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Artikul</label>
                  <Input value={form.artikul} onChange={e => setForm({...form, artikul: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">SAP kod</label>
                  <Input value={form.sap_kod} onChange={e => setForm({...form, sap_kod: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Saralash</label>
                  <Input type="number" value={form.saralash} onChange={e => setForm({...form, saralash: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Yaroqlilik muddati (kun)</label>
                  <Input type="number" value={form.yaroqlilik_muddati} onChange={e => setForm({...form, yaroqlilik_muddati: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tavsif</label>
                <Textarea value={form.tavsif} onChange={e => setForm({...form, tavsif: e.target.value})} rows={3} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ikpu" className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">IKPU kod</label>
                <Input value={form.ikpu_kod} onChange={e => setForm({...form, ikpu_kod: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">GTIN kod</label>
                <Input value={form.gtin} onChange={e => setForm({...form, gtin: e.target.value})} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6">
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Rasm yuklash</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="package" className="space-y-4">
            <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Blokda soni</label>
                  <Input type="number" value={form.blokda_soni} onChange={e => setForm({...form, blokda_soni: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Korobkada soni</label>
                  <Input type="number" value={form.korobkada_soni} onChange={e => setForm({...form, korobkada_soni: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 flex items-center gap-2 text-sm">
            <Check className="w-4 h-4" /> Muvaffaqiyatli saqlandi!
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/products")}>
            <X className="w-4 h-4 mr-1" /> Bekor
          </Button>
          <Button className="flex-1"
                  onClick={handleSave}
                  disabled={saving || !form.nomi.trim()}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Saqlanmoqda..." : "Tovar saqlash"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
