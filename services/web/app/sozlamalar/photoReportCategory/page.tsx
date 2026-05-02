"use client"
import { SimpleCrudPage } from "@/components/shared/simple-crud"
import { Camera } from "lucide-react"

const CATEGORIES = [
  { id: 1, name: "Facing (мерчандайзинг)", desc: "Mahsulot polkachada qanday turishi", usage: 412, active: true, color: "emerald" },
  { id: 2, name: "Sklad (omborxona)", desc: "Klient omborxonasidagi qoldiq", usage: 156, active: true, color: "blue" },
  { id: 3, name: "Aksiya (akcionnoye)", desc: "Aksiya tovari ko'rgazmasi", usage: 84, active: true, color: "violet" },
  { id: 4, name: "Raqobat (raqobatchilar)", desc: "Raqobatchi mahsulotlari", usage: 42, active: true, color: "amber" },
  { id: 5, name: "Brak / yaroqsiz", desc: "Buzuq mahsulot, brak", usage: 18, active: true, color: "rose" },
  { id: 6, name: "Inventar (jihoz)", desc: "Bizning holodilnik, stend", usage: 64, active: true, color: "cyan" },
  { id: 7, name: "Ko'rgazma (vitrina)", desc: "Mahsulot vitrinada", usage: 32, active: true, color: "lime" },
  { id: 8, name: "Boshqa", desc: "Boshqa kategoriya", usage: 14, active: true, color: "slate" },
]

export default function PhotoReportCategoryPage() {
  return (
    <SimpleCrudPage
      title="Foto-hisobot kategoriyasi"
      subtitle="Storecheck va merchandising uchun foto turlari"
      backHref="/sozlamalar"
      items={CATEGORIES}
      addLabel="Yangi kategoriya"
      icon={Camera}
      accentColor="emerald"
    />
  )
}
