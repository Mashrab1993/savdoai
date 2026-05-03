"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
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

const SCORE_COLOR = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-[#D97706]" : "bg-[#C75D3C]"

export default function PhotoAiReviewPage() {
  const total = PHOTOS.length
  const passed = PHOTOS.filter(p => p.aiScore >= 80).length
  const flagged = PHOTOS.filter(p => p.aiScore < 60).length
  const avgScore = Math.round(PHOTOS.reduce((s, p) => s + p.aiScore, 0) / total)

  const totalFacings = PHOTOS.reduce((s, p) => s + p.detected.reduce((s2, d) => s2 + d.facings, 0), 0)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                AI Foto tahlili <span className="italic text-[#C75D3C]">Vision</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{total} foto tahlil qilindi · AI o'rta {avgScore}/100 · {totalFacings} facing aniqlandi</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">O'tdi (80+)</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{passed}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5E5D6] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#C75D3C]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Flagged (&lt;60)</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{flagged}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#C75D3C]" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">O'rta ball</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{avgScore}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-500" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Facing aniqlandi</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalFacings}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-purple-500" />
            </Card>
          </div>

          <div className="space-y-4">
            {PHOTOS.map(p => (
              <Card key={p.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#FCE9DD] to-[#F0EAE0] relative">
                    <Camera className="w-12 h-12 text-[#9C8A6E]" />
                    <div className={`absolute top-2 right-2 ${SCORE_COLOR(p.aiScore)} text-white text-xs px-2 py-1 rounded font-medium`}>
                      AI: {p.aiScore}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-base text-[#1A1A1A]">{p.client}</h3>
                      <span className="text-xs text-[#9C8A6E]">{p.agent}</span>
                      <span className="text-xs text-[#9C8A6E]">· {p.date}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D] ml-auto">{p.category}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1.5">Aniqlangan brendlar (Object Detection)</div>
                      <div className="flex flex-wrap gap-2">
                        {p.detected.map((d, i) => (
                          <div key={i} className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E0D3] rounded text-xs">
                            <span className="font-medium text-[#1A1A1A]">{d.brand}</span>
                            <span className="text-emerald-700 font-mono tabular-nums ml-1">×{d.facings}</span>
                            <span className="text-[#9C8A6E] ml-1.5">({d.confidence}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {p.issues.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs uppercase tracking-wider font-medium text-[#C75D3C] mb-1">Aniqlangan muammolar</div>
                        <ul className="text-sm text-[#6B5B4D] space-y-0.5">
                          {p.issues.map((iss, i) => <li key={i}>· {iss}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="bg-[#FAF7F2] border border-[#E8E0D3] p-3 rounded-xl">
                      <div className="text-xs uppercase tracking-wider font-medium text-[#C75D3C] mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI tavsiyasi
                      </div>
                      <div className="text-sm text-[#1A1A1A]">{p.recommendation}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5E5D6] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#C75D3C]" />
              </div>
              <div>
                <h3 className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Vision qanday ishlaydi?</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  Har foto YOLO va Gemini Vision modellari orqali tahlil qilinadi: brendlar aniqlanadi, facing soni hisoblanadi,
                  polkada chang/iflos topilsa flagged qilinadi. AI har foto uchun 0-100 ball va konkret tavsiya beradi.
                  <span className="font-medium text-[#1A1A1A]"> SalesDoc va boshqa CRM'larda yo'q</span> — bu SavdoAI'ning eksklyuziv ficha.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
