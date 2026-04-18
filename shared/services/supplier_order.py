"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — SUPPLIER AUTO-ORDER                          ║
║  Kam qoldiqli tovarlar uchun avtomatik buyurtma                 ║
║                                                                  ║
║  FLOW:                                                           ║
║  1. Ombor prognoz → kam qoldiqli tovarlar aniqlash              ║
║  2. Har tovarning yetkazib beruvchisini topish                  ║
║  3. Buyurtma tayyorlash (2 haftalik zaxira)                     ║
║  4. Do'konchiga tasdiqlash uchun ko'rsatish                     ║
║  5. Tasdiqlangach → supplier ga Telegram xabar                  ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from decimal import Decimal

log = logging.getLogger(__name__)


async def avtomatik_buyurtma_tayyorla(conn, uid: int, kunlar: int = 30) -> dict:
    """
    Kam qoldiqli tovarlar uchun buyurtma tayyorlash.
    Ombor prognoz asosida 2 haftalik zaxira hisoblash.
    """
    from shared.services.ombor_prognoz import ombor_prognoz

    tovarlar = await ombor_prognoz(conn, uid, kunlar=kunlar, limit=100)

    # Faqat buyurtma kerak bo'lganlar
    kerakli = [t for t in tovarlar if t["buyurtma_kerak"] and t["buyurtma_miqdor"] > 0]

    if not kerakli:
        return {"buyurtma_kerak": False, "tovarlar": [], "jami_summa": 0}

    jami_summa = sum(t["buyurtma_narx"] for t in kerakli)

    return {
        "buyurtma_kerak": True,
        "tovarlar": [
            {
                "id": t["id"],
                "nomi": t["nomi"],
                "birlik": t["birlik"],
                "qoldiq": t["qoldiq"],
                "kunlik_sotuv": t["kunlik_sotuv"],
                "qolgan_kun": t["qolgan_kun"],
                "buyurtma_miqdor": t["buyurtma_miqdor"],
                "buyurtma_narx": t["buyurtma_narx"],
                "holat": t["holat"],
            }
            for t in kerakli
        ],
        "jami_summa": round(jami_summa),
        "tovar_soni": len(kerakli),
    }


async def buyurtma_saqlash(conn, uid: int, supplier_id: int,
                            tovarlar: list, izoh: str = "") -> dict:
    """Supplier buyurtmasini DB ga saqlash."""
    jami = sum(Decimal(str(t.get("buyurtma_narx", 0))) for t in tovarlar)

    row = await conn.fetchrow("""
        INSERT INTO supplier_buyurtmalar
            (user_id, supplier_id, jami_summa, tovarlar, izoh)
        VALUES ($1, $2, $3, $4::jsonb, $5)
        RETURNING id, holat, yaratilgan
    """, uid, supplier_id, jami, json.dumps(tovarlar), izoh)

    return {
        "id": row["id"],
        "holat": row["holat"],
        "jami_summa": float(jami),
        "tovar_soni": len(tovarlar),
    }


async def supplier_xabar_matni(conn, uid: int, buyurtma_id: int) -> str:
    """Supplier uchun Telegram xabar matni tayyorlash."""
    b = await conn.fetchrow("""
        SELECT sb.*, yb.nomi AS supplier_nomi, u.dokon_nomi
        FROM supplier_buyurtmalar sb
        JOIN yetkazib_beruvchilar yb ON yb.id = sb.supplier_id
        JOIN users u ON u.id = sb.user_id
        WHERE sb.id = $1 AND sb.user_id = $2
    """, buyurtma_id, uid)

    if not b:
        return ""

    tovarlar = json.loads(b["tovarlar"]) if isinstance(b["tovarlar"], str) else b["tovarlar"]
    matn = (
        f"📦 *YANGI BUYURTMA*\n"
        f"Do'kon: {b['dokon_nomi']}\n"
        f"━━━━━━━━━━━━━━━━━━\n\n"
    )

    for i, t in enumerate(tovarlar, 1):
        matn += (
            f"{i}. {t.get('nomi', '?')}\n"
            f"   Miqdor: {t.get('buyurtma_miqdor', 0)} {t.get('birlik', 'dona')}\n"
        )
        if t.get("buyurtma_narx", 0) > 0:
            matn += f"   Narx: {t['buyurtma_narx']:,.0f} so'm\n"
        matn += "\n"

    matn += (
        f"━━━━━━━━━━━━━━━━━━\n"
        f"💰 Jami: {float(b['jami_summa']):,.0f} so'm\n"
        f"📅 Sana: {b['yaratilgan'].strftime('%d.%m.%Y %H:%M')}\n"
    )
    if b.get("izoh"):
        matn += f"📝 Izoh: {b['izoh']}\n"

    return matn


async def yetkazib_beruvchilar_list(conn, uid: int) -> list[dict]:
    """Barcha yetkazib beruvchilar."""
    rows = await conn.fetch("""
        SELECT id, nomi, telefon, telegram_id, kategoriyalar, faol
        FROM yetkazib_beruvchilar
        WHERE user_id = $1 AND faol = TRUE
        ORDER BY nomi
    """, uid)
    return [dict(r) for r in rows]
