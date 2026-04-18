"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI BOT — VOICE KIRIM HANDLER                          ║
║                                                              ║
║  Distributor ovoz yuboradi → zavoddan kelgan tovarlar         ║
║  avtomatik bazaga kiritiladi (qoldiq +, narx yangilanadi).   ║
║                                                              ║
║  Flow:                                                       ║
║    1. Distributor /kirim_ovoz yoki ovozli xabar yuboradi     ║
║    2. Gemini STT → matn                                     ║
║    3. parse_kirim_text() → yetkazuvchi + tovarlar + narxlar  ║
║    4. Tasdiqlash so'rash (inline keyboard)                   ║
║    5. Tasdiqlanganda → create_kirim_from_voice()            ║
║    6. Qoldiq yangilandi, narxlar saqlandi                    ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time
import uuid
from decimal import Decimal
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db
from shared.services.voice_order_parser import (
    parse_kirim_text,
    smart_parse_kirim_with_gemini,
    fuzzy_match_tovar,
    create_kirim_from_voice,
    _to_decimal,
)

log = logging.getLogger(__name__)

# Pending kirim orders keyed by unique token
_pending_kirims: dict[str, dict] = {}
_PENDING_TTL = 600  # 10 minutes


def _cleanup_expired_kirims():
    """Remove pending kirims older than 10 minutes."""
    now = time.time()
    expired = [k for k, v in _pending_kirims.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_kirims.pop(k, None)


def _fmt(n: float) -> str:
    """Format number as UZS."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} mln so'm"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming so'm"
    return f"{n:,.0f} so'm"


async def handle_voice_kirim(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Distributor ovozli xabar yubordi — kirim yaratish jarayoni.

    Bu handler /kirim_ovoz buyrug'i yoki voice_pipeline dan keyin
    chaqiriladi. Matn context.user_data["last_transcription"] da.
    """
    msg = update.effective_message
    user_id = update.effective_user.id

    # Get transcribed text
    text = context.user_data.get("last_transcription", "")
    if not text:
        await msg.reply_text("⚠️ Ovoz tanilmadi. Qaytadan urinib ko'ring.")
        return

    # Check if this looks like a kirim — require BOTH:
    # 1) At least one kirim keyword
    # 2) A quantity indicator (number or qty word)
    # This prevents "zavoddan bachchamni olib keldim" from triggering
    text_lower = text.lower()
    words = text.split()
    kirim_keywords = ("keldi", "kelgan", "tushdi", "kirim", "kirimi", "olish narx",
                      "sotish narx", "sotishi", "zavoddan", "fabrika", "kompaniya")
    has_kirim_kw = any(kw in text_lower for kw in kirim_keywords)
    has_qty = any(w.isdigit() for w in words) or any(
        w.lower() in ("ta", "dona", "karobka", "shtuk", "kg", "pachka") for w in words
    )
    has_price = any(kw in text_lower for kw in ("narx", "narxi", "ming", "mln", "so'm"))
    # Require keyword + (quantity OR price mention)
    has_kirim = has_kirim_kw and (has_qty or has_price)

    if not has_kirim:
        return  # Not a kirim message — let other handlers process

    try:
        # Get DB connection
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

            # Get user's products for fuzzy matching
            tovarlar = await conn.fetch("""
                SELECT id, nomi, kategoriya, birlik, sotish_narxi, olish_narxi, qoldiq
                FROM tovarlar WHERE user_id = $1 AND faol = TRUE
                ORDER BY nomi
            """, user_id)
            tovarlar_list = [dict(r) for r in tovarlar]

        # Parse the text — try regex first, then Gemini AI
        parsed = parse_kirim_text(text)

        if parsed.get("xato") or not parsed.get("tovarlar"):
            # Regex failed — try Gemini smart parser
            try:
                parsed = await smart_parse_kirim_with_gemini(
                    text,
                    [t.get("nomi", "") for t in tovarlar_list],
                )
            except Exception as _sp:
                log.debug("smart kirim parse fallback: %s", _sp)

        if parsed.get("xato"):
            await msg.reply_text(
                f"⚠️ Kirim ma'lumotlarini tushunmadim:\n{parsed['xato']}\n\n"
                f"📝 Matn: {text[:200]}\n\n"
                f"💡 Format: «Tovar 100 ta keldi, kirim narxi 69 ming, sotuv narxi 85 ming»"
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Match tovarlar
        matched = []
        not_found = []
        jami_kirim = Decimal("0")

        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], tovarlar_list)
            if tv:
                kirim_narxi = _to_decimal(t.get("kirim_narxi"))
                sotish_narxi = _to_decimal(t.get("sotish_narxi"))
                miqdor = t["miqdor"]
                summa = Decimal(str(miqdor)) * kirim_narxi
                jami_kirim += summa
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "miqdor": miqdor,
                    "kirim_narxi": kirim_narxi,
                    "sotish_narxi": sotish_narxi,
                    "jami": summa,
                    "birlik": tv.get("birlik", "dona"),
                    "kategoriya": tv.get("kategoriya", "Boshqa"),
                    "eski_qoldiq": _to_decimal(tv.get("qoldiq")),
                    "eski_olish": _to_decimal(tv.get("olish_narxi")),
                    "eski_sotish": _to_decimal(tv.get("sotish_narxi")),
                })
            else:
                not_found.append(t["nomi"])

        if not matched:
            await msg.reply_text(
                "⚠️ Birorta ham tovar topilmadi:\n"
                + "\n".join(f"  • {n}" for n in not_found)
                + "\n\n💡 Tovar nomini DB'dagi kabi ayting."
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Build confirmation message
        yetkazuvchi = parsed.get("yetkazuvchi", "")
        lines = [
            f"📥 **KIRIM — {yetkazuvchi or 'Yetkazuvchi noaniq'}**",
            f"📦 {len(matched)} ta tovar, {_fmt(float(jami_kirim))}",
            "",
        ]
        for i, m in enumerate(matched, 1):
            narx_info = ""
            if m["kirim_narxi"] > 0:
                narx_info += f"   💰 Kirim: {float(m['kirim_narxi']):,.0f}"
                if m["eski_olish"] > 0 and m["eski_olish"] != m["kirim_narxi"]:
                    narx_info += f" (eski: {float(m['eski_olish']):,.0f})"
                narx_info += "\n"
            if m["sotish_narxi"] > 0:
                narx_info += f"   🏷 Sotish: {float(m['sotish_narxi']):,.0f}"
                if m["eski_sotish"] > 0 and m["eski_sotish"] != m["sotish_narxi"]:
                    narx_info += f" (eski: {float(m['eski_sotish']):,.0f})"
                narx_info += "\n"

            lines.append(
                f"{i}. {m['nomi']}\n"
                f"   📦 +{m['miqdor']} {m['birlik']} (hozir: {float(m['eski_qoldiq']):.0f})\n"
                f"{narx_info}"
            )

        if not_found:
            lines.append("❌ Topilmadi:")
            for n in not_found:
                lines.append(f"  • {n}")

        lines.append(f"💰 **JAMI KIRIM: {_fmt(float(jami_kirim))}**")

        # Store pending kirim with unique token
        token = uuid.uuid4().hex[:12]
        _pending_kirims[token] = {
            "user_id": user_id,
            "parsed": parsed,
            "matched": matched,
            "jami": jami_kirim,
            "text": text,
            "ts": time.time(),
        }

        # Clean up expired + overflow
        _cleanup_expired_kirims()
        if len(_pending_kirims) > 50:
            oldest_keys = list(_pending_kirims.keys())[:len(_pending_kirims) - 50]
            for k in oldest_keys:
                _pending_kirims.pop(k, None)

        # Inline keyboard
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Tasdiqlash", callback_data=f"voice_kirim_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"voice_kirim_cancel_{token}"),
            ]
        ])

        await msg.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
            reply_markup=keyboard,
        )

        # Signal to main pipeline that kirim was handled
        context.user_data["_voice_order_handled"] = True

    except Exception as e:
        log.error("voice_kirim: %s", e, exc_info=True)
        await msg.reply_text(f"⚠️ Xatolik: {str(e)[:200]}")


async def handle_voice_kirim_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Kirim tasdiqlash/bekor callback handler."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    # Extract token
    data = query.data or ""
    token = None
    if data.startswith("voice_kirim_confirm_"):
        token = data[len("voice_kirim_confirm_"):]
        action = "confirm"
    elif data.startswith("voice_kirim_cancel_"):
        token = data[len("voice_kirim_cancel_"):]
        action = "cancel"
    else:
        await query.edit_message_text("⚠️ Noto'g'ri callback.")
        return

    pending = _pending_kirims.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Bu kirim eskirgan. Qaytadan yuborin.")
        return

    # Verify user
    if pending["user_id"] != user_id:
        _pending_kirims[token] = pending
        await query.edit_message_text("⚠️ Bu kirim boshqa foydalanuvchiga tegishli.")
        return

    if action == "cancel":
        await query.edit_message_text("❌ Kirim bekor qilindi.")
        return

    if action == "confirm":
        try:
            pool = db._P()
            async with pool.acquire() as conn:
                result = await create_kirim_from_voice(
                    conn, user_id, pending["parsed"],
                    db_tovarlar=[],
                    pre_matched=pending["matched"],
                )

            if result["success"]:
                # Build success message with details
                details = []
                for m in result.get("matched_items", []):
                    details.append(f"  • {m['nomi']}: +{m['miqdor']} {m.get('birlik', 'dona')}")

                await query.edit_message_text(
                    f"✅ **Kirim muvaffaqiyatli!**\n\n"
                    f"📥 {result.get('yetkazuvchi') or 'Kirim'}\n"
                    f"📦 {result['tovarlar_soni']} ta tovar\n"
                    f"💰 {_fmt(float(result['jami_summa']))}\n\n"
                    + "\n".join(details) + "\n\n"
                    "🔄 Qoldiq va narxlar yangilandi!",
                    parse_mode="Markdown",
                )
            else:
                errors = "\n".join(f"• {e}" for e in result["xatolar"])
                await query.edit_message_text(
                    f"⚠️ Kirim yaratishda xato:\n{errors}"
                )

        except Exception as e:
            log.error("voice_kirim confirm: %s", e, exc_info=True)
            await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
