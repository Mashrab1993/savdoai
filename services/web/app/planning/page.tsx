"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Upload, Download, Users, TrendingUp, BarChart3, Pencil, Check } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

interface PlanRow { agent: string; reja_summa: number; fakt_summa: number; reja_miqdor: number; fakt_miqdor: number; reja_akb: number; fakt_akb: number }

export default function PlanningPage() {
  const [tab, setTab] = useState("plan")
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [plans] = useState<PlanRow[]>([])
  const months = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"]
  const pulse = (plan: number, fact: number) => plan > 0 ? Math.min(100, Math.round(fact / plan * 100)) : 0

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={Target}
          gradient="emerald"
          title="Rejalashtirish"
          subtitle="Agent rejalari va bajarilish — SalesDoc uslubida"
        />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Excel import</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Shablon</Button>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-card">
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-card">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="plan"><Pencil className="w-4 h-4 mr-1" /> Reja o'rnatish</TabsTrigger><TabsTrigger value="result"><BarChart3 className="w-4 h-4 mr-1" /> Bajarilish</TabsTrigger></TabsList>

          <TabsContent value="plan">
            <div className="bg-card rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Agent</TableHead><TableHead className="text-center">Summa rejasi</TableHead><TableHead className="text-center">Miqdor rejasi</TableHead>
                  <TableHead className="text-center">Hajm rejasi</TableHead><TableHead className="text-center">AKB rejasi</TableHead><TableHead className="text-center">Buyurtma rejasi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      {months[month]} {year} uchun reja o'rnatilmagan
                      <div className="text-xs mt-1">Excel import yoki qo'lda kiriting</div>
                    </TableCell></TableRow>
                  ) : plans.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.agent}</TableCell>
                      <TableCell className="text-center"><Input type="number" className="w-28 mx-auto text-center" defaultValue={p.reja_summa} /></TableCell>
                      <TableCell className="text-center"><Input type="number" className="w-24 mx-auto text-center" defaultValue={p.reja_miqdor} /></TableCell>
                      <TableCell className="text-center"><Input type="number" className="w-24 mx-auto text-center" /></TableCell>
                      <TableCell className="text-center"><Input type="number" className="w-20 mx-auto text-center" defaultValue={p.reja_akb} /></TableCell>
                      <TableCell className="text-center"><Input type="number" className="w-20 mx-auto text-center" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="result">
            <div className="bg-card rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-center">Summa (reja/fakt)</TableHead><TableHead className="text-center">Pulse %</TableHead>
                  <TableHead className="text-center">Miqdor (reja/fakt)</TableHead>
                  <TableHead className="text-center">AKB (reja/fakt)</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />Natijalar uchun avval reja o'rnating
                    </TableCell></TableRow>
                  ) : plans.map((p, i) => {
                    const pls = pulse(p.reja_summa, p.fakt_summa)
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.agent}</TableCell>
                        <TableCell className="text-center font-mono">{formatCurrency(p.reja_summa)} / {formatCurrency(p.fakt_summa)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${pls >= 80 ? "bg-emerald-500" : pls >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pls}%` }} /></div>
                            <span className="font-bold text-sm">{pls}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{p.reja_miqdor} / {p.fakt_miqdor}</TableCell>
                        <TableCell className="text-center font-mono">{p.reja_akb} / {p.fakt_akb}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
