"""Production verification: thermal layout, encoding, ESC/POS, no PDF-first routing."""
from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _assert_width(text: str, w: int) -> None:
    for i, line in enumerate(text.splitlines(), 1):
        assert len(line) <= w, f"line {i} len={len(line)}: {line!r}"


class TestThermalAlignment:
    def test_money_column_stable_80mm(self):
        from shared.services.thermal_receipt import THERMAL_CHARS, _lr_money, format_thermal_receipt

        w = THERMAL_CHARS[80]
        r = _lr_money("     99 dona x 1 234 567", "3 703 701", w)
        assert len(r) == w
        assert r.endswith("3 703 701")

    def test_long_name_wrap_does_not_break_numeric_row(self):
        from shared.services.thermal_receipt import format_thermal_receipt

        data = {
            "amal": "chiqim",
            "tovarlar": [
                {
                    "nomi": "X" * 120,
                    "miqdor": 2,
                    "birlik": "dona",
                    "narx": 1000,
                    "jami": 2000,
                },
            ],
            "jami_summa": 2000,
        }
        t = format_thermal_receipt(data, "D", 80)
        _assert_width(t, 48)
        assert "2 dona x 1 000" in t
        assert "2 000" in t
        assert "JAMI" in t

    def test_grand_total_dominant_block(self):
        from shared.services.thermal_receipt import format_thermal_receipt

        t = format_thermal_receipt(
            {"tovarlar": [], "jami_summa": 999_999_999},
            "Z",
            80,
        )
        assert "JAMI" in t
        assert "999 999 999" in t
        assert t.count("=" * 48) >= 2

    def test_separators_full_width(self):
        from shared.services.thermal_receipt import format_thermal_receipt

        t = format_thermal_receipt({"tovarlar": [{"nomi": "A", "miqdor": 1, "narx": 1, "jami": 1}], "jami_summa": 1}, "D", 80)
        for line in t.splitlines():
            if set(line.strip()) <= {"="} and line.strip():
                assert len(line) == 48
            if set(line.strip()) <= {"-"} and line.strip():
                assert len(line) == 48


class TestThermalSafe:
    def test_replaces_em_dash(self):
        from shared.services.thermal_receipt import thermal_safe_text

        assert "—" not in thermal_safe_text("a—b")
        assert thermal_safe_text("a—b") == "a-b"

    def test_uzbek_apostrophe_preserved(self):
        from shared.services.thermal_receipt import thermal_safe_text

        assert "o'" in thermal_safe_text("bo'lak")
        s = thermal_safe_text("O'zbekiston")
        assert "'" in s

    def test_cyrillic_preserved(self):
        from shared.services.thermal_receipt import thermal_safe_text, format_thermal_receipt

        t = thermal_safe_text("Кефир")
        assert "К" in t
        body = format_thermal_receipt(
            {
                "tovarlar": [{"nomi": "Молоко 3.2%", "miqdor": 1, "narx": 100, "jami": 100}],
                "jami_summa": 100,
            },
            "Магазин",
            80,
        )
        assert "Молоко" in body or "Магазин" in body


class TestEscpos:
    def test_bold_markers_item_and_jami(self):
        from shared.services.thermal_receipt import _line_bold_escpos, THERMAL_CHARS

        w = THERMAL_CHARS[80]
        assert _line_bold_escpos(" 1. Product", w) is True
        assert _line_bold_escpos("JAMI                                100 so'm", w) is True
        assert _line_bold_escpos("=" * 48, w) is True
        assert _line_bold_escpos("     2 dona x 100                  200", w) is False

    def test_escpos_roundtrip_contains_init(self):
        from shared.services.thermal_receipt import thermal_receipt_escpos_utf8

        b = thermal_receipt_escpos_utf8(
            {"tovarlar": [{"nomi": "A", "miqdor": 1, "narx": 1, "jami": 1}], "jami_summa": 1},
            "S",
            80,
        )
        assert b.startswith(b"\x1b\x40")


class TestMiniPrinterPathUsesThermalModule:
    def test_output_adapter_imports_thermal_not_pdf_for_txt(self):
        import inspect

        from shared.receipt import output

        src = inspect.getsource(output.thermal_txt_and_payload)
        assert "thermal_receipt_utf8_bytes" in src
        assert "chek_pdf" not in src

    def test_main_chek_flow_source(self):
        src = (ROOT / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "thermal_txt_and_payload" in src
        assert "pdf_xizmat.chek_pdf" in src


class TestProductionSample:
    def test_production_verification_samples_width(self):
        from shared.services.thermal_receipt import production_verification_samples, THERMAL_CHARS

        samples = production_verification_samples(80)
        w = THERMAL_CHARS[80]
        for name, txt in samples.items():
            _assert_width(txt, w)
            assert "Chek #" in txt
            assert "Кефир" in txt or "К" in txt
