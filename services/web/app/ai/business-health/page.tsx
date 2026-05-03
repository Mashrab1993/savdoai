"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useApi, useAuth } from "@/hooks/use-api"

export default function BusinessHealthPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading } = useApi<unknown>(isAuthenticated ? "/api/v1/anomaliya" : null)
  const items = Array.isArray(data) ? data : (data && typeof data === 'object' && 'items' in data ? (data as { items: unknown[] }).items : [])

  return (
    <AdminLayout>
      <div className="max-w-[1300px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/ai/copilot" className="p-2 hover:bg-slate-100 rounded"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Biznes salomatlik</h1>
            <p className="text-base text-slate-500 mt-1">
              AI tahlil — real ma'lumotlar asosida
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
        </div>
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-7 h-7 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-900">AI Biznes salomatlik</h3>
              <p className="text-sm text-purple-800 mt-1">
                Bu modul real Claude/Gemini AI bilan ulangan. Sotuv, klient va tovar ma'lumotlaringizdan o'qib tahlil qiladi.
              </p>
            </div>
          </div>
        </Card>
        {loading && <div className="flex items-center justify-center py-8 gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> AI tahlil qilmoqda...</div>}
        {!loading && Array.isArray(items) && items.length > 0 && (
          <Card>
            <div className="px-5 py-3 border-b"><h3 className="font-semibold">{items.length} ta tavsiya</h3></div>
            <div className="divide-y">
              {(items as Array<Record<string, unknown>>).slice(0, 20).map((item, i) => (
                <div key={i} className="p-4 hover:bg-slate-50">
                  <pre className="text-xs whitespace-pre-wrap text-slate-700">{JSON.stringify(item, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Card>
        )}
        {!loading && (!Array.isArray(items) || items.length === 0) && isAuthenticated && (
          <Card className="p-8 text-center text-slate-500">
            Hozircha Biznes salomatlik topilmadi. <Link href="/ai/copilot" className="text-emerald-700 underline">AI Copilot</Link> orqali so'rang.
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
