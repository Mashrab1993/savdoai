"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — MOLIYAVIY PROGNOZ                                ║
║  Kelasi oy bashorat (sotuv, foyda, xarajat)                 ║
║                                                              ║
║  Usul: Moving Average + Trend + Sezonallik                  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

log = logging.getLogger(__name__)


async def moliyaviy_prognoz(conn, uid: int) -> dict:
    """Kelasi oy moliyaviy bashorat.

    Oxirgi 3 oy ma'lumotlariga asoslangan trend tahlili.

    Returns:
        {
            oylar: [{oy, sotuv, foyda, xarajat}],
            prognoz: {sotuv, foyda, xarajat, o'sish_foiz},
            tavsiyalar: [str]
        }
    """
    try:
        # Oxirgi 6 oy statistikasi
        rows = await conn.fetch("""
            WITH oylik AS (
                SELECT
                    DATE_TRUNC('month', s.sana) AS oy,
                    SUM(s.jami)                 AS sotuv,
                    COUNT(DISTINCT s.id)        AS sotuv_soni
                FROM sotuv_sessiyalar s
                WHERE s.user_id = $1
                  AND s.sana >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', s.sana)
                ORDER BY oy
            )
            SELECT
                TO_CHAR(oy, 'YYYY-MM') AS oy_nomi,
                sotuv,
                sotuv_soni
            FROM oylik
        """, uid)

        # Xarajatlar — xarajatlar jadvalida `sana` va `admin_uid` ishlatiladi
        xarajat_rows = await conn.fetch("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', sana), 'YYYY-MM') AS oy_nomi,
                SUM(summa) AS xarajat
            FROM xarajatlar
            WHERE admin_uid = $1
              AND sana >= NOW() - INTERVAL '6 months'
              AND NOT bekor_qilingan
            GROUP BY DATE_TRUNC('month', sana)
        """, uid)

        xarajat_map = {r["oy_nomi"]: float(r["xarajat"] or 0) for r in xarajat_rows}

        oylar = []
        for r in rows:
            sotuv = float(r["sotuv"] or 0)
            xarajat = xarajat_map.get(r["oy_nomi"], 0)
            oylar.append({
                "oy": r["oy_nomi"],
                "sotuv": sotuv,
                "xarajat": xarajat,
                "foyda": sotuv - xarajat,
                "sotuv_soni": r["sotuv_soni"],
            })

        # Prognoz — oxirgi 3 oy trend
        prognoz = _trend_prognoz(oylar)
        tavsiyalar = _tavsiyalar(oylar, prognoz)

        return {
            "oylar": oylar,
            "prognoz": prognoz,
            "tavsiyalar": tavsiyalar,
        }

    except Exception as e:
        log.error("prognoz: %s", e, exc_info=True)
        return {"oylar": [], "prognoz": {}, "tavsiyalar": []}


def _trend_prognoz(oylar: list[dict]) -> dict:
    """Oxirgi 3 oy trendiga asoslangan prognoz."""
    if len(oylar) < 2:
        return {"sotuv": 0, "foyda": 0, "xarajat": 0, "osish_foiz": 0}

    # Oxirgi 3 oy (yoki bor bo'lgancha)
    oxirgi = oylar[-3:] if len(oylar) >= 3 else oylar

    ortacha_sotuv = sum(o["sotuv"] for o in oxirgi) / len(oxirgi)
    ortacha_foyda = sum(o["foyda"] for o in oxirgi) / len(oxirgi)
    ortacha_xarajat = sum(o["xarajat"] for o in oxirgi) / len(oxirgi)

    # Trend — oxirgi 2 oy o'rtasidagi o'sish
    if len(oylar) >= 2:
        oldingi = oylar[-2]["sotuv"]
        oxirgisi = oylar[-1]["sotuv"]
        if oldingi > 0:
            trend = (oxirgisi - oldingi) / oldingi
        else:
            trend = 0
    else:
        trend = 0

    # Prognoz = ortacha + trend
    prognoz_sotuv = ortacha_sotuv * (1 + trend * 0.5)  # konservativ
    prognoz_foyda = ortacha_foyda * (1 + trend * 0.5)
    prognoz_xarajat = ortacha_xarajat * 1.02  # xarajat doim biroz o'sadi

    return {
        "sotuv": round(prognoz_sotuv),
        "foyda": round(prognoz_foyda),
        "xarajat": round(prognoz_xarajat),
        "osish_foiz": round(trend * 100, 1),
    }


def _tavsiyalar(oylar: list[dict], prognoz: dict) -> list[str]:
    """Prognozga asoslangan tavsiyalar."""
    tavs = []

    if not oylar:
        return ["📊 Kamida 2 oy ma'lumot kerak prognoz uchun"]

    osish = prognoz.get("osish_foiz", 0)

    if osish > 10:
        tavs.append("📈 Sotuv o'smoqda! Omborni to'ldiring — talab oshishi kutilmoqda")
    elif osish < -10:
        tavs.append("📉 Sotuv tushmoqda. Chegirma aktsiyalar o'tkazing")
    else:
        tavs.append("📊 Sotuv barqaror. Yangi klientlar jalb qiling")

    # Foyda/sotuv nisbati
    if oylar:
        oxirgi = oylar[-1]
        if oxirgi["sotuv"] > 0:
            margin = oxirgi["foyda"] / oxirgi["sotuv"] * 100
            if margin < 15:
                tavs.append(f"⚠️ Foyda margini past ({margin:.0f}%). Narxlarni ko'ring")
            elif margin > 40:
                tavs.append(f"💰 Foyda margini yuqori ({margin:.0f}%). Raqobat narxini tekshiring")

    # Xarajat trend
    if len(oylar) >= 2:
        x1 = oylar[-2]["xarajat"]
        x2 = oylar[-1]["xarajat"]
        if x1 > 0 and x2 > x1 * 1.2:
            tavs.append("🔴 Xarajatlar 20%+ oshgan! Sabab toping")

    return tavs
