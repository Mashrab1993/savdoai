"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — VAZIFALAR (tasks)                                ║
║                                                                      ║
║  Admin shogirdlarga vazifa beradi:                                  ║
║   - "Tashkent Plaza'ga borib storecheck qil"                        ║
║   - "Karim aka qarzini yig'"                                        ║
║   - "Ariel'ni hamma do'konga yetkazib ber"                          ║
║                                                                      ║
║  Shogird bajaradi. Admin real-time bildirish oladi.                 ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

log = logging.getLogger(__name__)


async def vazifa_ber(conn, admin_uid: int, shogird_id: int, matn: str,
                      ustuvorlik: int = 2,
                      deadline: date | None = None,
                      klient_id: int | None = None,
                      admin_izoh: str = "") -> int:
    """Shogirdga yangi vazifa berish."""
    row = await conn.fetchrow("""
        INSERT INTO vazifalar(admin_uid, shogird_id, klient_id, matn,
                              ustuvorlik, deadline, admin_izoh)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    """, admin_uid, shogird_id, klient_id, matn.strip(),
        ustuvorlik, deadline, admin_izoh)
    return row["id"]


async def vazifa_bajardi(conn, admin_uid: int, vazifa_id: int,
                          bajaruvchi_izoh: str = "") -> bool:
    """Shogird vazifani bajardi deb belgilaydi."""
    result = await conn.execute("""
        UPDATE vazifalar SET bajarildi=TRUE, bajarilgan_vaqt=NOW(),
                             bajaruvchi_izoh=$1
        WHERE id=$2 AND admin_uid=$3 AND NOT bajarildi
    """, bajaruvchi_izoh[:500], vazifa_id, admin_uid)
    return "UPDATE 1" in result


async def vazifalar_royxat(conn, admin_uid: int,
                            shogird_id: int | None = None,
                            faqat_faol: bool = True,
                            limit: int = 50) -> list[dict]:
    where_parts = ["admin_uid=$1"]
    params: list = [admin_uid]
    if faqat_faol:
        where_parts.append("NOT bajarildi")
    if shogird_id is not None:
        params.append(shogird_id)
        where_parts.append(f"shogird_id=${len(params)}")
    params.append(limit)
    sql = f"""
        SELECT v.id, v.shogird_id, s.ism AS shogird_ismi,
               v.klient_id, k.ism AS klient_ismi,
               v.matn, v.ustuvorlik, v.deadline,
               v.bajarildi, v.bajarilgan_vaqt, v.bajaruvchi_izoh,
               v.admin_izoh, v.yaratilgan
        FROM vazifalar v
        LEFT JOIN shogirdlar s ON s.id = v.shogird_id
        LEFT JOIN klientlar k ON k.id = v.klient_id
        WHERE {' AND '.join(where_parts)}
        ORDER BY v.bajarildi ASC, v.ustuvorlik ASC,
                 COALESCE(v.deadline, v.yaratilgan::date) ASC
        LIMIT ${len(params)}
    """
    rows = await conn.fetch(sql, *params)
    return [dict(r) for r in rows]


async def vazifa_statistika(conn, admin_uid: int, kun: int = 30) -> dict:
    """Admin dashboard uchun vazifa statistikasi."""
    jami = await conn.fetchval("""
        SELECT COUNT(*) FROM vazifalar
        WHERE admin_uid=$1 AND yaratilgan >= NOW() - make_interval(days => $2)
    """, admin_uid, kun)
    bajarildi = await conn.fetchval("""
        SELECT COUNT(*) FROM vazifalar
        WHERE admin_uid=$1 AND bajarildi=TRUE
          AND yaratilgan >= NOW() - make_interval(days => $2)
    """, admin_uid, kun)
    muddati_otgan = await conn.fetchval("""
        SELECT COUNT(*) FROM vazifalar
        WHERE admin_uid=$1 AND NOT bajarildi AND deadline IS NOT NULL
          AND deadline < CURRENT_DATE
    """, admin_uid)
    shogird_stat = await conn.fetch("""
        SELECT s.ism AS shogird_ismi,
               COUNT(*) AS jami,
               COUNT(*) FILTER(WHERE v.bajarildi) AS bajarildi,
               ROUND(100.0 * COUNT(*) FILTER(WHERE v.bajarildi) / NULLIF(COUNT(*), 0), 1) AS bajarish_foiz
        FROM vazifalar v
        JOIN shogirdlar s ON s.id = v.shogird_id
        WHERE v.admin_uid=$1 AND v.yaratilgan >= NOW() - make_interval(days => $2)
        GROUP BY s.id, s.ism
        ORDER BY jami DESC
    """, admin_uid, kun)
    return {
        "kun": kun,
        "jami": int(jami or 0),
        "bajarildi": int(bajarildi or 0),
        "bajarilmagan": int((jami or 0) - (bajarildi or 0)),
        "muddati_otgan": int(muddati_otgan or 0),
        "bajarish_foiz": round((bajarildi or 0) / (jami or 1) * 100, 1),
        "shogird_stat": [dict(r) for r in shogird_stat],
    }
