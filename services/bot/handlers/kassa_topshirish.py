"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — KASSA TOPSHIRISH HANDLER                         ║
║                                                              ║
║  Shogird ofisga pul topshirganda RASM + summa yuboradi      ║
║  Bot: rasm + caption → bazaga "kassa kirim" yozadi          ║
║       admin/shogird tasdiqlay oladi                          ║
║                                                              ║
║  Foydalanish:                                                ║
║  📸 Rasm + caption: "Ofisga 5 mln topshirdim"               ║
║  yoki                                                        ║
║  🎤 Ovoz: "Obidjon kassaga 5 mln topshirdi"                 ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import re
import time
import uuid
from decimal import Decimal
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from services.bot import db

log = logging.getLogger(__name__)

_pending_topshirish: dict[str, dict] = {}
_PENDING_TTL = 600


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _pending_topshirish.items() if now - v.get("ts", 0) > _PENDING_TTL]
    for k in expired:
        _pending_topshirish.pop(k, None)


def _fmt(n: float) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.2f} mln"
    if n >= 1_000:
        return f"{n / 1_000:.0f} ming"
    return f"{n:,.0f}"


def _parse_summa(text: str) -> int:
    """Parse "5 mln", "500 ming", "5000000" → integer so'm."""
    s = text.lower()
    s = re.sub(r"\s*so'm\s*", "", s)

    m = re.search(r'(\d+(?:[.,]\d+)?)\s*mlrd', s)
    if m:
        return int(float(m.group(1).replace(",", ".")) * 1_000_000_000)
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*mln', s)
    if m:
        return int(float(m.group(1).replace(",", ".")) * 1_000_000)
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*ming', s)
    if m:
        return int(float(m.group(1).replace(",", ".")) * 1_000)
    nums = re.findall(r'\d+', s)
    if nums:
        # Take largest number
        return max(int(n) for n in nums if len(n) >= 4)
    return 0


def _is_topshirish(text: str) -> bool:
    """Check if text mentions handing money to office/cashbox."""
    text_lower = text.lower()
    keywords = ("topshirdi", "topshirildi", "tashladi", "berdi", "kassaga",
                "ofisga", "kassada", "ofisda", "qabul qildi", "tushirdi",
                "topshirgan", "tushirgan")
    return any(kw in text_lower for kw in keywords)


async def handle_topshirish_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Rasm + caption "5 mln topshirdim" — kassa kirim sifatida saqlash.

    Returns: True agar handled.
    """
    msg = update.effective_message
    user_id = update.effective_user.id
    caption = msg.caption or ""

    # Detect topshirish keyword
    if not _is_topshirish(caption):
        return False

    summa = _parse_summa(caption)
    if summa <= 0:
        return False

    holat = await msg.reply_text("💰 Kassa topshirish yozilmoqda...")

    try:
        # Save photo file_id (Telegram saqlaydi)
        photo = msg.photo[-1]
        rasm_file_id = photo.file_id

        # Try get local path (Local API mode)
        rasm_path = ""
        try:
            file = await context.bot.get_file(rasm_file_id)
            if file.file_path and file.file_path.startswith("/"):
                rasm_path = file.file_path
        except Exception:
            pass

        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute("SELECT set_config('app.uid', $1::text, true)", str(user_id))

            # Detect if user is admin or shogird
            is_admin = await conn.fetchval(
                "SELECT 1 FROM users WHERE id = $1 LIMIT 1", user_id,
            )

            shogird_row = None
            admin_uid = user_id
            if not is_admin:
                # Find shogird record
                shogird_row = await conn.fetchrow(
                    "SELECT id, admin_uid, ism FROM shogirdlar WHERE telegram_uid = $1",
                    user_id,
                )
                if shogird_row:
                    admin_uid = shogird_row["admin_uid"]
                    # Reset RLS to admin context
                    await conn.execute(
                        "SELECT set_config('app.uid', $1::text, true)", str(admin_uid),
                    )

            shogird_id = shogird_row["id"] if shogird_row else None
            shogird_ismi = shogird_row["ism"] if shogird_row else "Admin"

            # Insert
            topshirish_id = await conn.fetchval("""
                INSERT INTO kassa_topshirish
                    (admin_uid, shogird_id, summa, rasm_file_id, rasm_path,
                     izoh, yaratgan_uid, tasdiqlangan)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """, admin_uid, shogird_id, Decimal(str(summa)),
                rasm_file_id, rasm_path, caption[:300], user_id,
                bool(is_admin),  # admin yozsa avto-tasdiqlangan
            )

        # Confirmation message
        tasdiq_status = "✅ Tasdiqlangan" if is_admin else "⏳ Admin tasdiqi kutilmoqda"

        await holat.edit_text(
            f"💰 **KASSA TOPSHIRISH**\n\n"
            f"👤 Kim: {shogird_ismi}\n"
            f"💵 Summa: **{_fmt(summa)} so'm**\n"
            f"📝 Izoh: {caption[:100]}\n"
            f"🆔 ID: #{topshirish_id}\n"
            f"📊 Holat: {tasdiq_status}",
            parse_mode="Markdown",
        )

        # Notify admin if shogird sent
        if not is_admin and shogird_row:
            try:
                token = uuid.uuid4().hex[:12]
                _pending_topshirish[token] = {
                    "id": topshirish_id,
                    "admin_uid": admin_uid,
                    "ts": time.time(),
                }
                _cleanup_expired()

                kb = InlineKeyboardMarkup([[
                    InlineKeyboardButton("✅ Tasdiqlash", callback_data=f"topsh_ok_{token}"),
                    InlineKeyboardButton("❌ Rad etish", callback_data=f"topsh_no_{token}"),
                ]])
                await context.bot.send_photo(
                    chat_id=admin_uid,
                    photo=rasm_file_id,
                    caption=(
                        f"💰 **YANGI KASSA TOPSHIRISH**\n\n"
                        f"👤 Shogird: {shogird_ismi}\n"
                        f"💵 Summa: **{_fmt(summa)} so'm**\n"
                        f"📝 Izoh: {caption[:200]}\n"
                        f"🆔 ID: #{topshirish_id}\n\n"
                        f"Tasdiqlaysizmi?"
                    ),
                    parse_mode="Markdown",
                    reply_markup=kb,
                )
            except Exception as _e:
                log.warning("Admin notification: %s", _e)

        return True

    except Exception as e:
        log.error("topshirish: %s", e, exc_info=True)
        await holat.edit_text(f"⚠️ Xatolik: {str(e)[:200]}")
        return True


async def handle_topshirish_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Topshirishni admin tasdiqlash/rad etish."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    data = query.data or ""
    if data.startswith("topsh_ok_"):
        token = data[len("topsh_ok_"):]
        action = "ok"
    elif data.startswith("topsh_no_"):
        token = data[len("topsh_no_"):]
        action = "no"
    else:
        return

    pending = _pending_topshirish.pop(token, None)
    if not pending:
        await query.edit_message_caption(
            caption=(query.message.caption or "") + "\n\n⚠️ Eskirgan.",
        )
        return

    # Only admin can confirm
    if user_id != pending["admin_uid"]:
        await query.answer("Faqat admin tasdiqlaydi", show_alert=True)
        _pending_topshirish[token] = pending
        return

    try:
        pool = db._P()
        async with pool.acquire() as conn:
            await conn.execute(
                "SELECT set_config('app.uid', $1::text, true)", str(user_id),
            )
            if action == "ok":
                await conn.execute("""
                    UPDATE kassa_topshirish
                    SET tasdiqlangan = TRUE,
                        tasdiqlagan_uid = $1,
                        tasdiqlangan_sana = NOW()
                    WHERE id = $2
                """, user_id, pending["id"])
                await query.edit_message_caption(
                    caption=(query.message.caption or "") + "\n\n✅ TASDIQLANDI",
                )
            else:
                await conn.execute(
                    "DELETE FROM kassa_topshirish WHERE id = $1", pending["id"],
                )
                await query.edit_message_caption(
                    caption=(query.message.caption or "") + "\n\n❌ RAD ETILDI",
                )

    except Exception as e:
        log.error("topshirish callback: %s", e, exc_info=True)
        await query.edit_message_caption(
            caption=(query.message.caption or "") + f"\n\n⚠️ Xato: {str(e)[:100]}",
        )
