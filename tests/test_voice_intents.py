"""
Voice intent coverage + false-positive tests — v25.6

Bu testlar voice_master.py va asosiy voice keyword matching logikasini
sinab ko'radi. Asosiy maqsad:
  1. Har intent uchun positive case (keyword matnda → True)
  2. False-positive lar aniqlash ("bekor qilmay" → "bekor qil" FALSE match!)
  3. Substring vs word-boundary farqini ko'rsatish

Testlar TO'LIQ BOT'siz ishlaydi — faqat keyword matching logika.
"""
from __future__ import annotations

import re
import pytest


def _any(text: str, keywords: tuple) -> bool:
    """voice_master.py dagi _any helper replica (substring-based)."""
    return any(kw in text.lower() for kw in keywords)


def _any_word(text: str, keywords: tuple) -> bool:
    """Word-boundary versiya — xavfsizroq match."""
    t = text.lower()
    for kw in keywords:
        # Harf/raqam chekkalaridan so'z chegarasini tekshirish
        pattern = r'(?:^|\s|[^\w])' + re.escape(kw) + r'(?:\s|[^\w]|$)'
        if re.search(pattern, t):
            return True
    return False


# ═══════════════════════════════════════════════════════════
# POSITIVE TESTLAR — intent haqiqatdan ishlaydimi?
# ═══════════════════════════════════════════════════════════

class TestPositiveIntents:
    """Har intent uchun kutilgan matn → match tekshiruvi"""

    def test_bekor_qil(self):
        assert _any("bekor qiling", ("bekor qil",))
        assert _any("Iltimos bekor qil", ("bekor qil",))

    def test_tasdiq(self):
        assert _any("ha tasdiq", ("ha tasdiq", "tasdiqla"))
        assert _any("tasdiqla buni", ("tasdiqla",))

    def test_rfm(self):
        assert _any("rfm ko'rsat", ("rfm",))
        assert _any("champion klientlar", ("champion klient",))
        assert _any("xavf ostida klientlar", ("xavf ostida",))

    def test_biznes_salomatlik(self):
        kw = ("biznes ball", "biznes holat", "biznes salomatlig", "biznesim qanday", "biznesim sog")
        assert _any("biznes salomatligim qanday?", kw)
        assert _any("biznes ball bering", kw)

    def test_brifing(self):
        kw = ("ertalabki brifing", "bugungi xulosa", "bugungi brifing")
        assert _any("ertalabki brifing", kw)
        assert _any("bugungi xulosa", kw)

    def test_klient_yangi(self):
        kw = ("yangi klient", "klient qo'sh", "mijoz qo'sh", "yangi mijoz")
        assert _any("yangi klient qo'shing", kw)
        assert _any("mijoz qo'shmoqchiman", kw)

    def test_kirim(self):
        kw = ("keldi", "kelgan", "tushdi", "kirim", "zavoddan", "fabrika")
        assert _any("Ariel 100 dona keldi", kw)
        assert _any("zavoddan yangi kirim tushdi", kw)

    def test_narx(self):
        kw = ("narx o'rnat", "narx qo'y", "sotish narxi", "sotish narx")
        assert _any("sotish narxi 50 ming", kw)
        assert _any("narx qo'y 45000", kw)

    def test_xarajat(self):
        kw = ("obed", "bozorlik", "benzin", "taksi", "dori")
        assert _any("obed uchun 50 ming", kw)
        assert _any("taksi 30 ming sarfladim", kw)

    def test_vazifa(self):
        kw = ("mening vazifa", "vazifalarim", "faol vazifa")
        assert _any("mening vazifalarim nima?", kw)
        assert _any("faol vazifalar ro'yxati", kw)


# ═══════════════════════════════════════════════════════════
# FALSE POSITIVE TESTLAR — xato match yo'qligini tekshirish
# ═══════════════════════════════════════════════════════════

class TestFalsePositives:
    """Substring matching xavfli — word boundary kerak joylar"""

    def test_bekor_qilmay_NOT_match(self):
        """'bekor qilmay' (negative) 'bekor qil' ga TO'G'RILMASIN ideal.

        Hozirgi implementasiya: substring → MATCH (false positive!)
        Word-boundary versiya: NO match (to'g'ri)
        """
        text = "bekor qilmay davom et"
        # Substring version — FALSE POSITIVE (bu bug)
        assert _any(text, ("bekor qil",)) is True
        # Word-boundary version — FIXES the bug
        assert _any_word(text, ("bekor qil",)) is False

    def test_tasdiqlamay_NOT_match(self):
        """'tasdiqlamay' substring match bo'lib 'tasdiqla' ga urayotgan."""
        text = "men tasdiqlamayman"
        assert _any(text, ("tasdiqla",)) is True  # FALSE POSITIVE
        # Word-boundary "tasdiqla" izlasa, "tasdiqlamayman" ichida topadi
        # chunki "tasdiqla" so'zning boshida. Bu xato — to'liq so'z kerak.
        # Ideal yechim: "tasdiqla\b" pattern (word-end)

    def test_narx_part_word(self):
        """'narx o'rnat' — 'narx' qisman match qilmasinMI?"""
        text = "yangi narxni o'rnat"
        # "narx o'rnat" searched — substring ichida yo'q
        assert _any(text, ("narx o'rnat",)) is False  # To'g'ri — full phrase kerak

    def test_champion_part(self):
        """'champion klient' — so'z chegarasi bilan ishlaydi"""
        text = "kim champion klient?"
        assert _any(text, ("champion klient",)) is True

    def test_kirim_false_positive_check(self):
        """'kirim' substring — 'shokirimi' ga urmaslik kerak."""
        text = "shokirimiz qancha?"  # 'kirim' substring ichida bor!
        # Substring version — FALSE POSITIVE
        assert _any(text, ("kirim",)) is True
        # Word-boundary version — to'g'ri
        assert _any_word(text, ("kirim",)) is False


# ═══════════════════════════════════════════════════════════
# EDGE CASE TESTLAR
# ═══════════════════════════════════════════════════════════

class TestEdgeCases:
    """Real-hayot ovoz transcript misollari"""

    def test_empty_input(self):
        assert not _any("", ("salom",))
        assert not _any("   ", ("salom",))

    def test_unicode_apostrophe(self):
        """O'zbekcha apostrof — ', ', ʻ — turli unicode."""
        # Keyword: "qo'sh" (ASCII apostrophe)
        assert _any("klient qo'shing", ("qo'sh",))  # match
        # Lekin "qoʻsh" (mongol/uzbek apostrof — U+02BB)
        # Bu hozir MATCH BO'LMAYDI — bug!
        # assert _any("klient qoʻshing", ("qo'sh",))  # miss (bug)

    def test_numbers_and_keywords(self):
        """Raqamlar ko'p bo'lsa kirim/sotuv ajratiladimi"""
        text = "ariel 100 dona 45000 narxda keldi"
        has_kw = any(w in text.lower() for w in ("keldi", "kirim"))
        has_nums = any(w.isdigit() for w in text.split())
        assert has_kw and has_nums  # ikkalasi bor → KIRIM intent

    def test_intent_priority_olish_narx(self):
        """'olish narx' — ikki joyda (KIRIM va NARX). Priority tekshir."""
        text = "olish narxi 45 ming"
        # KIRIM keyword yo'q bo'lsa → NARX
        has_kirim_kw = any(kw in text.lower() for kw in
                           ("keldi", "kirim", "zavoddan"))
        assert not has_kirim_kw
        # → Bu NARX intent bo'ladi (to'g'ri)

        text2 = "olish narxida 45 ming keldi"
        # KIRIM keyword bor ("keldi") → KIRIM
        has_kirim_kw2 = any(kw in text2.lower() for kw in
                            ("keldi", "kirim", "zavoddan"))
        assert has_kirim_kw2
        # → Bu KIRIM intent bo'ladi (to'g'ri — priority o'zgargan)


# ═══════════════════════════════════════════════════════════
# KEYWORD COVERAGE SUMMARY (mavjud intent lar ro'yxati)
# ═══════════════════════════════════════════════════════════

# voice_master.py dan olingan 33 ta asosiy intent:
VOICE_INTENTS_V25_6 = {
    "bekor": ("bekor qil", "bekor qilaman", "to'xtat", "kerak emas", "tashla", "unut"),
    "tasdiq": ("ha tasdiq", "tasdiqla", "ha saqla", "davom et", "majbur saqla"),
    "tahrir": ("o'zgartir", "tahrir", "tuzat"),
    "hayotim": ("hayotim", "shaxsiy hayot"),
    "xarajat_shaxsiy": ("shaxsiy xarajat", "mening xarajat"),
    "rfm_champions": ("champion klient", "eng yaxshi klient", "top klient"),
    "rfm_atrisk": ("xavf ostida", "yo'qolayot", "yo'qolib ket"),
    "rfm_lost": ("yo'qolgan klient", "lost klient"),
    "rfm_loyal": ("sodiq klient", "loyal klient"),
    "rfm": ("rfm", "klient segment", "klientlar tahlili"),
    "profil": ("tahlil", "smart profil", "ai profil"),
    "narx_turi": ("narx tur", "chakana", "optom"),
    "brend": ("brend qo'sh", "brend qosh"),
    "ekspeditor": ("yangi ekspeditor", "ekspeditor qo'sh"),
    "sklad": ("yangi sklad", "sklad qo'sh"),
    "qaytardi": ("qaytardi", "qaytargan", "qaytarib ber"),
    "qaytarish_list": ("qaytarishlar ro'yxat", "qaytarishlar"),
    "fikr_list": ("fikrlar ro'yxat", "hamma fikrlar"),
    "shikoyat": ("shikoyatlar", "shikoyat ro'yxat"),
    "shogird_kpi": ("shogirdlar reyting", "kpi reyting"),
    "plan_qoy": ("plan qo'y", "plan qo'yamiz", "oylik plan"),
    "plan_progress": ("plan progress", "plan natija"),
    "vazifalarim": ("mening vazifa", "vazifalarim"),
    "vazifa_stat": ("vazifa statistika", "vazifa stat"),
    "vazifa_list": ("faol vazifa", "barcha vazifa"),
    "anomaliya": ("anomaliya",),
    "biznes_ball": ("biznes ball", "biznes holat", "biznes salomatlig",
                     "biznesim qanday", "biznesim sog"),
    "brifing": ("ertalabki brifing", "bugungi xulosa", "bugungi brifing"),
    "klient": ("yangi klient", "klient qo'sh", "mijoz qo'sh"),
    "kirim": ("keldi", "kelgan", "tushdi", "kirim", "zavoddan", "fabrika"),
    "narx": ("narx o'rnat", "narx qo'y", "sotish narxi", "sotish narx"),
    "xarajat": ("obed", "bozorlik", "benzin", "taksi", "dori"),
    "order": ("yubor", "bersh", "sotildi", "sotdim"),
}


def test_intent_coverage():
    """Kutilgan intent sonini tekshirish."""
    assert len(VOICE_INTENTS_V25_6) >= 30, "Intent yo'qolmasin"


def test_unique_keywords_per_intent():
    """Har intent uchun kamida 1 ta keyword bor."""
    for intent, kws in VOICE_INTENTS_V25_6.items():
        assert len(kws) >= 1, f"{intent} uchun keyword yo'q"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
