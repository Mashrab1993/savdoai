"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, Filter as FilterIcon, Camera, Eye } from "lucide-react"
import Link from "next/link"

const FACING = [
  { id: 1, client: "Salom Magazin №1", brand: "Bonjur", facingShare: 28, target: 25, photos: 4, agent: "Nurmatov A." },
  { id: 2, client: "Asia Optom", brand: "Coca-Cola", facingShare: 42, target: 35, photos: 6, agent: "Nurmatov A." },
  { id: 3, client: "Lider Chakana", brand: "Bonjur", facingShare: 18, target: 25, photos: 3, agent: "Karimov S." },
  { id: 4, client: "Globus Plus", brand: "Choco-Boom", facingShare: 12, target: 20, photos: 2, agent: "Rasulov B." },
  { id: 5, client: "Mega Market", brand: "Coca-Cola", facingShare: 38, target: 35, photos: 5, agent: "Yusupov D." },
  { id: 6, client: "Sharq Bozor", brand: "Aqua-Plus", facingShare: 24, target: 30, photos: 3, agent: "Yusupov D." },
]

export default function FacingPage() {
  const [showResult, setShowResult] = useState(true)

  const aboveTarget = FACING.filter(f => f.facingShare >= f.target).length
  const belowTarget = FACING.length - aboveTarget

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Facing — Display Share</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {["Категории клиентов", "Категории продуктов", "Торговая Марка", "Агент", "Город"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span><span className="text-slate-400">▾</span>
              </button>
            ))}
            <Input placeholder="Min" className="h-9" />
            <Input placeholder="Max" className="h-9" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> апр 3 — май 2 ▾
            </button>
            <Button size="sm" className="gap-1 ml-auto"><FilterIcon className="w-4 h-4" /> Filtr</Button>
          </div>
        </Card>

        {!showResult ? (
          <Card className="p-12 text-center">
            <Eye className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Facing</h2>
            <p className="text-slate-500 mt-2">По вашему запросу ничего не найдено</p>
            <Button onClick={() => setShowResult(true)} className="mt-4">Default ko'rsatish</Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="text-xs font-bold text-emerald-700">Yuqori target</div>
                <div className="text-2xl font-bold mt-1">{aboveTarget}/{FACING.length}</div>
              </Card>
              <Card className="p-4 bg-rose-50 border-rose-200">
                <div className="text-xs font-bold text-rose-700">Past target</div>
                <div className="text-2xl font-bold mt-1">{belowTarget}/{FACING.length}</div>
              </Card>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-xs font-bold text-blue-700">Foto-hisobotlar</div>
                <div className="text-2xl font-bold mt-1">{FACING.reduce((s, f) => s + f.photos, 0)}</div>
              </Card>
            </div>

            <Card className="p-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                    <th className="border border-slate-300 py-2 px-2 text-left">Klient</th>
                    <th className="border border-slate-300 py-2 px-2 text-left">Brend</th>
                    <th className="border border-slate-300 py-2 px-2 text-left">Agent</th>
                    <th className="border border-slate-300 py-2 px-2 text-right">Facing %</th>
                    <th className="border border-slate-300 py-2 px-2 text-right">Target %</th>
                    <th className="border border-slate-300 py-2 px-2 text-center">Holat</th>
                    <th className="border border-slate-300 py-2 px-2 text-center">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {FACING.map(f => {
                    const ok = f.facingShare >= f.target
                    return (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{f.id}</td>
                        <td className="border border-slate-300 py-2 px-2 font-semibold">{f.client}</td>
                        <td className="border border-slate-300 py-2 px-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded font-semibold">{f.brand}</span>
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-slate-600">{f.agent}</td>
                        <td className={`border border-slate-300 py-2 px-2 text-right font-mono font-bold ${ok ? "text-emerald-700" : "text-rose-700"}`}>{f.facingShare}%</td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-mono text-slate-500">{f.target}%</td>
                        <td className="border border-slate-300 py-2 px-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded ${ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {ok ? "✓ Yuqori" : "✗ Past"}
                          </span>
                        </td>
                        <td className="border border-slate-300 py-2 px-2 text-center">
                          <button className="inline-flex items-center gap-1 text-xs text-blue-700">
                            <Camera className="w-3.5 h-3.5" /> {f.photos}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
