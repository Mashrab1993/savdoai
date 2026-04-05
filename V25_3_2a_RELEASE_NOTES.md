# SavdoAI v25.3.2a — AUDIT RELEASE NOTES

**Sana:** 2026-04-04  
**Tur:** Xavfsizlik va sifat yangilanishi  
**Testlar:** 1564/1564 PASSED (74 ta test yangilandi)

---

## Kritik tuzatishlar (4)

1. **33 ta duplikat endpoint o'chirildi** — `main.py` va `routes/` modullar orasida bir xil endpoint ikki marta ro'yxatdan o'tgan edi. Swagger da ikkilangan, bir joydagi bugfix ikkinchisida qolardi. `main.py` 3469→2467 qator.

2. **Loyalty ball crash** — `sotuv_saqlash` da `klient_ball_qoshish(c, ...)` chaqirilganda `c` allaqachon yopilgan edi. Production da `InterfaceError` kelardi.

3. **CORS regex juda keng** — `https://.*\.up\.railway\.app` barcha Railway ilovalariga ruxsat berar edi. Endi faqat `savdoai*` domenlar.

4. **Health endpoint Redis leak** — Har `/health` chaqiruvida yangi Redis connection ochilar, xato bo'lsa yopilmas edi. `redis_health()` shared function ga o'tkazildi.

## Xavfsizlik tuzatishlar (8)

- **HMAC auth** — `auth/telegram` hash SHA256[:16] concatenation → HMAC-SHA256[:32] + `hmac.compare_digest`
- **parol_hash leak** — `auth/telegram` SELECT dan `parol_hash` olib tashlandi
- **Kassa DELETE** — `AND user_id=$2` filtr qo'shildi (defense-in-depth)
- **MD5→SHA256** — 8 ta joyda kriptografik hash yangilandi (cache, QR, guards, TTS, RAG, hujjat, nakladnoy)
- **RLS admin_uid** — `shogirdlar`, `xarajatlar`, `xarajat_kategoriyalar` jadvallarida RLS policy `user_id` o'rniga `admin_uid` tekshiradi
- **Do'kon tekshiruvi** — Ommaviy do'kon endpoint da `faol=TRUE` user existence check qo'shildi
- **SELECT k.*** — 4 ta joyda explicit ustunlarga o'tkazildi
- **WebSocket token** — `"token"` → `"auth_token"` (WebSocket hech qachon ulanmas edi!)

## Worker tuzatishlar (4)

- `_pool()` TypeError → `get_pool()` (ledger reconciliation ishlamagan)
- `pool_init()` DSN parametri berilmagan → `pool_init(dsn)`
- `asyncio.get_event_loop().run_until_complete()` → `asyncio.run()` (deprecated)
- `__import__("os")` → to'g'ri import

## Kod sifati (12)

- 5 ta bare `except:` → `except Exception:`
- 7 ta `__import__()` → to'g'ri import
- Duplikat `typing` import o'chirildi
- Dead `token` parameter o'chirildi
- `lifespan()` duplikat tekshiruv birlashtirildi
- Rate limiter multi-worker ogohlantirish hujjatlandi
- Celery lazy singleton (har safar yangi app yaratilmas)
- `_zip_extract/` .gitignore ga qo'shildi

## Frontend (4)

- Global `error.tsx` boundary yaratildi
- Search sahifasiga error state qo'shildi
- Dashboard `totalRevenue` mapping tuzatildi
- Unused imports tozalandi (sales, loyalty)

## Performance (2)

- `chiqimlar.tovar_id` index qo'shildi
- `chiqimlar(user_id, tovar_nomi)` index qo'shildi

## Biznes logika (3)

- `jami_sotib` endi har doim yangilanadi (naqd to'lovda ham)
- `dastlabki_summa` qarz INSERT ga qo'shildi
- Faktura raqam race condition tuzatildi (INSERT id asosida)

## Hujjatlar (6)

- Endpoint soni 107 ga yangilandi (landing, API description, .cursorrules, DEVELOPER_GUIDE, API_DOCUMENTATION, cursor-prompts)
- `FINAL_ENV_EXAMPLE.md` to'liq yangilandi (40+ env variable)
- `CHANGED_FILES.md` yangilandi
- 74 ta test modularizatsiya uchun yangilandi

---

## Tizim holati

| Ko'rsatkich | Oldin | Keyin |
|---|---|---|
| main.py qatorlar | 3469 | 2467 (-29%) |
| Unikal endpointlar | ~110 (duplikat) | 107 (aniq) |
| Testlar | 1490 pass / 74 fail | 1564 pass / 0 fail |
| Bare except | 5 | 0 |
| __import__ | 7 | 0 |
| MD5 (tizim) | 8 | 0 (faqat Click.uz protokol) |
| SELECT k.* | 4 | 0 |
| RLS xato | 3 jadval | 0 |
