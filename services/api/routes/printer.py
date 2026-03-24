"""Printer API — signed session, ESC/POS bytes, ack with token."""
from __future__ import annotations

import re
from fastapi import APIRouter, HTTPException, Response

from shared.services.print_session import (
    _escpos_for_width,
    get,
    mark_done,
    mark_failed,
    mark_printing,
    verify_token,
)

router = APIRouter(prefix="/api/print", tags=["printer"])

_JOB_RE = re.compile(r"^[a-f0-9]{8,32}$")


def _jid_ok(job_id: str) -> bool:
    return bool(job_id and _JOB_RE.match(job_id))


@router.get("/escpos/{job_id}")
async def get_escpos(job_id: str, t: str = "", w: int = 80):
    if not _jid_ok(job_id):
        raise HTTPException(400, "Noto'g'ri chek identifikatori")
    s = get(job_id)
    if not s:
        raise HTTPException(404, "Topilmadi")
    if s.expired():
        raise HTTPException(410, "Muddati o'tgan. Yangi chek oling.")
    if not t or not verify_token(job_id, t):
        raise HTTPException(401, "Token noto'g'ri yoki eskirgan")
    if s.status == "done":
        raise HTTPException(409, "Bu chek allaqachon chop etilgan")
    payload = _escpos_for_width(s, w)
    if not payload:
        raise HTTPException(422, "Chek baytlari yo'q")
    mark_printing(job_id)
    return Response(
        content=payload,
        media_type="application/octet-stream",
        headers={"X-Job-Id": job_id, "X-Width": str(w if w <= 58 else 80)},
    )


@router.post("/done/{job_id}")
async def done(job_id: str, t: str = ""):
    if not _jid_ok(job_id):
        raise HTTPException(400, "Noto'g'ri chek identifikatori")
    s = get(job_id)
    if not s:
        raise HTTPException(404, "Topilmadi")
    if not t or not verify_token(job_id, t):
        raise HTTPException(401, "Token noto'g'ri")
    if s.status == "done":
        return {"ok": True, "already": True}
    if not mark_done(job_id):
        raise HTTPException(404, "Yangilab bo'lmadi")
    return {"ok": True}


@router.post("/failed/{job_id}")
async def failed(job_id: str, t: str = "", reason: str = ""):
    if not _jid_ok(job_id):
        raise HTTPException(400, "Noto'g'ri chek identifikatori")
    s = get(job_id)
    if not s:
        raise HTTPException(404, "Topilmadi")
    if not t or not verify_token(job_id, t):
        raise HTTPException(401, "Token noto'g'ri")
    if s.status == "done":
        raise HTTPException(409, "Chek allaqachon muvaffaqiyatli chop etilgan")
    if s.status == "failed":
        return {"ok": True, "already": True}
    if not mark_failed(job_id, reason):
        raise HTTPException(404, "Yangilab bo'lmadi")
    return {"ok": True}


@router.get("/session/{job_id}")
async def session_info(job_id: str, t: str = ""):
    if not _jid_ok(job_id):
        raise HTTPException(400, "Noto'g'ri chek identifikatori")
    s = get(job_id)
    if not s:
        raise HTTPException(404, "Topilmadi")
    if not t or not verify_token(job_id, t):
        raise HTTPException(401, "Token noto'g'ri")
    return s.to_json()
