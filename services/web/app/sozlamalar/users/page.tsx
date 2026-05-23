"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApi, useAuth, api } from "@/hooks/use-api"
import { toast } from "sonner"
import {
  ArrowLeft, Plus, Users, Shield, ShoppingBag, Truck, ClipboardCheck,
  Copy, Check, Trash2, Settings2, AlertCircle, ChevronRight
} from "lucide-react"

type Me = {
  id: number
  ism?: string
  dokon_nomi?: string
  company_kod?: string
  role?: string
}

type Agent = {
  agent_id: number
  ism: string
  telefon: string
  login: string
  role: "owner" | "admin" | "sotuvchi" | "agent" | "merchant" | "supervisor"
  permissions: Record<string, boolean>
  faol: boolean
  qo_shilgan: string | null
  oxirgi_ulansh: string | null
  boshqa_firma_soni: number
}

const ROLE_LABEL: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:      { label: "Egasi",         icon: Shield,         color: "purple" },
  admin:      { label: "Administrator", icon: Shield,         color: "blue" },
  sotuvchi:   { label: "Sotuvchi",      icon: ShoppingBag,    color: "emerald" },
  agent:      { label: "Agent",         icon: Truck,          color: "orange" },
  supervisor: { label: "Supervisor",    icon: Users,          color: "indigo" },
  merchant:   { label: "Merchant",      icon: ClipboardCheck, color: "cyan" },
}

const PERMISSION_LABELS: Record<string, string> = {
  sotuv: "Sotuv qilish",
  kirim: "Kirim (tovar) qabul qilish",
  klient: "Mijoz qo'shish",
  narx_o_zgartirish: "Narx o'zgartirish",
  qaytarish: "Sotuv qaytarish",
  qarz: "Qarz boshqaruvi",
  kassa: "Kassa amallari",
  hisobot: "Hisobotlarni ko'rish",
  eksport: "Excel/PDF eksport",
  team: "Xodimlarni boshqarish",
}

export default function TeamPage() {
  const { isAuthenticated } = useAuth()
  const { data: me } = useApi<Me>(isAuthenticated ? "/api/v1/me_v2" : null)
  const { data: agents, mutate } = useApi<Agent[]>(
    isAuthenticated ? "/api/v1/team/agents" : null
  )
  const [showAdd, setShowAdd] = useState(false)
  const [showPermissions, setShowPermissions] = useState<Agent | null>(null)
  const [kodCopied, setKodCopied] = useState(false)

  const isOwnerOrAdmin = me?.role === "owner" || me?.role === "admin"

  function copyKod() {
    if (!me?.company_kod) return
    navigator.clipboard.writeText(me.company_kod)
    setKodCopied(true)
    setTimeout(() => setKodCopied(false), 2000)
    toast.success("Kod nusxalandi")
  }

  async function removeAgent(agent: Agent) {
    if (!confirm(`${agent.ism}'ni firma'dan o'chirasizmi? (qaytarib olish mumkin)`)) return
    try {
      await api.delete(`/api/v1/team/remove_agent_from_company`, {
        data: { agent_id: agent.agent_id },
      })
      toast.success(`${agent.ism} o'chirildi`)
      mutate?.()
    } catch (err) {
      toast.error((err as { detail?: string })?.detail || "Xato")
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Jamoa</h1>
            <p className="text-base text-slate-500 mt-1">
              Sotuvchilar, agentlar, administratorlar
              {!isAuthenticated && <span className="ml-2 text-amber-600 text-xs">⚠ Login kerak</span>}
            </p>
          </div>
          {isOwnerOrAdmin && (
            <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1.5" /> Yangi xodim
            </Button>
          )}
        </div>

        {me?.company_kod && (
          <Card className="p-5 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs uppercase font-semibold text-emerald-700">
                  Sizning kompaniya kodingiz
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {me.company_kod}
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  Xodimlaringiz <code className="bg-white px-1.5 py-0.5 rounded text-xs">{me.company_kod}</code> kompaniya kodi + o'z logini bilan kiradi.
                  URL: <code className="bg-white px-1.5 py-0.5 rounded text-xs">{me.company_kod}.savdoai.uz</code>
                </div>
              </div>
              <button
                onClick={copyKod}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"
              >
                {kodCopied ? (
                  <><Check className="w-4 h-4 text-emerald-600" /> Nusxalandi</>
                ) : (
                  <><Copy className="w-4 h-4" /> Nusxa olish</>
                )}
              </button>
            </div>
          </Card>
        )}

        {showAdd && isOwnerOrAdmin && (
          <AddAgentForm
            onClose={() => setShowAdd(false)}
            onSuccess={() => {
              setShowAdd(false)
              mutate?.()
            }}
            company_kod={me?.company_kod || ""}
          />
        )}

        {showPermissions && isOwnerOrAdmin && (
          <PermissionsModal
            agent={showPermissions}
            onClose={() => setShowPermissions(null)}
            onSuccess={() => {
              setShowPermissions(null)
              mutate?.()
            }}
          />
        )}

        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Jamoa a'zolari
            <span className="text-slate-500 font-normal">
              ({agents?.length ?? 0} ta)
            </span>
          </div>

          {!agents || agents.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">Hali xodim qo'shilmagan</p>
              {isOwnerOrAdmin && (
                <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1.5" /> Birinchi xodimni qo'shish
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {agents.map((a) => {
                const roleInfo = ROLE_LABEL[a.role] || ROLE_LABEL.sotuvchi
                const Icon = roleInfo.icon
                const shortLogin = a.login?.split("-").slice(1).join("-") || a.login
                return (
                  <div key={a.agent_id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                    <div className={`w-10 h-10 rounded-full bg-${roleInfo.color}-100 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 text-${roleInfo.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                        {a.ism}
                        {!a.faol && <span className="text-xs text-red-600">(faol emas)</span>}
                        {a.boshqa_firma_soni > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            +{a.boshqa_firma_soni} firma
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="font-mono text-xs">@{shortLogin}</span>
                        <span>{a.telefon}</span>
                        {a.oxirgi_ulansh && (
                          <span className="text-xs">
                            · oxirgi: {new Date(a.oxirgi_ulansh).toLocaleDateString("uz-UZ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${roleInfo.color}-100 text-${roleInfo.color}-700`}>
                      {roleInfo.label}
                    </div>
                    {isOwnerOrAdmin && a.role !== "owner" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowPermissions(a)}
                          className="p-2 hover:bg-slate-200 rounded text-slate-600"
                          title="Ruxsatlar"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeAgent(a)}
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Rollar haqida
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-900">
            <RoleHelp icon={Shield} color="purple" name="Egasi"
              desc="Hammasini ko'radi va sozlaydi. To'lov egasi." />
            <RoleHelp icon={Shield} color="blue" name="Administrator"
              desc="Egasi darajadagi imkoniyatlar (to'lov sozlash yo'q)." />
            <RoleHelp icon={ShoppingBag} color="emerald" name="Sotuvchi"
              desc="Kassada sotadi, ovoz bilan buyurtma, klient qo'shadi." />
            <RoleHelp icon={Truck} color="orange" name="Agent"
              desc="Yo'lda, GPS bilan kuzatiladi. Tashrif, zayavka." />
            <RoleHelp icon={Users} color="indigo" name="Supervisor"
              desc="Agentlarni boshqaradi, vizit nazorat qiladi." />
            <RoleHelp icon={ClipboardCheck} color="cyan" name="Merchant"
              desc="Merchandising, fototaqrir, audit." />
          </div>
        </Card>

        <Card className="p-5 bg-emerald-50 border-emerald-200">
          <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Multi-firma support (SalesDoc tipida)
          </h3>
          <p className="text-sm text-emerald-900">
            Bir agent bir nechta firma'ga ulanib ishlay oladi. Agent APK'sida firma tanlash ekrani chiqadi.
            Har firma data'si (tovar, mijoz, sotuv, rasm) <strong>alohida-alohida</strong> bo'ladi — chalkashmaydi.
          </p>
          <p className="text-sm text-emerald-700 mt-2">
            Mavjud agent'ni boshqa firma'ga qo'shish: "Yangi xodim" → telefon raqamini kiriting (agent allaqachon bor bo'lsa, avtomatik qo'shiladi).
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}

function RoleHelp({
  icon: Icon, color, name, desc,
}: { icon: React.ElementType; color: string; name: string; desc: string }) {
  return (
    <div className="flex gap-2">
      <Icon className={`w-4 h-4 text-${color}-600 shrink-0 mt-0.5`} />
      <div><b>{name}</b> — {desc}</div>
    </div>
  )
}

function AddAgentForm({
  onClose, onSuccess, company_kod,
}: { onClose: () => void; onSuccess: () => void; company_kod: string }) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"existing" | "new">("new")
  const [form, setForm] = useState({
    agent_telefon: "+998",
    ism: "",
    login: "",
    parol: "",
    role: "sotuvchi" as Agent["role"],
    permissions: {
      sotuv: true,
      kirim: false,
      klient: true,
      narx_o_zgartirish: false,
      qaytarish: false,
      qarz: false,
      kassa: false,
      hisobot: false,
      eksport: false,
      team: false,
    },
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        agent_telefon: form.agent_telefon,
        role: form.role,
        permissions: form.permissions,
      }
      if (mode === "new") {
        payload.ism = form.ism
        payload.login = form.login
        payload.parol = form.parol
      }
      await api.post("/api/v1/team/add_agent_to_company", payload)
      toast.success(`Xodim qo'shildi`)
      onSuccess()
    } catch (err) {
      toast.error((err as { detail?: string })?.detail || "Xato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border-2 border-emerald-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Yangi xodim qo'shish</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`px-3 py-2 rounded text-sm font-medium ${
            mode === "new" ? "bg-white shadow-sm" : "text-slate-600"
          }`}
        >
          Yangi xodim
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`px-3 py-2 rounded text-sm font-medium ${
            mode === "existing" ? "bg-white shadow-sm" : "text-slate-600"
          }`}
        >
          Mavjud (boshqa firma'da bor)
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Telefon</label>
            <Input
              type="tel"
              value={form.agent_telefon}
              onChange={(e) => setForm((f) => ({ ...f, agent_telefon: e.target.value }))}
              required
              placeholder="+998901234567"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Roli</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Agent["role"] }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="sotuvchi">Sotuvchi</option>
              <option value="admin">Administrator</option>
              <option value="agent">Agent (yo'lda)</option>
              <option value="supervisor">Supervisor</option>
              <option value="merchant">Merchant</option>
            </select>
          </div>

          {mode === "new" && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Ism Familiya</label>
                <Input
                  value={form.ism}
                  onChange={(e) => setForm((f) => ({ ...f, ism: e.target.value }))}
                  required
                  placeholder="Bobur Aliyev"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Login</label>
                <Input
                  value={form.login}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      login: e.target.value.toLowerCase().replace(/[^a-z0-9_\-\.]/g, ""),
                    }))
                  }
                  required
                  minLength={3}
                  placeholder="bobur"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Full: <code className="font-mono">{company_kod}-{form.login || "..."}</code>
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Parol</label>
                <Input
                  type="text"
                  value={form.parol}
                  onChange={(e) => setForm((f) => ({ ...f, parol: e.target.value }))}
                  required
                  minLength={4}
                  placeholder="1234"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Ruxsatlar (qaysi amallarni qila oladi)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.permissions[key as keyof typeof form.permissions]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      permissions: { ...f.permissions, [key]: e.target.checked },
                    }))
                  }
                  className="rounded"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Qo'shilmoqda..." : "Qo'shish"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Card>
  )
}

function PermissionsModal({
  agent, onClose, onSuccess,
}: { agent: Agent; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState(agent.permissions || {})
  const [role, setRole] = useState(agent.role)
  const [faol, setFaol] = useState(agent.faol)

  async function save() {
    setLoading(true)
    try {
      await api.patch("/api/v1/team/agent/permissions", {
        agent_id: agent.agent_id,
        role,
        permissions,
        faol,
      })
      toast.success("Saqlandi")
      onSuccess()
    } catch (err) {
      toast.error((err as { detail?: string })?.detail || "Xato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{agent.ism}</h3>
            <p className="text-sm text-slate-500">{agent.telefon}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Roli</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Agent["role"])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="sotuvchi">Sotuvchi</option>
              <option value="admin">Administrator</option>
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="merchant">Merchant</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={faol}
                onChange={(e) => setFaol(e.target.checked)}
                className="rounded"
              />
              <span>Faol (vaqtinchalik o'chirib qo'yish mumkin)</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Ruxsatlar</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions[key]}
                    onChange={(e) =>
                      setPermissions((p) => ({ ...p, [key]: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={save} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Bekor qilish
          </Button>
        </div>
      </Card>
    </div>
  )
}
