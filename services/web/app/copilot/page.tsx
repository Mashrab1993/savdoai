"use client"

/**
 * AI Biznes Copilot — Opus 4.7 chat interfeys.
 *
 * Foydalanuvchi biznes savolini ayti, AI javob beradi:
 * - Joriy sotuv hajmi
 * - Klient muammolari
 * - Tovar qoldiq vaziyati
 * - Strategik tavsiyalar
 */

import { useState, useRef, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  Sparkles, Send, User, Brain, Loader2, Zap, TrendingUp,
  Users, AlertTriangle, Package,
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  text: string
  time: string
  stat?: CopilotStat
}

interface CopilotStat {
  tushum_7kun: number
  zayavkalar: number
  qarz: number
  klient_soni: number
  qarzdor: number
  tovar_soni: number
  kam_qoldiq: number
  shogird_soni: number
}

const SUGGESTIONS = [
  "Bu hafta sotuvlar qanday?",
  "Qaysi klientlar muammoli (qarz)?",
  "Kam qoldiqli tovarlarga nima buyuraman?",
  "Qaysi agent eng ko'p sotdi?",
  "Keyingi oy strategiya qanday bo'lishi kerak?",
  "Qaysi tovarni ko'proq sotishim kerak?",
]


export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Salom! Men SavdoAI Copilot — Opus 4.7 bilan ishlayman.\n\nBiznes savollaringizga javob beraman: sotuvlar, klientlar, tovarlar, strategiya. Pastdagi tavsiyalardan tanlang yoki o'z savolingizni yozing.",
      time: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (savol?: string) => {
    const text = (savol || input).trim()
    if (!text || loading) return

    setMessages(prev => [...prev, {
      role: "user", text, time: new Date().toISOString(),
    }])
    setInput("")
    setLoading(true)

    try {
      const res = await api.post<{ javob: string; kontekst_stat: CopilotStat }>(
        "/api/v1/copilot/ask",
        { savol: text },
      )
      setMessages(prev => [...prev, {
        role: "assistant",
        text: res.javob,
        time: new Date().toISOString(),
        stat: res.kontekst_stat,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `❌ Xatolik: ${e instanceof Error ? e.message : String(e)}\n\nIltimos, keyinroq qayta urinib ko'ring.`,
        time: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="AI Biznes Copilot">
      <div className="h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto gap-4 p-4">
        {/* HEADER */}
        <Card className="p-5 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white border-0 relative overflow-hidden flex-shrink-0">
          <div className="absolute -top-4 -right-4 opacity-10">
            <Brain className="w-32 h-32" />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">AI Biznes Copilot</h2>
              <p className="text-sm opacity-80">
                Claude Opus 4.7 bilan — biznes haqida istagan savolni bering
              </p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">Beta</Badge>
          </div>
        </Card>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={`flex-1 max-w-[85%] ${m.role === "user" ? "text-right" : ""}`}>
                <Card className={`inline-block p-3 max-w-full ${
                  m.role === "user"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-card"
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                </Card>

                {/* Context stats after Copilot reply */}
                {m.stat && i > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Tushum 7k
                      </div>
                      <div className="font-bold">{formatCurrency(m.stat.tushum_7kun)}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Klient
                      </div>
                      <div className="font-bold">{m.stat.klient_soni} ({m.stat.qarzdor} qarz)</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" /> Tovar
                      </div>
                      <div className="font-bold">{m.stat.tovar_soni}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Kam qoldiq
                      </div>
                      <div className="font-bold text-orange-600">{m.stat.kam_qoldiq}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <Card className="inline-block p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opus 4.7 o&apos;ylamoqda...
                  </div>
                </Card>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* SUGGESTIONS */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {SUGGESTIONS.map((s, i) => (
              <Button key={i} variant="outline" size="sm"
                onClick={() => send(s)}
                className="text-xs">
                <Zap className="w-3 h-3 mr-1 text-amber-500" />
                {s}
              </Button>
            ))}
          </div>
        )}

        {/* INPUT */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            rows={2}
            placeholder="Savol yozing... (Enter yuborish uchun, Shift+Enter yangi qator)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={loading}
            className="flex-1 resize-none"
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
            size="lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
