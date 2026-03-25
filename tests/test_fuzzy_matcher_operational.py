"""Operational-word guards — STT tokenlari tovar nomiga noto'g'ri fuzzy ulanmasin."""
from __future__ import annotations

import time

import pytest

from services.bot.bot_services.fuzzy_matcher import (
    FuzzyMatcher,
    operational_token_blocks_product_fuzzy,
)


@pytest.fixture
def fm_with_products():
    fm = FuzzyMatcher()
    uid = 4242
    fm._cache[uid] = (
        time.time(),
        ["Chelsi", "Doloks", "Yubileyniy", "Eskora"],
        [],
        {},
    )
    return fm, uid


def test_cheki_does_not_match_chelsi(fm_with_products):
    """Production bug: 'cheki' fuzzy 73% → Chelsi; must not match."""
    fm, uid = fm_with_products
    assert fm.match_product("cheki", uid) is None


def test_chelsi_typo_still_resolves(fm_with_products):
    fm, uid = fm_with_products
    assert fm.match_product("chelsi", uid) == "Chelsi"


def test_kirim_cheki_line_preserves_ops_and_products(fm_with_products):
    fm, uid = fm_with_products
    st = (
        "Nasriddin akaga kirim cheki 10 ta Doloks 68000 10 ta Yubileyniy 96000 "
        "10 ta Eskora 100000"
    )
    out = fm.fix_text(st, uid)
    assert "cheki" in out.lower()
    assert "Chelsi" not in out
    assert "Doloks" in out
    assert "Yubileyniy" in out
    assert "Eskora" in out


def test_doloks_misspelling_still_fuzzy(fm_with_products):
    fm, uid = fm_with_products
    assert fm.match_product("doloks", uid) == "Doloks"


def test_operational_exact_blocks_even_high_product_score():
    assert operational_token_blocks_product_fuzzy("cheki", 95) is True


def test_real_product_not_blocked_when_far_from_ops(fm_with_products):
    fm, uid = fm_with_products
    assert operational_token_blocks_product_fuzzy("doloks", 88) is False


def test_kirim_never_matches_product_named_kirim():
    """Operatsion 'kirim' ustun turadi (agar DB da shunday tovar bo'lsa ham)."""
    fm = FuzzyMatcher()
    uid = 1
    fm._cache[uid] = (time.time(), ["Kirim", "Doloks"], [], {})
    assert fm.match_product("kirim", uid) is None
