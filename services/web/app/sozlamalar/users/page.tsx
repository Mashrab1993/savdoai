"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Edit2, Lock, Unlock, Shield, User as UserIcon, Phone, Mail, Smartphone, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const ROLES = [
  { key: "admin", name: "Admin", color: "rose", desc: "To'liq huquq" },
  { key: "supervisor", name: "Supervайzer", color: "violet", desc: "Bo'lim boshlig'i" },
  { key: "agent", name: "Agent", color: "emerald", desc: "Sotuv vakili" },
  { key: "expeditor", name: "Ekspeditor", color: "blue", desc: "Yetkazib berish" },
  { key: "operator", name: "Operator", color: "amber", desc: "Buyurtma operatori" },
  { key: "accountant", name: "Buxgalter", color: "cyan", desc: "Hisobchi" },
]

const USERS = [
  { id: 1, name: "Mashrab S.", role: "admin", phone: "+998901234567", email: "mashrab@savdoplus.uz", region: "Toshkent — markaz", device: "iPhone 15", online: true, last: "Hozir" },
  { id: 2, name: "Nurmatov A.", role: "supervisor", phone: "+998935678901", email: "nurmatov@savdoplus.uz", region: "Toshkent · Sergeli", device: "Samsung S24", online: true, last: "Hozir" },
  { id: 3, name: "Rasulov B.", role: "agent", phone: "+998901112233", email: "rasulov@savdoplus.uz", region: "Samarqand", device: "Xiaomi Redmi 12", online: true, last: "5 daqiqa" },
  { id: 4, name: "Karimov S.", role: "agent", phone: "+998975544332", email: "karimov@savdoplus.uz", region: "Toshkent · Yashnobod", device: "iPhone 13", online: false, last: "1 soat" },
  { id: 5, name: "Yusupov D.", role: "agent", phone: "+998935544221", email: "yusupov@savdoplus.uz", region: "Buxoro", device: "Samsung A54", online: true, last: "Hozir" },
  { id: 6, name: "Toxirov M.", role: "expeditor", phone: "+998935678902", email: "toxirov@savdoplus.uz", region: "Toshkent — yetkazish", device: "Tablet · Lenovo M10", online: true, last: "Hozir" },
  { id: 7, name: "Aminov R.", role: "expeditor", phone: "+998935678903", email: "aminov@savdoplus.uz", region: "Samarqand · yetkazish", device: "Tablet · Samsung Tab A8", online: false, last: "3 soat" },
  { id: 8, name: "Sobirova N.", role: "operator", phone: "+998935678904", email: "sobirova@savdoplus.uz", region: "Toshkent — call markaz", device: "PC · Web", online: true, last: "Hozir" },
  { id: 9, name: "Ergashev F.", role: "accountant", phone: "+998935678905", email: "ergashev@savdoplus.uz", region: "Toshkent — markaz", device: "PC · Web", online: false, last: "Kechagi 18:32" },
]

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [activeRole, setActiveRole] = useState<string | null>(null)

  const filtered = USERS.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
    const matchRole = !activeRole || u.role === activeRole
    return matchSearch && matchRole
  })

  const roleStats = ROLES.map(r => ({ ...r, count: USERS.filter(u => u.role === r.key).length }))
  const onlineCount = USERS.filter(u => u.online).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
            <p className="text-base text-slate-500 mt-1">{USERS.length} ta user · <span className="text-emerald-700 font-semibold">{onlineCount} online</span> · 6 role</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi foydalanuvchi</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {roleStats.map(r => {
            const isActive = activeRole === r.key
            return (
              <Card
                key={r.key}
                onClick={() => setActiveRole(isActive ? null : r.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 bg-${r.color}-50 border-${r.color}-200 ${isActive ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
              >
                <Shield className={`w-5 h-5 text-${r.color}-600 mb-2`} />
                <div className={`text-xs font-bold text-${r.color}-700`}>{r.name}</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{r.count}</div>
                <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, telefon, email..." className="pl-9" />
            </div>
            <span className="text-sm text-slate-500">{filtered.length} ta natija</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Foydalanuvchi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Role</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Aloqa</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Region</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Qurilma</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const role = ROLES.find(r => r.key === u.role)!
                  return (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-${role.color}-100 text-${role.color}-700 flex items-center justify-center font-bold`}>
                            {u.name.split(" ")[0][0]}{u.name.split(" ")[1]?.[0] || ""}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${role.color}-100 text-${role.color}-700`}>
                          {role.name}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-xs text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {u.phone}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-400" /> {u.email}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-700 text-xs">{u.region}</td>
                      <td className="py-3 px-2">
                        <div className="text-xs text-slate-700 flex items-center gap-1"><Smartphone className="w-3 h-3 text-slate-400" /> {u.device}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {u.online ? (
                          <div className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                            <Wifi className="w-3 h-3" /> {u.last}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <WifiOff className="w-3 h-3" /> {u.last}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex gap-1">
                          <button onClick={() => toast.info(`${u.name} tahrirlanmoqda`)} className="p-1.5 hover:bg-blue-100 rounded-lg" title="Tahrirlash">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button onClick={() => toast.info(`${u.name} bloklandi`)} className="p-1.5 hover:bg-rose-100 rounded-lg" title="Bloklash">
                            <Lock className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
