"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Database, Download, RefreshCw, CheckCircle2, AlertCircle, Clock, HardDrive, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const BACKUPS = [
  { id: 1, date: "2026-05-02 02:00:00", type: "auto", size: "284 MB", status: "success", files: 86_400, retention: "30 kun" },
  { id: 2, date: "2026-05-01 02:00:00", type: "auto", size: "281 MB", status: "success", files: 85_120, retention: "30 kun" },
  { id: 3, date: "2026-04-30 02:00:00", type: "auto", size: "280 MB", status: "success", files: 84_780, retention: "30 kun" },
  { id: 4, date: "2026-04-29 14:25:00", type: "manual", size: "279 MB", status: "success", files: 84_520, retention: "Doimiy", note: "Major release pre-deploy" },
  { id: 5, date: "2026-04-29 02:00:00", type: "auto", size: "278 MB", status: "success", files: 84_120, retention: "30 kun" },
  { id: 6, date: "2026-04-28 02:00:00", type: "auto", size: "276 MB", status: "warn", files: 83_840, retention: "30 kun", note: "Disk 89% to'lgan" },
  { id: 7, date: "2026-04-27 02:00:00", type: "auto", size: "0 MB", status: "fail", files: 0, retention: "—", note: "Network timeout" },
]

const STATUS_CFG: Record<string, { color: string; bg: string; text: string; icon: any; label: string }> = {
  success: { color: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2, label: "Muvaffaqiyatli" },
  warn: { color: "amber", bg: "bg-amber-100", text: "text-amber-700", icon: AlertCircle, label: "Ogohlantirish" },
  fail: { color: "rose", bg: "bg-rose-100", text: "text-rose-700", icon: AlertCircle, label: "Xato" },
}

export default function BackupPage() {
  const [running, setRunning] = useState(false)

  const triggerBackup = () => {
    setRunning(true)
    toast.info("Backup boshlandi...")
    setTimeout(() => {
      setRunning(false)
      toast.success("Backup yakunlandi: 285 MB")
    }, 3000)
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Backup boshqaruvi</h1>
            <p className="text-base text-slate-500 mt-1">Avtomatik kunlik backup · Manual ham mumkin · {BACKUPS.length} ta saqlangan</p>
          </div>
          <Button onClick={triggerBackup} disabled={running} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {running ? "Backup..." : "Manual backup"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300 border-2">
            <Database className="w-7 h-7 text-emerald-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-emerald-700">So'nggi backup</div>
            <div className="text-base font-bold text-slate-900 mt-1">2026-05-02</div>
            <div className="text-xs text-slate-600 mt-1">02:00 · 284 MB · ✓ OK</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 border-2">
            <Clock className="w-7 h-7 text-blue-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-blue-700">Keyingi auto</div>
            <div className="text-base font-bold text-slate-900 mt-1">2026-05-03</div>
            <div className="text-xs text-slate-600 mt-1">02:00 · 14 soatdan keyin</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-300 border-2">
            <HardDrive className="w-7 h-7 text-violet-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-violet-700">Disk</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">42%</div>
            <div className="text-xs text-slate-600 mt-1">21 / 50 GB ishlatildi</div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-300 border-2">
            <Database className="w-7 h-7 text-amber-600 bg-white p-1.5 rounded-xl shadow-sm mb-2" />
            <div className="text-xs font-bold text-amber-700">Saqlanish</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">30 kun</div>
            <div className="text-xs text-slate-600 mt-1">avto backup uchun</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Backup tarixi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
                  <th className="py-3 px-2 font-semibold text-slate-600">№</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Sana / Vaqt</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Tur</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Hajm</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-right">Fayllar</th>
                  <th className="py-3 px-2 font-semibold text-slate-600">Saqlanish</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Holat</th>
                  <th className="py-3 px-2 font-semibold text-slate-600 text-center">Amal</th>
                </tr>
              </thead>
              <tbody>
                {BACKUPS.map((b: any) => {
                  const cfg = STATUS_CFG[b.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-400 font-mono">#{b.id}</td>
                      <td className="py-3 px-2 font-mono text-xs">{b.date}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${b.type === "manual" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                          {b.type === "manual" ? "Manual" : "Avto"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold">{b.size}</td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">{b.files.toLocaleString()}</td>
                      <td className="py-3 px-2 text-xs text-slate-600">{b.retention}{b.note ? ` · ${b.note}` : ""}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex gap-1">
                          {b.status === "success" && (
                            <button onClick={() => toast.success("Yuklab olinmoqda...")} className="p-1.5 hover:bg-blue-100 rounded-lg" title="Yuklab olish">
                              <Download className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                          <button onClick={() => toast.error("Backup o'chirildi")} className="p-1.5 hover:bg-rose-100 rounded-lg" title="O'chirish">
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/30 border-2 border-blue-200">
          <h3 className="text-base font-bold text-blue-900 mb-2">💡 Tavsiya</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Avto backup har kuni soat 02:00 da bajariladi</li>
            <li>• 30 kundan eskii avto backup'lar avtomatik o'chiriladi</li>
            <li>• Manual backup'lar doimiy saqlanadi (release oldidan tavsiya etiladi)</li>
            <li>• Disk 80% to'lganda ogohlantirish keladi</li>
            <li>• Backup'lar AES-256 bilan shifrlangan</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  )
}
