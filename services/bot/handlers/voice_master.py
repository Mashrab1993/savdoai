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

    # ═══ UNIVERSAL TASDIQ / BEKOR — pending state bor bo'lsa ═══
    # "Ha tasdiq" / "Bekor qil" / "Yo'q kerak emas"
    has_pending = any(k in ctx.user_data for k in
                      ("kutilayotgan", "kutilayotgan_majbur", "draft_info",
                       "pending_images", "storecheck_session"))
    if has_pending:
        # BEKOR qilish — eng birinchi (xavfsiz)
        if _any(m, ("bekor qil", "bekor qilaman", "to'xtat", "yo'q kerak emas",
                     "kerak emas", "rad qil", "tashla", "unut")):
            # Barcha pending state tozalash (lekin storecheck_session tegilmaydi — /tashrif_yop orqali)
            cleared = []
            for k in ("kutilayotgan", "kutilayotgan_majbur", "draft_info",
                      "_tahr_rejim", "pending_images", "waiting_price"):
                if ctx.user_data.pop(k, None) is not None:
                    cleared.append(k)
            if cleared:
                await update.message.reply_text(
                    f"❌ Bekor qilindi. ({len(cleared)} ta pending tozalandi)"
                )
                return True

        # TASDIQ (faqat savdo/kutilayotgan uchun — storecheck o'zining oqimida)
        if _any(m, ("ha tasdiq", "tasdiq", "tasdiqla", "ha saqla",
                     "ha davom", "ha kerak", "ma'qul", "davom et",
                     "ha yozib qo'y", "majbur saqla", "zarar bilan")):
            kutilayotgan = ctx.user_data.get("kutilayotgan")
            kutilayotgan_majbur = ctx.user_data.get("kutilayotgan_majbur")
            # Majbur (qoldiq yetmasa ham) — birinchi ustuvorlik
            if kutilayotgan_majbur:
                try:
                    from services.bot.handlers.savdo import _qayta_ishlash_tasdiq
                    # callback emulator — majbur save qilish
                    import services.bot.db as _db
                    from services.bot.bot_helpers import _user_ol_kesh
                    uid = update.effective_user.id
                    user = await _user_ol_kesh(uid)
                    dokon = (user.get("dokon_nomi") or "") if user else ""
                    natija_m = ctx.user_data.pop("kutilayotgan_majbur", None)
                    sotuv_m = await _db.sotuv_saqlash(uid, natija_m)
                    from shared.utils.fmt import sotuv_cheki, chek_md
                    chek_m = sotuv_cheki(natija_m, dokon)
                    await update.message.reply_text(
                        "✅ Sotuv saqlandi (majbur rejim)\n\n" + chek_m,
                    )
                    return True
                except Exception as e:
                    log.error("voice tasdiq (majbur): %s", e, exc_info=True)
                    await update.message.reply_text("⚠️ Saqlashda xato.")
                    return True
            # Oddiy kutilayotgan — auto-save
            if kutilayotgan:
                try:
                    import services.bot.db as _db
                    from services.bot.bot_helpers import _user_ol_kesh
                    from shared.utils.fmt import sotuv_cheki
                    uid = update.effective_user.id
                    user = await _user_ol_kesh(uid)
                    dokon = (user.get("dokon_nomi") or "") if user else ""
                    natija = ctx.user_data.pop("kutilayotgan", None)
                    ctx.user_data.pop("draft_info", None)
                    if natija.get("amal") == "kirim":
                        await _db.kirim_saqlash(uid, natija)
                        await update.message.reply_text("✅ Kirim saqlandi")
                    else:
                        sotuv = await _db.sotuv_saqlash(uid, natija)
                        chek = sotuv_cheki(natija, dokon)
                        await update.message.reply_text(
                            f"✅ Sotuv saqlandi\n\n{chek}"
                        )
                    return True
                except Exception as e:
                    log.error("voice tasdiq: %s", e, exc_info=True)
                    await update.message.reply_text(
                        f"⚠️ Saqlashda xato. Tugmani bosing:\n/menyu"
                    )
                    return True

        # O'ZGARTIR — user "o'zgartir" desa, qaysi fieldni so'raymiz
        if _any(m, ("o'zgartir", "ozgartir", "tahrir", "tuzat")) and ctx.user_data.get("kutilayotgan"):
            await update.message.reply_text(
                "🔧 Nimani o'zgartiramiz?\n\n"
                "Ovozda ayting:\n"
                "  • *\"Klient Karim aka\"* — klient o'zgartir\n"
                "  • *\"Narx 48000\"* — narx o'zgartir\n"
                "  • *\"Miqdor 30\"* — miqdor o'zgartir\n"
                "  • *\"Bekor qil\"* — butunlay bekor",
                parse_mode="Markdown",
            )
            ctx.user_data["_voice_edit_mode"] = True
            return True

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

    # ═══ FEEDBACK / FIKR / SHIKOYAT ═══
    # "Fikr: ..." / "Shikoyat: ..." / "Taklif: ..."
    fikr_match = re.match(
        r'^(fikr|shikoyat|taklif|maqtov)[:\s]+(.+)',
        m, re.IGNORECASE,
    )
    if fikr_match:
        matn_arg = fikr_match.group(2).strip(".,! ")
        if matn_arg and len(matn_arg) > 2:
            update.message.text = f"/fikr {matn_arg}"
            try:
                from services.bot.handlers.feedback_handler import cmd_fikr
                await cmd_fikr(update, ctx)
                return True
            except Exception as e:
                log.warning("voice /fikr xato: %s", e)
    # "Fikrlar ro'yxat" / "Shikoyatlar" / "Javobsiz fikrlar"
    if _any(m, ("fikrlar ro'yxat", "hamma fikrlar", "fikrlar ko'rsat")):
        try:
            from services.bot.handlers.feedback_handler import cmd_fikrlar
            await cmd_fikrlar(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /fikrlar xato: %s", e)
    if _any(m, ("shikoyatlar", "shikoyat ro'yxat", "javobsiz shikoyat")):
        try:
            from services.bot.handlers.feedback_handler import cmd_shikoyatlar
            await cmd_shikoyatlar(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /shikoyatlar xato: %s", e)

    # ═══ EXPEDITOR KPI (shogirdlar reyting) ═══
    if _any(m, ("shogirdlar reyting", "kpi reyting", "kim yaxshi ishlayapti",
                 "shogird reyting", "shogirdlar kpi")):
        try:
            from services.bot.handlers.expeditor_kpi import cmd_kpi_reyting
            await cmd_kpi_reyting(update, ctx)
            return True
        except Exception as e:
            log.warning("voice /kpi_reyting xato: %s", e)
    # "Akbar KPI" — shogird ismi bo'yicha
    kpi_match = re.match(r'^([a-zA-Z\u0400-\u04ff\']+)\s+kpi', m, re.IGNORECASE)
    if kpi_match:
        shogird_nom = kpi_match.group(1).strip()
        try:
            from shared.database.pool import get_pool
            uid = update.effective_user.id
            async with get_pool().acquire() as c:
                shogird = await c.fetchrow("""
                    SELECT id FROM shogirdlar
                    WHERE admin_uid=$1 AND faol=TRUE
                      AND lower(ism) LIKE '%' || lower($2) || '%'
                    LIMIT 1
                """, uid, shogird_nom)
            if shogird:
                update.message.text = f"/shogird_kpi {shogird['id']}"
                from services.bot.handlers.expeditor_kpi import cmd_shogird_kpi
                await cmd_shogird_kpi(update, ctx)
                return True
        except Exception as e:
            log.warning("voice shogird kpi xato: %s", e)

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
