"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/api/services"
import { ApiResponseError } from "@/lib/api/client"
import type { MeResponse } from "@/lib/api/types"

interface AuthState {
  user: MeResponse | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  /** Authenticate with a JWT token (obtained from Telegram bot or admin) */
  loginWithToken: (token: string) => Promise<void>
  /** Login with credentials (login+parol or telefon+parol) */
  loginWithCredentials: (data: { login?: string; telefon?: string; parol: string }) => Promise<void>
  /** Legacy compat — redirects to token flow */
  login: (emailOrToken: string, password?: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  })

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as MeResponse
        setState({ user, token: storedToken, loading: false, error: null })
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setState(s => ({ ...s, loading: false }))
      }
    } else if (storedToken) {
      // Token exists but no cached user — fetch /me to verify
      authService.me()
        .then(user => {
          localStorage.setItem(USER_KEY, JSON.stringify(user))
          setState({ user, token: storedToken, loading: false, error: null })
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          setState({ user: null, token: null, loading: false, error: null })
        })
    } else {
      setState(s => ({ ...s, loading: false }))
    }
  }, [])

  const loginWithToken = useCallback(async (token: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // 1. Store token first so apiRequest can use it
      localStorage.setItem(TOKEN_KEY, token)

      // 2. Verify token by calling /api/v1/me
      const user = await authService.me()
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      setState({ user, token, loading: false, error: null })
      router.push("/dashboard")
    } catch (err) {
      // Token was invalid — clean up
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      const msg = err instanceof ApiResponseError
        ? (err.status === 401
          ? "Token yaroqsiz yoki muddati tugagan. Telegram botdan yangi token oling."
          : err.detail)
        : "Serverga ulanib bo'lmadi. API manzilni tekshiring."
      setState(s => ({ ...s, loading: false, error: msg }))
    }
  }, [router])

  // Legacy compat: if called with (email, password), treat first arg as token
  const login = useCallback(async (emailOrToken: string, _password?: string) => {
    // If someone passes what looks like a JWT or token, use it directly
    return loginWithToken(emailOrToken)
  }, [loginWithToken])

  const loginWithCredentials = useCallback(async (data: { login?: string; telefon?: string; parol: string }) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      // 1. Call /auth/login with credentials
      const res = await authService.loginWithCredentials(data)
      const token = res.token || res.access_token || ""

      if (!token) {
        throw new Error("Token olinmadi")
      }

      // 2. Store token
      localStorage.setItem(TOKEN_KEY, token)

      // 3. Verify by calling /me
      const user = await authService.me()
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      setState({ user, token, loading: false, error: null })
      router.push("/dashboard")
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      const msg = err instanceof ApiResponseError
        ? err.detail
        : (err instanceof Error ? err.message : "Serverga ulanib bo'lmadi")
      setState(s => ({ ...s, loading: false, error: msg }))
    }
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ user: null, token: null, loading: false, error: null })
    router.push("/login")
  }, [router])

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithToken, loginWithCredentials, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
