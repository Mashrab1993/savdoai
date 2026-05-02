"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { XCircle } from "lucide-react"

const REASONS = [
  { id: 1, name: "Tovar yo'q", desc: "Klient kutgan tovar omborda mavjud emas", usage: 142, active: true, color: "rose" },
  { id: 2, name: "Klient yopiq", desc: "Magazin yopiq edi", usage: 86, active: true, color: "amber" },
  { id: 3, name: "Klient pul yo'q", desc: "Klient hozir to'lay olmaydi", usage: 64, active: true, color: "orange" },
  { id: 4, name: "Klient kerak emas", desc: "Klient hozircha tovar olmaydi", usage: 124, active: true, color: "blue" },
  { id: 5, name: "Boshqa", desc: "Boshqa sabab", usage: 28, active: true, color: "slate" },
]

export default function RejectPage() {
  return (
    <SimpleCrudPage
      title="Otkaz sabablari"
      subtitle="Klient zakaz bermay turgan paytdagi sabablar"
      backHref="/sozlamalar"
      items={REASONS}
      addLabel="Yangi sabab"
      icon={XCircle}
      accentColor="rose"
    />
  )
}
