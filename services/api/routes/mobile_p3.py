"""
SAVDOAI — Mobile P3 Endpoints (visits + equipment).

Compatibility layer for the Flutter app (`/root/savdoai-mobile`) which
expects English REST under `/api/v1/mobile/`. Internally this maps to
the existing `checkin_out` table (visits) and a new `equipment` table.
"""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/mobile", tags=["mobile-p3"])


EQUIPMENT_MIGRATION = """
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'ok',
    serial TEXT,
    comment TEXT,
    photo_path TEXT,
    last_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_user_client ON equipment(user_id, client_id);
"""


async def _ensure_equipment_table(conn) -> None:
    """Idempotent equipment table bootstrap."""
    await conn.execute(EQUIPMENT_MIGRATION)


# ── Visits ───────────────────────────────────────────────────────────
class VisitIn(BaseModel):
    client_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    distance_m: Optional[float] = None
    comment: Optional[str] = None
    photo_path: Optional[str] = None


@router.post("/visits")
async def visits_create(body: VisitIn, uid: int = Depends(get_uid)) -> dict:
    """Mobile-friendly wrapper around the existing check-in flow.

    Stores into `checkin_out` with turi='checkin'. Frontend treats this
    as a one-shot visit ("I'm here, took a photo") rather than the
    paired check-in / check-out workflow that bot users have.
    """
    async with get_conn(uid) as conn:
        # Ensure base table exists (in case migration was missed).
        from shared.services.guards_v2 import CHECK_IN_OUT_MIGRATION
        await conn.execute(CHECK_IN_OUT_MIGRATION)

        row = await conn.fetchrow(
            """
            INSERT INTO checkin_out (user_id, klient_id, turi, latitude, longitude,
                                      accuracy, izoh, foto_url, vaqt)
            VALUES ($1, $2, 'checkin', $3, $4, $5, $6, $7, NOW())
            RETURNING id, vaqt
            """,
            uid, body.client_id,
            body.latitude, body.longitude, body.accuracy,
            body.comment, body.photo_path,
        )
        return {"id": row["id"], "created_at": row["vaqt"].isoformat()}


@router.get("/visits")
async def visits_list(
    days: int = Query(30, ge=1, le=365),
    client_id: Optional[int] = None,
    uid: int = Depends(get_uid),
) -> dict:
    """Recent visits for the current user, optionally filtered by client."""
    async with get_conn(uid) as conn:
        if client_id is not None:
            rows = await conn.fetch(
                """
                SELECT id, klient_id AS client_id, latitude, longitude, accuracy,
                       izoh AS comment, foto_url AS photo_path, vaqt AS created_at
                FROM checkin_out
                WHERE user_id = $1 AND klient_id = $2 AND turi = 'checkin'
                  AND vaqt >= NOW() - ($3 * INTERVAL '1 day')
                ORDER BY vaqt DESC
                """,
                uid, client_id, days,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT id, klient_id AS client_id, latitude, longitude, accuracy,
                       izoh AS comment, foto_url AS photo_path, vaqt AS created_at
                FROM checkin_out
                WHERE user_id = $1 AND turi = 'checkin'
                  AND vaqt >= NOW() - ($2 * INTERVAL '1 day')
                ORDER BY vaqt DESC
                """,
                uid, days,
            )
        items = [{**dict(r), "created_at": r["created_at"].isoformat()} for r in rows]
        return {"items": items, "total": len(items)}


# ── Equipment ────────────────────────────────────────────────────────
class EquipmentIn(BaseModel):
    client_id: Optional[int] = None
    name: str
    type: Optional[str] = None
    status: Optional[str] = "ok"
    serial: Optional[str] = None
    comment: Optional[str] = None
    photo_path: Optional[str] = None
    last_check_at: Optional[str] = None  # ISO 8601


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


@router.get("/equipment")
async def equipment_list(
    client_id: Optional[int] = None,
    uid: int = Depends(get_uid),
) -> dict:
    async with get_conn(uid) as conn:
        await _ensure_equipment_table(conn)
        if client_id is not None:
            rows = await conn.fetch(
                """
                SELECT id, client_id, name, type, status, serial, comment,
                       photo_path, last_check_at, created_at, updated_at
                FROM equipment
                WHERE user_id = $1 AND client_id = $2
                ORDER BY updated_at DESC
                """,
                uid, client_id,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT id, client_id, name, type, status, serial, comment,
                       photo_path, last_check_at, created_at, updated_at
                FROM equipment
                WHERE user_id = $1
                ORDER BY updated_at DESC
                """,
                uid,
            )
        items = []
        for r in rows:
            d = dict(r)
            for k in ("last_check_at", "created_at", "updated_at"):
                v = d.get(k)
                if v is not None:
                    d[k] = v.isoformat()
            items.append(d)
        return {"items": items, "total": len(items)}


@router.post("/equipment")
async def equipment_create(body: EquipmentIn, uid: int = Depends(get_uid)) -> dict:
    if not body.client_id:
        raise HTTPException(status_code=400, detail="client_id is required")
    async with get_conn(uid) as conn:
        await _ensure_equipment_table(conn)
        last_check = _parse_iso(body.last_check_at) or datetime.now(timezone.utc)
        row = await conn.fetchrow(
            """
            INSERT INTO equipment (user_id, client_id, name, type, status, serial,
                                    comment, photo_path, last_check_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, created_at
            """,
            uid, body.client_id, body.name, body.type, body.status or "ok",
            body.serial, body.comment, body.photo_path, last_check,
        )
        return {"id": row["id"], "created_at": row["created_at"].isoformat()}


@router.patch("/equipment/{eq_id}")
async def equipment_update(eq_id: int, body: EquipmentIn, uid: int = Depends(get_uid)) -> dict:
    """Partial update — only non-null fields are written."""
    async with get_conn(uid) as conn:
        await _ensure_equipment_table(conn)
        existing = await conn.fetchrow(
            "SELECT id FROM equipment WHERE id = $1 AND user_id = $2",
            eq_id, uid,
        )
        if not existing:
            raise HTTPException(status_code=404, detail="equipment not found")

        sets: list[str] = []
        args: list = []

        def _add(field: str, value):
            if value is None:
                return
            sets.append(f"{field} = ${len(args) + 1}")
            args.append(value)

        _add("name", body.name)
        _add("type", body.type)
        _add("status", body.status)
        _add("serial", body.serial)
        _add("comment", body.comment)
        _add("photo_path", body.photo_path)
        if body.last_check_at:
            parsed = _parse_iso(body.last_check_at)
            if parsed:
                _add("last_check_at", parsed)

        if not sets:
            return {"id": eq_id, "updated": False}

        sets.append("updated_at = NOW()")
        args.append(eq_id)
        args.append(uid)
        sql = (
            f"UPDATE equipment SET {', '.join(sets)} "
            f"WHERE id = ${len(args) - 1} AND user_id = ${len(args)} "
            "RETURNING id, updated_at"
        )
        row = await conn.fetchrow(sql, *args)
        return {"id": row["id"], "updated_at": row["updated_at"].isoformat()}
