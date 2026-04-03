"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — SAVDO PIPELINE                                    ║
║  AI tahlil → Draft → Tasdiqlash → DB → Audit → Chek         ║
║                                                              ║
║  Tarkib:                                                     ║
║  • _qayta_ishlash — AI natijasini qayta ishlash              ║
║  • tasdiq_cb — tasdiqlash tugmasi callback                   ║
║  • _nakladnoy_yuborish — nakladnoy yaratish                  ║
║  • _audit_* — audit log yozish                               ║
║  • _savat_* — ochiq savat bilan ishlash                      ║
║  • _chek_thermal_va_pdf_yuborish — chek fayllar              ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import logging
import datetime
from decimal import Decimal

from telegram import (
    Update, InputFile,
    InlineKeyboardButton, InlineKeyboardMarkup,
)
from telegram.constants import ParseMode
from telegram.ext import ContextTypes
from telegram.helpers import escape_markdown

import services.bot.db as db
import services.bot.bot_services.analyst as ai_xizmat
import services.bot.bot_services.export_pdf as pdf_xizmat
import services.bot.bot_services.nakladnoy as nakl_xizmat
from services.bot.bot_helpers import (
    _user_ol_kesh, _kesh_tozala, xat, tg, _truncate, cfg,
)
from shared.utils.fmt import (
    pul, chek_md, kunlik_matn,
    sotuv_cheki, kirim_cheki, qaytarish_cheki,
)

log = logging.getLogger("mm")


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
                except Exception as _e:
                    log.debug("Xato: %s", _e)
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
        except Exception as _e:
            log.debug("Xato: %s", _e)
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
    except Exception as _e:
        log.debug("Xato: %s", _e)
        # MARKDOWN xato — plain text fallback
        plain = oldindan.replace("*","").replace("_","").replace("`","")
        try:
            if tahrirlash: await tahrirlash.edit_text(plain,reply_markup=markup)
            else: await update.message.reply_text(plain,reply_markup=markup)
        except Exception as _pe:
            log.warning("Preview yuborish: %s", _pe)


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
        except Exception as _e: log.debug("silent: %s", _e)

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
        except Exception as _e: log.debug("silent: %s", _e)

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

    # ═══ MAJBUR SAQLASH (qoldiq yetmasa ham) ═══
    # Bu handler o'zining alohida kalitidan o'qiydi — kutilayotgan EMAS!
    if q.data == "t:majbur":
        natija_m = ctx.user_data.pop("kutilayotgan_majbur", None)
        if not natija_m:
            await xat(q, "❌ Ma'lumot topilmadi."); return
        dokon = (user.get("dokon_nomi") or "") if user else ""
        try:
            sotuv_m = await db.sotuv_saqlash(uid, natija_m)
            chek_m  = sotuv_cheki(natija_m, dokon)
            await xat(q,
                "✅ *Sotuv saqlandi* (qoldiq yetmasa ham)\n\n" + chek_md(chek_m),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg(
                    [("📋 Nakladnoy", f"n:sess:{sotuv_m['sessiya_id']}")],
                    [("✅ OK", "m:orqaga")],
                ))
            try:
                natija_m["amal"] = "chiqim"
                await _chek_thermal_va_pdf_yuborish(
                    q.message, natija_m, dokon, f"chek_{sotuv_m['sessiya_id']}")
            except Exception as _pe:
                log.warning("Majbur chek fayllar: %s", _pe)
            try:
                from shared.services.bot_print_handler import send_print_session
                _m = dict(natija_m); _m["amal"] = "chiqim"
                _tel_u = (user.get("telefon") or "") if user else ""
                _pj = await send_print_session(
                    q.message, _m, dokon, _tel_u, uid, int(sotuv_m["sessiya_id"]))
                if _pj: ctx.user_data["last_print_job"] = _pj.get("job_id")
            except Exception as _prt2:
                log.warning("Print tugma (majbur): %s", _prt2)
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "chiqim", "tovarlar": natija_m.get("tovarlar", []),
                "klient": natija_m.get("klient", ""),
                "klient_ismi": natija_m.get("klient", ""),
                "jami_summa": natija_m.get("jami_summa", 0),
                "sessiya_id": sotuv_m.get("sessiya_id", 0),
            }
        except Exception as xato:
            log.error("tasdiq majbur: %s", xato, exc_info=True)
            await xat(q, "❌ Saqlashda xato yuz berdi")
        return

    # ═══ ZARAR SOTUV TASDIQLASH ═══
    if q.data == "t:zarar_tasdiq":
        natija_z = ctx.user_data.pop("kutilayotgan", None)
        if not natija_z:
            await xat(q, "❌ Ma'lumot topilmadi."); return
        dokon = (user.get("dokon_nomi") or "") if user else ""
        try:
            sotuv_z = await db.sotuv_saqlash(uid, natija_z)
            chek_z  = sotuv_cheki(natija_z, dokon)
            await xat(q,
                "⚠️ *Zarar sotuv saqlandi*\n\n" + chek_md(chek_z),
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg(
                    [("📋 Nakladnoy", f"n:sess:{sotuv_z['sessiya_id']}")],
                    [("✅ OK", "m:orqaga")],
                ))
            try:
                natija_z["amal"] = "chiqim"
                await _chek_thermal_va_pdf_yuborish(
                    q.message, natija_z, dokon, f"chek_{sotuv_z['sessiya_id']}")
            except Exception as _pe:
                log.warning("Zarar chek fayllar: %s", _pe)
            try:
                from shared.services.bot_print_handler import send_print_session
                _z = dict(natija_z); _z["amal"] = "chiqim"
                _tel_u = (user.get("telefon") or "") if user else ""
                _pj = await send_print_session(
                    q.message, _z, dokon, _tel_u, uid, int(sotuv_z["sessiya_id"]))
                if _pj: ctx.user_data["last_print_job"] = _pj.get("job_id")
            except Exception as _prt3:
                log.warning("Print tugma (zarar): %s", _prt3)
            ctx.user_data["_oxirgi_chek_data"] = {
                "amal": "chiqim", "tovarlar": natija_z.get("tovarlar", []),
                "klient": natija_z.get("klient", ""),
                "klient_ismi": natija_z.get("klient", ""),
                "jami_summa": natija_z.get("jami_summa", 0),
                "sessiya_id": sotuv_z.get("sessiya_id", 0),
            }
        except Exception as xato:
            log.error("tasdiq zarar: %s", xato, exc_info=True)
            await xat(q, "❌ Saqlashda xato yuz berdi")
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
            # ═══ SMART OGOHLAR (loyalty ball, kam qoldiq) ═══
            for ogoh in sotuv.get("ogohlar", []):
                javob += f"\n{ogoh}"
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
        except Exception as _e: log.debug("silent: %s", _e)

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
