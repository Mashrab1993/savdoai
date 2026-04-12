"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

const THEMES = [
  { key: "light", label: "Yorug'", icon: Sun, preview: "bg-card border" },
  { key: "dark", label: "Qorong'u", icon: Moon, preview: "bg-card border-border" },
  { key: "system", label: "Tizim", icon: Monitor, preview: "bg-gradient-to-r from-white to-card" },
]

const COLORS = [
  { name: "emerald", color: "bg-emerald-500", label: "Yashil" },
  { name: "blue", color: "bg-blue-500", label: "Ko'k" },
  { name: "purple", color: "bg-purple-500", label: "Binafsha" },
  { name: "red", color: "bg-rose-500/100", label: "Qizil" },
  { name: "orange", color: "bg-orange-500", label: "To'q sariq" },
  { name: "pink", color: "bg-pink-500", label: "Pushti" },
]

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState("light")
  const [selectedColor, setSelectedColor] = useState("emerald")

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <PageHeader
          icon={Palette}
          gradient="violet"
          title="Ranglar va mavzular"
          subtitle="Web panel ko'rinishini sozlang"
        />
        </div>

        <div>
          <h2 className="font-bold mb-3">Mavzu tanlash</h2>
          <div className="grid grid-cols-3 gap-4">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => setSelectedTheme(t.key)}
                className={`p-6 rounded-xl border-2 transition ${selectedTheme === t.key ? "border-emerald-500" : "border-transparent hover:border-border"}`}
              >
                <div className={`h-24 rounded-lg mb-3 ${t.preview}`} />
                <div className="flex items-center justify-center gap-2">
                  <t.icon className="w-4 h-4" />
                  <span className="font-medium">{t.label}</span>
                  {selectedTheme === t.key && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold mb-3">Asosiy rang</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={`p-4 rounded-xl border-2 transition ${selectedColor === c.name ? "border-border" : "border-transparent hover:border-border"}`}
              >
                <div className={`w-full h-12 rounded-lg ${c.color} mb-2`} />
                <div className="text-xs font-medium text-center">{c.label}</div>
                {selectedColor === c.name && <Check className="w-3 h-3 text-emerald-500 mx-auto mt-1" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-bold mb-3">Tilni tanlash</h2>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-4 border rounded-lg text-center hover:border-emerald-500">
              <div className="text-3xl mb-1">🇺🇿</div>
              <div className="font-medium">O'zbekcha</div>
            </button>
            <button className="p-4 border rounded-lg text-center hover:border-emerald-500">
              <div className="text-3xl mb-1">🇷🇺</div>
              <div className="font-medium">Русский</div>
            </button>
            <button className="p-4 border rounded-lg text-center hover:border-emerald-500">
              <div className="text-3xl mb-1">🇬🇧</div>
              <div className="font-medium">English</div>
            </button>
          </div>
        </div>

        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Saqlash</Button>
      </div>
    </AdminLayout>
  )
}
