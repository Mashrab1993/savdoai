"""
SAVDOAI — Photo Access Guard (cross-tenant isolation)
2026-05-23

Asosiy muammo:
- Photo URL'lar guessable (sequential ID'lar)
- Static file serving tenant'ni tekshirmaydi
- Cross-tenant URL leak xavfi

Yechim:
- /api/v1/foto/{photo_id} — autentifikatsiyalangan endpoint
- Active company tekshiriladi
- URL guess qilib kirish — 403

Bu modul:
- GET /api/v1/foto/{photo_id} — bitta rasm (access control bilan)
- POST /api/v1/foto/upload — rasm yuklash (active company path'iga saqlanadi)
- Background: foto_url normalization (eski → yangi format)
"""
from __future__ import annotations
import logging
import os
import secrets
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Depends
from fastapi.responses import FileResponse, StreamingResponse

from services.api.deps import get_uid

log = logging.getLogger(__name__)

photo_router = APIRouter()

# Storage konfiguratsiya
UPLOAD_BASE = Path(os.getenv("UPLOAD_DIR", "/root/savdoai/uploads"))
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _safe_path(company_kod: str, turi: str, fayl_nomi: str) -> Path:
    """
    Path traversal himoyasi — fayl yo'li xavfsiz tekshiriladi.

    Returns: /uploads/{company_kod}/{turi}/{fayl_nomi}

    Faqat lotin harf+raqam+tire ruxsat etiladi.
    """
    # Sanitize all components
    safe_kod = "".join(c for c in company_kod if c.isalnum() or c in "-_").lower()[:30]
    safe_turi = "".join(c for c in turi if c.isalnum() or c in "-_")[:20]
    safe_nomi = "".join(c for c in fayl_nomi if c.isalnum() or c in "._-")[:100]

    if not safe_kod or not safe_turi or not safe_nomi:
        raise HTTPException(400, "Noto'g'ri fayl yo'li")

    # Build path and verify it's within UPLOAD_BASE
    candidate = UPLOAD_BASE / safe_kod / safe_turi / safe_nomi
    try:
        candidate.resolve().relative_to(UPLOAD_BASE.resolve())
    except (ValueError, OSError):
        raise HTTPException(400, "Yo'l xavfsiz emas")

    return candidate


@photo_router.post("/api/v1/foto/upload", tags=["Foto"])
async def upload_foto(
    request: Request,
    file: UploadFile = File(...),
    turi: str = "tovar",
    bog_id: int | None = None,
    izoh: str = "",
    uid: int = Depends(get_uid),
):
    """
    Rasm yuklash — active company path'iga saqlanadi.

    Path: /uploads/{company_kod}/{turi}/{random}.{ext}
    DB: fotolar table'ga yozish (user_id = active_company_id)

    Turi: tovar/klient/uskuna/checkin/vizit/boshqa
    """
    from services.api.main import get_pool
    from services.api.deps import get_active_context
    ctx = await get_active_context(uid, request)
    company_id = ctx["company_id"]
    company_kod = ctx["company_kod"] or f"firma-{company_id}"

    # Fayl tekshirish
    if not file.filename:
        raise HTTPException(400, "Fayl nomi yo'q")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Fayl turi qabul qilinmaydi: {ext}. Faqat: {', '.join(ALLOWED_EXT)}")

    # Random fayl nomi (guess'lab kirish oldini olish)
    random_name = secrets.token_urlsafe(16) + ext
    target_path = _safe_path(company_kod, turi, random_name)

    # Directory yaratish
    target_path.parent.mkdir(parents=True, exist_ok=True)

    # Fayl yozish (size limit bilan)
    written = 0
    with open(target_path, "wb") as f:
        while True:
            chunk = await file.read(64 * 1024)  # 64 KB chunks
            if not chunk:
                break
            written += len(chunk)
            if written > MAX_FILE_SIZE:
                f.close()
                target_path.unlink(missing_ok=True)
                raise HTTPException(413, f"Fayl juda katta. Maksimal: {MAX_FILE_SIZE // 1024 // 1024} MB")
            f.write(chunk)

    # Relative path (URL'da ishlatish uchun)
    rel_path = f"{company_kod}/{turi}/{random_name}"
    foto_url = f"/api/v1/foto/{company_kod}/{turi}/{random_name}"

    # DB'ga yozish (fotolar table'ga, agar tenant_id'li bo'lsa)
    pool = get_pool()
    async with pool.acquire() as c:
        foto_id = await c.fetchval(
            """
            INSERT INTO fotolar
                (user_id, turi, bog_id, fayl_nomi, fayl_url, fayl_hajmi, izoh)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
            """,
            company_id, turi, bog_id, random_name, foto_url, written, izoh,
        )

    log.info(
        "📸 Foto yuklandi: id=%d company=%d turi=%s nomi=%s hajm=%d",
        foto_id, company_id, turi, random_name, written,
    )

    return {
        "id": foto_id,
        "url": foto_url,
        "company_kod": company_kod,
        "turi": turi,
        "bog_id": bog_id,
        "hajm": written,
    }


@photo_router.get("/api/v1/foto/{company_kod}/{turi}/{fayl_nomi}", tags=["Foto"])
async def get_foto(
    company_kod: str,
    turi: str,
    fayl_nomi: str,
    uid: int = Depends(get_uid),
):
    """
    Rasm o'qish — access control bilan.

    Tekshiruv:
    1. URL'dagi company_kod mavjud bo'lishi
    2. User shu firma'ga ulanganligi (agent_memberships)
    3. Fayl mavjud bo'lishi
    4. Path traversal xavfsizligi
    """
    from services.api.main import get_pool

    pool = get_pool()
    async with pool.acquire() as c:
        # Company kod'dan owner_id topish
        owner = await c.fetchval(
            "SELECT id FROM users WHERE lower(company_kod) = lower($1) AND parent_id IS NULL LIMIT 1",
            company_kod,
        )
        if not owner:
            raise HTTPException(404, "Firma topilmadi")

        # User shu firma'ga ulanganmi
        access = await c.fetchval(
            """
            SELECT 1 FROM agent_memberships
            WHERE agent_id = $1 AND company_id = $2 AND faol = TRUE
            LIMIT 1
            """,
            uid, owner,
        )
        if not access:
            log.warning("Cross-tenant photo access attempt: uid=%d company_kod=%s", uid, company_kod)
            raise HTTPException(403, "Bu rasm boshqa firma'ga tegishli")

    # Fayl tekshirish (path traversal himoyasi)
    target = _safe_path(company_kod, turi, fayl_nomi)
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Rasm topilmadi")

    return FileResponse(
        target,
        headers={
            "Cache-Control": "private, max-age=3600",  # 1 soat client cache
            "X-Tenant": company_kod,
        },
    )


@photo_router.delete("/api/v1/foto/{foto_id}", tags=["Foto"])
async def delete_foto(
    foto_id: int,
    request: Request,
    uid: int = Depends(get_uid),
):
    """Rasm o'chirish — owner/admin only."""
    from services.api.main import get_pool
    from services.api.deps import get_active_context
    ctx = await get_active_context(uid, request)

    if ctx["role"] not in ("owner", "admin"):
        raise HTTPException(403, "Faqat owner/admin rasm o'chira oladi")

    pool = get_pool()
    async with pool.acquire() as c:
        foto = await c.fetchrow(
            "SELECT id, user_id, fayl_url FROM fotolar WHERE id = $1",
            foto_id,
        )
        if not foto:
            raise HTTPException(404, "Rasm topilmadi")

        if foto["user_id"] != ctx["company_id"]:
            raise HTTPException(403, "Bu rasm boshqa firma'niki")

        await c.execute("DELETE FROM fotolar WHERE id = $1", foto_id)

    # Fayl tizimidan ham o'chirish (best-effort)
    try:
        url = foto["fayl_url"] or ""
        if url.startswith("/api/v1/foto/"):
            parts = url[len("/api/v1/foto/"):].split("/")
            if len(parts) == 3:
                target = _safe_path(*parts)
                target.unlink(missing_ok=True)
    except Exception as e:
        log.warning("Fayl o'chirib bo'lmadi (DB o'chirildi): %s", e)

    return {"message": "O'chirildi", "id": foto_id}


@photo_router.get("/api/v1/foto-list", tags=["Foto"])
async def list_fotolar(
    request: Request,
    turi: str | None = None,
    bog_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
    uid: int = Depends(get_uid),
):
    """Active company rasmlari ro'yxati."""
    from services.api.main import get_pool
    from services.api.deps import get_active_context
    ctx = await get_active_context(uid, request)
    company_id = ctx["company_id"]

    limit = min(max(1, limit), 200)
    offset = max(0, offset)

    where = ["user_id = $1"]
    params: list = [company_id]
    i = 2

    if turi:
        where.append(f"turi = ${i}")
        params.append(turi)
        i += 1
    if bog_id:
        where.append(f"bog_id = ${i}")
        params.append(bog_id)
        i += 1

    params.extend([limit, offset])

    pool = get_pool()
    async with pool.acquire() as c:
        rows = await c.fetch(
            f"""
            SELECT id, turi, bog_id, fayl_nomi, fayl_url, fayl_hajmi, izoh, yaratilgan
            FROM fotolar
            WHERE {' AND '.join(where)}
            ORDER BY yaratilgan DESC
            LIMIT ${i} OFFSET ${i+1}
            """,
            *params,
        )

    return [
        {
            "id": r["id"],
            "turi": r["turi"],
            "bog_id": r["bog_id"],
            "url": r["fayl_url"],
            "hajm": r["fayl_hajmi"],
            "izoh": r["izoh"],
            "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
        }
        for r in rows
    ]
