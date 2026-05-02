"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Tags } from "lucide-react"

const TAGS = [
  { id: 1, name: "VIP", desc: "Eng katta klientlar", usage: 24, active: true, color: "amber" },
  { id: 2, name: "Aksiya 2026", desc: "Hozirgi aksiya tovarlari", usage: 84, active: true, color: "violet" },
  { id: 3, name: "Yangi", desc: "Yangi qo'shilgan klient/tovar", usage: 142, active: true, color: "emerald" },
  { id: 4, name: "Diqqat", desc: "Maxsus e'tibor", usage: 38, active: true, color: "rose" },
  { id: 5, name: "Premium", desc: "Premium kategoriya", usage: 56, active: true, color: "blue" },
  { id: 6, name: "Brak ko'p", desc: "Tez-tez brak chiqaradi", usage: 8, active: true, color: "orange" },
  { id: 7, name: "Punctual", desc: "Vaqtida to'laydi", usage: 124, active: true, color: "cyan" },
  { id: 8, name: "Eski klient", desc: "5+ yillik klient", usage: 96, active: true, color: "lime" },
]

export default function TagPage() {
  return (
    <SimpleCrudPage
      title="Teglar (Free-form)"
      subtitle="Klient va tovarga ixtiyoriy belgilar"
      backHref="/sozlamalar"
      items={TAGS}
      addLabel="Yangi teg"
      icon={Tags}
      accentColor="violet"
    />
  )
}
