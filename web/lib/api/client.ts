/**
 * Central API client for FastAPI backend.
 * Set NEXT_PUBLIC_API_URL in .env (e.g. https://your-api.railway.app).
 * All paths are relative to base; use /api/v1/... for backend routes.
 */

const getBaseUrl = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
    : process.env.NEXT_PUBLIC_API_URL || ""

export type ApiError = { message: string; status?: number }

const DEFAULT_TIMEOUT_MS = 20000

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T } | { error: ApiError }> {
  const base = getBaseUrl()
  if (!base) {
    return { error: { message: "API URL not configured" } }
  }
  let token: string | null = null
  if (typeof window !== "undefined") {
    const { getToken } = await import("@/lib/auth/auth")
    token = getToken()
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.signal ? undefined : DEFAULT_TIMEOUT_MS)
    : null
  const signal = options.signal ?? controller?.signal

  try {
    const res = await fetch(`${base}${path}`, { ...options, headers, signal })
    if (timeoutId) clearTimeout(timeoutId)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (json as { detail?: string }).detail || res.statusText
      return { error: { message: typeof msg === "string" ? msg : "Request failed", status: res.status } }
    }
    return { data: json as T }
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId)
    const msg = e instanceof Error ? e.message : "Network error"
    return { error: { message: msg === "The operation was aborted." ? "Request timeout" : msg } }
  }
}
