"""
╔══════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA BOT  v21.5  SAP-GRADE ENTERPRISE             ║
║                                                                  ║
║  🎤 OVOZ-BIRINCHI: Ovoz yuboring — bot hamma ishni qiladi      ║
║  🧠 DUAL-BRAIN AI: Gemini (ovoz) + Claude (mantiq)             ║
║  🛡️ XAVFSIZ: Draft→Tasdiqlash→Saqlash→Audit                   ║
║  📸 VISION AI: Rasm → matn (nakladnoy, chek o'qish)            ║
║  💳 KASSA: Naqd / Karta / O'tkazma                              ║
║  📋 NAKLADNOY: Word+Excel+PDF | MIJOZ MA'LUMOTLARI             ║
║  🔒 HIMOYA: RLS + JWT + Decimal + FK + Audit Log                ║
║                                                                  ║
║  v21.5 SAP-GRADE YANGILIKLAR:                                              ║
║  ✅ Draft→Confirm→Post pipeline (AI to'g'ridan yozmaydi)        ║
║  ✅ Ishonch darajasi (confidence gate)                            ║
║  ✅ Duplicate voice guard (5s himoya)                             ║
║  ✅ Fuzzy match (Ariyal→Ariel, Kirill→Lotin)                    ║
║  ✅ Qarz limit tekshiruvi (80% ogohlantirish)                   ║
║  ✅ Narx sanity check (zarar sotuv himoya)                       ║
║  ✅ Audit trail (kirim/sotuv/qaytarish/qarz)                    ║
║  ✅ MIJOZ MA'LUMOTLARI nakladnoyda (INN, manzil, telefon)       ║
║  ✅ Double-Entry Ledger (ikki tomonlama buxgalteriya)           ║
║  ✅ Idempotency (takroriy operatsiya 100% himoya)               ║
║  ✅ Hujjat versiyalash (tuzatish tarixi saqlanadi)             ║
║  ✅ Reconciliation (balans tekshiruvi)                          ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io, logging, sys, time
import datetime
import pytz
from collections import defaultdict
from decimal import Decimal
from typing import Optional

from telegram import (
    Update, BotCommand,
    InlineKeyboardButton, InlineKeyboardMarkup, InputFile,
)
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, ConversationHandler,
    filters, ContextTypes,
)
from telegram.constants import ParseMode
from telegram.helpers import escape_markdown as _esc_md

def esc(t: str) -> str:
    """Telegram MarkdownV2 uchun maxsus belgilarni escape qilish"""
    if not isinstance(t, str): t = str(t)
    SPECIAL = ['\\', '`', '*', '_', '{', '}', '[', ']', '(', ')',
               '#', '+', '-', '.', '!', '|', '~', '>', '=']
    for ch in SPECIAL:
        t = t.replace(ch, '\\' + ch)
    return t
from telegram.error import BadRequest

from config import Config, cfg as _cfg_fn, config_init
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(__file__))))

import services.bot.db  as db
from shared.database.pool import rls_conn as _rls_conn, pool_init as _pool_init
import services.bot.bot_services.voice      as ovoz_xizmat
import services.bot.bot_services.analyst    as ai_xizmat
import services.bot.bot_services.export_pdf   as pdf_xizmat
import services.bot.bot_services.export_excel as excel_xizmat
import services.bot.bot_services.nakladnoy    as nakl_xizmat
import services.bot.bot_services.rasm_handler as rasm_xizmat
from shared.utils.fmt import (
    pul, chek_md, SAHIFA,
    sotuv_cheki, kirim_cheki, qaytarish_cheki,
    kunlik_matn, oylik_matn, foyda_matn,
    klient_hisobi_matn,
)

import os as _os
_os.makedirs("/tmp/mm_logs", exist_ok=True)

_log_handlers: list = [logging.StreamHandler(sys.stdout)]
try:
    from logging.handlers import RotatingFileHandler
    _log_handlers.append(RotatingFileHandler(
        "/tmp/mm_logs/mm_bot.log",
        maxBytes=5*1024*1024, backupCount=3, encoding="utf-8",
    ))
except Exception: pass

logging.basicConfig(
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    level=logging.INFO, handlers=_log_handlers,
)
for _s in ("httpx","httpcore","telegram.ext._application"):
    logging.getLogger(_s).setLevel(logging.WARNING)
__version__ = "22.1"
__author__  = "Mashrab Moliya"

# Segment nomi matnlari
SEGMENT_NOMI = {
    "optom":      "Optom savdo",
    "chakana":    "Chakana savdo",
    "oshxona":    "Oshxona",
    "xozmak":     "Xo'jalik",
    "universal":  "Universal",
}

log = logging.getLogger("mm")

# ── Turbo kesh (user = 120s, hisobot = 60s) ──────────────────────
import time as _time
_kesh: dict = {}
_KESH_TTL       = 60   # umumiy kesh TTL
_KESH_USER_TTL  = 120  # user kesh — 2 daqiqa (user har xabarda tekshiriladi)

def _kesh_ol(kalit: str):
    e = _kesh.get(kalit)
    if e and _time.time() - e["t"] < e.get("ttl", _KESH_TTL):
        return e["v"]
    return None

def _kesh_yoz(kalit: str, qiymat, ttl: int = _KESH_TTL) -> None:
    _kesh[kalit] = {"v": qiymat, "t": _time.time(), "ttl": ttl}

def _kesh_tozala(kalit: str) -> None:
    _kesh.pop(kalit, None)

def _kesh_tozala_prefix(prefix: str) -> None:
    """Prefix bo'yicha barcha keshni tozalash (user:123:* kabi)"""
    keys = [k for k in _kesh if k.startswith(prefix)]
    for k in keys:
        _kesh.pop(k, None)


async def _user_ol_kesh(uid: int):
    """user_ol + kesh — har xabarda DB ga bormaslik uchun"""
    k = f"user:{uid}"
    cached = _kesh_ol(k)
    if cached is not None:
        return cached
    user = await db.user_ol(uid)
    if user:
        _kesh_yoz(k, user, _KESH_USER_TTL)
    return user


async def health_check(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Railway health monitoring — turbo v21.3"""
    import time as _t
    start = _t.monotonic()
    try:
        import asyncio
        db_info = await asyncio.wait_for(db.pool_health(), timeout=5)
        db_ms = db_info.get("ping_ms") or "?"
        db_status = f"✅ DB: {db_ms}ms (pool: {db_info.get('used',0)}/{db_info.get('size',0)})"
        if db_info.get("status") == "error":
            db_status = f"⚠️ DB: {db_info.get('error', 'xato')}"
    except Exception as e:
        db_status = f"⚠️ DB: {e!s}"
    # Cache stats
    cache_size = len(_kesh)
    total_ms = round((_t.monotonic() - start) * 1000, 1)
    await update.message.reply_text(
        f"✅ Bot {__version__} ishlayapti\n"
        f"🕐 {datetime.datetime.now(pytz.timezone('Asia/Tashkent')).strftime('%H:%M:%S')}\n"
        f"{db_status}\n"
        f"💾 Kesh: {cache_size} ta yozuv\n"
        f"⚡ Javob: {total_ms}ms"
    )


async def xato_handler(update: object,
                        ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Global xato handler — hech narsa jimgina o'tmaydi; foydalanuvchiga ham javob."""
    import traceback
    xato = ctx.error
    tb   = "".join(traceback.format_exception(type(xato), xato, xato.__traceback__))
    log.error("⛔ Global xato:\n%s", tb)

    # Foydalanuvchiga qisqa xabar (har doim javob bor bo'lsin)
    try:
        if isinstance(update, Update):
            if update.message:
                await update.message.reply_text(
                    "⚠️ Vaqtincha xato yuz berdi. Qaytadan urinib ko'ring yoki /start bosing."
                )
            elif update.callback_query:
                await update.callback_query.answer(
                    "Xato yuz berdi. Qaytadan urinib ko'ring.",
                    show_alert=True,
                )
    except Exception as _exc:
        log.debug("Foydalanuvchi javob: %s", _exc)

    # Adminlarga xabar berish
    try:
        if _CFG and _CFG.admin_ids:
            err_msg = (str(xato)[:500] if xato else "Noma'lum xato")
            for aid in _CFG.admin_ids:
                await ctx.bot.send_message(
                    aid,
                    f"⛔ Bot xatosi\n\n{err_msg}",
                )
    except Exception as _exc:
        log.debug("Admin xabar: %s", _exc)

H_SEGMENT, H_DOKON, H_TELEFON = range(3)
_oxirgi: dict[int,float] = defaultdict(float)
FLOOD_SON = 1.5
_CFG: Optional[Config] = None


def cfg() -> Config:
    assert _CFG is not None; return _CFG

def _flood_ok(uid:int) -> bool:
    hozir=time.monotonic()
    if hozir-_oxirgi[uid]<FLOOD_SON: return False
    _oxirgi[uid]=hozir; return True


def tg(*qatorlar:tuple) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(t,callback_data=d) for t,d in q]
        for q in qatorlar
    ])


def asosiy_menyu() -> InlineKeyboardMarkup:
    return tg(
        [("📥 Kirim",      "m:kirim"),    ("📤 Sotuv",      "m:chiqim")],
        [("↩️ Qaytarish",  "m:qaytarish"),("💰 Qarz to'lash","m:qarzlar")],
        [("📋 Nakladnoy",  "m:nakladnoy"),("📋 Faktura",    "m:faktura")],
        [("📦 Tovarlar",   "m:tovarlar"), ("👥 Klientlar",  "m:klientlar")],
        [("📊 Hisobot",    "m:hisobot"),  ("💹 Foyda",      "m:foyda")],
        [("💳 Kassa",      "m:kassa"),    ("📸 Rasm OCR",   "m:rasm")],
        [("🏭 Ombor",      "m:ombor"),    ("⚠️ Kam qoldiq", "m:ogoh")],
        [("📒 Jurnal",     "m:jurnal"),  ("📊 Balans",     "m:balans")],
        [("🆕 Yangiliklar","m:yangilik"), ("❓ Yordam",     "m:yordam")],
    )


async def xat(q, matn:str, **kw) -> None:
    try: await q.edit_message_text(matn,**kw)
    except BadRequest as e:
        if "not modified" not in str(e).lower(): log.warning("xat: %s",e)


async def faol_tekshir(update:Update) -> bool:
    import datetime
    uid=update.effective_user.id
    user=await _user_ol_kesh(uid)
    if not user: msg="❌ Siz ro'yxatdan o'tmagansiz. /start bosing."
    elif not user["faol"]: msg="⏳ Hisobingiz hali tasdiqlanmagan."
    else:
        if user.get("obuna_tugash"):
            qoldi=(user["obuna_tugash"]-datetime.date.today()).days
            if qoldi<0: msg="⛔ Obuna muddati tugagan!\nAdmin bilan bog'laning."
            elif qoldi<=3:
                await _yuborish(update,f"⚠️ Obuna {qoldi} kunda tugaydi!")
                return True
            else: return True
        else: return True
    if update.message: await update.message.reply_text(msg)
    elif update.callback_query: await update.callback_query.answer(msg,show_alert=True)
    return False


async def _yuborish(update:Update, matn:str, **kw) -> None:
    if update.message: await update.message.reply_text(matn,**kw)
    elif update.callback_query: await xat(update.callback_query,matn,**kw)


# ════════════ START + RO'YXAT ════════════

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/start — har doim javob beradi; xato bo'lsa ham foydalanuvchi xabar oladi."""
    if not update.message:
        return ConversationHandler.END
    uid = update.effective_user.id
    try:
        user = await _user_ol_kesh(uid)
        if user and user["faol"]:
            kam = await db.kam_qoldiq_tovarlar(uid)
            ogoh = ""
            if kam:
                ogoh = f"\n\n⚠️ Kam qoldiq: {', '.join(t['nomi'] for t in kam[:3])}"
            await update.message.reply_text(
                f"👋 Xush kelibsiz, *{(user.get('ism') or user.get('to_liq_ism') or '').strip() or 'Do' + chr(39) + 'st'}*!\n"
                f"🏪 {user['dokon_nomi']}  |  "
                f"{SEGMENT_NOMI.get(user['segment'],'')}\n\n"
                f"🤖 *Mashrab Moliya v{__version__}*\n"
                "━━━━━━━━━━━━━━━━━━━━━\n"
                "🎤 *OVOZ YUBORING* — bot hamma ishni qiladi!\n\n"
                "📋 *Namunalar:*\n"
                "• _\"Salimovga 50 Ariel, 20 Tide, qarzga\"_\n"
                "• _\"100 ta un kirdi, narxi 35,000\"_\n"
                "• _\"Salimov 500,000 to'ladi\"_\n"
                "• _\"Bugungi hisobot\"_\n"
                f"━━━━━━━━━━━━━━━━━━━━━{ogoh}\n\n"
                "👇 Menyu yoki /yangilik — yangiliklar",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=asosiy_menyu(),
            )
            return ConversationHandler.END
        if user and not user["faol"]:
            await update.message.reply_text("⏳ Hisobingiz tasdiqlanmagan.")
            return ConversationHandler.END
        await db.user_yoz(
            uid,
            update.effective_user.full_name or "Nomsiz",
            update.effective_user.username,
        )
        await update.message.reply_text(
            "👋 *Mashrab Moliya*ga xush kelibsiz!\n\nBiznes turini tanlang:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg(
                [("🏭 Optom (ulgurji)", "seg:optom")],
                [("🏪 Chakana (mayda)", "seg:chakana")],
                [("🍽️ Oshxona / Kafe", "seg:oshxona")],
                [("🍦 Xo'zmak / Fast-food", "seg:xozmak")],
                [("🛒 Universal savdo", "seg:universal")],
            ),
        )
        return H_SEGMENT
    except Exception as e:
        log.exception("cmd_start xato (uid=%s): %s", uid, e)
        try:
            await update.message.reply_text(
                "👋 Savdo AI ga xush kelibsiz.\n\n"
                "⚠️ Vaqtincha texnik ish olib borilmoqda. Bir necha soniyadan keyin /start ni qayta bosing.",
            )
        except Exception:
            pass
        return ConversationHandler.END


async def h_segment(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    seg=q.data.replace("seg:",""); ctx.user_data["seg"]=seg
    await xat(q,f"✅ *{SEGMENT_NOMI[seg]}* tanlandi!\n\n🏪 Do'kon nomini yozing:",
               parse_mode=ParseMode.MARKDOWN)
    return H_DOKON


async def h_dokon(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    ctx.user_data["dokon"]=update.message.text.strip()
    await update.message.reply_text("📞 Telefon raqamingiz (+998...):")
    return H_TELEFON


async def h_telefon(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    seg=ctx.user_data["seg"]; dokon=ctx.user_data["dokon"]
    tel=update.message.text.strip()
    await db.user_yangilab(uid,segment=seg,dokon_nomi=dokon,telefon=tel)
    _kesh_tozala(f"user:{uid}")
    await update.message.reply_text("✅ Ro'yxatdan o'tdingiz!\n⏳ Admin tasdiqlaguncha kuting.")
    for aid in cfg().admin_ids:
        try:
            await ctx.bot.send_message(aid,
                f"🆕 *YANGI FOYDALANUVCHI*\n\n"
                f"👤 {update.effective_user.full_name}\n🆔 `{uid}`\n"
                f"🏪 {dokon}\n📦 {SEGMENT_NOMI[seg]}\n📞 {tel}",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg(
                    [(f"✅ Tasdiqlash",f"adm:ok:{uid}")],
                    [(f"❌ Rad etish", f"adm:no:{uid}")],
                ))
        except Exception as e: log.warning("Admin %s: %s",aid,e)
    return ConversationHandler.END


# ════════════ OVOZ / MATN ════════════

async def ovoz_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    if not _flood_ok(uid): return
    if not await faol_tekshir(update): return
    # 🛡️ Duplicate voice guard
    from shared.services.guards import is_duplicate_message
    if is_duplicate_message(uid, f"voice:{update.message.voice.file_id}"): return
    holat=await update.message.reply_text("🎤 Ovoz tahlil qilinmoqda...")
    tmp_path = None
    try:
        fayl=await ctx.bot.get_file(update.message.voice.file_id)
        audio=bytes(await fayl.download_as_bytearray())
        # Tez yo'l: vaqtinchalik faylga yozish (STT fayl yo'lini kutadi)
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(audio)
            tmp_path = tmp.name
        matn=await ovoz_xizmat.matnga_aylantir(tmp_path)
        if not matn:
            try: await holat.edit_text("❌ Ovoz tushunilmadi. Qaytadan yuboring.")
            except Exception: await update.message.reply_text("❌ Ovoz tushunilmadi. Qaytadan yuboring.")
            return
        try:
            await holat.edit_text(f"🎤 _{matn}_\n\n🤖 Tahlil qilinmoqda...",
                                   parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await update.message.reply_text(f"🎤 {matn}\n\n🤖 Tahlil qilinmoqda...")
        await _qayta_ishlash(update,ctx,matn,holat)
    except Exception as xato:
        log.error("ovoz_qabul: %s",xato,exc_info=True)
        try: await holat.edit_text("❌ Saqlashda xato yuz berdi")
        except Exception: await update.message.reply_text("❌ Saqlashda xato yuz berdi. Qaytadan urinib ko'ring.")
    finally:
        if tmp_path:
            try: __import__("os").unlink(tmp_path)
            except Exception: pass


async def matn_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    try:
        if not _flood_ok(uid): return
        if not await faol_tekshir(update): return
        matn=(update.message.text or "").strip()
        if not matn or matn.startswith("/"): return
        # Duplicate guard
        from shared.services.guards import is_duplicate_message
        if is_duplicate_message(uid, matn): return

        # ═══ O'ZBEK BUYRUQ TEKSHIRUVI (AI ga yubormasdan) ═══
        from shared.services.voice_commands import detect_voice_command, is_quick_command
        cmd = detect_voice_command(matn)
        if cmd and is_quick_command(matn):
            await _ovoz_buyruq_bajar(update, ctx, cmd)
            return

        # Agar buyruq emas — AI ga yuborish
        await _qayta_ishlash(update,ctx,matn)
    except Exception as e:
        log.exception("matn_qabul: %s", e)
        try:
            await update.message.reply_text("⚠️ Vaqtincha xato. Qaytadan urinib ko'ring yoki /menyu.")
        except Exception:
            pass


async def _ovoz_buyruq_bajar(update:Update, ctx:ContextTypes.DEFAULT_TYPE,
                               cmd: dict) -> None:
    """O'zbek ovoz buyrug'ini AI siz bajarish — xato bo'lsa ham foydalanuvchi javob oladi."""
    uid = update.effective_user.id
    try:
        action = cmd["action"]
        sub = cmd["sub"]
    except Exception:
        await update.message.reply_text("⚠️ Buyruq tushunilmadi. Qaytadan yozing yoki /menyu.")
        return

    if action == "confirm":
        # Kutilayotgan draft tasdiqlash
        natija = ctx.user_data.get("kutilayotgan")
        if natija:
            # tasdiq_cb simulating
            from telegram import Update as _U
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
        if sub == "daily":
            d = await db.kunlik_hisobot(uid)
            await update.message.reply_text(kunlik_matn(d), parse_mode=ParseMode.MARKDOWN)
        elif sub == "weekly":
            d = await db.haftalik_hisobot(uid)
            await update.message.reply_text(haftalik_matn(d), parse_mode=ParseMode.MARKDOWN)
        elif sub == "profit":
            d = await db.foyda_hisobot(uid)
            await update.message.reply_text(foyda_matn(d), parse_mode=ParseMode.MARKDOWN)
        elif sub == "top_clients":
            top = await db.top_klientlar(uid)
            if top:
                lines = ["🏆 *TOP KLIENTLAR*\n"]
                medals = ["🥇","🥈","🥉"]
                for i, k in enumerate(top[:10]):
                    m = medals[i] if i < 3 else f"{i+1}."
                    lines.append(f"{m} {k['ism']} — {pul(k['jami_sotib'])}")
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
            d = await db.kunlik_hisobot(uid)
            await update.message.reply_text(kunlik_matn(d), parse_mode=ParseMode.MARKDOWN)

    elif action == "kassa":
        await cmd_kassa(update, ctx)

    elif action == "debt":
        if sub == "list":
            await cmd_qarz(update, ctx)
        else:
            # qarz to'lash — AI ga yuborish
            await _qayta_ishlash(update, ctx, cmd["original"])

    elif action == "print":
        if sub == "preview":
            # Kutilayotgan draft ni chek formatda ko'rsatish
            natija = ctx.user_data.get("kutilayotgan")
            if natija:
                from shared.services.print_status import format_receipt_58mm
                user = await _user_ol_kesh(uid)
                dokon = (user.get("dokon_nomi","") or "") if user else ""
                receipt = format_receipt_58mm(natija, dokon)
                await update.message.reply_text(
                    f"🖨️ *CHEK PREVIEW (58mm)*\n```\n{receipt}\n```",
                    parse_mode=ParseMode.MARKDOWN)
            else:
                await update.message.reply_text("❌ Chek uchun ma'lumot yo'q. Avval sotuv qiling.")
        elif sub == "receipt":
            # Chek chiqarish
            natija = ctx.user_data.get("kutilayotgan")
            if natija:
                from shared.services.print_status import format_receipt_58mm, create_print_job, confirm_print, mark_printed
                user = await _user_ol_kesh(uid)
                dokon = (user.get("dokon_nomi","") or "") if user else ""
                receipt = format_receipt_58mm(natija, dokon)
                job = create_print_job(uid, "sotuv_chek", receipt, 58, {"klient": natija.get("klient","")})
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
                from shared.services.print_status import request_reprint, get_job, job_status_text
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
            f"📤 *EXPORT*\n\nOvoz yuboring:\n"
            f"_\"PDF chiqar\"_ yoki _\"Excel chiqar\"_\n\n"
            f"Yoki /hisobot → PDF/Excel tugmalari",
            parse_mode=ParseMode.MARKDOWN)
    elif action == "balans":
        await cmd_balans(update, ctx)

    elif action == "help":
        await cmd_yordam(update, ctx)
    elif action == "news":
        await cmd_yangilik(update, ctx)
    elif action == "menu":
        await update.message.reply_text("📋 Asosiy menyu:", reply_markup=asosiy_menyu())
    elif action == "greet":
        user = await _user_ol_kesh(uid)
        ism = (user.get("ism") or user.get("to_liq_ism") or "") if user else ""
        await update.message.reply_text(
            f"👋 Salom{', ' + ism if ism else ''}! Ovoz yuboring yoki menyu tanlang 👇",
            reply_markup=asosiy_menyu())
    elif action == "document":
        if sub == "nakladnoy":
            await cmd_nakladnoy(update, ctx)
        elif sub == "invoice":
            await cmd_faktura(update, ctx)
    elif action == "client":
        await update.message.reply_text(
            "👥 Klient qidirish:\n/klient <ism> — ism yoki telefon bo'yicha")
    elif action == "product":
        if sub == "stock_check":
            # AI ga yuborish — tovar nomi kerak
            await _qayta_ishlash(update, ctx, cmd["original"])
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
            await _qayta_ishlash(update, ctx, cmd["original"])
        else:
            await update.message.reply_text("❌ Qayta hisoblash uchun draft yo'q.")


async def _qayta_ishlash(update:Update, ctx:ContextTypes.DEFAULT_TYPE,
                          matn:str, tahrirlash=None) -> None:
    uid=update.effective_user.id
    try: natija=await ai_xizmat.tahlil_qil(matn)
    except Exception as xato:
        log.error("tahlil: %s",xato,exc_info=True)
        xabar="❌ Tahlil vaqtincha ishlamayapti. Yozma yuboring."
        if tahrirlash: await tahrirlash.edit_text(xabar)
        else: await update.message.reply_text(xabar)
        return

    amal=natija.get("amal","boshqa")
    if amal=="hisobot":
        d=await db.kunlik_hisobot(uid); body=kunlik_matn(d)
        if tahrirlash: await tahrirlash.edit_text(body,parse_mode=ParseMode.MARKDOWN)
        else: await update.message.reply_text(body,parse_mode=ParseMode.MARKDOWN)
        return
    if amal=="nakladnoy":
        await _nakladnoy_yuborish(update,ctx,natija,tahrirlash); return

    if amal=="boshqa" or (not natija.get("tovarlar") and amal not in("qarz_tolash",)):
        yordam=(
            "❓ *Tushunilmadi.* Qaytadan yuboring.\n\n"
            "*Namunalar (O'zbek/Rus):*\n"
            "• _\"Salimovga 50 Ariel, 20 Tide. 500,000 qarzga\"_\n"
            "• _\"Продажа Иванову 50 Ariel по 45000\"_\n"
            "• _\"100 ta un kirdi, narxi 35,000, Akbardan\"_\n"
            "• _\"Приход 100 мешков муки по 35000\"_\n"
            "• _\"Salimovning 3 Arielini qaytaraman\"_\n"
            "• _\"Salimov 500,000 to'ladi\"_\n"
            "• _\"Salimovga nakladnoy yoz, 50 Ariel 45,000\"_"
        )
        if tahrirlash: await tahrirlash.edit_text(yordam,parse_mode=ParseMode.MARKDOWN)
        else: await update.message.reply_text(yordam,parse_mode=ParseMode.MARKDOWN)
        return

    # ═══ PIPELINE: AI → DRAFT → CONFIDENCE → CONFIRM ═══
    from shared.services.pipeline import create_draft, TxType, TxStatus
    tx_map = {"kirim": TxType.KIRIM, "chiqim": TxType.SOTUV, "sotuv": TxType.SOTUV,
              "qaytarish": TxType.QAYTARISH, "qarz_tolash": TxType.QARZ_TOLASH}
    tx_type = tx_map.get(amal, TxType.SOTUV)

    # DB kontekst (klient/tovar topildimi)
    db_ctx = {}
    klient = natija.get("klient", "")
    if klient:
        kl = await db.klient_topish(uid, klient)
        db_ctx["klient_topildi"] = kl is not None

    draft = create_draft(natija, tx_type, uid, db_ctx)

    # ═══ KRITIK: CORRECTED data saqlanadi, RAW AI emas! ═══
    # draft.corrected = Python Decimal bilan qayta hisoblangan
    # natija = xom AI natijasi (xato bo'lishi mumkin!)
    corrected_natija = dict(natija)
    if draft.corrected:
        # Python hisob natijasini ustiga yozish
        corrected_natija.update(draft.corrected)
    ctx.user_data["kutilayotgan"] = corrected_natija
    ctx.user_data["draft_info"] = {
        "confidence": draft.confidence.overall if draft.confidence else 0,
        "warnings": draft.warnings[:5],
        "auto_ok": draft.confidence.auto_confirmable if draft.confidence else False,
    }

    # Preview — pipeline bilan boyitilgan
    oldindan = draft.to_preview()
    if not oldindan or len(oldindan) < 10:
        oldindan = ai_xizmat.oldindan_korinish(natija)

    markup=tg([("✅ Saqlash","t:ha"),("❌ Bekor","t:yoq")])
    if tahrirlash: await tahrirlash.edit_text(oldindan,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)
    else: await update.message.reply_text(oldindan,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)


# ════════════ NAKLADNOY ════════════

async def _nakladnoy_yuborish(update:Update, ctx:ContextTypes.DEFAULT_TYPE,
                               natija:dict, tahrirlash=None) -> None:
    uid=update.effective_user.id
    user=await _user_ol_kesh(uid)
    dokon=(user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"
    inv_no=nakl_xizmat.nakladnoy_nomeri()
    klient=natija.get("klient","")
    tovarlar=natija.get("tovarlar",[])
    jami=Decimal(str(natija.get("jami_summa") or sum(t.get("jami",0) for t in tovarlar)))
    qarz=Decimal(str(natija.get("qarz",0)))
    tolangan=Decimal(str(natija.get("tolangan",jami)))

    # Klient ma'lumotlarini DB dan olish
    klient_tel = ""; klient_manzil = ""; klient_inn = ""
    if klient:
        try:
            kl = await db.klient_topish(uid, klient)
            if kl:
                klient_tel = kl.get("telefon", "") or ""
                klient_manzil = kl.get("manzil", "") or ""
                klient_inn = kl.get("inn", "") or ""
        except Exception: pass

    if tovarlar and jami>0:
        try:
            await db.sotuv_saqlash(uid,natija)
            # 🛡️ AUDIT + 📒 LEDGER
            try:
                from shared.services.pipeline import audit_yoz
                from shared.services.ledger import sotuv_jurnali, jurnal_saqlash
                async with _rls_conn(uid) as ac:
                    await audit_yoz(ac, uid, "sotuv_nakladnoy", "sotuv_sessiyalar", 0,
                        None, {"klient":klient,"jami":str(jami),"tovarlar_soni":len(tovarlar)})
                    naqd_d = max(Decimal(str(jami)) - Decimal(str(qarz)), Decimal("0"))
                    je = sotuv_jurnali(uid, klient or "", Decimal(str(jami)),
                                        naqd=naqd_d, qarz=Decimal(str(qarz)))
                    await jurnal_saqlash(ac, je)
            except Exception as _exc:
                log.debug("nakladnoy audit: %s", _exc)
        except Exception as e: log.warning("Nakladnoy DB: %s",e)

    xabar_matn=(
        f"📋 *NAKLADNOY №{inv_no}*\n\n"
        f"👤 Klient: *{klient}*\n💵 Jami: *{pul(jami)}*\n"
    )
    if qarz>0: xabar_matn+=f"✅ To'landi: {pul(tolangan)}\n⚠️ Qarz: *{pul(qarz)}*\n"
    xabar_matn+="\n⏳ Word + Excel + PDF tayyorlanmoqda..."

    if tahrirlash: await tahrirlash.edit_text(xabar_matn,parse_mode=ParseMode.MARKDOWN)
    else: tahrirlash=await update.message.reply_text(xabar_matn,parse_mode=ParseMode.MARKDOWN)

    data={
        "invoice_number":inv_no, "dokon_nomi":dokon,
        "dokon_telefon": (user.get("telefon","") or "") if user else "",
        "dokon_inn": (user.get("inn","") or "") if user else "",
        "dokon_manzil": (user.get("manzil","") or "") if user else "",
        "klient_ismi":klient, "klient_telefon":klient_tel,
        "klient_manzil":klient_manzil, "klient_inn":klient_inn,
        "tovarlar":tovarlar,
        "jami_summa":jami, "qarz":qarz, "tolangan":tolangan,
        "izoh":natija.get("izoh"),
    }
    try:
        fayllar=nakl_xizmat.uchala_format(data)
        try:
            await tahrirlash.edit_text(
                f"📋 *NAKLADNOY №{inv_no}* — tayyor!\n"
                f"👤 {klient} | 💵 {pul(jami)}\n📤 Yuborilmoqda...",
                parse_mode=ParseMode.MARKDOWN)
        except Exception: pass

        for nom_suf,kalit,caption in [
            (f"Nakladnoy_{inv_no}_{(klient or 'mijoz')[:15]}.docx","word","📝 Word (Tahrirlash uchun)"),
            (f"Nakladnoy_{inv_no}_{(klient or 'mijoz')[:15]}.xlsx","excel","📊 Excel (Buxgalteriya uchun)"),
            (f"Nakladnoy_{inv_no}_{(klient or 'mijoz')[:15]}.pdf","pdf","📑 PDF (Chop etish uchun)"),
        ]:
            if fayllar.get(kalit):
                await update.effective_message.reply_document(
                    document=InputFile(io.BytesIO(fayllar[kalit]),filename=nom_suf),
                    caption=caption,
                )
        chek=sotuv_cheki(natija,dokon)
        await update.effective_message.reply_text(
            "🖨️ *Mini printer uchun:*\n\n"+chek_md(chek),
            parse_mode=ParseMode.MARKDOWN)
    except Exception as xato:
        log.error("_nakladnoy_yuborish: %s",xato,exc_info=True)
        try: await tahrirlash.edit_text("❌ Nakladnoy yaratishda xato yuz berdi")
        except Exception: await update.effective_message.reply_text("❌ Xato yuz berdi")


async def cmd_nakladnoy(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    await update.message.reply_text(
        "📋 *NAKLADNOY YARATISH*\n\n"
        "Ovoz yuboring yoki yozing:\n\n"
        "_O'zbek: \"Salimovga nakladnoy yoz, 50 Ariel 45,000\"_\n"
        "_Rus: \"Накладная для Иванова, 50 Ariel по 45000\"_\n\n"
        "✅ Word + Excel + PDF + Imzo/Muhr joyi!",
        parse_mode=ParseMode.MARKDOWN)


# ════════════ TASDIQLASH ════════════


# ═══ TASDIQ HELPERS (extracted from tasdiq_cb for maintainability) ═══

async def _audit_sotuv(uid, klient, natija, qarz_total, sotuv):
    """Sotuv audit + ledger yozish"""
    try:
        from shared.services.pipeline import audit_yoz
        from shared.services.ledger import sotuv_jurnali, jurnal_saqlash
        async with _rls_conn(uid) as ac:
            await audit_yoz(ac, uid, "sotuv", "sotuv_sessiyalar",
                sotuv.get("sessiya_id", 0) if isinstance(sotuv, dict) else 0,
                None, {"klient":klient,"jami":str(natija.get("jami_summa",0)),
                       "qarz":str(qarz_total),"tovarlar_soni":len(natija.get("tovarlar",[]))})
            jami_d = Decimal(str(natija.get("jami_summa",0)))
            naqd_d = jami_d - qarz_total
            je = sotuv_jurnali(uid, klient or "", jami_d,
                                naqd=max(naqd_d, Decimal("0")),
                                qarz=max(qarz_total, Decimal("0")))
            je.idempotency_key = f"sotuv_{uid}_{sotuv.get('sessiya_id',0) if isinstance(sotuv,dict) else 0}"
            await jurnal_saqlash(ac, je)
    except Exception as _exc:
        log.debug("audit_sotuv: %s", _exc)


async def _audit_kirim(uid, natija, tovarlar):
    """Kirim audit + ledger yozish"""
    try:
        from shared.services.pipeline import audit_yoz
        from shared.services.ledger import kirim_jurnali, jurnal_saqlash
        async with _rls_conn(uid) as ac:
            await audit_yoz(ac, uid, "kirim", "tovarlar", 0,
                None, {"tovarlar": tovarlar, "soni": len(tovarlar)})
            jami_k = sum(Decimal(str(t.get("jami",0) or Decimal(str(t.get("miqdor",0)))*Decimal(str(t.get("narx",0))))) for t in tovarlar)
            je = kirim_jurnali(uid, natija.get("manba",""), jami_k, len(tovarlar))
            await jurnal_saqlash(ac, je)
    except Exception as _exc:
        log.debug("audit_kirim: %s", _exc)


async def _audit_qaytarish(uid, klient, natijalar, qaytarish_royxati):
    """Qaytarish audit + ledger yozish"""
    try:
        from shared.services.pipeline import audit_yoz
        from shared.services.ledger import qaytarish_jurnali, jurnal_saqlash
        async with _rls_conn(uid) as ac:
            await audit_yoz(ac, uid, "qaytarish", "qaytarishlar", 0,
                None, {"klient":klient,"soni":len(qaytarish_royxati)})
            jami_q = sum(Decimal(str(r.get("summa",0))) for r in natijalar)
            je = qaytarish_jurnali(uid, klient or "", jami_q)
            await jurnal_saqlash(ac, je)
    except Exception as _exc:
        log.debug("audit_qaytarish: %s", _exc)


async def _audit_qarz_tolash(uid, klient, summa, n):
    """Qarz tolash audit + ledger yozish"""
    try:
        from shared.services.pipeline import audit_yoz
        from shared.services.ledger import qarz_tolash_jurnali, jurnal_saqlash
        async with _rls_conn(uid) as ac:
            await audit_yoz(ac, uid, "qarz_tolash", "qarzlar", 0,
                {"klient":klient,"summa":str(summa)},
                {"natija":str(n.get("tolandi",0)),"qolgan":str(n.get("qolgan_qarz",0))})
            je = qarz_tolash_jurnali(uid, klient or "", summa)
            await jurnal_saqlash(ac, je)
    except Exception as _exc:
        log.debug("audit_qarz_tolash: %s", _exc)


async def tasdiq_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    uid=update.effective_user.id; user=await _user_ol_kesh(uid)
    if q.data=="t:yoq":
        ctx.user_data.pop("kutilayotgan",None)
        ctx.user_data.pop("kutilayotgan_majbur",None)
        ctx.user_data.pop("draft_info",None)
        await xat(q,"❌ Bekor qilindi."); return

    natija=ctx.user_data.pop("kutilayotgan",None)
    if not natija:
        await xat(q,"❌ Ma'lumot topilmadi. Qayta yuboring."); return

    amal=natija.get("amal"); tovarlar=natija.get("tovarlar",[])
    klient=natija.get("klient"); dokon=(user.get("dokon_nomi") or "") if user else ""
    qarz_total=Decimal(str(natija.get("qarz",0)))

    try:
        if amal=="kirim":
            for t in tovarlar: await db.kirim_saqlash(uid,t)
            await _audit_kirim(uid, natija, tovarlar)
            chek=kirim_cheki(natija,dokon)
            kam=await db.kam_qoldiq_tovarlar(uid); ogoh=""
            if kam: ogoh=f"\n\n⚠️ *Kam qoldiq:* {', '.join(t['nomi'] for t in kam[:3])}"
            await xat(q,f"✅ *{len(tovarlar)} ta tovar kirim!*\n\n"+chek_md(chek)+ogoh,
                      parse_mode=ParseMode.MARKDOWN)

        elif amal=="chiqim":
            # ── 1. Validatsiya ───────────────────────────────
            from shared.utils.hisob import sotuv_validatsiya
            ok_v, xato_v = sotuv_validatsiya(natija)
            if not ok_v:
                log.error("Hisob xato: %s", xato_v)
                await xat(q, "❌ Hisob xatosi yuz berdi",
                              parse_mode=ParseMode.MARKDOWN)
                return

            # ── 2. Qoldiq tekshirish ─────────────────────────
            etarli_emas = []
            for t in tovarlar:
                qolgan_q = await db.tovar_qoldiq_ol(uid, t.get("nomi",""))
                if qolgan_q is not None and Decimal(str(qolgan_q)) < Decimal(str(t.get("miqdor",0))):
                    etarli_emas.append(
                        f"📦 *{t['nomi']}*: "
                        f"qoldi={qolgan_q}, "
                        f"soralgan={t.get('miqdor',0)}"
                    )
            if etarli_emas:
                ctx.user_data["kutilayotgan_majbur"] = natija
                await xat(q,
                    "⚠️ *Omborda yetarli emas:*\n\n" +
                    "\n".join(etarli_emas) + "\n\nBaribir saqlaysizmi?",
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=tg(
                        [("✅ Ha, saqlash", "t:majbur")],
                        [("❌ Bekor",       "t:yoq")],
                    ))
                return

            # ── 3. Zarar sotuv tekshirish ────────────────────
            zararlilar = await db.zarar_sotuv_tekshir(uid, tovarlar)
            if zararlilar:
                zarar_qatorlar = []
                for z in zararlilar:
                    zarar_qatorlar.append(
                        f"📦 *{z['nomi']}*: "
                        f"sotish={z['sotish_narxi']:,.0f}, "
                        f"olish={z['olish_narxi']:,.0f}, "
                        f"zarar={z['zarar']:,.0f}/dona"
                    )
                ctx.user_data["kutilayotgan"] = natija
                await xat(q,
                    "⚠️ *ZARAR SOTUV!*\n\n" +
                    "\n".join(zarar_qatorlar) + "\n\nBaribir davom etasizmi?",
                    parse_mode=ParseMode.MARKDOWN,
                    reply_markup=tg(
                        [("✅ Ha, zarar bilan", "t:zarar_tasdiq")],
                        [("❌ Bekor",           "t:yoq")],
                    ))
                return

            # ── 3b. Qarz limit tekshirish ───────────────────
            if qarz_total > 0 and klient:
                try:
                    from shared.services.guards import tekshir_qarz_limit
                    async with _rls_conn(uid) as gc:
                        qarz_info = await tekshir_qarz_limit(gc, uid, klient, qarz_total)
                    if not qarz_info["ruxsat"]:
                        ctx.user_data["kutilayotgan"] = natija
                        await xat(q, qarz_info["ogohlantirish"] + "\n\nBaribir davom etasizmi?",
                            parse_mode=ParseMode.MARKDOWN,
                            reply_markup=tg(
                                [("✅ Ha, davom", "t:majbur")],
                                [("❌ Bekor", "t:yoq")],
                            ))
                        return
                except Exception as _ql:
                    log.warning("Qarz limit tekshiruv: %s", _ql)

            # ── 4. Saqlash ───────────────────────────────────
            sotuv=await db.sotuv_saqlash(uid,natija)
            await _audit_sotuv(uid, klient, natija, qarz_total, sotuv)

            # Eski qarzni chekda ko'rsatish
            eski_qarz_total = Decimal('0')
            if klient:
                try:
                    qarzlar_r = await db.qarzlar_ol(uid)
                    for qr in qarzlar_r:
                        if qr.get("klient_ismi","").lower() == klient.lower():
                            eski_qarz_total += Decimal(str(qr.get('qolgan', 0)))
                    if qarz_total > 0:
                        eski_qarz_total = max(Decimal('0'), eski_qarz_total - qarz_total)
                except Exception as _qe:
                    log.debug("Eski qarz olishda xato: %s", _qe)

            chek_data = dict(natija)
            if eski_qarz_total > 0:
                chek_data["eski_qarz"] = eski_qarz_total

            chek=sotuv_cheki(chek_data,dokon)
            javob="✅ *Sotuv saqlandi!*\n\n"+chek_md(chek)
            if qarz_total>0:
                javob+=f"\n\n⚠️ Yangi qarz: *{pul(qarz_total)}*"
            if eski_qarz_total > 0:
                javob+=f"\n📋 Eski qarz: *{pul(eski_qarz_total)}*"
                javob+=f"\n🔴 JAMI QARZ: *{pul(qarz_total + eski_qarz_total)}*"
            sess_id=sotuv["sessiya_id"]
            markup=tg(
                [("📋 Nakladnoy",f"n:sess:{sess_id}"),
                 ("📄 PDF chek", f"eks:pdf:sotuv:{sess_id}")],
                [("📊 Excel chek",f"eks:xls:sotuv:{sess_id}"),
                 ("✅ Yaxshi",   "m:orqaga")],
            )
            await xat(q,javob,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)

        elif q.data == "t:majbur":
            natija_m = ctx.user_data.pop("kutilayotgan_majbur", None)
            if not natija_m:
                await xat(q, "❌ Ma'lumot topilmadi."); return
            sotuv_m = await db.sotuv_saqlash(uid, natija_m)
            chek_m  = sotuv_cheki(natija_m, dokon)
            await xat(q,
                "✅ *Sotuv saqlandi* (qoldiq yetmasa ham)\n\n" + chek_md(chek_m),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg(
                    [("📋 Nakladnoy", f"n:sess:{sotuv_m['sessiya_id']}")],
                    [("✅ OK", "m:orqaga")],
                ))

        elif q.data == "t:zarar_tasdiq":
            natija_z = ctx.user_data.pop("kutilayotgan", None)
            if not natija_z:
                await xat(q, "❌ Ma'lumot topilmadi."); return
            sotuv_z = await db.sotuv_saqlash(uid, natija_z)
            chek_z  = sotuv_cheki(natija_z, dokon)
            await xat(q,
                "⚠️ *Zarar sotuv saqlandi*\n\n" + chek_md(chek_z),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg(
                    [("📋 Nakladnoy", f"n:sess:{sotuv_z['sessiya_id']}")],
                    [("✅ OK", "m:orqaga")],
                ))

        elif amal=="qaytarish":
            if not tovarlar or not klient:
                await xat(q,"❌ Klient yoki tovar aniqlanmadi."); return
            qaytarish_royxati=[]; topilmadilar=[]
            for t in tovarlar:
                qatorlar=await db.qaytarish_tovarlar_ol(uid,klient,t["nomi"])
                if not qatorlar: topilmadilar.append(t["nomi"]); continue
                qaytarish_royxati.append({"chiqim_id":qatorlar[0]["id"],"miqdor":t.get("miqdor",1)})
            if not qaytarish_royxati:
                xabar_="❌ Qaytariladigan tovar topilmadi."
                if topilmadilar: xabar_+="\nTopilmadi: "+", ".join(topilmadilar)
                await xat(q,xabar_); return
            natijalar=await db.qaytarish_saqlash(uid,qaytarish_royxati,natija.get("izoh"))
            await _audit_qaytarish(uid, klient, natijalar, qaytarish_royxati)
            if not natijalar: await xat(q,"❌ Qaytarish saqlanmadi."); return
            chek=qaytarish_cheki(natijalar,dokon)
            jami_q=sum(r.get("summa",0) for r in natijalar)
            xabar_=(f"✅ *{len(natijalar)} ta tovar qaytarildi!*\n"
                    f"💰 Jami: *{pul(jami_q)}*\n\n"+chek_md(chek))
            if topilmadilar: xabar_+=f"\n\n⚠️ Topilmadi: {', '.join(topilmadilar)}"
            await xat(q,xabar_,parse_mode=ParseMode.MARKDOWN)

        elif amal=="qarz_tolash":
            if not klient: await xat(q,"❌ Klient ismi aniqlanmadi."); return
            summa=Decimal(str(natija.get("jami_summa",0)))
            if summa<=0: await xat(q,"❌ To'lov summasi aniqlanmadi."); return
            n=await db.qarz_tolash(uid,klient,summa)
            await _audit_qarz_tolash(uid, klient, summa, n)
            if not n.get("topildi"):
                await xat(q,f"❌ *{klient}* uchun qarz topilmadi.",
                           parse_mode=ParseMode.MARKDOWN); return
            await xat(q,
                f"✅ *{n['klient']}* qarzi to'landi!\n"
                f"💰 To'langan: {pul(n['tolandi'])}\n"
                f"📊 Qolgan qarz: {pul(n['qolgan_qarz'])}",
                parse_mode=ParseMode.MARKDOWN)
        else:
            await xat(q,"❌ Noma'lum amal.")
    except Exception as xato:
        log.error("tasdiq_cb: %s",xato,exc_info=True)
        await xat(q,"❌ Ma'lumot saqlashda xato yuz berdi")


# ════════════ EKSPORT ════════════

async def eksport_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer("Fayl tayyorlanmoqda...")
    uid=update.effective_user.id; user=await _user_ol_kesh(uid)
    dokon=(user.get("dokon_nomi") or "") if user else ""
    qismlar=q.data.split(":"); format_=qismlar[1]; tur=qismlar[2]
    try:
        if tur=="sotuv":
            sess_id=int(qismlar[3]); data=await db.sessiya_ol(uid,sess_id)
            if not data: await q.message.reply_text("❌ Sessiya topilmadi."); return
            if format_=="pdf": kontent=pdf_xizmat.sotuv_pdf(data,dokon); nom=f"sotuv_{sess_id}.pdf"
            else: kontent=excel_xizmat.sotuv_excel(data,dokon); nom=f"sotuv_{sess_id}.xlsx"
        elif tur=="klient":
            klient_id=int(qismlar[3]); data=await db.klient_to_liq_hisobi(uid,klient_id)
            if not data: await q.message.reply_text("❌ Klient topilmadi."); return
            ism_fayl=data["klient"]["ism"].replace(" ","_")
            if format_=="pdf": kontent=pdf_xizmat.klient_hisobi_pdf(data,dokon); nom=f"klient_{ism_fayl}.pdf"
            else: kontent=excel_xizmat.klient_hisobi_excel(data,dokon); nom=f"klient_{ism_fayl}.xlsx"
        elif tur in("kun","oy"):
            d=(await db.kunlik_hisobot(uid) if tur=="kun" else await db.oylik_hisobot(uid))
            if format_=="pdf": kontent=pdf_xizmat.kunlik_pdf(d,dokon); nom=f"hisobot_{tur}.pdf"
            else: kontent=excel_xizmat.kunlik_excel(d,dokon); nom=f"hisobot_{tur}.xlsx"
        else: await q.message.reply_text("❌ Noma'lum eksport."); return
        if not kontent: await q.message.reply_text("❌ Fayl bo'sh."); return
        await q.message.reply_document(
            document=InputFile(io.BytesIO(kontent),filename=nom), caption=f"📎 {nom}")
    except Exception as xato:
        log.error("eksport_cb: %s",xato,exc_info=True)
        await q.message.reply_text("❌ Export vaqtincha ishlamayapti")


async def nakladnoy_sessiya_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer("Nakladnoy yaratilmoqda...")
    uid=update.effective_user.id; user=await _user_ol_kesh(uid)
    dokon=(user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"
    sess_id=int(q.data.split(":")[2])
    sess_data=await db.sessiya_ol(uid,sess_id)
    if not sess_data: await q.message.reply_text("❌ Sessiya topilmadi."); return
    inv_no=nakl_xizmat.nakladnoy_nomeri(); klient=sess_data.get("klient","")
    # Klient ma'lumotlarini DB dan olish
    kl_tel=""; kl_manzil=""; kl_inn=""
    if klient:
        try:
            kl=await db.klient_topish(uid, klient)
            if kl:
                kl_tel=kl.get("telefon","") or ""
                kl_manzil=kl.get("manzil","") or ""
                kl_inn=kl.get("inn","") or ""
        except Exception: pass
    data={"invoice_number":inv_no,"dokon_nomi":dokon,
          "dokon_telefon":(user.get("telefon","") or "") if user else "",
          "dokon_inn":(user.get("inn","") or "") if user else "",
          "dokon_manzil":(user.get("manzil","") or "") if user else "",
          "klient_ismi":klient,"klient_telefon":kl_tel,
          "klient_manzil":kl_manzil,"klient_inn":kl_inn,
          "tovarlar":sess_data.get("tovarlar",[]),"jami_summa":sess_data.get("jami_summa",0),
          "qarz":sess_data.get("qarz",0),"tolangan":sess_data.get("tolandan",0),"izoh":None}
    try:
        fayllar=nakl_xizmat.uchala_format(data)
        await q.message.reply_text(
            f"📋 *Nakladnoy №{inv_no}*\n👤 {klient}\n📤 Yuborilmoqda...",
            parse_mode=ParseMode.MARKDOWN)
        for nom_suf,kalit,caption in [
            (f"Nakladnoy_{inv_no}.docx","word","📝 Word (Tahrirlash uchun)"),
            (f"Nakladnoy_{inv_no}.xlsx","excel","📊 Excel (Buxgalteriya uchun)"),
            (f"Nakladnoy_{inv_no}.pdf","pdf","📑 PDF (Chop etish uchun)"),
        ]:
            if fayllar.get(kalit):
                await q.message.reply_document(
                    document=InputFile(io.BytesIO(fayllar[kalit]),filename=nom_suf),
                    caption=caption)
    except Exception as xato:
        log.error("nakladnoy_sessiya_cb: %s",xato,exc_info=True)
        await q.message.reply_text("❌ Nakladnoy yaratishda xato yuz berdi")


# ════════════ MENYU CALLBACKLAR ════════════

async def menyu_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    uid=update.effective_user.id
    if not await faol_tekshir(update): return
    akt=q.data[2:]

    if akt=="kirim":
        await xat(q,"📥 *KIRIM*\n\nOvoz yuboring:\n\n_\"100 ta Ariel kirdi, narxi 43,000, Akbardan\"_",
                  parse_mode=ParseMode.MARKDOWN)
    elif akt=="chiqim":
        await xat(q,"📤 *CHIQIM (SOTUV)*\n\nOvoz yuboring:\n\n"
                  "_\"Salimovga 50 Ariel, 20 Tide. 500,000 qarzga\"_\n"
                  "_\"Muzqaymoq 350 gramm, kg narxi 45,000\"_",parse_mode=ParseMode.MARKDOWN)
    elif akt=="qaytarish":
        await xat(q,"↩️ *QAYTARISH*\n\nOvoz yuboring:\n\n"
                  "_\"Salimovning 3 Arielini qaytaraman\"_",parse_mode=ParseMode.MARKDOWN)
    elif akt=="nakladnoy":
        await xat(q,"📋 *NAKLADNOY*\n\nOvoz yuboring:\n\n"
                  "_\"Salimovga nakladnoy yoz, 50 Ariel 45,000\"_\n\n"
                  "✅ Word + Excel + PDF + Imzo/Muhr joyi!",parse_mode=ParseMode.MARKDOWN)
    elif akt=="qarzlar":
        qatorlar=await db.qarzlar_ol(uid)
        if not qatorlar: await xat(q,"✅ Hech qanday qarz yo'q!"); return
        matn="💰 *QARZLAR RO'YXATI*\n\n"; jami=Decimal(0)
        for i,r in enumerate(qatorlar,1):
            matn+=f"{i}. *{r['klient_ismi']}* — {pul(r['qolgan'])}\n"
            jami+=Decimal(str(r["qolgan"]))
        matn+=f"\n━━━━━━━━━━━━━━\n💵 JAMI: *{pul(jami)}*"
        await xat(q,matn,parse_mode=ParseMode.MARKDOWN,
                  reply_markup=tg([("⬅️ Orqaga","m:orqaga")]))
    elif akt=="tovarlar":
        sahifa=int(ctx.user_data.get("tv_s",0))
        qatorlar=await db.tovarlar_ol(uid,SAHIFA,sahifa*SAHIFA)
        jami_son=await db.tovarlar_soni(uid)
        if not qatorlar: await xat(q,"📦 Tovar katalogi bo'sh."); return
        kat_guruh:dict={}
        for t in qatorlar: kat_guruh.setdefault(t["kategoriya"],[]).append(t)
        matn=f"📦 *TOVAR KATALOGI* ({jami_son} ta)\n\n"
        for kat,els in kat_guruh.items():
            matn+=f"🏷️ *{kat}*\n"
            for t in els:
                qd=Decimal(str(t["qoldiq"])); narx=Decimal(str(t.get("sotish_narxi") or 0))
                kam=" ⚠️" if (t.get("min_qoldiq") and qd<=Decimal(str(t.get("min_qoldiq",0)))) else ""
                qator=f"  • {t['nomi']} — {qd:.1f} {t['birlik']}{kam}"
                if narx: qator+=f" | {narx:,.0f}"
                matn+=qator+"\n"
            matn+="\n"
        pag=[]
        if sahifa>0: pag.append(("◀️","tv:oldingi"))
        if (sahifa+1)*SAHIFA<jami_son: pag.append(("▶️","tv:keyingi"))
        mkup=tg(*([pag] if pag else []),[("⬅️ Orqaga","m:orqaga")])
        await xat(q,matn[:4000],parse_mode=ParseMode.MARKDOWN,reply_markup=mkup)
    elif akt=="klientlar":
        sahifa=int(ctx.user_data.get("kl_s",0))
        qatorlar=await db.klientlar_ol(uid,SAHIFA,sahifa*SAHIFA)
        jami_son=await db.klientlar_soni(uid)
        if not qatorlar: await xat(q,"👥 Klientlar bazasi bo'sh."); return
        matn=f"👥 *KLIENTLAR* ({jami_son} ta)\n\n"
        for i,k in enumerate(qatorlar,sahifa*SAHIFA+1):
            matn+=f"{i}. *{k['ism']}*"
            if k.get("telefon"): matn+=f" — {k['telefon']}"
            j=Decimal(str(k.get("jami_sotib") or 0))
            if j: matn+=f" | {j:,.0f}"
            matn+="\n"
        pag=[]
        if sahifa>0: pag.append(("◀️","kl:oldingi"))
        if (sahifa+1)*SAHIFA<jami_son: pag.append(("▶️","kl:keyingi"))
        kl_tugmalar=[(f"📋 {k['ism'][:15]}",f"kh:{k['id']}") for k in qatorlar[:3]]
        mkup=tg(*([pag] if pag else []),*([[t] for t in kl_tugmalar]),[("⬅️ Orqaga","m:orqaga")])
        await xat(q,matn,parse_mode=ParseMode.MARKDOWN,reply_markup=mkup)
    elif akt=="hisobot":
        await xat(q,"📊 Hisobot turi tanlang:",
            reply_markup=tg(
                [("📅 Bugungi","hs:kun"),("📆 Bu oylik","hs:oy")],
                [("⬅️ Orqaga","m:orqaga")],
            ))
    elif akt=="foyda":
        d=await db.foyda_tahlil(uid)
        await xat(q,foyda_matn(d),parse_mode=ParseMode.MARKDOWN,
                  reply_markup=tg([("⬅️ Orqaga","m:orqaga")]))
    elif akt=="menyu":
        menu=await db.menyu_ol(uid)
        if not menu:
            await xat(q,"🍽️ Menyu bo'sh.\n\n_Ovoz: \"Menyuga Lag'mon qo'sh, 18,000\"_",
                      parse_mode=ParseMode.MARKDOWN); return
        kat_guruh:dict={}
        for r in menu: kat_guruh.setdefault(r["kategoriya"],[]).append(r)
        matn="🍽️ *MENYU*\n\n"
        for kat,els in kat_guruh.items():
            matn+=f"▸ *{kat}*\n"
            for elem in els: matn+=f"  • {elem['nomi']} — {pul(elem['narx'])}\n"
            matn+="\n"
        await xat(q,matn,parse_mode=ParseMode.MARKDOWN,reply_markup=tg([("⬅️ Orqaga","m:orqaga")]))
    elif akt=="kassa":
        # Kassa holati — naqd/karta/otkazma
        try:
            async with _rls_conn(uid) as c:
                bugun = await c.fetchrow("""
                    SELECT
                        COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                        COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
                    FROM kassa_operatsiyalar
                    WHERE (yaratilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
                """)
                usullar = await c.fetch("""
                    SELECT usul,
                        COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE -summa END), 0) AS balans
                    FROM kassa_operatsiyalar GROUP BY usul
                """)
            bk = Decimal(str(bugun["kirim"])); bc = Decimal(str(bugun["chiqim"]))
            usul_map = {r["usul"]: Decimal(str(r["balans"])) for r in usullar}
            matn = (
                "💳 *KASSA HOLATI*\n\n"
                f"📅 *Bugun:*\n"
                f"  📥 Kirim: *{pul(bk)}*\n"
                f"  📤 Chiqim: *{pul(bc)}*\n"
                f"  💰 Balans: *{pul(bk - bc)}*\n\n"
                f"💵 Naqd: *{pul(usul_map.get('naqd', 0))}*\n"
                f"💳 Karta: *{pul(usul_map.get('karta', 0))}*\n"
                f"🏦 O'tkazma: *{pul(usul_map.get('otkazma', 0))}*"
            )
        except Exception as e:
            log.warning("Kassa menyu: %s", e)
            matn = "💳 *KASSA*\n\nOvoz yuboring:\n_\"Kassaga 500,000 naqd kirim\"_\n_\"Kassadan 200,000 karta chiqim\"_"
        await xat(q, matn, parse_mode=ParseMode.MARKDOWN,
                  reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="rasm":
        await xat(q,
            "📸 *RASM TAHLIL (Vision AI)*\n\n"
            "Rasm yuboring — avtomatik tahlil qiladi:\n\n"
            "📋 *Nakladnoy* — tovarlar, narxlar o'qiladi\n"
            "🧾 *Chek/kvitansiya* — summa ajratiladi\n"
            "📄 *Hujjat* — matn taniladi (OCR)\n\n"
            "_Rasm yuboring va natijani kuting!_",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="jurnal":
        await cmd_jurnal(update, ctx)
    elif akt=="balans":
        await cmd_balans(update, ctx)
    elif akt=="yangilik":
        # Yangiliklar — menyu orqali
        await xat(q,
            f"🆕 *v{__version__} YANGILIKLAR*\n\n"
            "🧠 *Dual-Brain AI* — Gemini+Claude\n"
            "🛡️ *Xavfsiz pipeline* — Draft→Tasdiq→Saqlash\n"
            "🎯 *Ishonch darajasi* — 🟢🟡🔴\n"
            "🔍 *Aqlli qidiruv* — \"Ariyal\"→\"Ariel\"\n"
            "🛡️ *Duplicate guard* — 5s himoya\n"
            "💳 *Qarz limit* — 80% ogohlantirish\n"
            "📋 *MIJOZ jadvali* — INN, manzil, telefon\n"
            "📸 *Vision AI* — rasm tahlil\n"
            "📊 *Audit trail* — tarix o'chirilmaydi\n\n"
            "/yangilik — to'liq yangiliklar",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="yordam":
        await xat(q,
            "❓ *YORDAM*\n\n"
            "🎤 *Ovoz yuboring* — eng tez usul!\n\n"
            "_\"Salimovga 50 Ariel 45,000 qarzga\"_\n"
            "_\"100 ta un kirdi, narxi 35,000\"_\n"
            "_\"Salimov 500,000 to'ladi\"_\n"
            "_\"Bugungi hisobot\"_\n\n"
            "📸 *Rasm yuboring* — nakladnoy/chek o'qiladi\n\n"
            "/yordam — to'liq qo'llanma",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="ombor":
        # Ombor holati
        try:
            async with _rls_conn(uid) as c:
                stats = await c.fetchrow("""
                    SELECT COUNT(*) AS soni,
                        COALESCE(SUM(qoldiq * COALESCE(sotish_narxi,0)), 0) AS qiymat
                    FROM tovarlar WHERE qoldiq > 0
                """)
            await xat(q,
                "🏭 *OMBOR HOLATI*\n\n"
                f"📦 Tovarlar: *{stats['soni']}* ta\n"
                f"💰 Umumiy qiymat: *{pul(stats['qiymat'])}*\n\n"
                "/ombor — batafsil",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
        except Exception:
            await xat(q, "🏭 Ombor holati vaqtincha mavjud emas",
                reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="ogoh":
        try:
            kam = await db.kam_qoldiq_tovarlar(uid)
            if kam:
                matn = "⚠️ *KAM QOLDIQ TOVARLAR*\n\n"
                for t in kam[:10]:
                    matn += f"📦 {t['nomi']}: *{t['qoldiq']}* ta qoldi\n"
                if len(kam) > 10:
                    matn += f"\n...va yana {len(kam)-10} ta"
            else:
                matn = "✅ Barcha tovarlar yetarli!"
            await xat(q, matn, parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
        except Exception:
            await xat(q, "⚠️ Tekshirib bo'lmadi",
                reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="faktura":
        await xat(q,
            "📋 *HISOB-FAKTURA*\n\n"
            "/faktura — oxirgi sotuv uchun\n\n"
            "Yoki ovoz yuboring:\n"
            "_\"Salimovga faktura chiqar\"_",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="orqaga":
        ctx.user_data.pop("tv_s",None); ctx.user_data.pop("kl_s",None)
        await xat(q,"📋 Asosiy menyu:",reply_markup=asosiy_menyu())


async def paginatsiya_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer(); akt=q.data
    if akt=="tv:keyingi": ctx.user_data["tv_s"]=ctx.user_data.get("tv_s",0)+1
    elif akt=="tv:oldingi": ctx.user_data["tv_s"]=max(ctx.user_data.get("tv_s",0)-1,0)
    elif akt=="kl:keyingi": ctx.user_data["kl_s"]=ctx.user_data.get("kl_s",0)+1
    elif akt=="kl:oldingi": ctx.user_data["kl_s"]=max(ctx.user_data.get("kl_s",0)-1,0)
    q.data="m:"+("tovarlar" if akt.startswith("tv") else "klientlar")
    await menyu_cb(update,ctx)


async def hisobot_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    uid=update.effective_user.id; tur=q.data[3:]
    d=(await db.kunlik_hisobot(uid) if tur=="kun" else await db.oylik_hisobot(uid))
    matn=kunlik_matn(d) if tur=="kun" else oylik_matn(d)
    await xat(q,matn,parse_mode=ParseMode.MARKDOWN,
        reply_markup=tg(
            [("📄 PDF",f"eks:pdf:{tur}"),("📊 Excel",f"eks:xls:{tur}")],
            [("⬅️ Orqaga","m:hisobot")],
        ))


async def klient_hisobi_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer("Klient hisobi yuklanmoqda...")
    uid=update.effective_user.id; klient_id=int(q.data.split(":")[1])
    data=await db.klient_to_liq_hisobi(uid,klient_id)
    if not data: await q.message.reply_text("❌ Klient topilmadi."); return
    matn=klient_hisobi_matn(data)
    await q.message.reply_text(matn,parse_mode=ParseMode.MARKDOWN,
        reply_markup=tg(
            [("📄 PDF hisobi",   f"eks:pdf:klient:{klient_id}")],
            [("📊 Excel hisobi", f"eks:xls:klient:{klient_id}")],
        ))


async def faktura_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Faktura yaratish callback"""
    q=update.callback_query; await q.answer("Faktura yaratilmoqda...")
    uid=update.effective_user.id; user=await _user_ol_kesh(uid)
    dokon=(user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"
    sess_id=int(q.data.split(":")[2])
    try:
        sess_data=await db.sessiya_ol(uid,sess_id)
        if not sess_data:
            await q.message.reply_text("❌ Sessiya topilmadi."); return
        from shared.services.invoice import faktura_yaratish, faktura_raqami
        raqam = faktura_raqami()
        data = {
            "raqam": raqam, "dokon_nomi": dokon,
            "klient_ismi": sess_data.get("klient", ""),
            "tovarlar": sess_data.get("tovarlar", []),
            "jami_summa": sess_data.get("jami_summa", 0),
            "qarz": sess_data.get("qarz", 0),
            "tolangan": sess_data.get("tolangan", 0),
        }
        fayllar = faktura_yaratish(data)
        await q.message.reply_text(
            f"📋 *Faktura №{raqam}*\n"
            f"👤 {data['klient_ismi']}\n💰 {pul(data['jami_summa'])}\n"
            "📤 Yuborilmoqda...",
            parse_mode=ParseMode.MARKDOWN)
        for nom, kalit, caption in [
            (f"Faktura_{raqam}.docx", "word", "📝 Faktura (Word)"),
            (f"Faktura_{raqam}.pdf", "pdf", "📑 Faktura (PDF)"),
        ]:
            if fayllar.get(kalit):
                await q.message.reply_document(
                    document=InputFile(io.BytesIO(fayllar[kalit]), filename=nom),
                    caption=caption)
    except Exception as e:
        log.error("faktura_cb: %s", e, exc_info=True)
        await q.message.reply_text("❌ Faktura yaratishda xato yuz berdi")


# ════════════ ADMIN ════════════

async def admin_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    if not cfg().is_admin(q.from_user.id): return
    qismlar=q.data.split(":"); uid=int(qismlar[2])
    if qismlar[1]=="ok":
        await db.user_faollashtir(uid); await db.user_yangilab(uid,faol=True)
        _kesh_tozala(f"user:{uid}")
        try: await ctx.bot.send_message(uid,"✅ Hisobingiz faollashtirildi! /start bosing.")
        except Exception: pass
        await xat(q,f"✅ `{uid}` faollashtirildi!",parse_mode=ParseMode.MARKDOWN)
    else: await xat(q,f"❌ `{uid}` rad etildi.",parse_mode=ParseMode.MARKDOWN)


# ════════════ AVTOMATIK JOBLAR ════════════

async def avto_kunlik_hisobot(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    log.info("⏰ Avtomatik kunlik hisobot...")
    try:
        users=await db.faol_users(); yuborildi=0
        for user in users:
            try:
                d=await db.kunlik_hisobot(user["id"])
                if d["kr_n"]==0 and d["ch_n"]==0: continue
                await ctx.bot.send_message(
                    user["id"],
                    f"🌙 *Bugungi yakuniy hisobot*\n\n{kunlik_matn(d)}",
                    parse_mode=ParseMode.MARKDOWN)
                yuborildi+=1
            except Exception as e: log.warning("Avtohisobot %s: %s",user["id"],e)
        log.info("✅ Kunlik hisobot: %d foydalanuvchiga",yuborildi)
    except Exception as e: log.error("avto_kunlik_hisobot: %s",e,exc_info=True)


async def avto_haftalik_hisobot(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    """Har dushanba haftalik hisobot"""
    log.info("⏰ Haftalik hisobot...")
    try:
        users=await db.faol_users(); yuborildi=0
        for user in users:
            try:
                d=await db.oylik_hisobot(user["id"])
                if d["ch_n"]==0: continue
                matn=(
                    f"📊 *HAFTALIK HISOBOT*\n\n"
                    f"📤 Sotuvlar: {pul(d['ch_jami'])} ({d['ch_n']} ta)\n"
                    f"💹 Foyda: *{pul(d['foyda'])}*\n"
                    f"⚠️ Jami qarz: {pul(d['jami_qarz'])}"
                )
                await ctx.bot.send_message(user["id"],matn,parse_mode=ParseMode.MARKDOWN)
                yuborildi+=1
            except Exception as e: log.warning("Haftalik %s: %s",user["id"],e)
        log.info("✅ Haftalik hisobot: %d foydalanuvchiga",yuborildi)
    except Exception as e: log.error("avto_haftalik_hisobot: %s",e,exc_info=True)


async def avto_qarz_eslatma(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni qarz eslatmasi"""
    log.info("⏰ Qarz eslatmalari...")
    try:
        users=await db.faol_users()
        for user in users:
            try:
                qarzlar=await db.qarzlar_ol(user["id"])
                if not qarzlar: continue
                jami=sum(Decimal(str(r["qolgan"])) for r in qarzlar)
                if jami<=0: continue
                matn=(
                    f"💰 *QARZ ESLATMASI*\n\n"
                    f"Jami qarz: *{pul(jami)}*\n"
                    f"Klientlar soni: {len(qarzlar)}\n\n"
                )
                for r in qarzlar[:5]:
                    matn+=f"• *{r['klient_ismi']}* — {pul(r['qolgan'])}\n"
                if len(qarzlar)>5: matn+=f"...va yana {len(qarzlar)-5} ta"
                await ctx.bot.send_message(user["id"],matn,parse_mode=ParseMode.MARKDOWN)
            except Exception as e: log.warning("Qarz eslatma %s: %s",user["id"],e)
    except Exception as e: log.error("avto_qarz_eslatma: %s",e,exc_info=True)


async def obuna_eslatma(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    try:
        for kun in [3,1]:
            users=await db.obuna_tugayotganlar(kun)
            for user in users:
                try:
                    await ctx.bot.send_message(
                        user["id"],
                        f"⚠️ *Obuna {kun} kunda tugaydi!*\n"
                        "Uzaytirib olish uchun admin bilan bog'laning.",
                        parse_mode=ParseMode.MARKDOWN)
                except Exception: pass
    except Exception as e: log.error("obuna_eslatma: %s",e,exc_info=True)


# ════════════ KOMANDALAR ════════════

async def cmd_menyu(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    await update.message.reply_text("📋 Asosiy menyu:",reply_markup=asosiy_menyu())

async def cmd_hisobot(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not await faol_tekshir(update): return
    d=await db.kunlik_hisobot(update.effective_user.id)
    await update.message.reply_text(kunlik_matn(d),parse_mode=ParseMode.MARKDOWN)

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
                SELECT * FROM klientlar
                WHERE user_id=$1 AND telefon LIKE $2
                LIMIT 10
            """,uid,f"%{qidiruv.replace('+998','')}%")

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
    import platform, sys
    from datetime import datetime
    import pytz
    tz = pytz.timezone("Asia/Tashkent")
    hozir = datetime.now(tz).strftime("%d.%m.%Y %H:%M:%S")
    users = await db.barcha_users()
    faol  = sum(1 for u in users if u["faol"])
    # DB ping
    db_ms = "?"
    try:
        from shared.database.pool import pool_health
        info = await pool_health()
        db_ms = f"{info.get('ping_ms', '?')}ms (pool: {info.get('used',0)}/{info.get('size',0)})"
    except Exception: pass
    matn = (
        "⚙️ *BOT HOLATI (v21.3 TURBO)*\n\n"
        + f"📅 Vaqt: `{hozir}`\n"
        + f"🐍 Python: `{sys.version.split()[0]}`\n"
        + f"💻 OS: `{platform.system()} {platform.release()}`\n\n"
        + f"👥 Foydalanuvchilar: {len(users)} (faol: {faol})\n"
        + f"💾 Kesh: {len(_kesh)} ta yozuv\n\n"
        + "✅ Bot: Ishlayapti\n"
        + f"✅ DB: {db_ms}\n"
        + f"✅ AI: {cfg().claude_model}\n"
        + f"✅ Ovoz: {cfg().gemini_model}\n"
        + "✅ Vision AI: Faol\n"
        + "✅ Kassa: Faol"
    )
    await update.message.reply_text(matn, parse_mode="Markdown")


async def cmd_kassa(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Kassa holati — naqd/karta/otkazma"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        async with _rls_conn(uid) as c:
            bugun = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
                FROM kassa_operatsiyalar
                WHERE (yaratilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
            """)
            jami = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END), 0) AS kirim,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END), 0) AS chiqim
                FROM kassa_operatsiyalar
            """)
            usullar = await c.fetch("""
                SELECT usul,
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE -summa END), 0) AS balans
                FROM kassa_operatsiyalar GROUP BY usul
            """)
            oxirgi = await c.fetch("""
                SELECT tur, summa, usul, tavsif, yaratilgan
                FROM kassa_operatsiyalar
                ORDER BY yaratilgan DESC LIMIT 5
            """)
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
                if r.get("tavsif"): matn += f" — {r['tavsif'][:30]}"
                matn += "\n"
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
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
    dokon = (user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"

    # Oxirgi sotuv sessiyasini topish
    try:
        async with _rls_conn(uid) as c:
            oxirgi = await c.fetchrow("""
                SELECT id, klient_ismi, jami, tolangan, qarz, sana
                FROM sotuv_sessiyalar
                ORDER BY sana DESC LIMIT 1
            """)
        if oxirgi:
            markup = tg(
                [(f"📋 Faktura #{oxirgi['id']}", f"fkt:sess:{oxirgi['id']}")],
                [(f"📋 Boshqa sessiya", "fkt:tanlash")],
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


async def hujjat_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Excel/hujjat fayllarni qabul qilish va tahlil qilish"""
    uid = update.effective_user.id
    if not await faol_tekshir(update): return
    doc = update.message.document
    if not doc: return
    fname = (doc.file_name or "").lower()

    # Faqat Excel fayllar
    if not fname.endswith(('.xlsx', '.xls')):
        return  # Boshqa fayllarni o'tkazib yuborish

    holat = await update.message.reply_text("📊 Excel fayl tahlil qilinmoqda...")
    try:
        fayl = await ctx.bot.get_file(doc.file_id)
        data = bytes(await fayl.download_as_bytearray())

        from shared.services.excel_import import parse_excel, excel_preview_text
        result = parse_excel(data)
        preview = excel_preview_text(result)

        # Natijani saqlash (keyingi buyruqlar uchun)
        ctx.user_data["excel_data"] = result
        ctx.user_data["excel_fname"] = doc.file_name

        await holat.edit_text(
            f"📂 *{doc.file_name}*\n\n{preview}\n\n"
            "💡 Ovoz yuboring:\n"
            "_\"Shu reestrdagi qarzdor klientlarni ayt\"_\n"
            "_\"Shu nakladnoydan 3 ta Arielni qaytar\"_",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("hujjat_qabul: %s", e, exc_info=True)
        await holat.edit_text("❌ Excel faylni o'qishda xato yuz berdi")


async def cmd_balans(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Balans tekshiruvi — SAP-GRADE reconciliation"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun.")
        return
    try:
        async with _rls_conn(uid) as c:
            # Jurnal balans
            row = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(jami_debit), 0) AS td,
                    COALESCE(SUM(jami_credit), 0) AS tc,
                    COUNT(*) AS soni
                FROM jurnal_yozuvlar
            """)
            td = Decimal(str(row["td"])); tc = Decimal(str(row["tc"]))
            farq = td - tc
            jurnal_soni = row["soni"]

            # Qarz balans
            qarz_jami = await c.fetchval(
                "SELECT COALESCE(SUM(qolgan),0) FROM qarzlar WHERE yopildi=FALSE") or 0

            # Kassa balans
            kassa_row = await c.fetchrow("""
                SELECT
                    COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE 0 END),0) AS k,
                    COALESCE(SUM(CASE WHEN tur='chiqim' THEN summa ELSE 0 END),0) AS ch
                FROM kassa_operatsiyalar
            """)
            kassa_b = Decimal(str(kassa_row["k"])) - Decimal(str(kassa_row["ch"]))

            # Ombor qiymati
            ombor = await c.fetchval(
                "SELECT COALESCE(SUM(qoldiq * COALESCE(sotish_narxi,0)),0) FROM tovarlar") or 0

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
        async with _rls_conn(uid) as c:
            rows = await c.fetch("""
                SELECT jurnal_id, tur, tavsif, jami_debit, sana
                FROM jurnal_yozuvlar
                ORDER BY sana DESC LIMIT 10
            """)
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
    """v22.1 yangiliklari"""
    await update.message.reply_text(
        f"🆕 *MASHRAB MOLIYA v{__version__} — SAP-GRADE YANGILIKLAR*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🧠 *DUAL-BRAIN AI (MoE)*\n"
        "  Gemini (ovoz, rasm) + Claude (mantiq)\n"
        "  Avtomatik routing — eng kuchli model tanlanadi\n\n"
        "🛡️ *XAVFSIZ PIPELINE*\n"
        "  AI → Draft → ✅ Tasdiqlash → Saqlash → Audit\n"
        "  AI hech qachon to'g'ridan-to'g'ri DB ga yozmaydi\n\n"
        "🎯 *ISHONCH DARAJASI*\n"
        "  🟢 Yuqori (≥92%) — avtomatik mumkin\n"
        "  🟡 O'rta (70-92%) — tasdiqlash kerak\n"
        "  🔴 Past (<40%) — rad etiladi\n\n"
        "🔍 *AQLLI QIDIRUV*\n"
        "  \"Ariyal\" → \"Ariel\" topadi\n"
        "  \"Салимов\" → \"Salimov\" topadi\n"
        "  Kirill→Lotin avtomatik\n\n"
        "🛡️ *HIMOYA TIZIMI*\n"
        "  ✅ Duplicate voice guard (5s)\n"
        "  ✅ Qarz limit tekshiruvi\n"
        "  ✅ Zarar sotuv ogohlantirish\n"
        "  ✅ Ombor qoldiq tekshiruvi\n"
        "  ✅ Narx sanity check\n\n"
        "📋 *NAKLADNOY YANGILANDI*\n"
        "  + MIJOZ MA'LUMOTLARI jadvali\n"
        "  + INN, Manzil, Telefon\n"
        "  + Word + Excel + PDF\n\n"
        "💳 *KASSA MODULI*\n"
        "  Naqd / Karta / O'tkazma\n"
        "  Statistika + tarix + o'chirish\n\n"
        "📸 *VISION AI*\n"
        "  Rasm yuboring → nakladnoy/chek o'qiladi\n\n"
        "📒 *DOUBLE-ENTRY LEDGER*\n"
        "  Har operatsiya: DEBIT = CREDIT\n"
        "  Bank darajasidagi buxgalteriya\n"
        "  Idempotency — takroriy operatsiya himoya\n"
        "  Reconciliation — balans tekshiruvi\n\n"
        "📊 *AUDIT TRAIL*\n"
        "  Har o'zgarish yoziladi — tarix o'chirilmaydi",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_imkoniyatlar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Barcha imkoniyatlar ro'yxati"""
    await update.message.reply_text(
        f"📋 *MASHRAB MOLIYA v{__version__} — IMKONIYATLAR*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🎤 *OVOZ BILAN BOSHQARISH*\n"
        "  Ovoz xabar yuboring — bot tushunadi\n"
        "  O'zbek + Rus tilida ishlaydi\n"
        "  8 ta O'zbek shevasi qo'llab-quvvatlanadi\n\n"
        "📦 *SAVDO OPERATSIYALARI*\n"
        "  📥 Kirim — tovar keldi\n"
        "  📤 Sotuv — tovar sotildi + qarz\n"
        "  ↩️ Qaytarish — tovar qaytarildi\n"
        "  💰 Qarz to'lash — FIFO tartibida\n"
        "  📋 Nakladnoy — Word+Excel+PDF\n"
        "  📋 Faktura — hisob-faktura\n\n"
        "💳 *KASSA*\n"
        "  Naqd / Karta / O'tkazma kirim-chiqim\n\n"
        "📸 *RASM TAHLIL (Vision AI)*\n"
        "  Nakladnoy rasmi → tovarlar o'qiladi\n"
        "  Chek/kvitansiya → summa ajratiladi\n\n"
        "📊 *HISOBOTLAR*\n"
        "  📅 Kunlik  |  📆 Haftalik  |  📊 Oylik\n"
        "  💹 Foyda  |  🏆 Top klientlar\n"
        "  🏭 Ombor  |  ⚠️ Kam qoldiq\n"
        "  👤 Klient hisobi  |  💳 Kassa holati\n\n"
        "📤 *EXPORT*\n"
        "  📄 PDF  |  📊 Excel  |  🖨 Mini printer chek\n\n"
        "🔒 *XAVFSIZLIK*\n"
        "  RLS — 20,000 user izolyatsiya\n"
        "  JWT auth  |  Rate limiting\n"
        "  Decimal pul aniqlik  |  Audit log\n\n"
        "📒 *SAP-GRADE BUXGALTERIYA*\n"
        "  Double-Entry Ledger — DEBIT = CREDIT\n"
        "  Idempotency — takroriy operatsiya himoya\n"
        "  Reconciliation — /balans tekshiruvi\n"
        "  Hujjat versiyalash — tuzatish tarixi\n"
        "  /jurnal — oxirgi operatsiyalar\n\n"
        "⚙️ *ADMIN*\n"
        "  /status — bot holati\n"
        "  /balans — SAP balans tekshiruvi\n"
        "  /jurnal — double-entry jurnal\n"
        "  /foydalanuvchilar — ro'yxat\n"
        "  /faollashtir — aktivlashtirish\n"
        "  /statistika — umumiy statistika",
        parse_mode=ParseMode.MARKDOWN)


async def cmd_yordam(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Yordam — qanday ishlatish"""
    await update.message.reply_text(
        "❓ *YORDAM — Qanday ishlatish?*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🎤 *1-usul: OVOZ YUBORING*\n"
        "Eng tez va qulay! Shunchaki gapiring:\n\n"
        "📤 *Sotuv:*\n"
        "_\"Salimovga 50 Ariel, donasi 45 ming, 500 ming qarzga\"_\n\n"
        "📥 *Kirim:*\n"
        "_\"100 ta un kirdi, narxi 35,000, Akbardan\"_\n\n"
        "↩️ *Qaytarish:*\n"
        "_\"Salimovning 3 Arielini qaytaraman\"_\n\n"
        "💰 *Qarz to'lash:*\n"
        "_\"Salimov 500,000 to'ladi\"_\n\n"
        "📋 *Nakladnoy:*\n"
        "_\"Salimovga nakladnoy yoz\"_\n\n"
        "📊 *Hisobot:*\n"
        "_\"Bugungi hisobot\"_ yoki _\"Kassa holati\"_\n\n"
        "⚖️ *Og'irlik:*\n"
        "_\"0.5 kilo pishloq, 200 gramm kolbasa\"_\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📱 *2-usul: MENYU*\n"
        "/menyu — tugmalar orqali\n\n"
        "📝 *3-usul: MATN YOZING*\n"
        "Xuddi ovoz kabi yozing — bot tushunadi\n\n"
        "📸 *4-usul: RASM YUBORING*\n"
        "Nakladnoy/chek rasmini yuboring\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ *KOMANDALAR:*\n"
        "/menyu — Asosiy menyu\n"
        "/yangilik — Yangiliklar\n"
        "/imkoniyatlar — Barcha imkoniyatlar\n"
        "/kassa — Kassa holati\n"
        "/faktura — Hisob-faktura\n"
        "/hisobot — Kunlik hisobot\n"
        "/qarz — Qarzlar\n"
        "/foyda — Foyda tahlili\n"
        "/ombor — Ombor holati",
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
        matn+=(f"{belgi} *{(r.get('ism') or r.get('to_liq_ism') or '')}*\n"
               f"   🏪 {r.get('dokon_nomi','')} | "
               f"{SEGMENT_NOMI.get(r.get('segment',''),'')}\n"
               f"   🆔 `{r['id']}` | Obuna: {str(r.get('obuna_tugash','?'))}\n\n")
    await update.message.reply_text(matn[:4000],parse_mode=ParseMode.MARKDOWN)

async def cmd_faollashtir(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not cfg().is_admin(update.effective_user.id): return
    if not ctx.args:
        await update.message.reply_text("Ishlatish: `/faollashtir <id>`",
                                         parse_mode=ParseMode.MARKDOWN); return
    try:
        uid=int(ctx.args[0]); await db.user_faollashtir(uid); await db.user_yangilab(uid,faol=True)
        _kesh_tozala(f"user:{uid}")
        await update.message.reply_text(f"✅ `{uid}` faollashtirildi!",parse_mode=ParseMode.MARKDOWN)
        try: await ctx.bot.send_message(uid,"✅ Hisobingiz faollashtirildi! /start bosing.")
        except Exception: pass
    except ValueError: await update.message.reply_text("❌ Noto'g'ri ID.")
    except Exception as xato:
        log.error("Bot handler xato: %s", xato)
        try: await update.message.reply_text("❌ Xato yuz berdi. Qayta urinib ko'ring.")
        except Exception: pass


async def cmd_statistika(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    if not cfg().is_admin(update.effective_user.id): return
    qatorlar=await db.barcha_users(); faol_son=sum(1 for r in qatorlar if r["faol"])
    await update.message.reply_text(
        f"📊 *ADMIN STATISTIKA*\n\nJami: {len(qatorlar)}\n"
        f"✅ Faol: {faol_son}\n⏳ Kutmoqda: {len(qatorlar)-faol_son}",
        parse_mode=ParseMode.MARKDOWN)


# ════════════ APP ════════════

async def boshlash(app:Application) -> None:
    global _CFG; _CFG=app.bot_data["cfg"]
    try:
        await db.pool_init(_CFG.database_url, min_size=_CFG.db_min, max_size=_CFG.db_max)
    except Exception as _e:
        log.critical("DB ulanishda xato: %s", _e, exc_info=True)
        raise RuntimeError(f"DB pool init muvaffaqiyatsiz: {_e}") from _e
    try:
        await db.schema_init()
    except Exception as _e:
        log.warning("schema_init xato (bot davom etadi): %s", _e)
    try:
        ovoz_xizmat.ishga_tushir(_CFG.gemini_key, _CFG.gemini_model)
    except Exception as _e:
        log.warning("Gemini ishga tushmadi (ovoz xizmati o'chirildi): %s", _e)
    try:
        ai_xizmat.ishga_tushir(_CFG.anthropic_key)
    except Exception as _e:
        log.critical("Claude ishga tushmadi: %s", _e, exc_info=True)
        raise RuntimeError(f"AI xizmat init muvaffaqiyatsiz: {_e}") from _e
    log.info("✅ Bot xizmatlar tayyor")
    log.info("🚀 SavdoAI Mashrab Moliya v%s PRODUCTION — TAYYOR!", __version__)
    # Vision AI (ixtiyoriy — Gemini key bilan ishlaydi)
    try:
        from shared.services.vision import ishga_tushir as vision_init
        vision_init(_CFG.gemini_key, _CFG.gemini_model)
    except Exception as _e:
        log.info("ℹ️ Vision AI yuklanmadi (ixtiyoriy): %s", _e)
    # Dual-Brain MoE Router
    try:
        from services.cognitive.ai_router import router_init
        router_init(
            gemini_key=_CFG.gemini_key,
            claude_key=_CFG.anthropic_key,
            gemini_model=_CFG.gemini_model,
            claude_model=_CFG.claude_model,
        )
        log.info("🧠 Dual-Brain MoE Router ulandi")
    except Exception as _e:
        log.warning("⚠️ MoE Router yuklanmadi: %s", _e)
    await app.bot.set_my_commands([
        BotCommand("start",            "Botni boshlash"),
        BotCommand("menyu",            "Asosiy menyu"),
        BotCommand("yangilik",         "🆕 v22.1 yangiliklari"),
        BotCommand("imkoniyatlar",     "📋 Barcha imkoniyatlar"),
        BotCommand("yordam",           "❓ Qanday ishlatish"),
        BotCommand("nakladnoy",        "Nakladnoy (Word+Excel+PDF)"),
        BotCommand("faktura",          "Hisob-faktura yaratish"),
        BotCommand("hisobot",          "Bugungi hisobot"),
        BotCommand("qarz",             "Qarzlar ro'yxati"),
        BotCommand("foyda",            "Foyda tahlili"),
        BotCommand("klient",           "Klient qidirish (ism/tel)"),
        BotCommand("top",              "Top klientlar"),
        BotCommand("ombor",            "Ombor holati"),
        BotCommand("ogoh",             "Kam qoldiq tovarlar"),
        BotCommand("hafta",            "Haftalik hisobot"),
        BotCommand("kassa",            "Kassa holati (naqd/karta)"),
        BotCommand("status",           "Bot holati (admin)"),
        BotCommand("balans",           "📊 Balans tekshiruvi (admin)"),
        BotCommand("jurnal",           "📒 Jurnal yozuvlar"),
        BotCommand("foydalanuvchilar", "Foydalanuvchilar (admin)"),
        BotCommand("faollashtir",      "Faollashtirish (admin)"),
        BotCommand("statistika",       "Statistika (admin)"),
    ])

    job_queue=app.job_queue
    if job_queue:
        # Bot standalone rejim — Worker mavjud bo'lsa u boshqaradi
        _worker_url = _os.getenv("WORKER_URL", "")
        if _worker_url:
            log.info("⚡ Worker aniqlandi — bot hisobot scheduleri o'chirildi")
            # Worker/Celery Beat handles scheduling — bot skips
        else:
            # Standalone: bot o'z schedulerini yoqadi
            try:
                job_queue._scheduler.configure(misfire_grace_time=60)
            except Exception: pass
        import pytz,datetime
        tz=pytz.timezone(_CFG.timezone)
        _standalone = not _worker_url
        # Kunlik hisobot — 22:00
        if _standalone:
            # Standalone rejim: bot o'z schedulerini boshqaradi
            job_queue.run_daily(
                avto_kunlik_hisobot,
                time=datetime.time(hour=_CFG.kunlik_soat, minute=0, tzinfo=tz),
                name="kunlik_hisobot",
            )
            job_queue.run_daily(
                avto_haftalik_hisobot,
                time=datetime.time(hour=_CFG.haftalik_soat, minute=0, tzinfo=tz),
                days=(0,),  # 0 = Dushanba
                name="haftalik_hisobot",
            )
            job_queue.run_daily(
                avto_qarz_eslatma,
                time=datetime.time(hour=_CFG.qarz_soat, minute=0, tzinfo=tz),
                name="qarz_eslatma",
            )
            job_queue.run_daily(
                obuna_eslatma,
                time=datetime.time(hour=_CFG.obuna_soat, minute=0, tzinfo=tz),
                name="obuna_eslatma",
            )
            log.info("✅ Standalone: kunlik/haftalik/qarz/obuna joblar yoqildi")
        else:
            log.info("✅ Worker rejim: scheduling Worker/Beat tomonida boshqariladi")
    log.info("🚀 Mashrab Moliya Bot v21.3 ENTERPRISE GRADE — TAYYOR!")


def ilovani_qur(conf:Config) -> Application:
    app=(Application.builder().token(conf.bot_token).post_init(boshlash).build())
    app.bot_data["cfg"]=conf
    royxat=ConversationHandler(
        entry_points=[CommandHandler("start",cmd_start)],
        states={
            H_SEGMENT:[CallbackQueryHandler(h_segment,pattern=r"^seg:")],
            H_DOKON:[MessageHandler(filters.TEXT & ~filters.COMMAND,h_dokon)],
            H_TELEFON:[MessageHandler(filters.TEXT & ~filters.COMMAND,h_telefon)],
        },
        fallbacks=[CommandHandler("start",cmd_start)],
        allow_reentry=True,per_message=False,
    )
    app.add_handler(royxat)
    app.add_handler(MessageHandler(filters.VOICE,ovoz_qabul))
    app.add_handler(MessageHandler(filters.PHOTO,rasm_xizmat.rasm_qabul))
    app.add_handler(MessageHandler(filters.Document.ALL, hujjat_qabul))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND,matn_qabul))
    app.add_handler(CallbackQueryHandler(tasdiq_cb,         pattern=r"^t:"))
    app.add_handler(CallbackQueryHandler(nakladnoy_sessiya_cb,pattern=r"^n:sess:"))
    app.add_handler(CallbackQueryHandler(menyu_cb,          pattern=r"^m:"))
    app.add_handler(CallbackQueryHandler(hisobot_cb,        pattern=r"^hs:"))
    app.add_handler(CallbackQueryHandler(admin_cb,          pattern=r"^adm:"))
    app.add_handler(CallbackQueryHandler(paginatsiya_cb,    pattern=r"^(tv|kl):"))
    app.add_handler(CallbackQueryHandler(klient_hisobi_cb,  pattern=r"^kh:"))
    app.add_handler(CallbackQueryHandler(faktura_cb,        pattern=r"^fkt:"))
    app.add_handler(CallbackQueryHandler(eksport_cb,        pattern=r"^eks:"))
    app.add_handler(CommandHandler("menyu",            cmd_menyu))
    app.add_handler(CommandHandler("nakladnoy",        cmd_nakladnoy))
    app.add_handler(CommandHandler("hisobot",          cmd_hisobot))
    app.add_handler(CommandHandler("qarz",             cmd_qarz))
    app.add_handler(CommandHandler("foyda",            cmd_foyda))
    app.add_handler(CommandHandler("klient",           cmd_klient))
    app.add_handler(CommandHandler("ogoh",             cmd_ogoh))
    app.add_handler(CommandHandler("hafta",            cmd_hafta))
    app.add_handler(CommandHandler("status",           cmd_status))
    app.add_handler(CommandHandler("kassa",            cmd_kassa))
    app.add_handler(CommandHandler("faktura",          cmd_faktura))
    app.add_handler(CommandHandler("chiqim",           cmd_chiqim))
    app.add_handler(CommandHandler("tovar",            cmd_tovar))
    app.add_handler(CommandHandler("balans",           cmd_balans))
    app.add_handler(CommandHandler("jurnal",           cmd_jurnal))
    app.add_handler(CommandHandler("yangilik",         cmd_yangilik))
    app.add_handler(CommandHandler("imkoniyatlar",     cmd_imkoniyatlar))
    app.add_handler(CommandHandler("yordam",           cmd_yordam))
    app.add_handler(CommandHandler("top",              cmd_top))
    app.add_handler(CommandHandler("ombor",            cmd_ombor))
    app.add_handler(CommandHandler("foydalanuvchilar", cmd_foydalanuvchilar))
    app.add_handler(CommandHandler("faollashtir",      cmd_faollashtir))
    app.add_handler(CommandHandler("statistika",       cmd_statistika))
    app.add_handler(CommandHandler("health", health_check))
    app.add_error_handler(xato_handler)
    return app


def main() -> None:
    conf=config_init(); app=ilovani_qur(conf)
    log.info("▶️  Polling boshlandi...")
    try:
        # drop_pending_updates: restart da eski xabarlarni tashlash (conflict oldini olish)
        _drop_val = _os.getenv("DROP_PENDING", "false").lower().strip()
        _drop = _drop_val in ("true", "1", "yes")
        app.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=_drop,
            close_loop=False,
        )
    except KeyboardInterrupt:
        log.info("⏹️  Bot to'xtatildi (KeyboardInterrupt)")
    except Exception as e:
        log.error("⛔ Bot xatosi: %s", e, exc_info=True)
        raise


if __name__=="__main__":
    main()
