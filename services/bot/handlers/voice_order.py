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
import uuid
from decimal import Decimal
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db
from shared.services.voice_order_parser import (
    parse_order_text,
    smart_parse_with_gemini,
    fuzzy_match_tovar,
    fuzzy_match_klient,
    create_order_from_voice,
    _to_decimal,
)

log = logging.getLogger(__name__)

# Pending orders keyed by unique token (NOT user_id — prevents race condition)
# Format: token → {user_id, parsed, klient, matched, jami, text, ts}
_pending_orders: dict[str, dict] = {}


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
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

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

        # Match tovarlar — using Decimal for all money
        matched = []
        not_found = []
        jami = Decimal("0")

        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], tovarlar_list)
            if tv:
                narx = _to_decimal(tv.get("sotish_narxi"))
                miqdor = t["miqdor"]
                summa = Decimal(str(miqdor)) * narx
                jami += summa
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "miqdor": miqdor,
                    "narx": narx,
                    "jami": summa,
                    "birlik": tv.get("birlik", "dona"),
                    "kategoriya": tv.get("kategoriya", "Boshqa"),
                    "olish_narxi": _to_decimal(tv.get("olish_narxi")),
                    "qoldiq": _to_decimal(tv.get("qoldiq")),
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
            f"📦 {len(matched)} ta tovar, {_fmt(float(jami))}",
            "",
        ]
        for i, m in enumerate(matched, 1):
            stock_warn = " ⚠️" if m["qoldiq"] < m["miqdor"] else ""
            lines.append(
                f"{i}. {m['nomi']}\n"
                f"   {m['miqdor']} {m['birlik']} × {float(m['narx']):,.0f} = **{float(m['jami']):,.0f}**{stock_warn}"
            )

        if not_found:
            lines.append("")
            lines.append("❌ Topilmadi:")
            for n in not_found:
                lines.append(f"  • {n}")

        lines.append("")
        lines.append(f"💰 **JAMI: {_fmt(float(jami))}**")

        # Store pending order with unique token (prevents race condition
        # when same user sends two voice orders quickly)
        token = uuid.uuid4().hex[:12]
        _pending_orders[token] = {
            "user_id": user_id,
            "parsed": parsed,
            "klient": klient,
            "matched": matched,  # Bug #9: persist matched IDs
            "jami": jami,
            "text": text,
        }

        # Clean up old pending orders (keep max 50)
        if len(_pending_orders) > 50:
            oldest_keys = list(_pending_orders.keys())[:len(_pending_orders) - 50]
            for k in oldest_keys:
                _pending_orders.pop(k, None)

        # Inline keyboard — token in callback_data (unique per order)
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Tasdiqlash", callback_data=f"voice_order_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"voice_order_cancel_{token}"),
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

    # Extract token from callback_data: "voice_order_confirm_abc123" → "abc123"
    data = query.data or ""
    token = None
    if data.startswith("voice_order_confirm_"):
        token = data[len("voice_order_confirm_"):]
        action = "confirm"
    elif data.startswith("voice_order_cancel_"):
        token = data[len("voice_order_cancel_"):]
        action = "cancel"
    else:
        await query.edit_message_text("⚠️ Noto'g'ri callback.")
        return

    pending = _pending_orders.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Bu zakaz eskirgan. Qaytadan yuborin.")
        return

    # Verify the callback is from the same user who created the order
    if pending["user_id"] != user_id:
        _pending_orders[token] = pending  # Put it back
        await query.edit_message_text("⚠️ Bu zakaz boshqa foydalanuvchiga tegishli.")
        return

    if action == "cancel":
        await query.edit_message_text("❌ Zakaz bekor qilindi.")
        return

    if action == "confirm":
        try:
            pool = db._P()
            async with pool.acquire() as conn:
                # Bug #9: Use pre-matched items (tovar_id already resolved)
                # No need to re-fetch and re-match — prevents TOCTOU bugs
                result = await create_order_from_voice(
                    conn, user_id, pending["parsed"],
                    db_tovarlar=[],   # Not used when pre_matched provided
                    db_klientlar=[dict(r) for r in await conn.fetch(
                        "SELECT id, ism, telefon, manzil "
                        "FROM klientlar WHERE user_id = $1", user_id)],
                    pre_matched=pending["matched"],
                )

            if result["success"]:
                await query.edit_message_text(
                    f"✅ **Zakaz yaratildi!**\n\n"
                    f"🏪 {result['klient']}\n"
                    f"📦 {result['tovarlar_soni']} ta tovar\n"
                    f"💰 {_fmt(float(result['jami_summa']))}\n"
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
