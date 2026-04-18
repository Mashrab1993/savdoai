"""
╔══════════════════════════════════════════════════════════╗
║  SavdoAI v24.0 — SMART NARX TIZIMI                      ║
║  3 qatlam narx aniqlash:                                 ║
║    1. Klient shaxsiy narx (eng yuqori)                   ║
║    2. Klient guruh narxi                                 ║
║    3. Oxirgi sotuv narxi                                 ║
║    4. Tovar default narxi (eng past)                     ║
╚══════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal
from typing import Optional

from shared.utils import like_escape

log = logging.getLogger(__name__)


async def narx_aniqla(conn, uid: int, klient_id: int | None, tovar_id: int) -> dict:
    """
    Klient + tovar uchun narxni 4 qatlamdan aniqlaydi.
    
    Qaytaradi:
    {
        "narx": Decimal,
        "manba": "shaxsiy" | "guruh" | "oxirgi" | "default",
        "guruh_nomi": str | None,
    }
    """
    # 1. SHAXSIY NARX (eng yuqori prioritet)
    if klient_id:
        row = await conn.fetchrow("""
            SELECT narx FROM klient_narxlar
            WHERE klient_id = $1 AND tovar_id = $2
        """, klient_id, tovar_id)
        if row and row["narx"] > 0:
            log.debug("Narx: shaxsiy %s (klient=%d tovar=%d)", row["narx"], klient_id, tovar_id)
            return {"narx": row["narx"], "manba": "shaxsiy", "guruh_nomi": None}

    # 2. GURUH NARXI
    if klient_id:
        row = await conn.fetchrow("""
            SELECT gn.narx, ng.nomi as guruh_nomi
            FROM klientlar k
            JOIN narx_guruhlari ng ON ng.id = k.narx_guruh_id
            JOIN guruh_narxlar gn ON gn.guruh_id = ng.id AND gn.tovar_id = $2
            WHERE k.id = $1 AND k.narx_guruh_id IS NOT NULL
        """, klient_id, tovar_id)
        if row and row["narx"] > 0:
            log.debug("Narx: guruh '%s' %s (klient=%d tovar=%d)", 
                      row["guruh_nomi"], row["narx"], klient_id, tovar_id)
            return {"narx": row["narx"], "manba": "guruh", "guruh_nomi": row["guruh_nomi"]}

    # 3. OXIRGI SOTUV NARXI
    if klient_id:
        row = await conn.fetchrow("""
            SELECT c.sotish_narxi AS narx FROM chiqimlar c
            JOIN sotuv_sessiyalar s ON s.id = c.sessiya_id
            WHERE s.klient_id = $1 AND c.tovar_id = $2 AND c.sotish_narxi > 0
            ORDER BY c.id DESC LIMIT 1
        """, klient_id, tovar_id)
        if row and row["narx"] > 0:
            log.debug("Narx: oxirgi sotuv %s (klient=%d tovar=%d)", row["narx"], klient_id, tovar_id)
            return {"narx": row["narx"], "manba": "oxirgi", "guruh_nomi": None}

    # 4. TOVAR DEFAULT NARXI
    row = await conn.fetchrow("""
        SELECT sotish_narxi FROM tovarlar WHERE id = $1
    """, tovar_id)
    narx = row["sotish_narxi"] if row else Decimal("0")
    log.debug("Narx: default %s (tovar=%d)", narx, tovar_id)
    return {"narx": narx, "manba": "default", "guruh_nomi": None}


async def narx_aniqla_nomi(conn, uid: int, klient_ismi: str | None, tovar_nomi: str) -> dict:
    """
    Ism/nom bo'yicha narx aniqlash (AI dan kelgan matn uchun).
    Avval klient va tovar ID topadi, keyin narx_aniqla chaqiradi.
    """
    klient_id = None
    tovar_id = None
    
    # Klient topish
    if klient_ismi:
        row = await conn.fetchrow("""
            SELECT id FROM klientlar WHERE user_id = $2 AND LOWER(ism) = LOWER($1) LIMIT 1
        """, klient_ismi.strip(), uid)
        if row:
            klient_id = row["id"]
    
    # Tovar topish (fuzzy)
    row = await conn.fetchrow("""
        SELECT id FROM tovarlar WHERE user_id = $2 AND LOWER(nomi) = LOWER($1) LIMIT 1
    """, tovar_nomi.strip(), uid)
    if row:
        tovar_id = row["id"]
    
    if not tovar_id:
        # Fuzzy search
        row = await conn.fetchrow("""
            SELECT id FROM tovarlar 
            WHERE user_id = $2 AND LOWER(nomi) LIKE LOWER($1) 
            LIMIT 1
        """, f"%{like_escape(tovar_nomi.strip())}%", uid)
        if row:
            tovar_id = row["id"]
    
    if not tovar_id:
        return {"narx": Decimal("0"), "manba": "topilmadi", "guruh_nomi": None}
    
    return await narx_aniqla(conn, uid, klient_id, tovar_id)


# ═══════════════════════════════════════
#  CRUD — Narx guruhlari
# ═══════════════════════════════════════

async def guruh_yaratish(conn, uid: int, nomi: str, izoh: str = "") -> int:
    """Yangi narx guruhi yaratish. Qaytaradi: guruh ID"""
    row = await conn.fetchrow("""
        INSERT INTO narx_guruhlari (user_id, nomi, izoh)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, nomi) DO UPDATE SET izoh = $3
        RETURNING id
    """, uid, nomi, izoh)
    return row["id"]


async def guruh_narx_qoyish(conn, uid: int, guruh_id: int, tovar_id: int, narx: Decimal) -> None:
    """Guruhga tovar narxi qo'yish"""
    await conn.execute("""
        INSERT INTO guruh_narxlar (user_id, guruh_id, tovar_id, narx, yangilangan)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (guruh_id, tovar_id) DO UPDATE SET narx = $4, yangilangan = NOW()
    """, uid, guruh_id, tovar_id, narx)


async def klient_guruhga_qoyish(conn, uid: int, klient_id: int, guruh_id: int) -> None:
    """Klientni guruhga biriktirish"""
    await conn.execute("""
        UPDATE klientlar SET narx_guruh_id = $1 WHERE id = $2 AND user_id = $3
    """, guruh_id, klient_id, uid)


# ═══════════════════════════════════════
#  CRUD — Klient shaxsiy narxlar
# ═══════════════════════════════════════

async def shaxsiy_narx_qoyish(conn, uid: int, klient_id: int, tovar_id: int, narx: Decimal) -> None:
    """Klientga shaxsiy narx qo'yish"""
    await conn.execute("""
        INSERT INTO klient_narxlar (user_id, klient_id, tovar_id, narx, yangilangan)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (klient_id, tovar_id) DO UPDATE SET narx = $4, yangilangan = NOW()
    """, uid, klient_id, tovar_id, narx)


async def klient_narxlari(conn, klient_id: int) -> list:
    """Klientning barcha shaxsiy narxlari"""
    return await conn.fetch("""
        SELECT kn.narx, t.nomi as tovar_nomi, t.sotish_narxi as default_narx
        FROM klient_narxlar kn
        JOIN tovarlar t ON t.id = kn.tovar_id
        WHERE kn.klient_id = $1
        ORDER BY t.nomi
    """, klient_id)


# ═══════════════════════════════════════
#  Hisobot — Narx xaritasi
# ═══════════════════════════════════════

async def guruhlar_royxati(conn, uid: int) -> list:
    """Barcha narx guruhlari"""
    return await conn.fetch("""
        SELECT ng.id, ng.nomi, ng.izoh,
               COUNT(DISTINCT gn.tovar_id) as tovar_soni,
               COUNT(DISTINCT k.id) as klient_soni
        FROM narx_guruhlari ng
        LEFT JOIN guruh_narxlar gn ON gn.guruh_id = ng.id
        LEFT JOIN klientlar k ON k.narx_guruh_id = ng.id
        WHERE ng.user_id = $1
        GROUP BY ng.id, ng.nomi, ng.izoh
        ORDER BY ng.nomi
    """, uid)


async def guruh_narxlari_royxati(conn, guruh_id: int) -> list:
    """Guruh ichidagi barcha narxlar"""
    return await conn.fetch("""
        SELECT gn.narx, t.nomi as tovar_nomi, t.sotish_narxi as default_narx
        FROM guruh_narxlar gn
        JOIN tovarlar t ON t.id = gn.tovar_id
        WHERE gn.guruh_id = $1
        ORDER BY t.nomi
    """, guruh_id)
