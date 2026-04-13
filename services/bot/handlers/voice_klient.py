"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI BOT — VOICE KLIENT HANDLER                         ║
║                                                              ║
║  Ovoz orqali yangi klient qo'shish.                         ║
║  "Yangi klient Jasur Aka, telefoni 91 542 76 43, Samarqand" ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db
from shared.services.voice_order_parser import parse_klient_text

log = logging.getLogger(__name__)

_pending_klientlar: dict[str, dict] = {}
_PENDING_TTL = 600


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _pending_klientlar.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_klientlar.pop(k, None)


def _fmt_kredit(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f} mlrd"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.0f} mln"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming"
    return str(n)


async def handle_voice_klient(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ovoz orqali yangi klient qo'shish."""
    msg = update.effective_message
    user_id = update.effective_user.id

    text = context.user_data.get("last_transcription", "")
    if not text:
        return

    # Detect klient creation keywords
    text_lower = text.lower()
    klient_kw = ("yangi klient", "klient qo'sh", "mijoz qo'sh", "yangi mijoz",
                 "yangi do'kon", "do'kon qo'sh")
    has_klient = any(kw in text_lower for kw in klient_kw)

    if not has_klient:
        return

    try:
        parsed = parse_klient_text(text)

        if parsed.get("xato") or not parsed.get("ism"):
            await msg.reply_text(
                f"⚠️ Klient ma'lumotlarini tushunmadim:\n"
                f"{parsed.get('xato', 'Ism aniqlanmadi')}\n\n"
                f"💡 Format: «Yangi klient Jasur Aka, telefon 91 542 76 43, Samarqand»"
            )
            context.user_data["_voice_order_handled"] = True
            return

        # Build confirmation message
        lines = [
            "👤 **YANGI KLIENT**",
            "",
            f"📛 Ism: **{parsed['ism']}**",
        ]
        if parsed["telefon"]:
            lines.append(f"📞 Telefon: {parsed['telefon']}")
        if parsed["manzil"]:
            lines.append(f"📍 Manzil: {parsed['manzil']}")
        if parsed["kredit_limit"] > 0:
            lines.append(f"💰 Kredit limit: {_fmt_kredit(parsed['kredit_limit'])} so'm")

        lines.append("")
        lines.append("Tasdiqlaysizmi?")

        token = uuid.uuid4().hex[:12]
        _pending_klientlar[token] = {
            "user_id": user_id,
            "parsed": parsed,
            "text": text,
            "ts": time.time(),
        }

        _cleanup_expired()

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Qo'shish", callback_data=f"voice_klient_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"voice_klient_cancel_{token}"),
            ]
        ])

        await msg.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
            reply_markup=keyboard,
        )

        context.user_data["_voice_order_handled"] = True

    except Exception as e:
        log.error("voice_klient: %s", e, exc_info=True)
        await msg.reply_text(f"⚠️ Xatolik: {str(e)[:200]}")


async def handle_voice_klient_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Klient tasdiqlash callback."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    data = query.data or ""
    if data.startswith("voice_klient_confirm_"):
        token = data[len("voice_klient_confirm_"):]
        action = "confirm"
    elif data.startswith("voice_klient_cancel_"):
        token = data[len("voice_klient_cancel_"):]
        action = "cancel"
    else:
        await query.edit_message_text("⚠️ Noto'g'ri callback.")
        return

    pending = _pending_klientlar.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Eskirgan. Qaytadan yuborin.")
        return

    if pending["user_id"] != user_id:
        _pending_klientlar[token] = pending
        await query.edit_message_text("⚠️ Boshqa foydalanuvchiga tegishli.")
        return

    if action == "cancel":
        await query.edit_message_text("❌ Klient qo'shish bekor qilindi.")
        return

    if action == "confirm":
        try:
            p = pending["parsed"]
            pool = db._P()
            async with pool.acquire() as conn:
                await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

                # Check if klient already exists
                existing = await conn.fetchval(
                    "SELECT id FROM klientlar WHERE user_id = $1 AND lower(ism) = lower($2)",
                    user_id, p["ism"],
                )

                if existing:
                    await query.edit_message_text(
                        f"⚠️ **{p['ism']}** allaqachon bazada bor (ID: {existing}).",
                        parse_mode="Markdown",
                    )
                    return

                klient_id = await conn.fetchval("""
                    INSERT INTO klientlar (user_id, ism, telefon, manzil, kredit_limit)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                """, user_id, p["ism"], p["telefon"] or None, p["manzil"] or None,
                    p["kredit_limit"] or 0)

            await query.edit_message_text(
                f"✅ **Klient qo'shildi!**\n\n"
                f"📛 {p['ism']}\n"
                f"📞 {p['telefon'] or '—'}\n"
                f"📍 {p['manzil'] or '—'}\n"
                f"💰 Kredit: {_fmt_kredit(p['kredit_limit'])} so'm\n"
                f"🆔 ID: {klient_id}",
                parse_mode="Markdown",
            )

        except Exception as e:
            log.error("voice_klient confirm: %s", e, exc_info=True)
            await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
