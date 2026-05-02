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
      <div className="max-w-[1900px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/hisobot" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight flex-1">Контроль ванселинга</h1>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> ЭКСПОРТ</Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Тип даты</label>
              <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option>Дата заявки</option>
                <option>Дата отгрузки</option>
                <option>Дата доставки</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block">Vansel</label>
              <select className="px-3 py-2 border border-slate-300 rounded-md text-sm w-56">
                <option>Все vansels</option>
                <option>Турсунов Жамшед</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 w-10">№</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 min-w-[150px]">VANSEL</th>
                  <th colSpan={2} className="border border-slate-300 py-2 px-2 bg-emerald-50">ОСТАТОК НА НАЧАЛО ДНЯ</th>
                  <th colSpan={2} className="border border-slate-300 py-2 px-2 bg-emerald-50">ОСТАТОК НА КОНЕЦ ДНЯ</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 bg-blue-50 min-w-[80px]">СУММА ОТГРУЗКИ</th>
                  <th colSpan={3} className="border border-slate-300 py-2 px-2 bg-violet-50">ПРОДАЖА</th>
                  <th colSpan={3} className="border border-slate-300 py-2 px-2 bg-amber-50">ОБМЕН</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 bg-rose-50 min-w-[80px]">ОПЛАТА ПО ЗАКАЗАМ</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 bg-cyan-50 min-w-[80px]">ПОПОЛНЕНИЕ БАЛАНСА</th>
                  <th rowSpan={2} className="border border-slate-300 py-2 px-2 bg-lime-50 min-w-[100px]">КОНСИГНАЦИЯ</th>
                </tr>
                <tr className="bg-slate-100 text-[10px]">
                  <th className="border border-slate-300 py-1 px-2 bg-emerald-50">шт.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-emerald-50">бл.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-emerald-50">шт.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-emerald-50">бл.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-violet-50">шт.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-violet-50">бл.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-violet-50">сумма</th>
                  <th className="border border-slate-300 py-1 px-2 bg-amber-50">шт.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-amber-50">бл.</th>
                  <th className="border border-slate-300 py-1 px-2 bg-amber-50">сумма</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr key={r.idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center">{r.idx}</td>
                    <td className="border border-slate-300 py-2 px-2 font-semibold">{r.vansel}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-emerald-700 underline">{r.startSt}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-emerald-700 underline">{r.startBl}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-emerald-700 underline">{r.endSt}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-emerald-700 underline">{r.endBl}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-blue-700 underline">{r.otgruz}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-violet-700 underline">{r.prodSt}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-violet-700 underline">{r.prodBl}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-violet-700 underline">{r.prodSum}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-amber-700 underline">{r.exchSt}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-amber-700 underline">{r.exchBl}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-amber-700 underline">{r.exchSum}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">{r.oplata}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">{r.popol}</td>
                    <td className="border border-slate-300 py-2 px-2 text-center">{r.kons}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2">ИТОГО</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.startSt}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.startBl}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.endSt}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.endBl}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.otgruz}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.prodSt}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.prodBl}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.prodSum}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.exchSt}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.exchBl}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.exchSum}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.oplata}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.popol}</td>
                  <td className="border border-slate-300 py-2 px-2 text-center">{itog.kons}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
