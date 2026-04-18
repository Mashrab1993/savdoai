"""
Voice Intent Helpers — v25.7

voice_master.py dagi `_any()` substring matching'dan kelib chiqqan
FALSE-POSITIVE muammolarini hal qiladi.

MAVJUD MUAMMOLAR:
  1. "bekor qilmay" → "bekor qil" keyword'ni noto'g'ri TRIGGER qiladi
  2. "tasdiqlamay" → "tasdiqla" match (negation ignored)
  3. "shokirim" → "kirim" substring
  4. "tahlil" so'zi 7 turli intent'ni bir vaqtda TRIGGER qilishi mumkin

BU MODUL YECHIM:
  _any_word(text, keywords)      — word-boundary match (\b pattern)
  _has_negation_near(text, kw)   — kw atrofida "-may", "emas", "yo'q" tekshiradi
  _safe_intent_match(text, kws)  — ikkala himoyani birlashtiradi

MIGRATION PLAN:
  1. Yangi voice handler yozsangiz — _safe_intent_match() dan foydalaning
  2. Mavjud voice_master.py'ni bitta-bitta migratsiya qiling (test bilan)
  3. services/bot/handlers/voice_master.py'da `_any` → `_any_word` almashtirish
     ehtiyotkorlik bilan, har o'zgarishdan keyin test
"""
from __future__ import annotations

import re
from typing import Iterable


# Uzbek negation indikatori — `-may`, `-ma`, `emas`, `yo'q`, `kerak emas`
_NEGATION_PATTERNS = (
    r'\bemas\b',
    r'\byo\'q\b',
    r'kerak\s+emas',
    # "-may" suffiks (qo'shma fe'l): qilmay, tasdiqlamay, olmay
    r'\w+may(?:man|san|miz|siz)?\b',
    # "-ma" + ammo bu juda ko'p false hit beradi — o'chirib qo'ydik
)


def _any_word(text: str, keywords: Iterable[str]) -> bool:
    """Prefix-aware keyword match.

    Keyword MATNDAGI SO'Z BOSHLANISHIDA bo'lishi kerak — ya'ni undan oldin
    so'z chegarasi (bo'sh joy, tinish belgi yoki matn boshi). Suffix (qo'shma
    fe'l) esa ruxsat etiladi — "qo'sh" keyword "qo'shing", "qo'shamiz" ga mos.

    Negation'ni alohida _has_negation_near() bilan tekshirish kerak.

    Examples:
        >>> _any_word("kirim keldi", ["kirim"])
        True
        >>> _any_word("shokirim", ["kirim"])
        False   # kirim so'z o'rtasida
        >>> _any_word("qo'shing", ["qo'sh"])
        True    # prefix OK, suffix ruxsat
        >>> _any_word("tasdiqlamay", ["tasdiqla"])
        True    # prefix — lekin _safe_intent_match negation'ni tutadi
    """
    if not text or not keywords:
        return False
    t = text.lower()
    for kw in keywords:
        if not kw:
            continue
        # So'z boshida yoki matn boshida bo'lishi kerak; oxirida cheklov yo'q
        pattern = r'(?:^|[\s\W])' + re.escape(kw.lower())
        if re.search(pattern, t, flags=re.UNICODE):
            return True
    return False


def _has_negation_near(text: str, keyword: str, window: int = 20) -> bool:
    """Keyword atrofida (window belgi) negation so'z bormi tekshirish.

    Examples:
        >>> _has_negation_near("bekor qilmay davom et", "bekor qil")
        True
        >>> _has_negation_near("bekor qil", "bekor qil")
        False
        >>> _has_negation_near("tasdiqlamasligim kerak emas", "tasdiq")
        True
    """
    if not text or not keyword:
        return False
    t = text.lower()
    kw = keyword.lower()
    idx = t.find(kw)
    if idx < 0:
        return False
    # Atrofdagi `window` belgi
    start = max(0, idx - window)
    end = min(len(t), idx + len(kw) + window)
    around = t[start:end]
    for pat in _NEGATION_PATTERNS:
        if re.search(pat, around, flags=re.UNICODE):
            return True
    return False


def _safe_intent_match(text: str, keywords: Iterable[str]) -> bool:
    """Xavfsiz intent matching — word-boundary + negation tekshiruvi.

    True agar:
      • Keyword matnda word-boundary bilan bor
      • VA atrofida negation yo'q

    Examples:
        >>> _safe_intent_match("bekor qil", ["bekor qil"])
        True
        >>> _safe_intent_match("bekor qilmay", ["bekor qil"])
        False
        >>> _safe_intent_match("iltimos bekor qiling", ["bekor qil"])
        True
        >>> _safe_intent_match("bekor qilishni xohlamay", ["bekor qil"])
        False  # "xohlamay" negation
    """
    if not _any_word(text, keywords):
        return False
    # Agar birorta keyword topildi — negation'ni tekshiramiz
    for kw in keywords:
        if kw and _any_word(text, [kw]):
            if _has_negation_near(text, kw):
                return False
    return True


def extract_numbers(text: str) -> list[float]:
    """Matndan raqamlarni ajratib olish — voice order/kirim uchun foydali.

    Qo'llab-quvvatlaydi:
      • 45000, 45,000, 45 000 — raqam formatlari
      • "50 ming" → 50000
      • "2.5 mln" → 2500000

    Examples:
        >>> extract_numbers("Ariel 50 ming 100 dona")
        [50000.0, 100.0]
        >>> extract_numbers("2.5 mln so'm")
        [2500000.0]
    """
    if not text:
        return []
    # "ming" / "mln" qo'shimchalarini raqamga aylantirish
    t = text.lower()
    t = re.sub(r'(\d+(?:[.,]\d+)?)\s*mln', lambda m: str(float(m.group(1).replace(",", ".")) * 1_000_000), t)
    t = re.sub(r'(\d+(?:[.,]\d+)?)\s*ming', lambda m: str(float(m.group(1).replace(",", ".")) * 1000), t)
    # "45 000" → "45000"
    t = re.sub(r'(\d+)\s+(?=\d{3}\b)', r'\1', t)
    # Raqamlarni ajratish
    nums = re.findall(r'\d+(?:[.,]\d+)?', t)
    result = []
    for n in nums:
        try:
            result.append(float(n.replace(",", ".")))
        except ValueError:
            pass
    return result
