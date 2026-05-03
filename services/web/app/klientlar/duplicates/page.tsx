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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/klientlar" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENTLAR</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Takror <span className="italic text-[#C75D3C]">klientlar</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{filtered.length} ta dublikat guruh · {totalSavings} ta yozuvni birlashtirish/o'chirish mumkin</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Klient nomi..." className="pl-9 pr-4 py-2 border border-[#E8E0D3] bg-white rounded-md text-sm w-64 text-[#1A1A1A]" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5E5D6] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#C75D3C]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Dublikat guruhlar</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalGroups}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#C75D3C]" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FCE9DD] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Jami yozuvlar</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalDups}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#D97706]" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Merge className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Birlashtirilishi mumkin</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalSavings}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Merge className="w-5 h-5 text-blue-700" />
                </div>
                <span className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Hal qilingan</span>
              </div>
              <div className="text-3xl font-light text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{resolved.size}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-blue-500" />
            </Card>
          </div>

          <div className="space-y-4">
            {filtered.map(group => (
              <Card key={group.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E8E0D3]">
                  <div>
                    <h2 className="font-medium text-lg flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                      Dublikat guruh #{group.id}
                    </h2>
                    <p className="text-xs text-[#9C8A6E] mt-0.5">
                      {group.reason} · Match score: <span className={`font-medium ${group.matchScore >= 95 ? "text-[#C75D3C]" : "text-[#D97706]"}`}>{group.matchScore}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleMerge(group.id)} className="gap-1 text-white" style={{ background: "#C75D3C" }}>
                      <Merge className="w-4 h-4" /> Birlashtirish
                    </Button>
                    <Button variant="outline" className="gap-1 border-[#E8E0D3] text-[#6B5B4D]">
                      <Eye className="w-4 h-4" /> Tanish
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.clients.map((c, i) => (
                    <div key={c.id} className={`p-4 rounded-xl border ${i === 0 ? "bg-emerald-50 border-emerald-200" : "bg-[#FAF7F2] border-[#E8E0D3]"}`}>
                      {i === 0 && <div className="text-xs uppercase tracking-wider font-medium text-emerald-700 mb-2">MASTER (saqlanadi)</div>}
                      {i > 0 && <div className="text-xs uppercase tracking-wider font-medium text-[#C75D3C] mb-2">DUPLICATE (birlashtiriladi)</div>}

                      <div className="font-medium text-[#1A1A1A]">{c.name}</div>
                      <div className="text-xs font-mono tabular-nums text-[#9C8A6E] mt-1">#{c.id}</div>

                      <div className="mt-2 space-y-1 text-xs text-[#6B5B4D]">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#9C8A6E]" />
                          <span className="font-mono tabular-nums">{c.phone}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-[#9C8A6E] mt-0.5" />
                          <span>{c.address}</span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-[#9C8A6E]">Yaratildi</div>
                          <div className="font-mono tabular-nums text-[#1A1A1A]">{c.createdAt}</div>
                        </div>
                        <div>
                          <div className="text-[#9C8A6E]">Zakaz</div>
                          <div className="font-mono tabular-nums font-medium text-[#1A1A1A]">{c.ordersCount}</div>
                        </div>
                        <div>
                          <div className="text-[#9C8A6E]">Oxirgi</div>
                          <div className="font-mono tabular-nums text-[#1A1A1A]">{c.lastOrder}</div>
                        </div>
                      </div>

                      {i > 0 && (
                        <button className="mt-3 text-xs text-[#C75D3C] hover:underline flex items-center gap-1">
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
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 mx-auto mb-3 flex items-center justify-center">
                <Merge className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="font-light text-[#1A1A1A] text-2xl" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Barcha dublikatlar hal qilindi</h3>
              <p className="text-sm text-[#6B5B4D] mt-2">Klient bazasi toza holat — yangi dublikatlar uchun har soatda tekshirib turamiz.</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
