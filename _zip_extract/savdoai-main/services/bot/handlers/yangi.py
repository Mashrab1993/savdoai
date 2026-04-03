"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — YANGI BOT HANDLERLARI v25.3.2                    ║
║  Qarz eslatma, KPI, Loyalty                                 ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
from services.bot.bot_helpers import (
    _user_ol_kesh, faol_tekshir, _safe_reply, xat, tg, cfg,
)

log = logging.getLogger("mm")


# ════════════════════════════════════════════════════════════
#  QARZ ESLATMA
# ════════════════════════════════════════════════════════════

async def cmd_eslatma(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klientlarga qarz eslatma yuborish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    from shared.services.qarz_eslatma import qarz_eslatma_royxati
    async with db._P().acquire() as c:
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as rc:
            royxat = await qarz_eslatma_royxati(rc, uid)

    if not royxat:
        await update.message.reply_text("✅ Barcha klientlar to'lagan — eslatma kerak emas!")
        return

    # Xulosa
    jami = sum(r["jami_qarz"] for r in royxat)
    urgent = sum(1 for r in royxat if r["muddati_otgan"])

    matn = (
        f"📋 *QARZ ESLATMA*\n\n"
        f"👥 {len(royxat)} ta klient — {jami:,.0f} so'm\n"
    )
    if urgent:
        matn += f"🚨 {urgent} ta muddati o'tgan!\n"
    matn += "\n"

    # Top 10 klient
    for i, r in enumerate(royxat[:10], 1):
        emoji = "🚨" if r["muddati_otgan"] else "⚠️"
        matn += (
            f"{emoji} *{r['klient_ismi']}*\n"
            f"   {r['jami_qarz']:,.0f} so'm"
        )
        if r["muddat"]:
            matn += f" | muddat: {r['muddat']}"
        if r["kun_otgan"] > 0:
            matn += f" ({r['kun_otgan']} kun o'tgan!)"
        matn += "\n"

    # Tugmalar
    buttons = []
    for r in royxat[:5]:
        klient = r["klient_ismi"][:20]
        buttons.append([InlineKeyboardButton(
            f"📨 {klient} ga eslatish",
            callback_data=f"eslatma:{r['klient_id'] or 0}:{uid}"
        )])
    buttons.append([InlineKeyboardButton(
        "📨 BARCHASIGA eslatish", callback_data=f"eslatma:all:{uid}"
    )])

    await update.message.reply_text(
        matn, parse_mode=ParseMode.MARKDOWN,
        reply_markup=InlineKeyboardMarkup(buttons)
    )


async def eslatma_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Eslatma callback — klientga xabar yuborish."""
    q = update.callback_query
    await q.answer()
    data = q.data.split(":")
    if len(data) < 3:
        return

    _, klient_id_str, uid_str = data[0], data[1], data[2]
    uid = int(uid_str)

    user = await _user_ol_kesh(uid)
    dokon = user.get("dokon_nomi", "Do'kon") if user else "Do'kon"
    telefon = user.get("telefon", "") if user else ""

    from shared.services.qarz_eslatma import (
        qarz_eslatma_royxati, eslatma_matni,
        eslatma_qayd_qilish, eslatma_yuborish_mumkinmi,
    )
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        royxat = await qarz_eslatma_royxati(c, uid)

        if klient_id_str == "all":
            # Barchasiga eslatma
            yuborildi = 0
            for r in royxat:
                if r["klient_id"] and await eslatma_yuborish_mumkinmi(c, uid, r["klient_id"]):
                    matn = eslatma_matni(
                        r["klient_ismi"], dokon, telefon,
                        r["jami_qarz"], r["qarz_soni"],
                        r["muddat"], r["holat"]
                    )
                    # Telegramda forward (klient Telegram ID bo'lsa)
                    try:
                        await ctx.bot.send_message(
                            r["klient_id"], matn,
                            parse_mode=None
                        )
                        await eslatma_qayd_qilish(
                            c, uid, r["klient_id"],
                            r["klient_ismi"], r["jami_qarz"]
                        )
                        yuborildi += 1
                    except Exception as e:
                        log.debug("Eslatma TG: %s", e)

            await xat(q, f"✅ {yuborildi} ta klientga eslatma yuborildi!")
        else:
            klient_id = int(klient_id_str) if klient_id_str.isdigit() else 0
            if not klient_id:
                await xat(q, "❌ Klient topilmadi")
                return

            r = next((x for x in royxat if x["klient_id"] == klient_id), None)
            if not r:
                await xat(q, "❌ Bu klientda qarz yo'q")
                return

            matn = eslatma_matni(
                r["klient_ismi"], dokon, telefon,
                r["jami_qarz"], r["qarz_soni"],
                r["muddat"], r["holat"]
            )

            try:
                await ctx.bot.send_message(klient_id, matn, parse_mode=None)
                await eslatma_qayd_qilish(
                    c, uid, klient_id,
                    r["klient_ismi"], r["jami_qarz"]
                )
                await xat(q, f"✅ {r['klient_ismi']} ga eslatma yuborildi!")
            except Exception as e:
                # Klient Telegram ID bo'lmasa — do'konchiga xabar ko'rsatish
                await xat(q,
                    f"📋 *{r['klient_ismi']}* ga eslatma:\n\n"
                    f"{matn}\n\n"
                    f"_Bu xabarni klientga qo'lda yuboring_",
                    parse_mode=ParseMode.MARKDOWN
                )


# ════════════════════════════════════════════════════════════
#  KPI
# ════════════════════════════════════════════════════════════

async def cmd_kpi(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Agent KPI ko'rsatkichlari."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    from shared.services.kpi_engine import agent_kpi
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        kpi = await agent_kpi(c, uid, kunlar=30)

    # Badge matn
    badges_str = " ".join(b["emoji"] for b in kpi["badges"])

    # Trend emoji
    trend_e = "📈" if kpi["trend"] == "o'sish" else ("📉" if kpi["trend"] == "tushish" else "➡️")

    matn = (
        f"📊 *KPI HISOBOT* (30 kun)\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🏷 Reyting: *{kpi['reyting']}* {badges_str}\n\n"
        f"📦 Sotuvlar: *{kpi['sotuv_soni']}* ta\n"
        f"💰 Jami: *{kpi['sotuv_jami']:,.0f}* so'm\n"
        f"📝 O'rtacha chek: *{kpi['ortacha_chek']:,.0f}* so'm\n"
        f"📅 Kunlik o'rtacha: *{kpi['kunlik_ortacha']:,.0f}* so'm\n\n"
        f"👥 Klientlar: {kpi['klient_soni']} ta\n"
        f"🆕 Yangi: {kpi['yangi_klientlar']} ta\n\n"
        f"💹 Foyda: *{kpi['foyda']:,.0f}* so'm ({kpi['margin_foiz']}%)\n"
        f"💳 Qarz berildi: {kpi['qarz_berildi']:,.0f}\n"
        f"💰 Qarz yig'ildi: {kpi['qarz_yigildi']:,.0f}\n\n"
        f"{trend_e} Trend: *{kpi['trend']}* ({kpi['trend_foiz']:+.1f}%)\n\n"
        f"🏆 Badgelar: {badges_str}\n"
    )

    for b in kpi["badges"]:
        matn += f"  {b['emoji']} {b['nomi']}\n"

    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════
#  LOYALTY
# ════════════════════════════════════════════════════════════

async def cmd_loyalty(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klient loyalty (bonus ball) tekshirish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    args = ctx.args
    if not args:
        await update.message.reply_text(
            "📋 *LOYALTY TIZIMI*\n\n"
            "Klient ballini ko'rish:\n"
            "`/loyalty Salimov`\n\n"
            "Qoidalar:\n"
            "• 1000 so'm sotuv = 1 ball\n"
            "• 🥉 Bronze: 0+ ball\n"
            "• 🥈 Silver: 100+ ball (2% chegirma)\n"
            "• 🥇 Gold: 500+ ball (5% chegirma)\n"
            "• 💎 Platinum: 2000+ ball (10% chegirma)",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    klient_ism = " ".join(args)
    klient = await db.klient_topish(uid, klient_ism)
    if not klient:
        await update.message.reply_text(f"❌ '{klient_ism}' topilmadi")
        return

    from shared.services.loyalty import klient_loyalty_profil
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        profil = await klient_loyalty_profil(c, uid, klient["id"])

    d = profil["daraja"]
    matn = (
        f"{d['emoji']} *{klient['ism']}* — Loyalty\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🎯 Daraja: *{d['nomi']}*\n"
        f"⭐ Mavjud ball: *{profil['mavjud_ball']}*\n"
        f"📊 Jami yig'ilgan: {profil['jami_yigilgan']}\n"
        f"🎁 Sarflangan: {profil['jami_sarflangan']}\n"
        f"💰 {profil['ball_qiymati']}\n"
    )

    if d.get("chegirma_foiz", 0) > 0:
        matn += f"\n🏷 Chegirma: *{d['chegirma_foiz']}%*\n"

    if profil["keyingi_daraja"]:
        k = profil["keyingi_daraja"]
        matn += (
            f"\n📈 Keyingi daraja: *{k['nomi']}*\n"
            f"   Yana {k['kerak_ball']} ball kerak\n"
            f"   Chegirma: {k['chegirma_foiz']}%\n"
        )

    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════
#  GPS LOCATION — Agent tracking
# ════════════════════════════════════════════════════════════

async def location_handler(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Telegram location — GPS saqlash."""
    if not update.message or not update.message.location:
        return
    uid = update.effective_user.id

    loc = update.message.location
    from shared.services.gps_tracking import gps_saqlash
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        result = await gps_saqlash(
            c, uid, loc.latitude, loc.longitude,
            accuracy=loc.horizontal_accuracy,
            turi="location"
        )

    await update.message.reply_text(
        f"📍 Joylashuv saqlandi\n"
        f"🕐 {result['vaqt'][:16]}",
        parse_mode=None
    )


async def cmd_marshrut(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Kunlik marshrut hisoboti."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    from shared.services.gps_tracking import kunlik_marshrut
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        data = await kunlik_marshrut(c, uid)

    if data["nuqtalar"] == 0:
        await update.message.reply_text(
            "📍 Bugun joylashuv ma'lumoti yo'q.\n"
            "Joylashuvingizni yuborish uchun 📎 → 📍 Location bosing."
        )
        return

    matn = (
        f"🗺 *KUNLIK MARSHRUT*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📍 Nuqtalar: {data['nuqtalar']}\n"
        f"🚗 Masofa: {data['masofa_km']} km\n"
        f"👥 Visitlar: {data['visitlar']}\n"
        f"⏰ Ish soati: {data['ish_soati']} soat\n"
        f"🕐 Boshlanish: {data['boshlangich'] or '-'}\n"
        f"🕐 Tugash: {data['tugash'] or '-'}\n"
    )

    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════
#  SUPPLIER — Avtomatik buyurtma
# ════════════════════════════════════════════════════════════

async def cmd_buyurtma(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Kam qoldiqli tovarlar uchun buyurtma tayyorlash."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id

    from shared.services.supplier_order import avtomatik_buyurtma_tayyorla
    from shared.database.pool import rls_conn

    async with rls_conn(uid) as c:
        data = await avtomatik_buyurtma_tayyorla(c, uid)

    if not data["buyurtma_kerak"]:
        await update.message.reply_text("✅ Barcha tovarlar yetarli — buyurtma kerak emas!")
        return

    matn = (
        f"📦 *BUYURTMA TAVSIYASI*\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"⚠️ {data['tovar_soni']} ta tovar buyurtma kerak:\n\n"
    )

    for t in data["tovarlar"][:15]:
        emoji = "🚨" if t["holat"] == "tugagan" else ("⚠️" if t["holat"] == "kam" else "📦")
        matn += (
            f"{emoji} *{t['nomi']}*\n"
            f"   Qoldiq: {t['qoldiq']:.0f} | Kerak: +{t['buyurtma_miqdor']:.0f} {t['birlik']}\n"
        )
        if t["qolgan_kun"]:
            matn += f"   ⏳ {t['qolgan_kun']} kunga yetadi\n"
        matn += "\n"

    matn += f"━━━━━━━━━━━━━━━━━━━━━\n💰 Jami: *{data['jami_summa']:,.0f}* so'm\n"

    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


# ════════════════════════════════════════════════════════════
#  HANDLER REGISTRATION
# ════════════════════════════════════════════════════════════

def register_yangi_handlers(app):
    """Yangi handlerlani app ga ulash."""
    from telegram.ext import CommandHandler, CallbackQueryHandler, MessageHandler, filters

    app.add_handler(CommandHandler("eslatma", cmd_eslatma))
    app.add_handler(CommandHandler("kpi", cmd_kpi))
    app.add_handler(CommandHandler("loyalty", cmd_loyalty))
    app.add_handler(CommandHandler("marshrut", cmd_marshrut))
    app.add_handler(CommandHandler("buyurtma", cmd_buyurtma))
    app.add_handler(CallbackQueryHandler(eslatma_cb, pattern=r"^eslatma:"))
    app.add_handler(MessageHandler(filters.LOCATION, location_handler), group=5)

    # AI Business Advisor
    async def cmd_tahlil(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """AI biznes tahlili — aqlli maslahatlar."""
        if not await faol_tekshir(update):
            return
        uid = update.effective_user.id
        await update.message.reply_text("🧠 Tahlil qilmoqdaman...")

        from shared.services.ai_advisor import biznes_tahlil, insight_formatlash
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            data = await biznes_tahlil(c, uid)
        matn = insight_formatlash(data["insightlar"])
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    # Tariflar
    async def cmd_tariflar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """Tarif planlari ko'rsatish."""
        from shared.services.subscription import tariflar_taqqos_matni
        await update.message.reply_text(
            tariflar_taqqos_matni(), parse_mode=ParseMode.MARKDOWN
        )

    app.add_handler(CommandHandler("tahlil", cmd_tahlil))
    app.add_handler(CommandHandler("tariflar", cmd_tariflar))

    # Klient segmentatsiya
    async def cmd_segment(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """Klientlar RFM segmentatsiyasi."""
        if not await faol_tekshir(update):
            return
        uid = update.effective_user.id
        await update.message.reply_text("📊 Segmentatsiya qilmoqdaman...")

        from shared.services.klient_segment import klientlar_segmentatsiya, segmentatsiya_matn
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            data = await klientlar_segmentatsiya(c, uid)
        matn = segmentatsiya_matn(data)
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    app.add_handler(CommandHandler("segment", cmd_segment))

    # AI Talab Prognozi
    async def cmd_prognoz(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """AI talab prognozi — qachon tovar tugaydi."""
        if not await faol_tekshir(update):
            return
        uid = update.effective_user.id
        await update.message.reply_text("🔮 Prognoz hisoblanmoqda...")

        from shared.services.demand_forecast import talab_prognozi, prognoz_matn
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            data = await talab_prognozi(c, uid, 7)
        matn = prognoz_matn(data, 7)
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    # Klient CLV
    async def cmd_clv(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """Klient qiymati (CLV) tahlili."""
        if not await faol_tekshir(update):
            return
        uid = update.effective_user.id
        from shared.services.klient_clv import klient_clv, clv_matn
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            data = await klient_clv(c, uid, 10)
        matn = clv_matn(data)
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    app.add_handler(CommandHandler("prognoz", cmd_prognoz))
    app.add_handler(CommandHandler("clv", cmd_clv))

    # ═══ NAKLADNOY IMPORT CALLBACK ═══
    async def nakladnoy_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """Nakladnoy import tugmasi bosilganda."""
        q = update.callback_query
        await q.answer()
        uid = q.from_user.id

        nak_data = ctx.user_data.get("_nakladnoy_data")
        if not nak_data:
            await q.message.reply_text("❌ Nakladnoy ma'lumoti topilmadi. Qayta yuboring.")
            return

        action = q.data  # "nak:import" yoki "nak:dryrun"
        dry_run = "dryrun" in action

        await q.message.reply_text(
            f"{'🔍 Tekshirmoqdaman...' if dry_run else '📥 Import qilmoqdaman...'}")

        from shared.services.nakladnoy_import import nakladnoy_import, import_xulosa_matn
        from shared.database.pool import rls_conn

        try:
            async with rls_conn(uid) as c:
                natija = await nakladnoy_import(c, uid, nak_data, dry_run=dry_run)
            matn = import_xulosa_matn(natija)
            if dry_run:
                matn += "\n\n_Bu sinov — hali saqlanmadi. Import tugmasini bosing._"
            await q.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
        except Exception as e:
            log.error("Nakladnoy import: %s", e)
            await q.message.reply_text(f"❌ Import xatosi: {e}")

    from telegram.ext import CallbackQueryHandler
    app.add_handler(CallbackQueryHandler(nakladnoy_callback, pattern=r"^nak:"))

    # ═══ REESTR TP CALLBACK ═══
    async def reestr_tp_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        """Reestr TP reyting tugmasi."""
        q = update.callback_query
        await q.answer()

        reestr_data = ctx.user_data.get("_reestr_data")
        nak_data = ctx.user_data.get("_nakladnoy_data")

        from shared.services.tp_analyzer import tp_tahlil_reestr, tp_tahlil_nakladnoy, tp_reyting_matn

        if reestr_data:
            tp = tp_tahlil_reestr(reestr_data)
            matn = tp_reyting_matn(tp, "reestr")
        elif nak_data:
            tp = tp_tahlil_nakladnoy(nak_data)
            matn = tp_reyting_matn(tp, "nakladnoy")
        else:
            matn = "❌ Ma'lumot topilmadi. Avval Excel yuboring."

        await q.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    app.add_handler(CallbackQueryHandler(reestr_tp_callback, pattern=r"^reestr:"))

    log.info("✅ Yangi handlerlar ulandi (eslatma, kpi, loyalty, gps, buyurtma, tahlil, tariflar)")
