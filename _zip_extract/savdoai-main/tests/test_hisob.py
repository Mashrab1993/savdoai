"""
Integration testlar — Hisob-kitob moduli
"""
from decimal import Decimal
import unittest

from shared.utils.hisob import (
    narx_hisob, qarz_hisob, jami_qarz_hisob,
    qaytarish_hisob, foyda_hisob, ai_hisob_tekshir,
    sotuv_validatsiya, kirim_validatsiya,
    qarz_to_lash_hisob, sotuv_hisob, D
)


class TestNarxHisob(unittest.TestCase):
    def test_dona(self):
        self.assertEqual(narx_hisob(50, 45000), D("2250000"))

    def test_gramm(self):
        self.assertEqual(narx_hisob(350, 45000, "gramm"), D("15750"))

    def test_chegirma_10(self):
        self.assertEqual(narx_hisob(50, 45000, "dona", 10), D("2025000"))

    def test_nol_miqdor(self):
        self.assertEqual(narx_hisob(0, 45000), D("0"))

    def test_manfiy_narx(self):
        self.assertEqual(narx_hisob(10, -1000), D("0"))

    def test_bir_yarim_kilo(self):
        self.assertEqual(narx_hisob(1500, 45000, "gramm"), D("67500"))


class TestQarzHisob(unittest.TestCase):
    def test_oddiy(self):
        r = qarz_hisob(10_000_000, 6_000_000)
        self.assertEqual(r["jami_summa"], D("10000000"))
        self.assertEqual(r["qarz"],       D("6000000"))
        self.assertEqual(r["tolangan"],   D("4000000"))
        self.assertEqual(r["tolangan"] + r["qarz"], r["jami_summa"])

    def test_qarz_jamidan_katta(self):
        r = qarz_hisob(1_000_000, 2_000_000)
        self.assertEqual(r["qarz"],     D("1000000"))
        self.assertEqual(r["tolangan"], D("0"))

    def test_jami_qarz(self):
        j = jami_qarz_hisob(
            10_000_000, 6_000_000,
            [{"klient_ismi": "Salimov", "qolgan": 2_000_000}]
        )
        self.assertEqual(j["yangi_qarz"],  D("6000000"))
        self.assertEqual(j["eski_qarz"],   D("2000000"))
        self.assertEqual(j["jami_qarz"],   D("8000000"))


class TestQaytarishHisob(unittest.TestCase):
    def test_oddiy(self):
        r = qaytarish_hisob(200, 50, 5, 45000, "dona")
        self.assertEqual(r["qaytarildi"], D("5"))
        self.assertEqual(r["summa"],      D("225000"))
        self.assertEqual(r["qolgan"],     D("145"))
        self.assertIsNone(r["xato"])

    def test_ortiqcha(self):
        r = qaytarish_hisob(50, 45, 10, 45000)
        self.assertEqual(r["qaytarildi"], D("5"))

    def test_hamma_qaytarilgan(self):
        r = qaytarish_hisob(50, 50, 5, 45000)
        self.assertEqual(r["qaytarildi"], D("0"))
        self.assertIsNotNone(r["xato"])


class TestFoydaHisob(unittest.TestCase):
    def test_foyda(self):
        f = foyda_hisob(50000, 40000, 100)
        self.assertEqual(D(str(f["foyda"])), D("1000000"))
        self.assertFalse(f["zararli"])

    def test_zarar(self):
        f = foyda_hisob(40000, 50000, 10)
        self.assertTrue(f["zararli"])
        self.assertEqual(D(str(f["foyda"])), D("-100000"))


class TestValidatsiya(unittest.TestCase):
    def test_togri_kirim(self):
        ok, _ = kirim_validatsiya({
            "tovar_nomi": "Ariel", "miqdor": 50, "narx": 45000
        })
        self.assertTrue(ok)

    def test_bosh_nom(self):
        ok, _ = kirim_validatsiya({
            "tovar_nomi": "", "miqdor": 50, "narx": 45000
        })
        self.assertFalse(ok)

    def test_qarz_jamidan_katta(self):
        ok, _ = sotuv_validatsiya({
            "tovarlar": [{"nomi": "A", "miqdor": 1}],
            "jami_summa": 1000, "qarz": 2000
        })
        self.assertFalse(ok)


class TestAIHisob(unittest.TestCase):
    def test_xato_jami_tuzatish(self):
        ai = ai_hisob_tekshir({
            "tovarlar": [{"nomi": "A", "miqdor": 50, "birlik": "dona",
                          "narx": 45000, "jami": 9_999_999}],
            "jami_summa": 9_999_999, "qarz": 0
        })
        self.assertEqual(D(str(ai["tovarlar"][0]["jami"])), D("2250000"))
        self.assertEqual(D(str(ai["jami_summa"])), D("2250000"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
