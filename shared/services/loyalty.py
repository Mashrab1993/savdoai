"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — LOYALTY / BONUS BALL TIZIMI                 ║
║  WeChat/Starbucks modelidan ilhomlangan                         ║
║                                                                  ║
║  XUSUSIYATLAR:                                                   ║
║  ✅ Har sotuvda ball yig'ish (1000 so'm = 1 ball)              ║
║  ✅ Ballni chegirmaga almashtirish                              ║
║  ✅ VIP darajalar (Bronze → Silver → Gold → Platinum)           ║
║  ✅ Tug'ilgan kun bonusi                                        ║
║  ✅ Referral bonus (do'stni taklif qilish)                     ║
║  ✅ Ball tarixi va hisoboti                                     ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

# 1000 so'm = 1 ball (sozlanishi mumkin)
DEFAULT_BALL_NISBAT = Decimal("1000")

# VIP darajalar
DARAJALAR = {
    "bronze":   {"min_ball": 0,     "chegirma_foiz": 0,  "emoji": "🥉", "nomi": "Bronze"},
    "silver":   {"min_ball": 100,   "chegirma_foiz": 2,  "emoji": "🥈", "nomi": "Silver"},
    "gold":     {"min_ball": 500,   "chegirma_foiz": 5,  "emoji": "🥇", "nomi": "Gold"},
    "platinum": {"min_ball": 2000,  "chegirma_foiz": 10, "emoji": "💎", "nomi": "Platinum"},
}


def daraja_aniqla(jami_ball: int) -> dict:
    """Klient darajasini aniqlash."""
    natija = DARAJALAR["bronze"]
    for key, val in DARAJALAR.items():
        if jami_ball >= val["min_ball"]:
            natija = {**val, "key": key}
    return natija


def ball_hisoblash(summa: float, nisbat: float = None) -> int:
    """Sotuv summasidan ball hisoblash."""
    n = Decimal(str(nisbat)) if nisbat else DEFAULT_BALL_NISBAT
    if n <= 0:
        return 0
    return int(Decimal(str(summa)) / n)


async def klient_ball_qoshish(conn, uid: int, klient_id: int,
                                summa: float, sessiya_id: int | None = None,
                                izoh: str = "Sotuv bonusi") -> dict:
    """Klientga ball qo'shish."""
    ball = ball_hisoblash(summa)
    if ball <= 0:
        return {"ball": 0, "status": "kam_summa"}

    try:
        await conn.execute("""
            INSERT INTO loyalty_ballar
                (user_id, klient_id, ball, tur, sessiya_id, izoh)
            VALUES ($1, $2, $3, 'yigish', $4, $5)
        """, uid, klient_id, ball, sessiya_id, izoh)

        # Jami ball yangilash
        jami = await conn.fetchval("""
            SELECT COALESCE(SUM(CASE WHEN tur='yigish' THEN ball ELSE -ball END), 0)
            FROM loyalty_ballar
            WHERE user_id = $1 AND klient_id = $2
        """, uid, klient_id) or 0

        daraja = daraja_aniqla(int(jami))
        return {
            "ball": ball,
            "jami_ball": int(jami),
            "daraja": daraja,
            "status": "qoshildi",
        }
    except Exception as e:
        log.debug("Loyalty ball: %s", e)
        return {"ball": 0, "status": "xato", "xato": str(e)}


async def klient_ball_sarflash(conn, uid: int, klient_id: int,
                                 ball: int, izoh: str = "Chegirma") -> dict:
    """Klient ballini chegirmaga sarflash."""
    # Mavjud ball tekshirish
    jami = await conn.fetchval("""
        SELECT COALESCE(SUM(CASE WHEN tur='yigish' THEN ball ELSE -ball END), 0)
        FROM loyalty_ballar
        WHERE user_id = $1 AND klient_id = $2
    """, uid, klient_id) or 0

    if int(jami) < ball:
        return {"status": "yetarli_emas", "mavjud": int(jami), "soralgan": ball}

    await conn.execute("""
        INSERT INTO loyalty_ballar
            (user_id, klient_id, ball, tur, izoh)
        VALUES ($1, $2, $3, 'sarflash', $4)
    """, uid, klient_id, ball, izoh)

    yangi_jami = int(jami) - ball
    daraja = daraja_aniqla(yangi_jami)

    # Ball → so'm konvertatsiya
    summa = float(Decimal(str(ball)) * DEFAULT_BALL_NISBAT)

    return {
        "sarflandi": ball,
        "chegirma_summa": summa,
        "qolgan_ball": yangi_jami,
        "daraja": daraja,
        "status": "sarflandi",
    }


async def klient_loyalty_profil(conn, uid: int, klient_id: int) -> dict:
    """Klient loyalty profili."""
    jami = await conn.fetchval("""
        SELECT COALESCE(SUM(CASE WHEN tur='yigish' THEN ball ELSE -ball END), 0)
        FROM loyalty_ballar
        WHERE user_id = $1 AND klient_id = $2
    """, uid, klient_id) or 0

    jami_yigilgan = await conn.fetchval("""
        SELECT COALESCE(SUM(ball), 0) FROM loyalty_ballar
        WHERE user_id = $1 AND klient_id = $2 AND tur = 'yigish'
    """, uid, klient_id) or 0

    jami_sarflangan = await conn.fetchval("""
        SELECT COALESCE(SUM(ball), 0) FROM loyalty_ballar
        WHERE user_id = $1 AND klient_id = $2 AND tur = 'sarflash'
    """, uid, klient_id) or 0

    daraja = daraja_aniqla(int(jami))

    # Keyingi daraja
    keyingi = None
    for key, val in DARAJALAR.items():
        if val["min_ball"] > int(jami):
            keyingi = {
                "nomi": val["nomi"],
                "kerak_ball": val["min_ball"] - int(jami),
                "chegirma_foiz": val["chegirma_foiz"],
            }
            break

    return {
        "mavjud_ball": int(jami),
        "jami_yigilgan": int(jami_yigilgan),
        "jami_sarflangan": int(jami_sarflangan),
        "daraja": daraja,
        "keyingi_daraja": keyingi,
        "ball_qiymati": f"1 ball = {float(DEFAULT_BALL_NISBAT):,.0f} so'm",
    }
