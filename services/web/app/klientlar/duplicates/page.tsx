"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, Merge, Trash2, Eye, Phone, MapPin, Search } from "lucide-react"
import Link from "next/link"

type DupGroup = {
  id: number; reason: string; matchScore: number;
  clients: Array<{ id: number; name: string; phone: string; address: string; createdAt: string; ordersCount: number; lastOrder: string }>;
}

const DUPLICATES: DupGroup[] = [
  {
    id: 1, reason: "Bir xil telefon raqam", matchScore: 100,
    clients: [
      { id: 1024, name: "Salom Magazin №1", phone: "+998 90 123 45 67", address: "Toshkent, Yashnobod", createdAt: "2025-08-12", ordersCount: 48, lastOrder: "2026-05-02" },
      { id: 1248, name: "Salom Магазин", phone: "+998 90 123 45 67", address: "Toshkent, Yashnobod 4-mavzeyi", createdAt: "2025-11-20", ordersCount: 12, lastOrder: "2026-04-15" },
    ]
  },
  {
    id: 2, reason: "O'xshash nom va manzil (90%)", matchScore: 90,
    clients: [
      { id: 1058, name: "Bona Магазин", phone: "+998 90 234 56 78", address: "Toshkent, Sergeli", createdAt: "2025-09-05", ordersCount: 36, lastOrder: "2026-04-30" },
      { id: 1342, name: "Bona Maxsus Магазин", phone: "+998 90 234 56 79", address: "Toshkent, Sergeli", createdAt: "2026-01-18", ordersCount: 4, lastOrder: "2026-04-22" },
    ]
  },
  {
    id: 3, reason: "Bir xil INN", matchScore: 100,
    clients: [
      { id: 1142, name: "Дастархон Сервис", phone: "+998 71 567 89 01", address: "Toshkent, Mirzo Ulug'bek", createdAt: "2025-07-10", ordersCount: 84, lastOrder: "2026-05-01" },
      { id: 1389, name: "Дастархон Сервис LLC", phone: "+998 71 567 89 02", address: "Toshkent, M.Ulug'bek 12-uy", createdAt: "2026-02-22", ordersCount: 6, lastOrder: "2026-04-28" },
      { id: 1456, name: "Дастархон-Сервис", phone: "+998 71 567 89 03", address: "Toshkent, MUlug'bek", createdAt: "2026-03-15", ordersCount: 2, lastOrder: "2026-04-18" },
    ]
  },
  {
    id: 4, reason: "Bir xil koordinata (GPS ±50m)", matchScore: 85,
    clients: [
      { id: 1224, name: "Гулямов Маркет", phone: "+998 90 678 90 12", address: "Toshkent, Bektemir", createdAt: "2025-10-01", ordersCount: 22, lastOrder: "2026-04-26" },
      { id: 1402, name: "Гулямов Магазин Сирож", phone: "+998 90 678 90 12", address: "Toshkent, Bektemir tumani", createdAt: "2026-03-08", ordersCount: 1, lastOrder: "2026-04-12" },
    ]
  },
]

export default function DuplicatesPage() {
  const [search, setSearch] = useState("")
  const [resolved, setResolved] = useState<Set<number>>(new Set())

  const filtered = DUPLICATES.filter(d => !resolved.has(d.id) && (!search || d.clients.some(c => c.name.toLowerCase().includes(search.toLowerCase()))))

  const totalDups = DUPLICATES.reduce((s, d) => s + d.clients.length, 0)
  const totalGroups = DUPLICATES.length
  const totalSavings = DUPLICATES.reduce((s, d) => s + (d.clients.length - 1), 0)

  const handleMerge = (id: number) => {
    setResolved(new Set([...resolved, id]))
  }

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/klientlar" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Takror klientlar</h1>
            <p className="text-sm text-slate-500">{filtered.length} ta dublikat guruh · {totalSavings} ta yozuvni birlashtirish/o'chirish mumkin</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-rose-50 border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
            <div className="text-xs font-bold text-rose-700">Dublikat guruhlar</div>
            <div className="text-2xl font-bold mt-1">{totalGroups}</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Jami yozuvlar</div>
            <div className="text-2xl font-bold mt-1">{totalDups}</div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <Merge className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Birlashtirilishi mumkin</div>
            <div className="text-2xl font-bold mt-1">{totalSavings}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Merge className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Hal qilingan</div>
            <div className="text-2xl font-bold mt-1">{resolved.size}</div>
          </Card>
        </div>

        <div className="space-y-3">
          {filtered.map(group => (
            <Card key={group.id} className="p-5 border-2 border-amber-300">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Dublikat guruh #{group.id}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{group.reason} · Match score: <span className={`font-bold ${group.matchScore >= 95 ? "text-rose-700" : "text-amber-700"}`}>{group.matchScore}%</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleMerge(group.id)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <Merge className="w-4 h-4" /> Birlashtirish
                  </Button>
                  <Button variant="outline" className="gap-1">
                    <Eye className="w-4 h-4" /> Tanish
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.clients.map((c, i) => (
                  <div key={c.id} className={`p-4 rounded-lg border ${i === 0 ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"}`}>
                    {i === 0 && <div className="text-xs font-bold text-emerald-700 mb-2">⭐ MASTER (saqlanadi)</div>}
                    {i > 0 && <div className="text-xs font-bold text-rose-700 mb-2">🔗 DUPLICATE (birlashtiriladi)</div>}

                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1">#{c.id}</div>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{c.phone}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
                        <span>{c.address}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Yaratildi</div>
                        <div className="font-mono">{c.createdAt}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Zakaz</div>
                        <div className="font-mono font-bold">{c.ordersCount}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Oxirgi</div>
                        <div className="font-mono">{c.lastOrder}</div>
                      </div>
                    </div>

                    {i > 0 && (
                      <button className="mt-2 text-xs text-rose-600 hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Faqat ushbuni o'chirish
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card className="p-12 text-center bg-emerald-50 border-emerald-200">
            <Merge className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-emerald-800 text-lg">🎉 Barcha dublikatlar hal qilindi!</h3>
            <p className="text-sm text-slate-600 mt-1">Klient bazasi toza holat — yangi dublikatlar uchun har soatda tekshirib turamiz.</p>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
