"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — HAYOTIM CO-PILOT                                 ║
║                                                                      ║
║  Admin uchun shaxsiy biznes co-pilot:                               ║
║  - Maqsad/reja qo'shish (matn/ovoz)                                 ║
║  - G'oya yozish + Opus 4.7 cluster                                  ║
║  - Shaxsiy xarajat tracking                                          ║
║  - Kunlik/oylik xulosa (Opus 4.7 tahlil)                            ║
║                                                                      ║
║  Biznes "xarajatlar" jadvali alohida — bu faqat shaxsiy.            ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import json
from datetime import date, timedelta
from decimal import Decimal

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  MAQSADLAR — CRUD
# ════════════════════════════════════════════════════════════════════

async def maqsad_qoshish(conn, uid: int, matn: str,
                         kategoriya: str = "umumiy",
                         ustuvorlik: int = 2,
                         deadline: date | None = None,
                         shogird_id: int | None = None) -> int:
    row = await conn.fetchrow("""
        INSERT INTO shaxsiy_maqsadlar(user_id, shogird_id, matn, kategoriya, ustuvorlik, deadline)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING id
    """, uid, shogird_id, matn.strip(), kategoriya, ustuvorlik, deadline)
    return row["id"]


async def maqsad_bajardi(conn, uid: int, maqsad_id: int) -> bool:
    result = await conn.execute("""
        UPDATE shaxsiy_maqsadlar
        SET bajarildi=TRUE, bajarilgan_sana=NOW(), yangilangan=NOW()
        WHERE id=$1 AND user_id=$2
    """, maqsad_id, uid)
    return "UPDATE 1" in result


async def maqsadlar_royxat(conn, uid: int, faqat_faol: bool = True,
                           limit: int = 50) -> list[dict]:
    where = "user_id=$1"
    if faqat_faol:
        where += " AND bajarildi=FALSE"
    rows = await conn.fetch(f"""
        SELECT id, shogird_id, matn, kategoriya, ustuvorlik, deadline,
               bajarildi, bajarilgan_sana, yaratilgan
        FROM shaxsiy_maqsadlar
        WHERE {where}
        ORDER BY bajarildi ASC, ustuvorlik ASC, COALESCE(deadline, yaratilgan::date) ASC
        LIMIT $2
    """, uid, limit)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════════════
#  G'OYALAR — CRUD + cluster
# ════════════════════════════════════════════════════════════════════

async def goya_qoshish(conn, uid: int, matn: str,
                       kategoriya: str = "umumiy",
                       manba: str = "matn",
                       shogird_id: int | None = None) -> int:
    row = await conn.fetchrow("""
        INSERT INTO shaxsiy_goyalar(user_id, shogird_id, matn, kategoriya, manba)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id
    """, uid, shogird_id, matn.strip(), kategoriya, manba)
    return row["id"]


async def goyalar_royxat(conn, uid: int, holat: str | None = None,
                         limit: int = 100) -> list[dict]:
    if holat:
        rows = await conn.fetch("""
            SELECT id, shogird_id, matn, kategoriya, cluster_id, holat,
                   manba, yaratilgan
            FROM shaxsiy_goyalar
            WHERE user_id=$1 AND holat=$2
            ORDER BY yaratilgan DESC LIMIT $3
        """, uid, holat, limit)
    else:
        rows = await conn.fetch("""
            SELECT id, shogird_id, matn, kategoriya, cluster_id, holat,
                   manba, yaratilgan
            FROM shaxsiy_goyalar
            WHERE user_id=$1
            ORDER BY yaratilgan DESC LIMIT $2
        """, uid, limit)
    return [dict(r) for r in rows]


async def goya_holat(conn, uid: int, goya_id: int, holat: str) -> bool:
    if holat not in ("yangi", "korib_chiqildi", "amalga_oshirildi", "rad_etildi"):
        return False
    result = await conn.execute("""
        UPDATE shaxsiy_goyalar SET holat=$1, yangilangan=NOW()
        WHERE id=$2 AND user_id=$3
    """, holat, goya_id, uid)
    return "UPDATE 1" in result


# ════════════════════════════════════════════════════════════════════
#  SHAXSIY XARAJAT — CRUD
# ════════════════════════════════════════════════════════════════════

async def xarajat_yoz(conn, uid: int, summa: Decimal,
                      kategoriya: str = "boshqa",
                      manba: str = "naqd",
                      izoh: str = "",
                      sana: date | None = None) -> int:
    row = await conn.fetchrow("""
        INSERT INTO shaxsiy_xarajat(user_id, summa, kategoriya, manba, izoh, sana)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING id
    """, uid, summa, kategoriya, manba, izoh, sana or date.today())
    return row["id"]


async def xarajat_statistika(conn, uid: int, kun: int = 30) -> dict:
    """Oxirgi N kun shaxsiy xarajat statistikasi."""
    chegara = date.today() - timedelta(days=kun)
    jami = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0)
        FROM shaxsiy_xarajat
        WHERE user_id=$1 AND sana >= $2
    """, uid, chegara)
    kategoriyalar = await conn.fetch("""
        SELECT kategoriya, COALESCE(SUM(summa), 0) AS jami, COUNT(*) AS soni
        FROM shaxsiy_xarajat
        WHERE user_id=$1 AND sana >= $2
        GROUP BY kategoriya
        ORDER BY jami DESC
    """, uid, chegara)
    kunlik = await conn.fetch("""
        SELECT sana, COALESCE(SUM(summa), 0) AS jami
        FROM shaxsiy_xarajat
        WHERE user_id=$1 AND sana >= $2
        GROUP BY sana
        ORDER BY sana DESC
        LIMIT 30
    """, uid, chegara)
    return {
        "kun_soni": kun,
        "jami": float(jami or 0),
        "ortacha_kunlik": float(jami or 0) / max(kun, 1),
        "kategoriyalar": [
            {"nomi": r["kategoriya"], "jami": float(r["jami"]), "soni": int(r["soni"])}
            for r in kategoriyalar
        ],
        "kunlik": [
            {"sana": str(r["sana"]), "jami": float(r["jami"])}
            for r in kunlik
        ],
    }


# ════════════════════════════════════════════════════════════════════
#  DASHBOARD — /hayotim komandasi uchun
# ════════════════════════════════════════════════════════════════════

async def dashboard_data(conn, uid: int) -> dict:
    """/hayotim da ko'rsatiladigan umumiy holat."""
    bugun = date.today()
    # Aktiv maqsadlar
    maqsadlar = await conn.fetch("""
        SELECT id, matn, kategoriya, ustuvorlik, deadline
        FROM shaxsiy_maqsadlar
        WHERE user_id=$1 AND bajarildi=FALSE
        ORDER BY ustuvorlik ASC, COALESCE(deadline, yaratilgan::date) ASC
        LIMIT 10
    """, uid)
    # Oxirgi 7 kun g'oyalar (yangi)
    goyalar_yangi = await conn.fetch("""
        SELECT id, matn, kategoriya, yaratilgan
        FROM shaxsiy_goyalar
        WHERE user_id=$1 AND holat='yangi'
          AND yaratilgan >= NOW() - INTERVAL '7 days'
        ORDER BY yaratilgan DESC LIMIT 10
    """, uid)
    goyalar_jami = await conn.fetchval("""
        SELECT COUNT(*) FROM shaxsiy_goyalar WHERE user_id=$1
    """, uid) or 0
    # Bu oy shaxsiy xarajat
    oy_boshi = bugun.replace(day=1)
    xarajat_oy = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0)
        FROM shaxsiy_xarajat WHERE user_id=$1 AND sana >= $2
    """, uid, oy_boshi)
    xarajat_bugun = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0)
        FROM shaxsiy_xarajat WHERE user_id=$1 AND sana = $2
    """, uid, bugun)
    # Biznes daromad bu oy (sotuv_sessiyalar, jami to'langan)
    biznes_daromad = await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0)
        FROM sotuv_sessiyalar WHERE user_id=$1 AND sana >= $2
    """, uid, oy_boshi) or 0
    return {
        "sana": str(bugun),
        "maqsadlar_aktiv": [dict(r) for r in maqsadlar],
        "goyalar_yangi_7kun": [dict(r) for r in goyalar_yangi],
        "goyalar_jami_soni": int(goyalar_jami),
        "xarajat_bugun": float(xarajat_bugun or 0),
        "xarajat_oy": float(xarajat_oy or 0),
        "biznes_daromad_oy": float(biznes_daromad),
        # Foydada sof: daromad - xarajat
        "sof_oy": float(biznes_daromad) - float(xarajat_oy or 0),
    }


# ════════════════════════════════════════════════════════════════════
#  OPUS 4.7 TAHLIL — 30 kunlik chuqur xulosa
# ════════════════════════════════════════════════════════════════════

async def opus_30kun_tahlil(conn, uid: int) -> str | None:
    """Claude Opus 4.7 — 30 kunlik barcha ma'lumot bir kontekstda tahlil.

    Opus 4.7 1M context bor — barcha maqsadlar, g'oyalar, xarajat,
    biznes ma'lumot bir vaqtda ko'rib chiqadi va xulosa beradi.
    """
    try:
        from services.cognitive.ai_extras import claude_opus
        if not claude_opus.ready:
            # Sonnet fallback
            from services.cognitive.ai_router import _claude
            if not _claude.ready:
                return None
            ai_client = _claude
            ai_name = "Claude Sonnet"
        else:
            ai_client = claude_opus
            ai_name = "Claude Opus 4.7"
    except Exception as e:
        log.warning("opus_30kun_tahlil: AI yo'q: %s", e)
        return None

    # Barcha 30 kunlik ma'lumotni to'plash
    chegara = date.today() - timedelta(days=30)
    maqsadlar = await maqsadlar_royxat(conn, uid, faqat_faol=False, limit=100)
    goyalar = await goyalar_royxat(conn, uid, limit=100)
    xarajat_stat = await xarajat_statistika(conn, uid, kun=30)
    dash = await dashboard_data(conn, uid)

    context = {
        "sana_bugun": str(date.today()),
        "chegara_30kun": str(chegara),
        "maqsadlar": maqsadlar[:30],
        "goyalar": goyalar[:30],
        "xarajat_statistika": xarajat_stat,
        "biznes_daromad_oy": dash["biznes_daromad_oy"],
        "sof_oy": dash["sof_oy"],
    }

    system = (
        "Siz SavdoAI 'Hayotim' co-pilot'sisiz — o'zbekistondagi savdogar "
        "uchun shaxsiy va biznes hayoti bo'yicha chuqur maslahatchi. "
        "30 kunlik ma'lumotni ko'rib chiqib, quyidagi formatda javob bering:\n\n"
        "**🔭 30 KUNLIK XULOSA**\n\n"
        "**📊 Asosiy statistika:**\n"
        "[2-3 qator — maqsad bajarish %, g'oyalar soni, xarajat/daromad nisbati]\n\n"
        "**✅ Yutuqlar (3 ta):**\n"
        "1. ...\n2. ...\n3. ...\n\n"
        "**⚠️ Kamchilliklar (3 ta):**\n"
        "1. ...\n2. ...\n3. ...\n\n"
        "**🎯 Keyingi 30 kunga 5 ta aniq qadam:**\n"
        "1. ...\n...\n\n"
        "Qisqa, aniq, raqam bilan. O'zbek tilida. Markdown Telegram'ga mos."
    )

    user_msg = json.dumps(context, ensure_ascii=False, indent=2, default=str)

    try:
        if ai_name == "Claude Opus 4.7":
            result = await ai_client.chat(system, user_msg, max_tokens=2500)
        else:
            result = await ai_client.call(system, user_msg, max_tokens=2500)
        return result
    except Exception as e:
        log.warning("opus_30kun_tahlil (%s) xato: %s", ai_name, e)
        return None
