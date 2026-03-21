"""
Runtime Integration Tests — v21.5 SAP-GRADE
Real execution tests (no DB, but real Python logic).
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from decimal import Decimal
import pytest


class TestLedgerRuntime:
    """Double-Entry Ledger — real execution."""

    def test_sotuv_balanced(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Salimov", Decimal("2250000"),
                            naqd=Decimal("1750000"), qarz=Decimal("500000"))
        assert je.balanslangan
        assert je.jami_debit == Decimal("2250000")
        assert je.jami_credit == Decimal("2250000")
        assert len(je.qatorlar) == 3  # naqd + qarz + daromad

    def test_sotuv_full_cash(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Test", Decimal("1000000"),
                            naqd=Decimal("1000000"), qarz=Decimal("0"))
        assert je.balanslangan
        assert len(je.qatorlar) == 2  # naqd + daromad (no qarz)

    def test_sotuv_full_debt(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Test", Decimal("500000"),
                            naqd=Decimal("0"), qarz=Decimal("500000"))
        assert je.balanslangan
        assert len(je.qatorlar) == 2  # qarz + daromad

    def test_sotuv_with_tannarx(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Test", Decimal("1000000"),
                            naqd=Decimal("1000000"), tannarx=Decimal("700000"))
        assert je.balanslangan
        # naqd(1M) + tannarx(700k) debit = daromad(1M) + ombor(700k) credit
        assert je.jami_debit == Decimal("1700000")

    def test_kirim_balanced(self):
        from shared.services.ledger import kirim_jurnali
        je = kirim_jurnali(1, "Yetkazuvchi", Decimal("5000000"), 100)
        assert je.balanslangan
        assert je.jami_debit == Decimal("5000000")

    def test_qaytarish_balanced(self):
        from shared.services.ledger import qaytarish_jurnali
        je = qaytarish_jurnali(1, "Salimov", Decimal("135000"))
        assert je.balanslangan

    def test_qarz_tolash_naqd(self):
        from shared.services.ledger import qarz_tolash_jurnali, HisobTuri
        je = qarz_tolash_jurnali(1, "Salimov", Decimal("500000"), "naqd")
        assert je.balanslangan
        assert je.qatorlar[0].hisob == HisobTuri.KASSA_NAQD

    def test_qarz_tolash_karta(self):
        from shared.services.ledger import qarz_tolash_jurnali, HisobTuri
        je = qarz_tolash_jurnali(1, "Test", Decimal("300000"), "karta")
        assert je.balanslangan
        assert je.qatorlar[0].hisob == HisobTuri.KASSA_KARTA

    def test_qarz_tolash_otkazma(self):
        from shared.services.ledger import qarz_tolash_jurnali, HisobTuri
        je = qarz_tolash_jurnali(1, "Test", Decimal("200000"), "otkazma")
        assert je.qatorlar[0].hisob == HisobTuri.KASSA_OTKAZMA

    def test_xarajat_balanced(self):
        from shared.services.ledger import xarajat_jurnali
        je = xarajat_jurnali(1, "Transport", Decimal("300000"))
        assert je.balanslangan

    def test_invalid_journal_rejected(self):
        from shared.services.ledger import JurnalYozuv, JurnalQator, HisobTuri
        je = JurnalYozuv()
        je.qatorlar.append(JurnalQator(hisob=HisobTuri.KASSA_NAQD, debit=Decimal("1000")))
        ok, err = je.validate()
        assert not ok
        assert "Balans xato" in err

    def test_empty_journal_rejected(self):
        from shared.services.ledger import JurnalYozuv
        je = JurnalYozuv()
        ok, err = je.validate()
        assert not ok
        assert "bo'sh" in err

    def test_negative_amount_rejected(self):
        from shared.services.ledger import JurnalQator, HisobTuri
        with pytest.raises(ValueError):
            JurnalQator(hisob=HisobTuri.KASSA_NAQD, debit=Decimal("-100"))

    def test_both_debit_credit_rejected(self):
        from shared.services.ledger import JurnalQator, HisobTuri
        with pytest.raises(ValueError):
            JurnalQator(hisob=HisobTuri.KASSA_NAQD, debit=Decimal("100"), credit=Decimal("50"))

    def test_idempotency_key(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Test", Decimal("100000"), naqd=Decimal("100000"))
        je.idempotency_key = "sotuv_1_999"
        assert je.idempotency_key == "sotuv_1_999"

    def test_to_dict(self):
        from shared.services.ledger import sotuv_jurnali
        je = sotuv_jurnali(1, "Test", Decimal("1000"), naqd=Decimal("1000"))
        d = je.to_dict()
        assert d["balanslangan"] == True
        assert "qatorlar" in d
        assert d["jami_debit"] == "1000"


class TestPipelineRuntime:
    """Pipeline real execution tests."""

    def test_confidence_high(self):
        from shared.services.pipeline import evaluate_confidence
        ai = {"klient":"Salimov","tovarlar":[{"nomi":"Ariel","miqdor":50,"narx":45000,"jami":2250000}],"jami_summa":2250000}
        c = evaluate_confidence(ai, {"klient_topildi": True})
        assert c.overall > 0.8
        assert c.auto_confirmable

    def test_confidence_low(self):
        from shared.services.pipeline import evaluate_confidence
        ai = {"klient":"","tovarlar":[],"jami_summa":0}
        c = evaluate_confidence(ai)
        assert c.should_reject

    def test_math_override(self):
        from shared.services.pipeline import hisob_tekshir_va_tuzat
        ai = {"tovarlar":[{"nomi":"X","miqdor":10,"narx":1000,"jami":99999}],"jami_summa":99999}
        corrected, warnings = hisob_tekshir_va_tuzat(ai)
        assert corrected["jami_summa"] == str(Decimal("10000"))
        assert len(warnings) >= 1

    def test_gramm_conversion(self):
        from shared.services.pipeline import hisob_tekshir_va_tuzat
        ai = {"tovarlar":[{"nomi":"Y","miqdor":500,"narx":80000,"birlik":"gramm","jami":0}],"jami_summa":0}
        c, _ = hisob_tekshir_va_tuzat(ai)
        assert c["tovarlar"][0]["jami"] == str(Decimal("40000"))


class TestVoiceCommandsRuntime:
    """Voice commands real execution."""

    def test_all_actions(self):
        from shared.services.voice_commands import detect_voice_command
        pairs = [
            ("tasdiqla", "confirm"), ("bekor qil", "cancel"), ("tuzat", "correct"),
            ("chek chiqar", "print"), ("bugungi hisobot", "report"),
            ("kassa holati", "kassa"), ("qarzlar", "debt"),
            ("nakladnoy yoz", "document"), ("salom", "greet"),
            ("menyu", "menu"), ("yordam", "help"),
            ("balans tekshir", "balans"), ("pdf chiqar", "export"),
        ]
        for text, exp in pairs:
            cmd = detect_voice_command(text)
            assert cmd is not None, f"'{text}' not detected"
            assert cmd["action"] == exp, f"'{text}' → {cmd['action']}, expected {exp}"

    def test_savdo_goes_to_ai(self):
        from shared.services.voice_commands import detect_voice_command
        assert detect_voice_command("Salimovga 50 Ariel 45000") is None
        assert detect_voice_command("100 ta un kirdi 35000") is None


class TestGuardsRuntime:
    """Safety guards execution."""

    def test_duplicate_first_pass(self):
        from shared.services.guards import is_duplicate_message
        # First time = new message (returns False)
        result = is_duplicate_message(8888, "runtime_test_unique_12345")
        assert result == False  # New message, not duplicate

    def test_duplicate_second_block(self):
        from shared.services.guards import is_duplicate_message
        is_duplicate_message(7777, "duplicate_test_abcdef")
        result = is_duplicate_message(7777, "duplicate_test_abcdef")
        assert result == True  # Second time = blocked


class TestFuzzyRuntime:
    """Fuzzy match execution."""

    def test_exact(self):
        from shared.services.fuzzy_match import similarity
        assert similarity("Ariel", "Ariel") == 1.0

    def test_cyrillic(self):
        from shared.services.fuzzy_match import normalize
        assert normalize("Салимов") == "salimov"

    def test_case_insensitive(self):
        from shared.services.fuzzy_match import similarity
        assert similarity("ARIEL", "ariel") == 1.0


class TestPrintRuntime:
    """Print status lifecycle."""

    def test_full_lifecycle(self):
        from shared.services.print_status import (
            create_print_job, confirm_print, mark_printing,
            mark_printed, PrintStatus
        )
        job = create_print_job(1, "test", "data", 58)
        assert job.status == PrintStatus.PREVIEW
        confirm_print(job.job_id)
        assert job.status == PrintStatus.CONFIRMED
        mark_printing(job.job_id)
        assert job.status == PrintStatus.PRINTING
        mark_printed(job.job_id)
        assert job.status == PrintStatus.PRINTED

    def test_reprint(self):
        from shared.services.print_status import (
            create_print_job, confirm_print, mark_printed,
            request_reprint, PrintStatus
        )
        job = create_print_job(1, "test", "data", 58)
        confirm_print(job.job_id)
        mark_printed(job.job_id)
        new_job = request_reprint(job.job_id)
        assert new_job.reprint_count == 1
        assert new_job.original_job_id == job.job_id


class TestHisobRuntime:
    """Math precision."""

    def test_decimal_precision(self):
        from shared.utils.hisob import D
        assert D("0.1") + D("0.2") == D("0.3")

    def test_narx_hisob(self):
        from shared.utils.hisob import narx_hisob
        assert narx_hisob(50, 45000) == Decimal("2250000")

    def test_sotuv_hisob(self):
        from shared.utils.hisob import sotuv_hisob
        r = sotuv_hisob([{"nomi":"A","miqdor":10,"narx":1000,"birlik":"dona"}])
        assert r["jami_summa"] == Decimal("10000")

    def test_qarz_hisob(self):
        from shared.utils.hisob import qarz_hisob
        r = qarz_hisob(100000, 30000)
        assert r["tolangan"] == Decimal("70000")
