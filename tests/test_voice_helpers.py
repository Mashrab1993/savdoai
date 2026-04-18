"""
Tests for shared/services/voice_helpers.py — word-boundary + negation.

Hamma false-positive scenariyolarni qoplaydi.
"""
from __future__ import annotations

import pytest

from shared.services.voice_helpers import (
    _any_word,
    _has_negation_near,
    _safe_intent_match,
    extract_numbers,
)


# ═══════════════════════════════════════════════════════════
# _any_word — word-boundary matching
# ═══════════════════════════════════════════════════════════

class TestAnyWord:
    def test_exact_match(self):
        assert _any_word("kirim keldi", ["kirim"])

    def test_phrase_match(self):
        assert _any_word("yangi klient qo'sh", ["klient qo'sh"])

    def test_substring_rejected(self):
        """'kirim' 'shokirim' ichida bo'lsa ham MATCH QILMASIN."""
        assert not _any_word("shokirim qancha?", ["kirim"])

    def test_suffix_allowed(self):
        """'tasdiqla' 'tasdiqlamayman' ichida prefix — MATCH (negation alohida tutadi)."""
        # Prefix ruxsat etiladi — negation _safe_intent_match'da tekshiriladi
        assert _any_word("tasdiqlamayman", ["tasdiqla"])

    def test_empty_input(self):
        assert not _any_word("", ["a", "b"])
        assert not _any_word("salom", [])
        assert not _any_word("salom", [""])

    def test_multiple_keywords(self):
        keywords = ["salom", "xayr", "rahmat"]
        assert _any_word("salom rahmat!", keywords)
        assert not _any_word("hello world", keywords)

    def test_case_insensitive(self):
        assert _any_word("KIRIM keldi", ["kirim"])
        assert _any_word("Kirim KELDI", ["KELDI"])

    def test_apostrophe_keyword(self):
        """O'zbekcha apostrof — ASCII tarzida keyword."""
        assert _any_word("klient qo'shing", ["qo'sh"])


# ═══════════════════════════════════════════════════════════
# _has_negation_near — negation detection
# ═══════════════════════════════════════════════════════════

class TestNegation:
    def test_qilmay(self):
        assert _has_negation_near("bekor qilmay davom et", "bekor qil")

    def test_emas(self):
        assert _has_negation_near("kerak emas", "kerak")

    def test_yoq(self):
        assert _has_negation_near("yo'q tasdiq kerak", "tasdiq")

    def test_no_negation(self):
        assert not _has_negation_near("bekor qil", "bekor qil")
        assert not _has_negation_near("tasdiqla", "tasdiqla")

    def test_far_negation(self):
        """Negation keyword'dan uzoqda bo'lsa — ignore qilinsin."""
        long_text = "bekor qil. " + "a" * 100 + " emas"
        # 'emas' 100+ belgi uzoqda — window=20 ichida emas
        assert not _has_negation_near(long_text, "bekor qil", window=20)


# ═══════════════════════════════════════════════════════════
# _safe_intent_match — birlashgan himoya
# ═══════════════════════════════════════════════════════════

class TestSafeIntentMatch:
    def test_positive(self):
        assert _safe_intent_match("bekor qil", ["bekor qil"])
        assert _safe_intent_match("iltimos bekor qiling", ["bekor qil"])

    def test_negation_blocks(self):
        assert not _safe_intent_match("bekor qilmay", ["bekor qil"])
        assert not _safe_intent_match("tasdiqlamayman", ["tasdiqla"])

    def test_substring_blocks(self):
        assert not _safe_intent_match("shokirim", ["kirim"])

    def test_combined(self):
        """Ham word-boundary, ham negation tekshirish."""
        assert _safe_intent_match("ariel 100 dona keldi", ["keldi"])
        assert not _safe_intent_match("kelmay qoldi", ["keldi"])


# ═══════════════════════════════════════════════════════════
# extract_numbers
# ═══════════════════════════════════════════════════════════

class TestExtractNumbers:
    def test_simple(self):
        assert extract_numbers("45000 so'm") == [45000.0]

    def test_ming(self):
        assert extract_numbers("50 ming") == [50000.0]
        assert extract_numbers("2.5 ming") == [2500.0]

    def test_mln(self):
        assert extract_numbers("2.5 mln") == [2500000.0]
        assert extract_numbers("1 mln") == [1000000.0]

    def test_space_separated(self):
        """'45 000' → 45000."""
        assert extract_numbers("45 000 so'm") == [45000.0]

    def test_multiple(self):
        result = extract_numbers("Ariel 50 ming, 100 dona")
        assert 50000.0 in result
        assert 100.0 in result

    def test_empty(self):
        assert extract_numbers("") == []
        assert extract_numbers("salom") == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
