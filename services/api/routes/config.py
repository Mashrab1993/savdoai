"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KONFIGURATSIYA API                           ║
║                                                                  ║
║  Endpoints:                                                      ║
║  GET  /api/config           — to'liq configni olish              ║
║  GET  /api/config/{modul}   — bitta modulni olish                ║
║  PUT  /api/config/{modul}   — modulni yangilash                  ║
║  GET  /api/config/tarix     — o'zgarishlar tarixi                ║
║  GET  /api/config/modullar  — modullar ro'yxati                  ║
║  GET  /api/sync-log         — sync loglar                        ║
║  POST /api/sync-log         — yangi sync log yozish              ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import os
import sys
import json
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.server_config import (
    config_yukla, config_saqlash, config_modullari, config_tarix,
    sync_log_yoz, sync_loglar, klient_field_tekshir, buyurtma_tekshir,
    CONFIG_MIGRATION_SQL,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/config", tags=["config"])


# ════════════════════════════════════════════════════════════
#  Pydantic models
# ════════════════════════════════════════════════════════════

class ConfigUpdate(BaseModel):
    sozlamalar: dict


class SyncLogCreate(BaseModel):
    sync_turi: str = "manual"
    entity_soni: int = 0
    yuborilgan_bayt: int = 0
    qabul_qilingan_bayt: int = 0
    status_kod: int = 200
    tarmoq_turi: Optional[str] = None
    batareya_foiz: Optional[int] = None
    xato_xabar: Optional[str] = None
    muvaffaqiyatli: bool = True
    qurilma_info: Optional[str] = None


class KlientValidate(BaseModel):
    nom: str = ""
    firma_nomi: str = ""
    telefon: str = ""
    manzil: str = ""
    orientir: str = ""
    kontakt_shaxs: str = ""
    inn: str = ""
    bank: str = ""
    mfo: str = ""
    hisob_raqam: str = ""
    shartnoma: str = ""
    kategoriya: str = ""


class BuyurtmaValidate(BaseModel):
    jami_summa: float = 0
    foto_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    checkin_vaqti: Optional[str] = None
    klient_qarz: float = 0
    zarar_bor: bool = False
    nasiya: bool = False
    nasiya_summa: float = 0
    chegirma_foiz: float = 0


# ════════════════════════════════════════════════════════════
#  ENDPOINTS
# ════════════════════════════════════════════════════════════

@router.get("")
async def config_olish(uid: int = Depends(get_uid)):
    """To'liq konfiguratsiyani olish — SD Agent config/?u=agent analogi."""
    async with get_conn(uid) as conn:
        config = await config_yukla(conn, uid)
        return config.to_dict()


@router.get("/modullar")
async def modullar_olish(uid: int = Depends(get_uid)):
    """Barcha config modullarini ro'yxatini olish."""
    async with get_conn(uid) as conn:
        return await config_modullari(conn, uid)


@router.get("/tarix")
async def tarix_olish(modul: Optional[str] = None, limit: int = 20,
                       uid: int = Depends(get_uid)):
    """Config o'zgarishlar tarixi."""
    async with get_conn(uid) as conn:
        return await config_tarix(conn, uid, modul, limit)


@router.get("/{modul}")
async def modul_olish(modul: str, uid: int = Depends(get_uid)):
    """Bitta config modulini olish."""
    async with get_conn(uid) as conn:
        config = await config_yukla(conn, uid)
        if not hasattr(config, modul):
            raise HTTPException(404, f"Modul topilmadi: {modul}")
        from dataclasses import asdict
        return asdict(getattr(config, modul))


@router.put("/{modul}")
async def modul_yangilash(modul: str, body: ConfigUpdate,
                           uid: int = Depends(get_uid)):
    """Config modulini yangilash — admin panel orqali."""
    async with get_conn(uid) as conn:
        try:
            result = await config_saqlash(conn, uid, modul, body.sozlamalar, "admin")
            return result
        except ValueError as e:
            raise HTTPException(400, str(e))


# ════════════════════════════════════════════════════════════
#  VALIDATSIYA ENDPOINTLARI
# ════════════════════════════════════════════════════════════

@router.post("/tekshir/klient")
async def klient_tekshirish(body: KlientValidate, uid: int = Depends(get_uid)):
    """Klient formasini server config asosida validatsiya qilish."""
    async with get_conn(uid) as conn:
        return await klient_field_tekshir(conn, uid, body.dict())


@router.post("/tekshir/buyurtma")
async def buyurtma_tekshirish(body: BuyurtmaValidate, uid: int = Depends(get_uid)):
    """Buyurtma ma'lumotlarini config asosida validatsiya qilish."""
    async with get_conn(uid) as conn:
        return await buyurtma_tekshir(conn, uid, body.dict())


# ════════════════════════════════════════════════════════════
#  SYNC LOG ENDPOINTLARI
# ════════════════════════════════════════════════════════════

@router.get("/sync-log")
async def sync_log_olish(limit: int = 50, uid: int = Depends(get_uid)):
    """So'nggi sync loglarini olish."""
    async with get_conn(uid) as conn:
        return await sync_loglar(conn, uid, limit)


@router.post("/sync-log")
async def sync_log_yaratish(body: SyncLogCreate, uid: int = Depends(get_uid),
                              request: Request = None):
    """Yangi sync log yozish."""
    async with get_conn(uid) as conn:
        ip = request.client.host if request and request.client else None
        log_id = await sync_log_yoz(
            conn, uid,
            sync_turi=body.sync_turi,
            boshlangan=datetime.utcnow(),
            entity_soni=body.entity_soni,
            yuborilgan_bayt=body.yuborilgan_bayt,
            qabul_qilingan_bayt=body.qabul_qilingan_bayt,
            status_kod=body.status_kod,
            tarmoq_turi=body.tarmoq_turi,
            batareya_foiz=body.batareya_foiz,
            xato_xabar=body.xato_xabar,
            muvaffaqiyatli=body.muvaffaqiyatli,
            qurilma_info=body.qurilma_info,
            ip_manzil=ip,
        )
        return {"id": log_id, "muvaffaqiyat": True}


# ════════════════════════════════════════════════════════════
#  DB MIGRATION
# ════════════════════════════════════════════════════════════

@router.post("/migrate")
async def migrate(uid: int = Depends(get_uid)):
    """Config jadvallarini yaratish (bir martalik)."""
    async with get_conn(uid) as conn:
        await conn.execute(CONFIG_MIGRATION_SQL)
        return {"muvaffaqiyat": True, "xabar": "Config jadvallari yaratildi"}
