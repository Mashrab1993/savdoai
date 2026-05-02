"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Box } from "lucide-react"

const TYPES = [
  { id: 1, name: "Холодильник", desc: "Coca-Cola/Pepsi reklam holodilnik", usage: 84, active: true, color: "blue" },
  { id: 2, name: "Стенд (POS-стенд)", desc: "Markaziy stand mahsulot uchun", usage: 142, active: true, color: "violet" },
  { id: 3, name: "Полка", desc: "Brand-specific shelf", usage: 96, active: true, color: "emerald" },
  { id: 4, name: "Витрина", desc: "Oyna ko'rgazma", usage: 24, active: true, color: "amber" },
  { id: 5, name: "Морозильник", desc: "Muzlatkich (sok/ice cream)", usage: 18, active: true, color: "cyan" },
  { id: 6, name: "Display table", desc: "Floor display table", usage: 32, active: true, color: "rose" },
  { id: 7, name: "POS material", desc: "Reklam material (poster, sticker)", usage: 248, active: true, color: "lime" },
]

export default function InventoryTypePage() {
  return (
    <SimpleCrudPage
      title="Inventar turlari"
      subtitle="Klientga qo'yilgan reklam jihozlari"
      backHref="/sozlamalar"
      items={TYPES}
      addLabel="Yangi tur"
      icon={Box}
      accentColor="blue"
    />
  )
}
