"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function OfflinePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background">
      {/* Aurora glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/20 via-rose-500/10 to-transparent blur-3xl animate-pulse [animation-duration:6s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-md w-full bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="inline-flex p-4 rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30 mb-5">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Internet yo&apos;q
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Hozir oflayn rejimdasiz. Oxirgi yuklangan ma&apos;lumotlarni
          ko&apos;rishingiz mumkin, va yangi sotuvlar navbatga qo&apos;shiladi —
          internet qaytganda avtomatik yuboriladi.
        </p>

        <Button
          onClick={() => location.reload()}
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Qayta urinish
        </Button>

        <p className="text-xs text-muted-foreground/70 mt-6">
          SavdoAI offline-first — ma&apos;lumotlaringiz xavfsiz
        </p>
      </motion.div>
    </div>
  )
}
