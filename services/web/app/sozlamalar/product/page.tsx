"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, ChevronRight, ChevronDown, Plus, Edit2, Trash2, Search, Package, Layers,
  List, GitBranch, Filter, Download, Upload, FileText, X, MoreHorizontal,
} from "lucide-react"
import Link from "next/link"

const HIERARCHY = [
  { id: 1, lvl: 1, name: "Oziq-ovqat", code: "FOOD", count: 412, children: [
    { id: 11, lvl: 2, name: "Shirinliklar", code: "FOOD-SWEET", count: 156, children: [
      { id: 111, lvl: 3, name: "Shokolad", code: "FOOD-SWEET-CHOC", count: 64, children: [
        { id: 1111, lvl: 4, name: "Bonjur", code: "FOOD-SWEET-CHOC-BONJ", count: 28, children: [
          { id: 11111, lvl: 5, name: "Молочный", code: "BONJ-MILK", count: 12 },
          { id: 11112, lvl: 5, name: "Тёмный", code: "BONJ-DARK", count: 16 },
        ]},
        { id: 1112, lvl: 4, name: "Choco-Boom", code: "FOOD-SWEET-CHOC-CB", count: 36 },
      ]},
      { id: 112, lvl: 3, name: "Pechenye", code: "FOOD-SWEET-COOK", count: 92 },
    ]},
    { id: 12, lvl: 2, name: "Ichimliklar", code: "FOOD-DRINK", count: 256, children: [
      { id: 121, lvl: 3, name: "Suv", code: "FOOD-DRINK-WTR", count: 48 },
      { id: 122, lvl: 3, name: "Sok", code: "FOOD-DRINK-JCE", count: 124 },
      { id: 123, lvl: 3, name: "Gazli", code: "FOOD-DRINK-SODA", count: 84 },
    ]},
  ]},
  { id: 2, lvl: 1, name: "Maishiy kimyo", code: "CHEM", count: 184 },
  { id: 3, lvl: 1, name: "Gigiena", code: "HYG", count: 98 },
  { id: 4, lvl: 1, name: "Bolalar tovarlari", code: "KIDS", count: 156 },
]

type Node = { id: number; lvl: number; name: string; code: string; count: number; children?: Node[] }

type Product = {
  id: string; name: string; brand: string; category: string; subcategory: string;
  tradeDirection: string; barcode: string; unit: string;
  price: number; costPrice: number; stock: number; active: boolean;
}

const PRODUCTS: Product[] = [
  { id: "F0001", name: "Юбилейный печенье в коробке (1 паллет)", brand: "БАНГЕЛЬ", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567890", unit: "Coup (paket)", price: 96_000, costPrice: 72_000, stock: 184, active: true },
  { id: "F0002", name: "Юбилейный печенье в футболкi", brand: "ИК ФУТБОЛНI", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567891", unit: "Karton (24)", price: 84_000, costPrice: 64_000, stock: 92, active: true },
  { id: "F0003", name: "Юбилейный пирог обновка - в футболкi", brand: "ИЗМИР", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567892", unit: "Karton (12)", price: 124_000, costPrice: 92_000, stock: 64, active: true },
  { id: "F0004", name: "Юбилейный вафли .OO. в футболкi", brand: "ИК ФУТБОЛНI", category: "Shirinliklar", subcategory: "Vafli", tradeDirection: "Direct", barcode: "4607034567893", unit: "Karton (10)", price: 72_000, costPrice: 56_000, stock: 48, active: true },
  { id: "F0005", name: "ESPRESSO печенье - 1 кг", brand: "TRUFFLES COCOA", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567894", unit: "kg", price: 38_000, costPrice: 28_000, stock: 142, active: true },
  { id: "F0006", name: "Этот фруктовый - 1 кг", brand: "БАНБИ", category: "Shirinliklar", subcategory: "Konfet", tradeDirection: "Direct", barcode: "4607034567895", unit: "kg", price: 52_000, costPrice: 40_000, stock: 96, active: true },
  { id: "F0007", name: "Шоколадные ассорти - 1 кг", brand: "ИНДОSOY", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567896", unit: "kg", price: 64_000, costPrice: 48_000, stock: 84, active: true },
  { id: "F0008", name: "Шоколадные ассорти ICE -1 кг", brand: "БАРВИ", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567897", unit: "kg", price: 68_000, costPrice: 52_000, stock: 72, active: true },
  { id: "F0009", name: "Шоколад тёмный КОНТР 1.6 кг 12-12 г", brand: "БИЗЗИКИ", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567898", unit: "kg", price: 156_000, costPrice: 124_000, stock: 36, active: true },
  { id: "F0010", name: "Шоколадная фабрика Choco Прoстo karaoke 1кg", brand: "БИЗЗИКИ", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567899", unit: "kg", price: 124_000, costPrice: 96_000, stock: 48, active: true },
  { id: "F0011", name: "Шоколад нaчинка с молоком DOM", brand: "БАНБИ", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567900", unit: "Karton (24)", price: 68_000, costPrice: 52_000, stock: 64, active: true },
  { id: "F0012", name: "GUM мятная упак - 5 г", brand: "ЛИНДО", category: "Shirinliklar", subcategory: "Gum", tradeDirection: "Direct", barcode: "4607034567901", unit: "Karton (50)", price: 24_000, costPrice: 18_000, stock: 248, active: true },
  { id: "F0013", name: "ЧИСТОЛЬ \"БИМ\" С АРОМАТОМ - 25 г", brand: "DOMESTOS", category: "Maishiy kimyo", subcategory: "Tozalovchi", tradeDirection: "Direct", barcode: "4607034567902", unit: "Karton (40)", price: 18_000, costPrice: 14_000, stock: 184, active: true },
  { id: "F0014", name: "Coca-Cola 1.5L PET", brand: "COCA-COLA", category: "Ichimliklar", subcategory: "Gazli", tradeDirection: "Direct", barcode: "4607034567903", unit: "Karton (6)", price: 18_000, costPrice: 14_000, stock: 96, active: true },
  { id: "F0015", name: "Choco-Boom 75g shokoladka", brand: "CHOCO-BOOM", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567904", unit: "Karton (24)", price: 12_000, costPrice: 9_000, stock: 184, active: true },
  { id: "F0016", name: "Bonjur Молочный 50g", brand: "BONJUR", category: "Shirinliklar", subcategory: "Shokolad", tradeDirection: "Direct", barcode: "4607034567905", unit: "Karton (24)", price: 6_000, costPrice: 4_500, stock: 240, active: true },
  { id: "F0017", name: "Sok Apelsin 1L Tetra", brand: "SOK", category: "Ichimliklar", subcategory: "Sok", tradeDirection: "Direct", barcode: "4607034567906", unit: "Karton (12)", price: 14_000, costPrice: 11_000, stock: 72, active: true },
  { id: "F0018", name: "Voda Premium 1L", brand: "VODA", category: "Ichimliklar", subcategory: "Suv", tradeDirection: "Direct", barcode: "4607034567907", unit: "Karton (6)", price: 4_500, costPrice: 3_500, stock: 12, active: true },
  { id: "F0019", name: "Pechenye Yubileynoye 300g", brand: "ЮБИЛЕЙНOE", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567908", unit: "Karton (12)", price: 8_400, costPrice: 6_500, stock: 48, active: true },
  { id: "F0020", name: "Biskvit Triton 150g", brand: "TRITON", category: "Shirinliklar", subcategory: "Pechenye", tradeDirection: "Direct", barcode: "4607034567909", unit: "Karton (24)", price: 5_500, costPrice: 4_200, stock: 520, active: false },
]

const BRAND_COLORS: Record<string, string> = {
  "БАНГЕЛЬ": "bg-rose-500", "ИК ФУТБОЛНI": "bg-blue-500", "ИЗМИР": "bg-amber-500",
  "TRUFFLES COCOA": "bg-violet-500", "БАНБИ": "bg-emerald-500", "ИНДОSOY": "bg-cyan-500",
  "БАРВИ": "bg-orange-500", "БИЗЗИКИ": "bg-pink-500", "ЛИНДО": "bg-teal-500",
  "DOMESTOS": "bg-blue-700", "COCA-COLA": "bg-red-600", "CHOCO-BOOM": "bg-amber-700",
  "BONJUR": "bg-rose-600", "SOK": "bg-orange-600", "VODA": "bg-sky-500", "ЮБИЛЕЙНOE": "bg-amber-500", "TRITON": "bg-emerald-600",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

function TreeNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = !!node.children?.length
  const lvlColors = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700", "bg-slate-100 text-slate-700"]
  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg cursor-pointer group"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
        ) : (
          <div className="w-4" />
        )}
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${lvlColors[node.lvl - 1] || "bg-slate-100"}`}>L{node.lvl}</span>
        <span className="font-semibold text-slate-900 flex-1">{node.name}</span>
        <span className="text-xs text-slate-400 font-mono">{node.code}</span>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{node.count} SKU</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button className="p-1 hover:bg-emerald-100 rounded"><Plus className="w-3.5 h-3.5 text-emerald-600" /></button>
          <button className="p-1 hover:bg-blue-100 rounded"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>
          <button className="p-1 hover:bg-rose-100 rounded"><Trash2 className="w-3.5 h-3.5 text-rose-600" /></button>
        </div>
      </div>
      {hasChildren && open && node.children!.map(c => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
    </div>
  )
}

export default function ProductSettingsPage() {
  const [view, setView] = useState<"tree" | "list">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")
  const [groupFilter, setGroupFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [brandFilter, setBrandFilter] = useState<string>("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Product> | null>(null)

  const categories = Array.from(new Set(PRODUCTS.map(p => p.category)))
  const brands = Array.from(new Set(PRODUCTS.map(p => p.brand)))

  const filtered = PRODUCTS
    .filter(p => statusFilter === "all" || (statusFilter === "active" ? p.active : !p.active))
    .filter(p => !categoryFilter || p.category === categoryFilter)
    .filter(p => !brandFilter || p.brand === brandFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const openAdd = () => {
    setEditing({ id: "", name: "", brand: "", category: "", subcategory: "", tradeDirection: "Direct", barcode: "", unit: "Karton", price: 0, costPrice: 0, stock: 0, active: true })
    setShowAddModal(true)
    setShowAddDropdown(false)
  }

  const openEdit = (p: Product) => {
    setEditing({ ...p })
    setShowAddModal(true)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Tovar (mahsulot)</h1>
            <p className="text-sm text-slate-500">{PRODUCTS.length} ta mahsulot · {PRODUCTS.filter(p => p.active).length} faol · ierarxiya 7 daraja</p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${view === "list" ? "bg-white shadow text-emerald-700" : "text-slate-600"}`}>
              <List className="w-3.5 h-3.5" /> Ro'yxat
            </button>
            <button onClick={() => setView("tree")} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${view === "tree" ? "bg-white shadow text-emerald-700" : "text-slate-600"}`}>
              <GitBranch className="w-3.5 h-3.5" /> Ierarxiya
            </button>
          </div>
        </div>

        {view === "tree" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              {[
                { lvl: 1, name: "Kategoriya", count: 4, c: "emerald" },
                { lvl: 2, name: "Pod-kategoriya", count: 18, c: "blue" },
                { lvl: 3, name: "Brend", count: 64, c: "violet" },
                { lvl: 4, name: "Sub-brend", count: 142, c: "amber" },
                { lvl: 5, name: "Segment", count: 248, c: "rose" },
                { lvl: 6, name: "Tip", count: 412, c: "cyan" },
                { lvl: 7, name: "Variant", count: 850, c: "slate" },
              ].map(s => (
                <Card key={s.lvl} className={`p-3 border-2 border-${s.c}-200`}>
                  <div className={`text-xs text-${s.c}-700 font-bold mb-1`}>L{s.lvl} · {s.name}</div>
                  <div className="text-2xl font-bold text-slate-900">{s.count}</div>
                </Card>
              ))}
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kategoriya / Brend / Tovar qidiring..." className="pl-9" />
                </div>
                <Button variant="outline" className="gap-2"><Layers className="w-4 h-4" /> Hammasini yopish</Button>
                <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Yangi tovar</Button>
              </div>

              <div className="border border-slate-200 rounded-lg p-2">
                {HIERARCHY.map(n => <TreeNode key={n.id} node={n} />)}
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                  <option value="active">✓ Aktiv (Faol)</option>
                  <option value="inactive">○ Neaktiv</option>
                  <option value="all">Hammasi</option>
                </select>
                <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                  <option value="">Группа</option>
                  <option value="food">Oziq-ovqat</option>
                  <option value="chem">Maishiy kimyo</option>
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                  <option value="">Категория</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                  <option>Подкатегория</option>
                </select>
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                  <option value="">Бренд</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Button onClick={() => setShowAddDropdown(!showAddDropdown)} className="gap-2"><Plus className="w-4 h-4" /> Добавить ▾</Button>
                  {showAddDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                      <button onClick={openAdd} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <Plus className="w-4 h-4" /> Новый товар
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <Filter className="w-4 h-4" /> Сортировать
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <Edit2 className="w-4 h-4" /> Активировать выбранные
                      </button>
                      <hr />
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <Upload className="w-4 h-4" /> Импорт товара из Excel
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <Download className="w-4 h-4" /> Экспорт товара в Excel
                      </button>
                      <button className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-sm">
                        <FileText className="w-4 h-4" /> Скачать шаблон импорта
                      </button>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Сортировать</Button>
                <Button variant="outline" className="gap-2"><Edit2 className="w-4 h-4" /> Активность</Button>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-slate-500">Поиск:</span>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar nomi yoki ID..." className="pl-9 w-64" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <button className="px-2 py-1 border border-slate-300 rounded text-xs">По 20</button>
                <button className="px-2 py-1 border border-slate-300 rounded text-xs">Показ./Скр. столбцы</button>
                <button className="px-2 py-1 border border-slate-300 rounded text-xs">Excel</button>
                {selected.size > 0 && (
                  <>
                    <span className="text-xs text-emerald-700 font-bold">{selected.size} ta tanlandi</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Edit2 className="w-3 h-3" /> Massiv aktivatsiya
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-rose-600">
                      <Trash2 className="w-3 h-3" /> O'chirish
                    </Button>
                  </>
                )}
                <span className="text-xs text-slate-500 ml-auto">{filtered.length} ta tovar</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 py-2 px-2 w-10">
                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                      </th>
                      <th className="border border-slate-300 py-2 px-2 text-left">ID</th>
                      <th className="border border-slate-300 py-2 px-2 text-left">Название</th>
                      <th className="border border-slate-300 py-2 px-2 text-left">Категория</th>
                      <th className="border border-slate-300 py-2 px-2 text-left">Подкатегория</th>
                      <th className="border border-slate-300 py-2 px-2 text-left">Бренд</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Narx</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Tannarx</th>
                      <th className="border border-slate-300 py-2 px-2 text-right">Zaxira</th>
                      <th className="border border-slate-300 py-2 px-2 text-center">Yo'nalish</th>
                      <th className="border border-slate-300 py-2 px-2 text-center">Status</th>
                      <th className="border border-slate-300 py-2 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className={`hover:bg-slate-50 ${selected.has(p.id) ? "bg-emerald-50" : ""}`}>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 font-mono text-blue-700">#{p.id}</td>
                        <td className="border border-slate-300 py-1.5 px-2 font-semibold cursor-pointer" onClick={() => openEdit(p)}>{p.name}</td>
                        <td className="border border-slate-300 py-1.5 px-2">{p.category}</td>
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-600">{p.subcategory}</td>
                        <td className="border border-slate-300 py-1.5 px-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${BRAND_COLORS[p.brand] ?? "bg-slate-500"}`}>
                            {p.brand}
                          </span>
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{fmt(p.price)}</td>
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-500">{fmt(p.costPrice)}</td>
                        <td className={`border border-slate-300 py-1.5 px-2 text-right font-mono font-bold ${p.stock < 50 ? "text-rose-700" : p.stock < 100 ? "text-amber-700" : "text-emerald-700"}`}>{fmt(p.stock)}</td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">{p.tradeDirection}</span>
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          {p.active
                            ? <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Faol</span>
                            : <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">○ Off</span>}
                        </td>
                        <td className="border border-slate-300 py-1.5 px-2 text-center">
                          <button className="p-1 hover:bg-slate-100 rounded"><MoreHorizontal className="w-4 h-4 text-slate-500" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>1 - {filtered.length} / {PRODUCTS.length}</span>
                <div className="flex gap-1">
                  <button className="px-2 py-1 border border-slate-300 rounded">Пред..</button>
                  <button className="px-2 py-1 bg-emerald-600 text-white rounded">1</button>
                  <button className="px-2 py-1 border border-slate-300 rounded">След..</button>
                </div>
              </div>
            </Card>
          </>
        )}

        {showAddModal && editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  {editing.id ? `Tovar #${editing.id}` : "Yangi tovar"}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium block mb-1">Tovar nomi *</label>
                  <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Choco-Boom 75g shokoladka" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Kategoriya *</label>
                  <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option value="">— tanlang —</option>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Pod-kategoriya</label>
                  <Input value={editing.subcategory} onChange={e => setEditing({ ...editing, subcategory: e.target.value })} placeholder="Shokolad" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Brend *</label>
                  <Input value={editing.brand} onChange={e => setEditing({ ...editing, brand: e.target.value })} placeholder="CHOCO-BOOM" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Yo'nalish</label>
                  <select value={editing.tradeDirection} onChange={e => setEditing({ ...editing, tradeDirection: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>Direct</option>
                    <option>Vansel</option>
                    <option>Distribution</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Shtrix kod (Barcode)</label>
                  <Input value={editing.barcode} onChange={e => setEditing({ ...editing, barcode: e.target.value })} placeholder="4607034567890" className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Birlik (unit)</label>
                  <select value={editing.unit} onChange={e => setEditing({ ...editing, unit: e.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>Karton (24)</option>
                    <option>Karton (12)</option>
                    <option>Karton (6)</option>
                    <option>Coup (paket)</option>
                    <option>kg</option>
                    <option>dona</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Sotuv narxi *</label>
                  <Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Tannarx</label>
                  <Input type="number" value={editing.costPrice} onChange={e => setEditing({ ...editing, costPrice: Number(e.target.value) })} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Boshlang'ich zaxira</label>
                  <Input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} className="font-mono" />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="active" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">Aktiv (mahsulot ishlatish uchun yoqilgan)</label>
                </div>
              </div>

              {editing.price && editing.costPrice ? (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg text-sm">
                  <span className="font-bold text-emerald-700">Marja:</span>{" "}
                  <span className="font-mono">{fmt(editing.price - editing.costPrice)} so'm</span>
                  {" "}({Math.round(((editing.price - editing.costPrice) / editing.price) * 100)}%)
                </div>
              ) : null}

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Bekor qilish</Button>
                <Button onClick={() => setShowAddModal(false)}>{editing.id ? "Saqlash" : "Yaratish"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
