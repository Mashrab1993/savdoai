"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — STORECHECK OVOZLI HANDLER                    ║
║                                                                   ║
║  Ovoz orqali tashrif boshqaruv:                                  ║
║   "Akmal do'koniga tashrif boshlaymiz"  → /tashrif_boshla        ║
║   "Ariel bor" / "Ariel mavjud"           → SKU mavjud=TRUE       ║
║   "Persil yo'q" / "Persil yo'qola"       → SKU mavjud=FALSE      ║
║   "Ariel 56000"                           → SKU narx yangilanadi ║
║   "Facing 5 Ariel"                       → SKU facing=5           ║
║   "Tashrif yakunla" / "Yop"              → /tashrif_yop          ║
║                                                                   ║
║  Intent detekteri main.py voice_intent'dan chaqiriladi.          ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re
from decimal import Decimal, InvalidOperation

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


# Keyword'lar (ovoz intent detektori)
_BOSHLASH_KW = ("tashrif boshla", "tashrif boshlaymiz", "boshlaymiz tashrif",
                "storecheck boshla", "do'konga tashrif", "dukonga tashrif",
                "tekshiruv boshla", "audit boshla")
_YOPISH_KW = ("tashrif yop", "tashrif yopildi", "tashrif yakunla", "tashrif tugadi",
              "storecheck yop", "tugatdim tashrif", "yop tashrif")
_HISOBOT_KW = ("tashrif hisobot", "tashriflar hisobot", "storecheck hisobot")
_ROYXAT_KW = ("tashriflar", "tashrif ro'yxat", "tashriflar royxat")


def detect_tashrif_intent(matn: str) -> str | None:
    """Matn ichida storecheck intent aniqlaydi. Qaytaradi:
    'boshla' / 'yop' / 'hisobot' / 'royxat' / 'sku_mark' / None
    """
    if not matn:
        return None
    m = matn.lower()
    if any(kw in m for kw in _BOSHLASH_KW):
        return "boshla"
    if any(kw in m for kw in _YOPISH_KW):
        return "yop"
    if any(kw in m for kw in _HISOBOT_KW):
        return "hisobot"
    # "tashriflar" faqat hisobot keyword yo'q bo'lsa → ro'yxat
    if any(kw in m for kw in _ROYXAT_KW) and not any(kw in m for kw in _HISOBOT_KW):
        return "royxat"
    return None


def detect_sku_mark(matn: str) -> dict | None:
    """Ovoz matnida SKU belgi aniqlash.

    Return:
        {"tovar_qidiruv": "ariel", "mavjud": True/False/None, "narx": Decimal or None, "facing": int or None}
        yoki None
    """
    if not matn:
        return None
    m = matn.lower().strip()
    # So'zlarni ajratish
    words = m.split()
    if len(words) < 2:
        return None

    mavjud: bool | None = None
    if any(kw in m for kw in (" bor", " mavjud", " turibdi", " turgan", "ochiq")):
        mavjud = True
    elif any(kw in m for kw in (" yo'q", " yoq", " yo`q", " yo'qola", " tugagan", " qolmagan", "yoqol")):
        mavjud = False

    # Narx aniqlash — so'nggi raqam va "ming" bor bo'lsa
    narx: Decimal | None = None
    narx_match = re.search(r'(\d[\d\s]*)\s*(?:ming|so\'m)?', m.replace(",", ""))
    if narx_match:
        try:
            raw = narx_match.group(1).replace(" ", "")
            val = int(raw)
            # Agar "ming" bor bo'lsa — 000 ga ko'paytirish
            if "ming" in m and val < 10000:
                val *= 1000
            if 1000 <= val <= 999_999_999:
                narx = Decimal(val)
        except (ValueError, InvalidOperation):
            pass

    # Facing (javon yuzi)
    facing: int | None = None
    facing_match = re.search(r'facing\s+(\d+)', m) or re.search(r'(\d+)\s*ta\s*facing', m)
    if facing_match:
        try:
            facing = int(facing_match.group(1))
        except ValueError:
            pass

    # Tovar qidiruv — raqamdan oldingi so'zlar
    tovar_qidiruv = None
    if mavjud is not None:
        # "Ariel bor" → "Ariel"
        stop_words = {"bor", "yoq", "yo'q", "yo`q", "mavjud", "turibdi", "turgan",
                      "ochiq", "tugagan", "qolmagan", "yo'qola", "yoqol"}
        parts = []
        for w in words:
            if w in stop_words:
                break
            if w.isdigit():
                break
            parts.append(w)
        if parts:
            tovar_qidiruv = " ".join(parts)
    elif narx is not None:
        # "Ariel 56000" → "Ariel"
        parts = []
        for w in words:
            if w.isdigit() or w in ("ming", "so'm", "som"):
                break
            parts.append(w)
        if parts:
            tovar_qidiruv = " ".join(parts)
            # Agar faqat narxni yangilamoqchi — mavjud=None (o'zgartirmaymiz)

    if not tovar_qidiruv:
        return None

    return {
        "tovar_qidiruv": tovar_qidiruv.strip(),
        "mavjud": mavjud,
        "narx": narx,
        "facing": facing,
    }


# ════════════════════════════════════════════════════════════════════
#  OVOZDAN TASHRIF BOSHLASH — klient nomi fuzzy match
# ════════════════════════════════════════════════════════════════════

async def voice_tashrif_boshla(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                                 matn: str) -> bool:
    """Ovoz matnidan klient ismini topib, tashrif boshlash.

    Return True agar qabul qilindi (boshqa handler ishlamasin).
    """
    if not await faol_tekshir(update): return False
    uid = update.effective_user.id
    m_lower = matn.lower()

    # Klient nomi ajratish — "boshla/tashrif" kalit so'zlardan keyin yoki oldin
    import re as _re
    # "Akmal akaga tashrif boshlaymiz" → "Akmal aka"
    name_match = _re.search(
        r'([a-zA-Z\u0400-\u04ffo\'ʻ\s]+?)\s*(?:do\'kon|dokon|firma|market|aka|opa|akaga|opaga|ga\b)',
        m_lower,
    )
    klient_qidiruv = name_match.group(1).strip() if name_match else ""
    # Stop phrase'larni olib tashlash
    for stop in ("tashrif", "boshla", "boshlaymiz", "storecheck", "tekshiruv", "audit"):
        klient_qidiruv = klient_qidiruv.replace(stop, "").strip()
    klient_qidiruv = klient_qidiruv.strip(",. ")

    if not klient_qidiruv or len(klient_qidiruv) < 3:
        await update.message.reply_text(
            "⚠️ Klient nomini ayta olmadim.\n"
            "Misol: _\"Akmal do'koniga tashrif boshlaymiz\"_\n"
            "yoki yozing: `/tashrif_boshla [klient_id]`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return True  # handler qabul qildi

    try:
        from shared.services.storecheck import (
            session_ochiq, session_boshla, template_ol, session_sku_bulk_qoshish,
        )
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            ochiq = await session_ochiq(c, uid)
            if ochiq:
                klient_nom = ochiq.get("klient_ismi") or "?"
                await update.message.reply_text(
                    f"⚠️ Oldingi tashrif ochiq (#{ochiq['id']}, {klient_nom}).\n"
                    "Yop: \"tashrif yop\""
                )
                return True
            # Klient fuzzy match
            klientlar = await c.fetch("""
                SELECT id, ism FROM klientlar
                WHERE user_id=$1 AND lower(ism) LIKE '%' || lower($2) || '%'
                ORDER BY jami_sotib DESC LIMIT 5
            """, uid, klient_qidiruv)
            if not klientlar:
                await update.message.reply_text(
                    f"⚠️ _{klient_qidiruv}_ nomli klient topilmadi.\n"
                    "Ro'yxatdan: /klientlar",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return True
            if len(klientlar) > 1:
                lines = [f"🔍 *{klient_qidiruv}* bo'yicha {len(klientlar)} ta topildi:", ""]
                for k in klientlar:
                    lines.append(f"  • #{k['id']} {k['ism']}")
                lines.append("\nAniq ID bilan yozing: `/tashrif_boshla [id]`")
                await update.message.reply_text(
                    "\n".join(lines), parse_mode=ParseMode.MARKDOWN,
                )
                return True
            klient = klientlar[0]
            sid = await session_boshla(c, uid, klient_id=klient["id"])
            tmpl = await template_ol(c, uid)
            sku_soni = 0
            if tmpl and tmpl.get("tovar_idlari"):
                sku_soni = await session_sku_bulk_qoshish(
                    c, uid, sid, list(tmpl["tovar_idlari"])
                )
        ctx.user_data["storecheck_session"] = sid
        await update.message.reply_text(
            f"✅ *Tashrif boshlandi*\n\n"
            f"🏪 Klient: *{klient['ism']}*\n"
            f"🆔 Sessiya: #{sid} | SKU: {sku_soni} ta\n\n"
            f"Endi ovozda ayting:\n"
            f"  • _\"Ariel bor\"_ — bor deb belgilash\n"
            f"  • _\"Persil yo'q\"_ — yo'q deb belgilash\n"
            f"  • _\"Ariel 56000\"_ — narx yozish\n"
            f"  • _\"Tashrif yop\"_ — yakunlash",
            parse_mode=ParseMode.MARKDOWN,
        )
        return True
    except Exception as e:
        log.error("voice_tashrif_boshla xato: %s", e, exc_info=True)
        return False


# ════════════════════════════════════════════════════════════════════
#  OVOZDAN SKU BELGILASH — session ichida
# ════════════════════════════════════════════════════════════════════

async def voice_sku_mark(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                          matn: str) -> bool:
    """Ochiq sessiyada SKU belgilash (bor/yo'q/narx/facing)."""
    sid = ctx.user_data.get("storecheck_session")
    if not sid:
        return False
    uid = update.effective_user.id
    parsed = detect_sku_mark(matn)
    if not parsed:
        return False

    try:
        from shared.database.pool import rls_conn
        from shared.services.storecheck import sku_yangila
        async with rls_conn(uid) as c:
            # Session SKU ichida tovar_nomi bo'yicha fuzzy qidirish
            rows = await c.fetch("""
                SELECT id, tovar_nomi FROM storecheck_sku
                WHERE user_id=$1 AND session_id=$2
                  AND lower(tovar_nomi) LIKE '%' || lower($3) || '%'
                ORDER BY id LIMIT 3
            """, uid, sid, parsed["tovar_qidiruv"])
            if not rows:
                await update.message.reply_text(
                    f"⚠️ SKU _{parsed['tovar_qidiruv']}_ ro'yxatda topilmadi.",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return True
            if len(rows) > 1:
                lines = [f"🔍 *{parsed['tovar_qidiruv']}* bo'yicha:"]
                for r in rows:
                    lines.append(f"  #{r['id']} {r['tovar_nomi']}")
                lines.append("\nAniqroq ayting yoki tugmani bosing.")
                await update.message.reply_text(
                    "\n".join(lines), parse_mode=ParseMode.MARKDOWN,
                )
                return True
            sku_id = rows[0]["id"]
            sku_nom = rows[0]["tovar_nomi"]
            await sku_yangila(
                c, uid, sku_id,
                mavjud=parsed["mavjud"],
                narx=parsed["narx"],
                facing=parsed["facing"],
            )

        # Javob
        belgi = []
        if parsed["mavjud"] is True:
            belgi.append("✅ bor")
        elif parsed["mavjud"] is False:
            belgi.append("❌ yo'q")
        if parsed["narx"]:
            belgi.append(f"💰 {parsed['narx']:,.0f}")
        if parsed["facing"] is not None:
            belgi.append(f"📏 facing {parsed['facing']}")
        await update.message.reply_text(
            f"📋 {sku_nom} — {' • '.join(belgi) if belgi else 'yangilandi'}"
        )
        return True
    except Exception as e:
        log.error("voice_sku_mark xato: %s", e, exc_info=True)
        return False


# ════════════════════════════════════════════════════════════════════
#  OVOZLI TASHRIF INTENT DISPATCHER — main.py'dan chaqiriladi
# ════════════════════════════════════════════════════════════════════

async def handle_voice_tashrif(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                                 matn: str) -> bool:
    """Ovoz matnida tashrif intent bo'lsa — tegishli handler'ga yuborish.

    Return True agar intent topildi va qabul qilindi (boshqa router'ga
    yubormaslik kerak).
    """
    intent = detect_tashrif_intent(matn)

    # Ochiq sessiya bo'lsa — SKU belgilash urinishi (intent bo'lmasa ham)
    if not intent and ctx.user_data.get("storecheck_session"):
        if await voice_sku_mark(update, ctx, matn):
            return True

    if intent == "boshla":
        return await voice_tashrif_boshla(update, ctx, matn)
    if intent == "yop":
        # Reusing cmd_tashrif_yop
        from services.bot.handlers.storecheck import cmd_tashrif_yop
        await cmd_tashrif_yop(update, ctx)
        return True
    if intent == "hisobot":
        from services.bot.handlers.storecheck import cmd_tashrif_hisobot
        await cmd_tashrif_hisobot(update, ctx)
        return True
    if intent == "royxat":
        from services.bot.handlers.storecheck import cmd_tashriflar
        await cmd_tashriflar(update, ctx)
        return True
    return False
