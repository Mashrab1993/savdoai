import { Suspense } from "react"
import PrintClient from "./client"

export const dynamic = "force-dynamic"

export default function ZakazlarPrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>}>
      <PrintClient />
    </Suspense>
  )
}
