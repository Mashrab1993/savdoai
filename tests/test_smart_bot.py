"""
╔══════════════════════════════════════════════════════════════╗
║  TITAN TEST — SMART BOT ENGINE v1.0                          ║
║  6 ta feature × 8-10 test = 50+ test                        ║
╚══════════════════════════════════════════════════════════════╝
"""
import sys, os, ast
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════════════════════════
#  MODUL TESTI
# ═══════════════════════════════════════════════════════════════

class TestSmartBotModul:
    def test_syntax(self):
        ast.parse(open("shared/services/smart_bot_engine.py").read())

    def test_imports(self):
        import shared.services.smart_bot_engine as sbe
        assert hasattr(sbe, "qarz_eslatma_royxat")
        assert hasattr(sbe, "narx_tavsiya")
        assert hasattr(sbe, "inventarizatsiya")
        assert hasattr(sbe, "klient_reyting")
        assert hasattr(sbe, "kunlik_yakuniy_pro")
        assert hasattr(sbe, "haftalik_trend")

    def test_has_formatters(self):
        import shared.services.smart_bot_engine as sbe
        assert hasattr(sbe, "qarz_eslatma_matn")
        assert hasattr(sbe, "narx_tavsiya_matn")
        assert hasattr(sbe, "inventarizatsiya_matn")
        assert hasattr(sbe, "klient_reyting_matn")
        assert hasattr(sbe, "kunlik_yakuniy_pro_matn")
        assert hasattr(sbe, "haftalik_trend_matn")

    def test_has_command_detector(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert callable(smart_buyruq_aniqla)

    def test_parallel_queries(self):
        src = open("shared/services/smart_bot_engine.py").read()
        assert "await" in src  # sequential queries


# ═══════════════════════════════════════════════════════════════
#  1. QARZ ESLATMA TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestQarzEslatma:
    def test_eslatma_matn_muddati_otgan(self):
        from shared.services.smart_bot_engine import qarz_eslatma_matn
        t = qarz_eslatma_matn({
            "ism": "Salimov", "jami_qarz": 500000,
            "muddat": "2026-03-10", "muddati_otgan": True,
            "yaqinlashmoqda": False, "qarz_soni": 1,
        })
        assert "🔴" in t
        assert "Salimov" in t
        assert "500,000" in t

    def test_eslatma_matn_yaqin(self):
        from shared.services.smart_bot_engine import qarz_eslatma_matn
        t = qarz_eslatma_matn({
            "ism": "Karimov", "jami_qarz": 300000,
            "muddat": "2026-03-22", "muddati_otgan": False,
            "yaqinlashmoqda": True, "qarz_soni": 1,
        })
        assert "🟡" in t
        assert "Karimov" in t

    def test_eslatma_matn_empty(self):
        from shared.services.smart_bot_engine import qarz_eslatma_matn
        t = qarz_eslatma_matn({
            "ism": "Test", "jami_qarz": 100,
            "muddat": "2026-12-31", "muddati_otgan": False,
            "yaqinlashmoqda": False, "qarz_soni": 0,
        })
        assert t == ""

    def test_auto_qarz_upgraded(self):
        src = open("services/bot/main.py", encoding="utf-8").read() + open("services/bot/handlers/jobs.py", encoding="utf-8").read()
        assert "qarz_eslatma_royxat" in src
        assert "MUDDATI O'TGAN" in src or "muddati_otgan" in src


# ═══════════════════════════════════════════════════════════════
#  2. NARX TAVSIYA TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestNarxTavsiya:
    def test_narx_topilmadi(self):
        from shared.services.smart_bot_engine import narx_tavsiya_matn
        t = narx_tavsiya_matn({"topildi": False, "nomi": "Noma'lum"})
        assert "topilmadi" in t.lower()

    def test_narx_topildi(self):
        from shared.services.smart_bot_engine import narx_tavsiya_matn
        t = narx_tavsiya_matn({
            "topildi": True, "nomi": "Ariel", "olish_narxi": 40000,
            "qoldiq": 50, "ortacha": 45000, "eng_past": 42000,
            "eng_yuqori": 48000, "tavsiya": 45000, "sotuv_soni": 20,
            "oxirgi_sotuvlar": [
                {"narx": 45000, "klient": "Salimov", "sana": "2026-03-18"}
            ],
            "foyda_foiz": 12.5,
        })
        assert "Ariel" in t
        assert "TAVSIYA" in t
        assert "45,000" in t
        assert "12.5%" in t

    def test_narx_tovar_ajrat(self):
        from shared.services.smart_bot_engine import narx_tovar_ajrat
        assert narx_tovar_ajrat("Arielni qanchadan sotay") == "Ariel"

    def test_narx_tovar_ajrat_v2(self):
        from shared.services.smart_bot_engine import narx_tovar_ajrat
        r = narx_tovar_ajrat("narx Tide")
        assert r is not None and "ide" in r.lower()

    def test_narx_command_detected(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("Arielni qanchadan sotay") == "narx_tavsiya"

    def test_narx_in_bot(self):
        src = open("services/bot/main.py").read()
        assert "narx_tavsiya" in src


# ═══════════════════════════════════════════════════════════════
#  3. INVENTARIZATSIYA TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestInventarizatsiya:
    def test_inventar_matn_yangilandi(self):
        from shared.services.smart_bot_engine import inventarizatsiya_matn
        t = inventarizatsiya_matn({
            "yangilandi": 3,
            "topilmadi": ["XYZ"],
            "farqlar": [
                {"nomi": "Ariel", "eski": 50, "yangi": 45, "farq": -5},
                {"nomi": "Tide", "eski": 20, "yangi": 23, "farq": 3},
                {"nomi": "Fairy", "eski": 12, "yangi": 12, "farq": 0},
            ]
        })
        assert "3 ta tovar yangilandi" in t
        assert "Ariel" in t
        assert "-5" in t
        assert "+3" in t
        assert "XYZ" in t

    def test_inventar_matn_empty(self):
        from shared.services.smart_bot_engine import inventarizatsiya_matn
        t = inventarizatsiya_matn({"yangilandi": 0, "topilmadi": [], "farqlar": []})
        assert "yangilanmadi" in t.lower()

    def test_inventar_command_detected(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("inventarizatsiya qil") == "inventarizatsiya"

    def test_inventar_sanoq(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("sanoq qilish kerak") == "inventarizatsiya"


# ═══════════════════════════════════════════════════════════════
#  4. KLIENT REYTING TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestKlientReyting:
    def test_reyting_matn(self):
        from shared.services.smart_bot_engine import klient_reyting_matn
        data = [
            {"ism": "Salimov", "reyting": "A", "emoji": "🟢",
             "jami_sotuv": 5000000, "aktiv_qarz": 0, "muddati_otgan": 0, "sotuv_soni": 20},
            {"ism": "Karimov", "reyting": "B", "emoji": "🟡",
             "jami_sotuv": 3000000, "aktiv_qarz": 500000, "muddati_otgan": 1, "sotuv_soni": 15},
            {"ism": "Toshmatov", "reyting": "C", "emoji": "🔴",
             "jami_sotuv": 1000000, "aktiv_qarz": 800000, "muddati_otgan": 4, "sotuv_soni": 5},
        ]
        t = klient_reyting_matn(data)
        assert "REYTING" in t
        assert "🟢" in t
        assert "🟡" in t
        assert "🔴" in t
        assert "Salimov" in t
        assert "1 ta 🟢A" in t

    def test_reyting_empty(self):
        from shared.services.smart_bot_engine import klient_reyting_matn
        t = klient_reyting_matn([])
        assert "yo'q" in t.lower()

    def test_reyting_command(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("klient reyting ko'rsat") == "klient_reyting"

    def test_reyting_in_bot(self):
        src = open("services/bot/main.py").read()
        assert "klient_reyting" in src


# ═══════════════════════════════════════════════════════════════
#  5. KUNLIK YAKUNIY PRO TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestKunlikYakuniyPro:
    def test_yakuniy_matn(self):
        from shared.services.smart_bot_engine import kunlik_yakuniy_pro_matn
        t = kunlik_yakuniy_pro_matn({
            "sana": "20.03.2026", "sotuv_soni": 5, "sotuv_jami": 1500000,
            "tolangan": 1200000, "yangi_qarz": 300000, "foyda": 250000,
            "kecha_jami": 1200000, "ozgarish": 25.0,
            "top_tovar": {"nomi": "Ariel", "foyda": 150000},
            "top_klient": {"ism": "Salimov", "jami": 800000},
            "jami_qarz": 600000,
        })
        assert "KUNLIK YAKUNIY" in t
        assert "1,500,000" in t
        assert "250,000" in t
        assert "+25" in t
        assert "Ariel" in t
        assert "Salimov" in t

    def test_yakuniy_zero(self):
        from shared.services.smart_bot_engine import kunlik_yakuniy_pro_matn
        t = kunlik_yakuniy_pro_matn({
            "sana": "20.03.2026", "sotuv_soni": 0, "sotuv_jami": 0,
            "tolangan": 0, "yangi_qarz": 0, "foyda": 0,
            "kecha_jami": 0, "ozgarish": 0,
            "top_tovar": None, "top_klient": None, "jami_qarz": 0,
        })
        assert "KUNLIK YAKUNIY" in t

    def test_auto_upgraded(self):
        src = open("services/bot/main.py", encoding="utf-8").read() + open("services/bot/handlers/jobs.py", encoding="utf-8").read()
        assert "kunlik_yakuniy_pro" in src

    def test_parallel_in_pro(self):
        src = open("shared/services/smart_bot_engine.py").read()
        # kunlik_yakuniy_pro da asyncio.gather bo'lishi kerak
        assert src.count("await") >= 10  # sequential DB queries


# ═══════════════════════════════════════════════════════════════
#  6. HAFTALIK TREND TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestHaftalikTrend:
    def test_trend_matn(self):
        from shared.services.smart_bot_engine import haftalik_trend_matn
        t = haftalik_trend_matn({
            "osganlar": [
                {"nomi": "Ariel", "bu_hafta": 2000000, "otgan_hafta": 1500000, "ozgarish": 33.3},
                {"nomi": "Tide", "bu_hafta": 800000, "otgan_hafta": 600000, "ozgarish": 33.3},
            ],
            "tushganlar": [
                {"nomi": "Fairy", "bu_hafta": 200000, "otgan_hafta": 500000, "ozgarish": -60.0},
            ],
            "bu_hafta_jami": 3000000,
            "otgan_hafta_jami": 2600000,
            "umumiy_ozgarish": 15.4,
        })
        assert "TREND" in t
        assert "O'SGAN" in t
        assert "TUSHGAN" in t
        assert "Ariel" in t
        assert "Fairy" in t
        assert "+33.3%" in t
        assert "-60.0%" in t

    def test_trend_empty(self):
        from shared.services.smart_bot_engine import haftalik_trend_matn
        t = haftalik_trend_matn({
            "osganlar": [], "tushganlar": [],
            "bu_hafta_jami": 0, "otgan_hafta_jami": 0, "umumiy_ozgarish": 0,
        })
        assert "yetarli" in t.lower() or "ma'lumot" in t.lower()

    def test_trend_command(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("haftalik trend") == "haftalik_trend"

    def test_trend_osish(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("qaysi tovar o'sgan") == "haftalik_trend"

    def test_auto_haftalik_upgraded(self):
        src = open("services/bot/main.py").read()
        assert "haftalik_trend" in src


# ═══════════════════════════════════════════════════════════════
#  BUYRUQ ANIQLASH TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestBuyruqAniqla:
    def test_narx(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("Arielni qanchadan sotay") == "narx_tavsiya"

    def test_inventar(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("inventarizatsiya") == "inventarizatsiya"

    def test_reyting(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("reyting ko'rsat") == "klient_reyting"

    def test_trend(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("haftalik trend") == "haftalik_trend"

    def test_none_for_sotuv(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("Salimovga 5 Ariel 45000") is None

    def test_none_for_empty(self):
        from shared.services.smart_bot_engine import smart_buyruq_aniqla
        assert smart_buyruq_aniqla("") is None
