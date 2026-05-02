"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Sparkles, CheckCircle2, AlertTriangle, Eye, BarChart3 } from "lucide-react"
import Link from "next/link"

type AiPhoto = {
  id: number; client: string; agent: string; date: string;
  category: string; aiScore: number;
  detected: { brand: string; facings: number; confidence: number }[];
  issues: string[];
  recommendation: string;
}

const PHOTOS: AiPhoto[] = [
  { id: 1, client: "Salom Magazin №1", agent: "Babadjanova N.", date: "2026-05-02 10:25", category: "shelf", aiScore: 92,
    detected: [{ brand: "Choco-Boom", facings: 12, confidence: 96 }, { brand: "Coca-Cola", facings: 8, confidence: 94 }, { brand: "Bonjur", facings: 6, confidence: 88 }],
    issues: [], recommendation: "Hammasi yaxshi! Polkada 26 facing topildi (target 24+)" },
  { id: 2, client: "Bona Магазин", agent: "Berdiyev R.", date: "2026-05-02 11:32", category: "shelf", aiScore: 76,
    detected: [{ brand: "Coca-Cola", facings: 10, confidence: 92 }, { brand: "Pepsi", facings: 14, confidence: 95 }],
    issues: ["Pepsi facingi bizdan ko'p", "Choco-Boom topilmadi"], recommendation: "Choco-Boom polkaga qo'yish va Coca-Cola facingni 14ga oshirish" },
  { id: 3, client: "Гулямов Маркет", agent: "ДАВЛАТ", date: "2026-05-01 16:10", category: "issue", aiScore: 42,
    detected: [{ brand: "Bonjur", facings: 2, confidence: 78 }],
    issues: ["Polka iflos", "Foto past sifat (blur)", "Nur kam"], recommendation: "Foto qaytadan olish kerak. Polka tozalash haqida klient bilan gaplashing" },
  { id: 4, client: "Дастархон Сервис", agent: "Sayitqulov M.", date: "2026-05-01 14:18", category: "shelf", aiScore: 96,
    detected: [{ brand: "Choco-Boom", facings: 18, confidence: 98 }, { brand: "Bonjur", facings: 12, confidence: 96 }, { brand: "Sok", facings: 8, confidence: 92 }, { brand: "Voda", facings: 10, confidence: 94 }],
    issues: [], recommendation: "Premium polka! 48 facing — bizning eng yaxshi klient" },
  { id: 5, client: "Турсун Ake Магазин", agent: "BORIEV M.", date: "2026-04-30 10:25", category: "competitor", aiScore: 84,
    detected: [{ brand: "Coca-Cola", facings: 6, confidence: 92 }, { brand: "Pepsi", facings: 8, confidence: 94 }, { brand: "Sprite", facings: 4, confidence: 88 }],
    issues: ["Pepsi+Sprite jami 12 facing, biz 6"], recommendation: "Yana 4-6 facing kiritish kerak. Promo bilan rag'batlantirish" },
]

const SCORE_COLOR = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-rose-500"

export default function PhotoAiReviewPage() {
  const total = PHOTOS.length
  const passed = PHOTOS.filter(p => p.aiScore >= 80).length
  const flagged = PHOTOS.filter(p => p.aiScore < 60).length
  const avgScore = Math.round(PHOTOS.reduce((s, p) => s + p.aiScore, 0) / total)

  const totalFacings = PHOTOS.reduce((s, p) => s + p.detected.reduce((s2, d) => s2 + d.facings, 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/audit" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-violet-600" />
              AI Foto tahlili (Vision)
            </h1>
            <p className="text-sm text-slate-500">{total} foto tahlil qilindi · AI o'rta {avgScore}/100 · {totalFacings} facing aniqlandi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">O'tdi (80+)</div>
            <div className="text-2xl font-bold mt-1">{passed}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Flagged (&lt;60)</div>
            <div className="text-2xl font-bold mt-1">{flagged}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">O'rta ball</div>
            <div className="text-2xl font-bold mt-1">{avgScore}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Eye className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Facing aniqlandi</div>
            <div className="text-2xl font-bold mt-1">{totalFacings}</div>
          </Card>
        </div>

        <div className="space-y-4">
          {PHOTOS.map(p => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-32 h-32 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${
                  p.category === "shelf" ? "from-emerald-300 to-emerald-500" :
                  p.category === "competitor" ? "from-rose-300 to-rose-500" :
                  "from-slate-300 to-slate-500"
                } relative`}>
                  <Camera className="w-12 h-12 text-white/40" />
                  <div className={`absolute top-2 right-2 ${SCORE_COLOR(p.aiScore)} text-white text-xs px-2 py-1 rounded font-bold`}>
                    AI: {p.aiScore}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-base">{p.client}</h3>
                    <span className="text-xs text-slate-500">{p.agent}</span>
                    <span className="text-xs text-slate-400">· {p.date}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 ml-auto">{p.category}</span>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-bold text-slate-600 mb-1.5">🤖 Aniqlangan brendlar (Object Detection):</div>
                    <div className="flex flex-wrap gap-2">
                      {p.detected.map((d, i) => (
                        <div key={i} className="px-3 py-1.5 bg-slate-100 rounded text-xs">
                          <span className="font-bold">{d.brand}</span>
                          <span className="text-emerald-700 font-mono ml-1">×{d.facings}</span>
                          <span className="text-slate-500 ml-1.5">({d.confidence}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {p.issues.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-bold text-rose-700 mb-1">⚠️ Aniqlangan muammolar:</div>
                      <ul className="text-sm text-slate-700 space-y-0.5">
                        {p.issues.map((iss, i) => <li key={i}>• {iss}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="bg-violet-50 border border-violet-200 p-3 rounded-lg">
                    <div className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI tavsiyasi:
                    </div>
                    <div className="text-sm text-slate-700">{p.recommendation}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-violet-800">AI Vision qanday ishlaydi?</h3>
              <p className="text-sm text-slate-700 mt-1">
                Har foto YOLO va Gemini Vision modellari orqali tahlil qilinadi: brendlar aniqlanadi, facing soni hisoblanadi,
                polkada chang/iflos topilsa flagged qilinadi. AI har foto uchun 0-100 ball va konkret tavsiya beradi.
                <span className="font-bold"> SalesDoc va boshqa CRM'larda yo'q</span> — bu SavdoAI'ning eksklyuziv ficha.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
