"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — KLIENT CRM                                       ║
║  Tug'ilgan kun, kategoriya, tarix, xarid statistika          ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import date

log = logging.getLogger(__name__)


async def klient_profil(conn, uid: int, klient_id: int) -> dict | None:
    """To'liq klient profili."""
    row = await conn.fetchrow("""
        SELECT k.id, k.ism, k.telefon, k.manzil,
               k.tugilgan_kun, k.izoh, k.kategoriya,
               k.oxirgi_sotuv, k.jami_xaridlar, k.xarid_soni,
               k.kredit_limit,
               COALESCE((SELECT SUM(qolgan) FROM qarzlar
                          WHERE klient_id = k.id AND NOT yopildi), 0) AS joriy_qarz
        FROM klientlar k
        WHERE k.id = $1 AND k.user_id = $2
    """, klient_id, uid)
    return dict(row) if row else None


async def klient_tarix(conn, uid: int, klient_id: int, limit: int = 20) -> list[dict]:
    """Klient sotuv tarixi."""
    rows = await conn.fetch("""
        SELECT s.id, s.sana, s.jami, s.tolangan, s.qarz,
               COUNT(c.id) AS tovar_soni
        FROM sotuv_sessiyalar s
        LEFT JOIN chiqimlar c ON c.sessiya_id = s.id
        WHERE s.user_id = $1 AND s.klient_id = $2
        GROUP BY s.id
        ORDER BY s.sana DESC
        LIMIT $3
    """, uid, klient_id, limit)
    return [dict(r) for r in rows]


async def klient_izoh_yangilash(conn, uid: int, klient_id: int,
                                 izoh: str = None, tugilgan_kun: date = None,
                                 kategoriya: str = None) -> bool:
    """Klient CRM ma'lumotlarini yangilash."""
    updates = []
    params = []
    idx = 3  # $1=klient_id, $2=uid

    if izoh is not None:
        updates.append(f"izoh = ${idx}")
        params.append(izoh)
        idx += 1
    if tugilgan_kun is not None:
        updates.append(f"tugilgan_kun = ${idx}")
        params.append(tugilgan_kun)
        idx += 1
    if kategoriya is not None:
        updates.append(f"kategoriya = ${idx}")
        params.append(kategoriya)
        idx += 1

    if not updates:
        return False

    sql = f"UPDATE klientlar SET {', '.join(updates)} WHERE id = $1 AND user_id = $2"
    await conn.execute(sql, klient_id, uid, *params)
    return True


async def bugungi_tugilgan_kunlar(conn, uid: int) -> list[dict]:
    """Bugun tug'ilgan kun bo'lgan klientlar."""
    today = date.today()
    rows = await conn.fetch("""
        SELECT id, ism, telefon, tugilgan_kun
        FROM klientlar
        WHERE user_id = $1
          AND EXTRACT(MONTH FROM tugilgan_kun) = $2
          AND EXTRACT(DAY FROM tugilgan_kun) = $3
    """, uid, today.month, today.day)
    return [dict(r) for r in rows]


async def klient_statistika_yangilash(conn, uid: int, klient_id: int,
                                       summa: float) -> None:
    """Sotuv qilinganda klient statistikasini yangilash."""
    try:
        await conn.execute("""
            UPDATE klientlar
            SET jami_xaridlar = COALESCE(jami_xaridlar, 0) + $3,
                xarid_soni = COALESCE(xarid_soni, 0) + 1,
                oxirgi_sotuv = NOW()
            WHERE id = $1 AND user_id = $2
        """, klient_id, uid, summa)
    except Exception as e:
        log.debug("klient stat: %s", e)
