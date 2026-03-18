/**
 * Auth scaffolding for Telegram + JWT.
 * Token storage and session check; no fake email/password backend.
 */

const TOKEN_KEY = "savdoai_jwt"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function logout(): void {
  clearToken()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}
