"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Factory, Pencil, Trash2, X, Globe, Search } from "lucide-react"
import Link from "next/link"

type Manufacturer = {
  id: number; name: string; country: string; brandsCount: number;
  productsCount: number; contactPerson: string; phone: string;
  email: string; address: string; active: boolean;
}

const INITIAL: Manufacturer[] = [
  { id: 1, name: "Cosmo World", country: "🇺🇿 O'zbekiston", brandsCount: 4, productsCount: 84, contactPerson: "Yusupov A.", phone: "+998 90 111 22 33", email: "info@cosmo.uz", address: "Toshkent, Yashnobod", active: true },
  { id: 2, name: "GOLD-KEKS", country: "🇺🇿 O'zbekiston", brandsCount: 3, productsCount: 56, contactPerson: "Karimov B.", phone: "+998 71 222 33 44", email: "sales@goldkeks.uz", address: "Samarqand", active: true },
  { id: 3, name: "Утёнок", country: "🇺🇿 O'zbekiston", brandsCount: 2, productsCount: 28, contactPerson: "Toxirjon S.", phone: "+998 90 333 44 55", email: "info@utenok.uz", address: "Toshkent", active: true },
  { id: 4, name: "Hi baby", country: "🇺🇿 O'zbekiston", brandsCount: 2, productsCount: 32, contactPerson: "Akmalov R.", phone: "+998 90 444 55 66", email: "contact@hibaby.uz", address: "Toshkent", active: true },
  { id: 5, name: "Coca-Cola Co.", country: "🇺🇸 USA", brandsCount: 5, productsCount: 24, contactPerson: "Mike Johnson", phone: "+1 404 555 0100", email: "uz@coca-cola.com", address: "Atlanta, GA", active: true },
  { id: 6, name: "PepsiCo", country: "🇺🇸 USA", brandsCount: 4, productsCount: 18, contactPerson: "Sarah Davis", phone: "+1 914 555 0200", email: "uz@pepsi.com", address: "Purchase, NY", active: true },
  { id: 7, name: "Dilmah Tea", country: "🇱🇰 Sri Lanka", brandsCount: 1, productsCount: 22, contactPerson: "Kasun Perera", phone: "+94 11 234 5678", email: "info@dilmahtea.com", address: "Negombo", active: true },
  { id: 8, name: "Unilever", country: "🇬🇧 UK", brandsCount: 8, productsCount: 38, contactPerson: "James Brown", phone: "+44 20 7822 5252", email: "uz@unilever.com", address: "London", active: true },
  { id: 9, name: "Aqua Vita", country: "🇺🇿 O'zbekiston", brandsCount: 1, productsCount: 14, contactPerson: "Salimov N.", phone: "+998 71 555 66 77", email: "info@aquavita.uz", address: "Toshkent, Yangi Hayot", active: true },
  { id: 10, name: "Сладкая Слобода", country: "🇷🇺 Rossiya", brandsCount: 3, productsCount: 18, contactPerson: "Иванов И.", phone: "+7 495 123 4567", email: "info@sweetsloboda.ru", address: "Москва", active: true },
]

export default function ManufacturerPage() {
  const [mans, setMans] = useState(INITIAL)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Partial<Manufacturer> | null>(null)

  const filtered = mans.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.country.includes(search))

  const totalBrands = mans.reduce((s, m) => s + m.brandsCount, 0)
  const totalProducts = mans.reduce((s, m) => s + m.productsCount, 0)
  const countries = Array.from(new Set(mans.map(m => m.country))).length

  const openAdd = () => setEditing({ id: 0, name: "", country: "🇺🇿 O'zbekiston", brandsCount: 0, productsCount: 0, contactPerson: "", phone: "", email: "", address: "", active: true })
  const openEdit = (m: Manufacturer) => setEditing({ ...m })

  const save = () => {
    if (!editing) return
    if (!editing.id) setMans([...mans, { ...editing as Manufacturer, id: Math.max(0, ...mans.map(m => m.id)) + 1 }])
    else setMans(mans.map(m => m.id === editing.id ? editing as Manufacturer : m))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Factory className="w-7 h-7 text-amber-600" />
              Ishlab chiqaruvchilar
            </h1>
            <p className="text-sm text-slate-500">{mans.length} kompaniya · {totalBrands} brend · {totalProducts} mahsulot · {countries} mamlakat</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi ishlab chiqaruvchi</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Factory className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Kompaniyalar</div>
            <div className="text-2xl font-bold mt-1">{mans.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">Brendlar</div>
            <div className="text-2xl font-bold mt-1">{totalBrands}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="text-xs font-bold text-emerald-700">Mahsulotlar</div>
            <div className="text-2xl font-bold mt-1">{totalProducts}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Globe className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Mamlakatlar</div>
            <div className="text-2xl font-bold mt-1">{countries}</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom yoki mamlakat..." className="pl-9 w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">ID</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Kompaniya</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Mamlakat</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Bog'lovchi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Telefon</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Email</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Brend</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">SKU</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-20">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{m.id}</td>
                    <td className="border border-slate-300 py-2 px-3 font-bold">{m.name}</td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{m.country}</td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{m.contactPerson}</td>
                    <td className="border border-slate-300 py-2 px-3 text-xs font-mono">{m.phone}</td>
                    <td className="border border-slate-300 py-2 px-3 text-xs text-blue-600">{m.email}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{m.brandsCount}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold text-emerald-700">{m.productsCount}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {m.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓</span>
                                : <span className="text-xs px-2 py-0.5 rounded bg-slate-200">○</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button onClick={() => openEdit(m)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Pencil className="w-4 h-4" /></button>
                      <button className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Factory className="w-5 h-5 text-amber-600" />
                  {editing.id ? `Ishlab chiqaruvchi #${editing.id}` : "Yangi ishlab chiqaruvchi"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium block mb-1">Kompaniya nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Mamlakat</label>
                  <select value={editing.country} onChange={e => setEditing({ ...editing, country: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>🇺🇿 O'zbekiston</option>
                    <option>🇷🇺 Rossiya</option>
                    <option>🇰🇿 Qozog'iston</option>
                    <option>🇹🇷 Turkiya</option>
                    <option>🇨🇳 Xitoy</option>
                    <option>🇺🇸 USA</option>
                    <option>🇩🇪 Germaniya</option>
                    <option>🇬🇧 UK</option>
                    <option>🇱🇰 Sri Lanka</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Bog'lovchi shaxs</label>
                  <Input value={editing.contactPerson} onChange={e => setEditing({ ...editing, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Telefon</label>
                  <Input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Email</label>
                  <Input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} type="email" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium block mb-1">Manzil</label>
                  <Input value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Bekor</Button>
                <Button onClick={save}>{editing.id ? "Saqlash" : "Yaratish"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
