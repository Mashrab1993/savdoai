"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, BarChart3, Award, Building2, MapPin, TrendingUp, Filter } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

interface AnalysisRow {
  nomi: string
  ulush: number  // doля
  summa: number
  hajm: number
  blok: number
  miqdor: number
  akb: number
}

const SECTIONS = [
  { key: "category", label: "Kategoriyalar bo'yicha", icon: BarChart3 },
  { key: "group",    label: "Guruh bo'yicha",         icon: Users },
  { key: "brand",    label: "Brend bo'yicha",         icon: Award },
  { key: "direction", label: "Yo'nalish bo'yicha",   icon: TrendingUp },
]

export default function SupervisorDashboardPage() {
  const [tab, setTab] = useState("category")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [status, setStatus] = useState("all")
  const [data] = useState<AnalysisRow[]>([])

  const total = data.reduce((s, r) => s + r.summa, 0)

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
          icon={BarChart3}
          gradient="emerald"
          title="Supervisor panel"
          subtitle="Sotuv tahlili — kategoriya, guruh, brend, yo'nalish bo'yicha"
        />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-card">
              <option value="all">Barcha statuslar</option>
              <option value="new">Yangi</option>
              <option value="shipped">Otgruzhen</option>
              <option value="delivered">Dostavlen</option>
              <option value="returned">Vozvrat</option>
            </select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="Sana dan" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="Sana gacha" />
            <Button className="bg-purple-600 hover:bg-purple-700">Filter</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground">Jami summa</div>
            <div className="text-2xl font-bold mt-1 text-violet-700 dark:text-violet-300">{formatCurrency(total)}</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground">Jami buyurtmalar</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground">AKB (faol mijozlar)</div>
            <div className="text-2xl font-bold mt-1 text-emerald-700">0</div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4">
            <div className="text-sm text-muted-foreground">O'rtacha chek</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(0)}</div>
          </div>
        </div>

        {/* Analysis Tables */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4">
            {SECTIONS.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="gap-1">
                <s.icon className="w-4 h-4" /> {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTIONS.map(s => (
            <TabsContent key={s.key} value={s.key}>
              <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                      <TableHead className="text-violet-700 dark:text-violet-300 font-bold">{s.label.split(" ")[0]}</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">Ulush %</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">Summa</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">Hajm</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">Blok</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">Miqdor</TableHead>
                      <TableHead className="text-center text-violet-700 dark:text-violet-300 font-bold">AKB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          <s.icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          Tahlil uchun ma'lumot yo'q
                        </TableCell>
                      </TableRow>
                    ) : data.map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/50 transition-colors hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{r.nomi}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${r.ulush}%` }} />
                            </div>
                            <span className="font-mono text-xs">{r.ulush.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">{formatCurrency(r.summa)}</TableCell>
                        <TableCell className="text-center font-mono">{r.hajm}</TableCell>
                        <TableCell className="text-center font-mono">{r.blok}</TableCell>
                        <TableCell className="text-center font-mono">{r.miqdor}</TableCell>
                        <TableCell className="text-center font-mono">{r.akb}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Mijoz balanslari", href: "/clients", icon: Users },
            { label: "Qarzlar (agent/expeditor)", href: "/debts", icon: BarChart3 },
            { label: "Akt sverka", href: "/sverka", icon: Shield },
            { label: "Audit", href: "/audit-dashboard", icon: Building2 },
          ].map(l => (
            <a key={l.label} href={l.href} className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-4 hover:border-purple-300 hover:shadow-md transition flex items-center gap-3">
              <l.icon className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
