"""
╔══════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 — FUZZY MATCH ENGINE                          ║
║                                                                      ║
║  Aqlli qidiruv — operator noto'g'ri yozsa ham topadi:               ║
║  ✅ "Ariyal" → "Ariel" (1 harf farq)                                ║
║  ✅ "Салимов" → "Salimov" (Kirill→Lotin)                            ║
║  ✅ "un" → "Un 1-sort" (partial match)                              ║
║  ✅ "fairy" → "Fairy 500ml" (substring)                             ║
║  ✅ Trigram similarity scoring                                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
from shared.utils import like_escape
import re
import logging
from typing import Optional

log = logging.getLogger(__name__)

# ═══ KIRILL → LOTIN TRANSLITERATSIYA ═══
_CYR_TO_LAT = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'i','ь':'','э':'e','ю':'yu','я':'ya',
}

def normalize(text: str) -> str:
    """Matnni normalizatsiya — kichik harf, kirill→lotin, ortiqcha bo'shliq"""
    if not text:
        return ""
    t = text.lower().strip()
    # Kirill → Lotin
    result = []
    for ch in t:
        if ch in _CYR_TO_LAT:
            result.append(_CYR_TO_LAT[ch])
        elif '\u0400' <= ch <= '\u04ff':
            result.append(ch)  # noma'lum kirill — saqlab qo'yamiz
        else:
            result.append(ch)
    t = "".join(result)
    # Ortiqcha bo'shliq va maxsus belgilar
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def _trigrams(text: str) -> set:
    """Matndan trigram to'plami"""
    t = f"  {text} "
    return {t[i:i+3] for i in range(len(t) - 2)}


def similarity(a: str, b: str) -> float:
    """
    Ikki matn orasidagi o'xshashlik (0.0 - 1.0).
    Trigram + substring bonus.
    """
    na = normalize(a)
    nb = normalize(b)
    if not na or not nb:
        return 0.0
    # Exact match
    if na == nb:
        return 1.0
    # Substring bonus
    if na in nb or nb in na:
        shorter = min(len(na), len(nb))
        longer = max(len(na), len(nb))
        return 0.7 + 0.3 * (shorter / longer)
    # Trigram similarity
    ta = _trigrams(na)
    tb = _trigrams(nb)
    if not ta or not tb:
        return 0.0
    intersection = len(ta & tb)
    union = len(ta | tb)
    return intersection / union if union > 0 else 0.0


async def fuzzy_klient_top(conn, uid: int, ism: str, limit: int = 5) -> list:
    """
    Klientni fuzzy qidirish — noto'g'ri yozilgan ismni ham topadi.
    
    1. Exact match (100%)
    2. ILIKE partial (%ism%)
    3. Trigram similarity (Python)
    
    Qaytaradi: [(record, score), ...] eng yaxshi matchlar
    """
    ism_n = normalize(ism)
    if not ism_n:
        return []
    
    # DB dan kandidatlar olish (keng filter)
    rows = await conn.fetch("""
        SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan FROM klientlar
        WHERE user_id = $1
          AND (lower(ism) LIKE lower($2) OR lower(ism) LIKE $3)
        ORDER BY jami_sotib DESC
        LIMIT 20
    """, uid, f"%{like_escape(ism.strip())}%", f"%{like_escape(ism_n)}%")
    
    if not rows:
        # Barcha klientlardan qidirish (oxirgi 100)
        rows = await conn.fetch("""
            SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan FROM klientlar
            WHERE user_id = $1
            ORDER BY jami_sotib DESC LIMIT 100
        """, uid)
    
    # Similarity scoring
    scored = []
    for r in rows:
        score = similarity(ism, r["ism"])
        if score >= 0.3:  # minimum threshold
            scored.append((r, score))
    
    # Sort by score
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


async def fuzzy_tovar_top(conn, uid: int, nomi: str, limit: int = 5) -> list:
    """
    Tovarni fuzzy qidirish.
    
    1. Exact match
    2. ILIKE partial
    3. Trigram similarity
    """
    nomi_n = normalize(nomi)
    if not nomi_n:
        return []
    
    rows = await conn.fetch("""
        SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan FROM tovarlar
        WHERE user_id = $1
          AND (lower(nomi) LIKE lower($2) OR lower(nomi) LIKE $3)
        ORDER BY qoldiq DESC
        LIMIT 20
    """, uid, f"%{like_escape(nomi.strip())}%", f"%{like_escape(nomi_n)}%")
    
    if not rows:
        rows = await conn.fetch("""
            SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan FROM tovarlar
            WHERE user_id = $1
            ORDER BY qoldiq DESC LIMIT 100
        """, uid)
    
    scored = []
    for r in rows:
        score = similarity(nomi, r["nomi"])
        if score >= 0.3:
            scored.append((r, score))
    
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:limit]


def best_match(candidates: list, threshold: float = 0.6):
    """
    Eng yaxshi matchni tanlash.
    
    Qaytaradi: (record, score) yoki (None, 0) agar topilmasa
    """
    if not candidates:
        return None, 0.0
    best_record, best_score = candidates[0]
    if best_score >= threshold:
        return best_record, best_score
    return None, best_score
