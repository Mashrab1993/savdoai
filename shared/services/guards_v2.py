"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KENGAYTIRILGAN GUARDS                        ║
║                                                                  ║
║  SD Agent AddOrderPresenter.noSaveOrder() dan o'rganilgan:       ║
║  • Buyurtma bekor qilganda ombor qoldiqni qaytarish             ║
║  • Check-in/out tizimi (GPS bilan)                               ║
║  • Buyurtma amallar menyusi (15 ta amal)                         ║
║  • Ombor qoldiq boshqaruvi (multi-store)                         ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════
#  OMBOR QOLDIQ QAYTARISH (SD Agent noSaveOrder analog)
# ════════════════════════════════════════════════════════════

async def qoldiq_qaytarish(conn, uid: int, sotuv_id: int) -> dict:
    """Buyurtma bekor qilganda ombor qoldiqlarini qaytarish.

    SD Agent'dagi noSaveOrder() funksiyasining analogi.
    Sotuv tafsilotlaridan har bir tovarning miqdorini
    qoldiqqa qaytaradi.

    Args:
        conn: asyncpg connection (RLS)
        uid: foydalanuvchi ID
        sotuv_id: bekor qilinayotgan sotuv ID

    Returns:
        {"qaytarilgan": soni, "tovarlar": [...]}
    """
    # Sotuv tafsilotlarini olish
    tafsilotlar = await conn.fetch("""
        SELECT st.tovar_id, st.miqdor, st.narx, t.nomi
        FROM sotuv_tafsilot st
        JOIN tovarlar t ON t.id = st.tovar_id
        WHERE st.sotuv_id = $1
    """, sotuv_id)

    if not tafsilotlar:
        return {"qaytarilgan": 0, "tovarlar": []}

    qaytarilgan = []
    for row in tafsilotlar:
        # Qoldiqni qaytarish
        await conn.execute("""
            UPDATE tovarlar
            SET qoldiq = COALESCE(qoldiq, 0) + $1
            WHERE id = $2 AND user_id = $3
        """, row["miqdor"], row["tovar_id"], uid)

        qaytarilgan.append({
            "tovar_id": row["tovar_id"],
            "nomi": row["nomi"],
            "miqdor": float(row["miqdor"]),
        })

        log.info("Qoldiq qaytarildi: tovar=%s miqdor=%s sotuv=%s",
                 row["nomi"], row["miqdor"], sotuv_id)

    # Sotuv holatini yangilash
    await conn.execute("""
        UPDATE sotuvlar SET holat = 'bekor', bekor_vaqti = NOW()
        WHERE id = $1 AND user_id = $2
    """, sotuv_id, uid)

    # Audit log
    await conn.execute("""
        INSERT INTO audit_log (user_id, amal, jadval, yozuv_id, eski_qiymat, yangi_qiymat)
        VALUES ($1, 'bekor_qilish', 'sotuvlar', $2, NULL, $3)
    """, uid, sotuv_id, f"Qoldiq qaytarildi: {len(qaytarilgan)} tovar")

    return {"qaytarilgan": len(qaytarilgan), "tovarlar": qaytarilgan}


# ════════════════════════════════════════════════════════════
#  CHECK-IN / CHECK-OUT (SD Agent ClientCheckInOut analog)
# ════════════════════════════════════════════════════════════

CHECK_IN_OUT_MIGRATION = """
CREATE TABLE IF NOT EXISTS checkin_out (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    turi VARCHAR(10) NOT NULL,  -- checkin / checkout
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy REAL,
    vaqt TIMESTAMPTZ DEFAULT NOW(),
    izoh TEXT,
    foto_url TEXT,
    CONSTRAINT checkin_out_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_checkin_user_klient ON checkin_out(user_id, klient_id, vaqt DESC);
"""


async def checkin(conn, uid: int, klient_id: int,
                   latitude: float = None, longitude: float = None,
                   accuracy: float = None, izoh: str = None) -> dict:
    """Klientga tashrif (check-in) qayd qilish.

    SD Agent ClientCheckInOut + visit/postCheck analogi.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        klient_id: klient ID
        latitude/longitude: GPS koordinata
        accuracy: GPS aniqlik (metr)
        izoh: ixtiyoriy izoh

    Returns:
        {"id": checkin_id, "vaqt": timestamp}
    """
    # Config tekshiruvi
    from shared.services.server_config import config_yukla
    config = await config_yukla(conn, uid)

    # GPS majburiy tekshiruvi
    if config.buyurtma.checkin_majburiy and config.buyurtma.lokatsiyani_tekshirish:
        if not latitude or not longitude:
            return {"xato": "Check-in uchun GPS lokatsiya majburiy"}

    # Allaqachon check-in qilinganmi?
    mavjud = await conn.fetchval("""
        SELECT id FROM checkin_out
        WHERE user_id=$1 AND klient_id=$2 AND turi='checkin'
        AND vaqt > NOW() - INTERVAL '12 hours'
        AND NOT EXISTS (
            SELECT 1 FROM checkin_out co2
            WHERE co2.user_id=$1 AND co2.klient_id=$2 AND co2.turi='checkout'
            AND co2.vaqt > checkin_out.vaqt
        )
    """, uid, klient_id)

    if mavjud:
        return {"xato": "Bu klientga allaqachon check-in qilingan", "mavjud_id": mavjud}

    checkin_id = await conn.fetchval("""
        INSERT INTO checkin_out (user_id, klient_id, turi, latitude, longitude, accuracy, izoh)
        VALUES ($1, $2, 'checkin', $3, $4, $5, $6)
        RETURNING id
    """, uid, klient_id, latitude, longitude, accuracy, izoh)

    log.info("Check-in: user=%s klient=%s id=%s", uid, klient_id, checkin_id)
    return {"id": checkin_id, "vaqt": datetime.utcnow().isoformat(), "turi": "checkin"}


async def checkout(conn, uid: int, klient_id: int,
                    latitude: float = None, longitude: float = None,
                    accuracy: float = None, izoh: str = None) -> dict:
    """Klientdan ketish (check-out) qayd qilish."""
    checkout_id = await conn.fetchval("""
        INSERT INTO checkin_out (user_id, klient_id, turi, latitude, longitude, accuracy, izoh)
        VALUES ($1, $2, 'checkout', $3, $4, $5, $6)
        RETURNING id
    """, uid, klient_id, latitude, longitude, accuracy, izoh)

    log.info("Check-out: user=%s klient=%s id=%s", uid, klient_id, checkout_id)
    return {"id": checkout_id, "vaqt": datetime.utcnow().isoformat(), "turi": "checkout"}


async def checkin_tarix(conn, uid: int, klient_id: int = None,
                         sana: str = None, limit: int = 50) -> List[dict]:
    """Check-in/out tarixini olish."""
    query = "SELECT co.*, k.nom as klient_nomi FROM checkin_out co LEFT JOIN klientlar k ON k.id = co.klient_id WHERE co.user_id = $1"
    params = [uid]
    idx = 2

    if klient_id:
        query += f" AND co.klient_id = ${idx}"
        params.append(klient_id)
        idx += 1

    if sana:
        query += f" AND co.vaqt::date = ${idx}::date"
        params.append(sana)
        idx += 1

    query += f" ORDER BY co.vaqt DESC LIMIT ${idx}"
    params.append(limit)

    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  BUYURTMA AMALLARI (SD Agent DataHolderOrderMenu analog)
# ════════════════════════════════════════════════════════════

BUYURTMA_AMALLARI = {
    "tahrirlash": {"icon": "✏️", "label": "Tahrirlash", "holat": ["draft", "pending"]},
    "tasdiqlash": {"icon": "✅", "label": "Tasdiqlash", "holat": ["draft", "pending"]},
    "yuborish": {"icon": "📤", "label": "Yuborish", "holat": ["confirmed"]},
    "izoh": {"icon": "💬", "label": "Izoh qo'shish", "holat": ["draft", "pending", "confirmed", "posted"]},
    "sana": {"icon": "📅", "label": "Sanani o'zgartirish", "holat": ["draft", "pending"]},
    "nasiya": {"icon": "🕐", "label": "Nasiya belgilash", "holat": ["draft", "pending", "confirmed"]},
    "nasiya_muddati": {"icon": "📆", "label": "Nasiya muddati", "holat": ["draft", "pending", "confirmed"]},
    "ochirish": {"icon": "🗑️", "label": "O'chirish", "holat": ["draft", "pending"]},
    "tag": {"icon": "🏷️", "label": "Tag qo'yish", "holat": ["draft", "pending", "confirmed", "posted"]},
    "tolov": {"icon": "💳", "label": "To'lov qilish", "holat": ["posted"]},
    "bonus": {"icon": "🎁", "label": "Bonus tanlash", "holat": ["draft", "pending"]},
    "aksiya": {"icon": "🎪", "label": "Aksiyalar", "holat": ["draft", "pending"]},
    "chop_etish": {"icon": "🖨️", "label": "Chop etish", "holat": ["confirmed", "posted"]},
    "bekor_qilish": {"icon": "↩️", "label": "Bekor qilish", "holat": ["confirmed", "posted"]},
    "nusxa": {"icon": "📋", "label": "Nusxa olish", "holat": ["posted"]},
}


def mavjud_amallar(holat: str, config=None) -> List[dict]:
    """Buyurtma holati asosida mumkin bo'lgan amallar ro'yxati.

    SD Agent DataHolderOrderMenu.getActionMenuItems() analogi.
    15 ta amaldan faqat joriy holatga mos kelganlarini qaytaradi.

    Args:
        holat: buyurtma holati (draft/pending/confirmed/posted)
        config: ServerConfig (ixtiyoriy — ba'zi amallarni cheklash)

    Returns:
        [{id, icon, label}]
    """
    natija = []
    for amal_id, amal in BUYURTMA_AMALLARI.items():
        if holat in amal["holat"]:
            # Config tekshiruvi
            if config:
                if amal_id == "nasiya" and not config.buyurtma.nasiyaga_ruxsat:
                    continue
                if amal_id == "bonus" and not config.aksiya.bonus_tizimi:
                    continue
                if amal_id == "aksiya" and not config.aksiya.aksiya_yoqilgan:
                    continue
                if amal_id == "chop_etish" and not config.printer.printer_yoqilgan:
                    continue

            natija.append({
                "id": amal_id,
                "icon": amal["icon"],
                "label": amal["label"],
            })
    return natija
