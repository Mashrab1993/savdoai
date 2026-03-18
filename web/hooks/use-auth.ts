"use client"

import { useState, useEffect } from "react"
import { isAuthenticated as checkAuth, logout as doLogout } from "@/lib/auth/auth"

/**
 * Auth state for UI. Use in layout/components to protect routes or show user state.
 */
export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    setAuthenticated(checkAuth())
  }, [])

  const logout = () => {
    doLogout()
    setAuthenticated(false)
  }

  return { isAuthenticated: authenticated, logout }
}
