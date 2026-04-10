"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KENGAYTIRILGAN TOVAR FILTRLASH               ║
║                                                                  ║
║  SD Agent AddOrderPresenter'dan o'rganilgan:                     ║
║  • 9 ta filtr (kategoriya, brand, narx turi, ombor, ...)        ║
║  • Pagination (20 ta/sahifa)                                     ║
║  • 3 xil saralash (qoldiq, alfavit, sort index)                 ║
║  • Sales categories per-client                                   ║
║  • Recommended sale prioritization                               ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
from services.api.deps import get_uid
from shared.database.pool import get_conn

log = logging.getLogger(__name__)
router = APIRouter(prefix="/tovarlar/v2", tags=["tovarlar-v2"])


class TovarFiltr(BaseModel):
    """SD Agent'dagi 9 ta filtrning analogi."""
    kategoriya_id: Optional[int] = None
    sub_kategoriya_id: Optional[int] = None
    brand_id: Optional[int] = None
    narx_turi_id: Optional[int] = None
    ombor_id: Optional[int] = None
    klient_id: Optional[int] = None
    faqat_buyurtma_qilingan: bool = False
    faqat_fotoli: bool = False
    narxsizlarni_yashirish: bool = False
    manfiy_qoldiqli: bool = False
    qidiruv: str = ""
    sahifa: int = 1
    sahifa_hajmi: int = 20
    saralash: str = "nom"  # nom, qoldiq, narx, sort_index


@router.post("/filtr")
async def tovarlar_filtrla(filtr: TovarFiltr, uid: int = Depends(get_uid)):
    """Kengaytirilgan tovar filtrlash — SD Agent 9-filter analog.

    Tovarlarni 9 ta mezon bo'yicha filtrlaydi:
    1. Kategoriya
    2. Sub-kategoriya
    3. Brand
    4. Narx turi
    5. Ombor (multi-store)
    6. Klient (sales categories)
    7. Faqat buyurtma qilinganlar
    8. Faqat fotoli
    9. Narxsizlarni yashirish
    """
    async with get_conn(uid) as conn:
        # Asosiy SQL
        query = """
            SELECT t.id, t.nomi, t.shtrix_kod, t.kategoriya, t.brand,
                   t.birlik, t.foto_url, t.sort_index,
                   COALESCE(t.tan_narx, 0) as tan_narx,
                   COALESCE(t.sotuv_narx, 0) as sotuv_narx,
                   COALESCE(t.qoldiq, 0) as qoldiq
            FROM tovarlar t
            WHERE t.user_id = $1 AND t.faol = TRUE
        """
        params = [uid]
        idx = 2

        # 1. Kategoriya filtri
        if filtr.kategoriya_id:
            query += f" AND t.kategoriya_id = ${idx}"
            params.append(filtr.kategoriya_id)
            idx += 1

        # 2. Sub-kategoriya filtri
        if filtr.sub_kategoriya_id:
            query += f" AND t.sub_kategoriya_id = ${idx}"
            params.append(filtr.sub_kategoriya_id)
            idx += 1

        # 3. Brand filtri
        if filtr.brand_id:
            query += f" AND t.brand_id = ${idx}"
            params.append(filtr.brand_id)
            idx += 1

        # 4. Narx turi filtri (narx_turlar jadvalidan)
        if filtr.narx_turi_id:
            query += f"""
                AND EXISTS (
                    SELECT 1 FROM narx_turlar nt
                    WHERE nt.tovar_id = t.id AND nt.narx_turi_id = ${idx}
                )
            """
            params.append(filtr.narx_turi_id)
            idx += 1

        # 5. Ombor filtri
        if filtr.ombor_id:
            query += f"""
                AND EXISTS (
                    SELECT 1 FROM ombor_qoldiq oq
                    WHERE oq.tovar_id = t.id AND oq.ombor_id = ${idx} AND oq.qoldiq > 0
                )
            """
            params.append(filtr.ombor_id)
            idx += 1

        # 6. Klient sales categories filtri
        if filtr.klient_id:
            query += f"""
                AND (
                    NOT EXISTS (
                        SELECT 1 FROM klient_kategoriyalar kk
                        WHERE kk.klient_id = ${idx}
                    )
                    OR t.kategoriya IN (
                        SELECT kk.kategoriya FROM klient_kategoriyalar kk
                        WHERE kk.klient_id = ${idx}
                    )
                )
            """
            params.append(filtr.klient_id)
            idx += 1

        # 7. Faqat buyurtma qilinganlar
        if filtr.faqat_buyurtma_qilingan:
            query += """
                AND EXISTS (
                    SELECT 1 FROM sotuv_tafsilot st
                    JOIN sotuvlar s ON s.id = st.sotuv_id
                    WHERE st.tovar_id = t.id AND s.user_id = t.user_id
                    AND s.sana >= CURRENT_DATE - INTERVAL '30 days'
                )
            """

        # 8. Faqat fotoli
        if filtr.faqat_fotoli:
            query += " AND t.foto_url IS NOT NULL AND t.foto_url != ''"

        # 9. Narxsizlarni yashirish
        if filtr.narxsizlarni_yashirish:
            query += " AND COALESCE(t.sotuv_narx, 0) > 0"

        # Manfiy qoldiq
        if not filtr.manfiy_qoldiqli:
            query += " AND COALESCE(t.qoldiq, 0) >= 0"

        # Qidiruv (fuzzy)
        if filtr.qidiruv.strip():
            query += f" AND t.nomi ILIKE ${idx}"
            params.append(f"%{filtr.qidiruv.strip()}%")
            idx += 1

        # Saralash
        saralash_map = {
            "nom": "t.nomi ASC",
            "qoldiq": "COALESCE(t.qoldiq, 0) DESC, t.nomi ASC",
            "narx": "COALESCE(t.sotuv_narx, 0) DESC",
            "sort_index": "COALESCE(t.sort_index, 0) ASC, t.nomi ASC",
        }
        query += f" ORDER BY {saralash_map.get(filtr.saralash, 't.nomi ASC')}"

        # Umumiy son
        count_query = f"SELECT COUNT(*) FROM ({query}) sub"
        jami = await conn.fetchval(count_query, *params)

        # Pagination
        offset = (filtr.sahifa - 1) * filtr.sahifa_hajmi
        query += f" LIMIT ${idx} OFFSET ${idx + 1}"
        params.extend([filtr.sahifa_hajmi, offset])

        rows = await conn.fetch(query, *params)

        return {
            "tovarlar": [dict(r) for r in rows],
            "jami": jami,
            "sahifa": filtr.sahifa,
            "sahifa_hajmi": filtr.sahifa_hajmi,
            "jami_sahifa": (jami + filtr.sahifa_hajmi - 1) // filtr.sahifa_hajmi,
        }


@router.get("/kategoriyalar")
async def kategoriyalar(uid: int = Depends(get_uid)):
    """Tovar kategoriyalari ro'yxati."""
    async with get_conn(uid) as conn:
        rows = await conn.fetch(
            "SELECT DISTINCT kategoriya, COUNT(*) as soni "
            "FROM tovarlar WHERE user_id=$1 AND faol=TRUE "
            "GROUP BY kategoriya ORDER BY kategoriya", uid)
        return [dict(r) for r in rows]


@router.get("/brandlar")
async def brandlar(uid: int = Depends(get_uid)):
    """Tovar brandlari ro'yxati."""
    async with get_conn(uid) as conn:
        rows = await conn.fetch(
            "SELECT DISTINCT brand, COUNT(*) as soni "
            "FROM tovarlar WHERE user_id=$1 AND faol=TRUE AND brand IS NOT NULL "
            "GROUP BY brand ORDER BY brand", uid)
        return [dict(r) for r in rows]
