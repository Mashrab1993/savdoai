"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Flag, Sparkles, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

type FeatureFlag = {
  id: number; name: string; key: string; description: string;
  enabled: boolean; rolloutPct: number;
  experimentMode: boolean;
  group: "ai" | "ui" | "feature" | "experiment";
  exposed: number; conversionRate?: number;
}

const INITIAL: FeatureFlag[] = [
  { id: 1, name: "AI Copilot v2", key: "ai_copilot_v2", description: "Yangi AI Copilot Claude Opus 4.7 bilan", enabled: true, rolloutPct: 100, experimentMode: false, group: "ai", exposed: 12 },
  { id: 2, name: "Yangi dashboard layout", key: "new_dashboard_v3", description: "Card-based modulli dashboard", enabled: true, rolloutPct: 50, experimentMode: true, group: "ui", exposed: 6, conversionRate: 78 },
  { id: 3, name: "Voice-first navigation", key: "voice_nav", description: "Faqat ovoz bilan navigatsiya (beta)", enabled: false, rolloutPct: 0, experimentMode: false, group: "experiment", exposed: 0 },
  { id: 4, name: "Multi-currency support", key: "multi_currency", description: "USD, EUR, RUB qabul qilish", enabled: true, rolloutPct: 100, experimentMode: false, group: "feature", exposed: 12 },
  { id: 5, name: "AI Anomaly v2 (Gemini 3)", key: "anomaly_v2", description: "Yangi anomaliya algoritmi", enabled: true, rolloutPct: 25, experimentMode: true, group: "ai", exposed: 3, conversionRate: 92 },
  { id: 6, name: "Dark mode", key: "dark_mode", description: "Qorong'i tema barcha sahifalarda", enabled: true, rolloutPct: 100, experimentMode: false, group: "ui", exposed: 12 },
  { id: 7, name: "Telegram Mini App", key: "tg_mini_app", description: "Telegram ichida mini-app", enabled: true, rolloutPct: 75, experimentMode: false, group: "feature", exposed: 9 },
  { id: 8, name: "AI Recommender v3", key: "recommender_v3", description: "Sequence prediction modeli", enabled: false, rolloutPct: 10, experimentMode: true, group: "ai", exposed: 1, conversionRate: 84 },
  { id: 9, name: "Bulk WhatsApp", key: "bulk_whatsapp", description: "Klient guruhlariga WhatsApp xabar", enabled: false, rolloutPct: 0, experimentMode: false, group: "experiment", exposed: 0 },
  { id: 10, name: "Live route tracking", key: "live_route", description: "Agent marshrutini real-time", enabled: true, rolloutPct: 100, experimentMode: false, group: "feature", exposed: 12 },
]

const GROUP_COLOR: Record<string, string> = {
  ai: "bg-violet-100 text-violet-700",
  ui: "bg-blue-100 text-blue-700",
  feature: "bg-emerald-100 text-emerald-700",
  experiment: "bg-amber-100 text-amber-700",
}
const GROUP_LABEL: Record<string, string> = {
  ai: "🤖 AI", ui: "🎨 UI", feature: "✨ Feature", experiment: "🧪 Experiment",
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(INITIAL)

  const toggle = (id: number) => setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  const setRollout = (id: number, pct: number) => setFlags(flags.map(f => f.id === id ? { ...f, rolloutPct: pct } : f))

  const enabledCount = flags.filter(f => f.enabled).length
  const experimentCount = flags.filter(f => f.experimentMode).length
  const fullRollout = flags.filter(f => f.enabled && f.rolloutPct === 100).length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Flag className="w-7 h-7 text-amber-600" />
              Feature flags (A/B testlar)
            </h1>
            <p className="text-sm text-slate-500">{flags.length} flag · {enabledCount} yoqilgan · {experimentCount} A/B test · {fullRollout} 100% rollout</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Flag className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Yoqilgan</div>
            <div className="text-2xl font-bold mt-1">{enabledCount}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Sparkles className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">A/B testlar</div>
            <div className="text-2xl font-bold mt-1">{experimentCount}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">100% rollout</div>
            <div className="text-2xl font-bold mt-1">{fullRollout}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <TrendingUp className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">AI fichalar</div>
            <div className="text-2xl font-bold mt-1">{flags.filter(f => f.group === "ai").length}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Flaglar ro'yxati</h2>
          <div className="space-y-3">
            {flags.map(f => (
              <div key={f.id} className={`p-4 rounded-lg border-l-4 ${f.enabled ? "border-emerald-500 bg-white" : "border-slate-300 bg-slate-50 opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-base">{f.name}</h3>
                      <code className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono">{f.key}</code>
                      <span className={`text-xs px-2 py-0.5 rounded ${GROUP_COLOR[f.group]}`}>{GROUP_LABEL[f.group]}</span>
                      {f.experimentMode && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">🧪 A/B test</span>}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{f.description}</p>

                    {f.enabled && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500">Rollout: {f.exposed} / 12 foydalanuvchi</span>
                          <span className="font-mono font-bold">{f.rolloutPct}%</span>
                        </div>
                        <input type="range" min={0} max={100} step={25} value={f.rolloutPct} onChange={e => setRollout(f.id, Number(e.target.value))} className="w-full" />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                        </div>
                      </div>
                    )}

                    {f.conversionRate && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                        <TrendingUp className="w-3 h-3" /> Conversion: <span className="font-bold font-mono">{f.conversionRate}%</span>
                      </div>
                    )}
                  </div>

                  <button onClick={() => toggle(f.id)} className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${f.enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${f.enabled ? "translate-x-7" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">💡 Feature flag nima?</h3>
          <p className="text-sm text-slate-700">
            Yangi fichalarni asta-sekin (rollout) yoqib chiqarish, A/B testlar o'tkazish.
            Flag o'chirilsa — ficha sevak bo'ladi (deploy shart emas).
            25% → 50% → 100% rollout — yangi ficha yaxshi ishlasa to'liq yoqing.
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
