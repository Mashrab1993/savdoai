"use client"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Clock, Check, X, Eye } from "lucide-react"

const DRAFTS = [
  { id: "d0_3290", supplier: "ERFIBLESS", warehouse: "Asosiy sklad", items: 3, total: 1_840_000, createdBy: "Mashrab", createdAt: "2026-05-02 21:00" },
  { id: "d0_3291", supplier: "SLADUS", warehouse: "Asosiy sklad", items: 8, total: 4_280_000, createdBy: "Babadjanova N.", createdAt: "2026-05-02 18:30" },
  { id: "d0_3292", supplier: "PRIMA", warehouse: "Asosiy sklad", items: 12, total: 6_480_000, createdBy: "Berdiyev R.", createdAt: "2026-05-02 16:45" },
  { id: "d0_3293", supplier: "EMERALD CANDY", warehouse: "Химия sklad", items: 6, total: 1_152_000, createdBy: "ДАВЛАТ", createdAt: "2026-05-01 22:15" },
]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DraftPage() {
  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Tasdiqlanmagan"
      accent="postupleniyalar"
      description={`${DRAFTS.length} ta qoralama · postavshikdan kelgan, lekin sklad'ga qabul qilinmagan`}
    >
      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="DRAFT" title="Qabul qilish kutilmoqda" />
        <div className="space-y-3">
          {DRAFTS.map(d => (
            <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF7F2] border-l-2 border-[#D97706]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5E5D6]">
                <Clock className="w-6 h-6 text-[#D97706]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[#C75D3C] font-medium">{d.id}</span>
                  <span className="font-medium text-[#1A1A1A]">{d.supplier}</span>
                  <span className="text-xs text-[#9C8A6E]">→ {d.warehouse}</span>
                </div>
                <div className="text-xs text-[#6B5B4D]">
                  {d.items} pozitsiya · {fmt(d.total)} so'm · {d.createdBy} · {d.createdAt}
                </div>
              </div>
              <button className="p-2 text-[#6B5B4D] hover:bg-white rounded-md">
                <Eye className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" /> Tasdiqlash
              </button>
              <button className="p-2 text-[#C75D3C] hover:bg-[#F5E5D6] rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
