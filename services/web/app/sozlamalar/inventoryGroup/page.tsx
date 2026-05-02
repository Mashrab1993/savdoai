"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Boxes } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Coca-Cola POS", desc: "Coca-Cola jihozlari guruhi", usage: 142, active: true, color: "rose" },
  { id: 2, name: "Bonjur stand", desc: "Bonjur shokolad standlari", usage: 84, active: true, color: "amber" },
  { id: 3, name: "Choco-Boom display", desc: "Choco-Boom show", usage: 56, active: true, color: "violet" },
  { id: 4, name: "Suv bottling", desc: "Coolers + dispensers", usage: 24, active: true, color: "blue" },
  { id: 5, name: "Generic POS", desc: "Brand neytral material", usage: 96, active: true, color: "emerald" },
]
export default function InventoryGroupPage() {
  return <SimpleCrudPage title="Inventar guruhi" subtitle="Brand-specific inventar guruhlash" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi guruh" icon={Boxes} accentColor="violet" />
}
