"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — KLIENTLAR CRUD ROUTELARI                         ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from shared.database.pool import rls_conn, get_pool
from shared.utils import like_escape
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Klientlar"])


class KlientYangilaSorov(BaseModel):
    ism:          Optional[str]   = None
    telefon:      Optional[str]   = None
    manzil:       Optional[str]   = None
    kredit_limit: Optional[float] = None
    eslatma:      Optional[str]   = None


@router.get("/klientlar")
async def klientlar(
    limit: int = 20, offset: int = 0,
    qidiruv: Optional[str] = None,
    uid: int = Depends(get_uid)
):
    """Klientlar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if qidiruv:
            rows = await c.fetch("""
                SELECT k.id, k.user_id, k.ism, k.telefon, k.manzil, k.kredit_limit, k.jami_sotib, k.eslatma, k.yaratilgan,
                       COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) aktiv_qarz
                FROM klientlar k
                LEFT JOIN qarzlar q ON q.klient_id=k.id
                WHERE lower(k.ism) LIKE lower($3) OR k.telefon LIKE $3
                GROUP BY k.id
                ORDER BY k.jami_sotib DESC LIMIT $1 OFFSET $2
            """, limit, offset, f"%{like_escape(qidiruv)}%")
            total = await c.fetchval("""
                SELECT COUNT(*) FROM klientlar
                WHERE user_id=$2 AND (lower(ism) LIKE lower($1) OR telefon LIKE $1)
            """, f"%{like_escape(qidiruv)}%", uid)
        else:
            rows = await c.fetch("""
                SELECT k.id, k.user_id, k.ism, k.telefon, k.manzil, k.kredit_limit, k.jami_sotib, k.eslatma, k.yaratilgan,
                       COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) aktiv_qarz
                FROM klientlar k
                LEFT JOIN qarzlar q ON q.klient_id=k.id
                GROUP BY k.id
                ORDER BY k.jami_sotib DESC LIMIT $1 OFFSET $2
            """, limit, offset)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid
            )
    return {"total": total, "items": [dict(r) for r in rows]}


@router.post("/klient")
async def klient_yarat(data: dict, uid: int = Depends(get_uid)):
    """Yangi klient yaratish yoki topish"""
    from shared.cache.redis_cache import user_cache_tozala
    ism = (data.get("ism") or "").strip()
    if not ism:
        raise HTTPException(400, "Klient ismi bo'sh")
    async with rls_conn(uid) as c:
        klient = await c.fetchrow("""
            INSERT INTO klientlar(user_id, ism, telefon, manzil, kredit_limit)
            VALUES($1,$2,$3,$4,$5)
            ON CONFLICT(user_id, lower(ism)) DO UPDATE SET telefon=EXCLUDED.telefon
            RETURNING id, user_id, ism, telefon, manzil, kredit_limit, jami_sotib, yaratilgan
        """, uid, ism, data.get("telefon"), data.get("manzil"),
            data.get("kredit_limit", 0))
    await user_cache_tozala(uid)
    return dict(klient)


@router.put("/klient/{klient_id}")
async def klient_yangilash(klient_id: int, data: KlientYangilaSorov,
                            uid: int = Depends(get_uid)):
    """Klient ma'lumotlarini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    _RUXSAT = {"ism", "telefon", "manzil", "kredit_limit", "eslatma"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE klientlar SET {set_q} WHERE id=$1 AND user_id=$2",
            klient_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    return {"id": klient_id, "status": "yangilandi"}


@router.delete("/klient/{klient_id}")
async def klient_ochirish(klient_id: int, uid: int = Depends(get_uid)):
    """Klientni o'chirish (agar faol qarz yoki sotuv bo'lmasa)"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        qarz_bor = await c.fetchval(
            "SELECT EXISTS(SELECT 1 FROM qarzlar WHERE klient_id=$1 AND yopildi=FALSE AND qolgan>0)",
            klient_id
        )
        if qarz_bor:
            raise HTTPException(409, "Bu klientda faol qarz bor — o'chirib bo'lmaydi")
        result = await c.execute(
            "DELETE FROM klientlar WHERE id=$1 AND user_id=$2", klient_id, uid
        )
    if "DELETE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    return {"id": klient_id, "status": "ochirildi"}


@router.get("/klient/{klient_id}/tarix")
async def klient_tarix(klient_id: int, limit: int = 20, uid: int = Depends(get_uid)):
    """Klientning sotuv va qarz tarixi"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        klient = await c.fetchrow(
            "SELECT ism, telefon, kredit_limit, jami_sotib FROM klientlar WHERE id=$1 AND user_id=$2",
            klient_id, uid
        )
        if not klient:
            raise HTTPException(404, "Klient topilmadi")

        sotuvlar = await c.fetch("""
            SELECT ss.id, ss.jami, ss.tolangan, ss.qarz, ss.sana,
                   COUNT(ch.id) AS tovar_soni
            FROM sotuv_sessiyalar ss
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE ss.klient_id = $1
            GROUP BY ss.id
            ORDER BY ss.sana DESC LIMIT $2
        """, klient_id, limit)

        qarzlar = await c.fetch("""
            SELECT id, dastlabki_summa, tolangan, qolgan, muddat, yopildi, yaratilgan
            FROM qarzlar WHERE klient_id=$1
            ORDER BY yaratilgan DESC LIMIT $2
        """, klient_id, limit)

    return {
        "klient": dict(klient),
        "sotuvlar": [dict(r) for r in sotuvlar],
        "qarzlar": [dict(r) for r in qarzlar],
    }


@router.get("/klient/{klient_id}/profil")
async def klient_profil_api(klient_id: int, uid: int = Depends(get_uid)):
    """Klient CRM profili."""
    from shared.services.klient_crm import klient_profil
    async with rls_conn(uid) as c:
        data = await klient_profil(c, uid, klient_id)
    if not data:
        raise HTTPException(404, "Klient topilmadi")
    return data
