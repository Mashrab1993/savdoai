"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — VOICE ORDER PARSER                                ║
║                                                              ║
║  Agent ovozli xabar yuboradi → tizim avtomatik               ║
║  sotuv_sessiya + chiqimlar yaratadi.                         ║
║                                                              ║
║  Flow:                                                       ║
║    1. Gemini STT: ovoz → matn (tashqarida bajariladi)        ║
║    2. parse_order_text(): matn → structured JSON             ║
║    3. create_order_from_voice(): JSON → DB records           ║
║                                                              ║
║  Agent faqat DO'KON NOMI + TOVAR NOMI + MIQDOR aytadi.      ║
║  NARX — DB'dan olinadi (tovarlar.sotish_narxi).             ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

log = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
#  HELPERS
# ════════════════════════════════════════════════════════════

def _to_decimal(val) -> Decimal:
    """Convert any numeric value to Decimal safely."""
    if isinstance(val, Decimal):
        return val
    if val is None:
        return Decimal("0")
    return Decimal(str(val))


# ════════════════════════════════════════════════════════════
#  TEXT PARSER — matndan do'kon + tovarlar ajratish
# ════════════════════════════════════════════════════════════

def parse_order_text(text: str) -> dict:
    """
    Agent ovozidan keyin Gemini STT bergan matnni parse qilish.

    Input example:
        "Xurshid Aka — Rosabella qizil 2 ta, Dollux 4 ta, Park 1 dona"
        yoki
        "Xurshid Aka. Rosabella qizil ikki dona. Dollux to'rt dona."

    Returns:
        {
            "do'kon": "Xurshid Aka",
            "tovarlar": [
                {"nomi": "Rosabella qizil", "miqdor": 2},
                {"nomi": "Dollux", "miqdor": 4},
                {"nomi": "Park", "miqdor": 1},
            ],
            "xato": None
        }
    """
    text = text.strip()
    if not text:
        return {"do'kon": "", "tovarlar": [], "xato": "Bo'sh matn"}

    # O'zbek son nomlari → raqam
    SON_MAP = {
        "bir": 1, "bitta": 1, "ikki": 2, "ikkita": 2,
        "uch": 3, "uchta": 3, "to'rt": 4, "to'rtta": 4, "tort": 4,
        "besh": 5, "beshta": 5, "olti": 6, "oltita": 6,
        "yetti": 7, "yettita": 7, "sakkiz": 8, "sakkizta": 8,
        "to'qqiz": 9, "to'qqizta": 9, "o'n": 10, "o'nta": 10,
        "o'n bir": 11, "o'n ikki": 12, "o'n besh": 15,
        "yigirma": 20, "o'ttiz": 30, "qirq": 40, "ellik": 50,
    }

    # Step 1: Do'kon nomini ajratish
    # Patterns: "Do'kon nomi — tovarlar" yoki "Do'kon nomi. Tovarlar"
    # yoki "Do'kon nomi, tovar1 N ta, tovar2 M ta"
    dokon = ""
    tovar_text = text

    # Try separator patterns
    for sep in ["—", "–", "-", ".", ","]:
        if sep in text:
            parts = text.split(sep, 1)
            candidate = parts[0].strip()
            rest = parts[1].strip()
            # Do'kon name is usually short (1-5 words), doesn't contain numbers
            words = candidate.split()
            if 1 <= len(words) <= 8 and not any(w.isdigit() for w in words[:2]):
                dokon = candidate
                tovar_text = rest
                break

    # If no separator found, try first sentence
    if not dokon:
        sentences = re.split(r'[.!?]', text, 1)
        if len(sentences) > 1:
            dokon = sentences[0].strip()
            tovar_text = sentences[1].strip()

    # Step 2: Tovarlarni ajratish
    tovarlar = []

    # Split by comma (only if followed by space+word), "keyin", "yana", periods.
    # NOTE: "va" is NOT a splitter — it appears inside product names
    # (e.g. "Gullar va Ariqlar 3 ta") and in phrases like
    # "Rosabella qizil 2 ta va Dollux 4 ta" where comma already splits.
    # We split on "va" ONLY if it's between two quantity patterns.
    items_raw = re.split(r'[.]|\bkeyin\b|\byana\b', tovar_text)

    # Second pass: split remaining items by comma, but preserve commas
    # inside names (e.g. "Tovar A, B model 3 ta" should NOT split)
    expanded = []
    for chunk in items_raw:
        # Split by comma only if what follows looks like a new item
        # (starts with a word, not a continuation like "qizil")
        parts = re.split(r',\s*(?=[A-ZА-ЯЎҚҒҲa-zа-яўқғҳ])', chunk)
        expanded.extend(parts)
    items_raw = expanded

    # Third pass: split on "va" only between qty patterns
    # "Rosabella 2 ta va Dollux 4 ta" → two items
    final_items = []
    for chunk in items_raw:
        # Split on "va" only if preceded by a number/qty word
        parts = re.split(
            r'(?:\d+\s*(?:ta|dona|karobka|shtuk|kg)?)\s+va\s+',
            chunk
        )
        if len(parts) > 1:
            # Re-attach the quantity to the first part
            m_split = re.search(
                r'(\d+\s*(?:ta|dona|karobka|shtuk|kg)?)\s+va\s+',
                chunk, re.IGNORECASE,
            )
            if m_split:
                final_items.append(chunk[:m_split.end(1)])
                final_items.append(chunk[m_split.end():])
            else:
                final_items.extend(parts)
        else:
            final_items.append(chunk)
    items_raw = final_items

    for item in items_raw:
        item = item.strip()
        if not item or len(item) < 3:
            continue

        # Find quantity pattern: "N ta", "N dona", "N karobka", "N shtuk", or just "N"
        miqdor = 0
        nomi = item

        # Try: "tovar_name MIQDOR ta/dona/karobka/shtuk/kg"
        m = re.search(
            r'(\d+)\s*(?:ta|dona|karobka|shtuk|sht|kg|kilogramm?|pachka|quti|korobka|bl[oa]k)?\s*$',
            item, re.IGNORECASE,
        )
        if m:
            miqdor = int(m.group(1))
            nomi = item[:m.start()].strip()
        else:
            # Try O'zbek son nomlari: "ikki dona", "beshta"
            for word, num in sorted(SON_MAP.items(), key=lambda x: -len(x[0])):
                pattern = rf'\b{re.escape(word)}\b\s*(?:ta|dona|karobka|shtuk|kg|kilogramm?)?\s*$'
                m2 = re.search(pattern, item, re.IGNORECASE)
                if m2:
                    miqdor = num
                    nomi = item[:m2.start()].strip()
                    break

        # Try: "MIQDOR tovar_name" (number at the beginning)
        if miqdor == 0:
            m3 = re.match(r'^(\d+)\s+(.+)', item)
            if m3:
                miqdor = int(m3.group(1))
                nomi = m3.group(2).strip()

        # Default miqdor = 1 ONLY if a quantity indicator was found
        # (digit, "ta", "dona", O'zbek number word). Otherwise skip —
        # plain words without qty are NOT order items.
        if miqdor == 0:
            # No quantity found — skip this item (not a real order line)
            continue

        # Clean up name
        nomi = re.sub(r'\s+', ' ', nomi).strip()
        # Remove trailing "dan", "lik" etc
        nomi = re.sub(r'\s+(dan|lik|ning|ga|ni)$', '', nomi, flags=re.IGNORECASE)

        if nomi and len(nomi) >= 2:
            tovarlar.append({"nomi": nomi, "miqdor": miqdor})

    return {
        "do'kon": dokon,
        "tovarlar": tovarlar,
        "xato": None if dokon and tovarlar else "Do'kon yoki tovarlar aniqlanmadi",
    }


# ════════════════════════════════════════════════════════════
#  FUZZY MATCHING — DB'dagi tovarlar bilan moslashtirish
# ════════════════════════════════════════════════════════════

def fuzzy_match_tovar(nomi: str, db_tovarlar: list[dict]) -> Optional[dict]:
    """
    Agent aytgan tovar nomini DB'dagi eng mos tovar bilan moslashtirish.

    Agent: "Rosabella qizil"
    DB:    "ROSABELLA KIZIL 2 kg"  ← MATCH

    Oddiy substring + lowercase matching. Keyinroq ML bilan
    yaxshilash mumkin.
    """
    nomi_lower = nomi.lower().strip()
    if not nomi_lower:
        return None

    best = None
    best_score = 0

    for tv in db_tovarlar:
        db_nomi = (tv.get("nomi") or "").lower()
        if not db_nomi:
            continue

        # Exact substring match
        if nomi_lower in db_nomi or db_nomi in nomi_lower:
            score = len(nomi_lower) / max(len(db_nomi), 1)
            if score > best_score:
                best_score = score
                best = tv
            continue

        # Word overlap
        words_input = set(nomi_lower.split())
        words_db = set(db_nomi.split())
        common = words_input & words_db
        if common:
            score = len(common) / max(len(words_input), len(words_db))
            if score > best_score:
                best_score = score
                best = tv

    # Minimum threshold — 0.4 prevents false positives
    # (e.g. "Park" matching "Parking karta 500mb")
    if best_score < 0.4:
        return None

    return best


def fuzzy_match_klient(nomi: str, db_klientlar: list[dict]) -> Optional[dict]:
    """
    Agent aytgan do'kon nomini DB'dagi klient bilan moslashtirish.

    Agent: "Xurshid Aka"
    DB:    "Xurshid Aka Qorĝoncha"  ← MATCH
    """
    nomi_lower = nomi.lower().strip()
    if not nomi_lower:
        return None

    best = None
    best_score = 0

    for kl in db_klientlar:
        db_ism = (kl.get("ism") or "").lower()
        if not db_ism:
            continue

        if nomi_lower in db_ism or db_ism in nomi_lower:
            score = len(nomi_lower) / max(len(db_ism), 1)
            if score > best_score:
                best_score = score
                best = kl
            continue

        words_input = set(nomi_lower.split())
        words_db = set(db_ism.split())
        common = words_input & words_db
        if common:
            score = len(common) / max(len(words_input), len(words_db))
            if score > best_score:
                best_score = score
                best = kl

    if best_score < 0.3:
        return None

    return best


# ════════════════════════════════════════════════════════════
#  ORDER CREATION — DB'da sotuv yaratish
# ════════════════════════════════════════════════════════════

async def create_order_from_voice(
    conn,
    uid: int,
    parsed: dict,
    db_tovarlar: list[dict],
    db_klientlar: list[dict],
    *,
    pre_matched: list[dict] | None = None,
) -> dict:
    """
    Parse qilingan matndan sotuv_sessiya + chiqimlar yaratish.

    Args:
        pre_matched: If provided, skip fuzzy matching and use these
                     items directly (from confirmation step).

    Returns:
        {
            "success": True/False,
            "sessiya_id": 123,
            "klient": "Xurshid Aka Qorĝoncha",
            "tovarlar_soni": 6,
            "jami_summa": Decimal("1101800"),
            "xatolar": ["Tovar topilmadi: XYZ"],
            "matched_items": [{nomi, miqdor, narx, jami}]
        }
    """
    result = {
        "success": False,
        "sessiya_id": None,
        "klient": None,
        "tovarlar_soni": 0,
        "jami_summa": Decimal("0"),
        "xatolar": [],
        "matched_items": [],
    }

    # 1. Find klient
    klient = fuzzy_match_klient(parsed["do'kon"], db_klientlar)
    if not klient:
        result["xatolar"].append(f"Klient topilmadi: '{parsed['do\'kon']}'")
        return result

    result["klient"] = klient["ism"]
    klient_id = klient["id"]

    # 2. Match tovarlar (or use pre-matched from confirmation)
    if pre_matched:
        matched = pre_matched
    else:
        matched = []
        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], db_tovarlar)
            if tv:
                narx = _to_decimal(tv.get("sotish_narxi"))
                miqdor = t["miqdor"]
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "miqdor": miqdor,
                    "narx": narx,
                    "jami": Decimal(str(miqdor)) * narx,
                    "birlik": tv.get("birlik", "dona"),
                    "kategoriya": tv.get("kategoriya", "Boshqa"),
                    "olish_narxi": _to_decimal(tv.get("olish_narxi")),
                })
            else:
                result["xatolar"].append(f"Tovar topilmadi: '{t['nomi']}'")

    if not matched:
        result["xatolar"].append("Birorta ham tovar mos kelmadi")
        return result

    # Ensure Decimal throughout
    for m in matched:
        m["narx"] = _to_decimal(m["narx"])
        m["olish_narxi"] = _to_decimal(m.get("olish_narxi"))
        m["jami"] = Decimal(str(m["miqdor"])) * m["narx"]

    jami = sum(m["jami"] for m in matched)

    # 3. Create sotuv_sessiya — ALL inside a transaction
    try:
        async with conn.transaction():
            # SET app.uid with parameterized query (no SQL injection)
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(uid))

            # 3a. Stock validation — check BEFORE writing
            for m in matched:
                current_qoldiq = await conn.fetchval(
                    "SELECT qoldiq FROM tovarlar WHERE id = $1 AND user_id = $2",
                    m["tovar_id"], uid,
                )
                if current_qoldiq is None:
                    result["xatolar"].append(f"Tovar topilmadi DB'da: {m['nomi']}")
                    return result
                if current_qoldiq < m["miqdor"]:
                    result["xatolar"].append(
                        f"Qoldiq yetarli emas: {m['nomi']} — "
                        f"kerak {m['miqdor']}, bor {current_qoldiq}"
                    )
                    return result

            sessiya_id = await conn.fetchval("""
                INSERT INTO sotuv_sessiyalar
                    (user_id, klient_id, klient_ismi, jami, tolangan, qarz, sana)
                VALUES ($1, $2, $3, $4, $4, 0, NOW())
                RETURNING id
            """, uid, klient_id, klient["ism"], jami)

            # 4. Create chiqimlar
            for m in matched:
                await conn.execute("""
                    INSERT INTO chiqimlar
                        (user_id, sessiya_id, klient_id, klient_ismi,
                         tovar_id, tovar_nomi, kategoriya, miqdor, birlik,
                         olish_narxi, sotish_narxi, narx, jami, sana)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, NOW())
                """,
                    uid, sessiya_id, klient_id, klient["ism"],
                    m["tovar_id"], m["nomi"], m["kategoriya"],
                    m["miqdor"], m["birlik"],
                    m["olish_narxi"], m["narx"], m["jami"],
                )

                # 5. Update qoldiq — atomic guard (WHERE qoldiq >= miqdor)
                rows_updated = await conn.execute("""
                    UPDATE tovarlar SET qoldiq = qoldiq - $1
                    WHERE id = $2 AND user_id = $3 AND qoldiq >= $1
                """, m["miqdor"], m["tovar_id"], uid)

                if rows_updated == "UPDATE 0":
                    raise RuntimeError(
                        f"Qoldiq yetarli emas (concurrent): {m['nomi']}"
                    )

        result["success"] = True
        result["sessiya_id"] = sessiya_id
        result["tovarlar_soni"] = len(matched)
        result["jami_summa"] = jami
        result["matched_items"] = matched

    except RuntimeError as e:
        result["xatolar"].append(str(e))
    except Exception as e:
        log.error("voice order create: %s", e)
        result["xatolar"].append(f"DB xato: {str(e)[:100]}")

    return result


# ════════════════════════════════════════════════════════════
#  GEMINI SMART PARSER — murakkab ovozlar uchun AI fallback
# ════════════════════════════════════════════════════════════

async def smart_parse_with_gemini(text: str, tovarlar_nomlari: list[str]) -> dict:
    """
    Agar oddiy regex parser ishlamasa — Gemini'dan yordam so'rash.

    Gemini'ga tovarlar ro'yxatini berish va matnni structured
    JSON ga parse qilishni so'rash. Bu murakkab gaplar uchun:
    "Xurshid akaga ikki dona Rosabella qizil bilan to'rtta Dollux
    keyin yana bitta Park ham qo'shib yuboring"

    Returns same shape as parse_order_text().
    """
    import os
    try:
        import google.generativeai as genai
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return parse_order_text(text)  # fallback to regex

        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""Sen savdo agenti uchun ovozli buyurtmalarni parse qiluvchi AI'san.

Quyidagi matnni tahlil qil va JSON formatda javob ber:
- "dokon": do'kon yoki klient nomi
- "tovarlar": [{{"nomi": "tovar nomi", "miqdor": son}}]

MUHIM: Faqat JSON qaytar, boshqa matn qo'shma.

Mavjud tovarlar ro'yxati (fuzzy match qil):
{chr(10).join(f'- {n}' for n in tovarlar_nomlari[:50])}

Matn: "{text}"
"""
        resp = model.generate_content(prompt)
        raw = resp.text.strip()

        # Extract JSON from response
        import json
        # Try to find JSON in response
        if raw.startswith("{"):
            data = json.loads(raw)
        elif "{" in raw:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            data = json.loads(raw[start:end])
        else:
            return parse_order_text(text)

        # Validate and sanitize Gemini output
        tovarlar_parsed = []
        for t in data.get("tovarlar", []):
            nomi = (t.get("nomi") or "").strip()
            if not nomi or len(nomi) < 2:
                continue
            try:
                miqdor = int(t.get("miqdor", 1))
            except (ValueError, TypeError):
                miqdor = 1
            # Bound quantity to sane range (1-9999)
            miqdor = max(1, min(miqdor, 9999))
            # Check nomi is plausible (exists in tovarlar list, fuzzy)
            nomi_lower = nomi.lower()
            has_match = any(
                nomi_lower in tn.lower() or tn.lower() in nomi_lower
                for tn in tovarlar_nomlari
            )
            if not has_match:
                # Still include but log — fuzzy_match_tovar will handle
                log.debug("gemini returned unknown tovar: %s", nomi)
            tovarlar_parsed.append({"nomi": nomi, "miqdor": miqdor})

        dokon = (data.get("dokon") or data.get("do'kon") or "").strip()

        return {
            "do'kon": dokon,
            "tovarlar": tovarlar_parsed,
            "xato": None if dokon and tovarlar_parsed else "Gemini parse natijasi bo'sh",
        }

    except Exception as e:
        log.warning("smart_parse_with_gemini: %s", e)
        return parse_order_text(text)  # fallback to regex
