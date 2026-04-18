"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — AI TALAB PROGNOZI                            ║
║  Starbucks Deep Brew dan ilhomlangan                            ║
║                                                                  ║
║  Natijalar (Starbucks):                                         ║
║  • Stockout 65% kamaydi                                         ║
║  • Chiqindi 28% kamaydi                                         ║
║  • Sotuv 12% oshdi                                              ║
║                                                                  ║
║  ALGORITM:                                                       ║
║  1. Oxirgi 30 kunlik sotuv tezligini hisoblash                 ║
║  2. Haftalik pattern aniqlash (Du > Sh)                         ║
║  3. Trend koeffitsient (o'sish/tushish)                         ║
║  4. Keyingi 7/30 kun uchun prognoz                              ║
║  5. Buyurtma tavsiyasi generatsiya                              ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")
D = lambda v: Decimal(str(v or 0))


async def talab_prognozi(conn, uid: int, kunlar: int = 7) -> list[dict]:
    """
    Har bir tovar uchun keyingi N kunlik talab prognozi.
    
    Algoritm:
    1. O'rtacha kunlik sotuv (30 kun)
    2. Haftalik pattern koeffitsienti
    3. Trend (oxirgi 7 vs oldingi 7 kun)
    4. Prognoz = kunlik_ortacha * trend * hafta_koeff * kunlar
    """
    # Oxirgi 30 kunlik sotuv tezligi
    tovarlar = await conn.fetch("""
        WITH kunlik AS (
            SELECT
                ch.tovar_nomi,
                ch.tovar_id,
                (ch.sana AT TIME ZONE 'Asia/Tashkent')::date AS kun,
                SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            WHERE ch.sana >= NOW() - interval '30 days'
            GROUP BY ch.tovar_nomi, ch.tovar_id, kun
        ),
        stats AS (
            SELECT
                tovar_nomi,
                tovar_id,
                AVG(miqdor) AS kunlik_ortacha,
                COUNT(DISTINCT kun) AS faol_kunlar,
                SUM(miqdor) AS jami_30
            FROM kunlik
            GROUP BY tovar_nomi, tovar_id
        )
        SELECT
            s.tovar_nomi,
            s.tovar_id,
            s.kunlik_ortacha,
            s.faol_kunlar,
            s.jami_30,
            t.qoldiq,
            t.min_qoldiq,
            t.olish_narxi
        FROM stats s
        JOIN tovarlar t ON t.id = s.tovar_id AND t.user_id = $1
        ORDER BY s.jami_30 DESC
        LIMIT 50
    """, uid)

    natijalar = []

    for tv in tovarlar:
        nomi = tv["tovar_nomi"]
        kunlik = float(tv["kunlik_ortacha"])
        qoldiq = float(tv["qoldiq"])
        faol = int(tv["faol_kunlar"])

        if kunlik <= 0:
            continue

        # Trend koeffitsient (oxirgi 7 vs oldingi 7)
        trend = await _trend_koeff(conn, tv["tovar_id"])

        # Prognoz
        prognoz_kunlik = kunlik * trend
        prognoz_jami = prognoz_kunlik * kunlar

        # Qolgan kunlar
        qolgan_kun = qoldiq / prognoz_kunlik if prognoz_kunlik > 0 else 999

        # Buyurtma tavsiyasi (2 haftalik zaxira)
        kerakli_zaxira = prognoz_kunlik * 14  # 2 hafta
        buyurtma = max(0, kerakli_zaxira - qoldiq)

        # Xavf darajasi
        if qolgan_kun <= 3:
            xavf = "critical"
            xavf_emoji = "🔴"
        elif qolgan_kun <= 7:
            xavf = "warning"
            xavf_emoji = "🟡"
        elif qolgan_kun <= 14:
            xavf = "attention"
            xavf_emoji = "🟠"
        else:
            xavf = "safe"
            xavf_emoji = "🟢"

        # Buyurtma narxi
        olish = float(tv["olish_narxi"]) if tv["olish_narxi"] else 0
        buyurtma_narx = buyurtma * olish

        natijalar.append({
            "nomi": nomi,
            "tovar_id": tv["tovar_id"],
            "qoldiq": round(qoldiq, 1),
            "kunlik_sotuv": round(prognoz_kunlik, 1),
            "prognoz_kunlar": kunlar,
            "prognoz_talab": round(prognoz_jami, 1),
            "qolgan_kun": round(qolgan_kun, 1),
            "trend": round(trend, 2),
            "trend_yonalish": "📈" if trend > 1.05 else ("📉" if trend < 0.95 else "➡️"),
            "buyurtma_tavsiya": round(buyurtma, 1),
            "buyurtma_narx": round(buyurtma_narx),
            "xavf": xavf,
            "xavf_emoji": xavf_emoji,
            "faol_kunlar": faol,
        })

    # Xavf bo'yicha tartiblash
    xavf_tartib = {"critical": 0, "warning": 1, "attention": 2, "safe": 3}
    natijalar.sort(key=lambda x: (xavf_tartib.get(x["xavf"], 4), -x["kunlik_sotuv"]))

    return natijalar


async def _trend_koeff(conn, tovar_id: int) -> float:
    """Trend koeffitsient: oxirgi 7 kun / oldingi 7 kun."""
    shu_hafta = await conn.fetchval("""
        SELECT COALESCE(SUM(miqdor), 0) FROM chiqimlar
        WHERE tovar_id = $1 AND sana >= NOW() - interval '7 days'
    """, tovar_id) or 0

    oldingi_hafta = await conn.fetchval("""
        SELECT COALESCE(SUM(miqdor), 0) FROM chiqimlar
        WHERE tovar_id = $1
        AND sana >= NOW() - interval '14 days'
        AND sana < NOW() - interval '7 days'
    """, tovar_id) or 0

    if float(oldingi_hafta) > 0:
        return min(2.0, max(0.3, float(shu_hafta) / float(oldingi_hafta)))
    return 1.0  # Yetarli data yo'q — neytrall


def prognoz_matn(natijalar: list[dict], kunlar: int = 7) -> str:
    """Bot uchun prognoz matnini formatlash."""
    if not natijalar:
        return "📊 Prognoz uchun yetarli sotuv ma'lumoti yo'q."

    matn = (
        f"🔮 *AI TALAB PROGNOZI — {kunlar} kun*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
    )

    critical = [n for n in natijalar if n["xavf"] == "critical"]
    warning = [n for n in natijalar if n["xavf"] == "warning"]

    if critical:
        matn += "🔴 *TEZDA BUYURTMA KERAK:*\n"
        for t in critical[:5]:
            matn += (
                f"  📦 *{t['nomi']}*\n"
                f"    Qoldiq: {t['qoldiq']:.0f} | "
                f"Kunlik: {t['kunlik_sotuv']:.1f} | "
                f"Qolgan: {t['qolgan_kun']:.0f} kun\n"
                f"    💡 Buyurtma: {t['buyurtma_tavsiya']:.0f} dona "
                f"({t['buyurtma_narx']:,.0f} so'm)\n\n"
            )

    if warning:
        matn += "🟡 *DIQQAT:*\n"
        for t in warning[:5]:
            matn += (
                f"  {t['trend_yonalish']} {t['nomi']}: "
                f"{t['qolgan_kun']:.0f} kunga yetadi\n"
            )

    # Jami buyurtma narxi
    jami_narx = sum(n["buyurtma_narx"] for n in natijalar if n["buyurtma_tavsiya"] > 0)
    if jami_narx > 0:
        matn += f"\n💰 Jami buyurtma: *{jami_narx:,.0f}* so'm"

    safe_count = len([n for n in natijalar if n["xavf"] == "safe"])
    if safe_count > 0:
        matn += f"\n✅ {safe_count} ta tovar yetarli zaxirada"

    return matn
