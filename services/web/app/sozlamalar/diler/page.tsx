"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Save, MapPin, Phone, Mail, Globe, Hash, FileText, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const REGIONS = [
  { key: "mch", name: "MCH SAVDO PLUS", region: "Toshkent — markaziy ofis", inn: "302134987", agents: 18, clients: 412, color: "emerald" },
  { key: "sam", name: "MCH SAVDO PLUS — SAMARQAND", region: "Samarqand filial", inn: "302134987-S", agents: 12, clients: 256, color: "blue" },
  { key: "ub", name: "MCH SAVDO PLUS — ULUG'BEK", region: "Toshkent · Mirzo Ulug'bek", inn: "302134987-U", agents: 8, clients: 184, color: "violet" },
  { key: "sale", name: "MCH SAVDO SALE", region: "Optom + skidka kanal", inn: "302134987-X", agents: 4, clients: 98, color: "amber" },
]

export default function DilerPage() {
  const [active, setActive] = useState("mch")
  const reg = REGIONS.find(r => r.key === active)!

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Profil kompaniyasi</h1>
            <p className="text-base text-slate-500 mt-1">4 ta region · MCH SAVDO PLUS guruhi</p>
          </div>
          <Button onClick={() => toast.success("Saqlandi")} className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          {REGIONS.map(r => {
            const isActive = active === r.key
            const colorMap = { emerald: "border-emerald-500 text-emerald-700 bg-emerald-50", blue: "border-blue-500 text-blue-700 bg-blue-50", violet: "border-violet-500 text-violet-700 bg-violet-50", amber: "border-amber-500 text-amber-700 bg-amber-50" } as Record<string, string>
            return (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                className={`px-4 py-3 border-b-2 text-sm font-semibold transition-all ${
                  isActive ? colorMap[r.color] : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-1.5" />
                {r.name.split(" — ")[1] || r.name.replace("MCH ", "")}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2 space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-emerald-600" /> Asosiy ma'lumot</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Kompaniya nomi *</label>
                  <Input defaultValue={reg.name} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">INN</label>
                  <Input defaultValue={reg.inn} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">OKED</label>
                  <Input defaultValue="46390" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Tashkil etilgan sana</label>
                  <Input type="date" defaultValue="2018-03-15" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Manzil va aloqa</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Manzil</label>
                  <Input defaultValue={`${reg.region} · Sergeli tumani, Yangi Sergeli MFY 12-uy`} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</label>
                  <Input defaultValue="+998 90 123 45 67" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                  <Input defaultValue="info@savdoplus.uz" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 font-semibold mb-1 block flex items-center gap-1"><Globe className="w-3 h-3" /> Sayt</label>
                  <Input defaultValue="https://savdoplus.uz" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-violet-600" /> Bank rekvizitlari</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Bank nomi</label>
                  <Input defaultValue="Asaka Bank" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">MFO</label>
                  <Input defaultValue="00875" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Hisob raqam</label>
                  <Input defaultValue="20208000900123456001" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold mb-1 block">Direktor</label>
                  <Input defaultValue="Nurmatov M.X." />
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Region statistikasi</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Faol agentlar</span>
                  <span className="text-2xl font-bold text-emerald-600">{reg.agents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Klientlar</span>
                  <span className="text-2xl font-bold text-blue-600">{reg.clients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Sklad</span>
                  <span className="text-2xl font-bold text-violet-600">3</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Logo va shabloni</h3>
              <button className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-lg p-6 text-center transition-colors">
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500">Logo yuklash</p>
                <p className="text-xs text-slate-400 mt-1">PNG/JPG · max 2MB</p>
              </button>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
