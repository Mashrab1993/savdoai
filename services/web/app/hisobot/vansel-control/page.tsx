"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import Link from "next/link"

const ROWS = [
  { idx: 1, vansel: "Турсунов Жамшед.", startSt: 10, startBl: 10, endSt: 10, endBl: 10, otgruz: 0, prodSt: 0, prodBl: 0, prodSum: 0, exchSt: 0, exchBl: 0, exchSum: 0, oplata: 0, popol: 0, kons: 0 },
]

const SERIF = { fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }

export default function VanselControlPage() {
  const [date, setDate] = useState("2026-05-02")

  const itog = ROWS.reduce((acc, r) => ({
    startSt: acc.startSt + r.startSt, startBl: acc.startBl + r.startBl,
    endSt: acc.endSt + r.endSt, endBl: acc.endBl + r.endBl,
    otgruz: acc.otgruz + r.otgruz,
    prodSt: acc.prodSt + r.prodSt, prodBl: acc.prodBl + r.prodBl, prodSum: acc.prodSum + r.prodSum,
    exchSt: acc.exchSt + r.exchSt, exchBl: acc.exchBl + r.exchBl, exchSum: acc.exchSum + r.exchSum,
    oplata: acc.oplata + r.oplata, popol: acc.popol + r.popol, kons: acc.kons + r.kons,
  }), { startSt: 0, startBl: 0, endSt: 0, endBl: 0, otgruz: 0, prodSt: 0, prodBl: 0, prodSum: 0, exchSt: 0, exchBl: 0, exchSum: 0, oplata: 0, popol: 0, kons: 0 })

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1900px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/hisobot" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · HISOBOT</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={SERIF}>
                Vansel <span className="italic text-[#C75D3C]">nazorat</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">Vanselling kunlik harakat va qoldiq tahlili</p>
            </div>
            <Button variant="outline" className="gap-2 border-[#E8E0D3] text-[#6B5B4D]"><Download className="w-4 h-4" /> Экспорт</Button>
          </div>

          <Card className="p-5 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#9C8A6E]" />
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44 border-[#E8E0D3]" />
              </div>
              <div>
                <label className="text-xs text-[#9C8A6E] block">Тип даты</label>
                <select className="px-3 py-2 border border-[#E8E0D3] rounded-md text-sm bg-white text-[#1A1A1A]">
                  <option>Дата заявки</option>
                  <option>Дата отгрузки</option>
                  <option>Дата доставки</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#9C8A6E] block">Vansel</label>
                <select className="px-3 py-2 border border-[#E8E0D3] rounded-md text-sm w-56 bg-white text-[#1A1A1A]">
                  <option>Все vansels</option>
                  <option>Турсунов Жамшед</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-0 bg-white border border-[#E8E0D3] shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3]">
                    <th rowSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] w-10">№</th>
                    <th rowSpan={2} className="py-3 px-2 text-left text-xs uppercase tracking-wider font-medium text-[#9C8A6E] min-w-[150px]">Vansel</th>
                    <th colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3]">Остаток на начало</th>
                    <th colSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3]">Остаток на конец</th>
                    <th rowSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3] min-w-[80px]">Сумма отгрузки</th>
                    <th colSpan={3} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3]">Продажа</th>
                    <th colSpan={3} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3]">Обмен</th>
                    <th rowSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3] min-w-[80px]">Оплата по заказам</th>
                    <th rowSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3] min-w-[80px]">Пополнение баланса</th>
                    <th rowSpan={2} className="py-3 px-2 text-xs uppercase tracking-wider font-medium text-[#9C8A6E] border-l border-[#E8E0D3] min-w-[100px]">Консигнация</th>
                  </tr>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D3] text-[10px]">
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium border-l border-[#F0EAE0]">шт.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">бл.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium border-l border-[#F0EAE0]">шт.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">бл.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium border-l border-[#F0EAE0]">шт.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">бл.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">сумма</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium border-l border-[#F0EAE0]">шт.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">бл.</th>
                    <th className="py-2 px-2 text-[#9C8A6E] uppercase tracking-wider font-medium">сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(r => (
                    <tr key={r.idx} className="border-b border-[#F0EAE0] hover:bg-[#FAF7F2]">
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#9C8A6E]">{r.idx}</td>
                      <td className="py-3 px-2 font-medium text-[#1A1A1A]">{r.vansel}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-700">{r.startSt}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-700">{r.startBl}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-700">{r.endSt}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-700">{r.endBl}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-blue-700">{r.otgruz}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums" style={{ color: "#7C3AED" }}>{r.prodSt}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums" style={{ color: "#7C3AED" }}>{r.prodBl}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums" style={{ color: "#7C3AED" }}>{r.prodSum}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#D97706]">{r.exchSt}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#D97706]">{r.exchBl}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#D97706]">{r.exchSum}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{r.oplata}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{r.popol}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{r.kons}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAF7F2] font-medium border-t-2 border-[#E8E0D3]">
                    <td className="py-3 px-2"></td>
                    <td className="py-3 px-2 text-[#1A1A1A]" style={SERIF}>Итого</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.startSt}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.startBl}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.endSt}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.endBl}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.otgruz}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.prodSt}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.prodBl}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.prodSum}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.exchSt}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.exchBl}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.exchSum}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.oplata}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.popol}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-[#1A1A1A]">{itog.kons}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
