"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search, Plus, DollarSign, Clock, CheckCircle2, AlertTriangle,
  FileText, Sparkles, ArrowRight,
} from "lucide-react"
import Link from "next/link"

const L = {
  title:             { uz: "Hisob-fakturalar",                   ru: "Счета-фактуры" },
  subtitle:          { uz: "Savdo va to'lovlarni boshqarish",     ru: "Управление продажами и платежами" },
  totalRevenue:      { uz: "Jami tushum",                        ru: "Общая выручка" },
  paid:              { uz: "To'langan",                          ru: "Оплачено" },
  pending:           { uz: "Kutilmoqda",                         ru: "Ожидает" },
  overdue:           { uz: "Muddati o'tgan",                     ru: "Просрочено" },
  searchPlaceholder: { uz: "Hisob-faktura yoki mijoz...",        ru: "Счёт или клиент..." },
  allStatus:         { uz: "Barcha holatlar",                    ru: "Все статусы" },
  createInvoice:     { uz: "Faktura yaratish",                   ru: "Создать счёт" },
  invoiceNo:         { uz: "№ Faktura",                          ru: "№ Счёта" },
  clientName:        { uz: "Mijoz",                              ru: "Клиент" },
  issueDate:         { uz: "Sana",                               ru: "Дата" },
  dueDate:           { uz: "To'lov muddati",                     ru: "Срок оплаты" },
  total:             { uz: "Jami summa",                         ru: "Итого" },
  status:            { uz: "Holat",                              ru: "Статус" },
  actions:           { uz: "Amallar",                            ru: "Действия" },
  roadmapBadge:      { uz: "Keyingi bosqich",                    ru: "Следующий этап" },
  emptyHeading:      { uz: "Hisob-faktura moduli tayyorlanmoqda", ru: "Модуль счетов в разработке" },
  emptyBody:         {
    uz: "Hisob-fakturalarni yaratish, yuborish va to'lovlarni kuzatish imkoniyati tez orada qo'shiladi. Kassa va qarzdorliklar bo'limlarida savdolarni hoziroq kuzatishingiz mumkin.",
    ru: "Создание, отправка счетов и отслеживание платежей будут добавлены в ближайшем обновлении. Пока вы можете отслеживать продажи в разделах Касса и Долги.",
  },
  goToDebts:         { uz: "Qarzdorliklarni ko'rish",            ru: "Перейти к долгам" },
  goToCash:          { uz: "Kassaga o'tish",                     ru: "Открыть кассу" },
}

const PLANNED_FEATURES = {
  uz: [
    "Faktura yaratish va PDF eksport",
    "Avtomatik eslatmalar va push-bildirishnomalar",
    "To'lov tarixi va qisman to'lovlar",
    "Mijoz bo'yicha soliq hisob-kitobi",
  ],
  ru: [
    "Создание счетов и экспорт в PDF",
    "Автоматические напоминания и push-уведомления",
    "История платежей и частичная оплата",
    "Налоговый учёт по клиентам",
  ],
}

export default function InvoicesPage() {
  const { locale } = useLocale()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const kpiCards = [
    {
      label: L.totalRevenue[locale],
      value: "—",
      icon: DollarSign,
      colorIcon: "text-primary",
      colorBg: "bg-primary/10",
    },
    {
      label: L.paid[locale],
      value: "—",
      icon: CheckCircle2,
      colorIcon: "text-green-600 dark:text-green-400",
      colorBg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: L.pending[locale],
      value: "—",
      icon: Clock,
      colorIcon: "text-yellow-600 dark:text-yellow-400",
      colorBg: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      label: L.overdue[locale],
      value: "—",
      icon: AlertTriangle,
      colorIcon: "text-destructive",
      colorBg: "bg-red-100 dark:bg-red-900/20",
    },
  ]

  return (
    <AdminLayout title={L.title[locale]}>
      <div className="space-y-6">

        {/* Page header with roadmap badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mt-0.5">{L.subtitle[locale]}</p>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 shrink-0 text-xs font-semibold px-3 py-1 bg-primary/8 text-primary border border-primary/20"
          >
            <Sparkles className="w-3 h-3" />
            {L.roadmapBadge[locale]}
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(s => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 opacity-50 cursor-not-allowed select-none"
              aria-hidden
            >
              <div className={`p-2 rounded-lg shrink-0 ${s.colorBg}`}>
                <s.icon className={`w-4 h-4 ${s.colorIcon}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl font-bold text-foreground">—</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar — visually present, disabled */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between opacity-35 pointer-events-none select-none" aria-hidden>
          <div className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={L.searchPlaceholder[locale]} className="pl-9" disabled />
            </div>
            <Select disabled>
              <SelectTrigger className="w-40"><SelectValue placeholder={L.allStatus[locale]} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L.allStatus[locale]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled className="gap-2">
            <Plus className="w-4 h-4" /> {L.createInvoice[locale]}
          </Button>
        </div>

        {/* Table with rich empty state */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L.invoiceNo[locale]}</TableHead>
                <TableHead>{L.clientName[locale]}</TableHead>
                <TableHead>{L.issueDate[locale]}</TableHead>
                <TableHead>{L.dueDate[locale]}</TableHead>
                <TableHead className="text-right">{L.total[locale]}</TableHead>
                <TableHead>{L.status[locale]}</TableHead>
                <TableHead className="text-right">{L.actions[locale]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>

                    {/* Copy */}
                    <div className="max-w-md space-y-1.5">
                      <p className="font-semibold text-foreground">{L.emptyHeading[locale]}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{L.emptyBody[locale]}</p>
                    </div>

                    {/* Planned features */}
                    <div className="w-full max-w-sm bg-secondary/60 rounded-xl p-4 text-left space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        {locale === "uz" ? "Rejalashtirilgan" : "Запланировано"}
                      </p>
                      {PLANNED_FEATURES[locale].map(f => (
                        <div key={f} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">{f}</p>
                        </div>
                      ))}
                    </div>

                    {/* CTAs to working sections */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Link href="/debts">
                        <Button variant="outline" size="sm" className="gap-2 text-xs">
                          {L.goToDebts[locale]} <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Link href="/cash">
                        <Button variant="outline" size="sm" className="gap-2 text-xs">
                          {L.goToCash[locale]} <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
