"""
SAVDOAI v25.4.0 — VAN SELLING + AKT SVERKI API
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.van_selling import (
    marshrut_yaratish, yetkazish_tasdiqlash, marshrut_yakunlash,
    marshrut_holati, VAN_SELLING_MIGRATION,
)

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  VAN SELLING ROUTES
# ═══════════════════════════════════════════════════════
van_router = APIRouter(prefix="/van", tags=["van-selling"])


class TovarItem(BaseModel):
    tovar_id: int
    tovar_nomi: str = ""
    miqdor: float
    narx: float

class KlientItem(BaseModel):
    klient_id: int
    klient_nomi: str = ""

class MarshrutCreate(BaseModel):
    sana: Optional[str] = None
    mashina_raqami: str = ""
    haydovchi: str = ""
    izoh: str = ""
    tovarlar: List[TovarItem]
    klientlar: List[KlientItem]

class YetkazishConfirm(BaseModel):
    tovarlar: List[TovarItem]
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    foto_url: Optional[str] = None


@van_router.post("/marshrut")
async def marshrut_ep(body: MarshrutCreate, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        mid = await marshrut_yaratish(conn, uid, body.dict())
        return {"id": mid, "muvaffaqiyat": True}


@van_router.get("/marshrut/{mid}")
async def marshrut_olish(mid: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await marshrut_holati(conn, uid, mid)


@van_router.get("/marshrutlar")
async def marshrutlar_royxati(limit: int = 20, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        rows = await conn.fetch(
            "SELECT * FROM van_marshrut WHERE user_id=$1 ORDER BY sana DESC LIMIT $2",
            uid, limit)
        return [dict(r) for r in rows]


@van_router.post("/yetkazish/{yid}/tasdiqlash")
async def yetkazish_ep(yid: int, body: YetkazishConfirm, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await yetkazish_tasdiqlash(
            conn, uid, yid, [t.dict() for t in body.tovarlar],
            body.latitude, body.longitude, body.foto_url)


@van_router.post("/marshrut/{mid}/yakunlash")
async def yakunlash_ep(mid: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await marshrut_yakunlash(conn, uid, mid)


@van_router.post("/migrate")
async def van_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(VAN_SELLING_MIGRATION)
        return {"muvaffaqiyat": True}


# ═══════════════════════════════════════════════════════
#  AKT SVERKI (SOLISHTIRISH/RECONCILIATION)
# ═══════════════════════════════════════════════════════
sverka_router = APIRouter(prefix="/sverka", tags=["sverka"])

AKT_SVERKI_MIGRATION = """
CREATE TABLE IF NOT EXISTS akt_sverki (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    sana_dan DATE NOT NULL,
    sana_gacha DATE NOT NULL,
    boshlangich_qoldiq NUMERIC(18,2) DEFAULT 0,
    jami_sotuv NUMERIC(18,2) DEFAULT 0,
    jami_tolov NUMERIC(18,2) DEFAULT 0,
    jami_qaytarish NUMERIC(18,2) DEFAULT 0,
    yakuniy_qoldiq NUMERIC(18,2) DEFAULT 0,
    holat VARCHAR(20) DEFAULT 'tayyorlangan',
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
"""


@sverka_router.post("/{klient_id}")
async def akt_yaratish(klient_id: int, sana_dan: str, sana_gacha: str,
                        uid: int = Depends(get_uid)):
    """SD Agent client/revise analogi — klient bilan akt sverki."""
    async with get_conn(uid) as conn:
        # Boshlang'ich qoldiq (sana_dan dan oldingi qarz)
        bosh_qoldiq = await conn.fetchval("""
            SELECT COALESCE(SUM(jami) - SUM(tolangan), 0)
            FROM sotuv_sessiyalar
            WHERE user_id = $1 AND klient_id = $2
              AND (sana AT TIME ZONE 'Asia/Tashkent')::date < $3::date
        """, uid, klient_id, sana_dan) or Decimal("0")

        # Davr ichidagi sotuvlar
        jami_sotuv = await conn.fetchval("""
            SELECT COALESCE(SUM(jami), 0) FROM sotuv_sessiyalar
            WHERE user_id = $1 AND klient_id = $2
              AND (sana AT TIME ZONE 'Asia/Tashkent')::date
                  BETWEEN $3::date AND $4::date
        """, uid, klient_id, sana_dan, sana_gacha) or Decimal("0")

        # Davr ichidagi to'lovlar
        jami_tolov = await conn.fetchval("""
            SELECT COALESCE(SUM(tolangan), 0) FROM sotuv_sessiyalar
            WHERE user_id = $1 AND klient_id = $2
              AND (sana AT TIME ZONE 'Asia/Tashkent')::date
                  BETWEEN $3::date AND $4::date
        """, uid, klient_id, sana_dan, sana_gacha) or Decimal("0")

        # Qaytarishlar
        jami_qaytarish = await conn.fetchval("""
            SELECT COALESCE(SUM(jami), 0) FROM qaytarishlar
            WHERE user_id = $1
              AND (sana AT TIME ZONE 'Asia/Tashkent')::date
                  BETWEEN $2::date AND $3::date
              AND EXISTS (
                  SELECT 1 FROM chiqimlar ch
                  WHERE ch.id = qaytarishlar.chiqim_id AND ch.klient_id = $4
              )
        """, uid, sana_dan, sana_gacha, klient_id) or Decimal("0")

        yakuniy = bosh_qoldiq + jami_sotuv - jami_tolov - jami_qaytarish

        try:
            akt_id = await conn.fetchval("""
                INSERT INTO akt_sverki (user_id, klient_id, sana_dan, sana_gacha,
                    boshlangich_qoldiq, jami_sotuv, jami_tolov, jami_qaytarish, yakuniy_qoldiq)
                VALUES ($1,$2,$3::date,$4::date,$5,$6,$7,$8,$9) RETURNING id
            """, uid, klient_id, sana_dan, sana_gacha,
                bosh_qoldiq, jami_sotuv, jami_tolov, jami_qaytarish, yakuniy)
        except Exception as e:
            log.warning("akt_sverki insert failed: %s — jadval yaratilmaganmikin?", e)
            akt_id = None

        # Tafsilotlar
        sotuvlar = await conn.fetch("""
            SELECT id, sana, jami, tolangan, qarz
            FROM sotuv_sessiyalar
            WHERE user_id = $1 AND klient_id = $2
              AND (sana AT TIME ZONE 'Asia/Tashkent')::date
                  BETWEEN $3::date AND $4::date
            ORDER BY sana
        """, uid, klient_id, sana_dan, sana_gacha)

        return {
            "akt_id": akt_id,
            "boshlangich_qoldiq": str(bosh_qoldiq),
            "jami_sotuv": str(jami_sotuv),
            "jami_tolov": str(jami_tolov),
            "jami_qaytarish": str(jami_qaytarish),
            "yakuniy_qoldiq": str(yakuniy),
            "sotuvlar_soni": len(sotuvlar),
            "tafsilotlar": [dict(r) for r in sotuvlar],
        }


@sverka_router.post("/migrate")
async def sverka_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(AKT_SVERKI_MIGRATION)
        return {"muvaffaqiyat": True}

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(van_router)
router.include_router(sverka_router)
