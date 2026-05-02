"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Filter as FilterIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const AGENTS = [
  { name: "BORIEV MIRJALOL", id: 1 },
  { name: "Babadjanova Nargiza", id: 2 },
  { name: "Sayitqulov Mashrab", id: 3 },
  { name: "Berdiyev Rahmatillo", id: 4 },
  { name: "ДАВЛАТ", id: 5 },
  { name: "Турсунов Жамшед", id: 6 },
]

const PRODUCTS = [
  "PERFECT", "Elif chocolate", "PRIMA GREEN", "GANGAALI Karol", "СЕМЕЧКИ", "FRUCTIS",
  "Н BABY салфетки", "Тувлетная бумаговилотчник", "Игрушки CANDY TOYS", "NEWON веха магазин",
  "Мочадков веха шоколада", "BORD крем", "HILOL", "PRIMA Оранжевый", "SALPETE&Полярикников волосви Direm",
  "ERFIBLES", "Еш ФУТБОЛЧИ", "NISO", "EMERALD CANDY", "BREF", "PERSIL", "VUMOS", "DOVE", "CLEAR", "ARIEL",
  "DOMESTOS", "FAIRY", "PANTINE PRO-V", "LINDO", "COLGATE", "Mr.Muscle&MrProper", "LENOR", "CALGON",
  "OLD SPISE", "SLADUS", "HEAD & SHOULDERS", "REXONA", "PALMOLIVE", "HACI SAKIR", "TIDE&AMP", "AXE",
  "Lady Speed Stick", "GRASS", "Sofia", "TRUFFLES COCOA", "Choco Boms", "ACE", "Хорден",
]

export default function PlanSetupPage() {
  const [tab, setTab] = useState<"setup" | "merch">("setup")
  const [selectedTab, setSelectedTab] = useState<"products" | "monthly" | "axs" | "orders">("products")

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/plans" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Установка плана</h1>
          <Button onClick={() => toast.success("Plan saqlandi")} className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-4">
          <div className="flex border-b border-slate-200 mb-4">
            <button onClick={() => setTab("setup")} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === "setup" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500"}`}>
              Настройка плана
            </button>
            <button onClick={() => setTab("merch")} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === "merch" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500"}`}>
              Мерчандайзинг
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              Считать с возврата
            </label>
            <select className="px-3 py-1.5 border border-slate-300 rounded text-xs">
              <option>1 неделя</option>
              <option>1 месяц</option>
              <option>1 квартал</option>
            </select>
            <select className="px-3 py-1.5 border border-slate-300 rounded text-xs">
              <option>Объем</option>
              <option>АРС</option>
              <option>Кол-во заказов</option>
            </select>
            <Button size="sm" className="ml-auto">Бнять</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 sticky top-0">
                  <th className="border border-slate-300 py-2 px-2 text-left min-w-[200px]">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Сумма</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Количество</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Объем</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">АРС</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кол-во заказов</th>
                </tr>
              </thead>
              <tbody>
                {AGENTS.map(a => (
                  <tr key={a.id} className="bg-emerald-50/30 border-y-2 border-emerald-200">
                    <td className="border border-slate-300 py-2 px-2 font-bold text-slate-900">▸ {a.name}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">0</td>
                  </tr>
                ))}
                {PRODUCTS.map((p, i) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-2 text-emerald-700 hover:underline cursor-pointer pl-6 text-xs">{p}</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-300">—</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-300">—</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-300">—</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-300">—</td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-300">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
