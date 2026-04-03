"""ESC/POS encoding: CP866 + code page, not raw UTF-8."""
from __future__ import annotations


def test_escpos_not_utf8_raw():
    from shared.services.escpos_xprinter import printer_encoding_self_test_bytes, esc_select_code_page

    b = printer_encoding_self_test_bytes(width=48, do_cut=False)
    assert b"\x1b\x74" in b  # ESC t (code page)
    assert b"TEST CHEK" in b
    assert not b.startswith(b"\xef\xbb\xbf")  # not UTF-8 BOM
    assert esc_select_code_page(17) == b"\x1b\x74\x11"


def test_sotuv_cheki_cp866_encodable():
    from shared.services.escpos_xprinter import sotuv_cheki

    raw = sotuv_cheki(
        {
            "tovarlar": [{"nomi": "Test", "miqdor": 1, "narx": 1000, "jami": 1000, "birlik": "dona"}],
            "jami_summa": 1000,
            "amal": "chiqim",
            "sessiya_id": 1,
        },
        dokon="DO KON",
        width=80,
        do_cut=False,
        do_beep=False,
    )
    assert raw.startswith(b"\x1b\x40")  # INIT
    assert b"JAMI" in raw
