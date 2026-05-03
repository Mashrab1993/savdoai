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
  { id: 1, title: "Kompaniya bilan tanishish", description: "Kompaniya tarixi, missiya, mahsulot katalogi", status: "completed", daysToComplete: 1, resources: ["Tanishish video (15 min)", "Onboarding kitobcha"] },
  { id: 2, title: "Tizimga kirish", description: "SavdoAI mobil ilova, akkaunt sozlash, parol", status: "completed", daysToComplete: 1, resources: ["Ilova o'rnatish", "Birinchi qadamlar"] },
  { id: 3, title: "Tovarlar haqida o'rganish", description: "150+ tovar, narxlar, marka tafovuti", status: "completed", daysToComplete: 3, resources: ["Tovar katalogi", "Test (40 savol)"] },
  { id: 4, title: "Klient turlari", description: "RFM segmentlash, klient bilan muloqot", status: "active", daysToComplete: 2, resources: ["RFM kitobcha", "Webinar (45 min)"] },
  { id: 5, title: "Birinchi vizit (mentor bilan)", description: "Tajribali agent bilan ishga chiqish", status: "active", daysToComplete: 1, resources: ["Mentor: BORIEV M.", "Vizit checklist"] },
  { id: 6, title: "Mustaqil zakaz", description: "Birinchi mustaqil sotuv", status: "locked", daysToComplete: 1, resources: ["Sotuv jarayoni", "Sotuv treningi"] },
  { id: 7, title: "10 ta mustaqil vizit", description: "Birinchi haftadagi natija", status: "locked", daysToComplete: 7, resources: ["KPI dashboard"] },
  { id: 8, title: "Yakuniy attestatsiya", description: "Bilim va ko'nikmalarni tekshirish", status: "locked", daysToComplete: 1, resources: ["Attestatsiya test", "Menejer bilan suhbat"] },
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
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Onboarding <span className="italic text-[#C75D3C]">yangi agent</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{NEW_AGENTS.length} ta yangi agent · onboarding davri {totalDays} kun</p>
            </div>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi agent</Button>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <Users className="w-5 h-5 text-emerald-700" /> Yangi agentlar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {NEW_AGENTS.map(a => {
                const progress = Math.round((a.currentStep / a.totalSteps) * 100)
                return (
                  <Card
                    key={a.id}
                    onClick={() => setActiveAgent(a)}
                    className={`p-5 cursor-pointer transition-all border rounded-2xl ${activeAgent.id === a.id ? "ring-2 ring-[#C75D3C] bg-[#FAF7F2] border-[#C75D3C]" : "border-[#E8E0D3] bg-white hover:shadow-md"}`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0" style={{ background: "#C75D3C" }}>
                        {a.name.split(" ").map(s => s[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-[#1A1A1A]">{a.name}</div>
                        <div className="text-xs text-[#9C8A6E] font-mono tabular-nums">{a.phone}</div>
                      </div>
                    </div>
                    <div className="text-xs text-[#9C8A6E] mb-2">Mentor: <span className="font-medium text-[#1A1A1A]">{a.mentor}</span></div>
                    <div className="text-xs text-[#9C8A6E] mb-1">Qo'shildi: {a.joinDate}</div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#6B5B4D]">Bosqich {a.currentStep}/{a.totalSteps}</span>
                        <span className="font-medium text-[#1A1A1A] font-mono tabular-nums">{progress}%</span>
                      </div>
                      <div className="h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                        <div className={`h-full ${progress >= 75 ? "bg-emerald-600" : progress >= 50 ? "bg-[#D97706]" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Card>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
              <GraduationCap className="w-5 h-5 text-purple-700" />
              Onboarding bosqichlari · {activeAgent.name}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs uppercase tracking-wider font-medium text-emerald-700">Tugatildi</div>
                <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{completedSteps}/{STEPS.length}</div>
              </div>
              <div className="p-4 bg-[#FCE9DD] rounded-xl border border-[#FCE9DD]">
                <div className="text-xs uppercase tracking-wider font-medium text-[#D97706]">Hozir</div>
                <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{activeSteps}</div>
              </div>
              <div className="p-4 bg-[#F0EAE0] rounded-xl border border-[#E8E0D3]">
                <div className="text-xs uppercase tracking-wider font-medium text-[#6B5B4D]">Qoldi</div>
                <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{STEPS.length - completedSteps - activeSteps}</div>
              </div>
            </div>

            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === "completed" ? "bg-emerald-600" : step.status === "active" ? "bg-[#D97706] ring-4 ring-[#FCE9DD]" : "bg-[#E8E0D3]"
                    }`}>
                      {step.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                       step.status === "active" ? <Circle className="w-5 h-5 text-white animate-pulse" /> :
                       <Lock className="w-4 h-4 text-[#9C8A6E]" />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.status === "completed" ? "bg-emerald-300" : "bg-[#E8E0D3]"}`} style={{ minHeight: "40px" }} />
                    )}
                  </div>
                  <div className={`flex-1 pb-3 ${step.status === "locked" ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono tabular-nums text-[#9C8A6E] uppercase tracking-wider">Bosqich {step.id}</span>
                      {step.status === "completed" && <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Tugadi</span>}
                      {step.status === "active" && <span className="text-xs px-2 py-0.5 rounded bg-[#FCE9DD] text-[#D97706]">Davom etmoqda</span>}
                      {step.status === "locked" && <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D]">Yopiq</span>}
                      <span className="text-xs text-[#9C8A6E]">{step.daysToComplete} kun</span>
                    </div>
                    <div className="font-medium text-[#1A1A1A]">{step.title}</div>
                    <div className="text-sm text-[#6B5B4D] mt-0.5">{step.description}</div>
                    {step.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {step.resources.map((r, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded bg-[#FAF7F2] text-[#6B5B4D] border border-[#E8E0D3]">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
