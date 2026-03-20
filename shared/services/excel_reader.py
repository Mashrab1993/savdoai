"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXCEL SUPER READER v1.0                                       ║
║                                                                          ║
║  Har qanday Excel faylni 200% o'qiydi:                                 ║
║  - Barcha sheetlar, barcha qatorlar, barcha ustunlar                   ║
║  - Rasxodlar, kirimlar, qarzlar, klientlar, narxlar                   ║
║  - ABET, GAZ, BENZIN, OYLIK — kategoriyalar bo'yicha                  ║
║  - Nakladnoy, Reestr, Hisobot — har xil turdagi fayllar              ║
║  - Gemini AI bilan har qanday savolga javob                           ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io, json, logging, re
from typing import Optional
log = logging.getLogger(__name__)


def excel_toliq_oqi(data: bytes) -> dict:
    """Excel faylni BUTUNLAY o'qish — har bir sheet, har bir hujayra."""
    try:
        from openpyxl import load_workbook
    except ImportError:
        return {"xato": "openpyxl kerak"}
    
    result = {
        "sheetlar_soni": 0,
        "sheetlar": [],
        "umumiy_matn": "",
        "xulosa": {},
    }
    
    try:
        wb = load_workbook(io.BytesIO(data), data_only=True)
        result["sheetlar_soni"] = len(wb.sheetnames)
        
        umumiy_parts = []
        jami_kirim = 0; jami_rasxod = 0; jami_qarz = 0; jami_sotuv = 0
        jami_vozvrat = 0; jami_tolangan = 0
        kategoriyalar = {}  # ABET, GAZ, BENZIN, OYLIK...
        klientlar = {}  # klient → summa
        
        for sheet_idx, sheet_name in enumerate(wb.sheetnames):
            ws = wb[sheet_name]
            if ws.max_row is None or ws.max_row < 1:
                continue
            
            # Barcha qatorlarni o'qish
            rows_data = []
            for row in ws.iter_rows(values_only=True):
                row_clean = [str(c).strip() if c is not None else "" for c in row]
                if any(cell for cell in row_clean):  # Bo'sh qatorni o'tkazish
                    rows_data.append(row_clean)
            
            if not rows_data:
                continue
            
            # Sarlavha aniqlash (birinchi mazmunli qator)
            sarlavha = []
            sarlavha_idx = 0
            for i, row in enumerate(rows_data[:5]):
                # Ko'p so'z bo'lgan qator = sarlavha
                text_cells = [c for c in row if c and len(c) > 1 and not c.replace('.','').replace('-','').isdigit()]
                if len(text_cells) >= 2:
                    sarlavha = row
                    sarlavha_idx = i
                    break
            
            # Raqamlar yig'ish
            raqamlar = []
            for row in rows_data:
                for cell in row:
                    try:
                        v = float(cell.replace(',', '.').replace(' ', ''))
                        if v != 0:
                            raqamlar.append(v)
                    except (ValueError, AttributeError):
                        pass
            
            # Kategoriyalar aniqlash
            for row in rows_data:
                for i, cell in enumerate(row):
                    cell_lower = cell.lower().strip()
                    # Rasxod kategoriyalar
                    for kat in ["abet", "gaz", "benzin", "oylik", "moy", "skidka", "moyka"]:
                        if kat in cell_lower:
                            # Yonidagi raqamni topish
                            for j in range(max(0, i-2), min(len(row), i+3)):
                                try:
                                    v = float(row[j].replace(',','.').replace(' ',''))
                                    if 0 < v < 100000000:
                                        kategoriyalar.setdefault(kat.upper(), 0)
                                        kategoriyalar[kat.upper()] += v
                                except: pass
                    
                    # Klientlar — "В долг" ustunidagi klient ismlari
                    if cell_lower and len(cell_lower) > 3 and not cell_lower.replace('.','').replace('-','').isdigit():
                        if any(k in cell_lower for k in ["market", "magazin", "aka", "opa", "savdo"]):
                            klientlar.setdefault(cell.strip(), 0)
            
            # Sheet summalarini topish
            for row in rows_data[:5]:
                for i, cell in enumerate(row):
                    try:
                        v = float(cell.replace(',','.').replace(' ',''))
                        if v > 1000000:
                            # Kontekstga qarab kategoriya
                            context_row = " ".join(rows_data[0] if rows_data else []).lower()
                            sarlavha_text = " ".join(sarlavha).lower()
                            if "полученный" in sarlavha_text or "товар" in sarlavha_text:
                                if i == 1 or (sarlavha and i < len(sarlavha) and "полученн" in sarlavha[i].lower()):
                                    jami_kirim += v
                            if "долг" in sarlavha_text:
                                jami_qarz += v
                    except: pass
            
            # Sheet ma'lumot
            sheet_data = {
                "nom": sheet_name,
                "qator_soni": len(rows_data),
                "ustun_soni": ws.max_column,
                "sarlavha": sarlavha,
                "birinchi_5": rows_data[:5],
                "oxirgi_3": rows_data[-3:] if len(rows_data) > 3 else [],
                "raqamlar_soni": len(raqamlar),
                "jami_raqam": sum(raqamlar) if raqamlar else 0,
            }
            
            if raqamlar:
                sheet_data["eng_katta"] = max(raqamlar)
                sheet_data["eng_kichik"] = min(r for r in raqamlar if r > 0) if [r for r in raqamlar if r > 0] else 0
            
            result["sheetlar"].append(sheet_data)
            
            # Umumiy matn — Gemini uchun
            sheet_text = f"=== SHEET: {sheet_name} ({len(rows_data)} qator) ===\n"
            for row in rows_data[:80]:  # Max 80 qator per sheet
                sheet_text += " | ".join(row) + "\n"
            if len(rows_data) > 80:
                sheet_text += f"... va yana {len(rows_data)-80} qator\n"
            umumiy_parts.append(sheet_text)
        
        # Umumiy xulosa
        result["xulosa"] = {
            "jami_kirim": jami_kirim,
            "jami_rasxod": jami_rasxod,
            "jami_qarz": jami_qarz,
            "jami_vozvrat": jami_vozvrat,
            "kategoriyalar": kategoriyalar,
            "klientlar_soni": len(klientlar),
        }
        
        result["umumiy_matn"] = "\n".join(umumiy_parts)
        
        wb.close()
        log.info("Excel: %d sheet, %d KB matn", result["sheetlar_soni"], len(result["umumiy_matn"])//1024)
        
    except Exception as e:
        log.error("Excel: %s", e)
        result["xato"] = str(e)
    
    return result


def excel_xulosa_matn(r: dict, fayl_nomi: str) -> str:
    """Chiroyli xulosa."""
    t = f"📊 *{fayl_nomi}*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    
    if r.get("xato"):
        return t + f"❌ {r['xato']}"
    
    t += f"📑 Sheetlar: *{r.get('sheetlar_soni', 0)}* ta\n\n"
    
    for sh in r.get("sheetlar", [])[:15]:
        t += f"📋 *{sh['nom']}*: {sh['qator_soni']} qator\n"
        if sh.get("sarlavha"):
            cols = [c[:15] for c in sh["sarlavha"] if c][:5]
            if cols:
                t += f"   Ustunlar: {', '.join(cols)}\n"
    
    if len(r.get("sheetlar", [])) > 15:
        t += f"   ...va yana {len(r['sheetlar'])-15} ta sheet\n"
    
    xulosa = r.get("xulosa", {})
    kat = xulosa.get("kategoriyalar", {})
    if kat:
        t += "\n💰 *RASXODLAR:*\n"
        for k, v in sorted(kat.items(), key=lambda x: -x[1]):
            t += f"   {k}: {v:,.0f}\n"
    
    t += "\n💡 *SAVOLLAR:*\n"
    t += "  \"rasxodlar qancha?\" \"gaz uchun qancha?\"\n"
    t += "  \"qarzlar?\" \"klientlar?\" \"abet?\"\n"
    t += "  Yoki istalgan savolni bering!\n"
    
    return t.rstrip()


async def excel_ai_savol(r: dict, savol: str, gemini_key: str = "") -> str:
    """Gemini AI bilan Excel haqida har qanday savolga javob."""
    import asyncio, os
    
    if not gemini_key:
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return _oddiy_izlash(r, savol)
    
    # Excel matnini tayyorlash (max 25K belgi)
    matn = r.get("umumiy_matn", "")
    if len(matn) > 25000:
        matn = matn[:25000]
    
    prompt = f"""Sen moliyaviy hujjat ekspertiSAN. Excel fayl ma'lumotlari berilgan.
Savolga ANIQ, RAQAMLI javob ber. Jamini hisoblash, qo'shish, taqqoslash — hammasi.

QOIDALAR:
- Raqamlarni ANIQ ko'rsat (1,234,567 formatda)
- Har bir javobda MANBA ko'rsat (qaysi sheet, qaysi ustun)
- Agar savolga javob topilmasa — "topilmadi" de
- O'zbek tilida javob ber
- Jadval ko'rinishida ko'rsat

EXCEL MA'LUMOTLARI:
{matn}

SAVOL: {savol}

JAVOB:"""
    
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=gemini_key)
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt,
                config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=3000))),
            timeout=30)
        javob = (response.text or "").strip()
        if javob:
            return f"🤖 *JAVOB:*\n\n{javob}"
    except Exception as e:
        log.debug("Excel AI: %s", e)
    
    return _oddiy_izlash(r, savol)


def _oddiy_izlash(r: dict, savol: str) -> str:
    """AI siz oddiy izlash."""
    s = savol.lower()
    
    # Kategoriyalar bo'yicha
    xulosa = r.get("xulosa", {})
    kat = xulosa.get("kategoriyalar", {})
    
    for k, v in kat.items():
        if k.lower() in s:
            return f"💰 *{k}*: {v:,.0f} so'm"
    
    if "rasxod" in s or "xarajat" in s or "расход" in s:
        if kat:
            t = "💰 *RASXODLAR:*\n\n"
            jami = 0
            for k, v in sorted(kat.items(), key=lambda x: -x[1]):
                t += f"  {k}: {v:,.0f}\n"
                jami += v
            t += f"\n  *JAMI: {jami:,.0f}*"
            return t
    
    return f"🔍 '{savol}' bo'yicha aniq javob topilmadi. AI tahlil uchun qayta urinib ko'ring."
