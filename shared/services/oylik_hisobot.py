"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — OYLIK PDF HISOBOT GENERATORI                 ║
║  Professional PDF hisobot — klientlarga yuborish uchun          ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")


async def oylik_hisobot_data(conn, uid: int, yil: int, oy: int) -> dict:
    """Oylik hisobot uchun barcha ma'lumotlarni yig'ish."""

    # Asosiy ko'rsatkichlar
    asosiy = await conn.fetchrow("""
        SELECT
            COUNT(*) AS sotuv_soni,
            COALESCE(SUM(jami), 0) AS jami_tushum,
            COALESCE(SUM(tolangan), 0) AS tolangan,
            COALESCE(SUM(qarz), 0) AS yangi_qarz,
            COUNT(DISTINCT klient_ismi) AS klient_soni,
            COUNT(DISTINCT (sana AT TIME ZONE 'Asia/Tashkent')::date) AS faol_kunlar
        FROM sotuv_sessiyalar
        WHERE EXTRACT(MONTH FROM sana) = $1
          AND EXTRACT(YEAR FROM sana) = $2
    """, oy, yil)

    # Foyda
    foyda = await conn.fetchval("""
        SELECT COALESCE(SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor), 0)
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE EXTRACT(MONTH FROM ss.sana) = $1
          AND EXTRACT(YEAR FROM ss.sana) = $2
          AND ch.olish_narxi > 0
    """, oy, yil) or 0

    # Top 10 tovar
    top_tovarlar = await conn.fetch("""
        SELECT tovar_nomi, SUM(miqdor) miqdor, SUM(jami) jami,
               SUM((sotish_narxi - olish_narxi) * miqdor) foyda
        FROM chiqimlar
        WHERE EXTRACT(MONTH FROM sana) = $1
          AND EXTRACT(YEAR FROM sana) = $2
        GROUP BY tovar_nomi
        ORDER BY jami DESC LIMIT 10
    """, oy, yil)

    # Top 10 klient
    top_klientlar = await conn.fetch("""
        SELECT klient_ismi, COUNT(*) soni, SUM(jami) jami, SUM(qarz) qarz
        FROM sotuv_sessiyalar
        WHERE EXTRACT(MONTH FROM sana) = $1
          AND EXTRACT(YEAR FROM sana) = $2
          AND klient_ismi IS NOT NULL
        GROUP BY klient_ismi
        ORDER BY jami DESC LIMIT 10
    """, oy, yil)

    # Kunlik trend
    kunlik = await conn.fetch("""
        SELECT (sana AT TIME ZONE 'Asia/Tashkent')::date AS kun,
               COUNT(*) soni, COALESCE(SUM(jami),0) jami
        FROM sotuv_sessiyalar
        WHERE EXTRACT(MONTH FROM sana) = $1
          AND EXTRACT(YEAR FROM sana) = $2
        GROUP BY kun ORDER BY kun
    """, oy, yil)

    # Jami qarz
    jami_qarz = await conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
        WHERE yopildi = FALSE AND qolgan > 0
    """) or 0

    # Kirimlar
    kirim = await conn.fetchrow("""
        SELECT COUNT(*) soni, COALESCE(SUM(jami),0) jami
        FROM kirimlar
        WHERE EXTRACT(MONTH FROM sana) = $1
          AND EXTRACT(YEAR FROM sana) = $2
    """, oy, yil)

    oy_nomlari = ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
                   "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"]

    tushum = float(asosiy["jami_tushum"])
    foyda_f = float(foyda)

    return {
        "yil": yil,
        "oy": oy,
        "oy_nomi": oy_nomlari[oy],
        # Asosiy
        "sotuv_soni": int(asosiy["sotuv_soni"]),
        "jami_tushum": tushum,
        "tolangan": float(asosiy["tolangan"]),
        "yangi_qarz": float(asosiy["yangi_qarz"]),
        "klient_soni": int(asosiy["klient_soni"]),
        "faol_kunlar": int(asosiy["faol_kunlar"]),
        # Foyda
        "foyda": foyda_f,
        "margin": round(foyda_f / tushum * 100, 1) if tushum > 0 else 0,
        # Kirim
        "kirim_soni": int(kirim["soni"]),
        "kirim_jami": float(kirim["jami"]),
        # Qarz
        "jami_qarz": float(jami_qarz),
        # Top
        "top_tovarlar": [dict(r) for r in top_tovarlar],
        "top_klientlar": [dict(r) for r in top_klientlar],
        # Trend
        "kunlik": [{"kun": str(r["kun"]), "soni": int(r["soni"]),
                     "jami": float(r["jami"])} for r in kunlik],
    }


def oylik_matn_hisobot(data: dict) -> str:
    """Telegram Markdown formatda oylik hisobot."""
    d = data
    matn = (
        f"📊 *OYLIK HISOBOT*\n"
        f"📅 {d['oy_nomi']} {d['yil']}\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📦 Sotuvlar: *{d['sotuv_soni']}* ta\n"
        f"💰 Tushum: *{d['jami_tushum']:,.0f}* so'm\n"
        f"💵 Naqd: {d['tolangan']:,.0f}\n"
    )
    if d["yangi_qarz"] > 0:
        matn += f"📝 Yangi qarz: {d['yangi_qarz']:,.0f}\n"

    matn += (
        f"\n💹 *SOF FOYDA: {d['foyda']:,.0f}* so'm ({d['margin']}%)\n"
        f"👥 Klientlar: {d['klient_soni']}\n"
        f"📅 Faol kunlar: {d['faol_kunlar']}\n"
    )

    if d["jami_qarz"] > 0:
        matn += f"\n⚠️ Jami qarz: *{d['jami_qarz']:,.0f}*\n"

    # Top 5 tovar
    if d["top_tovarlar"]:
        matn += "\n🏆 *Top tovarlar:*\n"
        for i, t in enumerate(d["top_tovarlar"][:5], 1):
            matn += f"  {i}. {t['tovar_nomi']}: {float(t['jami']):,.0f}\n"

    # Top 5 klient
    if d["top_klientlar"]:
        matn += "\n👑 *Top klientlar:*\n"
        for i, k in enumerate(d["top_klientlar"][:5], 1):
            matn += f"  {i}. {k['klient_ismi']}: {float(k['jami']):,.0f}\n"

    matn += "\n📊 /kpi — Samaradorlik | /tahlil — AI maslahat"
    return matn
