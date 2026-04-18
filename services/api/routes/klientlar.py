"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — KLIENTLAR CRUD ROUTELARI                         ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from shared.database.pool import rls_conn
from shared.utils import like_escape
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Klientlar"])


class KlientYangilaSorov(BaseModel):
    ism:          str | None   = None
    telefon:      str | None   = None
    manzil:       str | None   = None
    kredit_limit: float | None = None
    eslatma:      str | None   = None


@router.get("/klientlar")
async def klientlar(
    limit: int = 20, offset: int = 0,
    qidiruv: str | None = None,
    kategoriya: str | None = None,
    qarzdor: bool | None = None,
    min_sotib: float | None = None,
    faol_kun: int | None = None,  # oxirgi N kun ichida sotuv bo'lganlar
    sort: str = "jami_sotib",
    uid: int = Depends(get_uid)
):
    """Klientlar ro'yxati — SalesDoc-style filtrlash."""
    limit = min(limit, 500)

    where = ["k.user_id = $1"]
    params: list = [uid]

    def add_where(clause: str, val=None):
        if val is not None:
            params.append(val)
        where.append(clause)

    if qidiruv:
        params.append(f"%{like_escape(qidiruv)}%")
        where.append(
            f"(lower(k.ism) LIKE lower(${len(params)}) OR k.telefon LIKE ${len(params)})"
        )
    if kategoriya:
        params.append(kategoriya)
        where.append(f"k.kategoriya = ${len(params)}")
    if min_sotib is not None:
        params.append(min_sotib)
        where.append(f"k.jami_sotib >= ${len(params)}")
    if faol_kun:
        params.append(faol_kun)
        where.append(
            f"k.oxirgi_sotuv IS NOT NULL AND "
            f"k.oxirgi_sotuv >= NOW() - make_interval(days => ${len(params)})"
        )

    having = ""
    if qarzdor:
        having = "HAVING COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) > 0"

    sort_map = {
        "jami_sotib":  "k.jami_sotib DESC",
        "ism":         "k.ism ASC",
        "yangi":       "k.yaratilgan DESC",
        "oxirgi":      "k.oxirgi_sotuv DESC NULLS LAST",
        "qarz":        "aktiv_qarz DESC",
    }
    order_by = sort_map.get(sort, "k.jami_sotib DESC")
    where_sql = " AND ".join(where)

    params.append(limit); params.append(offset)
    sql = f"""
        SELECT k.id, k.user_id, k.ism, k.telefon, k.manzil,
               k.kredit_limit, k.jami_sotib, k.eslatma, k.yaratilgan,
               k.kategoriya, k.tugilgan_kun, k.oxirgi_sotuv,
               k.jami_xaridlar, k.xarid_soni,
               COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) AS aktiv_qarz
        FROM klientlar k
        LEFT JOIN qarzlar q ON q.klient_id = k.id
        WHERE {where_sql}
        GROUP BY k.id
        {having}
        ORDER BY {order_by}
        LIMIT ${len(params)-1} OFFSET ${len(params)}
    """
    async with rls_conn(uid) as c:
        rows = await c.fetch(sql, *params)
        if qarzdor:
            total_sql = f"""
                SELECT COUNT(*) FROM (
                    SELECT k.id
                    FROM klientlar k
                    LEFT JOIN qarzlar q ON q.klient_id = k.id
                    WHERE {where_sql}
                    GROUP BY k.id
                    {having}
                ) sub
            """
            total = await c.fetchval(total_sql, *params[:-2])
        else:
            total_sql = f"SELECT COUNT(*) FROM klientlar k WHERE {where_sql}"
            total = await c.fetchval(total_sql, *params[:-2])
    return {"total": total, "items": [dict(r) for r in rows]}


@router.get("/klientlar/facets")
async def klientlar_facets(uid: int = Depends(get_uid)):
    """Filter dropdownlari uchun unikal qiymatlar + umumiy statistika."""
    async with rls_conn(uid) as c:
        total = await c.fetchval(
            "SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid
        )
        qarzdor = await c.fetchval("""
            SELECT COUNT(DISTINCT klient_id) FROM qarzlar
            WHERE user_id=$1 AND NOT yopildi AND qolgan > 0
        """, uid)
        faol = await c.fetchval("""
            SELECT COUNT(*) FROM klientlar
            WHERE user_id=$1 AND oxirgi_sotuv >= NOW() - interval '30 days'
        """, uid)
        kategoriyalar = await c.fetch("""
            SELECT DISTINCT kategoriya FROM klientlar
            WHERE user_id=$1 AND kategoriya IS NOT NULL AND kategoriya <> ''
            ORDER BY kategoriya
        """, uid)
        jami_qarz = await c.fetchval("""
            SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
            WHERE user_id=$1 AND NOT yopildi
        """, uid)
    return {
        "jami":          int(total or 0),
        "qarzdorlar":    int(qarzdor or 0),
        "faol_30_kun":   int(faol or 0),
        "jami_qarz":     float(jami_qarz or 0),
        "kategoriyalar": [r["kategoriya"] for r in kategoriyalar],
    }


@router.get("/klient360/{klient_id}")
async def klient_360(klient_id: int, uid: int = Depends(get_uid)):
    """SalesDoc-style Client 360: to'liq profil + RFM + top tovarlar + oylik trend."""
    async with rls_conn(uid) as c:
        klient = await c.fetchrow("""
            SELECT k.id, k.ism, k.telefon, k.manzil, k.eslatma,
                   k.kredit_limit, k.jami_sotib, k.yaratilgan,
                   k.kategoriya, k.tugilgan_kun, k.oxirgi_sotuv,
                   k.jami_xaridlar, k.xarid_soni
            FROM klientlar k
            WHERE k.id = $1 AND k.user_id = $2
        """, klient_id, uid)
        if not klient:
            raise HTTPException(404, "Klient topilmadi")

        qarz_balans = await c.fetchrow("""
            SELECT
                COALESCE(SUM(dastlabki_summa), 0)              AS jami_qarz,
                COALESCE(SUM(tolangan), 0)                     AS jami_tolangan,
                COALESCE(SUM(qolgan) FILTER (WHERE NOT yopildi), 0) AS aktiv_qarz,
                COUNT(*) FILTER (WHERE NOT yopildi)            AS aktiv_soni,
                COUNT(*) FILTER (WHERE yopildi)                AS yopilgan_soni
            FROM qarzlar WHERE klient_id = $1
        """, klient_id)

        sotuv_stats = await c.fetchrow("""
            SELECT
                COUNT(*)                      AS soni,
                COALESCE(SUM(jami), 0)        AS jami,
                COALESCE(SUM(tolangan), 0)    AS tolangan,
                COALESCE(AVG(jami), 0)        AS ortacha_chek,
                MAX(sana)                     AS oxirgi_sotuv,
                MIN(sana)                     AS birinchi_sotuv
            FROM sotuv_sessiyalar
            WHERE klient_id = $1 AND user_id = $2
        """, klient_id, uid)

        # Top 10 sotib olingan tovarlar
        top_tovarlar = await c.fetch("""
            SELECT ch.tovar_nomi, ch.kategoriya,
                   SUM(ch.miqdor)  AS miqdor,
                   SUM(ch.jami)    AS jami,
                   COUNT(DISTINCT ch.sessiya_id) AS sotuv_soni,
                   MAX(ch.sana)    AS oxirgi
            FROM chiqimlar ch
            WHERE ch.klient_id = $1 AND ch.user_id = $2
            GROUP BY ch.tovar_nomi, ch.kategoriya
            ORDER BY jami DESC
            LIMIT 10
        """, klient_id, uid)

        # Oxirgi 20 ta sotuv
        oxirgi_sotuvlar = await c.fetch("""
            SELECT ss.id, ss.jami, ss.tolangan, ss.qarz, ss.sana,
                   COUNT(ch.id) AS tovar_soni
            FROM sotuv_sessiyalar ss
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE ss.klient_id = $1 AND ss.user_id = $2
            GROUP BY ss.id
            ORDER BY ss.sana DESC LIMIT 20
        """, klient_id, uid)

        # 12 oylik trend
        oylik_trend = await c.fetch("""
            SELECT
                to_char(date_trunc('month', sana), 'YYYY-MM') AS oy,
                COUNT(*)                                       AS soni,
                COALESCE(SUM(jami), 0)                         AS jami
            FROM sotuv_sessiyalar
            WHERE klient_id = $1 AND user_id = $2
              AND sana >= NOW() - interval '12 months'
            GROUP BY 1
            ORDER BY 1
        """, klient_id, uid)

        # RFM: qit'amizda klient bitta, shuning uchun segment umumiy hisoblanadi
        rfm_row = await c.fetchrow("""
            WITH rfm AS (
                SELECT
                    klient_id,
                    EXTRACT(EPOCH FROM (NOW() - MAX(sana)))/86400 AS recency_days,
                    COUNT(*)                                      AS frequency,
                    COALESCE(SUM(jami), 0)                        AS monetary
                FROM sotuv_sessiyalar
                WHERE user_id = $2 AND klient_id IS NOT NULL
                GROUP BY klient_id
            ),
            scored AS (
                SELECT
                    klient_id,
                    NTILE(5) OVER (ORDER BY recency_days DESC) AS r,
                    NTILE(5) OVER (ORDER BY frequency)          AS f,
                    NTILE(5) OVER (ORDER BY monetary)           AS m,
                    recency_days, frequency, monetary
                FROM rfm
            )
            SELECT r, f, m, recency_days, frequency, monetary
            FROM scored WHERE klient_id = $1
        """, klient_id, uid)

        segment = None
        rfm_data = None
        if rfm_row:
            r, f, m = rfm_row["r"], rfm_row["f"], rfm_row["m"]
            score = r + f + m
            if   score >= 13: segment = "Champions"
            elif score >= 10: segment = "Loyal"
            elif score >= 7:  segment = "Potential"
            elif score >= 5:  segment = "At Risk"
            else:             segment = "Lost"
            rfm_data = {
                "R": int(r), "F": int(f), "M": int(m),
                "segment": segment,
                "recency_days": int(rfm_row["recency_days"] or 0),
                "frequency":    int(rfm_row["frequency"] or 0),
                "monetary":     float(rfm_row["monetary"] or 0),
            }

    return {
        "klient":          dict(klient),
        "qarz_balans":     dict(qarz_balans) if qarz_balans else {},
        "sotuv_stats":     dict(sotuv_stats) if sotuv_stats else {},
        "top_tovarlar":    [dict(r) for r in top_tovarlar],
        "oxirgi_sotuvlar": [dict(r) for r in oxirgi_sotuvlar],
        "oylik_trend":     [dict(r) for r in oylik_trend],
        "rfm":             rfm_data,
    }


@router.post("/klient")
async def klient_yarat(data: dict, uid: int = Depends(get_uid)):
    """Yangi klient yaratish yoki topish"""
    from shared.cache.redis_cache import user_cache_tozala
    ism = (data.get("ism") or "").strip()
    if not ism:
        raise HTTPException(400, "Klient ismi bo'sh")
    kredit_limit = data.get("kredit_limit", 0)
    try:
        kredit_limit = float(kredit_limit or 0)
        if kredit_limit < 0 or kredit_limit > 9_999_999_999:
            raise HTTPException(400, "Kredit limit 0 — 9,999,999,999 oralig'ida bo'lishi kerak")
    except (TypeError, ValueError):
        kredit_limit = 0
    async with rls_conn(uid) as c:
        klient = await c.fetchrow("""
            INSERT INTO klientlar(user_id, ism, telefon, manzil, kredit_limit)
            VALUES($1,$2,$3,$4,$5)
            ON CONFLICT(user_id, lower(ism)) DO UPDATE SET telefon=EXCLUDED.telefon
            RETURNING id, user_id, ism, telefon, manzil, kredit_limit, jami_sotib, yaratilgan
        """, uid, ism, data.get("telefon"), data.get("manzil"), kredit_limit)
    await user_cache_tozala(uid)
    return dict(klient)


@router.put("/klient/{klient_id}")
async def klient_yangilash(klient_id: int, data: KlientYangilaSorov,
                            uid: int = Depends(get_uid)):
    """Klient ma'lumotlarini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    _RUXSAT = {"ism", "telefon", "manzil", "kredit_limit", "eslatma"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE klientlar SET {set_q} WHERE id=$1 AND user_id=$2",
            klient_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    return {"id": klient_id, "status": "yangilandi"}


@router.delete("/klient/{klient_id}")
async def klient_ochirish(klient_id: int, uid: int = Depends(get_uid)):
    """Klientni o'chirish (agar faol qarz yoki sotuv bo'lmasa)"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        qarz_bor = await c.fetchval(
            "SELECT EXISTS(SELECT 1 FROM qarzlar WHERE klient_id=$1 AND yopildi=FALSE AND qolgan>0)",
            klient_id
        )
        if qarz_bor:
            raise HTTPException(409, "Bu klientda faol qarz bor — o'chirib bo'lmaydi")
        result = await c.execute(
            "DELETE FROM klientlar WHERE id=$1 AND user_id=$2", klient_id, uid
        )
    if "DELETE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    return {"id": klient_id, "status": "ochirildi"}


@router.get("/klient/{klient_id}/tarix")
async def klient_tarix(klient_id: int, limit: int = 20, uid: int = Depends(get_uid)):
    """Klientning sotuv va qarz tarixi"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        klient = await c.fetchrow(
            "SELECT ism, telefon, kredit_limit, jami_sotib FROM klientlar WHERE id=$1 AND user_id=$2",
            klient_id, uid
        )
        if not klient:
            raise HTTPException(404, "Klient topilmadi")

        sotuvlar = await c.fetch("""
            SELECT ss.id, ss.jami, ss.tolangan, ss.qarz, ss.sana,
                   COUNT(ch.id) AS tovar_soni
            FROM sotuv_sessiyalar ss
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE ss.klient_id = $1
            GROUP BY ss.id
            ORDER BY ss.sana DESC LIMIT $2
        """, klient_id, limit)

        qarzlar = await c.fetch("""
            SELECT id, dastlabki_summa, tolangan, qolgan, muddat, yopildi, yaratilgan
            FROM qarzlar WHERE klient_id=$1
            ORDER BY yaratilgan DESC LIMIT $2
        """, klient_id, limit)

    return {
        "klient": dict(klient),
        "sotuvlar": [dict(r) for r in sotuvlar],
        "qarzlar": [dict(r) for r in qarzlar],
    }


@router.get("/klient/{klient_id}/profil")
async def klient_profil_api(klient_id: int, uid: int = Depends(get_uid)):
    """Klient CRM profili."""
    from shared.services.klient_crm import klient_profil
    async with rls_conn(uid) as c:
        data = await klient_profil(c, uid, klient_id)
    if not data:
        raise HTTPException(404, "Klient topilmadi")
    return data
