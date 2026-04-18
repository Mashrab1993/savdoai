"""
SAVDOAI v25.4.0 — ADVANCED ANALYTICS + WEBHOOK API
Dunyo TOP-10 darajasidagi analitika endpointlari.
"""
from __future__ import annotations
import os
import sys
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.abc_xyz_matritsa import abc_xyz_tahlil, avtobuyurtma_tavsiya
from shared.services.churn_prediction import churn_tahlil
from shared.services.webhook_platform import (
    webhook_yuborish, webhook_yaratish, webhook_royxati,
    WEBHOOK_EVENTLAR, WEBHOOK_MIGRATION,
)

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  ABC-XYZ MATRITSA
# ═══════════════════════════════════════════════════════
abc_router = APIRouter(prefix="/analitika/abc-xyz", tags=["analitika"])


@abc_router.get("")
async def abc_xyz(kunlar: int = 90, uid: int = Depends(get_uid)):
    """ABC-XYZ inventar matritsa — SAP/Oracle darajasida."""
    async with get_conn(uid) as conn:
        return await abc_xyz_tahlil(conn, uid, kunlar)


@abc_router.get("/avtobuyurtma")
async def avtobuyurtma(uid: int = Depends(get_uid)):
    """Reorder Point asosida avtomatik buyurtma tavsiyalari."""
    async with get_conn(uid) as conn:
        return await avtobuyurtma_tavsiya(conn, uid)


# ═══════════════════════════════════════════════════════
#  CHURN PREDICTION
# ═══════════════════════════════════════════════════════
churn_router = APIRouter(prefix="/analitika/churn", tags=["analitika"])


@churn_router.get("")
async def churn(uid: int = Depends(get_uid)):
    """Klient ketish xavfini prognozlash — Salesforce Einstein analog."""
    async with get_conn(uid) as conn:
        return await churn_tahlil(conn, uid)


# ═══════════════════════════════════════════════════════
#  WEBHOOK PLATFORM
# ═══════════════════════════════════════════════════════
webhook_router = APIRouter(prefix="/webhook", tags=["webhook"])


class WebhookCreate(BaseModel):
    nomi: str
    url: str
    secret: str = ""
    eventlar: list[str] = []


@webhook_router.get("/eventlar")
async def eventlar():
    """Barcha mumkin bo'lgan webhook eventlari."""
    return WEBHOOK_EVENTLAR


@webhook_router.get("")
async def royxat(uid: int = Depends(get_uid)):
    """Webhook'lar ro'yxati."""
    async with get_conn(uid) as conn:
        return await webhook_royxati(conn, uid)


@webhook_router.post("")
async def yaratish(body: WebhookCreate, uid: int = Depends(get_uid)):
    """Yangi webhook yaratish."""
    for e in body.eventlar:
        if e not in WEBHOOK_EVENTLAR:
            raise HTTPException(400, f"Noto'g'ri event: {e}")
    async with get_conn(uid) as conn:
        wid = await webhook_yaratish(conn, uid, body.dict())
        return {"id": wid, "muvaffaqiyat": True}


@webhook_router.post("/test/{webhook_id}")
async def test_webhook(webhook_id: int, uid: int = Depends(get_uid)):
    """Webhook'ni sinab ko'rish."""
    async with get_conn(uid) as conn:
        wh = await conn.fetchrow(
            "SELECT * FROM webhooklar WHERE id=$1 AND user_id=$2", webhook_id, uid)
        if not wh:
            raise HTTPException(404, "Webhook topilmadi")
        sent = await webhook_yuborish(conn, uid, "test.ping", {"xabar": "SavdoAI webhook test"})
        return {"yuborildi": sent}


@webhook_router.post("/migrate")
async def wh_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(WEBHOOK_MIGRATION)
        return {"muvaffaqiyat": True}


# ═══════════════════════════════════════════════════════
#  COHORT TAHLIL
# ═══════════════════════════════════════════════════════
cohort_router = APIRouter(prefix="/analitika/cohort", tags=["analitika"])


@cohort_router.get("")
async def cohort_tahlil(oylar: int = 6, uid: int = Depends(get_uid)):
    """Klient cohort tahlili — retention matritsasi.

    Har bir oyda qo'shilgan klientlarning keyingi oylarda
    qaytib sotib olish foizini hisoblaydi.
    """
    async with get_conn(uid) as conn:
        rows = await conn.fetch("""
            WITH cohort AS (
                SELECT
                    k.id AS klient_id,
                    DATE_TRUNC('month', MIN(s.sana)) AS cohort_oy,
                    DATE_TRUNC('month', s.sana) AS sotuv_oy
                FROM klientlar k
                JOIN sotuv_sessiyalar s ON s.klient_id = k.id AND s.user_id = k.user_id
                WHERE k.user_id = $1
                    AND s.sana >= NOW() - ($2 || ' months')::interval
                GROUP BY k.id, DATE_TRUNC('month', s.sana)
            )
            SELECT
                cohort_oy,
                sotuv_oy,
                COUNT(DISTINCT klient_id) AS klient_soni
            FROM cohort
            GROUP BY cohort_oy, sotuv_oy
            ORDER BY cohort_oy, sotuv_oy
        """, uid, str(oylar))

        # Matritsa qurilishi
        from collections import defaultdict
        matritsa = defaultdict(lambda: defaultdict(int))
        cohort_sizes = defaultdict(int)

        for r in rows:
            cohort_key = r["cohort_oy"].strftime("%Y-%m")
            sotuv_key = r["sotuv_oy"].strftime("%Y-%m")
            matritsa[cohort_key][sotuv_key] = r["klient_soni"]
            if cohort_key == sotuv_key:
                cohort_sizes[cohort_key] = r["klient_soni"]

        # Foizga aylantirish
        natija = []
        for cohort_key in sorted(matritsa.keys()):
            size = cohort_sizes.get(cohort_key, 1)
            oy_data = {}
            for sotuv_key in sorted(matritsa[cohort_key].keys()):
                oy_data[sotuv_key] = {
                    "soni": matritsa[cohort_key][sotuv_key],
                    "foiz": round(matritsa[cohort_key][sotuv_key] / size * 100, 1)
                }
            natija.append({
                "cohort": cohort_key,
                "boshlangich_soni": size,
                "oylar": oy_data,
            })

        return {"cohortlar": natija, "jami_oylar": oylar}

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(abc_router)
router.include_router(churn_router)
router.include_router(cohort_router)
router.include_router(webhook_router)
