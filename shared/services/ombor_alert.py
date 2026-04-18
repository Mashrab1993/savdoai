"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — OMBOR OGOHLANTIRISH (Inventory Alerts)  ║
║                                                              ║
║  Sotuv qilinganda qoldiq kam bo'lsa → Telegram xabar        ║
║  Kunlik avtomatik tekshirish → admin ga ogohlantirish       ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

log = logging.getLogger(__name__)


async def sotuv_keyingi_qoldiq_tekshir(uid: int, conn, bot_token: str = "") -> list[str]:
    """
    Sotuv bo'lgandan keyin kam qoldiqli tovarlarni tekshirish.
    Telegram xabar yuboradi (agar bot_token bo'lsa).
    
    Qaytaradi: ogohlantirish matnlari ro'yxati.
    """
    ogohlar = []
    try:
        kam_tovarlar = await conn.fetch("""
            SELECT nomi, qoldiq, min_qoldiq FROM tovarlar
            WHERE user_id=$1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq
            AND qoldiq >= 0
            ORDER BY (qoldiq / NULLIF(min_qoldiq, 0)) ASC
            LIMIT 10
        """, uid)

        if not kam_tovarlar:
            return []

        for t in kam_tovarlar:
            qoldiq = float(t["qoldiq"])
            min_q = float(t["min_qoldiq"])
            if qoldiq == 0:
                ogohlar.append(f"🚨 {t['nomi']}: TUGADI!")
            else:
                ogohlar.append(
                    f"⚠️ {t['nomi']}: qoldiq {qoldiq:.0f}, min {min_q:.0f}"
                )

        # Telegram xabar yuborish
        if ogohlar and bot_token:
            matn = (
                "📦 *KAM QOLDIQ OGOHLANTIRISH*\n\n"
                + "\n".join(ogohlar)
                + "\n\n💡 Tovar buyurtma qilishni unutmang!"
            )
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={
                            "chat_id": uid,
                            "text": matn,
                            "parse_mode": "Markdown",
                        },
                    )
            except Exception as e:
                log.debug("Kam qoldiq TG xabar: %s", e)

    except Exception as e:
        log.warning("Kam qoldiq tekshirish xato: %s", e)

    return ogohlar


async def kunlik_ombor_tekshir(conn, bot_token: str = "") -> dict:
    """
    Barcha faol foydalanuvchilar uchun ombor tekshirish.
    Scheduler (job) dan chaqiriladi.
    """
    stats = {"tekshirildi": 0, "ogohlangan": 0, "xato": 0}

    try:
        users = await conn.fetch(
            "SELECT id FROM users WHERE faol=TRUE"
        )
        for u in users:
            uid = u["id"]
            stats["tekshirildi"] += 1
            try:
                ogohlar = await sotuv_keyingi_qoldiq_tekshir(
                    uid, conn, bot_token
                )
                if ogohlar:
                    stats["ogohlangan"] += 1
            except Exception as e:
                stats["xato"] += 1
                log.debug("Ombor tekshir uid=%d: %s", uid, e)

    except Exception as e:
        log.error("Kunlik ombor tekshir: %s", e)

    return stats
