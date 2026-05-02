"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Database, FileText, Image as ImageIcon, Calendar, Sparkles, Clock } from "lucide-react"
import Link from "next/link"

type ExportJob = {
  id: number; name: string; type: "client" | "product" | "order" | "stock" | "finance" | "photos";
  format: "excel" | "csv" | "json" | "pdf" | "zip";
  range: string; recordsCount: number;
  size: string; status: "ready" | "in_progress" | "queued";
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  client: "👥 Klientlar", product: "📦 Tovarlar", order: "🛒 Zakazlar",
  stock: "📦 Sklad", finance: "💰 Moliya", photos: "📷 Foto-arxiv",
}

const JOBS: ExportJob[] = [
  { id: 1, name: "Klientlar bazasi (to'liq)", type: "client", format: "excel", range: "Hammasi", recordsCount: 624, size: "2.4 MB", status: "ready", createdAt: "2026-05-02 09:30" },
  { id: 2, name: "Aprel 2026 zakazlar", type: "order", format: "excel", range: "01.04 - 30.04", recordsCount: 480, size: "1.8 MB", status: "ready", createdAt: "2026-05-01 18:00" },
  { id: 3, name: "Tovar katalog", type: "product", format: "json", range: "Aktiv", recordsCount: 178, size: "640 KB", status: "ready", createdAt: "2026-04-30 12:15" },
  { id: 4, name: "Sklad qoldiq snapshot", type: "stock", format: "csv", range: "Bugun", recordsCount: 178, size: "320 KB", status: "in_progress", createdAt: "2026-05-02 14:25" },
  { id: 5, name: "Q1 P&L hisobot", type: "finance", format: "pdf", range: "Yan-Mar 2026", recordsCount: 1, size: "184 KB", status: "ready", createdAt: "2026-04-15 10:00" },
  { id: 6, name: "Foto arxiv (Aprel)", type: "photos", format: "zip", range: "01.04 - 30.04", recordsCount: 1840, size: "1.2 GB", status: "queued", createdAt: "2026-05-02 16:00" },
]

const STATUS_LABEL: Record<string, string> = {
  ready: "✓ Tayyor",
  in_progress: "⏳ Tayyorlanmoqda",
  queued: "🕓 Navbatda",
}
const STATUS_COLOR: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  queued: "bg-slate-100 text-slate-700",
}

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DataExportPage() {
  const [selectedType, setSelectedType] = useState("client")
  const [format, setFormat] = useState("excel")
  const [range, setRange] = useState("month")

  const totalSize = "1.85 GB"
  const totalRecords = JOBS.reduce((s, j) => s + j.recordsCount, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Database className="w-7 h-7 text-emerald-600" />
              Ma'lumotlarni eksport qilish
            </h1>
            <p className="text-sm text-slate-500">{JOBS.length} ta eksport · jami {fmt(totalRecords)} yozuv · {totalSize}</p>
          </div>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" /> Yangi eksport yaratish
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Ma'lumot turi</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Format</label>
              <div className="flex gap-1">
                {["excel", "csv", "json", "pdf", "zip"].map(f => (
                  <button key={f} onClick={() => setFormat(f)} className={`flex-1 px-2 py-2 rounded-md text-xs font-bold uppercase transition-colors ${format === f ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Davr</label>
              <select value={range} onChange={e => setRange(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                <option value="all">Hammasi</option>
                <option value="today">Bugun</option>
                <option value="week">Haftalik</option>
                <option value="month">Oylik</option>
                <option value="quarter">Choraklik</option>
                <option value="year">Yillik</option>
                <option value="custom">Maxsus...</option>
              </select>
            </div>
          </div>
          <Button className="mt-4 gap-2"><Download className="w-4 h-4" /> Eksport boshlash</Button>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Tayyor eksportlar va navbat</h2>
          <div className="space-y-3">
            {JOBS.map(j => (
              <div key={j.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  j.format === "excel" ? "bg-emerald-100" :
                  j.format === "csv" ? "bg-blue-100" :
                  j.format === "json" ? "bg-violet-100" :
                  j.format === "pdf" ? "bg-rose-100" :
                  "bg-amber-100"
                }`}>
                  {j.format === "zip" ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold">{j.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{TYPE_LABEL[j.type]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono uppercase">{j.format}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[j.status]}`}>{STATUS_LABEL[j.status]}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span><Calendar className="w-3 h-3 inline mr-1" /> {j.range}</span>
                    <span>📋 {fmt(j.recordsCount)} yozuv</span>
                    <span>💾 {j.size}</span>
                    <span><Clock className="w-3 h-3 inline mr-1" /> {j.createdAt}</span>
                  </div>
                </div>

                {j.status === "ready" && (
                  <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Yuklab olish</Button>
                )}
                {j.status === "in_progress" && (
                  <div className="text-sm text-amber-700 font-bold">⏳ 60%</div>
                )}
                {j.status === "queued" && (
                  <div className="text-sm text-slate-500">🕓 Kutmoqda...</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">💡 Avtomatik eksport (rejalashtirilgan)</h3>
          <p className="text-sm text-slate-700">
            Har oyning 1-kuni o'tgan oy zakazlari avtomatik Excel'ga eksport qilinadi va Email orqali yuboriladi.
            Foto-arxiv har 6 oyda ZIP'ga yig'ilib Google Drive'ga yuklanadi.
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
