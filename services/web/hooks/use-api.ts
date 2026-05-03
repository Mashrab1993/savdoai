"use client"
import { useState, useEffect, useCallback } from "react"
import { api, ApiError } from "@/lib/api"

export function useApi<T>(path: string | null, options?: { skip?: boolean }) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!path || options?.skip) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api.get<T>(path)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => {
        if (cancelled) return
        if (e instanceof ApiError) setError(e.detail)
        else setError(e.message || "Xato")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [path, options?.skip, reloadTick])

  const refetch = useCallback(() => setReloadTick(t => t + 1), [])
  return { data, loading, error, refetch }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    setToken(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
  }, [])
  return { token, isAuthenticated: !!token }
}
