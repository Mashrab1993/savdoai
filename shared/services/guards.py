"""
╔══════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 — SAFETY GUARDS                               ║
║                                                                      ║
║  🛡️ Duplicate voice protection (5 soniya ichida bir xil xabar)     ║
║  🛡️ Stock safety (manfiy qoldiq himoyasi)                          ║
║  🛡️ Debt limit guard                                               ║
║  🛡️ Concurrent edit protection                                      ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import hashlib
import logging
import time
from decimal import Decimal
from typing import Any, Optional

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  DUPLICATE MESSAGE GUARD
# ════════════════════════════════════════════════════════════════════

_recent_messages: dict[str, float] = {}
_DUPLICATE_WINDOW = 5.0  # 5 sekund ichida bir xil xabar = duplicate

def is_duplicate_message(user_id: int, content: str) -> bool:
    """
    Bir xil xabar 5 sekund ichida takroriy yuborilganini aniqlash.
    Voice retry, network glitch, yoki ikki marta bosish holatlarini to'xtatadi.
    """
    h = hashlib.md5(f"{user_id}:{content[:200]}".encode()).hexdigest()
    now = time.monotonic()
    
    # Eski yozuvlarni tozalash (60s dan eski)
    expired = [k for k, t in _recent_messages.items() if now - t > 60]
    for k in expired:
        _recent_messages.pop(k, None)
    
    if h in _recent_messages and now - _recent_messages[h] < _DUPLICATE_WINDOW:
        log.warning("Duplicate message detected: uid=%d hash=%s", user_id, h[:8])
        return True
    
    _recent_messages[h] = now
    return False


# ════════════════════════════════════════════════════════════════════
#  STOCK SAFETY
# ════════════════════════════════════════════════════════════════════

async def tekshir_qoldiq(conn, uid: int, tovarlar: list) -> list[dict]:
    """
    Ombor qoldiq tekshiruvi — sotishdan OLDIN chaqiriladi.
    
    Qaytaradi: yetishmaydigan tovarlar ro'yxati
    [{"nomi": "Ariel", "qoldiq": 10, "soralgan": 50, "kamchilik": 40}]
    """
    kamchiliklar = []
    for t in tovarlar:
        nomi = t.get("nomi", "")
        miqdor = Decimal(str(t.get("miqdor", 0)))
        if not nomi or miqdor <= 0:
            continue
        
        row = await conn.fetchrow("""
            SELECT qoldiq FROM tovarlar
            WHERE user_id = $1 AND lower(nomi) = lower($2)
        """, uid, nomi.strip())
        
        if row is None:
            # Yangi tovar — qoldiq tekshiruv kerak emas
            continue
        
        qoldiq = Decimal(str(row["qoldiq"]))
        if qoldiq < miqdor:
            kamchiliklar.append({
                "nomi": nomi,
                "qoldiq": float(qoldiq),
                "soralgan": float(miqdor),
                "kamchilik": float(miqdor - qoldiq),
            })
    
    return kamchiliklar


# ════════════════════════════════════════════════════════════════════
#  DEBT LIMIT GUARD
# ════════════════════════════════════════════════════════════════════

async def tekshir_qarz_limit(conn, uid: int, klient_ismi: str,
                               yangi_qarz: Decimal) -> dict:
    """
    Klient qarz limitini tekshirish.
    
    Qaytaradi: {
        "ruxsat": True/False,
        "joriy_qarz": Decimal,
        "limit": Decimal,
        "yangi_jami": Decimal,
        "ogohlantirish": str yoki None
    }
    """
    row = await conn.fetchrow("""
        SELECT 
            k.kredit_limit,
            COALESCE(SUM(q.qolgan), 0) AS joriy_qarz
        FROM klientlar k
        LEFT JOIN qarzlar q ON q.klient_id = k.id AND q.yopildi = FALSE
        WHERE k.user_id = $1 AND lower(k.ism) = lower($2)
        GROUP BY k.id
    """, uid, klient_ismi.strip())
    
    if not row:
        return {"ruxsat": True, "joriy_qarz": Decimal("0"),
                "limit": Decimal("0"), "yangi_jami": yangi_qarz,
                "ogohlantirish": None}
    
    joriy = Decimal(str(row["joriy_qarz"]))
    limit = Decimal(str(row["kredit_limit"]))
    yangi_jami = joriy + yangi_qarz
    
    if limit > 0 and yangi_jami > limit:
        return {
            "ruxsat": False,
            "joriy_qarz": joriy,
            "limit": limit,
            "yangi_jami": yangi_jami,
            "ogohlantirish": (
                f"⚠️ QARZ LIMITI OSHDI!\n"
                f"Joriy qarz: {joriy:,.0f}\n"
                f"Yangi qarz: {yangi_qarz:,.0f}\n"
                f"Jami: {yangi_jami:,.0f}\n"
                f"Limit: {limit:,.0f}"
            ),
        }
    
    # Limitda bo'lmasa ham 80% dan oshganda ogohlantirish
    if limit > 0 and yangi_jami > limit * Decimal("0.8"):
        return {
            "ruxsat": True,
            "joriy_qarz": joriy,
            "limit": limit,
            "yangi_jami": yangi_jami,
            "ogohlantirish": f"⚠️ Qarz limitning {yangi_jami*100/limit:.0f}% ga yetdi",
        }
    
    return {"ruxsat": True, "joriy_qarz": joriy,
            "limit": limit, "yangi_jami": yangi_jami,
            "ogohlantirish": None}


# ════════════════════════════════════════════════════════════════════
#  PRICE SANITY CHECK
# ════════════════════════════════════════════════════════════════════

async def tekshir_narx(conn, uid: int, tovarlar: list) -> list[str]:
    """
    Narx tekshiruvi — noodatiy narxlarni aniqlash.
    
    Qaytaradi: ogohlantirishlar ro'yxati
    """
    warnings = []
    for t in tovarlar:
        nomi = t.get("nomi", "")
        narx = Decimal(str(t.get("narx", 0)))
        if not nomi or narx <= 0:
            continue
        
        # DB dan o'rtacha narx olish
        row = await conn.fetchrow("""
            SELECT sotish_narxi, olish_narxi FROM tovarlar
            WHERE user_id = $1 AND lower(nomi) = lower($2)
        """, uid, nomi.strip())
        
        if not row or not row["sotish_narxi"]:
            continue
        
        db_narx = Decimal(str(row["sotish_narxi"]))
        if db_narx > 0:
            farq = abs(narx - db_narx) / db_narx
            if farq > Decimal("0.5"):  # 50% dan katta farq
                warnings.append(
                    f"⚠️ {nomi}: narx {narx:,.0f} (odatiy: {db_narx:,.0f}, "
                    f"farq: {farq*100:.0f}%)"
                )
        
        # Zarar sotuv tekshiruvi
        olish = Decimal(str(row.get("olish_narxi", 0) or 0))
        if olish > 0 and narx < olish:
            warnings.append(
                f"🔴 ZARAR: {nomi}: sotish={narx:,.0f} < olish={olish:,.0f}"
            )
    
    return warnings
