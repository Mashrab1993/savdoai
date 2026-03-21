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

    # Bo'sh ro'yxat — Haiku xato javob beradi, o'tkazib yuborish
    if not prods and not clits:
        return fuzzy_fixed

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": f"""O'zbek savdo matnini tuzat.

MA'LUM TOVARLAR: {', '.join(prods[:300])}
MA'LUM KLIENTLAR: {', '.join(clits[:100])}

QOIDALAR:
1. FAQAT tuzatilgan matnni qaytar, boshqa hech narsa yozma
2. Tovar/klient nomini yuqoridagi ro'yxatdagiga mosla
3. Raqamlarni o'zgartirma
4. BARCHA tovarlarni saqlа — hech birini o'chirma!
5. Agar matn allaqachon to'g'ri bo'lsa, AYNAN SHUNI qaytar
6. IZOH, TUSHUNTIRISH, UZR YOZMA — FAQAT TUZATILGAN MATN!

Xom STT: {raw_text}
Fuzzy natija: {fuzzy_fixed}

Tuzatilgan matn:""",
                }
            ],
        )
        result = response.content[0].text.strip().split("\n")[0].strip()

        # Haiku xato javob berganini aniqlash — uzr, izoh, tushuntirish
        xato_belgilari = ("uzur", "uzr", "ma'lum", "kechirasiz", "ro'yxat",
                          "berilmagan", "tuzatish uchun", "sorry", "cannot",
                          "topilmadi", "mavjud emas", "aniqlay")
        if any(b in result.lower() for b in xato_belgilari):
            logger.warning("Haiku xato javob berdi, fuzzy ishlatiladi: '%s'", result[:80])
            return fuzzy_fixed

        # MUHIM: Haiku matnni QISQARTIRGAN bo'lsa — original qaytariladi!
        # "Ulug'bek akaga 10 Doleks 68000..." → "Ulug'bek akaga" bo'lmasligi kerak
        if result and len(result) > 3:
            # Raqamlar soni solishtirish — tovar/narx yo'qolmasligi kerak
            import re
            orig_nums = len(re.findall(r'\d+', fuzzy_fixed))
            fix_nums = len(re.findall(r'\d+', result))
            
            # Agar raqamlar 50% dan ko'p yo'qolsa — Haiku buzgan
            if orig_nums > 2 and fix_nums < orig_nums * 0.5:
                logger.warning(
                    "Haiku matnni qisqartirdi! orig=%d raqam, fix=%d raqam. Original saqlanadi.",
                    orig_nums, fix_nums)
                return fuzzy_fixed
            
            # Agar matn 40% dan ko'p qisqarsa — Haiku buzgan
            if len(result) < len(fuzzy_fixed) * 0.6 and len(fuzzy_fixed) > 30:
                logger.warning(
                    "Haiku matnni kesdi! orig=%d belgi, fix=%d belgi. Original saqlanadi.",
                    len(fuzzy_fixed), len(result))
                return fuzzy_fixed

            if result != fuzzy_fixed:
                logger.info("Haiku fix: '%s' -> '%s'", fuzzy_fixed[:80], result[:80])
            return result
        return fuzzy_fixed
    except Exception as e:
        logger.warning("Haiku fix xatosi: %s, fuzzy natija ishlatiladi", e)
        return fuzzy_fixed
