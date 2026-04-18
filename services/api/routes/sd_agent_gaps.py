"""
SAVDOAI v25.4.0 — SD AGENT GAPS API
Tara, Oddment, Replacement, QR, Knowledge Base, CheckDiscount
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.sd_agent_gaps import (
    dona_blok_hisoblash, tara_harakat, klient_tara_qoldiq,
    oddment_yaratish, almashtirish_yaratish,
    klient_uchun_tovarlar, bugungi_klientlar_juft_toq,
    klient_qr_yaratish, klient_qr_topish,
    bilimlar_royxati, bilim_yaratish,
    chegirma_tekshir, TASHRIF_TURLARI,
    SD_AGENT_GAPS_MIGRATION,
)

log = logging.getLogger(__name__)
router = APIRouter(tags=["sd-agent-features"])

# ═══ Dona + Blok ═══
@router.post("/dona-blok")
async def dona_blok(tovar_id: int, dona: float = 0, blok: float = 0, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await dona_blok_hisoblash(conn, tovar_id, dona, blok)

# ═══ Tara ═══
class TaraReq(BaseModel):
    klient_id: int; tara_turi_id: int; turi: str; miqdor: int; izoh: str = ""

@router.post("/tara")
async def tara_post(body: TaraReq, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        tid = await tara_harakat(conn, uid, body.klient_id, body.tara_turi_id, body.turi, body.miqdor, body.izoh)
        return {"id": tid}

@router.get("/tara/{klient_id}")
async def tara_qoldiq(klient_id: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await klient_tara_qoldiq(conn, uid, klient_id)

# ═══ Oddment ═══
class OddmentReq(BaseModel):
    klient_id: int; tovarlar: list[dict]

@router.post("/oddment")
async def oddment_post(body: OddmentReq, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await oddment_yaratish(conn, uid, body.klient_id, body.tovarlar)

# ═══ Almashtirish ═══
class ReplacementReq(BaseModel):
    klient_id: int; sababi: str = ""; eski_tovar_id: int = 0; eski_tovar_nomi: str = ""
    eski_miqdor: float = 0; yangi_tovar_id: int = 0; yangi_tovar_nomi: str = ""
    yangi_miqdor: float = 0; foto_url: str = ""

@router.post("/almashtirish")
async def almashtirish(body: ReplacementReq, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        aid = await almashtirish_yaratish(conn, uid, body.dict())
        return {"id": aid}

# ═══ Klient tovarlar (kategoriya filtr) ═══
@router.get("/klient/{klient_id}/tovarlar")
async def klient_tovarlar(klient_id: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await klient_uchun_tovarlar(conn, uid, klient_id)

# ═══ Juft/Toq hafta ═══
@router.get("/bugungi-klientlar")
async def bugungi(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await bugungi_klientlar_juft_toq(conn, uid)

# ═══ QR Kod ═══
@router.post("/klient/{klient_id}/qr")
async def qr_yarat(klient_id: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        qr = await klient_qr_yaratish(conn, uid, klient_id)
        return {"qr_kod": qr}

@router.get("/qr/{qr_kod}")
async def qr_scan(qr_kod: str, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        klient = await klient_qr_topish(conn, uid, qr_kod)
        if not klient: return {"xato": "Klient topilmadi"}
        return klient

# ═══ Bilimlar bazasi ═══
class BilimReq(BaseModel):
    sarlavha: str; matn: str = ""; kategoriya: str = ""; turi: str = "maqola"
    fayl_url: str = ""; video_url: str = ""

@router.get("/bilimlar")
async def bilimlar_list(kategoriya: str | None = None, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await bilimlar_royxati(conn, uid, kategoriya)

@router.post("/bilimlar")
async def bilim_add(body: BilimReq, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        bid = await bilim_yaratish(conn, uid, body.dict())
        return {"id": bid}

# ═══ Chegirma tekshirish ═══
@router.post("/chegirma-tekshir")
async def chegirma(klient_id: int, foiz: float, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await chegirma_tekshir(conn, uid, klient_id, foiz)

# ═══ Tashrif turlari ═══
@router.get("/tashrif-turlari")
async def turlari():
    return TASHRIF_TURLARI

# ═══ Migration ═══
@router.post("/sd-agent-gaps/migrate")
async def gaps_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(SD_AGENT_GAPS_MIGRATION)
        return {"muvaffaqiyat": True, "xabar": "SD Agent gaps jadvallari yaratildi"}
