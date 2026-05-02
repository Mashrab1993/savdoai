"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, Filter as FilterIcon, Camera, Eye } from "lucide-react"
import Link from "next/link"

const FACING = [
  { id: 1, client: "Salom Magazin №1", brand: "Bonjur", facingShare: 28, target: 25, photos: 4, agent: "Nurmatov A." },
  { id: 2, client: "Asia Optom", brand: "Coca-Cola", facingShare: 42, target: 35, photos: 6, agent: "Nurmatov A." },
  { id: 3, client: "Lider Chakana", brand: "Bonjur", facingShare: 18, target: 25, photos: 3, agent: "Karimov S." },
  { id: 4, client: "Globus Plus", brand: "Choco-Boom", facingShare: 12, target: 20, photos: 2, agent: "Rasulov B." },
  { id: 5, client: "Mega Market", brand: "Coca-Cola", facingShare: 38, target: 35, photos: 5, agent: "Yusupov D." },
  { id: 6, client: "Sharq Bozor", brand: "Aqua-Plus", facingShare: 24, target: 30, photos: 3, agent: "Yusupov D." },
]

export default function FacingPage() {
  const [showResult, setShowResult] = useState(true)

  const aboveTarget = FACING.filter(f => f.facingShare >= f.target).length
  const belowTarget = FACING.length - aboveTarget

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          {/* Hero */}
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/audit" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · AUDIT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Facing — <span className="italic text-[#C75D3C]">Display Share</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Polki ulushi · raqobatchilar bilan taqqoslash</p>
            </div>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {["Категории клиентов", "Категории продуктов", "Торговая Марка", "Агент", "Город"].map(f => (
                <button key={f} className="text-left px-3 py-2 border border-[#E8E0D3] bg-[#FAF7F2] rounded-md text-xs hover:border-[#C75D3C] transition-colors flex items-center justify-between">
                  <span className="text-[#6B5B4D]">{f}</span><span className="text-[#9C8A6E]">▾</span>
                </button>
              ))}
              <Input placeholder="Min" className="h-9 border-[#E8E0D3] bg-[#FAF7F2]" />
              <Input placeholder="Max" className="h-9 border-[#E8E0D3] bg-[#FAF7F2]" />
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-2 border border-[#C75D3C]/40 bg-[#FCE9DD] rounded-md text-xs font-medium text-[#C75D3C] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> апр 3 — май 2 ▾
              </button>
              <Button size="sm" className="gap-1 ml-auto" style={{ background: "#C75D3C" }}><FilterIcon className="w-4 h-4" /> Filtr</Button>
            </div>
          </Card>

          {!showResult ? (
            <Card className="p-12 text-center bg-white border border-[#E8E0D3] rounded-2xl">
              <Eye className="w-16 h-16 mx-auto text-[#9C8A6E] mb-4" />
              <h2 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Facing</h2>
              <p className="text-[#9C8A6E] mt-2">По вашему запросу ничего не найдено</p>
              <Button onClick={() => setShowResult(true)} className="mt-4" style={{ background: "#C75D3C" }}>Default ko'rsatish</Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-emerald-700">Yuqori target</div>
                  <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{aboveTarget}/{FACING.length}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </Card>
                <Card className="p-4 bg-white border border-[#C75D3C]/30 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-[#C75D3C]">Past target</div>
                  <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{belowTarget}/{FACING.length}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C75D3C]" />
                </Card>
                <Card className="p-4 bg-white border border-blue-200 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="text-xs uppercase tracking-[0.15em] font-medium text-blue-700">Foto-hisobotlar</div>
                  <div className="text-3xl font-medium mt-2 tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{FACING.reduce((s, f) => s + f.photos, 0)}</div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
                </Card>
              </div>

              <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                        <th className="py-2.5 px-2 w-12 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">#</th>
                        <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                        <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Brend</th>
                        <th className="py-2.5 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                        <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Facing %</th>
                        <th className="py-2.5 px-2 text-right text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Target %</th>
                        <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Holat</th>
                        <th className="py-2.5 px-2 text-center text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Foto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FACING.map(f => {
                        const ok = f.facingShare >= f.target
                        return (
                          <tr key={f.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                            <td className="py-2 px-2 text-center font-mono text-[#9C8A6E]">{f.id}</td>
                            <td className="py-2 px-2 font-medium text-[#1A1A1A]">{f.client}</td>
                            <td className="py-2 px-2">
                              <span className="text-xs px-2 py-0.5 bg-[#F0EAE0] text-[#6B5B4D] rounded font-medium">{f.brand}</span>
                            </td>
                            <td className="py-2 px-2 text-[#6B5B4D]">{f.agent}</td>
                            <td className={`py-2 px-2 text-right font-mono font-medium ${ok ? "text-emerald-700" : "text-[#C75D3C]"}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{f.facingShare}%</td>
                            <td className="py-2 px-2 text-right font-mono text-[#9C8A6E]">{f.target}%</td>
                            <td className="py-2 px-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${ok ? "bg-emerald-50 text-emerald-700" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                                {ok ? "✓ Yuqori" : "✗ Past"}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                                <Camera className="w-3.5 h-3.5" /> {f.photos}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
