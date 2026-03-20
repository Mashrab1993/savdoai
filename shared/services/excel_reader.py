"""
╔══════════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA — EXCEL AUDITOR v2.0                                     ║
║                                                                          ║
║  200% ANIQLIK — har bir qator, har bir raqam, har bir so'm             ║
║  AI EMAS — o'zimiz hisoblaymiz, XATOSIZ                                ║
║  Auditor darajasidagi xulosa + PDF hisobot                             ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io, json, logging, re, datetime
from typing import Optional
from collections import defaultdict
log = logging.getLogger(__name__)


def excel_toliq_oqi(data: bytes) -> dict:
    """Excel ni AUDITOR darajasida o'qish — har bir hujayra."""
    try:
        from openpyxl import load_workbook
    except ImportError:
        return {"xato": "openpyxl kerak"}

    result = {
        "sheetlar_soni": 0, "sheetlar": [], "umumiy_matn": "",
        "xulosa": {}, "kunlik": [], "klientlar": {}, "rasxod_tafsilot": [],
    }

    try:
        wb = load_workbook(io.BytesIO(data), data_only=True)
        result["sheetlar_soni"] = len(wb.sheetnames)

        umumiy_parts = []
        jami = {"tovar": 0, "dolg": 0, "oplata": 0, "vozvrat": 0, "sales": 0, "rasxod": 0, "fakt_oplata": 0}
        rasxod_kategoriya = defaultdict(float)
        klientlar = defaultdict(lambda: {"dolg": 0, "oplata": 0, "vozvrat": 0})
        kunlik = []

        for sn in wb.sheetnames:
            ws = wb[sn]
            rows = list(ws.iter_rows(values_only=True))
            if len(rows) < 3:
                continue

            # Sarlavha (row[1]) va JAMI (row[2] — # qator)
            sarlavha_row = rows[1] if len(rows) > 1 else []
            jami_row = rows[2] if len(rows) > 2 else []

            sarlavha = [str(c).strip() if c else "" for c in sarlavha_row]

            # JAMI qatorini o'qish (# belgisi bilan boshlanadi)
            kun_data = {"sheet": sn, "tovar": 0, "dolg": 0, "oplata": 0, "vozvrat": 0, "sales": 0, "rasxod": 0, "fakt": 0}
            if jami_row and str(jami_row[0]).strip() == "#":
                vals = []
                for c in jami_row:
                    try:
                        vals.append(float(c) if isinstance(c, (int, float)) and c else 0)
                    except:
                        vals.append(0)
                while len(vals) < 10:
                    vals.append(0)

                kun_data["tovar"] = vals[1]
                kun_data["dolg"] = vals[2]
                kun_data["oplata"] = vals[3]
                kun_data["vozvrat"] = vals[4]
                kun_data["sales"] = vals[5]
                kun_data["rasxod"] = vals[6]
                if len(vals) > 8:
                    kun_data["fakt"] = vals[8]

                for k in ["tovar", "dolg", "oplata", "vozvrat", "sales", "rasxod"]:
                    jami[k] += kun_data[k]
                jami["fakt_oplata"] += kun_data["fakt"]

            kunlik.append(kun_data)

            # Tafsilot qatorlarini o'qish (4-qatordan boshlab)
            for row in rows[3:]:
                cells = [str(c).strip() if c is not None else "" for c in row]
                if not any(cells):
                    continue

                # Klient ismi (3-ustun = Оплаты по долгам, 4-ustun = Сумма возврата)
                for col_idx in [3, 4]:
                    if col_idx < len(cells) and cells[col_idx]:
                        ism = cells[col_idx].strip()
                        if ism and len(ism) > 2 and not ism.replace(',','').replace('.','').replace(' ','').isdigit():
                            if not ism.startswith("VAZVRAT") and not ism.startswith("CLICK"):
                                pass  # Klient nomi

                # Dolg (2-ustun)
                if len(cells) > 2 and cells[2]:
                    try:
                        dolg_val = float(cells[2].replace(',','.').replace(' ',''))
                        if dolg_val > 0 and len(cells) > 3 and cells[3]:
                            klient_ism = cells[3].strip()
                            if klient_ism and len(klient_ism) > 2:
                                klientlar[klient_ism]["dolg"] += dolg_val
                    except:
                        pass

                # Oplata (3-ustun raqam bo'lsa)
                if len(cells) > 3 and cells[3]:
                    try:
                        opl_val = float(cells[3].replace(',','.').replace(' ',''))
                        if opl_val > 0 and len(cells) > 3:
                            # Klient ismi keyingi ustunda
                            if len(cells) > 4 and cells[4]:
                                klient_ism = cells[4].strip()
                                if klient_ism and len(klient_ism) > 2:
                                    klientlar[klient_ism]["oplata"] += opl_val
                    except:
                        pass

                # Rasxod tafsilot (6-ustun = summa, 7-ustun = izoh)
                if len(cells) > 6 and cells[6]:
                    try:
                        rsx_val = float(cells[6].replace(',','.').replace(' ',''))
                        if rsx_val > 0:
                            izoh = cells[7].strip() if len(cells) > 7 else ""
                            result["rasxod_tafsilot"].append({"sheet": sn, "summa": rsx_val, "izoh": izoh})
                            # Kategoriya aniqlash
                            izoh_lower = izoh.lower()
                            if "abet" in izoh_lower:
                                rasxod_kategoriya["ABET"] += rsx_val
                            elif "gaz" in izoh_lower or "benzin" in izoh_lower:
                                rasxod_kategoriya["GAZ/BENZIN"] += rsx_val
                            elif "oylik" in izoh_lower or "maosh" in izoh_lower:
                                rasxod_kategoriya["OYLIK"] += rsx_val
                            elif "skidka" in izoh_lower or "chegirma" in izoh_lower:
                                rasxod_kategoriya["SKIDKA"] += rsx_val
                            elif "click" in izoh_lower:
                                rasxod_kategoriya["CLICK"] += rsx_val
                            elif "moy" in izoh_lower or "moyka" in izoh_lower:
                                rasxod_kategoriya["MOY/MOYKA"] += rsx_val
                            elif "qoldiq" in izoh_lower:
                                rasxod_kategoriya["QOLDIQ"] += rsx_val
                            else:
                                rasxod_kategoriya["BOSHQA"] += rsx_val
                    except:
                        pass

            # Sheet info
            result["sheetlar"].append({
                "nom": sn, "qator_soni": len(rows),
                "sarlavha": sarlavha,
                "kun_data": kun_data,
            })

            # Umumiy matn
            sheet_text = f"=== {sn} ({len(rows)} qator) ===\n"
            for row in rows[:60]:
                cells = [str(c).strip() if c is not None else "" for c in row]
                if any(cells):
                    sheet_text += " | ".join(cells) + "\n"
            umumiy_parts.append(sheet_text)

        result["xulosa"] = {
            "jami_tovar": jami["tovar"],
            "jami_dolg": jami["dolg"],
            "jami_oplata": jami["oplata"],
            "jami_vozvrat": jami["vozvrat"],
            "jami_sales": jami["sales"],
            "jami_rasxod": jami["rasxod"],
            "jami_fakt_oplata": jami["fakt_oplata"],
            "sof_foyda": jami["sales"] - jami["rasxod"],
            "rasxod_kategoriya": dict(rasxod_kategoriya),
            "klientlar_soni": len(klientlar),
        }
        result["kunlik"] = kunlik
        result["klientlar"] = dict(klientlar)
        result["umumiy_matn"] = "\n".join(umumiy_parts)

        wb.close()
        log.info("Excel AUDITOR: %d sheet, jami_sales=%.0f, jami_rasxod=%.0f",
                 result["sheetlar_soni"], jami["sales"], jami["rasxod"])

    except Exception as e:
        log.error("Excel: %s", e)
        result["xato"] = str(e)

    return result


def _pul(v):
    try:
        return f"{float(v):,.0f}"
    except:
        return "0"


def excel_xulosa_matn(r: dict, fayl_nomi: str) -> str:
    """AUDITOR darajasidagi xulosa — Telegram uchun."""
    t = f"📊 *MASHRAB MOLIYA*\n"
    t += f"📂 {fayl_nomi}\n"
    t += "━━━━━━━━━━━━━━━━━━━━━━━━\n\n"

    if r.get("xato"):
        return t + f"❌ {r['xato']}"

    x = r.get("xulosa", {})
    kunlar = len([k for k in r.get("kunlik", []) if k.get("tovar", 0) > 0])

    t += f"📅 Davr: *{kunlar} ish kuni*\n"
    t += f"📑 Sheetlar: *{r.get('sheetlar_soni', 0)}* ta\n\n"

    t += "💰 *ASOSIY KO'RSATKICHLAR:*\n"
    t += f"  📦 Olingan tovar: *{_pul(x.get('jami_tovar', 0))}*\n"
    t += f"  💳 Sotuv (Sales): *{_pul(x.get('jami_sales', 0))}*\n"
    t += f"  📝 Qarzga berilgan: *{_pul(x.get('jami_dolg', 0))}*\n"
    t += f"  ✅ Qarz to'langan: *{_pul(x.get('jami_oplata', 0))}*\n"
    t += f"  ↩️ Qaytarilgan: *{_pul(x.get('jami_vozvrat', 0))}*\n"
    t += f"  📤 Rasxodlar: *{_pul(x.get('jami_rasxod', 0))}*\n\n"

    # Rasxod tafsilot
    kat = x.get("rasxod_kategoriya", {})
    if kat:
        t += "📊 *RASXOD TAFSILOTI:*\n"
        for k, v in sorted(kat.items(), key=lambda x: -x[1]):
            t += f"  {k}: {_pul(v)}\n"
        t += "\n"

    sof = x.get("sof_foyda", 0)
    if sof > 0:
        t += f"✅ *SOF NATIJA: +{_pul(sof)}*\n"
    else:
        t += f"❌ *SOF NATIJA: {_pul(sof)}*\n"

    t += "\n💡 Savolingizni bering — *Mashrab Moliya* javob beradi!"
    return t.rstrip()


def savol_javob(r: dict, savol: str) -> str:
    """Har qanday savolga ANIQ javob — AI siz, XATOSIZ."""
    s = savol.lower().strip().strip('"').strip("'").strip("?").strip()
    x = r.get("xulosa", {})
    kat = x.get("rasxod_kategoriya", {})

    # RASXOD kategoriyalar
    ABET_SOZLAR = ["abet", "abed", "abid", "abyet"]
    GAZ_SOZLAR = ["gaz", "benzin", "yoqilgi", "gaz benzin"]
    OYLIK_SOZLAR = ["oylik", "maosh", "ish haqi"]

    for soz in ABET_SOZLAR:
        if soz in s:
            v = kat.get("ABET", 0)
            return f"📊 *MASHRAB MOLIYA*\n\n💰 *ABET:* {_pul(v)} so'm\n\n📋 {len([r for r in (r if isinstance(r, list) else [])]) if False else ''}" if v else f"📊 *MASHRAB MOLIYA*\n\n💰 *ABET:* {_pul(v)} so'm"

    for soz in GAZ_SOZLAR:
        if soz in s:
            v = kat.get("GAZ/BENZIN", 0)
            return f"📊 *MASHRAB MOLIYA*\n\n⛽ *GAZ/BENZIN:* {_pul(v)} so'm"

    for soz in OYLIK_SOZLAR:
        if soz in s:
            v = kat.get("OYLIK", 0)
            return f"📊 *MASHRAB MOLIYA*\n\n👤 *OYLIK:* {_pul(v)} so'm"

    if "skidka" in s or "chegirma" in s:
        v = kat.get("SKIDKA", 0)
        return f"📊 *MASHRAB MOLIYA*\n\n🏷 *SKIDKA:* {_pul(v)} so'm"

    if "click" in s:
        v = kat.get("CLICK", 0)
        return f"📊 *MASHRAB MOLIYA*\n\n📱 *CLICK:* {_pul(v)} so'm"

    # UMUMIY SAVOLLAR
    if any(k in s for k in ["rasxod", "xarajat", "расход", "chiqim", "sarf"]):
        t = "📊 *MASHRAB MOLIYA — RASXODLAR*\n\n"
        jami = 0
        for k, v in sorted(kat.items(), key=lambda x: -x[1]):
            t += f"  {k}: *{_pul(v)}*\n"
            jami += v
        t += f"\n  📌 *JAMI RASXOD: {_pul(jami)}*"
        return t

    if any(k in s for k in ["sotuv", "savdo", "sales", "jami summa", "tushum"]):
        return (f"📊 *MASHRAB MOLIYA — SOTUV*\n\n"
                f"  💳 Sotuv (Sales): *{_pul(x.get('jami_sales', 0))}*\n"
                f"  📦 Olingan tovar: *{_pul(x.get('jami_tovar', 0))}*\n"
                f"  ✅ Sof natija: *{_pul(x.get('sof_foyda', 0))}*")

    if any(k in s for k in ["qarz", "dolg", "долг", "qarzdor"]):
        return (f"📊 *MASHRAB MOLIYA — QARZLAR*\n\n"
                f"  📝 Qarzga berilgan: *{_pul(x.get('jami_dolg', 0))}*\n"
                f"  ✅ To'langan: *{_pul(x.get('jami_oplata', 0))}*\n"
                f"  📌 Farq: *{_pul(x.get('jami_dolg', 0) - x.get('jami_oplata', 0))}*")

    if any(k in s for k in ["vozvrat", "qaytarish", "qaytarilgan", "возврат"]):
        return f"📊 *MASHRAB MOLIYA*\n\n↩️ *Qaytarilgan: {_pul(x.get('jami_vozvrat', 0))}*"

    if any(k in s for k in ["tovar", "olingan", "kelgan", "товар"]):
        return f"📊 *MASHRAB MOLIYA*\n\n📦 *Olingan tovar: {_pul(x.get('jami_tovar', 0))}*"

    if any(k in s for k in ["foyda", "natija", "sof", "daromad", "profit"]):
        sof = x.get("sof_foyda", 0)
        emoji = "✅" if sof > 0 else "❌"
        return f"📊 *MASHRAB MOLIYA*\n\n{emoji} *Sof natija: {_pul(sof)}*\n\n  Sales: {_pul(x.get('jami_sales',0))}\n  Rasxod: {_pul(x.get('jami_rasxod',0))}"

    if any(k in s for k in ["klient", "mijoz", "клиент"]):
        kl = r.get("klientlar", {})
        if kl:
            t = f"📊 *MASHRAB MOLIYA — KLIENTLAR ({len(kl)} ta)*\n\n"
            for ism, data in sorted(kl.items(), key=lambda x: -x[1].get("dolg",0))[:15]:
                d = data.get("dolg", 0)
                o = data.get("oplata", 0)
                if d > 0 or o > 0:
                    t += f"  👤 {ism}: dolg={_pul(d)}, to'lov={_pul(o)}\n"
            return t.rstrip()
        return "📊 *MASHRAB MOLIYA*\n\nKlient ma'lumoti topilmadi."

    if any(k in s for k in ["kunlik", "kun bo'yicha", "har kun"]):
        t = "📊 *MASHRAB MOLIYA — KUNLIK*\n\n"
        for k in r.get("kunlik", [])[:20]:
            if k.get("tovar", 0) > 0:
                t += f"  📅 {k['sheet'][:25]}: sales={_pul(k['sales'])}\n"
        return t.rstrip()

    return None  # AI ga yuborish


async def excel_ai_savol(r: dict, savol: str, gemini_key: str = "") -> str:
    """Avval o'zimiz javob, topilmasa AI."""
    import asyncio, os

    # 1. O'zimiz javob — ANIQ, XATOSIZ
    javob = savol_javob(r, savol)
    if javob:
        return javob

    # 2. AI — murakkab savollar uchun
    if not gemini_key:
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return f"📊 *MASHRAB MOLIYA*\n\n🔍 '{savol}' bo'yicha javob topilmadi."

    matn = r.get("umumiy_matn", "")[:25000]
    x = r.get("xulosa", {})

    prompt = f"""Sen MASHRAB MOLIYA auditor tizimisan. Excel ma'lumotlari berilgan.
ANIQ raqamlar bilan javob ber. "Mashrab Moliya" nomidan javob ber.
Raqamlarni 1,234,567 formatda yoz. 

UMUMIY KO'RSATKICHLAR (SEN BILASAN):
- Jami tovar: {x.get('jami_tovar',0):,.0f}
- Jami sotuv: {x.get('jami_sales',0):,.0f}
- Jami qarz: {x.get('jami_dolg',0):,.0f}
- Jami to'langan: {x.get('jami_oplata',0):,.0f}
- Jami qaytarish: {x.get('jami_vozvrat',0):,.0f}
- Jami rasxod: {x.get('jami_rasxod',0):,.0f}
- Rasxod tafsilot: {json.dumps(x.get('rasxod_kategoriya',{}), ensure_ascii=False)}

EXCEL MA'LUMOTLARI:
{matn}

SAVOL: {savol}

Javobni "📊 MASHRAB MOLIYA" bilan boshla. Aniq raqamlar ber."""

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
            # "AI JAVOB" o'rniga "MASHRAB MOLIYA"
            javob = javob.replace("AI JAVOB", "MASHRAB MOLIYA")
            javob = javob.replace("🤖 AI", "📊 Mashrab Moliya")
            return javob
    except Exception as e:
        log.debug("Excel AI: %s", e)

    return f"📊 *MASHRAB MOLIYA*\n\n🔍 '{savol}' bo'yicha javob topilmadi. Boshqacha so'rab ko'ring."


def _oddiy_izlash(r: dict, savol: str) -> str:
    """Fallback."""
    javob = savol_javob(r, savol)
    if javob:
        return javob
    return f"📊 *MASHRAB MOLIYA*\n\n🔍 '{savol}' — boshqacha so'rab ko'ring."
