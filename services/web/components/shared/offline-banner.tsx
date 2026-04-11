"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi, CloudUpload } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { installSyncListeners, flushQueue } from "@/lib/offline/sync"
import { installDeltaSync } from "@/lib/offline/delta-sync"
import { db } from "@/lib/offline/db"

/**
 * Fixed bottom banner:
 *   • OFFLINE state → amber "Internet yo'q"
 *   • SYNCING after reconnect → blue "N sotuv yuborilmoqda…"
 *   • ONLINE + empty queue → hidden
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  )
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const cleanupSync  = installSyncListeners()
    const cleanupDelta = installDeltaSync()
    const cleanup = () => { cleanupSync(); cleanupDelta() }

    const tick = async () => {
      const q = await db.listQueue()
      setPending(q.length)
    }
    tick()
    const interval = window.setInterval(tick, 5_000)

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      cleanup()
      window.clearInterval(interval)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  const handleFlush = async () => {
    setSyncing(true)
    try {
      await flushQueue()
      const q = await db.listQueue()
      setPending(q.length)
    } finally {
      setSyncing(false)
    }
  }

  const visible = !online || pending > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-xl border text-sm font-medium
              ${
                !online
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  : "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300"
              }`}
          >
            {!online ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Internet yo&apos;q — offline rejim</span>
                {pending > 0 && (
                  <span className="text-xs opacity-80">
                    · {pending} ta navbatda
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>{pending} ta sotuv yuborilmoqda…</span>
                <button
                  onClick={handleFlush}
                  disabled={syncing}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  {syncing ? "…" : "Hoziroq"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
