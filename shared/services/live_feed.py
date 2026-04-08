"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — REAL-TIME LIVE FEED (JONLI OQIM)                     ║
║                                                                          ║
║  Shopify Live View / Stripe Dashboard analog:                            ║
║  Hamma narsa REAL-TIME — sotuv, klient, qarz, ombor:                   ║
║                                                                          ║
║  ┌───────────────────────────────────────────────────┐                  ║
║  │  💰 14:32  Nasriddin aka — 560,000 so'm sotuv    │                  ║
║  │  👤 14:28  Yangi klient: Lobar opa               │                  ║
║  │  💳 14:25  Qarz to'landi: Akmal — 120,000        │                  ║
║  │  📦 14:20  Coca-Cola 1.5L qoldig'i tugadi!       │                  ║
║  │  📍 14:15  Check-in: Do'kon #42                  │                  ║
║  │  🎁 14:10  Aksiya boshlandi: 10% chegirma        │                  ║
║  └───────────────────────────────────────────────────┘                  ║
║                                                                          ║
║  Mavjud WebSocket ConnectionManager ga integratsiya qilinadi.           ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

log = logging.getLogger(__name__)


class LiveEvent:
    """Jonli oqim eventi."""

    def __init__(self, turi: str, emoji: str, sarlavha: str,
                 tafsilot: str = "", summa: Optional[str] = None,
                 klient: str = "", muhimlik: str = "oddiy"):
        self.turi = turi
        self.emoji = emoji
        self.sarlavha = sarlavha
        self.tafsilot = tafsilot
        self.summa = summa
        self.klient = klient
        self.muhimlik = muhimlik  # oddiy, muhim, kritik
        self.vaqt = datetime.utcnow().isoformat()

    def to_dict(self) -> dict:
        return {
            "type": "live_event",
            "turi": self.turi,
            "emoji": self.emoji,
            "sarlavha": self.sarlavha,
            "tafsilot": self.tafsilot,
            "summa": self.summa,
            "klient": self.klient,
            "muhimlik": self.muhimlik,
            "vaqt": self.vaqt,
        }


# ════════════════════════════════════════════════════════════
#  EVENT YARATISH FUNKSIYALARI
# ════════════════════════════════════════════════════════════

def sotuv_eventi(klient_nomi: str, summa: Decimal, tovarlar_soni: int) -> LiveEvent:
    return LiveEvent(
        turi="sotuv", emoji="💰",
        sarlavha=f"{klient_nomi}ga sotuv",
        tafsilot=f"{tovarlar_soni} xil tovar",
        summa=f"{summa:,.0f}", klient=klient_nomi)

def klient_eventi(klient_nomi: str) -> LiveEvent:
    return LiveEvent(
        turi="klient", emoji="👤",
        sarlavha=f"Yangi klient: {klient_nomi}",
        klient=klient_nomi)

def qarz_eventi(klient_nomi: str, summa: Decimal) -> LiveEvent:
    return LiveEvent(
        turi="qarz_tolov", emoji="💳",
        sarlavha=f"Qarz to'landi",
        tafsilot=klient_nomi, summa=f"{summa:,.0f}",
        klient=klient_nomi)

def qoldiq_eventi(tovar_nomi: str, qoldiq: int) -> LiveEvent:
    return LiveEvent(
        turi="qoldiq_tugadi", emoji="📦",
        sarlavha=f"{tovar_nomi} qoldig'i kam!",
        tafsilot=f"Qoldiq: {qoldiq} dona",
        muhimlik="muhim" if qoldiq > 0 else "kritik")

def checkin_eventi(klient_nomi: str) -> LiveEvent:
    return LiveEvent(
        turi="checkin", emoji="📍",
        sarlavha=f"Check-in: {klient_nomi}",
        klient=klient_nomi)

def aksiya_eventi(aksiya_nomi: str) -> LiveEvent:
    return LiveEvent(
        turi="aksiya", emoji="🎁",
        sarlavha=f"Aksiya: {aksiya_nomi}")

def xato_eventi(xabar: str) -> LiveEvent:
    return LiveEvent(
        turi="xato", emoji="⚠️",
        sarlavha=xabar, muhimlik="kritik")


# ════════════════════════════════════════════════════════════
#  LIVE DASHBOARD MA'LUMOTLARI
# ════════════════════════════════════════════════════════════

async def live_dashboard(conn, uid: int) -> dict:
    """Real-time dashboard — hozirgi holat."""

    # Bugungi statistika
    bugun = await conn.fetchrow("""
        SELECT
            COUNT(*) AS sotuv_soni,
            COALESCE(SUM(jami), 0) AS jami_sotuv,
            COALESCE(SUM(tolangan), 0) AS tolangan,
            COALESCE(SUM(qarz), 0) AS qarz_berildi,
            COUNT(DISTINCT klient_id) AS klient_soni
        FROM sotuvlar
        WHERE user_id=$1 AND sana::date = CURRENT_DATE
    """, uid)

    # Kechagiga nisbatan
    kecha = await conn.fetchrow("""
        SELECT COALESCE(SUM(jami), 0) AS jami
        FROM sotuvlar
        WHERE user_id=$1 AND sana::date = CURRENT_DATE - 1
    """, uid)

    bugun_summa = float(bugun["jami_sotuv"] or 0)
    kecha_summa = float(kecha["jami"] or 0)
    osish = ((bugun_summa - kecha_summa) / kecha_summa * 100) if kecha_summa > 0 else 0

    # Kam qoldiqli tovarlar
    kam_qoldiq = await conn.fetchval(
        "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1 AND qoldiq > 0 AND qoldiq <= 5 AND faol=TRUE",
        uid) or 0

    # Qarz statistika
    jami_qarz = await conn.fetchval(
        "SELECT COALESCE(SUM(qarz), 0) FROM sotuvlar WHERE user_id=$1 AND qarz > 0",
        uid) or 0

    # Oxirgi 10 sotuv (live feed)
    oxirgi = await conn.fetch("""
        SELECT s.id, s.sana, s.jami, s.tolangan, s.qarz,
               k.nom AS klient_nomi, s.holat,
               (SELECT COUNT(*) FROM sotuv_tafsilot WHERE sotuv_id=s.id) AS tovar_soni
        FROM sotuvlar s
        LEFT JOIN klientlar k ON k.id = s.klient_id
        WHERE s.user_id=$1
        ORDER BY s.sana DESC LIMIT 10
    """, uid)

    return {
        "bugun": {
            "sotuv_soni": bugun["sotuv_soni"],
            "jami_sotuv": str(bugun["jami_sotuv"]),
            "tolangan": str(bugun["tolangan"]),
            "qarz": str(bugun["qarz_berildi"]),
            "klient_soni": bugun["klient_soni"],
            "osish_foiz": round(osish, 1),
        },
        "ogohlantirishlar": {
            "kam_qoldiq": kam_qoldiq,
            "jami_qarz": str(jami_qarz),
        },
        "oxirgi_sotuvlar": [{
            "id": r["id"],
            "vaqt": r["sana"].isoformat() if r["sana"] else "",
            "summa": str(r["jami"]),
            "klient": r["klient_nomi"] or "Noma'lum",
            "tovar_soni": r["tovar_soni"],
            "holat": r["holat"],
        } for r in oxirgi],
        "server_vaqt": datetime.utcnow().isoformat(),
    }
