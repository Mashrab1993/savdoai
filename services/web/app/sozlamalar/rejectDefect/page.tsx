"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { RotateCcw } from "lucide-react"

const REASONS = [
  { id: 1, name: "Brak (qadoq buzuq)", desc: "Yetkazib berishda buzilgan", usage: 18, active: true, color: "rose" },
  { id: 2, name: "Brak (ekspiratsiya)", desc: "Yaroqlilik muddati tugagan", usage: 12, active: true, color: "orange" },
  { id: 3, name: "Notog'ri tovar", desc: "Boshqa tovar yetkazilgan", usage: 8, active: true, color: "amber" },
  { id: 4, name: "Sifat yomon", desc: "Klient sifatdan norozi", usage: 6, active: true, color: "violet" },
  { id: 5, name: "Klient kerak emas", desc: "Klient o'zgartirdi fikrini", usage: 14, active: true, color: "blue" },
  { id: 6, name: "Naqliyot xatosi", desc: "Soatda buzilgan", usage: 4, active: true, color: "cyan" },
]

export default function RejectDefectPage() {
  return (
    <SimpleCrudPage
      title="Qaytarish sabablari"
      subtitle="Возврат va Обмен uchun standart sabablar"
      backHref="/sozlamalar"
      items={REASONS}
      addLabel="Yangi sabab"
      icon={RotateCcw}
      accentColor="orange"
    />
  )
}
