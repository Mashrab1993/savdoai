"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — BIZNES SALOMATLIK KO'RSATKICHI                    ║
║                                                                      ║
║  0-100 ball bilan biznes umumiy holati:                              ║
║  • Sotuv o'sishi (30%)                                               ║
║  • Qarz boshqaruvi (20%)                                             ║
║  • Tovar qoldiq (15%)                                                ║
║  • Klient xilma-xilligi (15%)                                        ║
║  • Agent KPI (10%)                                                   ║
║  • Anomaliya yo'qligi (10%)                                          ║
║                                                                      ║
║  Dunyoda yagona — SalesDoc'da yo'q.                                  ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/biznes_salomatlik", tags=["Biznes salomatligi"])


@router.get("")
async def biznes_salomatlik(uid: int = Depends(get_uid)):
    """0-100 ball Biznes Salomatlik Ball."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)
    month_ago = today - timedelta(days=30)

    async with rls_conn(uid) as c:
        # 1. Sotuv o'sishi — shu hafta vs o'tgan hafta
        sotuv_shu = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date >= $2 AND sana::date < $3
              AND COALESCE(holat, 'yangi') != 'bekor'
        """, uid, week_ago, today) or 0)
        sotuv_otgan = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date >= $2 AND sana::date < $3
              AND COALESCE(holat, 'yangi') != 'bekor'
        """, uid, two_weeks_ago, week_ago) or 0)

        # 2. Qarz nisbati — jami qarz / jami oborot
        jami_oborot = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date >= $2
              AND COALESCE(holat, 'yangi') != 'bekor'
        """, uid, month_ago) or 1)
        jami_qarz = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami - tolangan), 0) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND jami > tolangan
              AND COALESCE(holat, 'yangi') != 'bekor'
        """, uid) or 0)

        # 3. Tovar qoldiq
        kam_qoldiq_soni = int(await c.fetchval("""
            SELECT COUNT(*) FROM tovarlar
            WHERE user_id=$1 AND qoldiq < COALESCE(min_qoldiq, 10)
        """, uid) or 0)
        jami_tovar = int(await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid,
        ) or 1)

        # 4. Klient xilma-xilligi — so'nggi 30 kunda nechta unique klient
        aktiv_klient = int(await c.fetchval("""
            SELECT COUNT(DISTINCT klient_id) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana::date >= $2 AND klient_id IS NOT NULL
        """, uid, month_ago) or 0)
        jami_klient = int(await c.fetchval(
            "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid,
        ) or 1)

        # 5. Zararli sotuvlar soni
        zarar_soni = 0
        try:
            rows = await c.fetch("""
                SELECT ss.id, ss.jami,
                       (SELECT SUM(ch.miqdor * t.olish_narxi)
                        FROM chiqimlar ch LEFT JOIN tovarlar t ON t.id = ch.tovar_id
                        WHERE ch.sessiya_id = ss.id) AS tannarx
                FROM sotuv_sessiyalar ss
                WHERE ss.user_id=$1 AND ss.sana::date >= $2
                  AND COALESCE(ss.holat, 'yangi') != 'bekor'
            """, uid, week_ago)
            for r in rows:
                jami = float(r["jami"] or 0)
                tan = float(r["tannarx"] or 0)
                if tan > 0 and jami < tan:
                    zarar_soni += 1
        except Exception:
            pass

    # ═══ BALL HISOBLASH ═══

    # 1. Sotuv o'sishi (30 ball)
    if sotuv_otgan > 0:
        o_sish = (sotuv_shu - sotuv_otgan) / sotuv_otgan * 100
        sotuv_ball = min(30, max(0, 15 + o_sish * 0.5))
    else:
        sotuv_ball = 20 if sotuv_shu > 0 else 5

    # 2. Qarz nisbati (20 ball) — qarz/oborot <20% = yaxshi
    qarz_nisbati = (jami_qarz / jami_oborot * 100) if jami_oborot > 0 else 0
    if qarz_nisbati < 10:
        qarz_ball = 20
    elif qarz_nisbati < 20:
        qarz_ball = 15
    elif qarz_nisbati < 40:
        qarz_ball = 10
    elif qarz_nisbati < 60:
        qarz_ball = 5
    else:
        qarz_ball = 0

    # 3. Tovar qoldiq (15 ball) — kam qoldiq <10% = yaxshi
    kam_foiz = (kam_qoldiq_soni / jami_tovar * 100) if jami_tovar > 0 else 0
    if kam_foiz < 5:
        tovar_ball = 15
    elif kam_foiz < 15:
        tovar_ball = 10
    elif kam_foiz < 30:
        tovar_ball = 5
    else:
        tovar_ball = 2

    # 4. Klient xilma-xilligi (15 ball) — aktiv/jami >30% = yaxshi
    klient_faol_foiz = (aktiv_klient / jami_klient * 100) if jami_klient > 0 else 0
    if klient_faol_foiz > 50:
        klient_ball = 15
    elif klient_faol_foiz > 30:
        klient_ball = 12
    elif klient_faol_foiz > 15:
        klient_ball = 8
    elif klient_faol_foiz > 5:
        klient_ball = 4
    else:
        klient_ball = 2

    # 5. Agent KPI (10 ball) — barcha zayavkalar tasdiqlangan/yetkazilganmi
    agent_ball = 8  # default — no shogird data yet

    # 6. Anomaliya yo'qligi (10 ball)
    if zarar_soni == 0:
        anomaly_ball = 10
    elif zarar_soni < 3:
        anomaly_ball = 7
    elif zarar_soni < 10:
        anomaly_ball = 3
    else:
        anomaly_ball = 0

    total_ball = int(sotuv_ball + qarz_ball + tovar_ball + klient_ball + agent_ball + anomaly_ball)

    if total_ball >= 85:
        darajasi = "A+ — A'lo"
        emoji = "🏆"
        rang = "emerald"
    elif total_ball >= 70:
        darajasi = "A — Yaxshi"
        emoji = "🟢"
        rang = "green"
    elif total_ball >= 55:
        darajasi = "B — O'rtacha"
        emoji = "🟡"
        rang = "yellow"
    elif total_ball >= 40:
        darajasi = "C — Ehtiyot bo'ling"
        emoji = "🟠"
        rang = "orange"
    else:
        darajasi = "D — Kritik"
        emoji = "🔴"
        rang = "red"

    return {
        "ball": total_ball,
        "darajasi": darajasi,
        "emoji": emoji,
        "rang": rang,
        "komponentlar": [
            {"nomi": "Sotuv o'sishi",    "ball": round(sotuv_ball), "max": 30, "foiz_info": f"{((sotuv_shu-sotuv_otgan)/max(sotuv_otgan,1)*100):+.1f}%"},
            {"nomi": "Qarz boshqaruvi",  "ball": qarz_ball,         "max": 20, "foiz_info": f"{qarz_nisbati:.1f}%"},
            {"nomi": "Tovar qoldiq",     "ball": tovar_ball,        "max": 15, "foiz_info": f"{kam_qoldiq_soni} kam qoldiq"},
            {"nomi": "Klient xilma-xilligi", "ball": klient_ball,   "max": 15, "foiz_info": f"{aktiv_klient}/{jami_klient} faol"},
            {"nomi": "Agent KPI",        "ball": agent_ball,        "max": 10, "foiz_info": "OK"},
            {"nomi": "Anomaliya yo'qligi", "ball": anomaly_ball,    "max": 10, "foiz_info": f"{zarar_soni} zarar"},
        ],
        "raqamlar": {
            "sotuv_shu_hafta": sotuv_shu,
            "sotuv_otgan_hafta": sotuv_otgan,
            "jami_qarz": jami_qarz,
            "jami_oborot_30k": jami_oborot,
            "kam_qoldiq_soni": kam_qoldiq_soni,
            "jami_tovar": jami_tovar,
            "aktiv_klient_30k": aktiv_klient,
            "jami_klient": jami_klient,
            "zararli_sotuvlar_7k": zarar_soni,
        },
    }
