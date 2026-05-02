"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Server, Cpu, HardDrive, Database, Clock, Globe, Shield, Sparkles } from "lucide-react"
import Link from "next/link"

const SYSTEM_INFO = {
  version: "v26.4 (build 4892)",
  releaseDate: "2026-05-02",
  environment: "Production",
  region: "🇺🇿 Toshkent (Railway eu-west)",
  uptime: "47 kun 12 soat",
  users: 12,
  totalApiCalls30d: 184_240,
}

const HEALTH = [
  { service: "Web frontend (Next.js 16)", status: "healthy", latency: "120 ms", uptime: "99.98%", color: "emerald" },
  { service: "Backend API (FastAPI)", status: "healthy", latency: "45 ms", uptime: "99.95%", color: "emerald" },
  { service: "Database (PostgreSQL 16)", status: "healthy", latency: "8 ms", uptime: "100%", color: "emerald" },
  { service: "Redis cache", status: "healthy", latency: "2 ms", uptime: "100%", color: "emerald" },
  { service: "Telegram bot", status: "healthy", latency: "180 ms", uptime: "99.92%", color: "emerald" },
  { service: "AI services (Gemini/Claude)", status: "degraded", latency: "850 ms", uptime: "98.5%", color: "amber" },
  { service: "Storage (Cloudflare R2)", status: "healthy", latency: "60 ms", uptime: "100%", color: "emerald" },
]

const RESOURCES = [
  { name: "CPU", used: 28, limit: 100, unit: "%" },
  { name: "RAM", used: 1.4, limit: 4, unit: "GB" },
  { name: "Disk", used: 24, limit: 100, unit: "GB" },
  { name: "DB rows", used: 184_000, limit: 10_000_000, unit: "rows" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_COLOR: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-rose-500",
}

const STATUS_LABEL: Record<string, string> = {
  healthy: "✓ Healthy",
  degraded: "⚠️ Degraded",
  down: "✕ Down",
}

export default function SystemInfoPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Server className="w-7 h-7 text-emerald-600" />
              Tizim ma'lumotlari (System Info)
            </h1>
            <p className="text-sm text-slate-500">SavdoAI {SYSTEM_INFO.version} · {SYSTEM_INFO.environment} · uptime {SYSTEM_INFO.uptime}</p>
          </div>
          <Button variant="outline" className="gap-2"><Globe className="w-4 h-4" /> Status sahifa</Button>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-700 mb-1">VERSIYA</div>
              <div className="text-2xl font-bold font-mono">{SYSTEM_INFO.version}</div>
              <div className="text-xs text-slate-500">Released {SYSTEM_INFO.releaseDate}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-700 mb-1">MUHIT</div>
              <div className="text-2xl font-bold">{SYSTEM_INFO.environment}</div>
              <div className="text-xs text-slate-500">{SYSTEM_INFO.region}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-violet-700 mb-1">UPTIME</div>
              <div className="text-2xl font-bold font-mono">{SYSTEM_INFO.uptime}</div>
              <div className="text-xs text-slate-500">{SYSTEM_INFO.users} foydalanuvchi · {fmt(SYSTEM_INFO.totalApiCalls30d)} API/oy</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600" /> Servislar holati</h2>
          <div className="space-y-2">
            {HEALTH.map(h => (
              <div key={h.service} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className={`w-3 h-3 rounded-full ${STATUS_COLOR[h.status]} animate-pulse`} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{h.service}</div>
                  <div className="text-xs text-slate-500">latency {h.latency} · uptime {h.uptime}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  h.status === "healthy" ? "bg-emerald-100 text-emerald-700" :
                  h.status === "degraded" ? "bg-amber-100 text-amber-700" :
                  "bg-rose-100 text-rose-700"
                }`}>{STATUS_LABEL[h.status]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-600" /> Resurslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RESOURCES.map(r => {
              const pct = (r.used / r.limit) * 100
              return (
                <div key={r.name} className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{r.name}</span>
                    <span className="text-sm font-mono">
                      {r.used > 1000 ? fmt(r.used) : r.used} / {r.limit > 1000 ? fmt(r.limit) : r.limit} {r.unit}
                    </span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div className={`h-full ${pct < 50 ? "bg-emerald-500" : pct < 80 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{Math.round(pct)}% ishlatildi</div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Texnologiyalar stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-4 rounded-lg bg-blue-50">
              <h3 className="font-bold text-blue-700 mb-2">🎨 Frontend</h3>
              <ul className="space-y-1 text-xs">
                <li>• Next.js 16 (App Router)</li>
                <li>• React 19</li>
                <li>• Tailwind CSS 4</li>
                <li>• TypeScript 5.7</li>
                <li>• Lucide Icons</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50">
              <h3 className="font-bold text-emerald-700 mb-2">⚙️ Backend</h3>
              <ul className="space-y-1 text-xs">
                <li>• FastAPI (Python 3.12)</li>
                <li>• PostgreSQL 16</li>
                <li>• Redis 7</li>
                <li>• Celery (background)</li>
                <li>• Railway deploy</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-violet-50">
              <h3 className="font-bold text-violet-700 mb-2">🤖 AI</h3>
              <ul className="space-y-1 text-xs">
                <li>• Gemini 2.5/3 (STT, Vision)</li>
                <li>• Claude Opus 4.7 (chat)</li>
                <li>• DeepSeek V4 (arzon task)</li>
                <li>• Whisper (fallback STT)</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-300">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-violet-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-violet-800">SavdoAI haqida</h3>
              <p className="text-sm text-slate-700 mt-1">
                SavdoAI — O'zbekistonda birinchi AI bilan boyitilgan distribyutorlik platformasi.
                190+ sahifa, 6 ta dunyoda yagona AI ficha (Copilot/Anomaliya/Salomatlik/Brifing/Forecast/Vision).
                Ushbu loyiha 2024-yilda boshlangan va hozirda 12 ta xodim, 624 ta klient bilan ishlamoqda.
              </p>
              <div className="text-xs text-slate-500 mt-2">© 2024-2026 SavdoAI · Mashrab Distribution LLC</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
