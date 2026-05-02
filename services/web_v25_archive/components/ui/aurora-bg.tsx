"use client"

import { cn } from "@/lib/utils"

/**
 * Aurora background — subtle animated gradient blobs.
 * Drop as first child of a relative-positioned container.
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
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent blur-3xl animate-pulse [animation-duration:8s]" />
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tl from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl animate-pulse [animation-duration:10s]" />
      <div className="absolute top-1/2 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent blur-3xl animate-pulse [animation-duration:12s]" />
    </div>
  )
}
