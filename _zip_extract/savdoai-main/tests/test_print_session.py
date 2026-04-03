"""Print session: token, idempotency, width bytes."""
from __future__ import annotations

import os

import pytest


@pytest.fixture(autouse=True)
def _print_secret(monkeypatch):
    monkeypatch.setenv("PRINT_SECRET", "test-print-secret-32-chars-xx")


def test_verify_token_roundtrip():
    from shared.services.print_session import create, verify_token, _escpos_for_width

    s = create(
        uid=999001,
        sid=42,
        dokon="Test",
        escpos_80=b"80bytes",
        escpos_58=b"58",
    )
    assert s.job_id
    assert verify_token(s.job_id, s.token)
    assert not verify_token(s.job_id, "wrong")
    assert _escpos_for_width(s, 80) == b"80bytes"
    assert _escpos_for_width(s, 58) == b"58"


def test_done_blocks_repeat():
    from shared.services import print_session as ps

    s = ps.create(
        uid=999002,
        sid=1,
        escpos_80=b"x",
        escpos_58=b"y",
    )
    assert ps.mark_done(s.job_id)
    assert ps.mark_done(s.job_id)
    assert ps.get(s.job_id).status == "done"


def test_mark_printing_after_failed_allows_retry():
    from shared.services import print_session as ps

    s = ps.create(uid=999003, sid=2, escpos_80=b"a", escpos_58=b"b")
    assert ps.mark_failed(s.job_id, "test")
    assert ps.mark_printing(s.job_id)
    assert ps.get(s.job_id).status == "printing"


def test_print_intent_phrases():
    from shared.services.print_intent import detect_print_intent

    assert detect_print_intent("printer chek") == "print"
    assert detect_print_intent("qayta chek") == "reprint"
    assert detect_print_intent("oxirgi chek") == "reprint"
    assert detect_print_intent("bugungi hisobot") is None
