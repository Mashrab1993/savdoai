"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — AVTOMATIK CHEGIRMA TIZIMI                        ║
║  Ko'p sotib oluvchiga avtomatik chegirma berish              ║
║                                                              ║
║  Qoidalar:                                                   ║
║  • Foiz: jami xarid > X → Y% chegirma                      ║
║  • Summa: har X so'm xaridda → Y so'm chegirma             ║
║  • Kategoriya: VIP/Gold/Silver klientlarga                  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

log = logging.getLogger(__name__)


async def chegirma_hisoblash(conn, uid: int, klient_id: int,
                              jami_summa: Decimal) -> dict:
    """Klient uchun eng mos chegirmani hisoblash.

    Returns:
        {chegirma_foiz, chegirma_summa, qoida_nomi, asl_summa, yangi_summa}
    """
    result = {
        "chegirma_foiz": Decimal(0),
        "chegirma_summa": Decimal(0),
        "qoida_nomi": "",
        "asl_summa": jami_summa,
        "yangi_summa": jami_summa,
    }

    try:
        # Klient ma'lumotlari
        klient = await conn.fetchrow(
            "SELECT kategoriya, jami_xaridlar, xarid_soni "
            "FROM klientlar WHERE id=$1 AND user_id=$2",
            klient_id, uid,
        )
        if not klient:
            return result

        jami_xaridlar = Decimal(str(klient["jami_xaridlar"] or 0))
        xarid_soni = klient["xarid_soni"] or 0
        kategoriya = klient.get("kategoriya", "oddiy")

        # Faol qoidalarni olish (eng katta chegirma tanlash)
        qoidalar = await conn.fetch(
            "SELECT nomi, turi, qiymat, min_xarid, min_soni, kategoriya "
            "FROM chegirma_qoidalar "
            "WHERE user_id=$1 AND faol=TRUE "
            "ORDER BY qiymat DESC",
            uid,
        )

        eng_yaxshi = None
        eng_chegirma = Decimal(0)

        for q in qoidalar:
            # Kategoriya filtr
            q_kat = q.get("kategoriya", "")
            if q_kat and q_kat != kategoriya:
                continue

            # Minimum xarid summa
            min_xarid = Decimal(str(q["min_xarid"] or 0))
            if min_xarid > 0 and jami_xaridlar < min_xarid:
                continue

            # Minimum xarid soni
            min_soni = q["min_soni"] or 0
            if min_soni > 0 and xarid_soni < min_soni:
                continue

            # Chegirma hisoblash
            qiymat = Decimal(str(q["qiymat"] or 0))
            if q["turi"] == "foiz":
                chegirma = (jami_summa * qiymat / 100).quantize(Decimal("1"))
            else:  # summa
                chegirma = qiymat

            if chegirma > eng_chegirma:
                eng_chegirma = chegirma
                eng_yaxshi = q

        if eng_yaxshi and eng_chegirma > 0:
            result["chegirma_summa"] = eng_chegirma
            result["chegirma_foiz"] = (
                Decimal(str(eng_yaxshi["qiymat"]))
                if eng_yaxshi["turi"] == "foiz"
                else (eng_chegirma / jami_summa * 100).quantize(Decimal("0.1"))
            )
            result["qoida_nomi"] = eng_yaxshi["nomi"]
            result["yangi_summa"] = jami_summa - eng_chegirma

    except Exception as e:
        log.debug("chegirma: %s", e)

    return result


async def chegirma_qoidalar_olish(conn, uid: int) -> list[dict]:
    """Barcha chegirma qoidalar."""
    rows = await conn.fetch(
        "SELECT id, nomi, turi, qiymat, min_xarid, min_soni, kategoriya, faol "
        "FROM chegirma_qoidalar WHERE user_id=$1 ORDER BY qiymat DESC",
        uid,
    )
    return [dict(r) for r in rows]


async def chegirma_qoida_yaratish(conn, uid: int, nomi: str, turi: str,
                                    qiymat: float, min_xarid: float = 0,
                                    min_soni: int = 0, kategoriya: str = "") -> int:
    """Yangi chegirma qoidasi."""
    row = await conn.fetchrow("""
        INSERT INTO chegirma_qoidalar (user_id, nomi, turi, qiymat, min_xarid, min_soni, kategoriya)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    """, uid, nomi, turi, qiymat, min_xarid, min_soni, kategoriya)
    return row["id"]
