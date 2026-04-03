# SavdoAI v25.3.1 — Release Notes

**Sana:** 2026-04-02  
**Test:** 1222/1222 ✅ | **Ruff:** 0 xato | **Xavfsizlik nollari:** 7/7 ✅

---

## Nima o'zgardi

### 🔴 3 ta kritik bug tuzatildi

| Bug | Ta'sir | Fayl |
|-----|--------|------|
| `tasdiq_cb` — `t:majbur`/`t:zarar_tasdiq` ishlamagan | Do'konchi qoldiq yetmasa saqlash MUMKIN EMAS edi | `handlers/savdo.py` |
| `tolandan` typo — 7 faylda | Nakladnoylarda to'langan = 0 | `db.py`, `nakladnoy.py` + 5 fayl |
| UNIQUE INDEX yo'q — `klientlar` | `ON CONFLICT` crash | `schema.sql` |

### 🛡️ 12 ta jadvalga RLS himoya

Migratsiya: `shared/migrations/versions/008_v25_3_rls_himoya.sql`

Himoyalangan: `kassa_operatsiyalar`, `jurnal_yozuvlar`, `fakturalar`, `narx_guruhlari`, `guruh_narxlar`, `klient_narxlar`, `shogirdlar`, `audit_log`, `vision_log`, `cognitive_tasks`, `hujjat_versiyalar`, `xarajatlar`

### 🟡 7 ta performance fix

- `AsyncAnthropic` singleton (API tezligi 2-3x)
- `_oxirgi` flood dict 10K limit
- `_STT_USER_PROMPT_CACHE` 5K limit
- `_MULTI_RASM` 2 daqiqa expire + 500 limit
- `pool_init` idempotent
- Shared pool `min_size=1`
- Excel reader 100K qator limit

### 🟢 Kod sifati

- 32 ta `except: pass` → `log.debug` (bot, worker, cognitive, vision, hujjat)
- 29 ta bare `except Exception:` → named + log
- Duplicate `tg()` olib tashlandi
- 7 ta UNUSED config olib tashlandi

### 🏗️ main.py modullashtirish: 4,419 → 907 qator (−79.5%)

| Modul | Qator | Vazifa |
|-------|-------|--------|
| `handlers/savdo.py` | 1,162 | Savdo pipeline: tasdiq→audit→nakladnoy→savat |
| `handlers/commands.py` | 1,126 | 31 ta /cmd + ping/token/parol/webapp/inline |
| `handlers/matn.py` | 723 | Matn xabar 13-bosqich dispatch |
| `handlers/callbacks.py` | 574 | 11 ta menyu/hisobot/eksport callback |
| `handlers/hujjat.py` | 215 | PDF/Word/Excel handler |
| `handlers/shogird.py` | 247 | Shogird xarajat nazorati |
| `handlers/narx.py` | 228 | Narx guruhlari |
| `handlers/jobs.py` | 120 | Cron: kunlik, haftalik, qarz eslatma |

### 📝 27 ta yangi test (`tests/test_handler_modules.py`)

Handler tuzilmasi, import chain, funksiya joylashuvi, lazy import, RLS migratsiya testlari.

---

## Deploy qadamlari

```bash
# 1. Push
git add -A && git commit -m "v25.3.1" && git push

# 2. RLS migratsiya (Railway → Postgres → Query)
psql $DATABASE_URL < shared/migrations/versions/008_v25_3_rls_himoya.sql

# 3. Railway avtomatik build/deploy
```

## Xavfsizlik holati

| Tekshiruv | Natija |
|-----------|--------|
| `except: pass` | **0** |
| `bare except:` | **0** |
| `SELECT *` | **0** |
| `RETURNING *` | **0** |
| RLS himoyasiz | **1** (jurnal_qatorlar — FK orqali) |
| Ruff F821 | **0** |
| Ruff E9/F63/F7/F82 | **0** |
