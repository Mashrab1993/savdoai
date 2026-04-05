# CHANGELOG — SavdoAI v25.3

## v25.3.2-audit (2026-04-04)

### 🔴 Kritik tuzatishlar
- **33 ta duplikat endpoint o'chirildi** — main.py va routes/ modullarda bir xil endpointlar ikki marta ro'yxatdan o'tgan edi. Swagger da ikkilanish va xavfsizlik farqlari xavfi bartaraf etildi (main.py: 3469→2467 qator)
- **Loyalty ball yopilgan DB connection** — `klient_ball_qoshish(c, ...)` yopilgan connectionga murojaat qilardi → yangi `rls_conn(uid)` ochiladi
- **CORS regex juda keng** — `https://.*\.up\.railway\.app` barcha Railway ilovalariga ruxsat berar edi → `https://savdoai[-\w]*\.up\.railway\.app`
- **Health endpoint Redis leak** — Har `/health` da yangi Redis connection → `redis_health()` shared function

### 🟡 Xavfsizlik
- `SELECT k.*` → explicit ustunlar (4 joyda) — maxfiy maydonlar API response ga tushishi oldini olindi
- `auth_telegram` hash SHA256[:16] → HMAC-SHA256[:32] + `hmac.compare_digest`
- `auth_telegram` SELECT dan `parol_hash` ustuni olib tashlandi
- Kassa DELETE ga explicit `AND user_id=$2` filtr qo'shildi (defense-in-depth)
- `dokon_tovarlar` ga `faol=TRUE` user tekshiruvi qo'shildi
- MD5 → SHA256 (redis cache, QR hash — 3 joyda)
- Dead `token` query param `export_file_yuklab` dan olib tashlandi

### 🟢 Bug tuzatishlar
- `jami_sotib` endi naqd to'lovda ham yangilanadi (oldin faqat qarz bo'lganda)
- `dastlabki_summa` qarz yaratishda to'ldiriladi (oldin NULL edi)
- Faktura raqam race condition: `COUNT(*)` → `INSERT RETURNING id` asosida
- 5 ta bare `except:` → `except Exception:` (hujjat.py, matn.py, smoke_test.py)
- Duplikat `from typing import Optional` import o'chirildi
- `lifespan()` duplikat JWT_SECRET tekshiruvi birlashtirildi
- Celery Lazy singleton (3 joyda har safar yangi app yaratilmasdi)
- **WebSocket token key bug** — `"token"` → `"auth_token"` (WebSocket hech qachon ulanmas edi!)
- Dashboard `totalRevenue` mapping tuzatildi (frontend)
- Landing page va FastAPI description endpoint soni 72+ → 110+

### 📦 Kod sifati
- `_zip_extract/` `.gitignore` ga qo'shildi
- Rate limiter multi-worker warning hujjatlandi
- Endpoint soni: main.py(50) + routes(60) = 110 ta

## v25.3 (2026-03-28 → 2026-04-01)

### 🔴 Kritik tuzatishlar
- **POST /api/v1/sotuv** — Web sotuv faqat sessiya yaratardi, tovarlar/qoldiq/qarz yozilmasdi. Endi to'liq: chiqimlar + GREATEST(qoldiq-$2,0) + qarz + klient + transaction
- **Race condition** — `SET qoldiq = $2` (absolyut) → `GREATEST(qoldiq - $2, 0)` (relativ) + `FOR UPDATE` lock
- **user_id filtr** — Bot da 13 ta, API da 8 ta query boshqa userlar ma'lumotini ko'rsatishi mumkin edi
- **parol_hash leak** — `/api/v1/me` response da parol hash qaytardi
- **RouteGuard /tg** — Mini App login ga redirect bo'lardi
- **BOT_TOKEN API da yo'q** — Mini App HMAC validatsiya ishlamasdi
- **NEXT_PUBLIC_API_URL** — Bot URL ga ishora qilardi, API URL emas

### 🟡 Xavfsizlik
- SELECT * → explicit columns (47+ joy)
- RETURNING * → explicit columns (8 joy)
- bare `except:` → `except Exception:` (28 joy)
- Unescaped LIKE → `like_escape()` (40+ joy)
- COUNT(*) → `WHERE user_id=$1` (8+ joy)
- Rate limiting: login 5/min, export 3/min, sotuv 30/min

### ✨ Yangi funksiyalar
- **72 API endpoint** (+26): Faktura CRUD, Mini App auth, profil, tarix, statistika
- **Telegram Mini App** — `/auth/webapp` (HMAC-SHA256) + `/tg` sahifa + `/webapp` buyrug'i
- **Web sahifalar** (+3): Sales (savat), Search (global), /tg (Mini App)
- **Dashboard** — statistikaService: kam qoldiq alert, bugun/hafta/oy sotuv
- **PWA** — manifest.json + viewport (telefonda o'rnatish)
- **Faktura CRUD** — yaratish (auto-raqam F-YYYYMMDD-XXXX), holat boshqarish, o'chirish
- **Health** — Redis ping (`redis_ok`, `redis_ms`)
- **Skeleton** — TableSkeleton, KpiSkeleton komponentlar
- **Error boundary** — `global-error.tsx`
- **Root redirect** — `/` → `/dashboard` (RouteGuard auth tekshiradi)

### 🔧 Refactoring
- **bot/main.py** — 5001 → 4398 qator (-603)
- **bot_helpers.py** — umumiy funksiyalar (kesh, faol_tekshir, xat, tg)
- **handlers/narx.py** — 4 ta narx buyrug'i
- **handlers/shogird.py** — 4 ta shogird buyrug'i + callback
- **handlers/jobs.py** — 4 ta avto job (kunlik, haftalik, qarz, obuna)
- **Swagger** — 72 endpoint × 15 tag guruhi
- **Pydantic** — 25 ta validatsiya modeli

### 📚 Hujjatlar
- README.md — to'liq qayta yozildi
- docs/API_DOCUMENTATION.md — 72 endpoint
- docs/BOT_BUYRUQLAR.md — 37 buyruq + /webapp
- docs/DEVELOPER_GUIDE.md — handlers papka
- docs/TAKLIFLAR_HOLAT.md — 32/40 (80%)
- BLOCKERS.md — yakuniy holat
- FINAL_ENV_EXAMPLE.md — BOT_TOKEN API uchun
- RUNBOOK.md — deploy qo'llanma
- CHANGELOG.md — shu fayl

### 🧪 Testlar
- pytest: 648 → 1195 (+547)
- TITAN v2: 0 → 547
- Inline: 155
- Jami: 803 → 1350 (+547)
- CI: GitHub Actions (min 1000 test, SELECT* check, bare except check, ruff)

### 📊 Ko'rsatkichlar

| | Oldin | Keyin |
|---|---|---|
| API endpoint | 46 | 72 |
| Web sahifa | 12 | 15 |
| bot/main.py | 5001 | 4398 |
| SELECT * | 47+ | 0 |
| RETURNING * | 8 | 0 |
| bare except | 28 | 0 |
| LIKE injection | 40+ | 0 |
| user_id siz | 21+ | 0 |
| Race condition | 3 | 0 |
| Testlar | 803 | 1350 |
