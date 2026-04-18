"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — OVOZ TUZATUVCHI (Voice Post-Processor)           ║
║                                                              ║
║  Gemini STT dan kelgan matnni tuzatish:                      ║
║  1. Mahsulot nomlari tuzatish (Tariq → Ariel)               ║
║  2. O'zbek sheva normalizatsiya                              ║
║  3. Raqam tuzatish                                           ║
║  4. Klient ism tuzatish                                      ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import re
import logging

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
#  1. MAHSULOT LUG'ATI — eng ko'p sotiladigan tovarlar
#     Gemini xato yozsa → to'g'risiga almashtirish
# ═══════════════════════════════════════════════════════════════

# {xato_yozilishi: to'g'ri_nomi}
MAHSULOT_TUZATISH = {
    # Kir yuvish
    "tariq": "Ariel", "tarik": "Ariel", "ariyel": "Ariel",
    "ariyol": "Ariel", "oriel": "Ariel", "ariyal": "Ariel",
    "arial": "Ariel", "arel": "Ariel",
    "tayd": "Tide", "tayt": "Tide", "tayd": "Tide",
    "taid": "Tide", "taed": "Tide",
    "persil": "Persil", "pirsil": "Persil",
    "mif": "Mif", "myf": "Mif",
    "ushi": "Ushi", "uschi": "Ushi",
    "losk": "Losk", "losik": "Losk",

    # Idish yuvish
    "feri": "Fairy", "feyri": "Fairy", "ferry": "Fairy",
    "fary": "Fairy", "fayri": "Fairy", "feiry": "Fairy",
    "aos": "AOS", "ayos": "AOS",
    "sorti": "Sorti", "sorte": "Sorti",
    "pril": "Pril", "preyl": "Pril",

    # Shaxsiy gigiyena
    "safgard": "Safeguard", "sefgard": "Safeguard",
    "dov": "Dove", "dav": "Dove",
    "laks": "Lux", "lyuks": "Lux",
    "palmoliv": "Palmolive", "palmolive": "Palmolive",
    "hed end sholdirs": "Head & Shoulders", "hed ent sholdirs": "Head & Shoulders",
    "klear": "Clear", "klir": "Clear",
    "pantene": "Pantene", "panten": "Pantene",
    "kolgeyt": "Colgate", "kolgat": "Colgate",

    # Oziq-ovqat
    "makfa": "Makfa", "makfo": "Makfa",
    "barilla": "Barilla", "borilla": "Barilla",
    "makaroni": "Makaron", "makaronni": "Makaron",
    "nestile": "Nestle", "nesle": "Nestle",
    "oreo": "Oreo", "oriyo": "Oreo",

    # Ichimliklar
    "koka kola": "Coca-Cola", "kokakola": "Coca-Cola",
    "pepsi": "Pepsi", "pepse": "Pepsi",
    "fanta": "Fanta", "fanto": "Fanta",
    "sprait": "Sprite", "sprayt": "Sprite",

    # Don mahsulotlari
    "guruch": "Guruch", "gurich": "Guruch",
    "bugdoy": "Bug'doy", "bugday": "Bug'doy",

    # Yog'lar
    "oltin": "Oltin", "oltyn": "Oltin",
    "podsolnechniy": "Podsolnechnoye", "podsolnechnoye": "Podsolnechnoye",
}

# ═══════════════════════════════════════════════════════════════
#  2. BIRLIK TUZATISH
# ═══════════════════════════════════════════════════════════════

BIRLIK_TUZATISH = {
    "kilogram": "kilo", "kilogrami": "kilo", "kg": "kilo",
    "gramm": "gramm", "grami": "gramm", "gr": "gramm",
    "litr": "litr", "litir": "litr", "lt": "litr",
    "dona": "dona", "ta": "dona", "tasi": "dona", "donasi": "dona",
    "qop": "qop", "qopi": "qop", "meshok": "qop",
    "karobka": "karobka", "korobka": "karobka", "quti": "karobka",
    "blok": "blok", "bloki": "blok",
    "bochka": "bochka", "bochkasi": "bochka",
}

# ═══════════════════════════════════════════════════════════════
#  3. RAQAM SO'Z TUZATISH
# ═══════════════════════════════════════════════════════════════

RAQAM_TUZATISH = {
    "birta": "1 ta", "ikkita": "2 ta", "uchta": "3 ta",
    "to'rtta": "4 ta", "beshta": "5 ta", "oltita": "6 ta",
    "yettita": "7 ta", "sakkizta": "8 ta", "to'qqizta": "9 ta",
    "o'nta": "10 ta", "yigirmata": "20 ta", "o'ttizta": "30 ta",
    "qirqta": "40 ta", "ellikta": "50 ta", "yuzta": "100 ta",
}


# ═══════════════════════════════════════════════════════════════
#  ASOSIY FUNKSIYA — OVOZ MATNINI TUZATISH
# ═══════════════════════════════════════════════════════════════

def ovoz_tuzat(matn: str, db_tovarlar: list[str] | None = None) -> str:
    """
    Gemini STT dan kelgan matnni tuzatish.
    
    1. Mahsulot nomlari tuzatish (lug'at bo'yicha — asosan kimyoviy/oziq-ovqat)
    2. DB dagi tovarlar bilan fuzzy match (ASOSIY — har qanday segment uchun ishlaydi)
    3. Birlik tuzatish
    4. Raqam tuzatish
    
    MUHIM: MAHSULOT_TUZATISH statik lug'at faqat umumiy tovarlar uchun.
    Boshqa segmentlar (kiyim, qurilish, avto...) uchun db_tovarlar orqali
    DB dagi haqiqiy tovar nomlari bilan fuzzy match ishlaydi.
    
    Args:
        matn: Gemini dan kelgan xom transkripsiya
        db_tovarlar: DB dagi tovar nomlari (ixtiyoriy, lekin TAVSIYA ETILADI)
    
    Returns:
        Tuzatilgan matn
    """
    if not matn:
        return matn

    original = matn
    matn_lower = matn.lower()

    # 1. Mahsulot nomlari tuzatish (aniq match)
    for xato, togri in MAHSULOT_TUZATISH.items():
        # So'z chegarasida qidirish
        pattern = r'\b' + re.escape(xato) + r'\b'
        if re.search(pattern, matn_lower):
            matn = re.sub(pattern, togri, matn, flags=re.IGNORECASE)
            matn_lower = matn.lower()

    # 2. DB tovarlar bilan fuzzy match
    if db_tovarlar:
        matn = _db_fuzzy_tuzat(matn, db_tovarlar)

    # 3. Birlik tuzatish
    for xato, togri in BIRLIK_TUZATISH.items():
        pattern = r'\b' + re.escape(xato) + r'\b'
        matn = re.sub(pattern, togri, matn, flags=re.IGNORECASE)

    # 4. Raqam so'z tuzatish
    for xato, togri in RAQAM_TUZATISH.items():
        pattern = r'\b' + re.escape(xato) + r'\b'
        matn = re.sub(pattern, togri, matn, flags=re.IGNORECASE)

    if matn != original:
        log.info("🔧 Ovoz tuzatildi: '%s' → '%s'", original[:60], matn[:60])

    return matn


def _db_fuzzy_tuzat(matn: str, db_tovarlar: list[str]) -> str:
    """DB dagi tovar nomlari bilan fuzzy match — o'xshash so'zlarni tuzatish"""
    so_zlar = matn.split()
    tuzatilgan = []

    for soz in so_zlar:
        soz_lower = soz.lower().rstrip(".,!?;:")
        
        # Agar so'z raqam bo'lsa — o'tkazib yuborish
        if soz_lower.replace(",", "").replace(".", "").isdigit():
            tuzatilgan.append(soz)
            continue

        # DB tovarlar bilan solishtiramiz
        eng_yaxshi = None
        eng_yaxshi_ball = 0.0

        for tovar in db_tovarlar:
            tovar_lower = tovar.lower()
            ball = _o_xshashlik(soz_lower, tovar_lower)
            if ball > eng_yaxshi_ball and ball >= 0.65:
                eng_yaxshi = tovar
                eng_yaxshi_ball = ball

        if eng_yaxshi and eng_yaxshi_ball >= 0.65:
            # Suffix saqlash (ga, ni, dan, ning)
            suffix = ""
            for s in ("ga", "ni", "dan", "ning", "lar", "ning"):
                if soz_lower.endswith(s) and not eng_yaxshi.lower().endswith(s):
                    suffix = s
                    break
            tuzatilgan.append(eng_yaxshi + suffix)
        else:
            tuzatilgan.append(soz)

    return " ".join(tuzatilgan)


def _o_xshashlik(a: str, b: str) -> float:
    """Ikki so'z o'rtasidagi o'xshashlik (0-1)"""
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    # Trigram o'xshashlik
    def trigrams(s):
        s = f"  {s} "
        return set(s[i:i+3] for i in range(len(s)-2))

    ta = trigrams(a)
    tb = trigrams(b)
    
    if not ta or not tb:
        return 0.0
    
    overlap = len(ta & tb)
    total = len(ta | tb)
    
    return overlap / total if total > 0 else 0.0


# ═══════════════════════════════════════════════════════════════
#  DB DAN TOVAR NOMLARINI OLISH (cache bilan)
# ═══════════════════════════════════════════════════════════════

_tovar_cache: dict[int, list[str]] = {}
_cache_vaqt: dict[int, float] = {}
_CACHE_TTL = 300  # 5 daqiqa
_CACHE_MAX_USERS = 500  # Xotira himoyasi


async def tovar_nomlarini_ol(uid: int) -> list[str]:
    """DB dan tovar nomlarini olish (5 daqiqa cache)"""
    import time
    now = time.time()

    if uid in _tovar_cache and (now - _cache_vaqt.get(uid, 0)) < _CACHE_TTL:
        return _tovar_cache[uid]

    # Bounded cleanup — eski/expired yozuvlarni tozalash
    if len(_tovar_cache) >= _CACHE_MAX_USERS:
        expired = [u for u, t in _cache_vaqt.items() if now - t > _CACHE_TTL]
        for u in expired:
            _tovar_cache.pop(u, None)
            _cache_vaqt.pop(u, None)
        if len(_tovar_cache) >= _CACHE_MAX_USERS:
            _tovar_cache.clear()
            _cache_vaqt.clear()

    try:
        from shared.database.pool import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT DISTINCT nomi FROM tovarlar WHERE user_id=$1 ORDER BY nomi",
                uid
            )
            nomlar = [r["nomi"] for r in rows]
            _tovar_cache[uid] = nomlar
            _cache_vaqt[uid] = now
            log.debug("Tovar cache: %d ta (%d uid)", len(nomlar), uid)
            return nomlar
    except Exception as e:
        log.warning("Tovar nomlarini olishda xato: %s", e)
        return _tovar_cache.get(uid, [])
