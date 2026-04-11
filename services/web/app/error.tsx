"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[SavdoAI] Xato:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Xatolik yuz berdi</h2>
          <p className="text-muted-foreground text-sm">
            Kutilmagan xato. Sahifani yangilang yoki keyinroq urinib ko'ring.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Qayta urinish
          </Button>
          <Button
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
            size="sm"
          >
            Bosh sahifa
          </Button>
        </div>
      </div>
    </div>
  )
}
