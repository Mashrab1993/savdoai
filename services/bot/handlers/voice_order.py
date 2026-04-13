"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI BOT — VOICE ORDER HANDLER                          ║
║                                                              ║
║  Agent ovozli xabar yuboradi → avtomatik savdo yaratiladi.   ║
║                                                              ║
║  Flow:                                                       ║
║    1. Agent voice yuboradi                                   ║
║    2. Gemini STT → matn                                     ║
║    3. parse_order_text() → do'kon + tovarlar                 ║
║    4. Tasdiqlash so'rash (inline keyboard)                   ║
║    5. Tasdiqlanganda → create_order_from_voice()            ║
║    6. Nakladnoy tayyor                                       ║
║                                                              ║
║  6 ta agent uchun mo'ljallangan.                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db
from shared.services.voice_order_parser import (
    parse_order_text,
    smart_parse_with_gemini,
    fuzzy_match_tovar,
    fuzzy_match_klient,
    create_order_from_voice,
)

log = logging.getLogger(__name__)

# Temporary storage for pending orders (user_id → parsed data)
_pending_orders: dict[int, dict] = {}


def _fmt(n: float) -> str:
    """Format number as UZS."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} mln so'm"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming so'm"
    return f"{n:,.0f} so'm"


async def handle_voice_order(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Agent ovozli xabar yubordi — zakaz yaratish jarayoni.

    Bu handler voice_pipeline dan keyin chaqiriladi, matn
    allaqachon context.user_data["last_transcription"] da.
    """
    msg = update.effective_message
    user_id = update.effective_user.id

    # Get transcribed text
    text = context.user_data.get("last_transcription", "")
    if not text:
        await msg.reply_text("⚠️ Ovoz tanilmadi. Qaytadan urinib ko'ring.")
        return

    # Check if this looks like an order (has shop name + product mentions)
    # Simple heuristic: at least 2 words and contains a number or quantity word
    words = text.split()
    has_qty = any(w.isdigit() or w in ("ta", "dona", "karobka", "ikki", "uch", "besh") for w in words)

    if len(words) < 3 or not has_qty:
        # Not an order — let normal message handler process it
        return

    try:
        # Get DB connection
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute(f"SET app.uid = '{user_id}'")

            # Get user's products and clients for fuzzy matching
            tovarlar = await conn.fetch("""
                SELECT id, nomi, kategoriya, birlik, sotish_narxi, olish_narxi, qoldiq
                FROM tovarlar WHERE user_id = $1 AND faol = TRUE
                ORDER BY nomi
            """, user_id)
            klientlar = await conn.fetch("""
                SELECT id, ism, telefon, manzil
                FROM klientlar WHERE user_id = $1
                ORDER BY ism
            """, user_id)

            tovarlar_list = [dict(r) for r in tovarlar]
            klientlar_list = [dict(r) for r in klientlar]

        # Parse the text — try regex first, then Gemini AI
        parsed = parse_order_text(text)

        if parsed.get("xato") or not parsed.get("tovarlar"):
            # Regex failed — try Gemini smart parser
            try:
                parsed = await smart_parse_with_gemini(
                    text,
                    [t.get("nomi", "") for t in tovarlar_list],
                )
            except Exception as _sp:
                log.debug("smart parse fallback: %s", _sp)

        if parsed.get("xato"):
            await msg.reply_text(
                f"⚠️ Tushunmadim:\n{parsed['xato']}\n\n"
                f"📝 Matn: {text[:200]}\n\n"
                f"💡 Format: «Do'kon nomi — Tovar1 N ta, Tovar2 M ta»"
            )
            return

        # Match do'kon
        klient = fuzzy_match_klient(parsed["do'kon"], klientlar_list)
        if not klient:
            await msg.reply_text(
                f"⚠️ Do'kon topilmadi: «{parsed['do\'kon']}»\n\n"
                f"💡 DB'dagi klientlardan birini ayting. "
                f"Masalan: /klientlar buyrug'i bilan ro'yxatni ko'ring."
            )
            return

        # Match tovarlar
        matched = []
        not_found = []
        jami = 0.0

        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], tovarlar_list)
            if tv:
                narx = float(tv.get("sotish_narxi") or 0)
                miqdor = t["miqdor"]
                summa = miqdor * narx
                jami += summa
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "miqdor": miqdor,
                    "narx": narx,
                    "jami": summa,
                    "birlik": tv.get("birlik", "dona"),
                    "kategoriya": tv.get("kategoriya", "Boshqa"),
                    "olish_narxi": float(tv.get("olish_narxi") or 0),
                    "qoldiq": float(tv.get("qoldiq") or 0),
                })
            else:
                not_found.append(t["nomi"])

        if not matched:
            await msg.reply_text(
                f"⚠️ Birorta ham tovar topilmadi:\n"
                + "\n".join(f"  • {n}" for n in not_found)
                + "\n\n💡 Tovar nomini DB'dagi kabi ayting."
            )
            return

        # Build confirmation message
        lines = [
            f"🏪 **{klient['ism']}**",
            f"📦 {len(matched)} ta tovar, {_fmt(jami)}",
            "",
        ]
        for i, m in enumerate(matched, 1):
            stock_warn = " ⚠️" if m["qoldiq"] < m["miqdor"] else ""
            lines.append(
                f"{i}. {m['nomi']}\n"
                f"   {m['miqdor']} {m['birlik']} × {m['narx']:,.0f} = **{m['jami']:,.0f}**{stock_warn}"
            )

        if not_found:
            lines.append("")
            lines.append("❌ Topilmadi:")
            for n in not_found:
                lines.append(f"  • {n}")

        lines.append("")
        lines.append(f"💰 **JAMI: {_fmt(jami)}**")

        # Store pending order
        _pending_orders[user_id] = {
            "parsed": parsed,
            "klient": klient,
            "matched": matched,
            "jami": jami,
            "text": text,
        }

        # Inline keyboard for confirmation
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Tasdiqlash", callback_data="voice_order_confirm"),
                InlineKeyboardButton("❌ Bekor", callback_data="voice_order_cancel"),
            ]
        ])

        await msg.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
            reply_markup=keyboard,
        )

    except Exception as e:
        log.error("voice_order: %s", e, exc_info=True)
        await msg.reply_text(f"⚠️ Xatolik: {str(e)[:200]}")


async def handle_voice_order_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Tasdiqlash/bekor callback handler."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    pending = _pending_orders.pop(user_id, None)
    if not pending:
        await query.edit_message_text("⚠️ Bu zakaz eskirgan. Qaytadan yuborin.")
        return

    if query.data == "voice_order_cancel":
        await query.edit_message_text("❌ Zakaz bekor qilindi.")
        return

    if query.data == "voice_order_confirm":
        try:
            pool = db._P()
            async with pool.acquire() as conn:
                await conn.execute(f"SET app.uid = '{user_id}'")

                result = await create_order_from_voice(
                    conn, user_id, pending["parsed"],
                    # Re-fetch for fresh data
                    [dict(r) for r in await conn.fetch(
                        "SELECT id, nomi, kategoriya, birlik, sotish_narxi, olish_narxi, qoldiq "
                        "FROM tovarlar WHERE user_id = $1 AND faol = TRUE", user_id)],
                    [dict(r) for r in await conn.fetch(
                        "SELECT id, ism, telefon, manzil "
                        "FROM klientlar WHERE user_id = $1", user_id)],
                )

            if result["success"]:
                await query.edit_message_text(
                    f"✅ **Zakaz yaratildi!**\n\n"
                    f"🏪 {result['klient']}\n"
                    f"📦 {result['tovarlar_soni']} ta tovar\n"
                    f"💰 {_fmt(result['jami_summa'])}\n"
                    f"📋 Sessiya #{result['sessiya_id']}\n\n"
                    f"📄 Nakladnoy: /nakladnoy_{result['sessiya_id']}",
                    parse_mode="Markdown",
                )
            else:
                errors = "\n".join(f"• {e}" for e in result["xatolar"])
                await query.edit_message_text(
                    f"⚠️ Zakaz yaratishda xato:\n{errors}"
                )

        except Exception as e:
            log.error("voice_order confirm: %s", e, exc_info=True)
            await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
