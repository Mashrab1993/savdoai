"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { ArrowLeftRight } from "lucide-react"
const ITEMS = [
  { id: 1, name: "Дистрибьюция (Дистрибуция)", desc: "Standart distrubitsiya kanal", usage: 4248, active: true, color: "emerald" },
  { id: 2, name: "ОПТ (ulgurji)", desc: "Yirik ulgurji savdo", usage: 624, active: true, color: "blue" },
  { id: 3, name: "Розница", desc: "Chakana savdo", usage: 1240, active: true, color: "violet" },
  { id: 4, name: "Хорека", desc: "Hotel/Restoran/Kafe", usage: 142, active: true, color: "amber" },
  { id: 5, name: "Тендер", desc: "Davlat tenderlari", usage: 18, active: true, color: "rose" },
  { id: 6, name: "Маршрут", desc: "Mobil agent yoligi", usage: 612, active: true, color: "cyan" },
]
export default function TradeDirectionPage() {
  return <SimpleCrudPage title="Savdo yo'nalishi" subtitle="Trade direction (Distribution / Opt / Rozn / HoReCa)" backHref="/sozlamalar" items={ITEMS} addLabel="Yangi yo'nalish" icon={ArrowLeftRight} accentColor="emerald" />
}
