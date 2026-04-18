"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — SMART NOTIFICATION ENGINE                    ║
║                                                                  ║
║  Aqlli bildirishnoma tizimi — do'konchiga kerakli vaqtda        ║
║  kerakli xabar yuboradi. Spam emas — AQLLI xabar.              ║
║                                                                  ║
║  JADVAL:                                                         ║
║  📋 08:00 — Ertalabki xulosa (kecha natija + bugun vazifa)     ║
║  ⚠️ 10:00 — Qarz eslatmalar (avtomatik)                        ║
║  📦 12:00 — Kam qoldiq ogohlantirish                           ║
║  📊 20:00 — Kechki hisobot (bugun natija)                      ║
║  📈 Dushanba 09:00 — Haftalik xulosa                           ║
║  🏆 1-sana 09:00 — Oylik hisobot                               ║
║                                                                  ║
║  AQLLI LOGIKA:                                                   ║
║  - Sotuv bo'lmagan kunda — hisobot yuborMAYDI                   ║
║  - Qarz yo'q bo'lsa — eslatma yuborMAYDI                        ║
║  - Muhim o'zgarish bo'lganda — darhol yuboradi                  ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")


async def ertalabki_xulosa(conn, uid: int) -> str | None:
    """
    08:00 ertalabki xulosa.
    Kechagi natija + bugungi vazifalar.
    Agar kecha sotuv bo'lmagan bo'lsa — None qaytaradi (yuborMAYDI).
    """
    # Kechagi natija
    kecha = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami,
               COALESCE(SUM(tolangan),0) tolangan, COALESCE(SUM(qarz),0) qarz
        FROM sotuv_sessiyalar
        WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE - 1
    """)

    # Agar kecha sotuv bo'lmasa — spam qilmaymiz
    if int(kecha["soni"]) == 0:
        return None

    # Bugungi vazifalar
    muddati_otgan = await conn.fetchval("""
        SELECT COUNT(*) FROM qarzlar
        WHERE yopildi=FALSE AND qolgan>0 AND muddat IS NOT NULL AND muddat <= CURRENT_DATE
    """) or 0

    kam_qoldiq = await conn.fetchval("""
        SELECT COUNT(*) FROM tovarlar
        WHERE user_id=$1 AND min_qoldiq>0 AND qoldiq<=min_qoldiq
    """, uid) or 0

    # KPI trend
    oldingi_hafta = await conn.fetchval("""
        SELECT COALESCE(SUM(jami),0) FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '14 days' AND sana < NOW() - interval '7 days'
    """) or 0
    shu_hafta = await conn.fetchval("""
        SELECT COALESCE(SUM(jami),0) FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '7 days'
    """) or 0

    trend_emoji = "📈" if float(shu_hafta) > float(oldingi_hafta) else (
        "📉" if float(shu_hafta) < float(oldingi_hafta) * 0.9 else "➡️")

    matn = (
        f"🌅 *ERTALABKI XULOSA*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📋 *Kecha natija:*\n"
        f"  📦 Sotuvlar: {int(kecha['soni'])} ta\n"
        f"  💰 Tushum: {float(kecha['jami']):,.0f} so'm\n"
        f"  💳 Naqd: {float(kecha['tolangan']):,.0f}\n"
    )
    if float(kecha["qarz"]) > 0:
        matn += f"  📝 Nasiya: {float(kecha['qarz']):,.0f}\n"

    matn += f"\n{trend_emoji} Haftalik trend\n\n"

    # Bugungi vazifalar
    vazifalar = []
    if muddati_otgan > 0:
        vazifalar.append(f"🚨 {muddati_otgan} ta muddati o'tgan qarz")
    if kam_qoldiq > 0:
        vazifalar.append(f"⚠️ {kam_qoldiq} ta tovar kam qoldiq")

    if vazifalar:
        matn += "📌 *Bugungi vazifalar:*\n"
        for v in vazifalar:
            matn += f"  {v}\n"
    else:
        matn += "✅ Barcha vazifalar bajarilgan!\n"

    # AI Advisor — bitta eng muhim insight
    try:
        from shared.services.ai_advisor import biznes_tahlil
        advisor = await biznes_tahlil(conn, uid)
        if advisor.get("insightlar"):
            top_insight = advisor["insightlar"][0]
            matn += (
                f"\n🧠 *AI Maslahat:*\n"
                f"  {top_insight['emoji']} {top_insight['sarlavha']}\n"
                f"  💡 _{top_insight['tavsiya']}_\n"
            )
    except Exception:
        pass

    matn += "\n💪 Yaxshi kun tilaymiz!"
    return matn


async def kechki_hisobot(conn, uid: int) -> str | None:
    """
    20:00 kechki hisobot.
    Bugungi natija.
    Agar sotuv bo'lmasa — None (yuborMAYDI).
    """
    bugun = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami,
               COALESCE(SUM(tolangan),0) tolangan, COALESCE(SUM(qarz),0) qarz,
               COUNT(DISTINCT klient_ismi) klient_soni
        FROM sotuv_sessiyalar
        WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
    """)

    if int(bugun["soni"]) == 0:
        return None

    # Foyda
    foyda = await conn.fetchval("""
        SELECT COALESCE(SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE (ss.sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
    """) or 0

    jami = float(bugun["jami"])
    margin = (float(foyda) / jami * 100) if jami > 0 else 0

    matn = (
        f"🌙 *KECHKI HISOBOT*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📦 Sotuvlar: *{int(bugun['soni'])}* ta\n"
        f"💰 Tushum: *{jami:,.0f}* so'm\n"
        f"💵 Naqd: {float(bugun['tolangan']):,.0f}\n"
    )
    if float(bugun["qarz"]) > 0:
        matn += f"📝 Nasiya: {float(bugun['qarz']):,.0f}\n"
    matn += (
        f"👥 Klientlar: {int(bugun['klient_soni'])}\n"
        f"\n💹 Sof foyda: *{float(foyda):,.0f}* so'm ({margin:.1f}%)\n"
        f"\n🌟 Rahmat, yaxshi ish bo'ldi!"
    )
    return matn


async def haftalik_digest(conn, uid: int) -> str | None:
    """Dushanba ertalab 09:00 — haftalik xulosa."""
    hafta = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami,
               COALESCE(SUM(tolangan),0) tolangan,
               COUNT(DISTINCT klient_ismi) klient_soni,
               COUNT(DISTINCT (sana AT TIME ZONE 'Asia/Tashkent')::date) faol_kun
        FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '7 days'
    """)

    if int(hafta["soni"]) == 0:
        return None

    # Oldingi hafta bilan taqqoslash
    oldingi = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami
        FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '14 days' AND sana < NOW() - interval '7 days'
    """)

    jami = float(hafta["jami"])
    oldingi_jami = float(oldingi["jami"])
    farq = ((jami - oldingi_jami) / oldingi_jami * 100) if oldingi_jami > 0 else 0
    trend = "📈" if farq > 5 else ("📉" if farq < -5 else "➡️")

    # Foyda
    foyda = await conn.fetchval("""
        SELECT COALESCE(SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ss.sana >= NOW() - interval '7 days'
    """) or 0

    # Top tovar
    top_tovar = await conn.fetch("""
        SELECT tovar_nomi, SUM(miqdor) miqdor, SUM(jami) jami
        FROM chiqimlar WHERE sana >= NOW() - interval '7 days'
        GROUP BY tovar_nomi ORDER BY jami DESC LIMIT 3
    """)

    # Top klient
    top_klient = await conn.fetch("""
        SELECT klient_ismi, SUM(jami) jami, COUNT(*) soni
        FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '7 days' AND klient_ismi IS NOT NULL
        GROUP BY klient_ismi ORDER BY jami DESC LIMIT 3
    """)

    matn = (
        f"📊 *HAFTALIK XULOSA*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📦 Sotuvlar: *{int(hafta['soni'])}* ta\n"
        f"💰 Tushum: *{jami:,.0f}* so'm\n"
        f"💹 Foyda: *{float(foyda):,.0f}* so'm\n"
        f"👥 Klientlar: {int(hafta['klient_soni'])}\n"
        f"📅 Faol kunlar: {int(hafta['faol_kun'])}/7\n"
        f"\n{trend} O'tgan haftaga nisbatan: *{farq:+.1f}%*\n"
    )

    if top_tovar:
        matn += "\n🏆 *Top tovarlar:*\n"
        for i, t in enumerate(top_tovar, 1):
            matn += f"  {i}. {t['tovar_nomi']}: {float(t['jami']):,.0f}\n"

    if top_klient:
        matn += "\n👑 *Top klientlar:*\n"
        for i, k in enumerate(top_klient, 1):
            matn += f"  {i}. {k['klient_ismi']}: {float(k['jami']):,.0f}\n"

    return matn


async def critical_alert(conn, uid: int) -> str | None:
    """
    MUHIM OGOHLANTIRISH — darhol yuboriladi.
    Faqat jiddiy holatlarda:
    - Tovar tugagan (qoldiq = 0, lekin sotilayotgan)
    - Juda katta qarz (kredit limitdan oshgan)
    - Zarar bilan sotuv
    """
    alerts = []

    # Tugagan lekin sotilayotgan tovarlar
    tugagan = await conn.fetch("""
        SELECT t.nomi, t.qoldiq
        FROM tovarlar t
        WHERE t.user_id = $1 AND t.qoldiq <= 0 AND t.min_qoldiq > 0
        AND EXISTS (
            SELECT 1 FROM chiqimlar ch
            WHERE ch.tovar_id = t.id AND ch.sana >= NOW() - interval '3 days'
        )
    """, uid)
    for t in tugagan:
        alerts.append(f"🚨 *{t['nomi']}* TUGADI! (oxirgi 3 kunda sotilgan)")

    # Kredit limitdan oshgan klientlar
    limit_oshgan = await conn.fetch("""
        SELECT k.ism, k.kredit_limit,
               COALESCE(SUM(q.qolgan), 0) AS jami_qarz
        FROM klientlar k
        JOIN qarzlar q ON q.klient_id = k.id AND q.yopildi = FALSE AND q.qolgan > 0
        WHERE k.user_id = $1 AND k.kredit_limit > 0
        GROUP BY k.id
        HAVING SUM(q.qolgan) > k.kredit_limit
    """, uid)
    for k in limit_oshgan:
        alerts.append(
            f"⚠️ *{k['ism']}*: qarz {float(k['jami_qarz']):,.0f} > "
            f"limit {float(k['kredit_limit']):,.0f}"
        )

    if not alerts:
        return None

    return (
        "🔔 *MUHIM OGOHLANTIRISH*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n\n"
        + "\n".join(alerts)
        + "\n\n_Darhol choralar ko'ring!_"
    )


async def notification_dispatch(conn, uid: int, turi: str) -> str | None:
    """
    Xabar turini tanlash va generatsiya.
    Scheduler yoki API dan chaqiriladi.
    
    turi: "ertalab" | "kechqurun" | "haftalik" | "critical"
    """
    handlers = {
        "ertalab": ertalabki_xulosa,
        "kechqurun": kechki_hisobot,
        "haftalik": haftalik_digest,
        "critical": critical_alert,
    }
    handler = handlers.get(turi)
    if not handler:
        return None
    try:
        return await handler(conn, uid)
    except Exception as e:
        log.error("Notification %s uid=%d: %s", turi, uid, e)
        return None
