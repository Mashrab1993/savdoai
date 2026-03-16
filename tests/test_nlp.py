"""
Integration testlar — O\'zbek NLP
"""
from decimal import Decimal
import unittest

from shared.utils.uzb_nlp import (
    raqam_parse, miqdor_olish, matn_normallashtir,
    qarz_bor_mi, savdo_turi_olish, emotsional_gap_tekshir
)


class TestRaqamParse(unittest.TestCase):
    def test_birlar(self):
        self.assertEqual(raqam_parse("bir"),    Decimal("1"))
        self.assertEqual(raqam_parse("to\'rt"), Decimal("4"))
        self.assertEqual(raqam_parse("tort"),   Decimal("4"))  # sheva
        self.assertEqual(raqam_parse("toqqiz"), Decimal("9"))  # sheva

    def test_onlar(self):
        self.assertEqual(raqam_parse("o\'n"),    Decimal("10"))
        self.assertEqual(raqam_parse("on"),       Decimal("10"))
        self.assertEqual(raqam_parse("ottiz"),    Decimal("30"))
        self.assertEqual(raqam_parse("qirq besh"),Decimal("45"))
        self.assertEqual(raqam_parse("ellik"),    Decimal("50"))

    def test_katta(self):
        self.assertEqual(raqam_parse("bir ming"),         Decimal("1000"))
        self.assertEqual(raqam_parse("qirq besh ming"),   Decimal("45000"))
        self.assertEqual(raqam_parse("yuz ellik ming"),   Decimal("150000"))
        self.assertEqual(raqam_parse("bir million"),      Decimal("1000000"))

    def test_kasr(self):
        self.assertEqual(raqam_parse("yarim"),      Decimal("0.5"))
        self.assertEqual(raqam_parse("bir yarim"),  Decimal("1.5"))
        self.assertEqual(raqam_parse("yarim ming"), Decimal("500"))

    def test_mahalliy(self):
        self.assertEqual(raqam_parse("2 limon"), Decimal("200000"))


class TestMiqdorOlish(unittest.TestCase):
    def test_dona(self):
        r = miqdor_olish("ellik dona ariel")
        self.assertEqual(r["miqdor"], Decimal("50"))
        self.assertEqual(r["birlik"], "dona")

    def test_gramm(self):
        r = miqdor_olish("to\'rt yuz gramm muzqaymoq")
        self.assertEqual(r["miqdor"], Decimal("400"))
        self.assertEqual(r["birlik"], "gramm")

    def test_yarim_kilo(self):
        r = miqdor_olish("bir yarim kilo go\'sht")
        self.assertEqual(r["miqdor"], Decimal("1.5"))
        self.assertEqual(r["birlik"], "kg")


class TestQarzBormi(unittest.TestCase):
    def test_nasiya(self):  self.assertTrue(qarz_bor_mi("nasiyaga berdi"))
    def test_udum(self):    self.assertTrue(qarz_bor_mi("udumga ketti"))
    def test_kredit(self):  self.assertTrue(qarz_bor_mi("kreditga oldi"))
    def test_yoq(self):     self.assertFalse(qarz_bor_mi("hammasi tolandi"))


class TestSavdoTuri(unittest.TestCase):
    def test_optom(self):   self.assertEqual(savdo_turi_olish("optom sotdim"), "optom")
    def test_chakana(self): self.assertEqual(savdo_turi_olish("chakana berdim"), "chakana")
    def test_noma(self):    self.assertEqual(savdo_turi_olish("sotdim"), "noma\'lum")


if __name__ == "__main__":
    unittest.main(verbosity=2)
