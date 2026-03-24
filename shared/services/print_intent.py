"""Telegram matndan printer / chek niyatini aniqlash."""
from __future__ import annotations

import re

# To'liq iboralar (tez yo'l)
_PHRASES_PRINT = frozenset(
    {
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
