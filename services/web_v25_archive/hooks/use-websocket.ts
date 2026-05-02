/**
 * useWebSocket — real-time yangilanish hook
 *
 * Dashboard va boshqa sahifalar uchun WebSocket ulanish.
 * Server: /ws?token=JWT
 * Xabarlar: sotuv, kirim, qarz, kassa o'zgarishlari
 *
 * Ishlatish:
 *   const { connected, lastMessage } = useWebSocket()
 *   useEffect(() => { if (lastMessage?.type === 'sync') refetch() }, [lastMessage])
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { getPublicApiBaseUrl } from "@/lib/api/base-url"

interface WSMessage {
  type: string
  data?: Record<string, unknown>
  ts?: number
  [key: string]: unknown
}

interface UseWebSocketOptions {
  /** Avtomatik ulanish (default: true) */
  autoConnect?: boolean
  /** Qayta ulanish urinishlari orasidagi vaqt ms (default: 5000) */
  reconnectInterval?: number
  /** Maksimal qayta ulanish urinishlari (default: 10) */
  maxReconnects?: number
  /** Ping intervali ms (default: 30000) */
  pingInterval?: number
}

interface UseWebSocketReturn {
  /** Ulanish holati */
  connected: boolean
  /** Oxirgi kelgan xabar */
  lastMessage: WSMessage | null
  /** Xabar yuborish */
  send: (msg: Record<string, unknown>) => void
  /** Qo'lda ulanish */
  connect: () => void
  /** Ulanishni yopish */
  disconnect: () => void
}

export function useWebSocket(options?: UseWebSocketOptions): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnects = 10,
    pingInterval = 30000,
  } = options ?? {}

  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pingTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  }, [])

  const connect = useCallback(() => {
    const token = getToken()
    if (!token) return

    // API URL dan ws URL yasash
    const apiUrl = getPublicApiBaseUrl()
    if (!apiUrl) return
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectCount.current = 0

        // Ping keep-alive
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }))
          }
        }, pingInterval)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage
          if (msg.type !== "pong") {
            setLastMessage(msg)
          }
        } catch {
          // Invalid JSON — ignore
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (pingTimer.current) clearInterval(pingTimer.current)

        // Qayta ulanish
        if (reconnectCount.current < maxReconnects) {
          reconnectCount.current++
          reconnectTimer.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = () => {
        // onclose da handle qilinadi
      }
    } catch {
      // WebSocket yaratishda xato — silent
    }
  }, [getToken, reconnectInterval, maxReconnects, pingInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    if (pingTimer.current) clearInterval(pingTimer.current)
    reconnectCount.current = maxReconnects // Qayta ulanishni to'xtatish
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [maxReconnects])

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  // Auto connect
  useEffect(() => {
    if (autoConnect) connect()
    return disconnect
  }, [autoConnect, connect, disconnect])

  return { connected, lastMessage, send, connect, disconnect }
}
