"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, XCircle, FileText, Eye, RotateCcw } from "lucide-react"
import Link from "next/link"

type ImportJob = {
  id: number; fileName: string; type: string;
  uploadedAt: string; uploadedBy: string;
  totalRows: number; successRows: number; errorRows: number; skippedRows: number;
  status: "success" | "partial" | "failed";
  size: string;
}

const JOBS: ImportJob[] = [
  { id: 1, fileName: "tovarlar_2026_05.xlsx", type: "Tovarlar", uploadedAt: "2026-05-02 10:25", uploadedBy: "Mashrab", totalRows: 178, successRows: 178, errorRows: 0, skippedRows: 0, status: "success", size: "640 KB" },
  { id: 2, fileName: "klientlar_yangi.xlsx", type: "Klientlar", uploadedAt: "2026-05-01 14:30", uploadedBy: "Mashrab", totalRows: 124, successRows: 118, errorRows: 4, skippedRows: 2, status: "partial", size: "284 KB" },
  { id: 3, fileName: "narxlar_uploads.csv", type: "Narxlar", uploadedAt: "2026-04-30 16:45", uploadedBy: "Mashrab", totalRows: 178, successRows: 178, errorRows: 0, skippedRows: 0, status: "success", size: "32 KB" },
  { id: 4, fileName: "buggy_export.xlsx", type: "Tovarlar", uploadedAt: "2026-04-29 11:20", uploadedBy: "Karimov A.", totalRows: 50, successRows: 0, errorRows: 50, skippedRows: 0, status: "failed", size: "120 KB" },
  { id: 5, fileName: "klient_tug_ilgan_kun.xlsx", type: "Klientlar", uploadedAt: "2026-04-28 09:10", uploadedBy: "Mashrab", totalRows: 624, successRows: 612, errorRows: 8, skippedRows: 4, status: "partial", size: "1.8 MB" },
  { id: 6, fileName: "agentlar_2026.xlsx", type: "Foydalanuvchilar", uploadedAt: "2026-04-15 12:00", uploadedBy: "Mashrab", totalRows: 12, successRows: 12, errorRows: 0, skippedRows: 0, status: "success", size: "18 KB" },
  { id: 7, fileName: "barcode_uploads_april.csv", type: "Tovarlar", uploadedAt: "2026-04-12 18:30", uploadedBy: "Karimov A.", totalRows: 240, successRows: 240, errorRows: 0, skippedRows: 0, status: "success", size: "84 KB" },
  { id: 8, fileName: "old_format.xlsx", type: "Tovarlar", uploadedAt: "2026-04-10 14:15", uploadedBy: "Mashrab", totalRows: 100, successRows: 0, errorRows: 100, skippedRows: 0, status: "failed", size: "240 KB" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

const STATUS_COLOR: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-300",
  partial: "bg-amber-100 text-amber-700 border-amber-300",
  failed: "bg-rose-100 text-rose-700 border-rose-300",
}

const STATUS_ICON = (s: string) => {
  if (s === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
  if (s === "partial") return <AlertTriangle className="w-5 h-5 text-amber-600" />
  return <XCircle className="w-5 h-5 text-rose-600" />
}

export default function ImportHistoryPage() {
  const totalSuccess = JOBS.reduce((s, j) => s + j.successRows, 0)
  const totalError = JOBS.reduce((s, j) => s + j.errorRows, 0)
  const successRate = Math.round((totalSuccess / (totalSuccess + totalError)) * 100)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Upload className="w-7 h-7 text-blue-600" />
              Import tarixi
            </h1>
            <p className="text-sm text-slate-500">{JOBS.length} ta import · {fmt(totalSuccess)} muvaffaqiyatli yozuv · {successRate}% success rate</p>
          </div>
          <Button className="gap-2"><Upload className="w-4 h-4" /> Yangi import</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Success</div>
            <div className="text-2xl font-bold mt-1">{JOBS.filter(j => j.status === "success").length}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Partial</div>
            <div className="text-2xl font-bold mt-1">{JOBS.filter(j => j.status === "partial").length}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <XCircle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Failed</div>
            <div className="text-2xl font-bold mt-1">{JOBS.filter(j => j.status === "failed").length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs font-bold text-blue-700">Success rate</div>
            <div className="text-2xl font-bold mt-1">{successRate}%</div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-10">#</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Fayl nomi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Tip</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Sana / Foydalanuvchi</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Jami</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Success</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Error</th>
                  <th className="border border-slate-300 py-2 px-3 text-right">Skip</th>
                  <th className="border border-slate-300 py-2 px-3 text-center">Holat</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-32"></th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map(j => {
                  const successPct = Math.round((j.successRows / j.totalRows) * 100)
                  return (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 text-center">{STATUS_ICON(j.status)}</td>
                      <td className="border border-slate-300 py-2 px-3">
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          {j.fileName}
                        </div>
                        <div className="text-xs text-slate-500">💾 {j.size}</div>
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{j.type}</span>
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-xs">
                        <div className="font-mono">{j.uploadedAt}</div>
                        <div className="text-slate-500">{j.uploadedBy}</div>
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-mono">{fmt(j.totalRows)}</td>
                      <td className="border border-slate-300 py-2 px-3 text-right font-mono text-emerald-700 font-bold">{fmt(j.successRows)} ({successPct}%)</td>
                      <td className={`border border-slate-300 py-2 px-3 text-right font-mono ${j.errorRows > 0 ? "text-rose-700 font-bold" : "text-slate-400"}`}>
                        {j.errorRows > 0 ? fmt(j.errorRows) : "—"}
                      </td>
                      <td className={`border border-slate-300 py-2 px-3 text-right font-mono ${j.skippedRows > 0 ? "text-amber-700" : "text-slate-400"}`}>
                        {j.skippedRows > 0 ? fmt(j.skippedRows) : "—"}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLOR[j.status]}`}>
                          {j.status === "success" ? "✓ Success" : j.status === "partial" ? "⚠️ Partial" : "✕ Failed"}
                        </span>
                      </td>
                      <td className="border border-slate-300 py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Log ko'rish"><Eye className="w-4 h-4" /></button>
                          {(j.status === "failed" || j.status === "partial") && (
                            <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Qayta urinish"><RotateCcw className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
