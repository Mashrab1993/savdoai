"""
SAVDOAI v25.3 — Rasm handler PRO (Vision AI → DB → Nakladnoy)
✅ Nakladnoy, chek, daftar, kvitansiya — barchasi
✅ Caption dan tur aniqlash ("daftar", "chek")
✅ Ko'p rasm — bitta hujjatning bir nechta sahifasi
✅ Qarz ma'lumoti ko'rsatish
✅ Ovozli tasdiqlash (TTS)
"""
from __future__ import annotations
import io, logging, time
log = logging.getLogger(__name__)

# Ko'p rasm uchun — 15 soniya ichida kelgan rasmlar 1 guruhga
_MULTI_RASM: dict[int, dict] = {}
_MULTI_TIMEOUT = 15  # sekund
_MULTI_MAX_USERS = 500  # xotira himoyasi
_MULTI_EXPIRE = 120  # 2 daqiqadan eski yozuvlarni o'chirish


def _multi_rasm_tozala():
    """Eski va ko'p yozuvlarni tozalash — rasm bytes xotirada qolmasin."""
    if len(_MULTI_RASM) <= _MULTI_MAX_USERS:
        return
    import time
    now = time.time()
    expired = [uid for uid, v in _MULTI_RASM.items()
               if now - v.get("vaqt", 0) > _MULTI_EXPIRE]
    for uid in expired:
        _MULTI_RASM.pop(uid, None)
    # Hali ham ko'p bo'lsa — eng eskilarini o'chirish
    if len(_MULTI_RASM) > _MULTI_MAX_USERS:
        sorted_keys = sorted(_MULTI_RASM.keys(),
                             key=lambda k: _MULTI_RASM[k].get("vaqt", 0))
        for k in sorted_keys[:len(_MULTI_RASM) - _MULTI_MAX_USERS]:
            _MULTI_RASM.pop(k, None)


def _tur_aniqla_captiondan(caption: str) -> str:
    """Caption dan hujjat turini aniqlash."""
    if not caption:
        return ""
    c = caption.lower()
    if any(s in c for s in ("daftar", "spiska", "qarz", "записная", "тетрадь")):
        return "daftar"
    if any(s in c for s in ("chek", "чек", "receipt", "kassa")):
        return "chek"
    if any(s in c for s in ("nakladnoy", "накладная", "invoice")):
        return "nakladnoy"
    return ""


def _pul(v) -> str:
    try:
        from decimal import Decimal
        return f"{Decimal(str(v or 0)):,.0f}"
    except Exception:
        return "0"


async def rasm_qabul(update, ctx) -> None:
    """
    Rasm xabar handler PRO.
    1. Caption dan tur aniqlash
    2. Ko'p rasm guruhlash (15s ichida)
    3. Vision AI PRO tahlil
    4. Tasdiqlash tugmalari + DB + Nakladnoy
    """
    if not update.message or not update.message.photo:
        return

    uid = update.effective_user.id
    caption = update.message.caption or ""
    tur_hint = _tur_aniqla_captiondan(caption)

    # Ko'p rasm tekshirish — oldingi rasm 15s ichida kelganmi?
    now = time.time()
    if uid in _MULTI_RASM and (now - _MULTI_RASM[uid]["vaqt"]) < _MULTI_TIMEOUT:
        # Yana rasm keldi — guruhga qo'shish
        photo = update.message.photo[-1]
        fayl = await ctx.bot.get_file(photo.file_id)
        rasm_bytes = bytes(await fayl.download_as_bytearray())
        _MULTI_RASM[uid]["rasmlar"].append(rasm_bytes)
        _MULTI_RASM[uid]["vaqt"] = now
        soni = len(_MULTI_RASM[uid]["rasmlar"])
        await update.message.reply_text(
            f"📸 {soni}-rasm qabul qilindi. Yana yuboring yoki /tahlil buyrug'ini bering.")
        return

    # Birinchi rasm
    holat = await update.message.reply_text("⏳ Rasm tahlil qilinmoqda...")

    try:
        photo = update.message.photo[-1]
        fayl = await ctx.bot.get_file(photo.file_id)
        rasm_bytes = bytes(await fayl.download_as_bytearray())

        # Multi-rasm navbatga qo'yish
        _multi_rasm_tozala()
        _MULTI_RASM[uid] = {"rasmlar": [rasm_bytes], "vaqt": now, "tur": tur_hint}

        # Vision AI PRO
        try:
            from shared.services.vision import rasm_tahlil
            natija = await rasm_tahlil(rasm_bytes, "image/jpeg", tur_hint=tur_hint)
        except ImportError:
            await holat.edit_text("⚠️ Vision AI moduli mavjud emas.")
            return

        # ═══ OCR POST-PROCESSOR — math tekshirish (v25.3.2) ═══
        try:
            from shared.services.ocr_processor import ocr_matn_parse
            raw_matn = natija.get("izoh", "") or natija.get("xulosa", "")
            if raw_matn and len(raw_matn) > 20:
                ocr_data = ocr_matn_parse(raw_matn)
                if ocr_data["tovarlar_soni"] > 0:
                    natija["_ocr_validated"] = ocr_data
                    natija["_ocr_math_ok"] = all(
                        t["miqdor"] * t["narx"] == t["jami"]
                        for t in ocr_data["tovarlar"]
                    )
                    log.info("OCR post-process: %d tovar, math=%s",
                             ocr_data["tovarlar_soni"], natija["_ocr_math_ok"])
        except Exception as _opp:
            log.debug("OCR post-process: %s", _opp)

        # Natija formatlash
        await _natija_korsatish(holat, natija, ctx, uid, tur_hint)

    except Exception as xato:
        log.error("rasm_qabul: %s", xato, exc_info=True)
        await holat.edit_text(
            "🤔 Rasm tahlilida xato yuz berdi.\n\n"
            "Tavsiyalar:\n"
            "• Rasmni yaqinroqdan oling\n"
            "• Yorug'lik yetarli bo'lsin\n"
            "• Hujjatni tekis yuzaga qo'ying")


async def kop_rasm_tahlil_cmd(update, ctx) -> None:
    """
    /tahlil buyrug'i — ko'p rasmni birgalikda tahlil qilish.
    Foydalanuvchi bir nechta rasm yuborib, /tahlil deydi.
    """
    uid = update.effective_user.id
    if uid not in _MULTI_RASM or not _MULTI_RASM[uid]["rasmlar"]:
        await update.message.reply_text("📸 Avval rasm(lar) yuboring, keyin /tahlil deng.")
        return

    rasmlar = _MULTI_RASM[uid]["rasmlar"]
    tur_hint = _MULTI_RASM[uid].get("tur", "")
    soni = len(rasmlar)

    holat = await update.message.reply_text(f"⏳ {soni} ta rasm birgalikda tahlil qilinmoqda...")

    try:
        if soni == 1:
            from shared.services.vision import rasm_tahlil
            natija = await rasm_tahlil(rasmlar[0], "image/jpeg", tur_hint=tur_hint)
        else:
            from shared.services.vision import kop_rasm_tahlil
            natija = await kop_rasm_tahlil(rasmlar, "image/jpeg")

        await _natija_korsatish(holat, natija, ctx, uid, tur_hint)
    except Exception as e:
        log.error("kop_rasm_tahlil: %s", e, exc_info=True)
        await holat.edit_text("❌ Ko'p rasmli tahlilda xato")
    finally:
        _MULTI_RASM.pop(uid, None)


async def _natija_korsatish(holat, natija, ctx, uid, tur_hint=""):
    """Natijani formatlash va ko'rsatish — barcha tur uchun universal."""
    ishonch = float(natija.get("ishonch", 0))
    tur = natija.get("tur", "noaniq")

    if tur == "xato" or ishonch < 0.2:
        await holat.edit_text(
            "🤔 Rasm tushunilmadi.\n\n"
            "Tavsiyalar:\n"
            "• Rasmni yaqinroqdan oling\n"
            "• Yorug'lik yetarli bo'lsin\n"
            "• Caption ga yozing: 'daftar', 'chek' yoki 'nakladnoy'")
        return

    # ISHONCH DARAJASI RANG
    if ishonch >= 0.8:
        ishonch_str = f"🟢 {ishonch:.0%}"
    elif ishonch >= 0.5:
        ishonch_str = f"🟡 {ishonch:.0%}"
    else:
        ishonch_str = f"🔴 {ishonch:.0%}"

    TUR_EMOJI = {"nakladnoy": "📋", "chek": "🧾", "daftar": "📒",
                 "kvitansiya": "💳", "spiska": "📝", "faktura": "📄"}
    tur_emoji = TUR_EMOJI.get(tur, "📄")

    matn = f"📸 *RASM TAHLILI* ({ishonch_str})\n"
    matn += f"{tur_emoji} Tur: *{tur}*\n"

    if natija.get("raqam"):
        matn += f"🔢 №: {natija['raqam']}\n"
    if natija.get("klient"):
        matn += f"👤 Klient: *{natija['klient']}*\n"
    if natija.get("sotuvchi"):
        matn += f"🏪 Sotuvchi: {natija['sotuvchi']}\n"
    if natija.get("sana"):
        matn += f"📅 Sana: {natija['sana']}\n"

    tovarlar = natija.get("tovarlar", [])
    if tovarlar:
        matn += f"\n📦 *Tovarlar ({len(tovarlar)} ta):*\n"
        for i, t in enumerate(tovarlar[:20], 1):
            nomi = t.get("nomi", "?")
            miq = t.get("miqdor", 0)
            birlik = t.get("birlik", "dona")
            narx = float(t.get("narx", 0))
            jami = float(t.get("jami", 0))
            qator = f"  {i}. {nomi}"
            if miq: qator += f" — {miq} {birlik}"
            if narx > 0: qator += f" × {_pul(narx)}"
            if jami > 0: qator += f" = {_pul(jami)}"
            matn += qator + "\n"
        if len(tovarlar) > 20:
            matn += f"  ...va yana {len(tovarlar) - 20} ta\n"

    jami = float(natija.get("jami_summa", 0))
    tolangan = float(natija.get("tolangan", 0))
    qarz = float(natija.get("qarz", 0))

    if jami > 0:
        matn += f"\n💰 *Jami: {_pul(jami)} so'm*"
        if tolangan > 0 and tolangan < jami:
            matn += f"\n✅ To'langan: {_pul(tolangan)}"
        if qarz > 0:
            matn += f"\n⚠️ Qarz: {_pul(qarz)}"

    if natija.get("qoshimcha_matn"):
        matn += f"\n\n📝 {natija['qoshimcha_matn'][:200]}"
    elif natija.get("izoh"):
        matn += f"\n\n📝 {natija['izoh'][:200]}"

    from telegram.constants import ParseMode
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup

    if tovarlar and ishonch >= 0.4:
        # DB saqlash uchun ma'lumot tayyorlash
        amal = "kirim"
        if tur in ("nakladnoy", "faktura", "chek"):
            amal = "chiqim"

        ai_data = {
            "amal": amal,
            "klient": natija.get("klient"),
            "tovarlar": [
                {
                    "nomi": t.get("nomi", "?"),
                    "miqdor": t.get("miqdor", 0),
                    "birlik": t.get("birlik", "dona"),
                    "narx": float(t.get("narx", 0)),
                    "jami": float(t.get("jami", 0)),
                    "kategoriya": "Boshqa",
                }
                for t in tovarlar
            ],
            "jami_summa": jami,
            "tolangan": tolangan if tolangan > 0 else jami,
            "qarz": qarz,
            "manba": "vision_ai",
            "izoh": f"Rasmdan o'qildi ({tur}, ishonch: {ishonch:.0%})",
        }
        ctx.user_data["kutilayotgan"] = ai_data
        ctx.user_data["_vision_src"] = True

        amal_label = "Sotuv" if amal == "chiqim" else "Kirim"
        matn += f"\n\n⬇️ *{amal_label} sifatida saqlash uchun tasdiqlang:*"

        tugmalar = [
            [InlineKeyboardButton(f"✅ {amal_label} → DB + Nakladnoy", callback_data="t:ha")],
            [InlineKeyboardButton("📋 Faqat nakladnoy", callback_data="rasm:nakl")],
        ]
        # Tur noto'g'ri bo'lsa teskari qilish imkoni
        if amal == "chiqim":
            tugmalar.append(
                [InlineKeyboardButton("📥 Kirim sifatida saqlash", callback_data="rasm:kirim")])
        else:
            tugmalar.append(
                [InlineKeyboardButton("📤 Sotuv sifatida saqlash", callback_data="rasm:sotuv")])
        tugmalar.append([InlineKeyboardButton("❌ Bekor", callback_data="t:yoq")])

        markup = InlineKeyboardMarkup(tugmalar)
        await holat.edit_text(matn, parse_mode=ParseMode.MARKDOWN, reply_markup=markup)
    else:
        if ishonch < 0.5:
            matn += "\n\n💡 _Aniqroq rasm yuborsangiz yaxshiroq o'qiy olaman._"
        await holat.edit_text(matn, parse_mode=ParseMode.MARKDOWN)


async def rasm_amal_cb(update, ctx) -> None:
    """rasm:kirim yoki rasm:sotuv — amal turini o'zgartirish."""
    q = update.callback_query
    await q.answer()

    natija = ctx.user_data.get("kutilayotgan")
    if not natija:
        await q.message.reply_text("❌ Ma'lumot topilmadi.")
        return

    sub = q.data.split(":")[1]  # kirim yoki sotuv
    if sub == "kirim":
        natija["amal"] = "kirim"
        await q.message.reply_text("📥 Kirim sifatida belgilandi. ✅ Tasdiqlash tugmasini bosing.")
    elif sub == "sotuv":
        natija["amal"] = "chiqim"
        await q.message.reply_text("📤 Sotuv sifatida belgilandi. ✅ Tasdiqlash tugmasini bosing.")


async def rasm_nakladnoy_cb(update, ctx) -> None:
    """Rasmdan o'qilgan ma'lumotlar uchun faqat nakladnoy (DB siz)."""
    q = update.callback_query
    await q.answer("Nakladnoy tayyorlanmoqda...")
    uid = update.effective_user.id

    natija = ctx.user_data.get("kutilayotgan")
    if not natija or not natija.get("tovarlar"):
        await q.message.reply_text("❌ Ma'lumot topilmadi. Qayta yuboring.")
        return

    try:
        import services.bot.bot_services.nakladnoy as nak_xizmat
        from services.bot.db import user_ol
        from telegram import InputFile

        user = await user_ol(uid)
        dokon = user.get("dokon_nomi", "Mashrab Moliya") if user else "Mashrab Moliya"
        inv_no = nak_xizmat.nakladnoy_nomeri()

        data = {
            "inv_no": inv_no,
            "dokon_nomi": dokon,
            "klient_ismi": natija.get("klient") or "Noma'lum",
            "tovarlar": natija["tovarlar"],
            "jami_summa": natija.get("jami_summa", 0),
            "qarz": natija.get("qarz", 0),
            "tolangan": natija.get("tolangan", 0),
        }
        fayllar = nak_xizmat.uchala_format(data)

        klient = natija.get("klient") or "rasm"
        for nom, kalit, caption in [
            (f"Nakladnoy_{inv_no}_{klient[:15]}.docx", "word", "📝 Word"),
            (f"Nakladnoy_{inv_no}_{klient[:15]}.xlsx", "excel", "📊 Excel"),
            (f"Nakladnoy_{inv_no}_{klient[:15]}.pdf", "pdf", "📄 PDF"),
        ]:
            if fayllar.get(kalit):
                await q.message.reply_document(
                    document=InputFile(io.BytesIO(fayllar[kalit]), filename=nom),
                    caption=caption)

        ctx.user_data.pop("kutilayotgan", None)
        ctx.user_data.pop("_vision_src", None)
    except Exception as e:
        log.error("rasm_nakladnoy_cb: %s", e, exc_info=True)
        await q.message.reply_text("❌ Nakladnoy yaratishda xato")
