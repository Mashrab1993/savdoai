"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — API XATO JAVOBLARI STANDARTI                     ║
║  Barcha xatolar bir xil formatda qaytadi                    ║
║  v25.3.2                                                    ║
╚══════════════════════════════════════════════════════════════╝

Xato formati:
{
    "error": true,
    "status": 400,
    "code": "VALIDATION_ERROR",
    "detail": "Tovar nomi bo'sh",
    "field": "nomi"       // ixtiyoriy
}
"""
from __future__ import annotations
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from typing import Optional


# ═══ XATO KODLARI ═══

class ErrorCode:
    # Auth
    TOKEN_KERAK       = "TOKEN_KERAK"
    TOKEN_YAROQSIZ    = "TOKEN_YAROQSIZ"
    OBUNA_TUGAGAN     = "OBUNA_TUGAGAN"
    LOGIN_XATO        = "LOGIN_XATO"
    PAROL_XATO        = "PAROL_XATO"

    # Validatsiya
    VALIDATSIYA_XATO  = "VALIDATSIYA_XATO"
    MAYDON_BOSH       = "MAYDON_BOSH"
    MAYDON_YAROQSIZ   = "MAYDON_YAROQSIZ"

    # Biznes logika
    TOPILMADI         = "TOPILMADI"
    CONFLICT          = "CONFLICT"
    KREDIT_LIMIT      = "KREDIT_LIMIT"
    QOLDIQ_YETARLI_EMAS = "QOLDIQ_YETARLI_EMAS"
    QARZ_TOPILMADI    = "QARZ_TOPILMADI"

    # Rate limit
    RATE_LIMIT        = "RATE_LIMIT"

    # Server
    ICHKI_XATO        = "ICHKI_XATO"
    SERVIS_MAVJUD_EMAS = "SERVIS_MAVJUD_EMAS"


def api_xato(status: int, code: str, detail: str,
             field: Optional[str] = None) -> JSONResponse:
    """Standart xato javobi"""
    body = {
        "error": True,
        "status": status,
        "code": code,
        "detail": detail,
    }
    if field:
        body["field"] = field
    return JSONResponse(status_code=status, content=body)


def topilmadi(nomi: str = "Ma'lumot") -> HTTPException:
    """404 — topilmadi"""
    return HTTPException(status_code=404, detail=f"{nomi} topilmadi")


def validatsiya_xato(detail: str, field: Optional[str] = None) -> HTTPException:
    """400 — validatsiya xatosi"""
    return HTTPException(status_code=400, detail=detail)


def ruxsat_yoq(detail: str = "Ruxsat berilmagan") -> HTTPException:
    """403"""
    return HTTPException(status_code=403, detail=detail)


def conflict(detail: str) -> HTTPException:
    """409 — ziddiyat"""
    return HTTPException(status_code=409, detail=detail)
