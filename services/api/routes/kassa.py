"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — KASSA MODULI                        ║
║  Naqd / Karta / O'tkazma operatsiyalar                      ║
║  ✅ JWT auth (Depends(get_uid))                             ║
║  ✅ RLS bilan izolyatsiya                                   ║
║  ✅ Decimal aniqlik (float yo'q)                            ║
║  ✅ Asia/Tashkent timezone                                  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from shared.database.pool import rls_conn
from shared.utils.hisob import D
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/kassa", tags=["Kassa"])

# Tashkent sana — barcha SQL larda shu ishlatiladi
_TZ_SQL = "(yaratilgan AT TIME ZONE 'Asia/Tashkent')"
_TODAY_SQL = f"{_TZ_SQL}::date = (NOW() AT TIME ZONE 'Asia/Tashkent')::date"


# ═══ PYDANTIC MODELS — Decimal, float emas ═══

class KassaOperatsiya(BaseModel):
    tur: str = Field(..., pattern="^(kirim|chiqim)$")
    summa: Decimal = Field(..., gt=0, max_digits=18, decimal_places=2)
    usul: str = Field("naqd", pattern="^(naqd|karta|otkazma)$")
    tavsif: str | None = Field(None, max_length=500)
    kategoriya: str | None = Field(None, max_length=100)

class KassaStats(BaseModel):
    bugun_kirim: Decimal
    bugun_chiqim: Decimal
    bugun_balans: Decimal
    jami_kirim: Decimal
    jami_chiqim: Decimal
    jami_balans: Decimal
    naqd_balans: Decimal
    karta_balans: Decimal
    otkazma_balans: Decimal

    class Config:
        json_encoders = {Decimal: lambda v: str(v)}

class KassaQator(BaseModel):
    id: int
    tur: str
    summa: Decimal
    usul: str
    tavsif: str | None
    kategoriya: str | None
    sana: str
    vaqt: str

    class Config:
        json_encoders = {Decimal: lambda v: str(v)}


# ═══ ENDPOINTLAR — barcha uid = Depends(get_uid) ═══

@router.get("/stats", response_model=KassaStats)
async def kassa_stats(uid: int = Depends(get_uid)):
    """Kassa statistikasi — bugungi va umumiy"""
    async with rls_conn(uid) as c:
        bugun = await c.fetchrow(f"""
            SELECT
                COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
            FROM kassa_operatsiyalar
            WHERE {_TODAY_SQL}
        """)
        jami = await c.fetchrow("""
            SELECT
                COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
            FROM kassa_operatsiyalar
        """)
        usullar = await c.fetch("""
            SELECT usul,
                COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE -summa END), 0) AS balans
            FROM kassa_operatsiyalar
            GROUP BY usul
        """)

    usul_map = {r["usul"]: D(r["balans"]) for r in usullar}
    bk = D(bugun["kirim"])
    bc = D(bugun["chiqim"])
    jk = D(jami["kirim"])
    jc = D(jami["chiqim"])

    return KassaStats(
        bugun_kirim=bk, bugun_chiqim=bc, bugun_balans=bk - bc,
        jami_kirim=jk, jami_chiqim=jc, jami_balans=jk - jc,
        naqd_balans=usul_map.get("naqd", Decimal("0")),
        karta_balans=usul_map.get("karta", Decimal("0")),
        otkazma_balans=usul_map.get("otkazma", Decimal("0")),
    )


@router.post("/operatsiya")
async def kassa_operatsiya_yarat(data: KassaOperatsiya, uid: int = Depends(get_uid)):
    """Yangi kassa operatsiyasi yaratish + LEDGER"""
    async with rls_conn(uid) as c:
        op_id = await c.fetchval("""
            INSERT INTO kassa_operatsiyalar
                (user_id, tur, summa, usul, tavsif, kategoriya)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """, uid, data.tur, data.summa, data.usul,
            data.tavsif, data.kategoriya)

        # 📒 DOUBLE-ENTRY LEDGER
        try:
            if data.tur == "kirim":
                from shared.services.ledger import qarz_tolash_jurnali, jurnal_saqlash
                je = qarz_tolash_jurnali(uid, data.tavsif or "Kassa kirim", data.summa, data.usul)
            else:
                from shared.services.ledger import xarajat_jurnali, jurnal_saqlash
                je = xarajat_jurnali(uid, data.tavsif or "Kassa chiqim", data.summa, data.usul)
            je.idempotency_key = f"kassa_{uid}_{op_id}"
            await jurnal_saqlash(c, je)
        except Exception as _e:
            log.debug("kassa ledger: %s", _e)

    log.info("Kassa: uid=%d tur=%s summa=%s usul=%s",
             uid, data.tur, data.summa, data.usul)
    return {"id": op_id, "status": "saqlandi", "tur": data.tur,
            "summa": str(data.summa), "usul": data.usul}


@router.get("/tarix", response_model=list[KassaQator])
async def kassa_tarix(
    uid: int = Depends(get_uid),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    usul: str | None = Query(None, pattern="^(naqd|karta|otkazma)$"),
    tur: str | None = Query(None, pattern="^(kirim|chiqim)$"),
):
    """Kassa operatsiyalari tarixi"""
    async with rls_conn(uid) as c:
        qism = "WHERE 1=1"
        args = []
        i = 1
        if usul:
            qism += f" AND usul=${i}"; args.append(usul); i += 1
        if tur:
            qism += f" AND tur=${i}"; args.append(tur); i += 1

        rows = await c.fetch(f"""
            SELECT id, tur, summa, usul, tavsif, kategoriya, yaratilgan
            FROM kassa_operatsiyalar
            {qism}
            ORDER BY yaratilgan DESC
            LIMIT ${i} OFFSET ${i+1}
        """, *args, limit, offset)

    return [
        KassaQator(
            id=r["id"], tur=r["tur"], summa=D(r["summa"]),
            usul=r["usul"], tavsif=r.get("tavsif"),
            kategoriya=r.get("kategoriya"),
            sana=r["yaratilgan"].strftime("%Y-%m-%d"),
            vaqt=r["yaratilgan"].strftime("%H:%M"),
        )
        for r in rows
    ]


@router.delete("/operatsiya/{op_id}")
async def kassa_operatsiya_ochir(op_id: int, uid: int = Depends(get_uid)):
    """Kassa operatsiyasini o'chirish"""
    async with rls_conn(uid) as c:
        deleted = await c.fetchval(
            "DELETE FROM kassa_operatsiyalar WHERE id=$1 AND user_id=$2 RETURNING id",
            op_id, uid
        )
    if not deleted:
        raise HTTPException(404, "Operatsiya topilmadi")
    return {"status": "ochirildi", "id": op_id}
