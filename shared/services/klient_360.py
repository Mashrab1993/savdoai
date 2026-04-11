"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLIENT 360° KO'RINISH                                ║
║                                                                          ║
║  HubSpot / Salesforce Customer 360 analog:                              ║
║  Bitta endpoint — klient haqida HAMMA narsa.                            ║
║                                                                          ║
║  Schema: sotuv_sessiyalar (ss), chiqimlar (ch), qarzlar (q),            ║
║          klientlar (k).                                                  ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime
from decimal import Decimal

log = logging.getLogger(__name__)
D = lambda v: Decimal(str(v or 0))


async def klient_360(conn, uid: int, klient_id: int) -> dict:
    """Klient haqida TO'LIQ 360° ma'lumot — bitta chaqiruvda."""

    # ═══ 1. PROFIL ═══
    profil = await conn.fetchrow("""
        SELECT k.id, k.ism, k.telefon, k.manzil, k.eslatma,
               k.kredit_limit, k.jami_sotib, k.yaratilgan,
               k.kategoriya, k.tugilgan_kun, k.oxirgi_sotuv,
               k.jami_xaridlar, k.xarid_soni,
               (SELECT COUNT(*) FROM sotuv_sessiyalar ss
                WHERE ss.klient_id = k.id AND ss.user_id = k.user_id) AS jami_sotuv_soni,
               (SELECT MIN(ss.sana) FROM sotuv_sessiyalar ss
                WHERE ss.klient_id = k.id) AS birinchi_sotuv,
               (SELECT MAX(ss.sana) FROM sotuv_sessiyalar ss
                WHERE ss.klient_id = k.id) AS oxirgi_ss_sana
        FROM klientlar k
        WHERE k.id = $1 AND k.user_id = $2
    """, klient_id, uid)

    if not profil:
        return {"xato": "Klient topilmadi"}

    # ═══ 2. MOLIYA ═══
    moliya = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(jami), 0)      AS jami_xarid,
            COALESCE(SUM(tolangan), 0)  AS jami_tolov,
            COALESCE(SUM(qarz), 0)      AS joriy_qarz_sum,
            COALESCE(AVG(jami), 0)      AS ortacha_chek,
            COALESCE(MAX(jami), 0)      AS eng_katta_chek,
            COUNT(*)                    AS sotuv_soni
        FROM sotuv_sessiyalar
        WHERE klient_id = $1 AND user_id = $2
    """, klient_id, uid)

    # Aktiv qarz balansi
    aktiv_qarz = await conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
        WHERE klient_id = $1 AND user_id = $2 AND NOT yopildi
    """, klient_id, uid) or 0

    # Oylik trend (6 oy)
    oylik = await conn.fetch("""
        SELECT DATE_TRUNC('month', sana) AS oy,
               SUM(jami) AS summa, COUNT(*) AS soni
        FROM sotuv_sessiyalar
        WHERE klient_id = $1 AND user_id = $2
          AND sana >= NOW() - INTERVAL '6 months'
        GROUP BY oy ORDER BY oy
    """, klient_id, uid)

    # ═══ 3. RFM ═══
    oxirgi_sotuv = profil.get("oxirgi_ss_sana") or profil.get("oxirgi_sotuv")
    oxirgi_kun = 0
    if oxirgi_sotuv:
        tz = oxirgi_sotuv.tzinfo
        oxirgi_kun = (datetime.now(tz=tz) - oxirgi_sotuv).days

    son_90 = await conn.fetchval("""
        SELECT COUNT(*) FROM sotuv_sessiyalar
        WHERE klient_id = $1 AND user_id = $2
          AND sana >= NOW() - INTERVAL '90 days'
    """, klient_id, uid) or 0

    summa_90 = float(await conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
        WHERE klient_id = $1 AND user_id = $2
          AND sana >= NOW() - INTERVAL '90 days'
    """, klient_id, uid) or 0)

    try:
        from shared.services.klient_segment import rfm_segment, SEGMENTLAR
        segment = rfm_segment(oxirgi_kun, son_90, summa_90)
        segment_info = SEGMENTLAR.get(segment, {})
    except Exception:
        segment, segment_info = "Potential", {"emoji": "🌱", "nomi": "Potential", "rang": "#4caf50"}

    # CLV (Customer Lifetime Value)
    birinchi = profil.get("birinchi_sotuv")
    if birinchi:
        days_active = max(1, (datetime.now(tz=birinchi.tzinfo) - birinchi).days)
    else:
        days_active = 1
    oylik_ortacha = float(moliya["jami_xarid"] or 0) / max(1, days_active / 30)
    clv_1_yil = oylik_ortacha * 12

    # ═══ 4. TOP TOVARLAR ═══
    top_tovarlar = await conn.fetch("""
        SELECT ch.tovar_nomi,
               SUM(ch.miqdor)       AS miqdor,
               SUM(ch.jami)         AS summa,
               COUNT(*)             AS sotib_olish_soni
        FROM chiqimlar ch
        WHERE ch.klient_id = $1 AND ch.user_id = $2
        GROUP BY ch.tovar_nomi
        ORDER BY SUM(ch.jami) DESC
        LIMIT 10
    """, klient_id, uid)

    # ═══ 5. CROSS-SELL TAVSIYA ═══
    cross_sell = await conn.fetch("""
        WITH bu_klient AS (
            SELECT DISTINCT tovar_id FROM chiqimlar
            WHERE klient_id = $1 AND user_id = $2 AND tovar_id IS NOT NULL
        ),
        oxshash_klientlar AS (
            SELECT DISTINCT klient_id FROM chiqimlar
            WHERE user_id = $2
              AND klient_id IS NOT NULL AND klient_id <> $1
              AND tovar_id IN (SELECT tovar_id FROM bu_klient)
            LIMIT 20
        )
        SELECT ch.tovar_nomi, ch.tovar_id,
               COUNT(DISTINCT ch.klient_id) AS necha_klient,
               AVG(ch.sotish_narxi)         AS ortacha_narx
        FROM chiqimlar ch
        WHERE ch.user_id = $2
          AND ch.klient_id IN (SELECT klient_id FROM oxshash_klientlar)
          AND (ch.tovar_id IS NULL OR ch.tovar_id NOT IN (SELECT tovar_id FROM bu_klient))
        GROUP BY ch.tovar_nomi, ch.tovar_id
        ORDER BY COUNT(DISTINCT ch.klient_id) DESC
        LIMIT 5
    """, klient_id, uid)

    # ═══ 6. HAFTA KUNLARI ═══
    hafta_kunlari = await conn.fetch("""
        SELECT EXTRACT(DOW FROM sana) AS kun,
               COUNT(*) AS soni, SUM(jami) AS summa
        FROM sotuv_sessiyalar
        WHERE klient_id = $1 AND user_id = $2
          AND sana >= NOW() - INTERVAL '90 days'
        GROUP BY kun ORDER BY soni DESC
    """, klient_id, uid)

    kun_nomlari = {0: "Yak", 1: "Du", 2: "Se", 3: "Chor", 4: "Pay", 5: "Ju", 6: "Shan"}

    # ═══ 7. NARX SEZGIRLIGI ═══
    # Chiqimlar qatorlarida chegirma_foiz bor — shuni ishlatamiz.
    narx_sezgirlik = await conn.fetchrow("""
        SELECT
            COUNT(CASE WHEN chegirma_foiz > 0 THEN 1 END) AS chegirmali,
            COUNT(CASE WHEN chegirma_foiz = 0 THEN 1 END) AS chegirmasiz,
            AVG(CASE WHEN chegirma_foiz > 0 THEN jami END) AS chegirmali_ortacha,
            AVG(CASE WHEN chegirma_foiz = 0 THEN jami END) AS chegirmasiz_ortacha
        FROM chiqimlar
        WHERE klient_id = $1 AND user_id = $2
    """, klient_id, uid)

    return {
        "profil": {
            "id":              profil["id"],
            "nom":             profil.get("ism") or "",
            "telefon":         profil.get("telefon") or "",
            "manzil":          profil.get("manzil") or "",
            "kategoriya":      profil.get("kategoriya") or "oddiy",
            "yaratilgan":      str(profil.get("yaratilgan") or ""),
            "birinchi_sotuv":  str(profil.get("birinchi_sotuv") or ""),
            "oxirgi_sotuv":    str(oxirgi_sotuv or ""),
            "oxirgi_sotuv_kun": oxirgi_kun,
            "kunlar_bilan":    days_active,
        },
        "moliya": {
            "jami_xarid":     str(moliya["jami_xarid"] or 0),
            "jami_tolov":     str(moliya["jami_tolov"] or 0),
            "joriy_qarz":     str(aktiv_qarz),
            "ortacha_chek":   str(moliya["ortacha_chek"] or 0),
            "eng_katta_chek": str(moliya["eng_katta_chek"] or 0),
            "sotuv_soni":     int(moliya["sotuv_soni"] or 0),
        },
        "oylik_trend": [
            {"oy": str(o["oy"]), "summa": str(o["summa"]), "soni": o["soni"]}
            for o in oylik
        ],
        "segment": {
            "segment": segment,
            "emoji":   segment_info.get("emoji", ""),
            "nomi":    segment_info.get("nomi", ""),
            "rang":    segment_info.get("rang", ""),
        },
        "clv": {
            "oylik_ortacha":  round(oylik_ortacha, 0),
            "yillik_prognoz": round(clv_1_yil, 0),
        },
        "top_tovarlar": [dict(r) for r in top_tovarlar],
        "cross_sell": [
            {
                "nomi":         r["tovar_nomi"],
                "necha_klient": int(r["necha_klient"] or 0),
                "narx":         str(r["ortacha_narx"] or 0),
            }
            for r in cross_sell
        ],
        "hafta_kunlari": [
            {
                "kun":   kun_nomlari.get(int(r["kun"]), "?"),
                "soni":  int(r["soni"] or 0),
                "summa": str(r["summa"] or 0),
            }
            for r in hafta_kunlari
        ],
        "narx_sezgirligi": {
            "chegirmali_sotuv":  int(narx_sezgirlik["chegirmali"] or 0) if narx_sezgirlik else 0,
            "chegirmasiz_sotuv": int(narx_sezgirlik["chegirmasiz"] or 0) if narx_sezgirlik else 0,
            "chegirmaga_sezgir": (
                float(narx_sezgirlik["chegirmali_ortacha"] or 0) >
                float(narx_sezgirlik["chegirmasiz_ortacha"] or 0) * 1.2
            ) if narx_sezgirlik else False,
        },
    }
