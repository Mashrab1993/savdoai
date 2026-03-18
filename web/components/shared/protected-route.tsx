"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

/**
 * Redirects to /login when not authenticated. Use to wrap app routes once backend auth is live.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login")
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null
  return <>{children}</>
}
