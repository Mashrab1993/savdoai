"""
Bot umumiy yordamchi funksiyalar.
Handler modullar bu yerdan import qiladi — circular import bo'lmaydi.
"""
from __future__ import annotations
import logging
import time as _time

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.error import BadRequest

import services.bot.db as db

log = logging.getLogger("savdoai.bot")

# ════════════════════════════════════════════════════════════════
#  KESH (in-memory)
# ════════════════════════════════════════════════════════════════

_kesh: dict = {}
_KESH_TTL = 60
_KESH_USER_TTL = 120
_KESH_MAX_SIZE = 2000


def _kesh_ol(kalit: str):
    e = _kesh.get(kalit)
    if e and _time.time() - e["t"] < e.get("ttl", _KESH_TTL):
        return e["v"]
    if e:
        _kesh.pop(kalit, None)
    return None


def _kesh_yoz(kalit: str, qiymat, ttl: int = _KESH_TTL) -> None:
    if len(_kesh) >= _KESH_MAX_SIZE:
        now = _time.time()
        expired = [k for k, v in _kesh.items() if now - v["t"] >= v.get("ttl", _KESH_TTL)]
        for k in expired:
            _kesh.pop(k, None)
        if len(_kesh) >= _KESH_MAX_SIZE:
            oldest = sorted(_kesh.items(), key=lambda x: x[1]["t"])[:_KESH_MAX_SIZE // 4]
            for k, _ in oldest:
                _kesh.pop(k, None)
    _kesh[kalit] = {"v": qiymat, "t": _time.time(), "ttl": ttl}


def _kesh_tozala(kalit: str) -> None:
    _kesh.pop(kalit, None)


def _kesh_tozala_prefix(prefix: str) -> None:
    keys = [k for k in _kesh if k.startswith(prefix)]
    for k in keys:
        _kesh.pop(k, None)


# ════════════════════════════════════════════════════════════════
#  USER HELPERS
# ════════════════════════════════════════════════════════════════

async def _user_ol_kesh(uid: int):
    """user_ol + kesh"""
    k = f"user:{uid}"
    cached = _kesh_ol(k)
    if cached is not None:
        return cached
    user = await db.user_ol(uid)
    if user:
        user = dict(user)
        _kesh_yoz(k, user, _KESH_USER_TTL)
    return user


# ════════════════════════════════════════════════════════════════
#  MATN HELPERS
# ════════════════════════════════════════════════════════════════

def _md_safe(text: str) -> str:
    """MARKDOWN maxsus belgilarni escape qilish"""
    for ch in ('_', '*', '`', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'):
        text = text.replace(ch, '\\' + ch)
    return text


def _truncate(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n\n... (qisqartirildi)"


# ════════════════════════════════════════════════════════════════
#  XABAR YUBORISH HELPERS
# ════════════════════════════════════════════════════════════════

async def _safe_reply(update_or_msg, matn: str, **kw) -> None:
    """Xavfsiz xabar yuborish — truncation + MARKDOWN fallback"""
    matn = _truncate(matn)
    msg = update_or_msg.message if hasattr(update_or_msg, 'message') else update_or_msg
    try:
        await msg.reply_text(matn, **kw)
    except BadRequest as e:
        if "parse" in str(e).lower() or "entities" in str(e).lower():
            kw.pop("parse_mode", None)
            clean = matn.replace("*", "").replace("_", "").replace("`", "")
            await msg.reply_text(_truncate(clean), **kw)
        else:
            log.warning("safe_reply: %s", e)


async def xat(q, matn: str, **kw) -> None:
    matn = _truncate(matn)
    try:
        await q.edit_message_text(matn, **kw)
    except BadRequest as e:
        err = str(e).lower()
        if "not modified" in err:
            return
        if "parse" in err or "can't" in err or "entities" in err:
            kw.pop("parse_mode", None)
            try:
                clean = matn.replace("*", "").replace("_", "").replace("`", "")
                await q.edit_message_text(clean, **kw)
            except Exception:
                pass
        else:
            log.warning("xat: %s", e)


async def _yuborish(update: Update, matn: str, **kw) -> None:
    if update.message:
        await update.message.reply_text(matn, **kw)
    elif update.callback_query:
        await xat(update.callback_query, matn, **kw)


# ════════════════════════════════════════════════════════════════
#  FAOL TEKSHIRUV
# ════════════════════════════════════════════════════════════════

async def faol_tekshir(update: Update) -> bool:
    import datetime
    uid = update.effective_user.id
    user = await _user_ol_kesh(uid)
    if not user:
        msg = "❌ Siz ro'yxatdan o'tmagansiz. /start bosing."
    elif not user.get("faol", False):
        msg = "⏳ Hisobingiz hali tasdiqlanmagan."
    else:
        if user.get("obuna_tugash"):
            qoldi = (user["obuna_tugash"] - datetime.date.today()).days
            if qoldi < 0:
                msg = "⛔ Obuna muddati tugagan!\nAdmin bilan bog'laning."
            elif qoldi <= 3:
                await _yuborish(update, f"⚠️ Obuna {qoldi} kunda tugaydi!")
                return True
            else:
                return True
        else:
            return True
    if update.message:
        await update.message.reply_text(msg)
    elif update.callback_query:
        await update.callback_query.answer(msg, show_alert=True)
    return False


# ════════════════════════════════════════════════════════════════
#  KEYBOARD HELPERS
# ════════════════════════════════════════════════════════════════

def tg(*qatorlar: tuple) -> InlineKeyboardMarkup:
    """InlineKeyboard yaratish — [(text, callback_data), ...] formatida"""
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(t, callback_data=d) for t, d in q]
        for q in qatorlar
    ])


# ════════════════════════════════════════════════════════════════
#  CONFIG REFERENCE (main.py da set qilinadi)
# ════════════════════════════════════════════════════════════════

_cfg_ref = None


def set_cfg(cfg_obj):
    """main.py dan chaqiriladi — config reference saqlash"""
    global _cfg_ref
    _cfg_ref = cfg_obj


def cfg():
    """Config olish — handler modullari uchun"""
    assert _cfg_ref is not None, "Config hali o'rnatilmagan"
    return _cfg_ref
