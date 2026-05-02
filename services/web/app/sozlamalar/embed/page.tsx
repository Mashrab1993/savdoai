"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Code2, Copy, Eye, Sparkles, Globe } from "lucide-react"
import Link from "next/link"

const WIDGETS = [
  { id: "dashboard-mini", name: "Dashboard mini", description: "KPI kartochka (4 metrika)", size: "300×200" },
  { id: "sales-chart", name: "Sotuv chart", description: "Bar yoki line chart", size: "600×300" },
  { id: "top-products", name: "Top tovarlar", description: "Eng ko'p sotilganlar", size: "400×500" },
  { id: "client-search", name: "Klient qidiruvi", description: "Search bilan klient tanlash", size: "500×100" },
  { id: "order-form", name: "Zakaz formasi", description: "To'liq zakaz yaratish", size: "800×600" },
  { id: "live-feed", name: "Live feed", description: "Real-time aktivlik", size: "400×500" },
]

export default function EmbedPage() {
  const [selected, setSelected] = useState(WIDGETS[0])
  const [width, setWidth] = useState(600)
  const [height, setHeight] = useState(400)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [showHeader, setShowHeader] = useState(true)
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIs...••••")

  const embedCode = `<iframe
  src="https://embed.savdoai.com/${selected.id}?token=${token}&theme=${theme}${!showHeader ? "&hideHeader=1" : ""}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="clipboard-write"
></iframe>`

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/sozlamalar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Code2 className="w-7 h-7 text-violet-600" />
              Embed widget builder ("Veb ichida veb")
            </h1>
            <p className="text-sm text-slate-500">SavdoAI widgetlarini sizning saytingizga embed qiling</p>
          </div>
          <Button className="gap-2"><Copy className="w-4 h-4" /> Kodni nusxalash</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4">1. Widget tanlash</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {WIDGETS.map(w => (
                  <button key={w.id} onClick={() => setSelected(w)} className={`p-3 rounded-lg border-2 text-left transition-all ${selected.id === w.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="font-bold text-sm">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{w.size}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4">2. Sozlamalar</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Width (px)</label>
                    <Input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Height (px)</label>
                    <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Mavzu (theme)</label>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme("light")} className={`flex-1 py-2 rounded-md text-sm ${theme === "light" ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>☀️ Yorug'</button>
                    <button onClick={() => setTheme("dark")} className={`flex-1 py-2 rounded-md text-sm ${theme === "dark" ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"}`}>🌙 Qorong'i</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="header" checked={showHeader} onChange={e => setShowHeader(e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="header" className="text-sm cursor-pointer">Header ko'rsatish (logo + title)</label>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">API Token</label>
                  <Input value={token} onChange={e => setToken(e.target.value)} className="font-mono text-xs" />
                  <div className="text-xs text-slate-500 mt-1">⚠️ Token public bo'ladi — read-only ruxsat bering</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Code2 className="w-5 h-5 text-emerald-600" /> 3. Embed kod</h2>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">{embedCode}</pre>
              <Button className="mt-3 gap-2 w-full"><Copy className="w-4 h-4" /> Kodni nusxalash</Button>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> Live preview</h2>
              <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-4">
                <div
                  className={`mx-auto rounded-lg shadow-lg transition-all ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white"}`}
                  style={{ width: Math.min(width, 600), height: Math.min(height, 400) }}
                >
                  {showHeader && (
                    <div className={`p-2 border-b text-xs font-bold flex items-center gap-2 ${theme === "dark" ? "border-slate-700 text-emerald-400" : "border-slate-200 text-emerald-700"}`}>
                      <Sparkles className="w-3 h-3" /> SavdoAI · {selected.name}
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className={`text-4xl font-bold font-mono ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>
                        {selected.id === "dashboard-mini" ? "12.4 M" : selected.id === "top-products" ? "Choco-Boom" : "—"}
                      </div>
                      <div className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{selected.description}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center mt-3">{width} × {height} px · {theme === "light" ? "Yorug'" : "Qorong'i"} mode</div>
            </Card>

            <Card className="p-5 bg-violet-50 border-violet-200">
              <h3 className="font-bold text-violet-800 mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Qaerda ishlaydi?
              </h3>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>✓ Sizning korxona saytingiz (mashrab.uz)</li>
                <li>✓ Klient kabineti</li>
                <li>✓ Notion, Confluence, WordPress sahifalar</li>
                <li>✓ Mobil ilovalar (WebView)</li>
                <li>✓ TV displaylarda (kassada)</li>
              </ul>
            </Card>

            <Card className="p-5 bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-800 mb-2">🔐 Xavfsizlik</h3>
              <p className="text-sm text-slate-700">
                Embed widget public ko'rinadi. Token orqali ruxsat — har widget uchun read-only token yarating.
                Klient ma'lumotlari (telefon, qarz, narx) public widget'da KO'RSATILMAYDI — faqat aggregat KPI.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
