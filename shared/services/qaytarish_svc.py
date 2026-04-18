"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — QAYTARISH / ALMASHTIRISH                         ║
║                                                                      ║
║  Klient buzuq/eskirgan tovar qaytaradi yoki yangisiga almashtiradi. ║
║  Shogird ovozda yozadi:                                             ║
║   "Karim aka 5 ta Ariel qaytardi muddati o'tgan"                    ║
║   "Akmal do'kon 3 ta Persil Tide ga almashtir"                      ║
║                                                                      ║
║  Admin tasdiq beradi — qaytarish rasmiylashtiriladi.                ║
║  Stock avtomatik yangilanadi (tasdiqlangach).                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from decimal import Decimal

log = logging.getLogger(__name__)


SABAB_TURLARI = ["brak", "muddati", "sifatsiz", "kelishuv", "boshqa"]


async def qaytarish_yarat(conn, uid: int, klient_id: int | None,
                           tovar_id: int | None, tovar_nomi: str,
                           miqdor: Decimal, sabab: str = "brak",
                           summa: Decimal = Decimal(0),
                           turi: str = "qaytarish",
                           almash_tovar_id: int | None = None,
                           almash_miqdor: Decimal = Decimal(0),
                           shogird_id: int | None = None,
                           asl_sotuv_id: int | None = None,
                           izoh: str = "",
                           rasm_file_id: str | None = None) -> int:
    if sabab not in SABAB_TURLARI:
        sabab = "boshqa"
    if turi not in ("qaytarish", "almashtirish"):
        turi = "qaytarish"
    row = await conn.fetchrow("""
        INSERT INTO qaytarishlar(user_id, klient_id, tovar_id, tovar_nomi,
                                  miqdor, sabab, summa, turi,
                                  almash_tovar_id, almash_miqdor,
                                  shogird_id, asl_sotuv_id, izoh, rasm_file_id)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
    """, uid, klient_id, tovar_id, tovar_nomi[:200], miqdor, sabab, summa,
        turi, almash_tovar_id, almash_miqdor, shogird_id, asl_sotuv_id,
        izoh[:500], rasm_file_id)
    return row["id"]


async def qaytarish_tasdiq(conn, uid: int, qid: int) -> bool:
    """Admin qaytarishni tasdiqlaydi — stock yangilanadi."""
    q = await conn.fetchrow("""
        SELECT id, tovar_id, miqdor, almash_tovar_id, almash_miqdor,
               holat, turi
        FROM qaytarishlar
        WHERE id=$1 AND user_id=$2 AND holat='yangi'
    """, qid, uid)
    if not q:
        return False

    # Qoldiq yangilash (tovarlar.qoldiq oshadi, chunki tovar qaytdi)
    try:
        if q["tovar_id"]:
            await conn.execute("""
                UPDATE tovarlar SET qoldiq = qoldiq + $1
                WHERE id=$2 AND user_id=$3
            """, q["miqdor"], q["tovar_id"], uid)
        # Almashtirish — yangi tovar chiqadi (qoldiq kamayadi)
        if q["turi"] == "almashtirish" and q["almash_tovar_id"] and q["almash_miqdor"]:
            await conn.execute("""
                UPDATE tovarlar SET qoldiq = GREATEST(qoldiq - $1, 0)
                WHERE id=$2 AND user_id=$3
            """, q["almash_miqdor"], q["almash_tovar_id"], uid)
    except Exception as e:
        log.warning("qaytarish stock yangilash xato: %s", e)

    await conn.execute("""
        UPDATE qaytarishlar SET holat='tasdiqlandi', tugatilgan=NOW()
        WHERE id=$1
    """, qid)
    return True


async def qaytarish_bekor(conn, uid: int, qid: int) -> bool:
    result = await conn.execute("""
        UPDATE qaytarishlar SET holat='bekor', tugatilgan=NOW()
        WHERE id=$1 AND user_id=$2 AND holat='yangi'
    """, qid, uid)
    return "UPDATE 1" in result


async def qaytarishlar_royxat(conn, uid: int, holat: str | None = None,
                                kun: int = 30, limit: int = 30) -> list[dict]:
    chegara = datetime.now() - timedelta(days=kun)
    where = ["q.user_id=$1", "q.yaratilgan >= $2"]
    params: list = [uid, chegara]
    if holat:
        params.append(holat)
        where.append(f"q.holat=${len(params)}")
    params.append(limit)
    sql = f"""
        SELECT q.id, q.klient_id, k.ism AS klient_ismi,
               q.tovar_nomi, q.miqdor, q.sabab, q.summa, q.turi,
               q.almash_tovar_id, q.almash_miqdor, q.holat,
               q.izoh, q.yaratilgan, q.tugatilgan
        FROM qaytarishlar q
        LEFT JOIN klientlar k ON k.id = q.klient_id
        WHERE {' AND '.join(where)}
        ORDER BY q.yaratilgan DESC
        LIMIT ${len(params)}
    """
    rows = await conn.fetch(sql, *params)
    return [dict(r) for r in rows]


async def qaytarish_statistika(conn, uid: int, kun: int = 30) -> dict:
    chegara = datetime.now() - timedelta(days=kun)
    umumiy = await conn.fetchrow("""
        SELECT COUNT(*) AS jami,
               COUNT(*) FILTER(WHERE holat='tasdiqlandi') AS tasdiqlangan,
               COUNT(*) FILTER(WHERE holat='yangi') AS kutilayotgan,
               COALESCE(SUM(summa) FILTER(WHERE holat='tasdiqlandi'), 0) AS jami_summa
        FROM qaytarishlar
        WHERE user_id=$1 AND yaratilgan >= $2
    """, uid, chegara)
    sabablar = await conn.fetch("""
        SELECT sabab, COUNT(*) AS soni,
               COALESCE(SUM(summa), 0) AS jami_summa
        FROM qaytarishlar
        WHERE user_id=$1 AND yaratilgan >= $2
        GROUP BY sabab
        ORDER BY soni DESC
    """, uid, chegara)
    top_tovarlar = await conn.fetch("""
        SELECT tovar_nomi, COUNT(*) AS soni, SUM(miqdor) AS jami_miqdor
        FROM qaytarishlar
        WHERE user_id=$1 AND yaratilgan >= $2
        GROUP BY tovar_nomi
        ORDER BY soni DESC
        LIMIT 10
    """, uid, chegara)
    return {
        "kun": kun,
        "jami": int(umumiy["jami"] or 0),
        "tasdiqlangan": int(umumiy["tasdiqlangan"] or 0),
        "kutilayotgan": int(umumiy["kutilayotgan"] or 0),
        "jami_summa": float(umumiy["jami_summa"] or 0),
        "sabablar": [dict(r) for r in sabablar],
        "top_tovarlar": [dict(r) for r in top_tovarlar],
    }
