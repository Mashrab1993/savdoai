"""
Avtomatik joblar — kunlik hisobot, haftalik trend, qarz eslatma, obuna.
Bot scheduler (job_queue) orqali ishlatiladi.
"""
from __future__ import annotations
import logging

from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
from shared.utils.fmt import pul

log = logging.getLogger("savdoai.bot.jobs")


async def avto_kunlik_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni kechqurun — kunlik PRO hisobot"""
    log.info("⏰ Avtomatik kunlik hisobot PRO...")
    try:
        from shared.services.smart_bot_engine import kunlik_yakuniy_pro, kunlik_yakuniy_pro_matn
        users = await db.faol_users()
        yuborildi = 0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    d = await kunlik_yakuniy_pro(c, user["id"])
                if d["sotuv_soni"] == 0:
                    continue
                try:
                    from shared.services.suhbatdosh import kechki_xayrlashish, hisobot_tavsiya
                    _kech = kechki_xayrlashish()
                    _tavs = hisobot_tavsiya(d) if isinstance(d, dict) else ""
                    _msg = kunlik_yakuniy_pro_matn(d) + _tavs + "\n\n" + _kech
                except Exception:
                    _msg = kunlik_yakuniy_pro_matn(d)
                await ctx.bot.send_message(
                    user["id"], _msg,
                    parse_mode=ParseMode.MARKDOWN)
                yuborildi += 1
            except Exception as e:
                log.warning("Avtohisobot %s: %s", user["id"], e)
        log.info("✅ Kunlik hisobot PRO: %d foydalanuvchiga", yuborildi)
    except Exception as e:
        log.error("avto_kunlik_hisobot: %s", e, exc_info=True)


async def avto_haftalik_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har dushanba haftalik hisobot + trend"""
    log.info("⏰ Haftalik hisobot + trend...")
    try:
        from shared.services.smart_bot_engine import haftalik_trend, haftalik_trend_matn
        from shared.services.hisobot_engine import haftalik, hisobot_matn
        users = await db.faol_users()
        yuborildi = 0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    h_data = await haftalik(c, user["id"])
                    t_data = await haftalik_trend(c, user["id"])
                if h_data["sotuv_soni"] == 0:
                    continue
                matn = hisobot_matn(h_data) + "\n\n" + haftalik_trend_matn(t_data)
                await ctx.bot.send_message(user["id"], matn, parse_mode=ParseMode.MARKDOWN)
                yuborildi += 1
            except Exception as e:
                log.warning("Haftalik %s: %s", user["id"], e)
        log.info("✅ Haftalik hisobot: %d foydalanuvchiga", yuborildi)
    except Exception as e:
        log.error("avto_haftalik_hisobot: %s", e, exc_info=True)


async def avto_qarz_eslatma(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni qarz eslatmasi — muddati o'tgan + yaqinlashayotgan"""
    log.info("⏰ Qarz eslatmalari PRO...")
    try:
        from shared.services.smart_bot_engine import qarz_eslatma_royxat
        users = await db.faol_users()
        for user in users:
            try:
                async with db._P().acquire() as c:
                    klientlar = await qarz_eslatma_royxat(c, user["id"])
                if not klientlar:
                    continue
                muddati_otgan = [k for k in klientlar if k["muddati_otgan"]]
                yaqin = [k for k in klientlar if k["yaqinlashmoqda"]]
                jami = sum(k["jami_qarz"] for k in klientlar)
                matn = f"💰 *QARZ ESLATMASI*\n\nJami qarz: *{pul(jami)}*\n"
                matn += f"Klientlar: {len(klientlar)} ta\n"
                if muddati_otgan:
                    matn += f"\n🔴 *MUDDATI O'TGAN ({len(muddati_otgan)} ta):*\n"
                    for k in muddati_otgan[:5]:
                        matn += f"  • {k['ism']} — {pul(k['jami_qarz'])} (muddat: {k['muddat']})\n"
                if yaqin:
                    matn += f"\n🟡 *3 kun ichida ({len(yaqin)} ta):*\n"
                    for k in yaqin[:5]:
                        matn += f"  • {k['ism']} — {pul(k['jami_qarz'])} (muddat: {k['muddat']})\n"
                await ctx.bot.send_message(user["id"], matn, parse_mode=ParseMode.MARKDOWN)
            except Exception as e:
                log.warning("Qarz eslatma %s: %s", user["id"], e)
    except Exception as e:
        log.error("avto_qarz_eslatma: %s", e, exc_info=True)


async def obuna_eslatma(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Obuna muddati tugayotganlarga eslatma"""
    try:
        for kun in [3, 1]:
            users = await db.obuna_tugayotganlar(kun)
            for user in users:
                try:
                    await ctx.bot.send_message(
                        user["id"],
                        f"⚠️ *Obuna {kun} kunda tugaydi!*\n"
                        "Uzaytirib olish uchun admin bilan bog'laning.",
                        parse_mode=ParseMode.MARKDOWN)
                except Exception:
                    pass
    except Exception as e:
        log.error("obuna_eslatma: %s", e, exc_info=True)
