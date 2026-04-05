"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXCEL CHAT HANDLER                               ║
║  Excel yuklash → AI bilan savol-javob                        ║
║                                                              ║
║  /excel — Excel chat rejimini yoqish/o'chirish               ║
║  Excel fayl yuborish → avtomatik tahlil                      ║
║  Matn yozish → AI javob (Excel kontekstida)                  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("savdoai.excel_chat")

# user_data kalitlari
_KEY_EXCEL = "excel_chat_data"      # parsed excel dict
_KEY_TARIX = "excel_chat_tarix"     # savol-javob tarixi
_KEY_FNAME = "excel_chat_fname"     # fayl nomi
_KEY_VAQT = "excel_chat_vaqt"       # yuklangan vaqt
_KEY_ACTIVE = "excel_chat_active"   # rejim faolmi


def excel_chat_active(context: ContextTypes.DEFAULT_TYPE) -> bool:
    """Excel chat rejimi faolmi?"""
    ud = context.user_data or {}
    if not ud.get(_KEY_ACTIVE):
        return False
    if not ud.get(_KEY_EXCEL):
        return False
    # 2 soatdan keyin avtomatik o'chadi
    vaqt = ud.get(_KEY_VAQT, 0)
    if time.time() - vaqt > 7200:
        _clear(context)
        return False
    return True


def _clear(context: ContextTypes.DEFAULT_TYPE):
    """Excel chat ma'lumotlarini tozalash"""
    ud = context.user_data
    if ud:
        ud.pop(_KEY_EXCEL, None)
        ud.pop(_KEY_TARIX, None)
        ud.pop(_KEY_FNAME, None)
        ud.pop(_KEY_VAQT, None)
        ud.pop(_KEY_ACTIVE, None)


async def cmd_excel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /excel buyrug'i — Excel chat rejimini yoqish/o'chirish.
    """
    if not await faol_tekshir(update):
        return

    if excel_chat_active(context):
        fname = context.user_data.get(_KEY_FNAME, "")
        kb = [
            [InlineKeyboardButton("🗑 Tozalash", callback_data="excel_clear"),
             InlineKeyboardButton("📊 Fayl haqida", callback_data="excel_info")]
        ]
        await update.message.reply_text(
            f"📊 Excel chat faol!\n"
            f"Fayl: `{fname}`\n\n"
            f"Savol yozing — javob beraman.\n"
            f"Yangi fayl yuborish mumkin.\n"
            f"/excel_stop — rejimni o'chirish",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(kb)
        )
    else:
        # Rejimni yoqish — keyingi Excel fayl excel_chat ga boradi
        context.user_data[_KEY_ACTIVE] = True
        context.user_data[_KEY_VAQT] = time.time()
        await update.message.reply_text(
            "📊 *Excel Chat yoqildi!*\n\n"
            "Excel fayl yuboring — men uni o'qib chiqaman.\n"
            "Keyin har qanday savol bering:\n\n"
            "• _Jami savdo qancha?_\n"
            "• _Фарход qancha oylik olgan?_\n"
            "• _Gazga qancha pul ketgan?_\n"
            "• _Eng katta savdo qaysi kuni?_\n\n"
            "👇 Excel faylni yuboring:",
            parse_mode=ParseMode.MARKDOWN
        )


async def cmd_excel_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/excel_stop — Excel chat rejimini o'chirish"""
    _clear(context)
    await update.message.reply_text(
        "✅ Excel chat rejimi o'chirildi.\n"
        "Yangi fayl yuborish uchun /excel bosing."
    )


async def excel_file_qabul(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Excel fayl qabul qilish. True qaytarsa — fayl qabul qilindi.
    hujjat.py dan chaqiriladi.
    """
    doc = update.message.document
    if not doc:
        return False

    fname = (doc.file_name or "").lower()
    if not fname.endswith((".xlsx", ".xls", ".xlsm")):
        return False

    # Fayl hajmi tekshiruvi (10 MB limit)
    if doc.file_size and doc.file_size > 10 * 1024 * 1024:
        await update.message.reply_text(
            "❌ Fayl juda katta (10 MB dan oshmasligi kerak)."
        )
        return True

    wait_msg = await update.message.reply_text("⏳ Excel faylni o'qiyapman...")

    try:
        # Faylni yuklash
        file = await context.bot.get_file(doc.file_id)
        file_bytes = await file.download_as_bytearray()

        # Parse qilish
        from shared.services.excel_chat import excel_parse
        parsed = excel_parse(bytes(file_bytes), doc.file_name or "file.xlsx")

        if "error" in parsed:
            await wait_msg.edit_text(f"❌ Xato: {parsed['error']}")
            return True

        # Saqlash
        context.user_data[_KEY_EXCEL] = parsed
        context.user_data[_KEY_FNAME] = doc.file_name
        context.user_data[_KEY_VAQT] = time.time()
        context.user_data[_KEY_TARIX] = []
        context.user_data[_KEY_ACTIVE] = True

        await wait_msg.edit_text(
            f"✅ *Excel fayl o'qildi!*\n\n"
            f"📄 Fayl: `{doc.file_name}`\n"
            f"📊 Sheetlar: {parsed['sheets_count']} ta\n"
            f"📝 Kataklar: {parsed['total_cells']:,}\n"
            f"📋 Sheetlar: {', '.join(s['name'] for s in parsed['sheets'][:10])}"
            f"{'...' if parsed['sheets_count'] > 10 else ''}\n\n"
            f"💬 Endi savol bering! Masalan:\n"
            f"• _Jami savdo qancha?_\n"
            f"• _Har bir xodim qancha oylik olgan?_\n"
            f"• _Xarajatlar ro'yxati_\n\n"
            f"🛑 Tugatish: /excel\\_stop",
            parse_mode=ParseMode.MARKDOWN
        )
        return True

    except Exception as e:
        log.error("Excel qabul xato: %s", e, exc_info=True)
        await wait_msg.edit_text(f"❌ Faylni o'qishda xato: {e}")
        return True


async def excel_savol_javob(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Excel haqida savol-javob. True qaytarsa — javob berildi.
    matn.py dan chaqiriladi.
    """
    if not excel_chat_active(context):
        return False

    savol = update.message.text
    if not savol or len(savol.strip()) < 2:
        return False

    # Buyruqlarni o'tkazib yuborish
    if savol.startswith("/"):
        return False

    parsed = context.user_data.get(_KEY_EXCEL)
    if not parsed:
        return False

    tarix = context.user_data.get(_KEY_TARIX, [])

    wait_msg = await update.message.reply_text("🤔 Tahlil qilyapman...")

    try:
        from shared.services.excel_chat import excel_savol
        javob = await excel_savol(parsed, savol, tarix)

        # Tarixga qo'shish
        tarix.append({"role": "user", "content": savol})
        tarix.append({"role": "assistant", "content": javob})

        # Oxirgi 20 ta xabarni saqlash (xotira tejash)
        context.user_data[_KEY_TARIX] = tarix[-20:]

        # Javobni yuborish (uzun bo'lsa bo'lib yuborish)
        if len(javob) <= 4000:
            await wait_msg.edit_text(
                javob,
                parse_mode=ParseMode.MARKDOWN
            )
        else:
            await wait_msg.delete()
            # Bo'lib yuborish
            for i in range(0, len(javob), 4000):
                chunk = javob[i:i+4000]
                await update.message.reply_text(chunk)

        return True

    except Exception as e:
        log.error("Excel savol xato: %s", e, exc_info=True)
        try:
            await wait_msg.edit_text(f"❌ Xato: {e}")
        except Exception:
            pass
        return True


async def excel_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Excel inline button callback"""
    q = update.callback_query
    await q.answer()
    data = q.data

    if data == "excel_clear":
        _clear(context)
        await q.edit_message_text("✅ Excel chat tozalandi.")

    elif data == "excel_info":
        parsed = context.user_data.get(_KEY_EXCEL)
        if not parsed:
            await q.edit_message_text("❌ Excel fayl yuklanmagan.")
            return

        info_lines = [f"📄 *{parsed['filename']}*\n"]
        for s in parsed["sheets"]:
            cell_count = len(s["data"])
            info_lines.append(f"  📋 `{s['name']}` — {s['rows']} qator, {cell_count} ta yozuv")

        info_lines.append(f"\n📊 Jami: {parsed['sheets_count']} sheet, {parsed['total_cells']:,} katak")

        await q.edit_message_text(
            "\n".join(info_lines),
            parse_mode=ParseMode.MARKDOWN
        )


def register_excel_chat_handlers(app):
    """Bot ga excel chat handlerlarini qo'shish"""
    from telegram.ext import CommandHandler, CallbackQueryHandler

    app.add_handler(CommandHandler("excel", cmd_excel))
    app.add_handler(CommandHandler("excel_stop", cmd_excel_stop))
    app.add_handler(CallbackQueryHandler(excel_callback, pattern=r"^excel_"))
