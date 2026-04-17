"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — FEEDBACK / SHIKOYAT / FIKR                       ║
║                                                                      ║
║  Klient shikoyat yoki fikr qoldiradi:                               ║
║   - "Ovqat sovuq kelgan" → shikoyat                                 ║
║   - "Ariel sifati yaxshi, rahmat" → maqtov                          ║
║   - "Yangi tovar kelsa, xabar bering" → taklif                      ║
║                                                                      ║
║  Admin real-time ko'radi, javob beradi.                             ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re
from datetime import date, datetime, timedelta
from typing import Optional

log = logging.getLogger(__name__)


_TUR_KEYWORDS = {
    "shikoyat": ("shikoyat", "noxush", "yomon", "sovuq", "buzuq", "brak",
                 "kech", "sifatsiz", "yoqmadi", "yomon bo'ldi", "xafa bo'ldim",
                 "claims", "reklamatsiya"),
    "maqtov":   ("maqtov", "rahmat", "yaxshi", "ajoyib", "top", "a'lo", "super",
                 "zor", "foydali", "mazali", "tabrik"),
    "taklif":   ("taklif", "yangi", "qo'shsangiz", "kerak bo'ladi", "maslahat",
                 "agar qo'shsangiz"),
    # fallback: fikr
}


def turi_aniqla(matn: str) -> str:
    """Matn ichidagi keyword'lar asosida turi aniqlash."""
    if not matn:
        return "fikr"
    m = matn.lower()
    for tur, kws in _TUR_KEYWORDS.items():
        if any(kw in m for kw in kws):
            return tur
    return "fikr"


async def feedback_qoshish(conn, uid: int, matn: str,
                            klient_id: Optional[int] = None,
                            shogird_id: Optional[int] = None,
                            turi: Optional[str] = None,
                            baho: Optional[int] = None,
                            manba: str = "telegram") -> int:
    if not turi:
        turi = turi_aniqla(matn)
    row = await conn.fetchrow("""
        INSERT INTO feedback(user_id, klient_id, shogird_id, matn, turi, baho, manba)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    """, uid, klient_id, shogird_id, matn.strip()[:2000], turi, baho, manba)
    return row["id"]


async def feedback_javob(conn, uid: int, feedback_id: int, javob: str) -> bool:
    result = await conn.execute("""
        UPDATE feedback SET admin_javobi=$1, javob_berildi=TRUE, javob_vaqti=NOW()
        WHERE id=$2 AND user_id=$3 AND NOT javob_berildi
    """, javob[:2000], feedback_id, uid)
    return "UPDATE 1" in result


async def feedback_royxat(conn, uid: int, faqat_javobsiz: bool = True,
                           turi: Optional[str] = None,
                           limit: int = 30) -> list[dict]:
    where = ["user_id=$1"]
    params: list = [uid]
    if faqat_javobsiz:
        where.append("NOT javob_berildi")
    if turi:
        params.append(turi)
        where.append(f"turi=${len(params)}")
    params.append(limit)
    sql = f"""
        SELECT f.id, f.klient_id, k.ism AS klient_ismi,
               f.shogird_id, f.matn, f.turi, f.baho,
               f.javob_berildi, f.admin_javobi, f.javob_vaqti,
               f.manba, f.yaratilgan
        FROM feedback f
        LEFT JOIN klientlar k ON k.id = f.klient_id
        WHERE {' AND '.join(where)}
        ORDER BY f.yaratilgan DESC
        LIMIT ${len(params)}
    """
    rows = await conn.fetch(sql, *params)
    return [dict(r) for r in rows]


async def feedback_statistika(conn, uid: int, kun: int = 30) -> dict:
    chegara = datetime.now() - timedelta(days=kun)
    rows = await conn.fetch("""
        SELECT turi,
               COUNT(*) AS jami,
               COUNT(*) FILTER(WHERE javob_berildi) AS javob_berildi,
               ROUND(AVG(baho), 1) AS ortacha_baho
        FROM feedback
        WHERE user_id=$1 AND yaratilgan >= $2
        GROUP BY turi
        ORDER BY jami DESC
    """, uid, chegara)
    jami = await conn.fetchrow("""
        SELECT COUNT(*) AS jami,
               COUNT(*) FILTER(WHERE NOT javob_berildi) AS javobsiz,
               ROUND(AVG(baho), 1) AS ortacha_baho
        FROM feedback
        WHERE user_id=$1 AND yaratilgan >= $2
    """, uid, chegara)
    return {
        "kun": kun,
        "jami": int(jami["jami"] or 0),
        "javobsiz": int(jami["javobsiz"] or 0),
        "ortacha_baho": float(jami["ortacha_baho"] or 0),
        "turlar": [dict(r) for r in rows],
    }
