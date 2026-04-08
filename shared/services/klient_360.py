"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLIENT 360° KO'RINISH                                ║
║                                                                          ║
║  HubSpot / Salesforce Customer 360 analog:                              ║
║  Bitta endpoint — klient haqida HAMMA narsa:                            ║
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────┐        ║
║  │  PROFIL          │  MOLIYA          │  XULQ               │        ║
║  │  • Ism, tel      │  • Jami xarid    │  • RFM segment      │        ║
║  │  • Manzil, GPS   │  • Jami to'lov   │  • Churn risk       │        ║
║  │  • Kategoriya    │  • Joriy qarz     │  • CLV (lifetime)   │        ║
║  │  • Yaratilgan    │  • Kredit limit   │  • Trend (↑/↓)      │        ║
║  ├─────────────────────────────────────────────────────────────┤        ║
║  │  SOTUV TARIXI    │  TOP TOVARLAR    │  VAQT TAHLILI       │        ║
║  │  • Oxirgi 10     │  • Eng ko'p      │  • Hafta kunlari    │        ║
║  │  • Oylik trend   │  • Eng kam       │  • Soat tahlili     │        ║
║  │  • Avg check     │  • Yangi tovar   │  • Mavsumiylik      │        ║
║  ├─────────────────────────────────────────────────────────────┤        ║
║  │  AI TAVSIYALAR                                              │        ║
║  │  • Cross-sell (X olgan → Y taklif)                         │        ║
║  │  • Narx sezgirligi (chegirmaga reaksiya)                   │        ║
║  │  • Keyingi sotuv prognozi                                   │        ║
║  └─────────────────────────────────────────────────────────────┘        ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

log = logging.getLogger(__name__)
D = lambda v: Decimal(str(v or 0))


async def klient_360(conn, uid: int, klient_id: int) -> dict:
    """Klient haqida TO'LIQ 360° ma'lumot — bitta chaqiruvda."""

    # ═══ 1. PROFIL ═══
    profil = await conn.fetchrow("""
        SELECT k.*, 
            (SELECT COUNT(*) FROM sotuvlar s WHERE s.klient_id=k.id AND s.user_id=k.user_id) AS jami_sotuv_soni,
            (SELECT MIN(s.sana) FROM sotuvlar s WHERE s.klient_id=k.id) AS birinchi_sotuv,
            (SELECT MAX(s.sana) FROM sotuvlar s WHERE s.klient_id=k.id) AS oxirgi_sotuv
        FROM klientlar k WHERE k.id=$1 AND k.user_id=$2
    """, klient_id, uid)

    if not profil:
        return {"xato": "Klient topilmadi"}

    # ═══ 2. MOLIYA ═══
    moliya = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(jami), 0) AS jami_xarid,
            COALESCE(SUM(tolangan), 0) AS jami_tolov,
            COALESCE(SUM(qarz), 0) AS joriy_qarz,
            COALESCE(AVG(jami), 0) AS ortacha_chek,
            COALESCE(MAX(jami), 0) AS eng_katta_chek,
            COUNT(*) AS sotuv_soni
        FROM sotuvlar
        WHERE klient_id=$1 AND user_id=$2
    """, klient_id, uid) or {}

    # Oylik trend (6 oy)
    oylik = await conn.fetch("""
        SELECT DATE_TRUNC('month', sana) AS oy,
               SUM(jami) AS summa, COUNT(*) AS soni
        FROM sotuvlar WHERE klient_id=$1 AND user_id=$2
            AND sana >= NOW() - INTERVAL '6 months'
        GROUP BY oy ORDER BY oy
    """, klient_id, uid)

    # ═══ 3. RFM + CHURN ═══
    oxirgi_kun = 0
    if profil.get("oxirgi_sotuv"):
        oxirgi_kun = (datetime.now(tz=profil["oxirgi_sotuv"].tzinfo if profil["oxirgi_sotuv"].tzinfo else None) - profil["oxirgi_sotuv"]).days if profil["oxirgi_sotuv"] else 999

    # 90 kunlik chastotlik
    son_90 = await conn.fetchval("""
        SELECT COUNT(*) FROM sotuvlar
        WHERE klient_id=$1 AND user_id=$2 AND sana >= NOW() - INTERVAL '90 days'
    """, klient_id, uid) or 0

    summa_90 = float(await conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0) FROM sotuvlar
        WHERE klient_id=$1 AND user_id=$2 AND sana >= NOW() - INTERVAL '90 days'
    """, klient_id, uid) or 0)

    # RFM segment
    from shared.services.klient_segment import rfm_segment, SEGMENTLAR
    segment = rfm_segment(oxirgi_kun, son_90, summa_90)
    segment_info = SEGMENTLAR.get(segment, {})

    # CLV (Customer Lifetime Value)
    kunlar_bilan = max(1, (datetime.now().date() - profil["birinchi_sotuv"].date()).days) if profil.get("birinchi_sotuv") else 1
    oylik_ortacha = float(moliya.get("jami_xarid", 0)) / max(1, kunlar_bilan / 30)
    clv_1_yil = oylik_ortacha * 12

    # ═══ 4. TOP TOVARLAR ═══
    top_tovarlar = await conn.fetch("""
        SELECT c.tovar_nomi, SUM(c.miqdor) AS miqdor, SUM(c.jami_summa) AS summa,
               COUNT(*) AS sotib_olish_soni
        FROM chiqimlar c
        JOIN sotuv_sessiyalar s ON s.id = c.sessiya_id
        WHERE s.klient_id=$1 AND s.user_id=$2
        GROUP BY c.tovar_nomi
        ORDER BY SUM(c.jami_summa) DESC LIMIT 10
    """, klient_id, uid)

    # ═══ 5. CROSS-SELL TAVSIYA ═══
    # Bu klient olmagan lekin o'xshash klientlar olgan tovarlar
    cross_sell = await conn.fetch("""
        WITH bu_klient AS (
            SELECT DISTINCT c.tovar_id FROM chiqimlar c
            JOIN sotuv_sessiyalar s ON s.id = c.sessiya_id
            WHERE s.klient_id = $1 AND s.user_id = $2
        ),
        oxshash_klientlar AS (
            SELECT DISTINCT s2.klient_id FROM sotuv_sessiyalar s2
            JOIN chiqimlar c2 ON c2.sessiya_id = s2.id
            WHERE s2.user_id = $2 AND s2.klient_id != $1
            AND c2.tovar_id IN (SELECT tovar_id FROM bu_klient)
            LIMIT 20
        )
        SELECT c3.tovar_nomi, c3.tovar_id,
               COUNT(DISTINCT s3.klient_id) AS necha_klient,
               AVG(c3.sotish_narxi) AS ortacha_narx
        FROM chiqimlar c3
        JOIN sotuv_sessiyalar s3 ON s3.id = c3.sessiya_id
        WHERE s3.klient_id IN (SELECT klient_id FROM oxshash_klientlar)
            AND s3.user_id = $2
            AND c3.tovar_id NOT IN (SELECT tovar_id FROM bu_klient)
        GROUP BY c3.tovar_nomi, c3.tovar_id
        ORDER BY COUNT(DISTINCT s3.klient_id) DESC
        LIMIT 5
    """, klient_id, uid)

    # ═══ 6. VAQT TAHLILI ═══
    hafta_kunlari = await conn.fetch("""
        SELECT EXTRACT(DOW FROM sana) AS kun, COUNT(*) AS soni, SUM(jami) AS summa
        FROM sotuvlar WHERE klient_id=$1 AND user_id=$2
            AND sana >= NOW() - INTERVAL '90 days'
        GROUP BY kun ORDER BY soni DESC
    """, klient_id, uid)

    kun_nomlari = {0: "Yak", 1: "Du", 2: "Se", 3: "Chor", 4: "Pay", 5: "Ju", 6: "Shan"}

    # ═══ 7. NARX SEZGIRLIGI ═══
    # Chegirmali va chegirmasiz sotuvlarni solishtirish
    narx_sezgirlik = await conn.fetchrow("""
        SELECT
            COUNT(CASE WHEN COALESCE(chegirma, 0) > 0 THEN 1 END) AS chegirmali,
            COUNT(CASE WHEN COALESCE(chegirma, 0) = 0 THEN 1 END) AS chegirmasiz,
            AVG(CASE WHEN COALESCE(chegirma, 0) > 0 THEN jami END) AS chegirmali_ortacha,
            AVG(CASE WHEN COALESCE(chegirma, 0) = 0 THEN jami END) AS chegirmasiz_ortacha
        FROM sotuvlar WHERE klient_id=$1 AND user_id=$2
    """, klient_id, uid)

    # ═══ NATIJA ═══
    return {
        "profil": {
            "id": profil["id"],
            "nom": profil.get("nom", ""),
            "telefon": profil.get("telefon", ""),
            "manzil": profil.get("manzil", ""),
            "kategoriya": profil.get("kategoriya", ""),
            "yaratilgan": profil.get("yaratilgan", ""),
            "birinchi_sotuv": str(profil.get("birinchi_sotuv", "")),
            "oxirgi_sotuv": str(profil.get("oxirgi_sotuv", "")),
            "oxirgi_sotuv_kun": oxirgi_kun,
            "kunlar_bilan": kunlar_bilan,
        },
        "moliya": {
            "jami_xarid": str(moliya.get("jami_xarid", 0)),
            "jami_tolov": str(moliya.get("jami_tolov", 0)),
            "joriy_qarz": str(moliya.get("joriy_qarz", 0)),
            "ortacha_chek": str(moliya.get("ortacha_chek", 0)),
            "eng_katta_chek": str(moliya.get("eng_katta_chek", 0)),
            "sotuv_soni": int(moliya.get("sotuv_soni", 0)),
        },
        "oylik_trend": [{"oy": str(o["oy"]), "summa": str(o["summa"]), "soni": o["soni"]} for o in oylik],
        "segment": {
            "segment": segment,
            "emoji": segment_info.get("emoji", ""),
            "nomi": segment_info.get("nomi", ""),
            "rang": segment_info.get("rang", ""),
        },
        "clv": {
            "oylik_ortacha": round(oylik_ortacha, 0),
            "yillik_prognoz": round(clv_1_yil, 0),
        },
        "top_tovarlar": [dict(r) for r in top_tovarlar],
        "cross_sell": [{"nomi": r["tovar_nomi"], "necha_klient": r["necha_klient"],
                         "narx": str(r["ortacha_narx"])} for r in cross_sell],
        "hafta_kunlari": [{"kun": kun_nomlari.get(int(r["kun"]), "?"),
                            "soni": r["soni"], "summa": str(r["summa"])} for r in hafta_kunlari],
        "narx_sezgirligi": {
            "chegirmali_sotuv": int(narx_sezgirlik["chegirmali"] or 0) if narx_sezgirlik else 0,
            "chegirmasiz_sotuv": int(narx_sezgirlik["chegirmasiz"] or 0) if narx_sezgirlik else 0,
            "chegirmaga_sezgir": (
                float(narx_sezgirlik["chegirmali_ortacha"] or 0) >
                float(narx_sezgirlik["chegirmasiz_ortacha"] or 0) * 1.2
            ) if narx_sezgirlik else False,
        },
    }
