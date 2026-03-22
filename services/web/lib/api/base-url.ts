/**
 * Single source of truth for the backend API origin.
 * Next.js inlines NEXT_PUBLIC_* at build time — runtime-only env changes do not update the client bundle.
 */
function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "")
}

export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (raw == null || String(raw).trim() === "") return ""
  return trimTrailingSlashes(String(raw).trim())
}

export function isPublicApiConfigured(): boolean {
  return getPublicApiBaseUrl() !== ""
}
