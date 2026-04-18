"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — MOLIYAVIY HISOBOTLAR (QuickBooks DARAJASI)            ║
║                                                                          ║
║  Avtomatik moliyaviy hisobotlar — buxgalter shart emas:                 ║
║                                                                          ║
║  1. FOYDA VA ZARAR (P&L)      — foyda_zarar()                           ║
║  2. BALANS (Balance Sheet)    — balans_varaq()                          ║
║  3. PUL OQIMI (Cash Flow)     — pul_oqimi()                             ║
║  4. KOEFFITSIENTLAR (KPI)     — biznes_koeffitsientlar()                ║
║                                                                          ║
║  Barcha raqamlar 100% Decimal — floating-point xato YO'Q.              ║
║                                                                          ║
║  Schema: sotuv_sessiyalar (ss), chiqimlar (ch), qarzlar (q),            ║
║          kirimlar (kr), xarajatlar (x), tovarlar (t).                   ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

log = logging.getLogger(__name__)
def D(v):
    return Decimal(str(v or 0)).quantize(Decimal("0.01"), ROUND_HALF_UP)


async def foyda_zarar(conn, uid: int, sana_dan: str | None = None,
                       sana_gacha: str | None = None) -> dict:
    """Foyda va Zarar hisoboti (P&L / Income Statement).

    QuickBooks Income Statement analogi.
    Agar sana berilmasa — joriy oy.
    """
    if not sana_dan:
        bugun = date.today()
        sana_dan = bugun.replace(day=1).isoformat()
        sana_gacha = bugun.isoformat()

    # ═══ DAROMAD ═══
    sotuv = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(jami), 0)        AS jami_sotuv,
            COALESCE(SUM(tolangan), 0)    AS jami_tolangan,
            COUNT(*)                      AS sotuv_soni
        FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha)

    # Qaytarishlar — qaytarishlar jadvalidan
    qaytarish = await conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0) FROM qaytarishlar
        WHERE user_id = $1
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or Decimal("0")

    # Chegirmalar — chiqimlarda chegirma_foiz bor
    chegirma = await conn.fetchval("""
        SELECT COALESCE(SUM(ch.sotish_narxi * ch.miqdor * ch.chegirma_foiz / 100), 0)
        FROM chiqimlar ch
        WHERE ch.user_id = $1
          AND (ch.sana AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or Decimal("0")

    sof_sotuv = D(sotuv["jami_sotuv"]) - D(qaytarish) - D(chegirma)

    # ═══ TANNARX (COGS) ═══
    tannarx = await conn.fetchval("""
        SELECT COALESCE(SUM(ch.olish_narxi * ch.miqdor), 0)
        FROM chiqimlar ch
        WHERE ch.user_id = $1
          AND (ch.sana AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or Decimal("0")
    tannarx = D(tannarx)

    yalpi_foyda  = sof_sotuv - tannarx
    yalpi_margin = (yalpi_foyda / sof_sotuv * 100) if sof_sotuv > 0 else Decimal("0")

    # ═══ XARAJATLAR ═══
    # xarajatlar jadvalida: admin_uid, kategoriya_nomi, summa, sana, tasdiqlangan, bekor_qilingan
    xarajat = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(summa), 0) AS jami,
            COALESCE(SUM(CASE WHEN kategoriya_nomi = 'ijara'     THEN summa END), 0) AS ijara,
            COALESCE(SUM(CASE WHEN kategoriya_nomi = 'oylik'     THEN summa END), 0) AS oylik,
            COALESCE(SUM(CASE WHEN kategoriya_nomi = 'transport' THEN summa END), 0) AS transport,
            COALESCE(SUM(CASE WHEN kategoriya_nomi = 'kommunal'  THEN summa END), 0) AS kommunal,
            COALESCE(SUM(CASE WHEN kategoriya_nomi NOT IN ('ijara','oylik','transport','kommunal')
                               THEN summa END), 0) AS boshqa
        FROM xarajatlar
        WHERE admin_uid = $1
          AND NOT bekor_qilingan
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha)

    jami_xarajat = D((xarajat or {}).get("jami", 0))
    sof_foyda    = yalpi_foyda - jami_xarajat
    sof_margin   = (sof_foyda / sof_sotuv * 100) if sof_sotuv > 0 else Decimal("0")

    return {
        "davr": {"dan": sana_dan, "gacha": sana_gacha},
        "daromad": {
            "jami_sotuv": str(D(sotuv["jami_sotuv"])),
            "qaytarish":  str(D(qaytarish)),
            "chegirma":   str(D(chegirma)),
            "sof_sotuv":  str(sof_sotuv),
            "sotuv_soni": int(sotuv["sotuv_soni"] or 0),
        },
        "tannarx": {
            "jami": str(tannarx),
        },
        "yalpi_foyda": {
            "summa":       str(yalpi_foyda),
            "margin_foiz": str(D(yalpi_margin)),
        },
        "xarajatlar": {
            "jami": str(jami_xarajat),
            "tafsilot": {
                "ijara":     str(D((xarajat or {}).get("ijara", 0))),
                "oylik":     str(D((xarajat or {}).get("oylik", 0))),
                "transport": str(D((xarajat or {}).get("transport", 0))),
                "kommunal":  str(D((xarajat or {}).get("kommunal", 0))),
                "boshqa":    str(D((xarajat or {}).get("boshqa", 0))),
            },
        },
        "sof_foyda": {
            "summa":       str(sof_foyda),
            "margin_foiz": str(D(sof_margin)),
            "holat": "foyda" if sof_foyda > 0 else "zarar" if sof_foyda < 0 else "nol",
        },
    }


async def balans_varaq(conn, uid: int) -> dict:
    """Balans varaq (Balance Sheet) — aktivlar = passivlar + kapital.

    Sotuv_sessiyalarda tolov_turi yo'q — shuning uchun hamma tolangan naqd
    deb olinadi (karta integratsiyasi qo'shilgandan keyin bo'linadi).
    """

    # AKTIVLAR
    # Kassa (tolangan summa) — hozircha tolov_turi yo'q, barchasi naqd deb olinadi.
    kassa_naqd = D(await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0)
        FROM sotuv_sessiyalar WHERE user_id = $1
    """, uid) or 0)

    kassa_karta = Decimal("0")  # hali tolov_turi yo'q

    # Debitorlar — aktiv qarzlar
    debitorlar = D(await conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0)
        FROM qarzlar
        WHERE user_id = $1 AND NOT yopildi
    """, uid) or 0)

    # Ombor qiymati — qoldiq × olish_narxi
    ombor_qiymat = D(await conn.fetchval("""
        SELECT COALESCE(SUM(qoldiq * COALESCE(olish_narxi, 0)), 0)
        FROM tovarlar
        WHERE user_id = $1 AND qoldiq > 0
    """, uid) or 0)

    jami_aktiv = kassa_naqd + kassa_karta + debitorlar + ombor_qiymat

    # PASSIVLAR — yetkazib beruvchilarga qarz (hozircha alohida jadval yo'q)
    kreditorlar = Decimal("0")

    # KAPITAL (jami daromad - jami tannarx - jami xarajat)
    jami_daromad = D(await conn.fetchval(
        "SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar WHERE user_id=$1", uid) or 0)
    jami_tannarx = D(await conn.fetchval("""
        SELECT COALESCE(SUM(olish_narxi * miqdor), 0)
        FROM chiqimlar WHERE user_id = $1
    """, uid) or 0)
    jami_xarajat = D(await conn.fetchval(
        "SELECT COALESCE(SUM(summa), 0) FROM xarajatlar "
        "WHERE admin_uid = $1 AND NOT bekor_qilingan", uid) or 0)

    taqsimlanmagan_foyda = jami_daromad - jami_tannarx - jami_xarajat

    return {
        "sana": date.today().isoformat(),
        "aktivlar": {
            "kassa_naqd":   str(kassa_naqd),
            "kassa_karta":  str(kassa_karta),
            "debitorlar":   str(debitorlar),
            "ombor_qiymat": str(ombor_qiymat),
            "jami":         str(jami_aktiv),
        },
        "passivlar": {
            "kreditorlar": str(kreditorlar),
            "jami":        str(kreditorlar),
        },
        "kapital": {
            "taqsimlanmagan_foyda": str(taqsimlanmagan_foyda),
            "jami":                 str(taqsimlanmagan_foyda),
        },
        "balans_tekshiruv": {
            "aktiv":          str(jami_aktiv),
            "passiv_kapital": str(kreditorlar + taqsimlanmagan_foyda),
            "muvozanat":      abs(jami_aktiv - kreditorlar - taqsimlanmagan_foyda) < Decimal("1"),
        },
    }


async def pul_oqimi(conn, uid: int, sana_dan: str | None = None,
                     sana_gacha: str | None = None) -> dict:
    """Pul oqimi hisoboti (Cash Flow Statement)."""
    if not sana_dan:
        bugun = date.today()
        sana_dan = bugun.replace(day=1).isoformat()
        sana_gacha = bugun.isoformat()

    # KIRIMLAR — sotuvdan (tolangan qismi)
    sotuv_kirim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0) FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    # Qarz to'lovlari — davr ichida yopilgan yoki tolangan o'sgan qarzlar.
    # qarzlar.tolangan ustuni bor, lekin qachon to'langani alohida log yo'q.
    # Yopildi=TRUE va yangilangan sanasi bo'yicha oldik.
    qarz_kirim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0) FROM qarzlar
        WHERE user_id = $1 AND yopildi
          AND (yangilangan AT TIME ZONE 'Asia/Tashkent')::date
              BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    jami_kirim = sotuv_kirim + qarz_kirim

    # CHIQIMLAR — tovar xaridi (kirimlar jadvalidan)
    xarid_chiqim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0) FROM kirimlar
        WHERE user_id = $1
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    # Xarajatlar
    xarajat_chiqim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
        WHERE admin_uid = $1 AND NOT bekor_qilingan
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    jami_chiqim = xarid_chiqim + xarajat_chiqim
    sof_oqim    = jami_kirim - jami_chiqim

    return {
        "davr": {"dan": sana_dan, "gacha": sana_gacha},
        "kirim": {
            "sotuvdan":     str(sotuv_kirim),
            "qarz_yigildi": str(qarz_kirim),
            "jami":         str(jami_kirim),
        },
        "chiqim": {
            "tovar_xaridi": str(xarid_chiqim),
            "xarajatlar":   str(xarajat_chiqim),
            "jami":         str(jami_chiqim),
        },
        "sof_pul_oqimi": {
            "summa": str(sof_oqim),
            "holat": "ijobiy" if sof_oqim > 0 else "salbiy" if sof_oqim < 0 else "nol",
        },
    }


async def biznes_koeffitsientlar(conn, uid: int, kunlar: int = 30) -> dict:
    """Asosiy biznes koeffitsientlari — KPI dashboard uchun."""
    pl = await foyda_zarar(conn, uid)

    sof_sotuv  = D(pl["daromad"]["sof_sotuv"])
    tannarx    = D(pl["tannarx"]["jami"])
    sotuv_soni = int(pl["daromad"]["sotuv_soni"] or 0)

    ombor = D(await conn.fetchval("""
        SELECT COALESCE(SUM(qoldiq * COALESCE(olish_narxi, 0)), 0)
        FROM tovarlar WHERE user_id = $1
    """, uid) or 0)

    debitorlar = D(await conn.fetchval("""
        SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
        WHERE user_id = $1 AND NOT yopildi
    """, uid) or 0)

    klient_soni = await conn.fetchval("""
        SELECT COUNT(DISTINCT klient_id) FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND sana >= NOW() - make_interval(days => $2)
          AND klient_id IS NOT NULL
    """, uid, kunlar) or 0

    # Inventory Turnover = COGS / Ombor qiymati
    inv_turnover = (tannarx / ombor) if ombor > 0 else Decimal("0")
    # Days Sales Outstanding
    dso = (debitorlar / sof_sotuv * Decimal(str(kunlar))) if sof_sotuv > 0 else Decimal("0")
    # Average Order Value
    aov = (sof_sotuv / Decimal(str(max(sotuv_soni, 1))))

    return {
        "gross_margin":           str(D(pl["yalpi_foyda"]["margin_foiz"])),
        "net_margin":             str(D(pl["sof_foyda"]["margin_foiz"])),
        "inventory_turnover":     str(D(inv_turnover)),
        "days_sales_outstanding": str(D(dso)),
        "average_order_value":    str(D(aov)),
        "sotuv_soni_kunlik":      round(sotuv_soni / max(kunlar, 1), 1),
        "klient_soni":            int(klient_soni),
        "ombor_qiymati":          str(ombor),
    }
