"use client"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Filter, AlertCircle } from "lucide-react"
import Link from "next/link"

const MOCK_AGING = [
  { id: "a0_36", name: "Аббос Ака Мирбозор №55", "0-7": 500000, "8-15": 200000, "16-30": 150000, "31-50": 350000, "51-90": 480000, "90+": 0, total: 1680000 },
  { id: "a0_5301", name: "Булунгур Астановка №3", "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 0 },
  { id: "a0_5776", name: "Диайди №99", "0-7": 100000, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 100000 },
  { id: "k2_4797", name: "Akmal Aka Narimon №88-Машраб", "0-7": 1500000, "8-15": 1200000, "16-30": 800000, "31-50": 600000, "51-90": 350000, "90+": 374300, total: 4824300 },
  { id: "l2_4206", name: "Бегзод Маркет № 0", "0-7": 0, "8-15": 0, "16-30": 0, "31-50": 0, "51-90": 0, "90+": 0, total: 0 },
]

const BUCKET_COLORS = {
  "0-7": "bg-emerald-100 text-emerald-700",
  "8-15": "bg-emerald-100 text-emerald-700",
  "16-30": "bg-amber-100 text-amber-700",
  "31-50": "bg-orange-100 text-orange-700",
  "51-90": "bg-rose-100 text-rose-700",
  "90+": "bg-rose-200 text-rose-900",
}

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
      <div className="max-w-[1700px] mx-auto space-y-5">
        <Link href="/hisobot" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Hisobotlar
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">⏱️ Aging Analysis</h1>
            <p className="text-base text-slate-500 mt-1">Klient qarz tahlili — 6 muddatli bracket</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <BucketCard label="0-7 kun" value={totals["0-7"]} color="emerald" />
          <BucketCard label="8-15 kun" value={totals["8-15"]} color="emerald" />
          <BucketCard label="16-30 kun" value={totals["16-30"]} color="amber" />
          <BucketCard label="31-50 kun" value={totals["31-50"]} color="orange" />
          <BucketCard label="51-90 kun" value={totals["51-90"]} color="rose" alert />
          <BucketCard label="90+ kun" value={totals["90+"]} color="rose-dark" alert />
        </div>

        {/* Critical alert */}
        <Card className="bg-rose-50 border-2 border-rose-300 p-5 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-rose-900">Diqqat: muddati o'tgan qarzlar</h3>
            <p className="text-sm text-rose-700 mt-0.5">
              <span className="font-bold">{(totals["31-50"] + totals["51-90"] + totals["90+"]).toLocaleString()} so'm</span> — 30 kundan ortiq qarzlar.
              Klientlar bilan bog'lanish va undirish chora-tadbirlarini ko'ring.
            </p>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Klient</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">0-7 kun</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">8-15 kun</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">16-30 kun</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">31-50 kun</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">51-90 kun</th>
                  <th className="text-right px-3 py-3 text-sm font-semibold">90+ kun</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold border-l-2 border-slate-200">Jami</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_AGING.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.id}</td>
                    <td className="px-4 py-3 text-base font-medium">
                      <Link href={`/klientlar/${c.id}`} className="hover:text-emerald-600">
                        {c.name}
                      </Link>
                    </td>
                    <Cell value={c["0-7"]} bucket="0-7" />
                    <Cell value={c["8-15"]} bucket="8-15" />
                    <Cell value={c["16-30"]} bucket="16-30" />
                    <Cell value={c["31-50"]} bucket="31-50" />
                    <Cell value={c["51-90"]} bucket="51-90" />
                    <Cell value={c["90+"]} bucket="90+" />
                    <td className={`px-4 py-3 text-right tabular-nums font-bold border-l-2 border-slate-200 ${
                      c.total === 0 ? 'text-slate-400' : 'text-rose-600'
                    }`}>
                      {c.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold">Jami:</td>
                  <Cell value={totals["0-7"]} bucket="0-7" total />
                  <Cell value={totals["8-15"]} bucket="8-15" total />
                  <Cell value={totals["16-30"]} bucket="16-30" total />
                  <Cell value={totals["31-50"]} bucket="31-50" total />
                  <Cell value={totals["51-90"]} bucket="51-90" total />
                  <Cell value={totals["90+"]} bucket="90+" total />
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-2xl text-rose-600 border-l-2 border-slate-200">
                    {totals.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function Cell({ value, bucket, total }: { value: number; bucket: string; total?: boolean }) {
  return (
    <td className="px-3 py-3 text-right tabular-nums">
      {value === 0 ? (
        <span className="text-slate-300">—</span>
      ) : (
        <span className={`inline-block px-2 py-0.5 rounded-md ${BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS]} ${total ? 'font-bold text-base' : 'font-medium text-sm'}`}>
          {value.toLocaleString()}
        </span>
      )}
    </td>
  )
}

function BucketCard({ label, value, color, alert }: { label: string; value: number; color: string; alert?: boolean }) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-yellow-600',
    orange: 'from-orange-500 to-red-500',
    rose: 'from-rose-500 to-pink-600',
    'rose-dark': 'from-rose-600 to-rose-800',
  }
  return (
    <Card className={`bg-gradient-to-br ${colors[color]} text-white border-0 p-4 ${alert && value > 0 ? 'ring-4 ring-rose-300 ring-offset-2 animate-pulse' : ''}`}>
      <div className="text-xs opacity-90">{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value.toLocaleString()}</div>
      <div className="text-xs opacity-75">so'm</div>
    </Card>
  )
}
