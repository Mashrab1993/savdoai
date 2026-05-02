import { PrintLandingClient } from "./print-landing-client"

function first(v: string | string[] | undefined): string {
  if (typeof v === "string") return v
  if (Array.isArray(v) && v[0]) return v[0]
  return ""
}

export default async function PrintOpenPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { jobId } = await params
  const sp = await searchParams
  const t = first(sp.t)
  const wRaw = first(sp.w) || "80"
  const w = /^\d+$/.test(wRaw) ? wRaw : "80"
  const dbg = first(sp.debug)
  const showDebug = dbg === "1" || dbg === "true"
  return (
    <PrintLandingClient jobId={jobId} token={t} width={w} showDebug={showDebug} />
  )
}
