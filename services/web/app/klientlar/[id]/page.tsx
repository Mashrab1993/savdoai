"use client"
import { useState, use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Edit, Trash2, Plus, Map as MapIcon, History,
  ShoppingBag, Truck, RotateCcw, MapPin, AlertCircle, DollarSign, Refrigerator, FileText,
  Phone, Building2, Tag, User, Calendar
} from "lucide-react"
import Link from "next/link"

const TABS = [
  { key: "orders", label: "Заказы", icon: ShoppingBag },
  { key: "income", label: "Поступление", icon: Truck },
  { key: "changes", label: "Изменения", icon: History },
  { key: "coords", label: "Координаты", icon: MapPin },
  { key: "debts", label: "Долги", icon: AlertCircle },
  { key: "payments", label: "Оплата", icon: DollarSign },
  { key: "equipment", label: "Оборудование", icon: Refrigerator },
  { key: "documents", label: "Документы", icon: FileText },
]

const MOCK_CLIENT = {
  id: "l2_4206",
  name: "Бегзод Маркет № 0 (Бигзод Маркет)",
  active: true,
  category: "Розница",
  subcategory: "Магазин",
  type: "Физическое лицо",
  territory: "Самарканд / Sayfullin",
  address: "ул. Sayfullin Гадой Дамаз, 12",
  landmark: "Метро ёнida",
  inn: "987654321",
  phone: "+998 (91) 316-16-66",
  contact: "Bekzod Akmalov",
  agent: "ДАВЛАТ",
  expeditor: "ДАВЛАТ",
  visit_days: "Vt, Pt",
  date_created: "2024-08-15",
  created_by: "samsladus",
  modified: "2026-04-30 14:23",
  modified_by: "BORIEV MIRJALOL",
  balance_cash: 1500000,
  balance_bank: 0,
  balance_total: 1500000,
  total_orders: 66,
  total_revenue: 3656000,
  rfm: "111",
  classification: "5-10 mln",
}

const MOCK_ORDERS = [
  { id: "d0_103840", date: "2026-04-30", agent: "ДАВЛАТ", amount: 1033500, status: "delivered", items: 7 },
  { id: "d0_103820", date: "2026-04-25", agent: "ДАВЛАТ", amount: 850000, status: "delivered", items: 5 },
  { id: "d0_103790", date: "2026-04-18", agent: "ДАВЛАТ", amount: 1200000, status: "delivered", items: 8 },
  { id: "d0_103750", date: "2026-04-10", agent: "ДАВЛАТ", amount: 572500, status: "delivered", items: 4 },
]

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params)
  const id = resolved.id
  const [activeTab, setActiveTab] = useState("orders")
  const c = MOCK_CLIENT // real backend ulanganda by id

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-5">
        {/* Breadcrumb + Back */}
        <div className="flex items-center justify-between">
          <Link href="/klientlar" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Klientlar ro'yxatiga
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" /> Tahrirlash
            </Button>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" /> Yangi zakaz
            </Button>
            <Button variant="outline" size="sm">
              <MapIcon className="w-4 h-4" /> Xaritada
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4" /> O'chirish
            </Button>
          </div>
        </div>

        {/* Header card */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50 border-emerald-200">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{c.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Faol
                    </span>
                    <span className="text-sm text-slate-500">ID: {c.id}</span>
                    <span className="text-sm text-slate-500">RFM: <strong>{c.rfm}</strong></span>
                    <span className="text-sm text-slate-500">Tier: <strong>{c.classification}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Joriy balans</div>
                  <div className={`text-3xl font-bold tabular-nums ${c.balance_total < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {c.balance_total.toLocaleString()} so'm
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-emerald-200">
            <Stat label="Kategoriya" value={c.category} />
            <Stat label="Sub-kategoriya" value={c.subcategory} />
            <Stat label="Territoriya" value={c.territory} />
            <Stat label="Vizit kunlari" value={c.visit_days} />
            <Stat label="Telefon" value={c.phone} icon={Phone} />
            <Stat label="Agent" value={c.agent} icon={User} />
            <Stat label="Жами zakaz" value={`${c.total_orders} ta`} icon={ShoppingBag} />
            <Stat label="Tushum (lifetime)" value={`${c.total_revenue.toLocaleString()} so'm`} icon={DollarSign} />
          </div>

          {/* Audit trail */}
          <div className="mt-4 pt-4 border-t border-emerald-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Yaratildi: {c.date_created} ({c.created_by})
            </div>
            <div className="flex items-center gap-2">
              <Edit className="w-3.5 h-3.5" />
              O'zgartirildi: {c.modified} ({c.modified_by})
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-emerald-600 text-emerald-700 bg-emerald-50/30"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === "orders" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Zakazlar tarixi ({MOCK_ORDERS.length})</h3>
                  <Button size="sm">
                    <Plus className="w-4 h-4" /> Yangi zakaz
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-sm font-semibold">ID</th>
                        <th className="text-left px-3 py-2 text-sm font-semibold">Sana</th>
                        <th className="text-left px-3 py-2 text-sm font-semibold">Agent</th>
                        <th className="text-right px-3 py-2 text-sm font-semibold">Tovar</th>
                        <th className="text-right px-3 py-2 text-sm font-semibold">Summa</th>
                        <th className="text-left px-3 py-2 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MOCK_ORDERS.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-sm text-slate-500">
                            <Link href={`/zakazlar/${o.id}`} className="hover:text-emerald-600">{o.id}</Link>
                          </td>
                          <td className="px-3 py-2 text-sm">{o.date}</td>
                          <td className="px-3 py-2 text-sm">{o.agent}</td>
                          <td className="px-3 py-2 text-sm text-right tabular-nums">{o.items}</td>
                          <td className="px-3 py-2 text-sm text-right tabular-nums font-semibold">{o.amount.toLocaleString()}</td>
                          <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Yetkazildi</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "debts" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Qarz tahlili (Aging analysis)</h3>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                  <AgingBucket label="0-7 kun" amount={500000} />
                  <AgingBucket label="8-15 kun" amount={300000} />
                  <AgingBucket label="16-30 kun" amount={200000} />
                  <AgingBucket label="31-50 kun" amount={150000} alert />
                  <AgingBucket label="51-90 kun" amount={350000} alert />
                  <AgingBucket label="90+ kun" amount={0} />
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">To'lovlar tarixi</h3>
                <div className="space-y-2">
                  {[
                    { date: "2026-05-01 14:30", amount: 286570, type: "Naqd", agent: "шероз - Ekspeditor" },
                    { date: "2026-04-25 10:15", amount: 850000, type: "Bank", agent: "ДАВЛАТ" },
                    { date: "2026-04-15 16:45", amount: 1200000, type: "Naqd", agent: "ДАВЛАТ" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{p.amount.toLocaleString()} so'm</div>
                        <div className="text-xs text-slate-500">{p.date} · {p.agent}</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">{p.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "coords" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Lokatsiya</h3>
                <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-600">Yandex Maps integratsiyasi</p>
                    <p className="text-sm text-slate-500 mt-1">Lat: 39.6543, Lng: 66.9543</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><strong>Manzil:</strong> {c.address}</div>
                  <div><strong>Orientir:</strong> {c.landmark}</div>
                </div>
              </div>
            )}

            {activeTab === "equipment" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Uskunalar (Холодильник, Стенд, ...)</h3>
                <p className="text-slate-500">Hozircha uskuna biriktirilmagan</p>
              </div>
            )}

            {activeTab === "income" && <div className="text-slate-500">Tovar kelishi tarixi</div>}
            {activeTab === "changes" && <div className="text-slate-500">O'zgarish jurnali (audit log)</div>}
            {activeTab === "documents" && <div className="text-slate-500">Hujjatlar (Накладные, Akt sverki)</div>}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function AgingBucket({ label, amount, alert }: { label: string; amount: number; alert?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border-2 ${
      amount === 0 ? "bg-slate-50 border-slate-200" :
      alert ? "bg-rose-50 border-rose-300" : "bg-emerald-50 border-emerald-200"
    }`}>
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${
        amount === 0 ? "text-slate-400" : alert ? "text-rose-700" : "text-emerald-700"
      }`}>
        {amount.toLocaleString()}
      </div>
    </div>
  )
}
