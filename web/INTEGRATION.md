# SavdoAI Web — Backend Integration Summary

## What Was Connected to the Real Backend

- **Auth**
  - `POST /auth/telegram`: Login page calls with `{ user_id, ism?, hash }`; on success JWT is stored and user is redirected to dashboard.
  - `GET /api/v1/me`: Available via `getMe()` for session check.
  - Token in `localStorage` under `savdoai_jwt`; `lib/auth/auth.ts` and `hooks/use-auth.ts` handle get/set/clear and logout.

- **API base**
  - All requests use `NEXT_PUBLIC_API_URL` (no trailing slash). Client adds 20s timeout and Bearer token.

- **Dashboard**
  - `GET /api/v1/dashboard` → mapped to `DashboardStats` (bugun_sotuv_jami, jami_qarz, klient_soni, tovar_soni, kam_qoldiq_soni, etc.). Dashboard page uses `useDashboardData()` and shows loading/error.

- **Clients**
  - `GET /api/v1/klientlar` with optional `limit`, `offset`, `qidiruv` → mapped to `ClientDto[]` (ism→name, telefon→phone, jami_sotib→totalPurchases, aktiv_qarz→totalDebt).
  - `POST /api/v1/klient` for create (`ism`, `telefon`, `manzil`) → Clients page uses it and refetches list.
  - Clients page uses `useClientsData()` and create + refetch on add.

- **Products**
  - `GET /api/v1/tovarlar` with optional `limit`, `offset`, `kategoriya` → mapped to `ProductDto[]` (nomi→name, qoldiq→stock, sotish_narxi→price, min_qoldiq→lowStockThreshold, status derived).

- **Debts**
  - `GET /api/v1/qarzlar` → mapped to `DebtDto[]` (klient_ismi→clientName, qolgan→amount, muddat→dueDate).

- **Reports**
  - `GET /api/v1/hisobot/haftalik` → `getReportSummary()` maps `top_klientlar` to `salesByClient`.
  - `getReportDaily()`, `getReportWeekly()`, `getReportMonthly()` call `/api/v1/hisobot/kunlik`, `haftalik`, `oylik`.

- **Apprentices (Shogirdlar)**
  - `GET /api/v1/shogirdlar` → mapped to `ApprenticeDto[]` (ism→name, lavozim→role, kunlik_limit→dailyLimit, bugungi_xarajat→spentToday, etc.).

- **Expenses**
  - `GET /api/v1/xarajatlar/kutilmoqda` → mapped to `ExpenseDto[]` (pending list). `getExpenses()` uses this.

- **Prices**
  - `GET /api/v1/narx/guruhlar` → mapped to `PriceGroupDto[]` (nomi→name, izoh→description).

- **Cash (Kassa)**
  - `GET /api/v1/kassa/stats` → `getCashStats()`.
  - `GET /api/v1/kassa/tarix` with `limit`, `offset` → `getCashTransactions()` maps to `CashTransactionDto[]` (tur kirim/chiqim → income/outcome).

---

## Pages Still Using Mock Fallback

- **Dashboard**: Charts (monthlyRevenue, revenueByCategory), recent activity, and recent invoices still use mock data from `lib/mock-data.ts`. Only KPI stats come from API when configured.
- **Products, Debts, Invoices, Reports, Apprentices, Expenses, Prices, Cash**: Pages still load initial data from hooks that call API; when `NEXT_PUBLIC_API_URL` is not set or API fails, hooks keep/use mock initial state. Products/Debts/Cash/Apprentices/Expenses/Prices pages are wired to their hooks but may not yet show loading/error or refetch on create; Clients is fully wired with refetch and create.
- **Invoices**: Backend has no GET list of invoices (fakturalar); frontend continues to use mock for invoice list.
- **Login**: When `NEXT_PUBLIC_API_URL` is not set, Telegram button only redirects to dashboard (no token). Admin form is placeholder (no backend email/password).

---

## Backend/Frontend Mismatches Found and How They Were Handled

| Area | Backend | Frontend before | Change |
|------|---------|------------------|--------|
| API prefix | `/api/v1/...` | `/api/...` (e.g. `/api/dashboard/stats`) | All services now use `/api/v1/...` and correct paths. |
| Dashboard | Returns `bugun_sotuv_soni`, `jami_qarz`, `klient_soni`, etc. | Expected `totalRevenue`, `activeClients`, `totalDebt` | Added `mapDashboard()` in `lib/api/dashboard.ts` to map backend → frontend shape. |
| Clients | `GET /api/v1/klientlar` returns `{ total, items }` with `ism`, `telefon`, `jami_sotib`, `aktiv_qarz` | Expected `Client` with `name`, `phone`, `totalPurchases`, `totalDebt` | Mapper in `lib/api/clients.ts`; `email` left empty (backend has no email). |
| Products | `GET /api/v1/tovarlar` with `nomi`, `qoldiq`, `sotish_narxi`, `min_qoldiq` | Expected `name`, `stock`, `price`, `lowStockThreshold`, `sku` | Mapper in `lib/api/products.ts`; `sku` left empty. |
| Debts | List grouped by `klient_ismi` with `qolgan`, `muddat` (no per-debt id) | Expected list of debts with id, clientName, amount, dueDate | Mapper builds synthetic ids; single row per client. |
| Cash | `GET /api/v1/kassa/tarix` returns `tur`, `summa`, `sana`, `vaqt`, `tavsif` | Expected `type` income/outcome, `amount`, `date`, `time`, `description` | Mapper in `lib/api/cash.ts`. |
| Auth | `POST /auth/telegram` expects `hash = SHA256(JWT_SECRET+str(uid))[:16]` | No real auth | Login page shows modal for User ID + hash when API URL is set; on success stores token and redirects. |

---

## Auth Flow Now Working

1. User opens login page. If `NEXT_PUBLIC_API_URL` is set, clicking “Telegram orqali kirish” opens a modal for **User ID** and **Auth hash** (from bot or Mini App).
2. On submit, frontend calls `POST /auth/telegram` with `{ user_id, ism, hash }`. On success, response `token` is saved via `setToken()` and user is redirected to `/dashboard`.
3. All `/api/v1/*` requests send `Authorization: Bearer <token>`.
4. Logout clears token and redirects to `/login`.
5. `ProtectedRoute` component exists and can wrap app routes when you want to require auth (currently not used so that demo without backend still works).

---

## Env Variables Required

**Web (Next.js) — set in `web/.env.local`:**

- `NEXT_PUBLIC_API_URL` — Backend API base URL (e.g. `https://your-api.railway.app`). No trailing slash. Required for real auth and API data.

**Backend (already in repo `.env`):**

- `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, `WEB_URL` (CORS), etc. as in root `.env.example`.

---

## What to Test Before Railway Deployment

1. **Backend**
   - Health: `GET /health`, `GET /readyz`.
   - Auth: `POST /auth/telegram` with valid `user_id` and hash (hash from backend script or bot).
   - Dashboard: `GET /api/v1/dashboard` with `Authorization: Bearer <token>`.
   - Clients: `GET /api/v1/klientlar`, `POST /api/v1/klient`.

2. **Web**
   - Set `NEXT_PUBLIC_API_URL` to the Railway API URL in `web/.env.local` (or in Vercel/Railway env for the web app).
   - Login: open login → Telegram → enter User ID + hash → submit → should redirect to dashboard with token stored.
   - Dashboard: KPIs should reflect backend dashboard response (or mock if API fails).
   - Clients: list from API; add client should call POST and refetch list.
   - Logout: should clear token and redirect to login.

3. **CORS**
   - Backend `WEB_URL` (and `allow_origins`) must include the exact web origin (e.g. Vercel URL) so browser requests with Bearer token are allowed.

4. **Optional**
   - Wrap app layout (or dashboard subtree) with `<ProtectedRoute>` so unauthenticated users are redirected to login when you want to enforce auth.
