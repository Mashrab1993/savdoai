"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("SavdoAI Error:", error)
  }, [error])

  return (
    <html lang="uz">
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="p-4 rounded-full bg-destructive/10 inline-flex">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Kutilmagan xato
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sahifada xatolik yuz berdi. Iltimos qayta urinib ko'ring.
              </p>
              {error?.digest && (
                <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                  Kod: {error.digest}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Qayta urinish
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.location.href = "/dashboard"}>
                <Home className="w-4 h-4" />
                Bosh sahifa
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
