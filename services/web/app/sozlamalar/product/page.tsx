"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ChevronRight, ChevronDown, Plus, Edit2, Trash2, Search, Package, Layers } from "lucide-react"
import Link from "next/link"

const HIERARCHY = [
  { id: 1, lvl: 1, name: "Oziq-ovqat", code: "FOOD", count: 412, children: [
    { id: 11, lvl: 2, name: "Shirinliklar", code: "FOOD-SWEET", count: 156, children: [
      { id: 111, lvl: 3, name: "Shokolad", code: "FOOD-SWEET-CHOC", count: 64, children: [
        { id: 1111, lvl: 4, name: "Bоnжуr", code: "FOOD-SWEET-CHOC-BONJ", count: 28, children: [
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

export default function ProductHierarchyPage() {
  const [search, setSearch] = useState("")
  const total = 850

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Mahsulot ierarxiyasi</h1>
            <p className="text-base text-slate-500 mt-1">7 daraja: Kategoriya → Pod-kategoriya → Brend → Sub-brend → Segment → Tip → Variant</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Yangi kategoriya</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {[
            { lvl: 1, name: "Kategoriya", count: 4, c: "emerald" },
            { lvl: 2, name: "Pod-kategoriya", count: 18, c: "blue" },
            { lvl: 3, name: "Brend", count: 64, c: "violet" },
            { lvl: 4, name: "Sub-brend", count: 142, c: "amber" },
            { lvl: 5, name: "Segment", count: 248, c: "rose" },
            { lvl: 6, name: "Tip", count: 412, c: "cyan" },
            { lvl: 7, name: "Variant", count: total, c: "slate" },
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
            <Button variant="outline" className="gap-2"><Package className="w-4 h-4" /> Tovarlar ko'rinishi</Button>
          </div>

          <div className="border border-slate-200 rounded-lg p-2">
            {HIERARCHY.map(n => <TreeNode key={n.id} node={n} />)}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
