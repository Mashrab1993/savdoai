"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { Loader2, Printer } from "lucide-react"

type SavdoDetail = {
  id: number
  klient_ismi?: string
  klient_telefon?: string
  klient_manzil?: string
  jami: number
  tolangan?: number
  qarz?: number
  sana: string
  izoh?: string
  tovarlar?: Array<{
    tovar_nomi: string
    miqdor: number
    birlik?: string
    sotish_narxi: number
    jami: number
  }>
}

type Me = { id: number; ism?: string; to_liq_ism?: string; dokon_nomi?: string; telefon?: string }

function fmt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n)
}

export default function PrintClient() {
  const params = useSearchParams()
  const idsParam = params.get("ids") || ""
  const ids = idsParam.split(",").filter(s => /^\d+$/.test(s)).map(Number)
  const [orders, setOrders] = useState<SavdoDetail[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const meResp = await api.get<Me>("/api/v1/me")
        setMe(meResp)
        const results = await Promise.all(
          ids.map(id => api.get<SavdoDetail>(`/api/v1/savdo/${id}`))
        )
        setOrders(results)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    if (ids.length > 0) load()
    else setLoading(false)
  }, [idsParam])

  useEffect(() => {
    // Auto-print when loaded (with small delay for layout)
    if (!loading && orders.length > 0) {
      const t = setTimeout(() => window.print(), 800)
      return () => clearTimeout(t)
    }
  }, [loading, orders])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Yuklanmoqda...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Xato: {error}
      </div>
    )
  }

  if (ids.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Zakaz tanlanmagan. URL'da ?ids=1,2,3 parametri kerak.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
        }
        body { font-family: 'Segoe UI', Arial, sans-serif; }
      `}</style>

      <div className="no-print mb-4 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 text-white rounded flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Pechat
        </button>
        <span className="text-sm text-slate-500">{orders.length} ta zakaz tayyor — pechat tugmasini bosing</span>
      </div>

      {orders.map(o => (
        <div key={o.id} className="print-page max-w-3xl mx-auto mb-12 border-2 border-slate-300 p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {me?.dokon_nomi || me?.to_liq_ism || me?.ism || "SavdoAI"}
              </div>
              <h1 className="text-2xl font-bold">Buyurtma #{o.id}</h1>
            </div>
            <div className="text-right text-sm">
              <div>Sana: <strong>{new Date(o.sana).toLocaleDateString("uz-UZ")}</strong></div>
              <div>Vaqt: {new Date(o.sana).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <div className="text-slate-500 text-xs uppercase">Klient</div>
              <div className="font-medium">{o.klient_ismi || "—"}</div>
              {o.klient_telefon && <div>{o.klient_telefon}</div>}
              {o.klient_manzil && <div className="text-slate-600">{o.klient_manzil}</div>}
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-xs uppercase">Jami</div>
              <div className="text-3xl font-bold text-emerald-700">{fmt(Number(o.jami || 0))} so'm</div>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left">№</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Tovar</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Miqdor</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Narx</th>
                <th className="border border-slate-300 px-3 py-2 text-right">Summa</th>
              </tr>
            </thead>
            <tbody>
              {(o.tovarlar || []).map((t, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 px-3 py-2">{i + 1}</td>
                  <td className="border border-slate-300 px-3 py-2">{t.tovar_nomi}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {fmt(Number(t.miqdor))} {t.birlik || ""}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                    {fmt(Number(t.sotish_narxi || 0))}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right tabular-nums font-medium">
                    {fmt(Number(t.jami || 0))}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 px-3 py-2" colSpan={4}>JAMI:</td>
                <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                  {fmt(Number(o.jami || 0))}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-4 text-sm border-t pt-3">
            <div>
              <div className="text-slate-500 text-xs uppercase">To'langan</div>
              <div className="font-medium text-emerald-700">{fmt(Number(o.tolangan || 0))} so'm</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs uppercase">Qarz</div>
              <div className={`font-medium ${(o.qarz ?? 0) > 0 ? "text-rose-600" : "text-slate-500"}`}>
                {fmt(Number(o.qarz || 0))} so'm
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-xs uppercase">Imzo</div>
              <div className="border-b border-slate-400 h-6 mt-2"></div>
            </div>
          </div>

          {o.izoh && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 text-xs">
              <strong>Izoh:</strong> {o.izoh}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
