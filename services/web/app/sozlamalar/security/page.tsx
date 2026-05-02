"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Shield, Key, Lock, AlertTriangle, Smartphone, Globe, Save } from "lucide-react"
import Link from "next/link"

export default function SecurityPage() {
  const [twoFA, setTwoFA] = useState(true)
  const [pwdPolicy, setPwdPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecial: false,
    expiryDays: 90,
  })
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [ipWhitelist] = useState([
    { id: 1, ip: "188.95.165.40", description: "Mashrab home", lastUsed: "2026-05-02 16:00" },
    { id: 2, ip: "92.241.50.0/24", description: "Office network", lastUsed: "2026-05-02 15:45" },
    { id: 3, ip: "82.215.0.0/16", description: "Sirdaryo region", lastUsed: "2026-04-30 12:00" },
  ])
  const [failedAttempts] = useState([
    { id: 1, ip: "144.31.122.18", attempts: 12, lastAt: "2026-05-02 08:55", blocked: true },
    { id: 2, ip: "78.45.122.99", attempts: 5, lastAt: "2026-05-01 22:30", blocked: false },
    { id: 3, ip: "203.0.113.45", attempts: 24, lastAt: "2026-04-30 14:00", blocked: true },
  ])

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-rose-600" />
              Xavfsizlik sozlamalari
            </h1>
            <p className="text-sm text-slate-500">2FA, parol policy, IP whitelist, login monitoring</p>
          </div>
          <Button className="gap-2"><Save className="w-4 h-4" /> Saqlash</Button>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300">
          <div className="flex items-center gap-3">
            <Shield className="w-12 h-12 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-emerald-700">XAVFSIZLIK DARAJASI</div>
              <h2 className="text-3xl font-bold">A+ (Yuqori)</h2>
              <p className="text-sm text-slate-600">Barcha asosiy himoyalar yoqilgan</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> 2FA: ✓</div>
            <div className="flex items-center gap-2"><Key className="w-4 h-4 text-emerald-600" /> Parol policy: ✓</div>
            <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-600" /> IP whitelist: ✓</div>
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-emerald-600" /> Brute-force: ✓</div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-emerald-600" /> Ikki bosqichli autentifikatsiya (2FA)</h2>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setTwoFA(!twoFA)} className={`w-14 h-7 rounded-full relative transition-colors ${twoFA ? "bg-emerald-500" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${twoFA ? "translate-x-7" : ""}`} />
            </button>
            <span className="font-bold">{twoFA ? "Yoqilgan" : "O'chirilgan"}</span>
          </div>
          <p className="text-sm text-slate-600">
            Login qilishda har safar Telegram bot orqali kod yuboriladi. Bu yo'qotilgan parolda ham xavfsizlikni ta'minlaydi.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> Parol policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Minimal uzunlik</label>
              <Input type="number" value={pwdPolicy.minLength} onChange={e => setPwdPolicy({ ...pwdPolicy, minLength: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Eskirish (kun)</label>
              <Input type="number" value={pwdPolicy.expiryDays} onChange={e => setPwdPolicy({ ...pwdPolicy, expiryDays: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="upper" checked={pwdPolicy.requireUppercase} onChange={e => setPwdPolicy({ ...pwdPolicy, requireUppercase: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="upper" className="text-sm">Katta harf majburiy (A-Z)</label>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="num" checked={pwdPolicy.requireNumbers} onChange={e => setPwdPolicy({ ...pwdPolicy, requireNumbers: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="num" className="text-sm">Raqam majburiy (0-9)</label>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="spec" checked={pwdPolicy.requireSpecial} onChange={e => setPwdPolicy({ ...pwdPolicy, requireSpecial: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="spec" className="text-sm">Maxsus simvol majburiy (!@#$%)</label>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-violet-600" /> Sessiya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Sessiya timeout (minut)</label>
              <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Maksimal parallel sessiya</label>
              <Input type="number" defaultValue={3} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-600" /> IP Whitelist (faqat shu IPlardan kirish)</h2>
          <div className="space-y-2">
            {ipWhitelist.map(ip => (
              <div key={ip.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-mono font-bold">{ip.ip}</div>
                  <div className="text-xs text-slate-500">{ip.description}</div>
                </div>
                <div className="text-xs text-slate-500">Oxirgi: {ip.lastUsed}</div>
                <Button size="sm" variant="outline" className="h-7 text-xs">O'chirish</Button>
              </div>
            ))}
          </div>
          <Button className="mt-3 gap-2"><Globe className="w-4 h-4" /> IP qo'shish</Button>
        </Card>

        <Card className="p-5 bg-rose-50 border-rose-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-600" /> Failed login urinishlar (24 soat)</h2>
          <div className="space-y-2">
            {failedAttempts.map(f => (
              <div key={f.id} className={`flex items-center gap-3 p-3 rounded-lg ${f.blocked ? "bg-rose-100" : "bg-amber-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${f.blocked ? "text-rose-600" : "text-amber-600"}`} />
                <div className="flex-1">
                  <div className="font-mono font-bold">{f.ip}</div>
                  <div className="text-xs text-slate-700">{f.attempts} marta urinish · oxirgi: {f.lastAt}</div>
                </div>
                {f.blocked
                  ? <span className="text-xs px-2 py-0.5 rounded bg-rose-700 text-white font-bold">🚫 BLOKED</span>
                  : <Button size="sm" className="h-7 text-xs bg-rose-600 hover:bg-rose-700">Bloklash</Button>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
