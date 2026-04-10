"""
SAVDOAI v25.4.0 — AKSIYA API ROUTES
"""
from __future__ import annotations
import os, sys, logging
from decimal import Decimal
from typing import Optional, List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.aksiya import (
    aksiyalar_hisoblash, aksiya_yaratish, aksiyalar_royxati,
    aksiya_holati, AKSIYA_TURLARI, AKSIYA_MIGRATION_SQL,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/aksiya", tags=["aksiya"])


class AksiyaCreate(BaseModel):
    nomi: str
    turi: str  # foiz_chegirma, summa_chegirma, tovar_hadya, bonus_ball, narx_tushirish, min_summa
    faol: bool = True
    boshlanish_sanasi: Optional[str] = None
    tugash_sanasi: Optional[str] = None
    min_summa: float = 0
    min_miqdor: int = 0
    max_qollash_soni: int = 0
    chegirma_foiz: float = 0
    chegirma_summa: float = 0
    maxsus_narx: float = 0
    bonus_ball_koeffitsient: float = 0
    hadya_shart_miqdor: int = 0
    hadya_bepul_miqdor: int = 0
    barcha_tovarlar: bool = True
    barcha_klientlar: bool = True
    prioritet: int = 0
    tovar_idlar: List[int] = []
    klient_idlar: List[int] = []


class AksiyaHisoblash(BaseModel):
    klient_id: int
    tovarlar: List[dict]  # [{tovar_id, miqdor, narx, summa, kategoriya}]
    jami_summa: float


@router.get("/turlar")
async def aksiya_turlari():
    """Aksiya turlari ro'yxati."""
    return AKSIYA_TURLARI


@router.get("")
async def royxat(faqat_faol: bool = False, uid: int = Depends(get_uid)):
    """Aksiyalar ro'yxati."""
    async with get_conn(uid) as conn:
        return await aksiyalar_royxati(conn, uid, faqat_faol)


@router.post("")
async def yaratish(body: AksiyaCreate, uid: int = Depends(get_uid)):
    """Yangi aksiya yaratish."""
    if body.turi not in AKSIYA_TURLARI:
        raise HTTPException(400, f"Noto'g'ri aksiya turi. Mumkin: {list(AKSIYA_TURLARI.keys())}")
    async with get_conn(uid) as conn:
        data = body.dict()
        if data.get("boshlanish_sanasi"):
            data["boshlanish_sanasi"] = date.fromisoformat(data["boshlanish_sanasi"])
        if data.get("tugash_sanasi"):
            data["tugash_sanasi"] = date.fromisoformat(data["tugash_sanasi"])
        aksiya_id = await aksiya_yaratish(conn, uid, data)
        return {"id": aksiya_id, "muvaffaqiyat": True}


@router.put("/{aksiya_id}/holat")
async def holat_ozgartirish(aksiya_id: int, faol: bool = True, uid: int = Depends(get_uid)):
    """Aksiyani yoqish/o'chirish."""
    async with get_conn(uid) as conn:
        return await aksiya_holati(conn, uid, aksiya_id, faol)


@router.post("/hisoblash")
async def hisoblash(body: AksiyaHisoblash, uid: int = Depends(get_uid)):
    """Buyurtma uchun aksiyalarni hisoblash — SD Agent calculateDiscount analogi."""
    async with get_conn(uid) as conn:
        return await aksiyalar_hisoblash(
            conn, uid, body.klient_id,
            body.tovarlar, Decimal(str(body.jami_summa))
        )


@router.post("/migrate")
async def migrate(uid: int = Depends(get_uid)):
    """Aksiya jadvallarini yaratish."""
    async with get_conn(uid) as conn:
        await conn.execute(AKSIYA_MIGRATION_SQL)
        return {"muvaffaqiyat": True}
