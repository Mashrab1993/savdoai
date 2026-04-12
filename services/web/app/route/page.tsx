"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Navigation, MapPin, Clock, Fuel, CheckCircle2, Route } from "lucide-react"

export default function RoutePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [myLocation, setMyLocation] = useState<{ lat: number; lon: number } | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  // GPS olish
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setMyLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: true }
      )
    }
  }, [])

  const optimize = async () => {
    setLoading(true)
    try {
      const body: any = { klient_idlar: [] }
      if (myLocation) {
        body.boshlangich_lat = myLocation.lat
        body.boshlangich_lon = myLocation.lon
      }
      const res = await fetch(`${API}/marshrut/optimallashtir`, { method: "POST", headers: h, body: JSON.stringify(body) })
      if (res.ok) setResult(await res.json())
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout title="🗺️ Marshrut">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">TSP algoritm — eng qisqa yo&apos;lni toping</p>
          </div>
          <Button onClick={optimize} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <Route className="w-4 h-4 mr-2" /> {loading ? "Hisoblanmoqda..." : "Optimallashtirish"}
          </Button>
        </div>

        {result?.xato && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">{result.xato}</div>
        )}

        {result?.optimal_tartib && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{result.jami_masofa_km} km</div>
                <div className="text-[10px] text-muted-foreground">Optimal masofa</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">-{result.tejaldi_km} km</div>
                <div className="text-[10px] text-emerald-600">{result.tejaldi_foiz}% tejaldi</div>
              </div>
              <div className="bg-card rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold">{result.taxminiy_vaqt_daqiqa} min</div>
                <div className="text-[10px] text-muted-foreground">Taxminiy vaqt</div>
              </div>
              <div className="bg-card rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold">{result.klientlar_soni}</div>
                <div className="text-[10px] text-muted-foreground">Klient</div>
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-card rounded-xl border p-4">
              <h3 className="text-sm font-semibold mb-3">📊 Solishtirish</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Oddiy tartibda</div>
                  <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <div className="text-xs text-red-600 mt-0.5">{result.oddiy_masofa_km} km</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Optimal tartibda</div>
                  <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(result.jami_masofa_km / result.oddiy_masofa_km) * 100}%` }} />
                  </div>
                  <div className="text-xs text-emerald-600 mt-0.5">{result.jami_masofa_km} km</div>
                </div>
              </div>
            </div>

            {/* Route steps */}
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-muted/50 dark:bg-muted">
                <h3 className="text-sm font-semibold">📍 Optimal marshrut</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {result.optimal_tartib.map((n: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"
                    }`}>{n.tartib}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{n.nom}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {n.manzil || `${n.lat.toFixed(4)}, ${n.lon.toFixed(4)}`}
                      </div>
                    </div>
                    {n.masofa_km > 0 && (
                      <span className="text-xs text-muted-foreground">{n.masofa_km} km</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!result && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <Navigation className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm">&quot;Optimallashtirish&quot; tugmasini bosing</p>
            <p className="text-xs mt-1">GPS li klientlar orasida eng qisqa yo&apos;l hisoblanadi</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
