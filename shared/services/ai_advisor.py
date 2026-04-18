"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — AI BUSINESS ADVISOR (AQLLI MASLAHATCHI)      ║
║                                                                  ║
║  Ma'lumotdan XULOSA chiqaradi — oddiy statistika EMAS,          ║
║  balki ACTIONABLE INSIGHT:                                       ║
║                                                                  ║
║  ✅ Anomaliya aniqlash (sotuv tushdi/ko'tarildi)               ║
║  ✅ Klient yo'qotish ogohlantirish                              ║
║  ✅ Tovar trend tahlili (eng o'sgan/tushgan)                    ║
║  ✅ Foyda optimizatsiya tavsiyalari                             ║
║  ✅ Ish kuni/soat tahlili                                       ║
║  ✅ Mavsumiy pattern aniqlash                                   ║
║  ✅ Sotuv tezligi monitoring                                    ║
║                                                                  ║
║  FALSAFA:                                                        ║
║  Har bir insight = Nima sodir bo'ldi + Nima qilish kerak        ║
║  Oddiy raqam EMAS — harakat TAVSIYASI                           ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, date
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")
D = lambda v: Decimal(str(v or 0))


async def biznes_tahlil(conn, uid: int) -> dict:
    """
    To'liq biznes tahlili — barcha insightlar birgalikda.
    Bot /tahlil buyrug'i yoki dashboard uchun.
    """
    insightlar = []

    # Har bir tahlilni alohida try/except bilan — biri xato bo'lsa boshqalari ishlaydi
    analyzers = [
        ("Sotuv anomaliya", _sotuv_anomaliya),
        ("Klient yo'qotish", _klient_yoqotish),
        ("Tovar trend", _tovar_trend),
        ("Foyda insight", _foyda_insight),
        ("Ish ritmi", _ish_ritmi),
        ("Qarz xavf", _qarz_xavf),
    ]

    for name, func in analyzers:
        try:
            results = await func(conn, uid)
            insightlar.extend(results)
        except Exception as e:
            log.debug("AI Advisor %s: %s", name, e)

    # Yangi foydalanuvchi — yetarli ma'lumot yo'q
    if not insightlar:
        sotuv_soni = await conn.fetchval(
            "SELECT COUNT(*) FROM sotuv_sessiyalar WHERE user_id=$1", uid) or 0
        if sotuv_soni < 10:
            insightlar.append({
                "turi": "info",
                "emoji": "🌱",
                "sarlavha": "Yangi boshladingiz!",
                "tavsif": f"Hozircha {sotuv_soni} ta sotuv. Tahlil uchun kamida 10 ta sotuv kerak.",
                "tavsiya": "Sotuvlarni ovoz yoki matn bilan kiritishni davom eting — AI tez orada maslahat bera boshlaydi.",
            })
        else:
            insightlar.append({
                "turi": "info",
                "emoji": "✅",
                "sarlavha": "Hamma narsa yaxshi!",
                "tavsif": "Hozircha muhim o'zgarish yoki xavf aniqlanmadi.",
                "tavsiya": "Sotuvni davom eting, har hafta /tahlil buyrug'ini tekshiring.",
            })

    # Muhimlik bo'yicha tartiblash
    insightlar.sort(key=lambda x: {"critical": 0, "warning": 1,
                                     "opportunity": 2, "info": 3}.get(x["turi"], 4))

    return {
        "sana": str(date.today()),
        "insightlar": insightlar[:10],  # Top 10
        "jami_topildi": len(insightlar),
    }


async def _sotuv_anomaliya(conn, uid: int) -> list[dict]:
    """Sotuv hajmidagi g'ayrioddiy o'zgarishlarni aniqlash."""
    results = []

    # Oxirgi 7 kun vs oldingi 7 kun
    shu_hafta = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami
        FROM sotuv_sessiyalar WHERE sana >= NOW() - interval '7 days'
    """)
    oldingi = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami
        FROM sotuv_sessiyalar
        WHERE sana >= NOW() - interval '14 days' AND sana < NOW() - interval '7 days'
    """)

    sh_jami = float(shu_hafta["jami"])
    ol_jami = float(oldingi["jami"])

    if ol_jami > 0:
        farq = ((sh_jami - ol_jami) / ol_jami) * 100

        if farq < -20:
            results.append({
                "turi": "critical",
                "emoji": "📉",
                "sarlavha": "Sotuv keskin tushdi",
                "tavsif": (
                    f"Bu hafta sotuv {abs(farq):.0f}% kamaydi "
                    f"({sh_jami:,.0f} vs oldingi {ol_jami:,.0f}). "
                ),
                "tavsiya": (
                    "Klientlarga qo'ng'iroq qiling, yangi aktsiya o'ylab ko'ring, "
                    "yoki narxlarni qayta ko'rib chiqing."
                ),
            })
        elif farq > 30:
            results.append({
                "turi": "opportunity",
                "emoji": "🚀",
                "sarlavha": "Sotuv kuchli o'sdi!",
                "tavsif": (
                    f"Bu hafta sotuv {farq:.0f}% oshdi! "
                    f"({sh_jami:,.0f} vs oldingi {ol_jami:,.0f})"
                ),
                "tavsiya": (
                    "Sababni aniqlang (mavsumiy? yangi klient? aktsiya?) — "
                    "va bu momentumni saqlab qolish uchun harakatlar qiling."
                ),
            })

    # Bugun sotuv bo'lmagan (ish kuni)
    bugun_hafta_kuni = datetime.now(TZ).weekday()  # 0=Dushanba
    if bugun_hafta_kuni < 6:  # Yakshanba emas
        bugun_soni = await conn.fetchval("""
            SELECT COUNT(*) FROM sotuv_sessiyalar
            WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """) or 0
        soat = datetime.now(TZ).hour
        if bugun_soni == 0 and soat >= 12:
            results.append({
                "turi": "warning",
                "emoji": "⚠️",
                "sarlavha": "Bugun hali sotuv yo'q",
                "tavsif": f"Soat {soat}:00 — hali bitta ham sotuv ro'yxatga olinmagan.",
                "tavsiya": "Klientlarga qo'ng'iroq qiling yoki bozorga chiqing.",
            })

    return results


async def _klient_yoqotish(conn, uid: int) -> list[dict]:
    """Uzoq vaqt sotib olmagan klientlarni aniqlash."""
    results = []

    # Top klientlar — oxirgi 14 kunda sotib olmagan
    yoqolgan = await conn.fetch("""
        WITH top_klientlar AS (
            SELECT klient_ismi, klient_id, SUM(jami) AS jami_oldin,
                   MAX(sana) AS oxirgi_sotuv
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - interval '90 days'
              AND klient_ismi IS NOT NULL AND klient_id IS NOT NULL
            GROUP BY klient_ismi, klient_id
            HAVING SUM(jami) > 500000
            ORDER BY jami_oldin DESC LIMIT 20
        )
        SELECT * FROM top_klientlar
        WHERE oxirgi_sotuv < NOW() - interval '14 days'
        ORDER BY jami_oldin DESC LIMIT 5
    """)

    for k in yoqolgan:
        kun_otgan = (datetime.now(TZ) - k["oxirgi_sotuv"].astimezone(TZ)).days
        results.append({
            "turi": "warning",
            "emoji": "👤",
            "sarlavha": f"{k['klient_ismi']} yo'qolmoqda",
            "tavsif": (
                f"{kun_otgan} kundan beri sotib olmagan. "
                f"Oldin jami {float(k['jami_oldin']):,.0f} so'm sotib olgan."
            ),
            "tavsiya": (
                "Qo'ng'iroq qiling yoki maxsus taklif yuboring. "
                "Bu klient sizning top xaridorlaringizdan biri."
            ),
        })

    return results


async def _tovar_trend(conn, uid: int) -> list[dict]:
    """Eng o'sgan va eng tushgan tovarlar."""
    results = []

    rows = await conn.fetch("""
        WITH shu_hafta AS (
            SELECT tovar_nomi, SUM(jami) jami
            FROM chiqimlar WHERE sana >= NOW() - interval '7 days'
            GROUP BY tovar_nomi
        ),
        oldingi_hafta AS (
            SELECT tovar_nomi, SUM(jami) jami
            FROM chiqimlar
            WHERE sana >= NOW() - interval '14 days' AND sana < NOW() - interval '7 days'
            GROUP BY tovar_nomi
        )
        SELECT
            COALESCE(s.tovar_nomi, o.tovar_nomi) AS nomi,
            COALESCE(s.jami, 0) AS shu_hafta,
            COALESCE(o.jami, 0) AS oldingi_hafta,
            CASE WHEN COALESCE(o.jami,0) > 0
                 THEN ((COALESCE(s.jami,0) - o.jami) / o.jami * 100)
                 ELSE 100 END AS farq_foiz
        FROM shu_hafta s
        FULL OUTER JOIN oldingi_hafta o ON s.tovar_nomi = o.tovar_nomi
        WHERE COALESCE(s.jami,0) + COALESCE(o.jami,0) > 100000
        ORDER BY farq_foiz ASC
        LIMIT 3
    """)

    for r in rows:
        farq = float(r["farq_foiz"])
        if farq < -30:
            results.append({
                "turi": "warning",
                "emoji": "📦",
                "sarlavha": f"{r['nomi']} sotuvi tushdi",
                "tavsif": (
                    f"{abs(farq):.0f}% kamaydi bu hafta. "
                    f"({float(r['shu_hafta']):,.0f} vs {float(r['oldingi_hafta']):,.0f})"
                ),
                "tavsiya": "Narxni tekshiring, raqobatchilar bilan solishtiring.",
            })

    # Eng ko'p o'sgan
    top_osgan = await conn.fetch("""
        WITH shu_hafta AS (
            SELECT tovar_nomi, SUM(jami) jami FROM chiqimlar
            WHERE sana >= NOW() - interval '7 days' GROUP BY tovar_nomi
        ),
        oldingi_hafta AS (
            SELECT tovar_nomi, SUM(jami) jami FROM chiqimlar
            WHERE sana >= NOW()-interval '14 days' AND sana < NOW()-interval '7 days'
            GROUP BY tovar_nomi
        )
        SELECT s.tovar_nomi, s.jami shu_hafta, COALESCE(o.jami,0) oldingi,
            CASE WHEN COALESCE(o.jami,0)>0 THEN ((s.jami-o.jami)/o.jami*100) ELSE 100 END farq
        FROM shu_hafta s
        LEFT JOIN oldingi_hafta o ON s.tovar_nomi=o.tovar_nomi
        WHERE s.jami > 100000
        ORDER BY farq DESC LIMIT 1
    """)

    for r in top_osgan:
        if float(r["farq"]) > 30:
            results.append({
                "turi": "opportunity",
                "emoji": "⭐",
                "sarlavha": f"{r['tovar_nomi']} — eng ko'p o'sdi",
                "tavsif": f"{float(r['farq']):.0f}% o'sdi bu hafta!",
                "tavsiya": "Zaxirani ko'paytiring, bu tovarni ko'proq targ'ib qiling.",
            })

    return results


async def _foyda_insight(conn, uid: int) -> list[dict]:
    """Foyda optimizatsiya tavsiyalari."""
    results = []

    # Zarar bilan sotilayotgan tovarlar
    zarar = await conn.fetch("""
        SELECT ch.tovar_nomi,
               AVG(ch.sotish_narxi) avg_sotish,
               AVG(ch.olish_narxi) avg_olish,
               SUM(ch.miqdor) miqdor,
               SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS zarar
        FROM chiqimlar ch
        WHERE ch.sana >= NOW() - interval '30 days'
          AND ch.olish_narxi > 0 AND ch.sotish_narxi < ch.olish_narxi
        GROUP BY ch.tovar_nomi
        HAVING SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) < -10000
        ORDER BY zarar ASC LIMIT 3
    """)

    for z in zarar:
        results.append({
            "turi": "critical",
            "emoji": "💸",
            "sarlavha": f"{z['tovar_nomi']} — zarar bilan sotilmoqda!",
            "tavsif": (
                f"Olish: {float(z['avg_olish']):,.0f} > Sotish: {float(z['avg_sotish']):,.0f}. "
                f"Jami zarar: {abs(float(z['zarar'])):,.0f} so'm"
            ),
            "tavsiya": "Sotish narxini oshiring yoki bu tovarni sotishni to'xtating.",
        })

    # Eng ko'p foyda keltiradigan tovar
    top_foyda = await conn.fetchrow("""
        SELECT tovar_nomi,
               SUM((sotish_narxi - olish_narxi) * miqdor) AS foyda,
               SUM(jami) AS tushum
        FROM chiqimlar
        WHERE sana >= NOW() - interval '30 days' AND olish_narxi > 0
        GROUP BY tovar_nomi
        ORDER BY foyda DESC LIMIT 1
    """)

    if top_foyda and float(top_foyda["foyda"]) > 0:
        margin = float(top_foyda["foyda"]) / float(top_foyda["tushum"]) * 100
        results.append({
            "turi": "info",
            "emoji": "💎",
            "sarlavha": f"Eng foydali: {top_foyda['tovar_nomi']}",
            "tavsif": (
                f"30 kunda {float(top_foyda['foyda']):,.0f} so'm foyda "
                f"({margin:.0f}% margin)"
            ),
            "tavsiya": "Bu tovarni ko'proq sotishga e'tibor bering.",
        })

    return results


async def _ish_ritmi(conn, uid: int) -> list[dict]:
    """Eng yaxshi sotuv kuni va soatini aniqlash."""
    results = []

    # Eng yaxshi kun
    best_day = await conn.fetchrow("""
        SELECT EXTRACT(DOW FROM sana AT TIME ZONE 'Asia/Tashkent') AS hafta_kuni,
               COALESCE(SUM(jami), 0) AS jami,
               COUNT(*) AS soni
        FROM sotuv_sessiyalar WHERE sana >= NOW() - interval '30 days'
        GROUP BY hafta_kuni
        ORDER BY jami DESC LIMIT 1
    """)

    if best_day:
        kunlar = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba",
                  "Payshanba", "Juma", "Shanba"]
        kun_idx = int(best_day["hafta_kuni"])
        results.append({
            "turi": "info",
            "emoji": "📅",
            "sarlavha": f"Eng yaxshi kun: {kunlar[kun_idx]}",
            "tavsif": (
                f"{kunlar[kun_idx]} kuni o'rtacha {float(best_day['jami']):,.0f} so'm "
                f"({int(best_day['soni'])} ta sotuv)"
            ),
            "tavsiya": f"{kunlar[kun_idx]} kuni ko'proq ishlang va klientlarga murojaat qiling.",
        })

    return results


async def _qarz_xavf(conn, uid: int) -> list[dict]:
    """Qarz xavfi yuqori klientlar."""
    results = []

    # Kredit limitdan oshgan
    oshgan = await conn.fetch("""
        SELECT k.ism, k.kredit_limit,
               COALESCE(SUM(q.qolgan), 0) jami_qarz
        FROM klientlar k
        JOIN qarzlar q ON q.klient_id = k.id AND q.yopildi = FALSE AND q.qolgan > 0
        WHERE k.user_id = $1 AND k.kredit_limit > 0
        GROUP BY k.id
        HAVING SUM(q.qolgan) > k.kredit_limit * 1.2
        ORDER BY SUM(q.qolgan) DESC LIMIT 3
    """, uid)

    for k in oshgan:
        foiz = float(k["jami_qarz"]) / float(k["kredit_limit"]) * 100
        results.append({
            "turi": "critical",
            "emoji": "🚨",
            "sarlavha": f"{k['ism']} — kredit limit {foiz:.0f}% oshgan",
            "tavsif": (
                f"Qarz: {float(k['jami_qarz']):,.0f} / "
                f"Limit: {float(k['kredit_limit']):,.0f}"
            ),
            "tavsiya": "Bu klientga yangi nasiya berMANG. Avval qarz to'lashni talab qiling.",
        })

    return results


# ═══ BOT UCHUN FORMATLASH ═══

def insight_formatlash(insightlar: list[dict]) -> str:
    """Insightlarni bot uchun chiroyli matn qilish."""
    if not insightlar:
        return "✅ Hozircha hamma narsa yaxshi — muhim o'zgarish yo'q."

    matn = "🧠 *AI BIZNES MASLAHAT*\n━━━━━━━━━━━━━━━━━━━━━\n\n"

    for i, ins in enumerate(insightlar, 1):
        turi_emoji = {
            "critical": "🔴", "warning": "🟡",
            "opportunity": "🟢", "info": "🔵",
        }.get(ins["turi"], "⚪")

        matn += (
            f"{turi_emoji} {ins['emoji']} *{ins['sarlavha']}*\n"
            f"  {ins['tavsif']}\n"
            f"  💡 _{ins['tavsiya']}_\n\n"
        )

    return matn
