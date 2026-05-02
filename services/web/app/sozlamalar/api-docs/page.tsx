"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Code2, Copy, Send } from "lucide-react"
import Link from "next/link"

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/clients", description: "Klientlar ro'yxati", auth: true },
  { method: "POST", path: "/api/v1/clients", description: "Yangi klient yaratish", auth: true },
  { method: "GET", path: "/api/v1/clients/{id}", description: "Klient ma'lumoti", auth: true },
  { method: "PATCH", path: "/api/v1/clients/{id}", description: "Klient o'zgartirish", auth: true },
  { method: "DELETE", path: "/api/v1/clients/{id}", description: "Klient o'chirish", auth: true },
  { method: "GET", path: "/api/v1/products", description: "Tovarlar ro'yxati", auth: true },
  { method: "POST", path: "/api/v1/products", description: "Yangi tovar", auth: true },
  { method: "GET", path: "/api/v1/orders", description: "Zakazlar", auth: true },
  { method: "POST", path: "/api/v1/orders", description: "Yangi zakaz yaratish", auth: true },
  { method: "GET", path: "/api/v1/orders/{id}", description: "Zakaz tafsiloti", auth: true },
  { method: "GET", path: "/api/v1/stock", description: "Sklad qoldiq", auth: true },
  { method: "GET", path: "/api/v1/reports/sales", description: "Sotuv hisobot", auth: true },
  { method: "GET", path: "/api/v1/ai/recommendations/{client_id}", description: "AI tavsiyalar", auth: true },
  { method: "GET", path: "/api/v1/ai/anomalies", description: "Anomaliyalar", auth: true },
  { method: "POST", path: "/api/v1/webhook", description: "Webhook receiver", auth: false },
]

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-blue-500", POST: "bg-emerald-500", PATCH: "bg-amber-500", DELETE: "bg-rose-500", PUT: "bg-violet-500",
}

export default function ApiDocsPage() {
  const [selected, setSelected] = useState(ENDPOINTS[0])

  const example = `curl https://api.savdoai.com${selected.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-600" />
              API Dokumentatsiya
            </h1>
            <p className="text-sm text-slate-500">{ENDPOINTS.length} endpoint · OpenAPI 3.1 · v26.4</p>
          </div>
          <Button variant="outline" className="gap-2"><Code2 className="w-4 h-4" /> OpenAPI YAML</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Endpointlar</h2>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {ENDPOINTS.map(e => (
                <button key={e.path + e.method} onClick={() => setSelected(e)} className={`w-full text-left p-2 rounded transition-colors ${selected.path === e.path && selected.method === e.method ? "bg-emerald-50 ring-2 ring-emerald-500" : "hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase ${METHOD_COLOR[e.method]}`}>{e.method}</span>
                    <span className="font-mono text-xs flex-1 truncate">{e.path}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 ml-2">{e.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <span className={`text-sm px-3 py-1 rounded text-white font-bold uppercase ${METHOD_COLOR[selected.method]}`}>{selected.method}</span>
              <code className="font-mono text-base flex-1 break-all">https://api.savdoai.com{selected.path}</code>
              <Button size="sm" variant="outline" className="gap-1"><Copy className="w-3 h-3" /> Copy</Button>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-sm mb-1">Tavsif</h3>
              <p className="text-sm text-slate-700">{selected.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-sm mb-1">Authentifikatsiya</h3>
              <div className="text-sm">
                {selected.auth ? (
                  <span className="text-emerald-700">✓ Bearer Token kerak</span>
                ) : (
                  <span className="text-slate-500">○ Public (auth shart emas)</span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2">cURL misol</h3>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">{example}</pre>
              <Button size="sm" className="mt-2 gap-1"><Send className="w-3 h-3" /> Try in Playground</Button>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-sm mb-2">Response (200 OK)</h3>
              <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-slate-200">{`{
  "data": [
    { "id": 1024, "name": "Salom Magazin №1", ... }
  ],
  "meta": {
    "total": 624,
    "page": 1,
    "limit": 20
  }
}`}</pre>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">Error responses</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono">401</span> Unauthorized — API key invalid</div>
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-mono">429</span> Rate limit (1000/soat)</div>
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono">500</span> Server error</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Boshlash uchun</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>/sozlamalar/api-keys dan API kalit yarating</li>
            <li>Authorization header'ga <code className="font-mono bg-white px-1 rounded">Bearer YOUR_KEY</code> qo'shing</li>
            <li>Endpoint'ga so'rov yuboring</li>
            <li>Rate limit: 1000 so'rov/soat (Biznes plan), 5000 (Pro plan)</li>
          </ol>
        </Card>
      </div>
    </AdminLayout>
  )
}
