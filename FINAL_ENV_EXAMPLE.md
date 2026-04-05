# ENVIRONMENT VARIABLES

## API Service (services/api)

| Name | Required | Example | Notes |
|------|----------|---------|-------|
| DATABASE_URL | YES | postgresql://user:pass@host:5432/savdoai | SECRET |
| REDIS_URL | YES | redis://default:pass@host:6379 | SECRET |
| JWT_SECRET | YES (prod) | `openssl rand -hex 32` | SECRET — bot bilan bir xil |
| BOT_TOKEN | YES (Mini App) | 123456:ABC-DEF | SECRET — /auth/webapp HMAC |
| PRINT_SECRET | YES (chop) | `openssl rand -hex 16` | SECRET — bot bilan bir xil |
| PORT | NO | 8000 | — |
| DB_MIN | NO | 2 | Pool min size |
| DB_MAX | NO | 10 | Pool max size |
| API_RATE_LIMIT | NO | 60 | req/daqiqa limit |
| WEB_URL | NO | https://savdoai-web-production.up.railway.app | CORS origin |
| WEB_DASHBOARD_URL | NO | https://savdoai-web-production.up.railway.app/dashboard | /dashboard redirect |
| PRINT_LANDING_BASE_URL | NO | https://savdoai-web-production.up.railway.app | QR kod chek URL |
| COGNITIVE_URL | NO | http://cognitive:8001 | AI dvigatel URL |
| QDRANT_URL | NO | https://xxx.qdrant.io:6333 | RAG vector DB |
| QDRANT_API_KEY | NO | xxx | SECRET |
| GOOGLE_API_KEY | NO | AIzaSyxxx | Gemini AI (ixtiyoriy) |
| ANTHROPIC_API_KEY | NO | sk-ant-xxx | Claude AI (ixtiyoriy) |
| SENTRY_DSN | NO | https://xxx@sentry.io/yyy | SECRET |
| ADMIN_IDS | NO | 123456789,987654321 | Admin Telegram IDlar |
| REDIS_REQUIRED | NO | true | false=Redis bo'lmasa ham ready |
| PYTHONPATH | YES | /app | — |

## Bot Service (services/bot)

| Name | Required | Example | Notes |
|------|----------|---------|-------|
| BOT_TOKEN | YES | 123456:ABC-DEF | SECRET |
| DATABASE_URL | YES | (API bilan bir xil) | SECRET |
| REDIS_URL | NO | (API bilan bir xil) | SECRET |
| ANTHROPIC_API_KEY | YES | sk-ant-xxx | SECRET — Claude AI |
| GEMINI_API_KEY | YES | AIzaSyxxx | SECRET — Gemini AI |
| ADMIN_IDS | YES | 123456789,987654321 | — |
| JWT_SECRET | YES | (API bilan bir xil) | SECRET |
| PRINT_SECRET | YES | (API bilan bir xil) | SECRET |
| GEMINI_MODEL | NO | gemini-2.5-pro | — |
| DROP_PENDING | NO | true | Eski xabarlarni o'tkazib yuborish |
| DB_MIN | NO | 2 | Pool min size |
| DB_MAX | NO | 10 | Pool max size |
| WEB_URL | NO | https://savdoai-web-production.up.railway.app | Mini App URL |
| WORKER_URL | NO | http://worker:8002 | Celery worker URL |
| SENTRY_DSN | NO | https://xxx@sentry.io/yyy | SECRET |
| BOT_POLL_LOCK_TTL_SECONDS | NO | 120 | Polling lock TTL |
| AI_TIMEOUT | NO | 30 | AI response timeout (sek) |
| KUNLIK_SOAT | NO | 22 | Kunlik hisobot soati |
| HAFTALIK_SOAT | NO | 8 | Haftalik hisobot soati |
| QARZ_SOAT | NO | 10 | Qarz eslatma soati |
| OBUNA_SOAT | NO | 9 | Obuna eslatma soati |
| PYTHONPATH | YES | /app | — |

## Web Service (services/web)

| Name | Required | Example | Notes |
|------|----------|---------|-------|
| NEXT_PUBLIC_API_URL | YES | FastAPI servisi HTTPS URL | ⚠️ Bot emas, API URL! |
| PORT | NO | 3000 | — |

## ⚠️ Railway Topology Ogohlantirish

IaC (railway.toml):
- `savdoai` = API (FastAPI)
- `savdoai-bot` = Bot
- `savdoai-web` = Next.js

Live drift (dashboard):
- `web` = API (FastAPI) ← boshqa nom!
- `savdoai` = Bot
- `savdoai-web` = Next.js

`NEXT_PUBLIC_API_URL` **doim** FastAPI servisiga yo'naltirilishi kerak!
