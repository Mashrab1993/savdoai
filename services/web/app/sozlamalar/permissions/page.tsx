"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Save, Crown, User } from "lucide-react"
import Link from "next/link"

type Permission = {
  module: string;
  category: string;
  actions: { read: boolean; write: boolean; delete: boolean };
}

const ROLES = ["admin", "supervizor", "menejer", "agent", "kassir"]
const ROLE_LABEL: Record<string, string> = {
  admin: "👑 Admin",
  supervizor: "🎯 Supervizor",
  menejer: "👔 Menejer",
  agent: "🚶 Agent",
  kassir: "💰 Kassir",
}

const MODULES = [
  { module: "Klientlar", category: "klientlar" },
  { module: "Klient karta", category: "klientlar" },
  { module: "Klient qarz", category: "klientlar" },
  { module: "Sotuv (zakaz)", category: "sotuv" },
  { module: "Qaytarish", category: "sotuv" },
  { module: "Sklad", category: "sklad" },
  { module: "Inventarizatsiya", category: "sklad" },
  { module: "Kassa", category: "moliya" },
  { module: "Xarajat", category: "moliya" },
  { module: "Hisobotlar", category: "hisobot" },
  { module: "Audit", category: "audit" },
  { module: "Foydalanuvchilar", category: "sozlama" },
  { module: "Sozlamalar", category: "sozlama" },
]

const DEFAULT_MATRIX: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {
  admin: Object.fromEntries(MODULES.map(m => [m.module, { read: true, write: true, delete: true }])),
  supervizor: Object.fromEntries(MODULES.map(m => [m.module, { read: true, write: m.module !== "Sozlamalar" && m.module !== "Foydalanuvchilar", delete: false }])),
  menejer: Object.fromEntries(MODULES.map(m => [m.module, { read: m.category !== "sozlama", write: m.category === "sotuv" || m.category === "klientlar", delete: false }])),
  agent: Object.fromEntries(MODULES.map(m => [m.module, { read: m.category === "klientlar" || m.category === "sotuv", write: m.module === "Sotuv (zakaz)", delete: false }])),
  kassir: Object.fromEntries(MODULES.map(m => [m.module, { read: m.category === "moliya" || m.category === "klientlar", write: m.category === "moliya", delete: false }])),
}

export default function PermissionsPage() {
  const [activeRole, setActiveRole] = useState("supervizor")
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX)

  const toggle = (module: string, action: "read" | "write" | "delete") => {
    setMatrix({
      ...matrix,
      [activeRole]: {
        ...matrix[activeRole],
        [module]: {
          ...matrix[activeRole][module],
          [action]: !matrix[activeRole][module][action],
        },
      },
    })
  }

  const stats = Object.values(matrix[activeRole]).reduce((acc, perm) => ({
    read: acc.read + (perm.read ? 1 : 0),
    write: acc.write + (perm.write ? 1 : 0),
    delete: acc.delete + (perm.delete ? 1 : 0),
  }), { read: 0, write: 0, delete: 0 })

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Rollar va huquqlar</h1>
            <p className="text-sm text-slate-500">{ROLES.length} ta rol · {MODULES.length} ta modul · har modul uchun 3 amal (read/write/delete)</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeRole === role ? "bg-emerald-600 text-white shadow-md" : "bg-white border border-slate-300 hover:bg-slate-50"}`}
              >
                {ROLE_LABEL[role]}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Shield className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Read (ko'rish)</div>
            <div className="text-2xl font-bold mt-1">{stats.read} / {MODULES.length}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Shield className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Write (yozish)</div>
            <div className="text-2xl font-bold mt-1">{stats.write} / {MODULES.length}</div>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <Shield className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Delete (o'chirish)</div>
            <div className="text-2xl font-bold mt-1">{stats.delete} / {MODULES.length}</div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            {ROLE_LABEL[activeRole]} huquqlari
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left bg-slate-50">
                  <th className="py-3 px-2">Modul</th>
                  <th className="py-3 px-2 text-center w-28">👁️ Ko'rish</th>
                  <th className="py-3 px-2 text-center w-28">✏️ Yozish</th>
                  <th className="py-3 px-2 text-center w-28">🗑️ O'chirish</th>
                  <th className="py-3 px-2 text-center w-28">Holat</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map(m => {
                  const p = matrix[activeRole][m.module]
                  const fullAccess = p.read && p.write && p.delete
                  const noAccess = !p.read && !p.write && !p.delete
                  return (
                    <tr key={m.module} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-semibold">{m.module}</td>
                      {(["read", "write", "delete"] as const).map(action => (
                        <td key={action} className="py-3 px-2 text-center">
                          <button
                            onClick={() => toggle(m.module, action)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${p[action] ? "bg-emerald-500" : "bg-slate-300"}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p[action] ? "translate-x-6" : ""}`} />
                          </button>
                        </td>
                      ))}
                      <td className="py-3 px-2 text-center">
                        {fullAccess && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ To'liq</span>}
                        {noAccess && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">✕ Yo'q</span>}
                        {!fullAccess && !noAccess && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">~ Qisman</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Crown className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-800">Eslatma</h3>
              <p className="text-sm text-slate-700 mt-1">
                Admin rolini o'zgartirmang — bu sizdan tizim foydalanish imkonini olib qo'yishi mumkin.
                Yangi rol qo'shish kerak bo'lsa, "Foydalanuvchilar" sahifasidan amalga oshiring.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
