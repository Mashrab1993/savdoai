"use client"
import { use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, FileText, History, Download, Repeat, Printer, Building2, User, Calendar } from "lucide-react"
import Link from "next/link"

const MOCK_ORDER = {
  id: "d0_103840",
  date_order: "2026-04-30",
  date_shipped: "2026-04-30",
  warehouse: "Asosiy sklad",
  agent: "ДАВЛАТ",
  expeditor: "ДАВЛАТ",
  status: "Yetkazildi",
  client: { id: "k0_192", name: "Диёрбек Ака Челак", address: "Челак" },
  items: [
    { id: 1, code: "1006", name: "PRIMA GREEN", category: "Maishiy kimyo", price: 45000, qty: 7, block: 1, total: 315000 },
    { id: 2, code: "1003", name: "SLADUS", category: "Shirinlik", price: 24000, qty: 6, block: 1, total: 144000 },
    { id: 3, code: "1009", name: "COLGATE", category: "Gigiyena", price: 12000, qty: 12, block: 0, total: 144000 },
    { id: 4, code: "1004", name: "ERFIBLESS", category: "Shirinlik", price: 18000, qty: 4, block: 0, total: 72000 },
    { id: 5, code: "1010", name: "HEAD & SHOULDERS", category: "Gigiyena", price: 56000, qty: 5, block: 0, total: 280000 },
  ],
  discount: 0,
  total: 1033500,
  comment: "",
  created_by: "ДАВЛАТ - Ekspeditor",
  created_at: "2026-04-30 08:45:12",
  modified_by: "samsladus - Administrator",
  modified_at: "2026-04-30 09:15:33",
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const o = MOCK_ORDER

  return (
    <AdminLayout>
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/zakazlar" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Zakazlar ro'yxatiga
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <History className="w-4 h-4" /> Tarix
            </Button>
            <Button variant="outline" size="sm">
              <Repeat className="w-4 h-4" /> Konvertirovat
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4" /> Накладная
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" /> Tahrirlash
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4" /> O'chirish
            </Button>
          </div>
        </div>

        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Zakaz #{o.id}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  ✓ {o.status}
                </span>
                <span className="text-sm text-slate-500">Sklad: {o.warehouse}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Umumiy summa</div>
              <div className="text-4xl font-bold text-slate-900 tabular-nums">{o.total.toLocaleString()} so'm</div>
            </div>
          </div>

          {/* Audit info */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-200">
            <Info icon={Building2} label="Klient" value={o.client.name} link={`/klientlar/${o.client.id}`} />
            <Info icon={User} label="Agent" value={o.agent} />
            <Info icon={Calendar} label="Zakaz sanasi" value={o.date_order} />
            <Info icon={Calendar} label="Otgruzka sanasi" value={o.date_shipped} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-500">
            <div>
              <strong>Yaratdi:</strong> {o.created_by}<br />
              <span>{o.created_at}</span>
            </div>
            <div>
              <strong>Tahrir qildi:</strong> {o.modified_by}<br />
              <span>{o.modified_at}</span>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tovarlar</h3>
              <p className="text-sm text-slate-500 mt-0.5">{o.items.length} tip · {o.items.reduce((s, i) => s + i.qty, 0)} dona umumiy</p>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" /> Tovar qo'shish
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Kod</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Tovar</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Kategoriya</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Narx</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Blok</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Soni</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {o.items.map((it, i) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-500">{it.code}</td>
                    <td className="px-4 py-3 text-base font-medium">{it.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">{it.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{it.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">{it.block}</td>
                    <td className="px-4 py-3 text-base text-right tabular-nums font-semibold">{it.qty}</td>
                    <td className="px-4 py-3 text-base text-right tabular-nums font-bold">{it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-sm">Tovar (jami):</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold">{o.total.toLocaleString()}</td>
                </tr>
                {o.discount > 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right text-sm">Chegirma:</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-rose-600">-{o.discount.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-emerald-50">
                  <td colSpan={7} className="px-4 py-3 text-right text-base font-semibold">Umumiy:</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-2xl text-emerald-700">{o.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Comment */}
        {o.comment && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-900">Izoh</div>
                <div className="text-sm text-amber-700">{o.comment}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

function Info({ icon: Icon, label, value, link }: { icon: React.ElementType; label: string; value: string; link?: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      {link ? (
        <Link href={link} className="text-base font-semibold text-emerald-700 hover:underline">
          {value}
        </Link>
      ) : (
        <div className="text-base font-semibold text-slate-900">{value}</div>
      )}
    </div>
  )
}
