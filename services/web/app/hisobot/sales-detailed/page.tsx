"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Filter as FilterIcon, Calendar } from "lucide-react"
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Детальный <span className="italic text-[#C75D3C]">отчёт по продажам</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Agent × Tovar pivot · qaytarish va almashish</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {["Категория продукта", "Территория", "Отгружен", "Тип цены", "Отгрузка"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between">
                  <span className="text-[#6B5B4D]">{f}</span>
                  <span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
              <button className="px-3 py-2 border border-[#C75D3C]/40 bg-[#FCE9DD] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> май 1 — май 3 ▾
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" className="gap-1" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
              <Button size="sm" variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">Сброс</Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard accent="#10B981" label="Общие заявки" value={fmt(totalObshie)} sub="Кол-во: 45" />
            <KpiCard accent="#D97706" label="Отгружено" value={fmt(totalOtgruzeno)} sub="Кол-во: 38" />
            <KpiCard accent="#7C3AED" label="Доставлено" value={fmt(totalDostavleno)} sub="Кол-во: 32" />
            <KpiCard accent="#C75D3C" label="Задолженность клиентов" value={fmt(totalDolg)} sub="Просроченная" />
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mr-2">Торговые агенты</span>
              <button onClick={() => setTab("agent")} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === "agent" ? "bg-[#C75D3C] text-white" : "bg-[#FAF7F2] text-[#6B5B4D] border border-[#E8E0D3]"}`}>По АРС</button>
              <button onClick={() => setTab("product")} className={`px-3 py-1.5 text-xs font-medium rounded ${tab === "product" ? "bg-[#C75D3C] text-white" : "bg-[#FAF7F2] text-[#6B5B4D] border border-[#E8E0D3]"}`}>По кол-ву</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded bg-[#FAF7F2] text-[#6B5B4D] border border-[#E8E0D3]">По сумме</button>
              <span className="ml-auto text-xs text-[#9C8A6E]">Поиск:</span>
              <Input value={search} onChange={e => setSearch(e.target.value)} className="w-48 border-[#E8E0D3] bg-[#FAF7F2]" />
            </div>

            {tab === "agent" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                      <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Общие заявки</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Отгружено</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Доставлено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AGENTS.map(a => (
                      <tr key={a.name} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{a.name}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(a.obshie)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#D97706]">{fmt(a.otgruzeno)}</td>
                        <td className="py-3 px-2 text-right font-mono text-purple-700">{fmt(a.dostavleno)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "product" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                      <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Агент</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Сумма</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Кол-во</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Возврат кол-во</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Возврат сумма</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Обмен кол-во</th>
                      <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Обмен сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCTS.map(p => (
                      <tr key={p.agent} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{p.agent}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(p.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(p.qty)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{p.retCount || "—"}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#C75D3C]">{p.retSum ? fmt(p.retSum) : "—"}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#6B5B4D]">{p.exch || "—"}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#D97706]">{p.exchSum ? fmt(p.exchSum) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h3 className="text-lg font-light mb-4 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>По категории продуктов</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Категория</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Сумма (UZS)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Кол-во</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">% от итого</th>
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
                      <tr key={c.cat} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-3 px-2 font-medium text-[#1A1A1A]">{c.cat}</td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-emerald-700" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(c.sum)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{fmt(c.qty)}</td>
                        <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ accent, label, value, sub }: { accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium font-mono tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
