"use client"

import { cn } from "@/lib/utils"

/**
 * Aurora background — subtle animated gradient blobs matching SavdoAI v2 palette.
 * Sky + emerald + violet — subtle enough not to distract from content.
 */
export function AuroraBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent blur-3xl animate-pulse [animation-duration:10s]" />
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tl from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl animate-pulse [animation-duration:12s]" />
      <div className="absolute top-1/2 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/5 to-transparent blur-3xl animate-pulse [animation-duration:14s]" />
    </div>
  )
}
