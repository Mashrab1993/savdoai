"use client"
import { useState } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, GraduationCap, BookOpen, Video, FileText, Plus, Star, Search, Clock, Users, Sparkles } from "lucide-react"
import Link from "next/link"

type Course = {
  id: number; title: string; type: "video" | "article" | "quiz" | "live";
  category: string; duration: number; difficulty: "beginner" | "intermediate" | "advanced";
  enrolled: number; completed: number; rating: number; required: boolean;
}

const COURSES: Course[] = [
  { id: 1, title: "Sotuv asoslari (Sales 101)", type: "video", category: "Sotuv", duration: 45, difficulty: "beginner", enrolled: 12, completed: 10, rating: 4.7, required: true },
  { id: 2, title: "Klient bilan muloqot", type: "video", category: "Klient", duration: 60, difficulty: "beginner", enrolled: 12, completed: 8, rating: 4.5, required: true },
  { id: 3, title: "Tovar katalogi (150 SKU)", type: "article", category: "Tovar", duration: 90, difficulty: "beginner", enrolled: 12, completed: 9, rating: 4.6, required: true },
  { id: 4, title: "Vansel sotuv texnikasi", type: "video", category: "Sotuv", duration: 30, difficulty: "intermediate", enrolled: 8, completed: 6, rating: 4.8, required: false },
  { id: 5, title: "RFM segmentlash", type: "quiz", category: "Klient", duration: 20, difficulty: "intermediate", enrolled: 6, completed: 5, rating: 4.4, required: false },
  { id: 6, title: "AI Copilot bilan ishlash", type: "live", category: "AI", duration: 60, difficulty: "intermediate", enrolled: 4, completed: 2, rating: 4.9, required: false },
  { id: 7, title: "Jamoa boshqarish (menejerlar uchun)", type: "video", category: "Menejment", duration: 90, difficulty: "advanced", enrolled: 3, completed: 2, rating: 4.7, required: false },
  { id: 8, title: "Murakkab muzokara", type: "live", category: "Sotuv", duration: 120, difficulty: "advanced", enrolled: 2, completed: 1, rating: 4.8, required: false },
  { id: 9, title: "Sklad qarz tahlili", type: "article", category: "Sklad", duration: 30, difficulty: "intermediate", enrolled: 5, completed: 4, rating: 4.3, required: false },
  { id: 10, title: "Yakuniy attestatsiya", type: "quiz", category: "Tizim", duration: 60, difficulty: "advanced", enrolled: 12, completed: 8, rating: 4.5, required: true },
]

const TYPE_ICON: Record<string, any> = { video: Video, article: FileText, quiz: BookOpen, live: Users }
const TYPE_COLOR: Record<string, string> = {
  video: "bg-blue-50 text-blue-700",
  article: "bg-emerald-50 text-emerald-700",
  quiz: "bg-purple-50 text-purple-700",
  live: "bg-[#FCE9DD] text-[#D97706]",
}
const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700",
  intermediate: "bg-[FCE9DD] text-[#D97706]",
  advanced: "bg-[#F5E5D6] text-[#C75D3C]",
}
const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Boshlang'ich",
  intermediate: "O'rta",
  advanced: "Yuqori",
}

export default function TrainingPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const categories = Array.from(new Set(COURSES.map(c => c.category)))

  const filtered = COURSES
    .filter(c => categoryFilter === "all" || c.category === categoryFilter)
    .filter(c => typeFilter === "all" || c.type === typeFilter)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))

  const totalEnrolled = COURSES.reduce((s, c) => s + c.enrolled, 0)
  const totalCompleted = COURSES.reduce((s, c) => s + c.completed, 0)
  const completionRate = Math.round((totalCompleted / totalEnrolled) * 100)

  return (
    <AdminLayout>
      <div className="-mx-4 -my-4 px-4 py-6 min-h-full" style={{ background: "linear-gradient(180deg, #F5F1EB 0%, #FAF7F2 100%)" }}>
        <div className="max-w-[1700px] mx-auto space-y-5">
          <div className="flex items-end gap-3 border-b border-[#E8E0D3] pb-6">
            <Link href="/komanda" className="p-2 hover:bg-[#F0EAE0] rounded-lg"><ArrowLeft className="w-5 h-5 text-[#6B5B4D]" /></Link>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-[#9C8A6E] font-medium mb-2">SAVDOAI · KOMANDA</div>
              <h1 className="text-4xl font-light tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>
                Trening <span className="italic text-[#C75D3C]">akademiya</span>
              </h1>
              <p className="text-sm text-[#6B5B4D] mt-2">{COURSES.length} ta kurs · {totalEnrolled} ro'yxat · {completionRate}% tugatish</p>
            </div>
            <Button className="gap-1 text-white" style={{ background: "#C75D3C" }}><Plus className="w-4 h-4" /> Yangi kurs</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <BookOpen className="w-5 h-5 text-emerald-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Jami kurslar</div>
              <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{COURSES.length}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <Users className="w-5 h-5 text-blue-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Ro'yxatdan o'tgan</div>
              <div className="text-3xl font-light mt-1 text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{totalEnrolled}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <Star className="w-5 h-5 text-purple-700 mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Tugatish %</div>
              <div className="text-3xl font-light mt-1 font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{completionRate}%</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            </Card>
            <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 relative overflow-hidden">
              <Clock className="w-5 h-5 text-[#D97706] mb-2" />
              <div className="text-xs uppercase tracking-wider font-medium text-[#9C8A6E]">Total minut</div>
              <div className="text-3xl font-light mt-1 font-mono tabular-nums text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>{COURSES.reduce((s, c) => s + c.duration, 0)}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D97706]" />
            </Card>
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-[#E8E0D3] rounded-md px-3 py-2 text-sm bg-white text-[#1A1A1A]">
                <option value="all">Barcha kategoriya</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-[#E8E0D3] rounded-md px-3 py-2 text-sm bg-white text-[#1A1A1A]">
                <option value="all">Barcha tur</option>
                <option value="video">Video</option>
                <option value="article">Maqola</option>
                <option value="quiz">Test</option>
                <option value="live">Jonli</option>
              </select>
              <div className="ml-auto relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8A6E]" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kurs nomi..." className="pl-9 w-64 border-[#E8E0D3]" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const Icon = TYPE_ICON[c.type]
              const completionPct = Math.round((c.completed / c.enrolled) * 100)
              return (
                <Card key={c.id} className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[c.type]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base text-[#1A1A1A]">{c.title}</h3>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {c.required && <span className="text-xs px-2 py-0.5 rounded bg-[#F5E5D6] text-[#C75D3C]">Majburiy</span>}
                        <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLOR[c.difficulty]}`}>
                          {DIFFICULTY_LABEL[c.difficulty]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#9C8A6E] mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration} min</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrolled}</span>
                    <span className="flex items-center gap-1 text-[#D97706]"><Star className="w-3 h-3 fill-[#D97706]" /> {c.rating}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#F0EAE0] text-[#6B5B4D]">{c.category}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9C8A6E]">{c.completed} / {c.enrolled} tugatildi</span>
                      <span className="font-medium font-mono tabular-nums text-[#1A1A1A]">{completionPct}%</span>
                    </div>
                    <div className="h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                      <div className={`h-full ${completionPct >= 80 ? "bg-emerald-600" : completionPct >= 60 ? "bg-[#D97706]" : "bg-blue-600"}`} style={{ width: `${completionPct}%` }} />
                    </div>
                  </div>

                  <Button size="sm" className="w-full text-white" style={{ background: "#C75D3C" }}>Boshlash</Button>
                </Card>
              )
            })}
          </div>

          <Card className="bg-white border border-[#E8E0D3] shadow-sm rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-[#C75D3C] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-[#1A1A1A]" style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}>AI Akademiya tavsiyasi</h3>
                <p className="text-sm text-[#6B5B4D] mt-1">
                  AI Турсунов Ж. uchun "Sotuv asoslari" + "Klient muloqoti" treningini birlashtirilgan kurs sifatida tavsiya qiladi.
                  BORIEV M. uchun "Murakkab muzokara" advanced kursi tavsiya etilgan (2 ta sertifikat olishga yaqin).
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
