"""
╔══════════════════════════════════════════════════════════════════════╗
║  TITAN TEST — HISOBOT ENGINE v1.0                                   ║
║  40+ testlar: format, keyword, edge case, matematik, solishtirish   ║
╚══════════════════════════════════════════════════════════════════════╝
"""
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


# ═══════════════════════════════════════════════════════════════
#  1. MODUL TESTI — import va tuzilma
# ═══════════════════════════════════════════════════════════════

class TestHisobotModul:
    """Modul import va tuzilma testlari."""

    def test_engine_importable(self):
        import shared.services.hisobot_engine as he
        assert hasattr(he, "kunlik")
        assert hasattr(he, "haftalik")
        assert hasattr(he, "oylik")
        assert hasattr(he, "hisobot_yig")
        assert hasattr(he, "qarz_hisobot")

    def test_engine_has_formatter(self):
        from shared.services.hisobot_engine import hisobot_matn, qarz_hisobot_matn
        assert callable(hisobot_matn)
        assert callable(qarz_hisobot_matn)

    def test_engine_has_keyword_detector(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert callable(hisobot_turini_aniqla)

    def test_engine_syntax(self):
        src = open("shared/services/hisobot_engine.py").read()
        ast.parse(src)

    def test_engine_has_parallel_gather(self):
        src = open("shared/services/hisobot_engine.py").read()
        assert "asyncio.gather" in src, "Parallel query kerak"

    def test_engine_no_rls_conn(self):
        """hisobot_engine da rls_conn ishlatilMASLIGI kerak — connection tashqaridan beriladi."""
        src = open("shared/services/hisobot_engine.py").read()
        assert "rls_conn" not in src, "rls_conn bo'lmasligi kerak"


# ═══════════════════════════════════════════════════════════════
#  2. KEYWORD DETECTION TESTI
# ═══════════════════════════════════════════════════════════════

class TestKeywordDetection:
    """Ovozdan hisobot turini aniqlash testlari."""

    def test_kunlik_default(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("bugungi sotuv qancha") == "kunlik"

    def test_kunlik_hisobot(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("bugungi hisobot") == "kunlik"

    def test_haftalik_uzbek(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("haftalik hisobot ko'rsat") == "haftalik"

    def test_haftalik_russian(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("отчет за неделю") == "haftalik"

    def test_oylik_uzbek(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("oylik hisobot") == "oylik"

    def test_oylik_russian(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("за месяц") == "oylik"

    def test_qarz_uzbek(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("qarzlar qancha") == "qarz"

    def test_qarz_russian(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("покажи долги") == "qarz"

    def test_unknown_defaults_kunlik(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("hisobot") == "kunlik"

    def test_empty_defaults_kunlik(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("") == "kunlik"

    def test_case_insensitive(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("HAFTALIK HISOBOT") == "haftalik"

    def test_qarz_priority_over_hafta(self):
        """Qarz + hafta aralash bo'lsa → qarz ustunligi."""
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        assert hisobot_turini_aniqla("haftalik qarzlar") == "qarz"

    def test_foyda_keyword(self):
        from shared.services.hisobot_engine import hisobot_turini_aniqla
        # foyda hozircha kunlik ga tushadi
        r = hisobot_turini_aniqla("foyda qancha")
        assert r in ("kunlik", "foyda")


# ═══════════════════════════════════════════════════════════════
#  3. FORMATLAR TESTI
# ═══════════════════════════════════════════════════════════════

class TestHisobotFormat:
    """Hisobot matn formatlash testlari."""

    def _fake_data(self, **kw):
        base = {
            "davr": "kunlik", "sana": "20.03.2026",
            "sotuv_soni": 5, "sotuv_jami": 1500000,
            "tolangan": 1200000, "yangi_qarz": 300000,
            "kirim_soni": 2, "kirim_jami": 500000,
            "qaytarish_soni": 0, "qaytarish_jami": 0,
            "foyda": 250000, "jami_qarz": 800000,
            "ortacha_chek": 300000, "qarz_nisbati": 20.0,
            "top5_tovar": [], "top5_klient": [],
        }
        base.update(kw)
        return base

    def test_basic_format(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data())
        assert "KUNLIK HISOBOT" in t
        assert "1,500,000" in t
        assert "250,000" in t

    def test_haftalik_title(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(davr="haftalik"))
        assert "HAFTALIK HISOBOT" in t

    def test_oylik_title(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(davr="oylik"))
        assert "OYLIK HISOBOT" in t

    def test_foyda_positive(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(foyda=500000))
        assert "SOF FOYDA" in t
        assert "500,000" in t

    def test_foyda_negative(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(foyda=-100000))
        assert "ZARAR" in t

    def test_top5_tovar_shown(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(
            top5_tovar=[
                {"nomi": "Ariel", "miqdor": 50, "jami": 2250000, "foyda": 500000},
                {"nomi": "Tide", "miqdor": 20, "jami": 640000, "foyda": 100000},
            ]
        ))
        assert "ENG KO'P SOTILGAN" in t
        assert "Ariel" in t
        assert "Tide" in t
        assert "🥇" in t
        assert "🥈" in t

    def test_top5_klient_shown(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(
            top5_klient=[
                {"ism": "Salimov", "jami_sotuv": 3000000, "jami_qarz": 500000},
            ]
        ))
        assert "YIRIK KLIENTLAR" in t
        assert "Salimov" in t
        assert "qarz" in t.lower()

    def test_sotuv_ozgarish_positive(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(sotuv_ozgarish=25.5))
        assert "📈" in t
        assert "+25.5%" in t

    def test_sotuv_ozgarish_negative(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(sotuv_ozgarish=-15.0))
        assert "📉" in t
        assert "-15.0%" in t

    def test_qarz_xavf_yashil(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(qarz_nisbati=10.0, jami_qarz=100000))
        assert "🟢" in t

    def test_qarz_xavf_sariq(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(qarz_nisbati=35.0, jami_qarz=500000))
        assert "🟡" in t

    def test_qarz_xavf_qizil(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(qarz_nisbati=60.0, jami_qarz=900000))
        assert "🔴" in t

    def test_ortacha_chek(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(ortacha_chek=450000))
        assert "O'rtacha chek" in t
        assert "450,000" in t

    def test_qaytarish_shown(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(qaytarish_soni=2, qaytarish_jami=150000))
        assert "Qaytarish" in t
        assert "150,000" in t

    def test_qaytarish_hidden_when_zero(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(qaytarish_soni=0))
        assert "Qaytarish" not in t

    def test_no_qarz_no_warning(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn(self._fake_data(jami_qarz=0, yangi_qarz=0))
        assert "🟢" not in t
        assert "🟡" not in t
        assert "🔴" not in t


# ═══════════════════════════════════════════════════════════════
#  4. QARZ HISOBOT FORMAT
# ═══════════════════════════════════════════════════════════════

class TestQarzFormat:
    """Qarz hisobot format testlari."""

    def test_empty_debts(self):
        from shared.services.hisobot_engine import qarz_hisobot_matn
        t = qarz_hisobot_matn({"klientlar": [], "jami_qarz": 0, "klient_soni": 0})
        assert "yo'q" in t.lower() or "to'langan" in t.lower()

    def test_with_debts(self):
        from shared.services.hisobot_engine import qarz_hisobot_matn
        t = qarz_hisobot_matn({
            "klientlar": [
                {"ism": "Karimov", "qarz": 500000, "muddat": "2026-04-01", "qarz_soni": 2},
                {"ism": "Salimov", "qarz": 300000, "muddat": "2026-03-25", "qarz_soni": 1},
            ],
            "jami_qarz": 800000,
            "klient_soni": 2,
        })
        assert "Karimov" in t
        assert "Salimov" in t
        assert "800,000" in t
        assert "2 ta klient" in t


# ═══════════════════════════════════════════════════════════════
#  5. BOT INTEGRATSIYA TESTI
# ═══════════════════════════════════════════════════════════════

class TestBotIntegration:
    """Bot main.py integratsiya testlari."""

    def test_pre_ai_shortcut_exists(self):
        src = _read_bot_all()
        assert "bugungi sotuv" in src
        assert "haftalik hisobot" in src
        assert "hisobot_turini_aniqla" in src

    def test_hisobot_engine_in_qayta_ishlash(self):
        src = _read_bot_all()
        assert "hisobot_engine" in src
        assert "hisobot_matn" in src

    def test_report_callback_upgraded(self):
        src = _read_bot_all()
        # Eski db.kunlik_hisobot fallback bo'lib qolgan bo'lishi kerak
        assert "kunlik" in src
        assert "haftalik" in src

    def test_hisobot_russian_keywords(self):
        src = _read_bot_all()
        assert "отчет" in src

    def test_fallback_exists(self):
        """Hisobot engine xato bersa, eski tizim ishlasin."""
        src = _read_bot_all()
        assert "fallback" in src.lower() or "davom etadi" in src


# ═══════════════════════════════════════════════════════════════
#  6. EDGE CASES
# ═══════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Chegaraviy holatlar testlari."""

    def test_zero_sales(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn({
            "davr": "kunlik", "sana": "20.03.2026",
            "sotuv_soni": 0, "sotuv_jami": 0,
            "tolangan": 0, "yangi_qarz": 0,
            "kirim_soni": 0, "kirim_jami": 0,
            "qaytarish_soni": 0, "qaytarish_jami": 0,
            "foyda": 0, "jami_qarz": 0,
            "ortacha_chek": 0, "qarz_nisbati": 0,
            "top5_tovar": [], "top5_klient": [],
        })
        assert "KUNLIK HISOBOT" in t
        assert "0" in t

    def test_pul_formatter_big_number(self):
        from shared.services.hisobot_engine import _pul
        assert _pul(1500000000) == "1,500,000,000"

    def test_pul_formatter_zero(self):
        from shared.services.hisobot_engine import _pul
        assert _pul(0) == "0"

    def test_pul_formatter_none(self):
        from shared.services.hisobot_engine import _pul
        assert _pul(None) == "0"


# ═══════════════════════════════════════════════════════════════
#  7. KLIENT QARZ TARIXI TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestKlientNomAjrat:
    """Klient nomini matndan ajratish testlari."""

    def test_salimovning_qarzi(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        assert klient_nomini_ajrat("Salimovning qarzi qancha") == "Salimov"

    def test_karimov_qarz(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        assert klient_nomini_ajrat("Karimov qarz") == "Karimov"

    def test_akbar_nasiya(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        r = klient_nomini_ajrat("Akbar nasiyasi qancha")
        assert r is not None and "akbar" in r.lower()

    def test_qarz_salimov(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        assert klient_nomini_ajrat("qarz Salimov") == "Salimov"

    def test_no_client(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        assert klient_nomini_ajrat("bugungi sotuv qancha") is None

    def test_empty(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        assert klient_nomini_ajrat("") is None

    def test_lowercase_client(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        r = klient_nomini_ajrat("salimov qarzi")
        assert r is not None and "alimov" in r.lower()

    def test_ning_suffix_removed(self):
        from shared.services.hisobot_engine import klient_nomini_ajrat
        r = klient_nomini_ajrat("Salimovning qarzi")
        # "Salimovning" → "Salimov" (ning olib tashlangan)
        assert r is not None
        assert "ning" not in r.lower()


class TestKlientQarzSorovi:
    """Klient qarz so'rovi deteksiya testlari."""

    def test_positive_uzbek(self):
        from shared.services.hisobot_engine import klient_qarz_sorovi
        assert klient_qarz_sorovi("Salimovning qarzi qancha") is True

    def test_positive_russian(self):
        from shared.services.hisobot_engine import klient_qarz_sorovi
        assert klient_qarz_sorovi("Долг Салимов") is True

    def test_negative_no_client(self):
        from shared.services.hisobot_engine import klient_qarz_sorovi
        assert klient_qarz_sorovi("bugungi sotuv") is False

    def test_negative_no_debt(self):
        from shared.services.hisobot_engine import klient_qarz_sorovi
        assert klient_qarz_sorovi("Salimovga 5 Ariel") is False

    def test_nasiya(self):
        from shared.services.hisobot_engine import klient_qarz_sorovi
        assert klient_qarz_sorovi("Karimov nasiyasi") is True


class TestKlientQarzFormat:
    """Klient qarz tarix format testlari."""

    def _fake_tarix(self, **kw):
        base = {
            "klient": {"id": 1, "ism": "Salimov", "telefon": "+998901234567",
                        "manzil": "", "kredit_limit": 0},
            "jami_qarz": 590000,
            "faol_qarzlar": [
                {"jami": 500000, "qolgan": 300000, "tolangan": 200000,
                 "sana": "2026-03-15", "muddat": "2026-04-15", "muddati_otgan": False},
                {"jami": 400000, "qolgan": 290000, "tolangan": 110000,
                 "sana": "2026-03-18", "muddat": "2026-04-18", "muddati_otgan": False},
            ],
            "muddati_otgan_soni": 0,
            "oxirgi_sotuvlar": [
                {"sana": "2026-03-18", "jami": 400000, "tolangan": 110000, "qarz": 290000},
                {"sana": "2026-03-15", "jami": 500000, "tolangan": 200000, "qarz": 300000},
            ],
            "statistika": {
                "sotuv_soni": 12, "jami_sotuv": 5400000,
                "jami_tolangan": 4810000,
                "birinchi_sotuv": "2026-01-10", "oxirgi_sotuv": "2026-03-18",
            },
        }
        base.update(kw)
        return base

    def test_basic_format(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix())
        assert "Salimov" in t
        assert "590,000" in t
        assert "FAOL QARZLAR" in t

    def test_no_debt(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix(
            jami_qarz=0, faol_qarzlar=[]))
        assert "yo'q" in t.lower() or "to'langan" in t.lower()

    def test_overdue_shown(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix(
            muddati_otgan_soni=2,
            faol_qarzlar=[
                {"jami": 100000, "qolgan": 100000, "tolangan": 0,
                 "sana": "2026-01-01", "muddat": "2026-02-01", "muddati_otgan": True},
            ]
        ))
        assert "muddati o'tgan" in t.lower() or "‼️" in t

    def test_statistika_shown(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix())
        assert "STATISTIKA" in t
        assert "12" in t  # sotuv soni
        assert "5,400,000" in t

    def test_telefon_shown(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix())
        assert "+998" in t

    def test_oxirgi_sotuvlar(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix())
        assert "OXIRGI SOTUVLAR" in t

    def test_kredit_limit(self):
        from shared.services.hisobot_engine import klient_qarz_tarix_matn
        t = klient_qarz_tarix_matn(self._fake_tarix(
            klient={"id": 1, "ism": "Test", "telefon": "",
                    "manzil": "", "kredit_limit": 1000000},
            jami_qarz=500000
        ))
        assert "Kredit limit" in t
        assert "50" in t  # 50% ishlatilgan


class TestBotKlientIntegration:
    """Bot integratsiya — klient qarz shortcut testlari."""

    def test_shortcut_in_main(self):
        src = _read_bot_all()
        assert "klient_qarz_sorovi" in src
        assert "klient_nomini_ajrat" in src
        assert "klient_qarz_tarix" in src

    def test_pdf_excel_buttons(self):
        src = _read_bot_all()
        assert "PDF hisobi" in src
        assert "Excel hisobi" in src

    def test_not_found_message(self):
        src = _read_bot_all()
        assert "topilmadi" in src


# ═══════════════════════════════════════════════════════════════
#  8. EXCEL EXPORT + QOLDIQ OGOHLANTIRISH + YANGI FEATURES
# ═══════════════════════════════════════════════════════════════

class TestExcelExport:
    """Excel hisobot export testlari."""

    def test_hisobot_excel_exists(self):
        src = open("services/bot/bot_services/export_excel.py").read()
        assert "def hisobot_excel" in src

    def test_hisobot_excel_top5(self):
        src = open("services/bot/bot_services/export_excel.py").read()
        assert "top5_tovar" in src
        assert "top5_klient" in src

    def test_excel_callback_registered(self):
        src = _read_bot_all()
        assert "hisob_excel:" in src
        assert "_hisobot_excel_cb" in src

    def test_excel_shortcut_keyword(self):
        src = _read_bot_all()
        assert "hisobot excel" in src or "excel hisobot" in src


class TestQoldiqOgohlantirish:
    """Sotuv dan keyin kam qoldiq ogohlantirish."""

    def test_auto_warning_after_sale(self):
        src = _read_bot_all()
        assert "KAM QOLDIQ OGOHLANTIRISH" in src

    def test_kam_qoldiq_called_after_sotuv(self):
        src = _read_bot_all()
        # kam_qoldiq_tovarlar sotuv saqlangandan keyin chaqirilishi kerak
        idx_sotuv = src.find("Sotuv saqlandi")
        idx_kam = src.find("kam_qoldiq_tovarlar", idx_sotuv if idx_sotuv > 0 else 0)
        assert idx_kam > 0, "kam_qoldiq sotuv dan keyin chaqirilishi kerak"


class TestHisobotButtons:
    """Inline tugma testlari."""

    def test_excel_button_in_hisobot(self):
        src = _read_bot_all()
        assert "hisob_excel:" in src

    def test_pdf_excel_in_klient(self):
        src = _read_bot_all()
        assert "PDF hisobi" in src
        assert "Excel hisobi" in src


class TestSmartNarx:
    """Smart narx mavjudligi testi."""

    def test_smart_narx_exists(self):
        src = open("shared/services/smart_narx.py").read()
        assert "narx_aniqla" in src

    def test_smart_narx_in_bot(self):
        src = _read_bot_all()
        assert "smart_narx" in src or "narx_aniqla" in src


class TestFoydaHisob:
    """Foyda hisob mavjudligi testi."""

    def test_foyda_in_hisobot(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn({
            "davr": "kunlik", "sana": "20.03.2026",
            "sotuv_soni": 5, "sotuv_jami": 1500000,
            "tolangan": 1200000, "yangi_qarz": 300000,
            "kirim_soni": 0, "kirim_jami": 0,
            "qaytarish_soni": 0, "qaytarish_jami": 0,
            "foyda": 350000, "jami_qarz": 0,
            "ortacha_chek": 300000, "qarz_nisbati": 0,
            "top5_tovar": [], "top5_klient": [],
        })
        assert "350,000" in t
        assert "FOYDA" in t

    def test_foyda_in_excel(self):
        src = open("services/bot/bot_services/export_excel.py").read()
        assert "SOF FOYDA" in src

    def test_foyda_zarar(self):
        from shared.services.hisobot_engine import hisobot_matn
        t = hisobot_matn({
            "davr": "kunlik", "sana": "20.03.2026",
            "sotuv_soni": 1, "sotuv_jami": 100000,
            "tolangan": 100000, "yangi_qarz": 0,
            "kirim_soni": 0, "kirim_jami": 0,
            "qaytarish_soni": 0, "qaytarish_jami": 0,
            "foyda": -50000, "jami_qarz": 0,
            "ortacha_chek": 100000, "qarz_nisbati": 0,
            "top5_tovar": [], "top5_klient": [],
        })
        assert "ZARAR" in t


# ═══════════════════════════════════════════════════════════════
#  9. RASM → NAKLADNOY + DB TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestRasmNakladnoy:
    """Rasm → Vision AI → DB → Nakladnoy."""

    def test_rasm_handler_has_db_save(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "kutilayotgan" in src, "DB ga saqlash uchun kutilayotgan data"

    def test_rasm_handler_has_tasdiqlash(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "Tasdiqlash" in src
        assert "t:ha" in src

    def test_rasm_handler_has_nakladnoy_only(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "rasm:nakl" in src
        assert "rasm_nakladnoy_cb" in src

    def test_rasm_callback_registered(self):
        src = _read_bot_all()
        assert "rasm:nakl" in src
        assert "rasm_nakladnoy_cb" in src

    def test_vision_module_exists(self):
        import ast
        ast.parse(open("shared/services/vision.py").read())

    def test_rasm_low_confidence_rejected(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "ishonch < 0.2" in src or "0.2" in src


# ═══════════════════════════════════════════════════════════════
#  10. TTS (OVOZLI JAVOB) TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestTTS:
    """Ovozli javob — Text-to-Speech."""

    def test_tts_module_syntax(self):
        import ast
        ast.parse(open("services/bot/bot_services/tts.py").read())

    def test_tts_has_functions(self):
        src = open("services/bot/bot_services/tts.py").read()
        assert "def ishga_tushir" in src
        assert "async def matn_ovozga" in src
        assert "def tts_tayyor" in src
        assert "def hisobot_xulosa" in src

    def test_tts_init_in_bot(self):
        src = _read_bot_all()
        assert "tts_init" in src

    def test_tts_in_hisobot(self):
        src = _read_bot_all()
        assert "Ovozli xulosa" in src

    def test_hisobot_xulosa_format(self):
        from services.bot.bot_services.tts import hisobot_xulosa
        d = {"davr": "kunlik", "sotuv_jami": 1500000, "sotuv_soni": 5,
             "foyda": 250000, "jami_qarz": 800000}
        x = hisobot_xulosa(d)
        assert "1.5 million" in x or "1500" in x
        assert "5 ta sotuv" in x
        assert "foyda" in x.lower() or "250" in x

    def test_hisobot_xulosa_zero(self):
        from services.bot.bot_services.tts import hisobot_xulosa
        d = {"davr": "kunlik", "sotuv_jami": 0, "sotuv_soni": 0,
             "foyda": 0, "jami_qarz": 0}
        x = hisobot_xulosa(d)
        assert "0 ta sotuv" in x

    def test_tts_max_length(self):
        from services.bot.bot_services.tts import MAX_MATN_UZUNLIGI
        assert MAX_MATN_UZUNLIGI >= 100

    def test_tts_cache_mechanism(self):
        src = open("services/bot/bot_services/tts.py").read()
        assert "_TTS_CACHE" in src
        assert "cache_key" in src.lower() or "_cache_key" in src

    def test_wav_to_ogg(self):
        src = open("services/bot/bot_services/tts.py").read()
        assert "ogg" in src.lower()
        assert "ffmpeg" in src


# ═══════════════════════════════════════════════════════════════
#  11. OFFLINE NAVBAT TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestOfflineQueue:
    """AI fail bo'lsa — navbatga qo'yish va qayta urinish."""

    def test_queue_module_syntax(self):
        import ast
        ast.parse(open("services/bot/bot_services/offline_queue.py").read())

    def test_queue_has_functions(self):
        src = open("services/bot/bot_services/offline_queue.py").read()
        assert "async def navbatga_qosh" in src
        assert "def navbat_soni" in src
        assert "def navbat_tozalash" in src
        assert "MAX_RETRIES" in src

    def test_queue_in_bot(self):
        src = _read_bot_all()
        assert "offline_queue" in src
        assert "navbatga_qosh" in src

    def test_retry_count(self):
        from services.bot.bot_services.offline_queue import MAX_RETRIES
        assert MAX_RETRIES >= 2
        assert MAX_RETRIES <= 5

    def test_queue_size_limit(self):
        from services.bot.bot_services.offline_queue import MAX_QUEUE_SIZE
        assert MAX_QUEUE_SIZE >= 50
        assert MAX_QUEUE_SIZE <= 500

    def test_queue_soni_empty(self):
        from services.bot.bot_services.offline_queue import navbat_soni
        assert navbat_soni(999999) == 0

    def test_queue_tozalash(self):
        from services.bot.bot_services.offline_queue import navbat_tozalash, navbat_soni
        navbat_tozalash(999999)
        assert navbat_soni(999999) == 0

    def test_user_sees_queue_message(self):
        src = _read_bot_all()
        assert "Navbatda" in src or "navbat" in src
        assert "qayta uriniladi" in src
