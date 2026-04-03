"""Telegram matndan printer / chek niyatini aniqlash."""
from __future__ import annotations

import re

# To'liq iboralar (tez yo'l)
_PHRASES_PRINT = frozenset(
    {
        # O'zbek — standart
        "printer chek",
        "chek chiqar",
        "printerdan chiqar",
        "chop et",
        "print qil",
        "chek chiqsin",
        "chek ber",
        "printerga chiqar",
        "printerdan chop",
        "chekni chop",
        "mini printer",
        "chek chiqarish",
        # Gemini STT ko'p ishlatadigan variantlar
        "chek chiqaring",
        "chek chiqarib ber",
        "chek chiqarib bering",
        "chekni chiqar",
        "chekni chiqaring",
        "chek qil",
        "chek qiling",
        "chek kerak",
        "chek tayyorla",
        "chek yoz",
        "chek bosib ber",
        "chek print",
        "printer",
        "printerda chiqar",
        "printerga yuborish",
        "printerga yubor",
        "chek olaman",
        "chek bergin",
        "chek bering",
        "chek chiqaramiz",
        "chek chiqara",
        # Rus tili (Gemini rus tilida yozishi mumkin)
        "чек",
        "чек выдай",
        "распечатай чек",
        "напечатай чек",
        "принтер",
    }
)
_PHRASES_REPRINT = frozenset(
    {
        "qayta chek",
        "yana chek",
        "oxirgi chek",
        "oldingi chek",
        "qayta chop",
        "qayta print",
        "reprint",
        "yana bir chek",
        "chekni qayta",
    }
)

_WORDS = frozenset(
    {
        "print",
        "printer",
        "chek",
        "chop",
        "chiqar",
        "receipt",
        "printerda",
        "printerdan",
        "thermal",
        "чек",
        "принтер",
    }
)


def detect_print_intent(text: str) -> str | None:
    """
    Qaytaradi: 'print' | 'reprint' | None
    """
    m = (text or "").strip().lower()
    if len(m) < 3:
        return None
    m = re.sub(r"\s+", " ", m)
    if m in _PHRASES_REPRINT or any(p in m for p in _PHRASES_REPRINT):
        return "reprint"
    if m in _PHRASES_PRINT:
        return "print"
    if any(p in m for p in _PHRASES_PRINT):
        return "print"
    toks = set(re.findall(r"[\w']+", m))
    if not toks & _WORDS:
        return None
    if "qayta" in m or "oxirgi" in m or "oldingi" in m or "yana" in m:
        return "reprint"
    if "print" in m or "printer" in m or "chek" in m or "chop" in m or "receipt" in m:
        return "print"
    return None
