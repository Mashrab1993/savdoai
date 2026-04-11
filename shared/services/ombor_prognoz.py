"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — OMBOR PROGNOZ                            ║
║                                                              ║
║  Tovar qachon tugashini bashorat qilish:                     ║
║  1. Oxirgi 30 kunlik o'rtacha sotuv tezligi                 ║
║  2. Hozirgi qoldiq / kunlik sotuv = qolgan kunlar            ║
║  3. Buyurtma qilish vaqtini hisoblash                        ║
║                                                              ║
║  Natija: [{"nomi", "qoldiq", "kunlik_sotuv",                ║
║            "qolgan_kun", "buyurtma_kerak", "holat"}]        ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal
from typing import Optional

log = logging.getLogger(__name__)

D = lambda v: Decimal(str(v or 0))


async def ombor_prognoz(conn, uid: int, kunlar: int = 30,
                         limit: int = 50) -> list[dict]:
    """
    Tovarlar uchun tugash prognozi.

    Args:
        conn: DB connection (RLS kontekstida)
        uid: Foydalanuvchi ID
        kunlar: Necha kunlik tarix asosida hisoblash
        limit: Nechta tovar qaytarish

    Returns:
        Har bir tovar uchun prognoz dict ro'yxati
    """
    rows = await conn.fetch("""
        WITH sotuv_tezlik AS (
            SELECT
                ch.tovar_id,
                ch.tovar_nomi,
                SUM(ch.miqdor) AS jami_sotilgan,
                COUNT(DISTINCT (ch.sana AT TIME ZONE 'Asia/Tashkent')::date) AS sotuv_kunlari
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.user_id = $1
              AND ss.sana >= NOW() - make_interval(days => $2)
              AND ch.tovar_id IS NOT NULL
            GROUP BY ch.tovar_id, ch.tovar_nomi
        )
        SELECT
            t.id,
            t.nomi,
            t.kategoriya,
            t.qoldiq,
            t.min_qoldiq,
            t.birlik,
            t.olish_narxi,
            t.sotish_narxi,
            COALESCE(s.jami_sotilgan, 0) AS jami_sotilgan,
            COALESCE(s.sotuv_kunlari, 0) AS sotuv_kunlari
        FROM tovarlar t
        LEFT JOIN sotuv_tezlik s ON s.tovar_id = t.id
        WHERE t.user_id = $1
        ORDER BY
            CASE
                WHEN t.qoldiq <= 0 THEN 0
                WHEN s.jami_sotilgan > 0 THEN t.qoldiq / (s.jami_sotilgan / $2::numeric)
                ELSE 999
            END ASC
        LIMIT $3
    """, uid, kunlar, limit)

    natijalar = []
    for r in rows:
        qoldiq = D(r["qoldiq"])
        jami_sotilgan = D(r["jami_sotilgan"])
        min_qoldiq = D(r["min_qoldiq"])

        # Kunlik o'rtacha sotuv
        if jami_sotilgan > 0 and kunlar > 0:
            kunlik_sotuv = jami_sotilgan / Decimal(str(kunlar))
        else:
            kunlik_sotuv = Decimal("0")

        # Qolgan kunlar
        if kunlik_sotuv > 0:
            qolgan_kun = int(qoldiq / kunlik_sotuv)
        else:
            qolgan_kun = 999  # sotilmayotgan tovar

        # Holat aniqlash
        if qoldiq <= 0:
            holat = "tugagan"
        elif min_qoldiq > 0 and qoldiq <= min_qoldiq:
            holat = "kam"
        elif qolgan_kun <= 3:
            holat = "xavfli"
        elif qolgan_kun <= 7:
            holat = "ogohlantirish"
        elif qolgan_kun <= 14:
            holat = "diqqat"
        else:
            holat = "yaxshi"

        # Buyurtma kerakmi
        buyurtma_kerak = holat in ("tugagan", "kam", "xavfli", "ogohlantirish")

        # Buyurtma miqdori (2 haftalik zaxira)
        buyurtma_miqdor = 0
        if buyurtma_kerak and kunlik_sotuv > 0:
            kerakli = kunlik_sotuv * Decimal("14")  # 2 hafta
            buyurtma_miqdor = float(max(kerakli - qoldiq, Decimal("0")))

        natijalar.append({
            "id": r["id"],
            "nomi": r["nomi"],
            "kategoriya": r["kategoriya"],
            "birlik": r["birlik"],
            "qoldiq": float(qoldiq),
            "min_qoldiq": float(min_qoldiq),
            # Web panel uchun alias (zaxira/min_zaxira)
            "zaxira": float(qoldiq),
            "min_zaxira": float(min_qoldiq),
            "kunlik_sotuv": round(float(kunlik_sotuv), 2),
            "jami_sotilgan_30kun": float(jami_sotilgan),
            "sotilgan": float(jami_sotilgan),  # alias
            "qolgan_kun": qolgan_kun if qolgan_kun < 999 else None,
            "kunlarga_yetadi": qolgan_kun if qolgan_kun < 999 else 999,
            "holat": holat,
            "buyurtma_kerak": buyurtma_kerak,
            "buyurtma_miqdor": round(buyurtma_miqdor, 1),
            "buyurtma_narx": round(float(D(r["olish_narxi"])) * buyurtma_miqdor)
                             if buyurtma_miqdor > 0 else 0,
            "olish_narxi": float(D(r["olish_narxi"])),
            "sotish_narxi": float(D(r["sotish_narxi"])),
            "ombor_qiymati": round(float(qoldiq) * float(D(r["olish_narxi"]))),
        })

    return natijalar


async def kam_qoldiq_xulosa(conn, uid: int) -> dict:
    """Kam qoldiq umumiy xulosa — dashboard uchun"""
    stats = await conn.fetchrow("""
        SELECT
            COUNT(*) FILTER(WHERE min_qoldiq > 0 AND qoldiq <= min_qoldiq) AS kam_soni,
            COUNT(*) FILTER(WHERE qoldiq <= 0) AS tugagan_soni,
            COUNT(*) AS jami_tovar,
            COALESCE(SUM(qoldiq * olish_narxi), 0) AS ombor_qiymati
        FROM tovarlar WHERE user_id = $1
    """, uid)

    return {
        "jami_tovar": int(stats["jami_tovar"]),
        "kam_qoldiq": int(stats["kam_soni"]),
        "tugagan": int(stats["tugagan_soni"]),
        "ombor_qiymati": float(stats["ombor_qiymati"]),
    }
