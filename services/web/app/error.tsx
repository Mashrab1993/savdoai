"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[App Error]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Xatolik yuz berdi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
            {error?.message || "Noma'lum xato. Iltimos, qayta urinib ko'ring."}
          </p>
          {error?.digest && (
            <p className="text-xs text-slate-400 font-mono">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Qayta urinish
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
            <Home className="w-4 h-4" /> Bosh sahifa
          </Button>
        </div>
      </div>
    </div>
  )
}
