"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Container } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Stekol bottle 1.5L", desc: "Coca-Cola, Fanta · 500 so'm zalog", usage: 2480, active: true, color: "emerald" },
  { id: 2, name: "Stekol bottle 0.5L", desc: "Mineral suv · 300 so'm zalog", usage: 1240, active: true, color: "blue" },
  { id: 3, name: "Plastik 5L", desc: "Suv kanistr · 1000 so'm", usage: 856, active: true, color: "violet" },
  { id: 4, name: "Plastik 2L", desc: "Soda · 500 so'm", usage: 412, active: true, color: "amber" },
  { id: 5, name: "Yashik (sok)", desc: "Sok yashigi · 5000 so'm", usage: 184, active: true, color: "rose" },
  { id: 6, name: "Поддон (palette)", desc: "Yog'och poddon · 30000 so'm", usage: 24, active: true, color: "cyan" },
]
export default function TaraPage() {
  return <SimpleCrudPage title="Tara (Container deposit)" subtitle="Bottle/Konteyner zalog (qaytarib olish)" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi tara" icon={Container} accentColor="emerald" />
}
