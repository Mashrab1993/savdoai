# Voice Helpers Migration Guide — v25.7

## Muammo

`services/bot/handlers/voice_master.py` da `_any()` funksiya
**substring-based** keyword matching ishlatadi. Bu 163 ta keyword
uchun **22 ta false-positive risk** keltirib chiqaradi:

| Keyword      | False positive misol       | Sabab                       |
|--------------|----------------------------|-----------------------------|
| `bekor qil`  | "bekor qilmay davom et"    | Negation (`-may`) e'tiborga olinmaydi |
| `tasdiqla`   | "tasdiqlamayman"           | Negation + prefix           |
| `kirim`      | "shokirim"                 | Substring ichida bo'lishi   |
| `tahlil`     | 7 ta boshqa intent ichida  | Juda umumiy so'z            |

## Yechim

**3 ta yangi helper** `shared/services/voice_helpers.py` da:

```python
from shared.services.voice_helpers import (
    _any_word,             # prefix-aware matching
    _has_negation_near,    # -may/emas/yo'q tekshiruvi
    _safe_intent_match,    # ikkalasini birlashtiradi
    extract_numbers,       # "50 ming" → 50000
)
```

### 1. `_any_word(text, keywords)` — word-boundary match

```python
# Eski (substring):
_any("shokirim", ("kirim",))         # True (NOTO'G'RI!)

# Yangi (word-boundary):
_any_word("shokirim", ("kirim",))    # False ✅
_any_word("kirim keldi", ("kirim",)) # True ✅
_any_word("qo'shing", ("qo'sh",))    # True (prefix OK)
```

### 2. `_has_negation_near(text, keyword)` — negation aniqlash

```python
_has_negation_near("bekor qilmay", "bekor qil")      # True (-may suffix)
_has_negation_near("kerak emas", "kerak")            # True
_has_negation_near("tasdiqlash yo'q", "tasdiqla")    # True
_has_negation_near("tasdiqla", "tasdiqla")           # False
```

### 3. `_safe_intent_match(text, keywords)` — birlashgan himoya

```python
# True: keyword bor va negation yo'q
_safe_intent_match("bekor qil", ["bekor qil"])          # True
_safe_intent_match("iltimos bekor qiling", ["bekor qil"]) # True
_safe_intent_match("bekor qilmay", ["bekor qil"])       # False (negation)
_safe_intent_match("shokirim", ["kirim"])               # False (substring)
```

## Migration Plan

Mavjud `voice_master.py` ni **BOSQICHMA-BOSQICH** yangilash:

### Faza 1: Helper import + test

```python
# services/bot/handlers/voice_master.py
from shared.services.voice_helpers import _safe_intent_match

# Mavjud:
# def _any(text, kws): return any(kw in text for kw in kws)

# Yangi helper — o'xshash interfeys:
_any_old = _any  # backup
_any = _safe_intent_match  # drop-in replacement
```

### Faza 2: Har intent uchun regression test

`tests/test_voice_intents.py` da **har intent** uchun:
1. Positive case (matn bilan → True)
2. False positive (negation) — rad qilinsin
3. Substring false positive — rad qilinsin

### Faza 3: To'liq rollout

Barcha voice handler modullarida (voice_kirim, voice_order, ...)
ham shu helper'ni qabul qilish.

## STT Cache Invalidation Bus

### Muammo

`services/bot/bot_services/voice.py`:

```python
_STT_USER_PROMPT_CACHE: dict = {}  # IN-PROCESS cache
```

WEB dashboard orqali yangi tovar qo'shilsa
(`services/api/routes/tovarlar.py:tovar_yarat`) — bot'ning IN-PROCESS
kesh'iga signal yetmaydi, 60 sekund (TTL) yangi tovar tanib olinmaydi.

### Yechim: Redis Pub/Sub

`shared/services/stt_cache_bus.py`:

```python
# API tomonda (services/api/routes/tovarlar.py:tovar_yarat):
from shared.services.stt_cache_bus import publish_invalidate
await publish_invalidate(uid, reason="product_create")
```

```python
# Bot startup'da (services/bot/main.py):
from shared.services.stt_cache_bus import start_invalidate_listener
from services.bot.bot_services.voice import stt_cache_tozala
from services.bot.bot_services.fuzzy_matcher import fuzzy_matcher

async def _on_invalidate(uid: int, reason: str):
    stt_cache_tozala(uid)
    fuzzy_matcher.cache_tozala(uid)

asyncio.create_task(start_invalidate_listener(_on_invalidate))
```

## Testing

```bash
cd /root/savdoai
python3 -m pytest tests/test_voice_helpers.py -v    # 23/23 pass
python3 -m pytest tests/test_voice_intents.py -v    # 21/21 pass
python3 scripts/voice_intent_audit.py               # 22 risk pair topiladi
```

## Rollout Risk

- 🟢 **Zero risk**: yangi fayllar (voice_helpers.py, stt_cache_bus.py) —
  mavjud kodga tegmagan
- 🟡 **O'rta risk**: voice_master.py'da `_any` ni almashtirishda —
  test bilan birga qilish
- 🔴 **Yuqori risk**: bir vaqtda hammasi — TAVSIYA ETILMAYDI

## Migration Checklist

- [ ] `shared/services/voice_helpers.py` yaratildi ✅
- [ ] `shared/services/stt_cache_bus.py` yaratildi ✅
- [ ] `tests/test_voice_helpers.py` 23/23 pass ✅
- [ ] `tests/test_voice_intents.py` 21/21 pass ✅
- [ ] `docs/VOICE_HELPERS_MIGRATION.md` yozildi ✅
- [ ] voice_master.py da `_any` → `_safe_intent_match` (SEKIN, test bilan)
- [ ] api/routes/tovarlar.py da `publish_invalidate` chaqirish
- [ ] bot/main.py startup'da `start_invalidate_listener` ishga tushirish
- [ ] Railway env: REDIS_URL bor ekanligini tekshirish
- [ ] Live monitoring — voice intent metrics (Sentry breadcrumb)

## FAQ

**Q: Bu yangi helper'lar SAVDOAI prod'ida ishga tushadimi?**
A: Yo'q. Ular MAVJUD kodga tegmagan, faqat shu fayllar import qilsa
   ishlaydi. Rollout sekin va test bilan.

**Q: Agar Redis yo'q bo'lsa?**
A: `stt_cache_bus.py` silent-fail. Cache TTL=60s baribir tozalaydi —
   shunchaki 60s kutilarlik sekinroq ishlaydi.

**Q: voice_helpers o'zi productionga tegadimi?**
A: Yo'q, u PURE FUNCTION — faqat kim uni IMPORT qiladigan bo'lsa
   qo'llaniladi. Mavjud kod o'zgarmaydi.
