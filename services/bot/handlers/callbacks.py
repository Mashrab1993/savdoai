"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — CALLBACK HANDLERLARI                             ║
║  Menyu, hisobot, eksport, nakladnoy callback'lar            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import logging
from decimal import Decimal

from telegram import Update, InputFile
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
import services.bot.bot_services.export_pdf as pdf_xizmat
import services.bot.bot_services.export_excel as excel_xizmat
import services.bot.bot_services.nakladnoy as nakl_xizmat
from services.bot.bot_helpers import (
    faol_tekshir, _user_ol_kesh, xat, tg, cfg,
    _kesh_tozala,
)

# Lazy imports — circular dependency
def _get_chek_thermal():
    from services.bot.handlers.savdo import _chek_thermal_va_pdf_yuborish
    return _chek_thermal_va_pdf_yuborish

def _get_cmd_jurnal():
    from services.bot.handlers.commands import cmd_jurnal
    return cmd_jurnal

def _get_cmd_balans():
    from services.bot.handlers.commands import cmd_balans
    return cmd_balans
from shared.utils.fmt import (
    pul, SAHIFA, kunlik_matn, oylik_matn, foyda_matn,
    klient_hisobi_matn,
)

log = logging.getLogger("mm")

# main.py dan import — circular import oldini olish uchun lazy
def _get_segment_nomi():
    from services.bot.main import SEGMENT_NOMI
    return SEGMENT_NOMI

def _get_asosiy_menyu():
    from services.bot.main import asosiy_menyu
    return asosiy_menyu

def _get_version():
    from services.bot.main import __version__
    return __version__


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
                await _get_chek_thermal()(q.message, d, dokon, f"chek_{sess_id}")
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
        except Exception as _e: log.debug("silent: %s", _e)
    data={"invoice_number":inv_no,"dokon_nomi":dokon,
          "dokon_telefon":(user.get("telefon","") or "") if user else "",
          "dokon_inn":(user.get("inn","") or "") if user else "",
          "dokon_manzil":(user.get("manzil","") or "") if user else "",
          "klient_ismi":klient,"klient_telefon":kl_tel,
          "klient_manzil":kl_manzil,"klient_inn":kl_inn,
          "tovarlar":sess_data.get("tovarlar",[]),"jami_summa":sess_data.get("jami_summa",0),
          "qarz":sess_data.get("qarz",0),"tolangan":sess_data.get("tolangan",0),"izoh":None}
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
                    WHERE user_id=$1 AND (yaratilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
                """, uid)
                usullar = await c.fetch("""
                    SELECT usul,
                        COALESCE(SUM(CASE WHEN tur='kirim' THEN summa ELSE -summa END), 0) AS balans
                    FROM kassa_operatsiyalar WHERE user_id=$1 GROUP BY usul
                """, uid)
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
        await _get_cmd_jurnal()(update, ctx)
    elif akt=="balans":
        await _get_cmd_balans()(update, ctx)
    elif akt=="yangilik":
        # Yangiliklar — menyu orqali
        await xat(q,
            f"🆕 *v{_get_version()} YANGILIKLAR*\n\n"
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
                    FROM tovarlar WHERE user_id=$1 AND qoldiq > 0
                """, uid)
            await xat(q,
                "🏭 *OMBOR HOLATI*\n\n"
                f"📦 Tovarlar: *{stats['soni']}* ta\n"
                f"💰 Umumiy qiymat: *{pul(stats['qiymat'])}*\n\n"
                "/ombor — batafsil",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=tg([("⬅️ Orqaga", "m:orqaga")]))
        except Exception as _e:
            log.debug("Xato: %s", _e)
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
        except Exception as _e:
            log.debug("Xato: %s", _e)
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
        await xat(q,"📋 Asosiy menyu:",reply_markup=_get_asosiy_menyu()())
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


async def admin_cb(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query; await q.answer()
    if not cfg().is_admin(q.from_user.id): return
    qismlar=q.data.split(":"); uid=int(qismlar[2])
    if qismlar[1]=="ok":
        await db.user_faollashtir(uid); await db.user_yangilab(uid,faol=True)
        _kesh_tozala(f"user:{uid}")
        try: await ctx.bot.send_message(uid,"✅ Hisobingiz faollashtirildi! /start bosing.")
        except Exception as _e: log.debug("silent: %s", _e)
        await xat(q,f"✅ `{uid}` faollashtirildi!",parse_mode=ParseMode.MARKDOWN)
    else: await xat(q,f"❌ `{uid}` rad etildi.",parse_mode=ParseMode.MARKDOWN)


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


