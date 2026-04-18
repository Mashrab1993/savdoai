"""
SAVDOAI v25.4.0 — TASHRIF KALENDARI + UNIVERSAL EXPORT + NOTIFICATION API
"""
from __future__ import annotations
import os, sys, io, logging
from typing import Optional, List
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn
from shared.services.universal_export import export_sotuvlar, export_klientlar, export_tovarlar

log = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════
#  UNIVERSAL EXPORT
# ═══════════════════════════════════════════════════════
export_router = APIRouter(prefix="/export", tags=["export"])


@export_router.get("/sotuvlar")
async def exp_sotuvlar(sana_dan: str, sana_gacha: str, fmt: str = "excel",
                        uid: int = Depends(get_uid)):
    """Sotuv hisobotini Excel/CSV eksport."""
    async with get_conn(uid) as conn:
        data = await export_sotuvlar(conn, uid, sana_dan, sana_gacha, fmt)
        if fmt == "csv":
            return StreamingResponse(io.BytesIO(data), media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=sotuvlar.csv"})
        return StreamingResponse(io.BytesIO(data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=sotuvlar.xlsx"})


@export_router.get("/klientlar")
async def exp_klientlar(fmt: str = "excel", uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        data = await export_klientlar(conn, uid, fmt)
        ct = "text/csv" if fmt == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "csv" if fmt == "csv" else "xlsx"
        return StreamingResponse(io.BytesIO(data), media_type=ct,
            headers={"Content-Disposition": f"attachment; filename=klientlar.{ext}"})


@export_router.get("/tovarlar")
async def exp_tovarlar(fmt: str = "excel", uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        data = await export_tovarlar(conn, uid, fmt)
        ct = "text/csv" if fmt == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "csv" if fmt == "csv" else "xlsx"
        return StreamingResponse(io.BytesIO(data), media_type=ct,
            headers={"Content-Disposition": f"attachment; filename=tovarlar.{ext}"})


# ═══════════════════════════════════════════════════════
#  TASHRIF KALENDARI (SD Agent dayOfWeeks visit schedule)
# ═══════════════════════════════════════════════════════
calendar_router = APIRouter(prefix="/kalendar", tags=["kalendar"])

VISIT_MIGRATION = """
CREATE TABLE IF NOT EXISTS tashrif_jadvali (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    hafta_kuni INTEGER NOT NULL,  -- 0=Du, 1=Se, ..., 6=Yak
    vaqt_dan TIME,
    vaqt_gacha TIME,
    faol BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, klient_id, hafta_kuni)
);
CREATE INDEX IF NOT EXISTS idx_tashrif_jadval ON tashrif_jadvali(user_id, hafta_kuni);
"""

KUNLAR = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]


class VisitSchedule(BaseModel):
    klient_id: int
    hafta_kunlari: list[int]  # [0, 2, 4] = Du, Chor, Juma


@calendar_router.get("/bugun")
async def bugungi_tashriflar(uid: int = Depends(get_uid)):
    """Bugungi tashrif ro'yxati — SD Agent visit schedule analog."""
    haftakun = date.today().weekday()
    async with get_conn(uid) as conn:
        rows = await conn.fetch("""
            SELECT tj.*, k.ism AS nom, k.telefon, k.manzil,
                COALESCE((SELECT SUM(qolgan) FROM qarzlar
                          WHERE klient_id = k.id AND NOT yopildi), 0) AS qarz,
                EXISTS(SELECT 1 FROM checkin_out
                       WHERE klient_id = k.id AND user_id = $1
                         AND turi = 'checkin'
                         AND vaqt::date = CURRENT_DATE) AS checkin_qilindi
            FROM tashrif_jadvali tj
            JOIN klientlar k ON k.id = tj.klient_id
            WHERE tj.user_id = $1 AND tj.hafta_kuni = $2 AND tj.faol = TRUE
            ORDER BY tj.vaqt_dan NULLS LAST, k.ism
        """, uid, haftakun)
        return {
            "sana": date.today().isoformat(),
            "hafta_kuni": KUNLAR[haftakun],
            "klientlar": [dict(r) for r in rows],
            "jami": len(rows),
            "checkin_qilindi": sum(1 for r in rows if r["checkin_qilindi"]),
        }


@calendar_router.get("/hafta")
async def haftalik_kalendar(uid: int = Depends(get_uid)):
    """Haftalik tashrif kalendari."""
    async with get_conn(uid) as conn:
        rows = await conn.fetch("""
            SELECT tj.hafta_kuni, COUNT(*) AS klient_soni,
                   array_agg(k.ism ORDER BY k.ism) AS klient_nomlari
            FROM tashrif_jadvali tj
            JOIN klientlar k ON k.id = tj.klient_id
            WHERE tj.user_id = $1 AND tj.faol = TRUE
            GROUP BY tj.hafta_kuni
            ORDER BY tj.hafta_kuni
        """, uid)
        hafta = {i: {"kun": KUNLAR[i], "klient_soni": 0, "klientlar": []} for i in range(7)}
        for r in rows:
            k = r["hafta_kuni"]
            hafta[k] = {
                "kun": KUNLAR[k],
                "klient_soni": r["klient_soni"],
                "klientlar": r["klient_nomlari"][:10],
            }
        return {"hafta": list(hafta.values())}


@calendar_router.post("/jadval")
async def jadval_qoyish(body: VisitSchedule, uid: int = Depends(get_uid)):
    """Klient uchun tashrif jadvali qo'yish."""
    async with get_conn(uid) as conn:
        # Eski jadvallarni o'chirish
        await conn.execute(
            "DELETE FROM tashrif_jadvali WHERE user_id=$1 AND klient_id=$2",
            uid, body.klient_id)
        # Yangilarini qo'shish
        for kun in body.hafta_kunlari:
            await conn.execute(
                "INSERT INTO tashrif_jadvali (user_id, klient_id, hafta_kuni) VALUES ($1, $2, $3)",
                uid, body.klient_id, kun)
        return {"muvaffaqiyat": True, "kunlar": len(body.hafta_kunlari)}


@calendar_router.post("/migrate")
async def cal_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(VISIT_MIGRATION)
        return {"muvaffaqiyat": True}


# ═══════════════════════════════════════════════════════
#  NOTIFICATION CENTER
# ═══════════════════════════════════════════════════════
notif_router = APIRouter(prefix="/bildirishnoma", tags=["bildirishnoma"])

NOTIF_MIGRATION = """
CREATE TABLE IF NOT EXISTS bildirishnomalar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    turi VARCHAR(30) NOT NULL,  -- sotuv, qarz, ombor, topshiriq, tizim
    sarlavha VARCHAR(300) NOT NULL,
    matn TEXT,
    oqildi BOOLEAN DEFAULT FALSE,
    muhimlik VARCHAR(10) DEFAULT 'oddiy',
    havolah VARCHAR(200),  -- /clients/5, /debts, ...
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON bildirishnomalar(user_id, oqildi, yaratilgan DESC);
"""


async def bildirishnoma_yuborish(conn, uid: int, turi: str, sarlavha: str,
                                   matn: str = "", muhimlik: str = "oddiy",
                                   havola: str = None) -> int:
    """Yangi bildirishnoma yaratish."""
    return await conn.fetchval("""
        INSERT INTO bildirishnomalar (user_id, turi, sarlavha, matn, muhimlik, havolah)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    """, uid, turi, sarlavha, matn, muhimlik, havola)


@notif_router.get("")
async def notif_list(faqat_oqilmagan: bool = False, limit: int = 50,
                      uid: int = Depends(get_uid)):
    """Bildirishnomalar ro'yxati."""
    async with get_conn(uid) as conn:
        query = "SELECT * FROM bildirishnomalar WHERE user_id=$1"
        if faqat_oqilmagan:
            query += " AND oqildi=FALSE"
        query += " ORDER BY yaratilgan DESC LIMIT $2"
        rows = await conn.fetch(query, uid, limit)
        oqilmagan = await conn.fetchval(
            "SELECT COUNT(*) FROM bildirishnomalar WHERE user_id=$1 AND oqildi=FALSE", uid)
        return {"bildirishnomalar": [dict(r) for r in rows], "oqilmagan_soni": oqilmagan}


@notif_router.put("/{nid}/oqish")
async def notif_read(nid: int, uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute("UPDATE bildirishnomalar SET oqildi=TRUE WHERE id=$1 AND user_id=$2", nid, uid)
        return {"muvaffaqiyat": True}


@notif_router.put("/barchasi-oqildi")
async def notif_read_all(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute("UPDATE bildirishnomalar SET oqildi=TRUE WHERE user_id=$1 AND oqildi=FALSE", uid)
        return {"muvaffaqiyat": True}


@notif_router.post("/migrate")
async def notif_migrate(uid: int = Depends(get_uid)):
    async with get_conn(uid) as conn:
        await conn.execute(NOTIF_MIGRATION)
        return {"muvaffaqiyat": True}

# Combined router for main.py import
from fastapi import APIRouter as _AR
router = _AR()
router.include_router(export_router)
router.include_router(calendar_router)
router.include_router(notif_router)
