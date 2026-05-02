"use client"
import { use, useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Tag, Building2, BarChart, TrendingUp, AlertCircle, Edit2, Camera, History, Layers, Boxes } from "lucide-react"
import Link from "next/link"

const TOVAR = {
  id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50", barcode: "4760001245678",
  brand: "Bonjur", category: "Shokolad", subcat: "Молочный shokolad", segment: "Mid-range",
  unit: "dona", boxQty: 24, weight: "50 g", origin: "O'zbekiston · Bunjur LLC",
  buy: 4_200, opt: 5_500, rozn: 6_500, marsh: 5_800, vip: 5_200,
  totalStock: 124, blocks: 5, total: 124, reserved: 12, available: 112,
}

const STOCK_BY_SKLAD = [
  { name: "Markaziy ombor", qty: 64, color: "emerald" },
  { name: "Sergeli filial", qty: 36, color: "blue" },
  { name: "Yangiyul filial", qty: 24, color: "violet" },
]

const SALES_HISTORY = [
  { period: "Aprel 2026", qty: 1284, sum: 7_062_000, growth: 12.4 },
  { period: "Mart 2026", qty: 1142, sum: 6_281_000, growth: 8.6 },
  { period: "Fevral 2026", qty: 1052, sum: 5_786_000, growth: -2.1 },
  { period: "Yanvar 2026", qty: 1074, sum: 5_907_000, growth: 18.2 },
]

const RECENT_OPS = [
  { type: "kirim", date: "2026-04-28", desc: "Postuplenie #PO-1024 · 240 dona", color: "emerald" },
  { type: "sotuv", date: "2026-04-28", desc: "Zakaz #1018 · 12 dona", color: "blue" },
  { type: "sotuv", date: "2026-04-25", desc: "Zakaz #1012 · 6 dona", color: "blue" },
  { type: "spisanie", date: "2026-04-22", desc: "Brak · 2 dona", color: "rose" },
  { type: "kirim", date: "2026-04-15", desc: "Postuplenie #PO-1018 · 180 dona", color: "emerald" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TovarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState("info")
  const margin = ((TOVAR.opt - TOVAR.buy) / TOVAR.buy * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sklad" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{TOVAR.name}</h1>
            <p className="text-base text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="font-mono">{TOVAR.code}</span>
              <span>·</span>
              <span className="font-mono text-xs">📦 {TOVAR.barcode}</span>
              <span>·</span>
              <span>{TOVAR.brand} → {TOVAR.category}</span>
            </p>
          </div>
          <Button variant="outline" className="gap-2"><Edit2 className="w-4 h-4" /> Tahrirlash</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Package className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami sklad</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{TOVAR.totalStock}</div>
            <div className="text-xs text-slate-600 mt-0.5">{TOVAR.unit} · {Math.round(TOVAR.totalStock / TOVAR.boxQty)} blok</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <Boxes className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Mavjud (free)</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{TOVAR.available}</div>
            <div className="text-xs text-slate-600 mt-0.5">{TOVAR.reserved} reserve qilingan</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <Tag className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Sotish narxi</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{fmt(TOVAR.opt)} so'm</div>
            <div className="text-xs text-slate-600 mt-0.5">Olish: {fmt(TOVAR.buy)} so'm</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <TrendingUp className="w-7 h-7 text-amber-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-amber-700">Marja</div>
            <div className={`text-3xl font-bold mt-1 ${margin >= 30 ? "text-emerald-700" : margin >= 20 ? "text-amber-700" : "text-rose-700"}`}>
              {margin.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 mt-0.5">{fmt(TOVAR.opt - TOVAR.buy)} so'm/dona</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex gap-2 border-b border-slate-200 mb-4">
            {[
              { key: "info", label: "Ma'lumotlar", icon: Package },
              { key: "stock", label: "Sklad bo'yicha", icon: Building2 },
              { key: "sales", label: "Sotuv tarixi", icon: BarChart },
              { key: "ops", label: "Operatsiyalar", icon: History },
              { key: "photo", label: "Foto", icon: Camera },
            ].map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 border-b-2 text-sm font-semibold flex items-center gap-2 transition-all ${tab === t.key ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              )
            })}
          </div>

          {tab === "info" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Row label="Brend" value={TOVAR.brand} />
              <Row label="Kategoriya" value={TOVAR.category} />
              <Row label="Pod-kategoriya" value={TOVAR.subcat} />
              <Row label="Segment" value={TOVAR.segment} />
              <Row label="Birlik" value={TOVAR.unit} />
              <Row label="Blok miqdori" value={`${TOVAR.boxQty} dona/blok`} />
              <Row label="Vazn" value={TOVAR.weight} />
              <Row label="Ishlab chiqaruvchi" value={TOVAR.origin} />
              <div className="col-span-2 mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-base font-bold mb-3">Narxlar tarmog'i</h3>
                <div className="grid grid-cols-5 gap-3">
                  <PriceCell label="Olish" value={TOVAR.buy} color="slate" />
                  <PriceCell label="ОПТ" value={TOVAR.opt} color="emerald" />
                  <PriceCell label="Розница" value={TOVAR.rozn} color="blue" />
                  <PriceCell label="Маршрут" value={TOVAR.marsh} color="violet" />
                  <PriceCell label="VIP" value={TOVAR.vip} color="amber" />
                </div>
              </div>
            </div>
          )}

          {tab === "stock" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STOCK_BY_SKLAD.map(s => {
                const pct = (s.qty / TOVAR.totalStock * 100)
                return (
                  <Card key={s.name} className={`p-5 border-2 bg-${s.color}-50 border-${s.color}-200`}>
                    <Building2 className={`w-6 h-6 text-${s.color}-600 mb-2`} />
                    <div className="text-sm font-bold text-slate-900">{s.name}</div>
                    <div className="text-3xl font-bold mt-2">{s.qty} <span className="text-sm font-normal text-slate-500">{TOVAR.unit}</span></div>
                    <div className={`text-xs text-${s.color}-700 font-semibold mt-1`}>{pct.toFixed(1)}% jamidan</div>
                    <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full bg-${s.color}-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {tab === "sales" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">Davr</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Miqdor</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Sotuv summasi</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">o'sish</th>
                </tr>
              </thead>
              <tbody>
                {SALES_HISTORY.map(s => (
                  <tr key={s.period} className="border-b border-slate-100">
                    <td className="py-3 px-2 font-semibold">{s.period}</td>
                    <td className="py-3 px-2 text-right font-mono">{fmt(s.qty)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(s.sum)}</td>
                    <td className={`py-3 px-2 text-right font-mono font-semibold ${s.growth >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {s.growth >= 0 ? "+" : ""}{s.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "ops" && (
            <div className="space-y-2">
              {RECENT_OPS.map((o, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg bg-${o.color}-50 border border-${o.color}-200`}>
                  <div className={`w-10 h-10 rounded-xl bg-${o.color}-100 text-${o.color}-700 flex items-center justify-center`}>
                    {o.type === "kirim" ? <Package className="w-5 h-5" /> : o.type === "sotuv" ? <Tag className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{o.desc}</div>
                  </div>
                  <div className="text-sm text-slate-500 font-mono">{o.date}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "photo" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function PriceCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-lg bg-${color}-50 border border-${color}-200`}>
      <div className={`text-xs font-bold text-${color}-700`}>{label}</div>
      <div className="text-lg font-bold font-mono text-slate-900 mt-1">{value.toLocaleString("ru-RU")}</div>
      <div className="text-xs text-slate-500 mt-0.5">so'm</div>
    </div>
  )
}
