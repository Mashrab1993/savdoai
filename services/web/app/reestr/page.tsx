"use client"
import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardList, Download, Calendar, FileSpreadsheet, Truck } from "lucide-react"
import { formatCurrency } from "@/lib/format"

export default function ReestrPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const { data: rawOrders, loading } = useApi(async () => {
    const token = localStorage.getItem("auth_token")
    const base = process.env.NEXT_PUBLIC_API_URL || ""
    try {
      const res = await fetch(`${base}/api/v1/savdolar`, { headers: { Authorization: `Bearer ${token}` } })
      return res.ok ? res.json() : { items: [] }
    } catch { return { items: [] } }
  })

  const orders = useMemo(() => {
    return (rawOrders as any)?.items || (rawOrders as any)?.sessiyalar || []
  }, [rawOrders])

  const totalSum = orders.reduce((s: number, o: any) => s + (o.jami || 0), 0)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-emerald-600" />
              Reestr (Реестр 3.0)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kunlik buyurtmalar reestri — kassa va boshqaruv uchun
            </p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel yuklab olish
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Reestr — {date}</div>
          <div className="text-3xl font-bold mt-2">{formatCurrency(totalSum)}</div>
          <div className="flex gap-4 mt-4 text-sm opacity-90">
            <div className="flex items-center gap-1"><Truck className="w-4 h-4" /> {orders.length} ta mijoz</div>
            <div>Format: Реестр 3.0</div>
          </div>
        </div>

        {/* Reestr Table - exactly like SalesDoc */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="font-bold">№</TableHead>
                  <TableHead className="font-bold">Дата отгрузки</TableHead>
                  <TableHead className="font-bold">Торгов. Точка</TableHead>
                  <TableHead className="font-bold">Адрес</TableHead>
                  <TableHead className="font-bold">Номер клиента</TableHead>
                  <TableHead className="font-bold">Торгов. Пред.</TableHead>
                  <TableHead className="font-bold text-center">Баланс клиента</TableHead>
                  <TableHead className="font-bold text-center">сум</TableHead>
                  <TableHead className="font-bold text-center">Отметка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Bu sanada buyurtmalar yo'q
                    </TableCell>
                  </TableRow>
                ) : orders.map((o: any, i: number) => (
                  <TableRow key={o.id || i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="text-sm">{date}</TableCell>
                    <TableCell className="font-medium">{o.klient_ismi || "Mijoz"}</TableCell>
                    <TableCell className="text-sm">{o.manzil || ""}</TableCell>
                    <TableCell className="text-sm">{o.telefon || ""}</TableCell>
                    <TableCell className="text-sm">SavdoAI Bot</TableCell>
                    <TableCell className="text-center font-mono">{formatCurrency(o.balans || 0)}</TableCell>
                    <TableCell className="text-center font-mono font-bold">{formatCurrency(o.jami || 0)}</TableCell>
                    <TableCell className="text-center"><input type="checkbox" /></TableCell>
                  </TableRow>
                ))}
                {orders.length > 0 && (
                  <TableRow className="bg-emerald-50 dark:bg-emerald-900/20 font-bold">
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="font-bold text-emerald-700">Total</TableCell>
                    <TableCell colSpan={4}></TableCell>
                    <TableCell className="text-center font-mono font-bold text-emerald-700">{formatCurrency(totalSum)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-sm text-blue-700">
            <div className="font-bold mb-1">Reestr formati: Реестр 3.0</div>
            <div>Kun yakunida ekspeditor olib chiqqan barcha buyurtmalar. Kassa nazorati va hisobot uchun ishlatiladi.</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
