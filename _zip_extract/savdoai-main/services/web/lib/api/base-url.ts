/**
 * Single source of truth for the backend API origin.
 * Next.js inlines NEXT_PUBLIC_* at build time — runtime-only env changes do not update the client bundle.
 */

/** Live Railway hostname for the Telegram *bot* worker — must never be used as NEXT_PUBLIC_API_URL. */
const KNOWN_RAILWAY_BOT_PUBLIC_HOST = "savdoai-production.up.railway.app"

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "")
}

function assertNotKnownBotHost(origin: string): void {
  const trimmed = origin.trim()
  try {
    const { hostname } = new URL(trimmed)
    if (hostname === KNOWN_RAILWAY_BOT_PUBLIC_HOST) {
      throw new Error(
        `NEXT_PUBLIC_API_URL points at the Telegram bot (${KNOWN_RAILWAY_BOT_PUBLIC_HOST}), not FastAPI. Set it to your API service HTTPS origin (e.g. https://web-production-30ebb.up.railway.app).`,
      )
    }
  } catch (e) {
    if (e instanceof TypeError) {
      if (trimmed.includes(KNOWN_RAILWAY_BOT_PUBLIC_HOST)) {
        throw new Error(
          `NEXT_PUBLIC_API_URL must be the FastAPI public URL, not the Telegram bot host (${KNOWN_RAILWAY_BOT_PUBLIC_HOST}).`,
        )
      }
      return
    }
    throw e
  }
}

export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (raw == null || String(raw).trim() === "") return ""
  const out = trimTrailingSlashes(String(raw).trim())
  assertNotKnownBotHost(out)
  return out
}

export function isPublicApiConfigured(): boolean {
  return getPublicApiBaseUrl() !== ""
}
