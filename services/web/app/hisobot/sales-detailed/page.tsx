"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Filter as FilterIcon, Calendar, Search } from "lucide-react"
import Link from "next/link"

const AGENTS = [
  { name: "Berdiyev Rahmatillo", obshie: 1_117_300_000, otgruzeno: 962_800_000, dostavleno: 856_400_000 },
  { name: "Babadjanova Nargiza", obshie: 786_240_000, otgruzeno: 624_800_000, dostavleno: 542_300_000 },
  { name: "BORIEV MIRJALOL", obshie: 624_400_000, otgruzeno: 542_200_000, dostavleno: 412_800_000 },
  { name: "ДАВЛАТ", obshie: 412_400_000, otgruzeno: 384_200_000, dostavleno: 286_400_000 },
  { name: "Sayitqulov Mashrab", obshie: 142_400_000, otgruzeno: 124_800_000, dostavleno: 96_400_000 },
]

const PRODUCTS = [
  { agent: "Berdiyev Rahmatillo", sum: 962_800_000, qty: 4280, retCount: 0, retSum: 0, exch: 0, exchSum: 0 },
  { agent: "Babadjanova Nargiza", sum: 624_800_000, qty: 2840, retCount: 12, retSum: 248_000, exch: 6, exchSum: 124_000 },
  { agent: "ДАВЛАТ", sum: 384_200_000, qty: 1840, retCount: 8, retSum: 168_000, exch: 4, exchSum: 84_000 },
  { agent: "BORIEV MIRJALOL", sum: 542_200_000, qty: 2480, retCount: 0, retSum: 0, exch: 2, exchSum: 42_000 },
  { agent: "Sayitqulov Mashrab", sum: 124_800_000, qty: 624, retCount: 0, retSum: 0, exch: 0, exchSum: 0 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function SalesDetailedPage() {
  const [tab, setTab] = useState<"agent" | "product">("agent")
  const [search, setSearch] = useState("")

  const totalObshie = AGENTS.reduce((s, a) => s + a.obshie, 0)
  const totalOtgruzeno = AGENTS.reduce((s, a) => s + a.otgruzeno, 0)
  const totalDostavleno = AGENTS.reduce((s, a) => s + a.dostavleno, 0)
  const totalDolg = totalOtgruzeno - 250_675_000

  return (
    <AdminLayout>
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Детальный отчёт по продажам</h1>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {["Категория продукта", "Территория", "Отгружен", "Тип цены", "Отгрузка"].map(f => (
              <button key={f} className="text-left px-3 py-2 border border-slate-300 rounded-md text-xs hover:border-emerald-400 transition-colors flex items-center justify-between">
                <span className="text-slate-700">{f}</span>
                <span className="text-slate-400">▾</span>
              </button>
            ))}
            <button className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-md text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> май 1 — май 3 ▾
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="gap-1"><FilterIcon className="w-4 h-4" /> Filtr</Button>
            <Button size="sm" variant="outline">Сброс</Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
            <div className="text-xs font-bold opacity-90 mb-2">Общие заявки</div>
            <div className="text-2xl font-bold font-mono">{fmt(totalObshie)}</div>
            <div className="text-xs opacity-90 mt-2">Кол-во: {fmt(45)}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
            <div className="text-xs font-bold opacity-90 mb-2">Отгружено</div>
            <div className="text-2xl font-bold font-mono">{fmt(totalOtgruzeno)}</div>
            <div className="text-xs opacity-90 mt-2">Кол-во: {fmt(38)}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-violet-500 to-violet-700 text-white border-0">
            <div className="text-xs font-bold opacity-90 mb-2">Доставлено</div>
            <div className="text-2xl font-bold font-mono">{fmt(totalDostavleno)}</div>
            <div className="text-xs opacity-90 mt-2">Кол-во: {fmt(32)}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-rose-500 to-pink-700 text-white border-0">
            <div className="text-xs font-bold opacity-90 mb-2">Задолженность клиентов</div>
            <div className="text-2xl font-bold font-mono">{fmt(totalDolg)}</div>
            <div className="text-xs opacity-90 mt-2">Просроченная сумма заказа</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm font-semibold mr-2">Торговые агенты</span>
            <button onClick={() => setTab("agent")} className={`px-3 py-1.5 text-xs font-semibold rounded ${tab === "agent" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>По АРС</button>
            <button onClick={() => setTab("product")} className={`px-3 py-1.5 text-xs font-semibold rounded ${tab === "product" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>По кол-ву</button>
            <button className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-600">По сумме</button>
            <span className="ml-auto text-xs">Поиск:</span>
            <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
          </div>

          {tab === "agent" && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Общие заявки</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Отгружено</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Доставлено</th>
                </tr>
              </thead>
              <tbody>
                {AGENTS.map(a => (
                  <tr key={a.name} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{a.name}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(a.obshie)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-amber-700">{fmt(a.otgruzeno)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-violet-700">{fmt(a.dostavleno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "product" && (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 text-left">Агент</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Сумма</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Возврат кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Возврат сумма</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Обмен кол-во</th>
                  <th className="border border-slate-300 py-2 px-2 text-right">Обмен сумма</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map(p => (
                  <tr key={p.agent} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{p.agent}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(p.sum)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(p.qty)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{p.retCount || "—"}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-rose-700">{p.retSum ? fmt(p.retSum) : "—"}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{p.exch || "—"}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono text-amber-700">{p.exchSum ? fmt(p.exchSum) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-base font-bold mb-3">По категории продуктов</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 py-2 px-2 text-left">Категория</th>
                <th className="border border-slate-300 py-2 px-2 text-right">Сумма (UZS)</th>
                <th className="border border-slate-300 py-2 px-2 text-right">Кол-во</th>
                <th className="border border-slate-300 py-2 px-2 text-right">% от итого</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "Шоколад", sum: 412_800_000, qty: 4280 },
                { cat: "Соки и напитки", sum: 286_400_000, qty: 2840 },
                { cat: "Печенье", sum: 142_400_000, qty: 1840 },
                { cat: "Вода", sum: 84_200_000, qty: 1240 },
                { cat: "Прочее", sum: 38_400_000, qty: 624 },
              ].map(c => {
                const pct = c.sum / 964_200_000 * 100
                return (
                  <tr key={c.cat} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{c.cat}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono font-bold text-emerald-700">{fmt(c.sum)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{fmt(c.qty)}</td>
                    <td className="border border-slate-300 py-2 px-2 text-right font-mono">{pct.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  )
}
