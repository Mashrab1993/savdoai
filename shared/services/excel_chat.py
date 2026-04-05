"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXCEL CHAT ANALYZER                              ║
║  Excel faylni o'qib, AI orqali savollarga javob berish       ║
║                                                              ║
║  Ishlash tartibi:                                            ║
║  1. excel_parse() — faylni to'liq o'qish                    ║
║  2. excel_savol() — savolga AI orqali javob berish           ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import json
import logging
import os
from typing import Optional

log = logging.getLogger("savdoai.excel_chat")


def excel_parse(file_bytes: bytes, filename: str = "file.xlsx") -> dict:
    """
    Excel faylni to'liq o'qib, tuzilmali dict qaytaradi.
    Natija AI ga kontekst sifatida beriladi.
    """
    try:
        import openpyxl
    except ImportError:
        return {"error": "openpyxl kutubxonasi o'rnatilmagan"}

    try:
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    except Exception as e:
        return {"error": f"Fayl o'qib bo'lmadi: {e}"}

    result = {
        "filename": filename,
        "sheets_count": len(wb.sheetnames),
        "sheets": []
    }

    total_cells = 0
    for sn in wb.sheetnames:
        ws = wb[sn]
        sheet_data = {
            "name": sn,
            "rows": ws.max_row or 0,
            "cols": ws.max_column or 0,
            "data": []
        }

        for row in ws.iter_rows(min_row=1, max_row=ws.max_row,
                                max_col=ws.max_column, values_only=False):
            row_data = {}
            for cell in row:
                if cell.value is not None:
                    v = cell.value
                    if isinstance(v, (int, float)):
                        row_data[cell.coordinate] = v
                    else:
                        row_data[cell.coordinate] = str(v)
                    total_cells += 1
            if row_data:
                sheet_data["data"].append(row_data)

        result["sheets"].append(sheet_data)

    result["total_cells"] = total_cells
    wb.close()
    return result


def _excel_to_text(parsed: dict, max_chars: int = 80000) -> str:
    """
    Parsed Excel ni AI uchun matn formatga aylantirish.
    Katta fayllar uchun qisqartirish.
    """
    lines = []
    lines.append(f"FAYL: {parsed['filename']}")
    lines.append(f"SHEETLAR: {parsed['sheets_count']} ta")
    lines.append(f"JAMI KATAKLAR: {parsed['total_cells']}")
    lines.append("")

    for sheet in parsed["sheets"]:
        lines.append(f"===== SHEET: '{sheet['name']}' ({sheet['rows']}x{sheet['cols']}) =====")
        for row_data in sheet["data"]:
            parts = []
            for coord, val in row_data.items():
                if isinstance(val, float):
                    if val == int(val):
                        parts.append(f"{coord}={int(val)}")
                    else:
                        parts.append(f"{coord}={val}")
                else:
                    parts.append(f"{coord}={val}")
            lines.append(" | ".join(parts))
        lines.append("")

    text = "\n".join(lines)

    # Hajm chegarasi
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n... (qisqartirildi)"

    return text


async def excel_savol(parsed: dict, savol: str,
                      tarix: list[dict] | None = None) -> str:
    """
    Excel haqida savolga AI orqali javob berish.
    
    Args:
        parsed: excel_parse() natijasi
        savol: foydalanuvchi savoli
        tarix: oldingi savol-javoblar [{role, content}, ...]
    
    Returns:
        AI javobi (str)
    """
    excel_text = _excel_to_text(parsed)

    system_prompt = """Sen Excel fayl tahlilchisisisan. Foydalanuvchi Excel fayl yukladi va sen uni to'liq ko'ra olasan.

VAZIFANG:
- Foydalanuvchi savoliga aniq, to'g'ri javob ber
- Raqamlarni yaxshilab hisoblash, tekshirish
- O'zbek yoki rus tilida javob ber (foydalanuvchi qaysi tilda yozsa)
- Summalarni formatlash: 1,000,000 so'm
- Agar savol aniq bo'lmasa, eng mantiqiy javobni ber
- Jadval ko'rinishida javob ber (agar kerak bo'lsa)
- Qisqa va aniq javob ber, ortiqcha gap keramas

MUHIM QOIDALAR:
- Har doim BARCHA sheetlarni tekshir, birontasini ham tashlab ketma
- Raqamlarni 2 marta tekshir — xato bo'lmasin
- "Ойлик" = maosh/salary, "скидка" = chegirma, "газ" = yoqilg'i, "обед" = tushlik
- "карта" = bank kartaga o'tkazma, "$" = dollar operatsiya
- "колдик" = qoldiq (farq), "тачка" = aravakash haqi
- "клик" = Click.uz to'lov, "перечисление" = pul o'tkazma
- Итого bo'limi (pastdagi jadval) — har kunning yakuniy hisobi"""

    messages = [
        {
            "role": "user",
            "content": f"EXCEL FAYL MAZMUNI:\n\n{excel_text}"
        },
        {
            "role": "assistant",
            "content": "Excel faylni to'liq o'qib chiqdim. Barcha sheetlar va ma'lumotlar ko'rinib turibdi. Savol bering — javob beraman."
        }
    ]

    # Oldingi savol-javoblarni qo'shish
    if tarix:
        for msg in tarix[-10:]:  # Oxirgi 10 ta xabar
            messages.append(msg)

    # Hozirgi savol
    messages.append({"role": "user", "content": savol})

    # AI chaqirish — avval Gemini, keyin Claude
    answer = await _ask_gemini(system_prompt, messages)
    if not answer:
        answer = await _ask_claude(system_prompt, messages)
    if not answer:
        answer = "❌ AI javob bera olmadi. Keyinroq urinib ko'ring."

    return answer


async def _ask_gemini(system: str, messages: list[dict]) -> str | None:
    """Gemini orqali javob olish"""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        # Messages ni Gemini formatga aylantirish
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append(genai.types.Content(
                role=role,
                parts=[genai.types.Part(text=m["content"])]
            ))

        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
        return response.text if response.text else None
    except Exception as e:
        log.warning("Gemini excel_chat xato: %s", e)
        return None


async def _ask_claude(system: str, messages: list[dict]) -> str | None:
    """Claude orqali javob olish"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system,
            messages=messages,
        )
        if response.content and response.content[0].text:
            return response.content[0].text
        return None
    except Exception as e:
        log.warning("Claude excel_chat xato: %s", e)
        return None
