"""Telegram: ESC/POS sessiya + HTTPS landing → savdoai:// print."""
from __future__ import annotations

import io
import logging
import os
from typing import Any
from urllib.parse import quote

log = logging.getLogger(__name__)

PRINT_ATTACH_BIN = os.environ.get("PRINT_ATTACH_BIN", "1") == "1"
DEFAULT_WIDTH = int(os.environ.get("PRINT_DEFAULT_WIDTH", "80"))

# Web app origin (Railway savdoai-web). Override if bot WEB_URL points elsewhere.
_DEFAULT_LANDING = "https://savdoai-web-production.up.railway.app"


def _telegram_print_landing_url(job_id: str, token: str, width: int) -> str:
    base = (
        os.environ.get("PRINT_LANDING_BASE_URL")
        or os.environ.get("WEB_URL")
        or _DEFAULT_LANDING
    ).rstrip("/")
    return (
        f"{base}/p/{quote(job_id, safe='')}"
        f"?t={quote(token, safe='')}&w={int(width)}"
    )


def _normalize_sale_dict(d: dict) -> dict:
    out = dict(d)
    if "tolangan" not in out and "tolandan" in out:
        out["tolangan"] = float(out.get("tolandan") or 0)
    out.setdefault("amal", "chiqim")
    return out


async def send_print_session(
    message,
    data: dict,
    dokon: str,
    tel: str = "",
    uid: int = 0,
    sess_id: int = 0,
    width: int | None = None,
) -> dict[str, Any] | None:
    """
    Inline tugma: HTTPS landing (WEB_URL yoki PRINT_LANDING_BASE_URL) → ilova savdoai://.
    PRINT_ATTACH_BIN=1 bo'lsa — zaxira .bin.
    """
    try:
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup, InputFile
        from telegram.constants import ParseMode

        from shared.services.escpos_xprinter import sotuv_cheki
        from shared.services.print_session import create

        w = width if width is not None else DEFAULT_WIDTH
        d = _normalize_sale_dict(data)
        klient = (d.get("klient") or d.get("klient_ismi") or "").strip()
        jami = float(d.get("jami_summa") or 0)
        e80 = sotuv_cheki(d, dokon, tel=tel, width=80, do_beep=True)
        e58 = sotuv_cheki(d, dokon, tel=tel, width=58, do_beep=False)
        sess = create(
            uid=uid,
            sid=sess_id,
            dokon=dokon,
            tel=tel,
            klient=klient,
            jami=jami,
            width=w,
            escpos_80=e80,
            escpos_58=e58,
        )
        stem = f"chek_{sess_id}_{(klient or 'mijoz').replace(' ', '_')[:12]}"

        if PRINT_ATTACH_BIN:
            await message.reply_document(
                document=InputFile(io.BytesIO(e80), filename=f"{stem}_80mm.bin"),
                caption=(
                    f"🖨 *{dokon}* | {klient or 'Mijoz'} | *{jami:,.0f}* so'm\n"
                    f"_Zaxira fayl (oddiy ishlatish shart emas — tugmani bosing)._"
                ),
                parse_mode=ParseMode.MARKDOWN,
            )

        # Telegram faqat https/http inline url qabul qiladi; landing sahifa savdoai:// ochadi.
        link = _telegram_print_landing_url(sess.job_id, sess.token, sess.width)
        await message.reply_text(
            "👇 *Bitta tugma — brauzer ochiladi, keyin print ilovasi:*\n"
            "Agar ilova ochilmasa, sahifadagi tugmani bosing yoki `.bin` fayldan foydalaning.",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(
                [[InlineKeyboardButton("🖨 CHEK CHIQARISH", url=link)]]
            ),
        )
        return sess.to_json()
    except Exception as e:
        log.error("send_print_session: %s", e, exc_info=True)
        try:
            await message.reply_text("❌ Chek tayyorlashda xato. Keyinroq urinib ko'ring.")
        except Exception:
            pass
        return None


async def handle_print_intent_message(update, ctx, kind: str, db_module) -> bool:
    """kind: 'print' | 'reprint' — oxirgi sotuvdan chek."""
    uid = update.effective_user.id
    try:
        user = await db_module.user_ol(uid)
        if not user:
            await update.message.reply_text("❌ Avval /start bosing.")
            return True
        user = dict(user)
        dokon = user.get("dokon_nomi") or "Mashrab Moliya"
        tel = user.get("telefon") or ""

        async with db_module._P().acquire() as c:
            ox = await c.fetchrow(
                "SELECT id, klient_ismi, jami, sana FROM sotuv_sessiyalar "
                "WHERE user_id=$1 ORDER BY sana DESC LIMIT 1",
                uid,
            )
        if not ox:
            await update.message.reply_text("❌ Hali sotuv yo'q. Avval sotuv qiling.")
            return True

        sess = await db_module.sessiya_ol(uid, ox["id"])
        if not sess:
            await update.message.reply_text("❌ Sotuv topilmadi.")
            return True

        d = dict(sess)
        d.setdefault("amal", "chiqim")
        d["user_id"] = uid
        kl = ox.get("klient_ismi") or "Mijoz"
        jami = float(ox.get("jami") or 0)
        note = "📋 *Oxirgi sotuv:* {0} — *{1:,.0f}* so'm".format(kl, jami)
        if kind == "reprint":
            note = "🔄 *Qayta chop* — " + note
        await update.message.reply_text(
            note + "\n⏳ Tayyorlanmoqda...",
            parse_mode="Markdown",
        )
        js = await send_print_session(
            update.message, d, dokon, tel, uid, ox["id"]
        )
        if js:
            ctx.user_data["last_print_job"] = js.get("job_id")
        return True
    except Exception as e:
        log.error("handle_print_intent_message: %s", e, exc_info=True)
        try:
            await update.message.reply_text("❌ Xato. Keyinroq urinib ko'ring.")
        except Exception:
            pass
        return True
