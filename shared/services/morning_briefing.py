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
import os
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Optional

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

    return data


async def _ai_briefing(raw_data: dict) -> Optional[str]:
    """Opus 4.7 (yoki Sonnet fallback) orqali tabiiy til brifing."""
    try:
        from services.cognitive.ai_extras import claude_opus
        use_opus = claude_opus.ready
    except Exception:
        use_opus = False

    system = (
        "Siz SavdoAI biznes co-pilot'isiz. O'zbek savdogariga ERTALABKI BRIFING "
        "berasiz. Kecha natijasi, hafta taqqoslash, ombor, qarz, klient — "
        "barchasini hisobga olib, quyidagi formatda javob bering:\n\n"
        "**☀️ Ertalabki Brifing — {sana}**\n\n"
        "**📊 KECHA NATIJA:**\n"
        "[1-2 gap — kecha qancha sotuv, haftalik ortacha bilan taqqoslash]\n\n"
        "**🔍 3 ASOSIY XULOSA:**\n"
        "1. [xulosa 1 — aniq raqam bilan]\n"
        "2. [xulosa 2]\n"
        "3. [xulosa 3]\n\n"
        "**🎯 BUGUNGI 3 MUHIM ISH:**\n"
        "🔴 [Urgent ish]\n"
        "🟡 [Bu hafta ichida]\n"
        "🟢 [Keyinroq, lekin nazarda tuting]\n\n"
        "Qisqa, aniq, amaliy. Umumiy gaplar yo'q — faqat raqam va konkret harakat. "
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
    lines = [
        f"☀️ *Ertalabki Brifing — {raw.get('sana_bugun', '?')}*",
        "",
        f"📊 *KECHA NATIJA ({raw.get('sana_kecha', '?')}):*",
        f"  • Sotuv: {k.get('sotuv_soni', 0)} ta, jami {k.get('sotuv_jami', 0):,.0f} so'm",
        f"  • Naqd: {k.get('naqd', 0):,.0f} so'm",
        f"  • Yangi qarz: {k.get('qarz_yangi', 0):,.0f} so'm",
        "",
        f"💰 *QARZ HOLATI:*",
        f"  • Jami qarz: {q.get('jami', 0):,.0f} so'm",
        f"  • Aktiv: {q.get('aktiv_soni', 0)} ta (kechikkan: {q.get('kechikkan_soni', 0)} ta)",
        "",
    ]
    if kam:
        lines.append("📦 *KAM TOVARLAR (darhol to'ldirish kerak):*")
        for t in kam[:5]:
            lines.append(f"  • {t['nomi']} — {t['qoldiq']:.0f} (min: {t['min']:.0f})")
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
