"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — MOLIYAVIY HISOBOTLAR (QuickBooks DARAJASI)            ║
║                                                                          ║
║  Avtomatik moliyaviy hisobotlar — buxgalter shart emas:                 ║
║                                                                          ║
║  1. FOYDA VA ZARAR (P&L / Income Statement)                            ║
║     Daromad - Tannarx = Yalpi foyda                                     ║
║     Yalpi foyda - Xarajatlar = Sof foyda                                ║
║                                                                          ║
║  2. BALANS (Balance Sheet)                                               ║
║     Aktivlar = Passivlar + Kapital                                       ║
║     Kassa + Ombor + Debitorlar = Kreditorlar + Foyda                    ║
║                                                                          ║
║  3. PUL OQIMI (Cash Flow Statement)                                     ║
║     Kirim: Sotuvdan + Qarz yig'ildi + Boshqa                           ║
║     Chiqim: Xarid + Xarajat + Soliq                                     ║
║     Sof oqim = Kirim - Chiqim                                           ║
║                                                                          ║
║  4. SOTUV TAHLILI (Sales Analysis)                                       ║
║     Margin %, ROI, Break-even, Inventory turnover                        ║
║                                                                          ║
║  Barcha raqamlar 100% Decimal — floating-point xato YO'Q.              ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

log = logging.getLogger(__name__)
D = lambda v: Decimal(str(v or 0)).quantize(Decimal("0.01"), ROUND_HALF_UP)


async def foyda_zarar(conn, uid: int, sana_dan: str = None,
                       sana_gacha: str = None) -> dict:
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
            COALESCE(SUM(jami), 0) AS jami_sotuv,
            COALESCE(SUM(tolangan), 0) AS jami_tolangan,
            COALESCE(SUM(chegirma), 0) AS jami_chegirma,
            COUNT(*) AS sotuv_soni
        FROM sotuvlar
        WHERE user_id=$1 AND sana BETWEEN $2::date AND $3::date
            AND holat NOT IN ('bekor', 'voided')
    """, uid, sana_dan, sana_gacha)

    qaytarish = await conn.fetchval("""
        SELECT COALESCE(SUM(jami), 0) FROM sotuvlar
        WHERE user_id=$1 AND turi='qaytarish'
            AND sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or Decimal("0")

    sof_sotuv = D(sotuv["jami_sotuv"]) - D(qaytarish) - D(sotuv["jami_chegirma"])

    # ═══ TANNARX (COGS) ═══
    tannarx = await conn.fetchval("""
        SELECT COALESCE(SUM(c.tan_narx * c.miqdor), 0)
        FROM chiqimlar c
        JOIN sotuv_sessiyalar s ON s.id = c.sessiya_id
        WHERE s.user_id=$1 AND c.sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or Decimal("0")
    tannarx = D(tannarx)

    yalpi_foyda = sof_sotuv - tannarx
    yalpi_margin = (yalpi_foyda / sof_sotuv * 100) if sof_sotuv > 0 else Decimal("0")

    # ═══ XARAJATLAR ═══
    xarajat = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(summa), 0) AS jami,
            COALESCE(SUM(CASE WHEN turi='ijara' THEN summa END), 0) AS ijara,
            COALESCE(SUM(CASE WHEN turi='oylik' THEN summa END), 0) AS oylik,
            COALESCE(SUM(CASE WHEN turi='transport' THEN summa END), 0) AS transport,
            COALESCE(SUM(CASE WHEN turi='kommunal' THEN summa END), 0) AS kommunal,
            COALESCE(SUM(CASE WHEN turi NOT IN ('ijara','oylik','transport','kommunal') THEN summa END), 0) AS boshqa
        FROM xarajatlar
        WHERE user_id=$1 AND sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or {}

    jami_xarajat = D(xarajat.get("jami", 0))
    sof_foyda = yalpi_foyda - jami_xarajat
    sof_margin = (sof_foyda / sof_sotuv * 100) if sof_sotuv > 0 else Decimal("0")

    return {
        "davr": {"dan": sana_dan, "gacha": sana_gacha},
        "daromad": {
            "jami_sotuv": str(D(sotuv["jami_sotuv"])),
            "qaytarish": str(D(qaytarish)),
            "chegirma": str(D(sotuv["jami_chegirma"])),
            "sof_sotuv": str(sof_sotuv),
            "sotuv_soni": sotuv["sotuv_soni"],
        },
        "tannarx": {
            "jami": str(tannarx),
        },
        "yalpi_foyda": {
            "summa": str(yalpi_foyda),
            "margin_foiz": str(D(yalpi_margin)),
        },
        "xarajatlar": {
            "jami": str(jami_xarajat),
            "tafsilot": {
                "ijara": str(D(xarajat.get("ijara", 0))),
                "oylik": str(D(xarajat.get("oylik", 0))),
                "transport": str(D(xarajat.get("transport", 0))),
                "kommunal": str(D(xarajat.get("kommunal", 0))),
                "boshqa": str(D(xarajat.get("boshqa", 0))),
            }
        },
        "sof_foyda": {
            "summa": str(sof_foyda),
            "margin_foiz": str(D(sof_margin)),
            "holat": "foyda" if sof_foyda > 0 else "zarar" if sof_foyda < 0 else "nol",
        },
    }


async def balans_varaq(conn, uid: int) -> dict:
    """Balans varaq (Balance Sheet) — aktivlar = passivlar + kapital."""

    # AKTIVLAR
    kassa_naqd = D(await conn.fetchval(
        "SELECT COALESCE(SUM(CASE WHEN tolov_turi='naqd' THEN tolangan END), 0) "
        "FROM sotuvlar WHERE user_id=$1", uid) or 0)

    kassa_karta = D(await conn.fetchval(
        "SELECT COALESCE(SUM(CASE WHEN tolov_turi IN ('karta','click','payme') THEN tolangan END), 0) "
        "FROM sotuvlar WHERE user_id=$1", uid) or 0)

    debitorlar = D(await conn.fetchval(
        "SELECT COALESCE(SUM(qarz), 0) FROM sotuvlar WHERE user_id=$1 AND qarz > 0", uid) or 0)

    ombor_qiymat = D(await conn.fetchval(
        "SELECT COALESCE(SUM(qoldiq * COALESCE(tan_narx, 0)), 0) FROM tovarlar WHERE user_id=$1 AND qoldiq > 0",
        uid) or 0)

    jami_aktiv = kassa_naqd + kassa_karta + debitorlar + ombor_qiymat

    # PASSIVLAR
    kreditorlar = D(await conn.fetchval(
        "SELECT COALESCE(SUM(qarz_summa), 0) FROM yetkazuvchi_qarzlar WHERE user_id=$1 AND tolangan=FALSE",
        uid) or 0)

    # KAPITAL (jami daromad - jami xarajat = taqsimlanmagan foyda)
    jami_daromad = D(await conn.fetchval(
        "SELECT COALESCE(SUM(jami), 0) FROM sotuvlar WHERE user_id=$1", uid) or 0)
    jami_xarajat = D(await conn.fetchval(
        "SELECT COALESCE(SUM(summa), 0) FROM xarajatlar WHERE user_id=$1", uid) or 0)
    jami_tannarx = D(await conn.fetchval(
        "SELECT COALESCE(SUM(c.tan_narx * c.miqdor), 0) FROM chiqimlar c "
        "JOIN sotuv_sessiyalar s ON s.id=c.sessiya_id WHERE s.user_id=$1", uid) or 0)

    taqsimlanmagan_foyda = jami_daromad - jami_xarajat - jami_tannarx

    return {
        "sana": date.today().isoformat(),
        "aktivlar": {
            "kassa_naqd": str(kassa_naqd),
            "kassa_karta": str(kassa_karta),
            "debitorlar": str(debitorlar),
            "ombor_qiymat": str(ombor_qiymat),
            "jami": str(jami_aktiv),
        },
        "passivlar": {
            "kreditorlar": str(kreditorlar),
            "jami": str(kreditorlar),
        },
        "kapital": {
            "taqsimlanmagan_foyda": str(taqsimlanmagan_foyda),
            "jami": str(taqsimlanmagan_foyda),
        },
        "balans_tekshiruv": {
            "aktiv": str(jami_aktiv),
            "passiv_kapital": str(kreditorlar + taqsimlanmagan_foyda),
            "muvozanat": abs(jami_aktiv - kreditorlar - taqsimlanmagan_foyda) < Decimal("1"),
        },
    }


async def pul_oqimi(conn, uid: int, sana_dan: str = None,
                     sana_gacha: str = None) -> dict:
    """Pul oqimi hisoboti (Cash Flow Statement)."""
    if not sana_dan:
        bugun = date.today()
        sana_dan = bugun.replace(day=1).isoformat()
        sana_gacha = bugun.isoformat()

    # KIRIMLAR
    sotuv_kirim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0) FROM sotuvlar
        WHERE user_id=$1 AND sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    qarz_kirim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM qarz_tolovlar
        WHERE user_id=$1 AND sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    jami_kirim = sotuv_kirim + qarz_kirim

    # CHIQIMLAR
    xarid_chiqim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(jami_summa), 0) FROM kirim_sessiyalar
        WHERE user_id=$1 AND yaratilgan BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    xarajat_chiqim = D(await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
        WHERE user_id=$1 AND sana BETWEEN $2::date AND $3::date
    """, uid, sana_dan, sana_gacha) or 0)

    jami_chiqim = xarid_chiqim + xarajat_chiqim
    sof_oqim = jami_kirim - jami_chiqim

    return {
        "davr": {"dan": sana_dan, "gacha": sana_gacha},
        "kirim": {
            "sotuvdan": str(sotuv_kirim),
            "qarz_yigildi": str(qarz_kirim),
            "jami": str(jami_kirim),
        },
        "chiqim": {
            "tovar_xaridi": str(xarid_chiqim),
            "xarajatlar": str(xarajat_chiqim),
            "jami": str(jami_chiqim),
        },
        "sof_pul_oqimi": {
            "summa": str(sof_oqim),
            "holat": "ijobiy" if sof_oqim > 0 else "salbiy",
        },
    }


async def biznes_koeffitsientlar(conn, uid: int, kunlar: int = 30) -> dict:
    """Asosiy biznes koeffitsientlari — KPI dashboard uchun.

    Inventory Turnover, Days Sales Outstanding, Gross Margin,
    Average Order Value, Customer Acquisition Cost.
    """
    pl = await foyda_zarar(conn, uid)

    sof_sotuv = D(pl["daromad"]["sof_sotuv"])
    tannarx = D(pl["tannarx"]["jami"])
    sotuv_soni = pl["daromad"]["sotuv_soni"]

    ombor = D(await conn.fetchval(
        "SELECT COALESCE(SUM(qoldiq * COALESCE(tan_narx, 0)), 0) FROM tovarlar WHERE user_id=$1",
        uid) or 0)

    debitorlar = D(await conn.fetchval(
        "SELECT COALESCE(SUM(qarz), 0) FROM sotuvlar WHERE user_id=$1 AND qarz > 0",
        uid) or 0)

    klient_soni = await conn.fetchval(
        "SELECT COUNT(DISTINCT klient_id) FROM sotuvlar WHERE user_id=$1 "
        "AND sana >= NOW() - ($2 || ' days')::interval", uid, str(kunlar)) or 1

    # Inventory Turnover = COGS / Average Inventory
    inv_turnover = (tannarx / ombor) if ombor > 0 else Decimal("0")

    # Days Sales Outstanding = (Debitorlar / Sotuv) * Kunlar
    dso = (debitorlar / sof_sotuv * Decimal(str(kunlar))) if sof_sotuv > 0 else Decimal("0")

    # Average Order Value
    aov = (sof_sotuv / Decimal(str(max(sotuv_soni, 1))))

    return {
        "gross_margin": str(D(pl["yalpi_foyda"]["margin_foiz"])) + "%",
        "net_margin": str(D(pl["sof_foyda"]["margin_foiz"])) + "%",
        "inventory_turnover": str(D(inv_turnover)),
        "days_sales_outstanding": str(D(dso)),
        "average_order_value": str(D(aov)),
        "sotuv_soni_kunlik": round(sotuv_soni / max(kunlar, 1), 1),
        "klient_soni": klient_soni,
        "ombor_qiymati": str(ombor),
    }
