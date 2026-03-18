/**
 * Auth API — aligned with FastAPI POST /auth/telegram.
 * Backend expects { user_id, ism?, hash } where hash = SHA256(JWT_SECRET + str(user_id))[:16].
 * In production, hash is provided by your Telegram bot or Mini App.
 */

import { apiRequest } from "./client"

export type TelegramAuthPayload = {
  user_id: number
  ism?: string
  hash: string
}

export type TelegramAuthResponse = {
  token: string
  user_id: number
}

export async function postTelegramAuth(payload: TelegramAuthPayload) {
  return apiRequest<TelegramAuthResponse>("/auth/telegram", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getMe() {
  return apiRequest<Record<string, unknown>>("/api/v1/me")
}
