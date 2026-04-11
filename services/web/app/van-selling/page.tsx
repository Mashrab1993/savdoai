"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Truck, MapPin, Package, CheckCircle2, Clock, Plus, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function VanSellingPage() {
  const [marshrutlar, setMarshrutlar] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  useEffect(() => {
    fetch(`${API}/van/marshrutlar`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setMarshrutlar).finally(() => setLoading(false))
  }, [])

  const loadDetail = async (id: number) => {
    const res = await fetch(`${API}/van/marshrut/${id}`, { headers: h })
    if (res.ok) setSelected(await res.json())
  }

  const yakunlash = async (id: number) => {
    await fetch(`${API}/van/marshrut/${id}/yakunlash`, { method: "POST", headers: h })
    setSelected(null)
    // Refresh
    const res = await fetch(`${API}/van/marshrutlar`, { headers: h })
    if (res.ok) setMarshrutlar(await res.json())
  }

  const holatRang = (holat: string) => ({
    tayyorlangan: "bg-gray-100 text-gray-700",
    yuklangan: "bg-blue-100 text-blue-700",
    yolda: "bg-amber-100 text-amber-700",
    yakunlandi: "bg-emerald-100 text-emerald-700",
  }[holat] || "bg-gray-100 text-gray-700")

  return (
    <AdminLayout title="🚛 Van Selling">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Yetkazib berish marshrutlarini boshqaring</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi marshrut
          </Button>
        </div>

        {selected ? (
          /* Marshrut detail */
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelected(null)} className="text-xs">← Orqaga</Button>

            <div className="bg-white dark:bg-gray-900 rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    Marshrut #{selected.marshrut?.id}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selected.marshrut?.sana} • {selected.marshrut?.mashina_raqami} • {selected.marshrut?.haydovchi}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${holatRang(selected.marshrut?.holat)}`}>
                  {selected.marshrut?.holat}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold">{formatCurrency(Number(selected.marshrut?.jami_summa || 0))}</div>
                  <div className="text-[10px] text-gray-500">Jami yuklangan</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                  <div className="text-lg font-bold text-emerald-600">{formatCurrency(Number(selected.marshrut?.yetkazilgan_summa || 0))}</div>
                  <div className="text-[10px] text-emerald-600">Yetkazildi</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(Number(selected.marshrut?.qaytarilgan_summa || 0))}</div>
                  <div className="text-[10px] text-red-600">Qaytarildi</div>
                </div>
              </div>

              {/* Yetkazish nuqtalari */}
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Yetkazish nuqtalari ({selected.statistika?.jami_nuqtalar || 0})
              </h3>
              <div className="space-y-2">
                {(selected.yetkazish_nuqtalari || []).map((n: any, i: number) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    n.holat === "yetkazildi" ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"
                  }`}>
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {n.tartib_raqami}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{n.klient_nomi || `Klient #${n.klient_id}`}</div>
                      <div className="text-xs text-gray-500">
                        {n.holat === "yetkazildi" ? `✅ ${formatCurrency(Number(n.yetkazilgan_summa || 0))}` : "⏳ Kutilmoqda"}
                      </div>
                    </div>
                    {n.holat === "yetkazildi" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                ))}
              </div>

              {selected.marshrut?.holat !== "yakunlandi" && (
                <Button onClick={() => yakunlash(selected.marshrut.id)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  🏁 Marshrutni yakunlash
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Marshrutlar ro'yxati */
          <div className="space-y-3">
            {marshrutlar.map((m: any) => (
              <div key={m.id} onClick={() => loadDetail(m.id)}
                className="bg-white dark:bg-gray-900 rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Marshrut #{m.id}</div>
                      <div className="text-xs text-gray-500">{m.sana} • {m.mashina_raqami || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${holatRang(m.holat)}`}>
                      {m.holat}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>💰 {formatCurrency(Number(m.jami_summa || 0))}</span>
                  <span>✅ {formatCurrency(Number(m.yetkazilgan_summa || 0))}</span>
                </div>
              </div>
            ))}
            {marshrutlar.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-400">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Hali marshrutlar yo&apos;q</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
