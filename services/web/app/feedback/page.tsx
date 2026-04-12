"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MessageSquare, Search, Star, Filter, Download } from "lucide-react"
import { MessageCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function FeedbackPage() {
  const [search, setSearch] = useState("")
  const [filterRating, setFilterRating] = useState(0)
  const [feedback] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={MessageCircle}
          gradient="emerald"
          title="Fikr-mulohaza"
          subtitle="Mijozlardan kelgan baholar va izohlar"
        />
          </div>
          <Button variant="outline"><Download className="w-4 h-4 mr-1" /> Excel</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className="bg-card rounded-xl border p-4 text-center">
              <div className="flex justify-center gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/50"}`} />
                ))}
              </div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">{stars} yulduzcha</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Mijoz yoki agent qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={filterRating} onChange={e => setFilterRating(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-card">
            <option value={0}>Barcha baholar</option>
            <option value={5}>5 yulduzcha</option>
            <option value={4}>4 yulduzcha</option>
            <option value={3}>3 yulduzcha</option>
            <option value={2}>2 yulduzcha</option>
            <option value={1}>1 yulduzcha</option>
          </select>
        </div>

        <div className="bg-card rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Mijoz</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-center">Baho</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Feedback topilmadi
                  </TableCell>
                </TableRow>
              ) : feedback.map((f: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{i+1}</TableCell>
                  <TableCell className="font-medium">{f.mijoz}</TableCell>
                  <TableCell>{f.agent}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= f.baho ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/50"}`} />)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{f.izoh}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.sana}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
