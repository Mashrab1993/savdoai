"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — PLANNING (oylik plan)                            ║
║                                                                      ║
║  SalesDoc /planning asosida — admin shogirdlarga oylik plan:        ║
║  - Sotuv miqdori (so'mda)                                           ║
║  - Yangi klient soni                                                ║
║  - Tashrif (storecheck) soni                                        ║
║                                                                      ║
║  Bot kundalik progress kuzatadi, har hafta yodlatadi.               ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date
from decimal import Decimal

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  OYLIK PLAN — CRUD
# ════════════════════════════════════════════════════════════════════

async def plan_qoy(conn, uid: int, yil: int, oy: int,
                    sotuv_plan: Decimal = Decimal(0),
                    yangi_klient_plan: int = 0,
                    tashrif_plan: int = 0,
                    shogird_id: int | None = None,
                    izoh: str = "") -> int:
    """Oylik plan qo'yish (yoki yangilash). Admin faqat o'ziga yoki shogirdga."""
    row = await conn.fetchrow("""
        INSERT INTO oylik_plan(user_id, shogird_id, yil, oy,
                                sotuv_plan, yangi_klient_plan, tashrif_plan, izoh)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT(user_id, shogird_id, yil, oy) DO UPDATE SET
            sotuv_plan=EXCLUDED.sotuv_plan,
            yangi_klient_plan=EXCLUDED.yangi_klient_plan,
            tashrif_plan=EXCLUDED.tashrif_plan,
            izoh=EXCLUDED.izoh,
            yangilangan=NOW()
        RETURNING id
    """, uid, shogird_id, yil, oy, sotuv_plan, yangi_klient_plan, tashrif_plan, izoh)
    return row["id"]


async def plan_ol(conn, uid: int, yil: int, oy: int,
                   shogird_id: int | None = None) -> dict | None:
    row = await conn.fetchrow("""
        SELECT id, shogird_id, yil, oy, sotuv_plan, yangi_klient_plan,
               tashrif_plan, izoh, yaratilgan, yangilangan
        FROM oylik_plan
        WHERE user_id=$1 AND yil=$2 AND oy=$3
          AND ((shogird_id IS NULL AND $4::BIGINT IS NULL) OR shogird_id=$4)
    """, uid, yil, oy, shogird_id)
    return dict(row) if row else None


async def plan_progress(conn, uid: int, yil: int, oy: int,
                         shogird_id: int | None = None) -> dict:
    """Oylik plan VS haqiqiy natija. Progress foizi bilan.

    Hozirgi kun uchun taxminiy progress: har kun uchun tegishli foizda
    bo'lishi kerak (masalan, oy 30-kun, bugun 15-chi kun → 50% bo'lishi kerak).
    """
    oy_boshi = date(yil, oy, 1)
    # Keyingi oy boshigacha
    if oy == 12:
        oy_oxiri = date(yil + 1, 1, 1)
    else:
        oy_oxiri = date(yil, oy + 1, 1)
    oy_kunlari = (oy_oxiri - oy_boshi).days
    bugun = date.today()
    if bugun < oy_boshi:
        o_tgan_kun = 0
    elif bugun >= oy_oxiri:
        o_tgan_kun = oy_kunlari
    else:
        o_tgan_kun = (bugun - oy_boshi).days + 1
    kutilgan_foiz = (o_tgan_kun / oy_kunlari * 100) if oy_kunlari else 0

    plan = await plan_ol(conn, uid, yil, oy, shogird_id)
    if not plan:
        return {
            "plan_mavjud": False,
            "yil": yil, "oy": oy,
            "kutilgan_foiz": kutilgan_foiz,
            "otgan_kun": o_tgan_kun, "oy_kunlari": oy_kunlari,
        }

    # Haqiqiy natija — oy boshidan bugungacha
    # 1. Sotuv (sotuv_sessiyalar.jami yoki tolangan)
    if shogird_id:
        sotuv_row = await conn.fetchrow("""
            SELECT COALESCE(SUM(tolangan), 0) AS naqd,
                   COALESCE(SUM(jami), 0) AS jami,
                   COUNT(*) AS soni
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND shogird_id=$2
              AND sana >= $3 AND sana < $4
        """, uid, shogird_id, oy_boshi, oy_oxiri)
    else:
        sotuv_row = await conn.fetchrow("""
            SELECT COALESCE(SUM(tolangan), 0) AS naqd,
                   COALESCE(SUM(jami), 0) AS jami,
                   COUNT(*) AS soni
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= $2 AND sana < $3
        """, uid, oy_boshi, oy_oxiri)

    # 2. Yangi klient
    yangi_klient_soni = await conn.fetchval("""
        SELECT COUNT(*) FROM klientlar
        WHERE user_id=$1 AND yaratilgan >= $2 AND yaratilgan < $3
    """, uid, oy_boshi, oy_oxiri) or 0

    # 3. Storecheck tashrif
    if shogird_id:
        tashrif_soni = await conn.fetchval("""
            SELECT COUNT(*) FROM storecheck_sessions
            WHERE user_id=$1 AND shogird_id=$2
              AND boshlangan >= $3 AND boshlangan < $4
        """, uid, shogird_id, oy_boshi, oy_oxiri) or 0
    else:
        tashrif_soni = await conn.fetchval("""
            SELECT COUNT(*) FROM storecheck_sessions
            WHERE user_id=$1 AND boshlangan >= $2 AND boshlangan < $3
        """, uid, oy_boshi, oy_oxiri) or 0

    sotuv_plan = float(plan["sotuv_plan"] or 0)
    sotuv_fact = float(sotuv_row["jami"] or 0)
    sotuv_foiz = (sotuv_fact / sotuv_plan * 100) if sotuv_plan > 0 else 0

    yangi_klient_plan = int(plan["yangi_klient_plan"] or 0)
    yangi_klient_fact = int(yangi_klient_soni)
    yangi_klient_foiz = (yangi_klient_fact / yangi_klient_plan * 100) if yangi_klient_plan > 0 else 0

    tashrif_plan = int(plan["tashrif_plan"] or 0)
    tashrif_fact = int(tashrif_soni)
    tashrif_foiz = (tashrif_fact / tashrif_plan * 100) if tashrif_plan > 0 else 0

    return {
        "plan_mavjud": True,
        "yil": yil, "oy": oy,
        "otgan_kun": o_tgan_kun, "oy_kunlari": oy_kunlari,
        "kutilgan_foiz": round(kutilgan_foiz, 1),
        "sotuv": {
            "plan": sotuv_plan, "fact": sotuv_fact,
            "foiz": round(sotuv_foiz, 1),
            "holati": _holat(sotuv_foiz, kutilgan_foiz),
        },
        "yangi_klient": {
            "plan": yangi_klient_plan, "fact": yangi_klient_fact,
            "foiz": round(yangi_klient_foiz, 1),
            "holati": _holat(yangi_klient_foiz, kutilgan_foiz),
        },
        "tashrif": {
            "plan": tashrif_plan, "fact": tashrif_fact,
            "foiz": round(tashrif_foiz, 1),
            "holati": _holat(tashrif_foiz, kutilgan_foiz),
        },
        "shogird_id": shogird_id,
    }


def _holat(fact_foiz: float, kutilgan_foiz: float) -> str:
    """Progress holati emoji + matn."""
    if kutilgan_foiz < 1:
        return "⚪ Oy boshi"
    nisbiy = fact_foiz / kutilgan_foiz  # 1.0 = teng, >1 = oldinda
    if nisbiy >= 1.1:
        return "🟢 Oldinda"
    elif nisbiy >= 0.9:
        return "🟡 Tartibda"
    elif nisbiy >= 0.7:
        return "🟠 Orqada"
    else:
        return "🔴 Kritik orqada"


# ════════════════════════════════════════════════════════════════════
#  OUTLET PLAN (klient darajasida)
# ════════════════════════════════════════════════════════════════════

async def outlet_plan_qoy(conn, uid: int, klient_id: int, yil: int, oy: int,
                           sotuv_plan: Decimal = Decimal(0),
                           tashrif_plan: int = 4, izoh: str = "") -> int:
    row = await conn.fetchrow("""
        INSERT INTO outlet_plan(user_id, klient_id, yil, oy, sotuv_plan, tashrif_plan, izoh)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(user_id, klient_id, yil, oy) DO UPDATE SET
            sotuv_plan=EXCLUDED.sotuv_plan,
            tashrif_plan=EXCLUDED.tashrif_plan,
            izoh=EXCLUDED.izoh
        RETURNING id
    """, uid, klient_id, yil, oy, sotuv_plan, tashrif_plan, izoh)
    return row["id"]


async def outlet_plan_royxat(conn, uid: int, yil: int, oy: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT op.id, op.klient_id, k.ism AS klient_ismi,
               op.sotuv_plan, op.tashrif_plan, op.izoh
        FROM outlet_plan op
        JOIN klientlar k ON k.id = op.klient_id
        WHERE op.user_id=$1 AND op.yil=$2 AND op.oy=$3
        ORDER BY op.sotuv_plan DESC
        LIMIT 50
    """, uid, yil, oy)
    return [dict(r) for r in rows]
