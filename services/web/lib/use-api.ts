import { useState, useEffect, useCallback } from 'react'

export function useApi<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e: any) {
      setError(e.message || 'Xatolik yuz berdi')
      console.warn('[API xato]', e.message)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { reload() }, [reload])

  return { data, loading, error, reload, setData }
}
