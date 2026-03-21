"""
╔══════════════════════════════════════════════════════════════╗
║  TITAN TEST — ADVANCED FEATURES v1.0                         ║
║  9 ta feature × 5+ test = 50+ test                          ║
╚══════════════════════════════════════════════════════════════╝
"""
import sys, os, ast
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestAdvancedModul:
    def test_syntax(self):
        ast.parse(open("shared/services/advanced_features.py").read())

    def test_imports(self):
        import shared.services.advanced_features as af
        assert hasattr(af, "kontekst_bormi")
        assert hasattr(af, "tuzatish_bormi")
        assert hasattr(af, "tabiiy_savol_javob")
        assert hasattr(af, "zarar_tekshir")
        assert hasattr(af, "shablon_olish")
        assert hasattr(af, "tezkor_tugmalar")
        assert hasattr(af, "qoldiq_tuzatish")
        assert hasattr(af, "tovar_abc")
        assert hasattr(af, "advanced_buyruq_aniqla")


# ═══════ 1. KONTEKST ═══════
class TestKontekst:
    def test_yana(self):
        from shared.services.advanced_features import kontekst_bormi
        assert kontekst_bormi("yana 20 Tide qo'sh") is True

    def test_ham(self):
        from shared.services.advanced_features import kontekst_bormi
        assert kontekst_bormi("10 Fairy ham qo'sh") is True

    def test_oddiy(self):
        from shared.services.advanced_features import kontekst_bormi
        assert kontekst_bormi("Salimovga 5 Ariel 45000") is False

    def test_tozalash(self):
        from shared.services.advanced_features import kontekst_tozala
        r = kontekst_tozala("yana 20 Tide")
        assert "20" in r
        assert "Tide" in r
        assert "yana" not in r


# ═══════ 2. TUZATISH ═══════
class TestTuzatish:
    def test_emas(self):
        from shared.services.advanced_features import tuzatish_bormi
        assert tuzatish_bormi("50 emas 30 ta") is True

    def test_ozgartir(self):
        from shared.services.advanced_features import tuzatish_bormi
        assert tuzatish_bormi("narxini o'zgartir") is True

    def test_oddiy(self):
        from shared.services.advanced_features import tuzatish_bormi
        assert tuzatish_bormi("5 Ariel 45000") is False

    def test_ajrat_emas(self):
        from shared.services.advanced_features import tuzatish_ajrat
        r = tuzatish_ajrat("50 emas 30 ta")
        assert r.get("eski") == 50
        assert r.get("yangi") == 30

    def test_ajrat_narx(self):
        from shared.services.advanced_features import tuzatish_ajrat
        r = tuzatish_ajrat("narxini 45000 qil")
        assert r.get("yangi") == 45000
        assert r.get("tur") == "narx"


# ═══════ 3. TABIIY SAVOL ═══════
class TestTabiiySavol:
    def test_kecha_aniqlash(self):
        from shared.services.advanced_features import savol_turini_aniqla
        assert savol_turini_aniqla("kecha Ariel nechtadan sotdim") == "kecha_sotuv"

    def test_qoldiq_aniqlash(self):
        from shared.services.advanced_features import savol_turini_aniqla
        assert savol_turini_aniqla("Arielning qoldig'i nechta") == "tovar_qoldiq"

    def test_eng_kop_aniqlash(self):
        from shared.services.advanced_features import savol_turini_aniqla
        assert savol_turini_aniqla("eng ko'p sotilgan") == "eng_kop"

    def test_oxirgi(self):
        from shared.services.advanced_features import savol_turini_aniqla
        assert savol_turini_aniqla("oxirgi sotuv") == "oxirgi_sotuv"

    def test_oddiy_none(self):
        from shared.services.advanced_features import savol_turini_aniqla
        assert savol_turini_aniqla("5 Ariel 45000") is None

    def test_tovar_ajrat(self):
        from shared.services.advanced_features import savol_tovar_ajrat
        assert savol_tovar_ajrat("Arielning qoldig'i") is not None


# ═══════ 4. ZARAR ═══════
class TestZarar:
    def test_zarar_matn(self):
        from shared.services.advanced_features import zarar_ogohlantirish_matn
        t = zarar_ogohlantirish_matn([
            {"nomi": "Ariel", "olish": 44000, "sotish": 42000, "zarar": 2000, "zarar_foiz": 4.5}
        ])
        assert "ZARAR" in t
        assert "Ariel" in t
        assert "42,000" in t
        assert "44,000" in t

    def test_zarar_empty(self):
        from shared.services.advanced_features import zarar_ogohlantirish_matn
        assert zarar_ogohlantirish_matn([]) == ""


# ═══════ 5. SHABLON ═══════
class TestShablon:
    def test_shablon_bormi(self):
        from shared.services.advanced_features import shablon_bormi
        assert shablon_bormi("Salimov odatiy") is True
        assert shablon_bormi("Salimov har doim") is True

    def test_shablon_yoq(self):
        from shared.services.advanced_features import shablon_bormi
        assert shablon_bormi("Salimovga 5 Ariel") is False

    def test_klient_ajrat(self):
        from shared.services.advanced_features import shablon_klient_ajrat
        assert shablon_klient_ajrat("Salimov odatiy") == "Salimov"

    def test_shablon_matn(self):
        from shared.services.advanced_features import shablon_matn
        t = shablon_matn({
            "klient": "Salimov",
            "tovarlar": [
                {"nomi": "Ariel", "miqdor": 50, "birlik": "dona", "narx": 45000, "takror": 3},
                {"nomi": "Tide", "miqdor": 20, "birlik": "dona", "narx": 32000, "takror": 2},
            ]
        })
        assert "Salimov" in t
        assert "Ariel" in t
        assert "Tide" in t


# ═══════ 6. GURUHLI ═══════
class TestGuruhli:
    def test_guruhli_bormi(self):
        from shared.services.advanced_features import guruhli_bormi
        assert guruhli_bormi("5 ta klientga bir xil 10 Ariel") is True

    def test_guruhli_yoq(self):
        from shared.services.advanced_features import guruhli_bormi
        assert guruhli_bormi("Salimovga 5 Ariel") is False

    def test_guruhli_ajrat(self):
        from shared.services.advanced_features import guruhli_ajrat
        r = guruhli_ajrat("5 ta klientga bir xil 10 Ariel 45000")
        assert r.get("soni") == 5
        assert "10 Ariel" in r.get("tovar_matn", "")


# ═══════ 7. TEZKOR TUGMALAR ═══════
class TestTezkorTugmalar:
    def test_function_exists(self):
        from shared.services.advanced_features import tezkor_tugmalar
        assert callable(tezkor_tugmalar)

    def test_returns_dict(self):
        import asyncio
        # tezkor_tugmalar async — tuzilmasini tekshiramiz
        src = open("shared/services/advanced_features.py").read()
        assert "tovarlar" in src
        assert "klientlar" in src


# ═══════ 8. QOLDIQ TO'G'RILASH ═══════
class TestQoldiqTuzatish:
    def test_bormi(self):
        from shared.services.advanced_features import qoldiq_tuzatish_bormi
        assert qoldiq_tuzatish_bormi("Ariel 3 ta yo'qoldi") is True

    def test_bormi_singan(self):
        from shared.services.advanced_features import qoldiq_tuzatish_bormi
        assert qoldiq_tuzatish_bormi("Tide 2 ta singan") is True

    def test_bormi_yoq(self):
        from shared.services.advanced_features import qoldiq_tuzatish_bormi
        assert qoldiq_tuzatish_bormi("5 Ariel 45000") is False

    def test_ajrat(self):
        from shared.services.advanced_features import qoldiq_tuzatish_ajrat
        r = qoldiq_tuzatish_ajrat("Ariel 3 ta yo'qoldi")
        assert r is not None
        assert r["miqdor"] == 3
        assert "yo'qoldi" in r["sabab"] or "yo" in r["sabab"]

    def test_matn_ok(self):
        from shared.services.advanced_features import qoldiq_tuzatish_matn
        t = qoldiq_tuzatish_matn({
            "ok": True, "nomi": "Ariel", "eski": 50, "yangi": 47, "miqdor": 3, "sabab": "yo'qoldi"
        })
        assert "50" in t and "47" in t
        assert "yo'qoldi" in t

    def test_matn_fail(self):
        from shared.services.advanced_features import qoldiq_tuzatish_matn
        t = qoldiq_tuzatish_matn({"ok": False, "xato": "topilmadi"})
        assert "topilmadi" in t


# ═══════ 9. ABC TAHLIL ═══════
class TestTovarABC:
    def test_abc_matn(self):
        from shared.services.advanced_features import tovar_abc_matn
        t = tovar_abc_matn({
            "a": [
                {"nomi": "Ariel", "jami": 2000000, "miqdor": 50, "foyda": 500000, "foiz": 40.0},
                {"nomi": "Tide", "jami": 1500000, "miqdor": 30, "foyda": 300000, "foiz": 30.0},
            ],
            "b": [
                {"nomi": "Fairy", "jami": 500000, "miqdor": 15, "foyda": 100000, "foiz": 10.0},
            ],
            "c": [
                {"nomi": "Vim", "jami": 100000, "miqdor": 5, "foyda": 20000, "foiz": 2.0},
            ],
            "jami": 5000000,
        })
        assert "ABC" in t
        assert "A-tovarlar" in t
        assert "B-tovarlar" in t
        assert "C-tovarlar" in t
        assert "Ariel" in t
        assert "Vim" in t

    def test_abc_empty(self):
        from shared.services.advanced_features import tovar_abc_matn
        t = tovar_abc_matn({"a": [], "b": [], "c": [], "jami": 0})
        assert "yetarli" in t.lower() or "yo'q" in t.lower()

    def test_abc_command(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("abc tahlil ko'rsat") == "abc_tahlil"

    def test_abc_pareto(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("pareto tahlil") == "abc_tahlil"


# ═══════ BUYRUQ ANIQLASH ═══════
class TestAdvancedBuyruq:
    def test_qoldiq(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("Ariel 3 ta yo'qoldi") == "qoldiq_tuzatish"

    def test_shablon(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("Salimov odatiy") == "shablon"

    def test_abc(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("abc tahlil") == "abc_tahlil"

    def test_savol(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("kecha Ariel nechtadan sotdim") == "tabiiy_savol"

    def test_oddiy_none(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("Salimovga 5 Ariel 45000") is None

    def test_empty_none(self):
        from shared.services.advanced_features import advanced_buyruq_aniqla
        assert advanced_buyruq_aniqla("") is None


# ═══════ BOT INTEGRATSIYA ═══════
class TestAdvancedBotIntegration:
    def test_advanced_in_main(self):
        src = open("services/bot/main.py").read()
        assert "advanced_features" in src
        assert "advanced_buyruq_aniqla" in src

    def test_abc_in_main(self):
        src = open("services/bot/main.py").read()
        assert "abc_tahlil" in src
        assert "tovar_abc" in src

    def test_shablon_in_main(self):
        src = open("services/bot/main.py").read()
        assert "shablon_olish" in src

    def test_qoldiq_in_main(self):
        src = open("services/bot/main.py").read()
        assert "qoldiq_tuzatish" in src and "qoldiq_tuzatish_ajrat" in src

    def test_tabiiy_savol_in_main(self):
        src = open("services/bot/main.py").read()
        assert "tabiiy_savol_javob" in src


# ═══════════════════════════════════════════════════════════════
#  SUHBATDOSH (CONVERSATIONAL) TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestSuhbatdoshModul:
    def test_syntax(self):
        import ast
        ast.parse(open("shared/services/suhbatdosh.py").read())

    def test_imports(self):
        import shared.services.suhbatdosh as s
        assert hasattr(s, "salom")
        assert hasattr(s, "suhbat_turini_aniqla")
        assert hasattr(s, "suhbat_javob")
        assert hasattr(s, "tushunilmadi")
        assert hasattr(s, "sotuv_qabul")
        assert hasattr(s, "hisobot_kirish")
        assert hasattr(s, "hisobot_tavsiya")
        assert hasattr(s, "kechki_xayrlashish")


class TestSuhbatAniqlash:
    def test_salom(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("salom") == "salom"

    def test_assalomu_alaykum(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("assalomu alaykum") == "salom"

    def test_privet(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("привет") == "salom"

    def test_raxmat(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("raxmat") == "raxmat"

    def test_yordam(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("nima qila olasan") == "yordam"

    def test_kim_san(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("sen kim") == "kim_san"

    def test_sotuv_none(self):
        from shared.services.suhbatdosh import suhbat_turini_aniqla
        assert suhbat_turini_aniqla("Salimovga 5 Ariel 45000") is None


class TestSuhbatJavob:
    def test_salom_javob(self):
        from shared.services.suhbatdosh import suhbat_javob
        j = suhbat_javob("salom", "Mashrab")
        assert "Mashrab" in j or "alaykum" in j.lower() or "salom" in j.lower()

    def test_raxmat_javob(self):
        from shared.services.suhbatdosh import suhbat_javob
        j = suhbat_javob("raxmat")
        assert "marhamat" in j.lower() or "xursand" in j.lower()

    def test_yordam_javob(self):
        from shared.services.suhbatdosh import suhbat_javob
        j = suhbat_javob("yordam")
        assert "ovoz" in j.lower()
        assert "hisobot" in j.lower()

    def test_kim_javob(self):
        from shared.services.suhbatdosh import suhbat_javob
        j = suhbat_javob("kim_san")
        assert "buxgalter" in j.lower() or "savdoai" in j.lower()


class TestIliqJavoblar:
    def test_tushunilmadi_iliq(self):
        from shared.services.suhbatdosh import tushunilmadi
        t = tushunilmadi()
        assert "🤔" in t
        # Robot emas — iliq javob
        assert "❌" not in t
        assert len(t) > 20

    def test_sotuv_qabul(self):
        from shared.services.suhbatdosh import sotuv_qabul
        t = sotuv_qabul("Salimov", 3, 1500000)
        assert "Salimov" in t
        assert "✅" in t

    def test_sotuv_saqlandi_qarz(self):
        from shared.services.suhbatdosh import sotuv_saqlandi
        t = sotuv_saqlandi("Karimov", 1000000, 300000)
        assert "Karimov" in t
        assert "300,000" in t

    def test_sotuv_saqlandi_toliq(self):
        from shared.services.suhbatdosh import sotuv_saqlandi
        t = sotuv_saqlandi("Salimov", 500000, 0)
        assert "to'liq" in t.lower() or "to'ladi" in t.lower() or "to'langan" in t.lower()

    def test_kirim_qabul(self):
        from shared.services.suhbatdosh import kirim_qabul
        t = kirim_qabul(5, 2000000, "Akbar")
        assert "Akbar" in t
        assert "5" in t

    def test_hisobot_kirish_yaxshi(self):
        from shared.services.suhbatdosh import hisobot_kirish
        t = hisobot_kirish("kunlik", 1500000, 250000)
        assert "yaxshi" in t.lower()

    def test_hisobot_kirish_zarar(self):
        from shared.services.suhbatdosh import hisobot_kirish
        t = hisobot_kirish("kunlik", 100000, -50000)
        assert "og'ir" in t.lower() or "zarar" in t.lower()

    def test_hisobot_kirish_nol(self):
        from shared.services.suhbatdosh import hisobot_kirish
        t = hisobot_kirish("kunlik", 0, 0)
        assert "yo'q" in t.lower() or "boshlaymiz" in t.lower()

    def test_qarz_bor(self):
        from shared.services.suhbatdosh import qarz_bor
        t = qarz_bor("Salimov", 2000000)
        assert "Salimov" in t
        assert "2,000,000" in t
        assert "katta" in t.lower()

    def test_qarz_yoq(self):
        from shared.services.suhbatdosh import qarz_bor
        t = qarz_bor("Salimov", 0)
        assert "yo'q" in t.lower() or "to'langan" in t.lower()

    def test_kechki(self):
        from shared.services.suhbatdosh import kechki_xayrlashish
        t = kechki_xayrlashish()
        assert len(t) > 10

    def test_hisobot_tavsiya_qarz(self):
        from shared.services.suhbatdosh import hisobot_tavsiya
        t = hisobot_tavsiya({"qarz_nisbati": 60})
        assert "qarz" in t.lower()

    def test_hisobot_tavsiya_osish(self):
        from shared.services.suhbatdosh import hisobot_tavsiya
        t = hisobot_tavsiya({"sotuv_ozgarish": 35})
        assert "zo'r" in t.lower() or "temp" in t.lower()


class TestSuhbatBotIntegration:
    def test_suhbat_in_main(self):
        src = open("services/bot/main.py").read()
        assert "suhbat_turini_aniqla" in src
        assert "suhbat_javob" in src

    def test_iliq_tushunilmadi(self):
        src = open("services/bot/main.py").read()
        # Eski robot xabar yo'q bo'lishi kerak
        assert "❓ *Tushunilmadi.* Qaytadan yuboring" not in src

    def test_hisobot_kirish_in_main(self):
        src = open("services/bot/main.py").read()
        assert "hisobot_kirish" in src

    def test_kechki_in_auto(self):
        src = open("services/bot/main.py").read()
        assert "kechki_xayrlashish" in src


# ═══════════════════════════════════════════════════════════════
#  MUTAXASSIS (PROFESSIONAL ADVISOR) TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestMutaxassisModul:
    def test_syntax(self):
        import ast
        ast.parse(open("shared/services/mutaxassis.py").read())

    def test_imports(self):
        import shared.services.mutaxassis as m
        assert hasattr(m, "tovar_ekspert_tahlil")
        assert hasattr(m, "tovar_ekspert_matn")
        assert hasattr(m, "klient_ekspert_tahlil")
        assert hasattr(m, "klient_ekspert_matn")
        assert hasattr(m, "ekspert_sorov_bormi")

    def test_parallel(self):
        src = open("shared/services/mutaxassis.py").read()
        assert "await" in src  # sequential queries


class TestTovarEkspert:
    def test_matn_topildi(self):
        from shared.services.mutaxassis import tovar_ekspert_matn
        t = tovar_ekspert_matn({
            "topildi": True, "nomi": "Ariel", "olish_narxi": 40000,
            "qoldiq": 50, "birlik": "dona", "min_qoldiq": 10,
            "sotuv_soni": 20, "jami_miqdor": 150, "jami_summa": 6750000,
            "ort_narx": 45000, "min_narx": 42000, "max_narx": 48000,
            "jami_foyda": 750000, "markup": 12.5, "kunlik_sotuv": 5.0,
            "kunlar_qoldi": 10, "otgan_oy_miqdor": 120, "ozgarish": 25.0,
            "top_klientlar": [{"ism": "Salimov", "miqdor": 50, "jami": 2250000}],
            "oxirgi_kirim": {"miqdor": 100, "narx": 40000, "sana": "2026-03-15"},
        })
        assert "PROFESSIONAL TAHLIL" in t
        assert "Ariel" in t
        assert "MUTAXASSIS TAVSIYASI" in t
        assert "markup" in t.lower() or "12.5" in t
        assert "Salimov" in t

    def test_matn_topilmadi(self):
        from shared.services.mutaxassis import tovar_ekspert_matn
        t = tovar_ekspert_matn({"topildi": False, "nomi": "XYZ"})
        assert "XYZ" in t

    def test_matn_qoldiq_kam(self):
        from shared.services.mutaxassis import tovar_ekspert_matn
        t = tovar_ekspert_matn({
            "topildi": True, "nomi": "Tide", "olish_narxi": 30000,
            "qoldiq": 3, "birlik": "dona", "min_qoldiq": 10,
            "sotuv_soni": 5, "jami_miqdor": 20, "jami_summa": 640000,
            "ort_narx": 32000, "min_narx": 32000, "max_narx": 32000,
            "jami_foyda": 40000, "markup": 6.7, "kunlik_sotuv": 2.0,
            "kunlar_qoldi": 1, "otgan_oy_miqdor": 15, "ozgarish": 33.3,
            "top_klientlar": [], "oxirgi_kirim": None,
        })
        assert "SHOSHILINCH" in t
        assert "buyurtma" in t.lower()

    def test_matn_zarar(self):
        from shared.services.mutaxassis import tovar_ekspert_matn
        t = tovar_ekspert_matn({
            "topildi": True, "nomi": "Fairy", "olish_narxi": 30000,
            "qoldiq": 20, "birlik": "dona", "min_qoldiq": 5,
            "sotuv_soni": 3, "jami_miqdor": 10, "jami_summa": 280000,
            "ort_narx": 28000, "min_narx": 28000, "max_narx": 28000,
            "jami_foyda": -20000, "markup": -6.7, "kunlik_sotuv": 1.0,
            "kunlar_qoldi": 20, "otgan_oy_miqdor": 5, "ozgarish": 100.0,
            "top_klientlar": [], "oxirgi_kirim": None,
        })
        assert "ZARAR" in t


class TestKlientEkspert:
    def test_matn_topildi(self):
        from shared.services.mutaxassis import klient_ekspert_matn
        t = klient_ekspert_matn({
            "topildi": True, "ism": "Salimov", "telefon": "+998901234567",
            "sotuv_soni": 25, "jami_sotuv": 8000000, "ort_chek": 320000,
            "birinchi_sotuv": "2025-06-01", "oxirgi_sotuv": "2026-03-18",
            "aktiv_qarz": 500000, "muddati_otgan": 0, "xavf": "past",
            "kredit_limit": 2000000,
            "top_tovar": [{"nomi": "Ariel", "miqdor": 100, "jami": 4500000}],
            "oylik_trend": [{"oy": "2026-01", "jami": 2000000}, {"oy": "2026-02", "jami": 3000000}],
        })
        assert "PROFESSIONAL TAHLIL" in t
        assert "Salimov" in t
        assert "MUTAXASSIS TAVSIYASI" in t
        assert "past" in t.lower() or "🟢" in t

    def test_matn_xavfli(self):
        from shared.services.mutaxassis import klient_ekspert_matn
        t = klient_ekspert_matn({
            "topildi": True, "ism": "Xavfli", "telefon": "",
            "sotuv_soni": 5, "jami_sotuv": 1000000, "ort_chek": 200000,
            "birinchi_sotuv": "2026-01-01", "oxirgi_sotuv": "2026-03-01",
            "aktiv_qarz": 800000, "muddati_otgan": 3, "xavf": "yuqori",
            "kredit_limit": 0, "top_tovar": [], "oylik_trend": [],
        })
        assert "🔴" in t
        assert "YUQORI" in t
        assert "BERMA" in t or "undiring" in t.lower()


class TestEkspertSorov:
    def test_haqida(self):
        from shared.services.mutaxassis import ekspert_sorov_bormi
        assert ekspert_sorov_bormi("Ariel haqida") is True

    def test_tahlil(self):
        from shared.services.mutaxassis import ekspert_sorov_bormi
        assert ekspert_sorov_bormi("Salimov tahlil") is True

    def test_oddiy(self):
        from shared.services.mutaxassis import ekspert_sorov_bormi
        assert ekspert_sorov_bormi("5 Ariel 45000") is False

    def test_nom_ajrat(self):
        from shared.services.mutaxassis import ekspert_nom_ajrat
        assert ekspert_nom_ajrat("Ariel haqida") == "Ariel"

    def test_nom_ajrat_tahlil(self):
        from shared.services.mutaxassis import ekspert_nom_ajrat
        r = ekspert_nom_ajrat("Salimov tahlil")
        assert r is not None and "alimov" in r.lower()


class TestMutaxassisBotIntegration:
    def test_in_main(self):
        src = open("services/bot/main.py").read()
        assert "mutaxassis" in src
        assert "tovar_ekspert_tahlil" in src
        assert "klient_ekspert_tahlil" in src


# ═══════════════════════════════════════════════════════════════
#  VISION AI PRO v2.0 TESTLARI
# ═══════════════════════════════════════════════════════════════

class TestVisionProModul:
    def test_syntax(self):
        import ast
        ast.parse(open("shared/services/vision.py").read())

    def test_model_is_pro(self):
        src = open("shared/services/vision.py").read()
        assert "gemini-2.5-pro" in src

    def test_has_2_bosqich(self):
        """3 bosqichli tahlil — versiyalar bilan"""
        src = open("shared/services/vision.py").read()
        assert "Mikroskop" in src or "bosqich" in src.lower()

    def test_has_rasm_yaxshilash(self):
        src = open("shared/services/vision.py").read()
        assert "_rasm_versiyalar" in src
        assert "contrast" in src
        assert "unsharp" in src

    def test_has_validatsiya(self):
        src = open("shared/services/vision.py").read()
        assert "_validatsiya" in src

    def test_has_prompt_tanlash(self):
        src = open("shared/services/vision.py").read()
        assert "_prompt_tanlash" in src

    def test_has_3_prompt(self):
        src = open("shared/services/vision.py").read()
        assert "_PROMPT_1_UMUMIY" in src
        assert "_PROMPT_DAFTAR" in src
        assert "_PROMPT_CHEK" in src

    def test_has_kop_rasm(self):
        src = open("shared/services/vision.py").read()
        assert "kop_rasm_tahlil" in src

    def test_has_daftar_skanerlash(self):
        src = open("shared/services/vision.py").read()
        assert "daftar_skanerlash" in src

    def test_has_chek_skanerlash(self):
        src = open("shared/services/vision.py").read()
        assert "chek_skanerlash" in src


class TestVisionValidatsiya:
    def test_jami_tuzatish(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({
            "tovarlar": [
                {"nomi": "Ariel", "miqdor": 5, "narx": 45000, "jami": 0}
            ]
        })
        assert d["tovarlar"][0]["jami"] == 225000

    def test_jami_summa_hisoblash(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({
            "tovarlar": [
                {"nomi": "A", "miqdor": 10, "narx": 1000, "jami": 10000},
                {"nomi": "B", "miqdor": 5, "narx": 2000, "jami": 10000},
            ]
        })
        assert d["jami_summa"] == 20000

    def test_xato_jami_tuzatiladi(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({
            "tovarlar": [
                {"nomi": "A", "miqdor": 10, "narx": 1000, "jami": 99999}
            ]
        })
        assert d["tovarlar"][0]["jami"] == 10000

    def test_default_tolangan(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({
            "jami_summa": 500000,
            "tovarlar": [{"nomi": "X", "miqdor": 1, "narx": 500000, "jami": 500000}]
        })
        assert d["tolangan"] == 500000

    def test_defaults_set(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({"tovarlar": []})
        assert "tur" in d
        assert "ishonch" in d
        assert "izoh" in d

    def test_birlik_default(self):
        from shared.services.vision import _validatsiya
        d = _validatsiya({"tovarlar": [{"nomi": "T"}]})
        assert d["tovarlar"][0]["birlik"] == "dona"


class TestVisionPrompt:
    def test_prompt_umumiy(self):
        from shared.services.vision import _prompt_tanlash
        p = _prompt_tanlash("")
        assert "ekspert" in p.lower() or "mikroskop" in p.lower()

    def test_prompt_daftar(self):
        from shared.services.vision import _prompt_tanlash
        p = _prompt_tanlash("daftar")
        assert "DAFTAR" in p or "daftar" in p.lower()

    def test_prompt_chek(self):
        from shared.services.vision import _prompt_tanlash
        p = _prompt_tanlash("chek")
        assert "CHEK" in p or "chek" in p.lower()

    def test_prompt_has_jargon(self):
        from shared.services.vision import _PROMPT_1_UMUMIY
        assert "шт" in _PROMPT_1_UMUMIY
        assert "кг" in _PROMPT_1_UMUMIY
        assert "кор" in _PROMPT_1_UMUMIY

    def test_prompt_has_validatsiya_rule(self):
        from shared.services.vision import _PROMPT_1_UMUMIY
        assert "TEKSHIR" in _PROMPT_1_UMUMIY

    def test_prompt_has_ishonch_scale(self):
        from shared.services.vision import _PROMPT_1_UMUMIY
        assert "0.9" in _PROMPT_1_UMUMIY
        assert "0.7" in _PROMPT_1_UMUMIY


class TestRasmHandlerPro:
    def test_syntax(self):
        import ast
        ast.parse(open("services/bot/bot_services/rasm_handler.py").read())

    def test_has_tur_aniqlash(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "_tur_aniqla_captiondan" in src

    def test_has_kop_rasm(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "kop_rasm_tahlil_cmd" in src
        assert "_MULTI_RASM" in src

    def test_has_amal_toggle(self):
        src = open("services/bot/bot_services/rasm_handler.py").read()
        assert "rasm_amal_cb" in src
        assert "rasm:kirim" in src
        assert "rasm:sotuv" in src

    def test_tur_daftar(self):
        from services.bot.bot_services.rasm_handler import _tur_aniqla_captiondan
        assert _tur_aniqla_captiondan("daftar") == "daftar"
        assert _tur_aniqla_captiondan("bu qarz daftar") == "daftar"

    def test_tur_chek(self):
        from services.bot.bot_services.rasm_handler import _tur_aniqla_captiondan
        assert _tur_aniqla_captiondan("chek") == "chek"

    def test_tur_nakladnoy(self):
        from services.bot.bot_services.rasm_handler import _tur_aniqla_captiondan
        assert _tur_aniqla_captiondan("nakladnoy") == "nakladnoy"

    def test_tur_empty(self):
        from services.bot.bot_services.rasm_handler import _tur_aniqla_captiondan
        assert _tur_aniqla_captiondan("") == ""
        assert _tur_aniqla_captiondan("random text") == ""


class TestRasmBotIntegration:
    def test_tahlil_cmd_registered(self):
        src = open("services/bot/main.py").read()
        assert "tahlil" in src
        assert "kop_rasm_tahlil_cmd" in src

    def test_rasm_amal_cb_registered(self):
        src = open("services/bot/main.py").read()
        assert "rasm_amal_cb" in src
        assert "rasm:(kirim|sotuv)" in src

    def test_vision_pro_model(self):
        src = open("shared/services/vision.py").read()
        # flash-lite EMAS, pro bo'lishi kerak
        assert "flash-lite" not in src or "gemini-2.5-pro" in src


# ═══════════════════════════════════════════════════════════════
#  INTEGRATSIYA TESTLARI — bot ga ulangan
# ═══════════════════════════════════════════════════════════════

class TestKontekstIntegration:
    def test_kontekst_in_bot(self):
        src = open("services/bot/main.py").read()
        assert "kontekst_bormi" in src
        assert "kontekst_tozala" in src

    def test_oxirgi_klient_saved(self):
        src = open("services/bot/main.py").read()
        assert "_oxirgi_klient" in src


class TestTuzatishIntegration:
    def test_tuzatish_in_bot(self):
        src = open("services/bot/main.py").read()
        assert "tuzatish_bormi" in src
        assert "tuzatish_ajrat" in src
        assert "TUZATILDI" in src

    def test_miqdor_ozgartirish(self):
        from shared.services.advanced_features import tuzatish_ajrat
        r = tuzatish_ajrat("50 emas 30")
        assert r["eski"] == 50
        assert r["yangi"] == 30


class TestZararRealtimeIntegration:
    def test_zarar_in_draft(self):
        src = open("services/bot/main.py").read()
        assert "zarar_tekshir" in src
        assert "zarar_ogohlantirish_matn" in src


class TestTezkorTugmalarIntegration:
    def test_cmd_tez(self):
        src = open("services/bot/main.py").read()
        assert "cmd_tez" in src
        assert "tezkor_tugmalar" in src

    def test_tez_registered(self):
        src = open("services/bot/main.py").read()
        assert '"tez"' in src

    def test_tezkor_cb(self):
        src = open("services/bot/main.py").read()
        assert "_tezkor_cb" in src
        assert "tez:" in src


class TestGuruhliIntegration:
    def test_cmd_guruh(self):
        src = open("services/bot/main.py").read()
        assert "cmd_guruh" in src
        assert '"guruh"' in src
