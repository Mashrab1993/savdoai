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

    # If STILL no separator — try splitting before first number/qty word
    # "Jasur aka Kattaqo'rg'on benim katta 11 karobka..." →
    # do'kon = "Jasur aka Kattaqo'rg'on", tovarlar = "benim katta 11 karobka..."
    if not dokon:
        qty_pattern = re.search(
            r'\b(\d+)\s*(?:ta|dona|karobka|shtuk|sht|kg|pachka|quti|korobka|bl[oa]k)\b',
            text, re.IGNORECASE,
        )
        if qty_pattern:
            # Walk backwards from the number to find where product name starts
            before_qty = text[:qty_pattern.start()].strip()
            # The product name is the last 1-3 words before the number
            words_before = before_qty.split()
            if len(words_before) >= 3:
                # Try splitting: first 2+ words = do'kon, rest = tovar
                # Heuristic: do'kon usually has "aka/opa/brat" or is a known place name
                for split_at in range(2, min(len(words_before), 6)):
                    candidate_dokon = " ".join(words_before[:split_at])
                    candidate_rest = " ".join(words_before[split_at:])
                    # If candidate has "aka", "opa" or is capitalized — likely do'kon
                    has_honorific = any(
                        h in candidate_dokon.lower()
                        for h in ("aka", "opa", "brat", "uka", "xola", "amaki")
                    )
                    if has_honorific:
                        # Include 1 more word after honorific if it looks like a place name
                        # "Jasur aka Kattaqo'rg'on" → include Kattaqo'rg'on
                        if split_at < len(words_before):
                            next_word = words_before[split_at]
                            # If next word starts with uppercase and not a number → place name
                            if next_word[0].isupper() and not next_word[0].isdigit():
                                dokon = candidate_dokon + " " + next_word
                                tovar_text = " ".join(words_before[split_at + 1:]) + " " + text[qty_pattern.start():]
                                break
                        dokon = candidate_dokon
                        tovar_text = candidate_rest + " " + text[qty_pattern.start():]
                        break
                # Fallback: first 3 words = do'kon
                if not dokon and len(words_before) >= 4:
                    dokon = " ".join(words_before[:3])
                    tovar_text = " ".join(words_before[3:]) + " " + text[qty_pattern.start():]

    # Step 2: Tovarlarni ajratish
    tovarlar = []

    # Pre-step: if tovar_text has NO separators but has multiple "N karobka/ta/dona"
    # patterns, split by quantity pattern: "benim katta 11 karobka benim mayda 8 karobka"
    # → ["benim katta 11 karobka", "benim mayda 8 karobka"]
    if not any(sep in tovar_text for sep in [",", ".", "—", "–"]):
        # Insert commas after each "N karobka/ta/dona" pattern
        tovar_text = re.sub(
            r'(\d+\s*(?:karobka|ta|dona|shtuk|sht|kg|pachka|quti|korobka|blok))\s+(?=[a-zA-Z])',
            r'\1, ',
            tovar_text,
            flags=re.IGNORECASE,
        )

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
#  KIRIM TEXT PARSER — ovozdan kirim (tushum) ma'lumotlarini ajratish
# ════════════════════════════════════════════════════════════

def parse_kirim_text(text: str) -> dict:
    """
    Distributor ovozidan keyin Gemini STT bergan matnni parse qilish.
    KIRIM = zavoddan/yetkazuvchidan tovar kelishi.

    Input example:
        "Zavoddan Dollux 100 ta keldi, kirim narxi 69 ming, sotuv narxi 85 ming.
         Rosabella qizil 50 dona, kirimi 45 ming, sotishi 62 ming."

    Returns:
        {
            "yetkazuvchi": "Zavod",
            "tovarlar": [
                {"nomi": "Dollux", "miqdor": 100, "kirim_narxi": 69000, "sotish_narxi": 85000},
                {"nomi": "Rosabella qizil", "miqdor": 50, "kirim_narxi": 45000, "sotish_narxi": 62000},
            ],
            "xato": None
        }
    """
    text = text.strip()
    if not text:
        return {"yetkazuvchi": "", "tovarlar": [], "xato": "Bo'sh matn"}

    # O'zbek son nomlari → raqam (same as parse_order_text)
    SON_MAP = {
        "bir": 1, "bitta": 1, "ikki": 2, "ikkita": 2,
        "uch": 3, "uchta": 3, "to'rt": 4, "to'rtta": 4, "tort": 4,
        "besh": 5, "beshta": 5, "olti": 6, "oltita": 6,
        "yetti": 7, "yettita": 7, "sakkiz": 8, "sakkizta": 8,
        "to'qqiz": 9, "to'qqizta": 9, "o'n": 10, "o'nta": 10,
        "o'n bir": 11, "o'n ikki": 12, "o'n besh": 15,
        "yigirma": 20, "o'ttiz": 30, "qirq": 40, "ellik": 50,
        "yuz": 100, "ikki yuz": 200, "besh yuz": 500, "ming": 1000,
    }

    def _parse_narx(s: str) -> int | None:
        """
        O'zbek narx formatlarini parse qilish:
            "69 ming" → 69000
            "1.5 mln" → 1500000
            "45000" → 45000
            "69000 so'm" → 69000
            "ellik ming" → 50000
        """
        s = s.strip().lower()
        s = re.sub(r"\s*so'm\s*$", "", s)

        # "N.M mln" yoki "N mln"
        m = re.match(r'^([\d]+(?:[.,]\d+)?)\s*mln', s)
        if m:
            return int(float(m.group(1).replace(",", ".")) * 1_000_000)

        # "N.M ming" yoki "N ming"
        m = re.match(r'^([\d]+(?:[.,]\d+)?)\s*ming', s)
        if m:
            return int(float(m.group(1).replace(",", ".")) * 1_000)

        # Pure number: "45000", "69 000"
        digits = re.sub(r'\s+', '', s)
        if digits.isdigit():
            return int(digits)

        # O'zbek son + "ming": "ellik ming", "yuz ming"
        for word, num in sorted(SON_MAP.items(), key=lambda x: -len(x[0])):
            pat = rf'^{re.escape(word)}\s+ming'
            if re.match(pat, s):
                return num * 1000

        # Single O'zbek number word (as price, rare but possible)
        for word, num in sorted(SON_MAP.items(), key=lambda x: -len(x[0])):
            if s == word:
                return num

        return None

    # Step 1: Yetkazuvchi (supplier) nomini ajratish
    # Patterns: "Zavoddan ...", "Coca-Cola kompaniyasidan ..."
    yetkazuvchi = ""
    work_text = text

    m_supplier = re.match(
        r'^(.+?)\s*(?:dan|kompaniyasidan|fabrikasidan)\s+',
        text, re.IGNORECASE,
    )
    if m_supplier:
        yetkazuvchi = m_supplier.group(1).strip()
        work_text = text[m_supplier.end():].strip()

    # Step 2: Tovar bloklarini ajratish
    # Split by period (but NOT decimal dot like "1.5"), "keyin", "yana"
    items_raw = re.split(r'(?<!\d)\.(?!\d)|\bkeyin\b|\byana\b', work_text)

    # Expand comma splits
    expanded = []
    for chunk in items_raw:
        parts = re.split(r',\s*(?=[A-ZА-ЯЎҚҒҲa-zа-яўқғҳ])', chunk)
        expanded.extend(parts)
    items_raw = expanded

    # Step 3: Parse each item block for nomi, miqdor, kirim_narxi, sotish_narxi
    tovarlar = []

    # Regex for quantity: "100 ta keldi", "50 dona", etc.
    QTY_RE = re.compile(
        r'(\d+)\s*(?:ta|dona|karobka|shtuk|sht|kg|kilogramm?|pachka|quti|korobka|bl[oa]k)?\s*'
        r'(?:keldi|kelgan|tushdi|tushgan)?',
        re.IGNORECASE,
    )

    # Regex for prices — captures "kirim narxi 69 ming" style
    KIRIM_NARX_RE = re.compile(
        r'(?:kirim\s*(?:narxi|narx)|kirimi|olish\s*narxi|olish)\s*'
        r'([\d\s.,]+(?:\s*(?:ming|mln|so\'m))?)',
        re.IGNORECASE,
    )
    SOTISH_NARX_RE = re.compile(
        r'(?:sot(?:ish|uv)\s*narxi|sotishi|sotish)\s*'
        r'([\d\s.,]+(?:\s*(?:ming|mln|so\'m))?)',
        re.IGNORECASE,
    )

    # We may get items split across multiple comma-segments.
    # Strategy: accumulate per-item. A new item starts when we see
    # a new product name + quantity. Price segments attach to the
    # most recent item.

    pending_item = None  # {"nomi": ..., "miqdor": ..., ...}

    for chunk in items_raw:
        chunk = chunk.strip()
        if not chunk or len(chunk) < 3:
            continue

        # Sub-split by comma for intra-item price segments
        sub_parts = re.split(r',\s*', chunk)

        for part in sub_parts:
            part = part.strip()
            if not part:
                continue

            # Check if this part is a price segment (no product name)
            kirim_m = KIRIM_NARX_RE.search(part)
            sotish_m = SOTISH_NARX_RE.search(part)

            if kirim_m and pending_item:
                narx = _parse_narx(kirim_m.group(1))
                if narx:
                    pending_item["kirim_narxi"] = narx

            if sotish_m and pending_item:
                narx = _parse_narx(sotish_m.group(1))
                if narx:
                    pending_item["sotish_narxi"] = narx

            # If we already got prices, skip further name parsing
            if kirim_m or sotish_m:
                continue

            # Try to parse as a new item (name + quantity)
            qty_m = QTY_RE.search(part)
            if qty_m:
                # Save previous pending item
                if pending_item and pending_item.get("nomi"):
                    tovarlar.append(pending_item)

                miqdor = int(qty_m.group(1))
                nomi = part[:qty_m.start()].strip()

                # Clean up name
                nomi = re.sub(r'\s+', ' ', nomi).strip()
                nomi = re.sub(r'\s+(dan|lik|ning|ga|ni)$', '', nomi, flags=re.IGNORECASE)

                if nomi and len(nomi) >= 2:
                    pending_item = {
                        "nomi": nomi,
                        "miqdor": miqdor,
                        "kirim_narxi": 0,
                        "sotish_narxi": 0,
                    }
                else:
                    pending_item = None
            else:
                # Try O'zbek son nomlari for quantity
                found_son = False
                for word, num in sorted(SON_MAP.items(), key=lambda x: -len(x[0])):
                    pattern = (
                        rf'\b{re.escape(word)}\b\s*'
                        r'(?:ta|dona|karobka|shtuk|kg|kilogramm?)?\s*'
                        r'(?:keldi|kelgan|tushdi|tushgan)?'
                    )
                    m2 = re.search(pattern, part, re.IGNORECASE)
                    if m2:
                        if pending_item and pending_item.get("nomi"):
                            tovarlar.append(pending_item)

                        nomi = part[:m2.start()].strip()
                        nomi = re.sub(r'\s+', ' ', nomi).strip()
                        nomi = re.sub(r'\s+(dan|lik|ning|ga|ni)$', '', nomi, flags=re.IGNORECASE)

                        if nomi and len(nomi) >= 2:
                            pending_item = {
                                "nomi": nomi,
                                "miqdor": num,
                                "kirim_narxi": 0,
                                "sotish_narxi": 0,
                            }
                        else:
                            pending_item = None
                        found_son = True
                        break

                if not found_son:
                    # This part might just be a product name without qty yet
                    # or noise — skip
                    pass

    # Don't forget the last pending item
    if pending_item and pending_item.get("nomi"):
        tovarlar.append(pending_item)

    return {
        "yetkazuvchi": yetkazuvchi,
        "tovarlar": tovarlar,
        "xato": None if tovarlar else "Tovarlar aniqlanmadi",
    }


# ════════════════════════════════════════════════════════════
#  KIRIM CREATION — DB'da kirim yozuvlari yaratish
# ════════════════════════════════════════════════════════════

async def create_kirim_from_voice(
    conn,
    uid: int,
    parsed: dict,
    db_tovarlar: list[dict],
    *,
    pre_matched: list[dict] | None = None,
) -> dict:
    """
    Parse qilingan kirim matnidan kirimlar yozuvlari yaratish
    va tovarlar qoldiqlarini oshirish.

    Args:
        conn: asyncpg connection
        uid: user_id
        parsed: parse_kirim_text() natijasi
        db_tovarlar: DB'dagi barcha tovarlar
        pre_matched: Agar tasdiqlash bosqichidan kelsa, tayyor items

    Returns:
        {
            "success": True/False,
            "kirim_ids": [1, 2, ...],
            "yetkazuvchi": "Zavod",
            "tovarlar_soni": 2,
            "jami_summa": Decimal("11850000"),
            "xatolar": [...],
            "matched_items": [{nomi, miqdor, kirim_narxi, sotish_narxi, jami}]
        }
    """
    result = {
        "success": False,
        "kirim_ids": [],
        "yetkazuvchi": parsed.get("yetkazuvchi", ""),
        "tovarlar_soni": 0,
        "jami_summa": Decimal("0"),
        "xatolar": [],
        "matched_items": [],
    }

    # 1. Match tovarlar (or use pre-matched from confirmation)
    if pre_matched:
        matched = pre_matched
    else:
        matched = []
        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], db_tovarlar)
            if tv:
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "miqdor": t["miqdor"],
                    "kirim_narxi": _to_decimal(t.get("kirim_narxi")),
                    "sotish_narxi": _to_decimal(t.get("sotish_narxi")),
                    "birlik": tv.get("birlik", "dona"),
                    "kategoriya": tv.get("kategoriya", "Boshqa"),
                })
            else:
                result["xatolar"].append(f"Tovar topilmadi: '{t['nomi']}'")

    if not matched:
        result["xatolar"].append("Birorta ham tovar mos kelmadi")
        return result

    # Ensure Decimal throughout
    for m in matched:
        m["kirim_narxi"] = _to_decimal(m["kirim_narxi"])
        m["sotish_narxi"] = _to_decimal(m["sotish_narxi"])
        m["jami"] = Decimal(str(m["miqdor"])) * m["kirim_narxi"]

    jami = sum(m["jami"] for m in matched)
    manba = parsed.get("yetkazuvchi") or "Ovozli kirim"

    # 2. Create kirimlar records — ALL inside a transaction
    try:
        async with conn.transaction():
            # SET app.uid with parameterized query (no SQL injection)
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(uid))

            kirim_ids = []
            for m in matched:
                # 2a. INSERT kirim record
                kirim_id = await conn.fetchval("""
                    INSERT INTO kirimlar
                        (user_id, tovar_id, tovar_nomi, kategoriya,
                         miqdor, birlik, narx, jami, manba, izoh, sana)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                    RETURNING id
                """,
                    uid, m["tovar_id"], m["nomi"], m["kategoriya"],
                    Decimal(str(m["miqdor"])), m["birlik"],
                    m["kirim_narxi"], m["jami"],
                    manba, "Ovozli kirim orqali",
                )
                kirim_ids.append(kirim_id)

                # 2b. UPDATE tovar: qoldiq += miqdor, olish_narxi, sotish_narxi
                update_parts = ["qoldiq = qoldiq + $1"]
                update_params: list = [Decimal(str(m["miqdor"])), m["tovar_id"], uid]

                if m["kirim_narxi"] > 0:
                    update_parts.append(f"olish_narxi = ${len(update_params) + 1}")
                    update_params.append(m["kirim_narxi"])

                if m["sotish_narxi"] > 0:
                    update_parts.append(f"sotish_narxi = ${len(update_params) + 1}")
                    update_params.append(m["sotish_narxi"])

                await conn.execute(
                    f"UPDATE tovarlar SET {', '.join(update_parts)} "
                    f"WHERE id = $2 AND user_id = $3",
                    *update_params,
                )

        result["success"] = True
        result["kirim_ids"] = kirim_ids
        result["tovarlar_soni"] = len(matched)
        result["jami_summa"] = jami
        result["matched_items"] = matched

    except Exception as e:
        log.error("voice kirim create: %s", e)
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
        model = genai.GenerativeModel("gemini-3-flash-preview")

        prompt = f"""Sen savdo agenti uchun ovozli buyurtmalarni parse qiluvchi AI'san.

Quyidagi matnni tahlil qil va JSON formatda javob ber:
- "dokon": do'kon yoki klient nomi (BIRINCHI aytilgan ism — ajratuvchi belgi bo'lmasligi mumkin)
- "tovarlar": [{{"nomi": "tovar nomi", "miqdor": son}}]

MUHIM QOIDALAR:
1. Faqat JSON qaytar, boshqa matn qo'shma
2. Matn boshidagi ism — bu DO'KON nomi (klient ismi)
3. Agar ajratuvchi belgi (—, -, .) yo'q bo'lsa ham, birinchi ismni do'kon deb ol
4. "aka", "opa", "uka" + shahar nomi = do'kon nomi
5. Masalan: "Jasur aka Kattaqo'rg'on benim katta 11 karobka" → dokon = "Jasur aka Kattaqo'rg'on"

Mavjud tovarlar ro'yxati:
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


# ════════════════════════════════════════════════════════════
#  GEMINI SMART KIRIM PARSER — murakkab ovozli kirimlar uchun
# ════════════════════════════════════════════════════════════

async def smart_parse_kirim_with_gemini(text: str, tovarlar_nomlari: list[str]) -> dict:
    """
    Agar oddiy regex parser ishlamasa — Gemini'dan kirim uchun yordam.

    Gemini'ga tovarlar ro'yxatini berish va kirim matnini structured
    JSON ga parse qilishni so'rash. Bu murakkab gaplar uchun:
    "Zavoddan Dollux yuzta keldi kirimi oltmish to'qqiz ming sotishi
    sakson besh ming keyin yana Rosabella qizil elliktasini kirimi
    qirq besh mingdan sotishi oltmish ikki mingdan qo'shing"

    Returns same shape as parse_kirim_text().
    """
    import os
    try:
        import google.generativeai as genai
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return parse_kirim_text(text)  # fallback to regex

        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-3-flash-preview")

        prompt = f"""Sen distributor uchun ovozli KIRIM (tovar tushumi) ma'lumotlarini parse qiluvchi AI'san.

Kirim = zavoddan/yetkazuvchidan tovar kelishi. Har bir tovar uchun MIQDOR, KIRIM NARXI (olish), SOTISH NARXI bo'lishi mumkin.

Quyidagi matnni tahlil qil va JSON formatda javob ber:
- "yetkazuvchi": yetkazuvchi/zavod nomi (agar aytilgan bo'lsa, aks holda "")
- "tovarlar": [{{"nomi": "tovar nomi", "miqdor": son, "kirim_narxi": son, "sotish_narxi": son}}]

MUHIM:
- Narxlar SO'M da bo'lsin (69 ming = 69000, 1.5 mln = 1500000)
- Agar narx aytilmagan bo'lsa, 0 qo'y
- Faqat JSON qaytar, boshqa matn qo'shma

Mavjud tovarlar ro'yxati (fuzzy match qil):
{chr(10).join(f'- {n}' for n in tovarlar_nomlari[:50])}

Matn: "{text}"
"""
        resp = model.generate_content(prompt)
        raw = resp.text.strip()

        # Extract JSON from response
        import json
        if raw.startswith("{"):
            data = json.loads(raw)
        elif "{" in raw:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            data = json.loads(raw[start:end])
        else:
            return parse_kirim_text(text)

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
            miqdor = max(1, min(miqdor, 99999))

            try:
                kirim_narxi = int(t.get("kirim_narxi", 0))
            except (ValueError, TypeError):
                kirim_narxi = 0

            try:
                sotish_narxi = int(t.get("sotish_narxi", 0))
            except (ValueError, TypeError):
                sotish_narxi = 0

            # Check nomi is plausible
            nomi_lower = nomi.lower()
            has_match = any(
                nomi_lower in tn.lower() or tn.lower() in nomi_lower
                for tn in tovarlar_nomlari
            )
            if not has_match:
                log.debug("gemini kirim: unknown tovar: %s", nomi)

            tovarlar_parsed.append({
                "nomi": nomi,
                "miqdor": miqdor,
                "kirim_narxi": kirim_narxi,
                "sotish_narxi": sotish_narxi,
            })

        yetkazuvchi = (data.get("yetkazuvchi") or "").strip()

        return {
            "yetkazuvchi": yetkazuvchi,
            "tovarlar": tovarlar_parsed,
            "xato": None if tovarlar_parsed else "Gemini kirim parse natijasi bo'sh",
        }

    except Exception as e:
        log.warning("smart_parse_kirim_with_gemini: %s", e)
        return parse_kirim_text(text)  # fallback to regex


# ════════════════════════════════════════════════════════════
#  KLIENT PARSER — ovozdan yangi klient ma'lumotlarini ajratish
# ════════════════════════════════════════════════════════════

def parse_klient_text(text: str) -> dict:
    """
    Ovozdan klient ma'lumotlarini ajratish.

    Input examples:
        "Yangi klient Jasur Aka Katakurgon, telefoni 91 542 76 43, Samarqanddan"
        "Klient qo'sh: Anvar Toshkent 90 123 45 67 kredit limit 50 million"
        "Jasur Aka, telefon 915427643, manzil Samarqand, kredit 500 million"

    Returns:
        {
            "ism": "Jasur Aka Katakurgon",
            "telefon": "+998915427643",
            "manzil": "Samarqand",
            "kredit_limit": 500000000,
            "xato": None
        }
    """
    text = text.strip()
    if not text:
        return {"ism": "", "telefon": "", "manzil": "", "kredit_limit": 0, "xato": "Bo'sh matn"}

    # Remove common prefixes
    text_clean = re.sub(
        r'^(?:yangi\s+)?(?:klient|mijoz|do\'kon)\s*(?:qo\'sh|qo\'shish|yaratish)?\s*[:\-—.]?\s*',
        '', text, flags=re.IGNORECASE,
    ).strip() or text

    # ── Extract phone number ──
    telefon = ""
    # Patterns: +998 91 542 76 43, 998915427643, 91 542 76 43, 915427643
    # Also: "95 lik 259 99 00" (O'zbek format: XX lik XXX XX XX)
    phone_patterns = [
        r'\+?998\s*[\-]?\s*(\d{2})\s*[\-]?\s*(\d{3})\s*[\-]?\s*(\d{2})\s*[\-]?\s*(\d{2})',
        r'(?:telefon[ia]?\s*(?:raqam[ia]?)?\s*[:=]?\s*)(\d{2})\s*[\-]?\s*(\d{3})\s*[\-]?\s*(\d{2})\s*[\-]?\s*(\d{2})',
        r'(\d{2})\s*lik\s*(\d{3})\s+(\d{2})\s+(\d{2})',  # "95 lik 259 99 00"
        r'\b(\d{2})\s+(\d{3})\s+(\d{2})\s+(\d{2})\b',
        r'\b(\d{9})\b',
    ]
    for pat in phone_patterns:
        m = re.search(pat, text_clean)
        if m:
            groups = m.groups()
            if len(groups) == 1 and len(groups[0]) == 9:
                digits = groups[0]
            else:
                digits = ''.join(groups)
            if len(digits) == 9 and digits[0] in '3456789':
                telefon = f"+998{digits}"
                # Remove phone from text for name extraction
                text_clean = text_clean[:m.start()] + text_clean[m.end():]
                break

    # ── Extract kredit limit ──
    kredit_limit = 0
    kredit_patterns = [
        (r'kredit\s*(?:limit[ia]?)?\s*[:=]?\s*([\d.,]+)\s*(?:mln|million|milli[oa]n)', 1_000_000),
        (r'kredit\s*(?:limit[ia]?)?\s*[:=]?\s*([\d.,]+)\s*(?:mlrd|milliard)', 1_000_000_000),
        (r'kredit\s*(?:limit[ia]?)?\s*[:=]?\s*([\d.,]+)\s*ming', 1_000),
        (r'kredit\s*(?:limit[ia]?)?\s*[:=]?\s*([\d\s.,]+)', 1),
        (r'limit\s*[:=]?\s*([\d.,]+)\s*(?:mln|million|milli[oa]n)', 1_000_000),
        (r'limit\s*[:=]?\s*([\d.,]+)\s*ming', 1_000),
    ]
    for pat, mult in kredit_patterns:
        m = re.search(pat, text_clean, re.IGNORECASE)
        if m:
            try:
                val = float(m.group(1).replace(',', '.').replace(' ', ''))
                kredit_limit = int(val * mult)
                text_clean = text_clean[:m.start()] + text_clean[m.end():]
                break
            except (ValueError, TypeError):
                pass

    # ── Extract manzil (address) ──
    manzil = ""
    # Patterns: "Samarqanddan", "manzil Samarqand", "manzili Toshkent"
    manzil_patterns = [
        r'(?:manzil[ia]?\s*[:=]?\s*)([A-ZА-ЯЎҚҒҲa-zа-яўқғҳ\s]+?)(?:\s*[,.]|\s*kredit|\s*telefon|\s*$)',
        r'(?:shahar[ia]?\s*[:=]?\s*)([A-ZА-ЯЎҚҒҲa-zа-яўқғҳ\s]+?)(?:\s*[,.]|\s*kredit|\s*telefon|\s*$)',
        r'([A-ZА-ЯЎҚҒҲa-zа-яўқғҳ]+)(?:dan|lik)\b',
    ]
    for pat in manzil_patterns:
        m = re.search(pat, text_clean, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            # Known cities/regions
            known = {"samarqand", "toshkent", "buxoro", "andijon", "farg'ona", "namangan",
                     "qashqadaryo", "surxondaryo", "jizzax", "sirdaryo", "navoiy", "xorazm",
                     "nukus", "qarshi", "termiz", "kokand", "marg'ilon", "katakurgon",
                     "urgench", "guliston", "denov", "shahrisabz", "urgut", "kattaqo'rg'on"}
            clean = re.sub(r'(?:dan|lik)$', '', candidate, flags=re.IGNORECASE).strip()
            if clean.lower() in known or len(clean) > 3:
                manzil = clean
                text_clean = text_clean[:m.start()] + text_clean[m.end():]
                break

    # ── Extract name (what's left) ──
    # Remove noise words
    text_clean = re.sub(
        r'\b(?:telefon[ia]?\s*(?:raqam)?\s*[:=]?|manzil[ia]?\s*[:=]?|kredit\s*limit[ia]?\s*[:=]?|yangi|klient|mijoz|qo\'sh)\b',
        '', text_clean, flags=re.IGNORECASE,
    )
    # Clean up
    ism = re.sub(r'[,.:;\-—]+', ' ', text_clean).strip()
    ism = re.sub(r'\s+', ' ', ism).strip()
    # Remove trailing/leading noise
    ism = re.sub(r'^\s*(?:dan|ga|ning|ni)\s+', '', ism, flags=re.IGNORECASE).strip()
    ism = re.sub(r'\s+(?:dan|ga|ning|ni)\s*$', '', ism, flags=re.IGNORECASE).strip()

    return {
        "ism": ism,
        "telefon": telefon,
        "manzil": manzil,
        "kredit_limit": kredit_limit,
        "xato": None if ism else "Klient ismi aniqlanmadi",
    }


# ════════════════════════════════════════════════════════════
#  NARX PARSER — ovozdan tovar narxlarini ajratish
# ════════════════════════════════════════════════════════════

def parse_narx_text(text: str) -> dict:
    """
    Ovozdan tovar narxlarini ajratish.

    Input examples:
        "Dollux sotish narxi 85 ming, Rozabella arzon 98 ming"
        "Narx o'rnat: Dollux 85000, Rozabella qimmat 115 ming"
        "Dollux 85 mingdan, Rozabella arzon 98 mingdan sotamiz"

    Returns:
        {
            "tovarlar": [
                {"nomi": "Dollux", "sotish_narxi": 85000},
                {"nomi": "Rozabella arzon", "sotish_narxi": 98000},
            ],
            "xato": None
        }
    """
    text = text.strip()
    if not text:
        return {"tovarlar": [], "xato": "Bo'sh matn"}

    # Remove prefix — including "sotish narxi" at the start
    text_clean = re.sub(
        r'^(?:narx\s*(?:o\'rnat|qo\'y|belgilab?|yangilab?)\s*[:\-—.]?\s*)',
        '', text, flags=re.IGNORECASE,
    ).strip() or text
    text_clean = re.sub(
        r'^(?:sotish\s*narxi?\s*[:\-—.]?\s*)',
        '', text_clean, flags=re.IGNORECASE,
    ).strip() or text_clean

    def _parse_price(s: str) -> int:
        """Parse price: 85 ming → 85000, 1.5 mln → 1500000, 85000 → 85000"""
        s = s.strip().lower()
        s = re.sub(r"\s*so'm\s*$", "", s)
        s = re.sub(r"\s*dan\s*$", "", s)
        m = re.match(r'^([\d]+(?:[.,]\d+)?)\s*mln', s)
        if m:
            return int(float(m.group(1).replace(",", ".")) * 1_000_000)
        m = re.match(r'^([\d]+(?:[.,]\d+)?)\s*ming', s)
        if m:
            return int(float(m.group(1).replace(",", ".")) * 1_000)
        digits = re.sub(r'\s+', '', s)
        if digits.isdigit():
            return int(digits)
        return 0

    # Split by comma, period, "keyin", "yana"
    items_raw = re.split(r'[,.]|\bkeyin\b|\byana\b', text_clean)

    tovarlar = []
    for item in items_raw:
        item = item.strip()
        if not item or len(item) < 3:
            continue

        # Pattern: "TOVAR_NOMI sotish narxi NARX" or "TOVAR_NOMI NARX mingdan"
        # or just "TOVAR_NOMI NARX ming"
        narx_match = re.search(
            r'(?:sotish\s*narxi?|narxi?|sotishi)\s*([\d\s.,]+(?:\s*(?:ming|mln|so\'m))?)',
            item, re.IGNORECASE,
        )

        if narx_match:
            narx = _parse_price(narx_match.group(1))
            nomi = item[:narx_match.start()].strip()
        else:
            # Try: "TOVAR NARX mingdan" or "TOVAR NARX" or "TOVAR 65 000"
            m = re.search(r'([\d][\d\s.,]*(?:\s*(?:ming|mln))?)\s*(?:dan|ga|so\'m)?\s*$', item, re.IGNORECASE)
            if m:
                narx = _parse_price(m.group(1))
                nomi = item[:m.start()].strip()
            else:
                continue

        # Clean name
        nomi = re.sub(r'\s+', ' ', nomi).strip()
        nomi = re.sub(r'\s+(dan|lik|ning|ga|ni|sotish|narx)$', '', nomi, flags=re.IGNORECASE)

        if nomi and len(nomi) >= 2 and narx > 0:
            tovarlar.append({"nomi": nomi, "sotish_narxi": narx})

    return {
        "tovarlar": tovarlar,
        "xato": None if tovarlar else "Tovar yoki narx aniqlanmadi",
    }
