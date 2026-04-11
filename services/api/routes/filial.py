"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — MULTI-FILIAL ROUTELAR v25.3.2                    ║
║  Bir nechta do'kon/ombor boshqarish                         ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/filial", tags=["Filial"])


class FilialYaratSorov(BaseModel):
    nomi:    str = Field(..., min_length=1, max_length=200)
    manzil:  str = Field("")
    telefon: str = Field("")
    turi:    str = Field("dokon", pattern="^(dokon|ombor|sklad|filial)$")


class TransferSorov(BaseModel):
    dan_filial_id: int
    ga_filial_id:  int
    tovar_id:      int
    miqdor:        float = Field(..., gt=0)
    izoh:          str = Field("")


@router.get("")
async def filiallar_list(uid: int = Depends(get_uid)):
    """Barcha filiallar ro'yxati."""
    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            SELECT f.id, f.nomi, f.manzil, f.telefon, f.turi, f.faol, f.asosiy,
                   COUNT(DISTINCT fq.tovar_id) AS tovar_soni,
                   COALESCE(SUM(fq.qoldiq * t.olish_narxi), 0) AS ombor_qiymat
            FROM filiallar f
            LEFT JOIN filial_qoldiqlar fq ON fq.filial_id = f.id
            LEFT JOIN tovarlar t ON t.id = fq.tovar_id
            WHERE f.user_id = $1
            GROUP BY f.id
            ORDER BY f.asosiy DESC, f.nomi
        """, uid)
    return {"items": [dict(r) for r in rows]}


@router.post("")
async def filial_yaratish(data: FilialYaratSorov, uid: int = Depends(get_uid)):
    """Yangi filial yaratish."""
    async with rls_conn(uid) as c:
        # Birinchi filial — asosiy
        bor = await c.fetchval(
            "SELECT COUNT(*) FROM filiallar WHERE user_id=$1", uid)
        asosiy = (bor == 0)

        row = await c.fetchrow("""
            INSERT INTO filiallar (user_id, nomi, manzil, telefon, turi, asosiy)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                manzil=EXCLUDED.manzil, telefon=EXCLUDED.telefon
            RETURNING id, nomi, turi, asosiy
        """, uid, data.nomi.strip(), data.manzil, data.telefon, data.turi, asosiy)
    return dict(row)


@router.get("/{filial_id}/tovarlar")
async def filial_tovarlar(filial_id: int, uid: int = Depends(get_uid)):
    """Filial tovar qoldiqlari."""
    async with rls_conn(uid) as c:
        filial = await c.fetchrow(
            "SELECT id, nomi FROM filiallar WHERE id=$1 AND user_id=$2",
            filial_id, uid)
        if not filial:
            raise HTTPException(404, "Filial topilmadi")

        rows = await c.fetch("""
            SELECT t.id, t.nomi, t.kategoriya, t.birlik,
                   t.olish_narxi, t.sotish_narxi,
                   fq.qoldiq, fq.min_qoldiq
            FROM filial_qoldiqlar fq
            JOIN tovarlar t ON t.id = fq.tovar_id
            WHERE fq.filial_id = $1 AND fq.user_id = $2
            ORDER BY t.kategoriya, t.nomi
        """, filial_id, uid)
    return {
        "filial": dict(filial),
        "tovarlar": [dict(r) for r in rows],
    }


@router.get("/transferlar")
async def transferlar_list(
    sana_dan: Optional[str] = None,
    sana_gacha: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    """Filiallar orasidagi transferlar ro'yxati."""
    where = ["ft.user_id = $1"]
    params: list = [uid]
    if sana_dan:
        params.append(sana_dan)
        where.append(f"ft.yaratilgan >= ${len(params)}::timestamptz")
    if sana_gacha:
        params.append(sana_gacha)
        where.append(f"ft.yaratilgan < ${len(params)}::timestamptz + interval '1 day'")
    where_sql = " AND ".join(where)

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT ft.id, ft.dan_filial_id, ft.ga_filial_id,
                   ft.tovar_id, ft.tovar_nomi, ft.miqdor,
                   ft.holat, ft.izoh, ft.yaratilgan,
                   fd.nomi AS dan_nomi,
                   fg.nomi AS ga_nomi
            FROM filial_transferlar ft
            LEFT JOIN filiallar fd ON fd.id = ft.dan_filial_id
            LEFT JOIN filiallar fg ON fg.id = ft.ga_filial_id
            WHERE {where_sql}
            ORDER BY ft.yaratilgan DESC
            LIMIT 200
        """, *params)

        stats = await c.fetchrow(f"""
            SELECT COUNT(*) AS soni,
                   COALESCE(SUM(miqdor), 0) AS jami_miqdor
            FROM filial_transferlar ft
            WHERE {where_sql}
        """, *params)

    return {
        "items": [dict(r) for r in rows],
        "stats": dict(stats) if stats else {},
    }


@router.post("/transfer")
async def filial_transfer(data: TransferSorov, uid: int = Depends(get_uid)):
    """Filiallar arasi tovar transfer."""
    if data.dan_filial_id == data.ga_filial_id:
        raise HTTPException(400, "Bir xil filialga transfer mumkin emas")

    async with rls_conn(uid) as c:
        async with c.transaction():
            # Filiallarni tekshirish
            dan = await c.fetchrow(
                "SELECT id, nomi FROM filiallar WHERE id=$1 AND user_id=$2",
                data.dan_filial_id, uid)
            ga = await c.fetchrow(
                "SELECT id, nomi FROM filiallar WHERE id=$1 AND user_id=$2",
                data.ga_filial_id, uid)
            if not dan or not ga:
                raise HTTPException(404, "Filial topilmadi")

            tovar = await c.fetchrow(
                "SELECT id, nomi FROM tovarlar WHERE id=$1 AND user_id=$2",
                data.tovar_id, uid)
            if not tovar:
                raise HTTPException(404, "Tovar topilmadi")

            # Qoldiq tekshirish
            qoldiq = await c.fetchval("""
                SELECT qoldiq FROM filial_qoldiqlar
                WHERE filial_id=$1 AND tovar_id=$2 FOR UPDATE
            """, data.dan_filial_id, data.tovar_id)

            if qoldiq is None or float(qoldiq) < data.miqdor:
                raise HTTPException(400,
                    f"Yetarli emas: {dan['nomi']} da {qoldiq or 0}, kerak {data.miqdor}")

            # Dan — kamaytirish
            await c.execute("""
                UPDATE filial_qoldiqlar SET qoldiq = qoldiq - $3, yangilangan = NOW()
                WHERE filial_id=$1 AND tovar_id=$2
            """, data.dan_filial_id, data.tovar_id, data.miqdor)

            # Ga — oshirish (yoki yaratish)
            await c.execute("""
                INSERT INTO filial_qoldiqlar (user_id, filial_id, tovar_id, qoldiq)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (filial_id, tovar_id) DO UPDATE SET
                    qoldiq = filial_qoldiqlar.qoldiq + $4,
                    yangilangan = NOW()
            """, uid, data.ga_filial_id, data.tovar_id, data.miqdor)

            # Transfer qayd qilish
            await c.execute("""
                INSERT INTO filial_transferlar
                    (user_id, dan_filial_id, ga_filial_id, tovar_id, tovar_nomi, miqdor, holat, izoh)
                VALUES ($1, $2, $3, $4, $5, $6, 'tasdiqlangan', $7)
            """, uid, data.dan_filial_id, data.ga_filial_id,
                data.tovar_id, tovar["nomi"], data.miqdor, data.izoh)

    return {
        "status": "transferred",
        "dan": dan["nomi"], "ga": ga["nomi"],
        "tovar": tovar["nomi"], "miqdor": data.miqdor,
    }
