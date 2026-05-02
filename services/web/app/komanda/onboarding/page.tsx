"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Circle, Lock, Users, Plus, GraduationCap } from "lucide-react"
import Link from "next/link"

type OnboardingStep = {
  id: number; title: string; description: string; status: "completed" | "active" | "locked";
  daysToComplete: number; resources: string[];
}

const STEPS: OnboardingStep[] = [
  { id: 1, title: "Kompaniya bilan tanishish", description: "Kompaniya tarixi, missiya, mahsulot katalogi", status: "completed", daysToComplete: 1, resources: ["📺 Tanishish video (15 min)", "📕 Onboarding kitobcha"] },
  { id: 2, title: "Tizimga kirish", description: "SavdoAI mobil ilova, akkaunt sozlash, parol", status: "completed", daysToComplete: 1, resources: ["📱 Ilova o'rnatish", "📕 Birinchi qadamlar"] },
  { id: 3, title: "Tovarlar haqida o'rganish", description: "150+ tovar, narxlar, marka tafovuti", status: "completed", daysToComplete: 3, resources: ["📕 Tovar katalogi", "🎯 Test (40 savol)"] },
  { id: 4, title: "Klient turlari", description: "RFM segmentlash, klient bilan muloqot", status: "active", daysToComplete: 2, resources: ["📕 RFM kitobcha", "🎓 Webinar (45 min)"] },
  { id: 5, title: "Birinchi vizit (mentor bilan)", description: "Tajribali agent bilan ishga chiqish", status: "active", daysToComplete: 1, resources: ["👥 Mentor: BORIEV M.", "📋 Vizit checklist"] },
  { id: 6, title: "Mustaqil zakaz", description: "Birinchi mustaqil sotuv", status: "locked", daysToComplete: 1, resources: ["📋 Sotuv jarayoni", "🎓 Sotuv treningi"] },
  { id: 7, title: "10 ta mustaqil vizit", description: "Birinchi haftadagi natija", status: "locked", daysToComplete: 7, resources: ["📊 KPI dashboard"] },
  { id: 8, title: "Yakuniy attestatsiya", description: "Bilim va ko'nikmalarni tekshirish", status: "locked", daysToComplete: 1, resources: ["🎯 Attestatsiya test", "👔 Menejer bilan suhbat"] },
]

const NEW_AGENTS = [
  { id: 1, name: "Karimov Aziz", phone: "+998 90 111 22 33", joinDate: "2026-04-15", currentStep: 5, totalSteps: 8, mentor: "BORIEV M." },
  { id: 2, name: "Yusupova Mehriniso", phone: "+998 90 222 33 44", joinDate: "2026-04-20", currentStep: 4, totalSteps: 8, mentor: "Babadjanova N." },
  { id: 3, name: "Toxirjon Olim", phone: "+998 90 333 44 55", joinDate: "2026-04-25", currentStep: 3, totalSteps: 8, mentor: "Berdiyev R." },
  { id: 4, name: "Sodiqov Bekzod", phone: "+998 90 444 55 66", joinDate: "2026-05-01", currentStep: 1, totalSteps: 8, mentor: "ДАВЛАТ" },
]

export default function OnboardingPage() {
  const [activeAgent, setActiveAgent] = useState(NEW_AGENTS[0])

  const completedSteps = STEPS.filter(s => s.status === "completed").length
  const activeSteps = STEPS.filter(s => s.status === "active").length
  const totalDays = STEPS.reduce((s, x) => s + x.daysToComplete, 0)

  return (
    <AdminLayout>
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Onboarding (yangi agent)</h1>
            <p className="text-sm text-slate-500">{NEW_AGENTS.length} ta yangi agent · onboarding davri {totalDays} kun</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi agent</Button>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Yangi agentlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {NEW_AGENTS.map(a => {
              const progress = Math.round((a.currentStep / a.totalSteps) * 100)
              return (
                <Card
                  key={a.id}
                  onClick={() => setActiveAgent(a)}
                  className={`p-4 cursor-pointer transition-all ${activeAgent.id === a.id ? "ring-2 ring-emerald-500 bg-emerald-50" : "hover:shadow-md"}`}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {a.name.split(" ").map(s => s[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{a.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{a.phone}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">Mentor: <span className="font-bold">{a.mentor}</span></div>
                  <div className="text-xs text-slate-500 mb-1">Qo'shildi: {a.joinDate}</div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Bosqich {a.currentStep}/{a.totalSteps}</span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${progress >= 75 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-violet-600" />
            Onboarding bosqichlari · {activeAgent.name}
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-xs font-bold text-emerald-700">Tugatildi</div>
              <div className="text-2xl font-bold">{completedSteps}/{STEPS.length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-xs font-bold text-amber-700">Hozir</div>
              <div className="text-2xl font-bold">{activeSteps}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs font-bold text-slate-700">Qoldi</div>
              <div className="text-2xl font-bold">{STEPS.length - completedSteps - activeSteps}</div>
            </div>
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === "completed" ? "bg-emerald-500" : step.status === "active" ? "bg-amber-500 ring-4 ring-amber-200" : "bg-slate-300"
                  }`}>
                    {step.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                     step.status === "active" ? <Circle className="w-5 h-5 text-white animate-pulse" /> :
                     <Lock className="w-4 h-4 text-white" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 ${step.status === "completed" ? "bg-emerald-300" : "bg-slate-200"}`} style={{ minHeight: "40px" }} />
                  )}
                </div>
                <div className={`flex-1 pb-3 ${step.status === "locked" ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">Bosqich {step.id}</span>
                    {step.status === "completed" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Tugadi</span>}
                    {step.status === "active" && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">⏳ Davom etmoqda</span>}
                    {step.status === "locked" && <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">🔒 Yopiq</span>}
                    <span className="text-xs text-slate-500">{step.daysToComplete} kun</span>
                  </div>
                  <div className="font-bold">{step.title}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{step.description}</div>
                  {step.resources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {step.resources.map((r, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
