"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — END-TO-END FLOW TESTLAR                      ║
║  Real foydalanuvchi yo'llarini simulyatsiya                     ║
║                                                                  ║
║  FLOW 1: Sotuv → Loyalty → KPI → Notification                  ║
║  FLOW 2: Ovoz → Cognitive → Parse → Validate                   ║
║  FLOW 3: Klient → Segment → CLV → Advisor                      ║
║  FLOW 4: Tovar → Forecast → Ombor → Supplier                   ║
║  FLOW 5: To'lov → Webhook → DB                                 ║
║  FLOW 6: Subscription → Limit → Upgrade                        ║
║  FLOW 7: GPS → KPI → Marshrut                                  ║
║  FLOW 8: NLP → 8 sheva + Tojik                                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
import pytest
import sys
from decimal import Decimal
from pathlib import Path

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))


class TestFlow1_Sotuv_Loyalty_KPI:
    """FLOW 1: Sotuv qilindi → loyalty ball → KPI yangilandi → notification."""

    def test_step1_sotuv_summadan_loyalty_ball(self):
        """Sotuv summasi → loyalty ball hisob."""
        from shared.services.loyalty import ball_hisoblash, daraja_aniqla
        summa = 2_500_000  # 2.5M sotuv
        ball = ball_hisoblash(summa)
        assert ball == 2500
        daraja = daraja_aniqla(ball)
        assert daraja["nomi"] == "Platinum"
        assert daraja["chegirma_foiz"] == 10

    def test_step2_loyalty_daraja_chegirma(self):
        """Platinum klient → 10% chegirma keyingi sotuvda."""
        from shared.utils.hisob import narx_hisob
        # Keyingi sotuv 10% chegirma bilan
        jami = narx_hisob(100, 50000, "dona", 10)
        assert jami == Decimal("4500000")  # 5M - 10%

    def test_step3_kpi_badge_tekshirish(self):
        """KPI badge tizimida loyalty badge bor."""
        from shared.services.kpi_engine import BADGES
        assert len(BADGES) >= 8
        # Har bir badge da emoji bor
        for key, b in BADGES.items():
            assert "emoji" in b

    def test_step4_notification_format(self):
        """Notification matni to'g'ri formatlanadi."""
        from shared.services.ai_advisor import insight_formatlash
        ins = [{"turi": "opportunity", "emoji": "⭐",
                "sarlavha": "Loyalty Platinum", "tavsif": "Yangi VIP",
                "tavsiya": "Maxsus taklif yuboring"}]
        matn = insight_formatlash(ins)
        assert "Loyalty" in matn
        assert len(matn) < 4096  # Telegram limit


class TestFlow2_Ovoz_Cognitive:
    """FLOW 2: Ovoz buyruq → voice detection → cognitive parse."""

    def test_step1_voice_detect(self):
        from shared.services.voice_commands import detect_voice_command
        # Oddiy buyruqlar
        assert detect_voice_command("bugungi hisobot")["action"] == "report"
        assert detect_voice_command("kpi ko'rsat")["action"] == "kpi"
        assert detect_voice_command("qarz eslatma")["action"] == "reminder"

    def test_step2_voice_yangi_buyruqlar(self):
        from shared.services.voice_commands import detect_voice_command
        assert detect_voice_command("prognoz")["action"] == "forecast"
        assert detect_voice_command("klient qiymati")["action"] == "clv"
        assert detect_voice_command("tahlil")["action"] == "advisor"
        assert detect_voice_command("marshrut")["action"] == "gps"
        assert detect_voice_command("tarif")["action"] == "subscription"

    def test_step3_voice_none(self):
        from shared.services.voice_commands import detect_voice_command
        # Sotuv matni — voice command EMAS
        assert detect_voice_command("Salimovga 50 Ariel ketti") is None

    def test_step4_cognitive_tools(self):
        from services.cognitive.engine import TOOLS, tool_chaqir
        # Narx hisob
        r = tool_chaqir("narx_hisob", {"miqdor": 50, "narx": 45000})
        assert r["jami"] == 2_250_000
        # Loyalty hisob
        r2 = tool_chaqir("loyalty_hisob", {"summa": 1000000})
        assert r2["ball"] == 1000
        assert r2["daraja"] == "Gold"

    def test_step5_nlp_murakkab(self):
        """Murakkab O'zbek matnini NLP parse qiladi."""
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse("o'ttiz besh ming") == Decimal("35000")
        assert raqam_parse("1 limon") == Decimal("100000")
        assert raqam_parse("yarim kilo") == Decimal("0.5")


class TestFlow3_Klient_Segment_CLV:
    """FLOW 3: Klient → RFM Segment → CLV → AI Advisor tavsiya."""

    def test_step1_rfm_segmentatsiya(self):
        from shared.services.klient_segment import rfm_segment
        # Eng yaxshi klient
        assert rfm_segment(2, 30, 20_000_000) == "champion"
        # Yo'qolgan klient
        assert rfm_segment(100, 0, 0) == "lost"
        # Yangi klient
        assert rfm_segment(5, 1, 50000) == "new"

    def test_step2_segment_matn(self):
        from shared.services.klient_segment import segmentatsiya_matn
        data = {
            "xulosa": {
                "champion": {"nomi": "Champion", "emoji": "👑", "soni": 5, "foiz": 25.0},
                "lost": {"nomi": "Lost", "emoji": "❌", "soni": 2, "foiz": 10.0},
            },
            "jami": 20,
        }
        matn = segmentatsiya_matn(data)
        assert "Champion" in matn
        assert "20" in matn

    def test_step3_clv_format(self):
        from shared.services.klient_clv import clv_matn
        data = {
            "klientlar": [
                {"id": 1, "ism": "VIP Klient", "telefon": "+998",
                 "jami_tushum": 10_000_000, "sotuv_soni": 50,
                 "ortacha_chek": 200000, "oylik_chastota": 8.0,
                 "oxirgi_kun": 2, "clv": 57_600_000,
                 "status": "faol", "status_emoji": "🟢",
                 "faol_qarz": 0},
            ],
            "jami_clv": 57_600_000,
            "ortacha_clv": 57_600_000,
            "top_klient": None,
        }
        matn = clv_matn(data)
        assert "VIP Klient" in matn
        assert "57,600,000" in matn

    def test_step4_advisor_insight(self):
        from shared.services.ai_advisor import insight_formatlash
        # Xavfda bo'lgan qimmat klient → critical insight
        ins = [{"turi": "warning", "emoji": "👤",
                "sarlavha": "VIP yo'qolmoqda",
                "tavsif": "30 kundan beri yo'q",
                "tavsiya": "Maxsus taklif yuboring"}]
        matn = insight_formatlash(ins)
        assert "🟡" in matn  # warning = sariq


class TestFlow4_Tovar_Forecast_Supplier:
    """FLOW 4: Tovar → Demand Forecast → Ombor alert → Supplier buyurtma."""

    def test_step1_forecast_format(self):
        from shared.services.demand_forecast import prognoz_matn
        data = [
            {"nomi": "Ariel 3kg", "qoldiq": 3, "kunlik_sotuv": 5,
             "prognoz_kunlar": 7, "prognoz_talab": 35, "qolgan_kun": 0.6,
             "trend": 1.2, "trend_yonalish": "📈",
             "buyurtma_tavsiya": 67, "buyurtma_narx": 2_680_000,
             "xavf": "critical", "xavf_emoji": "🔴", "faol_kunlar": 28},
            {"nomi": "Tide 1.5kg", "qoldiq": 50, "kunlik_sotuv": 2,
             "prognoz_kunlar": 7, "prognoz_talab": 14, "qolgan_kun": 25,
             "trend": 0.95, "trend_yonalish": "➡️",
             "buyurtma_tavsiya": 0, "buyurtma_narx": 0,
             "xavf": "safe", "xavf_emoji": "🟢", "faol_kunlar": 20},
        ]
        matn = prognoz_matn(data, 7)
        assert "TEZDA" in matn
        assert "Ariel" in matn
        assert "2,680,000" in matn
        assert "yetarli" in matn  # 1 safe tovar

    def test_step2_ombor_prognoz_import(self):
        from shared.services.ombor_prognoz import ombor_prognoz
        import inspect
        assert inspect.iscoroutinefunction(ombor_prognoz)

    def test_step3_supplier_import(self):
        from shared.services.supplier_order import avtomatik_buyurtma_tayyorla, supplier_xabar_matni
        import inspect
        assert inspect.iscoroutinefunction(avtomatik_buyurtma_tayyorla)


class TestFlow5_Tolov_Webhook:
    """FLOW 5: Click/Payme webhook → parse → status."""

    def test_click_full_flow(self):
        from shared.services.tolov_integratsiya import ClickProvider, TolovHolat
        p = ClickProvider()
        # Prepare
        r1 = p.webhook_parse({"action": 0, "error": 0, "click_trans_id": "TX1", "amount": "150000"})
        assert r1.holat == TolovHolat.JARAYONDA
        assert r1.tranzaksiya_id == "TX1"
        # Complete
        r2 = p.webhook_parse({"action": 1, "error": 0, "click_trans_id": "TX1", "amount": "150000"})
        assert r2.holat == TolovHolat.TOLANGAN
        assert r2.summa == Decimal("150000")
        # Error
        r3 = p.webhook_parse({"action": 1, "error": -5, "click_trans_id": "TX1", "amount": "150000"})
        assert r3.holat == TolovHolat.XATO

    def test_payme_full_flow(self):
        from shared.services.tolov_integratsiya import PaymeProvider, TolovHolat
        p = PaymeProvider()
        # Create
        r1 = p.webhook_parse({"method": "CreateTransaction",
            "params": {"id": "P1", "amount": 50_000_00, "account": {"order_id": "O1"}}})
        assert r1.holat == TolovHolat.JARAYONDA
        # Perform
        r2 = p.webhook_parse({"method": "PerformTransaction",
            "params": {"id": "P1", "amount": 50_000_00, "account": {"order_id": "O1"}}})
        assert r2.holat == TolovHolat.TOLANGAN
        # Cancel
        r3 = p.webhook_parse({"method": "CancelTransaction",
            "params": {"id": "P1", "amount": 50_000_00, "account": {}}})
        assert r3.holat == TolovHolat.QAYTARILDI


class TestFlow6_Subscription:
    """FLOW 6: Tarif → limit → upgrade yo'li."""

    def test_boshlangich_limitlar(self):
        from shared.services.subscription import TARIFLAR, limit_tekshir
        t = TARIFLAR["boshlangich"]
        # 50 tovar limit
        info = {"sinov": False, "limitlar": {"tovar": t["tovar_limit"]},
                "ishlatilgan": {"tovar": 51}}
        assert limit_tekshir(info, "tovar") is False

    def test_sinov_cheksiz(self):
        from shared.services.subscription import limit_tekshir
        info = {"sinov": True, "limitlar": {"tovar": 50},
                "ishlatilgan": {"tovar": 99999}}
        assert limit_tekshir(info, "tovar") is True

    def test_upgrade_path(self):
        from shared.services.subscription import TARIFLAR
        b = TARIFLAR["boshlangich"]
        o = TARIFLAR["orta"]
        bz = TARIFLAR["biznes"]
        # Narx oshib boradi
        assert b["narx_oylik"] < o["narx_oylik"] < bz["narx_oylik"]
        # Limit oshib boradi
        assert b["tovar_limit"] < o["tovar_limit"] < bz["tovar_limit"]
        # Funksiyalar oshib boradi
        assert not b["kpi"] and o["kpi"] and bz["kpi"]
        assert not b["gps"] and not o["gps"] and bz["gps"]

    def test_tariflar_matn(self):
        from shared.services.subscription import tariflar_taqqos_matni
        m = tariflar_taqqos_matni()
        assert "BEPUL" in m
        assert "49,000" in m
        assert "149,000" in m


class TestFlow7_GPS_KPI:
    """FLOW 7: GPS location → marshrut → KPI."""

    def test_haversine_aniqlik(self):
        from shared.services.gps_tracking import haversine
        # Toshkent ichida — 1 daraja ≈ 111 km
        d = haversine(41.0, 69.0, 42.0, 69.0)
        assert 110 < d < 112

    def test_gps_import(self):
        from shared.services.gps_tracking import gps_saqlash, kunlik_marshrut
        import inspect
        assert inspect.iscoroutinefunction(gps_saqlash)
        assert inspect.iscoroutinefunction(kunlik_marshrut)


class TestFlow8_NLP_8Sheva_Tojik:
    """FLOW 8: O'zbek 8 sheva + Tojik tili NLP."""

    def test_standart_raqamlar(self):
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse("bir") == Decimal("1")
        assert raqam_parse("o'n") == Decimal("10")
        assert raqam_parse("yuz") == Decimal("100")
        assert raqam_parse("ming") == Decimal("1000")

    def test_murakkab_raqamlar(self):
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse("o'ttiz besh") == Decimal("35")
        assert raqam_parse("ikki yuz ellik") == Decimal("250")

    def test_limon_pul(self):
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse("1 limon") == Decimal("100000")
        assert raqam_parse("3 limon") == Decimal("300000")

    def test_kasr(self):
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse("yarim") == Decimal("0.5")
        assert raqam_parse("0.5") == Decimal("0.5")

    def test_sheva_normalizatsiya(self):
        from shared.utils.uzb_nlp import matn_normallashtir
        # Xorazm
        m = matn_normallashtir("kansha pul berasan")
        assert "qancha" in m
        # Farg'ona
        m2 = matn_normallashtir("nema gap")
        assert "nima" in m2

    def test_qarz_sozlari(self):
        from shared.utils.uzb_nlp import qarz_bor_mi
        assert qarz_bor_mi("nasiyaga berdi") is True
        assert qarz_bor_mi("qarzga ketti") is True
        assert qarz_bor_mi("naqd oldi") is False

    def test_tojik_raqamlar(self):
        from shared.utils.uzb_nlp import matn_normallashtir
        # Tojik Cyrillic → grafik_norm → Latin → SHEVA pattern
        m = matn_normallashtir("як")
        assert "bir" in m
        m2 = matn_normallashtir("сад")
        assert "yuz" in m2
        m3 = matn_normallashtir("ҳазор")
        assert "ming" in m3

    def test_tojik_amallar(self):
        from shared.utils.uzb_nlp import matn_normallashtir
        m = matn_normallashtir("фурохт")
        assert "sotdi" in m
        m2 = matn_normallashtir("овардам")
        assert "keltirdim" in m2


class TestFlow9_API_Routes:
    """FLOW 9: API route modullari — barcha endpointlar mavjud."""

    def test_yangi_routes_kpi(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/kpi" in p for p in paths)

    def test_yangi_routes_loyalty(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/loyalty" in p for p in paths)

    def test_yangi_routes_advisor(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/advisor" in p for p in paths)

    def test_yangi_routes_forecast(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/forecast" in p for p in paths)

    def test_yangi_routes_clv(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/clv" in p for p in paths)

    def test_yangi_routes_segment(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/segment" in p for p in paths)

    def test_yangi_routes_tarif(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/tarif" in p for p in paths)

    def test_yangi_routes_oylik(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/oylik" in p for p in paths)


class TestFlow10_Schema_Integrity:
    """FLOW 10: Schema to'liqligi — jadval, index, RLS."""

    def test_yangi_jadvallar(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        kerakli = ["qarz_eslatmalar", "loyalty_ballar", "tolov_tranzaksiyalar",
                    "kpi_targetlar", "filiallar", "gps_log",
                    "yetkazib_beruvchilar", "supplier_buyurtmalar"]
        for j in kerakli:
            assert j in sql, f"{j} schema da yo'q!"

    def test_42_jadval(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        tables = re.findall(r"CREATE TABLE IF NOT EXISTS\s+\w+", sql)
        assert len(tables) >= 42

    def test_57_index(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        indexes = re.findall(r"CREATE.*INDEX IF NOT EXISTS", sql)
        assert len(indexes) >= 57

    def test_16_migration(self):
        import glob
        migs = glob.glob(str(REPO / "shared" / "migrations" / "versions" / "*.sql"))
        assert len(migs) >= 16
