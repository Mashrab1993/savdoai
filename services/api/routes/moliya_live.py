"""
SAVDOAI v25.4.0 — MOLIYA + LIVE FEED + KUNLIK REJA API
"""
from __future__ import annotations
import os, sys, logging
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.financial_statements import (
    foyda_zarar, balans_varaq, pul_oqimi, biznes_koeffitsientlar,
)
from shared.services.live_feed import live_dashboard
from shared.services.daily_planner import kunlik_reja

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  MOLIYAVIY HISOBOTLAR
# ═══════════════════════════════════════════════════════
moliya_router = APIRouter(prefix="/moliya", tags=["moliya"])


@moliya_router.get("/foyda-zarar")
async def pl(sana_dan: str | None = None, sana_gacha: str | None = None,
             uid: int = Depends(get_uid)):
    """Foyda va Zarar hisoboti (P&L) — QuickBooks analog."""
    async with get_conn(uid) as conn:
        return await foyda_zarar(conn, uid, sana_dan, sana_gacha)


@moliya_router.get("/balans")
async def bs(uid: int = Depends(get_uid)):
    """Balans varaq (Balance Sheet)."""
    async with get_conn(uid) as conn:
        return await balans_varaq(conn, uid)


@moliya_router.get("/pul-oqimi")
async def cf(sana_dan: str | None = None, sana_gacha: str | None = None,
             uid: int = Depends(get_uid)):
    """Pul oqimi hisoboti (Cash Flow)."""
    async with get_conn(uid) as conn:
        return await pul_oqimi(conn, uid, sana_dan, sana_gacha)


@moliya_router.get("/koeffitsientlar")
async def kpi(kunlar: int = 30, uid: int = Depends(get_uid)):
    """Biznes koeffitsientlari — Gross Margin, DSO, Inventory Turnover."""
    async with get_conn(uid) as conn:
        return await biznes_koeffitsientlar(conn, uid, kunlar)


# ═══════════════════════════════════════════════════════
#  LIVE DASHBOARD
# ═══════════════════════════════════════════════════════
# prefix changed from /live → /live-dashboard to avoid collision with
# monitoring router's /live kubernetes liveness probe
live_router = APIRouter(prefix="/live-dashboard", tags=["live"])


@live_router.get("")
async def live(uid: int = Depends(get_uid)):
    """Real-time dashboard — Shopify Live View analog."""
    async with get_conn(uid) as conn:
        return await live_dashboard(conn, uid)


# ═══════════════════════════════════════════════════════
#  KUNLIK REJA
# ═══════════════════════════════════════════════════════
reja_router = APIRouter(prefix="/reja", tags=["reja"])


@reja_router.get("/bugun")
async def bugun(uid: int = Depends(get_uid)):
    """AI kunlik ish rejasi — ertalab ochganda tayyor."""
    async with get_conn(uid) as conn:
        return await kunlik_reja(conn, uid)

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(moliya_router)
router.include_router(live_router)
router.include_router(reja_router)
