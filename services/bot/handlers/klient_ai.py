"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — KLIENT AI PROFIL BOT HANDLERS                ║
║                                                                   ║
║   /klient_ai [klient_id]  — Opus 4.7 shaxsiy strategiya          ║
║                                                                   ║
║  Ovoz:                                                            ║
║   "Karim aka tahlili" / "Karim aka haqida aytib ber"             ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


async def cmd_klient_ai(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/klient_ai [klient_id] — bitta klient uchun Opus 4.7 chuqur tahlil."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "🧠 *Klient AI profil*\n\n"
            "Format: `/klient_ai [klient_id]`\n"
            "Misol: `/klient_ai 15`\n\n"
            "Ovoz: _\"Karim aka tahlili\"_",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    klient_id = int(parts[1])
    msg = await update.message.reply_text(
        "🧠 Opus 4.7 klient haqida chuqur tahlil qilmoqda "
        "(sotuv + qarz + storecheck + feedback + qaytarish)..."
    )
    try:
        from shared.services.klient_ai_profil import klient_ai_strategy
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            result = await klient_ai_strategy(c, uid, klient_id)
        if not result:
            await msg.edit_text(
                "⚠️ Klient topilmadi yoki AI xizmat vaqtincha ishlamayapti.\n\n"
                "Oddiy profil: /klient360 (yoki web panel)"
            )
            return
        try:
            await msg.edit_text(result, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await msg.edit_text(result)
    except Exception as e:
        log.error("cmd_klient_ai xato uid=%s: %s", uid, e, exc_info=True)
        try:
            await msg.edit_text("⚠️ Tahlil xato yuz berdi.")
        except Exception:
            pass


# ════════════════════════════════════════════════════════════════════
#  OVOZDAN: "Karim aka tahlili" / "Karim aka haqida aytib ber"
# ════════════════════════════════════════════════════════════════════

async def voice_klient_ai(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                            matn: str) -> bool:
    """Ovoz matnidan klient ismini ajratib — AI tahlil."""
    m = matn.lower()
    # "Karim aka tahlili" / "Karim aka haqida"
    if not any(kw in m for kw in ("tahlil", "haqida", "ai profil", "profil ai",
                                    "smart profil", "chuqur profil")):
        return False
    # Klient ism qismi ajratish (tahlil/haqida oldingi so'zlardan)
    parts = re.split(r'\b(tahlili?|haqida|profil|smart|chuqur)\b', m, maxsplit=1)
    klient_qidiruv = parts[0].strip(".,! ") if parts else ""
    if not klient_qidiruv or len(klient_qidiruv) < 3:
        return False
    uid = update.effective_user.id
    try:
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            klient = await c.fetchrow("""
                SELECT id, ism FROM klientlar
                WHERE user_id=$1 AND lower(ism) LIKE '%' || lower($2) || '%'
                ORDER BY jami_sotib DESC LIMIT 1
            """, uid, klient_qidiruv)
        if not klient:
            await update.message.reply_text(
                f"⚠️ _{klient_qidiruv}_ topilmadi.",
                parse_mode=ParseMode.MARKDOWN,
            )
            return True
        update.message.text = f"/klient_ai {klient['id']}"
        await cmd_klient_ai(update, ctx)
        return True
    except Exception as e:
        log.warning("voice_klient_ai xato: %s", e)
    return False
