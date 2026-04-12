"use client"
import { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tag, Folder, Package, Building, Award, Search, AlertCircle,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

type Facets = {
  jami?: number
  kam_qoldiq?: number
  kategoriyalar?: string[]
  brendlar?: string[]
  segmentlar?: string[]
  ishlab_chiqaruvchilar?: string[]
  savdo_yonalishlari?: string[]
}

async function api<T = unknown>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""
  const base  = process.env.NEXT_PUBLIC_API_URL || ""
  const res = await fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export default function CategoriesPage() {
  const [tab, setTab] = useState("kategoriya")
  const [search, setSearch] = useState("")
  const [facets, setFacets] = useState<Facets>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await api<Facets>("/api/v1/tovarlar/facets")
      setFacets(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sections = [
    { key: "kategoriya",         label: "Kategoriyalar",      icon: Folder,   list: facets.kategoriyalar || [] },
    { key: "brend",              label: "Brendlar",           icon: Award,    list: facets.brendlar || [] },
    { key: "ishlab_chiqaruvchi", label: "Ishlab chiqaruvchi", icon: Building, list: facets.ishlab_chiqaruvchilar || [] },
    { key: "segment",            label: "Segmentlar",         icon: Tag,      list: facets.segmentlar || [] },
    { key: "savdo_yonalishi",    label: "Savdo yo'nalishi",   icon: Package,  list: facets.savdo_yonalishlari || [] },
  ]

  const current = sections.find(s => s.key === tab)
  const filtered = (current?.list || []).filter(x =>
    !search || x.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Folder className="w-7 h-7 text-emerald-600" />
              Tovar kategoriyalari
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tovarlaringizdan avtomatik to&apos;plangan kategoriyalar, brendlar va segmentlar
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Jami tovar</div>
            <div className="text-2xl font-bold">{facets.jami || 0}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            {sections.map(s => (
              <TabsTrigger key={s.key} value={s.key}>
                <s.icon className="w-3 h-3 mr-1" />
                {s.label}
                <Badge variant="secondary" className="ml-1.5">{s.list.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map(s => (
            <TabsContent key={s.key} value={s.key} className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={`${s.label} ichidan qidirish...`} value={search}
                       onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>

              <div className="bg-card border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10">
                          <div className="animate-spin h-6 w-6 border-b-2 border-emerald-500 rounded-full mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                          <s.icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          {s.label} topilmadi
                          <div className="text-xs mt-1">
                            Tovar qo&apos;shganda ushbu maydonlarni to&apos;ldiring
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((name, i) => (
                      <TableRow key={name}>
                        <TableCell className="font-mono text-xs">#{i + 1}</TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">
                          <a href={`/products?${s.key}=${encodeURIComponent(name)}`}
                             className="text-xs text-blue-600 underline">
                            Tovarlarni ko&apos;rish →
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="font-bold mb-1">💡 Avtomatik kategoriyalar:</div>
          <div>
            Ushbu ro&apos;yxatlar{" "}
            <a href="/products" className="underline font-semibold">/products</a>{" "}
            sahifasidagi tovarlardan avtomatik yig&apos;iladi.
            Yangi brend yoki kategoriya qo&apos;shish uchun yangi tovar qo&apos;shganda
            kerakli maydonlarni to&apos;ldiring. Barcha maydonlar SalesDoc bilan mos:
            brend, ishlab chiqaruvchi, segment, savdo yo&apos;nalishi, kategoriya.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
