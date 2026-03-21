"""
╔══════════════════════════════════════════════════════════╗
║  SavdoAI v25.0 — SHOGIRD XARAJAT NAZORATI              ║
║                                                          ║
║  Admin shogirdlarini qo'shadi (Telegram ID bilan)       ║
║  Shogird ovoz/matn yuboradi: "Benzin 80000"             ║
║  Bot tasdiqlash so'raydi → admin ko'radi                ║
║  Web ilovada real-time dashboard                        ║
║                                                          ║
║  Kategoriyalar: gaz, abed, benzin, oylik, boshqa        ║
║  Limitlar: kunlik + oylik                               ║
╚══════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional, Any
import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

# Default kategoriyalar (yangi admin uchun)
DEFAULT_KATEGORIYALAR = [
    ("⛽ Benzin", "⛽"),
    ("🔥 Gaz", "🔥"),
    ("🍽 Abed", "🍽"),
    ("💰 Oylik", "💰"),
    ("🚕 Transport", "🚕"),
    ("🔧 Ta'mir", "🔧"),
    ("📞 Aloqa", "📞"),
    ("📦 Boshqa", "📦"),
]

# ═══════════════════════════════════════
#  SHOGIRD CRUD
# ═══════════════════════════════════════

async def shogird_qoshish(conn, admin_uid: int, telegram_uid: int, 
                           ism: str, telefon: str = "", lavozim: str = "haydovchi",
                           kunlik_limit: float = 500000, oylik_limit: float = 10000000) -> dict:
    """Yangi shogird qo'shish"""
    row = await conn.fetchrow("""
        INSERT INTO shogirdlar (admin_uid, telegram_uid, ism, telefon, lavozim, kunlik_limit, oylik_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (admin_uid, telegram_uid) DO UPDATE SET
            ism = $3, telefon = $4, lavozim = $5, 
            kunlik_limit = $6, oylik_limit = $7, faol = TRUE
        RETURNING id, ism
    """, admin_uid, telegram_uid, ism, telefon, lavozim,
        Decimal(str(kunlik_limit)), Decimal(str(oylik_limit)))
    
    # Default kategoriyalar yaratish (agar yo'q bo'lsa)
    await _default_kategoriyalar(conn, admin_uid)
    
    log.info("Shogird qo'shildi: %s (tg:%d) admin:%d", ism, telegram_uid, admin_uid)
    return dict(row)


async def shogird_olib_tashlash(conn, admin_uid: int, shogird_id: int) -> bool:
    """Shogirdni faolsizlantirish"""
    result = await conn.execute("""
        UPDATE shogirdlar SET faol = FALSE WHERE id = $1 AND admin_uid = $2
    """, shogird_id, admin_uid)
    return "UPDATE 1" in result


async def shogirdlar_royxati(conn, admin_uid: int) -> list:
    """Admin barcha shogirdlari"""
    return await conn.fetch("""
        SELECT s.*, 
            COALESCE((SELECT SUM(x.summa) FROM xarajatlar x 
                WHERE x.shogird_id = s.id AND x.sana >= CURRENT_DATE 
                AND NOT x.bekor_qilingan), 0) as bugungi_xarajat,
            COALESCE((SELECT SUM(x.summa) FROM xarajatlar x 
                WHERE x.shogird_id = s.id AND x.sana >= date_trunc('month', CURRENT_DATE) 
                AND NOT x.bekor_qilingan), 0) as oylik_xarajat,
            COALESCE((SELECT COUNT(*) FROM xarajatlar x 
                WHERE x.shogird_id = s.id AND NOT x.tasdiqlangan 
                AND NOT x.bekor_qilingan), 0) as kutilmoqda
        FROM shogirdlar s 
        WHERE s.admin_uid = $1 AND s.faol = TRUE
        ORDER BY s.ism
    """, admin_uid)


async def shogird_topish_tg(conn, telegram_uid: int) -> Optional[dict]:
    """Telegram UID bo'yicha shogirdni topish (admin kim ekanligini ham)"""
    row = await conn.fetchrow("""
        SELECT s.*, u.id as admin_user_id 
        FROM shogirdlar s
        JOIN users u ON u.id = s.admin_uid
        WHERE s.telegram_uid = $1 AND s.faol = TRUE
        LIMIT 1
    """, telegram_uid)
    return dict(row) if row else None


# ═══════════════════════════════════════
#  KATEGORIYALAR
# ═══════════════════════════════════════

async def _default_kategoriyalar(conn, admin_uid: int):
    """Default kategoriyalar yaratish"""
    for nomi, emoji in DEFAULT_KATEGORIYALAR:
        await conn.execute("""
            INSERT INTO xarajat_kategoriyalar (admin_uid, nomi, emoji)
            VALUES ($1, $2, $3)
            ON CONFLICT (admin_uid, nomi) DO NOTHING
        """, admin_uid, nomi, emoji)


async def kategoriyalar_ol(conn, admin_uid: int) -> list:
    """Barcha kategoriyalar"""
    return await conn.fetch("""
        SELECT * FROM xarajat_kategoriyalar 
        WHERE admin_uid = $1 AND faol = TRUE
        ORDER BY nomi
    """, admin_uid)


def kategoriya_aniqla(matn: str) -> tuple[str, str]:
    """Matndan kategoriya aniqlash"""
    matn_l = matn.lower()
    mapping = {
        "benzin": ("⛽ Benzin", "⛽"),
        "yoqilgi": ("⛽ Benzin", "⛽"),
        "toplash": ("⛽ Benzin", "⛽"),
        "zapravka": ("⛽ Benzin", "⛽"),
        "gaz": ("🔥 Gaz", "🔥"),
        "metan": ("🔥 Gaz", "🔥"),
        "propan": ("🔥 Gaz", "🔥"),
        "abed": ("🍽 Abed", "🍽"),
        "tushlik": ("🍽 Abed", "🍽"),
        "ovqat": ("🍽 Abed", "🍽"),
        "nonushta": ("🍽 Abed", "🍽"),
        "kechki": ("🍽 Abed", "🍽"),
        "oylik": ("💰 Oylik", "💰"),
        "maosh": ("💰 Oylik", "💰"),
        "ish haqi": ("💰 Oylik", "💰"),
        "transport": ("🚕 Transport", "🚕"),
        "taxi": ("🚕 Transport", "🚕"),
        "taksi": ("🚕 Transport", "🚕"),
        "avtobus": ("🚕 Transport", "🚕"),
        "tamir": ("🔧 Ta'mir", "🔧"),
        "ta'mir": ("🔧 Ta'mir", "🔧"),
        "remont": ("🔧 Ta'mir", "🔧"),
        "aloqa": ("📞 Aloqa", "📞"),
        "telefon": ("📞 Aloqa", "📞"),
        "internet": ("📞 Aloqa", "📞"),
    }
    for kalit, (nomi, emoji) in mapping.items():
        if kalit in matn_l:
            return nomi, emoji
    return "📦 Boshqa", "📦"


# ═══════════════════════════════════════
#  XARAJAT SAQLASH
# ═══════════════════════════════════════

async def xarajat_saqlash(conn, admin_uid: int, shogird_id: int,
                           kategoriya_nomi: str, summa: float,
                           izoh: str = "", rasm_file_id: str = "") -> dict:
    """Yangi xarajat saqlash"""
    summa_d = Decimal(str(summa))
    
    # Limit tekshirish
    limit_info = await limit_tekshir(conn, admin_uid, shogird_id, summa_d)
    
    row = await conn.fetchrow("""
        INSERT INTO xarajatlar (admin_uid, shogird_id, kategoriya_nomi, summa, izoh, rasm_file_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, summa, sana
    """, admin_uid, shogird_id, kategoriya_nomi, summa_d, izoh, rasm_file_id or None)
    
    result = dict(row)
    result["limit_info"] = limit_info
    log.info("Xarajat saqlandi: #%d %s %s shogird=%d", row["id"], kategoriya_nomi, summa_d, shogird_id)
    return result


async def xarajat_tasdiqlash(conn, xarajat_id: int, admin_uid: int) -> bool:
    """Admin xarajatni tasdiqlaydi"""
    result = await conn.execute("""
        UPDATE xarajatlar SET tasdiqlangan = TRUE, tasdiq_vaqti = NOW()
        WHERE id = $1 AND admin_uid = $2
    """, xarajat_id, admin_uid)
    return "UPDATE 1" in result


async def xarajat_bekor(conn, xarajat_id: int, admin_uid: int) -> bool:
    """Admin xarajatni bekor qiladi"""
    result = await conn.execute("""
        UPDATE xarajatlar SET bekor_qilingan = TRUE
        WHERE id = $1 AND admin_uid = $2
    """, xarajat_id, admin_uid)
    return "UPDATE 1" in result


# ═══════════════════════════════════════
#  LIMIT TEKSHIRISH
# ═══════════════════════════════════════

async def limit_tekshir(conn, admin_uid: int, shogird_id: int, summa: Decimal) -> dict:
    """Kunlik va oylik limitni tekshirish"""
    row = await conn.fetchrow("""
        SELECT kunlik_limit, oylik_limit, ism FROM shogirdlar 
        WHERE id = $1 AND admin_uid = $2
    """, shogird_id, admin_uid)
    if not row:
        return {"ruxsat": False, "sabab": "Shogird topilmadi"}
    
    kunlik_limit = row["kunlik_limit"]
    oylik_limit = row["oylik_limit"]
    
    # Bugungi jami
    bugungi = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
        WHERE shogird_id = $1 AND sana >= CURRENT_DATE AND NOT bekor_qilingan
    """, shogird_id)
    
    # Oylik jami
    oylik = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
        WHERE shogird_id = $1 AND sana >= date_trunc('month', CURRENT_DATE) AND NOT bekor_qilingan
    """, shogird_id)
    
    ogohlantirish = []
    ruxsat = True
    
    if bugungi + summa > kunlik_limit:
        ogohlantirish.append(f"⚠️ Kunlik limit oshadi: {bugungi + summa:,.0f} / {kunlik_limit:,.0f}")
        if bugungi + summa > kunlik_limit * Decimal("1.5"):
            ruxsat = False
    
    if oylik + summa > oylik_limit:
        ogohlantirish.append(f"⚠️ Oylik limit oshadi: {oylik + summa:,.0f} / {oylik_limit:,.0f}")
        if oylik + summa > oylik_limit * Decimal("1.2"):
            ruxsat = False
    
    return {
        "ruxsat": ruxsat,
        "bugungi": bugungi,
        "oylik": oylik,
        "kunlik_limit": kunlik_limit,
        "oylik_limit": oylik_limit,
        "ogohlantirish": ogohlantirish,
    }


# ═══════════════════════════════════════
#  HISOBOTLAR
# ═══════════════════════════════════════

async def kunlik_hisobot(conn, admin_uid: int, sana: Optional[str] = None) -> dict:
    """Kunlik xarajat hisoboti (barcha shogirdlar)"""
    if sana:
        sana_filter = f"AND x.sana::date = '{sana}'"
    else:
        sana_filter = "AND x.sana >= CURRENT_DATE"
    
    rows = await conn.fetch(f"""
        SELECT s.ism, s.id as shogird_id,
            COALESCE(SUM(x.summa), 0) as jami,
            COUNT(x.id) as soni,
            COUNT(CASE WHEN NOT x.tasdiqlangan THEN 1 END) as kutilmoqda
        FROM shogirdlar s
        LEFT JOIN xarajatlar x ON x.shogird_id = s.id 
            AND NOT x.bekor_qilingan {sana_filter}
        WHERE s.admin_uid = $1 AND s.faol = TRUE
        GROUP BY s.id, s.ism
        ORDER BY jami DESC
    """, admin_uid)
    
    jami = sum(r["jami"] for r in rows)
    
    # Kategoriya bo'yicha
    kat_rows = await conn.fetch(f"""
        SELECT x.kategoriya_nomi, SUM(x.summa) as jami, COUNT(*) as soni
        FROM xarajatlar x
        WHERE x.admin_uid = $1 AND NOT x.bekor_qilingan {sana_filter}
        GROUP BY x.kategoriya_nomi
        ORDER BY jami DESC
    """, admin_uid)
    
    return {
        "shogirdlar": [dict(r) for r in rows],
        "kategoriyalar": [dict(r) for r in kat_rows],
        "jami": jami,
    }


async def shogird_hisobot(conn, admin_uid: int, shogird_id: int, 
                           kunlar: int = 7) -> dict:
    """Bitta shogird hisoboti"""
    shogird = await conn.fetchrow("""
        SELECT * FROM shogirdlar WHERE id = $1 AND admin_uid = $2
    """, shogird_id, admin_uid)
    if not shogird:
        return {}
    
    xarajatlar = await conn.fetch("""
        SELECT x.*, 
            CASE WHEN x.tasdiqlangan THEN '✅' 
                 WHEN x.bekor_qilingan THEN '❌'
                 ELSE '⏳' END as holat
        FROM xarajatlar x
        WHERE x.shogird_id = $1 AND x.admin_uid = $2
            AND x.sana >= NOW() - INTERVAL '%s days'
        ORDER BY x.sana DESC
    """ % kunlar, shogird_id, admin_uid)
    
    jami = sum(x["summa"] for x in xarajatlar if not x["bekor_qilingan"])
    
    return {
        "shogird": dict(shogird),
        "xarajatlar": [dict(x) for x in xarajatlar],
        "jami": jami,
        "kunlar": kunlar,
    }


async def oylik_hisobot(conn, admin_uid: int) -> dict:
    """Oylik xarajat hisoboti"""
    rows = await conn.fetch("""
        SELECT s.ism, s.id as shogird_id, s.oylik_limit,
            COALESCE(SUM(x.summa), 0) as jami,
            COUNT(x.id) as soni
        FROM shogirdlar s
        LEFT JOIN xarajatlar x ON x.shogird_id = s.id 
            AND NOT x.bekor_qilingan
            AND x.sana >= date_trunc('month', CURRENT_DATE)
        WHERE s.admin_uid = $1 AND s.faol = TRUE
        GROUP BY s.id, s.ism, s.oylik_limit
        ORDER BY jami DESC
    """, admin_uid)
    
    return {
        "shogirdlar": [dict(r) for r in rows],
        "jami": sum(r["jami"] for r in rows),
    }


async def kutilmoqda_royxati(conn, admin_uid: int) -> list:
    """Tasdiqlanmagan xarajatlar (admin uchun)"""
    return await conn.fetch("""
        SELECT x.id, x.summa, x.kategoriya_nomi, x.izoh, x.sana,
            s.ism as shogird_ismi
        FROM xarajatlar x
        JOIN shogirdlar s ON s.id = x.shogird_id
        WHERE x.admin_uid = $1 AND NOT x.tasdiqlangan AND NOT x.bekor_qilingan
        ORDER BY x.sana DESC
        LIMIT 50
    """, admin_uid)


# ═══════════════════════════════════════
#  WEB API UCHUN
# ═══════════════════════════════════════

async def dashboard_data(conn, admin_uid: int) -> dict:
    """Web dashboard uchun barcha ma'lumotlar"""
    shogirdlar = await shogirdlar_royxati(conn, admin_uid)
    kunlik = await kunlik_hisobot(conn, admin_uid)
    oylik = await oylik_hisobot(conn, admin_uid)
    kutilmoqda = await kutilmoqda_royxati(conn, admin_uid)
    
    return {
        "shogirdlar": [dict(s) for s in shogirdlar],
        "bugungi": kunlik,
        "oylik": oylik,
        "kutilmoqda": [dict(k) for k in kutilmoqda],
        "jami_shogird": len(shogirdlar),
        "jami_bugungi": kunlik["jami"],
        "jami_oylik": oylik["jami"],
        "kutilmoqda_soni": len(kutilmoqda),
    }
