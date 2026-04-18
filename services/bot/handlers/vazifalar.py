"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — VAZIFALAR BOT HANDLERS                       ║
║                                                                   ║
║  Admin:                                                           ║
║   /vazifa_ber [shogird_id] [matn]  — yangi vazifa                ║
║   /vazifalar                        — hamma vazifalar            ║
║   /vazifa_stat                      — statistika                  ║
║                                                                   ║
║  Shogird (kelajakda auth bilan):                                 ║
║   /vazifalarim                      — mening vazifalarim         ║
║   /bajardim [vazifa_id] [izoh]      — bajarildi belgilash        ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
from datetime import date

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


async def cmd_vazifa_ber(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/vazifa_ber [shogird_id] [matn] — shogirdga vazifa berish (admin)."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 3 or not parts[1].isdigit():
        await update.message.reply_text(
            "📝 *Vazifa berish*\n\n"
            "Format: `/vazifa_ber [shogird_id] [matn]`\n"
            "Misol: `/vazifa_ber 5 Akmal do'koniga borib Ariel yetkazib ber`\n\n"
            "Shogirdlar ro'yxati: /shogirdlar",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    shogird_id = int(parts[1])
    matn = parts[2].strip()
    try:
        from shared.services.vazifalar import vazifa_ber
        from shared.database.pool import get_pool
        # Non-RLS bu yerda — admin_uid filtri (shogirdlar jadvalida user_id yo'q)
        async with get_pool().acquire() as c:
            shogird = await c.fetchrow(
                "SELECT id, ism, telegram_uid FROM shogirdlar "
                "WHERE id=$1 AND admin_uid=$2 AND faol=TRUE",
                shogird_id, uid,
            )
            if not shogird:
                await update.message.reply_text(
                    f"⚠️ Shogird #{shogird_id} topilmadi yoki faol emas."
                )
                return
            vid = await vazifa_ber(c, uid, shogird_id, matn)
        # Shogirdga bildirish (telegram_uid bor bo'lsa)
        try:
            if shogird.get("telegram_uid"):
                await ctx.bot.send_message(
                    shogird["telegram_uid"],
                    f"📝 *Yangi vazifa berildi*\n\n"
                    f"🆔 #{vid}\n"
                    f"{matn}\n\n"
                    f"Bajargach: `/bajardim {vid}`",
                    parse_mode=ParseMode.MARKDOWN,
                )
        except Exception as _e:
            log.debug("Shogirdga bildirish xato: %s", _e)
        await update.message.reply_text(
            f"✅ Vazifa #{vid} *{shogird['ism']}*'ga berildi:\n\n"
            f"📝 _{matn[:200]}_",
            parse_mode=ParseMode.MARKDOWN,
        )
    except Exception as e:
        log.error("cmd_vazifa_ber xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Vazifa berishda xato.")


async def cmd_vazifalar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/vazifalar — admin uchun barcha faol vazifalar."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.vazifalar import vazifalar_royxat
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            rows = await vazifalar_royxat(c, uid, faqat_faol=True, limit=30)
        if not rows:
            await update.message.reply_text(
                "✅ Barcha vazifalar bajarilgan!\n\nYangi vazifa: `/vazifa_ber [shogird_id] [matn]`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return
        bugun = date.today()
        lines = [f"📋 *Faol vazifalar ({len(rows)}):*", ""]
        for r in rows:
            emoji = "🔴" if r["ustuvorlik"] == 1 else ("🟡" if r["ustuvorlik"] == 2 else "🟢")
            deadline_str = ""
            if r.get("deadline"):
                dlt = r["deadline"]
                if dlt < bugun:
                    deadline_str = f" ⏰ *Muddati o'tdi* ({dlt})"
                else:
                    kun = (dlt - bugun).days
                    deadline_str = f" ⏰ {kun} kun qoldi"
            shogird = r.get("shogird_ismi") or "?"
            klient = f" [{r['klient_ismi']}]" if r.get("klient_ismi") else ""
            lines.append(
                f"{emoji} *#{r['id']}* [{shogird}]{klient}\n"
                f"  {r['matn'][:80]}{deadline_str}"
            )
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_vazifalar xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Vazifalar olishda xato.")


async def cmd_vazifa_stat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/vazifa_stat — 30 kunlik vazifa bajarish statistikasi."""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.vazifalar import vazifa_statistika
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            s = await vazifa_statistika(c, uid, kun=30)
    except Exception as e:
        log.error("cmd_vazifa_stat xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Statistika olinmadi.")
        return

    lines = [
        "📊 *Vazifa statistika — oxirgi 30 kun*",
        "",
        f"📋 Jami: *{s['jami']}*",
        f"  ✅ Bajarildi: {s['bajarildi']} ({s['bajarish_foiz']}%)",
        f"  ⏳ Kutilmoqda: {s['bajarilmagan']}",
        f"  🔴 Muddati o'tgan: {s['muddati_otgan']}",
        "",
    ]
    if s["shogird_stat"]:
        lines.append("👷 *Shogirdlar:*")
        for sh in s["shogird_stat"]:
            lines.append(
                f"  • {sh['shogird_ismi']}: {int(sh['bajarildi'])}/{int(sh['jami'])} "
                f"({float(sh['bajarish_foiz'] or 0):.0f}%)"
            )
    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)


async def cmd_bajardim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/bajardim [vazifa_id] [izoh] — shogird vazifani bajardim deb belgilash.

    Hozirda shogird faqat admin orqali vazifa beriladi va shogird Telegram orqali
    bajardim yozadi. RLS emas — admin_uid parent'ga taalluqli.
    """
    if not update.message or not update.effective_user:
        return
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "Format: `/bajardim [vazifa_id] [ixtiyoriy izoh]`\n"
            "Misol: `/bajardim 5 Yetkazib berdim`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    vazifa_id = int(parts[1])
    izoh = parts[2].strip() if len(parts) > 2 else ""
    tg_uid = update.effective_user.id
    try:
        from shared.services.vazifalar import vazifa_bajardi
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            # Shogird o'z vazifalarini bajara oladi — shogirdlar.admin_uid orqali
            row = await c.fetchrow("""
                SELECT v.id, v.admin_uid, v.matn, s.ism AS shogird_ismi
                FROM vazifalar v
                LEFT JOIN shogirdlar s ON s.id = v.shogird_id
                WHERE v.id=$1 AND (
                    v.admin_uid=$2  -- admin o'zi
                    OR (s.telegram_uid=$2 AND s.faol=TRUE)  -- shogird
                )
            """, vazifa_id, tg_uid)
            if not row:
                await update.message.reply_text(
                    f"⚠️ Vazifa #{vazifa_id} topilmadi yoki sizga tegishli emas."
                )
                return
            admin_uid = row["admin_uid"]
            ok = await vazifa_bajardi(c, admin_uid, vazifa_id, bajaruvchi_izoh=izoh)
        if ok:
            await update.message.reply_text(
                f"🎉 *Vazifa #{vazifa_id} bajarildi!*\n\n_{row['matn'][:100]}_",
                parse_mode=ParseMode.MARKDOWN,
            )
            # Admin'ga bildirish
            try:
                if admin_uid != tg_uid:
                    sh_nom = row.get("shogird_ismi") or "Shogird"
                    izoh_str = f"\n📝 Izoh: _{izoh[:100]}_" if izoh else ""
                    await ctx.bot.send_message(
                        admin_uid,
                        f"✅ *{sh_nom}* vazifa #{vazifa_id}'ni bajardi:\n"
                        f"_{row['matn'][:100]}_{izoh_str}",
                        parse_mode=ParseMode.MARKDOWN,
                    )
            except Exception as _e:
                log.debug("Admin bildirish: %s", _e)
        else:
            await update.message.reply_text(f"⚠️ Vazifa #{vazifa_id} allaqachon bajarilgan.")
    except Exception as e:
        log.error("cmd_bajardim xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Xato yuz berdi.")


async def cmd_vazifalarim(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/vazifalarim — shogird o'z vazifalarini ko'radi."""
    if not update.message or not update.effective_user:
        return
    tg_uid = update.effective_user.id
    try:
        from shared.database.pool import get_pool
        async with get_pool().acquire() as c:
            shogird = await c.fetchrow(
                "SELECT id, admin_uid, ism FROM shogirdlar "
                "WHERE telegram_uid=$1 AND faol=TRUE LIMIT 1",
                tg_uid,
            )
            if not shogird:
                # Admin bo'lishi mumkin — unda /vazifalar ishlatsin
                await update.message.reply_text(
                    "Siz shogird emas ekansiz.\n"
                    "Admin: /vazifalar — barcha vazifalar"
                )
                return
            from shared.services.vazifalar import vazifalar_royxat
            rows = await vazifalar_royxat(
                c, shogird["admin_uid"], shogird_id=shogird["id"],
                faqat_faol=True, limit=20,
            )
        if not rows:
            await update.message.reply_text(
                f"🎉 *{shogird['ism']}*, sizga faol vazifa yo'q!",
                parse_mode=ParseMode.MARKDOWN,
            )
            return
        bugun = date.today()
        lines = [f"📋 *{shogird['ism']} — faol vazifalar ({len(rows)}):*", ""]
        for r in rows:
            emoji = "🔴" if r["ustuvorlik"] == 1 else ("🟡" if r["ustuvorlik"] == 2 else "🟢")
            deadline_str = ""
            if r.get("deadline"):
                dlt = r["deadline"]
                if dlt < bugun:
                    deadline_str = f" ⏰ MUDDATI O'TDI ({dlt})"
                else:
                    kun = (dlt - bugun).days
                    deadline_str = f" ⏰ {kun} kun qoldi"
            klient = f" [{r['klient_ismi']}]" if r.get("klient_ismi") else ""
            lines.append(
                f"{emoji} *#{r['id']}*{klient}\n"
                f"  {r['matn']}{deadline_str}\n"
                f"  Bajardim: `/bajardim {r['id']}`"
            )
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_vazifalarim xato: %s", e, exc_info=True)
        await update.message.reply_text("⚠️ Vazifalar olishda xato.")
