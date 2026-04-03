"""
Yangi v25.3.2 featurelar testlari:
- Barcode handler
- Ertalab hisobot
- AI narx tavsiya
- Mini-do'kon (buyurtmalar)
"""
import os
import sys
import ast
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))


# ════════════════════════════════════════════════════
#  BARCODE
# ════════════════════════════════════════════════════

class TestBarcodeHandler:
    def test_module_exists(self):
        assert (REPO / "services" / "bot" / "handlers" / "barcode.py").exists()

    def test_imports(self):
        from services.bot.handlers.barcode import (
            cmd_barcode, barcode_rasm_qabul, barcode_cb,
        )
        assert callable(cmd_barcode)
        assert callable(barcode_rasm_qabul)
        assert callable(barcode_cb)

    def test_decode_function_exists(self):
        from services.bot.handlers.barcode import _decode_barcode
        assert callable(_decode_barcode)

    def test_db_function_exists(self):
        from services.bot.handlers.barcode import _tovar_barcode_bilan
        assert callable(_tovar_barcode_bilan)

    def test_migration_exists(self):
        mig = REPO / "shared" / "migrations" / "versions" / "009_v25_3_barcode.sql"
        assert mig.exists()
        sql = mig.read_text(encoding="utf-8")
        assert "barcode" in sql
        assert "ALTER TABLE" in sql or "ADD COLUMN" in sql

    def test_registered_in_main(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "cmd_barcode" in src
        assert "barcode_cb" in src
        assert 'pattern=r"^bc:"' in src


# ════════════════════════════════════════════════════
#  ERTALAB HISOBOT
# ════════════════════════════════════════════════════

class TestErtalabHisobot:
    def test_function_exists(self):
        from services.bot.handlers.jobs import avto_ertalab_hisobot
        assert callable(avto_ertalab_hisobot)

    def test_helper_functions(self):
        from services.bot.handlers.jobs import (
            _muddati_otgan_qarzlar, _kam_qoldiq_tovarlar, _ertalab_matn,
        )
        assert callable(_muddati_otgan_qarzlar)
        assert callable(_kam_qoldiq_tovarlar)
        assert callable(_ertalab_matn)

    def test_ertalab_matn_format(self):
        from services.bot.handlers.jobs import _ertalab_matn

        d = {"sotuv_soni": 5, "jami_sotuv": 1500000, "kirim_soni": 2,
             "jami_kirim": 500000, "foyda": 300000}
        qarzlar = [{"klient_ismi": "Anvar", "qoldiq": 100000}]
        kam = [{"nomi": "Krossovka", "qoldiq": 3, "min_qoldiq": 10, "birlik": "dona"}]

        matn = _ertalab_matn(d, qarzlar, kam, "Mashrab")
        assert "Xayrli tong" in matn
        assert "Mashrab" in matn
        assert "Sotuv: 5 ta" in matn
        assert "Muddati o'tgan" in matn
        assert "Kam qoldiq" in matn
        assert "Krossovka" in matn

    def test_ertalab_matn_empty(self):
        from services.bot.handlers.jobs import _ertalab_matn
        d = {"sotuv_soni": 0, "kirim_soni": 0}
        matn = _ertalab_matn(d, [], [], "")
        assert "Xayrli tong" in matn
        assert "omad" in matn

    def test_scheduler_registered(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "avto_ertalab_hisobot" in src
        assert "ertalab_hisobot" in src


# ════════════════════════════════════════════════════
#  AI NARX TAVSIYA
# ════════════════════════════════════════════════════

class TestAINarxTavsiya:
    def test_module_exists(self):
        assert (REPO / "shared" / "services" / "ai_narx_tavsiya.py").exists()

    def test_imports(self):
        from shared.services.ai_narx_tavsiya import narx_tavsiyalar
        assert callable(narx_tavsiyalar)

    def test_yaxlitlash(self):
        from shared.services.ai_narx_tavsiya import _yaxlitla
        from decimal import Decimal

        assert _yaxlitla(Decimal("45500")) == Decimal("46000")
        assert _yaxlitla(Decimal("44400")) == Decimal("44000")
        assert _yaxlitla(Decimal("100000")) == Decimal("100000")
        assert _yaxlitla(Decimal("0")) == Decimal("0")

    def test_cmd_exists(self):
        from services.bot.handlers.commands import cmd_narx_tavsiya
        assert callable(cmd_narx_tavsiya)

    def test_registered_in_main(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "cmd_narx_tavsiya" in src
        assert '"narx_tavsiya"' in src


# ════════════════════════════════════════════════════
#  MINI-DO'KON
# ════════════════════════════════════════════════════

class TestMiniDokon:
    def test_migration_exists(self):
        mig = REPO / "shared" / "migrations" / "versions" / "010_v25_3_buyurtmalar.sql"
        assert mig.exists()
        sql = mig.read_text(encoding="utf-8")
        assert "buyurtmalar" in sql
        assert "buyurtma_tovarlar" in sql
        assert "enable_rls" in sql

    def test_cmd_dokon_exists(self):
        from services.bot.handlers.commands import cmd_dokon
        assert callable(cmd_dokon)

    def test_registered_in_main(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "cmd_dokon" in src
        assert '"dokon"' in src


# ════════════════════════════════════════════════════
#  UMUMIY
# ════════════════════════════════════════════════════

class TestNewFeaturesSyntax:
    """Barcha yangi fayllar sintaksis tekshiruvi."""

    NEW_FILES = [
        "services/bot/handlers/barcode.py",
        "shared/services/ai_narx_tavsiya.py",
        "shared/migrations/versions/009_v25_3_barcode.sql",
        "shared/migrations/versions/010_v25_3_buyurtmalar.sql",
    ]

    def test_all_new_files_exist(self):
        for f in self.NEW_FILES:
            assert (REPO / f).exists(), f"{f} yo'q!"

    def test_python_files_parse(self):
        for f in self.NEW_FILES:
            if f.endswith(".py"):
                source = (REPO / f).read_text(encoding="utf-8")
                try:
                    ast.parse(source)
                except SyntaxError as e:
                    pytest.fail(f"{f}: L{e.lineno} {e.msg}")

    def test_main_py_under_950(self):
        lines = len((REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8").split("\n"))
        assert lines < 950, f"main.py {lines} qator — 950 dan kam kutilgan"


# ════════════════════════════════════════════════════
#  v25.3.3 YANGI FEATURELAR
# ════════════════════════════════════════════════════

class TestKlientCRM:
    def test_module_exists(self):
        assert (REPO / "shared" / "services" / "klient_crm.py").exists()

    def test_imports(self):
        from shared.services.klient_crm import (
            klient_profil, klient_tarix, klient_izoh_yangilash,
            bugungi_tugilgan_kunlar, klient_statistika_yangilash,
        )
        assert callable(klient_profil)
        assert callable(klient_tarix)

    def test_cmd_crm_exists(self):
        from services.bot.handlers.commands import cmd_crm
        assert callable(cmd_crm)

    def test_registered_in_main(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "cmd_crm" in src
        assert '"crm"' in src


class TestChegirmaTizimi:
    def test_module_exists(self):
        assert (REPO / "shared" / "services" / "chegirma.py").exists()

    def test_imports(self):
        from shared.services.chegirma import (
            chegirma_hisoblash, chegirma_qoidalar_olish,
            chegirma_qoida_yaratish,
        )
        assert callable(chegirma_hisoblash)

    def test_cmd_exists(self):
        from services.bot.handlers.commands import cmd_chegirma
        assert callable(cmd_chegirma)

    def test_migration_exists(self):
        mig = REPO / "shared" / "migrations" / "versions" / "011_v25_3_crm_chegirma.sql"
        assert mig.exists()
        sql = mig.read_text(encoding="utf-8")
        assert "chegirma_qoidalar" in sql
        assert "enable_rls" in sql


class TestMoliyaviyPrognoz:
    def test_module_exists(self):
        assert (REPO / "shared" / "services" / "moliyaviy_prognoz.py").exists()

    def test_imports(self):
        from shared.services.moliyaviy_prognoz import moliyaviy_prognoz
        assert callable(moliyaviy_prognoz)

    def test_trend_prognoz(self):
        from shared.services.moliyaviy_prognoz import _trend_prognoz
        oylar = [
            {"sotuv": 1000000, "foyda": 300000, "xarajat": 100000},
            {"sotuv": 1200000, "foyda": 360000, "xarajat": 110000},
            {"sotuv": 1500000, "foyda": 450000, "xarajat": 120000},
        ]
        p = _trend_prognoz(oylar)
        assert p["sotuv"] > 0
        assert p["foyda"] > 0
        assert p["osish_foiz"] > 0  # o'smoqda

    def test_tavsiyalar(self):
        from shared.services.moliyaviy_prognoz import _tavsiyalar
        oylar = [{"sotuv": 1000000, "foyda": 100000, "xarajat": 50000}]
        prognoz = {"osish_foiz": 15}
        tavs = _tavsiyalar(oylar, prognoz)
        assert len(tavs) > 0

    def test_cmd_exists(self):
        from services.bot.handlers.commands import cmd_prognoz
        assert callable(cmd_prognoz)


class TestRaqobatMonitoring:
    def test_module_exists(self):
        assert (REPO / "shared" / "services" / "raqobat_monitoring.py").exists()

    def test_imports(self):
        from shared.services.raqobat_monitoring import (
            raqobat_narx_qoshish, raqobat_tahlil, raqobat_xulosa,
        )
        assert callable(raqobat_narx_qoshish)
        assert callable(raqobat_tahlil)

    def test_cmd_exists(self):
        from services.bot.handlers.commands import cmd_raqobat
        assert callable(cmd_raqobat)

    def test_migration_has_raqobat(self):
        mig = REPO / "shared" / "migrations" / "versions" / "011_v25_3_crm_chegirma.sql"
        sql = mig.read_text(encoding="utf-8")
        assert "raqobat_narxlar" in sql


class TestTugilganKunHisobot:
    def test_function_exists(self):
        from services.bot.handlers.jobs import _bugungi_tugilgan_kun
        assert callable(_bugungi_tugilgan_kun)

    def test_ertalab_matn_with_birthday(self):
        from services.bot.handlers.jobs import _ertalab_matn
        d = {"sotuv_soni": 3, "jami_sotuv": 500000, "kirim_soni": 0, "foyda": 100000}
        tugilgan = [{"ism": "Anvar", "telefon": "+998901234567"}]
        matn = _ertalab_matn(d, [], [], "Test", tugilgan)
        assert "tug'ilgan kun" in matn.lower() or "🎂" in matn
        assert "Anvar" in matn
