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
  {
    id: 1, severity: "critical", category: "client",
    title: "Klient #1389 (Ali Ake Магазин) — sotuv 70% pasaydi",
    description: "Oxirgi 14 kunda zakaz miqdori odatdagidan 4 marta kam. Klient At Risk segmentiga tushdi.",
    detectedAt: "2026-05-02 09:15",
    evidence: "Mart: 8 zakaz · Aprel: 3 zakaz · May: 0 zakaz (oxirgi 7 kun)",
    suggestedAction: "Tezkor qo'ng'iroq qilish, sabab aniqlash, retention promo",
    confidence: 95,
  },
  {
    id: 2, severity: "high", category: "stock",
    title: "Voda Premium 1L — anomal sotuv (3x normal)",
    description: "Bugungi sotuv tarixiy o'rtachadan 3 marta yuqori. Mumkin sabablar: bayram, issiq havo, mahalliy talab.",
    detectedAt: "2026-05-02 11:30",
    evidence: "O'rta/kun: 28 dona · Bugun: 84 dona (12:00 holatida)",
    suggestedAction: "Zaxira tezda tugashi mumkin — qo'shimcha buyurtma berish",
    confidence: 88,
  },
  {
    id: 3, severity: "high", category: "agent",
    title: "Турсунов Ж. — vizit reja 32% bajarildi",
    description: "Plan 144 vizit, fakt 96 vizit. Konversiya past (67%). Muammo borligini ko'rsatadi.",
    detectedAt: "2026-05-02 08:45",
    evidence: "Aprel: 96/144 vizit · konversiya 67% · 4 kun ish yo'q",
    suggestedAction: "Menejer bilan suhbat, mentor, qayta trening",
    confidence: 92,
  },
  {
    id: 4, severity: "medium", category: "finance",
    title: "Logistika xarajati 9% rejadan oshdi",
    description: "Yoqilg'i va remont xarajatlari rejadan 1.08M so'm yuqori. Kuzatish kerak.",
    detectedAt: "2026-05-01 18:00",
    evidence: "Plan: 6.0M · Fakt: 7.08M · sabab: avto remont 53% oshdi",
    suggestedAction: "Avto parkini diagnostika qilish, eski mashinalarni almashtirish",
    confidence: 78,
  },
  {
    id: 5, severity: "medium", category: "sales",
    title: "Bonjur 50g — muddat tugashi yaqin (48 dona)",
    description: "B-2026-04-A partiya 2 kun ichida muddati tugaydi. Yo'qotish riski 216k so'm.",
    detectedAt: "2026-05-02 06:00",
    evidence: "48 dona × 4500 so'm × 100% loss = 216,000 so'm",
    suggestedAction: "Tezkor promo: −40% chegirma · 2 kunda sotish",
    confidence: 99,
  },
  {
    id: 6, severity: "low", category: "client",
    title: "Yangi klient FRESH Маркет — kuchli boshlanish",
    description: "1-haftada 4 zakaz, o'rta zakaz 180k. Bu yaxshi belgi — Champions yo'naltirish strategiyasi.",
    detectedAt: "2026-05-01 12:00",
    evidence: "Birinchi 7 kun: 4 zakaz · 720k tushum · konversiya 100%",
    suggestedAction: "Loyalty programmaga taklif qilish, premium tovar oralig'i",
    confidence: 82,
  },
]

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-rose-100 border-rose-400 text-rose-800",
  high: "bg-orange-100 border-orange-400 text-orange-800",
  medium: "bg-amber-100 border-amber-400 text-amber-800",
  low: "bg-blue-100 border-blue-400 text-blue-800",
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-rose-600" />
              AI Anomaliya Detektori
            </h1>
            <p className="text-sm text-slate-500">Dunyoda yagona AI · {ANOMALIES.length} ta anomaliya · oxirgi 24 soat</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 24-soat</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-rose-50 border-rose-200">
            <div className="text-xs font-bold text-rose-700">🔴 Kritik</div>
            <div className="text-3xl font-bold mt-1">{counts.critical}</div>
            <div className="text-xs text-slate-500 mt-1">darhol e'tibor kerak</div>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="text-xs font-bold text-orange-700">🟠 Yuqori</div>
            <div className="text-3xl font-bold mt-1">{counts.high}</div>
            <div className="text-xs text-slate-500 mt-1">bugun hal qilish</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-xs font-bold text-amber-700">🟡 O'rta</div>
            <div className="text-3xl font-bold mt-1">{counts.medium}</div>
            <div className="text-xs text-slate-500 mt-1">bu hafta</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">🔵 Past</div>
            <div className="text-3xl font-bold mt-1">{counts.low}</div>
            <div className="text-xs text-slate-500 mt-1">kuzatish</div>
          </Card>
        </div>

        <div className="space-y-3">
          {sorted.map(a => {
            const Icon = CATEGORY_ICON[a.category]
            return (
              <Card key={a.id} className={`p-5 border-l-4 ${SEVERITY_COLOR[a.severity]}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${SEVERITY_COLOR[a.severity]}`}>{SEVERITY_LABEL[a.severity]}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 capitalize">{a.category}</span>
                      <span className="text-xs text-slate-500">📅 {a.detectedAt}</span>
                      <span className="text-xs ml-auto text-slate-500">Confidence: <span className="font-mono font-bold">{a.confidence}%</span></span>
                    </div>

                    <h3 className="font-bold text-base">{a.title}</h3>
                    <p className="text-sm text-slate-700 mt-1">{a.description}</p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 mb-1">📊 Dalil (data)</div>
                        <div className="text-sm font-mono">{a.evidence}</div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        <div className="text-xs font-bold text-emerald-700 mb-1">💡 Tavsiya etilgan amal</div>
                        <div className="text-sm">{a.suggestedAction}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="gap-1">Bajar</Button>
                      <Button size="sm" variant="outline">Ko'rib chiqish</Button>
                      <Button size="sm" variant="outline">Pop</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-5 bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-rose-800">Qanday ishlaydi?</h3>
              <p className="text-sm text-slate-700 mt-1">
                AI har 5 daqiqada barcha sotuv, sklad, klient va xarajat ma'lumotlarini tahlil qiladi.
                Tarixiy ma'lumotdan farqlanadigan har qanday paternni topib, sevirityni avtomatik aniqlaydi.
                <span className="font-bold"> SalesDoc va boshqa CRM'larda bunday funksiyasi yo'q</span> — bu SavdoAI'ning eksklyuziv AI ficha.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
