# BLOCKERS — v25.3 Yakuniy holat

## ✅ BARTARAF ETILDI

| Muammo | Tuzatish |
|--------|---------|
| SELECT * (47+) | **0** — barcha explicit columns |
| RETURNING * (8) | **0** |
| bare except (28) | **0** — `except Exception:` |
| Unescaped LIKE (40+) | **0** — `like_escape()` |
| user_id siz query (21+) | **0** — bot + API |
| Race condition (3) | **0** — `GREATEST + FOR UPDATE` |
| parol_hash leak | **0** — `/me` dan olib tashlandi |
| POST /sotuv tovar yo'q | **Tuzatildi** — chiqimlar + qoldiq + qarz |
| BOT_TOKEN API da yo'q | **Tuzatildi** — railway.toml |
| RouteGuard /tg | **Tuzatildi** — PUBLIC_ROUTES |
| Root / redirect | **Tuzatildi** — /dashboard ga |

## ⚠️ QOLGAN (tashqi konfiguratsiya)

### 1. Railway Variables (qo'lda)
- `savdoai-web` → `NEXT_PUBLIC_API_URL` = API servis URL (**build-time, redeploy kerak**)
- `web` (API) → `BOT_TOKEN` = bot token (**Mini App uchun**)
- `web` (API) va `savdoai` (bot) → `JWT_SECRET` **bir xil**

### 2. BotFather Mini App
```
/setmenubutton → URL: https://savdoai-web-production.up.railway.app/tg
```

### 3. Celery Worker
- Railway da worker servis deploy qilinmagan
- Excel/PDF export tugmalari ishlamaydi

## Muhim env variables

| Secret | API | Bot | Web |
|--------|-----|-----|-----|
| DATABASE_URL | ✅ | ✅ | — |
| REDIS_URL | ✅ | ✅ | — |
| JWT_SECRET | ✅ | ✅ (bir xil!) | — |
| BOT_TOKEN | ✅ (Mini App) | ✅ | — |
| ANTHROPIC_API_KEY | — | ✅ | — |
| GEMINI_API_KEY | — | ✅ | — |
| ADMIN_IDS | — | ✅ | — |
| NEXT_PUBLIC_API_URL | — | — | ✅ (build-time) |
| WEB_URL | ✅ (CORS) | ✅ | — |
| SENTRY_DSN | ✅ (ixtiyoriy) | ✅ | — |
