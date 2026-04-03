# SAVDOAI v25.3 — CURSOR AI UCHUN KOD TEKSHIRUVI VA MODULLASHTIRISH PROMPTI

> **Repo:** https://github.com/Mashrab1993/savdoai
> **Stack:** Python 3.12, python-telegram-bot 21.3, FastAPI, asyncpg, PostgreSQL (RLS), Redis, Claude AI + Gemini AI
> **Deploy:** Railway (3 servis: API, Bot, Web)

---

## VAZIFA

Sen katta tajribali Python backend arxitektorisan. `savdoai-main` loyihasida quyidagi ishlarni BOSQICHMA-BOSQICH bajaring. Har bir o'zgartirish sababini izohla. Testlarni buzma — har bir qadam oxirida `python -m pytest tests/ -q` ishga tushir.

---

## 1-BOSQICH: KRITIK BUGLAR (3 ta)

### BUG #1: `services/bot/main.py` → `tasdiq_cb` funksiyasi
**Muammo:** `t:majbur` va `t:zarar_tasdiq` callback handlerlar HECH QACHON ishlamaydi.

```python
# XATO KOD (qisqartirilgan):
async def tasdiq_cb(update, ctx):
    amal = data.get("amal", "")
    
    if amal == "chiqim":
        # ... chiqim logikasi
    elif amal == "kirim":
        # ... kirim logikasi
    
    kutilayotgan = ctx.user_data.pop("kutilayotgan", None)  # ← POP QILADI
    
    if kalit == "t:majbur":       # ← kutilayotgan allaqachon POP qilingan!
        ...                        # ← HECH QACHON ISHLAMAYDI
    elif kalit == "t:zarar_tasdiq":
        ...                        # ← HECH QACHON ISHLAMAYDI
```

**Tuzatish:** `t:majbur` va `t:zarar_tasdiq` handlerlarni `kutilayotgan = ctx.user_data.pop(...)` dan OLDIN mustaqil `if` blok sifatida joylashtir. Ular o'z kalitlaridan (`ctx.user_data`) o'qiydi.

```python
# TO'G'RI:
async def tasdiq_cb(update, ctx):
    kalit = update.callback_query.data
    
    # BIRINCHI: mustaqil handlerlar (pop dan OLDIN)
    if kalit == "t:majbur":
        # ... qoldiq yetmasa ham saqlash
        return
    if kalit == "t:zarar_tasdiq":
        # ... zarar sotuv tasdiqlash
        return
    
    # KEYIN: asosiy flow
    kutilayotgan = ctx.user_data.pop("kutilayotgan", None)
    ...
```

### BUG #2: `services/bot/db.py` L841 — `tolandan` typo
**Muammo:** DB `"tolandan"` qaytaradi, lekin barcha consumers `"tolangan"` kutadi. Nakladnoy/eksportlarda to'langan summa DOIM 0.

```python
# db.py dagi XATO:
return {"tolandan": row["tolandan"], ...}  # ← typo!

# To'g'ri:
return {"tolangan": row["tolandan"], ...}  # ← kalit nomini tuzat
```

**Tekshir:** 7 ta faylda workaround bor — `d.get("tolangan", d.get("tolandan", 0))`. Manba tuzatilgandan keyin workaroundlarni olib tashla:
- `services/bot/bot_services/nakladnoy.py` L412
- `services/bot/bot_services/export_excel.py`
- `services/bot/bot_services/export_pdf.py`
- `shared/services/thermal_receipt.py`
- `shared/services/bot_print_handler.py`
- `services/bot/bot_services/analyst.py`

### BUG #3: `shared/database/schema.sql` — UNIQUE INDEX yo'q
**Muammo:** `ON CONFLICT (user_id, lower(ism))` UNIQUE index talab qiladi, lekin oddiy INDEX yaratilgan.

```sql
-- XATO:
CREATE INDEX IF NOT EXISTS idx_klientlar_ism ON klientlar(user_id, lower(ism));

-- TO'G'RI:
CREATE UNIQUE INDEX IF NOT EXISTS idx_klientlar_ism ON klientlar(user_id, lower(ism));
```

---

## 2-BOSQICH: XAVFSIZLIK — RLS HIMOYA

**Muammo:** 12 ta jadvalda `user_id` ustuni bor, lekin Row Level Security yo'q. Foydalanuvchilar boshqalarning ma'lumotlarini ko'rishi mumkin.

`shared/database/schema.sql` dagi har bir jadval CREATE dan keyin `SELECT enable_rls('jadval_nomi');` qo'sh:

```sql
-- Bu jadvallar RLS kerak:
SELECT enable_rls('kassa_operatsiyalar');
SELECT enable_rls('jurnal_yozuvlar');
SELECT enable_rls('fakturalar');
SELECT enable_rls('narx_guruhlari');
SELECT enable_rls('guruh_narxlar');
SELECT enable_rls('klient_narxlar');
SELECT enable_rls('shogirdlar');
SELECT enable_rls('audit_log');
SELECT enable_rls('vision_log');
SELECT enable_rls('cognitive_tasks');
SELECT enable_rls('hujjat_versiyalar');
SELECT enable_rls('xarajatlar');
```

**Migratsiya fayli:** `shared/migrations/versions/008_v25_3_rls_himoya.sql` yarat — yuqoridagi SELECT larni yoz. Idempotent bo'lishi kerak.

---

## 3-BOSQICH: PERFORMANCE TUZATISHLAR (7 ta)

### 3.1 AsyncAnthropic singleton
`shared/services/ai_suhbat.py` da `AsyncAnthropic()` client HAR XABARDA yangi yaratiladi. Singleton qil:

```python
_client = None
def _get_suhbat_client():
    global _client
    if _client is None:
        _client = AsyncAnthropic()
    return _client
```

### 3.2 `_oxirgi` flood dict — xotira oqishi
`services/bot/main.py` da `_oxirgi: dict[int, float]` cheksiz o'sadi. 10K limit + 60s cleanup qo'sh.

### 3.3 `_STT_USER_PROMPT_CACHE` — cheksiz
`services/bot/bot_services/voice.py` da cache cheksiz o'sadi. 5K limit + cleanup.

### 3.4 `_MULTI_RASM` — rasm bytes xotira oqishi
`services/bot/bot_services/rasm_handler.py` da rasm byteslari HECH QACHON tozalanmaydi. 2 daqiqa expire + 500 limit.

### 3.5 `pool_init` idempotent qilish
`shared/database/pool.py` va `services/bot/db.py` da pool_init qayta chaqirilsa crash. Health check qo'sh:

```python
async def pool_init(dsn, min_size=2, max_size=10):
    global _pool
    if _pool is not None:
        try:
            await _pool.fetchval("SELECT 1")
            return  # Pool ishlayapti — qayta yaratish kerak emas
        except Exception:
            try: await _pool.close()
            except: pass
            _pool = None
    # ... yangi pool yaratish
```

### 3.6 Shared pool hajmi
`shared/database/pool.py` da `min_size=1, max_size=db_max//4` ishlatish (bot pool bilan teng emas).

### 3.7 Excel reader OOM himoya
`shared/services/excel_reader.py` da 100K qator limiti qo'sh.

---

## 4-BOSQICH: KOD SIFATI

### 4.1 Silent exceptions → log.debug
Barcha `except Exception: pass` va `except Exception:` (nomsiz) ni toping va `log.debug` qo'shing:

```bash
# Topish:
grep -rn "except Exception: pass\|except Exception:" services/ shared/ --include="*.py"
```

```python
# XATO:
except Exception: pass

# TO'G'RI:
except Exception as _e:
    log.debug("kontekst: %s", _e)
```

### 4.2 Duplicate `tg()` funksiya
`bot_helpers.py` va `main.py` da ikkalasida `tg()` bor. `main.py` dagini o'chir, `bot_helpers` dagi ishlatilsin.

### 4.3 UNUSED config fields
`services/bot/config.py` da ishlatilmagan maydonlarni toping va o'chiring.

---

## 5-BOSQICH: main.py MODULLASHTIRISH (ENG MUHIM)

**Maqsad:** `services/bot/main.py` (4,419 qator) → 900 qator.

### 5.1 Yangi modullar yaratish

**`services/bot/handlers/savdo.py`** — Savdo pipeline:
```
Ko'chiriladigan funksiyalar:
- _chek_thermal_va_pdf_yuborish
- _qayta_ishlash
- _nakladnoy_yuborish
- _audit_sotuv, _audit_kirim, _audit_qaytarish, _audit_qarz_tolash
- tasdiq_cb
- _savat_qosh_va_javob
- _savat_yop_va_nakladnoy
```

**`services/bot/handlers/commands.py`** — Buyruq handlerlari:
```
Ko'chiriladigan funksiyalar:
- Barcha cmd_* (cmd_menyu, cmd_hisobot, cmd_qarz, cmd_foyda, cmd_klient,
  cmd_top, cmd_ombor, cmd_status, cmd_kassa, cmd_faktura, cmd_balans,
  cmd_jurnal, cmd_chiqim, cmd_tovar, cmd_yangilik, cmd_imkoniyatlar,
  cmd_yordam, cmd_ogoh, cmd_hafta, cmd_foydalanuvchilar, cmd_faollashtir,
  cmd_statistika, cmd_savatlar, cmd_savat)
- _ovoz_buyruq_bajar
- ilovani_qur ichidagi: cmd_ping, cmd_token, cmd_webapp, cmd_parol, inline_qidirish
```

**`services/bot/handlers/matn.py`** — Matn dispatch:
```
Ko'chiriladigan funksiyalar:
- matn_qabul (663 qator — 13 bosqichli dispatch)
```

**`services/bot/handlers/callbacks.py`** — Callback handlerlari:
```
Ko'chiriladigan funksiyalar:
- menyu_cb, paginatsiya_cb, eksport_cb, nakladnoy_sessiya_cb
- hisobot_cb, klient_hisobi_cb, faktura_cb, admin_cb
- _hujjat_cb, _hisobot_excel_cb, _tezkor_cb
```

**`services/bot/handlers/hujjat.py`** — Hujjat handler:
```
Ko'chiriladigan funksiyalar:
- hujjat_qabul (189 qator — PDF/Word/Excel 40 format)
```

### 5.2 Circular dependency — LAZY IMPORT pattern

Handler modullar `main.py` dan import qilishi kerak bo'lganda (masalan `asosiy_menyu`, `__version__`, `SEGMENT_NOMI`), **lazy import** ishlatish MAJBURIY:

```python
# handlers/commands.py
def _get_asosiy_menyu():
    from services.bot.main import asosiy_menyu
    return asosiy_menyu

def _get_version():
    from services.bot.main import __version__
    return __version__

# Ishlatish:
reply_markup = _get_asosiy_menyu()()  # ← () () — birinchi lazy, ikkinchi chaqiruv
```

### 5.3 main.py da import qo'shish

```python
# main.py ga yangi importlar:
from services.bot.handlers.savdo import (
    tasdiq_cb, _qayta_ishlash, _nakladnoy_yuborish,
    _chek_thermal_va_pdf_yuborish,
    _savat_qosh_va_javob, _savat_yop_va_nakladnoy,
)
from services.bot.handlers.commands import (
    cmd_menyu, cmd_hisobot, cmd_tez, cmd_guruh, cmd_qarz, cmd_foyda,
    cmd_klient, cmd_top, cmd_ombor, cmd_status, cmd_kassa, cmd_faktura,
    cmd_balans, cmd_jurnal, cmd_chiqim, cmd_tovar, cmd_yangilik,
    cmd_imkoniyatlar, cmd_yordam, cmd_ogoh, cmd_hafta,
    cmd_foydalanuvchilar, cmd_faollashtir, cmd_statistika,
    cmd_savatlar, cmd_savat, _ovoz_buyruq_bajar,
    cmd_ping, cmd_token, cmd_webapp, cmd_parol, inline_qidirish,
)
from services.bot.handlers.callbacks import (
    eksport_cb, nakladnoy_sessiya_cb, menyu_cb, paginatsiya_cb,
    _hujjat_cb, _hisobot_excel_cb, hisobot_cb, klient_hisobi_cb,
    faktura_cb, admin_cb, _tezkor_cb,
)
from services.bot.handlers.hujjat import hujjat_qabul
from services.bot.handlers.matn import matn_qabul
```

### 5.4 ilovani_qur tozalash

`ilovani_qur` ichidagi inline funksiyalarni (`cmd_ping`, `cmd_token`, `cmd_webapp`, `cmd_parol`, `inline_qidirish`) `commands.py` ga ko'chir. `conf.jwt_secret` → `cfg().jwt_secret`, `conf.is_admin()` → `cfg().is_admin()` ga o'zgartir.

---

## 6-BOSQICH: TEST MOSLASH

Testlar `main.py` manbasida `async def cmd_kassa` kabi so'zlarni qidiradi. Funksiyalar boshqa fayllarga ko'chirilgach, testlar buziladi.

**Yechim:** Barcha test fayllarida `_read_bot_all()` helper qo'sh:

```python
def _read_bot_all():
    """main.py + handlers/ — barcha bot kodi."""
    import glob
    parts = []
    for pat in ['services/bot/main.py', 'services/bot/bot_helpers.py',
                'services/bot/handlers/*.py']:
        for fp in sorted(glob.glob(pat)):
            parts.append(open(fp).read())
    return '\n'.join(parts)
```

**O'zgartirilishi kerak fayllar:**
- `tests/test_smoke.py` — `open("services/bot/main.py").read()` → `_read_bot_all()`
- `tests/test_advanced_features.py` — xuddi shunday
- `tests/test_hisobot_engine.py` — xuddi shunday
- `tests/test_hujjat.py` — xuddi shunday
- `tests/test_smart_bot.py` — xuddi shunday
- `tests/test_thermal_receipt_production.py` — pathlib pattern
- `tests/test_titan_v2.py` — `_SRC = (REPO / "services" / "bot" / "main.py")` pattern

---

## 7-BOSQICH: TEKSHIRUV

Har bir qadam oxirida:

```bash
# 1. Sintaksis
python3 -c "import ast,os;[ast.parse(open(os.path.join(r,f)).read()) for r,d,fs in os.walk('.') if not '.git' in r for f in fs if f.endswith('.py')]"

# 2. Ruff lint (CI bilan bir xil)
ruff check shared/ services/ --select=E9,F63,F7,F82 --target-version=py312

# 3. F821 (undefined name) — 0 bo'lishi KERAK
ruff check shared/ services/ --select=F821 --target-version=py312

# 4. Testlar — BARCHASI O'TISHI KERAK
python -m pytest tests/ -q --tb=short

# 5. Silent exceptions — 0 bo'lishi KERAK
grep -rn "except.*: pass$" services/ shared/ --include="*.py" | grep -v __pycache__
```

---

## QOIDALAR

1. **Testlarni buzma** — har bir o'zgartirish testlarga mos bo'lishi kerak
2. **Ruff F821 = 0** — yangi modulda undefined name bo'lmasin
3. **Lazy import** — circular dependency faqat lazy import bilan hal qilinadi
4. **except: pass = 0** — barcha exceptionlar `log.debug` bilan
5. **Bir vaqtda bitta modul** — ketma-ket ishlash, har birini test qilish
6. **Original funksiya signaturasini o'zgartirma** — faqat ko'chir

---

## KUTILGAN NATIJA

| Ko'rsatkich | Oldin | Keyin |
|---|---|---|
| main.py | 4,419 qator | ~900 qator |
| Handler modullari | 3 | 8 |
| Kritik bug | 3 | 0 |
| RLS himoyasiz | 12 jadval | 1 (FK orqali) |
| except: pass | 24 | 0 |
| Ruff F821 | 16 | 0 |
| Testlar | 1195 | 1222+ |
