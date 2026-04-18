"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — HUJJAT HANDLER                                   ║
║  PDF, Word, Excel, EPUB... — 40 format                      ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import logging

from telegram import Update, InputFile, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("mm")


def _nakladnoy_pdf(h: dict, fname: str) -> bytes | None:
    """Nakladnoy uchun professional PDF audit hisobot."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas as canv
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
    except ImportError:
        log.debug("reportlab yo'q — PDF yaratilmaydi")
        return None

    # Cyrillic shrift
    import os
    _font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    _font_ok = False
    for _fp in _font_paths:
        if os.path.exists(_fp):
            _font_ok = True
            break
    
    if _font_ok:
        try:
            pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
            pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
            FONT = "DV"
            FONTB = "DVB"
        except Exception:
            FONT = "Helvetica"
            FONTB = "Helvetica-Bold"
    else:
        FONT = "Helvetica"
        FONTB = "Helvetica-Bold"

    def sf(v):
        try: return float(str(v).replace(",","").replace(" ",""))
        except Exception: return 0

    naklarlar = h.get("nakladnoylar", [])
    if not naklarlar:
        return None

    buf = io.BytesIO()
    c = canv.Canvas(buf, pagesize=A4)
    w, page_h = A4
    y = page_h - 30*mm

    def yoz(text, size=10, bold=False, indent=15):
        nonlocal y
        if y < 25*mm:
            c.showPage()
            y = page_h - 20*mm
        font = FONTB if bold else FONT
        c.setFont(font, size)
        c.drawString(indent*mm, y, text)
        y -= (size + 4)

    def chiziq():
        nonlocal y
        c.setStrokeColorRGB(0.3, 0.3, 0.3)
        c.line(15*mm, y, w - 15*mm, y)
        y -= 6

    # Sarlavha
    yoz("MASHRAB MOLIYA — NAKLADNOY AUDIT HISOBOTI", 14, True)
    yoz(f"Fayl: {fname}", 9)
    yoz(f"Sana: {h.get('sana','?')} | Firma: {h.get('firma','?')}", 9)
    chiziq()

    # Umumiy
    yoz("UMUMIY KO'RSATKICHLAR", 12, True)
    yoz(f"Nakladnoylar: {len(naklarlar)}")
    yoz(f"Tovar xillari: {h.get('tovar_xillari', 0)}")
    yoz(f"Jami summa: {h.get('jami_summa',0):,.0f} so'm")
    yoz(f"Qatorlar: {h.get('qator_soni', 0)}")
    chiziq()

    # TP reyting
    tp_data = {}
    for n in naklarlar:
        tp = n.get("tp","?")
        if tp not in tp_data: tp_data[tp] = {"soni":0,"jami":0,"kl":set()}
        tp_data[tp]["soni"] += 1
        tp_data[tp]["jami"] += n.get("jami",0)
        tp_data[tp]["kl"].add(n.get("klient",""))

    yoz("TP SAMARADORLIK REYTINGI", 12, True)
    for i,(tp,d) in enumerate(sorted(tp_data.items(), key=lambda x:-x[1]["jami"]),1):
        ort = d["jami"]/len(d["kl"]) if d["kl"] else 0
        yoz(f"  {i}. {tp}: {len(d['kl'])} klient, {d['jami']:,.0f} so'm, o'rt: {ort:,.0f}")
    chiziq()

    # Klient ma'lumotlari
    kl_data = {}
    for n in naklarlar:
        k = n.get("klient","?")
        if k not in kl_data: kl_data[k] = {"jami":0,"soni":0,"balans":sf(n.get("balans",0)),"tp":n.get("tp","")}
        kl_data[k]["jami"] += n.get("jami",0)
        kl_data[k]["soni"] += 1

    # Top klientlar
    yoz("TOP 15 KLIENTLAR", 12, True)
    for i,(k,d) in enumerate(sorted(kl_data.items(), key=lambda x:-x[1]["jami"])[:15],1):
        q = " [QARZ]" if d["balans"] < 0 else ""
        yoz(f"  {i}. {k[:40]}: {d['jami']:,.0f}{q}")
    chiziq()

    # Top tovarlar
    tv = h.get("tovarlar", {})
    if isinstance(tv, dict) and tv:
        yoz("TOP 15 TOVARLAR", 12, True)
        for i,(nomi,vals) in enumerate(sorted(tv.items(), key=lambda x:-x[1][1] if isinstance(x[1],list) else 0)[:15],1):
            if isinstance(vals, list) and len(vals) >= 2:
                yoz(f"  {i}. {nomi[:40]}: {vals[0]:.0f} dona, {vals[1]:,.0f} so'm")
        chiziq()

    # Qarzli klientlar
    qarzli = [(k,d) for k,d in kl_data.items() if d["balans"] < 0]
    qarzli.sort(key=lambda x: x[1]["balans"])
    if qarzli:
        yoz(f"QARZLI KLIENTLAR ({len(qarzli)} ta)", 12, True)
        jami_qarz = 0
        for i,(k,d) in enumerate(qarzli,1):
            yoz(f"  {i}. {k[:40]}: {d['balans']:,.0f} so'm")
            jami_qarz += d["balans"]
        yoz(f"  JAMI QARZ: {jami_qarz:,.0f} so'm", 10, True)
        chiziq()

    # Statistika
    jami_kl = len(kl_data)
    ort = h.get("jami_summa",0) / jami_kl if jami_kl else 0
    yoz("STATISTIKA", 12, True)
    yoz(f"  Klientlar: {jami_kl}")
    yoz(f"  O'rtacha chek: {ort:,.0f} so'm")
    yoz(f"  Eng katta: {max(d['jami'] for d in kl_data.values()):,.0f} so'm")
    yoz(f"  Qarzli: {len(qarzli)}/{jami_kl} ({len(qarzli)*100//jami_kl if jami_kl else 0}%)")
    chiziq()

    # Footer
    yoz(f"Mashrab Moliya Audit Tizimi | {h.get('sana','?')} | Avtomatik yaratilgan", 8)

    c.save()
    return buf.getvalue()


# Lazy import — circular dependency oldini olish
def _get_cfg():
    from services.bot.main import cfg
    return cfg()


async def hujjat_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    """PDF, Word, Excel, EPUB, PPTX... — 40 format, 100K+ sahifa"""
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
            # ═══ EXCEL CHAT — faqat /excel rejimi yoqilganda ═══
            try:
                from services.bot.handlers.excel_chat import excel_chat_active
                if excel_chat_active(ctx) or ctx.user_data.get("excel_chat_active"):
                    from services.bot.handlers.excel_chat import excel_file_qabul
                    excel_handled = await excel_file_qabul(update, ctx)
                    if excel_handled:
                        try:
                            await holat.delete()
                        except Exception:
                            pass
                        return
            except Exception as _ec_e:
                log.debug("Excel chat hook: %s", _ec_e)

            # ═══ NAKLADNOY TEKSHIRISH (v25.3.2) ═══
            try:
                log.info("📋 Nakladnoy tekshirish boshlandi: %s (%dKB)", fname, len(data)//1024)
                from shared.services.nakladnoy_parser import nakladnoy_ekanligini_tekshir, nakladnoy_tahlil, nakladnoy_xulosa_matn
                nak_bool = nakladnoy_ekanligini_tekshir(data)
                log.info("📋 Nakladnoy tekshirish natija: %s", nak_bool)
                if nak_bool:
                    log.info("📋 Nakladnoy Excel aniqlandi: %s (%dKB)", fname, len(data)//1024)

                    # Katta fayl uchun progress
                    if len(data) > 500_000:  # 500KB+
                        try:
                            await holat.edit_text(
                                f"📋 Katta nakladnoy fayl ({len(data)//1024}KB)...\n"
                                f"⏳ Tahlil qilmoqdaman, 10-30 soniya kutib turing...",
                                parse_mode=ParseMode.MARKDOWN)
                        except Exception:
                            pass

                    h = nakladnoy_tahlil(data)
                    h["tur"] = "nakladnoy"
                    ctx.user_data["hujjat"] = h
                    ctx.user_data["hujjat_nomi"] = fname
                    ctx.user_data["_nakladnoy_data"] = h  # Import uchun saqlash
                    xulosa = nakladnoy_xulosa_matn(h, fname)

                    # Import tugmasi
                    markup = InlineKeyboardMarkup([
                        [InlineKeyboardButton(
                            f"📥 Import ({h['jami_soni']} nakladnoy)",
                            callback_data="nak:import")],
                        [InlineKeyboardButton(
                            "👥 TP reyting",
                            callback_data="reestr:tp")],
                    ])
                    try:
                        await holat.edit_text(xulosa, parse_mode=ParseMode.MARKDOWN,
                                              reply_markup=markup)
                    except Exception:
                        await holat.edit_text(xulosa.replace("*", "").replace("_", ""),
                                              reply_markup=markup)
                    
                    # ═══ PDF AUDIT HISOBOT (v25.3.2) ═══
                    try:
                        pdf_bytes = _nakladnoy_pdf(h, fname)
                        if pdf_bytes:
                            pdf_nom = fname.replace(".xlsx","").replace(".xls","") + "_AUDIT.pdf"
                            await update.message.reply_document(
                                document=InputFile(io.BytesIO(pdf_bytes), filename=pdf_nom),
                                caption="📋 Nakladnoy Audit Hisoboti — Mashrab Moliya")
                    except Exception as _pe:
                        log.warning("Nakladnoy PDF: %s", _pe)
                    
                    return
            except Exception as _nak_e:
                log.warning("Nakladnoy check xato: %s", _nak_e, exc_info=True)

            # ═══ REESTR TEKSHIRISH (v25.3.2) ═══
            try:
                from shared.services.reestr_parser import reestr_ekanligini_tekshir, reestr_tahlil, reestr_xulosa_matn
                if reestr_ekanligini_tekshir(data):
                    log.info("📊 Reestr Excel aniqlandi: %s", fname)
                    if len(data) > 500_000:
                        try:
                            await holat.edit_text("📊 Katta reestr fayl... tahlil qilmoqdaman...")
                        except Exception:
                            pass
                    h = reestr_tahlil(data)
                    h["tur"] = "reestr"
                    ctx.user_data["hujjat"] = h
                    ctx.user_data["hujjat_nomi"] = fname
                    ctx.user_data["_reestr_data"] = h
                    xulosa = reestr_xulosa_matn(h, fname)

                    # TP tahlil tugmasi
                    markup = InlineKeyboardMarkup([
                        [InlineKeyboardButton("👥 TP reyting", callback_data="reestr:tp")],
                    ])
                    try:
                        await holat.edit_text(xulosa, parse_mode=ParseMode.MARKDOWN,
                                              reply_markup=markup)
                    except Exception:
                        await holat.edit_text(xulosa.replace("*", "").replace("_", ""),
                                              reply_markup=markup)
                    return
            except Exception as _ree_e:
                log.warning("Reestr check xato: %s", _ree_e, exc_info=True)

            # ═══ ODDIY EXCEL (kassa hisobot) ═══
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
                    await update.message.reply_document(
                        document=InputFile(io.BytesIO(pdf_bytes), filename=pdf_nom),
                        caption="📊 Mashrab Moliya — Auditor Hisoboti")
            except Exception as _pe:
                log.warning("Excel PDF: %s", _pe)
            
            # ═══ AVTOMATIK AI TAHLIL — CLAUDE SONNET (AUDITOR DARAJASI) ═══
            try:
                import os
                
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

                    from shared.services.ai_suhbat import _get_suhbat_client
                    _aclient = _get_suhbat_client()
                    if not _aclient:
                        raise RuntimeError("Anthropic client yo'q")
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
        except Exception as _e:
            log.debug("Xato: %s", _e)
            # MARKDOWN xato — plain text
            plain = xulosa.replace("*","").replace("_","").replace("`","")
            try:
                await holat.edit_text(plain, reply_markup=markup)
            except Exception as _e:
                log.debug("Xato: %s", _e)
                await holat.edit_text(f"📂 {fname} o'qildi. Sahifalar: {h.get('sahifalar_soni',0)}", reply_markup=markup)

    except Exception as e:
        log.error("hujjat_qabul: %s", e, exc_info=True)
        await holat.edit_text(f"❌ *{fname}* o'qishda xato yuz berdi", parse_mode=ParseMode.MARKDOWN)
