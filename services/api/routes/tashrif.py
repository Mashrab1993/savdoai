"""
SAVDOAI v25.4.0 — CHECK-IN/OUT VA BUYURTMA AMALLARI API
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.guards_v2 import (
    checkin, checkout, checkin_tarix, qoldiq_qaytarish,
    mavjud_amallar, CHECK_IN_OUT_MIGRATION,
)
from shared.services.server_config import config_yukla

log = logging.getLogger(__name__)
router = APIRouter(prefix="/tashrif", tags=["tashrif"])


class CheckinBody(BaseModel):
    klient_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    izoh: Optional[str] = None


@router.post("/checkin")
async def checkin_ep(body: CheckinBody, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await checkin(conn, uid, body.klient_id,
                              body.latitude, body.longitude, body.accuracy, body.izoh)


@router.post("/checkout")
async def checkout_ep(body: CheckinBody, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await checkout(conn, uid, body.klient_id,
                               body.latitude, body.longitude, body.accuracy, body.izoh)


@router.get("/tarix")
async def tarix(klient_id: Optional[int] = None, sana: Optional[str] = None,
                 limit: int = 50, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await checkin_tarix(conn, uid, klient_id, sana, limit)


@router.post("/migrate")
async def migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(CHECK_IN_OUT_MIGRATION)
        return {"muvaffaqiyat": True}


# ═══ BUYURTMA AMALLARI ═══
amallar_router = APIRouter(prefix="/buyurtma-amal", tags=["buyurtma-amal"])


@amallar_router.get("/{sotuv_id}/amallar")
async def amallar_olish(sotuv_id: int, uid: int = Depends(get_uid)):
    """Buyurtma uchun mumkin bo'lgan amallar ro'yxati — SD Agent 15-action analog."""
    async with get_conn(uid) as conn:
        # sotuv_sessiyalar da holat ustuni yo'q — standart 'yangi' holat olamiz
        sotuv = await conn.fetchrow(
            "SELECT id FROM sotuv_sessiyalar WHERE id=$1 AND user_id=$2",
            sotuv_id, uid)
        if not sotuv:
            raise HTTPException(404, "Sotuv topilmadi")
        config = await config_yukla(conn, uid)
        return mavjud_amallar("yangi", config)


@amallar_router.post("/{sotuv_id}/bekor")
async def bekor_qilish(sotuv_id: int, uid: int = Depends(get_uid)):
    """Buyurtmani bekor qilish va ombor qoldiqni qaytarish."""
    async with get_conn(uid) as conn:
        return await qoldiq_qaytarish(conn, uid, sotuv_id)


class IzohBody(BaseModel):
    izoh: str


@amallar_router.post("/{sotuv_id}/izoh")
async def izoh_qoshish(sotuv_id: int, body: IzohBody, uid: int = Depends(get_uid)):
    """Buyurtmaga izoh qo'shish."""
    async with get_conn(uid) as conn:
        await conn.execute(
            "UPDATE sotuv_sessiyalar SET izoh = COALESCE(izoh, '') || E'\\n' || $1 "
            "WHERE id = $2 AND user_id = $3",
            body.izoh, sotuv_id, uid)
        return {"muvaffaqiyat": True}


class TagBody(BaseModel):
    tag: str


@amallar_router.post("/{sotuv_id}/tag")
async def tag_qoyish(sotuv_id: int, body: TagBody, uid: int = Depends(get_uid)):
    """Buyurtmaga tag qo'yish."""
    async with get_conn(uid) as conn:
        await conn.execute("""
            INSERT INTO sotuv_taglar (sotuv_id, tag, user_id)
            VALUES ($1, $2, $3) ON CONFLICT (sotuv_id, tag) DO NOTHING
        """, sotuv_id, body.tag, uid)
        return {"muvaffaqiyat": True}


class NasiyaBody(BaseModel):
    nasiya_kun: int = 30


@amallar_router.post("/{sotuv_id}/nasiya")
async def nasiya_belgilash(sotuv_id: int, body: NasiyaBody, uid: int = Depends(get_uid)):
    """Buyurtmani nasiyaga o'tkazish."""
    async with get_conn(uid) as conn:
        config = await config_yukla(conn, uid)
        if not config.buyurtma.nasiyaga_ruxsat:
            raise HTTPException(403, "Nasiya ruxsat etilmagan")
        if body.nasiya_kun > config.buyurtma.nasiya_max_kun:
            raise HTTPException(400, f"Max nasiya muddat: {config.buyurtma.nasiya_max_kun} kun")

        # sotuv_sessiyalarda nasiya/nasiya_muddati ustunlari yo'q —
        # izoh ustuniga qayd qilamiz (soddalashtirilgan yechim).
        await conn.execute("""
            UPDATE sotuv_sessiyalar
            SET izoh = COALESCE(izoh, '') || ' [nasiya: ' || $1 || ' kun]'
            WHERE id = $2 AND user_id = $3
        """, str(body.nasiya_kun), sotuv_id, uid)
        return {"muvaffaqiyat": True, "nasiya_kun": body.nasiya_kun}


# Mount amallar_router into the main exported router
router.include_router(amallar_router)
