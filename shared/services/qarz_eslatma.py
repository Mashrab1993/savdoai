"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — QARZ ESLATMA TIZIMI                         ║
║  Khatabook modelidan ilhomlangan (150M+ user)                   ║
║                                                                  ║
║  XUSUSIYATLAR:                                                   ║
║  ✅ Avtomatik Telegram eslatma (kunlik/haftalik)                ║
║  ✅ Klientga to'g'ridan-to'g'ri xabar                          ║
║  ✅ Muddati o'tgan qarzlar uchun urgent eslatma                ║
║  ✅ Do'konchi nomidan professional xabar                         ║
║  ✅ Eslatma tarixi (spam oldini olish)                          ║
║  ✅ Klient javob bersa — do'konchiga forward                    ║
║                                                                  ║
║  FLOW:                                                           ║
║  1. Scheduler har kuni 10:00 da tekshiradi                      ║
║  2. Muddati o'tgan/yaqinlashgan qarzlarni topadi                ║
║  3. Do'konchiga: "3 ta klient qarz eslatma kutmoqda"           ║
║  4. Do'konchi "Eslatish" tugmasini bosadi                        ║
║  5. Klientga professional xabar ketadi                           ║
║  6. Klient javob bersa → do'konchiga forward                    ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Optional

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

# Eslatma shablonlari — professional va yumshoq
_ESLATMA_SHABLONLAR = {
    "yumshoq": (
        "Assalomu alaykum, {klient_ism}!\n\n"
        "🏪 {dokon_nomi} dan xabar.\n\n"
        "Sizda {qarz_summa} miqdorida to'lanmagan hisob mavjud.\n"
        "Imkoniyatingiz bo'lsa, to'lovni amalga oshirishingizni "
        "so'rab qolamiz.\n\n"
        "📞 Savol bo'lsa: {telefon}\n"
        "Hurmat bilan, {dokon_nomi}"
    ),
    "oddiy": (
        "Salom, {klient_ism}!\n\n"
        "🏪 {dokon_nomi}.\n"
        "Sizda {qarz_summa} qarz bor.\n"
        "{qarz_tafsilot}\n"
        "To'lov qilishingizni kutamiz.\n\n"
        "📞 {telefon}"
    ),
    "urgent": (
        "⚠️ {klient_ism}, diqqat!\n\n"
        "🏪 {dokon_nomi} dan muhim xabar.\n\n"
        "Sizda {qarz_summa} miqdorida to'lanmagan qarz bor.\n"
        "Muddat: {muddat} (o'tib ketgan!)\n"
        "{qarz_tafsilot}\n\n"
        "Iltimos, imkon qadar tezroq to'lang.\n"
        "📞 {telefon}"
    ),
}

# Spam oldini olish — bitta klientga 3 kundan ko'p eslatma yubormaslik
_MIN_ESLATMA_ORALIGI_KUN = 3


async def qarz_eslatma_royxati(conn, uid: int) -> list[dict]:
    """
    Eslatma kerak bo'lgan qarzlarni olish.
    Guruhlab: klient bo'yicha jami qarz.
    """
    rows = await conn.fetch("""
        SELECT
            q.klient_ismi,
            q.klient_id,
            k.telefon,
            SUM(q.qolgan) AS jami_qarz,
            COUNT(*) AS qarz_soni,
            MIN(q.muddat) AS eng_yaqin_muddat,
            MIN(q.yaratilgan) AS eng_eski_qarz,
            MAX(q.yangilangan) AS oxirgi_yangilangan
        FROM qarzlar q
        LEFT JOIN klientlar k ON k.id = q.klient_id AND k.user_id = $1
        WHERE q.user_id = $1
          AND q.yopildi = FALSE
          AND q.qolgan > 0
        GROUP BY q.klient_ismi, q.klient_id, k.telefon
        ORDER BY jami_qarz DESC
    """, uid)

    natija = []
    bugun = date.today()
    for r in rows:
        # Normalize muddat to date (asyncpg may return date or datetime)
        raw_muddat = r["eng_yaqin_muddat"]
        muddat = raw_muddat.date() if hasattr(raw_muddat, "date") and callable(raw_muddat.date) else raw_muddat
        muddati_otgan = muddat is not None and muddat < bugun

        # Holat aniqlash
        if muddati_otgan:
            holat = "urgent"
            kun_otgan = (bugun - muddat).days
        elif muddat and (muddat - bugun).days <= 3:
            holat = "oddiy"
            kun_otgan = 0
        else:
            holat = "yumshoq"
            kun_otgan = 0

        # Normalize eng_eski_qarz to date
        raw_eski = r["eng_eski_qarz"]
        if raw_eski is not None:
            eski_date = raw_eski.date() if hasattr(raw_eski, "date") and callable(raw_eski.date) else raw_eski
            eng_eski_kun = (bugun - eski_date).days
        else:
            eng_eski_kun = 0

        natija.append({
            "klient_ismi": r["klient_ismi"],
            "klient_id": r["klient_id"],
            "telefon": r["telefon"],
            "jami_qarz": float(r["jami_qarz"]),
            "qarz_soni": int(r["qarz_soni"]),
            "muddat": str(muddat) if muddat else None,
            "muddati_otgan": muddati_otgan,
            "kun_otgan": kun_otgan,
            "holat": holat,
            "eng_eski_kun": eng_eski_kun,
        })

    return natija


def eslatma_matni(
    klient_ism: str,
    dokon_nomi: str,
    telefon: str,
    jami_qarz: float,
    qarz_soni: int,
    muddat: str | None,
    holat: str = "yumshoq",
) -> str:
    """Professional eslatma matni generatsiya."""
    qarz_summa = f"{jami_qarz:,.0f} so'm"

    tafsilot_parts = []
    if qarz_soni > 1:
        tafsilot_parts.append(f"({qarz_soni} ta qarz)")
    if muddat:
        tafsilot_parts.append(f"Muddat: {muddat}")
    qarz_tafsilot = " | ".join(tafsilot_parts)

    shablon = _ESLATMA_SHABLONLAR.get(holat, _ESLATMA_SHABLONLAR["yumshoq"])
    return shablon.format(
        klient_ism=klient_ism,
        dokon_nomi=dokon_nomi,
        telefon=telefon or "",
        qarz_summa=qarz_summa,
        qarz_tafsilot=qarz_tafsilot,
        muddat=muddat or "-",
    )


async def eslatma_yuborish_mumkinmi(conn, uid: int, klient_id: int) -> bool:
    """Spam oldini olish — oxirgi eslatmadan N kun o'tganmi."""
    try:
        oxirgi = await conn.fetchval("""
            SELECT MAX(yuborilgan) FROM qarz_eslatmalar
            WHERE user_id = $1 AND klient_id = $2
        """, uid, klient_id)
        if oxirgi is None:
            return True
        # Ensure both are timezone-aware for safe subtraction
        now = datetime.now(TZ)
        if oxirgi.tzinfo is None:
            from zoneinfo import ZoneInfo
            oxirgi = oxirgi.replace(tzinfo=ZoneInfo("Asia/Tashkent"))
        farq = (now - oxirgi).days
        return farq >= _MIN_ESLATMA_ORALIGI_KUN
    except Exception:
        # Jadval yo'q bo'lsa — yuborish mumkin
        return True


async def eslatma_qayd_qilish(conn, uid: int, klient_id: int,
                                klient_ismi: str, summa: float,
                                usul: str = "telegram") -> None:
    """Eslatma yuborilganini qayd qilish."""
    try:
        await conn.execute("""
            INSERT INTO qarz_eslatmalar
                (user_id, klient_id, klient_ismi, summa, usul)
            VALUES ($1, $2, $3, $4, $5)
        """, uid, klient_id, klient_ismi, Decimal(str(summa)), usul)
    except Exception as e:
        log.debug("Eslatma qayd: %s", e)


async def kunlik_qarz_xulosa(conn, uid: int) -> dict:
    """Do'konchi uchun kunlik qarz xulosa — bot scheduler uchun."""
    stats = await conn.fetchrow("""
        SELECT
            COUNT(DISTINCT klient_ismi) AS klient_soni,
            COALESCE(SUM(qolgan), 0) AS jami_qarz,
            COUNT(*) FILTER(WHERE muddat IS NOT NULL AND muddat < CURRENT_DATE)
                AS muddati_otgan_soni,
            COALESCE(SUM(qolgan) FILTER(WHERE muddat IS NOT NULL AND muddat < CURRENT_DATE), 0)
                AS muddati_otgan_summa
        FROM qarzlar
        WHERE user_id = $1 AND yopildi = FALSE AND qolgan > 0
    """, uid)

    return {
        "klient_soni": int(stats["klient_soni"]),
        "jami_qarz": float(stats["jami_qarz"]),
        "muddati_otgan_soni": int(stats["muddati_otgan_soni"]),
        "muddati_otgan_summa": float(stats["muddati_otgan_summa"]),
    }
