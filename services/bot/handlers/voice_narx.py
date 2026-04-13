"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI BOT — VOICE NARX HANDLER                           ║
║                                                              ║
║  Ovoz orqali tovar narxlarini o'rnatish.                    ║
║  "Dollux sotish narxi 85 ming, Rozabella arzon 98 ming"    ║
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
from shared.services.voice_order_parser import parse_narx_text, fuzzy_match_tovar, _to_decimal

log = logging.getLogger(__name__)

_pending_narxlar: dict[str, dict] = {}
_PENDING_TTL = 600


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _pending_narxlar.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_narxlar.pop(k, None)


def _fmt(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} mln"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming"
    return f"{n:,.0f}"


async def handle_voice_narx(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ovoz orqali tovar narxlarini o'rnatish."""
    msg = update.effective_message
    user_id = update.effective_user.id

    text = context.user_data.get("last_transcription", "")
    if not text:
        return

    text_lower = text.lower()
    narx_kw = ("narx o'rnat", "narx qo'y", "narx belgilab", "narx yangilab",
               "sotish narxi", "sotish narx")
    has_narx = any(kw in text_lower for kw in narx_kw)

    if not has_narx:
        return

    try:
        parsed = parse_narx_text(text)

        if parsed.get("xato") or not parsed.get("tovarlar"):
            await msg.reply_text(
                f"⚠️ Narx ma'lumotlarini tushunmadim:\n"
                f"{parsed.get('xato', '')}\n\n"
                f"💡 Format: «Dollux sotish narxi 85 ming, Rozabella 98 ming»"
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Get products from DB for matching
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))
            tovarlar = await conn.fetch(
                "SELECT id, nomi, sotish_narxi, olish_narxi FROM tovarlar WHERE user_id = $1 AND faol = TRUE",
                user_id,
            )
            tovarlar_list = [dict(r) for r in tovarlar]

        # Match tovarlar
        matched = []
        not_found = []
        for t in parsed["tovarlar"]:
            tv = fuzzy_match_tovar(t["nomi"], tovarlar_list)
            if tv:
                eski_narx = float(tv.get("sotish_narxi") or 0)
                yangi_narx = t["sotish_narxi"]
                matched.append({
                    "tovar_id": tv["id"],
                    "nomi": tv["nomi"],
                    "eski_narx": eski_narx,
                    "yangi_narx": yangi_narx,
                })
            else:
                not_found.append(t["nomi"])

        if not matched:
            await msg.reply_text(
                "⚠️ Birorta ham tovar topilmadi:\n"
                + "\n".join(f"  • {n}" for n in not_found)
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Build confirmation
        lines = [
            "🏷 **NARX YANGILASH**",
            f"📦 {len(matched)} ta tovar",
            "",
        ]
        for i, m in enumerate(matched, 1):
            change = ""
            if m["eski_narx"] > 0:
                diff = m["yangi_narx"] - m["eski_narx"]
                if diff > 0:
                    change = f" (📈 +{_fmt(diff)})"
                elif diff < 0:
                    change = f" (📉 {_fmt(diff)})"
                else:
                    change = " (=)"
            lines.append(
                f"{i}. {m['nomi']}\n"
                f"   {_fmt(m['eski_narx'])} → **{_fmt(m['yangi_narx'])}** so'm{change}"
            )

        if not_found:
            lines.append("\n❌ Topilmadi:")
            for n in not_found:
                lines.append(f"  • {n}")

        token = uuid.uuid4().hex[:12]
        _pending_narxlar[token] = {
            "user_id": user_id,
            "matched": matched,
            "text": text,
            "ts": time.time(),
        }
        _cleanup_expired()

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Yangilash", callback_data=f"voice_narx_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"voice_narx_cancel_{token}"),
            ]
        ])

        await msg.reply_text("\n".join(lines), parse_mode="Markdown", reply_markup=keyboard)
        context.user_data["_voice_order_handled"] = True

    except Exception as e:
        log.error("voice_narx: %s", e, exc_info=True)
        await msg.reply_text(f"⚠️ Xatolik: {str(e)[:200]}")


async def handle_voice_narx_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Narx tasdiqlash callback."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    data = query.data or ""
    if data.startswith("voice_narx_confirm_"):
        token = data[len("voice_narx_confirm_"):]
        action = "confirm"
    elif data.startswith("voice_narx_cancel_"):
        token = data[len("voice_narx_cancel_"):]
        action = "cancel"
    else:
        return

    pending = _pending_narxlar.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Eskirgan.")
        return

    if pending["user_id"] != user_id:
        _pending_narxlar[token] = pending
        return

    if action == "cancel":
        await query.edit_message_text("❌ Narx yangilash bekor qilindi.")
        return

    try:
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))
            for m in pending["matched"]:
                await conn.execute(
                    "UPDATE tovarlar SET sotish_narxi = $1 WHERE id = $2 AND user_id = $3",
                    Decimal(str(m["yangi_narx"])), m["tovar_id"], user_id,
                )

        details = "\n".join(
            f"  • {m['nomi']}: {_fmt(m['yangi_narx'])} so'm"
            for m in pending["matched"]
        )
        await query.edit_message_text(
            f"✅ **Narxlar yangilandi!**\n\n{details}\n\n"
            f"📦 {len(pending['matched'])} ta tovar yangilandi",
            parse_mode="Markdown",
        )
    except Exception as e:
        log.error("voice_narx confirm: %s", e, exc_info=True)
        await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
