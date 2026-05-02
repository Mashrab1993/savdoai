"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { CreditCard } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Klient to'lovi", desc: "Klientdan kirim to'lov", usage: 4248, active: true, color: "emerald" },
  { id: 2, name: "Klient avansi", desc: "Klient avans to'lovi", usage: 412, active: true, color: "blue" },
  { id: 3, name: "Postavshikga to'lov", desc: "Postavshik uchun chiqim", usage: 248, active: true, color: "rose" },
  { id: 4, name: "Postavshik avansi", desc: "Postavshikga avans", usage: 86, active: true, color: "orange" },
  { id: 5, name: "Ish haqi", desc: "Xodimlarga ish haqi", usage: 124, active: true, color: "violet" },
  { id: 6, name: "Arenda", desc: "Ofis/Sklad arenda", usage: 48, active: true, color: "amber" },
  { id: 7, name: "Komunal", desc: "Elektr/gaz/suv", usage: 36, active: true, color: "cyan" },
  { id: 8, name: "Yoqilg'i / GSM", desc: "Avtomashina uchun", usage: 412, active: true, color: "lime" },
]
export default function SubkategoriyaPage() {
  return <SimpleCrudPage title="To'lov subkategoriyasi" subtitle="Kassa operatsiyalari uchun ichki kategoriya" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi subkategoriya" icon={CreditCard} accentColor="emerald" />
}
