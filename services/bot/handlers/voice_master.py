"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — UNIVERSAL OVOZ INTENT ROUTER                     ║
║                                                                      ║
║  Foydalanuvchi slash komandalarni tushunmaydi — hammasi OVOZ bilan. ║
║  Bu modul har bir yangi fichaning ovoz varianti'ni yo'naltiradi:   ║
║                                                                      ║
║   "Bu oy 30 million plan"     → /plan                               ║
║   "Vazifa ber Akbar Ariel..."  → /vazifa_ber                        ║
║   "RFM ko'rsat"                → /rfm                               ║
║   "Champion klientlar"         → /rfm_champions                     ║
║   "Xavf ostidagi klientlar"    → /rfm_atrisk                        ║
║   "Ertalabki brifing"          → /ertalab                           ║
║   "Bugungi xulosa"             → /ertalab                           ║
║   "Oylik tahlil"               → /oyim                              ║
║   "Hayotim"                    → /hayotim                           ║
║   "Yangi maqsad: ..."          → /maqsad ...                        ║
║   "Yangi g'oya: ..."           → /goya ...                          ║
║   "Shaxsiy xarajat 50000 ovqat" → /xarajatim ...                    ║
║                                                                      ║
║  Tamoyil:                                                            ║
║   1. Eng aniq intent'larni avval tekshiradi                         ║
║   2. Kerakli parametr'larni ajratadi                                ║
║   3. Mos handler'ni to'g'ridan-to'g'ri chaqiradi                    ║
║   4. Biror narsa aniq emas — False qaytaradi (keyingi router olsin) ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import re

from telegram import Update
from telegram.ext import ContextTypes

log = logging.getLogger("mm")


async def route_voice_to_module(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                                  matn: str) -> bool:
    """Ovoz matnida yangi module intent aniqlansa — mos handler chaqirish.

    Return True agar handler topildi va ishladi (keyingi routerlar ishlamasin).
    """
    if not matn or not matn.strip():
        return False
    m = matn.lower().strip()

    # ═══ ERTALABKI BRIFING — Opus 4.7 ═══
    if _any(m, (
        "ertalabki brifing", "ertalab brifing", "ertalabki xulosa",
        "bugungi xulosa", "bugunki xulosa", "bugungi brifing",
        "kunlik xulosa", "kun xulosasi", "ertalabki tahlil",
    )):
        try:
            from services.bot.handlers.commands import cmd_ertalab
            await cmd_ertalab(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /ertalab xato: %s", e)

    # ═══ OYLIK TAHLIL — Opus 4.7 30 kunlik ═══
    if _any(m, (
        "oylik tahlil", "oy tahlil", "30 kun tahlil", "o'ttiz kun tahlil",
        "chuqur tahlil", "oyim tahlil",
    )):
        try:
            from services.bot.handlers.hayotim import cmd_oyim
            await cmd_oyim(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /oyim xato: %s", e)

    # ═══ HAYOTIM DASHBOARD ═══
    if _any(m, ("hayotim", "shaxsiy hayot", "hayotim dashboard")) and not _any(m, (
        "maqsad", "goya", "g'oya", "xarajat",
    )):
        try:
            from services.bot.handlers.hayotim import cmd_hayotim
            await cmd_hayotim(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /hayotim xato: %s", e)

    # ═══ MAQSAD ═══
    # "Yangi maqsad: oyda 30 million sotuv" yoki "Maqsad qo'sh ..."
    maqsad_match = re.match(
        r'^(?:yangi\s+)?maqsad(?:\s*qo[\'\u2018\u2019]sh|:)?\s*(.+)',
        m, re.IGNORECASE,
    )
    if maqsad_match:
        matn_arg = maqsad_match.group(1).strip(".,! ")
        if matn_arg and len(matn_arg) > 3:
            # update.message.text ni o'zgartirib chaqirish — /maqsad X format'ga
            update.message.text = f"/maqsad {matn_arg}"
            try:
                from services.bot.handlers.hayotim import cmd_maqsad
                await cmd_maqsad(update, ctx)
                return True
            except Exception as e:
                log.warning("voice /maqsad xato: %s", e)

    # ═══ G'OYA ═══
    goya_match = re.match(
        r'^(?:yangi\s+)?g[\'\u2018\u2019]?oya(?:\s*qo[\'\u2018\u2019]sh|:)?\s*(.+)',
        m, re.IGNORECASE,
    )
    if goya_match:
        matn_arg = goya_match.group(1).strip(".,! ")
        if matn_arg and len(matn_arg) > 3:
            update.message.text = f"/goya {matn_arg}"
            try:
                from services.bot.handlers.hayotim import cmd_goya
                await cmd_goya(update, ctx)
                return True
            except Exception as e:
                log.warning("voice /goya xato: %s", e)

    # ═══ SHAXSIY XARAJAT (Hayotim) ═══
    # "Shaxsiy xarajat 50000 ovqat" — biznes xarajat'dan farqi
    if _any(m, ("shaxsiy xarajat", "mening xarajat", "o'zimning xarajat",
                 "hayotim xarajat")):
        # Raqam va kategoriya ajratish
        raqam_match = re.search(r'(\d[\d\s]*)', m.replace(",", ""))
        if raqam_match:
            summa_str = raqam_match.group(1).replace(" ", "")
            kategoriya = ""
            for kw in ("ovqat", "transport", "dokon", "kiyim", "xizmat",
                       "soglik", "oila", "boshqa"):
                if kw in m:
                    kategoriya = kw
                    break
            update.message.text = f"/xarajatim {summa_str} {kategoriya}".strip()
            try:
                from services.bot.handlers.hayotim import cmd_xarajatim
                await cmd_xarajatim(update, ctx)
                return True
            except Exception as e:
                log.warning("voice /xarajatim xato: %s", e)

    # ═══ RFM SEGMENTATSIYA ═══
    if _any(m, ("champion klient", "champions", "eng yaxshi klient", "top klient",
                 "vip klient")):
        try:
            from services.bot.handlers.rfm import cmd_rfm_champions
            await cmd_rfm_champions(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /rfm_champions xato: %s", e)
    if _any(m, ("xavf ostida", "xavfli klient", "yo'qolayot", "yo'qolib ket",
                 "at risk")):
        try:
            from services.bot.handlers.rfm import cmd_rfm_atrisk
            await cmd_rfm_atrisk(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /rfm_atrisk xato: %s", e)
    if _any(m, ("yo'qolgan klient", "lost klient", "faol bo'lmagan klient")):
        try:
            from services.bot.handlers.rfm import cmd_rfm_lost
            await cmd_rfm_lost(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /rfm_lost xato: %s", e)
    if _any(m, ("sodiq klient", "loyal klient")):
        try:
            from services.bot.handlers.rfm import cmd_rfm_loyal
            await cmd_rfm_loyal(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /rfm_loyal xato: %s", e)
    if _any(m, ("rfm", "klient segment", "klientlar tahlili",
                 "klient klassifikatsiya", "klient tahlili")):
        try:
            from services.bot.handlers.rfm import cmd_rfm
            await cmd_rfm(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /rfm xato: %s", e)

    # ═══ OYLIK PLAN ═══
    # "Bu oy 30 million plan" / "30 mln plan" / "Plan 25 mln"
    if _any(m, ("plan qo'y", "plan qo'yamiz", "oylik plan")) or (
        "plan" in m and _has_money(m)
    ):
        summa_str = _extract_money_str(m)
        if summa_str:
            update.message.text = f"/plan {summa_str}"
            try:
                from services.bot.handlers.planning import cmd_plan
                await cmd_plan(update, ctx)
                return True
            except Exception as e:
                log.warning("voice /plan (set) xato: %s", e)
    # "Plan progress" / "Plan natija" / "Bu oy qancha bajarildi"
    if _any(m, ("plan progress", "plan natija", "plan holati",
                 "bu oy qancha", "oy progress", "plan ko'rsat")):
        try:
            from services.bot.handlers.planning import cmd_plan
            update.message.text = "/plan"
            await cmd_plan(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /plan (show) xato: %s", e)

    # ═══ VAZIFALAR (admin) ═══
    # "Vazifa ber Akbarga Karimga Ariel yetkazib ber"
    vazifa_match = re.match(
        r'^(?:yangi\s+)?vazifa(?:\s*ber|:)?\s+([a-zA-Z\u0400-\u04ff\']+)\s*[,:]?\s*(.+)',
        m, re.IGNORECASE,
    )
    if vazifa_match:
        shogird_nom = vazifa_match.group(1).strip()
        vazifa_matn = vazifa_match.group(2).strip(".,! ")
        # Shogird nom'idan ID topish kerak
        try:
            from services.bot.bot_helpers import cfg
            from shared.database.pool import get_pool
            uid = update.effective_user.id
            async with get_pool().acquire() as c:
                shogird = await c.fetchrow("""
                    SELECT id, ism FROM shogirdlar
                    WHERE admin_uid=$1 AND faol=TRUE
                      AND lower(ism) LIKE '%' || lower($2) || '%'
                    LIMIT 1
                """, uid, shogird_nom)
            if shogird and vazifa_matn:
                update.message.text = f"/vazifa_ber {shogird['id']} {vazifa_matn}"
                from services.bot.handlers.vazifalar import cmd_vazifa_ber
                await cmd_vazifa_ber(update, ctx)
                return True
        except Exception as e:
            log.warning("voice /vazifa_ber xato: %s", e)

    if _any(m, ("mening vazifa", "vazifalarim")):
        try:
            from services.bot.handlers.vazifalar import cmd_vazifalarim
            await cmd_vazifalarim(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /vazifalarim xato: %s", e)
    if _any(m, ("vazifa statistika", "vazifa stat", "kim qancha bajardi")):
        try:
            from services.bot.handlers.vazifalar import cmd_vazifa_stat
            await cmd_vazifa_stat(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /vazifa_stat xato: %s", e)
    if _any(m, ("faol vazifa", "barcha vazifa", "vazifalar ro'yxat",
                 "hamma vazifa")):
        try:
            from services.bot.handlers.vazifalar import cmd_vazifalar
            await cmd_vazifalar(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /vazifalar xato: %s", e)

    # ═══ BAJARDIM (shogird vazifa) ═══
    # "Vazifa 5 bajardim" / "5 vazifani bajardim"
    bajardi_match = re.search(
        r'vazifa\s*(?:#|№)?\s*(\d+)\s*(?:ni|)?\s*bajar[id]',
        m,
    ) or re.search(r'(\d+)\s*(?:-?chi)?\s*vazifa.*bajar[id]', m)
    if bajardi_match:
        vid = bajardi_match.group(1)
        update.message.text = f"/bajardim {vid}"
        try:
            from services.bot.handlers.vazifalar import cmd_bajardim
            await cmd_bajardim(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /bajardim xato: %s", e)

    return False


# ════════════════════════════════════════════════════════════════════
#  YORDAMCHI FUNKSIYALAR
# ════════════════════════════════════════════════════════════════════

def _any(matn: str, keywords: tuple[str, ...]) -> bool:
    """Matn ichida biror keyword bormi?"""
    return any(kw in matn for kw in keywords)


def _has_money(matn: str) -> bool:
    """Matnda pul summa bormi? ('mln', 'million', 'ming', katta raqam)"""
    if re.search(r'\d+\s*(?:mln|million|ming)', matn):
        return True
    # Raw raqam >= 10000
    for m in re.finditer(r'(\d{5,})', matn.replace(" ", "")):
        try:
            if int(m.group(1)) >= 10000:
                return True
        except ValueError:
            pass
    return False


def _extract_money_str(matn: str) -> str:
    """Matndan pul summa qismini ajratib olish. '30 mln', '500 ming', '1500000'."""
    # mln / million
    mln = re.search(r'(\d+(?:\.\d+)?)\s*(mln|million)', matn)
    if mln:
        return f"{mln.group(1)} mln"
    # ming
    ming = re.search(r'(\d+(?:\.\d+)?)\s*ming', matn)
    if ming:
        return f"{ming.group(1)} ming"
    # raw raqam
    raw = re.search(r'(\d{5,})', matn.replace(" ", ""))
    if raw:
        return raw.group(1)
    return ""
