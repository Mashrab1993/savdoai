"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI API — SOZLAMALAR (Settings) Routes                  ║
║                                                              ║
║  SalesDoc nastroyka bo'limiga mos universal CRUD endpointlar ║
║  Har bir sozlama turi uchun: list, create, update, delete    ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sozlamalar", tags=["Sozlamalar"])


# ── Pydantic models ──────────────────────────────────────────
class SozlamaItem(BaseModel):
    nomi: str
    rang: str | None = None
    qisqa: str | None = None
    turi: str | None = None
    ota_id: int | None = None
    tartib: int = 0
    faol: bool = True
    foiz: float | None = None  # narx_turlar uchun


# ── Ruxsat berilgan jadvallar (SQL injection himoyasi) ──────
_JADVALLAR = {
    "narx_turlar":          {"cols": "id, nomi, foiz, faol", "extra_insert": ", foiz", "extra_val": ", $5"},
    "klient_kategoriyalar": {"cols": "id, nomi, rang, tartib, faol"},
    "klient_turlari":       {"cols": "id, nomi, rang, tartib, faol"},
    "savdo_kanallari":      {"cols": "id, nomi, rang, tartib, faol"},
    "savdo_yunalishlari":   {"cols": "id, nomi, rang, tartib, faol"},
    "teglar":               {"cols": "id, nomi, rang, turi, faol"},
    "hududlar":             {"cols": "id, nomi, turi, ota_id, tartib, faol"},
    "rad_etish_sabablari":  {"cols": "id, nomi, tartib, faol"},
    "birliklar":            {"cols": "id, nomi, qisqa, tartib, faol"},
}


def _check_jadval(jadval: str):
    """Validate table name against whitelist."""
    if jadval not in _JADVALLAR:
        raise HTTPException(400, f"Noto'g'ri jadval: {jadval}")
    return _JADVALLAR[jadval]


# ── LIST ─────────────────────────────────────────────────────
@router.get("/{jadval}")
async def sozlama_royxati(jadval: str, uid: int = Depends(get_uid)):
    """Sozlama ro'yxatini olish."""
    info = _check_jadval(jadval)
    async with rls_conn(uid) as c:
        rows = await c.fetch(
            f"SELECT {info['cols']} FROM {jadval} WHERE user_id = $1 ORDER BY tartib, nomi",
            uid,
        )
    return {"items": [dict(r) for r in rows]}


# ── CREATE ───────────────────────────────────────────────────
@router.post("/{jadval}")
async def sozlama_yaratish(jadval: str, body: SozlamaItem, uid: int = Depends(get_uid)):
    """Yangi sozlama qo'shish."""
    _check_jadval(jadval)

    async with rls_conn(uid) as c:
        if jadval == "narx_turlar":
            row_id = await c.fetchval(
                "INSERT INTO narx_turlar (user_id, nomi, foiz, faol) "
                "VALUES ($1, $2, $3, $4) RETURNING id",
                uid, body.nomi, body.foiz or 0, body.faol,
            )
        elif jadval == "teglar":
            row_id = await c.fetchval(
                "INSERT INTO teglar (user_id, nomi, rang, turi, faol) "
                "VALUES ($1, $2, $3, $4, $5) RETURNING id",
                uid, body.nomi, body.rang or "#8B5CF6", body.turi or "umumiy", body.faol,
            )
        elif jadval == "hududlar":
            row_id = await c.fetchval(
                "INSERT INTO hududlar (user_id, nomi, turi, ota_id, tartib, faol) "
                "VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                uid, body.nomi, body.turi or "shahar", body.ota_id, body.tartib, body.faol,
            )
        elif jadval == "birliklar":
            row_id = await c.fetchval(
                "INSERT INTO birliklar (user_id, nomi, qisqa, tartib, faol) "
                "VALUES ($1, $2, $3, $4, $5) RETURNING id",
                uid, body.nomi, body.qisqa, body.tartib, body.faol,
            )
        else:
            # Standard 4-column table: nomi, rang, tartib, faol
            row_id = await c.fetchval(
                f"INSERT INTO {jadval} (user_id, nomi, rang, tartib, faol) "
                "VALUES ($1, $2, $3, $4, $5) RETURNING id",
                uid, body.nomi, body.rang or "#6366F1", body.tartib, body.faol,
            )

    return {"id": row_id, "status": "yaratildi"}


# ── UPDATE ───────────────────────────────────────────────────
@router.put("/{jadval}/{item_id}")
async def sozlama_yangilash(jadval: str, item_id: int, body: SozlamaItem, uid: int = Depends(get_uid)):
    """Sozlamani yangilash."""
    _check_jadval(jadval)

    async with rls_conn(uid) as c:
        # Build dynamic SET clause from provided fields
        updates = ["nomi = $3"]
        params = [uid, item_id, body.nomi]
        idx = 4

        if body.rang is not None:
            updates.append(f"rang = ${idx}")
            params.append(body.rang)
            idx += 1

        updates.append(f"tartib = ${idx}")
        params.append(body.tartib)
        idx += 1

        updates.append(f"faol = ${idx}")
        params.append(body.faol)
        idx += 1

        if jadval == "narx_turlar" and body.foiz is not None:
            updates.append(f"foiz = ${idx}")
            params.append(body.foiz)
            idx += 1

        if jadval == "teglar" and body.turi is not None:
            updates.append(f"turi = ${idx}")
            params.append(body.turi)
            idx += 1

        if jadval == "hududlar" and body.ota_id is not None:
            updates.append(f"ota_id = ${idx}")
            params.append(body.ota_id)
            idx += 1

        if jadval == "birliklar" and body.qisqa is not None:
            updates.append(f"qisqa = ${idx}")
            params.append(body.qisqa)
            idx += 1

        result = await c.execute(
            f"UPDATE {jadval} SET {', '.join(updates)} WHERE id = $2 AND user_id = $1",
            *params,
        )

    if result == "UPDATE 0":
        raise HTTPException(404, "Topilmadi")
    return {"id": item_id, "status": "yangilandi"}


# ── DELETE ───────────────────────────────────────────────────
@router.delete("/{jadval}/{item_id}")
async def sozlama_ochirish(jadval: str, item_id: int, uid: int = Depends(get_uid)):
    """Sozlamani o'chirish."""
    _check_jadval(jadval)

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"DELETE FROM {jadval} WHERE id = $1 AND user_id = $2",
            item_id, uid,
        )

    if result == "DELETE 0":
        raise HTTPException(404, "Topilmadi")
    return {"id": item_id, "status": "ochirildi"}
