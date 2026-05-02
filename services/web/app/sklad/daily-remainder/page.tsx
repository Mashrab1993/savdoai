"use client"
import { useState } from "react"
import { PremiumPage, PremiumCard, PremiumSectionHeader } from "@/components/layout/premium-page"
import { Calendar, Download } from "lucide-react"

const DATA = [
  { product: "Choco-Boom 75g",          "01": 1480, "08": 1320, "15": 1120, "22": 1280, "29": 1240, today: 1240 },
  { product: "Coca-Cola 1.5L",          "01": 1080, "08": 880,  "15": 720,  "22": 920,  "29": 888,  today: 888 },
  { product: "Bonjur 50g",              "01": 480,  "08": 360,  "15": 300,  "22": 280,  "29": 240,  today: 240 },
  { product: "Sok Apelsin 1L",          "01": 280,  "08": 220,  "15": 180,  "22": 200,  "29": 156,  today: 156 },
  { product: "Pechenye Yubileynoye",    "01": 360,  "08": 320,  "15": 290,  "22": 270,  "29": 282,  today: 282 },
  { product: "Voda Premium 1L",         "01": 220,  "08": 180,  "15": 140,  "22": 100,  "29": 84,   today: 84  },
  { product: "Biskvit Triton 150g",     "01": 80,   "08": 60,   "15": 60,   "22": 40,   "29": 60,   today: 60  },
  { product: "Chay Dilmah",             "01": 40,   "08": 36,   "15": 24,   "22": 16,   "29": 12,   today: 12  },
]

const DATES = ["01.05", "08.05", "15.05", "22.05", "29.05", "Bugun"]

function fmt(n: number) { return n.toLocaleString("ru-RU") }

export default function DailyRemainderPage() {
  const [selectedDate] = useState("today")

  return (
    <PremiumPage
      backLink={{ href: "/sklad", label: "SKLAD" }}
      title="Sana bo'yicha"
      accent="qoldiq"
      description={`${DATA.length} ta tovar · 30-kun davomida har hafta snapshot · time-travel rejimi`}
      actions={
        <>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Sana tanlash
          </button>
          <button className="px-3 py-2 rounded-md border border-[#E8E0D3] bg-white text-sm flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </>
      }
    >
      <PremiumCard className="p-6">
        <PremiumSectionHeader eyebrow="HAR HAFTA SNAPSHOT" title="Qoldiq dinamikasi" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0D3] bg-[#FAF7F2]">
                <th className="text-left py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tovar</th>
                {DATES.map(d => (
                  <th key={d} className="text-right py-3 px-3 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">{d}</th>
                ))}
                <th className="text-center py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Trend</th>
              </tr>
            </thead>
            <tbody>
              {DATA.map(row => {
                const start = (row as any)["01"] as number
                const end = row.today
                const change = ((end - start) / start * 100)
                return (
                  <tr key={row.product} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                    <td className="py-3 px-2 font-medium text-[#1A1A1A]">{row.product}</td>
                    {DATES.map((d, i) => {
                      const key = i === 5 ? "today" : ["01", "08", "15", "22", "29"][i]
                      const val = (row as any)[key] as number
                      return (
                        <td key={d} className={`py-3 px-3 text-right font-mono ${i === 5 ? "font-medium text-[#C75D3C]" : "text-[#6B5B4D]"}`}>
                          {fmt(val)}
                        </td>
                      )
                    })}
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-[#F5E5D6] text-[#C75D3C]"}`}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </PremiumPage>
  )
}
