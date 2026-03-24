"""PDF eksport — reportlab"""
from __future__ import annotations
import io
from datetime import datetime
from decimal import Decimal
from typing import Any
import pytz
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

TZ = pytz.timezone("Asia/Tashkent")
KOK    = colors.HexColor("#1a56db")
YASHIL = colors.HexColor("#059669")
SARIQ  = colors.HexColor("#d97706")
QIZIL  = colors.HexColor("#dc2626")
BINAF  = colors.HexColor("#7c3aed")
KULRANG = colors.HexColor("#6b7280")
OCHKUK = colors.HexColor("#f7f9fc")


def _hozir() -> str:
    return datetime.now(TZ).strftime("%d.%m.%Y %H:%M")


def _pul(v: Any) -> str:
    try:
        return f"{float(v):,.0f} so'm"
    except Exception:
        return "0 so'm"


def _uslublar():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("Sarlavha2",   parent=s["Title"],   fontSize=13, spaceAfter=5))
    s.add(ParagraphStyle("Oddiy",       parent=s["Normal"],  fontSize=10, spaceAfter=4))
    s.add(ParagraphStyle("Qalin",       parent=s["Normal"],  fontSize=10, fontName="Helvetica-Bold"))
    s.add(ParagraphStyle("Markaz",      parent=s["Normal"],  fontSize=9,  alignment=TA_CENTER))
    s.add(ParagraphStyle("Ostki",       parent=s["Normal"],  fontSize=8,  textColor=colors.black))
    return s


def _jadval_uslubi(sarlavha_rang=KOK) -> TableStyle:
    return TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), sarlavha_rang),
        ("TEXTCOLOR",     (0, 0), (-1,  0), colors.white),
        ("FONTNAME",      (0, 0), (-1,  0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1,  0), 9),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",     (0, 1), (-1, -1), colors.black),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white]),
        ("GRID",          (0, 0), (-1, -1), 0.75, colors.HexColor("#9ca3af")),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
    ])


def _doc(buf) -> SimpleDocTemplate:
    return SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=2*cm, bottomMargin=2*cm,
        leftMargin=2*cm, rightMargin=2*cm,
    )


# ─── SOTUV CHEKI ─────────────────────────────────────────

def sotuv_pdf(data: dict, dokon_nomi: str) -> bytes:
    buf = io.BytesIO()
    doc = _doc(buf)
    s   = _uslublar()
    els = []

    els.append(Paragraph("MASHRAB MOLIYA", s["Title"]))
    els.append(Paragraph(dokon_nomi, s["Markaz"]))
    els.append(HRFlowable(width="100%", thickness=1, color=KOK))
    els.append(Spacer(1, 0.3*cm))

    if data.get("klient"):
        els.append(Paragraph(f"<b>Klient:</b> {data['klient']}", s["Oddiy"]))
    els.append(Paragraph(f"<b>Sana:</b> {_hozir()}", s["Oddiy"]))
    els.append(Spacer(1, 0.3*cm))

    # Tovarlar jadvali
    qator = [["#", "Tovar nomi", "Miqdor", "Birlik", "Narx (so'm)", "Jami (so'm)"]]
    for i, t in enumerate(data.get("tovarlar", []), 1):
        miq  = float(t.get("miqdor", 0))
        bir  = t.get("birlik", "dona")
        narx = float(t.get("narx",   0))
        jami = float(t.get("jami",   0))
        miq_s = f"{miq:.1f}".rstrip("0").rstrip(".")
        if bir == "gramm":
            miqdor_str = f"{miq_s}g"
            narx_str   = f"{narx:,.0f}/kg" if narx else "—"
        else:
            miqdor_str = miq_s
            narx_str   = f"{narx:,.0f}" if narx else "—"
        qator.append([
            str(i), t.get("nomi", ""),
            miqdor_str, bir, narx_str,
            f"{jami:,.0f}",
        ])

    tbl = Table(qator,
                colWidths=[0.8*cm, 7*cm, 2*cm, 1.8*cm, 2.5*cm, 3.2*cm])
    tbl.setStyle(_jadval_uslubi())
    els.append(tbl)
    els.append(Spacer(1, 0.3*cm))

    j  = float(data.get("jami_summa", 0))
    q  = float(data.get("qarz", 0))
    tl = float(data.get("tolandan") or data.get("tolangan") or j)

    yig_im = [[Paragraph("<b>JAMI:</b>", s["Qalin"]),
               Paragraph(f"<b>{j:,.0f} so'm</b>", s["Qalin"])]]
    if q > 0:
        yig_im.append([Paragraph("To'landi:", s["Oddiy"]),
                        Paragraph(f"{tl:,.0f} so'm", s["Oddiy"])])
        yig_im.append([Paragraph("<b>QARZ:</b>", s["Qalin"]),
                        Paragraph(f"<b>{q:,.0f} so'm</b>", s["Qalin"])])

    yig_im_tbl = Table(yig_im, colWidths=[10*cm, 7.7*cm])
    yig_im_tbl.setStyle(TableStyle([
        ("ALIGN",         (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1,-1), 3),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 3),
    ]))
    els.append(yig_im_tbl)
    els.append(Spacer(1, 0.5*cm))
    els.append(Paragraph(
        f"Yaratildi: {_hozir()}  |  @savdoai_mashrab_bot  |  Mashrab Moliya",
        s["Ostki"]
    ))

    doc.build(els)
    return buf.getvalue()



# === UNIVERSAL MINI PRINTER CHEK (Professional) ===

_nakladnoy_counter = 0

def _nakladnoy_raqam() -> str:
    global _nakladnoy_counter
    _nakladnoy_counter += 1
    s = datetime.now(TZ)
    return f"N-{s.strftime('%y%m%d')}-{_nakladnoy_counter:04d}"


def chek_pdf(data: dict, dokon_nomi: str, width_mm: int = 80) -> bytes:
    """
    Kichik thermal kenglikdagi PDF — arxiv / umumiy printerlar uchun.
    Asosiy mini-printer yo'li: shared.services.thermal_receipt (matn, yuqori kontrast).
    """
    from reportlab.lib.units import mm as MM
    from reportlab.pdfgen import canvas as cv

    pw = width_mm * MM
    mg = 3 * MM
    rx = pw - mg
    cx = pw / 2
    iw = pw - 2 * mg

    tovarlar = data.get("tovarlar", [])
    nt = max(len(tovarlar), 1)
    klient = data.get("klient", "")
    amal = data.get("amal", "chiqim")
    jami_s = float(data.get("jami_summa", 0))
    qarz = float(data.get("qarz", 0))
    tol = float(data.get("tolangan", 0) or jami_s)
    sana = _hozir()
    nak = _nakladnoy_raqam()

    # Qator balandligi: nom + detay + oraliq (restaurant PDF — o‘qilish uchun zaxira)
    ph = (
        18 * MM + 14 * MM + (10 * MM if klient else 0) + 8 * MM
        + nt * 14 * MM + 24 * MM + (18 * MM if qarz > 0 else 0) + 10 * MM
    )

    buf = io.BytesIO()
    c = cv.Canvas(buf, pagesize=(pw, ph))
    y = ph - mg - 1

    BLACK = colors.black
    RED = colors.HexColor("#b91c1c")

    c.setFillColor(BLACK)
    c.rect(0, y - 4, pw, 20, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12 if len(dokon_nomi or "") <= 22 else 10)
    c.drawCentredString(cx, y, (dokon_nomi or "SAVDOAI").upper())
    c.setFillColor(BLACK)
    y -= 22

    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(cx, y, "MASHRAB MOLIYA")
    y -= 12

    c.setFont("Helvetica-Bold", 8)
    c.drawString(mg, y, f"Chek: {nak}")
    c.drawRightString(rx, y, sana)
    y -= 10

    amal_map = {"kirim": "KIRIM", "chiqim": "SOTUV", "qaytarish": "QAYTARISH",
                "qarz_tolash": "QARZ TOLASH", "nakladnoy": "NAKLADNOY"}
    amal_nom = amal_map.get(amal, "SOTUV")
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(cx, y, amal_nom)
    y -= 11

    c.setStrokeColor(BLACK)
    c.setLineWidth(1.25)
    c.line(mg, y, rx, y)
    y -= 8

    if klient:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(mg, y, str(klient)[:30])
        y -= 14

    c.setStrokeColor(BLACK)
    c.setLineWidth(1.1)
    c.line(mg, y, rx, y)
    y -= 6

    c.setFont("Helvetica-Bold", 10)
    c.drawString(mg + 1, y, "TOVAR NOMI")
    c.drawRightString(rx - 1, y, "JAMI")
    y -= 13

    for i, t in enumerate(tovarlar, 1):
        nomi = t.get("nomi", "?")
        miq = float(t.get("miqdor", 0))
        narx = float(t.get("narx", 0))
        jami = float(t.get("jami", 0))
        birlik = t.get("birlik", "dona")
        miq_s = f"{miq:.1f}".rstrip("0").rstrip(".")

        disp = f"{i}. {nomi}"
        mx = 32 if width_mm >= 80 else 22
        if len(disp) > mx:
            disp = disp[: mx - 2] + ".."

        s_str = f"{jami:,.0f}"
        c.setFont("Helvetica-Bold", 11)
        sw = c.stringWidth(s_str, "Helvetica-Bold", 11)
        max_name_w = iw - sw - 4
        c.setFont("Helvetica-Bold", 10)
        nw = c.stringWidth(disp, "Helvetica-Bold", 10)
        if nw > max_name_w:
            c.setFont("Helvetica-Bold", 9)
        c.setFillColor(BLACK)
        c.drawString(mg, y, disp)

        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(rx, y, s_str)
        y -= 13

        if birlik == "gramm":
            det = f"    {miq_s} g x {narx:,.0f}/kg"
        else:
            det = f"    {miq_s} {birlik} x {narx:,.0f}"
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(BLACK)
        c.drawString(mg, y, det)
        y -= 12

        if i < len(tovarlar):
            c.setStrokeColor(BLACK)
            c.setLineWidth(1.0)
            c.line(mg, y + 2, rx, y + 2)
            y -= 6

    y -= 5
    c.setStrokeColor(BLACK)
    c.setLineWidth(1.6)
    c.line(mg, y, rx, y)
    y -= 8

    bh = 22
    c.setFillColor(BLACK)
    c.roundRect(mg, y - 5, iw, bh, 3, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(mg + 4, y, "JAMI")
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(rx - 4, y, f"{jami_s:,.0f}")
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(rx - 4, y - 13, "so'm")
    c.setFillColor(BLACK)
    y -= bh + 8

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLACK)
    c.drawCentredString(cx, y, f"{len(tovarlar)} ta pozitsiya")
    y -= 11

    if qarz > 0:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(mg, y, "To'langan:")
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(rx, y, f"{tol:,.0f}")
        y -= 14

        bq = 18
        c.setFillColor(RED)
        c.roundRect(mg, y - 4, iw, bq, 3, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(mg + 4, y, "QARZ")
        c.setFont("Helvetica-Bold", 14)
        c.drawRightString(rx - 4, y, f"{qarz:,.0f}")
        c.setFont("Helvetica-Bold", 9)
        c.drawRightString(rx - 4, y - 12, "so'm")
        c.setFillColor(BLACK)
        y -= bq + 8

    y -= 3
    c.setStrokeColor(BLACK)
    c.setLineWidth(1.2)
    c.line(mg, y, rx, y)
    y -= 10

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLACK)
    c.drawCentredString(cx, y, "Xaridingiz uchun rahmat!")
    y -= 11
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(cx, y, "@savdoai_mashrab_bot")

    c.save()
    return buf.getvalue()


def klient_hisobi_pdf(data: dict, dokon_nomi: str) -> bytes:
    if not data:
        return b""
    buf = io.BytesIO()
    doc = _doc(buf)
    s   = _uslublar()
    els = []
    k   = data["klient"]

    els.append(Paragraph("MASHRAB MOLIYA", s["Title"]))
    els.append(Paragraph(f"Klient hisobi: {k['ism']}", s["Sarlavha2"]))
    els.append(HRFlowable(width="100%", thickness=1, color=KOK))
    els.append(Spacer(1, 0.2*cm))

    # Statistika
    stat_qatorlar = [
        ["Jami sotuv:",         _pul(data["jami_sotuv"])],
        ["To'langan:",          _pul(data["jami_tolangan"])],
        ["Qaytarilgan:",        _pul(data["jami_qaytarilgan"])],
        ["Qolgan qarz:",        _pul(data["faol_qarz"])],
        ["Sotuvlar soni:",      str(data["sotuv_soni"])],
    ]
    stat_tbl = Table(stat_qatorlar, colWidths=[6*cm, 5*cm])
    stat_tbl.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1,-1), 10),
        ("TOPPADDING",  (0, 0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("TEXTCOLOR",   (1, 2), (1,  2),
         QIZIL if float(data["faol_qarz"]) > 0 else YASHIL),
    ]))
    els.append(stat_tbl)
    els.append(Spacer(1, 0.4*cm))

    # Sotuvlar
    if data.get("sotuvlar"):
        els.append(Paragraph("<b>Sotuvlar tarixi:</b>", s["Qalin"]))
        qator = [["Sana", "Tovarlar", "Jami", "To'landi", "Qarz"]]
        for row in data["sotuvlar"]:
            sana = str(row["sana"])[:16] if row.get("sana") else "—"
            tv   = (row.get("tovarlar_str") or "")[:70]
            qarz_f = float(row["qarz"]) if float(row["qarz"]) > 0 else "—"
            qator.append([
                sana, tv,
                f"{float(row['jami']):,.0f}",
                f"{float(row['tolangan']):,.0f}",
                f"{qarz_f:,.0f}" if isinstance(qarz_f, float) else qarz_f,
            ])
        tbl = Table(qator, colWidths=[3*cm, 6.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
        tbl.setStyle(_jadval_uslubi(YASHIL))
        els.append(tbl)
        els.append(Spacer(1, 0.4*cm))

    # Qaytarishlar
    if data.get("qaytarishlar"):
        els.append(Paragraph("<b>Qaytarishlar:</b>", s["Qalin"]))
        qator = [["Sana", "Tovar", "Miqdor", "Summa", "Sabab"]]
        for q in data["qaytarishlar"]:
            qator.append([
                str(q["sana"])[:10],
                q.get("tovar_nomi", ""),
                f"{float(q['miqdor'] or 0):.1f} {q.get('birlik','')}",
                _pul(q["jami"]),
                q.get("sabab") or "—",
            ])
        tbl = Table(qator, colWidths=[2.5*cm, 5*cm, 3*cm, 3*cm, 4*cm])
        tbl.setStyle(_jadval_uslubi(SARIQ))
        els.append(tbl)
        els.append(Spacer(1, 0.4*cm))

    # Qarzlar
    if data.get("qarzlar"):
        els.append(Paragraph("<b>Qarz tarixi:</b>", s["Qalin"]))
        qator = [["Sana", "Dastlabki", "To'landi", "Qolgan", "Holat"]]
        for q in data["qarzlar"]:
            holat = "✅ Yopildi" if q["yopildi"] else "⚠️ Ochiq"
            qator.append([
                str(q["yaratilgan"])[:10],
                _pul(q["dastlabki_summa"]),
                _pul(q["tolangan"]),
                _pul(q["qolgan"]),
                holat,
            ])
        tbl = Table(qator, colWidths=[3*cm, 3.5*cm, 3.5*cm, 3.5*cm, 3*cm])
        tbl.setStyle(_jadval_uslubi(QIZIL))
        els.append(tbl)

    els.append(Spacer(1, 0.5*cm))
    els.append(Paragraph(
        f"Hisobot yaratildi: {_hozir()}  |  @savdoai_mashrab_bot",
        s["Ostki"]
    ))
    doc.build(els)
    return buf.getvalue()


# ─── KUNLIK HISOBOT ──────────────────────────────────────

def kunlik_pdf(d: dict, dokon_nomi: str) -> bytes:
    buf = io.BytesIO()
    doc = _doc(buf)
    s   = _uslublar()
    els = []

    els.append(Paragraph("MASHRAB MOLIYA", s["Title"]))
    els.append(Paragraph(f"Kunlik hisobot: {d['kun']}", s["Sarlavha2"]))
    els.append(HRFlowable(width="100%", thickness=1, color=KOK))
    els.append(Spacer(1, 0.3*cm))

    qator = [
        ["Ko'rsatkich",  "Qiymat"],
        ["Kirim soni",    str(d["kr_n"])],
        ["Kirim summasi", _pul(d["kr_jami"])],
        ["Sotuv soni",    str(d["ch_n"])],
        ["Sotuv summasi", _pul(d["ch_jami"])],
        ["To'landi",      _pul(d["tolangan"])],
        ["Yangi qarz",    _pul(d["yangi_qarz"])],
        ["SOF FOYDA",     _pul(d["foyda"])],
        ["Jami qarz",     _pul(d["jami_qarz"])],
    ]
    tbl = Table(qator, colWidths=[8*cm, 9.7*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1,  0), KOK),
        ("TEXTCOLOR",     (0, 0), (-1,  0), colors.white),
        ("FONTNAME",      (0, 0), (-1,  0), "Helvetica-Bold"),
        ("FONTNAME",      (0,-2), (-1, -2), "Helvetica-Bold"),
        ("BACKGROUND",    (0,-2), (-1, -2), colors.HexColor("#d1fae5")),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS",(0, 1), (-1, -2), [colors.white, OCHKUK]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    els.append(tbl)

    if d.get("by_kat"):
        els.append(Spacer(1, 0.4*cm))
        els.append(Paragraph("<b>Kategoriyalar bo'yicha:</b>", s["Qalin"]))
        qator2 = [["Kategoriya", "Jami", "Soni"]]
        for item in d["by_kat"]:
            qator2.append([item["kategoriya"], _pul(item["j"]), str(item["n"])])
        tbl2 = Table(qator2, colWidths=[10*cm, 4*cm, 3.7*cm])
        tbl2.setStyle(_jadval_uslubi(BINAF))
        els.append(tbl2)

    els.append(Spacer(1, 0.5*cm))
    els.append(Paragraph(
        f"Yaratildi: {_hozir()}  |  @savdoai_mashrab_bot",
        s["Ostki"]
    ))
    doc.build(els)
    return buf.getvalue()
