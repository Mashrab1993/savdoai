"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Building2, Plus, Package, MapPin, Phone, Star } from "lucide-react"

export default function FilialPage() {
  const [filiallar, setFiliallar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ nomi: "", manzil: "", telefon: "", turi: "dokon", bosh_filial: false })
  const [selectedFilial, setSelectedFilial] = useState<any>(null)
  const [qoldiqlar, setQoldiqlar] = useState<any[]>([])

  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  useEffect(() => {
    fetch(`${API}/api/filial`, { headers: h }).then(r => r.ok ? r.json() : []).then(setFiliallar).finally(() => setLoading(false))
  }, [])

  const create = async () => {
    const res = await fetch(`${API}/api/filial`, { method: "POST", headers: h, body: JSON.stringify(form) })
    if (res.ok) {
      const d = await res.json()
      setFiliallar(p => [...p, { id: d.id, ...form }])
      setShowCreate(false)
    }
  }

  const loadQoldiq = async (fid: number) => {
    setSelectedFilial(filiallar.find(f => f.id === fid))
    const res = await fetch(`${API}/api/filial/${fid}/qoldiq`, { headers: h })
    if (res.ok) setQoldiqlar(await res.json())
  }

  const turiEmoji: Record<string, string> = { dokon: "🏪", ombor: "🏭", ofis: "🏢" }

  return (
    <AdminLayout title="🏢 Filiallar">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Smartup multi-filial analogi — ko&apos;p filial boshqaruvi</p>
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi filial
          </Button>
        </div>

        {selectedFilial ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedFilial(null)}>← Orqaga</Button>
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{turiEmoji[selectedFilial.turi] || "🏪"}</span>
                <div>
                  <h2 className="text-lg font-bold">{selectedFilial.nomi}</h2>
                  <p className="text-xs text-gray-500">{selectedFilial.manzil} • {selectedFilial.telefon}</p>
                </div>
                {selectedFilial.bosh_filial && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">⭐ Bosh filial</span>}
              </div>

              <h3 className="text-sm font-semibold mb-2">📦 Ombor qoldiqlari ({qoldiqlar.length} tovar)</h3>
              {qoldiqlar.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-xs text-gray-500 text-left bg-gray-50 dark:bg-gray-800">
                      <th className="px-3 py-2">Tovar</th><th className="px-3 py-2 text-right">Qoldiq</th><th className="px-3 py-2 text-right">Min</th>
                    </tr></thead>
                    <tbody>
                      {qoldiqlar.map((q: any, i: number) => (
                        <tr key={i} className="border-t border-gray-50">
                          <td className="px-3 py-2">{q.tovar_nomi}</td>
                          <td className={`px-3 py-2 text-right font-medium ${Number(q.qoldiq) <= Number(q.min_qoldiq) ? "text-red-600" : ""}`}>{q.qoldiq}</td>
                          <td className="px-3 py-2 text-right text-gray-400">{q.min_qoldiq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-gray-400 py-4 text-center">Qoldiq ma&apos;lumotlari yo&apos;q</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filiallar.map(f => (
              <div key={f.id} onClick={() => loadQoldiq(f.id)}
                className="bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{turiEmoji[f.turi] || "🏪"}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold flex items-center gap-1">
                      {f.nomi} {f.bosh_filial && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-xs text-gray-500">{f.manzil || "—"}</div>
                  </div>
                </div>
                {f.telefon && <div className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {f.telefon}</div>}
              </div>
            ))}
            {filiallar.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Filiallar yo&apos;q — birinchisini qo&apos;shing</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi filial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Filial nomi" value={form.nomi} onChange={e => setForm(p => ({ ...p, nomi: e.target.value }))} />
            <Input placeholder="Manzil" value={form.manzil} onChange={e => setForm(p => ({ ...p, manzil: e.target.value }))} />
            <Input placeholder="Telefon" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <DialogFooter><Button onClick={create} disabled={!form.nomi} className="bg-emerald-600">Yaratish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
