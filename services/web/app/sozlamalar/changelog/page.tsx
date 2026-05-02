"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, GitCommit, Sparkles, Bug, Zap, Shield, FileText } from "lucide-react"
import Link from "next/link"

type Release = {
  version: string; date: string; status: "current" | "stable" | "beta";
  feature: string[]; improvement: string[]; bugfix: string[]; security: string[];
}

const RELEASES: Release[] = [
  {
    version: "v26.4", date: "2026-05-02", status: "current",
    feature: [
      "200+ sahifa autonomous rejimda qurildi",
      "6 ta dunyoda yagona AI ficha (Copilot/Anomaliya/Salomatlik/Brifing/Forecast/Vision)",
      "Embed widget builder ('veb ichida veb')",
      "API dokumentatsiya sahifasi",
      "Webhook URLlar konfiguratsiyasi",
    ],
    improvement: [
      "Sozlamalar bo'limi 35+ sahifa bilan kengaytirildi",
      "Tovar (product) sahifa SalesDoc-equivalent qaytadan qurildi",
      "Brand/Category/Region/Currency yangi sahifalar",
    ],
    bugfix: [],
    security: [
      "2FA Telegram orqali",
      "IP whitelist + brute-force himoyasi",
      "Parol policy konfiguratori",
    ],
  },
  {
    version: "v26.3", date: "2026-05-01", status: "stable",
    feature: [
      "AI Copilot sahifa",
      "AI Anomaliya Detektori",
      "AI Biznes Salomatligi (10 metrika)",
      "AI Kunlik Brifing",
      "RFM segmentlash",
    ],
    improvement: [
      "Klient kartochka 9 ta sub-page",
      "Hisobot bo'limi 30+ sahifa",
    ],
    bugfix: [
      "useApi infinite loop tuzatildi",
      "Login parol field 'parol' (ne password)",
    ],
    security: [],
  },
  {
    version: "v26.2", date: "2026-04-28", status: "stable",
    feature: ["Lead pipeline (CRM)", "Promo builder", "Cohort retention tahlili"],
    improvement: ["Mobile responsive yaxshilandi"],
    bugfix: ["Filial envelope crash", "ABC-XYZ path"],
    security: [],
  },
  {
    version: "v26.1", date: "2026-04-15", status: "stable",
    feature: ["Voice integration (Gemini STT)", "Photo AI review (YOLO+Gemini Vision)"],
    improvement: ["Dashboard AI redesign"],
    bugfix: [],
    security: [],
  },
  {
    version: "v26.0", date: "2026-04-01", status: "stable",
    feature: ["v26 major release", "Next.js 16 + React 19"],
    improvement: ["100+ sahifa investor pitch uchun"],
    bugfix: [],
    security: ["Initial security audit"],
  },
]

const STATUS_COLOR: Record<string, string> = {
  current: "bg-emerald-500 text-white",
  stable: "bg-blue-500 text-white",
  beta: "bg-amber-500 text-white",
}

export default function ChangelogPage() {
  const latest = RELEASES[0]

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GitCommit className="w-7 h-7 text-emerald-600" />
              Changelog (Release notes)
            </h1>
            <p className="text-sm text-slate-500">Joriy: {latest.version} · {RELEASES.length} ta release</p>
          </div>
          <Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> RSS feed</Button>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-10 h-10 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-emerald-700">JORIY VERSIYA</div>
              <h2 className="text-3xl font-bold font-mono">{latest.version}</h2>
              <p className="text-sm text-slate-600">{latest.date} · ✓ Production</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">
            🎉 200+ sahifa milestone! 6 ta dunyoda yagona AI ficha. To'liq SaaS-ready: HR + Finance + CRM + Sales + Inventory + Audit + Compliance + Billing + Security + AI.
          </p>
        </Card>

        <div className="space-y-4">
          {RELEASES.map(r => (
            <Card key={r.version} className="p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <h2 className="text-2xl font-bold font-mono">{r.version}</h2>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${STATUS_COLOR[r.status]}`}>{r.status === "current" ? "🚀 CURRENT" : r.status === "stable" ? "✓ STABLE" : "🧪 BETA"}</span>
                <span className="text-sm text-slate-500 font-mono ml-auto">{r.date}</span>
              </div>

              {r.feature.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> Yangi fichalar ({r.feature.length})</h3>
                  <ul className="text-sm space-y-1 ml-6">
                    {r.feature.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}

              {r.improvement.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-600" /> Yaxshilashlar ({r.improvement.length})</h3>
                  <ul className="text-sm space-y-1 ml-6">
                    {r.improvement.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}

              {r.bugfix.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Bug className="w-4 h-4 text-rose-600" /> Buglar tuzatildi ({r.bugfix.length})</h3>
                  <ul className="text-sm space-y-1 ml-6">
                    {r.bugfix.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}

              {r.security.length > 0 && (
                <div className="mb-3">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-violet-600" /> Xavfsizlik ({r.security.length})</h3>
                  <ul className="text-sm space-y-1 ml-6">
                    {r.security.map((f, i) => <li key={i}>• {f}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
