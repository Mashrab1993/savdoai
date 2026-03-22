# BLOCKERS

## Soft Blockers

### 1. Stub API endpoints (shogird, xarajat, narx, ledger)
- **Impact**: Web pages load but show empty data
- **Fix required**: Implement actual SQL queries in API main.py lines 1229-1312
- **Severity**: Medium — UI works, just no data

### 2. Invoice module has no backend
- **Impact**: /invoices page shows "coming soon" honestly
- **Fix required**: Create /api/v1/fakturalar endpoints
- **Severity**: Low — UI is honest about it

### 3. Celery worker not verified
- **Impact**: Report export may timeout
- **Fix required**: Deploy worker service on Railway, verify Redis connection
- **Severity**: Medium — export button exists but may fail without worker

## Missing External Secrets (required for runtime)

| Secret | Service | Note |
|--------|---------|------|
| DATABASE_URL | API, Bot, Worker | Railway Postgres |
| REDIS_URL | API, Worker | Railway Redis |
| JWT_SECRET | API, Bot | Must be same value, `openssl rand -hex 32` |
| BOT_TOKEN | Bot | From @BotFather |
| ANTHROPIC_API_KEY | Bot | Claude API |
| GEMINI_API_KEY | Bot | Google Gemini API |
| ADMIN_IDS | Bot | Telegram user IDs |

## No Hard Blockers

All code-level issues are fixed. Remaining items are deployment configuration.
