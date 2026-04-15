"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI BOT — VOICE XARAJAT HANDLER                        ║
║                                                              ║
║  Ovoz orqali xarajat qo'shish:                              ║
║  - Admin (siz): hamma xarajatlarni                          ║
║  - Shogird: faqat o'zining xarajatini                       ║
║                                                              ║
║  Masalan:                                                    ║
║  "Obidjon obed 50 ming" — admin qo'shadi Obidjonga          ║
║  "Oila non 15 ming" — admin shaxsiy/oila                    ║
║  "Obed 30 ming" — shogird o'ziga qo'shadi                   ║
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
from shared.services.voice_order_parser import parse_xarajat_text, _to_decimal
from shared.services import ovoz_arxiv

log = logging.getLogger(__name__)

_pending_xarajatlar: dict[str, dict] = {}
_PENDING_TTL = 600


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _pending_xarajatlar.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_xarajatlar.pop(k, None)


def _fmt(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} mln"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming"
    return f"{n:,.0f}"


async def handle_voice_xarajat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ovoz orqali xarajat qo'shish."""
    msg = update.effective_message
    user_id = update.effective_user.id

    text = context.user_data.get("last_transcription", "")
    if not text:
        return

    # Detect xarajat keywords
    text_lower = text.lower()
    xarajat_kw = ("xarajat", "obed", "benzin", "non", "oylik", "bozor",
                  "bozorlik", "taksi", "telefon", "gaz", "elektr", "dori",
                  "kiyim", "yog'", "go'sht", "meva")
    has_xarajat = any(kw in text_lower for kw in xarajat_kw)

    if not has_xarajat:
        return

    try:
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

            # Get shogirdlar for parser
            try:
                shogird_rows = await conn.fetch(
                    "SELECT id, telegram_uid, ism FROM shogirdlar "
                    "WHERE admin_uid = $1 AND faol = TRUE", user_id,
                )
                shogirdlar = [dict(r) for r in shogird_rows]
            except Exception:
                shogirdlar = []

        # Parse
        parsed = parse_xarajat_text(text, shogirdlar)

        if parsed.get("xato"):
            await msg.reply_text(
                f"⚠️ Xarajat ma'lumotini tushunmadim:\n{parsed.get('xato')}\n\n"
                f"💡 Format: «Obidjon obed 50 ming» yoki «Oila non 15 ming»"
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Build confirmation message
        tag = "💰 SHAXSIY"
        if parsed.get("shogird_ismi"):
            tag = f"👤 {parsed['shogird_ismi']}"
        elif parsed.get("is_oila"):
            tag = "🏠 OILA"

        kategoriya_emoji = {
            "ovqat": "🍽", "bozorlik": "🛒", "transport": "🚗",
            "aloqa": "📞", "oylik": "💵", "kommunal": "💡",
            "dori": "💊", "kiyim": "👕", "boshqa": "📦",
        }
        emoji = kategoriya_emoji.get(parsed["kategoriya"], "📦")

        lines = [
            "💸 **YANGI XARAJAT**",
            "",
            f"{tag}",
            f"{emoji} Kategoriya: {parsed['kategoriya'].title()}",
        ]
        if parsed.get("tavsif"):
            lines.append(f"📝 Tavsif: {parsed['tavsif']}")
        lines.append(f"💰 Summa: **{_fmt(parsed['summa'])} so'm**")
        lines.append("")
        lines.append("Tasdiqlaysizmi?")

        token = uuid.uuid4().hex[:12]
        _pending_xarajatlar[token] = {
            "user_id": user_id,
            "parsed": parsed,
            "text": text,
            "ts": time.time(),
        }
        _cleanup_expired()

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Qo'shish", callback_data=f"voice_xarajat_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"voice_xarajat_cancel_{token}"),
            ]
        ])

        await msg.reply_text("\n".join(lines), parse_mode="Markdown", reply_markup=keyboard)
        context.user_data["_voice_order_handled"] = True

    except Exception as e:
        log.error("voice_xarajat: %s", e, exc_info=True)
        await msg.reply_text(f"⚠️ Xatolik: {str(e)[:200]}")


async def handle_voice_xarajat_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Xarajat tasdiqlash callback."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    data = query.data or ""
    if data.startswith("voice_xarajat_confirm_"):
        token = data[len("voice_xarajat_confirm_"):]
        action = "confirm"
    elif data.startswith("voice_xarajat_cancel_"):
        token = data[len("voice_xarajat_cancel_"):]
        action = "cancel"
    else:
        return

    pending = _pending_xarajatlar.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Eskirgan.")
        return

    if pending["user_id"] != user_id:
        _pending_xarajatlar[token] = pending
        return

    if action == "cancel":
        await query.edit_message_text("❌ Xarajat bekor qilindi.")
        return

    try:
        p = pending["parsed"]
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

            shogird_id = p.get("shogird_id")
            kategoriya = p.get("kategoriya", "boshqa")
            tavsif = p.get("tavsif", "") or f"Ovoz orqali: {pending['text'][:100]}"
            summa = Decimal(str(p.get("summa", 0)))

            # Save to xarajatlar table
            xarajat_id = await conn.fetchval("""
                INSERT INTO xarajatlar
                    (admin_uid, shogird_id, kategoriya, tavsif, summa, sana)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id
            """, user_id, shogird_id, kategoriya, tavsif, summa)

        # Build success message
        tag = "💰 SHAXSIY"
        if p.get("shogird_ismi"):
            tag = f"👤 {p['shogird_ismi']}"
        elif p.get("is_oila"):
            tag = "🏠 OILA"

        await query.edit_message_text(
            f"✅ **Xarajat qo'shildi!**\n\n"
            f"{tag}\n"
            f"📁 {kategoriya.title()}\n"
            f"💰 {_fmt(float(summa))} so'm\n"
            f"🆔 ID: {xarajat_id}",
            parse_mode="Markdown",
        )

    except Exception as e:
        log.error("voice_xarajat confirm: %s", e, exc_info=True)
        await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
