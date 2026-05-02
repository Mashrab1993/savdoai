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
  video: "bg-blue-100 text-blue-700",
  article: "bg-emerald-100 text-emerald-700",
  quiz: "bg-violet-100 text-violet-700",
  live: "bg-amber-100 text-amber-700",
}
const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-rose-100 text-rose-700",
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
      <div className="max-w-[1700px] mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/komanda" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-violet-600" />
              Trening katalog (Akademiya)
            </h1>
            <p className="text-sm text-slate-500">{COURSES.length} ta kurs · {totalEnrolled} ro'yxat · {completionRate}% tugatish</p>
          </div>
          <Button className="gap-1"><Plus className="w-4 h-4" /> Yangi kurs</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-emerald-700">Jami kurslar</div>
            <div className="text-2xl font-bold mt-1">{COURSES.length}</div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-blue-700">Ro'yxatdan o'tgan</div>
            <div className="text-2xl font-bold mt-1">{totalEnrolled}</div>
          </Card>
          <Card className="p-4 bg-violet-50 border-violet-200">
            <Star className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xs font-bold text-violet-700">Tugatish %</div>
            <div className="text-2xl font-bold mt-1">{completionRate}%</div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <Clock className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-xs font-bold text-amber-700">Total minut</div>
            <div className="text-2xl font-bold mt-1">{COURSES.reduce((s, c) => s + c.duration, 0)}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="all">Barcha kategoriya</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-slate-300 rounded-md px-3 py-2 text-sm">
              <option value="all">Barcha tur</option>
              <option value="video">📹 Video</option>
              <option value="article">📄 Maqola</option>
              <option value="quiz">📝 Test</option>
              <option value="live">👥 Jonli</option>
            </select>
            <div className="ml-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kurs nomi..." className="pl-9 w-64" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const Icon = TYPE_ICON[c.type]
            const completionPct = Math.round((c.completed / c.enrolled) * 100)
            return (
              <Card key={c.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[c.type]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base">{c.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {c.required && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">★ Majburiy</span>}
                      <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLOR[c.difficulty]}`}>
                        {c.difficulty === "beginner" ? "🟢 Boshlang'ich" : c.difficulty === "intermediate" ? "🟡 O'rta" : "🔴 Yuqori"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duration} min</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrolled}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {c.rating}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{c.category}</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">{c.completed} / {c.enrolled} tugatildi</span>
                    <span className="font-bold">{completionPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${completionPct >= 80 ? "bg-emerald-500" : completionPct >= 60 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${completionPct}%` }} />
                  </div>
                </div>

                <Button size="sm" className="w-full">Boshlash</Button>
              </Card>
            )
          })}
        </div>

        <Card className="p-5 bg-violet-50 border-violet-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-violet-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-violet-800">AI Akademiya tavsiyasi</h3>
              <p className="text-sm text-slate-700 mt-1">
                AI Турсунов Ж. uchun "Sotuv asoslari" + "Klient muloqoti" treningini birlashtirilgan kurs sifatida tavsiya qiladi.
                BORIEV M. uchun "Murakkab muzokara" advanced kursi tavsiya etilgan (2 ta sertifikat olishga yaqin).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
