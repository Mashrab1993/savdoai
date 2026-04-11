"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — AQLLI KUNLIK REJALASHTIRUVCHI                        ║
║                                                                          ║
║  AI bilan kunlik ish rejasi — ertalab ochganda tayyor:                  ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────┐                   ║
║  │  📋 BUGUNGI REJA                                 │                   ║
║  ├──────────────────────────────────────────────────┤                   ║
║  │  🔴 1. Akmal do'koni — 3 kun qarz eslatmasi     │                   ║
║  │  🟡 2. Sardor aka — 7 kun sotib olmagan          │                   ║
║  │  🟢 3. Nilufar market — odatiy sotuv             │                   ║
║  │  📦 4. Ombor tekshirish — 5 tovar tugayapti      │                   ║
║  │  💰 5. Nasriddin — qarz yig'ish (120,000)        │                   ║
║  ├──────────────────────────────────────────────────┤                   ║
║  │  PROGNOZ: 8 ta sotuv, ~2.5M so'm               │                   ║
║  │  MARSHRUT: optimallashtirilgan (12.3 km)         │                   ║
║  └──────────────────────────────────────────────────┘                   ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import date, timedelta, datetime
from decimal import Decimal
from typing import List

log = logging.getLogger(__name__)


async def kunlik_reja(conn, uid: int) -> dict:
    """AI bilan kunlik ish rejasi yaratish.

    5 ta manba asosida:
    1. Qarz eslatmalari (kechikkanlar)
    2. Churn xavfi yuqori klientlar
    3. Odatiy tashrif kuni klientlari (hafta kuni bo'yicha)
    4. Kam qoldiqli tovarlar
    5. Talab prognozi asosida buyurtma keraklar

    Returns:
        {vazifalar: [...], prognoz: {...}, statistika: {...}}
    """
    bugun = date.today()
    haftakun = bugun.weekday()  # 0=Du, 6=Yak
    vazifalar = []

    # ═══ 1. QARZ ESLATMALARI (eng muhim) ═══
    qarzlar = await conn.fetch("""
        SELECT s.id, s.qarz, s.sana, k.ism, k.telefon, k.id AS klient_id,
               EXTRACT(DAY FROM NOW() - s.sana) AS kechikkan_kun
        FROM sotuv_sessiyalar s
        JOIN klientlar k ON k.id = s.klient_id
        WHERE s.user_id=$1 AND s.qarz > 0
        ORDER BY s.sana ASC
        LIMIT 10
    """, uid)

    for q in qarzlar:
        kechikkan = int(q["kechikkan_kun"] or 0)
        muhimlik = "kritik" if kechikkan > 30 else "yuqori" if kechikkan > 14 else "oddiy"
        vazifalar.append({
            "turi": "qarz",
            "muhimlik": muhimlik,
            "emoji": "🔴" if muhimlik == "kritik" else "🟡" if muhimlik == "yuqori" else "💳",
            "sarlavha": f"Qarz yig'ish: {q['nom']}",
            "tafsilot": f"{q['qarz']:,.0f} so'm • {kechikkan} kun kechikkan",
            "klient_id": q["klient_id"],
            "klient_nomi": q["nom"],
            "summa": str(q["qarz"]),
        })

    # ═══ 2. SOTIB OLMAGAN KLIENTLAR (churn xavfi) ═══
    yoq_klientlar = await conn.fetch("""
        SELECT k.id, k.ism, k.telefon,
               MAX(s.sana) AS oxirgi_sotuv,
               EXTRACT(DAY FROM NOW() - MAX(s.sana)) AS kun_soni
        FROM klientlar k
        JOIN sotuv_sessiyalar s ON s.klient_id = k.id AND s.user_id = k.user_id
        WHERE k.user_id=$1
        GROUP BY k.id, k.ism, k.telefon
        HAVING MAX(s.sana) < NOW() - INTERVAL '7 days'
            AND MAX(s.sana) > NOW() - INTERVAL '60 days'
        ORDER BY MAX(s.sana) ASC
        LIMIT 5
    """, uid)

    for k in yoq_klientlar:
        kun = int(k["kun_soni"] or 0)
        vazifalar.append({
            "turi": "qayta_aloqa",
            "muhimlik": "yuqori" if kun > 14 else "oddiy",
            "emoji": "📞",
            "sarlavha": f"Qayta aloqa: {k['nom']}",
            "tafsilot": f"{kun} kun sotib olmagan",
            "klient_id": k["id"],
            "klient_nomi": k["nom"],
        })

    # ═══ 3. KAM QOLDIQLI TOVARLAR ═══
    kam = await conn.fetch("""
        SELECT id, nomi, qoldiq FROM tovarlar
        WHERE user_id=$1 AND faol=TRUE AND qoldiq > 0 AND qoldiq <= 5
        ORDER BY qoldiq ASC LIMIT 5
    """, uid)

    if kam:
        tovar_list = ", ".join(f"{t['nomi']}({t['qoldiq']})" for t in kam)
        vazifalar.append({
            "turi": "ombor",
            "muhimlik": "yuqori",
            "emoji": "📦",
            "sarlavha": f"{len(kam)} ta tovar tugayapti",
            "tafsilot": tovar_list[:100],
        })

    # ═══ 4. SOTUV PROGNOZI ═══
    haftalik = await conn.fetchrow("""
        SELECT
            COUNT(*) AS soni,
            COALESCE(SUM(jami), 0) AS summa,
            COALESCE(AVG(jami), 0) AS ortacha
        FROM sotuv_sessiyalar
        WHERE user_id=$1
            AND EXTRACT(DOW FROM sana) = $2
            AND sana >= NOW() - INTERVAL '30 days'
    """, uid, haftakun)

    prognoz_soni = int(haftalik["soni"] or 0) // 4  # 4 hafta o'rtacha
    prognoz_summa = float(haftalik["summa"] or 0) / 4

    # ═══ MUHIMLIK BO'YICHA TARTIBLASH ═══
    muhimlik_tartib = {"kritik": 0, "yuqori": 1, "oddiy": 2}
    vazifalar.sort(key=lambda v: muhimlik_tartib.get(v.get("muhimlik", "oddiy"), 2))

    # Raqamlash
    for i, v in enumerate(vazifalar):
        v["tartib"] = i + 1

    return {
        "sana": bugun.isoformat(),
        "hafta_kuni": ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"][haftakun],
        "vazifalar": vazifalar,
        "vazifalar_soni": len(vazifalar),
        "prognoz": {
            "sotuv_soni": prognoz_soni,
            "sotuv_summa": round(prognoz_summa, 0),
            "ortacha_chek": round(float(haftalik["ortacha"] or 0), 0),
        },
        "statistika": {
            "qarz_yigish": len([v for v in vazifalar if v["turi"] == "qarz"]),
            "qayta_aloqa": len([v for v in vazifalar if v["turi"] == "qayta_aloqa"]),
            "ombor_ogoh": len([v for v in vazifalar if v["turi"] == "ombor"]),
        },
    }
