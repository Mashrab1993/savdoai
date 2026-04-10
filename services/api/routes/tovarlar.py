"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — TOVARLAR CRUD ROUTELARI                          ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import base64
import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from shared.database.pool import rls_conn, get_pool
from shared.utils import like_escape
from services.api.deps import get_uid, endpoint_rate_check

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Tovarlar"])


# ═══ PYDANTIC MODELS ═══

class TovarYaratSorov(BaseModel):
    nomi:             str   = Field(..., min_length=1, max_length=200)
    kategoriya:       str   = Field("Boshqa")
    birlik:           str   = Field("dona")
    olish_narxi:      float = Field(0, ge=0)
    sotish_narxi:     float = Field(0, ge=0)
    min_sotish_narxi: float = Field(0, ge=0)
    qoldiq:           float = Field(0, ge=0)
    min_qoldiq:       float = Field(0, ge=0)
    # SalesDoc-compatible maydonlar
    brend:            Optional[str]   = None
    podkategoriya:    Optional[str]   = None
    guruh:            Optional[str]   = None
    ishlab_chiqaruvchi: Optional[str] = None
    segment:          Optional[str]   = None
    shtrix_kod:       Optional[str]   = None
    artikul:          Optional[str]   = None
    sap_kod:          Optional[str]   = None
    kod:              Optional[str]   = None
    ikpu_kod:         Optional[str]   = None
    gtin:             Optional[str]   = None
    hajm:             Optional[float] = None
    ogirlik:          Optional[float] = None
    blokda_soni:      Optional[int]   = None
    korobkada_soni:   Optional[int]   = None
    saralash:         Optional[int]   = None
    yaroqlilik_muddati: Optional[int] = None
    tavsif:           Optional[str]   = None
    savdo_yonalishi:  Optional[str]   = None


class TovarYangilaSorov(BaseModel):
    nomi:             Optional[str]   = None
    kategoriya:       Optional[str]   = None
    birlik:           Optional[str]   = None
    olish_narxi:      Optional[float] = None
    sotish_narxi:     Optional[float] = None
    min_sotish_narxi: Optional[float] = None
    qoldiq:           Optional[float] = None
    min_qoldiq:       Optional[float] = None
    # SalesDoc-compatible maydonlar
    brend:            Optional[str]   = None
    podkategoriya:    Optional[str]   = None
    guruh:            Optional[str]   = None
    ishlab_chiqaruvchi: Optional[str] = None
    segment:          Optional[str]   = None
    shtrix_kod:       Optional[str]   = None
    artikul:          Optional[str]   = None
    sap_kod:          Optional[str]   = None
    kod:              Optional[str]   = None
    ikpu_kod:         Optional[str]   = None
    gtin:             Optional[str]   = None
    hajm:             Optional[float] = None
    ogirlik:          Optional[float] = None
    blokda_soni:      Optional[int]   = None
    korobkada_soni:   Optional[int]   = None
    saralash:         Optional[int]   = None
    yaroqlilik_muddati: Optional[int] = None
    tavsif:           Optional[str]   = None
    savdo_yonalishi:  Optional[str]   = None


class QoldiqYangilaSorov(BaseModel):
    qoldiq: float = Field(..., ge=0)


class TovarImportItem(BaseModel):
    nomi:         str
    kategoriya:   str   = "Boshqa"
    birlik:       str   = "dona"
    olish_narxi:  float = 0
    sotish_narxi: float = 0
    qoldiq:       float = 0


class TovarImportSorov(BaseModel):
    tovarlar: List[TovarImportItem]


# ═══ ENDPOINTS ═══

@router.get("/tovarlar")
async def tovarlar(
    limit: int = 20, offset: int = 0,
    kategoriya: Optional[str] = None,
    uid: int = Depends(get_uid)
):
    """Tovarlar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if kategoriya:
            rows = await c.fetch("""
                SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi,
                       min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan,
                       brend, podkategoriya, shtrix_kod, artikul, kod, ikpu_kod,
                       hajm, ogirlik, blokda_soni, korobkada_soni, faol, tavsif
                FROM tovarlar WHERE kategoriya=$3
                ORDER BY nomi LIMIT $1 OFFSET $2
            """, limit, offset, kategoriya)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM tovarlar WHERE user_id=$2 AND kategoriya=$1",
                kategoriya, uid
            )
        else:
            rows = await c.fetch("""
                SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi,
                       min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan,
                       brend, podkategoriya, shtrix_kod, artikul, kod, ikpu_kod,
                       hajm, ogirlik, blokda_soni, korobkada_soni, faol, tavsif
                FROM tovarlar ORDER BY kategoriya,nomi LIMIT $1 OFFSET $2
            """, limit, offset)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid
            )
    return {"total": total, "items": [dict(r) for r in rows]}


@router.get("/tovar/{tovar_id}")
async def tovar_bir(tovar_id: int, uid: int = Depends(get_uid)):
    """Bitta tovar to'liq ma'lumoti"""
    async with rls_conn(uid) as c:
        t = await c.fetchrow("""
            SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi,
                   min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan,
                   brend, podkategoriya, guruh, ishlab_chiqaruvchi, segment,
                   shtrix_kod, artikul, sap_kod, kod, ikpu_kod, ikpu_paket_kod,
                   ikpu_birlik_kod, gtin, hajm, ogirlik, blokda_soni, korobkada_soni,
                   saralash, yaroqlilik_muddati, tavsif, rasm_url, faol,
                   savdo_yonalishi, yangilangan
            FROM tovarlar WHERE id=$1
        """, tovar_id)
        if not t:
            raise HTTPException(404, "Tovar topilmadi")
        return dict(t)


@router.post("/tovar")
async def tovar_yarat(data: TovarYaratSorov, uid: int = Depends(get_uid)):
    """Yangi tovar yaratish"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        tovar = await c.fetchrow("""
            INSERT INTO tovarlar
                (user_id, nomi, kategoriya, birlik,
                 olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                kategoriya       = EXCLUDED.kategoriya,
                birlik           = EXCLUDED.birlik,
                olish_narxi      = EXCLUDED.olish_narxi,
                sotish_narxi     = EXCLUDED.sotish_narxi,
                min_sotish_narxi = EXCLUDED.min_sotish_narxi
            RETURNING id, nomi
        """, uid, data.nomi.strip(), data.kategoriya, data.birlik,
            data.olish_narxi, data.sotish_narxi, data.min_sotish_narxi,
            data.qoldiq, data.min_qoldiq)
    await user_cache_tozala(uid)
    log.info("📦 Tovar yaratildi: %s (uid=%d)", data.nomi, uid)
    return {"id": tovar["id"], "nomi": tovar["nomi"], "status": "yaratildi"}


@router.put("/tovar/{tovar_id}")
async def tovar_yangilash(tovar_id: int, data: TovarYangilaSorov,
                          uid: int = Depends(get_uid)):
    """Tovar ma'lumotlarini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    _RUXSAT = {"nomi", "kategoriya", "birlik", "olish_narxi", "sotish_narxi",
               "min_sotish_narxi", "qoldiq", "min_qoldiq"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE tovarlar SET {set_q} WHERE id=$1 AND user_id=$2",
            tovar_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Tovar topilmadi")
    await user_cache_tozala(uid)
    return {"id": tovar_id, "status": "yangilandi"}


@router.delete("/tovar/{tovar_id}")
async def tovar_ochirish(tovar_id: int, uid: int = Depends(get_uid)):
    """Tovarni o'chirish (agar sotuvda ishlatilmagan bo'lsa)"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        sotuv_bor = await c.fetchval(
            "SELECT EXISTS(SELECT 1 FROM chiqimlar WHERE tovar_id=$1)", tovar_id
        )
        if sotuv_bor:
            raise HTTPException(
                409, "Bu tovar sotuvlarda ishlatilgan — o'chirib bo'lmaydi. "
                     "Qoldiqni 0 ga o'zgartiring."
            )
        result = await c.execute(
            "DELETE FROM tovarlar WHERE id=$1 AND user_id=$2", tovar_id, uid
        )
    if "DELETE 0" in result:
        raise HTTPException(404, "Tovar topilmadi")
    await user_cache_tozala(uid)
    return {"id": tovar_id, "status": "ochirildi"}


@router.post("/tovar/{tovar_id}/qoldiq")
async def tovar_qoldiq_yangilash(tovar_id: int, data: QoldiqYangilaSorov,
                                  uid: int = Depends(get_uid)):
    """Inventarizatsiya — tovar qoldiqini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT nomi, qoldiq FROM tovarlar WHERE id=$1 AND user_id=$2 FOR UPDATE",
            tovar_id, uid
        )
        if not old:
            raise HTTPException(404, "Tovar topilmadi")
        await c.execute(
            "UPDATE tovarlar SET qoldiq=$2 WHERE id=$1 AND user_id=$3",
            tovar_id, data.qoldiq, uid
        )
    await user_cache_tozala(uid)
    return {
        "id": tovar_id, "nomi": old["nomi"],
        "eski_qoldiq": float(old["qoldiq"]),
        "yangi_qoldiq": data.qoldiq, "status": "yangilandi",
    }


@router.get("/tovar/{tovar_id}/tarix")
async def tovar_tarix(tovar_id: int, limit: int = 20, uid: int = Depends(get_uid)):
    """Tovarning sotuv va kirim tarixi"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        tovar = await c.fetchrow("""
            SELECT nomi, kategoriya, birlik, olish_narxi, sotish_narxi, qoldiq
            FROM tovarlar WHERE id=$1 AND user_id=$2
        """, tovar_id, uid)
        if not tovar:
            raise HTTPException(404, "Tovar topilmadi")
        sotuvlar = await c.fetch("""
            SELECT ch.miqdor, ch.sotish_narxi, ch.jami, ch.sana, ss.klient_ismi
            FROM chiqimlar ch
            LEFT JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.tovar_id=$1 AND ch.user_id=$2
            ORDER BY ch.sana DESC LIMIT $3
        """, tovar_id, uid, limit)
        kirimlar = await c.fetch("""
            SELECT miqdor, narx, jami, manba, sana
            FROM kirimlar WHERE tovar_id=$1 AND user_id=$2
            ORDER BY sana DESC LIMIT $3
        """, tovar_id, uid, limit)
        stats = await c.fetchrow("""
            SELECT COUNT(*) AS sotuv_soni,
                   COALESCE(SUM(miqdor), 0) AS jami_sotilgan,
                   COALESCE(SUM(jami), 0) AS jami_tushum
            FROM chiqimlar WHERE tovar_id=$1 AND user_id=$2
        """, tovar_id, uid)
    return {
        "tovar": dict(tovar),
        "sotuvlar": [dict(r) for r in sotuvlar],
        "kirimlar": [dict(r) for r in kirimlar],
        "statistika": {
            "sotuv_soni": int(stats["sotuv_soni"]),
            "jami_sotilgan": float(stats["jami_sotilgan"]),
            "jami_tushum": float(stats["jami_tushum"]),
        },
    }


@router.get("/tovar/export/excel")
async def tovar_excel_export(uid: int = Depends(get_uid)):
    """Tovarlar ro'yxatini Excel faylga export qilish"""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            SELECT nomi, kategoriya, birlik,
                   olish_narxi, sotish_narxi, qoldiq, min_qoldiq
            FROM tovarlar WHERE user_id=$1 ORDER BY kategoriya, nomi
        """, uid)

    wb = Workbook()
    ws = wb.active
    ws.title = "Tovarlar"

    header_font = Font(name="Arial", bold=True, size=11, color="FFFFFF")
    header_fill = PatternFill(start_color="2E75B6", end_color="2E75B6", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin")
    )

    headers = ["Tovar nomi", "Kategoriya", "Birlik", "Olish narxi",
               "Sotish narxi", "Qoldiq", "Min qoldiq"]
    widths = [30, 18, 10, 15, 15, 12, 12]
    for i, (h, w) in enumerate(zip(headers, widths), 1):
        cell = ws.cell(row=1, column=i, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = thin_border
        ws.column_dimensions[chr(64 + i)].width = w

    num_fmt = '#,##0'
    for r_idx, row in enumerate(rows, 2):
        d = dict(row)
        ws.cell(row=r_idx, column=1, value=d["nomi"]).border = thin_border
        ws.cell(row=r_idx, column=2, value=d["kategoriya"]).border = thin_border
        ws.cell(row=r_idx, column=3, value=d["birlik"]).border = thin_border
        c4 = ws.cell(row=r_idx, column=4, value=float(d["olish_narxi"]))
        c4.number_format = num_fmt; c4.border = thin_border
        c5 = ws.cell(row=r_idx, column=5, value=float(d["sotish_narxi"]))
        c5.number_format = num_fmt; c5.border = thin_border
        c6 = ws.cell(row=r_idx, column=6, value=float(d["qoldiq"]))
        c6.number_format = '#,##0.###'; c6.border = thin_border
        c7 = ws.cell(row=r_idx, column=7, value=float(d["min_qoldiq"]))
        c7.number_format = '#,##0.###'; c7.border = thin_border

        if d["min_qoldiq"] > 0 and d["qoldiq"] <= d["min_qoldiq"]:
            red_fill = PatternFill(start_color="FFE0E0", end_color="FFE0E0",
                                   fill_type="solid")
            for col in range(1, 8):
                ws.cell(row=r_idx, column=col).fill = red_fill

    ws.auto_filter.ref = f"A1:G{len(rows) + 1}"
    last = len(rows) + 2
    ws.cell(row=last, column=1, value="JAMI:").font = Font(bold=True)
    ws.cell(row=last, column=6, value=f"=SUM(F2:F{len(rows)+1})").font = Font(bold=True)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return {
        "filename": "tovarlar.xlsx",
        "content_base64": base64.b64encode(buf.getvalue()).decode(),
        "tovar_soni": len(rows),
    }


@router.post("/tovar/import")
async def tovar_import(data: TovarImportSorov, request: Request,
                       uid: int = Depends(get_uid)):
    """Tovarlarni batch import qilish. Rate limit: 5/daqiqa."""
    await endpoint_rate_check(request, "import")
    from shared.cache.redis_cache import user_cache_tozala
    if not data.tovarlar:
        raise HTTPException(400, "Tovarlar ro'yxati bo'sh")
    if len(data.tovarlar) > 1000:
        raise HTTPException(400, "Maksimal 1000 ta tovar import qilish mumkin")

    yaratildi = yangilandi = 0
    xatolar = []

    async with rls_conn(uid) as c:
        for i, t in enumerate(data.tovarlar):
            nomi = t.nomi.strip()
            if not nomi:
                xatolar.append(f"#{i+1}: nom bo'sh")
                continue
            try:
                result = await c.fetchrow("""
                    INSERT INTO tovarlar
                        (user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, qoldiq)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                        kategoriya   = EXCLUDED.kategoriya,
                        birlik       = EXCLUDED.birlik,
                        olish_narxi  = CASE WHEN EXCLUDED.olish_narxi > 0
                                       THEN EXCLUDED.olish_narxi ELSE tovarlar.olish_narxi END,
                        sotish_narxi = CASE WHEN EXCLUDED.sotish_narxi > 0
                                       THEN EXCLUDED.sotish_narxi ELSE tovarlar.sotish_narxi END
                    RETURNING (xmax = 0) AS yangi
                """, uid, nomi, t.kategoriya, t.birlik,
                    t.olish_narxi, t.sotish_narxi, t.qoldiq)
                if result and result["yangi"]:
                    yaratildi += 1
                else:
                    yangilandi += 1
            except Exception as e:
                xatolar.append(f"#{i+1} {nomi}: {str(e)[:50]}")

    await user_cache_tozala(uid)
    return {
        "yaratildi": yaratildi, "yangilandi": yangilandi,
        "xatolar": xatolar[:20], "jami": yaratildi + yangilandi,
    }
