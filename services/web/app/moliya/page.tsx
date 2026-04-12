"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, Scale, Droplets, TrendingUp, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

type TabId = "pl" | "bs" | "cf" | "kpi"

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl ${className}`}>
      {children}
    </div>
  )
}

function Row({
  label, value, bold = false, indent = 0, color = "",
}: {
  label: string; value: string | number; bold?: boolean;
  indent?: number; color?: string;
}) {
  return (
    <div
      className={`flex justify-between py-2 px-4 ${bold ? "font-bold border-t-2 border-border" : "border-b border-border/50"}`}
      style={{ paddingLeft: `${16 + indent * 16}px` }}
    >
      <span className={`text-sm ${color || (bold ? "text-foreground" : "text-muted-foreground")}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${color || ""}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  )
}

const N = (v: unknown): number => Number((v as number) ?? 0)

const todayISO    = () => new Date().toISOString().split("T")[0]
const monthAgoISO = () => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]

export default function MoliyaPage() {
  const [tab, setTab] = useState<TabId>("pl")
  const [sanaDan, setSanaDan] = useState(monthAgoISO())
  const [sanaGacha, setSanaGacha] = useState(todayISO())
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
      const base  = process.env.NEXT_PUBLIC_API_URL || ""
      let ep = ""
      if      (tab === "pl")  ep = `/moliya/foyda-zarar?sana_dan=${sanaDan}&sana_gacha=${sanaGacha}`
      else if (tab === "bs")  ep = "/moliya/balans"
      else if (tab === "cf")  ep = `/moliya/pul-oqimi?sana_dan=${sanaDan}&sana_gacha=${sanaGacha}`
      else                    ep = "/moliya/koeffitsientlar"
      const res = await fetch(`${base}${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [tab, sanaDan, sanaGacha])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
    { id: "pl",  label: "Foyda / Zarar",    icon: TrendingUp },
    { id: "bs",  label: "Balans varaq",     icon: Scale },
    { id: "cf",  label: "Pul oqimi",        icon: Droplets },
    { id: "kpi", label: "KPI",              icon: Wallet },
  ]

  type PL = {
    davr?: { dan?: string; gacha?: string }
    daromad?: { jami_sotuv?: number; qaytarish?: number; chegirma?: number; sof_sotuv?: number }
    tannarx?: { jami?: number }
    yalpi_foyda?: { summa?: number; margin_foiz?: number }
    xarajatlar?: { jami?: number; tafsilot?: Record<string, number> }
    sof_foyda?: { summa?: number; margin_foiz?: number; holat?: string }
  }
  const pl  = data as PL
  const bs  = data as Record<string, Record<string, number | boolean> | undefined>
  const cf  = data as Record<string, Record<string, number | string> | undefined>
  const kpi = data as Record<string, number>

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <PageHeader
          icon={Wallet}
          gradient="emerald"
          title="Moliyaviy hisobotlar"
          subtitle="P&L, Balans, Cash Flow, KPI — to'liq moliyaviy tahlil"
        />

        {/* Tabs + date range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {tabs.map(t => (
              <Button
                key={t.id}
                variant={tab === t.id ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(t.id)}
                className="gap-1.5"
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </Button>
            ))}
          </div>
          {(tab === "pl" || tab === "cf") && (
            <div className="flex items-center gap-2 ml-auto">
              <Input type="date" value={sanaDan}   onChange={e => setSanaDan(e.target.value)}   className="w-40" />
              <span className="text-muted-foreground">—</span>
              <Input type="date" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} className="w-40" />
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center p-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Xatolik: {error}
          </div>
        )}

        {!loading && !error && data && tab === "pl" && pl && (
          <Card>
            <div className="p-4 border-b bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl">
              <h2 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Foyda va Zarar hisoboti
              </h2>
              <p className="text-xs text-muted-foreground">
                {pl.davr?.dan || sanaDan} — {pl.davr?.gacha || sanaGacha}
              </p>
            </div>
            <Row label="Jami sotuv"    value={N(pl.daromad?.jami_sotuv)} />
            <Row label="Qaytarishlar"  value={`-${N(pl.daromad?.qaytarish).toLocaleString()}`} indent={1} color="text-red-500" />
            <Row label="Chegirmalar"   value={`-${N(pl.daromad?.chegirma).toLocaleString()}`}  indent={1} color="text-red-500" />
            <Row label="SOF SOTUV"     value={N(pl.daromad?.sof_sotuv)} bold />
            <Row label="Tannarx (COGS)" value={`-${N(pl.tannarx?.jami).toLocaleString()}`} color="text-red-500" />
            <Row label="YALPI FOYDA"    value={N(pl.yalpi_foyda?.summa)} bold />
            <Row label={`Margin: ${pl.yalpi_foyda?.margin_foiz ?? 0}%`} value="" indent={1} color="text-emerald-600" />
            <div className="px-4 py-2 bg-secondary text-xs font-semibold text-muted-foreground">XARAJATLAR</div>
            {pl.xarajatlar?.tafsilot && Object.entries(pl.xarajatlar.tafsilot).map(([k, v]) => (
              <Row key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}
                   value={`-${N(v).toLocaleString()}`} indent={1} color="text-red-400" />
            ))}
            <Row label="Jami xarajat" value={`-${N(pl.xarajatlar?.jami).toLocaleString()}`} bold color="text-red-500" />
            <div className={`flex justify-between p-4 rounded-b-xl text-lg font-bold ${
              pl.sof_foyda?.holat === "foyda"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}>
              <span>SOF FOYDA</span>
              <span>{formatCurrency(N(pl.sof_foyda?.summa))} ({pl.sof_foyda?.margin_foiz ?? 0}%)</span>
            </div>
          </Card>
        )}

        {!loading && !error && data && tab === "bs" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-t-xl border-b">
                <h3 className="font-bold text-emerald-700">AKTIVLAR</h3>
              </div>
              <Row label="Kassa (naqd)"        value={N(bs.aktivlar?.kassa_naqd)} />
              <Row label="Kassa (karta)"       value={N(bs.aktivlar?.kassa_karta)} />
              <Row label="Debitorlar (qarzlar)" value={N(bs.aktivlar?.debitorlar)} />
              <Row label="Ombor qiymati"       value={N(bs.aktivlar?.ombor_qiymat)} />
              <Row label="JAMI AKTIVLAR"       value={N(bs.aktivlar?.jami)} bold />
            </Card>
            <Card>
              <div className="p-3 bg-sky-50 dark:bg-sky-900/10 rounded-t-xl border-b">
                <h3 className="font-bold text-sky-700">PASSIV + KAPITAL</h3>
              </div>
              <Row label="Kreditorlar"             value={N(bs.passivlar?.jami)} />
              <Row label="Taqsimlanmagan foyda"   value={N(bs.kapital?.taqsimlanmagan_foyda)} />
              <div className={`p-3 text-center text-sm font-bold ${
                bs.balans_tekshiruv?.muvozanat
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-red-600 bg-red-50 dark:bg-red-900/20"
              }`}>
                {bs.balans_tekshiruv?.muvozanat ? "✓ Balans muvozanatda" : "⚠ Balans nomuvofiq!"}
              </div>
            </Card>
          </div>
        )}

        {!loading && !error && data && tab === "cf" && (
          <Card>
            <div className="p-4 border-b bg-sky-50 dark:bg-sky-900/10 rounded-t-xl">
              <h2 className="font-bold flex items-center gap-2">
                <Droplets className="w-5 h-5 text-sky-600" />
                Pul oqimi hisoboti
              </h2>
              <p className="text-xs text-muted-foreground">{sanaDan} — {sanaGacha}</p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-xs font-semibold text-emerald-700">KIRIMLAR</div>
            <Row label="Sotuvdan"       value={N(cf.kirim?.sotuvdan)} indent={1} />
            <Row label="Qarz yig'ildi"  value={N(cf.kirim?.qarz_yigildi)} indent={1} />
            <Row label="JAMI KIRIM"     value={N(cf.kirim?.jami)} bold color="text-emerald-600" />
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-xs font-semibold text-red-700">CHIQIMLAR</div>
            <Row label="Tovar xaridi" value={N(cf.chiqim?.tovar_xaridi)} indent={1} />
            <Row label="Xarajatlar"   value={N(cf.chiqim?.xarajatlar)}  indent={1} />
            <Row label="JAMI CHIQIM"  value={N(cf.chiqim?.jami)} bold color="text-red-600" />
            <div className={`p-4 rounded-b-xl text-center text-lg font-bold ${
              cf.sof_pul_oqimi?.holat === "ijobiy"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                : "bg-red-50 dark:bg-red-900/20 text-red-700"
            }`}>
              Sof pul oqimi: {formatCurrency(N(cf.sof_pul_oqimi?.summa))}
            </div>
          </Card>
        )}

        {!loading && !error && data && tab === "kpi" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Gross Margin",            value: `${N(kpi.gross_margin)}%`,    icon: "📊" },
              { label: "Net Margin",              value: `${N(kpi.net_margin)}%`,      icon: "💰" },
              { label: "Inventory Turnover",      value: `${N(kpi.inventory_turnover)}×`, icon: "📦" },
              { label: "Days Sales Outstanding",  value: `${N(kpi.days_sales_outstanding)} kun`, icon: "⏰" },
              { label: "O'rtacha chek",           value: formatCurrency(N(kpi.average_order_value)), icon: "🧾" },
              { label: "Kunlik sotuv",            value: N(kpi.sotuv_soni_kunlik),     icon: "📈" },
              { label: "Faol klientlar",          value: N(kpi.klient_soni),           icon: "👥" },
              { label: "Ombor qiymati",           value: formatCurrency(N(kpi.ombor_qiymati)), icon: "🏭" },
            ].map((s, i) => (
              <Card key={i} className="p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
