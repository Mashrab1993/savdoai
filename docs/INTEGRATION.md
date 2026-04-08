# SavdoAI v25.4.0 — TO'LIQ KUCHAYTIRILGAN VERSIYA

## 📊 3 ta raqobatchi tahlili asosida yaratilgan

SD Agent (182K qator) + Smartup ERP (300+ jadval) tahlilidan
aniqlangan barcha gap'lar to'ldirildi.

---

## 📁 Fayl ro'yxati (20 ta fayl)

### Backend (Python)
| Fayl | Qatorlar | Vazifasi |
|------|----------|---------|
| `shared/services/server_config.py` | 572 | 10 config modul + sync log + validatsiya |
| `shared/services/aksiya.py` | 385 | 6 aksiya turi + hisoblash motori |
| `shared/services/guards_v2.py` | 250 | Qoldiq qaytarish + check-in/out + 15 amal |
| `shared/services/pipeline_ext.py` | 120 | Pipeline integratsiya (aksiya + config) |
| `services/api/routes/config.py` | 200 | Config API (8 endpoint) |
| `services/api/routes/aksiya.py` | 100 | Aksiya API (6 endpoint) |
| `services/api/routes/tovarlar_v2.py` | 180 | 9 ta filtr + pagination |
| `services/api/routes/gps.py` | 95 | GPS tracks API |
| `services/api/routes/tashrif.py` | 120 | Check-in/out + amallar API |
| `shared/database/migrations/migration_v25_4_0.sql` | 160 | Barcha yangi jadvallar (11 ta) |

### Web (Next.js/TypeScript)
| Fayl | Qatorlar | Vazifasi |
|------|----------|---------|
| `services/web/app/config/page.tsx` | 307 | Config admin panel (8 modul) |
| `services/web/app/aksiya/page.tsx` | 105 | Aksiya boshqaruv UI |
| `services/web/app/sync-log/page.tsx` | 75 | Sync log viewer |
| `services/web/app/tashrif/page.tsx` | 130 | Check-in/out boshqaruvi |
| `services/web/components/layout/sidebar.tsx` | 140 | Yangilangan sidebar (3 yangi menyu) |

### Android (Kotlin)
| Fayl | Qatorlar | Vazifasi |
|------|----------|---------|
| `android/.../location/GpsTrackingService.kt` | 230 | GPS foreground service |
| `android/.../config/ConfigManager.kt` | 120 | Server config keshlash |
| `android/.../sync/SyncManager.kt` | 160 | Structured sync + logging |

### Boshqa
| Fayl | Qatorlar | Vazifasi |
|------|----------|---------|
| `.cursor/rules/savdoai.mdc` | 100 | Cursor AI loyiha konteksti |
| `docs/INTEGRATION.md` | — | Integratsiya qo'llanma |

**JAMI: ~3,500+ qator yangi production-ready kod**

---

## 🔧 5-QADAM INTEGRATSIYA

### 1-Qadam: DB migration
```bash
psql $DATABASE_URL -f shared/database/migrations/migration_v25_4_0.sql
```
Bu 11 ta yangi jadval yaratadi: server_config, config_tarix, sync_log, 
aksiyalar (4 jadval), checkin_out, gps_tracks, sotuv_taglar + 
sotuvlar jadvaliga 6 ta yangi ustun qo'shadi.

### 2-Qadam: Backend fayllarni joyiga qo'yish
```bash
cp shared/services/server_config.py  <loyiha>/shared/services/
cp shared/services/aksiya.py         <loyiha>/shared/services/
cp shared/services/guards_v2.py      <loyiha>/shared/services/
cp shared/services/pipeline_ext.py   <loyiha>/shared/services/
cp services/api/routes/config.py     <loyiha>/services/api/routes/
cp services/api/routes/aksiya.py     <loyiha>/services/api/routes/
cp services/api/routes/tovarlar_v2.py <loyiha>/services/api/routes/
cp services/api/routes/gps.py        <loyiha>/services/api/routes/
cp services/api/routes/tashrif.py    <loyiha>/services/api/routes/
```

### 3-Qadam: API main.py ga router qo'shish
```python
# services/api/main.py da qo'shish:

from services.api.routes.config import router as config_router
from services.api.routes.aksiya import router as aksiya_router
from services.api.routes.tovarlar_v2 import router as tovarlar_v2_router
from services.api.routes.gps import router as gps_router
from services.api.routes.tashrif import router as tashrif_router
from services.api.routes.tashrif import amallar_router

app.include_router(config_router)
app.include_router(aksiya_router)
app.include_router(tovarlar_v2_router)
app.include_router(gps_router)
app.include_router(tashrif_router)
app.include_router(amallar_router)
```

### 4-Qadam: Web fayllarni joyiga qo'yish
```bash
cp services/web/app/config/page.tsx    <loyiha>/services/web/app/config/page.tsx
cp services/web/app/aksiya/page.tsx    <loyiha>/services/web/app/aksiya/page.tsx
cp services/web/app/sync-log/page.tsx  <loyiha>/services/web/app/sync-log/page.tsx
cp services/web/app/tashrif/page.tsx   <loyiha>/services/web/app/tashrif/page.tsx
cp services/web/components/layout/sidebar.tsx <loyiha>/services/web/components/layout/sidebar.tsx
```

### 5-Qadam: Android fayllarni qo'shish
```bash
cp android/.../location/GpsTrackingService.kt <loyiha>/android/.../location/
cp android/.../config/ConfigManager.kt        <loyiha>/android/.../config/
cp android/.../sync/SyncManager.kt            <loyiha>/android/.../sync/
```

AndroidManifest.xml ga:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<service android:name=".location.GpsTrackingService"
    android:foregroundServiceType="location" android:exported="false" />
```

---

## 🎯 Yangi endpointlar (jami 35+)

| Endpoint | Method | Vazifasi |
|----------|--------|---------|
| `/api/config` | GET | To'liq config olish |
| `/api/config/{modul}` | GET/PUT | Modul olish/yangilash |
| `/api/config/modullar` | GET | Modullar ro'yxati |
| `/api/config/tarix` | GET | O'zgarishlar tarixi |
| `/api/config/tekshir/klient` | POST | Klient validatsiya |
| `/api/config/tekshir/buyurtma` | POST | Buyurtma validatsiya |
| `/api/config/sync-log` | GET/POST | Sync loglar |
| `/api/aksiya` | GET/POST | Aksiyalar CRUD |
| `/api/aksiya/{id}/holat` | PUT | Aksiya yoqish/o'chirish |
| `/api/aksiya/hisoblash` | POST | Aksiya hisoblash |
| `/api/aksiya/turlar` | GET | Aksiya turlari |
| `/api/tovarlar/v2/filtr` | POST | 9 ta filtr + pagination |
| `/api/tovarlar/v2/kategoriyalar` | GET | Kategoriyalar |
| `/api/tovarlar/v2/brandlar` | GET | Brandlar |
| `/api/gps/tracks` | GET/POST | GPS tracklar |
| `/api/gps/oxirgi` | GET | Oxirgi lokatsiya |
| `/api/tashrif/checkin` | POST | Check-in |
| `/api/tashrif/checkout` | POST | Check-out |
| `/api/tashrif/tarix` | GET | Tashrif tarixi |
| `/api/buyurtma-amal/{id}/amallar` | GET | 15 ta amal |
| `/api/buyurtma-amal/{id}/bekor` | POST | Bekor + qoldiq qaytarish |
| `/api/buyurtma-amal/{id}/izoh` | POST | Izoh qo'shish |
| `/api/buyurtma-amal/{id}/tag` | POST | Tag qo'yish |
| `/api/buyurtma-amal/{id}/nasiya` | POST | Nasiya belgilash |
