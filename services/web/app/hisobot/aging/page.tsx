"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"

const MOCK_AGING = [
  { id: "a0_36", name: "Аббос Ака Мирбозор №55", "0-7": 500000, "8-15": 200000, "16-30": 150000, "31-50": 350000, "51-90": 480000, "90+": 0, total: 1680000 },
  { id: "a0_5301", name: "Булунгур Астановка №3", "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 0 },
  { id: "a0_5776", name: "Диайди №99", "0-7": 100000, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 100000 },
  { id: "k2_4797", name: "Akmal Aka Narimon №88-Машраб", "0-7": 1500000, "8-15": 1200000, "16-30": 800000, "31-50": 600000, "51-90": 350000, "90+": 374300, total: 4824300 },
  { id: "l2_4206", name: "Бегзод Маркет № 0", "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 0 },
]

const BUCKET_COLORS = {
  "0-7": "bg-emerald-50 text-emerald-700",
  "8-15": "bg-emerald-50 text-emerald-700",
  "16-30": "bg-[#FCE9DD] text-[#D97706]",
  "31-50": "bg-[#FCE9DD] text-[#D97706]",
  "51-90": "bg-[#F5E5D6] text-[#C75D3C]",
  "90+": "bg-[#F5E5D6] text-[#C75D3C]",
}

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function AgingPage() {
  const totals = MOCK_AGING.reduce((acc, c) => {
    acc["0-7"] += c["0-7"]
    acc["8-15"] += c["8-15"]
    acc["16-30"] += c["16-30"]
    acc["31-50"] += c["31-50"]
    acc["51-90"] += c["51-90"]
    acc["90+"] += c["90+"]
    acc.total += c.total
    return acc
  }, { "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 0 })

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Aging <span className="italic text-[#C75D3C]">analysis</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Klient qarz tahlili — 6 muddatli bracket</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">
                <Filter className="w-4 h-4" /> Filter
              </Button>
              <Button variant="outline" className="border-[#E8E0D3] text-[#6B5B4D]">
                <Download className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <BucketCard label="0-7 kun" value={totals["0-7"]} accent="#10B981" />
            <BucketCard label="8-15 kun" value={totals["8-15"]} accent="#10B981" />
            <BucketCard label="16-30 kun" value={totals["16-30"]} accent="#D97706" />
            <BucketCard label="31-50 kun" value={totals["31-50"]} accent="#D97706" />
            <BucketCard label="51-90 kun" value={totals["51-90"]} accent="#C75D3C" />
            <BucketCard label="90+ kun" value={totals["90+"]} accent="#C75D3C" />
          </div>

          {/* Critical alert */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
            <AlertCircle className="w-8 h-8 flex-shrink-0" style={{ color: "#C75D3C" }} />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-[#1A1A1A]" style={SERIF}>Diqqat: muddati o'tgan qarzlar</h3>
              <p className="text-sm text-[#6B5B4D] mt-0.5">
                <span className="font-medium font-mono tabular-nums text-[#C75D3C]">{(totals["31-50"] + totals["51-90"] + totals["90+"]).toLocaleString()} so'm</span> — 30 kundan ortiq qarzlar.
                Klientlar bilan bog'lanish va undirish chora-tadbirlarini ko'ring.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#C75D3C" }} />
          </Card>

          {/* Table */}
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ID</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Klient</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">0-7 kun</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">8-15 kun</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">16-30 kun</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">31-50 kun</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">51-90 kun</th>
                    <th className="text-right px-3 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">90+ kun</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3]">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AGING.map(c => (
                    <tr key={c.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="px-4 py-3 text-sm font-mono tabular-nums text-[#9C8A6E]">{c.id}</td>
                      <td className="px-4 py-3 text-base font-medium">
                        <Link href={`/klientlar/${c.id}`} className="text-[#1A1A1A] hover:text-[#C75D3C]">
                          {c.name}
                        </Link>
                      </td>
                      <Cell value={c["0-7"]} bucket="0-7" />
                      <Cell value={c["8-15"]} bucket="8-15" />
                      <Cell value={c["16-30"]} bucket="16-30" />
                      <Cell value={c["31-50"]} bucket="31-50" />
                      <Cell value={c["51-90"]} bucket="51-90" />
                      <Cell value={c["90+"]} bucket="90+" />
                      <td className={`px-4 py-3 text-right tabular-nums font-medium border-l border-[#F0EAE0] font-mono ${
                        c.total === 0 ? 'text-[#9C8A6E]' : 'text-[#C75D3C]'
                      }`}>
                        {c.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[#E8E0D3] bg-[#FAF7F2]">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-[#1A1A1A]" style={SERIF}>Jami:</td>
                    <Cell value={totals["0-7"]} bucket="0-7" total />
                    <Cell value={totals["8-15"]} bucket="8-15" total />
                    <Cell value={totals["16-30"]} bucket="16-30" total />
                    <Cell value={totals["31-50"]} bucket="31-50" total />
                    <Cell value={totals["51-90"]} bucket="51-90" total />
                    <Cell value={totals["90+"]} bucket="90+" total />
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-2xl border-l border-[#E8E0D3] font-mono" style={{ ...SERIF, color: "#C75D3C" }}>
                      {totals.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function Cell({ value, bucket, total }: { value: number; bucket: string; total?: boolean }) {
  return (
    <td className="px-3 py-3 text-right tabular-nums font-mono">
      {value === 0 ? (
        <span className="text-[#D6CDB8]">—</span>
      ) : (
        <span className={`inline-block px-2 py-0.5 rounded-md ${BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS]} ${total ? 'font-medium text-base' : 'font-medium text-sm'}`}>
          {value.toLocaleString()}
        </span>
      )}
    </td>
  )
}

function BucketCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl relative overflow-hidden">
      <Clock className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: accent }}>{label}</div>
      <div className="text-2xl font-medium tabular-nums mt-1 text-[#1A1A1A] font-mono" style={SERIF}>{value.toLocaleString()}</div>
      <div className="text-xs text-[#9C8A6E] mt-1">so'm</div>
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
    </Card>
  )
}
