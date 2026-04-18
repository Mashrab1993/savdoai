"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — CHEK O'QISH (OCR via Gemini Vision)              ║
║                                                              ║
║  Gaz/AZS/dorixona/do'kon cheklarini rasmdan o'qiydi.        ║
║                                                              ║
║  Input: chek rasmi (file path)                              ║
║  Output: structured xarajat data                             ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
import os
import re

log = logging.getLogger(__name__)


async def chek_oqish(rasm_path: str) -> dict:
    """
    Chek rasmidan ma'lumotlarni o'qish.

    Returns:
        {
            "sotuvchi": "UZGAZTRADE",         # do'kon nomi
            "kategoriya": "transport",         # avto-aniqlanadi
            "tovarlar": [
                {"nomi": "AI-92 benzin", "miqdor": 45.5, "narx": 1450, "jami": 65975},
            ],
            "jami": 65975,                     # umumiy summa
            "sana": "2026-04-15",              # cherkdagi sana
            "vaqt": "14:30",
            "raw_text": "...",                 # OCR matn
            "xato": None
        }
    """
    if not os.path.exists(rasm_path):
        return {"xato": "Rasm topilmadi"}

    try:
        from google import genai as _genai
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return {"xato": "GEMINI_API_KEY o'rnatilmagan"}

        client = _genai.Client(api_key=key)

        # Upload image
        image_file = client.files.upload(file=rasm_path)

        prompt = """Sen O'zbekistondagi cheklarni o'qiyotgan AI'san.

Chek rasmidan ma'lumotlarni JSON formatda chiqar:

{
  "sotuvchi": "do'kon yoki AZS nomi",
  "kategoriya": "transport / bozorlik / aloqa / dori / boshqa",
  "tovarlar": [
    {"nomi": "tovar nomi", "miqdor": son, "narx": narx_so'mda, "jami": jami_so'mda}
  ],
  "jami": umumiy_summa_so'mda,
  "sana": "YYYY-MM-DD",
  "vaqt": "HH:MM"
}

KATEGORIYA QOIDA:
- AZS, gaz, benzin, dizel → "transport"
- Magnit, oziq-ovqat, do'kon → "bozorlik"
- Beeline, Ucell, Mobiuz → "aloqa"
- Dorixona, klinika → "dori"
- Boshqalari → "boshqa"

MUHIM:
- Faqat JSON qaytar, boshqa matn qo'shma
- Narxlar SO'M da bo'lsin (123 456 → 123456)
- Sana o'zbekcha format bo'lsa ham YYYY-MM-DD ga o'tkaz
"""

        resp = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[prompt, image_file],
        )

        raw = resp.text.strip()

        # Extract JSON
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        if not raw.startswith("{"):
            # Try to find JSON inside response
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                raw = m.group(0)
            else:
                return {"xato": "JSON topilmadi", "raw_text": raw[:500]}

        data = json.loads(raw)

        # Sanitize
        result = {
            "sotuvchi": (data.get("sotuvchi") or "Noma'lum")[:100],
            "kategoriya": data.get("kategoriya", "boshqa"),
            "tovarlar": [],
            "jami": int(float(data.get("jami", 0) or 0)),
            "sana": data.get("sana", ""),
            "vaqt": data.get("vaqt", ""),
            "raw_text": raw[:500],
            "xato": None,
        }

        for t in data.get("tovarlar", []):
            try:
                result["tovarlar"].append({
                    "nomi": str(t.get("nomi", ""))[:100],
                    "miqdor": float(t.get("miqdor", 0) or 0),
                    "narx": int(float(t.get("narx", 0) or 0)),
                    "jami": int(float(t.get("jami", 0) or 0)),
                })
            except (ValueError, TypeError):
                continue

        # Validate
        if result["jami"] <= 0:
            result["xato"] = "Summa aniqlanmadi"

        return result

    except json.JSONDecodeError as e:
        log.warning("chek_oqish JSON xato: %s", e)
        return {"xato": f"JSON parse xato: {str(e)[:100]}"}
    except Exception as e:
        log.error("chek_oqish: %s", e, exc_info=True)
        return {"xato": str(e)[:200]}
