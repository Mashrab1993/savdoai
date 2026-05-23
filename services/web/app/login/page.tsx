"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Building2, Lock, User, Loader2, Phone, Key, Users, Tag } from "lucide-react"
import Link from "next/link"

type Method = "team" | "phone" | "login" | "token"

export default function LoginPage() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>("team")
  const [companyKod, setCompanyKod] = useState("")
  const [login, setLogin] = useState("")
  const [phone, setPhone] = useState("")
  const [token, setTokenInput] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [kodCompany, setKodCompany] = useState<string | null>(null)

  // Kod kiritilganda kompaniya nomi ko'rsatish
  async function lookupKod(kod: string) {
    if (kod.length < 2) {
      setKodCompany(null)
      return
    }
    try {
      const r = await fetch(`/auth/lookup_kod?kod=${encodeURIComponent(kod)}`)
      const data = await r.json()
      setKodCompany(data.mavjud ? data.dokon_nomi : null)
    } catch {
      setKodCompany(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (method === "token") {
        localStorage.setItem("auth_token", token)
        try {
          const me = await api.get<{ id: number }>("/api/v1/me")
          localStorage.setItem("auth_user_id", String(me.id))
          toast.success("Token to'g'ri — kirdingiz")
          router.push("/dashboard")
        } catch {
          localStorage.removeItem("auth_token")
          toast.error("Token noto'g'ri yoki muddati o'tgan")
        }
        return
      }
      if (method === "team") {
        const res = await api.post<{
          token: string
          user_id: number
          company_kod: string
          role: string
        }>("/auth/login_team", {
          company_kod: companyKod.trim().toLowerCase(),
          login: login.trim().toLowerCase(),
          parol: password,
        })
        localStorage.setItem("auth_token", res.token)
        localStorage.setItem("auth_user_id", String(res.user_id))
        localStorage.setItem("company_kod", res.company_kod || "")
        toast.success(`Tizimga kirdingiz (${res.role})`)
        router.push("/dashboard")
        return
      }
      const body: { login?: string; telefon?: string; parol: string } = { parol: password }
      if (method === "login") body.login = login
      else body.telefon = phone
      const res = await api.post<{ token: string; user_id: number }>("/auth/login", body)
      localStorage.setItem("auth_token", res.token)
      localStorage.setItem("auth_user_id", String(res.user_id))
      toast.success("Tizimga kirdingiz")
      router.push("/dashboard")
    } catch (err) {
      const msg = (err as { detail?: string; message?: string })?.detail
        ?? (err as Error)?.message
        ?? "Xato yuz berdi"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-bold">SavdoAI</div>
            <div className="text-sm text-emerald-300">v26 Premium</div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Distribuziya biznesini<br />yangi darajaga olib chiqing
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Voice + Mobile + Telegram-native ERP.<br />
            SalesDoc darajasidagi chuqurlik + zamonaviy AI.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm text-slate-300">Sahifa va modul</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold">31</div>
              <div className="text-sm text-slate-300">Hisobot turi</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold">8</div>
              <div className="text-sm text-slate-300">Audit & Merchandising</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold">🎤</div>
              <div className="text-sm text-slate-300">Voice-first AI</div>
            </div>
          </div>
        </div>
        <div className="relative text-sm text-slate-400">
          © 2026 SavdoAI. Barcha huquqlar himoyalangan.
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold">SavdoAI</div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tizimga kiring</h2>
            <p className="text-base text-slate-500 mt-2">Do'koningizni boshqaring</p>
          </div>

          {/* Method tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            <MethodTab active={method === "team"} onClick={() => setMethod("team")}>
              <Users className="w-4 h-4" /> Jamoa
            </MethodTab>
            <MethodTab active={method === "phone"} onClick={() => setMethod("phone")}>
              <Phone className="w-4 h-4" /> Telefon
            </MethodTab>
            <MethodTab active={method === "login"} onClick={() => setMethod("login")}>
              <User className="w-4 h-4" /> Login
            </MethodTab>
            <MethodTab active={method === "token"} onClick={() => setMethod("token")}>
              <Key className="w-4 h-4" /> Token
            </MethodTab>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {method === "team" && (
              <>
                <Field label="Kompaniya kodi" icon={Tag}>
                  <Input
                    type="text"
                    placeholder="masalan: salom-market"
                    value={companyKod}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase()
                      setCompanyKod(v)
                      lookupKod(v)
                    }}
                    autoFocus
                    required
                    className="lowercase"
                  />
                  {kodCompany && (
                    <p className="text-xs text-emerald-600 mt-1">✓ {kodCompany}</p>
                  )}
                </Field>
                <Field label="Login" icon={User}>
                  <Input
                    type="text"
                    placeholder="ismingiz yoki telefon"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Parol" icon={Lock}>
                  <Input
                    type="password"
                    placeholder="Parolingiz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              </>
            )}
            {method === "login" && (
              <>
                <Field label="Login" icon={User}>
                  <Input
                    type="text"
                    placeholder="Masalan: salimov"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    autoFocus
                    required
                  />
                </Field>
                <Field label="Parol" icon={Lock}>
                  <Input
                    type="password"
                    placeholder="Parolingiz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              </>
            )}
            {method === "phone" && (
              <>
                <Field label="Telefon" icon={Phone}>
                  <Input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoFocus
                    required
                  />
                </Field>
                <Field label="Parol" icon={Lock}>
                  <Input
                    type="password"
                    placeholder="Parolingiz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
              </>
            )}
            {method === "token" && (
              <>
                <Field label="Telegram bot tokeni" icon={Key}>
                  <Input
                    type="text"
                    placeholder="Telegram botdan /token buyrug'i orqali olingan"
                    value={token}
                    onChange={(e) => setTokenInput(e.target.value)}
                    autoFocus
                    required
                    className="font-mono text-sm"
                  />
                </Field>
                <p className="text-xs text-slate-500">
                  Telegram botda <code className="bg-slate-100 px-1 rounded">/token</code> buyrug'ini yuboring va olingan tokenni kiritib qo'ying.
                </p>
              </>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {loading ? "Tekshirilmoqda..." : "Kirish"}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-500 space-y-2">
            <div>
              Yangi do'konchimisiz?{" "}
              <Link href="/signup" className="text-emerald-600 font-medium hover:underline">
                14 kun bepul sinash
              </Link>
            </div>
            <div>
              Yordam kerakmi? <span className="text-emerald-600 font-medium">@savdoai_support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MethodTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </label>
      {children}
    </div>
  )
}
