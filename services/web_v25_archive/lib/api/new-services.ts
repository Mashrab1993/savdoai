// ═══════════════════════════════════════════════════════════════════
//  SAVDOAI v25.4.0 — YANGI API SERVICE FUNKSIYALARI
//  Mavjud lib/api/services.ts ga qo'shiladi
// ═══════════════════════════════════════════════════════════════════

import { api } from "./client"

// ── Config ────────────────────────────────────────────────────────
export const configService = {
  get: () => api.get<any>("/api/config"),
  getModul: (modul: string) => api.get<any>(`/api/config/${modul}`),
  update: (modul: string, sozlamalar: Record<string, any>) =>
    api.put<any>(`/api/config/${modul}`, { sozlamalar }),
  modullar: () => api.get<any[]>("/api/config/modullar"),
  tarix: (modul?: string) => api.get<any[]>(`/api/config/tarix${modul ? `?modul=${modul}` : ""}`),
}

// ── Aksiya ─────────────────────────────────────────────────────────
export const aksiyaService = {
  list: () => api.get<any[]>("/api/aksiya"),
  turlar: () => api.get<Record<string, string>>("/api/aksiya/turlar"),
  create: (data: any) => api.post<{ id: number }>("/api/aksiya", data),
  toggle: (id: number, faol: boolean) =>
    api.put<any>(`/api/aksiya/${id}/holat?faol=${faol}`),
  hisoblash: (data: any) => api.post<any[]>("/api/aksiya/hisoblash", data),
}

// ── Analitika ─────────────────────────────────────────────────────
export const analitikaService = {
  abcXyz: (kunlar = 90) => api.get<any>(`/api/analitika/abc-xyz?kunlar=${kunlar}`),
  avtobuyurtma: () => api.get<any[]>("/api/analitika/abc-xyz/avtobuyurtma"),
  churn: () => api.get<any>("/api/analitika/churn"),
  cohort: (oylar = 6) => api.get<any>(`/api/analitika/cohort?oylar=${oylar}`),
}

// ── Moliya ─────────────────────────────────────────────────────────
export const moliyaService = {
  foydaZarar: (dan?: string, gacha?: string) =>
    api.get<any>(`/api/moliya/foyda-zarar${dan ? `?sana_dan=${dan}&sana_gacha=${gacha}` : ""}`),
  balans: () => api.get<any>("/api/moliya/balans"),
  pulOqimi: (dan?: string, gacha?: string) =>
    api.get<any>(`/api/moliya/pul-oqimi${dan ? `?sana_dan=${dan}&sana_gacha=${gacha}` : ""}`),
  kpi: (kunlar = 30) => api.get<any>(`/api/moliya/koeffitsientlar?kunlar=${kunlar}`),
}

// ── Live Dashboard ────────────────────────────────────────────────
export const liveService = {
  get: () => api.get<any>("/api/live"),
}

// ── Daily Planner ─────────────────────────────────────────────────
export const rejaService = {
  bugun: () => api.get<any>("/api/reja/bugun"),
}

// ── Klient 360 ────────────────────────────────────────────────────
export const klient360Service = {
  get: (id: number) => api.get<any>(`/api/klient360/${id}`),
}

// ── Gamification ──────────────────────────────────────────────────
export const gamificationService = {
  me: () => api.get<any>("/api/gamification/me"),
  leaderboard: (davr = "hafta") =>
    api.get<any[]>(`/api/gamification/leaderboard?davr=${davr}`),
}

// ── GPS & Tashrif ─────────────────────────────────────────────────
export const tashrifService = {
  checkin: (data: any) => api.post<any>("/api/tashrif/checkin", data),
  checkout: (data: any) => api.post<any>("/api/tashrif/checkout", data),
  tarix: (limit = 50) => api.get<any[]>(`/api/tashrif/tarix?limit=${limit}`),
}

// ── Marshrut ──────────────────────────────────────────────────────
export const marshrutService = {
  optimallashtir: (data: any) => api.post<any>("/api/marshrut/optimallashtir", data),
}

// ── Buyurtma amallar ──────────────────────────────────────────────
export const amallarService = {
  list: (sotuvId: number) => api.get<any[]>(`/api/buyurtma-amal/${sotuvId}/amallar`),
  bekor: (sotuvId: number) => api.post<any>(`/api/buyurtma-amal/${sotuvId}/bekor`),
  izoh: (sotuvId: number, izoh: string) =>
    api.post<any>(`/api/buyurtma-amal/${sotuvId}/izoh`, { izoh }),
  tag: (sotuvId: number, tag: string) =>
    api.post<any>(`/api/buyurtma-amal/${sotuvId}/tag`, { tag }),
  nasiya: (sotuvId: number, kun: number) =>
    api.post<any>(`/api/buyurtma-amal/${sotuvId}/nasiya`, { nasiya_kun: kun }),
}

// ── Webhook ───────────────────────────────────────────────────────
export const webhookService = {
  list: () => api.get<any[]>("/api/webhook"),
  eventlar: () => api.get<Record<string, string>>("/api/webhook/eventlar"),
  create: (data: any) => api.post<{ id: number }>("/api/webhook", data),
  test: (id: number) => api.post<any>(`/api/webhook/test/${id}`),
}

// ── Sync Log ──────────────────────────────────────────────────────
export const syncLogService = {
  list: (limit = 100) => api.get<any[]>(`/api/config/sync-log?limit=${limit}`),
}

// ── Van Selling ───────────────────────────────────────────────────
export const vanService = {
  marshrutlar: () => api.get<any[]>("/api/van/marshrutlar"),
  marshrut: (id: number) => api.get<any>(`/api/van/marshrut/${id}`),
  create: (data: any) => api.post<{ id: number }>("/api/van/marshrut", data),
  yakunlash: (id: number) => api.post<any>(`/api/van/marshrut/${id}/yakunlash`),
}

// ── Tovarlar v2 ───────────────────────────────────────────────────
export const tovarlarV2Service = {
  filtr: (data: any) => api.post<any>("/api/tovarlar/v2/filtr", data),
  kategoriyalar: () => api.get<any[]>("/api/tovarlar/v2/kategoriyalar"),
  brandlar: () => api.get<any[]>("/api/tovarlar/v2/brandlar"),
}

// ── Sverka ─────────────────────────────────────────────────────────
export const sverkaService = {
  create: (klientId: number, dan: string, gacha: string) =>
    api.post<any>(`/api/sverka/${klientId}?sana_dan=${dan}&sana_gacha=${gacha}`),
}
