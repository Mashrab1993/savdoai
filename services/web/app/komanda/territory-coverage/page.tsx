"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Users, Package, Calendar, Download } from "lucide-react"
import Link from "next/link"

type Territory = {
  id: number; name: string; agent: string; clientsTotal: number; clientsActive: number;
  visitsPlanned: number; visitsActual: number; revenue: number; coverage: number;
}

const TERRITORIES: Territory[] = [
  { id: 1, name: "Toshkent — Yashnobod", agent: "Babadjanova N.", clientsTotal: 84, clientsActive: 62, visitsPlanned: 248, visitsActual: 218, revenue: 28_400_000, coverage: 88 },
  { id: 2, name: "Toshkent — Sergeli", agent: "Berdiyev R.", clientsTotal: 72, clientsActive: 58, visitsPlanned: 216, visitsActual: 192, revenue: 24_800_000, coverage: 81 },
  { id: 3, name: "Toshkent — Bektemir", agent: "ДАВЛАТ", clientsTotal: 96, clientsActive: 78, visitsPlanned: 288, visitsActual: 248, revenue: 31_200_000, coverage: 81 },
  { id: 4, name: "Toshkent — Mirzo Ulug'bek", agent: "BORIEV M.", clientsTotal: 102, clientsActive: 84, visitsPlanned: 306, visitsActual: 248, revenue: 36_400_000, coverage: 82 },
  { id: 5, name: "Toshkent — Yunusobod", agent: "Турсунов Ж.", clientsTotal: 48, clientsActive: 32, visitsPlanned: 144, visitsActual: 96, revenue: 14_800_000, coverage: 67 },
  { id: 6, name: "Sirdaryo — Yangiyer", agent: "Sayitqulov M.", clientsTotal: 36, clientsActive: 28, visitsPlanned: 108, visitsActual: 84, revenue: 11_200_000, coverage: 78 },
  { id: 7, name: "Samarqand — Markaziy", agent: "Aminov R.", clientsTotal: 58, clientsActive: 42, visitsPlanned: 174, visitsActual: 128, revenue: 18_400_000, coverage: 74 },
  { id: 8, name: "Andijon — Markaziy", agent: "Karimov F.", clientsTotal: 32, clientsActive: 18, visitsPlanned: 96, visitsActual: 56, revenue: 7_800_000, coverage: 56 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function TerritoryCoveragePage() {
  const totalClients = TERRITORIES.reduce((s, t) => s + t.clientsTotal, 0)
  const activeClients = TERRITORIES.reduce((s, t) => s + t.clientsActive, 0)
  const totalRevenue = TERRITORIES.reduce((s, t) => s + t.revenue, 0)
  const avgCoverage = Math.round(TERRITORIES.reduce((s, t) => s + t.coverage, 0) / TERRITORIES.length)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Hudud qoplash (Territory coverage)</h1>
            <p className="text-sm text-slate-500">Hududlar bo'yicha klient qoplash va savdo ko'rsatkichlari</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <MapPin className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Hududlar</div>
            <div className="text-2xl font-bold mt-1">{TERRITORIES.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Klientlar</div>
            <div className="text-2xl font-bold mt-1">{fmt(activeClients)}<span className="text-base text-slate-500">/{fmt(totalClients)}</span></div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Package className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Tushum</div>
            <div className="text-2xl font-bold mt-1">{fmt(totalRevenue / 1_000_000)} M</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <MapPin className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">O'rtacha qoplash</div>
            <div className="text-2xl font-bold mt-1">{avgCoverage}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Hududlar bo'yicha taqsimot</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Hudud</th>
                  <th className="py-3 px-2">Agent</th>
                  <th className="py-3 px-2 text-right">Klientlar</th>
                  <th className="py-3 px-2 text-right">Aktiv</th>
                  <th className="py-3 px-2 text-right">Vizit (reja/fakt)</th>
                  <th className="py-3 px-2 text-right">Tushum</th>
                  <th className="py-3 px-2">Qoplash</th>
                </tr>
              </thead>
              <tbody>
                {TERRITORIES.sort((a, b) => b.coverage - a.coverage).map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {t.name}
                    </td>
                    <td className="py-3 px-2">{t.agent}</td>
                    <td className="py-3 px-2 text-right font-mono">{t.clientsTotal}</td>
                    <td className="py-3 px-2 text-right font-mono text-emerald-700 font-bold">{t.clientsActive}</td>
                    <td className="py-3 px-2 text-right font-mono text-xs">{t.visitsPlanned} / <span className="font-bold">{t.visitsActual}</span></td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-violet-700">{fmt(t.revenue)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden min-w-[80px]">
                          <div className={`h-full ${t.coverage >= 80 ? "bg-emerald-500" : t.coverage >= 65 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${t.coverage}%` }} />
                        </div>
                        <span className={`text-xs font-bold font-mono w-10 text-right ${t.coverage >= 80 ? "text-emerald-700" : t.coverage >= 65 ? "text-amber-700" : "text-rose-700"}`}>{t.coverage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Coverage heatmap (bar chart)</h2>
          <div className="space-y-2">
            {TERRITORIES.sort((a, b) => b.revenue - a.revenue).map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="w-48 text-sm text-slate-600 truncate">{t.name}</span>
                <div className="flex-1 h-7 bg-slate-100 rounded relative">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded flex items-center justify-end pr-2"
                    style={{ width: `${(t.revenue / 36_400_000) * 100}%` }}>
                    <span className="text-xs text-white font-bold">{fmt(t.revenue / 1_000_000)} M</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-16 text-right">{t.clientsActive} klient</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
