"use client"
import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, CheckCircle2, User, Phone, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/format"

const KUNLAR = ["Du", "Se", "Chor", "Pay", "Ju", "Sha", "Yak"]
const KUNLAR_FULL = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]

export default function CalendarPage() {
  const [bugun, setBugun] = useState<any>(null)
  const [hafta, setHafta] = useState<any>(null)
  const [tab, setTab] = useState<"bugun" | "hafta">("bugun")
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || ""
  const h = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/kalendar/bugun`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/kalendar/hafta`, { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([b, h]) => { setBugun(b); setHafta(h) }).finally(() => setLoading(false))
  }, [])

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <AdminLayout title="📅 Tashrif kalendari">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant={tab === "bugun" ? "default" : "outline"} onClick={() => setTab("bugun")}
            className={tab === "bugun" ? "bg-emerald-600" : ""}>📍 Bugun</Button>
          <Button variant={tab === "hafta" ? "default" : "outline"} onClick={() => setTab("hafta")}
            className={tab === "hafta" ? "bg-emerald-600" : ""}>📅 Hafta</Button>
        </div>

        {tab === "bugun" && bugun && (
          <>
            {/* Stats */}
            <div className="flex gap-3">
              <div className="bg-card rounded-xl border px-4 py-3 text-center flex-1">
                <div className="text-xl font-bold">{bugun.jami}</div>
                <div className="text-[10px] text-muted-foreground">Jami klient</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 px-4 py-3 text-center flex-1">
                <div className="text-xl font-bold text-emerald-600">{bugun.checkin_qilindi}</div>
                <div className="text-[10px] text-emerald-600">Check-in ✅</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 px-4 py-3 text-center flex-1">
                <div className="text-xl font-bold text-amber-600">{bugun.jami - bugun.checkin_qilindi}</div>
                <div className="text-[10px] text-amber-600">Kutilmoqda ⏳</div>
              </div>
            </div>

            {/* Client list */}
            <div className="space-y-2">
              {(bugun.klientlar || []).map((k: any, i: number) => (
                <div key={i} className={`bg-card rounded-xl border p-4 ${
                  k.checkin_qilindi ? "border-emerald-200 bg-emerald-50/30" : ""
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        k.checkin_qilindi ? "bg-emerald-500/15" : "bg-blue-500/15"
                      }`}>
                        {k.checkin_qilindi
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          : <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                        }
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{(k.nom || k.ism || "") || k.ism || k.klient_nomi || k.klient_ismi}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {k.telefon && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{k.telefon}</span>}
                          {k.manzil && <span>{k.manzil}</span>}
                        </div>
                      </div>
                    </div>
                    {Number(k.qarz) > 0 && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatCurrency(Number(k.qarz))}</div>
                        <div className="text-[9px] text-rose-500 dark:text-rose-400">qarz</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!bugun.klientlar?.length) && (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  Bugun uchun tashrif jadvali yo&apos;q
                </div>
              )}
            </div>
          </>
        )}

        {tab === "hafta" && hafta && (
          <div className="grid grid-cols-7 gap-2">
            {(hafta.hafta || []).map((h: any, i: number) => (
              <div key={i} className={`bg-card rounded-xl border p-3 text-center ${
                i === todayIdx ? "ring-2 ring-emerald-500 border-emerald-500/40" : ""
              }`}>
                <div className={`text-xs font-bold mb-2 ${i === todayIdx ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {KUNLAR[i]}
                </div>
                <div className={`text-2xl font-bold mb-1 ${h.klient_soni > 0 ? "text-blue-600" : "text-muted-foreground/50"}`}>
                  {h.klient_soni}
                </div>
                <div className="text-[9px] text-muted-foreground">klient</div>
                {h.klientlar?.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {h.klientlar.slice(0, 3).map((n: string, j: number) => (
                      <div key={j} className="text-[9px] text-muted-foreground truncate">{n}</div>
                    ))}
                    {h.klientlar.length > 3 && (
                      <div className="text-[9px] text-muted-foreground">+{h.klientlar.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
