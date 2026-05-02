"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, Eye, TrendingDown, Bug, Calendar, Download, Sparkles } from "lucide-react"
import Link from "next/link"

type Anomaly = {
  id: number; severity: "critical" | "high" | "medium" | "low";
  category: "sales" | "stock" | "client" | "agent" | "finance";
  title: string; description: string; detectedAt: string;
  evidence: string; suggestedAction: string;
  confidence: number;
}

const ANOMALIES: Anomaly[] = [
  { id: 1, severity: "critical", category: "client", title: "Klient #1389 (Ali Ake Магазин) — sotuv 70% pasaydi", description: "Oxirgi 14 kunda zakaz miqdori odatdagidan 4 marta kam. Klient At Risk segmentiga tushdi.", detectedAt: "2026-05-02 09:15", evidence: "Mart: 8 zakaz · Aprel: 3 zakaz · May: 0 zakaz (oxirgi 7 kun)", suggestedAction: "Tezkor qo'ng'iroq qilish, sabab aniqlash, retention promo", confidence: 95 },
  { id: 2, severity: "high", category: "stock", title: "Voda Premium 1L — anomal sotuv (3x normal)", description: "Bugungi sotuv tarixiy o'rtachadan 3 marta yuqori. Mumkin sabablar: bayram, issiq havo, mahalliy talab.", detectedAt: "2026-05-02 11:30", evidence: "O'rta/kun: 28 dona · Bugun: 84 dona (12:00 holatida)", suggestedAction: "Zaxira tezda tugashi mumkin — qo'shimcha buyurtma berish", confidence: 88 },
  { id: 3, severity: "high", category: "agent", title: "Турсунов Ж. — vizit reja 32% bajarildi", description: "Plan 144 vizit, fakt 96 vizit. Konversiya past (67%). Muammo borligini ko'rsatadi.", detectedAt: "2026-05-02 08:45", evidence: "Aprel: 96/144 vizit · konversiya 67% · 4 kun ish yo'q", suggestedAction: "Menejer bilan suhbat, mentor, qayta trening", confidence: 92 },
  { id: 4, severity: "medium", category: "finance", title: "Logistika xarajati 9% rejadan oshdi", description: "Yoqilg'i va remont xarajatlari rejadan 1.08M so'm yuqori. Kuzatish kerak.", detectedAt: "2026-05-01 18:00", evidence: "Plan: 6.0M · Fakt: 7.08M · sabab: avto remont 53% oshdi", suggestedAction: "Avto parkini diagnostika qilish, eski mashinalarni almashtirish", confidence: 78 },
  { id: 5, severity: "medium", category: "sales", title: "Bonjur 50g — muddat tugashi yaqin (48 dona)", description: "B-2026-04-A partiya 2 kun ichida muddati tugaydi. Yo'qotish riski 216k so'm.", detectedAt: "2026-05-02 06:00", evidence: "48 dona × 4500 so'm × 100% loss = 216,000 so'm", suggestedAction: "Tezkor promo: −40% chegirma · 2 kunda sotish", confidence: 99 },
  { id: 6, severity: "low", category: "client", title: "Yangi klient FRESH Маркет — kuchli boshlanish", description: "1-haftada 4 zakaz, o'rta zakaz 180k. Bu yaxshi belgi — Champions yo'naltirish strategiyasi.", detectedAt: "2026-05-01 12:00", evidence: "Birinchi 7 kun: 4 zakaz · 720k tushum · konversiya 100%", suggestedAction: "Loyalty programmaga taklif qilish, premium tovar oralig'i", confidence: 82 },
]

const SEVERITY_ACCENT: Record<string, string> = {
  critical: "#C75D3C",
  high: "#D97706",
  medium: "#EAB308",
  low: "#3B82F6",
}
const SEVERITY_BG: Record<string, string> = {
  critical: "bg-[#F5E5D6] text-[#C75D3C]",
  high: "bg-[#FCE9DD] text-[#D97706]",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-blue-50 text-blue-700",
}
const SEVERITY_LABEL: Record<string, string> = {
  critical: "🔴 Kritik",
  high: "🟠 Yuqori",
  medium: "🟡 O'rta",
  low: "🔵 Past",
}
const CATEGORY_ICON: Record<string, any> = {
  sales: TrendingDown, stock: Bug, client: Eye, agent: AlertTriangle, finance: AlertTriangle,
}

export default function AnomalyDetectorPage() {
  const sorted = [...ANOMALIES].sort((a, b) => {
    const order = ["critical", "high", "medium", "low"]
    return order.indexOf(a.severity) - order.indexOf(b.severity)
  })

  const counts = {
    critical: ANOMALIES.filter(a => a.severity === "critical").length,
    high: ANOMALIES.filter(a => a.severity === "high").length,
    medium: ANOMALIES.filter(a => a.severity === "medium").length,
    low: ANOMALIES.filter(a => a.severity === "low").length,
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/dashboard" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AI</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-3" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                <Sparkles className="w-8 h-8 text-[#C75D3C]" />
                AI Anomaliya <span className="italic text-[#C75D3C]">Detektori</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Dunyoda yagona AI · {ANOMALIES.length} ta anomaliya · oxirgi 24 soat</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Calendar className="w-4 h-4" /> 24-soat</Button>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Excel</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SeverityCard label="🔴 Kritik" count={counts.critical} sub="darhol e'tibor kerak" accent={SEVERITY_ACCENT.critical} />
            <SeverityCard label="🟠 Yuqori" count={counts.high} sub="bugun hal qilish" accent={SEVERITY_ACCENT.high} />
            <SeverityCard label="🟡 O'rta" count={counts.medium} sub="bu hafta" accent={SEVERITY_ACCENT.medium} />
            <SeverityCard label="🔵 Past" count={counts.low} sub="kuzatish" accent={SEVERITY_ACCENT.low} />
          </div>

          <div className="space-y-3">
            {sorted.map(a => {
              const Icon = CATEGORY_ICON[a.category]
              const accent = SEVERITY_ACCENT[a.severity]
              return (
                <Card key={a.id} className="p-5 bg-white border-l-4 border border-[#E8E0D3] shadow-sm rounded-2xl" style={{ borderLeftColor: accent, borderLeftWidth: '4px' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: accent }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_BG[a.severity]}`}>{SEVERITY_LABEL[a.severity]}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D] capitalize">{a.category}</span>
                        <span className="text-xs text-[#9C8A6E]">📅 {a.detectedAt}</span>
                        <span className="text-xs ml-auto text-[#9C8A6E]">Confidence: <span className="font-mono font-medium text-[#1A1A1A]">{a.confidence}%</span></span>
                      </div>

                      <h3 className="font-medium text-base text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{a.title}</h3>
                      <p className="text-sm text-[#6B5B4D] mt-1">{a.description}</p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D3]">
                          <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1">📊 Dalil (data)</div>
                          <div className="text-sm font-mono text-[#1A1A1A]">{a.evidence}</div>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                          <div className="text-xs uppercase tracking-wider text-emerald-700 font-medium mb-1">💡 Tavsiya etilgan amal</div>
                          <div className="text-sm text-[#1A1A1A]">{a.suggestedAction}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="gap-1" style={{ background: "#C75D3C" }}>Bajar</Button>
                        <Button size="sm" variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">Ko'rib chiqish</Button>
                        <Button size="sm" variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">Pop</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-6 bg-white border-2 border-[#C75D3C]/30 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE9DD] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#C75D3C]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#C75D3C] font-medium">QANDAY ISHLAYDI</div>
                <h3 className="text-xl font-light text-[#1A1A1A] mt-1" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Anomaliya Detektori</h3>
                <p className="text-sm text-[#6B5B4D] mt-2 leading-relaxed">
                  AI har 5 daqiqada barcha sotuv, sklad, klient va xarajat ma'lumotlarini tahlil qiladi.
                  Tarixiy ma'lumotdan farqlanadigan har qanday paternni topib, sevirityni avtomatik aniqlaydi.
                  <span className="font-medium text-[#C75D3C]"> SalesDoc va boshqa CRM'larda bunday funksiyasi yo'q</span> — bu SavdoAI'ning eksklyuziv AI ficha.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function SeverityCard({ label, count, sub, accent }: { label: string; count: number; sub: string; accent: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <div className="text-xs font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-3xl font-medium tabular-nums mt-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{count}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">{sub}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
