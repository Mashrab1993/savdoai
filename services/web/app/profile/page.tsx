"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User, Lock, Image as ImageIcon, Save, Upload, Eye, EyeOff } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function ProfilePage() {
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [form, setForm] = useState({
    company: "Mashrab Savdo",
    name: "Mashrab Sayitkulov",
    phone: "+998 77 003 00 80",
    email: "mashrab@savdoai.uz",
    address: "Samarqand sh.",
    director: "Mashrab Sayitkulov",
    bank: "Asaka Bank",
    inn: "123456789",
    nds: 15,
    esf_operator: "Didox",
    currency: "UZS",
    region: "Samarqand viloyati",
  })
  const [pass, setPass] = useState({ old: "", new: "", confirm: "" })

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Kompaniya profili
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kompaniya ma'lumotlari va sozlamalar</p>
        </div>

        <Tabs defaultValue="company">
          <TabsList>
            <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-1" /> Kompaniya</TabsTrigger>
            <TabsTrigger value="user"><User className="w-4 h-4 mr-1" /> Foydalanuvchi</TabsTrigger>
            <TabsTrigger value="security"><Lock className="w-4 h-4 mr-1" /> Xavfsizlik</TabsTrigger>
            <TabsTrigger value="branding"><ImageIcon className="w-4 h-4 mr-1" /> Logo va dizayn</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kompaniya nomi *</label>
                  <Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Region/Viloyat</label>
                  <Input value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefon *</label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Manzil</label>
                  <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Rahbar</label>
                  <Input value={form.director} onChange={e => setForm({...form, director: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank</label>
                  <Input value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">INN/STIR</label>
                  <Input value={form.inn} onChange={e => setForm({...form, inn: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium">NDS stavkasi (%)</label>
                  <Input type="number" value={form.nds} onChange={e => setForm({...form, nds: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-sm font-medium">ESF operator</label>
                  <select value={form.esf_operator} onChange={e => setForm({...form, esf_operator: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="Didox">Didox</option>
                    <option value="Faktura">Faktura.uz</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valyuta</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="UZS">So'm (UZS)</option>
                    <option value="USD">Dollar (USD)</option>
                    <option value="RUB">Rubl (RUB)</option>
                  </select>
                </div>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" /> Saqlash
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">F.I.O.</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" /> Saqlash
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Eski parol</label>
                <div className="relative">
                  <Input type={showOldPass ? "text" : "password"} value={pass.old} onChange={e => setPass({...pass, old: e.target.value})} />
                  <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-2 top-1/2 -translate-y-1/2">
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Yangi parol</label>
                <div className="relative">
                  <Input type={showNewPass ? "text" : "password"} value={pass.new} onChange={e => setPass({...pass, new: e.target.value})} />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-2 top-1/2 -translate-y-1/2">
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Yangi parolni tasdiqlash</label>
                <Input type="password" value={pass.confirm} onChange={e => setPass({...pass, confirm: e.target.value})} />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Lock className="w-4 h-4 mr-2" /> Parolni o'zgartirish
              </Button>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-bold mb-2">2-faktor autentifikatsiya (2FA)</h3>
                <p className="text-sm text-muted-foreground mb-3">Qo'shimcha xavfsizlik uchun Telegram orqali tasdiqlash kodi</p>
                <Button variant="outline">Yoqish</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="font-bold mb-4">Logo (printer va PDF uchun)</h3>
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Rasm yuklash uchun bosing yoki torting</p>
                <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Logo yuklash</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
