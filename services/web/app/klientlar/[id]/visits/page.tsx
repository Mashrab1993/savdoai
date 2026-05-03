"use client"
import { use } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function KlientVisitsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  useEffect(() => { router.replace(`/klientlar/${id}`) }, [router, id])
  return <div className="min-h-screen flex items-center justify-center">Yo'naltirilmoqda...</div>
}
