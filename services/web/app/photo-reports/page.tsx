"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Camera, Search, Download, Filter, Image as ImageIcon, MapPin, Calendar } from "lucide-react"

export default function PhotoReportsPage() {
  const [search, setSearch] = useState("")
  const [photos] = useState<any[]>([])

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="w-7 h-7 text-purple-600" />
              Foto hisobotlar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agentlar tomonidan yuklangan rasmlar va vizit hisobotlari
            </p>
          </div>
          <Button variant="outline"><Download className="w-4 h-4 mr-1" /> Excel</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Jami fotolar", value: 0, color: "purple" },
            { label: "Bugungi", value: 0, color: "emerald" },
            { label: "Bu hafta", value: 0, color: "blue" },
            { label: "Bu oy", value: 0, color: "orange" },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <div className={`text-sm text-${s.color}-600`}>{s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Agent yoki mijoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Input type="date" className="w-40" />
          <Button variant="outline"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
        </div>

        {photos.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-20 text-center">
            <Camera className="w-16 h-16 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">Foto hisobotlar topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1">Agentlar @savdo_avtomatlashtirish_bot orqali rasm yuborganda bu yerda ko'rinadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p: any, i: number) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden hover:shadow-md transition">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{p.klient || "Mijoz"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {p.agent || "Agent"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {p.sana || "Sana"}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">{p.kategoriya || "Foto"}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
