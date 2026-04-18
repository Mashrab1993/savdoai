"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLASSIFIKATOR OVOZ HANDLERLARI                   ║
║                                                                      ║
║  Ovozli intent: "yangi brend Ariel", "kategoriya Sladus",            ║
║  "segment VIP", "ishlab chiqaruvchi P&G Turkiya".                   ║
║                                                                      ║
║  Multi-step ham mavjud: bot nomi/kod/birlikni so'raydi.             ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from telegram import Update
from telegram.ext import ContextTypes
from shared.database.pool import rls_conn

log = logging.getLogger(__name__)

# turi bo'yicha klyuchevoy so'zlar (universal sinonimlar)
TURI_KEYWORDS: dict[str, tuple[str, ...]] = {
    "kategoriya":         ("kategoriya", "kat.", "кат"),
    "subkategoriya":      ("subkategoriya", "subkat", "podkategoriya", "подкат"),
    "gruppa":             ("gruppa", "группа", "guruh"),
    "brend":              ("brend", "бренд", "brand", "firma", "марка"),
    "ishlab_chiqaruvchi": ("ishlab chiqaruvchi", "ishlab chiqruvchi", "производитель",
                           "zavod", "fabrika"),
    "segment":            ("segment", "сегмент"),
    "gruppa_kategoriya":  ("gruppa kategoriya", "группа категорий", "kategoriya gruppa"),
}


def _detect_turi(m: str) -> str | None:
    """Matn ichidan klassifikator turini aniqlaymiz.

    Prioritet: eng uzun so'z birinchi (ishlab chiqaruvchi > brend > kategoriya).
    """
    ordered = sorted(
        TURI_KEYWORDS.items(),
        key=lambda kv: -max(len(k) for k in kv[1]),
    )
    for turi, kws in ordered:
        for kw in kws:
            if kw in m:
                return turi
    return None


async def voice_klassifikator(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                              matn: str) -> bool:
    """Voice intent: "yangi brend Ariel" / "kategoriya Sladus qo'shish" / ...

    Qaytaradi: True — handled; False — bu intent emas.
    """
    m = matn.strip().lower()

    # "yangi ... qo'shish" yoki "... qo'shish" shakli
    is_add = any(w in m for w in ("yangi ", "qo'sh", "qosh", "добав", "yarat"))
    turi = _detect_turi(m)
    if not (is_add and turi):
        return False

    # Nomni ekstrakt qilish
    # Strateja: turi keywordidan keyingi matn
    nomi = _extract_name(m, turi)
    if not nomi:
        await update.message.reply_text(
            f"🤔 Yangi {turi} nomini tushunmadim.\n\n"
            f"Misol: <b>Yangi {turi} Ariel qo'shing</b>",
            parse_mode="HTML",
        )
        return True

    uid = update.effective_user.id
    try:
        async with rls_conn(uid) as c:
            dup = await c.fetchval("""
                SELECT id FROM tovar_klassifikatorlari
                WHERE user_id=$1 AND turi=$2 AND LOWER(nomi)=LOWER($3)
            """, uid, turi, nomi)
            if dup:
                await update.message.reply_text(
                    f"⚠️ <b>{nomi}</b> allaqachon <i>{turi}</i> ro'yxatida bor."
                    f"\n\nKerak bo'lsa <code>/klf_list {turi}</code> bilan ro'yxatni ko'ring.",
                    parse_mode="HTML",
                )
                return True

            # Davlat (producer uchun)
            davlat = None
            if turi == "ishlab_chiqaruvchi":
                davlat = _extract_country(m, nomi)

            row = await c.fetchrow("""
                INSERT INTO tovar_klassifikatorlari
                    (user_id, turi, nomi, davlat, faol)
                VALUES ($1, $2, $3, $4, TRUE)
                RETURNING id, nomi
            """, uid, turi, nomi, davlat)

        emoji = {
            "kategoriya": "📁", "subkategoriya": "📂", "gruppa": "📦",
            "brend": "🏷️", "ishlab_chiqaruvchi": "🏭",
            "segment": "🎯", "gruppa_kategoriya": "🗂️",
        }.get(turi, "✅")

        turi_label = {
            "kategoriya": "Kategoriya", "subkategoriya": "Subkategoriya",
            "gruppa": "Gruppa", "brend": "Brend",
            "ishlab_chiqaruvchi": "Ishlab chiqaruvchi",
            "segment": "Segment", "gruppa_kategoriya": "Gruppa kategoriya",
        }.get(turi, turi)

        text = f"{emoji} <b>{turi_label} qo'shildi</b>\n\n"
        text += f"📝 Nomi: <b>{row['nomi']}</b>\n"
        if davlat:
            text += f"🌍 Davlat: {davlat}\n"
        text += f"\n<i>Web: /categories sahifasida ko'rish mumkin.</i>"
        await update.message.reply_text(text, parse_mode="HTML")
        log.info("Voice klassifikator qo'shildi: uid=%s turi=%s nomi=%s", uid, turi, nomi)
        return True
    except Exception as e:
        log.error("voice_klassifikator xato: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")
        return True


def _extract_name(m: str, turi: str) -> str | None:
    """Nomni matn ichidan topish."""
    # Birinchi — "yangi <turi> NOM" shaklini sinab ko'ramiz
    for kw in TURI_KEYWORDS[turi]:
        # "yangi brend Ariel qo'shish" / "brend Ariel qo'sh"
        patterns = [
            rf"yangi\s+{re.escape(kw)}\s+(.+?)(?:\s+qo'?sh|\s+добав|\s+yarat|$)",
            rf"{re.escape(kw)}\s+(.+?)(?:\s+qo'?sh|\s+добав|\s+yarat|$)",
            rf"qo'?sh\s+{re.escape(kw)}\s+(.+)",
        ]
        for p in patterns:
            mt = re.search(p, m, re.IGNORECASE)
            if mt:
                nomi = mt.group(1).strip(" .,!?\"'")
                # Kichik yoki bo'sh bo'lsa, rad etamiz
                if nomi and len(nomi) >= 2:
                    # Original matndagi holatini topamiz (asl harflar bilan)
                    orig_m = m
                    idx = orig_m.find(nomi.lower())
                    if idx >= 0:
                        return nomi.strip()
                    return nomi.title()
    return None


def _extract_country(m: str, nomi: str) -> str | None:
    """Ishlab chiqaruvchi uchun davlatni aniqlaymiz.

    "Procter & Gamble Turkiya" → "Turkiya"
    """
    countries = [
        "o'zbekiston", "turkiya", "rossiya", "xitoy", "germaniya",
        "amerika", "angliya", "fransiya", "italiya", "koreya",
        "yaponiya", "hindiston", "polsha", "ukraina", "qozog'iston",
    ]
    for c in countries:
        if c in m:
            return c.title()
    return None
