"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, ChevronRight, ChevronDown, Pencil, Trash2, X, FolderTree } from "lucide-react"
import Link from "next/link"

type Cat = {
  id: number; name: string; nameRu: string; code: string;
  parentId: number | null; productsCount: number;
  sort: number; active: boolean;
}

const CATS_INIT: Cat[] = [
  { id: 1, name: "Oziq-ovqat", nameRu: "Продукты питания", code: "FOOD", parentId: null, productsCount: 412, sort: 100, active: true },
  { id: 11, name: "Shirinliklar", nameRu: "Сладости", code: "FOOD-SWEET", parentId: 1, productsCount: 156, sort: 110, active: true },
  { id: 111, name: "Shokolad", nameRu: "Шоколад", code: "FOOD-SWEET-CHOC", parentId: 11, productsCount: 64, sort: 111, active: true },
  { id: 112, name: "Pechenye", nameRu: "Печенье", code: "FOOD-SWEET-COOK", parentId: 11, productsCount: 92, sort: 112, active: true },
  { id: 113, name: "Konfet", nameRu: "Конфеты", code: "FOOD-SWEET-CAND", parentId: 11, productsCount: 48, sort: 113, active: true },
  { id: 12, name: "Ichimliklar", nameRu: "Напитки", code: "FOOD-DRINK", parentId: 1, productsCount: 256, sort: 120, active: true },
  { id: 121, name: "Suv", nameRu: "Вода", code: "FOOD-DRINK-WTR", parentId: 12, productsCount: 48, sort: 121, active: true },
  { id: 122, name: "Sok", nameRu: "Сок", code: "FOOD-DRINK-JCE", parentId: 12, productsCount: 124, sort: 122, active: true },
  { id: 123, name: "Gazli ichimlik", nameRu: "Газированные напитки", code: "FOOD-DRINK-SODA", parentId: 12, productsCount: 84, sort: 123, active: true },
  { id: 124, name: "Chay", nameRu: "Чай", code: "FOOD-DRINK-TEA", parentId: 12, productsCount: 22, sort: 124, active: true },
  { id: 2, name: "Maishiy kimyo", nameRu: "Бытовая химия", code: "CHEM", parentId: null, productsCount: 184, sort: 200, active: true },
  { id: 21, name: "Tozalovchi", nameRu: "Чистящие", code: "CHEM-CLEAN", parentId: 2, productsCount: 96, sort: 210, active: true },
  { id: 22, name: "Yuvuvchi", nameRu: "Моющие", code: "CHEM-WASH", parentId: 2, productsCount: 88, sort: 220, active: true },
  { id: 3, name: "Gigiena", nameRu: "Гигиена", code: "HYG", parentId: null, productsCount: 98, sort: 300, active: true },
  { id: 4, name: "Bolalar tovarlari", nameRu: "Детские товары", code: "KIDS", parentId: null, productsCount: 156, sort: 400, active: true },
  { id: 5, name: "Eski kategoriya", nameRu: "Старая категория", code: "OLD", parentId: null, productsCount: 0, sort: 999, active: false },
]

function buildTree(cats: Cat[], parentId: number | null = null, depth = 0): { cat: Cat; depth: number }[] {
  return cats
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .flatMap(c => [{ cat: c, depth }, ...buildTree(cats, c.id, depth + 1)])
}

export default function CategoryProductPage() {
  const [cats, setCats] = useState(CATS_INIT)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<Partial<Cat> | null>(null)

  const visibleCats = cats.filter(c => statusFilter === "all" || (statusFilter === "active" ? c.active : !c.active))
  const flat = buildTree(visibleCats)

  // Hide children of collapsed parents
  const hidden = new Set<number>()
  function markHidden(parentId: number) {
    visibleCats.filter(c => c.parentId === parentId).forEach(c => {
      hidden.add(c.id)
      markHidden(c.id)
    })
  }
  collapsed.forEach(id => markHidden(id))

  const toggleCollapse = (id: number) => {
    const next = new Set(collapsed)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCollapsed(next)
  }

  const hasChildren = (id: number) => visibleCats.some(c => c.parentId === id)

  const openAdd = (parentId: number | null = null) => setEditing({ id: 0, name: "", nameRu: "", code: "", parentId, productsCount: 0, sort: 100, active: true })
  const openEdit = (c: Cat) => setEditing({ ...c })

  const save = () => {
    if (!editing) return
    if (!editing.id) setCats([...cats, { ...editing as Cat, id: Math.max(0, ...cats.map(c => c.id)) + 1 }])
    else setCats(cats.map(c => c.id === editing.id ? editing as Cat : c))
    setEditing(null)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Tovar kategoriyalari</h1>
            <p className="text-sm text-slate-500">{cats.filter(c => c.active).length} ta faol kategoriya · ko'p darajali daraxt</p>
          </div>
          <Button onClick={() => openAdd()} className="gap-1"><Plus className="w-4 h-4" /> Yangi kategoriya</Button>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
              <option value="active">✓ Aktiv</option>
              <option value="inactive">○ Neaktiv</option>
              <option value="all">Hammasi</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set(visibleCats.filter(c => hasChildren(c.id)).map(c => c.id)))}>
              Hammasini yopish
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set())}>
              Hammasini ochish
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg p-2">
            {flat.filter(({ cat }) => !hidden.has(cat.id)).map(({ cat, depth }) => (
              <div
                key={cat.id}
                className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg group ${!cat.active ? "opacity-50" : ""}`}
                style={{ paddingLeft: `${12 + depth * 24}px` }}
              >
                {hasChildren(cat.id) ? (
                  <button onClick={() => toggleCollapse(cat.id)} className="p-0.5 hover:bg-slate-100 rounded">
                    {collapsed.has(cat.id) ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                ) : (
                  <div className="w-5" />
                )}

                <FolderTree className={`w-4 h-4 ${cat.active ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="font-semibold flex-1">{cat.name}</span>
                <span className="text-xs text-slate-500">{cat.nameRu}</span>
                <span className="text-xs text-slate-400 font-mono px-2 py-0.5 bg-slate-50 rounded">{cat.code}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{cat.productsCount} SKU</span>
                <span className="text-[10px] text-slate-400 font-mono w-12 text-right">sort: {cat.sort}</span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openAdd(cat.id)} className="p-1 hover:bg-emerald-100 rounded" title="Pod qo'shish">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button onClick={() => openEdit(cat)} className="p-1 hover:bg-blue-100 rounded">
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button className="p-1 hover:bg-rose-100 rounded">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Kategoriya #${editing.id}` : "Yangi kategoriya"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Nom (uz/lat) *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Shokolad" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Nom (ru)</label>
                  <Input value={editing.nameRu} onChange={e => setEditing({ ...editing, nameRu: e.target.value })} placeholder="Шоколад" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Kod *</label>
                  <Input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="FOOD-SWEET-CHOC" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Ota kategoriya</label>
                  <select value={editing.parentId ?? ""} onChange={e => setEditing({ ...editing, parentId: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option value="">— ROOT (asosiy) —</option>
                    {cats.filter(c => c.id !== editing.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Sort</label>
                  <Input type="number" value={editing.sort} onChange={e => setEditing({ ...editing, sort: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
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
