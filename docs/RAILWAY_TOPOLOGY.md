# Railway topology — SavdoAI

This document describes **deployment intent in the repository** (`railway.toml` / `deploy/railway.toml`) and how it may differ from **service names in the Railway dashboard**. Use it when auditing or cleaning up duplicate-looking services.

### Quick reference — naming vs roles

| Role | Live Railway (documented drift) | Repo / IaC (`railway.toml` `name`) |
|------|----------------------------------|-------------------------------------|
| FastAPI HTTP API | Dashboard service **`web`** | **`savdoai`** |
| Telegram bot worker | Dashboard service **`savdoai`** | **`savdoai-bot`** |
| Next.js frontend | **`savdoai-web`** | **`savdoai-web`** |

- **Canonical API healthcheck (Railway):** **`/healthz`** (`healthCheckPath` on the FastAPI service in `railway.toml`).
- **`NEXT_PUBLIC_API_URL`** (on **`savdoai-web`**) must be the **live** FastAPI service’s public **HTTPS origin** (no path). It must match whichever Railway service actually runs `services/api` — **not** the Next.js hostname.
- If the **live** API service is named **`web`**, operators must use **that** service’s URL (manual value or `${{web.URL}}`). **Do not** assume `${{savdoai.URL}}` or any hostname containing `savdoai` points at the API unless that service is the API in your project.

## Live Railway dashboard (documented drift example)

**Canonical roles** (by code path) are always: one FastAPI API (`services/api`), one Telegram bot worker (`services/bot`), optional Next.js (`services/web`), plus Postgres and Redis.

Some production dashboards use **different service names** than `railway.toml`. A **documented** pattern is:

| Railway dashboard name | Role | Repo code |
|------------------------|------|-----------|
| **`web`** | FastAPI HTTP API | `services/api/` |
| **`savdoai`** | Telegram bot (polling worker; not a public HTTP API) | `services/bot/` |
| **`savdoai-web`** | Next.js frontend | `services/web/` |

**`railway.toml` IAC names** (same code, different labels): `savdoai` = API, `savdoai-bot` = bot, `savdoai-web` = Next.js. Drift is **naming only**; confirm each service’s Dockerfile and start command in the dashboard.

**`savdoai-web`** is **justified** when you use the browser dashboard; it is **optional** (can be removed in the dashboard) only if nobody relies on the Next.js URL.

## Repository root

- Repo root: project root (same directory as `railway.toml`).

## Code paths (roles)

| Role | Directory | Container entrypoint (see `Dockerfile`) |
|------|-----------|-------------------------------------------|
| **HTTP API** (FastAPI) | `services/api/` | `uvicorn main:app` (port from `PORT`, default 8000 in Dockerfile `CMD`) |
| **Telegram bot** (long-polling worker, not a public HTTP API) | `services/bot/` | `python main.py` |
| **Web dashboard** (Next.js) | `services/web/` | `node server.js` (standalone, port 3000) |
| **Background worker** (Celery) | `services/worker/` | **Not** defined in `railway.toml` — deploy only if you need async jobs |
| **Cognitive / MoE** (optional) | `services/cognitive/` | **Not** in `railway.toml`; bot image copies it for in-process use |

## Config-as-code service names (`railway.toml`)

The root `railway.toml` and `deploy/railway.toml` are intended to stay aligned. They define **three** application services:

| `railway.toml` `name` | Purpose | Code |
|----------------------|---------|------|
| **`savdoai`** | FastAPI API | `services/api/Dockerfile` |
| **`savdoai-bot`** | Telegram bot | `services/bot/Dockerfile` |
| **`savdoai-web`** | Next.js frontend | `services/web/Dockerfile` (`rootDirectory = services/web`) |

Plus managed **Postgres** and **Redis** referenced via `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}`.

### API health checks

- **Canonical** Railway probe for the FastAPI service: **`/healthz`** — in `railway.toml` this is **`healthCheckPath = "/healthz"`** (lightweight; avoids slow DB work on `/health`).

### `NEXT_PUBLIC_API_URL` interpolation

- In **`railway.toml`**, `savdoai-web` sets `NEXT_PUBLIC_API_URL = "${{savdoai.URL}}"`.
- Railway resolves **`savdoai`** to the **service whose name is exactly `savdoai`** in the same project — this matches **IAC** naming (API service named `savdoai`).
- If your **live** FastAPI service is named **`web`** (documented drift), **`${{savdoai.URL}}` does not point at the API** unless you also have a separate service still named `savdoai` running the API. In that case use one of:
  - set **`NEXT_PUBLIC_API_URL`** manually to the **FastAPI** service’s public HTTPS origin (no path), or
  - use **`${{web.URL}}`** in Railway **only if** the API service is literally named `web` (and keep repo docs in sync if you duplicate this in config-as-code), or
  - rename services in the dashboard to match `railway.toml` so **`${{savdoai.URL}}`** resolves to the API again.

**Summary:** `${{savdoai.URL}}` is **correct for IAC** where the API service is named `savdoai`. For **live** mapping **web** = API, prefer **manual** `NEXT_PUBLIC_API_URL` or **`${{web.URL}}`**, not `${{savdoai.URL}}`, unless you rename the API service to `savdoai`.

## Dashboard vs repo naming (common drift)

Some projects use:

- **`web`** for the FastAPI HTTP API service, and  
- **`savdoai`** for the Telegram bot,

while the repo’s IAC expects **`savdoai` = API** and **`savdoai-bot` = bot**. That is **naming drift**, not a second codebase: the **image** is still chosen by each service’s **Dockerfile / start command** in the dashboard, not by the service name alone.

**What to do (conservative):**

1. Decide one canonical naming scheme (either align Railway to `railway.toml`, or document manual env overrides).
2. Ensure **exactly one** service runs `services/api` (FastAPI) and **exactly one** runs `services/bot` (bot).
3. Do **not** run two services with the same role (e.g. two FastAPI containers pointing at the same repo root) unless you intend blue/green or scaling.

## Is `savdoai-web` duplicate or redundant?

- **`savdoai-web`** in this repo is the **Next.js** app (`services/web`). It is **not** the FastAPI service.
- It is **legacy** only if you **do not use** the web dashboard and have **no** need for the Next.js UI. In that case you may **remove or disable** that service in the Railway dashboard after confirming no users rely on it.
- It is **duplicate** if you have **two** services both running **Next.js** from the same app (e.g. two frontends with different names). Compare **build** (Dockerfile `rootDirectory`), **start command**, and **public URL** in the dashboard.

## What is *not* in `railway.toml`

- **Celery worker** (`services/worker/Dockerfile`) — add a Railway service only if you need background tasks.
- **Standalone cognitive** service — optional; cognitive code is often used via the bot image.

## CI / GitHub Actions

- No `.github/workflows` deployment workflows were present in the repo at the time of this audit; deploys are assumed to be **Railway ↔ Git** per service.

## Production operator checklist (manual — Railway dashboard)

**Cannot be done from git alone:** service wiring, public URLs, and `NEXT_PUBLIC_API_URL` live values are set in the **Railway dashboard** (or Railway CLI against your project). This repo documents intent only.

Use this when **live** service names follow **web** = API, **savdoai** = bot, **savdoai-web** = Next.js.

1. **Service `web` (API):** In Railway → **Settings** / **Build**, verify **Dockerfile**, **root directory** (if any), and **start command** deploy **`services/api`** (Uvicorn `main:app`). Confirm **Networking** public URL and **`healthCheckPath` = `/healthz`** (or equivalent probe to `/healthz`).
2. **Service `savdoai` (bot):** Verify this service runs **`services/bot`** (`python main.py`), not the FastAPI app.
3. **Service `savdoai-web` (Next.js):** Verify **`NEXT_PUBLIC_API_URL`** is set to the **live API** HTTPS origin. If the API is **`web`**, set it to **`web`’s** public URL (or `${{web.URL}}`); do **not** copy a URL that assumes the API is named **`savdoai`** unless that is true in your project. **Redeploy** after changes (build-time variable).
4. **`savdoai-web` still needed?** Decide whether users need the browser dashboard; if not, plan to pause/remove **only** after confirming no dependencies on that URL.
5. **Rename services to match IaC (later, optional):** Decide separately whether to rename Railway services to **`savdoai`** / **`savdoai-bot`** to match `railway.toml`, or keep **live** names and documented env overrides.

## Manual Railway dashboard checklist (safe cleanup)

1. **Inventory** each service: **Source** (repo/branch), **Dockerfile**, **Start command**, **Public networking**.
2. **Confirm roles** using the tables above (one API, one bot, optional Next, Postgres, Redis).
3. **If** `savdoai-web` is unused: remove or pause service; update any docs/links that pointed to its URL.
4. **If** you keep only Telegram + API: you still need **Postgres** + **Redis** if the stack uses them.
5. **Rename services** (optional): to match `railway.toml`, or leave names and rely on manual `NEXT_PUBLIC_API_URL`.
6. **Secrets**: rotate only if you believe a duplicate service exposed logs; not covered here.

## Risks / uncertainties

- **Railway UI** may not fully mirror `railway.toml` until synced; verify which file Railway actually uses for the project.
- **Worker** not deployed may mean some features are disabled or handled elsewhere — verify in `services/worker` and `BLOCKERS.md` if applicable.
- **Port**: Railway sets `PORT` (e.g. 8080). FastAPI and Uvicorn read `PORT`; the Dockerfile default is `8000` when `PORT` is unset (local).
