"use client"

import { useEffect } from "react"

function buildAppUrl(jobId: string, token: string, width: string): string {
  const p = new URLSearchParams()
  if (token) p.set("t", token)
  if (width) p.set("w", width)
  const q = p.toString()
  return `savdoai://print/${jobId}${q ? `?${q}` : ""}`
}

type Props = {
  jobId: string
  token: string
  width: string
  showDebug: boolean
}

export function PrintLandingClient({ jobId, token, width, showDebug }: Props) {
  const appUrl = buildAppUrl(jobId, token, width)

  useEffect(() => {
    if (!token) return
    window.location.replace(appUrl)
  }, [appUrl, token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-zinc-950 text-zinc-100">
      <p className="text-center text-base max-w-md leading-relaxed">
        SavdoAI Print ilovasini ochishga harakat qilamiz. Agar o&apos;zi ochilmasa,
        quyidagi tugmani bosing.
      </p>
      {token ? (
        <a
          href={appUrl}
          className="rounded-xl bg-primary hover:bg-primary/90 active:bg-emerald-700 px-8 py-4 text-lg font-semibold text-white text-center shadow-lg w-full max-w-sm"
        >
          🖨 SavdoAI Print ilovasini ochish
        </a>
      ) : (
        <p className="text-rose-400 text-sm text-center max-w-md">
          Havola noto&apos;g&apos;ri. Telegramdan chekni qayta yuborib ko&apos;ring.
        </p>
      )}
      {showDebug && token ? (
        <details className="text-xs text-zinc-500 max-w-full break-all w-full max-w-lg">
          <summary className="cursor-pointer text-zinc-400">Debug</summary>
          <pre className="mt-2 p-3 bg-zinc-900 rounded-lg overflow-x-auto">{appUrl}</pre>
        </details>
      ) : null}
    </div>
  )
}
