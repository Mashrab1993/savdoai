"""
SAVDOAI v25.4.0 — ENTERPRISE API (Task, Foto, Uskuna, Filial, Kassa)
SD Agent + Smartup'dan OLDINDA bo'lish uchun.
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.enterprise_modules import (
    topshiriq_yaratish, topshiriq_holat, topshiriqlar_royxati,
    foto_saqlash, foto_royxati,
    uskuna_yaratish, uskuna_holat, klient_uskunalari,
    filial_yaratish, filiallar_royxati, filial_qoldiqlari,
    kunlik_kassa_hisoblash, ENTERPRISE_MIGRATION_SQL,
)

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  TOPSHIRIQLAR
# ═══════════════════════════════════════════════════════
task_router = APIRouter(prefix="/topshiriq", tags=["topshiriq"])

class TaskCreate(BaseModel):
    sarlavha: str
    tavsif: str = ""
    turi: str = "umumiy"
    muhimlik: str = "oddiy"
    klient_id: int | None = None
    agent_id: int | None = None
    muddat: str | None = None

class TaskUpdate(BaseModel):
    holat: str
    natija: str = ""

@task_router.get("")
async def task_list(holat: str | None = None, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await topshiriqlar_royxati(conn, uid, holat)

@task_router.post("")
async def task_create(body: TaskCreate, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        tid = await topshiriq_yaratish(conn, uid, body.dict())
        return {"id": tid, "muvaffaqiyat": True}

@task_router.put("/{tid}")
async def task_update(tid: int, body: TaskUpdate, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await topshiriq_holat(conn, uid, tid, body.holat, body.natija)

# ═══════════════════════════════════════════════════════
#  FOTOLAR
# ═══════════════════════════════════════════════════════
foto_router = APIRouter(prefix="/foto", tags=["foto"])

@foto_router.get("")
async def foto_list(turi: str | None = None, bog_id: int | None = None,
                     uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await foto_royxati(conn, uid, turi, bog_id)

@foto_router.post("")
async def foto_upload(turi: str = Form(...), bog_id: int = Form(0),
                       fayl_url: str = Form(...), izoh: str = Form(""),
                       uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        fid = await foto_saqlash(conn, uid, turi, bog_id, fayl_url, izoh=izoh)
        return {"id": fid, "muvaffaqiyat": True}

# ═══════════════════════════════════════════════════════
#  USKUNALAR
# ═══════════════════════════════════════════════════════
uskuna_router = APIRouter(prefix="/uskuna", tags=["uskuna"])

class UskunaCreate(BaseModel):
    klient_id: int
    nomi: str
    turi: str = "muzlatgich"
    seriya_raqami: str = ""
    inventar_raqami: str = ""
    olingan_sana: str | None = None
    foto_url: str = ""
    izoh: str = ""

@uskuna_router.get("/klient/{klient_id}")
async def uskuna_list(klient_id: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await klient_uskunalari(conn, uid, klient_id)

@uskuna_router.post("")
async def uskuna_create(body: UskunaCreate, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        uid2 = await uskuna_yaratish(conn, uid, body.dict())
        return {"id": uid2, "muvaffaqiyat": True}

@uskuna_router.put("/{uid2}/holat")
async def uskuna_update(uid2: int, holat: str, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await uskuna_holat(conn, uid, uid2, holat)

# ═══════════════════════════════════════════════════════
#  FILIALLAR
# ═══════════════════════════════════════════════════════
filial_router = APIRouter(prefix="/filial", tags=["filial"])

class FilialCreate(BaseModel):
    nomi: str
    manzil: str = ""
    telefon: str = ""
    turi: str = "dokon"
    latitude: float | None = None
    longitude: float | None = None
    bosh_filial: bool = False

@filial_router.get("")
async def filial_list(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await filiallar_royxati(conn, uid)

@filial_router.post("")
async def filial_create(body: FilialCreate, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        fid = await filial_yaratish(conn, uid, body.dict())
        return {"id": fid, "muvaffaqiyat": True}

@filial_router.get("/{fid}/qoldiq")
async def filial_stock(fid: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await filial_qoldiqlari(conn, fid)

# ═══════════════════════════════════════════════════════
#  KUNLIK KASSA
# ═══════════════════════════════════════════════════════
kassa_router = APIRouter(prefix="/kassa", tags=["kassa"])

@kassa_router.get("")
@kassa_router.get("/{sana}")
async def kassa_get(sana: str | None = None, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        return await kunlik_kassa_hisoblash(conn, uid, sana)

# ═══════════════════════════════════════════════════════
#  MIGRATION
# ═══════════════════════════════════════════════════════
enterprise_migrate_router = APIRouter(prefix="/enterprise", tags=["enterprise"])

@enterprise_migrate_router.post("/migrate")
async def ent_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(ENTERPRISE_MIGRATION_SQL)
        return {"muvaffaqiyat": True, "xabar": "Enterprise jadvallar yaratildi (topshiriq, foto, uskuna, filial, kassa)"}

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(task_router)
router.include_router(foto_router)
router.include_router(uskuna_router)
router.include_router(filial_router)
router.include_router(kassa_router)
router.include_router(enterprise_migrate_router)
