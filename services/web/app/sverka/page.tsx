"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileCheck, Download, Printer } from "lucide-react"
import { formatCurrencyFull } from "@/lib/format"

export default function AktSverkiPage() {
  const [klientId, setKlientId] = useState("")
  const [danSana, setDanSana] = useState("")
  const [gachaSana, setGachaSana] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  const yaratish = async () => {
    if (!klientId || !danSana || !gachaSana) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/sverka/${klientId}?sana_dan=${danSana}&sana_gacha=${gachaSana}`, { method: "POST", headers: h })
      if (!res.ok) { alert(`Xato: HTTP ${res.status}`); return }
      if (res.ok) setResult(await res.json())
    } finally { setLoading(false) }
  }

  const N = (v: any) => Number(v || 0)

  return (
    <AdminLayout title="📋 Akt sverki">
      <div className="max-w-3xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">Klient bilan solishtirish akti — SD Agent client/revise analogi</p>

        {/* Form */}
        <div className="bg-card rounded-xl border p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Klient ID</label>
              <Input type="number" value={klientId} onChange={e => setKlientId(e.target.value)} placeholder="Klient ID" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Boshlanish</label>
              <Input type="date" value={danSana} onChange={e => setDanSana(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tugash</label>
              <Input type="date" value={gachaSana} onChange={e => setGachaSana(e.target.value)} />
            </div>
          </div>
          <Button onClick={yaratish} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            <FileCheck className="w-4 h-4 mr-2" /> {loading ? "Hisoblanmoqda..." : "Akt yaratish"}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold">📋 Akt sverki #{result.akt_id}</h3>
                <p className="text-xs text-muted-foreground">{danSana} — {gachaSana}</p>
              </div>
              <Button variant="outline" size="sm"><Printer className="w-3 h-3 mr-1" /> Chop etish</Button>
            </div>

            {/* Summary table */}
            <div className="divide-y divide-border/60 dark:divide-border">
              {[
                { label: "Boshlang'ich qoldiq", value: result.boshlangich_qoldiq, color: "" },
                { label: "Davr ichidagi sotuvlar", value: result.jami_sotuv, color: "text-blue-600" },
                { label: "Davr ichidagi to'lovlar", value: result.jami_tolov, color: "text-emerald-600" },
                { label: "Qaytarishlar", value: result.jami_qaytarish, color: "text-rose-500 dark:text-rose-400" },
              ].map((row, i) => (
                <div key={i} className="flex justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm font-medium ${row.color}`}>{formatCurrencyFull(N(row.value))}</span>
                </div>
              ))}
              <div className={`flex justify-between px-4 py-4 text-lg font-bold ${
                N(result.yakuniy_qoldiq) > 0 ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-emerald-50 text-emerald-700"
              }`}>
                <span>YAKUNIY QOLDIQ</span>
                <span>{formatCurrencyFull(N(result.yakuniy_qoldiq))}</span>
              </div>
            </div>

            {/* Tafsilotlar */}
            {result.tafsilotlar?.length > 0 && (
              <div className="border-t">
                <div className="px-4 py-2 bg-muted/50 dark:bg-muted text-xs font-semibold text-muted-foreground">
                  SOTUVLAR TAFSILOTI ({result.sotuvlar_soni} ta)
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-muted-foreground text-left">
                    <th className="px-4 py-2">Sana</th><th className="px-4 py-2">Jami</th>
                    <th className="px-4 py-2">To&apos;langan</th><th className="px-4 py-2">Qarz</th>
                  </tr></thead>
                  <tbody>
                    {result.tafsilotlar.map((t: any, i: number) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="px-4 py-2 text-xs">{t.sana ? new Date(t.sana).toLocaleDateString("uz") : "—"}</td>
                        <td className="px-4 py-2">{N(t.jami).toLocaleString()}</td>
                        <td className="px-4 py-2 text-emerald-600">{N(t.tolangan).toLocaleString()}</td>
                        <td className="px-4 py-2 text-rose-500 dark:text-rose-400">{N(t.qarz).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
