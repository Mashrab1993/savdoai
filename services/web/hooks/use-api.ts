"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ApiResponseError } from "@/lib/api/client"

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Minimal fetch hook — no heavy dependencies.
 * Accepts any async function and manages loading/error/data state.
 */
export function useApi<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = []
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: !!fetcher,
    error: null,
  })
  const mountedRef = useRef(true)

  const run = useCallback(async () => {
    if (!fetcher) return
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcher()
      if (mountedRef.current) setState({ data, loading: false, error: null })
    } catch (err) {
      if (!mountedRef.current) return
      const msg =
        err instanceof ApiResponseError
          ? err.detail
          : err instanceof Error
          ? err.message
          : "Unknown error"
      setState({ data: null, loading: false, error: msg })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, ...deps])

  useEffect(() => {
    mountedRef.current = true
    run()
    return () => { mountedRef.current = false }
  }, [run])

  return { ...state, refetch: run }
}
