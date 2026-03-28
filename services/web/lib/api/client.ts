// ── Central fetch wrapper ─────────────────────────────────────────────────────
// All API calls go through this. Handles auth headers, error parsing, and 401.

import { getPublicApiBaseUrl } from "./base-url"

export class ApiResponseError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiResponseError"
    this.status = status
    this.detail = detail
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("auth_user")
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let base: string
  try {
    base = getPublicApiBaseUrl()
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new ApiResponseError(503, detail)
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    if (!base) {
      throw new ApiResponseError(
        503,
        "API manzili sozlanmagan: Railway → savdoai-web → Variables → NEXT_PUBLIC_API_URL (API domeni, build qayta ishga tushirilishi kerak).",
      )
    }
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production" && !base) {
    console.warn(
      "[SavdoAI] NEXT_PUBLIC_API_URL is empty — API chaqiruqlar noto‘g‘ri manzilga ketishi mumkin. .env.local da API URL ni qo‘ying.",
    )
  }

  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearSession()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new ApiResponseError(401, "Unauthorized")
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body?.detail ?? body?.message ?? detail
    } catch {
      // ignore parse error
    }
    throw new ApiResponseError(res.status, detail)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
}
