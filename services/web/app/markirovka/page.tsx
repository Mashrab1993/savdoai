"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ScanLine, Search, Download, CheckCircle2, AlertCircle, FileText, Camera } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const SCAN_HISTORY = [
  { id: 1, date: "2026-05-02 10:25", code: "010460012345789012345678", product: "Choco-Boom 75g", status: "success", direction: "Postuplenie" },
  { id: 2, date: "2026-05-02 10:24", code: "010460012345789098765432", product: "Coca-Cola 1.5L", status: "success", direction: "Postuplenie" },
  { id: 3, date: "2026-05-02 10:18", code: "010460012345789011223344", product: "Bonjur Молочный 50g", status: "success", direction: "Otgruzka" },
  { id: 4, date: "2026-05-02 10:16", code: "010460012345789055667788", product: "Sok Apelsin 1L", status: "duplicate", direction: "Otgruzka" },
  { id: 5, date: "2026-05-02 09:45", code: "010460012345789099887766", product: "Pechenye Yubileynoye", status: "success", direction: "Otgruzka" },
  { id: 6, date: "2026-05-02 09:30", code: "INVALID_CODE_123", product: "—", status: "error", direction: "Postuplenie" },
]

export default function MarkirovkaPage() {
  const [scanCode, setScanCode] = useState("")
  const [direction, setDirection] = useState<"in" | "out">("in")

  const handleScan = () => {
    if (!scanCode.trim()) {
      toast.error("DataMatrix kod kiriting")
      return
    }
    toast.success(`Kod skanlangan: ${scanCode.slice(0, 30)}...`)
    setScanCode("")
  }

  const successCount = SCAN_HISTORY.filter(h => h.status === "success").length
  const errorCount = SCAN_HISTORY.filter(h => h.status === "error").length

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Маркировка (DataMatrix)</h1>
            <p className="text-sm text-slate-500">Markirovka kodlarni skan qilish va tasdiqlash</p>
          </div>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Muvaffaqiyatli</div>
            <div className="text-2xl font-bold mt-1">{successCount}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Xato</div>
            <div className="text-2xl font-bold mt-1">{errorCount}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <ScanLine className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Bugun</div>
            <div className="text-2xl font-bold mt-1">{SCAN_HISTORY.length}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <FileText className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Total saved</div>
            <div className="text-2xl font-bold mt-1">14 280</div>
          </Card>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-emerald-600" /> Yangi DataMatrix kod
          </h2>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setDirection("in")} className={`px-4 py-2 text-sm font-semibold rounded ${direction === "in" ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>
              ↓ Postuplenie (kirim)
            </button>
            <button onClick={() => setDirection("out")} className={`px-4 py-2 text-sm font-semibold rounded ${direction === "out" ? "bg-blue-600 text-white" : "bg-white border border-slate-300"}`}>
              ↑ Otgruzka (chiqim)
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ScanLine className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={scanCode}
                onChange={e => setScanCode(e.target.value)}
                placeholder="Skaner orqali kod kiriting yoki qo'lda yozing..."
                className="pl-12 h-12 text-base font-mono"
                onKeyDown={e => e.key === "Enter" && handleScan()}
              />
            </div>
            <Button onClick={handleScan} className="gap-2 h-12 px-6"><Camera className="w-5 h-5" /> Skanlash</Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">💡 USB-skaner yoki kamera orqali avtomatik skan qilinadi. Enter — qo'shish.</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">So'nggi skanlar</h2>
            <span className="text-xs text-slate-500">{SCAN_HISTORY.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-2 w-12">#</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Sana / Vaqt</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">DataMatrix kod</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Tovar</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Yo'nalish</th>
                  <th className="border border-slate-300 py-2 px-2 text-center">Holat</th>
                </tr>
              </thead>
              <tbody>
                {SCAN_HISTORY.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-xs">{s.date}</td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-xs break-all max-w-[280px]">{s.code}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{s.product}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${s.direction === "Postuplenie" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {s.direction === "Postuplenie" ? "↓ Kirim" : "↑ Chiqim"}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      {s.status === "success" ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 inline mr-1" />OK</span>
                        : s.status === "duplicate" ? <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⚠ Dublikat</span>
                        : <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700"><AlertCircle className="w-3 h-3 inline mr-1" />Xato</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
