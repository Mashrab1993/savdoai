"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — RFM KLIENT SEGMENTATSIYA (SalesDoc /report/rfm)  ║
║                                                                      ║
║  R (Recency)   — oxirgi xarid qachon bo'lgan (kun)                  ║
║  F (Frequency) — nechta xarid bor                                   ║
║  M (Monetary)  — umumiy xarid summasi                               ║
║                                                                      ║
║  Har ko'rsatkich 1-5 bal (NTILE — 5 guruhga bo'lish).                ║
║                                                                      ║
║  Segmentlar:                                                         ║
║   Champions     (R=4-5, F=4-5, M=4-5) — TOP klientlar               ║
║   Loyal         (R=3-5, F=3-5, M=3-5) — Sodiq                       ║
║   Potential     (R=3-5, F=1-2, M=1-3) — Yangi/o'sish                ║
║   At Risk       (R=2-3, F=2-5, M=2-5) — Xavfda (yo'qolish)          ║
║   Hibernating   (R=1-2, F=1-2, M=1-2) — Uyquda                      ║
║   Lost          (R=1, F=1, M=1) — Yo'qolgan                          ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

log = logging.getLogger(__name__)


def _segment(r: int, f: int, m: int) -> tuple[str, str]:
    """RFM bal'lardan segment va emoji aniqlash."""
    # Champions — eng yaxshilari (barcha 4-5)
    if r >= 4 and f >= 4 and m >= 4:
        return ("Champions", "🏆")
    # Loyal — sodiq
    if r >= 3 and f >= 3 and m >= 3:
        return ("Loyal", "💎")
    # Potential — yangi/o'sish
    if r >= 3 and f <= 2:
        return ("Potential", "🌱")
    # Lost — yo'qolgan
    if r == 1 and f == 1 and m == 1:
        return ("Lost", "💀")
    # Hibernating — uyquda (eski klient, kam xarid)
    if r <= 2 and f <= 2:
        return ("Hibernating", "😴")
    # At Risk — xavfli (oldin yaxshi edi, hozir yo'q)
    if r <= 3 and f >= 2:
        return ("At Risk", "⚠️")
    # Umumiy fallback
    return ("Regular", "📦")


async def rfm_hisobla(conn, uid: int, hafta_soni: int = 26) -> list[dict]:
    """Barcha klientlar uchun RFM bal va segment hisoblash.

    hafta_soni: taxminiy tarix oynasi (default 26 hafta = 6 oy)

    Returns: [{klient_id, ism, recency_days, frequency, monetary,
                R, F, M, segment, emoji}]
    """
    chegara = datetime.now() - timedelta(weeks=hafta_soni)
    rows = await conn.fetch("""
        WITH rfm AS (
            SELECT
                k.id AS klient_id,
                k.ism,
                k.telefon,
                EXTRACT(EPOCH FROM (NOW() - MAX(s.sana)))/86400 AS recency_days,
                COUNT(s.id) AS frequency,
                COALESCE(SUM(s.jami), 0) AS monetary
            FROM klientlar k
            LEFT JOIN sotuv_sessiyalar s ON s.klient_id = k.id AND s.sana >= $2
            WHERE k.user_id = $1
            GROUP BY k.id, k.ism, k.telefon
            HAVING COUNT(s.id) > 0  -- faqat kamida 1 ta sotuv bo'lgan klientlar
        ),
        scored AS (
            SELECT
                klient_id, ism, telefon,
                recency_days, frequency, monetary,
                -- R: recency_days QUVISHI bo'yicha NTILE (kichik days = katta R)
                NTILE(5) OVER (ORDER BY recency_days DESC) AS R,
                -- F: frequency O'SISH bo'yicha
                NTILE(5) OVER (ORDER BY frequency) AS F,
                -- M: monetary O'SISH bo'yicha
                NTILE(5) OVER (ORDER BY monetary) AS M
            FROM rfm
        )
        SELECT klient_id, ism, telefon,
               ROUND(recency_days)::int AS recency_days,
               frequency::int,
               monetary::float,
               R::int, F::int, M::int,
               (R + F + M) AS jami_bal
        FROM scored
        ORDER BY jami_bal DESC, monetary DESC
    """, uid, chegara)

    result = []
    for r in rows:
        seg, emoji = _segment(r["R"], r["F"], r["M"])
        result.append({
            "klient_id": r["klient_id"],
            "ism": r["ism"],
            "telefon": r["telefon"],
            "recency_days": int(r["recency_days"] or 0),
            "frequency": int(r["frequency"] or 0),
            "monetary": float(r["monetary"] or 0),
            "R": int(r["R"]),
            "F": int(r["F"]),
            "M": int(r["M"]),
            "jami_bal": int(r["jami_bal"]),
            "segment": seg,
            "emoji": emoji,
        })
    return result


async def segment_xulosasi(conn, uid: int, hafta_soni: int = 26) -> dict:
    """Har segment bo'yicha klient soni va revenu."""
    klientlar = await rfm_hisobla(conn, uid, hafta_soni)
    xulosa: dict = {}
    for k in klientlar:
        seg = k["segment"]
        if seg not in xulosa:
            xulosa[seg] = {
                "emoji": k["emoji"],
                "soni": 0,
                "monetary_sum": 0.0,
                "misol_klientlar": [],
            }
        xulosa[seg]["soni"] += 1
        xulosa[seg]["monetary_sum"] += k["monetary"]
        if len(xulosa[seg]["misol_klientlar"]) < 3:
            xulosa[seg]["misol_klientlar"].append(k["ism"])
    jami_monetary = sum(v["monetary_sum"] for v in xulosa.values())
    for seg, v in xulosa.items():
        v["monetary_foiz"] = round(v["monetary_sum"] / jami_monetary * 100, 1) if jami_monetary else 0
    return {
        "jami_klient": len(klientlar),
        "jami_monetary": jami_monetary,
        "hafta_soni": hafta_soni,
        "segmentlar": xulosa,
    }


# Segment izohlari (user uchun)
SEGMENT_IZOH = {
    "Champions": "TOP klientlar — eng tez-tez, eng ko'p xarid. Saqlab qoling! VIP narx, tez xizmat.",
    "Loyal": "Sodiq klientlar — chegirma yoki loyalty dastur yaxshi natija beradi.",
    "Potential": "Yangi klientlar yoki kam xaridchilar — upsell/cross-sell imkoni.",
    "At Risk": "XAVF! Oldin yaxshi edi, hozir sotib olmayapti. Tezda gapiring, chegirma bering.",
    "Hibernating": "Uyquda — qayta faollashtirish kampaniyasi kerak.",
    "Lost": "Yo'qolgan klient. Qaytarish uchun maxsus taklif.",
    "Regular": "O'rtacha klient. Stabil.",
}
