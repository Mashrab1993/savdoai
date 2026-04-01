# ENVIRONMENT VARIABLES

## API Service (services/api)

| Name | Required | Example | Security |
|------|----------|---------|----------|
| DATABASE_URL | YES | postgresql://user:pass@host:5432/savdoai | SECRET |
| REDIS_URL | YES | redis://default:pass@host:6379 | SECRET |
| JWT_SECRET | YES (prod) | `openssl rand -hex 32` | SECRET — must match bot |
| BOT_TOKEN | YES (Mini App) | 123456:ABC-DEF | SECRET — for /auth/webapp HMAC |
| PORT | NO | 8000 | — |
| SENTRY_DSN | NO | https://xxx@sentry.io/yyy | SECRET |
| DB_MIN | NO | 2 | — |
| DB_MAX | NO | 10 | — |
| PYTHONPATH | YES | /app | — |

## Bot Service (services/bot)

| Name | Required | Example | Security |
|------|----------|---------|----------|
| BOT_TOKEN | YES | 123456:ABC-DEF | SECRET |
| DATABASE_URL | YES | (same as API) | SECRET |
| REDIS_URL | NO | (same as API) | SECRET |
| ANTHROPIC_API_KEY | YES | sk-ant-xxx | SECRET |
| GEMINI_API_KEY | YES | AIzaSyxxx | SECRET |
| ADMIN_IDS | YES | 123456789,987654321 | — |
| JWT_SECRET | YES | (same as API) | SECRET — for /token command |
| GEMINI_MODEL | NO | gemini-2.5-pro | — |
| DROP_PENDING | NO | true | — |
| PYTHONPATH | YES | /app | — |

## Web Service (services/web)

| Name | Required | Example | Security |
|------|----------|---------|----------|
| NEXT_PUBLIC_API_URL | YES | **Must** be the **live** FastAPI service public HTTPS origin (not the Next.js host). **IaC:** API = **`savdoai`**. **Live drift:** API = **`web`** — then use **`web`’s** URL; do **not** assume a `savdoai` hostname points at the API. | PUBLIC |
| PORT | NO | 3000 | — |
