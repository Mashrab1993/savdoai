"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — EXPEDITOR KPI (SalesDoc /dashboard/kpiExpeditor) ║
║                                                                      ║
║  Har shogird bo'yicha birlashtirilgan KPI:                          ║
║  - Sotuv: soni + summasi                                            ║
║  - Storecheck: tashrif soni + ortacha vaqt                          ║
║  - Vazifalar: berilgan/bajarilgan %                                 ║
║  - Xarajat: kunlik/oylik limitlar bilan                             ║
║  - Plan: plan vs natija (agar plan bor)                             ║
║                                                                      ║
║  Admin har shogirdga bir sahifada hamma ko'rsatkichni ko'radi.      ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta

log = logging.getLogger(__name__)


async def shogird_kpi(conn, admin_uid: int, shogird_id: int,
                       kun: int = 30) -> dict:
    """Bitta shogird uchun to'liq KPI (oxirgi N kun)."""
    # Shogird ma'lumoti
    shogird = await conn.fetchrow("""
        SELECT id, ism, telefon, lavozim, kunlik_limit, oylik_limit,
               faol, yaratilgan
        FROM shogirdlar
        WHERE id=$1 AND admin_uid=$2
    """, shogird_id, admin_uid)
    if not shogird:
        return {}

    chegara_dt = datetime.now() - timedelta(days=kun)
    date.today() - timedelta(days=kun)
    bugun = date.today()
    oy_boshi = bugun.replace(day=1)

    # 1. SOTUV (shogirdlar.telegram_uid orqali users tomonidan)
    # SavdoAI'da sotuv_sessiyalar shogird_id bor bo'lsa ishlatamiz
    sotuv = await conn.fetchrow("""
        SELECT COUNT(*) AS soni,
               COALESCE(SUM(jami), 0) AS jami,
               COALESCE(SUM(tolangan), 0) AS naqd,
               COALESCE(SUM(jami - tolangan), 0) AS qarz,
               COUNT(DISTINCT klient_id) AS noyob_klient
        FROM sotuv_sessiyalar
        WHERE user_id=$1 AND shogird_id=$2 AND sana >= $3
    """, admin_uid, shogird_id, chegara_dt)

    # 2. STORECHECK (tashrif)
    tashrif = await conn.fetchrow("""
        SELECT COUNT(*) AS soni,
               COUNT(DISTINCT klient_id) AS noyob_klient,
               AVG(EXTRACT(EPOCH FROM (tugagan - boshlangan))/60) AS ortacha_daqiqa
        FROM storecheck_sessions
        WHERE user_id=$1 AND shogird_id=$2 AND boshlangan >= $3
    """, admin_uid, shogird_id, chegara_dt)

    # 3. VAZIFALAR
    vazifa = await conn.fetchrow("""
        SELECT COUNT(*) AS jami,
               COUNT(*) FILTER(WHERE bajarildi) AS bajarildi,
               COUNT(*) FILTER(WHERE NOT bajarildi AND deadline < CURRENT_DATE) AS muddati_otgan
        FROM vazifalar
        WHERE admin_uid=$1 AND shogird_id=$2 AND yaratilgan >= $3
    """, admin_uid, shogird_id, chegara_dt)

    # 4. XARAJAT (shogirdlar limitlar bilan)
    xarajat = await conn.fetchrow("""
        SELECT COALESCE(SUM(summa), 0) AS oylik_jami,
               COUNT(*) AS soni,
               COUNT(*) FILTER(WHERE tasdiqlangan) AS tasdiqlangan_soni,
               COUNT(*) FILTER(WHERE NOT tasdiqlangan AND NOT bekor_qilingan) AS kutilayotgan
        FROM xarajatlar
        WHERE admin_uid=$1 AND shogird_id=$2 AND NOT bekor_qilingan
          AND sana >= $3
    """, admin_uid, shogird_id, oy_boshi)

    # 5. PLAN (agar oylik plan bo'lsa)
    plan = None
    try:
        from shared.services.planning import plan_progress
        plan = await plan_progress(conn, admin_uid, bugun.year, bugun.month,
                                     shogird_id=shogird_id)
    except Exception as e:
        log.debug("Plan progress xato: %s", e)

    # Xulosa score (100 ballik)
    # Sotuv 30%, Tashrif 20%, Vazifa 30%, Xarajat (limit ichida) 20%
    score = 0.0
    sotuv_score = 0
    if plan and plan.get("plan_mavjud"):
        sotuv_score = min(100, plan["sotuv"]["foiz"])
    else:
        # Plan yo'q — umumiy sotuv bor/yo'q
        sotuv_score = min(100, int(sotuv["soni"] or 0) * 5)
    tashrif_score = min(100, int(tashrif["soni"] or 0) * 10)  # 10 ta = 100
    vazifa_jami = int(vazifa["jami"] or 0)
    vazifa_score = (int(vazifa["bajarildi"] or 0) / vazifa_jami * 100) if vazifa_jami else 100
    oylik_limit = float(shogird["oylik_limit"])
    oylik_xarajat = float(xarajat["oylik_jami"] or 0)
    xarajat_foiz = (oylik_xarajat / oylik_limit * 100) if oylik_limit else 0
    xarajat_score = 100 if xarajat_foiz <= 80 else max(0, 100 - (xarajat_foiz - 80) * 5)

    score = (sotuv_score * 0.3 + tashrif_score * 0.2 +
             vazifa_score * 0.3 + xarajat_score * 0.2)

    return {
        "shogird_id": shogird_id,
        "ism": shogird["ism"],
        "telefon": shogird["telefon"],
        "lavozim": shogird["lavozim"],
        "faol": shogird["faol"],
        "kun": kun,
        "sotuv": {
            "soni": int(sotuv["soni"] or 0),
            "jami": float(sotuv["jami"] or 0),
            "naqd": float(sotuv["naqd"] or 0),
            "qarz": float(sotuv["qarz"] or 0),
            "noyob_klient": int(sotuv["noyob_klient"] or 0),
            "score": round(sotuv_score, 1),
        },
        "tashrif": {
            "soni": int(tashrif["soni"] or 0),
            "noyob_klient": int(tashrif["noyob_klient"] or 0),
            "ortacha_daqiqa": float(tashrif["ortacha_daqiqa"] or 0),
            "score": round(tashrif_score, 1),
        },
        "vazifa": {
            "jami": vazifa_jami,
            "bajarildi": int(vazifa["bajarildi"] or 0),
            "muddati_otgan": int(vazifa["muddati_otgan"] or 0),
            "bajarish_foiz": round(vazifa_score, 1),
            "score": round(vazifa_score, 1),
        },
        "xarajat": {
            "oylik_jami": oylik_xarajat,
            "oylik_limit": oylik_limit,
            "oylik_foiz": round(xarajat_foiz, 1),
            "soni": int(xarajat["soni"] or 0),
            "tasdiqlangan_soni": int(xarajat["tasdiqlangan_soni"] or 0),
            "kutilayotgan": int(xarajat["kutilayotgan"] or 0),
            "score": round(xarajat_score, 1),
        },
        "plan": plan,
        "umumiy_score": round(score, 1),
        "holat": _holat(score),
    }


def _holat(score: float) -> str:
    """Score → emoji+matn."""
    if score >= 85:
        return "🏆 A'lo"
    elif score >= 70:
        return "🟢 Yaxshi"
    elif score >= 50:
        return "🟡 O'rtacha"
    elif score >= 30:
        return "🟠 Zaif"
    else:
        return "🔴 Juda zaif"


async def barcha_shogirdlar_kpi(conn, admin_uid: int, kun: int = 30) -> list[dict]:
    """Barcha faol shogirdlar uchun KPI (umumiy_score bo'yicha saralangan)."""
    shogirdlar = await conn.fetch("""
        SELECT id FROM shogirdlar
        WHERE admin_uid=$1 AND faol=TRUE
        ORDER BY id
    """, admin_uid)
    natijalar = []
    for s in shogirdlar:
        kpi = await shogird_kpi(conn, admin_uid, s["id"], kun=kun)
        if kpi:
            natijalar.append(kpi)
    # Score bo'yicha saralash
    natijalar.sort(key=lambda x: x["umumiy_score"], reverse=True)
    return natijalar
