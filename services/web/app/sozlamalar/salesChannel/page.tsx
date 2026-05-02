"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Boxes } from "lucide-react"

const CHANNELS = [
  { id: 1, name: "B2B (oddiy)", desc: "Standart ulgurji savdo", usage: 4248, active: true, color: "emerald" },
  { id: 2, name: "B2C (chakana)", desc: "To'g'ridan-to'g'ri iste'molchi", usage: 1248, active: true, color: "blue" },
  { id: 3, name: "Wholesale (yirik ulgurji)", desc: "Yirik partiyalar", usage: 124, active: true, color: "violet" },
  { id: 4, name: "Online (marketplace)", desc: "Uzum/Yandex orqali", usage: 248, active: true, color: "amber" },
  { id: 5, name: "Маршрут (mob)", desc: "Mobil agent marshruti", usage: 612, active: true, color: "rose" },
  { id: 6, name: "Telegram bot", desc: "Telegram orqali zakaz", usage: 142, active: true, color: "cyan" },
  { id: 7, name: "Хорека (HoReCa)", desc: "Restoran/Kafe/Bar", usage: 86, active: true, color: "lime" },
]

export default function SalesChannelPage() {
  return (
    <SimpleCrudPage
      title="Sotuv kanali"
      subtitle="B2B / B2C / Online / Mobil / HoReCa kanallari"
      backHref="/sozlamalar"
      items={CHANNELS}
      addLabel="Yangi kanal"
      icon={Boxes}
      accentColor="emerald"
    />
  )
}
