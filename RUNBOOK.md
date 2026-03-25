# SAVDOAI — RUNBOOK

## Local Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### 1. API (FastAPI)

```bash
cd services/api
cp ../../.env.example ../../.env   # fill in values
pip install -r ../../requirements.txt
PYTHONPATH=$(pwd)/../.. python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Health check: `curl http://localhost:8000/health`

### 2. Web Panel (Next.js)

```bash
cd services/web
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install --legacy-peer-deps
npm run dev          # development
npm run build && npm start  # production
```

Open: http://localhost:3000

### 3. Bot (python-telegram-bot)

```bash
cd services/bot
PYTHONPATH=$(pwd)/../.. python main.py
```

Requires: BOT_TOKEN, DATABASE_URL, ANTHROPIC_API_KEY, GEMINI_API_KEY

### 4. Worker (Celery)

```bash
cd services/worker
PYTHONPATH=$(pwd)/../.. celery -A tasks worker --loglevel=info
```

Requires: DATABASE_URL, REDIS_URL

## Railway Deployment

**Production operator checklist** (live vs IaC, `NEXT_PUBLIC_API_URL`, `/healthz`): **`docs/RAILWAY_TOPOLOGY.md`** → section *Production operator checklist*.

### Service naming (matches `railway.toml`)

| Role | Railway service name in this repo |
|------|-----------------------------------|
| API (FastAPI) | **`savdoai`** |
| Web (Next.js) | **`savdoai-web`** |
| Bot | **`savdoai-bot`** |

#### Live dashboard mapping (documented drift example)

| Railway dashboard name | Role |
|------------------------|------|
| **`web`** | FastAPI HTTP API (`services/api`) |
| **`savdoai`** | Telegram bot worker (`services/bot`) |
| **`savdoai-web`** | Next.js frontend (`services/web`) |

**Dashboard names may differ from `railway.toml`.** The table above is a **documented** live pattern; always verify Dockerfile / start command per service. The repo’s **`${{savdoai.URL}}`** in `railway.toml` only auto-resolves when the **API** service is literally named **`savdoai`**. If your API is named **`web`**, set **`NEXT_PUBLIC_API_URL`** manually to that API’s HTTPS origin, or use **`${{web.URL}}`** in Railway — see **`docs/RAILWAY_TOPOLOGY.md`**.

**`savdoai-web`** is the **Next.js** app, not the FastAPI service. It is **optional** only if the browser dashboard is unused; otherwise keep it deployed.

**API health check on Railway:** use **`/healthz`** (configured in `railway.toml` as `healthCheckPath`; lightweight probe).

### Deploy Order
1. PostgreSQL (managed)
2. Redis (managed)
3. API service **`savdoai`** (services/api/Dockerfile)
4. Bot service **`savdoai-bot`** (services/bot/Dockerfile)
5. Web service **`savdoai-web`** (services/web/Dockerfile)

### Required Environment Variables

**API service:**
- DATABASE_URL (from Postgres)
- REDIS_URL (from Redis)
- JWT_SECRET (generate: `openssl rand -hex 32`)

**Bot service:**
- BOT_TOKEN
- DATABASE_URL
- REDIS_URL
- ANTHROPIC_API_KEY
- GEMINI_API_KEY
- ADMIN_IDS (comma-separated Telegram UIDs)
- JWT_SECRET (same as API)

**Web service (`savdoai-web`):**
- **`NEXT_PUBLIC_API_URL`** — **build-time** (must be present when `next build` / Docker **builder** runs). Must be the **API** service public HTTPS URL (no trailing slash), **not** the web app URL.

Example values:
- Railway template in `railway.toml`: `NEXT_PUBLIC_API_URL = "${{savdoai.URL}}"` — matches **IAC** where the API service is named **`savdoai`** (exact name for interpolation).
- Manual (always valid): Railway → **the FastAPI service** (in some dashboards named **`web`**, in IAC named **`savdoai`**) → **Settings** → **Networking** → copy the **HTTPS** URL (origin only) → set on **`savdoai-web`** as `NEXT_PUBLIC_API_URL`. Do **not** append `/PORT`, paths, or the web hostname.

After changing this variable, **redeploy the web service with a full rebuild** (the Next.js client bundle embeds `NEXT_PUBLIC_*` at compile time).

**Dockerfile note:** `services/web/Dockerfile` declares `ARG NEXT_PUBLIC_API_URL` and `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before `npm run build` so the image build receives the value Railway injects.

### Post-Deploy Smoke Checks

```bash
# API (Railway healthcheck uses /healthz)
curl -i https://YOUR-API.railway.app/healthz
curl https://YOUR-API.railway.app/health

# Web
curl https://YOUR-WEB.railway.app/

# Bot
# Send /ping to bot in Telegram
# Send /token to get web login token
```

### Rollback

Railway has built-in rollback per service. Use Railway dashboard → service → Deployments → Rollback.

## Login Flow

1. User sends /token to Telegram bot
2. Bot returns JWT token (24h TTL)
3. User opens web panel → clicks "Token bilan kirish"
4. Pastes token → system verifies via /api/v1/me
5. If valid → redirects to /dashboard
