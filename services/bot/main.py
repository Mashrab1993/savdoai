"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI MASHRAB MOLIYA  v25.3  PRODUCTION GRADE               ║
║  @savdoai_mashrab_bot                                            ║
║                                                                  ║
║  🎤 OVOZ-BIRINCHI: Ovoz yuboring — bot hamma ishni qiladi      ║
║  🧠 DUAL-BRAIN AI: Gemini (ovoz) + Claude (mantiq)             ║
║  🛡️ XAVFSIZ: Draft→Tasdiqlash→Saqlash→Audit                   ║
║  📸 VISION AI: Rasm → matn (nakladnoy, chek o'qish)            ║
║  💳 KASSA: Naqd / Karta / O'tkazma                              ║
║  📋 NAKLADNOY: Word+Excel+PDF | MIJOZ MA'LUMOTLARI             ║
║  🔒 HIMOYA: RLS + JWT + Decimal + FK + Audit Log                ║
║  📊 SAP-GRADE: Double-Entry Ledger + Reconciliation             ║
║                                                                  ║
║  v25.3 PRODUCTION YANGILIKLAR:                                   ║
║  ✅ Railway production deploy — crash-proof schema_init          ║
║  ✅ Bulletproof startup (hech qachon crash qilmaydi)            ║
║  ✅ Nixpacks + Procfile + railway.toml — 3x fallback            ║
║  ✅ Statement-by-statement SQL execution (asyncpg safe)          ║
║  ✅ Non-critical error skip (INDEX, VIEW, TRIGGER)              ║
║  ✅ Double-Entry Ledger (ikki tomonlama buxgalteriya)           ║
║  ✅ Idempotency + Hujjat versiyalash + Reconciliation           ║
║  ✅ 264 test — 100% passing                                      ║
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

# Print HMAC — productionda PRINT_SECRET majburiy (bot va API bir xil qiymat).
import shared.services.print_session  # noqa: F401

import services.bot.db  as db
from shared.database.pool import rls_conn as _rls_conn, pool_init as _pool_init
import services.bot.bot_services.voice      as ovoz_xizmat
import services.bot.bot_services.analyst    as ai_xizmat
from services.bot.bot_services.voice_pipeline import process_voice
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
__version__ = "25.3"
__author__  = "Mashrab Moliya"

# Segment nomi matnlari
SEGMENT_NOMI = {
    "optom":      "Optom savdo",
    "chakana":    "Chakana savdo",
    "oshxona":    "Oshxona / Kafe",
    "xozmak":     "Xo'zmag",
    "kiyim":      "Kiyim-kechak",
    "gosht":      "Go'sht do'koni",
    "meva":       "Meva-sabzavot",
    "qurilish":   "Qurilish mollari",
    "avto":       "Avto ehtiyot qismlar",
    "dorixona":   "Dorixona",
    "texnika":    "Texnika / Elektronika",
    "mebel":      "Mebel",
    "mato":       "Mato / Gazlama",
    "gul":        "Gul do'koni",
    "kosmetika":  "Kosmetika / Parfyumeriya",
    "universal":  "Boshqa (universal)",
}

log = logging.getLogger("mm")

# ── Turbo kesh (user = 120s, hisobot = 60s) ──────────────────────
import time as _time
_kesh: dict = {}
_KESH_TTL       = 60   # umumiy kesh TTL
_KESH_USER_TTL  = 120  # user kesh — 2 daqiqa (user har xabarda tekshiriladi)
_KESH_MAX_SIZE  = 2000  # Xotira himoyasi — maksimal kesh yozuvlar soni

def _kesh_ol(kalit: str):
    e = _kesh.get(kalit)
    if e and _time.time() - e["t"] < e.get("ttl", _KESH_TTL):
        return e["v"]
    # Expired — tozalash
    if e:
        _kesh.pop(kalit, None)
    return None

def _kesh_yoz(kalit: str, qiymat, ttl: int = _KESH_TTL) -> None:
    # Bounded cleanup — xotira himoyasi
    if len(_kesh) >= _KESH_MAX_SIZE:
        now = _time.time()
        expired = [k for k, v in _kesh.items() if now - v["t"] >= v.get("ttl", _KESH_TTL)]
        for k in expired:
            _kesh.pop(k, None)
        # Agar hali ham ko'p — eng eskilarini o'chirish
        if len(_kesh) >= _KESH_MAX_SIZE:
            oldest = sorted(_kesh.items(), key=lambda x: x[1]["t"])[:_KESH_MAX_SIZE // 4]
            for k, _ in oldest:
                _kesh.pop(k, None)
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
        user = dict(user)  # asyncpg.Record → dict (.get() ishlashi uchun)
        _kesh_yoz(k, user, _KESH_USER_TTL)
    return user


async def health_check(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Railway health monitoring — v25.3"""
    import time as _t
    start = _t.monotonic()
    # DB ping
    try:
        from shared.database.pool import pool_health
        import asyncio
        db_info = await asyncio.wait_for(pool_health(), timeout=5)
        db_ms = db_info.get("ping_ms", "?")
        db_status = f"✅ DB: {db_ms}ms (pool: {db_info.get('used',0)}/{db_info.get('size',0)})"
    except Exception:
        db_status = "⚠️ DB: tekshirib bo'lmadi"
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
    """Global xato handler — hech narsa jimgina o'tmaydi"""
    import traceback
    xato = ctx.error

    # Deploy paytida Conflict normal — log spam oldini olish
    if "Conflict" in str(type(xato).__name__) or "terminated by other" in str(xato):
        log.info("🔄 Deploy: eski instance to'xtatilmoqda (normal)")
        return

    tb   = "".join(traceback.format_exception(type(xato), xato, xato.__traceback__))
    log.error("⛔ Global xato:\n%s", tb)

    # Adminlarga xabar berish
    try:
        if _CFG:
            for aid in _CFG.admin_ids:
                await ctx.bot.send_message(
                    aid,
                    f"⛔ *Bot xatosi*\n\n"
                    "Xato yuz berdi",
                    parse_mode=ParseMode.MARKDOWN,
                )
    except Exception as _exc:
        log.debug("%s: %s", "main", _exc)  # was silent

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
    from telegram import WebAppInfo
    _dash_url = _os.getenv("WEB_URL", "https://savdoai-production.up.railway.app") + "/dashboard"
    buttons = [
        [InlineKeyboardButton("📥 Kirim", callback_data="m:kirim"),
         InlineKeyboardButton("📤 Sotuv", callback_data="m:chiqim")],
        [InlineKeyboardButton("↩️ Qaytarish", callback_data="m:qaytarish"),
         InlineKeyboardButton("💰 Qarz to'lash", callback_data="m:qarzlar")],
        [InlineKeyboardButton("📋 Nakladnoy", callback_data="m:nakladnoy"),
         InlineKeyboardButton("📋 Faktura", callback_data="m:faktura")],
        [InlineKeyboardButton("📦 Tovarlar", callback_data="m:tovarlar"),
         InlineKeyboardButton("👥 Klientlar", callback_data="m:klientlar")],
        [InlineKeyboardButton("📊 Hisobot", callback_data="m:hisobot"),
         InlineKeyboardButton("💹 Foyda", callback_data="m:foyda")],
        [InlineKeyboardButton("💳 Kassa", callback_data="m:kassa"),
         InlineKeyboardButton("📸 Rasm OCR", callback_data="m:rasm")],
        [InlineKeyboardButton("🏭 Ombor", callback_data="m:ombor"),
         InlineKeyboardButton("⚠️ Kam qoldiq", callback_data="m:ogoh")],
        [InlineKeyboardButton("📒 Jurnal", callback_data="m:jurnal"),
         InlineKeyboardButton("📊 Balans", callback_data="m:balans")],
        [InlineKeyboardButton("👥 Shogirdlar", callback_data="m:shogirdlar"),
         InlineKeyboardButton("🏷 Narx guruh", callback_data="m:narx")],
        [InlineKeyboardButton("📱 Dashboard", web_app=WebAppInfo(url=_dash_url))],
        [InlineKeyboardButton("🆕 Yangiliklar", callback_data="m:yangilik"),
         InlineKeyboardButton("❓ Yordam", callback_data="m:yordam")],
    ]
    return InlineKeyboardMarkup(buttons)


def _md_safe(text: str) -> str:
    """MARKDOWN maxsus belgilarni escape qilish"""
    for ch in ('_', '*', '`', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'):
        text = text.replace(ch, '\\' + ch)
    return text


def _truncate(text: str, limit: int = 4000) -> str:
    """Telegram 4096 limit — xavfsiz qisqartirish"""
    if len(text) <= limit:
        return text
    return text[:limit] + "\n\n... (qisqartirildi)"


async def _safe_reply(update_or_msg, matn: str, **kw) -> None:
    """Xavfsiz xabar yuborish — truncation + MARKDOWN fallback"""
    matn = _truncate(matn)
    msg = update_or_msg.message if hasattr(update_or_msg, 'message') else update_or_msg
    try:
        await msg.reply_text(matn, **kw)
    except BadRequest as e:
        if "parse" in str(e).lower() or "entities" in str(e).lower():
            kw.pop("parse_mode", None)
            clean = matn.replace("*","").replace("_","").replace("`","")
            await msg.reply_text(_truncate(clean), **kw)
        else:
            log.warning("safe_reply: %s", e)


async def xat(q, matn:str, **kw) -> None:
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
                clean = matn.replace("*","").replace("_","").replace("`","")
                await q.edit_message_text(clean, **kw)
            except Exception:
                pass
        else:
            log.warning("xat: %s", e)


async def _chek_thermal_va_pdf_yuborish(
    message,
    data: dict,
    dokon: str,
    stem: str,
    amal: str | None = None,
) -> None:
    """Mini-printer: UTF-8 thermal .txt (asosiy) + PDF (arxiv)."""
    from shared.receipt.output import thermal_txt_and_payload

    txt_b, d = thermal_txt_and_payload(data, dokon, 80, amal)
    pdf_b = pdf_xizmat.chek_pdf(d, dokon)
    await message.reply_document(
        document=InputFile(io.BytesIO(txt_b), filename=f"{stem}_thermal.txt"),
        caption=(
            "🖨 *Thermal chek* — 80mm matn fayl (printer uchun)\n"
            "_Keyingi xabar: PDF (arxiv)._"
        ),
        parse_mode=ParseMode.MARKDOWN,
    )
    await message.reply_document(
        document=InputFile(io.BytesIO(pdf_b), filename=f"{stem}.pdf"),
        caption="📎 PDF (arxiv)",
        parse_mode=ParseMode.MARKDOWN,
    )


async def faol_tekshir(update:Update) -> bool:
    import datetime
    uid=update.effective_user.id
    user=await _user_ol_kesh(uid)
    if not user: msg="❌ Siz ro'yxatdan o'tmagansiz. /start bosing."
    elif not user.get("faol", False): msg="⏳ Hisobingiz hali tasdiqlanmagan."
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

async def cmd_start(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    log.info("📩 /start: uid=%d name=%s", uid, update.effective_user.full_name)
    try:
        user=await _user_ol_kesh(uid)
    except Exception as _e:
        log.error("❌ /start user_ol xato: %s", _e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi. Qayta /start bosing.")
        return ConversationHandler.END
    if user and user.get("faol", False):
        kam=await db.kam_qoldiq_tovarlar(uid)
        ogoh=""
        if kam: ogoh=f"\n\n⚠️ Kam qoldiq: {', '.join(t['nomi'] for t in kam[:3])}"
        await update.message.reply_text(
            f"👋 Xush kelibsiz, *{user.get('to_liq_ism') or user.get('ism', 'Foydalanuvchi')}*!\n"
            f"🏪 {user.get('dokon_nomi', 'Mening Do`konim')}  |  "
            f"{SEGMENT_NOMI.get(user.get('segment', 'universal'), '')}\n\n"
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
            parse_mode=ParseMode.MARKDOWN, reply_markup=asosiy_menyu(),
        )
        return ConversationHandler.END
    if user and not user.get("faol", False):
        await update.message.reply_text("⏳ Hisobingiz tasdiqlanmagan.")
        return ConversationHandler.END
    await db.user_yoz(uid,
        update.effective_user.full_name or "Nomsiz",
        update.effective_user.username)
    await update.message.reply_text(
        "👋 *Mashrab Moliya*ga xush kelibsiz!\n\nBiznes turini tanlang:",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=tg(
            [("🏭 Optom (ulgurji)",     "seg:optom")],
            [("🏪 Chakana (mayda)",     "seg:chakana")],
            [("🍽️ Oshxona / Kafe",     "seg:oshxona")],
            [("🍦 Xo'zmag",            "seg:xozmak")],
            [("👔 Kiyim-kechak",       "seg:kiyim")],
            [("🥩 Go'sht do'koni",     "seg:gosht")],
            [("🍎 Meva-sabzavot",      "seg:meva")],
            [("🧱 Qurilish mollari",   "seg:qurilish")],
            [("🚗 Avto ehtiyot qismlar","seg:avto")],
            [("💊 Dorixona",           "seg:dorixona")],
            [("📱 Texnika / Elektronika","seg:texnika")],
            [("🛋️ Mebel",              "seg:mebel")],
            [("🧵 Mato / Gazlama",     "seg:mato")],
            [("🌹 Gul do'koni",        "seg:gul")],
            [("💄 Kosmetika",          "seg:kosmetika")],
            [("🛒 Boshqa (universal)", "seg:universal")],
        ),
    )
    return H_SEGMENT


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

    # ── Tayyor tovar bazasini yuklash (segment bo'yicha) ──
    seed_soni = 0
    try:
        from shared.services.seed_catalog import seed_tovarlar
        from shared.database.pool import get_pool
        async with db._P().acquire() as c:
            seed_soni = await seed_tovarlar(c, uid, seg)
    except Exception as _seed_e:
        log.warning("Seed catalog xato uid=%d: %s", uid, _seed_e)

    seed_msg = f"\n📦 {seed_soni} ta tayyor tovar yuklandi!" if seed_soni else ""
    await update.message.reply_text(
        f"✅ Ro'yxatdan o'tdingiz!{seed_msg}\n⏳ Admin tasdiqlaguncha kuting."
    )
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
    from shared.services.guards import is_duplicate_message
    if is_duplicate_message(uid, f"voice:{update.message.voice.file_id}"): return

    voice_dur = update.message.voice.duration or 0  # Telegram bergan davomiylik (sekund)
    uzun_audio = voice_dur > 30  # 30s+ → VAD + chunking pipeline

    # Faqat ⏳ — matn yo'q
    holat = await update.message.reply_text(
        f"⏳ {voice_dur}s audio qayta ishlanmoqda..." if uzun_audio else "⏳"
    )

    tmp_path = None
    try:
        fayl=await ctx.bot.get_file(update.message.voice.file_id)
        audio=bytes(await fayl.download_as_bytearray())
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(audio)
            tmp_path = tmp.name

        if uzun_audio:
            # ── UZUN AUDIO: VAD (shovqin tozalash) + Chunking + Parallel Gemini ──
            async def _progress(pct, text):
                try: await holat.edit_text(f"⏳ {pct}% — {text}")
                except Exception: pass
            matn = await ovoz_xizmat.ovoz_matn_uzun(
                tmp_path, progress_callback=_progress, uid=uid
            )
        else:
            # ── QISQA AUDIO: to'g'ridan-to'g'ri Gemini ──
            matn = await ovoz_xizmat.matnga_aylantir(tmp_path, uid=uid)

        if not matn:
            try:
                from shared.services.suhbatdosh import tushunilmadi
                await holat.edit_text(tushunilmadi())
            except Exception:
                await holat.edit_text("🤔 Tushunolmadim. Yana bir bor aytib ko'ring.")
            return
        pipeline_result = await process_voice(matn, user_id=uid)
        if pipeline_result.get("confidence") == "none":
            await holat.edit_text(
                "🔇 Ovoz eshitilmadi. Iltimos qayta yuboring.\n"
                "💡 Masalan: \"Nasriddin akaga 2 Ariel 56000\""
            )
            return
        # LOW va MEDIUM confidence ham Claude ga yuboriladi —
        # Claude Sonnet kontekstdan tushunadi, foydalanuvchiga draft ko'rsatadi
        matn = pipeline_result.get("text") or matn

        # Shogird xarajat tekshiruvi (ovoz uchun)
        if not cfg().is_admin(uid):
            try:
                from shared.services.shogird_xarajat import shogird_topish_tg
                from shared.database.pool import get_pool
                pool = get_pool()
                async with pool.acquire() as raw_conn:
                    shogird = await shogird_topish_tg(raw_conn, uid)
                if shogird:
                    handled = await _shogird_xarajat_qabul(update, ctx, matn, shogird)
                    if handled:
                        try: await holat.delete()
                        except Exception: pass
                        return
            except Exception as _se:
                log.debug("Shogird ovoz: %s", _se)

        # ⏳ o'chirib, natija yuborish
        try: await holat.delete()
        except Exception: pass

        # ═══ OVOZDA "CHEK CHIQAR" TEKSHIRUVI ═══
        try:
            from shared.services.print_intent import detect_print_intent
            from shared.services.bot_print_handler import handle_print_intent_message
            _pk = detect_print_intent(matn)
            if _pk:
                if await handle_print_intent_message(update, ctx, _pk, db):
                    return
        except Exception as _pi:
            log.debug("Print intent (ovoz): %s", _pi)

        await _qayta_ishlash(update,ctx,matn)
    except Exception as xato:
        log.error("ovoz_qabul: %s",xato,exc_info=True)
        try:
            await holat.edit_text("❌ Xato yuz berdi")
        except Exception:
            try: await update.message.reply_text("❌ Xato yuz berdi")
            except Exception: pass
    finally:
        if tmp_path:
            try: __import__("os").unlink(tmp_path)
            except Exception: pass


async def matn_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    if not _flood_ok(uid): return
    if not await faol_tekshir(update): return
    matn=(update.message.text or "").strip()
    if not matn or matn.startswith("/"): return
    # Duplicate guard
    from shared.services.guards import is_duplicate_message
    if is_duplicate_message(uid, matn): return

    # ═══ TAHRIRLASH REJIMI (BIRINCHI tekshiriladi!) ═══
    tahr_rejim = ctx.user_data.get("_tahr_rejim")
    if tahr_rejim and ctx.user_data.get("kutilayotgan"):
      try:
        natija = ctx.user_data["kutilayotgan"]
        tovarlar = natija.get("tovarlar", [])
        xabar = ""
        
        if tahr_rejim == "klient":
            eski = natija.get("klient", "yo'q")
            natija["klient"] = matn.strip()
            xabar = f"✅ Klient: {eski} → {matn.strip()}"
        
        elif tahr_rejim == "narx":
            qismlar = matn.strip().split()
            if len(qismlar) >= 2 and qismlar[0].lower() == "hammasi":
                narx = float(qismlar[1].replace(",","").replace(".",""))
                for t in tovarlar:
                    t["narx"] = narx
                    t["jami"] = narx * float(t.get("miqdor", 0))
                xabar = f"✅ Barcha narxlar: {narx:,.0f} so'm"
            elif len(qismlar) >= 2:
                try:
                    idx = int(qismlar[0]) - 1
                    narx = float(qismlar[1].replace(",","").replace(".",""))
                    if 0 <= idx < len(tovarlar):
                        tovarlar[idx]["narx"] = narx
                        tovarlar[idx]["jami"] = narx * float(tovarlar[idx].get("miqdor", 0))
                        xabar = f"✅ {tovarlar[idx]['nomi']} narxi: {narx:,.0f} so'm"
                    else:
                        xabar = f"❌ Tovar #{qismlar[0]} topilmadi (1-{len(tovarlar)})"
                except ValueError:
                    xabar = "❌ Noto'g'ri format. Masalan: 1 45000 yoki hammasi 50000"
            else:
                try:
                    narx = float(matn.replace(",","").replace(".","").replace(" ",""))
                    for t in tovarlar:
                        t["narx"] = narx
                        t["jami"] = narx * float(t.get("miqdor", 0))
                    xabar = f"✅ Barcha narxlar: {narx:,.0f} so'm"
                except ValueError:
                    xabar = "❌ Raqam kiriting. Masalan: 45000 yoki 1 45000"
        
        elif tahr_rejim == "miqdor":
            qismlar = matn.strip().split()
            if len(qismlar) >= 2 and qismlar[0].lower() == "hammasi":
                miqdor = float(qismlar[1].replace(",",""))
                for t in tovarlar:
                    t["miqdor"] = miqdor
                    t["jami"] = float(t.get("narx", 0)) * miqdor
                xabar = f"✅ Barcha miqdorlar: {miqdor:,.0f}"
            elif len(qismlar) >= 2:
                try:
                    idx = int(qismlar[0]) - 1
                    miqdor = float(qismlar[1].replace(",",""))
                    if 0 <= idx < len(tovarlar):
                        tovarlar[idx]["miqdor"] = miqdor
                        tovarlar[idx]["jami"] = float(tovarlar[idx].get("narx", 0)) * miqdor
                        xabar = f"✅ {tovarlar[idx]['nomi']} miqdori: {miqdor:,.0f}"
                    else:
                        xabar = f"❌ Tovar #{qismlar[0]} topilmadi (1-{len(tovarlar)})"
                except ValueError:
                    xabar = "❌ Noto'g'ri format. Masalan: 1 100 yoki hammasi 50"
            else:
                xabar = "❌ Masalan: 1 100 yoki hammasi 50"
        
        elif tahr_rejim == "qarz":
            matn_t = matn.strip().lower().replace(",","").replace(".","").replace(" ","")
            jami = float(natija.get("jami_summa", 0))
            if matn_t == "hammasi":
                natija["qarz"] = jami
                natija["tolangan"] = 0
                xabar = f"✅ To'liq qarzga: {jami:,.0f} so'm"
            else:
                try:
                    qarz_y = float(matn_t)
                    if qarz_y > jami:
                        qarz_y = jami
                    natija["qarz"] = qarz_y
                    natija["tolangan"] = max(jami - qarz_y, 0)
                    xabar = f"✅ Qarz: {qarz_y:,.0f} | To'langan: {jami - qarz_y:,.0f}"
                except ValueError:
                    xabar = "❌ Raqam kiriting. Masalan: 500000 yoki hammasi"
        
        # Jami summani qayta hisoblash
        if tovarlar:
            natija["jami_summa"] = sum(float(t.get("jami", 0)) for t in tovarlar)
            if tahr_rejim != "qarz":
                qarz = float(natija.get("qarz", 0))
                natija["tolangan"] = max(natija["jami_summa"] - qarz, 0)
        
        ctx.user_data["kutilayotgan"] = natija
        ctx.user_data.pop("_tahr_rejim", None)
        
        # Yangilangan preview (MARKDOWN o'chirildi — xavfsiz)
        try:
            oldindan = ai_xizmat.oldindan_korinish(natija)
        except Exception:
            oldindan = f"Klient: {natija.get('klient','')}\nJami: {float(natija.get('jami_summa',0) or 0):,.0f}"
        markup=tg(
            [("✅ Saqlash","t:ha"),("❌ Bekor","t:yoq")],
            [("✏️ Klient","t:tahr:klient"),("✏️ Narx","t:tahr:narx")],
            [("✏️ Miqdor","t:tahr:miqdor"),("✏️ Qarz","t:tahr:qarz")],
        )
        await update.message.reply_text(
            f"{xabar}\n\n{'─'*26}\n\n{oldindan}",
            reply_markup=markup
        )
        return
      except Exception as _tahr_e:
        log.error("Tahrirlash xato: %s", _tahr_e, exc_info=True)
        ctx.user_data.pop("_tahr_rejim", None)
        await update.message.reply_text("❌ Tahrirlash xatosi. Qaytadan yuboring.")
        return

    # ═══ SHOGIRD XARAJAT TEKSHIRUVI ═══
    if not cfg().is_admin(uid):
        try:
            from shared.services.shogird_xarajat import shogird_topish_tg
            from shared.database.pool import get_pool
            pool = get_pool()
            async with pool.acquire() as raw_conn:
                shogird = await shogird_topish_tg(raw_conn, uid)
            if shogird:
                handled = await _shogird_xarajat_qabul(update, ctx, matn, shogird)
                if handled:
                    return
        except Exception as _se:
            log.debug("Shogird tekshiruv: %s", _se)

    # ═══ PRINTER / CHEK (matn: "printer chek", "qayta chek", ...) ═══
    try:
        from shared.services.print_intent import detect_print_intent
        from shared.services.bot_print_handler import handle_print_intent_message

        _pk = detect_print_intent(matn)
        if _pk:
            if await handle_print_intent_message(update, ctx, _pk, db):
                return
    except Exception as _pi:
        log.debug("Print intent: %s", _pi)

    # ═══ OCHIQ SAVAT BUYRUQLARI ═══

    # 1. "Klient bo'ldi / tugadi" → savat yopish
    import re as _re_savat
    _boldi_pattern = _re_savat.match(
        r"^(.+?)\s+(boldi|bo'ldi|tugadi|yopish|tamom|yop|nakladnoy|chek)\s*$",
        matn, _re_savat.IGNORECASE
    )
    if _boldi_pattern:
        _savat_klient = _boldi_pattern.group(1).strip()
        try:
            from shared.services.ochiq_savat import savat_ol
            async with db._P().acquire() as _sc:
                _savat = await savat_ol(_sc, uid, _savat_klient)
            if _savat:
                await _savat_yop_va_nakladnoy(update, uid, _savat_klient, ctx)
                return
        except Exception as _se:
            log.debug("Savat boldi: %s", _se)

    # 2. "Klient savat / savati" → ko'rish
    _savat_kor = _re_savat.match(
        r"^(.+?)\s+(savat|savati|yuklari)\s*$",
        matn, _re_savat.IGNORECASE
    )
    if _savat_kor:
        _sk_klient = _savat_kor.group(1).strip()
        try:
            from shared.services.ochiq_savat import savat_korish, savat_matn
            async with db._P().acquire() as _sc2:
                _sk_data = await savat_korish(_sc2, uid, _sk_klient)
            if _sk_data:
                await update.message.reply_text(savat_matn(_sk_data))
                return
        except Exception as _se2:
            log.debug("Savat korish: %s", _se2)

    # 3. "savatlar" → ochiq savatlar
    if matn.lower().strip() in ("savatlar", "savatlarim", "ochiq savatlar"):
        try:
            from shared.services.ochiq_savat import ochiq_savatlar, ochiq_savatlar_matn
            async with db._P().acquire() as _sc3:
                _svtlr = await ochiq_savatlar(_sc3, uid)
            await update.message.reply_text(ochiq_savatlar_matn(_svtlr))
            return
        except Exception as _se3:
            log.debug("Savatlar: %s", _se3)

    # 4. "kunlik yakuniy" → statistika
    if matn.lower().strip() in ("kunlik yakuniy", "yakuniy", "bugungi yakuniy"):
        try:
            from shared.services.ochiq_savat import kunlik_yakuniy, kunlik_yakuniy_matn
            async with db._P().acquire() as _sc4:
                _yk = await kunlik_yakuniy(_sc4, uid)
            await update.message.reply_text(kunlik_yakuniy_matn(_yk))
            return
        except Exception as _se4:
            log.debug("Yakuniy: %s", _se4)

    # ═══ 4.1 KONTEKSTLI SAVAT — "yana 20 Tide qo'sh" ═══
    if ctx.user_data.get("kutilayotgan") or ctx.user_data.get("_oxirgi_klient"):
        try:
            from shared.services.advanced_features import kontekst_bormi, kontekst_tozala
            if kontekst_bormi(matn):
                _toza = kontekst_tozala(matn)
                _oxirgi = ctx.user_data.get("kutilayotgan") or {}
                _klient = _oxirgi.get("klient") or ctx.user_data.get("_oxirgi_klient", "")
                if _klient and _toza:
                    # Kontekstni Claude ga yuborish — klient qo'shilgan
                    matn = f"{_klient}ga {_toza}"
                    log.info("Kontekst: '%s' → '%s'", update.message.text, matn)
        except Exception as _ke:
            log.debug("Kontekst: %s", _ke)

    # ═══ 4.2 TUZATISH — "50 emas 30", "narxini 45000 qil" ═══
    if ctx.user_data.get("kutilayotgan"):
        try:
            from shared.services.advanced_features import tuzatish_bormi, tuzatish_ajrat
            if tuzatish_bormi(matn):
                _tuz = tuzatish_ajrat(matn)
                if _tuz:
                    _draft = ctx.user_data["kutilayotgan"]
                    _tovarlar = _draft.get("tovarlar", [])
                    _ozgardi = False
                    
                    if _tuz.get("tur") == "miqdor" and _tovarlar:
                        # Oxirgi tovar miqdorini o'zgartirish
                        if _tuz.get("eski"):
                            # "50 emas 30" — 50 ni 30 ga
                            for _tv in _tovarlar:
                                if int(_tv.get("miqdor",0)) == _tuz["eski"]:
                                    _tv["miqdor"] = _tuz["yangi"]
                                    _tv["jami"] = _tuz["yangi"] * float(_tv.get("narx",0))
                                    _ozgardi = True; break
                        else:
                            # "miqdorni 30 ga" — oxirgi tovar
                            _tovarlar[-1]["miqdor"] = _tuz["yangi"]
                            _tovarlar[-1]["jami"] = _tuz["yangi"] * float(_tovarlar[-1].get("narx",0))
                            _ozgardi = True
                    
                    elif _tuz.get("tur") == "narx" and _tovarlar:
                        _tovarlar[-1]["narx"] = _tuz["yangi"]
                        _tovarlar[-1]["jami"] = float(_tovarlar[-1].get("miqdor",0)) * _tuz["yangi"]
                        _ozgardi = True
                    
                    if _ozgardi:
                        _draft["jami_summa"] = sum(float(t.get("jami",0)) for t in _tovarlar)
                        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
                        _preview = "✏️ *TUZATILDI:*\n\n"
                        for _i, _tv in enumerate(_tovarlar, 1):
                            _preview += f"  {_i}. {_tv.get('nomi','?')} — {_tv.get('miqdor',0)} × {pul(_tv.get('narx',0))} = {pul(_tv.get('jami',0))}\n"
                        _preview += f"\n💰 Jami: *{pul(_draft['jami_summa'])}*"
                        await update.message.reply_text(
                            _preview, parse_mode=ParseMode.MARKDOWN,
                            reply_markup=InlineKeyboardMarkup([
                                [InlineKeyboardButton("✅ Tasdiqlash", callback_data="t:ha")],
                                [InlineKeyboardButton("❌ Bekor", callback_data="t:yoq")],
                            ]))
                        return
        except Exception as _te:
            log.debug("Tuzatish: %s", _te)

    # ═══ 4.3 HUJJAT SAVOL-JAVOB ═══
    if ctx.user_data.get("hujjat"):
        _h = ctx.user_data["hujjat"]
        
        # EXCEL PRO — HAR QANDAY savol AI ga yuboriladi, HECH QACHON o'tkazib yuborilmaydi
        if _h.get("tur") == "xlsx_pro":
            log.info("📊 Excel savol: '%s'", matn[:50])
            try:
                from shared.services.excel_reader import excel_ai_savol, _oddiy_izlash
                _javob = await excel_ai_savol(_h, matn, _CFG.gemini_key)
            except Exception as _ee:
                log.error("📊 Excel AI xato: %s", _ee)
                try:
                    from shared.services.excel_reader import _oddiy_izlash
                    _javob = _oddiy_izlash(_h, matn)
                except Exception:
                    _javob = f"❌ Excel tahlilida xato. Qayta urinib ko'ring."
            try:
                await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
            except Exception:
                await update.message.reply_text(_javob.replace("*","").replace("_",""))
            return  # DOIM return — hech qachon o'tkazib yuborma
        
        # Boshqa hujjatlar (PDF, Word, EPUB...)
        try:
            from shared.services.hujjat_oqish import (
                hujjat_sorov_bormi, hujjatdan_izlash, ai_savol_kerakmi, ai_hujjat_savol
            )
            if hujjat_sorov_bormi(matn) or ai_savol_kerakmi(matn):
                # Avval oddiy izlash
                _javob = hujjatdan_izlash(_h, matn)
                
                # Topilmadi yoki AI kerak → Gemini bilan tahlil
                if ("topilmadi" in _javob.lower() or ai_savol_kerakmi(matn)):
                    try:
                        _ai_javob = await ai_hujjat_savol(_h, matn, _CFG.gemini_key)
                        if _ai_javob and "topilmadi" not in _ai_javob.lower():
                            _javob = _ai_javob
                    except Exception:
                        pass
                
                await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
                return
        except Exception as _he:
            log.debug("Hujjat savol: %s", _he)

    # ═══ 4.5 SUHBAT ANIQLASH — FAQAT salom, raxmat, yordam ═══
    # Savdo/biznes savollarni USHLAB QOLMASIN!
    try:
        _m_lower = matn.lower().strip()
        _biznes_sozlar = ("savdo", "sotuv", "sotdim", "qarz", "narx", "foyda", 
                          "tovar", "klient", "hisobot", "excel", "ariel", "tide",
                          "qancha", "nechta", "yaxshi", "yomon", "maslahat",
                          "tahlil", "ombor", "kirim", "chiqim")
        _biznes_msg = any(s in _m_lower for s in _biznes_sozlar)
        
        if not _biznes_msg:
            from shared.services.suhbatdosh import suhbat_turini_aniqla, suhbat_javob
            _suhbat = suhbat_turini_aniqla(matn)
            if _suhbat:
                _user = await _user_ol_kesh(uid)
                _ism = (_user.get("ism") or "").split()[0] if _user and _user.get("ism") else ""
                _javob = suhbat_javob(_suhbat, _ism)
                if _javob:
                    await update.message.reply_text(_javob)
                    return
    except Exception as _sh_e:
        log.debug("Suhbat: %s", _sh_e)

    # ═══ 5. OVOZLI HISOBOT — Claude ni chaqirmasdan tezkor javob ═══
    _hisobot_sozlar = (
        "bugungi sotuv", "bugungi hisobot", "kunlik hisobot",
        "haftalik hisobot", "oylik hisobot", "qarzlar hisoboti",
        "qancha sotdim", "qancha sotuv", "bugungi savdo",
        "haftalik savdo", "foyda qancha", "qarz qancha",
        "hisobot ber", "hisobot ko'rsat", "hisobot",
        "сегодня продажа", "отчет", "за неделю", "долги",
        "sotuv qancha", "bugun qancha",
        "hisobot excel", "excel hisobot", "oylik excel",
        "haftalik excel", "kunlik excel",
        # YANGI — ko'proq trigger
        "bugun savdo", "savdo qanday", "savdo yaxshi",
        "bugun nechta", "bugun qancha", "bugun foyda",
        "kechagi savdo", "kechagi sotuv",
        "sotuv yaxshi", "sotuv qanday",
    )
    _ml = matn.lower().strip()
    _hisobot_match = any(s in _ml for s in _hisobot_sozlar)
    _excel_so_rov = "excel" in _ml or "xlsx" in _ml
    if _hisobot_match:
        try:
            from shared.services.hisobot_engine import (
                kunlik, haftalik, oylik, qarz_hisobot,
                hisobot_matn, qarz_hisobot_matn, hisobot_turini_aniqla
            )
            from shared.database.pool import get_pool
            tur = hisobot_turini_aniqla(matn)
            async with db._P().acquire() as _hc:
                if tur == "qarz":
                    _hd = await qarz_hisobot(_hc, uid)
                    _hbody = qarz_hisobot_matn(_hd)
                elif tur == "oylik":
                    _hd = await oylik(_hc, uid)
                    _hbody = hisobot_matn(_hd)
                elif tur == "haftalik":
                    _hd = await haftalik(_hc, uid)
                    _hbody = hisobot_matn(_hd)
                else:
                    _hd = await kunlik(_hc, uid)
                    _hbody = hisobot_matn(_hd)

            # Suhbat uslubi — iliq kirish va tavsiya
            if tur != "qarz" and isinstance(_hd, dict):
                try:
                    from shared.services.suhbatdosh import hisobot_kirish, hisobot_tavsiya
                    _intro = hisobot_kirish(tur, _hd.get("sotuv_jami", 0), _hd.get("foyda", 0))
                    _tavs = hisobot_tavsiya(_hd)
                    _hbody = _intro + "\n\n" + _hbody + _tavs
                except Exception:
                    pass

            # Excel so'ralgan bo'lsa → fayl yuborish
            if _excel_so_rov and tur != "qarz":
                try:
                    import services.bot.bot_services.export_excel as _exl
                    _user = await _user_ol_kesh(uid)
                    _dokon = (_user.get("dokon_nomi") or "Mashrab Moliya") if _user else "Mashrab Moliya"
                    _excel_bytes = _exl.hisobot_excel(_hd, _dokon)
                    _sana_s = _hd.get("sana", "").replace(".", "").replace(" ", "_")[:15]
                    _nom = f"hisobot_{tur}_{_sana_s}.xlsx"
                    await update.message.reply_text(_hbody, parse_mode=ParseMode.MARKDOWN)
                    await update.message.reply_document(
                        document=InputFile(io.BytesIO(_excel_bytes), filename=_nom),
                        caption=f"📊 {tur.capitalize()} hisobot Excel")
                    return
                except Exception as _ex_e:
                    log.warning("Hisobot Excel: %s", _ex_e)

            # Tugma bilan javob
            _h_markup = tg(
                [("📊 Excel", f"hisob_excel:{tur}")],
            ) if tur != "qarz" else None
            await update.message.reply_text(
                _hbody, parse_mode=ParseMode.MARKDOWN,
                reply_markup=_h_markup)

            # ═══ OVOZLI XULOSA (TTS) ═══
            if tur != "qarz" and isinstance(_hd, dict):
                try:
                    from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, hisobot_xulosa
                    if tts_tayyor():
                        xulosa = hisobot_xulosa(_hd)
                        ogg = await matn_ovozga(xulosa)
                        if ogg:
                            await update.message.reply_voice(
                                voice=io.BytesIO(ogg),
                                caption="🔊 Ovozli xulosa")
                except Exception as _tts_e:
                    log.debug("TTS hisobot: %s", _tts_e)

            return
        except Exception as _he:
            log.warning("PRE-AI hisobot xato (davom etadi): %s", _he)

    # ═══ 6. KLIENT QARZ SO'ROVI — "Salimovning qarzi qancha?" ═══
    try:
        from shared.services.hisobot_engine import (
            klient_qarz_sorovi, klient_nomini_ajrat,
            klient_qarz_tarix, klient_qarz_tarix_matn
        )
        if klient_qarz_sorovi(matn):
            kl_ism = klient_nomini_ajrat(matn)
            if kl_ism:
                from shared.database.pool import get_pool
                async with db._P().acquire() as _kc:
                    _kd = await klient_qarz_tarix(_kc, uid, kl_ism)
                if _kd:
                    _kbody = klient_qarz_tarix_matn(_kd)
                    kid = _kd["klient"]["id"]
                    await update.message.reply_text(
                        _kbody, parse_mode=ParseMode.MARKDOWN,
                        reply_markup=tg(
                            [(f"📄 {kl_ism} PDF hisobi", f"eks:pdf:klient:{kid}")],
                            [(f"📊 Excel hisobi", f"eks:xls:klient:{kid}")],
                        )
                    )
                    return
                else:
                    await update.message.reply_text(
                        f"❌ '{kl_ism}' ismli klient topilmadi.\n"
                        "Klient ismini to'liqroq ayting.")
                    return
    except Exception as _ke:
        log.debug("Klient qarz shortcut: %s", _ke)

    # ═══ 7. SMART BUYRUQLAR — narx, reyting, trend, inventarizatsiya ═══
    try:
        from shared.services.smart_bot_engine import (
            smart_buyruq_aniqla, narx_tavsiya, narx_tavsiya_matn,
            narx_tovar_ajrat, klient_reyting, klient_reyting_matn,
            haftalik_trend, haftalik_trend_matn,
        )
        _smart_cmd = smart_buyruq_aniqla(matn)
        if _smart_cmd:
            from shared.database.pool import get_pool
            async with db._P().acquire() as _sc:
                if _smart_cmd == "narx_tavsiya":
                    _tv_nom = narx_tovar_ajrat(matn)
                    if _tv_nom:
                        _nd = await narx_tavsiya(_sc, uid, _tv_nom)
                        await update.message.reply_text(
                            narx_tavsiya_matn(_nd), parse_mode=ParseMode.MARKDOWN)
                        return
                elif _smart_cmd == "klient_reyting":
                    _rd = await klient_reyting(_sc, uid)
                    await update.message.reply_text(
                        klient_reyting_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                    return
                elif _smart_cmd == "haftalik_trend":
                    _td = await haftalik_trend(_sc, uid)
                    await update.message.reply_text(
                        haftalik_trend_matn(_td), parse_mode=ParseMode.MARKDOWN)
                    return
                elif _smart_cmd == "inventarizatsiya":
                    # Inventarizatsiya — AI ga yuborib, tovarlar ro'yxati olish
                    from shared.services.smart_bot_engine import inventarizatsiya, inventarizatsiya_matn
                    # Matndan tovarlarni ajratish: "Ariel 45, Tide 23"
                    import re as _re
                    _inv_pairs = _re.findall(r'([A-Za-zА-Яа-яЎўҚқҒғҲҳ\'\-]+)\s+(\d+)', matn)
                    if _inv_pairs:
                        _inv_list = [{"nomi": n.strip(), "qoldiq": int(q)} for n, q in _inv_pairs]
                        _inv_r = await inventarizatsiya(_sc, uid, _inv_list)
                        await update.message.reply_text(
                            inventarizatsiya_matn(_inv_r), parse_mode=ParseMode.MARKDOWN)
                        return
                    else:
                        await update.message.reply_text(
                            "📋 *INVENTARIZATSIYA*\n\n"
                            "Tovar va qoldiqni ayting:\n"
                            "_\"Ariel 45, Tide 23, Fairy 12\"_\n\n"
                            "Yoki ovoz yuboring.",
                            parse_mode=ParseMode.MARKDOWN)
                        return
    except Exception as _se:
        log.debug("Smart buyruq: %s", _se)

    # ═══ 8. ADVANCED FEATURES — ABC, savol, shablon, qoldiq, zarar ═══
    try:
        # ── EKSPERT TAHLIL — "Ariel haqida", "Salimov tahlil" ──
        from shared.services.mutaxassis import (
            ekspert_sorov_bormi, ekspert_nom_ajrat,
            tovar_ekspert_tahlil, tovar_ekspert_matn,
            klient_ekspert_tahlil, klient_ekspert_matn,
        )
        if ekspert_sorov_bormi(matn):
            _nom = ekspert_nom_ajrat(matn)
            if _nom:
                log.info("🔬 Ekspert: '%s' izlash (uid=%d)", _nom, uid)
                
                # db.tovar_topish ISHLAYDI (sotuv saqlashda ishlatiladi)
                _tovar_row = await db.tovar_topish(uid, _nom)
                if _tovar_row:
                    log.info("🔬 Tovar topildi: %s (id=%s)", _tovar_row.get("nomi"), _tovar_row.get("id"))
                    async with db._P().acquire() as _ec:
                        _tv = await tovar_ekspert_tahlil(_ec, uid, _nom, tovar_row=_tovar_row)
                        try:
                            await update.message.reply_text(
                                tovar_ekspert_matn(_tv), parse_mode=ParseMode.MARKDOWN)
                        except Exception:
                            await update.message.reply_text(
                                tovar_ekspert_matn(_tv).replace("*","").replace("_",""))
                    return
                
                # db.klient_topish ISHLAYDI
                _klient_row = await db.klient_topish(uid, _nom)
                if _klient_row:
                    log.info("🔬 Klient topildi: %s (id=%s)", _klient_row.get("ism"), _klient_row.get("id"))
                    async with db._P().acquire() as _ec:
                        _kl = await klient_ekspert_tahlil(_ec, uid, _nom, klient_row=_klient_row)
                        try:
                            await update.message.reply_text(
                                klient_ekspert_matn(_kl), parse_mode=ParseMode.MARKDOWN)
                        except Exception:
                            await update.message.reply_text(
                                klient_ekspert_matn(_kl).replace("*","").replace("_",""))
                    return
                
                log.warning("🔬 Ekspert: '%s' topilmadi (uid=%d)", _nom, uid)
                await update.message.reply_text(f"🤔 '{_nom}' ni tovar yoki klient sifatida topolmadim.")
                return
    except Exception as _exp_e:
        log.debug("Ekspert: %s", _exp_e)

    try:
        from shared.services.advanced_features import (
            advanced_buyruq_aniqla, tabiiy_savol_javob,
            shablon_bormi, shablon_klient_ajrat, shablon_olish, shablon_matn,
            qoldiq_tuzatish_bormi, qoldiq_tuzatish_ajrat, qoldiq_tuzatish, qoldiq_tuzatish_matn,
            tovar_abc, tovar_abc_matn,
            tezkor_tugmalar, guruhli_bormi, guruhli_ajrat,
        )
        _adv_cmd = advanced_buyruq_aniqla(matn)
        if _adv_cmd:
            from shared.database.pool import get_pool
            async with db._P().acquire() as _ac:
                if _adv_cmd == "tabiiy_savol":
                    _javob = await tabiiy_savol_javob(_ac, uid, matn)
                    if _javob:
                        await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
                        return

                elif _adv_cmd == "abc_tahlil":
                    _abc = await tovar_abc(_ac, uid)
                    await update.message.reply_text(
                        tovar_abc_matn(_abc), parse_mode=ParseMode.MARKDOWN)
                    return

                elif _adv_cmd == "shablon":
                    _kl = shablon_klient_ajrat(matn)
                    if _kl:
                        _sh = await shablon_olish(_ac, uid, _kl)
                        if _sh:
                            # Shablonni savatga qo'yish uchun kutilayotgan ga saqlash
                            ctx.user_data["kutilayotgan"] = {
                                "amal": "chiqim", "klient": _kl,
                                "tovarlar": [
                                    {"nomi": t["nomi"], "miqdor": t["miqdor"],
                                     "birlik": t["birlik"], "narx": t["narx"],
                                     "jami": t["miqdor"] * t["narx"],
                                     "kategoriya": "Boshqa"}
                                    for t in _sh["tovarlar"]
                                ],
                                "jami_summa": sum(t["miqdor"] * t["narx"] for t in _sh["tovarlar"]),
                                "izoh": "shablon buyurtma",
                            }
                            from telegram import InlineKeyboardButton, InlineKeyboardMarkup
                            await update.message.reply_text(
                                shablon_matn(_sh) + "\n\n⬇️ Tasdiqlaysizmi?",
                                parse_mode=ParseMode.MARKDOWN,
                                reply_markup=InlineKeyboardMarkup([
                                    [InlineKeyboardButton("✅ Tasdiqlash", callback_data="t:ha")],
                                    [InlineKeyboardButton("❌ Bekor", callback_data="t:yoq")],
                                ]))
                            return
                        else:
                            await update.message.reply_text(f"ℹ️ {_kl} uchun oldingi buyurtma topilmadi.")
                            return

                elif _adv_cmd == "qoldiq_tuzatish":
                    _qt = qoldiq_tuzatish_ajrat(matn)
                    if _qt:
                        _qr = await qoldiq_tuzatish(_ac, uid, _qt["nomi"], _qt["miqdor"], _qt["sabab"])
                        await update.message.reply_text(
                            qoldiq_tuzatish_matn(_qr), parse_mode=ParseMode.MARKDOWN)
                        return

                elif _adv_cmd == "guruhli":
                    from shared.services.advanced_features import guruhli_ajrat
                    _g = guruhli_ajrat(matn)
                    if _g and _g.get("soni") and _g.get("tovar_matn"):
                        await update.message.reply_text(
                            f"👥 *GURUHLI SOTUV*\n\n"
                            f"Klientlar soni: *{_g['soni']}*\n"
                            f"Tovarlar: _{_g['tovar_matn']}_\n\n"
                            "Klientlar ismlarini ayting yoki yozing:\n"
                            "_\"Salimov, Karimov, Toshmatov\"_",
                            parse_mode=ParseMode.MARKDOWN)
                        ctx.user_data["_guruhli"] = _g
                        return
    except Exception as _adv_e:
        log.debug("Advanced feature: %s", _adv_e)

    # ═══ O'ZBEK BUYRUQ TEKSHIRUVI (AI ga yubormasdan) ═══
    from shared.services.voice_commands import detect_voice_command, is_quick_command
    cmd = detect_voice_command(matn)
    if cmd and is_quick_command(matn):
        await _ovoz_buyruq_bajar(update, ctx, cmd)
        return

    # Agar buyruq emas — AI ga yuborish
    from telegram.constants import ChatAction as _CA
    await update.message.chat.send_action(_CA.TYPING)
    await _qayta_ishlash(update,ctx,matn)


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
        try:
            from shared.services.hisobot_engine import (
                kunlik, haftalik, oylik, qarz_hisobot,
                hisobot_matn, qarz_hisobot_matn
            )
            from shared.database.pool import get_pool
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
            await _qayta_ishlash(update, ctx, cmd["original"])

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
        ism = user.get("to_liq_ism") or user.get("ism", "") if user else ""
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
    try: natija=await ai_xizmat.tahlil_qil(matn, uid=uid)
    except Exception as xato:
        log.error("tahlil: %s",xato,exc_info=True)

        # ═══ OFFLINE NAVBAT: Claude fail → 10s keyin qayta urinish ═══
        try:
            from services.bot.bot_services.offline_queue import navbatga_qosh, navbat_soni

            async def _retry_callback(retry_natija):
                try:
                    if retry_natija and retry_natija.get("amal") != "boshqa":
                        log.info("📋 Retry muvaffaqiyat (uid=%d)", uid)
                except Exception:
                    pass

            added = await navbatga_qosh(
                uid, ai_xizmat.tahlil_qil,
                args=(matn,), kwargs={"uid": uid},
                callback=_retry_callback
            )
            soni = navbat_soni(uid)
            if added:
                xabar = f"⏳ AI vaqtincha band. Navbatda {soni} ta xabar. 10s keyin qayta uriniladi."
            else:
                xabar = "❌ Tahlil vaqtincha ishlamayapti. Yozma yuboring."
        except Exception:
            xabar = "❌ Tahlil vaqtincha ishlamayapti. Yozma yuboring."

        if tahrirlash: await tahrirlash.edit_text(xabar)
        else: await update.message.reply_text(xabar)
        return

    amal=natija.get("amal","boshqa")
    if amal=="hisobot":
        try:
            from shared.services.hisobot_engine import (
                kunlik, haftalik, oylik, qarz_hisobot,
                hisobot_matn, qarz_hisobot_matn, hisobot_turini_aniqla
            )
            from shared.database.pool import get_pool
            tur = hisobot_turini_aniqla(matn)
            async with db._P().acquire() as hc:
                if tur == "qarz":
                    d = await qarz_hisobot(hc, uid)
                    body = qarz_hisobot_matn(d)
                elif tur == "oylik":
                    d = await oylik(hc, uid)
                    body = hisobot_matn(d)
                elif tur == "haftalik":
                    d = await haftalik(hc, uid)
                    body = hisobot_matn(d)
                else:
                    d = await kunlik(hc, uid)
                    body = hisobot_matn(d)
        except Exception as _he:
            log.warning("Hisobot engine xato: %s", _he)
            d=await db.kunlik_hisobot(uid); body=kunlik_matn(d)
        if tahrirlash: await tahrirlash.edit_text(body,parse_mode=ParseMode.MARKDOWN)
        else: await update.message.reply_text(body,parse_mode=ParseMode.MARKDOWN)
        return
    if amal=="nakladnoy":
        await _nakladnoy_yuborish(update,ctx,natija,tahrirlash); return

    if amal=="boshqa" or (not natija.get("tovarlar") and amal not in("qarz_tolash",)):
        # ═══ AI SUHBATDOSH — inson kabi gaplashadi ═══
        try:
            from shared.services.ai_suhbat import ai_suhbat, db_kontekst_olish
            _user = await _user_ol_kesh(uid)
            _ism = (_user.get("ism") or "").split()[0] if _user and _user.get("ism") else ""
            _db_ctx = await db_kontekst_olish(uid)
            _javob = await ai_suhbat(matn, uid, ism=_ism, db_kontekst=_db_ctx)
            if tahrirlash: await tahrirlash.edit_text(_javob)
            else: await update.message.reply_text(_javob)
            return
        except Exception as _ai_e:
            log.warning("AI suhbat xato: %s", _ai_e)
            # Fallback
            try:
                from shared.services.suhbatdosh import tushunilmadi
                _tush_msg = tushunilmadi()
            except Exception:
                _tush_msg = "🤔 Tushunolmadim."
            if tahrirlash: await tahrirlash.edit_text(_tush_msg)
            else: await update.message.reply_text(_tush_msg)
            return

    # ═══ PIPELINE: AI → SMART NARX → DRAFT → CONFIDENCE → CONFIRM ═══
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

    # ═══ SMART NARX: AI narx bermasa → DB dan aniqlash ═══
    if amal in ("chiqim", "sotuv", "nakladnoy") and natija.get("tovarlar"):
        try:
            from shared.services.smart_narx import narx_aniqla_nomi
            from shared.database.pool import rls_conn
            async with rls_conn(uid) as sc:
                narx_izoh = []
                for t in natija["tovarlar"]:
                    if not t.get("narx") or t["narx"] == 0:
                        r = await narx_aniqla_nomi(sc, uid, klient, t.get("nomi", ""))
                        if r["narx"] > 0:
                            t["narx"] = float(r["narx"])
                            t["jami"] = float(r["narx"]) * float(t.get("miqdor", 0))
                            manba_belgi = {"shaxsiy": "👤", "guruh": "🏷", "oxirgi": "🔄", "default": "📦"}
                            narx_izoh.append(f"{manba_belgi.get(r['manba'], '💰')} {t['nomi']}: {r['narx']:,.0f} ({r['manba']})")
                if narx_izoh:
                    # Jami summani qayta hisoblash
                    natija["jami_summa"] = sum(t.get("jami", 0) for t in natija["tovarlar"])
                    qarz = natija.get("qarz", 0) or 0
                    natija["tolangan"] = max(natija["jami_summa"] - qarz, 0)
                    natija["_narx_manba"] = narx_izoh
                    log.info("Smart narx: %s", " | ".join(narx_izoh))
        except Exception as _sn:
            log.warning("Smart narx xato (davom etadi): %s", _sn)

    draft = create_draft(natija, tx_type, uid, db_ctx)

    # ═══ KRITIK: CORRECTED data saqlanadi, RAW AI emas! ═══
    corrected_natija = dict(natija)
    if draft.corrected:
        corrected_natija.update(draft.corrected)

    # ═══════════════════════════════════════════════════════════
    #  AVTOMATIK SAVAT REJIM (OPTOM DO'KONCHILAR UCHUN)
    #  Klient ismi + tovar bor → avtomatik savatga qo'shiladi
    #  Tugma bosish KERAK EMAS — bot o'zi qiladi!
    # ═══════════════════════════════════════════════════════════
    _savat_klient = corrected_natija.get("klient", "")
    _savat_tovarlar = corrected_natija.get("tovarlar", [])
    _savat_amal = corrected_natija.get("amal", "")

    if _savat_klient and _savat_tovarlar and _savat_amal in ("chiqim", "sotuv", "nakladnoy"):
        try:
            from shared.services.ochiq_savat import savatga_qosh, savat_korish
            from shared.services.ochiq_savat import savat_qisqa_matn, savat_matn
            async with db._P().acquire() as _sc:
                result = await savatga_qosh(_sc, uid, _savat_klient, _savat_tovarlar)
                savat_data = await savat_korish(_sc, uid, _savat_klient)

            if result and savat_data:
                # Qisqa javob + savat holati
                qisqa = savat_qisqa_matn(result)
                to_liq = savat_matn(savat_data)

                javob = f"{qisqa}\n\n{to_liq}"

                markup = tg(
                    [(f"📋 {result['klient']} nakladnoy", f"t:savat_yop:{result['klient']}")],
                    [("🛒 Savatlar", "t:savatlar"), ("❌ Bekor", f"t:savat_bekor:{result['klient']}")],
                )
                if tahrirlash:
                    await tahrirlash.edit_text(javob, reply_markup=markup)
                else:
                    await update.message.reply_text(javob, reply_markup=markup)
                return
        except Exception as _savat_e:
            log.warning("Avto-savat xato (oddiy rejimga o'tiladi): %s", _savat_e)
    # ═══════════════════════════════════════════════════════════

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

    # Smart narx manbasini ko'rsatish
    narx_manba = natija.get("_narx_manba")
    if narx_manba:
        oldindan += "\n\n💡 *Narxlar avtomatik:*\n" + "\n".join(f"  {m}" for m in narx_manba)

    # ═══ ZARAR OGOHLANTIRISH (real-time) ═══
    if natija.get("amal") in ("chiqim", "sotuv") and natija.get("tovarlar"):
        try:
            from shared.services.advanced_features import zarar_tekshir, zarar_ogohlantirish_matn
            from shared.database.pool import get_pool
            async with db._P().acquire() as _zc:
                _zararlar = await zarar_tekshir(_zc, uid, natija["tovarlar"])
                if _zararlar:
                    oldindan += "\n" + zarar_ogohlantirish_matn(_zararlar)
        except Exception as _ze:
            log.debug("Zarar tekshir: %s", _ze)

    markup=tg(
        [("✅ Saqlash","t:ha"),("🛒 Savatga","t:savatga"),("❌ Bekor","t:yoq")],
        [("✏️ Klient","t:tahr:klient"),("✏️ Narx","t:tahr:narx")],
        [("✏️ Miqdor","t:tahr:miqdor"),("✏️ Qarz","t:tahr:qarz")],
    )
    try:
        if tahrirlash: await tahrirlash.edit_text(oldindan,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)
        else: await update.message.reply_text(oldindan,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)
    except Exception:
        # MARKDOWN xato — plain text fallback
        plain = oldindan.replace("*","").replace("_","").replace("`","")
        try:
            if tahrirlash: await tahrirlash.edit_text(plain,reply_markup=markup)
            else: await update.message.reply_text(plain,reply_markup=markup)
        except Exception as _pe:
            log.warning("Preview yuborish: %s", _pe)


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
                async with db._P().acquire() as ac:
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

        # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
        ctx.user_data["_oxirgi_chek_data"] = {
            "amal": "chiqim", "tovarlar": tovarlar,
            "klient": klient, "klient_ismi": klient,
            "jami_summa": float(jami), "tolangan": float(tolangan),
            "qarz": float(qarz),
        }

        # ═══ AVTOMATIK PRINTER CHEK (do'konchi yozmasdan) ═══
        try:
            from shared.services.bot_print_handler import send_print_session
            _tel_u = (user.get("telefon") or "") if user else ""
            _pj = await send_print_session(
                update.effective_message, natija, dokon, _tel_u, uid, 0,
            )
            if _pj:
                ctx.user_data["last_print_job"] = _pj.get("job_id")
        except Exception as _prt_n:
            log.debug("Nakladnoy auto-print: %s", _prt_n)
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
        async with db._P().acquire() as ac:
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
        async with db._P().acquire() as ac:
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
        async with db._P().acquire() as ac:
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
        async with db._P().acquire() as ac:
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
        ctx.user_data.pop("_tahr_rejim",None)
        await xat(q,"❌ Bekor qilindi."); return

    # ═══ SAVAT TUGMALARI ═══
    if q.data == "t:savatga":
        natija = ctx.user_data.get("kutilayotgan")
        if not natija:
            await xat(q, "❌ Ma'lumot yo'q"); return
        ok = await _savat_qosh_va_javob(update, uid, natija, q)
        if ok:
            ctx.user_data.pop("kutilayotgan", None)
        else:
            await xat(q, "❌ Savatga qo'shib bo'lmadi (klient nomi kerak)")
        return

    if q.data.startswith("t:savat_yop:"):
        klient = q.data.replace("t:savat_yop:", "")
        await xat(q, f"📋 {klient} — bir daqiqa...")
        await _savat_yop_va_nakladnoy(update, uid, klient, ctx)
        return

    if q.data.startswith("t:savat_bekor:"):
        klient = q.data.replace("t:savat_bekor:", "")
        try:
            from shared.services.ochiq_savat import savat_bekor
            async with db._P().acquire() as _sbc:
                ok = await savat_bekor(_sbc, uid, klient)
            if ok:
                await xat(q, f"❌ {klient} savati bekor qilindi")
            else:
                await xat(q, f"🛒 {klient} uchun ochiq savat yo'q")
        except Exception as e:
            await xat(q, f"❌ Xato: {e}")
        return

    if q.data == "t:savatlar":
        try:
            from shared.services.ochiq_savat import ochiq_savatlar, ochiq_savatlar_matn
            async with db._P().acquire() as c:
                savatlar_r = await ochiq_savatlar(c, uid)
            await xat(q, ochiq_savatlar_matn(savatlar_r))
        except Exception as e:
            await xat(q, "🛒 Ochiq savat yo'q")
        return

    # ═══ TAHRIRLASH TUGMALARI ═══
    if q.data.startswith("t:tahr:"):
        tahr_tur = q.data.split(":")[-1]  # klient, narx, miqdor, qarz
        natija = ctx.user_data.get("kutilayotgan")
        if not natija:
            await xat(q,"❌ Tahrirlash uchun ma'lumot yo'q."); return
        
        ctx.user_data["_tahr_rejim"] = tahr_tur
        
        if tahr_tur == "klient":
            await xat(q,
                "✏️ *KLIENT TAHRIRLASH*\n\n"
                f"Hozirgi: *{natija.get('klient') or 'yo`q'}*\n\n"
                "Yangi klient ismini yozing:\n"
                "_Masalan: Salimov_",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("❌ Bekor","t:tahr:orqaga")]))
        
        elif tahr_tur == "narx":
            tovarlar = natija.get("tovarlar", [])
            narx_matn = "\n".join(
                f"  {i+1}. {t.get('nomi','')} — {t.get('narx',0):,.0f} so'm"
                for i, t in enumerate(tovarlar)
            )
            await xat(q,
                "✏️ *NARX TAHRIRLASH*\n\n"
                f"Hozirgi narxlar:\n{narx_matn}\n\n"
                "Yangi narx yozing:\n"
                "_Tovar raqami va narx, masalan:_\n"
                "_1 45000_ (1-tovar narxi 45000)\n"
                "_hammasi 50000_ (barchasi 50000)",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("❌ Bekor","t:tahr:orqaga")]))
        
        elif tahr_tur == "miqdor":
            tovarlar = natija.get("tovarlar", [])
            miq_matn = "\n".join(
                f"  {i+1}. {t.get('nomi','')} — {t.get('miqdor',0)} {t.get('birlik','dona')}"
                for i, t in enumerate(tovarlar)
            )
            await xat(q,
                "✏️ *MIQDOR TAHRIRLASH*\n\n"
                f"Hozirgi miqdorlar:\n{miq_matn}\n\n"
                "Yangi miqdor yozing:\n"
                "_Tovar raqami va miqdor, masalan:_\n"
                "_1 100_ (1-tovar miqdori 100)\n"
                "_hammasi 50_ (barchasi 50)",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("❌ Bekor","t:tahr:orqaga")]))
        
        elif tahr_tur == "qarz":
            jami = natija.get("jami_summa", 0)
            qarz = natija.get("qarz", 0)
            tolangan = natija.get("tolangan", 0)
            await xat(q,
                "✏️ *QARZ TAHRIRLASH*\n\n"
                f"Jami: *{jami:,.0f}* so'm\n"
                f"Hozirgi qarz: *{qarz:,.0f}* so'm\n"
                f"To'langan: *{tolangan:,.0f}* so'm\n\n"
                "Yangi qarz summasini yozing:\n"
                "_Masalan: 500000_\n"
                "_Yoki: hammasi_ (to'liq qarzga)\n"
                "_Yoki: 0_ (qarzsiz)",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("❌ Bekor","t:tahr:orqaga")]))
        
        elif tahr_tur == "orqaga":
            # Tahrirlash bekor — preview qayta ko'rsatish
            ctx.user_data.pop("_tahr_rejim", None)
            natija_o = ctx.user_data.get("kutilayotgan")
            if natija_o:
                oldindan = ai_xizmat.oldindan_korinish(natija_o)
                markup=tg(
                    [("✅ Saqlash","t:ha"),("❌ Bekor","t:yoq")],
                    [("✏️ Klient","t:tahr:klient"),("✏️ Narx","t:tahr:narx")],
                    [("✏️ Miqdor","t:tahr:miqdor"),("✏️ Qarz","t:tahr:qarz")],
                )
                await xat(q, oldindan, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
            else:
                await xat(q, "❌ Ma'lumot topilmadi.")
        return

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
            # ═══ AVTOMATIK KIRIM CHEK: thermal matn + PDF ═══
            try:
                kirim_data = dict(natija)
                kirim_data["amal"] = "kirim"
                sana_s = datetime.datetime.now().strftime("%d%m%Y_%H%M")
                await _chek_thermal_va_pdf_yuborish(
                    q.message, kirim_data, dokon, f"kirim_{sana_s}", amal="kirim")
            except Exception as _pdf_e:
                log.warning("Avtomatik kirim chek: %s", _pdf_e)

            # ═══ OVOZLI KIRIM XABAR ═══
            try:
                from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, kirim_xulosa
                if tts_tayyor():
                    _ki_matn = kirim_xulosa(tovarlar, float(natija.get("jami_summa", 0)),
                                             natija.get("manba", ""))
                    _ki_ogg = await matn_ovozga(_ki_matn)
                    if _ki_ogg:
                        await q.message.reply_voice(voice=io.BytesIO(_ki_ogg),
                                                     caption="🔊 Kirim tasdiqlandi")
            except Exception as _tts_e:
                log.debug("TTS kirim: %s", _tts_e)

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "kirim", "tovarlar": tovarlar,
                "jami_summa": natija.get("jami_summa", 0),
                "klient": natija.get("manba", ""), "manba": natija.get("manba", ""),
            }

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
                    async with db._P().acquire() as gc:
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
                 ("📊 Excel",f"eks:xls:sotuv:{sess_id}")],
                [("✅ Yaxshi",   "m:orqaga")],
            )
            await xat(q,javob,parse_mode=ParseMode.MARKDOWN,reply_markup=markup)

            # ═══ AVTO QOLDIQ OGOHLANTIRISH ═══
            try:
                kam = await db.kam_qoldiq_tovarlar(uid)
                if kam:
                    ogoh_qator = ["⚠️ *KAM QOLDIQ OGOHLANTIRISH:*\n"]
                    for kt in kam[:5]:
                        ogoh_qator.append(f"  📦 {kt['nomi']}: *{kt.get('qoldiq',0)}* ta qoldi!")
                    await q.message.reply_text(
                        "\n".join(ogoh_qator),
                        parse_mode=ParseMode.MARKDOWN)
            except Exception as _kam_e:
                log.debug("Kam qoldiq tekshir: %s", _kam_e)

            # ═══ AVTOMATIK CHEK: thermal matn (asosiy) + PDF (arxiv) ═══
            try:
                chek_pdf_data = dict(natija)
                chek_pdf_data["amal"] = "chiqim"
                if eski_qarz_total > 0:
                    chek_pdf_data["eski_qarz"] = float(eski_qarz_total)
                sana_s = datetime.datetime.now().strftime("%d%m%Y_%H%M")
                kl_s = (klient or "sotuv").replace(" ", "_")[:15]
                await _chek_thermal_va_pdf_yuborish(
                    q.message, chek_pdf_data, dokon, f"chek_{kl_s}_{sana_s}")
            except Exception as _pdf_e:
                log.warning("Avtomatik chek fayllar: %s", _pdf_e)

            try:
                from shared.services.bot_print_handler import send_print_session

                _tel_u = (user.get("telefon") or "") if user else ""
                _pj = await send_print_session(
                    q.message,
                    chek_pdf_data,
                    dokon,
                    _tel_u,
                    uid,
                    int(sess_id),
                )
                if _pj:
                    ctx.user_data["last_print_job"] = _pj.get("job_id")
            except Exception as _prt_e:
                log.warning("Print tugma (sotuv): %s", _prt_e)

            # ═══ OXIRGI KLIENT YODLASH (kontekst uchun) ═══
            if klient:
                ctx.user_data["_oxirgi_klient"] = klient

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "chiqim", "tovarlar": tovarlar,
                "klient": klient, "klient_ismi": klient,
                "jami_summa": natija.get("jami_summa", 0),
                "tolangan": natija.get("tolangan", 0),
                "qarz": float(qarz_total),
                "sessiya_id": sess_id,
            }

            # ═══ OVOZLI SOTUV XABAR ═══
            try:
                from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, sotuv_xulosa
                if tts_tayyor():
                    _sv_matn = sotuv_xulosa(
                        klient or "Klient", tovarlar,
                        float(natija.get("jami_summa", 0)),
                        float(qarz_total))
                    _sv_ogg = await matn_ovozga(_sv_matn)
                    if _sv_ogg:
                        await q.message.reply_voice(voice=io.BytesIO(_sv_ogg),
                                                     caption="🔊 Sotuv tasdiqlandi")
            except Exception as _tts_e:
                log.debug("TTS sotuv: %s", _tts_e)

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
            # Avtomatik chek: thermal + PDF
            try:
                natija_m["amal"] = "chiqim"
                await _chek_thermal_va_pdf_yuborish(
                    q.message, natija_m, dokon, f"chek_{sotuv_m['sessiya_id']}")
            except Exception as _pe:
                log.warning("Majbur chek fayllar: %s", _pe)
            try:
                from shared.services.bot_print_handler import send_print_session

                _m = dict(natija_m)
                _m["amal"] = "chiqim"
                _tel_u = (user.get("telefon") or "") if user else ""
                _pj = await send_print_session(
                    q.message, _m, dokon, _tel_u, uid, int(sotuv_m["sessiya_id"])
                )
                if _pj:
                    ctx.user_data["last_print_job"] = _pj.get("job_id")
            except Exception as _prt2:
                log.warning("Print tugma (majbur): %s", _prt2)

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "chiqim", "tovarlar": natija_m.get("tovarlar", []),
                "klient": natija_m.get("klient", ""),
                "klient_ismi": natija_m.get("klient", ""),
                "jami_summa": natija_m.get("jami_summa", 0),
                "sessiya_id": sotuv_m.get("sessiya_id", 0),
            }

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
            # Avtomatik chek: thermal + PDF
            try:
                natija_z["amal"] = "chiqim"
                await _chek_thermal_va_pdf_yuborish(
                    q.message, natija_z, dokon, f"chek_{sotuv_z['sessiya_id']}")
            except Exception as _pe:
                log.warning("Zarar chek fayllar: %s", _pe)
            try:
                from shared.services.bot_print_handler import send_print_session

                _z = dict(natija_z)
                _z["amal"] = "chiqim"
                _tel_u = (user.get("telefon") or "") if user else ""
                _pj = await send_print_session(
                    q.message, _z, dokon, _tel_u, uid, int(sotuv_z["sessiya_id"])
                )
                if _pj:
                    ctx.user_data["last_print_job"] = _pj.get("job_id")
            except Exception as _prt3:
                log.warning("Print tugma (zarar): %s", _prt3)

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "chiqim", "tovarlar": natija_z.get("tovarlar", []),
                "klient": natija_z.get("klient", ""),
                "klient_ismi": natija_z.get("klient", ""),
                "jami_summa": natija_z.get("jami_summa", 0),
                "sessiya_id": sotuv_z.get("sessiya_id", 0),
            }

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

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "qaytarish", "tovarlar": tovarlar,
                "klient": klient, "klient_ismi": klient,
                "jami_summa": jami_q,
            }

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

            # ═══ OVOZLI QARZ XABAR ═══
            try:
                from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, qarz_xulosa
                if tts_tayyor():
                    _qt_matn = qarz_xulosa(n.get("klient", klient), float(n.get("tolandi", summa)))
                    _qt_ogg = await matn_ovozga(_qt_matn)
                    if _qt_ogg:
                        await q.message.reply_voice(voice=io.BytesIO(_qt_ogg),
                                                     caption="🔊 To'lov qabul qilindi")
            except Exception as _tts_e:
                log.debug("TTS qarz: %s", _tts_e)

            # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "qarz_tolash",
                "klient": n.get("klient", klient), "klient_ismi": n.get("klient", klient),
                "jami_summa": float(n.get("tolandi", summa)),
                "tolangan": float(n.get("tolandi", summa)),
                "qarz": 0, "qolgan_qarz": float(n.get("qolgan_qarz", 0)),
            }
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
            if format_=="chek":
                d = dict(data)
                d.setdefault("amal", "chiqim")
                await _chek_thermal_va_pdf_yuborish(q.message, d, dokon, f"chek_{sess_id}")
                return
            elif format_=="pdf":
                kontent=pdf_xizmat.sotuv_pdf(data,dokon); nom=f"sotuv_{sess_id}.pdf"
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
            async with db._P().acquire() as c:
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
            async with db._P().acquire() as c:
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
    elif akt=="shogirdlar":
        await xat(q,
            "👥 *SHOGIRDLAR*\n\n"
            "/shogirdlar — ro'yxat\n"
            "/shogird_qosh — yangi qo'shish\n"
            "/xarajatlar — xarajatlar nazorati\n\n"
            "Shogird ovoz/matn yuboradi:\n"
            "_\"Benzin 80000\"_ → bot saqlaydi",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
    elif akt=="narx":
        await xat(q,
            "🏷 *NARX GURUHLARI*\n\n"
            "/narx_guruh — guruhlar ko'rish/yaratish\n"
            "/narx_qoy — guruhga tovar narxi qo'yish\n"
            "/klient_narx — shaxsiy narx qo'yish\n"
            "/klient_guruh — klientni guruhga biriktirish\n\n"
            "Ovozda narx aytish shart emas —\n"
            "bot o'zi topadi!",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))


async def paginatsiya_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer(); akt=q.data
    if akt=="tv:keyingi": ctx.user_data["tv_s"]=ctx.user_data.get("tv_s",0)+1
    elif akt=="tv:oldingi": ctx.user_data["tv_s"]=max(ctx.user_data.get("tv_s",0)-1,0)
    elif akt=="kl:keyingi": ctx.user_data["kl_s"]=ctx.user_data.get("kl_s",0)+1
    elif akt=="kl:oldingi": ctx.user_data["kl_s"]=max(ctx.user_data.get("kl_s",0)-1,0)
    q.data="m:"+("tovarlar" if akt.startswith("tv") else "klientlar")
    await menyu_cb(update,ctx)


async def _hujjat_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Hujjat tugma callback — huj:bet:5, huj:jadval"""
    q = update.callback_query
    await q.answer()
    uid = update.effective_user.id

    h = ctx.user_data.get("hujjat")
    if not h:
        await q.message.reply_text("❌ Avval hujjat yuboring.")
        return

    parts = q.data.split(":")
    cmd = parts[1] if len(parts) > 1 else ""

    try:
        if cmd == "bet" and len(parts) > 2:
            sahifa_num = int(parts[2])
            from shared.services.hujjat_oqish import sahifa_matn
            matn = sahifa_matn(h, sahifa_num)

            # Navigatsiya tugmalari
            from telegram import InlineKeyboardButton, InlineKeyboardMarkup
            nav = []
            jami = h.get("sahifalar_soni", 0)
            if sahifa_num > 1:
                nav.append(InlineKeyboardButton(f"⬅️ {sahifa_num-1}-bet", callback_data=f"huj:bet:{sahifa_num-1}"))
            if sahifa_num < jami:
                nav.append(InlineKeyboardButton(f"➡️ {sahifa_num+1}-bet", callback_data=f"huj:bet:{sahifa_num+1}"))
            markup = InlineKeyboardMarkup([nav]) if nav else None

            await q.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)

        elif cmd == "jadval":
            jadvallar = h.get("jadvallar", [])
            if not jadvallar:
                await q.message.reply_text("📊 Jadval topilmadi.")
                return
            matn = f"📊 *{len(jadvallar)} ta jadval topildi:*\n\n"
            for j in jadvallar[:3]:
                matn += f"📋 Jadval #{j.get('jadval_raqam', '?')}"
                if j.get("sahifa"):
                    matn += f" (sahifa {j['sahifa']})"
                matn += f" — {j.get('qator_soni', 0)} qator\n"
                if j.get("sarlavha"):
                    matn += f"   Ustunlar: {' | '.join(str(c)[:15] for c in j['sarlavha'][:5])}\n"
                # Birinchi 3 qator
                for r in j.get("qatorlar", [])[:3]:
                    matn += f"   {' | '.join(str(c)[:15] for c in r[:5])}\n"
                matn += "\n"
            await q.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)

    except Exception as e:
        log.error("hujjat_cb: %s", e)
        await q.message.reply_text("❌ Xato yuz berdi")


async def _hisobot_excel_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Hisobot Excel tugma callback — hisob_excel:kunlik/haftalik/oylik"""
    q = update.callback_query
    await q.answer("Excel tayyorlanmoqda...")
    uid = update.effective_user.id
    tur = q.data.split(":")[1]  # kunlik, haftalik, oylik
    try:
        from shared.services.hisobot_engine import kunlik, haftalik, oylik
        from shared.database.pool import get_pool
        import services.bot.bot_services.export_excel as _exl

        async with db._P().acquire() as _ec:
            if tur == "haftalik":
                _ed = await haftalik(_ec, uid)
            elif tur == "oylik":
                _ed = await oylik(_ec, uid)
            else:
                _ed = await kunlik(_ec, uid)

        user = await _user_ol_kesh(uid)
        dokon = (user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"
        excel_bytes = _exl.hisobot_excel(_ed, dokon)
        sana_s = _ed.get("sana", "").replace(".", "").replace(" ", "_")[:15]
        nom = f"hisobot_{tur}_{sana_s}.xlsx"
        await q.message.reply_document(
            document=InputFile(io.BytesIO(excel_bytes), filename=nom),
            caption=f"📊 {tur.capitalize()} hisobot Excel")
    except Exception as e:
        log.error("hisobot_excel_cb: %s", e, exc_info=True)
        await q.message.reply_text("❌ Excel yaratishda xato")


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


# ════════════ NARX GURUHLARI ════════════

async def cmd_narx_guruh(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Narx guruh yaratish/ko'rish. /narx_guruh [nom]"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split(maxsplit=1)
    
    try:
        from shared.services.smart_narx import guruhlar_royxati, guruh_yaratish
        async with db._P().acquire() as c:
            if len(qismlar) > 1:
                # Yangi guruh yaratish
                nom = qismlar[1].strip()
                gid = await guruh_yaratish(c, uid, nom)
                await update.message.reply_text(
                    f"✅ *Narx guruhi yaratildi!*\n\n"
                    f"🏷 Nomi: *{nom}*\n"
                    f"ID: #{gid}\n\n"
                    f"Narx qo'yish: `/narx_qoy {nom} Ariel 45000`",
                    parse_mode=ParseMode.MARKDOWN)
            else:
                # Ro'yxat
                guruhlar = await guruhlar_royxati(c, uid)
                if not guruhlar:
                    await update.message.reply_text(
                        "📋 Hali narx guruhi yo'q.\n\n"
                        "Yaratish: `/narx_guruh Ulgurji`\n"
                        "Masalan: Ulgurji, Chakana, VIP",
                        parse_mode=ParseMode.MARKDOWN)
                    return
                matn = "🏷 *NARX GURUHLARI*\n━━━━━━━━━━━━━━━━━━\n\n"
                for g in guruhlar:
                    matn += (
                        f"🏷 *{g['nomi']}*\n"
                        f"   📦 {g['tovar_soni']} ta tovar narxi\n"
                        f"   👥 {g['klient_soni']} ta klient\n\n"
                    )
                matn += "Yangi guruh: `/narx_guruh <nom>`\nNarx qo'yish: `/narx_qoy <guruh> <tovar> <narx>`"
                await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_narx_guruh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_narx_qoy(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Narx qo'yish. /narx_qoy <guruh> <tovar> <narx>"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()
    
    if len(qismlar) < 4:
        await update.message.reply_text(
            "📝 *Narx qo'yish*\n\n"
            "Format: `/narx_qoy <guruh> <tovar> <narx>`\n\n"
            "Masalan:\n"
            "`/narx_qoy Ulgurji Ariel 43000`\n"
            "`/narx_qoy VIP Tide 38000`",
            parse_mode=ParseMode.MARKDOWN)
        return
    
    guruh_nom = qismlar[1]
    tovar_nom = qismlar[2]
    try:
        narx = float(qismlar[3].replace(",",""))
    except ValueError:
        await update.message.reply_text("❌ Narx raqam bo'lishi kerak."); return
    
    try:
        from shared.services.smart_narx import guruh_narx_qoyish
        async with db._P().acquire() as c:
            # Guruh topish
            guruh = await c.fetchrow(
                "SELECT id FROM narx_guruhlari WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{guruh_nom}%")
            if not guruh:
                await update.message.reply_text(f"❌ *{guruh_nom}* guruhi topilmadi.\n/narx_guruh bilan yarating.", parse_mode=ParseMode.MARKDOWN)
                return
            # Tovar topish
            tovar = await c.fetchrow(
                "SELECT id, nomi FROM tovarlar WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{tovar_nom}%")
            if not tovar:
                await update.message.reply_text(f"❌ *{tovar_nom}* tovari topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            await guruh_narx_qoyish(c, uid, guruh["id"], tovar["id"], Decimal(str(narx)))
        await update.message.reply_text(
            f"✅ *Narx qo'yildi!*\n\n"
            f"🏷 Guruh: *{guruh_nom}*\n"
            f"📦 Tovar: *{tovar['nomi']}*\n"
            f"💰 Narx: *{narx:,.0f} so'm*",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_narx_qoy: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_klient_narx(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Klientga shaxsiy narx. /klient_narx <klient> <tovar> <narx>"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()
    
    if len(qismlar) < 4:
        await update.message.reply_text(
            "📝 *Klient shaxsiy narx*\n\n"
            "Format: `/klient_narx <klient> <tovar> <narx>`\n\n"
            "Masalan:\n"
            "`/klient_narx Salimov Ariel 43000`\n"
            "`/klient_narx Karimov Tide 38000`",
            parse_mode=ParseMode.MARKDOWN)
        return
    
    klient_nom = qismlar[1]
    tovar_nom = qismlar[2]
    try:
        narx = float(qismlar[3].replace(",",""))
    except ValueError:
        await update.message.reply_text("❌ Narx raqam bo'lishi kerak."); return
    
    try:
        from shared.services.smart_narx import shaxsiy_narx_qoyish
        async with db._P().acquire() as c:
            klient = await c.fetchrow(
                "SELECT id, ism FROM klientlar WHERE user_id=$1 AND LOWER(ism) LIKE LOWER($2)",
                uid, f"%{klient_nom}%")
            if not klient:
                await update.message.reply_text(f"❌ *{klient_nom}* klienti topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            tovar = await c.fetchrow(
                "SELECT id, nomi FROM tovarlar WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{tovar_nom}%")
            if not tovar:
                await update.message.reply_text(f"❌ *{tovar_nom}* tovari topilmadi.", parse_mode=ParseMode.MARKDOWN)
                return
            await shaxsiy_narx_qoyish(c, uid, klient["id"], tovar["id"], Decimal(str(narx)))
        await update.message.reply_text(
            f"✅ *Shaxsiy narx qo'yildi!*\n\n"
            f"👤 Klient: *{klient['ism']}*\n"
            f"📦 Tovar: *{tovar['nomi']}*\n"
            f"💰 Narx: *{narx:,.0f} so'm*\n\n"
            f"Endi \"{klient['ism']}ga {tovar['nomi']}\" desangiz, narx avtomatik qo'yiladi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_klient_narx: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_klient_guruh(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Klientni guruhga biriktirish. /klient_guruh <klient> <guruh>"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    matn = (update.message.text or "").strip()
    qismlar = matn.split()
    
    if len(qismlar) < 3:
        await update.message.reply_text(
            "📝 *Klientni guruhga biriktirish*\n\n"
            "Format: `/klient_guruh <klient> <guruh>`\n\n"
            "Masalan:\n"
            "`/klient_guruh Salimov Ulgurji`",
            parse_mode=ParseMode.MARKDOWN)
        return
    
    klient_nom = qismlar[1]
    guruh_nom = qismlar[2]
    
    try:
        from shared.services.smart_narx import klient_guruhga_qoyish
        async with db._P().acquire() as c:
            klient = await c.fetchrow(
                "SELECT id, ism FROM klientlar WHERE user_id=$1 AND LOWER(ism) LIKE LOWER($2)",
                uid, f"%{klient_nom}%")
            if not klient:
                await update.message.reply_text(f"❌ *{klient_nom}* topilmadi.", parse_mode=ParseMode.MARKDOWN); return
            guruh = await c.fetchrow(
                "SELECT id, nomi FROM narx_guruhlari WHERE user_id=$1 AND LOWER(nomi) LIKE LOWER($2)",
                uid, f"%{guruh_nom}%")
            if not guruh:
                await update.message.reply_text(f"❌ *{guruh_nom}* guruhi topilmadi.", parse_mode=ParseMode.MARKDOWN); return
            await klient_guruhga_qoyish(c, klient["id"], guruh["id"])
        await update.message.reply_text(
            f"✅ *Biriktirildi!*\n\n"
            f"👤 *{klient['ism']}* → 🏷 *{guruh['nomi']}*\n\n"
            f"Endi {klient['ism']}ga sotuv qilsangiz, {guruh['nomi']} narxlari avtomatik qo'yiladi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_klient_guruh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")





# ════════════ SHOGIRD XARAJAT NAZORATI ════════════

async def cmd_shogird_qosh(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Admin: yangi shogird qo'shish. Format: /shogird_qosh <telegram_id> <ism>"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun."); return
    
    matn = (update.message.text or "").strip()
    qismlar = matn.split(maxsplit=2)
    if len(qismlar) < 3:
        await update.message.reply_text(
            "📝 *Shogird qo'shish*\n\n"
            "Format: `/shogird_qosh <telegram_id> <ism>`\n\n"
            "Masalan:\n"
            "`/shogird_qosh 123456789 Akbar haydovchi`\n\n"
            "Telegram ID bilish: shogird @userinfobot ga /start yuborsin",
            parse_mode=ParseMode.MARKDOWN)
        return
    
    try:
        tg_id = int(qismlar[1])
        ism = qismlar[2]
    except ValueError:
        await update.message.reply_text("❌ Telegram ID raqam bo'lishi kerak."); return
    
    try:
        from shared.services.shogird_xarajat import shogird_qoshish
        async with db._P().acquire() as c:
            result = await shogird_qoshish(c, uid, tg_id, ism)
        await update.message.reply_text(
            f"✅ *Shogird qo'shildi!*\n\n"
            f"👤 Ism: *{ism}*\n"
            f"📱 Telegram ID: `{tg_id}`\n"
            f"💰 Kunlik limit: 500,000 so'm\n"
            f"📊 Oylik limit: 10,000,000 so'm\n\n"
            f"Endi {ism} botga ovoz/matn yuborib xarajat kiritadi.",
            parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("shogird_qosh: %s", e, exc_info=True)
        await update.message.reply_text("❌ Shogird qo'shishda xato yuz berdi.")


async def cmd_shogirdlar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Admin: shogirdlar ro'yxati"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun."); return
    
    try:
        from shared.services.shogird_xarajat import shogirdlar_royxati
        async with db._P().acquire() as c:
            shogirdlar = await shogirdlar_royxati(c, uid)
        
        if not shogirdlar:
            await update.message.reply_text(
                "📋 Hali shogird yo'q.\n\n"
                "Qo'shish: `/shogird_qosh <telegram_id> <ism>`",
                parse_mode=ParseMode.MARKDOWN)
            return
        
        matn = "👥 *SHOGIRDLAR*\n━━━━━━━━━━━━━━━━━━\n\n"
        jami_bugun = Decimal('0')
        jami_oy = Decimal('0')
        
        for s in shogirdlar:
            bugun = s['bugungi_xarajat']
            oy = s['oylik_xarajat']
            kutish = s['kutilmoqda']
            jami_bugun += bugun
            jami_oy += oy
            
            limit_pct = int((bugun / s['kunlik_limit']) * 100) if s['kunlik_limit'] > 0 else 0
            bar = "🟢" if limit_pct < 70 else "🟡" if limit_pct < 100 else "🔴"
            
            matn += (
                f"{bar} *{s['ism']}* ({s['lavozim']})\n"
                f"   📱 `{s['telegram_uid']}`\n"
                f"   Bugun: *{bugun:,.0f}* / {s['kunlik_limit']:,.0f}\n"
                f"   Oy: *{oy:,.0f}* / {s['oylik_limit']:,.0f}\n"
            )
            if kutish > 0:
                matn += f"   ⏳ Kutilmoqda: {kutish} ta\n"
            matn += "\n"
        
        matn += f"━━━━━━━━━━━━━━━━━━\n💰 Bugun jami: *{jami_bugun:,.0f}*\n📊 Oy jami: *{jami_oy:,.0f}*"
        
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        log.error("cmd_shogirdlar: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def cmd_xarajatlar(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Admin: tasdiqlanmagan xarajatlar"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    if not cfg().is_admin(uid):
        await update.message.reply_text("🔒 Faqat admin uchun."); return
    
    try:
        from shared.services.shogird_xarajat import kutilmoqda_royxati
        async with db._P().acquire() as c:
            kutilmoqda = await kutilmoqda_royxati(c, uid)
        
        if not kutilmoqda:
            await update.message.reply_text("✅ Barcha xarajatlar tasdiqlangan!")
            return
        
        matn = "⏳ *KUTILMOQDA*\n━━━━━━━━━━━━━━━━━━\n\n"
        buttons = []
        for x in kutilmoqda[:10]:
            sana = str(x['sana'])[11:16]
            matn += (
                f"#{x['id']} {x['kategoriya_nomi']}\n"
                f"👤 {x['shogird_ismi']} | 💰 *{x['summa']:,.0f}*\n"
                f"📝 {x['izoh'] or '-'} | ⏰ {sana}\n\n"
            )
            buttons.append([
                (f"✅ #{x['id']}", f"sx:tasdiq:{x['id']}"),
                (f"❌ #{x['id']}", f"sx:bekor:{x['id']}"),
            ])
        
        markup = tg(*buttons) if buttons else None
        await update.message.reply_text(matn, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
    except Exception as e:
        log.error("cmd_xarajatlar: %s", e, exc_info=True)
        await update.message.reply_text("❌ Xato yuz berdi.")


async def shogird_xarajat_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """Admin: xarajatni tasdiqlash/bekor qilish"""
    q = update.callback_query; await q.answer()
    uid = update.effective_user.id
    qismlar = q.data.split(":")
    amal = qismlar[1]  # tasdiq yoki bekor
    xarajat_id = int(qismlar[2])
    
    try:
        from shared.services.shogird_xarajat import xarajat_tasdiqlash, xarajat_bekor
        async with db._P().acquire() as c:
            if amal == "tasdiq":
                ok = await xarajat_tasdiqlash(c, xarajat_id, uid)
                await q.message.reply_text(f"✅ Xarajat #{xarajat_id} tasdiqlandi!" if ok else "❌ Topilmadi.")
            elif amal == "bekor":
                ok = await xarajat_bekor(c, xarajat_id, uid)
                await q.message.reply_text(f"❌ Xarajat #{xarajat_id} bekor qilindi!" if ok else "❌ Topilmadi.")
    except Exception as e:
        log.error("shogird_xarajat_cb: %s", e, exc_info=True)
        await q.message.reply_text("❌ Xato yuz berdi.")


async def _shogird_xarajat_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE, 
                                   matn:str, shogird:dict) -> bool:
    """Shogird xarajat yubordi — qayta ishlash"""
    from shared.services.shogird_xarajat import xarajat_saqlash, kategoriya_aniqla
    
    # Matndan summa va kategoriya ajratish
    import re
    raqamlar = re.findall(r'[\d,]+(?:\.\d+)?', matn.replace(" ", ""))
    if not raqamlar:
        return False
    
    # Eng katta raqamni summa deb olish
    summa = max(float(r.replace(",", "")) for r in raqamlar)
    if summa < 1000:  # 1000 dan kam — xarajat emas
        return False
    
    kat_nomi, kat_emoji = kategoriya_aniqla(matn)
    izoh = matn.strip()
    
    admin_uid = shogird["admin_uid"]
    shogird_id = shogird["id"]
    
    try:
        async with _rls_conn(admin_uid) as c:
            result = await xarajat_saqlash(c, admin_uid, shogird_id, kat_nomi, summa, izoh)
        
        limit_info = result.get("limit_info", {})
        ogohlantirish = limit_info.get("ogohlantirish", [])
        
        javob = (
            f"✅ *Xarajat saqlandi!*\n\n"
            f"{kat_emoji} Kategoriya: *{kat_nomi}*\n"
            f"💰 Summa: *{summa:,.0f} so'm*\n"
            f"📝 Izoh: _{izoh[:50]}_\n"
            f"\n📊 Bugun jami: *{limit_info.get('bugungi', 0) + Decimal(str(summa)):,.0f}* / "
            f"{limit_info.get('kunlik_limit', 0):,.0f}\n"
        )
        
        if ogohlantirish:
            javob += "\n" + "\n".join(ogohlantirish)
        
        if not limit_info.get("ruxsat", True):
            javob += "\n\n🔴 *LIMIT OSHDI! Admin xabardor qilinadi.*"
            # Admin ga xabar yuborish
            try:
                admin_msg = (
                    f"🔴 *LIMIT OGOHLANTIRISH!*\n\n"
                    f"👤 Shogird: *{shogird['ism']}*\n"
                    f"{kat_emoji} {kat_nomi}: *{summa:,.0f} so'm*\n"
                    f"📊 Bugun: *{limit_info.get('bugungi', 0) + Decimal(str(summa)):,.0f}* / "
                    f"{limit_info.get('kunlik_limit', 0):,.0f}"
                )
                for aid in cfg().admin_ids:
                    try:
                        await ctx.bot.send_message(aid, admin_msg, parse_mode=ParseMode.MARKDOWN)
                    except Exception: pass
            except Exception as _ae:
                log.warning("Admin xabar: %s", _ae)
        
        await update.message.reply_text(javob, parse_mode=ParseMode.MARKDOWN)
        return True
    except Exception as e:
        log.error("shogird_xarajat: %s", e, exc_info=True)
        return False


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
    log.info("⏰ Avtomatik kunlik hisobot PRO...")
    try:
        from shared.services.smart_bot_engine import kunlik_yakuniy_pro, kunlik_yakuniy_pro_matn
        from shared.database.pool import get_pool
        users=await db.faol_users(); yuborildi=0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    d=await kunlik_yakuniy_pro(c, user["id"])
                if d["sotuv_soni"]==0: continue
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
                yuborildi+=1
            except Exception as e: log.warning("Avtohisobot %s: %s",user["id"],e)
        log.info("✅ Kunlik hisobot PRO: %d foydalanuvchiga",yuborildi)
    except Exception as e: log.error("avto_kunlik_hisobot: %s",e,exc_info=True)


async def avto_haftalik_hisobot(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    """Har dushanba haftalik hisobot + trend"""
    log.info("⏰ Haftalik hisobot + trend...")
    try:
        from shared.services.smart_bot_engine import haftalik_trend, haftalik_trend_matn
        from shared.services.hisobot_engine import haftalik, hisobot_matn
        from shared.database.pool import get_pool
        users=await db.faol_users(); yuborildi=0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    h_data = await haftalik(c, user["id"])
                    t_data = await haftalik_trend(c, user["id"])
                if h_data["sotuv_soni"]==0: continue
                matn = hisobot_matn(h_data) + "\n\n" + haftalik_trend_matn(t_data)
                await ctx.bot.send_message(user["id"],matn,parse_mode=ParseMode.MARKDOWN)
                yuborildi+=1
            except Exception as e: log.warning("Haftalik %s: %s",user["id"],e)
        log.info("✅ Haftalik hisobot: %d foydalanuvchiga",yuborildi)
    except Exception as e: log.error("avto_haftalik_hisobot: %s",e,exc_info=True)


async def avto_qarz_eslatma(ctx:ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni qarz eslatmasi — muddati o'tgan + yaqinlashayotgan"""
    log.info("⏰ Qarz eslatmalari PRO...")
    try:
        from shared.services.smart_bot_engine import qarz_eslatma_royxat, qarz_eslatma_matn
        from shared.database.pool import get_pool
        users=await db.faol_users()
        for user in users:
            try:
                async with db._P().acquire() as c:
                    klientlar = await qarz_eslatma_royxat(c, user["id"])
                if not klientlar: continue
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


async def cmd_tez(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """/tez — tezkor tugmalar: eng ko'p ishlatilgan tovar va klientlar"""
    if not await faol_tekshir(update): return
    uid = update.effective_user.id
    try:
        from shared.services.advanced_features import tezkor_tugmalar
        from shared.database.pool import get_pool
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


async def _tezkor_cb(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Tezkor tugma bosilganda — shablon tayyorlash"""
    q = update.callback_query
    await q.answer()
    parts = q.data.split(":", 2)
    if len(parts) < 3: return
    tur, nom = parts[1], parts[2]

    if tur == "kl":
        await q.message.reply_text(
            f"👤 *{nom}* tanlandi.\n\n"
            f"Endi ovoz yuboring: _{nom}ga 10 Ariel 45 mingdan_",
            parse_mode=ParseMode.MARKDOWN)
    elif tur == "tv":
        await q.message.reply_text(
            f"📦 *{nom}* tanlandi.\n\n"
            f"Endi ovoz yuboring: _Salimovga 5 {nom} 45 mingdan_",
            parse_mode=ParseMode.MARKDOWN)


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
        "⚙️ *BOT HOLATI (v25.3 PRODUCTION)*\n\n"
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
        async with db._P().acquire() as c:
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
    dokon = (user.get("dokon_nomi") or "Mashrab Moliya") if user else "Mashrab Moliya"

    # Oxirgi sotuv sessiyasini topish
    try:
        async with db._P().acquire() as c:
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
    """PDF, Word, Excel, EPUB, PPTX... — 40 format, 100K+ sahifa"""
    uid = update.effective_user.id
    if not await faol_tekshir(update): return
    doc = update.message.document
    if not doc: return
    fname = (doc.file_name or "fayl").strip()
    fn_lower = fname.lower()

    # Qo'llab-quvvatlanadigan formatlar
    FORMATLAR = ('.pdf','.docx','.doc','.xlsx','.xls','.pptx','.ppt',
                 '.epub','.fb2','.rtf','.html','.htm','.json','.xml',
                 '.md','.markdown','.odt','.djvu',
                 '.txt','.csv','.log','.py','.js','.ts','.sql','.sh',
                 '.yaml','.yml','.ini','.conf','.env','.toml')
    if not any(fn_lower.endswith(f) for f in FORMATLAR):
        return

    # Fayl hajmi tekshirish (Telegram bot 20MB gacha yuklay oladi)
    fayl_hajm = doc.file_size or 0
    if fayl_hajm > 20 * 1024 * 1024:
        await update.message.reply_text(
            f"❌ *{fname}* juda katta ({fayl_hajm // 1024 // 1024}MB).\n"
            "Telegram bot 20MB gacha yuklay oladi.\n"
            "Faylni kichikroq qismlarga bo'ling.",
            parse_mode=ParseMode.MARKDOWN)
        return

    hajm_str = f"{fayl_hajm // 1024}KB" if fayl_hajm < 1024*1024 else f"{fayl_hajm // 1024 // 1024}MB"
    holat = await update.message.reply_text(
        f"⏳ *{fname}* ({hajm_str}) o'qilmoqda...",
        parse_mode=ParseMode.MARKDOWN)

    try:
        fayl = await ctx.bot.get_file(doc.file_id)
        data = bytes(await fayl.download_as_bytearray())

        # EXCEL — maxsus super reader
        if fn_lower.endswith(('.xlsx', '.xls')):
            from shared.services.excel_reader import excel_toliq_oqi, excel_xulosa_matn
            h = excel_toliq_oqi(data)
            h["tur"] = "xlsx_pro"
            ctx.user_data["hujjat"] = h
            ctx.user_data["hujjat_nomi"] = fname
            xulosa = excel_xulosa_matn(h, fname)
            try:
                await holat.edit_text(xulosa, parse_mode=ParseMode.MARKDOWN)
            except Exception:
                await holat.edit_text(xulosa.replace("*","").replace("_",""))
            
            # PDF HISOBOT yuborish
            try:
                from shared.services.excel_reader import excel_pdf_hisobot
                pdf_bytes = excel_pdf_hisobot(h, fname)
                if pdf_bytes:
                    pdf_nom = fname.replace(".xlsx","").replace(".xls","") + "_HISOBOT.pdf"
                    from telegram import InputFile
                    await update.message.reply_document(
                        document=InputFile(io.BytesIO(pdf_bytes), filename=pdf_nom),
                        caption="📊 Mashrab Moliya — Auditor Hisoboti")
            except Exception as _pe:
                log.warning("Excel PDF: %s", _pe)
            
            # ═══ AVTOMATIK AI TAHLIL — CLAUDE SONNET (AUDITOR DARAJASI) ═══
            try:
                import os, anthropic
                
                _anth_key = os.environ.get("ANTHROPIC_API_KEY", "")
                _matn_raw = h.get("umumiy_matn", "")[:30000]
                
                if _anth_key and _matn_raw and len(_matn_raw) > 100:
                    _prompt = f"""Sen MASHRAB MOLIYA auditor tizimisan.
KASSA Excel ma'lumotlari berilgan. PROFESSIONAL AUDITOR DARAJASIDA TO'LIQ MOLIYAVIY TAHLIL yoz.

EXCEL MA'LUMOTLARI:
{_matn_raw}

QOIDALAR:
1. "📊 HISOBOT KASSA — TO'LIQ TAHLIL" bilan boshla
2. 8 ta bo'lim yoz:
   1️⃣ UMUMIY MOLIYAVIY KO'RSATKICHLAR (jami tushum, xarajat, balans)
   2️⃣ XARAJATLAR TARKIBI (kategoriya, summa, foiz ulushi)
   3️⃣ KUNLIK TUSHUM TAHLILI (TOP 5 kun, eng past kunlar)
   4️⃣ CLICK vs NAQD PUL NISBATI (grafik ko'rinishda)
   5️⃣ CLICK HISOBI TAHLILI (tushum, xarajat, qoldiq)
   6️⃣ XARAJATLAR BATAFSIL (har bir kategoriya)
   7️⃣ HAFTALIK TREND (hafta bo'yicha o'sish/pasayish)
   8️⃣ XULOSALAR VA TAVSIYALAR (ijobiy, salbiy, 3-5 ta amaliy tavsiya)
3. Jadvallar bilan yoz: | Ko'rsatkich | Qiymat |
4. Raqamlarni 1,234,567 formatda yoz
5. Emoji ishlat (lekin ortiqcha emas)
6. O'ZBEK tilida yoz
7. HAR BIR RAQAMNI TEKSHIR — XATO BO'LMASIN!
8. Eng oxirida KONKRET, AMALIY tavsiyalar ber"""

                    _aclient = anthropic.AsyncAnthropic(api_key=_anth_key)
                    _resp = await _aclient.messages.create(
                        model="claude-sonnet-4-6",
                        max_tokens=4000,
                        messages=[{"role": "user", "content": _prompt}],
                    )
                    _ai_tahlil = (_resp.content[0].text or "").strip()
                    
                    if _ai_tahlil and len(_ai_tahlil) > 100:
                        # Telegram 4096 limit — bo'laklarga bo'lish
                        if len(_ai_tahlil) > 4000:
                            qismlar = []
                            joriy = ""
                            for qator in _ai_tahlil.split("\n"):
                                if len(joriy) + len(qator) > 3900:
                                    qismlar.append(joriy)
                                    joriy = qator + "\n"
                                else:
                                    joriy += qator + "\n"
                            if joriy.strip():
                                qismlar.append(joriy)
                            for q in qismlar:
                                try:
                                    await update.message.reply_text(q.strip(), parse_mode=ParseMode.MARKDOWN)
                                except Exception:
                                    await update.message.reply_text(q.strip().replace("*","").replace("_",""))
                        else:
                            try:
                                await update.message.reply_text(_ai_tahlil, parse_mode=ParseMode.MARKDOWN)
                            except Exception:
                                await update.message.reply_text(_ai_tahlil.replace("*","").replace("_",""))
                        log.info("Excel CLAUDE tahlil: %d belgi yuborildi", len(_ai_tahlil))
                    else:
                        log.warning("Excel AI tahlil: javob qisqa (%d belgi)", len(_ai_tahlil) if _ai_tahlil else 0)
                else:
                    log.warning("Excel AI tahlil: anth_key=%s matn=%d belgi", bool(_anth_key), len(_matn_raw))
            except Exception as _ai_e:
                log.warning("Excel AI tahlil xato: %s", _ai_e)
            
            return

        from shared.services.hujjat_oqish import hujjat_oqi, hujjat_xulosa_matn

        h = hujjat_oqi(data, fname)

        if h.get("xato"):
            await holat.edit_text(f"❌ {h['xato']}")
            return

        # Xotirada saqlash — keyingi savollar uchun
        ctx.user_data["hujjat"] = h
        ctx.user_data["hujjat_nomi"] = fname

        xulosa = hujjat_xulosa_matn(h, fname)

        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        tugmalar = []

        if h.get("tur") == "pdf":
            sahifalar = h.get("sahifalar_soni", 0)
            if sahifalar > 0:
                tugmalar.append([
                    InlineKeyboardButton("📄 1-bet", callback_data="huj:bet:1"),
                    InlineKeyboardButton(f"📄 {sahifalar}-bet", callback_data=f"huj:bet:{sahifalar}"),
                ])
            if sahifalar > 2:
                o = sahifalar // 2
                tugmalar.append([
                    InlineKeyboardButton(f"📄 {o}-bet", callback_data=f"huj:bet:{o}"),
                ])

        if h.get("jadvallar"):
            tugmalar.append([InlineKeyboardButton("📊 Jadvallar", callback_data="huj:jadval")])

        markup = InlineKeyboardMarkup(tugmalar) if tugmalar else None

        try:
            await holat.edit_text(xulosa, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
        except Exception:
            # MARKDOWN xato — plain text
            plain = xulosa.replace("*","").replace("_","").replace("`","")
            try:
                await holat.edit_text(plain, reply_markup=markup)
            except Exception:
                await holat.edit_text(f"📂 {fname} o'qildi. Sahifalar: {h.get('sahifalar_soni',0)}", reply_markup=markup)

    except Exception as e:
        log.error("hujjat_qabul: %s", e, exc_info=True)
        await holat.edit_text(f"❌ *{fname}* o'qishda xato yuz berdi", parse_mode=ParseMode.MARKDOWN)


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
        async with db._P().acquire() as c:
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
    """v25.3 MEGA yangiliklari"""
    await update.message.reply_text(
        f"🆕 *SAVDOAI v{__version__} — MEGA YANGILANISH*\n"
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
        f"📋 *SAVDOAI v{__version__} — BARCHA IMKONIYATLAR*\n"
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
        matn+=(f"{belgi} *{r.get('to_liq_ism') or r.get('ism', '')}*\n"
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
    # 1. DB pool — FATAL (pool_init siz bot ishlay olmaydi)
    try:
        await db.pool_init(_CFG.database_url, min_size=_CFG.db_min, max_size=_CFG.db_max)
    except Exception as _e:
        log.critical("❌ DB ulanishda xato: %s", _e, exc_info=True)
        raise RuntimeError(f"DB pool init muvaffaqiyatsiz: {_e}") from _e
    # 1b. Shared pool ham ishga tushirish (rls_conn, ledger, kassa uchun)
    try:
        await _pool_init(_CFG.database_url, min_size=_CFG.db_min, max_size=_CFG.db_max)
        log.info("✅ Shared pool ulandi")
    except Exception as _e:
        log.warning("⚠️ Shared pool xato (ba'zi funksiyalar ishlamasligi mumkin): %s", _e)
    # 2. Schema — non-fatal (jadvallar allaqachon bo'lishi mumkin)
    try:
        await db.schema_init()
    except Exception as _e:
        log.error("⚠️ Schema init xato (bot davom etadi): %s", _e)
    try:
        ovoz_xizmat.ishga_tushir(_CFG.gemini_key, _CFG.gemini_model)
        try:
            from shared.database.pool import get_pool
            get_pool()
            await ovoz_xizmat.stt_prompt_yangilash()
            log.info(
                "✅ Voice STT + fuzzy: RLS bo'yicha har foydalanuvchi uchun alohida yuklanadi"
            )
        except Exception as _voice_e:
            log.warning("Voice pipeline init xato: %s", _voice_e)
    except Exception as _e:
        log.warning("Gemini ishga tushmadi (ovoz xizmati o'chirildi): %s", _e)
    try:
        ai_xizmat.ishga_tushir(_CFG.anthropic_key)
    except Exception as _e:
        log.critical("Claude ishga tushmadi: %s", _e, exc_info=True)
        raise RuntimeError(f"AI xizmat init muvaffaqiyatsiz: {_e}") from _e
    log.info("✅ Bot xizmatlar tayyor")
    # Redis cache (ixtiyoriy — yo'q bo'lsa ham bot ishlaydi)
    try:
        redis_url = _os.environ.get("REDIS_URL", "")
        if redis_url:
            from shared.cache.redis_cache import redis_init
            await redis_init(redis_url)
    except Exception as _e:
        log.warning("Redis ulana olmadi (cache o'chirildi): %s", _e)
    # Vision AI (ixtiyoriy — Gemini key bilan ishlaydi)
    try:
        from shared.services.vision import ishga_tushir as vision_init
        vision_init(_CFG.gemini_key, _CFG.gemini_model)
    except Exception as _e:
        log.info("ℹ️ Vision AI yuklanmadi (ixtiyoriy): %s", _e)

    # TTS ovozli javob
    try:
        from services.bot.bot_services.tts import ishga_tushir as tts_init
        tts_init(_CFG.gemini_key)
    except Exception as _e:
        log.info("ℹ️ TTS yuklanmadi (ixtiyoriy): %s", _e)
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
        BotCommand("yangilik",         "🆕 v25.3 yangiliklari"),
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
        BotCommand("tez",              "⚡ Tezkor tugmalar"),
        BotCommand("guruh",            "👥 Guruhli sotuv"),
        BotCommand("tahlil",           "📸 Ko'p rasm tahlil"),
        BotCommand("hafta",            "Haftalik hisobot"),
        BotCommand("kassa",            "Kassa holati (naqd/karta)"),
        BotCommand("status",           "Bot holati (admin)"),
        BotCommand("balans",           "📊 Balans tekshiruvi (admin)"),
        BotCommand("jurnal",           "📒 Jurnal yozuvlar"),
        BotCommand("foydalanuvchilar", "Foydalanuvchilar (admin)"),
        BotCommand("faollashtir",      "Faollashtirish (admin)"),
        BotCommand("statistika",       "Statistika (admin)"),
        BotCommand("shogird_qosh",    "Shogird qo'shish (admin)"),
        BotCommand("shogirdlar",      "Shogirdlar ro'yxati (admin)"),
        BotCommand("xarajatlar",      "Xarajatlar nazorati (admin)"),
        BotCommand("narx_guruh",      "Narx guruhi yaratish"),
        BotCommand("narx_qoy",        "Guruh narxi qo'yish"),
        BotCommand("klient_narx",     "Klient shaxsiy narx"),
        BotCommand("klient_guruh",    "Klient guruhga biriktirish"),
        BotCommand("savatlar",        "Ochiq savatlar ko'rish"),
        BotCommand("savat",           "Klient savati ko'rish"),
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
# ════════════ OCHIQ SAVAT (Multi-Klient) ════════════

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


async def _savat_qosh_va_javob(update: Update, uid: int, natija: dict, tahrirlash=None):
    """Sotuv natijasini savatga qo'shish va javob berish"""
    klient = natija.get("klient", "")
    tovarlar = natija.get("tovarlar", [])
    if not klient or not tovarlar:
        return False

    try:
        from shared.services.ochiq_savat import savatga_qosh, savat_korish, savat_matn
        async with db._P().acquire() as c:
            result = await savatga_qosh(c, uid, klient, tovarlar)
            savat_data = await savat_korish(c, uid, klient)

        if result and savat_data:
            matn = (
                f"🛒 Savatga qo'shildi!\n\n"
                f"{savat_matn(savat_data)}\n\n"
                f"\"Yana tovar qo'shish\" — ovoz yuboring\n"
                f"\"{klient} bo'ldi\" — nakladnoy chiqadi"
            )
            markup = tg(
                [(f"📋 {klient} nakladnoy", f"t:savat_yop:{klient}")],
                [(f"🛒 Savatlar", "t:savatlar")],
            )
            if tahrirlash:
                await tahrirlash.edit_text(matn, reply_markup=markup)
            else:
                await update.message.reply_text(matn, reply_markup=markup)
            return True
    except Exception as e:
        log.warning("savat_qosh: %s", e)

    return False


async def _savat_yop_va_nakladnoy(update_or_query, uid: int, klient_ismi: str, ctx=None):
    """Savatni yopish va nakladnoy generatsiya (Word + Excel + PDF)"""
    try:
        from shared.services.ochiq_savat import savat_yop
        from services.bot.bot_services import nakladnoy as nak_xizmat
        import io
        from telegram import InputFile

        async with db._P().acquire() as c:
            natija = await savat_yop(c, uid, klient_ismi)

        if not natija:
            msg = hasattr(update_or_query, 'message') and update_or_query.message
            if msg:
                await msg.reply_text(f"🛒 {klient_ismi} uchun ochiq savat yo'q")
            return

        user = await db.user_ol(uid)
        dokon = user.get("dokon_nomi", "Mashrab Moliya") if user else "Mashrab Moliya"
        inv_no = nak_xizmat.nakladnoy_nomeri()

        tovarlar = natija.get("tovarlar", [])
        jami = natija.get("jami_summa", 0)
        qarz = natija.get("qarz", 0)
        tolangan = natija.get("tolangan", jami)

        # Klient ma'lumotlari
        klient_tel = ""; klient_manzil = ""; klient_inn = ""
        try:
            kl = await db.klient_topish(uid, klient_ismi)
            if kl:
                klient_tel = kl.get("telefon", "") or ""
                klient_manzil = kl.get("manzil", "") or ""
                klient_inn = kl.get("inn", "") or ""
        except Exception: pass

        # 🛡️ AUDIT + 📒 LEDGER
        try:
            from shared.services.pipeline import audit_yoz
            from shared.services.ledger import sotuv_jurnali, jurnal_saqlash
            async with db._P().acquire() as ac:
                await audit_yoz(ac, uid, "savat_nakladnoy", "sotuv_sessiyalar", 0,
                    None, {"klient": klient_ismi, "jami": str(jami), "tovarlar_soni": len(tovarlar)})
                naqd_d = max(Decimal(str(jami)) - Decimal(str(qarz)), Decimal("0"))
                je = sotuv_jurnali(uid, klient_ismi, Decimal(str(jami)),
                                    naqd=naqd_d, qarz=Decimal(str(qarz)))
                await jurnal_saqlash(ac, je)
        except Exception as _exc:
            log.debug("savat audit: %s", _exc)

        # Word + Excel + PDF
        data = {
            "invoice_number": inv_no, "dokon_nomi": dokon,
            "dokon_telefon": (user.get("telefon", "") or "") if user else "",
            "dokon_inn": (user.get("inn", "") or "") if user else "",
            "dokon_manzil": (user.get("manzil", "") or "") if user else "",
            "klient_ismi": klient_ismi, "klient_telefon": klient_tel,
            "klient_manzil": klient_manzil, "klient_inn": klient_inn,
            "tovarlar": tovarlar,
            "jami_summa": jami, "qarz": qarz, "tolangan": tolangan,
        }

        msg = hasattr(update_or_query, 'message') and update_or_query.message
        if not msg:
            # CallbackQuery dan kelsa
            if hasattr(update_or_query, 'effective_message'):
                msg = update_or_query.effective_message

        try:
            fayllar = nak_xizmat.uchala_format(data)
            if msg:
                for nom, kalit, caption in [
                    (f"Nakladnoy_{inv_no}_{klient_ismi[:15]}.docx", "word", "📝 Word"),
                    (f"Nakladnoy_{inv_no}_{klient_ismi[:15]}.xlsx", "excel", "📊 Excel"),
                    (f"Nakladnoy_{inv_no}_{klient_ismi[:15]}.pdf", "pdf", "📑 PDF"),
                ]:
                    if fayllar.get(kalit):
                        await msg.reply_document(
                            document=InputFile(io.BytesIO(fayllar[kalit]), filename=nom),
                            caption=caption,
                        )
                await msg.reply_text(
                    f"📋 *NAKLADNOY №{inv_no}*\n"
                    f"👤 {klient_ismi} | 📦 {len(tovarlar)} tovar\n"
                    f"💰 Jami: {pul(jami)}\n"
                    f"✅ Saqlandi!",
                    parse_mode=ParseMode.MARKDOWN,
                )

                # ═══ OVOZLI NAKLADNOY XABAR ═══
                try:
                    from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, sotuv_xulosa
                    if tts_tayyor():
                        _nk_matn = sotuv_xulosa(klient_ismi, tovarlar, float(jami), float(qarz))
                        _nk_ogg = await matn_ovozga(_nk_matn)
                        if _nk_ogg:
                            await msg.reply_voice(voice=io.BytesIO(_nk_ogg),
                                                   caption="🔊 Nakladnoy tayyor")
                except Exception as _tts_e:
                    log.debug("TTS nakladnoy: %s", _tts_e)

                # ═══ CHEK CHIQAR UCHUN SAQLASH ═══
                if ctx is not None:
                    ctx.user_data["_oxirgi_chek_data"] = {
                        "amal": "chiqim", "tovarlar": tovarlar,
                        "klient": klient_ismi, "klient_ismi": klient_ismi,
                        "jami_summa": float(jami), "tolangan": float(tolangan),
                        "qarz": float(qarz),
                    }

                # ═══ AVTOMATIK PRINTER CHEK (do'konchi yozmasdan) ═══
                try:
                    from shared.services.bot_print_handler import send_print_session
                    _tel_u = (user.get("telefon") or "") if user else ""
                    _chek_data = {
                        "amal": "chiqim", "tovarlar": tovarlar,
                        "klient": klient_ismi, "klient_ismi": klient_ismi,
                        "jami_summa": float(jami), "tolangan": float(tolangan),
                        "qarz": float(qarz),
                    }
                    _pj = await send_print_session(
                        msg, _chek_data, dokon, _tel_u, uid, 0,
                    )
                    if _pj and ctx is not None:
                        ctx.user_data["last_print_job"] = _pj.get("job_id")
                except Exception as _prt_s:
                    log.debug("Savat auto-print: %s", _prt_s)
        except Exception as nakl_e:
            log.error("Savat nakladnoy: %s", nakl_e, exc_info=True)
            if msg:
                await msg.reply_text(
                    f"📋 {klient_ismi} — SAQLANDI!\n"
                    f"📦 {len(tovarlar)} xil tovar\n"
                    f"💰 Jami: {float(jami):,.0f} so'm"
                )
    except Exception as e:
        log.error("savat_yop: %s", e, exc_info=True)


    log.info("🚀 SavdoAI Mashrab Moliya v25.3 PRODUCTION — TAYYOR!")


def ilovani_qur(conf:Config) -> Application:
    app=(Application.builder().token(conf.bot_token).post_init(boshlash).build())
    app.bot_data["cfg"]=conf
    # /ping — debug, barcha tekshiruvlarni bypass qiladi
    async def cmd_ping(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
        import time as _pt
        await update.message.reply_text(
            f"🏓 Pong!\n"
            f"📱 UID: {update.effective_user.id}\n"
            f"🤖 Bot: v{__version__}\n"
            f"⏰ {_pt.strftime('%H:%M:%S')}")
    app.add_handler(CommandHandler("ping", cmd_ping))

    # /token — Web panel uchun JWT token olish
    async def cmd_token(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        uid = update.effective_user.id
        _jwt_secret = conf.jwt_secret
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
        import json as _tj, time as _tt, hmac as _th, base64 as _tb, hashlib as _thl
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
    app.add_handler(CommandHandler("token", cmd_token))

    # /parol — Admin do'konchiga login/parol berish
    async def cmd_parol(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        uid = update.effective_user.id
        if not conf.is_admin(uid):
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
            import hashlib as _ph, os as _po
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
            msg = f"✅ *Parol o'rnatildi\\!*\n\n"
            msg += f"👤 {esc(ism or str(target_id))}\n"
            if new_login:
                msg += f"🔑 Login: `{esc(new_login)}`\n"
            if tel:
                msg += f"📱 Telefon: `{esc(tel)}`\n"
            msg += f"🔒 Parol: `{esc(new_parol)}`\n\n"
            msg += f"Web panel: login yoki telefon \\+ parol bilan kiradi\\."
            await update.message.reply_text(msg, parse_mode=ParseMode.MARKDOWN_V2)
        except Exception as e:
            log.error("cmd_parol: %s", e, exc_info=True)
            await update.message.reply_text(f"❌ Xato: {e}")
    app.add_handler(CommandHandler("parol", cmd_parol))

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
    app.add_handler(CallbackQueryHandler(rasm_xizmat.rasm_nakladnoy_cb, pattern=r"^rasm:nakl"))
    app.add_handler(CallbackQueryHandler(rasm_xizmat.rasm_amal_cb, pattern=r"^rasm:(kirim|sotuv)"))
    app.add_handler(CommandHandler("tahlil", rasm_xizmat.kop_rasm_tahlil_cmd))
    app.add_handler(MessageHandler(filters.Document.ALL, hujjat_qabul))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND,matn_qabul))

    # ═══ INLINE QUERY — @savdoai_mashrab_bot qidirish ═══
    from telegram import InlineQueryResultArticle, InputTextMessageContent
    from telegram.ext import InlineQueryHandler

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

    app.add_handler(InlineQueryHandler(inline_qidirish))
    app.add_handler(CallbackQueryHandler(tasdiq_cb,         pattern=r"^t:"))
    app.add_handler(CallbackQueryHandler(nakladnoy_sessiya_cb,pattern=r"^n:sess:"))
    app.add_handler(CallbackQueryHandler(menyu_cb,          pattern=r"^m:"))
    app.add_handler(CallbackQueryHandler(hisobot_cb,        pattern=r"^hs:"))
    app.add_handler(CallbackQueryHandler(admin_cb,          pattern=r"^adm:"))
    app.add_handler(CallbackQueryHandler(paginatsiya_cb,    pattern=r"^(tv|kl):"))
    app.add_handler(CallbackQueryHandler(klient_hisobi_cb,  pattern=r"^kh:"))
    app.add_handler(CallbackQueryHandler(faktura_cb,        pattern=r"^fkt:"))
    app.add_handler(CallbackQueryHandler(eksport_cb,        pattern=r"^eks:"))
    app.add_handler(CallbackQueryHandler(_hujjat_cb, pattern=r"^huj:"))
    app.add_handler(CallbackQueryHandler(_hisobot_excel_cb, pattern=r"^hisob_excel:"))
    app.add_handler(CallbackQueryHandler(_tezkor_cb, pattern=r"^tez:"))
    app.add_handler(CommandHandler("menyu",            cmd_menyu))
    app.add_handler(CommandHandler("tez",              cmd_tez))
    app.add_handler(CommandHandler("guruh",            cmd_guruh))
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
    # Shogird xarajat
    app.add_handler(CommandHandler("narx_guruh",       cmd_narx_guruh))
    app.add_handler(CommandHandler("narx_qoy",         cmd_narx_qoy))
    app.add_handler(CommandHandler("klient_narx",      cmd_klient_narx))
    app.add_handler(CommandHandler("klient_guruh",     cmd_klient_guruh))
    app.add_handler(CommandHandler("shogird_qosh",     cmd_shogird_qosh))
    app.add_handler(CommandHandler("shogirdlar",       cmd_shogirdlar))
    app.add_handler(CommandHandler("xarajatlar",       cmd_xarajatlar))
    app.add_handler(CommandHandler("savatlar",         cmd_savatlar))
    app.add_handler(CommandHandler("savat",            cmd_savat))
    app.add_handler(CallbackQueryHandler(shogird_xarajat_cb, pattern=r"^sx:"))
    app.add_error_handler(xato_handler)
    return app


def _polling_lock_key(bot_token: str) -> str:
    """Bot token asosida barqaror lock kaliti (token logga chiqmaydi)."""
    import hashlib
    token_hash = hashlib.sha256(bot_token.encode("utf-8")).hexdigest()[:16]
    return f"savdoai:telegram:polling-lock:{token_hash}"


def _acquire_polling_singleton_lock(bot_token: str):
    """
    Redis bor bo'lsa, faqat bitta polling instance ishlashini kafolatlaydi.
    Lock band bo'lsa process chiqadi — "other getUpdates" konfliktini oldini oladi.
    """
    redis_url = _os.environ.get("REDIS_URL", "").strip()
    if not redis_url:
        log.warning("REDIS_URL topilmadi — polling singleton lock o'chirilgan.")
        return None, None

    import redis
    import socket
    import uuid

    lock_ttl = int(_os.environ.get("BOT_POLL_LOCK_TTL_SECONDS", "120"))
    owner = f"{socket.gethostname()}:{_os.getpid()}:{uuid.uuid4().hex[:8]}"
    key = _polling_lock_key(bot_token)
    client = redis.from_url(
        redis_url,
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
    )

    ok = client.set(key, owner, nx=True, ex=lock_ttl)
    if not ok:
        current_owner = client.get(key)
        raise RuntimeError(
            f"Polling lock band: {key} owner={current_owner}. "
            "Boshqa bot instance allaqachon getUpdates qilmoqda."
        )

    log.info("🔒 Polling singleton lock olindi: %s", key)
    return client, (key, owner)


def _release_polling_singleton_lock(lock_client, lock_meta) -> None:
    if not lock_client or not lock_meta:
        return
    key, owner = lock_meta
    try:
        current = lock_client.get(key)
        if current == owner:
            lock_client.delete(key)
            log.info("🔓 Polling singleton lock bo'shatildi: %s", key)
    except Exception as e:
        log.warning("Polling lock bo'shatishda xato: %s", e)


def _start_polling_lock_heartbeat(lock_client, lock_meta):
    """
    Polling davomida lock TTL yangilanib turadi.
    """
    if not lock_client or not lock_meta:
        return None

    import threading

    key, owner = lock_meta
    lock_ttl = int(_os.environ.get("BOT_POLL_LOCK_TTL_SECONDS", "120"))
    interval = max(10, lock_ttl // 3)
    stop_event = threading.Event()

    def _worker() -> None:
        while not stop_event.is_set():
            stop_event.wait(interval)
            if stop_event.is_set():
                break
            try:
                current = lock_client.get(key)
                if current == owner:
                    lock_client.expire(key, lock_ttl)
                else:
                    log.warning("⚠️ Polling lock owner o'zgardi: %s", key)
                    break
            except Exception as e:
                log.warning("Polling lock heartbeat xato: %s", e)

    t = threading.Thread(target=_worker, name="polling-lock-heartbeat", daemon=True)
    t.start()
    return stop_event


def main() -> None:
    # Lock avval — takroriy instance tez chiqadi; ilovani_qur og'ir (handlerlar).
    conf = config_init()
    lock_client = None
    lock_meta = None
    lock_heartbeat_stop = None
    try:
        lock_client, lock_meta = _acquire_polling_singleton_lock(conf.bot_token)
        lock_heartbeat_stop = _start_polling_lock_heartbeat(lock_client, lock_meta)
    except RuntimeError as e:
        log.critical("⛔ Bot ishga tushmadi: %s", e)
        raise SystemExit(1) from e

    try:
        app = ilovani_qur(conf)
        log.info("▶️  Polling boshlandi...")
        # Webhook tozalash (agar webhook qolgan bo'lsa — polling ishlamaydi!)
        try:
            import httpx
            r = httpx.get(f"https://api.telegram.org/bot{conf.bot_token}/deleteWebhook?drop_pending_updates=true", timeout=10)
            log.info("🔄 Webhook tozalandi: %s", r.text[:100])
        except Exception as _wh:
            log.warning("Webhook tozalash: %s", _wh)
        try:
            app.run_polling(
                allowed_updates=Update.ALL_TYPES,
                drop_pending_updates=True,
                close_loop=False,
            )
        except KeyboardInterrupt:
            log.info("⏹️  Bot to'xtatildi (KeyboardInterrupt)")
        except Exception as e:
            log.error("⛔ Bot xatosi: %s", e, exc_info=True)
            raise
    finally:
        if lock_heartbeat_stop is not None:
            lock_heartbeat_stop.set()
        _release_polling_singleton_lock(lock_client, lock_meta)


if __name__=="__main__":
    main()
