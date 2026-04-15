"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — RASM TUR AVTO-ANIQLASH                           ║
║                                                              ║
║  Gemini Vision orqali rasm turini aniqlash:                 ║
║  - "tovar" — sotuvga qo'shish uchun                         ║
║  - "chek" — xarajat sifatida saqlash                        ║
║  - "boshqa" — noaniq                                         ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import os

log = logging.getLogger(__name__)


async def aniqlash(rasm_path: str) -> str:
    """
    Rasm turini aniqlash.

    Returns:
        "chek" | "tovar" | "boshqa"
    """
    if not os.path.exists(rasm_path):
        return "boshqa"

    try:
        from google import genai as _genai
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return "tovar"  # fallback — default tovar deb hisoblash

        client = _genai.Client(api_key=key)
        image_file = client.files.upload(file=rasm_path)

        prompt = """Bu rasm turini aniqla. Faqat BIR SO'Z qaytar:

- "chek" — agar bu kassa cheki, AZS cheki, do'kondan chek bo'lsa
   (ko'rinishlar: termal qog'oz, narxlar ro'yxati, "JAMI", "ИТОГО", QR kod, fiskal raqam)
- "tovar" — agar bu sotuvga qo'yiladigan tovar bo'lsa
   (ko'rinishlar: bitta yoki bir nechta tovar, brand etiketka, qutida)
- "boshqa" — boshqa narsa bo'lsa

Faqat shu uchta so'zdan birini qaytar, boshqa hech narsa yozma.
"""

        resp = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[prompt, image_file],
        )

        result = resp.text.strip().lower()

        # Sanitize
        if "chek" in result:
            return "chek"
        if "tovar" in result:
            return "tovar"
        return "boshqa"

    except Exception as e:
        log.warning("rasm_tur aniqlash xato: %s", e)
        return "tovar"  # fallback
