"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — BUYRUQ HANDLERLARI                               ║
║  Barcha /cmd komandalar shu yerda                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal

import os as _os
from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup,
    InlineQueryResultArticle, InputTextMessageContent,
)

from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
from services.bot.bot_helpers import (
    faol_tekshir, _user_ol_kesh, tg, _truncate, cfg,
)
from shared.utils import like_escape
from shared.utils.fmt import pul, kunlik_matn, foyda_matn
from services.bot.bot_helpers import _kesh

log = logging.getLogger("mm")


def esc(t: str) -> str:
    """Telegram MarkdownV2 uchun maxsus belgilarni escape qilish"""
    if not isinstance(t, str): t = str(t)
    SPECIAL = ['\\', '`', '*', '_', '{', '}', '[', ']', '(',  ')',
               '#', '+', '-', '.', '!', '|', '~', '>', '=']
    for ch in SPECIAL:
        t = t.replace(ch, '\\' + ch)
    return t


# Circular import oldini olish — main.py dan lazy import
def _get_asosiy_menyu():
    from services.bot.main import asosiy_menyu
    return asosiy_menyu

def _get_version():
    from services.bot.main import __version__
    return __version__

def _get_segment_nomi():
    from services.bot.main import SEGMENT_NOMI
    return SEGMENT_NOMI

def _get_qayta_ishlash():
    from services.bot.handlers.savdo import _qayta_ishlash
    return _qayta_ishlash

def _get_cmd_nakladnoy():
    from services.bot.main import cmd_nakladnoy
    return cmd_nakladnoy


async def cmd_menyu(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    await update.message.reply_text("📋 Asosiy menyu:",reply_markup=_get_asosiy_menyu()())


async def cmd_ertalab(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/ertalab — Claude Opus 4.7 orqali ertalabki biznes brifing.

    Kechagi sotuv + hafta taqqoslash + qarz + ombor + top klientlar →
    AI tahlil va 3 ta amaliy tavsiya. Faol admin har kuni boshlanishida
    ishlatadi.
    """
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    msg = await update.message.reply_text("☀️ Ertalabki brifing tayyorlanmoqda — Opus 4.7 tahlil...")
    try:
        from shared.services.morning_briefing import build_briefing
        from shared.database.pool import rls_conn
        async with rls_conn(uid) as c:
            briefing = await build_briefing(c, uid)
        # MarkdownV2 emas — oddiy Markdown (Opus chiqarishi turli belgilarni ishlatadi)
        try:
            await msg.edit_text(briefing, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            # Agar Markdown parsing xato bo'lsa — oddiy matn
            await msg.edit_text(briefing)
    except Exception as e:
        log.error("cmd_ertalab xato uid=%s: %s", uid, e, exc_info=True)
        try:
            await msg.edit_text(
                "⚠️ Brifing tayyorlashda xato. Keyinroq urinib ko'ring yoki /hisobot ishlating."
            )
        except Exception:
            pass


async def cmd_hisobot(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    d=await db.kunlik_hisobot(uid)
    await update.message.reply_text(kunlik_matn(d),parse_mode=ParseMode.MARKDOWN)

    # PDF hisobot
    try:
        from services.bot.handlers.jobs import _muddati_otgan_qarzlar, _kam_qoldiq_tovarlar, _bugungi_tugilgan_kun
        from shared.services.auto_report_pdf import kunlik_pdf
        import io as _io
        import datetime as _dt
        from telegram import InputFile

        qarzlar = await _muddati_otgan_qarzlar(uid)
        kam = await _kam_qoldiq_tovarlar(uid)
        tugilgan = await _bugungi_tugilgan_kun(uid)
        ism = update.effective_user.first_name or ""

        pdf_bytes = kunlik_pdf(d, qarzlar, kam, ism, tugilgan)
        if pdf_bytes:
            sana = _dt.datetime.now().strftime("%d_%m_%Y")
            await update.message.reply_document(
                document=InputFile(_io.BytesIO(pdf_bytes), filename=f"SavdoAI_Hisobot_{sana}.pdf"),
                caption=f"📊 Kunlik hisobot — {_dt.datetime.now().strftime('%d.%m.%Y')}"
            )
    except Exception as e:
        log.debug("cmd_hisobot PDF: %s", e)


async def cmd_tez(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tez — tezkor tugmalar: eng ko'p ishlatilgan tovar va klientlar"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.advanced_features import tezkor_tugmalar
        async with db._P().acquire() as c:
            data = await tezkor_tugmalar(c, uid)

        tovarlar = data.get("tovarlar", [])
        klientlar = data.get("klientlar", [])

        if not tovarlar and not klientlar:
            await update.message.reply_text("📋 Hali yetarli ma'lumot yo'q. Bir nechta sotuv qiling.")
            return

        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        tugmalar = []

        if klientlar:
            tugmalar.append([InlineKeyboardButton(f"👤 {k}", callback_data=f"tez:kl:{k[:20]}") for k in klientlar[:4]])
        if tovarlar:
            tugmalar.append([InlineKeyboardButton(f"📦 {t}", callback_data=f"tez:tv:{t[:20]}") for t in tovarlar[:4]])

        await update.message.reply_text(
            "⚡ *TEZKOR TUGMALAR*\n\n"
            "Klient yoki tovar tanlang — bot o'zi matn tayyorlaydi:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(tugmalar))
    except Exception as e:
        log.error("cmd_tez: %s", e)
        await update.message.reply_text("❌ Tezkor tugmalar yuklanmadi")


async def cmd_guruh(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/guruh — bir nechta klientga bir xil tovar"""
    if not await faol_tekshir(update): return
    await update.message.reply_text(
        "👥 *GURUHLI SOTUV*\n\n"
        "Ovoz yuboring:\n"
        "_\"5 ta klientga bir xil 10 Ariel 45 mingdan\"_\n\n"
        "Yoki klientlar ro'yxatini yozing:\n"
        "_\"Salimov, Karimov, Toshmatov — 10 Ariel 45 mingdan\"_",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_qarz(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    uid=update.effective_user.id; qatorlar=await db.qarzlar_ol(uid)
    if not qatorlar: await update.message.reply_text("✅ Hech qanday qarz yo'q!"); return
    matn="💰 *QARZLAR*\n\n"; jami=Decimal(0)
    for i,r in enumerate(qatorlar,1):
        matn+=f"{i}. *{r['klient_ismi']}* — {pul(r['qolgan'])}\n"
        jami+=Decimal(str(r["qolgan"]))
    matn+=f"\n💵 Jami: *{pul(jami)}*"
    await update.message.reply_text(matn,parse_mode=ParseMode.MARKDOWN)


async def cmd_foyda(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    d=await db.foyda_tahlil(update.effective_user.id)
    await update.message.reply_text(foyda_matn(d),parse_mode=ParseMode.MARKDOWN)


async def cmd_klient(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Klient qidirish — ism YOKI telefon bo'yicha"""
    if not await faol_tekshir(update): return
    if not ctx.args:
        await update.message.reply_text(
            "Ishlatish: `/klient <ism yoki telefon>`\n"
            "_Namuna: /klient Salimov_\n"
            "_Namuna: /klient +998901234567_",
            parse_mode=ParseMode.MARKDOWN); return
    uid=update.effective_user.id; qidiruv=" ".join(ctx.args)

    # Telefon bo'yicha ham qidirish
    topildi=await db.klient_qidirish(uid,qidiruv)

    # Telefon bo'yicha alohida qidirish
    if not topildi and qidiruv.startswith("+"):
        async with db._P().acquire() as c:
            topildi=await c.fetch("""
                SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan, narx_guruh_id FROM klientlar
                WHERE user_id=$1 AND telefon LIKE $2
                LIMIT 10
            """,uid,f"%{like_escape(qidiruv.replace('+998',''))}%")

    if not topildi:
        await update.message.reply_text(f"❌ '{qidiruv}' topilmadi."); return
    matn=f"🔍 *'{qidiruv}'* bo'yicha:\n\n"
    kl_tugmalar=[]
    for k in topildi:
        j=Decimal(str(k.get("jami_sotib") or 0))
        matn+=f"• *{k['ism']}*"
        if k.get("telefon"): matn+=f" — {k['telefon']}"
        if j: matn+=f" | {j:,.0f}"
        matn+="\n"
        kl_tugmalar.append([(f"📋 {k['ism'][:20]}",f"kh:{k['id']}")])
    markup=InlineKeyboardMarkup([tl for tl in kl_tugmalar])
    await update.message.reply_text(matn,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)


async def cmd_top(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Top klientlar — eng ko'p xarid qilganlar"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    top = await db.top_klientlar(uid, 10)
    if not top:
        await update.message.reply_text("👥 Hali sotuv yo'q."); return
    matn = "🏆 *TOP KLIENTLAR*\n\n"
    for i, k in enumerate(top, 1):
        medal = "🥇" if i==1 else "🥈" if i==2 else "🥉" if i==3 else f"{i}."
        matn += f"{medal} *{k['ism']}*\n"
        matn += f"   💰 Jami: {pul(k.get('jami_sotib',0))} so'm\n"
        matn += f"   🛒 Sotuvlar: {k['sotuv_soni']} ta\n"
        aq = Decimal(str(k.get('aktiv_qarz') or 0))
        if aq > 0:
            matn += f"   ⚠️ Qarz: {aq:,.0f} so'm\n"
        matn += "\n"
    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


async def cmd_ombor(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Ombor holati — SAP-GRADE to'liq tahlil"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    h = await db.oylik_qoldiq_hisobot(uid)
    foyda = h["chiqim_oy"] - h["kirim_oy"]

    # Kam qoldiq tovarlar
    kam = await db.kam_qoldiq_tovarlar(uid)
    kam_matn = ""
    if kam:
        kam_matn = "\n⚠️ *KAM QOLDIQ:*\n"
        for t in kam[:5]:
            kam_matn += f"  📦 {t['nomi']}: *{t['qoldiq']}* ta\n"

    # Top tovarlar
    tovarlar = await db.tovarlar_ol(uid)
    top_matn = ""
    if tovarlar:
        # Sort by qiymat (qoldiq * narx)
        sorted_t = sorted(tovarlar,
            key=lambda t: Decimal(str(t.get('qoldiq',0))) * Decimal(str(t.get('sotish_narxi',0) or 0)),
            reverse=True)[:5]
        top_matn = "\n📊 *ENG QIMMAT TOVARLAR:*\n"
        for t in sorted_t:
            qd = Decimal(str(t.get('qoldiq',0)))
            narx = Decimal(str(t.get('sotish_narxi',0) or 0))
            qiymat = qd * narx
            if qiymat > 0:
                top_matn += f"  📦 {t['nomi']}: {qd} × {pul(narx)} = *{pul(qiymat)}*\n"

    matn = (
        f"🏭 *OMBOR HOLATI — SAP GRADE*\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"📅 Oy boshi: {h['oy_boshi']}\n\n"
        f"📥 Oy kirim: *{h['kirim_oy']:,.0f} so'm*\n"
        f"📤 Oy sotuv: *{h['chiqim_oy']:,.0f} so'm*\n"
        f"💹 Oy foydasi: *{foyda:,.0f} so'm*\n\n"
        f"📦 Tovarlar qiymati: *{h['tovarlar_qiymati']:,.0f} so'm*\n"
        f"📦 Jami tovarlar: *{len(tovarlar) if tovarlar else 0}* ta\n"
        f"⚠️ Kam qoldiq: *{len(kam) if kam else 0}* ta"
        f"{kam_matn}{top_matn}"
    )
    await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)


async def cmd_status(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Bot va tizim holati"""
    if not cfg().is_admin(update.effective_user.id): return
    import platform
    import sys
    from datetime import datetime
    import pytz
    tz = pytz.timezone("Asia/Tashkent")
    hozir = datetime.now(tz).strftime("%d.%m.%Y %H:%M:%S")
    users = await db.barcha_users()
    faol  = sum(1 for u in users if u["faol"])
    # DB ping + pool pressure
    db_ms = "?"
    db_status_emoji = "✅"
    db_pressure = 0
    try:
        from shared.database.pool import pool_health
        info = await pool_health()
        db_ms = f"{info.get('ping_ms', '?')}ms (pool: {info.get('used',0)}/{info.get('size',0)})"
        db_pressure = info.get("pressure_pct", 0)
        if db_pressure >= 95 or info.get("status") == "error":
            db_status_emoji = "🔴"
        elif db_pressure >= 80 or info.get("status") == "degraded":
            db_status_emoji = "🟡"
    except Exception as _e: log.debug("silent: %s", _e)

    # Cache (Redis) sog'lig'i
    cache_emoji = "✅"
    cache_info = ""
    try:
        from shared.cache.redis_cache import cache_health
        ch = cache_health()
        if not ch.get("redis_connected"):
            cache_emoji = "🟡"
            cache_info = " (Redis uzilgan — memory fallback)"
        miss = ch.get("cache_misses_due_to_redis_down", 0)
        if miss > 100:
            cache_info += f" ({miss} miss)"
    except Exception as _e: log.debug("silent: %s", _e)

    # AI providerlar
    import os as _os
    ai_anthropic = "✅" if (_os.getenv("ANTHROPIC_API_KEY") or "").strip() else "⚪"
    ai_gemini = "✅" if ((_os.getenv("GEMINI_API_KEY") or _os.getenv("GOOGLE_API_KEY") or "").strip()) else "⚪"

    matn = (
        "⚙️ *TIZIM HOLATI (v25.3 PRODUCTION)*\n\n"
        + f"📅 Vaqt: `{hozir}`\n"
        + f"🐍 Python: `{sys.version.split()[0]}`\n"
        + f"💻 OS: `{platform.system()} {platform.release()}`\n\n"
        + f"👥 Foydalanuvchilar: {len(users)} (faol: {faol})\n"
        + f"💾 Kesh: {len(_kesh)} ta yozuv{cache_info}\n\n"
        + "✅ Bot: Ishlayapti\n"
        + f"{db_status_emoji} DB: {db_ms} — pressure {db_pressure}%\n"
        + f"{cache_emoji} Cache\n"
        + f"{ai_anthropic} Claude ({cfg().claude_model})\n"
        + f"{ai_gemini} Gemini ({cfg().gemini_model})\n"
        + f"{ai_anthropic} Opus 4.7 audit\n"
        + "✅ Vision AI\n"
        + "✅ Kassa"
    )
    await update.message.reply_text(matn, parse_mode="Markdown")


async def cmd_kassa(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Kassa holati — naqd/karta/otkazma"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            bugun = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
                FROM kassa_operatsiyalar
                WHERE user_id=$1 AND (yaratilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
            """, uid)
            jami = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
                FROM kassa_operatsiyalar
                WHERE user_id=$1
            """, uid)
            usullar = await c.fetch("""
                SELECT usul,
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE -summa END), 0) AS balans
                FROM kassa_operatsiyalar WHERE user_id=$1 GROUP BY usul
            """, uid)
            oxirgi = await c.fetch("""
                SELECT tur, summa, usul, tavsif, yaratilgan
                FROM kassa_operatsiyalar
                WHERE user_id=$1
                ORDER BY yaratilgan DESC LIMIT 5
            """, uid)
        bk = Decimal(str(bugun["kirim"])); bc = Decimal(str(bugun["chiqim"]))
        jk = Decimal(str(jami["kirim"])); jc = Decimal(str(jami["chiqim"]))
        usul_map = {r["usul"]: Decimal(str(r["balans"])) for r in usullar}
        matn = (
            "💳 *KASSA HOLATI*\n\n"
            f"📅 *Bugun:*\n"
            f"  📥 Kirim: *{pul(bk)}*\n"
            f"  📤 Chiqim: *{pul(bc)}*\n"
            f"  💰 Balans: *{pul(bk - bc)}*\n\n"
            f"📊 *Umumiy:*\n"
            f"  💵 Naqd: *{pul(usul_map.get('naqd', 0))}*\n"
            f"  💳 Karta: *{pul(usul_map.get('karta', 0))}*\n"
            f"  🏦 O'tkazma: *{pul(usul_map.get('otkazma', 0))}*\n"
            f"  ━━━━━━━━━━━━━━\n"
            f"  💰 JAMI: *{pul(jk - jc)}*\n"
        )
        if oxirgi:
            matn += "\n📋 *Oxirgi 5 ta:*\n"
            for r in oxirgi:
                belgi = "📥" if r["tur"] == "kirim" else "📤"
                usul_belgi = {"naqd": "💵", "karta": "💳", "otkazma": "🏦"}.get(r["usul"], "💰")
                matn += f"  {belgi} {usul_belgi} {pul(r['summa'])}"
                try:
                    if r["tavsif"]: matn += f" — {r['tavsif'][:30]}"
                except (KeyError, TypeError):
                    pass
                matn += "\n"
        await update.message.reply_text(_truncate(matn), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.warning("cmd_kassa: %s", e)
        await update.message.reply_text(
            "💳 *KASSA*\n\nOvoz yuboring:\n_\"Kassaga 500,000 naqd kirim\"_\n_\"Kassadan 200,000 karta chiqim\"_",
            parse_mode=ParseMode.MARKDOWN)


async def cmd_faktura(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Hisob-faktura yaratish"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    user = await _user_ol_kesh(uid)
    (user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"

    # Oxirgi sotuv sessiyasini topish
    try:
        async with db._P().acquire() as c:
            oxirgi = await c.fetchrow("""
                SELECT id, klient_ismi, jami, tolangan, qarz, sana
                FROM sotuv_sessiyalar
                WHERE user_id=$1
                ORDER BY sana DESC LIMIT 1
            """, uid)
        if oxirgi:
            markup = tg(
                [(f"📋 Faktura #{oxirgi['id']}", f"fkt:sess:{oxirgi['id']}")],
                [("📋 Boshqa sessiya", "fkt:tanlash")],
            )
            await update.message.reply_text(
                "📋 *HISOB-FAKTURA*\n\n"
                f"Oxirgi sotuv: #{oxirgi['id']}\n"
                f"👤 {oxirgi['klient_ismi'] or 'Noma_lum'}\n"
                f"💰 {pul(oxirgi['jami'])}\n\n"
                "Qaysi sotuv uchun faktura yaratamiz?",
                parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
        else:
            await update.message.reply_text("❌ Hali sotuv yo'q. Avval sotuv qiling.")
    except Exception as e:
        log.warning("cmd_faktura: %s", e)
        await update.message.reply_text("❌ Faktura vaqtincha ishlamayapti.")


async def cmd_balans(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Balans tekshiruvi — SAP-GRADE reconciliation"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return
    try:
        async with db._P().acquire() as c:
            # Jurnal balans
            row = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(jami_debit), 0) AS td,
                    COALESCE(SUM(jami_credit), 0) AS tc,
                    COUNT(*) AS soni
                FROM jurnal_yozuvlar
                WHERE user_id=$1
            """, uid)
            td = Decimal(str(row["td"])); tc = Decimal(str(row["tc"]))
            farq = td - tc
            jurnal_soni = row["soni"]

            # Qarz balans
            qarz_jami = await c.fetchval(
                "SELECT COALESCE(SUM(qolgan),0) FROM qarzlar WHERE user_id=$1 AND yopildi=FALSE", uid) or 0

            # Kassa balans
            kassa_row = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END),0) AS k,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END),0) AS ch
                FROM kassa_operatsiyalar
                WHERE user_id=$1
            """, uid)
            kassa_b = Decimal(str(kassa_row["k"])) - Decimal(str(kassa_row["ch"]))

            # Ombor qiymati
            ombor = await c.fetchval(
                "SELECT COALESCE(SUM(qoldiq * COALESCE(sotish_narxi,0)),0) FROM tovarlar WHERE user_id=$1", uid) or 0

        status = "✅ BALANS TO'G'RI" if farq == 0 else f"❌ FARQ: {farq}"
        await update.message.reply_text(
            f"📊 *SAP-GRADE BALANS TEKSHIRUVI*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"📒 *Double-Entry Ledger:*\n"
            f"  Jami DEBIT:  *{pul(td)}*\n"
            f"  Jami CREDIT: *{pul(tc)}*\n"
            f"  Farq: *{farq}*\n"
            f"  Holat: *{status}*\n"
            f"  Yozuvlar: {jurnal_soni} ta\n\n"
            f"💰 *Qarz balans:* {pul(qarz_jami)}\n"
            f"💳 *Kassa balans:* {pul(kassa_b)}\n"
            f"📦 *Ombor qiymati:* {pul(ombor)}\n",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.warning("cmd_balans: %s", e)
        await update.message.reply_text(
            "📊 *BALANS*\n\nHali jurnal yozuvlar yo'q.\nSotuv/kirim qiling — avtomatik yoziladi.",
            parse_mode=ParseMode.MARKDOWN)


async def cmd_jurnal(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Oxirgi jurnal yozuvlari — double-entry ledger"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT jurnal_id, tur, tavsif, jami_debit, sana
                FROM jurnal_yozuvlar
                WHERE user_id=$1
                ORDER BY sana DESC LIMIT 10
            """, uid)
        if not rows:
            await update.message.reply_text("📒 Hali jurnal yozuvlar yo'q.")
            return
        TUR_EMOJI = {"sotuv":"📤","kirim":"📥","qaytarish":"↩️",
                      "qarz_tolash":"💰","kassa_kirim":"💳","kassa_chiqim":"💸"}
        lines = ["📒 *OXIRGI JURNAL YOZUVLARI*\n"]
        for r in rows:
            emoji = TUR_EMOJI.get(r["tur"], "📋")
            sana = r["sana"].strftime("%d.%m %H:%M") if r["sana"] else ""
            lines.append(f"{emoji} {pul(r['jami_debit'])} — {r['tavsif'][:40]}")
            lines.append(f"   {sana} | `{r['jurnal_id'][-8:]}`")
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.warning("cmd_jurnal: %s", e)
        await update.message.reply_text("📒 Jurnal ko'rsatib bo'lmadi.")


async def cmd_chiqim(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Xarajat yozish yo'riqnomasi"""
    if not await faol_tekshir(update): return
    await update.message.reply_text(
        "💸 *XARAJAT / CHIQIM*\n\n"
        "Ovoz yuboring yoki yozing:\n\n"
        "_\"300 ming transport xarajati\"_\n"
        "_\"150,000 elektr to'lovi\"_\n"
        "_\"50,000 ovqat xarajati\"_\n\n"
        "Yoki menyu → 💳 Kassa → chiqim yozing",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_tovar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Bitta tovar qidirish"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    args = (update.message.text or "").replace("/tovar", "").strip()
    if not args:
        await update.message.reply_text(
            "📦 *Tovar qidirish:*\n/tovar Ariel\n/tovar Un",
            parse_mode=ParseMode.MARKDOWN)
        return
    tovar = await db.tovar_topish(uid, args)
    if tovar:
        qd = Decimal(str(tovar.get("qoldiq", 0)))
        sn = Decimal(str(tovar.get("sotish_narxi", 0) or 0))
        on = Decimal(str(tovar.get("olish_narxi", 0) or 0))
        matn = (
            f"📦 *{tovar['nomi']}*\n\n"
            f"📊 Qoldiq: *{qd}* {tovar.get('birlik','dona')}\n"
            f"💰 Sotish: *{pul(sn)}*\n"
            f"📥 Olish: *{pul(on)}*\n"
        )
        if sn > 0 and on > 0:
            foyda = sn - on
            foiz = (foyda / on * 100) if on > 0 else Decimal("0")
            matn += f"💹 Foyda/dona: *{pul(foyda)}* ({foiz:.1f}%)\n"
        if tovar.get("kategoriya"):
            matn += f"📁 Kategoriya: {tovar['kategoriya']}\n"
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text(f"❌ \"{args}\" topilmadi.")


async def cmd_yangilik(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """v25.3 MEGA yangiliklari"""
    await update.message.reply_text(
        f"🆕 *SAVDOAI v{_get_version()} — MEGA YANGILANISH*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🤖 *SUHBATDOSH BOT*\n"
        "  Bot odam kabi gaplashadi — salom, yordam, tavsiya\n\n"
        "🔬 *MUTAXASSIS TAHLIL*\n"
        "  \"Ariel haqida\" → narx, qoldiq, trend, tavsiya\n"
        "  \"Salimov tahlil\" → xavf A/B/C, VIP status\n\n"
        "📊 *SMART BUYRUQLAR*\n"
        "  \"narx tavsiya\" \"klient reyting\" \"ABC tahlil\"\n"
        "  \"haftalik trend\" \"inventarizatsiya\"\n\n"
        "✏️ *KONTEKST + TUZATISH*\n"
        "  \"yana 20 Tide qo'sh\" → savatga qo'shadi\n"
        "  \"50 emas 30 ta\" → tuzatadi\n\n"
        "📸 *VISION MIKROSKOP v3*\n"
        "  3 bosqichli rasm tahlil — 7000+ belgi prompt\n"
        "  Nakladnoy, chek, daftar, kvitansiya\n\n"
        "📄 *HUJJAT O'QISH (40 format)*\n"
        "  PDF, Word, Excel, EPUB, PowerPoint, FB2...\n"
        "  100,000 sahifa — 1 sekundda izlaydi\n"
        "  \"5-bet\" \"Pifagor qayerda\" \"tushuntir\"\n\n"
        "🔊 *OVOZLI JAVOB (TTS)*\n"
        "  Kirim, sotuv, qarz, hisobot — hammasi ovozda\n\n"
        "⚡ *TEZKOR TUGMALAR*\n"
        "  /tez — eng ko'p tovar va klientlar\n"
        "  /guruh — bir nechta klientga bir xil\n\n"
        "📋 *AVTO HISOBOTLAR*\n"
        "  Har kuni 20:00 — kunlik yakuniy PRO\n"
        "  Har dushanba — haftalik trend\n"
        "  Har kuni — qarz eslatma (muddati o'tgan!)\n",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_imkoniyatlar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Barcha imkoniyatlar ro'yxati"""
    await update.message.reply_text(
        f"📋 *SAVDOAI v{_get_version()} — BARCHA IMKONIYATLAR*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🎤 *OVOZ BILAN BOSHQARISH*\n"
        "  Ovoz yuboring — bot tushunadi va yozadi\n"
        "  O'zbek + Rus tilida | 8 ta sheva\n\n"
        "📦 *SAVDO*\n"
        "  📥 Kirim | 📤 Sotuv | ↩️ Qaytarish | 💰 Qarz to'lash\n"
        "  📋 Nakladnoy (Word+Excel+PDF)\n"
        "  \"yana 20 Tide qo'sh\" — kontekstli savat\n"
        "  \"50 emas 30\" — tuzatish\n"
        "  \"Salimov odatiy\" — shablon buyurtma\n"
        "  \"5 klientga bir xil\" — guruhli sotuv\n\n"
        "🔬 *MUTAXASSIS TAHLIL*\n"
        "  \"Ariel haqida\" → narx, qoldiq, markup%, tavsiya\n"
        "  \"Salimov tahlil\" → xavf darajasi, VIP, tavsiya\n\n"
        "📊 *SMART BUYRUQLAR*\n"
        "  \"narx tavsiya\" | \"klient reyting\" | \"ABC tahlil\"\n"
        "  \"haftalik trend\" | \"inventarizatsiya\"\n"
        "  \"kecha Ariel nechtadan?\" — tabiiy savol\n"
        "  \"Ariel 3 ta yo'qoldi\" — qoldiq tuzatish\n\n"
        "📸 *RASM TAHLIL (Mikroskop v3)*\n"
        "  Nakladnoy, chek, daftar, kvitansiya o'qiydi\n"
        "  3 bosqichli tahlil — har raqamni alohida tekshiradi\n"
        "  Ko'p rasm → /tahlil\n\n"
        "📄 *HUJJAT O'QISH (40 format, 100K sahifa)*\n"
        "  PDF, Word, Excel, EPUB, PowerPoint, FB2, HTML...\n"
        "  \"5-bet\" → sahifa | \"so'z\" → izlash | \"tushuntir\" → AI\n\n"
        "📊 *HISOBOTLAR*\n"
        "  Kunlik/Haftalik/Oylik | Foyda | Qarz | Top klientlar\n"
        "  Excel export | 🔊 Ovozli xulosa\n\n"
        "🔊 *OVOZLI JAVOB (TTS)*\n"
        "  Kirim, sotuv, qarz, hisobot — hammasi ovozda\n\n"
        "⚡ /tez — tezkor tugmalar\n"
        "👥 /guruh — guruhli sotuv\n"
        "📸 /tahlil — ko'p rasm tahlil\n",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_yordam(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Yordam — OVOZ bilan qanday ishlatish (v25.4.0)"""
    await update.message.reply_text(
        "🎤 *SAVDOAI — OVOZLI TIZIM (v25.4.0)*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "Hamma narsa OVOZ orqali ishlaydi. Buyruq bilmang — gapiring!\n\n"
        "💼 *SOTUV / KIRIM / KLIENT:*\n"
        "🎤 _\"Salimovga 50 Ariel qarzga\"_\n"
        "🎤 _\"100 ta un kirdi narxi 35,000\"_\n"
        "🎤 _\"Yangi klient Karim aka 95 259 99 00\"_\n"
        "🎤 _\"Salimov 500,000 to'ladi\"_\n"
        "\n"
        "✅ *TASDIQ / BEKOR:*\n"
        "🎤 _\"Ha tasdiq\"_ / _\"Bekor qil\"_\n"
        "🎤 _\"Majbur saqla\"_ (qoldiq yetmasa)\n"
        "\n"
        "🏪 *STORECHECK (tashrif):*\n"
        "🎤 _\"Akmal do'koniga tashrif boshlaymiz\"_\n"
        "🎤 _\"Ariel bor 56000\"_ / _\"Persil yo'q\"_\n"
        "🎤 _\"Tashrif yop\"_\n"
        "\n"
        "📝 *VAZIFALAR:*\n"
        "🎤 _\"Vazifa ber Akbar Karimga yetkazib ber\"_\n"
        "🎤 _\"Mening vazifalarim\"_ (shogird)\n"
        "🎤 _\"5-vazifa bajardim\"_\n"
        "\n"
        "📈 *PLAN / KPI / HISOBOT:*\n"
        "🎤 _\"Bu oy 30 million plan\"_\n"
        "🎤 _\"Plan progress\"_\n"
        "🎤 _\"Shogirdlar reyting\"_\n"
        "🎤 _\"Ertalabki brifing\"_\n"
        "🎤 _\"Oylik tahlil\"_ (30 kun Opus 4.7)\n"
        "\n"
        "📊 *RFM KLIENT SEGMENTATSIYA:*\n"
        "🎤 _\"Champion klientlar\"_\n"
        "🎤 _\"Xavf ostidagi klientlar\"_\n"
        "🎤 _\"Sodiq klientlar\"_\n"
        "\n"
        "🌟 *HAYOTIM (shaxsiy):*\n"
        "🎤 _\"Hayotim\"_ — dashboard\n"
        "🎤 _\"Yangi maqsad: oyda 5 klient\"_\n"
        "🎤 _\"Yangi g'oya: telegram kanal\"_\n"
        "🎤 _\"Shaxsiy xarajat 50000 ovqat\"_\n"
        "\n"
        "💰 *NARX TURLARI:*\n"
        "🎤 _\"Narx turi VIP qo'sh 15\"_\n"
        "🎤 _\"Karim aka VIP narxga\"_\n"
        "\n"
        "🏷️ *YANGI KATALOG (klassifikator):*\n"
        "🎤 _\"Yangi brend Ariel qo'shing\"_\n"
        "🎤 _\"Kategoriya Sladus qo'sh\"_\n"
        "🎤 _\"Segment VIP yarat\"_\n"
        "🎤 _\"Ishlab chiqaruvchi Procter Gamble Turkiya\"_\n"
        "\n"
        "🚚 *EKSPEDITOR / SKLAD:*\n"
        "🎤 _\"Yangi ekspeditor Karim aka +998901234567\"_\n"
        "🎤 _\"Sklad Asosiy qo'shish\"_\n"
        "🎤 _\"Sklad brak qo'sh\"_\n"
        "\n"
        "👥 *AGENT / MOLIYA HISOBOTI:*\n"
        "🎤 _\"Agent hisobot\"_\n"
        "🎤 _\"Kim qancha sotdi\"_\n"
        "🎤 _\"Foyda hisobot\"_ / _\"PnL\"_\n"
        "🎤 _\"Sof foyda\"_\n"
        "\n"
        "💬 *FIKR / SHIKOYAT:*\n"
        "🎤 _\"Shikoyat: Ariel paketi ochiq kelgan\"_\n"
        "🎤 _\"Shikoyat: muddati o'tgan tovar berildi\"_\n"
        "🎤 _\"Maqtov: Akbar tez yetkazdi rahmat\"_\n"
        "🎤 _\"Taklif: yangi brend olib keling\"_\n"
        "\n"
        "🔄 *QAYTARISH:*\n"
        "🎤 _\"Karim 5 ta Ariel qaytardi brak\"_\n"
        "\n"
        "📸 *RASMLAR:*\n"
        "Nakladnoy/chek rasmi yuboring — AI o'qiydi\n"
        "\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "💡 *Buyruqlar (kerak bo'lsa):*\n"
        "/hisobot, /qarz, /ombor, /kassa\n"
        "/kpi, /rfm, /plan, /vazifalar\n"
        "/hayotim, /ertalab, /oyim\n"
        "/tashriflar, /fikrlar, /qaytarishlar\n"
        "/narx_turlari, /shogirdlar\n"
        "/bekor — jarayonni to'xtatish\n\n"
        "🌐 *Web interfeys:*\n"
        "savdoai-web-production.up.railway.app/voice-help\n"
        "— barcha 40+ ovozli buyruq vizual grid",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_ogoh(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    uid=update.effective_user.id; kam=await db.kam_qoldiq_tovarlar(uid)
    if not kam: await update.message.reply_text("✅ Barcha tovarlar etarli!"); return
    matn="⚠️ *KAM QOLDIQ TOVARLAR*\n\n"
    for t in kam:
        matn+=(f"📦 *{t['nomi']}*\n"
               f"   Qoldiq: {t['qoldiq']} {t['birlik']}  "
               f"|  Min: {t.get('min_qoldiq',0)}\n\n")
    await update.message.reply_text(matn,parse_mode=ParseMode.MARKDOWN)


async def cmd_hafta(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Haftalik hisobot"""
    if not await faol_tekshir(update): return
    d = await db.haftalik_hisobot(update.effective_user.id)
    matn = (
        "📊 *HAFTALIK HISOBOT* (7 kun)\n\n"
        + f"📥 Kirim: {d['kr_n']} ta | *{d['kr_jami']:,.0f} so'm*\n"
        + f"📤 Sotuv: {d['ch_n']} ta | *{d['ch_jami']:,.0f} so'm*\n"
        + f"💹 Foyda: *{d['foyda']:,.0f} so'm*\n"
        + f"⚠️ Jami qarz: *{d['jami_qarz']:,.0f} so'm*"
    )
    await update.message.reply_text(matn, parse_mode="Markdown")


async def cmd_foydalanuvchilar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not cfg().is_admin(update.effective_user.id): return
    qatorlar=await db.barcha_users(); faol_son=sum(1 for r in qatorlar if r["faol"])
    matn=(f"👥 *FOYDALANUVCHILAR*\n\n"
          f"✅ Faol: {faol_son}  |  ⏳ Kutmoqda: {len(qatorlar)-faol_son}  "
          f"|  📊 Jami: {len(qatorlar)}\n\n")
    for r in qatorlar:
        belgi="✅" if r["faol"] else "⏳"
        matn+=(f"{belgi} *{r.get('to_liq_ism') or r.get('ism', '')}*\n"
               f"   🏪 {r.get('dokon_nomi','')} | "
               f"{_get_segment_nomi().get(r.get('segment',''),'')}\n"
               f"   🆔 `{r['id']}` | Obuna: {str(r.get('obuna_tugash','?'))}\n\n")
    await update.message.reply_text(matn[:4000],parse_mode=ParseMode.MARKDOWN)


async def cmd_faollashtir(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not cfg().is_admin(update.effective_user.id): return
    if not ctx.args:
        await update.message.reply_text("Ishlatish: `/faollashtir <id>`",
                                         parse_mode=ParseMode.MARKDOWN); return
    try:
        uid=int(ctx.args[0]); await db.user_faollashtir(uid); await db.user_yangilab(uid,faol=True)
        await update.message.reply_text(f"✅ `{uid}` faollashtirildi!",parse_mode=ParseMode.MARKDOWN)
        try: await ctx.bot.send_message(uid,"✅ Hisobingiz faollashtirildi! /start bosing.")
        except Exception as _e: log.debug("silent: %s", _e)
    except ValueError: await update.message.reply_text("❌ Noto'g'ri ID.")
    except Exception as xato:
        log.error("Bot handler xato: %s", xato)
        try: await update.message.reply_text("❌ Xato yuz berdi. Qayta urinib ko'ring.")
        except Exception as _e: log.debug("silent: %s", _e)


async def cmd_statistika(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not cfg().is_admin(update.effective_user.id): return
    qatorlar=await db.barcha_users(); faol_son=sum(1 for r in qatorlar if r["faol"])
    await update.message.reply_text(
        f"📊 *ADMIN STATISTIKA*\n\nJami: {len(qatorlar)}\n"
        f"✅ Faol: {faol_son}\n⏳ Kutmoqda: {len(qatorlar)-faol_son}",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_savatlar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Barcha ochiq savatlar ko'rish"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.ochiq_savat import ochiq_savatlar, ochiq_savatlar_matn
        async with db._P().acquire() as c:
            savatlar = await ochiq_savatlar(c, uid)
        await update.message.reply_text(ochiq_savatlar_matn(savatlar))
    except Exception as e:
        log.warning("cmd_savatlar: %s", e)
        await update.message.reply_text("🛒 Ochiq savat yo'q\n\nOvoz yuboring:\n\"Salimovga 1 Ariel 45000\"")


async def cmd_savat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klient savati ko'rish: /savat Nasriddin aka"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    matn = (update.message.text or "").replace("/savat", "").strip()
    if not matn:
        await update.message.reply_text("📦 Klient ismini yozing:\n/savat Nasriddin aka")
        return
    try:
        from shared.services.ochiq_savat import savat_korish, savat_matn
        async with db._P().acquire() as c:
            data = await savat_korish(c, uid, matn)
        if data:
            await update.message.reply_text(savat_matn(data))
        else:
            await update.message.reply_text(f"🛒 {matn} uchun ochiq savat yo'q")
    except Exception as e:
        log.warning("cmd_savat: %s", e)
        await update.message.reply_text("❌ Xato yuz berdi")




# ═══ OVOZ BUYRUQ DISPATCHER ═══
# main.py dan ko'chirildi — ovoz buyruqlarini cmd_* larga yo'naltiradi

async def _ovoz_buyruq_bajar(update:Update, ctx:ContextTypes.DEFAULT_TYPE,
                               cmd: dict) -> None:
    """O'zbek ovoz buyrug'ini AI siz bajarish"""
    uid = update.effective_user.id
    action = cmd["action"]
    sub = cmd["sub"]

    if action == "confirm":
        # Kutilayotgan draft tasdiqlash
        natija = ctx.user_data.get("kutilayotgan")
        if natija:
            # tasdiq_cb simulating
            ctx.user_data["_voice_confirm"] = True
            await update.message.reply_text("✅ Ovoz bilan tasdiqlandi! Saqlanmoqda...")
            # tasdiq flow will pick up kutilayotgan
            return
        await update.message.reply_text("❌ Hozir tasdiqlash uchun hech narsa yo'q.")

    elif action == "cancel":
        natija = ctx.user_data.pop("kutilayotgan", None)
        ctx.user_data.pop("kutilayotgan_majbur", None)
        ctx.user_data.pop("draft_info", None)
        if natija:
            await update.message.reply_text("❌ Bekor qilindi.")
        else:
            await update.message.reply_text("ℹ️ Bekor qilish uchun hech narsa yo'q.")

    elif action == "report":
        try:
            from shared.services.hisobot_engine import (
                kunlik, haftalik, oylik, qarz_hisobot,
                hisobot_matn, qarz_hisobot_matn
            )
            async with db._P().acquire() as _rc:
                if sub == "daily":
                    _rd = await kunlik(_rc, uid)
                    await update.message.reply_text(hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                elif sub == "weekly":
                    _rd = await haftalik(_rc, uid)
                    await update.message.reply_text(hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                elif sub == "monthly":
                    _rd = await oylik(_rc, uid)
                    await update.message.reply_text(hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                elif sub == "profit":
                    _rd = await kunlik(_rc, uid)
                    await update.message.reply_text(hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                elif sub == "debts":
                    _rd = await qarz_hisobot(_rc, uid)
                    await update.message.reply_text(qarz_hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                elif sub == "top_clients":
                    _rd = await kunlik(_rc, uid)
                    if _rd.get("top5_klient"):
                        lines = ["🏆 *TOP KLIENTLAR*\n"]
                        medals = ["🥇","🥈","🥉"]
                        for i, k in enumerate(_rd["top5_klient"][:5]):
                            m = medals[i] if i < 3 else f"{i+1}."
                            q = f" (qarz: {pul(k['jami_qarz'])})" if k.get("jami_qarz",0)>0 else ""
                            lines.append(f"{m} {k['ism']} — {pul(k['jami_sotuv'])}{q}")
                        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
                    else:
                        await update.message.reply_text("📊 Hali klientlar yo'q.")
                elif sub == "low_stock":
                    kam = await db.kam_qoldiq_tovarlar(uid)
                    if kam:
                        lines = ["⚠️ *KAM QOLDIQ TOVARLAR*\n"]
                        for t in kam[:10]:
                            lines.append(f"📦 {t['nomi']}: *{t['qoldiq']}* ta")
                        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)
                    else:
                        await update.message.reply_text("✅ Barcha tovarlar yetarli!")
                elif sub == "stock":
                    await cmd_ombor(update, ctx)
                else:
                    _rd = await kunlik(_rc, uid)
                    await update.message.reply_text(hisobot_matn(_rd), parse_mode=ParseMode.MARKDOWN)
        except Exception as _re:
            log.warning("Report callback xato (fallback): %s", _re)
            d = await db.kunlik_hisobot(uid)
            await update.message.reply_text(kunlik_matn(d), parse_mode=ParseMode.MARKDOWN)

    elif action == "kassa":
        await cmd_kassa(update, ctx)

    elif action == "debt":
        if sub == "list":
            await cmd_qarz(update, ctx)
        else:
            # qarz to'lash — AI ga yuborish
            await _get_qayta_ishlash()(update, ctx, cmd["original"])

    elif action == "print":
        if sub == "preview":
            # Kutilayotgan draft ni chek formatda ko'rsatish
            natija = ctx.user_data.get("kutilayotgan")
            if natija:
                from shared.services.print_status import format_receipt_80mm
                user = await _user_ol_kesh(uid)
                dokon = (user.get("dokon_nomi","") or "") if user else ""
                d = dict(natija)
                d.setdefault("amal", "chiqim")
                receipt = format_receipt_80mm(d, dokon)
                await update.message.reply_text(
                    f"🖨️ *CHEK PREVIEW (80mm thermal)*\n```\n{receipt}\n```",
                    parse_mode=ParseMode.MARKDOWN)
            else:
                await update.message.reply_text("❌ Chek uchun ma'lumot yo'q. Avval sotuv qiling.")
        elif sub == "receipt":
            # Chek chiqarish
            natija = ctx.user_data.get("kutilayotgan")
            if natija:
                from shared.services.print_status import format_receipt_80mm, create_print_job, confirm_print, mark_printed
                user = await _user_ol_kesh(uid)
                dokon = (user.get("dokon_nomi","") or "") if user else ""
                d = dict(natija)
                d.setdefault("amal", "chiqim")
                receipt = format_receipt_80mm(d, dokon)
                job = create_print_job(uid, "sotuv_chek", receipt, 80, {"klient": natija.get("klient","")})
                confirm_print(job.job_id)
                mark_printed(job.job_id)
                ctx.user_data["last_print_job"] = job.job_id
                await update.message.reply_text(
                    f"🖨️ *CHEK CHOP ETILDI*\n"
                    f"📋 Job: `{job.job_id[-8:]}`\n```\n{receipt}\n```",
                    parse_mode=ParseMode.MARKDOWN)
            else:
                await update.message.reply_text("❌ Chek uchun ma'lumot yo'q.")
        elif sub == "reprint":
            job_id = ctx.user_data.get("last_print_job")
            if job_id:
                from shared.services.print_status import request_reprint, job_status_text
                new_job = request_reprint(job_id)
                if new_job:
                    await update.message.reply_text(
                        f"🔄 *QAYTA CHOP*\n{job_status_text(new_job)}",
                        parse_mode=ParseMode.MARKDOWN)
                else:
                    await update.message.reply_text("❌ Qayta chop qilib bo'lmadi.")
            else:
                await update.message.reply_text("❌ Oldingi chek topilmadi.")
    elif action == "export":
        await update.message.reply_text(
            "📤 *EXPORT*\n\nOvoz yuboring:\n"
            "_\"PDF chiqar\"_ yoki _\"Excel chiqar\"_\n\n"
            "Yoki /hisobot → PDF/Excel tugmalari",
            parse_mode=ParseMode.MARKDOWN)
    elif action == "balans":
        await cmd_balans(update, ctx)

    elif action == "help":
        await cmd_yordam(update, ctx)
    elif action == "news":
        await cmd_yangilik(update, ctx)
    elif action == "menu":
        await update.message.reply_text("📋 Asosiy menyu:", reply_markup=_get_asosiy_menyu()())
    elif action == "greet":
        user = await _user_ol_kesh(uid)
        ism = user.get("to_liq_ism") or user.get("ism", "") if user else ""
        await update.message.reply_text(
            f"👋 Salom{', ' + ism if ism else ''}! Ovoz yuboring yoki menyu tanlang 👇",
            reply_markup=_get_asosiy_menyu()())
    elif action == "document":
        if sub == "nakladnoy":
            await _get_cmd_nakladnoy()(update, ctx)
        elif sub == "invoice":
            await cmd_faktura(update, ctx)
    elif action == "client":
        await update.message.reply_text(
            "👥 Klient qidirish:\n/klient <ism> — ism yoki telefon bo'yicha")
    elif action == "product":
        if sub == "stock_check":
            # AI ga yuborish — tovar nomi kerak
            await _get_qayta_ishlash()(update, ctx, cmd["original"])
        else:
            await update.message.reply_text(
                "📦 /menyu → Tovarlar yoki ovoz bilan:\n_\"Ariel qoldig'i qancha?\"_",
                parse_mode=ParseMode.MARKDOWN)
    elif action == "ledger":
        if sub == "balance":
            await cmd_balans(update, ctx)
        elif sub == "journal":
            await cmd_jurnal(update, ctx)
    elif action == "correct":
        await update.message.reply_text(
            "✏️ Tuzatish uchun:\n"
            "Ovoz bilan: _\"3 ta Arielni olib tashla\"_\n"
            "Yoki: _\"Qayta hisobla\"_",
            parse_mode=ParseMode.MARKDOWN)
    elif action == "recalculate":
        natija = ctx.user_data.get("kutilayotgan")
        if natija:
            await update.message.reply_text("🔄 Qayta hisoblanmoqda...")
            await _get_qayta_ishlash()(update, ctx, cmd["original"])
        else:
            await update.message.reply_text("❌ Qayta hisoblash uchun draft yo'q.")


# ═══ ILOVANI_QUR DAN KO'CHIRILGAN INLINE FUNKSIYALAR ═══

async def cmd_ping(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    import time as _pt
    await update.message.reply_text(
        f"🏓 Pong!\n"
        f"📱 UID: {update.effective_user.id}\n"
        f"🤖 Bot: v{_get_version()}\n"
        f"⏰ {_pt.strftime('%H:%M:%S')}")


async def cmd_token(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    _jwt_secret = cfg().jwt_secret
    if not _jwt_secret:
        await update.message.reply_text(
            "⚠️ Token xizmati hozircha mavjud emas\\.\n"
            "Admin JWT\\_SECRET ni sozlashi kerak\\.",
            parse_mode=ParseMode.MARKDOWN_V2)
        return
    # Foydalanuvchi ro'yxatdan o'tganini tekshirish
    import services.bot.db as _tdb
    u = await _tdb.user_ol(uid)
    if not u or not u.get("faol", False):
        await update.message.reply_text(
            "❌ Avval /start buyrug'i bilan ro'yxatdan o'ting\\.",
            parse_mode=ParseMode.MARKDOWN_V2)
        return
    # JWT yaratish (API bilan bir xil format)
    import json as _tj
    import time as _tt
    import hmac as _th
    import base64 as _tb
    import hashlib as _thl
    h64 = _tb.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    payload = _tj.dumps({"sub": str(uid), "exp": int(_tt.time()) + 86400})
    p64 = _tb.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()
    sig = _tb.urlsafe_b64encode(
        _th.new(_jwt_secret.encode(), f"{h64}.{p64}".encode(), _thl.sha256).digest()
    ).rstrip(b"=").decode()
    token = f"{h64}.{p64}.{sig}"
    # Tokenni foydalanuvchiga yuborish
    await update.message.reply_text(
        f"🔑 *Web panel uchun token:*\n\n"
        f"`{esc(token)}`\n\n"
        f"📋 Nusxa oling va web panelga kirish uchun ishlating\\.\n"
        f"⏰ Token 24 soat amal qiladi\\.",
        parse_mode=ParseMode.MARKDOWN_V2)


async def cmd_webapp(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    from telegram import WebAppInfo
    web_url = _os.getenv("WEB_URL", "https://savdoai-web-production.up.railway.app")
    tg_url = f"{web_url}/tg"
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("📱 SavdoAI ochish", web_app=WebAppInfo(url=tg_url))],
    ])
    await update.message.reply_text(
        "📱 *SavdoAI Mini App*\n\n"
        "Quyidagi tugmani bosing \\— to'g'ridan\\-to'g'ri Telegram ichida ochiladi\\.\n"
        "Login/parol kerak emas\\!",
        parse_mode=ParseMode.MARKDOWN_V2,
        reply_markup=kb,
    )


async def cmd_parol(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return

    matn = (update.message.text or "").strip()
    qismlar = matn.split()
    # /parol <user_id> <login> <parol>
    # /parol <user_id> <parol>  (loginsiz, faqat parol)
    if len(qismlar) < 3:
        await update.message.reply_text(
            "🔐 *Do'konchiga login/parol berish*\n\n"
            "Format:\n"
            "`/parol <user_id> <login> <parol>`\n\n"
            "Masalan:\n"
            "`/parol 123456789 salimov 1234`\n"
            "`/parol 123456789 s1234`  _(loginsiz)_\n\n"
            "User ID ni bilish uchun do'konchi botga /start bossin\\.",
            parse_mode=ParseMode.MARKDOWN_V2)
        return

    try:
        target_id = int(qismlar[1])
    except ValueError:
        await update.message.reply_text("❌ User ID raqam bo'lishi kerak.")
        return

    if len(qismlar) >= 4:
        new_login = qismlar[2]
        new_parol = qismlar[3]
    else:
        new_login = ""
        new_parol = qismlar[2]

    if len(new_parol) < 4:
        await update.message.reply_text("❌ Parol kamida 4 belgi bo'lishi kerak.")
        return

    try:
        import hashlib as _ph
        import os as _po
        salt = _po.urandom(16).hex()
        hashed = f"{salt}:{_ph.pbkdf2_hmac('sha256', new_parol.encode(), salt.encode(), 100_000).hex()}"

        async with db._P().acquire() as c:
            user = await c.fetchrow("SELECT id, ism, telefon FROM users WHERE id=$1", target_id)
            if not user:
                await update.message.reply_text(f"❌ User ID {target_id} topilmadi.")
                return

            if new_login:
                existing = await c.fetchrow(
                    "SELECT id FROM users WHERE lower(login)=$1 AND id!=$2",
                    new_login.lower(), target_id,
                )
                if existing:
                    await update.message.reply_text(f"❌ '{new_login}' login allaqachon band.")
                    return
                await c.execute(
                    "UPDATE users SET login=$1, parol_hash=$2, yangilangan=NOW() WHERE id=$3",
                    new_login, hashed, target_id,
                )
            else:
                await c.execute(
                    "UPDATE users SET parol_hash=$1, yangilangan=NOW() WHERE id=$2",
                    hashed, target_id,
                )

        ism = user.get("ism", "")
        tel = user.get("telefon", "")
        msg = "✅ *Parol o'rnatildi\\!*\n\n"
        msg += f"👤 {esc(ism or str(target_id))}\n"
        if new_login:
            msg += f"🔑 Login: `{esc(new_login)}`\n"
        if tel:
            msg += f"📱 Telefon: `{esc(tel)}`\n"
        msg += f"🔒 Parol: `{esc(new_parol)}`\n\n"
        msg += "Web panel: login yoki telefon \\+ parol bilan kiradi\\."
        await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN_V2)
    except Exception as e:
        log.error("cmd_parol: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def inline_qidirish(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """@savdoai_mashrab_bot <so'z> → klient/tovar qidiruv"""
    query = (update.inline_query.query or "").strip()
    uid = update.effective_user.id
    if len(query) < 2:
        return
    results = []
    try:
        # Klientlar
        klientlar = await db.klient_qidirish(uid, query)
        for i, k in enumerate(klientlar[:5]):
            ism = k.get("ism","")
            tel = k.get("telefon","")
            jami = k.get("jami_sotib",0)
            results.append(InlineQueryResultArticle(
                id=f"kl_{i}",
                title=f"👤 {ism}",
                description=f"📞 {tel}  |  💰 {pul(jami)} so'm",
                input_message_content=InputTextMessageContent(
                    f"👤 *{ism}*\n📞 {tel}\n💰 Jami sotib: {pul(jami)} so'm",
                    parse_mode="Markdown")
            ))
        # Tovarlar
        tovarlar_r = await db.tovarlar_ol(uid)
        qidiruv = query.lower()
        for i, t in enumerate(tovarlar_r or []):
            if qidiruv in (t.get("nomi","")).lower():
                results.append(InlineQueryResultArticle(
                    id=f"tv_{i}",
                    title=f"📦 {t['nomi']}",
                    description=f"Qoldiq: {t.get('qoldiq',0)} | Narx: {pul(t.get('sotish_narxi',0))}",
                    input_message_content=InputTextMessageContent(
                        f"📦 *{t['nomi']}*\n📊 Qoldiq: {t.get('qoldiq',0)}\n💰 Narx: {pul(t.get('sotish_narxi',0))} so'm",
                        parse_mode="Markdown")
                ))
                if len(results) >= 10:
                    break
    except Exception as e:
        log.debug("inline: %s", e)
    await update.inline_query.answer(results[:10], cache_time=10)



# ═══ YANGI BUYRUQLAR v25.3.2 ═══

async def cmd_narx_tavsiya(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """AI narx tavsiyasi — foyda optimizatsiya."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    msg = await update.message.reply_text("🧠 AI narx tahlil qilmoqda...")

    try:
        from shared.services.ai_narx_tavsiya import narx_tavsiyalar
        async with db._P().acquire() as c:
            tavsiyalar = await narx_tavsiyalar(c, uid, limit=10)

        if not tavsiyalar:
            await msg.edit_text(
                "✅ Barcha narxlar optimal!\n"
                "Hozircha o'zgartirish kerak emas."
            )
            return

        jami_foyda = sum(t["kutilgan_foyda_oshishi"] for t in tavsiyalar)

        parts = [
            f"🧠 *AI NARX TAVSIYASI*\n"
            f"📊 {len(tavsiyalar)} ta tovar uchun tavsiya:\n"
            f"💰 Kutilgan qo'shimcha foyda: *{pul(jami_foyda)}* so'm/oy\n"
        ]

        for i, t in enumerate(tavsiyalar[:7], 1):
            parts.append(
                f"\n*{i}. {t['nomi']}*\n"
                f"  Hozir: {pul(t['joriy_narx'])} → Tavsiya: *{pul(t['tavsiya_narx'])}*\n"
                f"  {t['sabab']}"
            )

        if len(tavsiyalar) > 7:
            parts.append(f"\n... va {len(tavsiyalar) - 7} ta boshqa")

        parts.append("\n\n💡 Narxni o'zgartirish: /narx")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("narx_tavsiya: %s", e, exc_info=True)
        await msg.edit_text("❌ Tahlil xatosi.")


async def cmd_dokon(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Mini-do'kon havolasini olish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    import os as _dos
    web_url = _dos.getenv("WEB_URL", "https://savdoai-web-production.up.railway.app")
    link = f"{web_url}/shop/{uid}"
    await update.message.reply_text(
        f"🏪 *Sizning mini\\-do'koningiz:*\n\n"
        f"`{link}`\n\n"
        f"Bu havolani klientlaringizga yuboring\\.\n"
        f"Ular tovar ko'rib, buyurtma bera oladi\\.\n"
        f"Buyurtma kelganda sizga xabar keladi\\.",
        parse_mode=ParseMode.MARKDOWN_V2,
    )


# ═══ v25.3.3 — CRM + CHEGIRMA + PROGNOZ + RAQOBAT ═══

async def cmd_crm(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Klient CRM — profil va tarix."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split(maxsplit=1)

    if len(qismlar) < 2:
        await update.message.reply_text(
            "👤 *Klient CRM*\n\n"
            "Klient haqida to'liq ma'lumot:\n"
            "`/crm Anvar aka`\n\n"
            "Izoh qo'shish:\n"
            "`/crm Anvar aka | Meva savdosi, bozor 3-qator`\n\n"
            "Tug'ilgan kun:\n"
            "`/crm Anvar aka | tug: 1990-05-15`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return

    klient_ism = qismlar[1].split("|")[0].strip()

    try:
        from shared.utils import like_escape
        async with db._P().acquire() as c:
            klient = await c.fetchrow(
                "SELECT id, ism, telefon FROM klientlar "
                "WHERE user_id=$1 AND LOWER(ism) LIKE LOWER($2) LIMIT 1",
                uid, f"%{like_escape(klient_ism)}%",
            )
            if not klient:
                await update.message.reply_text(f"❌ '{klient_ism}' topilmadi.")
                return

            # Izoh yoki tug'ilgan kun yangilash
            if "|" in qismlar[1]:
                izoh_qism = qismlar[1].split("|", 1)[1].strip()
                from shared.services.klient_crm import klient_izoh_yangilash
                from datetime import date as _date
                if izoh_qism.startswith("tug:"):
                    try:
                        tug = _date.fromisoformat(izoh_qism[4:].strip())
                        await klient_izoh_yangilash(c, uid, klient["id"], tugilgan_kun=tug)
                        await update.message.reply_text(f"✅ {klient['ism']} tug'ilgan kun: {tug}")
                    except ValueError:
                        await update.message.reply_text("❌ Sana formati: YYYY-MM-DD")
                    return
                else:
                    await klient_izoh_yangilash(c, uid, klient["id"], izoh=izoh_qism)
                    await update.message.reply_text(f"✅ {klient['ism']} izoh yangilandi")
                    return

            # Profil ko'rsatish
            from shared.services.klient_crm import klient_profil, klient_tarix
            profil = await klient_profil(c, uid, klient["id"])
            if not profil:
                await update.message.reply_text("❌ Profil topilmadi")
                return

            tarix = await klient_tarix(c, uid, klient["id"], limit=5)

        parts = [
            f"👤 *{profil['ism']}*",
            f"📞 {profil.get('telefon', '-')}",
        ]
        if profil.get("tugilgan_kun"):
            parts.append(f"🎂 {profil['tugilgan_kun']}")
        if profil.get("izoh"):
            parts.append(f"📝 {profil['izoh']}")
        parts.append(f"🏷 Kategoriya: {profil.get('kategoriya', 'oddiy')}")
        parts.append(f"💰 Jami xarid: {pul(profil.get('jami_xaridlar', 0))} so'm")
        parts.append(f"🛒 Xarid soni: {profil.get('xarid_soni', 0)}")
        if profil.get("joriy_qarz", 0) > 0:
            parts.append(f"💸 Joriy qarz: {pul(profil['joriy_qarz'])} so'm")
        if profil.get("oxirgi_sotuv"):
            parts.append(f"📅 Oxirgi: {str(profil['oxirgi_sotuv'])[:10]}")

        if tarix:
            parts.append(f"\n📋 *Oxirgi {len(tarix)} ta sotuv:*")
            for t in tarix:
                parts.append(f"  • {str(t['sana'])[:10]} — {pul(t.get('jami', 0) or t.get('jami_summa', 0))}")

        await update.message.reply_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("crm: %s", e, exc_info=True)
        await update.message.reply_text("❌ CRM xatosi.")


async def cmd_chegirma(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Chegirma qoidalarini boshqarish."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()

    if matn == "/chegirma":
        # Mavjud qoidalar
        try:
            from shared.services.chegirma import chegirma_qoidalar_olish
            async with db._P().acquire() as c:
                qoidalar = await chegirma_qoidalar_olish(c, uid)

            if not qoidalar:
                await update.message.reply_text(
                    "📋 Chegirma qoidalari yo'q.\n\n"
                    "Qo'shish: `/chegirma VIP 10% min:5000000`\n"
                    "_(nomi foiz/summa min_xarid)_",
                    parse_mode=ParseMode.MARKDOWN,
                )
                return

            parts = ["📋 *Chegirma qoidalari:*\n"]
            for q in qoidalar:
                status = "✅" if q["faol"] else "❌"
                if q["turi"] == "foiz":
                    qiymat = f"{q['qiymat']}%"
                else:
                    qiymat = f"{pul(q['qiymat'])} so'm"
                parts.append(f"{status} *{q['nomi']}* — {qiymat}")
                if q.get("min_xarid", 0) > 0:
                    parts.append(f"    Min xarid: {pul(q['min_xarid'])}")
            await update.message.reply_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)

        except Exception as e:
            log.error("chegirma: %s", e, exc_info=True)
            await update.message.reply_text("❌ Xato.")
        return

    # Yangi qoida: /chegirma VIP 10% min:5000000
    try:
        parts = matn.replace("/chegirma", "").strip().split()
        if len(parts) < 2:
            await update.message.reply_text("Format: `/chegirma NOM 10%` yoki `/chegirma NOM 50000`",
                                           parse_mode=ParseMode.MARKDOWN)
            return

        nomi = parts[0]
        qiymat_str = parts[1]
        if qiymat_str.endswith("%"):
            turi = "foiz"
            qiymat = float(qiymat_str.rstrip("%"))
        else:
            turi = "summa"
            qiymat = float(qiymat_str)

        min_xarid = 0
        for p in parts[2:]:
            if p.startswith("min:"):
                min_xarid = float(p[4:])

        from shared.services.chegirma import chegirma_qoida_yaratish
        async with db._P().acquire() as c:
            qid = await chegirma_qoida_yaratish(c, uid, nomi, turi, qiymat, min_xarid)

        chegirma_text = f"{qiymat}%" if turi == "foiz" else f"{pul(qiymat)} so'm"
        await update.message.reply_text(
            f"✅ Chegirma qoidasi yaratildi!\n\n"
            f"📋 {nomi} — {chegirma_text}\n"
            f"🆔 ID: {qid}",
        )

    except Exception as e:
        log.error("chegirma yaratish: %s", e, exc_info=True)
        await update.message.reply_text("❌ Format xato. `/chegirma VIP 10%`", parse_mode=ParseMode.MARKDOWN)


async def cmd_prognoz(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Moliyaviy prognoz — kelasi oy bashorat."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    msg = await update.message.reply_text("📊 Prognoz hisoblanmoqda...")

    try:
        from shared.services.moliyaviy_prognoz import moliyaviy_prognoz
        async with db._P().acquire() as c:
            data = await moliyaviy_prognoz(c, uid)

        prognoz = data.get("prognoz", {})
        oylar = data.get("oylar", [])
        tavsiyalar = data.get("tavsiyalar", [])

        if not oylar:
            await msg.edit_text("📊 Prognoz uchun kamida 2 oy ma'lumot kerak.")
            return

        parts = ["📊 *MOLIYAVIY PROGNOZ*\n"]

        # Oxirgi oylar
        parts.append("*Oxirgi oylar:*")
        for o in oylar[-3:]:
            parts.append(f"  {o['oy']}: sotuv {pul(o['sotuv'])} | foyda {pul(o['foyda'])}")
        parts.append("")

        # Prognoz
        osish = prognoz.get("osish_foiz", 0)
        trend = "📈" if osish > 0 else "📉" if osish < 0 else "➡️"
        parts.append("*Kelasi oy prognoz:*")
        parts.append(f"  {trend} Sotuv: ~{pul(prognoz.get('sotuv', 0))} ({osish:+.1f}%)")
        parts.append(f"  💰 Foyda: ~{pul(prognoz.get('foyda', 0))}")
        parts.append(f"  💸 Xarajat: ~{pul(prognoz.get('xarajat', 0))}")
        parts.append("")

        # Tavsiyalar
        if tavsiyalar:
            parts.append("*Tavsiyalar:*")
            for t in tavsiyalar:
                parts.append(f"  {t}")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("prognoz: %s", e, exc_info=True)
        await msg.edit_text("❌ Prognoz xatosi.")


async def cmd_rfm(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """RFM segmentatsiya — SalesDoc-style. Klientlarni 5 segmentga ajratadi:
    Champions / Loyal / Potential / At Risk / Lost.
    R=oxirgi xarid qachon, F=necha marta, M=qancha pul.
    """
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    msg = await update.message.reply_text("📊 RFM segmentatsiya hisoblanmoqda...")

    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT k.id, k.ism,
                       COUNT(ss.id)               AS freq,
                       COALESCE(SUM(ss.jami), 0)  AS monetary,
                       MAX(ss.sana)               AS oxirgi,
                       COALESCE(SUM(ss.qarz), 0)  AS qarz
                FROM klientlar k
                LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id = k.id
                WHERE k.user_id = $1
                GROUP BY k.id, k.ism
                HAVING COUNT(ss.id) > 0
                ORDER BY monetary DESC
            """, uid)

        if not rows:
            await msg.edit_text("📊 RFM uchun klientlar topilmadi.")
            return

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)

        clients = []
        for r in rows:
            oxirgi = r["oxirgi"]
            days   = max(1, (now - oxirgi).days) if oxirgi else 999
            clients.append({
                "id":       r["id"],
                "ism":      r["ism"],
                "recency":  days,
                "freq":     int(r["freq"]),
                "monetary": float(r["monetary"]),
                "qarz":     float(r["qarz"]),
            })

        # Score 1-5 quintiles
        def quintile_score(vals: list, reverse: bool = False) -> dict:
            if not vals:
                return {}
            sorted_v = sorted(vals, reverse=reverse)
            n = len(sorted_v)
            result = {}
            for i, v in enumerate(sorted_v):
                # Kvintil (1..5)
                result[v] = min(5, max(1, int(5 * (i + 1) / n + 0.0001)))
            return result

        r_map = quintile_score([c["recency"]  for c in clients], reverse=True)
        f_map = quintile_score([c["freq"]     for c in clients])
        m_map = quintile_score([c["monetary"] for c in clients])

        segments = {"Champions": [], "Loyal": [], "Potential": [], "At Risk": [], "Lost": []}
        for c in clients:
            r = r_map[c["recency"]]
            f = f_map[c["freq"]]
            m = m_map[c["monetary"]]
            c["R"], c["F"], c["M"] = r, f, m
            score = r + f + m
            if score >= 13:   seg = "Champions"
            elif score >= 10: seg = "Loyal"
            elif score >= 7:  seg = "Potential"
            elif score >= 5:  seg = "At Risk"
            else:             seg = "Lost"
            segments[seg].append(c)

        icons = {"Champions": "🏆", "Loyal": "💚", "Potential": "🌱",
                 "At Risk": "⚠️", "Lost": "💀"}
        tavsiyalar = {
            "Champions": "VIP — shaxsiy hurmat, maxsus takliflar",
            "Loyal":     "Obunaga taklif qiling, bonus bering",
            "Potential": "Chegirma bering, faollashtiring",
            "At Risk":   "Qo'ng'iroq qiling, yo'qotmang",
            "Lost":      "Yangi ofer yoki unuting",
        }

        parts = ["📊 *RFM SEGMENTATSIYA*\n━━━━━━━━━━━━━━━━━━━━"]
        parts.append(f"👥 Jami klient: *{len(clients)}*\n")

        for seg_name in ["Champions", "Loyal", "Potential", "At Risk", "Lost"]:
            segc = segments[seg_name]
            if not segc:
                continue
            segc.sort(key=lambda c: -c["monetary"])
            parts.append(f"{icons[seg_name]} *{seg_name}* — {len(segc)} ta")
            parts.append(f"  _{tavsiyalar[seg_name]}_")
            for c in segc[:5]:
                parts.append(
                    f"  • {c['ism'][:18]} · R{c['R']}F{c['F']}M{c['M']} · "
                    f"{pul(c['monetary'])} · {c['recency']}k"
                )
            if len(segc) > 5:
                parts.append(f"  … +{len(segc) - 5} ta yana")
            parts.append("")

        parts.append("_R=Recency · F=Frequency · M=Monetary (1=past, 5=yuqori)_")

        matn = "\n".join(parts)
        if len(matn) > 4000:
            matn = matn[:3990] + "\n..."
        await msg.edit_text(matn, parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("rfm: %s", e, exc_info=True)
        await msg.edit_text(f"❌ RFM xatosi: {e}")


async def cmd_zayavkalar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/zayavkalar — Yangi/tasdiqlangan/otgruzka holatlari bo'yicha buyurtmalar."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT holat,
                       COUNT(*) AS soni,
                       COALESCE(SUM(jami), 0) AS jami
                FROM sotuv_sessiyalar
                WHERE user_id = $1
                GROUP BY holat
            """, uid)

            pending = await c.fetch("""
                SELECT ss.id, ss.klient_ismi, ss.jami, ss.holat, ss.sana,
                       COALESCE(k.telefon, '') AS telefon
                FROM sotuv_sessiyalar ss
                LEFT JOIN klientlar k ON k.id = ss.klient_id
                WHERE ss.user_id = $1 AND ss.holat IN ('yangi', 'tasdiqlangan', 'otgruzka')
                ORDER BY ss.sana DESC
                LIMIT 20
            """, uid)

        meta = {
            "yangi":        ("🔵", "Yangi"),
            "tasdiqlangan": ("🟡", "Tasdiqlangan"),
            "otgruzka":     ("🟣", "Otgruzka"),
            "yetkazildi":   ("🟢", "Yetkazildi"),
            "bekor":        ("🔴", "Bekor"),
        }

        parts = ["📋 *ZAYAVKALAR HOLATI*\n━━━━━━━━━━━━━━━━━━"]
        for r in rows:
            emoji, label = meta.get(r["holat"], ("⚪", r["holat"]))
            parts.append(f"{emoji} {label}: *{r['soni']}* ta · {pul(r['jami'])}")

        if pending:
            parts.append("\n━━━━━━━━━━━━━━━━━━")
            parts.append("*Pending zayavkalar:*")
            for p in pending[:12]:
                emoji, _ = meta.get(p["holat"], ("⚪", ""))
                tel = f" · {p['telefon']}" if p["telefon"] else ""
                parts.append(
                    f"{emoji} #{p['id']} *{p['klient_ismi'] or 'Mijoz'}*{tel}\n"
                    f"   {pul(p['jami'])}"
                )

        parts.append("\n💡 Web panel /orders da batafsil boshqarish")
        text = "\n".join(parts)
        if len(text) > 4000:
            text = text[:3990] + "..."
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("zayavkalar: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_otgruzka(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/otgruzka <id> — Zayavkani otgruzka holatiga o'tkazish."""
    if not await faol_tekshir(update):
        return
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "📦 *Otgruzka*\n\n"
            "Ishlatilishi: `/otgruzka <sotuv_id>`\n"
            "Masalan: `/otgruzka 42`\n\n"
            "Bu zayavkani 'otgruzka' (jo'natilmoqda) holatiga o'tkazadi.",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    sess_id = int(parts[1])
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            sess = await c.fetchrow(
                "SELECT id, holat, klient_ismi, jami FROM sotuv_sessiyalar "
                "WHERE id=$1 AND user_id=$2", sess_id, uid
            )
            if not sess:
                await update.message.reply_text(f"❌ Sotuv #{sess_id} topilmadi.")
                return
            await c.execute("""
                UPDATE sotuv_sessiyalar
                SET holat = 'otgruzka', otgruzka_vaqti = NOW(),
                    holat_yangilangan = NOW()
                WHERE id = $1 AND user_id = $2
            """, sess_id, uid)
        await update.message.reply_text(
            f"📦 Sotuv #{sess_id} *otgruzka* holatiga o'tkazildi.\n"
            f"Mijoz: {sess['klient_ismi'] or 'Mijoz'}\n"
            f"Summa: {pul(sess['jami'])}",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        log.error("otgruzka: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_yetkazildi(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/yetkazildi <id> — Zayavkani yetkazildi holatiga o'tkazish."""
    if not await faol_tekshir(update):
        return
    text = update.message.text or ""
    parts = text.split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "✅ *Yetkazildi*\n\n"
            "Ishlatilishi: `/yetkazildi <sotuv_id>`\n"
            "Masalan: `/yetkazildi 42`\n\n"
            "Bu zayavkani 'yetkazildi' holatiga o'tkazadi.",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    sess_id = int(parts[1])
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            sess = await c.fetchrow(
                "SELECT id, holat, klient_ismi, jami FROM sotuv_sessiyalar "
                "WHERE id=$1 AND user_id=$2", sess_id, uid
            )
            if not sess:
                await update.message.reply_text(f"❌ Sotuv #{sess_id} topilmadi.")
                return
            await c.execute("""
                UPDATE sotuv_sessiyalar
                SET holat = 'yetkazildi', yetkazildi_vaqti = NOW(),
                    holat_yangilangan = NOW()
                WHERE id = $1 AND user_id = $2
            """, sess_id, uid)
        await update.message.reply_text(
            f"✅ Sotuv #{sess_id} *yetkazildi* holatiga o'tkazildi.\n"
            f"Mijoz: {sess['klient_ismi'] or 'Mijoz'}\n"
            f"Summa: {pul(sess['jami'])}",
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        log.error("yetkazildi: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_sotuv_detail(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/sotuv <id> — Bitta sotuv tafsiloti (tovarlar, holat, sana)."""
    if not await faol_tekshir(update):
        return
    text = update.message.text or ""
    args = text.split()
    if len(args) < 2 or not args[1].isdigit():
        await update.message.reply_text(
            "📋 *Sotuv tafsiloti*\n\n"
            "Ishlatilishi: `/sotuv <id>`\n"
            "Masalan: `/sotuv 42`",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    sess_id = int(args[1])
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            sess = await c.fetchrow("""
                SELECT ss.id, ss.klient_ismi, ss.jami, ss.tolangan, ss.qarz,
                       ss.holat, ss.izoh, ss.sana, ss.otgruzka_vaqti,
                       ss.yetkazildi_vaqti, ss.bekor_vaqti, ss.bekor_sabab,
                       COALESCE(k.telefon, '') AS telefon,
                       COALESCE(k.manzil, '')  AS manzil
                FROM sotuv_sessiyalar ss
                LEFT JOIN klientlar k ON k.id = ss.klient_id
                WHERE ss.id = $1 AND ss.user_id = $2
            """, sess_id, uid)
            if not sess:
                await update.message.reply_text(f"❌ Sotuv #{sess_id} topilmadi.")
                return
            tovarlar = await c.fetch("""
                SELECT tovar_nomi, miqdor, birlik, sotish_narxi, jami
                FROM chiqimlar WHERE sessiya_id = $1 ORDER BY id
            """, sess_id)

        holat_emoji = {
            "yangi": "🔵", "tasdiqlangan": "🟡", "otgruzka": "🟣",
            "yetkazildi": "🟢", "bekor": "🔴"
        }.get(sess["holat"], "⚪")

        parts = [
            f"📋 *SOTUV #{sess_id}*",
            "━━━━━━━━━━━━━━━━━━",
            f"{holat_emoji} Holat: *{sess['holat'].upper()}*",
            f"👤 Mijoz: *{sess['klient_ismi'] or 'Mijoz'}*",
        ]
        if sess["telefon"]:
            parts.append(f"📞 {sess['telefon']}")
        if sess["manzil"]:
            parts.append(f"📍 {sess['manzil']}")
        parts.append(f"📅 {sess['sana'].strftime('%d.%m.%Y %H:%M')}")
        parts.append("")

        if tovarlar:
            parts.append(f"*Tovarlar ({len(tovarlar)} ta):*")
            for t in tovarlar[:15]:
                parts.append(
                    f"  • {t['tovar_nomi'][:25]}\n"
                    f"    {float(t['miqdor']):.0f} {t['birlik']} × {pul(t['sotish_narxi'])} = {pul(t['jami'])}"
                )
            if len(tovarlar) > 15:
                parts.append(f"  _+{len(tovarlar) - 15} ta yana_")

        parts.append("")
        parts.append(f"💰 JAMI: *{pul(sess['jami'])}*")
        parts.append(f"✅ To'landi: {pul(sess['tolangan'])}")
        if float(sess['qarz']) > 0:
            parts.append(f"⚠️ Qarz: *{pul(sess['qarz'])}*")

        if sess["bekor_sabab"]:
            parts.append(f"\n_Bekor sabab: {sess['bekor_sabab']}_")
        if sess["izoh"]:
            parts.append(f"\n📝 {sess['izoh']}")

        text = "\n".join(parts)
        if len(text) > 4000:
            text = text[:3990] + "..."
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("sotuv_detail: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_bekor_sotuv(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/bekor_sotuv <id> [sabab] — Sotuvni bekor qilish + qoldiqni qaytarish."""
    if not await faol_tekshir(update):
        return
    text = update.message.text or ""
    parts = text.split(maxsplit=2)
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text(
            "❌ *Bekor qilish*\n\n"
            "Ishlatilishi: `/bekor_sotuv <id> [sabab]`\n"
            "Masalan: `/bekor_sotuv 42 Mijoz rad etdi`\n\n"
            "Bu zayavkani bekor qiladi va tovar qoldiqlarini qaytaradi.",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    sess_id = int(parts[1])
    sabab = parts[2] if len(parts) > 2 else ""
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            async with c.transaction():
                sess = await c.fetchrow(
                    "SELECT id, holat, klient_ismi, jami FROM sotuv_sessiyalar "
                    "WHERE id=$1 AND user_id=$2", sess_id, uid
                )
                if not sess:
                    await update.message.reply_text(f"❌ Sotuv #{sess_id} topilmadi.")
                    return
                if sess["holat"] == "bekor":
                    await update.message.reply_text(f"⚠️ Sotuv #{sess_id} allaqachon bekor qilingan.")
                    return

                # Qoldiqni qaytarish
                chiqimlar = await c.fetch(
                    "SELECT tovar_id, miqdor FROM chiqimlar WHERE sessiya_id=$1 AND tovar_id IS NOT NULL",
                    sess_id
                )
                for ch in chiqimlar:
                    await c.execute(
                        "UPDATE tovarlar SET qoldiq = qoldiq + $1 WHERE id=$2 AND user_id=$3",
                        ch["miqdor"], ch["tovar_id"], uid
                    )

                await c.execute("""
                    UPDATE sotuv_sessiyalar
                    SET holat = 'bekor', bekor_vaqti = NOW(),
                        bekor_sabab = $1, holat_yangilangan = NOW()
                    WHERE id = $2 AND user_id = $3
                """, sabab or None, sess_id, uid)

        await update.message.reply_text(
            f"🔴 Sotuv #{sess_id} bekor qilindi.\n"
            f"Mijoz: {sess['klient_ismi'] or 'Mijoz'}\n"
            f"Summa: {pul(sess['jami'])}\n"
            f"Qaytarildi: {len(chiqimlar)} ta tovar qoldig'i\n"
            + (f"Sabab: _{sabab}_" if sabab else ""),
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception as e:
        log.error("bekor_sotuv: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_sotuv_today(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/sotuv_today — Bugungi barcha sotuvlar tafsiloti."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT ss.id, ss.klient_ismi, ss.jami, ss.tolangan, ss.qarz, ss.sana,
                       COUNT(ch.id) AS tovar_soni
                FROM sotuv_sessiyalar ss
                LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
                WHERE ss.user_id = $1
                  AND (ss.sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
                GROUP BY ss.id
                ORDER BY ss.sana DESC
            """, uid)

        if not rows:
            await update.message.reply_text("📋 Bugun hali sotuv yo'q.")
            return

        jami_summa = sum(float(r["jami"]) for r in rows)
        jami_tolangan = sum(float(r["tolangan"]) for r in rows)
        jami_qarz = sum(float(r["qarz"]) for r in rows)

        parts = [f"📋 *BUGUNGI SOTUVLAR* ({len(rows)} ta)\n━━━━━━━━━━━━━━━━━━"]
        for r in rows[:15]:
            vaqt = r["sana"].strftime("%H:%M") if r["sana"] else ""
            parts.append(
                f"`{vaqt}` *{(r['klient_ismi'] or 'Mijoz')[:20]}*\n"
                f"   {r['tovar_soni']} ta · {pul(r['jami'])}"
                + (f" · ⚠️ {pul(r['qarz'])}" if float(r["qarz"]) > 0 else "")
            )

        if len(rows) > 15:
            parts.append(f"\n_...va yana {len(rows) - 15} ta sotuv_")

        parts.append("\n━━━━━━━━━━━━━━━━━━")
        parts.append(f"💰 Jami: *{pul(jami_summa)}*")
        parts.append(f"✅ To'langan: *{pul(jami_tolangan)}*")
        if jami_qarz > 0:
            parts.append(f"⚠️ Qarz: *{pul(jami_qarz)}*")

        text = "\n".join(parts)
        if len(text) > 4000:
            text = text[:3990] + "..."
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("sotuv_today: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_kirim_today(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/kirim_today — Bugungi kirimlar (postuplenie)."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT id, tovar_nomi, miqdor, birlik, narx, jami, manba, sana
                FROM kirimlar
                WHERE user_id = $1
                  AND (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
                ORDER BY sana DESC
            """, uid)

        if not rows:
            await update.message.reply_text("📥 Bugun hali kirim yo'q.")
            return

        jami = sum(float(r["jami"]) for r in rows)
        parts = [f"📥 *BUGUNGI KIRIMLAR* ({len(rows)} ta)\n━━━━━━━━━━━━━━━━━━"]
        for r in rows[:15]:
            vaqt = r["sana"].strftime("%H:%M") if r["sana"] else ""
            parts.append(
                f"`{vaqt}` *{r['tovar_nomi'][:25]}*\n"
                f"   {float(r['miqdor']):.0f} {r['birlik']} × {pul(r['narx'])} = *{pul(r['jami'])}*"
                + (f"\n   _{r['manba']}_" if r["manba"] else "")
            )
        if len(rows) > 15:
            parts.append(f"\n_...va yana {len(rows) - 15} ta_")

        parts.append("\n━━━━━━━━━━━━━━━━━━")
        parts.append(f"💵 Jami kirim: *{pul(jami)}*")

        text = "\n".join(parts)
        if len(text) > 4000:
            text = text[:3990] + "..."
        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("kirim_today: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_ombor_qiymati(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/ombor_qiymati — Ombor umumiy qiymati (olish + bozor + foyda prognozi)."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    try:
        async with db._P().acquire() as c:
            row = await c.fetchrow("""
                SELECT
                    COUNT(*)                                    AS jami_tovar,
                    COALESCE(SUM(qoldiq * olish_narxi), 0)      AS ombor_qiymati,
                    COALESCE(SUM(qoldiq * sotish_narxi), 0)     AS bozor_qiymati,
                    COALESCE(SUM(qoldiq), 0)                    AS jami_qoldiq,
                    COUNT(*) FILTER (WHERE qoldiq <= 0)         AS tugagan,
                    COUNT(*) FILTER (WHERE min_qoldiq > 0 AND qoldiq <= min_qoldiq
                                     AND qoldiq > 0)            AS kam
                FROM tovarlar WHERE user_id = $1
            """, uid)

        if not row or row["jami_tovar"] == 0:
            await update.message.reply_text("🏭 Omborda tovar yo'q.")
            return

        ombor  = float(row["ombor_qiymati"] or 0)
        bozor  = float(row["bozor_qiymati"] or 0)
        foyda  = bozor - ombor
        margin = (foyda / ombor * 100) if ombor > 0 else 0

        text = (
            "🏭 *OMBOR QIYMATI*\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            f"📦 Jami tovar: *{row['jami_tovar']} ta*\n"
            f"🔢 Jami qoldiq: *{float(row['jami_qoldiq']):,.0f}*\n\n"
            f"💰 Ombor qiymati: *{pul(ombor)} so'm*\n"
            f"🏷 Bozor qiymati: *{pul(bozor)} so'm*\n"
            f"💹 Potentsial foyda: *{pul(foyda)} so'm* ({margin:.1f}%)\n\n"
            "⚠️ *Ogohlantirishlar:*\n"
            f"  • Tugagan tovar: *{row['tugagan']}* ta\n"
            f"  • Kam qoldiq:    *{row['kam']}* ta\n"
        )
        if row["tugagan"] or row["kam"]:
            text += "\n💡 /prognoz buyrug'i orqali to'liq tahlil oling"

        await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("ombor_qiymati: %s", e, exc_info=True)
        await update.message.reply_text(f"❌ Xato: {e}")


async def cmd_top_tovar(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/top_tovar [kun] — Top 10 eng ko'p sotilayotgan tovarlar.

    Default 30 kun. Daromad, miqdor, foyda bo'yicha sortlangan.
    """
    if not await faol_tekshir(update):
        return

    text = update.message.text or ""
    args = text.replace("/top_tovar", "").strip()
    try:
        kunlar = int(args) if args else 30
    except ValueError:
        kunlar = 30

    uid = update.effective_user.id
    msg = await update.message.reply_text(f"📦 Top tovarlar ({kunlar} kun)...")

    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT ch.tovar_nomi,
                       SUM(ch.miqdor)                               AS miqdor,
                       SUM(ch.jami)                                 AS jami,
                       SUM((ch.sotish_narxi - ch.olish_narxi)
                           * ch.miqdor)                             AS foyda,
                       COUNT(DISTINCT ch.sessiya_id)                AS sotuv_soni
                FROM chiqimlar ch
                WHERE ch.user_id = $1
                  AND ch.sana >= NOW() - make_interval(days => $2)
                GROUP BY ch.tovar_nomi
                ORDER BY jami DESC
                LIMIT 10
            """, uid, kunlar)

        if not rows:
            await msg.edit_text(f"📦 Oxirgi {kunlar} kunda sotuv yo'q.")
            return

        parts = [f"📦 *TOP 10 TOVAR* ({kunlar} kun)\n━━━━━━━━━━━━━━━━━━"]
        for i, r in enumerate(rows, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            parts.append(
                f"{medal} *{r['tovar_nomi'][:30]}*\n"
                f"   {pul(r['jami'])} · {float(r['miqdor']):.0f} dona · "
                f"{r['sotuv_soni']} marta"
            )
            if r['foyda']:
                parts.append(f"   💰 foyda: {pul(r['foyda'])}")

        jami = sum(float(r['jami']) for r in rows)
        jami_foyda = sum(float(r['foyda'] or 0) for r in rows)
        parts.append("━━━━━━━━━━━━━━━━━━")
        parts.append(f"Jami: *{pul(jami)}* · foyda: *{pul(jami_foyda)}*")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_top_tovar: %s", e, exc_info=True)
        await msg.edit_text(f"❌ Xato: {e}")


async def cmd_top_klient(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/top_klient [kun] — Top 10 eng ko'p xarid qilayotgan klientlar."""
    if not await faol_tekshir(update):
        return

    text = update.message.text or ""
    args = text.replace("/top_klient", "").strip()
    try:
        kunlar = int(args) if args else 30
    except ValueError:
        kunlar = 30

    uid = update.effective_user.id
    msg = await update.message.reply_text(f"👥 Top klientlar ({kunlar} kun)...")

    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT COALESCE(k.ism, ss.klient_ismi, 'Mijoz') AS ism,
                       k.telefon,
                       COUNT(*)                                 AS sotuv_soni,
                       SUM(ss.jami)                             AS jami,
                       SUM(ss.qarz)                             AS qarz,
                       MAX(ss.sana)                             AS oxirgi
                FROM sotuv_sessiyalar ss
                LEFT JOIN klientlar k ON k.id = ss.klient_id
                WHERE ss.user_id = $1
                  AND ss.sana >= NOW() - make_interval(days => $2)
                GROUP BY k.ism, ss.klient_ismi, k.telefon
                ORDER BY jami DESC
                LIMIT 10
            """, uid, kunlar)

        if not rows:
            await msg.edit_text(f"👥 Oxirgi {kunlar} kunda klient yo'q.")
            return

        parts = [f"👥 *TOP 10 KLIENT* ({kunlar} kun)\n━━━━━━━━━━━━━━━━━━"]
        for i, r in enumerate(rows, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            parts.append(
                f"{medal} *{r['ism'][:25]}*"
                f"{' ' + r['telefon'] if r['telefon'] else ''}\n"
                f"   {pul(r['jami'])} · {r['sotuv_soni']} ta sotuv"
            )
            if r['qarz'] and float(r['qarz']) > 0:
                parts.append(f"   ⚠️ qarz: {pul(r['qarz'])}")

        jami = sum(float(r['jami']) for r in rows)
        parts.append("━━━━━━━━━━━━━━━━━━")
        parts.append(f"Jami: *{pul(jami)}*")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_top_klient: %s", e, exc_info=True)
        await msg.edit_text(f"❌ Xato: {e}")


async def cmd_kategoriya_stat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/kategoriya — Kategoriyalar bo'yicha sotuv ulushi (30 kun)."""
    if not await faol_tekshir(update):
        return

    uid = update.effective_user.id
    msg = await update.message.reply_text("📊 Kategoriya tahlili...")

    try:
        async with db._P().acquire() as c:
            rows = await c.fetch("""
                SELECT kategoriya,
                       SUM(jami)                 AS jami,
                       SUM(miqdor)               AS miqdor,
                       COUNT(DISTINCT sessiya_id) AS sotuv_soni,
                       SUM((sotish_narxi - olish_narxi) * miqdor) AS foyda
                FROM chiqimlar
                WHERE user_id = $1
                  AND sana >= NOW() - INTERVAL '30 days'
                GROUP BY kategoriya
                ORDER BY jami DESC
            """, uid)

        if not rows:
            await msg.edit_text("📊 30 kunda sotuv yo'q.")
            return

        jami_total = sum(float(r["jami"]) for r in rows) or 1
        parts = ["📊 *KATEGORIYA BO'YICHA* (30 kun)\n━━━━━━━━━━━━━━━━━━"]
        for r in rows:
            j = float(r["jami"])
            pct = (j / jami_total) * 100
            bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
            parts.append(
                f"*{(r['kategoriya'] or 'Boshqa')[:14]}*\n"
                f"`{bar}` {pct:.1f}%\n"
                f"  {pul(j)} · foyda: {pul(r['foyda'] or 0)}"
            )

        parts.append("━━━━━━━━━━━━━━━━━━")
        parts.append(f"JAMI: *{pul(jami_total)}*")

        await msg.edit_text("\n".join(parts), parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_kategoriya: %s", e, exc_info=True)
        await msg.edit_text(f"❌ Xato: {e}")


async def cmd_raqobat(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Raqobatchi narx monitoring."""
    if not await faol_tekshir(update):
        return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()

    # /raqobat qo'shish: /raqobat Krossovka Bozor1 280000
    parts = matn.split()
    if len(parts) >= 4:
        tovar_nomi = parts[1]
        raqobatchi = parts[2]
        try:
            narx = float(parts[3])
        except ValueError:
            await update.message.reply_text("❌ Narx raqam bo'lishi kerak")
            return

        try:
            from shared.utils import like_escape
            from shared.services.raqobat_monitoring import raqobat_narx_qoshish
            async with db._P().acquire() as c:
                tovar = await c.fetchrow(
                    "SELECT id, nomi FROM tovarlar WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2) LIMIT 1",
                    uid, f"%{like_escape(tovar_nomi)}%",
                )
                if not tovar:
                    await update.message.reply_text(f"❌ '{tovar_nomi}' topilmadi")
                    return
                await raqobat_narx_qoshish(c, uid, tovar["id"], raqobatchi, narx)
            await update.message.reply_text(
                f"✅ Raqobat narxi saqlandi!\n"
                f"📦 {tovar['nomi']} — {raqobatchi}: {pul(narx)}"
            )
        except Exception as e:
            log.error("raqobat qo'shish: %s", e, exc_info=True)
            await update.message.reply_text("❌ Xato.")
        return

    # /raqobat — tahlil
    try:
        from shared.services.raqobat_monitoring import raqobat_tahlil, raqobat_xulosa
        async with db._P().acquire() as c:
            tahlil = await raqobat_tahlil(c, uid, limit=10)
            xulosa = await raqobat_xulosa(c, uid)

        if not tahlil:
            await update.message.reply_text(
                "📊 *Raqobat narx monitoring*\n\n"
                "Hali ma'lumot yo'q. Qo'shish:\n"
                "`/raqobat TovarNomi RaqobatchiNomi Narx`\n\n"
                "Masalan:\n"
                "`/raqobat Krossovka Bozor1 280000`",
                parse_mode=ParseMode.MARKDOWN,
            )
            return

        lines = ["📊 *RAQOBAT NARX TAHLILI*\n"]
        if xulosa:
            lines.append(f"Jami: {xulosa.get('jami_tovar', 0)} tovar kuzatilmoqda")
            lines.append(f"✅ Biz arzon: {xulosa.get('biz_arzon', 0)} ta")
            lines.append(f"🔴 Biz qimmat: {xulosa.get('biz_qimmat', 0)} ta")
            lines.append(f"📊 O'rtacha farq: {xulosa.get('ortacha_farq', 0)}%\n")

        for t in tahlil[:8]:
            farq = t.get("farq_foiz", 0)
            icon = "🟢" if farq < 0 else "🔴" if farq > 5 else "🟡"
            lines.append(
                f"{icon} *{t['tovar_nomi']}*\n"
                f"  Biz: {pul(t['bizning_narx'])} | {t['raqobatchi']}: {pul(t['raqobat_narx'])} ({farq:+.1f}%)"
            )

        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("raqobat: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato.")
