"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Hash, Save, RefreshCw } from "lucide-react"
import Link from "next/link"

type Numbering = {
  id: number; type: string; prefix: string;
  format: string; nextNumber: number;
  resetType: "never" | "yearly" | "monthly" | "daily";
  example: string;
}

const INITIAL: Numbering[] = [
  { id: 1, type: "Zakaz", prefix: "Z", format: "{prefix}-{year}-{counter:5}", nextNumber: 9025, resetType: "yearly", example: "Z-2026-09025" },
  { id: 2, type: "Hisob-faktura", prefix: "INV", format: "{prefix}-{year}-{counter:5}", nextNumber: 1841, resetType: "yearly", example: "INV-2026-01841" },
  { id: 3, type: "Yetkazma (TT-2)", prefix: "TT", format: "{prefix}-{counter:7}", nextNumber: 7025, resetType: "never", example: "TT-0007025" },
  { id: 4, type: "Klient", prefix: "C", format: "{prefix}{counter:5}", nextNumber: 1656, resetType: "never", example: "C01656" },
  { id: 5, type: "Tovar (SKU)", prefix: "F", format: "{prefix}{counter:4}", nextNumber: 21, resetType: "never", example: "F0021" },
  { id: 6, type: "Postupleniе (kirim)", prefix: "PO", format: "{prefix}-{ymd}-{counter:3}", nextNumber: 1, resetType: "daily", example: "PO-20260502-001" },
  { id: 7, type: "Qaytarish (return)", prefix: "R", format: "{prefix}-{year}-{counter:4}", nextNumber: 16, resetType: "yearly", example: "R-2026-0016" },
  { id: 8, type: "Shartnoma", prefix: "C", format: "{prefix}-{year}-{counter:4}", nextNumber: 25, resetType: "yearly", example: "C-2026-0025" },
  { id: 9, type: "Inventarizatsiya", prefix: "INV", format: "{prefix}-{ymd}", nextNumber: 1, resetType: "daily", example: "INV-20260502" },
  { id: 10, type: "KP (taklif)", prefix: "KP", format: "{prefix}-{year}-{counter:4}", nextNumber: 43, resetType: "yearly", example: "KP-2026-0043" },
]

const RESET_LABEL: Record<string, string> = {
  never: "🔁 Hech qachon", yearly: "📅 Har yili", monthly: "📅 Har oyda", daily: "📅 Har kuni",
}

export default function NumberingPage() {
  const [nums, setNums] = useState(INITIAL)

  const update = (id: number, field: keyof Numbering, value: any) => {
    setNums(nums.map(n => n.id === id ? { ...n, [field]: value } : n))
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Hash className="w-7 h-7 text-emerald-600" />
              Hujjat raqamlash qoidalari
            </h1>
            <p className="text-sm text-slate-500">{nums.length} ta hujjat turi · prefiks va format sozlash</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Format placeholderlari:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="font-mono px-1.5 py-0.5 bg-white rounded">{"{prefix}"}</span> — prefiks</div>
            <div><span className="font-mono px-1.5 py-0.5 bg-white rounded">{"{year}"}</span> — 2026</div>
            <div><span className="font-mono px-1.5 py-0.5 bg-white rounded">{"{ymd}"}</span> — 20260502</div>
            <div><span className="font-mono px-1.5 py-0.5 bg-white rounded">{"{counter:5}"}</span> — 00001 (5 raqam)</div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-2 px-3 text-left">Hujjat turi</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-24">Prefiks</th>
                  <th className="border border-slate-300 py-2 px-3 text-left w-64">Format</th>
                  <th className="border border-slate-300 py-2 px-3 text-right w-28">Keyingi raqam</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-32">Reset</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">Misol</th>
                  <th className="border border-slate-300 py-2 px-3 text-center w-32"></th>
                </tr>
              </thead>
              <tbody>
                {nums.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-3 font-bold">{n.type}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <Input value={n.prefix} onChange={e => update(n.id, "prefix", e.target.value)} className="h-8 font-mono text-center font-bold" />
                    </td>
                    <td className="border border-slate-300 py-2 px-3">
                      <Input value={n.format} onChange={e => update(n.id, "format", e.target.value)} className="h-8 font-mono text-xs" />
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-right">
                      <Input type="number" value={n.nextNumber} onChange={e => update(n.id, "nextNumber", Number(e.target.value))} className="h-8 font-mono text-right" />
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <select value={n.resetType} onChange={e => update(n.id, "resetType", e.target.value)} className="h-8 border border-slate-300 rounded text-xs px-2">
                        {Object.entries(RESET_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-mono text-emerald-700 font-bold">{n.example}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        <RefreshCw className="w-3 h-3" /> Reset
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <h3 className="font-bold text-amber-800 mb-2">⚠️ Diqqat</h3>
          <p className="text-sm text-slate-700">
            Raqamlash qoidalarini o'zgartirish faqat kelajakdagi hujjatlarga ta'sir qiladi.
            Mavjud hujjatlar raqamlari avvalgi formatda qoladi.
            "Reset" tugmasi keyingi raqamni 1ga qaytaradi (ehtiyot bo'ling — raqamlar takrorlanmasligi uchun).
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}
