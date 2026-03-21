# SavdoAI Web — Admin Dashboard

Next.js frontend for the SavdoAI business management platform.  
Uzbek/Russian bilingual. Connects to the SavdoAI FastAPI backend.

## Quick Start

```bash
npm install --legacy-peer-deps
NEXT_PUBLIC_API_URL=https://savdoai-production.up.railway.app npm run build
npm run start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |

## Railway Deployment

- **Install Command:** `npm install --legacy-peer-deps`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Root Directory:** `/` (repo root)

## Auth

Login requires a JWT token obtained from the Telegram bot (`/token` command).  
The frontend verifies the token against `GET /api/v1/me` on the backend.

## Pages

| Route | Status |
|-------|--------|
| `/login` | ✅ Token-based auth |
| `/dashboard` | ✅ KPIs + revenue chart |
| `/clients` | ✅ CRUD (create works, edit/delete roadmap) |
| `/products` | ✅ Read-only catalog |
| `/debts` | ✅ View + payment |
| `/cash` | ✅ Full kassa operations |
| `/reports` | ✅ Daily/weekly/monthly + export |
| `/expenses` | ✅ View + approve/reject |
| `/apprentices` | ✅ Staff dashboard |
| `/prices` | ✅ Price group management |
| `/settings` | ⚠️ Read-only (local preferences) |
| `/invoices` | ⚠️ Roadmap / coming soon |
