"""
SAVDOAI v25.4.0 — GPS TRACKING API
Android GpsTrackingService dan kelgan lokatsiya ma'lumotlarini qabul qilish.
"""
from __future__ import annotations
import os
import sys
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn

log = logging.getLogger(__name__)
router = APIRouter(prefix="/gps", tags=["gps"])

GPS_MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS gps_tracks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy REAL,
    provider VARCHAR(20),
    battery_level INTEGER,
    track_date DATE,
    track_time TIME,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_user_date ON gps_tracks(user_id, track_date DESC);
"""


class TrackPoint(BaseModel):
    lat: float
    lon: float
    accuracy: float = 0
    timestamp: int = 0
    provider: str = "gps"
    battery: int = 0
    date: str = ""
    time: str = ""


class TracksPayload(BaseModel):
    user_id: int
    tracks: list[TrackPoint]


@router.post("/tracks")
async def save_tracks(body: TracksPayload, uid: int = Depends(get_uid)):
    """Android GpsTrackingService dan kelgan track'larni saqlash."""
    async with get_conn(uid) as conn:
        saved = 0
        for t in body.tracks:
            await conn.execute("""
                INSERT INTO gps_tracks (user_id, latitude, longitude, accuracy,
                    provider, battery_level, track_date, track_time, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8::time, $9)
            """, uid, t.lat, t.lon, t.accuracy, t.provider, t.battery,
                t.date or None, t.time or None, t.timestamp)
            saved += 1
        return {"saved": saved}


@router.get("/tracks")
async def get_tracks(sana: str | None = None, limit: int = 200,
                      uid: int = Depends(get_uid)):
    """GPS tracklar ro'yxatini olish."""
    async with get_conn(uid) as conn:
        if sana:
            rows = await conn.fetch(
                "SELECT * FROM gps_tracks WHERE user_id=$1 AND track_date=$2::date "
                "ORDER BY timestamp DESC LIMIT $3", uid, sana, limit)
        else:
            rows = await conn.fetch(
                "SELECT * FROM gps_tracks WHERE user_id=$1 "
                "ORDER BY created_at DESC LIMIT $2", uid, limit)
        return [dict(r) for r in rows]


@router.get("/oxirgi")
async def oxirgi_lokatsiya(uid: int = Depends(get_uid)):
    """Eng so'nggi GPS lokatsiyani olish."""
    async with get_conn(uid) as conn:
        row = await conn.fetchrow(
            "SELECT * FROM gps_tracks WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1", uid)
        return dict(row) if row else None


@router.post("/migrate")
async def migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(GPS_MIGRATION_SQL)
        return {"muvaffaqiyat": True}
