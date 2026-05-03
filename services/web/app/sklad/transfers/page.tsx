"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
export default function TransfersRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/sklad/peremeshenie") }, [router])
  return <div className="min-h-screen flex items-center justify-center">Yo'naltirilmoqda...</div>
}
