"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — ERTALABKI BRIFING (Opus 4.7 audit)              ║
║                                                                      ║
║  Har kuni 09:00 (yoki /ertalab) admin uchun Claude Opus 4.7         ║
║  kechagi ma'lumotlarni tahlil qiladi va quyidagini beradi:          ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────┐              ║
║  │  ☀️ ERTALABKI BRIFING — 2026-04-17 (Pay)         │              ║
║  ├──────────────────────────────────────────────────┤              ║
║  │  KECHA NATIJA: 3.2 mln sotuv, 18% foyda          │              ║
║  │  (7 kunlik o'rtachadan 12% yaxshiroq)            │              ║
║  │                                                   │              ║
║  │  3 ASOSIY XULOSA (Opus 4.7 tahlili):             │              ║
║  │  1. Karim akaning kecha sotib olishi ↑ — ...     │              ║
║  │  2. Ariel zaxirasi kritik darajada — ...         │              ║
║  │  3. Qarz yig'ish 2 kun ortda — ...               │              ║
║  │                                                   │              ║
║  │  BUGUNGI 3 MUHIM ISH:                            │              ║
║  │  🔴 Urgent — ...                                 │              ║
║  │  🟡 Bu hafta — ...                               │              ║
║  │  🟢 Keyinroq — ...                               │              ║
║  └──────────────────────────────────────────────────┘              ║
║                                                                      ║
║  Opus 4.7 kerak (ANTHROPIC_API_KEY). Kalit yo'q bo'lsa — fallback: ║
║  Claude Sonnet 4.6 orqali soddaroq brifing.                         ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from typing import Any

log = logging.getLogger(__name__)


async def _fetch_raw_data(conn, uid: int) -> dict:
    """Kechagi kun va joriy holat uchun asosiy raqamlarni to'plash."""
    bugun = date.today()
    kecha = bugun - timedelta(days=1)
    hafta_oldin = bugun - timedelta(days=7)

    data: dict[str, Any] = {
        "sana_bugun": str(bugun),
        "sana_kecha": str(kecha),
        "hafta_kun": bugun.strftime("%A"),
    }

    # ── Kechagi natija ──
    kecha_stat = await conn.fetchrow("""
        SELECT
            COUNT(*) AS soni,
            COALESCE(SUM(jami), 0) AS jami,
            COALESCE(SUM(jami - tolangan), 0) AS qarz,
            COALESCE(SUM(tolangan), 0) AS naqd
        FROM sotuv_sessiyalar
        WHERE user_id = $1 AND sana::date = $2
    """, uid, kecha)
    data["kecha"] = {
        "sotuv_soni": int(kecha_stat["soni"] or 0),
        "sotuv_jami": float(kecha_stat["jami"] or 0),
        "qarz_yangi": float(kecha_stat["qarz"] or 0),
        "naqd": float(kecha_stat["naqd"] or 0),
    }

    # ── Hafta o'rtachasi (taqqoslash uchun) ──
    hafta_avg = await conn.fetchrow("""
        SELECT
            COALESCE(AVG(kunlik), 0) AS avg_jami,
            COUNT(*) AS kun_soni
        FROM (
            SELECT sana::date AS kun, SUM(jami) AS kunlik
            FROM sotuv_sessiyalar
            WHERE user_id = $1 AND sana::date BETWEEN $2 AND $3
            GROUP BY sana::date
        ) t
    """, uid, hafta_oldin, kecha)
    data["hafta_ortacha"] = {
        "jami_kun": float(hafta_avg["avg_jami"] or 0),
        "kunlar_soni": int(hafta_avg["kun_soni"] or 0),
    }

    # ── Aktiv qarz (barcha ochiq) ──
    qarz_stat = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(qolgan), 0) AS jami_qarz,
            COUNT(*) FILTER (WHERE NOT yopildi AND qolgan > 0) AS aktiv_soni,
            COUNT(*) FILTER (WHERE NOT yopildi AND muddat < NOW()) AS kechikkan_soni
        FROM qarzlar
        WHERE user_id = $1
    """, uid)
    data["qarz"] = {
        "jami": float(qarz_stat["jami_qarz"] or 0),
        "aktiv_soni": int(qarz_stat["aktiv_soni"] or 0),
        "kechikkan_soni": int(qarz_stat["kechikkan_soni"] or 0),
    }

    # ── Kam tovarlar (ombor kritik) ──
    kam_tovarlar = await conn.fetch("""
        SELECT nomi, qoldiq, COALESCE(min_qoldiq, 10) AS min_q
        FROM tovarlar
        WHERE user_id = $1 AND qoldiq < COALESCE(min_qoldiq, 10)
        ORDER BY (qoldiq::float / NULLIF(min_qoldiq, 0)) ASC
        LIMIT 10
    """, uid)
    data["kam_tovarlar"] = [
        {"nomi": r["nomi"], "qoldiq": float(r["qoldiq"] or 0), "min": float(r["min_q"])}
        for r in kam_tovarlar
    ]

    # ── Eng faol klientlar (oxirgi 7 kun) ──
    top_klientlar = await conn.fetch("""
        SELECT k.ism, SUM(s.jami) AS jami, COUNT(*) AS soni
        FROM sotuv_sessiyalar s
        JOIN klientlar k ON k.id = s.klient_id
        WHERE s.user_id = $1 AND s.sana::date >= $2
        GROUP BY k.id, k.ism
        ORDER BY jami DESC
        LIMIT 5
    """, uid, hafta_oldin)
    data["top_klientlar"] = [
        {"ism": r["ism"], "jami": float(r["jami"] or 0), "soni": int(r["soni"] or 0)}
        for r in top_klientlar
    ]

    # ── Yo'qolgan klientlar (30 kun yo'q) ──
    yoqolgan = await conn.fetchval("""
        SELECT COUNT(*) FROM klientlar
        WHERE user_id = $1 AND oxirgi_sotuv < NOW() - INTERVAL '30 days'
    """, uid)
    data["yoqolgan_klientlar"] = int(yoqolgan or 0)

    # ── STORECHECK (kechagi tashriflar) ──
    try:
        tashrif_stat = await conn.fetchrow("""
            SELECT COUNT(*) AS soni,
                   COUNT(DISTINCT klient_id) AS noyob_klient,
                   COUNT(DISTINCT shogird_id) AS ishlagan_shogird
            FROM storecheck_sessions
            WHERE user_id=$1 AND boshlangan::date = $2
        """, uid, kecha)
        data["storecheck_kecha"] = {
            "soni": int(tashrif_stat["soni"] or 0),
            "noyob_klient": int(tashrif_stat["noyob_klient"] or 0),
            "ishlagan_shogird": int(tashrif_stat["ishlagan_shogird"] or 0),
        }
        # Kam uchraydigan (ko'p do'konda yo'q) tovar TOP-5
        eng_yoq = await conn.fetch("""
            SELECT sk.tovar_nomi,
                   COUNT(*) AS tekshirilgan,
                   COUNT(*) FILTER(WHERE NOT sk.mavjud) AS yoq_soni
            FROM storecheck_sku sk
            JOIN storecheck_sessions ss ON ss.id = sk.session_id
            WHERE sk.user_id=$1 AND ss.boshlangan >= $2
            GROUP BY sk.tovar_nomi
            HAVING COUNT(*) >= 3 AND
                   COUNT(*) FILTER(WHERE NOT sk.mavjud) * 2 > COUNT(*)
            ORDER BY yoq_soni DESC LIMIT 5
        """, uid, hafta_oldin)
        data["storecheck_top_yoq"] = [dict(r) for r in eng_yoq]
    except Exception as _e:
        log.debug("storecheck brifing: %s", _e)
        data["storecheck_kecha"] = {"soni": 0, "noyob_klient": 0, "ishlagan_shogird": 0}
        data["storecheck_top_yoq"] = []

    # ── VAZIFALAR (bugun muddati otgan + kutilayotgan) ──
    try:
        vazifa_stat = await conn.fetchrow("""
            SELECT COUNT(*) FILTER(WHERE NOT bajarildi) AS kutilayotgan,
                   COUNT(*) FILTER(WHERE NOT bajarildi AND deadline < CURRENT_DATE) AS muddati_otgan,
                   COUNT(*) FILTER(WHERE bajarildi AND bajarilgan_vaqt::date = $2) AS kecha_bajarildi
            FROM vazifalar
            WHERE admin_uid=$1
        """, uid, kecha)
        data["vazifalar"] = {
            "kutilayotgan": int(vazifa_stat["kutilayotgan"] or 0),
            "muddati_otgan": int(vazifa_stat["muddati_otgan"] or 0),
            "kecha_bajarildi": int(vazifa_stat["kecha_bajarildi"] or 0),
        }
    except Exception as _e:
        data["vazifalar"] = {"kutilayotgan": 0, "muddati_otgan": 0, "kecha_bajarildi": 0}

    # ── FEEDBACK (javobsiz shikoyatlar) ──
    try:
        fikr_stat = await conn.fetchrow("""
            SELECT COUNT(*) FILTER(WHERE NOT javob_berildi AND turi='shikoyat') AS javobsiz_shikoyat,
                   COUNT(*) FILTER(WHERE yaratilgan::date = $2) AS kecha_kelgan
            FROM feedback
            WHERE user_id=$1
        """, uid, kecha)
        data["feedback"] = {
            "javobsiz_shikoyat": int(fikr_stat["javobsiz_shikoyat"] or 0),
            "kecha_kelgan": int(fikr_stat["kecha_kelgan"] or 0),
        }
    except Exception as _e:
        data["feedback"] = {"javobsiz_shikoyat": 0, "kecha_kelgan": 0}

    # ── QAYTARISHLAR (kutilayotgan tasdiq) ──
    try:
        qayt_stat = await conn.fetchrow("""
            SELECT COUNT(*) FILTER(WHERE holat='yangi') AS kutilayotgan,
                   COUNT(*) FILTER(WHERE holat='tasdiqlandi' AND tugatilgan::date = $2) AS kecha_tasdiqlangan
            FROM qaytarishlar
            WHERE user_id=$1
        """, uid, kecha)
        data["qaytarishlar"] = {
            "kutilayotgan": int(qayt_stat["kutilayotgan"] or 0),
            "kecha_tasdiqlangan": int(qayt_stat["kecha_tasdiqlangan"] or 0),
        }
    except Exception as _e:
        data["qaytarishlar"] = {"kutilayotgan": 0, "kecha_tasdiqlangan": 0}

    return data


async def _ai_briefing(raw_data: dict) -> str | None:
    """Opus 4.7 (yoki Sonnet fallback) orqali tabiiy til brifing."""
    try:
        from services.cognitive.ai_extras import claude_opus
        use_opus = claude_opus.ready
    except Exception:
        use_opus = False

    system = (
        "Siz SavdoAI biznes co-pilot'isiz. O'zbek savdogariga ERTALABKI BRIFING "
        "berasiz. Ma'lumot manbalari: sotuv, qarz, ombor, top klientlar, "
        "storecheck tashriflari, vazifalar (muddati otgan bormi?), "
        "shikoyatlar (javobsiz bormi?), qaytarishlar (tasdiqlash kutayotganlar) — "
        "barchasini hisobga olib, quyidagi formatda javob bering:\n\n"
        "**☀️ Ertalabki Brifing — {sana}**\n\n"
        "**📊 KECHA NATIJA:**\n"
        "[1-2 gap — kecha qancha sotuv, tashrif, hafta taqqoslashi]\n\n"
        "**🔍 3 ASOSIY XULOSA:**\n"
        "1. [xulosa 1 — aniq raqam bilan]\n"
        "2. [xulosa 2]\n"
        "3. [xulosa 3]\n\n"
        "**🎯 BUGUNGI 3 MUHIM ISH:**\n"
        "🔴 [Urgent — javobsiz shikoyat, muddati otgan vazifa, kam qoldiq]\n"
        "🟡 [Bu hafta ichida — kutilayotgan qaytarish, kam tashrif]\n"
        "🟢 [Keyinroq — plan, klient xavf]\n\n"
        "Qisqa, aniq, amaliy. Umumiy gaplar yo'q — faqat raqam va konkret harakat. "
        "Agar muddati otgan vazifa yoki javobsiz shikoyat bo'lsa — hammadan avval e'tibor bering. "
        "O'zbek tilida. Markdown ishlatishi mumkin (Telegram mos)."
    )

    user_msg = (
        "Mana bugungi/kechagi ma'lumotlar:\n\n"
        + json.dumps(raw_data, ensure_ascii=False, indent=2, default=str)
    )

    if use_opus:
        try:
            return await claude_opus.chat(system, user_msg, max_tokens=1500)
        except Exception as e:
            log.warning("Opus 4.7 brifing xato: %s — Sonnet fallback'ga", e)

    # Fallback: Sonnet 4.6 (router'dagi _claude)
    try:
        from services.cognitive.ai_router import _claude, CognitiveRouter  # noqa
        if _claude.ready:
            return await _claude.call(system, user_msg, max_tokens=1500)
    except Exception as e:
        log.warning("Sonnet fallback brifing xato: %s", e)

    return None


def _fallback_text(raw: dict) -> str:
    """AI yo'q bo'lganda — statik brifing (raw raqamlar bilan)."""
    k = raw.get("kecha", {})
    q = raw.get("qarz", {})
    kam = raw.get("kam_tovarlar", [])
    top = raw.get("top_klientlar", [])
    sc = raw.get("storecheck_kecha", {})
    vz = raw.get("vazifalar", {})
    fb = raw.get("feedback", {})
    qay = raw.get("qaytarishlar", {})
    lines = [
        f"☀️ *Ertalabki Brifing — {raw.get('sana_bugun', '?')}*",
        "",
        f"📊 *KECHA NATIJA ({raw.get('sana_kecha', '?')}):*",
        f"  • Sotuv: {k.get('sotuv_soni', 0)} ta, jami {k.get('sotuv_jami', 0):,.0f} so'm",
        f"  • Naqd: {k.get('naqd', 0):,.0f} so'm",
        f"  • Yangi qarz: {k.get('qarz_yangi', 0):,.0f} so'm",
    ]
    if sc.get("soni"):
        lines.append(f"  • 🏪 Tashriflar: {sc.get('soni')} ta ({sc.get('noyob_klient', 0)} noyob klient)")
    lines.extend([
        "",
        "💰 *QARZ HOLATI:*",
        f"  • Jami qarz: {q.get('jami', 0):,.0f} so'm",
        f"  • Aktiv: {q.get('aktiv_soni', 0)} ta (kechikkan: {q.get('kechikkan_soni', 0)} ta)",
        "",
    ])

    # URGENT alert'lar
    urgent = []
    if vz.get("muddati_otgan", 0) > 0:
        urgent.append(f"🔴 Muddati o'tgan vazifa: *{vz['muddati_otgan']}* ta")
    if fb.get("javobsiz_shikoyat", 0) > 0:
        urgent.append(f"🔴 Javobsiz shikoyat: *{fb['javobsiz_shikoyat']}* ta")
    if qay.get("kutilayotgan", 0) > 0:
        urgent.append(f"🟡 Qaytarish tasdiq kutyapti: *{qay['kutilayotgan']}* ta")
    if vz.get("kutilayotgan", 0) > 0:
        urgent.append(f"🟡 Faol vazifalar: {vz['kutilayotgan']} ta")
    if urgent:
        lines.append("⚠️ *DIQQAT:*")
        lines.extend(f"  {u}" for u in urgent)
        lines.append("")

    if kam:
        lines.append("📦 *KAM TOVARLAR (darhol to'ldirish kerak):*")
        for t in kam[:5]:
            lines.append(f"  • {t['nomi']} — {t['qoldiq']:.0f} (min: {t['min']:.0f})")
        lines.append("")

    # Storecheck'dan kelgan "ko'p do'konda yo'q" tovarlar
    top_yoq = raw.get("storecheck_top_yoq", [])
    if top_yoq:
        lines.append("🔴 *Ko'p do'konda YO'Q (tashrif hisoboti):*")
        for t in top_yoq[:5]:
            lines.append(
                f"  • {t['tovar_nomi']} — {int(t['yoq_soni'])}/{int(t['tekshirilgan'])} do'konda yo'q"
            )
        lines.append("")

    if top:
        lines.append("⭐ *TOP KLIENTLAR (hafta):*")
        for c in top[:3]:
            lines.append(f"  • {c['ism']} — {c['jami']:,.0f} so'm ({c['soni']} sotuv)")
    return "\n".join(lines)


async def build_briefing(conn, uid: int) -> str:
    """Ertalabki brifing — asosiy kirish nuqtasi.

    Keraklik:
        conn — asyncpg RLS connection (rls_conn natijasi)
        uid — foydalanuvchi ID

    Qaytaradi: Markdown matn, Telegram'ga yuborish uchun tayyor.
    """
    raw = await _fetch_raw_data(conn, uid)
    ai_text = await _ai_briefing(raw)
    if ai_text:
        return ai_text
    # AI yo'q yoki xato — fallback statik
    return _fallback_text(raw)
