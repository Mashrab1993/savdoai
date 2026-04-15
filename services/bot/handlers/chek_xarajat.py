"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — CHEK XARAJAT HANDLER                             ║
║                                                              ║
║  /chek buyrug'i bilan chek rasmini yuboring:                ║
║  - Bot Gemini Vision orqali o'qiydi                         ║
║  - Avtomatik kategoriya aniqlaydi                            ║
║  - Tasdiqlash so'raydi                                       ║
║  - xarajatlar jadvaliga saqlaydi                             ║
║                                                              ║
║  Foydalanish:                                                ║
║  1. /chek buyrug'i                                           ║
║  2. Bot "Chek rasmini yuboring" deydi                       ║
║  3. Rasm yuborasiz                                           ║
║  4. Bot ma'lumotlarni o'qiydi va tasdiqlash so'raydi        ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import os
import tempfile
import time
import uuid
from decimal import Decimal
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db
from shared.services.chek_oqish import chek_oqish

log = logging.getLogger(__name__)

_pending_cheklar: dict[str, dict] = {}
_PENDING_TTL = 600


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _pending_cheklar.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_cheklar.pop(k, None)


def _fmt(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} mln"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming"
    return f"{n:,.0f}"


async def cmd_chek(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """/chek buyrug'i — chek yuborish rejimini yoqish."""
    context.user_data["_chek_kutilmoqda"] = True
    await update.message.reply_text(
        "📸 **Chek rasmini yuboring**\n\n"
        "Bot quyidagilarni avtomatik o'qiydi:\n"
        "• Sotuvchi (AZS, do'kon nomi)\n"
        "• Kategoriya (transport, bozorlik...)\n"
        "• Mahsulotlar va narxlar\n"
        "• Umumiy summa\n\n"
        "Qabul qilingan cheklar:\n"
        "🚗 AZS (gaz, benzin, dizel)\n"
        "🛒 Magnit, do'kon (oziq-ovqat)\n"
        "💊 Dorixona\n"
        "📞 Aloqa to'lovi\n"
        "🧴 Maishiy kimyo",
        parse_mode="Markdown",
    )


async def handle_chek_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Chek rasmini qayta ishlash.

    Returns: True agar handled, False agar /chek rejimida emas.
    """
    if not context.user_data.get("_chek_kutilmoqda"):
        return False

    msg = update.effective_message
    user_id = update.effective_user.id

    # Clear flag
    context.user_data["_chek_kutilmoqda"] = False

    holat = await msg.reply_text("📸 Chek o'qilmoqda... (3-5 sekund)")

    try:
        # Download image
        photo = msg.photo[-1]  # Highest resolution
        file = await context.bot.get_file(photo.file_id)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
        await file.download_to_drive(tmp_path)

        # Read chek with Gemini Vision
        result = await chek_oqish(tmp_path)

        try:
            os.remove(tmp_path)
        except Exception:
            pass

        if result.get("xato"):
            await holat.edit_text(
                f"⚠️ Chekni o'qib bo'lmadi:\n{result['xato']}\n\n"
                f"💡 Rasm aniq, yorug', butun chek ko'rinadigan bo'lsin."
            )
            return True

        # Build confirmation
        kategoriya_emoji = {
            "transport": "🚗", "bozorlik": "🛒", "aloqa": "📞",
            "dori": "💊", "ovqat": "🍽", "kommunal": "💡",
            "kiyim": "👕", "boshqa": "📦",
        }
        emoji = kategoriya_emoji.get(result["kategoriya"], "📦")

        lines = [
            "🧾 **CHEK O'QILDI**",
            "",
            f"🏪 Sotuvchi: {result['sotuvchi']}",
            f"{emoji} Kategoriya: {result['kategoriya'].title()}",
        ]
        if result.get("sana"):
            lines.append(f"📅 Sana: {result['sana']} {result.get('vaqt', '')}")

        if result.get("tovarlar"):
            lines.append("")
            lines.append("📦 **Tovarlar:**")
            for i, t in enumerate(result["tovarlar"][:5], 1):
                miqdor_str = f"{t['miqdor']:.1f}" if t['miqdor'] else "?"
                lines.append(f"  {i}. {t['nomi']} — {miqdor_str} × {_fmt(t['narx'])} = {_fmt(t['jami'])}")

        lines.append("")
        lines.append(f"💰 **JAMI: {_fmt(result['jami'])} so'm**")
        lines.append("")
        lines.append("Saqlaymi?")

        token = uuid.uuid4().hex[:12]
        _pending_cheklar[token] = {
            "user_id": user_id,
            "result": result,
            "ts": time.time(),
        }
        _cleanup_expired()

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Saqlash", callback_data=f"chek_confirm_{token}"),
                InlineKeyboardButton("❌ Bekor", callback_data=f"chek_cancel_{token}"),
            ]
        ])

        await holat.edit_text(
            "\n".join(lines),
            parse_mode="Markdown",
            reply_markup=keyboard,
        )
        return True

    except Exception as e:
        log.error("handle_chek_photo: %s", e, exc_info=True)
        await holat.edit_text(f"⚠️ Xatolik: {str(e)[:200]}")
        return True


async def handle_chek_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Chek tasdiqlash callback."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    data = query.data or ""
    if data.startswith("chek_confirm_"):
        token = data[len("chek_confirm_"):]
        action = "confirm"
    elif data.startswith("chek_cancel_"):
        token = data[len("chek_cancel_"):]
        action = "cancel"
    else:
        return

    pending = _pending_cheklar.pop(token, None)
    if not pending:
        await query.edit_message_text("⚠️ Eskirgan.")
        return

    if pending["user_id"] != user_id:
        _pending_cheklar[token] = pending
        return

    if action == "cancel":
        await query.edit_message_text("❌ Chek bekor qilindi.")
        return

    try:
        r = pending["result"]
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

            tavsif = f"Chek: {r['sotuvchi']}"
            if r.get("tovarlar"):
                items = ", ".join(t["nomi"] for t in r["tovarlar"][:3])
                tavsif = f"{r['sotuvchi']} — {items}"
            tavsif = tavsif[:200]

            xarajat_id = await conn.fetchval("""
                INSERT INTO xarajatlar
                    (admin_uid, kategoriya, tavsif, summa, sana)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING id
            """, user_id, r["kategoriya"], tavsif, Decimal(str(r["jami"])))

        await query.edit_message_text(
            f"✅ **Chek saqlandi!**\n\n"
            f"🏪 {r['sotuvchi']}\n"
            f"💰 {_fmt(r['jami'])} so'm\n"
            f"🆔 ID: {xarajat_id}",
            parse_mode="Markdown",
        )

    except Exception as e:
        log.error("chek confirm: %s", e, exc_info=True)
        await query.edit_message_text(f"⚠️ Xatolik: {str(e)[:200]}")
