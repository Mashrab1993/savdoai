"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — GPS AGENT TRACKING                           ║
║  SalesDoc modelidan ilhomlangan                                  ║
║                                                                  ║
║  Telegram location sharing orqali agent joylashuvini tracking:  ║
║  ✅ Live location → real-time tracking                          ║
║  ✅ Visit check-in/check-out                                    ║
║  ✅ Kunlik marshrut hisoboti                                    ║
║  ✅ Ikki nuqta orasidagi masofa                                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import math
from datetime import datetime, timedelta
from typing import Optional

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Ikki koordinata orasidagi masofa (km)."""
    R = 6371  # Yer radiusi km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon/2)**2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


async def gps_saqlash(conn, uid: int, lat: float, lon: float,
                       accuracy: float = None, turi: str = "location",
                       izoh: str = "") -> dict:
    """GPS nuqtani DB ga saqlash."""
    row = await conn.fetchrow("""
        INSERT INTO gps_log (user_id, latitude, longitude, accuracy, turi, izoh)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, vaqt
    """, uid, lat, lon, accuracy, turi, izoh)

    return {"id": row["id"], "vaqt": str(row["vaqt"]),
            "lat": lat, "lon": lon, "turi": turi}


async def kunlik_marshrut(conn, uid: int, sana: str | None = None) -> dict:
    """Kunlik marshrut statistikasi."""
    if sana:
        qidirish = f"(vaqt AT TIME ZONE 'Asia/Tashkent')::date = '{sana}'"
    else:
        qidirish = "(vaqt AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE"

    rows = await conn.fetch(f"""
        SELECT latitude, longitude, turi, izoh,
               vaqt AT TIME ZONE 'Asia/Tashkent' AS mahalliy_vaqt
        FROM gps_log
        WHERE user_id = $1 AND {qidirish}
        ORDER BY vaqt ASC
    """, uid)

    if not rows:
        return {"nuqtalar": 0, "masofa_km": 0, "visitlar": 0}

    # Masofa hisoblash
    jami_masofa = 0
    for i in range(1, len(rows)):
        jami_masofa += haversine(
            rows[i-1]["latitude"], rows[i-1]["longitude"],
            rows[i]["latitude"], rows[i]["longitude"]
        )

    visitlar = sum(1 for r in rows if r["turi"] in ("visit", "checkin"))

    # Birinchi va oxirgi vaqt
    boshlangich = rows[0]["mahalliy_vaqt"]
    tugash = rows[-1]["mahalliy_vaqt"]
    ish_soati = (tugash - boshlangich).total_seconds() / 3600 if len(rows) > 1 else 0

    return {
        "sana": sana or str(datetime.now(TZ).date()),
        "nuqtalar": len(rows),
        "masofa_km": round(jami_masofa, 2),
        "visitlar": visitlar,
        "ish_soati": round(ish_soati, 1),
        "boshlangich": str(boshlangich.time())[:5] if boshlangich else None,
        "tugash": str(tugash.time())[:5] if tugash else None,
        "koordinatalar": [
            {"lat": float(r["latitude"]), "lon": float(r["longitude"]),
             "turi": r["turi"], "vaqt": str(r["mahalliy_vaqt"].time())[:5]}
            for r in rows
        ],
    }


async def haftalik_gps_xulosa(conn, uid: int) -> dict:
    """Haftalik GPS xulosa — KPI uchun."""
    rows = await conn.fetch("""
        SELECT
            (vaqt AT TIME ZONE 'Asia/Tashkent')::date AS kun,
            COUNT(*) AS nuqtalar,
            COUNT(*) FILTER(WHERE turi IN('visit','checkin')) AS visitlar
        FROM gps_log
        WHERE user_id = $1 AND vaqt >= NOW() - interval '7 days'
        GROUP BY kun ORDER BY kun
    """, uid)

    return {
        "kunlar": [
            {"kun": str(r["kun"]), "nuqtalar": int(r["nuqtalar"]),
             "visitlar": int(r["visitlar"])}
            for r in rows
        ],
        "jami_visitlar": sum(int(r["visitlar"]) for r in rows),
        "faol_kunlar": len(rows),
    }
