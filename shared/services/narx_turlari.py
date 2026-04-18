"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — NARX TURLARI (multi-price)                       ║
║                                                                      ║
║  SalesDoc asosli ficha — bir tovar, bir necha narx:                 ║
║  - Chakana (default)                                                ║
║  - Optom (-10%)                                                     ║
║  - VIP (-15%)                                                       ║
║  - Diler (-20%)                                                     ║
║                                                                      ║
║  Klient.narx_turi_id → mos narx avtomatik                           ║
║  Yozuv yo'q bo'lsa → tovarlar.sotish_narxi (bazaviy)               ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Optional

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  NARX TURLARI — CRUD
# ════════════════════════════════════════════════════════════════════

async def narx_turi_qoshish(conn, uid: int, nomi: str,
                             foiz_chegirma: float = 0,
                             klient_turi_id: int | None = None) -> int:
    row = await conn.fetchrow("""
        INSERT INTO narx_turlari(user_id, nomi, foiz_chegirma, klient_turi_id)
        VALUES($1, $2, $3, $4)
        RETURNING id
    """, uid, nomi.strip(), Decimal(str(foiz_chegirma)), klient_turi_id)
    return row["id"]


async def narx_turlari_royxat(conn, uid: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT id, nomi, foiz_chegirma, klient_turi_id, tartib, faol
        FROM narx_turlari
        WHERE user_id=$1 AND faol=TRUE
        ORDER BY tartib, id
    """, uid)
    return [dict(r) for r in rows]


async def default_narx_turlari_yaratish(conn, uid: int) -> list[int]:
    """Standart 4 ta narx turi yaratish (agar hali yo'q bo'lsa)."""
    defaults = [
        ("Chakana", 0),
        ("Optom", -10),
        ("VIP", -15),
        ("Diler", -20),
    ]
    ids = []
    for nomi, chegirma in defaults:
        exists = await conn.fetchval(
            "SELECT id FROM narx_turlari WHERE user_id=$1 AND nomi=$2",
            uid, nomi,
        )
        if not exists:
            nid = await narx_turi_qoshish(conn, uid, nomi, foiz_chegirma=chegirma)
            ids.append(nid)
        else:
            ids.append(exists)
    return ids


# ════════════════════════════════════════════════════════════════════
#  TOVAR NARXLARI — har tovar uchun har narx turida alohida narx
# ════════════════════════════════════════════════════════════════════

async def tovar_narx_belgilash(conn, uid: int, tovar_id: int,
                                narx_turi_id: int, narx: Decimal) -> None:
    await conn.execute("""
        INSERT INTO tovar_narxlari(user_id, tovar_id, narx_turi_id, narx)
        VALUES($1, $2, $3, $4)
        ON CONFLICT(tovar_id, narx_turi_id) DO UPDATE SET
            narx=EXCLUDED.narx, yangilangan=NOW()
    """, uid, tovar_id, narx_turi_id, narx)


async def tovar_narxlari_ol(conn, uid: int, tovar_id: int) -> list[dict]:
    """Tovarning barcha turdagi narxlari."""
    rows = await conn.fetch("""
        SELECT tn.narx_turi_id, nt.nomi AS narx_turi_nomi,
               tn.narx, nt.foiz_chegirma
        FROM tovar_narxlari tn
        JOIN narx_turlari nt ON nt.id = tn.narx_turi_id
        WHERE tn.user_id=$1 AND tn.tovar_id=$2
        ORDER BY nt.tartib
    """, uid, tovar_id)
    return [dict(r) for r in rows]


async def klient_uchun_narx(conn, uid: int, tovar_id: int,
                             klient_id: int | None = None) -> Decimal:
    """Klient uchun mos narxni aniqlash.

    Mantiq:
    1. Agar klient_id berilgan va klientning narx_turi_id bor bo'lsa:
       - tovar_narxlari'da yozuv bor bo'lsa → shu narx
       - Yo'q bo'lsa → bazaviy * (1 + narx_turi.foiz_chegirma/100)
    2. Bo'lmasa → tovarlar.sotish_narxi (bazaviy)
    """
    # Bazaviy narx
    bazaviy = await conn.fetchval(
        "SELECT sotish_narxi FROM tovarlar WHERE id=$1 AND user_id=$2",
        tovar_id, uid,
    )
    if not bazaviy:
        return Decimal("0")
    bazaviy = Decimal(str(bazaviy))

    if not klient_id:
        return bazaviy

    narx_turi_id = await conn.fetchval(
        "SELECT narx_turi_id FROM klientlar WHERE id=$1 AND user_id=$2",
        klient_id, uid,
    )
    if not narx_turi_id:
        return bazaviy

    # Tovar uchun aniq narx bormi?
    aniq_narx = await conn.fetchval("""
        SELECT narx FROM tovar_narxlari
        WHERE user_id=$1 AND tovar_id=$2 AND narx_turi_id=$3
    """, uid, tovar_id, narx_turi_id)
    if aniq_narx is not None:
        return Decimal(str(aniq_narx))

    # Formulaga qarab hisoblash (bazaviy * (1 + foiz/100))
    foiz = await conn.fetchval(
        "SELECT foiz_chegirma FROM narx_turlari WHERE id=$1", narx_turi_id,
    )
    if foiz is None:
        return bazaviy
    foiz = Decimal(str(foiz))
    return (bazaviy * (Decimal("100") + foiz) / Decimal("100")).quantize(Decimal("1"))
