"use client"

import { useEffect } from "react"

/**
 * Service worker registration + auto-update flow.
 * Mount once in root layout.
 */
export function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV === "development") return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        // Check for updates every 60s while tab is open
        const interval = window.setInterval(() => {
          reg.update().catch(() => null)
        }, 60_000)

        // When a new SW is waiting, prompt it to activate immediately
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing
          if (!sw) return
          sw.addEventListener("statechange", () => {
            if (
              sw.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              sw.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })

        return () => window.clearInterval(interval)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[SW] register failed:", err)
      }
    }

    register()
  }, [])

  return null
}
