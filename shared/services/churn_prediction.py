"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLIENT KETISH PROGNOZI (CHURN PREDICTION)            ║
║                                                                          ║
║  Dunyo TOP tizimlari: Salesforce Einstein, HubSpot, Gainsight           ║
║                                                                          ║
║  ALGORITM (ML-free, rule-based — ishonchli va tez):                     ║
║                                                                          ║
║  5 TA SIGNAL → RISK SKORI (0-100):                                      ║
║  ┌──────────────────────────────────────────────┬────────┐              ║
║  │ Signal                                       │ Vazn   │              ║
║  ├──────────────────────────────────────────────┼────────┤              ║
║  │ 1. Recency — oxirgi sotib olishdan necha kun │  30%   │              ║
║  │ 2. Frequency trend — tezlik tushyaptimi?     │  25%   │              ║
║  │ 3. Monetary trend — summa kamayaptimi?       │  20%   │              ║
║  │ 4. Basket shrink — savatdagi tovar kamaydi   │  15%   │              ║
║  │ 5. Payment delay — to'lov kechiktiryaptimi?  │  10%   │              ║
║  └──────────────────────────────────────────────┴────────┘              ║
║                                                                          ║
║  HARAKAT:                                                                ║
║  Risk > 80 → 🔴 DARHOL qo'ng'iroq qiling                              ║
║  Risk 60-80 → 🟡 Maxsus taklif yuboring                                ║
║  Risk 40-60 → 🟢 Kuzatishda saqlang                                    ║
║  Risk < 40 → ✅ Xavfsiz                                                 ║
║                                                                          ║
║  Buni na SD Agent, na Smartup ERP — HECH KIM qilmaydi.                 ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

log = logging.getLogger(__name__)


async def churn_tahlil(conn, uid: int) -> list[dict]:
    """Barcha faol klientlar uchun ketish xavfini hisoblash.

    Returns:
        [{klient_id, nom, risk_skor, signal_tafsilot, tavsiya, harakat}]
    """
    # Klientlar va ularning sotuv statistikasi
    # Schema: sotuv_sessiyalar (ss) + chiqimlar (ch) + klientlar (k.ism)
    klientlar = await conn.fetch("""
        WITH klient_stats AS (
            SELECT
                k.id AS klient_id,
                k.ism AS nom,
                k.telefon,
                EXTRACT(DAY FROM NOW() - MAX(ss.sana)) AS oxirgi_sotuv_kun,
                COUNT(CASE WHEN ss.sana >= NOW() - INTERVAL '30 days' THEN 1 END) AS oy1_soni,
                COUNT(CASE WHEN ss.sana >= NOW() - INTERVAL '60 days'
                           AND ss.sana < NOW() - INTERVAL '30 days' THEN 1 END) AS oy2_soni,
                COUNT(CASE WHEN ss.sana >= NOW() - INTERVAL '90 days'
                           AND ss.sana < NOW() - INTERVAL '60 days' THEN 1 END) AS oy3_soni,
                COALESCE(SUM(CASE WHEN ss.sana >= NOW() - INTERVAL '30 days'
                             THEN ss.jami END), 0) AS oy1_summa,
                COALESCE(SUM(CASE WHEN ss.sana >= NOW() - INTERVAL '60 days'
                             AND ss.sana < NOW() - INTERVAL '30 days'
                             THEN ss.jami END), 0) AS oy2_summa,
                COALESCE(SUM(CASE WHEN ss.sana >= NOW() - INTERVAL '90 days'
                             AND ss.sana < NOW() - INTERVAL '60 days'
                             THEN ss.jami END), 0) AS oy3_summa,
                COUNT(DISTINCT CASE WHEN ss.sana >= NOW() - INTERVAL '30 days'
                      THEN ch.tovar_id END) AS oy1_tovar_xil,
                COUNT(DISTINCT CASE WHEN ss.sana >= NOW() - INTERVAL '60 days'
                      AND ss.sana < NOW() - INTERVAL '30 days'
                      THEN ch.tovar_id END) AS oy2_tovar_xil,
                COALESCE(AVG(CASE WHEN ss.sana >= NOW() - INTERVAL '90 days'
                      AND ss.qarz > 0 THEN EXTRACT(DAY FROM NOW() - ss.sana) END), 0) AS ort_qarz_kun,
                COALESCE(SUM(ss.qarz), 0) AS jami_qarz
            FROM klientlar k
            LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id = k.id AND ss.user_id = k.user_id
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE k.user_id = $1
              AND EXISTS (SELECT 1 FROM sotuv_sessiyalar ss2
                          WHERE ss2.klient_id = k.id AND ss2.user_id = $1
                            AND ss2.sana >= NOW() - INTERVAL '180 days')
            GROUP BY k.id, k.ism, k.telefon
        )
        SELECT * FROM klient_stats
        ORDER BY oxirgi_sotuv_kun DESC NULLS LAST
    """, uid)

    natijalar = []

    for k in klientlar:
        signallar = {}
        risk_skor = 0.0

        # ═══ 1. RECENCY SIGNAL (30%) ═══
        oxirgi_kun = float(k["oxirgi_sotuv_kun"] or 0)
        if oxirgi_kun > 60:
            recency_risk = 100
        elif oxirgi_kun > 30:
            recency_risk = 70
        elif oxirgi_kun > 14:
            recency_risk = 40
        elif oxirgi_kun > 7:
            recency_risk = 20
        else:
            recency_risk = 0
        signallar["recency"] = {"qiymat": oxirgi_kun, "risk": recency_risk,
                                 "tavsif": f"{int(oxirgi_kun)} kun oldin sotib olgan"}
        risk_skor += recency_risk * 0.30

        # ═══ 2. FREQUENCY TREND (25%) ═══
        oy1 = int(k["oy1_soni"] or 0)
        oy2 = int(k["oy2_soni"] or 0)
        oy3 = int(k["oy3_soni"] or 0)
        ortacha_oldingi = (oy2 + oy3) / 2 if (oy2 + oy3) > 0 else 1
        if ortacha_oldingi > 0:
            freq_ozgarish = (oy1 - ortacha_oldingi) / ortacha_oldingi * 100
        else:
            freq_ozgarish = -100 if oy1 == 0 else 0

        if freq_ozgarish <= -50:
            freq_risk = 90
        elif freq_ozgarish <= -25:
            freq_risk = 60
        elif freq_ozgarish < 0:
            freq_risk = 30
        else:
            freq_risk = 0
        signallar["frequency"] = {"qiymat": f"{oy1}/{oy2}/{oy3}",
                                   "ozgarish": round(freq_ozgarish, 1),
                                   "risk": freq_risk,
                                   "tavsif": f"Sotuv soni: bu oy {oy1}, o'tgan oy {oy2}"}
        risk_skor += freq_risk * 0.25

        # ═══ 3. MONETARY TREND (20%) ═══
        s1 = float(k["oy1_summa"] or 0)
        s2 = float(k["oy2_summa"] or 0)
        if s2 > 0:
            money_ozgarish = (s1 - s2) / s2 * 100
        else:
            money_ozgarish = -100 if s1 == 0 else 0

        if money_ozgarish <= -50:
            money_risk = 90
        elif money_ozgarish <= -25:
            money_risk = 60
        elif money_ozgarish < 0:
            money_risk = 30
        else:
            money_risk = 0
        signallar["monetary"] = {"bu_oy": s1, "otgan_oy": s2,
                                  "ozgarish": round(money_ozgarish, 1),
                                  "risk": money_risk}
        risk_skor += money_risk * 0.20

        # ═══ 4. BASKET SHRINK (15%) ═══
        xil1 = int(k["oy1_tovar_xil"] or 0)
        xil2 = int(k["oy2_tovar_xil"] or 0)
        if xil2 > 0:
            basket_ozgarish = (xil1 - xil2) / xil2 * 100
        else:
            basket_ozgarish = 0

        basket_risk = max(0, min(100, -basket_ozgarish))
        signallar["basket"] = {"bu_oy": xil1, "otgan_oy": xil2,
                                "risk": basket_risk}
        risk_skor += basket_risk * 0.15

        # ═══ 5. PAYMENT DELAY (10%) ═══
        ort_qarz_kun = float(k["ort_qarz_kun"] or 0)
        jami_qarz = float(k["jami_qarz"] or 0)
        if ort_qarz_kun > 30:
            pay_risk = 80
        elif ort_qarz_kun > 14:
            pay_risk = 50
        elif jami_qarz > 0:
            pay_risk = 20
        else:
            pay_risk = 0
        signallar["payment"] = {"ort_qarz_kun": round(ort_qarz_kun, 0),
                                 "jami_qarz": jami_qarz, "risk": pay_risk}
        risk_skor += pay_risk * 0.10

        # ═══ YAKUNIY RISK SKORI ═══
        risk_skor = round(min(100, max(0, risk_skor)), 0)

        if risk_skor >= 80:
            daraja = "kritik"
            emoji = "🔴"
            harakat = "DARHOL qo'ng'iroq qiling — bu klient ketib qolishi mumkin!"
            tavsiya = f"Maxsus chegirma taklif qiling yoki shaxsan uchrashing"
        elif risk_skor >= 60:
            daraja = "yuqori"
            emoji = "🟠"
            harakat = "Bu hafta ichida bog'laning"
            tavsiya = "Yangi tovarlar haqida xabar yuboring yoki maxsus narx taklif qiling"
        elif risk_skor >= 40:
            daraja = "o'rta"
            emoji = "🟡"
            harakat = "Kuzatishda saqlang"
            tavsiya = "Oylik aksiya yuboring"
        else:
            daraja = "past"
            emoji = "🟢"
            harakat = "Hozircha xavf yo'q"
            tavsiya = "Odatdagi aloqani davom ettiring"

        natijalar.append({
            "klient_id": k["klient_id"],
            "nom": k["nom"],
            "telefon": k.get("telefon", ""),
            "risk_skor": int(risk_skor),
            "daraja": daraja,
            "emoji": emoji,
            "signallar": signallar,
            "harakat": harakat,
            "tavsiya": tavsiya,
        })

    natijalar.sort(key=lambda x: x["risk_skor"], reverse=True)

    # Xulosa
    kritik = sum(1 for n in natijalar if n["daraja"] == "kritik")
    yuqori = sum(1 for n in natijalar if n["daraja"] == "yuqori")

    return {
        "klientlar": natijalar,
        "xulosa": {
            "jami_klient": len(natijalar),
            "kritik_xavf": kritik,
            "yuqori_xavf": yuqori,
            "xavfsiz": len(natijalar) - kritik - yuqori,
            "ogohlantirish": f"⚠️ {kritik} ta klient DARHOL e'tibor talab qiladi!" if kritik > 0 else "✅ Barcha klientlar xavfsiz",
        }
    }
