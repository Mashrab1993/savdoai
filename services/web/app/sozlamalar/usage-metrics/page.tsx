"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Calendar, Download, Users, Zap, Database, Clock } from "lucide-react"
import Link from "next/link"

const DAILY_USAGE = [
  { day: "01.05", apiCalls: 5840, voiceMin: 124, photosUploaded: 84, dbQueries: 142000 },
  { day: "02.05", apiCalls: 6240, voiceMin: 142, photosUploaded: 96, dbQueries: 158000 },
  { day: "03.05 (today)", apiCalls: 4800, voiceMin: 84, photosUploaded: 56, dbQueries: 96000 },
]

const TOP_USERS = [
  { name: "Mashrab", role: "Admin", apiCalls: 1840, voiceMin: 62, photosUploaded: 28 },
  { name: "Babadjanova N.", role: "Agent", apiCalls: 1240, voiceMin: 48, photosUploaded: 36 },
  { name: "BORIEV M.", role: "Agent", apiCalls: 980, voiceMin: 36, photosUploaded: 24 },
  { name: "ДАВЛАТ", role: "Agent", apiCalls: 840, voiceMin: 24, photosUploaded: 18 },
  { name: "Berdiyev R.", role: "Agent", apiCalls: 620, voiceMin: 18, photosUploaded: 16 },
]

const ENDPOINTS = [
  { path: "/api/v1/clients", calls: 4840, avgMs: 42 },
  { path: "/api/v1/products", calls: 3680, avgMs: 28 },
  { path: "/api/v1/orders", calls: 2840, avgMs: 86 },
  { path: "/api/v1/stock", calls: 2240, avgMs: 56 },
  { path: "/api/v1/ai/recommendations", calls: 480, avgMs: 850 },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function UsageMetricsPage() {
  const totalApi30d = 184_240
  const totalVoice30d = 3680
  const totalPhotos30d = 1840
  const totalDb30d = 4_840_000

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Usage metrics (foydalanish statistikasi)
            </h1>
            <p className="text-sm text-slate-500">30 kun davomida tizim foydalanish ko'rsatkichlari</p>
          </div>
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> 30-kun</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Zap className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">API qo'ng'iroqlari</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalApi30d / 1000)}k</div>
            <div className="text-xs text-slate-500 mt-1">~6.1k/kun</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Clock className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Ovoz daqiqalar</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalVoice30d)}</div>
            <div className="text-xs text-slate-500 mt-1">~120/kun</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <BarChart3 className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Fotolar yuklandi</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalPhotos30d)}</div>
            <div className="text-xs text-slate-500 mt-1">~60/kun</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Database className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">DB queries</div>
            <div className="text-2xl font-bold mt-1 font-mono">{fmt(totalDb30d / 1000)}k</div>
            <div className="text-xs text-slate-500 mt-1">~160k/kun</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Kunlik foydalanish</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Sana</th>
                  <th className="py-3 px-2 text-right">API calls</th>
                  <th className="py-3 px-2 text-right">Voice (daq)</th>
                  <th className="py-3 px-2 text-right">Fotolar</th>
                  <th className="py-3 px-2 text-right">DB queries</th>
                </tr>
              </thead>
              <tbody>
                {DAILY_USAGE.map(d => (
                  <tr key={d.day} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2 font-mono">{d.day}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-700">{fmt(d.apiCalls)}</td>
                    <td className="py-3 px-2 text-right font-mono">{d.voiceMin}</td>
                    <td className="py-3 px-2 text-right font-mono">{d.photosUploaded}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">{fmt(d.dbQueries)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Top foydalanuvchilar</h2>
            <div className="space-y-2">
              {TOP_USERS.map((u, i) => (
                <div key={u.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-lg font-bold w-8 text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.role}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono font-bold text-emerald-700">{fmt(u.apiCalls)} API</div>
                    <div className="text-slate-500">{u.voiceMin}m · {u.photosUploaded} foto</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" /> Top API endpointlar</h2>
            <div className="space-y-2">
              {ENDPOINTS.map(e => (
                <div key={e.path} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-mono font-bold">{e.path}</code>
                    <span className="text-xs font-mono text-slate-500">{e.avgMs} ms avg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(e.calls / ENDPOINTS[0].calls) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold w-16 text-right">{fmt(e.calls)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
