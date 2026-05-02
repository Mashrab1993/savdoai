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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Hudud <span className="italic text-[#C75D3C]">qoplash</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Hududlar bo'yicha klient qoplash va savdo ko'rsatkichlari</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> апр 1 — май 2</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={MapPin} accent="#10B981" label="Hududlar" value={TERRITORIES.length.toString()} />
            <KpiCard icon={Users} accent="#3B82F6" label="Klientlar" value={`${fmt(activeClients)}/${fmt(totalClients)}`} />
            <KpiCard icon={Package} accent="#7C3AED" label="Tushum" value={`${fmt(totalRevenue / 1_000_000)} M`} />
            <KpiCard icon={MapPin} accent="#D97706" label="O'rtacha qoplash" value={`${avgCoverage}%`} />
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Hududlar bo'yicha taqsimot</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Hudud</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klientlar</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Aktiv</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Vizit (reja/fakt)</th>
                    <th className="py-3 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tushum</th>
                    <th className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Qoplash</th>
                  </tr>
                </thead>
                <tbody>
                  {TERRITORIES.sort((a, b) => b.coverage - a.coverage).map(t => (
                    <tr key={t.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 font-medium text-[#1A1A1A] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#C75D3C]" />
                        {t.name}
                      </td>
                      <td className="py-3 px-2 text-[#6B5B4D]">{t.agent}</td>
                      <td className="py-3 px-2 text-right font-mono text-[#1A1A1A]">{t.clientsTotal}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-700 font-medium">{t.clientsActive}</td>
                      <td className="py-3 px-2 text-right font-mono text-xs text-[#6B5B4D]">{t.visitsPlanned} / <span className="font-medium text-[#1A1A1A]">{t.visitsActual}</span></td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-[#C75D3C]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{fmt(t.revenue)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#F0EAE0] rounded-full overflow-hidden min-w-[80px]">
                            <div className="h-full rounded-full" style={{ width: `${t.coverage}%`, background: t.coverage >= 80 ? "#10B981" : t.coverage >= 65 ? "#D97706" : "#C75D3C" }} />
                          </div>
                          <span className={`text-xs font-medium font-mono w-10 text-right ${t.coverage >= 80 ? "text-emerald-700" : t.coverage >= 65 ? "text-[#D97706]" : "text-[#C75D3C]"}`}>{t.coverage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <h2 className="text-xl font-light mb-5 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Coverage heatmap</h2>
            <div className="space-y-2">
              {TERRITORIES.sort((a, b) => b.revenue - a.revenue).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-48 text-sm text-[#6B5B4D] truncate">{t.name}</span>
                  <div className="flex-1 h-7 bg-[#F0EAE0] rounded-md relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(t.revenue / 36_400_000) * 100}%`, background: "linear-gradient(90deg, #C75D3C 0%, #E27B5C 100%)" }}>
                      <span className="text-xs text-white font-medium tabular-nums">{fmt(t.revenue / 1_000_000)} M</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#9C8A6E] w-16 text-right">{t.clientsActive} klient</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({ icon: Icon, accent, label, value }: { icon: React.ElementType; accent: string; label: string; value: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
