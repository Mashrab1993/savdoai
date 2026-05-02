"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, CheckCircle2, XCircle, AlertCircle, Filter, Download, Image as ImageIcon } from "lucide-react"
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-6">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Storecheck — <span className="italic text-[#C75D3C]">mavjudlik</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">
                Klient × Mahsulot · Foto bilan tasdiqlash · {presentCount}/{totalChecks} = <span className="font-medium text-emerald-700">{pct.toFixed(1)}% mavjudlik</span>
              </p>
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-lg text-sm" />
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Filter className="w-4 h-4" /> Filtr</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle2} accent="#10B981" label="Mavjud" value={presentCount.toString()} sub={`${pct.toFixed(1)}% facing`} />
            <KpiCard icon={XCircle} accent="#C75D3C" label="Yo'q" value={(totalChecks - presentCount).toString()} sub={`${(100 - pct).toFixed(1)}% out-of-stock`} />
            <KpiCard icon={Camera} accent="#3B82F6" label="Fotolar" value={(CLIENTS.length * 2).toString()} sub="o'rtacha 2/klient" />
            <KpiCard icon={AlertCircle} accent="#D97706" label="Diqqat zonasi" value={productStats.filter(p => p.pct < 50).length.toString()} sub="<50% mavjud tovar" />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Storecheck matritsasi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] sticky left-0 bg-[#FAF7F2] z-10 min-w-[200px]">Klient</th>
                    {PRODUCTS.map(p => (
                      <th key={p.id} className="py-3 px-2 text-center min-w-[80px]">
                        <div className="text-xs font-medium text-[#1A1A1A]">{p.name.split(" ")[0]}</div>
                        <div className="text-[10px] text-[#9C8A6E] font-mono">{p.code}</div>
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E] bg-[#F0EAE0]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {CLIENTS.map(c => {
                    const total = c.checks.reduce((s, n) => s + n, 0)
                    const cPct = (total / PRODUCTS.length * 100)
                    return (
                      <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                        <td className="py-2 px-2 font-medium sticky left-0 bg-white">
                          <Link href={`/klientlar/${c.id}`} className="text-[#C75D3C] hover:underline">{c.name}</Link>
                        </td>
                        {c.checks.map((check, i) => (
                          <td key={i} className="py-2 px-2 text-center">
                            {check ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-700 rounded-md" title="Mavjud">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-7 h-7 bg-[#F5E5D6] text-[#C75D3C] rounded-md" title="Yo'q">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        ))}
                        <td className={`py-2 px-2 text-center font-medium bg-[#FAF7F2] tabular-nums ${cPct >= 80 ? "text-emerald-700" : cPct >= 50 ? "text-[#D97706]" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                          {cPct.toFixed(0)}%
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-[#E8E0D3] bg-[#F0EAE0]">
                    <td className="py-3 px-2 sticky left-0 bg-[#F0EAE0] text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Mavjudlik %</td>
                    {productStats.map(p => (
                      <td key={p.id} className={`py-3 px-2 text-center font-mono font-medium tabular-nums ${p.pct >= 80 ? "text-emerald-700" : p.pct >= 50 ? "text-[#D97706]" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                        {p.pct.toFixed(0)}%
                      </td>
                    ))}
                    <td className={`py-3 px-2 text-center font-medium bg-[#E8E0D3] tabular-nums ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-[#D97706]" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <ImageIcon className="w-5 h-5 text-[#C75D3C]" /> So'nggi foto-hisobotlar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="relative aspect-[3/4] bg-[#F0EAE0] rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer group border border-[#E8E0D3]">
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FCE9DD 0%, #F0EAE0 100%)" }}>
                    <Camera className="w-8 h-8 text-[#9C8A6E]" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="text-xs text-white font-medium">{CLIENTS[i % CLIENTS.length].name}</div>
                    <div className="text-[10px] text-white/80">2026-05-02 · 09:1{i}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value, sub }: { icon: React.ElementType; accent: string; label: string; value: string; sub: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-6 h-6 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
