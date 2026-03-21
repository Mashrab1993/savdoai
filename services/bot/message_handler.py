"""
Telegram matn va fayl xabarlari — universal Claude suhbat va fayl tahlili.
ai_router.claude_universal_chat / claude_analyze_file_bytes dan foydalanadi.
"""
from __future__ import annotations

import logging
log = logging.getLogger(__name__)

_TG_MAX = 4000


def _truncate_tg(text: str, limit: int = _TG_MAX) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


async def universal_chat_reply(update, ctx) -> None:
    """
    Buyruq bo'lmagan matn uchun Claude Sonnet javobi (message matni message_handler
    chaqiruvidan oldin tekshirilgan bo'lishi kerak).
    """
    from services.cognitive.ai_router import claude_universal_chat

    msg = update.effective_message
    if not msg or not msg.text:
        return
    matn = msg.text.strip()
    if not matn:
        return

    try:
        from telegram.constants import ChatAction
        await msg.chat.send_action(ChatAction.TYPING)
    except Exception:
        pass

    try:
        javob = await claude_universal_chat(matn)
        await msg.reply_text(_truncate_tg(javob))
    except Exception as e:
        log.exception("universal_chat_reply: %s", e)
        try:
            await msg.reply_text(
                "❌ Javob olishda xato yuz berdi. Keyinroq urinib ko'ring yoki "
                "ANTHROPIC_API_KEY ni tekshiring."
            )
        except Exception:
            pass


def _hujjat_mime_aniqla(doc, fname: str) -> str:
    m = (doc.mime_type or "").strip()
    if m:
        return m
    fl = fname.lower()
    if fl.endswith(".pdf"):
        return "application/pdf"
    if fl.endswith(".xlsx"):
        return (
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )
    if fl.endswith(".xls"):
        return "application/vnd.ms-excel"
    if fl.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if fl.endswith(".png"):
        return "image/png"
    if fl.endswith(".webp"):
        return "image/webp"
    if fl.endswith(".gif"):
        return "image/gif"
    return "application/octet-stream"


async def fayl_tahlili_claude(update, ctx, data: bytes, fname: str, holat_msg) -> None:
    """
    PDF, Excel, rasm (document sifatida) — base64 orqali Claude tahlili.
    ctx.bot.get_file + download allaqachon bajarilgan bo'lishi kerak.
    """
    from services.cognitive.ai_router import claude_analyze_file_bytes

    doc = update.message.document
    if not doc:
        return

    mime = _hujjat_mime_aniqla(doc, fname)

    try:
        javob = await claude_analyze_file_bytes(data, mime, fname)
        text = _truncate_tg(javob)
        try:
            await holat_msg.edit_text(text)
        except Exception:
            await update.message.reply_text(text)
    except Exception as e:
        log.exception("fayl_tahlili_claude: %s", e)
        err = "❌ Fayl tahlilida xato yuz berdi. Format yoki hajmni tekshiring."
        try:
            await holat_msg.edit_text(err)
        except Exception:
            try:
                await update.message.reply_text(err)
            except Exception:
                pass
