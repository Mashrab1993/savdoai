"use client"

/**
 * Voice Help — barcha ovozli buyruqlar chiroyli grid.
 *
 * Agent ushbu sahifani ochib, qanday gapirishni ko'radi va o'rganadi.
 */

import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import {
  Mic, Search, ShoppingCart, Package, Users, Tag, Truck,
  DollarSign, ClipboardList, MessageSquare, Camera, RotateCcw,
  Calendar, Heart, BarChart3, Warehouse, TrendingUp,
} from "lucide-react"

type Intent = {
  gap: string
  qisqa?: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  category: string
}

const INTENTS: Intent[] = [
  // SOTUV
  { gap: "Salimovga 50 Ariel qarzga",         icon: ShoppingCart, gradient: "from-blue-500 to-indigo-600", category: "sotuv" },
  { gap: "100 ta un kirdi narxi 35,000",      icon: Package,      gradient: "from-blue-500 to-indigo-600", category: "sotuv" },
  { gap: "Yangi klient Karim aka 95 259 99 00", icon: Users,      gradient: "from-blue-500 to-indigo-600", category: "sotuv" },
  { gap: "Salimov 500,000 to'ladi",           icon: DollarSign,   gradient: "from-blue-500 to-indigo-600", category: "sotuv" },

  // TASDIQ
  { gap: "Ha tasdiq",                          icon: Mic, gradient: "from-emerald-500 to-teal-600", category: "tasdiq" },
  { gap: "Bekor qil",                          icon: Mic, gradient: "from-emerald-500 to-teal-600", category: "tasdiq" },
  { gap: "Majbur saqla",                       qisqa: "Qoldiq yetmaganda majburan sotish", icon: Mic, gradient: "from-emerald-500 to-teal-600", category: "tasdiq" },

  // KATALOG
  { gap: "Yangi brend Ariel qo'shing",         icon: Tag, gradient: "from-fuchsia-500 to-pink-600", category: "katalog" },
  { gap: "Kategoriya Sladus qo'sh",            icon: Tag, gradient: "from-fuchsia-500 to-pink-600", category: "katalog" },
  { gap: "Segment VIP yarat",                  icon: Tag, gradient: "from-fuchsia-500 to-pink-600", category: "katalog" },
  { gap: "Ishlab chiqaruvchi Procter Gamble Turkiya", icon: Tag, gradient: "from-fuchsia-500 to-pink-600", category: "katalog" },

  // SKLAD / EKSPEDITOR
  { gap: "Yangi ekspeditor Karim aka +998901234567", icon: Truck, gradient: "from-amber-500 to-orange-600", category: "sklad" },
  { gap: "Sklad Asosiy qo'shish",              icon: Warehouse, gradient: "from-amber-500 to-orange-600", category: "sklad" },
  { gap: "Sklad brak qo'sh",                   icon: Warehouse, gradient: "from-amber-500 to-orange-600", category: "sklad" },
  { gap: "Sklad aksiya qo'sh",                 icon: Warehouse, gradient: "from-amber-500 to-orange-600", category: "sklad" },

  // HISOBOT
  { gap: "Agent hisobot",                      icon: BarChart3, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "Kim qancha sotdi",                   icon: Users, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "Foyda hisobot",                      icon: DollarSign, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "PnL",                                icon: DollarSign, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "Sof foyda",                          icon: TrendingUp, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "Ertalabki brifing",                  qisqa: "Kundalik AI strategiya", icon: Mic, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },
  { gap: "Oylik tahlil",                       qisqa: "Opus 4.7 30 kunlik", icon: Mic, gradient: "from-cyan-500 to-blue-600", category: "hisobot" },

  // RFM
  { gap: "Champion klientlar",                 icon: Users, gradient: "from-violet-500 to-purple-600", category: "rfm" },
  { gap: "Xavf ostidagi klientlar",            icon: Users, gradient: "from-violet-500 to-purple-600", category: "rfm" },
  { gap: "Sodiq klientlar",                    icon: Users, gradient: "from-violet-500 to-purple-600", category: "rfm" },

  // VAZIFA
  { gap: "Vazifa ber Akbar Karimga yetkazib ber", icon: ClipboardList, gradient: "from-indigo-500 to-purple-600", category: "vazifa" },
  { gap: "Mening vazifalarim",                 icon: ClipboardList, gradient: "from-indigo-500 to-purple-600", category: "vazifa" },
  { gap: "5-vazifa bajardim",                  icon: ClipboardList, gradient: "from-indigo-500 to-purple-600", category: "vazifa" },

  // STORECHECK
  { gap: "Akmal do'koniga tashrif boshlaymiz", icon: Camera, gradient: "from-rose-500 to-red-600", category: "tashrif" },
  { gap: "Ariel bor 56000",                    icon: Camera, gradient: "from-rose-500 to-red-600", category: "tashrif" },
  { gap: "Persil yo'q",                        icon: Camera, gradient: "from-rose-500 to-red-600", category: "tashrif" },
  { gap: "Tashrif yop",                        icon: Camera, gradient: "from-rose-500 to-red-600", category: "tashrif" },

  // FIKR
  { gap: "Shikoyat: Ariel paketi ochiq kelgan", icon: MessageSquare, gradient: "from-red-500 to-rose-600", category: "fikr" },
  { gap: "Maqtov: Akbar tez yetkazdi rahmat",  icon: MessageSquare, gradient: "from-red-500 to-rose-600", category: "fikr" },
  { gap: "Taklif: yangi brend olib keling",    icon: MessageSquare, gradient: "from-red-500 to-rose-600", category: "fikr" },

  // QAYTARISH
  { gap: "Karim 5 ta Ariel qaytardi brak",     icon: RotateCcw, gradient: "from-orange-500 to-red-600", category: "qaytarish" },

  // HAYOTIM
  { gap: "Hayotim",                            qisqa: "Dashboard", icon: Heart, gradient: "from-pink-500 to-rose-600", category: "hayotim" },
  { gap: "Yangi maqsad: oyda 5 klient",        icon: Heart, gradient: "from-pink-500 to-rose-600", category: "hayotim" },
  { gap: "Yangi g'oya: telegram kanal",        icon: Heart, gradient: "from-pink-500 to-rose-600", category: "hayotim" },
  { gap: "Shaxsiy xarajat 50000 ovqat",        icon: Heart, gradient: "from-pink-500 to-rose-600", category: "hayotim" },

  // PLAN
  { gap: "Bu oy 30 million plan",              icon: Calendar, gradient: "from-teal-500 to-cyan-600", category: "plan" },
  { gap: "Plan progress",                      icon: Calendar, gradient: "from-teal-500 to-cyan-600", category: "plan" },
  { gap: "Shogirdlar reyting",                 icon: Users, gradient: "from-teal-500 to-cyan-600", category: "plan" },
]

const CATEGORIES = {
  sotuv:    { label: "Sotuv / Kirim / Klient",   icon: ShoppingCart, color: "text-blue-600" },
  tasdiq:   { label: "Tasdiq / Bekor",            icon: Mic,          color: "text-emerald-600" },
  katalog:  { label: "Yangi katalog",             icon: Tag,          color: "text-fuchsia-600" },
  sklad:    { label: "Sklad / Ekspeditor",        icon: Warehouse,    color: "text-amber-600" },
  hisobot:  { label: "Hisobot / Plan",            icon: BarChart3,    color: "text-cyan-600" },
  rfm:      { label: "RFM klient",                icon: Users,        color: "text-violet-600" },
  vazifa:   { label: "Vazifalar",                 icon: ClipboardList, color: "text-indigo-600" },
  tashrif:  { label: "Storecheck (tashrif)",      icon: Camera,       color: "text-rose-600" },
  fikr:     { label: "Fikr / Shikoyat",           icon: MessageSquare, color: "text-red-600" },
  qaytarish: { label: "Qaytarish",                icon: RotateCcw,    color: "text-orange-600" },
  hayotim:  { label: "Hayotim (shaxsiy)",         icon: Heart,        color: "text-pink-600" },
  plan:     { label: "Plan / Maqsad",             icon: Calendar,     color: "text-teal-600" },
} as const


export default function VoiceHelpPage() {
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState<string>("all")

  const filtered = INTENTS.filter(i => {
    if (filterCat !== "all" && i.category !== filterCat) return false
    if (search && !i.gap.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AdminLayout title="Ovozli buyruqlar">
      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white border-0 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Mic className="w-40 h-40" />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-1">Ovoz bilan boshqarish</h2>
            <p className="text-sm opacity-80 mb-4">
              {INTENTS.length} ta ovozli buyruq — Telegram botga bosib, ovoz yuboring.
              SavdoAI o&apos;zi tushunadi va bajaradi.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCat("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filterCat === "all" ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Hammasi ({INTENTS.length})
              </button>
              {Object.entries(CATEGORIES).map(([key, m]) => {
                const count = INTENTS.filter(i => i.category === key).length
                return (
                  <button
                    key={key}
                    onClick={() => setFilterCat(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                      filterCat === key ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                    <Badge variant="secondary" className={filterCat === key ? "bg-black/10" : "bg-white/20 text-white border-0"}>
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buyruq qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Search className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
            <h4 className="font-semibold">Buyruq topilmadi</h4>
            <p className="text-sm text-muted-foreground">Boshqa kalit so&apos;z kiriting</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((i, idx) => (
              <Card key={idx} className={`relative overflow-hidden border-0 text-white min-h-[100px]`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${i.gradient} opacity-90`} />
                <div className="absolute -bottom-2 -right-2 opacity-20">
                  <i.icon className="w-16 h-16" />
                </div>
                <div className="relative p-4">
                  <div className="flex items-start gap-2 mb-1">
                    <Mic className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium italic leading-tight">&ldquo;{i.gap}&rdquo;</div>
                      {i.qisqa && (
                        <div className="text-xs opacity-80 mt-1">{i.qisqa}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-4 bg-indigo-500/5 border-indigo-500/20">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-600" />
            Ovozli boshqaruv qanday ishlaydi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="font-medium mb-1">1️⃣ Telegramda bot ochish</div>
              <div className="text-muted-foreground">@savdoai_bot bosib bot bilan chat</div>
            </div>
            <div>
              <div className="font-medium mb-1">2️⃣ Mikrofon bosing</div>
              <div className="text-muted-foreground">Ovozli xabar yuboring — o&apos;zbek tilida</div>
            </div>
            <div>
              <div className="font-medium mb-1">3️⃣ AI tushunadi</div>
              <div className="text-muted-foreground">Gemini STT + Opus 4.7 = darhol javob</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
