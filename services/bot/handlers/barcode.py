"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — SHTRIX-KOD SKANERLASH                            ║
║  Rasm → barcode dekod → tovar qidirish/yaratish             ║
║                                                              ║
║  2 ta dekod usuli:                                           ║
║  1. pyzbar (lokal, tez, offline)                             ║
║  2. Gemini Vision (cloud, har doim ishlaydi)                ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
from services.bot.bot_helpers import faol_tekshir
from shared.utils.fmt import pul

log = logging.getLogger("savdoai.bot.barcode")


async def cmd_barcode(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Shtrix-kod skanerlash haqida yo'riqnoma."""
    if not await faol_tekshir(update):
        return
    await update.message.reply_text(
        "📸 *Shtrix\\-kod skanerlash*\n\n"
        "Tovar shtrix\\-kodining rasmini yuboring\\.\n"
        "Bot avtomatik tovarni topadi yoki yangi yaratadi\\.\n\n"
        "💡 Rasm aniq va yaqindan bo'lishi kerak\\.\n"
        "📌 Caption ga `barcode` yoki `shtrix` yozing\\.",
        parse_mode=ParseMode.MARKDOWN_V2,
    )


async def barcode_rasm_qabul(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Rasmdan shtrix-kodni aniqlash va tovar topish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    # Caption tekshiruv — faqat "barcode" yoki "shtrix" bo'lsa ishlaydi
    caption = (update.message.caption or "").lower()
    if "barcode" not in caption and "shtrix" not in caption and "штрих" not in caption:
        return  # oddiy rasm — boshqa handlerga o'tsin

    msg = await update.message.reply_text("🔍 Shtrix-kod tekshirilmoqda...")

    try:
        # 1. Rasmni yuklab olish
        photo = update.message.photo[-1]
        file = await ctx.bot.get_file(photo.file_id)
        buf = io.BytesIO()
        await file.download_to_memory(buf)
        buf.seek(0)

        # 2. Barcode dekod
        barcode_value = await _decode_barcode(buf.getvalue())

        if not barcode_value:
            await msg.edit_text(
                "❌ Shtrix-kod topilmadi.\n"
                "📸 Rasmni yaqinroq va aniqroq olib qayta yuboring.\n"
                "📌 Caption ga `barcode` yozing."
            )
            return

        # 3. DB dan qidirish
        tovar = await _tovar_barcode_bilan(uid, barcode_value)

        if tovar:
            await msg.edit_text(
                f"✅ *Tovar topildi!*\n\n"
                f"📦 {tovar['nomi']}\n"
                f"🏷 Shtrix-kod: `{barcode_value}`\n"
                f"📊 Qoldiq: {tovar['qoldiq']} {tovar.get('birlik', 'dona')}\n"
                f"💰 Sotish: {pul(tovar.get('sotish_narxi', 0))} so'm\n"
                f"💵 Olish: {pul(tovar.get('olish_narxi', 0))} so'm",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "🛒 Sotish", callback_data=f"bc:sell:{tovar['id']}"
                        ),
                        InlineKeyboardButton(
                            "📝 Tahrirlash", callback_data=f"bc:edit:{tovar['id']}"
                        ),
                    ],
                ]),
            )
        else:
            # Tovar yo'q — yaratish taklifi
            ctx.user_data["pending_barcode"] = barcode_value
            await msg.edit_text(
                f"🆕 Yangi shtrix-kod: `{barcode_value}`\n\n"
                f"Bu kod bazada yo'q. Tovar yaratish uchun\n"
                f"tovar nomini va narxini yozing:\n\n"
                f"Masalan: `Coca-Cola 1L 8000 12000`\n"
                f"_(nom olish_narx sotish_narx)_",
                parse_mode=ParseMode.MARKDOWN,
            )

    except Exception as e:
        log.error("barcode: %s", e, exc_info=True)
        await msg.edit_text("❌ Shtrix-kod tekshirishda xato yuz berdi.")


async def barcode_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Barcode callback — sotish/tahrirlash."""
    q = update.callback_query
    await q.answer()
    data = q.data  # bc:sell:123 yoki bc:edit:123
    parts = data.split(":")
    if len(parts) < 3:
        return

    action = parts[1]
    try:
        tovar_id = int(parts[2])
    except (ValueError, IndexError):
        return


    if action == "sell":
        ctx.user_data["barcode_sell"] = tovar_id
        await q.message.reply_text(
            "📝 Miqdor va klient ismini kiriting:\n"
            "Masalan: `3 Anvar aka`\n"
            "Yoki faqat miqdor: `5`",
            parse_mode=ParseMode.MARKDOWN,
        )
    elif action == "edit":
        await q.message.reply_text(
            "✏️ Tovarni tahrirlash uchun /tovar buyrug'ini ishlating."
        )


async def _decode_barcode(image_bytes: bytes) -> str | None:
    """Rasmdan barcode qiymatini olish — pyzbar yoki Gemini."""
    # Variant 1: pyzbar (lokal, tez)
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes))
        results = pyzbar_decode(img)
        if results:
            val = results[0].data.decode("utf-8")
            log.info("Barcode (pyzbar): %s", val)
            return val
    except ImportError:
        log.debug("pyzbar o'rnatilmagan — Gemini Vision ishlatiladi")
    except Exception as e:
        log.debug("pyzbar xato: %s", e)

    # Variant 2: Gemini Vision (cloud fallback)
    try:
        import os
        import base64

        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            return None

        import google.genai as genai

        client = genai.Client(api_key=key)
        b64 = base64.b64encode(image_bytes).decode()
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=[
                {
                    "parts": [
                        {
                            "text": (
                                "Bu rasmdagi shtrix-kod (barcode) yoki QR-kod raqamini aniqla. "
                                "FAQAT raqamni qaytar, boshqa hech narsa yozma. "
                                "Agar shtrix-kod topilmasa 'NONE' yoz."
                            )
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": b64,
                            }
                        },
                    ]
                }
            ],
        )
        result = (response.text or "").strip()
        if result and result != "NONE" and len(result) >= 4:
            log.info("Barcode (Gemini): %s", result)
            return result
    except Exception as e:
        log.debug("Gemini barcode: %s", e)

    return None


async def _tovar_barcode_bilan(uid: int, barcode: str) -> dict | None:
    """DB dan barcode bo'yicha tovar topish."""
    try:
        async with db._P().acquire() as c:
            row = await c.fetchrow(
                "SELECT id, nomi, qoldiq, birlik, sotish_narxi, olish_narxi, shtrix_kod "
                "FROM tovarlar WHERE user_id=$1 AND shtrix_kod=$2",
                uid,
                barcode,
            )
            return dict(row) if row else None
    except Exception as e:
        log.debug("barcode DB: %s", e)
        return None
