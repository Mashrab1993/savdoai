/**
 * SAVDOAI — Next.js Subdomain Middleware
 * 2026-05-23
 *
 * Har do'kon o'z subdomain'i: salom-market.savdoai.uz
 *
 * Vazifa:
 * 1. Host header'dan subdomain ajratish
 * 2. Subdomain'ni cookie/header orqali sahifaga uzatish
 * 3. Reserved subdomain'lar (www, api, app) — main domain'ga redirect
 *
 * Env:
 *   NEXT_PUBLIC_BASE_DOMAIN = "savdoai.uz" (default)
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "savdoai.uz"
const RESERVED = new Set([
  "www", "api", "app", "admin", "blog", "docs",
  "help", "support", "status", "cdn", "static", "media",
])

function extractSubdomain(host: string): string | null {
  if (!host) return null
  const h = host.split(":")[0].toLowerCase().trim()

  if (!h.endsWith(`.${BASE_DOMAIN}`)) return null

  const prefix = h.slice(0, -BASE_DOMAIN.length - 1)
  if (!prefix) return null

  const parts = prefix.split(".")
  const subdomain = parts[parts.length - 1]

  if (RESERVED.has(subdomain)) return null
  if (!/^[a-z0-9\-]{2,30}$/.test(subdomain)) return null

  return subdomain
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const subdomain = extractSubdomain(host)

  const response = NextResponse.next()

  if (subdomain) {
    // Subdomain bor — tenant context'ni cookie va header orqali uzatamiz
    response.cookies.set("tenant_kod", subdomain, {
      domain: `.${BASE_DOMAIN}`,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 kun
    })
    response.headers.set("X-Tenant-Kod", subdomain)
  } else {
    // Main domain (savdoai.uz) — tenant cookie tozalash
    response.cookies.delete("tenant_kod")
  }

  return response
}

export const config = {
  matcher: [
    // Statik fayllar va _next exclude (performance)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)",
  ],
}
