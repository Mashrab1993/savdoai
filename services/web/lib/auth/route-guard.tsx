"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-context"

const PUBLIC_ROUTES = ["/login"]

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/p/")

  useEffect(() => {
    if (loading) return
    if (!token && !isPublic) {
      router.replace("/login")
    }
    if (token && pathname === "/login") {
      router.replace("/dashboard")
    }
  }, [token, loading, pathname, isPublic, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Block render until redirect happens
  if (!token && !isPublic) return null
  if (token && pathname === "/login") return null

  return <>{children}</>
}
