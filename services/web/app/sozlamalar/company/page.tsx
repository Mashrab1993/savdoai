"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Save, Upload, MapPin, Phone, Mail, Globe } from "lucide-react"
import Link from "next/link"

export default function CompanyPage() {
  const [data, setData] = useState({
    name: "Mashrab Distribution LLC",
    inn: "302134567890",
    legalAddress: "Toshkent shahar, Yashnobod tumani, Mavzu 4, 12-uy",
    physicalAddress: "Toshkent shahar, Sergeli tumani, Yangi Bozor",
    phone: "+998 90 123 45 67",
    email: "info@mashrab.uz",
    website: "https://savdoai.com",
    bankName: "Asaka bank, Toshkent filiali",
    bankAccount: "20208000800123456789",
    bankBik: "00400",
    director: "Sayitqulov Mashrab",
    accountant: "Karimova Nargiza",
    taxRegime: "Soddalashtirilgan (UPS)",
    foundedYear: "2024",
    employees: "12",
  })

  const update = (field: string, value: string) => setData({ ...data, [field]: value })

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-emerald-600" />
              Kompaniya ma'lumotlari
            </h1>
            <p className="text-sm text-slate-500">Hujjatlar va hisob-fakturalarda ko'rsatiladi</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Logo va brending</h2>
            <div className="aspect-square bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-6xl font-bold mb-3">
              M
            </div>
            <Button variant="outline" className="w-full gap-2"><Upload className="w-4 h-4" /> Logo yuklash</Button>
            <div className="mt-4 space-y-2">
              <div>
                <label className="text-sm font-medium block mb-1">Brand rang</label>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-emerald-500 rounded border-2 border-emerald-700"></div>
                  <Input value="#10B981" readOnly className="font-mono" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Yuridik ma'lumotlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1">Tashkilot nomi</label>
                <Input value={data.name} onChange={e => update("name", e.target.value)} className="text-base" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">INN</label>
                <Input value={data.inn} onChange={e => update("inn", e.target.value)} className="font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Soliq rejimi</label>
                <select value={data.taxRegime} onChange={e => update("taxRegime", e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                  <option>Soddalashtirilgan (UPS)</option>
                  <option>Standart (KFX)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tashkil etilgan yili</label>
                <Input value={data.foundedYear} onChange={e => update("foundedYear", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Xodimlar soni</label>
                <Input value={data.employees} onChange={e => update("employees", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Yuridik manzil</label>
                <Input value={data.legalAddress} onChange={e => update("legalAddress", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Fizik manzil</label>
                <Input value={data.physicalAddress} onChange={e => update("physicalAddress", e.target.value)} />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Aloqa ma'lumotlari</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</label>
              <Input value={data.phone} onChange={e => update("phone", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
              <Input value={data.email} onChange={e => update("email", e.target.value)} type="email" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Veb sayt</label>
              <Input value={data.website} onChange={e => update("website", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Bank rekvizitlari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1">Bank nomi</label>
              <Input value={data.bankName} onChange={e => update("bankName", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Hisob raqam</label>
              <Input value={data.bankAccount} onChange={e => update("bankAccount", e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">BIK</label>
              <Input value={data.bankBik} onChange={e => update("bankBik", e.target.value)} className="font-mono" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Mas'ul shaxslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Direktor</label>
              <Input value={data.director} onChange={e => update("director", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Bosh hisobchi</label>
              <Input value={data.accountant} onChange={e => update("accountant", e.target.value)} />
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
