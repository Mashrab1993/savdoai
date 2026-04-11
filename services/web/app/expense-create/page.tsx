"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Receipt, Save, X, AlertCircle, Check } from "lucide-react"

export default function ExpenseCreatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    fond: "operatsion",
    kategoriya: "ijara",
    summa: "",
    valyuta: "UZS",
    kassa: "naqd",
    sana: new Date().toISOString().split("T")[0],
    izoh: "",
  })

  async function handleSave() {
    const summa = Number(form.summa)
    if (!summa || summa <= 0) { setError("Summa kiriting"); return }
    setError(""); setSaving(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${base}/api/v1/kassa/operatsiya`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({
          tur:        "chiqim",
          summa,
          usul:       form.kassa === "karta" ? "karta" : "naqd",
          tavsif:     form.izoh || `${form.fond}: ${form.kategoriya}`,
          kategoriya: form.kategoriya,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSuccess(true)
      setTimeout(() => router.push("/cash"), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Yangi xarajat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Xarajatni qayd etish</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fond *</label>
              <select value={form.fond} onChange={e => setForm({...form, fond: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="operatsion">Operatsion xarajatlar</option>
                <option value="marketing">Marketing</option>
                <option value="logistika">Logistika</option>
                <option value="boshqaruv">Boshqaruv</option>
                <option value="soliq">Soliq va to'lovlar</option>
                <option value="texnik">Texnik xarajatlar</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Kategoriya *</label>
              <select value={form.kategoriya} onChange={e => setForm({...form, kategoriya: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="ijara">Ijara</option>
                <option value="kommunal">Kommunal xizmatlar</option>
                <option value="internet">Internet va aloqa</option>
                <option value="material">Ofis materiallari</option>
                <option value="bank">Bank xizmati</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Summa *</label>
              <Input type="number" value={form.summa} onChange={e => setForm({...form, summa: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium">Valyuta</label>
              <select value={form.valyuta} onChange={e => setForm({...form, valyuta: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="UZS">UZS (so'm)</option>
                <option value="USD">USD (dollar)</option>
                <option value="RUB">RUB (rubl)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kassa</label>
              <select value={form.kassa} onChange={e => setForm({...form, kassa: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="asosiy">Asosiy kassa</option>
                <option value="karta">Karta kassa</option>
                <option value="bank">Bank hisob</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Sana *</label>
              <Input type="date" value={form.sana} onChange={e => setForm({...form, sana: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Izoh</label>
            <Textarea value={form.izoh} onChange={e => setForm({...form, izoh: e.target.value})} placeholder="Xarajat haqida ma'lumot..." rows={3} />
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 flex items-center gap-2 text-sm">
              <Check className="w-4 h-4" /> Muvaffaqiyatli saqlandi! Kassa sahifasiga yo&apos;naltirilmoqda...
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/cash")}>
              <X className="w-4 h-4 mr-1" /> Bekor
            </Button>
            <Button className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !form.summa}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
