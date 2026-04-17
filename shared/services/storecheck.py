"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — STORECHECK (SalesDoc /audit/storecheck asosida)  ║
║                                                                      ║
║  Shogird/agent do'konga borganda:                                   ║
║  1. Yangi storecheck sessiyasini boshlaydi (/storecheck_boshla N)   ║
║  2. SKU ro'yxatini ko'radi (admin tayyorlagan template'dan)         ║
║  3. Har SKU: mavjud/yo'q, narx, facing soni                         ║
║  4. Foto yuboradi (facing, raqobat)                                 ║
║  5. Poll (so'rov) javoblarini kiritadi                              ║
║  6. Sessiya yopiladi (/storecheck_yop)                              ║
║                                                                      ║
║  Admin real-time dashboard'da ko'radi: qancha tashrif, qaysi SKU    ║
║  eng ko'p yo'q, narx raqobati, foto hisobot.                        ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  SESSIYA (TASHRIF) CRUD
# ════════════════════════════════════════════════════════════════════

async def session_boshla(conn, uid: int, klient_id: Optional[int] = None,
                         shogird_id: Optional[int] = None,
                         gps_lat: Optional[float] = None,
                         gps_lng: Optional[float] = None) -> int:
    """Yangi storecheck tashrif boshlash."""
    row = await conn.fetchrow("""
        INSERT INTO storecheck_sessions(user_id, shogird_id, klient_id, gps_lat, gps_lng)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id
    """, uid, shogird_id, klient_id, gps_lat, gps_lng)
    return row["id"]


async def session_yop(conn, uid: int, session_id: int, izoh: str = "") -> bool:
    """Tashrifni tugatish (yopish)."""
    result = await conn.execute("""
        UPDATE storecheck_sessions
        SET tugagan=NOW(), holat='yopildi', izoh=$1
        WHERE id=$2 AND user_id=$3 AND holat='ochiq'
    """, izoh, session_id, uid)
    return "UPDATE 1" in result


async def session_ochiq(conn, uid: int, shogird_id: Optional[int] = None) -> Optional[dict]:
    """Hozir ochiq sessiyani topish (bir vaqtda bitta sessiya)."""
    where_shogird = "shogird_id IS NULL" if shogird_id is None else f"shogird_id = {int(shogird_id)}"
    row = await conn.fetchrow(f"""
        SELECT s.id, s.klient_id, k.ism AS klient_ismi,
               s.boshlangan, s.gps_lat, s.gps_lng
        FROM storecheck_sessions s
        LEFT JOIN klientlar k ON k.id = s.klient_id
        WHERE s.user_id=$1 AND s.holat='ochiq' AND {where_shogird}
        ORDER BY s.boshlangan DESC LIMIT 1
    """, uid)
    return dict(row) if row else None


async def sessiyalar_royxat(conn, uid: int, kun: int = 7,
                             shogird_id: Optional[int] = None) -> list[dict]:
    """Oxirgi N kun tashriflari."""
    chegara = datetime.now() - timedelta(days=kun)
    if shogird_id is not None:
        rows = await conn.fetch("""
            SELECT s.id, s.klient_id, k.ism AS klient_ismi, s.shogird_id,
                   s.boshlangan, s.tugagan, s.holat,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id) AS sku_soni,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id AND mavjud=TRUE) AS sku_bor,
                   (SELECT COUNT(*) FROM storecheck_photos WHERE session_id=s.id) AS foto_soni
            FROM storecheck_sessions s
            LEFT JOIN klientlar k ON k.id = s.klient_id
            WHERE s.user_id=$1 AND s.boshlangan >= $2 AND s.shogird_id=$3
            ORDER BY s.boshlangan DESC LIMIT 50
        """, uid, chegara, shogird_id)
    else:
        rows = await conn.fetch("""
            SELECT s.id, s.klient_id, k.ism AS klient_ismi, s.shogird_id,
                   s.boshlangan, s.tugagan, s.holat,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id) AS sku_soni,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id AND mavjud=TRUE) AS sku_bor,
                   (SELECT COUNT(*) FROM storecheck_photos WHERE session_id=s.id) AS foto_soni
            FROM storecheck_sessions s
            LEFT JOIN klientlar k ON k.id = s.klient_id
            WHERE s.user_id=$1 AND s.boshlangan >= $2
            ORDER BY s.boshlangan DESC LIMIT 50
        """, uid, chegara)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════════════
#  SKU (TOVAR TEKSHIRUV) CRUD
# ════════════════════════════════════════════════════════════════════

async def sku_qoshish(conn, uid: int, session_id: int, tovar_id: Optional[int],
                      tovar_nomi: str, mavjud: bool = False,
                      narx: Optional[Decimal] = None,
                      facing: int = 0, izoh: str = "") -> int:
    row = await conn.fetchrow("""
        INSERT INTO storecheck_sku(user_id, session_id, tovar_id, tovar_nomi,
                                    mavjud, narx, facing, izoh)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    """, uid, session_id, tovar_id, tovar_nomi, mavjud, narx, facing, izoh)
    return row["id"]


async def sku_yangila(conn, uid: int, sku_id: int, mavjud: Optional[bool] = None,
                      narx: Optional[Decimal] = None, facing: Optional[int] = None,
                      izoh: Optional[str] = None) -> bool:
    """Bitta SKU qatorini yangilash."""
    sets = []
    params: list = []
    if mavjud is not None:
        params.append(mavjud); sets.append(f"mavjud=${len(params)}")
    if narx is not None:
        params.append(narx); sets.append(f"narx=${len(params)}")
    if facing is not None:
        params.append(facing); sets.append(f"facing=${len(params)}")
    if izoh is not None:
        params.append(izoh); sets.append(f"izoh=${len(params)}")
    if not sets:
        return False
    params.extend([sku_id, uid])
    query = f"UPDATE storecheck_sku SET {', '.join(sets)} WHERE id=${len(params)-1} AND user_id=${len(params)}"
    result = await conn.execute(query, *params)
    return "UPDATE 1" in result


async def session_sku_royxat(conn, uid: int, session_id: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT id, tovar_id, tovar_nomi, mavjud, narx, facing, izoh, tartib
        FROM storecheck_sku
        WHERE user_id=$1 AND session_id=$2
        ORDER BY tartib, id
    """, uid, session_id)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════════════
#  FOTO HISOBOT
# ════════════════════════════════════════════════════════════════════

async def foto_qoshish(conn, uid: int, session_id: int, telegram_file_id: str,
                       turi: str = "facing", izoh: str = "") -> int:
    row = await conn.fetchrow("""
        INSERT INTO storecheck_photos(user_id, session_id, telegram_file_id, turi, izoh)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id
    """, uid, session_id, telegram_file_id, turi, izoh)
    return row["id"]


async def session_fotolar(conn, uid: int, session_id: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT id, telegram_file_id, turi, izoh, yaratilgan
        FROM storecheck_photos
        WHERE user_id=$1 AND session_id=$2
        ORDER BY yaratilgan
    """, uid, session_id)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════════════
#  TEMPLATE (oldindan tayyor SKU ro'yxat)
# ════════════════════════════════════════════════════════════════════

async def template_yarat(conn, uid: int, nomi: str, tovar_idlari: list[int],
                          klient_turi_id: Optional[int] = None) -> int:
    row = await conn.fetchrow("""
        INSERT INTO storecheck_templates(user_id, nomi, klient_turi_id, tovar_idlari)
        VALUES($1, $2, $3, $4)
        RETURNING id
    """, uid, nomi, klient_turi_id, tovar_idlari)
    return row["id"]


async def template_ol(conn, uid: int, klient_turi_id: Optional[int] = None) -> Optional[dict]:
    """Klient turiga mos templateni olish (yoki birinchi mavjud)."""
    if klient_turi_id:
        row = await conn.fetchrow("""
            SELECT id, nomi, tovar_idlari FROM storecheck_templates
            WHERE user_id=$1 AND faol=TRUE AND klient_turi_id=$2
            ORDER BY id DESC LIMIT 1
        """, uid, klient_turi_id)
        if row:
            return dict(row)
    row = await conn.fetchrow("""
        SELECT id, nomi, tovar_idlari FROM storecheck_templates
        WHERE user_id=$1 AND faol=TRUE
        ORDER BY id DESC LIMIT 1
    """, uid)
    return dict(row) if row else None


async def session_sku_bulk_qoshish(conn, uid: int, session_id: int,
                                    tovar_idlari: list[int]) -> int:
    """Template'dan SKU ro'yxatini sessionga kiritish."""
    if not tovar_idlari:
        return 0
    tovarlar = await conn.fetch("""
        SELECT id, nomi FROM tovarlar
        WHERE user_id=$1 AND id = ANY($2::bigint[])
    """, uid, tovar_idlari)
    if not tovarlar:
        return 0
    rows = [(uid, session_id, t["id"], t["nomi"]) for t in tovarlar]
    await conn.executemany("""
        INSERT INTO storecheck_sku(user_id, session_id, tovar_id, tovar_nomi)
        VALUES($1, $2, $3, $4)
    """, rows)
    return len(rows)


# ════════════════════════════════════════════════════════════════════
#  ADMIN DASHBOARD — statistika
# ════════════════════════════════════════════════════════════════════

async def statistika(conn, uid: int, kun: int = 7) -> dict:
    """Admin uchun: oxirgi N kun storecheck umumlashtirilgan natijasi."""
    chegara = datetime.now() - timedelta(days=kun)
    umumiy = await conn.fetchrow("""
        SELECT COUNT(*) AS tashrif_soni,
               COUNT(DISTINCT klient_id) AS noyob_klient,
               COUNT(DISTINCT shogird_id) AS ishlagan_shogird,
               AVG(EXTRACT(EPOCH FROM (tugagan - boshlangan))/60) AS ortacha_daqiqa
        FROM storecheck_sessions
        WHERE user_id=$1 AND boshlangan >= $2
    """, uid, chegara)
    sku_stat = await conn.fetchrow("""
        SELECT COUNT(*) AS jami_tekshirilgan,
               COUNT(*) FILTER(WHERE mavjud) AS jami_mavjud,
               AVG(facing) AS ortacha_facing
        FROM storecheck_sku sk
        JOIN storecheck_sessions ss ON ss.id = sk.session_id
        WHERE sk.user_id=$1 AND ss.boshlangan >= $2
    """, uid, chegara)
    eng_yoq_tovarlar = await conn.fetch("""
        SELECT sk.tovar_nomi,
               COUNT(*) AS tekshirilgan,
               COUNT(*) FILTER(WHERE NOT sk.mavjud) AS yoq_soni,
               ROUND(100.0 * COUNT(*) FILTER(WHERE NOT sk.mavjud) / COUNT(*), 1) AS yoq_foiz
        FROM storecheck_sku sk
        JOIN storecheck_sessions ss ON ss.id = sk.session_id
        WHERE sk.user_id=$1 AND ss.boshlangan >= $2
        GROUP BY sk.tovar_nomi
        HAVING COUNT(*) >= 3
        ORDER BY yoq_foiz DESC LIMIT 10
    """, uid, chegara)
    return {
        "kun_soni": kun,
        "tashrif_soni": int(umumiy["tashrif_soni"] or 0),
        "noyob_klient": int(umumiy["noyob_klient"] or 0),
        "ishlagan_shogird": int(umumiy["ishlagan_shogird"] or 0),
        "ortacha_daqiqa": float(umumiy["ortacha_daqiqa"] or 0),
        "jami_tekshirilgan_sku": int(sku_stat["jami_tekshirilgan"] or 0),
        "jami_mavjud_sku": int(sku_stat["jami_mavjud"] or 0),
        "ortacha_facing": float(sku_stat["ortacha_facing"] or 0),
        "eng_yoq_tovarlar": [dict(r) for r in eng_yoq_tovarlar],
    }
