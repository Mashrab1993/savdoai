"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — ABC-XYZ INVENTAR MATRITSA                            ║
║                                                                          ║
║  Dunyo TOP-10 distribyutor tizimlarida ishlatiladi:                     ║
║  SAP, Oracle NetSuite, Microsoft Dynamics                                ║
║                                                                          ║
║  ABC tahlili (Pareto 80/20):                                             ║
║    A = Top 20% tovarlar (80% daromad)   → DOIM qoldiqda bo'lsin        ║
║    B = O'rta 30% tovarlar (15% daromad) → Muvozanatli saqlash          ║
║    C = Quyi 50% tovarlar (5% daromad)   → Minimal qoldiq               ║
║                                                                          ║
║  XYZ tahlili (sotuv barqarorligi):                                       ║
║    X = Barqaror sotuv (CV < 0.3)  → Prognoz oson, kam xavf            ║
║    Y = Mavsumiy sotuv (CV 0.3-0.7)→ Mavsumga tayyorlash               ║
║    Z = Tartibsiz sotuv (CV > 0.7) → Ehtiyotkor bo'lish                 ║
║                                                                          ║
║  MATRITSA:                                                               ║
║  ┌────┬──────────┬──────────┬──────────┐                                ║
║  │    │    X     │    Y     │    Z     │                                ║
║  ├────┼──────────┼──────────┼──────────┤                                ║
║  │ A  │ IDEAL    │ EHTIYOT  │ XAVFLI   │                                ║
║  │ B  │ YAXSHI   │ ODDIY    │ KAMAYTIR │                                ║
║  │ C  │ SAQLASH  │ MINIMUM  │ CHIQARISH│                                ║
║  └────┴──────────┴──────────┴──────────┘                                ║
║                                                                          ║
║  Buni HECH bir O'zbekiston raqobatchisi QILMAYDI.                       ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import math
from decimal import Decimal
from typing import List, Optional
from collections import defaultdict

log = logging.getLogger(__name__)
D = lambda v: Decimal(str(v or 0))

# ════════════════════════════════════════════════════════════
#  MATRITSA TAVSIFLARI
# ════════════════════════════════════════════════════════════

MATRITSA_TAVSIYA = {
    "AX": {"rang": "#059669", "emoji": "🟢", "nomi": "IDEAL",
            "tavsiya": "Eng muhim tovar — doim qoldiqda bo'lsin, buyurtma avtomatlashtirilsin"},
    "AY": {"rang": "#d97706", "emoji": "🟡", "nomi": "EHTIYOT",
            "tavsiya": "Yuqori daromad lekin mavsumiy — mavsumga tayyorlaning"},
    "AZ": {"rang": "#dc2626", "emoji": "🔴", "nomi": "XAVFLI",
            "tavsiya": "Ko'p daromad lekin tartibsiz — xavfni boshqaring, ortiqcha qoldiq saqlamang"},
    "BX": {"rang": "#10b981", "emoji": "🟢", "nomi": "YAXSHI",
            "tavsiya": "Barqaror daromad — avtomatik buyurtma qo'ying"},
    "BY": {"rang": "#6b7280", "emoji": "⚪", "nomi": "ODDIY",
            "tavsiya": "O'rtacha ahamiyat — standart qoldiq saqlang"},
    "BZ": {"rang": "#f59e0b", "emoji": "🟡", "nomi": "KAMAYTIRING",
            "tavsiya": "O'rtacha daromad lekin tartibsiz — qoldiqni kamaytiring"},
    "CX": {"rang": "#3b82f6", "emoji": "🔵", "nomi": "SAQLANG",
            "tavsiya": "Kam daromad lekin barqaror — minimal qoldiq yetarli"},
    "CY": {"rang": "#9ca3af", "emoji": "⚪", "nomi": "MINIMUM",
            "tavsiya": "Kam va mavsumiy — buyurtma bo'lgandagina sotib oling"},
    "CZ": {"rang": "#ef4444", "emoji": "🔴", "nomi": "CHIQARING",
            "tavsiya": "Eng past daromad + tartibsiz — assortimentdan chiqarishni ko'rib chiqing"},
}


# ════════════════════════════════════════════════════════════
#  ABC-XYZ HISOBLASH
# ════════════════════════════════════════════════════════════

async def abc_xyz_tahlil(conn, uid: int, kunlar: int = 90) -> dict:
    """Tovarlar uchun to'liq ABC-XYZ matritsa hisoblash.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        kunlar: tahlil davri (default 90 kun)

    Returns:
        {
            "tovarlar": [{nomi, abc, xyz, matritsa, summa, miqdor, cv, tavsiya}],
            "matritsa_statistika": {"AX": 5, "AY": 3, ...},
            "umumiy_tahlil": {...}
        }
    """
    # Oylik sotuv statistikasi (har bir tovar uchun)
    rows = await conn.fetch("""
        WITH oylik AS (
            SELECT
                c.tovar_id,
                c.tovar_nomi,
                DATE_TRUNC('week', c.sana) AS hafta,
                SUM(c.miqdor) AS miqdor,
                SUM(c.jami_summa) AS summa
            FROM chiqimlar c
            JOIN sotuv_sessiyalar s ON s.id = c.sessiya_id
            WHERE s.user_id = $1 AND c.sana >= NOW() - ($2 || ' days')::interval
            GROUP BY c.tovar_id, c.tovar_nomi, hafta
        )
        SELECT
            tovar_id,
            tovar_nomi,
            SUM(summa) AS jami_summa,
            SUM(miqdor) AS jami_miqdor,
            COUNT(DISTINCT hafta) AS faol_hafta,
            AVG(summa) AS ortacha_haftalik_summa,
            STDDEV(summa) AS stddev_summa,
            ARRAY_AGG(summa ORDER BY hafta) AS haftalik_summalar
        FROM oylik
        GROUP BY tovar_id, tovar_nomi
        HAVING SUM(summa) > 0
        ORDER BY SUM(summa) DESC
    """, uid, str(kunlar))

    if not rows:
        return {"tovarlar": [], "matritsa_statistika": {}, "umumiy_tahlil": {}}

    # ═══ ABC HISOBLASH (Pareto) ═══
    jami_daromad = sum(float(r["jami_summa"]) for r in rows)
    tovarlar = []
    kumulyativ = 0.0

    for r in rows:
        summa = float(r["jami_summa"])
        kumulyativ += summa
        foiz = (kumulyativ / jami_daromad * 100) if jami_daromad > 0 else 0

        if foiz <= 80:
            abc = "A"
        elif foiz <= 95:
            abc = "B"
        else:
            abc = "C"

        # ═══ XYZ HISOBLASH (Coefficient of Variation) ═══
        ortacha = float(r["ortacha_haftalik_summa"] or 0)
        stddev = float(r["stddev_summa"] or 0)

        if ortacha > 0:
            cv = stddev / ortacha  # Coefficient of Variation
        else:
            cv = 999.0

        if cv < 0.3:
            xyz = "X"
        elif cv < 0.7:
            xyz = "Y"
        else:
            xyz = "Z"

        matritsa = f"{abc}{xyz}"
        info = MATRITSA_TAVSIYA.get(matritsa, {})

        tovarlar.append({
            "tovar_id": r["tovar_id"],
            "nomi": r["tovar_nomi"],
            "abc": abc,
            "xyz": xyz,
            "matritsa": matritsa,
            "jami_summa": str(r["jami_summa"]),
            "jami_miqdor": float(r["jami_miqdor"]),
            "daromad_foizi": round(summa / jami_daromad * 100, 1) if jami_daromad > 0 else 0,
            "kumulyativ_foiz": round(foiz, 1),
            "cv": round(cv, 3),
            "faol_hafta": r["faol_hafta"],
            "haftalik_summalar": [float(s) for s in (r["haftalik_summalar"] or [])],
            "tavsiya": info.get("tavsiya", ""),
            "rang": info.get("rang", "#6b7280"),
            "emoji": info.get("emoji", "⚪"),
            "matritsa_nomi": info.get("nomi", ""),
        })

    # Matritsa statistika
    matritsa_stat = defaultdict(int)
    for t in tovarlar:
        matritsa_stat[t["matritsa"]] += 1

    # Umumiy tahlil
    a_foiz = sum(1 for t in tovarlar if t["abc"] == "A") / len(tovarlar) * 100
    x_foiz = sum(1 for t in tovarlar if t["xyz"] == "X") / len(tovarlar) * 100

    return {
        "tovarlar": tovarlar,
        "matritsa_statistika": dict(matritsa_stat),
        "umumiy_tahlil": {
            "jami_tovar": len(tovarlar),
            "jami_daromad": str(Decimal(str(jami_daromad))),
            "a_tovarlar_soni": sum(1 for t in tovarlar if t["abc"] == "A"),
            "a_tovarlar_foizi": round(a_foiz, 1),
            "barqaror_tovarlar_foizi": round(x_foiz, 1),
            "xavfli_tovarlar": [t for t in tovarlar if t["matritsa"] in ("AZ", "CZ")],
            "ideal_tovarlar": [t for t in tovarlar if t["matritsa"] == "AX"],
        }
    }


# ════════════════════════════════════════════════════════════
#  AVTOMATIK BUYURTMA TAVSIYASI (Reorder Point)
# ════════════════════════════════════════════════════════════

async def avtobuyurtma_tavsiya(conn, uid: int) -> List[dict]:
    """ABC-XYZ matritsa asosida qaysi tovarlarni qayta buyurtma qilish kerak.

    Reorder Point = (kunlik_sotuv × yetkazish_kuni) + xavfsizlik_zaxirasi

    Xavfsizlik zaxirasi:
    - AX: 3 kunlik zaxira (kam xavf, lekin muhim)
    - AY: 7 kunlik zaxira (mavsumiy, ehtiyotkor)
    - AZ: 5 kunlik zaxira (tartibsiz, o'rtacha)
    - BX-BZ: 3-5 kunlik
    - CX-CZ: 0-2 kunlik (kam muhim)
    """
    YETKAZISH_KUN = 3  # O'rtacha yetkazish vaqti
    XAVFSIZLIK = {
        "AX": 3, "AY": 7, "AZ": 5,
        "BX": 3, "BY": 4, "BZ": 3,
        "CX": 1, "CY": 1, "CZ": 0,
    }

    matritsa = await abc_xyz_tahlil(conn, uid, 30)
    tavsiyalar = []

    for tovar in matritsa.get("tovarlar", []):
        faol_hafta = max(tovar.get("faol_hafta", 1), 1)
        kunlik_sotuv = tovar["jami_miqdor"] / (faol_hafta * 7)

        if kunlik_sotuv <= 0:
            continue

        # Hozirgi qoldiq
        qoldiq_row = await conn.fetchval(
            "SELECT COALESCE(qoldiq, 0) FROM tovarlar WHERE id=$1 AND user_id=$2",
            tovar["tovar_id"], uid)
        qoldiq = float(qoldiq_row or 0)

        xavfsizlik_kun = XAVFSIZLIK.get(tovar["matritsa"], 2)
        reorder_point = kunlik_sotuv * (YETKAZISH_KUN + xavfsizlik_kun)
        buyurtma_miqdor = max(0, reorder_point * 2 - qoldiq)  # EOQ simplified

        if qoldiq <= reorder_point and buyurtma_miqdor > 0:
            kunlar_qoldi = qoldiq / kunlik_sotuv if kunlik_sotuv > 0 else 999
            tavsiyalar.append({
                "tovar_id": tovar["tovar_id"],
                "nomi": tovar["nomi"],
                "matritsa": tovar["matritsa"],
                "qoldiq": qoldiq,
                "kunlik_sotuv": round(kunlik_sotuv, 1),
                "reorder_point": round(reorder_point, 0),
                "buyurtma_miqdor": round(buyurtma_miqdor, 0),
                "kunlar_qoldi": round(kunlar_qoldi, 0),
                "muhimlik": "yuqori" if tovar["abc"] == "A" else "o'rta" if tovar["abc"] == "B" else "past",
                "emoji": "🔴" if kunlar_qoldi < 3 else "🟡" if kunlar_qoldi < 7 else "🟢",
            })

    tavsiyalar.sort(key=lambda x: x["kunlar_qoldi"])
    return tavsiyalar
