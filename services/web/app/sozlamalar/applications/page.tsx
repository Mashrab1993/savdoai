"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Smartphone } from "lucide-react"
const ITEMS = [
  { id: 1, name: "SavdoAI Agent (Android)", desc: "v26.0 · Google Play · 24 user", usage: 18420, active: true, color: "emerald" },
  { id: 2, name: "SavdoAI Agent (iOS)", desc: "v26.0 · App Store · 8 user", usage: 6240, active: true, color: "blue" },
  { id: 3, name: "SavdoAI Web", desc: "Browser · barcha rollar · 42 user", usage: 28480, active: true, color: "violet" },
  { id: 4, name: "Telegram bot (@savdoai)", desc: "Voice + komanda · 156 user", usage: 142840, active: true, color: "cyan" },
  { id: 5, name: "Telegram Mini App", desc: "Direct link · klient zakaz", usage: 4280, active: true, color: "rose" },
  { id: 6, name: "SavdoAI Sklad (tablet)", desc: "Faqat sklad operatorlari · 4", usage: 3640, active: true, color: "amber" },
]
export default function ApplicationsPage() {
  return <SimpleCrudPage title="Mobil ilovalar (Apps)" subtitle="App config va session count" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi ilova" icon={Smartphone} accentColor="emerald" />
}
