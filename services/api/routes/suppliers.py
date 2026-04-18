"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — YETKAZIB BERUVCHI VA XARID BUYURTMA API          ║
║  /suppliers + /purchase web sahifalari uchun                ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Suppliers"])


# ═══ MODELS ═══

class SupplierYarat(BaseModel):
    nomi:          str       = Field(..., min_length=1, max_length=200)
    telefon:       str | None       = ""
    telegram_id:   int | None       = None
    kategoriyalar: list[str] | None = None


class SupplierYangila(BaseModel):
    nomi:          str | None       = None
    telefon:       str | None       = None
    telegram_id:   int | None       = None
    kategoriyalar: list[str] | None = None
    faol:          bool | None      = None


class PurchaseTovar(BaseModel):
    tovar_id:    int | None   = None
    nomi:        str
    miqdor:      float           = Field(..., gt=0)
    narx:        float           = Field(..., ge=0)
    birlik:      str | None   = "dona"


class PurchaseYarat(BaseModel):
    supplier_id: int
    tovarlar:    list[PurchaseTovar]
    izoh:        str | None = ""


class PurchaseHolatYangila(BaseModel):
    holat: str  # tayyorlanmoqda, yuborildi, tasdiqlandi, yetkazildi, bekor


# ═══ SUPPLIERS CRUD ═══

@router.get("/suppliers")
async def suppliers_list(
    qidiruv: str | None = None,
    faol_only: bool = False,
    uid: int = Depends(get_uid),
):
    """Yetkazib beruvchilar ro'yxati."""
    where = ["user_id = $1"]
    params: list = [uid]
    if qidiruv:
        params.append(f"%{qidiruv}%")
        where.append(f"(nomi ILIKE ${len(params)} OR telefon ILIKE ${len(params)})")
    if faol_only:
        where.append("faol = TRUE")

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT id, user_id, nomi, telefon, telegram_id,
                   kategoriyalar, faol, yaratilgan,
                   (SELECT COUNT(*) FROM supplier_buyurtmalar
                    WHERE supplier_id = yetkazib_beruvchilar.id) AS buyurtma_soni,
                   (SELECT COUNT(*) FROM supplier_buyurtmalar
                    WHERE supplier_id = yetkazib_beruvchilar.id
                      AND holat IN ('tayyorlanmoqda','yuborildi','tasdiqlandi')) AS aktiv_buyurtma,
                   (SELECT COALESCE(SUM(jami_summa), 0) FROM supplier_buyurtmalar
                    WHERE supplier_id = yetkazib_beruvchilar.id
                      AND holat NOT IN ('bekor')) AS jami_xarid,
                   (SELECT COALESCE(SUM(jami_summa), 0) FROM supplier_buyurtmalar
                    WHERE supplier_id = yetkazib_beruvchilar.id
                      AND holat IN ('tayyorlanmoqda','yuborildi','tasdiqlandi')) AS balans,
                   (SELECT MAX(yaratilgan) FROM supplier_buyurtmalar
                    WHERE supplier_id = yetkazib_beruvchilar.id
                      AND holat = 'yetkazildi') AS oxirgi_kirim
            FROM yetkazib_beruvchilar
            WHERE {" AND ".join(where)}
            ORDER BY faol DESC, nomi ASC
        """, *params)
    return {"items": [dict(r) for r in rows], "total": len(rows)}


@router.post("/supplier")
async def supplier_yarat(data: SupplierYarat, uid: int = Depends(get_uid)):
    """Yangi yetkazib beruvchi qo'shish."""
    async with rls_conn(uid) as c:
        try:
            row = await c.fetchrow("""
                INSERT INTO yetkazib_beruvchilar
                    (user_id, nomi, telefon, telegram_id, kategoriyalar)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                    telefon       = EXCLUDED.telefon,
                    telegram_id   = EXCLUDED.telegram_id,
                    kategoriyalar = EXCLUDED.kategoriyalar,
                    faol          = TRUE
                RETURNING id, nomi
            """, uid, data.nomi.strip(), data.telefon or "",
                data.telegram_id, data.kategoriyalar or [])
        except Exception as e:
            raise HTTPException(400, f"Xato: {e}")
    return {"id": row["id"], "nomi": row["nomi"], "status": "yaratildi"}


@router.put("/supplier/{supplier_id}")
async def supplier_yangila(supplier_id: int, data: SupplierYangila,
                            uid: int = Depends(get_uid)):
    """Yetkazib beruvchi ma'lumotini yangilash."""
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun maydon kerak")

    set_parts = []
    vals: list = []
    idx = 3
    for k, v in yangilar.items():
        set_parts.append(f"{k} = ${idx}")
        vals.append(v)
        idx += 1

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE yetkazib_beruvchilar SET {', '.join(set_parts)} "
            f"WHERE id = $1 AND user_id = $2",
            supplier_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Yetkazib beruvchi topilmadi")
    return {"id": supplier_id, "status": "yangilandi"}


@router.delete("/supplier/{supplier_id}")
async def supplier_ochir(supplier_id: int, uid: int = Depends(get_uid)):
    """Yetkazib beruvchini o'chirish (agar aktiv buyurtma bo'lmasa)."""
    async with rls_conn(uid) as c:
        aktiv = await c.fetchval("""
            SELECT COUNT(*) FROM supplier_buyurtmalar
            WHERE supplier_id = $1
              AND holat NOT IN ('yetkazildi', 'bekor')
        """, supplier_id)
        if aktiv:
            raise HTTPException(
                409, f"{aktiv} ta aktiv buyurtma bor — avval yakunlang")
        result = await c.execute(
            "DELETE FROM yetkazib_beruvchilar WHERE id = $1 AND user_id = $2",
            supplier_id, uid)
    if "DELETE 0" in result:
        raise HTTPException(404, "Yetkazib beruvchi topilmadi")
    return {"id": supplier_id, "status": "ochirildi"}


# ═══ PURCHASE ORDERS ═══

@router.get("/purchase")
async def purchase_list(
    supplier_id: int | None = None,
    holat: str | None = None,
    sana_dan: str | None = None,
    sana_gacha: str | None = None,
    uid: int = Depends(get_uid),
):
    """Xarid buyurtmalar ro'yxati."""
    where = ["sb.user_id = $1"]
    params: list = [uid]
    if supplier_id:
        params.append(supplier_id)
        where.append(f"sb.supplier_id = ${len(params)}")
    if holat:
        params.append(holat)
        where.append(f"sb.holat = ${len(params)}")
    if sana_dan:
        params.append(sana_dan)
        where.append(f"sb.yaratilgan >= ${len(params)}::timestamptz")
    if sana_gacha:
        params.append(sana_gacha)
        where.append(f"sb.yaratilgan < ${len(params)}::timestamptz + interval '1 day'")

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT sb.id, sb.supplier_id, sb.holat, sb.jami_summa,
                   sb.tovarlar, sb.izoh, sb.yaratilgan,
                   yb.nomi AS supplier_nomi, yb.telefon AS supplier_telefon,
                   jsonb_array_length(sb.tovarlar) AS tovar_soni
            FROM supplier_buyurtmalar sb
            LEFT JOIN yetkazib_beruvchilar yb ON yb.id = sb.supplier_id
            WHERE {" AND ".join(where)}
            ORDER BY sb.yaratilgan DESC
            LIMIT 200
        """, *params)

        stats = await c.fetchrow(f"""
            SELECT COUNT(*)                                 AS soni,
                   COALESCE(SUM(sb.jami_summa), 0)          AS jami,
                   COUNT(*) FILTER (WHERE holat = 'tayyorlanmoqda') AS pending,
                   COUNT(*) FILTER (WHERE holat = 'yetkazildi')     AS yetkazilgan
            FROM supplier_buyurtmalar sb WHERE {" AND ".join(where)}
        """, *params)

    return {
        "items": [dict(r) for r in rows],
        "stats": dict(stats) if stats else {},
    }


@router.post("/purchase")
async def purchase_yarat(data: PurchaseYarat, uid: int = Depends(get_uid)):
    """Yangi xarid buyurtma yaratish."""
    async with rls_conn(uid) as c:
        # Supplier bor ekanligini tekshirish
        exists = await c.fetchval(
            "SELECT 1 FROM yetkazib_beruvchilar WHERE id = $1 AND user_id = $2",
            data.supplier_id, uid
        )
        if not exists:
            raise HTTPException(404, "Yetkazib beruvchi topilmadi")

        jami = sum(t.miqdor * t.narx for t in data.tovarlar)
        tovarlar_json = [t.model_dump() for t in data.tovarlar]

        row = await c.fetchrow("""
            INSERT INTO supplier_buyurtmalar
                (user_id, supplier_id, jami_summa, tovarlar, izoh)
            VALUES ($1, $2, $3, $4::jsonb, $5)
            RETURNING id, yaratilgan
        """, uid, data.supplier_id, jami,
            __import__("json").dumps(tovarlar_json), data.izoh or "")

    return {
        "id":         row["id"],
        "jami_summa": float(jami),
        "yaratilgan": row["yaratilgan"].isoformat(),
        "status":     "yaratildi",
    }


@router.put("/purchase/{purchase_id}/holat")
async def purchase_holat(purchase_id: int, data: PurchaseHolatYangila,
                          uid: int = Depends(get_uid)):
    """Buyurtma holatini o'zgartirish."""
    ruxsat = {"tayyorlanmoqda", "yuborildi", "tasdiqlandi", "yetkazildi", "bekor"}
    if data.holat not in ruxsat:
        raise HTTPException(400, f"Noto'g'ri holat. Ruxsat: {ruxsat}")

    async with rls_conn(uid) as c:
        result = await c.execute(
            "UPDATE supplier_buyurtmalar SET holat = $1 "
            "WHERE id = $2 AND user_id = $3",
            data.holat, purchase_id, uid
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Buyurtma topilmadi")
    return {"id": purchase_id, "holat": data.holat, "status": "yangilandi"}


@router.get("/purchase/{purchase_id}")
async def purchase_detail(purchase_id: int, uid: int = Depends(get_uid)):
    """Bitta xarid buyurtma tafsiloti."""
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            SELECT sb.*, yb.nomi AS supplier_nomi, yb.telefon AS supplier_telefon
            FROM supplier_buyurtmalar sb
            LEFT JOIN yetkazib_beruvchilar yb ON yb.id = sb.supplier_id
            WHERE sb.id = $1 AND sb.user_id = $2
        """, purchase_id, uid)
    if not row:
        raise HTTPException(404, "Buyurtma topilmadi")
    return dict(row)
