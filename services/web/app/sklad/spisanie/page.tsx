"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Search, Trash2, Package } from "lucide-react"
import Link from "next/link"

const MOCK = [
  { id: "s_001", date: "2026-05-02", reason: "Brak", warehouse: "Asosiy", items: 5, total: 125_000, status: "approved" },
  { id: "s_002", date: "2026-05-01", reason: "Yaroqlilik tugagan", warehouse: "Химия", items: 12, total: 540_000, status: "approved" },
  { id: "s_003", date: "2026-04-30", reason: "O'g'irlik", warehouse: "Asosiy", items: 3, total: 88_000, status: "pending" },
  { id: "s_004", date: "2026-04-28", reason: "Inventarizatsiya farqi", warehouse: "VS", items: 8, total: 312_000, status: "approved" },
]

export default function SpisaniePage() {
  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/sklad" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Sklad
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🗑️ Spisanie</h1>
            <p className="text-base text-slate-500 mt-1">Hisobdan chiqarish · {MOCK.length} hujjat · {MOCK.reduce((s, x) => s + x.total, 0).toLocaleString()} so'm zarar</p>
          </div>
          <Button size="lg">
            <Plus className="w-5 h-5" /> Yangi spisanie
          </Button>
        </div>

        <Card>
          <table className="w-full">
            <thead className="border-b-2 border-slate-200 bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Sana</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Sabab</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Sklad</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Tovar</th>
                <th className="text-right px-4 py-3 text-sm font-semibold">Zarar</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-emerald-700">{s.id}</td>
                  <td className="px-4 py-3 text-sm">{s.date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.reason === "Brak" ? "bg-rose-100 text-rose-700" :
                      s.reason === "O'g'irlik" ? "bg-purple-100 text-purple-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{s.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.warehouse}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.items}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-rose-600">{s.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>{s.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-rose-50">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold">Jami zarar:</td>
                <td className="px-4 py-3 text-right tabular-nums text-xl font-bold text-rose-700">
                  {MOCK.reduce((s, x) => s + x.total, 0).toLocaleString()} so'm
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
    </AdminLayout>
  )
}
