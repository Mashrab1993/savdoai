"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Briefcase } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Sladkiy Mir LLC", desc: "Bonjur, Choco-Boom · 86 SKU", usage: 248, active: true, color: "emerald" },
  { id: 2, name: "Bonjur Distribution", desc: "Bonjur shokolad ekslyuziv", usage: 142, active: true, color: "violet" },
  { id: 3, name: "Coca-Cola Uzbekistan", desc: "Coca, Fanta, Sprite, Schweppes", usage: 412, active: true, color: "rose" },
  { id: 4, name: "Aqua-Plus Distrib.", desc: "Suv va sok", usage: 86, active: true, color: "blue" },
  { id: 5, name: "Hilol Pechen'e", desc: "Pechen'e, vafli, salat", usage: 64, active: true, color: "amber" },
  { id: 6, name: "Truffles Confectionery", desc: "Trufeli, kompot", usage: 24, active: true, color: "lime" },
  { id: 7, name: "Yubileynoye", desc: "Pechen'e premium", usage: 38, active: true, color: "cyan" },
  { id: 8, name: "Eco-Drink", desc: "Tabiy soklar (apelsin, olma)", usage: 56, active: true, color: "orange" },
]
export default function PartnerPage() {
  return <SimpleCrudPage title="Partnyorlar (Postavshiklar)" subtitle="78 ta postavshik, ekslyuziv kontraktlar" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi partnyor" icon={Briefcase} accentColor="violet" />
}
