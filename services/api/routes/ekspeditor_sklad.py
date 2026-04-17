"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — EKSPEDITOR + SKLAD + NAKLADNOY API               ║
║                                                                      ║
║  SalesDoc /settings/expeditors + /settings/warehouses + bulk         ║
║  nakladnoy generatsiya — Excel eksport bilan.                       ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import io
import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Ekspeditor/Sklad"])


# ═══════════════════════════════════════════════════════════════════
# EKSPEDITORLAR
# ═══════════════════════════════════════════════════════════════════

class EkspeditorIn(BaseModel):
    ism: str = Field(..., min_length=1, max_length=200)
    telefon: Optional[str] = None
    mashina_nomi: Optional[str] = None
    mashina_raqami: Optional[str] = None
    faol: bool = True


@router.get("/ekspeditorlar")
async def list_ekspeditorlar(
    faol: Optional[bool] = None,
    uid: int = Depends(get_uid),
):
    where = ["user_id = $1"]
    params: list = [uid]
    if faol is not None:
        params.append(faol)
        where.append(f"faol = ${len(params)}")

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT e.*,
                   (SELECT COUNT(*) FROM sotuv_sessiyalar
                    WHERE user_id=$1 AND ekspeditor_id = e.id) AS sotuv_soni
            FROM ekspeditorlar e
            WHERE {' AND '.join(where)}
            ORDER BY e.faol DESC, e.ism
        """, *params)
    return {
        "items": [
            {
                "id": r["id"], "ism": r["ism"], "telefon": r["telefon"],
                "mashina_nomi": r["mashina_nomi"], "mashina_raqami": r["mashina_raqami"],
                "faol": r["faol"], "sotuv_soni": int(r["sotuv_soni"] or 0),
                "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
            } for r in rows
        ],
        "jami": len(rows),
    }


@router.post("/ekspeditor")
async def create_ekspeditor(body: EkspeditorIn, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            INSERT INTO ekspeditorlar (user_id, ism, telefon, mashina_nomi, mashina_raqami, faol)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        """, uid, body.ism, body.telefon, body.mashina_nomi, body.mashina_raqami, body.faol)
    return dict(row) | {"yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None}


@router.put("/ekspeditor/{eid}")
async def update_ekspeditor(eid: int, body: EkspeditorIn, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            UPDATE ekspeditorlar
            SET ism=$1, telefon=$2, mashina_nomi=$3, mashina_raqami=$4, faol=$5
            WHERE id=$6 AND user_id=$7 RETURNING *
        """, body.ism, body.telefon, body.mashina_nomi, body.mashina_raqami, body.faol, eid, uid)
    if not row:
        raise HTTPException(404, "Ekspeditor topilmadi")
    return dict(row) | {"yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None}


@router.delete("/ekspeditor/{eid}")
async def delete_ekspeditor(eid: int, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        r = await c.fetchrow(
            "DELETE FROM ekspeditorlar WHERE id=$1 AND user_id=$2 RETURNING id, ism",
            eid, uid,
        )
    if not r:
        raise HTTPException(404, "Topilmadi")
    return {"ok": True, "deleted": dict(r)}


# ═══════════════════════════════════════════════════════════════════
# SKLADLAR
# ═══════════════════════════════════════════════════════════════════

class SkladIn(BaseModel):
    nomi: str = Field(..., min_length=1, max_length=200)
    turi: Optional[str] = Field(None, description="asosiy, brak, aksiya...")
    kod: Optional[str] = None
    faol: bool = True


@router.get("/skladlar")
async def list_skladlar(faol: Optional[bool] = None, uid: int = Depends(get_uid)):
    where = ["user_id = $1"]
    params: list = [uid]
    if faol is not None:
        params.append(faol)
        where.append(f"faol = ${len(params)}")
    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT s.*,
                   (SELECT COUNT(*) FROM sotuv_sessiyalar
                    WHERE user_id=$1 AND sklad_id = s.id) AS sotuv_soni
            FROM skladlar s
            WHERE {' AND '.join(where)}
            ORDER BY s.faol DESC, s.nomi
        """, *params)
    return {
        "items": [
            {
                "id": r["id"], "nomi": r["nomi"], "turi": r["turi"], "kod": r["kod"],
                "faol": r["faol"], "sotuv_soni": int(r["sotuv_soni"] or 0),
                "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
            } for r in rows
        ],
        "jami": len(rows),
    }


@router.post("/sklad")
async def create_sklad(body: SkladIn, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            INSERT INTO skladlar (user_id, nomi, turi, kod, faol)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        """, uid, body.nomi, body.turi, body.kod, body.faol)
    return dict(row) | {"yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None}


@router.put("/sklad/{sid}")
async def update_sklad(sid: int, body: SkladIn, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        row = await c.fetchrow("""
            UPDATE skladlar SET nomi=$1, turi=$2, kod=$3, faol=$4
            WHERE id=$5 AND user_id=$6 RETURNING *
        """, body.nomi, body.turi, body.kod, body.faol, sid, uid)
    if not row:
        raise HTTPException(404, "Sklad topilmadi")
    return dict(row) | {"yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None}


@router.delete("/sklad/{sid}")
async def delete_sklad(sid: int, uid: int = Depends(get_uid)):
    async with rls_conn(uid) as c:
        r = await c.fetchrow(
            "DELETE FROM skladlar WHERE id=$1 AND user_id=$2 RETURNING id, nomi",
            sid, uid,
        )
    if not r:
        raise HTTPException(404, "Topilmadi")
    return {"ok": True, "deleted": dict(r)}


# ═══════════════════════════════════════════════════════════════════
# NAKLADNOY REGISTR — bulk yaratish + Excel export
# ═══════════════════════════════════════════════════════════════════

class NakladnoyCreate(BaseModel):
    nomi: str = Field(..., min_length=1)
    sana: Optional[str] = None  # YYYY-MM-DD
    shogird_id: Optional[int] = None
    ekspeditor_id: Optional[int] = None
    sklad_id: Optional[int] = None
    sessiya_idlar: list[int] = Field(..., min_items=1)
    izoh: Optional[str] = None


@router.post("/nakladnoy_registr")
async def create_nakladnoy(body: NakladnoyCreate, uid: int = Depends(get_uid)):
    """Bulk tanlangan zayavkalar uchun nakladnoy registr yaratish.

    SalesDoc '[Nakladnaya]' bulk action — foydalanuvchi ☑️ bilan bir nechta
    zayavka tanlaydi va ularning hammasini bitta registrga yig'adi.
    """
    sana_obj = date.fromisoformat(body.sana) if body.sana else date.today()

    async with rls_conn(uid) as c:
        # Tanlangan sessiyalarning jamini hisoblash
        stats = await c.fetchrow("""
            SELECT COALESCE(SUM(jami), 0) AS jami_summa,
                   COALESCE(SUM(tolangan), 0) AS tolangan,
                   COUNT(*) AS soni
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND id = ANY($2::bigint[])
        """, uid, body.sessiya_idlar)

        if int(stats["soni"] or 0) == 0:
            raise HTTPException(400, "Tanlangan zayavka topilmadi")

        row = await c.fetchrow("""
            INSERT INTO nakladnoy_registrlari
                (user_id, nomi, sana, shogird_id, ekspeditor_id, sklad_id,
                 sessiya_idlar, jami_summa, tolangan, izoh)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        """, uid, body.nomi, sana_obj, body.shogird_id, body.ekspeditor_id,
             body.sklad_id, body.sessiya_idlar, float(stats["jami_summa"] or 0),
             float(stats["tolangan"] or 0), body.izoh)

    return dict(row) | {
        "sessiya_soni": int(stats["soni"] or 0),
        "yaratilgan": row["yaratilgan"].isoformat() if row["yaratilgan"] else None,
        "sana": row["sana"].isoformat() if row["sana"] else None,
    }


@router.get("/nakladnoy_registrlari")
async def list_nakladnoy(
    sana_dan: Optional[str] = None,
    sana_gacha: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    where = ["n.user_id = $1"]
    params: list = [uid]
    if sana_dan:
        params.append(date.fromisoformat(sana_dan))
        where.append(f"n.sana >= ${len(params)}")
    if sana_gacha:
        params.append(date.fromisoformat(sana_gacha))
        where.append(f"n.sana <= ${len(params)}")

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT n.*,
                   s.ism AS shogird_nomi,
                   e.ism AS ekspeditor_nomi,
                   sk.nomi AS sklad_nomi
            FROM nakladnoy_registrlari n
            LEFT JOIN shogirdlar s ON s.id = n.shogird_id
            LEFT JOIN ekspeditorlar e ON e.id = n.ekspeditor_id
            LEFT JOIN skladlar sk ON sk.id = n.sklad_id
            WHERE {' AND '.join(where)}
            ORDER BY n.sana DESC, n.id DESC
        """, *params)
    return {
        "items": [
            {
                "id": r["id"], "nomi": r["nomi"],
                "sana": r["sana"].isoformat() if r["sana"] else None,
                "shogird_id": r["shogird_id"], "shogird_nomi": r["shogird_nomi"],
                "ekspeditor_id": r["ekspeditor_id"], "ekspeditor_nomi": r["ekspeditor_nomi"],
                "sklad_id": r["sklad_id"], "sklad_nomi": r["sklad_nomi"],
                "sessiya_idlar": list(r["sessiya_idlar"] or []),
                "jami_summa": float(r["jami_summa"] or 0),
                "tolangan": float(r["tolangan"] or 0),
                "izoh": r["izoh"],
                "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
            } for r in rows
        ],
    }


@router.get("/nakladnoy_registr/{rid}/excel")
async def export_nakladnoy_excel(rid: int, uid: int = Depends(get_uid)):
    """Nakladnoy registrni Excel formatda yuklab olish."""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Font, PatternFill
    except ImportError:
        raise HTTPException(500, "openpyxl yo'q")

    async with rls_conn(uid) as c:
        reg = await c.fetchrow("""
            SELECT n.*, s.ism AS shogird_nomi, e.ism AS ekspeditor_nomi,
                   sk.nomi AS sklad_nomi
            FROM nakladnoy_registrlari n
            LEFT JOIN shogirdlar s ON s.id = n.shogird_id
            LEFT JOIN ekspeditorlar e ON e.id = n.ekspeditor_id
            LEFT JOIN skladlar sk ON sk.id = n.sklad_id
            WHERE n.id=$1 AND n.user_id=$2
        """, rid, uid)
        if not reg:
            raise HTTPException(404, "Registr topilmadi")

        sessions = await c.fetch("""
            SELECT ss.id, ss.document_number, ss.tip_zayavki, ss.holat,
                   ss.sana, ss.jami, ss.tolangan,
                   COALESCE(ss.jami - ss.tolangan, 0) AS qarz,
                   k.ismi AS klient_ismi, k.telefon AS klient_tel
            FROM sotuv_sessiyalar ss
            LEFT JOIN klientlar k ON k.id = ss.klient_id
            WHERE ss.id = ANY($1::bigint[]) AND ss.user_id = $2
            ORDER BY ss.sana DESC
        """, list(reg["sessiya_idlar"] or []), uid)

    wb = Workbook()
    ws = wb.active
    ws.title = "Nakladnoy"

    # Header
    ws.cell(row=1, column=1, value=f"Nakladnoy registr: {reg['nomi']}").font = Font(bold=True, size=14)
    ws.cell(row=2, column=1, value=f"Sana: {reg['sana']}")
    ws.cell(row=3, column=1, value=f"Agent: {reg['shogird_nomi'] or '—'}")
    ws.cell(row=4, column=1, value=f"Ekspeditor: {reg['ekspeditor_nomi'] or '—'}")
    ws.cell(row=5, column=1, value=f"Sklad: {reg['sklad_nomi'] or '—'}")

    # Table header
    headers = ["#", "Hujjat №", "Tip", "Holat", "Sana", "Klient", "Telefon",
               "Jami summa", "To'langan", "Qarz"]
    HF = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    HFont = Font(bold=True, color="FFFFFF")
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=7, column=col, value=h)
        cell.font = HFont
        cell.fill = HF
        cell.alignment = Alignment(horizontal="center")

    for i, s in enumerate(sessions, 8):
        ws.cell(row=i, column=1, value=i - 7)
        ws.cell(row=i, column=2, value=s["document_number"] or f"#{s['id']}")
        ws.cell(row=i, column=3, value=s["tip_zayavki"])
        ws.cell(row=i, column=4, value=s["holat"])
        ws.cell(row=i, column=5, value=str(s["sana"]))
        ws.cell(row=i, column=6, value=s["klient_ismi"] or "—")
        ws.cell(row=i, column=7, value=s["klient_tel"] or "")
        ws.cell(row=i, column=8, value=float(s["jami"] or 0))
        ws.cell(row=i, column=9, value=float(s["tolangan"] or 0))
        ws.cell(row=i, column=10, value=float(s["qarz"] or 0))

    # TOTAL row
    total_row = 8 + len(sessions)
    ws.cell(row=total_row, column=1, value="JAMI:").font = Font(bold=True)
    ws.cell(row=total_row, column=8, value=float(reg["jami_summa"] or 0)).font = Font(bold=True)
    ws.cell(row=total_row, column=9, value=float(reg["tolangan"] or 0)).font = Font(bold=True)
    ws.cell(
        row=total_row, column=10,
        value=float(reg["jami_summa"] or 0) - float(reg["tolangan"] or 0),
    ).font = Font(bold=True)

    for col in range(1, 11):
        max_len = max(
            (len(str(ws.cell(row=r, column=col).value or "")) for r in range(1, ws.max_row + 1)),
            default=10,
        )
        ws.column_dimensions[ws.cell(row=1, column=col).column_letter].width = min(max_len + 2, 40)
    ws.freeze_panes = "A8"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    fname = f"nakladnoy_{reg['nomi'].replace(' ', '_')}_{reg['sana']}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
