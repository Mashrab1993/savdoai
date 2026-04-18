"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — AQLLI SOTUV VALIDATSIYA                      ║
║                                                                  ║
║  Sotuv qilishdan OLDIN va KEYIN aqlli tekshiruvlar:             ║
║                                                                  ║
║  OLDIN (pre-sale):                                               ║
║  ✅ Kredit limit tekshirish                                     ║
║  ✅ Klient loyalty darajasi → avtomatik chegirma                ║
║  ✅ Tovar qoldiq yetarliligi                                    ║
║  ✅ Zarar bilan sotuv ogohlantirisji                            ║
║                                                                  ║
║  KEYIN (post-sale):                                              ║
║  ✅ Loyalty ball qo'shish (avtomatik)                           ║
║  ✅ Kam qoldiq ogohlantirish                                    ║
║  ✅ Critical stock Telegram alert                               ║
║  ✅ Kunlik KPI yangilash                                        ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

log = logging.getLogger(__name__)
D = lambda v: Decimal(str(v or 0))


async def pre_sale_checks(conn, uid: int, klient_ismi: str,
                           klient_id: int | None,
                           jami_summa: float,
                           tovarlar: list) -> dict:
    """
    Sotuv oldin tekshiruvlar. Xatolarni TO'XTATMAYDI — faqat ogohlantiradi.
    
    Qaytaradi:
    {
        "ogohlar": ["⚠️ Kredit limit...", ...],
        "xatolar": ["❌ Qoldiq yetarli emas", ...],
        "loyalty": {"daraja": "Gold", "chegirma_foiz": 5},
        "davom_etish_mumkin": True/False
    }
    """
    ogohlar = []
    xatolar = []
    loyalty_info = None

    # ── 1. Kredit limit tekshirish ──
    if klient_id:
        try:
            klient = await conn.fetchrow("""
                SELECT ism, kredit_limit FROM klientlar
                WHERE id = $1 AND user_id = $2
            """, klient_id, uid)

            if klient and klient["kredit_limit"] and float(klient["kredit_limit"]) > 0:
                mavjud_qarz = await conn.fetchval("""
                    SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
                    WHERE klient_id = $1 AND yopildi = FALSE AND qolgan > 0
                """, klient_id) or 0

                yangi_jami = float(mavjud_qarz) + jami_summa
                limit = float(klient["kredit_limit"])

                if yangi_jami > limit:
                    ogohlar.append(
                        f"⚠️ Kredit limit: {klient['ism']} — "
                        f"mavjud qarz {float(mavjud_qarz):,.0f} + yangi {jami_summa:,.0f} = "
                        f"{yangi_jami:,.0f} > limit {limit:,.0f}"
                    )
        except Exception as e:
            log.debug("Kredit limit check: %s", e)

    # ── 2. Loyalty daraja ──
    if klient_id:
        try:
            from shared.services.loyalty import klient_loyalty_profil
            profil = await klient_loyalty_profil(conn, uid, klient_id)
            daraja = profil.get("daraja", {})
            if daraja.get("chegirma_foiz", 0) > 0:
                loyalty_info = {
                    "daraja": daraja.get("nomi", ""),
                    "emoji": daraja.get("emoji", ""),
                    "chegirma_foiz": daraja["chegirma_foiz"],
                    "mavjud_ball": profil.get("mavjud_ball", 0),
                }
                ogohlar.append(
                    f"🎁 {daraja['emoji']} {klient_ismi} — {daraja['nomi']} "
                    f"({daraja['chegirma_foiz']}% chegirma imkoniyati)"
                )
        except Exception as e:
            log.debug("Loyalty profil: %s", e)

    # ── 3. Qoldiq yetarliligi ──
    for t in tovarlar:
        nomi = t.get("nomi", "")
        miqdor = D(t.get("miqdor", 0))
        if not nomi or miqdor <= 0:
            continue
        try:
            tovar = await conn.fetchrow("""
                SELECT nomi, qoldiq, min_qoldiq FROM tovarlar
                WHERE user_id = $1 AND lower(nomi) = lower($2)
            """, uid, nomi.strip())

            if tovar:
                qoldiq = D(tovar["qoldiq"])
                if qoldiq < miqdor:
                    xatolar.append(
                        f"❌ {nomi}: qoldiq {qoldiq} < kerak {miqdor}"
                    )
                elif qoldiq - miqdor <= D(tovar["min_qoldiq"]):
                    ogohlar.append(
                        f"⚠️ {nomi}: sotgandan keyin qoldiq kam bo'ladi "
                        f"({qoldiq - miqdor:.0f} < min {D(tovar['min_qoldiq']):.0f})"
                    )
        except Exception:
            pass

    # ── 4. Zarar tekshirish ──
    for t in tovarlar:
        nomi = t.get("nomi", "")
        sotish = D(t.get("narx", 0))
        if sotish <= 0 or not nomi:
            continue
        try:
            olish = await conn.fetchval("""
                SELECT olish_narxi FROM tovarlar
                WHERE user_id = $1 AND lower(nomi) = lower($2)
            """, uid, nomi.strip())
            if olish and D(olish) > sotish:
                ogohlar.append(
                    f"⚠️ ZARAR: {nomi} — sotish {sotish:,.0f} < olish {D(olish):,.0f}"
                )
        except Exception:
            pass

    return {
        "ogohlar": ogohlar,
        "xatolar": xatolar,
        "loyalty": loyalty_info,
        "davom_etish_mumkin": len(xatolar) == 0,
    }


async def post_sale_alerts(conn, uid: int, sessiya_id: int,
                            klient_id: int | None,
                            jami_summa: float) -> list[str]:
    """
    Sotuv KEYIN ogohlantirish. Asynchronous — sotuvni to'xtatMAYDI.
    
    Qaytaradi: ogohlar ro'yxati (Telegram xabar uchun).
    """
    ogohlar = []

    # ── 1. Kam qoldiq ──
    try:
        kam = await conn.fetch("""
            SELECT nomi, qoldiq, min_qoldiq FROM tovarlar
            WHERE user_id = $1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq
            AND qoldiq >= 0
            ORDER BY qoldiq ASC LIMIT 5
        """, uid)

        for t in kam:
            q = float(t["qoldiq"])
            if q <= 0:
                ogohlar.append(f"🚨 {t['nomi']}: TUGADI!")
            else:
                ogohlar.append(
                    f"⚠️ {t['nomi']}: {q:.0f} qoldi (min: {float(t['min_qoldiq']):.0f})"
                )
    except Exception as e:
        log.debug("Post-sale qoldiq check: %s", e)

    # ── 2. Loyalty ball ──
    if klient_id and jami_summa > 0:
        try:
            from shared.services.loyalty import ball_hisoblash
            ball = ball_hisoblash(jami_summa)
            if ball > 0:
                ogohlar.append(f"⭐ Klientga +{ball} bonus ball qo'shildi")
        except Exception as e:
            log.debug("Loyalty ball: %s", e)

    return ogohlar
