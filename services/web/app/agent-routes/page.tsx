"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Calendar, Users, Plus, Edit, Filter } from "lucide-react"

const DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]

export default function AgentRoutesPage() {
  const [search, setSearch] = useState("")
  const [routes] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-7 h-7 text-emerald-600" />
              Agent marshrutlari
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Hafta kunlari bo'yicha mijoz tashrif jadvali</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Yangi marshrut
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input placeholder="Agent yoki territoriya qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
        </div>

        <div className="bg-card rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Territoriya / Agent</TableHead>
                {DAYS.map(d => <TableHead key={d} className="text-center">{d}</TableHead>)}
                <TableHead className="text-center">Jami</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Marshrutlar topilmadi
                  </TableCell>
                </TableRow>
              ) : routes.map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.nomi}</TableCell>
                  {DAYS.map(d => (
                    <TableCell key={d} className="text-center">
                      {r.kunlar?.[d.toLowerCase()] ? <Badge className="bg-emerald-100 text-emerald-800">{r.kunlar[d.toLowerCase()]}</Badge> : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{r.jami || 0}</TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Edit className="w-3 h-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
