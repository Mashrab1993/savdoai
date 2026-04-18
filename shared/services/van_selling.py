"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — VAN SELLING (YETKAZIB BERISH BOSHQARUVI)     ║
║                                                                  ║
║  SD Agent vsExchange dan o'rganilgan:                            ║
║  • Mashina → agent ombor → klient yetkazish zanjiri            ║
║  • Yo'l xaritasi (route planning)                                ║
║  • Real-time inventar kuzatish                                   ║
║  • Qaytarish boshqaruvi                                          ║
║  • Yetkazish tasdiqlash (GPS + foto)                             ║
║                                                                  ║
║  FLOW:                                                           ║
║  1. Ombor → Agent (yuklash akti)                                ║
║  2. Agent → Klient (yetkazish + sotuv)                          ║
║  3. Klient → Agent (qaytarish)                                  ║
║  4. Agent → Ombor (qoldiq qaytarish)                            ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from enum import Enum

log = logging.getLogger(__name__)


class YetkazishHolati(str, Enum):
    TAYYORLANGAN = "tayyorlangan"   # Omborda tayyorlangan
    YUKLANGAN = "yuklangan"          # Mashinaga yuklangan
    YOLDA = "yolda"                  # Yetkazish jarayonida
    YETKAZILDI = "yetkazildi"        # Klientga topshirildi
    QAYTARILDI = "qaytarildi"        # Klient rad etdi
    YAKUNLANDI = "yakunlandi"        # Barcha hisob-kitob tugadi


VAN_SELLING_MIGRATION = """
-- Van selling asosiy jadvali
CREATE TABLE IF NOT EXISTS van_marshrut (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    sana DATE NOT NULL DEFAULT CURRENT_DATE,
    mashina_raqami VARCHAR(20),
    haydovchi VARCHAR(100),
    holat VARCHAR(20) DEFAULT 'tayyorlangan',
    boshlangan TIMESTAMPTZ,
    yakunlangan TIMESTAMPTZ,
    jami_summa NUMERIC(18,2) DEFAULT 0,
    yetkazilgan_summa NUMERIC(18,2) DEFAULT 0,
    qaytarilgan_summa NUMERIC(18,2) DEFAULT 0,
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_van_marshrut_user ON van_marshrut(user_id, sana DESC);

-- Yuklash akti (ombor → mashina)
CREATE TABLE IF NOT EXISTS van_yuklash (
    id SERIAL PRIMARY KEY,
    marshrut_id INTEGER NOT NULL REFERENCES van_marshrut(id),
    tovar_id INTEGER NOT NULL,
    tovar_nomi VARCHAR(200),
    miqdor NUMERIC(12,2) NOT NULL,
    narx NUMERIC(18,2) NOT NULL,
    summa NUMERIC(18,2) NOT NULL,
    qoldiq NUMERIC(12,2),  -- hozir mashinada qolgan
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_van_yuklash_marshrut ON van_yuklash(marshrut_id);

-- Yetkazish nuqtalari (klient bo'yicha)
CREATE TABLE IF NOT EXISTS van_yetkazish (
    id SERIAL PRIMARY KEY,
    marshrut_id INTEGER NOT NULL REFERENCES van_marshrut(id),
    klient_id INTEGER NOT NULL,
    klient_nomi VARCHAR(200),
    tartib_raqami INTEGER DEFAULT 0,
    holat VARCHAR(20) DEFAULT 'kutilmoqda',
    yetkazilgan_summa NUMERIC(18,2) DEFAULT 0,
    qaytarilgan_summa NUMERIC(18,2) DEFAULT 0,
    yetkazish_vaqti TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    foto_url TEXT,
    izoh TEXT
);
CREATE INDEX IF NOT EXISTS idx_van_yetkazish ON van_yetkazish(marshrut_id, tartib_raqami);

-- Yetkazish tafsilot (qaysi tovar qancha)
CREATE TABLE IF NOT EXISTS van_yetkazish_tafsilot (
    id SERIAL PRIMARY KEY,
    yetkazish_id INTEGER NOT NULL REFERENCES van_yetkazish(id),
    tovar_id INTEGER NOT NULL,
    tovar_nomi VARCHAR(200),
    miqdor NUMERIC(12,2) NOT NULL,
    narx NUMERIC(18,2) NOT NULL,
    summa NUMERIC(18,2) NOT NULL,
    qaytarilgan_miqdor NUMERIC(12,2) DEFAULT 0
);
"""


# ════════════════════════════════════════════════════════════
#  MARSHRUT YARATISH
# ════════════════════════════════════════════════════════════

async def marshrut_yaratish(conn, uid: int, data: dict) -> int:
    """Yangi van selling marshruti yaratish."""
    mid = await conn.fetchval("""
        INSERT INTO van_marshrut (user_id, sana, mashina_raqami, haydovchi, izoh)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
    """, uid, data.get("sana", date.today()),
        data.get("mashina_raqami"), data.get("haydovchi"), data.get("izoh"))

    # Tovarlarni yuklash
    for t in data.get("tovarlar", []):
        miqdor = Decimal(str(t["miqdor"]))
        narx = Decimal(str(t["narx"]))
        await conn.execute("""
            INSERT INTO van_yuklash (marshrut_id, tovar_id, tovar_nomi, miqdor, narx, summa, qoldiq)
            VALUES ($1, $2, $3, $4, $5, $6, $4)
        """, mid, t["tovar_id"], t.get("tovar_nomi", ""), miqdor, narx, miqdor * narx)

        # Ombordan chiqarish
        await conn.execute(
            "UPDATE tovarlar SET qoldiq = COALESCE(qoldiq,0) - $1 WHERE id=$2 AND user_id=$3",
            miqdor, t["tovar_id"], uid)

    # Klientlarni qo'shish
    for i, k in enumerate(data.get("klientlar", [])):
        await conn.execute("""
            INSERT INTO van_yetkazish (marshrut_id, klient_id, klient_nomi, tartib_raqami)
            VALUES ($1, $2, $3, $4)
        """, mid, k["klient_id"], k.get("klient_nomi", ""), i + 1)

    jami = await conn.fetchval(
        "SELECT COALESCE(SUM(summa),0) FROM van_yuklash WHERE marshrut_id=$1", mid)
    await conn.execute("UPDATE van_marshrut SET jami_summa=$1 WHERE id=$2", jami, mid)

    log.info("Van marshrut yaratildi: id=%s tovar=%s klient=%s",
             mid, len(data.get("tovarlar", [])), len(data.get("klientlar", [])))
    return mid


async def yetkazish_tasdiqlash(conn, uid: int, yetkazish_id: int,
                                 tovarlar: list[dict],
                                 lat: float = None, lon: float = None,
                                 foto_url: str = None) -> dict:
    """Klientga yetkazishni tasdiqlash."""
    jami = Decimal("0")
    for t in tovarlar:
        miqdor = Decimal(str(t["miqdor"]))
        narx = Decimal(str(t["narx"]))
        summa = miqdor * narx
        jami += summa
        await conn.execute("""
            INSERT INTO van_yetkazish_tafsilot (yetkazish_id, tovar_id, tovar_nomi, miqdor, narx, summa)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, yetkazish_id, t["tovar_id"], t.get("tovar_nomi", ""), miqdor, narx, summa)

        # Mashina qoldig'ini kamaytirish
        marshrut_id = await conn.fetchval(
            "SELECT marshrut_id FROM van_yetkazish WHERE id=$1", yetkazish_id)
        await conn.execute("""
            UPDATE van_yuklash SET qoldiq = COALESCE(qoldiq,0) - $1
            WHERE marshrut_id=$2 AND tovar_id=$3
        """, miqdor, marshrut_id, t["tovar_id"])

    await conn.execute("""
        UPDATE van_yetkazish SET holat='yetkazildi', yetkazilgan_summa=$1,
            yetkazish_vaqti=NOW(), latitude=$2, longitude=$3, foto_url=$4
        WHERE id=$5
    """, jami, lat, lon, foto_url, yetkazish_id)

    return {"muvaffaqiyat": True, "summa": str(jami)}


async def marshrut_yakunlash(conn, uid: int, marshrut_id: int) -> dict:
    """Marshrutni yakunlash — qolgan tovarlarni omborga qaytarish."""
    qolganlar = await conn.fetch(
        "SELECT tovar_id, qoldiq FROM van_yuklash WHERE marshrut_id=$1 AND qoldiq > 0",
        marshrut_id)

    for row in qolganlar:
        await conn.execute(
            "UPDATE tovarlar SET qoldiq = COALESCE(qoldiq,0) + $1 WHERE id=$2 AND user_id=$3",
            row["qoldiq"], row["tovar_id"], uid)

    yetkazilgan = await conn.fetchval(
        "SELECT COALESCE(SUM(yetkazilgan_summa),0) FROM van_yetkazish WHERE marshrut_id=$1",
        marshrut_id)
    qaytarilgan = await conn.fetchval(
        "SELECT COALESCE(SUM(qaytarilgan_summa),0) FROM van_yetkazish WHERE marshrut_id=$1",
        marshrut_id)

    await conn.execute("""
        UPDATE van_marshrut SET holat='yakunlandi', yakunlangan=NOW(),
            yetkazilgan_summa=$1, qaytarilgan_summa=$2
        WHERE id=$3
    """, yetkazilgan, qaytarilgan, marshrut_id)

    return {
        "marshrut_id": marshrut_id,
        "yetkazilgan": str(yetkazilgan),
        "qaytarilgan": str(qaytarilgan),
        "omborga_qaytarilgan_tovar": len(qolganlar),
    }


async def marshrut_holati(conn, uid: int, marshrut_id: int) -> dict:
    """Marshrut to'liq holati — dashboard uchun."""
    marshrut = await conn.fetchrow(
        "SELECT * FROM van_marshrut WHERE id=$1 AND user_id=$2", marshrut_id, uid)
    if not marshrut:
        return {"xato": "Marshrut topilmadi"}

    yuklangan = await conn.fetch(
        "SELECT * FROM van_yuklash WHERE marshrut_id=$1 ORDER BY id", marshrut_id)
    nuqtalar = await conn.fetch(
        "SELECT * FROM van_yetkazish WHERE marshrut_id=$1 ORDER BY tartib_raqami", marshrut_id)

    return {
        "marshrut": dict(marshrut),
        "yuklangan_tovarlar": [dict(r) for r in yuklangan],
        "yetkazish_nuqtalari": [dict(r) for r in nuqtalar],
        "statistika": {
            "jami_nuqtalar": len(nuqtalar),
            "yetkazilgan": sum(1 for n in nuqtalar if n["holat"] == "yetkazildi"),
            "kutilmoqda": sum(1 for n in nuqtalar if n["holat"] == "kutilmoqda"),
        }
    }
