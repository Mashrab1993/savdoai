"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, DollarSign, TrendingUp, ShoppingBag, Percent, Save, Upload, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const TABS = [
  { key: "sale", name: "Sotish narxi", desc: "Klientga sotish narxi (4 type)", icon: ShoppingBag, color: "emerald" },
  { key: "buy", name: "Olish narxi", desc: "Postavshikdan olish narxi", icon: DollarSign, color: "blue" },
  { key: "list", name: "Прайс лист", desc: "Mavjud narxlar ro'yxati", icon: TrendingUp, color: "violet" },
]

const PRICE_TYPES = [
  { key: "opt", name: "ОПТ", desc: "Ulgurji narx", color: "emerald" },
  { key: "rozn", name: "Розница", desc: "Chakana narx", color: "blue" },
  { key: "marsh", name: "Маршрут", desc: "Marshrut bo'yicha (mob)", color: "violet" },
  { key: "vip", name: "VIP", desc: "Klient kategoriyasiga", color: "amber" },
]

const ITEMS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", buy: 4_200, opt: 5_500, rozn: 6_500, marsh: 5_800, vip: 5_200 },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100", buy: 8_400, opt: 11_200, rozn: 13_500, marsh: 11_800, vip: 10_500 },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75", buy: 6_300, opt: 8_400, rozn: 10_000, marsh: 8_800, vip: 7_900 },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L", buy: 9_500, opt: 12_500, rozn: 15_000, marsh: 13_000, vip: 11_800 },
  { id: 5, name: "Suv 5L Bottle", code: "WTR-5L", buy: 4_800, opt: 6_400, rozn: 7_500, marsh: 6_700, vip: 6_000 },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500", buy: 7_800, opt: 10_400, rozn: 12_500, marsh: 11_000, vip: 9_800 },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET", buy: 11_200, opt: 14_800, rozn: 17_500, marsh: 15_500, vip: 14_000 },
  { id: 8, name: "Fanta Orange 1.5L", code: "FT-15-PET", buy: 11_000, opt: 14_500, rozn: 17_000, marsh: 15_200, vip: 13_800 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function PricePage() {
  const [tab, setTab] = useState("sale")
  const [search, setSearch] = useState("")
  const filtered = ITEMS.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Narxlar</h1>
            <p className="text-base text-slate-500 mt-1">3 tab · Sotish / Olish / Прайс — multi-tier narx tizimi</p>
          </div>
          <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Excel'dan import</Button>
          <Button onClick={() => toast.success("Narxlar saqlandi")} className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 border-b-2 text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive ? `border-${t.color}-500 text-${t.color}-700 bg-${t.color}-50` : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.name}
                <span className="text-xs text-slate-400 font-normal">— {t.desc}</span>
              </button>
            )
          })}
        </div>

        {tab === "sale" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRICE_TYPES.map(p => (
                <Card key={p.key} className={`p-4 border-2 bg-${p.color}-50 border-${p.color}-200`}>
                  <Percent className={`w-5 h-5 text-${p.color}-600 mb-2`} />
                  <div className={`text-xs font-bold text-${p.color}-700`}>{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                </Card>
              ))}
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tovar..." className="pl-9" />
                </div>
                <span className="text-sm text-slate-500">{filtered.length} ta tovar</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-left">
                      <th className="py-3 px-2 font-semibold text-slate-600">Tovar</th>
                      <th className="py-3 px-2 font-semibold text-slate-600 text-right">Olish</th>
                      <th className="py-3 px-2 font-semibold text-emerald-700 text-right">ОПТ</th>
                      <th className="py-3 px-2 font-semibold text-blue-700 text-right">Розница</th>
                      <th className="py-3 px-2 font-semibold text-violet-700 text-right">Маршрут</th>
                      <th className="py-3 px-2 font-semibold text-amber-700 text-right">VIP</th>
                      <th className="py-3 px-2 font-semibold text-slate-600 text-right">Marja %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(it => {
                      const margin = ((it.opt - it.buy) / it.buy * 100)
                      return (
                        <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2">
                            <div className="font-semibold text-slate-900">{it.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{it.code}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-500">{fmt(it.buy)}</td>
                          <td className="py-3 px-2 text-right">
                            <input defaultValue={it.opt} className="w-24 px-2 py-1 border border-slate-200 hover:border-emerald-400 rounded text-right font-mono font-bold focus:border-emerald-500 focus:outline-none" />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input defaultValue={it.rozn} className="w-24 px-2 py-1 border border-slate-200 hover:border-blue-400 rounded text-right font-mono font-bold focus:border-blue-500 focus:outline-none" />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input defaultValue={it.marsh} className="w-24 px-2 py-1 border border-slate-200 hover:border-violet-400 rounded text-right font-mono font-bold focus:border-violet-500 focus:outline-none" />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input defaultValue={it.vip} className="w-24 px-2 py-1 border border-slate-200 hover:border-amber-400 rounded text-right font-mono font-bold focus:border-amber-500 focus:outline-none" />
                          </td>
                          <td className={`py-3 px-2 text-right font-bold ${margin >= 30 ? "text-emerald-600" : margin >= 20 ? "text-amber-600" : "text-rose-600"}`}>
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {tab === "buy" && (
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4">Olish narxlari (Postavshikdan)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2">Tovar</th>
                  <th className="py-3 px-2 text-right">Olish narxi</th>
                  <th className="py-3 px-2">Postavshik</th>
                  <th className="py-3 px-2">Yangilangan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => (
                  <tr key={it.id} className="border-b border-slate-100">
                    <td className="py-3 px-2 font-semibold">{it.name}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold">{fmt(it.buy)}</td>
                    <td className="py-3 px-2 text-slate-600">Sladkiy Mir LLC</td>
                    <td className="py-3 px-2 text-slate-500 text-xs">2026-04-15</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "list" && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Прайс лист</h2>
              <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> PDF eksport</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-left">
                    <th className="py-3 px-2">№</th>
                    <th className="py-3 px-2">Tovar</th>
                    <th className="py-3 px-2">Kod</th>
                    <th className="py-3 px-2 text-right">ОПТ</th>
                    <th className="py-3 px-2 text-right">Розница</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it, i) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="py-3 px-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-3 px-2 font-semibold">{it.name}</td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs">{it.code}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-700 font-bold">{fmt(it.opt)} so'm</td>
                      <td className="py-3 px-2 text-right font-mono text-blue-700 font-bold">{fmt(it.rozn)} so'm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
