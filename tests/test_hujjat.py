"""TITAN TEST — HUJJAT O'QISH (PDF + Word + Excel)"""
import sys, os, ast

# ═══ HELPER: bot kodi modullashtirish uchun ═══
def _read_bot_all():
    """main.py + handlers/ — barcha bot kodi."""
    import glob
    parts = []
    for pat in ['services/bot/main.py', 'services/bot/bot_helpers.py',
                'services/bot/handlers/*.py']:
        for fp in sorted(glob.glob(pat)):
            parts.append(open(fp).read())
    return '\n'.join(parts)


sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestHujjatModul:
    def test_syntax(self):
        ast.parse(open("shared/services/hujjat_oqish.py").read())

    def test_imports(self):
        from shared.services.hujjat_oqish import (
            pdf_oqi, docx_oqi, xlsx_oqi, hujjat_oqi,
            hujjat_xulosa_matn, sahifa_matn,
            hujjatdan_izlash, hujjat_sorov_bormi,
        )

    def test_pdfplumber_installed(self):
        import pdfplumber

    def test_docx_installed(self):
        import docx

    def test_openpyxl_installed(self):
        import openpyxl


class TestSorovAniqlash:
    def test_bet(self):
        from shared.services.hujjat_oqish import hujjat_sorov_bormi
        assert hujjat_sorov_bormi("5-bet") is True
        assert hujjat_sorov_bormi("3 sahifa") is True
        assert hujjat_sorov_bormi("10-bet") is True

    def test_raqam(self):
        from shared.services.hujjat_oqish import hujjat_sorov_bormi
        assert hujjat_sorov_bormi("5") is True
        assert hujjat_sorov_bormi("123") is True

    def test_qidiruv(self):
        from shared.services.hujjat_oqish import hujjat_sorov_bormi
        assert hujjat_sorov_bormi("Pifagor qayerda") is True
        assert hujjat_sorov_bormi("nima yozilgan") is True
        assert hujjat_sorov_bormi("topib ber") is True

    def test_oddiy_sotuv(self):
        from shared.services.hujjat_oqish import hujjat_sorov_bormi
        assert hujjat_sorov_bormi("Salimovga 5 Ariel") is False


class TestSahifaMatn:
    def test_mavjud_sahifa(self):
        from shared.services.hujjat_oqish import sahifa_matn
        h = {"sahifalar": {1: "Test matn", 2: "Ikkinchi"}, "sahifalar_soni": 2}
        r = sahifa_matn(h, 1)
        assert "Test matn" in r
        assert "1-SAHIFA" in r

    def test_yoq_sahifa(self):
        from shared.services.hujjat_oqish import sahifa_matn
        h = {"sahifalar": {1: "A"}, "sahifalar_soni": 1}
        r = sahifa_matn(h, 99)
        assert "topilmadi" in r.lower()

    def test_bosh_sahifa(self):
        from shared.services.hujjat_oqish import sahifa_matn
        h = {"sahifalar": {1: ""}, "sahifalar_soni": 1}
        r = sahifa_matn(h, 1)
        assert "bo'sh" in r.lower() or "1" in r


class TestIzlash:
    def test_sahifa_sorov(self):
        from shared.services.hujjat_oqish import hujjatdan_izlash
        h = {"sahifalar": {1: "Kirish", 2: "Asosiy qism"}, "sahifalar_soni": 2, "umumiy_matn": ""}
        r = hujjatdan_izlash(h, "2-bet")
        assert "Asosiy" in r

    def test_kalit_soz(self):
        from shared.services.hujjat_oqish import hujjatdan_izlash
        h = {"sahifalar": {1: "Pifagor teoremasi a2+b2=c2", 2: "Boshqa"}, "sahifalar_soni": 2, "umumiy_matn": "Pifagor", "jadvallar": []}
        r = hujjatdan_izlash(h, "Pifagor qayerda")
        assert "Pifagor" in r or "1-bet" in r

    def test_topilmadi(self):
        from shared.services.hujjat_oqish import hujjatdan_izlash
        h = {"sahifalar": {1: "ABC"}, "sahifalar_soni": 1, "umumiy_matn": "ABC", "jadvallar": []}
        r = hujjatdan_izlash(h, "XYZ nomalum")
        assert "topilmadi" in r.lower()

    def test_faqat_raqam(self):
        from shared.services.hujjat_oqish import hujjatdan_izlash
        h = {"sahifalar": {1: "A", 2: "B", 3: "C"}, "sahifalar_soni": 3}
        r = hujjatdan_izlash(h, "2")
        assert "B" in r


class TestXulosa:
    def test_pdf_xulosa(self):
        from shared.services.hujjat_oqish import hujjat_xulosa_matn
        h = {"tur": "pdf", "sahifalar_soni": 100, "sahifalar": {1: "Kirish"}, "jadvallar": [], "umumiy_matn": "x" * 5000}
        t = hujjat_xulosa_matn(h, "matematika.pdf")
        assert "PDF" in t
        assert "100" in t
        assert "matematika.pdf" in t

    def test_docx_xulosa(self):
        from shared.services.hujjat_oqish import hujjat_xulosa_matn
        h = {"tur": "docx", "paragraflar_soni": 50, "sahifalar_soni": 2, "sarlavhalar": [{"daraja": 1, "matn": "Kirish", "pozitsiya": 1}], "mundarija": [{"sahifa": 1, "sarlavha": "Kirish"}], "jadvallar": [], "umumiy_matn": "test"}
        t = hujjat_xulosa_matn(h, "referat.docx")
        assert "Word" in t
        assert "Kirish" in t

    def test_xlsx_xulosa(self):
        from shared.services.hujjat_oqish import hujjat_xulosa_matn
        h = {"tur": "xlsx", "sheetlar": [{"nom": "Sotuvlar", "qator_soni": 200, "ustun_soni": 8, "sarlavha": ["Sana", "Tovar", "Jami"], "statistika": {"jami": 50000000, "ortacha": 250000}}]}
        t = hujjat_xulosa_matn(h, "hisobot.xlsx")
        assert "Excel" in t
        assert "Sotuvlar" in t
        assert "200" in t

    def test_xato_xulosa(self):
        from shared.services.hujjat_oqish import hujjat_xulosa_matn
        h = {"tur": "pdf", "xato": "Fayl buzilgan"}
        t = hujjat_xulosa_matn(h, "buzilgan.pdf")
        assert "buzilgan" in t.lower() or "xato" in t.lower()


class TestHujjatOqi:
    def test_tur_aniqlash_pdf(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"fake", "test.pdf")
        assert r["tur"] == "pdf"

    def test_tur_aniqlash_docx(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"fake", "test.docx")
        assert r["tur"] == "docx"

    def test_tur_aniqlash_xlsx(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"fake", "test.xlsx")
        assert r["tur"] == "xlsx"

    def test_noaniq_format(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"fake", "test.mp4")
        assert r.get("tur") in ("noaniq", "txt")


class TestBotIntegration:
    def test_hujjat_handler_upgraded(self):
        src = _read_bot_all()
        assert "hujjat_oqish" in src
        assert ".pdf" in src
        assert ".docx" in src

    def test_hujjat_callback(self):
        src = _read_bot_all()
        assert "_hujjat_cb" in src
        assert "huj:bet" in src
        assert "huj:jadval" in src

    def test_hujjat_savol_in_main(self):
        src = _read_bot_all()
        assert "hujjat_sorov_bormi" in src
        assert "hujjatdan_izlash" in src

    def test_navigation_buttons(self):
        src = _read_bot_all()
        assert "huj:bet:1" in src


class TestAISavolJavob:
    def test_ai_savol_kerakmi_tushuntir(self):
        from shared.services.hujjat_oqish import ai_savol_kerakmi
        assert ai_savol_kerakmi("tushuntir") is True
        assert ai_savol_kerakmi("nimaga shunday") is True
        assert ai_savol_kerakmi("xulosa ber") is True
        assert ai_savol_kerakmi("formala izohla") is True

    def test_ai_savol_kerakmi_oddiy(self):
        from shared.services.hujjat_oqish import ai_savol_kerakmi
        assert ai_savol_kerakmi("5-bet") is False
        assert ai_savol_kerakmi("salom") is False

    def test_ai_hujjat_savol_exists(self):
        from shared.services.hujjat_oqish import ai_hujjat_savol
        assert callable(ai_hujjat_savol)

    def test_kengaytirilgan_sozlar(self):
        from shared.services.hujjat_oqish import hujjat_sorov_bormi
        assert hujjat_sorov_bormi("mundarija ko'rsat") is True
        assert hujjat_sorov_bormi("formula qayerda") is True
        assert hujjat_sorov_bormi("jadval bor") is True
        assert hujjat_sorov_bormi("bob haqida") is True

    def test_ai_in_bot(self):
        src = _read_bot_all()
        assert "ai_hujjat_savol" in src
        assert "ai_savol_kerakmi" in src


class TestYangiFormatlar:
    def test_32_format(self):
        from shared.services.hujjat_oqish import QUVVAT_FORMATLAR
        assert len(QUVVAT_FORMATLAR) >= 30

    def test_epub_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"test", "kitob.epub")
        assert r["tur"] == "epub"

    def test_pptx_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"test", "slayd.pptx")
        assert r["tur"] == "pptx"

    def test_md_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"# Test\nMatn", "readme.md")
        assert r["tur"] == "md"
        assert len(r.get("mundarija", [])) > 0

    def test_json_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b'{"a": 1}', "data.json")
        assert r["tur"] == "json"

    def test_html_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"<h1>Test</h1><p>Matn</p>", "page.html")
        assert r["tur"] == "html"

    def test_rtf_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"rtf content", "doc.rtf")
        assert r["tur"] == "rtf"

    def test_fb2_tur(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"<FictionBook><body><section><p>Test</p></section></body></FictionBook>", "book.fb2")
        assert r["tur"] == "fb2"

    def test_python_fayl(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"def hello():\n    pass\n", "app.py")
        assert r["tur"] == "txt"

    def test_csv_fayl(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"nom,miqdor\nAriel,50\nTide,20", "data.csv")
        assert r["tur"] == "txt"

    def test_nomalum_format(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"binary", "video.mp4")
        assert r.get("tur") in ("noaniq", "txt")

    def test_djvu_tavsiya(self):
        from shared.services.hujjat_oqish import hujjat_oqi
        r = hujjat_oqi(b"djvu", "scan.djvu")
        assert "PDF" in r.get("tavsiya", "") or "xato" in r.get("xato", "")


class TestSahifalash:
    def test_katta_matn(self):
        from shared.services.hujjat_oqish import _matn_cache
        r = _matn_cache("A\n" * 5000, "test", b"test")
        assert r["sahifalar_soni"] >= 50

    def test_kichik_matn(self):
        from shared.services.hujjat_oqish import _matn_cache
        r = _matn_cache("Salom dunyo", "test", b"test2")
        assert r["sahifalar_soni"] >= 1

    def test_bosh_matn(self):
        from shared.services.hujjat_oqish import _matn_cache
        r = _matn_cache("", "test", b"test3")
        assert r["sahifalar_soni"] == 0


class TestBotFormatlar:
    def test_bot_accepts_epub(self):
        src = _read_bot_all()
        assert ".epub" in src

    def test_bot_accepts_pptx(self):
        src = _read_bot_all()
        assert ".pptx" in src

    def test_bot_accepts_fb2(self):
        src = _read_bot_all()
        assert ".fb2" in src

    def test_bot_accepts_md(self):
        src = _read_bot_all()
        assert ".md" in src

    def test_bot_accepts_python(self):
        src = _read_bot_all()
        assert ".py" in src
