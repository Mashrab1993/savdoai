"""
Text Fixer - Claude Haiku yordamida STT + Fuzzy natijasini
yakuniy tekshirish va tuzatish.
"""
from __future__ import annotations

import logging
import os

import anthropic

logger = logging.getLogger(__name__)

_api_key = os.getenv("ANTHROPIC_API_KEY", "")
client = anthropic.AsyncAnthropic(api_key=_api_key) if _api_key else None

KNOWN_PRODUCTS: list[str] = []
KNOWN_CLIENTS: list[str] = []


async def fix_stt_text(
    raw_text: str,
    fuzzy_fixed: str,
    *,
    products: list[str] | None = None,
    clients: list[str] | None = None,
) -> str:
    """Claude Haiku bilan yakuniy tekshirish."""
    prods = products if products is not None else KNOWN_PRODUCTS
    clits = clients if clients is not None else KNOWN_CLIENTS
    if not client:
        return fuzzy_fixed
    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": f"""O'zbek savdo matnini tuzat.

MA'LUM TOVARLAR: {', '.join(prods[:100])}
MA'LUM KLIENTLAR: {', '.join(clits[:50])}

QOIDALAR:
1. FAQAT tuzatilgan matnni qaytar, boshqa hech narsa yozma
2. Tovar/klient nomini yuqoridagi ro'yxatdagiga mosla
3. Raqamlarni o'zgartirma
4. Format: [Klient] + [miqdor] + [tovar] + [narx]
5. Agar matn allaqachon to'g'ri bo'lsa, AYNAN SHUNI qaytar

Xom STT: {raw_text}
Fuzzy natija: {fuzzy_fixed}

Tuzatilgan matn:""",
                }
            ],
        )
        result = response.content[0].text.strip().split("\n")[0].strip()
        if result and len(result) > 3:
            if result != fuzzy_fixed:
                logger.info("Haiku fix: '%s' -> '%s'", fuzzy_fixed, result)
            return result
        return fuzzy_fixed
    except Exception as e:
        logger.warning("Haiku fix xatosi: %s, fuzzy natija ishlatiladi", e)
        return fuzzy_fixed
