"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, CheckCircle2, XCircle, AlertCircle, Calendar, Filter, Download, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

const PRODUCTS = [
  { id: 1, name: "Bonjur Молочный 50г", code: "BONJ-MILK-50" },
  { id: 2, name: "Bonjur Тёмный 100г", code: "BONJ-DARK-100" },
  { id: 3, name: "Choco-Boom 75г", code: "CB-75" },
  { id: 4, name: "Sok Apelsin 1L", code: "JCE-ORG-1L" },
  { id: 5, name: "Suv 5L", code: "WTR-5L" },
  { id: 6, name: "Pechenye Yubileynoye", code: "COOK-YUB-500" },
  { id: 7, name: "Coca-Cola 1.5L", code: "CC-15-PET" },
  { id: 8, name: "Fanta 1.5L", code: "FT-15-PET" },
]

const CLIENTS = [
  { id: 1, name: "Salom Magazin №1", checks: [1, 1, 1, 1, 1, 0, 1, 1] },
  { id: 2, name: "Asia Optom", checks: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 3, name: "Lider Chakana", checks: [1, 0, 1, 0, 1, 0, 1, 1] },
  { id: 4, name: "Bobur Magazin", checks: [0, 0, 1, 1, 1, 0, 1, 0] },
  { id: 5, name: "Globus Plus", checks: [1, 1, 0, 1, 1, 1, 0, 0] },
  { id: 6, name: "Sharq Bozor", checks: [1, 0, 1, 0, 1, 1, 1, 1] },
  { id: 7, name: "Mega Market", checks: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 8, name: "Optom Tovar Service", checks: [1, 1, 0, 0, 1, 0, 1, 1] },
]

export default function StorecheckPage() {
  const [date, setDate] = useState("2026-05-02")

  const totalChecks = CLIENTS.length * PRODUCTS.length
  const presentCount = CLIENTS.reduce((s, c) => s + c.checks.reduce((a, b) => a + b, 0), 0)
  const pct = (presentCount / totalChecks * 100)

  const productStats = PRODUCTS.map((p, pi) => ({
    ...p,
    present: CLIENTS.reduce((s, c) => s + c.checks[pi], 0),
    pct: (CLIENTS.reduce((s, c) => s + c.checks[pi], 0) / CLIENTS.length * 100),
  }))

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Storecheck — Mavjudlik tahlili</h1>
            <p className="text-base text-slate-500 mt-1">Klient × Mahsulot · Foto bilan tasdiqlash · {presentCount}/{totalChecks} = <span className="font-bold text-emerald-700">{pct.toFixed(1)}% mavjudlik</span></p>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filtr</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Mavjud</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{presentCount}</div>
            <div className="text-xs text-slate-600 mt-0.5">{pct.toFixed(1)}% facing</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <XCircle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Yo'q</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{totalChecks - presentCount}</div>
            <div className="text-xs text-slate-600 mt-0.5">{(100 - pct).toFixed(1)}% out-of-stock</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Camera className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Fotolar</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{CLIENTS.length * 2}</div>
            <div className="text-xs text-slate-600 mt-0.5">o'rtacha 2/klient</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <AlertCircle className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Diqqat zonasi</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">{productStats.filter(p => p.pct < 50).length}</div>
            <div className="text-xs text-slate-600 mt-0.5">{"<50%"} mavjudlik tovar</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Storecheck matritsasi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 px-2 text-left font-semibold text-slate-600 sticky left-0 bg-white z-10 min-w-[200px]">Klient</th>
                  {PRODUCTS.map(p => (
                    <th key={p.id} className="py-3 px-2 text-center font-semibold text-slate-600 min-w-[80px]">
                      <div className="text-xs">{p.name.split(" ")[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                    </th>
                  ))}
                  <th className="py-3 px-2 text-center font-semibold text-slate-600 bg-slate-50">%</th>
                </tr>
              </thead>
              <tbody>
                {CLIENTS.map(c => {
                  const total = c.checks.reduce((s, n) => s + n, 0)
                  const cPct = (total / PRODUCTS.length * 100)
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 font-semibold text-slate-900 sticky left-0 bg-white">
                        <Link href={`/klientlar/${c.id}`} className="text-emerald-700 hover:underline">{c.name}</Link>
                      </td>
                      {c.checks.map((check, i) => (
                        <td key={i} className="py-2 px-2 text-center">
                          {check ? (
                            <div className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-md" title="Mavjud">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-7 h-7 bg-rose-100 text-rose-700 rounded-md" title="Yo'q">
                              <XCircle className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                      ))}
                      <td className={`py-2 px-2 text-center font-bold bg-slate-50 ${cPct >= 80 ? "text-emerald-700" : cPct >= 50 ? "text-amber-700" : "text-rose-700"}`}>
                        {cPct.toFixed(0)}%
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="py-3 px-2 sticky left-0 bg-slate-100">Mavjudlik %</td>
                  {productStats.map(p => (
                    <td key={p.id} className={`py-3 px-2 text-center font-mono ${p.pct >= 80 ? "text-emerald-700" : p.pct >= 50 ? "text-amber-700" : "text-rose-700"}`}>
                      {p.pct.toFixed(0)}%
                    </td>
                  ))}
                  <td className={`py-3 px-2 text-center bg-slate-200 ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700"}`}>
                    {pct.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> So'nggi foto-hisobotlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="text-xs text-white font-semibold">{CLIENTS[i % CLIENTS.length].name}</div>
                  <div className="text-[10px] text-white/80">2026-05-02 · 09:1{i}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
