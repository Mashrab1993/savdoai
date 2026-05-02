"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Search, Pencil, Trash2, X, Tag, MoreHorizontal } from "lucide-react"
import Link from "next/link"

type Brand = {
  id: number; name: string; nameRu: string;
  category: string; manufacturer: string; country: string;
  productsCount: number; sort: number; active: boolean;
  color: string;
}

const BRAND_COLORS = ["bg-rose-500", "bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-blue-700", "bg-red-600", "bg-amber-700", "bg-rose-600", "bg-orange-600", "bg-sky-500"]

const INITIAL: Brand[] = [
  { id: 1, name: "Choco-Boom", nameRu: "Чоко-Бум", category: "Shokolad", manufacturer: "Cosmo World", country: "🇺🇿 O'zbekiston", productsCount: 36, sort: 100, active: true, color: "bg-amber-700" },
  { id: 2, name: "Bonjur", nameRu: "Бонжур", category: "Shokolad", manufacturer: "Hi baby", country: "🇺🇿 O'zbekiston", productsCount: 28, sort: 110, active: true, color: "bg-rose-600" },
  { id: 3, name: "Coca-Cola", nameRu: "Кока-Кола", category: "Gazli ichimlik", manufacturer: "Coca-Cola Co.", country: "🇺🇸 USA", productsCount: 18, sort: 120, active: true, color: "bg-red-600" },
  { id: 4, name: "Pepsi", nameRu: "Пепси", category: "Gazli ichimlik", manufacturer: "PepsiCo", country: "🇺🇸 USA", productsCount: 14, sort: 130, active: true, color: "bg-blue-700" },
  { id: 5, name: "Sok Premium", nameRu: "Сок Премиум", category: "Sok", manufacturer: "Cosmo World", country: "🇺🇿 O'zbekiston", productsCount: 24, sort: 140, active: true, color: "bg-orange-600" },
  { id: 6, name: "Voda Premium", nameRu: "Вода Премиум", category: "Mineral suv", manufacturer: "Aqua Vita", country: "🇺🇿 O'zbekiston", productsCount: 12, sort: 150, active: true, color: "bg-sky-500" },
  { id: 7, name: "Pechenye Yubileynoye", nameRu: "Юбилейное", category: "Pechenye", manufacturer: "GOLD-KEKS", country: "🇺🇿 O'zbekiston", productsCount: 16, sort: 160, active: true, color: "bg-amber-500" },
  { id: 8, name: "Triton", nameRu: "Тритон", category: "Biskvit", manufacturer: "Утёнок", country: "🇺🇿 O'zbekiston", productsCount: 8, sort: 170, active: true, color: "bg-emerald-600" },
  { id: 9, name: "Dilmah", nameRu: "Дилмах", category: "Chay", manufacturer: "Dilmah Tea", country: "🇱🇰 Sri Lanka", productsCount: 22, sort: 180, active: true, color: "bg-emerald-500" },
  { id: 10, name: "Domestos", nameRu: "Доместос", category: "Tozalovchi", manufacturer: "Unilever", country: "🇬🇧 UK", productsCount: 14, sort: 190, active: true, color: "bg-blue-700" },
  { id: 11, name: "Eski brend (snyat)", nameRu: "Старый бренд", category: "—", manufacturer: "—", country: "—", productsCount: 0, sort: 999, active: false, color: "bg-slate-400" },
]

export default function BrandPage() {
  const [brands, setBrands] = useState(INITIAL)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")
  const [editing, setEditing] = useState<Partial<Brand> | null>(null)

  const filtered = brands
    .filter(b => statusFilter === "all" || (statusFilter === "active" ? b.active : !b.active))
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.nameRu.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => setEditing({ id: 0, name: "", nameRu: "", category: "", manufacturer: "", country: "🇺🇿 O'zbekiston", productsCount: 0, sort: 100, active: true, color: "bg-blue-500" })
  const openEdit = (b: Brand) => setEditing({ ...b })

  const save = () => {
    if (!editing) return
    if (!editing.id) {
      setBrands([...brands, { ...editing as Brand, id: Math.max(0, ...brands.map(b => b.id)) + 1 }])
    } else {
      setBrands(brands.map(b => b.id === editing.id ? editing as Brand : b))
    }
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Brendlar (Торговые марки)</h1>
            <p className="text-sm text-slate-500">{brands.filter(b => b.active).length} ta faol brend · jami {brands.reduce((s, b) => s + b.productsCount, 0)} ta tovar</p>
          </div>
          <Button onClick={openAdd} className="gap-1"><Plus className="w-4 h-4" /> Yangi brend</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="active">✓ Aktiv</option>
              <option value="inactive">○ Neaktiv</option>
              <option value="all">Hammasi</option>
            </select>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">По 20</button>
            <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Brend nomi..." className="pl-9 w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">ID</th>
                  <th className="border border-slate-300 py-2 px-2 w-20">Logo</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Brend nomi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Kategoriya</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Ishlab chiqaruvchi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Mamlakat</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Tovar</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-20">Sort</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Status</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{b.id}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <div className={`w-12 h-12 rounded-lg ${b.color} flex items-center justify-center text-white font-bold mx-auto`}>
                        {b.name.split(" ").map(s => s[0]).join("").slice(0, 2)}
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2 px-3">
                      <div className="font-bold">{b.name}</div>
                      <div className="text-xs text-slate-500">{b.nameRu}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{b.category}</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{b.manufacturer}</td>
                    <td className="border border-slate-300 py-2 px-3 text-sm">{b.country}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-mono font-bold">{b.productsCount}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-mono">{b.sort}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      {b.active ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                                : <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <button onClick={() => openEdit(b)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Pencil className="w-4 h-4" /></button>
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
                  <Tag className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Brend #${editing.id}` : "Yangi brend"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Brend nomi (lat) *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Choco-Boom" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Brend nomi (rus)</label>
                  <Input value={editing.nameRu} onChange={e => setEditing({ ...editing, nameRu: e.target.value })} placeholder="Чоко-Бум" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Kategoriya</label>
                  <Input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder="Shokolad" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Ishlab chiqaruvchi</label>
                  <Input value={editing.manufacturer} onChange={e => setEditing({ ...editing, manufacturer: e.target.value })} />
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
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Sort</label>
                  <Input type="number" value={editing.sort} onChange={e => setEditing({ ...editing, sort: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium block mb-1">Brend rangi</label>
                  <div className="flex gap-2 flex-wrap">
                    {BRAND_COLORS.map(c => (
                      <button key={c} onClick={() => setEditing({ ...editing, color: c })} className={`w-8 h-8 rounded ${c} ${editing.color === c ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`} />
                    ))}
                  </div>
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
