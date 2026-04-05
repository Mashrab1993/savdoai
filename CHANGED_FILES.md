# O'ZGARTIRILGAN FAYLLAR — Audit v25.3.2a (2026-04-04)

## Umumiy
- **21 ta bug tuzatildi**, 10 ta faylda
- `main.py`: 3469 → 2467 qator (1002 qator kamaytirdi, -29%)
- 33 ta duplikat endpoint o'chirildi
- Jami unikal endpointlar: **107 ta**

## O'zgartirilgan fayllar

### services/api/main.py
- K1: 33 ta duplikat endpoint o'chirildi (routes/ modullarida bor)
- K2: Loyalty ball — yopilgan connection fix
- K3: CORS regex faqat savdoai* ga ruxsat
- K4: /health Redis leak fix
- M1: SELECT k.* → explicit ustunlar
- M3: auth hash HMAC + parol_hash olib tashlandi
- M4: Duplikat typing import
- M6: lifespan duplikat check birlashtirildi
- K5: dokon user faollik tekshiruvi
- K6: jami_sotib har doim yangilanadi
- K7: Dead token param o'chirildi
- K8: dastlabki_summa INSERT ga qo'shildi
- MD5 → SHA256 (QR hash)
- Rate limiter TODO hujjatlandi
- Landing page va API description: 107 endpoint

### services/api/routes/klientlar.py
- SELECT k.* → explicit ustunlar (2 joyda)

### services/api/routes/kassa.py
- DELETE ga AND user_id=$2 filtr qo'shildi

### services/api/routes/faktura.py
- Faktura raqam race condition fix (INSERT id asosida)

### shared/cache/redis_cache.py
- md5 → sha256 (2 joyda)

### services/bot/handlers/hujjat.py, matn.py, smoke_test.py
- Bare except: → except Exception: (5 joyda)

### services/web/hooks/use-websocket.ts
- Token key "token" → "auth_token"

### services/web/lib/api/normalizers.ts
- Dashboard totalRevenue mapping fix

### .gitignore
- _zip_extract/ qo'shildi
