"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — KPI ENGINE                                   ║
║  SalesDoc/SmartUp modelidan ilhomlangan                         ║
║                                                                  ║
║  XUSUSIYATLAR:                                                   ║
║  ✅ Agent kunlik/haftalik/oylik KPI                             ║
║  ✅ Target vs Actual solishtirish                                ║
║  ✅ A/B/C reyting (auto-hisoblash)                              ║
║  ✅ Top performer leaderboard                                    ║
║  ✅ Trend tahlili (o'sish/tushish)                               ║
║  ✅ Badge tizimi (gamification)                                  ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Optional
from collections import defaultdict

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

# Badge qoidalari
BADGES = {
    "yangi_boshlovchi":  {"min_sotuv": 0,    "emoji": "🌱", "nomi": "Yangi boshlovchi"},
    "faol_sotuvchi":     {"min_sotuv": 50,   "emoji": "⭐", "nomi": "Faol sotuvchi"},
    "kuchli_sotuvchi":   {"min_sotuv": 200,  "emoji": "🔥", "nomi": "Kuchli sotuvchi"},
    "super_sotuvchi":    {"min_sotuv": 500,  "emoji": "💎", "nomi": "Super sotuvchi"},
    "million_sotuvchi":  {"min_sotuv": 1000, "emoji": "🏆", "nomi": "Million sotuvchi"},
    "qarz_yiguvchi":     {"min_qarz_yig": 10, "emoji": "💰", "nomi": "Qarz yig'uvchi"},
    "yangi_klient":      {"min_klient": 20,   "emoji": "👥", "nomi": "Klient magnit"},
    "tez_sotuvchi":      {"min_kunlik": 10,    "emoji": "⚡", "nomi": "Tezkor sotuvchi"},
}


async def agent_kpi(conn, uid: int, kunlar: int = 30) -> dict:
    """
    Agent KPI hisoblash — kunlik/haftalik/oylik.

    Qaytaradi:
    {
        "sotuv_soni", "sotuv_jami", "ortacha_chek",
        "klient_soni", "yangi_klientlar",
        "qarz_yigildi", "qarz_berildi",
        "foyda", "margin",
        "kunlik_ortacha", "reyting", "badge",
        "trend", "target_foiz"
    }
    """
    # Asosiy sotuv ko'rsatkichlari
    sotuv = await conn.fetchrow("""
        SELECT
            COUNT(*) AS soni,
            COALESCE(SUM(jami), 0) AS jami,
            COALESCE(SUM(tolangan), 0) AS tolangan,
            COALESCE(SUM(qarz), 0) AS qarz,
            COUNT(DISTINCT klient_ismi) AS klient_soni
        FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND sana >= NOW() - make_interval(days => $2)
    """, uid, kunlar)

    # Yangi klientlar
    yangi_klientlar = await conn.fetchval("""
        SELECT COUNT(*) FROM klientlar
        WHERE user_id = $1
          AND yaratilgan >= NOW() - make_interval(days => $2)
    """, uid, kunlar) or 0

    # Foyda
    foyda = await conn.fetchval("""
        SELECT COALESCE(SUM(
            (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor
        ), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ch.user_id = $1
          AND ss.sana >= NOW() - make_interval(days => $2)
    """, uid, kunlar) or 0

    # Qarz yig'ildi (to'langan)
    qarz_yigildi = await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0) FROM qarzlar
        WHERE user_id = $1
          AND yangilangan >= NOW() - make_interval(days => $2)
          AND tolangan > 0
    """, uid, kunlar) or 0

    # Oldingi davr (taqqoslash uchun)
    oldingi = await conn.fetchrow("""
        SELECT
            COUNT(*) AS soni,
            COALESCE(SUM(jami), 0) AS jami
        FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND sana >= NOW() - make_interval(days => $2 * 2)
          AND sana < NOW() - make_interval(days => $2)
    """, uid, kunlar)

    # Hisoblash
    soni = int(sotuv["soni"])
    jami = float(sotuv["jami"])
    ortacha_chek = jami / soni if soni > 0 else 0
    kunlik_ortacha = jami / kunlar if kunlar > 0 else 0
    foyda_f = float(foyda)
    margin = (foyda_f / jami * 100) if jami > 0 else 0

    # Trend
    oldingi_jami = float(oldingi["jami"])
    if oldingi_jami > 0:
        trend_foiz = ((jami - oldingi_jami) / oldingi_jami) * 100
    else:
        trend_foiz = 100 if jami > 0 else 0
    trend = "o'sish" if trend_foiz > 5 else ("tushish" if trend_foiz < -5 else "barqaror")

    # Reyting (A/B/C/D)
    if soni >= 200 and margin >= 15:
        reyting = "A"
    elif soni >= 100 and margin >= 10:
        reyting = "B"
    elif soni >= 30:
        reyting = "C"
    else:
        reyting = "D"

    # Badge
    badge_list = []
    if soni >= 1000:
        badge_list.append(BADGES["million_sotuvchi"])
    elif soni >= 500:
        badge_list.append(BADGES["super_sotuvchi"])
    elif soni >= 200:
        badge_list.append(BADGES["kuchli_sotuvchi"])
    elif soni >= 50:
        badge_list.append(BADGES["faol_sotuvchi"])
    else:
        badge_list.append(BADGES["yangi_boshlovchi"])

    if yangi_klientlar >= 20:
        badge_list.append(BADGES["yangi_klient"])
    if float(qarz_yigildi) > 0:
        badge_list.append(BADGES["qarz_yiguvchi"])
    if soni / max(kunlar, 1) >= 10:
        badge_list.append(BADGES["tez_sotuvchi"])

    return {
        "davr_kun": kunlar,
        "sotuv_soni": soni,
        "sotuv_jami": round(jami),
        "ortacha_chek": round(ortacha_chek),
        "klient_soni": int(sotuv["klient_soni"]),
        "yangi_klientlar": yangi_klientlar,
        "qarz_berildi": float(sotuv["qarz"]),
        "qarz_yigildi": float(qarz_yigildi),
        "foyda": round(foyda_f),
        "margin_foiz": round(margin, 1),
        "kunlik_ortacha": round(kunlik_ortacha),
        "reyting": reyting,
        "trend": trend,
        "trend_foiz": round(trend_foiz, 1),
        "badges": [{"emoji": b["emoji"], "nomi": b["nomi"]} for b in badge_list],
    }


async def leaderboard(conn, kunlar: int = 30, limit: int = 10) -> list[dict]:
    """
    Top sotuvchilar reytingi — barcha foydalanuvchilar orasida.
    Admin uchun — barcha agentlarni solishtirish.
    """
    rows = await conn.fetch("""
        SELECT
            u.id AS uid,
            u.ism,
            u.dokon_nomi,
            COUNT(ss.id) AS sotuv_soni,
            COALESCE(SUM(ss.jami), 0) AS sotuv_jami,
            COALESCE(SUM(ss.tolangan), 0) AS tolangan,
            COUNT(DISTINCT ss.klient_ismi) AS klient_soni
        FROM users u
        LEFT JOIN sotuv_sessiyalar ss
            ON ss.user_id = u.id
            AND ss.sana >= NOW() - make_interval(days => $1)
        WHERE u.faol = TRUE
        GROUP BY u.id, u.ism, u.dokon_nomi
        HAVING COUNT(ss.id) > 0
        ORDER BY sotuv_jami DESC
        LIMIT $2
    """, kunlar, limit)

    natija = []
    for i, r in enumerate(rows, 1):
        soni = int(r["sotuv_soni"])
        jami = float(r["sotuv_jami"])

        if soni >= 200:
            reyting = "A"
        elif soni >= 100:
            reyting = "B"
        elif soni >= 30:
            reyting = "C"
        else:
            reyting = "D"

        natija.append({
            "oring": i,
            "uid": r["uid"],
            "ism": r["ism"],
            "dokon_nomi": r["dokon_nomi"],
            "sotuv_soni": soni,
            "sotuv_jami": round(jami),
            "klient_soni": int(r["klient_soni"]),
            "reyting": reyting,
        })

    return natija


async def kunlik_trend(conn, uid: int, kunlar: int = 14) -> list[dict]:
    """Kunlik sotuv trendi — grafik uchun."""
    rows = await conn.fetch("""
        SELECT
            (sana AT TIME ZONE 'Asia/Tashkent')::date AS kun,
            COUNT(*) AS soni,
            COALESCE(SUM(jami), 0) AS jami,
            COALESCE(SUM(qarz), 0) AS qarz,
            COALESCE(SUM(tolangan), 0) AS tolangan
        FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND sana >= NOW() - make_interval(days => $2)
        GROUP BY kun
        ORDER BY kun
    """, uid, kunlar)

    return [
        {
            "kun": str(r["kun"]),
            "soni": int(r["soni"]),
            "jami": float(r["jami"]),
            "qarz": float(r["qarz"]),
            "tolangan": float(r["tolangan"]),
        }
        for r in rows
    ]
