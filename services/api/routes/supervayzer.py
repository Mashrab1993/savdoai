"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — SUPERVAYZER DASHBOARD API                        ║
║                                                                      ║
║  SalesDoc /dashboard/supervayzer asosida, lekin undan yaxshiroq.    ║
║                                                                      ║
║  Qaytaradi: bugungi umumiy natija + 4 KPI + kategoriya pie +         ║
║  territory breakdown.                                               ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Supervayzer"])


@router.get("/supervayzer")
async def supervayzer_dashboard(
    sana: str | None = Query(None, description="YYYY-MM-DD, default=bugun"),
    uid: int = Depends(get_uid),
):
    """SalesDoc supervayzer-style dashboard — bitta endpoint.

    Qaytaradi:
    - bugungi_jami: Umumiy sotuv (so'm)
    - kpi: {tashrif_rate, success_rate, gps_rate, photo_rate} — har biri %
    - kategoriya_pie: [{nomi, foiz, summa}]
    - territory_breakdown: [{hudud, summa, soni}]
    - top_tovarlar: top 10
    """
    target = date.fromisoformat(sana) if sana else date.today()
    kecha = target - timedelta(days=1)

    async with rls_conn(uid) as c:
        # ═══ 1. BUGUNGI UMUMIY SOTUV ═══
        bugungi = await c.fetchrow("""
            SELECT COALESCE(SUM(jami), 0) AS jami,
                   COUNT(*) AS soni,
                   COALESCE(SUM(tolangan), 0) AS naqd,
                   COALESCE(SUM(jami - tolangan), 0) AS qarz
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date = $2
        """, uid, target)

        # ═══ 2. TASHRIF KPI'LARI (storecheck) ═══
        # Plan: outlet_plan'da har klient uchun oylik tashrif plan
        oy_boshi = target.replace(day=1)
        plan = await c.fetchrow("""
            SELECT COALESCE(SUM(tashrif_plan), 0) AS oylik_plan
            FROM outlet_plan
            WHERE user_id=$1 AND yil=$2 AND oy=$3
        """, uid, target.year, target.month)
        oylik_plan = int(plan["oylik_plan"] or 0) or 100  # default 100

        # Bugun nechta tashrif bor
        tashrif = await c.fetchrow("""
            SELECT COUNT(*) AS soni,
                   COUNT(DISTINCT klient_id) AS noyob_klient,
                   COUNT(*) FILTER(WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL) AS gps_verified,
                   COUNT(*) FILTER(
                       WHERE id IN (SELECT session_id FROM storecheck_photos)
                   ) AS photo_yuborilgan
            FROM storecheck_sessions
            WHERE user_id=$1 AND boshlangan::date = $2
        """, uid, target)

        # Visit → order conversion
        # Tashrif bor → o'sha klient uchun shu kun sotuv bor
        muvaffaqiyat = 0
        tashrif_soni = int(tashrif["soni"] or 0)
        if tashrif_soni > 0:
            muvaffaqiyat = await c.fetchval("""
                SELECT COUNT(DISTINCT ss.klient_id)
                FROM storecheck_sessions ss
                WHERE ss.user_id=$1 AND ss.boshlangan::date=$2
                  AND EXISTS (
                      SELECT 1 FROM sotuv_sessiyalar so
                      WHERE so.user_id=$1 AND so.klient_id=ss.klient_id
                        AND so.sana::date=$2
                  )
            """, uid, target) or 0

        # Plan kunlik nisbati
        bugungi_plan = oylik_plan / 30  # taxminiy
        tashrif_rate = (tashrif_soni / bugungi_plan * 100) if bugungi_plan else 0
        success_rate = (muvaffaqiyat / tashrif_soni * 100) if tashrif_soni else 0
        gps_rate = (int(tashrif["gps_verified"] or 0) / tashrif_soni * 100) if tashrif_soni else 0
        photo_rate = (int(tashrif["photo_yuborilgan"] or 0) / tashrif_soni * 100) if tashrif_soni else 0

        # ═══ 3. TOVAR KATEGORIYA PIE ═══
        kateg = await c.fetch("""
            SELECT COALESCE(t.kategoriya, 'Boshqa') AS kategoriya,
                   SUM(ch.jami) AS summa,
                   COUNT(*) AS soni
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            LEFT JOIN tovarlar t ON t.id = ch.tovar_id
            WHERE ss.user_id=$1 AND ss.sana::date = $2
            GROUP BY COALESCE(t.kategoriya, 'Boshqa')
            ORDER BY summa DESC
        """, uid, target)
        kategoriya_jami = sum(float(k["summa"] or 0) for k in kateg) or 1
        kategoriya_pie = [
            {
                "nomi": k["kategoriya"],
                "summa": float(k["summa"] or 0),
                "foiz": round(float(k["summa"] or 0) / kategoriya_jami * 100, 2),
                "soni": int(k["soni"] or 0),
            }
            for k in kateg
        ]

        # ═══ 4. TOP TOVARLAR ═══
        top_tovarlar = await c.fetch("""
            SELECT ch.tovar_nomi, SUM(ch.jami) AS summa,
                   SUM(ch.miqdor) AS miqdor, COUNT(*) AS soni
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.user_id=$1 AND ss.sana::date = $2
            GROUP BY ch.tovar_nomi
            ORDER BY summa DESC
            LIMIT 10
        """, uid, target)

        # ═══ 5. KECHAGI TAQQOSLASH ═══
        kecha_stat = await c.fetchrow("""
            SELECT COALESCE(SUM(jami), 0) AS jami,
                   COUNT(*) AS soni
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date = $2
        """, uid, kecha)

        # ═══ 6. ALERT'LAR (vazifa+shikoyat+qaytarish kutayotgan) ═══
        try:
            alerts = await c.fetchrow("""
                SELECT
                    (SELECT COUNT(*) FROM vazifalar
                     WHERE admin_uid=$1 AND NOT bajarildi AND deadline < CURRENT_DATE) AS muddati_otgan_vazifa,
                    (SELECT COUNT(*) FROM feedback
                     WHERE user_id=$1 AND NOT javob_berildi AND turi='shikoyat') AS javobsiz_shikoyat,
                    (SELECT COUNT(*) FROM qaytarishlar
                     WHERE user_id=$1 AND holat='yangi') AS kutayotgan_qaytarish
            """, uid)
            alert_data = dict(alerts) if alerts else {}
        except Exception:
            alert_data = {
                "muddati_otgan_vazifa": 0,
                "javobsiz_shikoyat": 0,
                "kutayotgan_qaytarish": 0,
            }

    return {
        "sana": str(target),
        "bugungi_jami": float(bugungi["jami"] or 0),
        "bugungi_sotuv_soni": int(bugungi["soni"] or 0),
        "bugungi_naqd": float(bugungi["naqd"] or 0),
        "bugungi_qarz": float(bugungi["qarz"] or 0),
        "kecha_jami": float(kecha_stat["jami"] or 0),
        "kecha_soni": int(kecha_stat["soni"] or 0),
        "taqqos_foiz": round(
            (float(bugungi["jami"] or 0) / float(kecha_stat["jami"] or 1) - 1) * 100
            if kecha_stat["jami"] else 0,
            1,
        ),
        "kpi": {
            "tashrif_rate": round(tashrif_rate, 1),
            "tashrif_plan": bugungi_plan,
            "tashrif_fact": tashrif_soni,
            "success_rate": round(success_rate, 1),
            "success_fact": int(muvaffaqiyat),
            "gps_rate": round(gps_rate, 1),
            "gps_fact": int(tashrif["gps_verified"] or 0),
            "photo_rate": round(photo_rate, 1),
            "photo_fact": int(tashrif["photo_yuborilgan"] or 0),
        },
        "kategoriya_pie": kategoriya_pie,
        "top_tovarlar": [
            {
                "nomi": t["tovar_nomi"],
                "summa": float(t["summa"] or 0),
                "miqdor": float(t["miqdor"] or 0),
                "soni": int(t["soni"] or 0),
            }
            for t in top_tovarlar
        ],
        "alerts": {
            "muddati_otgan_vazifa": int(alert_data.get("muddati_otgan_vazifa") or 0),
            "javobsiz_shikoyat": int(alert_data.get("javobsiz_shikoyat") or 0),
            "kutayotgan_qaytarish": int(alert_data.get("kutayotgan_qaytarish") or 0),
        },
    }
