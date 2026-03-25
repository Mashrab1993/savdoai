"""Printer API — signed session, ESC/POS bytes, ack with token."""
from __future__ import annotations

import json
import logging
import re
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request, Response

from shared.observability.process_uptime import uptime_s
from shared.services.print_session import (
    _escpos_for_width,
    get,
    get_secret_source,
    mark_done,
    mark_failed,
    mark_printing,
    verify_token,
)

router = APIRouter(prefix="/api/print", tags=["printer"])
plog = logging.getLogger("print_escpos")

_JOB_RE = re.compile(r"^[a-f0-9]{8,32}$")

# ═══ RATE LIMITER — IP bo'yicha 30 req/daqiqa ═══
_rate: dict[str, list[float]] = defaultdict(list)
_RATE_WINDOW = 60.0  # 1 daqiqa
_RATE_MAX = 30       # maksimal so'rovlar


def _rate_check(ip: str) -> bool:
    """IP bo'yicha rate limit tekshirish. False = limit oshdi."""
    now = time.time()
    hits = _rate[ip]
    # Eski yozuvlarni tozalash
    _rate[ip] = [t for t in hits if now - t < _RATE_WINDOW]
    if len(_rate[ip]) >= _RATE_MAX:
        return False
    _rate[ip].append(now)
    # Xotira himoyasi: 10000 dan ortiq IP saqlama
    if len(_rate) > 10000:
        oldest_ips = sorted(_rate.keys(), key=lambda k: _rate[k][-1] if _rate[k] else 0)[:5000]
        for k in oldest_ips:
            _rate.pop(k, None)
    return True


def _jid_ok(job_id: str) -> bool:
    return bool(job_id and _JOB_RE.match(job_id))


def _token_present(t: str) -> bool:
    return bool(t and t.strip())


def _emit_escpos_e2e(trace: dict, t0: float, status_code: int) -> None:
    trace["duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    trace["response_status"] = status_code
    plog.info("print_escpos_e2e %s", json.dumps(trace, ensure_ascii=False, default=str))


@router.get("/escpos/{job_id}")
async def get_escpos(request: Request, job_id: str, t: str = "", w: int = 80):
    # Rate limit — IP bo'yicha
    client_ip = request.client.host if request.client else "unknown"
    if not _rate_check(client_ip):
        raise HTTPException(status_code=429, detail="Ko'p so'rov. 1 daqiqa kuting.")

    rid = getattr(request.state, "request_id", None) or "unknown"
    t0 = time.perf_counter()
    tp = _token_present(t)
    trace: dict = {
        "trace": "print_escpos_e2e",
        "request_id": rid,
        "job_id": job_id,
        "width": w,
        "token_present": tp,
        "secret_source": get_secret_source(),
        "verify_result": None,
        "session_lookup_ms": None,
        "session_found": None,
        "escpos_bytes_length": None,
        "process_uptime_s": uptime_s(),
    }
    try:
        if not _jid_ok(job_id):
            trace["verify_result"] = "skipped_invalid_job_id"
            _emit_escpos_e2e(trace, t0, 400)
            raise HTTPException(400, "Noto'g'ri chek identifikatori")

        plog.info(
            "print_escpos_trace phase=session_lookup_start request_id=%s job_id=%s width=%s",
            rid,
            job_id,
            w,
        )
        t_lu = time.perf_counter()
        s = get(job_id)
        trace["session_lookup_ms"] = round((time.perf_counter() - t_lu) * 1000, 2)
        trace["session_found"] = s is not None
        plog.info(
            "print_escpos_trace phase=session_lookup_end request_id=%s job_id=%s session_found=%s lookup_ms=%s",
            rid,
            job_id,
            trace["session_found"],
            trace["session_lookup_ms"],
        )

        if not s:
            trace["verify_result"] = "skipped_no_session"
            _emit_escpos_e2e(trace, t0, 404)
            raise HTTPException(status_code=404, detail="Topilmadi")
        if s.expired():
            trace["verify_result"] = "skipped_expired"
            _emit_escpos_e2e(trace, t0, 410)
            raise HTTPException(status_code=410, detail="Muddati o'tgan. Yangi chek oling.")
        if not tp:
            trace["verify_result"] = "missing_token"
            _emit_escpos_e2e(trace, t0, 401)
            raise HTTPException(
                status_code=401,
                detail="Token noto'g'ri yoki eskirgan",
            )
        verify_ok = verify_token(job_id, t)
        trace["verify_result"] = "ok" if verify_ok else "invalid_signature"
        if not verify_ok:
            _emit_escpos_e2e(trace, t0, 401)
            raise HTTPException(
                status_code=401,
                detail="Token noto'g'ri yoki eskirgan",
            )
        if s.status == "done":
            trace["verify_result"] = "ok_session_already_done"
            _emit_escpos_e2e(trace, t0, 409)
            raise HTTPException(status_code=409, detail="Bu chek allaqachon chop etilgan")
        payload = _escpos_for_width(s, w)
        trace["escpos_bytes_length"] = len(payload) if payload else 0
        if not payload:
            trace["verify_result"] = "ok_empty_payload"
            _emit_escpos_e2e(trace, t0, 422)
            raise HTTPException(status_code=422, detail="Chek baytlari yo'q")
        mark_printing(job_id)
        trace["verify_result"] = "ok_delivering_escpos"
        dur_ms = round((time.perf_counter() - t0) * 1000, 2)
        trace["duration_ms"] = dur_ms
        trace["response_status"] = 200
        plog.info("print_escpos_e2e %s", json.dumps(trace, ensure_ascii=False, default=str))
        return Response(
            content=payload,
            media_type="application/octet-stream",
            headers={
                "X-Job-Id": job_id,
                "X-Width": str(w if w <= 58 else 80),
                "X-Print-Duration-Ms": str(dur_ms),
                "X-Process-Uptime-S": str(round(uptime_s(), 3)),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        trace["verify_result"] = trace.get("verify_result") or "exception"
        trace["error_type"] = type(e).__name__
        trace["error_message"] = str(e)[:500]
        plog.exception(
            "print_escpos_e2e request_id=%s job_id=%s unexpected traceback follows",
            rid,
            job_id,
        )
        _emit_escpos_e2e(trace, t0, 500)
        raise HTTPException(status_code=500, detail="Ichki xato") from e


@router.post("/done/{job_id}")
async def done(job_id: str, t: str = ""):
    tp = _token_present(t)
    try:
        if not _jid_ok(job_id):
            plog.info(
                "print_done job_id=%s token_present=%s secret_source=%s result=invalid_id",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(400, "Noto'g'ri chek identifikatori")
        s = get(job_id)
        if not s:
            plog.info(
                "print_done job_id=%s token_present=%s secret_source=%s session=missing",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=404, detail="Topilmadi")
        if not tp or not verify_token(job_id, t):
            plog.warning(
                "print_done job_id=%s token_present=%s secret_source=%s verify=failed",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=401, detail="Token noto'g'ri")
        if s.status == "done":
            return {"ok": True, "already": True}
        if not mark_done(job_id):
            raise HTTPException(status_code=404, detail="Yangilab bo'lmadi")
        plog.info(
            "print_done job_id=%s secret_source=%s result=ok",
            job_id,
            get_secret_source(),
        )
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        plog.exception(
            "print_done job_id=%s token_present=%s secret_source=%s unexpected",
            job_id,
            tp,
            get_secret_source(),
        )
        raise HTTPException(status_code=500, detail="Ichki xato") from e


@router.post("/failed/{job_id}")
async def failed(job_id: str, t: str = "", reason: str = ""):
    tp = _token_present(t)
    try:
        if not _jid_ok(job_id):
            raise HTTPException(400, "Noto'g'ri chek identifikatori")
        s = get(job_id)
        if not s:
            plog.info(
                "print_failed job_id=%s token_present=%s secret_source=%s session=missing",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=404, detail="Topilmadi")
        if not tp or not verify_token(job_id, t):
            plog.warning(
                "print_failed job_id=%s token_present=%s secret_source=%s verify=failed",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=401, detail="Token noto'g'ri")
        if s.status == "done":
            raise HTTPException(status_code=409, detail="Chek allaqachon muvaffaqiyatli chop etilgan")
        if s.status == "failed":
            return {"ok": True, "already": True}
        if not mark_failed(job_id, reason):
            raise HTTPException(status_code=404, detail="Yangilab bo'lmadi")
        plog.info(
            "print_failed job_id=%s secret_source=%s result=ok reason=%s",
            job_id,
            get_secret_source(),
            (reason or "")[:120],
        )
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        plog.exception(
            "print_failed job_id=%s token_present=%s secret_source=%s unexpected",
            job_id,
            tp,
            get_secret_source(),
        )
        raise HTTPException(status_code=500, detail="Ichki xato") from e


@router.get("/session/{job_id}")
async def session_info(job_id: str, t: str = ""):
    tp = _token_present(t)
    try:
        if not _jid_ok(job_id):
            raise HTTPException(400, "Noto'g'ri chek identifikatori")
        s = get(job_id)
        if not s:
            plog.info(
                "print_session_info job_id=%s token_present=%s secret_source=%s session=missing",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=404, detail="Topilmadi")
        if not tp or not verify_token(job_id, t):
            plog.warning(
                "print_session_info job_id=%s token_present=%s secret_source=%s verify=failed",
                job_id,
                tp,
                get_secret_source(),
            )
            raise HTTPException(status_code=401, detail="Token noto'g'ri")
        return s.to_json()
    except HTTPException:
        raise
    except Exception as e:
        plog.exception(
            "print_session_info job_id=%s token_present=%s secret_source=%s unexpected",
            job_id,
            tp,
            get_secret_source(),
        )
        raise HTTPException(status_code=500, detail="Ichki xato") from e
