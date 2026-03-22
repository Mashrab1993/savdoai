# CHANGED FILES

## services/web/app/login/page.tsx
- **Action**: UPDATE
- **Purpose**: Remove fake Telegram login, make honest token-only auth
- **Changes**: Removed Send icon, telegramLoading state, handleTelegramLogin(), Separator. Token form is now primary CTA.

## services/web/lib/api/services.ts
- **Action**: UPDATE
- **Purpose**: Remove broken telegramAuth() that sent wrong contract
- **Changes**: Removed `telegramAuth: (initData) => api.post("/auth/telegram", { init_data })`. Kept tokenLogin + me only.

## services/web/app/reports/page.tsx
- **Action**: UPDATE
- **Purpose**: Fix export payload and status polling to match backend
- **Changes**: `{ type: dateRange }` → `{ tur: "kunlik", format: "excel" }`. Status polling `"done"` → `"tayyor"`. Download URL constructed from `updated.download`.

## services/web/app/prices/page.tsx
- **Action**: UPDATE
- **Purpose**: Fix price group assignment field names
- **Changes**: `{ group_id, client_id }` → `{ guruh_id, klient_id }`. Also fixed `.company` → `.phone` references after ClientVM change.

## services/web/app/clients/page.tsx
- **Action**: UPDATE
- **Purpose**: Align client form with backend klientlar table
- **Changes**: Form fields changed from name/email/company/status to name/phone/address/creditLimit. Validation simplified. Table columns updated. API payload sends ism/telefon/manzil/kredit_limit.

## services/web/lib/api/normalizers.ts
- **Action**: UPDATE
- **Purpose**: Remove non-existent email/company fields from ClientVM
- **Changes**: ClientVM now has phone/address/creditLimit. normalizeClient maps from d.telefon/d.manzil/d.kredit_limit.

## services/web/app/settings/page.tsx
- **Action**: UPDATE
- **Purpose**: Fix reference to non-existent user.email
- **Changes**: `user?.email` → `user?.telefon`

## services/web/next.config.mjs
- **Action**: UPDATE
- **Purpose**: Enable standalone output for Docker deployment
- **Changes**: Added `output: 'standalone'`

## services/web/Dockerfile
- **Action**: CREATE
- **Purpose**: Docker build for Railway deployment
- **Changes**: Multi-stage Node 20 Alpine build with standalone output

## services/web/pnpm-lock.yaml
- **Action**: DELETE
- **Purpose**: Remove conflicting lockfile — npm only
- **Changes**: Removed. package-lock.json retained.

## services/api/main.py
- **Action**: UPDATE
- **Purpose**: JWT secret fail-closed in production
- **Changes**: If RAILWAY_ENVIRONMENT detected and no JWT_SECRET → sys.exit(1). Dev gets clearly-marked fallback.

## services/bot/config.py
- **Action**: UPDATE
- **Purpose**: Add jwt_secret to Config for /token command
- **Changes**: Added jwt_secret field and os.getenv("JWT_SECRET") loading.

## services/bot/main.py
- **Action**: UPDATE
- **Purpose**: Add /token command for web panel login
- **Changes**: Added cmd_token handler that generates JWT matching API's jwt_yarat() format. Validates user is registered and faol. Token has 24h TTL.

## services/web/pnpm-lock.yaml
- **Action**: DELETE
- **Purpose**: Remove conflicting lockfile (npm only project)

## services/web/.gitignore
- **Action**: UPDATE
- **Purpose**: Stop ignoring package-lock.json (needed for Dockerfile `npm ci`)
- **Changes**: Removed `package-lock.json` from gitignore, kept `pnpm-lock.yaml` ignore.

## services/web/next.config.mjs
- **Action**: UPDATE
- **Purpose**: Silence turbopack root warning, add standalone output
- **Changes**: Added `turbopack: { root: '.' }` alongside existing `output: 'standalone'`.

## .gitignore (root)
- **Action**: UPDATE
- **Purpose**: Ignore tsbuildinfo files
- **Changes**: Added `tsconfig.tsbuildinfo` and `*.tsbuildinfo`.
