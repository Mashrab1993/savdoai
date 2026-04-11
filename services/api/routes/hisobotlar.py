"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — HISOBOT ROUTELARI                                ║
║  Kunlik, haftalik, oylik, foyda, statistika                 ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from shared.database.pool import rls_conn
from shared.cache.redis_cache import cache_ol, cache_yoz, TTL_HISOBOT
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Hisobotlar"])


@router.get("/hisobot/haftalik")
async def hisobot_haftalik(uid: int = Depends(get_uid)):
    """7 kunlik hisobot"""
    cache_k = f"hisobot:haftalik:{uid}"
    cached = await cache_ol(cache_k)
    if cached:
        return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0)     jami,
                   COALESCE(SUM(qarz),0)     qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        kr = await c.fetchrow("""
            SELECT COUNT(*) n, COALESCE(SUM(jami),0) jami
            FROM kirimlar WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        top_klientlar = [dict(r) for r in await c.fetch("""
            SELECT klient_ismi, SUM(jami) jami, COUNT(*) soni
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days' AND klient_ismi IS NOT NULL
            GROUP BY klient_ismi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr": "7 kun",
        "sotuv": {"soni": int(ch["n"]), "jami": float(ch["jami"]),
                  "qarz": float(ch["qarz"])},
        "kirim": {"soni": int(kr["n"]), "jami": float(kr["jami"])},
        "top_klientlar": top_klientlar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 6)
    return result


@router.get("/hisobot/oylik")
async def hisobot_oylik(uid: int = Depends(get_uid)):
    """30 kunlik hisobot"""
    cache_k = f"hisobot:oylik:{uid}"
    cached = await cache_ol(cache_k)
    if cached:
        return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0) jami,
                   COALESCE(SUM(qarz),0) qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        foyda = await c.fetchrow("""
            SELECT COALESCE(SUM(ch.jami - ch.miqdor*ch.olish_narxi),0) sof_foyda
            FROM chiqimlar ch WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        top5_tovar = [dict(r) for r in await c.fetch("""
            SELECT tovar_nomi, SUM(miqdor) miqdor, SUM(jami) jami
            FROM chiqimlar WHERE sana >= NOW() - INTERVAL '30 days'
            GROUP BY tovar_nomi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr": "30 kun",
        "sotuv": {"soni": int(ch["n"]), "jami": float(ch["jami"])},
        "sof_foyda": float(foyda["sof_foyda"] or 0),
        "top_tovarlar": top5_tovar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 12)
    return result


@router.get("/hisobot/foyda")
async def hisobot_foyda(kunlar: int = 30, uid: int = Depends(get_uid)):
    """Foyda tahlili — sof foyda, xarajatlar, top foyda/zarar tovarlar."""
    async with rls_conn(uid) as c:
        foyda = await c.fetchrow("""
            SELECT
                COALESCE(SUM(ch.jami), 0) AS brutto,
                COALESCE(SUM(ch.miqdor * ch.olish_narxi), 0) AS tannarx,
                COALESCE(SUM(ch.jami - ch.miqdor * ch.olish_narxi), 0) AS sof_foyda
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
        """, kunlar)

        xarajat = await c.fetchval("""
            SELECT COALESCE(SUM(summa), 0)
            FROM xarajatlar
            WHERE admin_uid=$1 AND tasdiqlangan=TRUE
              AND vaqt >= NOW() - make_interval(days => $2)
        """, uid, kunlar)

        top_foyda = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1) AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi ORDER BY foyda DESC LIMIT 5
        """, kunlar)

        top_zarar = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1) AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi
            HAVING SUM(ch.jami - ch.miqdor * ch.olish_narxi) < 0
            ORDER BY foyda ASC LIMIT 5
        """, kunlar)

    sof = float(foyda["sof_foyda"] or 0)
    xar = float(xarajat or 0)
    brutto = float(foyda["brutto"] or 0)
    return {
        "kunlar": kunlar,
        "brutto_sotuv": brutto,
        "tannarx": float(foyda["tannarx"] or 0),
        "sof_foyda": sof,
        "xarajatlar": xar,
        "toza_foyda": sof - xar,
        "margin_foiz": round(sof / brutto * 100, 1) if brutto > 0 else 0,
        "top_foyda": [{"nomi": r["tovar_nomi"], "foyda": float(r["foyda"]),
                       "miqdor": float(r["miqdor"])} for r in top_foyda],
        "top_zarar": [{"nomi": r["tovar_nomi"], "zarar": abs(float(r["foyda"])),
                       "miqdor": float(r["miqdor"])} for r in top_zarar],
    }


@router.get("/statistika", tags=["Dashboard"])
async def admin_statistika(uid: int = Depends(get_uid)):
    """Tizim statistikasi — admin uchun umumiy ko'rsatkichlar"""
    async with rls_conn(uid) as c:
        tovar_soni = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid) or 0
        klient_soni = await c.fetchval(
            "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid) or 0
        faol_qarz = await c.fetchval(
            "SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar "
            "WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0", uid) or 0
        bugun_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """, uid)
        hafta_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '7 days'
        """, uid)
        oy_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '30 days'
        """, uid)
        kam_qoldiq = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar "
            "WHERE user_id=$1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq", uid) or 0
        muddat_otgan = await c.fetchval(
            "SELECT COUNT(*) FROM qarzlar "
            "WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0 "
            "AND muddat IS NOT NULL AND muddat < NOW()", uid) or 0
    return {
        "tovar_soni": tovar_soni, "klient_soni": klient_soni,
        "faol_qarz": float(faol_qarz), "kam_qoldiq_soni": kam_qoldiq,
        "muddat_otgan_qarz": muddat_otgan,
        "bugun": {"soni": int(bugun_sotuv["soni"]), "jami": float(bugun_sotuv["jami"])},
        "hafta": {"soni": int(hafta_sotuv["soni"]), "jami": float(hafta_sotuv["jami"])},
        "oy":    {"soni": int(oy_sotuv["soni"]),    "jami": float(oy_sotuv["jami"])},
    }


# ════════════════════════════════════════════════════════════
#  REPORTS — SalesDoc-level reporting
# ════════════════════════════════════════════════════════════

@router.get("/reports/rfm")
async def report_rfm(uid: int = Depends(get_uid)):
    """Butun klient bazasi bo'yicha RFM segmentatsiya (web hisobot uchun).
    Qaytaradi: segmentlar bo'yicha klient soni + jami summa + har segmentdagi
    top 10 klient (drill-down uchun)."""
    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            WITH rfm AS (
                SELECT
                    k.id, k.ism, k.telefon,
                    COUNT(ss.id)                                  AS frequency,
                    COALESCE(SUM(ss.jami), 0)                     AS monetary,
                    EXTRACT(EPOCH FROM (NOW() - MAX(ss.sana)))/86400 AS recency_days,
                    MAX(ss.sana)                                  AS oxirgi
                FROM klientlar k
                LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id = k.id
                WHERE k.user_id = $1
                GROUP BY k.id
                HAVING COUNT(ss.id) > 0
            ),
            scored AS (
                SELECT
                    id, ism, telefon, frequency, monetary, recency_days, oxirgi,
                    NTILE(5) OVER (ORDER BY recency_days DESC) AS r,
                    NTILE(5) OVER (ORDER BY frequency)          AS f,
                    NTILE(5) OVER (ORDER BY monetary)           AS m
                FROM rfm
            )
            SELECT id, ism, telefon,
                   frequency, monetary, recency_days, oxirgi,
                   r, f, m,
                   CASE
                       WHEN (r + f + m) >= 13 THEN 'Champions'
                       WHEN (r + f + m) >= 10 THEN 'Loyal'
                       WHEN (r + f + m) >= 7  THEN 'Potential'
                       WHEN (r + f + m) >= 5  THEN 'At Risk'
                       ELSE 'Lost'
                   END AS segment
            FROM scored
            ORDER BY monetary DESC
        """, uid)

    seg_map: dict[str, dict] = {
        "Champions": {"soni": 0, "monetary": 0.0, "top": []},
        "Loyal":     {"soni": 0, "monetary": 0.0, "top": []},
        "Potential": {"soni": 0, "monetary": 0.0, "top": []},
        "At Risk":   {"soni": 0, "monetary": 0.0, "top": []},
        "Lost":      {"soni": 0, "monetary": 0.0, "top": []},
    }
    for r in rows:
        seg = r["segment"]
        d   = seg_map[seg]
        d["soni"] += 1
        d["monetary"] += float(r["monetary"] or 0)
        if len(d["top"]) < 10:
            d["top"].append({
                "id":           r["id"],
                "ism":          r["ism"],
                "telefon":      r["telefon"],
                "R":            int(r["r"]),
                "F":            int(r["f"]),
                "M":            int(r["m"]),
                "frequency":    int(r["frequency"]),
                "monetary":     float(r["monetary"] or 0),
                "recency_days": int(r["recency_days"] or 0),
                "oxirgi":       r["oxirgi"].isoformat() if r["oxirgi"] else None,
            })

    return {
        "jami_klient":  len(rows),
        "jami_summa":   sum(s["monetary"] for s in seg_map.values()),
        "segmentlar":   seg_map,
    }


@router.get("/reports/sales-detail")
async def report_sales_detail(
    sana_dan: Optional[str] = None,
    sana_gacha: Optional[str] = None,
    kategoriya: Optional[str] = None,
    klient: Optional[str] = None,
    tovar: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
    uid: int = Depends(get_uid),
):
    """Har bir sotuv qatori — tovar nomi, miqdor, narx, kategoriya, mijoz, sana.
    SalesDoc Sotuv detail hisoboti analog."""
    where = ["ch.user_id = $1"]
    params: list = [uid]

    def add(clause: str, val):
        params.append(val)
        where.append(clause)

    if sana_dan:
        add(f"ch.sana >= ${len(params)+1}::timestamptz", sana_dan)
    if sana_gacha:
        add(f"ch.sana < ${len(params)+1}::timestamptz + interval '1 day'", sana_gacha)
    if kategoriya:
        add(f"ch.kategoriya = ${len(params)+1}", kategoriya)
    if klient:
        add(f"lower(ch.klient_ismi) LIKE lower(${len(params)+1})", f"%{klient}%")
    if tovar:
        add(f"lower(ch.tovar_nomi) LIKE lower(${len(params)+1})", f"%{tovar}%")

    where_sql = " AND ".join(where)
    params.append(limit); params.append(offset)

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT
                ch.id, ch.sana, ch.sessiya_id,
                ch.tovar_nomi, ch.kategoriya, ch.birlik,
                ch.miqdor, ch.qaytarilgan,
                ch.olish_narxi, ch.sotish_narxi, ch.chegirma_foiz, ch.jami,
                ch.klient_ismi,
                (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor AS foyda
            FROM chiqimlar ch
            WHERE {where_sql}
            ORDER BY ch.sana DESC, ch.id DESC
            LIMIT ${len(params)-1} OFFSET ${len(params)}
        """, *params)

        stats = await c.fetchrow(f"""
            SELECT
                COUNT(*)                                                 AS soni,
                COALESCE(SUM(ch.jami), 0)                                AS jami_summa,
                COALESCE(SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor), 0) AS jami_foyda,
                COALESCE(SUM(ch.miqdor), 0)                              AS jami_miqdor
            FROM chiqimlar ch
            WHERE {where_sql}
        """, *params[:-2])

    return {
        "items": [dict(r) for r in rows],
        "stats": dict(stats) if stats else {},
        "total": int(stats["soni"] or 0) if stats else 0,
    }


@router.get("/reports/sales-detail/excel")
async def report_sales_detail_excel(
    sana_dan: Optional[str] = None,
    sana_gacha: Optional[str] = None,
    kategoriya: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    """Sotuv detail hisobotini Excel faylga export qilish."""
    import io, base64
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    where = ["ch.user_id = $1"]
    params: list = [uid]
    if sana_dan:
        params.append(sana_dan)
        where.append(f"ch.sana >= ${len(params)}::timestamptz")
    if sana_gacha:
        params.append(sana_gacha)
        where.append(f"ch.sana < ${len(params)}::timestamptz + interval '1 day'")
    if kategoriya:
        params.append(kategoriya)
        where.append(f"ch.kategoriya = ${len(params)}")
    where_sql = " AND ".join(where)

    async with rls_conn(uid) as c:
        rows = await c.fetch(f"""
            SELECT ch.sana, ch.klient_ismi, ch.tovar_nomi, ch.kategoriya,
                   ch.miqdor, ch.birlik,
                   ch.olish_narxi, ch.sotish_narxi, ch.chegirma_foiz, ch.jami,
                   (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor AS foyda
            FROM chiqimlar ch
            WHERE {where_sql}
            ORDER BY ch.sana DESC
            LIMIT 10000
        """, *params)

    wb = Workbook()
    ws = wb.active
    ws.title = "Sotuv detail"

    headers = ["Sana", "Mijoz", "Tovar", "Kategoriya", "Miqdor", "Birlik",
               "Olish", "Sotish", "Cheg %", "Jami", "Foyda"]
    widths  = [13, 25, 30, 15, 10, 8, 12, 12, 8, 14, 12]

    header_fill = PatternFill(start_color="0A819C", end_color="0A819C", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    thin = Side(style="thin", color="888888")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for i, (h, w) in enumerate(zip(headers, widths), 1):
        cell = ws.cell(row=1, column=i, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
        ws.column_dimensions[chr(64 + i)].width = w

    total_jami = 0.0
    total_foyda = 0.0
    for idx, r in enumerate(rows, 2):
        d = dict(r)
        sana_str = d["sana"].strftime("%d.%m.%Y") if d.get("sana") else ""
        vals = [
            sana_str, d["klient_ismi"] or "—", d["tovar_nomi"] or "",
            d["kategoriya"] or "", float(d["miqdor"] or 0), d["birlik"] or "",
            float(d["olish_narxi"] or 0), float(d["sotish_narxi"] or 0),
            float(d["chegirma_foiz"] or 0), float(d["jami"] or 0),
            float(d["foyda"] or 0),
        ]
        for col, v in enumerate(vals, 1):
            cell = ws.cell(row=idx, column=col, value=v)
            cell.border = border
            if col in (5, 7, 8, 9, 10, 11):
                cell.number_format = '#,##0.##'
                cell.alignment = Alignment(horizontal="right")
        total_jami  += float(d["jami"] or 0)
        total_foyda += float(d["foyda"] or 0)

    total_row = len(rows) + 2
    for col in range(1, 12):
        ws.cell(row=total_row, column=col).fill = PatternFill(
            start_color="E8F5E9", end_color="E8F5E9", fill_type="solid")
        ws.cell(row=total_row, column=col).border = border
    ws.cell(row=total_row, column=1, value="JAMI").font = Font(bold=True)
    jc = ws.cell(row=total_row, column=10, value=total_jami)
    jc.font = Font(bold=True); jc.number_format = '#,##0'
    fc = ws.cell(row=total_row, column=11, value=total_foyda)
    fc.font = Font(bold=True, color="1B5E20"); fc.number_format = '#,##0'

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:K{len(rows) + 1}"

    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return {
        "filename": f"Sotuv_detail_{sana_dan or 'barcha'}_{sana_gacha or ''}.xlsx",
        "content_base64": base64.b64encode(buf.getvalue()).decode(),
        "soni": len(rows),
        "jami_summa": total_jami,
        "jami_foyda": total_foyda,
    }
