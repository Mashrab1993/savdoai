"""
╔══════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 — VISION AI + OCR                      ║
║  Rasm va hujjat tahlili:                                    ║
║  ✅ Gemini Vision (rasm → matn)                              ║
║  ✅ Nakladnoy rasm o'qish                                    ║
║  ✅ Chek/kvitansiya skanerlash                               ║
║  ✅ Graceful degradation (lib yo'q = log + skip)            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio
import base64
import io
import json
import logging
import os
from typing import Any, Optional

log = logging.getLogger(__name__)

_gemini_client = None
_VISION_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

_PROMPT_RASM = """Bu O'zbek biznesga tegishli rasm (nakladnoy, chek, kvitansiya yoki hujjat).

VAZIFA: Rasmdan barcha ma'lumotlarni aniq o'qib, quyidagi JSON formatda qaytar:

{
  "tur": "nakladnoy | chek | kvitansiya | boshqa",
  "klient": "ism yoki kompaniya",
  "tovarlar": [
    {"nomi": "...", "miqdor": 0, "birlik": "dona", "narx": 0, "jami": 0}
  ],
  "jami_summa": 0,
  "sana": "2026-01-01",
  "izoh": "qo'shimcha ma'lumot",
  "ishonch": 0.0
}

QOIDALAR:
- Raqamlarni aniq o'qi (1 va 7 ni aralashtirma)
- O'zbek/Rus tillarini tushi
- Ishonch darajasini 0.0-1.0 orasida ko'rsat
- Agar o'qib bo'lmasa: {"tur": "noaniq", "ishonch": 0.0, "izoh": "sababini yoz"}

Faqat JSON qaytar, boshqa hech narsa yozma."""


def ishga_tushir(api_key: str, model: str = "") -> None:
    """Vision AI xizmatini ishga tushirish"""
    global _gemini_client, _VISION_MODEL
    if model:
        _VISION_MODEL = model
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        log.info("✅ Vision AI ulandi (%s)", _VISION_MODEL)
    except Exception as e:
        log.warning("⚠️ Vision AI ulanmadi: %s (rasm tahlili o'chirildi)", e)


def _sync_tahlil(image_bytes: bytes, mime: str = "image/jpeg") -> dict:
    """Sinxron Gemini Vision chaqiruvi"""
    if not _gemini_client:
        return {"tur": "xato", "ishonch": 0.0, "izoh": "Vision AI ishga tushirilmagan"}

    from google.genai import types
    response = _gemini_client.models.generate_content(
        model=_VISION_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime),
            _PROMPT_RASM,
        ],
    )
    matn = (response.text or "").strip()
    # JSON ajratish
    try:
        if "```json" in matn:
            matn = matn.split("```json")[1].split("```")[0].strip()
        elif "```" in matn:
            matn = matn.split("```")[1].split("```")[0].strip()
        return json.loads(matn)
    except json.JSONDecodeError:
        log.warning("Vision AI JSON parse xato: %s", matn[:200])
        return {"tur": "noaniq", "ishonch": 0.0, "izoh": matn[:500]}


async def rasm_tahlil(image_bytes: bytes,
                       mime: str = "image/jpeg") -> dict:
    """
    Rasm tahlili (async).
    Qaytaradi: {"tur", "klient", "tovarlar", "jami_summa", "ishonch", ...}
    """
    if not _gemini_client:
        log.warning("Vision AI ishga tushirilmagan — rasm tahlili o'tkazib yuborildi")
        return {"tur": "xato", "ishonch": 0.0, "izoh": "Vision AI o'chirilgan"}

    try:
        loop = asyncio.get_event_loop()
        natija = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _sync_tahlil(image_bytes, mime)),
            timeout=30,
        )
        log.info("✅ Rasm tahlil: tur=%s ishonch=%.2f",
                 natija.get("tur", "?"), natija.get("ishonch", 0))
        return natija
    except asyncio.TimeoutError:
        log.error("Vision AI timeout (30s)")
        return {"tur": "xato", "ishonch": 0.0, "izoh": "Timeout"}
    except Exception as e:
        log.error("Vision AI xato: %s", e)
        return {"tur": "xato", "ishonch": 0.0, "izoh": "Tahlil vaqtincha ishlamayapti"}


async def chek_skanerlash(image_bytes: bytes) -> dict:
    """
    Chek/kvitansiya skanerlash — summa, sana, do'kon ajratish.
    """
    natija = await rasm_tahlil(image_bytes, "image/jpeg")
    if natija.get("tur") == "xato":
        return natija
    return {
        "summa": natija.get("jami_summa", 0),
        "sana": natija.get("sana"),
        "klient": natija.get("klient"),
        "tovarlar": natija.get("tovarlar", []),
        "ishonch": natija.get("ishonch", 0),
        "manba": "vision_ai",
    }


# OCR fallback (Tesseract, ixtiyoriy)
def ocr_matn(image_bytes: bytes) -> Optional[str]:
    """
    OCR — rasmdan matn ajratish (Tesseract).
    pytesseract o'rnatilmagan bo'lsa None qaytaradi.
    """
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        matn = pytesseract.image_to_string(img, lang="uzb+rus+eng")
        return matn.strip() if matn.strip() else None
    except ImportError:
        log.debug("pytesseract o'rnatilmagan — OCR o'tkazib yuborildi")
        return None
    except Exception as e:
        log.warning("OCR xato: %s", e)
        return None
