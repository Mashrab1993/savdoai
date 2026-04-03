"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — AI NARX TAVSIYA                                  ║
║  Sotuv tarixini tahlil qilib optimal narxni tavsiya qiladi  ║
║                                                              ║
║  Strategiyalar:                                              ║
║  1. Margin past (< 15%) → oshirish                          ║
║  2. Talab yuqori + qoldiq kam → oshirish                    ║
║  3. Kam sotilmoqda + ko'p qoldiq → chegirma                ║
║  4. Amaliy narx farqi → moslashtirish                       ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal, ROUND_HALF_UP

log = logging.getLogger(__name__)

# Narx yaxlitlash qadami (so'm)
_YAXLITLASH = Decimal("1000")


def _yaxlitla(n: Decimal) -> Decimal:
    """Narxni 1000 ga yaxlitlash."""
    if n <= 0:
        return Decimal(0)
    return (n / _YAXLITLASH).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * _YAXLITLASH


async def narx_tavsiyalar(conn, uid: int, limit: int = 10) -> list[dict]:
    """Eng ko'p sotilgan tovarlar uchun narx tavsiya.

    Args:
        conn: asyncpg connection
        uid: foydalanuvchi ID
        limit: nechta tovar tahlil qilish

    Returns:
        [{tovar_id, nomi, joriy_narx, tavsiya_narx, sabab, kutilgan_foyda}]
    """
    try:
        rows = await conn.fetch("""
            WITH sotuv_30 AS (
                SELECT
                    c.tovar_id,
                    t.nomi,
                    t.sotish_narxi AS joriy_narx,
                    t.olish_narxi,
                    t.qoldiq,
                    t.birlik,
                    COUNT(*) AS sotuv_soni,
                    SUM(c.miqdor) AS jami_miqdor,
                    SUM(c.summa) AS jami_summa,
                    AVG(c.narx) AS ortacha_sotuv_narx
                FROM chiqimlar c
                JOIN tovarlar t ON t.id = c.tovar_id AND t.user_id = c.user_id
                WHERE c.user_id=$1
                  AND c.yaratilgan >= NOW() - INTERVAL '30 days'
                  AND c.tovar_id IS NOT NULL
                GROUP BY c.tovar_id, t.nomi, t.sotish_narxi, t.olish_narxi,
                         t.qoldiq, t.birlik
                ORDER BY jami_summa DESC
                LIMIT $2
            )
            SELECT tovar_id, nomi, joriy_narx, olish_narxi, qoldiq, birlik,
                   sotuv_soni, jami_miqdor, jami_summa, ortacha_sotuv_narx
            FROM sotuv_30
        """, uid, limit)
    except Exception as e:
        log.error("narx_tavsiya SQL: %s", e)
        return []

    tavsiyalar = []
    for r in rows:
        joriy = Decimal(str(r["joriy_narx"] or 0))
        olish = Decimal(str(r["olish_narxi"] or 0))
        ortacha = Decimal(str(r["ortacha_sotuv_narx"] or 0))
        qoldiq = r["qoldiq"] or 0
        sotuv_soni = r["sotuv_soni"] or 0

        if olish <= 0 or joriy <= 0:
            continue

        margin = ((joriy - olish) / olish * 100).quantize(Decimal("0.1"))
        tavsiya_narx = joriy
        sabab = ""

        # Strategiya 1: Margin juda past (< 15%)
        if margin < 15:
            tavsiya_narx = _yaxlitla(olish * Decimal("1.20"))
            sabab = f"⚠️ Margin past ({margin}%). Kamida 20% qo'shing"

        # Strategiya 2: Ko'p sotilmoqda + qoldiq kam → narx oshirish
        elif sotuv_soni >= 8 and qoldiq < 20:
            tavsiya_narx = _yaxlitla(joriy * Decimal("1.05"))
            sabab = f"🔥 Talab yuqori ({sotuv_soni}/oy), qoldiq kam ({qoldiq}). 5% oshiring"

        # Strategiya 3: Kam sotilmoqda + ko'p qoldiq → chegirma
        elif sotuv_soni <= 2 and qoldiq > 50:
            tavsiya_narx = _yaxlitla(joriy * Decimal("0.90"))
            # Olish narxidan past bo'lmasin
            if tavsiya_narx < olish:
                tavsiya_narx = _yaxlitla(olish * Decimal("1.05"))
            sabab = f"📉 Kam sotilmoqda ({sotuv_soni}/oy), ko'p qoldiq ({qoldiq}). Chegirma"

        # Strategiya 4: Ortacha narx sezilarli farq
        elif ortacha > 0 and abs(ortacha - joriy) > joriy * Decimal("0.08"):
            tavsiya_narx = _yaxlitla(ortacha)
            if tavsiya_narx < olish:
                tavsiya_narx = _yaxlitla(olish * Decimal("1.10"))
            sabab = f"📊 Amalda {_pul(ortacha)} da sotilmoqda"

        else:
            continue  # O'zgartirish kerak emas

        # Foyda farqi hisoblash
        if tavsiya_narx != joriy:
            eski_foyda = (joriy - olish) * sotuv_soni
            yangi_foyda = (tavsiya_narx - olish) * sotuv_soni
            kutilgan = float(yangi_foyda - eski_foyda)

            tavsiyalar.append({
                "tovar_id": r["tovar_id"],
                "nomi": r["nomi"],
                "birlik": r.get("birlik", "dona"),
                "joriy_narx": float(joriy),
                "tavsiya_narx": float(tavsiya_narx),
                "olish_narxi": float(olish),
                "margin": float(margin),
                "sabab": sabab,
                "kutilgan_foyda_oshishi": kutilgan,
                "sotuv_soni": sotuv_soni,
                "qoldiq": qoldiq,
            })

    # Eng katta foyda beruvchilarni birinchi
    tavsiyalar.sort(key=lambda x: x["kutilgan_foyda_oshishi"], reverse=True)
    return tavsiyalar


def _pul(n) -> str:
    """Decimal ni pul formatida ko'rsatish."""
    try:
        from shared.utils.fmt import pul
        return pul(n)
    except Exception:
        return f"{float(n):,.0f}"
