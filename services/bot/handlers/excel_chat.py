"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXCEL CHAT HANDLER                               ║
║  Excel yuklash → AI bilan savol-javob                        ║
║                                                              ║
║  /excel — Excel chat rejimini yoqish/o'chirish               ║
║  Excel fayl yuborish → avtomatik tahlil                      ║
║  Matn yozish → AI javob (Excel kontekstida)                  ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import time

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from services.bot.bot_helpers import faol_tekshir

log = logging.getLogger("savdoai.excel_chat")

# user_data kalitlari
_KEY_EXCEL = "excel_chat_data"      # parsed excel dict
_KEY_TARIX = "excel_chat_tarix"     # savol-javob tarixi
_KEY_FNAME = "excel_chat_fname"     # fayl nomi
_KEY_VAQT = "excel_chat_vaqt"       # yuklangan vaqt
_KEY_ACTIVE = "excel_chat_active"   # rejim faolmi
_KEY_ANALYSIS = "excel_chat_analysis"  # analyzer natijasi
_KEY_BYTES = "excel_chat_bytes"     # fayl bytes (analyzer uchun)


def excel_chat_active(context: ContextTypes.DEFAULT_TYPE) -> bool:
    """Excel chat rejimi faolmi?"""
    ud = context.user_data or {}
    if not ud.get(_KEY_ACTIVE):
        return False
    if not ud.get(_KEY_EXCEL):
        return False
    # 2 soatdan keyin avtomatik o'chadi
    vaqt = ud.get(_KEY_VAQT, 0)
    if time.time() - vaqt > 7200:
        _clear(context)
        return False
    return True


def _clear(context: ContextTypes.DEFAULT_TYPE):
    """Excel chat ma'lumotlarini tozalash"""
    ud = context.user_data
    if ud:
        ud.pop(_KEY_EXCEL, None)
        ud.pop(_KEY_TARIX, None)
        ud.pop(_KEY_FNAME, None)
        ud.pop(_KEY_VAQT, None)
        ud.pop(_KEY_ACTIVE, None)
        ud.pop(_KEY_ANALYSIS, None)
        ud.pop(_KEY_BYTES, None)


async def cmd_excel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /excel buyrug'i — Excel chat rejimini yoqish/o'chirish.
    """
    if not await faol_tekshir(update):
        return

    if excel_chat_active(context):
        fname = context.user_data.get(_KEY_FNAME, "")
        kb = [
            [InlineKeyboardButton("🗑 Tozalash", callback_data="excel_clear"),
             InlineKeyboardButton("📊 Fayl haqida", callback_data="excel_info")]
        ]
        await update.message.reply_text(
            f"📊 Excel chat faol!\n"
            f"Fayl: `{fname}`\n\n"
            f"Savol yozing — javob beraman.\n"
            f"Yangi fayl yuborish mumkin.\n"
            f"/excel_stop — rejimni o'chirish",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(kb)
        )
    else:
        # Rejimni yoqish — keyingi Excel fayl excel_chat ga boradi
        context.user_data[_KEY_ACTIVE] = True
        context.user_data[_KEY_VAQT] = time.time()
        await update.message.reply_text(
            "📊 *Excel Chat yoqildi!*\n\n"
            "Excel fayl yuboring — men uni o'qib chiqaman.\n"
            "Keyin har qanday savol bering:\n\n"
            "• _Jami savdo qancha?_\n"
            "• _Фарход qancha oylik olgan?_\n"
            "• _Gazga qancha pul ketgan?_\n"
            "• _Eng katta savdo qaysi kuni?_\n\n"
            "👇 Excel faylni yuboring:",
            parse_mode=ParseMode.MARKDOWN
        )


async def cmd_excel_stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/excel_stop — Excel chat rejimini o'chirish"""
    _clear(context)
    await update.message.reply_text(
        "✅ Excel chat rejimi o'chirildi.\n"
        "Yangi fayl yuborish uchun /excel bosing."
    )


async def excel_file_qabul(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Excel fayl qabul qilish. True qaytarsa — fayl qabul qilindi.
    hujjat.py dan chaqiriladi.
    """
    doc = update.message.document
    if not doc:
        return False

    fname = (doc.file_name or "").lower()
    if not fname.endswith((".xlsx", ".xls", ".xlsm")):
        return False

    # Fayl hajmi tekshiruvi (10 MB limit)
    if doc.file_size and doc.file_size > 10 * 1024 * 1024:
        await update.message.reply_text(
            "❌ Fayl juda katta (10 MB dan oshmasligi kerak)."
        )
        return True

    wait_msg = await update.message.reply_text("⏳ Excel faylni o'qiyapman...")

    try:
        # Faylni yuklash
        file = await context.bot.get_file(doc.file_id)
        file_bytes = await file.download_as_bytearray()

        # Parse qilish
        from shared.services.excel_chat import excel_parse
        parsed = excel_parse(bytes(file_bytes), doc.file_name or "file.xlsx")

        if "error" in parsed:
            await wait_msg.edit_text(f"❌ Xato: {parsed['error']}")
            return True

        # Saqlash
        context.user_data[_KEY_EXCEL] = parsed
        context.user_data[_KEY_FNAME] = doc.file_name
        context.user_data[_KEY_VAQT] = time.time()
        context.user_data[_KEY_TARIX] = []
        context.user_data[_KEY_ACTIVE] = True

        # Analyzer ishga tushirish
        analysis_text = ""
        try:
            from shared.services.excel_analyzer import analyze_trade_excel
            analysis = analyze_trade_excel(bytes(file_bytes), doc.file_name or "file.xlsx")
            if "error" not in analysis:
                context.user_data[_KEY_ANALYSIS] = analysis
                j = analysis["jami"]
                analysis_text = (
                    f"\n📈 *Tezkor xulosa:*\n"
                    f"💰 Jami savdo: {j['savdo']:,.0f} so'm\n"
                    f"💵 Dollar: {j['dollar']:,.0f} $\n"
                    f"📤 Rasxod: {j['rasxod']:,.0f} so'm\n"
                    f"💼 Oylik: {j['oylik']:,.0f} so'm\n"
                )
        except Exception as _ae:
            log.debug("Analyzer: %s", _ae)

        await wait_msg.edit_text(
            f"✅ *Excel fayl o'qildi!*\n\n"
            f"📄 Fayl: `{doc.file_name}`\n"
            f"📊 Sheetlar: {parsed['sheets_count']} ta\n"
            f"📝 Kataklar: {parsed['total_cells']:,}\n"
            f"{analysis_text}\n"
            f"💬 Savol bering — PDF hisobot bilan javob beraman!\n"
            f"🛑 Tugatish: /excel\\_stop",
            parse_mode=ParseMode.MARKDOWN
        )
        return True

    except Exception as e:
        log.error("Excel qabul xato: %s", e, exc_info=True)
        await wait_msg.edit_text(f"❌ Faylni o'qishda xato: {e}")
        return True


async def excel_savol_javob(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Excel haqida savol-javob. True qaytarsa — javob berildi.
    matn.py dan chaqiriladi.
    Javob: matn + PDF fayl
    """
    if not excel_chat_active(context):
        return False

    savol = update.message.text
    if not savol or len(savol.strip()) < 2:
        return False

    # Buyruqlarni o'tkazib yuborish
    if savol.startswith("/"):
        return False

    parsed = context.user_data.get(_KEY_EXCEL)
    if not parsed:
        return False

    tarix = context.user_data.get(_KEY_TARIX, [])
    analysis = context.user_data.get(_KEY_ANALYSIS)

    wait_msg = await update.message.reply_text("🤔 Tahlil qilyapman...")

    try:
        from shared.services.excel_chat import excel_savol
        javob = await excel_savol(parsed, savol, tarix, analysis)

        # Tarixga qo'shish
        tarix.append({"role": "user", "content": savol})
        tarix.append({"role": "assistant", "content": javob})
        context.user_data[_KEY_TARIX] = tarix[-20:]

        # Matn javob yuborish (qisqa)
        qisqa = javob[:3500] if len(javob) > 3500 else javob
        try:
            await wait_msg.edit_text(qisqa, parse_mode=ParseMode.MARKDOWN)
        except Exception:
            await wait_msg.edit_text(qisqa.replace("*", "").replace("_", "").replace("`", ""))

        # PDF yaratish va yuborish
        try:
            pdf_bytes = _javob_to_pdf(
                savol=savol,
                javob=javob,
                filename=context.user_data.get(_KEY_FNAME, "Excel")
            )
            if pdf_bytes:
                import io as _io
                from telegram import InputFile
                pdf_name = f"Hisobot_{savol[:30].replace(' ', '_')}.pdf"
                await update.message.reply_document(
                    document=InputFile(_io.BytesIO(pdf_bytes), filename=pdf_name),
                    caption=f"📋 {savol}"
                )
        except Exception as pdf_err:
            log.warning("Excel chat PDF xato: %s", pdf_err)

        return True

    except Exception as e:
        log.error("Excel savol xato: %s", e, exc_info=True)
        try:
            await wait_msg.edit_text(f"❌ Xato: {e}")
        except Exception:
            pass
        return True


def _javob_to_pdf(savol: str, javob: str, filename: str = "Excel") -> bytes | None:
    """Ho'jayinga ko'rsatadigan darajada professional PDF"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm, mm
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, Frame, PageTemplate, BaseDocTemplate
        )
        import io as _io
        import re
        import datetime
    except ImportError:
        log.debug("reportlab yo'q — PDF yaratilmaydi")
        return None

    W, H = A4
    BLUE = colors.HexColor('#1a365d')
    ACCENT = colors.HexColor('#3182ce')
    BG_BLUE = colors.HexColor('#ebf4ff')
    BG_GRAY = colors.HexColor('#f7fafc')
    DARK = colors.HexColor('#1a202c')
    GRAY = colors.HexColor('#718096')
    BORDER = colors.HexColor('#e2e8f0')
    WHITE = colors.white

    buf = _io.BytesIO()
    sana = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

    def draw_page(canvas, doc):
        canvas.saveState()
        # Header bar
        canvas.setFillColor(BLUE)
        canvas.rect(0, H-2.8*cm, W, 2.8*cm, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, H-2.85*cm, W, 0.8*mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor('#ecc94b'))
        canvas.rect(0, H-2.92*cm, W, 0.5*mm, fill=1, stroke=0)
        # Logo
        canvas.setFillColor(WHITE)
        canvas.setFont('Helvetica-Bold', 18)
        canvas.drawString(2*cm, H-1.4*cm, "SavdoAI")
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#bee3f8'))
        canvas.drawString(2*cm, H-2*cm, "Professional Excel Analytics")
        # Date
        canvas.setFillColor(colors.HexColor('#e2e8f0'))
        canvas.setFont('Helvetica', 8)
        canvas.drawRightString(W-2*cm, H-1.3*cm, sana)
        canvas.setFont('Helvetica', 7)
        canvas.drawRightString(W-2*cm, H-1.8*cm, filename[:40])
        # Footer
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(2*cm, 1.8*cm, W-2*cm, 1.8*cm)
        canvas.setFillColor(GRAY)
        canvas.setFont('Helvetica', 7)
        canvas.drawString(2*cm, 1.2*cm, "SavdoAI — AI-powered savdo boshqaruv tizimi")
        canvas.drawCentredString(W/2, 1.2*cm, f"— {doc.page} —")
        canvas.drawRightString(W-2*cm, 1.2*cm, "savdoai.uz")
        # Confidential
        canvas.setFillColor(colors.HexColor('#fed7d7'))
        canvas.roundRect(W-5*cm, 0.5*cm, 3*cm, 0.5*cm, 2*mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor('#c53030'))
        canvas.setFont('Helvetica-Bold', 5)
        canvas.drawCentredString(W-3.5*cm, 0.62*cm, "MAXFIY / CONFIDENTIAL")
        canvas.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4,
        topMargin=3.5*cm, bottomMargin=2.5*cm,
        leftMargin=2*cm, rightMargin=2*cm)

    # Styles
    title_s = ParagraphStyle('T', fontName='Helvetica-Bold',
        fontSize=14, leading=18, textColor=BLUE, spaceAfter=4)
    sub_s = ParagraphStyle('Sub', fontName='Helvetica',
        fontSize=9, textColor=GRAY, spaceAfter=10)
    q_s = ParagraphStyle('Q', fontName='Helvetica-Bold',
        fontSize=11, leading=15, textColor=BLUE,
        backColor=BG_BLUE, borderWidth=1.5,
        borderColor=ACCENT, borderPadding=(12, 8, 12, 8),
        spaceAfter=16, spaceBefore=4)
    body_s = ParagraphStyle('B', fontName='Helvetica',
        fontSize=9.5, leading=13, textColor=DARK, spaceAfter=6)
    bold_s = ParagraphStyle('Bld', parent=body_s, fontName='Helvetica-Bold', fontSize=10)
    bullet_s = ParagraphStyle('Bul', parent=body_s, leftIndent=15, bulletIndent=5)
    section_s = ParagraphStyle('Sec', fontName='Helvetica-Bold',
        fontSize=11, leading=15, textColor=BLUE, spaceBefore=14, spaceAfter=6)

    story = []
    story.append(Paragraph("EXCEL TAHLIL HISOBOTI", title_s))
    story.append(Paragraph(filename, sub_s))
    story.append(Paragraph(f"Savol:  {_safe(savol)}", q_s))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT,
        spaceAfter=8, spaceBefore=4, dash=[4, 2]))

    # Parse javob
    lines = javob.split("\n")
    table_rows = []
    in_table = False

    for line in lines:
        stripped = line.strip()
        if "|" in stripped and stripped.startswith("|"):
            cells = [c.strip() for c in stripped.split("|") if c.strip()]
            if all(set(c) <= {'-', ':', ' '} for c in cells):
                continue
            table_rows.append(cells)
            in_table = True
            continue

        if in_table and table_rows:
            story.append(_pro_table(table_rows))
            story.append(Spacer(1, 10))
            table_rows = []
            in_table = False

        if not stripped:
            story.append(Spacer(1, 4))
            continue

        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', stripped)
        text = re.sub(r'__(.+?)__', r'<b>\1</b>', text)
        text = _safe_xml(text)

        if stripped.startswith("# ") or stripped.startswith("## "):
            clean = re.sub(r'^#+\s*', '', text)
            story.append(Paragraph(clean, section_s))
            story.append(HRFlowable(width="40%", thickness=0.5, color=BORDER, spaceAfter=6))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            story.append(Paragraph(f"<bullet>&bull;</bullet> {text[2:]}", bullet_s))
        elif "<b>" in text and len(text) < 100:
            story.append(Paragraph(text, bold_s))
        else:
            story.append(Paragraph(text, body_s))

    if table_rows:
        story.append(_pro_table(table_rows))

    # Footer stamp
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8, dash=[4,2]))
    stamp = Table([
        [Paragraph("<b>Tayyorladi:</b>", body_s), Paragraph("SavdoAI Analytics Engine", body_s)],
        [Paragraph("<b>Sana:</b>", body_s), Paragraph(sana, body_s)],
        [Paragraph("<b>Fayl:</b>", body_s), Paragraph(filename, body_s)],
    ], colWidths=[3*cm, 10*cm])
    stamp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_GRAY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(stamp)

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buf.getvalue()


def _pro_table(rows: list) -> Table:
    """Professional jadval"""
    import re
    from reportlab.lib import colors
    from reportlab.platypus import Table, TableStyle, Paragraph
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT

    if not rows:
        return Spacer(1, 1)

    BLUE = colors.HexColor('#1a365d')
    WHITE = colors.white
    BG_GRAY = colors.HexColor('#f7fafc')
    DARK = colors.HexColor('#1a202c')

    max_cols = max(len(r) for r in rows)
    h_s = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=WHITE, alignment=TA_CENTER)
    c_s = ParagraphStyle('TC', fontName='Helvetica', fontSize=8, leading=11, textColor=DARK)
    c_r = ParagraphStyle('TCR', parent=c_s, alignment=TA_RIGHT)
    c_b = ParagraphStyle('TCB', parent=c_s, fontName='Helvetica-Bold')
    c_br = ParagraphStyle('TCBR', parent=c_b, alignment=TA_RIGHT)

    bold_kw = {'jami', 'итого', 'total', 'жами', 'hammasi'}
    wrapped = []
    bold_rows = set()

    for ri, row in enumerate(rows):
        is_bold = any(kw in ' '.join(row).lower() for kw in bold_kw)
        if is_bold and ri > 0:
            bold_rows.add(ri)
        nr = []
        for ci in range(max_cols):
            cell = row[ci] if ci < len(row) else ""
            cell = _safe_xml(cell)
            if ri == 0:
                nr.append(Paragraph(cell, h_s))
            elif is_bold:
                nr.append(Paragraph(cell, c_br if ci > 0 else c_b))
            else:
                # Raqamli ustun?
                is_num = bool(re.match(r'^[\d\s,.$%—-]+$', cell.replace(',','').replace(' ',''))) if cell.strip() else False
                nr.append(Paragraph(cell, c_r if is_num else c_s))
        wrapped.append(nr)

    avail = 17 * 28.35
    cw = [avail / max_cols] * max_cols
    t = Table(wrapped, colWidths=cw, repeatRows=1)

    cmds = [
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#cbd5e1')),
        ('BOX', (0,0), (-1,-1), 1, BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, BG_GRAY]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]
    for br in bold_rows:
        cmds.append(('BACKGROUND', (0,br), (-1,br), colors.HexColor('#ebf8ff')))
        cmds.append(('LINEABOVE', (0,br), (-1,br), 1.5, BLUE))
    t.setStyle(TableStyle(cmds))
    return t


async def excel_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Excel inline button callback"""
    q = update.callback_query
    await q.answer()
    data = q.data

    if data == "excel_clear":
        _clear(context)
        await q.edit_message_text("✅ Excel chat tozalandi.")

    elif data == "excel_info":
        parsed = context.user_data.get(_KEY_EXCEL)
        if not parsed:
            await q.edit_message_text("❌ Excel fayl yuklanmagan.")
            return
        info_lines = [f"📄 *{parsed['filename']}*\n"]
        for s in parsed["sheets"]:
            info_lines.append(f"  📋 `{s['name']}` — {s['rows']} qator")
        info_lines.append(f"\n📊 Jami: {parsed['sheets_count']} sheet, {parsed['total_cells']:,} katak")
        await q.edit_message_text("\n".join(info_lines), parse_mode=ParseMode.MARKDOWN)


def _safe(text: str) -> str:
    """XML uchun xavfsiz"""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def _safe_xml(text: str) -> str:
    """XML teglarni saqlagan holda xavfsiz"""
    import re
    return re.sub(r'&(?!amp;|lt;|gt;|quot;)', '&amp;', text)


def register_excel_chat_handlers(app):
    """Bot ga excel chat handlerlarini qo'shish"""
    from telegram.ext import CommandHandler, CallbackQueryHandler

    app.add_handler(CommandHandler("excel", cmd_excel))
    app.add_handler(CommandHandler("excel_stop", cmd_excel_stop))
    app.add_handler(CallbackQueryHandler(excel_callback, pattern=r"^excel_"))
