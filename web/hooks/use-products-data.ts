"use client"

import { useState, useEffect } from "react"
import { getProducts } from "@/lib/api"
import type { Product } from "@/types"
import { products as mockProducts } from "@/lib/mock-data"

/**
 * Products list: API first, mock fallback.
 */
export function useProductsData() {
  const [list, setList] = useState<Product[]>(mockProducts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getProducts()
      .then((out) => {
        if (cancelled) return
        if ("data" in out) {
          setList(out.data as Product[])
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { products: list, loading, error }
}
