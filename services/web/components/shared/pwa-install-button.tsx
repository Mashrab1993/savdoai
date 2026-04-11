"use client"

import { useEffect, useState } from "react"
import { Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

/**
 * "Install SavdoAI" button — shown only when the browser signals the
 * PWA is installable (beforeinstallprompt). Hidden after install.
 */
export function PWAInstallButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Detect already-installed state (standalone mode)
    const mq = window.matchMedia?.("(display-mode: standalone)")
    if (mq?.matches) setInstalled(true)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-500 ${className ?? ""}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>O&apos;rnatilgan</span>
      </div>
    )
  }

  if (!deferred) return null

  const handleInstall = async () => {
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === "accepted") setDeferred(null)
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className={`gap-2 ${className ?? ""}`}
    >
      <Download className="w-4 h-4" />
      SavdoAI&apos;ni o&apos;rnatish
    </Button>
  )
}
