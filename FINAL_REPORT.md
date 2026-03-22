# SAVDOAI — FINAL REPORT

## Best Base Decision

| Component | Source | Reason |
|-----------|--------|--------|
| Backend (bot, API, shared, cognitive, worker) | savdoai-main-fixed | Identical to savdoai-main; fixed has cleaner web env |
| Web panel | savdoai-web-deploy | Typed API layer, normalizers, useApi hook; closer to original |

savdoai-main-fixed backend = savdoai-main backend (0 diff in bot/api/shared/cognitive/worker).
savdoai-web-deploy ≈ savdoai-main/services/web (minor Dockerfile/next.config diff only).
savdoai-main-fixed/services/web was a simplified rewrite with hidden type errors — rejected.

## Titan Test Results

### A. Web Integrity
- **npm install**: VERIFIED — clean install with --legacy-peer-deps
- **TypeScript check**: VERIFIED — 0 errors after fixes
- **Production build**: VERIFIED — 15/15 pages, all static
- **Dockerfile**: FIXED — created with standalone output
- **Lockfile**: FIXED — removed pnpm-lock.yaml, npm only

### B. Contract Integrity — FIXED Issues

| Issue | Frontend sent | Backend expected | Status |
|-------|-------------|-----------------|--------|
| Auth login | Fake Telegram button → token fallback | Token-only via /api/v1/me | **FIXED** — honest token-only UI |
| Auth service | telegramAuth({ init_data }) | /auth/telegram expects {user_id, ism, hash} | **FIXED** — removed broken telegramAuth |
| Export payload | { type: "daily" } | { tur: "kunlik", format: "excel" } | **FIXED** |
| Export status | polls for status === "done" | returns holat: "tayyor" | **FIXED** |
| Price assign | { group_id, client_id } | { guruh_id, klient_id } | **FIXED** |
| Client form | name, email, company, status | ism, telefon, manzil, kredit_limit | **FIXED** |
| Client normalizer | had email, company fields | backend has no email/company | **FIXED** |

### C. Security Integrity

| Issue | Status |
|-------|--------|
| JWT default secret in production | **FIXED** — fail-closed: sys.exit(1) if RAILWAY env detected and no JWT_SECRET |
| JWT dev-only fallback | FIXED — clearly marked dev-only string |
| Bot /token command | **FIXED** — implemented JWT generation matching API format |
| CORS | NOT PROVEN — requires runtime with secrets to verify scope |

### D. Deployment Integrity

| Check | Status |
|-------|--------|
| Web Dockerfile | FIXED — created with standalone output |
| next.config standalone | FIXED — added output: 'standalone' |
| railway.toml | VERIFIED — 3 services defined (api, bot, web) |
| Procfile | VERIFIED — points to API uvicorn |
| nixpacks.toml | VERIFIED — ffmpeg apt package |
| .env.example | VERIFIED — exists for web |

### E. Business Flow Integrity

| Flow | Status |
|------|--------|
| Client create | FIXED — form matches backend fields |
| Client list | VERIFIED — normalizer maps backend fields |
| Price group create | VERIFIED — endpoint exists |
| Price assign | FIXED — field names corrected |
| Cash add/delete/stats | VERIFIED — services.ts matches kassa router |
| Expense approve/reject | VERIFIED — endpoints exist |
| Debt pay | VERIFIED — klient_ismi + summa matches |
| Report export | FIXED — payload and polling corrected |
| Invoice | NOT IMPLEMENTED — UI shows honest "coming soon" |
| Bot → Web handoff | FIXED — /token command added |

## Remaining NOT PROVEN Items

1. **Runtime API startup** — requires DATABASE_URL, REDIS_URL, JWT_SECRET
2. **Bot startup** — requires BOT_TOKEN, ANTHROPIC_API_KEY, GEMINI_API_KEY
3. **CORS scope** — needs runtime inspection
4. **WebSocket route** — present in code, not verified
5. **Celery worker** — export depends on Redis + worker process
6. **Shogird/xarajat endpoints** — API stubs exist, logic may be incomplete

## Critical Risks

1. **Shogird/xarajat/ledger/narx API endpoints** are stubs returning {"ok": True} — web UI will show empty data
2. **Invoice module** has no backend — UI honestly marks it as "coming soon"
3. **Export worker** depends on Celery + Redis — may not be deployed yet
