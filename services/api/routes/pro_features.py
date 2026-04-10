"""
SAVDOAI v25.4.0 — PRO XUSUSIYATLAR API
Klient 360°, Marshrut optimallashtirish, Gamification
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.klient_360 import klient_360
from shared.services.route_optimizer import marshrut_optimallashtir
from shared.services.gamification import (
    gamification_yangilash, leaderboard, GAMIFICATION_MIGRATION,
)

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  KLIENT 360°
# ═══════════════════════════════════════════════════════
k360_router = APIRouter(prefix="/klient360", tags=["klient-360"])


@k360_router.get("/{klient_id}")
async def klient_360_ep(klient_id: int, uid: int = Depends(get_uid)):
    """Klient haqida to'liq 360° ma'lumot — HubSpot analog."""
    async with get_conn(uid) as conn:
        return await klient_360(conn, uid, klient_id)


# ═══════════════════════════════════════════════════════
#  MARSHRUT OPTIMALLASHTIRISH
# ═══════════════════════════════════════════════════════
route_router = APIRouter(prefix="/marshrut", tags=["marshrut"])


class RouteRequest(BaseModel):
    klient_idlar: List[int] = []
    boshlangich_lat: Optional[float] = None
    boshlangich_lon: Optional[float] = None


@route_router.post("/optimallashtir")
async def optimize(body: RouteRequest, uid: int = Depends(get_uid)):
    """TSP marshrut optimallashtirish — Route4Me analog."""
    async with get_conn(uid) as conn:
        return await marshrut_optimallashtir(
            conn, uid,
            body.klient_idlar if body.klient_idlar else None,
            body.boshlangich_lat, body.boshlangich_lon)


# ═══════════════════════════════════════════════════════
#  GAMIFICATION
# ═══════════════════════════════════════════════════════
game_router = APIRouter(prefix="/gamification", tags=["gamification"])


@game_router.get("/me")
async def my_stats(uid: int = Depends(get_uid)):
    """Mening gamification statistikam."""
    async with get_conn(uid) as conn:
        return await gamification_yangilash(conn, uid)


@game_router.get("/leaderboard")
async def lb(davr: str = "hafta", limit: int = 20, uid: int = Depends(get_uid)):
    """Global leaderboard — reytinglar."""
    async with get_conn(uid) as conn:
        return await leaderboard(conn, davr, limit)


@game_router.post("/migrate")
async def game_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(GAMIFICATION_MIGRATION)
        return {"muvaffaqiyat": True}

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(k360_router)
router.include_router(route_router)
