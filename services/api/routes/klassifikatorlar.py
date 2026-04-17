"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — TOVAR KLASSIFIKATORLARI API                      ║
║                                                                      ║
║  7 turdagi klassifikator (kategoriya, subkat, gruppa, brend,         ║
║  ishlab_chiqaruvchi, segment, gruppa_kategoriya) — yagona endpoint.  ║
║                                                                      ║
║  SalesDoc /settings/view/productCategory funksiyalariga analog,     ║
║  lekin bitta API va bitta jadval — tezroq, toza va yengil.          ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, validator
from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/klassifikator", tags=["Klassifikator"])

ALLOWED_TURI = {
    "kategoriya", "subkategoriya", "gruppa", "brend",
    "ishlab_chiqaruvchi", "segment", "gruppa_kategoriya",
}


class KlfIn(BaseModel):
    turi: str = Field(..., description="Turi (kategoriya, brend, ...)")
    nomi: str = Field(..., min_length=1, max_length=200)
    kod: Optional[str] = Field(None, max_length=50)
    davlat: Optional[str] = Field(None, max_length=100)
    birlik_id: Optional[int] = None
    parent_id: Optional[int] = None
    tartib: int = 0
    faol: bool = True

    @validator("turi")
    def _check_turi(cls, v):
        if v not in ALLOWED_TURI:
            raise ValueError(f"turi '{v}' ruxsat etilmagan. Ruxsatetilgan: {sorted(ALLOWED_TURI)}")
        return v

    @validator("nomi")
    def _trim_nomi(cls, v):
        v = (v or "").strip()
        if not v:
            raise ValueError("Nomi bo'sh bo'lishi mumkin emas")
        return v


@router.get("")
async def list_klassifikatorlar(
    turi: Optional[str] = Query(None, description="Filter: kategoriya/brend/..."),
    faol: Optional[bool] = Query(None, description="Faqat faol/nofaol"),
    uid: int = Depends(get_uid),
):
    """Barcha klassifikatorlarni ro'yxatlaymiz. turi bermasa — barchasi."""
    if turi and turi not in ALLOWED_TURI:
        raise HTTPException(400, f"turi '{turi}' noto'g'ri")

    where = ["user_id = $1"]
    params: list = [uid]
    if turi:
        params.append(turi)
        where.append(f"turi = ${len(params)}")
    if faol is not None:
        params.append(faol)
        where.append(f"faol = ${len(params)}")

    sql = f"""
        SELECT k.*,
               p.nomi AS parent_nomi,
               b.nomi AS birlik_nomi,
               (SELECT COUNT(*) FROM tovarlar t
                WHERE t.user_id = k.user_id
                  AND CASE k.turi
                      WHEN 'kategoriya' THEN t.kategoriya_id = k.id
                      WHEN 'subkategoriya' THEN t.subkategoriya_id = k.id
                      WHEN 'gruppa' THEN t.gruppa_id = k.id
                      WHEN 'brend' THEN t.brend_id = k.id
                      WHEN 'ishlab_chiqaruvchi' THEN t.ishlab_chiqaruvchi_id = k.id
                      WHEN 'segment' THEN t.segment_id = k.id
                      WHEN 'gruppa_kategoriya' THEN t.gruppa_kategoriya_id = k.id
                      ELSE FALSE
                  END
               ) AS tovar_soni
        FROM tovar_klassifikatorlari k
        LEFT JOIN tovar_klassifikatorlari p ON p.id = k.parent_id
        LEFT JOIN birliklar b ON b.id = k.birlik_id
        WHERE {' AND '.join(where)}
        ORDER BY k.turi, k.tartib, k.nomi
    """

    async with rls_conn(uid) as c:
        rows = await c.fetch(sql, *params)

    result: dict[str, list] = {t: [] for t in ALLOWED_TURI}
    for r in rows:
        result[r["turi"]].append({
            "id": r["id"],
            "turi": r["turi"],
            "nomi": r["nomi"],
            "kod": r["kod"],
            "davlat": r["davlat"],
            "birlik_id": r["birlik_id"],
            "birlik_nomi": r["birlik_nomi"],
            "parent_id": r["parent_id"],
            "parent_nomi": r["parent_nomi"],
            "tartib": r["tartib"],
            "faol": r["faol"],
            "tovar_soni": int(r["tovar_soni"] or 0),
            "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
        })

    totals = {t: len(v) for t, v in result.items()}
    return {"items": result, "totals": totals, "jami": sum(totals.values())}


@router.post("")
async def create_klassifikator(body: KlfIn, uid: int = Depends(get_uid)):
    """Yangi klassifikator qo'shamiz."""
    async with rls_conn(uid) as c:
        # Duplicate check
        dup = await c.fetchval("""
            SELECT id FROM tovar_klassifikatorlari
            WHERE user_id=$1 AND turi=$2 AND LOWER(nomi)=LOWER($3)
        """, uid, body.turi, body.nomi)
        if dup:
            raise HTTPException(409, f"'{body.nomi}' allaqachon mavjud ({body.turi})")

        row = await c.fetchrow("""
            INSERT INTO tovar_klassifikatorlari
                (user_id, turi, nomi, kod, davlat, birlik_id, parent_id, tartib, faol)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        """, uid, body.turi, body.nomi, body.kod, body.davlat,
             body.birlik_id, body.parent_id, body.tartib, body.faol)

    return dict(row) | {
        "yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None,
        "yangilangan": row["yangilangan"].isoformat() if row["yangilangan"] else None,
    }


@router.put("/{klf_id}")
async def update_klassifikator(klf_id: int, body: KlfIn, uid: int = Depends(get_uid)):
    """Klassifikatorni yangilaymiz."""
    async with rls_conn(uid) as c:
        exists = await c.fetchval("""
            SELECT turi FROM tovar_klassifikatorlari WHERE id=$1 AND user_id=$2
        """, klf_id, uid)
        if not exists:
            raise HTTPException(404, "Klassifikator topilmadi")
        if exists != body.turi:
            raise HTTPException(400, "Turini o'zgartirib bo'lmaydi")

        # Duplicate check (boshqa yozuvda shu nom bormi)
        dup = await c.fetchval("""
            SELECT id FROM tovar_klassifikatorlari
            WHERE user_id=$1 AND turi=$2 AND LOWER(nomi)=LOWER($3) AND id != $4
        """, uid, body.turi, body.nomi, klf_id)
        if dup:
            raise HTTPException(409, f"'{body.nomi}' boshqa yozuvda band")

        row = await c.fetchrow("""
            UPDATE tovar_klassifikatorlari
            SET nomi=$1, kod=$2, davlat=$3, birlik_id=$4, parent_id=$5,
                tartib=$6, faol=$7, yangilangan=NOW()
            WHERE id=$8 AND user_id=$9
            RETURNING *
        """, body.nomi, body.kod, body.davlat, body.birlik_id,
             body.parent_id, body.tartib, body.faol, klf_id, uid)

    return dict(row) | {
        "yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None,
        "yangilangan": row["yangilangan"].isoformat() if row["yangilangan"] else None,
    }


@router.delete("/{klf_id}")
async def delete_klassifikator(klf_id: int, uid: int = Depends(get_uid)):
    """O'chiramiz (tovar *_id FK SET NULL bo'ladi)."""
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            DELETE FROM tovar_klassifikatorlari
            WHERE id=$1 AND user_id=$2 RETURNING id, turi, nomi
        """, klf_id, uid)
    if not row:
        raise HTTPException(404, "Klassifikator topilmadi")
    return {"ok": True, "deleted": dict(row)}


@router.post("/reorder")
async def reorder_klassifikatorlar(
    items: list[dict] = Field(..., description="[{id, tartib}]"),
    uid: int = Depends(get_uid),
):
    """Tartiblashtirish: [{id, tartib}] ro'yxati."""
    if not items:
        return {"ok": True, "updated": 0}
    async with rls_conn(uid) as c:
        async with c.transaction():
            for it in items:
                await c.execute(
                    "UPDATE tovar_klassifikatorlari SET tartib=$1 WHERE id=$2 AND user_id=$3",
                    int(it.get("tartib", 0)), int(it["id"]), uid,
                )
    return {"ok": True, "updated": len(items)}
