"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { FileText } from "lucide-react"

const NOTES = [
  { id: 1, name: "Ertaga yetkazib bering", desc: "Standart yetkazish izohi", usage: 412, active: true, color: "emerald" },
  { id: 2, name: "Bugun (express)", desc: "Maxsus tezkor yetkazish", usage: 86, active: true, color: "blue" },
  { id: 3, name: "Naqd to'lash", desc: "Yetkazganda naqd qabul qiling", usage: 124, active: true, color: "amber" },
  { id: 4, name: "Click/Payme to'lash", desc: "Online to'lov bilan", usage: 248, active: true, color: "violet" },
  { id: 5, name: "Diqqat ehtiyotkor!", desc: "Mo'rt tovar (стекло)", usage: 18, active: true, color: "rose" },
  { id: 6, name: "Mas'ul kerak", desc: "Direktor topshirsin", usage: 32, active: true, color: "cyan" },
  { id: 7, name: "Avans olingan", desc: "Yetkazganda qoldiq", usage: 64, active: true, color: "lime" },
  { id: 8, name: "Aksiya tovari", desc: "Aksiya kabi belgilang", usage: 142, active: true, color: "orange" },
]

export default function OrderNotePage() {
  return (
    <SimpleCrudPage
      title="Zakaz izohlari"
      subtitle="Pre-defined izohlar (agent telefon klikida bir click)"
      backHref="/sozlamalar"
      items={NOTES}
      addLabel="Yangi izoh"
      icon={FileText}
      accentColor="emerald"
    />
  )
}
