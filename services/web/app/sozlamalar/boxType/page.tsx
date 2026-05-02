"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Square } from "lucide-react"

const BOXES = [
  { id: 1, name: "Блок (24 dona)", desc: "Standart blok", usage: 856, active: true, color: "blue" },
  { id: 2, name: "Коробка (48 dona)", desc: "Katta korobka", usage: 412, active: true, color: "violet" },
  { id: 3, name: "Пачка (12 dona)", desc: "Kichik pachka", usage: 248, active: true, color: "emerald" },
  { id: 4, name: "Мешок (kg)", desc: "Vaznli mehnat", usage: 184, active: true, color: "amber" },
  { id: 5, name: "Лоток (тары)", desc: "Buyurtma uchun trayni", usage: 96, active: true, color: "rose" },
  { id: 6, name: "Поддон (palette)", desc: "Yirik palet (1000 dona)", usage: 24, active: true, color: "cyan" },
  { id: 7, name: "Картон (large)", desc: "Yirik karton", usage: 56, active: true, color: "lime" },
]

export default function BoxTypePage() {
  return (
    <SimpleCrudPage
      title="Quti / Pachka turlari"
      subtitle="Tovar qadog'lash uchun standart konteyner"
      backHref="/sozlamalar"
      items={BOXES}
      addLabel="Yangi tur"
      icon={Square}
      accentColor="blue"
    />
  )
}
