"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — RAQOBATCHI NARX MONITORING                       ║
║  Raqobatchilar narxini kuzatish va solishtirish              ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

log = logging.getLogger(__name__)


async def raqobat_narx_qoshish(conn, uid: int, tovar_id: int,
                                 raqobatchi: str, narx: float,
                                 izoh: str = "") -> int:
    """Raqobatchi narxini qo'shish."""
    row = await conn.fetchrow("""
        INSERT INTO raqobat_narxlar (user_id, tovar_id, raqobatchi, narx, izoh)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """, uid, tovar_id, raqobatchi, narx, izoh)
    return row["id"]


async def raqobat_tahlil(conn, uid: int, limit: int = 20) -> list[dict]:
    """Raqobat narx tahlili — bizning narx vs raqobatchilar.

    Returns: [{tovar_nomi, bizning_narx, raqobatchi, raqobat_narx, farq_foiz}]
    """
    rows = await conn.fetch("""
        WITH oxirgi_raqobat AS (
            SELECT DISTINCT ON (tovar_id, raqobatchi)
                tovar_id, raqobatchi, narx AS raqobat_narx, sana
            FROM raqobat_narxlar
            WHERE user_id = $1
            ORDER BY tovar_id, raqobatchi, sana DESC
        )
        SELECT
            t.nomi AS tovar_nomi,
            t.sotish_narxi AS bizning_narx,
            r.raqobatchi,
            r.raqobat_narx,
            r.sana,
            CASE WHEN r.raqobat_narx > 0
                THEN ROUND((t.sotish_narxi - r.raqobat_narx) / r.raqobat_narx * 100, 1)
                ELSE 0
            END AS farq_foiz
        FROM oxirgi_raqobat r
        JOIN tovarlar t ON t.id = r.tovar_id AND t.user_id = $1
        ORDER BY ABS(t.sotish_narxi - r.raqobat_narx) DESC
        LIMIT $2
    """, uid, limit)
    return [dict(r) for r in rows]


async def raqobat_xulosa(conn, uid: int) -> dict:
    """Umumiy raqobat xulosa.

    Returns: {jami_tovar, biz_arzon, biz_qimmat, ortacha_farq}
    """
    row = await conn.fetchrow("""
        WITH oxirgi AS (
            SELECT DISTINCT ON (tovar_id, raqobatchi)
                tovar_id, narx AS raqobat_narx
            FROM raqobat_narxlar WHERE user_id = $1
            ORDER BY tovar_id, raqobatchi, sana DESC
        )
        SELECT
            COUNT(DISTINCT o.tovar_id) AS jami_tovar,
            COUNT(*) FILTER (WHERE t.sotish_narxi < o.raqobat_narx) AS biz_arzon,
            COUNT(*) FILTER (WHERE t.sotish_narxi > o.raqobat_narx) AS biz_qimmat,
            ROUND(AVG(
                CASE WHEN o.raqobat_narx > 0
                THEN (t.sotish_narxi - o.raqobat_narx) / o.raqobat_narx * 100
                ELSE 0 END
            ), 1) AS ortacha_farq
        FROM oxirgi o
        JOIN tovarlar t ON t.id = o.tovar_id AND t.user_id = $1
    """, uid)
    return dict(row) if row else {}
