"use client"
import { useState, use } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Edit, Trash2, Plus, Map as MapIcon, History,
  ShoppingBag, Truck, MapPin, AlertCircle, DollarSign, Refrigerator, FileText,
  Phone, Building2, User, Calendar
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
  const _resolved = use(params)
  const [activeTab, setActiveTab] = useState("orders")
  const c = MOCK_CLIENT

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          {/* Breadcrumb + actions */}
          <div className="flex items-center justify-between">
            <Link href="/klientlar" className="flex items-center gap-2 text-sm text-[#6B5B4D] hover:text-[#C75D3C]">
              <ArrowLeft className="w-4 h-4" /> Klientlar ro'yxatiga
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]">
                <Edit className="w-4 h-4" /> Tahrirlash
              </Button>
              <Button size="sm" style={{ background: "#C75D3C" }}>
                <Plus className="w-4 h-4" /> Yangi zakaz
              </Button>
              <Button variant="outline" size="sm" className="border-[#E8E0D3] text-[#6B5B4D]">
                <MapIcon className="w-4 h-4" /> Xaritada
              </Button>
              <Button variant="outline" size="sm" className="border-[#C75D3C] text-[#C75D3C]">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Hero card */}
          <Card className="p-7 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: "linear-gradient(135deg, #C75D3C 0%, #E27B5C 100%)" }}>
                <Building2 className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KLIENT</div>
                    <h1 className="text-3xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{c.name}</h1>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Faol
                      </span>
                      <span className="text-sm text-[#9C8A6E]">ID: <span className="font-mono text-[#1A1A1A]">{c.id}</span></span>
                      <span className="text-sm text-[#9C8A6E]">RFM: <strong className="text-[#C75D3C]">{c.rfm}</strong></span>
                      <span className="text-sm text-[#9C8A6E]">Tier: <strong className="text-[#1A1A1A]">{c.classification}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium">Joriy balans</div>
                    <div className={`text-3xl font-medium tabular-nums mt-1 ${c.balance_total < 0 ? 'text-[#C75D3C]' : 'text-emerald-700'}`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                      {c.balance_total.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9C8A6E]">so'm</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-5 pt-5 border-t border-[#F0EAE0]">
              <Stat label="Kategoriya" value={c.category} />
              <Stat label="Sub-kategoriya" value={c.subcategory} />
              <Stat label="Territoriya" value={c.territory} />
              <Stat label="Vizit kunlari" value={c.visit_days} />
              <Stat label="Telefon" value={c.phone} icon={Phone} />
              <Stat label="Agent" value={c.agent} icon={User} />
              <Stat label="Жами zakaz" value={`${c.total_orders} ta`} icon={ShoppingBag} />
              <Stat label="Tushum (lifetime)" value={`${c.total_revenue.toLocaleString()} so'm`} icon={DollarSign} />
            </div>

            <div className="mt-4 pt-4 border-t border-[#F0EAE0] flex items-center justify-between text-xs text-[#9C8A6E]">
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
          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="flex border-b border-[#E8E0D3] overflow-x-auto bg-[#FAF7F2]/50">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-[#C75D3C] text-[#C75D3C] bg-[#FCE9DD]/40"
                        : "border-transparent text-[#6B5B4D] hover:text-[#1A1A1A] hover:bg-[#F0EAE0]/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6">
              {activeTab === "orders" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-light text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Zakazlar tarixi <span className="text-[#9C8A6E]">({MOCK_ORDERS.length})</span></h3>
                    <Button size="sm" style={{ background: "#C75D3C" }}>
                      <Plus className="w-4 h-4" /> Yangi zakaz
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                        <tr>
                          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">ID</th>
                          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Sana</th>
                          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Agent</th>
                          <th className="text-right px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                          <th className="text-right px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Summa</th>
                          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_ORDERS.map(o => (
                          <tr key={o.id} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                            <td className="px-3 py-2.5 font-mono text-sm">
                              <Link href={`/zakazlar/${o.id}`} className="text-[#C75D3C] hover:underline">{o.id}</Link>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[#1A1A1A]">{o.date}</td>
                            <td className="px-3 py-2.5 text-sm text-[#6B5B4D]">{o.agent}</td>
                            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-[#1A1A1A]">{o.items}</td>
                            <td className="px-3 py-2.5 text-sm text-right tabular-nums font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{o.amount.toLocaleString()}</td>
                            <td className="px-3 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Yetkazildi</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "debts" && (
                <div>
                  <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Qarz tahlili (Aging analysis)</h3>
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
                  <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>To'lovlar tarixi</h3>
                  <div className="space-y-2">
                    {[
                      { date: "2026-05-01 14:30", amount: 286570, type: "Naqd", agent: "шероз - Ekspeditor" },
                      { date: "2026-04-25 10:15", amount: 850000, type: "Bank", agent: "ДАВЛАТ" },
                      { date: "2026-04-15 16:45", amount: 1200000, type: "Naqd", agent: "ДАВЛАТ" },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-3 px-4 bg-[#FAF7F2] border border-[#E8E0D3] rounded-xl">
                        <div>
                          <div className="font-medium text-[#1A1A1A] tabular-nums" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{p.amount.toLocaleString()} so'm</div>
                          <div className="text-xs text-[#9C8A6E]">{p.date} · {p.agent}</div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">{p.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "coords" && (
                <div>
                  <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Lokatsiya</h3>
                  <div className="aspect-video bg-[#FAF7F2] border border-[#E8E0D3] rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="w-12 h-12 mx-auto mb-2 text-[#9C8A6E]" />
                      <p className="text-[#6B5B4D]">Yandex Maps integratsiyasi</p>
                      <p className="text-sm text-[#9C8A6E] mt-1 font-mono">Lat: 39.6543, Lng: 66.9543</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#1A1A1A]">
                    <div><span className="text-[#9C8A6E]">Manzil:</span> {c.address}</div>
                    <div><span className="text-[#9C8A6E]">Orientir:</span> {c.landmark}</div>
                  </div>
                </div>
              )}

              {activeTab === "equipment" && (
                <div>
                  <h3 className="text-xl font-light text-[#1A1A1A] mb-4" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>Uskunalar (Холодильник, Стенд, ...)</h3>
                  <p className="text-[#9C8A6E]">Hozircha uskuna biriktirilmagan</p>
                </div>
              )}

              {activeTab === "income" && <div className="text-[#9C8A6E]">Tovar kelishi tarixi</div>}
              {activeTab === "changes" && <div className="text-[#9C8A6E]">O'zgarish jurnali (audit log)</div>}
              {activeTab === "documents" && <div className="text-[#9C8A6E]">Hujjatlar (Накладные, Akt sverki)</div>}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[#9C8A6E] font-medium mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className="text-base font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{value}</div>
    </div>
  )
}

function AgingBucket({ label, amount, alert }: { label: string; amount: number; alert?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${
      amount === 0 ? "bg-[#FAF7F2] border-[#E8E0D3]" :
      alert ? "bg-[#F5E5D6] border-[#C75D3C]/30" : "bg-emerald-50 border-emerald-200"
    }`}>
      <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E] mb-1">{label}</div>
      <div className={`text-xl font-medium tabular-nums ${
        amount === 0 ? "text-[#9C8A6E]" : alert ? "text-[#C75D3C]" : "text-emerald-700"
      }`} style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
        {amount.toLocaleString()}
      </div>
    </div>
  )
}
