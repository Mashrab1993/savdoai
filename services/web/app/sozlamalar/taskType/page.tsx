"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { ListTodo } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Visit (klient ko'rish)", desc: "Standart agent visit", usage: 4248, active: true, color: "emerald" },
  { id: 2, name: "Storecheck", desc: "Mavjudlik foto bilan tasdiqlash", usage: 1842, active: true, color: "blue" },
  { id: 3, name: "Yetkazib berish", desc: "Ekspeditor yetkazish", usage: 624, active: true, color: "violet" },
  { id: 4, name: "Inkasaciya (to'lov yig'ish)", desc: "Klientdan qarz yig'ish", usage: 384, active: true, color: "rose" },
  { id: 5, name: "Inventarizatsiya", desc: "Sklad qoldiq tekshirish", usage: 12, active: true, color: "amber" },
  { id: 6, name: "Reklama jihozi montaj", desc: "Holodilnik/stend", usage: 24, active: true, color: "cyan" },
  { id: 7, name: "Klient bilan kelishuv", desc: "Yangi shartnoma", usage: 38, active: true, color: "lime" },
]
export default function TaskTypePage() {
  return <SimpleCrudPage title="Vazifa turlari (Tasks)" subtitle="Agent uchun vazifa turlari" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi tur" icon={ListTodo} accentColor="emerald" />
}
