"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ZakazlarYangiRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/sotuv/yangi")
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
      <p className="text-sm text-[#6B5B4D]">Yo'naltirilmoqda...</p>
    </div>
  )
}
