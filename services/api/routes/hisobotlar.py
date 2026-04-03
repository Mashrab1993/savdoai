"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — HISOBOT ROUTELARI                                ║
║  Kunlik, haftalik, oylik, foyda, statistika                 ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from shared.database.pool import rls_conn
from shared.cache.redis_cache import cache_ol, cache_yoz, TTL_HISOBOT
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Hisobotlar"])


@router.get("/hisobot/haftalik")
async def hisobot_haftalik(uid: int = Depends(get_uid)):
    """7 kunlik hisobot"""
    cache_k = f"hisobot:haftalik:{uid}"
    cached = await cache_ol(cache_k)
    if cached:
        return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0)     jami,
                   COALESCE(SUM(qarz),0)     qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        kr = await c.fetchrow("""
            SELECT COUNT(*) n, COALESCE(SUM(jami),0) jami
            FROM kirimlar WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        top_klientlar = [dict(r) for r in await c.fetch("""
            SELECT klient_ismi, SUM(jami) jami, COUNT(*) soni
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days' AND klient_ismi IS NOT NULL
            GROUP BY klient_ismi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr": "7 kun",
        "sotuv": {"soni": int(ch["n"]), "jami": float(ch["jami"]),
                  "qarz": float(ch["qarz"])},
        "kirim": {"soni": int(kr["n"]), "jami": float(kr["jami"])},
        "top_klientlar": top_klientlar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 6)
    return result


@router.get("/hisobot/oylik")
async def hisobot_oylik(uid: int = Depends(get_uid)):
    """30 kunlik hisobot"""
    cache_k = f"hisobot:oylik:{uid}"
    cached = await cache_ol(cache_k)
    if cached:
        return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0) jami,
                   COALESCE(SUM(qarz),0) qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        foyda = await c.fetchrow("""
            SELECT COALESCE(SUM(ch.jami - ch.miqdor*ch.olish_narxi),0) sof_foyda
            FROM chiqimlar ch WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        top5_tovar = [dict(r) for r in await c.fetch("""
            SELECT tovar_nomi, SUM(miqdor) miqdor, SUM(jami) jami
            FROM chiqimlar WHERE sana >= NOW() - INTERVAL '30 days'
            GROUP BY tovar_nomi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr": "30 kun",
        "sotuv": {"soni": int(ch["n"]), "jami": float(ch["jami"])},
        "sof_foyda": float(foyda["sof_foyda"] or 0),
        "top_tovarlar": top5_tovar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 12)
    return result


@router.get("/hisobot/foyda")
async def hisobot_foyda(kunlar: int = 30, uid: int = Depends(get_uid)):
    """Foyda tahlili — sof foyda, xarajatlar, top foyda/zarar tovarlar."""
    async with rls_conn(uid) as c:
        foyda = await c.fetchrow("""
            SELECT
                COALESCE(SUM(ch.jami), 0) AS brutto,
                COALESCE(SUM(ch.miqdor * ch.olish_narxi), 0) AS tannarx,
                COALESCE(SUM(ch.jami - ch.miqdor * ch.olish_narxi), 0) AS sof_foyda
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
        """, kunlar)

        xarajat = await c.fetchval("""
            SELECT COALESCE(SUM(summa), 0)
            FROM xarajatlar
            WHERE admin_uid=$1 AND tasdiqlangan=TRUE
              AND vaqt >= NOW() - make_interval(days => $2)
        """, uid, kunlar)

        top_foyda = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1) AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi ORDER BY foyda DESC LIMIT 5
        """, kunlar)

        top_zarar = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1) AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi
            HAVING SUM(ch.jami - ch.miqdor * ch.olish_narxi) < 0
            ORDER BY foyda ASC LIMIT 5
        """, kunlar)

    sof = float(foyda["sof_foyda"] or 0)
    xar = float(xarajat or 0)
    brutto = float(foyda["brutto"] or 0)
    return {
        "kunlar": kunlar,
        "brutto_sotuv": brutto,
        "tannarx": float(foyda["tannarx"] or 0),
        "sof_foyda": sof,
        "xarajatlar": xar,
        "toza_foyda": sof - xar,
        "margin_foiz": round(sof / brutto * 100, 1) if brutto > 0 else 0,
        "top_foyda": [{"nomi": r["tovar_nomi"], "foyda": float(r["foyda"]),
                       "miqdor": float(r["miqdor"])} for r in top_foyda],
        "top_zarar": [{"nomi": r["tovar_nomi"], "zarar": abs(float(r["foyda"])),
                       "miqdor": float(r["miqdor"])} for r in top_zarar],
    }


@router.get("/statistika", tags=["Dashboard"])
async def admin_statistika(uid: int = Depends(get_uid)):
    """Tizim statistikasi — admin uchun umumiy ko'rsatkichlar"""
    async with rls_conn(uid) as c:
        tovar_soni = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid) or 0
        klient_soni = await c.fetchval(
            "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid) or 0
        faol_qarz = await c.fetchval(
            "SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar "
            "WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0", uid) or 0
        bugun_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """, uid)
        hafta_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '7 days'
        """, uid)
        oy_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '30 days'
        """, uid)
        kam_qoldiq = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar "
            "WHERE user_id=$1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq", uid) or 0
        muddat_otgan = await c.fetchval(
            "SELECT COUNT(*) FROM qarzlar "
            "WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0 "
            "AND muddat IS NOT NULL AND muddat < NOW()", uid) or 0
    return {
        "tovar_soni": tovar_soni, "klient_soni": klient_soni,
        "faol_qarz": float(faol_qarz), "kam_qoldiq_soni": kam_qoldiq,
        "muddat_otgan_qarz": muddat_otgan,
        "bugun": {"soni": int(bugun_sotuv["soni"]), "jami": float(bugun_sotuv["jami"])},
        "hafta": {"soni": int(hafta_sotuv["soni"]), "jami": float(hafta_sotuv["jami"])},
        "oy":    {"soni": int(oy_sotuv["soni"]),    "jami": float(oy_sotuv["jami"])},
    }
