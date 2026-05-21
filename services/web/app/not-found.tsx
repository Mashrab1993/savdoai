import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <FileQuestion className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <div className="text-5xl font-bold text-slate-900 dark:text-white">404</div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Sahifa topilmadi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="gap-2">
            <Home className="w-4 h-4" /> Bosh sahifaga qaytish
          </Button>
        </Link>
      </div>
    </div>
  )
}
