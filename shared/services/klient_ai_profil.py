"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLIENT AI PROFIL (Opus 4.7 1M context)           ║
║                                                                      ║
║  Bitta klient uchun BARCHA ma'lumotni to'plab Opus 4.7 ga beradi:   ║
║  - Profil + RFM segment                                             ║
║  - 30 kun sotuv tarixi                                              ║
║  - Qarz holati                                                      ║
║  - Storecheck tashrif tarixi                                        ║
║  - Feedback (shikoyat/maqtov/taklif)                                ║
║  - Qaytarish tarixi                                                 ║
║                                                                      ║
║  Opus 4.7 natijada:                                                  ║
║  - Klient xarakterlashi (2-3 gap)                                   ║
║  - Xavf/imkoniyat ro'yxati                                          ║
║  - Shaxsiy strategiya (5 aniq qadam)                                ║
║  - Keyingi tashrif/qo'ng'iroq uchun maslahat                        ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal

log = logging.getLogger(__name__)


async def _to_plain(v):
    """Decimal/datetime'larni JSON-safe qilish."""
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (date, datetime)):
        return str(v)
    return v


async def _fetch_klient_data(conn, uid: int, klient_id: int) -> dict | None:
    """Barcha modullar'dan klient haqidagi ma'lumotni to'plash."""
    # Asosiy profil (klient_360 bilan birga)
    profil = await conn.fetchrow("""
        SELECT k.id, k.ism, k.telefon, k.manzil, k.kategoriya,
               k.kredit_limit, k.jami_sotib, k.yaratilgan,
               k.oxirgi_sotuv, k.jami_xaridlar, k.xarid_soni,
               k.narx_turi_id,
               nt.nomi AS narx_turi_nomi
        FROM klientlar k
        LEFT JOIN narx_turlari nt ON nt.id = k.narx_turi_id
        WHERE k.id = $1 AND k.user_id = $2
    """, klient_id, uid)
    if not profil:
        return None

    chegara = datetime.now() - timedelta(days=90)

    # 30 kun sotuv
    sotuv_stat = await conn.fetchrow("""
        SELECT COUNT(*) AS soni,
               COALESCE(SUM(jami), 0) AS jami,
               COALESCE(SUM(tolangan), 0) AS naqd,
               COALESCE(SUM(jami - tolangan), 0) AS qarz_yangi,
               MAX(sana) AS oxirgi_sotuv
        FROM sotuv_sessiyalar
        WHERE user_id=$1 AND klient_id=$2 AND sana >= $3
    """, uid, klient_id, chegara)

    # Top tovar
    top_tovar = await conn.fetch("""
        SELECT ch.tovar_nomi, SUM(ch.miqdor) AS miqdor,
               SUM(ch.jami) AS jami, COUNT(*) AS sotuv_soni
        FROM chiqimlar ch
        JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
        WHERE ss.user_id=$1 AND ss.klient_id=$2 AND ss.sana >= $3
        GROUP BY ch.tovar_nomi
        ORDER BY jami DESC LIMIT 10
    """, uid, klient_id, chegara)

    # Qarz
    qarz = await conn.fetchrow("""
        SELECT COALESCE(SUM(qolgan) FILTER(WHERE NOT yopildi), 0) AS aktiv,
               COUNT(*) FILTER(WHERE NOT yopildi AND qolgan > 0) AS aktiv_soni,
               COUNT(*) FILTER(WHERE NOT yopildi AND muddat < NOW()) AS kechikkan,
               COALESCE(SUM(dastlabki_summa), 0) AS jami_qarz_tarix
        FROM qarzlar WHERE user_id=$1 AND klient_id=$2
    """, uid, klient_id)

    # Storecheck tashriflar
    try:
        tashrif = await conn.fetch("""
            SELECT id, boshlangan, tugagan, holat, izoh,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id) AS sku_soni,
                   (SELECT COUNT(*) FROM storecheck_sku WHERE session_id=s.id AND mavjud=TRUE) AS sku_bor
            FROM storecheck_sessions s
            WHERE user_id=$1 AND klient_id=$2 AND boshlangan >= $3
            ORDER BY boshlangan DESC LIMIT 10
        """, uid, klient_id, chegara)
    except Exception:
        tashrif = []

    # Feedback
    try:
        fikrlar = await conn.fetch("""
            SELECT id, matn, turi, baho, javob_berildi, admin_javobi, yaratilgan
            FROM feedback
            WHERE user_id=$1 AND klient_id=$2
            ORDER BY yaratilgan DESC LIMIT 10
        """, uid, klient_id)
    except Exception:
        fikrlar = []

    # Qaytarishlar
    try:
        qaytarish = await conn.fetch("""
            SELECT id, tovar_nomi, miqdor, sabab, summa, holat, yaratilgan
            FROM qaytarishlar
            WHERE user_id=$1 AND klient_id=$2
            ORDER BY yaratilgan DESC LIMIT 10
        """, uid, klient_id)
    except Exception:
        qaytarish = []

    # RFM segment hisoblash
    rfm_data = None
    try:
        from shared.services.rfm_segment import rfm_hisobla
        all_rfm = await rfm_hisobla(conn, uid, hafta_soni=26)
        rfm_data = next((k for k in all_rfm if k["klient_id"] == klient_id), None)
    except Exception as e:
        log.debug("RFM xato: %s", e)

    # Bugungi kun
    bugun = date.today()
    oxirgi = profil.get("oxirgi_sotuv") if profil else None
    if oxirgi:
        if isinstance(oxirgi, datetime):
            oxirgi_kun = (datetime.now() - oxirgi).days
        else:
            oxirgi_kun = (bugun - oxirgi).days
    else:
        oxirgi_kun = None

    return {
        "profil": {
            "id": profil["id"],
            "ism": profil["ism"],
            "telefon": profil["telefon"],
            "manzil": profil["manzil"],
            "kategoriya": profil["kategoriya"],
            "narx_turi": profil.get("narx_turi_nomi") or "Chakana",
            "kredit_limit": float(profil["kredit_limit"] or 0),
            "jami_sotib": float(profil["jami_sotib"] or 0),
            "jami_xaridlar": float(profil["jami_xaridlar"] or 0),
            "xarid_soni": int(profil["xarid_soni"] or 0),
            "yaratilgan": str(profil["yaratilgan"]),
            "oxirgi_sotuv": str(profil["oxirgi_sotuv"]) if profil.get("oxirgi_sotuv") else None,
            "oxirgi_sotuv_kun_oldin": oxirgi_kun,
        },
        "sotuv_90_kun": {
            "soni": int(sotuv_stat["soni"] or 0),
            "jami": float(sotuv_stat["jami"] or 0),
            "naqd": float(sotuv_stat["naqd"] or 0),
            "qarz_yangi": float(sotuv_stat["qarz_yangi"] or 0),
        },
        "top_tovarlar": [
            {"nomi": r["tovar_nomi"], "miqdor": float(r["miqdor"] or 0),
             "jami": float(r["jami"] or 0), "sotuv_soni": int(r["sotuv_soni"] or 0)}
            for r in top_tovar
        ],
        "qarz": {
            "aktiv": float(qarz["aktiv"] or 0),
            "aktiv_soni": int(qarz["aktiv_soni"] or 0),
            "kechikkan": int(qarz["kechikkan"] or 0),
            "jami_qarz_tarix": float(qarz["jami_qarz_tarix"] or 0),
        },
        "rfm": {
            "R": rfm_data["R"] if rfm_data else None,
            "F": rfm_data["F"] if rfm_data else None,
            "M": rfm_data["M"] if rfm_data else None,
            "segment": rfm_data["segment"] if rfm_data else None,
            "emoji": rfm_data["emoji"] if rfm_data else None,
        } if rfm_data else None,
        "tashriflar_90_kun": [
            {
                "id": r["id"],
                "boshlangan": str(r["boshlangan"]),
                "holat": r["holat"],
                "sku_soni": int(r["sku_soni"] or 0),
                "sku_bor": int(r["sku_bor"] or 0),
                "izoh": r.get("izoh") or "",
            }
            for r in tashrif
        ],
        "feedback": [
            {
                "id": r["id"], "matn": r["matn"][:300], "turi": r["turi"],
                "baho": r["baho"], "javob_berildi": r["javob_berildi"],
                "yaratilgan": str(r["yaratilgan"]),
            }
            for r in fikrlar
        ],
        "qaytarishlar": [
            {
                "id": r["id"], "tovar": r["tovar_nomi"],
                "miqdor": float(r["miqdor"] or 0), "sabab": r["sabab"],
                "summa": float(r["summa"] or 0), "holat": r["holat"],
                "sana": str(r["yaratilgan"]),
            }
            for r in qaytarish
        ],
    }


async def klient_ai_strategy(conn, uid: int, klient_id: int) -> str | None:
    """Opus 4.7 bilan klient uchun shaxsiy strategiya."""
    data = await _fetch_klient_data(conn, uid, klient_id)
    if not data:
        return None

    try:
        from services.cognitive.ai_extras import claude_opus
        if not claude_opus.ready:
            # Fallback — Sonnet
            try:
                from services.cognitive.ai_router import _claude
                if not _claude.ready:
                    return None
                client = _claude
                is_opus = False
            except Exception:
                return None
        else:
            client = claude_opus
            is_opus = True
    except Exception:
        return None

    system = (
        "Siz SavdoAI biznes analitik'sisiz. O'zbekistondagi savdogar "
        "uchun bitta klient haqida CHUQUR tahlil va SHAXSIY strategiya "
        "beryapsiz. Ma'lumot manbalari: profil, sotuv tarixi, qarz, RFM "
        "segment, storecheck tashriflari, feedback, qaytarishlar.\n\n"
        "Javob formati (Markdown, Telegram mos):\n\n"
        "**👤 {Klient nomi} — {segment emoji} {segment}**\n\n"
        "**📝 1 GAPDA TASVIR:**\n"
        "[Kim ekani, qanday biznes olib borishi — 1-2 gap]\n\n"
        "**✅ IJOBIY TOMONLARI (2-3):**\n"
        "• ...\n\n"
        "**⚠️ XAVF/KAMCHILIK (2-3):**\n"
        "• ...\n\n"
        "**🎯 BU KLIENT UCHUN 5 ANIQ QADAM:**\n"
        "1. [Darhol — bu hafta]\n"
        "2. ...\n"
        "5. ...\n\n"
        "**💡 KEYINGI MUOMALAT:**\n"
        "[Telefon qo'ng'iroq / tashrifda qanday gapirish — 1-2 gap]\n\n"
        "**💰 TAXMINIY POTENSIAL:**\n"
        "[Agar rejalar bajarilsa — oylik qancha daromad kutilmoqda]\n\n"
        "Qisqa, aniq, raqam bilan. O'zbek tilida."
    )

    user_msg = json.dumps(data, ensure_ascii=False, indent=2, default=str)

    try:
        if is_opus:
            return await client.chat(system, user_msg, max_tokens=2000)
        else:
            return await client.call(system, user_msg, max_tokens=2000)
    except Exception as e:
        log.warning("klient_ai_strategy xato: %s", e)
        return None
