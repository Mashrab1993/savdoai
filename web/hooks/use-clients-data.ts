"use client"

import { useState, useEffect, useCallback } from "react"
import { getClients } from "@/lib/api"
import type { Client } from "@/types"
import { clients as mockClients } from "@/lib/mock-data"

/**
 * Clients list: API first, mock fallback.
 */
export function useClientsData() {
  const [list, setList] = useState<Client[]>(mockClients)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    getClients()
      .then((out) => {
        if ("data" in out) {
          setList(out.data as Client[])
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { clients: list, loading, error, refetch }
}
