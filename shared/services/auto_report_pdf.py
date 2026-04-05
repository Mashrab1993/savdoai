"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — AVTOMATIK HISOBOT PDF GENERATOR                  ║
║  Kunlik va haftalik professional PDF hisobotlar              ║
║                                                              ║
║  Har kuni ertalab + har dushanba:                            ║
║  📊 Savdo, foyda, qarz, kam qoldiq — hammasi bir PDF da     ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import io
import logging
import datetime
from typing import Optional

log = logging.getLogger("savdoai.auto_report")

# ═══ SHRIFT ═══
_FONT = "Helvetica"
_FONT_B = "Helvetica-Bold"
_FONT_READY = False

def _init_fonts():
    global _FONT, _FONT_B, _FONT_READY
    if _FONT_READY:
        return
    _FONT_READY = True
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os
        for fp, fn in [
            ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVuSans"),
            ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "DejaVuSans-Bold"),
        ]:
            if os.path.exists(fp):
                try:
                    pdfmetrics.registerFont(TTFont(fn, fp))
                except Exception:
                    pass
        try:
            pdfmetrics.getFont("DejaVuSans")
            _FONT = "DejaVuSans"
            _FONT_B = "DejaVuSans-Bold"
        except Exception:
            pass
    except Exception:
        pass


def kunlik_pdf(data: dict, qarzlar: list, kam_qoldiq: list,
               ism: str = "", tugilgan: list | None = None) -> bytes | None:
    """Kunlik hisobot PDF.
    data = db.kunlik_hisobot() natijasi
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm, mm
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
    except ImportError:
        return None

    _init_fonts()
    W, H = A4
    BLUE = colors.HexColor('#1a365d')
    ACCENT = colors.HexColor('#3182ce')
    GREEN = colors.HexColor('#276749')
    RED = colors.HexColor('#c53030')
    DARK = colors.HexColor('#1a202c')
    GRAY = colors.HexColor('#718096')
    BORDER = colors.HexColor('#e2e8f0')
    BG = colors.HexColor('#f7fafc')
    WHITE = colors.white

    buf = io.BytesIO()
    sana = datetime.datetime.now().strftime("%d.%m.%Y")
    sana_full = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(BLUE)
        canvas.rect(0, H - 2.8*cm, W, 2.8*cm, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, H - 2.85*cm, W, 0.8*mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor('#ecc94b'))
        canvas.rect(0, H - 2.92*cm, W, 0.5*mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont(_FONT_B, 18)
        canvas.drawString(2*cm, H - 1.4*cm, "SavdoAI")
        canvas.setFont(_FONT, 9)
        canvas.setFillColor(colors.HexColor('#bee3f8'))
        canvas.drawString(2*cm, H - 2*cm, f"Kunlik hisobot — {sana}")
        canvas.setFillColor(colors.HexColor('#e2e8f0'))
        canvas.setFont(_FONT, 8)
        canvas.drawRightString(W - 2*cm, H - 1.3*cm, sana_full)
        if ism:
            canvas.setFont(_FONT, 7)
            canvas.drawRightString(W - 2*cm, H - 1.8*cm, ism)
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(2*cm, 1.8*cm, W - 2*cm, 1.8*cm)
        canvas.setFillColor(GRAY)
        canvas.setFont(_FONT, 7)
        canvas.drawString(2*cm, 1.2*cm, "SavdoAI — avtomatik kunlik hisobot")
        canvas.drawCentredString(W/2, 1.2*cm, f"— {doc.page} —")
        canvas.setFillColor(colors.HexColor('#fed7d7'))
        canvas.roundRect(W - 5*cm, 0.5*cm, 3*cm, 0.5*cm, 2*mm, fill=1, stroke=0)
        canvas.setFillColor(RED)
        canvas.setFont(_FONT_B, 5)
        canvas.drawCentredString(W - 3.5*cm, 0.62*cm, "MAXFIY / CONFIDENTIAL")
        canvas.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4,
        topMargin=3.5*cm, bottomMargin=2.5*cm, leftMargin=2*cm, rightMargin=2*cm)

    ts = ParagraphStyle('T', fontName=_FONT_B, fontSize=14, leading=18, textColor=BLUE, spaceAfter=6)
    hs = ParagraphStyle('H', fontName=_FONT_B, fontSize=11, leading=15, textColor=BLUE, spaceBefore=14, spaceAfter=6)
    bs = ParagraphStyle('B', fontName=_FONT, fontSize=10, leading=13, textColor=DARK, spaceAfter=4)
    bbs = ParagraphStyle('BB', fontName=_FONT_B, fontSize=10, leading=13, textColor=DARK, spaceAfter=4)
    gs = ParagraphStyle('G', fontName=_FONT, fontSize=9, textColor=GREEN)
    rs = ParagraphStyle('R', fontName=_FONT, fontSize=9, textColor=RED)

    story = []

    # TITLE
    story.append(Paragraph(f"KUNLIK HISOBOT — {sana}", ts))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=10, dash=[4, 2]))

    # ASOSIY KO'RSATKICHLAR
    story.append(Paragraph("Asosiy ko'rsatkichlar", hs))

    ch_n = data.get("ch_n", data.get("sotuv_soni", 0))
    ch_jami = data.get("ch_jami", data.get("jami_sotuv", 0))
    kr_n = data.get("kr_n", data.get("kirim_soni", 0))
    kr_jami = data.get("kr_jami", data.get("jami_kirim", 0))
    foyda = data.get("foyda", 0)
    yangi_qarz = data.get("yangi_qarz", 0)
    jami_qarz = data.get("jami_qarz", 0)

    main_data = [
        [_p("Ko'rsatkich", _FONT_B, WHITE), _p("Qiymat", _FONT_B, WHITE)],
        [_p("Sotuv soni", _FONT), _p(f"{ch_n} ta", _FONT)],
        [_p("Sotuv summasi", _FONT), _p(f"{ch_jami:,.0f} so'm", _FONT)],
        [_p("Kirim soni", _FONT), _p(f"{kr_n} ta", _FONT)],
        [_p("Kirim summasi", _FONT), _p(f"{kr_jami:,.0f} so'm", _FONT)],
        [_p("Foyda", _FONT_B, GREEN), _p(f"{foyda:,.0f} so'm", _FONT_B, GREEN)],
    ]
    if yangi_qarz > 0:
        main_data.append([_p("Yangi qarz", _FONT, RED), _p(f"{yangi_qarz:,.0f} so'm", _FONT, RED)])
    main_data.append([_p("Jami ochiq qarz", _FONT_B), _p(f"{jami_qarz:,.0f} so'm", _FONT_B)])

    t = Table(main_data, colWidths=[9*cm, 8*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('BOX', (0, 0), (-1, -1), 1, BLUE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)

    # MUDDATI O'TGAN QARZLAR
    if qarzlar:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Muddati o'tgan qarzlar ({len(qarzlar)} ta)", hs))
        qarz_data = [[_p("Klient", _FONT_B, WHITE), _p("Qarz summasi", _FONT_B, WHITE)]]
        jami_q = 0
        for q in qarzlar[:10]:
            s = q.get("qoldiq", q.get("jami_qarz", 0))
            jami_q += s
            qarz_data.append([
                _p(q.get("klient_ismi", q.get("ism", "?")), _FONT),
                _p(f"{s:,.0f} so'm", _FONT, RED)
            ])
        qarz_data.append([_p("JAMI", _FONT_B), _p(f"{jami_q:,.0f} so'm", _FONT_B, RED)])

        qt = Table(qarz_data, colWidths=[9*cm, 8*cm])
        qt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), RED),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff5f5')),
            ('LINEABOVE', (0, -1), (-1, -1), 1.5, RED),
            ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
            ('BOX', (0, 0), (-1, -1), 1, RED),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [WHITE, BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(qt)

    # KAM QOLDIQ
    if kam_qoldiq:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Kam qoldiq tovarlar ({len(kam_qoldiq)} ta)", hs))
        kq_data = [[_p("Tovar", _FONT_B, WHITE), _p("Qoldiq", _FONT_B, WHITE), _p("Minimum", _FONT_B, WHITE)]]
        for t_item in kam_qoldiq[:10]:
            kq_data.append([
                _p(t_item["nomi"], _FONT),
                _p(f"{t_item['qoldiq']} {t_item.get('birlik', '')}", _FONT, RED),
                _p(f"{t_item['min_qoldiq']} {t_item.get('birlik', '')}", _FONT),
            ])
        kqt = Table(kq_data, colWidths=[8*cm, 4.5*cm, 4.5*cm])
        kqt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c05621')),
            ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#c05621')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(kqt)

    # TUG'ILGAN KUNLAR
    if tugilgan:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"Bugun tug'ilgan kun ({len(tugilgan)} ta klient)", hs))
        for t_item in tugilgan[:5]:
            story.append(Paragraph(
                f"🎂 {t_item['ism']} — {t_item.get('telefon', '')}",
                bs
            ))

    # FOOTER
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8, dash=[4, 2]))
    stamp = Table([
        [_p("Tayyorladi:", _FONT_B), _p("SavdoAI — Avtomatik kunlik hisobot", _FONT)],
        [_p("Sana:", _FONT_B), _p(sana_full, _FONT)],
    ], colWidths=[3*cm, 10*cm])
    stamp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(stamp)

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    return buf.getvalue()


def _p(text, font=None, color=None):
    """Quick Paragraph helper"""
    from reportlab.platypus import Paragraph
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors as c
    if font is None:
        font = _FONT
    if color is None:
        color = c.HexColor('#1a202c')
    s = ParagraphStyle('_', fontName=font, fontSize=9, leading=12, textColor=color)
    # XML safe
    import re
    text = re.sub(r'&(?!amp;|lt;|gt;)', '&amp;', str(text))
    return Paragraph(text, s)
