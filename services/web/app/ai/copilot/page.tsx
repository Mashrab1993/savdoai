"use client"
import { useState, useRef, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Sparkles, Send, MessageSquare, Lightbulb, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth, useApi } from "@/hooks/use-api"
import { api, ApiError } from "@/lib/api"

type AnomaliyaItem = {
  turi?: string
  matn?: string
  message?: string
  daraja?: string
  level?: string
}

type AnomaliyaResp = AnomaliyaItem[] | { items?: AnomaliyaItem[] }

const TYPE_DOT: Record<string, string> = {
  warning: "#C75D3C",
  opportunity: "#10B981",
  tip: "#3B82F6",
  default: "#9C8A6E",
}

type Msg = { role: "user" | "ai"; text: string; loading?: boolean }

export default function CopilotPage() {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Salom! Men sizning AI Copilot'ingiz. Sotuv, klient yoki tovarlar haqida istalgan savol bering — javob beraman." },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: anomData, loading: anomLoading } = useApi<AnomaliyaResp>(
    isAuthenticated ? "/api/v1/anomaliya" : null
  )

  const insights: AnomaliyaItem[] = Array.isArray(anomData)
    ? anomData
    : (anomData?.items ?? [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async () => {
    const q = input.trim()
    if (!q || busy) return
    if (!isAuthenticated) {
      setMessages(m => [...m, { role: "user", text: q }, { role: "ai", text: "Login qiling — keyin javob bera olaman." }])
      setInput("")
      return
    }
    setMessages(m => [...m, { role: "user", text: q }, { role: "ai", text: "Tahlil qilyapman...", loading: true }])
    setInput("")
    setBusy(true)
    try {
      const resp = await api.post<{ javob?: string; answer?: string }>("/api/v1/copilot/ask", { savol: q })
      const javob = resp.javob || resp.answer || "Javob bo'sh keldi."
      setMessages(m => {
        const copy = [...m]
        const last = copy[copy.length - 1]
        if (last && last.loading) copy[copy.length - 1] = { role: "ai", text: javob }
        return copy
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : (e instanceof Error ? e.message : "Xato")
      setMessages(m => {
        const copy = [...m]
        const last = copy[copy.length - 1]
        if (last && last.loading) copy[copy.length - 1] = { role: "ai", text: `Xato: ${msg}` }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="flex items-end justify-between border-b border-[#E8E0D3] pb-6">
            <div>
              <Link href="/dashboard" className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium hover:text-[#C75D3C] flex items-center gap-2 mb-3">
                <ArrowLeft className="w-3.5 h-3.5" /> DASHBOARD
              </Link>
              <h1 className="text-5xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                AI <span className="italic text-[#C75D3C]">Sotuv Copilot</span>
              </h1>
              <p className="text-base text-[#6B5B4D] mt-3 max-w-xl">
                Sizning savdo ma'lumotlaringizdan real-time tahlil va tavsiyalar.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#E8E0D3] text-[#1A1A1A] font-medium text-sm flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? "bg-emerald-600 animate-pulse" : "bg-amber-500"}`} />
              {isAuthenticated ? "Online" : "Login kerak"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)" }}>
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium">REAL ANOMALIYA</div>
                    <h2 className="text-xl font-medium text-[#1A1A1A] mt-0.5" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {anomLoading ? "Yuklanmoqda..." : `${insights.length} ta tavsiya`}
                    </h2>
                  </div>
                </div>
                {!isAuthenticated && (
                  <div className="text-sm text-[#9C8A6E] py-6 text-center">
                    Login qiling — sizning ma'lumotlaringiz bo'yicha tavsiyalar ko'rinadi.
                  </div>
                )}
                {isAuthenticated && !anomLoading && insights.length === 0 && (
                  <div className="text-sm text-[#9C8A6E] py-6 text-center">
                    Hozircha anomaliya yo'q — biznesingiz normal kechmoqda.
                  </div>
                )}
                {isAuthenticated && insights.length > 0 && (
                  <div className="space-y-3">
                    {insights.slice(0, 8).map((s, i) => {
                      const level = (s.daraja || s.level || "default").toLowerCase()
                      const dot = TYPE_DOT[level] || TYPE_DOT.default
                      const text = s.matn || s.message || ""
                      return (
                        <div key={i} className="p-4 rounded-xl bg-[#FAF7F2] border-l-2" style={{ borderLeftColor: dot }}>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: dot }} />
                            <div className="flex-1">
                              {s.turi && <div className="font-medium text-[#1A1A1A] text-sm mb-1">{s.turi}</div>}
                              <p className="text-sm text-[#6B5B4D] leading-relaxed">{text}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl flex flex-col" style={{ minHeight: "600px" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#C75D3C" }}>
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[#9C8A6E] font-medium">CHAT</div>
                  <h3 className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                    AI bilan suhbat
                  </h3>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1 max-h-[450px]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[#C75D3C] text-white rounded-br-md"
                        : "bg-[#FAF7F2] text-[#1A1A1A] rounded-bl-md border border-[#E8E0D3]"
                    }`}>
                      {msg.role === "ai" && !msg.loading && <Sparkles className="w-3 h-3 inline mr-1 text-[#C75D3C]" />}
                      {msg.loading && <Loader2 className="w-3 h-3 inline mr-1 animate-spin text-[#C75D3C]" />}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-[#E8E0D3] pt-3">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Savol yozing..."
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                    disabled={busy}
                    maxLength={500}
                    className="flex-1 border-[#E8E0D3] bg-[#FAF7F2] text-[#1A1A1A]"
                  />
                  <Button onClick={send} disabled={busy || !input.trim()} className="px-4" style={{ background: "#C75D3C" }}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Bugun nechta sotuv qildim?",
                    "Eng yaxshi mahsulotim qaysi?",
                    "Kam qoldiqdagi tovarlarim?",
                    "Bugungi foyda?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      disabled={busy}
                      className="text-xs px-2 py-1 bg-[#FAF7F2] border border-[#E8E0D3] rounded text-[#6B5B4D] hover:border-[#C75D3C] hover:text-[#C75D3C] transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)" }}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-1">QANDAY ISHLAYDI</div>
                <h3 className="text-xl font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                  AI Copilot bu nima?
                </h3>
                <p className="text-sm text-[#6B5B4D] mt-2 max-w-3xl leading-relaxed">
                  Sizning sotuv, sklad va klient ma'lumotlaringizdan o'qib, real javob beradigan AI yordamchi.
                  Bugungi sotuv soni, eng yaxshi mahsulotlar, kam qoldiqlar — barcha savollarga real ma'lumotlar bilan javob beradi.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
