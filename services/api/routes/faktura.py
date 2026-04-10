"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — FAKTURA (HISOB-FAKTURA) ROUTELARI               ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Faktura"])


class FakturaYaratSorov(BaseModel):
    klient_ismi: str = Field(..., min_length=1, max_length=200)
    tovarlar: list = Field(default_factory=list)
    jami_summa: float = Field(0, ge=0)
    bank_rekvizit: Optional[dict] = None
    izoh: Optional[str] = None


@router.get("/fakturalar")
async def fakturalar_list(
    limit: int = 20, offset: int = 0,
    holat: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    """Hisob-fakturalar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if holat:
            rows = await c.fetch("""
                SELECT id, raqam, klient_ismi, jami_summa, holat, yaratilgan
                FROM fakturalar WHERE user_id=$3 AND holat=$4
                ORDER BY yaratilgan DESC LIMIT $1 OFFSET $2
            """, limit, offset, uid, holat)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM fakturalar WHERE user_id=$1 AND holat=$2",
                uid, holat
            )
        else:
            rows = await c.fetch("""
                SELECT id, raqam, klient_ismi, jami_summa, holat, yaratilgan
                FROM fakturalar WHERE user_id=$3
                ORDER BY yaratilgan DESC LIMIT $1 OFFSET $2
            """, limit, offset, uid)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM fakturalar WHERE user_id=$1", uid
            )
    return {"total": total, "items": [dict(r) for r in rows]}


@router.get("/faktura/{faktura_id}")
async def faktura_detail(faktura_id: int, uid: int = Depends(get_uid)):
    """Faktura batafsil"""
    async with rls_conn(uid) as c:
        f = await c.fetchrow("""
            SELECT id, raqam, klient_ismi, jami_summa, tovarlar,
                   bank_rekvizit, holat, yaratilgan
            FROM fakturalar WHERE id=$1 AND user_id=$2
        """, faktura_id, uid)
        if not f:
            raise HTTPException(404, "Faktura topilmadi")
    return dict(f)


@router.post("/faktura")
async def faktura_yarat(data: FakturaYaratSorov, uid: int = Depends(get_uid)):
    """Yangi hisob-faktura yaratish"""
    import datetime as _dt
    async with rls_conn(uid) as c:
        bugun = _dt.date.today().strftime("%Y%m%d")

        # Race-condition safe: avval INSERT, keyin id asosida raqam yangilash
        row = await c.fetchrow("""
            INSERT INTO fakturalar (user_id, raqam, klient_ismi, jami_summa, tovarlar, bank_rekvizit)
            VALUES ($1, 'TEMP', $2, $3, $4::jsonb, $5::jsonb)
            RETURNING id, klient_ismi, jami_summa, holat, yaratilgan
        """, uid, data.klient_ismi.strip(),
            data.jami_summa, json.dumps(data.tovarlar),
            json.dumps(data.bank_rekvizit))

        raqam = f"F-{bugun}-{row['id']:04d}"
        await c.execute(
            "UPDATE fakturalar SET raqam=$2 WHERE id=$1", row["id"], raqam
        )
    log.info("📄 Faktura yaratildi: %s uid=%d", raqam, uid)
    result = dict(row)
    result["raqam"] = raqam
    return result


@router.put("/faktura/{faktura_id}/holat")
async def faktura_holat(faktura_id: int, data: dict, uid: int = Depends(get_uid)):
    """Faktura holatini yangilash"""
    yangi_holat = data.get("holat", "")
    HOLATLAR = {"yaratilgan", "yuborilgan", "tolangan", "bekor"}
    if yangi_holat not in HOLATLAR:
        raise HTTPException(400, f"Noto'g'ri holat. Mumkin: {', '.join(sorted(HOLATLAR))}")

    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT id, holat FROM fakturalar WHERE id=$1 AND user_id=$2",
            faktura_id, uid
        )
        if not old:
            raise HTTPException(404, "Faktura topilmadi")
        await c.execute(
            "UPDATE fakturalar SET holat=$2 WHERE id=$1 AND user_id=$3",
            faktura_id, yangi_holat, uid
        )
    return {"id": faktura_id, "holat": yangi_holat}


@router.delete("/faktura/{faktura_id}")
async def faktura_ochir(faktura_id: int, uid: int = Depends(get_uid)):
    """Faktura o'chirish (faqat 'yaratilgan' holatdagi)"""
    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT id, holat FROM fakturalar WHERE id=$1 AND user_id=$2",
            faktura_id, uid
        )
        if not old:
            raise HTTPException(404, "Faktura topilmadi")
        if old["holat"] != "yaratilgan":
            raise HTTPException(400, "Faqat 'yaratilgan' holatdagi fakturani o'chirish mumkin")
        await c.execute(
            "DELETE FROM fakturalar WHERE id=$1 AND user_id=$2", faktura_id, uid
        )
    return {"id": faktura_id, "status": "deleted"}
