"use client"

/**
 * HealthScoreWidget — /dashboard uchun kichik Biznes Salomatligi kartochka.
 *
 * Kompact versiya: katta raqam + 6 komponent progress bar + "To'liq ko'rish" havola.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { Heart, ArrowRight, TrendingUp, Users, Package, Target, AlertTriangle } from "lucide-react"

interface HealthResponse {
  ball: number
  darajasi: string
  emoji: string
  rang: string
  komponentlar: Array<{ nomi: string; ball: number; max: number }>
}

const RANG_STROKE: Record<string, string> = {
  emerald: "stroke-emerald-500",
  green:   "stroke-green-500",
  yellow:  "stroke-yellow-500",
  orange:  "stroke-orange-500",
  red:     "stroke-red-500",
}
const RANG_TEXT: Record<string, string> = {
  emerald: "text-emerald-600",
  green:   "text-green-600",
  yellow:  "text-yellow-600",
  orange:  "text-orange-600",
  red:     "text-red-600",
}


export function HealthScoreWidget() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<HealthResponse>("/api/v1/biznes_salomatlik")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          <Heart className="w-5 h-5 animate-pulse mr-2" />
          Biznes salomatligi yuklanmoqda...
        </div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="p-5">
        <div className="text-muted-foreground text-sm text-center py-4">
          Biznes salomatligi hozir mavjud emas
        </div>
      </Card>
    )
  }

  const strokeClass = RANG_STROKE[data.rang] || RANG_STROKE.green
  const textClass = RANG_TEXT[data.rang] || RANG_TEXT.green
  const circumference = 2 * Math.PI * 42
  const dash = (data.ball / 100) * circumference

  return (
    <Link href="/biznes-salomatlik">
      <Card className="p-5 hover:shadow-lg transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold">Biznes Salomatligi</h3>
          </div>
          <Badge variant="outline" className="text-xs">Yangi</Badge>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42"
                fill="none" stroke="currentColor"
                className="text-muted/20"
                strokeWidth="8" />
              <circle cx="50" cy="50" r="42"
                fill="none" stroke="currentColor"
                className={strokeClass}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl">{data.emoji}</div>
              <div className={`text-xl font-bold ${textClass} -mt-1`}>{data.ball}</div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${textClass} mb-2`}>{data.darajasi}</div>
            <div className="space-y-1.5">
              {data.komponentlar.slice(0, 3).map((k, i) => {
                const foiz = (k.ball / k.max) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate">{k.nomi}</span>
                      <span className="font-mono font-medium flex-shrink-0 ml-2">{k.ball}/{k.max}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${foiz}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          <span>To&apos;liq ko&apos;rish</span>
          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  )
}
