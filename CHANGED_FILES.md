# CHANGED_FILES — Web API origin / login fix

Date: 2025-03-22

| File | Change |
|------|--------|
| `services/web/lib/api/base-url.ts` | **Added** — `getPublicApiBaseUrl()` single source of truth. |
| `services/web/lib/api/client.ts` | **Changed** — resolve base via helper; production browser: fail with clear `ApiResponseError` if unset (no same-origin `/api/*`). Dev: `console.warn` if unset. |
| `services/web/lib/api/services.ts` | **Changed** — `exportFile` URL uses `getPublicApiBaseUrl()`. |
| `services/web/app/reports/page.tsx` | **Changed** — download URL uses `getPublicApiBaseUrl()`. |
| `services/web/Dockerfile` | **Changed** — `ARG`/`ENV` `NEXT_PUBLIC_API_URL` before `npm run build`. |
| `services/web/.env.example` | **Changed** — documents build-time requirement and placeholder. |
| `FINAL_REPORT.md` | **Changed** — root cause, fix, Railway/CORS notes. |
| `RUNBOOK.md` | **Changed** — web env vars, rebuild requirement, Dockerfile note. |
